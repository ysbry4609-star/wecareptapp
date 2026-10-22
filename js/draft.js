function onPills(id){ return Array.from(document.querySelectorAll('#'+id+' .pill.on')).map(b=>b.textContent).join('، '); }
function getSymptomsText(){
  const medsContainer = document.getElementById('selected-meds-pills');
  const excluded = new Set(['ABCDE','IPSGs','ITLS','BLS','ALS','Airway Mgmt','O2 Therapy','IV / Cannula','Nebulizer','Dressing','إحالة مستشفى','Psych Support',
    'الراحة التامة','شرب المياه الكافية','التغذية السليمة','تعويض السوائل / ORS','السلامة الغذائية','أطعمة خفيفة ومسلوقة','كمادات باردة','البعد عن الشمس','ممارسة الرياضة','النوم الكافي','متابعة internist','متابعة dentist','متابعة urologist','متابعة nephrologist','متابعة dermatologist','متابعة الطبيب والأدوية','طوارئ عند تدهور الحالة','قواعد السلامة أثناء العمل',
    'Paracetamol قرص','Ketolac قرص','Ketolac IM','Spasmodigestin قرص','Visceralgine IM','Dexamethasone IM','Primperan IM','Antinal','NS / سوائل وريدية','Glucose IM','Crosor نقط','Avil IM','Spasmofen IM','Hemolaclar مرهم','Move Massage','خافض حرارة أطفال']);
  return Array.from(document.querySelectorAll('.pill.on'))
    .filter(b => !medsContainer || !medsContainer.contains(b))
    .filter(b=>!excluded.has(b.textContent))
    .map(b=>b.textContent)
    .join('، ');
}
function toast(msg,c='#1b6b3a'){
  const t=document.getElementById('tst');
  t.textContent=msg; t.style.background=c;
  t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),3000);
}
function collectDraft(){
  const draft = { site, priority, reportId: currentReportId };
  document.querySelectorAll('input,select,textarea').forEach(el=>{ draft[el.id] = el.value; });
  document.querySelectorAll('.pill').forEach(p=>{ if(p.closest('#selected-meds-pills')) return; draft['pill:' + p.textContent.trim()] = p.classList.contains('on'); });
  draft.customMeds = getMedsList();
  draft.redFlags = Array.from(redFlags);
  draft.priorityAuto = priorityAuto;
  return draft;
}
function saveDraft(){
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(collectDraft()));
    showSaveIndicator();
  } catch (e) {
    console.warn('Could not save draft', e);
  }
}
function showSaveIndicator(){
  const el = document.getElementById('saveIndicator');
  if(!el) return;
  el.style.display = 'block';
  clearTimeout(showSaveIndicator._t);
  showSaveIndicator._t = setTimeout(()=>{ el.style.display='none'; }, 1400);
}
function restoreDraft(){
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if(!raw) return;
    const draft = JSON.parse(raw);
    if(draft.site) site = draft.site;
    if(draft.reportId) currentReportId = draft.reportId;
    if(draft.priority) setPriority(draft.priority);
    restoreCustomMeds(draft.customMeds);
    document.querySelectorAll('input,select,textarea').forEach(el=>{ if(draft[el.id] !== undefined) el.value = draft[el.id]; });
    document.querySelectorAll('.pill').forEach(p=>{ if(p.closest('#selected-meds-pills')) return; const key='pill:' + p.textContent.trim(); p.classList.toggle('on', !!draft[key]); });
    populateJobs();
    if(draft.fj !== undefined) document.getElementById('fj').value = draft.fj;
    if(draft.fjOther !== undefined) document.getElementById('fjOther').value = draft.fjOther;
    onJobChange(false);
    restoreTriage(draft.redFlags, draft.priorityAuto);
    onReportSourceChange(false);
  } catch (e) {
    console.warn('Could not restore draft', e);
  }
}
