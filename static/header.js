function renderHeader() {
  const container = document.getElementById("site-header");
  if (!container) return;

  container.innerHTML = `
    <header class="topbar">
      <div class="brand"><a href="/" class="brand-link">Reco Demo</a></div>
      <nav>
        <a href="/" data-nav="catalog">Каталог</a>
        <a href="/user.html" data-nav="user">Профиль</a>
        <a href="/cart.html" data-nav="cart">Корзина (<span data-cart-count>0</span>)</a>
      </nav>
      <div class="status">status: <span data-auth-status>anonymous</span></div>
    </header>
  `;

  const path = (location.pathname || "/").toLowerCase();
  const navMap = {
    "/": "catalog",
    "/index.html": "catalog",
    "/product.html": "catalog",
    "/user.html": "user",
    "/cart.html": "cart",
  };

  const active = navMap[path] || "catalog";
  container.querySelectorAll('nav a').forEach(a => {
    if (a.dataset.nav === active) a.classList.add("active");
    else a.classList.remove("active");
  });

  const styleId = "shared-header-inline-fix";
  if (!document.getElementById(styleId)) {
    const s = document.createElement("style");
    s.id = styleId;
    s.textContent = `
      .topbar { display:flex; align-items:center; justify-content:space-between; gap:16px; padding:12px 16px; background:var(--panel,#fff); box-shadow: var(--shadow, 0 2px 12px rgba(0,0,0,.05)); position:sticky; top:0; z-index:10; }
      .topbar .brand { font-weight:700; }
      .topbar .brand .brand-link { text-decoration: none; color: inherit; }
      .topbar nav { display:flex; gap:12px; align-items:center; }
      .topbar nav a { text-decoration:none; color:var(--text,#1e2433); padding:6px 10px; border-radius:8px; }
      .topbar nav a.active { background:var(--soft,#f1f4f9); color: var(--brand,#2563eb); }
      .topbar .status { font-size: 14px; color: var(--muted,#65708a); }
    `;
    document.head.appendChild(s);
  }
}

document.addEventListener("DOMContentLoaded", renderHeader);
