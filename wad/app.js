/* منطق الموقع: التوجيه، العرض، التدريب، حفظ التقدم. لا يُكتب هنا أي محتوى تعليمي؛ المحتوى كله في data.js */
(function () {
  'use strict';
  var D = window.WAD, T = D.topics;
  var main = document.getElementById('main');
  var KEY = 'wad:progress';
  var TABS = [
    ['summary', 'الملخص'],
    ['map', 'خريطة المفاهيم'],
    ['table', 'جدول المقارنة'],
    ['terms', 'المصطلحات والأقوال'],
    ['quiz', 'التدريب']
  ];
  var LET = ['أ', 'ب', 'ج', 'د'];

  /* ───── التخزين ───── */
  var storageOK = true;
  function blank() { return { v: D.bankVersion, read: {}, ans: {} }; }
  function load() {
    try {
      var s = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (s && s.v === D.bankVersion && s.read && s.ans) return s;
    } catch (e) { storageOK = false; }
    return blank();
  }
  var S = load();
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(S)); storageOK = true; } catch (e) { storageOK = false; }
  }

  /* ───── أدوات ───── */
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function fmt(s) { return esc(s).replace(/\{[^{}]+\}/g, function (m) { return '<span class="ayah">' + m + '</span>'; }); }
  function pg(p) { return p == null || p === '' ? '' : '<span class="pg">ص ' + esc(p) + '</span>'; }
  function range(t) { return t.from === t.to ? 'ص ' + t.from : 'ص ' + t.from + '–' + t.to; }
  function topicById(id) { for (var i = 0; i < T.length; i++) if (T[i].id === id) return i; return -1; }
  function qid(t, kind, i) { return t.id + ':' + kind + i; }
  function allQ(t) {
    var a = [];
    t.mcq.forEach(function (q, i) { a.push(qid(t, 'm', i)); });
    t.tf.forEach(function (q, i) { a.push(qid(t, 'f', i)); });
    return a;
  }
  function stats(t) {
    var ids = allQ(t), answered = 0, right = 0;
    ids.forEach(function (id) { var a = S.ans[id]; if (a) { answered++; if (a.ok) right++; } });
    var read = !!S.read[t.id];
    var total = ids.length + 1;
    return { total: ids.length, answered: answered, right: right, read: read,
             pct: Math.round(((read ? 1 : 0) + answered) / total * 100) };
  }
  function overall() {
    var units = 0, done = 0, answered = 0, right = 0, totalQ = 0;
    T.forEach(function (t) {
      var s = stats(t); units += s.total + 1; done += s.answered + (s.read ? 1 : 0);
      answered += s.answered; right += s.right; totalQ += s.total;
    });
    return { pct: Math.round(done / units * 100), answered: answered, right: right, totalQ: totalQ };
  }
  function bar(p, cls) { return '<div class="bar' + (cls ? ' ' + cls : '') + '" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + p + '"><i style="width:' + p + '%"></i></div>'; }
  function firstUnfinished() {
    for (var i = 0; i < T.length; i++) { var s = stats(T[i]); if (s.pct < 100) return { i: i, s: s }; }
    return null;
  }
  function resumeHref() {
    var f = firstUnfinished();
    if (!f) return '#progress';
    return '#' + T[f.i].id + '-' + (f.s.read ? 'quiz' : 'summary');
  }

  /* ───── الصفحات ───── */
  function home() {
    var o = overall(), started = o.pct > 0, f = firstUnfinished();
    var label = !started ? 'ابدأ المذاكرة' : (f ? 'تابع المذاكرة' : 'راجع تقدّمك');
    var where = f && started ? '<p class="muted" style="margin-top:.8em">الخطوة التالية: المحور ' + (f.i + 1) + ' — ' + esc(T[f.i].title) + '</p>' : '';
    return '<div class="panel hero">' +
      '<div class="inst">' + esc(D.course.institution) + '</div>' +
      '<h1>' + esc(D.course.title) + '</h1>' +
      '<div class="sub">' + esc(D.course.subtitle) + '</div>' +
      '<div class="by">إعداد: <b>' + esc(D.course.author) + '</b><br><span class="muted">' + esc(D.course.authorRole) + '</span></div>' +
      '<div class="notice">هذا الموقع أداة مساعدة للمذاكرة، مبنية على المذكرة وحدها، ولا تغني عن الرجوع إليها. كل ملخص وسؤال وإجابة يحمل رقم صفحته المطبوعة في المذكرة.</div>' +
      '<a class="btn lg" href="' + resumeHref() + '">' + label + '</a>' + where +
      '<div class="hero-progress"><div class="row"><span>التقدّم الإجمالي</span><span>' + o.pct + '%</span></div>' + bar(o.pct) + '</div>' +
      '</div>' +
      '<div class="home-links">' + T.length + ' محورًا · ' + o.totalQ + ' سؤالًا · <a href="#topics">استعرض المحاور</a></div>';
  }

  function topics() {
    var h = '<h1>المحاور</h1><p class="muted">مرتّبة بحسب فهرس المذكرة (ص 1). لكل محور: ملخص، وخريطة مفاهيم، وجدول مقارنة إن أتاحه المصدر، وتدريب على المصطلحات، وأسئلة.</p><ol class="tlist">';
    T.forEach(function (t, i) {
      var s = stats(t);
      h += '<li><a href="#' + t.id + '-summary"><span class="num">' + (i + 1) + '</span>' +
        '<span><span class="tt">' + esc(t.title) + '</span><br><span class="meta">' + range(t) + ' · ' + s.total + ' سؤالًا</span></span>' +
        '<span class="prog">' + (s.pct === 100 ? 'مكتمل' : s.pct + '%') + bar(s.pct) + '</span></a></li>';
    });
    return h + '</ol>';
  }

  function side(cur) {
    var h = '<aside class="side" aria-label="محاور المقرر"><h2>المحاور</h2><ol>';
    T.forEach(function (t, i) {
      var s = stats(t);
      h += '<li><a href="#' + t.id + '-summary"' + (i === cur ? ' class="on" aria-current="page"' : '') + '><span class="n">' + (i + 1) + '</span><span>' + esc(t.title) + '</span>' + (s.pct === 100 ? '<span class="done">مكتمل</span>' : '') + '</a></li>';
    });
    return h + '</ol></aside>';
  }

  function nextStep(i, tab) {
    var ti = -1; TABS.forEach(function (x, k) { if (x[0] === tab) ti = k; });
    var t = T[i], href, txt;
    if (ti < TABS.length - 1) { href = '#' + t.id + '-' + TABS[ti + 1][0]; txt = TABS[ti + 1][1]; }
    else if (i < T.length - 1) { href = '#' + T[i + 1].id + '-summary'; txt = 'المحور ' + (i + 2) + ': ' + T[i + 1].title; }
    else { href = '#progress'; txt = 'راجع تقدّمك في المقرر'; }
    var prev = '';
    if (ti > 0) prev = '<a class="btn ghost" href="#' + t.id + '-' + TABS[ti - 1][0] + '">السابق: ' + TABS[ti - 1][1] + '</a>';
    else if (i > 0) prev = '<a class="btn ghost" href="#' + T[i - 1].id + '-quiz">السابق: تدريب المحور ' + i + '</a>';
    return '<div class="next">' + prev + '<span class="lbl">الخطوة التالية<b>' + esc(txt) + '</b></span><a class="btn" href="' + href + '">التالي</a></div>';
  }

  function tSummary(t) {
    var h = '<div class="panel sum">';
    t.summary.forEach(function (g) {
      h += '<h3>' + esc(g.h) + '</h3><ul>';
      g.pts.forEach(function (p) { h += '<li>' + fmt(p[0]) + pg(p[1]) + '</li>'; });
      h += '</ul>';
    });
    var read = !!S.read[t.id];
    h += '<div class="readrow">' + (read
      ? '<span class="ok">قرأت الملخص</span><button class="btn ghost" data-act="unread">إلغاء العلامة</button>'
      : '<button class="btn" data-act="read">أنهيت قراءة الملخص</button><span class="muted">يُحتسب في تقدّمك</span>') + '</div>';
    return h + '</div>';
  }

  function treeNode(n) {
    var h = '<li><span class="node">' + fmt(n.t) + pg(n.p) + '</span>';
    if (n.k && n.k.length) { h += '<ul>'; n.k.forEach(function (c) { h += treeNode(c); }); h += '</ul>'; }
    return h + '</li>';
  }
  function tMap(t) {
    return '<p class="muted">تعرض الخريطة العلاقات بين عناصر المحور كما رتّبتها المذكرة؛ رقم الصفحة بجانب العقدة، وما لم يُرقَّم يتبع صفحة العقدة الأم.</p>' +
      '<div class="panel"><ul class="tree">' + treeNode(t.map) + '</ul></div>';
  }

  function tTable(t) {
    if (!t.tables) return '<div class="empty"><b>لا يوجد جدول مقارنة لهذا المحور.</b><br>' + esc(t.noTable) + '</div>';
    return t.tables.map(function (tb) {
      var h = '<div class="tblwrap"><div class="tblcap">' + esc(tb.title) + pg(tb.pages || tb.p) + '</div><table><thead><tr>';
      tb.head.forEach(function (c) { h += '<th scope="col">' + esc(c) + '</th>'; });
      h += '</tr></thead><tbody>';
      tb.rows.forEach(function (r) { h += '<tr>' + r.map(function (c) { return '<td>' + fmt(c) + '</td>'; }).join('') + '</tr>'; });
      h += '</tbody></table>' + (tb.note ? '<div class="tblnote">' + esc(tb.note) + '</div>' : '') + '</div>';
      return h;
    }).join('');
  }

  function tTerms(t) {
    var h = '<p class="muted">حاول استرجاع الجواب قبل إظهاره.</p><div class="toolrow"><button class="btn ghost" data-act="showall">أظهر الكل</button><button class="btn ghost" data-act="hideall">أخفِ الكل</button></div><div class="terms">';
    t.terms.forEach(function (x, i) {
      h += '<div class="term"><span class="q">' + fmt(x[0]) + '</span><button data-act="toggle" aria-expanded="false" aria-controls="ta' + i + '">أظهر الجواب</button>' +
        '<div class="a" id="ta' + i + '" hidden>' + fmt(x[1]) + pg(x[2]) + '</div></div>';
    });
    return h + '</div>';
  }

  function qCard(t, kind, i, n) {
    var q = kind === 'm' ? t.mcq[i] : t.tf[i], id = qid(t, kind, i), a = S.ans[id];
    var opts = kind === 'm' ? q.o : ['صح', 'خطأ'];
    var correct = kind === 'm' ? q.c : (q.a ? 0 : 1);
    var h = '<div class="qcard" data-id="' + id + '"><div class="qn">سؤال ' + n + (kind === 'f' ? ' · صح أو خطأ' : '') + '</div>' +
      '<div class="qt">' + fmt(kind === 'm' ? q.q : q.s) + '</div><div class="opts' + (kind === 'f' ? ' tf' : '') + '">';
    opts.forEach(function (o, k) {
      var cls = 'opt';
      if (a) { if (k === correct) cls += ' right'; else if (k === a.c) cls += ' wrong'; }
      h += '<button class="' + cls + '" data-act="ans" data-k="' + k + '"' + (a ? ' disabled' : '') + '>' +
        (kind === 'm' ? '<span class="l">' + LET[k] + '</span>' : '') + '<span>' + fmt(o) + '</span></button>';
    });
    h += '</div>';
    if (a) {
      h += '<div class="fb ' + (a.ok ? 'ok' : 'no') + '" role="status"><span class="h">' + (a.ok ? 'إجابة صحيحة' : 'إجابة غير صحيحة — الصحيح: ' + esc(opts[correct])) + '</span>' +
        fmt(q.why) + pg(q.p) + '</div>';
    }
    return h + '</div>';
  }

  function tQuiz(t) {
    var s = stats(t);
    var h = '<div class="qsum"><span class="stat"><b>' + s.answered + ' / ' + s.total + '</b>أُجيب عنها</span>' +
      '<span class="stat"><b>' + s.right + '</b>صحيحة</span><span class="grow">' + bar(s.total ? Math.round(s.answered / s.total * 100) : 0, 'honey') + '</span>' +
      (s.answered ? '<button class="btn ghost" data-act="retry">أعد التدريب</button>' : '') + '</div>';
    var n = 0;
    h += '<h3 class="qgroup">اختيار من متعدد</h3>';
    t.mcq.forEach(function (q, i) { h += qCard(t, 'm', i, ++n); });
    h += '<h3 class="qgroup">صح أو خطأ</h3>';
    t.tf.forEach(function (q, i) { h += qCard(t, 'f', i, ++n); });
    if (s.answered === s.total) h += '<div class="notice">أتممت أسئلة هذا المحور: ' + s.right + ' من ' + s.total + ' صحيحة.' + (s.right < s.total ? ' راجع التعليلات وصفحاتها، ثم أعد التدريب إن شئت.' : '') + '</div>';
    return h;
  }

  function topicPage(i, tab) {
    var t = T[i], s = stats(t);
    var body = { summary: tSummary, map: tMap, table: tTable, terms: tTerms, quiz: tQuiz }[tab](t);
    var tabs = '<nav class="tabs" aria-label="أنشطة المحور">' + TABS.map(function (x) {
      var extra = x[0] === 'quiz' ? '<span class="k">' + s.answered + '/' + s.total + '</span>' : (x[0] === 'summary' && s.read ? '<span class="k">✓</span>' : '');
      return '<a href="#' + t.id + '-' + x[0] + '"' + (x[0] === tab ? ' class="on" aria-current="page"' : '') + '>' + x[1] + extra + '</a>';
    }).join('') + '</nav>';
    return '<div class="layout">' + side(i) + '<div>' +
      '<div class="crumb"><a href="#topics">المحاور</a> › المحور ' + (i + 1) + ' من ' + T.length + '</div>' +
      '<div class="thead"><h1>' + esc(t.title) + '</h1><div class="meta"><span>' + range(t) + ' من المذكرة</span>' +
      '<span>تقدّم المحور: ' + s.pct + '% ' + bar(s.pct) + '</span></div></div>' +
      tabs + '<div id="tabbody">' + body + '</div>' + nextStep(i, tab) + '</div></div>';
  }

  function progress() {
    var o = overall();
    var h = '<h1>تقدّمي</h1>';
    if (!storageOK) h += '<div class="notice">تعذّر الحفظ في هذا المتصفح (قد يكون التخزين معطّلًا)؛ سيضيع التقدّم عند إغلاق الصفحة.</div>';
    h += '<section class="panel big"><span class="pct">' + o.pct + '%</span><div style="flex:1;min-width:220px">' + bar(o.pct) +
      '<p class="muted" style="margin:.6em 0 0">أُجيب عن ' + o.answered + ' من ' + o.totalQ + ' سؤالًا، الصحيح منها ' + o.right + '. يُحسب التقدّم من قراءة ملخص كل محور والإجابة عن أسئلته.</p></div>' +
      '<a class="btn" href="' + resumeHref() + '">' + (firstUnfinished() ? 'تابع المذاكرة' : 'ابدأ من جديد') + '</a></section>';
    h += '<section><h2>التقدّم في كل محور</h2><div class="tblwrap"><table class="ptable"><thead><tr><th>المحور</th><th>الملخص</th><th>الأسئلة</th><th>الصحيح</th><th>التقدّم</th></tr></thead><tbody>';
    T.forEach(function (t, i) {
      var s = stats(t);
      h += '<tr><td><a href="#' + t.id + '-summary">' + (i + 1) + '. ' + esc(t.title) + '</a></td><td>' + (s.read ? 'مقروء' : '—') + '</td><td>' + s.answered + ' / ' + s.total + '</td><td>' + s.right + '</td><td>' + s.pct + '% ' + bar(s.pct) + '</td></tr>';
    });
    h += '</tbody></table></div></section>';
    h += '<section class="panel"><h2>مسح التقدّم</h2><p>يحذف علامات القراءة وكل الإجابات المحفوظة في هذا المتصفح. لا يمكن التراجع عنه.</p><button class="btn danger" data-act="reset">امسح التقدّم كله</button></section>';
    return h;
  }

  function notes() {
    var h = '<h1>ملاحظات على المصدر</h1><section class="panel"><ul class="srcinfo">' +
      D.sourceInfo.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></section>';
    var groups = [['issue', 'اضطراب أو التباس في المذكرة نفسها', 'عُرض كما ورد، دون حسم من الموقع.'], ['diff', 'اختلافات بين PDF والنص المستخرج', 'اعتُمد في الموقع نص PDF.']];
    groups.forEach(function (g) {
      h += '<section><h2>' + g[1] + '</h2><p class="muted">' + g[2] + '</p><div class="notes">';
      D.notes.filter(function (n) { return n.kind === g[0]; }).forEach(function (n) {
        h += '<div class="note"><span class="t">' + esc(n.t) + '</span>' + pg(n.p) + '<div>' + fmt(n.d) + '</div></div>';
      });
      h += '</div></section>';
    });
    return h;
  }

  /* ───── التوجيه ───── */
  var cur = null;
  function route(keepScroll) {
    var hsh = (location.hash || '').replace(/^#\/?/, ''), m = /^(t\d+)-([a-z]+)$/.exec(hsh);
    var parts = m ? ['t', m[1], m[2]] : [hsh];
    var nav = 'home', html, title = D.course.title;
    cur = null;
    if (parts[0] === 'topics') { nav = 'topics'; html = topics(); title = 'المحاور · ' + title; }
    else if (parts[0] === 'progress') { nav = 'progress'; html = progress(); title = 'تقدّمي · ' + title; }
    else if (parts[0] === 'notes') { nav = 'notes'; html = notes(); title = 'ملاحظات على المصدر · ' + title; }
    else if (parts[0] === 't' && topicById(parts[1]) > -1) {
      var i = topicById(parts[1]);
      var tab = TABS.some(function (x) { return x[0] === parts[2]; }) ? parts[2] : 'summary';
      nav = 'topics'; cur = { i: i, tab: tab }; html = topicPage(i, tab);
      title = T[i].title + ' · ' + title;
    } else html = home();
    main.innerHTML = html;
    document.title = title;
    [].forEach.call(document.querySelectorAll('.mainnav a'), function (a) {
      var on = a.getAttribute('data-nav') === nav;
      a.classList.toggle('on', on);
      if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    if (!keepScroll) { window.scrollTo(0, 0); main.focus({ preventScroll: true }); }
  }
  function rerender() { var y = window.scrollY; route(true); window.scrollTo(0, y); }

  main.addEventListener('click', function (e) {
    var b = e.target.closest('[data-act]'); if (!b) return;
    var act = b.getAttribute('data-act');
    var t = cur ? T[cur.i] : null;
    if (act === 'read' || act === 'unread') {
      if (act === 'read') S.read[t.id] = true; else delete S.read[t.id];
      save(); rerender();
    } else if (act === 'toggle') {
      var a = b.parentNode.querySelector('.a'), show = a.hidden;
      a.hidden = !show; b.textContent = show ? 'أخفِ الجواب' : 'أظهر الجواب'; b.setAttribute('aria-expanded', show);
    } else if (act === 'showall' || act === 'hideall') {
      [].forEach.call(main.querySelectorAll('.term'), function (el) {
        var show = act === 'showall', a = el.querySelector('.a'), bt = el.querySelector('button');
        a.hidden = !show; bt.textContent = show ? 'أخفِ الجواب' : 'أظهر الجواب'; bt.setAttribute('aria-expanded', show);
      });
    } else if (act === 'ans') {
      var card = b.closest('.qcard'), id = card.getAttribute('data-id');
      if (S.ans[id]) return;
      var kind = id.split(':')[1].charAt(0), idx = +id.split(':')[1].slice(1), k = +b.getAttribute('data-k');
      var correct = kind === 'm' ? t.mcq[idx].c : (t.tf[idx].a ? 0 : 1);
      S.ans[id] = { c: k, ok: k === correct }; save(); rerender();
      var again = main.querySelector('.qcard[data-id="' + id + '"] .fb'); if (again) again.focus && again.setAttribute('tabindex', '-1');
    } else if (act === 'retry' || act === 'reset') {
      var box = document.createElement('span');
      box.className = 'confirm';
      box.innerHTML = '<span>' + (act === 'retry' ? 'ستُحذف إجاباتك في هذا المحور.' : 'سيُحذف تقدّمك كله، ولا يمكن التراجع.') + '</span>' +
        '<button class="btn danger" data-act="' + act + '-yes">' + (act === 'retry' ? 'نعم، أعد التدريب' : 'نعم، امسح') + '</button>' +
        '<button class="btn ghost" data-act="cancel">إلغاء</button>';
      b.replaceWith(box); box.querySelector('button').focus();
    } else if (act === 'cancel') {
      rerender();
    } else if (act === 'retry-yes') {
      allQ(t).forEach(function (id) { delete S.ans[id]; }); save(); route();
    } else if (act === 'reset-yes') {
      S = blank(); save(); route();
    }
  });

  /* رابط التخطي ينقل التركيز دون تغيير المسار */
  var skip = document.querySelector('.skip');
  if (skip) skip.addEventListener('click', function (e) { e.preventDefault(); main.focus(); });
  window.addEventListener('hashchange', function () { route(); });
  route(true);
})();
