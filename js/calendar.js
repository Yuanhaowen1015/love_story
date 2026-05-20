// ============================================================
// calendar.js — 纪念日日历
// ============================================================

let calYear, calMonth;
let allEvents = [];

function initCalendar() {
  const now = new Date();
  calYear = now.getFullYear();
  calMonth = now.getMonth();
  loadEvents();
}

async function loadEvents() {
  if (isSupabaseConfigured()) {
    try {
      const res = await apiFetch('/rest/v1/important_dates?select=*&order=event_date.asc');
      allEvents = await res.json();
    } catch (e) {
      console.warn('加载纪念日失败，使用本地数据');
      allEvents = DEMO_EVENTS;
    }
  } else {
    allEvents = DEMO_EVENTS;
  }
  renderCalendar();
  renderEventList();
}

function renderCalendar() {
  document.getElementById('calMonthLabel').textContent = `${calYear}年${calMonth + 1}月`;

  const grid = document.getElementById('calendarGrid');
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const headers = ['日', '一', '二', '三', '四', '五', '六'];
  let html = headers.map(h => `<div class="day-header">${h}</div>`).join('');

  const prevMonthDays = new Date(calYear, calMonth, 0).getDate();
  for (let i = firstDay - 1; i >= 0; i--) {
    html += `<div class="day-cell other-month">${prevMonthDays - i}</div>`;
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const isToday = dateStr === todayStr;
    const hasEvent = allEvents.some(e => e.event_date === dateStr);
    let cls = 'day-cell';
    if (isToday) cls += ' today';
    if (hasEvent) cls += ' has-event';
    html += `<div class="day-cell ${cls}" data-date="${dateStr}">${d}</div>`;
  }

  const totalCells = firstDay + daysInMonth;
  const remaining = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
  for (let i = 1; i <= remaining; i++) {
    html += `<div class="day-cell other-month">${i}</div>`;
  }

  grid.innerHTML = html;

  grid.querySelectorAll('.day-cell.has-event').forEach(cell => {
    cell.addEventListener('click', () => showDateDetail(cell.dataset.date));
  });
}

function showDateDetail(dateStr) {
  const events = allEvents.filter(e => e.event_date === dateStr);
  if (events.length === 0) return;

  const [y, m, d] = dateStr.split('-');
  const bodyHTML = events.map(e => `
    <div style="margin-bottom: 16px;">
      <div style="font-weight:600;margin-bottom:4px;">${e.title}</div>
      ${e.description ? `<div style="color:var(--text-secondary);font-size:0.9rem;">${e.description}</div>` : ''}
    </div>
  `).join('');

  showModal(`${y}年${parseInt(m)}月${parseInt(d)}日`, bodyHTML);
}

function renderEventList() {
  const list = document.getElementById('eventList');
  if (allEvents.length === 0) {
    list.innerHTML = '<p style="text-align:center;color:var(--text-secondary);padding:20px 0;">还没有记录纪念日，去「我们的空间」添加吧</p>';
    return;
  }

  const sorted = [...allEvents].sort((a, b) => a.event_date.localeCompare(b.event_date));
  list.innerHTML = sorted.map(e => {
    const d = new Date(e.event_date + 'T00:00:00');
    const month = d.getMonth() + 1;
    const day = d.getDate();
    return `
      <div class="event-item">
        <div class="event-date-badge">
          <span class="month">${month}月</span>
          <span class="day">${day}</span>
        </div>
        <div class="event-info">
          <div class="event-title">${e.title}</div>
          ${e.description ? `<div class="event-desc">${e.description}</div>` : ''}
        </div>
      </div>
    `;
  }).join('');
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('calPrev').addEventListener('click', () => {
    calMonth--;
    if (calMonth < 0) { calMonth = 11; calYear--; }
    renderCalendar();
    renderEventList();
  });
  document.getElementById('calNext').addEventListener('click', () => {
    calMonth++;
    if (calMonth > 11) { calMonth = 0; calYear++; }
    renderCalendar();
    renderEventList();
  });

  let calInitialized = false;
  window.addEventListener('hashchange', () => {
    if (location.hash === '#calendar' && !calInitialized) {
      initCalendar();
      calInitialized = true;
    }
  });
  if (location.hash === '#calendar') {
    initCalendar();
    calInitialized = true;
  }
});
