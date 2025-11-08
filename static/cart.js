import { cartList, cartRemove, cartClear, reflectAuthStatus, fetchJSON, getAuthToken, out } from "./common.js";

function render() {
  reflectAuthStatus();
  const items = cartList();
  const wrap = document.getElementById("cartList");
  if (!wrap) return;
  if (!items.length) {
    wrap.innerHTML = `<div class="muted">Корзина пуста</div>`;
    return;
  }
  wrap.innerHTML = `
    <table class="table">
      <thead><tr><th>Товар</th><th>Цена</th><th></th></tr></thead>
      <tbody>
      ${items.map(it => `
        <tr>
          <td>${it.brand || "?"} — ${it.model || "?"}<div class="mono">id: ${it.id}</div></td>
          <td>${it.price ?? "-"}</td>
          <td><button class="btn ghost rm" data-id="${it.id}">Удалить</button></td>
        </tr>
      `).join("")}
      </tbody>
    </table>
  `;
}

async function checkout() {
  const items = cartList();
  if (!items.length) return out("Корзина пуста");
  if (!getAuthToken()) return out("Нужна авторизация (страница Пользователь)");

  let ok = 0, fail = 0;
  for (const it of items) {
    try {
      await fetchJSON(`/api/v1/java/products/${it.id}/buy`, { method: "POST" });
      ok++;
    } catch (e) {
      fail++;
      out(`Ошибка для ${it.id}: ${e.message}`);
    }
  }
  out(`Оформлено: ${ok}, ошибок: ${fail}`);
  render();
}

function onClick(e) {
  const rm = e.target.closest("button.rm");
  if (rm) {
    cartRemove(rm.dataset.id);
    render();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  render();
  document.getElementById("btnCheckout").addEventListener("click", checkout);
  document.getElementById("btnClear").addEventListener("click", () => { cartClear(); render(); });
  document.addEventListener("click", onClick);
});
