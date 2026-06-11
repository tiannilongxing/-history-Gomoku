package cn.edu.qvtu.gomoku.dao;

import cn.edu.qvtu.gomoku.entity.Chessboard;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface ChessboardDao {

    /**
     * 插入棋盘状态
     */
    int insert(Chessboard chessboard);

    /**
     * 查询棋盘最新状态
     */
    Chessboard selectTopByRoomId(@Param("roomId") String roomId);

    /**
     * 查询房间所有棋盘状态（时间降序）
     */
    List<Chessboard> selectByRoomId(@Param("roomId") String roomId);

    /**
     * 根据房间号删除棋盘记录
     */
    int deleteByRoomId(@Param("roomId") String roomId);
}


