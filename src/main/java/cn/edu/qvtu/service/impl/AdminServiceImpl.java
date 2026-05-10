package cn.edu.qvtu.service.impl;

import cn.edu.qvtu.dao.AdminDao;
import cn.edu.qvtu.dao.AdminLoginLogDao;
import cn.edu.qvtu.entity.Admin;
import cn.edu.qvtu.entity.AdminLoginLog;
import cn.edu.qvtu.service.AdminService;
import cn.edu.qvtu.util.IpUtil;
import cn.edu.qvtu.util.PasswordUtil;
import cn.edu.qvtu.util.ResponseEntity;
import cn.edu.qvtu.util.SessionUtil;
import cn.edu.qvtu.util.UserAgentUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpSession;
import java.util.*;

/**
 * 管理员服务实现类
 */
@Service
public class AdminServiceImpl implements AdminService {

    private static final Logger log = LoggerFactory.getLogger(AdminServiceImpl.class);

    @Autowired
    private AdminDao adminDao;

    @Autowired
    private AdminLoginLogDao adminLoginLogDao;

    @Override
    @Transactional
    public ResponseEntity<Map<String, Object>> login(String username, String password, HttpServletRequest request) {
        try {
            // 1. 参数验证
            if (!StringUtils.hasText(username)) {
                return ResponseEntity.error("账号不能为空");
            }
            if (!StringUtils.hasText(password)) {
                return ResponseEntity.error("密码不能为空");
            }

            // 2. 查询管理员
            Admin admin = adminDao.selectByUsername(username);
            if (admin == null) {
                recordLoginLog(null, username, request, 0, "账号不存在");
                return ResponseEntity.error("账号或密码错误");
            }

            // 3. 验证状态
            if (admin.getStatus() != null && admin.getStatus() == 0) {
                recordLoginLog(admin.getId(), username, request, 0, "账号已被禁用");
                return ResponseEntity.error("账号已被禁用");
            }

            // 4. 验证密码
            boolean passwordValid = PasswordUtil.verifyPassword(password, admin.getPassword());
            System.out.println("登录验证 - 输入密码: " + password);
            System.out.println("登录验证 - 存储密码: " + admin.getPassword());
            System.out.println("登录验证 - 密码是否有效: " + passwordValid);

            if (!passwordValid) {
                recordLoginLog(admin.getId(), username, request, 0, "密码错误");
                return ResponseEntity.error("账号或密码错误");
            }

            // 5. 获取客户端信息
            String clientIp = IpUtil.getClientIp(request);
            String browser = UserAgentUtil.getBrowser(request);
            String os = UserAgentUtil.getOS(request);
            String location = IpUtil.getIpLocation(clientIp);

            // 6. 更新管理员最后登录信息
            admin.setLastLoginTime(new Date());
            admin.setLastLoginIp(clientIp);
            adminDao.updateLastLogin(admin.getId(), admin.getLastLoginTime(), admin.getLastLoginIp());

            // 7. 记录登录日志
            recordLoginLog(admin.getId(), username, request, 1, "登录成功");

            // 8. 设置Session信息
            HttpSession session = request.getSession();
            SessionUtil.setAdminLoginInfo(session, admin.getId(), admin.getUsername(), admin.getNickname());

            // 9. 准备返回数据
            Map<String, Object> result = new HashMap<>();
            result.put("adminId", admin.getId());
            result.put("username", admin.getUsername());
            result.put("nickname", admin.getNickname());
            result.put("role", admin.getRole());

            return ResponseEntity.success("登录成功", result);

        } catch (Exception e) {
            log.error("操作失败: {}", e.getMessage(), e);
            return ResponseEntity.error("登录时发生错误: " + e.getMessage());
        }
    }

    @Override
    @Transactional
    public ResponseEntity<Boolean> logout(HttpServletRequest request) {
        try {
            HttpSession session = request.getSession(false);
            if (session == null) {
                return ResponseEntity.success("已退出登录", true);
            }

            // 获取管理员ID用于记录日志
            Integer adminId = SessionUtil.getAdminId(session);
            String adminUsername = SessionUtil.getAdminUsername(session);

            // 记录登出日志
            if (adminId != null && adminUsername != null) {
                recordLoginLog(adminId, adminUsername, request, 1, "正常登出");
            }

            // 清除Session信息
            SessionUtil.clearAdminInfo(session);
            session.invalidate();

            return ResponseEntity.success("退出成功", true);

        } catch (Exception e) {
            return ResponseEntity.error("退出时发生错误: " + e.getMessage());
        }
    }

