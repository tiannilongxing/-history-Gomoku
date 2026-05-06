package cn.edu.qvtu.service;

import cn.edu.qvtu.entity.User;
import cn.edu.qvtu.util.ResponseEntity;

public interface UserService {

    /**
     * 用户注册，返回用户ID
     */
    ResponseEntity<Integer> register(User user);

    /**
     * 用户登录，返回用户信息
     */
    ResponseEntity<User> login(String username, String password);

    /**
     * 获取用户信息
     */
    ResponseEntity<User> getUserInfo(Integer userId);

    /**
     * 修改昵称，返回修改后的昵称
     */
    ResponseEntity<String> updateNickname(Integer userId, String newNickname);

    /**
     * 修改密码，返回是否修改成功
     */
    ResponseEntity<Boolean> updatePassword(Integer userId, String oldPassword, String newPassword);
}