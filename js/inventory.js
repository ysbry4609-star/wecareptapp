// ====== نظام المخزون والصيدلية الجديد ======
function openInventory(){
  document.getElementById('inventoryOv').classList.add('open');
  loadInventory();
}
function closeInventory(){
  document.getElementById('inventoryOv').classList.remove('open');
}

async function loadInventory(){
  const loading = document.getElementById('invLoading');
  const tableEl = document.getElementById('invTable');
  const siteName = site === 'taj' ? 'تاج' : 'سراي';
  document.getElementById('invSiteLabel').textContent = siteName;
  loading.style.display = 'block';
  tableEl.style.display = 'none';

  try {
    const url = `${MEDS_URL}?action=getMedsInventory&site=${site}`;
    const res = await fetch(url);
    const data = await res.json();
    
    if(data.result !== 'success'){
      loading.textContent = '❌ ' + (data.message || 'تعذّر تحميل المخزون');
      return;
    }
    renderInventory(data.items || []);
    loading.style.display = 'none';
    tableEl.style.display = 'block';
  } catch(e){
    loading.textContent = '❌ تعذّر الاتصال بالسيرفر';
  }
}

function renderInventory(items){
  const user = getLoggedUser();
  const isSupervisor = user && user.role === '14';
  const tableEl = document.getElementById('invTable');

  // نحتفظ بآخر بيانات محمّلة للتصدير (Excel / PDF)، وأزرار التصدير للمشرف فقط
  window._invItems = items;
  const tb = document.getElementById('invToolbar');
  if(tb) tb.style.display = isSupervisor ? 'flex' : 'none';

  if(items.length === 0) {
    tableEl.innerHTML = '<div style="text-align:center; padding:20px;">لا توجد أصناف مسجلة</div>';
    return;
  }

  // تجميع الأصناف
  const groups = [];
  items.forEach(item => {
    let g = groups.find(g => g.category === item.category);
    if(!g){ g = { category: item.category, items: [] }; groups.push(g); }
    g.items.push(item);
  });

  // بيانات الحالة الحالية
  const currentCaseName = document.getElementById('fn') ? document.getElementById('fn').value : '-';
  const currentParamedic = document.getElementById('fpa') ? document.getElementById('fpa').value : '-';
  const currentReportId = typeof ensureReportId === 'function' ? ensureReportId() : '-';

  tableEl.innerHTML = groups.map(g => `
    <div style="font-weight:800;font-size:12.5px;color:#1b6b8c;margin:14px 4px 4px">${escapeInvHTML(g.category)}</div>
    ${g.items.map(item => {
      const isLow = Number(item.qty) <= Number(item.minQty);
      const badgeColor = isLow ? 'background:#fdecea;color:#c0392b' : 'background:#e8f7ee;color:#1e7a41';
      
      return `
        <div class="inv-row" style="flex-direction:column; align-items:flex-start; padding:10px; border-bottom:1px solid #eee">
          <div style="display:flex; justify-content:space-between; width:100%; margin-bottom:8px">
            <div style="flex:1">
               <span style="font-weight:700; font-size:13px">${escapeInvHTML(item.name)}</span> 
               <span style="color:#889;font-size:10.5px"> — ${escapeInvHTML(item.unit)}</span>
               ${isLow ? '<span style="font-size:10px; color:#c0392b; margin-right:5px">(رصيد منخفض)</span>' : ''}
               ${item.expiry ? `<span style="font-size:10px;color:#889;margin-right:5px">⏳ ${escapeInvHTML(item.expiry)}</span>` : ''}
            </div>
            <span class="inv-qty" style="${badgeColor}">${item.qty}</span>
          </div>
          
          <div class="inv-actions" style="display:flex; gap:6px; width:100%">
            <input type="number" id="qty_${sanitizeId(item.name)}" placeholder="الكمية" style="width:60px; padding:6px; border-radius:6px; border:1px solid #ccc; text-align:center; font-size:12px" min="1">
            <button onclick="doDispense('${escapeInvStr(item.name)}', '${escapeInvStr(currentCaseName)}', '${escapeInvStr(currentParamedic)}', '${escapeInvStr(currentReportId)}')" style="flex:1; background:#e74c3c; color:white; border:none; border-radius:6px; padding:6px; font-size:11px; font-weight:bold; cursor:pointer">صرف 🔴</button>
            ${isSupervisor ? `<button onclick="doPurchase('${escapeInvStr(item.name)}')" style="flex:1; background:#27ae60; color:white; border:none; border-radius:6px; padding:6px; font-size:11px; font-weight:bold; cursor:pointer">شراء 🟢</button>
            <button type="button" onclick="invEdit(${items.indexOf(item)})" title="تصحيح الرصيد" class="inv-mini edit">✏️</button>
            <button type="button" onclick="invRemove(${items.indexOf(item)})" title="حذف الصنف" class="inv-mini del">🗑️</button>` : ''}
          </div>
        </div>
      `;
    }).join('')}
  `).join('');
}