    @Override
    @Transactional
    public ResponseEntity<Boolean> changePassword(Integer adminId, String oldPassword, String newPassword, HttpServletRequest request) {
        try {
            // 1. 参数验证
            if (adminId == null) {
                return ResponseEntity.error("管理员ID不能为空");
            }
            if (!StringUtils.hasText(oldPassword)) {
                return ResponseEntity.error("原密码不能为空");
            }
            if (!StringUtils.hasText(newPassword)) {
                return ResponseEntity.error("新密码不能为空");
            }
            if (newPassword.length() < 6) {
                return ResponseEntity.error("新密码长度不能少于6位");
            }

            // 2. 查询目标管理员
            Admin admin = adminDao.selectById(adminId);
            if (admin == null) {
                return ResponseEntity.error("管理员不存在");
            }

            // 3. 验证原密码
            if (!PasswordUtil.verifyPassword(oldPassword, admin.getPassword())) {
                return ResponseEntity.error("原密码错误");
            }

            // 4. 权限检查：只有超级管理员(role=2)或本人才能修改密码
            HttpSession session = request.getSession(false);
            Integer currentAdminId = SessionUtil.getAdminId(session);
            Integer currentAdminRole = SessionUtil.getAdminRole(session);
            if (currentAdminId == null) {
                return ResponseEntity.error("当前管理员未登录");
            }
            if (!currentAdminId.equals(adminId) && (currentAdminRole == null || currentAdminRole != 2)) {
                return ResponseEntity.error("不是超级管理员，不能修改其他管理员的密码");
            }

            // 4. 加密新密码
            String encryptedNewPassword = PasswordUtil.ensurePasswordEncrypted(newPassword);
            System.out.println("修改密码 - 新密码: " + newPassword);
            System.out.println("修改密码 - 加密后: " + encryptedNewPassword);

            // 5. 更新密码
            admin.setPassword(encryptedNewPassword);
            int result = adminDao.update(admin);
            if (result != 1) {
                return ResponseEntity.error("修改密码失败");
            }

            return ResponseEntity.success("密码修改成功", true);

        } catch (Exception e) {
            log.error("操作失败: {}", e.getMessage(), e);
            return ResponseEntity.error("修改密码时发生错误: " + e.getMessage());
        }
    }

    @Override
    public ResponseEntity<Admin> getAdminInfo(Integer adminId) {
        try {
            if (adminId == null) {
                return ResponseEntity.error("管理员ID不能为空");
            }

            Admin admin = adminDao.selectById(adminId);
            if (admin == null) {
                return ResponseEntity.error("管理员不存在");
            }

            // 隐藏密码
            admin.setPassword("");

            return ResponseEntity.success("获取成功", admin);

        } catch (Exception e) {
            log.error("操作失败: {}", e.getMessage(), e);
            return ResponseEntity.error("获取管理员信息时发生错误: " + e.getMessage());
        }
    }

    @Override
    @Transactional
    public ResponseEntity<Boolean> updateAdminInfo(Admin admin) {
        try {
            if (admin == null || admin.getId() == null) {
                return ResponseEntity.error("管理员信息不完整");
            }

            // 查询现有管理员
            Admin existingAdmin = adminDao.selectById(admin.getId());
            if (existingAdmin == null) {
                return ResponseEntity.error("管理员不存在");
            }

            //不是超级管理员且更新的不是自己的账号
            if(existingAdmin.getRole() != null && existingAdmin.getRole() != 2 && existingAdmin.getId() != admin.getId()){
                return ResponseEntity.error("不是超级管理员，不能修改其他管理员的账号信息");
            }

            // 只更新允许修改的字段
            if (StringUtils.hasText(admin.getNickname())) {
                existingAdmin.setNickname(admin.getNickname());
            }
            if (admin.getStatus() != null) {
                existingAdmin.setStatus(admin.getStatus());
            }
            if (admin.getRole() != null) {
                existingAdmin.setRole(admin.getRole());
            }

            int result = adminDao.update(existingAdmin);
            if (result != 1) {
                return ResponseEntity.error("更新管理员信息失败");
            }

            return ResponseEntity.success("更新成功", true);

        } catch (Exception e) {
            log.error("操作失败: {}", e.getMessage(), e);
            return ResponseEntity.error("更新管理员信息时发生错误: " + e.getMessage());
        }
    }

