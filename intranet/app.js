const CONFIG = window.ROVIX_HUB_CONFIG;

const loginScreen = document.getElementById("loginScreen");
const hubScreen = document.getElementById("hubScreen");
const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");
const logoutButton = document.getElementById("logoutButton");
const welcomeText = document.getElementById("welcomeText");
const systemsContainer = document.getElementById("systemsContainer");
const apiDot = document.getElementById("apiDot");
const apiStatusTitle = document.getElementById("apiStatusTitle");
const apiStatusText = document.getElementById("apiStatusText");

function getToken() {
  return localStorage.getItem(CONFIG.STORAGE_KEYS.authToken);
}

function getUser() {
  try {
    const raw = localStorage.getItem(CONFIG.STORAGE_KEYS.authUser);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveSession(data, username) {
  const token = data?.access_token || data?.token || data?.accessToken || data?.jwt;
  if (!token) throw new Error("Token não recebido pelo servidor.");

  localStorage.setItem(CONFIG.STORAGE_KEYS.authToken, token);
  localStorage.setItem(CONFIG.STORAGE_KEYS.authUser, JSON.stringify({
    username,
    name: data?.user?.name || data?.user?.username || username,
    savedAt: new Date().toISOString()
  }));
}

function clearSession() {
  localStorage.removeItem(CONFIG.STORAGE_KEYS.authToken);
  localStorage.removeItem(CONFIG.STORAGE_KEYS.authUser);
}

function showLogin(message = "") {
  loginScreen.classList.remove("hidden");
  hubScreen.classList.add("hidden");
  logoutButton.classList.add("hidden");
  loginMessage.textContent = message;
}

function showHub() {
  loginScreen.classList.add("hidden");
  hubScreen.classList.remove("hidden");
  logoutButton.classList.remove("hidden");

  const user = getUser();
  const name = user?.name || user?.username || "Roberto";
  welcomeText.textContent = `Bem-vindo, ${name}. Escolha abaixo qual sistema deseja acessar.`;

  renderSystems();
  checkApiHealth();
}

function renderSystems() {
  systemsContainer.innerHTML = "";

  CONFIG.SYSTEMS.forEach(group => {
    const title = document.createElement("div");
    title.className = "group-title";
    title.innerHTML = `<span>${group.icon}</span><h3>${group.group}</h3>`;
    systemsContainer.appendChild(title);

    const grid = document.createElement("div");
    grid.className = "system-grid";

    group.items.forEach(item => {
      const card = document.createElement("article");
      card.className = `system-card card ${item.disabled ? "disabled" : ""}`;

      card.innerHTML = `
        <header>
          <h4>${item.name}</h4>
          <span class="badge">${item.badge}</span>
        </header>
        <p>${item.description}</p>
        <a class="system-button" href="${item.disabled ? "#" : item.url}" target="_blank" rel="noopener">
          ${item.disabled ? "Em desenvolvimento" : "Abrir sistema"}
        </a>
      `;

      grid.appendChild(card);
    });

    systemsContainer.appendChild(grid);
  });
}

async function login(username, password) {
  const url = `${CONFIG.API_BASE_URL}${CONFIG.ENDPOINTS.login}`;

  const attempts = [
    { username, password },
    { email: username, password },
    { login: username, password }
  ];

  let lastError = null;

  for (const body of attempts) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        saveSession(data, username);
        return;
      }

      lastError = data?.detail || data?.message || `Erro ${response.status}`;
    } catch (error) {
      lastError = error.message;
    }
  }

  throw new Error(lastError || "Falha no login.");
}

async function checkApiHealth() {
  apiDot.className = "dot checking";
  apiStatusTitle.textContent = "Verificando TAG API";
  apiStatusText.textContent = "Aguarde...";

  try {
    const response = await fetch(`${CONFIG.API_BASE_URL}${CONFIG.ENDPOINTS.health}`, {
      method: "GET",
      cache: "no-store"
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    apiDot.className = "dot online";
    apiStatusTitle.textContent = "TAG API Online";
    apiStatusText.textContent = "Backend respondendo normalmente.";
  } catch {
    apiDot.className = "dot offline";
    apiStatusTitle.textContent = "TAG API indisponível";
    apiStatusText.textContent = "Os atalhos continuam disponíveis.";
  }
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  loginMessage.textContent = "Entrando...";

  const formData = new FormData(loginForm);
  const username = String(formData.get("username") || "").trim();
  const password = String(formData.get("password") || "");

  try {
    await login(username, password);
    loginForm.reset();
    showHub();
  } catch (error) {
    loginMessage.textContent = "Não foi possível entrar. Confira usuário e senha.";
    console.error("Rovix Hub login error:", error);
  }
});

logoutButton.addEventListener("click", () => {
  clearSession();
  showLogin("Sessão encerrada.");
});

if (getToken()) {
  showHub();
} else {
  showLogin();
}
