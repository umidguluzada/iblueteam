import { t as tr } from "./i18n.js";
import { getLanguage } from "./i18n.js";
/* Honeypot səhifəsi: real vaxtda skan və hücum statistikası, sensor idarəsi, simulyasiya, quraşdırma. */
import { api, token } from "./api.js";
import { state } from "./state.js";
import { esc, icon, loadingHtml, toast } from "./ui.js";
import { openPanel } from "./panel.js";
import { isAuthed, requireLogin } from "./auth.js";

let timer = 0;
let gen = 0;
let lastKey = ""; // yalnız bu səhifə sessiyasında, yaradılan açar bir dəfə göstərilir
const hf = { category: "", port: "", sim: true };
const CAT = { scan: "Skan", bruteforce: "Brute force", web: "Veb yoxlama", smb: "SMB cəhdi", rdp: "RDP cəhdi", database: "Verilənlər bazası", exploit: "Exploit cəhdi" };

export function stopHoneypot() {
  gen++;
  clearInterval(timer);
  timer = 0;
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement("textarea"); // http üzərindən (təhlükəsiz kontekst olmadan) ehtiyat yol
    ta.value = text;
    ta.style.cssText = "position:fixed;opacity:0";
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try {
      ok = document.execCommand("copy");
    } catch { /* kopyalanmadı */ }
    ta.remove();
    return ok;
  }
}

const bars = (items, label, value) => {
  const max = Math.max(1, ...items.map(value));
  return items.length
    ? items.map((i) => `<div class="hbar"><span class="lbl">${esc(label(i))}</span><span class="track"><i style="width:${Math.max(3, (value(i) / max) * 100)}%"></i></span><b>${value(i)}</b></div>`).join("")
    : `<p class="muted">${tr("honeypot.a77151f253")}</p>`;
};

const time = (ts) => (ts ? new Date(ts).toLocaleTimeString(getLanguage() === "en" ? "en-GB" : "az-AZ", { hour12: false }) : "—");
const ago = (ts) => {
  if (!ts) return "heç vaxt";
  const s = Math.max(0, Math.round((Date.now() - new Date(ts).getTime()) / 1000));
  return s < 60 ? `${s} san əvvəl` : s < 3600 ? `${Math.round(s / 60)} dəq əvvəl` : s < 86400 ? `${Math.round(s / 3600)} saat əvvəl` : `${Math.round(s / 86400)} gün əvvəl`;
};

