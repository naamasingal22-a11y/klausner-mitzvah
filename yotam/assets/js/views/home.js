/* =========================================================
   home.js – דף הבית: הרימון, השלב, התחנה הבאה, משימת השבוע ופרשת השבוע
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
        <h3>מתי ${KZ.g('הבר מצווה', 'הבת מצווה', 'הבר מצווה')} שלי?</h3>
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

  // הצעד הבא – כרטיס אחד, לפי מפת המסע (התחנות הן אבני הדרך האישיות של יותם).
  // כשהתחנה הבאה היא קורס הטעמים – מראים בתוכה את השיעור הבא.
  function nextLessonHTML() {
    const L = KZ.courseLessons || [];
    const done = (S.course && S.course.done) || {};
    const i = L.findIndex((l) => !done[l.id]);
    if (i < 0) return '';
    const l = L[i];
    return `<div class="next-step__lesson"><span class="next-step__lesson-text">${l.emoji} <b>השיעור הבא (${i + 1} מתוך ${L.length}):</b> ${esc(l.title)}</span>
      <a class="btn btn--sm" href="#/library/course/${l.id}">${i === 0 ? 'להתחיל את השיעור' : 'להמשיך לשיעור'} ←</a></div>`;
  }
  function nextStepCard() {
    const list = KZ.journeyList ? KZ.journeyList().filter((a) => !a.me) : [];
    const k = list.findIndex((a) => !(S.checkins[a.id] || []).length);
    if (k < 0) {
      // כל התחנות מאחוריו – ממשיכים לתרגל את הפסוקים
      return `<div class="card next-step">
        <span class="overline">הצעד הבא שלך</span>
        <h3>⭐ עברת את כל התחנות! עכשיו – לתרגל את הפסוקים</h3>
        <p class="small">ממשיכים לקרוא את הקטע שלך, עד שהוא יוצא "כמו בספר תורה".</p>
        <div class="btn-row"><a class="btn btn--sm" href="#/library/practice">לתרגול ←</a><a class="btn btn--ghost btn--sm" href="#/library/reader">📜 קורא הפרשה</a></div>
      </div>`;
    }
    const a = list[k];
    return `<div class="card next-step">
      <span class="overline">הצעד הבא שלך · תחנה ${k + 1} מתוך ${list.length}</span>
      <div class="next-card"><div class="next-card__emoji" aria-hidden="true">${a.emoji}</div>
        <div><h3>${esc(a.title)}</h3><p class="small">${esc(a.kid)}</p></div></div>
      ${a.id === 'taamim' ? nextLessonHTML() : ''}
      <div class="btn-row">
        ${a.link && a.id !== 'taamim' ? `<a class="btn btn--sm" href="${a.link.href}">${esc(a.link.label)} ←</a>` : ''}
        <button class="btn btn--sm ${a.link && a.id !== 'taamim' ? 'btn--ghost' : ''}" data-act="open-station" data-id="${a.id}">✓ עברתי את התחנה</button>
        <a class="btn btn--ghost btn--sm" href="#/journey">🗺️ למפת המסע</a>
      </div>
    </div>`;
  }

  function weeklyCard() {
    const q = KZ.weeklyQuest && KZ.weeklyQuest();
    if (!q) return '';
    const P = KZ.pillars[q.pillar];
    const done = !!S.awards['weekly:' + KZ.isoWeek()];
    return `<button class="card card--link weekly quest" data-act="open-quest" data-id="${q.id}">
      <div class="quest__top"><span class="overline">⭐ משימת השבוע ${done ? '· הושלמה!' : ''}</span><span class="tag tag--seed">‎+${q.seeds} ועוד 10 בונוס</span></div>
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
    if (!got.length) return `<p class="muted">עוד אין הישגים – הראשון ממש קרוב. ${KZ.g('תתחיל', 'תתחילי', 'התחילו')} במשימה אחת!</p>`;
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
          <span class="hero__kicker">העולם של ${esc(KZ.firstName() || 'יותם')}</span>
          <h1>${greeting()}</h1>
          <hr class="hero__rule">
          <span class="hero__sub">בונים בר מצווה, בלוק אחר בלוק</span>
          <div class="level-card">
            <div class="level-card__top">
              <div class="level-name"><span>${lv.icon}</span>${esc(lv.name)}</div>
              <span class="tag tag--seed">${icon('seed')} ${n} בלוקים</span>
            </div>
            <div class="bar"><span style="width:${Math.round(lv.pct * 100)}%"></span></div>
            <div class="small muted" style="margin-top:6px">${lv.next ? `עוד <b>${lv.next.min - n}</b> בלוקים לשלב "${esc(lv.next.name)}" ${lv.next.icon}` : 'הרימון בנוי עד הסוף! איזה מסע 👑'}</div>
            <p>כל תחנה, משימה ומשחק מוסיפים בלוקים לרימון שלך – עד 613, כמו מספר המצוות.</p>
          </div>
          <div class="btn-row">
            <a class="btn btn--marker" href="#/quests">${icon('target')} למשימות</a>
            <a class="btn btn--ghost" href="#/journey">${icon('map')} למפת המסע</a>
          </div>
        </div>
        <div class="rimon-wrap">
          <span class="sticker sticker--goal">היעד: 613 🧱</span>
          ${KZ.rimonSVG(n, { animate: true })}
          <div class="rimon-count"><strong dir="ltr">${n} / 613</strong></div>
          <span class="doodle doodle--arrow" aria-hidden="true"><svg viewBox="0 0 70 60"><path d="M66 6c-18 0-40 6-50 30"/><path d="M8 40l8-6M8 40l11 4"/></svg></span>
          <span class="doodle doodle--stars" aria-hidden="true"><svg viewBox="0 0 46 46"><path d="M14 4v14M7 11h14M34 22v10M29 27h10M10 34l4 4M14 34l-4 4"/></svg></span>
        </div>
      </section>

      <section class="section">${nextStepCard()}</section>

      <section class="section grid-2">
        ${countdownCard()}
        <div class="card" id="parashaWeek">
          <span class="overline">פרשת השבוע</span>
          <div class="parasha-mini"><div class="parasha-mini__icon">${icon('scroll')}</div><div><span class="loading">טוען...</span></div></div>
        </div>
      </section>

      <section class="section">${weeklyCard()}</section>

      <section class="section">
        <div class="section-head"><h2>ארבעת העולמות שלי</h2><a href="#/quests" class="small">לכל המשימות</a></div>
        ${pillarsBlock()}
      </section>

      <section class="section grid-2">
        <div class="card">
          <div class="section-head"><h3 style="margin:0">ההישגים שלי</h3><a class="small" href="#/me">לכל ההישגים</a></div>
          ${badgesBlock()}
        </div>
        <div class="card">
          <h3>יש לך דקה?</h3>
          <p class="muted small">משחק קצר = עוד בלוקים ברימון.</p>
          <div class="btn-row">
            <a class="btn btn--tch btn--sm" href="#/games/taam">⛏️ כורים טעמים</a>
            <a class="btn btn--teal btn--sm" href="#/games/speed">📦 מיון לתיבות</a>
            <a class="btn btn--ghost btn--sm" href="#/games/order">🌉 בונים גשר</a>
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
