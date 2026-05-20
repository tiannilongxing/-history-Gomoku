# 游戏聊天广播功能实现文档

## 一、功能概述

在五子棋对战游戏中实现房间内聊天广播功能：

- 玩家/观战者通过发送按钮发送消息，前端捕获消息内容回传给后端
- 后端将本局消息封装成一个集合，用房间号做标识存储在内存中
- 其他玩家通过轮询从后端拉取本房间的新消息并展示
- **观战者消息隔离**：观战者发送的消息只有观战者之间可见，玩家看不到观战者的消息；观战者可以看到所有消息（包括玩家的）

---

## 二、实现步骤

### 步骤1：后端 — BattleServiceImpl 添加聊天消息缓存

**文件**：`src/main/java/cn/edu/qvtu/service/impl/BattleServiceImpl.java`

在类中添加内存缓存，用 `ConcurrentHashMap` + `CopyOnWriteArrayList` 实现线程安全的房间消息存储：

```java
// 房间聊天消息缓存：roomId -> 消息列表
private static final ConcurrentHashMap<String, CopyOnWriteArrayList<Map<String, Object>>> chatMessages = new ConcurrentHashMap<>();
```

- **ConcurrentHashMap**：以 roomId 为 key，保证多房间消息隔离，线程安全
- **CopyOnWriteArrayList**：读多写少场景下性能好，遍历时不需要加锁

### 步骤2：后端 — BattleService 接口添加聊天方法

**文件**：`src/main/java/cn/edu/qvtu/service/BattleService.java`

```java
/** 发送聊天消息 */
ResponseEntity<Boolean> sendChatMessage(String roomId, Integer userId, String message);

/** 获取聊天消息（从lastIndex开始，根据userId过滤观战者消息，返回messages+totalIndex） */
ResponseEntity<Map<String, Object>> getChatMessages(String roomId, Integer userId, Integer lastIndex);
```

### 步骤3：后端 — BattleServiceImpl 实现聊天方法

**文件**：`src/main/java/cn/edu/qvtu/service/impl/BattleServiceImpl.java`

#### sendChatMessage 实现原理

1. 验证房间和用户存在
2. **判断发送者身份**：非 player1 且非 player2 → 观战者，标记 `isViewer: true`
3. 构建消息对象，包含 `sender`、`message`、`timestamp`、`isViewer` 字段
4. 追加到房间消息列表，超过 200 条时淘汰最早的消息

```java
boolean isViewer = !room.getPlayer1Id().equals(userId)
        && (room.getPlayer2Id() == null || !room.getPlayer2Id().equals(userId));
chatMsg.put("isViewer", isViewer);
```

#### getChatMessages 实现原理

1. 根据 roomId 取出消息列表
2. **判断请求者身份**：决定是否需要过滤观战者消息
3. 用 `lastIndex` 做增量拉取（只返回服务器端从 lastIndex 位置之后的新消息）
4. **玩家**：过滤掉 `isViewer=true` 的消息，只返回玩家消息
5. **观战者**：返回所有消息
6. 返回数据结构：`{ messages: [...], totalIndex: N }`，`totalIndex` 是服务端消息总数量

```java
// 玩家看不到观战者消息，观战者可以看到所有消息
if (isViewer) {
    filteredMessages = allNewMessages;
} else {
    filteredMessages = new ArrayList<>();
    for (Map<String, Object> msg : allNewMessages) {
        if (!Boolean.TRUE.equals(msg.get("isViewer"))) {
            filteredMessages.add(msg);
        }
    }
}
```

### 步骤4：后端 — BattleController 添加聊天接口

**文件**：`src/main/java/cn/edu/qvtu/controller/BattleController.java`

```java
/** 发送聊天消息 */
@PostMapping("/game/chat")
public ResponseEntity<Boolean> sendChatMessage(@RequestParam String roomId,
                                                @RequestParam Integer userId,
                                                @RequestParam String message)

/** 获取聊天消息 */
@GetMapping("/game/chatList/{roomId}")
public ResponseEntity<Map<String, Object>> getChatMessages(@PathVariable String roomId,
                                                            @RequestParam Integer userId,
                                                            @RequestParam(required = false, defaultValue = "0") Integer lastIndex)
```

