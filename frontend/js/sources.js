import { t as tr } from "./i18n.js";
import { api } from "./api.js";
import { state, refresh } from "./state.js";
import { esc, icon, loadingHtml, openModal, toast, platformSelectHtml } from "./ui.js";
import { isAuthed, requireLogin } from "./auth.js";

const sf = { q: "", view: "all", cat: "" };
const isDefaultDesc = (d) => !d || d.startsWith("ATT&CK analitikalarında");

export async function renderSources(root) {
  const list = state.sources;
  const cats = [...new Set(list.map((s) => s.category))].sort();
  const st = state.stats.data_sources;
  const blind = state.stats.techniques.blind;

  root.innerHTML = `
    <div class="page">
      <div class="page-head">
        <div>
          <h1>${tr("sources.4522a37eb6")}</h1>
          <p>${tr("sources.85c6e65a5c")}</p>
        </div>
        <div class="page-actions">
          ${platformSelectHtml(state)}
          <button class="btn primary" type="button" id="newSrc">${icon("plus")}Mənbə əlavə et</button>
        </div>
      </div>

      <div class="stat-row" style="margin:0 0 20px">
        <div class="stat"><b>${st.collected}<small class="muted"> / ${st.total}</small></b><span>${tr("sources.018968a74f")}</span></div>
        <div class="stat"><b>${st.in_use}</b><span>${tr("sources.cdb385bb91")}</span></div>
        <div class="stat"><b>${blind}</b><span>${tr("sources.blindTechnique")}</span></div>
        <div class="stat"><b>${state.stats.rules.blind}</b><span>${tr("sources.blindRule")}</span></div>
      </div>

      <div class="filters">
        <label class="search">${icon("search")}<input id="sq" type="search" placeholder="Mənbə axtar" aria-label="Mənbə axtar" value="${esc(sf.q)}"></label>
        <select id="sv" aria-label="Görünüş">
          <option value="all" ${sf.view === "all" ? "selected" : ""}>${tr("sources.9221423c94")}</option>
          <option value="on" ${sf.view === "on" ? "selected" : ""}>${tr("sources.b1e04e55b8")}</option>
          <option value="off" ${sf.view === "off" ? "selected" : ""}>${tr("sources.b1603991be")}</option>
          <option value="used" ${sf.view === "used" ? "selected" : ""}>${tr("sources.1353675725")}</option>
        </select>
        <select id="sc" aria-label="Kateqoriya">
          <option value="">${tr("sources.6917c9282a")}</option>
          ${cats.map((c) => `<option ${sf.cat === c ? "selected" : ""}>${esc(c)}</option>`).join("")}
        </select>
      </div>
      <div id="srcTable"></div>
    </div>`;

  paintRows(root);
  root.querySelector("#sq").addEventListener("input", (e) => {
    sf.q = e.target.value.trim();
    paintRows(root);
  });
  root.querySelector("#sv").addEventListener("change", (e) => {
    sf.view = e.target.value;
    paintRows(root);
  });
  root.querySelector("#sc").addEventListener("change", (e) => {
    sf.cat = e.target.value;
    paintRows(root);
  });
  root.querySelector("#platform").addEventListener("change", async (e) => {
    state.filters.platform = e.target.value;
    await refresh();
  });
  root.querySelector("#newSrc").addEventListener("click", () => requireLogin(() => openSourceModal()));
}

