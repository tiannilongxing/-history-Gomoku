package cn.edu.qvtu.dao;

import cn.edu.qvtu.entity.Room;
import cn.edu.qvtu.entity.SevenDayStats;
import cn.edu.qvtu.entity.StatisticsView;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.Date;
import java.util.List;

@Mapper
public interface RoomDao {
    int insert(Room room);
    Room selectByRoomId(String roomId);
    List<Room> selectAllRooms();
    int updateRoom(Room room);
    int deleteByRoomId(String roomId);

    // 新增方法
    int updateEndTime(@Param("roomId") String roomId, @Param("endTime") Date endTime,
                      @Param("duration") Integer duration);

    // 多条件查询房间列表
    List<Room> selectRoomsByCondition(
            @Param("roomId") String roomId,
            @Param("player1Id") Integer player1Id,
            @Param("player2Id") Integer player2Id,
            @Param("status") Integer status,
            @Param("winner") Integer winner,
            @Param("startTime") Date startTime,
            @Param("endTime") Date endTime
    );

    // 统计对局数量
    StatisticsView countBattles();

    /**
     * 查询近七日房间创建统计
     */
    List<SevenDayStats> selectRecentWeekRoomStats();

    /**
     * 查询指定日期的房间创建数量
     */
    Integer countRoomsByDate(@Param("date") String date);

    /**
     * 查询超时的房间列表（创建超过1分钟未开始）
     */
    List<Room> selectTimeoutRooms(@Param("timeoutMinutes") Integer timeoutMinutes);

    /**
     * 批量更新房间状态为超时结束
     */
    int batchUpdateRoomTimeout(@Param("roomIds") List<String> roomIds);

    /**
     * 根据房间ID更新房间状态和获胜者（用于退出判负）
     */
    int updateRoomWithWinner(@Param("roomId") String roomId,
                             @Param("status") Integer status,
                             @Param("winner") Integer winner,
                             @Param("endTime") Date endTime);
}

