package cn.edu.qvtu.util;

import javax.servlet.http.HttpSession;

/**
 * Session管理工具类
 */
public class SessionUtil {

    // Session键名常量
    private static final String ADMIN_ID_KEY = "adminId";
    private static final String ADMIN_USERNAME_KEY = "adminUsername";
    private static final String ADMIN_NICKNAME_KEY = "adminNickname";
    private static final String ADMIN_ROLE_KEY = "adminRole";

    // Session过期时间（秒）
    private static final int SESSION_TIMEOUT = 30 * 60; // 30分钟

    /**
     * 设置管理员登录信息到Session
     */
    public static void setAdminLoginInfo(HttpSession session, Integer adminId, String username, String nickname) {
        setAdminLoginInfo(session, adminId, username, nickname, null);
    }

    /**
     * 设置管理员登录信息到Session（包含角色）
     */
    public static void setAdminLoginInfo(HttpSession session, Integer adminId, String username,
                                         String nickname, Integer role) {
        session.setAttribute(ADMIN_ID_KEY, adminId);
        session.setAttribute(ADMIN_USERNAME_KEY, username);
        session.setAttribute(ADMIN_NICKNAME_KEY, nickname);
        if (role != null) {
            session.setAttribute(ADMIN_ROLE_KEY, role);
        }
        session.setMaxInactiveInterval(SESSION_TIMEOUT);
    }

    /**
     * 从Session获取管理员ID
     */
    public static Integer getAdminId(HttpSession session) {
        if (session == null) {
            return null;
        }
        return (Integer) session.getAttribute(ADMIN_ID_KEY);
    }

    /**
     * 从Session获取管理员用户名
     */
    public static String getAdminUsername(HttpSession session) {
        if (session == null) {
            return null;
        }
        return (String) session.getAttribute(ADMIN_USERNAME_KEY);
    }

    /**
     * 从Session获取管理员昵称
     */
    public static String getAdminNickname(HttpSession session) {
        if (session == null) {
            return null;
        }
        return (String) session.getAttribute(ADMIN_NICKNAME_KEY);
    }

    /**
     * 从Session获取管理员角色
     */
    public static Integer getAdminRole(HttpSession session) {
        if (session == null) {
            return null;
        }
        return (Integer) session.getAttribute(ADMIN_ROLE_KEY);
    }

    /**
     * 清除管理员登录信息
     */
    public static void clearAdminInfo(HttpSession session) {
        if (session != null) {
            session.removeAttribute(ADMIN_ID_KEY);
            session.removeAttribute(ADMIN_USERNAME_KEY);
            session.removeAttribute(ADMIN_NICKNAME_KEY);
            session.removeAttribute(ADMIN_ROLE_KEY);
        }
    }

    /**
     * 检查管理员是否登录
     */
    public static boolean isAdminLoggedIn(HttpSession session) {
        return getAdminId(session) != null;
    }

    /**
     * 获取Session剩余有效时间（秒）
     */
    public static int getSessionRemainingTime(HttpSession session) {
        if (session == null) {
            return 0;
        }
        return session.getMaxInactiveInterval();
    }

    /**
     * 更新Session过期时间
     */
    public static void updateSessionTimeout(HttpSession session, int seconds) {
        if (session != null && seconds > 0) {
            session.setMaxInactiveInterval(seconds);
        }
    }

    /**
     * 重置Session过期时间为默认值
     */
    public static void resetSessionTimeout(HttpSession session) {
        if (session != null) {
            session.setMaxInactiveInterval(SESSION_TIMEOUT);
        }
    }
}

