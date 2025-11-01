const path = require('path');
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// 静态资源
app.use(express.static(path.join(__dirname, 'public')));

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// 音频流式传输（支持 Range）
const fs = require('fs');
app.get('/audio/stream', (req, res) => {
  try {
    const audioPath = path.join(__dirname, 'public', 'Andalusia.mp3'); // 固定文件；若需可改为 .env 配置
    if (!fs.existsSync(audioPath)) {
      return res.status(404).end();
    }
    const stat = fs.statSync(audioPath);
    const fileSize = stat.size;
    const range = req.headers.range;
    const contentType = 'audio/mpeg';

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      if (isNaN(start) || isNaN(end) || start > end || end >= fileSize) {
        return res.status(416).set({
          'Content-Range': `bytes */${fileSize}`
        }).end();
      }
      const chunkSize = (end - start) + 1;
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': contentType
      });
      fs.createReadStream(audioPath, { start, end }).pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': contentType,
        'Accept-Ranges': 'bytes'
      });
      fs.createReadStream(audioPath).pipe(res);
    }
  } catch (_e) {
    res.status(500).end();
  }
});

// 每分钟20次限流，超限时"假装sleep"并返回AI样式回复
const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: async (req, res) => {
    // 假装打盹 1.2~2.0 秒
    const delay = 1200 + Math.floor(Math.random() * 800);
    await sleep(delay);
    res.status(200).json({
      role: 'assistant',
      content: '（我先打个盹…请稍后再试）',
      meta: { simulatedSleepMs: delay }
    });
  }
});

// 健康检查
app.get('/health', (req, res) => {
  res.json({ ok: true });
});

// 聊天代理接口
app.post('/api/chat', chatLimiter, async (req, res) => {
  try {
    const body = req.body || {};
    const rawMessages = Array.isArray(body.messages) ? body.messages : [];
    // 忽略标记为临时/首句的消息（客户端应不传，这里再次兜底）
    const messages = rawMessages
      .filter(m => m && typeof m.content === 'string' && !m.ephemeral)
      .map(({ role, content }) => ({ role, content }));

    const systemPrompt =
      typeof body.systemPrompt === 'string' && body.systemPrompt.trim() !== ''
        ? body.systemPrompt
        : (process.env.SYSTEM_PROMPT || '');

    // 标准 OpenAI Chat Completions 接口配置
    const openaiKey = process.env.OPENAI_API_KEY || '';
    const openaiBase = (process.env.OPENAI_BASE_URL || 'https://api.openai.com').replace(/\/$/, '');
    const openaiPath = (process.env.OPENAI_API_PATH || '/v1/chat/completions');
    const modelFromBody = typeof body.model === 'string' && body.model.trim() !== '' ? body.model.trim() : '';
    const openaiModel = modelFromBody || (process.env.OPENAI_MODEL || '');

    if (openaiKey && openaiModel) {
      const url = openaiBase + (openaiPath.startsWith('/') ? openaiPath : ('/' + openaiPath));
      const openaiMessages = [];
      if (systemPrompt && systemPrompt.trim() !== '') {
        openaiMessages.push({ role: 'system', content: systemPrompt });
      }
      for (const m of messages) {
        if (!m || typeof m.content !== 'string') continue;
        const role = m.role === 'assistant' ? 'assistant' : 'user';
        openaiMessages.push({ role, content: m.content });
      }

      try {
        const response = await axios.post(
          url,
          {
            model: openaiModel,
            messages: openaiMessages,
            temperature: typeof body.temperature === 'number' ? body.temperature : 0.7,
            stream: false
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${openaiKey}`
            },
            timeout: 30000
          }
        );
        const data = response.data || {};
        const first = data && data.choices && data.choices[0] && data.choices[0].message;
        const content = first && first.content ? String(first.content) : '';
        if (content) return res.json({ role: 'assistant', content });
        return res.json({ role: 'assistant', content: '（无内容返回）' });
      } catch (err) {
        const msg = err?.response?.data || err?.message || '上游接口错误';
        return res.status(502).json({ role: 'assistant', content: `（上游忙碌：${typeof msg === 'string' ? msg : JSON.stringify(msg)}）` });
      }
    }

    // 无上游配置：返回本地模拟
    const lastUser = [...messages].reverse().find(m => m.role === 'user');
    const echo = lastUser && lastUser.content ? lastUser.content : '';
    // 若未配置 OPENAI_API_KEY 或 OPENAI_MODEL，则使用本地模拟
    return res.json({ role: 'assistant', content: `我听到了：「${echo}」。这是模拟回复，用于开发联调。` });
  } catch (e) {
    return res.status(500).json({ role: 'assistant', content: '（服务器开小差了，请稍后再试）' });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});


