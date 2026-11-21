import { t as tr, translateText } from "./i18n.js";
import { api } from "./api.js";
import { state, platformParam, refresh } from "./state.js";
import { esc, icon, loadingHtml, COV, PRIO, platformSelectHtml } from "./ui.js";
import { openPanel } from "./panel.js";

let data = [];
const gf = { q: "", cov: "", tactic: "", prio: "" };

export async function renderGaps(root) {
  root.innerHTML = `<div class="page">${loadingHtml()}</div>`;
  data = await api.get(`/api/gaps?platform=${platformParam()}`);
  const tactics = state.matrix.tactics.map((t) => t.name);
  const p = platformParam();

  root.innerHTML = `
    <div class="page">
      <div class="page-head">
        <div>
          <h1>${tr("gaps.f7c7de9929")}</h1>
          <p>${tr("gaps.11245915a6")}</p>
        </div>
        <div class="page-actions">
          ${platformSelectHtml(state)}
          <a class="btn" href="/api/export/gaps.csv?platform=${p}" download>${icon("download")}${tr("gaps.exportCsv")}</a>
        </div>
      </div>

      <div class="filters">
        <label class="search">${icon("search")}<input id="gq" type="search" placeholder="${tr("gaps.searchPlaceholder")}" aria-label="${tr("gaps.searchAria")}" value="${esc(gf.q)}"></label>
        <select id="gc" aria-label="${tr("gaps.coverageAria")}">
          <option value="">${tr("gaps.29e9549fff")}</option>
          <option value="gap" ${gf.cov === "gap" ? "selected" : ""}>${tr("gaps.8da6448005")}</option>
          <option value="partial" ${gf.cov === "partial" ? "selected" : ""}>${tr("gaps.0550aa7dbf")}</option>
          <option value="blind" ${gf.cov === "blind" ? "selected" : ""}>${tr("gaps.c20613c99f")}</option>
        </select>
        <select id="gt" aria-label="${tr("gaps.tacticAria")}">
          <option value="">${tr("gaps.fed260e35d")}</option>
          ${tactics.map((t) => `<option ${gf.tactic === t ? "selected" : ""}>${esc(t)}</option>`).join("")}
        </select>
        <select id="gp" aria-label="${tr("gaps.priorityAria")}">
          <option value="">${tr("gaps.b9a5693d57")}</option>
          ${Object.entries(PRIO).map(([k, v]) => `<option value="${k}" ${gf.prio === k ? "selected" : ""}>${esc(translateText(v))}</option>`).join("")}
        </select>
      </div>
      <div id="gapTable"></div>
    </div>`;

  paintRows(root);
  const bind = (sel, key, ev = "change") =>
    root.querySelector(sel).addEventListener(ev, (e) => {
      gf[key] = e.target.value.trim();
      paintRows(root);
    });
  bind("#gq", "q", "input");
  bind("#gc", "cov");
  bind("#gt", "tactic");
  bind("#gp", "prio");
  root.querySelector("#platform").addEventListener("change", async (e) => {
    state.filters.platform = e.target.value;
    await refresh();
  });
}

function paintRows(root) {
  const box = root.querySelector("#gapTable");
  const rows = data.filter(
    (g) =>
      (!gf.q || g.id.toLowerCase().includes(gf.q.toLowerCase()) || g.name.toLowerCase().includes(gf.q.toLowerCase())) &&
      (!gf.cov || (gf.cov === "blind" ? g.blind : g.coverage === gf.cov)) &&
      (!gf.tactic || g.tactics.includes(gf.tactic)) &&
      (!gf.prio || g.priority === gf.prio)
  );

  if (!data.length) {
    box.innerHTML = `<div class="empty"><h3>${tr("gaps.be51f87670")}</h3><p>${tr("gaps.9f52ef47d0")}</p></div>`;
    return;
  }
  if (!rows.length) {
    box.innerHTML = `<div class="empty"><h3>${tr("gaps.5f610bd7a9")}</h3><p>${tr("gaps.1002ed6c99")}</p></div>`;
    return;
  }

  box.innerHTML = `
    <p class="muted" style="margin-bottom:10px">${tr("gaps.techniqueCount", {count: rows.length})}</p>
    <div class="table-wrap">
      <table class="gap-results-table">
        <thead><tr><th>#</th><th>${tr("gaps.technique")}</th><th class="hide-md">${tr("gaps.tactic")}</th><th>${tr("gaps.2671d5ea9f")}</th><th>${tr("gaps.cb604541fe")}</th><th title="${tr("gaps.groupsTitle")}">${tr("gaps.group")}</th><th title="${tr("gaps.honeypotTitle")}">Honeypot</th><th>${tr("gaps.score")}</th></tr></thead>
        <tbody>
          ${rows
            .map(
              (g) => `
            <tr tabindex="0" data-id="${esc(g.id)}">
              <td class="num muted">${g.rank}</td>
              <td><div class="name">${esc(g.name)}</div><div class="sub-line tid">${esc(g.id)}${g.priority ? ` <span class="pill ${g.priority === "high" ? "prio-high" : ""}" style="margin-left:6px">${esc(translateText(PRIO[g.priority]))}</span>` : ""}</div></td>
              <td class="muted hide-md">${esc(g.tactics.join(", "))}</td>
              <td><span class="pill ${g.coverage}"><i class="state ${g.coverage}"></i>${esc(translateText(COV[g.coverage]))}</span>${g.blind ? `<span class="pill blind" style="margin-left:6px">${icon("blind")}${tr("gaps.blind")}</span>` : ""}</td>
              <td class="reason">${esc(translateText(g.reason))}</td>
              <td class="num">${g.groups || '<span class="muted">0</span>'}</td>
              <td class="num">${g.obs || '<span class="muted">0</span>'}</td>
              <td class="num"><b style="font-weight:600">${g.score}</b></td>
            </tr>`
            )
            .join("")}
        </tbody>
      </table>
    </div>`;

  box.onclick = (e) => {
    const tr = e.target.closest("tr[data-id]");
    if (tr) openPanel(tr.dataset.id);
  };
  box.onkeydown = (e) => {
    if (e.key === "Enter" && e.target.matches("tr[data-id]")) openPanel(e.target.dataset.id);
  };
}
