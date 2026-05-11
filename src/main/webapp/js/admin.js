// 管理员后台JS文件

// 全局变量
let currentAdmin = null;
let currentSection = 'dashboard';
let currentUserPage = 1;
let currentRoomPage = 1;
let currentScorePage = 1;
let weekStatsChart = null;
const userPageSize = 10;
const roomPageSize = 10;
const scorePageSize = 10;

// API基础URL - 根据实际部署环境修改
const API_BASE = 'http://localhost:51234';

// ============================ 初始化 ============================
document.addEventListener('DOMContentLoaded', function() {
    // 检查登录状态
    checkLoginStatus();

    // 绑定登录表单提交事件
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            await login();
        });
    }

    // 绑定模态框点击关闭事件
    const modalOverlay = document.getElementById('modalOverlay');
    if (modalOverlay) {
        modalOverlay.addEventListener('click', function(e) {
            if (e.target === this) {
                closeModal();
            }
        });
    }

    // 设置日期选择器默认值
    setupDatePickers();
});

// 设置日期选择器
function setupDatePickers() {
    const today = new Date();
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(today.getDate() - 7);

    // 格式化为 YYYY-MM-DD
    const formatDate = (date) => {
        return date.toISOString().split('T')[0];
    };

    // 设置积分管理的日期范围
    const scoreStartDate = document.getElementById('scoreStartDate');
    const scoreEndDate = document.getElementById('scoreEndDate');

    if (scoreStartDate) scoreStartDate.value = formatDate(oneWeekAgo);
    if (scoreEndDate) scoreEndDate.value = formatDate(today);
}

// ============================ 登录/登出 ============================
async function login() {
    const username = document.getElementById('username')?.value.trim();
    const password = document.getElementById('password')?.value.trim();
    const messageDiv = document.getElementById('message');

    if (!username || !password) {
        showMessage('请填写完整的登录信息', 'error');
        return;
    }

    const loginBtn = document.querySelector('.login-btn');
    if (loginBtn) {
        loginBtn.textContent = '登录中...';
        loginBtn.disabled = true;
    }

    try {
        const response = await fetch(`${API_BASE}/admin/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: username,
                password: password
            })
        });

        const result = await response.json();

        if (result.state) {
            currentAdmin = result.data;
            showMessage('登录成功', 'success');

            // 显示管理员后台页面
            setTimeout(() => {
                document.getElementById('loginPage').style.display = 'none';
                document.getElementById('adminPage').style.display = 'block';
                document.getElementById('adminName').textContent = currentAdmin.nickname;

                // 加载数据统计
                loadDashboard();
            }, 1000);
        } else {
            showMessage(result.msg || '登录失败', 'error');
        }
    } catch (error) {
        console.error('登录错误:', error);
        showMessage('网络错误，请稍后重试', 'error');
    } finally {
        if (loginBtn) {
            loginBtn.textContent = '登录';
            loginBtn.disabled = false;
        }
    }
}

async function logout() {
    try {
        const response = await fetch(`${API_BASE}/admin/logout`, {
            method: 'POST'
        });

        const result = await response.json();

        if (result.state) {
            currentAdmin = null;
            document.getElementById('adminPage').style.display = 'none';
            document.getElementById('loginPage').style.display = 'block';
            document.getElementById('username').value = '';
            document.getElementById('password').value = '';
            showMessage('已退出登录', 'success');
        }
    } catch (error) {
        console.error('退出登录失败:', error);
        // 即使请求失败也显示登录页面
        currentAdmin = null;
        document.getElementById('adminPage').style.display = 'none';
        document.getElementById('loginPage').style.display = 'block';
    }
}

async function checkLoginStatus() {
    try {
        const response = await fetch(`${API_BASE}/admin/checkStatus`);
        const result = await response.json();

        if (result.state) {
            // 已登录，显示管理员后台
            const adminResponse = await fetch(`${API_BASE}/admin/current`);
            const adminResult = await adminResponse.json();

            if (adminResult.state) {
                currentAdmin = adminResult.data;
                document.getElementById('loginPage').style.display = 'none';
                document.getElementById('adminPage').style.display = 'block';
                document.getElementById('adminName').textContent = currentAdmin.nickname;

                // 加载数据统计
                loadDashboard();
            }
        }
    } catch (error) {
        // 未登录或检查失败，保持登录页面
        console.log('未登录，显示登录页面');
    }
}

// ============================ 导航切换 ============================
function showSection(sectionId) {
    // 更新侧边栏激活状态
    document.querySelectorAll('.sidebar-item').forEach(item => {
        item.classList.remove('active');
    });
    event.currentTarget.classList.add('active');

    // 更新内容区域显示
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(sectionId + 'Section').classList.add('active');

    currentSection = sectionId;

    // 加载对应区域的数据
    switch(sectionId) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'users':
            loadUsers();
            break;
        case 'rooms':
            loadRooms();
            break;
        case 'scores':
            loadScores();
            break;
        case 'admins':
            loadAdmins();
            break;
        case 'stats':
            loadRecentWeekStats();
            break;
    }
}

// ============================ 数据统计 ============================
async function loadDashboard() {
    showLoading();
    try {
        // 获取统计数据
        const response = await fetch(`${API_BASE}/manage/dashboard/stats`);
        const result = await response.json();

        if (result.state) {
            const stats = result.data;
            const statsGrid = document.getElementById('statsGrid');

            // 根据返回的数据结构调整显示逻辑
            statsGrid.innerHTML = `
                <div class="stat-card">
                    <h3>总用户数</h3>
                    <div class="value">${stats.totalUsers || 0}</div>
                </div>
                <div class="stat-card">
                    <h3>今日新增</h3>
                    <div class="value">${stats.todayUsers || 0}</div>
                </div>
                <div class="stat-card">
                    <h3>总对局数</h3>
                    <div class="value">${stats.totalBattles || 0}</div>
                </div>
                <div class="stat-card">
                    <h3>今日对局</h3>
                    <div class="value">${stats.todayBattles || 0}</div>
                </div>
                <div class="stat-card">
                    <h3>进行中对局</h3>
                    <div class="value">${stats.activeBattles || 0}</div>
                </div>
                <div class="stat-card">
                    <h3>总观战人次</h3>
                    <div class="value">${stats.totalViewers || 0}</div>
                </div>
            `;

            // 更新详细数据
            document.getElementById('onlineUsers').textContent = stats.onlineUsers || 0;
            document.getElementById('activeRooms').textContent = stats.activeBattles || 0;
            document.getElementById('todayNewUsers').textContent = stats.todayUsers || 0;
            document.getElementById('todayBattles').textContent = stats.todayBattles || 0;

            // 获取排行榜
            const rankResponse = await fetch(`${API_BASE}/manage/ranking?limit=10`);
            const rankResult = await rankResponse.json();

            if (rankResult.state) {
                const rankings = rankResult.data;
                const rankingsList = document.getElementById('rankingsList');

                let rankingsHTML = '<h3>积分排行榜</h3>';
                if (rankings && rankings.length > 0) {
                    rankingsHTML += '<div class="rankings-list">';
                    rankings.forEach((item, index) => {
                        const medal = index < 3 ? ['🥇', '🥈', '🥉'][index] : '';
                        rankingsHTML += `
                            <div class="ranking-item ${index < 3 ? 'top-3' : ''}">
                                <div class="ranking-number">${medal}${index + 1}</div>
                                <div class="ranking-info">
                                    <div class="ranking-name">${item.nickname || '未知用户'}</div>
                                    <div class="ranking-details">
                                        <span>ID: ${item.userId || item.id || 'N/A'}</span>
                                        <span>用户名: ${item.username || '未知'}</span>
                                    </div>
                                </div>
                                <div class="ranking-score">${item.score || 0}</div>
                            </div>
                        `;
                    });
                    rankingsHTML += '</div>';
                } else {
                    rankingsHTML += '<p class="text-muted text-center">暂无排行榜数据</p>';
                }

                rankingsList.innerHTML = rankingsHTML;
            }
        }
    } catch (error) {
        console.error('加载统计数据失败:', error);
        showMessage('加载统计数据失败', 'error');
    } finally {
        hideLoading();
    }
}

function refreshDashboard() {
    loadDashboard();
    showMessage('数据已刷新', 'success');
}

// ============================ 用户管理 ============================
async function loadUsers(page = 1) {
    currentUserPage = page;
    showLoading();

    try {
        const searchText = document.getElementById('userSearch')?.value || '';
        const status = document.getElementById('userStatusFilter')?.value || '';

        let url = `${API_BASE}/manage/user/list?page=${page}&size=${userPageSize}`;
        if (searchText) url += `&username=${encodeURIComponent(searchText)}&nickname=${encodeURIComponent(searchText)}`;
        if (status) url += `&status=${status}`;

        const response = await fetch(url);
        const result = await response.json();

        if (result.state) {
            const users = result.data.list || [];
            const total = result.data.total || users.length;
            const totalPages = Math.ceil(total / userPageSize);

            const tbody = document.getElementById('usersTableBody');
            tbody.innerHTML = '';

            if (users.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="8" class="text-center">暂无用户数据</td>
                    </tr>
                `;
            } else {
                users.forEach(user => {
                    const row = `
                        <tr>
                            <td>${user.id}</td>
                            <td>${escapeHtml(user.username)}</td>
                            <td>${escapeHtml(user.nickname)}</td>
                            <td>${user.score || 0}</td>
                            <td>
                                <span class="status-badge ${user.status === 1 ? 'status-active' : 'status-inactive'}">
                                    ${user.status === 1 ? '正常' : '禁用'}
                                </span>
                            </td>
                            <td>${formatDate(user.createTime)}</td>
                            <td>${user.lastLoginTime ? formatDate(user.lastLoginTime) : '从未登录'}</td>
                            <td>
                                <div class="action-buttons">
                                    <button class="btn btn-primary btn-small" onclick="viewUserDetail(${user.id})">
                                        <span>👁️ 查看</span>
                                    </button>
                                    <button class="btn btn-warning btn-small" onclick="showEditUserModal(${user.id})">
                                        <span>✏️ 编辑</span>
                                    </button>
                                    <button class="btn btn-danger btn-small" onclick="deleteUser(${user.id})">
                                        <span>🗑️ 删除</span>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `;
                    tbody.innerHTML += row;
                });
            }

            // 更新分页
            updatePagination('usersPagination', page, totalPages, loadUsers);
        } else {
            console.error('获取用户列表失败:', result.msg);
            showMessage('获取用户列表失败: ' + result.msg, 'error');
        }
    } catch (error) {
        console.error('加载用户列表失败:', error);
        showMessage('加载用户列表失败', 'error');
    } finally {
        hideLoading();
    }
}

