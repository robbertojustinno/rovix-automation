(() => {
  if (location.pathname !== '/' || !['rovixautomation.com.br', 'www.rovixautomation.com.br', 'rovix-automation.onrender.com'].includes(location.hostname)) return;
  const key = 'rovix_home_visit_v1';
  const now = Date.now();
  let visit;
  try {
    visit = JSON.parse(localStorage.getItem(key) || 'null');
    if (visit && now - visit.created < 30 * 60 * 1000 && visit.sent) return;
  } catch { visit = null; }
  if (!visit || now - visit.created >= 30 * 60 * 1000) visit = {id: crypto.randomUUID(), created: now, sent: false};
  try { localStorage.setItem(key, JSON.stringify(visit)); } catch {}
  fetch('https://tag-1-xfzk.onrender.com/rovix-metrics/visit', {
    method: 'POST', headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({visit_id: visit.id, referrer: document.referrer.slice(0,2048), language: navigator.language.slice(0,40), screen: `${screen.width}×${screen.height}`.slice(0,40), timezone: Intl.DateTimeFormat().resolvedOptions().timeZone.slice(0,100)}), keepalive: true
  }).then(response => {
    if (response.ok) {
      visit.sent = true;
      try { localStorage.setItem(key, JSON.stringify(visit)); } catch {}
    }
  }).catch(() => {});
})();
