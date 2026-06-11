// 管理员后台 - 工具函数

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
