/* =========================================================
   quests.js – אתגרים לפי ארבעת הצירים + אתגר השבוע
   ========================================================= */
(function (KZ) {
  'use strict';
  const { esc, icon, S } = KZ;
  const COLORS = { identity: 'var(--honey)', social: 'var(--teal)', community: 'var(--pom)', knowledge: 'var(--tch)' };

  KZ.weeklyQuest = function () {
    const wk = KZ.isoWeek();
    if (!S.weekly || S.weekly.week !== wk || !KZ.quests.some((q) => q.id === S.weekly.id)) {
      const pool = KZ.quests.filter((q) => !S.quests[q.id] && !q.auto);
      const src = pool.length ? pool : KZ.quests.filter((q) => !q.auto);
      S.weekly = { week: wk, id: src[(wk * 7) % src.length].id };
      KZ.save();
    }
    return KZ.quests.find((q) => q.id === S.weekly.id);
  };

  const countOf = (q) => (S.quests[q.id] ? S.quests[q.id].count || 1 : 0);

  function questCard(q, weeklyId) {
    const n = countOf(q), max = q.repeat || 1, done = n > 0;
    return `<button class="card quest ${done ? 'quest--done' : ''} ${q.id === weeklyId ? 'quest--weekly' : ''}" data-act="open-quest" data-id="${q.id}">
      <span class="quest__bar" style="background:${COLORS[q.pillar]}"></span>
      <div class="quest__top">${KZ.pillarTag(q.pillar)}<span class="tag tag--seed">‎+${q.seeds}</span></div>
      <h3>${esc(q.title)}</h3>
      <p>${esc(q.desc)}</p>
      <div class="small faint">${q.id === weeklyId ? '⭐ אתגר השבוע · ' : ''}${max > 1 ? `${n}/${max} פעמים` : done ? 'בוצע ✓' : ''}</div>
    </button>`;
  }

  KZ.views.quests = {
    title: 'אתגרים',
    render([pillar]) {
      const weekly = KZ.weeklyQuest();
      const P = KZ.pillars[pillar];
      const list = KZ.quests.filter((q) => !P || q.pillar === pillar);
      const doneCount = KZ.quests.filter((q) => S.quests[q.id]).length;
      return `
        <header class="page-head">
          <span class="overline">${doneCount} מתוך ${KZ.quests.length} אתגרים</span>
          <h1>אתגרים</h1>
          <p>אתגרים קטנים לחיים האמיתיים – בבית, בקבוצה, בבית הכנסת ובשכונה. כל אתגר מוסיף גרעינים, ומה שכותבים נשמר ביומן שלכם (רק אצלכם).</p>
        </header>
        <div class="chips" role="toolbar" aria-label="סינון לפי ציר" style="margin-bottom:16px">
          <a class="chip ${!P ? 'active' : ''}" href="#/quests">הכול</a>
          ${Object.entries(KZ.pillars).map(([id, p]) => `<a class="chip ${pillar === id ? 'active' : ''}" href="#/quests/${id}">${p.emoji} ${p.name}</a>`).join('')}
        </div>
        ${P ? `<div class="pillar-head p-${pillar}"><span class="big">${P.emoji}</span><div><h2>${P.title}</h2><p style="margin:0">${esc(P.blurb)}</p></div></div>` : ''}
        <div class="grid-3">${list.map((q) => questCard(q, weekly && weekly.id)).join('')}</div>`;
    },
  };

  function openQuest(id) {
    const q = KZ.quests.find((x) => x.id === id); if (!q) return;
    const n = countOf(q), max = q.repeat || 1;
    const canDo = n < max && !q.auto;
    const isWeekly = KZ.weeklyQuest() && KZ.weeklyQuest().id === q.id;
    const prev = S.quests[q.id];
    const html = `
      <div class="chips" style="gap:6px">${KZ.pillarTag(q.pillar)}<span class="tag tag--seed">‎+${q.seeds} גרעינים</span>${isWeekly ? '<span class="tag tag--need">⭐ אתגר השבוע: ‎+10 בונוס</span>' : ''}</div>
      <h2 style="margin-top:10px">${esc(q.title)}</h2>
      <p>${esc(q.desc)}</p>
      ${q.link ? `<p><a class="btn btn--ghost btn--sm" href="${q.link.href}">${icon('book')} ${esc(q.link.label)}</a></p>` : ''}
      ${prev ? `<div class="note" style="margin-bottom:12px">✓ ${max > 1 ? `ביצעת ${n} מתוך ${max} פעמים` : 'ביצעת את האתגר'} · ${KZ.fmtDate(new Date(prev.at))}${prev.note ? `<br>"${esc(prev.note)}"` : ''}</div>` : ''}
      ${q.auto ? `<p class="note">האתגר הזה יסומן אוטומטית כשתחתמו את המכתב בקפסולת הזמן.</p>` : ''}
      ${canDo ? `<form id="questForm">
        ${q.album ? `
          <div class="figure-box"><h4>🖼️ כרטיס לאלבום הקהילה</h4>
            <div class="grid-2" style="gap:8px">
              <label class="field" style="margin:0"><span class="small">את מי ראיינתי?</span><input class="input" name="fname" required maxlength="60"></label>
              <label class="field" style="margin:0"><span class="small">מי זה/זו? (תפקיד, קשר לקהילה)</span><input class="input" name="frole" maxlength="80"></label>
            </div>
            <label class="field" style="margin:8px 0 0"><span class="small">הדבר הכי מעניין ששמעתי</span><textarea class="textarea" name="flearn" maxlength="400" style="min-height:70px"></textarea></label>
          </div>` : q.prompt ? `<label class="field"><span>${esc(q.prompt)}</span><textarea class="textarea" name="note" maxlength="1500" placeholder="כמה מילים מספיקות – זה נשמר ביומן שלך"></textarea></label>` : ''}
        <button class="btn btn--block" type="submit">${icon('check')} ${KZ.g('סיימתי', 'סיימתי', 'סיימנו')}! · ‎+${q.seeds}${isWeekly && !S.awards['weekly:' + KZ.isoWeek()] ? ' ‎+10' : ''}</button>
      </form>` : ''}`;
    KZ.modal(html, {
      onMount(m) {
        const f = KZ.$('#questForm', m); if (!f) return;
        f.addEventListener('submit', (e) => {
          e.preventDefault();
          const fd = new FormData(f);
          let note = (fd.get('note') || '').toString().trim();
          const fname = (fd.get('fname') || '').toString().trim();
          if (q.album && fname) {
            const learned = (fd.get('flearn') || '').toString().trim();
            S.album.unshift({ id: KZ.uid(), at: Date.now(), name: fname, role: (fd.get('frole') || '').toString().trim(), learned, activity: q.title });
            note = `ראיינתי את ${fname}${learned ? ': ' + learned : ''}`;
          }
          const count = n + 1;
          S.quests[q.id] = { at: Date.now(), note, count };
          if (note) KZ.addJournal(q.title, (q.prompt ? q.prompt + '\n' : '') + note, 'quest');
          KZ.save();
          KZ.closeModal();
          KZ.award(`quest:${q.id}:${count}`, q.seeds, q.title);
          if (isWeekly) KZ.award('weekly:' + KZ.isoWeek(), 10, 'בונוס אתגר השבוע');
          KZ.refresh();
        });
      },
    });
  }
  KZ.openQuest = openQuest;
  KZ.actions['open-quest'] = (el) => openQuest(el.dataset.id);

  // השלמה אוטומטית של אתגר (למשל קפסולת הזמן)
  KZ.completeQuest = function (id, note) {
    const q = KZ.quests.find((x) => x.id === id); if (!q || S.quests[id]) return;
    S.quests[id] = { at: Date.now(), note: note || '', count: 1 };
    KZ.save();
    KZ.award(`quest:${id}:1`, q.seeds, q.title);
  };
})(window.KZ);
