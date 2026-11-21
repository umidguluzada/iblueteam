import { t as tr } from "./i18n.js";
import { api } from "./api.js";
import { refresh } from "./state.js";
import { esc, icon, openModal, toast } from "./ui.js";

/* ================================================================ İdxal pəncərəsi */
export function openImportModal() {
  const m = openModal({
    title: "Qaydaları idxal et",
    wide: true,
    body: `
    <div class="seg" role="radiogroup" aria-label="Format" style="justify-self:start">
      <label><input type="radio" name="kind" value="sigma" checked><span>Sigma YAML</span></label>
      <label><input type="radio" name="kind" value="csv"><span>CSV</span></label>
    </div>

    <div data-pane="sigma" style="display:grid;gap:14px">
      <label class="drop" data-drop>
        ${icon("upload")}
        <strong>${tr("rules-import.b70bc412b0")}</strong>
        <span>${tr("rules-import.7ea5ac40e9")}</span>
        <input type="file" id="fSigma" multiple accept=".yml,.yaml">
      </label>
      <div class="files" id="lSigma"></div>
      <div class="form-grid">
        <div class="field">
          <label for="sStatus">${tr("rules-import.5a5ab78888")}</label>
          <select id="sStatus"><option value="draft">Draft</option><option value="active">Aktiv</option><option value="disabled">${tr("rules-import.396b9f5e56")}</option></select>
        </div>
        <div class="field">
          <span class="lbl">Test</span>
          <label class="check" style="min-height:38px"><input type="checkbox" id="sTested">${tr("rules-import.625f25495f")}</label>
        </div>
      </div>
      <p class="hint muted">${tr("rules-import.f5a81e9c5f")} <code>attack.t1059.001</code> ${tr("rules-import.4f768e9f90")}</p>
    </div>

    <div data-pane="csv" hidden style="display:none;gap:14px">
      <label class="drop" data-drop>
        ${icon("upload")}
        <strong>${tr("rules-import.8498951bef")}</strong>
        <span>${tr("rules-import.2a95bbbcec")}</span>
        <input type="file" id="fCsv" accept=".csv,text/csv">
      </label>
      <div class="files" id="lCsv"></div>
      <p class="hint muted">${tr("rules-import.1269d3f43f")} <code>T1059.001;T1027</code></p>
      <div><button class="btn sm" type="button" id="tplBtn">${icon("download")}CSV şablonu</button></div>
    </div>

    <div id="impResult"></div>
    <div class="modal-foot">
      <div class="right">
        <button type="button" class="btn ghost" data-close>${tr("rules-import.5544ffe398")}</button>
        <button type="button" class="btn primary" id="impGo">${tr("rules-import.c8f3ad996f")}</button>
      </div>
    </div>`,
  });

  const $ = (s) => m.el.querySelector(s);
  const kind = () => m.el.querySelector('input[name="kind"]:checked').value;

  const syncPane = () => {
    const k = kind();
    $('[data-pane="sigma"]').style.display = k === "sigma" ? "grid" : "none";
    $('[data-pane="csv"]').style.display = k === "csv" ? "grid" : "none";
    $("#impResult").innerHTML = "";
  };
  m.el.querySelectorAll('input[name="kind"]').forEach((r) => r.addEventListener("change", syncPane));

  const listFiles = (input, target) => {
    target.innerHTML = [...input.files].map((f) => `<div>${esc(f.name)} <span class="muted">(${(f.size / 1024).toFixed(1)} KB)</span></div>`).join("");
  };
  $("#fSigma").addEventListener("change", (e) => listFiles(e.target, $("#lSigma")));
  $("#fCsv").addEventListener("change", (e) => listFiles(e.target, $("#lCsv")));

  m.el.querySelectorAll("[data-drop]").forEach((zone) => {
    const input = zone.querySelector("input");
    ["dragenter", "dragover"].forEach((ev) =>
      zone.addEventListener(ev, (e) => {
        e.preventDefault();
        zone.classList.add("over");
      })
    );
    ["dragleave", "drop"].forEach((ev) => zone.addEventListener(ev, () => zone.classList.remove("over")));
    zone.addEventListener("drop", (e) => {
      e.preventDefault();
      if (!e.dataTransfer.files.length) return;
      input.files = e.dataTransfer.files;
      input.dispatchEvent(new Event("change"));
    });
  });

  $("#tplBtn").addEventListener("click", () => {
    const csv =
      "name,source,status,quality,tested,techniques,logsource,data_sources,description\n" +
      "Nümunə qayda,Splunk,active,4,true,T1059.001;T1027,Sysmon,WinEventLog:Sysmon,Qaydanın qısa təsviri\n";
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv" }));
    a.download = "ibluteam-rules-template.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  });

  $("#impGo").addEventListener("click", async () => {
    const out = $("#impResult");
    const k = kind();
    const input = k === "sigma" ? $("#fSigma") : $("#fCsv");
    if (!input.files.length) {
      out.innerHTML = `<div class="err">${tr("rules-import.bcfb90ab58")}</div>`;
      return;
    }
    const fd = new FormData();
    let url;
    if (k === "sigma") {
      [...input.files].forEach((f) => fd.append("files", f));
      fd.append("status", $("#sStatus").value);
      fd.append("tested", $("#sTested").checked ? "true" : "false");
      url = "/api/rules/upload-sigma";
    } else {
      fd.append("file", input.files[0]);
      url = "/api/rules/import-csv";
    }

    const btn = $("#impGo");
    btn.disabled = true;
    try {
      const res = await api.upload(url, fd);
      out.innerHTML = `
        <div class="result">
          <div class="ok">${res.created} qayda əlavə edildi</div>
          ${res.unknown_techniques.length ? `<div>ATT&amp;CK-da tapılmayan texnikalar (bağlanmadı): ${res.unknown_techniques.map(esc).join(", ")}</div>` : ""}
          ${res.skipped.length ? `<div>Atlananlar:</div><ul>${res.skipped.map((s) => `<li>${esc(s.file)}: ${esc(s.reason)}</li>`).join("")}</ul>` : ""}
        </div>`;
      if (res.created) {
        toast(`${res.created} qayda idxal edildi`, "ok");
        await refresh();
      }
    } catch (e) {
      out.innerHTML = `<div class="err">${esc(e.message)}</div>`;
    } finally {
      btn.disabled = false;
    }
  });
}
