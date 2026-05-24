package cn.edu.qvtu.service.impl;

import cn.edu.qvtu.dao.*;
import cn.edu.qvtu.entity.*;
import cn.edu.qvtu.service.ManageService;
import cn.edu.qvtu.util.PasswordUtil;
import cn.edu.qvtu.util.ResponseEntity;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.text.SimpleDateFormat;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 后台管理服务实现类
 */
@Service
public class ManageServiceImpl implements ManageService {

    private static final Logger log = LoggerFactory.getLogger(ManageServiceImpl.class);

    @Autowired
    private UserDao userDao;

    @Autowired
    private RoomDao roomDao;

    @Autowired
    private ChessboardDao chessboardDao;

    @Autowired
    private ViewerDao viewerDao;

    @Autowired
    private ScoreLogDao scoreLogDao;

    @Autowired
    private AdminDao adminDao;

    @Autowired
    private AdminLoginLogDao adminLoginLogDao;

    // ============ 用户管理 ============

    @Override
    public ResponseEntity<Map<String, Object>> getUserList(String username, String nickname, Integer status,
              Date startTime, Date endTime, Integer page, Integer size) {
        try {
            if (page == null || page < 1) {
                page = 1;
            }
            if (size == null || size < 1) {
                size = 10;
            }
            int offset = (page - 1) * size;

            List<User> userList = userDao.selectUsersByCondition(username, nickname, status, startTime, endTime);

            int total = userList.size();
            int totalPages = (int) Math.ceil((double) total / size);
            int fromIndex = Math.min(offset, total);
            int toIndex = Math.min(offset + size, total);
            List<User> pageData = userList.subList(fromIndex, toIndex);

            Map<String, Object> result = new HashMap<>();
            result.put("list", pageData);
            result.put("total", total);
            result.put("page", page);
            result.put("size", size);
            result.put("totalPages", totalPages);

            return ResponseEntity.success("查询成功", result);

        } catch (Exception e) {
            log.error("操作失败: {}", e.getMessage(), e);
            return ResponseEntity.error("查询用户列表失败: " + e.getMessage());
        }
    }

    @Override
    public ResponseEntity<User> getUserById(Integer userId) {
        try {
            if (userId == null) {
                return ResponseEntity.error("用户ID不能为空");
            }

            User user = userDao.selectById(userId);
            if (user == null) {
                return ResponseEntity.error("用户不存在");
            }

            user.setPassword("");

            return ResponseEntity.success("查询成功", user);

        } catch (Exception e) {
            return ResponseEntity.error("查询用户信息失败: " + e.getMessage());
        }
    }

    @Override
    public ResponseEntity<Integer> addUser(User user) {
        try {
            if (StringUtils.isEmpty(user.getUsername())) {
                return ResponseEntity.error("用户名不能为空");
            }
            if (StringUtils.isEmpty(user.getPassword())) {
                return ResponseEntity.error("密码不能为空");
            }

            User existingUser = userDao.selectByUsername(user.getUsername());
            if (existingUser != null) {
                return ResponseEntity.error("用户名已存在");
            }

            if (StringUtils.isEmpty(user.getNickname())) {
                user.setNickname(user.getUsername());
            }
            if (user.getScore() == null) {
                user.setScore(0);
            }
            if (user.getStatus() == null) {
                user.setStatus(1);
            }

            String encryptedPassword = PasswordUtil.ensurePasswordEncrypted(user.getPassword());
            user.setPassword(encryptedPassword);

            int result = userDao.insert(user);
            if (result != 1) {
                return ResponseEntity.error("添加用户失败");
            }

            return ResponseEntity.success("添加用户成功", user.getId());
        } catch (Exception e) {
            return ResponseEntity.error("添加用户时发生错误: " + e.getMessage());
        }
    }

