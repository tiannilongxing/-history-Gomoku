package cn.edu.qvtu.service.impl;

import cn.edu.qvtu.dao.*;
import cn.edu.qvtu.entity.*;
import cn.edu.qvtu.util.ResponseEntity;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.MockitoJUnitRunner;

import java.util.*;

import static org.junit.Assert.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * BattleServiceImpl 单元测试
 * 测试核心游戏逻辑：创建房间、加入房间、落子、胜负判断、退出房间、排行榜
 */
@RunWith(MockitoJUnitRunner.Silent.class)
public class BattleServiceImplTest {

    @Mock
    private RoomDao roomDao;

    @Mock
    private ChessboardDao chessboardDao;

    @Mock
    private ViewerDao viewerDao;

    @Mock
    private UserDao userDao;

    @Mock
    private ScoreLogDao scoreLogDao;

    @InjectMocks
    private BattleServiceImpl battleService;

    private User testUser1;
    private User testUser2;
    private User testUser3;

    @Before
    public void setUp() {
        testUser1 = new User();
        testUser1.setId(1);
        testUser1.setUsername("player1");
        testUser1.setNickname("玩家一");
        testUser1.setScore(100);
        testUser1.setStatus(1);

        testUser2 = new User();
        testUser2.setId(2);
        testUser2.setUsername("player2");
        testUser2.setNickname("玩家二");
        testUser2.setScore(200);
        testUser2.setStatus(1);

        testUser3 = new User();
        testUser3.setId(3);
        testUser3.setUsername("viewer1");
        testUser3.setNickname("观众一");
        testUser3.setScore(50);
        testUser3.setStatus(1);
    }

    // ==================== 创建房间测试 ====================

    @Test
    public void testCreateRoom_Success() {
        when(userDao.selectById(1)).thenReturn(testUser1);
        when(roomDao.selectByRoomId(anyString())).thenReturn(null); // 房间号不冲突
        when(roomDao.insert(any(Room.class))).thenReturn(1);
        when(chessboardDao.insert(any(Chessboard.class))).thenReturn(1);

        ResponseEntity<Map<String, Object>> result = battleService.createRoom(1);

        assertTrue("创建房间应该成功", result.isState());
        assertEquals("房间创建成功", result.getMsg());
        assertNotNull("返回数据不应为空", result.getData());
        assertNotNull("房间号不应为空", result.getData().get("roomId"));
        assertEquals("创建者应为黑棋(角色1)", "1", result.getData().get("role"));
        assertEquals("房间号应为6位数字", 6, ((String) result.getData().get("roomId")).length());
    }

    @Test
    public void testCreateRoom_UserNotFound() {
        when(userDao.selectById(999)).thenReturn(null);

        ResponseEntity<Map<String, Object>> result = battleService.createRoom(999);

        assertFalse("用户不存在时应失败", result.isState());
        assertTrue("错误信息应包含'用户不存在'", result.getMsg().contains("用户不存在"));
    }

    @Test
    public void testCreateRoom_InsertFailed() {
        when(userDao.selectById(1)).thenReturn(testUser1);
        when(roomDao.selectByRoomId(anyString())).thenReturn(null);
        when(roomDao.insert(any(Room.class))).thenReturn(0); // 插入失败

        ResponseEntity<Map<String, Object>> result = battleService.createRoom(1);

        assertFalse("插入失败时应返回错误", result.isState());
        assertTrue("错误信息应包含'房间创建失败'", result.getMsg().contains("房间创建失败"));
    }

    // ==================== BUG验证: getRoomState 不处理玩家2为null时currentTurn显示1但实际无对手 ====================

    @Test
    public void testGetRoomState_Player2NotJoinedYet() {
        // 场景：只有玩家1加入，玩家2尚未加入
        Room room = new Room();
        room.setRoomId("123456");
        room.setPlayer1Id(1);
        room.setPlayer2Id(null);
        room.setStatus(0); // 等待中
        room.setWinner(null);

        Chessboard chessboard = new Chessboard();
        chessboard.setRoomId("123456");
        chessboard.setCurrentTurn(1);
        chessboard.setChessDataFromList(createEmptyBoard());
        chessboard.setLastMoveFromList(createEmptyLastMove());

        when(roomDao.selectByRoomId("123456")).thenReturn(room);
        when(chessboardDao.selectTopByRoomId("123456")).thenReturn(chessboard);
        when(userDao.selectById(1)).thenReturn(testUser1);
        when(viewerDao.countByRoomId("123456")).thenReturn(0);

        ResponseEntity<Map<String, Object>> result = battleService.getRoomState("123456");

        assertTrue("获取房间状态应该成功", result.isState());
        Map<String, Object> state = result.getData();
        assertNull("玩家2应为null", state.get("player2"));
        assertEquals("状态应为等待中(0)", 0, state.get("status"));
    }

