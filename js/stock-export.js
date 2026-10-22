// ====== تصدير رصيد المخزون (Excel + PDF) — للمشرف ======
// الاعتماد على: window._invItems (بيتحدّث من renderInventory)، WECARE_LOGO (logo.js)، escapeInvHTML (inventory.js)

const STOCK_NAVY = '#0B2545';

// حالة الصنف: نفد / منخفض / كافٍ
function stockStatus(it){
  const q = Number(it.qty), m = Number(it.minQty);
  if(!(q > 0)) return 'نفد';
  if(q <= m) return 'منخفض';
  return 'كافٍ';
}

// البيانات المراد تصديرها حسب الموقع الحالي + اختيار (كل الأصناف / النواقص فقط)
function getStockExportData(){
  const all = (window._invItems || []).map(it => ({ ...it, status: stockStatus(it) }));
  const scopeEl = document.getElementById('invExportScope');
  const scope = scopeEl ? scopeEl.value : 'all';
  const items = scope === 'low' ? all.filter(i => i.status !== 'كافٍ') : all;
  const count = s => all.filter(i => i.status === s).length;
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  return {
    items, scope,
    siteName: site === 'taj' ? 'تاج' : 'سراي',
    dateStr: `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`,
    timeStr: `${pad(now.getHours())}:${pad(now.getMinutes())}`,
    stats: { total: all.length, ok: count('كافٍ'), low: count('منخفض'), out: count('نفد') },
    hasExpiry: all.some(i => i.expiry),
    hasPrice: all.some(i => i.price !== undefined && i.price !== null && i.price !== '')
  };
}

function stockTitle(d){
  return 'كشف رصيد المخزون والصيدلية' + (d.scope === 'low' ? ' — النواقص فقط' : '');
}

// ---------- مكوّنات مشتركة لطباعة PDF بهوية WeCare (تُستخدم هنا وفي movements-export.js) ----------
function brandPrintCSS(){
  return `@page{size:A4;margin:10mm}
*{box-sizing:border-box}
html,body{-webkit-print-color-adjust:exact;print-color-adjust:exact}
body{font-family:'Segoe UI',Tahoma,Arial,sans-serif;direction:rtl;color:#1E2430;background:#f7f4ee;margin:0;padding:22px 24px;position:relative}
.wm{position:fixed;inset:0;z-index:0;pointer-events:none;
  background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='260' height='170'><text x='6' y='115' font-family='Arial' font-weight='bold' font-size='30' fill='%230B2545' fill-opacity='0.075' transform='rotate(-28 130 85)'>WeCare</text></svg>");
  background-repeat:repeat}
.page{position:relative;z-index:1}
.hd{display:flex;align-items:center;gap:14px;padding-bottom:14px;border-bottom:3px solid ${STOCK_NAVY};margin-bottom:16px}
.logo{width:58px;height:58px;border-radius:10px;overflow:hidden;background:#fff;flex-shrink:0;display:flex;align-items:center;justify-content:center}
.logo img{width:100%;height:100%;object-fit:cover}
.brand{font-weight:800;color:${STOCK_NAVY};font-size:20px}
.dept{font-size:11px;color:#6B7280;margin-top:2px}
.meta{margin-inline-start:auto;font-size:12px;line-height:1.8;color:#1E2430}
.meta b.t{font-size:14px;color:${STOCK_NAVY}}
table{width:100%;border-collapse:collapse;font-size:12px}
thead{display:table-header-group}
th{background:${STOCK_NAVY};color:#fff;padding:9px 8px;text-align:right;font-weight:700;white-space:nowrap}
th.c,td.c{text-align:center}
td{padding:6px 8px;border-bottom:1px solid #e6e1d6}
td.c{white-space:nowrap}
.dt{direction:ltr;unicode-bidi:isolate;white-space:nowrap;display:inline-block}
tbody tr:nth-child(even) td{background:rgba(255,255,255,.55)}
tr{page-break-inside:avoid}
tr.cat td{background:#e4ecf5 !important;color:${STOCK_NAVY};font-weight:800;font-size:12.5px;border-bottom:1px solid #c9d6e6}
td.nm{font-weight:700;direction:ltr;text-align:right;unicode-bidi:plaintext}
td.q{font-weight:800;font-size:13px}
td.q.ok{color:#1b6b3a} td.q.low{color:#c0392b} td.q.out{color:#8e1b12}
.bd{display:inline-block;padding:2px 10px;border-radius:12px;font-size:11px;font-weight:700}
.bd.ok{background:#e3f4ea;color:#1b6b3a} .bd.low{background:#fde8e6;color:#c0392b} .bd.out{background:#f6cfcb;color:#8e1b12}
.sum{margin-top:16px;background:#dcefe9;border-radius:10px;padding:12px 16px;display:flex;justify-content:space-between;gap:10px;font-weight:700;font-size:13px;color:#1b5e50;page-break-inside:avoid}
.ft{text-align:center;margin-top:22px;font-size:12px;color:#6B7280}
.ft .tag{font-weight:800;color:${STOCK_NAVY};font-size:13px;margin-top:3px}`;
}

