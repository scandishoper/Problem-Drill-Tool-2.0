# 题目刷题工具

这是一个支持题目录入与刷题练习的完整系统，包含标准化的后端 API 与前端页面。后端提供统一的数据接口（默认端口 8000），前端可直接进行客观题、主观题的录入与练习。

## 项目结构

- **backend**：Node.js + Express 后端服务
- **frontend**：纯前端页面（无需构建）
- **data**：JSON 题库文件（由原始 txt 转换而来）
- **scripts**：转换脚本
- **src**：原始 C++ 实现与题库 txt（保留原始数据）

## 后端 API

### 客观题

- `GET /api/questions/objective`：获取全部客观题
- `GET /api/questions/objective/random?count=1&qtype=single`：随机抽取客观题
- `POST /api/questions/objective`：新增客观题

### 主观题

- `GET /api/questions/subjective`：获取全部主观题
- `GET /api/questions/subjective/random?count=1`：随机抽取主观题
- `POST /api/questions/subjective`：新增主观题

## 快速开始

### 1. 启动后端

```bash
cd backend
npm install
npm run start
```

### 2. 打开前端

直接使用任意静态服务器启动即可，例如：

```bash
cd frontend
npm run dev
```

浏览器访问 `http://localhost:5173`，即可录入题目并进行练习。

## 数据转换

如需从 txt 重新生成 JSON，可运行：

```bash
python scripts/convert_txt_to_json.py
```

转换后的题库位于 `data/` 目录。

## TXT 录题导入

题库支持客观题和主观题的 TXT 导入，格式与 `backup/` 中的 txt 一致。

- 前端：进入 `frontend/entry.html`，使用“TXT 录题导入”，选择文件或直接粘贴内容后提交。
- 后端 API：`POST /api/questions/import-txt`
  - `kind`: `objective` 或 `subjective`
  - `content`: TXT 文本内容

导入后会直接追加到 `data/objective_questions.json` 或 `data/subjective_questions.json`。
