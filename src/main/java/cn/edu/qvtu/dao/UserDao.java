package cn.edu.qvtu.dao;

import cn.edu.qvtu.entity.StatisticsView;
import cn.edu.qvtu.entity.User;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.Date;
import java.util.List;

@Mapper
public interface UserDao {
    int insert(User user);
    User selectById(Integer id);
    User selectByUsername(String username);
    List<User> selectAllUsers();
    int updateNickname(User user);
    int updatePassword(User user);
    int updateScore(User user);

    // 新增方法
    int updateStatus(@Param("id") Integer id, @Param("status") Integer status);
    int updateLastLogin(@Param("id") Integer id, @Param("lastLoginTime") Date lastLoginTime,
                        @Param("lastLoginIp") String lastLoginIp);

    // 多条件查询用户列表
    List<User> selectUsersByCondition(
            @Param("username") String username,
            @Param("nickname") String nickname,
            @Param("status") Integer status,
            @Param("startTime") Date startTime,
            @Param("endTime") Date endTime
    );

    // 统计用户数量
    StatisticsView countUsers();


    // 在 UserDao.java 中添加
    /**
     * 批量更新用户信息（不更新密码）
     */
    int updateUserInfo(User user);
}

