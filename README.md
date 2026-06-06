# 五子棋对战平台

基于 Spring MVC + MyBatis 的在线五子棋对战系统，支持双人对战、观战、局内聊天、积分排行及后台管理。

## 技术栈

- **后端**: Spring MVC 5.3 + MyBatis 3.5 + Druid 连接池
- **数据库**: MySQL 8.0
- **前端**: 原生 HTML/CSS/JavaScript + Chart.js（管理端图表）
- **构建**: Maven (WAR 包部署)
- **JDK**: 18

## 功能模块

### 用户端

- 用户注册 / 登录
- 创建 / 加入房间（6位房间号）
- 15×15 五子棋对战，黑白双方轮流落子
- 局内聊天（玩家互通，观战者可看全部消息）
- 观战功能
- 积分排行榜
- 修改昵称 / 密码

### 管理端

- 管理员登录
- 用户管理（增删改查、状态切换、CSV 导出）
- 对战房间管理（查看、删除、观战记录）
- 积分管理（手动调整、记录查询）
- 数据仪表盘（近七日对战统计折线图、排行榜）

## 项目结构

```
src/main/java/cn/edu/qvtu/
├── config/          # Spring MVC 配置
├── controller/      # REST 控制器
│   ├── BattleController     # 对战相关接口
│   ├── UserController       # 用户注册/登录/信息
│   ├── AdminController      # 管理员登录
│   └── ManageController     # 后台管理接口
├── dao/             # MyBatis Mapper 接口
├── entity/          # 实体类
├── handler/         # 全局异常处理
├── interceptor/     # 管理员权限拦截器
├── service/         # 业务接口及实现
├── task/            # 定时任务（房间超时清理）
└── util/            # 工具类

src/main/webapp/
├── index.html       # 大厅页面（登录/注册/房间列表）
├── game.html        # 对战页面（棋盘/聊天）
├── admin.html       # 管理后台页面
├── css/             # 样式文件
└── js/              # 前端脚本
```

## API 概览

| 模块 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 用户 | POST | `/user/register` | 用户注册 |
| 用户 | POST | `/user/login` | 用户登录 |
| 用户 | GET | `/user/info/{userId}` | 获取用户信息 |
| 对战 | POST | `/room/create/{userId}` | 创建房间 |
| 对战 | GET | `/room/list` | 房间列表 |
| 对战 | GET | `/room/join` | 加入房间 |
| 对战 | POST | `/game/placeChess` | 落子 |
| 对战 | POST | `/game/chat` | 发送聊天消息 |
| 对战 | GET | `/rank/list/{userId}` | 积分排行榜 |
| 管理 | GET | `/manage/user/list` | 用户列表 |
| 管理 | GET | `/manage/room/list` | 房间列表 |
| 管理 | GET | `/manage/dashboard/stats` | 仪表盘统计 |
| 管理 | GET | `/manage/stats/recent-week` | 近七日统计 |

## 快速开始

### 环境准备

- JDK 18+
- Maven 3.6+
- MySQL 8.0+
- Tomcat 9+（或其他 Servlet 容器）

### 数据库配置

1. 创建数据库：

```sql
CREATE DATABASE mygamedb DEFAULT CHARACTER SET utf8mb4;
```

2. 修改 `src/main/resources/applicationContext.xml` 中的数据库连接信息：

```xml
<property name="url" value="jdbc:mysql://localhost:3306/mygamedb?useUnicode=true&characterEncoding=utf8&useSSL=false&serverTimezone=Asia/Shanghai&allowPublicKeyRetrieval=true" />
<property name="username" value="root" />
<property name="password" value="root" />
```

### 构建与部署

```bash
# 编译打包
mvn clean package

# 将 target/zy10.war 部署到 Tomcat 的 webapps 目录下
```

### 访问

- 用户端: `http://localhost:8080/zy10/`
- 管理后台: `http://localhost:8080/zy10/admin.html`

## 运行测试

```bash
mvn test
```

测试框架使用 JUnit 4 + Mockito，覆盖核心业务逻辑。
