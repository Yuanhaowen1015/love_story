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

// 直接用 REST API，不依赖任何外部 SDK（国内也能用）
async function apiFetch(path, options = {}) {
  const headers = {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    ...options.headers,
  };
  // 文件上传（File/Blob）不转 JSON，让浏览器自动设 Content-Type
  if (options.body && typeof options.body !== 'string' && !(options.body instanceof File) && !(options.body instanceof Blob)) {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  }
  const res = await fetch(`${SUPABASE_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res;
}

// 兼容旧的初始化调用
async function initSupabase() {
  if (!isSupabaseConfigured()) return null;
  return true;
}
