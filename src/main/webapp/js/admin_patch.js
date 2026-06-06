// This is a temporary patch file - the content will be merged into admin.js

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

async function showEditAdminModal(adminId) {
	// Permission check for normal admin editing others
	if (currentAdmin && currentAdmin.role !== 2 && adminId !== currentAdmin.adminId) {
		const errorModal = `
			<div class="modal-header">
				<h3>⚠️ 权限不足</h3>
			</div>
			<div style="padding: 30px; text-align: center;">
				<div style="font-size: 48px; margin-bottom: 15px;">🚫</div>
				<h4 style="color: #dc3545; margin-bottom: 10px;">操作被拒绝</h4>
				<p style="color: #6c757d;">普通管理员只能编辑自己的信息，无法编辑其他管理员！</p>
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
