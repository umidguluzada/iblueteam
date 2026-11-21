import { t as tr } from "./i18n.js";
import { initLanguage } from "./i18n.js";
import { state, loadAll, loadPlatforms, onRefresh, platformParam } from "./state.js";
import { hydrateIcons, icon, loadingHtml, esc, toast } from "./ui.js";
import { closePanel, isOpen } from "./panel.js";
import { renderMatrix } from "./matrix.js";
import { renderRules } from "./rules.js";
import { renderReviews } from "./reviews.js";
import { renderGaps } from "./gaps.js";
import { renderOverview } from "./overview.js";
import { renderSources } from "./sources.js";
import { renderMonitor, stopMonitor } from "./monitor.js";
import { renderHoneypot, stopHoneypot } from "./honeypot.js";
import { restoreSession, renderUserArea, bindUserArea } from "./auth.js";

const views = {
  matrix: renderMatrix,
  monitor: renderMonitor,
  honeypot: renderHoneypot,
  rules: renderRules,
  reviews: renderReviews,
  sources: renderSources,
  gaps: renderGaps,
  overview: renderOverview,
};
const root = document.getElementById("view");
let firstPaint = true;
let seq = 0;

const currentRoute = () => {
  const r = (location.hash.replace(/^#\/?/, "") || "matrix").split("/")[0];
  return views[r] ? r : "matrix";
};

async function renderRoute() {
  const my = ++seq;
  const route = currentRoute();
  stopMonitor(); // canlı monitor və honeypot yeniləməsi yalnız öz səhifəsində işləyir
  stopHoneypot();
  document.body.dataset.route = route;
  document.querySelectorAll(".nav a").forEach((a) => {
    if (a.dataset.route === route) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  });
  try {
    // giriş animasiyası yalnız ilk açılışda bir dəfə oynayır
    await views[route](root, { boot: route === "matrix" && firstPaint });
    firstPaint = false;
  } catch (e) {
    if (my !== seq) return;
    root.innerHTML = `<div class="page"><div class="empty"><h3>${tr("main.a91b9c9c9d")}</h3><p>${esc(e.message)}</p></div></div>`;
  }
}

window.addEventListener("ibt:languagechange", () => {
  if (!firstPaint) { renderRoute(); renderExport(); syncThemeIcon(); }
});

/* ---------------------------------------------------------------- ixrac menyusu */
function renderExport() {
  const p = platformParam();
  const items = [
    ["/api/export/matrix.json?platform=" + p, "Matris (JSON)", "Texnikalar, qaydalar, log mənbələri və boşluqlar"],
    ["/api/export/matrix.csv?platform=" + p, "Matris (CSV)", "Hər texnika üçün bir sətir"],
    ["/api/export/gaps.csv?platform=" + p, "Boşluqlar (CSV)", "Prioritet sırası ilə"],
    ["/api/export/navigator?platform=" + p, "ATT&CK Navigator layer", "mitre-attack.github.io/attack-navigator"],
  ];
  document.getElementById("exportList").innerHTML = items
    .map(([href, name, hint]) => `<a role="menuitem" href="${href}" download><span>${esc(name)}<small>${esc(hint)}</small></span></a>`)
    .join("");
}

function renderUser() {
  renderUserArea(document.getElementById("userArea"));
  hydrateIcons(document.getElementById("userArea"));
}

/* ---------------------------------------------------------------- mövzu */
const themeBtn = document.getElementById("themeBtn");
function syncThemeIcon() {
  const dark = document.documentElement.getAttribute("data-theme") !== "light";
  themeBtn.innerHTML = icon(dark ? "sun" : "moon");
  themeBtn.setAttribute("aria-label", dark ? "Açıq mövzuya keç" : "Tünd mövzuya keç");
}
themeBtn.addEventListener("click", () => {
  const next = document.documentElement.getAttribute("data-theme") === "light" ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", next);
  try {
    localStorage.setItem("ibt-theme", next);
  } catch { /* yadda saxlanmadı, problem deyil */ }
  syncThemeIcon();
});

/* ---------------------------------------------------------------- menyular və klaviatura */
document.addEventListener("click", (e) => {
  document.querySelectorAll("details.menu[open]").forEach((d) => {
    if (!d.contains(e.target)) d.removeAttribute("open");
  });
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    const open = document.querySelector("details.menu[open]");
    if (open) {
      open.removeAttribute("open");
      open.querySelector("summary")?.focus();
      return;
    }
  }
  if (document.querySelector(".modal-backdrop")) return; // modal öz Esc-ini idarə edir
  if (e.key === "Escape" && isOpen()) closePanel();
  if (e.key === "/" && currentRoute() === "matrix" && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) {
    e.preventDefault();
    document.getElementById("q")?.focus();
  }
});

window.addEventListener("hashchange", () => {
  closePanel();
  renderRoute();
});

document.addEventListener("ibt:auth", () => {
  renderUser();
  renderRoute();
});
document.addEventListener("ibt:unauth", () => {
  state.user = null;
  renderUser();
  toast("Sessiya bitib. Yenidən daxil olun", "error");
  renderRoute();
});

/* ---------------------------------------------------------------- başlanğıc */
async function init() {
  hydrateIcons();
  initLanguage();
  syncThemeIcon();
  bindUserArea(document.getElementById("userArea"));
  root.innerHTML = loadingHtml("Matris yüklənir");
  try {
    await Promise.all([restoreSession(), loadPlatforms()]);
    renderUser();
    renderExport();
    await loadAll();
  } catch (e) {
    root.innerHTML = `<div class="page"><div class="empty"><h3>${tr("main.8f0e27ae2c")}</h3><p>${esc(e.message)}</p></div></div>`;
    return;
  }
  onRefresh(() => {
    renderExport();
    renderRoute();
  });
  await renderRoute();
}

init();
