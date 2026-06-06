// 管理员后台 - 登录/登出/初始化

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
                var avatarEl = document.getElementById('adminAvatar');
                if (avatarEl) avatarEl.textContent = currentAdmin.nickname ? currentAdmin.nickname.charAt(0) : '管';

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
                var avatarEl2 = document.getElementById('adminAvatar');
                if (avatarEl2) avatarEl2.textContent = currentAdmin.nickname ? currentAdmin.nickname.charAt(0) : '管';

                // 加载数据统计
                loadDashboard();
            }
        }
    } catch (error) {
        // 未登录或检查失败，保持登录页面
        console.log('未登录，显示登录页面');
    }
}

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
