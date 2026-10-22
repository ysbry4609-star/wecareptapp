// ====== حفظ في جوجل شيتس وفتح الواتساب ======
function saveAndShareWA(){
  if(!v('fn')){ toast('⚠️ أدخل اسم الحالة أولاً','#c0392b'); return; }
  if(!validateTriage()) return;
  saveToSheet();
  openWA();
}

function saveToSheet(){
  if(!v('fn')){ toast('⚠️ أدخل اسم الحالة أولاً','#c0392b'); return; }
  if(!validateTriage()) return;
  const url = REPORTS_URL;
  if(!url){ toast('⚠️ رابط Google Apps Script غير مُعد','#c0392b'); return; }

  updateStats();
  const loggedUser = getLoggedUser();

  const payload = {
    "الموقع": site === 'taj' ? 'تاج' : 'سراي',
    "التاريخ": v('fd'),
    "نوع الحدث": v('fet'),
    "تقرير عن الحدث": build(),
    "السن": v('fa'),
    "الوظيفه": getJobValue(),
    "اسم الحاله": v('fn'),
    "ميعاد الابلاغ": v('frt'),
    "ميعاد الوصول": v('fat'),
    "مكان الحدث": v('fl'),
    "اسم المسعف": v('fpa'),
    "جهة الإبلاغ": getReportSourceValue(),
    "اسم المستخدم": loggedUser ? loggedUser.name : '',
    "الصفة الوظيفية": loggedUser ? loggedUser.roleLabel : '',
    "الرقم المرجعي": ensureReportId(),
    "حالة حرجة": priority==='critical' ? 'نعم' : '',
    "الأولوية": getPriorityText(),
    "الأدوية المصروفة": getCustomMedsText(),
    // تصنيف البلاغات
    "نوع الحالة": caseType(),
    "وُصفت وقت البلاغ": isCallSource() ? v('fclaim') : '',
    "علامات الخطر": Array.from(redFlags).join('، '),
    "تقييم الخطورة": getPriorityText(),
    "سبب التصنيف الحرج": (priority === 'critical' && !redFlags.size) ? v('fcreason').trim() : '',
    "إحالة مستشفى": hospitalReferral() ? 'نعم' : 'لا',
    // الخصم التلقائي: السيرفر يخصم بحسب الرقم المرجعي (حفظ التقرير مرتين لا يكرر الخصم)
    "الأدوية_تفصيل": getMedsList(),
    "خصم_تلقائي": true
  };

  if(saveToSheet._busy) return;
  saveToSheet._busy = true;
  const ov = document.createElement('div'); ov.className='ov open';
  ov.style.pointerEvents='none';
  document.body.appendChild(ov);
  const done = () => { saveToSheet._busy = false; if(document.body.contains(ov)) document.body.removeChild(ov); };

  fetch(url, { method: 'POST', body: JSON.stringify(payload) })
    .then(r => r.text())
    .then(txt => {
      let data = null;
      try { data = JSON.parse(txt); } catch(e){ /* رد غير JSON: نعتبر الحفظ تم */ }
      done();
      reportSaveResult(payload, data);
      if(payload["الأدوية_تفصيل"].length) setTimeout(checkLowStockBanner, 2500);
    }).catch(err=>{
      queuePendingReport(payload);
      toast('📴 لا يوجد اتصال — تم حفظ التقرير مؤقتًا وسيُرسل تلقائيًا عند عودة النت','#e67e22');
      done();
    });
}

// رسالة النتيجة بعد الحفظ (بما فيها نتيجة الخصم لو السيرفر رجّعها)
function reportSaveResult(payload, data){
  const id = payload["الرقم المرجعي"];
  const d = data && data.deduction;
  if(data && data.result === 'error'){
    toast('❌ ' + (data.message || 'حصل خطأ في الحفظ'), '#c0392b');
    return;
  }
  if(!d){ toast('✅ تم الحفظ — رقم التقرير: ' + id); return; }
  const problems = [];
  if(d.insufficient && d.insufficient.length) problems.push('رصيد غير كافٍ: ' + d.insufficient.join('، '));
  if(d.untracked && d.untracked.length) problems.push('غير مسجل بالمخزون: ' + d.untracked.join('، '));
  if(problems.length) toast('✅ تم الحفظ والخصم — ⚠️ ' + problems.join(' | '), '#e67e22');
  else toast('✅ تم الحفظ وخصم الأدوية — رقم التقرير: ' + id);
}
