import { t as tr } from "./i18n.js";
import { state, L, refresh } from "./state.js";
import { esc, icon, COV, platformSelectHtml } from "./ui.js";
import { openPanel } from "./panel.js";

let wrapEl = null;
let matrixEl = null;

const anyFilter = () => !!(state.filters.q || state.filters.ds || state.filters.cov !== "all");

/** Texnika (və ya alt-texnika) cari filtrlərə uyğundurmu */
function matches(t) {
  const f = state.filters;
  if (f.cov !== "all" && L[t.coverage] !== f.cov) return false;
  if (f.ds && !(t.ds || []).includes(f.ds)) return false;
  if (f.q) {
    const q = f.q.toLowerCase();
    if (!t.id.toLowerCase().includes(q) && !t.name.toLowerCase().includes(q)) return false;
  }
  return true;
}

function sourceNote() {
  const m = state.matrix.meta || {};
  if (m.attack_source === "fallback") return "Seçmə ATT&CK dəsti (tam matris üçün README-yə baxın)";
  return m.attack_updated ? `ATT&CK Enterprise, məlumat ${m.attack_updated} tarixinə` : "ATT&CK Enterprise";
}

function chip(key, label, count, dot) {
  const on = state.filters.cov === key;
  return `<button class="chip" type="button" data-cov="${key}" aria-pressed="${on}">${dot ? `<i class="state ${dot}"></i>` : ""}${label}<b>${count}</b></button>`;
}