function brandPrintHeader(title, metaLines){
  const logo = (typeof WECARE_LOGO !== 'undefined') ? WECARE_LOGO : '';
  return `<div class="hd">
    <div class="logo">${logo ? `<img src="${logo}" onerror="this.parentNode.style.display='none'">` : ''}</div>
    <div>
      <div class="brand">WeCare</div>
      <div class="dept">قسم الطوارئ والرعاية الحرجة – Emergency &amp; Critical Care Department</div>
    </div>
    <div class="meta">
      <div><b class="t">${escapeInvHTML(title)}</b></div>
      ${(metaLines || []).map(l => `<div>${l}</div>`).join('')}
    </div>
  </div>`;
}

function openBrandedPrint(html){
  const win = window.open('', '_blank', 'width=1000,height=700');
  if(!win){ toast('⚠️ يرجى السماح بالنوافذ المنبثقة', '#c0392b'); return; }
  win.document.write(html);
  win.document.close();
}

// ---------- PDF (نافذة طباعة بنفس ستايل كشف المرتبات) ----------
function buildStockPrintHTML(d){
  const logo = (typeof WECARE_LOGO !== 'undefined') ? WECARE_LOGO : '';
  const cols = 6 + (d.hasExpiry ? 1 : 0) + (d.hasPrice ? 1 : 0);
  let rows = '', n = 0, lastCat = null;
  d.items.forEach(it => {
    if(it.category !== lastCat){
      lastCat = it.category;
      rows += `<tr class="cat"><td colspan="${cols}">${escapeInvHTML(it.category || 'بدون تصنيف')}</td></tr>`;
    }
    n++;
    const cls = it.status === 'كافٍ' ? 'ok' : it.status === 'منخفض' ? 'low' : 'out';
    rows += `<tr>
      <td class="c">${n}</td>
      <td class="nm">${escapeInvHTML(it.name)}</td>
      <td>${escapeInvHTML(it.unit || '')}</td>
      <td class="c q ${cls}">${escapeInvHTML(it.qty)}</td>
      <td class="c">${escapeInvHTML(it.minQty)}</td>
      <td class="c"><span class="bd ${cls}">${it.status}</span></td>
      ${d.hasExpiry ? `<td class="c">${escapeInvHTML(it.expiry || '-')}</td>` : ''}
      ${d.hasPrice ? `<td class="c">${escapeInvHTML(it.price === undefined || it.price === null ? '-' : it.price)}</td>` : ''}
    </tr>`;
  });
  if(!rows) rows = `<tr><td colspan="${cols}" class="c" style="padding:22px">لا توجد أصناف</td></tr>`;

  return `<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8">
<title>${escapeInvHTML(stockTitle(d))} — ${d.siteName}</title>
<style>
${brandPrintCSS()}
</style></head><body>
<div class="wm"></div>
<div class="page">
  ${brandPrintHeader(stockTitle(d), ['الموقع: ' + d.siteName, 'التاريخ: <span class="dt">' + d.dateStr + ' ' + d.timeStr + '</span>'])}
  <table>
    <thead><tr>
      <th class="c" style="width:34px">#</th><th>الصنف</th><th>الوحدة</th>
      <th class="c">الرصيد</th><th class="c">الحد الأدنى</th><th class="c">الحالة</th>
      ${d.hasExpiry ? '<th class="c">الصلاحية</th>' : ''}${d.hasPrice ? '<th class="c">السعر</th>' : ''}
    </tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="sum">
    <span>عدد الأصناف: ${d.stats.total}</span>
    <span>كافٍ: ${d.stats.ok}</span>
    <span>منخفض: ${d.stats.low}</span>
    <span>نفد: ${d.stats.out}</span>
  </div>
  <div class="ft"><div>Emergency and Critical Care Department</div><div class="tag">WeCare Company</div></div>
</div>
<script>window.onload=function(){ setTimeout(function(){ window.print(); }, 300); }<\/script>
</body></html>`;
}

