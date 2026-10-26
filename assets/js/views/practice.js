/* =========================================================
   practice.js – תרגול מהפרשה שלי
   המשחקים בנויים מהפסוקים שהנער/ה יקרא/תקרא בעלייה (מפטיר, הפטרה או עלייה אחרת).
   אם עוד לא חושבה פרשה – מתרגלים על פרשת השבוע.
   1. זהו את הטעם – מילה מסומנת בתוך הפסוק
   2. איפה עוצרים? – הפסוק בלי טעמים, מוצאים את האתנחתא
   3. מעקב קריאה – פסוק אחרי פסוק, עם טעמים ואז כמו בספר תורה
   ========================================================= */
(function (KZ) {
  'use strict';
  const { esc, icon, S } = KZ;
  const T = (id) => KZ.taamById(id);
  // בלי סימני פרשה פתוחה/סתומה ({פ} {ס}) – לתצוגה
  const plain = (he) => he.replace(/\s*\{[פס]\}\s*/g, ' ').trim();
  const PART = { 1: 'ראשון', 2: 'שני', 3: 'שלישי', 4: 'רביעי', 5: 'חמישי', 6: 'שישי', 7: 'שביעי', maftir: 'מפטיר', haftarah: 'הפטרה' };
  const ORDER = ['maftir', 'haftarah', '1', '2', '3', '4', '5', '6', '7'];
  const MODES = [
    { id: 'taam', emoji: '🎯', name: 'זהו את הטעם', desc: 'מילה מסומנת מתוך הפסוקים שלכם – איזה טעם יש עליה?' },
    { id: 'stop', emoji: '⏸️', name: 'איפה עוצרים?', desc: 'הפסוק בלי טעמים, כמו בתיקון. מצאו את האתנחתא – העצירה באמצע.' },
    { id: 'track', emoji: '📖', name: 'מעקב קריאה', desc: 'פסוק אחרי פסוק: קודם עם טעמים, ואז כמו בספר תורה.' },
  ];
  let mode = 'taam';
  let partKey = null;

  const P = () => {
    if (!S.practice) S.practice = {};
    const p = S.practice;
    p.cache = p.cache || {}; p.progress = p.progress || {}; p.done = p.done || {};
    return p;
  };

  /* ---------- מקור הפסוקים ---------- */
  async function getSource() {
    if (S.bm && S.bm.leyning) return { mine: true, title: S.bm.parashaHe, leyning: S.bm.leyning };
    const r = await KZ.thisWeek();
    if (!r.parasha) throw new Error('holiday');
    return { mine: false, title: r.parasha.hebrew, leyning: r.parasha.leyning };
  }
  // נשמר במכשיר – כדי שהתרגול יעבוד גם בלי אינטרנט אחרי הפעם הראשונה
  async function loadVerses(ref) {
    const pr = P();
    if (pr.cache[ref]) return pr.cache[ref];
    const vs = await KZ.fetchVerses(ref);
    let lastCh = null;
    const out = vs.map((v) => {
      const label = (v.ch !== lastCh ? KZ.gematria(v.ch, false) + ', ' : '') + KZ.gematria(v.v, false);
      lastCh = v.ch;
      return { label, he: v.he };
    });
    const keys = Object.keys(pr.cache);
    if (keys.length >= 4) delete pr.cache[keys[0]];
    pr.cache[ref] = out;
    KZ.save();
    return out;
  }

  // מקבץ את חלקי המקף למילה אחת (לצורך לחיצה)
  function wordGroups(toks) {
    const groups = []; let cur = [];
    toks.forEach((t, i) => {
      if (t.type !== 'word') return;
      cur.push(i);
      if (!t.joined) { groups.push(cur); cur = []; }
    });
    if (cur.length) groups.push(cur);
    return groups;
  }

  /* ---------- 1. זהו את הטעם ---------- */
  function taamQuiz(stage, ctx) {
    const kit = KZ.gameKit;
    const game = { id: 'my-taam', name: `זהו את הטעם · ${ctx.part}`, bg: 'var(--marker-soft)', art: '🎯' };
    const items = [];
    ctx.verses.forEach((v, vi) => KZ.tokenize(v.he).forEach((t, ti) => { if (t.type === 'word' && t.id && T(t.id)) items.push({ vi, ti, id: t.id }); }));
    if (!items.length) { stage.innerHTML = '<p class="muted">לא מצאנו טעמים בקטע הזה.</p>'; return; }
    const present = [...new Set(items.map((x) => x.id))];
    const N = Math.min(10, items.length);

    function pick() {
      const out = [], cnt = {};
      for (const it of KZ.shuffle(items)) {
        if ((cnt[it.id] || 0) >= 2) continue;
        cnt[it.id] = (cnt[it.id] || 0) + 1; out.push(it);
        if (out.length >= N) break;
      }
      for (const it of KZ.shuffle(items)) { if (out.length >= N) break; if (!out.includes(it)) out.push(it); }
      return out;
    }
    function verseWithTarget(v, ti) {
      return KZ.tokenize(v.he).map((t, i) => (t.type === 'word'
        ? `<span class="${i === ti ? 'pq-target' : ''}">${esc(t.text)}</span>${t.joined ? '' : ' '}`
        : t.type === 'paseq' ? '<span class="paseq">׀</span> ' : '')).join('');
    }
    function options(id) {
      const others = KZ.shuffle(present.filter((x) => x !== id));
      const fill = KZ.shuffle(KZ.taamim.filter((t) => t.level !== 'rare' && t.id !== id && !others.includes(t.id)).map((t) => t.id));
      return KZ.shuffle([id, ...others.slice(0, 2), ...fill].slice(0, 4));
    }
    function start() {
      const qs = pick();
      let i = 0, score = 0;
      (function round() {
        if (i >= qs.length) {
          kit.setBest(game.id, score);
          const pts = kit.rewardPlay(game.id, score * 3, 'זהו את הטעם – מהפרשה שלי');
          return kit.outro(stage, game, score, qs.length, pts, kit.praise(score / qs.length), start);
        }
        const q = qs[i], v = ctx.verses[q.vi];
        const tok = KZ.tokenize(v.he)[q.ti];
        const opts = options(q.id);
        stage.innerHTML = `
          <div class="game-hud"><span>שאלה ${i + 1}/${qs.length}</span><span>✓ ${score}</span></div>
          <div class="bar bar--thin"><span style="width:${(i / qs.length) * 100}%"></span></div>
          <div class="game-q">
            <div class="pq-word">${esc(tok.text.replace(/־$/, ''))}</div>
            <div class="pq-verse">${verseWithTarget(v, q.ti)}</div>
            <div class="small faint">${esc(ctx.part)} · פסוק ${esc(v.label)}</div>
            <div class="prompt" style="margin-top:10px">איזה טעם יש על המילה המסומנת?</div>
            <div class="options">${opts.map((id) => `<button class="opt" data-id="${id}">${esc(T(id).name)}</button>`).join('')}</div>
            <div class="fb-box" id="fb"></div>
          </div>`;
        let answered = false;
        KZ.$$('.opt', stage).forEach((b) => b.addEventListener('click', () => {
          if (answered) return; answered = true;
          const ok = b.dataset.id === q.id;
          if (ok) score++;
          b.classList.add(ok ? 'right' : 'wrong');
          if (!ok) KZ.$(`.opt[data-id="${q.id}"]`, stage).classList.add('right');
          const t = T(q.id);
          const fb = KZ.$('#fb', stage);
          fb.classList.add(ok ? 'fb-box--ok' : 'fb-box--fix');
          fb.innerHTML = ok
            ? `✓ נכון! <span class="fb-glyph">${t.glyph}</span> <b>${esc(t.name)}</b>`
            : `<span class="fb-glyph">${t.glyph}</span> זה <b>${esc(t.name)}</b> (${esc(t.place)}).<br>${esc(t.looks)}<br>💡 ${esc(t.tip)}`;
          i++; kit.afterAnswer(fb, ok, round, 1200);
        }));
      })();
    }
    kit.intro(stage, game, `${N === 10 ? 'עשר' : N} מילים מתוך ה${ctx.part} שלכם. על כל מילה מסומנת – בחרו את הטעם שלה. ככה לומדים את הטעמים בדיוק במקומות שבהם תפגשו אותם בעלייה.`, start);
  }

  /* ---------- 2. איפה עוצרים? ---------- */
  function stopGame(stage, ctx) {
    const kit = KZ.gameKit;
    const game = { id: 'my-stop', name: `איפה עוצרים? · ${ctx.part}`, bg: 'var(--sky-soft)', art: '⏸️' };
    const pool = ctx.verses.map((v) => ({ v, toks: KZ.tokenize(v.he) })).filter((x) => x.toks.some((t) => t.id === 'etnachta'));
    if (!pool.length) { stage.innerHTML = '<p class="muted">בקטע הזה אין פסוקים עם אתנחתא. נסו קטע אחר.</p>'; return; }
    const N = Math.min(8, pool.length);
    function start() {
      const rounds = KZ.sample(pool, N);
      let i = 0, score = 0;
      (function round() {
        if (i >= rounds.length) {
          kit.setBest(game.id, score, score === rounds.length && rounds.length >= 3 ? { perfect: true } : {});
          const pts = kit.rewardPlay(game.id, score * 3, 'איפה עוצרים – מהפרשה שלי');
          return kit.outro(stage, game, score, rounds.length, pts, kit.praise(score / rounds.length), start);
        }
        const { v, toks } = rounds[i];
        const groups = wordGroups(toks);
        const hasEtn = (g) => g.some((ti) => toks[ti].id === 'etnachta');
        stage.innerHTML = `
          <div class="game-hud"><span>פסוק ${i + 1}/${rounds.length}</span><span>✓ ${score}</span></div>
          <div class="bar bar--thin"><span style="width:${(i / rounds.length) * 100}%"></span></div>
          <div class="game-q">
            <div class="prompt">איפה האתנחתא? ${KZ.g('הקש', 'הקישי', 'הקישו')} על המילה שבה הפסוק "נח" באמצע.</div>
            <div class="small faint" style="margin-bottom:8px">${esc(ctx.part)} · פסוק ${esc(v.label)} · בלי טעמים, כמו בתיקון</div>
            <div class="stop-verse">${groups.map((g, gi) => `<span class="sw" data-g="${gi}" role="button" tabindex="0">${esc(g.map((ti) => KZ.stripTaamim(toks[ti].text)).join(''))}</span>`).join(' ')}</div>
            <div id="stopFb"></div>
          </div>`;
        let answered = false;
        const answer = (el) => {
          if (answered) return; answered = true;
          const ok = hasEtn(groups[+el.dataset.g]);
          if (ok) score++;
          el.classList.add(ok ? 'right' : 'wrong');
          if (!ok) KZ.$(`.sw[data-g="${groups.findIndex(hasEtn)}"]`, stage).classList.add('right');
          const full = toks.map((t) => (t.type === 'word' ? esc(t.text) + (t.joined ? '' : ' ') : t.type === 'paseq' ? '׀ ' : '')).join('');
          KZ.$('#stopFb', stage).innerHTML = `
            <p style="margin-top:12px"><b>${ok ? '✓ בדיוק שם!' : 'כמעט – האתנחתא מסומנת בירוק.'}</b></p>
            <div class="small muted">כך זה נראה עם הטעמים:</div>
            <div class="reveal">${full}</div>
            <button class="btn" data-next style="margin-top:12px">הבא ←</button>`;
          KZ.$('[data-next]', stage).addEventListener('click', () => { i++; round(); });
        };
        KZ.$$('.sw', stage).forEach((el) => {
          el.addEventListener('click', () => answer(el));
          el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); answer(el); } });
        });
      })();
    }
    kit.intro(stage, game, `${N} פסוקים מה${ctx.part} שלכם, בלי טעמים – בדיוק כמו בתיקון. מצאו בכל פסוק את המילה עם האתנחתא: העצירה הגדולה באמצע. מי שיודע/ת איפה עוצרים – יודע/ת איפה לנשום.`, start);
  }

  /* ---------- 3. מעקב קריאה ---------- */
  function tracker(stage, ctx) {
    const pr = P();
    const prog = pr.progress[ctx.ref] = pr.progress[ctx.ref] || {};
    const N = ctx.verses.length;
    function draw() {
      const n1 = ctx.verses.filter((_, i) => (prog[i] || 0) >= 1).length;
      const n2 = ctx.verses.filter((_, i) => (prog[i] || 0) >= 2).length;
      stage.innerHTML = `
        <div class="section-head" style="margin-bottom:6px"><h3 style="margin:0">📖 ${esc(ctx.part)} · ${N} פסוקים</h3>
          <a class="small" href="#/library/reader">${icon('mic')} להקלטה בקורא הפרשה</a></div>
        <div class="small muted">עם טעמים: <b>${n1}/${N}</b> · כמו בספר תורה: <b>${n2}/${N}</b></div>
        <div class="bar" style="margin:8px 0 14px"><span style="width:${(n2 / N) * 100}%"></span></div>
        <p class="note small">קראו כל פסוק בקול. כשהוא יוצא חלק עם הטעמים – סמנו "✓ עם טעמים". אחר כך נסו אותו בלי כלום, כמו בספר התורה. ${pr.done[ctx.ref] ? '<b>🏆 סיימת את הקטע כולו!</b>' : ''}</p>
        ${ctx.verses.map((v, i) => {
          const l = prog[i] || 0;
          return `<div class="track-row lvl-${l}">
            <div class="track-text">${esc(plain(v.he))}</div>
            <div class="track-actions">
              <span class="vlabel">פסוק ${esc(v.label)}</span>
              <button class="btn btn--sm ${l >= 1 ? 'btn--soft' : 'btn--ghost'}" data-l1="${i}">${l >= 1 ? '✓' : ''} עם טעמים</button>
              <button class="btn btn--sm ${l >= 2 ? 'btn--soft' : 'btn--ghost'}" data-l2="${i}">${l >= 2 ? '🏆' : '📜'} כמו בספר תורה</button>
            </div>
          </div>`;
        }).join('')}`;
    }
    function setLevel(i, lvl) {
      prog[i] = Math.max(prog[i] || 0, lvl);
      KZ.save();
      KZ.award(`read:${ctx.ref}:${i}:${lvl}`, lvl === 2 ? 3 : 2, lvl === 2 ? 'פסוק כמו בספר תורה' : 'פסוק עם טעמים');
      if (!pr.done[ctx.ref] && ctx.verses.every((_, k) => (prog[k] || 0) >= 2)) {
        pr.done[ctx.ref] = Date.now(); KZ.save();
        KZ.award(`ready:${ctx.ref}`, 30, `ה${ctx.part} שלך מוכן!`);
      }
      const y = window.scrollY; draw(); window.scrollTo(0, y);
    }
    stage.addEventListener('click', (e) => {
      const b1 = e.target.closest('[data-l1]');
      if (b1) { setLevel(+b1.dataset.l1, 1); return; }
      const b2 = e.target.closest('[data-l2]');
      if (!b2) return;
      const i = +b2.dataset.l2, v = ctx.verses[i];
      KZ.modal(`<h2>פסוק ${esc(v.label)} – כמו בספר תורה</h2>
        <p class="muted">${KZ.g('קרא', 'קראי', 'קראו')} בקול, בלי ניקוד ובלי טעמים. ${KZ.g('נתקעת', 'נתקעת', 'נתקעתם')}? אפשר להציץ.</p>
        <div class="scroll-big" id="scrollTxt">${esc(KZ.stripAll(plain(v.he)))}</div>
        <div class="btn-row" style="margin-top:14px">
          <button class="btn btn--marker" data-ok>🏆 ${KZ.g('הצלחתי', 'הצלחתי', 'הצלחנו')}!</button>
          <button class="btn btn--ghost" data-peek>👀 הצצה לטעמים</button>
          <button class="btn btn--ghost" data-act="close-modal">עוד לא</button>
        </div>`, {
        onMount(m) {
          let peek = false;
          KZ.$('[data-peek]', m).addEventListener('click', () => {
            peek = !peek;
            KZ.$('#scrollTxt', m).textContent = peek ? plain(v.he) : KZ.stripAll(plain(v.he));
            KZ.$('#scrollTxt', m).style.fontFamily = peek ? 'var(--font-text)' : '';
          });
          KZ.$('[data-ok]', m).addEventListener('click', () => { KZ.closeModal(); setLevel(i, 2); });
        },
      });
    });
    draw();
  }

  const RUN = { taam: taamQuiz, stop: stopGame, track: tracker };

  /* ---------- העמוד ---------- */
  KZ.libSections = KZ.libSections || {};
  KZ.libSections.practice = {
    render() {
      return `${KZ.libCrumbs('תרגול מהפרשה שלי')}
        <header class="page-head"><span class="overline" id="prSrc">&nbsp;</span><h1>תרגול מהפרשה שלי</h1>
          <p>כאן מתרגלים על הפסוקים ש${KZ.g('תקרא', 'תקראי', 'תקראו')} בעלייה לתורה. ${KZ.g('בחר', 'בחרי', 'בחרו')} קטע ואופן תרגול.</p></header>
        <div id="prNotice"></div>
        <div class="small muted" style="margin-bottom:6px">איזה קטע?</div>
        <div class="chips" id="prParts" style="margin-bottom:14px"><span class="loading">טוען...</span></div>
        <div class="grid-3 practice-modes">${MODES.map((m) => `
          <button type="button" class="card practice-mode ${m.id === mode ? 'active' : ''}" data-pmode="${m.id}">
            <span class="pm-emoji">${m.emoji}</span><strong>${esc(m.name)}</strong><span class="small muted">${esc(m.desc)}</span>
          </button>`).join('')}</div>
        <div class="game-stage section"><div class="card" id="stage"><span class="loading">טוען את הפסוקים...</span></div></div>`;
    },
    async mount(root) {
      const stage = KZ.$('#stage', root), parts = KZ.$('#prParts', root), srcEl = KZ.$('#prSrc', root), notice = KZ.$('#prNotice', root);
      let src;
      try { src = await getSource(); } catch (e) {
        if (!stage.isConnected) return;
        parts.innerHTML = '';
        stage.innerHTML = `<p class="muted">${e.message === 'holiday' ? 'השבוע יש קריאה מיוחדת של חג.' : 'לא הצלחנו לטעון את הפרשה – בדקו את החיבור לאינטרנט.'} <a href="#/library/parasha">לחשב את הפרשה שלי</a></p>`;
        return;
      }
      if (!stage.isConnected) return;
      srcEl.textContent = src.mine ? `⭐ ${src.title} · הפרשה שלי` : `${src.title} · פרשת השבוע`;
      if (!src.mine) notice.innerHTML = `<p class="note">עוד אין לך פרשה שמורה, אז בינתיים מתרגלים על <b>פרשת השבוע</b>. <a href="#/library/parasha">לחישוב הפרשה שלי</a> – ומיד התרגול יעבור אליה.</p>`;
      else if (!S.bm.verified) notice.innerHTML = `<p class="note">⚠️ הפרשה עוד לא נבדקה עם ההורים. <a href="#/library/parasha">לבדיקה</a> – לפני שמשקיעים בתרגול 😉</p>`;
      if (!(S.course && S.course.done && Object.keys(S.course.done).length >= 3)) notice.insertAdjacentHTML('beforeend', `<p class="note">🎓 עוד לא ${KZ.g('מכיר', 'מכירה', 'מכירים')} את הטעמים? כדאי להתחיל ב<a href="#/library/course">קורס "לומדים טעמים"</a> – ואז לחזור לכאן.</p>`);
      const keys = ORDER.filter((k) => src.leyning[k]);
      if (!partKey || !src.leyning[partKey]) partKey = keys[0];
      const drawParts = () => { parts.innerHTML = keys.map((k) => `<button type="button" class="chip" data-part="${k}" aria-pressed="${k === partKey}">${PART[k]}${P().done[src.leyning[k]] ? ' 🏆' : ''}</button>`).join(''); };
      drawParts();

      let stageEl = stage;
      async function start() {
        KZ.gameKit.clearTimers();
        // לוח נקי בכל החלפה – בלי מאזינים שנשארו ממצב קודם
        const el = stageEl.cloneNode(false);
        stageEl.replaceWith(el); stageEl = el;
        const ref = src.leyning[partKey];
        el.innerHTML = `<span class="loading">טוען את ה${PART[partKey]}...</span>`;
        let verses;
        try { verses = await loadVerses(ref); } catch (e) {
          if (el.isConnected) el.innerHTML = `<p class="muted">לא הצלחנו לטעון את הפסוקים מספריא. בדקו את החיבור לאינטרנט ונסו שוב.</p>`;
          return;
        }
        if (!el.isConnected || el !== stageEl) return; // בינתיים בחרו משהו אחר
        RUN[mode](el, { ref, verses, part: PART[partKey] });
      }
      parts.addEventListener('click', (e) => {
        const b = e.target.closest('[data-part]'); if (!b) return;
        partKey = b.dataset.part; drawParts(); start();
      });
      KZ.$('.practice-modes', root).addEventListener('click', (e) => {
        const b = e.target.closest('[data-pmode]'); if (!b) return;
        mode = b.dataset.pmode;
        KZ.$$('[data-pmode]', root).forEach((x) => x.classList.toggle('active', x === b));
        start().then(() => stageEl.scrollIntoView({ behavior: 'smooth', block: 'start' }));
      });
      start();
    },
    unmount() { if (KZ.gameKit) KZ.gameKit.clearTimers(); },
  };
})(window.KZ);
