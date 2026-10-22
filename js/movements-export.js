// ====== تصدير سجل الحركات (Excel + PDF) بهوية WeCare ======
// الاعتماد على: window._movData و aggregateMovements و movDelta (movements.js)
// ومكوّنات stock-export.js: ensureExcelJS, stockLogoPNG, stockWatermarkPNG, stripDataURL, brandPrint*, openBrandedPrint

function movTitle(d){ return 'سجل حركات المخزون'; }
function movPeriod(d){
  return (d.from || d.to) ? `${d.from || '...'} ← ${d.to || '...'}` : 'كل الفترات';
}
function movFileStem(d){ return `حركات_${d.siteName}_${d.from || 'البداية'}_${d.to || 'اليوم'}${d.type ? '_' + d.type : ''}`.replace(/\s+/g, '_'); }
const fmtNum = n => (Math.round(Number(n) * 100) / 100).toString();

// ---------- PDF ----------
function buildMovementsPrintHTML(d){
  const agg = d.agg, t = agg.totals;
  const now = new Date(), p = n => String(n).padStart(2, '0');
  const stamp = `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())} ${p(now.getHours())}:${p(now.getMinutes())}`;

  const consRows = agg.items.map((i, k) => `<tr>
      <td class="c">${k + 1}</td><td class="nm">${escapeInvHTML(i.name)}</td>
      <td class="c"><b style="color:#c0392b">${i.dispensed || 0}</b></td><td class="c">${i.cases || 0}</td>
      <td class="c">${i.purchased || 0}</td><td class="c">${i.cost ? fmtNum(i.cost) : '-'}</td></tr>`).join('');

  const rows = d.rows.map((r, k) => {
    const dl = movDelta(r);
    return `<tr>
      <td class="c">${k + 1}</td>
      <td class="c"><span class="dt">${escapeInvHTML(r.date)}</span></td>
      <td class="c"><span class="bd t-${movTypeClass(r.type)}">${escapeInvHTML(r.type)}</span></td>
      <td class="nm">${escapeInvHTML(r.name)}</td>
      <td class="c q ${dl < 0 ? 'low' : dl > 0 ? 'ok' : ''}">${dl > 0 ? '+' : dl < 0 ? '−' : ''}${Math.abs(dl) || '-'}</td>
      <td class="c">${r.after === '' ? '-' : escapeInvHTML(r.after)}</td>
      <td>${escapeInvHTML(r.caseName && r.caseName !== '-' ? r.caseName : '')}</td>
      <td>${escapeInvHTML(r.paramedic && r.paramedic !== '-' ? r.paramedic : '')}</td>
      <td class="c">${escapeInvHTML(r.reportId && r.reportId !== '-' ? r.reportId : '')}</td>
      <td class="nt">${escapeInvHTML(r.notes || '')}</td></tr>`;
  }).join('');

  return `<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8">
<title>${movTitle(d)} — ${d.siteName}</title>
<style>
${brandPrintCSS()}
@page{size:A4 landscape;margin:9mm}
.t-out{background:#fde8e6;color:#c0392b} .t-in{background:#e3f4ea;color:#1b6b3a}
.t-fix{background:#fff1d6;color:#9a6200} .t-oth{background:#e8edf3;color:#44546a}
.sec{font-weight:800;color:#0B2545;font-size:14px;margin:18px 0 8px}
td.nt{font-size:11px;color:#44546a;max-width:260px}
td.q{direction:ltr;unicode-bidi:isolate}
table{font-size:11.5px}
</style></head><body>
<div class="wm"></div>
<div class="page">
  ${brandPrintHeader(movTitle(d), ['الموقع: ' + d.siteName, 'الفترة: <span class="dt">' + movPeriod(d) + '</span>' + (d.type ? ' — النوع: ' + escapeInvHTML(d.type) : ''), 'استُخرج: <span class="dt">' + stamp + '</span>'])}
  <div class="sum" style="margin:0 0 6px">
    <span>عدد الحركات: ${t.count}</span><span>المصروف: ${t.dispensed}</span><span>المشترى: ${t.purchased}</span>
    ${t.cost ? `<span>تكلفة المشتريات: ${fmtNum(t.cost)}</span>` : ''}<span>عدد الحالات: ${t.cases}</span><span>تصحيحات الجرد: ${t.corrections}</span>
  </div>
  ${consRows ? `<div class="sec">ملخص الاستهلاك بالصنف</div>
  <table><thead><tr><th class="c" style="width:34px">#</th><th>الصنف</th><th class="c">المصروف</th><th class="c">عدد الحالات</th><th class="c">المشترى</th><th class="c">تكلفة المشتريات</th></tr></thead>
  <tbody>${consRows}</tbody></table>` : ''}
  <div class="sec">تفاصيل الحركات</div>
  <table><thead><tr><th class="c" style="width:30px">#</th><th class="c">التاريخ</th><th class="c">النوع</th><th>الصنف</th><th class="c">الكمية</th><th class="c">الرصيد بعد</th><th>الحالة</th><th>المسعف</th><th class="c">رقم التقرير</th><th>ملاحظات</th></tr></thead>
  <tbody>${rows || '<tr><td colspan="10" class="c" style="padding:22px">لا توجد حركات</td></tr>'}</tbody></table>
  <div class="ft"><div>Emergency and Critical Care Department</div><div class="tag">WeCare Company</div></div>
</div>
<script>window.onload=function(){ setTimeout(function(){ window.print(); }, 300); }<\/script>
</body></html>`;
}

