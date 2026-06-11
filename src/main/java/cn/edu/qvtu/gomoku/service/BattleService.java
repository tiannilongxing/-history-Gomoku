package cn.edu.qvtu.gomoku.service;

import cn.edu.qvtu.common.util.ResponseEntity;
import java.util.List;
import java.util.Map;

public interface BattleService {

    /**
     * 创建房间：roomId（6 位数字房间号）、role（创建者角色，固定为 "1" 即黑棋）
     */
    ResponseEntity<Map<String, Object>> createRoom(Integer userId);

    /**
     * 获取房间列表：roomId（房间号）、status（状态："0" 等待中 /"1" 游戏中 /"2" 已结束）、
     * player1（黑棋玩家昵称）、player2（白棋玩家昵称，未加入则为`null`）、viewerCount（观战人数）
     */
    ResponseEntity<List<Map<String, Object>>> getRoomList();

    /**
     * 加入房间："1"（黑棋）、"2"（白棋）或 "0"（观战者）
     */
    ResponseEntity<String> joinRoom(String roomId, Integer userId);

    /**
     * 获取房间状态：详细查看"9、获取房间状态"接口
     */
    ResponseEntity<Map<String, Object>> getRoomState(String roomId);

    /**
     * 退出房间：如果是房主（玩家1）结束游戏，如果是玩家2，则游戏等待，如果是观战者，则删除观战记录
     */
    ResponseEntity<Boolean> exitRoom(String roomId, Integer userId);

    /**
     * 落子操作（判断是否可以落子，落子后，判断是否决出胜负，更新房间，新增棋盘状态）
     */
    ResponseEntity<Boolean> placeChess(String roomId, Integer userId, Integer x, Integer y);

    /**
     * 获取积分排行榜：rankList: 排名列表（前 N 名，如前 10），每个元素包含`rank`（排名）、
     * nickname（昵称）、score（积分）；myRank: 当前用户的排名；myScore: 当前用户的积分；
     */
    ResponseEntity<Map<String, Object>> getRankList(Integer userId);

    /** 发送聊天消息 */
    ResponseEntity<Boolean> sendChatMessage(String roomId, Integer userId, String message);

    /** 获取聊天消息（从lastIndex开始，根据userId过滤观战者消息，返回messages+totalIndex） */
    ResponseEntity<Map<String, Object>> getChatMessages(String roomId, Integer userId, Integer lastIndex);
}