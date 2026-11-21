import { api } from "./api.js";
import { state } from "./state.js";
import { esc, toast, openModal } from "./ui.js";
import { getLanguage, t as tr } from "./i18n.js";

const w = () => new Proxy({}, {get: (_, key) => tr(`reviews.${String(key)}`)});
const formatDate = value => value ? new Date(value).toLocaleString(getLanguage() === "en" ? "en-GB" : "az-AZ") : "—";

async function showRuleDetails(item, host, onDecision) {
  const t = w();
  host.hidden = false;
  host.innerHTML = `<div class="review-inspector-loading">${esc(t.loading)}</div>`;
  let rule;
  try { rule = await api.get(`/api/rules/${encodeURIComponent(item.rule_id)}`); }
  catch (error) { host.innerHTML = `<div class="review-inspector-error">${esc(error.message)}</div>`; return; }
  if (host.dataset.selected !== String(item.id)) return;
  const lang = getLanguage();
  const label = (en, az) => lang === "az" ? az : en;
  const field = (name, value) => `<div class="review-inspector-field"><span>${esc(name)}</span><strong>${esc(value ?? "—")}</strong></div>`;
  const canDecide = item.status === "pending" && ["admin", "reviewer"].includes(state.user?.role) && item.author !== state.user?.username;
  const techniques = Array.isArray(rule.techniques) ? rule.techniques : [];
  const sources = Array.isArray(rule.data_sources) ? rule.data_sources : [];
  host.innerHTML = `<div class="review-inspector-head"><div><div class="review-inspector-eyebrow">${esc(t.details)} · ${esc(item.rule_id)}</div><h2>${esc(rule.name || item.rule_name)}</h2><span class="review-status ${esc(item.status)}">${esc(t[item.status] || item.status)}</span></div><button class="review-inspector-close" type="button" data-close-review aria-label="${esc(label("Close details", "Detalları bağla"))}">×</button></div>
    <div class="review-inspector-body">
      <div class="review-inspector-grid">${field(t.status,rule.status)}${field(t.quality,`${rule.quality ?? "—"}/5`)}${field(t.author,item.author)}${field(tr("reviews.dateLabel"),formatDate(item.created_at))}${field(t.reviewer,item.reviewer || "—")}${field(label("Decision", "Qərar"),t[item.status] || item.status)}</div>
      <section><h3>${esc(t.description)}</h3><p>${esc(rule.description || t.noDescription)}</p></section>
      <section><h3>${esc(t.techniques)}</h3><div class="review-inspector-tags">${techniques.length ? techniques.map(x=>`<span>${esc(x)}</span>`).join("") : "—"}</div></section>
      <section><h3>${esc(t.sources)}</h3><div class="review-inspector-tags">${sources.length ? sources.map(x=>`<span>${esc(x)}</span>`).join("") : "—"}</div></section>
      <section><h3>${esc(t.reviewNote)}</h3><p class="review-inspector-note">${esc(item.comment || "—")}</p></section>
      <section><h3>${esc(t.content)}</h3><pre class="review-inspector-code">${esc(rule.content || t.noContent)}</pre></section>
    </div>${canDecide ? `<div class="review-inspector-footer"><button type="button" class="btn primary" data-inspector-decision="approved">${esc(t.approve)}</button><button type="button" class="btn" data-inspector-decision="rejected">${esc(t.reject)}</button></div>` : ""}`;
  host.querySelector('[data-close-review]').addEventListener('click', () => { host.hidden = true; host.dataset.selected = ''; host.innerHTML = ''; });
  host.querySelectorAll('[data-inspector-decision]').forEach(btn => btn.addEventListener('click', () => onDecision(item, btn.dataset.inspectorDecision, btn)));
}

