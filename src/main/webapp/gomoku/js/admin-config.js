// 管理员后台 - 全局配置与变量

// 全局变量
let currentAdmin = null;
let currentSection = 'dashboard';
let currentUserPage = 1;
let currentRoomPage = 1;
let currentScorePage = 1;
let weekStatsChart = null;
const userPageSize = 10;
const roomPageSize = 10;
const scorePageSize = 10;

// API基础URL - 根据实际部署环境修改
const API_BASE = 'http://localhost:51234';
