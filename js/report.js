// ====== build report ======
function build(){
  const siteName = site==='taj' ? 'فريق إسعاف موقع تاج' : 'فريق إسعاف موقع سراي';
  const hist=v('fh')||'None', bp=v('vbp')||'/////', spo2=v('vsp')||'//',
        gcs=v('vgc')||'15/15', rbs=v('vrb')||'////', hr=v('vhr')||'///', temp=v('vtm')||'/////';

  const proto = onPills('proto-pills') || 'ABCDE, IPSGs, ITLS';
  const meds  = getCustomMedsText();
  const edu   = onPills('edu-pills');
  const symp  = getSymptomsText();

  let cl = v('fc');
  if(v('fcd')) cl += ` (${v('fcd')})`;
  if(symp) cl += `، ${symp}`;

  let t = '';

  t += `🔖 رقم التقرير: ${ensureReportId()}\n\n`;
  t += `⚕️ تقرير تدخل طبي`;
  if(v('fc')) t += ` — ${v('fc')}`;
  t += `\n\n`;
  t += `👤 بيانات الحالة:\n`;
  if(getReportSourceValue()) t += `* المبلغ: ${getReportSourceValue()}\n`;
  if(v('fl')) t += `* المكان: ${v('fl')}\n`;
  t += `* الاسم: ${v('fn')}\n`;
  if(v('fa')) t += `* السن: ${v('fa')} عاماً\n`;
  if(getJobValue()) t += `* الوظيفة: ${getJobValue()}\n`;
  if(cl) t += `* الشكوى والأعراض الحالية: ${cl}\n`;
  t += `* التاريخ المرضي: ${hist}\n`;
  t += `\n`;
  t += `📊 أولاً: العلامات الحيوية (V/S) أثناء الفحص:\n`;
  t += `* درجة الوعي (GCS): ${gcs}\n`;
  t += `* ضغط الدم (BP): ${bp} mmHg\n`;
  t += `* نسبة الأكسجين (SpO2): ${spo2}%\n`;
  t += `* مستوى السكر العشوائي (RBS): ${rbs} mg/dL\n`;
  t += `* نبض القلب (H.R): ${hr} bpm\n`;
  t += `* درجة الحرارة (Temp): ${temp}°C\n`;
  t += `\n`;
  t += `🛠️ ثانياً: الإجراءات والتدخل الطبي:\n`;
  t += `* البروتوكولات المُتبعة: ${proto}\n`;
  t += `* تم قياس العلامات الحيوية بدقة ومراقبتها\n`;
  if(meds) t += `* الأدوية والعلاج: ${meds}\n`;
  if(v('fpr')) t += `* ${v('fpr')}\n`;
  if(v('foc')) t += `* نتيجة التدخل: ${v('foc')}\n`;
  t += `\n`;
  t += `📢 ثالثاً: التعليمات والنصائح الطبية (Health Education):\n`;
  t += `* تم نصح المريض بـ: ${edu || 'الراحة وشرب المياه الكافية'}\n`;
  if(v('fee')) t += `* ${v('fee')}\n`;
  if(v('fno')) t += `\n📝 ملاحظات:\n${v('fno')}\n`;
  t += `\nEmergency and Critical Care Department, WeCare Company\n${siteName}`;

  return t;
}

