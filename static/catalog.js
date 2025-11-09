const out = (msg) => {
  const el = document.getElementById("output");
  if (!el) return;
  el.textContent =
    typeof msg === "string" ? msg : JSON.stringify(msg, null, 2);
};

function getUsername() {
  return localStorage.getItem("USERNAME") || "";
}
function reflectAuthStatus() {
  const span = document.getElementById("authStatus");
  if (!span) return;
  const u = getUsername();
  if (!u) {
    span.textContent = "anonymous";
    span.style.color = "#c77800";
  } else {
    span.textContent = `user: ${u}`;
    span.style.color = "#0e7a4b";
  }
}

function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

async function fetchJSON(url, opts = {}) {
  opts.headers = opts.headers || {};
  const u = getUsername();
  if (u) opts.headers["X-User"] = u;
  const r = await fetch(url, opts);
  if (!r.ok) {
    const txt = await r.text();
    throw new Error(`HTTP ${r.status}: ${txt}`);
  }
  const ct = r.headers.get("content-type") || "";
  return ct.includes("application/json") ? r.json() : r.text();
}

async function loadProducts({ useCache = false } = {}) {
  try {
    const data = await fetchJSON(
      `/api/v1/java/products?use_cache=${useCache ? "true" : "false"}`
    );
    renderProducts(data.items || []);
    await maybeLoadRecommendations();
  } catch (e) {
    out(e.message);
  }
}

function renderProducts(items) {
  const wrap = document.getElementById("products");
  if (!wrap) return;
  wrap.innerHTML = "";
  items.forEach((p) => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <div class="card-head">
        <h3>${escapeHtml(p.brand || "?")} — ${escapeHtml(p.model || "?")}</h3>
        <a class="link" href="/product.html?id=${encodeURIComponent(p.id)}">Открыть</a>
      </div>
      <div class="mono">id: ${escapeHtml(p.id || "")}</div>
      <div>Категория: <b>${escapeHtml(p.category || "-")}</b></div>
      <div>Цена: <b class="price">${p.price ?? "-"}</b></div>
      <div class="actions">
        <button class="btn outline action" data-act="view" data-id="${p.id}">View</button>
        <button class="btn action" data-act="like" data-id="${p.id}">Like</button>
        <button class="btn ghost action" data-act="unlike" data-id="${p.id}">Unlike</button>
        <button class="btn success action" data-act="buy" data-id="${p.id}">Buy</button>
      </div>
    `;
    wrap.appendChild(card);
  });
}

async function onAction(e) {
  const btn = e.target.closest("button.action");
  if (!btn) return;
  const act = btn.dataset.act;
  const pid = btn.dataset.id;

  try {
    if (act === "view") {
      const data = await fetchJSON(`/api/v1/java/products/${pid}`);
      out(data);
    } else if (act === "like") {
      const data = await fetchJSON(`/api/v1/java/products/${pid}/like`, {
        method: "POST",
      });
      out(data);
    } else if (act === "unlike") {
      const data = await fetchJSON(`/api/v1/java/products/${pid}/like`, {
        method: "DELETE",
      });
      out(data);
    } else if (act === "buy") {
      const data = await fetchJSON(`/api/v1/java/products/${pid}/buy`, {
        method: "POST",
      });
      out(data);
    }
  } catch (err) {
    out(err.message);
  }
}

async function onSearch() {
  const q = document.getElementById("searchInput")?.value.trim() || "";
  try {
    const data = await fetchJSON(`/api/v1/search?q=${encodeURIComponent(q)}`);
    renderProducts(data.items || []);
    out({ search: q, count: data.count });
  } catch (e) {
    out(e.message);
  }
}

async function maybeLoadRecommendations() {
  const sec = document.getElementById("recoSection");
  const list = document.getElementById("recoList");
  const hint = document.getElementById("recoHint");
  if (!sec || !list) return;

  if (!getUsername()) {
    sec.style.display = "none";
    return;
  }

  try {
    const data = await fetchJSON(`/api/v1/java/users/me/recommendation`);
    const items = Array.isArray(data?.items)
      ? data.items
      : Array.isArray(data)
      ? data
      : [];
    list.innerHTML = "";

    if (!items.length) {
      list.innerHTML = `<div class="muted">Нет рекомендаций</div>`;
    } else {
      items.forEach((p) => {
        const card = document.createElement("div");
        card.className = "card";
        card.innerHTML = `
          <div class="card-head">
            <h3>${escapeHtml(p.brand || "?")} — ${escapeHtml(p.model || "?")}</h3>
            <a class="link" href="/product.html?id=${encodeURIComponent(p.id)}">Открыть</a>
          </div>
          <div class="mono">id: ${escapeHtml(p.id || "")}</div>
          <div>Категория: <b>${escapeHtml(p.category || "-")}</b></div>
          <div>Цена: <b>${p.price ?? "-"}</b></div>
        `;
        list.appendChild(card);
      });
    }

    if (hint) hint.textContent = "Показаны персональные рекомендации";
    sec.style.display = "";
  } catch (e) {
    sec.style.display = "none";
  }
}

function selectedCategories() {
  const boxWrap = document.getElementById("catFilters");
  if (!boxWrap) return [];
  const inputs = [...boxWrap.querySelectorAll('input[type="checkbox"]')];
  return inputs
    .filter((i) => i.checked)
    .map((i) => i.value.trim().toUpperCase());
}

async function applyCategoryFilter() {
  const cats = selectedCategories();
  if (!cats.length) {
    await loadProducts({ useCache: false });
    return;
  }
  const csv = cats.join(",");
  try {
    const data = await fetchJSON(
      `/api/v1/java/products/by-category?category=${encodeURIComponent(csv)}`
    );
    renderProducts(data.items || []);
    out({ filter: cats, count: data.count });
  } catch (e) {
    out(e.message);
  }
}

function resetCategoryFilter() {
  const boxWrap = document.getElementById("catFilters");
  if (boxWrap) {
    boxWrap
      .querySelectorAll('input[type="checkbox"]')
      .forEach((i) => (i.checked = false));
  }
  loadProducts({ useCache: false }).catch(console.error);
}

document.addEventListener("click", onAction);

const btnSearch = document.getElementById("btnSearch");
if (btnSearch) btnSearch.addEventListener("click", onSearch);

const btnApplyCats = document.getElementById("btnApplyCats");
if (btnApplyCats) btnApplyCats.addEventListener("click", applyCategoryFilter);

const btnResetCats = document.getElementById("btnResetCats");
if (btnResetCats) btnResetCats.addEventListener("click", resetCategoryFilter);

reflectAuthStatus();
loadProducts({ useCache: false }).catch(console.error);