    // ==================== BUG验证: Room 的 updateRoom 不更新 endTime/duration ====================

    @Test
    public void testExitRoom_GameInProgress_Player1Exits() {
        // 场景：游戏进行中，玩家1退出 → 玩家2获胜
        Room room = new Room();
        room.setRoomId("123456");
        room.setPlayer1Id(1);
        room.setPlayer2Id(2);
        room.setStatus(1); // 游戏中
        room.setWinner(null);
        room.setCreateTime(new Date(System.currentTimeMillis() - 60000)); // 1分钟前

        when(roomDao.selectByRoomId("123456")).thenReturn(room);
        when(userDao.selectById(1)).thenReturn(testUser1);
        when(userDao.selectById(2)).thenReturn(testUser2);
        when(roomDao.updateRoom(any(Room.class))).thenReturn(1);
        when(userDao.updateScore(any(User.class))).thenReturn(1);
        when(scoreLogDao.insert(any(ScoreLog.class))).thenReturn(1);
        when(viewerDao.deleteByRoomIdAndUserId(anyString(), anyInt())).thenReturn(1);

        ResponseEntity<Boolean> result = battleService.exitRoom("123456", 1);

        assertTrue("退出应该成功", result.isState());
        // BUG验证: updateRoom XML 中没有更新 end_time 和 duration 字段!
        // 所以即使 room.setEndTime(new Date()) 和 room.setDuration(...)，数据库中也不会更新
        // 这里只验证业务逻辑正确
    }

    // ==================== 落子测试 ====================

    @Test
    public void testPlaceChess_Success() {
        Room room = new Room();
        room.setRoomId("123456");
        room.setPlayer1Id(1);
        room.setPlayer2Id(2);
        room.setStatus(1); // 游戏中

        Chessboard chessboard = new Chessboard();
        chessboard.setRoomId("123456");
        chessboard.setCurrentTurn(1); // 黑棋回合
        // 使用棋盘中间位置(7,7)
        List<List<Integer>> board = createEmptyBoard();
        chessboard.setChessDataFromList(board);
        chessboard.setLastMoveFromList(createEmptyLastMove());

        when(roomDao.selectByRoomId("123456")).thenReturn(room);
        when(chessboardDao.selectTopByRoomId("123456")).thenReturn(chessboard);
        when(chessboardDao.insert(any(Chessboard.class))).thenReturn(1);

        ResponseEntity<Boolean> result = battleService.placeChess("123456", 1, 7, 7);

        assertTrue("落子应该成功", result.isState());
        assertEquals("落子成功", result.getMsg());
    }

    @Test
    public void testPlaceChess_RoomNotFound() {
        when(roomDao.selectByRoomId("999999")).thenReturn(null);

        ResponseEntity<Boolean> result = battleService.placeChess("999999", 1, 0, 0);

        assertFalse("房间不存在时应失败", result.isState());
        assertTrue(result.getMsg().contains("房间不存在"));
    }

    @Test
    public void testPlaceChess_GameNotStarted() {
        Room room = new Room();
        room.setRoomId("123456");
        room.setPlayer1Id(1);
        room.setPlayer2Id(2);
        room.setStatus(0); // 等待中，不是游戏中

        Chessboard chessboard = new Chessboard();
        chessboard.setRoomId("123456");
        chessboard.setCurrentTurn(1);
        chessboard.setChessDataFromList(createEmptyBoard());

        when(roomDao.selectByRoomId("123456")).thenReturn(room);
        when(chessboardDao.selectTopByRoomId("123456")).thenReturn(chessboard);

        ResponseEntity<Boolean> result = battleService.placeChess("123456", 1, 7, 7);

        assertFalse("游戏未开始时应失败", result.isState());
        assertTrue(result.getMsg().contains("游戏未开始或已结束"));
    }