export async function renderReviews(root) {
  const t = w();
  root.innerHTML = `<div class="page"><div class="page-head"><div><h1>${t.title}</h1><p>${t.subtitle}</p></div></div><div class="review-queue">${t.loading}</div></div>`;
  const box = root.querySelector('.review-queue');
  if (!state.user) { box.innerHTML = `<div class="empty"><h3>${t.login}</h3><p>${t.loginHint}</p></div>`; return; }
  let items;
  try { items = await api.get('/api/reviews'); }
  catch (error) { box.innerHTML = `<div class="empty"><h3>${t.failed}</h3><p>${esc(error.message)}</p></div>`; return; }
  const counts = {pending:0, approved:0, rejected:0};
  items.forEach(item => { if (item.status in counts) counts[item.status]++; });
  const canReview = ['admin','reviewer'].includes(state.user.role);
  box.innerHTML = `<div class="review-summary">${Object.keys(counts).map(status=>`<div><strong>${counts[status]}</strong><span>${t[status]}</span></div>`).join('')}</div><div class="filters review-filter-bar"><label class="review-filter-label" for="reviewStatus"><span>${tr("reviews.statusLabel")}</span></label><select id="reviewStatus" class="review-filter-select"><option value="">${t.all}</option>${Object.keys(counts).map(status=>`<option value="${status}">${t[status]}</option>`).join('')}</select><span class="muted review-filter-hint">${t.hint}</span></div><div id="reviewRows"></div><div id="reviewInspector" class="review-inspector" hidden></div>`;
  const table = box.querySelector('#reviewRows');
  const inspector = box.querySelector('#reviewInspector');
  const decide = async (item, decision, btn) => {
    const comment = window.prompt(decision === 'rejected' ? t.reason : t.approvalNote, '');
    if (comment === null) return;
    if (decision === 'rejected' && !comment.trim()) { toast(t.reasonRequired, 'error'); return; }
    btn.disabled = true;
    try { await api.post(`/api/reviews/${item.id}/decision`, {decision, comment}); toast(t.saved, 'ok'); await renderReviews(root); }
    catch (error) { btn.disabled = false; toast(error.message, 'error'); }
  };
  const draw = () => {
    const filter = box.querySelector('#reviewStatus').value;
    const rows = items.filter(item => !filter || item.status === filter);
    table.innerHTML = rows.length ? `<div class="table-wrap review-table-wrap"><table class="review-table"><thead><tr><th>${t.rule}</th><th>${t.author}</th><th>${t.status}</th><th>${t.note}</th><th>${t.reviewer}</th><th>${t.decision}</th></tr></thead><tbody>${rows.map(item=>`<tr><td><button class="review-rule-link" type="button" data-view-rule="${item.id}" aria-label="${esc(t.view)}: ${esc(item.rule_name)}">${esc(item.rule_name)}</button></td><td>${esc(item.author)}</td><td><span class="review-status ${esc(item.status)}">${esc(t[item.status] || item.status)}</span></td><td class="review-note-cell">${esc(item.comment || '—')}</td><td>${esc(item.reviewer || '—')}</td><td><div class="review-actions">${item.status === 'pending' && canReview && item.author !== state.user.username ? `<button class="btn primary" data-review="${item.id}" data-decision="approved">${t.approve}</button><button class="btn" data-review="${item.id}" data-decision="rejected">${t.reject}</button>` : item.status === 'pending' ? t.pending : t.completed}</div></td></tr>`).join('')}</tbody></table></div>` : `<div class="empty"><h3>${t.empty}</h3></div>`;
  };
  box.querySelector('#reviewStatus').addEventListener('change',draw);
  table.addEventListener('click',async event => {
    const view = event.target.closest('[data-view-rule]');
    if (view) { const item = items.find(x=>String(x.id) === view.dataset.viewRule); if (item) { inspector.dataset.selected = String(item.id); await showRuleDetails(item, inspector, decide); inspector.scrollIntoView({behavior:'smooth',block:'nearest'}); } return; }
    const btn = event.target.closest('[data-review]');
    if (!btn) return;
    const item = items.find(x => String(x.id) === btn.dataset.review);
    if (item) await decide(item, btn.dataset.decision, btn);
  });
  draw();
}
