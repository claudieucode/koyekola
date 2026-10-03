// Panneaux de l'espace de travail SEO : affichage uniquement. Les calculs viennent du moteur SEO (analyse de l'éditeur,
// partagée avec le serveur) ou du serveur (couche de données partagée /formateur/blog/:id/espace-seo). Une donnée
// absente est dite telle quelle : « Non connecté », « Données indisponibles », « Pas assez de données ».

// ---------- Couche de données partagée (côté navigateur) ----------
// Un seul appel par partie et par article, mis en cache ; plusieurs panneaux qui lisent la même partie partagent la
// même réponse (et la même requête si elle est déjà en cours). Vidée après chaque enregistrement de l'article.
export function createSeoData({ api, postId }) {
  const cache = new Map();
  const pending = new Map();
  const subs = new Map();
  let analysis = null;
  const emit = (type, payload) => { for (const fn of subs.get(type) || []) { try { fn(payload); } catch (e) { console.error(e); } } for (const fn of subs.get("*") || []) { try { fn(type, payload); } catch (e) { console.error(e); } } };
  return {
    on(type, fn) { if (!subs.has(type)) subs.set(type, new Set()); subs.get(type).add(fn); return () => subs.get(type).delete(fn); },
    publishAnalysis(r) { analysis = r; emit("analysis", r); },
    analysis: () => analysis,
    cached: (part) => cache.get(part),
    async get(part, { force = false } = {}) {
      const id = postId();
      if (!id) return null;
      const key = `${id}:${part}`;
      if (!force && cache.has(key)) return cache.get(key);
      if (pending.has(key)) return pending.get(key);
      // Les parties demandées en même temps sont regroupées en un seul appel
      const p = api(`/formateur/blog/${id}/espace-seo?parties=${encodeURIComponent(part)}`).then((r) => { cache.set(key, r[part]); pending.delete(key); emit(`data:${part}`, r[part]); return r[part]; }, (e) => { pending.delete(key); throw e; });
      pending.set(key, p);
      return p;
    },
    peek(part) { const id = postId(); return id ? cache.get(`${id}:${part}`) : undefined; },
    invalidate() { cache.clear(); emit("invalidate"); },
    emit,
  };
}

