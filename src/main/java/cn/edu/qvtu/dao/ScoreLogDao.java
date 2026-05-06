package cn.edu.qvtu.dao;

import cn.edu.qvtu.entity.ScoreLog;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.Date;
import java.util.List;

@Mapper
public interface ScoreLogDao {
    int insert(ScoreLog scoreLog);
    List<ScoreLog> selectByUserId(@Param("userId") Integer userId);

    // 新增方法：多条件查询积分记录
    List<ScoreLog> selectScoreLogsByCondition(
            @Param("userId") Integer userId,
            @Param("reason") String reason,
            @Param("startTime") Date startTime,
            @Param("endTime") Date endTime
    );

    // 根据ID查询单条记录
    ScoreLog selectById(@Param("id") Integer id);
}

