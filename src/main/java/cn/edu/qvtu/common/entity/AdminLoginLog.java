package cn.edu.qvtu.common.entity;

import lombok.Data;
import java.util.Date;

/**
 * 管理员登录日志实体类（对应admin_login_log表）
 */
@Data
public class AdminLoginLog {
    private Integer id;             // 记录ID
    private Integer adminId;        // 管理员ID
    private String adminName;       // 管理员账号
    private String loginIp;         // 登录IP
    private String loginLocation;   // 登录地点
    private String browser;         // 浏览器
    private String os;              // 操作系统
    private Integer status;         // 登录状态：0-失败，1-成功
    private String message;         // 登录消息
    private Date createTime;        // 登录时间
}

