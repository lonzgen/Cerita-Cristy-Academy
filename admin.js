/* ============================================
   M-ADMIN — CERITA CRISTY ACADEMY
   Auth Google + cek admin, CRUD semua konten, upload gambar.
   supabaseClient & WA_NUMBER dari supabase-config.js
   ============================================ */
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

let user = null, isAdmin = false, currentSec = 'reviews', editingId = null, activeFields = [];

/* ============================================
   SKEMA TIAP SECTION
   ============================================ */
const SCHEMAS = {
  classes: {
    table: 'classes', title: 'Kelas & Jadwal', addLabel: '+ Tambah Kelas',
    sub: 'Kelas dengan tanggal di BULAN INI tampil di "Pilih Kelasmu". Bulan depan & seterusnya tampil di "Jadwal Mendatang" (maks 3).',
    order: 'class_date',
    fields: [
      { k: 'name', l: 'Nama kelas', t: 'text' },
      { k: 'num_label', l: 'Label nomor', t: 'text', h: 'mis. 01 — Starter' },
      { k: 'description', l: 'Deskripsi', t: 'textarea' },
      { k: 'meta', l: 'Badge (pisahkan dengan koma)', t: 'array', h: 'mis. 📅 1 Hari, 💻 Online, 🎓 Sertifikat' },
      { k: 'price', l: 'Harga', t: 'text', h: 'mis. Rp 399K atau Custom' },
      { k: 'price_note', l: 'Keterangan harga', t: 'text', h: 'mis. / orang' },
      { k: 'cta_label', l: 'Teks tombol', t: 'text', h: 'mis. Pesan via WhatsApp' },
      { k: 'is_hot', l: 'Tandai POPULER', t: 'checkbox' },
      { k: 'class_date', l: 'Tanggal kelas', t: 'date', h: 'Penentu section (bulan ini vs mendatang)' },
      { k: 'location', l: 'Lokasi', t: 'text', h: 'mis. Online via Zoom / Jakarta Selatan' },
      { k: 'time_info', l: 'Info waktu', t: 'text', h: 'mis. 09.00–16.00 WIB · Maks. 30 peserta' },
      { k: 'seats_left', l: 'Sisa kursi', t: 'number' },
      { k: 'is_full', l: 'Tandai Penuh', t: 'checkbox' },
      { k: 'sort_order', l: 'Urutan', t: 'number' },
    ],
    row: (r) => ({ title: r.name + (r.is_hot ? ' 🔥' : ''), desc: `${r.class_date || ''} · ${r.location || ''}`, tags: r.is_full ? [['hot', 'Penuh']] : [] })
  },
  partners: {
    table: 'partners', title: 'Partner / Logo', addLabel: '+ Tambah Logo',
    sub: 'Logo perusahaan di section "Telah dipercaya oleh".', order: 'sort_order',
    fields: [
      { k: 'name', l: 'Nama partner', t: 'text' },
      { k: 'logo_url', l: 'Logo', t: 'image', h: 'Upload file atau tempel URL manual' },
      { k: 'sort_order', l: 'Urutan', t: 'number' },
    ],
    row: (r) => ({ thumb: r.logo_url, title: r.name, desc: '' })
  },
  showreel: {
    table: 'showreel', title: 'Showreel', addLabel: '+ Tambah Video',
    sub: 'Video sorotan di section "Lihat Aksinya di Panggung".', order: 'sort_order',
    fields: [
      { k: 'title', l: 'Judul', t: 'text' },
      { k: 'video_url', l: 'Link video (YouTube / mp4)', t: 'url' },
      { k: 'thumbnail_url', l: 'Thumbnail', t: 'image' },
      { k: 'sort_order', l: 'Urutan', t: 'number' },
    ],
    row: (r) => ({ thumb: r.thumbnail_url, title: r.title, desc: r.video_url })
  },
  alumni: {
    table: 'alumni', title: 'Suara Alumni', addLabel: '+ Tambah Alumni',
    sub: 'Testimoni video di section "Suara Para Alumni".', order: 'sort_order',
    fields: [
      { k: 'name', l: 'Nama', t: 'text' },
      { k: 'role', l: 'Jabatan / Asal', t: 'text', h: 'mis. Marketing Manager · Tokopedia' },
      { k: 'duration', l: 'Durasi', t: 'text', h: 'mis. 0:12' },
      { k: 'video_url', l: 'Link video', t: 'url' },
      { k: 'thumbnail_url', l: 'Thumbnail', t: 'image' },
      { k: 'sort_order', l: 'Urutan', t: 'number' },
    ],
    row: (r) => ({ thumb: r.thumbnail_url, title: r.name, desc: r.role })
  },
  gallery: {
    table: 'gallery', title: 'Momen After Class', addLabel: '+ Tambah Foto',
    sub: 'Galeri foto kegiatan.', order: 'sort_order',
    fields: [
      { k: 'title', l: 'Judul', t: 'text' },
      { k: 'caption', l: 'Keterangan', t: 'text', h: 'mis. Pro Intensive · 28 Peserta · Jun 2025' },
      { k: 'image_url', l: 'Foto', t: 'image' },
      { k: 'height', l: 'Tinggi foto (px)', t: 'number', h: 'default 190 — variasikan untuk efek masonry' },
      { k: 'sort_order', l: 'Urutan', t: 'number' },
    ],
    row: (r) => ({ thumb: r.image_url, title: r.title, desc: r.caption })
  },
};

