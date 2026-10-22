// ====== سجل الحركات (صرف / شراء / تصحيح ...) + ملخص الاستهلاك ======
// بيقرأ من شيت "تحرك شهرى ..." عبر action=getMovements ويعرض نتيجة الفلتر، والتصدير في movements-export.js

const MOV_TYPES = ['صرف', 'شراء', 'تصحيح جرد', 'إضافة صنف', 'حذف صنف', 'تعديل بيانات'];
const MOV_RENDER_LIMIT = 300;
let movTab = 'moves';

function localDay(offsetDays){
  const d = new Date(); d.setDate(d.getDate() + (offsetDays || 0));
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function movTypeClass(t){
  return t === 'صرف' ? 'out' : t === 'شراء' ? 'in' : t === 'تصحيح جرد' ? 'fix' : 'oth';
}

// التغيير في الرصيد بإشارته
function movDelta(r){
  const q = Number(r.qty) || 0;
  if(r.type === 'صرف' || r.type === 'حذف صنف') return -Math.abs(q);
  if(r.type === 'شراء' || r.type === 'إضافة صنف') return Math.abs(q);
  if(r.type === 'تصحيح جرد') return q;
  return 0;
}

function movIsCase(r){
  return (r.caseName && r.caseName !== '-') || (r.reportId && r.reportId !== '-');
}

// تجميع: لكل صنف (صرف/شراء/تكلفة) ولكل مسعف
function aggregateMovements(rows){
  const items = new Map(), meds = new Map();
  const t = { count: rows.length, dispensed: 0, purchased: 0, cost: 0, corrections: 0 };
  const allCases = new Set();
  const get = (m, k, mk) => { if(!m.has(k)) m.set(k, mk()); return m.get(k); };
  rows.forEach(r => {
    if(r.type === 'صرف'){
      const q = Math.abs(Number(r.qty) || 0);
      t.dispensed += q;
      const it = get(items, r.name, () => ({ name: r.name, dispensed: 0, purchased: 0, cost: 0, cases: new Set() }));
      it.dispensed += q;
      const pm = get(meds, r.paramedic || '-', () => ({ name: r.paramedic || '-', dispensed: 0, cases: new Set() }));
      pm.dispensed += q;
      if(movIsCase(r)){
        const key = (r.reportId && r.reportId !== '-') ? r.reportId : r.caseName;
        it.cases.add(key); pm.cases.add(key); allCases.add(key);
      }
    } else if(r.type === 'شراء'){
      const q = Math.abs(Number(r.qty) || 0);
      t.purchased += q;
      const it = get(items, r.name, () => ({ name: r.name, dispensed: 0, purchased: 0, cost: 0, cases: new Set() }));
      it.purchased += q;
      const c = Number(r.total);
      if(!isNaN(c) && r.total !== ''){ it.cost += c; t.cost += c; }
    } else if(r.type === 'تصحيح جرد'){
      t.corrections++;
    }
  });
  t.cases = allCases.size;
  const itemList = Array.from(items.values()).map(i => ({ name: i.name, dispensed: i.dispensed, cases: i.cases.size, purchased: i.purchased, cost: i.cost }))
    .sort((a, b) => b.dispensed - a.dispensed || b.purchased - a.purchased);
  const medList = Array.from(meds.values()).map(m => ({ name: m.name, dispensed: m.dispensed, cases: m.cases.size }))
    .sort((a, b) => b.dispensed - a.dispensed);
  return { items: itemList, paramedics: medList, totals: t };
}

function ensureMovOverlay(){
  let ov = document.getElementById('movOv');
  if(ov) return ov;
  ov = document.createElement('div');
  ov.className = 'ov'; ov.id = 'movOv'; ov.style.zIndex = 120;
  ov.innerHTML = `
    <div class="modal" style="max-height:92vh">
      <div class="mh" style="background:linear-gradient(135deg,#34495e,#5d6d7e)">
        <h3>📜 سجل الحركات — <span id="movSite"></span></h3>
        <button type="button" onclick="closeMovements()" style="background:none;border:none;color:#fff;font-size:18px;cursor:pointer">✕</button>
      </div>
      <div class="mb">
        <div class="mov-quick">
          <button type="button" onclick="movQuick(0,0)">اليوم</button>
          <button type="button" onclick="movQuick(-6,0)">7 أيام</button>
          <button type="button" onclick="movQuick(-29,0)">30 يوم</button>
          <button type="button" onclick="movQuick('month')">الشهر الحالي</button>
        </div>
        <div class="dlg-row">
          <div class="dlg-f"><label>من تاريخ</label><input type="date" id="movFrom"></div>
          <div class="dlg-f"><label>إلى تاريخ</label><input type="date" id="movTo"></div>
        </div>
        <div class="dlg-row">
          <div class="dlg-f"><label>نوع الحركة</label>
            <select id="movType"><option value="">الكل</option>${MOV_TYPES.map(t => `<option>${t}</option>`).join('')}</select></div>
          <div class="dlg-f"><label>بحث (حالة / مسعف / صنف)</label><input type="text" id="movQ" placeholder="اكتب للبحث"></div>
        </div>
        <div class="mov-btns">
          <button type="button" class="inv-exp-btn" style="background:#34495e;flex:1.4" onclick="loadMovements()">🔍 عرض</button>
          <button type="button" class="inv-exp-btn xl" onclick="exportMovementsExcel()">📊 Excel</button>
          <button type="button" class="inv-exp-btn pdf" onclick="exportMovementsPDF()">📄 PDF</button>
        </div>
        <div id="movSummary"></div>
        <div class="mov-tabs">
          <button type="button" data-tab="moves" class="on" onclick="setMovTab('moves')">الحركات</button>
          <button type="button" data-tab="cons" onclick="setMovTab('cons')">الاستهلاك</button>
        </div>
        <div id="movList"></div>
      </div>
    </div>`;
  document.body.appendChild(ov);
  ov.addEventListener('click', e => { if(e.target === ov) closeMovements(); });
  ov.querySelector('#movQ').addEventListener('keydown', e => { if(e.key === 'Enter') loadMovements(); });
  return ov;
}

function openMovements(){
  const ov = ensureMovOverlay();
  document.getElementById('movSite').textContent = siteLabel();
  if(!document.getElementById('movFrom').value) document.getElementById('movFrom').value = localDay(-29);
  if(!document.getElementById('movTo').value) document.getElementById('movTo').value = localDay(0);
  ov.classList.add('open');
  loadMovements();
}
function closeMovements(){
  const ov = document.getElementById('movOv');
  if(ov) ov.classList.remove('open');
}
function movQuick(a, b){
  if(a === 'month'){ const d = new Date(); a = 1 - d.getDate(); b = 0; }
  document.getElementById('movFrom').value = localDay(a);
  document.getElementById('movTo').value = localDay(b);
  loadMovements();
}
function setMovTab(t){
  movTab = t;
  document.querySelectorAll('#movOv .mov-tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === t));
  renderMovements();
}

async function loadMovements(){
  const list = document.getElementById('movList');
  document.getElementById('movSite').textContent = siteLabel();
  const from = document.getElementById('movFrom').value, to = document.getElementById('movTo').value;
  const type = document.getElementById('movType').value, q = document.getElementById('movQ').value.trim();
  if(from && to && from > to){ toast('⚠️ تاريخ "من" بعد تاريخ "إلى"', '#c0392b'); return; }
  list.innerHTML = '<div class="mv-empty">⏳ جاري التحميل...</div>';
  const reqSite = site;
  try {
    const url = `${MEDS_URL}?action=getMovements&site=${reqSite}&from=${from}&to=${to}&type=${encodeURIComponent(type)}&q=${encodeURIComponent(q)}`;
    const res = await fetch(url);
    const data = await res.json();
    if(reqSite !== site) return;
    if(data.result !== 'success'){ list.innerHTML = `<div class="mv-empty">❌ ${escapeInvHTML(data.message || 'تعذّر تحميل السجل')}</div>`; window._movData = null; return; }
    window._movData = { rows: data.rows || [], site: reqSite, siteName: siteLabel(), from, to, type, q, agg: aggregateMovements(data.rows || []) };
    renderMovements();
  } catch(e){
    list.innerHTML = '<div class="mv-empty">❌ تعذّر الاتصال بالسيرفر</div>';
    window._movData = null;
  }
}

function renderMovements(){
  const d = window._movData, list = document.getElementById('movList'), sum = document.getElementById('movSummary');
  if(!d){ return; }
  const t = d.agg.totals;
  sum.innerHTML = `
    <div class="mv-sum">
      <div><b>${t.count}</b><span>حركة</span></div>
      <div class="o"><b>${t.dispensed}</b><span>وحدة مصروفة</span></div>
      <div class="i"><b>${t.purchased}</b><span>وحدة مشتراة</span></div>
      <div><b>${t.cases}</b><span>حالة</span></div>
    </div>`;
  if(!d.rows.length){ list.innerHTML = '<div class="mv-empty">لا توجد حركات في هذه الفترة</div>'; return; }

  if(movTab === 'cons'){
    const it = d.agg.items, pm = d.agg.paramedics;
    list.innerHTML =
      `<div class="mv-h">استهلاك الأصناف</div>` +
      (it.length ? it.map(i => `
        <div class="mv-row"><div class="mv-top"><b class="mv-name">${escapeInvHTML(i.name)}</b>
          <span class="mv-q neg">${i.dispensed ? '−' + i.dispensed : '0'}</span></div>
          <div class="mv-sub">${i.cases ? 'في ' + i.cases + ' حالة' : ''}${i.purchased ? ' · اشتري ' + i.purchased : ''}${i.cost ? ' · تكلفة ' + i.cost : ''}</div></div>`).join('')
        : '<div class="mv-empty">لا يوجد صرف أو شراء</div>') +
      `<div class="mv-h">الصرف حسب المسعف</div>` +
      (pm.length ? pm.map(p => `
        <div class="mv-row"><div class="mv-top"><b class="mv-name">${escapeInvHTML(p.name)}</b>
          <span class="mv-q neg">−${p.dispensed}</span></div>
          <div class="mv-sub">${p.cases} حالة</div></div>`).join('') : '<div class="mv-empty">—</div>');
    return;
  }

  const shown = d.rows.slice(0, MOV_RENDER_LIMIT);
  list.innerHTML = shown.map(r => {
    const dl = movDelta(r);
    const sub = [r.date, r.after !== '' ? 'الرصيد بعد: ' + r.after : '',
      movIsCase(r) && r.caseName && r.caseName !== '-' ? 'حالة: ' + r.caseName : '',
      r.paramedic && r.paramedic !== '-' ? 'بواسطة: ' + r.paramedic : '',
      r.reportId && r.reportId !== '-' ? 'تقرير: ' + r.reportId : ''].filter(Boolean).map(x => '<bdi>' + escapeInvHTML(x) + '</bdi>').join(' · ');
    return `<div class="mv-row">
      <div class="mv-top"><span class="mv-badge t-${movTypeClass(r.type)}">${escapeInvHTML(r.type)}</span>
        <b class="mv-name">${escapeInvHTML(r.name)}</b>
        <span class="mv-q ${dl < 0 ? 'neg' : dl > 0 ? 'pos' : ''}">${dl > 0 ? '+' : dl < 0 ? '−' : ''}${Math.abs(dl) || ''}</span></div>
      <div class="mv-sub">${sub}</div>
      ${r.notes ? `<div class="mv-note">${escapeInvHTML(r.notes)}</div>` : ''}</div>`;
  }).join('') + (d.rows.length > shown.length ? `<div class="mv-empty">عرض أول ${shown.length} من ${d.rows.length} — التصدير يشمل الكل</div>` : '');
}
