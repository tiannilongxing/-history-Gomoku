package cn.edu.qvtu.entity;

import org.junit.Test;
import java.util.List;
import java.util.ArrayList;
import static org.junit.Assert.*;

/**
 * Chessboard 实体类单元测试
 * 测试棋盘数据JSON序列化/反序列化、lastMove更新逻辑
 */
public class ChessboardTest {

    // ==================== getChessDataAsList / setChessDataFromList ====================

    @Test
    public void testChessDataRoundTrip() {
        Chessboard cb = new Chessboard();

        List<List<Integer>> board = new ArrayList<>();
        for (int i = 0; i < 3; i++) {
            List<Integer> row = new ArrayList<>();
            for (int j = 0; j < 3; j++) {
                row.add(i * 3 + j);
            }
            board.add(row);
        }

        cb.setChessDataFromList(board);
        List<List<Integer>> result = cb.getChessDataAsList();

        assertEquals(3, result.size());
        assertEquals(Integer.valueOf(0), result.get(0).get(0));
        assertEquals(Integer.valueOf(8), result.get(2).get(2));
    }

    @Test
    public void testGetChessDataAsList_NullData() {
        Chessboard cb = new Chessboard();
        cb.setChessData(null);
        List<List<Integer>> result = cb.getChessDataAsList();
        assertEquals(15, result.size());
        assertEquals(15, result.get(0).size());
        assertEquals(Integer.valueOf(0), result.get(0).get(0));
    }

    @Test
    public void testGetChessDataAsList_EmptyString() {
        Chessboard cb = new Chessboard();
        cb.setChessData("");
        List<List<Integer>> result = cb.getChessDataAsList();
        assertEquals(15, result.size());
    }

    @Test
    public void testGetChessDataAsList_InvalidJson() {
        Chessboard cb = new Chessboard();
        cb.setChessData("not valid json");
        List<List<Integer>> result = cb.getChessDataAsList();
        assertEquals(15, result.size());
        assertEquals(Integer.valueOf(0), result.get(0).get(0));
    }

    // ==================== getLastMoveAsList / setLastMoveFromList ====================

    @Test
    public void testLastMoveRoundTrip() {
        Chessboard cb = new Chessboard();
        List<List<Integer>> moves = new ArrayList<>();
        List<Integer> move = new ArrayList<>();
        move.add(3); move.add(5);
        moves.add(move);

        cb.setLastMoveFromList(moves);
        List<List<Integer>> result = cb.getLastMoveAsList();

        assertEquals(Integer.valueOf(3), result.get(0).get(0));
        assertEquals(Integer.valueOf(5), result.get(0).get(1));
    }

    @Test
    public void testGetLastMoveAsList_NullData() {
        Chessboard cb = new Chessboard();
        cb.setLastMove(null);
        List<List<Integer>> result = cb.getLastMoveAsList();
        assertEquals(5, result.size());
        assertEquals(Integer.valueOf(-1), result.get(0).get(0));
        assertEquals(Integer.valueOf(-1), result.get(0).get(1));
    }

    // ==================== updateLastMove 测试 ====================

    @Test
    public void testUpdateLastMove_FirstMove() {
        Chessboard cb = new Chessboard();
        cb.setLastMoveFromList(createEmptyLastMove());

        cb.updateLastMove(7, 7);

        List<List<Integer>> result = cb.getLastMoveAsList();
        assertEquals(5, result.size());
        assertEquals(Integer.valueOf(7), result.get(0).get(0));
        assertEquals(Integer.valueOf(7), result.get(0).get(1));
        assertEquals(Integer.valueOf(-1), result.get(1).get(0));
    }

    @Test
    public void testUpdateLastMove_MultipleSteps() {
        Chessboard cb = new Chessboard();
        cb.setLastMoveFromList(createEmptyLastMove());

        cb.updateLastMove(1, 1);
        cb.updateLastMove(2, 2);
        cb.updateLastMove(3, 3);
        cb.updateLastMove(4, 4);
        cb.updateLastMove(5, 5);

        List<List<Integer>> result = cb.getLastMoveAsList();
        assertEquals(5, result.size());
        assertEquals(Integer.valueOf(5), result.get(0).get(0));
        assertEquals(Integer.valueOf(5), result.get(0).get(1));
        assertEquals(Integer.valueOf(1), result.get(4).get(0));
        assertEquals(Integer.valueOf(1), result.get(4).get(1));
    }

    @Test
    public void testUpdateLastMove_MoreThanFive() {
        Chessboard cb = new Chessboard();
        cb.setLastMoveFromList(createEmptyLastMove());

        for (int i = 0; i < 7; i++) {
            cb.updateLastMove(i, i);
        }

        List<List<Integer>> result = cb.getLastMoveAsList();
        assertEquals(5, result.size());
        assertEquals(Integer.valueOf(6), result.get(0).get(0));
        assertEquals(Integer.valueOf(2), result.get(4).get(0));
    }

    // ==================== 辅助方法 ====================

    private List<List<Integer>> createEmptyLastMove() {
        List<List<Integer>> moves = new ArrayList<>();
        for (int i = 0; i < 5; i++) {
            List<Integer> pos = new ArrayList<>();
            pos.add(-1);
            pos.add(-1);
            moves.add(pos);
        }
        return moves;
    }
}