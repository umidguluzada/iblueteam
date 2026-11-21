import { t as tr } from "./i18n.js";
import { api } from "./api.js";
import { state, refresh } from "./state.js";
import { esc, icon, openModal, toast, loadingHtml, STATUS, TEST, qBars } from "./ui.js";
import { isAuthed, requireLogin } from "./auth.js";
import { openImportModal } from "./rules-import.js";

export { openImportModal };

let all = [];
const rf = { q: "", status: "", source: "" };

const shortSrc = (n) => n.split(":").slice(1).join(":") || n;
const collectedSet = () => new Set(state.sources.filter((s) => s.collected).map((s) => s.name));

function srcChips(names, limit = 3) {
  if (!names.length) return `<span class="muted">${tr("rules.5dedd16021")}</span>`;
  const ok = collectedSet();
  const shown = names.slice(0, limit);
  const more = names.length - shown.length;
  return `<div class="tchips" style="margin:0">${shown
    .map((n) => `<span class="tchip${ok.has(n) ? "" : " off"}" title="${esc(n)}${ok.has(n) ? "" : ": toplanmır"}">${esc(shortSrc(n))}</span>`)
    .join("")}${more > 0 ? `<span class="tchip">+${more}</span>` : ""}</div>`;
}

/* ================================================================ Qaydalar siyahısı */
export async function renderRules(root) {
  root.innerHTML = `<div class="page">${loadingHtml()}</div>`;
  all = await api.get("/api/rules");
  const sources = [...new Set(all.map((r) => r.source))].sort();

  const userRole = state.user?.role;
  root.innerHTML = `
    <div class="page">
      <div class="page-head">
        <div>
          <h1>Qaydalar</h1>
          <p>${tr("rules.4205edd969")}</p>
        </div>
        <div class="page-actions">
          ${userRole !== "reviewer" ? `<button class="btn" type="button" id="importBtn">${icon("upload")}İdxal et</button>
          <button class="btn primary" type="button" id="newBtn">${icon("plus")}Yeni qayda</button>` : ""}
        </div>
      </div>

      <div class="filters">
        <label class="search">${icon("search")}<input id="rq" type="search" placeholder="Qayda adı axtar" aria-label="Qayda axtar" value="${esc(rf.q)}"></label>
        <select id="rs" aria-label="Status">
          <option value="">${tr("rules.676304e681")}</option>
          ${Object.entries(STATUS).map(([k, v]) => `<option value="${k}" ${rf.status === k ? "selected" : ""}>${v}</option>`).join("")}
        </select>
        <select id="rsrc" aria-label="Mənbə">
          <option value="">${tr("rules.bf0b815028")}</option>
          ${sources.map((s) => `<option ${rf.source === s ? "selected" : ""}>${esc(s)}</option>`).join("")}
        </select>
      </div>

      <div class="review-queue"><a class="btn" href="#/reviews">${tr("rules.05c5bca6c4")}</a></div>
      <div id="rulesTable"></div>
    </div>`;

  paintRows(root);

  root.querySelector("#rq").addEventListener("input", (e) => {
    rf.q = e.target.value.trim();
    paintRows(root);
  });
  root.querySelector("#rs").addEventListener("change", (e) => {
    rf.status = e.target.value;
    paintRows(root);
  });
  root.querySelector("#rsrc").addEventListener("change", (e) => {
    rf.source = e.target.value;
    paintRows(root);
  });
  root.querySelector("#newBtn")?.addEventListener("click", () => requireLogin(() => openRuleModal()));
  root.querySelector("#importBtn")?.addEventListener("click", () => requireLogin(() => openImportModal()));
}

