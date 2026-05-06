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
            rankList.innerHTML = '<div class="room-item">暂无排名数据</div>';
            return;
        }

        rankData.rankList.forEach(rankInfo => {
            const rankItem = document.createElement('div');
            rankItem.className = 'room-item';
            rankItem.innerHTML = `
                <strong>第${rankInfo.rank}名</strong><br>
                昵称: ${rankInfo.nickname}<br>
                积分: ${rankInfo.score}
            `;
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
            alert('创建房间失败: ' + error.message);
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
            roomItem.className = 'room-item';

            const statusText = this.getStatusName(room.status);
            const player2Text = room.player2 || '等待加入';

            roomItem.innerHTML = `
                <strong>房间号: ${room.roomId}</strong><br>
                状态: ${statusText}<br>
                玩家一: ${room.player1}<br>
                玩家二: ${player2Text}<br>
                观战: ${room.viewerCount}人
            `;

            roomItem.addEventListener('click', () => {
                document.getElementById('roomIdInput').value = room.roomId;
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
}

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
    new MainApp();
});