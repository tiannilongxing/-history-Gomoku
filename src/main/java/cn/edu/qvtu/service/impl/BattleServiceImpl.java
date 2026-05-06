package cn.edu.qvtu.service.impl;

import cn.edu.qvtu.dao.*;
import cn.edu.qvtu.entity.*;
import cn.edu.qvtu.service.BattleService;
import cn.edu.qvtu.util.ResponseEntity;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.*;

@Service
public class BattleServiceImpl implements BattleService {

    @Autowired
    private RoomDao roomDao;

    @Autowired
    private ChessboardDao chessboardDao;

    @Autowired
    private ViewerDao viewerDao;

    @Autowired
    private UserDao userDao;

    @Autowired
    private ScoreLogDao scoreLogDao;

    @Override
    @Transactional
    public ResponseEntity<Map<String, Object>> createRoom(Integer userId) {
        try {
            // 验证用户是否存在
            User user = userDao.selectById(userId);
            if (user == null) {
                return ResponseEntity.error("用户不存在");
            }

            // 生成6位随机房间号
            String roomId = generateRoomId();

            // 创建房间
            Room room = new Room();
            room.setRoomId(roomId);
            room.setPlayer1Id(userId);
            room.setPlayer2Id(null);
            room.setStatus(0); // 等待中
            room.setWinner(null);

            int result = roomDao.insert(room);
            if (result != 1) {
                return ResponseEntity.error("房间创建失败");
            }

            // 初始化棋盘
            Chessboard chessboard = new Chessboard();
            chessboard.setRoomId(roomId);
            chessboard.setChessDataFromList(initializeChessboard());
            chessboard.setCurrentTurn(1); // 黑棋先行
            chessboard.setLastMoveFromList(initializeEmptyLastMove());

            chessboardDao.insert(chessboard);

            Map<String, Object> data = new HashMap<>();
            data.put("roomId", roomId);
            data.put("role", "1"); // 创建者为黑棋

            return ResponseEntity.success("房间创建成功", data);
        } catch (Exception e) {
            return ResponseEntity.error("创建房间时发生错误: " + e.getMessage());
        }
    }

    @Override
    public ResponseEntity<List<Map<String, Object>>> getRoomList() {
        try {
            List<Room> rooms = roomDao.selectAllRooms();
            List<Map<String, Object>> roomList = new ArrayList<>();

            for (Room room : rooms) {
                Map<String, Object> roomInfo = new HashMap<>();
                roomInfo.put("roomId", room.getRoomId());
                roomInfo.put("status", room.getStatus());

                // 获取玩家昵称
                User player1 = userDao.selectById(room.getPlayer1Id());
                roomInfo.put("player1", player1 != null ? player1.getNickname() : "未知玩家");

                if (room.getPlayer2Id() != null) {
                    User player2 = userDao.selectById(room.getPlayer2Id());
                    roomInfo.put("player2", player2 != null ? player2.getNickname() : "未知玩家");
                } else {
                    roomInfo.put("player2", null);
                }

                // 统计观战人数
                int viewerCount = viewerDao.countByRoomId(room.getRoomId());
                roomInfo.put("viewerCount", viewerCount);

                roomList.add(roomInfo);
            }

            return ResponseEntity.success("获取成功", roomList);
        } catch (Exception e) {
            return ResponseEntity.error("获取房间列表失败: " + e.getMessage());
        }
    }