function exportMovementsPDF(){
  const d = window._movData;
  if(!d){ toast('⚠️ اضغط "عرض" الأول', '#c0392b'); return; }
  if(!d.rows.length){ toast('⚠️ لا توجد حركات لتصديرها', '#c0392b'); return; }
  openBrandedPrint(buildMovementsPrintHTML(d));
}

// ---------- Excel ----------
const MX = { navy: 'FF0B2545', font: 'Segoe UI' };
const MX_TYPE = {
  'صرف':        { fill: 'FFFDE8E6', font: 'FFC0392B' },
  'شراء':       { fill: 'FFE3F4EA', font: 'FF1B6B3A' },
  'تصحيح جرد':  { fill: 'FFFFF1D6', font: 'FF9A6200' }
};
const MX_OTHER = { fill: 'FFE8EDF3', font: 'FF44546A' };

function mxFill(argb){ return { type: 'pattern', pattern: 'solid', fgColor: { argb } }; }
function mxBorders(){
  const b = { style: 'thin', color: { argb: 'FFD9D4C7' } };
  return { top: b, bottom: b, left: b, right: b };
}

// رأس الشيت: لوجو + WeCare + عنوان + شريط كحلي، وبيرجّع رقم صف رأس الجدول (6)
function mxSheetHeader(wb, ws, lastCol, title, logoPng){
  ws.getRow(1).height = 26; ws.getRow(2).height = 20; ws.getRow(3).height = 20;
  ws.mergeCells(1, 2, 1, lastCol); ws.mergeCells(2, 2, 2, lastCol); ws.mergeCells(3, 2, 3, lastCol);
  const c1 = ws.getCell(1, 2); c1.value = 'WeCare'; c1.font = { name: MX.font, size: 18, bold: true, color: { argb: MX.navy } };
  const c2 = ws.getCell(2, 2); c2.value = 'قسم الطوارئ والرعاية الحرجة – Emergency & Critical Care Department'; c2.font = { name: MX.font, size: 10, color: { argb: 'FF6B7280' } };
  const c3 = ws.getCell(3, 2); c3.value = title; c3.font = { name: MX.font, size: 11, bold: true, color: { argb: MX.navy } };
  [c1, c2, c3].forEach(c => c.alignment = { horizontal: 'right', vertical: 'middle' });
  if(logoPng){
    const id = wb.addImage({ base64: stripDataURL(logoPng), extension: 'png' });
    ws.addImage(id, { tl: { col: 0.08, row: 0.1 }, ext: { width: 58, height: 58 } });
  }
  ws.getRow(4).height = 5; ws.getRow(5).height = 8;
  for(let c = 1; c <= lastCol; c++) ws.getCell(4, c).fill = mxFill(MX.navy);
  return 6;
}

function mxTableHeader(ws, row, headers){
  const hr = ws.getRow(row); hr.height = 24;
  headers.forEach((h, i) => {
    const c = hr.getCell(i + 1);
    c.value = h; c.font = { name: MX.font, size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    c.fill = mxFill(MX.navy); c.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }; c.border = mxBorders();
  });
}

function mxNewSheet(wb, name, widths, wmPng){
  const ws = wb.addWorksheet(name, {
    views: [{ rightToLeft: true, state: 'frozen', ySplit: 6 }],
    pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0,
                 margins: { left: .4, right: .4, top: .5, bottom: .6, header: .3, footer: .3 }, printTitlesRow: '6:6' },
    headerFooter: { oddFooter: '&CWeCare Company — Emergency and Critical Care Department&R&P / &N' }
  });
  ws.columns = widths.map(w => ({ width: w }));
  if(wmPng){ const wid = wb.addImage({ base64: stripDataURL(wmPng), extension: 'png' }); ws.addBackgroundImage(wid); }
  return ws;
}

