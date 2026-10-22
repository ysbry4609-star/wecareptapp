// ====== WhatsApp ======
function openWA(){
  if(!v('fn')){ toast('⚠️ أدخل اسم الحالة أولاً','#c0392b'); return; }
  document.getElementById('waT').textContent = build();
  document.getElementById('waOv').classList.add('open');
}
function closeWA(){ document.getElementById('waOv').classList.remove('open'); }
function copyWA(){
  const text = document.getElementById('waT').textContent;
  if(navigator.clipboard){
    navigator.clipboard.writeText(text).then(()=>{ toast('✅ تم النسخ — الصقه في الواتساب!'); closeWA(); });
  } else {
    const ta=document.createElement('textarea'); ta.value=text;
    document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
    toast('✅ تم النسخ!'); closeWA();
  }
}

// ====== clear ======
function clearAll(){
  if(!confirm('مسح كل البيانات؟')) return;
    document.querySelectorAll('input,select,textarea').forEach(el=>{
    if(el.type!=='date' && el.type!=='number' && el.id!=='fpa') el.value='';
  });
  document.getElementById('fd').value = new Date().toISOString().split('T')[0];
  document.getElementById('frt').value = new Date().toTimeString().slice(0,5);
  document.getElementById('vgc').value = '15/15';
  updateMonthYear();
  document.querySelectorAll('.pill').forEach(p=>{
    p.classList.remove('on');
    if(['ABCDE','IPSGs','ITLS'].includes(p.textContent)) p.classList.add('on');
  });
  document.getElementById('selected-meds-pills').innerHTML = '';
  currentReportId = '';
  resetTriage();
  setPriority('', true);
  saveDraft();
  toast('🗑️ تم مسح الفورم','#555');
}

