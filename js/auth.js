// ============================================================
// auth.js — 登录认证 & 管理后台
// ============================================================

function showLoggedInUI() {
  document.getElementById('adminLoggedOut').classList.add('hidden');
  document.getElementById('adminLoggedIn').classList.remove('hidden');
  document.getElementById('photoUploadBar').classList.remove('hidden');
  loadDateManageList();
  loadPhotoManageList();
  loadMsgManageList();
}

function showLoggedOutUI() {
  document.getElementById('adminLoggedOut').classList.remove('hidden');
  document.getElementById('adminLoggedIn').classList.add('hidden');
  document.getElementById('photoUploadBar').classList.add('hidden');
}

async function login() {
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;

  if (!email || !password) {
    showToast('请输入邮箱和密码', 'error');
    return;
  }

  if (isSupabaseConfigured()) {
    try {
      const res = await apiFetch('/auth/v1/token?grant_type=password', {
        method: 'POST',
        body: { email, password },
      });
      const data = await res.json();
      if (data.error || !data.access_token) {
        showToast('登录失败：邮箱或密码错误', 'error');
        return;
      }
      localStorage.setItem('love_story_token', data.access_token);
      localStorage.setItem('love_story_refresh_token', data.refresh_token);
      localStorage.setItem('love_story_email', email);
      window.AppState.isLoggedIn = true;
    } catch (e) {
      showToast('网络错误，登录失败', 'error');
      return;
    }
  } else {
    if (password !== '123456') {
      showToast('演示模式密码: 123456', 'error');
      return;
    }
    window.AppState.isLoggedIn = true;
    localStorage.setItem('love_story_email', email);
  }

  showLoggedInUI();
  showToast('登录成功', 'success');
}

function logout() {
  localStorage.removeItem('love_story_token');
  localStorage.removeItem('love_story_refresh_token');
  localStorage.removeItem('love_story_email');
  window.AppState.isLoggedIn = false;
  window.AppState.session = null;
  document.getElementById('loginEmail').value = '';
  document.getElementById('loginPassword').value = '';
  showLoggedOutUI();
  showToast('已退出登录');
}

// ---- 纪念日管理 ----

async function addImportantDate() {
  const title = document.getElementById('adminDateTitle').value.trim();
  const eventDate = document.getElementById('adminDateValue').value;
  const description = document.getElementById('adminDateDesc').value.trim();

  if (!title || !eventDate) {
    showToast('请填写标题和日期', 'error');
    return;
  }

  if (isSupabaseConfigured()) {
    const token = localStorage.getItem('love_story_token');
    if (!token) {
      showToast('请先登录', 'error');
      return;
    }
    try {
      await apiFetch('/rest/v1/important_dates', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Prefer': 'return=minimal',
        },
        body: { title, event_date: eventDate, description },
      });
    } catch (e) {
      showToast('保存失败: ' + e.message, 'error');
      return;
    }
  } else {
    DEMO_EVENTS.push({ id: Date.now(), title, event_date: eventDate, description, type: 'other' });
  }

  showToast('纪念日已保存', 'success');
  document.getElementById('adminDateTitle').value = '';
  document.getElementById('adminDateValue').value = '';
  document.getElementById('adminDateDesc').value = '';

  refreshEvents();
  loadDateManageList();
}

async function loadDateManageList() {
  const list = document.getElementById('adminDateList');
  if (!list) return;

  let dates = [];
  if (isSupabaseConfigured()) {
    try {
      const res = await apiFetch('/rest/v1/important_dates?select=*&order=event_date.asc');
      dates = await res.json();
    } catch (e) {
      list.innerHTML = '<p style="color:var(--text-secondary);font-size:0.88rem;">加载失败</p>';
      return;
    }
  } else {
    dates = DEMO_EVENTS;
  }

  if (dates.length === 0) {
    list.innerHTML = '<p style="color:var(--text-secondary);font-size:0.88rem;">还没有纪念日</p>';
    return;
  }

  list.innerHTML = dates.map(d => `
    <div class="manage-item">
      <div class="item-info">
        <div class="item-title">${escapeHTML(d.title)}</div>
        <div class="item-meta">${d.event_date}</div>
      </div>
      <button class="btn-delete" onclick="deleteDate(${d.id})">删除</button>
    </div>
  `).join('');
}