/* ============================================
   AUTH
   ============================================ */
function showLogin(msg) {
  $('app').style.display = 'none';
  $('loginWrap').style.display = 'flex';
  const e = $('loginErr');
  if (msg) { e.textContent = msg; e.style.display = 'block'; } else { e.style.display = 'none'; }
}
function showApp() {
  $('loginWrap').style.display = 'none';
  $('app').style.display = 'grid';
  $('who').textContent = user.email;
  selectSection('reviews');
}
async function checkAuth() {
  const { data } = await supabaseClient.auth.getSession();
  user = data.session?.user || null;
  if (!user) return showLogin();
  const { data: rows, error } = await supabaseClient.from('admins').select('email').eq('email', user.email);
  isAdmin = !error && rows && rows.length > 0;
  if (!isAdmin) {
    showLogin('Akun ini belum terdaftar sebagai admin. Tambahkan email Anda di tabel "admins" (lihat panduan), lalu coba lagi.');
    return;
  }
  showApp();
}
$('loginBtn').addEventListener('click', async () => {
  await supabaseClient.auth.signOut().catch(() => {});
  await supabaseClient.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: location.href.split('#')[0], queryParams: { prompt: 'select_account' } }
  });
});
$('logoutBtn').addEventListener('click', async () => { await supabaseClient.auth.signOut(); location.reload(); });
supabaseClient.auth.onAuthStateChange((event) => {
  if (event === 'SIGNED_IN') checkAuth();
  if (event === 'SIGNED_OUT') showLogin();
});

/* ============================================
   NAVIGASI SECTION
   ============================================ */
document.querySelectorAll('.navbtn').forEach(b => b.addEventListener('click', () => selectSection(b.dataset.sec)));

function selectSection(sec) {
  currentSec = sec;
  document.querySelectorAll('.navbtn').forEach(b => b.classList.toggle('active', b.dataset.sec === sec));
  if (sec === 'reviews') { $('secTitle').textContent = 'Ulasan'; $('secSub').textContent = 'Setujui ulasan agar tampil di website, atau hapus.'; $('addBtn').style.display = 'none'; renderReviews(); }
  else if (sec === 'settings') { $('secTitle').textContent = 'Pengaturan'; $('secSub').textContent = 'Angka statistik & hero di website.'; $('addBtn').style.display = 'none'; renderSettings(); }
  else {
    const s = SCHEMAS[sec];
    $('secTitle').textContent = s.title; $('secSub').textContent = s.sub;
    $('addBtn').style.display = 'inline-block';
    renderList(sec);
  }
}
$('addBtn').addEventListener('click', () => openModal(currentSec, null));

/* ============================================
   RENDER LIST (entitas generik)
   ============================================ */
async function renderList(sec) {
  const s = SCHEMAS[sec];
  $('list').innerHTML = '<div class="empty">Memuat…</div>';
  const { data, error } = await supabaseClient.from(s.table).select('*').order(s.order, { ascending: true });
  if (error) { $('list').innerHTML = `<div class="empty">Gagal memuat: ${esc(error.message)}</div>`; return; }
  if (!data.length) { $('list').innerHTML = '<div class="empty">Belum ada data. Klik "Tambah" untuk menambah.</div>'; return; }
  $('list').innerHTML = data.map(r => {
    const v = s.row(r);
    const thumb = v.thumb ? `<img class="thumb" src="${esc(v.thumb)}" alt=""/>` : '';
    const tags = (v.tags || []).map(t => `<span class="tag ${t[0]}">${esc(t[1])}</span>`).join('');
    return `<div class="item">${thumb}
      <div class="info"><h4>${tags}${esc(v.title)}</h4><p>${esc(v.desc || '')}</p></div>
      <div class="acts">
        <button class="mini" onclick="editRow('${sec}','${r.id}')">Edit</button>
        <button class="mini danger" onclick="deleteRow('${sec}','${r.id}')">Hapus</button>
      </div></div>`;
  }).join('');
  window._cache = window._cache || {}; window._cache[sec] = data;
}