    @Override
    public boolean checkLoginStatus(HttpServletRequest request) {
        try {
            HttpSession session = request.getSession(false);
            if (session == null) {
                return false;
            }

            Integer adminId = SessionUtil.getAdminId(session);
            if (adminId == null) {
                return false;
            }

            Admin admin = adminDao.selectById(adminId);
            return admin != null && admin.getStatus() == 1;

        } catch (Exception e) {
            log.error("操作失败: {}", e.getMessage(), e);
            return false;
        }
    }

    @Override
    public ResponseEntity<Map<String, Object>> getCurrentAdminInfo(HttpServletRequest request) {
        try {
            HttpSession session = request.getSession(false);
            if (session == null) {
                return ResponseEntity.error("未登录");
            }

            Integer adminId = SessionUtil.getAdminId(session);
            if (adminId == null) {
                return ResponseEntity.error("未登录");
            }

            Admin admin = adminDao.selectById(adminId);
            if (admin == null) {
                return ResponseEntity.error("管理员不存在");
            }

            Map<String, Object> result = new HashMap<>();
            result.put("adminId", admin.getId());
            result.put("username", admin.getUsername());
            result.put("nickname", admin.getNickname());
            result.put("role", admin.getRole());
            result.put("status", admin.getStatus());
            result.put("lastLoginTime", admin.getLastLoginTime());
            result.put("lastLoginIp", admin.getLastLoginIp());

            return ResponseEntity.success("获取成功", result);

        } catch (Exception e) {
            log.error("操作失败: {}", e.getMessage(), e);
            return ResponseEntity.error("获取当前管理员信息失败: " + e.getMessage());
        }
    }

    /**
     * 添加管理员（新增方法）
     */
    @Transactional
    public ResponseEntity<Map<String, Object>> addAdmin(Admin admin) {
        try {
            // 1. 参数验证
            if (admin == null) {
                return ResponseEntity.error("管理员信息不能为空");
            }
            if (!StringUtils.hasText(admin.getUsername())) {
                return ResponseEntity.error("账号不能为空");
            }
            if (!StringUtils.hasText(admin.getPassword())) {
                return ResponseEntity.error("密码不能为空");
            }

            //不是超级管理员无法添加新管理员
            if(admin.getRole() != null && admin.getRole() != 2){
                return ResponseEntity.error("不是超级管理员，无法添加新管理员");
            }

            // 2. 检查用户名是否已存在
            Admin existingAdmin = adminDao.selectByUsername(admin.getUsername());
            if (existingAdmin != null) {
                return ResponseEntity.error("账号已存在");
            }

            // 3. 设置默认值
            if (!StringUtils.hasText(admin.getNickname())) {
                admin.setNickname(admin.getUsername());
            }
            if (admin.getStatus() == null) {
                admin.setStatus(1); // 默认启用
            }
            if (admin.getRole() == null) {
                admin.setRole(1); // 默认普通管理员
            }

            // 4. 确保密码正确加密
            String encryptedPassword = PasswordUtil.ensurePasswordEncrypted(admin.getPassword());
            System.out.println("添加管理员 - 原始密码: " + admin.getPassword());
            System.out.println("添加管理员 - 加密后密码: " + encryptedPassword);
            admin.setPassword(encryptedPassword);

            // 5. 保存管理员
            int result = adminDao.insert(admin);
            if (result != 1) {
                return ResponseEntity.error("添加管理员失败");
            }

            // 6. 准备返回数据
            Map<String, Object> data = new HashMap<>();
            data.put("adminId", admin.getId());
            data.put("username", admin.getUsername());
            data.put("nickname", admin.getNickname());

            return ResponseEntity.success("添加管理员成功", data);

        } catch (Exception e) {
            log.error("操作失败: {}", e.getMessage(), e);
            return ResponseEntity.error("添加管理员失败: " + e.getMessage());
        }
    }

    /**
     * 批量操作管理员（新增方法）
     */
    @Transactional
    public ResponseEntity<Boolean> batchUpdateAdminStatus(Integer[] adminIds, Integer status) {
        try {
            if (adminIds == null || adminIds.length == 0) {
                return ResponseEntity.error("请选择要操作的管理员");
            }
            if (status == null) {
                return ResponseEntity.error("状态不能为空");
            }

            int successCount = 0;
            for (Integer adminId : adminIds) {
                Admin admin = adminDao.selectById(adminId);
                if (admin != null) {
                    admin.setStatus(status);
                    int result = adminDao.update(admin);
                    if (result == 1) {
                        successCount++;
                    }
                }
            }

            if (successCount == 0) {
                return ResponseEntity.error("没有管理员被更新");
            }

            return ResponseEntity.success("成功更新 " + successCount + " 个管理员状态", true);

        } catch (Exception e) {
            log.error("操作失败: {}", e.getMessage(), e);
            return ResponseEntity.error("批量更新管理员状态失败: " + e.getMessage());
        }
    }

