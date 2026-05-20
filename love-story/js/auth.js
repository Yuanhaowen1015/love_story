// ============================================================
// auth.js — 登录认证 & 管理后台
// ============================================================

async function initAuth() {
  if (!isSupabaseConfigured()) return;
  await initSupabase();
  if (!supabase) return;

  const { data } = await supabase.auth.getSession();
  if (data.session) {
    window.AppState.isLoggedIn = true;
    window.AppState.session = data.session;
    showLoggedInUI();
  }
}

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
    await initSupabase();
    if (supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        showToast('登录失败: ' + error.message, 'error');
        return;
      }
      window.AppState.isLoggedIn = true;
      window.AppState.session = data.session;
    }
  } else {
    if (password !== '123456') {
      showToast('演示模式密码: 123456', 'error');
      return;
    }
    window.AppState.isLoggedIn = true;
  }

  localStorage.setItem('love_story_email', email);
  showLoggedInUI();
  showToast('登录成功', 'success');
}

async function logout() {
  if (isSupabaseConfigured() && supabase) {
    await supabase.auth.signOut();
  }
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
    await initSupabase();
    if (supabase) {
      const { error } = await supabase
        .from('important_dates')
        .insert({ title, event_date: eventDate, description });
      if (error) {
        showToast('保存失败: ' + error.message, 'error');
        return;
      }
    }
  } else {
    DEMO_EVENTS.push({ id: Date.now(), title, event_date: eventDate, description, type: 'other' });
  }

  showToast('纪念日已保存', 'success');
  document.getElementById('adminDateTitle').value = '';
  document.getElementById('adminDateValue').value = '';
  document.getElementById('adminDateDesc').value = '';

  // Refresh calendar if events are loaded
  if (typeof allEvents !== 'undefined') {
    if (isSupabaseConfigured() && supabase) {
      const { data } = await supabase
        .from('important_dates')
        .select('*')
        .order('event_date', { ascending: true });
      if (data) allEvents = data;
    }
    if (typeof renderCalendar === 'function') renderCalendar();
    if (typeof renderEventList === 'function') renderEventList();
  }
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
  initAuth();

  document.getElementById('btnLogin').addEventListener('click', login);
  document.getElementById('btnLogout').addEventListener('click', logout);
  document.getElementById('btnAddDate').addEventListener('click', addImportantDate);
  document.getElementById('btnAdminUpload').addEventListener('click', adminUploadPhoto);

  document.getElementById('loginPassword').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') login();
  });

  if (window.AppState.isLoggedIn) showLoggedInUI();
});
