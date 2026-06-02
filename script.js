/* ============================================
   CERITA CRISTY ACADEMY — SCRIPT (Supabase)
   Memuat semua data dinamis dari Supabase + Google login untuk ulasan.
   Catatan: supabaseClient & WA_NUMBER didefinisikan di supabase-config.js
   ============================================ */

/* ---------- UTIL ---------- */
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const MONTHS_ID = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
function initials(name) {
  return (name || '?').trim().split(/\s+/).slice(0, 2).map(w => w[0] || '').join('').toUpperCase();
}
function starString(rating) {
  const r = Math.round(rating);
  return '★'.repeat(r) + `<span class="star-dim">${'★'.repeat(5 - r)}</span>`;
}
function openWA(message) {
  window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(message)}`, '_blank');
}

/* ============================================
   MOBILE MENU (hamburger)
   ============================================ */
const hamburger = $('hamburger');
const navLinks = $('navLinks');
const navOverlay = $('navOverlay');
function toggleMenu(open) {
  hamburger.classList.toggle('open', open);
  navLinks.classList.toggle('open', open);
  navOverlay.classList.toggle('show', open);
  hamburger.setAttribute('aria-expanded', open);
  document.body.style.overflow = open ? 'hidden' : '';
}
if (hamburger) {
  hamburger.addEventListener('click', () => toggleMenu(!navLinks.classList.contains('open')));
  navOverlay.addEventListener('click', () => toggleMenu(false));
  navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => toggleMenu(false)));
}

/* ============================================
   FAQ ACCORDION (statis di HTML)
   ============================================ */
document.querySelectorAll('.fq').forEach(q => {
  q.addEventListener('click', () => {
    const item = q.parentElement;
    const wasOpen = item.classList.contains('open');
    document.querySelectorAll('.fi').forEach(i => i.classList.remove('open'));
    if (!wasOpen) item.classList.add('open');
  });
});

/* ============================================
   SCROLL REVEAL
   ============================================ */
const io = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));

/* ============================================
   ORDER VIA WHATSAPP — delegasi (tombol dibuat dinamis)
   ============================================ */
document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-class]');
  if (!btn || btn.disabled) return;
  openWA(`Halo CCA! Saya tertarik mendaftar *${btn.dataset.class}*. Boleh minta info lebih lanjut?`);
});

/* ============================================
   STAR RATING PICKER (form ulasan)
   ============================================ */
let rating = 0;
const labels = ['', 'Sangat Buruk', 'Kurang Baik', 'Cukup', 'Bagus', 'Luar Biasa! 🔥'];
const sbs = document.querySelectorAll('.sb');
const plabel = $('plabel');
sbs.forEach(b => {
  b.addEventListener('mouseover', () => {
    const v = +b.dataset.v;
    sbs.forEach(s => s.classList.toggle('on', +s.dataset.v <= v));
    plabel.textContent = labels[v];
  });
  b.addEventListener('mouseleave', () => {
    sbs.forEach(s => s.classList.toggle('on', +s.dataset.v <= rating));
    plabel.textContent = rating ? labels[rating] : 'Tap bintang untuk memberi rating';
  });
  b.addEventListener('click', () => {
    rating = +b.dataset.v;
    sbs.forEach(s => s.classList.toggle('on', +s.dataset.v <= rating));
    plabel.textContent = labels[rating];
  });
});

/* CHARACTER COUNTER */
const rt = $('rt');
if (rt) rt.addEventListener('input', function () {
  $('cc').textContent = this.value.length + ' / 300 karakter';
});

/* ============================================
   GOOGLE AUTH
   ============================================ */
let currentUser = null;

async function refreshAuthUI() {
  const { data } = await supabaseClient.auth.getSession();
  currentUser = data.session?.user || null;
  const loginBtn = $('googleLogin');
  const userBox = $('authUser');
  const fields = $('reviewFields');
  if (currentUser) {
    const meta = currentUser.user_metadata || {};
    loginBtn.style.display = 'none';
    userBox.style.display = 'flex';
    $('authName').textContent = meta.full_name || meta.name || currentUser.email;
    $('authAvatar').src = meta.avatar_url || meta.picture || '';
    fields.disabled = false;
    if (!$('rn').value) $('rn').value = meta.full_name || meta.name || '';
  } else {
    loginBtn.style.display = 'inline-flex';
    userBox.style.display = 'none';
    fields.disabled = true;
  }
}

$('googleLogin')?.addEventListener('click', async () => {
  await supabaseClient.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.href.split('#')[0] }
  });
});
$('googleLogout')?.addEventListener('click', async () => {
  await supabaseClient.auth.signOut();
  refreshAuthUI();
});
supabaseClient.auth.onAuthStateChange(() => refreshAuthUI());

/* SUBMIT REVIEW -> Supabase (pending verifikasi admin) */
$('sendReview')?.addEventListener('click', async () => {
  if (!currentUser) { toast('Silakan login dengan Google dulu untuk menulis ulasan', 'info'); return; }
  const n = $('rn').value.trim();
  const k = $('rk').value;
  const t = $('rt').value.trim();
  if (!n || !k || !t || !rating) {
    toast('Mohon lengkapi semua kolom dan beri rating bintang', 'info');
    return;
  }
  const meta = currentUser.user_metadata || {};
  const btn = $('sendReview');
  btn.disabled = true; btn.textContent = 'Mengirim…';
  const { error } = await supabaseClient.from('reviews').insert({
    user_id: currentUser.id,
    name: n, kelas: k, rating, body: t,
    avatar_url: meta.avatar_url || meta.picture || null,
    verified: false
  });
  btn.disabled = false; btn.textContent = 'Kirim Ulasan';
  if (error) { toast('Gagal mengirim ulasan: ' + error.message, 'error'); return; }
  toast('Terima kasih! Ulasanmu terkirim dan akan tampil setelah diverifikasi admin.', 'success');
  $('rt').value = ''; $('cc').textContent = '0 / 300 karakter';
  rating = 0; sbs.forEach(s => s.classList.remove('on'));
  plabel.textContent = 'Tap bintang untuk memberi rating';
});

/* ============================================
   RENDER: SETTINGS (stats & hero)
   ============================================ */
async function loadSettings() {
  const { data } = await supabaseClient.from('settings').select('*');
  if (!data) return;
  const s = Object.fromEntries(data.map(r => [r.key, r.value]));
  if (s.stat_peserta) $('statPeserta').textContent = s.stat_peserta;
  if (s.stat_partner) $('statPartner').textContent = s.stat_partner;
  if (s.stat_tahun) $('statTahun').textContent = s.stat_tahun;
  if (s.hero_alumni) $('fcAlumni').textContent = s.hero_alumni + '+';
}

/* ============================================
   RENDER: REVIEWS (summary + grid + hero rating)
   ============================================ */
let allReviews = [];
async function loadReviews() {
  const { data: reviews } = await supabaseClient
    .from('reviews').select('*').eq('verified', true)
    .order('created_at', { ascending: false });
  const list = reviews || [];
  allReviews = list;
  const total = list.length;
  const avg = total ? (list.reduce((a, r) => a + r.rating, 0) / total) : 0;
  const avgTxt = total ? avg.toFixed(1) : '—';

  // hero + float + stats + summary
  $('heroRating').textContent = total ? avgTxt + '/5' : '—';
  $('heroReviewCount').textContent = total;
  $('fcRating').textContent = avgTxt;
  $('fcReviewCount').textContent = total + ' ulasan';
  $('statRating').textContent = avgTxt;
  $('revBig').textContent = avgTxt;
  $('revStars').innerHTML = total ? starString(avg) : '★★★★★';
  $('revCnt').textContent = total ? `dari ${total} ulasan terverifikasi` : 'Belum ada ulasan';

  // distribution bars 5..1
  const bars = $('revBars');
  bars.innerHTML = '';
  for (let r = 5; r >= 1; r--) {
    const c = list.filter(x => x.rating === r).length;
    const pct = total ? Math.round(c / total * 100) : 0;
    bars.insertAdjacentHTML('beforeend',
      `<div class="bar"><span class="lb">${r} ★</span><div class="tr"><div class="fl" data-w="${pct}"></div></div><span class="pc">${pct}%</span></div>`);
  }
  // animasikan lebar bar
  setTimeout(() => bars.querySelectorAll('.fl').forEach(f => f.style.width = f.dataset.w + '%'), 120);

  // grid dengan urutan & filter (lihat renderReviewGrid)
  renderReviewGrid();
}

/* Render daftar ulasan sesuai pilihan Urutkan & Filter rating.
   Ringkasan (rata-rata & grafik) tetap dari SEMUA ulasan, tidak terpengaruh filter. */
function renderReviewGrid() {
  const grid = $('reviewGrid');
  if (!grid) return;
  const shown = $('revShown');
  const sort = $('revSort')?.value || 'newest';
  const filter = +($('revFilter')?.value || 0);

  if (!allReviews.length) {
    grid.innerHTML = '<p class="empty-note">Jadilah yang pertama memberi ulasan!</p>';
    if (shown) shown.textContent = '';
    return;
  }

  let list = allReviews.slice();
  if (filter) list = list.filter(r => r.rating === filter);
  list.sort((a, b) => {
    const da = new Date(a.created_at), db = new Date(b.created_at);
    if (sort === 'newest') return db - da;
    if (sort === 'oldest') return da - db;
    if (sort === 'highest') return b.rating - a.rating || (db - da);
    if (sort === 'lowest') return a.rating - b.rating || (db - da);
    return 0;
  });

  if (shown) shown.textContent = `Menampilkan ${list.length} dari ${allReviews.length} ulasan`;
  if (!list.length) {
    grid.innerHTML = '<p class="empty-note">Belum ada ulasan dengan rating tersebut.</p>';
    return;
  }
  grid.innerHTML = list.map(r => `
    <div class="rc">
      <div class="rc-h"><div class="av">${initials(r.name)}</div><div><h5>${esc(r.name)}</h5><small>${esc(r.kelas || '')}</small></div></div>
      <div class="rc-stars">${starString(r.rating)}</div>
      <p>${esc(r.body)}</p>
      <div class="vbadge">Peserta Terverifikasi</div>
    </div>`).join('');
}
$('revSort')?.addEventListener('change', renderReviewGrid);
$('revFilter')?.addEventListener('change', renderReviewGrid);

/* ============================================
   RENDER: PARTNERS (logo)
   ============================================ */
async function loadPartners() {
  const { data } = await supabaseClient.from('partners').select('*').order('sort_order');
  const row = $('partnersRow');
  if (!data || !data.length) { row.innerHTML = ''; return; }
  row.innerHTML = data.map(p =>
    `<img src="${esc(p.logo_url)}" alt="${esc(p.name)}" title="${esc(p.name)}" class="p-logo" loading="lazy" decoding="async"/>`).join('');
}

/* ============================================
   RENDER: CLASSES (cards bulan ini) + SCHEDULE (bulan depan, maks 3)
   ============================================ */
function isCurrentMonth(d, now) {
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}
async function loadClasses() {
  const { data } = await supabaseClient.from('classes').select('*').order('class_date');
  const list = data || [];
  const now = new Date();
  const startNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  // --- CARDS: kelas bulan ini ("Pilih Kelasmu") ---
  const cur = list.filter(c => isCurrentMonth(new Date(c.class_date + 'T00:00:00'), now))
                  .sort((a, b) => (a.sort_order - b.sort_order));
  const cards = $('classCards');
  cards.innerHTML = cur.length ? cur.map(c => `
    <div class="card${c.is_hot ? ' hot' : ''}">
      ${c.is_hot ? '<div class="ribbon">POPULER</div>' : ''}
      <div class="c-num">${esc(c.num_label || '')}</div>
      <div class="c-name">${esc(c.name)}</div>
      <div class="c-desc">${esc(c.description || '')}</div>
      <div class="c-meta">${(c.meta || []).map(m => `<span>${esc(m)}</span>`).join('')}</div>
      <div class="c-price">${esc(c.price || '')} <small>${esc(c.price_note || '')}</small></div>
      <button class="c-btn" data-class="${esc(c.name)}">${esc(c.cta_label || 'Pesan via WhatsApp')}</button>
    </div>`).join('')
    : '<p class="empty-note">Belum ada kelas yang dibuka bulan ini. Cek jadwal mendatang di bawah 👇</p>';

  // --- SCHEDULE: kelas bulan depan dan setelahnya, maks 3 ("Jadwal Mendatang") ---
  const upcoming = list
    .filter(c => new Date(c.class_date + 'T00:00:00') >= startNextMonth)
    .sort((a, b) => new Date(a.class_date) - new Date(b.class_date))
    .slice(0, 3);
  const sched = $('scheduleRows');
  sched.innerHTML = upcoming.length ? upcoming.map(c => {
    const d = new Date(c.class_date + 'T00:00:00');
    const slot = c.is_full ? '<div class="r-slot full">Penuh</div>'
      : c.seats_left > 0 ? `<div class="r-slot">Sisa ${c.seats_left} Kursi</div>`
      : '<div class="r-slot">Buka Pendaftaran</div>';
    const go = c.is_full
      ? '<button class="r-go dis" disabled>Penuh</button>'
      : `<button class="r-go" data-class="${esc(c.name)} ${d.getDate()} ${MONTHS_ID[d.getMonth()]}">Daftar</button>`;
    return `<div class="row">
      <div class="r-date"><span class="d">${String(d.getDate()).padStart(2, '0')}</span><span class="m">${MONTHS_ID[d.getMonth()]}</span></div>
      <div class="r-info"><h4>${esc(c.name)}${c.location ? ' — ' + esc(c.location) : ''}</h4><p>${esc(c.time_info || '')}</p></div>
      ${slot}${go}
    </div>`;
  }).join('') : '<p class="empty-note">Belum ada jadwal mendatang.</p>';

  // isi dropdown kelas di form ulasan
  const sel = $('rk');
  const names = [...new Set(list.map(c => c.name))];
  sel.innerHTML = '<option value="">Pilih kelas...</option>' +
    names.map(n => `<option>${esc(n)}</option>`).join('');
}

/* ============================================
   RENDER: SHOWREEL
   ============================================ */
async function loadShowreel() {
  const { data } = await supabaseClient.from('showreel').select('*').order('sort_order').limit(1);
  const wrap = $('showreelWrap');
  const item = data && data[0];
  const bg = item?.thumbnail_url ? `style="background-image:url('${esc(item.thumbnail_url)}');background-size:cover;background-position:center"` : '';
  wrap.innerHTML = `<div class="player" ${bg} ${item ? 'role="button" tabindex="0"' : ''}>
      <div class="play"><svg width="26" height="26" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></div>
    </div>`;
  if (item) wrap.querySelector('.player').addEventListener('click', () => window.open(item.video_url, '_blank'));
}

/* ============================================
   RENDER: ALUMNI (testimoni video)
   ============================================ */
async function loadAlumni() {
  const { data } = await supabaseClient.from('alumni').select('*').order('sort_order');
  const wrap = $('alumniVids');
  if (!data || !data.length) { wrap.innerHTML = ''; return; }
  wrap.innerHTML = data.map(a => {
    const bg = a.thumbnail_url ? `style="background-image:url('${esc(a.thumbnail_url)}');background-size:cover;background-position:center"` : '';
    return `<div class="vid" ${bg} data-video="${esc(a.video_url || '')}">
      ${a.duration ? `<span class="dur">${esc(a.duration)}</span>` : ''}
      <span class="glyph">🎬</span>
      <span class="pp"><svg width="16" height="16" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></span>
      <div class="meta"><div class="nm">${esc(a.name)}</div><div class="rl">${esc(a.role || '')}</div></div>
    </div>`;
  }).join('');
  wrap.querySelectorAll('.vid').forEach(v => v.addEventListener('click', () => {
    if (v.dataset.video) window.open(v.dataset.video, '_blank');
  }));
}

/* ============================================
   RENDER: GALLERY (Momen After Class)
   ============================================ */
async function loadGallery() {
  const { data } = await supabaseClient.from('gallery').select('*').order('sort_order');
  const grid = $('galleryGrid');
  if (!data || !data.length) { grid.innerHTML = ''; return; }
  grid.innerHTML = data.map(g => `
    <div class="gal-item">
      <div class="gal-ph" style="height:${g.height || 190}px"><img src="${esc(g.image_url)}" alt="${esc(g.title)}" loading="lazy" decoding="async"></div>
      <div class="gal-cap"><b>${esc(g.title)}</b><span>${esc(g.caption || '')}</span></div>
    </div>`).join('');
}

/* ============================================
   INIT
   ============================================ */
(async function init() {
  await refreshAuthUI();
  // muat semua data paralel
  loadSettings();
  loadReviews();
  loadPartners();
  loadClasses();
  loadShowreel();
  loadAlumni();
  loadGallery();
})();