export function renderMatrix(root, { boot = false } = {}) {
  // yenilənmə zamanı sürüşdürmə mövqeyini saxla
  const keep = wrapEl && document.contains(wrapEl) ? { x: wrapEl.scrollLeft, y: wrapEl.scrollTop } : null;

  const { matrix, stats } = state;
  const T = stats.techniques;
  // platformada olmayan seçimlər sıfırlanır
  if (state.filters.tactic && !matrix.tactics.some((t) => t.shortname === state.filters.tactic)) state.filters.tactic = "";
  const dsOptions = state.sources.filter((d) => d.techniques || d.rules).sort((a, b) => a.name.localeCompare(b.name));
  if (state.filters.ds && !dsOptions.some((d) => d.name === state.filters.ds)) state.filters.ds = "";
  const covered = T.full + T.partial;
  const pct = (n, d) => (d ? Math.round((n / d) * 100) : 0);

  root.innerHTML = `
    <section class="matrix-view">
      <div class="toolbar">
        <label class="search">${icon("search")}
          <input id="q" type="search" placeholder="Texnika ID və ya ad" autocomplete="off" aria-label="Texnika axtar" value="${esc(state.filters.q)}">
          <kbd aria-hidden="true">/</kbd>
        </label>
        ${platformSelectHtml(state)}
        <select id="tacticSel" aria-label="Taktika">
          <option value="">${tr("matrix.fed260e35d")}</option>
          ${matrix.tactics.map((t) => `<option value="${esc(t.shortname)}" ${t.shortname === state.filters.tactic ? "selected" : ""}>${esc(t.name)}</option>`).join("")}
        </select>
        <select id="dsSel" aria-label="Log mənbəyi">
          <option value="">${tr("matrix.48eddf7f57")}</option>
          ${dsOptions.map((d) => `<option value="${esc(d.name)}" ${d.name === state.filters.ds ? "selected" : ""}>${esc(d.name)}${d.collected ? "" : " (toplanmır)"}</option>`).join("")}
        </select>
        <div class="chips" role="group" aria-label="Əhatə filtri">
          ${chip("all", "Hamısı", T.total)}${chip("full", "Tam", T.full, "full")}${chip("partial", "Qismən", T.partial, "partial")}${chip("gap", "Boşluq", T.gap, "gap")}
        </div>
        <label class="switch"><input type="checkbox" id="subsToggle" ${state.filters.subs ? "checked" : ""}><i></i>Alt-texnikalar</label>
        <label class="switch" title="Xanaları əhatə səviyyəsinə görə rəngləndir: qaydaların sayı və keyfiyyəti nəzərə alınır"><input type="checkbox" id="heatToggle" ${state.filters.heat ? "checked" : ""}><i></i>${tr("matrix.3552ea02fd")}</label>
        <span class="grow"></span>
        <span class="note hide-md">${esc(sourceNote())}</span>
      </div>
      <div class="cov-strip" aria-label="Ümumi əhatə">
        <div class="cov-main"><strong>${pct(covered, T.total)}<small>%</small></strong><span>texnikada aşkarlama var (${covered} / ${T.total})</span></div>
        <div class="cov-item" title="Çox qrupun istifadə etdiyi texnikalar daha çox çəkiyə malikdir"><b>${stats.weighted.score}<small>%</small></b><span>${tr("matrix.b921ef2310")}</span></div>
        <div class="cov-item" title="Aşkarlama yoxdur və səbəb log mənbəyinin toplanmamasıdır"><b>${T.blind}</b><span>kor texnika</span></div>
        <div class="cov-legend${state.filters.heat ? " on" : ""}" aria-hidden="true"><span>${tr("matrix.b9154addd4")}</span><i></i><span>${tr("matrix.919ad61f57")}</span></div>
      </div>
      <div class="matrix-wrap${boot ? " booting" : ""}" id="matrixWrap">
        <div class="scan"></div>
        <div class="matrix" id="matrix"></div>
      </div>
    </section>`;

  wrapEl = root.querySelector("#matrixWrap");
  matrixEl = root.querySelector("#matrix");
  paint(boot);
  if (keep) {
    wrapEl.scrollLeft = keep.x;
    wrapEl.scrollTop = keep.y;
  }

  const q = root.querySelector("#q");
  q.addEventListener("input", () => {
    state.filters.q = q.value.trim();
    paint(false);
  });
  root.querySelector("#platform").addEventListener("change", async (e) => {
    state.filters.platform = e.target.value;
    state.expanded.clear();
    try {
      await refresh();
    } catch (err) {
      e.target.disabled = false;
    }
  });
  root.querySelector("#tacticSel").addEventListener("change", (e) => {
    state.filters.tactic = e.target.value;
    paint(false);
  });
  root.querySelector("#dsSel").addEventListener("change", (e) => {
    state.filters.ds = e.target.value;
    paint(false);
  });
  root.querySelector("#heatToggle").addEventListener("change", (e) => {
    state.filters.heat = e.target.checked;
    root.querySelector(".cov-legend").classList.toggle("on", e.target.checked);
    matrixEl.classList.toggle("heat", e.target.checked);
  });
  root.querySelector("#subsToggle").addEventListener("change", (e) => {
    state.filters.subs = e.target.checked;
    paint(false);
  });
  root.querySelector(".chips").addEventListener("click", (e) => {
    const b = e.target.closest("[data-cov]");
    if (!b) return;
    state.filters.cov = b.dataset.cov;
    root.querySelectorAll(".chip").forEach((c) => c.setAttribute("aria-pressed", String(c.dataset.cov === state.filters.cov)));
    paint(false);
  });

  matrixEl.addEventListener("click", (e) => {
    const exp = e.target.closest("[data-exp]");
    if (exp) {
      if (state.filters.subs) return;
      const id = exp.dataset.exp;
      state.expanded.has(id) ? state.expanded.delete(id) : state.expanded.add(id);
      paint(false);
      matrixEl.querySelector(`[data-exp="${id}"]`)?.focus();
      return;
    }
    const open = e.target.closest("[data-open]");
    if (open) openPanel(open.dataset.open);
  });
}

function paint(boot) {
  matrixEl.className = "matrix" + (boot ? " boot" : "") + (state.filters.heat ? " heat" : "");
  matrixEl.innerHTML = state.matrix.tactics.filter((tac) => !state.filters.tactic || tac.shortname === state.filters.tactic).map(column).join("");
  highlightSelected();
  if (boot) {
    setTimeout(() => {
      matrixEl?.classList.remove("boot");
      wrapEl?.classList.remove("booting");
    }, 3200);
  }
}