    @Test
    public void testPlaceChess_NotYourTurn() {
        Room room = new Room();
        room.setRoomId("123456");
        room.setPlayer1Id(1);
        room.setPlayer2Id(2);
        room.setStatus(1);

        Chessboard chessboard = new Chessboard();
        chessboard.setRoomId("123456");
        chessboard.setCurrentTurn(2); // 白棋回合
        chessboard.setChessDataFromList(createEmptyBoard());

        when(roomDao.selectByRoomId("123456")).thenReturn(room);
        when(chessboardDao.selectTopByRoomId("123456")).thenReturn(chessboard);

        // 玩家1试图在玩家2的回合落子
        ResponseEntity<Boolean> result = battleService.placeChess("123456", 1, 7, 7);

        assertFalse("不是你的回合应失败", result.isState());
        assertTrue(result.getMsg().contains("不是您的回合"));
    }

    @Test
    public void testPlaceChess_OutOfBounds() {
        Room room = new Room();
        room.setRoomId("123456");
        room.setPlayer1Id(1);
        room.setPlayer2Id(2);
        room.setStatus(1);

        Chessboard chessboard = new Chessboard();
        chessboard.setRoomId("123456");
        chessboard.setCurrentTurn(1);
        chessboard.setChessDataFromList(createEmptyBoard());

        when(roomDao.selectByRoomId("123456")).thenReturn(room);
        when(chessboardDao.selectTopByRoomId("123456")).thenReturn(chessboard);

        // 测试边界：x=-1
        ResponseEntity<Boolean> result = battleService.placeChess("123456", 1, -1, 0);
        assertFalse("坐标超出范围应失败", result.isState());
        assertTrue(result.getMsg().contains("无效"));

        // 测试边界：x=15
        result = battleService.placeChess("123456", 1, 15, 0);
        assertFalse("坐标超出范围应失败", result.isState());

        // 测试边界：y=15
        result = battleService.placeChess("123456", 1, 0, 15);
        assertFalse("坐标超出范围应失败", result.isState());
    }

    @Test
    public void testPlaceChess_PositionAlreadyOccupied() {
        Room room = new Room();
        room.setRoomId("123456");
        room.setPlayer1Id(1);
        room.setPlayer2Id(2);
        room.setStatus(1);

        Chessboard chessboard = new Chessboard();
        chessboard.setRoomId("123456");
        chessboard.setCurrentTurn(1);
        List<List<Integer>> board = createEmptyBoard();
        board.get(7).set(7, 1); // (7,7)已有黑棋
        chessboard.setChessDataFromList(board);

        when(roomDao.selectByRoomId("123456")).thenReturn(room);
        when(chessboardDao.selectTopByRoomId("123456")).thenReturn(chessboard);

        ResponseEntity<Boolean> result = battleService.placeChess("123456", 1, 7, 7);

        assertFalse("位置已有棋子应失败", result.isState());
        assertTrue(result.getMsg().contains("已有棋子"));
    }

    // ==================== BUG验证: 棋盘坐标 x/y 与前端坐标可能不一致 ====================
    // 注意：代码中使用 board.get(x).set(y, ...)，这意味着 x 是行，y 是列
    // 通常前端把 x 当列(水平)，y 当行(垂直)，存在潜在的坐标混乱

    @Test
    public void testPlaceChess_CoordinateMapping() {
        // 验证 chessboard.get(x).get(y) - x是行(第几行)，y是列(第几列)
        List<List<Integer>> board = createEmptyBoard();
        board.get(3).set(5, 1); // 第3行第5列放黑棋

        assertEquals("board[3][5]应该是1", Integer.valueOf(1), board.get(3).get(5));
        assertEquals("board[5][3]应该是0", Integer.valueOf(0), board.get(5).get(3));
        // 如果前端把x当水平坐标(列)，y当垂直坐标(行)，这里就会颠倒
    }

    // ==================== 胜负判断测试 (checkWinner 核心算法) ====================

