import { translateText } from "./i18n.js";
const KEY = "ibt-token";

export const token = {
  get() {
    try {
      return localStorage.getItem(KEY) || "";
    } catch {
      return "";
    }
  },
  set(v) {
    try {
      if (v) localStorage.setItem(KEY, v);
      else localStorage.removeItem(KEY);
    } catch { /* yadda saxlanmadı, sessiya yalnız bu səhifədə qalır */ }
  },
};

async function request(method, url, body, isForm = false) {
  const opt = { method, headers: {} };
  const t = token.get();
  if (t) opt.headers.Authorization = `Bearer ${t}`;
  if (body !== undefined) {
    if (isForm) {
      opt.body = body;
    } else {
      opt.headers["Content-Type"] = "application/json";
      opt.body = JSON.stringify(body);
    }
  }

  let res;
  try {
    res = await fetch(url, opt);
  } catch {
    throw new Error("Unable to connect to the server. Is 'python run.py' running?");
  }

  if (!res.ok) {
    let msg = `Error ${res.status}`;
    try {
      const j = await res.json();
      if (typeof j.detail === "string") msg = j.detail;
      else if (Array.isArray(j.detail)) msg = j.detail.map((d) => d.msg).join("; ");
    } catch { /* cavab JSON deyil */ }
    // sessiya bitibsə (token var idi, server rədd etdi) istifadəçini xəbərdar et
    if (res.status === 401 && t && !url.includes("/api/auth/login")) {
      token.set("");
      document.dispatchEvent(new CustomEvent("ibt:unauth"));
      msg = "Session expired. Please sign in again.";
    }
    throw new Error(translateText(msg));
  }
  return res.status === 204 ? null : res.json();
}

export const api = {
  get: (u) => request("GET", u),
  post: (u, b) => request("POST", u, b),
  put: (u, b) => request("PUT", u, b),
  del: (u) => request("DELETE", u),
  upload: (u, fd) => request("POST", u, fd, true),
};
