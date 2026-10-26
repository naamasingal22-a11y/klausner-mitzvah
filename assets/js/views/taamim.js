/* =========================================================
   taamim.js (view) – מאגר הטעמים, משפחות, זכוכית מגדלת,
   ורכיב "קורא" משותף (עם טעמים / ניקוד / כמו בספר תורה)
   ========================================================= */
(function (KZ) {
  'use strict';
  const { esc, icon, S } = KZ;
  const T = (id) => KZ.taamById(id);
  const rankCls = (id) => (T(id) ? KZ.taamRanks[T(id).rank].cls : '');
  const isDisj = (t) => t.rank !== 'servant';

  /* ---------- רכיב הקורא ---------- */
  function versesHTML(verses, st) {
    return verses.map((v) => {
      const toks = KZ.tokenize(v.he);
      let out = st.mode === 'scroll' ? '' : `<span class="vnum">${esc(v.label || '')}</span>`;
      toks.forEach((t) => {
        if (t.type === 'petucha') { out += '<span class="petucha"></span>'; return; }
        if (t.type === 'setuma') { out += '<span class="setuma"></span>'; return; }
        if (t.type === 'paseq') { if (st.mode !== 'scroll') out += '<span class="paseq">׀</span> '; return; }
        if (st.mode === 'scroll') { out += KZ.stripAll(t.text) + ' '; return; }
        const txt = st.mode === 'nikud' ? KZ.stripTaamim(t.text) : t.text;
        const cls = t.id ? `w ${rankCls(t.id)}${st.hl && st.hl === t.id ? ' hl' : ''}` : 'w';
        out += `<span class="${cls}" ${t.id ? `data-t="${t.id}"` : ''}>${esc(txt)}</span>${t.joined ? '' : ' '}`;
      });
      return out;
    }).join(st.mode === 'scroll' ? '' : ' ');
  }
  function legendHTML(verses, st) {
    const counts = {};
    verses.forEach((v) => KZ.tokenize(v.he).forEach((t) => { if (t.id) counts[t.id] = (counts[t.id] || 0) + 1; }));
    const ids = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
    if (!ids.length) return '';
    return `<div class="small muted" style="margin:14px 0 6px">הטעמים בקטע (${KZ.g('לחץ', 'לחצי', 'לחצו')} כדי להדגיש):</div>
      <div class="taam-legend">${ids.map((id) => `<button type="button" class="rank-pill ${rankCls(id)}" data-hl="${id}" aria-pressed="${st.hl === id}" style="${st.hl === id ? 'outline:2px solid currentColor' : ''}"><span class="g">${T(id).glyph}</span>${esc(T(id).name)} · ${counts[id]}</button>`).join('')}</div>`;
  }

  KZ.mountReader = function (el, verses, opts = {}) {
    const st = { mode: 'full', colors: true, hl: null };
    function draw() {
      el.innerHTML = `
        <div class="reader-tools">
          <div class="seg" role="group" aria-label="אופן התצוגה">
            <button type="button" data-m="full" aria-pressed="${st.mode === 'full'}">עם טעמים</button>
            <button type="button" data-m="nikud" aria-pressed="${st.mode === 'nikud'}">רק ניקוד</button>
            <button type="button" data-m="scroll" aria-pressed="${st.mode === 'scroll'}">כמו בספר תורה</button>
          </div>
          <div class="btn-row">
            ${st.mode !== 'scroll' ? `<label class="check small"><input type="checkbox" data-colors ${st.colors ? 'checked' : ''}> צבעים לפי דרגה</label>` : ''}
            <span class="font-ctl"><button type="button" class="icon-btn" data-fs="-1" aria-label="הקטנת גופן">א־</button><button type="button" class="icon-btn" data-fs="1" aria-label="הגדלת גופן" style="font-size:1.2rem">א+</button></span>
          </div>
        </div>
        <div class="verse-card"><div class="reader ${st.colors && st.mode !== 'scroll' ? 'colors' : ''} ${st.mode === 'scroll' ? 'scroll' : ''}" style="--fs:${S.settings.fs || 1}">${versesHTML(verses, st)}</div></div>
        ${st.mode === 'scroll' ? '<p class="small muted" style="margin-top:10px">ככה זה נראה בספר התורה: בלי ניקוד, בלי טעמים ובלי סימני פסוק. הבעל/ת קורא/ת זוכר/ת הכול בעל פה!</p>' : legendHTML(verses, st)}
        ${st.mode !== 'scroll' ? `<p class="small faint" style="margin-top:8px">${KZ.g('לחץ', 'לחצי', 'לחצו')} על מילה כדי לראות את הטעם שלה.</p>` : ''}`;
    }
    function closePop() { const p = KZ.$('.taam-pop', el); if (p) p.remove(); KZ.$$('.w.sel', el).forEach((w) => w.classList.remove('sel')); }
    el.addEventListener('click', (e) => {
      const m = e.target.closest('[data-m]'); if (m) { st.mode = m.dataset.m; draw(); return; }
      const fs = e.target.closest('[data-fs]');
      if (fs) { S.settings.fs = Math.max(.7, Math.min(1.8, (S.settings.fs || 1) + (+fs.dataset.fs) * .15)); KZ.save(); KZ.$('.reader', el).style.setProperty('--fs', S.settings.fs); return; }
      const hl = e.target.closest('[data-hl]'); if (hl) { st.hl = st.hl === hl.dataset.hl ? null : hl.dataset.hl; draw(); return; }
      const det = e.target.closest('[data-taam-detail]'); if (det) { openTaam(det.dataset.taamDetail); return; }
      const w = e.target.closest('.w[data-t]');
      closePop();
      if (w) {
        const t = T(w.dataset.t); if (!t) return;
        w.classList.add('sel');
        const card = KZ.$('.verse-card', el);
        const cr = card.getBoundingClientRect(), wr = w.getBoundingClientRect();
        const pop = document.createElement('div');
        pop.className = 'taam-pop';
        pop.innerHTML = `<b>${esc(t.name)}</b>${t.alt ? ` <span style="opacity:.7">(${esc(t.alt)})</span>` : ''}<br>${isDisj(t) ? 'מפסיק' : 'משרת'} · ${KZ.taamRanks[t.rank].name}<br><button type="button" class="link-btn" style="color:inherit" data-taam-detail="${t.id}">עוד על הטעם ←</button>`;
        card.appendChild(pop);
        const pw = pop.offsetWidth;
        let left = wr.left - cr.left + wr.width / 2 - pw / 2;
        left = Math.max(0, Math.min(left, cr.width - pw));
        pop.style.left = left + 'px';
        pop.style.top = (wr.bottom - cr.top + 6) + 'px';
      }
    });
    el.addEventListener('change', (e) => { if (e.target.matches('[data-colors]')) { st.colors = e.target.checked; draw(); } });
    draw();
    return { setVerses(v) { verses = v; st.hl = null; draw(); } };
  };

  /* ---------- חלון טעם ---------- */
  function openTaam(id) {
    const t = T(id); if (!t) return;
    const R = KZ.taamRanks[t.rank];
    const groups = KZ.taamGroups.filter((g) => g.seq.includes(id));
    KZ.modal(`
      <div class="taam-big"><span class="glyph ${R.cls}" style="background:none">${t.glyph}</span><span class="word">${esc(t.ex[0][0])}</span><div class="small faint">${esc(t.ex[0][1])}</div></div>
      <h2 style="text-align:center;padding:0">${esc(t.name)}${t.alt ? ` <span class="muted" style="font-weight:500">· ${esc(t.alt)}</span>` : ''}</h2>
      <div class="chips" style="justify-content:center;gap:6px"><span class="rank-pill ${R.cls}" style="padding:4px 12px">${isDisj(t) ? 'מפסיק' : 'משרת'} · ${R.name}</span>${t.freq ? `<span class="tag">כ־${t.freq.toLocaleString('he-IL')} פעמים בתורה</span>` : ''}</div>
      <div class="detail-meta"><div><b>איפה</b><span>${esc(t.place)}</span></div><div><b>איך נראה</b><span>${esc(t.looks)}</span></div></div>
      <div class="highlight"><b>💡 טיפ:</b> ${esc(t.tip)}</div>
      <h3>עוד דוגמאות מהתורה</h3>
      <div class="ex-list">${t.ex.map(([w, r]) => `<span><small>${esc(r)}</small>${esc(w)}</span>`).join('')}</div>
      ${groups.length ? `<h3 style="margin-top:16px">מופיע במשפחות</h3><div class="stack">${groups.map((g) => `<div><strong>${esc(g.name)}:</strong> <span class="seq" style="display:inline-flex">${g.seq.map((s) => `<span class="${s === id ? 'tag tag--need' : 'tag'}">${esc(T(s).name)}</span>`).join('<span class="arrow">←</span>')}</span></div>`).join('')}</div>` : ''}
    `);
  }
  KZ.openTaam = openTaam;
  KZ.actions['open-taam'] = (el) => openTaam(el.dataset.id);

  /* ---------- עמוד הטעמים ---------- */
  let filter = 'all';
  let sampleId = 'gen1';
  let readerCtl = null;

  KZ.libSections = KZ.libSections || {};
  KZ.libSections.taamim = {
    render() {
      const ranks = Object.entries(KZ.taamRanks);
      const F = {
        all: () => true, disj: (t) => isDisj(t), conj: (t) => !isDisj(t),
        basic: (t) => t.level === 'basic', rare: (t) => t.level === 'rare',
      };
      const list = KZ.taamim.filter(F[filter]);
      return `${KZ.libCrumbs('טעמי המקרא')}
        <header class="page-head"><h1>טעמי המקרא</h1>
          <p>הסימנים הקטנים שמעל ומתחת למילים הם הסוד של הקריאה בתורה. העמוד הזה הוא מאגר – כל המידע במקום אחד.</p></header>
        <a class="card card--link weekly practice-promo" href="#/library/course" style="margin-bottom:22px">
          <span class="sticker" style="--r:-4deg">${KZ.g('חדש', 'חדשה', 'חדשים')} בטעמים? 🎓</span>
          <h2 style="margin:10px 0 4px">לומדים טעמים – צעד אחר צעד</h2>
          <p class="muted" style="margin:0">9 שיעורים קצרים, מאפס: מה הם הטעמים, איך הם מחלקים את הפסוק, ומשפחה אחרי משפחה – עם פסוקים אמיתיים, משימות ובוחן קצר בסוף כל שיעור.</p>
        </a>
        <p class="muted">לכל טעם יש שלושה תפקידים:</p>
        <div class="grid-3">
          <div class="card card--flat"><div style="font-size:28px">🎵</div><strong>מנגינה</strong><p class="muted small" style="margin:0">לכל טעם יש לחן קצר משלו. ביחד הם יוצרים את "השיר" של הפסוק.</p></div>
          <div class="card card--flat"><div style="font-size:28px">🎯</div><strong>הטעמה</strong><p class="muted small" style="margin:0">הטעם יושב (ברוב המקרים) על ההברה שמדגישים: מֶלֶךְ או מְלָךְ?</p></div>
          <div class="card card--flat"><div style="font-size:28px">⏸️</div><strong>פיסוק</strong><p class="muted small" style="margin:0">יש טעמים שעוצרים (מפסיקים) ויש שמחברים (משרתים) – כמו נקודה ופסיק.</p></div>
        </div>

        <section class="section">
          <div class="section-head"><h2>ממלכת הטעמים</h2><span class="small muted">מהעצירה החזקה לחלשה</span></div>
          <div class="card rank-ladder">${ranks.map(([rk, R]) => `
            <div class="rank-row"><div class="rank-row__label">${R.name}<small>${esc(R.desc)}</small></div>
            <div class="rank-row__items">${KZ.taamim.filter((t) => t.rank === rk).map((t) => `<button type="button" class="rank-pill ${R.cls}" data-act="open-taam" data-id="${t.id}"><span class="g">${t.glyph}</span>${esc(t.name)}</button>`).join('')}</div></div>`).join('')}
          </div>
        </section>

        <section class="section">
          <div class="section-head"><h2>משפחות טעמים</h2><a class="small" href="#/games/chain">⛓️ למשחק השרשרת</a></div>
          <p class="muted">הטעמים באים בקבוצות קבועות: משרתים שמובילים אל מפסיק. מי שמכיר את המשפחות – כבר יודע/ת חצי מהמנגינה.</p>
          <div class="grid-2">${KZ.taamGroups.map((g) => `
            <div class="card group-card">
              <h3>${esc(g.name)}</h3>
              <div class="seq">${g.seq.map((s) => `<button type="button" class="rank-pill ${rankCls(s)}" data-act="open-taam" data-id="${s}"><span class="g">${T(s).glyph}</span>${esc(T(s).name)}</button>`).join('<span class="arrow">←</span>')}</div>
              <div class="verse">${esc(g.verse)}</div>
              <div class="small faint">${esc(g.ref)}</div>
              ${g.note ? `<p class="small muted" style="margin:6px 0 0">${esc(g.note)}</p>` : ''}
            </div>`).join('')}
          </div>
        </section>

        <section class="section">
          <div class="section-head"><h2>כל הטעמים</h2></div>
          <div class="chips" style="margin-bottom:14px">${[['all', 'הכול'], ['basic', '8 הבסיסיים'], ['disj', 'מפסיקים'], ['conj', 'משרתים'], ['rare', 'נדירים']].map(([k, l]) => `<button type="button" class="chip" aria-pressed="${filter === k}" data-act="taam-filter" data-f="${k}">${l}</button>`).join('')}</div>
          <div class="grid-3 taam-grid">${list.map((t) => `
            <button type="button" class="card taam-card" data-act="open-taam" data-id="${t.id}">
              <span class="taam-glyph ${KZ.taamRanks[t.rank].cls}">${t.glyph}</span>
              <div><h3>${esc(t.name)}${t.alt ? ` <span class="faint small">· ${esc(t.alt)}</span>` : ''}</h3>
              <div class="ex">${esc(t.ex[0][0])}</div>
              <div class="small muted">${isDisj(t) ? 'מפסיק' : 'משרת'} · ${esc(t.place)}</div></div>
            </button>`).join('')}
          </div>
        </section>

        <section class="section">
          <div class="section-head"><h2>🔍 זכוכית מגדלת</h2></div>
          <p class="muted">${KZ.g('בחר', 'בחרי', 'בחרו')} קטע, ${KZ.g('לחץ', 'לחצי', 'לחצו')} על מילה – ותגלו איזה טעם יש עליה. אפשר גם להחליף לתצוגת "ספר תורה" ולנסות לקרוא בלי עזרה.</p>
          <div class="seg" style="margin-bottom:12px">${KZ.sampleVerses.map((s) => `<button type="button" aria-pressed="${s.id === sampleId}" data-act="taam-sample" data-id="${s.id}">${esc(s.title.split(' · ')[1] || s.title)}</button>`).join('')}<button type="button" aria-pressed="${sampleId === 'mine'}" data-act="taam-sample" data-id="mine">פסוק משלי</button></div>
          <div class="card">
            ${sampleId === 'mine' ? `<label class="field"><span>הדביקו פסוק עם טעמים (למשל מספריא)</span><textarea class="textarea text" id="mineText" style="font-size:1.3rem" placeholder="בְּרֵאשִׁ֖ית בָּרָ֣א אֱלֹהִ֑ים...">${esc(S.mineVerse || '')}</textarea></label>` : `<div class="small faint" style="margin-bottom:8px">${esc((KZ.sampleVerses.find((s) => s.id === sampleId) || {}).title || '')}</div>`}
            <div id="sampleReader"></div>
          </div>
          <p class="small muted" style="margin-top:10px">רוצים קטע אחר? ב<a href="#/library/reader">קורא הפרשה</a> אפשר לפתוח כל פרשה, עם אותה זכוכית מגדלת.</p>
        </section>

        <section class="section note">
          <strong>🎶 ומה עם המנגינות?</strong> הסימנים זהים בכל הקהילות, אבל המנגינה משתנה: אשכנז, ספרד, תימן, ירושלמי – ולתורה, להפטרה ולמגילות יש לחנים שונים. את המנגינה הכי טוב ללמוד מהמורה או מהבעל/ת קורא/ת של הקהילה, ולהקליט אותם כדי לתרגל.
        </section>

        <section class="section card weekly">
          <h3>🎮 מוכנים לבדוק את עצמכם?</h3>
          <div class="btn-row"><a class="btn btn--tch" href="#/games/taam">🎵 טעם־מטרה</a><a class="btn btn--teal" href="#/games/speed">⚡ מפסיק או משרת</a><a class="btn btn--ghost" href="#/games/chain">⛓️ שרשרת טעמים</a></div>
        </section>`;
    },
    mount(root) {
      const el = KZ.$('#sampleReader', root);
      const toVerses = () => {
        if (sampleId === 'mine') {
          const txt = (S.mineVerse || '').trim();
          // מפצלים לפסוקים אחרי כל ׃ (בלי lookbehind – לא נתמך בספארי ישן)
          return txt ? txt.split('׃').map((s) => s.trim()).filter(Boolean).map((he, i) => ({ label: KZ.gematria(i + 1, false), he: he + '׃' })) : [];
        }
        const s = KZ.sampleVerses.find((x) => x.id === sampleId) || KZ.sampleVerses[0];
        return s.verses.map((v) => ({ label: v.n, he: v.he }));
      };
      readerCtl = KZ.mountReader(el, toVerses());
      const mine = KZ.$('#mineText', root);
      if (mine) {
        let t;
        mine.addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => { S.mineVerse = mine.value; KZ.save(); readerCtl.setVerses(toVerses()); }, 350); });
      }
    },
  };
  KZ.actions['taam-filter'] = (el) => { filter = el.dataset.f; KZ.refresh(); };
  KZ.actions['taam-sample'] = (el) => { sampleId = el.dataset.id; KZ.refresh(); };
})(window.KZ);
