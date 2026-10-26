/* =========================================================
   core.js – תשתית: מצב, משחוק (גרעינים, רמות, תגים), ניתוב, רכיבי ממשק
   ========================================================= */
window.KZ = window.KZ || {};
(function (KZ) {
  'use strict';

  const STORE_KEY = 'kz-mitzvah-v1';

  /* ---------- כלים ---------- */
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const pad = (n) => String(n).padStart(2, '0');
  const isoOf = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const todayISO = () => isoOf(new Date());
  const parseISO = (s) => { if (!s) return null; const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d, 12); };
  const daysBetween = (a, b) => Math.round((parseISO(isoOf(b)) - parseISO(isoOf(a))) / 86400000);
  const shuffle = (arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const sample = (arr, n) => shuffle(arr).slice(0, n);
  const fmtDate = (d, opts = { day: 'numeric', month: 'long', year: 'numeric' }) => (d ? new Intl.DateTimeFormat('he-IL', opts).format(typeof d === 'string' ? parseISO(d) : d) : '');
  const isoWeek = (d = new Date()) => {
    const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const day = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - day);
    const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
    return t.getUTCFullYear() * 100 + Math.ceil(((t - y0) / 86400000 + 1) / 7);
  };

  /* ---------- אייקונים ---------- */
  const ICONS = {
    home: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
    map: '<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2z"/><path d="M9 4v14M15 6v14"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2"/>',
    game: '<rect x="2.5" y="7" width="19" height="11" rx="5.5"/><path d="M7.5 10.5v4M5.5 12.5h4"/><circle cx="15.5" cy="11.3" r=".9"/><circle cx="17.8" cy="13.6" r=".9"/>',
    book: '<path d="M2.5 5h6.5a3 3 0 0 1 3 3v12a2.5 2.5 0 0 0-2.5-2.5H2.5z"/><path d="M21.5 5H15a3 3 0 0 0-3 3v12a2.5 2.5 0 0 1 2.5-2.5h7z"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.6a6.5 6.5 0 0 1 3.5 5.4"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
    heart: '<path d="M12 20s-7-4.4-9-9a4.8 4.8 0 0 1 9-3 4.8 4.8 0 0 1 9 3c-2 4.6-9 9-9 9z"/>',
    scroll: '<path d="M8 4h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H8"/><path d="M6 4a2 2 0 0 0-2 2v12a2 2 0 0 0 4 0V6a2 2 0 0 0-2-2z"/><path d="M12 9h5M12 13h5"/>',
    music: '<path d="M9 18V5l11-2v13"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="16" r="2.5"/>',
    mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
    play: '<path d="M7 5v14l12-7z" fill="currentColor"/>',
    stop: '<rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor"/>',
    download: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
    upload: '<path d="M12 16V5M7 10l5-5 5 5M5 20h14"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    chevL: '<path d="m15 6-6 6 6 6"/>',
    chevR: '<path d="m9 6 6 6-6 6"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.6v.4"/>',
    gift: '<rect x="3" y="9" width="18" height="12" rx="1.5"/><path d="M3 13h18M12 9v12"/><path d="M12 9S10.5 4 8 4.5 7.5 9 12 9zM12 9s1.5-5 4-4.5S16.5 9 12 9z"/>',
    trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8 20h8M10 17h4"/>',
    sparkle: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>',
    pen: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m14 6 4 4"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
    stairs: '<path d="M3 20h5v-5h5v-5h5V5h3"/>',
    clipboard: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 3h6v3H9zM9 11h6M9 15h4"/>',
    chat: '<path d="M4 5h16v11H9l-5 4z"/><path d="M8 9h8M8 12h5"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    refresh: '<path d="M20 11a8 8 0 1 0-2.3 5.7M20 5v6h-6"/>',
    hands: '<path d="M7 11V6.5a1.5 1.5 0 0 1 3 0V11"/><path d="M10 10V5a1.5 1.5 0 0 1 3 0v5"/><path d="M13 10V6a1.5 1.5 0 0 1 3 0v6"/><path d="M16 11.5a1.5 1.5 0 0 1 3 0V14a7 7 0 0 1-7 7h-1a6 6 0 0 1-5.2-3L3.6 14a1.5 1.5 0 0 1 2.6-1.5L7 14"/>',
    seedling: '<path d="M12 21v-9"/><path d="M12 12c0-4 3-7 8-7 0 4-3 7-8 7z"/><path d="M12 14c0-3-2.5-5.5-7-5.5 0 3 2.5 5.5 7 5.5z"/>',
    letter: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.5 6.5 8.5 6.5 8.5-6.5"/>',
    alef: '<text x="12" y="17.5" text-anchor="middle" font-size="15" font-weight="700" fill="currentColor" stroke="none" font-family="Rubik, sans-serif">א</text><rect x="3" y="3" width="18" height="18" rx="5"/>',
    seed: '<path d="M12 3c3.5 3.5 6 7 6 10.5a6 6 0 0 1-12 0C6 10 8.5 6.5 12 3z" fill="currentColor" stroke="none"/><path d="M10 10.5c-.6 1-.9 2-.9 3" stroke="#fff" stroke-opacity=".6"/>',
  };
  const icon = (name, cls = '') => `<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] || ''}</svg>`;

  /* ---------- מצב ושמירה ---------- */
  const DEFAULT = () => ({
    v: 1,
    onboarded: false,
    profile: { name: '', gender: '', birth: '', afterSunset: false, avatar: '🦉' },
    awards: {},       // key -> {pts,label,at}
    quests: {},       // id -> {at,note,count}
    checkins: {},     // activityId -> [{at,note}]
    badges: {},       // id -> at
    games: {},        // id -> {best, plays, perfect}
    journal: [],      // {id,at,title,text,src}
    album: [],        // {id,at,name,role,learned,activity}
    capsule: { text: '', sealedAt: null, openOn: '' },
    dvar: {},
    visited: {},
    bm: null,         // תוצאת חישוב הבר/בת מצווה
    settings: { fs: 1 },
  });

  function deepMerge(base, extra) {
    if (!extra || typeof extra !== 'object') return base;
    for (const k of Object.keys(extra)) {
      if (base[k] && typeof base[k] === 'object' && !Array.isArray(base[k]) && extra[k] && typeof extra[k] === 'object' && !Array.isArray(extra[k])) deepMerge(base[k], extra[k]);
      else base[k] = extra[k];
    }
    return base;
  }
  function load() {
    try { const raw = localStorage.getItem(STORE_KEY); if (raw) return deepMerge(DEFAULT(), JSON.parse(raw)); } catch (e) { /* פרטי/חסום */ }
    return DEFAULT();
  }
  const S = load();
  function save() { try { localStorage.setItem(STORE_KEY, JSON.stringify(S)); } catch (e) { /* ignore */ } }
  function resetAll() { Object.keys(S).forEach((k) => delete S[k]); Object.assign(S, DEFAULT()); save(); }
  function importState(obj) { if (!obj || typeof obj !== 'object' || !obj.awards) throw new Error('bad'); Object.keys(S).forEach((k) => delete S[k]); Object.assign(S, deepMerge(DEFAULT(), obj)); save(); }

  /* ---------- פנייה מגדרית ---------- */
  // g('זכר','נקבה','ניטרלי') – אם לא נבחר, מחזיר את הניטרלי (או זכר/נקבה)
  const g = (m, f, n) => (S.profile.gender === 'm' ? m : S.profile.gender === 'f' ? f : (n ?? `${m}/${f}`));
  const firstName = () => (S.profile.name || '').trim().split(/\s+/)[0] || '';

  /* ---------- משחוק ---------- */
  const seeds = () => Object.values(S.awards).reduce((s, a) => s + (a.pts || 0), 0);
  function levelFor(n) {
    const L = KZ.levels || [{ min: 0, name: '', icon: '' }];
    let idx = 0; L.forEach((l, i) => { if (n >= l.min) idx = i; });
    const cur = L[idx], next = L[idx + 1];
    return { ...cur, idx, next, pct: next ? Math.min(1, (n - cur.min) / (next.min - cur.min)) : 1 };
  }
  const celebrations = [];
  let celebrating = false;

  function award(key, pts, label, opts = {}) {
    if (S.awards[key]) return false;
    const before = levelFor(seeds()).idx;
    S.awards[key] = { pts, label, at: Date.now() };
    save();
    if (!opts.silent) toast(`${icon('seed')} ‎+${pts} גרעינים · ${esc(label)}`, 'seed');
    afterGain(before);
    return true;
  }
  function afterGain(beforeIdx) {
    checkBadges();
    const lv = levelFor(seeds());
    if (lv.idx > beforeIdx) queueCelebration({ icon: lv.icon, title: `עלית לשלב "${lv.name}"!`, text: lv.desc, big: true });
    updateChrome(true);
  }
  function checkBadges() {
    if (!KZ.badges) return;
    let changed = true, guard = 0;
    while (changed && guard++ < 6) {
      changed = false;
      for (const b of KZ.badges) {
        if (S.badges[b.id]) continue;
        let ok = false; try { ok = !!b.test(S, KZ); } catch (e) { ok = false; }
        if (ok) {
          S.badges[b.id] = Date.now();
          S.awards['badge:' + b.id] = { pts: b.bonus ?? 10, label: 'תג: ' + b.name, at: Date.now() };
          save(); changed = true;
          queueCelebration({ icon: b.icon, title: `תג חדש: ${b.name}`, text: `${b.desc} · ‎+${b.bonus ?? 10} גרעינים` });
        }
      }
    }
  }
  function queueCelebration(c) { celebrations.push(c); if (!celebrating) nextCelebration(); }
  function nextCelebration() {
    const c = celebrations.shift();
    if (!c) { celebrating = false; return; }
    celebrating = true;
    // c.html = הודעה מיוחדת (בלי קונפטי), שנכנסת לאותו תור כדי לא להתנגש בחגיגות
    if (!c.html) confetti(c.big ? 160 : 90);
    modal(c.html || `<div class="celebrate"><div class="celebrate__icon">${c.icon}</div><h2>${esc(c.title)}</h2><p class="muted">${esc(c.text || '')}</p><button class="btn" data-act="close-modal">יש!</button></div>`,
      { sticky: true, onMount: c.onMount, onClose: () => setTimeout(nextCelebration, 250), onDrop: () => { celebrating = false; } });
  }

  /* ---------- יומן ---------- */
  function addJournal(title, text, src) {
    if (!text || !text.trim()) return;
    S.journal.unshift({ id: uid(), at: Date.now(), title, text: text.trim(), src });
    save();
  }
  function markVisited(key, label) {
    if (!S.visited[key]) { S.visited[key] = Date.now(); save(); award('visit:' + key, 5, `ביקור ראשון: ${label}`); }
  }

  /* ---------- רכיבי ממשק ---------- */
  // חלון קופץ. sticky = לא נסגר במעבר עמוד (לחגיגות)
  let modalState = null;
  function teardownModal() {
    if (!modalState) return null;
    const st = modalState; modalState = null;
    document.removeEventListener('keydown', st.onKey);
    $('#modal-root').innerHTML = ''; document.body.style.overflow = '';
    return st;
  }
  function modal(html, opts = {}) {
    const prev = teardownModal(); if (prev && prev.onDrop) prev.onDrop();
    const root = $('#modal-root');
    const prevFocus = document.activeElement;
    root.innerHTML = `<div class="modal-backdrop" data-backdrop><div class="modal ${opts.wide ? 'modal--wide' : ''}" role="dialog" aria-modal="true">
      <button class="icon-btn modal__close" data-act="close-modal" aria-label="סגירה">${icon('x')}</button>${html}</div></div>`;
    document.body.style.overflow = 'hidden';
    const bd = $('[data-backdrop]', root);
    bd.addEventListener('mousedown', (e) => { if (e.target === bd) closeModal(); });
    const onKey = (e) => { if (e.key === 'Escape') closeModal(); };
    document.addEventListener('keydown', onKey);
    modalState = { sticky: !!opts.sticky, onKey, onClose: opts.onClose, onDrop: opts.onDrop, prevFocus };
    const m = $('.modal', root);
    if (opts.onMount) opts.onMount(m);
    const f = $('input, textarea, select', m) || $('h2', m);
    if (f) { if (f.tagName === 'H2') f.setAttribute('tabindex', '-1'); setTimeout(() => f.focus({ preventScroll: true }), 30); }
    return m;
  }
  function closeModal(silent) {
    if (!modalState) return;
    if (silent === true && modalState.sticky) return;
    const st = teardownModal();
    if (silent === true) { st.onDrop && st.onDrop(); return; }
    if (st.prevFocus && st.prevFocus.isConnected && st.prevFocus.focus) try { st.prevFocus.focus({ preventScroll: true }); } catch (e) { /* */ }
    st.onClose && st.onClose();
  }

  function toast(html, kind = '') {
    const root = $('#toast-root');
    const el = document.createElement('div');
    el.className = `toast ${kind ? 'toast--' + kind : ''}`;
    el.innerHTML = html;
    root.appendChild(el);
    setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 320); }, 2600);
  }

  // קונפטי של גרעיני רימון
  function confetti(n = 100) {
    if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const c = $('#confetti'); const ctx = c.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    c.width = innerWidth * dpr; c.height = innerHeight * dpr; ctx.scale(dpr, dpr);
    const colors = ['#C42F45', '#E0566A', '#8E1F2C', '#E39B2D', '#2E56A6', '#1C8576'];
    const parts = Array.from({ length: n }, () => ({
      x: innerWidth / 2 + (Math.random() - .5) * 160, y: innerHeight * .35,
      vx: (Math.random() - .5) * 11, vy: -Math.random() * 11 - 4,
      r: 3 + Math.random() * 4, rot: Math.random() * 6, vr: (Math.random() - .5) * .3,
      col: colors[Math.floor(Math.random() * colors.length)], life: 0,
    }));
    let frame = 0;
    (function tick() {
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      parts.forEach((p) => {
        p.vy += .32; p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.vx *= .99;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = p.col;
        ctx.beginPath(); ctx.ellipse(0, 0, p.r * .75, p.r * 1.15, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,.45)'; ctx.beginPath(); ctx.ellipse(-p.r * .25, -p.r * .35, p.r * .2, p.r * .35, 0, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      });
      if (frame++ < 150) requestAnimationFrame(tick); else ctx.clearRect(0, 0, innerWidth, innerHeight);
    })();
  }

  /* ---------- רימון (תצוגת ההתקדמות) ---------- */
  // 613 גרעינים בסידור פילוטקסיס (זווית הזהב), מתמלאים מהמרכז החוצה
  function rimonSVG(n, opts = {}) {
    const total = 613, R = 108, cx = 150, cy = 190;
    const filled = Math.min(total, n);
    const golden = Math.PI * (3 - Math.sqrt(5));
    const c = R / Math.sqrt(total);
    let seedsSvg = '';
    for (let i = 0; i < total; i++) {
      const r = c * Math.sqrt(i + .5), th = i * golden;
      const x = cx + r * Math.cos(th), y = cy + r * Math.sin(th);
      const on = i < filled;
      const deg = (th * 180 / Math.PI) % 360;
      const delay = opts.animate && on ? `style="animation-delay:${Math.min(1.2, i * 0.004).toFixed(3)}s"` : '';
      // הסיבוב על ה-g, והאנימציה (scale) על האליפסה – כדי שלא יתנגשו
      seedsSvg += `<g transform="rotate(${deg.toFixed(0)} ${x.toFixed(1)} ${y.toFixed(1)})"><ellipse class="seed ${on ? 'on' : ''}" ${delay} cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="2.7" ry="3.7"/></g>`;
    }
    return `<svg class="rimon" viewBox="0 0 300 330" role="img" aria-label="רימון עם ${filled} מתוך 613 גרעינים">
      <defs>
        <radialGradient id="seedG" cx="35%" cy="30%" r="70%"><stop offset="0" stop-color="#FF8A9A"/><stop offset=".55" stop-color="#D2334B"/><stop offset="1" stop-color="#8E1F2C"/></radialGradient>
        <radialGradient id="rindG" cx="35%" cy="30%" r="80%"><stop offset="0" stop-color="#E25469"/><stop offset=".7" stop-color="#B92A40"/><stop offset="1" stop-color="#7D1A2B"/></radialGradient>
      </defs>
      <path d="M118 62 108 22l26 22 16-30 16 30 26-22-10 40z" fill="#8E1F2C"/>
      <path d="M124 60 118 36l18 16 14-22 14 22 18-16-6 24z" fill="#B92A40"/>
      <circle cx="${cx}" cy="${cy}" r="${R + 22}" fill="url(#rindG)"/>
      <circle cx="${cx}" cy="${cy}" r="${R + 9}" fill="var(--pith)"/>
      <ellipse cx="${cx - 48}" cy="${cy - 92}" rx="22" ry="9" fill="#fff" opacity=".22" transform="rotate(-30 ${cx - 48} ${cy - 92})"/>
      ${seedsSvg}
    </svg>`;
  }

  /* ---------- ניתוב ---------- */
  const views = {};
  const actions = {};
  const NAV = [
    { id: 'home', href: '#/', label: 'בית', icon: 'home' },
    { id: 'journey', href: '#/journey', label: 'המסע', icon: 'map' },
    { id: 'quests', href: '#/quests', label: 'אתגרים', icon: 'target' },
    { id: 'games', href: '#/games', label: 'משחקים', icon: 'game' },
    { id: 'library', href: '#/library', label: 'ארון הספרים', icon: 'book' },
  ];
  let current = null;

  function renderNav() {
    const links = (cls) => NAV.map((n) => `<a href="${n.href}" data-nav="${n.id}">${icon(n.icon)}<span>${n.label}</span></a>`).join('');
    $('#topnav').innerHTML = links();
    $('#tabbar').innerHTML = links();
  }
  function updateChrome(bump) {
    const pill = $('#seedPill');
    if (pill) {
      pill.innerHTML = `${icon('seed')}<span>${seeds()}</span>`;
      if (bump) { pill.classList.remove('bump'); void pill.offsetWidth; pill.classList.add('bump'); }
    }
    const av = $('#avatarBtn'); if (av) av.textContent = S.profile.avatar || '🦉';
  }
  function route() {
    const hash = location.hash.replace(/^#\/?/, '');
    const parts = hash.split('/').filter(Boolean).map(decodeURIComponent);
    const name = parts[0] || 'home';
    const view = views[name] || views.home;
    if (current && current.unmount) try { current.unmount(); } catch (e) { /* */ }
    current = view;
    closeModal(true);
    const main = $('#main');
    main.innerHTML = `<div class="page"><div class="wrap">${view.render(parts.slice(1))}</div></div>`;
    if (view.mount) view.mount(main, parts.slice(1));
    const tab = view.tab || name;
    $$('[data-nav]').forEach((a) => a.classList.toggle('active', a.dataset.nav === tab));
    document.title = (view.title ? (typeof view.title === 'function' ? view.title(parts.slice(1)) : view.title) + ' · ' : '') + 'המסע לבר/בת מצווה · קהילת קלוזנר';
    if (!route.keepScroll) window.scrollTo(0, 0);
    route.keepScroll = false;
  }
  const go = (hash) => { if (location.hash === hash) route(); else location.hash = hash; };
  const refresh = () => { route.keepScroll = true; const y = window.scrollY; route(); window.scrollTo(0, y); };

  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-act]');
    if (!el) {
      // קישור בתוך חלון קופץ לעמוד שכבר פתוח: ה-hash לא משתנה ולכן לא קורה כלום –
      // סוגרים את החלון ועולים לראש העמוד
      const a = e.target.closest('#modal-root a[href^="#"]');
      if (a && a.getAttribute('href') === (location.hash || '#/')) {
        e.preventDefault();
        closeModal();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }
    const fn = actions[el.dataset.act];
    if (fn) { e.preventDefault(); fn(el, e); }
  });
  actions['close-modal'] = () => closeModal();

  /* ---------- רכיבים משותפים ---------- */
  const PILLAR_CLASS = { identity: 'identity', social: 'social', community: 'community', knowledge: 'knowledge' };
  function pillarTag(p) { const P = KZ.pillars && KZ.pillars[p]; return P ? `<span class="tag tag--${PILLAR_CLASS[p]}">${P.emoji} ${P.name}</span>` : ''; }
  function trackTag(t) { return t === 'girls' ? '<span class="tag tag--girls">לבנות</span>' : t === 'boys' ? '<span class="tag tag--boys">לבנים</span>' : '<span class="tag tag--joint">משותף</span>'; }

  Object.assign(KZ, {
    esc, $, $$, uid, isoOf, todayISO, parseISO, daysBetween, shuffle, sample, fmtDate, isoWeek, icon,
    S, save, resetAll, importState, g, firstName,
    seeds, levelFor, award, checkBadges, afterGain, queueCelebration, addJournal, markVisited,
    modal, closeModal, toast, confetti, rimonSVG,
    views, actions, renderNav, updateChrome, route, go, refresh, pillarTag, trackTag,
  });
})(window.KZ);
