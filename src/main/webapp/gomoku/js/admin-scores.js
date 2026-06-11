// 管理员后台 - 积分管理

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