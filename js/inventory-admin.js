// ====== إدارة المخزون للمشرف: تصحيح الرصيد / إضافة صنف / حذف صنف ======
// الاعتماد على: window._invItems (inventory.js)، MEDS_URL و EXPORT_ACCESS_KEY (config.js)، getLoggedUser (auth.js)

// ---------- أدوات عامة ----------
async function medsApi(payload){
  const u = getLoggedUser();
  payload.key = EXPORT_ACCESS_KEY;
  payload.user = u ? u.name : '';
  try {
    const res = await fetch(MEDS_URL, { method: 'POST', body: JSON.stringify(payload) });
    return await res.json();
  } catch(e){
    return { result: 'error', message: 'تعذّر الاتصال بالسيرفر — تأكد من النت وأعد المحاولة' };
  }
}

function siteLabel(){ return site === 'taj' ? 'تاج' : 'سراي'; }
function invItemByIdx(i){ return (window._invItems || [])[i]; }

function closeInvDialog(){
  const old = document.getElementById('invDlg');
  if(old) old.remove();
}

// نافذة حوار عامة. onOk(root) ترجّع true للإغلاق أو نص خطأ للعرض.
function invDialog(opts){
  closeInvDialog();
  const ov = document.createElement('div');
  ov.className = 'ov open';
  ov.id = 'invDlg';
  ov.style.zIndex = 130;
  ov.innerHTML = `
    <div class="modal">
      <div class="mh" style="background:${opts.color || 'linear-gradient(135deg,#1b6b8c,#2f9bc4)'}">
        <h3>${opts.title}</h3>
        <button type="button" data-x style="background:none;border:none;color:#fff;font-size:18px;cursor:pointer">✕</button>
      </div>
      <div class="mb">
        ${opts.bodyHTML}
        <div class="dlg-err" style="display:none"></div>
        <div class="dlg-actions">
          <button type="button" class="dlg-cancel">إلغاء</button>
          <button type="button" class="dlg-ok" style="${opts.okStyle || ''}">${opts.okText || 'حفظ'}</button>
        </div>
      </div>
    </div>`;
  document.body.appendChild(ov);
  const err = ov.querySelector('.dlg-err');
  const ok = ov.querySelector('.dlg-ok');
  const showErr = m => { err.textContent = '⚠️ ' + m; err.style.display = 'block'; };
  ov.querySelector('[data-x]').onclick = closeInvDialog;
  ov.querySelector('.dlg-cancel').onclick = closeInvDialog;
  ok.onclick = async () => {
    err.style.display = 'none';
    ok.disabled = true; const label = ok.textContent; ok.textContent = '⏳ جاري الحفظ...';
    try {
      const r = await opts.onOk(ov);
      if(r === true) closeInvDialog(); else showErr(r || 'حدث خطأ');
    } catch(e){ showErr('حدث خطأ غير متوقع'); }
    ok.disabled = false; ok.textContent = label;
  };
  if(opts.onOpen) opts.onOpen(ov);
  return ov;
}

async function afterInvChange(msg){
  toast(msg);
  await loadInventory();
  if(typeof refreshMedCatalog === 'function') refreshMedCatalog();
  if(typeof checkLowStockBanner === 'function') checkLowStockBanner();
}

const dv = (root, sel) => (root.querySelector(sel) || {}).value || '';

