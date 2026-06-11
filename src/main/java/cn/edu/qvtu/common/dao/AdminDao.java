package cn.edu.qvtu.common.dao;

import cn.edu.qvtu.common.entity.Admin;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.Date;
import java.util.List;

@Mapper
public interface AdminDao {

    /**
     * 插入管理员
     */
    int insert(Admin admin);

    /**
     * 根据用户名查询管理员
     */
    Admin selectByUsername(String username);

    /**
     * 根据ID查询管理员
     */
    Admin selectById(Integer id);

    /**
     * 查询所有管理员
     */
    List<Admin> selectAll();

    /**
     * 多条件查询管理员列表（带分页）
     */
    List<Admin> selectByConditionWithPage(
            @Param("username") String username,
            @Param("nickname") String nickname,
            @Param("status") Integer status,
            @Param("role") Integer role,
            @Param("startTime") Date startTime,
            @Param("endTime") Date endTime,
            @Param("offset") Integer offset,
            @Param("limit") Integer limit
    );

    /**
     * 多条件查询管理员列表（不分页）
     */
    List<Admin> selectByCondition(
            @Param("username") String username,
            @Param("nickname") String nickname,
            @Param("status") Integer status,
            @Param("role") Integer role,
            @Param("startTime") Date startTime,
            @Param("endTime") Date endTime
    );

    /**
     * 统计管理员数量
     */
    int countByCondition(
            @Param("username") String username,
            @Param("nickname") String nickname,
            @Param("status") Integer status,
            @Param("role") Integer role,
            @Param("startTime") Date startTime,
            @Param("endTime") Date endTime
    );

    /**
     * 更新管理员信息
     */
    int update(Admin admin);

    /**
     * 更新最后登录信息
     */
    int updateLastLogin(@Param("id") Integer id, @Param("lastLoginTime") Date lastLoginTime,
                        @Param("lastLoginIp") String lastLoginIp);

    /**
     * 删除管理员
     */
    int delete(Integer id);

    /**
     * 批量删除管理员
     */
    int deleteByIds(@Param("ids") List<Integer> ids);
}

