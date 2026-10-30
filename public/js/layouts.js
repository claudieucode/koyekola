// Mises en page avancées (programme 22.3) : galerie de variantes, aperçus filaires (structure réelle), comparaison, application, annulation. Aucune donnée n'est insérée en HTML : tout passe par textContent.
(() => {
  const root = document.getElementById("ly"); if (!root) return;
  const base = root.dataset.base, canWrite = root.dataset.write === "1", canRestore = root.dataset.restore === "1";
  const $ = (id) => document.getElementById(id), el = (t, c, txt) => { const e = document.createElement(t); if (c) e.className = c; if (txt !== undefined) e.textContent = txt; return e; };
  const status = (msg, k) => { const s = $("ly-status"); s.textContent = msg || ""; s.dataset.k = k || ""; };
  const api = async (path, opt) => { const r = await fetch(`${base}/api${path}`, { credentials: "same-origin", headers: { "Content-Type": "application/json" }, ...opt }); const j = await r.json().catch(() => ({ ok: false, error: "Réponse illisible." })); if (!j.ok) { const e = new Error(j.error || "Erreur."); e.code = j.code; e.blocked = j.blocked; throw e; } return j; };
  const post = (path, body) => api(path, { method: "POST", body: JSON.stringify(body || {}) });
  const ROLE = { hero: "Bandeau d'en-tête", intro: "Présentation", services: "Services", benefits: "Avantages", steps: "Processus", gallery: "Galerie / portfolio", portfolio: "Portfolio", testimonials: "Témoignages", faq: "Questions fréquentes", contact: "Contact", cta: "Appel à l'action", pricing: "Tarifs", stats: "Chiffres clés", team: "Équipe", logos: "Logos partenaires", text: "Texte éditorial", products: "Produits", categories: "Catégories", detail: "Fiche produit", compare: "Comparatif" };
  let catalog = null, variants = [], bp = "desktop", fam = "", picked = new Set(), sections = [], lastOp = null, familyNames = {};

  // ---- aperçu filaire : dessiné à partir du plan réel renvoyé par le serveur (pistes, portées, sens du flex) ----
  const tracks = (n) => (n.gridTemplate ? String(n.gridTemplate).split(/\s+/).map((t) => t.replace(/minmax\(0,\s*|\)/g, "")).join(" ") : n.columns ? Array(Number(n.columns)).fill("1fr").join(" ") : null);
  function draw(n) {
    const d = el("div", "w");
    const bg = n.backgroundColor === "token:secondary" ? "w-dark" : n.backgroundColor === "token:primary" ? "w-primary" : n.backgroundColor === "token:surface" ? "w-surface" : "";
    if (bg) d.classList.add(bg);
    if (n.t === "heading") { d.classList.add("w-heading"); if (n.lv === "1") d.classList.add("lv1"); d.title = n.l || ""; return d; }
    if (n.t === "text" || n.t === "iconlist" || n.t === "accordion" || n.t === "table") { d.classList.add("w-text"); return d; }
    if (n.t === "image") { d.classList.add("w-image"); if (n.aspectRatio) d.style.aspectRatio = String(n.aspectRatio).replace("/", " / "); return d; }
    if (n.t === "gallery") { d.classList.add("w-gallery"); return d; }
    if (n.t === "button") { d.classList.add("w-button"); return d; }
    if (!n.c) { d.classList.add("w-leaf"); return d; }
    const isGrid = n.display === "grid" || n.t === "grid";
    if (isGrid) { d.classList.add("w-grid"); const t = tracks(n); if (t) d.style.gridTemplateColumns = t; if (n.columns) d.style.gridTemplateColumns = `repeat(${Number(n.columns)}, minmax(0, 1fr))`; }
    else if (n.display === "flex" && String(n.flexDirection || "row").startsWith("row")) d.classList.add("w-row");
    else d.classList.add("w-box");
    if (n.minHeight) d.style.minHeight = String(n.minHeight).endsWith("vh") ? "70px" : n.minHeight;
    for (const k of n.c) {
      const ch = draw(k);
      const cs = k.gridColumnStart, ce = k.gridColumnEnd, rs = k.gridRowStart, re = k.gridRowEnd;
      if (isGrid) {
        if (cs && ce) ch.style.gridColumn = `${cs} / ${ce}`; else if (k.gridColumnSpan) ch.style.gridColumn = String(k.gridColumnSpan);
        if (rs && re) ch.style.gridRow = `${rs} / ${re}`; else if (k.gridRowSpan) ch.style.gridRow = String(k.gridRowSpan);
        if (k.gridAutoRows) d.style.gridAutoRows = "28px";
      }
      d.appendChild(ch);
    }
    if (n.gridAutoRows) d.style.gridAutoRows = "24px";
    return d;
  }
  const wire = (w) => { const box = el("div", "ly-wire"); box.setAttribute("role", "img"); box.setAttribute("aria-label", "Aperçu filaire de la structure"); for (const n of w[bp].c) box.appendChild(draw(n)); return box; };

  function card(v) {
    const c = el("article", "ly-card"); c.dataset.id = v.patternId; if (v.current) c.dataset.current = "1";
    c.appendChild(el("h3", "", v.label));
    const meta = el("div", "ly-meta");
    meta.append(el("span", "ly-chip", familyNames[v.family] || v.family), el("span", "ly-chip", v.mode === "grid" ? "Grille" : v.mode === "flex" ? "Flexbox" : "Empilement"), el("span", "ly-chip", `${v.score >= 85 ? "Équilibré" : v.score >= 70 ? "Correct" : "À revoir"} · ${v.score}`));
    meta.lastChild.dataset.k = v.score >= 85 ? "ok" : "warn";
    if (v.current) { const cur = el("span", "ly-chip", "Actuelle"); cur.dataset.k = "info"; meta.appendChild(cur); }
    c.appendChild(meta); c.appendChild(wire(v.wire));
    c.appendChild(el("p", "sw-muted", `${v.metrics.nodes} éléments · ${v.metrics.depth} niveaux${v.findings ? ` · ${v.findings} remarque(s) d'équilibre` : ""}`));
    const a = el("div", "ly-actions");
    const lab = el("label", ""); const cb = el("input"); cb.type = "checkbox"; cb.checked = picked.has(v.patternId); cb.addEventListener("change", () => { if (cb.checked) picked.add(v.patternId); else picked.delete(v.patternId); $("ly-cmp").textContent = `Comparer (${picked.size})`; $("ly-cmp").disabled = picked.size < 2; }); lab.append(cb, document.createTextNode(" Comparer"));
    const b = el("button", "btn btn-sm btn-primary", "Choisir"); b.type = "button"; b.disabled = !canWrite; b.addEventListener("click", () => choose(v));
    a.append(lab, b); c.appendChild(a); return c;
  }
  function render() {
    const g = $("ly-gallery"); g.replaceChildren();
    for (const v of variants) if (!fam || v.family === fam) g.appendChild(card(v));
    const fams = [...new Set(variants.map((v) => v.family))], bar = $("ly-fam"); bar.replaceChildren();
    for (const f of ["", ...fams]) { const b = el("button", "", f ? familyNames[f] || f : "Toutes"); b.type = "button"; b.setAttribute("aria-pressed", String(fam === f)); b.addEventListener("click", () => { fam = f; render(); }); bar.appendChild(b); }
  }
  $("ly-bp").addEventListener("click", (e) => { const b = e.target.closest("button[data-bp]"); if (!b) return; bp = b.dataset.bp; for (const x of $("ly-bp").children) x.setAttribute("aria-pressed", String(x === b)); render(); if (picked.size >= 2) compare(); });
  function compare() {
    const box = $("ly-compare"); box.replaceChildren(); const wrap = el("div", "ly-compare");
    for (const id of picked) { const v = variants.find((x) => x.patternId === id); if (!v) continue; const b = el("div", "ly-box"); b.appendChild(el("h3", "", v.label)); b.appendChild(wire(v.wire)); b.appendChild(el("p", "sw-muted", `${familyNames[v.family] || v.family} · score ${v.score} · ${v.metrics.nodes} éléments · profondeur ${v.metrics.depth}`)); wrap.appendChild(b); }
    box.appendChild(wrap);
  }
  $("ly-cmp").addEventListener("click", compare);

  // ---- contenu ----
  function content() {
    const items = $("ly-items").value.split("\n").map((l) => l.split("|").map((s) => s.trim())).filter((p) => p[0]).map((p) => ({ title: p[0], ...(p[1] ? { text: p[1] } : {}), ...(p[2] ? { price: p[2] } : {}) }));
    const c = { kind: $("ly-role").value, title: $("ly-title").value.trim(), eyebrow: $("ly-eyebrow").value.trim(), text: $("ly-text").value.trim(), items };
    if ($("ly-img").value.trim()) c.image = { src: $("ly-img").value.trim(), alt: $("ly-alt").value.trim() };
    if ($("ly-cta").value.trim() && $("ly-cta-url").value.trim()) c.cta = { label: $("ly-cta").value.trim(), url: $("ly-cta-url").value.trim() };
    return c;
  }
  function fill(c) { $("ly-title").value = c.title || ""; $("ly-eyebrow").value = c.eyebrow || ""; $("ly-text").value = c.text || ""; $("ly-items").value = (c.items || []).map((i) => [i.title || "", i.text || "", i.price || ""].join(" | ").replace(/( \| )+$/, "")).join("\n"); $("ly-img").value = (c.image && c.image.src) || ""; $("ly-alt").value = (c.image && c.image.alt) || ""; $("ly-cta").value = (c.cta && c.cta.label) || ""; $("ly-cta-url").value = (c.cta && c.cta.url) || ""; }
  async function loadSections() {
    const pid = $("ly-page").value, sel = $("ly-section"); sel.replaceChildren(new Option("Nouvelle section", "")); sections = [];
    if (!pid) return;
    try { const r = await api(`/pages/${pid}/sections`); sections = r.sections; for (const s of r.sections) sel.add(new Option(`${s.index + 1}. ${s.name || s.type}${s.generated ? " (générée)" : ""}${s.state === "locked" ? " 🔒" : ""}`, s.id)); } catch (e) { status(e.message, "error"); }
  }
  $("ly-page").addEventListener("change", loadSections);
  $("ly-section").addEventListener("change", () => { const s = sections.find((x) => x.id === $("ly-section").value); if (s && s.generated) { $("ly-role").value = s.role; fill(s.content || {}); } });

  $("ly-form").addEventListener("submit", async (e) => {
    e.preventDefault(); status("Composition des variantes…"); picked = new Set(); $("ly-compare").replaceChildren(); $("ly-cmp").textContent = "Comparer (0)"; $("ly-cmp").disabled = true;
    try {
      const sid = $("ly-section").value, s = sections.find((x) => x.id === sid);
      const r = await post("/variantes", { pageId: Number($("ly-page").value), sectionId: sid || undefined, role: $("ly-role").value, pageType: $("ly-ptype").value, content: content() });
      variants = r.variants.map((v) => ({ ...v, current: s && s.patternId === v.patternId }));
      $("ly-results").hidden = false; render();
      const rej = $("ly-rejected"); rej.replaceChildren();
      if (r.rejected.length) { rej.appendChild(el("p", "", "Layouts écartés pour ce contenu :")); const ul = el("ul"); for (const x of r.rejected) ul.appendChild(el("li", "", `${x.label} — ${x.reason}`)); rej.appendChild(ul); }
      status(variants.length ? `${variants.length} variante(s) réellement différente(s).` : "Aucune variante ne convient à ce contenu : complétez-le (image, chiffres, tarifs…).", variants.length ? "ok" : "error");
    } catch (err) { status(err.message, "error"); }
  });

  // ---- application ----
  async function choose(v) {
    status("Préparation de la proposition…"); const box = $("ly-proposal"); box.replaceChildren();
    try {
      const sid = $("ly-section").value;
      const r = await post("/proposer", { pageId: Number($("ly-page").value), pageType: $("ly-ptype").value, items: [{ role: $("ly-role").value, content: content(), patternId: v.patternId, sectionId: sid || undefined }] });
      const b = el("div", "ly-box"); b.appendChild(el("h3", "", `Proposition : ${r.changes[0].label}`));
      b.appendChild(el("p", "", r.changes[0].action === "replace" ? "La section sera remplacée (son identifiant et sa place sont conservés)." : "Une section sera ajoutée à la fin de la page."));
      if (r.requiresConfirmation) { const w = el("p", "", `Confirmation requise : ${r.reasons.join(" ; ")}.`); w.dataset.k = "warn"; b.appendChild(w); }
      const list = el("ul"); for (const f of r.results[0].balance.findings) list.appendChild(el("li", "", f.message)); if (list.children.length) { b.appendChild(el("p", "", "Remarques d'équilibre :")); b.appendChild(list); }
      if (r.results[0].corrected) b.appendChild(el("p", "sw-muted", `Correction automatique appliquée (${r.results[0].corrected.rule}) : ${r.results[0].corrected.before} → ${r.results[0].corrected.after}.`));
      const row = el("div", "ly-actions"); let cb = null;
      if (r.requiresConfirmation) { const l = el("label", ""); cb = el("input"); cb.type = "checkbox"; l.append(cb, document.createTextNode(" J'ai lu l'aperçu et je confirme")); row.appendChild(l); }
      const ok = el("button", "btn btn-primary", "Appliquer au brouillon"); ok.type = "button"; const no = el("button", "btn", "Refuser"); no.type = "button";
      ok.addEventListener("click", async () => {
        try { const sec = sid; const allow = sec ? [sec] : []; await post(`/operations/${r.opId}/appliquer`, { confirm: cb ? cb.checked : false, allow: cb && cb.checked ? allow : [] }); lastOp = r.opId; box.replaceChildren(); status("Brouillon mis à jour. Rien n'est publié : retrouvez la section dans l'éditeur de la page.", "ok"); $("ly-undo").hidden = !canRestore; await loadSections(); }
        catch (err) { status(err.code === "protected" ? "Cette section est verrouillée : aucune modification." : err.message, "error"); }
      });
      no.addEventListener("click", async () => { try { await post(`/operations/${r.opId}/refuser`); box.replaceChildren(); status("Proposition refusée.", "ok"); } catch (err) { status(err.message, "error"); } });
      row.append(ok, no); b.appendChild(row); box.appendChild(b); status("");
    } catch (err) { status(err.message, "error"); }
  }
  $("ly-undo").addEventListener("click", async () => { if (!lastOp) return; try { await post(`/operations/${lastOp}/annuler`); status("Composition annulée : la page retrouve son état précédent.", "ok"); $("ly-undo").hidden = true; lastOp = null; await loadSections(); } catch (err) { status(err.message, "error"); } });

  (async () => {
    try {
      const [c, p] = await Promise.all([api("/catalogue"), api("/pages")]); catalog = c; familyNames = c.families;
      const rs = $("ly-role"); for (const r of c.roles) rs.add(new Option(ROLE[r] || r, r)); rs.value = "services";
      for (const x of p.pages) $("ly-page").add(new Option(x.name, x.id));
    } catch (e) { status(e.message, "error"); }
  })();
})();