window.editRow = (sec, id) => {
  const row = (window._cache[sec] || []).find(x => x.id === id);
  openModal(sec, row);
};
window.deleteRow = async (sec, id) => {
  if (!confirm('Yakin hapus data ini?')) return;
  const { error } = await supabaseClient.from(SCHEMAS[sec].table).delete().eq('id', id);
  if (error) { alert('Gagal hapus: ' + error.message); return; }
  renderList(sec);
};

/* ============================================
   MODAL FORM (tambah / edit)
   ============================================ */
function openModal(sec, row) {
  const s = SCHEMAS[sec];
  editingId = row ? row.id : null;
  activeFields = [];
  $('modalTitle').textContent = (row ? 'Edit ' : 'Tambah ') + s.title;
  const box = $('modalFields'); box.innerHTML = '';
  s.fields.forEach(f => {
    const val = row ? row[f.k] : '';
    const wrap = document.createElement('div');
    wrap.className = 'fld' + (f.t === 'checkbox' ? ' check' : '');
    let getValue;
    if (f.t === 'checkbox') {
      wrap.innerHTML = `<input type="checkbox" id="f_${f.k}" ${val ? 'checked' : ''}/><label for="f_${f.k}">${f.l}</label>`;
      getValue = async () => wrap.querySelector('input').checked;
    } else if (f.t === 'textarea') {
      wrap.innerHTML = `<label>${f.l}</label><textarea>${esc(val || '')}</textarea>${f.h ? `<div class="hint">${f.h}</div>` : ''}`;
      getValue = async () => wrap.querySelector('textarea').value.trim() || null;
    } else if (f.t === 'array') {
      wrap.innerHTML = `<label>${f.l}</label><input type="text" value="${esc((val || []).join(', '))}"/>${f.h ? `<div class="hint">${f.h}</div>` : ''}`;
      getValue = async () => wrap.querySelector('input').value.split(',').map(x => x.trim()).filter(Boolean);
    } else if (f.t === 'image') {
      wrap.innerHTML = `<label>${f.l}</label>
        <input type="file" accept="image/*"/>
        <input type="url" placeholder="atau tempel URL gambar…" value="${esc(val || '')}" style="margin-top:8px"/>
        <div class="hint">${f.h || 'Upload file atau isi URL manual.'}</div>
        <img class="preview" ${val ? `src="${esc(val)}" style="display:block"` : ''}/>`;
      const file = wrap.querySelector('input[type=file]');
      const url = wrap.querySelector('input[type=url]');
      const prev = wrap.querySelector('.preview');
      file.addEventListener('change', () => {
        if (file.files[0]) { prev.src = URL.createObjectURL(file.files[0]); prev.style.display = 'block'; }
      });
      url.addEventListener('input', () => { if (url.value) { prev.src = url.value; prev.style.display = 'block'; } });
      getValue = async () => {
        if (file.files[0]) return await uploadImage(file.files[0], sec);
        return url.value.trim() || null;
      };
    } else {
      const type = f.t === 'number' ? 'number' : f.t === 'date' ? 'date' : f.t === 'url' ? 'url' : 'text';
      wrap.innerHTML = `<label>${f.l}</label><input type="${type}" value="${esc(val ?? '')}"/>${f.h ? `<div class="hint">${f.h}</div>` : ''}`;
      getValue = async () => {
        const raw = wrap.querySelector('input').value.trim();
        if (f.t === 'number') return raw === '' ? 0 : Number(raw);
        return raw || null;
      };
    }
    activeFields.push({ k: f.k, getValue });
    box.appendChild(wrap);
  });
  $('modalBg').classList.add('show');
}
$('modalCancel').addEventListener('click', () => $('modalBg').classList.remove('show'));
$('modalBg').addEventListener('click', e => { if (e.target === $('modalBg')) $('modalBg').classList.remove('show'); });

