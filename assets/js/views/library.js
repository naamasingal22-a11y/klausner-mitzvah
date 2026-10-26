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
    { id: 'parasha', title: 'הפרשה שלי', desc: 'מחשבון: התאריך העברי, השבת והפרשה של הבר/בת מצווה שלכם.', icon: 'calendar', color: 'honey' },
    { id: 'practice', title: 'תרגול מהפרשה שלי', desc: 'משחקי טעמים על הפסוקים של העלייה שלכם, ומעקב קריאה פסוק אחרי פסוק.', icon: 'target', color: 'honey' },
    { id: 'reader', title: 'קורא הפרשה', desc: 'קוראים את הפרשה עם טעמים, בלי טעמים או כמו בספר תורה – ומקליטים את עצמכם.', icon: 'scroll', color: 'pom' },
    { id: 'siddur', title: 'מפת הסידור', desc: 'מה קורה בכל רגע בתפילה, מה עושים בגוף ומה עונים. היילייטס ופרקטיקה.', icon: 'book', color: 'teal' },
    { id: 'aliyah', title: 'העלייה לתורה', desc: 'צעד אחר צעד – מהרגע שקוראים לכם בשם ועד "יישר כוח".', icon: 'stairs', color: 'pom' },
    { id: 'gabbai', title: 'מדריך הגבאי/ת הצעיר/ה', desc: 'לסטאז׳ הגבאות: מה עושים לפני, בזמן ואחרי התפילה.', icon: 'clipboard', color: 'honey' },
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
          <p>כל מה שצריך כדי להרגיש בבית בבית הכנסת: טעמים, תפילה, עלייה לתורה ודבר תורה. ביקור ראשון בכל מדף = 5 גרעינים.</p>
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
            <li>הבעל/ת קורא/ת והגבאים של המניין – המקור הכי טוב למנגינה ולמנהגים שלנו.</li>
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
  let serviceId = 'shabbat';
  KZ.libSections.siddur = {
    render() {
      const sv = KZ.siddur.services.find((s) => s.id === serviceId) || KZ.siddur.services[0];
      return `${crumbs('מפת הסידור')}
        <header class="page-head"><h1>מפת הסידור</h1>
          <p>לא היסטוריה – היילייטס ופרקטיקה: מה קורה בכל חלק, איזה רגע שווה לתפוס, ומה עושים. ${KZ.g('לחץ', 'לחצי', 'לחצו')} על כל חלק כדי לפתוח.</p></header>
        <div class="seg service-tabs" role="tablist">${KZ.siddur.services.map((s) => `<button type="button" aria-pressed="${s.id === sv.id}" data-act="siddur-tab" data-id="${s.id}">${s.emoji} ${esc(s.name)}</button>`).join('')}</div>
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
            <div class="tl-body">
              ${p.highlight ? `<div class="highlight"><b>⭐ הרגע לתפוס:</b> ${esc(p.highlight)}</div>` : ''}
              ${p.say ? `<div class="small muted">עונים:</div><div class="say">${esc(p.say)}</div>` : ''}
              ${p.words ? `<div class="small muted">אומרים:</div><div class="words">${p.words.map((w) => `<div class="words__line ${w.who === 'כולם' ? 'words__line--all' : ''}"><span class="words__who">${esc(w.who)}</span><span class="words__text">${esc(w.text)}</span></div>`).join('')}</div>` : ''}
              ${p.practice && p.practice.length ? `<div class="small muted" style="margin-bottom:4px">מה עושים:</div><ul class="practice">${p.practice.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
              ${p.link ? `<p style="margin-top:10px"><a class="btn btn--sm btn--ghost" href="${p.link.href}">${esc(p.link.label)}</a></p>` : ''}
            </div></details></div>`).join('')}
        </div>
        <section class="section">
          <div class="section-head"><h2>תפילה בגוף</h2></div>
          <div class="body-grid">${KZ.siddur.body.map((b) => `<div class="card card--flat body-item"><span class="e">${b.e}</span><div><strong>${esc(b.title)}</strong><div class="muted small">${esc(b.text)}</div></div></div>`).join('')}</div>
        </section>
        <section class="section">
          <div class="section-head"><h2>מה עונים?</h2></div>
          <div class="grid-2">${KZ.siddur.responses.map((r) => `<div class="card card--flat"><strong>${esc(r.when)}</strong><div class="say">${esc(r.say)}</div><div class="small muted">${esc(r.note)}</div></div>`).join('')}</div>
        </section>
        <section class="section card weekly">
          <h3>🧩 בואו נבדוק: מה בא קודם?</h3>
          <p class="muted">במשחק "סדר בתפילה" מסדרים את חלקי התפילה – ומקבלים גרעינים.</p>
          <a class="btn btn--teal" href="#/games/order">למשחק</a>
        </section>`;
    },
  };
  KZ.actions['siddur-tab'] = (el) => { serviceId = el.dataset.id; KZ.refresh(); };

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
            <div class="card"><h3>ולמפטיר/ה – הברכה שלפני ההפטרה</h3><div class="blessing" style="font-size:1.2rem">${esc(A.haftarahBefore)}</div>
              <p class="small muted" style="margin-top:8px">הברכות שאחרי ההפטרה ארוכות יותר – הן מופיעות בחומש ובסידור.</p></div>
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
        <header class="page-head"><span class="overline">לסטאז׳ הגבאות</span><h1>מדריך הגבאי/ת הצעיר/ה</h1><p>${esc(G.intro)}</p></header>
        <div class="grid-2">${G.phases.map((p) => `<div class="card"><h3>${p.e} ${esc(p.t)}</h3><ul class="practice">${p.items.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>`).join('')}</div>
        <section class="section card weekly"><h3>שלושה סודות של גבאים טובים</h3><ul class="practice">${G.tips.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
          <div class="btn-row" style="margin-top:10px"><button class="btn btn--sm" data-act="open-station" data-id="gabbaut">לתחנת סטאז׳ הגבאות</button><button class="btn btn--sm btn--ghost" data-act="open-quest" data-id="kn-gabbai">אתגר: שאלו את הגבאי/ת</button></div></section>`;
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
