// ============================================================
// messages.js — 悄悄话留言板
// ============================================================

let allMessages = [];

async function sendMessage() {
  const author = document.getElementById('msgAuthor').value.trim() || '匿名';
  const content = document.getElementById('msgContent').value.trim();

  if (!content) {
    showToast('请输入你想说的话', 'error');
    return;
  }

  const btn = document.getElementById('btnSendMsg');
  btn.disabled = true;
  btn.textContent = '发送中...';

  if (isSupabaseConfigured()) {
    await initSupabase();
    if (supabase) {
      const { error } = await supabase
        .from('messages')
        .insert({ author_name: author, content });
      if (error) {
        showToast('发送失败: ' + error.message, 'error');
        btn.disabled = false;
        btn.textContent = '发送悄悄话';
        return;
      }
    }
  } else {
    await new Promise(r => setTimeout(r, 400));
  }

  showToast('悄悄话已送达', 'success');
  document.getElementById('msgAuthor').value = '';
  document.getElementById('msgContent').value = '';
  btn.disabled = false;
  btn.textContent = '发送悄悄话';
}

async function viewMessages() {
  if (!window.AppState.isLoggedIn) {
    showPasswordModal();
    return;
  }
  await loadAndShowMessages();
}

function showPasswordModal() {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay password-modal';
  overlay.innerHTML = `
    <div class="modal">
      <h3>查看悄悄话</h3>
      <p style="color:var(--text-secondary);font-size:0.88rem;">输入你们的共用密码来查看悄悄话</p>
      <input type="password" id="viewMsgPassword" placeholder="输入密码">
      <div id="viewMsgError" style="color:#c0392b;font-size:0.85rem;margin-bottom:8px;display:none;"></div>
      <button class="btn-confirm" id="btnConfirmView">确认查看</button>
      <button class="modal-close" style="display:block;width:100%;margin-top:8px;background:transparent;color:var(--text-secondary);">取消</button>
    </div>
  `;

  overlay.querySelector('.modal-close').addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });

  overlay.querySelector('#btnConfirmView').addEventListener('click', async () => {
    const password = overlay.querySelector('#viewMsgPassword').value;
    const errorEl = overlay.querySelector('#viewMsgError');

    if (!password) {
      errorEl.textContent = '请输入密码';
      errorEl.style.display = 'block';
      return;
    }

    if (isSupabaseConfigured()) {
      await initSupabase();
      if (supabase) {
        const email = document.getElementById('loginEmail').value || localStorage.getItem('love_story_email') || '';
        if (!email) {
          errorEl.textContent = '请先在"我们的空间"页面登录';
          errorEl.style.display = 'block';
          return;
        }
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          errorEl.textContent = '密码错误，请重试';
          errorEl.style.display = 'block';
          return;
        }
        window.AppState.isLoggedIn = true;
      }
    } else {
      if (password !== '123456') {
        errorEl.textContent = '演示模式密码: 123456';
        errorEl.style.display = 'block';
        return;
      }
      window.AppState.isLoggedIn = true;
    }

    overlay.remove();
    await loadAndShowMessages();
    showToast('已解锁悄悄话', 'success');
  });

  document.body.appendChild(overlay);
}

async function loadAndShowMessages() {
  const list = document.getElementById('messageList');
  list.innerHTML = '<div class="spinner"></div>';
  list.classList.remove('hidden');

  if (isSupabaseConfigured()) {
    await initSupabase();
    if (supabase) {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error) allMessages = data;
    } else {
      allMessages = DEMO_MESSAGES;
    }
  } else {
    allMessages = DEMO_MESSAGES;
  }

  if (allMessages.length === 0) {
    list.innerHTML = '<p style="text-align:center;color:var(--text-secondary);padding:40px 0;">还没有收到悄悄话</p>';
    return;
  }

  list.innerHTML = allMessages.map(m => {
    const time = m.created_at ? new Date(m.created_at).toLocaleDateString('zh-CN', {
      month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit'
    }) : '';
    return `
      <div class="message-bubble">
        <div class="bubble-author">${escapeHTML(m.author_name)}</div>
        <div class="bubble-content">${escapeHTML(m.content)}</div>
        ${time ? `<div class="bubble-time">${time}</div>` : ''}
      </div>
    `;
  }).join('');
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('btnSendMsg').addEventListener('click', sendMessage);
  document.getElementById('btnViewMessages').addEventListener('click', viewMessages);
});
