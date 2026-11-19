/* عرض «النظريات المفسرة للنمو الإنساني» — المحتوى كله من المذكرة (الفصل السابع، ص ٢٢٥–٢٦٦). */
const pptxgen = require('pptxgenjs');
const React = require('react');
const ReactDOMServer = require('react-dom/server');
const sharp = require('sharp');
const fa = require('react-icons/fa');
const { applyTheme } = require('/root/.claude/skills/synced/966d3bd2-5052-4ba6-b180-9dea22184953_e3c06f91-9118-4424-9d99-dc67ac0ffe8d/pptx/scripts/apply_theme.js');

const AR = '٠١٢٣٤٥٦٧٨٩';
const ar = (s) => String(s).replace(/[0-9]/g, (d) => AR[d]);

const THEME = {
  name: 'Masar',
  headFontFace: 'Amiri',
  bodyFontFace: 'Arial',
  colors: {
    dk1: '1E2530', lt1: 'FFFFFF', dk2: '1B2A4A', lt2: 'F9F7F1',
    accent1: 'A6732B', accent2: '1B2A4A', accent3: '5E6470', accent4: 'D9B47A', accent5: 'F3EEE2', accent6: 'E6DECD',
    hlink: '1B2A4A', folHlink: '5E6470'
  }
};
const HEX = { navy: '1B2A4A', brass: 'A6732B', brassSoft: 'D9B47A', ivory: 'F9F7F1', ink: '1E2530', muted: '5E6470', line: 'E6DECD', sunken: 'F3EEE2', white: 'FFFFFF', brassInk: '8A5B1E' };

const pres = new pptxgen();
pres.layout = 'LAYOUT_WIDE'; // 13.333 × 7.5
pres.rtlMode = true;
pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
pres.title = 'النظريات المفسرة للنمو الإنساني';
pres.subject = 'عرض للمراجعة الذاتية من الفصل السابع من «سيكولوجية النمو الإنساني»';
pres.author = 'مسار';
const C = pres.SchemeColor;
const W = 13.333;
const RTL = { rtlMode: true, lang: 'ar-SA', align: 'right' };

/* ── التخطيطات ── */
pres.defineSlideMaster({
  title: 'DARK',
  background: { color: HEX.navy },
  objects: [],
  slideNumber: { x: 0.45, y: 6.95, w: 0.6, h: 0.3, fontSize: 10, color: HEX.brassSoft, fontFace: 'Arial' }
});
pres.defineSlideMaster({
  title: 'CONTENT',
  background: { color: HEX.ivory },
  objects: [
    { placeholder: { options: { name: 'title', type: 'title', x: 0.5, y: 0.38, w: 11.2, h: 0.75, fontFace: 'Amiri', fontSize: 32, bold: true, color: HEX.navy, align: 'right', valign: 'middle', rtlMode: true, margin: 0 }, text: '' } },
    { text: { text: 'مسار · النظريات المفسرة للنمو الإنساني', options: { x: 8.3, y: 6.98, w: 4.53, h: 0.3, fontSize: 10, color: HEX.muted, align: 'right', rtlMode: true, fontFace: 'Arial', margin: 0 } } }
  ],
  slideNumber: { x: 0.45, y: 6.98, w: 0.6, h: 0.3, fontSize: 10, color: HEX.muted, fontFace: 'Arial' }
});

/* ── أدوات ── */
async function iconPng(Icon, color) {
  const svg = ReactDOMServer.renderToStaticMarkup(React.createElement(Icon, { color: '#' + color, size: 256 }));
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  return 'image/png;base64,' + buf.toString('base64');
}
function card(slide, x, y, w, h, name, fill) {
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.12, fill: { color: fill || HEX.white }, line: { color: HEX.line, width: 1 }, objectName: name });
}
function label(slide, x, y, w, text, name, color) {
  slide.addText(ar(text), { x, y, w, h: 0.32, fontSize: 12, bold: true, color: color || HEX.brassInk, margin: 0, isTextBox: true, objectName: name, ...RTL });
}
function badge(slide, x, y, d, n, onDark) {
  slide.addShape(pres.shapes.OVAL, { x: x - 0.05, y: y - 0.05, w: d + 0.1, h: d + 0.1, fill: { color: onDark ? HEX.navy : HEX.ivory }, line: { color: HEX.brass, width: 1.5 }, objectName: 'badge-ring' });
  slide.addShape(pres.shapes.OVAL, { x, y, w: d, h: d, fill: { color: onDark ? HEX.brass : HEX.navy }, line: { type: 'none' }, objectName: 'badge' });
  slide.addText(ar(n), { x, y, w: d, h: d, fontFace: 'Amiri', fontSize: d > 0.8 ? 26 : 18, bold: true, color: HEX.white, align: 'center', valign: 'middle', margin: 0, isTextBox: true, objectName: 'badge-num' });
}
function source(slide, text) {
  slide.addText(ar('المصدر: المذكرة، ' + text), { x: 1.2, y: 6.98, w: 6.8, h: 0.3, fontSize: 10, color: HEX.muted, margin: 0, isTextBox: true, objectName: 'source', align: 'left', rtlMode: true, lang: 'ar-SA' });
}
function bullets(items, size, gap) {
  return items.map((t, i) => ({ text: ar(t), options: { bullet: { indent: 14 }, breakLine: i < items.length - 1, paraSpaceAfter: gap == null ? 8 : gap, fontSize: size || 15, color: HEX.ink, ...RTL } }));
}