function paintRows(root) {
  const box = root.querySelector("#rulesTable");
  const rows = all.filter(
    (r) =>
      (!rf.q || r.name.toLowerCase().includes(rf.q.toLowerCase())) &&
      (!rf.status || r.status === rf.status) &&
      (!rf.source || r.source === rf.source)
  );

  if (!all.length) {
    box.innerHTML = `
      <div class="empty">
        <h3>${tr("rules.7f949cb1e3")}</h3>
        <p>${tr("rules.ff346130d9")}</p>
        <div class="row">
          <button class="btn" type="button" data-act="import">${icon("upload")}İdxal et</button>
          <button class="btn primary" type="button" data-act="new">${icon("plus")}Yeni qayda</button>
        </div>
      </div>`;
    box.onclick = (e) => {
      const a = e.target.closest("[data-act]")?.dataset.act;
      if (a === "import") requireLogin(() => openImportModal());
      if (a === "new") requireLogin(() => openRuleModal());
    };
    return;
  }
  if (!rows.length) {
    box.innerHTML = `<div class="empty"><h3>${tr("rules.d6cb5c0f9c")}</h3><p>${tr("rules.1002ed6c99")}</p></div>`;
    return;
  }

  box.innerHTML = `
    <p class="muted" style="margin-bottom:10px">${rows.length} qayda</p>
    <div class="table-wrap rules-table-wrap">
      <table class="rules-list-table">
        <thead><tr><th>Qayda</th><th>${tr("rules.43c1041d43")}</th><th>Status</th><th>Son test</th><th class="hide-md">${tr("rules.cee2f3d9ba")}</th><th>${tr("rules.c9060edeb9")}</th><th>Yoxlama</th></tr></thead>
        <tbody>
          ${rows
            .map((r) => {
              const shown = r.techniques.slice(0, 4);
              const more = r.techniques.length - shown.length;
              const last = r.tests[0];
              return `
            <tr tabindex="0" data-rule="${r.id}">
              <td>
                <div class="name">${esc(r.name)}</div>
                ${r.techniques.length ? `<div class="tchips">${shown.map((t) => `<span class="tchip">${esc(t)}</span>`).join("")}${more > 0 ? `<span class="tchip">+${more}</span>` : ""}</div>` : `<div class="sub-line">${tr("rules.c64e9415d5")}</div>`}
              </td>
              <td>${esc(r.source)}</td>
              <td>
                <span class="pill ${r.level}" title="Əhatəyə töhfəsi: ${r.level === "full" ? "tam" : r.level === "partial" ? "qismən" : "yoxdur"}"><i class="state ${r.level}"></i>${STATUS[r.status]}</span>
                ${r.blind ? `<span class="pill blind" style="margin-left:6px" title="Log mənbəyi toplanmır: ${esc(r.missing_sources.join(", "))}">${icon("blind")}Kor</span>` : ""}
              </td>
              <td class="num rules-last-test">${last ? `<span class="pill ${last.result === "pass" ? "full" : "fail"}" title="${esc(last.method)}">${TEST[last.result]}</span> <span class="muted">${esc(last.tested_at)}</span>` : r.tested ? esc(r.last_tested || tr("overview.testedFixed")) : `<span class="muted">${tr("rules.5ee905128e")}</span>`}</td>
              <td class="hide-md">${srcChips(r.data_sources)}</td>
              <td><span class="q" title="${r.quality}/5">${qBars(r.quality)}</span></td>
              <td>${state.user && state.user.role !== "reviewer" ? `<button class="btn" type="button" data-submit="${r.id}">${tr("rules.ae6b8d3be6")}</button>` : ""}</td>
            </tr>`;
            })
            .join("")}
        </tbody>
      </table>
    </div>`;

  const open = (tr) => {
    if (state.user?.role === "reviewer") {
      openRuleReadOnly(all.find((item) => String(item.id) === tr.dataset.rule));
      return;
    }
    openRuleModal(all.find((r) => String(r.id) === tr.dataset.rule));
  };
  box.onclick = async (e) => {
    const submit = e.target.closest("[data-submit]");
    if (submit) {
      e.stopPropagation();
      try {
        const comment = window.prompt("Yoxlama üçün qeyd (istəyə bağlı):", "");
        if (comment === null) return;
        await api.post(`/api/rules/${submit.dataset.submit}/submit-review`, {comment});
        toast("Qayda yoxlamaya göndərildi. Yoxlamalar səhifəsində Pending kimi görünəcək.", "ok");
        await renderRules(root);
      } catch (err) { toast(err.message); }
      return;
    }
    const tr = e.target.closest("tr[data-rule]");
    if (tr) open(tr);
  };
  box.onkeydown = (e) => {
    if (e.key === "Enter" && e.target.matches("tr[data-rule]")) open(e.target);
  };
}

