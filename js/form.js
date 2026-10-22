function init(){
  bindFormEvents();
  renderRedFlags();
  populateJobs();
  restoreDraft();
  applyDefaults();
  setSite(site);
  renderTopMeds();
}

function bindFormEvents(){
  document.querySelectorAll('input,select,textarea').forEach(el=>{
    el.addEventListener('input', saveDraft);
    el.addEventListener('change', saveDraft);
  });
  window.addEventListener('beforeunload', saveDraft);
}

function updateMonthYear(){
  const dateVal = v('fd');
  if(!dateVal) return;
  const date = new Date(dateVal + 'T00:00:00');
  const monthNames = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const monthName = monthNames[date.getMonth()];
  document.getElementById('fms').value = `${monthName} ${year}`;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(collectDraft()));
}

function applyDefaults(){
  if(!v('fd')) {
    document.getElementById('fd').value = new Date().toISOString().split('T')[0];
  }
  updateMonthYear();
  if(!v('frt')) document.getElementById('frt').value = new Date().toTimeString().slice(0,5);
  if(!v('vgc')) document.getElementById('vgc').value = '15/15';
}

// ====== site toggle ======
function setSite(s){
  site = s;
  const hdr = document.getElementById('hdr');
  const title = document.getElementById('hdr-title');
  const btnT = document.getElementById('btn-taj');
  const btnS = document.getElementById('btn-saray');
  if(s==='taj'){
    hdr.className='hdr taj';
    title.textContent='نظام التقارير الطبية — موقع تاج';
    btnT.classList.add('active'); btnS.classList.remove('active');
  } else {
    hdr.className='hdr saray';
    title.textContent='نظام التقارير الطبية — موقع سراي';
    btnS.classList.add('active'); btnT.classList.remove('active');
  }
  updateEmergencyGradient();
  updateDashboard();
  checkLowStockBanner();
  if(typeof refreshMedCatalog === 'function') refreshMedCatalog();   // كتالوج الأدوية من المخزن الفعلي للموقع
  saveDraft();
}

function updateEmergencyGradient(){
  const tajColor = '#0a3d6b', sarayColor = '#7b1fa2';
  const gradient = site === 'taj'
    ? `linear-gradient(135deg, ${tajColor}, ${sarayColor})`
    : `linear-gradient(135deg, ${sarayColor}, ${tajColor})`;
  const box = document.getElementById('emergencyGradientBox');
  const card = document.getElementById('emergencyGradientCard');
  if(box) box.style.background = gradient;
  if(card) card.style.background = gradient;
}

// ====== الوظيفة ======
const JOB_LIST = [
  {m:'عميل (Client)', f:'عميلة (Client)'},
  {m:'فرد أمن OMS', f:'فردة أمن OMS'},
  {m:'مشرف أمن', f:'مشرفة أمن'},
  {m:'مدير OMS', f:'مديرة OMS'},
  {m:'عامل Housekeeping', f:'عاملة Housekeeping'},
  {m:'مشرف Housekeeping', f:'مشرفة Housekeeping'},
  {m:'عامل زراعة', f:'عاملة زراعة'},
  {m:'مشرف زراعة', f:'مشرفة زراعة'},
  {m:'سواق', f:'سواقة'},
  {m:'فني', f:'فنية'},
  {m:'مراقب كاميرات', f:'مراقبة كاميرات'},
  {m:'مهندس', f:'مهندسة'},
  {m:'فني أسانسير', f:'فنية أسانسير'}
];

function populateJobs(){
  const sel = document.getElementById('fj');
  if(!sel) return;
  const isFemale = v('fg') === 'أنثى';
  const prevVal = sel.value;
  sel.innerHTML = '<option value="">اختر...</option>';
  JOB_LIST.forEach(j=>{
    const val = isFemale ? j.f : j.m;
    const opt = document.createElement('option');
    opt.value = val; opt.textContent = val;
    sel.appendChild(opt);
  });
  const otherOpt = document.createElement('option');
  otherOpt.value = 'أخرى'; otherOpt.textContent = 'أخرى (اكتبها)';
  sel.appendChild(otherOpt);
  if(prevVal && Array.from(sel.options).some(o=>o.value===prevVal)) sel.value = prevVal;
  onJobChange(false);
}
function onJobChange(shouldSave){
  const sel = document.getElementById('fj');
  const other = document.getElementById('fjOther');
  if(!sel || !other) return;
  other.style.display = sel.value === 'أخرى' ? 'block' : 'none';
  if(shouldSave !== false) saveDraft();
}
function getJobValue(){
  const sel = document.getElementById('fj');
  if(sel && sel.value === 'أخرى') return v('fjOther');
  return v('fj');
}

function onReportSourceChange(shouldSave){
  const sel = document.getElementById('fr');
  const other = document.getElementById('frOther');
  if(!sel || !other) return;
  other.style.display = sel.value === 'أخرى' ? 'block' : 'none';
  if(typeof updateClaimVisibility === 'function') updateClaimVisibility();
  if(shouldSave !== false) saveDraft();
}
function getReportSourceValue(){
  const sel = document.getElementById('fr');
  if(sel && sel.value === 'أخرى') return v('frOther');
  return v('fr');
}

// ====== helpers ======
function tog(el){ el.classList.toggle('on'); saveDraft(); }
function v(id){ return (document.getElementById(id)||{}).value||''; }