    @Override
    @Transactional
    public ResponseEntity<Boolean> updateUser(User user) {
        try {
            if (user == null || user.getId() == null) {
                return ResponseEntity.error("用户信息不完整");
            }

            User existingUser = userDao.selectById(user.getId());
            if (existingUser == null) {
                return ResponseEntity.error("用户不存在");
            }

            boolean hasUpdate = false;

            User updateData = new User();
            updateData.setId(user.getId());

            if (StringUtils.hasText(user.getNickname())) {
                updateData.setNickname(user.getNickname());
                hasUpdate = true;
                log.info("更新用户昵称: " + user.getNickname());
            }

            if (user.getScore() != null && !user.getScore().equals(existingUser.getScore())) {
                int changeScore = user.getScore() - existingUser.getScore();

                ScoreLog scoreLog = new ScoreLog();
                scoreLog.setUserId(user.getId());
                scoreLog.setChangeScore(changeScore);
                scoreLog.setReason("管理员调整积分");
                scoreLog.setCreateTime(new Date());
                scoreLogDao.insert(scoreLog);

                log.info("积分变更记录：用户ID=" + user.getId() + ", 变更积分=" + changeScore + ", 新积分=" + user.getScore());

                updateData.setScore(user.getScore());
                hasUpdate = true;
                log.info("更新用户分数: " + user.getScore());
            }

            if (user.getStatus() != null) {
                updateData.setStatus(user.getStatus());
                hasUpdate = true;
                log.info("更新用户状态: " + user.getStatus());
            }

            if (StringUtils.hasText(user.getPassword())) {
                existingUser.setPassword(PasswordUtil.ensurePasswordEncrypted(user.getPassword()));
                userDao.updatePassword(existingUser);
                hasUpdate = true;
                log.info("更新用户密码");
            }

            if (hasUpdate) {
                if (!StringUtils.hasText(user.getPassword())) {
                    int result = userDao.updateUserInfo(updateData);
                    if (result != 1) {
                        return ResponseEntity.error("更新用户信息失败");
                    }
                }
            } else {
                return ResponseEntity.error("没有要更新的字段");
            }

            return ResponseEntity.success("更新用户成功", true);

        } catch (Exception e) {
            log.error("操作失败: {}", e.getMessage(), e);
            return ResponseEntity.error("更新用户失败: " + e.getMessage());
        }
    }

    @Override
    @Transactional
    public ResponseEntity<Boolean> deleteUser(Integer userId) {
        try {
            if (userId == null) {
                return ResponseEntity.error("用户ID不能为空");
            }

            User user = userDao.selectById(userId);
            if (user == null) {
                return ResponseEntity.error("用户不存在");
            }

            userDao.updateStatus(userId, 0);

            return ResponseEntity.success("用户已禁用", true);

        } catch (Exception e) {
            return ResponseEntity.error("删除用户失败: " + e.getMessage());
        }
    }

    @Override
    public ResponseEntity<Map<String, Object>> getUserDetail(Integer userId) {
        try {
            if (userId == null) {
                return ResponseEntity.error("用户ID不能为空");
            }

            User user = userDao.selectById(userId);
            if (user == null) {
                return ResponseEntity.error("用户不存在");
            }
            user.setPassword("");

            List<Room> roomList = roomDao.selectRoomsByUserId(userId);

            List<Viewer> viewList = new ArrayList<>();

            List<ScoreLog> scoreLogList = scoreLogDao.selectByUserId(userId);

            Map<String, Object> result = new HashMap<>();
            result.put("userInfo", user);
            result.put("roomList", formatRoomList(roomList));
            result.put("viewList", formatViewerList(viewList));
            result.put("scoreLogList", scoreLogList);

            return ResponseEntity.success("查询成功", result);

        } catch (Exception e) {
            log.error("操作失败: {}", e.getMessage(), e);
            return ResponseEntity.error("查询用户详情失败: " + e.getMessage());
        }
    }

    // ============ 对战管理 ============

