class GameApp {
  constructor() {
    this.currentUser = null;
    this.currentRoom = null;
    this.playerRole = null;
    this.isRoomCreator = false;
    this.gameInterval = null;
    this.hasShownVictory = false;
    this.lastChatIndex = 0;
    this.chatSendingLocal = false; // 标记本地刚发送的消息，避免重复显示

    this.init();
  }

  init() {
    if (!this.loadSessionData()) {
      return;
    }

    this.initBoard();
    this.setupEventListeners();
    this.startGamePolling();
    this.updateUI();
  }

  loadSessionData() {
    // 从sessionStorage加载用户和房间信息
    const userData = sessionStorage.getItem('currentUser');
    const roomData = sessionStorage.getItem('currentRoom');

    if (!userData || !roomData) {
      alert('未找到房间信息，请返回大厅重新加入');
      window.location.href = 'index.html';
      return false;
    }

    try {
      this.currentUser = JSON.parse(userData);
      this.currentRoom = JSON.parse(roomData);
      this.playerRole = this.currentRoom.role;
      this.isRoomCreator = this.currentRoom.isCreator;

      return true;
    } catch (error) {
      console.error('解析会话数据失败:', error);
      alert('数据加载失败，请返回大厅重新加入');
      window.location.href = 'index.html';
      return false;
    }
  }

