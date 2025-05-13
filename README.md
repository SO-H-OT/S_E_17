# Smart Marine Ranch Visualization System

## 系统要求

### 前端
- Node.js (v14.0.0或更高)
- npm (v6.0.0或更高) 或 yarn (v1.22.0或更高)
- React 18
- Material UI 5

### 后端
- Python (3.8或更高)
- Flask
- MySQL 数据库

## 安装步骤

### 1. 克隆仓库

```bash
git clone <repository-url>
```

### 2. 设置后端环境

#### 安装Python依赖

```bash
pip install flask flask-cors pandas numpy pymysql requests
```

#### 配置数据库

1. 安装MySQL数据库
   
2. 创建数据库
```sql
CREATE DATABASE oceanmonitor;
```

3. 导入示例数据
```bash
# 使用项目中自带的SQL文件导入数据
mysql -u root -p oceanmonitor < oceanmonitor_data.sql
```

4. 修改数据库配置
   打开`app.py`文件，修改DB_CONFIG中的密码和其他配置：
```python
DB_CONFIG = {
    'host': 'localhost',
    'user': '你的用户名',
    'password': '你的密码',  # 修改为你的数据库密码
    'db': 'oceanmonitor',
    'charset': 'utf8mb4',
    'cursorclass': pymysql.cursors.DictCursor
}
```

### 3. 设置前端环境

```bash
cd frontend
npm install
# 安装特定需要的包
npm install react react-dom @mui/material @mui/icons-material @emotion/react @emotion/styled recharts axios react-router-dom
```

## 运行项目

### 1. 启动后端服务器

```bash
cd backend
python app.py
```

后端服务器将在 http://localhost:5000 运行

### 2. 启动前端开发服务器

```bash
cd frontend
npm start
```

前端开发服务器将在 http://localhost:3000 运行

## 项目结构

```
测试/
├── backend/             # 后端Flask应用
│   ├── app.py           # 主应用入口
│   ├── Fish.csv         # 鱼类数据
│   └── database/        # 数据库文件
│       └── oceanmonitor_data.sql # 数据库导入文件
├── frontend/            # 前端React应用
│   ├── package.json     # 项目依赖
│   ├── public/          # 静态文件
│   └── src/             # 源代码
│       ├── pages/       # 页面组件
│       │   ├── HomePage.js      # 水质监测页面
│       │   └── SecondPage.js    # 鱼类数据页面
│       ├── services/    # API服务
│       │   └── api.js   # API调用函数
│       └── App.js       # 主应用组件
└── README.md            # 项目文档
```

## 数据库表结构

该系统使用以下数据库表结构：

### 水质监测数据表 (`2020-05`)

该表按年月命名（如`2020-05`），存储水质监测数据：

```sql
CREATE TABLE `2020-05` (
  `province` varchar(255) NOT NULL,       -- 省份
  `basin` varchar(255) NOT NULL,          -- 流域
  `section_name` varchar(255) NOT NULL,   -- 监测断面名称
  `monitor_time` datetime DEFAULT NULL,   -- 监测时间
  `water_quality_category` varchar(255) DEFAULT NULL, -- 水质类别
  `water_temperature` float DEFAULT NULL, -- 水温
  `station_status` varchar(255) DEFAULT NULL -- 监测站状态
);
```

每个水质监测表包含特定时间段的监测数据，可以根据省份、流域和监测点进行筛选。水质指标包括水温、水质类别等关键参数。系统可能包含多个不同时间段的表，都遵循相同的命名规则（YYYY-MM）和数据结构。

### 鱼类数据表 (`fishes`)

该表存储鱼类相关的数据，用于分析不同种类鱼的特征：

```sql
CREATE TABLE `fishes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `species` varchar(255) NOT NULL,  -- 鱼类种类
  `weight` float NOT NULL,          -- 重量(g)
  `length1` float NOT NULL,         -- 身长(cm)
  `length2` float NOT NULL,         -- 标准长度(cm)
  `length3` float NOT NULL,         -- 全长(cm)
  `height` float NOT NULL,          -- 高度(cm)
  `width` float NOT NULL,           -- 宽度(cm)
  PRIMARY KEY (`id`)
);
```

此表用于存储鱼类的详细测量数据，包括不同种类的鱼、它们的重量和各种尺寸测量，为系统的鱼类数据分析功能提供数据支持。

### 用户表 (`users`)

用户数据现在存储在数据库中，表结构如下：

```sql
CREATE TABLE `users` (
  `username` varchar(255) NOT NULL,  -- 用户名
  `password` varchar(255) NOT NULL,  -- 密码
  `gender` varchar(50) NOT NULL,     -- 性别
  `age` int NOT NULL,                -- 年龄
  `role` varchar(50) NOT NULL,       -- 角色(admin或user)
  `unit` varchar(255) NOT NULL,      -- 单位
  PRIMARY KEY (`username`)
);
```

此表存储所有用户的登录凭证和个人信息，用于系统的用户认证、授权和用户信息管理功能。管理员用户可以管理其他用户账户。

## 数据导入

系统已包含示例数据SQL文件，位于项目根目录：

```bash
# 使用项目中自带的SQL文件导入数据
mysql -u root -p oceanmonitor < oceanmonitor.sql
```

注意：请确保MySQL服务已启动，并且已创建名为`oceanmonitor`的数据库。

## API文档

主要API端点：

### 水质监测
- `GET /api/water-quality` - 获取水质数据
  - 参数：year, month, province, basin
- `GET /api/water-quality/periods` - 获取可用时间段
- `GET /api/water-quality/provinces` - 获取所有省份
- `GET /api/water-quality/basins` - 获取所有流域
- `GET /api/water-quality/statistics` - 获取水质统计数据

### 鱼类数据
- `GET /api/fish-statistics` - 获取鱼类统计数据

### 用户管理
- `POST /api/register` - 用户注册
- `POST /api/login` - 用户登录
- `GET /api/users` - 获取所有用户
- `GET /api/get_user/<username>` - 获取单个用户
- `DELETE /api/users/<username>` - 删除用户
- `PUT /api/users/<username>` - 更新用户信息

## 系统功能

### 水质监测功能
- 实时显示主要水质指标（pH值、浑浊度、溶解氧、水温）
- 水质质量趋势图表展示
- 水质分布饼图
- 历史水质数据表格展示

### 鱼类数据分析功能
- 鱼类数量分布饼图
- 各类鱼平均重量柱状图
- 鱼类年龄分布柱状图
- 鱼类体型比例数据展示
