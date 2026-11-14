/* =========================================================
   parents.js – עמוד ההורים: איך יותם מתקדם, ואיך אפשר לעזור
   מציג רק התקדמות (מה עשה, מתי), לא את מה שכתב.
   היומן, קפסולת הזמן והרפלקציות – שלו בלבד.
   ========================================================= */
(function (KZ) {
  'use strict';
  const { esc, icon, S } = KZ;

  const name = () => KZ.firstName() || (KZ.gift && KZ.gift.name) || 'יותם';
  const ci = (id) => (S.checkins[id] || []);

  // מתי הייתה פעילות אחרונה (לפי הבלוקים שהתקבלו)
  function lastActive() {
    const times = Object.values(S.awards).map((a) => a.at || 0).filter(Boolean);
    if (!times.length) return null;
    const days = KZ.daysBetween(new Date(Math.max(...times)), new Date());
    return days <= 0 ? 'היום' : days === 1 ? 'אתמול' : `לפני ${days} ימים`;
  }

  function tiles() {
    const n = KZ.seeds();
    const lv = KZ.levelFor(n);
    const acts = KZ.program.activities;
    const stDone = acts.filter((a) => ci(a.id).length).length;
    const qDone = KZ.quests.filter((q) => S.quests[q.id]).length;
    const bDone = KZ.badges.filter((b) => S.badges[b.id]).length;
    const t = (num, label, sub = '') => `<div class="card pd-tile"><span class="pd-tile__num">${num}</span><span class="pd-tile__label">${label}</span>${sub ? `<span class="pd-tile__sub">${sub}</span>` : ''}</div>`;
    return `<div class="pd-tiles">
      ${t(n, 'בלוקים מתוך 613', `${lv.icon} ${esc(lv.name)}`)}
      ${t(`${stDone}/${acts.length}`, 'תחנות במסע')}
      ${t(qDone, 'משימות שהושלמו')}
      ${t(bDone, 'הישגים')}
    </div>`;
  }

  function bigDay() {
    const bm = S.bm;
    if (!bm || !bm.date) {
      return `<div class="card card--flat pd-day"><strong>📅 התאריך עוד לא חושב.</strong>
        <span class="muted small">אפשר לחשב יחד ב<a href="#/library/parasha">מחשבון הפרשה</a> (צריך תאריך לידה), ולבדוק את התוצאה מול לוח עברי.</span></div>`;
    }
    const d = bm.shabbat || bm.date;
    const days = KZ.daysBetween(new Date(), KZ.parseISO(d));
    return `<div class="card card--flat pd-day">
      <strong>⭐ ה${esc(bm.kind || 'בר מצווה')}: ${esc(KZ.fmtDate(d))}${bm.parashaHe ? ` · ${esc(bm.parashaHe)}` : ''}</strong>
      <span class="muted small">${days > 0 ? `עוד ${days} ימים.` : days === 0 ? 'היום! מזל טוב!' : ''}${bm.verified ? '' : ' כדאי לבדוק את התאריך מול לוח עברי או מול הגבאי.'}</span>
    </div>`;
  }

  // התחנות: מה עבר, מה הבא, ואיך אפשר לעזור
  function stations() {
    const acts = KZ.program.activities;
    const next = acts.find((a) => !ci(a.id).length);
    return `<ol class="pd-stations">${acts.map((a) => {
      const list = ci(a.id);
      const done = list.length > 0;
      const isNext = a === next;
      const state = done
        ? `<span class="tag tag--ok">✓ ${a.repeat && list.length > 1 ? `${list.length} פעמים` : 'עבר'} · ${esc(KZ.fmtDate(new Date(list[list.length - 1].at), { day: 'numeric', month: 'short' }))}</span>`
        : isNext ? '<span class="tag tag--need">הבאה בתור</span>' : '<span class="tag tag--joint">עוד לא</span>';
      return `<li class="pd-station ${done ? 'is-done' : ''} ${isNext ? 'is-next' : ''}">
        <span class="pd-station__e" aria-hidden="true">${a.emoji}</span>
        <div class="pd-station__body">
          <div class="pd-station__top"><strong>${esc(a.title)}</strong>${state}</div>
          ${a.parent ? `<p class="pd-help"><b>איך אפשר לעזור:</b> ${esc(a.parent)}</p>` : ''}
        </div>
      </li>`;
    }).join('')}</ol>`;
  }

  function learning() {
    const L = KZ.courseLessons || [];
    const cDone = L.filter((l) => S.course && S.course.done && S.course.done[l.id]).length;
    const tabs = [...KZ.siddur.services.map((s) => s.name), 'תפילה בגוף', 'מה עונים'];
    const ids = KZ.siddurTabIds ? KZ.siddurTabIds() : [];
    const sDone = ids.filter((id) => S.siddurTour && S.siddurTour[id] && S.siddurTour[id].done);
    const pr = S.practice || {};
    const prog = Object.values(pr.progress || {});
    const vTaam = prog.reduce((s, o) => s + Object.values(o || {}).filter((v) => v >= 1).length, 0);
    const vScroll = prog.reduce((s, o) => s + Object.values(o || {}).filter((v) => v >= 2).length, 0);
    const parts = Object.keys(pr.done || {}).length;
    const row = (label, value, pct, link) => `<div class="pd-learn">
        <div class="pd-learn__top"><span>${label}</span><b>${value}</b></div>
        ${pct === null ? '' : `<div class="bar bar--thin"><span style="width:${Math.round(pct * 100)}%"></span></div>`}
        ${link ? `<a class="small" href="${link.href}">${esc(link.label)}</a>` : ''}
      </div>`;
    return `<div class="card pd-learning">
      ${row('קורס הטעמים', `${cDone} מתוך ${L.length} שיעורים`, L.length ? cDone / L.length : 0, { href: '#/library/course', label: 'לקורס' })}
      ${row('מפת הסידור', `${sDone.length} מתוך ${ids.length} חלקים`, ids.length ? sDone.length / ids.length : 0, { href: '#/library/siddur', label: 'למפת הסידור' })}
      ${sDone.length ? `<div class="chips pd-chips">${sDone.map((id) => `<span class="tag tag--knowledge">✓ ${esc(tabs[ids.indexOf(id)] || id)}</span>`).join('')}</div>` : ''}
      ${row('תרגול מהפרשה', vTaam ? `${vTaam} פסוקים עם טעמים · ${vScroll} כמו בספר תורה` : 'עוד לא התחיל', null, { href: '#/library/practice', label: 'לתרגול' })}
      ${parts ? `<p class="small" style="margin:0">🏆 קרא ${parts === 1 ? 'קטע שלם אחד' : `${parts} קטעים שלמים`} כמו בספר תורה.</p>` : ''}
    </div>`;
  }

  function pillars() {
    return `<div class="pd-pillars">${Object.entries(KZ.pillars).map(([id, P]) => {
      const all = KZ.quests.filter((q) => q.pillar === id);
      const done = all.filter((q) => S.quests[q.id]);
      return `<div class="pillar-stat p-${id} pd-pillar">
        <span style="font-size:20px">${P.emoji}</span><strong>${esc(P.title)}</strong>
        <span class="num">${done.length}<small style="font-size:.9rem;font-weight:500"> / ${all.length}</small></span>
        ${done.length ? `<ul class="pd-qlist">${done.map((q) => `<li>${esc(q.title)}</li>`).join('')}</ul>` : ''}
      </div>`;
    }).join('')}</div>`;
  }

  function badges() {
    const got = KZ.badges.filter((b) => S.badges[b.id]);
    if (!got.length) return '<p class="muted">עוד אין הישגים.</p>';
    return `<div class="pd-badges">${got.map((b) => `<span class="pd-badge"><span class="badge-mini" aria-hidden="true">${b.icon}</span><span>${esc(b.name)}</span></span>`).join('')}</div>`;
  }

  KZ.views.parents = {
    title: 'להורים',
    render() {
      const la = lastActive();
      return `
        <header class="page-head">
          <span class="overline">להורים</span>
          <h1>איך ${esc(name())} מתקדם</h1>
          <p>תמונת מצב של המסע לבר מצווה, ורעיונות איך לעזור בכל תחנה.${la ? ` פעילות אחרונה: <b>${la}</b>.` : ''}</p>
        </header>
        <div class="note pd-privacy">🔒 כאן רואים רק את ההתקדמות. היומן, המכתב בקפסולת הזמן והמשפטים ש${esc(name())} כותב אחרי כל תחנה – שלו בלבד, ולא מוצגים כאן. אם ירצה, הוא יראה לכם.</div>
        <section class="section">${tiles()}</section>
        <section class="section">${bigDay()}</section>
        <section class="section">
          <div class="section-head"><h2>תחנות המסע</h2><a class="small" href="#/journey">למפת המסע</a></div>
          ${stations()}
        </section>
        <section class="section">
          <div class="section-head"><h2>לימוד</h2></div>
          ${learning()}
        </section>
        <section class="section">
          <div class="section-head"><h2>משימות בארבעת העולמות</h2><a class="small" href="#/quests">לכל המשימות</a></div>
          ${pillars()}
        </section>
        <section class="section">
          <div class="section-head"><h2>הישגים</h2></div>
          ${badges()}
        </section>
        <p class="note small">📱 ההתקדמות נשמרת רק במכשיר הזה. העמוד מראה את מה שנעשה במכשיר שבו הוא פתוח.</p>`;
    },
  };
})(window.KZ);