function exportStockPDF(){
  const d = getStockExportData();
  if(!d.stats.total){ toast('⚠️ افتح المخزون وانتظر التحميل أولاً', '#c0392b'); return; }
  openBrandedPrint(buildStockPrintHTML(d));
}

// ---------- Excel (ExcelJS: تنسيق + لوجو + علامة مائية كخلفية) ----------
function ensureExcelJS(){
  if(window.ExcelJS) return Promise.resolve();
  const urls = [
    'https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.4.0/exceljs.min.js',
    'https://cdn.jsdelivr.net/npm/exceljs@4.4.0/dist/exceljs.min.js'
  ];
  const load = i => new Promise((resolve, reject) => {
    if(i >= urls.length) return reject(new Error('exceljs load failed'));
    const s = document.createElement('script');
    s.src = urls[i];
    s.onload = () => window.ExcelJS ? resolve() : load(i + 1).then(resolve, reject);
    s.onerror = () => load(i + 1).then(resolve, reject);
    document.head.appendChild(s);
  });
  return load(0);
}

// الشعار → PNG سليم عبر canvas (علشان إكسل ما يطلبش "إصلاح الملف" لو الصورة الأصلية ناقصة)
function stockLogoPNG(){
  return new Promise(resolve => {
    if(typeof WECARE_LOGO === 'undefined' || !WECARE_LOGO) return resolve(null);
    const img = new Image();
    img.onload = () => {
      try {
        const k = Math.min(1, 200 / Math.max(img.naturalWidth, img.naturalHeight, 1));
        const c = document.createElement('canvas');
        c.width = Math.max(1, Math.round(img.naturalWidth * k));
        c.height = Math.max(1, Math.round(img.naturalHeight * k));
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL('image/png'));
      } catch(e){ resolve(null); }
    };
    img.onerror = () => resolve(null);
    img.src = WECARE_LOGO;
  });
}

// بلاطة العلامة المائية (WeCare بزاوية) كصورة PNG
function stockWatermarkPNG(){
  try {
    const c = document.createElement('canvas');
    c.width = 260; c.height = 170;
    const ctx = c.getContext('2d');
    ctx.translate(130, 85); ctx.rotate(-28 * Math.PI / 180);
    ctx.font = 'bold 30px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(11,37,69,0.075)';
    ctx.fillText('WeCare', 0, 0);
    return c.toDataURL('image/png');
  } catch(e){ return null; }
}

function stripDataURL(u){ return u.replace(/^data:image\/[a-z+]+;base64,/, ''); }