/* ── المحتوى (من المذكرة) ── */
const THEORIES = [
  { n: 1, name: 'نظرية التحليل النفسي', lead: 'سيجموند فرويد (1856–1939م)', meta: 'طبيب نمساوي، جامعة فيينا · المذكرة تؤرخها بعام 1900م',
    idea: '«وفقًا لفرويد، فإن السلوك الإنساني يتأثر بشكل أساسي بالصراعات الداخلية والدوافع اللاشعورية التي تنشأ في الطفولة المبكرة».',
    concepts: ['مكونات الشخصية: الهو (مبدأ اللذة)، الأنا (مبدأ الواقع)، الأنا الأعلى (المعايير الأخلاقية)', 'مستويات الوعي: الوعي، ما قبل الشعور، اللاشعور (الجزء الأكبر)', 'المراحل النفسية الجنسية: الفمية ← الشرجية ← القضيبية ← الكمون ← التناسلية', 'الليبيدو والتثبيت النفسي'],
    focus: 'الصراعات اللاشعورية وخبرات الطفولة المبكرة.', view: 'محكوم بدوافع غريزية ولاشعورية.', matrix: 'البيولوجية-الداخلية',
    apps: ['إدراك دور اللاشعور في السلوك', 'التوازن بين مكونات الشخصية', 'أهمية الخبرات المبكرة'],
    pages: 'ص 228–232، 259، 261، 263' },
  { n: 2, name: 'النظرية السلوكية', lead: 'جون واطسون (1878–1958م) وبورهوس سكينر (1904–1990م)', meta: 'جونز هوبكنز؛ هارفارد · المذكرة تؤرخها بعامي 1913م و1953م',
    idea: '«تعتبر هذه النظرية أن السلوك البشري يُتعلّم ويُعدَّل استجابة للمؤثرات البيئية من خلال آليات التعلم مثل الاشتراط الكلاسيكي والاشتراط الإجرائي».',
    concepts: ['الإنسان يولد «صفحة بيضاء» ويتشكل سلوكه بتأثير البيئة (واطسون)', 'الاشتراط الكلاسيكي: ربط مثير معين باستجابة معينة (تجربة الجرس والطعام)', 'الاشتراط الإجرائي: تعلّم السلوك أو تعديله من خلال العواقب (سكينر)', 'التعزيز يقوّي السلوك، والعقاب يقلله'],
    focus: 'المثيرات البيئية والعواقب (التعزيز والعقاب).', view: 'يتشكل سلوكه إلى حد كبير بفعل البيئة.', matrix: 'البيئية-الخارجية',
    apps: ['هندسة البيئة التعليمية', 'برامج تعديل السلوك', 'التعلم المبرمج'],
    pages: 'ص 232–234، 259، 261، 263' },
  { n: 3, name: 'نظرية التطور الاجتماعي والثقافي', lead: 'ليف فيجوتسكي (1896–1934م)', meta: 'جامعة موسكو الحكومية · المذكرة تؤرخها بثلاثينيات القرن العشرين',
    idea: '«…يؤكد فيجوتسكي أن النمو المعرفي لا يحدث في عزلة عن البيئة الاجتماعية والثقافية، بل هو عملية تفاعلية مع البيئة المحيطة».',
    concepts: ['منطقة النمو الوشيك: الفجوة بين ما يفعله الطفل بمفرده وما يفعله بمساعدة الأكثر خبرة', 'الدعم التعليمي (السقالات): يتناقص تدريجيًا مع تقدم الطفل', 'اللغة أداة لتنظيم التفكير؛ «الكلام الخاص» مكوّن أساسي في النمو المعرفي', 'التفاعل الاجتماعي والأدوات الثقافية (اللغة والرموز والمهارات)'],
    focus: 'التفاعل الاجتماعي والأدوات الثقافية (اللغة).', view: 'كائن اجتماعي ينمو من خلال المشاركة الثقافية.', matrix: 'التفاعلية',
    apps: ['التعليم في منطقة النمو الوشيك', 'الدعم التعليمي', 'التعلم التعاوني', 'استخدام اللغة كأداة للتفكير', 'التدريس في السياق الثقافي'],
    pages: 'ص 235–237، 260، 261، 263' },
  { n: 4, name: 'نظرية النمو النفسي الاجتماعي', lead: 'إريك إريكسون (1902–1994م)', meta: 'هارفارد وييل · المذكرة تؤرخها بعام 1950م',
    idea: '«…النمو يحدث من خلال سلسلة من الأزمات النفسية الاجتماعية التي يواجهها الفرد في كل مرحلة، ويؤدي النجاح في حلها إلى اكتساب قوى نفسية…».',
    concepts: ['الثقة مقابل عدم الثقة: الولادة–18 شهرًا', 'الاستقلالية مقابل الخجل والشك: 18 شهرًا–3 سنوات', 'المبادأة مقابل الشعور بالذنب: 3–5 سنوات', 'المثابرة مقابل الشعور بالنقص: 6 سنوات–البلوغ', 'هوية الأنا مقابل اضطراب الدور: 12–18 عامًا', 'الألفة مقابل العزلة: 18–40 عامًا', 'الإنتاجية مقابل الركود: 40–65 عامًا', 'تكامل الأنا مقابل اليأس: 65 عامًا فصاعدًا'], dense: true,
    focus: 'التفاعل بين المتطلبات البيولوجية والضغوط الاجتماعية.', view: 'ينمو عبر حل أزمات اجتماعية على مدار الحياة.', matrix: null,
    note: '«تعد امتدادًا تطويريًا للفكر التحليلي، حيث وسعت نطاق النمو ليشمل دورة الحياة كاملة».',
    apps: ['دعم الهوية والاستقلال', 'تعزيز الكفاءة الاجتماعية', 'التوجيه النمائي للرشد'],
    pages: 'ص 238–240، 260، 263' },
  { n: 5, name: 'نظرية النمو المعرفي', lead: 'جان بياجيه (1896–1980م)', meta: 'جامعة جنيف · المذكرة تؤرخها بعام 1936م',
    idea: '«تفسر نظرية بياجيه النمو المعرفي بوصفه عملية تطور تدريجي في البنى المعرفية، يمر خلالها الطفل بأربع مراحل نوعية متتابعة…».',
    concepts: ['الحسية الحركية (الولادة–سنتين): بقاء الشيء', 'ما قبل العمليات (2–7): الرموز واللغة وسيطرة التمركز حول الذات', 'العمليات المادية (7–11): التفكير المنطقي في المحسوسات والاحتفاظ', 'العمليات المجردة (11 فأكثر): التفكير التجريدي وصياغة الفروض واختبارها'],
    focus: 'البناء الذاتي للمخططات المعرفية عبر النضج والتفاعل.', view: 'كائن نشط يبني معرفته بنفسه.', matrix: 'البيولوجية-الداخلية',
    apps: ['مراعاة الخصائص النمائية عند تصميم المناهج', 'التعلم النشط القائم على الاكتشاف', 'تنمية التفكير النقدي'],
    pages: 'ص 240–242، 259، 261، 263' },
  { n: 6, name: 'نظرية التعلق', lead: 'جون بولبي (1907–1990م) وماري أينسورث (1913–1999م)', meta: 'كامبريدج؛ تورنتو وفيرجينيا · المذكرة تؤرخها بعام 1958م',
    idea: '«يُعرف التعلق بأنه رابطة عاطفية وثيقة ودائمة تنشأ بين الطفل ومقدم الرعاية (الأم غالبًا)، وتوفر له شعورًا بالأمان والراحة».',
    concepts: ['التعلق آلية تطورية لحماية الطفل وضمان بقائه قريبًا من مصدر الرعاية (بولبي)', 'تجربة «الموقف الغريب» (أينسورث)', 'الأنماط: الآمن، القلق-المقاوم، التجنبي', 'ينعكس النمط الأولي على علاقات الفرد في البلوغ'],
    focus: 'الرابطة العاطفية المبكرة مع مقدم الرعاية.', view: 'يبحث فطريًا عن الحماية والأمان العاطفي.', matrix: null,
    apps: ['بناء الرابطة الآمنة', 'إدارة قلق الانفصال', 'تنمية التواصل العاطفي', 'التدخل العلاجي والإرشادي', 'تفسير السلوك الصفي'],
    pages: 'ص 242–245، 260، 263' },
  { n: 7, name: 'نموذج معالجة المعلومات', lead: 'جورج ميلر (1920–2012م)', meta: 'برينستون وهارفارد · المذكرة تؤرخه بعام 1956م',
    idea: '«يركز نموذج معالجة المعلومات على تفسير كيفية استقبال المثيرات ومعالجتها وتخزينها واسترجاعها، مشبهًا عمل العقل البشري بالحاسوب…».',
    concepts: ['الذاكرة الحسية: تخزين وجيز جدًا للمثيرات', 'الذاكرة قصيرة المدى (العاملة): تصلها المعلومات عبر الانتباه، وسعتها محدودة', 'الذاكرة طويلة المدى: حفظ دائم بعد المعالجة والترميز', 'آليات النمو: الانتباه الانتقائي، الترميز، استراتيجيات الاسترجاع'],
    focus: 'العمليات المعرفية (الترميز، التخزين، الاسترجاع).', view: 'نظام يعالج المعلومات بآلية تشبه الحاسوب.', matrix: null,
    apps: ['تفعيل استراتيجيات ما وراء المعرفة', 'تحسين عمليات الترميز والاسترجاع', 'تصميم أنشطة تعزز الانتباه'],
    pages: 'ص 245–247، 260، 264' },
  { n: 8, name: 'النظريات الإنسانية', lead: 'أبراهام ماسلو (1908–1970م) وكارل روجرز (1902–1987م)', meta: 'برانديز؛ كولومبيا · المذكرة تؤرخها بخمسينيات القرن الماضي',
    idea: '«تمثل النظريات الإنسانية توجهًا يركز على الإمكانات الإيجابية للإنسان، وقد جاءت بوصفها "القوة الثالثة" في علم النفس…».',
    concepts: ['هرم ماسلو: الفسيولوجية ← الأمان ← الانتماء ← التقدير ← تحقيق الذات', 'الحاجات الأساسية تُشبَع أولًا قبل الانتقال إلى الأعلى', 'روجرز: الميل إلى التحقيق، والتقارب بين الذات الواقعية والمثالية', 'الاعتبار الإيجابي غير المشروط'],
    focus: 'السعي الفطري نحو تحقيق الذات والنمو الإيجابي.', view: 'كائن حر يمتلك إرادة ويسعى للكمال.', matrix: null,
    apps: ['مراعاة الترتيب الهرمي للحاجات', 'التعلم المتمركز حول المتعلم', 'دور المعلم كـ«ميسّر»', 'تعزيز الثقة بالنفس'],
    pages: 'ص 248–250، 260، 264' },
  { n: 9, name: 'نظرية النمو الأخلاقي', lead: 'لورانس كولبرغ (1927–1987م)', meta: 'جامعة هارفارد · المذكرة تؤرخها بعام 1958م',
    idea: '«…نظرية هرمية تتألف من ثلاثة مستويات فكرية، يندرج تحت كل مستوى منها مرحلتان متتابعتان، لتقدم في مجملها ست مراحل تصف تطور منطق الحكم الأخلاقي لدى الإنسان من الطفولة حتى النضج».',
    concepts: ['ما قبل التقليدي (الطفولة المبكرة): الطاعة والعقاب؛ المصلحة الذاتية', 'التقليدي (أواخر الطفولة والمراهقة): التوافق والعلاقات؛ النظام والقانون', 'ما بعد التقليدي (بعض البالغين): العقد الاجتماعي؛ المبادئ العالمية'],
    focus: 'تطور التفكير المنطقي والعدالة الاجتماعية.', view: 'كائن يتطور منطقيًا لاتخاذ قرارات أخلاقية.', matrix: null,
    note: 'طوّرها كولبرغ «مستندًا إلى دراسات جان بياجيه».',
    apps: ['تعزيز التفكير الأخلاقي', 'تشجيع النقاشات الأخلاقية', 'التربية على القيم والمبادئ'],
    pages: 'ص 251–254، 260، 264' },
  { n: 10, name: 'نظرية التعلم الاجتماعي', lead: 'ألبرت باندورا (1925–2021م)', meta: 'جامعة ستانفورد · المذكرة تؤرخها بعام 1977م',
    idea: '«تُعد نظرية التعلم الاجتماعي لـ ألبرت باندورا جسرًا حيويًا بين النظريات السلوكية والنظريات المعرفية…».',
    concepts: ['التعلم بالملاحظة: اكتساب السلوك بمشاهدة الآخرين وتقليدهم', 'عملياته: الانتباه ← الاحتفاظ ← الإنتاج الحركي ← الدافعية', 'الحتمية التبادلية: السلوك والبيئة والعوامل الشخصية/المعرفية', 'الكفاءة الذاتية: اعتقاد الفرد بقدرته على النجاح'],
    focus: 'الملاحظة والنمذجة في سياق اجتماعي.', view: 'يتأثر بالتفاعل المتبادل بين السلوك والبيئة والذات.', matrix: 'التفاعلية',
    apps: ['المعلم كنموذج', 'استخدام النمذجة في التدريس', 'تعزيز الكفاءة الذاتية للطلاب', 'التعلم بالأقران'],
    pages: 'ص 254–256، 261، 264' },
  { n: 11, name: 'نظرية النظم البيئية', lead: 'يوري برونفنبرينر (1917–2005م)', meta: 'جامعة كورنيل · المذكرة تؤرخها بعام 1979م',
    idea: '«…من أكثر النظريات شمولًا في تفسير نمو الطفل، حيث تركز نظرية برونفنبرينر على نمو الطفل من خلال تفاعله مع مجموعة من البيئات المتداخلة…».',
    concepts: ['المصغر: البيئة المباشرة كالأسرة والمدرسة', 'المتوسط: العلاقات بين البيئات المباشرة', 'الخارجي: بيئات لا يشترك فيها الطفل مباشرة، كعمل الوالدين', 'الكلي: الإطار الثقافي العام · الزمني: الأحداث والتحولات عبر الحياة'],
    focus: 'التفاعل بين الفرد ونظم بيئية متعددة ومتداخلة.', view: 'كائن يتأثر بدوائر بيئية وثقافية متكاملة.', matrix: 'البيئية-الخارجية',
    apps: ['تعزيز الشراكة بين الأسرة والمدرسة', 'إدراك التأثيرات غير المباشرة', 'مراعاة السياق الثقافي', 'فهم التغيرات التاريخية والزمنية'],
    pages: 'ص 257–259، 261، 264' }
];