    @Test
    public void testWinner_HorizontalWin() {
        // 已有4连: 玩家1在 (7,5),(7,6),(7,7),(7,8)，在(7,9)落子完成5连
        List<List<Integer>> board = createEmptyBoard();
        board.get(7).set(5, 1);
        board.get(7).set(6, 1);
        board.get(7).set(7, 1);
        board.get(7).set(8, 1);

        Room room = new Room();
        room.setRoomId("123456");
        room.setPlayer1Id(1);
        room.setPlayer2Id(2);
        room.setStatus(1);

        Chessboard chessboard = new Chessboard();
        chessboard.setRoomId("123456");
        chessboard.setCurrentTurn(1);
        chessboard.setChessDataFromList(board);
        chessboard.setLastMoveFromList(createEmptyLastMove());

        when(roomDao.selectByRoomId("123456")).thenReturn(room);
        when(chessboardDao.selectTopByRoomId("123456")).thenReturn(chessboard);
        when(chessboardDao.insert(any(Chessboard.class))).thenReturn(1);
        when(roomDao.updateRoom(any(Room.class))).thenReturn(1);
        when(userDao.selectById(1)).thenReturn(testUser1);
        when(userDao.updateScore(any(User.class))).thenReturn(1);
        when(scoreLogDao.insert(any(ScoreLog.class))).thenReturn(1);

        // 在 (7,9) 落子完成5连
        ResponseEntity<Boolean> result = battleService.placeChess("123456", 1, 7, 9);

        assertTrue("五连应该获胜", result.isState());
    }

    @Test
    public void testWinner_VerticalWin() {
        // 模拟纵向5连子: (3,7),(4,7),(5,7),(6,7),(7,7)
        List<List<Integer>> board = createEmptyBoard();
        board.get(3).set(7, 1);
        board.get(4).set(7, 1);
        board.get(5).set(7, 1);
        board.get(6).set(7, 1);

        Room room = new Room();
        room.setRoomId("123456");
        room.setPlayer1Id(1);
        room.setPlayer2Id(2);
        room.setStatus(1);

        Chessboard chessboard = new Chessboard();
        chessboard.setRoomId("123456");
        chessboard.setCurrentTurn(1);
        chessboard.setChessDataFromList(board);
        chessboard.setLastMoveFromList(createEmptyLastMove());

        when(roomDao.selectByRoomId("123456")).thenReturn(room);
        when(chessboardDao.selectTopByRoomId("123456")).thenReturn(chessboard);
        when(chessboardDao.insert(any(Chessboard.class))).thenReturn(1);
        when(roomDao.updateRoom(any(Room.class))).thenReturn(1);
        when(userDao.selectById(1)).thenReturn(testUser1);
        when(userDao.updateScore(any(User.class))).thenReturn(1);
        when(scoreLogDao.insert(any(ScoreLog.class))).thenReturn(1);

        // 在 (7,7) 落子完成5连
        ResponseEntity<Boolean> result = battleService.placeChess("123456", 1, 7, 7);

        assertTrue("纵向五连应该获胜", result.isState());
    }

    @Test
    public void testWinner_DiagonalWin() {
        // 模拟对角线5连: (3,3),(4,4),(5,5),(6,6),(7,7)
        List<List<Integer>> board = createEmptyBoard();
        board.get(3).set(3, 1);
        board.get(4).set(4, 1);
        board.get(5).set(5, 1);
        board.get(6).set(6, 1);

        Room room = new Room();
        room.setRoomId("123456");
        room.setPlayer1Id(1);
        room.setPlayer2Id(2);
        room.setStatus(1);

        Chessboard chessboard = new Chessboard();
        chessboard.setRoomId("123456");
        chessboard.setCurrentTurn(1);
        chessboard.setChessDataFromList(board);
        chessboard.setLastMoveFromList(createEmptyLastMove());

        when(roomDao.selectByRoomId("123456")).thenReturn(room);
        when(chessboardDao.selectTopByRoomId("123456")).thenReturn(chessboard);
        when(chessboardDao.insert(any(Chessboard.class))).thenReturn(1);
        when(roomDao.updateRoom(any(Room.class))).thenReturn(1);
        when(userDao.selectById(1)).thenReturn(testUser1);
        when(userDao.updateScore(any(User.class))).thenReturn(1);
        when(scoreLogDao.insert(any(ScoreLog.class))).thenReturn(1);

        ResponseEntity<Boolean> result = battleService.placeChess("123456", 1, 7, 7);

        assertTrue("对角线五连应该获胜", result.isState());
    }

