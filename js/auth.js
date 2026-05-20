// ============================================================
// auth.js — 登录认证 & 管理后台
// ============================================================

function showLoggedInUI() {
  document.getElementById('adminLoggedOut').classList.add('hidden');
  document.getElementById('adminLoggedIn').classList.remove('hidden');
  document.getElementById('photoUploadBar').classList.remove('hidden');
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
  localStorage.removeItem('love_story_email');
  window.AppState.isLoggedIn = false;
  window.AppState.session = null;
  document.getElementById('loginEmail').value = '';
  document.getElementById('loginPassword').value = '';
  showLoggedOutUI();
  showToast('已退出登录');
}

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

  // Refresh calendar
  await refreshEvents();
}

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
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // Check if already logged in
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