// ---------- Outils d'affichage ----------
export function createRenderers({ h, data, api, postId, isVisible, reveal, fmtDate }) {
  const nf = (n, d = 1) => (n === null || n === undefined || Number.isNaN(n) ? "Données indisponibles" : Number(n).toLocaleString("fr-FR", { maximumFractionDigits: d }));
  const pct = (n) => (n === null || n === undefined ? "Données indisponibles" : `${(n * 100).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`);
  const box = (part) => document.querySelector(`[data-wsp-part="${part}"]`);
  const row = (k, v, cls) => [h("dt", {}, k), h("dd", { class: cls || null }, v)];
  const help = (t) => h("p", { class: "wp-help" }, t);
  const ok = (b) => (b ? "✓" : "✗");
  const needsSave = () => help("Disponible après le premier enregistrement de l'article.");
  const errorBox = (e) => h("p", { class: "wp-error" }, e.message || String(e));
  const refreshBtn = (part, label = "Actualiser") => h("button", { type: "button", class: "wp-btn-link wsp-refresh", onclick: () => loadPart(part, true) }, label);

  // ----- Analyse du contenu (moteur de l'éditeur) -----
  function content(r) {
    const dl = document.querySelector("[data-wsp-content]");
    if (!dl || !r || !r.stats) return;
    const s = r.stats;
    dl.replaceChildren(
      ...row("Titre (H1)", s.title || "Aucun titre"),
      ...row("Titre SEO", s.seoTitle ? `${s.seoTitle} (${s.seoTitle.length} car.)` : "Le titre de l'article"),
      ...row("Méta description", s.metaDescription ? `${s.metaDescription.length} caractères` : "Aucune"),
      ...row("H1", s.h1InContent ? `${s.h1} (dont ${s.h1InContent} dans le texte : un seul H1 conseillé)` : `${s.h1}`, s.h1InContent ? "is-warn" : null),
      ...row("H2 · H3 · H4", `${s.headings.h2} · ${s.headings.h3} · ${s.headings.h4}`),
      ...row("Longueur", `${r.words} mots · ${r.minutes} min de lecture`),
      ...row("Paragraphes", String(s.paragraphs)),
      ...row("Phrases", s.sentences ? `${s.sentences} (moyenne ${nf(s.avgSentenceWords)} mots, ${s.longSentences} longue${s.longSentences > 1 ? "s" : ""})` : "Pas assez de texte"),
      ...row("Listes", String(s.lists)),
      ...row("Liens", `${s.internalLinks.length} interne${s.internalLinks.length > 1 ? "s" : ""} · ${s.externalLinks.length} externe${s.externalLinks.length > 1 ? "s" : ""}`),
      ...row("Images", s.images.total ? `${s.images.total}${s.images.withoutAlt ? ` (${s.images.withoutAlt} sans texte alternatif)` : ""}` : "Aucune", s.images.withoutAlt ? "is-bad" : null));
  }

  // ----- Facteurs de la note (contrôles réels du moteur) -----
  const GROUP_LABEL = { keyword: "Mot-clé", seo: "Référencement", structure: "Contenu et structure", media: "Images", links: "Liens", readability: "Lisibilité" };
  function factors(r) {
    const el = document.querySelector("[data-seo-factors]");
    if (!el || !r) return;
    const groups = {};
    for (const c of r.checks) { const g = (groups[c.group] = groups[c.group] || { good: 0, improve: 0, problem: 0 }); g[c.status]++; }
    el.replaceChildren(
      h("ul", { class: "wsp-factor-list" }, ...Object.entries(groups).map(([g, n]) => h("li", {}, h("span", {}, GROUP_LABEL[g] || g), h("span", { class: "wsp-factor-counts" }, h("span", { class: "be-good" }, `${n.good} ✓`), n.improve ? h("span", { class: "be-improve" }, `${n.improve} ~`) : null, n.problem ? h("span", { class: "be-problem" }, `${n.problem} ✗`) : null)))),
      help(`Calcul : chaque contrôle réussi vaut 1 point, « à améliorer » ½, « problème » 0, sur ${r.checks.length} contrôles. Repère interne, pas une note de Google.`));
  }

  // ----- Mots-clés -----
  function keywords(r) {
    const el = document.querySelector("[data-wsp-keywords]");
    if (!el || !r) return;
    const ks = r.keywordStats || [];
    if (!ks.length) { el.replaceChildren(help("Aucun mot-clé renseigné : indiquez au moins le mot-clé principal.")); }
    else el.replaceChildren(h("table", { class: "wsp-table" },
      h("thead", {}, h("tr", {}, ...["Expression", "Occurrences", "Densité", "Titre", "Intertitres", "Description"].map((t) => h("th", { scope: "col" }, t)))),
      h("tbody", {}, ...ks.map((k) => h("tr", {}, h("td", {}, k.phrase, h("small", {}, k.kind)), h("td", {}, String(k.count)), h("td", {}, `${nf(k.density)} %`), h("td", {}, ok(k.inTitle)), h("td", {}, String(k.inHeadings)), h("td", {}, ok(k.inMeta)))))),
    help("Variantes et synonymes : non implémenté (le moteur compte l'expression exacte, accents et majuscules ignorés)."));
    if (isVisible("keyword")) gscQueries();
  }
  async function gscQueries() {
    const el = document.querySelector("[data-wsp-keywords-gsc]");
    if (!el || !postId()) { el && el.replaceChildren(); return; }
    let g;
    try { g = await data.get("gsc"); } catch (e) { el.replaceChildren(errorBox(e)); return; }
    if (!g) return;
    const title = h("p", { class: "wp-label" }, "Recherches réelles de cette page");
    if (g.state !== "connected") { el.replaceChildren(title, help(`Google Search Console : ${g.label}.`)); return; }
    if (!g.data) { el.replaceChildren(title, help(g.reason || "Données indisponibles.")); return; }
    const q = g.data.queries.slice(0, 8);
    el.replaceChildren(title, q.length ? h("table", { class: "wsp-table" }, h("thead", {}, h("tr", {}, ...["Recherche", "Impr.", "Clics", "Position"].map((t) => h("th", { scope: "col" }, t)))), h("tbody", {}, ...q.map((x) => h("tr", {}, h("td", {}, x.query), h("td", {}, nf(x.impressions, 0)), h("td", {}, nf(x.clicks, 0)), h("td", {}, nf(x.position)))))) : help("Pas assez de données : aucune recherche n'a encore affiché cette page."), h("p", { class: "wsp-source" }, `Source : Google Search Console (${g.data.period.current.start} → ${g.data.period.current.end})`));
  }

  // ----- Parties serveur -----
  const RENDER = {
    opportunities(d) {
      const items = d.items || [];
      return [items.length ? h("ul", { class: "wsp-items" }, ...items.map((o) => h("li", {}, h("strong", {}, o.title), o.evidence ? h("span", {}, o.evidence) : null, o.action ? h("span", { class: "wsp-action" }, `→ ${o.action}`) : null, h("span", { class: "wsp-source" }, `Source : ${o.source}`)))) : help("Aucune opportunité détectée pour cet article."),
        help(`Sources consultées — audit : ${d.sources.audit} · Search Console : ${d.sources.gsc}.`)];
    },
    technical(p) {
      const out = [];
      if (!p.online || !p.live) out.push(help(p.reason || "Page non disponible."));
      const dl = h("dl", { class: "wsp-stats" });
      if (p.live && !p.live.reachable) dl.append(...row("Page en ligne", `Injoignable : ${p.live.error}`, "is-bad"));
      if (p.live && p.live.reachable) {
        const L = p.live;
        const noindex = /noindex/i.test(`${L.robots || ""} ${L.xRobots || ""}`);
        dl.append(
          ...row("Réponse", `${L.status} en ${L.ms} ms`, L.status === 200 ? null : "is-bad"),
          ...row("Canonical", L.canonical ? `${L.canonical}${L.canonicalCount > 1 ? ` (${L.canonicalCount} balises !)` : ""}` : "Aucune", !L.canonical || L.canonicalCount > 1 ? "is-bad" : null),
          ...row("Robots (page)", L.robots || "Aucune balise (indexable)", noindex ? "is-bad" : null),
          ...row("X-Robots-Tag", L.xRobots || "Aucun"),
          ...row("Données structurées", L.schemaTypes.length ? L.schemaTypes.join(", ") : "Aucune", L.schemaProblems.length ? "is-warn" : null));
        if (L.schemaProblems.length) dl.append(...row("Problèmes du schéma", L.schemaProblems.map((x) => x.message).join(" · "), "is-warn"));
      }
      dl.append(
        ...row("robots.txt", p.robotsTxtAllowed ? "Adresse autorisée à Google" : "Adresse INTERDITE à Google", p.robotsTxtAllowed ? null : "is-bad"),
        ...row("Plan du site", p.sitemap.included ? "Incluse" : `Exclue : ${p.sitemap.reason}`, p.sitemap.included ? null : "is-warn"),
        ...row("Réglage de l'article", `${p.settingsRobots.index ? "index" : "noindex"}, ${p.settingsRobots.follow ? "follow" : "nofollow"}`),
        ...row("Anciennes adresses (301)", p.oldSlugs.length ? p.oldSlugs.join(", ") : "Aucune"),
        ...row("Redirections vers l'article", p.redirectsIn.length ? p.redirectsIn.map((r) => `${r.source_path} (${r.status}, ${r.hits} visites)`).join(", ") : "Aucune"),
        ...row("Statut d'indexation chez Google", "Non implémenté (inspection d'URL Search Console)"));
      out.push(dl);
      return out;
    },
    performance(p) {
      const out = [];
      const runRow = h("div", { class: "wsp-row" });
      if (p.canRun) for (const [strategy, label] of [["mobile", "Mesurer (mobile)"], ["desktop", "Mesurer (ordinateur)"]]) runRow.append(h("button", { type: "button", class: "wp-btn-secondary", onclick: (e) => runPsi(e.currentTarget, strategy) }, label));
      else out.push(help(p.reason || "Mesure indisponible."));
      out.push(runRow);
      if (!p.history.length) out.push(help("Aucune mesure pour cette page."));
      else out.push(h("table", { class: "wsp-table" }, h("thead", {}, h("tr", {}, ...["Date", "Appareil", "Note", "LCP", "CLS", "TBT"].map((t) => h("th", { scope: "col" }, t)))),
        h("tbody", {}, ...p.history.map((m) => (m.ok && m.data ? h("tr", {}, h("td", {}, fmtDate(m.fetched_at)), h("td", {}, m.strategy === "desktop" ? "Ordinateur" : "Mobile"), h("td", {}, m.data.performance === null ? "—" : `${m.data.performance}/100`), h("td", {}, m.data.lab.lcp === null ? "—" : `${nf(m.data.lab.lcp / 1000, 2)} s`), h("td", {}, m.data.lab.cls === null ? "—" : nf(m.data.lab.cls, 3)), h("td", {}, m.data.lab.tbt === null ? "—" : `${Math.round(m.data.lab.tbt)} ms`)) : h("tr", {}, h("td", {}, fmtDate(m.fetched_at)), h("td", { colspan: "5", class: "wp-error" }, m.error)))))));
      out.push(h("p", { class: "wsp-source" }, "Source : Google PageSpeed Insights (mesure de laboratoire)."));
      return out;
    },
    gsc(g) {
      if (g.state !== "connected") return [help(`Google Search Console : ${g.label}.`), h("a", { href: "/formateur/seo/integrations", target: "_blank", rel: "noopener", class: "wp-btn-link" }, "Configurer l'intégration")];
      if (!g.data) return [help(g.reason || "Aucune donnée de performance disponible.")];
      const c = g.data.totals.current; const prev = g.data.totals.previous;
      if (!c.impressions) return [help("Pas assez de données : aucune impression sur la période."), h("p", { class: "wsp-source" }, `Source : Google Search Console (${g.data.period.current.start} → ${g.data.period.current.end})`)];
      const diff = (a, b) => (b === null || b === undefined ? "" : ` (${a - b >= 0 ? "+" : ""}${nf(a - b, 0)})`);
      return [h("dl", { class: "wsp-stats" }, ...row("Clics", `${nf(c.clicks, 0)}${diff(c.clicks, prev.clicks)}`), ...row("Impressions", `${nf(c.impressions, 0)}${diff(c.impressions, prev.impressions)}`), ...row("Taux de clic", pct(c.ctr)), ...row("Position moyenne", nf(c.position))),
        h("p", { class: "wsp-source" }, `Source : Google Search Console · ${g.data.period.current.start} → ${g.data.period.current.end}, comparé à la période précédente · reçu le ${fmtDate(g.data.fetchedAt)}`)];
    },
    external(list) {
      return [h("ul", { class: "wsp-items" }, ...list.map((x) => h("li", {}, h("strong", {}, x.label), h("span", { class: `wsp-state is-${x.state}` }, x.stateLabel), x.detail ? h("small", {}, x.detail) : null))),
        help("Autres fournisseurs (Semrush, Ahrefs, DataForSEO…) : non intégrés au site."), h("a", { href: "/formateur/seo/integrations", target: "_blank", rel: "noopener", class: "wp-btn-link" }, "Gérer les intégrations")];
    },
  };
  const PART_OF = { opportunities: "opportunities", technical: "page", performance: "psi", gsc: "gsc", external: "external" };
  async function loadPart(panelKey, force) {
    const el = box(panelKey);
    if (!el) return;
    if (!postId()) { el.replaceChildren(needsSave()); return; }
    const part = PART_OF[panelKey];
    if (!data.peek(part) || force) el.replaceChildren(help("Chargement…"));
    try {
      const d = await data.get(part, { force });
      el.replaceChildren(...RENDER[panelKey](d), refreshBtn(panelKey));
    } catch (e) { el.replaceChildren(errorBox(e), refreshBtn(panelKey, "Réessayer")); }
  }
  async function runPsi(btn, strategy) {
    const label = btn.textContent;
    btn.disabled = true;
    btn.textContent = "Mesure en cours (≈ 30 s)…";
    try { await api(`/formateur/blog/${postId()}/espace-seo/pagespeed`, { method: "POST", json: { strategy } }); data.emit("action", { type: "pagespeed" }); } catch (e) { btn.after(errorBox(e)); }
    btn.disabled = false;
    btn.textContent = label;
    loadPart("performance", true);
  }

  // ----- Images du texte en cours -----
  let imagesKey = "";
  async function images(r, force) {
    const el = box("images");
    if (!el || !r) return;
    const imgs = r.images || [];
    if (!imgs.length) { el.replaceChildren(help("Aucune image dans le texte.")); imagesKey = ""; return; }
    const key = imgs.map((i) => `${i.src}|${i.alt}`).join("\n");
    if (key === imagesKey && !force) return;
    imagesKey = key;
    let info = [];
    try { info = (await api("/formateur/blog/api/espace-seo/images", { method: "POST", json: { srcs: imgs.map((i) => i.src) } })).images; } catch (e) { el.replaceChildren(errorBox(e)); imagesKey = ""; return; }
    el.replaceChildren(h("ul", { class: "wsp-items" }, ...imgs.map((img, i) => {
      const p = info[i] || {};
      const name = img.src.split("/").pop() || img.src;
      const facts = p.external ? "Image externe (non vérifiée)" : p.exists === false ? "Fichier introuvable sur le site" : p.exists ? [p.width && p.height ? `${p.width} × ${p.height} px` : "Dimensions illisibles", p.bytes ? `${nf(p.bytes / 1024, 0)} Ko` : null, p.format].filter(Boolean).join(" · ") : "Données indisponibles";
      return h("li", { class: p.exists === false || !img.alt ? "is-bad" : null }, h("strong", {}, name), h("span", {}, facts), h("span", {}, img.alt ? `Texte alternatif : « ${img.alt} »` : "Texte alternatif manquant"));
    })));
  }

  // Rendu des panneaux visibles (appelé après chaque changement de disposition, d'onglet ou de données)
  function refreshVisible() {
    const r = data.analysis();
    if (isVisible("analysis")) content(r);
    if (isVisible("score")) factors(r);
    if (isVisible("keyword")) keywords(r);
    if (isVisible("images")) images(r);
    for (const k of Object.keys(PART_OF)) if (isVisible(k)) { const el = box(k); if (el && (!el.childElementCount || el.dataset.loadedFor !== String(postId()))) { el.dataset.loadedFor = String(postId()); loadPart(k); } }
  }
  data.on("analysis", (r) => { if (isVisible("analysis")) content(r); if (isVisible("score")) factors(r); if (isVisible("keyword")) keywords(r); if (isVisible("images")) images(r); });
  data.on("invalidate", () => { document.querySelectorAll("[data-wsp-part]").forEach((el) => { delete el.dataset.loadedFor; }); refreshVisible(); });
  return { refreshVisible, loadPart, content, factors, keywords, images };
}
