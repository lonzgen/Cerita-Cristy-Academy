
(function () {
  function injectStyle() {
    if (document.getElementById('cca-notify-style')) return;
    const st = document.createElement('style');
    st.id = 'cca-notify-style';
    st.textContent = `
      #cca-toast-wrap{position:fixed;top:22px;right:22px;z-index:99999;display:flex;flex-direction:column;gap:12px;max-width:360px;pointer-events:none}
      .cca-toast{pointer-events:auto;display:flex;align-items:flex-start;gap:12px;background:#fff;color:#16263A;border-radius:14px;padding:14px 16px 14px 14px;
        box-shadow:0 20px 45px -18px rgba(20,71,122,.5);border:1px solid rgba(28,92,154,.10);border-left:4px solid #1C5C9A;
        font-family:'Plus Jakarta Sans','Poppins',system-ui,sans-serif;font-size:14px;line-height:1.45;
        transform:translateX(130%);opacity:0;transition:transform .4s cubic-bezier(.22,1,.36,1),opacity .4s}
      .cca-toast.show{transform:translateX(0);opacity:1}
      .cca-toast.hide{transform:translateX(130%);opacity:0}
      .cca-toast.success{border-left-color:#1e8e4e}
      .cca-toast.error{border-left-color:#c0392b}
      .cca-toast .ic{flex-shrink:0;width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;background:#1C5C9A}
      .cca-toast.success .ic{background:#1e8e4e}
      .cca-toast.error .ic{background:#c0392b}
      .cca-toast .ic svg{width:14px;height:14px}
      .cca-toast .msg{flex:1;padding-top:2px;font-weight:500}
      .cca-toast .cls{flex-shrink:0;border:none;background:transparent;color:#9aa7b4;font-size:18px;line-height:1;cursor:pointer;padding:0 2px}
      .cca-toast .cls:hover{color:#16263A}

      .cca-confirm-bg{position:fixed;inset:0;z-index:100000;display:flex;align-items:center;justify-content:center;padding:24px;
        background:rgba(14,51,88,.45);backdrop-filter:blur(4px);opacity:0;transition:opacity .25s}
      .cca-confirm-bg.show{opacity:1}
      .cca-confirm{background:#fff;border-radius:20px;padding:26px 26px 22px;max-width:400px;width:100%;text-align:center;
        box-shadow:0 30px 60px -24px rgba(14,51,88,.6);font-family:'Plus Jakarta Sans','Poppins',system-ui,sans-serif;
        transform:scale(.92);transition:transform .25s cubic-bezier(.22,1,.36,1)}
      .cca-confirm-bg.show .cca-confirm{transform:scale(1)}
      .cca-confirm .cc-ic{width:52px;height:52px;border-radius:50%;background:#fff3d6;color:#b8860b;display:flex;align-items:center;justify-content:center;margin:0 auto 14px;font-size:24px}
      .cca-confirm h4{font-family:'Poppins',sans-serif;font-size:18px;color:#16263A;margin:0 0 6px}
      .cca-confirm p{font-size:14px;color:#5A6B7D;line-height:1.5;margin:0 0 22px}
      .cca-confirm-acts{display:flex;gap:10px;justify-content:center}
      .cca-confirm-acts button{font-family:inherit;font-weight:600;font-size:14px;padding:11px 22px;border-radius:100px;cursor:pointer;border:none}
      .cca-confirm .cc-cancel{background:#fff;border:1px solid rgba(28,92,154,.18);color:#5A6B7D}
      .cca-confirm .cc-cancel:hover{border-color:#1C5C9A;color:#1C5C9A}
      .cca-confirm .cc-ok{background:#c0392b;color:#fff}
      .cca-confirm .cc-ok:hover{background:#a83224}
      .cca-confirm .cc-ok.primary{background:#1C5C9A}
      .cca-confirm .cc-ok.primary:hover{background:#14477A}
      @media(max-width:600px){#cca-toast-wrap{top:auto;bottom:16px;left:16px;right:16px;max-width:none}
        .cca-toast{transform:translateY(140%)}.cca-toast.show{transform:translateY(0)}.cca-toast.hide{transform:translateY(140%)}}
    `;
    document.head.appendChild(st);
  }

  const ICONS = {
    success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>',
    error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M12 8v5M12 16.5v.5"/></svg>',
  };

  window.toast = function (message, type = 'info', duration) {
    injectStyle();
    let wrap = document.getElementById('cca-toast-wrap');
    if (!wrap) { wrap = document.createElement('div'); wrap.id = 'cca-toast-wrap'; document.body.appendChild(wrap); }
    const el = document.createElement('div');
    el.className = 'cca-toast ' + type;
    el.innerHTML = `<span class="ic">${ICONS[type] || ICONS.info}</span><span class="msg"></span><button class="cls" aria-label="Tutup">&times;</button>`;
    el.querySelector('.msg').textContent = message;
    wrap.appendChild(el);
    requestAnimationFrame(() => el.classList.add('show'));
    const remove = () => { el.classList.add('hide'); setTimeout(() => el.remove(), 450); };
    el.querySelector('.cls').addEventListener('click', remove);
    setTimeout(remove, duration || (type === 'error' ? 5500 : 3800));
  };

  window.confirmDialog = function (message, opts = {}) {
    injectStyle();
    const title = opts.title || 'Konfirmasi';
    const okLabel = opts.okLabel || 'Hapus';
    const cancelLabel = opts.cancelLabel || 'Batal';
    const danger = opts.danger !== false; // default merah (hapus)
    return new Promise(resolve => {
      const bg = document.createElement('div');
      bg.className = 'cca-confirm-bg';
      bg.innerHTML = `<div class="cca-confirm" role="dialog">
        <div class="cc-ic">?</div>
        <h4></h4><p></p>
        <div class="cca-confirm-acts">
          <button class="cc-cancel"></button>
          <button class="cc-ok${danger ? '' : ' primary'}"></button>
        </div></div>`;
      bg.querySelector('h4').textContent = title;
      bg.querySelector('p').textContent = message;
      bg.querySelector('.cc-cancel').textContent = cancelLabel;
      bg.querySelector('.cc-ok').textContent = okLabel;
      document.body.appendChild(bg);
      requestAnimationFrame(() => bg.classList.add('show'));
      const close = (val) => { bg.classList.remove('show'); setTimeout(() => bg.remove(), 260); resolve(val); };
      bg.querySelector('.cc-ok').addEventListener('click', () => close(true));
      bg.querySelector('.cc-cancel').addEventListener('click', () => close(false));
      bg.addEventListener('click', e => { if (e.target === bg) close(false); });
    });
  };
})();
