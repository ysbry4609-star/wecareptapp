
// ====== تصدير PDF ======
function exportPDF(){
  if(!v('fn')){ toast('⚠️ أدخل اسم الحالة أولاً','#c0392b'); return; }
  const content = build();
  const win = window.open('', '_blank', 'width=800,height=600');
  if(!win){ toast('⚠️ يرجى السماح بالنوافذ المنبثقة','#c0392b'); return; }
  const siteName = site==='taj' ? 'موقع تاج' : 'موقع سراي';
  win.document.write(`
    <html dir="rtl">
    <head><title>تقرير WeCare — ${v('fn')}</title>
    <style>
      body{font-family:'Segoe UI',Tahoma,sans-serif;padding:26px;direction:rtl;position:relative;color:#1E2430}
      .p-watermark{position:fixed;inset:0;z-index:-1;pointer-events:none;
        background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='260' height='170'><text x='6' y='115' font-family='Arial' font-weight='bold' font-size='30' fill='%230B2545' fill-opacity='0.075' transform='rotate(-28 130 85)'>WeCare</text></svg>");
        background-repeat:repeat}
      .p-header{display:flex;align-items:center;gap:14px;border-bottom:3px solid #0B2545;padding-bottom:14px;margin-bottom:18px}
      .p-logo{width:56px;height:56px;border-radius:10px;overflow:hidden;flex-shrink:0}
      .p-logo img{width:100%;height:100%;object-fit:cover}
      .p-brand{font-weight:800;color:#0B2545;font-size:20px}
      .p-dept{font-size:11px;color:#6B7280}
      .p-meta{margin-inline-start:auto;text-align:left;font-size:12px;color:#1E2430}
      .report{white-space:pre-wrap;font-size:13.5px;line-height:2}
      .p-footer{text-align:center;margin-top:26px;font-size:12px;color:#6B7280}
      .p-footer .tag{font-weight:800;color:#0B2545;font-size:13px;margin-top:3px}
    </style>
    </head>
    <body>
      <div class="p-watermark"></div>
      <div class="p-header">
        <div class="p-logo"><img src="${WECARE_LOGO}"></div>
        <div>
          <div class="p-brand">WeCare</div>
          <div class="p-dept">تقرير تدخل طبي — ${siteName}</div>
        </div>
        <div class="p-meta"><div><b>التاريخ:</b> ${v('fd')||'-'}</div></div>
      </div>
      <div class="report">${content}</div>
      <div class="p-footer"><div>Emergency and Critical Care Department</div><div class="tag">WeCare Company</div></div>
      <script>window.onload = function(){ window.print(); }<\/script>
    </body>
    </html>
  `);
  win.document.close();
}

