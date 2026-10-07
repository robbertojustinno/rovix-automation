const CONFIG = window.ROVIX_HUB_CONFIG;
function getToken() { return localStorage.getItem(CONFIG.STORAGE_KEYS.authToken); }
function clearSession() { localStorage.removeItem(CONFIG.STORAGE_KEYS.authToken); localStorage.removeItem(CONFIG.STORAGE_KEYS.authUser); }
function showLogin() {
  document.getElementById("visitMetrics").classList.add("hidden");
  document.getElementById("recentVisits").replaceChildren();
  location.replace("/intranet/");
}
async function loadVisitMetrics() {
  const panel = document.getElementById("visitMetrics");
  const error = document.getElementById("metricsError");
  const refresh = document.getElementById("refreshMetrics");
  const token = getToken();
  error.classList.add("hidden");
  refresh.disabled = true;
  try {
    const response = await fetch(`${CONFIG.API_BASE_URL}/rovix-metrics/summary`, {
      headers: {Authorization: `Bearer ${token}`}, cache: "no-store", signal: AbortSignal.timeout(60000)
    });
    if (token !== getToken()) { showLogin(); return; }
    if (response.status === 401 || response.status === 403) {
      clearSession(); showLogin("Entre novamente para consultar as métricas privadas."); return;
    }
    if (!response.ok) throw new Error("Métricas indisponíveis. Tente novamente em alguns instantes.");
    const data = await response.json();
    const number = new Intl.NumberFormat("pt-BR");
    for (const [id, key] of [["visitsDaily", "daily"], ["visitsWeekly", "weekly"], ["visitsMonthly", "monthly"]]) {
      document.getElementById(id).textContent = number.format(data[key]);
    }
    document.getElementById("uniqueIpsToday").textContent = number.format(data.unique_ips_today || 0);
    const body = document.getElementById("recentVisits");
    body.replaceChildren();
    for (const visit of data.recent || []) {
      const row = document.createElement("tr");
      const values = [new Date(visit.visited_at).toLocaleString("pt-BR", {timeZone: "America/Sao_Paulo"}), visit.ip, visit.device, `${visit.browser} / ${visit.system}`, visit.referrer || "Direta / não informada", [visit.language, visit.screen, visit.timezone].filter(Boolean).join(" / ")];
      for (const value of values) { const cell = document.createElement("td"); cell.textContent = value; row.appendChild(cell); }
      body.appendChild(row);
    }
    if (!body.children.length) { const row = body.insertRow(); const cell = row.insertCell(); cell.colSpan = 6; cell.textContent = "Os detalhes aparecem a partir das próximas visitas."; }
    document.getElementById("metricsStatus").textContent = "Atualizado às " + new Date(data.updated_at).toLocaleTimeString("pt-BR", {timeZone: "America/Sao_Paulo"});
    panel.classList.remove("hidden");
  } catch (e) {
    if (token !== getToken()) { showLogin(); return; }
    panel.classList.add("hidden");
    error.textContent = "Não foi possível consultar as métricas. Clique em Atualizar para tentar novamente.";
    error.classList.remove("hidden");
  } finally { refresh.disabled = false; }
}
document.getElementById("refreshMetrics").addEventListener("click", loadVisitMetrics);

document.getElementById("metricsLogout").addEventListener("click", () => { clearSession(); showLogin(); });
window.addEventListener("storage", event => { if (event.key === CONFIG.STORAGE_KEYS.authToken) { if (!getToken()) showLogin(); else loadVisitMetrics(); } });
if (getToken()) loadVisitMetrics(); else showLogin();
