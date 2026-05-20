// ============================================================
// app.js — 路由、导航、全局状态、工具函数
// ============================================================

window.AppState = {
  isLoggedIn: false,
  session: null,
};

// --- Demo data (used when Supabase is not configured) ---
const DEMO_EVENTS = [
  { id: 1, title: '第一次见面', event_date: '2025-03-15', description: '在咖啡馆的角落里，阳光正好洒在你身上', type: 'first_meet' },
  { id: 2, title: '在一起的日子', event_date: '2025-06-01', description: '你说好，我说一辈子', type: 'anniversary' },
  { id: 3, title: '第一次旅行', event_date: '2025-10-02', description: '大理的风花雪月，都不及你眼里的星光', type: 'other' },
];

const DEMO_PHOTOS = [
  { id: 1, image_url: '', caption: '那天阳光很好，你也很好', created_at: '2025-06-01' },
  { id: 2, image_url: '', caption: '一起看的第7场日落', created_at: '2025-08-15' },
  { id: 3, image_url: '', caption: '你做的第一顿饭', created_at: '2025-09-20' },
];

const DEMO_MESSAGES = [
  { id: 1, author_name: '小美', content: '祝你们永远幸福！每次看到你们的照片都觉得好甜～', created_at: '2026-01-15T08:00:00' },
  { id: 2, author_name: '阿强', content: '兄弟找到这么好的人，真心替你高兴', created_at: '2026-02-10T14:30:00' },
];

// --- Toast ---
function showToast(msg, type = '') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2800);
}

// --- Modal ---
function showModal(title, bodyHTML, onClose) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal">
      <h3>${title}</h3>
      ${bodyHTML}
      <button class="modal-close">关闭</button>
    </div>
  `;
  overlay.querySelector('.modal-close').addEventListener('click', () => {
    overlay.remove();
    if (onClose) onClose();
  });
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
  document.body.appendChild(overlay);
}

// --- Route ---
function route() {
  const hash = location.hash.slice(1) || 'home';
  document.querySelectorAll('.page-section').forEach(s => s.classList.add('hidden'));
  const target = document.getElementById(`page-${hash}`);
  if (target) target.classList.remove('hidden');

  document.querySelectorAll('.nav-link').forEach(l => {
    l.classList.toggle('active', l.getAttribute('href') === `#${hash}`);
  });

  // Close mobile nav
  document.getElementById('navLinks').classList.remove('open');

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

window.addEventListener('hashchange', route);
window.addEventListener('DOMContentLoaded', () => {
  route();

  // Mobile nav toggle
  document.getElementById('navToggle').addEventListener('click', () => {
    document.getElementById('navLinks').classList.toggle('open');
  });

  // Admin link: redirect to #admin
  document.querySelectorAll('.nav-link').forEach(link => {
    if (link.getAttribute('href') === '#admin') {
      // already handles routing
    }
  });
});
