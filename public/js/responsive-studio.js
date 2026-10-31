// Responsive Studio (programme 22.8) : diagnostic, proposition, application, annulation. Aucune donnée n'est insérée en HTML : tout passe par textContent.
(() => {
  const root = document.getElementById("rs"); if (!root) return;
  const base = root.dataset.base, canWrite = root.dataset.write === "1", canRestore = root.dataset.restore === "1";
  const $ = (id) => document.getElementById(id), el = (t, c, txt) => { const e = document.createElement(t); if (c) e.className = c; if (txt !== undefined) e.textContent = txt; return e; };
  const status = (msg, k) => { const s = $("rs-status"); s.textContent = msg || ""; s.dataset.k = k || ""; };
  const api = async (path, opt) => { const r = await fetch(`${base}/api${path}`, { credentials: "same-origin", headers: { "Content-Type": "application/json" }, ...opt }); const j = await r.json().catch(() => ({ ok: false, error: "Réponse illisible." })); if (!j.ok) { const e = new Error(j.error || "Erreur."); e.code = j.code; throw e; } return j; };
  const post = (path, body) => api(path, { method: "POST", body: JSON.stringify(body || {}) });
  const SEV = { blocking: "Bloquant", warning: "À corriger", suggestion: "Amélioration" };
  const DEV = { mobile: "Mobile", tablet: "Tablette", desktop: "Ordinateur", wide: "Grand écran" };
  let current = null, lastApplied = null, lastPage = null;

  async function loadProfiles() {
    const j = await api("/profils"), ul = $("rs-profiles"); ul.textContent = "";
    for (const p of j.profiles) { const li = el("li"); li.append(el("strong", "", p.label), el("span", "", ` ${p.width} px`), el("span", "rs-tag", DEV[p.device] || p.device)); ul.append(li); }
    const w = $("rs-bp-issues"); w.hidden = !j.issues.length; w.textContent = j.issues.join(" ");
  }
  async function loadPages() { const j = await api("/pages"), s = $("rs-page"); for (const p of j.pages) { const o = el("option", "", p.name); o.value = p.id; s.append(o); } }

  function renderIssues(issues, fixablePage) {
    const box = $("rs-issues"); box.textContent = "";
    if (!issues.length) { box.append(el("p", "sw-muted", "Aucun problème détecté par l'analyse statique (le rendu réel dans un navigateur se vérifie par les tests d'audit).")); return; }
    for (const i of issues) {
      const row = el("article", "rs-issue"); row.dataset.sev = i.severity;
      row.append(el("span", "rs-sev", SEV[i.severity]), el("span", "rs-dev", DEV[i.device] || i.device), el("strong", "", i.element), el("p", "", i.message), el("code", "", `${i.pageName ? i.pageName + " · " : ""}${i.evidence}`));
      if (i.fix && canWrite && fixablePage) { const b = el("button", "btn btn-sm", "Proposer la correction"); b.type = "button"; b.addEventListener("click", () => propose({ pageId: fixablePage, scope: "node", sectionId: i.section, nodeId: i.node, rules: [i.rule] })); row.append(b); }
      box.append(row);
    }
  }
  async function analyse(e) {
    if (e) e.preventDefault();
    const pid = $("rs-page").value; status("Analyse…");
    try {
      if (pid) { const j = await api(`/pages/${pid}/analyse`); lastPage = Number(pid); renderIssues(j.issues, lastPage); summary(j.summary); if (canWrite && j.summary.fixable) { const b = el("button", "btn btn-primary", `Proposer toutes les corrections de la page (${j.summary.fixable})`); b.type = "button"; b.addEventListener("click", () => propose({ pageId: lastPage, scope: "page" })); $("rs-issues").prepend(b); } }
      else { const j = await api("/analyse"); lastPage = null; renderIssues(j.pages.flatMap((p) => p.issues), null); summary(j.summary, `${j.pages.length} pages — lecture seule : choisissez une page pour proposer des corrections.`); }
      status("");
    } catch (err) { status(err.message, "err"); }
  }
  function summary(s, extra) { $("rs-summary").textContent = `${s.blocking} bloquant(s), ${s.warning} à corriger, ${s.suggestion} amélioration(s) — ${s.fixable} corrigeable(s) automatiquement.${extra ? " " + extra : ""}`; }

  async function propose(body) {
    status("Préparation de l'aperçu…");
    try {
      const j = await post("/proposer", body); current = j;
      const ul = $("rs-changes"); ul.textContent = "";
      for (const c of j.changes) ul.append(el("li", "", `${DEV[c.path.split("/")[2]] || c.path.split("/")[2]} · ${c.path.split("/")[3]} : ${c.before} → ${c.after}`));
      $("rs-reasons").hidden = !j.reasons.length; $("rs-reasons").textContent = j.reasons.join(" ; ");
      $("rs-confirm-wrap").hidden = !j.requiresConfirmation; $("rs-confirm").checked = false;
      $("rs-proposal").hidden = false; $("rs-proposal").scrollIntoView({ block: "nearest" }); status("Relisez la proposition avant de l'appliquer. Rien n'est encore modifié.");
    } catch (err) { status(err.message, "err"); }
  }
  async function applyIt() {
    if (!current) return;
    try { await post(`/operations/${current.opId}/appliquer`, { confirm: $("rs-confirm").checked }); lastApplied = current.opId; current = null; $("rs-proposal").hidden = true; $("rs-undo").hidden = !canRestore; await analyse(); status("Brouillon mis à jour. Rien n'est publié ; vous pouvez annuler.", "ok"); }
    catch (err) { status(err.message, "err"); }
  }
  async function rejectIt() { if (!current) return; try { await post(`/operations/${current.opId}/refuser`); } catch { /* déjà traitée */ } current = null; $("rs-proposal").hidden = true; status("Proposition refusée."); }
  async function undoIt() { if (!lastApplied) return; try { await post(`/operations/${lastApplied}/annuler`); lastApplied = null; $("rs-undo").hidden = true; await analyse(); status("Correction annulée.", "ok"); } catch (err) { status(err.message, "err"); } }

  $("rs-form").addEventListener("submit", analyse); $("rs-apply").addEventListener("click", applyIt); $("rs-reject").addEventListener("click", rejectIt); $("rs-undo").addEventListener("click", undoIt);
  if (!canWrite) $("rs-apply").hidden = true;
  Promise.all([loadProfiles(), loadPages()]).then(() => analyse()).catch((e) => status(e.message, "err"));
})();
