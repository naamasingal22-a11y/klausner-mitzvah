/* =========================================================
   parasha.js – מחשבון הבר/בת מצווה + קורא הפרשה (ספריא) + מקליט
   ========================================================= */
(function (KZ) {
  'use strict';
  const { esc, icon, S } = KZ;
  const ALIYA = { 1: 'ראשון', 2: 'שני', 3: 'שלישי', 4: 'רביעי', 5: 'חמישי', 6: 'שישי', 7: 'שביעי', maftir: 'מפטיר', haftarah: 'הפטרה' };
  const kindOf = (g) => (g === 'f' ? 'בת מצווה' : 'בר מצווה');

  /* ---------- מחשבון ---------- */
  function resultHTML(bm) {
    if (!bm) return '';
    const sh = KZ.parseISO(bm.shabbat);
    return `<div class="result-box kbox" style="margin-top:28px">
      <span class="sticker">⭐ הפרשה שלי</span>
      <span class="overline">ה${esc(bm.kind)} שלך</span>
      <div class="big">${esc(bm.parashaHe || bm.holidayHe || '...')}</div>
      <p style="margin:6px 0 14px">שבת, ${esc(KZ.fmtDate(sh))} · ${esc(bm.shabbatHeb)}</p>
      <div class="detail-meta">
        <div><b>נולדת</b><span>${esc(bm.birthHeb)}</span></div>
        <div><b>היום העברי</b><span>${esc(bm.dateHeb)} · ${esc(KZ.fmtDate(KZ.parseISO(bm.date), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }))}</span></div>
        ${bm.custom ? `<div><b>השבת</b><span>נקבעה עם ההורים ✏️</span></div>` : ''}
        ${bm.prevParashaHe ? `<div><b>שבת לפני</b><span>${esc(bm.prevParashaHe)} (${esc(KZ.fmtDate(KZ.parseISO(bm.prevShabbat), { day: 'numeric', month: 'long' }))})</span></div>` : ''}
        ${bm.haftarah ? `<div><b>הפטרה</b><span>${esc(KZ.heRef(bm.haftarah))}</span></div>` : ''}
      </div>
      <div class="verify-row">
        ${bm.verified
          ? `<span class="sticker sticker--white" style="--r:-2deg">✓ ${bm.custom ? 'נקבע עם ההורים' : 'בדקתי עם ההורים'}</span>`
          : `<span class="verify-warn">⚠️ עוד לא נבדק עם ההורים</span><button class="btn btn--marker" data-act="bm-verify">${icon('check')} בדקתי עם ההורים – זה נכון</button>`}
        <button class="btn btn--ghost btn--sm" data-act="bm-change">✏️ ההורים קבעו שבת אחרת</button>
      </div>
      ${bm.note ? `<p class="small">${esc(bm.note)}</p>` : ''}${bm.adarNote ? `<p class="small">${esc(bm.adarNote)}</p>` : ''}
      ${bm.holidayHe && !bm.parashaHe ? `<p class="small">השבת הזו היא שבת חג – הקריאה מיוחדת. כדאי לבדוק עם הגבאים.</p>` : ''}
      <div class="btn-row">
        ${bm.leyning ? `<a class="btn btn--marker" href="#/library/practice">${icon('target')} לתרגול מהפרשה שלי</a><a class="btn" href="#/library/reader">${icon('scroll')} לקריאת הפרשה עם טעמים</a>` : ''}
        ${bm.torah ? `<a class="btn btn--ghost" href="${KZ.sefariaURL(bm.torah)}" target="_blank" rel="noopener">הפרשה בספריא</a>` : ''}
        <a class="btn btn--ghost" href="#/journey">⭐ על מפת המסע</a>
      </div>
      <p class="small muted" style="margin:12px 0 0">החישוב לפי לוח הקריאה בארץ ישראל. את התאריך הסופי קובעים תמיד מול הגבאים – לפעמים בוחרים שבת אחרת.</p>
    </div>`;
  }

  /* ---------- הודעה גדולה: לבדוק עם ההורים ---------- */
  function noticeHTML(bm) {
    const found = bm.parashaHe || bm.holidayHe;
    return `<div class="notice-big">
      <div class="notice-big__icon">✋</div>
      <h2>רגע! קודם בודקים עם ההורים</h2>
      ${found ? `<div class="notice-big__found kbox">יצא לנו: <b>${esc(found)}</b><br><span>שבת, ${esc(KZ.fmtDate(bm.shabbat))}</span></div>` : ''}
      <p class="notice-big__lead">זה <b>חישוב של מחשב – לא החלטה סופית.</b> את התאריך ואת הפרשה קובעים ההורים יחד עם הגבאים, ולפעמים בוחרים שבת אחרת.</p>
      <ol class="notice-steps">
        <li><b>הראו להורים</b> את מה שיצא.</li>
        <li><b>משהו לא נכון? כך משנים באתר:</b>
          <ul>
            <li>📅 <b>תאריך לידה</b> או <b>"נולדתי אחרי השקיעה"</b> – בטופס שבראש העמוד <a href="#/library/parasha" data-act="close-modal-go">"הפרשה שלי"</a> (ארון הספרים ← הפרשה שלי). משנים ולוחצים שוב "חשבו לי!".</li>
            <li>✏️ <b>ההורים קבעו שבת אחרת?</b> – הכפתור "ההורים קבעו שבת אחרת" בתיבה הכחולה באותו עמוד.</li>
            <li>👤 <b>שם, בן/בת ותאריך לידה</b> – גם ב<a href="#/me" data-act="close-modal-go">אזור האישי</a> ← "עריכה" (הדמות שלכם בפינה למעלה).</li>
          </ul></li>
        <li><b>ההורים אישרו?</b> לחצו "✓ בדקתי עם ההורים" – ותקבלו 10 גרעינים.</li>
      </ol>
      <button class="btn btn--block btn--marker" data-act="close-modal">הבנתי – אבדוק עם ההורים</button>
    </div>`;
  }
  // נכנס לתור החגיגות, כדי לא להתנגש בתג שנפתח באותו רגע
  function queueNotice(bm) { KZ.queueCelebration({ html: noticeHTML(bm) }); }
  KZ.actions['close-modal-go'] = (el) => { KZ.closeModal(); KZ.go(el.getAttribute('href')); };

  KZ.actions['bm-verify'] = () => {
    if (!S.bm) return;
    S.bm.verified = true; KZ.save();
    KZ.award('parasha:verified', 10, 'בדקת עם ההורים');
    KZ.refresh();
  };
  KZ.actions['bm-change'] = () => {
    if (!S.bm) return;
    KZ.modal(`<h2>באיזו שבת ${S.bm.kind === 'בת מצווה' ? 'תעלי' : 'תעלה'} לתורה?</h2>
      <p class="muted">מה שההורים קבעו עם הגבאים. אם תבחרו יום שאינו שבת – ניקח את השבת שאחריו.</p>
      <form id="shabbatForm">
        <label class="field"><span>תאריך השבת</span><input class="input" type="date" name="d" required value="${esc(S.bm.shabbat)}" style="max-width:220px"></label>
        <button class="btn" type="submit">${icon('check')} שמירה</button> <span class="small muted" id="shStatus"></span>
      </form>`, {
      onMount(m) {
        const f = KZ.$('#shabbatForm', m);
        f.addEventListener('submit', async (e) => {
          e.preventDefault();
          const d = KZ.parseISO(f.d.value); if (!d) return;
          const sh = KZ.nextShabbat(d);
          KZ.$('#shStatus', m).innerHTML = '<span class="loading">מחפשים את הפרשה...</span>';
          try {
            const r = await KZ.parashaFor(sh);
            const L = r.parasha && r.parasha.leyning;
            Object.assign(S.bm, {
              shabbat: KZ.isoOf(sh), shabbatHeb: KZ.hebStr(sh), custom: true, verified: true,
              parashaHe: r.parasha ? r.parasha.hebrew : null, leyning: L || null, torah: L ? L.torah : null, haftarah: L ? L.haftarah : null,
              holidayHe: r.holidays.length ? r.holidays.map((h) => h.hebrew).join(', ') : null, prevParashaHe: null, prevShabbat: null,
            });
            KZ.save(); KZ.closeModal();
            KZ.award('parasha:verified', 10, 'בדקת עם ההורים');
            KZ.refresh();
          } catch (err) {
            KZ.$('#shStatus', m).textContent = 'אין חיבור לאינטרנט – נסו שוב.';
          }
        });
      },
    });
  };

  async function compute(birth, afterSunset, gender) {
    const age = gender === 'f' ? 12 : 13;
    const r = KZ.mitzvahDate(birth, afterSunset, age);
    if (!r) throw new Error('date');
    const sh = KZ.nextShabbat(r.date);
    const prev = KZ.prevShabbat(r.date);
    const bm = {
      kind: kindOf(gender), birth, date: KZ.isoOf(r.date), dateHeb: r.dateHeb, birthHeb: r.birthHeb,
      shabbat: KZ.isoOf(sh), shabbatHeb: KZ.hebStr(sh), note: r.note, adarNote: r.adarNote,
    };
    try {
      const [cur, before] = await Promise.all([KZ.parashaFor(sh), KZ.isoOf(prev) !== KZ.isoOf(sh) ? KZ.parashaFor(prev) : Promise.resolve(null)]);
      if (cur.parasha) {
        bm.parashaHe = cur.parasha.hebrew; bm.leyning = cur.parasha.leyning;
        bm.torah = cur.parasha.leyning && cur.parasha.leyning.torah; bm.haftarah = cur.parasha.leyning && cur.parasha.leyning.haftarah;
      }
      if (cur.holidays.length) bm.holidayHe = cur.holidays.map((h) => h.hebrew).join(', ');
      if (before && before.parasha) { bm.prevParashaHe = before.parasha.hebrew; bm.prevShabbat = KZ.isoOf(prev); }
    } catch (e) { bm.offline = true; }
    return bm;
  }

  KZ.libSections = KZ.libSections || {};
  KZ.libSections.parasha = {
    render() {
      const p = S.profile;
      return `${KZ.libCrumbs('הפרשה שלי')}
        <header class="page-head"><h1>מתי ה${KZ.g('בר מצווה', 'בת מצווה', 'בר/בת מצווה')} שלי?</h1>
          <p>בת מגיעה למצוות בגיל 12 ובן בגיל 13 – ביום ההולדת <b>העברי</b>. הכניסו תאריך לידה ונגלה את התאריך העברי, את השבת ואת הפרשה.</p></header>
        <form class="card" id="calcForm" style="max-width:640px">
          <div class="grid-2">
            <label class="field"><span>תאריך לידה</span><input class="input" type="date" name="birth" required value="${esc(p.birth)}" min="2005-01-01" max="${KZ.todayISO()}"></label>
            <div class="field"><span>אני</span><div class="seg" role="group"><button type="button" data-g="f" aria-pressed="${p.gender === 'f'}">בת</button><button type="button" data-g="m" aria-pressed="${p.gender === 'm'}">בן</button></div></div>
          </div>
          <label class="check"><input type="checkbox" name="sunset" ${p.afterSunset ? 'checked' : ''}> נולדתי אחרי השקיעה (בערב או בלילה)</label>
          <p class="small faint" style="margin:6px 0 14px">ביהדות היום מתחיל בערב – מי שנולד/ה אחרי השקיעה, התאריך העברי שלו/ה הוא כבר של היום הבא.</p>
          <button class="btn" type="submit">${icon('calendar')} חשבו לי!</button>
          <span id="calcStatus" class="small muted" style="margin-inline-start:10px"></span>
        </form>
        <div id="calcResult">${resultHTML(S.bm)}</div>`;
    },
    mount(root) {
      const f = KZ.$('#calcForm', root);
      let gender = S.profile.gender;
      KZ.$$('[data-g]', f).forEach((b) => b.addEventListener('click', () => {
        gender = b.dataset.g;
        KZ.$$('[data-g]', f).forEach((x) => x.setAttribute('aria-pressed', x === b));
      }));
      f.addEventListener('submit', async (e) => {
        e.preventDefault();
        const status = KZ.$('#calcStatus', root);
        if (!gender) { status.textContent = 'בחרו בן או בת'; return; }
        const birth = f.birth.value, sunset = f.sunset.checked;
        status.innerHTML = '<span class="loading">מחשבים...</span>';
        try {
          const bm = await compute(birth, sunset, gender);
          const genderChanged = S.profile.gender !== gender;
          Object.assign(S.profile, { birth, afterSunset: sunset, gender });
          S.bm = bm; KZ.save();
          status.textContent = bm.offline ? 'אין חיבור – הפרשה תופיע כשיחזור האינטרנט.' : '';
          KZ.$('#calcResult', root).innerHTML = resultHTML(bm);
          KZ.$('#calcResult', root).scrollIntoView({ behavior: 'smooth', block: 'start' });
          // קודם רואים את התוצאה, ואז קופצת ההודעה הגדולה
          if (!bm.offline) setTimeout(() => queueNotice(bm), 1100);
          if (bm.parashaHe) setTimeout(() => KZ.award('parasha:found', 15, 'גילית את הפרשה שלך'), 1150);
          if (genderChanged) KZ.updateChrome();
        } catch (err) {
          status.textContent = 'לא הצלחנו לחשב. בדקו את התאריך.';
        }
      });
    },
  };

  // חישוב מחדש ברקע (למשל אחרי ההרשמה)
  KZ.computeMitzvah = async function () {
    const p = S.profile;
    if (!p.birth || !p.gender) return;
    try {
      const bm = await compute(p.birth, p.afterSunset, p.gender);
      S.bm = bm; KZ.save();
      if (!bm.offline) queueNotice(bm);
      if (bm.parashaHe) KZ.award('parasha:found', 15, 'גילית את הפרשה שלך');
    } catch (e) { /* */ }
  };

  /* ---------- קורא הפרשה ---------- */
  let rec = null, recStream = null, recURL = null;
  function stopRec() { try { if (rec && rec.state !== 'inactive') rec.stop(); } catch (e) { /* */ } if (recStream) recStream.getTracks().forEach((t) => t.stop()); rec = null; recStream = null; }

  KZ.libSections.reader = {
    render(params) {
      return `${KZ.libCrumbs('קורא הפרשה')}
        <header class="page-head" id="readerHead"><h1>קורא הפרשה</h1><p><span class="loading">טוען את הפרשה...</span></p></header>
        <div class="chips aliyot" id="aliyot" style="margin-bottom:14px"></div>
        <div class="card" id="readerBox"><p class="muted">בחרו קטע לקריאה.</p></div>
        <section class="section grid-2">
          <div class="card">
            <h3>${icon('mic')} מקליט האימון</h3>
            <p class="small muted">הקליטו את עצמכם קוראים, ואז הקשיבו: איפה עצרתם? איפה הדגשתם? ההקלטה נשארת רק במכשיר הזה.</p>
            <div class="recorder" id="recorder"><button type="button" class="btn btn--sm" data-rec="start">${icon('mic')} הקלטה</button></div>
          </div>
          <div class="card">
            <p style="margin:0 0 14px"><a class="btn btn--sm btn--marker" href="#/library/practice">${icon('target')} לתרגול ומשחקים מהקטע שלי</a></p>
            <h3>${icon('calendar')} פרשה אחרת</h3>
            <p class="small muted">בחרו תאריך – ונפתח את פרשת השבת שאחריו.</p>
            <form id="otherDate" class="btn-row"><input class="input" type="date" name="d" required style="max-width:200px"><button class="btn btn--sm btn--ghost" type="submit">פתחו</button></form>
            ${S.bm && S.bm.leyning ? `<p style="margin:10px 0 0"><a class="small" href="#/library/reader">⭐ לפרשה שלי</a> · <a class="small" href="#/library/reader/week">לפרשת השבוע</a></p>` : ''}
          </div>
        </section>`;
    },
    async mount(root, params) {
      const head = KZ.$('#readerHead', root), chips = KZ.$('#aliyot', root), box = KZ.$('#readerBox', root);
      KZ.$('#otherDate', root).addEventListener('submit', (e) => { e.preventDefault(); const d = KZ.parseISO(e.target.d.value); if (d) KZ.go('#/library/reader/date/' + KZ.isoOf(KZ.nextShabbat(d))); });
      bindRecorder(KZ.$('#recorder', root));

      let title, sub, leyning, mine = false;
      try {
        if (params[0] === 'date' && params[1]) {
          const r = await KZ.parashaFor(KZ.parseISO(params[1]));
          if (!r.parasha) throw new Error('holiday');
          title = r.parasha.hebrew; leyning = r.parasha.leyning; sub = `שבת ${KZ.fmtDate(r.date)} · ${KZ.hebStr(KZ.parseISO(r.date))}`;
        } else if (params[0] !== 'week' && S.bm && S.bm.leyning) {
          title = S.bm.parashaHe; leyning = S.bm.leyning; mine = true; sub = `ה${S.bm.kind} שלך · שבת ${KZ.fmtDate(S.bm.shabbat)}`;
        } else {
          const r = await KZ.thisWeek();
          if (!r.parasha) throw new Error('holiday');
          title = r.parasha.hebrew; leyning = r.parasha.leyning; sub = `פרשת השבוע · שבת ${KZ.fmtDate(r.date)}`;
        }
      } catch (e) {
        head.innerHTML = `<h1>קורא הפרשה</h1><p class="muted">${e.message === 'holiday' ? 'בשבת הזו יש קריאה מיוחדת של חג. נסו תאריך אחר.' : 'לא הצלחנו לטעון את הפרשה – בדקו את החיבור לאינטרנט.'}</p>`;
        box.innerHTML = `<p class="muted">בינתיים אפשר לתרגל בזכוכית המגדלת שב<a href="#/library/taamim">מאגר הטעמים</a> – היא עובדת גם בלי אינטרנט.</p>`;
        return;
      }
      if (!head.isConnected) return;
      head.innerHTML = `<span class="overline">${mine ? '⭐ הפרשה שלי' : 'קורא הפרשה'}</span><h1>${esc(title)}</h1><p>${esc(sub)}${leyning.torah ? ` · ${esc(KZ.heRef(leyning.torah))}` : ''}</p>`;
      const keys = ['1', '2', '3', '4', '5', '6', '7', 'maftir', 'haftarah'].filter((k) => leyning[k]);
      let current = mine ? (leyning.maftir ? 'maftir' : '1') : '1';
      chips.innerHTML = keys.map((k) => `<button type="button" class="chip" data-k="${k}" aria-pressed="${k === current}">${ALIYA[k]}</button>`).join('');
      let ctl = null;
      async function load(k) {
        current = k;
        KZ.$$('[data-k]', chips).forEach((c) => c.setAttribute('aria-pressed', c.dataset.k === k));
        const ref = leyning[k];
        box.innerHTML = `<p><span class="loading">טוען את ${ALIYA[k]}...</span></p>`;
        try {
          const verses = await KZ.fetchVerses(ref);
          if (!box.isConnected || current !== k) return;
          let lastCh = null;
          const vv = verses.map((v) => { const label = (v.ch !== lastCh ? KZ.gematria(v.ch, false) + ':' : '') + KZ.gematria(v.v, false); lastCh = v.ch; return { label, he: v.he }; });
          box.innerHTML = `<div class="section-head" style="margin-bottom:6px"><h3 style="margin:0">${ALIYA[k]} · <span class="muted" style="font-weight:500">${esc(KZ.heRef(ref))}</span></h3><a class="small" href="${KZ.sefariaURL(ref)}" target="_blank" rel="noopener">בספריא ↗</a></div><div id="rd"></div>`;
          ctl = KZ.mountReader(KZ.$('#rd', box), vv);
        } catch (e) {
          box.innerHTML = `<p class="muted">לא הצלחנו לטעון את הטקסט מספריא. נסו שוב, או <a href="${KZ.sefariaURL(ref)}" target="_blank" rel="noopener">פתחו ישירות בספריא</a>.</p>`;
        }
      }
      chips.addEventListener('click', (e) => { const c = e.target.closest('[data-k]'); if (c) load(c.dataset.k); });
      load(current);
    },
    unmount() { stopRec(); },
  };

  function bindRecorder(el) {
    function idle(extra = '') {
      el.innerHTML = `<button type="button" class="btn btn--sm" data-rec="start">${icon('mic')} ${extra ? 'הקלטה חדשה' : 'הקלטה'}</button>${extra}`;
    }
    el.addEventListener('click', async (e) => {
      const b = e.target.closest('[data-rec]'); if (!b) return;
      if (b.dataset.rec === 'start') {
        if (!navigator.mediaDevices || !window.MediaRecorder) { el.insertAdjacentHTML('beforeend', '<p class="small muted">הדפדפן הזה לא תומך בהקלטה.</p>'); return; }
        try {
          recStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const chunks = [];
          rec = new MediaRecorder(recStream);
          rec.ondataavailable = (ev) => { if (ev.data.size) chunks.push(ev.data); };
          rec.onstop = () => {
            const blob = new Blob(chunks, { type: (rec && rec.mimeType) || 'audio/webm' });
            if (recURL) URL.revokeObjectURL(recURL);
            recURL = URL.createObjectURL(blob);
            if (recStream) recStream.getTracks().forEach((t) => t.stop());
            recStream = null;
            idle(`<audio controls src="${recURL}" style="max-width:100%"></audio><a class="btn btn--sm btn--ghost" href="${recURL}" download="הקריאה-שלי.webm">${icon('download')} שמירה</a>`);
            KZ.award('record:first', 10, 'הקלטת אימון ראשונה');
          };
          rec.start();
          el.innerHTML = `<span class="rec-dot"></span><strong>מקליטים...</strong><button type="button" class="btn btn--sm btn--ink" data-rec="stop">${icon('stop')} עצירה</button>`;
        } catch (err) {
          el.insertAdjacentHTML('beforeend', '<p class="small muted">אין הרשאה למיקרופון. אפשרו אותה בהגדרות הדפדפן ונסו שוב.</p>');
        }
      } else if (b.dataset.rec === 'stop' && rec) {
        rec.stop();
      }
    });
  }
})(window.KZ);
