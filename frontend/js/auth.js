import { t as tr } from "./i18n.js";
import { api, token } from "./api.js";
import { state } from "./state.js";
import { esc, icon, openModal, toast } from "./ui.js";

export const isAuthed = () => !!state.user;

export async function restoreSession() {
  if (!token.get()) return;
  try {
    state.user = await api.get("/api/auth/me");
  } catch {
    token.set("");
    state.user = null;
  }
}

/** Giriş tələb edən əməliyyatı bağla: daxil olmayıbsa, əvvəl giriş pəncərəsi açılır. */
export function requireLogin(fn) {
  if (state.user) return fn();
  openLogin(fn);
}

const announce = () => document.dispatchEvent(new CustomEvent("ibt:auth"));

export function logout() {
  token.set("");
  state.user = null;
  toast("Çıxış edildi");
  announce();
}

export function openLogin(after, selectedUsername = "") {
  const m = openModal({
    title: "Daxil ol",
    body: `
      <form id="loginForm" novalidate style="display:grid;gap:14px">
        <p class="muted">${tr("auth.704ee13700")}</p>
        <div class="field"><label for="lUser">${tr("auth.9f34334b6b")}</label><input id="lUser" type="text" autocomplete="username" autocapitalize="off" spellcheck="false"></div>
        <div class="field"><label for="lPass">Parol</label><input id="lPass" type="password" autocomplete="current-password"></div>
        <div class="err" id="lErr" role="alert"></div>
        <div class="modal-foot"><div class="right">
          <button type="button" class="btn ghost" data-close>${tr("auth.e5e70b8ad1")}</button>
          <button class="btn primary" type="submit">Daxil ol</button>
        </div></div>
      </form>`,
  });
  const $ = (s) => m.el.querySelector(s);
  if (selectedUsername) {
    $("#lUser").value = selectedUsername;
    $("#lPass").focus();
  }
  $("#loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = $("#lUser").value.trim();
    const password = $("#lPass").value;
    if (!username || !password) {
      $("#lErr").textContent = "İstifadəçi adı və parolu daxil edin";
      return;
    }
    const btn = e.submitter || $(".btn.primary");
    btn.disabled = true;
    try {
      const res = await api.post("/api/auth/login", { username, password });
      token.set(res.token);
      state.user = res.user;
      m.close();
      toast(`Xoş gəlmisiniz, ${res.user.username}`, "ok");
      announce();
      if (typeof after === "function") after();
    } catch (ex) {
      $("#lErr").textContent = ex.message;
      $("#lPass").select();
    } finally {
      btn.disabled = false;
    }
  });
}

/** Topbar-dakı istifadəçi sahəsi */
export function renderUserArea(el) {
  const u = state.user;
  if (!u) {
    el.innerHTML = `<button class="btn" type="button" data-act="login">${icon("user")}<span class="hide-sm">Daxil ol</span></button>`;
    return;
  }
  el.innerHTML = `
    <details class="menu right">
      <summary class="btn ghost" aria-label="İstifadəçi menyusu">${icon("user")}<span class="hide-sm">${esc(u.username)}</span></summary>
      <div class="menu-list" role="menu">
        <div class="menu-head">${esc(u.username)}<span class="muted">${u.role === "admin" ? "Admin" : u.role === "reviewer" ? "Keyfiyyət nəzarətçisi" : "Analitik"}</span></div>
        ${u.role === "admin" ? `<button type="button" role="menuitem" data-act="users">${icon("user")}İstifadəçilər</button>` : ""}
        <button type="button" role="menuitem" data-act="logout">${icon("logout")}Çıxış</button>
      </div>
    </details>`;
}

export function bindUserArea(el) {
  el.addEventListener("click", (e) => {
    const b = e.target.closest("[data-act]");
    if (!b) return;
    el.querySelector("details")?.removeAttribute("open");
    if (b.dataset.act === "login") openLogin();
    if (b.dataset.act === "logout") logout();
    if (b.dataset.act === "users") openUsers();
  });
}

export async function openUsers() {
  const m = openModal({ title: "İstifadəçilər", body: `<div id="uList" class="muted">${tr("auth.11bee43a10")}</div><div id="uForm"></div>` });
  const $ = (s) => m.el.querySelector(s);

  const paint = async () => {
    let users = [];
    try {
      users = await api.get("/api/users");
    } catch (e) {
      $("#uList").innerHTML = `<div class="err">${esc(e.message)}</div>`;
      return;
    }
    $("#uList").innerHTML = `<div class="list">${users
      .map(
        (u) => `<div class="item">
          <span class="grow"><span class="t">${esc(u.username)}</span><span class="s">${u.role === "admin" ? "Admin" : u.role === "reviewer" ? "Keyfiyyət nəzarətçisi" : "Analitik"}</span></span>
          ${u.username === state.user.username ? '<span class="muted">siz</span>' : `<button class="btn sm" type="button" data-switch="${esc(u.username)}">Daxil ol</button><button class="btn sm danger" type="button" data-del="${u.id}" aria-label="${esc(u.username)} istifadəçisini sil">${icon("trash")}</button>`}
        </div>`
      )
      .join("")}</div>`;
  };

  $("#uForm").innerHTML = `
    <form id="newUser" novalidate style="display:grid;gap:12px;margin-top:14px;padding-top:16px;border-top:1px solid var(--line)">
      <div class="form-grid">
        <div class="field"><label for="nuName">${tr("auth.1ad42b219e")}</label><input id="nuName" type="text" autocomplete="off" spellcheck="false" placeholder="kiçik hərf, rəqəm, _ . -"></div>
        <div class="field"><label for="nuPass">${tr("auth.25e428ffcf")}</label><input id="nuPass" type="password" autocomplete="new-password"></div>
        <div class="field full"><span class="lbl">Rol</span>
          <div class="seg" role="radiogroup" aria-label="Rol">
            <label><input type="radio" name="role" value="analyst" checked><span>Analitik</span></label>
            <label><input type="radio" name="role" value="admin"><span>Admin</span></label>
            <label><input type="radio" name="role" value="reviewer"><span>${tr("auth.7b850f4d77")}</span></label>
          </div></div>
      </div>
      <div class="err" id="uErr" role="alert"></div>
      <div class="modal-foot"><div class="right"><button type="button" class="btn ghost" data-close>${tr("auth.5544ffe398")}</button><button class="btn primary" type="submit">${tr("auth.ebd0502061")}</button></div></div>
    </form>`;

  m.el.addEventListener("click", async (e) => {
    const sw = e.target.closest("[data-switch]");
    if (sw) {
      const username = sw.dataset.switch;
      m.close();
      openLogin(undefined, username);
      return;
    }
    const d = e.target.closest("[data-del]");
    if (!d) return;
    try {
      await api.del(`/api/users/${d.dataset.del}`);
      toast("İstifadəçi silindi");
      paint();
    } catch (ex) {
      $("#uErr").textContent = ex.message;
    }
  });
  $("#newUser").addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      await api.post("/api/users", {
        username: $("#nuName").value.trim().toLowerCase(),
        password: $("#nuPass").value,
        role: m.el.querySelector('input[name="role"]:checked').value,
      });
      $("#nuName").value = "";
      $("#nuPass").value = "";
      $("#uErr").textContent = "";
      toast("İstifadəçi əlavə edildi", "ok");
      paint();
    } catch (ex) {
      $("#uErr").textContent = ex.message;
    }
  });
  paint();
}
