# M3U8 Downloader

一个基于Express和TypeScript的M3U8下载器项目。

## 功能特性

- 🚀 基于Express 5.x和TypeScript
- 🔄 热重载开发环境
- 📦 模块化项目结构
- 🛡️ 类型安全

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

### 构建项目

```bash
npm run build
```

### 生产模式

```bash
npm start
```

## 项目结构

```
src/
├── app.ts          # 主应用文件
├── routes/         # 路由文件
├── controllers/    # 控制器
├── middleware/     # 中间件
├── services/       # 业务逻辑
└── types/          # 类型定义
```

## API端点

- `GET /` - 欢迎页面
- `GET /health` - 健康检查

## 技术栈

- **Express** - Web框架
- **TypeScript** - 类型安全的JavaScript
- **ts-node** - TypeScript执行环境
- **nodemon** - 开发热重载

## 开发指南

1. 克隆项目
2. 安装依赖：`npm install`
3. 启动开发服务器：`npm run dev`
4. 访问 http://localhost:3000

## 许可证

MIT
