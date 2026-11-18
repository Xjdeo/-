#!/usr/bin/env node
/* مسار — فحص البيانات قبل النشر.
   الاستعمال: node tools/validate.js
   يتحقق من: بنية الوحدات والمحاور والعقد، وصحة أرقام الصفحات، وشروط الأسئلة،
   وتوزيع مواضع الإجابات الصحيحة، وطول الخيار الصحيح، وغياب الرموز التعبيرية،
   وغياب الأرقام الغربية في النصوص العربية، ووجود صور الصفحات. */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const ctx = { window: {} };
ctx.window.MASAR = {};
ctx.MASAR = ctx.window.MASAR;
vm.createContext(ctx);
for (const f of ['data/course.js', 'data/questions.js', 'data/notes.js', 'data/exercises.js']) {
  vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), ctx, { filename: f });
}
const M = ctx.MASAR;
const errors = [];
const warns = [];
const err = (m) => errors.push(m);
const warn = (m) => warns.push(m);

const C = M.course;
const first = C.firstPage, last = C.lastPage;
const missing = new Set(C.missingPages || []);
const validPage = (p) => Number.isInteger(p) && p >= first && p <= last && !missing.has(p);

const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F000}-\u{1F2FF}\u{FE0F}]/u;
const LATIN_DIGIT = /[0-9]/;
/* الأرقام الغربية مقبولة فقط داخل استشهاد لاتيني كما طُبع (اسم لاتيني ثم سنة). */
function checkText(label, s) {
  if (typeof s !== 'string') return;
  if (EMOJI.test(s)) err(`${label}: رمز تعبيري`);
  const stripped = s.replace(/\([^()]*[A-Za-z][^()]*\)/g, '').replace(/[A-Za-z][A-Za-z .,&ç-]*,? ?\d{4}/g, '');
  if (LATIN_DIGIT.test(stripped)) warn(`${label}: رقم غربي في نص عربي: «${s.slice(0, 60)}…»`);
}

/* صور الصفحات */
for (let p = first; p <= last; p++) {
  if (missing.has(p)) continue;
  const f = path.join(root, 'pages', `p-${p}.webp`);
  if (!fs.existsSync(f)) err(`صورة الصفحة ${p} غير موجودة: ${f}`);
}

/* الوحدات */
const unitIds = new Set();
let nodeCount = 0;
for (const u of M.units) {
  if (unitIds.has(u.id)) err(`معرّف وحدة مكرر ${u.id}`);
  unitIds.add(u.id);
  if (!(u.from >= first && u.to <= last && u.from <= u.to)) err(`${u.id}: نطاق صفحات غير صحيح`);
  ['title', 'subject', 'name'].forEach((k) => checkText(`${u.id}.${k}`, u[k]));
  if (!u.topics || !u.topics.length) err(`${u.id}: لا محاور`);
  u.topics.forEach((t, ti) => {
    const tl = `${u.id}.topic${ti}`;
    if (!(t.from >= u.from && t.to <= u.to)) err(`${tl}: نطاق المحور خارج نطاق الوحدة`);
    if (!t.key) err(`${tl}: لا مفتاح استرجاع`);
    checkText(`${tl}.intro`, t.intro); checkText(`${tl}.key`, t.key); checkText(`${tl}.title`, t.title);
    if (t.nodes.length < 3 || t.nodes.length > 11) warn(`${tl}: عدد العقد ${t.nodes.length}`);
    t.nodes.forEach((n, ni) => {
      nodeCount++;
      const nl = `${tl}.node${ni}`;
      if (n.length < 3) err(`${nl}: عقدة بلا صفحة`);
      n.slice(2).forEach((p) => { if (!validPage(p)) err(`${nl}: صفحة غير صالحة ${p}`); });
      if (!(n[2] >= t.from && n[2] <= t.to) && !(n[2] >= u.from && n[2] <= u.to)) warn(`${nl}: الصفحة ${n[2]} خارج نطاق المحور`);
      checkText(`${nl}.term`, n[0]); checkText(`${nl}.text`, n[1]);
    });
  });
  (u.comparisons || []).forEach((c) => {
    if (!validPage(c.page)) err(`${c.id}: صفحة غير صالحة`);
    if (c.topic != null && !u.topics[c.topic]) err(`${c.id}: محور غير موجود`);
    c.rows.forEach((r, ri) => {
      if (r.length !== c.headings.length) err(`${c.id}.row${ri}: عدد الخلايا لا يطابق العناوين`);
      r.forEach((cell) => checkText(`${c.id}.row${ri}`, cell));
    });
    checkText(`${c.id}.note`, c.note); checkText(`${c.id}.desc`, c.desc);
  });
  (u.figures || []).forEach((f) => {
    if (!validPage(f.page)) err(`${u.id} figure ${f.name}: صفحة غير صالحة`);
    ['name', 'idea', 'field', 'explain', 'compare'].forEach((k) => checkText(`${u.id}.fig.${k}`, f[k]));
  });
}

