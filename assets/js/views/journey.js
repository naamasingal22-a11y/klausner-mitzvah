/* =========================================================
   journey.js – מפת המסע: תחנות השנה, צ׳ק־אין ורפלקציה
   ========================================================= */
(function (KZ) {
  'use strict';
  const { esc, icon, S } = KZ;
  let showAll = false;
  let justStamped = null; // לאנימציית החותמת אחרי צ׳ק־אין

  const monthOf = (a) => (a.date ? a.date.slice(0, 7) : a.approx || '2099-12');

  // רשימת התחנות לפי המגדר שנבחר, כולל "היום שלי"
  KZ.journeyList = function (all = showAll) {
    const gen = S.profile.gender;
    const list = KZ.program.activities
      .filter((a) => all || a.track === 'joint' || !gen || (gen === 'f' && a.track === 'girls') || (gen === 'm' && a.track === 'boys'))
      .map((a, i) => ({ ...a, _i: i }));
    if (S.bm && S.bm.date) {
      const d = S.bm.shabbat || S.bm.date;
      list.push({ id: 'me', me: true, emoji: '⭐', title: `${S.bm.kind} שלי!`, when: KZ.fmtDate(d), approx: d.slice(0, 7), _i: 99, track: 'joint', pillars: ['identity'] });
    }
    return list.sort((a, b) => (monthOf(a) < monthOf(b) ? -1 : monthOf(a) > monthOf(b) ? 1 : a._i - b._i));
  };

  const checkins = (id) => S.checkins[id] || [];
  const isDone = (a) => checkins(a.id).length > 0;

  function stationHTML(a, state) {
    const cls = a.me ? 'station--me' : a.future ? 'station--future' : state;
    const count = checkins(a.id).length;
    return `<div class="station ${cls}">
      <button class="station__node" data-act="open-station" data-id="${a.id}" aria-label="${esc(a.title)}">${a.me ? '⭐' : a.emoji}</button>
      <button class="card station__card" data-act="open-station" data-id="${a.id}">
        <div class="station__when">${icon('calendar')} ${esc(a.date ? KZ.fmtDate(a.date) : a.when)}${a.repeat && count ? ` · ${count} ${count === 1 ? 'פעם' : 'פעמים'}` : ''}</div>
        ${checkins(a.id).length ? `<span class="stamp ${a.id === justStamped ? 'fresh' : ''}">✓ הייתי!</span>` : ''}
        <div class="station__title">${esc(a.title)}</div>
        <div class="station__tags">${a.me ? '<span class="tag tag--seed">היום הגדול שלי</span>' : KZ.trackTag(a.track) + (a.pillars || []).map(KZ.pillarTag).join('')}</div>
      </button>
    </div>`;
  }

  function drawPath(root) {
    const wrap = KZ.$('.journey', root); if (!wrap) return;
    const svg = KZ.$('.journey__path', wrap);
    const box = wrap.getBoundingClientRect();
    const nodes = KZ.$$('.station__node', wrap).map((n) => { const r = n.getBoundingClientRect(); return { x: r.left - box.left + r.width / 2, y: r.top - box.top + r.height / 2, done: n.closest('.station').classList.contains('station--done') }; });
    if (nodes.length < 2) { svg.innerHTML = ''; return; }
    const seg = (a, b) => { const my = (a.y + b.y) / 2; return ` C ${a.x} ${my}, ${b.x} ${my}, ${b.x} ${b.y}`; };
    let d = `M ${nodes[0].x} ${nodes[0].y}`;
    for (let i = 1; i < nodes.length; i++) d += seg(nodes[i - 1], nodes[i]);
    let lastDone = -1; nodes.forEach((n, i) => { if (n.done) lastDone = i; });
    let dd = '';
    if (lastDone > 0) { dd = `M ${nodes[0].x} ${nodes[0].y}`; for (let i = 1; i <= lastDone; i++) dd += seg(nodes[i - 1], nodes[i]); }
    svg.setAttribute('viewBox', `0 0 ${box.width} ${box.height}`);
    svg.innerHTML = `<path class="road" d="${d}"/>${dd ? `<path class="done" d="${dd}"/>` : ''}<path class="dash" d="${d}"/>`;
  }

  let onResize = null;
  KZ.views.journey = {
    title: 'המסע',
    render() {
      const list = KZ.journeyList();
      let nextMarked = false;
      const stations = list.map((a) => {
        let st = '';
        if (isDone(a)) st = 'station--done';
        else if (!a.me && !a.future && !nextMarked) { st = 'station--next'; nextMarked = true; }
        return stationHTML(a, st);
      }).join('');
      const done = list.filter(isDone).length;
      const real = list.filter((a) => !a.me && !a.future).length;
      return `
        <header class="page-head">
          <span class="overline">שנת ${KZ.program.year}</span>
          <h1>מפת המסע</h1>
          <p>כל תחנה היא מפגש שההורים בנו בשבילכם. אחרי כל תחנה – ${KZ.g('לחץ', 'לחצי', 'לחצו')} עליה, ${KZ.g('כתוב', 'כתבי', 'כתבו')} משפט אחד ליומן ו${KZ.g('קבל', 'קבלי', 'קבלו')} גרעינים. בכל מפגש פוגשים גם דמות מהקהילה – אפשר להוסיף אותה לאלבום!</p>
        </header>
        <div class="card card--flat" style="margin-bottom:18px">
          <div class="section-head" style="margin:0">
            <div><strong>${done} מתוך ${real} תחנות</strong><div class="bar bar--thin" style="width:200px;margin-top:6px"><span style="width:${real ? (done / real) * 100 : 0}%"></span></div></div>
            <div class="legend"><span><i class="l-done"></i>הייתי</span><span><i class="l-next"></i>הבאה</span><span><i class="l-me"></i>היום שלי</span></div>
          </div>
          ${!S.profile.gender ? '' : `<label class="check small" style="margin-top:10px"><input type="checkbox" id="showAll" ${showAll ? 'checked' : ''}> להציג גם את התחנות ${S.profile.gender === 'f' ? 'של הבנים' : 'של הבנות'}</label>`}
          ${S.bm ? '' : `<p class="small muted" style="margin:10px 0 0">⭐ רוצים לראות על המפה את היום שלכם? <a href="#/library/parasha">חשבו את תאריך ה${KZ.g('בר מצווה', 'בת מצווה', 'בר/בת מצווה')}</a>.</p>`}
        </div>
        <div class="journey"><svg class="journey__path" aria-hidden="true"></svg><div class="stations">${stations}</div></div>
        <p class="note">📅 ${esc(KZ.program.schedulingNote)}</p>`;
    },
    mount(root) {
      const cb = KZ.$('#showAll', root);
      if (cb) cb.addEventListener('change', () => { showAll = cb.checked; KZ.refresh(); });
      requestAnimationFrame(() => drawPath(root));
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => drawPath(root));
      let t; onResize = () => { clearTimeout(t); t = setTimeout(() => drawPath(root), 120); };
      window.addEventListener('resize', onResize);
    },
    unmount() { if (onResize) window.removeEventListener('resize', onResize); },
  };

  /* ---------- חלון תחנה ---------- */
  function checkinState(a) {
    const today = KZ.todayISO();
    if (a.future) return { ok: false, why: 'התחנה הזו תיפתח בשנה הבאה.' };
    if (a.opensOn && today < a.opensOn) return { ok: false, why: `הצ׳ק־אין ייפתח ב־${KZ.fmtDate(a.opensOn)}.` };
    if (a.date && today < a.date) return { ok: false, why: `הצ׳ק־אין ייפתח ביום המפגש (${KZ.fmtDate(a.date)}).` };
    const max = a.repeat || 1;
    if (checkins(a.id).length >= max) return { ok: false, done: true, why: max > 1 ? `סימנת את כל ${max} הפעמים. כל הכבוד!` : '' };
    return { ok: true };
  }

  function openStation(id) {
    if (id === 'me') { KZ.go('#/library/parasha'); return; }
    const a = KZ.program.activities.find((x) => x.id === id); if (!a) return;
    const st = checkinState(a);
    const past = checkins(a.id);
    const statusLine = a.status === 'need'
      ? `<div><b>מארגנים</b><span>מחפשים הורה שירים את זה – ${KZ.g('ספר', 'ספרי', 'ספרו')} להורים! 😉</span></div>`
      : a.owner ? `<div><b>מארגנים</b><span>${esc(a.owner)}</span></div>` : '';
    const html = `
      <div style="font-size:42px;line-height:1">${a.emoji}</div>
      <h2 style="margin-top:8px">${esc(a.title)}</h2>
      <div class="chips" style="gap:6px">${KZ.trackTag(a.track)}${(a.pillars || []).map(KZ.pillarTag).join('')}${a.seeds ? `<span class="tag tag--seed">‎+${a.seeds} גרעינים</span>` : ''}</div>
      <p style="margin-top:12px">${esc(a.kid)}</p>
      <div class="detail-meta">
        <div><b>מתי</b><span>${esc(a.date ? KZ.fmtDate(a.date) : a.when)}${a.dateNote ? ` · <span class="muted">${esc(a.dateNote)}</span>` : ''}</span></div>
        ${statusLine}
      </div>
      ${a.link ? `<p><a class="btn btn--ghost btn--sm" href="${a.link.href}">${icon('book')} ${esc(a.link.label)}</a></p>` : ''}
      ${past.length ? `<div class="stack" style="margin:14px 0">${past.map((c, i) => `<div class="journal-entry"><div class="when">✓ הייתי שם · ${KZ.fmtDate(new Date(c.at))}${past.length > 1 ? ` (#${i + 1})` : ''}</div>${c.note ? `<p>${esc(c.note)}</p>` : ''}</div>`).join('')}</div>` : ''}
      ${a.future ? '' : st.ok ? `
        <form id="checkinForm" class="card card--flat" style="background:var(--card-2)">
          <h3 style="margin-top:0">${icon('check')} ${past.length ? 'עוד צ׳ק־אין' : 'הייתי שם!'}</h3>
          <label class="field"><span>${esc(a.reflect)}</span><textarea class="textarea" name="note" placeholder="משפט אחד מספיק" maxlength="1200"></textarea></label>
          <div class="figure-box">
            <h4>🤝 הדמות מהקהילה שפגשנו (לא חובה)</h4>
            <div class="grid-2" style="gap:8px">
              <label class="field" style="margin:0"><span class="small">שם</span><input class="input" name="fname" maxlength="60"></label>
              <label class="field" style="margin:0"><span class="small">מי זה/זו? (תפקיד, קשר לקהילה)</span><input class="input" name="frole" maxlength="80"></label>
            </div>
            <label class="field" style="margin:8px 0 0"><span class="small">משהו שלמדתי ממנו/ה</span><input class="input" name="flearn" maxlength="200"></label>
          </div>
          <button class="btn btn--block" type="submit">${icon('check')} צ׳ק־אין · ‎+${a.seeds} גרעינים</button>
        </form>` : `<p class="note">${esc(st.why || '')}</p>`}`;
    KZ.modal(html, {
      onMount(m) {
        const f = KZ.$('#checkinForm', m); if (!f) return;
        f.addEventListener('submit', (e) => {
          e.preventDefault();
          const fd = new FormData(f);
          const note = (fd.get('note') || '').toString().trim();
          const fname = (fd.get('fname') || '').toString().trim();
          (S.checkins[a.id] = S.checkins[a.id] || []).push({ at: Date.now(), note });
          const n = S.checkins[a.id].length;
          if (note) KZ.addJournal(a.title, `${a.reflect}\n${note}`, 'station');
          if (fname) S.album.unshift({ id: KZ.uid(), at: Date.now(), name: fname, role: (fd.get('frole') || '').toString().trim(), learned: (fd.get('flearn') || '').toString().trim(), activity: a.title });
          KZ.save();
          KZ.closeModal();
          justStamped = a.id; setTimeout(() => { justStamped = null; }, 1500);
          KZ.award(`checkin:${a.id}:${n}`, a.seeds, a.title);
          if (fname) KZ.award(`album:${a.id}:${n}`, 10, `דמות חדשה באלבום: ${fname}`);
          if (location.hash.startsWith('#/journey') || location.hash === '' || location.hash === '#/') KZ.refresh();
        });
      },
    });
  }
  KZ.openStation = openStation;
  KZ.actions['open-station'] = (el) => openStation(el.dataset.id);
})(window.KZ);
