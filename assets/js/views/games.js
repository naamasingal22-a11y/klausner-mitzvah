/* =========================================================
   games.js – משחקים: טעם־מטרה, מפסיק או משרת, שרשרת טעמים,
   סדר בתפילה, חידון מושגים
   כל משחק נותן גרעינים עד 3 פעמים ביום (אחר כך – בשביל הכיף)
   ========================================================= */
(function (KZ) {
  'use strict';
  const { esc, icon, S } = KZ;
  const T = (id) => KZ.taamById(id);
  const DAILY = 3;

  const GAMES = [
    { id: 'taam', name: 'טעם־מטרה', emoji: '🎵', art: '◌֖', bg: 'var(--tch-soft)', desc: 'רואים טעם – מזהים אותו. 10 שאלות על 8 הטעמים הבסיסיים.', tag: 'טעמים' },
    { id: 'taam-adv', name: 'טעם־מטרה מתקדם', emoji: '🎼', art: '◌֒', bg: 'var(--plum-soft)', desc: 'כל הטעמים של התורה (חוץ מהנדירים מאוד). למי שכבר מרגיש/ה בבית.', tag: 'טעמים' },
    { id: 'speed', name: 'מפסיק או משרת?', emoji: '⚡', art: '⚡', bg: 'var(--honey-soft)', desc: '30 שניות. כמה טעמים תספיקו למיין – עוצרים או מחברים?', tag: 'טעמים' },
    { id: 'chain', name: 'שרשרת טעמים', emoji: '⛓️', art: '⛓️', bg: 'var(--teal-soft)', desc: 'מסדרים את משפחות הטעמים בסדר הנכון – ורואים אותן בפסוק אמיתי.', tag: 'טעמים' },
    { id: 'order', name: 'סדר בתפילה', emoji: '🧩', art: '🧩', bg: 'var(--pom-soft)', desc: 'מה בא קודם – ברכו או קריאת שמע? מסדרים תפילות, עלייה לתורה ועוד.', tag: 'סידור' },
    { id: 'words', name: 'חידון מושגים', emoji: '🔤', art: 'א', bg: 'var(--bg-2)', desc: 'מפטיר, הגבהה, חיוב... 10 שאלות על המילים של בית הכנסת.', tag: 'מושגים' },
  ];

  function rewardPlay(id, pts, label) {
    const g = S.games[id] = S.games[id] || { best: 0, plays: 0 };
    const today = KZ.todayISO();
    if (g.day !== today) { g.day = today; g.dayPlays = 0; }
    g.plays++; g.dayPlays++;
    KZ.save();
    if (pts > 0 && g.dayPlays <= DAILY) { KZ.award(`game:${id}:${today}:${g.dayPlays}`, pts, label); return pts; }
    return 0;
  }
  function setBest(id, score, extra = {}) {
    const g = S.games[id] = S.games[id] || { best: 0, plays: 0 };
    if (score > (g.best || 0)) g.best = score;
    Object.assign(g, extra);
    KZ.save(); KZ.checkBadges();
  }

  let timers = [];
  const later = (fn, ms) => { const t = setTimeout(fn, ms); timers.push(t); return t; };
  const clearTimers = () => { timers.forEach(clearTimeout); timers.forEach(clearInterval); timers = []; };

  /* ---------- מסכי פתיחה וסיום ---------- */
  function intro(stage, game, rules, start) {
    const g = S.games[game.id] || {};
    stage.innerHTML = `<div class="game-q">
      <div class="game-card__art" style="background:${game.bg};max-width:220px;margin:0 auto 12px">${game.art}</div>
      <h2 style="padding:0">${esc(game.name)}</h2><p class="muted">${esc(rules)}</p>
      ${g.best ? `<p class="small">🏆 השיא שלך: <b>${g.best}</b></p>` : ''}
      <button class="btn" data-go>יאללה! ▶</button></div>`;
    KZ.$('[data-go]', stage).addEventListener('click', start);
  }
  function outro(stage, game, score, max, pts, msg, again) {
    const g = S.games[game.id] || {};
    const capped = pts === 0 && (g.dayPlays || 0) > DAILY;
    if (score >= max * .8) KZ.confetti(70);
    stage.innerHTML = `<div class="game-q">
      <div class="score-big">${score}${max ? `<span style="font-size:1.4rem;color:var(--ink-3)">/${max}</span>` : ''}</div>
      <h2 style="padding:0;margin-top:8px">${esc(msg)}</h2>
      <p class="muted">${pts ? `‎+${pts} גרעינים לרימון 🌱` : capped ? 'הגעת למכסת הגרעינים היומית במשחק הזה – אבל אפשר להמשיך לשחק בשביל הכיף!' : ''}</p>
      <p class="small">🏆 השיא שלך: <b>${g.best || score}</b></p>
      <div class="btn-row" style="justify-content:center"><button class="btn" data-again>${icon('refresh')} עוד סיבוב</button><a class="btn btn--ghost" href="#/games">לכל המשחקים</a></div></div>`;
    KZ.$('[data-again]', stage).addEventListener('click', again);
  }
  const praise = (r) => (r >= 1 ? 'מושלם! 🤩' : r >= .8 ? 'מעולה!' : r >= .6 ? 'יפה מאוד!' : r >= .4 ? 'בדרך הנכונה' : 'כל התחלה קשה – שוב?');

  // תשובה נכונה – ממשיכים לבד. טעות – ההסבר נשאר עד שלוחצים "הבא"
  function afterAnswer(fbEl, ok, next, okDelay = 900) {
    if (ok) { later(next, okDelay); return; }
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'btn btn--sm'; b.textContent = 'הבנתי, הבא ←';
    b.style.marginTop = '12px';
    b.addEventListener('click', next, { once: true });
    fbEl.appendChild(document.createElement('br'));
    fbEl.appendChild(b);
    b.focus({ preventScroll: true });
  }

  /* ---------- 1. טעם־מטרה ---------- */
  function taamGame(stage, game, adv) {
    const pool = KZ.taamim.filter((t) => (adv ? t.level !== 'rare' : t.level === 'basic'));
    const N = 10;
    function start() {
      let i = 0, score = 0;
      const targets = Array.from({ length: N }, (_, k) => pool[(Math.floor(Math.random() * pool.length) + k) % pool.length]);
      KZ.shuffle(targets);
      function round() {
        if (i >= N) return end();
        const t = targets[i];
        const reverse = Math.random() < .3;
        const opts = KZ.shuffle([t, ...KZ.sample(pool.filter((x) => x.id !== t.id), 3)]);
        const ex = t.ex[Math.floor(Math.random() * t.ex.length)];
        stage.innerHTML = `
          <div class="game-hud"><span>שאלה ${i + 1}/${N}</span><span>✓ ${score}</span></div>
          <div class="bar bar--thin"><span style="width:${(i / N) * 100}%"></span></div>
          <div class="game-q">${reverse
            ? `<div class="prompt">איך נראה הטעם</div><div style="font-size:2.2rem;font-weight:800;margin:8px 0">${esc(t.name)}?</div>`
            : `<span class="glyph">${t.glyph}</span><div class="word">${esc(ex[0])}</div><div class="small faint">${esc(ex[1])}</div><div class="prompt" style="margin-top:8px">איזה טעם זה?</div>`}
            <div class="options">${opts.map((o) => `<button class="opt" data-id="${o.id}" ${reverse ? 'style="font-family:var(--font-text);font-size:2.4rem;line-height:1"' : ''}>${reverse ? o.glyph : esc(o.name)}</button>`).join('')}</div>
            <div class="fb-box" id="fb"></div>
          </div>`;
        let answered = false;
        KZ.$$('.opt', stage).forEach((b) => b.addEventListener('click', () => {
          if (answered) return; answered = true;
          const ok = b.dataset.id === t.id;
          if (ok) score++;
          b.classList.add(ok ? 'right' : 'wrong');
          if (!ok) KZ.$(`.opt[data-id="${t.id}"]`, stage).classList.add('right');
          const fb = KZ.$('#fb', stage);
          fb.classList.add(ok ? 'fb-box--ok' : 'fb-box--fix');
          fb.innerHTML = ok ? '✓ נכון!' : `<span class="fb-glyph">${t.glyph}</span> זה <b>${esc(t.name)}</b> (${esc(t.place)}).<br>${esc(t.looks)}<br>💡 ${esc(t.tip)}`;
          i++; afterAnswer(fb, ok, round, 800);
        }));
      }
      function end() {
        setBest(game.id, score);
        const pts = rewardPlay(game.id, score * (adv ? 3 : 2), game.name);
        outro(stage, game, score, N, pts, praise(score / N), start);
      }
      round();
    }
    intro(stage, game, adv ? '10 שאלות מכל טעמי התורה. לפעמים תראו את הסימן, ולפעמים את השם.' : '10 שאלות על 8 הטעמים הכי נפוצים: סוף פסוק, אתנחתא, טפחא, מרכא, מונח, זקף קטן, פשטא ומהפך.', start);
  }

  /* ---------- 2. מפסיק או משרת ---------- */
  function speedGame(stage, game) {
    const pool = KZ.taamim.filter((t) => t.level !== 'rare');
    function start() {
      let score = 0, wrong = 0, left = 30, t = null;
      stage.innerHTML = `<div class="game-hud"><span>⏱️ <b id="left">30</b> שניות</span><span>✓ <b id="sc">0</b></span></div>
        <div class="timer"><span id="tbar" style="width:100%"></span></div>
        <div class="game-q"><span class="glyph" id="g"></span><div style="font-size:1.5rem;font-weight:800" id="n"></div>
        <div class="speed-btns"><button class="opt" data-a="d">⏸️ מפסיק</button><button class="opt" data-a="c">🔗 משרת</button></div></div>`;
      const next = () => { t = pool[Math.floor(Math.random() * pool.length)]; KZ.$('#g', stage).textContent = t.glyph; KZ.$('#n', stage).textContent = t.name; };
      next();
      KZ.$$('[data-a]', stage).forEach((b) => b.addEventListener('click', () => {
        if (left <= 0) return;
        const ok = (b.dataset.a === 'd') === (t.rank !== 'servant');
        if (ok) score++; else wrong++;
        KZ.$('#sc', stage).textContent = score;
        b.classList.remove('right', 'wrong'); void b.offsetWidth; b.classList.add(ok ? 'right' : 'wrong');
        later(() => b.classList.remove('right', 'wrong'), 250);
        next();
      }));
      const iv = setInterval(() => {
        left--;
        const l = KZ.$('#left', stage); if (!l) { clearInterval(iv); return; }
        l.textContent = left; KZ.$('#tbar', stage).style.width = (left / 30 * 100) + '%';
        if (left <= 0) {
          clearInterval(iv);
          setBest(game.id, score);
          const pts = rewardPlay(game.id, Math.min(score, 20), game.name);
          outro(stage, game, score, 0, pts, score >= 15 ? 'ברק! ⚡' : score >= 10 ? 'מהיר/ה!' : 'עוד סיבוב ותשברו שיא', start);
        }
      }, 1000);
      timers.push(iv);
    }
    intro(stage, game, 'יש לכם 30 שניות. מופיע טעם – לחצו "מפסיק" אם הוא עוצר את הפסוק, או "משרת" אם הוא מחבר אל המילה הבאה.', start);
  }

  /* ---------- סידור לפי סדר (משותף לשרשרת ולתפילה) ---------- */
  function orderRound(stage, header, items, footer, onDone) {
    // items: [{key, html}] בסדר הנכון
    let pool = KZ.shuffle(items.map((x, i) => ({ ...x, i })));
    if (pool.every((x, k) => x.i === k) && pool.length > 1) pool = pool.reverse();
    let answer = [], firstTry = true;
    function draw(check) {
      stage.innerHTML = `${header}
        <div class="small muted" style="margin:10px 0 6px">${KZ.g('לחץ', 'לחצי', 'לחצו')} לפי הסדר (מימין לשמאל):</div>
        <div class="order-answer" aria-label="התשובה שלי">${answer.map((x, k) => `<button class="order-chip ${check ? (x.i === k ? 'ok' : 'bad') : ''}" data-a="${k}"><span class="n">${k + 1}</span>${x.html}</button>`).join('') || '<span class="faint small">...</span>'}</div>
        <div class="order-pool">${pool.map((x, k) => `<button class="order-chip" data-p="${k}">${x.html}</button>`).join('')}</div>
        <div id="ofb" style="min-height:2em;margin-top:8px"></div>`;
      KZ.$$('[data-p]', stage).forEach((b) => b.addEventListener('click', () => {
        answer.push(pool.splice(+b.dataset.p, 1)[0]);
        if (!pool.length) {
          const ok = answer.every((x, k) => x.i === k);
          draw(true);
          if (ok) { KZ.$('#ofb', stage).innerHTML = `<p><b>✓ ${firstTry ? 'מושלם!' : 'נכון!'}</b></p>${footer || ''}<button class="btn" data-next>הבא ←</button>`; KZ.$('[data-next]', stage).addEventListener('click', () => onDone(firstTry)); }
          else {
            firstTry = false;
            KZ.$('#ofb', stage).innerHTML = `<p class="small">כמעט! הירוקים במקום. <button class="btn btn--sm btn--ghost" data-retry>נסו שוב</button></p>`;
            KZ.$('[data-retry]', stage).addEventListener('click', () => {
              const keep = []; for (let k = 0; k < answer.length; k++) { if (answer[k].i === k && keep.length === k) keep.push(answer[k]); else break; }
              pool = KZ.shuffle(answer.slice(keep.length)); answer = keep; draw(false);
            });
          }
          return;
        }
        draw(false);
      }));
      KZ.$$('[data-a]', stage).forEach((b) => !check && b.addEventListener('click', () => { pool.push(answer.splice(+b.dataset.a, 1)[0]); draw(false); }));
    }
    draw(false);
  }

  /* ---------- 3. שרשרת טעמים ---------- */
  function chainGame(stage, game) {
    const groups = KZ.taamGroups.filter((g) => g.seq.length >= 2);
    function start() {
      const rounds = KZ.sample(groups, 6);
      let i = 0, perfect = 0;
      (function round() {
        if (i >= rounds.length) {
          setBest(game.id, perfect, perfect === rounds.length ? { perfect: true } : {});
          const pts = rewardPlay(game.id, perfect * 3, game.name);
          return outro(stage, game, perfect, rounds.length, pts, praise(perfect / rounds.length), start);
        }
        const g = rounds[i];
        const header = `<div class="game-hud"><span>שרשרת ${i + 1}/${rounds.length}</span><span>✓ ${perfect}</span></div><h3>${esc(g.name)}</h3>`;
        orderRound(stage, header, g.seq.map((id) => ({ key: id, html: `<span style="font-family:var(--font-text);font-size:1.4rem">${T(id).glyph}</span> ${esc(T(id).name)}` })),
          `<div class="group-card"><div class="verse" style="font-family:var(--font-text);font-size:1.7rem">${esc(g.verse)}</div><div class="small faint">${esc(g.ref)}</div></div>`,
          (ok) => { if (ok) perfect++; i++; round(); });
      })();
    }
    intro(stage, game, '6 משפחות טעמים, מבולגנות. סדרו כל אחת בסדר שבו היא מופיעה בפסוק – ותראו אותה בפסוק אמיתי מהתורה.', start);
  }

  /* ---------- 4. סדר בתפילה ---------- */
  function orderGame(stage, game) {
    function start() {
      const rounds = KZ.shuffle(KZ.siddur.orders).slice(0, 5).map((o) => {
        let seq = o.seq;
        if (seq.length > 6) { const keep = KZ.sample(seq.map((_, k) => k), 6).sort((a, b) => a - b); seq = keep.map((k) => o.seq[k]); }
        return { name: o.name, seq };
      });
      let i = 0, perfect = 0;
      (function round() {
        if (i >= rounds.length) {
          setBest(game.id, perfect, perfect === rounds.length ? { perfect: true } : {});
          const pts = rewardPlay(game.id, perfect * 3, game.name);
          return outro(stage, game, perfect, rounds.length, pts, praise(perfect / rounds.length), start);
        }
        const r = rounds[i];
        orderRound(stage, `<div class="game-hud"><span>סיבוב ${i + 1}/${rounds.length}</span><span>✓ ${perfect}</span></div><h3>${esc(r.name)}</h3>`,
          r.seq.map((s) => ({ key: s, html: esc(s) })), '', (ok) => { if (ok) perfect++; i++; round(); });
      })();
    }
    intro(stage, game, '5 סיבובים: תפילות, קריאת התורה ועוד. סדרו כל רשימה מההתחלה לסוף.', start);
  }

  /* ---------- 5. חידון מושגים ---------- */
  function wordsGame(stage, game) {
    const N = 10;
    function start() {
      const qs = KZ.sample(KZ.glossary, N);
      let i = 0, score = 0;
      (function round() {
        if (i >= N) {
          setBest(game.id, score);
          const pts = rewardPlay(game.id, score * 2, game.name);
          return outro(stage, game, score, N, pts, praise(score / N), start);
        }
        const q = qs[i];
        const opts = KZ.shuffle([q, ...KZ.sample(KZ.glossary.filter((x) => x !== q), 3)]);
        stage.innerHTML = `<div class="game-hud"><span>שאלה ${i + 1}/${N}</span><span>✓ ${score}</span></div>
          <div class="bar bar--thin"><span style="width:${(i / N) * 100}%"></span></div>
          <div class="game-q"><div class="prompt" style="font-weight:500;font-size:1.1rem">"${esc(q.d)}"</div><div class="small muted" style="margin-top:6px">על איזה מושג מדובר?</div>
          <div class="options">${opts.map((o, k) => `<button class="opt" data-k="${k}">${esc(o.t)}</button>`).join('')}</div>
          <div class="fb-box" id="fb"></div></div>`;
        let answered = false;
        KZ.$$('.opt', stage).forEach((b) => b.addEventListener('click', () => {
          if (answered) return; answered = true;
          const chosen = opts[+b.dataset.k];
          const ok = chosen === q;
          if (ok) score++;
          b.classList.add(ok ? 'right' : 'wrong');
          if (!ok) KZ.$(`.opt[data-k="${opts.indexOf(q)}"]`, stage).classList.add('right');
          const fb = KZ.$('#fb', stage);
          fb.classList.add(ok ? 'fb-box--ok' : 'fb-box--fix');
          fb.innerHTML = ok ? '✓ נכון!' : `התשובה: <b>${esc(q.t)}</b>.<br>ו"${esc(chosen.t)}" זה: ${esc(chosen.d)}`;
          i++; afterAnswer(fb, ok, round, 800);
        }));
      })();
    }
    intro(stage, game, '10 הגדרות – בחרו את המושג הנכון. כל התשובות נמצאות במילון המושגים.', start);
  }

  const RUN = { taam: (s, g) => taamGame(s, g, false), 'taam-adv': (s, g) => taamGame(s, g, true), speed: speedGame, chain: chainGame, order: orderGame, words: wordsGame };

  KZ.views.games = {
    title: (p) => (GAMES.find((g) => g.id === p[0]) || { name: 'משחקים' }).name,
    render([id]) {
      const game = GAMES.find((g) => g.id === id);
      if (game) {
        return `<nav class="crumbs"><a href="#/games">משחקים</a>${icon('chevL')}<span>${esc(game.name)}</span></nav>
          <div class="game-stage"><div class="card" id="stage"></div></div>`;
      }
      return `<header class="page-head"><span class="overline">לומדים בכיף</span><h1>משחקים</h1>
          <p>משחקים קצרים על טעמים, תפילה ומושגים. כל משחק ממלא את הרימון – עד ${DAILY} פעמים ביום בכל משחק. ויש תגים מיוחדים לשיאים!</p></header>
        <a class="card card--link weekly practice-promo" href="#/library/practice">
          <span class="sticker" style="--r:-4deg">חדש! ⭐</span>
          <h2 style="margin:10px 0 4px">תרגול מהפרשה שלי</h2>
          <p class="muted" style="margin:0">משחקי טעמים על הפסוקים ש${KZ.g('תקרא', 'תקראי', 'תקראו')} בעלייה: מפטיר, הפטרה או כל עלייה אחרת. ועוד מעקב קריאה פסוק אחרי פסוק, עד שזה יוצא "כמו בספר תורה".</p>
        </a>
        <div class="grid-3" style="margin-top:16px">${GAMES.map((g) => {
          const st = S.games[g.id] || {};
          return `<a class="card card--link game-card" href="#/games/${g.id}">
            <div class="game-card__art" style="background:${g.bg}">${g.art}</div>
            <div class="quest__top"><h3 style="margin:0">${g.emoji} ${esc(g.name)}</h3><span class="tag">${g.tag}</span></div>
            <p class="muted small" style="margin:0">${esc(g.desc)}</p>
            <div class="small faint">${st.best ? `🏆 שיא: ${st.best}` : 'עוד לא שיחקת'}${st.plays ? ` · ${st.plays} משחקים` : ''}</div>
          </a>`;
        }).join('')}</div>`;
    },
    mount(root, [id]) {
      const game = GAMES.find((g) => g.id === id);
      if (game) RUN[game.id](KZ.$('#stage', root), game);
    },
    unmount: clearTimers,
  };

  // כלים משותפים לתרגול מהפרשה (practice.js)
  KZ.gameKit = { rewardPlay, setBest, intro, outro, praise, later, clearTimers, afterAnswer };
})(window.KZ);