**关键设计**：POST 和 GET 使用不同路径（`/game/chat` vs `/game/chatList/{roomId}`），避免 Spring MVC 路由混淆。

### 步骤5：前端 — game.js 发送消息调用后端 API

**文件**：`src/main/webapp/js/game.js`

```javascript
async sendMessage() {
    const message = messageInput.value.trim();
    if (!message) return;
    messageInput.value = '';

    const formData = new FormData();
    formData.append('roomId', this.currentRoom.roomId);
    formData.append('userId', this.currentUser.id);
    formData.append('message', message);

    const result = await apiFormRequest('/game/chat', formData);
    // 发送成功后不本地显示，等轮询拉取，避免重复
}
```

**关键点**：发送成功后不本地 `addChatMessage`，等轮询统一拉取显示，避免同一条消息出现两次。

### 步骤6：前端 — game.js 轮询拉取聊天消息

**文件**：`src/main/webapp/js/game.js`

在 `updateGameState()` 末尾调用 `fetchChatMessages()`，随游戏状态轮询（1秒间隔）一起拉取新消息：

```javascript
async fetchChatMessages() {
    const result = await apiRequest(
        `/game/chatList/${this.currentRoom.roomId}?userId=${this.currentUser.id}&lastIndex=${this.lastChatIndex}`
    );
    if (result.state && result.data) {
        const messages = result.data.messages || [];
        messages.forEach(msg => {
            this.addChatMessage(msg.sender, msg.message);
        });
        // totalIndex是服务端消息总索引，直接用它作为下次拉取起始
        if (result.data.totalIndex !== undefined && result.data.totalIndex > this.lastChatIndex) {
            this.lastChatIndex = result.data.totalIndex;
        }
    }
}
```

### 步骤7：前端 — game.html 破缓存

**文件**：`src/main/webapp/game.html`

```html
<script src="js/auth.js?v=2"></script>
<script src="js/game.js?v=2"></script>
```

给 JS 文件加版本号参数，确保浏览器加载最新代码而非缓存旧版本。

---

## 三、核心原理

### 消息流转流程

```
发送者点击"发送"
    ↓
前端 sendMessage() → POST /game/chat (roomId, userId, message)
    ↓
后端 sendChatMessage()
    → 判断发送者身份(玩家/观战者)，标记 isViewer
    → 追加到 chatMessages[roomId] 列表
    ↓
其他玩家/观战者浏览器(每1秒轮询)
    → GET /game/chatList/{roomId}?userId=xx&lastIndex=N
    ↓
后端 getChatMessages()
    → 判断请求者身份
    → 玩家：过滤掉 isViewer=true 的消息
    → 观战者：返回全部消息
    → 返回 { messages: [...], totalIndex: M }
    ↓
前端 fetchChatMessages()
    → 遍历消息调用 addChatMessage() 渲染到聊天框
    → 更新 lastChatIndex = totalIndex（下次从该位置拉取）
```

### 增量拉取机制

- `lastChatIndex`：前端记录已拉取到的服务端消息位置
- `totalIndex`：后端返回当前消息总数量
- 每次拉取后，`lastChatIndex = totalIndex`，下次只拉取新增消息
- `totalIndex` 是服务端原始索引（包含被过滤的观战者消息），保证索引对齐不会跳过消息

### 观战者消息隔离原理

| 发送者 | 消息标记 | 玩家拉取 | 观战者拉取 |
|--------|---------|---------|-----------|
| 玩家   | isViewer=false | 可见 | 可见 |
| 观战者 | isViewer=true | 过滤掉 | 可见 |

---

## 四、注意事项

1. **消息存储在内存中**：服务重启后消息丢失，适合短时对局场景
2. **每房间最多200条**：防止内存溢出，超出后淘汰最早消息
3. **POST/GET 路径分离**：`/game/chat`(POST) 和 `/game/chatList/{roomId}`(GET) 避免路由冲突
4. **轮询频率**：与游戏状态轮询共用 1 秒间隔，无额外请求开销
