// 管理员后台 - 管理员管理

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