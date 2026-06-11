// 管理员后台 - 导航切换

function showSection(sectionId) {
    // 更新侧边栏激活状态
    document.querySelectorAll('.sidebar-item').forEach(item => {
        item.classList.remove('active');
    });
    event.currentTarget.classList.add('active');

    // 更新内容区域显示
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(sectionId + 'Section').classList.add('active');

    currentSection = sectionId;

    // 更新面包屑
    var sectionNames = {
        dashboard: '数据统计',
        users: '用户管理',
        rooms: '对战管理',
        scores: '积分管理',
        admins: '管理员管理',
        stats: '详细统计'
    };
    var breadcrumbEl = document.getElementById('breadcrumbCurrent');
    if (breadcrumbEl) breadcrumbEl.textContent = sectionNames[sectionId] || sectionId;

    // 加载对应区域的数据
    switch(sectionId) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'users':
            loadUsers();
            break;
        case 'rooms':
            loadRooms();
            break;
        case 'scores':
            loadScores();
            break;
        case 'admins':
            loadAdmins();
            break;
        case 'stats':
            loadRecentWeekStats();
            break;
    }
}

// 键盘快捷键
document.addEventListener('keydown', function(e) {
    // ESC键关闭模态框
    if (e.key === 'Escape') {
        closeModal();
    }

    // Ctrl+R刷新当前页面
    if (e.ctrlKey && e.key === 'r' && currentSection === 'dashboard') {
        e.preventDefault();
        loadDashboard();
    }
});
