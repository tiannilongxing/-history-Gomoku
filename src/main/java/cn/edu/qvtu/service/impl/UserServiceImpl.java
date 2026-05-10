package cn.edu.qvtu.service.impl;

import cn.edu.qvtu.dao.UserDao;
import cn.edu.qvtu.entity.User;
import cn.edu.qvtu.service.UserService;
import cn.edu.qvtu.util.PasswordUtil;  // 添加这行
import cn.edu.qvtu.util.ResponseEntity;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
public class UserServiceImpl implements UserService {

    @Autowired
    private UserDao userDao;

    @Override
    public ResponseEntity<Integer> register(User user) {
        try {
            // 判断数据的完整性
            if (user == null) {
                return ResponseEntity.error("用户信息不能为空");
            }
            if (StringUtils.isEmpty(user.getUsername())) {
                return ResponseEntity.error("账号不能为空");
            }
            if (StringUtils.isEmpty(user.getPassword())) {
                return ResponseEntity.error("密码不能为空");
            }

            // 设置默认值
            if (StringUtils.isEmpty(user.getNickname())) {
                user.setNickname(user.getUsername());
            }
            if (user.getScore() == null) {
            user.setScore(0);
        }
        if (user.getStatus() == null) {
            user.setStatus(1);
        }

            // 判断账号是否存在
            User existingUser = userDao.selectByUsername(user.getUsername());
            if (existingUser != null) {
                return ResponseEntity.error("账号已存在");
            }

            // 重要修改：对用户密码进行加密
            String encryptedPassword = PasswordUtil.ensurePasswordEncrypted(user.getPassword());
            user.setPassword(encryptedPassword);

            // 插入用户
            int result = userDao.insert(user);
            if (result != 1) {
                return ResponseEntity.error("注册失败");
            }

            return ResponseEntity.success("注册成功", user.getId());
        } catch (Exception e) {
            return ResponseEntity.error("注册时发生错误: " + e.getMessage());
        }
    }

    @Override
    public ResponseEntity<User> login(String username, String password) {
        try {
            // 判断数据的完整性
            if (StringUtils.isEmpty(username)) {
                return ResponseEntity.error("账号不能为空");
            }
            if (StringUtils.isEmpty(password)) {
                return ResponseEntity.error("密码不能为空");
            }

            // 根据用户名查询用户
            User user = userDao.selectByUsername(username);

            // 判断用户是否存在
            if (user == null) {
                return ResponseEntity.error("账号不存在");
            }

            // 修改：使用PasswordUtil.verifyPassword进行密码验证，兼容明文和加密密码
            if (!PasswordUtil.verifyPassword(password, user.getPassword())) {
                return ResponseEntity.error("密码错误");
            }

            // 保证安全性，密码设为空
            user.setPassword("");
            return ResponseEntity.success("登录成功", user);
        } catch (Exception e) {
            return ResponseEntity.error("登录时发生错误: " + e.getMessage());
        }
    }

    @Override
    public ResponseEntity<User> getUserInfo(Integer userId) {
        try {
            // 判断数据的完整性
            if (userId == null) {
                return ResponseEntity.error("用户ID不能为空");
            }

            // 根据用户ID查询用户
            User user = userDao.selectById(userId);

            // 判断用户是否存在
            if (user == null) {
                return ResponseEntity.error("用户不存在");
            }

            // 保证安全性，密码设为空
            user.setPassword("");
            return ResponseEntity.success("获取用户信息成功", user);
        } catch (Exception e) {
            return ResponseEntity.error("获取用户信息时发生错误: " + e.getMessage());
        }
    }

    @Override
    public ResponseEntity<String> updateNickname(Integer userId, String newNickname) {
        try {
            // 判断数据的完整性
            if (userId == null) {
                return ResponseEntity.error("用户ID不能为空");
            }
            if (StringUtils.isEmpty(newNickname)) {
                return ResponseEntity.error("昵称不能为空");
            }

            // 根据用户ID查询用户
            User user = userDao.selectById(userId);

            // 判断用户是否存在
            if (user == null) {
                return ResponseEntity.error("用户不存在");
            }

            // 更新用户昵称
            user.setNickname(newNickname);
            int result = userDao.updateNickname(user);
            if (result != 1) {
                return ResponseEntity.error("修改昵称失败");
            }

            return ResponseEntity.success("修改昵称成功", newNickname);
        } catch (Exception e) {
            return ResponseEntity.error("修改昵称时发生错误: " + e.getMessage());
        }
    }

    @Override
    public ResponseEntity<Boolean> updatePassword(Integer userId, String oldPassword, String newPassword) {
        try {
            // 判断数据的完整性
            if (userId == null) {
                return ResponseEntity.error("用户ID不能为空");
            }
            if (StringUtils.isEmpty(oldPassword)) {
                return ResponseEntity.error("旧密码不能为空");
            }
            if (StringUtils.isEmpty(newPassword)) {
                return ResponseEntity.error("新密码不能为空");
            }

            // 根据用户ID查询用户
            User user = userDao.selectById(userId);

            // 判断用户是否存在
            if (user == null) {
                return ResponseEntity.error("用户不存在");
            }

            // 修改：使用PasswordUtil.verifyPassword进行旧密码验证
            if (!PasswordUtil.verifyPassword(oldPassword, user.getPassword())) {
                return ResponseEntity.error("旧密码错误");
            }

            // 修改：对新密码进行加密
            String encryptedNewPassword = PasswordUtil.ensurePasswordEncrypted(newPassword);
            user.setPassword(encryptedNewPassword);

            int result = userDao.updatePassword(user);
            if (result != 1) {
                return ResponseEntity.error("修改密码失败");
            }

            return ResponseEntity.success("修改密码成功", true);
        } catch (Exception e) {
            return ResponseEntity.error("修改密码时发生错误: " + e.getMessage());
        }
    }
}

