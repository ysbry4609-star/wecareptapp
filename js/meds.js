// ====== دوال الأدوية ======
function setMedChipQty(pill, qty){
  qty = Math.max(1, Math.min(99, Number(qty) || 1));
  pill.dataset.qty = String(qty);
  pill.querySelector('.med-qty').textContent = qty;
}
function addMedChip(name, silent, qty) {
  if(!name) return;
  const container = document.getElementById('selected-meds-pills');
  const existing = Array.from(container.querySelectorAll('.med-chip')).find(p => p.dataset.name === name);
  if(existing){
    // نفس الصنف اتضاف قبل كده: نزوّد الكمية بدل ما نرفضه
    setMedChipQty(existing, Number(existing.dataset.qty) + 1);
    toast('➕ زادت كمية ' + name + ' إلى ' + existing.dataset.qty);
    saveDraft();
    return;
  }

  const pill = document.createElement('div');
  pill.className = 'pill on med-chip';
  pill.dataset.name = name;
  pill.innerHTML =
    `<span class="med-name">${escapeInvHTML(name)}</span>` +
    `<button type="button" class="med-qbtn" data-act="dec" aria-label="إنقاص">−</button>` +
    `<span class="med-qty">1</span>` +
    `<button type="button" class="med-qbtn" data-act="inc" aria-label="زيادة">+</button>` +
    `<button type="button" class="med-del" data-act="del" aria-label="حذف">✕</button>`;
  pill.addEventListener('click', function(e){
    const act = e.target && e.target.dataset ? e.target.dataset.act : '';
    if(act === 'inc') setMedChipQty(pill, Number(pill.dataset.qty) + 1);
    else if(act === 'dec') setMedChipQty(pill, Number(pill.dataset.qty) - 1);
    else if(act === 'del') pill.remove();
    else return;
    saveDraft();
  });
  container.appendChild(pill);
  setMedChipQty(pill, qty || 1);
  if(!silent) bumpMedUsage(name);
  saveDraft();
}
function getTopMedsKey(){
  const u = getLoggedUser();
  const userTag = u && u.name ? u.name.trim().replace(/\s+/g,'_') : 'guest';
  return TOP_MEDS_KEY + '__' + userTag;
}
function getTopMedsData(){
  try {
    return JSON.parse(localStorage.getItem(getTopMedsKey()) || '{}');
  } catch(e){ return {}; }
}
function bumpMedUsage(name){
  if(!name) return;
  const data = getTopMedsData();
  data[name] = (data[name] || 0) + 1;
  localStorage.setItem(getTopMedsKey(), JSON.stringify(data));
  renderTopMeds();
}
function getTopMedsList(){
  const data = getTopMedsData();
  return Object.entries(data)
    .sort((a,b) => b[1] - a[1])
    .slice(0, TOP_MEDS_LIMIT)
    .map(([name, count]) => ({ name, count }));
}
function renderTopMeds(){
  const container = document.getElementById('topMedsQuick');
  if(!container) return;
  const list = getTopMedsList();
  if(list.length === 0){
    container.innerHTML = '<div style="font-size:11px;color:#889">لسه مفيش إحصائيات — أول ما تستخدم أدوية هتظهر هنا تلقائي</div>';
    return;
  }
  container.innerHTML = list.map(m =>
    `<button type="button" class="pill" onclick="quickAddTopMed('${escapeInvStr(m.name)}')">${escapeInvHTML(m.name)} <span style="opacity:.6;font-size:10px">(${m.count})</span></button>`
  ).join('');
}
function quickAddTopMed(name){
  addMedChip(name);
}
function addCatalogMed(){
  const select = document.getElementById('medCatalogSelect');
  addMedChip(select.value);
}
function addCustomMed(){
  const input = document.getElementById('customMedInput');
  const name = input.value.trim();
  if(!name){ toast('⚠️ اكتب اسم الدواء أو المستلزم أولاً','#c0392b'); return; }
  addMedChip(name);
  input.value = '';
}
// الأدوية المختارة كـ [{name, qty}]
function getMedsList(){
  return Array.from(document.querySelectorAll('#selected-meds-pills .med-chip'))
    .map(p => ({ name: p.dataset.name, qty: Number(p.dataset.qty) || 1 }));
}
// نص للتقرير والشيت: الكمية بتظهر بس لو أكتر من 1
function getCustomMedsText(){
  return getMedsList().map(m => m.qty > 1 ? `${m.name} ×${m.qty}` : m.name).join('، ');
}
function restoreCustomMeds(list){
  const container = document.getElementById('selected-meds-pills');
  container.innerHTML = '';
  // يقبل الشكل القديم (أسماء فقط) والجديد ({name, qty})
  (list||[]).forEach(m => {
    if(typeof m === 'string') addMedChip(m, true, 1);
    else if(m && m.name) addMedChip(m.name, true, m.qty);
  });
}

function ensureReportId(){
  if(!currentReportId){ currentReportId = generateReportId(); saveDraft(); }
  return currentReportId;
}