function searchUsers() {
    loadUsers(1);
}

async function viewUserDetail(userId) {
    showLoading();
    try {
        const response = await fetch(`${API_BASE}/manage/user/detail/${userId}`);
        const result = await response.json();

        if (result.state) {
            const user = result.data.userInfo || result.data;
            const roomList = result.data.roomList || [];
            const scoreLogList = result.data.scoreLogList || [];

            const modalContent = `
                <div class="modal-header">
                    <h3>👤 用户详情 - ${escapeHtml(user.nickname)}</h3>
                </div>
                <div style="max-height: 70vh; overflow-y: auto; padding: 20px;">
                    <div class="form-row">
                        <label>用户ID</label>
                        <input type="text" class="form-control" value="${user.id}" readonly>
                    </div>
                    <div class="form-row">
                        <label>用户名</label>
                        <input type="text" class="form-control" value="${escapeHtml(user.username)}" readonly>
                    </div>
                    <div class="form-row">
                        <label>昵称</label>
                        <input type="text" class="form-control" value="${escapeHtml(user.nickname)}" readonly>
                    </div>
                    <div class="form-row">
                        <label>积分</label>
                        <input type="text" class="form-control" value="${user.score || 0}" readonly>
                    </div>
                    <div class="form-row">
                        <label>状态</label>
                        <input type="text" class="form-control" value="${user.status === 1 ? '正常' : '禁用'}" readonly>
                    </div>
                    <div class="form-row">
                        <label>注册时间</label>
                        <input type="text" class="form-control" value="${formatDate(user.createTime)}" readonly>
                    </div>
                    <div class="form-row">
                        <label>最后登录</label>
                        <input type="text" class="form-control" value="${user.lastLoginTime ? formatDate(user.lastLoginTime) : '从未登录'}" readonly>
                    </div>
                    <div class="form-row">
                        <label>最后登录IP</label>
                        <input type="text" class="form-control" value="${user.lastLoginIp || '无记录'}" readonly>
                    </div>
                    <div class="form-row">
                        <label>对局记录</label>
                        <div style="border: 1px solid #ddd; padding: 10px; border-radius: 5px; max-height: 200px; overflow-y: auto;">
                            ${roomList.length > 0 ?
                roomList.map(room => `
                                    <div style="padding: 8px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;">
                                        <div>
                                            <strong>房间: ${escapeHtml(room.roomId)}</strong>
                                            <span class="status-badge ${room.status === 1 ? 'status-active' : room.status === 2 ? 'status-inactive' : 'status-pending'}" style="margin-left: 10px;">
                                                ${room.status === 1 ? '游戏中' : room.status === 2 ? '已结束' : '等待中'}
                                            </span>
                                            ${room.winner ? `<span style="margin-left: 10px;">获胜方: ${room.winner === 1 ? '玩家1' : '玩家2'}</span>` : ''}
                                        </div>
                                        <div style="display: flex; align-items: center; gap: 10px;">
                                            <span class="text-muted" style="font-size: 12px;">${formatDate(room.createTime)}</span>
                                            <button class="btn btn-primary btn-small" onclick="event.stopPropagation(); viewRoomDetail('${escapeHtml(room.roomId)}')">
                                                <span>查看</span>
                                            </button>
                                        </div>
                                    </div>
                                `).join('')
                : '<p class="text-muted text-center">暂无对局记录</p>'
            }
                        </div>
                    </div>
                    <div class="form-row">
                        <label>积分记录 (最近${scoreLogList.length}条)</label>
                        <div style="border: 1px solid #ddd; padding: 10px; border-radius: 5px; max-height: 200px; overflow-y: auto;">
                            ${scoreLogList.length > 0 ?
                scoreLogList.map(log => `
                                    <div style="padding: 8px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;">
                                        <div>
                                            <span class="${log.changeScore > 0 ? 'text-success' : 'text-danger'}">
                                                ${log.changeScore > 0 ? '+' : ''}${log.changeScore}
                                            </span>
                                            <span style="margin-left: 10px;">${escapeHtml(log.reason)}</span>
                                        </div>
                                        <span class="text-muted" style="font-size: 12px;">${formatDate(log.createTime)}</span>
                                    </div>
                                `).join('')
                : '<p class="text-muted text-center">暂无积分记录</p>'
            }
                        </div>
                    </div>
                </div>
                <div class="modal-actions">
                    <button class="btn btn-primary" onclick="closeModal()">关闭</button>
                </div>
            `;

            showModal(modalContent);
        } else {
            showMessage('获取用户详情失败: ' + result.msg, 'error');
        }
    } catch (error) {
        console.error('获取用户详情失败:', error);
        showMessage('获取用户详情失败', 'error');
    } finally {
        hideLoading();
    }
}

