package cn.edu.qvtu.dao;

import cn.edu.qvtu.entity.AdminLoginLog;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.Date;
import java.util.List;

@Mapper
public interface AdminLoginLogDao {

    /**
     * 插入管理员登录日志
     */
    int insert(AdminLoginLog log);

    /**
     * 根据ID查询登录日志
     */
    AdminLoginLog selectById(Integer id);

    /**
     * 多条件查询登录日志
     */
    List<AdminLoginLog> selectByCondition(
            @Param("adminId") Integer adminId,
            @Param("adminName") String adminName,
            @Param("status") Integer status,
            @Param("startTime") Date startTime,
            @Param("endTime") Date endTime
    );

    /**
     * 统计登录日志数量
     */
    int countByCondition(
            @Param("adminId") Integer adminId,
            @Param("adminName") String adminName,
            @Param("status") Integer status,
            @Param("startTime") Date startTime,
            @Param("endTime") Date endTime
    );

    /**
     * 删除登录日志
     */
    int deleteById(Integer id);

    /**
     * 批量删除登录日志
     */
    int deleteByIds(@Param("ids") List<Integer> ids);
}

