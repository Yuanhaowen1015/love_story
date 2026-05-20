// ============================================================
// photos.js — 照片墙
// ============================================================

let allPhotos = [];
let lightboxIndex = -1;

async function loadPhotos() {
  const grid = document.getElementById('photoGrid');
  grid.innerHTML = '<div class="spinner"></div>';

  if (isSupabaseConfigured()) {
    await initSupabase();
    if (supabase) {
      const { data, error } = await supabase
        .from('photos')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error) allPhotos = data;
    } else {
      allPhotos = DEMO_PHOTOS;
    }
  } else {
    allPhotos = DEMO_PHOTOS;
  }
  renderPhotos();
}

function renderPhotos() {
  const grid = document.getElementById('photoGrid');

  if (allPhotos.length === 0) {
    grid.innerHTML = '<div class="photo-empty"><span class="icon">🖼</span><p>暂无照片，等待美好被记录</p></div>';
    return;
  }

  grid.innerHTML = allPhotos.map((p, i) => {
    const imgSrc = p.image_url || generatePlaceholder(i);
    return `
      <div class="photo-item" data-index="${i}">
        <img src="${imgSrc}" alt="${escapeAttr(p.caption || '')}" loading="lazy">
        ${p.caption ? `<div class="photo-caption">${escapeHTML(p.caption)}</div>` : ''}
      </div>
    `;
  }).join('');

  grid.querySelectorAll('.photo-item').forEach(item => {
    item.addEventListener('click', () => {
      lightboxIndex = parseInt(item.dataset.index);
      showLightbox(lightboxIndex);
    });
  });
}

function generatePlaceholder(i) {
  const colors = ['#d4c5c4', '#c4b5b4', '#d5cec0', '#c8c0b5', '#d0c8c0', '#c5bdb8'];
  const color = colors[i % colors.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="${400 + i * 30}" viewBox="0 0 600 ${400 + i * 30}"><rect fill="${color}" width="600" height="${400 + i * 30}"/><text fill="#fff" font-family="sans-serif" font-size="18" text-anchor="middle" x="300" y="${200 + i * 15}">Photo ${i + 1}</text></svg>`;
  return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
}

function escapeAttr(str) {
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// --- Lightbox ---
function showLightbox(index) {
  const lb = document.getElementById('lightbox');
  const img = document.getElementById('lightboxImg');
  const photo = allPhotos[index];
  img.src = photo.image_url || generatePlaceholder(index);
  img.alt = photo.caption || '';
  lb.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  document.getElementById('lightbox').classList.add('hidden');
  document.body.style.overflow = '';
}

function lightboxPrev() {
  if (allPhotos.length === 0) return;
  lightboxIndex = (lightboxIndex - 1 + allPhotos.length) % allPhotos.length;
  showLightbox(lightboxIndex);
}

function lightboxNext() {
  if (allPhotos.length === 0) return;
  lightboxIndex = (lightboxIndex + 1) % allPhotos.length;
  showLightbox(lightboxIndex);
}

// --- Upload ---
async function uploadPhoto(file, caption) {
  if (!isSupabaseConfigured()) {
    showToast('请先配置 Supabase 连接', 'error');
    return false;
  }

  await initSupabase();
  if (!supabase) {
    showToast('数据库连接失败，请稍后重试', 'error');
    return false;
  }

  const fileName = `${Date.now()}-${file.name}`;
  const { error: uploadError } = await supabase.storage
    .from('photos')
    .upload(fileName, file);

  if (uploadError) {
    showToast('上传失败: ' + uploadError.message, 'error');
    return false;
  }

  const { data: urlData } = supabase.storage
    .from('photos')
    .getPublicUrl(fileName);

  const { error: dbError } = await supabase
    .from('photos')
    .insert({ image_url: urlData.publicUrl, caption });

  if (dbError) {
    showToast('保存失败: ' + dbError.message, 'error');
    return false;
  }

  showToast('照片上传成功', 'success');
  await loadPhotos();
  return true;
}

// --- Init ---
document.addEventListener('DOMContentLoaded', () => {
  let photosInitialized = false;

  window.addEventListener('hashchange', () => {
    if (location.hash === '#photos' && !photosInitialized) {
      loadPhotos();
      photosInitialized = true;
    }
  });

  if (location.hash === '#photos') {
    loadPhotos();
    photosInitialized = true;
  }

  document.getElementById('lightboxClose').addEventListener('click', closeLightbox);
  document.getElementById('lightboxPrev').addEventListener('click', lightboxPrev);
  document.getElementById('lightboxNext').addEventListener('click', lightboxNext);
  document.getElementById('lightbox').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeLightbox();
  });

  document.addEventListener('keydown', (e) => {
    const lb = document.getElementById('lightbox');
    if (lb.classList.contains('hidden')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') lightboxPrev();
    if (e.key === 'ArrowRight') lightboxNext();
  });

  document.getElementById('btnSelectPhoto').addEventListener('click', () => {
    document.getElementById('photoFileInput').click();
  });

  document.getElementById('photoFileInput').addEventListener('change', function() {
    const btn = document.getElementById('btnUploadPhoto');
    if (this.files.length > 0) {
      btn.style.display = 'inline-block';
      btn.textContent = `上传 (${this.files[0].name})`;
    }
  });

  document.getElementById('btnUploadPhoto').addEventListener('click', async () => {
    const file = document.getElementById('photoFileInput').files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast('照片不能超过 5MB，请先压缩', 'error');
      return;
    }
    const caption = document.getElementById('photoCaption').value.trim();
    const ok = await uploadPhoto(file, caption);
    if (ok) {
      document.getElementById('photoFileInput').value = '';
      document.getElementById('photoCaption').value = '';
      document.getElementById('btnUploadPhoto').style.display = 'none';
    }
  });
});
