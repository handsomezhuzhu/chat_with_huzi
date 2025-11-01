
(() => {
  const messagesEl = document.getElementById('messages');
  const inputEl = document.getElementById('input');
  const sendBtn = document.getElementById('send');
  const musicButton = document.getElementById('musicButton');
  const toastEl = document.getElementById('toast');
  // 使用服务端流式传输端点
  const audio = new Audio();
  audio.preload = 'none';
  const streamUrl = '/audio/stream';

  const state = {
    messages: [] // { role: 'user'|'assistant', content: string, ephemeral?: boolean }
  };

  function scrollToBottom() {
    requestAnimationFrame(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    });
  }

  function render() {
    messagesEl.innerHTML = '';
    for (const msg of state.messages) {
      const li = document.createElement('li');
      li.className = `message ${msg.role}`;
      const avatar = document.createElement('div');
      avatar.className = 'avatar';
      avatar.textContent = msg.role === 'assistant' ? '户' : '我';

      const bubble = document.createElement('div');
      bubble.className = 'bubble';
      
      // 如果是加载状态，显示加载动画
      if (msg.isLoading) {
        bubble.innerHTML = '<span class="loading-dots"><span></span><span></span><span></span></span>';
      } else if (msg.role === 'assistant') {
        // AI消息：渲染Markdown
        try {
          bubble.innerHTML = marked.parse(msg.content || '');
        } catch (e) {
          bubble.textContent = msg.content;
        }
      } else {
        // 用户消息：纯文本
        bubble.textContent = msg.content;
      }

      const right = document.createElement('div');
      right.appendChild(bubble);
      if (msg.meta) {
        const meta = document.createElement('div');
        meta.className = 'meta';
        meta.textContent = msg.meta;
        right.appendChild(meta);
      }

      li.appendChild(avatar);
      li.appendChild(right);
      messagesEl.appendChild(li);
    }
    scrollToBottom();
  }

  function addMessage(role, content, opts) {
    const message = { role, content, ...(opts || {}) };
    state.messages.push(message);
    render();
  }

  // 轻量 toast
  let toastTimer = null;
  function showToast(text) {
    if (!toastEl) return;
    toastEl.textContent = text;
    toastEl.style.display = 'block';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastEl.style.display = 'none';
      toastEl.textContent = '';
    }, 2600);
  }

  // 虚假开场白（不计入上下文）
  (function fakeOpening() {
    const candidates = ['直接表达观点', '喂，你的麦有回音'];
    const pick = candidates[Math.floor(Math.random() * candidates.length)];
    addMessage('assistant', pick, { ephemeral: true });
  })();

  async function send() {
    const text = (inputEl.value || '').trim();
    if (!text) return;
    inputEl.value = '';
    addMessage('user', text);
    sendBtn.disabled = true;

    // 添加加载动画消息
    const loadingMessage = { role: 'assistant', content: '', isLoading: true };
    state.messages.push(loadingMessage);
    render();

    try {
      const payload = {
        messages: state.messages
          .filter(m => !m.ephemeral && !m.isLoading)
          .map(({ role, content }) => ({ role, content }))
      };

      const resp = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      // 移除加载动画
      state.messages = state.messages.filter(m => !m.isLoading);

      let data;
      try { data = await resp.json(); } catch (_) { data = null; }
      if (data && data.content) {
        addMessage('assistant', String(data.content));
      } else if (!resp.ok) {
        addMessage('assistant', '（对话暂时不可用，请稍后再试）');
      } else {
        addMessage('assistant', '（收到空响应）');
      }
    } catch (e) {
      // 移除加载动画
      state.messages = state.messages.filter(m => !m.isLoading);
      addMessage('assistant', '（网络异常，请检查连接）');
    } finally {
      sendBtn.disabled = false;
      inputEl.focus();
    }
  }

  // 发送按钮与快捷键
  sendBtn.addEventListener('click', send);
  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  });

  // 音乐按钮（不自动播放）
  function updateMusicButton() {
    const isPlaying = !audio.paused && !audio.ended;
    if (isPlaying) {
      musicButton.classList.add('is-playing');
      musicButton.setAttribute('aria-pressed', 'true');
    } else {
      musicButton.classList.remove('is-playing');
      musicButton.setAttribute('aria-pressed', 'false');
    }
  }

  musicButton.addEventListener('click', async () => {
    try {
      if (!audio.src) audio.src = streamUrl;

      if (audio.paused) {
        await audio.play();
      } else {
        audio.pause();
      }
    } catch (_) {
      showToast('音乐播放失败，请点击重试或检查文件');
    } finally {
      updateMusicButton();
    }
  });
  audio.addEventListener('ended', updateMusicButton);
  audio.addEventListener('pause', updateMusicButton);
  audio.addEventListener('play', updateMusicButton);
  audio.addEventListener('error', () => showToast('音乐加载出错')); 
})();