function showAddUserModal() {
    const modalContent = `
        <div class="modal-header">
            <h3>➕ 添加用户</h3>
        </div>
        <form id="addUserForm">
            <div class="form-row">
                <label>用户名 <span class="text-danger">*</span></label>
                <input type="text" class="form-control" id="addUsername" required>
            </div>
            <div class="form-row">
                <label>密码 <span class="text-danger">*</span></label>
                <input type="password" class="form-control" id="addPassword" required>
            </div>
            <div class="form-row">
                <label>确认密码 <span class="text-danger">*</span></label>
                <input type="password" class="form-control" id="addConfirmPassword" required>
            </div>
            <div class="form-row">
                <label>昵称</label>
                <input type="text" class="form-control" id="addNickname" placeholder="默认使用用户名">
            </div>
            <div class="form-row">
                <label>初始积分</label>
                <input type="number" class="form-control" id="addScore" value="0" min="0">
            </div>
            <div class="form-row">
                <label>状态</label>
                <select class="form-control" id="addStatus">
                    <option value="1">正常</option>
                    <option value="0">禁用</option>
                </select>
            </div>
            <div class="modal-actions">
                <button type="submit" class="btn btn-success">添加</button>
                <button type="button" class="btn btn-danger" onclick="closeModal()">取消</button>
            </div>
        </form>
    `;

    showModal(modalContent);

    // 添加表单提交事件
    document.getElementById('addUserForm').addEventListener('submit', async function(e) {
        e.preventDefault();

        const username = document.getElementById('addUsername').value.trim();
        const password = document.getElementById('addPassword').value;
        const confirmPassword = document.getElementById('addConfirmPassword').value;
        const nickname = document.getElementById('addNickname').value.trim() || username;
        const score = parseInt(document.getElementById('addScore').value) || 0;
        const status = parseInt(document.getElementById('addStatus').value);

        // 验证
        if (!username || !password) {
            showMessage('用户名和密码不能为空', 'error');
            return;
        }

        if (password !== confirmPassword) {
            showMessage('两次输入的密码不一致', 'error');
            return;
        }

        showLoading();
        try {
            const response = await fetch(`${API_BASE}/manage/user`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username: username,
                    password: password,
                    nickname: nickname,
                    score: score,
                    status: status
                })
            });

            const result = await response.json();

            if (result.state) {
                showMessage('添加用户成功', 'success');
                closeModal();
                loadUsers();
            } else {
                showMessage(result.msg || '添加用户失败', 'error');
            }
        } catch (error) {
            console.error('添加用户失败:', error);
            showMessage('添加用户失败', 'error');
        } finally {
            hideLoading();
        }
    });
}

async function showEditUserModal(userId) {
    showLoading();
    try {
        const response = await fetch(`${API_BASE}/manage/user/${userId}`);
        const result = await response.json();

        if (result.state) {
            const user = result.data;

            const modalContent = `
                <div class="modal-header">
                    <h3>✏️ 编辑用户 - ${escapeHtml(user.nickname)}</h3>
                </div>
                <form id="editUserForm">
                    <input type="hidden" id="editUserId" value="${user.id}">
                    <div class="form-row">
                        <label>用户名</label>
                        <input type="text" class="form-control" value="${escapeHtml(user.username)}" readonly>
                    </div>
                    <div class="form-row">
                        <label>新密码（留空不修改）</label>
                        <input type="password" class="form-control" id="editPassword">
                    </div>
                    <div class="form-row">
                        <label>确认新密码</label>
                        <input type="password" class="form-control" id="editConfirmPassword">
                    </div>
                    <div class="form-row">
                        <label>昵称</label>
                        <input type="text" class="form-control" id="editNickname" value="${escapeHtml(user.nickname)}">
                    </div>
                    <div class="form-row">
                        <label>积分</label>
                        <input type="number" class="form-control" id="editScore" value="${user.score || 0}" min="0">
                    </div>
                    <div class="form-row">
                        <label>状态</label>
                        <select class="form-control" id="editStatus">
                            <option value="1" ${user.status === 1 ? 'selected' : ''}>正常</option>
                            <option value="0" ${user.status === 0 ? 'selected' : ''}>禁用</option>
                        </select>
                    </div>
                    <div class="modal-actions">
                        <button type="submit" class="btn btn-success">保存</button>
                        <button type="button" class="btn btn-danger" onclick="closeModal()">取消</button>
                    </div>
                </form>
            `;

            showModal(modalContent);

            // 添加表单提交事件
            document.getElementById('editUserForm').addEventListener('submit', async function(e) {
                e.preventDefault();

                const password = document.getElementById('editPassword').value;
                const confirmPassword = document.getElementById('editConfirmPassword').value;
                const nickname = document.getElementById('editNickname').value.trim();
                const score = parseInt(document.getElementById('editScore').value) || 0;
                const status = parseInt(document.getElementById('editStatus').value);

                if (password && password !== confirmPassword) {
                    showMessage('两次输入的密码不一致', 'error');
                    return;
                }

                const userData = {
                    id: userId,
                    nickname: nickname,
                    score: score,
                    status: status
                };

                if (password) {
                    userData.password = password;
                }

                showLoading();
                try {
                    const response = await fetch(`${API_BASE}/manage/user`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(userData)
                    });

                    const result = await response.json();

                    if (result.state) {
                        showMessage('更新用户成功', 'success');
                        closeModal();
                        loadUsers();
                        loadScores();
                    } else {
                        showMessage(result.msg || '更新用户失败', 'error');
                    }
                } catch (error) {
                    console.error('更新用户失败:', error);
                    showMessage('更新用户失败', 'error');
                } finally {
                    hideLoading();
                }
            });
        }
    } catch (error) {
        console.error('获取用户信息失败:', error);
        showMessage('获取用户信息失败', 'error');
    } finally {
        hideLoading();
    }
}

async function deleteUser(userId) {
    if (!confirm('确定要删除这个用户吗？此操作不可恢复！')) {
        return;
    }

    showLoading();
    try {
        const response = await fetch(`${API_BASE}/manage/user/${userId}`, {
            method: 'DELETE'
        });

        const result = await response.json();

        if (result.state) {
            showMessage('删除用户成功', 'success');
            loadUsers(currentUserPage);
        } else {
            showMessage(result.msg || '删除用户失败', 'error');
        }
    } catch (error) {
        console.error('删除用户失败:', error);
        showMessage('删除用户失败', 'error');
    } finally {
        hideLoading();
    }
}

// 导出用户数据
function exportUsers() {
    showMessage('导出功能开发中...', 'info');
}

