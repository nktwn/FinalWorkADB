import { fetchJSON, out, getAuthToken, reflectAuthStatus, cartAdd } from "./common.js";

function productCard(p) {
  const id = p.id ?? "";
  return `
    <div class="card">
      <div class="card-head">
        <h3>${p.brand || "?"} — ${p.model || "?"}</h3>
        <a class="link" href="/product.html?id=${encodeURIComponent(id)}">Открыть</a>
      </div>
      <div class="mono">id: ${id}</div>
      <div>Категория: <b>${p.category || "-"}</b></div>
      <div>Цена: <b>${p.price ?? "-"}</b></div>
      <div class="btn-row">
        <button class="btn action" data-act="like" data-id="${id}">Like</button>
        <button class="btn action" data-act="unlike" data-id="${id}">Unlike</button>
        <button class="btn action" data-act="cart" data-id="${id}" data-brand="${p.brand || ""}" data-model="${p.model || ""}" data-price="${p.price ?? ""}">Add to Cart</button>
        <button class="btn action" data-act="buy" data-id="${id}">Buy Now</button>
      </div>
    </div>
  `;
}

async function loadProducts() {
  try {
    const useCache = getAuthToken() ? "false" : "true";
    const data = await fetchJSON(`/api/v1/java/products?use_cache=${useCache}`);
    renderGrid(data.items || []);
  } catch (e) {
    out(e.message);
    renderGrid([]);
  }
}

function renderGrid(items) {
  const grid = document.getElementById("grid");
  if (!grid) return;
  grid.innerHTML = items.length
    ? items.map(productCard).join("")
    : `<div class="muted">Нет товаров</div>`;
  reflectAuthStatus();
}

async function handleAction(e) {
  const btn = e.target.closest("button.action"); if (!btn) return;
  const act = btn.dataset.act; const id = btn.dataset.id;
  try {
    if (act === "like") {
      if (!getAuthToken()) return out("Нужна авторизация");
      const res = await fetchJSON(`/api/v1/java/products/${id}/like`, { method: "POST" });
      out(res);
    } else if (act === "unlike") {
      if (!getAuthToken()) return out("Нужна авторизация");
      const res = await fetchJSON(`/api/v1/java/products/${id}/like`, { method: "DELETE" });
      out(typeof res === "string" ? res : "unliked (204)");
    } else if (act === "cart") {
      const item = {
        id,
        brand: btn.dataset.brand || "",
        model: btn.dataset.model || "",
        price: btn.dataset.price ? Number(btn.dataset.price) : null
      };
      cartAdd(item);
      out(`Добавлено в корзину: ${item.brand} ${item.model}`);
    } else if (act === "buy") {
      if (!getAuthToken()) return out("Нужна авторизация");
      const res = await fetchJSON(`/api/v1/java/products/${id}/buy`, { method: "POST" });
      out(res);
    }
  } catch (err) {
    out(err.message);
  }
}

async function onSearch() {
  const q = document.getElementById("searchInput").value.trim();
  try {
    const data = await fetchJSON(`/api/v1/search?q=${encodeURIComponent(q)}`);
    renderGrid(data.items || []);
    out({ search: q, count: data.count });
  } catch (e) {
    out(e.message);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  document.addEventListener("click", handleAction);
  const btn = document.getElementById("btnSearch");
  if (btn) btn.addEventListener("click", onSearch);
  loadProducts();
});
