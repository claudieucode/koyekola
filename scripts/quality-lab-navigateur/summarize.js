// Programme 22.1 — Résume docs/quality-lab-navigateur/{generation,audit,scores}.json en tableaux Markdown (collés dans les rapports). Aucune interprétation : seulement des comptages.
//   node scripts/quality-lab-navigateur/summarize.js [--out dossier]
const fs = require("node:fs");
const path = require("node:path");
const arg = (k, d) => { const i = process.argv.indexOf("--" + k); return i > 0 ? process.argv[i + 1] : d; };
const OUT = path.resolve(arg("out", path.join(__dirname, "..", "..", "docs", "quality-lab-navigateur")));
const read = (f) => JSON.parse(fs.readFileSync(path.join(OUT, f), "utf8"));
const gen = read("generation.json"), audit = read("audit.json"), scores = read("scores.json");
const A = Object.fromEntries(audit.map((x) => [x.id, x.audit])); const G = Object.fromEntries(gen.map((x) => [x.id, x.gen]));
const med = (a) => { const s = a.filter((x) => Number.isFinite(x)).sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : null; };
const sum = (a) => a.reduce((x, y) => x + y, 0);
const row = (...c) => `| ${c.join(" | ")} |`;
const out = [];

out.push("### Notes par scénario", row("Scénario", "Note /100 (sur points évalués)", "Couverture", "Statut", "Critique"), row("---", "---:", "---:", "---", "---"));
for (const s of scores) out.push(row(s.id, s.score.total ?? "—", s.score.coverage || "—", s.score.status, (s.score.critical || []).join(", ") || "—"));
out.push("", "### Détail des critères (obtenu / max ; — = non évalué)", row("Scénario", ...Object.keys((scores.find((s) => s.score.criteria) || { score: { criteria: {} } }).score.criteria)), row("---", ...Object.keys((scores.find((s) => s.score.criteria) || { score: { criteria: {} } }).score.criteria).map(() => "---:")));
for (const s of scores) if (s.score.criteria) out.push(row(s.id, ...Object.values(s.score.criteria).map((c) => (c.got === null ? "—" : `${c.got}/${c.max}`))));

out.push("", "### Génération (vrais moteurs, IA simulée)", row("Scénario", "Pages", "Publiées", "Conflit inter-sites", "Pages bloquées", "Médias (besoins/bandeaux)", "Durées ms (pages/design/médias/publication)"), row("---", "---:", "---:", "---", "---", "---", "---"));
for (const g of gen) { const o = g.gen; if (o.error) { out.push(row(g.id, "—", "—", "—", `ÉCHEC : ${o.error.slice(0, 70)}`, "—", "—")); continue; } const pubs = (o.pages || []).filter((p) => p.status === "published").length; const t = o.timings || {};
  out.push(row(g.id, (o.pages || []).length, pubs, o.crossSiteConflict ? "oui" : "non", ((o.pages || []).filter((p) => p.status !== "published").map((p) => p.name).join(", ")) || "—", o.media ? `${o.media.needs}/${o.media.heroes}` : "—", [t.pages, t.design, t.media, t.publish].map((x) => (x == null ? "—" : Math.round(x))).join(" / "))); }

out.push("", "### Sections du plan conservées par le générateur de pages", row("Scénario", "sections prévues", "sections générées", "perdues", "exemple (page : prévu → généré)"), row("---", "---:", "---:", "---:", "---"));
for (const g of gen) { const o = g.gen; if (!o.sectionLoss) continue; const planned = sum(o.sectionLoss.map((x) => x.planned.length)); const made = sum(o.sectionLoss.map((x) => x.generated.length)); const ex = o.sectionLoss.find((x) => x.generated.length < x.planned.length);
  out.push(row(g.id, planned, made, Math.max(0, planned - made), ex ? `${ex.page} : ${ex.planned.join("+")} → ${ex.generated.join("+") || "∅"}` : "—")); }

out.push("", "### Navigateur — structure, SEO, accessibilité (page d'accueil, bureau)", row("Scénario", "nav", "header", "footer", "H1", "titre", "meta description", "canonical", "og", "JSON-LD", "lang", "sitemap", "robots", "alt manquants", "champs sans label", "contraste KO/vérifiés"), row(...Array(16).fill("---")));
for (const id of Object.keys(A)) { const a = A[id]; if (!a || a.error) continue; const h = a.pages.find((p) => p.vp === "desktop" && p.path === "/" && p.static); if (!h) continue; const s = h.static;
  out.push(row(id, s.landmarks.nav, s.landmarks.header, s.landmarks.footer, s.h1, s.title ? "oui" : "non", s.metaDescription ? "oui" : "non", s.canonical ? "oui" : "non", s.og.length, s.jsonLd, s.lang || "—", a.site["/sitemap.xml"], a.site["/robots.txt"], s.imgsNoAlt, s.unlabeled, `${s.contrast.fail.length}/${s.contrast.checked}`)); }

