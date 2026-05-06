package cn.edu.qvtu.interceptor;

import cn.edu.qvtu.util.ResponseEntity;
import cn.edu.qvtu.util.SessionUtil;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;
import java.io.PrintWriter;

/**
 * 管理员权限拦截器
 * 验证管理员登录状态
 */
@Component
public class AdminInterceptor implements HandlerInterceptor {

    private static final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        // 获取请求路径
        String uri = request.getRequestURI();
        String method = request.getMethod();

        // 放行登录相关接口
        if (uri.contains("/admin/login") || uri.contains("/admin/logout")) {
            return true;
        }

        // 放行检查登录状态接口
        if (uri.contains("/admin/checkStatus") || uri.contains("/admin/current")) {
            return true;
        }

        // 放行健康检查接口
        if (uri.contains("/health")) {
            return true;
        }

        // 放行静态资源
        if (uri.contains(".html") || uri.contains(".css") || uri.contains(".js")
                || uri.contains(".jpg") || uri.contains(".png") || uri.contains(".ico")
                || uri.contains("/webjars/") || uri.contains("swagger-ui.html")) {
            return true;
        }

        // 检查管理员登录状态
        HttpSession session = request.getSession(false);
        boolean isLoggedIn = SessionUtil.isAdminLoggedIn(session);

        if (!isLoggedIn) {
            // 未登录，返回错误信息
            response.setContentType("application/json;charset=UTF-8");
            ResponseEntity<String> result = ResponseEntity.error("管理员未登录或登录已过期");
            String jsonResult = objectMapper.writeValueAsString(result);

            PrintWriter writer = response.getWriter();
            writer.write(jsonResult);
            writer.flush();
            return false;
        }

        // 获取管理员角色
        Integer adminRole = SessionUtil.getAdminRole(session);

        // 对于管理员管理相关操作，检查角色权限
        if (uri.contains("/admin/list") || uri.contains("/admin/add") || uri.contains("/admin/batchStatus")) {
            // 只有超级管理员才能管理其他管理员
            if (adminRole == null || adminRole != 2) {
                response.setContentType("application/json;charset=UTF-8");
                ResponseEntity<String> result = ResponseEntity.error("权限不足，需要超级管理员权限");
                String jsonResult = objectMapper.writeValueAsString(result);

                PrintWriter writer = response.getWriter();
                writer.write(jsonResult);
                writer.flush();
                return false;
            }
        }

        // 对于删除管理员操作，额外的安全检查
        if (uri.matches("/admin/\\d+") && "DELETE".equalsIgnoreCase(method)) {
            // 获取要删除的管理员ID
            String[] parts = uri.split("/");
            if (parts.length >= 3) {
                try {
                    int deleteAdminId = Integer.parseInt(parts[parts.length - 1]);

                    // 不能删除自己
                    Integer currentAdminId = SessionUtil.getAdminId(session);
                    if (currentAdminId != null && currentAdminId == deleteAdminId) {
                        response.setContentType("application/json;charset=UTF-8");
                        ResponseEntity<String> result = ResponseEntity.error("不能删除自己");
                        String jsonResult = objectMapper.writeValueAsString(result);

                        PrintWriter writer = response.getWriter();
                        writer.write(jsonResult);
                        writer.flush();
                        return false;
                    }

                    // 只有超级管理员才能删除管理员
                    if (adminRole == null || adminRole != 2) {
                        response.setContentType("application/json;charset=UTF-8");
                        ResponseEntity<String> result = ResponseEntity.error("权限不足，需要超级管理员权限");
                        String jsonResult = objectMapper.writeValueAsString(result);

                        PrintWriter writer = response.getWriter();
                        writer.write(jsonResult);
                        writer.flush();
                        return false;
                    }
                } catch (NumberFormatException e) {
                    // 如果ID不是数字，继续处理
                }
            }
        }

        // 更新Session过期时间，实现"记住我"功能
        SessionUtil.resetSessionTimeout(session);

        return true;
    }
}