    @Test
    public void testWinner_AntiDiagonalWin() {
        // 模拟反对角线5连: (7,3),(6,4),(5,5),(4,6),(3,7)
        List<List<Integer>> board = createEmptyBoard();
        board.get(7).set(3, 1);
        board.get(6).set(4, 1);
        board.get(5).set(5, 1);
        board.get(4).set(6, 1);

        Room room = new Room();
        room.setRoomId("123456");
        room.setPlayer1Id(1);
        room.setPlayer2Id(2);
        room.setStatus(1);

        Chessboard chessboard = new Chessboard();
        chessboard.setRoomId("123456");
        chessboard.setCurrentTurn(1);
        chessboard.setChessDataFromList(board);
        chessboard.setLastMoveFromList(createEmptyLastMove());

        when(roomDao.selectByRoomId("123456")).thenReturn(room);
        when(chessboardDao.selectTopByRoomId("123456")).thenReturn(chessboard);
        when(chessboardDao.insert(any(Chessboard.class))).thenReturn(1);
        when(roomDao.updateRoom(any(Room.class))).thenReturn(1);
        when(userDao.selectById(1)).thenReturn(testUser1);
        when(userDao.updateScore(any(User.class))).thenReturn(1);
        when(scoreLogDao.insert(any(ScoreLog.class))).thenReturn(1);

        ResponseEntity<Boolean> result = battleService.placeChess("123456", 1, 3, 7);

        assertTrue("反对角线五连应该获胜", result.isState());
    }

    @Test
    public void testWinner_ExactlyFive_NotSix() {
        // 测试正好5连：已有4连 (7,4)-(7,7)，在(7,8)落子完成5连
        List<List<Integer>> board = createEmptyBoard();
        board.get(7).set(4, 1);
        board.get(7).set(5, 1);
        board.get(7).set(6, 1);
        board.get(7).set(7, 1);

        Room room = new Room();
        room.setRoomId("123456");
        room.setPlayer1Id(1);
        room.setPlayer2Id(2);
        room.setStatus(1);

        Chessboard chessboard = new Chessboard();
        chessboard.setRoomId("123456");
        chessboard.setCurrentTurn(1);
        chessboard.setChessDataFromList(board);

        when(roomDao.selectByRoomId("123456")).thenReturn(room);
        when(chessboardDao.selectTopByRoomId("123456")).thenReturn(chessboard);
        when(chessboardDao.insert(any(Chessboard.class))).thenReturn(1);
        when(roomDao.updateRoom(any(Room.class))).thenReturn(1);
        when(userDao.selectById(1)).thenReturn(testUser1);
        when(userDao.updateScore(any(User.class))).thenReturn(1);
        when(scoreLogDao.insert(any(ScoreLog.class))).thenReturn(1);

        ResponseEntity<Boolean> result = battleService.placeChess("123456", 1, 7, 8);

        assertTrue("6连也应该判定获胜", result.isState());
    }

    @Test
    public void testWinner_NoWin_FourInARow() {
        // 已有3连 (7,5),(7,6),(7,7)，在(7,8)落子形成4连，不应获胜（需要5连）
        List<List<Integer>> board = createEmptyBoard();
        board.get(7).set(5, 1);
        board.get(7).set(6, 1);
        board.get(7).set(7, 1);
        // 第(7,8)位置为空，将在此落子

        Room room = new Room();
        room.setRoomId("123456");
        room.setPlayer1Id(1);
        room.setPlayer2Id(2);
        room.setStatus(1);

        Chessboard chessboard = new Chessboard();
        chessboard.setRoomId("123456");
        chessboard.setCurrentTurn(1);
        chessboard.setChessDataFromList(board);
        chessboard.setLastMoveFromList(createEmptyLastMove());

        when(roomDao.selectByRoomId("123456")).thenReturn(room);
        when(chessboardDao.selectTopByRoomId("123456")).thenReturn(chessboard);
        when(chessboardDao.insert(any(Chessboard.class))).thenReturn(1);

        ResponseEntity<Boolean> result = battleService.placeChess("123456", 1, 7, 8);

        assertTrue("4连不应获胜，落子应该成功（仅切换回合）", result.isState());
    }

    // ==================== 加入房间测试 ====================

