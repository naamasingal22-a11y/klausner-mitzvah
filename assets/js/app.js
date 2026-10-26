/* =========================================================
   app.js – הפעלה: ניווט, הרשמה ראשונה ועריכת פרופיל
   ========================================================= */
(function (KZ) {
  'use strict';
  const { esc, icon, S } = KZ;
  const AVATARS = ['🦉', '🦁', '🦊', '🐢', '🐬', '🦋', '🐝', '🦄', '🐼', '🐙', '🐳', '🦒', '🌻', '🌟', '🔥', '🌈', '🍉', '🎧', '🎨', '🎸', '⚽', '🏀', '📚', '🚀'];

  // חלון הרשמה / עריכת פרופיל (3 שלבים בהרשמה, שלב אחד בעריכה)
  KZ.openProfile = function (onboarding) {
    const draft = { ...S.profile };
    let step = onboarding ? 0 : 1;

    const stepWelcome = () => `
      <div class="center">
        <div class="onb-logo"><span class="logo" aria-label="קהילת קלוזנר"><small>קהילת</small><b>קלוזנר</b><i>KEHILLAT KLAUSNER</i></span></div>
        <h2 style="padding:0">ברוכים הבאים <span class="mark">למסע!</span></h2>
        <p>זו השנה שלכם – שנת הבר/בת מצווה. האתר ילווה אתכם לאורך כל הדרך:</p>
      </div>
      <div class="stack small">
        <div class="body-item"><span class="e">🗺️</span><div><b>מפת המסע</b> – כל המפגשים של השנה, עם צ׳ק־אין אחרי כל אחד.</div></div>
        <div class="body-item"><span class="e">🎯</span><div><b>אתגרים</b> – זהות, חברה, קהילה, ידע ומסורת.</div></div>
        <div class="body-item"><span class="e">🌱</span><div><b>רימון של 613 גרעינים</b> – כל דבר שעושים ממלא אותו.</div></div>
        <div class="body-item"><span class="e">📜</span><div><b>ארון הספרים</b> – טעמים, סידור, הפרשה שלכם ומשחקים.</div></div>
      </div>
      <button class="btn btn--block" data-next style="margin-top:16px">יאללה, מתחילים ←</button>`;

    const stepWho = () => `
      <h2>${onboarding ? 'נעים להכיר!' : 'עריכת פרופיל'}</h2>
      <label class="field"><span>איך קוראים לך?</span><input class="input" name="name" value="${esc(draft.name)}" maxlength="40" autocomplete="given-name" placeholder="שם פרטי"></label>
      <div class="field"><span>אני</span><div class="gender-pick">
        <button type="button" data-g="f" aria-pressed="${draft.gender === 'f'}">בת 👧</button>
        <button type="button" data-g="m" aria-pressed="${draft.gender === 'm'}">בן 👦</button>
      </div><small>כדי שנפנה אליך נכון, ונציג את המפגשים הרלוונטיים.</small></div>
      ${onboarding ? '' : birthFields()}
      <div class="field"><span>הדמות שלי</span><div class="avatar-pick">${AVATARS.map((a) => `<button type="button" data-av="${a}" aria-pressed="${draft.avatar === a}">${a}</button>`).join('')}</div></div>
      <button class="btn btn--block" data-next>${onboarding ? 'הבא ←' : `${icon('check')} שמירה`}</button>`;

    const birthFields = () => `
      <label class="field"><span>תאריך לידה <span class="faint">(לא חובה)</span></span><input class="input" type="date" name="birth" value="${esc(draft.birth)}" min="2005-01-01" max="${KZ.todayISO()}"><small>בעזרתו נחשב את התאריך העברי, את השבת ואת הפרשה שלך.</small></label>
      <label class="check" style="margin-bottom:14px"><input type="checkbox" name="sunset" ${draft.afterSunset ? 'checked' : ''}> נולדתי אחרי השקיעה</label>`;

    const stepBirth = () => `
      <h2>עוד דבר אחד</h2>
      <p class="muted">מתי נולדת? כך נוכל להראות לך על מפת המסע את היום הגדול שלך – ולמצוא את הפרשה.</p>
      ${birthFields()}
      <p class="note small">🔒 כל מה שכותבים באתר נשמר רק במכשיר הזה. לא נשלח לשום מקום.</p>
      <button class="btn btn--block" data-next>${icon('check')} סיימתי!</button>
      <button class="link-btn" data-skip style="margin-top:10px;display:block;margin-inline:auto">דילוג</button>`;

    function draw() {
      const body = [stepWelcome, stepWho, stepBirth][step]();
      const dots = onboarding ? `<div class="onb-steps">${[0, 1, 2].map((i) => `<i class="${i <= step ? 'on' : ''}"></i>`).join('')}</div>` : '';
      KZ.modal(dots + body, { onMount: bind });
    }
    function collect(m) {
      const n = KZ.$('[name=name]', m); if (n) draft.name = n.value.trim();
      const b = KZ.$('[name=birth]', m); if (b) draft.birth = b.value;
      const s = KZ.$('[name=sunset]', m); if (s) draft.afterSunset = s.checked;
    }
    function finish() {
      const birthChanged = draft.birth !== S.profile.birth || draft.afterSunset !== S.profile.afterSunset || draft.gender !== S.profile.gender;
      Object.assign(S.profile, draft);
      S.onboarded = true;
      if (birthChanged && !draft.birth) S.bm = null;
      KZ.save();
      KZ.closeModal();
      KZ.updateChrome();
      if (onboarding) KZ.award('profile', 15, 'יצאת לדרך!');
      else KZ.checkBadges();
      if (birthChanged && draft.birth && draft.gender) KZ.computeMitzvah().then(() => KZ.refresh());
      KZ.refresh();
    }
    function bind(m) {
      KZ.$$('[data-g]', m).forEach((b) => b.addEventListener('click', () => { draft.gender = b.dataset.g; KZ.$$('[data-g]', m).forEach((x) => x.setAttribute('aria-pressed', x === b)); }));
      KZ.$$('[data-av]', m).forEach((b) => b.addEventListener('click', () => { draft.avatar = b.dataset.av; KZ.$$('[data-av]', m).forEach((x) => x.setAttribute('aria-pressed', x === b)); }));
      const next = KZ.$('[data-next]', m);
      next.addEventListener('click', () => {
        collect(m);
        if (step === 1 && !draft.name) { const n = KZ.$('[name=name]', m); n.focus(); n.style.borderColor = 'var(--pom)'; return; }
        if (!onboarding || step === 2) return finish();
        step++; draw();
      });
      const skip = KZ.$('[data-skip]', m);
      if (skip) skip.addEventListener('click', () => { draft.birth = ''; finish(); });
      KZ.$$('input', m).forEach((inp) => inp.addEventListener('keydown', (e) => { if (e.key === 'Enter' && inp.type !== 'checkbox') { e.preventDefault(); next.click(); } }));
    }
    draw();
  };

  function boot() {
    KZ.renderNav();
    KZ.updateChrome();
    window.addEventListener('hashchange', KZ.route);
    KZ.route();
    if (!S.onboarded) setTimeout(() => KZ.openProfile(true), 350);
    else KZ.checkBadges();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})(window.KZ);
