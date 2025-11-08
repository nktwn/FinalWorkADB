import { fetchJSON, out, makeBasic, setAuthToken, getAuthToken } from "./common.js";

function renderPretty(data) {
  const box = document.getElementById("pretty");
  if (!box) return;
  if (!data) { box.innerHTML = ""; return; }

  if (typeof data === "string") {
    box.innerHTML = `<div class="chip">${data}</div>`;
    return;
  }
  if (Array.isArray(data)) {
    if (data.length === 0) { box.innerHTML = `<div class="muted">пусто</div>`; return; }
    box.innerHTML = `
      <table class="table">
        <thead><tr><th>ts</th><th>action</th><th>productId</th><th>category</th></tr></thead>
        <tbody>
          ${data.map(a => `
            <tr>
              <td>${a.timestamp ?? "-"}</td>
              <td>${a.action ?? "-"}</td>
              <td>${a.productId ?? "-"}</td>
              <td>${a.category ?? "-"}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `;
    return;
  }
  if (typeof data === "object" && data.java_username) {
    box.innerHTML = `<div class="big-chip">👤 ${data.java_username}</div>`;
    return;
  }
  box.innerHTML = `<pre>${JSON.stringify(data, null, 2)}</pre>`;
}

async function onRegister() {
  const u = document.getElementById("regUser").value.trim();
  const p = document.getElementById("regPass").value;
  if (!u || !p) return renderPretty("Введите username и password для регистрации");
  try {
    const res = await fetchJSON(`/api/v1/java/users/registration`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: u, password: p, passwordConfirmation: p })
    });
    renderPretty(res);
  } catch (e) {
    renderPretty(e.message);
  }
}

async function onLogin() {
  const u = document.getElementById("loginUser").value.trim();
  const p = document.getElementById("loginPass").value;
  if (!u || !p) return renderPretty("Введите username и password для логина");
  const token = makeBasic(u, p);
  try {
    const r = await fetch(`/api/v1/java/me/username`, { headers: { "Authorization": token } });
    if (!r.ok) throw new Error(`Login failed: HTTP ${r.status}: ${await r.text()}`);
    setAuthToken(token);
    const payload = await r.json().catch(async () => ({ java_username: await r.text() }));
    renderPretty({ login: "ok", ...payload });
  } catch (e) {
    setAuthToken("");
    renderPretty(e.message);
  }
}

function onLogout() {
  setAuthToken("");
  renderPretty("logged out");
}

async function onWhoAmI() {
  if (!getAuthToken()) return renderPretty("Unauthorized: войдите");
  try {
    const data = await fetchJSON(`/api/v1/java/me/username`);
    renderPretty(data);
  } catch (e) {
    renderPretty(e.message);
  }
}

async function onHistory() {
  if (!getAuthToken()) return renderPretty("Unauthorized: войдите");
  try {
    const data = await fetchJSON(`/api/v1/java/users/me/history?all=true`);
    renderPretty(data);
  } catch (e) {
    renderPretty(e.message);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("btnRegister").addEventListener("click", onRegister);
  document.getElementById("btnLogin").addEventListener("click", onLogin);
  document.getElementById("btnLogout").addEventListener("click", onLogout);
  document.getElementById("btnWhoAmI").addEventListener("click", onWhoAmI);
  document.getElementById("btnHistory").addEventListener("click", onHistory);
});
