import { t as tr } from "./i18n.js";
import { api } from "./api.js";
import { state, onRefresh } from "./state.js";
import { esc, icon, toast, loadingHtml, COV, STATUS, PRIO, TEST, qBars } from "./ui.js";
import { openRuleModal, openRuleReadOnly } from "./rules.js";
import { isAuthed, requireLogin } from "./auth.js";

const el = () => document.getElementById("panel");
const announce = () => document.dispatchEvent(new Event("ibt:select"));
let token = 0;

export const isOpen = () => el().classList.contains("open");

export async function openPanel(tid) {
  const p = el();
  const wasOpen = isOpen();
  state.selected = tid;
  announce();
  p.classList.add("open");
  p.setAttribute("aria-hidden", "false");
  if (!wasOpen) p.innerHTML = loadingHtml();
  await load(tid, true);
}

export function closePanel() {
  const p = el();
  p.classList.remove("open");
  p.setAttribute("aria-hidden", "true");
  state.selected = null;
  announce();
}

async function load(tid, focus) {
  const my = ++token;
  try {
    const t = await api.get(`/api/techniques/${encodeURIComponent(tid)}`);
    if (my !== token) return; // daha yeni sorğu gəlib
    paint(t);
    if (focus) {
      const body = el().querySelector(".panel-body");
      if (body) body.scrollTop = 0;
      el().querySelector("h2")?.focus({ preventScroll: true });
    }
  } catch (e) {
    if (my === token) {
      toast(e.message, "error");
      closePanel();
    }
  }
}

const reload = () => {
  if (isOpen() && state.selected) load(state.selected, false);
};
onRefresh(reload);
document.addEventListener("ibt:auth", reload);

