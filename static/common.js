const LS_AUTH = "AUTH";
const LS_AUTH_TS = "AUTH_TS";
const SESSION_TTL_MS = 10 * 60 * 1000;

function nowMs() { return Date.now(); }
function isExpired(ts) { return !ts || (nowMs() - ts) > SESSION_TTL_MS; }

export function getAuthToken() {
  const token = localStorage.getItem(LS_AUTH) || "";
  const ts = parseInt(localStorage.getItem(LS_AUTH_TS) || "0", 10);
  if (!token) return "";
  if (isExpired(ts)) {
    localStorage.removeItem(LS_AUTH);
    localStorage.removeItem(LS_AUTH_TS);
    reflectAuthStatus();
    return "";
  }
  return token;
}
function touch() { localStorage.setItem(LS_AUTH_TS, String(nowMs())); }

export function setAuthToken(token) {
  if (token) { localStorage.setItem(LS_AUTH, token); touch(); }
  else { localStorage.removeItem(LS_AUTH); localStorage.removeItem(LS_AUTH_TS); }
  reflectAuthStatus();
}

export function makeBasic(u, p) { return "Basic " + btoa(`${u}:${p}`); }

export function reflectAuthStatus() {
  const el = document.querySelector("[data-auth-status]");
  if (el) {
    const tok = getAuthToken();
    el.textContent = tok ? "authorized" : "anonymous";
    el.style.color = tok ? "#06d6a0" : "#ffd166";
  }
  const cc = document.querySelectorAll("[data-cart-count]");
  cc.forEach(e => e.textContent = String(cartCount()));
}

function attachAuth(opts = {}) {
  opts.headers = opts.headers || {};
  const tok = getAuthToken();
  if (tok && !opts.headers["Authorization"]) {
    opts.headers["Authorization"] = tok;
    touch();
  }
  return opts;
}
export async function fetchJSON(url, opts = {}) {
  const withAuth = attachAuth(opts);
  const r = await fetch(url, withAuth);
  if (!r.ok) {
    const txt = await r.text();
    if (r.status === 401 || r.status === 403) {
      setAuthToken("");
      throw new Error("Unauthorized: войдите на странице Пользователь");
    }
    throw new Error(`HTTP ${r.status}: ${txt}`);
  }
  const ct = r.headers.get("content-type") || "";
  return ct.includes("application/json") ? r.json() : r.text();
}

export function out(msg, id = "output") {
  const el = document.getElementById(id);
  if (!el) return;
  if (typeof msg === "string") el.textContent = msg; else el.textContent = JSON.stringify(msg, null, 2);
}

const LS_CART = "CART_V1";
function readCart() {
  try { return JSON.parse(localStorage.getItem(LS_CART) || "[]"); } catch { return []; }
}
function writeCart(items) { localStorage.setItem(LS_CART, JSON.stringify(items)); reflectAuthStatus(); }
export function cartList() { return readCart(); }
export function cartCount() { return readCart().length; }
export function cartAdd(item) {
  const items = readCart();
  if (!items.find(x => x.id === item.id)) { items.push(item); writeCart(items); }
}
export function cartRemove(id) {
  writeCart(readCart().filter(x => x.id !== id));
}
export function cartClear() { writeCart([]); }

document.addEventListener("DOMContentLoaded", reflectAuthStatus);