function mxBody(c, i, opts){
  c.font = { name: MX.font, size: 11 }; c.border = mxBorders();
  c.alignment = { vertical: 'middle', horizontal: (opts && opts.right) ? 'right' : 'center', wrapText: !!(opts && opts.wrap) };
}

async function buildMovementsWorkbook(d, logoPng, wmPng){
  const wb = new ExcelJS.Workbook(); wb.creator = 'WeCare'; wb.created = new Date();
  const t = d.agg.totals;
  const title = `${movTitle(d)} — ${d.siteName} — ${movPeriod(d)}${d.type ? ' — ' + d.type : ''}`;

  // ===== شيت 1: الحركات =====
  const heads = ['#', 'التاريخ', 'النوع', 'الصنف', 'الكمية', 'الرصيد قبل', 'الرصيد بعد', 'اسم الحالة', 'المسعف / المنفذ', 'رقم التقرير', 'سعر الوحدة', 'الإجمالي', 'ملاحظات'];
  const ws = mxNewSheet(wb, 'الحركات', [6, 17, 13, 38, 10, 11, 11, 24, 20, 20, 11, 11, 48], wmPng);
  const hr = mxSheetHeader(wb, ws, heads.length, title, logoPng);
  mxTableHeader(ws, hr, heads);
  d.rows.forEach((r, i) => {
    const row = ws.getRow(hr + 1 + i); row.height = 20;
    const dl = movDelta(r);
    const vals = [i + 1, r.date, r.type, r.name, dl, r.before === '' ? '' : Number(r.before), r.after === '' ? '' : Number(r.after),
      r.caseName && r.caseName !== '-' ? r.caseName : '', r.paramedic && r.paramedic !== '-' ? r.paramedic : (r.by || ''),
      r.reportId && r.reportId !== '-' ? r.reportId : '', r.price === '' ? '' : Number(r.price), r.total === '' ? '' : Number(r.total), r.notes || ''];
    vals.forEach((v, k) => {
      const c = row.getCell(k + 1); c.value = v;
      mxBody(c, k, { right: k === 3 || k === 7 || k === 8 || k === 12, wrap: k === 3 || k === 12 });
      if(i % 2) c.fill = mxFill('FFF7F4EE');
    });
    row.getCell(4).font = { name: MX.font, size: 11, bold: true };
    const ts = MX_TYPE[r.type] || MX_OTHER, tc = row.getCell(3);
    tc.fill = mxFill(ts.fill); tc.font = { name: MX.font, size: 11, bold: true, color: { argb: ts.font } };
    const qc = row.getCell(5);
    qc.font = { name: MX.font, size: 12, bold: true, color: { argb: dl < 0 ? 'FFC0392B' : dl > 0 ? 'FF1B6B3A' : 'FF6B7280' } };
    qc.numFmt = '+0.##;-0.##;0';
  });
  const first = hr + 1, last = hr + d.rows.length;
  if(d.rows.length){
    ws.autoFilter = { from: { row: hr, column: 1 }, to: { row: last, column: heads.length } };
    const sr = last + 2; ws.getRow(sr).height = 26; ws.mergeCells(sr, 1, sr, heads.length);
    const s = ws.getCell(sr, 1);
    const C = `$C$${first}:$C$${last}`, E = `$E$${first}:$E$${last}`, L = `$L$${first}:$L$${last}`;
    const txt = `عدد الحركات: ${t.count}    |    المصروف: ${t.dispensed}    |    المشترى: ${t.purchased}    |    تكلفة المشتريات: ${fmtNum(t.cost)}    |    تصحيحات الجرد: ${t.corrections}`;
    s.value = {
      formula: `"عدد الحركات: "&COUNTA($C$${first}:$C$${last})&"    |    المصروف: "&(-SUMIF(${C},"صرف",${E}))&"    |    المشترى: "&SUMIF(${C},"شراء",${E})&"    |    تكلفة المشتريات: "&SUMIF(${C},"شراء",${L})&"    |    تصحيحات الجرد: "&COUNTIF(${C},"تصحيح جرد")`,
      result: txt
    };
    s.font = { name: MX.font, size: 12, bold: true, color: { argb: 'FF1B5E50' } };
    s.fill = mxFill('FFDCEFE9'); s.alignment = { horizontal: 'center', vertical: 'middle' };
    const fr = sr + 2; ws.mergeCells(fr, 1, fr, heads.length);
    const f = ws.getCell(fr, 1); f.value = 'Emergency and Critical Care Department — WeCare Company';
    f.font = { name: MX.font, size: 10, bold: true, color: { argb: 'FF6B7280' } }; f.alignment = { horizontal: 'center' };
  }

  // ===== شيت 2: ملخص الاستهلاك بالصنف =====
  if(d.agg.items.length){
    const h2 = ['#', 'الصنف', 'المصروف', 'عدد الحالات', 'المشترى', 'تكلفة المشتريات'];
    const w2 = mxNewSheet(wb, 'ملخص الاستهلاك', [6, 42, 13, 14, 13, 17], wmPng);
    const r0 = mxSheetHeader(wb, w2, h2.length, `ملخص الاستهلاك — ${d.siteName} — ${movPeriod(d)}`, logoPng);
    mxTableHeader(w2, r0, h2);
    d.agg.items.forEach((it, i) => {
      const row = w2.getRow(r0 + 1 + i); row.height = 20;
      [i + 1, it.name, it.dispensed, it.cases, it.purchased, it.cost || ''].forEach((v, k) => {
        const c = row.getCell(k + 1); c.value = v; mxBody(c, k, { right: k === 1 });
        if(i % 2) c.fill = mxFill('FFF7F4EE');
      });
      row.getCell(2).font = { name: MX.font, size: 11, bold: true };
      row.getCell(3).font = { name: MX.font, size: 12, bold: true, color: { argb: 'FFC0392B' } };
    });
    const a = r0 + 1, z = r0 + d.agg.items.length, tr = z + 1;
    const tot = w2.getRow(tr); tot.height = 24;
    tot.getCell(2).value = 'الإجمالي';
    tot.getCell(3).value = { formula: `SUM(C${a}:C${z})`, result: d.agg.items.reduce((s, i) => s + i.dispensed, 0) };
    tot.getCell(5).value = { formula: `SUM(E${a}:E${z})`, result: d.agg.items.reduce((s, i) => s + i.purchased, 0) };
    tot.getCell(6).value = { formula: `SUM(F${a}:F${z})`, result: d.agg.items.reduce((s, i) => s + i.cost, 0) };
    for(let k = 1; k <= h2.length; k++){
      const c = tot.getCell(k); c.fill = mxFill('FFDCEFE9'); c.border = mxBorders();
      c.font = { name: MX.font, size: 11, bold: true, color: { argb: 'FF1B5E50' } };
      c.alignment = { horizontal: k === 2 ? 'right' : 'center', vertical: 'middle' };
    }
    w2.autoFilter = { from: { row: r0, column: 1 }, to: { row: z, column: h2.length } };
  }

  // ===== شيت 3: حسب المسعف =====
  if(d.agg.paramedics.length){
    const h3 = ['#', 'المسعف', 'المصروف', 'عدد الحالات'];
    const w3 = mxNewSheet(wb, 'حسب المسعف', [6, 30, 13, 14], wmPng);
    const r0 = mxSheetHeader(wb, w3, h3.length, `الصرف حسب المسعف — ${d.siteName} — ${movPeriod(d)}`, logoPng);
    mxTableHeader(w3, r0, h3);
    d.agg.paramedics.forEach((m, i) => {
      const row = w3.getRow(r0 + 1 + i); row.height = 20;
      [i + 1, m.name, m.dispensed, m.cases].forEach((v, k) => {
        const c = row.getCell(k + 1); c.value = v; mxBody(c, k, { right: k === 1 });
        if(i % 2) c.fill = mxFill('FFF7F4EE');
      });
      row.getCell(2).font = { name: MX.font, size: 11, bold: true };
    });
  }
  return wb;
}

async function exportMovementsExcel(){
  const d = window._movData;
  if(!d){ toast('⚠️ اضغط "عرض" الأول', '#c0392b'); return; }
  if(!d.rows.length){ toast('⚠️ لا توجد حركات لتصديرها', '#c0392b'); return; }
  toast('⏳ جاري تجهيز ملف Excel...', '#555');
  try {
    await ensureExcelJS();
    const logoPng = await stockLogoPNG();
    const wb = await buildMovementsWorkbook(d, logoPng, stockWatermarkPNG());
    const buf = await wb.xlsx.writeBuffer();
    const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = movFileStem(d) + '.xlsx';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    toast('✅ تم تجهيز ملف Excel');
  } catch(e){
    console.warn('Movements Excel export failed', e);
    toast('❌ تعذّر إنشاء ملف Excel — تأكد من الاتصال بالإنترنت', '#c0392b');
  }
}