    @Override
    @Transactional
    public ResponseEntity<String> joinRoom(String roomId, Integer userId) {
        try {
            // 验证用户是否存在
            User user = userDao.selectById(userId);
            if (user == null) {
                return ResponseEntity.error("用户不存在");
            }

            Room room = roomDao.selectByRoomId(roomId);
            if (room == null) {
                return ResponseEntity.error("房间不存在");
            }

            // 检查用户是否已经在房间中
            if (room.getPlayer1Id().equals(userId)) {
                return ResponseEntity.success("已加入房间", "1");
            }

            if (room.getPlayer2Id() != null && room.getPlayer2Id().equals(userId)) {
                return ResponseEntity.success("已加入房间", "2");
            }

            String role;
            if (room.getPlayer2Id() == null) {
                // 加入作为玩家2（白棋）
                room.setPlayer2Id(userId);
                room.setStatus(1); // 游戏中
                roomDao.updateRoom(room);
                role = "2";
            } else {
                // 检查是否已经是观战者
                Viewer existingViewer = viewerDao.selectByUserId(roomId, userId);
                if (existingViewer != null) {
                    return ResponseEntity.success("已加入房间", "0");
                }

                // 加入作为观战者
                Viewer viewer = new Viewer();
                viewer.setRoomId(roomId);
                viewer.setUserId(userId);
                viewerDao.insert(viewer);
                role = "0";
            }

            return ResponseEntity.success("成功加入房间", role);
        } catch (Exception e) {
            return ResponseEntity.error("加入房间失败: " + e.getMessage());
        }
    }

    @Override
    public ResponseEntity<Map<String, Object>> getRoomState(String roomId) {
        try {
            Room room = roomDao.selectByRoomId(roomId);
            if (room == null) {
                return ResponseEntity.error("房间不存在");
            }

            Chessboard chessboard = chessboardDao.selectTopByRoomId(roomId);
            if (chessboard == null) {
                return ResponseEntity.error("棋盘状态不存在");
            }

            Map<String, Object> state = new HashMap<>();
            state.put("roomId", room.getRoomId());
            state.put("status", room.getStatus());

            // 玩家信息
            User player1 = userDao.selectById(room.getPlayer1Id());
            Map<String, Object> player1Info = new HashMap<>();
            player1Info.put("userId", player1.getId());
            player1Info.put("nickname", player1.getNickname());
            state.put("player1", player1Info);

            if (room.getPlayer2Id() != null) {
                User player2 = userDao.selectById(room.getPlayer2Id());
                Map<String, Object> player2Info = new HashMap<>();
                player2Info.put("userId", player2.getId());
                player2Info.put("nickname", player2.getNickname());
                state.put("player2", player2Info);
            } else {
                state.put("player2", null);
            }

            state.put("currentTurn", chessboard.getCurrentTurn());
            state.put("chessboard", chessboard.getChessDataAsList());
            state.put("lastMove", chessboard.getLastMoveAsList());
            state.put("winner", room.getWinner());

            // 观战人数
            int viewerCount = viewerDao.countByRoomId(roomId);
            state.put("viewerCount", viewerCount);

            return ResponseEntity.success("获取成功", state);
        } catch (Exception e) {
            return ResponseEntity.error("获取房间状态失败: " + e.getMessage());
        }
    }