function paintRows(root) {
  const box = root.querySelector("#srcTable");
  const rows = state.sources.filter(
    (s) =>
      (!sf.q || s.name.toLowerCase().includes(sf.q.toLowerCase())) &&
      (!sf.cat || s.category === sf.cat) &&
      (sf.view === "all" || (sf.view === "on" && s.collected) || (sf.view === "off" && !s.collected) || (sf.view === "used" && s.rules))
  );
  if (!rows.length) {
    box.innerHTML = `<div class="empty"><h3>${tr("sources.8c22bae620")}</h3><p>${tr("sources.1002ed6c99")}</p></div>`;
    return;
  }

  box.innerHTML = `
    <p class="muted" style="margin-bottom:10px">${rows.length} mənbə</p>
    <div class="table-wrap">
      <table>
        <thead><tr><th>${tr("sources.b1e04e55b8")}</th><th>${tr("sources.43c1041d43")}</th><th class="hide-md">${tr("sources.60818dde95")}</th><th>Qayda</th><th title="Bu mənbəni tələb edən ATT&CK texnikaları">Texnika</th></tr></thead>
        <tbody>
          ${rows
            .map(
              (s) => `
            <tr data-id="${s.id}">
              <td><label class="switch"><input type="checkbox" data-toggle="${s.id}" ${s.collected ? "checked" : ""} aria-label="${esc(s.name)} toplanır"><i></i></label></td>
              <td>
                <button class="link name" type="button" data-edit="${s.id}" style="text-align:left">${esc(s.name)}</button>
                ${isDefaultDesc(s.description) ? "" : `<div class="sub-line">${esc(s.description)}</div>`}
              </td>
              <td class="hide-md muted">${esc(s.collector) || "—"}</td>
              <td class="num">${s.rules || '<span class="muted">0</span>'}</td>
              <td class="num">${s.techniques || '<span class="muted">0</span>'}</td>
            </tr>`
            )
            .join("")}
        </tbody>
      </table>
    </div>`;

  box.onclick = (e) => {
    const ed = e.target.closest("[data-edit]");
    if (ed) requireLogin(() => openSourceModal(state.sources.find((s) => String(s.id) === ed.dataset.edit)));
  };
  box.onchange = async (e) => {
    const t = e.target.closest("[data-toggle]");
    if (!t) return;
    const want = t.checked;
    if (!isAuthed()) {
      t.checked = !want;
      requireLogin(() => {});
      return;
    }
    t.disabled = true;
    const y = window.scrollY;
    try {
      await api.put(`/api/data-sources/${t.dataset.toggle}`, { collected: want });
      toast(want ? "Mənbə toplanır kimi işarələndi" : "Mənbə toplanmır kimi işarələndi", "ok");
      await refresh();
      window.scrollTo(0, y);
    } catch (ex) {
      t.checked = !want;
      t.disabled = false;
      toast(ex.message, "error");
    }
  };
}

function openSourceModal(src = null) {
  const m = openModal({
    title: src ? "Mənbəni redaktə et" : "Yeni log mənbəyi",
    body: `
    <form id="srcForm" novalidate style="display:grid;gap:14px">
      <div class="form-grid">
        <div class="field full"><label for="sName">Ad</label><input id="sName" type="text" maxlength="120" value="${esc(src?.name || "")}" ${src ? "disabled" : ""} placeholder="məs: WinEventLog:Sysmon"></div>
        <div class="field full"><label for="sColl">${tr("sources.60818dde95")}</label><input id="sColl" type="text" maxlength="120" value="${esc(src?.collector || "")}" placeholder="məs: Winlogbeat, Sysmon v15"></div>
        <div class="field full"><label for="sDesc">${tr("sources.bf9b643448")}</label><textarea id="sDesc" maxlength="500">${esc(isDefaultDesc(src?.description) ? "" : src.description)}</textarea></div>
        <div class="field full"><label class="check"><input type="checkbox" id="sOn" ${src?.collected ? "checked" : ""}>${tr("sources.5ab3992bc8")}</label></div>
      </div>
      <div class="err" id="sErr" role="alert"></div>
      <div class="modal-foot"><div class="right"><button type="button" class="btn ghost" data-close>${tr("sources.e5e70b8ad1")}</button><button class="btn primary" type="submit">${src ? "Yadda saxla" : "Əlavə et"}</button></div></div>
    </form>`,
  });
  const $ = (s) => m.el.querySelector(s);
  $("#srcForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      const body = { collector: $("#sColl").value.trim(), description: $("#sDesc").value.trim(), collected: $("#sOn").checked };
      if (src) await api.put(`/api/data-sources/${src.id}`, body);
      else {
        const name = $("#sName").value.trim();
        if (name.length < 2) {
          $("#sErr").textContent = "Mənbə adını yazın";
          return;
        }
        await api.post("/api/data-sources", { name, ...body });
      }
      m.close();
      toast("Yadda saxlanıldı", "ok");
      await refresh();
    } catch (ex) {
      $("#sErr").textContent = ex.message;
    }
  });
}