// ---------- تصحيح الرصيد ----------
function invEdit(idx){
  const it = invItemByIdx(idx);
  if(!it) return;
  const exp = /^\d{4}-\d{2}-\d{2}$/.test(it.expiry || '') ? it.expiry : '';
  invDialog({
    title: `✏️ تصحيح — ${escapeInvHTML(it.name)}`,
    okText: 'حفظ التصحيح',
    bodyHTML: `
      <div class="dlg-note">المسجل حاليًا في موقع <b>${siteLabel()}</b>: <b>${escapeInvHTML(it.qty)}</b> ${escapeInvHTML(it.unit || '')}</div>
      <div class="dlg-f"><label>الرصيد الفعلي (الموجود فعلاً)</label>
        <input type="number" id="dlgQty" min="0" step="any" value="${escapeInvHTML(it.qty)}"></div>
      <div class="dlg-diff" id="dlgDiff"></div>
      <div class="dlg-f"><label>سبب التصحيح (مطلوب لو غيّرت الرصيد)</label>
        <input type="text" id="dlgReason" placeholder="مثال: خطأ في التسجيل / جرد فعلي / تالف"></div>
      <div class="dlg-row">
        <div class="dlg-f"><label>الحد الأدنى للتنبيه</label>
          <input type="number" id="dlgMin" min="0" step="any" value="${escapeInvHTML(it.minQty)}"></div>
        <div class="dlg-f"><label>تاريخ الصلاحية</label>
          <input type="date" id="dlgExp" value="${exp}"></div>
      </div>
      <div class="dlg-hint">التصحيح لا يُسجَّل كشراء ولا صرف — يظهر في سجل الحركات باسم "تصحيح جرد" ومعاه اسمك والسبب.</div>`,
    onOpen(root){
      const qtyEl = root.querySelector('#dlgQty'), diffEl = root.querySelector('#dlgDiff');
      const upd = () => {
        const n = Number(qtyEl.value), d = n - Number(it.qty);
        diffEl.innerHTML = (qtyEl.value === '' || isNaN(n) || d === 0) ? '' :
          `هيتغيّر من ${escapeInvHTML(it.qty)} إلى ${escapeInvHTML(n)} (<bdi dir="ltr">${d > 0 ? '+' : '−'}${Math.abs(d)}</bdi>)`;
        diffEl.style.color = d < 0 ? '#c0392b' : '#1b6b3a';
      };
      qtyEl.addEventListener('input', upd); upd();
    },
    async onOk(root){
      const qty = dv(root, '#dlgQty'), min = dv(root, '#dlgMin'), expiry = dv(root, '#dlgExp'), reason = dv(root, '#dlgReason').trim();
      if(qty === '' || isNaN(Number(qty)) || Number(qty) < 0) return 'اكتب رصيدًا صحيحًا';
      const payload = { action: 'adjustStock', site, itemName: it.name, reason };
      const qtyChanged = Number(qty) !== Number(it.qty);
      if(qtyChanged){ if(!reason) return 'اكتب سبب التصحيح'; payload.newQty = Number(qty); }
      if(min !== '' && Number(min) !== Number(it.minQty)) payload.minQty = Number(min);
      if(expiry !== (it.expiry || '')) payload.expiry = expiry;
      if(!qtyChanged && payload.minQty === undefined && payload.expiry === undefined) return 'لم يتغيّر أي شيء';
      const r = await medsApi(payload);
      if(r.result !== 'success') return r.message || 'فشل التصحيح';
      await afterInvChange(`✅ تم تصحيح ${it.name}` + (qtyChanged ? ` — الرصيد الآن ${r.item.qty}` : ''));
      return true;
    }
  });
}

// ---------- إضافة صنف ----------
function invAddItem(){
  const cats = Array.from(new Set((window._invItems || []).map(i => i.category).filter(Boolean)));
  invDialog({
    title: `➕ إضافة صنف جديد — ${siteLabel()}`,
    okText: 'إضافة الصنف',
    color: 'linear-gradient(135deg,#1b6b3a,#2e7d52)',
    bodyHTML: `
      <div class="dlg-f"><label>اسم الصنف</label><input type="text" id="dlgName" placeholder="مثال: Zantac 150 mg"></div>
      <div class="dlg-f"><label>التصنيف</label>
        <select id="dlgCat">${cats.map(c => `<option value="${escapeInvHTML(c)}">${escapeInvHTML(c)}</option>`).join('')}<option value="__new__">➕ تصنيف جديد...</option></select>
        <input type="text" id="dlgCatNew" placeholder="اسم التصنيف الجديد" style="display:none;margin-top:6px"></div>
      <div class="dlg-f"><label>الوحدة</label><input type="text" id="dlgUnit" placeholder="علبة أقراص / أمبولات / قطعة ..."></div>
      <div class="dlg-row">
        <div class="dlg-f"><label>الرصيد الافتتاحي في ${siteLabel()}</label><input type="number" id="dlgQty" min="0" step="any" value="0"></div>
        <div class="dlg-f"><label>الحد الأدنى للتنبيه</label><input type="number" id="dlgMin" min="0" step="any" value="1"></div>
      </div>
      <div class="dlg-f"><label>تاريخ الصلاحية (اختياري)</label><input type="date" id="dlgExp"></div>
      <div class="dlg-f"><label>الاستخدام / ملاحظات (اختياري)</label><input type="text" id="dlgNotes"></div>
      <label class="dlg-chk"><input type="checkbox" id="dlgOther" checked> أضِف الصنف كمان في الموقع الآخر (برصيد 0)</label>`,
    onOpen(root){
      const sel = root.querySelector('#dlgCat'), nw = root.querySelector('#dlgCatNew');
      sel.addEventListener('change', () => { nw.style.display = sel.value === '__new__' ? 'block' : 'none'; });
      if(!cats.length){ sel.value = '__new__'; nw.style.display = 'block'; }
    },
    async onOk(root){
      const name = dv(root, '#dlgName').trim();
      let category = dv(root, '#dlgCat');
      if(category === '__new__') category = dv(root, '#dlgCatNew').trim();
      if(!name) return 'اكتب اسم الصنف';
      if(!category) return 'اختر التصنيف';
      const qty = Number(dv(root, '#dlgQty') || 0);
      if(isNaN(qty) || qty < 0) return 'الرصيد غير صحيح';
      const r = await medsApi({
        action: 'addItem', site, name, category,
        unit: dv(root, '#dlgUnit').trim(), qty, minQty: Number(dv(root, '#dlgMin') || 0),
        expiry: dv(root, '#dlgExp'), notes: dv(root, '#dlgNotes').trim(),
        addToOtherSite: root.querySelector('#dlgOther').checked
      });
      if(r.result !== 'success') return r.message || 'فشلت الإضافة';
      await afterInvChange(`✅ تمت إضافة ${name} (${(r.addedTo || []).join(' + ')})`);
      return true;
    }
  });
}

