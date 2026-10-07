const CONFIG = window.ROVIX_HUB_CONFIG;
let ipRows = [];
function getToken() { return localStorage.getItem(CONFIG.STORAGE_KEYS.authToken); }
function clearSession() { localStorage.removeItem(CONFIG.STORAGE_KEYS.authToken); localStorage.removeItem(CONFIG.STORAGE_KEYS.authUser); }
function showLogin() {
  document.getElementById("visitMetrics").classList.add("hidden");
  document.getElementById("recentVisits").replaceChildren();
  document.getElementById("ipCounts").replaceChildren();
  ipRows = [];
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
    ipRows = data.ip_counts || [];
    renderIpCounts();
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

function formatTime(value) {
  return new Date(value).toLocaleString("pt-BR", {timeZone: "America/Sao_Paulo"});
}
function showOsint(cell, info) {
  cell.replaceChildren();
  const details = document.createElement("p");
  details.textContent = [info.company && "Organização: " + info.company, info.asn && "ASN: " + info.asn, [info.city, info.region, info.country].filter(Boolean).join(" / "), info.timezone && "Fuso: " + info.timezone].filter(Boolean).join(" • ") || "Sem dados públicos para este IP.";
  cell.appendChild(details);
  const note = document.createElement("small");
  note.textContent = "Fonte: ipapi.is • Consultado em " + formatTime(info.fetched_at) + " • Localização aproximada";
  cell.appendChild(note);
}
function renderIpCounts() {
  const body = document.getElementById("ipCounts");
  body.replaceChildren();
  const query = document.getElementById("ipSearch").value.trim().toLowerCase();
  const rows = ipRows.filter(row => row.ip.toLowerCase().includes(query));
  document.getElementById("ipCountStatus").textContent = rows.length + " IPs exibidos" + (ipRows.length === 500 ? " (limite de 500 IPs mais frequentes)" : "");
  for (const item of rows) {
    const row = body.insertRow();
    for (const value of [item.ip, item.daily, item.weekly, item.monthly, item.total, formatTime(item.first_seen) + " / " + formatTime(item.last_seen)]) {
      row.insertCell().textContent = String(value);
    }
    const cell = row.insertCell();
    if (item.osint) { showOsint(cell, item.osint); continue; }
    const button = document.createElement("button");
    button.type = "button"; button.className = "outline-button"; button.textContent = "Consultar OSINT";
    cell.appendChild(button);
    button.addEventListener("click", async () => {
      const token = getToken();
      button.disabled = true; button.textContent = "Consultando…";
      try {
        const response = await fetch(CONFIG.API_BASE_URL + "/rovix-metrics/ip-osint?ip=" + encodeURIComponent(item.ip), {
          headers: {Authorization: "Bearer " + token}, cache: "no-store", signal: AbortSignal.timeout(15000)
        });
        if (token !== getToken()) { showLogin(); return; }
        if (response.status === 401 || response.status === 403) { clearSession(); showLogin(); return; }
        const data = await response.json();
        if (!response.ok) throw new Error(typeof data.detail === "string" ? data.detail : "Consulta indisponível.");
        item.osint = data; showOsint(cell, data);
      } catch (error) {
        if (token !== getToken()) { showLogin(); return; }
        button.textContent = "Consultar OSINT"; button.disabled = false;
        let message = cell.querySelector("small");
        if (!message) { message = document.createElement("small"); message.setAttribute("role", "status"); cell.appendChild(message); }
        message.textContent = error.message;
      }
    });
  }
  if (!rows.length) { const cell = body.insertRow().insertCell(); cell.colSpan = 7; cell.textContent = query ? "Nenhum IP corresponde ao filtro." : "Aguardando visitas com IP registrado."; }
}
document.getElementById("ipSearch").addEventListener("input", renderIpCounts);
