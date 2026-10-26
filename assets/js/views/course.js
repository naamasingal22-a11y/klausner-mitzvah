/* =========================================================
   course.js (view) – "לומדים טעמים": קורס צעד אחר צעד
   #/library/course        – רשימת השיעורים
   #/library/course/<id>   – שיעור: כרטיסים ואז בוחן קצר
   ההתקדמות נשמרת ב-S.course.done
   ========================================================= */
(function (KZ) {
  'use strict';
  const { esc, icon, S } = KZ;
  const T = (id) => KZ.taamById(id);
  const rankOf = (id) => KZ.taamRanks[T(id).rank];
  const isDisj = (id) => T(id).rank !== 'servant';
  const LESSONS = () => KZ.courseLessons;
  const C = () => { S.course = S.course || { done: {}, open: {} }; S.course.open = S.course.open || {}; return S.course; };
  const idxOf = (id) => LESSONS().findIndex((l) => l.id === id);
  const isDone = (l) => !!C().done[l.id];
  const isOpen = (i) => i === 0 || isDone(LESSONS()[i - 1]) || isDone(LESSONS()[i]) || !!C().open[LESSONS()[i].id];
  const passMark = (n) => n - 1; // מותר לטעות פעם אחת
  // כל הטעמים שנלמדו עד השיעור הזה (למסיחים בשאלות)
  const learnedUpTo = (i) => [...new Set(LESSONS().slice(0, i + 1).flatMap((l) => l.introduces))];

  /* ---------- רכיבי תצוגה ---------- */
  function glyphCards(ids) {
    return `<div class="c-glyphs">${ids.map((id) => `
      <button type="button" class="c-glyph ${rankOf(id).cls}" data-act="open-taam" data-id="${id}" title="עוד על ${esc(T(id).name)}">
        <span class="g">${T(id).glyph}</span><b>${esc(T(id).name)}</b><small>${isDisj(id) ? 'מפסיק' : 'משרת'}</small>
      </button>`).join('')}</div>`;
  }
  function seqHTML(seq) {
    return `<div class="seq c-seq">${seq.map((id) => `<span class="rank-pill ${rankOf(id).cls}"><span class="g">${T(id).glyph}</span>${esc(T(id).name)}</span>`).join('<span class="arrow">←</span>')}</div>`;
  }
  // פסוק עם הדגשה של טעמים נבחרים (או כולם)
  function verseHTML(vs, mode = 'full') {
    const all = vs.hl === 'all';
    const hl = Array.isArray(vs.hl) ? vs.hl : [];
    const toks = KZ.tokenize(vs.he);
    const present = [];
    const words = toks.map((t) => {
      if (t.type === 'paseq') return '<span class="paseq">׀</span> ';
      if (t.type !== 'word') return '';
      const on = t.id && (all || hl.includes(t.id));
      if (on && !present.includes(t.id)) present.push(t.id);
      const txt = mode === 'nikud' ? KZ.stripTaamim(t.text) : mode === 'scroll' ? KZ.stripAll(t.text) : t.text;
      const cls = on ? `cv-on ${rankOf(t.id).cls}` : (all || hl.length ? 'cv-dim' : '');
      return `<span class="cv-w ${cls}">${esc(txt)}</span>${t.joined && mode !== 'scroll' ? '' : ' '}`;
    }).join('');
    const legend = present.length && mode === 'full' ? `<div class="c-legend">${present.map((id) => `<span class="rank-pill ${rankOf(id).cls}"><span class="g">${T(id).glyph}</span>${esc(T(id).name)}</span>`).join('')}</div>` : '';
    return `<div class="c-verse ${mode === 'scroll' ? 'c-verse--scroll' : ''}">${words}</div><div class="small faint c-ref">${esc(vs.ref || '')}</div>${legend}`;
  }

  // "הקישו על המילה עם..."
  function bindFind(el, vs, target, onDone) {
    const toks = KZ.tokenize(vs.he);
    const groups = []; let cur = [];
    toks.forEach((t, i) => { if (t.type !== 'word') return; cur.push(i); if (!t.joined) { groups.push(cur); cur = []; } });
    if (cur.length) groups.push(cur);
    const has = (g) => g.some((ti) => toks[ti].id === target);
    el.innerHTML = `<div class="stop-verse c-find">${groups.map((g, gi) => `<span class="sw" data-g="${gi}" role="button" tabindex="0">${esc(g.map((ti) => toks[ti].text).join(''))}</span>`).join(' ')}</div><div class="small faint c-ref">${esc(vs.ref || '')}</div>`;
    let answered = false;
    const pick = (sw) => {
      if (answered) return; answered = true;
      const ok = has(groups[+sw.dataset.g]);
      sw.classList.add(ok ? 'right' : 'wrong');
      KZ.$$('.sw', el).forEach((x) => { if (has(groups[+x.dataset.g])) x.classList.add('right'); });
      onDone(ok);
    };
    KZ.$$('.sw', el).forEach((sw) => {
      sw.addEventListener('click', () => pick(sw));
      sw.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(sw); } });
    });
  }

  // סידור משפחה לפי הסדר
  function bindOrder(el, seq, onDone) {
    let pool = KZ.shuffle(seq.map((id, k) => ({ id, k })));
    if (pool.every((x, k) => x.id === seq[k]) && seq.length > 1) pool = pool.reverse();
    const answer = [];
    function draw(done) {
      el.innerHTML = `
        <div class="small muted" style="margin-bottom:6px">${KZ.g('לחץ', 'לחצי', 'לחצו')} על הטעמים לפי הסדר (מימין לשמאל):</div>
        <div class="order-answer">${answer.map((x, k) => `<span class="order-chip ${done ? (x.id === seq[k] ? 'ok' : 'bad') : ''}"><span class="n">${k + 1}</span><span class="g-inline">${T(x.id).glyph}</span> ${esc(T(x.id).name)}</span>`).join('') || '<span class="faint small">...</span>'}</div>
        ${done ? '' : `<div class="order-pool">${pool.map((x, k) => `<button type="button" class="order-chip" data-p="${k}"><span class="g-inline">${T(x.id).glyph}</span> ${esc(T(x.id).name)}</button>`).join('')}</div>`}`;
      if (done) return;
      KZ.$$('[data-p]', el).forEach((b) => b.addEventListener('click', () => {
        answer.push(pool.splice(+b.dataset.p, 1)[0]);
        if (!pool.length) {
          const ok = answer.every((x, k) => x.id === seq[k]);
          draw(true);
          if (!ok) el.insertAdjacentHTML('beforeend', `<div class="small muted" style="margin-top:8px">הסדר הנכון:</div>${seqHTML(seq)}`);
          onDone(ok);
        } else draw(false);
      }));
    }
    draw(false);
  }

  /* ---------- כרטיס בשיעור ---------- */
  function drawCard(box, c, onAnswered) {
    let html = c.title ? `<h2 class="c-title">${esc(c.title)}</h2>` : '';
    if (c.type === 'find' || c.type === 'order') {
      html += `<div class="c-task"><span class="sticker" style="--r:-3deg;font-size:1.05rem">משימה ✍️</span><p class="c-prompt">${esc(c.prompt)}</p><div id="cTask"></div><div class="fb-box" id="cFb"></div></div>`;
      box.innerHTML = html;
      const done = (ok) => {
        const fb = KZ.$('#cFb', box);
        fb.classList.add(ok ? 'fb-box--ok' : 'fb-box--fix');
        fb.innerHTML = `${ok ? '✓ נכון! ' : 'כמעט! '}${esc(c.explain || '')}`;
        onAnswered();
      };
      if (c.type === 'find') bindFind(KZ.$('#cTask', box), c.verse, c.target, done);
      else bindOrder(KZ.$('#cTask', box), c.seq, done);
      return false; // צריך לענות לפני "הבא"
    }
    if (c.text) html += `<div class="c-text">${c.text}</div>`;
    if (c.glyphs) html += glyphCards(c.glyphs);
    if (c.seq) html += seqHTML(c.seq);
    if (c.type === 'compare') {
      html += `<div class="c-compare">
        <div><span class="tag">בחומש – עם טעמים</span>${verseHTML({ ...c.verse, hl: 'all' })}</div>
        <div><span class="tag">רק ניקוד</span>${verseHTML(c.verse, 'nikud')}</div>
        <div><span class="tag">בספר התורה</span>${verseHTML(c.verse, 'scroll')}</div>
      </div>`;
    } else if (c.verse) html += verseHTML(c.verse);
    box.innerHTML = html;
    return true;
  }

  /* ---------- שאלה בבוחן ---------- */
  function drawQuestion(box, q, lessonIdx, onResult) {
    const kit = KZ.gameKit;
    let html = '';
    let options = null, correct = null;
    if (q.type === 'mc') {
      html = `<p class="c-prompt">${esc(q.q)}</p>`;
      options = q.options.map((o, k) => ({ key: String(k), label: esc(o) })); correct = String(q.answer);
    } else if (q.type === 'name') {
      const t = T(q.id);
      const pool = learnedUpTo(lessonIdx).filter((x) => x !== q.id);
      const fill = KZ.taamim.filter((x) => x.level !== 'rare' && x.id !== q.id && !pool.includes(x.id)).map((x) => x.id);
      const ids = KZ.shuffle([q.id, ...KZ.shuffle(pool).slice(0, 3), ...KZ.shuffle(fill)].slice(0, 4));
      html = `<div class="game-q" style="padding:8px 0"><span class="glyph">${t.glyph}</span><div class="word">${esc(t.ex[0][0])}</div><div class="small faint">${esc(t.ex[0][1])}</div></div><p class="c-prompt">איזה טעם זה?</p>`;
      options = KZ.shuffle(ids).map((id) => ({ key: id, label: esc(T(id).name) })); correct = q.id;
    } else if (q.type === 'cat') {
      const t = T(q.id);
      html = `<div class="game-q" style="padding:8px 0"><span class="glyph">${t.glyph}</span><div style="font-size:1.5rem;font-weight:800">${esc(t.name)}</div></div><p class="c-prompt">מפסיק או משרת?</p>`;
      options = [{ key: 'd', label: '⏸️ מפסיק – עוצר' }, { key: 'c', label: '🔗 משרת – מחבר' }]; correct = isDisj(q.id) ? 'd' : 'c';
    } else if (q.type === 'find' || q.type === 'order') {
      html = `<p class="c-prompt">${esc(q.prompt)}</p><div id="qTask"></div>`;
    }
    box.innerHTML = `${html}${options ? `<div class="options">${options.map((o) => `<button type="button" class="opt" data-k="${o.key}">${o.label}</button>`).join('')}</div>` : ''}<div class="fb-box" id="qFb"></div>`;
    const fb = KZ.$('#qFb', box);
    const finish = (ok, explain) => {
      fb.classList.add(ok ? 'fb-box--ok' : 'fb-box--fix');
      fb.innerHTML = ok ? '✓ נכון!' : explain;
      kit.afterAnswer(fb, ok, () => onResult(ok), 1000);
    };
    if (options) {
      let answered = false;
      KZ.$$('.opt', box).forEach((b) => b.addEventListener('click', () => {
        if (answered) return; answered = true;
        const ok = b.dataset.k === correct;
        b.classList.add(ok ? 'right' : 'wrong');
        if (!ok) KZ.$(`.opt[data-k="${CSS.escape(correct)}"]`, box).classList.add('right');
        let explain = esc(q.explain || '');
        if (q.type === 'name' || q.type === 'cat') { const t = T(q.id); explain = `<span class="fb-glyph">${t.glyph}</span> זה <b>${esc(t.name)}</b> – ${isDisj(q.id) ? 'מפסיק' : 'משרת'}, ${esc(t.place)}.<br>💡 ${esc(t.tip)}`; }
        finish(ok, explain);
      }));
    } else if (q.type === 'find') {
      bindFind(KZ.$('#qTask', box), q.verse, q.target, (ok) => finish(ok, esc(q.explain || '')));
    } else {
      bindOrder(KZ.$('#qTask', box), q.seq, (ok) => finish(ok, esc(q.explain || '')));
    }
  }

  /* ---------- עמוד הקורס ---------- */
  function overviewHTML() {
    const L = LESSONS();
    const done = L.filter(isDone).length;
    const nextIdx = L.findIndex((l) => !isDone(l));
    return `${KZ.libCrumbs('לומדים טעמים')}
      <header class="page-head"><span class="overline">קורס · ${L.length} שיעורים קצרים</span><h1>לומדים טעמים – צעד אחר צעד</h1>
        <p>מתחילים מאפס: מה הם הטעמים, איך הם מחלקים את הפסוק, ומשפחה אחרי משפחה – עד שמזהים כל טעם בתורה. כל שיעור לוקח כמה דקות, עם פסוקים אמיתיים, משימה ובוחן קצר. מסיימים שיעור – נפתח הבא.</p></header>
      <div class="card card--flat" style="margin-bottom:18px">
        <div class="section-head" style="margin:0"><strong>${done} מתוך ${L.length} שיעורים</strong>${done === L.length ? '<span class="sticker" style="--r:-3deg">🎓 סיימת את הקורס!</span>' : ''}</div>
        <div class="bar" style="margin-top:8px"><span style="width:${(done / L.length) * 100}%"></span></div>
      </div>
      <ol class="c-path">${L.map((l, i) => {
        const open = isOpen(i), d = isDone(l);
        const state = d ? 'done' : i === nextIdx ? 'next' : open ? 'open' : 'locked';
        const score = d ? C().done[l.id].score : null;
        return `<li class="c-step c-step--${state}">
          <span class="c-step__num">${d ? '✓' : i + 1}</span>
          <div class="card c-step__card">
            <div class="quest__top"><h3 style="margin:0">${l.emoji} ${esc(l.title)}</h3>${d ? `<span class="tag tag--ok">✓ ${score}/${l.quiz.length}</span>` : state === 'locked' ? '<span class="tag">🔒</span>' : state === 'next' ? '<span class="tag tag--need">הבא בתור</span>' : ''}</div>
            <p class="small muted" style="margin:4px 0 10px">${esc(l.goal)}</p>
            ${state === 'locked'
              ? `<span class="small faint">נפתח אחרי שיעור ${i}.</span> <button type="button" class="link-btn small" data-act="course-unlock" data-id="${l.id}">כבר ${KZ.g('יודע', 'יודעת', 'יודעים')}? לפתוח</button>`
              : `<a class="btn btn--sm ${state === 'next' ? 'btn--marker' : 'btn--ghost'}" href="#/library/course/${l.id}">${d ? 'לחזור על השיעור' : 'להתחיל'} ←</a>`}
          </div>
        </li>`;
      }).join('')}</ol>
      <p class="note">🎶 את המנגינות לומדים מהמורה או מהבעל/ת קורא/ת של הקהילה. בקורס לומדים לזהות את הטעמים ולהבין את מבנה הפסוק – וזה מה שעושה את לימוד המנגינה להרבה יותר קל.</p>`;
  }

  let st = null; // מצב השיעור הפתוח
  function lessonSkeleton(l, i) {
    return `${KZ.libCrumbs('לומדים טעמים')}
      <header class="page-head c-head"><span class="overline">שיעור ${i + 1} מתוך ${LESSONS().length}</span><h1>${l.emoji} ${esc(l.title)}</h1><p>${esc(l.goal)}</p></header>
      ${l.audio ? `<div class="card card--flat" style="margin-bottom:14px"><strong>🎵 הקשיבו לבעל/ת הקורא/ת:</strong><audio controls src="${esc(l.audio)}" style="width:100%;margin-top:8px"></audio></div>` : ''}
      <div class="c-dots" id="cDots"></div>
      <div class="card c-stage" id="cStage"></div>
      <div class="c-nav" id="cNav"></div>`;
  }

  function mountLesson(root, l, i) {
    st = { l, i, mode: 'learn', card: 0, q: 0, score: 0, answered: {} };
    const stage = KZ.$('#cStage', root), nav = KZ.$('#cNav', root), dots = KZ.$('#cDots', root);

    function drawDots() {
      const n = l.cards.length;
      dots.innerHTML = l.cards.map((_, k) => `<i class="${st.mode === 'learn' && k === st.card ? 'on' : (st.mode !== 'learn' || k < st.card) ? 'past' : ''}"></i>`).join('') + `<i class="quiz ${st.mode !== 'learn' ? 'on' : ''}" title="בוחן">✍️</i>`;
      dots.setAttribute('aria-label', st.mode === 'learn' ? `כרטיס ${st.card + 1} מתוך ${n}` : 'בוחן');
    }
    function learn() {
      st.mode = 'learn';
      const c = l.cards[st.card];
      const ready = drawCard(stage, c, () => { st.answered[st.card] = true; drawNav(true); });
      drawDots();
      drawNav(ready || !!st.answered[st.card]);
    }
    function drawNav(canNext) {
      const last = st.card === l.cards.length - 1;
      nav.innerHTML = `
        ${st.card > 0 ? `<button type="button" class="btn btn--ghost" data-nav="prev">→ הקודם</button>` : '<span></span>'}
        <button type="button" class="btn ${last ? 'btn--marker' : ''}" data-nav="next" ${canNext ? '' : 'disabled title="קודם עונים על המשימה"'}>${last ? '✍️ לבוחן הקצר' : 'הבא ←'}</button>`;
    }
    function quizIntro() {
      st.mode = 'quiz'; st.q = 0; st.score = 0;
      drawDots();
      stage.innerHTML = `<div class="center"><div class="notice-big__icon" style="font-size:44px;width:84px;height:84px">✍️</div>
        <h2 style="padding:0">בוחן קצר</h2><p class="muted">${l.quiz.length} שאלות. כדי לעבור צריך ${passMark(l.quiz.length)} תשובות נכונות. אחרי כל טעות יופיע הסבר.</p></div>`;
      nav.innerHTML = `<button type="button" class="btn btn--ghost" data-nav="back">→ חזרה לשיעור</button><button type="button" class="btn btn--marker" data-nav="startQuiz">יאללה ←</button>`;
    }
    function question() {
      nav.innerHTML = `<span class="small muted">שאלה ${st.q + 1} מתוך ${l.quiz.length}</span><span class="small">✓ ${st.score}</span>`;
      drawQuestion(stage, l.quiz[st.q], i, (ok) => {
        if (ok) st.score++;
        st.q++;
        if (st.q < l.quiz.length) question(); else result();
      });
    }
    function result() {
      const n = l.quiz.length, pass = st.score >= passMark(n);
      const next = LESSONS()[i + 1];
      if (pass) {
        const prev = C().done[l.id];
        C().done[l.id] = { at: Date.now(), score: Math.max(st.score, prev ? prev.score : 0) };
        KZ.save();
        KZ.confetti(90);
        KZ.award(`course:${l.id}`, 20, `שיעור ${i + 1}: ${l.title}`);
      }
      stage.innerHTML = `<div class="center">
        <div class="score-big">${st.score}<span style="font-size:1.4rem;color:var(--ink-3)">/${n}</span></div>
        <h2 style="padding:0;margin-top:8px">${pass ? (st.score === n ? 'מושלם! 🤩' : 'עברת! 🎉') : 'כמעט!'}</h2>
        <p class="muted">${pass ? (next ? `שיעור ${i + 2} נפתח: <b>${esc(next.title)}</b>` : 'סיימת את כל הקורס! עכשיו – לתרגל על הפרשה שלך.') : `צריך ${passMark(n)} תשובות נכונות כדי לעבור. אפשר לחזור על השיעור או לנסות שוב.`}</p></div>`;
      nav.innerHTML = pass
        ? `<a class="btn btn--ghost" href="#/library/course">כל השיעורים</a>${next ? `<a class="btn btn--marker" href="#/library/course/${next.id}">לשיעור הבא ←</a>` : `<a class="btn btn--marker" href="#/library/practice">לתרגול מהפרשה שלי ←</a>`}`
        : `<button type="button" class="btn btn--ghost" data-nav="back">→ חזרה לשיעור</button><button type="button" class="btn" data-nav="startQuiz">לנסות שוב</button>`;
    }

    nav.addEventListener('click', (e) => {
      const b = e.target.closest('[data-nav]'); if (!b || b.disabled) return;
      const a = b.dataset.nav;
      if (a === 'prev') { st.card--; learn(); }
      else if (a === 'next') { if (st.card < l.cards.length - 1) { st.card++; learn(); } else quizIntro(); }
      else if (a === 'startQuiz') { st.q = 0; st.score = 0; question(); }
      else if (a === 'back') { st.card = 0; learn(); }
      stage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
    learn();
  }

  KZ.libSections = KZ.libSections || {};
  KZ.libSections.course = {
    render([id]) {
      const i = idxOf(id);
      if (i < 0) return overviewHTML();
      if (!isOpen(i)) return `${overviewHTML()}`;
      return lessonSkeleton(LESSONS()[i], i);
    },
    mount(root, [id]) {
      const i = idxOf(id);
      if (i < 0 || !isOpen(i)) return;
      mountLesson(root, LESSONS()[i], i);
    },
    unmount() { if (KZ.gameKit) KZ.gameKit.clearTimers(); },
  };
  KZ.actions['course-unlock'] = (el) => { C().open[el.dataset.id] = true; KZ.save(); KZ.go('#/library/course/' + el.dataset.id); };
})(window.KZ);
