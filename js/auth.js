// ====== نظام تسجيل الدخول ======
const ROLE_CODES = { "12": "مسعف أولى", "13": "مسعف متقدم", "14": "مشرف" };
const INSPECTION_URL = "inspection.html";
const EXPORT_URL = "export.html";
const STATS_URL = "stats.html";

function doLogin(){
  const name = v('loginName').trim();
  const role = v('loginRole');
  const code = v('loginCode').trim();
  const errEl = document.getElementById('loginError');
  errEl.style.display = 'none';

  if(!name){ errEl.textContent = '⚠️ اكتب اسمك بالكامل.'; errEl.style.display='block'; return; }
  if(!role){ errEl.textContent = '⚠️ اختر صفتك الوظيفية.'; errEl.style.display='block'; return; }
  if(code !== role){ errEl.textContent = '❌ كود التأكيد غير صحيح لهذه الصفة.'; errEl.style.display='block'; return; }

  const user = { name, role, roleLabel: ROLE_CODES[role] };
  localStorage.setItem('wecareUser', JSON.stringify(user));
  applyLoggedInUser(user);
  logAccessEvent(name, ROLE_CODES[role]);
}

function logAccessEvent(name, roleLabel){
  try {
    fetch(`${REPORTS_URL}?action=logAccess&name=${encodeURIComponent(name)}&role=${encodeURIComponent(roleLabel)}`, { mode: 'no-cors' });
  } catch(e){ /* تجاهل */ }
}

function logout(){
  localStorage.removeItem('wecareUser');
  location.reload();
}

function applyLoggedInUser(user){
  document.getElementById('loginOv').classList.remove('open');

  document.getElementById('userBar').style.display = 'flex';
  document.getElementById('userBarLabel').textContent = user.name + ' — ' + user.roleLabel;
  document.getElementById('versionLabel').textContent = APP_VERSION;

  if(user.role === '14'){
    document.getElementById('supervisorMenu').style.display = 'block';
  }

  const paField = document.getElementById('fpa');
  if(paField) paField.value = user.name;
  saveDraft();
  renderTopMeds();

  updateDashboard();
}

function confirmLogout(){
  if(confirm('هل تريد تسجيل الخروج؟')) logout();
}

function toggleFabMenu(){
  const dd = document.getElementById('fabDropdown');
  dd.style.display = dd.style.display === 'block' ? 'none' : 'block';
}
document.addEventListener('click', function(e){
  const wrap = document.getElementById('supervisorMenu');
  const dd = document.getElementById('fabDropdown');
  if(dd && dd.style.display === 'block' && wrap && !wrap.contains(e.target)){
    dd.style.display = 'none';
  }
});

function goToView(view){
  if(view === 'report'){ return; }
  if(view === 'export'){ location.href = EXPORT_URL; return; }
  if(view === 'stats'){ location.href = STATS_URL; return; }
  if(view === 'inspection'){ location.href = INSPECTION_URL; return; }
}

function getLoggedUser(){
  try {
    const raw = localStorage.getItem('wecareUser');
    return raw ? JSON.parse(raw) : null;
  } catch(e){ return null; }
}

