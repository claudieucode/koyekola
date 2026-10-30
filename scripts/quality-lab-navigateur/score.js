// Programme 22.1 — Grille de notation commune (100 points) appliquée aux MESURES du laboratoire.
// Règle d'honnêteté : un critère n'est noté que sur ce qui a réellement été mesuré. Les points d'un critère qui exige un jugement humain ou un modèle de langage réel (compréhension du brief,
// qualité rédactionnelle, direction artistique) ne sont PAS inventés : ils sont marqués « non évalué » et exclus du dénominateur. La note affichée est donc « points obtenus / points évalués »
// ramenée sur 100, accompagnée de la couverture (points évalués / 100). Une défaillance critique plafonne le statut, quelle que soit la note.
//
// Le détail de chaque barème est documenté dans docs/KOLAKISA_PROGRAMME22_1B_QUALITY_SCORE.md.
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const avg = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
const STATUS = (n) => (n >= 90 ? "EXCELLENT" : n >= 80 ? "TRÈS BON" : n >= 70 ? "SATISFAISANT" : n >= 50 ? "À AMÉLIORER" : "INSUFFISANT");

function scoreSite(r) {
  const gen = r.gen; const audit = r.audit || null; const notes = []; const critical = [];
  const crit = {};
  const set = (key, max, got, why) => { crit[key] = { max, got: got === null ? null : Math.round(got * 10) / 10, why }; };
  const pubPages = gen.pages ? gen.pages.filter((p) => p.status === "published") : [];
  const allPages = gen.pages || [];

  // 1. Compréhension du brief (10) — jugement du modèle : non évalué avec l'IA simulée. Seul le garde-fou déterministe est mesurable (voir tests unitaires).
  set("brief", 10, null, "Non évalué : l'analyse vient d'un fournisseur simulé (plan de référence). Les garde-fous déterministes sont testés à part (tests/programme22-1b-lab-navigateur.test.js).");
  // 2. Architecture (10) — cohérence mesurable : pages publiées, pages bloquées, navigation, doublons.
  if (gen.shop) {
    const skipped = (gen.pagesApplied && gen.pagesApplied.created === 0) ? 1 : 0;
    set("architecture", 10, 10 - 4 * skipped - 2 * (allPages.length - pubPages.length > 0 ? 1 : 0), `${allPages.length} pages, ${pubPages.length} publiées${skipped ? ", pages éditoriales NON créées (conflit de noms entre sites)" : ""}.`);
  } else {
    const unpub = allPages.length - pubPages.length; const conflict = gen.crossSiteConflict ? 1 : 0;
    set("architecture", 10, clamp(10 - 3 * unpub - conflict, 0, 10), `${pubPages.length}/${allPages.length} pages publiables sans intervention${unpub ? " (page(s) bloquée(s) : formulaire à choisir)" : ""}${conflict ? " ; conflit de noms avec un autre site" : ""}.`);
  }
  if (!audit || audit.error) return finish(crit, notes, critical, "Audit navigateur absent : critères visuels et techniques non évalués.");
  const desk = audit.pages.filter((p) => p.vp === "desktop" && p.metrics); const all = audit.pages.filter((p) => p.metrics);
  const withStatic = audit.pages.filter((p) => p.static);
  // Qualité visuelle (20) = 6 points de lisibilité MESURÉE (contraste AA calculé, images, taille de texte) + 14 points de STRUCTURE VISIBLE (7 contrôles de 2 points sur la page d'accueil).
  // La part « goût » (originalité, harmonie) n'est pas chiffrée : elle est jugée par inspection des captures dans KOLAKISA_PROGRAMME22_1B_VISUAL_AUDIT.md.
  const contrastFail = withStatic.reduce((a, p) => a + p.static.contrast.fail.length, 0); const contrastChecked = withStatic.reduce((a, p) => a + p.static.contrast.checked, 0);
  const brokenImgs = all.reduce((a, p) => a + p.metrics.brokenImages.length, 0);
  const legible = 3 * clamp(1 - contrastFail / Math.max(contrastChecked, 1) * 5, 0, 1) + 1.5 * (brokenImgs ? 0 : 1) + 1.5 * (all.every((p) => p.metrics.tinyText.length === 0) ? 1 : 0.5);
  const home = audit.pages.find((p) => p.vp === "desktop" && p.path === "/" && p.static); const hs = home ? home.static : null; const homeName = home ? home.name : "";
  const homeM = home ? home.metrics : null; const nPub = pubPages.length;
  const checks = hs ? [
    ["navigation entre les pages", hs.headerLinks >= Math.min(2, nPub), `${hs.headerLinks} lien(s) dans l'en-tête/menu`],
    ["titre du bandeau différent du nom de la page", hs.h1Text && hs.h1Text.trim().toLowerCase() !== homeName.trim().toLowerCase(), `H1 = « ${hs.h1Text} », page = « ${homeName} »`],
    ["bouton d'action sur l'accueil", hs.buttonLike >= 1, `${hs.buttonLike} bouton(s)`],
    ["rythme : au moins 3 types de blocs distincts", new Set(hs.mainKinds).size >= 3, `${new Set(hs.mainKinds).size} type(s) de blocs`],
    ["image sur l'accueil", hs.imgsInMain >= 1, `${hs.imgsInMain} image(s)`],
    ["accueil sans texte d'exemple", homeM && homeM.placeholders.length === 0, `${homeM ? homeM.placeholders.length : "?"} texte(s) entre crochets`],
    ["pied de page utile (≥ 3 liens)", hs.footerLinks >= 3, `${hs.footerLinks} lien(s)`],
  ] : [];
  const structure = checks.reduce((a, c) => a + (c[1] ? 2 : 0), 0);
  set("visuel", 20, legible + structure, `Lisibilité mesurée ${Math.round(legible * 10) / 10}/6 (contraste ${contrastChecked - contrastFail}/${contrastChecked} éléments mesurés conformes AA ; ${brokenImgs} image(s) cassée(s)). Structure visible ${structure}/14 : ${checks.map((c) => `${c[1] ? "✔" : "✘"} ${c[0]} (${c[2]})`).join(" ; ")}.`);
  if (hs && !checks[0][1] && nPub >= 2) critical.push(`aucune navigation : ${nPub} pages publiées sans lien entre elles`);
  // Sections (10) : textes d'exemple restants, sections vides.
  const ph = desk.reduce((a, p) => a + p.metrics.placeholders.length, 0); const phPages = desk.filter((p) => p.metrics.placeholders.length).length;
  set("sections", 10, clamp(10 - phPages * 1.5 - ph * 0.15, 0, 10), `${ph} texte(s) d'exemple entre crochets sur ${phPages}/${desk.length} page(s) publiée(s) (étape « contenus » non exécutée : pas de modèle).`);
  // Contenus (10) : non évalué (rédaction par modèle). Mesure partielle : placeholders (déjà comptés) et répétitions → informatif seulement.
  set("contenus", 10, null, "Non évalué : la rédaction exige le fournisseur d'IA réel. Les textes livrés sont des textes d'exemple (voir sections).");
  // Médias (10) : images présentes, alt, existence.
  const imgs = withStatic.reduce((a, p) => a + p.static.imgs, 0); const noAlt = withStatic.reduce((a, p) => a + p.static.imgsNoAlt, 0);
  const heroPages = withStatic.length;
  set("medias", 10, clamp((imgs > 0 ? 4 : 0) + (noAlt === 0 ? 3 : 0) + (brokenImgs === 0 ? 3 : 0), 0, 10), `${imgs} image(s) visibles sur ${heroPages} page(s) ; ${noAlt} sans attribut alt ; ${brokenImgs} cassée(s). Pertinence : visuels d'attente génériques (fournisseur « demo »), non notée.`);
  // Responsive (10)
  const bad = (vp) => audit.pages.filter((p) => p.vp === vp && p.metrics && (p.metrics.hscroll || p.metrics.wide.length)).length;
  const smallMobile = audit.pages.filter((p) => p.vp === "mobile" && p.metrics).reduce((a, p) => a + p.metrics.small.length, 0);
  const respo = 10 - 2.5 * (bad("desktop") + bad("laptop") + bad("tablette") + bad("mobile")) - clamp(smallMobile * 0.3, 0, 3) - all.filter((p) => p.metrics.clipped.length).length * 0.3;
  set("responsive", 10, clamp(respo, 0, 10), `Débordements : desktop ${bad("desktop")}, laptop ${bad("laptop")}, tablette ${bad("tablette")}, mobile ${bad("mobile")} page(s) ; ${smallMobile} contrôle(s) < 32 px sur mobile.`);
  // UX (10) : parcours, pages bloquées, liens cassés, console, boutique
  const brokenLinks = (audit.links && audit.links.broken.length) || 0; const errs = audit.pages.reduce((a, p) => a + p.console.length + p.failed.length, 0);
  let ux = 10 - 2 * Math.min(2, (audit.unpublished || []).length) - brokenLinks * 0.7 - clamp(errs * 0.3, 0, 3) - (hs && !checks[0][1] ? 3 : 0) - (hs && !checks[2][1] ? 1.5 : 0);
  if (gen.shop) { const j = (audit.journeys || []); const okJ = j.filter((x) => !x.failedAt).length; ux = (j.length ? 4 * (okJ / j.length) : 0) + clamp(6 - brokenLinks * 0.7 - (audit.unpublished || []).length * 2 - (hs && !checks[0][1] ? 3 : 0) - (hs && !checks[2][1] ? 1.5 : 0) - clamp(errs * 0.3, 0, 3), 0, 6); if (j.some((x) => x.failedAt)) critical.push("parcours d'achat défectueux"); }
  set("ux", 10, clamp(ux, 0, 10), `${(audit.unpublished || []).length} page(s) non publiée(s), ${brokenLinks} lien(s) interne(s) cassé(s) sur ${audit.links ? audit.links.total : 0}, ${errs} erreur(s) console/réseau.${gen.shop ? " Parcours d'achat simulé : " + JSON.stringify((audit.journeys || []).map((x) => x.failedAt || "ok")) : ""}`);
  // SEO & accessibilité (5)
  const s0 = withStatic; const seoBad = s0.filter((p) => !p.static.title || !p.static.metaDescription || p.static.h1 !== 1 || !p.static.lang).length;
  const a11yBad = s0.reduce((a, p) => a + p.static.unlabeled + p.static.emptyButtons + p.static.imgsNoAlt, 0);
  set("seo", 5, clamp(5 - 2.5 * (seoBad / Math.max(s0.length, 1)) - clamp(a11yBad * 0.5, 0, 1.5) - (audit.site["/sitemap.xml"] === 200 ? 0 : 0.5), 0, 5), `${seoBad}/${s0.length} page(s) sans titre, description, H1 unique ou langue ; ${a11yBad} problème(s) d'étiquette/alt ; sitemap ${audit.site["/sitemap.xml"]}.`);
  // Performance (5)
  const loads = desk.map((p) => p.perf).filter(Boolean); const heavy = loads.filter((p) => p.transferKB > 500 || p.resources > 60).length; const slow = desk.filter((p) => p.loadMs > 3000).length;
  set("perf", 5, clamp(5 - heavy - slow, 0, 5), `Mesuré localement (réseau non limité, machine chargée) : médiane de chargement ${median(desk.map((p) => p.loadMs))} ms, transfert max ${Math.max(0, ...loads.map((p) => p.transferKB))} Ko, requêtes max ${Math.max(0, ...loads.map((p) => p.resources))}. Chiffres comparables entre exécutions, pas des temps de production.`);
  if (brokenImgs) critical.push("images cassées");
  if (phPages) critical.push(`textes d'exemple publiés sur ${phPages} page(s)`);
  if ((audit.unpublished || []).length) critical.push(`page(s) de conversion non publiable(s) : ${(audit.unpublished || []).join(", ")}`);
  if (bad("mobile")) critical.push("défilement horizontal sur mobile");
  return finish(crit, notes, critical);
}
const median = (a) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : 0; };

function finish(crit, notes, critical, note) {
  let got = 0, max = 0, evaluated = 0;
  for (const c of Object.values(crit)) { if (c.got !== null) { got += c.got; max += c.max; evaluated += c.max; } }
  const total = max ? Math.round((got / max) * 100) : null;
  let status = total === null ? "NON ÉVALUÉ" : STATUS(total);
  if (critical.length && total !== null && total >= 70) status = "À AMÉLIORER (plafonné : défaillance critique)";
  return { criteria: crit, pointsObtained: Math.round(got * 10) / 10, evaluatedPoints: evaluated, coverage: `${evaluated}/100`, total, status, critical, note: note || null };
}

module.exports = { scoreSite, STATUS };