    @Override
    public ResponseEntity<Map<String, Object>> getRoomList(String roomId, String playerName, Integer status, Date startTime,
              Date endTime, Integer page, Integer size) {
        try {
            if (page == null || page < 1) {
                page = 1;
            }
            if (size == null || size < 1) {
                size = 10;
            }
            int offset = (page - 1) * size;

            // 根据玩家名称查找用户ID
            Integer player1Id = null;
            Integer player2Id = null;
            if (StringUtils.hasText(playerName)) {
                List<User> matchedUsers = userDao.selectUsersByCondition(playerName, playerName, null, null, null);
                if (matchedUsers.isEmpty()) {
                    Map<String, Object> result = new HashMap<>();
                    result.put("list", new ArrayList<>());
                    result.put("total", 0);
                    result.put("page", page);
                    result.put("size", size);
                    result.put("totalPages", 0);
                    return ResponseEntity.success("查询成功", result);
                }
                Integer userId = matchedUsers.get(0).getId();
                player1Id = userId;
                player2Id = userId;
            }

            // 查询房间列表
            List<Room> roomList = roomDao.selectRoomsByCondition(roomId, player1Id, player2Id, status, null, startTime, endTime);

            // 分页处理
            int total = roomList.size();
            int totalPages = (int) Math.ceil((double) total / size);
            int fromIndex = Math.min(offset, total);
            int toIndex = Math.min(offset + size, total);
            List<Room> pageData = roomList.subList(fromIndex, toIndex);

            Map<String, Object> result = new HashMap<>();
            result.put("list", formatRoomList(pageData));
            result.put("total", total);
            result.put("page", page);
            result.put("size", size);
            result.put("totalPages", totalPages);

            return ResponseEntity.success("查询成功", result);

        } catch (Exception e) {
            log.error("操作失败: {}", e.getMessage(), e);
            return ResponseEntity.error("查询房间列表失败: " + e.getMessage());
        }
    }

    @Override
    @Transactional
    public ResponseEntity<Boolean> deleteRoom(String roomId) {
        try {
            if (!StringUtils.hasText(roomId)) {
                return ResponseEntity.error("房间号不能为空");
            }

            Room room = roomDao.selectByRoomId(roomId);
            if (room == null) {
                return ResponseEntity.error("房间不存在");
            }

            chessboardDao.deleteByRoomId(roomId);
            viewerDao.deleteByRoomId(roomId);
            roomDao.deleteByRoomId(roomId);

            return ResponseEntity.success("删除房间成功", true);
        } catch (Exception e) {
            log.error("删除房间失败: {}", e.getMessage(), e);
            return ResponseEntity.error("删除房间失败: " + e.getMessage());
        }
    }