export async function renderHoneypot(root) {
  stopHoneypot();
  const my = gen;
  root.innerHTML = `<div class="page">${loadingHtml("Honeypot yüklənir")}</div>`;
  const sum = await api.get("/api/honeypot/summary");
  if (my !== gen) return;

  const admin = state.user?.role === "admin";
  const origin = location.origin;

  root.innerHTML = `
  <div class="page">
    <div class="page-head">
      <div>
        <h1>Honeypot</h1>
        <p>${tr("honeypot.1126119c77")}</p>
      </div>
      <div class="page-actions">
        <span class="hp-chip" id="hpChip"><i class="live-dot"></i><span></span></span>
        <a class="btn" href="#/monitor">${icon("pulse")}${tr("honeypot.openMonitor")}</a>
      </div>
    </div>

    <div class="stat-row" id="hpStats" style="margin:0 0 20px"></div>

    <div class="hp-grid">
      <div class="hp-col">
        <section class="hp-card"><h3>${tr("honeypot.1a633a576d")}</h3><div id="hpCats"></div></section>
        <section class="hp-card"><h3>${tr("honeypot.ac54474f60")}</h3><div id="hpPorts"></div></section>
        <section class="hp-card"><h3>${tr("honeypot.17565adade")}</h3><div id="hpIps"></div></section>
      </div>

      <div class="hp-col">
        <section class="hp-card" id="hpSensor">
          <h3>Sensor</h3>
          <div id="hpSensorState"></div>
          <div class="hp-actions">
            <button class="btn sm" type="button" id="hpKey">${icon("key")}<span>${tr("honeypot.4afce22697")}</span></button>
            <label class="switch" title="Söndürüləndə sensor hadisələri qəbul olunmur"><input type="checkbox" id="hpEnabled"><i></i>${tr("honeypot.7efc418f88")}</label>
          </div>
          <div id="keyBox"></div>
          <div id="geoNote"></div>
        </section>

        <section class="hp-card">
          <h3>${tr("honeypot.4dcad21f60")}</h3>
          <p class="muted">${tr("honeypot.2e1a61fd18")}</p>
          <div class="hp-actions">
            <select id="simCount" aria-label="Hadisə sayı" style="width:auto"><option>10</option><option>25</option><option selected>50</option><option>100</option></select>
            <button class="btn sm primary" type="button" id="simBtn">${icon("plus")}Hadisə yarat</button>
            <button class="btn sm" type="button" id="simDel">${icon("trash")}Simulyasiyanı sil</button>
          </div>
        </section>

        <section class="hp-card">
          <details open>
            <summary><h3 style="display:inline">${tr("honeypot.7a90d74d36")}</h3></summary>
            <ol class="hp-steps">
              <li>${tr("honeypot.21d8b1aa9c")}</li>
              <li>VM-in <b>${tr("honeypot.9ec91c3906")}</b> ${tr("honeypot.ae3dd94575")}</li>
              <li>${tr("honeypot.24e1948a10")} <code>python run.py --lan</code> ${tr("honeypot.6129bc77ae")}</li>
              <li><a class="link" href="/api/honeypot/agent" download>${tr("honeypot.244ee2be2c")}</a> ${tr("honeypot.11101bf93c")}</li>
            </ol>
            <div class="cmd"><pre id="hpCmd"></pre><button class="btn sm" type="button" id="hpCopy">${icon("copy")}Kopyala</button></div>
            <p class="muted">${tr("honeypot.99fc1f5d19")} <code>sudo</code> ${tr("honeypot.44ff2c369f")} <code>--user nobody</code> ${tr("honeypot.27d3e8aa31")} <code>--offset 10000</code> (22 → 10022).</p>
          </details>
        </section>
      </div>
    </div>

    <section class="hp-card" style="margin-top:20px">
      <div class="hp-head">
        <h3>${tr("honeypot.0f7025c533")}</h3>
        <div class="filters" style="margin:0">
          <select id="fCat" aria-label="Kateqoriya"><option value="">${tr("honeypot.6917c9282a")}</option>${Object.entries(CAT).map(([k, v]) => `<option value="${k}" ${hf.category === k ? "selected" : ""}>${v}</option>`).join("")}</select>
          <select id="fPort" aria-label="Port"><option value="">${tr("honeypot.7920d0748d")}</option>${sum.plan.map((p) => `<option value="${p.port}" ${String(hf.port) === String(p.port) ? "selected" : ""}>${p.port} ${esc(p.service)}</option>`).join("")}</select>
          <label class="switch"><input type="checkbox" id="fSim" ${hf.sim ? "checked" : ""}><i></i>Simulyasiya daxil</label>
          <a class="btn sm" href="/api/honeypot/export.csv?sim=${hf.sim ? 1 : 0}" id="hpExport" download>${icon("download")}CSV</a>
        </div>
      </div>
      <div id="hpEvents"></div>
    </section>

    <section class="hp-card" style="margin-top:20px">
      <details>
        <summary><h3 style="display:inline">${tr("honeypot.dfd5ee0c5b")}</h3></summary>
        <div class="table-wrap" style="margin-top:12px"><table>
          <thead><tr><th>Port</th><th>${tr("honeypot.653cc65125")}</th><th>${tr("honeypot.dedb64ce19")}</th><th>ATT&amp;CK</th></tr></thead>
          <tbody>${sum.plan.map((p) => `<tr><td class="num">${p.port}</td><td>${esc(p.service)}</td><td>${esc(p.label)}</td><td><button class="link tid" type="button" data-t="${esc(p.technique)}">${esc(p.technique)}</button></td></tr>`).join("")}</tbody>
        </table></div>
        <p class="muted" style="margin-top:10px">Təsnifat heuristikdir (port və ilk baytlar). Tək bağlantı «skan» sayılır. «Brute force» üçün giriş cəhdi əlaməti (USER, PASS, login) və ya 10 dəqiqədə eyni portda 5 və daha çox bağlantı lazımdır. Parollar sensor tərəfindən gizlədilir, saxlanmır. Hadisələr ${sum.retention_days} gündən sonra silinir.</p>
      </details>
    </section>
  </div>`;

  const $ = (s) => root.querySelector(s);

  /* ---------- dinamik hissələr */
  function paintSummary(s) {
    const online = s.sensors.filter((x) => x.online).length;
    const chip = $("#hpChip");
    const [cls, txt] = !s.enabled ? ["paused", "Qəbul söndürülüb"] : online ? ["live", `Sensor qoşulub (${online})`] : s.key_set ? ["", "Sensor gözlənilir"] : ["err", "Açar yaradılmayıb"];
    chip.className = `hp-chip ${cls}`;
    chip.querySelector("span").textContent = txt;

    const top = s.ports[0];
    $("#hpStats").innerHTML = `
      <div class="stat"><b>${s.count}</b><span>hadisə (son ${s.hours} saat)</span></div>
      <div class="stat"><b>${s.unique_ips}</b><span>${tr("honeypot.d598881e07")}</span></div>
      <div class="stat"><b>${s.real_total}</b><span>${tr("honeypot.06b08225b1")}</span></div>
      <div class="stat"><b>${online}<small class="muted"> / ${s.sensors.filter((x) => x.name !== "simulyasiya").length}</small></b><span>sensor onlayn</span></div>
      <div class="stat"><b>${top ? top.port : "—"}</b><span>${top ? esc(top.service) + ", ən çox hədəf" : "ən çox hədəf"}</span></div>`;

    $("#hpCats").innerHTML = bars(s.categories, (c) => c.label, (c) => c.count);
    $("#hpPorts").innerHTML = bars(s.ports, (p) => `${p.port} ${p.service}`, (p) => p.count);
    $("#hpIps").innerHTML = s.top_ips.length
      ? `<div class="list">${s.top_ips.map((i) => `<div class="item" style="cursor:default"><span class="grow"><span class="t tid" style="font-size:12.5px;color:var(--text)">${esc(i.ip)}</span><span class="s">${esc(i.place) || "yer məlum deyil"}</span></span><b>${i.count}</b></div>`).join("")}</div>`
      : `<p class="muted">${tr("honeypot.a77151f253")}</p>`;

    $("#hpSensorState").innerHTML = s.sensors.length
      ? s.sensors.map((x) => `<div class="srcrow"><i class="state ${x.online ? "full" : "gap"}"></i><span class="grow">${esc(x.name)}</span><span class="muted">${x.count} hadisə, ${ago(x.last_seen)}</span></div>`).join("")
      : `<p class="muted">Hələ sensor qoşulmayıb.${s.key_set ? " Açar yaradılıb (…" + esc(s.key_hint) + "), agenti işə salın." : " Əvvəl açar yaradın."}</p>`;
    $("#hpEnabled").checked = s.enabled;
    $("#hpKey span").textContent = s.key_set ? "Açarı yenilə" : "Sensor açarı yarat";
    $("#geoNote").innerHTML = (s.geo.database || s.geo.lab_mappings > 0)
      ? ""
      : `<p class="notice warn" style="margin-top:12px">${tr("honeypot.7f7e12a7c2")} <code>data/dbip-city-lite.mmdb</code> adı ilə qoyun${s.geo.library ? "" : " və <code>pip install maxminddb</code> edin"}, sonra serveri yenidən başladın.</p>`;
    paintCmd();
  }

  function paintCmd() {
    $("#hpCmd").textContent = `sudo python3 honeypot.py --url ${origin} --key ${lastKey || "<SENSOR_AÇARI>"} --name hp-1 --user nobody`;
  }

  async function paintEvents() {
    const q = new URLSearchParams({ limit: "100", sim: hf.sim ? "1" : "0" });
    if (hf.category) q.set("category", hf.category);
    if (hf.port) q.set("port", hf.port);
    const rows = await api.get(`/api/honeypot/events?${q}`);
    if (my !== gen) return;
    $("#hpEvents").innerHTML = rows.length
      ? `<div class="table-wrap"><table>
          <thead><tr><th>Vaxt</th><th>${tr("honeypot.43c1041d43")}</th><th>Port</th><th>Kateqoriya</th><th>ATT&amp;CK</th><th class="hide-md">${tr("honeypot.95c4e65568")}</th></tr></thead>
          <tbody>${rows.map((e) => `
            <tr>
              <td class="num" title="${esc(e.ts)}">${time(e.ts)}</td>
              <td><span class="tid" style="font-size:12.5px;color:var(--text)">${esc(e.src_ip)}</span>${e.simulated ? ' <span class="pill" style="margin-left:6px">simulyasiya</span>' : ""}<div class="sub-line">${esc(e.place) || (e.geo ? "" : "yer məlum deyil")}</div></td>
              <td class="num">${e.dst_port}<div class="sub-line">${esc(e.service)}</div></td>
              <td><span class="pill cat-${esc(e.category)}">${esc(e.category_label)}</span></td>
              <td>${e.technique ? `<button class="link tid" type="button" data-t="${esc(e.technique)}">${esc(e.technique)}</button>` : "—"}</td>
              <td class="hide-md"><code class="payload" title="${esc(e.payload)}">${esc(e.payload.replace(/\s+/g, " ").slice(0, 70)) || "—"}</code></td>
            </tr>`).join("")}</tbody></table></div>`
      : `<div class="empty"><h3>${tr("honeypot.fb85a11ef1")}</h3><p>${tr("honeypot.bbe2bcd4b0")}</p></div>`;
  }

  async function refreshAll() {
    try {
      const s = await api.get("/api/honeypot/summary");
      if (my !== gen) return;
      paintSummary(s);
      await paintEvents();
    } catch { /* növbəti dövrdə yenidən cəhd */ }
  }

  /* ---------- idarəetmə */
  const adminOnly = (fn) => () => {
    if (!isAuthed()) return requireLogin(() => {});
    if (state.user.role !== "admin") return toast("Bu əməliyyat yalnız admin üçündür", "error");
    return fn();
  };

  $("#hpKey").addEventListener("click", adminOnly(async () => {
    if (sum.key_set && !confirm("Yeni açar köhnəsini ləğv edəcək, sensoru yenidən qurmaq lazım olacaq. Davam edək?")) return;
    try {
      const r = await api.post("/api/honeypot/key");
      lastKey = r.key;
      sum.key_set = true;
      $("#keyBox").innerHTML = `<div class="keybox"><div class="muted">${tr("honeypot.cabafc5304")}</div><code id="keyVal">${esc(r.key)}</code><button class="btn sm" type="button" id="keyCopy">${icon("copy")}Kopyala</button></div>`;
      $("#keyCopy").addEventListener("click", async () => toast((await copyText(r.key)) ? "Açar kopyalandı" : "Kopyalamaq alınmadı, əl ilə seçin", "ok"));
      toast("Yeni sensor açarı yaradıldı", "ok");
      refreshAll();
    } catch (e) {
      toast(e.message, "error");
    }
  }));

  $("#hpEnabled").addEventListener("change", (e) => {
    const want = e.target.checked;
    adminOnly(async () => {
      try {
        await api.put("/api/honeypot/settings", { enabled: want });
        toast(want ? "Qəbul açıldı" : "Qəbul söndürüldü", "ok");
        refreshAll();
      } catch (ex) {
        e.target.checked = !want;
        toast(ex.message, "error");
      }
    })();
    if (!isAuthed() || state.user.role !== "admin") e.target.checked = !want;
  });

  $("#simBtn").addEventListener("click", () =>
    requireLogin(async () => {
      try {
        const n = Number($("#simCount").value);
        await api.post("/api/honeypot/simulate", { count: n });
        toast(`${n} simulyasiya hadisəsi yaradıldı`, "ok");
        refreshAll();
      } catch (e) {
        toast(e.message, "error");
      }
    })
  );

  let armed = false;
  $("#simDel").addEventListener("click", adminOnly(async () => {
    if (!armed) {
      armed = true;
      toast("Silməyi təsdiqləmək üçün düyməyə yenidən basın");
      setTimeout(() => (armed = false), 4000);
      return;
    }
    armed = false;
    try {
      const r = await api.del("/api/honeypot/events?simulated_only=true");
      toast(`${r.deleted} simulyasiya hadisəsi silindi`, "ok");
      refreshAll();
    } catch (e) {
      toast(e.message, "error");
    }
  }));

  $("#hpCopy").addEventListener("click", async () => toast((await copyText($("#hpCmd").textContent)) ? "Əmr kopyalandı" : "Kopyalamaq alınmadı, əl ilə seçin", "ok"));

  $("#hpExport").addEventListener("click", async (event) => {
    event.preventDefault();
    try {
      const response = await fetch(`/api/honeypot/export.csv?sim=${hf.sim ? 1 : 0}`, {
        headers: { Authorization: `Bearer ${token.get()}` }
      });
      if (!response.ok) throw new Error(response.status === 401 ? "Sign in to export events" : "Unable to export events");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "ibluteam-honeypot-events.csv";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) { toast(error.message, "error"); }
  });

  $("#fCat").addEventListener("change", (e) => { hf.category = e.target.value; paintEvents(); });
  $("#fPort").addEventListener("change", (e) => { hf.port = e.target.value; paintEvents(); });
  $("#fSim").addEventListener("change", (e) => {
    hf.sim = e.target.checked;
    paintEvents();
  });
  root.addEventListener("click", (e) => {
    const t = e.target.closest("[data-t]");
    if (t) openPanel(t.dataset.t);
  });

  paintSummary(sum);
  await paintEvents();
  if (my !== gen) return;
  timer = setInterval(refreshAll, 5000);
}
