package cn.edu.qvtu.service.impl;

import cn.edu.qvtu.dao.UserDao;
import cn.edu.qvtu.entity.User;
import cn.edu.qvtu.util.ResponseEntity;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.MockitoJUnitRunner;

import static org.junit.Assert.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * UserServiceImpl 单元测试
 * 测试注册、登录、获取用户信息、修改昵称、修改密码
 */
@RunWith(MockitoJUnitRunner.class)
public class UserServiceImplTest {

    @Mock
    private UserDao userDao;

    @InjectMocks
    private UserServiceImpl userService;

    private User testUser;

    @Before
    public void setUp() {
        testUser = new User();
        testUser.setId(1);
        testUser.setUsername("testuser");
        // MD5("password123") = 482c811da5d5b4bc6d497ffa98491e38
        testUser.setPassword("482c811da5d5b4bc6d497ffa98491e38");
        testUser.setNickname("测试用户");
        testUser.setScore(100);
        testUser.setStatus(1);
    }

    // ==================== 注册测试 ====================

    @Test
    public void testRegister_Success() {
        User newUser = new User();
        newUser.setUsername("newuser");
        newUser.setPassword("password123");

        when(userDao.selectByUsername("newuser")).thenReturn(null);
        when(userDao.insert(any(User.class))).thenAnswer(invocation -> {
            User u = invocation.getArgument(0);
            u.setId(100); // 模拟数据库生成ID
            return 1;
        });

        ResponseEntity<Integer> result = userService.register(newUser);

        assertTrue("注册应该成功", result.isState());
        assertEquals("注册成功", result.getMsg());
        assertNotNull("应返回用户ID", result.getData());
        assertEquals("返回的用户ID应为100", Integer.valueOf(100), result.getData());
    }

    @Test
    public void testRegister_UserIsNull() {
        ResponseEntity<Integer> result = userService.register(null);

        assertFalse("用户为null时应失败", result.isState());
        assertTrue(result.getMsg().contains("用户信息不能为空"));
    }

    @Test
    public void testRegister_UsernameEmpty() {
        User user = new User();
        user.setUsername("");
        user.setPassword("password123");

        ResponseEntity<Integer> result = userService.register(user);

        assertFalse("用户名为空时应失败", result.isState());
        assertTrue(result.getMsg().contains("账号不能为空"));
    }

    @Test
    public void testRegister_PasswordEmpty() {
        User user = new User();
        user.setUsername("testuser");
        user.setPassword("");

        ResponseEntity<Integer> result = userService.register(user);

        assertFalse("密码为空时应失败", result.isState());
        assertTrue(result.getMsg().contains("密码不能为空"));
    }

    @Test
    public void testRegister_UsernameAlreadyExists() {
        User newUser = new User();
        newUser.setUsername("testuser");
        newUser.setPassword("password123");

        when(userDao.selectByUsername("testuser")).thenReturn(testUser);

        ResponseEntity<Integer> result = userService.register(newUser);

        assertFalse("账号已存在时应失败", result.isState());
        assertTrue(result.getMsg().contains("账号已存在"));
    }

    @Test
    public void testRegister_InsertFailed() {
        User newUser = new User();
        newUser.setUsername("newuser");
        newUser.setPassword("password123");

        when(userDao.selectByUsername("newuser")).thenReturn(null);
        when(userDao.insert(any(User.class))).thenReturn(0); // 插入失败

        ResponseEntity<Integer> result = userService.register(newUser);

        assertFalse("插入失败时应返回错误", result.isState());
        assertTrue(result.getMsg().contains("注册失败"));
    }

    // ==================== BUG验证: register 中 score==null 时才设 status=1，逻辑嵌套有问题 ====================
    @Test
    public void testRegister_ScoreDefaultAndStatusLogic() {
        // Bug: 在 register 方法中，status 的设置是在 if (score == null) 块内的
        // 这意味着如果前端传了 score 但没传 status，status 就是 null
        // 而 UserMapper.insert 只插入 username,password,nickname,score,status 五个字段
        // 如果 status 为 null，INSERT 语句会插入 NULL 值
        User newUser = new User();
        newUser.setUsername("newuser");
        newUser.setPassword("password123");
        newUser.setScore(50); // 有score，但没设status
        // status 为 null -- 这是 bug

        when(userDao.selectByUsername("newuser")).thenReturn(null);
        when(userDao.insert(any(User.class))).thenReturn(1);

        ResponseEntity<Integer> result = userService.register(newUser);

        assertTrue("注册应该成功", result.isState());
        // BUG: newUser.getStatus() 仍然是 null，没有被设为默认值1
        // 因为 status=1 的赋值在 if(score==null) 块内
    }

    // ==================== 登录测试 ====================

    @Test
    public void testLogin_Success() {
        when(userDao.selectByUsername("testuser")).thenReturn(testUser);

        ResponseEntity<User> result = userService.login("testuser", "password123");

        assertTrue("登录应该成功", result.isState());
        assertEquals("登录成功", result.getMsg());
        assertNotNull("应返回用户信息", result.getData());
        assertEquals("密码应被清空", "", result.getData().getPassword());
    }