    @Override
    public ResponseEntity<Map<String, Object>> getRoomDetail(String roomId) {
        try {
            if (!StringUtils.hasText(roomId)) {
                return ResponseEntity.error("房间号不能为空");
            }

            Room room = roomDao.selectByRoomId(roomId);
            if (room == null) {
                return ResponseEntity.error("房间不存在");
            }

            User player1 = null;
            User player2 = null;
            if (room.getPlayer1Id() != null) {
                player1 = userDao.selectById(room.getPlayer1Id());
            }
            if (room.getPlayer2Id() != null) {
                player2 = userDao.selectById(room.getPlayer2Id());
            }

            List<Chessboard> chessboardList = chessboardDao.selectByRoomId(roomId);

            List<Viewer> viewerList = viewerDao.selectByRoomId(roomId);
            List<Map<String, Object>> formattedViewers = viewerList.stream()
                .map(viewer -> {
                    Map<String, Object> viewerInfo = new HashMap<>();
                    User viewerUser = userDao.selectById(viewer.getUserId());
                    viewerInfo.put("viewerId", viewer.getUserId());
                    viewerInfo.put("viewerName", viewerUser != null ? viewerUser.getNickname() : "未知用户");
                    viewerInfo.put("viewTime", viewer.getJoinTime());
                    return viewerInfo;
                })
                .collect(Collectors.toList());

            Map<String, Object> result = new HashMap<>();

            Map<String, Object> roomInfo = new HashMap<>();
            roomInfo.put("roomId", room.getRoomId());
            roomInfo.put("status", room.getStatus());
            roomInfo.put("winner", room.getWinner());
            roomInfo.put("createTime", room.getCreateTime());
            roomInfo.put("endTime", room.getEndTime());
            roomInfo.put("duration", room.getDuration());

            if (player1 != null) {
                Map<String, Object> player1Info = new HashMap<>();
                player1Info.put("userId", player1.getId());
                player1Info.put("username", player1.getUsername());
                player1Info.put("nickname", player1.getNickname());
                player1Info.put("score", player1.getScore());
                roomInfo.put("player1", player1Info);
            }

            if (player2 != null) {
                Map<String, Object> player2Info = new HashMap<>();
                player2Info.put("userId", player2.getId());
                player2Info.put("username", player2.getUsername());
                player2Info.put("nickname", player2.getNickname());
                player2Info.put("score", player2.getScore());
                roomInfo.put("player2", player2Info);
            }

            result.put("roomInfo", roomInfo);

            List<Map<String, Object>> chessboardInfoList = chessboardList.stream()
                .map(chessboard -> {
                    Map<String, Object> chessboardInfo = new HashMap<>();
                    chessboardInfo.put("chessData", chessboard.getChessDataAsList());
                    chessboardInfo.put("lastMove", chessboard.getLastMoveAsList());
                    chessboardInfo.put("currentTurn", chessboard.getCurrentTurn());
                    chessboardInfo.put("updateTime", chessboard.getUpdateTime());
                    return chessboardInfo;
                })
                .collect(Collectors.toList());
            result.put("chessboardList", chessboardInfoList);

            result.put("viewerList", formattedViewers);

            return ResponseEntity.success("查询成功", result);

        } catch (Exception e) {
            log.error("操作失败: {}", e.getMessage(), e);
            return ResponseEntity.error("查询房间详情失败: " + e.getMessage());
        }
    }

    // ============ 积分管理 ============

    @Override
    @Transactional
    public ResponseEntity<Boolean> addScoreLog(Integer userId, Integer changeScore, String reason) {
        try {
            if (userId == null) {
                return ResponseEntity.error("用户ID不能为空");
            }
            if (changeScore == null || changeScore == 0) {
                return ResponseEntity.error("变动积分不能为空或0");
            }

            User user = userDao.selectById(userId);
            if (user == null) {
                return ResponseEntity.error("用户不存在");
            }

            int newScore = (user.getScore() != null ? user.getScore() : 0) + changeScore;
            if (newScore < 0) newScore = 0;
            user.setScore(newScore);
            userDao.updateUserInfo(user);

            ScoreLog scoreLog = new ScoreLog();
            scoreLog.setUserId(userId);
            scoreLog.setChangeScore(changeScore);
            scoreLog.setReason(reason);
            scoreLog.setCreateTime(new Date());
            scoreLogDao.insert(scoreLog);

            return ResponseEntity.success("添加积分记录成功", true);
        } catch (Exception e) {
            log.error("添加积分记录失败: {}", e.getMessage(), e);
            return ResponseEntity.error("添加积分记录失败: " + e.getMessage());
        }
    }

