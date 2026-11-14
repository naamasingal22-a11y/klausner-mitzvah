/* =========================================================
   library.js – ארון הספרים: מרכז המאגרים, הסידור, העלייה לתורה,
   מדריך הגבאי/ת, מילון מושגים ובונה דבר תורה
   ========================================================= */
(function (KZ) {
  'use strict';
  const { esc, icon, S } = KZ;

  KZ.libSections = KZ.libSections || {};
  const SECTIONS = [
    { id: 'course', title: 'לומדים טעמים – קורס', desc: '9 שיעורים קצרים מאפס: מה הם הטעמים, איך הם מחלקים את הפסוק, ומשפחה אחרי משפחה.', icon: 'seedling', color: 'honey' },
    { id: 'taamim', title: 'טעמי המקרא', desc: 'כל 26 הטעמים, המשפחות שלהם וזכוכית מגדלת שמזהה טעמים בכל פסוק.', icon: 'music', color: 'tch' },
    { id: 'parasha', title: 'הפרשה שלי', desc: 'מחשבון: התאריך העברי, השבת והפרשה של הבר מצווה שלכם.', icon: 'calendar', color: 'honey' },
    { id: 'practice', title: 'תרגול מהפרשה שלי', desc: 'משחקי טעמים על הפסוקים של העלייה שלכם, ומעקב קריאה פסוק אחרי פסוק.', icon: 'target', color: 'honey' },
    { id: 'reader', title: 'קורא הפרשה', desc: 'קוראים את הפרשה עם טעמים, בלי טעמים או כמו בספר תורה – ומקליטים את עצמכם.', icon: 'scroll', color: 'pom' },
    { id: 'siddur', title: 'מפת הסידור', desc: 'מה קורה בכל רגע בתפילה, מה עושים בגוף ומה עונים. היילייטס ופרקטיקה.', icon: 'book', color: 'teal' },
    { id: 'aliyah', title: 'העלייה לתורה', desc: 'צעד אחר צעד – מהרגע שקוראים לכם בשם ועד "יישר כוח".', icon: 'stairs', color: 'pom' },
    { id: 'gabbai', title: 'מדריך הגבאי/ת הצעיר/ה', desc: 'מאחורי הקלעים של בית הכנסת: מה עושים לפני, בזמן ואחרי התפילה.', icon: 'clipboard', color: 'honey' },
    { id: 'dvar', title: 'בונה דבר התורה', desc: 'שלב אחר שלב, מהפסוק ועד התודות. נשמר אצלכם.', icon: 'chat', color: 'teal' },
    { id: 'glossary', title: 'מילון מושגים', desc: 'מפטיר? הגבהה? חיוב? כל המילים של בית הכנסת.', icon: 'alef', color: 'tch' },
  ];
  const BG = { tch: 'var(--tch-soft);color:var(--tch)', honey: 'var(--honey-soft);color:var(--honey-deep)', pom: 'var(--pom-soft);color:var(--pom)', teal: 'var(--teal-soft);color:var(--teal-deep)' };

  const crumbs = (title) => `<nav class="crumbs" aria-label="פירורי לחם"><a href="#/library">ארון הספרים</a>${icon('chevL')}<span>${esc(title)}</span></nav>`;
  KZ.libCrumbs = crumbs;

  KZ.views.library = {
    tab: 'library',
    title: (p) => (SECTIONS.find((s) => s.id === p[0]) || { title: 'ארון הספרים' }).title,
    render(params) {
      const sec = KZ.libSections[params[0]];
      if (sec) return sec.render(params.slice(1));
      return `
        <header class="page-head">
          <span class="overline">מאגרי מידע</span>
          <h1>ארון הספרים</h1>
          <p>כל מה שצריך כדי להרגיש בבית בבית הכנסת: טעמים, תפילה, עלייה לתורה ודבר תורה.</p>
        </header>
        <div class="grid-2">${SECTIONS.map((s) => `
          <a class="card card--link lib-card" href="#/library/${s.id}">
            <span class="lib-card__icon" style="background:${BG[s.color]}">${icon(s.icon)}</span>
            <div><h3>${esc(s.title)}${S.visited[s.id] ? '<span class="visited-dot" title="ביקרת כאן"></span>' : ''}</h3><p>${esc(s.desc)}</p></div>
          </a>`).join('')}
        </div>
        <section class="section card card--flat">
          <h3>עוד מקורות טובים</h3>
          <ul class="practice">
            <li><a href="https://www.sefaria.org.il/" target="_blank" rel="noopener">ספריא</a> – כל ארון הספרים היהודי, חינם, עם טעמים ותרגומים.</li>
            <li><a href="https://www.hebcal.com/sedrot/?i=on" target="_blank" rel="noopener">Hebcal</a> – לוח הפרשות לכל שנה.</li>
            <li>הבעל קורא והגבאים בבית הכנסת שלך – המקור הכי טוב למנגינה ולמנהגים.</li>
          </ul>
        </section>`;
    },
    mount(root, params) {
      const sec = KZ.libSections[params[0]];
      if (sec) {
        const meta = SECTIONS.find((s) => s.id === params[0]);
        if (meta) KZ.markVisited(meta.id, meta.title);
        if (sec.mount) sec.mount(root, params.slice(1));
      }
    },
    unmount() { Object.values(KZ.libSections).forEach((s) => s.unmount && s.unmount()); },
  };

  /* ---------- הסידור ---------- */
  // שני מצבים: "צעד אחר צעד" – קטע קצר, ואז שאלה בלי להציץ (ברירת מחדל),
  // ו"כל המפה" – הכול ברשימה, לעיון ולחזרה
  let siddurTab = 'shabbat';
  let siddurMode = 'tour';
  const EXTRA_TABS = [{ id: 'body', name: 'תפילה בגוף', emoji: '🧍' }, { id: 'resp', name: 'מה עונים', emoji: '🗣️' }];
  const siddurTabs = () => [...KZ.siddur.services.map((s) => ({ id: s.id, name: s.name, emoji: s.emoji })), ...EXTRA_TABS];
  KZ.siddurTabIds = () => siddurTabs().map((t) => t.id);
  const isService = (tab) => KZ.siddur.services.some((s) => s.id === tab);
  // גרסה 2: כל חלק מתחלק לכמה צעדים קטנים. מי שהתחיל/ה בסיור הישן מתחיל/ה מחדש
  // (הסימון "סיימת" והבלוקים שכבר התקבלו – נשארים)
  const TOUR_V = 2;
  const tourOf = (tab) => {
    S.siddurTour = S.siddurTour || {};
    const st = S.siddurTour[tab] = S.siddurTour[tab] || { i: 0, res: {} };
    if (st.v !== TOUR_V) { if (isService(tab)) { st.i = 0; st.res = {}; } st.v = TOUR_V; }
    return st;
  };

  // שורה מהסידור עם סימני תנועה מעל המילים (KZ.moveMarks):
  // "[bow]בָּרוּךְ" – הסימן מעל המילה. "[fwd]" לבד – עושים את זה לפני המילה הבאה.
  function moveLine(line, used) {
    return line.split(/\s+/).filter(Boolean).map((tok) => {
      const m = tok.match(/^\[(\w+)\](.*)$/);
      const mk = m && KZ.moveMarks[m[1]];
      const word = m ? m[2] : tok;
      if (!mk) return `<span class="mv__u"><span class="mv__m"></span><span class="mv__w">${esc(word)}</span></span>`;
      if (!used.includes(m[1])) used.push(m[1]);
      const chip = `<span class="mv__m"><b title="${esc(mk.t)}">${mk.s}</b></span>`;
      return word
        ? `<span class="mv__u mv__u--on">${chip}<span class="mv__w">${esc(word)}</span></span>`
        : `<span class="mv__u mv__u--solo">${chip}<span class="mv__w">${esc(mk.short || mk.t)}</span></span>`;
    }).join('');
  }
  const moveKey = (used) => used.length ? `<div class="mv-key">${used.map((k) => `<span><b>${KZ.moveMarks[k].s}</b> ${esc(KZ.moveMarks[k].t)}</span>`).join('')}</div>` : '';

  // אותה שורה בלי הסימנים, כמילים להקשה ("באיזו מילה כורעים?")
  function tapLine(line, mark) {
    return line.split(/\s+/).filter(Boolean).map((tok) => {
      const m = tok.match(/^\[(\w+)\](.*)$/);
      const word = m ? m[2] : tok;
      if (!word) return '';
      return `<span class="sw" role="button" tabindex="0" data-ok="${m && m[1] === mark ? 1 : 0}">${esc(word)}</span>`;
    }).filter(Boolean).join(' ');
  }

  // חלקי התוכן של כל חלק בתפילה – אותם חלקים ב"כל המפה" ובצעדים.
  // idx – אילו שורות להראות (למשל [0, 1]); בלי idx – את כולן
  const pick = (arr, idx) => (idx ? idx.map((k) => arr[k]).filter(Boolean) : arr);
  const PIECES = {
    what: (p) => (p.what ? `<p class="tour-what">${esc(p.what)}</p>` : ''),
    highlight: (p) => (p.highlight ? `<div class="highlight"><b>⭐ הרגע לתפוס:</b> ${esc(p.highlight)}</div>` : ''),
    say: (p) => (p.say ? `<div class="small muted">עונים:</div><div class="say">${esc(p.say)}</div>` : ''),
    words(p, idx) {
      const lines = p.words ? pick(p.words, idx) : [];
      if (!lines.length) return '';
      const used = [];
      const html = lines.map((w) => `<div class="words__line ${w.who === 'כולם' ? 'words__line--all' : ''}"><span class="words__who">${esc(w.who)}</span>${w.text.includes('[') ? `<span class="words__text mv">${moveLine(w.text, used)}</span>` : `<span class="words__text">${esc(w.text)}</span>`}</div>`).join('');
      return `<div class="small muted">אומרים:</div><div class="words">${html}${moveKey(used)}</div>`;
    },
    moves(p, idx) {
      const lines = p.moves ? pick(p.moves, idx) : [];
      if (!lines.length) return '';
      const used = [];
      const html = lines.map((m) => `<div class="mv-line">${m.label ? `<span class="mv-line__label">${esc(m.label)}</span>` : ''}<div class="mv">${moveLine(m.line, used)}</div></div>`).join('');
      return `<div class="small muted">מה עושים בגוף – מילה במילה:</div><div class="moves">${html}${moveKey(used)}</div>`;
    },
    practice(p, idx) {
      const items = p.practice ? pick(p.practice, idx) : [];
      return items.length ? `<div class="small muted" style="margin-bottom:4px">מה עושים:</div><ul class="practice">${items.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : '';
    },
  };
  const linkHTML = (p) => (p.link ? `<p style="margin-top:10px"><a class="btn btn--sm btn--ghost" href="${p.link.href}">${esc(p.link.label)}</a></p>` : '');
  const partBody = (p) => ['highlight', 'say', 'words', 'moves', 'practice'].map((k) => PIECES[k](p)).join('') + linkHTML(p);
  // "what highlight practice:0,1" – רק מה שהצעד מבקש להראות
  const parseShow = (show) => String(show || '').trim().split(/\s+/).filter(Boolean).map((t) => {
    const [k, n] = t.split(':');
    return { k, idx: n ? n.split(',').map(Number) : null };
  });
  const chunkHTML = (p, show) => parseShow(show).map(({ k, idx }) => (PIECES[k] ? PIECES[k](p, idx) : '')).join('');
  // "moves:1" / "words:3" – השורה לשאלת ההקשה
  function lineOf(p, ref) {
    const [k, n] = String(ref || '').split(':');
    const row = (k === 'moves' ? p.moves : k === 'words' ? p.words : null) || [];
    const r = row[+n || 0];
    return r ? (r.line || r.text || '') : '';
  }

  const bodyCard = (b) => `<div class="card card--flat body-item"><span class="e">${b.e}</span><div><strong>${esc(b.title)}</strong><div class="muted small">${esc(b.text)}</div></div></div>`;
  const respCard = (r) => `<div class="card card--flat"><strong>${esc(r.when)}</strong><div class="say">${esc(r.say)}</div><div class="small muted">${esc(r.note)}</div></div>`;

  // הצעדים של כל לשונית. g – מספר החלק (נקודה אחת בפס ההתקדמות), k מתוך n – הצעד בתוך החלק
  function tourSteps(tab) {
    const sv = KZ.siddur.services.find((s) => s.id === tab);
    if (sv) {
      const out = [];
      sv.parts.forEach((p, g) => {
        let list = (KZ.siddurChecks[tab] || {})[p.name];
        if (list && !Array.isArray(list)) list = [{ show: 'what highlight say words moves practice', ...list }];
        if (!list || !list.length) list = [null]; // חלק בלי צעדים – מראים הכול, בלי שאלה
        list.forEach((c, k) => out.push({ kind: 'part', p, c, g, k, n: list.length }));
      });
      return out;
    }
    if (tab === 'body') return KZ.siddur.body.map((b, g) => ({ kind: 'body', b, g, k: 0, n: 1 }));
    return KZ.siddur.responses.map((r, g) => ({ kind: 'resp', r, g, k: 0, n: 1 }));
  }
  // שתי תשובות שגויות מתוך שאר הפריטים
  const others = (list, item, n = 2) => KZ.sample(list.filter((x) => x !== item), n);

  const toTour = `<p class="note">זה הסיכום המלא – לעיון ולחזרה. כדי ללמוד ולבדוק את עצמכם: <button type="button" class="btn btn--sm btn--ghost" data-act="siddur-mode" data-m="tour">🚶 צעד אחר צעד</button></p>`;
  function mapHTML(tab) {
    const sv = KZ.siddur.services.find((s) => s.id === tab);
    if (tab === 'body') return `${toTour}<div class="body-grid">${KZ.siddur.body.map(bodyCard).join('')}</div>`;
    if (tab === 'resp') return `${toTour}<div class="grid-2">${KZ.siddur.responses.map(respCard).join('')}</div>`;
    return `${toTour}
      <div class="map-legend">
        <strong>איך קוראים את המפה?</strong>
        <div class="map-legend__row"><span class="highlight map-legend__tag"><b>⭐ הרגע לתפוס</b></span><span>הרגע הכי חזק או מעניין בחלק הזה של התפילה – משפט, רעיון או מנגינה. גם אם קשה להתרכז בכל התפילה, שווה "לתפוס" לפחות את הרגע הזה: לשים לב אליו, לומר אותו לאט, לשיר אותו עם כולם.</span></div>
        <div class="map-legend__row"><span class="say map-legend__tag">עונים / אומרים</span><span>המילים עצמן: מה הקהל עונה יחד בקול (מסומן בתכלת), ומה אומרים בפתיחה ובסיום.</span></div>
        <div class="map-legend__row"><span class="map-legend__tag map-legend__tag--do">מה עושים</span><span>מה עושים בגוף ובמעשה: עומדים, כורעים, מכסים עיניים, מנשקים.</span></div>
      </div>
      <p class="muted">${esc(sv.intro)}</p>
      <div class="timeline">${sv.parts.map((p, i) => `
        <div class="tl-item" data-n="${i + 1}"><details ${i === 0 ? 'open' : ''}>
          <summary><div><h3>${esc(p.name)}</h3><p>${esc(p.what)}</p></div><span class="chev">${icon('chevL')}</span></summary>
          <div class="tl-body">${partBody(p)}</div></details></div>`).join('')}
      </div>`;
  }

  KZ.libSections.siddur = {
    render() {
      const tabs = siddurTabs();
      if (!tabs.some((t) => t.id === siddurTab)) siddurTab = tabs[0].id;
      return `${crumbs('מפת הסידור')}
        <header class="page-head"><h1>מפת הסידור</h1>
          <p>${siddurMode === 'tour' ? 'קטע קצר בכל פעם – ואחריו שאלה, בלי להציץ. ההתקדמות נשמרת, ואפשר להמשיך בכל פעם מאותו מקום.' : 'כל החלקים ברשימה אחת. ' + KZ.g('לחץ', 'לחצי', 'לחצו') + ' על חלק כדי לפתוח.'}</p></header>
        <div class="seg siddur-mode" role="group" aria-label="אופן התצוגה" style="margin-bottom:10px">
          <button type="button" data-act="siddur-mode" data-m="tour" aria-pressed="${siddurMode === 'tour'}">🚶 צעד אחר צעד</button>
          <button type="button" data-act="siddur-mode" data-m="map" aria-pressed="${siddurMode === 'map'}">🗺️ כל המפה (לעיון)</button>
        </div>
        <div class="seg service-tabs" role="tablist">${tabs.map((t) => `<button type="button" aria-pressed="${t.id === siddurTab}" data-act="siddur-tab" data-id="${t.id}">${t.emoji} ${esc(t.name)}${S.siddurTour && S.siddurTour[t.id] && S.siddurTour[t.id].done ? ' ✓' : ''}</button>`).join('')}</div>
        ${siddurMode === 'tour' ? '<div id="tour"></div>' : mapHTML(siddurTab)}
        <section class="section card weekly">
          <h3>🧩 עוד בדיקה: מה בא קודם?</h3>
          <p class="muted">במשחק "סדר בתפילה" מסדרים את חלקי התפילה – ומקבלים בלוקים.</p>
          <a class="btn btn--teal" href="#/games/order">למשחק</a>
        </section>`;
    },
    mount(root) {
      if (siddurMode !== 'tour') return;
      const box = KZ.$('#tour', root);
      const tab = siddurTab;
      const tabs = siddurTabs();
      const tabMeta = tabs.find((t) => t.id === tab);
      const steps = tourSteps(tab);
      const groups = steps.length ? steps[steps.length - 1].g + 1 : 0;
      const st = tourOf(tab);
      if (st.i > steps.length) st.i = 0;
      const hasQ = (s) => s.kind !== 'part' || !!s.c;
      // מפתח קבוע לבלוקים: לפי שם החלק ומספר הצעד בתוכו (לא לפי המיקום ברשימה)
      const awardKey = (s, i) => (s.kind === 'part' ? `siddur:${tab}:${s.p.name}#${s.k}` : `siddur:${tab}:${i}`);

      // נקודה אחת לכל חלק בתפילה: צהובה – כאן, כחולה – נכון בפעם הראשונה, אדומה – הייתה טעות
      function dots() {
        const cur = st.i < steps.length ? steps[st.i].g : -1;
        const cls = (g) => {
          if (g === cur) return 'on';
          const mine = steps.map((s, i) => ({ s, i })).filter((x) => x.s.g === g);
          const qs = mine.filter((x) => hasQ(x.s));
          const done = qs.length ? qs.every((x) => st.res[x.i] !== undefined) : mine[mine.length - 1].i < st.i;
          if (!done) return '';
          return qs.some((x) => st.res[x.i] === false) ? 'miss' : 'past';
        };
        return `<div class="c-dots tour-dots" aria-hidden="true">${Array.from({ length: groups }, (_, g) => `<i class="${cls(g)}"></i>`).join('')}</div>`;
      }
      function nav(canNext) {
        return `<div class="c-nav">
          ${st.i > 0 ? '<button type="button" class="btn btn--ghost" data-tour="prev">→ הקודם</button>' : '<span></span>'}
          <button type="button" class="btn ${st.i === steps.length - 1 ? 'btn--marker' : ''}" data-tour="next" ${canNext ? '' : 'disabled title="קודם עונים על השאלה"'}>${st.i === steps.length - 1 ? 'סיום ✓' : 'הבא ←'}</button>
        </div>`;
      }
      const optsHTML = (opts, cls = '') => `<div class="options">${opts.map((o) => `<button type="button" class="opt ${cls}" data-k="${esc(o.k)}">${o.html}</button>`).join('')}</div>`;

      // אחרי תשובה: הסבר, בלוקים על הצלחה בפעם הראשונה, ופתיחת "הבא"
      function answered(s, ok, explainHTML, afterHTML) {
        const first = st.res[st.i] === undefined;
        if (first) st.res[st.i] = ok;
        KZ.save();
        if (ok && first) KZ.award(awardKey(s, st.i), 2, `מפת הסידור: ${tabMeta.name}`, { silent: true });
        const fb = KZ.$('#tourFb', box);
        fb.classList.add(ok ? 'fb-box--ok' : 'fb-box--fix');
        fb.innerHTML = `${ok ? `✓ נכון!${first ? ' <span class="tag tag--seed">+2</span>' : ''} ` : 'כמעט! '}${explainHTML}`;
        if (afterHTML) KZ.$('#tourAfter', box).innerHTML = afterHTML;
        const nx = KZ.$('[data-tour="next"]', box);
        nx.disabled = false;
        nx.removeAttribute('title');
      }
      function bindOpts(correctKey, onAnswer) {
        let done = false;
        KZ.$$('.opt', box).forEach((b) => b.addEventListener('click', () => {
          if (done) return; done = true;
          const ok = b.dataset.k === correctKey;
          b.classList.add(ok ? 'right' : 'wrong');
          if (!ok) KZ.$(`.opt[data-k="${CSS.escape(correctKey)}"]`, box).classList.add('right');
          onAnswer(ok);
        }));
      }
      function bindTap(onAnswer) {
        let done = false;
        const tap = (sw) => {
          if (done) return; done = true;
          const ok = sw.dataset.ok === '1';
          if (!ok) sw.classList.add('wrong');
          KZ.$$('.sw[data-ok="1"]', box).forEach((x) => x.classList.add('right'));
          onAnswer(ok);
        };
        KZ.$$('.sw', box).forEach((sw) => {
          sw.addEventListener('click', () => tap(sw));
          sw.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tap(sw); } });
        });
      }

      function drawPart(s, head) {
        const p = s.p, c = s.c;
        const review = !!c && !c.show; // "זוכרים?" – שאלה בלי קטע חדש
        const info = c ? chunkHTML(p, c.show) : PIECES.what(p) + partBody(p);
        const src = c && c.tap ? lineOf(p, c.line) : '';
        const ask = c ? `
          <div class="c-task tour-check" id="tourCheck"${review ? '' : ' hidden'}>
            <span class="sticker" style="--r:-3deg;font-size:1.05rem">${review ? '🔁 זוכרים?' : 'בדיקה קטנה ✓'}</span>
            <p class="c-prompt">${esc(c.q)}</p>
            ${c.tap
              ? `<p class="small muted" style="margin:0 0 4px">${KZ.g('הקש', 'הקישי', 'הקישו')} על המילה:</p><div class="stop-verse c-find tour-tap">${tapLine(src, c.tap)}</div>`
              : optsHTML(KZ.shuffle(c.o.map((o, k) => ({ k: String(k), html: esc(o) }))))}
            <div class="fb-box" id="tourFb"></div>
            <div id="tourAfter"></div>
          </div>` : '';
        box.innerHTML = `${head}
          <div class="card tour-card">
            <div class="tour-title"><h2 class="c-title">${esc(p.name)}</h2>${s.n > 1 ? `<span class="tour-sub">צעד ${s.k + 1} מתוך ${s.n}</span>` : ''}</div>
            ${review ? '' : `<div id="tourInfo">${info}</div>`}
            ${c && !review ? `<div class="tour-go" id="tourGo">
              <button type="button" class="btn btn--marker" data-tour="ask">קראתי – לשאלה ←</button>
              <span class="small muted">הקטע יוסתר, ו${KZ.g('תענה', 'תעני', 'תענו')} מהזיכרון.</span></div>` : ''}
            ${ask}
          </div>${nav(!c || st.res[st.i] !== undefined)}`;
        if (!c) return;
        const after = () => {
          const out = [];
          if (c.tap) { const used = []; const ml = moveLine(src, used); out.push(`<div class="tour-marked"><div class="small muted">עם הסימנים:</div><div class="mv">${ml}</div>${moveKey(used)}</div>`); }
          if (!review && info) out.push(`<details class="tour-again"><summary>📖 לקרוא שוב את הקטע</summary>${info}</details>`);
          if (s.k === s.n - 1) out.push(linkHTML(p));
          return out.join('');
        };
        const onAnswer = (ok) => answered(s, ok, esc(c.e || ''), after());
        if (c.tap) bindTap(onAnswer); else bindOpts(String(c.a), onAnswer);
      }

      function draw() {
        st.i = Math.max(0, Math.min(st.i, steps.length));
        KZ.save();
        if (st.i === steps.length) return summary();
        const s = steps[st.i];
        const pos = s.kind === 'part' ? `חלק ${s.g + 1} מתוך ${groups}` : `${st.i + 1} מתוך ${steps.length}`;
        const head = `<div class="tour-head"><span class="overline">${tabMeta.emoji} ${esc(tabMeta.name)} · ${pos}</span>${dots()}</div>`;
        if (s.kind === 'part') return drawPart(s, head);
        const again = st.res[st.i] !== undefined;
        if (s.kind === 'body') {
          // קודם מנחשים, ואז רואים את ההסבר
          const b = s.b, prompt = (KZ.siddurBodyPrompts || {})[b.title] || b.text;
          const opts = KZ.shuffle([b, ...others(KZ.siddur.body, b)]).map((x) => ({ k: x.title, html: `${x.e} ${esc(x.title)}` }));
          box.innerHTML = `${head}
            <div class="card tour-card">
              <p class="tour-what">${esc(prompt)} –</p>
              <h2 class="c-title">מה עושים?</h2>
              ${optsHTML(opts)}
              <div class="fb-box" id="tourFb"></div>
              <div id="tourAfter"></div>
            </div>${nav(again)}`;
          bindOpts(b.title, (ok) => answered(s, ok, '', bodyCard(b)));
        } else {
          const r = s.r;
          const opts = KZ.shuffle([r, ...others(KZ.siddur.responses, r)]).map((x) => ({ k: x.when, html: `<span class="text">${esc(x.say)}</span>` }));
          box.innerHTML = `${head}
            <div class="card tour-card">
              <p class="tour-what">${esc(r.when)} –</p>
              <h2 class="c-title">מה עונים?</h2>
              ${optsHTML(opts, 'opt--say')}
              <div class="fb-box" id="tourFb"></div>
              <div id="tourAfter"></div>
            </div>${nav(again)}`;
          bindOpts(r.when, (ok) => answered(s, ok, '', respCard(r)));
        }
      }
      function summary() {
        const total = steps.filter(hasQ).length;
        const right = Object.values(st.res).filter(Boolean).length;
        if (!st.done) {
          st.done = Date.now(); KZ.save(); KZ.confetti(70);
          const tb = KZ.$(`[data-act="siddur-tab"][data-id="${tab}"]`, root);
          if (tb && !tb.textContent.includes('✓')) tb.textContent += ' ✓';
        }
        KZ.award(`siddur-done:${tab}`, 10, `סיימת: ${tabMeta.name}`);
        const idx = tabs.findIndex((t) => t.id === tab);
        const next = tabs.slice(idx + 1).concat(tabs.slice(0, idx)).find((t) => !(S.siddurTour && S.siddurTour[t.id] && S.siddurTour[t.id].done));
        box.innerHTML = `<div class="card tour-card center">
            <div class="notice-big__icon" style="font-size:44px;width:84px;height:84px">${tabMeta.emoji}</div>
            <h2 style="padding:0">${KZ.g('סיימת', 'סיימת', 'סיימתם')}: ${esc(tabMeta.name)}!</h2>
            <p class="muted">${right} מתוך ${total} תשובות נכונות בפעם הראשונה.</p>
            <div class="btn-row" style="justify-content:center">
              ${next ? `<button type="button" class="btn btn--marker" data-act="siddur-tab" data-id="${next.id}">${next.emoji} ל${esc(next.name)} ←</button>` : '<span class="sticker" style="--r:-3deg">📖 עברת על כל המפה!</span>'}
              <button type="button" class="btn btn--ghost" data-act="siddur-mode" data-m="map">🗺️ לכל המפה – לחזרה</button>
              <button type="button" class="btn btn--ghost" data-tour="restart">מההתחלה</button>
            </div>
          </div>`;
      }
      box.addEventListener('click', (e) => {
        const b = e.target.closest('[data-tour]'); if (!b || b.disabled) return;
        if (b.dataset.tour === 'ask') {
          // מסתירים את הקטע ועוברים לשאלה
          KZ.$('#tourInfo', box).hidden = true;
          KZ.$('#tourGo', box).remove();
          KZ.$('#tourCheck', box).hidden = false;
          box.scrollIntoView({ behavior: 'smooth', block: 'start' });
          return;
        }
        if (b.dataset.tour === 'prev') st.i--;
        else if (b.dataset.tour === 'next') st.i++;
        else if (b.dataset.tour === 'restart') st.i = 0;
        draw();
        box.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      draw();
    },
  };
  KZ.actions['siddur-tab'] = (el) => { siddurTab = el.dataset.id; KZ.refresh(); };
  KZ.actions['siddur-mode'] = (el) => { siddurMode = el.dataset.m; KZ.refresh(); };

  /* ---------- העלייה לתורה ---------- */
  KZ.libSections.aliyah = {
    render() {
      const A = KZ.aliyah;
      return `${crumbs('העלייה לתורה')}
        <header class="page-head"><h1>העלייה לתורה</h1>
          <p>כמה דקות על הבימה, מול ספר התורה הפתוח. הנה כל מה שצריך לדעת – כדי שתוכלו להיות רגועים וליהנות מהרגע.</p></header>
        <div class="grid-2" style="align-items:start">
          <div class="card"><h2>צעד אחר צעד</h2><ol class="steps">${A.steps.map((s) => `<li><h4>${esc(s.t)}</h4><p>${esc(s.d)}</p></li>`).join('')}</ol></div>
          <div class="stack">
            <div class="card"><h2>הברכה הראשונה</h2>
              <div class="blessing">${A.before.map((b) => b.who === 'קהל' ? `<span class="resp">${esc(b.text)}</span>` : `<span>${esc(b.text)}</span> `).join('')}</div></div>
            <div class="card"><h2>הברכה האחרונה</h2><div class="blessing">${esc(A.after)}</div></div>
            <div class="card"><h3>ולמי שעולה למפטיר: ברכות ההפטרה</h3>
              <p class="small muted" style="margin:0 0 8px">מי שעולה למפטיר הוא בדרך כלל גם זה שקורא את ההפטרה, ומברך לפניה ואחריה.</p>
              <h4 style="margin:0 0 6px">הברכה שלפני ההפטרה</h4>
              <div class="blessing" style="font-size:1.2rem">${esc(A.haftarahBefore)}</div>
              <details class="haft-after"><summary>הברכות שאחרי ההפטרה (${A.haftarahAfter.length} ברכות) ›</summary>
                ${A.haftarahAfter.map((b, i) => `<h4>${i + 1}. ${esc(b.t)}</h4><div class="blessing" style="font-size:1.2rem">${esc(b.text)}</div>`).join('')}
                <p class="small muted" style="margin-top:8px">בשבת שהיא גם חג או חול המועד, הנוסח של הברכה האחרונה משתנה. בודקים בסידור.</p>
              </details></div>
          </div>
        </div>
        <section class="section"><div class="section-head"><h2>מי עושה מה ליד הבימה?</h2></div>
          <div class="grid-3">${A.roles.map((r) => `<div class="card card--flat body-item"><span class="e">${r.e}</span><div><strong>${esc(r.t)}</strong><div class="muted small">${esc(r.d)}</div></div></div>`).join('')}</div></section>
        <section class="section card weekly"><h3>טיפים של ותיקים</h3><ul class="practice">${A.tips.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
          <div class="btn-row" style="margin-top:10px"><button class="btn btn--sm" data-act="open-quest" data-id="kn-brachot">אתגר: ברכות התורה בעל פה</button></div></section>`;
    },
  };

  /* ---------- מדריך הגבאי/ת ---------- */
  KZ.libSections.gabbai = {
    render() {
      const G = KZ.gabbai;
      return `${crumbs('מדריך הגבאי/ת הצעיר/ה')}
        <header class="page-head"><span class="overline">מאחורי הקלעים</span><h1>מדריך הגבאי/ת הצעיר/ה</h1><p>${esc(G.intro)}</p></header>
        <div class="grid-2">${G.phases.map((p) => `<div class="card"><h3>${p.e} ${esc(p.t)}</h3><ul class="practice">${p.items.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>`).join('')}</div>
        <section class="section card weekly"><h3>שלושה סודות של גבאים טובים</h3><ul class="practice">${G.tips.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
          <div class="btn-row" style="margin-top:10px"><button class="btn btn--sm btn--ghost" data-act="open-quest" data-id="kn-gabbai">אתגר: שאלו את הגבאי/ת</button></div></section>`;
    },
  };

  /* ---------- מילון מושגים ---------- */
  KZ.libSections.glossary = {
    render() {
      return `${crumbs('מילון מושגים')}
        <header class="page-head"><h1>מילון מושגים</h1><p>${KZ.glossary.length} מילים שכדאי להכיר. אחר כך – נסו את חידון המושגים!</p></header>
        <div class="search" style="margin-bottom:14px">${icon('search')}<input class="input" id="glossSearch" type="search" placeholder="חיפוש מושג..." aria-label="חיפוש מושג"></div>
        <dl class="card" id="glossList" style="padding:4px 0">${KZ.glossary.map((g) => `<div class="gloss-item" data-k="${esc(g.t + ' ' + g.d)}"><dt>${esc(g.t)}</dt><dd>${esc(g.d)}</dd></div>`).join('')}</dl>
        <p class="center" style="margin-top:16px"><a class="btn btn--tch" href="#/games/words">🔤 לחידון המושגים</a></p>`;
    },
    mount(root) {
      const inp = KZ.$('#glossSearch', root);
      inp.addEventListener('input', () => {
        const v = inp.value.trim();
        KZ.$$('.gloss-item', root).forEach((el) => { el.hidden = v && !el.dataset.k.includes(v); });
      });
    },
  };

  /* ---------- בונה דבר תורה ---------- */
  KZ.libSections.dvar = {
    render() {
      const D = KZ.dvar;
      const parasha = S.bm && S.bm.parashaHe ? `<p class="note">הפרשה שלך: <b>${esc(S.bm.parashaHe)}</b> · <a href="#/library/reader">לקריאה</a> · <a href="${S.bm.torah ? KZ.sefariaURL(S.bm.torah) : 'https://www.sefaria.org.il/'}" target="_blank" rel="noopener">בספריא (עם פירושים)</a></p>` : `<p class="note">עוד לא ${KZ.g('חישבת', 'חישבת', 'חישבתם')} מה הפרשה? <a href="#/library/parasha">למחשבון הפרשה</a></p>`;
      return `${crumbs('בונה דבר התורה')}
        <header class="page-head"><h1>בונה דבר התורה</h1><p>דבר תורה טוב מתחיל בשאלה טובה. ממלאים שלב אחר שלב – הכול נשמר אוטומטית במכשיר הזה.</p></header>
        ${parasha}
        <div class="grid-2" style="align-items:start">
          <div class="card"><h2>הדרך</h2><ol class="steps">${D.steps.map((s) => `<li><h4>${esc(s.t)}</h4><p>${esc(s.d)}</p></li>`).join('')}</ol></div>
          <form class="card" id="dvarForm"><h2>הטיוטה שלי</h2>
            ${D.fields.map((f) => `<label class="field"><span>${esc(f.label)}</span><textarea class="textarea" name="${f.k}" placeholder="${esc(f.ph)}" style="min-height:${f.k === 'me' ? 110 : 80}px">${esc(S.dvar[f.k] || '')}</textarea></label>`).join('')}
            <div class="btn-row"><button type="button" class="btn btn--ghost btn--sm" data-act="dvar-copy">${icon('download')} העתקה כטקסט</button><span class="small faint" id="dvarSaved"></span></div>
          </form>
        </div>`;
    },
    mount(root) {
      const f = KZ.$('#dvarForm', root);
      let t;
      f.addEventListener('input', (e) => {
        if (!e.target.name) return;
        S.dvar[e.target.name] = e.target.value;
        clearTimeout(t);
        t = setTimeout(() => {
          KZ.save();
          KZ.$('#dvarSaved', root).textContent = 'נשמר ✓';
          const filled = KZ.dvar.fields.filter((x) => x.k !== 'thanks' && (S.dvar[x.k] || '').trim().length > 5).length;
          if (filled >= 3) KZ.award('dvar:started', 10, 'התחלת דבר תורה');
          KZ.checkBadges();
        }, 600);
      });
    },
  };
  KZ.actions['dvar-copy'] = () => {
    const text = KZ.dvar.fields.map((f) => `${f.label}:\n${S.dvar[f.k] || ''}`).join('\n\n');
    const done = () => KZ.toast('הועתק! אפשר להדביק במסמך או בהודעה');
    if (navigator.clipboard) navigator.clipboard.writeText(text).then(done, () => KZ.toast('ההעתקה לא הצליחה'));
    else KZ.toast('ההעתקה לא נתמכת בדפדפן הזה');
  };
})(window.KZ);
