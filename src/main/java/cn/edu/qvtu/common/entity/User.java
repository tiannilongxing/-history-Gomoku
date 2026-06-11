package cn.edu.qvtu.common.entity;

import lombok.Data;
import java.util.Date;

/**
 * 用户实体类（对应user表）
 */
@Data
public class User {
    private Integer id;             // 用户ID
    private String username;        // 账号
    private String password;        // 密码
    private String nickname;        // 昵称
    private Integer score;          // 积分
    private Integer status;         // 状态：0-禁用，1-正常（新增）
    private Date lastLoginTime;     // 最后登录时间（新增）
    private String lastLoginIp;     // 最后登录IP（新增）
    private Date createTime;        // 注册时间
}