// ============================ 对战管理 ============================
async function loadRooms(page = 1) {
    currentRoomPage = page;
    showLoading();

    try {
        const roomId = document.getElementById('roomSearch')?.value || '';
        const status = document.getElementById('roomStatusFilter')?.value || '';
        const winner = document.getElementById('roomWinnerFilter')?.value || '';

        let url = `${API_BASE}/manage/room/list?page=${page}&size=${roomPageSize}`;
        if (roomId) url += `&roomId=${encodeURIComponent(roomId)}`;
        if (status) url += `&status=${status}`;
        if (winner) url += `&winner=${winner}`;

        const response = await fetch(url);
        const result = await response.json();

        if (result.state) {
            const rooms = result.data.list || [];
            const total = result.data.total || rooms.length;
            const totalPages = Math.ceil(total / roomPageSize);

            const tbody = document.getElementById('roomsTableBody');
            tbody.innerHTML = '';

            if (rooms.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="7" class="text-center">暂无房间数据</td>
                    </tr>
                `;
            } else {
                rooms.forEach(room => {
                    const statusMap = {
                        '0': '等待中',
                        '1': '游戏中',
                        '2': '已结束'
                    };

                    const row = `
                        <tr>
                            <td><strong>${room.roomId}</strong></td>
                            <td>${escapeHtml(room.player1Name || '玩家1')}</td>
                            <td>${escapeHtml(room.player2Name || '等待加入')}</td>
                            <td>
                                <span class="status-badge ${room.status === 1 ? 'status-active' :
                        room.status === 2 ? 'status-inactive' : 'status-pending'}">
                                    ${statusMap[room.status] || room.status}
                                </span>
                            </td>
                            <td>${room.winner === 1 ? '玩家1' : room.winner === 2 ? '玩家2' : '无'}</td>
                            <td>${formatDate(room.createTime)}</td>
                            <td>
                                <div class="action-buttons">
                                    <button class="btn btn-primary btn-small" onclick="viewRoomDetail('${room.roomId}')">
                                        <span>👁️ 查看</span>
                                    </button>
                                    <button class="btn btn-info btn-small" onclick="loadRoomViewerDetailsForRoom('${room.roomId}')">
                                        <span>👥 观战记录</span>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `;
                    tbody.innerHTML += row;
                });
            }

            // 更新分页
            updatePagination('roomsPagination', page, totalPages, loadRooms);
        }
    } catch (error) {
        console.error('加载房间列表失败:', error);
        showMessage('加载房间列表失败', 'error');
    } finally {
        hideLoading();
    }
}

function searchRooms() {
    loadRooms(1);
}

async function cleanupTimeoutRooms() {
    if (!confirm('确定要清理超时房间吗？这将清理创建超过1分钟未开始的房间。')) {
        return;
    }

    showLoading();
    try {
        // 调用定时任务清理接口（需要后端实现）
        const response = await fetch(`${API_BASE}/manage/room/cleanup`, {
            method: 'POST'
        });

        const result = await response.json();

        if (result.state) {
            showMessage('清理成功', 'success');
            loadRooms(currentRoomPage);
        } else {
            showMessage(result.msg || '清理失败', 'error');
        }
    } catch (error) {
        console.error('清理超时房间失败:', error);
        showMessage('清理功能暂时不可用', 'error');
    } finally {
        hideLoading();
    }
}

async function viewRoomDetail(roomId) {
    showLoading();
    try {
        const response = await fetch(`${API_BASE}/manage/room/${roomId}`);
        const result = await response.json();

        if (result.state) {
            const room = result.data;
            const statusMap = {
                '0': '等待中',
                '1': '游戏中',
                '2': '已结束'
            };

            // 构建模态框内容
            let modalContent = `
                <div class="modal-header">
                    <h3>🎮 房间详情 - ${room.roomId || room.roomInfo?.roomId}</h3>
                </div>
                <div style="max-height: 70vh; overflow-y: auto; padding: 20px;">
                    <div class="form-row">
                        <label>房间号</label>
                        <input type="text" class="form-control" value="${room.roomId || room.roomInfo?.roomId}" readonly>
                    </div>
                    <div class="form-row">
                        <label>状态</label>
                        <input type="text" class="form-control" value="${statusMap[room.status || room.roomInfo?.status] || room.status}" readonly>
                    </div>
            `;

            // 玩家1信息
            if (room.player1 || room.roomInfo?.player1) {
                const player1 = room.player1 || room.roomInfo?.player1;
                modalContent += `
                    <div class="form-row">
                        <label>玩家1 (黑棋)</label>
                        <input type="text" class="form-control" value="${escapeHtml(player1.nickname || '未知')} (ID: ${player1.userId || '未知'})" readonly>
                    </div>
                `;
            }

            // 玩家2信息
            if (room.player2 || room.roomInfo?.player2) {
                const player2 = room.player2 || room.roomInfo?.player2;
                modalContent += `
                    <div class="form-row">
                        <label>玩家2 (白棋)</label>
                        <input type="text" class="form-control" value="${escapeHtml(player2.nickname || '未知')} (ID: ${player2.userId || '未知'})" readonly>
                    </div>
                `;
            }

            modalContent += `
                    <div class="form-row">
                        <label>获胜方</label>
                        <input type="text" class="form-control" value="${room.winner === 1 ? '玩家1' : room.winner === 2 ? '玩家2' : '无'}" readonly>
                    </div>
                    <div class="form-row">
                        <label>创建时间</label>
                        <input type="text" class="form-control" value="${formatDate(room.createTime || room.roomInfo?.createTime)}" readonly>
                    </div>
            `;

            // 结束时间和时长
            if (room.endTime || room.roomInfo?.endTime) {
                modalContent += `
                    <div class="form-row">
                        <label>结束时间</label>
                        <input type="text" class="form-control" value="${formatDate(room.endTime || room.roomInfo?.endTime)}" readonly>
                    </div>
                    <div class="form-row">
                        <label>对局时长</label>
                        <input type="text" class="form-control" value="${room.duration || room.roomInfo?.duration || 0}秒" readonly>
                    </div>
                `;
            }

            // 如果有棋盘数据，显示棋盘和步骤切换
            if (room.chessboardList && room.chessboardList.length > 0) {
                // 反转棋盘列表，使得第一步在最前面
                const reversedChessboardList = [...room.chessboardList].reverse();
                const totalSteps = reversedChessboardList.length;

                modalContent += `
                    <div class="form-row">
                        <label>棋局回放 (共${totalSteps}步)</label>
                        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                            <button class="btn btn-sm btn-primary" onclick="showChessStep('${roomId}', 0)">第一步</button>
                            <button class="btn btn-sm btn-info" onclick="prevChessStep('${roomId}', ${totalSteps})" id="prevBtn_${roomId}">
                                &laquo; 上一步
                            </button>
                            <input type="range" min="0" max="${totalSteps - 1}" value="${totalSteps - 1}"
                                   class="form-range" id="stepSlider_${roomId}"
                                   oninput="updateStepDisplay('${roomId}', this.value)"
                                   style="flex: 1;">
                            <button class="btn btn-sm btn-info" onclick="nextChessStep('${roomId}', ${totalSteps})" id="nextBtn_${roomId}">
                                下一步 &raquo;
                            </button>
                            <button class="btn btn-sm btn-primary" onclick="showChessStep('${roomId}', ${totalSteps - 1})">最后一步</button>
                            <span id="stepDisplay_${roomId}" style="min-width: 80px; text-align: center; font-weight: bold;">步骤: ${totalSteps}/${totalSteps}</span>
                        </div>
                    </div>
                    <div class="form-row">
                        <div id="chessboardContainer_${roomId}" style="display: flex; justify-content: center; margin: 10px 0;">
                            <!-- 棋盘将在这里动态渲染 -->
                        </div>
                    </div>
                `;
            }

            // 如果有观战者信息
            if (room.viewerList && room.viewerList.length > 0) {
                modalContent += `
                    <div class="form-row">
                        <label>观战者 (${room.viewerList.length}人)</label>
                        <div style="max-height: 150px; overflow-y: auto; border: 1px solid #ddd; padding: 10px; border-radius: 5px;">
                `;

                room.viewerList.forEach(viewer => {
                    modalContent += `
                        <div style="padding: 5px; border-bottom: 1px solid #eee;">
                            ${escapeHtml(viewer.viewerName || '未知用户')}
                            <span class="text-muted" style="float: right; font-size: 12px;">
                                ${formatDate(viewer.viewTime)}
                            </span>
                        </div>
                    `;
                });

                modalContent += `
                        </div>
                    </div>
                `;
            } else {
                modalContent += `
                    <div class="form-row">
                        <label>观战者</label>
                        <div style="border: 1px solid #ddd; padding: 10px; border-radius: 5px;">
                            <p class="text-muted text-center">暂无观战记录</p>
                        </div>
                    </div>
                `;
            }

            modalContent += `
                </div>
                <div class="modal-actions">
                    <button class="btn btn-primary" onclick="closeModal()">关闭</button>
                </div>
            `;

            showModal(modalContent);

            // 存储房间数据到模态框元素上，方便后续使用
            const modalContentElement = document.getElementById('modalContent');
            if (room.chessboardList && room.chessboardList.length > 0) {
                room.chessboardList = [...room.chessboardList].reverse();
            }
            modalContentElement.setAttribute('data-room-data', JSON.stringify(room));

            // 如果有棋盘数据，初始显示最后一步
            if (room.chessboardList && room.chessboardList.length > 0) {
                showChessStep(roomId, room.chessboardList.length - 1);
            }
        } else {
            showMessage('获取房间详情失败: ' + result.msg, 'error');
        }
    } catch (error) {
        console.error('获取房间详情失败:', error);
        showMessage('获取房间详情失败', 'error');
    } finally {
        hideLoading();
    }
}

// 显示指定步骤的棋盘
function showChessStep(roomId, stepIndex) {
    try {
        // 获取存储的房间数据
        const modalContent = document.getElementById('modalContent');
        const roomData = JSON.parse(modalContent.getAttribute('data-room-data') || '{}');

        if (roomData.chessboardList && roomData.chessboardList[stepIndex]) {
            const chessData = roomData.chessboardList[stepIndex].chessData;
            const lastMove = roomData.chessboardList[stepIndex].lastMove || [];
            const currentTurn = roomData.chessboardList[stepIndex].currentTurn;

            // 渲染棋盘
            const boardContainer = document.getElementById(`chessboardContainer_${roomId}`);
            if (boardContainer) {
                renderChessboard(chessData, lastMove, boardContainer);

                // 更新步骤显示
                const stepDisplay = document.getElementById(`stepDisplay_${roomId}`);
                if (stepDisplay) {
                    stepDisplay.textContent = `步骤: ${stepIndex + 1}/${roomData.chessboardList.length}`;
                }

                // 更新滑块
                const slider = document.getElementById(`stepSlider_${roomId}`);
                if (slider) {
                    slider.value = stepIndex;
                }

                // 显示当前回合信息
                const turnInfo = document.createElement('div');
                turnInfo.style.textAlign = 'center';
                turnInfo.style.marginTop = '10px';
                turnInfo.style.fontWeight = 'bold';

                if (currentTurn === 0) {
                    turnInfo.textContent = '游戏结束';
                    turnInfo.style.color = '#dc3545';
                } else if (currentTurn === 1) {
                    turnInfo.textContent = '当前回合：黑棋';
                    turnInfo.style.color = '#000';
                } else if (currentTurn === 2) {
                    turnInfo.textContent = '当前回合：白棋';
                    turnInfo.style.color = '#6c757d';
                }

                // 如果已经有一个回合信息，先移除
                const existingTurnInfo = boardContainer.querySelector('.turn-info');
                if (existingTurnInfo) {
                    existingTurnInfo.remove();
                }

                turnInfo.className = 'turn-info';
                boardContainer.appendChild(turnInfo);
            }
        }
    } catch (error) {
        console.error('显示棋盘步骤失败:', error);
    }
}

// 更新步骤显示
function updateStepDisplay(roomId, stepIndex) {
    showChessStep(roomId, parseInt(stepIndex));
}

// 上一步
function prevChessStep(roomId, totalSteps) {
    const slider = document.getElementById(`stepSlider_${roomId}`);
    if (slider) {
        const currentStep = parseInt(slider.value);
        if (currentStep > 0) {
            showChessStep(roomId, currentStep - 1);
        }
    }
}

// 下一步
function nextChessStep(roomId, totalSteps) {
    const slider = document.getElementById(`stepSlider_${roomId}`);
    if (slider) {
        const currentStep = parseInt(slider.value);
        if (currentStep < totalSteps - 1) {
            showChessStep(roomId, currentStep + 1);
        }
    }
}

// 棋盘渲染函数
function renderChessboard(chessData, lastMove, container) {
    if (!container) return;

    // 清空容器
    container.innerHTML = '';

    const boardSize = 15;
    const cellSize = 25; // 每个单元格大小

    // 创建棋盘容器
    const boardContainer = document.createElement('div');
    boardContainer.className = 'board-container';
    boardContainer.style.display = 'grid';
    boardContainer.style.gridTemplateColumns = `repeat(${boardSize}, ${cellSize}px)`;
    boardContainer.style.gridTemplateRows = `repeat(${boardSize}, ${cellSize}px)`;
    boardContainer.style.gap = '1px';
    boardContainer.style.backgroundColor = '#8b4513';
    boardContainer.style.padding = '2px';
    boardContainer.style.borderRadius = '5px';
    boardContainer.style.border = '2px solid #5D2906';

    // 创建棋盘
    for (let i = 0; i < boardSize; i++) {
        for (let j = 0; j < boardSize; j++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.style.backgroundColor = '#f0d9b5';
            cell.style.display = 'flex';
            cell.style.alignItems = 'center';
            cell.style.justifyContent = 'center';
            cell.style.position = 'relative';

            // 添加网格线交点
            const dot = document.createElement('div');
            dot.style.width = '2px';
            dot.style.height = '2px';
            dot.style.backgroundColor = '#000';
            dot.style.borderRadius = '50%';
            dot.style.position = 'absolute';
            cell.appendChild(dot);

            // 如果有棋子
            if (chessData && chessData[i] && chessData[i][j] !== 0) {
                const piece = document.createElement('div');
                const isBlack = chessData[i][j] === 1;

                piece.style.width = `${cellSize - 6}px`;
                piece.style.height = `${cellSize - 6}px`;
                piece.style.borderRadius = '50%';
                piece.style.backgroundColor = isBlack ? '#000' : '#fff';
                piece.style.boxShadow = isBlack
                    ? 'inset 0 0 5px rgba(255,255,255,0.3)'
                    : 'inset 0 0 5px rgba(0,0,0,0.3)';
                piece.style.border = isBlack
                    ? '1px solid #333'
                    : '1px solid #ddd';
                piece.style.zIndex = '10';

                // 检查是否是最后几步
                if (lastMove && lastMove.some(move => move[0] === i && move[1] === j)) {
                    piece.style.boxShadow = '0 0 0 2px #ff0000, ' + piece.style.boxShadow;
                    piece.style.animation = 'pulse 1s infinite';
                }

                cell.appendChild(piece);
            }

            boardContainer.appendChild(cell);
        }
    }

    container.appendChild(boardContainer);
}

// ============================ 积分管理 ============================
async function loadScores(page = 1) {
    currentScorePage = page;
    showLoading();

    try {
        const userId = document.getElementById('scoreUserSearch')?.value || '';
        const reason = document.getElementById('scoreReasonSearch')?.value || '';
        const startDate = document.getElementById('scoreStartDate')?.value || '';
        const endDate = document.getElementById('scoreEndDate')?.value || '';

        let url = `${API_BASE}/manage/score/log/list?page=${page}&size=${scorePageSize}`;
        if (userId) url += `&userId=${userId}`;
        if (reason) url += `&reason=${encodeURIComponent(reason)}`;
        if (startDate) url += `&startTime=${startDate} 00:00:00`;
        if (endDate) url += `&endTime=${endDate} 23:59:59`;

        const response = await fetch(url);
        const result = await response.json();

        if (result.state) {
            const scores = result.data.list || [];
            const total = result.data.total || scores.length;
            const totalPages = Math.ceil(total / scorePageSize);

            const tbody = document.getElementById('scoresTableBody');
            tbody.innerHTML = '';

            if (scores.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="7" class="text-center">暂无积分记录</td>
                    </tr>
                `;
            } else {
                scores.forEach(score => {
                    const changeClass = score.changeScore > 0 ? 'text-success' : 'text-danger';
                    const changeSymbol = score.changeScore > 0 ? '+' : '';
                    const icon = score.changeScore > 0 ? '📈' : '📉';

                    const row = `
                        <tr>
                            <td>${score.id}</td>
                            <td>${score.userId}</td>
                            <td>${escapeHtml(score.nickname || '未知用户')}</td>
                            <td class="${changeClass}">
                                ${icon} ${changeSymbol}${score.changeScore}
                            </td>
                            <td>${escapeHtml(score.reason)}</td>
                            <td>${formatDate(score.createTime)}</td>
                            <td>
                                <button class="btn btn-info btn-small" onclick="viewScoreDetail(${score.id})">
                                    <span>👁️ 查看</span>
                                </button>
                            </td>
                        </tr>
                    `;
                    tbody.innerHTML += row;
                });
            }

            // 更新分页
            updatePagination('scoresPagination', page, totalPages, loadScores);
        }
    } catch (error) {
        console.error('加载积分记录失败:', error);
        showMessage('加载积分记录失败', 'error');
    } finally {
        hideLoading();
    }
}

