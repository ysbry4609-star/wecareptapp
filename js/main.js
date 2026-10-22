// ملف التشغيل — لازم يتحمّل آخر ملف. الترتيب هنا مهم.
if(localStorage.getItem('wecare_dark') === 'true'){
  document.body.classList.add('dark');
  document.getElementById('darkToggle').textContent = '☀️';
}
updateDashboard();
init();   // يسترجع المسودة المحفوظة

// تسجيل الدخول التلقائي لازم يجي بعد init():
// لأنه بيحفظ المسودة، ولو جه قبلها كان بيمسح المسودة المحفوظة (الاسم والأدوية) عند إعادة تحميل الصفحة.
(function checkLoginOnLoad(){
  const user = getLoggedUser();
  if(user && user.name && user.role){
    applyLoggedInUser(user);
  }
})();

(function enforceParamedicName(){
  const u = getLoggedUser();
  if(u && u.name){
    const paField = document.getElementById('fpa');
    if(paField) paField.value = u.name;
    saveDraft();
  }
})();

document.getElementById('waOv').addEventListener('click',function(e){ if(e.target===this) closeWA(); });

window.addEventListener('online', flushPendingReports);
updatePendingBadge();
flushPendingReports();