// ---------- حذف صنف ----------
function invRemove(idx){
  const it = invItemByIdx(idx);
  if(!it) return;
  invDialog({
    title: `🗑️ حذف صنف — ${escapeInvHTML(it.name)}`,
    okText: 'تأكيد الحذف',
    color: 'linear-gradient(135deg,#a80000,#e53935)',
    okStyle: 'background:#c0392b',
    bodyHTML: `
      <div class="dlg-note" style="background:#fdecea;color:#8e1b12">
        هتحذف <b>${escapeInvHTML(it.name)}</b> من مخزن <b>${siteLabel()}</b>.
        ${Number(it.qty) > 0 ? `<br>⚠️ الرصيد الحالي <b>${escapeInvHTML(it.qty)}</b> هيتسجّل في سجل الحركات وقت الحذف.` : ''}
      </div>
      <div class="dlg-f"><label>سبب الحذف</label><input type="text" id="dlgReason" placeholder="مثال: صنف لم يعد مستخدمًا"></div>
      <label class="dlg-chk"><input type="checkbox" id="dlgOther"> احذفه كمان من الموقع الآخر</label>
      <div class="dlg-hint">سجل الحركات القديمة للصنف بيفضل محفوظ ولا يُمسح.</div>`,
    async onOk(root){
      const r = await medsApi({
        action: 'removeItem', site, itemName: it.name,
        reason: dv(root, '#dlgReason').trim(), alsoOtherSite: root.querySelector('#dlgOther').checked
      });
      if(r.result !== 'success') return r.message || 'فشل الحذف';
      await afterInvChange(`🗑️ تم حذف ${it.name} (${(r.removedFrom || []).join(' + ')})`);
      return true;
    }
  });
}

// ---------- كتالوج أدوية المسعف يتبع المخزن الفعلي ----------
const CATALOG_CACHE = 'wecare_med_catalog_';

function buildCatalogSelect(items){
  const sel = document.getElementById('medCatalogSelect');
  if(!sel || !items || !items.length) return;
  const prev = sel.value;
  const groups = [];
  items.forEach(it => {
    let g = groups.find(x => x.cat === it.category);
    if(!g){ g = { cat: it.category || 'أخرى', items: [] }; groups.push(g); }
    g.items.push(it);
  });
  sel.innerHTML = groups.map(g =>
    `<optgroup label="${escapeInvHTML(g.cat)}">` +
    g.items.map(i => `<option value="${escapeInvHTML(i.name)}">${escapeInvHTML(i.name)}${i.unit ? ' — ' + escapeInvHTML(i.unit) : ''}</option>`).join('') +
    `</optgroup>`).join('');
  if(Array.from(sel.options).some(o => o.value === prev)) sel.value = prev;
}

async function refreshMedCatalog(){
  const reqSite = site, key = CATALOG_CACHE + reqSite;
  try {
    const res = await fetch(`${MEDS_URL}?action=getMedsInventory&site=${reqSite}`);
    const data = await res.json();
    if(reqSite !== site) return;                    // المستخدم بدّل الموقع أثناء التحميل
    if(data.result === 'success' && data.items && data.items.length){
      try { localStorage.setItem(key, JSON.stringify(data.items)); } catch(e){}
      buildCatalogSelect(data.items);
    }
  } catch(e){
    try {
      const c = JSON.parse(localStorage.getItem(key) || 'null');
      if(c && reqSite === site) buildCatalogSelect(c);
    } catch(_){}
  }
}