function searchScores() {
    loadScores(1);
}

async function viewScoreDetail(logId) {
    showLoading();
    try {
        const response = await fetch(`${API_BASE}/manage/score/log/${logId}`);
        const result = await response.json();

        if (result.state) {
            const scoreLog = result.data;

            const modalContent = `
                <div class="modal-header">
                    <h3>💰 积分记录详情</h3>
                </div>
                <div style="padding: 20px;">
                    <div class="form-row">
                        <label>记录ID</label>
                        <input type="text" class="form-control" value="${scoreLog.id}" readonly>
                    </div>
                    <div class="form-row">
                        <label>用户ID</label>
                        <input type="text" class="form-control" value="${scoreLog.userId}" readonly>
                    </div>
                    <div class="form-row">
                        <label>变动积分</label>
                        <input type="text" class="form-control" value="${scoreLog.changeScore > 0 ? '+' : ''}${scoreLog.changeScore}" 
                               style="color: ${scoreLog.changeScore > 0 ? '#28a745' : '#dc3545'}; font-weight: bold;" readonly>
                    </div>
                    <div class="form-row">
                        <label>变动原因</label>
                        <textarea class="form-control" rows="3" readonly>${escapeHtml(scoreLog.reason)}</textarea>
                    </div>
                    <div class="form-row">
                        <label>变动时间</label>
                        <input type="text" class="form-control" value="${formatDate(scoreLog.createTime)}" readonly>
                    </div>
                </div>
                <div class="modal-actions">
                    <button class="btn btn-primary" onclick="closeModal()">关闭</button>
                </div>
            `;

            showModal(modalContent);
        } else {
            showMessage('获取积分记录详情失败: ' + result.msg, 'error');
        }
    } catch (error) {
        console.error('获取积分记录详情失败:', error);
        showMessage('获取积分记录详情失败', 'error');
    } finally {
        hideLoading();
    }
}

