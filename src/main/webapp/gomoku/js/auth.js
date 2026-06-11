// 认证相关的通用函数
class AuthManager {
    static getCurrentUser() {
        const userInfo = localStorage.getItem('userInfo');
        return userInfo ? JSON.parse(userInfo) : null;
    }

    static setCurrentUser(user) {
        localStorage.setItem('userInfo', JSON.stringify(user));
    }

    static clearCurrentUser() {
        localStorage.removeItem('userInfo');
    }

    static isLoggedIn() {
        return this.getCurrentUser() !== null;
    }

    static redirectToLogin() {
        window.location.href = 'lobby.html';
    }

    static requireAuth() {
        if (!this.isLoggedIn()) {
            this.redirectToLogin();
            return false;
        }
        return true;
    }
}

// API基础URL
const API_BASE = '';

// 通用API请求函数
async function apiRequest(url, options = {}) {
    try {
        const response = await fetch(`${API_BASE}${url}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });

        // 检查响应类型
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            console.error('收到非JSON响应:', text.substring(0, 200));
            throw new Error(`服务器返回了HTML页面 (${response.status})`);
        }

        return await response.json();
    } catch (error) {
        console.error('API请求失败:', error);
        throw error;
    }
}

// 表单数据请求
async function apiFormRequest(url, formData) {
    try {
        const response = await fetch(`${API_BASE}${url}`, {
            method: 'POST',
            body: formData
        });

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            console.error('收到非JSON响应:', text.substring(0, 200));
            throw new Error(`服务器返回了HTML页面 (${response.status})`);
        }

        return await response.json();
    } catch (error) {
        console.error('API请求失败:', error);
        throw error;
    }
}