package cn.edu.qvtu.entity;

import lombok.Data;
import java.util.Date;

/**
 * 管理员实体类（对应admin表）
 */
@Data
public class Admin {
    private Integer id;             // 管理员ID
    private String username;        // 管理员账号
    private String password;        // 密码
    private String nickname;        // 管理员昵称
    private Integer status;         // 状态：0-禁用，1-正常
    private Integer role;          // 角色：1-普通管理员，2-超级管理员
    private Date lastLoginTime;    // 最后登录时间
    private String lastLoginIp;    // 最后登录IP
    private Date createTime;       // 创建时间
    private Date updateTime;       // 更新时间
}

