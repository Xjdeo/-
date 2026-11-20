/* مسار · الوضع والوضّاعون — المنطق: التوجيه، الأنشطة، بنك الأسئلة، الاختبار الشامل، حفظ التقدّم، الوضع الليلي.
   لا يُكتب هنا أي محتوى تعليمي؛ المحتوى كله في data.js. */
(function () {
  'use strict';
  var D = window.WAD, T = D.topics;
  var $ = function (s) { return document.querySelector(s); };
  var main = $('#main');
  var TABS = [
    ['summary', 'الملخص', 'sum'],
    ['map', 'خريطة المفاهيم', 'map'],
    ['table', 'جدول المقارنة', 'table'],
    ['terms', 'المصطلحات والأقوال', 'terms'],
    ['quiz', 'التدريب', 'check']
  ];
  var LET = ['أ', 'ب', 'ج', 'د'];
  var ICON = {
    mark: '<path d="M7 27C7 20 16 20 16 16S25 12 25 5"/><circle cx="7" cy="27" r="3" fill="currentColor" stroke="none"/><circle cx="16" cy="16" r="2.6" fill="currentColor" fill-opacity=".45" stroke="none"/><circle cx="25" cy="5" r="3" fill="none"/>',
    course: '<path d="M4 5h16v14H4z M8 9h8 M8 13h8"/>',
    bank: '<path d="M8 6h12 M8 12h12 M8 18h12 M4 6h.1 M4 12h.1 M4 18h.1"/>',
    exam: '<path d="M12 8v5l3 2 M9 2h6 M12 5a8 8 0 1 0 0 16 8 8 0 1 0 0-16"/>',
    progress: '<path d="M5 20V11 M12 20V5 M19 20v-6"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5"/><circle cx="12" cy="7.8" r=".9" fill="currentColor"/>',
    sum: '<path d="M5 5h14 M5 9.5h14 M5 14h9 M5 18.5h6"/>',
    map: '<circle cx="12" cy="6" r="2.5"/><circle cx="5.5" cy="18" r="2.5"/><circle cx="18.5" cy="18" r="2.5"/><path d="M12 8.5v3.5 M12 12l-5 4 M12 12l5 4"/>',
    table: '<rect x="3.5" y="5" width="17" height="14" rx="1.5"/><path d="M3.5 10h17 M10 10v9"/>',
    terms: '<rect x="4" y="5" width="16" height="11" rx="1.5"/><path d="M8 20h8 M12 16v4 M8 9.5h8 M8 12.5h5"/>',
    check: '<circle cx="12" cy="12" r="8.5"/><path d="m8.5 12.2 2.4 2.4 4.6-5"/>',
    play: '<path d="M8 5.5v13l10-6.5z"/>',
    retry: '<path d="M4 12a8 8 0 1 0 2.4-5.7 M4 4v4.5h4.5"/>',
    prev: '<path d="M9.5 6l6 6-6 6"/>',
    next: '<path d="M14.5 6l-6 6 6 6"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2 M12 19.5v2 M4.6 4.6l1.4 1.4 M18 18l1.4 1.4 M2.5 12h2 M19.5 12h2 M4.6 19.4 6 18 M18 6l1.4-1.4"/>',
    moon: '<path d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10z"/>'
  };
  function ic(n, vb) { return '<svg viewBox="' + (vb || '0 0 24 24') + '" fill="none" stroke="currentColor" aria-hidden="true">' + ICON[n] + '</svg>'; }
  function AR(n) { return String(n).replace(/\d/g, function (d) { return '٠١٢٣٤٥٦٧٨٩'[d]; }); }

  /* ───── التخزين (كل قراءة وكتابة محمية) ───── */
  var storageOK = true;
  function get(k, def) { try { var v = localStorage.getItem('wad:' + k); return v == null ? def : JSON.parse(v); } catch (e) { storageOK = false; return def; } }
  function set(k, v) { try { localStorage.setItem('wad:' + k, JSON.stringify(v)); } catch (e) { storageOK = false; } }
  function blank() { return { v: D.bankVersion, read: {}, ans: {} }; }
  var S = get('progress', null);
  if (!S || S.v !== D.bankVersion || !S.read || !S.ans) S = blank();
  function save() { set('progress', S); }
  if (get('bankVersion', null) !== D.bankVersion) { set('exam', null); set('bankVersion', D.bankVersion); }

  /* ───── الأسئلة مسطّحة ───── */
  var QS = [], Q = {};
  T.forEach(function (t, ti) {
    t.mcq.forEach(function (q, i) { var o = { id: t.id + ':m' + i, ti: ti, kind: 'm', text: q.q, opts: q.o, correct: q.c, why: q.why, p: q.p }; QS.push(o); Q[o.id] = o; });
    t.tf.forEach(function (q, i) { var o = { id: t.id + ':f' + i, ti: ti, kind: 'f', text: q.s, opts: ['صح', 'خطأ'], correct: q.a ? 0 : 1, why: q.why, p: q.p }; QS.push(o); Q[o.id] = o; });
  });
  function topicQs(ti) { return QS.filter(function (q) { return q.ti === ti; }); }

  /* ───── أدوات ───── */
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function fmt(s) { return esc(s).replace(/\{[^{}]+\}/g, function (m) { return '<span class="ayah">' + m + '</span>'; }); }
  function pg(p) { return p == null || p === '' ? '' : '<span class="pg">ص ' + AR(esc(p)) + '</span>'; }
  function range(t) { return t.from === t.to ? 'ص ' + AR(t.from) : 'ص ' + AR(t.from) + '–' + AR(t.to); }
  function pct(a, b) { return b ? Math.round(a / b * 100) : 0; }
  function bar(p) { return '<div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + p + '"><span style="width:' + p + '%"></span></div>'; }
  function topicById(id) { for (var i = 0; i < T.length; i++) if (T[i].id === id) return i; return -1; }
  function countQ(n) { return AR(n) + (n === 1 ? ' سؤال' : n === 2 ? ' سؤالان' : n <= 10 ? ' أسئلة' : ' سؤالًا'); }
  function fmtTime(ms) { ms = Math.max(0, ms); var s = Math.round(ms / 1000), m = Math.floor(s / 60); s = s % 60; return AR(m) + ':' + AR(s < 10 ? '0' + s : s); }
  function stats(ti) {
    var qs = topicQs(ti), answered = 0, right = 0;
    qs.forEach(function (q) { var a = S.ans[q.id]; if (a) { answered++; if (a.ok) right++; } });
    var read = !!S.read[T[ti].id];
    return { total: qs.length, answered: answered, right: right, read: read, pct: pct((read ? 1 : 0) + answered, qs.length + 1) };
  }
  function overall() {
    var u = 0, d = 0, a = 0, r = 0;
    T.forEach(function (t, i) { var s = stats(i); u += s.total + 1; d += s.answered + (s.read ? 1 : 0); a += s.answered; r += s.right; });
    return { pct: pct(d, u), answered: a, right: r, total: QS.length };
  }
  function firstUnread() { for (var i = 0; i < T.length; i++) if (!S.read[T[i].id]) return i; return -1; }
  function firstUnanswered() { for (var i = 0; i < QS.length; i++) if (!S.ans[QS[i].id]) return QS[i]; return null; }
  function resumeTarget() {
    var r = firstUnread(); if (r > -1) return { h: '#summary', sec: T[r].id, label: 'الملخص · المحور ' + AR(r + 1) + ': ' + T[r].title, btn: 'اقرأ الملخص' };
    var q = firstUnanswered(); if (q) return { h: '#quiz', sec: T[q.ti].id, label: 'التدريب · المحور ' + AR(q.ti + 1) + ': ' + T[q.ti].title, btn: 'ابدأ التدريب' };
    return { h: '#mock', sec: '', label: 'الاختبار الشامل في المقرر كله', btn: 'الاختبار الشامل' };
  }
  function goAttr(t) { return 'data-go="' + t.h + '"' + (t.sec ? ' data-sec="' + t.sec + '"' : ''); }
  function actStats() {
    var o = overall(), read = T.filter(function (t) { return S.read[t.id]; }).length;
    return { summary: read, quiz: o.answered, right: o.right };
  }
  function go(h) { if (location.hash === h) route(); else location.hash = h; }

  /* ───── بطاقة سؤال تفاعلية (مشتركة بين تدريب المحور وبنك الأسئلة) ───── */
  function qCard(q, n, showTopic) {
    var a = S.ans[q.id];
    var h = '<article class="qcard" data-q="' + q.id + '"><div class="qmeta"><span class="badge counter">' + AR(n) + '</span>' +
      (showTopic ? '<span class="badge ch-badge">المحور ' + AR(q.ti + 1) + '</span>' : '') +
      '<span class="badge">' + (q.kind === 'm' ? 'اختيار من متعدد' : 'صح أو خطأ') + '</span></div>' +
      '<p class="qtext">' + fmt(q.text) + '</p><div class="opts-list' + (q.kind === 'f' ? ' tf' : '') + '">';
    q.opts.forEach(function (o, k) {
      var cls = 'quiz-option';
      if (a) cls += k === q.correct ? ' is-correct' : k === a.c ? ' is-wrong' : ' dim';
      h += '<button class="' + cls + '" data-act="ans" data-k="' + k + '"' + (a ? ' disabled' : '') + '>' +
        (q.kind === 'm' ? '<span class="option-letter" aria-hidden="true">' + LET[k] + '</span>' : '') + '<span>' + fmt(o) + '</span></button>';
    });
    h += '</div>';
    if (a) h += '<div class="quiz-feedback ' + (a.ok ? 'feedback-correct' : 'feedback-wrong') + '" role="status"><h3>' +
      (a.ok ? 'إجابة صحيحة' : 'إجابة غير صحيحة — الصحيح: ' + esc(q.opts[q.correct])) + '</h3>' + fmt(q.why) + pg(q.p) + '</div>';
    return h + '</article>';
  }
  function reviewItem(q, num, choice, practice, showTopic) {
    var ok = choice === q.correct;
    var status = choice == null ? (practice ? 'لم تُجب عنه بعد' : 'متروك (صفر)') : ok ? 'صحيح' : 'خطأ';
    return '<article class="panel review ' + (choice == null ? '' : ok ? 'r-ok' : 'r-bad') + '"><div class="qmeta"><span class="badge counter">' + AR(num) + '</span>' +
      (showTopic ? '<span class="badge ch-badge">المحور ' + AR(q.ti + 1) + '</span>' : '') + '<span class="badge">' + status + '</span></div>' +
      '<p class="qtext">' + fmt(q.text) + '</p><ul class="rv-opts">' + q.opts.map(function (x, i) {
        return '<li class="' + (i === q.correct ? 'ok' : i === choice ? 'bad' : '') + '"><span class="rv-mark" aria-hidden="true">' + (i === q.correct ? '✓' : i === choice ? '✗' : '') + '</span><span>' +
          (q.kind === 'm' ? LET[i] + '. ' : '') + fmt(x) + (i === q.correct ? ' <strong>(الصحيحة)</strong>' : '') + (i === choice && !ok ? ' <strong>(اختيارك)</strong>' : '') + '</span></li>';
      }).join('') + '</ul><p><strong>التعليل:</strong> ' + fmt(q.why) + pg(q.p) + '</p></article>';
  }

  /* ───── صفحة المقرر ───── */
  function courseView() {
    var o = overall(), started = o.pct > 0, r = resumeTarget(), a = actStats(), ex = get('exam', null);
    var h = '';
    if (ex && !ex.submitted && ex.end > Date.now()) h += '<div class="banner" role="status"><p><strong>محاولة اختبار جارية:</strong> متبقٍ ' + fmtTime(ex.end - Date.now()) + '. الوقت يستمر حتى لو غادرت الصفحة.</p><button class="primary" data-go="#mock">تابع الاختبار</button></div>';
    h += '<section class="course-hero"><div class="eyebrow">' + esc(D.course.institution) + '</div>' +
      '<h1>' + esc(D.course.title) + '</h1><div class="sub">' + esc(D.course.subtitle) + '</div>' +
      '<p>إعداد: ' + esc(D.course.author) + ' — ' + esc(D.course.authorRole) + '.</p>' +
      '<p>تُذاكَر المذكرة كاملة في خمسة أنشطة متتابعة، يضمّ كلٌّ منها المحاور الأحد عشر بترتيب فهرسها. أداة مساعدة لا تغني عن المذكرة، وكل ملخص وسؤال وتعليل يحمل رقم صفحته المطبوعة.</p>' +
      '<div class="actions"><button class="primary ic" ' + goAttr(started ? r : { h: '#summary', sec: '' }) + '>' + ic('play') + (!started ? 'ابدأ المذاكرة' : r.h === '#mock' ? 'الاختبار الشامل' : 'تابع المذاكرة') + '</button>' +
      '<button data-go="#mock">الاختبار الشامل</button></div>' +
      '<div class="stats"><span><strong>' + AR(T.length) + '</strong>محورًا</span><span><strong>' + AR(QS.length) + '</strong>سؤالًا</span><span><strong>' + AR(D.course.pages) + '</strong>صفحة</span><span><strong>' + AR(o.pct) + '٪</strong>تقدّمك</span></div></section>';
    if (started) h += '<div class="resume-card"><p><span>الخطوة التالية</span><strong>' + esc(r.label) + '</strong></p><button class="primary" ' + goAttr(r) + '>' + r.btn + '</button></div>';
    var steps = [
      ['summary', 'ملخصات المحاور الأحد عشر بترتيب المذكرة، مع علامة «قرأت» لكل محور.', AR(a.summary) + ' / ' + AR(T.length) + ' مقروء', pct(a.summary, T.length)],
      ['map', 'خرائط المفاهيم: العلاقات بين عناصر كل محور كما رتّبتها المذكرة.', '', -1],
      ['table', 'جداول المقارنة التي يتيحها المصدر، وبيان المحاور التي لا مقارنة فيها.', '', -1],
      ['terms', 'المصطلحات والأقوال بإجابات مخفية للاسترجاع.', AR(T.reduce(function (n, t) { return n + t.terms.length; }, 0)) + ' بندًا', -1],
      ['quiz', 'أسئلة المقرر كلها، مقسّمة بحسب المحاور، مع التعليل والصفحة بعد كل إجابة.', AR(a.quiz) + ' / ' + AR(QS.length) + ' مُجاب', pct(a.quiz, QS.length)]
    ];
    h += '<div class="sectionhead"><h2>مسار المذاكرة</h2><span class="small">خمسة أنشطة للمقرر كاملًا</span></div><ol class="stem">';
    steps.forEach(function (st, i) {
      var tab = TABS.filter(function (x) { return x[0] === st[0]; })[0];
      h += '<li class="stage"><div class="node">' + (st[3] > -1 ? '<span class="ring" style="--p:' + st[3] + '"></span>' : '') + '<span class="num">' + AR(i + 1) + '</span></div>' +
        '<div class="stage-body"><h3><span>النشاط ' + AR(i + 1) + '</span><span class="pct">' + st[2] + '</span></h3><div class="stage-title">' + tab[1] + '</div><p class="small" style="margin:0 0 .7em">' + st[1] + '</p>' +
        '<div class="stage-actions"><button class="ic" data-go="#' + st[0] + '">' + ic(tab[2]) + 'افتح</button></div></div></li>';
    });
    h += '</ol><div class="sectionhead"><h2>فهرس المحاور</h2><span class="small">بترتيب فهرس المذكرة (ص ١) · اضغط محورًا لتنتقل إلى ملخصه</span></div><section class="panel"><ol class="toc">' +
      T.map(function (t, i) { return '<li><button class="row-link" data-go="#summary" data-sec="' + t.id + '">' + esc(t.title) + '</button> <span class="small">' + range(t) + (S.read[t.id] ? ' · ✓ مقروء' : '') + '</span></li>'; }).join('') + '</ol></section>';
    return h;
  }

  /* ───── أنشطة المحور ───── */
  function tSummary(t) {
    var h = '<div class="panel sum">';
    t.summary.forEach(function (g) {
      h += '<h3>' + esc(g.h) + '</h3><ul>';
      g.pts.forEach(function (p) { h += '<li>' + fmt(p[0]) + pg(p[1]) + '</li>'; });
      h += '</ul>';
    });
    h += '<div class="readrow">' + (S.read[t.id]
      ? '<span class="status-ok">✓ قرأت ملخص هذا المحور</span><button data-act="unread" data-t="' + t.id + '">إلغاء العلامة</button>'
      : '<button class="primary" data-act="read" data-t="' + t.id + '">قرأت ملخص هذا المحور</button><span class="small">يُحتسب في تقدّمك</span>') + '</div>';
    return h + '</div>';
  }
  function mapList(k) {
    return '<ul>' + k.map(function (n) { return '<li>' + fmt(n.t) + pg(n.p) + (n.k && n.k.length ? mapList(n.k) : '') + '</li>'; }).join('') + '</ul>';
  }
  function tMap(t) {
    var m = t.map;
    return '<div class="panel"><div class="maproot">' + fmt(m.t) + pg(m.p) + '</div><div class="branches">' +
      m.k.map(function (b) { return '<div class="branch"><div class="bt">' + fmt(b.t) + pg(b.p) + '</div>' + (b.k && b.k.length ? mapList(b.k) : '') + '</div>'; }).join('') +
      '</div></div>';
  }
  function tTable(t) {
    if (!t.tables) return '<div class="note"><strong>لا يوجد جدول مقارنة لهذا المحور.</strong> ' + esc(t.noTable) + '</div>';
    return t.tables.map(function (tb) {
      var h = '<div class="scroll"><div class="tblcap">' + esc(tb.title) + pg(tb.pages || tb.p) + '</div><table><thead><tr>';
      tb.head.forEach(function (c) { h += '<th scope="col">' + esc(c) + '</th>'; });
      h += '</tr></thead><tbody>';
      tb.rows.forEach(function (r) { h += '<tr>' + r.map(function (c) { return '<td>' + fmt(c) + '</td>'; }).join('') + '</tr>'; });
      return h + '</tbody></table>' + (tb.note ? '<div class="tbl-note">' + esc(tb.note) + '</div>' : '') + '</div>';
    }).join('');
  }
  function tTerms(t) {
    var h = '<div class="terms">';
    t.terms.forEach(function (x, i) {
      h += '<div class="term"><span class="q">' + fmt(x[0]) + '</span><button data-act="toggle" aria-expanded="false" aria-controls="ta-' + t.id + '-' + i + '">أظهر الجواب</button>' +
        '<div class="a" id="ta-' + t.id + '-' + i + '" hidden>' + fmt(x[1]) + pg(x[2]) + '</div></div>';
    });
    return h + '</div>';
  }
  var qNum = 0;
  function tQuiz(t, ti) {
    var s = stats(ti), qs = topicQs(ti);
    var h = '<p class="small">' + countQ(s.total) + ' · أجبت عن ' + AR(s.answered) + ' · صحيحة ' + AR(s.right) + '</p>';
    qs.forEach(function (q) { h += qCard(q, ++qNum); });
    return h;
  }
  var INTRO = {
    summary: 'ملخصات المحاور الأحد عشر بترتيب المذكرة. ضع علامة «قرأت» بعد كل محور ليُحتسب في تقدّمك.',
    map: 'تعرض كل خريطة العلاقات بين عناصر محورها كما رتّبتها المذكرة؛ رقم الصفحة بجانب العنصر، وما لم يُرقَّم يتبع صفحة العنصر الأعلى.',
    table: 'جداول المقارنة التي يتيحها المصدر في كل محور، وحيث لا مادة لمقارنة صريحة يُذكر ذلك.',
    terms: 'حاول استرجاع الجواب قبل إظهاره.',
    quiz: 'أسئلة المقرر كلها مقسّمة بحسب المحاور. بعد كل إجابة يظهر الصحيح والتعليل ورقم الصفحة.'
  };
  function activityView(tab) {
    var label = TABS.filter(function (x) { return x[0] === tab; })[0][1], fn = { summary: tSummary, map: tMap, table: tTable, terms: tTerms, quiz: tQuiz }[tab];
    var h = '<div class="thead"><div class="eyebrow">المقرر كاملًا · ' + label + '</div><h1>' + label + '</h1><p class="small">' + INTRO[tab] + '</p></div>';
    if (tab === 'terms') h += '<div class="actions"><button data-act="showall">أظهر كل الأجوبة</button><button data-act="hideall">أخفِ كل الأجوبة</button></div>';
    if (tab === 'quiz') {
      var o = overall();
      h += '<div class="quiz-progress"><span class="stat"><b>' + AR(o.answered) + ' / ' + AR(o.total) + '</b>أُجيب عنها</span><span class="stat"><b>' + AR(o.right) + '</b>صحيحة</span>' +
        '<span class="grow">' + bar(pct(o.answered, o.total)) + '</span>' + (o.answered ? '<button class="ic" data-act="retry">' + ic('retry') + 'أعد التدريب كله</button>' : '') + '</div>';
      qNum = 0;
    }
    T.forEach(function (t, i) {
      h += '<section class="unit" id="s-' + t.id + '"><h2 class="unit-h"><span class="unum">' + AR(i + 1) + '</span><span>' + esc(t.title) + '<span class="small"> · ' + range(t) + '</span></span></h2>' + fn(t, i) + '</section>';
    });
    if (tab === 'quiz' && overall().answered === QS.length) h += '<div class="note">أتممت أسئلة المقرر كلها: ' + AR(overall().right) + ' من ' + AR(QS.length) + ' صحيحة. راجع الأخطاء من بنك الأسئلة (أخطأت فيها)، أو جرّب الاختبار الشامل.</div>';
    return h + nextStep(tab);
  }
  function nextStep(tab) {
    var ti = TABS.map(function (x) { return x[0]; }).indexOf(tab), href, txt, btn;
    if (ti < TABS.length - 1) { href = '#' + TABS[ti + 1][0]; txt = TABS[ti + 1][1]; btn = TABS[ti + 1][0] === 'quiz' ? 'ابدأ التدريب' : 'التالي'; }
    else { href = '#mock'; txt = 'الاختبار الشامل في المقرر كله'; btn = 'الاختبار الشامل'; }
    var prev = ti > 0 ? '<button class="ic" data-go="#' + TABS[ti - 1][0] + '">' + ic('prev') + TABS[ti - 1][1] + '</button>' : '';
    return '<div class="next">' + prev + '<span class="lbl">الخطوة التالية<b>' + esc(txt) + '</b></span><button class="primary ic" data-go="' + href + '">' + btn + ic('next') + '</button></div>';
  }
  function asideFor(tab) {
    var ti = TABS.map(function (x) { return x[0]; }).indexOf(tab), a = actStats(), o = overall();
    $('#chapterContext').innerHTML = '<button class="back-link" data-go="#home">‹ صفحة المقرر</button><span class="ctx-num">' + AR(ti + 1) + '</span><span class="ctx-name">المقرر كاملًا · النشاط ' + AR(ti + 1) + ' من ' + AR(TABS.length) + '</span><strong>' + TABS[ti][1] + '</strong>';
    $('#nav').innerHTML = TABS.map(function (x) {
      var cnt = x[0] === 'quiz' ? '<span class="cnt">' + AR(a.quiz) + '/' + AR(QS.length) + '</span>' : x[0] === 'summary' ? '<span class="cnt">' + AR(a.summary) + '/' + AR(T.length) + '</span>' : '';
      return '<button data-go="#' + x[0] + '"' + (x[0] === tab ? ' class="active" aria-current="page"' : '') + '><span class="nav-glyph">' + ic(x[2]) + '</span>' + x[1] + cnt + '</button>';
    }).join('');
    $('#jump').innerHTML = '<label for="jumpSel" class="small">انتقل إلى محور في هذه الصفحة</label><select id="jumpSel" data-jump="1"><option value="">اختر محورًا…</option>' +
      T.map(function (t, i) { return '<option value="' + t.id + '">' + AR(i + 1) + '. ' + esc(t.title) + '</option>'; }).join('') + '</select>';
    $('#progressText').textContent = AR(o.pct) + '٪';
    $('#progressBar').innerHTML = bar(o.pct);
  }

  /* ───── بنك الأسئلة ───── */
  function bankView() {
    var b = get('bank', { topic: 'all', type: 'all', status: 'all', view: 'practice' });
    var pool = QS.filter(function (q) {
      var a = S.ans[q.id];
      return (b.topic === 'all' || q.ti === +b.topic) && (b.type === 'all' || q.kind === b.type) &&
        (b.status === 'all' || (b.status === 'unanswered' && !a) || (b.status === 'wrong' && a && !a.ok));
    });
    var answered = pool.filter(function (q) { return S.ans[q.id]; }).length, right = pool.filter(function (q) { return S.ans[q.id] && S.ans[q.id].ok; }).length;
    var h = '<div class="thead"><div class="eyebrow">المقرر كله</div><h1>بنك الأسئلة</h1><p class="small">' + countQ(QS.length) + ' من المحاور الأحد عشر. صفِّ بالمحور ونوع السؤال وحالته، ثم تدرّب أو اعرض الأسئلة بإجاباتها. إجاباتك هنا هي إجاباتك نفسها في تدريب كل محور.</p></div>';
    h += '<div class="scopebar"><label for="bkTopic">المحور</label><select id="bkTopic" data-bank="topic"><option value="all">كل المحاور</option>' +
      T.map(function (t, i) { return '<option value="' + i + '"' + (String(b.topic) === String(i) ? ' selected' : '') + '>' + AR(i + 1) + '. ' + esc(t.title) + '</option>'; }).join('') + '</select></div>';
    h += '<div class="scopebar"><label for="bkType">النوع</label><select id="bkType" data-bank="type">' + [['all', 'كل الأنواع'], ['m', 'اختيار من متعدد'], ['f', 'صح أو خطأ']].map(function (o) { return '<option value="' + o[0] + '"' + (b.type === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select>' +
      '<label for="bkStatus">الحالة</label><select id="bkStatus" data-bank="status">' + [['all', 'جميع الأسئلة'], ['unanswered', 'لم أجب عنها'], ['wrong', 'أخطأت فيها']].map(function (o) { return '<option value="' + o[0] + '"' + (b.status === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select></div>';
    h += '<p class="small" aria-live="polite"><strong>' + (pool.length ? countQ(pool.length) : 'لا أسئلة') + '</strong> في نطاق التصفية' + (pool.length ? ' · أجبت عن ' + AR(answered) + ' · صحيحة ' + AR(right) : '') + '.</p>';
    h += '<div class="seg" role="group" aria-label="طريقة العرض"><button class="' + (b.view === 'practice' ? 'on' : '') + '" aria-pressed="' + (b.view === 'practice') + '" data-act="bankview" data-v="practice">تدرّب على الأسئلة</button><button class="' + (b.view === 'review' ? 'on' : '') + '" aria-pressed="' + (b.view === 'review') + '" data-act="bankview" data-v="review">اعرضها بإجاباتها</button></div>';
    if (!pool.length) h += '<section class="panel empty-box">' + (b.status === 'wrong' ? 'لا أخطاء مسجّلة في هذا النطاق. اختر «جميع الأسئلة» أو غيّر المحور.' : b.status === 'unanswered' ? 'أجبت عن جميع أسئلة هذا النطاق. اختر «جميع الأسئلة» لمراجعتها.' : 'لا أسئلة في هذا النطاق.') + '</section>';
    else if (b.view === 'review') h += pool.map(function (q, i) { return reviewItem(q, i + 1, S.ans[q.id] ? S.ans[q.id].c : null, true, true); }).join('');
    else h += pool.map(function (q, i) { return qCard(q, i + 1, true); }).join('');
    return h;
  }

  /* ───── الاختبار الشامل ───── */
  var timerHandle = null;
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var x = a[i]; a[i] = a[j]; a[j] = x; } return a; }
  function drawExam(tis, count) {
    var pools = tis.map(function (ti) { return shuffle(topicQs(ti)); });
    var total = pools.reduce(function (s, p) { return s + p.length; }, 0);
    count = Math.min(count, total);
    var alloc = pools.map(function (p) { return Math.floor(p.length / total * count); });
    var k = 0;
    while (alloc.reduce(function (a, b) { return a + b; }, 0) < count) { var i = k % pools.length; if (alloc[i] < pools[i].length) alloc[i]++; k++; }
    var ids = [];
    pools.forEach(function (p, i) { ids = ids.concat(p.slice(0, alloc[i]).map(function (q) { return q.id; })); });
    return shuffle(ids);
  }
  function finishExam(e, timeout) {
    e.submitted = true; e.finishedAt = Math.min(Date.now(), e.end); e.timeout = !!timeout; e.confirm = false;
    var score = e.ids.filter(function (id) { return e.ans[id] === Q[id].correct; }).length;
    e.result = { score: score, total: e.ids.length };
    set('exam', e);
    var hist = get('hist', []); hist.unshift({ d: e.finishedAt, s: score, t: e.ids.length, used: e.finishedAt - e.start }); set('hist', hist.slice(0, 10));
  }
  function examRunning(e) {
    var q = Q[e.ids[e.cur]], n = e.ids.length, answered = Object.keys(e.ans).length;
    var opts = q.opts.map(function (o, i) {
      return '<button class="quiz-option' + (e.ans[q.id] === i ? ' chosen' : '') + '" role="radio" aria-checked="' + (e.ans[q.id] === i) + '" data-act="expick" data-k="' + i + '">' +
        (q.kind === 'm' ? '<span class="option-letter" aria-hidden="true">' + LET[i] + '</span>' : '') + '<span>' + fmt(o) + '</span></button>';
    }).join('');
    var conf = e.confirm ? '<section class="confirm block" role="alertdialog" aria-labelledby="cfT"><h3 id="cfT">قبل التسليم</h3><p>' +
      (n - answered ? 'لم تجب عن ' + countQ(n - answered) + '، ودرجة السؤال المتروك صفر.' : 'أجبت عن جميع الأسئلة.') + ' بعد التسليم يظهر التصحيح ولا يمكن تعديل الإجابات.</p>' +
      '<div class="actions" style="margin-bottom:0"><button class="primary" data-act="exsubmit">تأكيد التسليم</button><button data-act="exconfirm" data-v="0">عودة إلى الأسئلة</button></div></section>' : '';
    return '<div class="timerbar"><span class="timer' + (e.end - Date.now() < 60000 ? ' low' : '') + '" id="timer" role="timer" aria-label="الوقت المتبقي">' + ic('exam') + '<span>' + fmtTime(e.end - Date.now()) + '</span></span>' +
      '<span class="small">أجبت عن ' + AR(answered) + ' من ' + AR(n) + '</span><button class="primary" data-act="exconfirm" data-v="1">سلّم الاختبار</button></div>' + conf +
      '<article class="qcard mock-q"><div class="qmeta"><span class="badge counter">سؤال ' + AR(e.cur + 1) + ' من ' + AR(n) + '</span><span class="badge ch-badge">المحور ' + AR(q.ti + 1) + '</span><span class="badge">' + (q.kind === 'm' ? 'اختيار من متعدد' : 'صح أو خطأ') + '</span></div>' +
      '<p class="qtext" id="exq">' + fmt(q.text) + '</p><div class="opts-list' + (q.kind === 'f' ? ' tf' : '') + '" role="radiogroup" aria-labelledby="exq">' + opts + '</div>' +
      (e.ans[q.id] != null ? '<button style="margin-top:10px" data-act="exclear">امسح إجابتي</button>' : '') + '</article>' +
      '<div class="actions"><button class="ic" data-act="exgo" data-v="' + (e.cur - 1) + '"' + (e.cur === 0 ? ' disabled' : '') + '>' + ic('prev') + 'السابق</button>' +
      '<button class="primary ic" data-act="exgo" data-v="' + (e.cur + 1) + '"' + (e.cur === n - 1 ? ' disabled' : '') + '>التالي' + ic('next') + '</button></div>' +
      '<div class="quiz-numbers" aria-label="الانتقال إلى سؤال">' + e.ids.map(function (id, i) {
        return '<button class="' + (i === e.cur ? 'current ' : '') + (e.ans[id] != null ? 'answered' : '') + '" aria-label="سؤال ' + AR(i + 1) + (e.ans[id] != null ? '، مجاب' : '، دون إجابة') + '" data-act="exgo" data-v="' + i + '">' + AR(i + 1) + (e.ans[id] != null ? ' •' : '') + '</button>';
      }).join('') + '</div><div class="legend-row"><span><i class="a"></i>أُجيب عنه (•)</span><span><i></i>دون إجابة</span></div>' +
      '<p class="small">يمكنك التنقل وتعديل الإجابات قبل التسليم، ولا يظهر التصحيح أثناء الاختبار. يُحفظ كل اختيار فورًا، ويستمر الوقت إذا غادرت الصفحة. لا يغيّر الاختبار إحصاءات التدريب.</p>';
  }
  function examResult(e) {
    var r = e.result, unanswered = e.ids.filter(function (id) { return e.ans[id] == null; }).length, wrong = r.total - r.score - unanswered;
    var per = {};
    e.ids.forEach(function (id) { var q = Q[id], p = per[q.ti] = per[q.ti] || { t: 0, c: 0, b: 0, n: 0 }; p.t++; if (e.ans[id] == null) p.n++; else if (e.ans[id] === q.correct) p.c++; else p.b++; });
    var filter = e.filter || 'all';
    var list = e.ids.map(function (id, i) { return { q: Q[id], i: i, c: e.ans[id] }; }).filter(function (x) { return filter === 'all' || x.c !== x.q.correct; });
    return '<section class="panel"><div class="eyebrow">النتيجة' + (e.timeout ? ' · انتهى الوقت فصُحّحت المحاولة تلقائيًّا' : '') + '</div>' +
      '<p class="score-big">' + AR(r.score) + ' / ' + AR(r.total) + ' <span class="small">(' + AR(pct(r.score, r.total)) + '٪)</span></p>' +
      '<div class="score-grid"><div class="kpi"><span class="k-label">صحيحة</span><span class="k-val">' + AR(r.score) + '</span></div><div class="kpi"><span class="k-label">خاطئة</span><span class="k-val">' + AR(wrong) + '</span></div>' +
      '<div class="kpi"><span class="k-label">متروكة</span><span class="k-val">' + AR(unanswered) + '</span></div><div class="kpi"><span class="k-label">الوقت المستغرق</span><span class="k-val">' + fmtTime(e.finishedAt - e.start) + '</span><span class="k-sub">من ' + fmtTime(e.dur) + '</span></div></div>' +
      '<p class="small">درجة واحدة لكل إجابة صحيحة، ولا خصم على الخطأ، والسؤال المتروك درجته صفر. النتيجة تقيس هذه المحاولة التدريبية، ولا تتنبأ بدرجة الاختبار الفعلي.</p>' +
      '<h3>النتيجة بحسب المحور</h3><div class="scroll"><table class="result-table"><thead><tr><th scope="col">المحور</th><th scope="col">الأسئلة</th><th scope="col">صحيحة</th><th scope="col">خاطئة</th><th scope="col">متروكة</th></tr></thead><tbody>' +
      Object.keys(per).sort(function (a, b) { return a - b; }).map(function (ti) { var p = per[ti]; return '<tr><td><button class="row-link" data-go="#summary" data-sec="' + T[ti].id + '">' + AR(+ti + 1) + '. ' + esc(T[ti].title) + '</button></td><td>' + AR(p.t) + '</td><td>' + AR(p.c) + '</td><td>' + AR(p.b) + '</td><td>' + AR(p.n) + '</td></tr>'; }).join('') +
      '</tbody></table></div><div class="actions"><button class="primary ic" data-act="exretry">' + ic('retry') + 'أعد الاختبار بأسئلة مسحوبة جديدة</button><button data-act="exnew">إعداد جديد</button></div></section>' +
      '<div class="sectionhead"><h2>مراجعة الإجابات</h2><div class="seg" role="group" aria-label="تصفية المراجعة"><button class="' + (filter === 'all' ? 'on' : '') + '" aria-pressed="' + (filter === 'all') + '" data-act="exfilter" data-v="all">كل الأسئلة</button><button class="' + (filter === 'bad' ? 'on' : '') + '" aria-pressed="' + (filter === 'bad') + '" data-act="exfilter" data-v="bad">الأخطاء والمتروكة (' + AR(wrong + unanswered) + ')</button></div></div>' +
      (list.length ? list.map(function (x) { return reviewItem(x.q, x.i + 1, x.c == null ? null : x.c, false, true); }).join('') : '<p class="panel empty-box">لا أخطاء ولا أسئلة متروكة في هذه المحاولة.</p>');
  }
  function historyHtml() {
    var h = get('hist', []);
    if (!h.length) return '';
    return '<section class="panel"><h3>محاولاتك السابقة</h3><ol class="history">' + h.map(function (x) {
      var d; try { d = new Date(x.d).toLocaleDateString('ar-SA-u-nu-arab', { day: 'numeric', month: 'long' }); } catch (err) { d = ''; }
      return '<li>' + d + ' — ' + AR(x.s) + ' من ' + AR(x.t) + ' (' + AR(pct(x.s, x.t)) + '٪) في ' + fmtTime(x.used) + '</li>';
    }).join('') + '</ol></section>';
  }
  function mockView() {
    var e = get('exam', null);
    if (e && !e.submitted && Date.now() >= e.end) { finishExam(e, true); e = get('exam', null); }
    var h = '<div class="thead"><div class="eyebrow">المقرر كله</div><h1>الاختبار الشامل</h1><p class="small">أسئلة من المحاور التي تختارها في جولة واحدة موقوتة، مع نتيجة مفصلة لكل محور. المحاكاة للتدريب وليست نموذجًا رسميًّا للاختبار.</p></div>';
    if (e && !e.submitted) return h + examRunning(e);
    if (e && e.submitted) return h + examResult(e) + historyHtml();
    var sel = get('mockSel', { topics: T.map(function (t, i) { return i; }), count: 20 });
    var avail = QS.filter(function (q) { return sel.topics.indexOf(q.ti) > -1; }).length;
    var counts = [10, 20, 30, 40].filter(function (c) { return c < avail; }); if (avail) counts.push(avail);
    var count = Math.min(sel.count, avail);
    if (counts.indexOf(count) < 0 && counts.length) count = counts[counts.length - 1];
    return h + '<section class="panel"><h2>إعداد الجولة</h2><p>تُوزَّع الأسئلة على المحاور المختارة بنسبة عدد أسئلة كل محور، وتُسحب عشوائيًّا دون تكرار، وتشمل الاختيار من متعدد والصح والخطأ. لكل سؤال دقيقة واحدة.</p>' +
      '<fieldset class="chips"><legend>المحاور المشمولة</legend>' + T.map(function (t, i) {
        return '<label class="chip" title="' + esc(t.title) + '"><input type="checkbox" data-act="mocktopic" data-v="' + i + '"' + (sel.topics.indexOf(i) > -1 ? ' checked' : '') + '><span>' + AR(i + 1) + '</span><span class="sr-only">' + esc(t.title) + '</span></label>';
      }).join('') + '</fieldset><div class="actions" style="margin-top:-6px"><button data-act="mockall">اختر كل المحاور</button></div>' +
      '<label for="mockCount"><strong>عدد الأسئلة والمدة</strong></label><br><select id="mockCount" data-mock="count"' + (avail ? '' : ' disabled') + '>' +
      (avail ? counts.map(function (c) { return '<option value="' + c + '"' + (c === count ? ' selected' : '') + '>' + countQ(c) + ' في ' + AR(c) + ' دقيقة' + (c === avail ? ' (كل أسئلة المحاور المختارة)' : '') + '</option>'; }).join('') : '<option>اختر محورًا واحدًا على الأقل</option>') + '</select>' +
      '<p class="small">في المحاور المختارة ' + countQ(avail) + ' متاحًا.</p><button class="primary ic" data-act="mockstart"' + (avail ? '' : ' disabled') + '>' + ic('play') + 'ابدأ الاختبار الشامل</button></section>' +
      '<section class="panel"><h3>قبل أن تبدأ</h3><p>لا تظهر التصحيحات حتى تسلّم الجولة أو ينتهي الوقت. درجة واحدة لكل سؤال، ولا خصم على الخطأ، والسؤال المتروك درجته صفر.</p><p style="margin:0">يستمر الوقت إذا غادرت الصفحة، ويمكنك العودة لإكمال الجولة من المتصفح نفسه.</p></section>' + historyHtml();
  }
  function startTimer() {
    clearInterval(timerHandle); timerHandle = null;
    var e = get('exam', null);
    if (!e || e.submitted || !$('#timer')) return;
    timerHandle = setInterval(function () {
      var el = $('#timer'); if (!el) { clearInterval(timerHandle); timerHandle = null; return; }
      var left = e.end - Date.now();
      el.querySelector('span').textContent = fmtTime(left); el.classList.toggle('low', left < 60000);
      if (left <= 0) { clearInterval(timerHandle); timerHandle = null; finishExam(get('exam', e), true); rerender(); }
    }, 1000);
  }

  /* ───── التقدّم والملاحظات ───── */
  function progressView() {
    var o = overall();
    var h = '<div class="thead"><div class="eyebrow">المقرر كله</div><h1>تقدّمي</h1><p class="small">يُحسب التقدّم من قراءة ملخص كل محور والإجابة عن أسئلته، ويُحفظ في هذا المتصفح فقط. نتائج الاختبار الشامل منفصلة ولا تدخل فيه.</p></div>';
    if (!storageOK) h += '<div class="note">تعذّر الحفظ في هذا المتصفح (قد يكون التخزين معطّلًا)؛ سيضيع التقدّم عند إغلاق الصفحة.</div>';
    h += '<section class="panel"><div class="score-grid"><div class="kpi"><span class="k-label">التقدّم الإجمالي</span><span class="k-val">' + AR(o.pct) + '٪</span></div>' +
      '<div class="kpi"><span class="k-label">أسئلة أُجيب عنها</span><span class="k-val">' + AR(o.answered) + '</span><span class="k-sub">من ' + AR(o.total) + '</span></div>' +
      '<div class="kpi"><span class="k-label">إجابات صحيحة</span><span class="k-val">' + AR(o.right) + '</span></div>' +
      '<div class="kpi"><span class="k-label">ملخصات مقروءة</span><span class="k-val">' + AR(T.filter(function (t) { return S.read[t.id]; }).length) + '</span><span class="k-sub">من ' + AR(T.length) + '</span></div></div>' +
      bar(o.pct) + '<div class="actions"><button class="primary ic" ' + goAttr(resumeTarget()) + '>' + ic('play') + resumeTarget().btn + '</button></div></section>';
    h += '<div class="sectionhead"><h2>التقدّم بحسب المحاور</h2></div><div class="scroll"><table class="result-table"><thead><tr><th scope="col">المحور</th><th scope="col">الملخص</th><th scope="col">الأسئلة</th><th scope="col">الصحيح</th><th scope="col">التقدّم</th></tr></thead><tbody>';
    T.forEach(function (t, i) {
      var s = stats(i);
      h += '<tr><td><button class="row-link" data-go="#summary" data-sec="' + t.id + '">' + AR(i + 1) + '. ' + esc(t.title) + '</button></td><td>' + (s.read ? 'مقروء' : '—') + '</td><td>' + AR(s.answered) + ' / ' + AR(s.total) + '</td><td>' + AR(s.right) + '</td><td>' + AR(s.pct) + '٪' + bar(s.pct) + '</td></tr>';
    });
    h += '</tbody></table></div><section class="panel"><h2>مسح التقدّم</h2><p>يحذف علامات القراءة وكل إجابات التدريب ونتائج الاختبار الشامل المحفوظة في هذا المتصفح. لا يمكن التراجع عنه.</p><button class="danger" data-act="reset">امسح التقدّم كله</button></section>';
    return h;
  }
  function notesView() {
    var h = '<div class="thead"><div class="eyebrow">عن المقرر</div><h1>ملاحظات على المصدر</h1><p class="small">' + esc(D.course.title) + ' — ' + esc(D.course.subtitle) + '، إعداد ' + esc(D.course.author) + '.</p></div>' +
      '<section class="panel"><ul class="srcinfo">' + D.sourceInfo.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') +
      '<li>الأسئلة والتعليلات صياغات تعليمية مقترحة مبنية على نص المذكرة، وليست أسئلة رسمية ولا توقعات للاختبار.</li></ul></section>';
    [['issue', 'اضطراب أو التباس في المذكرة نفسها', 'عُرض كما ورد، دون حسم من الموقع.'], ['diff', 'اختلافات بين PDF والنص المستخرج', 'اعتُمد في الموقع نص PDF.']].forEach(function (g) {
      h += '<div class="sectionhead"><h2>' + g[1] + '</h2><span class="small">' + g[2] + '</span></div><div class="notes">';
      D.notes.filter(function (n) { return n.kind === g[0]; }).forEach(function (n) { h += '<div class="item"><span class="t">' + esc(n.t) + '</span>' + pg(n.p) + '<div>' + fmt(n.d) + '</div></div>'; });
      h += '</div>';
    });
    return h;
  }

  /* ───── الوضع الليلي ───── */
  function nightOn() { return document.documentElement.getAttribute('data-night-mode') === 'true'; }
  function initNight() {
    var v = get('night', null), d = document.documentElement;
    var sys = d.getAttribute('data-theme') === 'dark' || (d.getAttribute('data-theme') !== 'light' && window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches);
    d.setAttribute('data-night-mode', (v === true || (v === null && sys)) ? 'true' : 'false');
    paintNight();
  }
  function paintNight() {
    var on = nightOn(), b = $('#nightBtn');
    if (!b) return;
    b.setAttribute('aria-checked', on);
    $('#nightGlyph').innerHTML = ic(on ? 'moon' : 'sun');
    $('#nightTrack').classList.toggle('on', on);
  }

  /* ───── التوجيه ───── */
  var pendingSec = null;
  function route(keepScroll) {
    clearInterval(timerHandle); timerHandle = null;
    var h = (location.hash || '').replace(/^#\/?/, ''), html, top = 'course', title = 'مسار · ' + D.course.title;
    var legacy = /^(t\d+)-([a-z]+)$/.exec(h);   // روابط النسخة السابقة: #t3-quiz
    if (legacy && topicById(legacy[1]) > -1) { pendingSec = legacy[1]; history.replaceState(null, '', '#' + legacy[2]); h = legacy[2]; }
    var isAct = TABS.some(function (x) { return x[0] === h; });
    document.body.classList.toggle('global-mode', !isAct);
    if (isAct) { html = activityView(h); asideFor(h); title = TABS.filter(function (x) { return x[0] === h; })[0][1] + ' · مسار'; }
    else if (h === 'bank') { html = bankView(); top = 'bank'; title = 'بنك الأسئلة · ' + title; }
    else if (h === 'mock') { html = mockView(); top = 'mock'; title = 'الاختبار الشامل · ' + title; }
    else if (h === 'progress') { html = progressView(); top = 'progress'; title = 'تقدّمي · ' + title; }
    else if (h === 'notes') { html = notesView(); top = 'notes'; title = 'ملاحظات على المصدر · ' + title; }
    else html = courseView();
    main.innerHTML = html;
    document.title = title;
    [].forEach.call(document.querySelectorAll('[data-top]'), function (b) {
      var on = b.getAttribute('data-top') === top;
      b.classList.toggle('active', on);
      if (on) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
    });
    startTimer();
    if (pendingSec && isAct) { var el = document.getElementById('s-' + pendingSec); pendingSec = null; if (el) { el.scrollIntoView(); return; } }
    pendingSec = null;
    if (!keepScroll) { window.scrollTo(0, 0); main.focus({ preventScroll: true }); }
  }
  function rerender() { var y = window.scrollY; route(true); window.scrollTo(0, y); }

  /* ───── الأحداث ───── */
  document.addEventListener('click', function (ev) {
    var g = ev.target.closest('[data-go]');
    if (g) { ev.preventDefault(); pendingSec = g.getAttribute('data-sec') || null; go(g.getAttribute('data-go')); return; }
    var b = ev.target.closest('[data-act]'); if (!b) return;
    var act = b.getAttribute('data-act'), v = b.getAttribute('data-v');
    if (act === 'night') { var on = !nightOn(); document.documentElement.setAttribute('data-night-mode', on ? 'true' : 'false'); set('night', on); paintNight(); return; }
    if (act === 'read' || act === 'unread') { var tid = b.getAttribute('data-t'); if (act === 'read') S.read[tid] = true; else delete S.read[tid]; save(); rerender(); }
    else if (act === 'toggle') { var a = b.parentNode.querySelector('.a'), show = a.hidden; a.hidden = !show; b.textContent = show ? 'أخفِ الجواب' : 'أظهر الجواب'; b.setAttribute('aria-expanded', show); }
    else if (act === 'showall' || act === 'hideall') {
      [].forEach.call(main.querySelectorAll('.term'), function (el) { var s = act === 'showall', a2 = el.querySelector('.a'), bt = el.querySelector('button'); a2.hidden = !s; bt.textContent = s ? 'أخفِ الجواب' : 'أظهر الجواب'; bt.setAttribute('aria-expanded', s); });
    } else if (act === 'ans') {
      var id = b.closest('[data-q]').getAttribute('data-q'), q = Q[id], k = +b.getAttribute('data-k');
      if (S.ans[id]) return;
      S.ans[id] = { c: k, ok: k === q.correct }; save(); rerender();
    } else if (act === 'retry' || act === 'reset') {
      var box = document.createElement('span'); box.className = 'confirm';
      box.innerHTML = '<span>' + (act === 'retry' ? 'ستُحذف إجاباتك في أسئلة المقرر كلها.' : 'سيُحذف تقدّمك كله، ولا يمكن التراجع.') + '</span><button class="danger" data-act="' + act + '-yes">' + (act === 'retry' ? 'نعم، أعد التدريب' : 'نعم، امسح') + '</button><button data-act="cancel">إلغاء</button>';
      b.replaceWith(box); box.querySelector('button').focus();
    } else if (act === 'cancel') rerender();
    else if (act === 'retry-yes') { S.ans = {}; save(); route(); }
    else if (act === 'reset-yes') { S = blank(); save(); set('exam', null); set('hist', []); route(); }
    else if (act === 'bankview') { var bs = get('bank', { topic: 'all', type: 'all', status: 'all', view: 'practice' }); bs.view = v; set('bank', bs); route(); }
    else if (act === 'mockall') { var s0 = get('mockSel', { topics: [], count: 20 }); s0.topics = T.map(function (x, i) { return i; }); set('mockSel', s0); rerender(); }
    else if (act === 'mockstart') {
      var sel = get('mockSel', { topics: T.map(function (x, i) { return i; }), count: 20 }), cnt = +$('#mockCount').value;
      var ids = drawExam(sel.topics, cnt), now = Date.now();
      set('exam', { ids: ids, ans: {}, cur: 0, start: now, end: now + ids.length * 60000, dur: ids.length * 60000, submitted: false });
      route();
    } else if (/^ex/.test(act)) {
      var e = get('exam', null); if (!e) return;
      if (act === 'expick') e.ans[e.ids[e.cur]] = +b.getAttribute('data-k');
      else if (act === 'exclear') delete e.ans[e.ids[e.cur]];
      else if (act === 'exgo') e.cur = Math.max(0, Math.min(e.ids.length - 1, +v));
      else if (act === 'exconfirm') e.confirm = v === '1';
      else if (act === 'exsubmit') { finishExam(e, false); route(); return; }
      else if (act === 'exfilter') e.filter = v;
      else if (act === 'exnew') { set('exam', null); route(); return; }
      else if (act === 'exretry') { var tis = []; e.ids.forEach(function (x) { if (tis.indexOf(Q[x].ti) < 0) tis.push(Q[x].ti); }); var ids2 = drawExam(tis, e.ids.length), n2 = Date.now(); set('exam', { ids: ids2, ans: {}, cur: 0, start: n2, end: n2 + ids2.length * 60000, dur: ids2.length * 60000, submitted: false }); route(); return; }
      set('exam', e); if (act === 'exgo' || act === 'exconfirm') route(); else rerender();
    }
  });
  document.addEventListener('change', function (ev) {
    var el = ev.target;
    if (el.hasAttribute('data-jump')) { var sec = document.getElementById('s-' + el.value); if (sec) { sec.scrollIntoView(); var hd = sec.querySelector('.unit-h'); if (hd) { hd.setAttribute('tabindex', '-1'); hd.focus({ preventScroll: true }); } } el.value = ''; }
    else if (el.hasAttribute('data-bank')) { var bs = get('bank', { topic: 'all', type: 'all', status: 'all', view: 'practice' }); bs[el.getAttribute('data-bank')] = el.value; set('bank', bs); rerender(); }
    else if (el.getAttribute('data-act') === 'mocktopic') {
      var s = get('mockSel', { topics: T.map(function (x, i) { return i; }), count: 20 }), i = +el.getAttribute('data-v');
      s.topics = s.topics.filter(function (x) { return x !== i; }); if (el.checked) s.topics.push(i); s.topics.sort(function (a, b) { return a - b; });
      set('mockSel', s); rerender();
    } else if (el.getAttribute('data-mock') === 'count') { var s2 = get('mockSel', { topics: T.map(function (x, i) { return i; }), count: 20 }); s2.count = +el.value; set('mockSel', s2); }
  });
  var skip = $('.skip-link');
  if (skip) skip.addEventListener('click', function (e) { e.preventDefault(); main.focus(); });
  window.addEventListener('hashchange', function () { route(); });

  /* ───── الرأس والشريط السفلي ───── */
  $('#brandMark').innerHTML = ic('mark', '0 0 32 32');
  [].forEach.call(document.querySelectorAll('[data-icon]'), function (el) { el.innerHTML = ic(el.getAttribute('data-icon')); });
  initNight();
  route(true);
})();
