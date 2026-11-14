/* =========================================================
   games.js – משחקים בעולם הבלוקים: כורים טעמים, מיון לתיבות, בונים מגדל,
   בונים גשר וארגז הכלים. התוכן (השאלות וההסברים) – כמו באתר המקורי
   כל משחק נותן בלוקים עד 3 פעמים ביום (אחר כך – בשביל הכיף)
   ========================================================= */
(function (KZ) {
  'use strict';
  const { esc, icon, S } = KZ;
  const T = (id) => KZ.taamById(id);
  const DAILY = 3;

  const GAMES = [
    { id: 'taam', name: 'כורים טעמים', emoji: '⛏️', art: '◌֖', bg: 'var(--tch-soft)', desc: 'כל טעם שמזהים – בלוק שנכרה. 10 בלוקים, 8 הטעמים הבסיסיים.', tag: 'טעמים' },
    { id: 'taam-adv', name: 'כורים במעמקים', emoji: '💎', art: '◌֒', bg: 'var(--plum-soft)', desc: 'כל טעמי התורה (חוץ מהנדירים מאוד) – למי שכבר מכיר את המכרה.', tag: 'טעמים' },
    { id: 'speed', name: 'מיון לתיבות', emoji: '📦', art: '📦', bg: 'var(--honey-soft)', desc: '30 שניות. כל טעם הולך לתיבה שלו: מפסיקים או משרתים. כמה תספיק למיין?', tag: 'טעמים' },
    { id: 'chain', name: 'בונים מגדל', emoji: '🏰', art: '🏰', bg: 'var(--teal-soft)', desc: 'כל משפחת טעמים שמסדרים נכון – עוד קומה במגדל. ובסוף רואים אותה בפסוק אמיתי.', tag: 'טעמים' },
    { id: 'order', name: 'בונים גשר', emoji: '🌉', art: '🌉', bg: 'var(--pom-soft)', desc: 'חלקי התפילה הם קרשים – רק בסדר הנכון אפשר לחצות. תפילות, עלייה לתורה ועוד.', tag: 'סידור' },
    { id: 'words', name: 'ארגז הכלים', emoji: '🧰', art: '🧰', bg: 'var(--bg-2)', desc: 'מפטיר, הגבהה, חיוב... כל מושג שמזהים – עוד כלי בארגז של בית הכנסת.', tag: 'מושגים' },
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
      <p class="muted">${pts ? `‎+${pts} בלוקים לרימון 🧱` : capped ? 'הגעת למכסת הבלוקים היומית במשחק הזה – אבל אפשר להמשיך לשחק בשביל הכיף!' : ''}</p>
      <p class="small">🏆 השיא שלך: <b>${g.best || score}</b></p>
      <div class="btn-row" style="justify-content:center"><button class="btn" data-again>${icon('refresh')} עוד סיבוב</button><a class="btn btn--ghost" href="#/games">לכל המשחקים</a></div></div>`;
    KZ.$('[data-again]', stage).addEventListener('click', again);
  }
  const praise = (r) => (r >= 1 ? 'מושלם! 🤩' : r >= .8 ? 'מעולה!' : r >= .6 ? 'יפה מאוד!' : r >= .4 ? 'בדרך הנכונה' : 'כל התחלה קשה – שוב?');
  // הודעות סיום בשפה של כל משחק
  const minePraise = (r, n, max) => (r >= 1 ? 'מכרה שלם! 💎' : r >= .8 ? `כורה מקצוען! כרית ${n} מתוך ${max}` : r >= .6 ? `חפירה טובה – ${n} בלוקים` : r >= .4 ? `כרית ${n} בלוקים. עוד קצת לעומק!` : 'כל כורה מתחיל מהשכבה העליונה – שוב?');
  const boxPraise = (r) => (r >= 1 ? 'ארגז מלא! 🧰' : r >= .8 ? 'ארגז כמעט מלא!' : r >= .6 ? 'יש כבר הרבה כלים בארגז' : r >= .4 ? 'הארגז מתמלא' : 'ארגז ריק? עוד סיבוב!');

  // שורת בלוקים במקום פס התקדמות: נכרה (נכון), נסדק (טעות), הבא בתור
  const blockRow = (res, n, i) => `<div class="blk-row" aria-hidden="true">${Array.from({ length: n }, (_, k) => `<i class="blk ${res[k] === true ? 'blk--ok' : res[k] === false ? 'blk--bad' : k === i ? 'blk--cur' : ''}"></i>`).join('')}</div>`;
  const markCur = (stage, ok) => { const c = KZ.$('.blk--cur', stage); if (c) c.className = `blk ${ok ? 'blk--ok' : 'blk--bad'}`; };
  // מגדל (קומה לכל סיבוב) וגשר (קרש לכל סיבוב): אבן – בלי טעות, עץ – אחרי תיקון
  const towerHTML = (done, n) => `<div class="tower" aria-hidden="true">${Array.from({ length: n }, (_, k) => `<i class="tw ${done[k] === true ? 'tw--ok' : done[k] === false ? 'tw--fix' : k === done.length ? 'tw--cur' : ''}"></i>`).join('')}</div>`;
  const bridgeHTML = (done, n) => `<div class="bridge" aria-hidden="true">${Array.from({ length: n }, (_, k) => `<i class="br ${done[k] === true ? 'br--ok' : done[k] === false ? 'br--fix' : k === done.length ? 'br--cur' : ''}"></i>`).join('')}</div>`;

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
      const res = [];
      const targets = Array.from({ length: N }, (_, k) => pool[(Math.floor(Math.random() * pool.length) + k) % pool.length]);
      KZ.shuffle(targets);
      function round() {
        if (i >= N) return end();
        const t = targets[i];
        const reverse = Math.random() < .3;
        const opts = KZ.shuffle([t, ...KZ.sample(pool.filter((x) => x.id !== t.id), 3)]);
        const ex = t.ex[Math.floor(Math.random() * t.ex.length)];
        stage.innerHTML = `
          <div class="game-hud"><span>בלוק ${i + 1}/${N}</span><span>⛏️ ${score}</span></div>
          ${blockRow(res, N, i)}
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
          fb.innerHTML = ok ? '⛏️ נכרה! ✓' : `💥 הבלוק נסדק. <span class="fb-glyph">${t.glyph}</span> זה <b>${esc(t.name)}</b> (${esc(t.place)}).<br>${esc(t.looks)}<br>💡 ${esc(t.tip)}`;
          res.push(ok); markCur(stage, ok);
          i++; afterAnswer(fb, ok, round, 800);
        }));
      }
      function end() {
        setBest(game.id, score);
        const pts = rewardPlay(game.id, score * (adv ? 3 : 2), game.name);
        outro(stage, game, score, N, pts, minePraise(score / N, score, N), start);
      }
      round();
    }
    intro(stage, game, adv ? 'יורדים למעמקים: 10 בלוקים מכל טעמי התורה. לפעמים תראה את הסימן, ולפעמים את השם. זיהוי נכון – הבלוק נכרה. טעות – הוא נסדק, ומקבלים הסבר.' : '10 בלוקים במכרה, ובכל אחד מסתתר טעם: סוף פסוק, אתנחתא, טפחא, מרכא, מונח, זקף קטן, פשטא או מהפך. זיהוי נכון – הבלוק נכרה. טעות – הוא נסדק, ומקבלים הסבר.', start);
  }

  /* ---------- 2. מפסיק או משרת ---------- */
  function speedGame(stage, game) {
    const pool = KZ.taamim.filter((t) => t.level !== 'rare');
    function start() {
      let score = 0, wrong = 0, left = 30, t = null;
      stage.innerHTML = `<div class="game-hud"><span>⏱️ <b id="left">30</b> שניות</span><span>📦 <b id="sc">0</b></span></div>
        <div class="timer"><span id="tbar" style="width:100%"></span></div>
        <div class="game-q"><span class="glyph" id="g"></span><div style="font-size:1.5rem;font-weight:800" id="n"></div>
        <div class="speed-btns"><button class="opt chest" data-a="d">📦 תיבת המפסיקים<small>עוצר את הפסוק</small></button><button class="opt chest" data-a="c">📦 תיבת המשרתים<small>מחבר למילה הבאה</small></button></div></div>`;
      const next = () => { t = pool[Math.floor(Math.random() * pool.length)]; KZ.$('#g', stage).textContent = t.glyph; KZ.$('#n', stage).textContent = t.name; };
      next();
      KZ.$$('[data-a]', stage).forEach((b) => b.addEventListener('click', () => {
        if (left <= 0) return;
        const ok = (b.dataset.a === 'd') === (t.rank !== 'servant');
        if (ok) score++; else wrong++;
        KZ.$('#sc', stage).textContent = Math.max(0, score - wrong); // טעות מורידה נקודה, כדי שלחיצות אקראיות לא ישתלמו
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
          const net = Math.max(0, score - wrong);
          setBest(game.id, net);
          const pts = rewardPlay(game.id, Math.min(net, 20), game.name);
          outro(stage, game, net, 0, pts, net >= 15 ? 'ממיין כמו מכונה! ⚡' : net >= 10 ? 'מהיר! התיבות מתמלאות' : 'עוד סיבוב ותשבור שיא', start);
        }
      }, 1000);
      timers.push(iv);
    }
    intro(stage, game, 'יש לך 30 שניות. מופיע טעם – שלח אותו לתיבה הנכונה: "מפסיקים" אם הוא עוצר את הפסוק, "משרתים" אם הוא מחבר למילה הבאה. כל טעות מוציאה פריט מהתיבה, אז עדיף לחשוב שנייה.', start);
  }

  /* ---------- סידור לפי סדר (משותף לשרשרת ולתפילה) ---------- */
  function orderRound(stage, header, items, footer, onDone, nextLabel = 'הבא ←') {
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
          if (ok) { KZ.$('#ofb', stage).innerHTML = `<p><b>✓ ${firstTry ? 'מושלם!' : 'נכון!'}</b></p>${footer || ''}<button class="btn" data-next>${nextLabel}</button>`; KZ.$('[data-next]', stage).addEventListener('click', () => onDone(firstTry)); }
          else {
            firstTry = false;
            KZ.$('#ofb', stage).innerHTML = `<p class="small">כמעט! הירוקים במקום. <button class="btn btn--sm btn--ghost" data-retry>נסה שוב</button></p>`;
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
      const done = [];
      (function round() {
        if (i >= rounds.length) {
          setBest(game.id, perfect, perfect === rounds.length ? { perfect: true } : {});
          const pts = rewardPlay(game.id, perfect * 3, game.name);
          return outro(stage, game, perfect, rounds.length, pts, perfect === rounds.length ? 'מגדל מושלם! 🏰' : `בנית מגדל של ${rounds.length} קומות – ${perfect} מהן בלי טעות`, start);
        }
        const g = rounds[i];
        const header = `<div class="game-hud"><span>קומה ${i + 1}/${rounds.length}</span><span>🏰 ${perfect}</span></div>${towerHTML(done, rounds.length)}<h3>${esc(g.name)}</h3>`;
        orderRound(stage, header, g.seq.map((id) => ({ key: id, html: `<span style="font-family:var(--font-text);font-size:1.4rem">${T(id).glyph}</span> ${esc(T(id).name)}` })),
          `<div class="group-card"><div class="verse" style="font-family:var(--font-text);font-size:1.7rem">${esc(g.verse)}</div><div class="small faint">${esc(g.ref)}</div></div>`,
          (ok) => { if (ok) perfect++; done.push(ok); i++; round(); }, 'לקומה הבאה ←');
      })();
    }
    intro(stage, game, 'בונים מגדל של 6 קומות. בכל קומה – משפחת טעמים מבולגנת: סדר אותה כמו שהיא מופיעה בפסוק, ותראה אותה בפסוק אמיתי מהתורה. בלי טעות – קומת אבן. אחרי תיקון – קומת עץ.', start);
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
      const done = [];
      (function round() {
        if (i >= rounds.length) {
          setBest(game.id, perfect, perfect === rounds.length ? { perfect: true } : {});
          const pts = rewardPlay(game.id, perfect * 3, game.name);
          return outro(stage, game, perfect, rounds.length, pts, perfect === rounds.length ? 'הגשר שלם וחזק! 🌉' : `הגשר בנוי – ${perfect} קטעים בלי טעות מתוך ${rounds.length}`, start);
        }
        const r = rounds[i];
        orderRound(stage, `<div class="game-hud"><span>קטע ${i + 1}/${rounds.length}</span><span>🌉 ${perfect}</span></div>${bridgeHTML(done, rounds.length)}<h3>${esc(r.name)}</h3>`,
          r.seq.map((s) => ({ key: s, html: esc(s) })), '', (ok) => { if (ok) perfect++; done.push(ok); i++; round(); }, 'לקטע הבא ←');
      })();
    }
    intro(stage, game, 'בונים גשר של 5 קטעים: תפילות, קריאת התורה ועוד. בכל קטע – סדר את החלקים מההתחלה לסוף, כמו קרשים. בלי טעות – קרש אבן. אחרי תיקון – קרש עץ.', start);
  }

  /* ---------- 5. חידון מושגים ---------- */
  function wordsGame(stage, game) {
    const N = 10;
    function start() {
      const qs = KZ.sample(KZ.glossary, N);
      let i = 0, score = 0;
      const res = [];
      (function round() {
        if (i >= N) {
          setBest(game.id, score);
          const pts = rewardPlay(game.id, score * 2, game.name);
          return outro(stage, game, score, N, pts, boxPraise(score / N), start);
        }
        const q = qs[i];
        const opts = KZ.shuffle([q, ...KZ.sample(KZ.glossary.filter((x) => x !== q), 3)]);
        stage.innerHTML = `<div class="game-hud"><span>כלי ${i + 1}/${N}</span><span>🧰 ${score}</span></div>
          ${blockRow(res, N, i)}
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
          fb.innerHTML = ok ? '🧰 נכנס לארגז! ✓' : `זה לא הכלי הנכון. התשובה: <b>${esc(q.t)}</b>.<br>ו"${esc(chosen.t)}" זה: ${esc(chosen.d)}`;
          res.push(ok); markCur(stage, ok);
          i++; afterAnswer(fb, ok, round, 800);
        }));
      })();
    }
    intro(stage, game, '10 הגדרות של מילים מבית הכנסת. בחר את המושג הנכון – והוא נכנס לארגז הכלים שלך. כל התשובות נמצאות במילון המושגים.', start);
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
      return `<header class="page-head"><span class="overline">כורים, ממיינים ובונים</span><h1>משחקים</h1>
          <p>משחקים קצרים על טעמים, תפילה ומושגים. כל משחק מוסיף בלוקים לרימון – עד ${DAILY} פעמים ביום בכל משחק. ויש תגים מיוחדים לשיאים!</p></header>
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
