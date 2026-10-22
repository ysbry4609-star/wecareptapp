// ====== init ======
const APP_VERSION = 'version 1.6'; 
const STORAGE_KEY = 'wecare_medical_report_draft_v2';
let site = 'taj';
let currentReportId = '';
// رابطين منفصلين (Google Apps Script):
// 1) التقارير والحالات (حفظ التقرير، البحث، الإحصائيات، سجل الدخول)
const REPORTS_URL = 'https://script.google.com/macros/s/AKfycbxTHJowoY7X2LYhsbe52UppJu1k_AAvER3aW9Mt9GKSR2WZn6pXuilfPZBJWsdlvFvK/exec';
// 2) الأدوية والمخزون (المخزون، صرف/شراء)
const MEDS_URL = 'https://script.google.com/macros/s/AKfycbwkEb3hm-puMMmeS3kTa-cyFWJSLesgZ2_Pk4lxAotwRyFG46E0ZB5NgfEyfQDw3J7D/exec';
const EXPORT_ACCESS_KEY = '1253';
const PENDING_KEY = 'wecarePendingReports';
const TOP_MEDS_KEY = 'wecare_top_meds';
const TOP_MEDS_LIMIT = 10;

