/* =========================================================
   hebrew.js – תאריך עברי, גימטריה, חישוב בר/בת מצווה,
   Hebcal (פרשות), ספריא (טקסט עם טעמים), וניתוח טעמים בטקסט
   ========================================================= */
(function (KZ) {
  'use strict';

  /* ---------- גימטריה ---------- */
  const LET = [[400, 'ת'], [300, 'ש'], [200, 'ר'], [100, 'ק'], [90, 'צ'], [80, 'פ'], [70, 'ע'], [60, 'ס'], [50, 'נ'], [40, 'מ'], [30, 'ל'], [20, 'כ'], [10, 'י'], [9, 'ט'], [8, 'ח'], [7, 'ז'], [6, 'ו'], [5, 'ה'], [4, 'ד'], [3, 'ג'], [2, 'ב'], [1, 'א']];
  function gematria(n, withMarks = true) {
    n = n % 1000;
    let s = '';
    while (n > 0) {
      if (n === 15) { s += 'טו'; break; }
      if (n === 16) { s += 'טז'; break; }
      for (const [v, l] of LET) if (n >= v) { s += l; n -= v; break; }
    }
    if (!withMarks) return s;
    return s.length > 1 ? s.slice(0, -1) + '״' + s.slice(-1) : s + '׳';
  }

  /* ---------- תאריך עברי (Intl, לוח עברי) ---------- */
  const HEB_MONTHS = { Tishri: 'תשרי', Heshvan: 'חשוון', Kislev: 'כסלו', Tevet: 'טבת', Shevat: 'שבט', Adar: 'אדר', 'Adar I': 'אדר א׳', 'Adar II': 'אדר ב׳', Nisan: 'ניסן', Iyar: 'אייר', Sivan: 'סיוון', Tamuz: 'תמוז', Av: 'אב', Elul: 'אלול' };
  const fmtParts = new Intl.DateTimeFormat('en-u-ca-hebrew', { year: 'numeric', month: 'long', day: 'numeric' });
  function heb(date) {
    const p = {}; fmtParts.formatToParts(date).forEach((x) => { p[x.type] = x.value; });
    return { y: +p.year || +p.relatedYear, m: p.month, d: +p.day };
  }
  function hebStr(date) {
    const h = heb(date);
    return `${gematria(h.d)} ב${HEB_MONTHS[h.m] || h.m} ${gematria(h.y)}`;
  }
  const isLeap = (y) => ((7 * y + 1) % 19) < 7;
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };

  // חישוב יום הבר/בת מצווה: אותו יום עברי, 13 (בן) / 12 (בת) שנים אחרי
  function mitzvahDate(birthISO, afterSunset, age) {
    let birth = KZ.parseISO(birthISO);
    if (!birth) return null;
    if (afterSunset) birth = addDays(birth, 1);
    const hb = heb(birth);
    const ty = hb.y + age;
    let tm = hb.m;
    const leap = isLeap(ty);
    if (tm === 'Adar' && leap) tm = 'Adar II';           // נולד/ה באדר בשנה רגילה → אדר ב׳ (המנהג הנפוץ)
    else if ((tm === 'Adar I' || tm === 'Adar II') && !leap) tm = 'Adar';
    const approx = new Date(birth); approx.setFullYear(birth.getFullYear() + age);
    const find = (day) => {
      for (let i = -70; i <= 70; i++) {
        const d = addDays(approx, i); const h = heb(d);
        if (h.y === ty && h.m === tm && h.d === day) return d;
      }
      return null;
    };
    let date = find(hb.d);
    let note = '';
    if (!date && hb.d === 30) { const d29 = find(29); if (d29) { date = addDays(d29, 1); note = 'בשנה הזו בחודש יש רק 29 ימים, ולכן היום נופל בא׳ בחודש הבא.'; } }
    if (!date) return null;
    return { birthHeb: hebStr(birth), birthHebParts: hb, date, dateHeb: hebStr(date), age, note, adarNote: /Adar/.test(hb.m) ? 'נולדת באדר – יש מנהגים שונים לגבי שנה מעוברת. כדאי לבדוק עם הגבאים.' : '' };
  }
  const nextShabbat = (d) => addDays(d, (6 - d.getDay() + 7) % 7);
  const prevShabbat = (d) => addDays(d, -((d.getDay() + 1) % 7));

  /* ---------- Hebcal ---------- */
  async function hebcalRange(startISO, endISO) {
    const url = `https://www.hebcal.com/hebcal?v=1&cfg=json&s=on&i=on&maj=on&min=on&mod=on&lg=he&start=${startISO}&end=${endISO}`;
    const cacheKey = 'kz-hebcal:' + startISO + ':' + endISO;
    try { const c = sessionStorage.getItem(cacheKey); if (c) return JSON.parse(c); } catch (e) { /* */ }
    const r = await fetch(url);
    if (!r.ok) throw new Error('hebcal ' + r.status);
    const j = await r.json();
    const items = j.items || [];
    try { sessionStorage.setItem(cacheKey, JSON.stringify(items)); } catch (e) { /* */ }
    return items;
  }
  async function parashaFor(shabbatDate) {
    const iso = KZ.isoOf(shabbatDate);
    const items = await hebcalRange(iso, iso);
    const p = items.find((x) => x.category === 'parashat');
    const hol = items.filter((x) => x.category === 'holiday' || x.category === 'roshchodesh');
    return { date: iso, parasha: p || null, holidays: hol };
  }
  async function thisWeek() {
    const sh = nextShabbat(new Date());
    return parashaFor(sh);
  }

  /* ---------- שמות ספרים ---------- */
  const BOOKS = {
    Genesis: 'בראשית', Exodus: 'שמות', Leviticus: 'ויקרא', Numbers: 'במדבר', Deuteronomy: 'דברים',
    Joshua: 'יהושע', Judges: 'שופטים', 'I Samuel': 'שמואל א', 'II Samuel': 'שמואל ב', 'I Kings': 'מלכים א', 'II Kings': 'מלכים ב',
    Isaiah: 'ישעיהו', Jeremiah: 'ירמיהו', Ezekiel: 'יחזקאל', Hosea: 'הושע', Joel: 'יואל', Amos: 'עמוס', Obadiah: 'עובדיה',
    Jonah: 'יונה', Micah: 'מיכה', Nahum: 'נחום', Habakkuk: 'חבקוק', Zephaniah: 'צפניה', Haggai: 'חגי', Zechariah: 'זכריה', Malachi: 'מלאכי',
  };
  // Hebcal מוסיף לפעמים סיבה: "I Samuel 20:18-42 | Shabbat Machar Chodesh"
  const REASONS = { 'Shabbat Machar Chodesh': 'שבת מחר חודש', 'Shabbat Rosh Chodesh': 'שבת ראש חודש', 'Shabbat Shekalim': 'שבת שקלים', 'Shabbat Zachor': 'שבת זכור', 'Shabbat Parah': 'שבת פרה', 'Shabbat HaChodesh': 'שבת החודש', 'Shabbat HaGadol': 'שבת הגדול', 'Shabbat Shuva': 'שבת שובה', 'Shabbat Chanukah': 'שבת חנוכה' };
  const cleanRef = (ref) => String(ref || '').split(' | ')[0].trim();
  // "Genesis 12:1-17:27" → "בראשית י״ב, א׳ – י״ז, כ״ז"
  function heRef(full) {
    if (!full) return '';
    const reason = String(full).split(' | ')[1];
    const suffix = reason ? ` (${REASONS[reason.trim()] || reason.trim()})` : '';
    return cleanRef(full).split(/,\s*/).map((part, i) => {
      const m = part.match(/^(.*?)\s*(\d+):(\d+)(?:-(?:(\d+):)?(\d+))?$/);
      if (!m) {
        const m2 = part.match(/^(\d+):(\d+)(?:-(?:(\d+):)?(\d+))?$/);
        if (m2) return `${gematria(+m2[1])}, ${gematria(+m2[2])}` + (m2[4] ? ` – ${m2[3] ? gematria(+m2[3]) + ', ' : ''}${gematria(+m2[4])}` : '');
        return part;
      }
      const book = BOOKS[m[1]] || m[1];
      let s = `${i === 0 || m[1] ? book + ' ' : ''}${gematria(+m[2])}, ${gematria(+m[3])}`;
      if (m[5]) s += ` – ${m[4] && m[4] !== m[2] ? gematria(+m[4]) + ', ' : ''}${gematria(+m[5])}`;
      return s;
    }).join(' ; ') + suffix;
  }
  // "II Kings 4:1-37" → https://www.sefaria.org.il/II_Kings.4.1-37
  function sefariaURL(ref) {
    const first = cleanRef(ref).split(/,\s*/)[0];
    const m = first.match(/^(.*?)\s+(\d.*)$/);
    const path = m ? m[1].replace(/ /g, '_') + '.' + m[2].replace(/:/g, '.') : first.replace(/ /g, '_');
    return 'https://www.sefaria.org.il/' + encodeURI(path) + '?lang=he';
  }

  /* ---------- ספריא: טקסט עם טעמים ---------- */
  function cleanSefaria(html) {
    const doc = new DOMParser().parseFromString(`<div>${html}</div>`, 'text/html');
    doc.querySelectorAll('.mam-spi-pe').forEach((n) => { n.textContent = ' {פ} '; });
    doc.querySelectorAll('.mam-spi-samekh').forEach((n) => { n.textContent = ' {ס} '; });
    doc.querySelectorAll('sup, i.footnote').forEach((n) => n.remove());
    doc.querySelectorAll('br').forEach((n) => n.replaceWith(' '));
    return doc.body.textContent.replace(/[  ]/g, ' ').replace(/\s+/g, ' ').trim();
  }
  async function fetchVerses(ref) {
    const parts = cleanRef(ref).split(/,\s*/);
    const book = (parts[0].match(/^(.*?)\s*\d+:/) || [])[1] || '';
    const out = [];
    for (let p of parts) {
      if (/^\d/.test(p)) p = book + ' ' + p;
      const cacheKey = 'kz-sef:' + p;
      let data = null;
      try { const c = sessionStorage.getItem(cacheKey); if (c) data = JSON.parse(c); } catch (e) { /* */ }
      if (!data) {
        const r = await fetch(`https://www.sefaria.org/api/texts/${encodeURIComponent(p)}?context=0&commentary=0&pad=0`);
        if (!r.ok) throw new Error('sefaria ' + r.status);
        const j = await r.json();
        data = { he: j.he, sections: j.sections, toSections: j.toSections };
        try { sessionStorage.setItem(cacheKey, JSON.stringify(data)); } catch (e) { /* */ }
      }
      const [c0, v0] = data.sections;
      if (Array.isArray(data.he) && Array.isArray(data.he[0])) {
        data.he.forEach((chap, ci) => chap.forEach((v, vi) => out.push({ ch: c0 + ci, v: (ci === 0 ? v0 : 1) + vi, he: cleanSefaria(v) })));
      } else {
        (Array.isArray(data.he) ? data.he : [data.he]).forEach((v, vi) => out.push({ ch: c0, v: (v0 || 1) + vi, he: cleanSefaria(v) }));
      }
    }
    return out;
  }

  /* ---------- ניתוח טעמים ---------- */
  const CP = {
    0x591: 'etnachta', 0x592: 'segol', 0x593: 'shalshelet', 0x594: 'zakef-katan', 0x595: 'zakef-gadol', 0x596: 'tipcha',
    0x597: 'revia', 0x598: 'zarka', 0x5AE: 'zarka', 0x599: 'pashta', 0x59A: 'yetiv', 0x59B: 'tevir', 0x59C: 'geresh', 0x59D: 'geresh',
    0x59E: 'gershayim', 0x59F: 'karnei-para', 0x5A0: 'telisha-gedola', 0x5A1: 'pazer', 0x5A3: 'munach', 0x5A4: 'mahapach',
    0x5A5: 'merkha', 0x5A6: 'merkha-kefula', 0x5A7: 'darga', 0x5A8: 'kadma', 0x5A9: 'telisha-ketana', 0x5AA: 'yerach',
  };
  const RANK_ORDER = { emperor: 5, king: 4, duke: 3, count: 2, servant: 1 };
  const byId = (id) => (KZ.taamim || []).find((t) => t.id === id);
  function taamOf(part) {
    if (part.includes('׃')) return 'sof-pasuk';
    const ids = [...new Set([...part].map((c) => CP[c.codePointAt(0)]).filter(Boolean))];
    if (!ids.length) return null;
    ids.sort((a, b) => (RANK_ORDER[(byId(b) || {}).rank] || 0) - (RANK_ORDER[(byId(a) || {}).rank] || 0));
    return ids[0];
  }
  // מפרק פסוק ליחידות (מילים וחלקי מקף) עם הטעם של כל אחת
  function tokenize(text) {
    const words = text.split(' ').filter(Boolean);
    const out = [];
    words.forEach((w, i) => {
      if (w === '׀' || w === '|') { out.push({ type: 'paseq', text: '׀' }); return; }
      if (w === '{פ}') { out.push({ type: 'petucha' }); return; }
      if (w === '{ס}') { out.push({ type: 'setuma' }); return; }
      const parts = w.split('־');
      parts.forEach((p, pi) => {
        let id = taamOf(p);
        if (id === 'munach' && pi === parts.length - 1 && (words[i + 1] === '׀')) id = 'legarmeh';
        out.push({ type: 'word', text: p + (pi < parts.length - 1 ? '־' : ''), id, joined: pi < parts.length - 1 });
      });
    });
    return out;
  }
  const stripTaamim = (s) => s.replace(/[֑-֯]/g, '');
  const stripAll = (s) => s.replace(/[֑-ׇ]/g, (c) => (c === '־' ? ' ' : '')).replace(/[׃׀|]/g, '');

  Object.assign(KZ, {
    gematria, heb, hebStr, HEB_MONTHS, isLeap, mitzvahDate, nextShabbat, prevShabbat, addDays,
    hebcalRange, parashaFor, thisWeek, BOOKS, heRef, sefariaURL, fetchVerses, cleanSefaria,
    taamOf, tokenize, stripTaamim, stripAll, taamById: byId,
  });
})(window.KZ);
