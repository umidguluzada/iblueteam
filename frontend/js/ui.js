import { t as tr } from "./i18n.js";
/** Ortaq köməkçilər: mətn təmizləmə, ikonlar, modal, bildiriş. */

export const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

export const COV = { full: "Tam", partial: "Qismən", gap: "Boşluq" };
export const STATUS = { active: "Aktiv", draft: "Draft", disabled: "Söndürülüb" };
export const PRIO = { high: "Yüksək", medium: "Orta", low: "Aşağı" };
export const TEST = { pass: "Keçdi", fail: "Uğursuz" };

/** Platforma seçimi: bütün səhifələrdə eyni vəziyyəti (state.filters.platform) dəyişir */
export function platformSelectHtml(state, id = "platform") {
  const list = state.platforms.length ? state.platforms : ["Windows"];
  return `<select id="${id}" aria-label="Platforma">
    <option value="all" ${state.filters.platform === "all" ? "selected" : ""}>${tr("ui.080c3e9347")}</option>
    ${list.map((p) => `<option value="${esc(p)}" ${p === state.filters.platform ? "selected" : ""}>${esc(p)}</option>`).join("")}
  </select>`;
}

const ICONS = {
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  close: '<path d="M18 6 6 18M6 6l12 12"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  upload: '<path d="M12 16V4M7 9l5-5 5 5M4 20h16"/>',
  download: '<path d="M12 4v12M7 11l5 5 5-5M4 20h16"/>',
  chevron: '<path d="m6 9 6 6 6-6"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
  pause: '<path d="M8 5v14M16 5v14"/>',
  play: '<path d="m7 4 13 8-13 8z"/>',
  blind: '<path d="M3 3l18 18M10.6 6.1A10 10 0 0 1 12 6c6 0 9.5 6 9.5 6a17 17 0 0 1-3.2 3.9M6.6 7.6A16 16 0 0 0 2.5 12S6 18 12 18a9.7 9.7 0 0 0 4-.9M9.9 10a3 3 0 0 0 4.1 4.1"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  check: '<path d="m5 12 5 5 9-9"/>',
  copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/>',
  pulse: '<path d="M3 12h4l3-8 4 16 3-8h4"/>',
  key: '<circle cx="8" cy="15" r="4"/><path d="m11 12 9-9M16 7l3 3"/>',
  external: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
};

export function icon(name) {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ""}</svg>`;
}

/** index.html-dəki [data-icon] yer tutucularını ikonla əvəz et */
export function hydrateIcons(root = document) {
  root.querySelectorAll("[data-icon]").forEach((n) => {
    n.innerHTML = icon(n.dataset.icon);
    n.style.display = "inline-flex";
  });
}

/** Keyfiyyət göstəricisi: 5 çubuq */
export function qBars(n) {
  return [1, 2, 3, 4, 5].map((i) => `<i class="${i <= n ? "on" : ""}"></i>`).join("");
}

export function toast(msg, kind = "") {
  const el = document.createElement("div");
  el.className = `toast ${kind}`;
  el.textContent = msg;
  document.getElementById("toasts").append(el);
  setTimeout(() => el.remove(), 3600);
}

export function loadingHtml(text = "Yüklənir") {
  return `<div class="loading"><div>${esc(text)}<div class="bar"></div></div></div>`;
}

export function openModal({ title, body, wide = false }) {
  const root = document.getElementById("modalRoot");
  const prev = document.activeElement;
  const wrap = document.createElement("div");
  wrap.className = "modal-backdrop";
  wrap.innerHTML = `
    <div class="modal${wide ? " wide" : ""}" role="dialog" aria-modal="true" aria-labelledby="mTitle">
      <div class="modal-head">
        <h2 id="mTitle">${esc(title)}</h2>
        <button class="icon-btn" type="button" data-close aria-label="Bağla">${icon("close")}</button>
      </div>
      <div class="modal-body">${body}</div>
    </div>`;
  root.append(wrap);
  document.body.style.overflow = "hidden";

  const onKey = (e) => {
    if (e.key === "Escape") close();
  };
  function close() {
    wrap.remove();
    document.removeEventListener("keydown", onKey);
    if (!root.children.length) document.body.style.overflow = "";
    prev?.focus?.();
  }
  document.addEventListener("keydown", onKey);
  wrap.addEventListener("mousedown", (e) => {
    if (e.target === wrap) close();
  });
  wrap.addEventListener("click", (e) => {
    if (e.target.closest("[data-close]")) close();
  });
  setTimeout(() => wrap.querySelector("input:not([type=radio]):not([type=file]):not([type=checkbox]), textarea")?.focus(), 40);

  return { el: wrap.querySelector(".modal"), body: wrap.querySelector(".modal-body"), close };
}