function paint(t) {
  const p = el();
  const authed = isAuthed();
  const covNote =
    t.subs.length && t.coverage !== "gap" && t.own === "gap"
      ? `<p class="notice">${tr("panel.59d054045f")}</p>`
      : "";
  const tests = t.rules
    .flatMap((r) => r.tests.map((x) => ({ ...x, rule: r.name })))
    .sort((a, b) => (a.tested_at < b.tested_at ? 1 : a.tested_at > b.tested_at ? -1 : b.id - a.id))
    .slice(0, 6);

  p.innerHTML = `
    <div class="panel-head">
      <div>
        <div class="row">
          <span class="tid">${esc(t.id)}</span>
          <span class="pill ${t.coverage}"><i class="state ${t.coverage}"></i>${COV[t.coverage]}</span>
          ${t.blind ? `<span class="pill blind" title="Aşkarlama yoxdur və səbəb telemetriyadır">${icon("blind")}Kor</span>` : ""}
        </div>
        <h2 tabindex="-1">${esc(t.name)}</h2>
      </div>
      <button class="icon-btn" type="button" data-act="close" aria-label="Paneli bağla">${icon("close")}</button>
    </div>

    <div class="panel-body">
      ${t.parent ? `<p class="crumb">Alt-texnika. Ana texnika: <button class="link" type="button" data-open="${esc(t.parent.id)}">${esc(t.parent.id)} ${esc(t.parent.name)}</button></p>` : ""}

      <dl class="facts">
        <div><dt>Taktikalar</dt><dd>${esc(t.tactics.join(", ")) || "—"}</dd></div>
        <div><dt>Platformalar</dt><dd>${esc(t.platforms.join(", ")) || "—"}</dd></div>
        <div><dt>Qruplar</dt><dd>${t.groups ? `${t.groups} ATT&amp;CK qrupu istifadə edir` : "Qrup məlumatı yoxdur"}</dd></div>
        ${t.obs && t.obs.count ? `<div><dt>Honeypot</dt><dd>Son 24 saatda ${t.obs.count} hadisə</dd></div>` : ""}
        ${t.coverage !== "gap" ? `<div><dt>${tr("panel.2518ce451a")}</dt><dd>${t.score} / 100</dd></div>` : ""}
      </dl>

      ${t.gap_reason ? `<p class="notice${t.blind ? " warn" : ""}">${esc(t.gap_reason)}</p>` : ""}

      ${t.description ? `<p class="desc">${esc(t.description)}</p>` : ""}
      ${t.url.startsWith("https://") ? `<a class="link" href="${esc(t.url)}" target="_blank" rel="noopener">${tr("panel.3e25139626")}</a>` : ""}

      ${
        t.subs.length
          ? `<section>
              <h3>Alt-texnikalar <span>${t.subs.length}</span></h3>
              <div class="list">
                ${t.subs
                  .map(
                    (s) => `
                  <button class="item" type="button" data-open="${esc(s.id)}">
                    <i class="state ${s.coverage}"></i>
                    <span class="grow"><span class="t">${esc(s.name)}</span><span class="s tid">${esc(s.id)}</span></span>
                    <span class="muted">${s.rules ? s.rules + " qayda" : ""}</span>
                  </button>`
                  )
                  .join("")}
              </div>
            </section>`
          : ""
      }

      <section>
        <h3>${tr("panel.237e014798")} <span>${t.required_sources.filter((s) => s.collected).length}/${t.required_sources.length}</span></h3>
        ${
          t.required_sources.length
            ? `<div class="srclist">${t.required_sources
                .map((s) => `<div class="srcrow"><i class="state ${s.collected ? "full" : "gap"}"></i><span class="grow">${esc(s.name)}</span><span class="muted">${s.collected ? "toplanır" : "toplanmır"}</span></div>`)
                .join("")}</div>
               <p class="hint muted" style="margin-top:8px">${tr("panel.27de6dd9df")}</p>`
            : `<p class="muted">${tr("panel.f21f441b26")}</p>`
        }
      </section>

      <section>
        <h3>${tr("panel.67ba8a90d3")} <span>${t.rules.length}</span></h3>
        ${covNote}
        ${
          t.rules.length
            ? `<div class="list">${t.rules
                .map(
                  (r) => `
              <button class="item" type="button" data-rule="${r.id}">
                <i class="state ${r.level}"></i>
                <span class="grow">
                  <span class="t">${esc(r.name)}</span>
                  <span class="s">${esc(r.source)}, ${STATUS[r.status]}, ${r.tested ? tr("overview.testedFixed") : tr("rules.5ee905128e")}${r.blind ? ", log mənbəyi toplanmır" : ""}</span>
                </span>
                <span class="q" title="Keyfiyyət ${r.quality}/5">${qBars(r.quality)}</span>
              </button>`
                )
                .join("")}</div>`
            : `<p class="muted" style="margin-bottom:10px">${tr("panel.99526d52d9")}</p>`
        }
        ${state.user?.role !== "reviewer" ? `<div style="margin-top:10px"><button class="btn sm" type="button" data-act="add-rule">${icon("plus")}Qayda əlavə et</button></div>` : ""}
      </section>

      <section>
        <h3>${tr("panel.3b4fde9c3c")} <span>${tests.length}</span></h3>
        ${
          tests.length
            ? `<div class="list">${tests
                .map(
                  (x) => `
              <div class="note-item">
                <div class="meta" style="margin:0 0 6px"><span><span class="pill ${x.result === "pass" ? "full" : "fail"}">${TEST[x.result]}</span> <span class="muted" style="margin-left:6px">${esc(x.tested_at)}</span></span></div>
                <p><b style="font-weight:600">${esc(x.rule)}</b></p>
                ${x.method ? `<p class="muted" style="margin-top:3px">Üsul: ${esc(x.method)}</p>` : ""}
                ${x.notes ? `<p class="muted" style="margin-top:3px">${esc(x.notes)}</p>` : ""}
              </div>`
                )
                .join("")}</div>`
            : `<p class="muted">${tr("panel.a500ee3a84")}</p>`
        }
      </section>

      <section>
        <h3>${tr("panel.41d6ba5de6")} <span>${t.notes.length}</span></h3>
        ${
          t.notes.length
            ? `<div class="list">${t.notes
                .map(
                  (n) => `
              <div class="note-item">
                <p>${esc(n.text)}</p>
                <div class="meta">
                  <span class="pill ${n.priority === "high" ? "prio-high" : ""}">Prioritet: ${PRIO[n.priority]}</span>
                  ${authed ? `<button class="link" type="button" data-act="del-note" data-id="${n.id}">Sil</button>` : ""}
                </div>
              </div>`
                )
                .join("")}</div>`
            : ""
        }
        ${
          authed
            ? `<form class="note-form" id="noteForm">
          <textarea name="text" placeholder="Boşluq, plan və ya log mənbəyi haqqında qeyd" aria-label="Qeyd mətni" maxlength="1000" required></textarea>
          <div class="row">
            <select name="priority" aria-label="Prioritet">
              <option value="medium">Orta prioritet</option>
              <option value="high">${tr("panel.6746fa0d5b")}</option>
              <option value="low">${tr("panel.a1673131f9")}</option>
            </select>
            <button class="btn" type="submit">${tr("panel.d216687e5f")}</button>
          </div>
        </form>`
            : `<p class="muted" style="margin-top:8px">${tr("panel.9f8dbb6597")} <button class="link" type="button" data-act="login">daxil olun</button>.</p>`
        }
      </section>
    </div>`;

  p.onclick = async (e) => {
    const c = e.target.closest("[data-act],[data-open],[data-rule]");
    if (!c) return;
    if (c.dataset.act === "close") return closePanel();
    if (c.dataset.act === "login") return requireLogin(() => {});
    if (c.dataset.open) return openPanel(c.dataset.open);
    if (c.dataset.rule) {
      const rule = t.rules.find((r) => String(r.id) === c.dataset.rule);
      return state.user?.role === "reviewer" ? openRuleReadOnly(rule) : openRuleModal(rule);
    }
    if (c.dataset.act === "add-rule") {
      if (state.user?.role === "reviewer") return toast("Reviewer qayda yarada bilməz");
      return requireLogin(() => openRuleModal(null, { techniques: [t.id] }));
    }
    if (c.dataset.act === "del-note") {
      try {
        await api.del(`/api/notes/${c.dataset.id}`);
        toast("Qeyd silindi");
        load(t.id, false);
      } catch (err) {
        toast(err.message, "error");
      }
    }
  };

  p.onsubmit = async (e) => {
    e.preventDefault();
    const f = e.target;
    const text = f.text.value.trim();
    if (!text) return;
    try {
      await api.post(`/api/techniques/${t.id}/notes`, { text, priority: f.priority.value });
      toast("Qeyd əlavə edildi", "ok");
      load(t.id, false);
    } catch (err) {
      toast(err.message, "error");
    }
  };
}