/* ================================================================ Etiket redaktoru (texnika və log mənbəyi) */
function tagEditor({ box, input, values, seps, normalize, resolve, errEl, noun, decorate }) {
  const render = () => {
    box.querySelectorAll(".tag").forEach((n) => n.remove());
    values.forEach((v) => {
      const s = document.createElement("span");
      s.className = "tag";
      s.innerHTML = `${decorate ? decorate(v) : ""}${esc(v)}<button type="button" data-rm="${esc(v)}" aria-label="${esc(v)} ${noun} sil">${icon("close")}</button>`;
      box.insertBefore(s, input);
    });
  };
  const add = (raw) => {
    const text = normalize(raw);
    if (!text) return true;
    const found = resolve(text);
    if (!found) {
      errEl.textContent = `«${raw.trim()}» tapılmadı`;
      return false;
    }
    if (!values.includes(found)) values.push(found);
    errEl.textContent = "";
    render();
    return true;
  };
  render();
  box.addEventListener("click", (e) => {
    const rm = e.target.closest("[data-rm]");
    if (rm) {
      values.splice(values.indexOf(rm.dataset.rm), 1);
      render();
    } else {
      input.focus();
    }
  });
  input.addEventListener("keydown", (e) => {
    if (seps.includes(e.key) && input.value.trim()) {
      e.preventDefault();
      if (add(input.value)) input.value = "";
    } else if (e.key === "Backspace" && !input.value && values.length) {
      values.pop();
      render();
    }
  });
  input.addEventListener("change", () => {
    if (input.value.trim() && add(input.value)) input.value = "";
  });
  return { add, values };
}

/* ================================================================ Qayda formu */
export function openRuleReadOnly(rule) {
  if (!rule) return;
  return openModal({
    title: "Qaydaya baxış",
    body: `<div class="field"><b>${esc(rule.name)}</b><p>${esc(rule.description || "Təsvir yoxdur")}</p><p>Status: ${esc(rule.status)} · Keyfiyyət: ${rule.quality}/5</p><p>Texnikalar: ${esc((rule.techniques || []).join(", "))}</p><p>Log mənbələri: ${esc((rule.data_sources || []).join(", "))}</p><pre style="white-space:pre-wrap;overflow-wrap:anywhere;max-height:240px;overflow:auto">${esc(rule.content || "Qayda məzmunu yoxdur")}</pre></div>`
  });
}