    @Override
    public ResponseEntity<Map<String, Object>> getScoreLogList(Integer userId, String reason, Date startTime,
              Date endTime, Integer page, Integer size) {
        try {
            if (page == null || page < 1) {
                page = 1;
            }
            if (size == null || size < 1) {
                size = 10;
            }

            List<ScoreLog> scoreLogList = scoreLogDao.selectScoreLogsByCondition(userId, reason, startTime, endTime);

            int total = scoreLogList.size();
            int totalPages = (int) Math.ceil((double) total / size);
            int offset = (page - 1) * size;
            int fromIndex = Math.min(offset, total);
            int toIndex = Math.min(offset + size, total);
            List<ScoreLog> pageData = scoreLogList.subList(fromIndex, toIndex);

            List<Map<String, Object>> formattedList = pageData.stream()
                .map(scoreLog -> {
                    Map<String, Object> logInfo = new HashMap<>();
                    logInfo.put("id", scoreLog.getId());
                    logInfo.put("userId", scoreLog.getUserId());
                    logInfo.put("changeScore", scoreLog.getChangeScore());
                    logInfo.put("reason", scoreLog.getReason());
                    logInfo.put("createTime", scoreLog.getCreateTime());

                    User user = userDao.selectById(scoreLog.getUserId());
                    if (user != null) {
                        logInfo.put("nickname", user.getNickname());
                        logInfo.put("username", user.getUsername());
                    }

                    return logInfo;
                })
                .collect(Collectors.toList());

            Map<String, Object> result = new HashMap<>();
            result.put("list", formattedList);
            result.put("total", total);
            result.put("page", page);
            result.put("size", size);
            result.put("totalPages", totalPages);

            return ResponseEntity.success("查询成功", result);

        } catch (Exception e) {
            log.error("操作失败: {}", e.getMessage(), e);
            return ResponseEntity.error("查询积分记录失败: " + e.getMessage());
        }
    }

    @Override
    public ResponseEntity<ScoreLog> getScoreLogById(Integer logId) {
        try {
            if (logId == null) {
                return ResponseEntity.error("记录ID不能为空");
            }

            ScoreLog scoreLog = scoreLogDao.selectById(logId);
            if (scoreLog == null) {
                return ResponseEntity.error("积分记录不存在");
            }

            return ResponseEntity.success("查询成功", scoreLog);

        } catch (Exception e) {
            return ResponseEntity.error("查询积分记录失败: " + e.getMessage());
        }
    }

    // ============ 数据统计 ============

    @Override
    public ResponseEntity<List<Map<String, Object>>> getRankingList(Integer limit) {
        try {
            if (limit == null || limit < 1) {
                limit = 10;
            }

            List<User> allUsers = userDao.selectAllUsers();

            List<User> topUsers = allUsers.stream()
                .limit(limit)
                .collect(Collectors.toList());

            List<Map<String, Object>> rankingList = new ArrayList<>();
            for (int i = 0; i < topUsers.size(); i++) {
                User user = topUsers.get(i);
                Map<String, Object> rankInfo = new HashMap<>();
                rankInfo.put("rank", i + 1);
                rankInfo.put("userId", user.getId());
                rankInfo.put("username", user.getUsername());
                rankInfo.put("nickname", user.getNickname());
                rankInfo.put("score", user.getScore());
                rankingList.add(rankInfo);
            }

            return ResponseEntity.success("获取排行榜成功", rankingList);

        } catch (Exception e) {
            log.error("操作失败: {}", e.getMessage(), e);
            return ResponseEntity.error("获取排行榜失败: " + e.getMessage());
        }
    }

    // ============ 私有辅助方法 ============

    private List<Map<String, Object>> formatRoomList(List<Room> roomList) {
        return roomList.stream()
            .map(room -> {
                Map<String, Object> roomInfo = new HashMap<>();
                roomInfo.put("id", room.getId());
                roomInfo.put("roomId", room.getRoomId());
                roomInfo.put("status", room.getStatus());
                roomInfo.put("winner", room.getWinner());
                roomInfo.put("createTime", room.getCreateTime());
                roomInfo.put("endTime", room.getEndTime());
                roomInfo.put("duration", room.getDuration());

                if (room.getPlayer1Id() != null) {
                    User player1 = userDao.selectById(room.getPlayer1Id());
                    roomInfo.put("player1Id", room.getPlayer1Id());
                    roomInfo.put("player1Name", player1 != null ? player1.getNickname() : "未知玩家");
                }

                if (room.getPlayer2Id() != null) {
                    User player2 = userDao.selectById(room.getPlayer2Id());
                    roomInfo.put("player2Id", room.getPlayer2Id());
                    roomInfo.put("player2Name", player2 != null ? player2.getNickname() : "未知玩家");
                }

                return roomInfo;
            })
            .collect(Collectors.toList());
    }