(async () => {
  const ICON = {
    lead: await iconPng(fa.FaUserGraduate, HEX.brass),
    focus: await iconPng(fa.FaCogs, HEX.brass),
    view: await iconPng(fa.FaUser, HEX.brass),
    apps: await iconPng(fa.FaChalkboardTeacher, HEX.brass),
    p1: await iconPng(fa.FaFingerprint, HEX.white),
    p2: await iconPng(fa.FaShieldAlt, HEX.white),
    p3: await iconPng(fa.FaChartLine, HEX.white),
    p4: await iconPng(fa.FaChalkboardTeacher, HEX.white)
  };

  /* ١. الغلاف */
  pres.addSection({ title: 'مقدمة' });
  let s = pres.addSlide({ masterName: 'DARK', sectionTitle: 'مقدمة' });
  s.addText(ar('سيكولوجية النمو الإنساني · الفصل السابع'), { x: 1, y: 1.55, w: 11.33, h: 0.45, fontSize: 18, color: HEX.brassSoft, margin: 0, isTextBox: true, objectName: 'kicker', ...RTL });
  s.addText('النظريات المفسرة للنمو الإنساني', { x: 1, y: 2.05, w: 11.33, h: 1.4, fontFace: 'Amiri', fontSize: 54, bold: true, color: HEX.white, margin: 0, isTextBox: true, objectName: 'cover-title', ...RTL });
  s.addText(ar('إحدى عشرة نظرية: أعلامها، وأهم أفكارها، وما يميز كلًّا منها'), { x: 1, y: 3.55, w: 11.33, h: 0.6, fontSize: 22, color: HEX.ivory, margin: 0, isTextBox: true, objectName: 'cover-sub', ...RTL });
  s.addText(ar('عرض للمراجعة الذاتية · كل ما فيه من المذكرة (ص 225–266)'), { x: 1, y: 5.6, w: 11.33, h: 0.4, fontSize: 14, color: HEX.brassSoft, margin: 0, isTextBox: true, objectName: 'cover-note', ...RTL });
  s.addNotes('العرض مبني على الفصل السابع من «سيكولوجية النمو الإنساني» وحده. أرقام الصفحات هي الأرقام المطبوعة في المذكرة. التواريخ المقرونة بالنظريات مأخوذة من «ملامح النظريات» ص ٢٥٩–٢٦١، وتواريخ الأعلام من حواشي التراجم.');

  /* ٢. الخط الزمني */
  s = pres.addSlide({ masterName: 'CONTENT', sectionTitle: 'مقدمة' });
  s.addText('النظريات الإحدى عشرة عبر الزمن', { placeholder: 'title' });
  const TL = [
    ['1900م', 'التحليل النفسي', 'فرويد'], ['1913م', 'السلوكية', 'واطسون (وسكينر 1953م)'], ['الثلاثينيات', 'التطور الاجتماعي والثقافي', 'فيجوتسكي'],
    ['1936م', 'النمو المعرفي', 'بياجيه'], ['1950م', 'النمو النفسي الاجتماعي', 'إريكسون'], ['الخمسينيات', 'الإنسانية', 'ماسلو وروجرز'],
    ['1956م', 'معالجة المعلومات', 'ميلر'], ['1958م', 'التعلق', 'بولبي'], ['1958م', 'النمو الأخلاقي', 'كولبرغ'],
    ['1977م', 'التعلم الاجتماعي', 'باندورا'], ['1979م', 'النظم البيئية', 'برونفنبرينر']
  ];
  const lineY = 3.95, x0 = 12.35, x1 = 0.95, step = (x0 - x1) / (TL.length - 1);
  s.addShape(pres.shapes.LINE, { x: x1, y: lineY, w: x0 - x1, h: 0, line: { color: HEX.brass, width: 2 }, objectName: 'timeline' });
  TL.forEach((t, i) => {
    const cx = x0 - i * step, up = i % 2 === 0;
    s.addShape(pres.shapes.OVAL, { x: cx - 0.11, y: lineY - 0.11, w: 0.22, h: 0.22, fill: { color: up ? HEX.navy : HEX.brass }, line: { color: HEX.ivory, width: 2 }, objectName: 'tl-dot-' + i });
    s.addShape(pres.shapes.LINE, { x: cx, y: up ? lineY - 0.55 : lineY + 0.11, w: 0, h: 0.44, line: { color: HEX.line, width: 1 }, objectName: 'tl-tick-' + i });
    const by = up ? 1.75 : 4.55;
    s.addText([
      { text: ar(t[0]), options: { fontSize: 15, bold: true, color: HEX.brassInk, breakLine: true } },
      { text: t[1], options: { fontSize: 13, bold: true, color: HEX.navy, breakLine: true } },
      { text: ar(t[2]), options: { fontSize: 11, color: HEX.muted } }
    ], { x: cx - 0.95, y: by, w: 1.9, h: 1.6, align: 'center', valign: up ? 'bottom' : 'top', rtlMode: true, lang: 'ar-SA', margin: 0, isTextBox: true, objectName: 'tl-label-' + i });
  });
  s.addText(ar('الترتيب من الأقدم (يمينًا) إلى الأحدث. أرّخت المذكرة نظريتين بالعقد لا بالسنة، فموضعهما تقريبي.'), { x: 0.9, y: 6.35, w: 11.5, h: 0.35, fontSize: 12, color: HEX.muted, margin: 0, isTextBox: true, objectName: 'tl-note', ...RTL });
  source(s, 'ص 259–261؛ ترتيب العرض في الفصل يختلف عن هذا الترتيب الزمني');
  s.addNotes('ترتيب العرض في الفصل: التحليل النفسي، السلوكية، التطور الاجتماعي والثقافي، النمو النفسي الاجتماعي، النمو المعرفي، التعلق، معالجة المعلومات، الإنسانية، النمو الأخلاقي، التعلم الاجتماعي، النظم البيئية. أما الترتيب في هذه الشريحة فبحسب التواريخ المذكورة في «ملامح النظريات».');

  /* ٣–١٣. النظريات */
  pres.addSection({ title: 'النظريات' });
  for (const t of THEORIES) {
    s = pres.addSlide({ masterName: 'CONTENT', sectionTitle: 'النظريات' });
    badge(s, 12.0, 0.36, 0.8, t.n, false);
    s.addText(t.name, { placeholder: 'title' });
    s.addText(ar(t.lead), { x: 0.5, y: 1.12, w: 11.2, h: 0.36, fontSize: 16, bold: true, color: HEX.ink, margin: 0, isTextBox: true, objectName: 'lead', ...RTL });
    s.addText(ar(t.meta), { x: 0.5, y: 1.46, w: 11.2, h: 0.3, fontSize: 12, color: HEX.muted, margin: 0, isTextBox: true, objectName: 'meta', ...RTL });

    // العمود الأيمن: الفكرة الأساسية + المفاهيم
    const RX = 6.85, RW = 5.98;
    card(s, RX, 1.95, RW, 1.85, 'idea-card', HEX.sunken);
    label(s, RX + 0.25, 2.07, RW - 0.5, 'الفكرة الأساسية', 'idea-label');
    s.addText(ar(t.idea), { x: RX + 0.25, y: 2.4, w: RW - 0.5, h: 1.3, fontSize: 15, color: HEX.navy, valign: 'top', margin: 0, isTextBox: true, objectName: 'idea', ...RTL });
    card(s, RX, 3.95, RW, 2.85, 'concepts-card');
    label(s, RX + 0.25, 4.07, RW - 0.5, 'أبرز المفاهيم', 'concepts-label');
    s.addText(t.dense ? bullets(t.concepts, 14, 2) : bullets(t.concepts, 15), { x: RX + 0.25, y: 4.42, w: RW - 0.5, h: 2.3, valign: 'top', margin: 0, isTextBox: true, objectName: 'concepts' });

    // العمود الأيسر: ما يميزها + التطبيقات
    const LX = 0.5, LW = 6.15;
    card(s, LX, 1.95, LW, 2.55, 'distinct-card');
    s.addImage({ data: ICON.focus, x: LX + LW - 0.55, y: 2.08, w: 0.3, h: 0.3, altText: '' });
    label(s, LX + 0.25, 2.07, LW - 0.95, 'ما يميزها: محرك النمو', 'focus-label');
    s.addText(ar(t.focus), { x: LX + 0.25, y: 2.42, w: LW - 0.5, h: 0.38, fontSize: 15, bold: true, color: HEX.navy, margin: 0, isTextBox: true, objectName: 'focus', ...RTL });
    s.addImage({ data: ICON.view, x: LX + LW - 0.55, y: 2.92, w: 0.3, h: 0.3, altText: '' });
    label(s, LX + 0.25, 2.91, LW - 0.95, 'نظرتها للفرد', 'view-label');
    s.addText(ar(t.view), { x: LX + 0.25, y: 3.26, w: LW - 0.5, h: 0.38, fontSize: 15, bold: true, color: HEX.navy, margin: 0, isTextBox: true, objectName: 'view', ...RTL });
    const extra = t.note ? t.note : (t.matrix ? 'في «المصفوفة النمائية» ضمن النظريات ' + t.matrix + '.' : 'لم تُدرج في «المصفوفة النمائية» (ص 261).');
    s.addText(ar(extra), { x: LX + 0.25, y: 3.78, w: LW - 0.5, h: 0.62, fontSize: 13, italic: !!t.note, color: HEX.muted, valign: 'top', margin: 0, isTextBox: true, objectName: 'extra', ...RTL });
    card(s, LX, 4.65, LW, 2.15, 'apps-card');
    s.addImage({ data: ICON.apps, x: LX + LW - 0.55, y: 4.78, w: 0.3, h: 0.3, altText: '' });
    label(s, LX + 0.25, 4.77, LW - 0.95, 'تطبيقاتها التربوية في المذكرة', 'apps-label');
    s.addText(bullets(t.apps, 15, 5), { x: LX + 0.25, y: 5.12, w: LW - 0.5, h: 1.6, valign: 'top', margin: 0, isTextBox: true, objectName: 'apps' });
    source(s, t.pages);
    s.addNotes(ar(t.name + ' — ' + t.lead + '. ' + t.idea + ' محرك النمو كما في جدول المقارنة: ' + t.focus + ' نظرتها للفرد: ' + t.view + ' المصدر: ' + t.pages + '.'));
  }

  /* ١٤. المصفوفة النمائية */
  pres.addSection({ title: 'المقارنة والخلاصة' });
  s = pres.addSlide({ masterName: 'CONTENT', sectionTitle: 'المقارنة والخلاصة' });
  s.addText('المصفوفة النمائية التي تحكم السلوك الإنساني', { placeholder: 'title' });
  const hdr = (t) => ({ text: ar(t), options: { bold: true, color: HEX.white, fill: { color: HEX.navy }, fontSize: 14, align: 'right', rtlMode: true, valign: 'middle' } });
  const rowh = (t) => ({ text: ar(t), options: { bold: true, color: HEX.navy, fill: { color: HEX.sunken }, fontSize: 14, align: 'right', rtlMode: true, valign: 'middle' } });
  const cell = (t) => ({ text: ar(t), options: { color: HEX.ink, fill: { color: HEX.white }, fontSize: 14, align: 'right', rtlMode: true, valign: 'middle' } });
  const mrows = [
    [hdr('محور المقارنة'), hdr('البيولوجية-الداخلية (بياجيه، فرويد)'), hdr('البيئية-الخارجية (السلوكية، برونفنبرينر)'), hdr('التفاعلية (باندورا، فيجوتسكي)')],
    [rowh('مصدر التغير'), cell('نضج داخلي وصراعات نفسية.'), cell('مثيرات بيئية وتعزيز خارجي.'), cell('تفاعل متبادل بين الفرد وسياقه الاجتماعي.')],
    [rowh('طبيعة النمو'), cell('مراحل نوعية متمايزة (قفزات).'), cell('تراكم كمي مستمر (تدرج).'), cell('بناء معرفي واجتماعي مشترك.')],
    [rowh('دور المتعلم'), cell('نشط (يبني المعرفة أو يفرغ دوافع الداخلية).'), cell('مستجيب (يتشكل بالتعزيز).'), cell('مشارك (يلاحظ ويبني المعنى).')]
  ];
  // الأعمدة بترتيب RTL: أول عمود في المصفوفة يظهر يمينًا
  s.addTable(mrows.map((r) => r.slice().reverse()), { x: 0.5, y: 1.55, w: 12.33, colW: [3.65, 3.65, 3.38, 1.65], rowH: [0.85, 1.0, 1.0, 1.0], border: { type: 'solid', pt: 1, color: HEX.line }, margin: 0.1, fontFace: 'Arial', objectName: 'matrix-table' });
  s.addText(ar('نُقلت الخلايا كما وردت، ومنها «يفرغ دوافع الداخلية». لم تُدرج المذكرة في المصفوفة سوى ست نظريات.'), { x: 0.5, y: 6.15, w: 12.33, h: 0.4, fontSize: 12, color: HEX.muted, margin: 0, isTextBox: true, objectName: 'matrix-note', ...RTL });
  source(s, 'ص 261');

  /* ١٥–١٦. جدول المقارنة */
  const CMP = [
    ['التحليل النفسي', 'سيجموند فرويد', 'الصراعات اللاشعورية وخبرات الطفولة المبكرة.', 'محكوم بدوافع غريزية ولاشعورية.'],
    ['السلوكية', 'واطسون/ سكينر', 'المثيرات البيئية والعواقب (التعزيز والعقاب).', 'يتشكل سلوكه إلى حد كبير بفعل البيئة.'],
    ['المعرفة النمائية (كذا)', 'جان بياجيه', 'البناء الذاتي للمخططات المعرفية عبر النضج والتفاعل.', 'كائن نشط يبني معرفته بنفسه.'],
    ['النمو النفس اجتماعي', 'إريك إريكسون', 'التفاعل بين المتطلبات البيولوجية والضغوط الاجتماعية.', 'ينمو عبر حل أزمات اجتماعية على مدار الحياة.'],
    ['التطور الاجتماعي الثقافي', 'ليف فيجوتسكي', 'التفاعل الاجتماعي والأدوات الثقافية (اللغة).', 'كائن اجتماعي ينمو من خلال المشاركة الثقافية.'],
    ['التعلق', 'جون بولبي', 'الرابطة العاطفية المبكرة مع مقدم الرعاية.', 'يبحث فطريًا عن الحماية والأمان العاطفي.'],
    ['معالجة المعلومات', 'جورج ميلر', 'العمليات المعرفية (الترميز، التخزين، الاسترجاع).', 'نظام يعالج المعلومات بآلية تشبه الحاسوب.'],
    ['الإنسانية', 'ماسلو / روجرز', 'السعي الفطري نحو تحقيق الذات والنمو الإيجابي.', 'كائن حر يمتلك إرادة ويسعى للكمال.'],
    ['النمو الأخلاقي', 'لورانس كولبرغ', 'تطور التفكير المنطقي والعدالة الاجتماعية.', 'كائن يتطور منطقيًا لاتخاذ قرارات أخلاقية.'],
    ['التعلم الاجتماعي', 'ألبرت باندورا', 'الملاحظة والنمذجة في سياق اجتماعي.', 'يتأثر بالتفاعل المتبادل بين السلوك والبيئة والذات.'],
    ['النظم البيئية', 'برونفنبرينر', 'التفاعل بين الفرد ونظم بيئية متعددة ومتداخلة.', 'كائن يتأثر بدوائر بيئية وثقافية متكاملة.']
  ];
  [[0, 6, 'الجزء الأول'], [6, 11, 'الجزء الثاني']].forEach(([a, b, part], k) => {
    s = pres.addSlide({ masterName: 'CONTENT', sectionTitle: 'المقارنة والخلاصة' });
    s.addText('مقارنة النظريات: ' + part, { placeholder: 'title' });
    const rows = [[hdr('النظرية'), hdr('الرائد/المؤسس'), hdr('التركيز الجوهري (محرك النمو)'), hdr('نظرة النظرية للفرد')]];
    CMP.slice(a, b).forEach((r, i) => rows.push([rowh(r[0]), cell(r[1]), cell(r[2]), cell(r[3])]));
    s.addTable(rows.map((r) => r.slice().reverse()), { x: 0.5, y: 1.5, w: 12.33, colW: [4.0, 4.33, 1.9, 2.1], rowH: 0.68, border: { type: 'solid', pt: 1, color: HEX.line }, margin: 0.08, fontFace: 'Arial', objectName: 'compare-table-' + (k + 1) });
    if (k === 0) s.addText(ar('أسماء النظريات كما طُبعت في الجدول، ومنها «المعرفة النمائية» و«النمو النفس اجتماعي». حُذف عمود «المفاهيم المفتاحية» لضيق المساحة؛ ومفاهيم كل نظرية في شريحتها مأخوذة من متن الفصل.'), { x: 0.5, y: 6.5, w: 12.33, h: 0.35, fontSize: 11, color: HEX.muted, margin: 0, isTextBox: true, objectName: 'cmp-note', ...RTL });
    source(s, 'ص 263–264');
  });

  /* ١٧. المبادئ التربوية الشاملة */
  s = pres.addSlide({ masterName: 'CONTENT', sectionTitle: 'المقارنة والخلاصة' });
  s.addText('مبادئ تربوية مستخلصة من النظريات', { placeholder: 'title' });
  const PR = [
    ['مبدأ الفروق الفردية', 'روجرز وباندورا', '«يجب احترام الوتيرة الخاصة لكل طالب وإيمانه بكفاءته الذاتية».', ICON.p1],
    ['مبدأ البيئة الآمنة', 'نظرية التعلق وماسلو', '«لا يمكن حدوث تعلم حقيقي في غياب الأمان العاطفي والإشباع الفسيولوجي».', ICON.p2],
    ['مبدأ التحدي المناسب', 'منطقة النمو الوشيك لفيجوتسكي', '«يجب تقديم مهام تعليمية تقع أعلى من مستوى قدرات الطالب الحالية بقليل مع توفير الدعم التعليمي».', ICON.p3],
    ['مبدأ القدوات الحية', 'نظرية التعلم الاجتماعي', '«يظل المعلم النموذج هو الأداة الأقوى لتعديل السلوك وتنمية القيم».', ICON.p4]
  ];
  PR.forEach((p, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = col === 0 ? 6.75 : 0.5, y = 1.55 + row * 2.6, w = 6.08, h = 2.35;
    card(s, x, y, w, h, 'principle-' + i);
    s.addShape(pres.shapes.OVAL, { x: x + w - 0.95, y: y + 0.25, w: 0.7, h: 0.7, fill: { color: HEX.navy }, line: { type: 'none' }, objectName: 'p-icon-bg-' + i });
    s.addImage({ data: p[3], x: x + w - 0.8, y: y + 0.4, w: 0.4, h: 0.4, altText: '' });
    s.addText(p[0], { x: x + 0.3, y: y + 0.25, w: w - 1.4, h: 0.42, fontSize: 20, bold: true, color: HEX.navy, margin: 0, isTextBox: true, objectName: 'p-title-' + i, ...RTL });
    s.addText(ar('المستند: ' + p[1]), { x: x + 0.3, y: y + 0.67, w: w - 1.4, h: 0.3, fontSize: 12, color: HEX.brassInk, margin: 0, isTextBox: true, objectName: 'p-basis-' + i, ...RTL });
    s.addText(ar(p[2]), { x: x + 0.3, y: y + 1.12, w: w - 0.6, h: 1.05, fontSize: 15, color: HEX.ink, valign: 'top', margin: 0, isTextBox: true, objectName: 'p-text-' + i, ...RTL });
  });
  source(s, 'ص 262');

  /* ١٨. الخاتمة */
  s = pres.addSlide({ masterName: 'DARK', sectionTitle: 'المقارنة والخلاصة' });
  s.addText('تكامل النظريات', { x: 1, y: 1.6, w: 11.33, h: 0.9, fontFace: 'Amiri', fontSize: 44, bold: true, color: HEX.white, margin: 0, isTextBox: true, objectName: 'end-title', ...RTL });
  s.addText(ar('«وبذلك تتكامل النظريات المفسرة للنمو الإنساني لتقديم فهم شامل للسلوك، مما يساعد التربوي على تصميم بيئات تعلم تراعي أبعاده المتعددة».'), { x: 1, y: 2.75, w: 11.33, h: 1.5, fontSize: 24, color: HEX.ivory, margin: 0, isTextBox: true, objectName: 'end-quote', ...RTL });
  s.addText(ar('المذكرة، ص 264'), { x: 1, y: 4.3, w: 11.33, h: 0.4, fontSize: 14, color: HEX.brassSoft, margin: 0, isTextBox: true, objectName: 'end-src', ...RTL });
  s.addText(ar('عرض للمراجعة الذاتية. النصوص بين علامتي التنصيص منقولة من المذكرة، وما سواها اختصار من ألفاظها.'), { x: 1, y: 5.9, w: 11.33, h: 0.4, fontSize: 12, color: HEX.brassSoft, margin: 0, isTextBox: true, objectName: 'end-note', ...RTL });

  await pres.writeFile({ fileName: 'nazariyat.pptx' });
  await applyTheme('nazariyat.pptx', THEME);
  console.log('done');
})();
