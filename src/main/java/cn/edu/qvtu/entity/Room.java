package cn.edu.qvtu.entity;

import lombok.Data;
import java.util.Date;

/**
 * 房间实体类（对应room表）
 */
@Data
public class Room {
    private Integer id;             // 记录ID
    private String roomId;          // 房间号
    private Integer player1Id;      // 玩家1（黑棋）ID
    private Integer player2Id;      // 玩家2（白棋）ID
    private Integer status;         // 房间状态：0-等待中，1-游戏中，2-已结束
    private Integer winner;         // 获胜方：1-玩家1，2-玩家2
    private Date createTime;        // 创建时间
    private Date endTime;           // 结束时间（新增）
    private Integer duration;       // 对局时长（秒）（新增）

    /**
     * 检查房间是否超时（创建超过1分钟未开始）
     */
    public boolean isTimeout() {
        if (status != 0) {
            return false; // 不是等待中状态，不判断超时
        }

        long createTimeMillis = createTime.getTime();
        long currentTimeMillis = System.currentTimeMillis();
        long diffMinutes = (currentTimeMillis - createTimeMillis) / (1000 * 60);

        return diffMinutes >= 1; // 超过1分钟
    }

    /**
     * 判断游戏是否进行中
     */
    public boolean isInProgress() {
        return status == 1;
    }

    /**
     * 判断游戏是否已结束
     */
    public boolean isEnded() {
        return status == 2;
    }

    /**
     * 标记游戏结束
     */
    public void markAsEnded(Integer winner) {
        this.status = 2;
        this.winner = winner;
        this.endTime = new Date();

        if (this.createTime != null) {
            this.duration = (int)((this.endTime.getTime() - this.createTime.getTime()) / 1000);
        }
    }

    /**
     * 开始游戏
     */
    public void startGame(Integer player2Id) {
        this.status = 1;
        this.player2Id = player2Id;
    }
}

