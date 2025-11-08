import { fetchJSON, out, getAuthToken, cartAdd } from "./common.js";

function getId() {
  return new URL(location.href).searchParams.get("id") || "";
}

function isLoggedIn() {
  return !!getAuthToken();
}

function renderSkeleton(id) {
  const el = document.getElementById("productBox");
  el.innerHTML = `
    <div class="card big">
      <h2 id="pTitle">Загрузка...</h2>
      <div class="mono">id: ${id}</div>

      <div id="pInfo" class="kv">
        <div><span>Категория:</span><b>—</b></div>
        <div><span>Цена:</span><b>—</b></div>
        <div id="pStatus" class="muted">Ожидаем данные с сервера</div>
      </div>

      <div class="btn-row">
        <button class="btn" data-act="view">View</button>
        <button class="btn need-auth" data-act="like" title="Требуется авторизация">Like</button>
        <button class="btn need-auth" data-act="unlike" title="Требуется авторизация">Unlike</button>
        <button class="btn" data-act="cart" data-brand="" data-model="" data-price="">Add to Cart</button>
        <button class="btn need-auth" data-act="buy" title="Требуется авторизация">Buy</button>
      </div>
    </div>
  `;
  reflectAuthOnButtons();
}

function reflectAuthOnButtons() {
  const needAuthButtons = document.querySelectorAll(".need-auth");
  needAuthButtons.forEach(btn => {
    if (isLoggedIn()) {
      btn.classList.remove("disabled");
      btn.removeAttribute("disabled");
      btn.title = "";
    } else {
      btn.classList.add("disabled");
      btn.setAttribute("disabled", "disabled");
      btn.title = "Требуется авторизация";
    }
  });
}

function hydrateProduct(p) {
  const title = document.getElementById("pTitle");
  const info = document.getElementById("pInfo");
  const btnCart = document.querySelector('button[data-act="cart"]');

  if (title) title.textContent = `${p.brand || "?"} — ${p.model || "?"}`;
  if (info) {
    info.innerHTML = `
      <div><span>Категория:</span><b>${p.category || "-"}</b></div>
      <div><span>Цена:</span><b>${p.price ?? "-"}</b></div>
      <div id="pStatus" class="muted">Готово</div>
    `;
  }
  if (btnCart) {
    btnCart.dataset.brand = p.brand || "";
    btnCart.dataset.model = p.model || "";
    btnCart.dataset.price = p.price ?? "";
  }
}

function showNotFound() {
  const title = document.getElementById("pTitle");
  const status = document.getElementById("pStatus");
  if (title) title.textContent = "Товар не найден";
  if (status) status.textContent = "Проверьте корректность id";
}

async function load() {
  const id = getId();
  if (!id) {
    out("Не указан id продукта");
    return;
  }
  renderSkeleton(id);
  try {
    const data = await fetchJSON(`/api/v1/java/products/${encodeURIComponent(id)}`);
    hydrateProduct(data);
  } catch (e) {
    showNotFound();
    out(e.message);
  }
}

async function onAction(e) {
  const btn = e.target.closest("button.btn");
  if (!btn) return;

  const act = btn.dataset.act;
  const id = getId();

  try {
    if (act === "view") {
      const data = await fetchJSON(`/api/v1/java/products/${id}`);
      out(data);

    } else if (act === "like") {
      if (!isLoggedIn()) return out("Нужна авторизация");
      const data = await fetchJSON(`/api/v1/java/products/${id}/like`, { method: "POST" });
      out(data);

    } else if (act === "unlike") {
      if (!isLoggedIn()) return out("Нужна авторизация");
      // по контракту Java должно быть 204; мы нормализуем 500 → 204 на прокси
      const res = await fetchJSON(`/api/v1/java/products/${id}/like`, { method: "DELETE" });
      out(typeof res === "string" ? res : "unliked (204)");

    } else if (act === "cart") {
      cartAdd({
        id,
        brand: btn.dataset.brand || "",
        model: btn.dataset.model || "",
        price: btn.dataset.price ? Number(btn.dataset.price) : null
      });
      out("Добавлено в корзину");

    } else if (act === "buy") {
      if (!isLoggedIn()) return out("Нужна авторизация");
      const data = await fetchJSON(`/api/v1/java/products/${id}/buy`, { method: "POST" });
      out(data);
    }
  } catch (err) {
    out(err.message);
  }
}

window.addEventListener("storage", (ev) => {
  if (ev.key === "AUTH_TOKEN") reflectAuthOnButtons();
});

document.addEventListener("DOMContentLoaded", () => {
  document.addEventListener("click", onAction);
  load();
});