out.push("", "### Responsive (pages publiées mesurées par format)", row("Scénario", "pages", "débordement desktop", "laptop", "tablette", "mobile", "cibles < 32 px (mobile)", "texte coupé", "texte < 12 px", "images cassées"), row(...Array(10).fill("---")));
for (const id of Object.keys(A)) { const a = A[id]; if (!a || a.error) continue; const by = (vp) => a.pages.filter((p) => p.vp === vp && p.metrics); const bad = (vp) => by(vp).filter((p) => p.metrics.hscroll || p.metrics.wide.length).length;
  out.push(row(id, by("desktop").length, bad("desktop"), bad("laptop"), bad("tablette"), bad("mobile"), sum(by("mobile").map((p) => p.metrics.small.length)), sum(a.pages.filter((p) => p.metrics).map((p) => p.metrics.clipped.length)), sum(a.pages.filter((p) => p.metrics).map((p) => p.metrics.tinyText.length)), sum(a.pages.filter((p) => p.metrics).map((p) => p.metrics.brokenImages.length)))); }

out.push("", "### Contenu livré (textes d'exemple restants, bureau)", row("Scénario", "pages avec crochets", "textes entre crochets", "exemples", "liens internes", "liens cassés", "erreurs console/réseau"), row(...Array(7).fill("---")));
for (const id of Object.keys(A)) { const a = A[id]; if (!a || a.error) continue; const d = a.pages.filter((p) => p.vp === "desktop" && p.metrics); const ph = d.filter((p) => p.metrics.placeholders.length);
  out.push(row(id, `${ph.length}/${d.length}`, sum(d.map((p) => p.metrics.placeholders.length)), [...new Set(d.flatMap((p) => p.metrics.placeholders))].slice(0, 3).join(" ; ") || "—", a.links ? a.links.total : "—", a.links ? a.links.broken.length : "—", sum(a.pages.map((p) => p.console.length + p.failed.length)))); }

out.push("", "### Performance mesurée (bureau, serveur local, réseau non limité)", row("Scénario", "chargement médian ms", "chargement max ms", "FCP médian ms", "transfert max Ko", "requêtes max", "décodé max Ko", "mémoire JS Mo (max)"), row(...Array(8).fill("---")));
for (const id of Object.keys(A)) { const a = A[id]; if (!a || a.error) continue; const d = a.pages.filter((p) => p.vp === "desktop" && p.perf);
  out.push(row(id, med(d.map((p) => p.loadMs)), Math.max(0, ...d.map((p) => p.loadMs || 0)), med(d.map((p) => p.perf.fcp)), Math.max(0, ...d.map((p) => p.perf.transferKB)), Math.max(0, ...d.map((p) => p.perf.resources)), Math.max(0, ...d.map((p) => p.perf.decodedKB)), Math.max(0, ...d.map((p) => p.perf.heapMB || 0)))); }

out.push("", "### Diversité des résultats rendus (page d'accueil, bureau)", row("Scénario", "blocs de l'accueil (ordre)", "mots", "H1", "bouton(s)", "image(s)"), row("---", "---", "---:", "---", "---:", "---:"));
const sigs = [];
for (const id of Object.keys(A)) { const a = A[id]; if (!a || a.error) continue; const h = a.pages.find((p) => p.vp === "desktop" && p.path === "/" && p.static); if (!h) continue; const s = h.static; const sig = (s.mainKinds || []).join(" > "); sigs.push(sig);
  out.push(row(id, sig || "—", s.wordCount, s.h1Text || "—", s.buttonLike, s.imgsInMain)); }
out.push("", `Signatures distinctes : ${new Set(sigs).size} sur ${sigs.length} sites (accueil).`);
out.push("", "### Cibles tactiles < 32 px sur mobile (exemples, accueil)", row("Scénario", "éléments"), row("---", "---"));
for (const id of Object.keys(A)) { const a = A[id]; if (!a || a.error) continue; const h = a.pages.find((p) => p.vp === "mobile" && p.path === "/" && p.metrics); if (h) out.push(row(id, [...new Set(h.metrics.small)].slice(0, 4).join(" ; ") || "—")); }

const shops = Object.keys(A).filter((id) => A[id] && A[id].journeys);
if (shops.length) { out.push("", "### Parcours d'achat simulé (paiement manuel, aucune transaction réelle)", row("Boutique", "1280 px", "820 px", "375 px"), row("---", "---", "---", "---")); for (const id of shops) out.push(row(id, ...A[id].journeys.map((j) => (j.failedAt ? `ÉCHEC : ${j.failedAt.slice(0, 50)}` : `ok (${Object.values(j.steps).reduce((a, s) => a + (s.ms || 0), 0)} ms)`)))); }
console.log(out.join("\n"));
