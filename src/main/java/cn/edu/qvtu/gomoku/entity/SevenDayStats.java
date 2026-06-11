package cn.edu.qvtu.gomoku.entity;

import lombok.Data;

/**
 * 七日统计实体类
 */
@Data
public class SevenDayStats {
    private String date;        // 日期
    private Integer roomCount;  // 房间创建数量
    private Integer viewerCount; // 观战人数
    private Integer gameCount;  // 对局完成数量
}