$('modalSave').addEventListener('click', async () => {
  const s = SCHEMAS[currentSec];
  const btn = $('modalSave'); btn.disabled = true; btn.textContent = 'Menyimpan…';
  try {
    const payload = {};
    for (const f of activeFields) payload[f.k] = await f.getValue();
    let res;
    if (editingId) res = await supabaseClient.from(s.table).update(payload).eq('id', editingId);
    else res = await supabaseClient.from(s.table).insert(payload);
    if (res.error) throw res.error;
    $('modalBg').classList.remove('show');
    renderList(currentSec);
  } catch (err) {
    alert('Gagal menyimpan: ' + err.message);
  } finally {
    btn.disabled = false; btn.textContent = 'Simpan';
  }
});

/* ============================================
   UPLOAD GAMBAR -> Storage bucket "media"
   ============================================ */
async function uploadImage(file, folder) {
  const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `${folder}/${Date.now()}_${safe}`;
  const { error } = await supabaseClient.storage.from('media').upload(path, file, { upsert: false });
  if (error) throw error;
  return supabaseClient.storage.from('media').getPublicUrl(path).data.publicUrl;
}

/* ============================================
   REVIEWS (moderasi)
   ============================================ */
async function renderReviews() {
  $('list').innerHTML = '<div class="empty">Memuat…</div>';
  const { data, error } = await supabaseClient.from('reviews').select('*').order('created_at', { ascending: false });
  if (error) { $('list').innerHTML = `<div class="empty">Gagal memuat: ${esc(error.message)}</div>`; return; }
  if (!data.length) { $('list').innerHTML = '<div class="empty">Belum ada ulasan.</div>'; return; }
  $('list').innerHTML = data.map(r => {
    const tag = r.verified ? '<span class="tag ok">Tampil</span>' : '<span class="tag pend">Menunggu</span>';
    const stars = '★'.repeat(r.rating) + '☆'.repeat(5 - r.rating);
    const toggle = r.verified
      ? `<button class="mini" onclick="setVerify('${r.id}',false)">Sembunyikan</button>`
      : `<button class="mini go" onclick="setVerify('${r.id}',true)">Setujui</button>`;
    return `<div class="item"><div class="info">
        <h4>${tag}${esc(r.name)} <span style="color:var(--gold-deep)">${stars}</span></h4>
        <p><b>${esc(r.kelas || '')}</b> — ${esc(r.body)}</p>
      </div><div class="acts">${toggle}
        <button class="mini danger" onclick="deleteReview('${r.id}')">Hapus</button>
      </div></div>`;
  }).join('');
}
window.setVerify = async (id, val) => {
  const { error } = await supabaseClient.from('reviews').update({ verified: val }).eq('id', id);
  if (error) { alert('Gagal: ' + error.message); return; }
  renderReviews();
};
window.deleteReview = async (id) => {
  if (!confirm('Hapus ulasan ini?')) return;
  const { error } = await supabaseClient.from('reviews').delete().eq('id', id);
  if (error) { alert('Gagal: ' + error.message); return; }
  renderReviews();
};

/* ============================================
   SETTINGS
   ============================================ */
const SETTING_KEYS = [
  { k: 'stat_peserta', l: 'Jumlah peserta terlatih' },
  { k: 'stat_partner', l: 'Jumlah perusahaan partner' },
  { k: 'stat_tahun', l: 'Tahun pengalaman' },
  { k: 'hero_alumni', l: 'Alumni terlatih (kartu hero)' },
];
async function renderSettings() {
  $('list').innerHTML = '<div class="empty">Memuat…</div>';
  const { data } = await supabaseClient.from('settings').select('*');
  const map = Object.fromEntries((data || []).map(r => [r.key, r.value]));
  $('list').innerHTML = `<div class="item" style="display:block">
    ${SETTING_KEYS.map(s => `<div class="fld"><label>${s.l}</label>
      <input type="text" id="set_${s.k}" value="${esc(map[s.k] || '')}"/></div>`).join('')}
    <button class="btn-add" id="saveSettings">Simpan Pengaturan</button>
  </div>`;
  $('saveSettings').addEventListener('click', async () => {
    const rows = SETTING_KEYS.map(s => ({ key: s.k, value: $('set_' + s.k).value.trim() }));
    const { error } = await supabaseClient.from('settings').upsert(rows);
    if (error) { alert('Gagal: ' + error.message); return; }
    alert('Pengaturan disimpan ✅');
  });
}

/* INIT */
checkAuth();
