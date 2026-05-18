class MainApp {
  constructor() {
    this.currentUser = null;
    this.init();
  }

  init() {
    this.checkLoginStatus();
    this.setupEventListeners();
    this.testConnection();
  }

  checkLoginStatus() {
    this.currentUser = AuthManager.getCurrentUser();
    if (this.currentUser) {
      this.showMainLobby();
    } else {
      this.showLoginPanel();
    }
  }

  showLoginPanel() {
    document.getElementById('loginPanel').classList.remove('hidden');
    document.getElementById('registerPanel').classList.add('hidden');
    document.getElementById('mainLobbyPanel').classList.add('hidden');
    document.getElementById('rankPanel').classList.add('hidden');
    document.getElementById('userInfoBar').classList.add('hidden');
  }

  showRegisterPanel() {
    document.getElementById('loginPanel').classList.add('hidden');
    document.getElementById('registerPanel').classList.remove('hidden');
    document.getElementById('mainLobbyPanel').classList.add('hidden');
    document.getElementById('rankPanel').classList.add('hidden');
    document.getElementById('userInfoBar').classList.add('hidden');
  }

  showMainLobby() {
    document.getElementById('loginPanel').classList.add('hidden');
    document.getElementById('registerPanel').classList.add('hidden');
    document.getElementById('mainLobbyPanel').classList.remove('hidden');
    document.getElementById('rankPanel').classList.add('hidden');
    document.getElementById('userInfoBar').classList.remove('hidden');

    // 更新用户信息
    document.getElementById('userNickname').textContent = this.currentUser.nickname;
    document.getElementById('userScore').textContent = this.currentUser.score;

    // 刷新房间列表
    this.refreshRoomList();
  }

  showRankPanel() {
    document.getElementById('mainLobbyPanel').classList.add('hidden');
    document.getElementById('rankPanel').classList.remove('hidden');
    this.loadRankList();
  }

  setupEventListeners() {
    // 登录相关
    document.getElementById('loginBtn').addEventListener('click', () => this.handleLogin());
    document.getElementById('showRegisterBtn').addEventListener('click', () => this.showRegisterPanel());
    document.getElementById('showLoginBtn').addEventListener('click', () => this.showLoginPanel());
    document.getElementById('registerBtn').addEventListener('click', () => this.handleRegister());
    document.getElementById('logoutBtn').addEventListener('click', () => this.handleLogout());

    // 排行榜相关
    document.getElementById('rankBtn').addEventListener('click', () => this.showRankPanel());
    document.getElementById('closeRankBtn').addEventListener('click', () => this.showMainLobby());

    // 用户信息相关
    document.getElementById('updateNicknameBtn').addEventListener('click', () => this.showUpdateNicknameModal());
    document.getElementById('updatePasswordBtn').addEventListener('click', () => this.showUpdatePasswordModal());
    document.getElementById('confirmUpdateNicknameBtn').addEventListener('click', () => this.handleUpdateNickname());
    document.getElementById('cancelUpdateNicknameBtn').addEventListener('click', () => this.hideUpdateNicknameModal());
    document.getElementById('confirmUpdatePasswordBtn').addEventListener('click', () => this.handleUpdatePassword());
    document.getElementById('cancelUpdatePasswordBtn').addEventListener('click', () => this.hideUpdatePasswordModal());

    // 房间相关
    document.getElementById('createRoomBtn').addEventListener('click', () => this.handleCreateRoom());
    document.getElementById('joinRoomBtn').addEventListener('click', () => this.handleJoinRoom());
    document.getElementById('refreshRoomsBtn').addEventListener('click', () => this.refreshRoomList());

    // 回车键事件
    document.getElementById('passwordInput').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.handleLogin();
    });
    document.getElementById('regConfirmPasswordInput').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.handleRegister();
    });
    document.getElementById('roomIdInput').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.handleJoinRoom();
    });
  }

  async testConnection() {
    try {
      const response = await fetch(`${API_BASE}/health`);
      if (response.ok) {
        console.log('后端服务连接正常');
      } else {
        console.warn('后端服务连接异常:', response.status);
      }
    } catch (error) {
      console.error('后端服务连接失败:', error);
    }
  }

  async handleLogin() {
    const username = document.getElementById('usernameInput').value.trim();
    const password = document.getElementById('passwordInput').value.trim();

    if (!username || !password) {
      alert('请输入用户名和密码');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('username', username);
      formData.append('password', password);

      const result = await apiFormRequest('/user/login', formData);

      if (result.state) {
        this.currentUser = result.data;
        AuthManager.setCurrentUser(this.currentUser);
        this.showMainLobby();
        document.getElementById('usernameInput').value = '';
        document.getElementById('passwordInput').value = '';
      } else {
        alert('登录失败: ' + result.msg);
      }
    } catch (error) {
      alert('登录失败: ' + error.message);
    }
  }

  async handleRegister() {
    const username = document.getElementById('regUsernameInput').value.trim();
    const password = document.getElementById('regPasswordInput').value.trim();
    const confirmPassword = document.getElementById('regConfirmPasswordInput').value.trim();
    const nickname = document.getElementById('regNicknameInput').value.trim() || username;

    if (!username || !password) {
      alert('请输入用户名和密码');
      return;
    }

    if (password !== confirmPassword) {
      alert('两次输入的密码不一致');
      return;
    }

    try {
      const userData = {
        username: username,
        password: password,
        nickname: nickname
      };

      const result = await apiRequest('/user/register', {
        method: 'POST',
        body: JSON.stringify(userData)
      });

      if (result.state) {
        alert('注册成功，请登录');
        this.showLoginPanel();
        document.getElementById('regUsernameInput').value = '';
        document.getElementById('regPasswordInput').value = '';
        document.getElementById('regConfirmPasswordInput').value = '';
        document.getElementById('regNicknameInput').value = '';
      } else {
        alert('注册失败: ' + result.msg);
      }
    } catch (error) {
      alert('注册失败: ' + error.message);
    }
  }

  handleLogout() {
    AuthManager.clearCurrentUser();
    this.currentUser = null;
    this.showLoginPanel();
  }

  showUpdateNicknameModal() {
    document.getElementById('updateNicknameModal').classList.remove('hidden');
  }

  hideUpdateNicknameModal() {
    document.getElementById('updateNicknameModal').classList.add('hidden');
    document.getElementById('newNicknameInput').value = '';
  }

  showUpdatePasswordModal() {
    document.getElementById('updatePasswordModal').classList.remove('hidden');
  }

  hideUpdatePasswordModal() {
    document.getElementById('updatePasswordModal').classList.add('hidden');
    document.getElementById('oldPasswordInput').value = '';
    document.getElementById('newPasswordInput').value = '';
    document.getElementById('confirmNewPasswordInput').value = '';
  }

  async handleUpdateNickname() {
    const newNickname = document.getElementById('newNicknameInput').value.trim();

    if (!newNickname) {
      alert('请输入新昵称');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('userId', this.currentUser.id);
      formData.append('newNickname', newNickname);

      const result = await apiFormRequest('/user/updateNickname', formData);

      if (result.state) {
        this.currentUser.nickname = result.data;
        AuthManager.setCurrentUser(this.currentUser);
        document.getElementById('userNickname').textContent = this.currentUser.nickname;
        this.hideUpdateNicknameModal();
        alert('昵称修改成功');
      } else {
        alert('修改失败: ' + result.msg);
      }
    } catch (error) {
      alert('修改失败: ' + error.message);
    }
  }

  async handleUpdatePassword() {
    const oldPassword = document.getElementById('oldPasswordInput').value.trim();
    const newPassword = document.getElementById('newPasswordInput').value.trim();
    const confirmPassword = document.getElementById('confirmNewPasswordInput').value.trim();

    if (!oldPassword || !newPassword) {
      alert('请输入原密码和新密码');
      return;
    }

    if (newPassword !== confirmPassword) {
      alert('两次输入的新密码不一致');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('userId', this.currentUser.id);
      formData.append('oldPassword', oldPassword);
      formData.append('newPassword', newPassword);

      const result = await apiFormRequest('/user/updatePassword', formData);

      if (result.state) {
        this.hideUpdatePasswordModal();
        alert('密码修改成功，请重新登录');
        this.handleLogout();
      } else {
        alert('修改失败: ' + result.msg);
      }
    } catch (error) {
      alert('修改失败: ' + error.message);
    }
  }

  async loadRankList() {
    try {
      const result = await apiRequest(`/rank/list/${this.currentUser.id}`);

      if (result.state) {
        this.displayRankList(result.data);
      } else {
        console.error('获取排行榜失败:', result.msg);
      }
    } catch (error) {
      console.error('获取排行榜失败:', error);
    }
  }

  displayRankList(rankData) {
    const rankList = document.getElementById('rankList');
    rankList.innerHTML = '';

    document.getElementById('myRank').textContent = rankData.myRank;
    document.getElementById('myScore').textContent = rankData.myScore;

    if (rankData.rankList.length === 0) {
      rankList.innerHTML = '<div style="text-align:center;color:#888;padding:40px 20px;">暂无排名数据</div>';
      return;
    }

    const topColors = ['#FFD700', '#C0C0C0', '#CD7F32'];
    const topBadges = ['冠', '亚', '季'];

    rankData.rankList.forEach(rankInfo => {
      const rank = rankInfo.rank;
      const isTop3 = rank <= 3;

      const rankItem = document.createElement('div');
      rankItem.style.cssText = `
cursor: pointer;
transition: all 0.2s ease;
padding: 14px 16px;
margin-bottom: 8px;
border-radius: 10px;
display: flex;
align-items: center;
gap: 14px;
background: ${isTop3 ? '#fdf6e3' : '#fdf8f0'};
border: 1px solid ${isTop3 ? '#e8d8b0' : '#e8e8e8'};
`;
      rankItem.title = `点击查看 ${rankInfo.nickname} 的对局记录`;

      // 排名徽章
      let rankHtml;
      if (isTop3) {
        rankHtml = `<div style="
width: 42px; height: 42px; border-radius: 50%;
background: linear-gradient(135deg, ${topColors[rank-1]}, ${rank === 1 ? '#ffec80' : rank === 2 ? '#d4d4d4' : '#e8c896'});
display: flex; align-items: center; justify-content: center;
font-weight: 900; font-size: 1.1em; color: #fff;
text-shadow: 0 1px 2px rgba(0,0,0,0.2);
box-shadow: 0 2px 6px rgba(0,0,0,0.15);
flex-shrink: 0;
">${rank}</div>`;
      } else {
        rankHtml = `<div style="
width: 42px; height: 42px; border-radius: 50%;
background: #f0f0f0;
display: flex; align-items: center; justify-content: center;
font-weight: 700; font-size: 0.95em; color: #999;
flex-shrink: 0;
">${rank}</div>`;
      }

      rankItem.innerHTML = `
${rankHtml}
<div style="flex: 1; min-width: 0;">
  <div style="font-weight: 700; font-size: 1.05em; color: #333; margin-bottom: 2px;">
    ${rankInfo.nickname}
    ${isTop3 ? `<span style="font-size: 0.7em; background: ${topColors[rank-1]}; color: #fff; padding: 2px 6px; border-radius: 8px; margin-left: 6px; vertical-align: middle;">${topBadges[rank-1]}</span>` : ''}
  </div>
  <div style="display: flex; align-items: center; gap: 8px;">
    <div style="font-size: 0.85em; color: #888;">积分: ${rankInfo.score}</div>
    ${rankInfo.winRate != null ? `<div style="font-size: 0.8em; color: #aaa;">胜率: ${rankInfo.winRate}%</div>` : ''}
  </div>
</div>
<div style="color: #ccc; font-size: 1.2em; flex-shrink: 0;">&rsaquo;</div>
`;

      rankItem.addEventListener('click', () => {
        this.fetchAndShowUserRecord(rankInfo.userId, rankInfo.nickname);
      });
      rankItem.addEventListener('mouseenter', () => {
        rankItem.style.transform = 'translateX(4px)';
        rankItem.style.boxShadow = '0 3px 12px rgba(0,0,0,0.1)';
        rankItem.style.borderColor = isTop3 ? '#d4a843' : '#ccc';
      });
      rankItem.addEventListener('mouseleave', () => {
        rankItem.style.transform = '';
        rankItem.style.boxShadow = '';
        rankItem.style.borderColor = isTop3 ? '#e8d8b0' : '#e8e8e8';
      });
      rankList.appendChild(rankItem);
    });
  }

  async handleCreateRoom() {
    try {
      console.log('开始创建房间，用户ID:', this.currentUser.id);

      const result = await apiRequest(`/room/create/${this.currentUser.id}`, {
        method: 'POST'
      });

      if (result.state) {
        // 跳转到游戏页面，传递房间信息
        const roomInfo = {
          roomId: result.data.roomId,
          role: result.data.role,
          isCreator: true
        };

        // 存储房间信息到sessionStorage，在游戏页面使用
        sessionStorage.setItem('currentRoom', JSON.stringify(roomInfo));
        sessionStorage.setItem('currentUser', JSON.stringify(this.currentUser));

        // 跳转到游戏页面
        window.location.href = 'game.html';
      } else {
        alert('房间创建失败: ' + result.msg);
      }
    } catch (error) {
      console.error('创建房间失败:', error);
      alert('房间创建失败: ' + error.message);
    }
  }

  async handleJoinRoom() {
    const roomId = document.getElementById('roomIdInput').value.trim();
    if (roomId.length !== 6 || !/^\d+$/.test(roomId)) {
      alert('请输入6位数字房间号');
      return;
    }

    try {
      const result = await apiRequest(`/room/join?roomId=${roomId}&userId=${this.currentUser.id}`);

      if (result.state) {
        // 跳转到游戏页面，传递房间信息
        const roomInfo = {
          roomId: roomId,
          role: result.data,
          isCreator: false
        };

        // 存储房间信息到sessionStorage，在游戏页面使用
        sessionStorage.setItem('currentRoom', JSON.stringify(roomInfo));
        sessionStorage.setItem('currentUser', JSON.stringify(this.currentUser));

        // 跳转到游戏页面
        window.location.href = 'game.html';
      } else {
        alert('加入房间失败: ' + result.msg);
      }
    } catch (error) {
      console.error('加入房间失败:', error);
      alert('加入房间失败: ' + error.message);
    }
  }

  async refreshRoomList() {
    try {
      const result = await apiRequest('/room/list');

      if (result.state) {
        this.displayRoomList(result.data);
      } else {
        console.error('获取房间列表失败:', result.msg);
      }
    } catch (error) {
      console.error('获取房间列表失败:', error);
    }
  }

  displayRoomList(rooms) {
    const roomList = document.getElementById('roomList');
    roomList.innerHTML = '';

    if (rooms.length === 0) {
      roomList.innerHTML = '<div class="room-item">暂无房间</div>';
      return;
    }

    rooms.forEach(room => {
      const roomItem = document.createElement('div');
      const statusClass = room.status === 0 ? 'room-status-waiting' : room.status === 1 ? 'room-status-playing' : 'room-status-ended';
      roomItem.className = 'room-item ' + statusClass;
      roomItem.style.cursor = 'pointer';
      roomItem.style.transition = 'all 0.2s';

      const statusText = this.getStatusName(room.status);
      const player2Text = room.player2 || '等待加入';
      const canJoin = room.status === 0 && !room.player2;
      const isPlaying = room.status === 1 && room.player2;
      const canWatch = isPlaying;

      const statusColor = room.status === 0 ? '#b8860b' : room.status === 1 ? '#c0523f' : '#5a9e8f';
      const statusBg = room.status === 0 ? '#fdf6e3' : room.status === 1 ? '#fef0ee' : '#edf5f0';

      roomItem.innerHTML = `
<div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; border-radius: 8px; background: ${statusBg};">
  <div style="flex: 1;">
    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px;">
      <strong style="font-size: 1.1em;">#${room.roomId}</strong>
      <span style="font-size: 0.85em; color: ${statusColor}; font-weight: 600;">${statusText}</span>
      <span style="font-size: 0.8em; color: #888;">观战: ${room.viewerCount}人</span>
    </div>
    <div style="display: flex; gap: 20px; font-size: 0.9em; color: #555;">
      <span>⚫ 黑: ${room.player1 || '——'}</span>
      <span>⚪ 白: ${player2Text}</span>
    </div>
  </div>
  <div style="flex-shrink: 0; margin-left: 12px;">
    ${canJoin ? '<span style="background: #c8963e; color: #fff; padding: 6px 14px; border-radius: 20px; font-size: 0.85em;">加入</span>' : ''}
    ${canWatch ? '<span style="background: #c0523f; color: #fff; padding: 6px 14px; border-radius: 20px; font-size: 0.85em;">观战</span>' : ''}
    ${!canJoin && !canWatch ? '<span style="color: #888; font-size: 0.85em;">' + (room.status === 2 ? '已结束' : '已满') + '</span>' : ''}
  </div>
</div>
`;

      roomItem.addEventListener('click', () => {
        document.getElementById('roomIdInput').value = room.roomId;
        if (canJoin) {
          this.handleJoinRoom();
        } else if (canWatch) {
          this.handleJoinRoom();
        }
      });
      roomItem.addEventListener('mouseenter', () => {
        roomItem.style.transform = 'translateX(4px)';
        roomItem.style.boxShadow = '0 3px 12px rgba(160,130,90,0.12)';
      });
      roomItem.addEventListener('mouseleave', () => {
        roomItem.style.transform = '';
        roomItem.style.boxShadow = '';
      });

      roomList.appendChild(roomItem);
    });
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

  async fetchAndShowUserRecord(userId, nickname) {
    try {
      const result = await apiRequest(`/rank/userRecord/${userId}`);
      if (result.state) {
        this.showUserRecordModal(nickname || '用户', result.data);
      }
    } catch (e) {
      console.error('获取用户记录失败:', e);
    }
  }

  showUserRecordModal(nickname, data) {
    const roomList = data.roomList || [];
    const scoreLogList = data.scoreLogList || [];
    const user = data.userInfo || {};

    let html = `
<div style="padding: 10px;">
  <h3 style="margin-bottom: 15px;">${nickname} 的对局记录</h3>
  <div style="margin-bottom: 10px;">
    <span>积分: <strong>${user.score || 0}</strong></span>
  </div>
  <hr>
  <h4>参与对局 (${roomList.length})</h4>
  <div style="max-height: 200px; overflow-y: auto; margin-bottom: 15px;">`;

    if (roomList.length > 0) {
      roomList.forEach(room => {
        const statusName = this.getStatusName(room.status);
        const winnerText = room.winner === 1 ? '玩家1' : room.winner === 2 ? '玩家2' : '无';
        html += `
  <div style="padding: 8px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;">
    <div>
      <strong>房间 ${room.roomId}</strong> - ${statusName}
      ${room.winner ? ` - 获胜: ${winnerText}` : ''}
      <div style="font-size: 12px; color: #888;">${this.formatDate(room.createTime)}</div>
    </div>
    <button class="btn btn-primary btn-small view-room-detail-btn" data-roomid="${room.roomId}">查看</button>
  </div>`;
      });
    } else {
      html += '<div style="color: #888; text-align: center; padding: 10px;">暂无对局记录</div>';
    }

    html += `</div>
<h4>积分变动 (${scoreLogList.length})</h4>
<div style="max-height: 150px; overflow-y: auto;">`;

    if (scoreLogList.length > 0) {
      scoreLogList.forEach(log => {
        const color = log.changeScore > 0 ? '#2d8e5e' : '#c0392b';
        const sign = log.changeScore > 0 ? '+' : '';
        html += `
  <div style="padding: 5px; border-bottom: 1px solid #eee;">
    <span style="color: ${color}; font-weight: bold;">${sign}${log.changeScore}</span>
    - ${log.reason || '未知原因'}
    <span style="float: right; font-size: 12px; color: #888;">${this.formatDate(log.createTime)}</span>
  </div>`;
      });
    } else {
      html += '<div style="color: #888; text-align: center; padding: 10px;">暂无积分记录</div>';
    }

    html += '</div></div>';

    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    modal.innerHTML = `
<div class="modal-content" style="max-width: 500px; max-height: 70vh; overflow-y: auto;">
  ${html}
  <div style="text-align: center; margin-top: 15px;">
    <button id="closeRecordModalBtn" class="btn">关闭</button>
  </div>
</div>`;

    document.body.appendChild(modal);
    modal.querySelector('#closeRecordModalBtn').addEventListener('click', () => {
      modal.remove();
    });
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });

    // 给每个对局添加"查看"按钮事件
    modal.querySelectorAll('.view-room-detail-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const roomId = btn.getAttribute('data-roomid');
        this.viewRoomDetailFromRank(roomId);
      });
    });
  }

  async viewRoomDetailFromRank(roomId) {
    try {
      const result = await apiRequest(`/manage/room/${roomId}`);
      if (!result.state) { alert('获取房间详情失败'); return; }

      const room = result.data;
      const roomInfo = room.roomInfo || room;
      const statusMap = { '0': '等待中', '1': '游戏中', '2': '已结束' };
      const p1 = room.player1 || roomInfo.player1;
      const p2 = room.player2 || roomInfo.player2;

      // 反转棋盘列表，第一步在最前面
      let chessboardList = null;
      let totalSteps = 0;
      if (room.chessboardList && room.chessboardList.length > 0) {
        chessboardList = [...room.chessboardList].reverse();
        totalSteps = chessboardList.length;
      }

      let html = `
<div style="padding: 10px; max-height: 75vh; overflow-y: auto;">
  <h3>房间详情 - ${roomId}</h3>
  <p><strong>状态:</strong> ${statusMap[roomInfo.status] || '未知'}</p>
  <p><strong>创建时间:</strong> ${this.formatDate(roomInfo.createTime)}</p>
  <p><strong>获胜方:</strong> ${room.winner === 1 ? '玩家1 (黑棋)' : room.winner === 2 ? '玩家2 (白棋)' : '无'}</p>`;

      if (p1) html += `<p><strong>玩家1 (黑棋):</strong> ${p1.nickname || p1}</p>`;
      if (p2) html += `<p><strong>玩家2 (白棋):</strong> ${p2.nickname || p2}</p>`;
      if (roomInfo.endTime) html += `<p><strong>结束时间:</strong> ${this.formatDate(roomInfo.endTime)}</p>`;
      if (roomInfo.duration != null) html += `<p><strong>时长:</strong> ${roomInfo.duration}秒</p>`;

      if (chessboardList && totalSteps > 0) {
        html += `
  <hr>
  <p><strong>棋局回放 (共${totalSteps}步)</strong></p>
  <div style="display: flex; align-items: center; gap: 8px; margin: 10px 0;">
    <button class="btn btn-small" onclick="window._rankPrevStep('${roomId}')">&laquo; 上一步</button>
    <input type="range" min="0" max="${totalSteps - 1}" value="${totalSteps - 1}"
      id="rankSlider_${roomId}" oninput="window._rankShowStep('${roomId}', this.value)"
      style="flex: 1;">
    <button class="btn btn-small" onclick="window._rankNextStep('${roomId}', ${totalSteps})">下一步 &raquo;</button>
    <span id="rankStepDisplay_${roomId}" style="font-weight: bold; min-width: 70px; text-align: center;">${totalSteps}/${totalSteps}</span>
  </div>
  <div id="rankRoomChessboard" style="display: flex; justify-content: center; margin: 10px 0;"></div>`;
      }

      html += `</div><div style="text-align: center; margin: 15px 0;"><button id="closeRoomDetailBtn" class="btn">关闭</button></div>`;

      const roomModal = document.createElement('div');
      roomModal.className = 'modal';
      roomModal.style.display = 'flex';
      roomModal.innerHTML = `<div class="modal-content" style="max-width: 550px;">${html}</div>`;
      document.body.appendChild(roomModal);

      // 存储数据到 window 供步骤切换使用
      window._rankRoomData = window._rankRoomData || {};
      window._rankRoomData[roomId] = { chessboardList, totalSteps };

      window._rankShowStep = (rid, stepIdx) => {
        const rd = window._rankRoomData[rid];
        if (!rd) return;
        const si = parseInt(stepIdx);
        const container = document.getElementById('rankRoomChessboard');
        const slider = document.getElementById(`rankSlider_${rid}`);
        const display = document.getElementById(`rankStepDisplay_${rid}`);
        if (slider) slider.value = si;
        if (display) display.textContent = `${si + 1}/${rd.totalSteps}`;
        if (container && rd.chessboardList[si]) {
          const board = rd.chessboardList[si];
          this.renderSimpleChessboard(container, board.chessData, board.lastMove || []);
        }
      };

      window._rankPrevStep = (rid) => {
        const rd = window._rankRoomData[rid];
        if (!rd) return;
        const slider = document.getElementById(`rankSlider_${rid}`);
        const cur = slider ? parseInt(slider.value) : rd.totalSteps - 1;
        if (cur > 0) window._rankShowStep(rid, cur - 1);
      };

      window._rankNextStep = (rid, total) => {
        const rd = window._rankRoomData[rid];
        if (!rd) return;
        const slider = document.getElementById(`rankSlider_${rid}`);
        const cur = slider ? parseInt(slider.value) : 0;
        if (cur < total - 1) window._rankShowStep(rid, cur + 1);
      };

      roomModal.querySelector('#closeRoomDetailBtn').addEventListener('click', () => {
        delete window._rankRoomData[roomId];
        roomModal.remove();
      });
      roomModal.addEventListener('click', (e) => {
        if (e.target === roomModal) {
          delete window._rankRoomData[roomId];
          roomModal.remove();
        }
      });

      // 初始显示最后一步
      if (chessboardList && totalSteps > 0) {
        setTimeout(() => {
          window._rankShowStep(roomId, totalSteps - 1);
        }, 100);
      }
    } catch (e) {
      console.error('获取房间详情失败:', e);
      alert('获取房间详情失败');
    }
  }

  renderSimpleChessboard(container, chessData, lastMove) {
    if (!container || !chessData) return;
    container.innerHTML = '';
    const boardSize = chessData.length;
    const cellSize = 22;

    const board = document.createElement('div');
    board.style.display = 'grid';
    board.style.gridTemplateColumns = `repeat(${boardSize}, ${cellSize}px)`;
    board.style.gridTemplateRows = `repeat(${boardSize}, ${cellSize}px)`;
    board.style.gap = '1px';
    board.style.backgroundColor = '#8b6914';
    board.style.padding = '2px';
    board.style.border = '2px solid #8b6914';
    board.style.borderRadius = '3px';

    for (let i = 0; i < boardSize; i++) {
      for (let j = 0; j < boardSize; j++) {
        const cell = document.createElement('div');
        cell.style.backgroundColor = '#f0d9b5';
        cell.style.display = 'flex';
        cell.style.alignItems = 'center';
        cell.style.justifyContent = 'center';
        cell.style.position = 'relative';

        const dot = document.createElement('div');
        dot.style.width = '2px';
        dot.style.height = '2px';
        dot.style.backgroundColor = '#000';
        dot.style.borderRadius = '50%';
        dot.style.position = 'absolute';
        cell.appendChild(dot);

        if (chessData[i] && chessData[i][j] !== 0) {
          const piece = document.createElement('div');
          piece.style.width = `${cellSize - 4}px`;
          piece.style.height = `${cellSize - 4}px`;
          piece.style.borderRadius = '50%';
          piece.style.backgroundColor = chessData[i][j] === 1 ? '#000' : '#fff';
          piece.style.border = chessData[i][j] === 1 ? '1px solid #333' : '1px solid #ddd';
          piece.style.zIndex = '10';
          if (lastMove && lastMove.some(m => m[0] === i && m[1] === j)) {
            piece.style.boxShadow = 'inset 0 0 3px #ff0000';
          }
          cell.appendChild(piece);
        }
        board.appendChild(cell);
      }
    }
    container.appendChild(board);
  }

  formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleString('zh-CN');
  }
}

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
  new MainApp();
});