async function buildStockWorkbook(d, logoPng, wmPng){
  const wb = new ExcelJS.Workbook();
  wb.creator = 'WeCare';
  wb.created = new Date();
  const ws = wb.addWorksheet('رصيد مخزن ' + d.siteName, {
    views: [{ rightToLeft: true, state: 'frozen', ySplit: 6 }],
    pageSetup: { paperSize: 9, orientation: 'portrait', fitToPage: true, fitToWidth: 1, fitToHeight: 0,
                 margins: { left: .4, right: .4, top: .5, bottom: .6, header: .3, footer: .3 },
                 printTitlesRow: '6:6' },
    headerFooter: { oddFooter: '&CWeCare Company — Emergency and Critical Care Department&R&P / &N' }
  });

  const cols = [
    { h: '#', w: 9 }, { h: 'الصنف', w: 46 }, { h: 'التصنيف', w: 26 }, { h: 'الوحدة', w: 24 },
    { h: 'الرصيد', w: 11 }, { h: 'الحد الأدنى', w: 13 }, { h: 'الحالة', w: 12 }
  ];
  if(d.hasExpiry) cols.push({ h: 'الصلاحية', w: 14 });
  if(d.hasPrice) cols.push({ h: 'السعر', w: 12 });
  const lastCol = cols.length;
  ws.columns = cols.map(c => ({ width: c.w }));
  const FONT = 'Segoe UI';
  const border = { style: 'thin', color: { argb: 'FFD9D4C7' } };
  const allBorders = { top: border, bottom: border, left: border, right: border };

  // رأس الصفحة: لوجو + اسم الشركة + عنوان الكشف
  ws.getRow(1).height = 26; ws.getRow(2).height = 20; ws.getRow(3).height = 20;
  ws.mergeCells(1, 2, 1, lastCol); ws.mergeCells(2, 2, 2, lastCol); ws.mergeCells(3, 2, 3, lastCol);
  const c1 = ws.getCell(1, 2); c1.value = 'WeCare';
  c1.font = { name: FONT, size: 18, bold: true, color: { argb: 'FF0B2545' } };
  const c2 = ws.getCell(2, 2); c2.value = 'قسم الطوارئ والرعاية الحرجة – Emergency & Critical Care Department';
  c2.font = { name: FONT, size: 10, color: { argb: 'FF6B7280' } };
  const c3 = ws.getCell(3, 2);
  c3.value = `${stockTitle(d)} — ${d.siteName} — ${d.dateStr}`;
  c3.font = { name: FONT, size: 11, bold: true, color: { argb: 'FF0B2545' } };
  [c1, c2, c3].forEach(c => c.alignment = { horizontal: 'right', vertical: 'middle' });
  if(logoPng){
    const id = wb.addImage({ base64: stripDataURL(logoPng), extension: 'png' });
    ws.addImage(id, { tl: { col: 0.08, row: 0.1 }, ext: { width: 58, height: 58 } });
  }
  // شريط كحلي رفيع تحت الرأس
  ws.getRow(4).height = 5;
  for(let c = 1; c <= lastCol; c++) ws.getCell(4, c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0B2545' } };
  ws.getRow(5).height = 8;

  // رأس الجدول (صف 6)
  const hr = ws.getRow(6); hr.height = 24;
  cols.forEach((c, i) => {
    const cell = hr.getCell(i + 1);
    cell.value = c.h;
    cell.font = { name: FONT, size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0B2545' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = allBorders;
  });

  // الصفوف
  const STAT = {
    'كافٍ':  { fill: 'FFE3F4EA', font: 'FF1B6B3A' },
    'منخفض': { fill: 'FFFDE8E6', font: 'FFC0392B' },
    'نفد':   { fill: 'FFF6CFCB', font: 'FF8E1B12' }
  };
  d.items.forEach((it, idx) => {
    const r = ws.getRow(7 + idx); r.height = 20;
    const vals = [idx + 1, it.name, it.category || '', it.unit || '', Number(it.qty), Number(it.minQty), it.status];
    if(d.hasExpiry) vals.push(it.expiry || '');
    if(d.hasPrice) vals.push(it.price === '' || it.price == null ? '' : Number(it.price));
    vals.forEach((v, i) => {
      const cell = r.getCell(i + 1);
      cell.value = v;
      cell.font = { name: FONT, size: 11 };
      cell.border = allBorders;
      cell.alignment = { vertical: 'middle', horizontal: (i === 1 || i === 2 || i === 3) ? 'right' : 'center', wrapText: i === 1 };
      if(idx % 2) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF7F4EE' } };
    });
    r.getCell(2).font = { name: FONT, size: 11, bold: true };
    const st = STAT[it.status];
    r.getCell(5).font = { name: FONT, size: 12, bold: true, color: { argb: st.font } };
    const sc = r.getCell(7);
    sc.font = { name: FONT, size: 11, bold: true, color: { argb: st.font } };
    sc.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: st.fill } };
  });

  const first = 7, last = 6 + d.items.length;
  if(d.items.length) ws.autoFilter = { from: { row: 6, column: 1 }, to: { row: last, column: lastCol } };

  // شريط الملخص (أرقام حية بالمعادلات + النتيجة محسوبة مسبقًا)
  const sr = last + 2;
  ws.getRow(sr).height = 26;
  ws.mergeCells(sr, 1, sr, lastCol);
  const s = ws.getCell(sr, 1);
  const rng = `$G$${first}:$G$${Math.max(last, first)}`;
  const text = `عدد الأصناف: ${d.stats.total}    |    كافٍ: ${d.stats.ok}    |    منخفض: ${d.stats.low}    |    نفد: ${d.stats.out}`;
  s.value = d.items.length === d.stats.total
    ? { formula: `"عدد الأصناف: "&COUNTA($B$${first}:$B$${last})&"    |    كافٍ: "&COUNTIF(${rng},"كافٍ")&"    |    منخفض: "&COUNTIF(${rng},"منخفض")&"    |    نفد: "&COUNTIF(${rng},"نفد")`, result: text }
    : text;   // في وضع "النواقص فقط" الملخص يخص المخزن كله، فيفضل نص ثابت
  s.font = { name: FONT, size: 12, bold: true, color: { argb: 'FF1B5E50' } };
  s.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCEFE9' } };
  s.alignment = { horizontal: 'center', vertical: 'middle' };

  const fr = sr + 2;
  ws.mergeCells(fr, 1, fr, lastCol);
  const f = ws.getCell(fr, 1);
  f.value = 'Emergency and Critical Care Department — WeCare Company';
  f.font = { name: FONT, size: 10, bold: true, color: { argb: 'FF6B7280' } };
  f.alignment = { horizontal: 'center' };

  // العلامة المائية: صورة خلفية مكررة (تظهر على الشاشة في Excel، ولا تُطبع — قيد في Excel نفسه)
  if(wmPng){
    const wid = wb.addImage({ base64: stripDataURL(wmPng), extension: 'png' });
    ws.addBackgroundImage(wid);
  }
  return wb;
}

async function exportStockExcel(){
  const d = getStockExportData();
  if(!d.stats.total){ toast('⚠️ افتح المخزون وانتظر التحميل أولاً', '#c0392b'); return; }
  toast('⏳ جاري تجهيز ملف Excel...', '#555');
  try {
    await ensureExcelJS();
    const [logoPng] = await Promise.all([stockLogoPNG()]);
    const wb = await buildStockWorkbook(d, logoPng, stockWatermarkPNG());
    const buf = await wb.xlsx.writeBuffer();
    const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `مخزن_${d.siteName}_${d.dateStr}${d.scope === 'low' ? '_نواقص' : ''}.xlsx`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    toast('✅ تم تجهيز ملف Excel');
  } catch(e){
    console.warn('Stock Excel export failed', e);
    toast('❌ تعذّر إنشاء ملف Excel — تأكد من الاتصال بالإنترنت', '#c0392b');
  }
}
