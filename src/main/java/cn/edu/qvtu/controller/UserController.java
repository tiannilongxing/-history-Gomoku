package cn.edu.qvtu.controller;

import cn.edu.qvtu.entity.User;
import cn.edu.qvtu.service.UserService;
import cn.edu.qvtu.util.ResponseEntity;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/user")
public class UserController {

    private static final Logger logger = LoggerFactory.getLogger(UserController.class);

    @Autowired
    private UserService userService;

    /**
     * 用户注册
     */
    @PostMapping("/register")
    public ResponseEntity<Integer> register(@RequestBody User user) {
        logger.info("收到用户注册请求，用户名: {}", user.getUsername());
        try {
            return userService.register(user);
        } catch (Exception e) {
            logger.error("用户注册时发生异常", e);
            return ResponseEntity.error("注册失败: " + e.getMessage());
        }
    }

    /**
     * 用户登录
     */
    @PostMapping("/login")
    public ResponseEntity<User> login(@RequestParam String username, @RequestParam String password) {
        logger.info("收到用户登录请求，用户名: {}", username);
        try {
            return userService.login(username, password);
        } catch (Exception e) {
            logger.error("用户登录时发生异常", e);
            return ResponseEntity.error("登录失败: " + e.getMessage());
        }
    }

    /**
     * 获取用户信息
     */
    @GetMapping("/info/{userId}")
    public ResponseEntity<User> getUserInfo(@PathVariable Integer userId) {
        logger.info("收到获取用户信息请求，用户ID: {}", userId);
        try {
            return userService.getUserInfo(userId);
        } catch (Exception e) {
            logger.error("获取用户信息时发生异常", e);
            return ResponseEntity.error("获取用户信息失败: " + e.getMessage());
        }
    }

    /**
     * 修改昵称
     */
    @PostMapping("/updateNickname")
    public ResponseEntity<String> updateNickname(@RequestParam Integer userId, @RequestParam String newNickname) {
        logger.info("收到修改昵称请求，用户ID: {}, 新昵称: {}", userId, newNickname);
        try {
            return userService.updateNickname(userId, newNickname);
        } catch (Exception e) {
            logger.error("修改昵称时发生异常", e);
            return ResponseEntity.error("修改昵称失败: " + e.getMessage());
        }
    }

    /**
     * 修改密码
     */
    @PostMapping("/updatePassword")
    public ResponseEntity<Boolean> updatePassword(@RequestParam Integer userId,
                                                  @RequestParam String oldPassword,
                                                  @RequestParam String newPassword) {
        logger.info("收到修改密码请求，用户ID: {}", userId);
        try {
            return userService.updatePassword(userId, oldPassword, newPassword);
        } catch (Exception e) {
            logger.error("修改密码时发生异常", e);
            return ResponseEntity.error("修改密码失败: " + e.getMessage());
        }
    }

    /**
     * 健康检查
     */
    @GetMapping("/health")
    public ResponseEntity<String> healthCheck() {
        return ResponseEntity.success("服务正常", "用户服务运行正常");
    }
}