    @Override
    @Transactional
    public ResponseEntity<Boolean> exitRoom(String roomId, Integer userId) {
        try {
            Room room = roomDao.selectByRoomId(roomId);
            if (room == null) {
                return ResponseEntity.error("房间不存在");
            }

            // 检查用户是否在房间中
            boolean isPlayer1 = room.getPlayer1Id().equals(userId);
            boolean isPlayer2 = room.getPlayer2Id() != null && room.getPlayer2Id().equals(userId);

            // 如果游戏正在进行中，先退出的人判负
            if (room.getStatus() == 1) { // 游戏中
                Integer winner = null;

                if (isPlayer1) {
                    // 玩家1退出，玩家2获胜
                    winner = 2;
                } else if (isPlayer2) {
                    // 玩家2退出，玩家1获胜
                    winner = 1;
                }

                if (winner != null) {
                    // 更新房间状态为结束，设置获胜者
                    room.setStatus(2);
                    room.setWinner(winner);
                    room.setEndTime(new Date());

                    if (room.getCreateTime() != null) {
                        room.setDuration((int) ((room.getEndTime().getTime() - room.getCreateTime().getTime()) / 1000));
                    }

                    roomDao.updateRoom(room);

                    // 给获胜者加积分
                    User winnerUser = winner == 1 ?
                            userDao.selectById(room.getPlayer1Id()) :
                            userDao.selectById(room.getPlayer2Id());
                    if (winnerUser != null) {
                        winnerUser.setScore(winnerUser.getScore() + 10);
                        userDao.updateScore(winnerUser);

                        // 记录积分变更
                        ScoreLog scoreLog = new ScoreLog();
                        scoreLog.setUserId(winnerUser.getId());
                        scoreLog.setChangeScore(10);
                        scoreLog.setReason("对手退出，自动获胜");
                        scoreLogDao.insert(scoreLog);
                    }

                    // 删除退出玩家的观战记录（如果存在）
                    viewerDao.deleteByRoomIdAndUserId(roomId, userId);

                    return ResponseEntity.success("您已退出，对手获胜", true);
                }
            }

            // 以下是原有的退出逻辑
            if (!isPlayer1 && !isPlayer2) {
                // 可能是观战者
                viewerDao.deleteByRoomIdAndUserId(roomId, userId);
            } else if (isPlayer1) {
                // 房主退出，解散房间
                roomDao.deleteByRoomId(roomId);
                // 删除所有观战记录
                List<Viewer> viewers = viewerDao.selectByRoomId(roomId);
                for (Viewer viewer : viewers) {
                    viewerDao.deleteByRoomIdAndUserId(roomId, viewer.getUserId());
                }
            } else if (isPlayer2) {
                // 玩家2退出，重置房间状态
                room.setPlayer2Id(null);
                room.setStatus(0); // 等待中
                room.setWinner(null);
                roomDao.updateRoom(room);
            }

            return ResponseEntity.success("退出成功", true);
        } catch (Exception e) {
            return ResponseEntity.error("退出房间失败: " + e.getMessage());
        }
    }

    @Override
    @Transactional
    public ResponseEntity<Boolean> placeChess(String roomId, Integer userId, Integer x, Integer y) {
        try {
            Room room = roomDao.selectByRoomId(roomId);
            if (room == null) {
                return ResponseEntity.error("房间不存在");
            }

            Chessboard chessboard = chessboardDao.selectTopByRoomId(roomId);
            if (chessboard == null) {
                return ResponseEntity.error("棋盘状态不存在");
            }

            // 检查游戏状态
            if (room.getStatus() != 1) {
                return ResponseEntity.error("游戏未开始或已结束");
            }

            // 检查当前回合
            int currentPlayer = chessboard.getCurrentTurn();
            if ((currentPlayer == 1 && !room.getPlayer1Id().equals(userId)) ||
                    (currentPlayer == 2 && !room.getPlayer2Id().equals(userId))) {
                return ResponseEntity.error("不是您的回合");
            }

            // 检查落子位置是否有效
            if (x < 0 || x >= 15 || y < 0 || y >= 15) {
                return ResponseEntity.error("落子位置无效");
            }

            List<List<Integer>> board = chessboard.getChessDataAsList();
            if (board.get(x).get(y) != 0) {
                return ResponseEntity.error("该位置已有棋子");
            }

            // 创建新的棋盘状态记录
            Chessboard newChessboard = new Chessboard();
            newChessboard.setRoomId(roomId);

            // 更新棋盘数据
            List<List<Integer>> newBoard = new ArrayList<>();
            for (int i = 0; i < board.size(); i++) {
                List<Integer> newRow = new ArrayList<>(board.get(i));
                newBoard.add(newRow);
            }
            newBoard.get(x).set(y, currentPlayer);
            newChessboard.setChessDataFromList(newBoard);

            // 更新最后落子位置
            newChessboard.updateLastMove(x, y);

            // 检查胜负
            Integer winner = checkWinner(newBoard, x, y, currentPlayer);
            if (winner != null) {
                // 游戏结束
                room.setStatus(2);
                room.setWinner(winner);
                roomDao.updateRoom(room);
                newChessboard.setCurrentTurn(0);

                // 给获胜者加积分
                User winnerUser = winner == 1 ? userDao.selectById(room.getPlayer1Id()) :
                        userDao.selectById(room.getPlayer2Id());
                winnerUser.setScore(winnerUser.getScore() + 10);
                userDao.updateScore(winnerUser);

                // 记录积分变更
                ScoreLog scoreLog = new ScoreLog();
                scoreLog.setUserId(winnerUser.getId());
                scoreLog.setChangeScore(10);
                scoreLog.setReason("对战获胜");
                scoreLogDao.insert(scoreLog);
            } else {
                // 切换回合
                newChessboard.setCurrentTurn(currentPlayer == 1 ? 2 : 1);
            }

            // 插入新的棋盘状态
            chessboardDao.insert(newChessboard);

            return ResponseEntity.success("落子成功", true);
        } catch (Exception e) {
            return ResponseEntity.error("落子失败: " + e.getMessage());
        }
    }

