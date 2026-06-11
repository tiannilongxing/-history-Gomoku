package cn.edu.qvtu.gomoku.dao;

import cn.edu.qvtu.gomoku.entity.Viewer;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.MapKey;
import org.apache.ibatis.annotations.Param;
import java.util.List;
import java.util.Map;

@Mapper
public interface ViewerDao {
    int insert(Viewer viewer);
    List<Viewer> selectByRoomId(@Param("roomId") String roomId);
    Viewer selectByUserId(@Param("roomId") String roomId, @Param("userId") Integer userId);
    int countByRoomId(@Param("roomId") String roomId);
    int deleteByRoomIdAndUserId(@Param("roomId") String roomId, @Param("userId") Integer userId);

    /**
     * 根据房间号删除所有观战记录
     */
    int deleteByRoomId(@Param("roomId") String roomId);

    // 新增方法：统计总观战人次
    Integer countTotalViewers();

    /**
     * 查询指定日期的观战人数统计
     */
    Integer countViewersByDate(@Param("date") String date);

    /**
     * 查询房间的详细观战记录（包括用户信息）
     */
    @MapKey("id")
    List<Map<String, Object>> selectViewerDetailsByRoomId(@Param("roomId") String roomId);
}