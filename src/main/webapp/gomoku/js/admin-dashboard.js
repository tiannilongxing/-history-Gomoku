// 管理员后台 - 数据统计(Dashboard)

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
                        const uid = item.userId || item.id;
                        rankingsHTML += `
                            <div class="ranking-item ${index < 3 ? 'top-3' : ''}"
                                 onclick="viewUserDetail(${uid})"
                                 style="cursor: pointer;"
                                 title="点击查看 ${escapeHtml(item.nickname || '未知用户')} 的详情">
                                <div class="ranking-number">${medal}${index + 1}</div>
                                <div class="ranking-info">
                                    <div class="ranking-name">${escapeHtml(item.nickname || '未知用户')}</div>
                                    <div class="ranking-details">
                                        <span>ID: ${uid || 'N/A'}</span>
                                        <span>用户名: ${escapeHtml(item.username || '未知')}</span>
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