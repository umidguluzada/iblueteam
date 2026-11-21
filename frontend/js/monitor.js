import { t as tr } from "./i18n.js";
import { getLanguage, translateText } from "./i18n.js";
/* Live Detection Monitor: sintetik hücum axını. Hər qövs bir hadisədir:
   mavi = aşkarlandı, kəhrəba = qismən, qırmızı = qaçırıldı. Nəticə platformanın cari əhatəsindən gəlir. */
import { api } from "./api.js";
import { state, platformParam, refresh } from "./state.js";
import { esc, icon, platformSelectHtml, loadingHtml } from "./ui.js";
import { openPanel } from "./panel.js";
import { WORLD } from "./world.js";

let ctl = null;
let gen = 0;

export function stopMonitor() {
  gen++;
  if (ctl) {
    ctl.stop();
    ctl = null;
  }
}

const OUT = {
  detected: { label: "Aşkarlandı", vars: "--accent" },
  partial: { label: "Qismən", vars: "--warn" },
  missed: { label: "Qaçırıldı", vars: "--danger" },
};
const KEEP = 100; // KPI üçün son hadisələr
const FEED = 60; // siyahıda saxlanan hadisələr

const hex = (h) => {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(h.trim());
  return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : [143, 214, 255];
};

function palette() {
  const cs = getComputedStyle(document.documentElement);
  const g = (v) => cs.getPropertyValue(v).trim();
  return {
    detected: hex(g("--accent")),
    partial: hex(g("--warn")),
    missed: hex(g("--danger")),
    land: g("--accent-rgb") || "143, 214, 255",
    dark: document.documentElement.getAttribute("data-theme") !== "light",
    text: g("--text-2") || "#aab3c0",
    ui: g("--font-ui") || "sans-serif",
  };
}

const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
const bez = (a, c, b, t) => (1 - t) * (1 - t) * a + 2 * (1 - t) * t * c + t * t * b;

export async function renderMonitor(root) {
  stopMonitor();
  const my = gen;
  root.innerHTML = `<div class="page">${loadingHtml("Monitor yüklənir")}</div>`;
  const cfg = await api.get(`/api/monitor/config?platform=${platformParam()}`);
  if (my !== gen) return; // istifadəçi artıq başqa səhifəyə keçib

  root.innerHTML = `
    <section class="mon" aria-label="Live Detection Monitor">
      <div class="mon-map" id="monMap">
        <canvas id="monBg" aria-hidden="true"></canvas>
        <canvas id="monFg" aria-hidden="true"></canvas>
        <button class="mon-target" id="monTarget" type="button" aria-pressed="false" aria-label="${esc(cfg.target.name)}: adı göstər"></button>

        <div class="mon-kpi glass" role="group" aria-label="Göstəricilər">
          <div class="kpi-main">
            <strong id="kRate">0<small>%</small></strong>
            <span>${tr("monitor.1a4f0549e7")} <span id="kN">0</span> ${tr("monitor.0cb6d7a892")}</span>
          </div>
          <div class="kpi-item"><b id="kMissed">0</b><span>${tr("monitor.80b57cc150")}</span></div>
          <div class="kpi-item" title="Çox qrupun istifadə etdiyi texnikalara görə çəkili əhatə. Hadisələr də bu çəki ilə seçilir."><b id="kExp">${cfg.expected.detected}<small>%</small></b><span id="kExpL">${tr("monitor.6ee1e45390")}</span></div>
        </div>

        <div class="mon-status glass" id="monStatus" role="status"><i class="live-dot"></i><span>${tr("monitor.84d2be3097")}</span></div>

        <div class="mon-legend glass" aria-hidden="true">
          <span><i class="mdot detected"></i>${tr("monitor.36417779a8")}</span>
          <span><i class="mdot partial"></i>${tr("monitor.aec79d9457")}</span>
          <span><i class="mdot missed"></i>${tr("monitor.5578d81ec2")}</span>
        </div>
        <p class="mon-note" id="monNote"></p>
      </div>

      <aside class="mon-side" aria-label="Hadisə axını">
        <div class="mon-controls">
          <div class="seg" role="radiogroup" aria-label="Mənbə">
            <label><input type="radio" name="msrc" value="synthetic" ${state.monMode === "honeypot" ? "" : "checked"}><span>Sintetik</span></label>
            <label><input type="radio" name="msrc" value="honeypot" ${state.monMode === "honeypot" ? "checked" : ""}><span>Honeypot</span></label>
          </div>
          <button class="btn sm" type="button" id="monPause" aria-pressed="false">${icon("pause")}<span>${tr("monitor.73b53b3007")}</span></button>
          <div class="seg" role="radiogroup" aria-label="Sürət">
            <label><input type="radio" name="spd" value="1" checked><span>1×</span></label>
            <label><input type="radio" name="spd" value="2"><span>2×</span></label>
            <label><input type="radio" name="spd" value="4"><span>4×</span></label>
          </div>
          ${platformSelectHtml(state)}
        </div>
        <label class="switch" style="padding:0 16px 10px"><input type="checkbox" id="monOnly"><i></i>${tr("monitor.825de312cd")}</label>

        <div class="feed" id="monFeed" aria-label="Son hadisələr"></div>

        <div class="mon-top">
          <h3>${tr("monitor.cc45210bd6")}</h3>
          ${
            cfg.top_missed.length
              ? `<div class="list">${cfg.top_missed
                  .map(
                    (g) => `<button class="item" type="button" data-t="${esc(g.id)}">
                  <i class="mdot missed"></i>
                  <span class="grow"><span class="t"><span class="tid">${esc(g.id)}</span> ${esc(g.name)}</span><span class="s">${g.groups} qrup istifadə edir${g.blind ? ", kor" : ""}</span></span>
                </button>`
                  )
                  .join("")}</div>
                <a class="link" href="#/gaps" style="display:inline-block;margin-top:10px">${tr("monitor.c18bf25fca")}</a>`
              : `<p class="muted">${tr("monitor.3bc123b441")}</p>`
          }
        </div>
      </aside>
    </section>`;

  ctl = start(root, cfg);
}

