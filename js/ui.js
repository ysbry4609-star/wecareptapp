// ====== الوضع الليلي ======
function toggleDark(){
  document.body.classList.toggle('dark');
  const isDark = document.body.classList.contains('dark');
  localStorage.setItem('wecare_dark', isDark ? 'true' : 'false');
  document.getElementById('darkToggle').textContent = isDark ? '☀️' : '🌙';
}

// ====== نافذة اتصال المشرف ======
function openEmergencyModal(){
  document.getElementById('emergencyModal').classList.add('open');
}
function closeEmergencyModal(){
  document.getElementById('emergencyModal').classList.remove('open');
}
function formatEgyptianNumber(phone){
  let clean = phone.replace(/[^0-9]/g,'');
  if(clean.startsWith('0')) clean = '20' + clean.substring(1);
  else if(!clean.startsWith('20')) clean = '20' + clean;
  return clean;
}
function openWhatsApp(phone){
  const patientName = v('fn') || 'غير محدد';
  const location = v('fl') || 'غير محدد';
  const complaint = v('fc') || 'غير محدد';
  const siteName = site === 'taj' ? 'موقع تاج' : 'موقع سراي';
  const formatted = formatEgyptianNumber(phone);
  const message = `🚨 *تنبيه طوارئ من WeCare!*%0A%0A👤 المريض: ${patientName}%0A📍 الموقع: ${location} (${siteName})%0A🩺 الشكوى: ${complaint}%0A%0Aيرجى التوجه فوراً. شكراً لفريق WeCare.`;
  window.open(`https://wa.me/${formatted}?text=${message}`, '_blank');
}
function copyNumber(phone){
  if(navigator.clipboard){
    navigator.clipboard.writeText(phone).then(()=>{ toast('✅ تم نسخ الرقم: ' + phone); }).catch(()=>{ fallbackCopyText(phone); });
  } else { fallbackCopyText(phone); }
}
function fallbackCopyText(text){
  const input = document.createElement('input');
  input.value = text;
  document.body.appendChild(input);
  input.select();
  document.execCommand('copy');
  document.body.removeChild(input);
  toast('✅ تم نسخ الرقم: ' + text);
}

