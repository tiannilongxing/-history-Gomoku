package cn.edu.qvtu.entity;

import lombok.Data;
import java.util.Date;

/**
 * 积分变更记录实体类（对应score_log表）
 */
@Data
public class ScoreLog {
    private Integer id;             // 记录ID
    private Integer userId;         // 用户ID
    private Integer changeScore;    // 积分变更值
    private String reason;          // 变更原因
    private Date createTime;        // 变更时间
}

