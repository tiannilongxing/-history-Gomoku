// 管理员后台 - 用户管理

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
    showLoading();
    fetch(`${API_BASE}/manage/user/export`)
        .then(response => {
            if (!response.ok) throw new Error("导出失败");
            return response.blob();
        })
        .then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "用户数据.csv";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            showMessage("导出成功", "success");
        })
        .catch(error => {
            console.error("导出用户数据失败:", error);
            showMessage("导出失败，请重试", "error");
        })
        .finally(() => {
            hideLoading();
        });
}