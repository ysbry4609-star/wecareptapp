// ====== قوالب سريعة ======
const TEMPLATES = {
  headache:   { fc:'صداع', fcd:'صداع نمطي غير مصحوب بعلامات خطر', symptoms:['صداع'], protocols:[], meds:['Cetal 500 mg'], education:['الراحة التامة','شرب المياه الكافية'], priority:'minor' },
  abdominal:  { fc:'ألم بطن', fcd:'ألم بطن نمطي بدون علامات حادة', symptoms:['ألم بطني'], protocols:[], meds:['Spasmofree Strip'], education:['تعويض السوائل / ORS'], priority:'minor' },
  minor_wound:{ fc:'جرح سطحي', fcd:'جرح بسيط بدون نزيف نشط', symptoms:['جرح'], protocols:['Dressing'], meds:[], education:['كمادات باردة'], priority:'minor' },
  fever:      { fc:'حرارة مرتفعة', fcd:'ارتفاع في درجة الحرارة', symptoms:['حمى'], protocols:[], meds:['Cetal 500 mg'], education:['شرب المياه الكافية'], priority:'minor' },
  fainting:   { fc:'إغماء بسيط', fcd:'نوبة إغماء قصيرة، استعاد الوعي', symptoms:['إغماء'], protocols:['O2 Therapy'], meds:[], education:['الراحة التامة'], priority:'moderate' },
  burn:       { fc:'حروق من الدرجة الثانية', fcd:'حروق ناتجة عن ماء ساخن / نار', symptoms:['جرح'], protocols:['Dressing'], meds:['Hemoclar Cream 0.5%'], education:['كمادات باردة','الراحة التامة'], priority:'moderate' },
  fracture:   { fc:'اشتباه كسر في الطرف السفلي', fcd:'ألم شديد، تورم، عدم القدرة على الحركة', symptoms:['كدمات'], protocols:['Dressing','IV / Cannula'], meds:['Ketolac 30 mg/2 ml'], education:['الراحة التامة','متابعة الطبيب والأدوية'], priority:'moderate' },
  bleeding:   { fc:'نزيف حاد من جرح قطعي', fcd:'نزيف مستمر، شحوب، دوخة', symptoms:['جرح','هبوط'], protocols:['Dressing','IV / Cannula','NS / سوائل وريدية'], meds:['Kapron 500 mg/5 ml'], education:['الراحة التامة','طوارئ عند تدهور الحالة'], priority:'critical' },
  chestPain:  { fc:'ألم صدر ضاغط مع ضيق تنفس', fcd:'ألم يمتد للذراع الأيسر، تعرق', symptoms:['ألم صدر','ضيق تنفس'], protocols:['O2 Therapy','IV / Cannula'], meds:[], education:['الراحة التامة','طوارئ عند تدهور الحالة'], priority:'critical' }
};
function applyTemplate(){
  const key = v('quickTemplate');
  if(!key || !TEMPLATES[key]) return;
  const t = TEMPLATES[key];
  if(t.fc) document.getElementById('fc').value = t.fc;
  if(t.fcd) document.getElementById('fcd').value = t.fcd;
  const toActivate = [].concat(t.symptoms||[], t.protocols||[], t.education||[]);
  document.querySelectorAll('.pill').forEach(p=>{
    if(toActivate.includes(p.textContent.trim())) p.classList.add('on');
  });
  (t.meds||[]).forEach(med => addMedChip(med));
  if(t.priority) setPriority(t.priority);
  saveDraft();
  toast('⚡ تم تطبيق القالب — عدّل أي حقل حسب الحالة الفعلية');
}