  setupEventListeners() {
    document.getElementById('leaveRoomBtn').addEventListener('click', () => this.handleLeaveRoom());
    document.getElementById('sendMessageBtn').addEventListener('click', () => this.sendMessage());
    document.getElementById('closeVictoryBtn').addEventListener('click', () => this.returnToLobby());

    document.getElementById('messageInput').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.sendMessage();
    });
  }

  initBoard() {
    const board = document.getElementById('board');
    board.innerHTML = '';

    for (let i = 0; i < 15; i++) {
      for (let j = 0; j < 15; j++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.x = i;
        cell.dataset.y = j;
        cell.addEventListener('click', (e) => this.handleCellClick(e));
        board.appendChild(cell);
      }
    }
  }

  async handleCellClick(event) {
    if (!this.currentRoom.roomId || !this.playerRole || this.playerRole === '0') return;

    const x = parseInt(event.target.dataset.x);
    const y = parseInt(event.target.dataset.y);

    try {
      const formData = new FormData();
      formData.append('roomId', this.currentRoom.roomId);
      formData.append('userId', this.currentUser.id);
      formData.append('x', x);
      formData.append('y', y);

      const result = await apiFormRequest('/game/placeChess', formData);

      if (!result.state) {
        this.addChatMessage('系统', result.msg, true);
      }
    } catch (error) {
      console.error('落子请求失败:', error);
      this.addChatMessage('系统', '落子失败，请重试', true);
    }
  }

  updateUI() {
    // 更新房间号
    document.getElementById('currentRoomId').textContent = this.currentRoom.roomId;

    // 更新玩家角色
    document.getElementById('playerRole').textContent = this.getRoleName(this.playerRole);

    // 根据角色设置玩家名称
    if (this.playerRole === '1') {
      document.getElementById('blackPlayerName').textContent = this.currentUser.nickname;
    } else if (this.playerRole === '2') {
      document.getElementById('whitePlayerName').textContent = this.currentUser.nickname;
    }
  }

  startGamePolling() {
    if (this.gameInterval) {
      clearInterval(this.gameInterval);
    }

    this.gameInterval = setInterval(async () => {
      if (!this.currentRoom.roomId) return;

      try {
        const result = await apiRequest(`/room/state/${this.currentRoom.roomId}`);

        if (result.state) {
          this.updateGameState(result.data);
        } else {
          console.error('获取游戏状态失败:', result.msg);
        }
      } catch (error) {
        console.error('获取游戏状态失败:', error);
      }
    }, 1000);
  }

  updateGameState(gameState) {
    // 更新房间状态
    const statusText = this.getStatusName(gameState.status);
    document.getElementById('gameStatus').textContent = `状态: ${statusText}`;

    // 根据游戏状态显示/隐藏等待消息
    if (gameState.status == 1 || gameState.status == 2) {
      document.getElementById('waitingMessage').classList.add('hidden');
    } else {
      document.getElementById('waitingMessage').classList.remove('hidden');
    }

    // 更新棋盘
    this.updateBoard(gameState.chessboard, gameState.lastMove);

    // 更新回合信息
    if (gameState.status == 1) {
      document.getElementById('turnInfo').textContent = `当前回合: ${this.getRoleName(gameState.currentTurn.toString())}`;

      // 高亮当前玩家
      document.getElementById('blackPlayer').classList.remove('current-player');
      document.getElementById('whitePlayer').classList.remove('current-player');

      if (gameState.currentTurn == 1) {
        document.getElementById('blackPlayer').classList.add('current-player');
      } else if (gameState.currentTurn == 2) {
        document.getElementById('whitePlayer').classList.add('current-player');
      }
    } else {
      document.getElementById('turnInfo').textContent = '当前回合: 游戏结束';
      document.getElementById('blackPlayer').classList.remove('current-player');
      document.getElementById('whitePlayer').classList.remove('current-player');
    }

    // 更新玩家信息
    if (gameState.player1) {
      document.getElementById('blackPlayerName').textContent = gameState.player1.nickname;
    }
    if (gameState.player2) {
      document.getElementById('whitePlayerName').textContent = gameState.player2.nickname;
    }

    // 更新观战人数
    document.getElementById('spectatorCount').textContent = gameState.viewerCount;

    // 处理游戏结束状态
    if (gameState.status == 2) {
      if (!this.hasShownVictory) {
        this.showVictoryMessage(gameState.winner);
      }
    } else {
      this.hasShownVictory = false;
      document.getElementById('victoryOverlay').classList.add('hidden');
      document.getElementById('blackPlayer').classList.remove('winner-player');
      document.getElementById('whitePlayer').classList.remove('winner-player');
    }

    // 拉取新聊天消息
    this.fetchChatMessages();
  }

  async fetchChatMessages() {
    if (!this.currentRoom || !this.currentRoom.roomId || !this.currentUser || !this.currentUser.id) return;
    try {
      const result = await apiRequest(`/game/chatList/${this.currentRoom.roomId}?userId=${this.currentUser.id}&lastIndex=${this.lastChatIndex}`);
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
    } catch (error) {
      // 聊天消息拉取失败不影响游戏
    }
  }

  updateBoard(chessboard, lastMove) {
    // 清除所有棋子
    document.querySelectorAll('.piece').forEach(piece => piece.remove());
    document.querySelectorAll('.winning-line').forEach(cell => {
      cell.classList.remove('winning-line');
    });
    document.querySelectorAll('.winning-piece').forEach(piece => {
      piece.classList.remove('winning-piece');
    });

    // 绘制棋子
    for (let i = 0; i < 15; i++) {
      for (let j = 0; j < 15; j++) {
        if (chessboard[i][j] !== 0) {
          const cell = document.querySelector(`.cell[data-x="${i}"][data-y="${j}"]`);
          const piece = document.createElement('div');
          piece.className = `piece ${chessboard[i][j] === 1 ? 'black' : 'white'}`;

          // 检查是否为最后五步之一
          if (lastMove && lastMove.some(move => move[0] === i && move[1] === j)) {
            piece.classList.add('last-move');
          }

          cell.appendChild(piece);
        }
      }
    }
  }

  showVictoryMessage(winner) {
    if (this.hasShownVictory) return;
    this.hasShownVictory = true;

    let winnerText;
    if (winner === null) {
      winnerText = '平局！';
    } else {
      winnerText = `${winner === 1 ? '黑棋' : '白棋'}获胜！`;
    }

    document.getElementById('winnerName').textContent = winnerText;

    // 高亮显示获胜玩家
    document.getElementById('blackPlayer').classList.remove('winner-player');
    document.getElementById('whitePlayer').classList.remove('winner-player');

    if (winner === 1) {
      document.getElementById('blackPlayer').classList.add('winner-player');
    } else if (winner === 2) {
      document.getElementById('whitePlayer').classList.add('winner-player');
    }

    document.getElementById('victoryOverlay').classList.remove('hidden');
    this.addChatMessage('系统', `游戏结束！${winnerText}`, true);
  }

  async handleLeaveRoom() {
    try {
      const formData = new FormData();
      formData.append('roomId', this.currentRoom.roomId);
      formData.append('userId', this.currentUser.id);

      await apiFormRequest('/room/exit', formData);

      this.returnToLobby();
    } catch (error) {
      console.error('退出房间失败:', error);
      // 即使请求失败也返回大厅
      this.returnToLobby();
    }
  }

  returnToLobby() {
    // 清理游戏轮询
    if (this.gameInterval) {
      clearInterval(this.gameInterval);
      this.gameInterval = null;
    }

    // 清理会话存储
    sessionStorage.removeItem('currentRoom');
    sessionStorage.removeItem('currentUser');

    // 返回大厅
    window.location.href = 'index.html';
  }

  async sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value.trim();
    if (!message) return;

    messageInput.value = '';

    if (!this.currentRoom || !this.currentRoom.roomId || !this.currentUser || !this.currentUser.id) {
      console.error('sendMessage: 缺少房间或用户信息', this.currentRoom, this.currentUser);
      this.addChatMessage('系统', '发送失败：缺少房间或用户信息', true);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('roomId', this.currentRoom.roomId);
      formData.append('userId', this.currentUser.id);
      formData.append('message', message);

      const result = await apiFormRequest('/game/chat', formData);
      if (!result.state) {
        this.addChatMessage('系统', result.msg || '消息发送失败', true);
      }
      // 发送成功不本地显示，等轮询拉取，避免重复
    } catch (error) {
      console.error('发送消息失败:', error);
      this.addChatMessage('系统', '消息发送失败，请重试', true);
    }
  }

  addChatMessage(sender, message, isSystem = false) {
    const chatBox = document.getElementById('chatBox');
    const messageDiv = document.createElement('div');

    if (isSystem && message.includes('获胜')) {
      messageDiv.className = 'message victory-message';
    } else {
      messageDiv.className = `message ${isSystem ? 'system-message' : ''}`;
    }

    messageDiv.textContent = `${sender}: ${message}`;
    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  getRoleName(role) {
    switch(role) {
      case '1': return '黑棋(玩家一)';
      case '2': return '白棋(玩家二)';
      case '0': return '观战者';
      default: return '未知';
    }
  }

  getStatusName(status) {
    const statusNum = parseInt(status);
    switch(statusNum) {
      case 0: return '等待中';
      case 1: return '游戏中';
      case 2: return '已结束';
      default: return `未知(${status})`;
    }
  }
}

// 页面加载完成后初始化游戏
document.addEventListener('DOMContentLoaded', () => {
  // 检查用户是否已登录
  if (!AuthManager.requireAuth()) {
    return;
  }

  new GameApp();
});