/* الأسئلة */
const Q = M.questions;
const ids = new Set();
const pos = [0, 0, 0, 0];
const cats = {};
const perUnit = {};
const topicsHit = {};
let longestOutliers = 0;
for (const q of Q) {
  const l = q.id;
  if (ids.has(l)) err(`${l}: معرّف مكرر`);
  ids.add(l);
  if (!unitIds.has(q.unit)) err(`${l}: وحدة غير موجودة`);
  const u = M.units.find((x) => x.id === q.unit);
  if (u && !u.topics[q.topic]) err(`${l}: محور غير موجود`);
  if (!M.categories[q.cat]) err(`${l}: تصنيف غير معروف ${q.cat}`);
  if (!Array.isArray(q.options) || q.options.length !== 4) err(`${l}: يجب أن تكون الخيارات أربعة`);
  if (new Set(q.options).size !== q.options.length) err(`${l}: خيارات مكررة`);
  if (!(q.correct >= 0 && q.correct <= 3)) err(`${l}: correct خارج النطاق`);
  if (!(q.near >= 0 && q.near <= 3)) err(`${l}: near خارج النطاق`);
  if (q.near === q.correct) err(`${l}: near يساوي correct`);
  if (!q.why || !q.nearWhy) err(`${l}: ينقص why أو nearWhy`);
  if (!validPage(q.page)) err(`${l}: صفحة غير صالحة ${q.page}`);
  if (u && !(q.page >= u.from && q.page <= u.to)) warn(`${l}: الصفحة ${q.page} خارج نطاق الوحدة`);
  [q.q, q.why, q.nearWhy, ...q.options].forEach((s) => checkText(l, s));
  pos[q.correct]++;
  cats[q.cat] = (cats[q.cat] || 0) + 1;
  perUnit[q.unit] = (perUnit[q.unit] || 0) + 1;
  topicsHit[`${q.unit}:${q.topic}`] = true;
  const lens = q.options.map((o) => o.length);
  const others = lens.filter((_, i) => i !== q.correct);
  if (lens[q.correct] > Math.max(...others) * 1.25 && lens[q.correct] - Math.max(...others) > 8) {
    warn(`${l}: الخيار الصحيح أطول بوضوح من بقية الخيارات`); longestOutliers++;
  }
  const giveaway = /(فقط|دائمًا|دائما|مسبقًا|مسبقا|إطلاقًا|أبدًا)/;
  q.options.forEach((o, i) => { if (i !== q.correct && giveaway.test(o)) warn(`${l}: كلمة كاشفة في مُشتِّت: ${o}`); });
}
const total = Q.length;
const maxShare = Math.max(...pos) / total;
if (maxShare > 0.35) warn(`توزيع مواضع الإجابات غير متوازن: ${pos.join(' / ')}`);
let correctIsLongest = 0;
Q.forEach((q) => { const lens = q.options.map((o) => o.length); if (lens[q.correct] === Math.max(...lens)) correctIsLongest++; });
if (correctIsLongest / total > 0.4) warn(`الخيار الصحيح هو الأطول في ${correctIsLongest} من ${total} سؤالًا`);

