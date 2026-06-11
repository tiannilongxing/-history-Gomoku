// 管理员后台 - 详细统计/图表

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