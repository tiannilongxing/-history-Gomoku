package cn.edu.qvtu.entity;

import lombok.Data;

/**
 * 统计视图实体类（用于仪表盘数据展示）
 */
@Data
public class StatisticsView {
    private Integer totalUsers;     // 总用户数
    private Integer todayUsers;     // 今日新增用户
    private Integer totalBattles;   // 总对局数
    private Integer todayBattles;   // 今日对局数
    private Integer activeBattles;  // 进行中对局数
    private Integer onlineUsers;    // 在线用户数（需要其他机制统计）
    private Integer totalViewers;   // 总观战人次
}

