// 管理员后台 - 对战管理(房间)

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

async function deleteRoom(roomId) {
    if (!confirm(`确定要删除房间 ${roomId} 吗？此操作将同时删除该房间的棋盘记录和观战记录，不可恢复！`)) {
        return;
    }

    showLoading();
    try {
        const response = await fetch(`${API_BASE}/manage/room/${encodeURIComponent(roomId)}`, {
            method: 'DELETE'
        });

        const result = await response.json();

        if (result.state) {
            showMessage('删除房间成功', 'success');
            loadRooms(currentRoomPage);
        } else {
            showMessage(result.msg || '删除房间失败', 'error');
        }
    } catch (error) {
        console.error('删除房间失败:', error);
        showMessage('删除房间失败', 'error');
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