/* =========================================================
   me.js – האזור האישי: פרופיל, תגים, יומן, אלבום הקהילה,
   קפסולת זמן וגיבוי
   ========================================================= */
(function (KZ) {
  'use strict';
  const { esc, icon, S } = KZ;
  const PROMPTS = ['מה הפתיע אותי השבוע?', 'על מה אני מודה היום?', 'משהו שאני גאה בו:', 'מישהו שעשה לי טוב השבוע:', 'שאלה שמעסיקה אותי:', 'מה הייתי רוצה לשאול את עצמי בעוד שנה?', 'רגע בבית הכנסת שנגע בי:'];
  // מדבקות: זווית וצבע קבועים לכל תג
  const STICKER_ROT = [-8, 5, -3, 9, -6, 3, 7, -10];
  const STICKER_BG = ['var(--marker)', '#FFC7D3', '#BDE7FA', '#C5F2E1', '#E3D6FA'];
  const COLORS = ['var(--teal)', 'var(--pom)', 'var(--tch)', 'var(--honey-deep)', 'var(--plum)'];

  function statsHTML() {
    const n = KZ.seeds(), lv = KZ.levelFor(n);
    const ci = Object.values(S.checkins).reduce((s, a) => s + a.length, 0);
    return `<div class="stat-row">
      <div class="stat"><b>${n}</b><span>גרעינים</span></div>
      <div class="stat"><b>${lv.icon}</b><span>${esc(lv.name)}</span></div>
      <div class="stat"><b>${KZ.quests.filter((q) => S.quests[q.id]).length}</b><span>אתגרים</span></div>
      <div class="stat"><b>${ci}</b><span>תחנות במסע</span></div>
    </div>`;
  }

  function capsuleHTML() {
    const C = S.capsule;
    const defaultOpen = (S.bm && S.bm.date) || '';
    if (C.sealedAt) {
      const open = C.openOn && KZ.todayISO() >= C.openOn;
      if (open) return `<div class="capsule kbox"><h3>💌 המכתב שכתבת לעצמך</h3><p class="small muted">נחתם ב־${KZ.fmtDate(new Date(C.sealedAt))}</p><p style="white-space:pre-wrap;font-size:1.05rem">${esc(C.text)}</p></div>`;
      const days = C.openOn ? KZ.daysBetween(new Date(), KZ.parseISO(C.openOn)) : null;
      return `<div class="capsule kbox capsule--sealed"><div class="lock">🔒</div><h3>המכתב חתום</h3>
        <p class="muted">${C.openOn ? `ייפתח ב־${KZ.fmtDate(C.openOn)} – עוד ${days} ימים.` : 'נחתם.'} אין הצצות 😉</p></div>`;
    }
    return `<form class="capsule kbox" id="capsuleForm"><h3>⏳ קפסולת זמן</h3>
      <p class="small muted">כתבו מכתב לעצמכם. אחרי החתימה הוא יינעל – ויפתח רק ביום שתבחרו (כדאי: יום הבר/בת מצווה).</p>
      <label class="field"><span>המכתב</span><textarea class="textarea" name="text" required style="min-height:160px" placeholder="היי אני מהעתיד... עכשיו אני בן/בת 12, ומה שהכי מעסיק אותי זה...">${esc(C.text || '')}</textarea></label>
      <label class="field"><span>מתי לפתוח?</span><input class="input" type="date" name="openOn" required value="${esc(C.openOn || defaultOpen)}" min="${KZ.todayISO()}" style="max-width:220px"></label>
      <button class="btn btn--tch" type="submit">${icon('lock')} חתימה ונעילה</button></form>`;
  }

  KZ.views.me = {
    title: 'האזור האישי',
    tab: 'me',
    render() {
      const p = S.profile;
      const prompt = PROMPTS[KZ.isoWeek() % PROMPTS.length];
      const badgesGot = KZ.badges.filter((b) => S.badges[b.id]).length;
      return `
        <header class="page-head"><span class="overline">רק שלך · נשמר במכשיר הזה</span><h1>האזור האישי</h1></header>
        <section class="card profile-card">
          <div class="avatar">${p.avatar || '🦉'}</div>
          <div style="flex:1;min-width:180px">
            <h2 style="margin:0">${esc(p.name || 'בלי שם עדיין')}</h2>
            <div class="muted small">${p.gender ? (p.gender === 'f' ? 'בת' : 'בן') : ''}${S.bm ? ` · ה${esc(S.bm.kind)}: ${esc(S.bm.parashaHe || KZ.fmtDate(S.bm.date))}` : ''}</div>
          </div>
          <button class="btn btn--ghost btn--sm" data-act="edit-profile">${icon('pen')} עריכה</button>
        </section>
        <section class="section">${statsHTML()}</section>

        <section class="section">
          <div class="section-head"><h2>התגים שלי</h2><span class="small muted">${badgesGot}/${KZ.badges.length}</span></div>
          <div class="badges">${KZ.badges.map((b, i) => `<button class="badge ${S.badges[b.id] ? '' : 'badge--locked'}" data-act="badge-info" data-id="${b.id}"><div class="badge__icon" style="--r:${STICKER_ROT[i % STICKER_ROT.length]}deg;--sb:${STICKER_BG[i % STICKER_BG.length]}">${S.badges[b.id] ? b.icon : '🔒'}</div><b>${esc(b.name)}</b></button>`).join('')}</div>
        </section>

        <section class="section" id="capsule">${capsuleHTML()}</section>

        <section class="section">
          <div class="section-head"><h2>אלבום הקהילה</h2><button class="btn btn--sm btn--soft" data-act="album-add">+ דמות</button></div>
          <p class="muted small">האנשים שפגשתם במסע: דמויות מהקהילה מהמפגשים, מראיונות ומבית הכנסת.</p>
          ${S.album.length ? `<div class="album">${S.album.map((a, i) => `<div class="album-card"><div class="ph" style="background:${COLORS[i % COLORS.length]}">${esc((a.name || '?').trim().charAt(0))}</div><b>${esc(a.name)}</b><small>${esc(a.role || '')}</small>${a.learned ? `<p>"${esc(a.learned)}"</p>` : ''}<small class="faint" style="margin-top:6px">${esc(a.activity || '')}</small></div>`).join('')}</div>`
            : `<div class="album-empty">🖼️ האלבום עוד ריק. בכל מפגש פוגשים דמות מהקהילה – אחרי המפגש, הוסיפו אותה בצ׳ק־אין.</div>`}
        </section>

        <section class="section">
          <div class="section-head"><h2>יומן המסע</h2><span class="small muted">${S.journal.length} רשומות</span></div>
          <form class="card card--flat" id="journalForm" style="margin-bottom:14px">
            <label class="field"><span>${esc(prompt)}</span><textarea class="textarea" name="text" required maxlength="2000"></textarea></label>
            <button class="btn btn--sm" type="submit">${icon('pen')} הוספה ליומן</button>
          </form>
          ${S.journal.length ? S.journal.map((j) => `<div class="journal-entry"><div class="when">${KZ.fmtDate(new Date(j.at))}</div><h4>${esc(j.title)}</h4><p>${esc(j.text)}</p></div>`).join('') : '<p class="muted">כאן יופיעו כל המחשבות שכתבתם באתגרים ובתחנות.</p>'}
        </section>

        <section class="section card card--flat">
          <h3>${icon('download')} גיבוי ושחזור</h3>
          <p class="small muted">כל ההתקדמות נשמרת רק בדפדפן הזה. כדאי לשמור קובץ גיבוי מדי פעם – ואפשר לטעון אותו במכשיר אחר.</p>
          <div class="btn-row">
            <button class="btn btn--sm btn--ghost" data-act="export">${icon('download')} שמירת קובץ גיבוי</button>
            <label class="btn btn--sm btn--ghost" style="cursor:pointer">${icon('upload')} טעינת גיבוי<input type="file" accept="application/json,.json" id="importFile" hidden></label>
            <button class="btn btn--sm btn--ghost" data-act="reset" style="color:var(--pom)">${icon('refresh')} התחלה מחדש</button>
          </div>
        </section>`;
    },
    mount(root, params) {
      if (params[0] === 'capsule') setTimeout(() => KZ.$('#capsule', root).scrollIntoView({ behavior: 'smooth' }), 50);
      const cf = KZ.$('#capsuleForm', root);
      if (cf) cf.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = cf.text.value.trim(); if (!text) return;
        KZ.modal(`<h2>לחתום את המכתב?</h2><p>אחרי החתימה אי אפשר יהיה לקרוא או לשנות אותו עד ${KZ.fmtDate(cf.openOn.value)}.</p>
          <div class="btn-row"><button class="btn btn--tch" data-seal>${icon('lock')} כן, לחתום</button><button class="btn btn--ghost" data-act="close-modal">עוד רגע</button></div>`, {
          onMount(m) {
            KZ.$('[data-seal]', m).addEventListener('click', () => {
              Object.assign(S.capsule, { text, openOn: cf.openOn.value, sealedAt: Date.now() });
              KZ.save(); KZ.closeModal();
              KZ.completeQuest('id-capsule');
              KZ.refresh();
            });
          },
        });
      });
      const jf = KZ.$('#journalForm', root);
      jf.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = jf.text.value.trim(); if (!text) return;
        KZ.addJournal(KZ.$('span', jf).textContent, text, 'free');
        KZ.award('journal:' + KZ.todayISO(), 5, 'כתיבה ביומן');
        KZ.checkBadges();
        KZ.refresh();
      });
      const imp = KZ.$('#importFile', root);
      imp.addEventListener('change', () => {
        const file = imp.files[0]; if (!file) return;
        const r = new FileReader();
        r.onload = () => {
          try { KZ.importState(JSON.parse(r.result)); KZ.updateChrome(); KZ.toast('הגיבוי נטען ✓'); KZ.refresh(); }
          catch (e) { KZ.toast('הקובץ הזה לא נראה כמו גיבוי של האתר'); }
        };
        r.readAsText(file);
      });
    },
  };

  KZ.actions['badge-info'] = (el) => {
    const b = KZ.badges.find((x) => x.id === el.dataset.id); if (!b) return;
    const got = S.badges[b.id];
    KZ.modal(`<div class="celebrate"><div class="celebrate__icon" style="${got ? '' : 'filter:grayscale(1);opacity:.5'}">${got ? b.icon : '🔒'}</div>
      <h2>${esc(b.name)}</h2><p>${esc(b.desc)}</p>
      <p class="muted small">${got ? `✓ נפתח ב־${KZ.fmtDate(new Date(got))}` : `איך משיגים: ${esc(b.hint)}`}</p></div>`);
  };

  KZ.actions['album-add'] = () => {
    KZ.modal(`<h2>דמות חדשה באלבום</h2>
      <form id="albumForm">
        <label class="field"><span>שם</span><input class="input" name="name" required maxlength="60"></label>
        <label class="field"><span>מי זה/זו? (תפקיד, קשר לקהילה)</span><input class="input" name="role" maxlength="80"></label>
        <label class="field"><span>משהו שלמדתי ממנו/ה</span><textarea class="textarea" name="learned" maxlength="400" style="min-height:80px"></textarea></label>
        <label class="field"><span>איפה נפגשנו?</span><input class="input" name="activity" maxlength="80" placeholder="בבית הכנסת, בקידוש, בטיול..."></label>
        <button class="btn btn--block" type="submit">הוספה לאלבום</button>
      </form>`, {
      onMount(m) {
        const f = KZ.$('#albumForm', m);
        f.addEventListener('submit', (e) => {
          e.preventDefault();
          const id = KZ.uid();
          S.album.unshift({ id, at: Date.now(), name: f.name.value.trim(), role: f.role.value.trim(), learned: f.learned.value.trim(), activity: f.activity.value.trim() });
          KZ.save(); KZ.closeModal();
          const manual = Object.keys(S.awards).filter((k) => k.startsWith('album:manual:')).length;
          if (manual < 12) KZ.award('album:manual:' + id, 10, 'דמות חדשה באלבום');
          else KZ.checkBadges();
          KZ.refresh();
        });
      },
    });
  };

  KZ.actions.export = () => {
    const blob = new Blob([JSON.stringify(S, null, 1)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `המסע-שלי-${(S.profile.name || 'גיבוי').replace(/\s+/g, '-')}-${KZ.todayISO()}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  };
  KZ.actions.reset = () => {
    KZ.modal(`<h2>להתחיל מחדש?</h2><p>כל הגרעינים, התגים, היומן והאלבום יימחקו מהמכשיר הזה. אם יש לכם קובץ גיבוי – אפשר יהיה לטעון אותו שוב.</p>
      <div class="btn-row"><button class="btn" data-yes style="background:var(--pom-deep)">כן, למחוק הכול</button><button class="btn btn--ghost" data-act="close-modal">ביטול</button></div>`, {
      onMount(m) { KZ.$('[data-yes]', m).addEventListener('click', () => { KZ.resetAll(); KZ.closeModal(); KZ.updateChrome(); KZ.go('#/'); KZ.openProfile(true); }); },
    });
  };
  KZ.actions['edit-profile'] = () => KZ.openProfile(false);
})(window.KZ);
