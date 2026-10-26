/* =========================================================
   parents.js – אזור ההורים: עקרונות, פעילויות, אחראים ומשימות
   הכול נשאב מ-data/program.js
   ========================================================= */
(function (KZ) {
  'use strict';
  const { esc, icon } = KZ;
  const STATUS = { ok: 'ok', done: 'ok', need: 'need', progress: 'progress', open: 'need', ongoing: 'progress' };
  const tag = (key, text) => `<span class="tag tag--${STATUS[key] || 'joint'}">${esc(text)}</span>`;

  function activityTable(track, title) {
    const rows = KZ.program.activities.filter((a) => a.track === track);
    if (!rows.length) return '';
    return `<section class="section"><div class="section-head"><h2>${title}</h2></div>
      <div class="table-wrap"><table>
        <thead><tr><th>פעילות</th><th>אחראי/ת</th><th>מועד / הערות</th><th>סטטוס</th></tr></thead>
        <tbody>${rows.map((a) => `<tr>
          <td><strong>${a.emoji} ${esc(a.parentTitle || a.title)}</strong></td>
          <td>${esc(a.owner || '—')}</td>
          <td>${esc([a.date ? KZ.fmtDate(a.date) : a.when, a.dateNote].filter(Boolean).join(' · '))}</td>
          <td>${tag(a.status, a.statusText)}</td></tr>`).join('')}</tbody>
      </table></div></section>`;
  }

  KZ.views.parents = {
    title: 'אזור ההורים',
    render() {
      const P = KZ.program;
      const needs = [...P.activities.filter((a) => a.status === 'need').map((a) => a.parentTitle || a.title), ...P.orgTasks.filter((t) => t.status === 'need').map((t) => t.task)];
      return `
        <header class="page-head"><span class="overline">על פי פגישת ההורים · ${esc(P.meeting)}</span>
          <h1>אזור ההורים</h1>
          <p>תמונת מצב של שנת הבר/בת מצווה ב${esc(P.community)}: מה סוכם, מי אחראי/ת על מה, ואיפה עוד צריך ידיים. ${esc(P.schedulingNote)}</p></header>

        ${needs.length ? `<section class="need-owner"><h3 style="margin-top:0">🙋 מחפשים הורה אחראי/ת</h3>
          <ul class="practice">${needs.map((n) => `<li>${esc(n)}</li>`).join('')}</ul>
          <p class="small" style="margin:8px 0 0">רוצים לקחת? כתבו בקבוצת ההורים.</p></section>` : ''}

        <section class="section"><div class="section-head"><h2>עקרונות שסוכמו</h2></div>
          <div class="grid-2">${P.principles.map((p) => `<div class="card card--flat principle"><span class="ico">${icon(p.icon)}</span><div><h3>${esc(p.title)}</h3><p>${esc(p.text)}</p></div></div>`).join('')}</div></section>

        ${activityTable('joint', 'פעילויות משותפות לבנים ולבנות')}
        ${activityTable('girls', 'פעילויות לבנות בלבד')}
        <section class="section"><div class="section-head"><h2>פעילויות לבנים</h2></div>
          <p class="card card--flat">מפגשים ייעודיים לבנים יתקיימו בשנה הבאה (כיתה ז׳). התוכן טרם נבנה.</p></section>

        <section class="section"><div class="section-head"><h2>משימות ארגוניות</h2></div>
          <div class="table-wrap"><table>
            <thead><tr><th>משימה</th><th>אחראי/ת</th><th>הערות</th><th>סטטוס</th></tr></thead>
            <tbody>${P.orgTasks.map((t) => `<tr><td><strong>${esc(t.task)}</strong></td><td>${esc(t.owner || '—')}</td><td>${esc(t.note)}</td><td>${tag(t.status, t.statusText)}</td></tr>`).join('')}</tbody>
          </table></div></section>

        <section class="section grid-2">
          <div class="card">
            <h3>${icon('info')} מה הילדים רואים באתר?</h3>
            <ul class="practice small">
              <li><b>מפת המסע</b> – כל פעילות היא תחנה. אחרי מפגש הילדים עושים "צ׳ק־אין", כותבים משפט רפלקציה ומוסיפים את הדמות מהקהילה לאלבום.</li>
              <li><b>אתגרים</b> בארבעה צירים: זהות, חברה, קהילה, ידע ומסורת.</li>
              <li><b>רימון של 613 גרעינים</b> – כל פעולה ממלאת אותו, עם שלבים ותגים.</li>
              <li><b>ארון הספרים</b> – טעמים, סידור, עלייה לתורה, מחשבון פרשה וקורא עם טעמים.</li>
              <li>הכול נשמר <b>רק במכשיר של הילד/ה</b>; אין שרת ואין איסוף מידע.</li>
            </ul>
          </div>
          <div class="card">
            <h3>${icon('pen')} איך מעדכנים את האתר?</h3>
            <p class="small muted">כל התכנית יושבת בקובץ אחד: <code>assets/js/data/program.js</code>. כשנקבע תאריך – כותבים אותו בשדה <code>date</code>; כשמישהו לוקח אחריות – ממלאים <code>owner</code> ומשנים את <code>status</code>. השינוי יופיע מיד במפת המסע ובטבלאות כאן.</p>
            <p class="small muted">אתגרים ותגים: <code>data/quests.js</code> · טעמים: <code>data/taamim.js</code> · סידור ומילון: <code>data/siddur.js</code>.</p>
            <button class="btn btn--sm btn--ghost no-print" onclick="window.print()">הדפסת העמוד</button>
          </div>
        </section>`;
    },
  };
})(window.KZ);