function column(tac, ci) {
  const st = state.stats.tactics.find((t) => t.shortname === tac.shortname) || { total: 0, full: 0, partial: 0 };
  const total = st.total || 1;
  const cpct = Math.round(((st.full + st.partial) / total) * 100);
  const cells = tac.techniques.map((t, ri) => cell(t, ri)).join("");
  return `
    <div class="col" style="--col:${ci}">
      <div class="col-head">
        <div class="col-name">${esc(tac.name)}</div>
        <div class="col-meta">
          <span class="tid">${esc(tac.ext_id || "")}</span>
          <span title="Aşkarlama olan texnika / cəmi: ${st.full + st.partial} / ${st.total}"><b>${cpct}%</b> ${st.full + st.partial}/${st.total}</span>
        </div>
        <div class="col-bar" aria-hidden="true">
          <i class="b-full" style="width:${(st.full / total) * 100}%"></i><i class="b-part" style="width:${(st.partial / total) * 100}%"></i>
        </div>
      </div>
      <div class="col-body">${cells || '<p class="muted">Texnika yoxdur</p>'}</div>
    </div>`;
}

function cell(t, ri) {
  const f = state.filters;
  const cov = L[t.coverage];
  const open = t.sub_total > 0 && (f.subs || state.expanded.has(t.id));
  const dim = anyFilter() && !(matches(t) || t.subs.some(matches));

  const subBar = t.sub_total
    ? `<span class="subbar" title="${t.sub_total} alt-texnika: ${t.sub_full} tam, ${t.sub_partial} qismən">${t.subs.map((s) => `<i class="${L[s.own]}"></i>`).join("")}</span>`
    : "<span></span>";
  const rules = t.rules ? `<span>${t.rules} qayda</span>` : "";

  return `
    <div class="cell-wrap" style="--row:${ri}">
      <button class="cell ${cov}${t.blind ? " blind" : ""}${dim ? " dim" : ""}" style="--heat:${(t.score / 100).toFixed(2)}" type="button" data-open="${esc(t.id)}" aria-label="${esc(t.id)} ${esc(t.name)}, ${COV[cov]}${t.blind ? ", kor: log mənbəyi toplanmır" : ""}">
        <span class="cell-top"><span class="tid">${esc(t.id)}</span><span class="cell-flags">${t.obs ? `<span class="obs-mark" title="Son 24 saatda ${t.obs} honeypot hadisəsi">${icon("pulse")}${t.obs}</span>` : ""}${t.blind ? `<span class="blind-mark" title="Kor: log mənbəyi toplanmır">${icon("blind")}</span>` : ""}<i class="state ${cov}"></i></span></span>
        <span class="cell-name">${esc(t.name)}</span>
        <span class="cell-foot">${subBar}${rules}</span>
      </button>
      ${t.sub_total ? `<button class="exp" type="button" data-exp="${esc(t.id)}" aria-expanded="${open}" aria-label="Alt-texnikalar (${t.sub_total})" ${f.subs ? 'aria-disabled="true"' : ""}>${icon("chevron")}</button>` : ""}
      ${open ? `<div class="subs">${t.subs.map(subCell).join("")}</div>` : ""}
    </div>`;
}

function subCell(s) {
  const cov = L[s.own];
  const dim = anyFilter() && !matches(s);
  return `
    <button class="cell sub ${cov}${s.blind ? " blind" : ""}${dim ? " dim" : ""}" style="--heat:${(s.score / 100).toFixed(2)}" type="button" data-open="${esc(s.id)}" aria-label="${esc(s.id)} ${esc(s.name)}, ${COV[cov]}${s.blind ? ", kor" : ""}">
      <i class="state ${cov}"></i>
      <span class="tid">${esc(s.id.split(".")[1] ? "." + s.id.split(".")[1] : s.id)}</span>
      <span class="cell-name">${esc(s.name)}</span>
    </button>`;
}

function highlightSelected() {
  if (!matrixEl) return;
  matrixEl.querySelectorAll(".cell.selected").forEach((c) => c.classList.remove("selected"));
  if (state.selected) {
    matrixEl.querySelectorAll(`[data-open="${state.selected}"]`).forEach((c) => c.classList.add("selected"));
  }
}

document.addEventListener("ibt:select", highlightSelected);
