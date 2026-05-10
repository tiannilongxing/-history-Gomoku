package cn.edu.qvtu.controller;

import cn.edu.qvtu.entity.Admin;
import cn.edu.qvtu.service.AdminService;
import cn.edu.qvtu.util.ResponseEntity;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.Map;

/**
 * 管理员控制器
 * 处理管理员登录、注销、密码修改等认证相关操作
 */
@RestController
@RequestMapping("/admin")
public class AdminController {

    @Autowired
    private AdminService adminService;

    /**
     * 管理员登录 - 支持URL参数和JSON格式
     * GET /admin/login?username=admin&password=admin123
     * 或 POST /admin/login {username:"admin",password:"admin123"}
     */
    @GetMapping("/login")
    public ResponseEntity<Map<String, Object>> loginByGet(
            @RequestParam String username,
            @RequestParam String password,
            HttpServletRequest request) {
        return adminService.login(username, password, request);
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> loginByPost(
            @RequestBody(required = false) Map<String, String> loginData,
            HttpServletRequest request) {
        String username = null;
        String password = null;

        if (loginData != null) {
            username = loginData.get("username");
            password = loginData.get("password");
        }

        // 如果JSON中没有参数，尝试从URL参数获取
        if ((username == null || password == null) && request.getParameter("username") != null) {
            username = request.getParameter("username");
            password = request.getParameter("password");
        }

        if (username == null || password == null) {
            return ResponseEntity.error("用户名和密码不能为空");
        }

        return adminService.login(username, password, request);
    }

    /**
     * 管理员注销
     * POST /admin/logout
     */
    @PostMapping("/logout")
    public ResponseEntity<Boolean> logout(HttpServletRequest request) {
        return adminService.logout(request);
    }

    /**
     * 修改管理员密码
     * POST /admin/changePassword
     */
    @PostMapping("/changePassword")
    public ResponseEntity<Boolean> changePassword(@RequestBody Map<String, String> passwordData,
                                                   HttpServletRequest request) {
        try {
            Integer adminId = Integer.parseInt(passwordData.get("adminId"));
            String oldPassword = passwordData.get("oldPassword");
            String newPassword = passwordData.get("newPassword");

            return adminService.changePassword(adminId, oldPassword, newPassword, request);
        } catch (NumberFormatException e) {
            return ResponseEntity.error("管理员ID格式错误");
        } catch (Exception e) {
            return ResponseEntity.error("参数错误: " + e.getMessage());
        }
    }

    /**
     * 获取管理员信息
     * GET /admin/info/{adminId}
     */
    @GetMapping("/info/{adminId}")
    public ResponseEntity<Admin> getAdminInfo(@PathVariable Integer adminId) {
        return adminService.getAdminInfo(adminId);
    }

    /**
     * 更新管理员信息
     * PUT /admin/info
     */
    @PutMapping("/info")
    public ResponseEntity<Boolean> updateAdminInfo(@RequestBody Admin admin) {
        return adminService.updateAdminInfo(admin);
    }

    /**
     * 检查管理员登录状态
     * GET /admin/checkStatus
     */
    @GetMapping("/checkStatus")
    public ResponseEntity<Boolean> checkLoginStatus(HttpServletRequest request) {
        boolean isLoggedIn = adminService.checkLoginStatus(request);
        if (isLoggedIn) {
            return ResponseEntity.success("管理员已登录", true);
        } else {
            return ResponseEntity.success("管理员未登录", false);
        }
    }

    /**
     * 获取当前登录管理员信息
     * GET /admin/current
     */
    @GetMapping("/current")
    public ResponseEntity<Map<String, Object>> getCurrentAdminInfo(HttpServletRequest request) {
        return adminService.getCurrentAdminInfo(request);
    }


    // ============ 新增的管理员列表接口 ============

    /**
     * 获取管理员列表
     * GET /admin/list
     */
    @GetMapping("/list")
    public ResponseEntity<List<Admin>> getAdminList() {
        try {
            // 直接调用接口方法，不要进行类型检查
            return adminService.getAdminList();
        } catch (Exception e) {
            return ResponseEntity.error("获取管理员列表失败: " + e.getMessage());
        }
    }

    /**
     * 多条件分页查询管理员列表
     * GET /admin/list/condition
     */
    @GetMapping("/list/condition")
    public ResponseEntity<Map<String, Object>> getAdminListByCondition(
            @RequestParam(required = false) String username,
            @RequestParam(required = false) String nickname,
            @RequestParam(required = false) Integer status,
            @RequestParam(required = false) Integer role,
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer size) {

        try {
            return adminService.getAdminListByCondition(username, nickname, status, role, page, size);
        } catch (Exception e) {
            return ResponseEntity.error("查询管理员列表失败: " + e.getMessage());
        }
    }

    /**
     * 添加管理员（新增接口）
     * POST /admin/add
     */
    @PostMapping("/add")
    public ResponseEntity<Map<String, Object>> addAdmin(@RequestBody Admin admin) {
        try {
            return adminService.addAdmin(admin);
        } catch (Exception e) {
            return ResponseEntity.error("添加管理员失败: " + e.getMessage());
        }
    }

    /**
     * 删除管理员（新增接口）
     * DELETE /admin/{adminId}
     */
    @DeleteMapping("/{adminId}")
    public ResponseEntity<Boolean> deleteAdmin(@PathVariable Integer adminId) {
        try {
            return adminService.deleteAdmin(adminId);
        } catch (Exception e) {
            return ResponseEntity.error("删除管理员失败: " + e.getMessage());
        }
    }
}

