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

let supabase = null;

// 动态加载 Supabase SDK（多 CDN 并发，哪个快用哪个，5秒超时）
function loadSupabaseSDK() {
  if (window.supabase) return Promise.resolve(window.supabase);

  const CDN_URLS = [
    'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',
    'https://unpkg.com/@supabase/supabase-js@2',
    'https://esm.sh/@supabase/supabase-js@2',
  ];

  return new Promise((resolve, reject) => {
    let loaded = false;
    const timer = setTimeout(() => {
      if (!loaded) {
        loaded = true;
        reject(new Error('Supabase SDK 加载超时，将使用演示模式'));
      }
    }, 5000);

    CDN_URLS.forEach(url => {
      const script = document.createElement('script');
      script.src = url;
      script.onload = () => {
        if (!loaded && window.supabase) {
          loaded = true;
          clearTimeout(timer);
          resolve(window.supabase);
        }
      };
      script.onerror = () => {
        // 尝试下一个 CDN
      };
      document.head.appendChild(script);
    });
  });
}

// 初始化 Supabase 客户端（缓存 promise，只加载一次）
let supabaseInitPromise = null;

async function initSupabase() {
  if (!isSupabaseConfigured()) return null;
  if (supabase) return supabase;
  if (supabaseInitPromise) return supabaseInitPromise;

  supabaseInitPromise = (async () => {
    try {
      await loadSupabaseSDK();
      supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      return supabase;
    } catch (e) {
      console.warn(e.message);
      return null;
    }
  })();

  return supabaseInitPromise;
}