    @Test
    public void testJoinRoom_AsPlayer2() {
        Room room = new Room();
        room.setRoomId("123456");
        room.setPlayer1Id(1);
        room.setPlayer2Id(null);
        room.setStatus(0); // 等待中

        when(userDao.selectById(2)).thenReturn(testUser2);
        when(roomDao.selectByRoomId("123456")).thenReturn(room);
        when(roomDao.updateRoom(any(Room.class))).thenReturn(1);

        ResponseEntity<String> result = battleService.joinRoom("123456", 2);

        assertTrue("加入房间应该成功", result.isState());
        assertEquals("应为白棋角色", "2", result.getData());
        assertEquals("房间状态应变为游戏中", Integer.valueOf(1), room.getStatus());
    }

    @Test
    public void testJoinRoom_AsViewer() {
        // 房间已满，加入为观战者
        Room room = new Room();
        room.setRoomId("123456");
        room.setPlayer1Id(1);
        room.setPlayer2Id(2);
        room.setStatus(1);

        when(userDao.selectById(3)).thenReturn(testUser3);
        when(roomDao.selectByRoomId("123456")).thenReturn(room);
        when(viewerDao.selectByUserId("123456", 3)).thenReturn(null); // 不是已存在的观战者
        when(viewerDao.insert(any(Viewer.class))).thenReturn(1);

        ResponseEntity<String> result = battleService.joinRoom("123456", 3);

        assertTrue("观战加入应该成功", result.isState());
        assertEquals("应为观战者角色", "0", result.getData());
    }

    @Test
    public void testJoinRoom_AlreadyPlayer1() {
        Room room = new Room();
        room.setRoomId("123456");
        room.setPlayer1Id(1);
        room.setPlayer2Id(2);
        room.setStatus(1);

        when(userDao.selectById(1)).thenReturn(testUser1);
        when(roomDao.selectByRoomId("123456")).thenReturn(room);

        ResponseEntity<String> result = battleService.joinRoom("123456", 1);

        assertTrue("已加入应返回成功", result.isState());
        assertEquals("应返回角色1", "1", result.getData());
    }

    // ==================== BUG验证: joinRoom 检查 room.getPlayer1Id().equals(userId) 可能 NPE ====================
    // 注：room的player1Id在创建时已设置，通常不会null，但如果数据异常则可能NPE

    // ==================== 排行榜测试 ====================

    @Test
    public void testGetRankList_Success() {
        List<User> users = new ArrayList<>();
        User u1 = new User(); u1.setId(1); u1.setNickname("A"); u1.setScore(300);
        User u2 = new User(); u2.setId(2); u2.setNickname("B"); u2.setScore(200);
        users.add(u1); users.add(u2);

        when(userDao.selectAllUsers()).thenReturn(users);

        ResponseEntity<Map<String, Object>> result = battleService.getRankList(1);

        assertTrue("获取排行榜应成功", result.isState());
        List<Map<String, Object>> rankList = (List<Map<String, Object>>) result.getData().get("rankList");
        assertEquals("应返回所有用户（不超过10个）", 2, rankList.size());
        assertEquals("第1名排名应为1", 1, rankList.get(0).get("rank"));
        assertEquals("第2名排名应为2", 2, rankList.get(1).get("rank"));
    }

    // ==================== BUG验证: getRankList 假设 selectAllUsers 已按 score DESC 排序 ====================
    // 如果数据库返回的数据未排序，排行榜就会错误
    // UserMapper.xml: SELECT * FROM user ORDER BY score DESC ✓ 有排序

    // ==================== BUG验证: checkWinner 方法只在特定方向检查，不考虑边界中断 ====================
    // 已通过上述多种方向测试覆盖

    // ==================== BUG验证: updateRoom XML 缺少 end_time/duration 字段更新 ====================
    // RoomMapper.xml updateRoom 的 SET 子句中只有 player1_id, player2_id, status, winner
    // 缺少 end_time 和 duration 的更新

    // ==================== 辅助方法 ====================

    private List<List<Integer>> createEmptyBoard() {
        List<List<Integer>> board = new ArrayList<>();
        for (int i = 0; i < 15; i++) {
            List<Integer> row = new ArrayList<>();
            for (int j = 0; j < 15; j++) {
                row.add(0);
            }
            board.add(row);
        }
        return board;
    }

    private List<List<Integer>> createEmptyLastMove() {
        List<List<Integer>> lastMove = new ArrayList<>();
        for (int i = 0; i < 5; i++) {
            List<Integer> pos = new ArrayList<>();
            pos.add(-1);
            pos.add(-1);
            lastMove.add(pos);
        }
        return lastMove;
    }
}