    /**
     * 删除管理员（新增方法）
     */
    @Transactional
    public ResponseEntity<Boolean> deleteAdmin(Integer adminId) {
        try {
            if (adminId == null) {
                return ResponseEntity.error("管理员ID不能为空");
            }

            // 检查管理员是否存在
            Admin admin = adminDao.selectById(adminId);
            if (admin == null) {
                return ResponseEntity.error("管理员不存在");
            }

            // 检查是否为超级管理员（防止删除超级管理员）
            if (admin.getRole() != null && admin.getRole() == 2) {
                return ResponseEntity.error("不能删除超级管理员");
            }

            //不是超级管理员无法删除管理员
            if (admin.getStatus() == null && admin.getRole() != 2) {
                return ResponseEntity.error("不是超级管理员，无法删除管理员");
            }

            // 执行删除
            int result = adminDao.delete(adminId);
            if (result != 1) {
                return ResponseEntity.error("删除管理员失败");
            }

            return ResponseEntity.success("删除管理员成功", true);

        } catch (Exception e) {
            log.error("操作失败: {}", e.getMessage(), e);
            return ResponseEntity.error("删除管理员失败: " + e.getMessage());
        }
    }

    /**
     * 记录登录日志
     */
    private void recordLoginLog(Integer adminId, String username, HttpServletRequest request,
                                Integer status, String message) {
        try {
            AdminLoginLog log = new AdminLoginLog();
            log.setAdminId(adminId);
            log.setAdminName(username);
            log.setLoginIp(IpUtil.getClientIp(request));
            log.setLoginLocation(IpUtil.getIpLocation(log.getLoginIp()));
            log.setBrowser(UserAgentUtil.getBrowser(request));
            log.setOs(UserAgentUtil.getOS(request));
            log.setStatus(status);
            log.setMessage(message);

            adminLoginLogDao.insert(log);
        } catch (Exception e) {
            // 登录日志记录失败不应该影响登录流程
            log.error("操作失败: {}", e.getMessage(), e);
        }
    }
    // 在 AdminServiceImpl.java 中添加以下方法

    @Override
    public ResponseEntity<List<Admin>> getAdminList() {
        try {
            // 查询所有管理员
            List<Admin> adminList = adminDao.selectAll();

            if (adminList == null) {
                adminList = new ArrayList<>();
            }

            // 隐藏所有管理员的密码
            for (Admin admin : adminList) {
                admin.setPassword("");
            }

            return ResponseEntity.success("获取管理员列表成功", adminList);

        } catch (Exception e) {
            log.error("操作失败: {}", e.getMessage(), e);
            return ResponseEntity.error("获取管理员列表失败: " + e.getMessage());
        }
    }

    @Override
    public ResponseEntity<Map<String, Object>> getAdminListByCondition(String username, String nickname,
                                                                       Integer status, Integer role,
                                                                       Integer page, Integer size) {
        try {
            // 参数处理
            if (page == null || page < 1) {
                page = 1;
            }
            if (size == null || size < 1) {
                size = 10;
            }
            int offset = (page - 1) * size;

            // 查询条件（分页查询）
            List<Admin> adminList = adminDao.selectByConditionWithPage(username, nickname, status, role, null, null, offset, size);

            if (adminList == null) {
                adminList = new ArrayList<>();
            }

            // 获取总数
            int total = adminDao.countByCondition(username, nickname, status, role, null, null);

            // 隐藏密码
            for (Admin admin : adminList) {
                admin.setPassword("");
            }

            // 构建返回数据
            Map<String, Object> result = new HashMap<>();
            result.put("list", adminList);
            result.put("total", total);
            result.put("page", page);
            result.put("size", size);
            result.put("totalPages", (int) Math.ceil((double) total / size));

            return ResponseEntity.success("查询成功", result);

        } catch (Exception e) {
            log.error("操作失败: {}", e.getMessage(), e);
            return ResponseEntity.error("查询管理员列表失败: " + e.getMessage());
        }
    }
}