export function openRuleModal(rule = null, preset = {}) {
  if (state.user?.role === "reviewer") {
    if (rule) return openRuleReadOnly(rule);
    toast("Reviewer qayda yarada bilməz");
    return;
  }
  const known = new Set(state.index.map((x) => x.id));
  const catalog = new Map(state.sources.map((s) => [s.name.toLowerCase(), s]));
  const ro = !isAuthed();
  const r = rule || {
    name: "",
    source: "Manual",
    status: "draft",
    quality: 3,
    tested: false,
    last_tested: "",
    logsource: "",
    description: "",
    content: "",
    techniques: (preset.techniques || []).filter((id) => known.has(id)),
    data_sources: [],
    tests: [],
  };
  const techs = [...r.techniques];
  const srcs = [...r.data_sources];

  const seg = (name, items, current) =>
    `<div class="seg" role="radiogroup" aria-label="${name}">${items
      .map(([v, label]) => `<label><input type="radio" name="${name}" value="${v}" ${String(current) === String(v) ? "checked" : ""}><span>${label}</span></label>`)
      .join("")}</div>`;

  const m = openModal({
    title: rule ? (ro ? "Qayda" : "Qaydanı redaktə et") : "Yeni qayda",
    wide: true,
    body: `
    <form id="ruleForm" novalidate style="display:grid;gap:16px">
      <fieldset class="plain" ${ro ? "disabled" : ""}>
      <div class="form-grid">
        <div class="field full">
          <label for="rName">${tr("rules.8e20ead5c7")}</label>
          <input id="rName" type="text" maxlength="200" value="${esc(r.name)}" placeholder="məs: Encoded PowerShell Command Line">
        </div>
        <div class="field">
          <label for="rSource">${tr("rules.43c1041d43")}</label>
          <input id="rSource" type="text" list="srcList" maxlength="60" value="${esc(r.source)}">
          <datalist id="srcList">${["Sigma", "Splunk", "Elastic", "Sentinel", "QRadar", "Manual"].map((s) => `<option value="${s}">`).join("")}</datalist>
        </div>
        <div class="field">
          <span class="lbl">Status</span>
          ${seg("status", [["draft", "Draft"], ["active", "Aktiv"], ["disabled", "Söndürülüb"]], r.status)}
        </div>
        <div class="field">
          <span class="lbl">${tr("rules.c9060edeb9")}</span>
          ${seg("quality", [1, 2, 3, 4, 5].map((n) => [n, n]), r.quality)}
        </div>
        <div class="field" id="testField"></div>
        <div class="field full">
          <label for="rTech">${tr("rules.d65ceecb4e")}</label>
          <div class="tags" id="tagBox"><input id="rTech" type="text" list="techList" placeholder="T1059.001 yazın və ya siyahıdan seçin" autocomplete="off"></div>
          <datalist id="techList">${state.index.map((x) => `<option value="${esc(x.id)}" label="${esc(x.name)}">`).join("")}</datalist>
          <span class="hint">${tr("rules.49627e1e3c")}</span>
        </div>
        <div class="field full">
          <label for="rSrc">${tr("rules.237e014798")}</label>
          <div class="tags" id="srcBox"><input id="rSrc" type="text" list="srcCatalog" placeholder="məs: WinEventLog:Sysmon" autocomplete="off"></div>
          <datalist id="srcCatalog">${state.sources.map((s) => `<option value="${esc(s.name)}" label="${s.collected ? "toplanır" : "toplanmır"}">`).join("")}</datalist>
          <span class="hint">${tr("rules.35cf6d41fb")}</span>
        </div>
        <div class="field full">
          <label for="rLog">${tr("rules.e6d2adac0c")}</label>
          <input id="rLog" type="text" value="${esc(r.logsource)}" placeholder="məs: windows / process_creation">
        </div>
        <div class="field full">
          <label for="rDesc">${tr("rules.bf9b643448")}</label>
          <textarea id="rDesc" placeholder="Qayda nəyi aşkar edir və niyə vacibdir?">${esc(r.description)}</textarea>
        </div>
        <div class="field full">
          <label for="rContent">${tr("rules.5b31ef8505")}</label>
          <textarea id="rContent" class="code" spellcheck="false">${esc(r.content)}</textarea>
        </div>
      </div>
      </fieldset>
      <div class="err" id="rErr" role="alert"></div>
      <div class="modal-foot">
        ${rule && !ro ? `<button type="button" class="btn danger" id="rDel">${tr("testHistory.delete")}</button>` : ""}
        <div class="right">
          <button type="button" class="btn ghost" data-close>${ro ? "Bağla" : "Ləğv et"}</button>
          ${ro ? `<button type="button" class="btn primary" id="rLogin">${tr("rules.28e164390c")}</button>` : `<button class="btn primary" type="submit">${rule ? "Yadda saxla" : "Qaydanı əlavə et"}</button>`}
        </div>
      </div>
    </form>
    <section id="testSec" class="test-sec"></section>`,
  });

  const $ = (sel) => m.el.querySelector(sel);
  const err = $("#rErr");

  const techEd = tagEditor({
    box: $("#tagBox"), input: $("#rTech"), values: techs, seps: ["Enter", ",", ";", " "], errEl: err, noun: "texnikasını",
    normalize: (raw) => raw.trim().toUpperCase().replace(/[,;\s]+/g, ""),
    resolve: (id) => (known.has(id) || /^T\d{4}(\.\d{3})?$/.test(id) ? id : null), // ləğv olunmuş ID-ni server çevirir
  });
  const srcEd = tagEditor({
    box: $("#srcBox"), input: $("#rSrc"), values: srcs, seps: ["Enter", ","], errEl: err, noun: "mənbəyini",
    normalize: (raw) => raw.trim().replace(/,+$/, ""),
    resolve: (t) => catalog.get(t.toLowerCase())?.name || null,
    decorate: (n) => `<i class="state ${catalog.get(n.toLowerCase())?.collected ? "full" : "gap"}" title="${catalog.get(n.toLowerCase())?.collected ? "toplanır" : "toplanmır"}"></i>`,
  });

  /* test sahəsi: test qeydləri varsa, nəticə onlardan çıxarılır */
  const paintTestField = () => {
    const f = $("#testField");
    if (r.tests.length) {
      const t = r.tests[0];
      f.innerHTML = `<span class="lbl">Test</span><div style="min-height:38px;display:flex;align-items:center;gap:8px"><span class="pill ${t.result === "pass" ? "full" : "fail"}">${TEST[t.result]}</span><span class="muted">${esc(t.tested_at)}, ${r.tests.length} qeyd</span></div>`;
    } else {
      f.innerHTML = `<span class="lbl">Test</span>
        <div style="display:flex;gap:12px;align-items:center;min-height:38px">
          <label class="check"><input type="checkbox" id="rTested" ${r.tested ? "checked" : ""}>${tr("overview.testedFixed")}</label>
          <input id="rDate" type="date" style="width:auto" aria-label="Son test tarixi" value="${esc(r.last_tested || "")}" ${r.tested ? "" : "disabled"}>
        </div>`;
      $("#rTested").addEventListener("change", (e) => {
        const d = $("#rDate");
        d.disabled = !e.target.checked;
        if (e.target.checked && !d.value) d.value = new Date().toISOString().slice(0, 10);
      });
    }
  };
  paintTestField();

  /* test qeydləri bölməsi */
  const paintTests = () => {
    const sec = $("#testSec");
    if (!rule) {
      sec.innerHTML = `<h3>${tr("rules.3b4fde9c3c")}</h3><p class="muted">${tr("rules.4d9aeb2dc2")}</p>`;
      return;
    }
    sec.innerHTML = `
      <h3>${tr("rules.3b4fde9c3c")} <span>${r.tests.length}</span></h3>
      ${r.tests.length
        ? `<div class="list">${r.tests
            .map(
              (t) => `
          <div class="note-item">
            <div class="meta" style="margin:0 0 6px">
              <span><span class="pill ${t.result === "pass" ? "full" : "fail"}">${TEST[t.result]}</span> <span class="muted" style="margin-left:6px">${esc(t.tested_at)}${t.tester ? ", " + esc(t.tester) : ""}</span></span>
              ${ro ? "" : `<button class="link" type="button" data-deltest="${t.id}">${tr("testHistory.delete")}</button>`}
            </div>
            ${t.method ? `<p><b style="font-weight:600">${tr("rules.fe5342eb06")}</b> ${esc(t.method)}</p>` : ""}
            ${t.notes ? `<p class="muted" style="margin-top:4px">${esc(t.notes)}</p>` : ""}
          </div>`
            )
            .join("")}</div>`
        : `<p class="muted">${tr("rules.c9ec28b19a")}</p>`}
      ${ro ? "" : `
      <form id="testForm" class="note-form" novalidate style="margin-top:12px">
        <div class="form-grid">
          <div class="field"><label for="tDate">${tr("testHistory.date")}</label><input id="tDate" type="date" value="${new Date().toISOString().slice(0, 10)}"></div>
          <div class="field"><span class="lbl">${tr("rules.5d29007c29")}</span>${seg("tres", [["pass", tr("testHistory.passed")], ["fail", tr("testHistory.failed")]], "pass")}</div>
          <div class="field full"><label for="tMethod">${tr("rules.714234db15")}</label><input id="tMethod" type="text" maxlength="200" placeholder="${tr("testHistory.methodPlaceholder")}"></div>
          <div class="field full"><label for="tNotes">${tr("testHistory.note")}</label><textarea id="tNotes" maxlength="1500" placeholder="${tr("testHistory.notesPlaceholder")}"></textarea></div>
        </div>
        <div class="err" id="tErr" role="alert"></div>
        <div><button class="btn" type="submit">${icon("plus")}Test qeydi əlavə et</button></div>
      </form>`}`;
  };
  paintTests();

  $("#testSec").addEventListener("click", async (e) => {
    const d = e.target.closest("[data-deltest]");
    if (!d) return;
    try {
      await api.del(`/api/tests/${d.dataset.deltest}`);
      r.tests = r.tests.filter((t) => String(t.id) !== d.dataset.deltest);
      toast(tr("testHistory.deleted"));
      paintTests();
      paintTestField();
      await refresh();
    } catch (ex) {
      toast(ex.message, "error");
    }
  });
  $("#testSec").addEventListener("submit", async (e) => {
    e.preventDefault();
    const tErr = $("#tErr");
    const date = $("#tDate").value;
    if (!date) {
      tErr.textContent = tr("testHistory.selectDate");
      return;
    }
    try {
      const res = await api.post(`/api/rules/${rule.id}/tests`, {
        tested_at: date,
        result: $('input[name="tres"]:checked').value,
        method: $("#tMethod").value.trim(),
        notes: $("#tNotes").value.trim(),
      });
      r.tests = res.tests;
      r.tested = res.tested;
      r.last_tested = res.last_tested;
      toast(tr("testHistory.added"), "ok");
      paintTests();
      paintTestField();
      await refresh();
    } catch (ex) {
      tErr.textContent = ex.message;
    }
  });

  $("#rLogin")?.addEventListener("click", () => {
    m.close();
    requireLogin(() => openRuleModal(rule, preset));
  });

  // silmə: iki mərhələli təsdiq
  const del = $("#rDel");
  if (del) {
    let armed = false;
    del.addEventListener("click", async () => {
      if (!armed) {
        armed = true;
        del.textContent = "Əminsiniz? Sil";
        setTimeout(() => {
          armed = false;
          del.textContent = "Sil";
        }, 4000);
        return;
      }
      try {
        await api.del(`/api/rules/${rule.id}`);
        m.close();
        toast("Qayda silindi");
        await refresh();
      } catch (e) {
        err.textContent = e.message;
      }
    });
  }

  $("#ruleForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    if (ro) return;
    if ($("#rTech").value.trim() && !techEd.add($("#rTech").value)) return;
    $("#rTech").value = "";
    if ($("#rSrc").value.trim() && !srcEd.add($("#rSrc").value)) return;
    $("#rSrc").value = "";

    const name = $("#rName").value.trim();
    if (!name) {
      err.textContent = "Qayda adı boş ola bilməz";
      $("#rName").focus();
      return;
    }
    const tested = r.tests.length ? r.tested : !!$("#rTested")?.checked;
    const body = {
      name,
      source: $("#rSource").value.trim() || "Manual",
      status: m.el.querySelector('input[name="status"]:checked').value,
      quality: Number(m.el.querySelector('input[name="quality"]:checked').value),
      tested,
      last_tested: r.tests.length ? r.last_tested : tested ? $("#rDate").value || null : null,
      logsource: $("#rLog").value.trim(),
      description: $("#rDesc").value.trim(),
      content: $("#rContent").value,
      techniques: techs,
      data_sources: srcs,
    };
    try {
      if (rule) await api.put(`/api/rules/${rule.id}`, body);
      else await api.post("/api/rules", body);
      m.close();
      toast(rule ? "Qayda yeniləndi" : "Qayda əlavə edildi", "ok");
      await refresh();
    } catch (ex) {
      err.textContent = ex.message;
    }
  });
}

