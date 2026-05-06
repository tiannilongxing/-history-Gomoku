package cn.edu.qvtu.entity;

import lombok.Data;
import java.util.Date;

/**
 * 观战记录实体类（对应viewer表）
 */
@Data
public class Viewer {
    private Integer id;             // 记录ID
    private String roomId;          // 房间号
    private Integer userId;         // 观战用户ID
    private Date joinTime;          // 加入时间
}