async function doDispense(itemName, caseName, paramedic, reportId){
  const qtyInput = document.getElementById('qty_' + sanitizeId(itemName));
  const qty = Number(qtyInput.value);
  if(!qty || qty <= 0){ toast('⚠️ اكتب كمية صحيحة','#c0392b'); return; }
  
  if(!confirm(`هل أنت متأكد من صرف ${qty} من (${itemName})؟`)) return;

  const payload = {
    action: 'medTransaction',
    site: site,
    type: 'صرف',
    itemName: itemName,
    qty: qty,
    caseName: caseName,
    paramedic: paramedic,
    reportId: reportId
  };

  try {
    const res = await fetch(MEDS_URL, { method: 'POST', body: JSON.stringify(payload) });
    const data = await res.json();
    if(data.result !== 'success'){ toast('❌ ' + data.message,'#c0392b'); return; }
    
    toast(`✅ تم صرف ${qty} — الرصيد الجديد: ${data.newQty}`);
    qtyInput.value = '';
    loadInventory();
  } catch(e) {
    toast('❌ تعذّر الاتصال بالسيرفر','#c0392b');
  }
}

async function doPurchase(itemName){
  const qtyInput = document.getElementById('qty_' + sanitizeId(itemName));
  const qty = Number(qtyInput.value);
  if(!qty || qty <= 0){ toast('⚠️ اكتب كمية صحيحة','#c0392b'); return; }
  
  if(!confirm(`هل أنت متأكد من إضافة ${qty} إلى (${itemName})؟`)) return;

  const user = getLoggedUser();
  const payload = {
    action: 'medTransaction',
    site: site,
    type: 'شراء',
    itemName: itemName,
    qty: qty,
    caseName: '-',
    paramedic: user ? user.name : '-',
    reportId: '-'
  };

  try {
    const res = await fetch(MEDS_URL, { method: 'POST', body: JSON.stringify(payload) });
    const data = await res.json();
    if(data.result !== 'success'){ toast('❌ ' + data.message,'#c0392b'); return; }
    
    toast(`✅ تم شراء/إضافة ${qty} — الرصيد الجديد: ${data.newQty}`);
    qtyInput.value = '';
    loadInventory();
  } catch(e) {
    toast('❌ تعذّر الاتصال بالسيرفر','#c0392b');
  }
}

function sanitizeId(s){ return String(s).replace(/[^a-zA-Z0-9]/g,'_'); }
function escapeInvHTML(s){ return String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
function escapeInvStr(s){ return String(s).replace(/'/g, "\\'"); }

// ====== بانر تنبيه نقص المخزون ======
async function checkLowStockBanner(){
  const siteName = site === 'taj' ? 'تاج' : 'سراي';
  try {
    const url = `${MEDS_URL}?action=getMedsInventory&site=${site}`;
    const res = await fetch(url);
    const data = await res.json();
    if(data.result !== 'success') return;
    
    // تغيير أسماء الحقول لتتناسب مع النظام الجديد
    const lowItems = (data.items||[]).filter(it => Number(it.qty) <= Number(it.minQty));
    const banner = document.getElementById('lowStockBanner');
    if(lowItems.length > 0){
      banner.style.display = 'block';
      banner.textContent = `⚠️ نقص في المخزون (${siteName}): ${lowItems.map(i=>i.name).join('، ')} — دوس هنا لعرض المخزون`;
    } else {
      banner.style.display = 'none';
    }
  } catch(e){ /* تجاهل */ }
}

