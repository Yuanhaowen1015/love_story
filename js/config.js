// ============================================================
// Supabase 配置 — 部署前把下面两行改成你自己的值
// 在 Supabase Dashboard -> Settings -> API 中可以找到
// ============================================================

const SUPABASE_URL = 'https://cdlokfpbehxdteiohhss.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_tofxwkqk6PiYn9EouNoexQ_UNswUpbq';

// ============================================================
// 下方代码无需修改
// ============================================================

const isSupabaseConfigured = () =>
  SUPABASE_URL !== 'https://your-project-id.supabase.co' &&
  SUPABASE_ANON_KEY !== 'your-anon-key-here';

// 尝试用 refresh_token 换一个新 token
async function tryRefreshToken() {
  const refreshToken = localStorage.getItem('love_story_refresh_token');
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!res.ok) {
      // 刷新失败，清除旧 token，下次需要重新登录
      localStorage.removeItem('love_story_token');
      localStorage.removeItem('love_story_refresh_token');
      return null;
    }
    const data = await res.json();
    localStorage.setItem('love_story_token', data.access_token);
    localStorage.setItem('love_story_refresh_token', data.refresh_token);
    return data.access_token;
  } catch (e) {
    return null;
  }
}

// 统一的 API 请求函数，自动处理 token 过期
async function apiFetch(path, options = {}) {
  let token = localStorage.getItem('love_story_token');

  async function doFetch(authToken) {
    const headers = {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${authToken || SUPABASE_ANON_KEY}`,
      ...options.headers,
    };
    const body = (options.body && typeof options.body !== 'string' && !(options.body instanceof File) && !(options.body instanceof Blob))
      ? JSON.stringify(options.body)
      : options.body;

    if (body && body !== options.body && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    return fetch(`${SUPABASE_URL}${path}`, { ...options, headers, body });
  }

  let res = await doFetch(token);

  // 如果是 403/401 且我们有 token，尝试刷新
  if ((res.status === 401 || res.status === 403) && token) {
    const newToken = await tryRefreshToken();
    if (newToken) {
      res = await doFetch(newToken);  // 用新 token 重试
    } else {
      // 刷新失败，通知用户重新登录
      window.AppState.isLoggedIn = false;
      if (typeof showLoggedOutUI === 'function') showLoggedOutUI();
    }
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res;
}
