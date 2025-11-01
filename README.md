# 对话户晨风

一个简洁美观的AI聊天应用，采用苹果设计风格。

## ✨ 特性

- 🎨 **精美UI** - 仿照苹果公司设计语言，支持深色/浅色模式
- 💬 **Markdown支持** - AI回复支持完整的Markdown格式渲染
- 🎵 **背景音乐** - 内置音乐播放功能
- 📱 **响应式设计** - 完美适配桌面端和移动端
- ⚡ **流畅动画** - 使用苹果标准缓动函数，交互流畅
- 🔒 **速率限制** - 每分钟20次请求限制

## 🚀 快速开始

### 安装依赖

```bash
npm install
```

### 配置环境变量

复制 `ENV.sample` 为 `.env` 并填写配置：

```bash
cp ENV.sample .env
```

配置项说明：
- `OPENAI_API_KEY` - OpenAI API密钥
- `OPENAI_BASE_URL` - API基础URL
- `OPENAI_MODEL` - 使用的模型
- `SYSTEM_PROMPT` - 系统提示词

### 启动服务

```bash
npm start
```

访问 `http://localhost:3000` 即可使用。

## 📁 项目结构

```
.
├── public/              # 前端静态文件
│   ├── index.html      # 主页面
│   ├── styles.css      # 样式文件
│   ├── app.js          # 前端逻辑
│   └── assets/         # 资源文件
├── server.js           # 后端服务器
├── package.json        # 项目配置
└── .env               # 环境变量（需自行创建）
```

## 🎨 设计特色

- 毛玻璃效果（Backdrop Filter）
- 渐变色彩系统
- 精致的圆角和阴影
- 优雅的加载动画
- 苹果风格的交互反馈

## 📝 许可证

MIT License

## 👨‍💻 作者

访问作者博客：[https://zhuzihan.com/](https://zhuzihan.com/)
