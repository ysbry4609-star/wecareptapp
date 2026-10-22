// ====== بحث سريع عن حالة سابقة ======
function openSearch(){
  document.getElementById('searchQuery').value = v('fn');
  document.getElementById('searchResults').innerHTML = '';
  document.getElementById('searchOv').classList.add('open');
}
function closeSearch(){ document.getElementById('searchOv').classList.remove('open'); }
async function runSearch(){
  const q = v('searchQuery').trim();
  const resultsEl = document.getElementById('searchResults');
  if(!q){ resultsEl.innerHTML = '<div style="color:#c0392b;font-size:13px">اكتب اسم للبحث عنه</div>'; return; }

  resultsEl.innerHTML = '<div style="color:#667;font-size:13px">⏳ جاري البحث...</div>';
  try {
    const siteName = site === 'taj' ? 'تاج' : 'سراي';
    const url = `${REPORTS_URL}?action=search&site=${encodeURIComponent(siteName)}&q=${encodeURIComponent(q)}`;
    const res = await fetch(url);
    const data = await res.json();

    if(data.result !== 'success'){
      resultsEl.innerHTML = `<div style="color:#c0392b;font-size:13px">❌ ${data.message||'حصل خطأ'}</div>`;
      return;
    }
    if(!data.matches || data.matches.length === 0){
      resultsEl.innerHTML = '<div style="color:#667;font-size:13px">لا توجد نتائج مطابقة</div>';
      return;
    }

    resultsEl.innerHTML = data.matches.map((m,i) => `
      <div onclick='fillFromSearch(${i})' style="border:1.5px solid #e0e6ec;border-radius:9px;padding:10px 12px;margin-bottom:8px;cursor:pointer;background:#f8fafb">
        <div style="font-weight:700;font-size:13.5px">${escapeSearchHTML(m.name)}</div>
        <div style="font-size:12px;color:#556;margin-top:3px">السن: ${escapeSearchHTML(m.age||'-')} · الوظيفة: ${escapeSearchHTML(m.job||'-')} · آخر تسجيل: ${escapeSearchHTML(m.date||'-')}</div>
        <div style="font-size:11.5px;color:#889;margin-top:2px">${escapeSearchHTML(m.location||'')}</div>
      </div>
    `).join('');
    window._searchMatches = data.matches;
  } catch(err){
    resultsEl.innerHTML = `<div style="color:#c0392b;font-size:13px">❌ تعذّر الاتصال بالسيرفر</div>`;
  }
}
function fillFromSearch(i){
  const m = window._searchMatches[i];
  if(!m) return;
  document.getElementById('fn').value = m.name || '';
  document.getElementById('fa').value = m.age || '';
  document.getElementById('fl').value = m.location || '';
  saveDraft();
  closeSearch();
  toast('✅ تم تعبئة بيانات الحالة');
}
function escapeSearchHTML(s){
  return String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
}