/* الملاحظات والمراجع */
(M.audit || []).forEach((a, i) => { if (!(a.page >= first && a.page <= last)) err(`audit${i}: صفحة غير صالحة`); checkText(`audit${i}`, a.text); });
(M.refs || []).forEach((r) => r.pages.forEach((p) => { if (!validPage(p)) err(`ref ${r.cite}: صفحة غير صالحة ${p}`); }));

/* التمارين */
const exIds = new Set();
const exPerUnit = {};
(M.exercises || []).forEach((x) => {
  const l = x.id;
  if (exIds.has(l)) err(`${l}: معرّف تمرين مكرر`); exIds.add(l);
  if (!unitIds.has(x.unit)) err(`${l}: وحدة غير موجودة`);
  const u = M.units.find((y) => y.id === x.unit);
  if (x.topic != null && u && !u.topics[x.topic]) err(`${l}: محور غير موجود`);
  (x.pages || [x.page]).concat([x.page]).forEach((p) => { if (!validPage(p)) err(`${l}: صفحة غير صالحة ${p}`); });
  [x.title, x.prompt].forEach((t) => checkText(l, t));
  if (x.type === 'order') {
    if (!Array.isArray(x.items) || x.items.length < 3) err(`${l}: تمرين ترتيب يحتاج ثلاثة عناصر على الأقل`);
    else if (new Set(x.items).size !== x.items.length) err(`${l}: عناصر مكررة`);
    (x.items || []).forEach((t) => checkText(l, t));
  } else if (x.type === 'match') {
    if (!Array.isArray(x.pairs) || x.pairs.length < 3) err(`${l}: تمرين توصيل يحتاج ثلاثة أزواج على الأقل`);
    else {
      if (new Set(x.pairs.map((p) => p[0])).size !== x.pairs.length) err(`${l}: عناصر يمنى مكررة`);
      if (new Set(x.pairs.map((p) => p[1])).size !== x.pairs.length) err(`${l}: مقابلات مكررة؛ يصبح التصحيح ملتبسًا`);
    }
    (x.pairs || []).forEach((p) => p.forEach((t) => checkText(l, t)));
  } else err(`${l}: نوع غير معروف ${x.type}`);
  exPerUnit[x.unit] = (exPerUnit[x.unit] || 0) + 1;
});
unitIds.forEach((id) => { if (!exPerUnit[id]) warn(`${id}: لا تمارين ترتيب أو توصيل`); });

/* التقرير */
console.log('مسار — تقرير الفحص');
console.log(`الوحدات: ${M.units.length}  المحاور: ${M.units.reduce((a, u) => a + u.topics.length, 0)}  العقد: ${nodeCount}`);
console.log(`المقارنات: ${M.units.reduce((a, u) => a + (u.comparisons || []).length, 0)}  الأعلام: ${M.units.reduce((a, u) => a + (u.figures || []).length, 0)}`);
console.log(`الأسئلة: ${total}  لكل وحدة: ${JSON.stringify(perUnit)}`);
console.log(`مواضع الإجابة الصحيحة (أ/ب/ج/د): ${pos.join(' / ')}`);
console.log(`التصنيفات: ${JSON.stringify(cats)}`);
console.log(`الخيار الصحيح هو الأطول (أو مساوٍ للأطول) في ${correctIsLongest} من ${total}`);
const allTopics = M.units.reduce((a, u) => a + u.topics.length, 0);
console.log(`التمارين: ${(M.exercises || []).length}  لكل وحدة: ${JSON.stringify(exPerUnit)}`);
console.log(`محاور ممثلة في البنك: ${Object.keys(topicsHit).length} من ${allTopics}`);
warns.forEach((w) => console.log('تنبيه: ' + w));
errors.forEach((e) => console.log('خطأ: ' + e));
console.log(errors.length ? `النتيجة: ${errors.length} خطأ` : 'النتيجة: لا أخطاء');
process.exit(errors.length ? 1 : 0);
