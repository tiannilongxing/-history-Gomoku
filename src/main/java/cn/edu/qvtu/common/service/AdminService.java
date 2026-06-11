package cn.edu.qvtu.common.service;

import cn.edu.qvtu.common.entity.Admin;
import cn.edu.qvtu.common.util.ResponseEntity;
import javax.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.Map;

/**
 * 管理员服务接口
 * 处理管理员登录、注销、会话管理等业务
 */
public interface AdminService {

    /**
     * 管理员登录
     */
    ResponseEntity<Map<String, Object>> login(String username, String password, HttpServletRequest request);

    /**
     * 管理员注销
     */
    ResponseEntity<Boolean> logout(HttpServletRequest request);

    /**
     * 修改管理员密码
     */
    ResponseEntity<Boolean> changePassword(Integer adminId, String oldPassword, String newPassword, HttpServletRequest request);

    /**
     * 获取管理员信息
     */
    ResponseEntity<Admin> getAdminInfo(Integer adminId);

    /**
     * 更新管理员信息
     */
    ResponseEntity<Boolean> updateAdminInfo(Admin admin);

    /**
     * 验证管理员登录状态
     */
    boolean checkLoginStatus(HttpServletRequest request);

    /**
     * 获取当前登录管理员信息
     */
    ResponseEntity<Map<String, Object>> getCurrentAdminInfo(HttpServletRequest request);

    // ============ 新增接口 ============

    /**
     * 获取管理员列表
     */
    ResponseEntity<List<Admin>> getAdminList();

    /**
     * 多条件查询管理员列表
     */
    ResponseEntity<Map<String, Object>> getAdminListByCondition(String username, String nickname,
                                                                Integer status, Integer role,
                                                                Integer page, Integer size);

    /**
     * 添加管理员
     */
    ResponseEntity<Map<String, Object>> addAdmin(Admin admin);

    /**
     * 删除管理员
     */
    ResponseEntity<Boolean> deleteAdmin(Integer adminId);
}