    private List<Map<String, Object>> formatViewerList(List<Viewer> viewerList) {
        return viewerList.stream()
            .map(viewer -> {
                Map<String, Object> viewerInfo = new HashMap<>();
                viewerInfo.put("roomId", viewer.getRoomId());
                viewerInfo.put("viewTime", viewer.getJoinTime());

                User viewerUser = userDao.selectById(viewer.getUserId());
                if (viewerUser != null) {
                    viewerInfo.put("viewerName", viewerUser.getNickname());
                }

                return viewerInfo;
            })
            .collect(Collectors.toList());
    }

    @Override
    public ResponseEntity<Map<String, Object>> getDashboardStats() {
        try {
            Map<String, Object> stats = new HashMap<>();

            StatisticsView userStats = userDao.countUsers();
            stats.put("totalUsers", userStats != null ? userStats.getTotalUsers() : 0);
            stats.put("todayUsers", userStats != null ? userStats.getTodayUsers() : 0);

            StatisticsView battleStats = roomDao.countBattles();
            stats.put("totalBattles", battleStats != null ? battleStats.getTotalBattles() : 0);
            stats.put("todayBattles", battleStats != null ? battleStats.getTodayBattles() : 0);
            stats.put("activeBattles", battleStats != null ? battleStats.getActiveBattles() : 0);

            Integer totalViewers = viewerDao.countTotalViewers();
            stats.put("totalViewers", totalViewers != null ? totalViewers : 0);

            stats.put("onlineUsers", 0);

            return ResponseEntity.success("获取统计成功", stats);

        } catch (Exception e) {
            log.error("操作失败: {}", e.getMessage(), e);
            return ResponseEntity.error("获取统计数据失败: " + e.getMessage());
        }
    }

    @Override
    public ResponseEntity<List<Map<String, Object>>> getRecentWeekRoomStats() {
        try {
            List<Map<String, Object>> stats = new ArrayList<>();

            SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd");
            Calendar calendar = Calendar.getInstance();

            for (int i = 6; i >= 0; i--) {
                calendar.setTime(new Date());
                calendar.add(Calendar.DAY_OF_YEAR, -i);
                String date = sdf.format(calendar.getTime());

                Map<String, Object> dayStat = new HashMap<>();
                dayStat.put("date", date);

                Integer roomCount = roomDao.countRoomsByDate(date);
                dayStat.put("roomCount", roomCount != null ? roomCount : 0);

                Integer viewerCount = viewerDao.countViewersByDate(date);
                dayStat.put("viewerCount", viewerCount != null ? viewerCount : 0);

                dayStat.put("gameCount", 0);

                stats.add(dayStat);
            }

            return ResponseEntity.success("获取近七日统计成功", stats);
        } catch (Exception e) {
            log.error("操作失败: {}", e.getMessage(), e);
            return ResponseEntity.error("获取统计失败: " + e.getMessage());
        }
    }

    @Override
    public ResponseEntity<List<Map<String, Object>>> getRoomViewerDetails(String roomId) {
        try {
            if (!StringUtils.hasText(roomId)) {
                return ResponseEntity.error("房间号不能为空");
            }

            List<Map<String, Object>> viewerDetails = viewerDao.selectViewerDetailsByRoomId(roomId);

            if (viewerDetails == null) {
                viewerDetails = new ArrayList<>();
            }

            return ResponseEntity.success("获取观战记录成功", viewerDetails);
        } catch (Exception e) {
            log.error("操作失败: {}", e.getMessage(), e);
            return ResponseEntity.error("获取观战记录失败: " + e.getMessage());
        }
    }
}
