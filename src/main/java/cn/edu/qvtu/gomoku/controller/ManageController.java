package cn.edu.qvtu.gomoku.controller;

import cn.edu.qvtu.gomoku.entity.Room;
import cn.edu.qvtu.common.entity.ScoreLog;
import cn.edu.qvtu.common.entity.User;
import cn.edu.qvtu.gomoku.service.ManageService;
import cn.edu.qvtu.common.util.ResponseEntity;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.PrintWriter;
import java.net.URLEncoder;
import java.util.Date;
import java.util.List;
import java.util.Map;

/**
 * 后台管理控制器
 * 处理用户管理、对战管理、积分管理等后台操作
 */
@RestController
@RequestMapping("/manage")
public class ManageController {

    @Autowired
    private ManageService manageService;

    // ============ 用户管理接口 ============

    /**
     * 多条件查询用户列表
     * GET /manage/user/list
     */
    @GetMapping("/user/list")
    public ResponseEntity<Map<String, Object>> getUserList(
            @RequestParam(required = false) String username,
            @RequestParam(required = false) String nickname,
            @RequestParam(required = false) Integer status,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss") Date startTime,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss") Date endTime,
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer size) {

        return manageService.getUserList(username, nickname, status, startTime, endTime, page, size);
    }

    /**
     * 根据ID查询用户信息
     * GET /manage/user/{userId}
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<User> getUserById(@PathVariable Integer userId) {
        return manageService.getUserById(userId);
    }

    /**
     * 添加用户
     * POST /manage/user
     */
    @PostMapping("/user")
    public ResponseEntity<Integer> addUser(@RequestBody User user) {
        return manageService.addUser(user);
    }

    /**
     * 修改用户信息
     * PUT /manage/user
     */
    @PutMapping("/user")
    public ResponseEntity<Boolean> updateUser(@RequestBody User user) {
        return manageService.updateUser(user);
    }

    /**
     * 删除用户
     * DELETE /manage/user/{userId}
     */
    @DeleteMapping("/user/{userId}")
    public ResponseEntity<Boolean> deleteUser(@PathVariable Integer userId) {
        return manageService.deleteUser(userId);
    }

    /**
     * 查询用户详情
     * GET /manage/user/detail/{userId}
     */
    @GetMapping("/user/detail/{userId}")
    public ResponseEntity<Map<String, Object>> getUserDetail(@PathVariable Integer userId) {
        return manageService.getUserDetail(userId);
    }

    /**
     * 导出用户数据为CSV
     * GET /manage/user/export
     */
    @GetMapping("/user/export")
    public void exportUsers(HttpServletResponse response) {
        try {
            // 设置响应头
            response.setContentType("text/csv;charset=UTF-8");
            response.setHeader("Content-Disposition", "attachment;filename=" + URLEncoder.encode("用户数据.csv", "UTF-8"));

            // 获取全部用户数据
            ResponseEntity<Map<String, Object>> result = manageService.getUserList(null, null, null, null, null, 1, 99999);
            @SuppressWarnings("unchecked")
            List<User> users = (List<User>) result.getData().get("list");

            PrintWriter writer = response.getWriter();
            // 写入BOM，确保Excel正确识别UTF-8编码
            writer.write('\uFEFF');
            // 表头
            writer.println("ID,用户名,昵称,积分,状态,注册时间,最后登录");
            // 数据行
            for (User user : users) {
                writer.println(String.format("%s,%s,%s,%s,%s,%s,%s",
                        user.getId(),
                        user.getUsername() != null ? user.getUsername() : "",
                        user.getNickname() != null ? user.getNickname() : "",
                        user.getScore() != null ? user.getScore() : 0,
                        user.getStatus() != null && user.getStatus() == 1 ? "正常" : "禁用",
                        user.getCreateTime() != null ? user.getCreateTime() : "",
                        user.getLastLoginTime() != null ? user.getLastLoginTime() : "从未登录"
                ));
            }
            writer.flush();
        } catch (Exception e) {
            try {
                response.reset();
                response.setContentType("application/json;charset=UTF-8");
                response.getWriter().write("{\"state\":false,\"msg\":\"导出失败: " + e.getMessage() + "\"}");
            } catch (IOException ex) {
                // ignore
            }
        }
    }

    // ============ 对战管理接口 ============

    /**
     * 多条件查询对战房间列表
     * GET /manage/room/list
     */
    @GetMapping("/room/list")
    public ResponseEntity<Map<String, Object>> getRoomList(
            @RequestParam(required = false) String roomId,
            @RequestParam(required = false) String playerName,
            @RequestParam(required = false) Integer status,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss") Date startTime,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss") Date endTime,
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer size) {

        return manageService.getRoomList(roomId, playerName, status, startTime, endTime, page, size);
    }

    /**
     * 根据房间号查询对战详情
     * GET /manage/room/{roomId}
     */
    @GetMapping("/room/{roomId}")
    public ResponseEntity<Map<String, Object>> getRoomDetail(@PathVariable String roomId) {
        return manageService.getRoomDetail(roomId);
    }

    /**
     * 删除对战房间
     * DELETE /manage/room/{roomId}
     */
    @DeleteMapping("/room/{roomId}")
    public ResponseEntity<Boolean> deleteRoom(@PathVariable String roomId) {
        return manageService.deleteRoom(roomId);
    }

    /**
     * 清理超时房间（创建超过1分钟未开始的房间）
     * POST /manage/room/cleanup
     */
    @PostMapping("/room/cleanup")
    public ResponseEntity<Integer> cleanupTimeoutRooms() {
        return manageService.cleanupTimeoutRooms();
    }

    // ============ 积分管理接口 ============

    /**
     * 添加积分记录
     * POST /manage/score/log
     */
    @PostMapping("/score/log")
    public ResponseEntity<Boolean> addScoreLog(@RequestBody Map<String, Object> params) {
        try {
            Integer userId = Integer.parseInt(params.get("userId").toString());
            Integer changeScore = Integer.parseInt(params.get("changeScore").toString());
            String reason = params.get("reason") != null ? params.get("reason").toString() : "管理员手动调整";

            return manageService.addScoreLog(userId, changeScore, reason);
        } catch (Exception e) {
            return ResponseEntity.error("添加积分记录失败: " + e.getMessage());
        }
    }

    /**
     * 多条件查询积分记录
     * GET /manage/score/log/list
     */
    @GetMapping("/score/log/list")
    public ResponseEntity<Map<String, Object>> getScoreLogList(
            @RequestParam(required = false) Integer userId,
            @RequestParam(required = false) String reason,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss") Date startTime,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss") Date endTime,
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer size) {

        return manageService.getScoreLogList(userId, reason, startTime, endTime, page, size);
    }

    /**
     * 根据ID查询积分记录详情
     * GET /manage/score/log/{logId}
     */
    @GetMapping("/score/log/{logId}")
    public ResponseEntity<ScoreLog> getScoreLogById(@PathVariable Integer logId) {
        return manageService.getScoreLogById(logId);
    }

    // ============ 数据统计接口 ============

    /**
     * 获取仪表盘统计数据
     * GET /manage/dashboard/stats
     */
    @GetMapping("/dashboard/stats")
    public ResponseEntity<Map<String, Object>> getDashboardStats() {
        return manageService.getDashboardStats();
    }

    /**
     * 获取积分排行榜
     * GET /manage/ranking
     */
    @GetMapping("/ranking")
    public ResponseEntity<List<Map<String, Object>>> getRankingList(
            @RequestParam(defaultValue = "10") Integer limit) {
        return manageService.getRankingList(limit);
    }

    /**
     * 后台管理控制器 - 新增接口
     */
    @RestController
    @RequestMapping("/manage/stats")
    public class StatsController {

        @Autowired
        private ManageService manageService;

        /**
         * 获取近七日对战统计折线图数据
         * GET /manage/stats/recent-week
         */
        @GetMapping("/recent-week")
        public ResponseEntity<List<Map<String, Object>>> getRecentWeekStats() {
            try {
                // 直接调用接口方法
                return manageService.getRecentWeekRoomStats();
            } catch (Exception e) {
                return ResponseEntity.error("获取统计失败: " + e.getMessage());
            }
        }

        /**
         * 获取房间观战记录详情
         * GET /manage/stats/viewer-details/{roomId}
         */
        @GetMapping("/viewer-details/{roomId}")
        public ResponseEntity<List<Map<String, Object>>> getRoomViewerDetails(@PathVariable String roomId) {
            try {
                return manageService.getRoomViewerDetails(roomId);
            } catch (Exception e) {
                return ResponseEntity.error("获取观战记录失败: " + e.getMessage());
            }
        }
    }
}

