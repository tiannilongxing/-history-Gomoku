package cn.edu.qvtu.entity;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.Data;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

/**
 * 棋盘状态实体类（对应chessboard表）
 */
@Data
public class Chessboard {
    private Integer id;                         // 记录ID
    private String roomId;                      // 房间号
    private String chessData;                   // 棋盘状态（JSON字符串）
    private Integer currentTurn;                // 当前回合：1-黑棋，2-白棋，0-已结束
    private String lastMove;                    // 最后落子位置（JSON字符串）
    private Date updateTime;                    // 最后更新时间

    private static final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * 获取棋盘数据为二维列表
     */
    public List<List<Integer>> getChessDataAsList() {
        if (chessData == null || chessData.trim().isEmpty()) {
            return initializeEmptyChessboard();
        }
        try {
            return objectMapper.readValue(chessData, new TypeReference<List<List<Integer>>>() {});
        } catch (Exception e) {
            return initializeEmptyChessboard();
        }
    }

    /**
     * 设置棋盘数据从二维列表
     */
    public void setChessDataFromList(List<List<Integer>> chessDataList) {
        try {
            this.chessData = objectMapper.writeValueAsString(chessDataList);
        } catch (JsonProcessingException e) {
            this.chessData = "[]";
        }
    }

    /**
     * 获取最后落子位置为二维列表
     */
    public List<List<Integer>> getLastMoveAsList() {
        if (lastMove == null || lastMove.trim().isEmpty()) {
            return initializeEmptyLastMove();
        }
        try {
            return objectMapper.readValue(lastMove, new TypeReference<List<List<Integer>>>() {});
        } catch (Exception e) {
            return initializeEmptyLastMove();
        }
    }

    /**
     * 设置最后落子位置从二维列表
     */
    public void setLastMoveFromList(List<List<Integer>> lastMoveList) {
        try {
            this.lastMove = objectMapper.writeValueAsString(lastMoveList);
        } catch (JsonProcessingException e) {
            this.lastMove = "[]";
        }
    }

    /**
     * 初始化空棋盘（15×15）
     */
    private List<List<Integer>> initializeEmptyChessboard() {
        List<List<Integer>> board = new ArrayList<>();
        for (int i = 0; i < 15; i++) {
            List<Integer> row = new ArrayList<>();
            for (int j = 0; j < 15; j++) {
                row.add(0); // 0表示空位置
            }
            board.add(row);
        }
        return board;
    }

    /**
     * 初始化空的最后落子位置数组
     */
    private List<List<Integer>> initializeEmptyLastMove() {
        List<List<Integer>> lastMove = new ArrayList<>();
        for (int i = 0; i < 5; i++) {
            List<Integer> position = new ArrayList<>();
            position.add(-1); // -1表示无效位置
            position.add(-1);
            lastMove.add(position);
        }
        return lastMove;
    }

    /**
     * 更新最后落子位置，维护最近5步
     */
    public void updateLastMove(int x, int y) {
        List<List<Integer>> currentLastMove = getLastMoveAsList();
        List<List<Integer>> newLastMove = new ArrayList<>();

        // 添加新的落子位置到第一个
        List<Integer> newPosition = new ArrayList<>();
        newPosition.add(x);
        newPosition.add(y);
        newLastMove.add(newPosition);

        // 添加之前的4步（如果存在）
        for (int i = 0; i < Math.min(4, currentLastMove.size()); i++) {
            List<Integer> position = currentLastMove.get(i);
            // 只添加有效的位置（不是[-1, -1]）
            if (position.get(0) != -1 || position.get(1) != -1) {
                newLastMove.add(new ArrayList<>(position));
            }
        }

        // 确保总是有5个位置，不足的用[-1, -1]填充
        while (newLastMove.size() < 5) {
            List<Integer> emptyPosition = new ArrayList<>();
            emptyPosition.add(-1);
            emptyPosition.add(-1);
            newLastMove.add(emptyPosition);
        }

        setLastMoveFromList(newLastMove);
    }
}

