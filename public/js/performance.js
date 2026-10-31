// Tableau de bord de performance (programme 22.9). Aucune donnée n'est insérée en HTML : tout passe par textContent.
(() => {
  const root = document.getElementById("pf"); if (!root) return;
  const base = root.dataset.base, canWrite = root.dataset.write === "1";
  const $ = (id) => document.getElementById(id), el = (t, c, txt) => { const e = document.createElement(t); if (c) e.className = c; if (txt !== undefined) e.textContent = txt; return e; };
  const status = (msg, bad) => { const s = $("pf-status"); s.textContent = msg || ""; s.classList.toggle("is-error", Boolean(bad)); };
  const api = async (path, opt) => { const r = await fetch(`${base}/api${path}`, { credentials: "same-origin", headers: { "Content-Type": "application/json" }, ...opt }); const j = await r.json().catch(() => ({ ok: false, error: "Réponse illisible." })); if (!j.ok) throw new Error(j.error || "Erreur."); return j; };
  const post = (path, body) => api(path, { method: "POST", body: JSON.stringify(body || {}) });
  const kb = (n) => (n === null || n === undefined ? "—" : n >= 1024 ? `${(n / 1024).toFixed(1)} Ko` : `${n} o`);
  const LABEL = { htmlBytes: "Poids du HTML", htmlGzipBytes: "HTML compressé", domNodes: "Éléments DOM", domDepth: "Profondeur du DOM", requests: "Requêtes référencées", jsBytes: "JavaScript", jsGzipBytes: "JavaScript compressé", cssBytes: "CSS", cssGzipBytes: "CSS compressé", inlineCssBytes: "CSS en ligne", images: "Images", blockingScripts: "Scripts bloquants", blockingStyles: "Feuilles bloquantes", externalOrigins: "Domaines externes", lcp: "LCP", inp: "INP", cls: "CLS", ttfb: "Temps de réponse serveur" };
  const fmt = (m) => (m.value === null ? "indisponible" : /Bytes$/.test(m.name) ? kb(m.value) : m.name === "ttfb" || m.name === "lcp" || m.name === "inp" ? `${m.value} ms` : String(m.value)) + (m.rating ? ` (${m.rating})` : "");
  const KIND = { mesure: "Mesure", estimation: "Estimation", indisponible: "Indisponible" };
  let pageId = null, vue = null;

  function renderLog(log) { const ul = $("pf-log"); ul.replaceChildren(); for (const l of log.slice(0, 5)) ul.append(el("li", "", `${l.at} — priorité de l'image principale : ${l.before ? "activée" : "désactivée"} → ${l.after ? "activée" : "désactivée"}`)); }
  async function load() {
    const j = await api("/vue"); vue = j.overview; $("pf-lcp").checked = j.settings.lcpPriority; renderLog(j.log);
    const t = vue.totals; $("pf-totals").textContent = `${t.pages} page(s) · ${t.analyzed} analysée(s) · ${t.withHighFindings} avec constat élevé · ${vue.field.note}`;
    const tb = $("pf-rows"); tb.replaceChildren();
    for (const p of vue.pages) {
      const tr = el("tr"); tr.append(el("td", "", p.name), el("td", "", p.status === "published" ? "Publiée" : "Non publiée"));
      if (p.analyzed) tr.append(el("td", "", p.at), el("td", "", `${p.findings} (dont ${p.high} élevé)`), el("td", "", kb(p.metrics.htmlGzipBytes)), el("td", "", kb(p.metrics.jsBytes)), el("td", "", kb(p.metrics.cssBytes)), el("td", "", String(p.metrics.domNodes)));
      else for (let i = 0; i < 6; i++) tr.append(el("td", "", "—"));
      const td = el("td"), b = el("button", "btn", p.analyzed ? "Ré-analyser" : "Analyser"); b.type = "button"; b.disabled = p.status !== "published"; if (b.disabled) b.title = "Seule une page publiée peut être analysée.";
      b.addEventListener("click", () => analyze(p.id)); td.append(b);
      if (p.analyzed) { const d = el("button", "btn", "Détail"); d.type = "button"; d.addEventListener("click", () => detail(p.id, p.reportId)); td.append(" ", d); }
      tr.append(td); tb.append(tr);
    }
  }
  function show(rep) {
    $("pf-detail").hidden = false; $("pf-conditions").textContent = `${rep.conditions.source} · ${rep.conditions.env} · ${rep.conditions.at} · seuils : ${rep.vitals}. ${rep.conditions.note}`;
    const tb = $("pf-metrics"); tb.replaceChildren();
    for (const k of Object.keys(LABEL)) { const m = rep.metrics[k]; if (!m) continue; const tr = el("tr"), tdk = el("td"); const bd = el("span", `pf-badge is-${m.kind}`, KIND[m.kind]); tdk.append(bd);
      tr.append(el("td", "", LABEL[k]), el("td", "", fmt(m)), (() => { const td = el("td"); td.append(bd, " ", m.source || m.note || ""); return td; })(), el("td", "", m.profile ? `${m.env} · ${m.profile}` : m.env)); tb.append(tr); }
    const ol = $("pf-findings"); ol.replaceChildren();
    if (!rep.findings.length) ol.append(el("li", "", "Aucun constat sur les règles vérifiées."));
    for (const f of rep.findings) { const li = el("li"); li.append(el("span", `pf-sev s-${f.severity}`, `[${f.severity}] `), el("strong", "", f.title), el("span", "pf-meta", f.detail), el("span", "pf-meta", `Origine : ${f.origin} · Impact : ${f.impact} · Difficulté : ${f.difficulty} · ${KIND[f.kind] || "Mesure"}${f.auto ? " · corrigé automatiquement" : ""}`), el("span", "pf-meta", `Correction : ${f.fix}`)); ol.append(li); }
  }
  async function history() {
    const j = await api(`/pages/${pageId}/historique`);
    for (const id of ["pf-before", "pf-after"]) { const s = $(id); s.replaceChildren(); for (const h of j.history) s.append(new Option(`#${h.id} — ${h.at} — build ${h.build} — priorité image ${h.optimization.lcpPriority ? "oui" : "non"}`, String(h.id))); }
    if (j.history.length > 1) { $("pf-before").selectedIndex = 1; $("pf-after").selectedIndex = 0; }
  }
  async function detail(pid, rid) { try { pageId = pid; const j = await api(`/rapports/${rid}`); show(j.report.report); await history(); status(""); } catch (e) { status(e.message, true); } }
  async function analyze(pid) {
    try { status("Analyse en cours…"); pageId = pid; const j = await post(`/pages/${pid}/analyser`); show(j.report); await history(); await load(); status("Analyse terminée."); if (j.comparison) renderCompare(j.comparison); }
    catch (e) { status(e.message, true); }
  }
  function renderCompare(c) {
    const out = $("pf-compare-out"); out.replaceChildren();
    out.append(el("p", "", `Verdict : ${c.verdict}. Les écarts insignifiants ou plus petits que la variabilité mesurée ne sont jamais présentés comme des régressions.`));
    const ul = el("ul"); for (const i of c.items) ul.append(el("li", "", `${LABEL[i.metric] || i.metric} : ${i.before} → ${i.after} (${i.verdict}${i.reason ? " — " + i.reason : ""})`));
    for (const s of c.skipped) ul.append(el("li", "", `${LABEL[s.metric] || s.metric} : non comparé (${s.reason})`)); out.append(ul);
  }
  $("pf-compare").addEventListener("click", async () => { try { const j = await post("/comparer", { before: Number($("pf-before").value), after: Number($("pf-after").value) }); renderCompare(j.comparison); } catch (e) { status(e.message, true); } });
  $("pf-lcp").addEventListener("change", async (ev) => { if (!canWrite) return; try { await post("/options", { option: "lcpPriority", value: ev.target.checked }); status("Réglage enregistré."); await load(); } catch (e) { ev.target.checked = !ev.target.checked; status(e.message, true); } });
  load().catch((e) => status(e.message, true));
})();