function start(root, cfg) {
  const $ = (s) => root.querySelector(s);
  const mapEl = $("#monMap");
  const bg = $("#monBg");
  const fg = $("#monFg");
  const bgx = bg.getContext("2d");
  const fgx = fg.getContext("2d");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  let pal = palette();
  let W = 0;
  let H = 0;
  let dpr = 1;
  let geom = { scale: 1, ox: 0, oy: 0 };
  let running = true;
  let paused = false;
  let speed = 1;
  let onlyMissed = false;
  let mode = state.monMode === "honeypot" ? "honeypot" : "synthetic";
  let hpCursor = 0;
  let hpLast = 0; // son honeypot hadisəsinin gəlmə vaxtı
  let hoverTarget = false;
  let pinTarget = false;
  let raf = 0;
  let failures = 0;
  let pollTimer = 0;
  const timers = new Set();
  const arcs = [];
  const rips = [];
  const feed = [];
  const recent = [];
  let total = 0;
  const spanLat = WORLD.rows.length * WORLD.step;

  const targetBtn = $("#monTarget");
  const px = (lon, lat) => [geom.ox + (lon + 180) * geom.scale, geom.oy + (WORLD.lat0 - lat) * geom.scale];
  const later = (ms, fn) => {
    const id = setTimeout(() => {
      timers.delete(id);
      if (running) fn();
    }, ms);
    timers.add(id);
  };

  /* ---------- xəritə fonu: quru nöqtələri */
  function drawBg() {
    bgx.setTransform(dpr, 0, 0, dpr, 0, 0);
    bgx.clearRect(0, 0, W, H);
    const cell = WORLD.step * geom.scale;
    const r = Math.max(0.8, cell * 0.33);
    bgx.fillStyle = `rgba(${pal.land}, ${pal.dark ? 0.2 : 0.3})`;
    bgx.beginPath();
    WORLD.rows.forEach((row, ri) => {
      const lat = WORLD.lat0 - ri * WORLD.step - WORLD.step / 2;
      for (let ci = 0; ci < row.length; ci++) {
        if (row[ci] !== "1") continue;
        const [x, y] = px(WORLD.lon0 + ci * WORLD.step + WORLD.step / 2, lat);
        bgx.moveTo(x + r, y);
        bgx.arc(x, y, r, 0, Math.PI * 2);
      }
    });
    bgx.fill();
  }

  function layout() {
    const rc = mapEl.getBoundingClientRect();
    W = Math.max(280, rc.width);
    H = Math.max(220, rc.height);
    dpr = Math.min(2, window.devicePixelRatio || 1);
    for (const c of [bg, fg]) {
      c.width = Math.round(W * dpr);
      c.height = Math.round(H * dpr);
      c.style.width = `${W}px`;
      c.style.height = `${H}px`;
    }
    const scale = Math.min((W - 24) / 360, (H - 24) / spanLat);
    geom = { scale, ox: (W - 360 * scale) / 2, oy: (H - spanLat * scale) / 2 };
    rips.length = 0;
    const [tx, ty] = px(cfg.target.lon, cfg.target.lat);
    targetBtn.style.left = `${tx - 20}px`;
    targetBtn.style.top = `${ty - 20}px`;
    drawBg();
  }

  /* ---------- animasiya */
  function drawTarget(now) {
    const [x, y] = px(cfg.target.lon, cfg.target.lat);
    const pulse = 0.5 + 0.5 * Math.sin(now / 520);
    const c = pal.detected;
    fgx.beginPath();
    fgx.arc(x, y, 7 + pulse * 3, 0, Math.PI * 2);
    fgx.strokeStyle = rgba(c, 0.25 + pulse * 0.25);
    fgx.lineWidth = 1.2;
    fgx.stroke();
    fgx.beginPath();
    fgx.arc(x, y, 3.4, 0, Math.PI * 2);
    fgx.fillStyle = rgba(c, 1);
    if (pal.dark) {
      fgx.shadowColor = rgba(c, 0.9);
      fgx.shadowBlur = 10;
    }
    fgx.fill();
    fgx.shadowBlur = 0;
    if (!(hoverTarget || pinTarget)) return;
    fgx.font = `500 12px ${pal.ui}`;
    const label = cfg.target.name;
    const tw = fgx.measureText(label).width;
    const bw = tw + 18;
    const bh = 24;
    const right = x > W - bw - 30;
    const bx = right ? x - 14 - bw : x + 14;
    const by = Math.max(4, y - 12 - bh);
    fgx.beginPath();
    fgx.roundRect(bx, by, bw, bh, 7);
    fgx.fillStyle = pal.dark ? "rgba(19,23,30,0.92)" : "rgba(255,255,255,0.94)";
    fgx.fill();
    fgx.strokeStyle = rgba(c, 0.6);
    fgx.lineWidth = 1;
    fgx.stroke();
    fgx.fillStyle = pal.dark ? "#e9edf3" : "#11151b";
    fgx.textAlign = "left";
    fgx.textBaseline = "middle";
    fgx.fillText(label, bx + 9, by + bh / 2 + 0.5);
    fgx.textBaseline = "alphabetic";
  }

  function arcPoints(a, from, to, n) {
    const pts = [];
    for (let k = 0; k <= n; k++) {
      const t = from + ((to - from) * k) / n;
      pts.push([bez(a.sx, a.cx, a.dx, t), bez(a.sy, a.cy, a.dy, t)]);
    }
    return pts;
  }

  function stroke(a, from, to, color, alpha, width, n = 28) {
    const pts = arcPoints(a, from, to, n);
    fgx.beginPath();
    fgx.moveTo(pts[0][0], pts[0][1]);
    for (let k = 1; k < pts.length; k++) fgx.lineTo(pts[k][0], pts[k][1]);
    fgx.strokeStyle = rgba(color, alpha);
    fgx.lineWidth = width;
    fgx.stroke();
  }

  function geomFor(a) {
    const [sx, sy] = px(a.ev.src.lon, a.ev.src.lat);
    const [dx, dy] = px(cfg.target.lon, cfg.target.lat);
    a.sx = sx;
    a.sy = sy;
    a.dx = dx;
    a.dy = dy;
    a.cx = (sx + dx) / 2;
    a.cy = (sy + dy) / 2 - Math.hypot(dx - sx, dy - sy) * 0.3 - 8;
  }

  function launch(ev) {
    const a = { ev, t0: performance.now(), landed: false, tLand: 0 };
    geomFor(a);
    const dist = Math.hypot(a.dx - a.sx, a.dy - a.sy);
    a.dur = reduce ? 0 : (1100 + dist * 1.15) / Math.sqrt(speed);
    arcs.push(a);
    if (arcs.length > 60) arcs.shift();
    const col = pal[ev.outcome];
    if (!reduce) rips.push({ x: a.sx, y: a.sy, t0: a.t0, dur: 650, max: 11, color: col, w: 1.2 });
  }

  function land(a, now) {
    a.landed = true;
    a.tLand = now;
    const col = pal[a.ev.outcome];
    rips.push({ x: a.dx, y: a.dy, t0: now, dur: 950, max: a.ev.outcome === "detected" ? 24 : 32, color: col, w: 1.8 });
    if (a.ev.outcome === "missed") rips.push({ x: a.dx, y: a.dy, t0: now + 170, dur: 950, max: 40, color: col, w: 1.2 });
    record(a.ev);
  }

  function frame(now) {
    if (!running) return;
    raf = requestAnimationFrame(frame);
    fgx.setTransform(dpr, 0, 0, dpr, 0, 0);
    fgx.clearRect(0, 0, W, H);
    fgx.lineCap = "round";

    for (let i = arcs.length - 1; i >= 0; i--) {
      const a = arcs[i];
      geomFor(a);
      const col = pal[a.ev.outcome];
      const p = a.dur ? (now - a.t0) / a.dur : 1;
      if (!a.landed) {
        if (p >= 1) {
          land(a, now);
        } else {
          const e = 1 - Math.pow(1 - p, 2.2);
          stroke(a, 0, 1, col, 0.07, 1);
          const tail = Math.max(0, e - 0.4);
          const N = 20;
          for (let k = 0; k < N; k++) {
            const t0 = tail + ((e - tail) * k) / N;
            const t1 = tail + ((e - tail) * (k + 1)) / N;
            stroke(a, t0, t1, col, Math.pow((k + 1) / N, 1.5) * 0.95, 1.8, 1);
          }
          const hx = bez(a.sx, a.cx, a.dx, e);
          const hy = bez(a.sy, a.cy, a.dy, e);
          fgx.beginPath();
          fgx.arc(hx, hy, 2.4, 0, Math.PI * 2);
          fgx.fillStyle = rgba(col, 1);
          if (pal.dark) {
            fgx.shadowColor = rgba(col, 0.95);
            fgx.shadowBlur = 9;
          }
          fgx.fill();
          fgx.shadowBlur = 0;
        }
      }
      if (a.landed) {
        const alpha = 1 - (now - a.tLand) / 1700;
        if (alpha <= 0) {
          arcs.splice(i, 1);
          continue;
        }
        stroke(a, 0, 1, col, alpha * 0.4, 1.1);
      }
    }

    for (let i = rips.length - 1; i >= 0; i--) {
      const r = rips[i];
      const t = (now - r.t0) / r.dur;
      if (t < 0) continue;
      if (t >= 1) {
        rips.splice(i, 1);
        continue;
      }
      fgx.beginPath();
      fgx.arc(r.x, r.y, 3 + r.max * (1 - Math.pow(1 - t, 3)), 0, Math.PI * 2);
      fgx.strokeStyle = rgba(r.color, (1 - t) * 0.9);
      fgx.lineWidth = r.w;
      fgx.stroke();
    }
    drawTarget(now);
  }

  /* ---------- KPI və siyahı */
  function record(ev) {
    total++;
    recent.unshift(ev);
    if (recent.length > KEEP) recent.pop();
    feed.unshift({ ...ev, at: new Date(), fresh: true });
    if (feed.length > FEED) feed.pop();
    paintFeed();
    paintKpi();
  }

  function paintKpi() {
    const n = recent.length || 1;
    const d = recent.filter((e) => e.outcome === "detected").length;
    const m = recent.filter((e) => e.outcome === "missed").length;
    $("#kRate").innerHTML = `${Math.round((d / n) * 100)}<small>%</small>`;
    $("#kN").textContent = String(recent.length);
    $("#kMissed").textContent = String(m);
  }

  function paintFeed() {
    const box = $("#monFeed");
    const rows = feed.filter((e) => !onlyMissed || e.outcome === "missed");
    if (!rows.length) {
      box.innerHTML = `<p class="muted" style="padding:16px">${
        onlyMissed
          ? "Hələ qaçırılan hadisə yoxdur."
          : mode === "honeypot"
            ? 'Hələ honeypot hadisəsi yoxdur. <a class="link" href="#/honeypot">${tr("monitor.cc125e1826")}</a> sensor qoşun və ya simulyasiya yaradın.'
            : "Hadisə gözlənilir"
      }</p>`;
      return;
    }
    box.innerHTML = rows
      .map(
        (e) => `
      <button class="feed-row${e.fresh ? " new" : ""}" type="button" data-t="${esc(e.technique)}" aria-label="${esc(e.technique)} ${esc(e.name)}, ${OUT[e.outcome].label}">
        <i class="mdot ${e.outcome}"></i>
        <span class="grow">
          <span class="t"><span class="tid">${esc(e.technique)}</span> ${esc(e.name)}</span>
          <span class="s" title="${esc(e.reason)}">${esc(e.host)} · ${esc(translateText(e.src.name))}${e.simulated ? " (simulyasiya)" : ""}: ${esc(e.reason)}</span>
        </span>
        <span class="time">${e.at.toLocaleTimeString(getLanguage() === "en" ? "en-GB" : "az-AZ", { hour12: false })}</span>
      </button>`
      )
      .join("");
    feed.forEach((e) => (e.fresh = false));
  }

  function setStatus(kind, text) {
    const el = $("#monStatus");
    el.className = `mon-status glass ${kind}`;
    el.querySelector("span").textContent = text;
  }

  /* ---------- server sorğuları */
  const interval = () => 2400 / speed;

  function paintMode() {
    if (mode === "honeypot") {
      $("#kExp").innerHTML = String(hpCount24);
      $("#kExpL").textContent = "hadisə, son 24 saat";
      $("#monNote").textContent = "Honeypot hadisələri. Nəticə, həmin hücum bizə qarşı olsaydı cari qaydaların onu aşkarlayıb-aşkarlamayacağını göstərir. IP-nin yeri hücumçunun yeri demək deyil (VPN, proxy).";
    } else {
      $("#kExp").innerHTML = `${cfg.expected.detected}<small>%</small>`;
      $("#kExpL").textContent = "gözlənilən";
      $("#monNote").textContent = "Sintetik hadisələr. Mənbələr məlumat mərkəzi şəhərləridir, IP-lər sənəd aralığındandır.";
    }
  }

  let hpCount24 = 0;
  async function hpSummary() {
    try {
      hpCount24 = (await api.get("/api/honeypot/summary")).count;
      if (mode === "honeypot") paintMode();
    } catch { /* statistika alınmadı */ }
  }

  async function fetchEvents(m, n) {
    if (m === "honeypot") {
      const r = await api.get(`/api/honeypot/live?after=${hpCursor}`);
      hpCursor = r.cursor;
      if (r.events.length) hpLast = Date.now();
      return r.events;
    }
    return api.get(`/api/monitor/events?n=${n}&platform=${platformParam()}`);
  }

  const liveText = () => (mode === "honeypot" && Date.now() - hpLast > 300000 ? "Hadisə gözlənilir" : "Canlı");

  async function poll() {
    if (!running) return;
    if (paused || document.hidden) {
      pollTimer = setTimeout(poll, 500);
      return;
    }
    const m = mode;
    const n = Math.min(8, Math.max(1, Math.round(speed * 1.5)));
    try {
      const evs = await fetchEvents(m, n);
      if (!running) return;
      if (m !== mode) {
        pollTimer = setTimeout(poll, 100);
        return;
      }
      failures = 0;
      setStatus("live", liveText());
      const gap = interval() / Math.max(1, evs.length);
      // yeri məlum olmayan hadisə xəritədə qövs çəkmir, yalnız siyahıya düşür
      evs.forEach((ev, i) => later(i * gap, () => (ev.src.lat == null ? record(ev) : launch(ev))));
      if (m === "honeypot" && evs.length) hpCount24 += evs.length;
      if (m === "honeypot") paintMode();
    } catch {
      failures++;
      setStatus("err", "Bağlantı kəsildi, yenidən cəhd olunur");
    }
    if (running) pollTimer = setTimeout(poll, failures ? Math.min(8000, 1500 * failures) : interval());
  }

  /* ---------- idarəetmə */
  const pauseBtn = $("#monPause");
  pauseBtn.addEventListener("click", () => {
    paused = !paused;
    pauseBtn.setAttribute("aria-pressed", String(paused));
    pauseBtn.innerHTML = `${icon(paused ? "play" : "pause")}<span>${paused ? "Davam et" : "Dayandır"}</span>`;
    setStatus(paused ? "paused" : failures ? "err" : "live", paused ? "Dayandırılıb" : failures ? "Bağlantı kəsildi" : "Canlı");
  });
  root.querySelectorAll('input[name="spd"]').forEach((r) =>
    r.addEventListener("change", () => {
      speed = Number(r.value);
    })
  );
  root.querySelectorAll('input[name="msrc"]').forEach((r) =>
    r.addEventListener("change", () => {
      if (!r.checked) return;
      mode = r.value;
      state.monMode = mode;
      timers.forEach(clearTimeout);
      timers.clear();
      arcs.length = 0;
      rips.length = 0;
      feed.length = 0;
      recent.length = 0;
      hpCursor = 0;
      paintFeed();
      paintKpi();
      paintMode();
      setStatus("live", "Qoşulur");
      warmup();
    })
  );
  $("#monOnly").addEventListener("change", (e) => {
    onlyMissed = e.target.checked;
    paintFeed();
  });
  $("#platform").addEventListener("change", async (e) => {
    state.filters.platform = e.target.value;
    try {
      await refresh();
    } catch {
      e.target.disabled = false;
    }
  });
  targetBtn.addEventListener("mouseenter", () => (hoverTarget = true));
  targetBtn.addEventListener("mouseleave", () => (hoverTarget = false));
  targetBtn.addEventListener("click", () => {
    pinTarget = !pinTarget;
    targetBtn.setAttribute("aria-pressed", String(pinTarget));
    targetBtn.setAttribute("aria-label", `${cfg.target.name}: adı ${pinTarget ? "gizlət" : "göstər"}`);
  });
  const open = (e) => {
    const b = e.target.closest("[data-t]");
    if (b) openPanel(b.dataset.t);
  };
  $("#monFeed").addEventListener("click", open);
  $(".mon-top").addEventListener("click", open);

  const ro = new ResizeObserver(() => {
    if (running) layout();
  });
  ro.observe(mapEl);
  const mo = new MutationObserver(() => {
    pal = palette();
    drawBg();
  });
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  layout();
  paintFeed();
  paintKpi();
  setStatus("live", "Qoşulur");
  raf = requestAnimationFrame(frame);

  // başlanğıcda siyahı boş qalmasın: bir neçə hadisə qeydə alınır (qövssüz)
  async function warmup() {
    const m = mode;
    try {
      const evs = await fetchEvents(m, 8);
      if (!running || m !== mode) return;
      evs.forEach((e) => record(e));
      feed.forEach((e) => (e.fresh = false));
      paintFeed();
      setStatus("live", liveText());
    } catch {
      setStatus("err", "Bağlantı kəsildi, yenidən cəhd olunur");
    }
  }

  paintMode();
  hpSummary();
  warmup().finally(() => {
    if (running) pollTimer = setTimeout(poll, 300);
  });

  return {
    stop() {
      running = false;
      cancelAnimationFrame(raf);
      clearTimeout(pollTimer);
      timers.forEach(clearTimeout);
      timers.clear();
      ro.disconnect();
      mo.disconnect();
    },
  };
}
