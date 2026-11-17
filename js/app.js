/* مسار — منطق الموقع. بلا إطار عمل ولا خادم.
   كل ما يُحفظ يُحفظ في متصفح المستخدم فقط، تحت مفاتيح تبدأ بـ masar:<book-id>: */
(function () {
  'use strict';

  var M = window.MASAR || {};
  var C = M.course, UNITS = M.units || [], QS = M.questions || [];
  var NS = 'masar:' + C.id + ':';
  var DAY = 864e5;
  var INTERVALS = [1, 2, 4, 8, 16];
  var main = document.getElementById('main');
  var side = document.getElementById('side');
  var layout = document.getElementById('layout');

  /* ───────────── أدوات عامة ───────────── */
  var AR = '٠١٢٣٤٥٦٧٨٩';
  function ar(x) { return String(x).replace(/[0-9]/g, function (d) { return AR[d]; }); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function h(s) { return esc(ar(s == null ? '' : s)); }
  function pg(p) { return 'ص\u00A0' + ar(p); }
  function range(a, b) { return a === b ? pg(a) : 'ص\u00A0' + ar(a) + '\u2060–\u2060' + ar(b); }
  function pct(a, b) { return b ? Math.round((a / b) * 100) : 0; }
  function icon(name) { return '<svg class="ic" aria-hidden="true"><use href="#i-' + name + '"/></svg>'; }
  function srcBtn(p, label) {
    return '<button type="button" class="sourcebtn" data-src="' + p + '" aria-label="راجع الأصل، الصفحة ' + ar(p) + '">' + icon('page') + h(label || ('راجع الأصل · ' + pg(p))) + '</button>';
  }
  function qWord(n) {
    if (n === 1) return 'سؤال واحد';
    if (n === 2) return 'سؤالان';
    if (n >= 3 && n <= 10) return ar(n) + ' أسئلة';
    return ar(n) + ' سؤالًا';
  }
  function minWord(n) {
    if (n === 1) return 'دقيقة واحدة';
    if (n === 2) return 'دقيقتان';
    if (n >= 3 && n <= 10) return ar(n) + ' دقائق';
    return ar(n) + ' دقيقة';
  }
  function clock(ms) {
    ms = Math.max(0, ms);
    var s = Math.ceil(ms / 1000), m = Math.floor(s / 60);
    s = s % 60;
    return ar((m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s);
  }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function fmtDate(t) {
    var d = new Date(t);
    return ar(d.getDate() + '/' + (d.getMonth() + 1) + '/' + d.getFullYear() + ' ' + (d.getHours() < 10 ? '0' : '') + d.getHours() + ':' + (d.getMinutes() < 10 ? '0' : '') + d.getMinutes());
  }
  var LETTERS = ['أ', 'ب', 'ج', 'د'];

  /* ───────────── التخزين (مع بديل في الذاكرة) ───────────── */
  var mem = {};
  var storageOK = (function () { try { var k = NS + '__t'; localStorage.setItem(k, '1'); localStorage.removeItem(k); return true; } catch (e) { return false; } })();
  var store = {
    get: function (k, d) {
      try { var v = localStorage.getItem(NS + k); if (v != null) return JSON.parse(v); } catch (e) {}
      return Object.prototype.hasOwnProperty.call(mem, k) ? mem[k] : d;
    },
    set: function (k, v) { mem[k] = v; try { localStorage.setItem(NS + k, JSON.stringify(v)); } catch (e) {} },
    del: function (k) { delete mem[k]; try { localStorage.removeItem(NS + k); } catch (e) {} },
    clearAll: function () {
      mem = {};
      try {
        var del = [];
        for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (k && k.indexOf(NS) === 0) del.push(k); }
        del.forEach(function (k) { localStorage.removeItem(k); });
      } catch (e) {}
    }
  };

  /* ───────────── الفهارس ───────────── */
  var qById = {};
  QS.forEach(function (q) { qById[q.id] = q; });
  var unitById = {};
  UNITS.forEach(function (u) { unitById[u.id] = u; });
  var ALL = {
    id: 'all', number: 0, name: 'المقرر كاملًا', title: 'المقرر كاملًا',
    subject: 'الوحدات السبع بترتيب الفصل، في تدريب واحد وخرائط ومقارنات وخلاصة جامعة.',
    from: C.firstPage, to: C.lastPage
  };
  function getUnit(id) { return id === 'all' ? ALL : unitById[id]; }
  function qidsOf(uid) { return QS.filter(function (q) { return uid === 'all' || q.unit === uid; }).map(function (q) { return q.id; }); }
  function topicsOf(uid) {
    var list = [];
    UNITS.forEach(function (u) {
      if (uid !== 'all' && u.id !== uid) return;
      u.topics.forEach(function (t, i) { list.push({ key: u.id + ':' + i, unit: u, idx: i, t: t }); });
    });
    return list;
  }
  function comparisonsOf(uid) {
    var list = [];
    UNITS.forEach(function (u) { if (uid === 'all' || u.id === uid) (u.comparisons || []).forEach(function (c) { list.push({ unit: u, c: c }); }); });
    return list;
  }
  function figuresOf(uid) {
    var list = [];
    UNITS.forEach(function (u) { if (uid === 'all' || u.id === uid) (u.figures || []).forEach(function (f) { list.push({ unit: u, f: f }); }); });
    return list;
  }
  function topicKeyOf(q) { return q.unit + ':' + q.topic; }
  function topicTitle(q) { var u = unitById[q.unit]; return u && u.topics[q.topic] ? u.topics[q.topic].title : ''; }

  /* ───────────── الإجابات والمراجعة المتباعدة ───────────── */
  function answers() { return store.get('answers', {}); }
  function srs() { return store.get('srs', {}); }
  function recordAnswer(qid, choice) {
    var q = qById[qid], ok = choice === q.correct;
    var a = answers(); a[qid] = { c: choice, ok: ok, at: Date.now() }; store.set('answers', a);
    var s = srs(), cur = s[qid];
    var box = ok ? (cur ? Math.min(5, cur.box + 1) : 2) : 1;
    s[qid] = { box: box, due: Date.now() + INTERVALS[box - 1] * DAY };
    store.set('srs', s);
    return ok;
  }
  function seedSrs() {
    var a = answers(), s = srs(), changed = false;
    Object.keys(a).forEach(function (id) {
      if (!qById[id] || s[id]) return;
      s[id] = a[id].ok ? { box: 2, due: (a[id].at || Date.now()) + 2 * DAY } : { box: 1, due: (a[id].at || Date.now()) + DAY };
      changed = true;
    });
    if (changed) store.set('srs', s);
  }
  function dueIds(ids) { var s = srs(), now = Date.now(); return ids.filter(function (id) { return s[id] && s[id].due <= now; }); }
  function wrongIds(ids) { var a = answers(); return ids.filter(function (id) { return a[id] && !a[id].ok; }); }
  function stats(uid) {
    var ids = qidsOf(uid), a = answers(), answered = 0, right = 0;
    ids.forEach(function (id) { if (a[id]) { answered++; if (a[id].ok) right++; } });
    return { total: ids.length, answered: answered, right: right, acc: pct(right, answered), done: pct(answered, ids.length), mastered: ids.length > 0 && answered === ids.length && pct(right, answered) >= 80 };
  }
  function statusFilter(ids, status) {
    var a = answers();
    if (status === 'unanswered') return ids.filter(function (id) { return !a[id]; });
    if (status === 'wrong') return wrongIds(ids);
    if (status === 'right') return ids.filter(function (id) { return a[id] && a[id].ok; });
    if (status === 'due') return dueIds(ids);
    return ids;
  }

  /* نسخة البنك: تغيّرها يعيد ضبط الإجابات المحفوظة لهذا الكتاب فقط */
  (function checkBankVersion() {
    var v = store.get('bankVersion', null);
    if (v !== M.bankVersion) {
      if (v !== null) { store.del('answers'); store.del('srs'); store.del('exam'); }
      store.set('bankVersion', M.bankVersion);
    }
  })();
  seedSrs();

  /* ───────────── التوجيه ───────────── */
  var TABS = [
    { id: 'home', label: 'ابدأ من هنا', icon: 'home' },
    { id: 'practice', label: 'التدريب الموضوعي', icon: 'list' },
    { id: 'exam', label: 'محاكاة الاختبار', icon: 'clock' },
    { id: 'maps', label: 'خرائط المفاهيم', icon: 'map' },
    { id: 'compare', label: 'المقارنات', icon: 'table' },
    { id: 'figures', label: 'الأعلام والنظريات', icon: 'person' },
    { id: 'summary', label: 'خلاصة الفصل', icon: 'sum' }
  ];
  var route = {}, navNonce = 0;
  function parseHash() {
    var raw = decodeURIComponent(location.hash.slice(1) || '');
    var parts = raw.split('?'), path = parts[0], params = {};
    (parts[1] || '').split('&').forEach(function (kv) { if (!kv) return; var p = kv.split('='); params[p[0]] = p.slice(1).join('='); });
    var m = /^unit-(u\d+|all)-(home|practice|exam|maps|compare|figures|summary)$/.exec(path);
    if (m && getUnit(m[1])) return { page: 'unit', unit: m[1], tab: m[2], params: params, path: path };
    if (['course', 'bank', 'mock', 'figures', 'about', 'welcome'].indexOf(path) >= 0) return { page: path, params: params, path: path };
    if (!path) return { page: store.get('skipWelcome', false) ? 'course' : 'welcome', params: params, path: '' };
    return { page: 'course', params: params, path: 'course' };
  }
  function go(hash) { if (location.hash === hash) render(true); else location.hash = hash; }

  function render(isNav) {
    route = parseHash();
    if (isNav) navNonce++;
    var global = route.page !== 'unit';
    layout.classList.toggle('global', global);
    if (global) side.innerHTML = ''; else renderSide();
    var fn = PAGES[route.page] || PAGES.course;
    main.innerHTML = fn();
    afterRender();
    updateNav();
    updateBanner();
    if (route.page === 'unit') { var last = store.get('last', {}); last[route.unit] = route.tab; last._unit = route.unit; store.set('last', last); }
    if (isNav) {
      window.scrollTo(0, 0);
      try { main.focus({ preventScroll: true }); } catch (e) { main.focus(); }
    }
  }
  var afterHooks = [];
  function after(fn) { afterHooks.push(fn); }
  function afterRender() { var hs = afterHooks; afterHooks = []; hs.forEach(function (f) { f(); }); }

  function updateNav() {
    var key = route.page === 'unit' ? (route.unit === 'all' ? 'all' : 'units') : route.page;
    document.querySelectorAll('[data-nav]').forEach(function (a) {
      if (a.getAttribute('data-nav') === key) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    document.querySelectorAll('[data-tab]').forEach(function (a) {
      if (a.getAttribute('data-tab') === key) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    var u = route.page === 'unit' ? getUnit(route.unit) : null;
    var tabLabel = u ? (TABS.filter(function (t) { return t.id === route.tab; })[0] || {}).label : null;
    var titles = { course: 'المقرر', bank: 'بنك الأسئلة', mock: 'الاختبار الشامل', figures: 'الأعلام والنظريات', about: 'عن هذا الكتاب', welcome: 'مرحبًا بك' };
    document.title = 'مسار · ' + (u ? u.name + ' · ' + tabLabel : (titles[route.page] || C.title));
  }

  /* ───────────── العمود الجانبي ───────────── */
  function hasFigures(uid) { return figuresOf(uid).length > 0; }
  function renderSide() {
    var u = getUnit(route.unit), st = stats(u.id);
    var items = TABS.filter(function (t) { return t.id !== 'figures' || hasFigures(u.id); }).map(function (t) {
      var cur = t.id === route.tab ? ' aria-current="page"' : '';
      return '<li><a href="#unit-' + u.id + '-' + t.id + '"' + cur + '>' + icon(t.icon) + '<span>' + h(t.label) + '</span></a></li>';
    }).join('');
    side.innerHTML =
      '<div class="side-head"><span class="ubadge" aria-hidden="true">' + (u.id === 'all' ? 'م' : h(u.number)) + '</span>' +
      '<div><p class="side-name">' + h(u.name) + '</p><p class="side-sub">' + h(range(u.from, u.to)) + '</p></div></div>' +
      '<nav aria-label="أنشطة ' + h(u.name) + '"><ul class="actlist">' + items + '</ul></nav>' +
      '<div class="progbox"><p>الإنجاز: أجبت عن ' + h(st.answered) + ' من ' + h(st.total) + '</p>' +
      '<progress max="' + st.total + '" value="' + st.answered + '" aria-label="نسبة الإنجاز">' + h(st.done) + '٪</progress>' +
      '<p class="small" style="margin-top:.5em">الدقة: ' + (st.answered ? h(st.acc) + '٪' : '—') + (st.mastered ? ' · وحدة متقنة' : '') + '</p>' +
      '<p class="small" style="margin:0">يُحفظ في هذا المتصفح فقط.</p></div>';
  }

  /* ───────────── الصفحات ───────────── */
  var PAGES = {};

  /* — مرحبًا — */
  PAGES.welcome = function () {
    return '<div class="hero"><p class="eyebrow">' + h(C.reference) + ' · ' + h(range(C.firstPage, C.lastPage)) + '</p>' +
      '<h1>مرحبًا بك في مسار</h1>' +
      '<p class="read">مسار رفيق لمراجعة فصل «' + h(C.title) + '» وحدك. كل تعريف وسؤال ومقارنة فيه مأخوذ من صفحة مطبوعة في المذكرة، ومعه زر يفتح تلك الصفحة.</p>' +
      '<div class="btnrow"><a class="btn btn-primary btn-big" href="#course">ابدأ من صفحة المقرر</a><a class="btn" href="#about">كيف يعمل الموقع؟</a></div></div>' +
      '<section class="panel"><h2>ماذا تجد هنا؟</h2><ul class="welcome-list read">' +
      '<li>سبع وحدات تعليمية مأخوذة من ترتيب الفصل، لكل منها تدريب وخرائط مفاهيم ومقارنات وخلاصة.</li>' +
      '<li>بنك من ' + h(QS.length) + ' سؤالًا بتعليل لكل إجابة، وبيان لسبب خطأ أقرب خيار إليها.</li>' +
      '<li>محاكاة اختبار بوقت محدد، ومراجعة متباعدة تعيد إليك ما أخطأت فيه.</li>' +
      '<li>عارض لصفحات المذكرة نفسها، لتعود إلى الأصل متى شككت.</li></ul>' +
      '<p class="note">الأسئلة صياغات تعليمية مقترحة، وليست أسئلة رسمية، ولا تتنبأ بالاختبار الحقيقي. ويُحفظ تقدمك في هذا المتصفح فقط.</p>' +
      '<label class="check"><input type="checkbox" data-change="skipWelcome"' + (store.get('skipWelcome', false) ? ' checked' : '') + '> تجاوز هذه الصفحة في الزيارات القادمة</label></section>';
  };

  /* — صفحة المقرر — */
  PAGES.course = function () {
    var allIds = qidsOf('all'), due = dueIds(allIds).length, fav = store.get('favs', []), last = store.get('last', {});
    var st = stats('all');
    var order = UNITS.slice().sort(function (a, b) { return (fav.indexOf(b.id) >= 0) - (fav.indexOf(a.id) >= 0); });
    var cont = '';
    if (last._unit && getUnit(last._unit)) {
      var lu = getUnit(last._unit), lt = last[last._unit] || 'home';
      var tl = (TABS.filter(function (t) { return t.id === lt; })[0] || TABS[0]).label;
      cont = '<p class="status">تابع من حيث توقفت: <a href="#unit-' + lu.id + '-' + lt + '" style="color:inherit">' + h(lu.name) + ' · ' + h(tl) + '</a></p>';
    }
    var cards = order.map(function (u) {
      var s = stats(u.id), isFav = fav.indexOf(u.id) >= 0, lt = last[u.id];
      return '<article class="ucard"><div class="ucard-top"><span class="ubadge" aria-hidden="true">' + h(u.number) + '</span>' +
        '<div style="min-width:0"><p class="eyebrow" style="margin:0">' + h(u.name) + ' · ' + h(range(u.from, u.to)) + '</p>' +
        '<h3><a href="#unit-' + u.id + '-home">' + h(u.title) + '</a></h3></div>' +
        '<button type="button" class="star" data-act="fav" data-unit="' + u.id + '" aria-pressed="' + isFav + '" aria-label="تثبيت ' + h(u.name) + ' في الأعلى">' + icon('star') + '</button></div>' +
        '<progress max="' + s.total + '" value="' + s.answered + '" aria-label="إنجاز ' + h(u.name) + '"></progress>' +
        '<div class="meta"><span>أجبت عن ' + h(s.answered) + ' من ' + h(s.total) + '</span><span>الدقة: ' + (s.answered ? h(s.acc) + '٪' : '—') + '</span>' +
        (s.mastered ? '<span class="chip-status done">متقنة</span>' : '') + '</div>' +
        '<div class="btnrow" style="margin-top:4px"><a class="btn btn-sm" href="#unit-' + u.id + '-' + (lt || 'home') + '">' + (lt ? 'تابع من حيث توقفت' : 'ابدأ من هنا') + '</a>' +
        '<a class="btn btn-sm" href="#unit-' + u.id + '-practice">التدريب</a></div></article>';
    }).join('');
    return '<div class="hero"><p class="eyebrow">' + h(C.reference) + ' · ' + h(range(C.firstPage, C.lastPage)) + '</p>' +
      '<h1>المقرر كله وحدةً بعد وحدة</h1>' +
      '<p class="read">' + h(C.bookTitle) + ' — ' + h(C.title) + '. المؤلف: ' + h(C.author) + '.</p>' +
      '<div class="btnrow"><a class="btn btn-primary btn-big" href="#bank">بنك الأسئلة</a><a class="btn btn-big" href="#unit-all-home">المقرر كاملًا</a>' +
      (due ? '<a class="btn btn-big" href="#unit-all-practice?set=due">مراجعة اليوم (' + h(due) + ')</a>' : '') + '</div>' +
      '<div class="stats"><span><b>' + h(UNITS.length) + '</b>وحدات</span><span><b>' + h(QS.length) + '</b>سؤالًا</span><span><b>' + h(st.answered) + '</b>أجبت عنها</span><span><b>' + (st.answered ? h(st.acc) + '٪' : '—') + '</b>الدقة</span></div>' +
      cont + '</div>' +
      '<p class="note">' + h(C.unitNote) + '</p>' +
      '<div class="cards">' + cards + '</div>' +
      '<section class="panel"><h2>صفحات عامة</h2><div class="btnrow"><a class="btn" href="#mock">' + icon('clock') + 'الاختبار الشامل</a><a class="btn" href="#figures">' + icon('person') + 'الأعلام والنظريات</a><a class="btn" href="#unit-all-summary">' + icon('sum') + 'خلاصة الفصل كاملة</a><a class="btn" href="#about">' + icon('info') + 'عن هذا الكتاب</a></div></section>';
  };

  /* — الوحدة: تبويبات — */
  PAGES.unit = function () {
    var fn = UNIT_TABS[route.tab] || UNIT_TABS.home;
    return fn(getUnit(route.unit));
  };
  var UNIT_TABS = {};

  UNIT_TABS.home = function (u) {
    var st = stats(u.id), ids = qidsOf(u.id), due = dueIds(ids).length, wrong = wrongIds(ids).length;
    var topics = topicsOf(u.id), comps = comparisonsOf(u.id).length, figs = figuresOf(u.id).length;
    var primary = st.answered === 0 ? 'ابدأ التدريب' : (st.answered < st.total ? 'تابع التدريب' : 'أعد التدريب');
    var statusLine = st.answered === 0 ? 'لم تُجب عن أي سؤال في هذه الوحدة بعد.' :
      'أجبت عن ' + ar(st.answered) + ' من ' + ar(st.total) + (st.right ? '، منها ' + ar(st.right) + ' صحيحة' : '، ولم تصح أي منها بعد') + (st.mastered ? '؛ والوحدة متقنة.' : '.');
    var nodes = topics.reduce(function (a, t) { return a + t.t.nodes.length; }, 0);
    var html = '<div class="hero"><p class="eyebrow">' + h(u.name) + ' · ' + h(range(u.from, u.to)) + '</p>' +
      '<h1>' + h(u.title) + '</h1><p class="read">' + h(u.subject) + '</p>' +
      '<div class="btnrow"><a class="btn btn-primary btn-big" href="#unit-' + u.id + '-practice">' + h(primary) + '</a>' +
      '<a class="btn btn-big" href="#unit-' + u.id + '-exam">محاكاة الاختبار</a></div>' +
      '<div class="stats"><span><b>' + h(topics.length) + '</b>محاور</span><span><b>' + h(nodes) + '</b>عقدة في الخرائط</span><span><b>' + h(st.total) + '</b>سؤالًا</span><span><b>' + h(comps) + '</b>مقارنات</span></div>' +
      '<p class="status" role="status">' + h(statusLine) + '</p></div>';
    if (u.note) html += '<p class="note">' + h(u.note) + '</p>';
    if (u.id === 'all') html += '<p class="note">' + h(C.unitNote) + '</p>';
    html += '<section class="panel"><h2>قبل التدريب أو بعده</h2>' +
      '<p class="read">المراجعة المتباعدة تعيد إليك السؤال بعد يوم، ثم يومين، ثم أربعة، ثم ثمانية، ثم ستة عشر يومًا كلما أصبت فيه؛ وإن أخطأت عاد إلى البداية.</p>' +
      '<div class="btnrow">' +
      (due ? '<a class="btn btn-primary" href="#unit-' + u.id + '-practice?set=due">مراجعة اليوم (' + h(due) + ')</a>' : '<span class="btn" aria-disabled="true">لا مراجعة مستحقة اليوم</span>') +
      (wrong ? '<a class="btn" href="#unit-' + u.id + '-practice?set=wrong">راجع أخطاءك (' + h(wrong) + ')</a>' : '<span class="btn" aria-disabled="true">لا أخطاء مسجلة</span>') +
      '</div></section>';
    html += '<section class="panel"><h2>أنشطة المراجعة</h2><div class="btnrow">' +
      '<a class="btn" href="#unit-' + u.id + '-maps">' + icon('map') + 'خرائط المفاهيم</a>' +
      '<a class="btn" href="#unit-' + u.id + '-compare">' + icon('table') + 'المقارنات</a>' +
      (figs ? '<a class="btn" href="#unit-' + u.id + '-figures">' + icon('person') + 'الأعلام والنظريات</a>' : '') +
      '<a class="btn" href="#unit-' + u.id + '-summary">' + icon('sum') + 'خلاصة الفصل</a></div>' +
      (figs ? '' : '<p class="small" style="margin-top:12px">لا يظهر تبويب «الأعلام والنظريات» في هذه الوحدة؛ لأنها تجمع رواد النظريات الذين وردت تراجمهم في الوحدات السابقة، ولا تضيف حاشية ترجمة جديدة.</p>') +
      '</section>';
    html += '<section class="panel"><h2>محاور الوحدة</h2><ol class="read" style="padding-inline-start:1.3em;margin:0">' +
      topics.map(function (t, i) { return '<li><a href="#unit-' + u.id + '-maps?t=' + i + '">' + h(t.t.title) + '</a> <span class="small">(' + h(range(t.t.from, t.t.to)) + (u.id === 'all' ? '، ' + h(t.unit.name) : '') + ')</span></li>'; }).join('') +
      '</ol></section>';
    return html;
  };

  /* ───────────── مكوّن السؤال (التدريب) ───────────── */
  var PR = {};
  function prState(key) {
    if (!PR[key]) PR[key] = { mode: 'round', round: null, free: { topic: '', status: 'all', i: 0 }, cur: { qid: null, pick: null, checked: false } };
    return PR[key];
  }
  function resetCur(st, qid) { if (st.cur.qid !== qid) st.cur = { qid: qid, pick: null, checked: false }; }

  function questionCard(ctxKey, q, counter, extra) {
    var st = prState(ctxKey), cur = st.cur, a = answers()[q.id];
    var locked = cur.checked;
    var opts = q.options.map(function (o, i) {
      var cls = 'opt', tag = '';
      if (locked) {
        if (i === q.correct) { cls += ' is-right'; tag = '<span class="tag">الإجابة الصحيحة</span>'; }
        else if (i === cur.pick) { cls += ' is-wrong'; tag = '<span class="tag">إجابتك</span>'; }
      } else if (i === cur.pick) cls += ' chosen';
      return '<label class="' + cls + '"><input type="radio" name="opt-' + ctxKey + '" value="' + i + '"' + (i === cur.pick ? ' checked' : '') + (locked ? ' disabled' : '') + ' data-change="pick" data-ctx="' + ctxKey + '">' +
        '<span class="letter">' + LETTERS[i] + '</span><span>' + h(o) + '</span>' + tag + '</label>';
    }).join('');
    var prevNote = (!locked && a) ? '<span>آخر إجابة لك: ' + (a.ok ? 'صحيحة' : 'غير صحيحة') + '</span>' : '';
    var html = '<section class="panel" aria-labelledby="qt-' + q.id + '">' +
      '<div class="qhead"><span class="counter">' + h(counter) + '</span><span class="qmeta"><span>' + h(M.categories[q.cat]) + '</span><span>' + h(unitById[q.unit].name) + '</span>' + prevNote + '</span></div>' +
      '<p class="qtext" id="qt-' + q.id + '" tabindex="-1">' + h(q.q) + '</p>' +
      '<fieldset class="opts' + (locked ? ' locked' : '') + '"><legend>الخيارات</legend>' + opts + '</fieldset>';
    if (!locked) {
      html += '<div class="btnrow"><button type="button" class="btn btn-primary" data-act="check" data-ctx="' + ctxKey + '"' + (cur.pick == null ? ' disabled' : '') + '>تحقق من الإجابة</button>' +
        (cur.pick == null ? '<span class="small">اختر إجابة أولًا.</span>' : '') + '</div>';
    } else {
      var ok = cur.pick === q.correct;
      html += '<div class="feedback" role="status" tabindex="-1" id="fb-' + ctxKey + '">' +
        '<p class="verdict ' + (ok ? 'ok' : 'no') + '">' + (ok ? 'إجابتك صحيحة' : 'إجابتك غير صحيحة') + '</p>' +
        '<h4>التعليل</h4><p>' + h(q.why) + '</p>' +
        '<h4>لماذا ليس «' + h(q.options[q.near]) + '»؟</h4><p>' + h(q.nearWhy) + '</p>' +
        '<div class="btnrow">' + srcBtn(q.page) +
        '<a class="btn btn-sm" href="#unit-' + q.unit + '-maps?t=' + q.topic + '">' + icon('map') + 'خريطة المحور: ' + h(topicTitle(q)) + '</a>' +
        (!ok ? '<button type="button" class="btn btn-sm" data-act="retry" data-ctx="' + ctxKey + '">أعد المحاولة</button>' : '') +
        '</div></div>';
    }
    html += extra || '';
    html += '</section>';
    return html;
  }

  function doCheck(ctxKey) {
    var st = prState(ctxKey), cur = st.cur;
    if (cur.pick == null || cur.checked) return;
    var ok = recordAnswer(cur.qid, cur.pick);
    cur.checked = true;
    if (st.round && !st.round.done && st.round.ids.indexOf(cur.qid) >= 0) st.round.res[cur.qid] = ok;
    render(false);
    var fb = document.getElementById('fb-' + ctxKey);
    if (fb) fb.focus();
  }

  /* — التدريب الموضوعي — */
  UNIT_TABS.practice = function (u) {
    var key = 'u:' + u.id, st = prState(key), ids = qidsOf(u.id), p = route.params;
    if ((p.set || p.topic) && st.nonce !== navNonce) {
      st.nonce = navNonce;
      if (p.set) startRound(st, ids, p.set);
      if (p.topic != null && p.topic !== '') { st.mode = 'free'; st.free.topic = p.topic.indexOf(':') > 0 ? p.topic : (u.id + ':' + p.topic); st.free.status = 'all'; st.free.i = 0; }
    }
    if (st.mode === 'round' && !st.round) startRound(st, ids, 'all');
    var html = '<div class="pagehead"><p class="eyebrow">' + h(u.name) + ' · ' + h(range(u.from, u.to)) + '</p><h1>التدريب الموضوعي</h1>' +
      '<p class="read">سؤال في كل شاشة. اختر إجابة ثم اضغط «تحقق من الإجابة»؛ لن يظهر التصحيح قبل ذلك.</p></div>' +
      '<div class="toolbar"><div class="field"><span class="lbl" id="modelbl">طريقة التدريب</span><div class="seg" role="group" aria-labelledby="modelbl">' +
      '<button type="button" data-act="mode" data-ctx="' + key + '" data-mode="round" aria-pressed="' + (st.mode === 'round') + '">جولة</button>' +
      '<button type="button" data-act="mode" data-ctx="' + key + '" data-mode="free" aria-pressed="' + (st.mode === 'free') + '">حر</button></div></div></div>';
    html += st.mode === 'round' ? roundView(key, u, ids) : freeView(key, u, ids);
    return html;
  };

  function startRound(st, ids, set) {
    var list = set === 'due' ? dueIds(ids) : set === 'wrong' ? wrongIds(ids) : ids.slice();
    var labels = { due: 'مراجعة اليوم', wrong: 'مراجعة الأخطاء', all: 'كل الأسئلة', retry: 'إعادة أخطاء الجولة' };
    st.mode = 'round';
    st.round = { ids: list, i: 0, res: {}, done: false, set: set, label: labels[set] || labels.all };
    st.cur = { qid: null, pick: null, checked: false };
  }

  function roundView(key, u, ids) {
    var st = prState(key), r = st.round;
    if (!r.ids.length) {
      return '<section class="panel"><h2>' + h(r.label) + '</h2><p class="read">لا توجد أسئلة في هذه الجولة الآن' + (r.set === 'due' ? '؛ لا مراجعة مستحقة اليوم.' : r.set === 'wrong' ? '؛ لا أخطاء مسجلة.' : '.') + '</p>' +
        '<div class="btnrow"><button type="button" class="btn btn-primary" data-act="newround" data-ctx="' + key + '" data-set="all">ابدأ جولة بكل الأسئلة</button></div></section>';
    }
    if (r.done) return roundResults(key, u);
    var q = qById[r.ids[r.i]];
    resetCur(st, q.id);
    var last = r.i === r.ids.length - 1;
    var navHtml = '<div class="btnrow spread"><div class="btnrow" style="margin:0">' +
      '<button type="button" class="btn" data-act="rprev" data-ctx="' + key + '"' + (r.i === 0 ? ' disabled' : '') + '>' + icon('prev') + 'السابق</button>' +
      '<button type="button" class="btn" data-act="rnext" data-ctx="' + key + '">' + (last ? 'اعرض نتيجة الجولة' : 'التالي') + icon('next') + '</button></div>' +
      '<button type="button" class="btn btn-sm" data-act="rend" data-ctx="' + key + '">أنهِ الجولة</button></div>';
    return '<p class="small" style="margin:0 0 6px">' + h(r.label) + '</p>' +
      '<progress max="' + r.ids.length + '" value="' + Object.keys(r.res).length + '" aria-label="تقدم الجولة"></progress>' +
      questionCard(key, q, 'سؤال ' + ar(r.i + 1) + ' من ' + ar(r.ids.length), navHtml);
  }

  function roundResults(key, u) {
    var r = prState(key).round, done = Object.keys(r.res), right = done.filter(function (id) { return r.res[id]; }).length;
    var wrong = done.filter(function (id) { return !r.res[id]; });
    var html = '<section class="panel"><h2>نتيجة الجولة</h2>' +
      '<div class="kv"><div><b>' + h(done.length) + ' / ' + h(r.ids.length) + '</b><span>أجبت عنها في الجولة</span></div>' +
      '<div><b>' + h(right) + '</b><span>إجابات صحيحة</span></div><div><b>' + (done.length ? h(pct(right, done.length)) + '٪' : '—') + '</b><span>نسبة الصواب في الجولة</span></div></div>';
    if (wrong.length) {
      html += '<h3>أسئلة أخطأت فيها</h3><ul class="read" style="padding-inline-start:1.2em">' + wrong.map(function (id) {
        var q = qById[id]; return '<li>' + h(q.q) + ' ' + srcBtn(q.page, pg(q.page)) + '</li>';
      }).join('') + '</ul>';
    }
    html += '<div class="btnrow">' +
      (wrong.length ? '<button type="button" class="btn btn-primary" data-act="newround" data-ctx="' + key + '" data-set="retry">أعد أخطاء الجولة (' + h(wrong.length) + ')</button>' : '') +
      '<button type="button" class="btn" data-act="newround" data-ctx="' + key + '" data-set="all">جولة جديدة بكل الأسئلة</button>' +
      '<button type="button" class="btn" data-act="mode" data-ctx="' + key + '" data-mode="free">انتقل إلى الوضع الحر</button></div></section>';
    return html;
  }

  function freeFilters(key, u) {
    var st = prState(key), f = st.free;
    var topics = topicsOf(u.id);
    var topicOpts = '<option value="">كل المحاور</option>' + topics.map(function (t) {
      return '<option value="' + t.key + '"' + (f.topic === t.key ? ' selected' : '') + '>' + h((u.id === 'all' ? t.unit.name + ': ' : '') + t.t.title) + '</option>';
    }).join('');
    var statuses = [['all', 'الكل'], ['unanswered', 'لم يُجَب'], ['wrong', 'أخطأت'], ['right', 'أصبت'], ['due', 'مراجعة اليوم']];
    return '<div class="toolbar"><div class="field"><label for="ft-' + key + '">المحور</label><select id="ft-' + key + '" data-change="ftopic" data-ctx="' + key + '">' + topicOpts + '</select></div>' +
      '<div class="field"><span class="lbl" id="fsl-' + key + '">الحالة</span><div class="seg" role="group" aria-labelledby="fsl-' + key + '">' +
      statuses.map(function (s) { return '<button type="button" data-act="fstatus" data-ctx="' + key + '" data-status="' + s[0] + '" aria-pressed="' + (f.status === s[0]) + '">' + h(s[1]) + '</button>'; }).join('') +
      '</div></div></div>';
  }

  function freeList(key, ids) {
    var f = prState(key).free;
    var list = f.topic ? ids.filter(function (id) { return topicKeyOf(qById[id]) === f.topic; }) : ids;
    return statusFilter(list, f.status);
  }

  function numGrid(key, list, allIds, curIdx, act) {
    var a = answers();
    return '<div class="numgrid" role="group" aria-label="أرقام الأسئلة">' + list.map(function (id, i) {
      var cls = a[id] ? (a[id].ok ? 'answered right' : 'answered wrong') : '';
      var n = allIds.indexOf(id) + 1;
      var state = a[id] ? (a[id].ok ? 'أصبت' : 'أخطأت') : 'لم يُجَب';
      return '<button type="button" class="' + cls + '" data-act="' + act + '" data-ctx="' + key + '" data-i="' + i + '"' + (i === curIdx ? ' aria-current="true"' : '') + ' aria-label="السؤال ' + ar(n) + '، ' + state + '">' + h(n) + '</button>';
    }).join('') + '</div><div class="legend"><span>الإطار الأخضر: أصبت</span><span>الإطار الأحمر: أخطأت</span><span>الكحلي: السؤال الحالي</span></div>';
  }

  function freeView(key, u, ids) {
    var st = prState(key), f = st.free, list = freeList(key, ids);
    var html = freeFilters(key, u);
    if (!list.length) return html + '<section class="panel empty"><p>لا أسئلة تطابق هذا الاختيار.</p></section>';
    if (f.i >= list.length) f.i = list.length - 1;
    var q = qById[list[f.i]];
    resetCur(st, q.id);
    var navHtml = '<div class="btnrow"><button type="button" class="btn" data-act="fprev" data-ctx="' + key + '"' + (f.i === 0 ? ' disabled' : '') + '>' + icon('prev') + 'السابق</button>' +
      '<button type="button" class="btn" data-act="fnext" data-ctx="' + key + '"' + (f.i >= list.length - 1 ? ' disabled' : '') + '>التالي' + icon('next') + '</button></div>' +
      numGrid(key, list, ids, f.i, 'fgo');
    return html + questionCard(key, q, 'سؤال ' + ar(f.i + 1) + ' من ' + ar(list.length), navHtml);
  }

  /* — بنك الأسئلة — */
  var BANK = { unit: '', cat: '', status: 'all', view: 'practice' };
  PAGES.bank = function () {
    var key = 'bank', st = prState(key);
    st.mode = 'free';
    var ids = QS.map(function (q) { return q.id; }).filter(function (id) {
      var q = qById[id]; return (!BANK.unit || q.unit === BANK.unit) && (!BANK.cat || q.cat === BANK.cat);
    });
    var list = statusFilter(ids, BANK.status);
    var unitOpts = '<option value="">كل الوحدات</option>' + UNITS.map(function (u) { return '<option value="' + u.id + '"' + (BANK.unit === u.id ? ' selected' : '') + '>' + h(u.name + ': ' + u.title) + '</option>'; }).join('');
    var catOpts = '<option value="">كل التصنيفات</option>' + Object.keys(M.categories).map(function (k) {
      var n = QS.filter(function (q) { return q.cat === k; }).length;
      return '<option value="' + k + '"' + (BANK.cat === k ? ' selected' : '') + '>' + h(M.categories[k] + ' (' + n + ')') + '</option>';
    }).join('');
    var statuses = [['all', 'الكل'], ['unanswered', 'لم يُجَب'], ['wrong', 'أخطأت'], ['right', 'أصبت'], ['due', 'مراجعة اليوم']];
    var html = '<div class="pagehead"><p class="eyebrow">' + h(C.reference) + '</p><h1>بنك الأسئلة</h1>' +
      '<p class="read">' + h(QS.length) + ' سؤالًا من الفصل كله، لكل منها صفحة في المذكرة وتعليل. الأسئلة صياغات تعليمية مقترحة، وليست أسئلة رسمية.</p></div>' +
      '<div class="toolbar">' +
      '<div class="field"><label for="bu">الوحدة</label><select id="bu" data-change="bank" data-k="unit">' + unitOpts + '</select></div>' +
      '<div class="field"><label for="bc">التصنيف</label><select id="bc" data-change="bank" data-k="cat">' + catOpts + '</select></div>' +
      '<div class="field"><span class="lbl" id="bsl">الحالة</span><div class="seg" role="group" aria-labelledby="bsl">' +
      statuses.map(function (s) { return '<button type="button" data-act="bankstatus" data-status="' + s[0] + '" aria-pressed="' + (BANK.status === s[0]) + '">' + h(s[1]) + '</button>'; }).join('') + '</div></div>' +
      '<div class="field"><span class="lbl" id="bvl">العرض</span><div class="seg" role="group" aria-labelledby="bvl">' +
      '<button type="button" data-act="bankview" data-view="practice" aria-pressed="' + (BANK.view === 'practice') + '">تدرّب سؤالًا سؤالًا</button>' +
      '<button type="button" data-act="bankview" data-view="list" aria-pressed="' + (BANK.view === 'list') + '">اعرض الأسئلة بإجاباتها</button></div></div></div>' +
      '<p class="small" role="status">النتائج: ' + h(qWord(list.length)) + '</p>';
    if (!list.length) return html + '<section class="panel empty"><p>لا أسئلة تطابق هذا الاختيار.</p></section>';
    if (BANK.view === 'list') {
      return html + list.map(function (id, n) {
        var q = qById[id];
        return '<section class="panel"><div class="qhead"><span class="counter">' + h(n + 1) + '</span><span class="qmeta"><span>' + h(M.categories[q.cat]) + '</span><span>' + h(unitById[q.unit].name) + '</span>' + srcBtn(q.page, pg(q.page)) + '</span></div>' +
          '<p class="qtext">' + h(q.q) + '</p><ul class="answers-list read">' + q.options.map(function (o, i) {
            return '<li' + (i === q.correct ? ' class="ans-right"' : '') + '>' + LETTERS[i] + '. ' + h(o) + (i === q.correct ? ' — الإجابة الصحيحة' : '') + '</li>';
          }).join('') + '</ul>' +
          '<details><summary class="linkbtn">التعليل وأقرب خيار خاطئ</summary><div class="feedback"><h4>التعليل</h4><p>' + h(q.why) + '</p><h4>لماذا ليس «' + h(q.options[q.near]) + '»؟</h4><p>' + h(q.nearWhy) + '</p></div></details></section>';
      }).join('');
    }
    var f = st.free;
    if (f.i >= list.length) f.i = list.length - 1;
    if (f.i < 0) f.i = 0;
    var q = qById[list[f.i]];
    resetCur(st, q.id);
    var allIds = QS.map(function (x) { return x.id; });
    var navHtml = '<div class="btnrow"><button type="button" class="btn" data-act="fprev" data-ctx="bank"' + (f.i === 0 ? ' disabled' : '') + '>' + icon('prev') + 'السابق</button>' +
      '<button type="button" class="btn" data-act="fnext" data-ctx="bank"' + (f.i >= list.length - 1 ? ' disabled' : '') + '>التالي' + icon('next') + '</button></div>' +
      numGrid('bank', list, allIds, f.i, 'fgo');
    BANK._list = list;
    return html + questionCard('bank', q, 'سؤال ' + ar(f.i + 1) + ' من ' + ar(list.length), navHtml);
  };

  /* ───────────── الاختبار ───────────── */
  function activeExam() { return store.get('exam', null); }
  function attempts() { return store.get('attempts', []); }
  function scopeHash(scope) { return scope === 'mock' ? '#mock' : '#unit-' + scope + '-exam'; }
  function scopeName(scope) { return scope === 'mock' ? 'الاختبار الشامل' : 'محاكاة ' + getUnit(scope).name; }

  function startExam(scope, unitsSel, n) {
    var pool = QS.filter(function (q) { return unitsSel.indexOf(q.unit) >= 0; }).map(function (q) { return q.id; });
    var qids = shuffle(pool).slice(0, Math.min(n, pool.length));
    var now = Date.now();
    var ex = { id: 'a' + now.toString(36), scope: scope, units: unitsSel, qids: qids, ans: {}, i: 0, start: now, end: now + qids.length * 60000 };
    store.set('exam', ex);
    go(scopeHash(scope));
  }

  function finishExam(auto) {
    var ex = activeExam();
    if (!ex) return null;
    var now = Math.min(Date.now(), ex.end);
    var right = 0, perUnit = {};
    ex.qids.forEach(function (id) {
      var q = qById[id], ok = ex.ans[id] === q.correct;
      if (ok) right++;
      perUnit[q.unit] = perUnit[q.unit] || { total: 0, right: 0 };
      perUnit[q.unit].total++; if (ok) perUnit[q.unit].right++;
    });
    var at = { id: ex.id, scope: ex.scope, units: ex.units, qids: ex.qids, ans: ex.ans, start: ex.start, used: now - ex.start, limit: ex.end - ex.start, right: right, total: ex.qids.length, perUnit: perUnit, auto: !!auto, at: Date.now() };
    var list = attempts(); list.unshift(at); store.set('attempts', list.slice(0, 40));
    store.del('exam');
    if (auto) store.set('autoSubmitted', at.id);
    return at;
  }

  function examRunner(ex) {
    var q = qById[ex.qids[ex.i]], left = ex.end - Date.now();
    var opts = q.options.map(function (o, i) {
      var chosen = ex.ans[q.id] === i;
      return '<label class="opt' + (chosen ? ' chosen' : '') + '"><input type="radio" name="exopt" value="' + i + '"' + (chosen ? ' checked' : '') + ' data-change="exans">' +
        '<span class="letter">' + LETTERS[i] + '</span><span>' + h(o) + '</span></label>';
    }).join('');
    var answered = ex.qids.filter(function (id) { return ex.ans[id] != null; }).length;
    var grid = '<div class="numgrid" role="group" aria-label="أرقام الأسئلة">' + ex.qids.map(function (id, i) {
      var done = ex.ans[id] != null;
      return '<button type="button" class="' + (done ? 'answered' : '') + '" data-act="exgo" data-i="' + i + '"' + (i === ex.i ? ' aria-current="true"' : '') + ' aria-label="السؤال ' + ar(i + 1) + (done ? '، مُجاب' : '، متروك') + '">' + h(i + 1) + '</button>';
    }).join('') + '</div><div class="legend"><span>المظلل: أجبت عنه</span><span>الكحلي: السؤال الحالي</span></div>';
    return '<div class="pagehead"><p class="eyebrow">' + h(scopeName(ex.scope)) + '</p><h1>محاولة اختبار جارية</h1>' +
      '<p class="small">المحاكاة للتدريب وليست نموذجًا رسميًّا للاختبار. لا يظهر التصحيح قبل التسليم، ويمكنك تغيير إجاباتك حتى تسلّم.</p></div>' +
      '<section class="panel"><div class="qhead"><span class="counter">سؤال ' + h(ex.i + 1) + ' من ' + h(ex.qids.length) + '</span>' +
      '<span class="qmeta"><span>أجبت عن ' + h(answered) + '</span><span>متبقٍ <span class="timer' + (left < 60000 ? ' low' : '') + '" data-timer>' + clock(left) + '</span></span></span></div>' +
      '<p class="qtext" tabindex="-1" id="exq">' + h(q.q) + '</p>' +
      '<fieldset class="opts"><legend>الخيارات</legend>' + opts + '</fieldset>' +
      '<div class="btnrow"><button type="button" class="btn" data-act="exprev"' + (ex.i === 0 ? ' disabled' : '') + '>' + icon('prev') + 'السابق</button>' +
      '<button type="button" class="btn" data-act="exnext"' + (ex.i >= ex.qids.length - 1 ? ' disabled' : '') + '>التالي' + icon('next') + '</button>' +
      (ex.ans[q.id] != null ? '<button type="button" class="btn btn-sm" data-act="exclear">امسح إجابة هذا السؤال</button>' : '') + '</div>' +
      grid +
      '<div class="btnrow" id="submitRow">' + submitControls(ex, answered) + '</div></section>';
  }
  var confirmSubmit = false;
  function submitControls(ex, answered) {
    if (!confirmSubmit) return '<button type="button" class="btn btn-primary" data-act="exsubmit">سلّم الاختبار</button>';
    var left = ex.qids.length - answered;
    return '<span class="confirm"><span>' + (left ? 'بقي ' + h(qWord(left)) + ' دون إجابة. ' : '') + 'هل تريد التسليم الآن؟</span>' +
      '<button type="button" class="btn btn-primary" data-act="exconfirm">نعم، سلّم</button><button type="button" class="btn" data-act="excancel">تابع الإجابة</button></span>';
  }

  var REV = { filter: 'all', unit: '' };
  function examResult(at) {
    var u = at.used;
    var missed = at.qids.filter(function (id) { return at.ans[id] !== qById[id].correct; });
    var unitRows = Object.keys(at.perUnit).sort().map(function (uid) {
      var p = at.perUnit[uid];
      return '<tr><th scope="row">' + h(unitById[uid].name) + '</th><td data-label="الأسئلة">' + h(p.total) + '</td><td data-label="الصحيحة">' + h(p.right) + '</td><td data-label="النسبة">' + h(pct(p.right, p.total)) + '٪</td></tr>';
    }).join('');
    var list = REV.filter === 'missed' ? missed : at.qids;
    if (REV.unit) list = list.filter(function (id) { return qById[id].unit === REV.unit; });
    var unitsIn = Object.keys(at.perUnit).sort();
    var review = list.map(function (id) {
      var q = qById[id], mine = at.ans[id], ok = mine === q.correct, n = at.qids.indexOf(id) + 1;
      return '<div class="reviewitem"><div class="qhead"><span class="counter">' + h(n) + '</span><span class="qmeta"><span>' + h(unitById[q.unit].name) + '</span><span class="' + (ok ? 'ans-right' : 'ans-wrong') + '">' + (ok ? 'صحيحة' : (mine == null ? 'متروكة' : 'غير صحيحة')) + '</span></span></div>' +
        '<p class="qtext">' + h(q.q) + '</p><ul class="answers-list read">' +
        '<li>إجابتك: ' + (mine == null ? 'لم تُجب' : '<span class="' + (ok ? 'ans-right' : 'ans-wrong') + '">' + h(q.options[mine]) + '</span>') + '</li>' +
        (ok ? '' : '<li>الإجابة الصحيحة: <span class="ans-right">' + h(q.options[q.correct]) + '</span></li>') + '</ul>' +
        '<div class="feedback"><h4>التعليل</h4><p>' + h(q.why) + '</p><h4>لماذا ليس «' + h(q.options[q.near]) + '»؟</h4><p>' + h(q.nearWhy) + '</p><div class="btnrow">' + srcBtn(q.page) + '</div></div></div>';
    }).join('') || '<p class="empty">لا أسئلة في هذا الاختيار.</p>';
    return '<div class="pagehead"><p class="eyebrow">' + h(scopeName(at.scope)) + ' · ' + h(fmtDate(at.start)) + '</p><h1>نتيجة المحاولة</h1>' +
      (at.auto ? '<p class="note">انتهى الوقت، فسُلِّمت المحاولة تلقائيًا.</p>' : '') + '</div>' +
      '<section class="panel"><p class="score">' + h(at.right) + ' من ' + h(at.total) + '</p>' +
      '<div class="kv"><div><b>' + h(pct(at.right, at.total)) + '٪</b><span>النسبة</span></div>' +
      '<div><b>' + clock(u) + '</b><span>الوقت المستخدم من ' + h(minWord(Math.round(at.limit / 60000))) + '</span></div>' +
      '<div><b>' + h(missed.length) + '</b><span>أخطاء ومتروكة</span></div></div>' +
      '<p class="small">لا تُغيّر المحاولات إحصاءات التدريب؛ تُحفظ في سجل مستقل. المحاكاة للتدريب وليست نموذجًا رسميًّا للاختبار.</p>' +
      '<div class="tablewrap"><table class="t stack"><caption class="sr">النتيجة حسب الوحدة</caption><thead><tr><th scope="col">الوحدة</th><th scope="col">الأسئلة</th><th scope="col">الصحيحة</th><th scope="col">النسبة</th></tr></thead><tbody>' + unitRows + '</tbody></table></div>' +
      '<div class="btnrow"><a class="btn btn-primary" href="' + scopeHash(at.scope) + '">محاولة جديدة</a>' + (at.scope !== 'mock' ? '<a class="btn" href="#unit-' + at.scope + '-practice">إلى التدريب</a>' : '<a class="btn" href="#bank">إلى بنك الأسئلة</a>') + '</div></section>' +
      '<section class="panel"><h2>مراجعة الإجابات</h2><div class="toolbar"><div class="field"><span class="lbl" id="rvl">الأسئلة</span><div class="seg" role="group" aria-labelledby="rvl">' +
      '<button type="button" data-act="revf" data-f="all" aria-pressed="' + (REV.filter === 'all') + '">كل الأسئلة</button>' +
      '<button type="button" data-act="revf" data-f="missed" aria-pressed="' + (REV.filter === 'missed') + '">الأخطاء والمتروكة (' + h(missed.length) + ')</button></div></div>' +
      (unitsIn.length > 1 ? '<div class="field"><label for="revu">الوحدة</label><select id="revu" data-change="revu"><option value="">كل الوحدات</option>' + unitsIn.map(function (uid) { return '<option value="' + uid + '"' + (REV.unit === uid ? ' selected' : '') + '>' + h(unitById[uid].name) + '</option>'; }).join('') + '</select></div>' : '') +
      '</div>' + review + '</section>';
  }

  function attemptsList(scope) {
    var list = attempts().filter(function (a) { return a.scope === scope; });
    if (!list.length) return '';
    return '<section class="panel"><h2>محاولاتك السابقة</h2><div class="tablewrap"><table class="t stack"><thead><tr><th scope="col">التاريخ</th><th scope="col">النتيجة</th><th scope="col">النسبة</th><th scope="col"><span class="sr">عرض</span></th></tr></thead><tbody>' +
      list.slice(0, 10).map(function (a) {
        return '<tr><th scope="row">' + h(fmtDate(a.start)) + '</th><td data-label="النتيجة">' + h(a.right) + ' من ' + h(a.total) + '</td><td data-label="النسبة">' + h(pct(a.right, a.total)) + '٪</td><td data-label="المراجعة"><a href="' + scopeHash(scope) + '?result=' + a.id + '">مراجعة الإجابات</a></td></tr>';
      }).join('') + '</tbody></table></div></section>';
  }

  function otherExamNote(ex) {
    return '<section class="panel"><p class="read">لديك محاولة جارية في «' + h(scopeName(ex.scope)) + '». أكملها أو سلّمها قبل أن تبدأ محاولة أخرى.</p><div class="btnrow"><a class="btn btn-primary" href="' + scopeHash(ex.scope) + '">تابع الاختبار</a></div></section>';
  }

  UNIT_TABS.exam = function (u) {
    if (u.id === 'all') return PAGES.mock(true);
    var ex = activeExam(), p = route.params;
    if (p.result) { var at = attempts().filter(function (a) { return a.id === p.result; })[0]; if (at) return examResult(at); }
    if (ex && ex.scope === u.id) return examRunner(ex);
    var n = qidsOf(u.id).length;
    var html = '<div class="pagehead"><p class="eyebrow">' + h(u.name) + ' · ' + h(range(u.from, u.to)) + '</p><h1>محاكاة الاختبار</h1>' +
      '<p class="read">أسئلة الوحدة كلها بترتيب عشوائي، دقيقة لكل سؤال. لا يظهر التصحيح قبل التسليم.</p></div>';
    if (ex) return html + otherExamNote(ex);
    html += '<section class="panel"><h2>' + h(qWord(n)) + ' في ' + h(minWord(n)) + '</h2>' +
      '<p class="read">يستمر العداد إذا غادرت الصفحة، ويظهر لك شريط المحاولة الجارية في الصفحات الأخرى. تُحفظ المحاولة في سجل مستقل ولا تُغيّر إحصاءات التدريب.</p>' +
      '<p class="note">المحاكاة للتدريب وليست نموذجًا رسميًّا للاختبار.</p>' +
      '<div class="btnrow"><button type="button" class="btn btn-primary btn-big" data-act="exstart" data-scope="' + u.id + '" data-n="' + n + '">ابدأ المحاولة</button></div></section>';
    return html + attemptsList(u.id);
  };

  /* — الاختبار الشامل — */
  var MOCK = { units: UNITS.map(function (u) { return u.id; }), n: 20 };
  PAGES.mock = function (inUnit) {
    var ex = activeExam(), p = route.params;
    if (p.result) { var at = attempts().filter(function (a) { return a.id === p.result; })[0]; if (at) return examResult(at); }
    if (ex && ex.scope === 'mock') return examRunner(ex);
    var html = '<div class="pagehead"><p class="eyebrow">' + h(C.reference) + '</p><h1>الاختبار الشامل</h1>' +
      '<p class="read">اختر الوحدات وعدد الأسئلة، فتُسحب الأسئلة عشوائيًا منها، بدقيقة لكل سؤال.</p></div>';
    if (inUnit) html = '<p class="note">محاكاة «المقرر كاملًا» هي الاختبار الشامل نفسه.</p>' + html;
    if (ex) return html + otherExamNote(ex);
    var pool = QS.filter(function (q) { return MOCK.units.indexOf(q.unit) >= 0; }).length;
    var counts = [10, 20, 30, 40].filter(function (c) { return c < pool; }); counts.push(pool);
    if (counts.indexOf(MOCK.n) < 0) MOCK.n = counts.filter(function (c) { return c <= 20; }).pop() || counts[0];
    html += '<section class="panel"><h2>إعداد المحاولة</h2>' +
      '<div class="field"><span class="lbl" id="mul">الوحدات</span><div class="chips" role="group" aria-labelledby="mul">' +
      UNITS.map(function (u) { var on = MOCK.units.indexOf(u.id) >= 0; return '<button type="button" class="chip chip-num" data-act="mockunit" data-unit="' + u.id + '" aria-pressed="' + on + '" title="' + h(u.name + ': ' + u.title) + '" aria-label="' + h(u.name) + '">' + h(u.number) + '</button>'; }).join('') +
      '</div></div>' +
      '<div class="field" style="margin-top:12px"><span class="lbl" id="mpl">اختيارات جاهزة</span><div class="chips" role="group" aria-labelledby="mpl">' +
      (C.mockPresets || []).map(function (pr, i) { var on = pr.units.join() === MOCK.units.join(); return '<button type="button" class="chip" data-act="mockpreset" data-i="' + i + '" aria-pressed="' + on + '">' + h(pr.label) + '</button>'; }).join('') +
      '</div></div>' +
      '<div class="field" style="margin-top:12px;max-width:320px"><label for="mockn">عدد الأسئلة والمدة</label><select id="mockn" data-change="mockn"' + (pool ? '' : ' disabled') + '>' +
      counts.map(function (c) { return '<option value="' + c + '"' + (c === MOCK.n ? ' selected' : '') + '>' + h(qWord(c)) + ' في ' + h(minWord(c)) + '</option>'; }).join('') + '</select></div>' +
      '<p class="small" style="margin-top:10px">في الوحدات المختارة ' + h(qWord(pool)) + '.</p>' +
      '<p class="note">المحاكاة للتدريب وليست نموذجًا رسميًّا للاختبار. يستمر العداد إذا غادرت الصفحة.</p>' +
      '<div class="btnrow"><button type="button" class="btn btn-primary btn-big" data-act="exstart" data-scope="mock"' + (pool ? '' : ' disabled') + '>ابدأ المحاولة</button></div></section>';
    return html + attemptsList('mock');
  };

  /* — خرائط المفاهيم — */
  var MAPOPEN = {};
  UNIT_TABS.maps = function (u) {
    var topics = topicsOf(u.id), p = route.params;
    var key = u.id;
    var ti = p.t != null ? parseInt(p.t, 10) : (MAPOPEN[key + ':t'] || 0);
    if (u.id === 'all' && p.t != null && String(p.t).indexOf(':') > 0) ti = topics.map(function (t) { return t.key; }).indexOf(p.t);
    if (!(ti >= 0 && ti < topics.length)) ti = 0;
    MAPOPEN[key + ':t'] = ti;
    var T = topics[ti], t = T.t;
    var qn = QS.filter(function (q) { return topicKeyOf(q) === T.key; }).length;
    var open = MAPOPEN[key + ':' + T.key];
    var sel = '<select id="mapsel" data-change="mapsel" data-unit="' + u.id + '">' + topics.map(function (x, i) {
      return '<option value="' + i + '"' + (i === ti ? ' selected' : '') + '>' + h((u.id === 'all' ? x.unit.name + ': ' : '') + x.t.title) + '</option>';
    }).join('') + '</select>';
    var branches = t.nodes.map(function (n, i) {
      return '<button type="button" class="branch" data-act="branch" data-unit="' + u.id + '" data-tk="' + T.key + '" data-i="' + i + '" aria-expanded="' + (open === i) + '" aria-controls="mapdetail"><span class="term">' + h(n[0]) + '</span><span class="hint">اضغط لقراءة العلاقة والشرح ←</span></button>';
    }).join('');
    var detail = '';
    if (open != null && t.nodes[open]) {
      var n = t.nodes[open];
      detail = '<div class="detail" id="mapdetail" tabindex="-1"><h3>' + h(n[0]) + '</h3><p>' + h(n[1]) + '</p><div class="btnrow">' + srcBtn(n[2]) + (n[3] ? srcBtn(n[3]) : '') + '</div></div>';
    } else detail = '<div id="mapdetail"></div>';
    var targetUnit = T.unit.id;
    return '<div class="pagehead"><p class="eyebrow">' + h(u.name) + ' · ' + h(range(u.from, u.to)) + '</p><h1>خرائط المفاهيم</h1>' +
      '<p class="read">حاول إعادة بناء الخريطة من ذاكرتك بعد قراءتها.</p></div>' +
      '<div class="toolbar"><div class="field" style="flex:1 1 280px"><label for="mapsel">المحور</label>' + sel + '</div></div>' +
      '<div class="btnrow" style="margin:0 0 6px"><button type="button" class="btn btn-primary" data-act="mapstep" data-unit="' + u.id + '" data-d="-1"' + (ti === 0 ? ' disabled' : '') + '>' + icon('prev') + 'المحور السابق</button>' +
      '<button type="button" class="btn btn-primary" data-act="mapstep" data-unit="' + u.id + '" data-d="1"' + (ti >= topics.length - 1 ? ' disabled' : '') + '>المحور التالي' + icon('next') + '</button>' +
      (qn ? '<a class="btn" href="#unit-' + (u.id === 'all' ? 'all' : targetUnit) + '-practice?topic=' + T.key + '">تدرّب على أسئلة هذا المحور (' + h(qn) + ')</a>' : '') + '</div>' +
      '<section class="panel"><p class="maprange">' + h(range(t.from, t.to)) + (u.id === 'all' ? ' · ' + h(T.unit.name) : '') + '</p>' +
      '<p class="read">' + h(t.intro) + '</p>' +
      '<div class="maproot"><span class="pill">' + h(t.title) + '</span><span class="stem" aria-hidden="true"></span></div>' +
      '<div class="branches">' + branches + '</div>' + detail +
      '<div class="note" style="margin-top:18px"><p><strong>مفتاح الاسترجاع:</strong> ' + h(t.key) + '</p></div></section>';
  };

  /* — المقارنات — */
  function tableHtml(c, stack) {
    return '<div class="tablewrap"><table class="t' + (stack !== false ? ' stack' : '') + '"><caption class="sr">' + h(c.title) + '</caption><thead><tr>' +
      c.headings.map(function (x) { return '<th scope="col">' + h(x) + '</th>'; }).join('') + '</tr></thead><tbody>' +
      c.rows.map(function (r) {
        return '<tr>' + r.map(function (cell, i) {
          return i === 0 ? '<th scope="row">' + h(cell) + '</th>' : '<td data-label="' + h(c.headings[i]) + '">' + h(cell) + '</td>';
        }).join('') + '</tr>';
      }).join('') + '</tbody></table></div>';
  }
  var CMPI = {};
  UNIT_TABS.compare = function (u) {
    var list = comparisonsOf(u.id);
    var html = '<div class="pagehead"><p class="eyebrow">' + h(u.name) + ' · ' + h(range(u.from, u.to)) + '</p><h1>المقارنات</h1></div>';
    if (!list.length) return html + '<section class="panel empty"><p>لا جداول مقارنة في هذه الوحدة.</p></section>';
    var i = route.params.c != null ? parseInt(route.params.c, 10) : (CMPI[u.id] || 0);
    if (!(i >= 0 && i < list.length)) i = 0;
    CMPI[u.id] = i;
    var X = list[i], c = X.c;
    var tk = c.topic != null ? X.unit.id + ':' + c.topic : null;
    var qn = tk ? QS.filter(function (q) { return topicKeyOf(q) === tk; }).length : 0;
    html += '<div class="toolbar"><div class="field" style="flex:1 1 280px"><label for="cmpsel">الجدول</label><select id="cmpsel" data-change="cmpsel" data-unit="' + u.id + '">' +
      list.map(function (x, j) { return '<option value="' + j + '"' + (j === i ? ' selected' : '') + '>' + h((u.id === 'all' ? x.unit.name + ': ' : '') + x.c.title) + '</option>'; }).join('') + '</select></div></div>' +
      '<div class="btnrow" style="margin:0 0 6px"><button type="button" class="btn btn-primary" data-act="cmpstep" data-unit="' + u.id + '" data-d="-1"' + (i === 0 ? ' disabled' : '') + '>' + icon('prev') + 'المقارنة السابقة</button>' +
      '<button type="button" class="btn btn-primary" data-act="cmpstep" data-unit="' + u.id + '" data-d="1"' + (i >= list.length - 1 ? ' disabled' : '') + '>المقارنة التالية' + icon('next') + '</button>' +
      (qn ? '<a class="btn" href="#unit-' + (u.id === 'all' ? 'all' : X.unit.id) + '-practice?topic=' + tk + '">تدرّب على أسئلة هذه المقارنة (' + h(qn) + ')</a>' : '') + '</div>' +
      '<section class="panel"><div class="panel-title"><h2>' + h(c.title) + '</h2>' + srcBtn(c.page, 'راجع الأصل · ' + c.ref) + '</div>' +
      '<p class="read">' + h(c.desc) + '</p>' + tableHtml(c) +
      (c.note ? '<p class="note">' + h(c.note) + '</p>' : '') + '</section>';
    return html;
  };

  /* — الأعلام — */
  function figTable(list, showUnit) {
    return '<div class="tablewrap"><table class="t zebra stack"><caption class="sr">الأعلام والنظريات</caption><thead><tr><th scope="col">العلم</th><th scope="col">النظرية/الفكرة</th><th scope="col">الشرح</th>' +
      (showUnit ? '<th scope="col">الوحدة</th>' : '') + '<th scope="col">الصفحة</th></tr></thead><tbody>' +
      list.map(function (x) {
        var f = x.f;
        return '<tr><th scope="row"><span class="figname">' + h(f.name) + '</span><br><span class="small">' + h(f.field) + '</span></th>' +
          '<td data-label="النظرية/الفكرة"><span class="figidea">' + h(f.idea) + '</span></td>' +
          '<td data-label="الشرح">' + h(f.explain) + (f.compare ? '<br><span class="small"><b>وجه المقارنة:</b> ' + h(f.compare) + '</span>' : '') + '</td>' +
          (showUnit ? '<td data-label="الوحدة"><a href="#unit-' + x.unit.id + '-home">' + h(x.unit.name) + '</a></td>' : '') +
          '<td data-label="الصفحة">' + srcBtn(f.page, pg(f.page)) + '</td></tr>';
      }).join('') + '</tbody></table></div>';
  }
  UNIT_TABS.figures = function (u) {
    var list = figuresOf(u.id);
    var html = '<div class="pagehead"><p class="eyebrow">' + h(u.name) + ' · ' + h(range(u.from, u.to)) + '</p><h1>الأعلام والنظريات</h1><p class="read">' + h(C.figNote) + '</p></div>';
    if (!list.length) return html + '<section class="panel"><p class="read">لا تتضمن هذه الوحدة حواشي تراجم؛ فهي تجمع رواد النظريات الذين وردت تراجمهم في الوحدات السابقة. تجدهم جميعًا في <a href="#figures">صفحة الأعلام العامة</a>.</p></section>';
    return html + '<section class="panel">' + figTable(list, u.id === 'all') + '</section>';
  };
  var FIG = { q: '', unit: '' };
  PAGES.figures = function () {
    var all = figuresOf('all');
    var norm = function (s) { return String(s).replace(/[ً-ْ]/g, '').replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').toLowerCase(); };
    var q = norm(FIG.q.trim());
    var list = all.filter(function (x) {
      if (FIG.unit && x.unit.id !== FIG.unit) return false;
      if (!q) return true;
      return norm([x.f.name, x.f.idea, x.f.explain, x.f.field, x.f.compare].join(' ')).indexOf(q) >= 0;
    });
    return '<div class="pagehead"><p class="eyebrow">' + h(C.reference) + '</p><h1>الأعلام والنظريات</h1><p class="read">' + h(C.figNote) + '</p></div>' +
      '<div class="toolbar"><div class="field" style="flex:1 1 240px"><label for="figq">ابحث</label><input type="search" id="figq" value="' + esc(FIG.q) + '" data-input="figq" placeholder="اسم علم أو نظرية" autocomplete="off"></div>' +
      '<div class="field"><label for="figu">الوحدة</label><select id="figu" data-change="figu"><option value="">كل الوحدات</option>' +
      UNITS.filter(function (u) { return (u.figures || []).length; }).map(function (u) { return '<option value="' + u.id + '"' + (FIG.unit === u.id ? ' selected' : '') + '>' + h(u.name) + '</option>'; }).join('') + '</select></div></div>' +
      '<p class="small" role="status" id="figcount">النتائج: ' + h(list.length) + ' من ' + h(all.length) + '</p>' +
      '<div id="figtable">' + (list.length ? figTable(list, true) : '<section class="panel empty"><p>لا نتائج.</p></section>') + '</div>';
  };

  /* — الخلاصة — */
  UNIT_TABS.summary = function (u) {
    var topics = topicsOf(u.id);
    var inFrame = false; try { inFrame = window.self !== window.top; } catch (e) { inFrame = true; }
    var html = '<div class="printhead">مسار · ' + h(C.title) + ' — ' + h(u.name) + ' · ' + h(C.reference) + ' ' + h(range(u.from, u.to)) + '</div>' +
      '<div class="pagehead"><p class="eyebrow">' + h(u.name) + ' · ' + h(range(u.from, u.to)) + '</p><h1>خلاصة ' + h(u.id === 'all' ? 'الفصل' : u.name) + '</h1>' +
      '<p class="read">كل محور بعُقده ومفتاح استرجاعه، بترتيب المذكرة. النصوص بين علامتي التنصيص منقولة من المذكرة.</p></div>' +
      (inFrame ? '' : '<div class="btnrow noprint" style="margin:0 0 10px"><button type="button" class="btn" data-act="print">' + icon('print') + 'طباعة الخلاصة</button></div>');
    var lastUnit = null;
    topics.forEach(function (T) {
      if (u.id === 'all' && lastUnit !== T.unit.id) { html += '<h2 style="margin-top:22px">' + h(T.unit.name + ': ' + T.unit.title) + '</h2>'; lastUnit = T.unit.id; }
      var t = T.t;
      html += '<section class="panel sumtopic"><h3>' + h(t.title) + ' <span class="small">(' + h(range(t.from, t.to)) + ')</span></h3><ul class="sumlist read">' +
        t.nodes.map(function (n) { return '<li><b>' + h(n[0]) + ':</b> ' + h(n[1]) + ' <span class="small">(' + h(pg(n[2])) + (n[3] ? '، ' + h(pg(n[3])) : '') + ')</span></li>'; }).join('') +
        '</ul><p class="note"><strong>مفتاح الاسترجاع:</strong> ' + h(t.key) + '</p></section>';
    });
    return html;
  };

  /* — عن هذا الكتاب — */
  var resetArmed = false;
  PAGES.about = function () {
    var cov = UNITS.map(function (u) {
      var hit = {}; QS.forEach(function (q) { if (q.unit === u.id) hit[q.topic] = true; });
      var n = QS.filter(function (q) { return q.unit === u.id; }).length;
      return '<tr><th scope="row"><a href="#unit-' + u.id + '-home">' + h(u.name) + '</a></th><td data-label="الصفحات">' + h(range(u.from, u.to)) + '</td><td data-label="المحاور">' + h(u.topics.length) + '</td>' +
        '<td data-label="محاور ممثلة في البنك">' + h(Object.keys(hit).length) + '</td><td data-label="عدد الأسئلة">' + h(n) + '</td><td data-label="الحالة">' + h(C.status) + '</td></tr>';
    }).join('');
    var audit = (M.audit || []).map(function (a) {
      return '<li><b>' + h(pg(a.page)) + ' — ' + h(a.kind) + ':</b> ' + h(a.text) + ' ' + (C.missingPages.indexOf(a.page) < 0 ? srcBtn(a.page, pg(a.page)) : '') + '</li>';
    }).join('');
    var refs = (M.refs || []).map(function (r) {
      return '<tr><th scope="row" dir="auto">' + h(r.cite) + '</th><td data-label="الصفحات">' + r.pages.map(function (p) { return srcBtn(p, pg(p)); }).join(' ') + '</td></tr>';
    }).join('');
    var u7 = unitById.u7; var u7topic = u7 ? u7.topics.length - 1 : -1;
    return '<div class="pagehead"><p class="eyebrow">' + h(C.reference) + ' · ' + h(range(C.firstPage, C.lastPage)) + '</p><h1>عن هذا الكتاب</h1></div>' +
      '<section class="panel"><h2>بطاقة المذكرة</h2><div class="tablewrap"><table class="t stack"><tbody>' +
      [['الكتاب', C.bookTitle], ['الفصل', 'الفصل السابع: ' + C.title], ['النطاق', C.scope], ['المؤلف', C.author], ['رمز المقرر', C.code], ['الجهة', C.institution], ['عدد صفحات الملف', ar(C.pageCount) + ' صفحة؛ ' + C.missingNote], ['حالة المحتوى', C.status + ' (روجع على صور الصفحات)']]
        .map(function (r) { return '<tr><th scope="row">' + h(r[0]) + '</th><td data-label="' + h(r[0]) + '">' + h(r[1]) + '</td></tr>'; }).join('') +
      '</tbody></table></div><p class="read">' + h(C.unitNote) + ' ' + h(C.orderNote) + '</p><p class="note">' + h(C.outsideNote) + '</p>' +
      '<p class="small">«مدقق» تعني أن المحتوى قوبل بصور صفحات المذكرة. أما الاعتماد النهائي فمتروك لمراجعتك أنت؛ لم يمنح الموقع نفسه صفة «معتمد».</p></section>' +

      '<section class="panel"><h2>كيف تُحسب المؤشرات؟</h2><ul class="read" style="padding-inline-start:1.2em">' +
      '<li><b>الإنجاز:</b> عدد الأسئلة التي أجبت عنها مرة واحدة على الأقل، من مجموع أسئلة الوحدة.</li>' +
      '<li><b>الدقة:</b> نسبة الصحيح محسوبة من آخر إجابة لك عن كل سؤال، لا من مجموع محاولاتك.</li>' +
      '<li><b>الوحدة المتقنة:</b> أجبت عن كل أسئلتها، ونسبة الصحيح في آخر إجاباتك ٨٠٪ فأكثر.</li>' +
      '<li><b>مراجعة اليوم:</b> لكل سؤال صندوق من ١ إلى ٥، بفواصل ١ و٢ و٤ و٨ و١٦ يومًا. الإجابة الصحيحة تنقله إلى الصندوق التالي، والخاطئة تعيده إلى الأول.</li>' +
      '<li><b>محاولات الاختبار:</b> تُحفظ في سجل مستقل، ولا تُغيّر إحصاءات التدريب.</li></ul></section>' +

      '<section class="panel"><h2>حفظ التقدم</h2><p class="read">يُحفظ تقدمك في هذا المتصفح فقط، ولهذا الكتاب وحده. لا يوجد حساب ولا مزامنة بين الأجهزة، ومسح بيانات المتصفح يمحو التقدم.' +
      (storageOK ? '' : ' <b>التخزين معطّل في هذا المتصفح الآن؛ سيضيع تقدمك عند إغلاق الصفحة.</b>') + '</p>' +
      '<div class="btnrow" id="resetRow">' + (resetArmed
        ? '<span class="confirm"><span>سيُمحى كل تقدمك ومحاولاتك في هذا الكتاب.</span><button type="button" class="btn btn-danger" data-act="resetgo">نعم، امسح تقدمي</button><button type="button" class="btn" data-act="resetcancel">إلغاء</button></span>'
        : '<button type="button" class="btn btn-danger" data-act="resetarm">مسح تقدمي في هذا الكتاب</button>') + '</div></section>' +

      '<section class="panel"><h2>بنك الأسئلة</h2><p class="read">' + h(QS.length) + ' سؤالًا من نوع الاختيار من متعدد، تقيس تذكّر تعريفات الفصل ومفاهيمه والتمييز بين ما يتشابه منها وتطبيقاته. لكل سؤال أربعة خيارات وإجابة واحدة، وتعليل، وبيان لسبب خطأ أقرب خيار، وصفحة في المذكرة. نسخة البنك: ' + h(M.bankVersion) + '.</p>' +
      '<p class="note">لا تمثّل الأسئلة ولا توزيعها ولا صعوبتها الاختبار الرسمي. هي صياغات تعليمية مقترحة من إعداد الموقع. وأسئلة الفصل العشرة المقالية (ص ٢٦٦) معروضة كما وردت في <a href="#unit-u7-maps?t=' + u7topic + '">خرائط الوحدة السابعة</a>، ولم تُحوَّل إلى اختيار من متعدد.</p></section>' +

      '<section class="panel"><h2>سجل التغطية</h2><div class="tablewrap"><table class="t stack"><thead><tr><th scope="col">الوحدة</th><th scope="col">الصفحات</th><th scope="col">المحاور</th><th scope="col">محاور ممثلة في البنك</th><th scope="col">عدد الأسئلة</th><th scope="col">الحالة</th></tr></thead><tbody>' + cov + '</tbody></table></div>' +
      '<p class="small">المحور غير الممثل في البنك هو «أسئلة الفصل كما وردت» في الوحدة السابعة، لأنها أسئلة مقالية.</p></section>' +

      '<section class="panel"><h2>ملاحظات التدقيق على نص المذكرة</h2><p class="read">مواضع فيها خطأ طباعي ظاهر أو غموض أو اختلاف في التسمية. نُقل النص في الموقع كما ورد، ولم يُصحَّح شيء بصمت.</p><ul class="read" style="padding-inline-start:1.2em">' + audit + '</ul></section>' +

      '<section class="panel"><h2>مراجع المذكرة</h2><p class="read">' + h(C.refsNote) + '</p><div class="tablewrap"><table class="t stack"><thead><tr><th scope="col">الاستشهاد كما ورد</th><th scope="col">الصفحات</th></tr></thead><tbody>' + refs + '</tbody></table></div></section>' +

      '<section class="panel"><h2>صور الصفحات</h2><p class="read">زر «راجع الأصل» يفتح صورة الصفحة المطبوعة نفسها. الصور مأخوذة من الملف المرفق كما هي، وضُغطت لتخفيف حجمها، ودُوّرت ص ٢٦٦ لأنها مقلوبة في الملف. ' + h(C.missingNote) + '</p></section>';
  };

  /* ───────────── عارض الصفحات ───────────── */
  var srcDlg = document.getElementById('sourceDlg'), srcBody = document.getElementById('sourceBody'), srcTitle = document.getElementById('sourceTitle');
  var srcPage = C.firstPage, srcOpener = null;
  function availablePages() { var a = []; for (var p = C.firstPage; p <= C.lastPage; p++) if (C.missingPages.indexOf(p) < 0) a.push(p); return a; }
  function showPage(p) {
    srcPage = p;
    srcTitle.textContent = 'المذكرة · ' + pg(p);
    var pages = availablePages(), i = pages.indexOf(p);
    document.getElementById('srcPrev').disabled = i <= 0 && p <= pages[0];
    document.getElementById('srcNext').disabled = i >= pages.length - 1 && p >= pages[pages.length - 1];
    var fallback = '<p class="note">صورة هذه الصفحة غير متاحة في هذه النسخة؛ راجع الصفحة نفسها في المذكرة المطبوعة أو ملف PDF.</p>';
    if (C.missingPages.indexOf(p) >= 0) { srcBody.innerHTML = fallback; return; }
    srcBody.innerHTML = '<img class="pageimg" src="pages/p-' + p + '.webp" alt="صورة الصفحة ' + ar(p) + ' من المذكرة" tabindex="0" role="button" aria-pressed="false" aria-label="صورة الصفحة ' + ar(p) + '، اضغط للتكبير أو التصغير">';
    var img = srcBody.querySelector('img');
    img.onerror = function () { srcBody.innerHTML = fallback; };
    srcBody.scrollTop = 0;
  }
  function openSource(p) {
    srcOpener = document.activeElement;
    showPage(p);
    if (typeof srcDlg.showModal === 'function') { if (!srcDlg.open) srcDlg.showModal(); } else srcDlg.setAttribute('open', '');
    document.getElementById('srcClose').focus();
  }
  function stepSource(d) {
    var pages = availablePages(), i = pages.indexOf(srcPage);
    if (i < 0) { i = pages.filter(function (x) { return x < srcPage; }).length - (d > 0 ? 1 : 0); }
    var n = pages[i + d];
    if (n != null) showPage(n);
  }
  function closeDlg(dlg) { if (dlg.open) { if (typeof dlg.close === 'function') dlg.close(); else dlg.removeAttribute('open'); } }
  document.getElementById('srcPrev').addEventListener('click', function () { stepSource(-1); });
  document.getElementById('srcNext').addEventListener('click', function () { stepSource(1); });
  document.getElementById('srcClose').addEventListener('click', function () { closeDlg(srcDlg); });
  srcDlg.addEventListener('close', function () { if (srcOpener && srcOpener.focus) srcOpener.focus(); });
  srcBody.addEventListener('click', function (e) {
    var img = e.target.closest('.pageimg'); if (!img) return;
    var z = img.classList.toggle('zoomed'); img.setAttribute('aria-pressed', String(z));
  });
  srcBody.addEventListener('keydown', function (e) {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.classList.contains('pageimg')) { e.preventDefault(); e.target.click(); }
  });
  srcDlg.addEventListener('keydown', function (e) {
    if (e.target.tagName === 'SELECT' || e.target.tagName === 'INPUT') return;
    if (e.key === 'ArrowLeft') { stepSource(1); e.preventDefault(); }
    if (e.key === 'ArrowRight') { stepSource(-1); e.preventDefault(); }
  });

  /* ───────────── حوار الوحدات ───────────── */
  var unitsDlg = document.getElementById('unitsDlg'), unitsOpener = null;
  function openUnits() {
    unitsOpener = document.activeElement;
    var list = UNITS.map(function (u) {
      var s = stats(u.id);
      return '<li><a href="#unit-' + u.id + '-home"><span class="ubadge" aria-hidden="true">' + h(u.number) + '</span><span><span class="t1">' + h(u.name + ': ' + u.title) + '</span><span class="t2">' + h(range(u.from, u.to)) + ' · أجبت عن ' + h(s.answered) + ' من ' + h(s.total) + '</span></span></a></li>';
    }).join('');
    document.getElementById('unitsBody').innerHTML = '<ul class="unitlist">' + list +
      '<li><a href="#unit-all-home"><span class="ubadge" aria-hidden="true">م</span><span><span class="t1">المقرر كاملًا</span><span class="t2">الوحدات كلها بترتيب الفصل</span></span></a></li></ul>';
    if (typeof unitsDlg.showModal === 'function') unitsDlg.showModal(); else unitsDlg.setAttribute('open', '');
    var first = unitsDlg.querySelector('a'); if (first) first.focus();
  }
  document.getElementById('unitsClose').addEventListener('click', function () { closeDlg(unitsDlg); });
  unitsDlg.addEventListener('click', function (e) { if (e.target.closest('a')) { unitsOpener = null; closeDlg(unitsDlg); } else if (e.target === unitsDlg) closeDlg(unitsDlg); });
  unitsDlg.addEventListener('close', function () { if (unitsOpener && unitsOpener.focus) unitsOpener.focus(); });
  srcDlg.addEventListener('click', function (e) { if (e.target === srcDlg) closeDlg(srcDlg); });

  /* ───────────── الوضع الليلي ───────────── */
  var themeSwitch = document.getElementById('themeSwitch');
  function syncTheme() {
    var dark = document.documentElement.getAttribute('data-theme') === 'dark';
    themeSwitch.setAttribute('aria-checked', String(dark));
    var mt = document.querySelector('meta[name="theme-color"]'); if (mt) mt.setAttribute('content', dark ? '#1E1C19' : '#F9F7F1');
  }
  themeSwitch.addEventListener('click', function () {
    var dark = document.documentElement.getAttribute('data-theme') !== 'dark';
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    try { localStorage.setItem('masar:theme', dark ? 'dark' : 'light'); } catch (e) {}
    syncTheme();
  });
  syncTheme();

  /* ───────────── شريط المحاولة الجارية والعدّاد ───────────── */
  var banner = document.getElementById('examBanner');
  function onRunner() { var ex = activeExam(); return ex && ((ex.scope === 'mock' && (route.page === 'mock' || (route.page === 'unit' && route.unit === 'all' && route.tab === 'exam'))) || (route.page === 'unit' && route.unit === ex.scope && route.tab === 'exam')) && !route.params.result; }
  function updateBanner() {
    var ex = activeExam(), auto = store.get('autoSubmitted', null);
    if (ex && !onRunner()) {
      banner.hidden = false;
      banner.innerHTML = '<div class="exam-banner-in" role="status"><span>محاولة اختبار جارية — متبقٍ <span data-timer>' + clock(ex.end - Date.now()) + '</span></span><a class="btn btn-sm" href="' + scopeHash(ex.scope) + '">تابع الاختبار</a></div>';
    } else if (!ex && auto) {
      var at = attempts().filter(function (a) { return a.id === auto; })[0];
      if (!at) { store.del('autoSubmitted'); banner.hidden = true; banner.innerHTML = ''; return; }
      if (route.params.result === auto) { store.del('autoSubmitted'); banner.hidden = true; banner.innerHTML = ''; return; }
      banner.hidden = false;
      banner.innerHTML = '<div class="exam-banner-in" role="status"><span>انتهى وقت الاختبار، فسُلِّمت المحاولة تلقائيًا.</span><a class="btn btn-sm" href="' + scopeHash(at.scope) + '?result=' + at.id + '">اعرض النتيجة</a></div>';
    } else { banner.hidden = true; banner.innerHTML = ''; }
  }
  function tick() {
    var ex = activeExam();
    if (!ex) return;
    var left = ex.end - Date.now();
    if (left <= 0) {
      var wasOn = onRunner();
      var at = finishExam(true);
      confirmSubmit = false;
      if (wasOn && at) { store.del('autoSubmitted'); REV = { filter: 'all', unit: '' }; go(scopeHash(at.scope) + '?result=' + at.id); }
      else updateBanner();
      return;
    }
    document.querySelectorAll('[data-timer]').forEach(function (el) { el.textContent = clock(left); if (left < 60000) el.classList.add('low'); });
  }
  setInterval(tick, 1000);
  tick();

  /* ───────────── الأحداث ───────────── */
  function rerenderKeep(sel) {
    render(false);
    if (sel) { var el = document.querySelector(sel); if (el) try { el.focus({ preventScroll: true }); } catch (e) { el.focus(); } }
  }
  function focusQ() { var el = main.querySelector('.qtext[tabindex]'); if (el) { try { el.focus({ preventScroll: false }); } catch (e) { el.focus(); } } }

  var ACT = {
    fav: function (el) { var f = store.get('favs', []), id = el.dataset.unit, i = f.indexOf(id); if (i >= 0) f.splice(i, 1); else f.push(id); store.set('favs', f); rerenderKeep('[data-act="fav"][data-unit="' + id + '"]'); },
    check: function (el) { doCheck(el.dataset.ctx); },
    retry: function (el) { var st = prState(el.dataset.ctx); st.cur = { qid: st.cur.qid, pick: null, checked: false }; render(false); var r = main.querySelector('.opts input'); if (r) r.focus(); },
    mode: function (el) { var st = prState(el.dataset.ctx); st.mode = el.dataset.mode; if (st.mode === 'round' && st.round && st.round.done) st.round = null; st.cur = { qid: null, pick: null, checked: false }; rerenderKeep('[data-act="mode"][data-mode="' + st.mode + '"]'); },
    newround: function (el) {
      var key = el.dataset.ctx, st = prState(key), uid = key.split(':')[1], ids = qidsOf(uid);
      if (el.dataset.set === 'retry' && st.round) { var w = Object.keys(st.round.res).filter(function (id) { return !st.round.res[id]; }); startRound(st, w, 'retry'); }
      else startRound(st, ids, el.dataset.set || 'all');
      render(false); focusQ();
    },
    rprev: function (el) { var r = prState(el.dataset.ctx).round; if (r.i > 0) r.i--; render(false); focusQ(); },
    rnext: function (el) {
      var r = prState(el.dataset.ctx).round;
      if (r.i < r.ids.length - 1) r.i++; else r.done = true;
      render(false);
      var hh = r.done ? main.querySelector('.panel h2') : null;
      if (hh) { hh.setAttribute('tabindex', '-1'); hh.focus(); } else focusQ();
    },
    rend: function (el) { prState(el.dataset.ctx).round.done = true; render(false); var hh = main.querySelector('.panel h2'); if (hh) { hh.setAttribute('tabindex', '-1'); hh.focus(); } },
    fprev: function (el) { var f = prState(el.dataset.ctx).free; if (f.i > 0) f.i--; render(false); focusQ(); },
    fnext: function (el) { var f = prState(el.dataset.ctx).free; f.i++; render(false); focusQ(); },
    fgo: function (el) { prState(el.dataset.ctx).free.i = parseInt(el.dataset.i, 10); render(false); focusQ(); },
    fstatus: function (el) { var f = prState(el.dataset.ctx).free; f.status = el.dataset.status; f.i = 0; rerenderKeep('[data-act="fstatus"][data-status="' + f.status + '"]'); },
    bankstatus: function (el) { BANK.status = el.dataset.status; prState('bank').free.i = 0; rerenderKeep('[data-act="bankstatus"][data-status="' + BANK.status + '"]'); },
    bankview: function (el) { BANK.view = el.dataset.view; rerenderKeep('[data-act="bankview"][data-view="' + BANK.view + '"]'); },
    exstart: function (el) {
      var scope = el.dataset.scope;
      if (scope === 'mock') { if (!MOCK.units.length) return; startExam('mock', MOCK.units.slice(), MOCK.n); }
      else startExam(scope, [scope], parseInt(el.dataset.n, 10));
      confirmSubmit = false;
    },
    exprev: function () { var ex = activeExam(); if (ex.i > 0) { ex.i--; store.set('exam', ex); } confirmSubmit = false; render(false); main.querySelector('#exq').focus(); },
    exnext: function () { var ex = activeExam(); if (ex.i < ex.qids.length - 1) { ex.i++; store.set('exam', ex); } confirmSubmit = false; render(false); main.querySelector('#exq').focus(); },
    exgo: function (el) { var ex = activeExam(); ex.i = parseInt(el.dataset.i, 10); store.set('exam', ex); confirmSubmit = false; render(false); main.querySelector('#exq').focus(); },
    exclear: function () { var ex = activeExam(); delete ex.ans[ex.qids[ex.i]]; store.set('exam', ex); rerenderKeep('#exq'); },
    exsubmit: function () { confirmSubmit = true; rerenderKeep('[data-act="exconfirm"]'); },
    excancel: function () { confirmSubmit = false; rerenderKeep('[data-act="exsubmit"]'); },
    exconfirm: function () { var at = finishExam(false); confirmSubmit = false; REV = { filter: 'all', unit: '' }; if (at) go(scopeHash(at.scope) + '?result=' + at.id); },
    revf: function (el) { REV.filter = el.dataset.f; rerenderKeep('[data-act="revf"][data-f="' + REV.filter + '"]'); },
    mockunit: function (el) {
      var id = el.dataset.unit, i = MOCK.units.indexOf(id);
      if (i >= 0) MOCK.units.splice(i, 1); else MOCK.units.push(id);
      MOCK.units.sort(function (a, b) { return unitById[a].number - unitById[b].number; });
      rerenderKeep('[data-act="mockunit"][data-unit="' + id + '"]');
    },
    mockpreset: function (el) { MOCK.units = C.mockPresets[parseInt(el.dataset.i, 10)].units.slice(); rerenderKeep('[data-act="mockpreset"][data-i="' + el.dataset.i + '"]'); },
    branch: function (el) {
      var k = el.dataset.unit + ':' + el.dataset.tk, i = parseInt(el.dataset.i, 10);
      MAPOPEN[k] = MAPOPEN[k] === i ? null : i;
      render(false);
      var d = document.getElementById('mapdetail');
      if (MAPOPEN[k] != null && d && d.focus) { try { d.focus({ preventScroll: false }); } catch (e) { d.focus(); } }
      else { var b = main.querySelector('.branch[data-i="' + i + '"]'); if (b) b.focus(); }
    },
    mapstep: function (el) { var u = el.dataset.unit, ti = (MAPOPEN[u + ':t'] || 0) + parseInt(el.dataset.d, 10); go('#unit-' + u + '-maps?t=' + ti); },
    cmpstep: function (el) { var u = el.dataset.unit, i = (CMPI[u] || 0) + parseInt(el.dataset.d, 10); go('#unit-' + u + '-compare?c=' + i); },
    print: function () { window.print(); },
    resetarm: function () { resetArmed = true; rerenderKeep('[data-act="resetgo"]'); },
    resetcancel: function () { resetArmed = false; rerenderKeep('[data-act="resetarm"]'); },
    resetgo: function () {
      var theme = null; try { theme = localStorage.getItem('masar:theme'); } catch (e) {}
      store.clearAll();
      store.set('bankVersion', M.bankVersion);
      Object.keys(PR).forEach(function (k) { delete PR[k]; });
      resetArmed = false;
      if (theme) try { localStorage.setItem('masar:theme', theme); } catch (e) {}
      render(false);
      var row = document.getElementById('resetRow');
      if (row) { row.insertAdjacentHTML('beforeend', '<p class="small" role="status" tabindex="-1" id="resetDone">مُسح تقدمك في هذا الكتاب.</p>'); document.getElementById('resetDone').focus(); }
    }
  };

  document.addEventListener('click', function (e) {
    var s = e.target.closest('[data-src]');
    if (s) { e.preventDefault(); openSource(parseInt(s.getAttribute('data-src'), 10)); return; }
    if (e.target.closest('[data-open-units]')) { e.preventDefault(); openUnits(); return; }
    var a = e.target.closest('[data-act]');
    if (a && !a.disabled && ACT[a.dataset.act]) { e.preventDefault(); ACT[a.dataset.act](a); }
  });

  var CHG = {
    skipWelcome: function (el) { store.set('skipWelcome', el.checked); },
    pick: function (el) {
      var key = el.dataset.ctx, st = prState(key);
      if (st.cur.checked) return;
      st.cur.pick = parseInt(el.value, 10);
      var fs = el.closest('fieldset');
      fs.querySelectorAll('.opt').forEach(function (l) { l.classList.toggle('chosen', l.contains(el)); });
      var btn = main.querySelector('[data-act="check"][data-ctx="' + key + '"]');
      if (btn) { btn.disabled = false; var hint = btn.parentNode.querySelector('.small'); if (hint) hint.remove(); }
    },
    exans: function (el) {
      var ex = activeExam(); if (!ex) return;
      ex.ans[ex.qids[ex.i]] = parseInt(el.value, 10); store.set('exam', ex);
      var fs = el.closest('fieldset');
      fs.querySelectorAll('.opt').forEach(function (l) { l.classList.toggle('chosen', l.contains(el)); });
      var b = main.querySelector('.numgrid [data-i="' + ex.i + '"]'); if (b) b.classList.add('answered');
    },
    ftopic: function (el) { var f = prState(el.dataset.ctx).free; f.topic = el.value; f.i = 0; rerenderKeep('#' + el.id); },
    bank: function (el) { BANK[el.dataset.k] = el.value; prState('bank').free.i = 0; rerenderKeep('#' + el.id); },
    mockn: function (el) { MOCK.n = parseInt(el.value, 10); },
    revu: function (el) { REV.unit = el.value; rerenderKeep('#revu'); },
    mapsel: function (el) { go('#unit-' + el.dataset.unit + '-maps?t=' + el.value); },
    cmpsel: function (el) { go('#unit-' + el.dataset.unit + '-compare?c=' + el.value); },
    figu: function (el) { FIG.unit = el.value; rerenderKeep('#figu'); }
  };
  document.addEventListener('change', function (e) {
    var el = e.target.closest('[data-change]');
    if (el && CHG[el.dataset.change]) CHG[el.dataset.change](el);
  });
  document.addEventListener('input', function (e) {
    if (e.target.dataset && e.target.dataset.input === 'figq') {
      FIG.q = e.target.value;
      var tmp = document.createElement('div'); tmp.innerHTML = PAGES.figures();
      var t = tmp.querySelector('#figtable'), c = tmp.querySelector('#figcount');
      document.getElementById('figtable').innerHTML = t.innerHTML;
      document.getElementById('figcount').innerHTML = c.innerHTML;
    }
  });

  window.addEventListener('hashchange', function () {
    REV = REV || { filter: 'all', unit: '' };
    if (route.page === 'unit' || route.page === 'mock') { var np = parseHash(); if (np.params.result !== route.params.result) REV = { filter: 'all', unit: '' }; }
    resetArmed = false;
    closeDlg(unitsDlg);
    render(true);
  });
  window.addEventListener('storage', function (e) { if (e.key && e.key.indexOf(NS) === 0) render(false); });

  render(false);
})();
