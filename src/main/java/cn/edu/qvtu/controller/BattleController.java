package cn.edu.qvtu.controller;

import cn.edu.qvtu.service.BattleService;
import cn.edu.qvtu.util.ResponseEntity;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
public class BattleController {

    private static final Logger logger = LoggerFactory.getLogger(BattleController.class);

    @Autowired
    private BattleService battleService;

    /**
     * 创建房间
     */
    @PostMapping("/room/create/{userId}")
    public ResponseEntity<Map<String, Object>> createRoom(@PathVariable Integer userId) {
        logger.info("收到创建房间请求，用户ID: {}", userId);
        try {
            ResponseEntity<Map<String, Object>> result = battleService.createRoom(userId);
            logger.info("创建房间结果: {}", result);
            return result;
        } catch (Exception e) {
            logger.error("创建房间时发生异常", e);
            return ResponseEntity.error("服务器内部错误: " + e.getMessage());
        }
    }

    /**
     * 房间列表
     */
    @GetMapping("/room/list")
    public ResponseEntity<List<Map<String, Object>>> getRoomList() {
        logger.info("收到获取房间列表请求");
        try {
            return battleService.getRoomList();
        } catch (Exception e) {
            logger.error("获取房间列表时发生异常", e);
            return ResponseEntity.error("获取房间列表失败: " + e.getMessage());
        }
    }

    /**
     * 加入房间
     */
    @GetMapping("/room/join")
    public ResponseEntity<String> joinRoom(@RequestParam String roomId, @RequestParam Integer userId) {
        logger.info("收到加入房间请求，房间号: {}, 用户ID: {}", roomId, userId);
        try {
            return battleService.joinRoom(roomId, userId);
        } catch (Exception e) {
            logger.error("加入房间时发生异常", e);
            return ResponseEntity.error("加入房间失败: " + e.getMessage());
        }
    }

    /**
     * 房间状态
     */
    @GetMapping("/room/state/{roomId}")
    public ResponseEntity<Map<String, Object>> getRoomState(@PathVariable String roomId) {
        logger.info("收到获取房间状态请求，房间号: {}", roomId);
        try {
            return battleService.getRoomState(roomId);
        } catch (Exception e) {
            logger.error("获取房间状态时发生异常", e);
            return ResponseEntity.error("获取房间状态失败: " + e.getMessage());
        }
    }

    /**
     * 退出房间
     */
    @PostMapping("/room/exit")
    public ResponseEntity<Boolean> exitRoom(@RequestParam String roomId, @RequestParam Integer userId) {
        logger.info("收到退出房间请求，房间号: {}, 用户ID: {}", roomId, userId);
        try {
            return battleService.exitRoom(roomId, userId);
        } catch (Exception e) {
            logger.error("退出房间时发生异常", e);
            return ResponseEntity.error("退出房间失败: " + e.getMessage());
        }
    }

    /**
     * 落子操作
     */
    @PostMapping("/game/placeChess")
    public ResponseEntity<Boolean> placeChess(@RequestParam String roomId,
                                              @RequestParam Integer userId,
                                              @RequestParam Integer x,
                                              @RequestParam Integer y) {
        logger.info("收到落子请求，房间号: {}, 用户ID: {}, 位置: ({}, {})", roomId, userId, x, y);
        try {
            return battleService.placeChess(roomId, userId, x, y);
        } catch (Exception e) {
            logger.error("落子操作时发生异常", e);
            return ResponseEntity.error("落子失败: " + e.getMessage());
        }
    }

    /**
     * 积分排行榜
     */
    @GetMapping("/rank/list/{userId}")
    public ResponseEntity<Map<String, Object>> getRankList(@PathVariable Integer userId) {
        logger.info("收到获取排行榜请求，用户ID: {}", userId);
        try {
            return battleService.getRankList(userId);
        } catch (Exception e) {
            logger.error("获取排行榜时发生异常", e);
            return ResponseEntity.error("获取排行榜失败: " + e.getMessage());
        }
    }

    /**
     * 健康检查接口
     */
    @GetMapping("/health")
    public ResponseEntity<String> healthCheck() {
        return ResponseEntity.success("服务正常", "五子棋对战服务运行正常");
    }

    /**
     * 测试创建房间接口
     */
    @PostMapping("/test/create")
    public ResponseEntity<Map<String, Object>> testCreateRoom() {
        logger.info("收到测试创建房间请求");
        try {
            // 模拟用户ID为1的用户创建房间
            return battleService.createRoom(1);
        } catch (Exception e) {
            logger.error("测试创建房间时发生异常", e);
            return ResponseEntity.error("测试创建房间失败: " + e.getMessage());
        }
    }
}

