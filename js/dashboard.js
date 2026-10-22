// ====== لوحة الإحصائيات السريعة ======
function updateDashboard(){
  loadSupervisorDashboard();
}
function updateLocalDashboard(){
  try {
    document.getElementById('dashboardTitle').textContent = '📊 إحصائيات سريعة (محلي على هذا الجهاز)';
    let stats = JSON.parse(localStorage.getItem('wecare_stats') || '{"total":0,"critical":0,"moderate":0,"minor":0,"responses":[]}');
    document.getElementById('totalCases').textContent = stats.total || 0;
    document.getElementById('criticalCases').textContent = stats.critical || 0;
    document.getElementById('moderateCases').textContent = stats.moderate || 0;
    document.getElementById('minorCases').textContent = stats.minor || 0;
    const avg = stats.responses && stats.responses.length > 0 ?
      Math.round(stats.responses.reduce((a,b)=>a+b,0) / stats.responses.length) : 0;
    document.getElementById('avgResponse').textContent = avg;
  } catch(e){ console.warn('Dashboard error', e); }
}
async function loadSupervisorDashboard(){
  const titleEl = document.getElementById('dashboardTitle');
  titleEl.textContent = '📊 إحصائيات حقيقية من جوجل شيتس — ⏳ جاري التحميل...';
  try {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const end = now.toISOString().split('T')[0];
    const siteName = site === 'taj' ? 'تاج' : 'سراي';
    const url = `${REPORTS_URL}?action=stats&site=${encodeURIComponent(siteName)}&start=${start}&end=${end}&key=${encodeURIComponent(EXPORT_ACCESS_KEY)}`;
    const res = await fetch(url);
    const data = await res.json();
    if(data.result !== 'success'){
      titleEl.textContent = '📊 تعذّر تحميل البيانات الحقيقية — ' + (data.message || 'خطأ غير معروف');
      updateLocalDashboard();
      return;
    }
    const s = data.stats;
    document.getElementById('totalCases').textContent = s.total || 0;
    document.getElementById('criticalCases').textContent = s.criticalCount || 0;
    document.getElementById('moderateCases').textContent = Math.max(0, (s.total||0) - (s.criticalCount||0));
    document.getElementById('minorCases').textContent = '-';
    document.getElementById('avgResponse').textContent = '-';
    titleEl.textContent = `📊 إحصائيات حقيقية من جوجل شيتس (شهر ${monthArabicNow()} — ${siteName})`;
  } catch(e){
    titleEl.textContent = '📊 تعذّر الاتصال بجوجل شيتس — عرض البيانات المحلية';
    updateLocalDashboard();
  }
}
function monthArabicNow(){
  const months = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
  return months[new Date().getMonth()];
}
function updateStats(){
  try {
    let stats = JSON.parse(localStorage.getItem('wecare_stats') || '{"total":0,"critical":0,"moderate":0,"minor":0,"responses":[]}');
    stats.total = (stats.total||0) + 1;
    if(priority === 'critical') stats.critical = (stats.critical||0) + 1;
    else if(priority === 'moderate') stats.moderate = (stats.moderate||0) + 1;
    else if(priority === 'minor') stats.minor = (stats.minor||0) + 1;
    const reportTime = v('frt'), arrivalTime = v('fat');
    if(reportTime && arrivalTime){
      const r = new Date('1970-01-01T'+reportTime);
      const a = new Date('1970-01-01T'+arrivalTime);
      const diff = Math.abs((a - r) / 60000);
      if(diff < 120) stats.responses.push(Math.round(diff));
    }
    localStorage.setItem('wecare_stats', JSON.stringify(stats));
    updateDashboard();
  } catch(e){ console.warn('Stats error', e); }
}

// ====== مستوى الأولوية ======
let priority = '';   // مفيش اختيار افتراضي: المسعف لازم يختار قبل الحفظ
function setPriority(p, auto){
  // لو فيه علامة خطر مختارة، الحالة حرجة ومينفعش تتغير يدويًا لأقل
  if(!auto && p !== 'critical' && typeof redFlags !== 'undefined' && redFlags.size){
    toast('⚠️ فيه علامة خطر مختارة — الحالة حرجة. شيل العلامة الأول لو مش صحيحة','#c0392b');
    return;
  }
  if(!auto && typeof priorityAuto !== 'undefined') priorityAuto = false;
  priority = p;
  document.querySelectorAll('.priority-btn').forEach(b=>b.classList.toggle('active', b.dataset.p===p));
  document.getElementById('fcritical').value = p==='critical' ? 'نعم' : '';
  if(typeof updateTriageUI === 'function') updateTriageUI();
  saveDraft();
}
function getPriorityText(){
  return priority==='critical' ? 'حرجة' : priority==='minor' ? 'بسيطة' : priority==='moderate' ? 'متوسطة' : '';
}

function generateReportId(){
  const siteCode = site === 'taj' ? 'تاج' : 'سراي';
  const now = new Date();
  const dateStr = now.getFullYear() + String(now.getMonth()+1).padStart(2,'0') + String(now.getDate()).padStart(2,'0');
  const rand = Math.floor(1000 + Math.random()*9000);
  return `${siteCode}-${dateStr}-${rand}`;
}