function showAddScoreModal() {
    showMessage('添加积分记录功能开发中...', 'info');
}

// ============================ 管理员管理 ============================
async function loadAdmins() {
    showLoading();
    try {
        // 使用新的接口：GET /admin/list
        const response = await fetch(`${API_BASE}/admin/list`);
        const result = await response.json();

        if (result.state) {
            const admins = result.data || [];

            const tbody = document.getElementById('adminsTableBody');
            tbody.innerHTML = '';

            if (admins.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="8" class="text-center">暂无管理员数据</td>
                    </tr>
                `;
            } else {
                admins.forEach(admin => {
                    const roleMap = {
                        '1': '普通管理员',
                        '2': '超级管理员'
                    };

                    const roleBadge = admin.role === 2 ? '👑' : '👤';

                    // 检查当前登录的管理员是否是超级管理员
                    // 只有超级管理员才能删除其他管理员
                    const canDelete = currentAdmin && currentAdmin.role === 2 && admin.role !== 2;

                    const row = `
                        <tr>
                            <td>${admin.id}</td>
                            <td>${escapeHtml(admin.username)}</td>
                            <td>${escapeHtml(admin.nickname)}</td>
                            <td>
                                <span class="status-badge ${admin.role === 2 ? 'status-active' : 'status-pending'}">
                                    ${roleBadge} ${roleMap[admin.role] || admin.role}
                                </span>
                            </td>
                            <td>
                                <span class="status-badge ${admin.status === 1 ? 'status-active' : 'status-inactive'}">
                                    ${admin.status === 1 ? '正常' : '禁用'}
                                </span>
                            </td>
                            <td>${admin.lastLoginTime ? formatDate(admin.lastLoginTime) : '从未登录'}</td>
                            <td>${formatDate(admin.createTime)}</td>
                            <td>
                                <div class="action-buttons">
                                    <button class="btn btn-warning btn-small" onclick="showEditAdminModal(${admin.id})">
                                        <span>✏️ 编辑</span>
                                    </button>
                                    ${canDelete ? `
                                    <button class="btn btn-danger btn-small" onclick="deleteAdmin(${admin.id})">
                                        <span>🗑️ 删除</span>
                                    </button>
                                    ` : ''}
                                </div>
                            </td>
                        </tr>
                    `;
                    tbody.innerHTML += row;
                });
            }
        } else {
            console.error('获取管理员列表失败:', result.msg);
            showMessage('获取管理员列表失败: ' + result.msg, 'error');
        }
    } catch (error) {
        console.error('加载管理员列表失败:', error);
        showMessage('加载管理员列表失败', 'error');
    } finally {
        hideLoading();
    }
}

function showAddAdminModal() {
    // 检查当前管理员权限
    if (!currentAdmin || currentAdmin.role !== 2) {
        showMessage('只有超级管理员可以添加管理员', 'error');
        return;
    }

    const modalContent = `
        <div class="modal-header">
            <h3>➕ 添加管理员</h3>
        </div>
        <form id="addAdminForm">
            <div class="form-row">
                <label>用户名 <span class="text-danger">*</span></label>
                <input type="text" class="form-control" id="addAdminUsername" required>
            </div>
            <div class="form-row">
                <label>密码 <span class="text-danger">*</span></label>
                <input type="password" class="form-control" id="addAdminPassword" required>
            </div>
            <div class="form-row">
                <label>确认密码 <span class="text-danger">*</span></label>
                <input type="password" class="form-control" id="addAdminConfirmPassword" required>
            </div>
            <div class="form-row">
                <label>昵称</label>
                <input type="text" class="form-control" id="addAdminNickname" placeholder="默认使用用户名">
            </div>
            <div class="form-row">
                <label>角色</label>
                <select class="form-control" id="addAdminRole">
                    <option value="1">普通管理员</option>
                    <option value="2">超级管理员</option>
                </select>
            </div>
            <div class="modal-actions">
                <button type="submit" class="btn btn-success">添加</button>
                <button type="button" class="btn btn-danger" onclick="closeModal()">取消</button>
            </div>
        </form>
    `;

    showModal(modalContent);

    // 添加表单提交事件
    document.getElementById('addAdminForm').addEventListener('submit', async function(e) {
        e.preventDefault();

        const username = document.getElementById('addAdminUsername').value.trim();
        const password = document.getElementById('addAdminPassword').value;
        const confirmPassword = document.getElementById('addAdminConfirmPassword').value;
        const nickname = document.getElementById('addAdminNickname').value.trim() || username;
        const role = parseInt(document.getElementById('addAdminRole').value);

        if (!username || !password) {
            showMessage('用户名和密码不能为空', 'error');
            return;
        }

        if (password !== confirmPassword) {
            showMessage('两次输入的密码不一致', 'error');
            return;
        }

        showLoading();
        try {
            const response = await fetch(`${API_BASE}/admin/add`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username: username,
                    password: password,
                    nickname: nickname,
                    role: role,
                    status: 1
                })
            });

            const result = await response.json();

            if (result.state) {
                showMessage('添加管理员成功', 'success');
                closeModal();
                loadAdmins();
            } else {
                showMessage(result.msg || '添加管理员失败', 'error');
            }
        } catch (error) {
            console.error('添加管理员失败:', error);
            showMessage('添加管理员失败', 'error');
        } finally {
            hideLoading();
        }
    });
}

async function showEditAdminModal(adminId) {
    showLoading();
    try {
        const response = await fetch(`${API_BASE}/admin/info/${adminId}`);
        const result = await response.json();

        if (result.state) {
            const admin = result.data;

            // 检查权限：只有超级管理员可以编辑其他管理员
            if (currentAdmin && currentAdmin.role !== 2 && admin.id !== currentAdmin.adminId) {
                showMessage('只有超级管理员可以编辑其他管理员', 'error');
                hideLoading();
                return;
            }

            const modalContent = `
                <div class="modal-header">
                    <h3>✏️ 编辑管理员 - ${escapeHtml(admin.nickname)}</h3>
                </div>
                <form id="editAdminForm">
                    <div class="form-row">
                        <label>用户名</label>
                        <input type="text" class="form-control" value="${escapeHtml(admin.username)}" readonly>
                    </div>
                    <div class="form-row">
                        <label>新密码（留空不修改）</label>
                        <input type="password" class="form-control" id="editAdminPassword">
                    </div>
                    <div class="form-row">
                        <label>确认新密码</label>
                        <input type="password" class="form-control" id="editAdminConfirmPassword">
                    </div>
                    <div class="form-row">
                        <label>昵称</label>
                        <input type="text" class="form-control" id="editAdminNickname" value="${escapeHtml(admin.nickname)}">
                    </div>
                    <div class="form-row">
                        <label>角色</label>
                        <select class="form-control" id="editAdminRole" ${currentAdmin && currentAdmin.role !== 2 ? 'disabled' : ''}>
                            <option value="1" ${admin.role === 1 ? 'selected' : ''}>普通管理员</option>
                            <option value="2" ${admin.role === 2 ? 'selected' : ''}>超级管理员</option>
                        </select>
                    </div>
                    <div class="form-row">
                        <label>状态</label>
                        <select class="form-control" id="editAdminStatus">
                            <option value="1" ${admin.status === 1 ? 'selected' : ''}>正常</option>
                            <option value="0" ${admin.status === 0 ? 'selected' : ''}>禁用</option>
                        </select>
                    </div>
                    <div class="modal-actions">
                        <button type="submit" class="btn btn-success">保存</button>
                        <button type="button" class="btn btn-danger" onclick="closeModal()">取消</button>
                    </div>
                </form>
            `;

            showModal(modalContent);

            // 添加表单提交事件
            document.getElementById('editAdminForm').addEventListener('submit', async function(e) {
                e.preventDefault();

                const password = document.getElementById('editAdminPassword').value;
                const confirmPassword = document.getElementById('editAdminConfirmPassword').value;
                const nickname = document.getElementById('editAdminNickname').value.trim();
                const role = parseInt(document.getElementById('editAdminRole').value);
                const status = parseInt(document.getElementById('editAdminStatus').value);

                if (password && password !== confirmPassword) {
                    showMessage('两次输入的密码不一致', 'error');
                    return;
                }

                const adminData = {
                    id: adminId,
                    nickname: nickname,
                    status: status
                };

                // 只有超级管理员可以修改角色
                if (currentAdmin && currentAdmin.role === 2) {
                    adminData.role = role;
                }

                if (password) {
                    adminData.password = password;
                }

                showLoading();
                try {
                    const response = await fetch(`${API_BASE}/admin/info`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(adminData)
                    });

                    const result = await response.json();

                    if (result.state) {
                        showMessage('更新管理员成功', 'success');
                        closeModal();
                        loadAdmins();
                    } else {
                        showMessage(result.msg || '更新管理员失败', 'error');
                    }
                } catch (error) {
                    console.error('更新管理员失败:', error);
                    showMessage('更新管理员失败', 'error');
                } finally {
                    hideLoading();
                }
            });
        }
    } catch (error) {
        console.error('获取管理员信息失败:', error);
        showMessage('获取管理员信息失败', 'error');
    } finally {
        hideLoading();
    }
}

async function deleteAdmin(adminId) {
    if (!confirm('确定要删除这个管理员吗？此操作不可恢复！')) {
        return;
    }

    showLoading();
    try {
        const response = await fetch(`${API_BASE}/admin/${adminId}`, {
            method: 'DELETE'
        });

        const result = await response.json();

        if (result.state) {
            showMessage('删除管理员成功', 'success');
            loadAdmins();
        } else {
            showMessage(result.msg || '删除管理员失败', 'error');
        }
    } catch (error) {
        console.error('删除管理员失败:', error);
        showMessage('删除管理员失败', 'error');
    } finally {
        hideLoading();
    }
}

// ============================ 详细统计功能 ============================
async function loadRecentWeekStats() {
    showLoading();
    try {
        const response = await fetch(`${API_BASE}/manage/stats/recent-week`);
        const result = await response.json();

        if (result.state) {
            const stats = result.data;

            // 更新统计数据摘要
            let totalRooms = 0;
            let totalViewers = 0;
            let totalGames = 0;

            stats.forEach(day => {
                totalRooms += day.roomCount || 0;
                totalViewers += day.viewerCount || 0;
                totalGames += day.gameCount || 0;
            });

            document.getElementById('totalRooms7Days').textContent = totalRooms;
            document.getElementById('totalViewers7Days').textContent = totalViewers;
            document.getElementById('totalGames7Days').textContent = totalGames;

            // 绘制图表
            renderWeekStatsChart(stats);
        } else {
            showMessage('获取近七日统计失败: ' + result.msg, 'error');
        }
    } catch (error) {
        console.error('加载近七日统计失败:', error);
        showMessage('加载近七日统计失败', 'error');
    } finally {
        hideLoading();
    }
}

function renderWeekStatsChart(stats) {
    const ctx = document.getElementById('weekStatsChart').getContext('2d');

    // 如果已有图表实例，销毁它
    if (weekStatsChart) {
        weekStatsChart.destroy();
    }

    // 准备数据
    const dates = stats.map(day => day.date);
    const roomCounts = stats.map(day => day.roomCount || 0);
    const viewerCounts = stats.map(day => day.viewerCount || 0);
    const gameCounts = stats.map(day => day.gameCount || 0);

    // 创建图表
    weekStatsChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [
                {
                    label: '房间创建数',
                    data: roomCounts,
                    borderColor: '#1a2a6c',
                    backgroundColor: 'rgba(26, 42, 108, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.3
                },
                {
                    label: '观战人数',
                    data: viewerCounts,
                    borderColor: '#b21f1f',
                    backgroundColor: 'rgba(178, 31, 31, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.3
                },
                {
                    label: '对局完成数',
                    data: gameCounts,
                    borderColor: '#fdbb2d',
                    backgroundColor: 'rgba(253, 187, 45, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.3
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: '近七日对战统计'
                },
                tooltip: {
                    mode: 'index',
                    intersect: false
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'nearest'
            }
        }
    });
}

async function loadRoomViewerDetails() {
    const roomId = document.getElementById('viewerRoomSearch')?.value.trim();

    if (!roomId) {
        showMessage('请输入房间号', 'error');
        return;
    }

    showLoading();
    try {
        const response = await fetch(`${API_BASE}/manage/stats/viewer-details/${roomId}`);
        const result = await response.json();

        if (result.state) {
            const viewers = result.data;
            displayViewerDetails(roomId, viewers);
        } else {
            showMessage('获取观战记录失败: ' + result.msg, 'error');
        }
    } catch (error) {
        console.error('加载观战记录失败:', error);
        showMessage('加载观战记录失败', 'error');
    } finally {
        hideLoading();
    }
}

async function loadRoomViewerDetailsForRoom(roomId) {
    showLoading();
    try {
        const response = await fetch(`${API_BASE}/manage/stats/viewer-details/${roomId}`);
        const result = await response.json();

        if (result.state) {
            const viewers = result.data;

            // 显示在模态框中
            let modalContent = `
                <div class="modal-header">
                    <h3>👥 观战记录 - ${roomId}</h3>
                </div>
                <div style="max-height: 70vh; overflow-y: auto; padding: 20px;">
            `;

            if (viewers.length === 0) {
                modalContent += `
                    <div class="text-center" style="padding: 40px;">
                        <h4>暂无观战记录</h4>
                        <p class="text-muted">该房间没有观战者</p>
                    </div>
                `;
            } else {
                modalContent += `
                    <div class="viewer-list-container">
                `;

                viewers.forEach(viewer => {
                    const firstLetter = viewer.nickname ? viewer.nickname.charAt(0).toUpperCase() : '?';
                    const joinTime = viewer.join_time ? formatDate(viewer.join_time) : '未知时间';

                    modalContent += `
                        <div class="viewer-item">
                            <div class="viewer-info">
                                <div class="viewer-avatar">${firstLetter}</div>
                                <div class="viewer-details">
                                    <div class="viewer-name">${escapeHtml(viewer.nickname || '未知用户')}</div>
                                    <div class="viewer-time">${joinTime}</div>
                                </div>
                            </div>
                            <div class="viewer-score">积分: ${viewer.score || 0}</div>
                        </div>
                    `;
                });

                modalContent += `
                    </div>
                    <div style="text-align: center; margin-top: 10px; color: #666;">
                        共 ${viewers.length} 人观战
                    </div>
                `;
            }

            modalContent += `
                </div>
                <div class="modal-actions">
                    <button class="btn btn-primary" onclick="closeModal()">关闭</button>
                </div>
            `;

            showModal(modalContent);
        } else {
            showMessage('获取观战记录失败: ' + result.msg, 'error');
        }
    } catch (error) {
        console.error('获取观战记录失败:', error);
        showMessage('获取观战记录失败', 'error');
    } finally {
        hideLoading();
    }
}

function displayViewerDetails(roomId, viewers) {
    const contentDiv = document.getElementById('viewerDetailsContent');

    if (!viewers || viewers.length === 0) {
        contentDiv.innerHTML = `
            <div class="text-center" style="padding: 40px;">
                <h4>房间 ${roomId} 暂无观战记录</h4>
                <p class="text-muted">该房间没有观战者</p>
            </div>
        `;
        return;
    }

    let html = `
        <h4 style="margin-bottom: 15px;">房间 ${roomId} 观战记录 (共 ${viewers.length} 人)</h4>
        <div class="viewer-list-container">
    `;

    viewers.forEach(viewer => {
        const firstLetter = viewer.nickname ? viewer.nickname.charAt(0).toUpperCase() : '?';
        const joinTime = viewer.join_time ? formatDate(viewer.join_time) : '未知时间';

        html += `
            <div class="viewer-item">
                <div class="viewer-info">
                    <div class="viewer-avatar">${firstLetter}</div>
                    <div class="viewer-details">
                        <div class="viewer-name">${escapeHtml(viewer.nickname || '未知用户')}</div>
                        <div class="viewer-time">${joinTime}</div>
                    </div>
                </div>
                <div class="viewer-score">积分: ${viewer.score || 0}</div>
            </div>
        `;
    });

    html += `
        </div>
        <div style="text-align: right; margin-top: 10px; color: #666;">
            最后更新时间: ${formatDate(new Date())}
        </div>
    `;

    contentDiv.innerHTML = html;
}

// ============================ 工具函数 ============================
function showModal(content) {
    const modalContent = document.getElementById('modalContent');
    const modalOverlay = document.getElementById('modalOverlay');

    if (modalContent && modalOverlay) {
        modalContent.innerHTML = content;
        modalOverlay.style.display = 'flex';
        document.body.style.overflow = 'hidden'; // 防止背景滚动
    }
}

function closeModal() {
    const modalOverlay = document.getElementById('modalOverlay');
    if (modalOverlay) {
        modalOverlay.style.display = 'none';
        document.body.style.overflow = 'auto'; // 恢复滚动
    }
}

function showMessage(msg, type) {
    const messageDiv = document.getElementById('message');
    if (!messageDiv) {
        // 创建临时消息框
        const tempDiv = document.createElement('div');
        tempDiv.className = `message ${type}`;
        tempDiv.textContent = msg;
        tempDiv.style.position = 'fixed';
        tempDiv.style.top = '20px';
        tempDiv.style.right = '20px';
        tempDiv.style.zIndex = '9999';
        tempDiv.style.padding = '15px';
        tempDiv.style.borderRadius = '5px';
        tempDiv.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
        tempDiv.style.minWidth = '200px';
        document.body.appendChild(tempDiv);

        setTimeout(() => {
            tempDiv.remove();
        }, 3000);
        return;
    }

    messageDiv.textContent = msg;
    messageDiv.className = `message ${type}`;
    messageDiv.style.display = 'block';

    setTimeout(() => {
        messageDiv.style.display = 'none';
    }, 3000);
}

function showLoading() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.style.display = 'flex';
    }
}

function hideLoading() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.style.display = 'none';
    }
}

function formatDate(dateString) {
    if (!dateString) return '';

    try {
        const date = new Date(dateString);
        return date.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    } catch (e) {
        return dateString;
    }
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function updatePagination(containerId, currentPage, totalPages, callback) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }

    let paginationHTML = '';

    // 上一页按钮
    if (currentPage > 1) {
        paginationHTML += `<button onclick="${callback.name}(${currentPage - 1})">« 上一页</button>`;
    }

    // 页码按钮
    const maxButtons = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxButtons - 1);

    if (endPage - startPage + 1 < maxButtons) {
        startPage = Math.max(1, endPage - maxButtons + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
        if (i === currentPage) {
            paginationHTML += `<button class="active">${i}</button>`;
        } else {
            paginationHTML += `<button onclick="${callback.name}(${i})">${i}</button>`;
        }
    }

    // 下一页按钮
    if (currentPage < totalPages) {
        paginationHTML += `<button onclick="${callback.name}(${currentPage + 1})">下一页 »</button>`;
    }

    container.innerHTML = paginationHTML;
}

// 添加键盘快捷键
document.addEventListener('keydown', function(e) {
    // ESC键关闭模态框
    if (e.key === 'Escape') {
        closeModal();
    }

    // Ctrl+R刷新当前页面
    if (e.ctrlKey && e.key === 'r' && currentSection === 'dashboard') {
        e.preventDefault();
        loadDashboard();
    }
});