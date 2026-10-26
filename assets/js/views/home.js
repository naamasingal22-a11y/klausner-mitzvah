/* =========================================================
   home.js – דף הבית: הרימון, השלב, התחנה הבאה, אתגר השבוע ופרשת השבוע
   ========================================================= */
(function (KZ) {
  'use strict';
  const { esc, icon, S } = KZ;

  function greeting() {
    const name = KZ.firstName();
    const h = new Date().getHours();
    const part = h < 5 ? 'לילה טוב' : h < 12 ? 'בוקר טוב' : h < 17 ? 'צהריים טובים' : h < 21 ? 'ערב טוב' : 'לילה טוב';
    return name ? `${part}, ${esc(name)}!` : KZ.g('ברוך הבא למסע!', 'ברוכה הבאה למסע!', 'ברוכים הבאים למסע!');
  }

  function countdownCard() {
    const bm = S.bm;
    if (!bm || !bm.date) {
      return `<a class="card card--link" href="#/library/parasha">
        <span class="overline">היום הגדול</span>
        <h3>מתי ${KZ.g('הבר מצווה', 'הבת מצווה', 'הבר/בת מצווה')} שלי?</h3>
        <p class="muted small">הכניסו תאריך לידה – ונחשב את התאריך העברי, השבת והפרשה שלכם.</p>
        <span class="btn btn--sm btn--soft">${icon('calendar')} לחישוב</span></a>`;
    }
    const days = KZ.daysBetween(new Date(), KZ.parseISO(bm.shabbat || bm.date));
    const label = days > 0 ? `ימים ל${bm.kind}` : days === 0 ? 'היום! מזל טוב!' : `ימים מאז ה${bm.kind} 💛`;
    return `<a class="card card--link" href="#/library/parasha">
      <span class="overline">היום הגדול</span>
      <div class="countdown"><span class="countdown__num">${Math.abs(days)}</span><div><strong>${label}</strong><div class="muted small">${esc(bm.parashaHe || '')}${bm.shabbatHeb ? ' · ' + esc(bm.shabbatHeb) : ''}</div></div></div>
      ${bm.verified ? '' : '<span class="sticker" style="--r:-3deg;font-size:1.05rem;margin-top:12px">⚠️ לבדוק עם ההורים</span>'}
    </a>`;
  }

  function nextStationCard() {
    const list = KZ.journeyList ? KZ.journeyList() : [];
    const next = list.find((a) => !a.me && !a.future && !(S.checkins[a.id] || []).length);
    if (!next) return `<div class="card"><span class="overline">התחנה הבאה</span><h3>עברת את כל התחנות! 🎉</h3></div>`;
    return `<button class="card card--link station__card" data-act="open-station" data-id="${next.id}">
      <span class="overline">התחנה הבאה במסע</span>
      <div class="next-card"><div class="next-card__emoji">${next.emoji}</div>
      <div><h3 style="margin:0 0 4px">${esc(next.title)}</h3>
      <div class="muted small">${icon('calendar')} ${esc(next.date ? KZ.fmtDate(next.date) : next.when)}</div></div></div>
    </button>`;
  }

  function weeklyCard() {
    const q = KZ.weeklyQuest && KZ.weeklyQuest();
    if (!q) return '';
    const P = KZ.pillars[q.pillar];
    const done = !!S.awards['weekly:' + KZ.isoWeek()];
    return `<button class="card card--link weekly quest" data-act="open-quest" data-id="${q.id}">
      <div class="quest__top"><span class="overline">⭐ אתגר השבוע ${done ? '· בוצע!' : ''}</span><span class="tag tag--seed">‎+${q.seeds} ועוד 10 בונוס</span></div>
      <h3>${esc(q.title)}</h3>
      <p>${esc(q.desc)}</p>
      <div>${KZ.pillarTag(q.pillar)}</div>
    </button>`;
  }

  function pillarsBlock() {
    return `<div class="pillar-stats">${Object.entries(KZ.pillars).map(([id, P]) => {
      const total = KZ.quests.filter((q) => q.pillar === id).length;
      const done = KZ.quests.filter((q) => q.pillar === id && S.quests[q.id]).length;
      return `<a class="pillar-stat p-${id}" href="#/quests/${id}">
        <span style="font-size:22px">${P.emoji}</span>
        <strong>${P.title}</strong>
        <span class="num">${done}<small style="font-size:.9rem;font-weight:500"> / ${total}</small></span>
        <div class="bar bar--thin" style="margin-top:6px;background:rgba(255,255,255,.55)"><span style="width:${total ? (done / total) * 100 : 0}%;background:currentColor"></span></div>
      </a>`;
    }).join('')}</div>`;
  }

  function badgesBlock() {
    const got = KZ.badges.filter((b) => S.badges[b.id]).sort((a, b) => S.badges[b.id] - S.badges[a.id]);
    if (!got.length) return `<p class="muted">עוד אין תגים – הראשון ממש קרוב. ${KZ.g('תתחיל', 'תתחילי', 'התחילו')} באתגר אחד!</p>`;
    return `<div class="badge-row">${got.slice(0, 8).map((b) => `<span class="badge-mini" title="${esc(b.name)}">${b.icon}</span>`).join('')}</div>`;
  }

  KZ.views.home = {
    title: 'בית',
    render() {
      const n = KZ.seeds();
      const lv = KZ.levelFor(n);
      return `
      <section class="hero kbox">
        <div>
          <span class="hero__kicker">קהילת קלוזנר · ${KZ.program.year}</span>
          <h1>${greeting()}</h1>
          <hr class="hero__rule">
          <span class="hero__sub">המסע שלי ל${KZ.g('בר מצווה', 'בת מצווה', 'בר/בת מצווה')}</span>
          <div class="level-card">
            <div class="level-card__top">
              <div class="level-name"><span>${lv.icon}</span>${esc(lv.name)}</div>
              <span class="tag tag--seed">${icon('seed')} ${n} גרעינים</span>
            </div>
            <div class="bar"><span style="width:${Math.round(lv.pct * 100)}%"></span></div>
            <div class="small muted" style="margin-top:6px">${lv.next ? `עוד <b>${lv.next.min - n}</b> גרעינים לשלב "${esc(lv.next.name)}" ${lv.next.icon}` : 'הרימון מלא! איזה מסע 👑'}</div>
            <p>כל מפגש, אתגר ומשחק ממלאים את הרימון שלך בגרעינים – עד 613, כמו מספר המצוות.</p>
          </div>
          <div class="btn-row">
            <a class="btn btn--marker" href="#/quests">${icon('target')} לאתגרים</a>
            <a class="btn btn--ghost" href="#/journey">${icon('map')} למפת המסע</a>
          </div>
        </div>
        <div class="rimon-wrap">
          <span class="sticker sticker--goal">היעד: 613 🎯</span>
          ${KZ.rimonSVG(n, { animate: true })}
          <div class="rimon-count"><strong dir="ltr">${n} / 613</strong></div>
          <span class="doodle doodle--arrow" aria-hidden="true"><svg viewBox="0 0 70 60"><path d="M66 6c-18 0-40 6-50 30"/><path d="M8 40l8-6M8 40l11 4"/></svg></span>
          <span class="doodle doodle--stars" aria-hidden="true"><svg viewBox="0 0 46 46"><path d="M14 4v14M7 11h14M34 22v10M29 27h10M10 34l4 4M14 34l-4 4"/></svg></span>
        </div>
      </section>

      <section class="section grid-3">
        ${countdownCard()}
        ${nextStationCard()}
        <div class="card" id="parashaWeek">
          <span class="overline">פרשת השבוע</span>
          <div class="parasha-mini"><div class="parasha-mini__icon">${icon('scroll')}</div><div><span class="loading">טוען...</span></div></div>
        </div>
      </section>

      <section class="section">${weeklyCard()}</section>

      <section class="section">
        <div class="section-head"><h2>ארבעת הצירים שלי</h2><a href="#/quests" class="small">לכל האתגרים</a></div>
        ${pillarsBlock()}
      </section>

      <section class="section grid-2">
        <div class="card">
          <div class="section-head"><h3 style="margin:0">התגים שלי</h3><a class="small" href="#/me">לכל התגים</a></div>
          ${badgesBlock()}
        </div>
        <div class="card">
          <h3>יש לך דקה?</h3>
          <p class="muted small">משחק קצר = עוד גרעינים ברימון.</p>
          <div class="btn-row">
            <a class="btn btn--tch btn--sm" href="#/games/taam">🎵 טעם־מטרה</a>
            <a class="btn btn--teal btn--sm" href="#/games/speed">⚡ מפסיק או משרת</a>
            <a class="btn btn--ghost btn--sm" href="#/games/order">🧩 סדר בתפילה</a>
            <a class="btn btn--marker btn--sm" href="#/library/practice">⭐ תרגול מהפרשה שלי</a>
            <a class="btn btn--ghost btn--sm" href="#/library/course">🎓 לומדים טעמים</a>
          </div>
        </div>
      </section>`;
    },
    mount(root) {
      const box = KZ.$('#parashaWeek', root);
      KZ.thisWeek().then((r) => {
        if (!box.isConnected) return;
        const p = r.parasha;
        const hol = r.holidays.map((h) => h.hebrew).filter(Boolean);
        const title = p ? p.hebrew : (hol[0] || 'שבת חג');
        box.querySelector('.parasha-mini > div:last-child').innerHTML = `
          <h3 style="margin:0">${esc(title)}</h3>
          <div class="muted small">שבת ${esc(KZ.fmtDate(r.date, { day: 'numeric', month: 'long' }))} · ${esc(KZ.hebStr(KZ.parseISO(r.date)))}</div>
          ${p && p.leyning ? `<div class="btn-row" style="margin-top:8px"><a class="btn btn--sm btn--ghost" href="#/library/reader/date/${r.date}">לקריאה עם טעמים</a></div>` : ''}`;
      }).catch(() => {
        if (!box.isConnected) return;
        box.querySelector('.parasha-mini > div:last-child').innerHTML = `<span class="muted small">אין חיבור כרגע. נסו שוב מאוחר יותר.</span>`;
      });
    },
  };
})(window.KZ);