    @Test
    public void testLogin_UsernameEmpty() {
        ResponseEntity<User> result = userService.login("", "password123");

        assertFalse("用户名为空时应失败", result.isState());
        assertTrue(result.getMsg().contains("账号不能为空"));
    }

    @Test
    public void testLogin_PasswordEmpty() {
        ResponseEntity<User> result = userService.login("testuser", "");

        assertFalse("密码为空时应失败", result.isState());
        assertTrue(result.getMsg().contains("密码不能为空"));
    }

    @Test
    public void testLogin_UserNotFound() {
        when(userDao.selectByUsername("nonexistent")).thenReturn(null);

        ResponseEntity<User> result = userService.login("nonexistent", "password123");

        assertFalse("用户不存在时应失败", result.isState());
        assertTrue(result.getMsg().contains("账号不存在"));
    }

    @Test
    public void testLogin_WrongPassword() {
        when(userDao.selectByUsername("testuser")).thenReturn(testUser);

        ResponseEntity<User> result = userService.login("testuser", "wrongpassword");

        assertFalse("密码错误时应失败", result.isState());
        assertTrue(result.getMsg().contains("密码错误"));
    }

    // ==================== BUG验证: login 使用 PasswordUtil.verifyPassword 有安全风险 ====================
    // PasswordUtil.verifyPassword 同时支持明文和MD5比较，如果数据库泄露的是明文密码，
    // 攻击者可以用明文密码登录 -- 这是一个已知的安全降级设计

    // ==================== getUserInfo 测试 ====================

    @Test
    public void testGetUserInfo_Success() {
        when(userDao.selectById(1)).thenReturn(testUser);

        ResponseEntity<User> result = userService.getUserInfo(1);

        assertTrue("获取用户信息应成功", result.isState());
        assertEquals("测试用户", result.getData().getNickname());
        assertEquals("密码应被清空", "", result.getData().getPassword());
    }

    @Test
    public void testGetUserInfo_NullId() {
        ResponseEntity<User> result = userService.getUserInfo(null);

        assertFalse("ID为空时应失败", result.isState());
        assertTrue(result.getMsg().contains("用户ID不能为空"));
    }

    @Test
    public void testGetUserInfo_UserNotFound() {
        when(userDao.selectById(999)).thenReturn(null);

        ResponseEntity<User> result = userService.getUserInfo(999);

        assertFalse("用户不存在时应失败", result.isState());
        assertTrue(result.getMsg().contains("用户不存在"));
    }

    // ==================== 修改昵称测试 ====================

    @Test
    public void testUpdateNickname_Success() {
        when(userDao.selectById(1)).thenReturn(testUser);
        when(userDao.updateNickname(any(User.class))).thenReturn(1);

        ResponseEntity<String> result = userService.updateNickname(1, "新昵称");

        assertTrue("修改昵称应成功", result.isState());
        assertEquals("修改昵称成功", result.getMsg());
        assertEquals("新昵称", result.getData());
    }

    @Test
    public void testUpdateNickname_EmptyNickname() {
        ResponseEntity<String> result = userService.updateNickname(1, "");

        assertFalse("昵称为空时应失败", result.isState());
        assertTrue(result.getMsg().contains("昵称不能为空"));
    }

    @Test
    public void testUpdateNickname_UserNotFound() {
        when(userDao.selectById(999)).thenReturn(null);

        ResponseEntity<String> result = userService.updateNickname(999, "新昵称");

        assertFalse("用户不存在时应失败", result.isState());
        assertTrue(result.getMsg().contains("用户不存在"));
    }

    // ==================== 修改密码测试 ====================

    @Test
    public void testUpdatePassword_Success() {
        when(userDao.selectById(1)).thenReturn(testUser);
        when(userDao.updatePassword(any(User.class))).thenReturn(1);

        ResponseEntity<Boolean> result = userService.updatePassword(1, "password123", "newpassword456");

        assertTrue("修改密码应成功", result.isState());
        assertEquals("修改密码成功", result.getMsg());
    }

    @Test
    public void testUpdatePassword_WrongOldPassword() {
        when(userDao.selectById(1)).thenReturn(testUser);

        ResponseEntity<Boolean> result = userService.updatePassword(1, "wrongold", "newpassword");

        assertFalse("旧密码错误时应失败", result.isState());
        assertTrue(result.getMsg().contains("旧密码错误"));
    }

    @Test
    public void testUpdatePassword_NullUserId() {
        ResponseEntity<Boolean> result = userService.updatePassword(null, "old", "new");

        assertFalse("用户ID为空时应失败", result.isState());
        assertTrue(result.getMsg().contains("用户ID不能为空"));
    }

    @Test
    public void testUpdatePassword_EmptyOldPassword() {
        ResponseEntity<Boolean> result = userService.updatePassword(1, "", "new");

        assertFalse("旧密码为空时应失败", result.isState());
        assertTrue(result.getMsg().contains("旧密码不能为空"));
    }

    @Test
    public void testUpdatePassword_EmptyNewPassword() {
        ResponseEntity<Boolean> result = userService.updatePassword(1, "old", "");

        assertFalse("新密码为空时应失败", result.isState());
        assertTrue(result.getMsg().contains("新密码不能为空"));
    }
}