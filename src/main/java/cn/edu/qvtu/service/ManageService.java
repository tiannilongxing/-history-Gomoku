package cn.edu.qvtu.service;

import cn.edu.qvtu.entity.*;
import cn.edu.qvtu.util.ResponseEntity;

import java.util.Date;
import java.util.List;
import java.util.Map;

/**
 * 后台管理服务接口
 * 处理用户管理、对战管理、积分管理等后台业务
 */
public interface ManageService {

    // ============ 用户管理 ============

    /**
     * 多条件查询用户列表
     */
    ResponseEntity<Map<String, Object>> getUserList(String username, String nickname, Integer status,
                                                    Date startTime, Date endTime, Integer page, Integer size);

    /**
     * 根据ID查询用户信息
     */
    ResponseEntity<User> getUserById(Integer userId);

    /**
     * 添加用户
     */
    ResponseEntity<Integer> addUser(User user);

    /**
     * 修改用户信息
     */
    ResponseEntity<Boolean> updateUser(User user);

    /**
     * 删除用户
     */
    ResponseEntity<Boolean> deleteUser(Integer userId);

    /**
     * 查询用户详情（包含对战记录、观战记录、积分记录）
     */
    ResponseEntity<Map<String, Object>> getUserDetail(Integer userId);

    // ============ 对战管理 ============

    /**
     * 多条件查询对战房间列表
     */
    ResponseEntity<Map<String, Object>> getRoomList(String roomId, Integer status, Date startTime,
                                                    Date endTime, Integer page, Integer size);

    /**
     * 根据房间号查询对战详情
     */
    ResponseEntity<Map<String, Object>> getRoomDetail(String roomId);

    // ============ 积分管理 ============

    /**
     * 多条件查询积分记录
     */
    ResponseEntity<Map<String, Object>> getScoreLogList(Integer userId, String reason, Date startTime,
                                                        Date endTime, Integer page, Integer size);

    /**
     * 根据ID查询积分记录详情
     */
    ResponseEntity<ScoreLog> getScoreLogById(Integer logId);

    // ============ 数据统计 ============

    /**
     * 获取仪表盘统计数据
     */
    ResponseEntity<Map<String, Object>> getDashboardStats();

    /**
     * 获取积分排行榜
     */
    ResponseEntity<List<Map<String, Object>>> getRankingList(Integer limit);

    /**
     * 获取近七日对战统计折线图数据
     */
    ResponseEntity<List<Map<String, Object>>> getRecentWeekRoomStats();

    /**
     * 获取房间观战记录详情
     */
    ResponseEntity<List<Map<String, Object>>> getRoomViewerDetails(String roomId);
}