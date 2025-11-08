import { fetchJSON, out, getAuthToken } from "./common.js";

function isLoggedIn() {
  return !!getAuthToken();
}

function productCard(p) {
  const id = p.id || "";
  const brand = p.brand || "?";
  const model = p.model || "?";
  const category = p.category || "-";
  const price = (p.price ?? "-");

  return `
    <div class="card">
      <h3>${brand} — ${model}</h3>
      <div class="mono">id: ${id}</div>
      <div>Категория: <b>${category}</b></div>
      <div>Цена: <b>${price}</b></div>
      <div class="actions">
        <a class="link" href="/product.html?id=${encodeURIComponent(id)}">Открыть</a>
      </div>
    </div>
  `;
}

function renderList(el, items) {
  if (!items || items.length === 0) {
    el.innerHTML = `<div class="muted">Ничего не найдено</div>`;
    return;
  }
  el.innerHTML = items.map(productCard).join("");
}

async function loadCatalog(q = "") {
  const url = q
    ? `/api/v1/search?q=${encodeURIComponent(q)}`
    : `/api/v1/java/products?use_cache=${isLoggedIn() ? "false" : "true"}`;

  try {
    const data = await fetchJSON(url);
    const list = document.getElementById("products");
    renderList(list, (data.items || data) ?? []);
  } catch (e) {
    out(e.message);
  }
}

async function loadRecommendations() {
  const section = document.getElementById("recoSection");
  const list = document.getElementById("recoList");
  const hint = document.getElementById("recoHint");

  if (!section || !list) return;

  if (!isLoggedIn()) {
    section.style.display = "none";
    return;
  }

  try {
    const items = await fetchJSON(`/api/v1/java/users/me/recommendation`);
    section.style.display = "block";
    hint.textContent = items.length ? "" : "Пока нет рекомендаций";
    renderList(list, items);
  } catch (e) {
    section.style.display = "none";
    out(e.message);
  }
}

async function onSearch() {
  const q = document.getElementById("searchInput").value.trim();
  await loadCatalog(q);
  out(q ? { search: q } : "");
}

document.getElementById("btnSearch").addEventListener("click", onSearch);

loadRecommendations();
loadCatalog();

window.addEventListener("storage", (ev) => {
  if (ev.key === "AUTH_TOKEN") {
    loadRecommendations();
    loadCatalog();
  }
});
