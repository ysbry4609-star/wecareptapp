// ====== علامات الخطر + تصنيف الأولوية + وصف البلاغ ======
// 14 علامة خطر في 5 مجموعات. أي علامة مختارة = الحالة "حرجة" تلقائيًا.
// لو المسعف اختار "حرجة" يدويًا من غير علامة لازم يكتب السبب.
// لا توجد أولوية افتراضية: لازم المسعف يختار قبل الحفظ.
const RED_FLAG_GROUPS = [
  { t: '🫀 قلب وإغماء', f: ['ألم صدر ضاغط أو ممتد', 'فقدان وعي أو إغماء مفاجئ', 'توقف تنفس أو قلب'] },
  { t: '🧠 أعصاب', f: ['أعراض جلطة دماغية (وجه/ذراع/كلام)', 'تشنجات مستمرة أو متتالية', 'صداع مفاجئ شديد جدًا'] },
  { t: '🫁 تنفس', f: ['ضيق تنفس شديد أو زرقة', 'اختناق أو انسداد مجرى هوائي'] },
  { t: '🚑 إصابات', f: ['حادث طريق أو سقوط من ارتفاع (رأس/رقبة/عمود فقري)', 'نزيف حاد لا يتوقف بالضغط', 'كسر مفتوح/مضاعف أو إصابة حوض/فخذ'] },
  { t: '☠️ تسمم وحروق', f: ['تسمم أو جرعة زائدة', 'حروق كبيرة أو عميقة (وجه/رقبة/استنشاق دخان)', 'صدمة حساسية (تورم حلق + ضيق تنفس)'] }
];
const CALL_SOURCES = ['كنترول روم', 'الأمن الداخلي', 'السيفتي'];   // جهات "البلاغ" (مش زيارة/مباشر)

let redFlags = new Set();
let priorityAuto = false;

function renderRedFlags(){
  const box = document.getElementById('rfBox');
  if(!box) return;
  box.innerHTML = RED_FLAG_GROUPS.map(g =>
    `<div class="rf-group"><div class="rf-title">${g.t}</div><div class="rf-chips">` +
    g.f.map(n => `<button type="button" class="rf-chip${redFlags.has(n) ? ' on' : ''}" data-f="${n}" onclick="toggleRedFlag(this.dataset.f)">${n}</button>`).join('') +
    `</div></div>`).join('');
}
function toggleRedFlag(name){
  if(redFlags.has(name)) redFlags.delete(name); else redFlags.add(name);
  applyFlagSeverity();
  renderRedFlags();
  saveDraft();
}
function applyFlagSeverity(){
  if(redFlags.size){
    if(priority !== 'critical'){ setPriority('critical', true); priorityAuto = true; }
  } else if(priorityAuto && priority === 'critical'){
    setPriority('', true); priorityAuto = false;
  }
  updateTriageUI();
}
function updateTriageUI(){
  const st = document.getElementById('rfStatus'), wrap = document.getElementById('fcreasonWrap');
  if(st){
    st.style.display = redFlags.size ? 'block' : 'none';
    st.textContent = redFlags.size ? `🔴 ${redFlags.size} علامة خطر — الحالة اتحددت "حرجة" تلقائيًا` : '';
  }
  if(wrap) wrap.style.display = (priority === 'critical' && !redFlags.size) ? 'block' : 'none';
}
function resetTriage(){
  redFlags = new Set(); priorityAuto = false;
  renderRedFlags(); updateTriageUI();
}
function restoreTriage(list, auto){
  redFlags = new Set((list || []).filter(n => RED_FLAG_GROUPS.some(g => g.f.includes(n))));
  priorityAuto = !!auto && redFlags.size > 0;
  renderRedFlags(); updateTriageUI();
}

function isCallSource(){ return CALL_SOURCES.indexOf(getReportSourceValue()) >= 0; }
function updateClaimVisibility(){
  const w = document.getElementById('fclaimWrap'); if(!w) return;
  const on = isCallSource();
  w.style.display = on ? 'block' : 'none';
  if(!on){ const s = document.getElementById('fclaim'); if(s) s.value = ''; }
}
function hospitalReferral(){
  const pill = Array.from(document.querySelectorAll('#proto-pills .pill')).find(p => p.textContent.trim() === 'إحالة مستشفى');
  return !!(pill && pill.classList.contains('on')) || v('foc') === 'تحول للمستشفى';
}
function caseType(){
  if(isCallSource()) return 'بلاغ';
  return getReportSourceValue() ? 'حضور' : '';
}

// تحقق قبل الحفظ — يرجّع true لو تمام
function validateTriage(){
  const fail = (msg, id) => {
    toast(msg, '#c0392b');
    const el = document.getElementById(id);
    if(el){ el.scrollIntoView({ behavior: 'smooth', block: 'center' }); if(el.focus && el.tagName !== 'DIV') try { el.focus({ preventScroll: true }); } catch(e){} }
    return false;
  };
  if(isCallSource() && !v('fclaim')) return fail('⚠️ اختار: البلاغ اتوصف كـ (خطيرة / عادية / غير معروف)', 'fclaim');
  if(!priority) return fail('⚠️ اختار مستوى الأولوية (بسيطة / متوسطة / حرجة)', 'priorityPills');
  if(priority === 'critical' && !redFlags.size && v('fcreason').trim().length < 5) return fail('⚠️ الحالة حرجة بدون علامة خطر — اكتب السبب', 'fcreason');
  return true;
}