async function deleteDate(id) {
  if (!confirm('确定要删除这个纪念日吗？')) return;

  if (isSupabaseConfigured()) {
    const token = localStorage.getItem('love_story_token');
    if (!token) { showToast('请先登录', 'error'); return; }
    try {
      await apiFetch(`/rest/v1/important_dates?id=eq.${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
    } catch (e) {
      showToast('删除失败', 'error');
      return;
    }
  } else {
    const idx = DEMO_EVENTS.findIndex(e => e.id === id);
    if (idx >= 0) DEMO_EVENTS.splice(idx, 1);
  }

  showToast('已删除', 'success');
  refreshEvents();
  loadDateManageList();
}

// ---- 照片管理 ----

async function adminUploadPhoto() {
  const fileInput = document.getElementById('adminPhotoFile');
  const file = fileInput.files[0];
  if (!file) { showToast('请选择一张照片', 'error'); return; }
  if (file.size > 5 * 1024 * 1024) { showToast('照片不能超过 5MB', 'error'); return; }

  const caption = document.getElementById('adminPhotoCaption').value.trim();
  const ok = await uploadPhoto(file, caption);
  if (ok) {
    fileInput.value = '';
    document.getElementById('adminPhotoCaption').value = '';
    loadPhotoManageList();
  }
}

async function loadPhotoManageList() {
  const list = document.getElementById('adminPhotoList');
  if (!list) return;

  let photos = [];
  if (isSupabaseConfigured()) {
    try {
      const res = await apiFetch('/rest/v1/photos?select=*&order=created_at.desc');
      photos = await res.json();
    } catch (e) {
      list.innerHTML = '<p style="color:var(--text-secondary);font-size:0.88rem;">加载失败</p>';
      return;
    }
  } else {
    photos = DEMO_PHOTOS;
  }

  if (photos.length === 0) {
    list.innerHTML = '<p style="color:var(--text-secondary);font-size:0.88rem;">还没有照片</p>';
    return;
  }

  list.innerHTML = photos.map(p => `
    <div class="manage-item">
      <div class="item-info">
        <div class="item-title">${escapeHTML(p.caption || '(无说明)')}</div>
        <div class="item-meta">${p.created_at ? new Date(p.created_at).toLocaleDateString('zh-CN') : ''}</div>
      </div>
      <button class="btn-delete" onclick="deletePhoto(${p.id})">删除</button>
    </div>
  `).join('');
}

async function deletePhoto(id) {
  if (!confirm('确定要删除这张照片吗？')) return;

  if (isSupabaseConfigured()) {
    const token = localStorage.getItem('love_story_token');
    if (!token) { showToast('请先登录', 'error'); return; }
    try {
      await apiFetch(`/rest/v1/photos?id=eq.${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
    } catch (e) {
      showToast('删除失败', 'error');
      return;
    }
  } else {
    const idx = DEMO_PHOTOS.findIndex(p => p.id === id);
    if (idx >= 0) DEMO_PHOTOS.splice(idx, 1);
  }

  showToast('已删除', 'success');
  loadPhotoManageList();
}

// ---- 刷新 ----

async function refreshEvents() {
  if (typeof allEvents === 'undefined') return;

  if (isSupabaseConfigured()) {
    try {
      const res = await apiFetch('/rest/v1/important_dates?select=*&order=event_date.asc');
      allEvents = await res.json();
    } catch (e) {
      console.warn('刷新失败');
    }
  }

  if (typeof renderCalendar === 'function') renderCalendar();
  if (typeof renderEventList === 'function') renderEventList();
}

// ---- 悄悄话管理 ----

async function loadMsgManageList() {
  const list = document.getElementById('adminMsgList');
  if (!list) return;

  let messages = [];
  if (isSupabaseConfigured()) {
    try {
      const token = localStorage.getItem('love_story_token');
      if (!token) {
        list.innerHTML = '<p style="color:var(--text-secondary);font-size:0.88rem;">请先登录</p>';
        return;
      }
      const res = await apiFetch('/rest/v1/messages?select=*&order=created_at.desc', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      messages = await res.json();
    } catch (e) {
      list.innerHTML = '<p style="color:var(--text-secondary);font-size:0.88rem;">加载失败</p>';
      return;
    }
  } else {
    messages = DEMO_MESSAGES;
  }

  if (messages.length === 0) {
    list.innerHTML = '<p style="color:var(--text-secondary);font-size:0.88rem;">还没有悄悄话</p>';
    return;
  }

  list.innerHTML = messages.map(m => `
    <div class="manage-item">
      <div class="item-info">
        <div class="item-title">${escapeHTML(m.author_name)}: ${escapeHTML(m.content.substring(0, 30))}${m.content.length > 30 ? '...' : ''}</div>
        <div class="item-meta">${m.created_at ? new Date(m.created_at).toLocaleDateString('zh-CN') : ''}</div>
      </div>
      <button class="btn-delete" onclick="deleteMessage(${m.id})">删除</button>
    </div>
  `).join('');
}

async function deleteMessage(id) {
  if (!confirm('确定要删除这条悄悄话吗？')) return;

  if (isSupabaseConfigured()) {
    const token = localStorage.getItem('love_story_token');
    if (!token) { showToast('请先登录', 'error'); return; }
    try {
      await apiFetch(`/rest/v1/messages?id=eq.${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
    } catch (e) {
      showToast('删除失败', 'error');
      return;
    }
  } else {
    const idx = DEMO_MESSAGES.findIndex(m => m.id === id);
    if (idx >= 0) DEMO_MESSAGES.splice(idx, 1);
  }

  showToast('已删除', 'success');
  loadMsgManageList();
}

// ---- Init ----

document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('love_story_token');
  if (token) {
    window.AppState.isLoggedIn = true;
    showLoggedInUI();
  }

  document.getElementById('btnLogin').addEventListener('click', login);
  document.getElementById('btnLogout').addEventListener('click', logout);
  document.getElementById('btnAddDate').addEventListener('click', addImportantDate);
  document.getElementById('btnAdminUpload').addEventListener('click', adminUploadPhoto);

  document.getElementById('loginPassword').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') login();
  });
});
