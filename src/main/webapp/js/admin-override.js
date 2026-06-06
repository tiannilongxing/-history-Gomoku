// Override functions for admin.js - loaded after admin.js

// Fix 2: loadRooms - use playerName filter instead of winner filter
async function loadRooms(page = 1) {
	currentRoomPage = page;
	showLoading();

	try {
		const roomId = document.getElementById('roomSearch')?.value || '';
		const status = document.getElementById('roomStatusFilter')?.value || '';
		const playerName = document.getElementById('roomPlayerNameFilter')?.value || '';

		let url = `${API_BASE}/manage/room/list?page=${page}&size=${roomPageSize}`;
		if (roomId) url += `&roomId=${encodeURIComponent(roomId)}`;
		if (status) url += `&status=${status}`;
		if (playerName) url += `&playerName=${encodeURIComponent(playerName)}`;

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
								<button class="btn btn-danger btn-small" onclick="deleteRoom('${room.roomId}')">
									<span>🗑️ 删除</span>
								</button>
							</div>
						</td>
					</tr>
					`;
					tbody.innerHTML += row;
				});
			}

			updatePagination('roomsPagination', page, totalPages, loadRooms);
		}
	} catch (error) {
		console.error('加载房间列表失败:', error);
		showMessage('加载房间列表失败', 'error');
	} finally {
		hideLoading();
	}
}

// Fix 3: showAddScoreModal - replace the stub with working implementation
function showAddScoreModal() {
	const modalContent = `
		<div class="modal-header">
			<h3>➕ 添加积分记录</h3>
		</div>
		<form id="addScoreForm">
			<div class="form-row">
				<label>用户ID <span class="text-danger">*</span></label>
				<input type="number" class="form-control" id="addScoreUserId" required placeholder="输入用户ID">
			</div>
			<div class="form-row">
				<label>变动积分 <span class="text-danger">*</span></label>
				<input type="number" class="form-control" id="addScoreValue" required placeholder="正数加积分，负数减积分">
			</div>
			<div class="form-row">
				<label>变动原因 <span class="text-danger">*</span></label>
				<input type="text" class="form-control" id="addScoreReason" required placeholder="输入变动原因">
			</div>
			<div class="modal-actions">
				<button type="submit" class="btn btn-success">添加</button>
				<button type="button" class="btn btn-danger" onclick="closeModal()">取消</button>
			</div>
		</form>
	`;

	showModal(modalContent);

	document.getElementById('addScoreForm').addEventListener('submit', async function(e) {
		e.preventDefault();

		const userId = parseInt(document.getElementById('addScoreUserId').value);
		const changeScore = parseInt(document.getElementById('addScoreValue').value);
		const reason = document.getElementById('addScoreReason').value.trim();

		if (!userId || isNaN(changeScore) || changeScore === 0 || !reason) {
			showMessage('请填写完整信息，变动积分不能为0', 'error');
			return;
		}

		showLoading();
		try {
			const response = await fetch(`${API_BASE}/manage/score/log`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ userId: userId, changeScore: changeScore, reason: reason })
			});

			const result = await response.json();
			if (result.state) {
				showMessage('添加积分记录成功', 'success');
				closeModal();
				loadScores();
			} else {
				showMessage(result.msg || '添加积分记录失败', 'error');
			}
		} catch (error) {
			console.error('添加积分记录失败:', error);
			showMessage('添加积分记录失败', 'error');
		} finally {
			hideLoading();
		}
	});
}

// Fix 4: showEditAdminModal - add permission error modal for normal admin editing others
async function showEditAdminModal(adminId) {
	// Check permission: normal admin cannot edit other admins
	if (currentAdmin && currentAdmin.role !== 2 && adminId !== currentAdmin.adminId) {
		const errorModal = `
			<div class="modal-header">
				<h3>⚠️ 权限不足</h3>
			</div>
			<div style="padding: 30px; text-align: center;">
				<div style="font-size: 48px; margin-bottom: 15px;">🚫</div>
				<h4 style="color: #dc3545; margin-bottom: 10px;">操作被拒绝</h4>
				<p style="color: #6c757d; font-size: 16px;">普通管理员只能编辑自己的信息，<br>无法编辑其他管理员！</p>
			</div>
			<div class="modal-actions">
				<button class="btn btn-primary" onclick="closeModal()">我知道了</button>
			</div>
		`;
		showModal(errorModal);
		return;
	}

	showLoading();
	try {
		const response = await fetch(`${API_BASE}/admin/info/${adminId}`);
		const result = await response.json();

		if (result.state) {
			const admin = result.data;

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
