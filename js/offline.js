// ====== وضع عدم الاتصال ======
function queuePendingReport(payload){
  const queue = JSON.parse(localStorage.getItem(PENDING_KEY) || '[]');
  queue.push(payload);
  localStorage.setItem(PENDING_KEY, JSON.stringify(queue));
  updatePendingBadge();
}
function updatePendingBadge(){
  const badge = document.getElementById('pendingBadge');
  const queue = JSON.parse(localStorage.getItem(PENDING_KEY) || '[]');
  if(queue.length > 0){
    badge.style.display = 'block';
    badge.textContent = `📴 ${queue.length} تقرير بانتظار الإرسال — اضغط للمحاولة`;
  } else {
    badge.style.display = 'none';
  }
}
async function flushPendingReports(){
  const queue = JSON.parse(localStorage.getItem(PENDING_KEY) || '[]');
  if(queue.length === 0) return;

  const results = await Promise.allSettled(
    queue.map(payload => fetch(REPORTS_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify(payload) }))
  );
  const remaining = queue.filter((_, i) => results[i].status === 'rejected');
  localStorage.setItem(PENDING_KEY, JSON.stringify(remaining));
  updatePendingBadge();

  const sentCount = queue.length - remaining.length;
  if(sentCount > 0) toast(`✅ تم إرسال ${sentCount} تقرير كان مؤجل`);
}