    @Override
    public ResponseEntity<Map<String, Object>> getRankList(Integer userId) {
        try {
            List<User> allUsers = userDao.selectAllUsers();
            List<Map<String, Object>> rankList = new ArrayList<>();

            // 获取前10名
            int rank = 1;
            for (User user : allUsers) {
                if (rank > 10) break;

                Map<String, Object> rankInfo = new HashMap<>();
                rankInfo.put("rank", rank);
                rankInfo.put("nickname", user.getNickname());
                rankInfo.put("score", user.getScore());
                rankList.add(rankInfo);
                rank++;
            }

            // 查找当前用户排名和积分
            int myRank = -1;
            int myScore = 0;
            rank = 1;
            for (User user : allUsers) {
                if (user.getId().equals(userId)) {
                    myRank = rank;
                    myScore = user.getScore();
                    break;
                }
                rank++;
            }

            Map<String, Object> data = new HashMap<>();
            data.put("rankList", rankList);
            data.put("myRank", myRank);
            data.put("myScore", myScore);

            return ResponseEntity.success("获取成功", data);
        } catch (Exception e) {
            return ResponseEntity.error("获取排行榜失败: " + e.getMessage());
        }
    }

    /**
     * 生成6位随机房间号
     */
    private String generateRoomId() {
        Random random = new Random();
        String roomId;
        do {
            roomId = String.format("%06d", random.nextInt(1000000));
        } while (roomDao.selectByRoomId(roomId) != null);
        return roomId;
    }

    /**
     * 初始化15×15空棋盘
     */
    private List<List<Integer>> initializeChessboard() {
        List<List<Integer>> board = new ArrayList<>();
        for (int i = 0; i < 15; i++) {
            List<Integer> row = new ArrayList<>();
            for (int j = 0; j < 15; j++) {
                row.add(0);
            }
            board.add(row);
        }
        return board;
    }

    /**
     * 初始化空的lastMove数组
     */
    private List<List<Integer>> initializeEmptyLastMove() {
        List<List<Integer>> lastMove = new ArrayList<>();
        for (int i = 0; i < 5; i++) {
            List<Integer> position = new ArrayList<>();
            position.add(-1);
            position.add(-1);
            lastMove.add(position);
        }
        return lastMove;
    }

    /**
     * 检查胜负
     */
    private Integer checkWinner(List<List<Integer>> chessboard, int x, int y, int player) {
        // 检查方向：横、竖、左上到右下、右上到左下
        int[][] directions = {{1, 0}, {0, 1}, {1, 1}, {1, -1}};

        for (int[] dir : directions) {
            int count = 1; // 当前位置已经有一个棋子

            // 正向检查
            for (int i = 1; i <= 4; i++) {
                int newX = x + i * dir[0];
                int newY = y + i * dir[1];
                if (newX >= 0 && newX < 15 && newY >= 0 && newY < 15 &&
                        chessboard.get(newX).get(newY) == player) {
                    count++;
                } else {
                    break;
                }
            }

            // 反向检查
            for (int i = 1; i <= 4; i++) {
                int newX = x - i * dir[0];
                int newY = y - i * dir[1];
                if (newX >= 0 && newX < 15 && newY >= 0 && newY < 15 &&
                        chessboard.get(newX).get(newY) == player) {
                    count++;
                } else {
                    break;
                }
            }

            if (count >= 5) {
                return player;
            }
        }

        return null;
    }
}

