package cn.edu.qvtu.task;

import cn.edu.qvtu.dao.RoomDao;
import cn.edu.qvtu.entity.Room;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * 房间定时任务
 * 处理超时房间等
 */
@Component
public class RoomTimeoutTask {

    private static final Logger logger = LoggerFactory.getLogger(RoomTimeoutTask.class);

    @Autowired
    private RoomDao roomDao;

    /**
     * 每分钟检查一次超时房间
     * 超时条件：创建超过1分钟且未开始游戏
     */
    @Scheduled(fixedDelay = 60000) // 每分钟执行一次
    @Transactional
    public void checkTimeoutRooms() {
        try {
            // 查询所有超时的房间（创建超过1分钟未开始）
            List<Room> timeoutRooms = roomDao.selectTimeoutRooms(1);

            if (timeoutRooms.isEmpty()) {
                return;
            }

            logger.info("发现 {} 个超时房间，正在处理...", timeoutRooms.size());

            // 提取房间ID
            List<String> roomIds = timeoutRooms.stream()
                    .map(Room::getRoomId)
                    .collect(Collectors.toList());

            // 批量更新房间状态为超时结束
            int updatedCount = roomDao.batchUpdateRoomTimeout(roomIds);

            logger.info("已处理 {} 个超时房间", updatedCount);

        } catch (Exception e) {
            logger.error("处理超时房间时发生错误", e);
        }
    }

    /**
     * 每天凌晨执行，清理历史数据
     */
    @Scheduled(cron = "0 0 2 * * ?") // 每天凌晨2点执行
    @Transactional
    public void cleanupOldData() {
        try {
            // 删除30天前的已完成对局记录
            // 这里可以根据实际需求实现
            logger.info("执行历史数据清理...");
        } catch (Exception e) {
            logger.error("清理历史数据时发生错误", e);
        }
    }
}