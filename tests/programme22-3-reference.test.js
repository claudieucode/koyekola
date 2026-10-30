// Programme 22.3 — comparaison avec les 15 scénarios de RÉFÉRENCE du programme 22.1 (tests/quality-lab/scenarios.js). Le laboratoire 22.1 mesurait : accueils distincts 1/15, similarité moyenne 1,00 ;
// objectif de suivi : ≥ 8/15 et < 0,6. Ici, le moteur 22.3 compose l'accueil de chaque brief (direction = texte du brief de design, secteur, pays) avec des CONTENUS FICTIFS identiques par nature
// (les scénarios visuels reçoivent des images, les autres non). Aucun serveur, aucun coût. Ce test mesure la diversité de composition, pas la qualité rédactionnelle ni le rendu final.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { SCENARIOS } = require("./quality-lab/scenarios");
const L = require("../src/layoutGen");

const VISUAL = new Set(["photographie", "portfolio", "immobilier", "restaurant", "mode", "boutique", "construction", "informatique"]);
const im = (n) => ({ src: `https://exemple.test/${n}.jpg`, alt: `Image ${n}` });
const items = (n) => Array.from({ length: n }, (_, i) => ({ title: `Élément ${i + 1}`, text: `Description ${i + 1}.` }));
const home = (s) => {
  const vis = VISUAL.has(s.id), shop = s.design.category === "boutique" || s.id === "mode";
  const secs = [{ kind: "hero", title: s.label, text: s.brief.slice(0, 160), cta: { label: "Nous contacter", url: "/contact" } }, { kind: "services", title: "Notre offre", items: items(4) }];
  if (vis) { secs[0].image = im(1); secs.push({ kind: "gallery", title: "En images", images: [1, 2, 3, 4, 5, 6].map(im) }); }
  if (shop) secs.push({ kind: "products", title: "Sélection", items: [1, 2, 3, 4].map((n) => ({ title: `Article ${n}`, text: "Description.", price: `${n * 10} €`, image: im(n) })) });
  secs.push({ kind: "testimonials", title: "Avis", items: [{ text: "Très bon travail.", author: "Client A" }, { text: "Équipe sérieuse.", author: "Client B" }] }, { kind: "cta", title: "Parlons de votre projet", cta: { label: "Écrire", url: "/contact" } });
  return { key: s.id, name: "Accueil", type: "accueil", sections: secs };
};
const jaccard = (a, b) => { const A = new Set(a), B = new Set(b); const i = [...A].filter((x) => B.has(x)).length; return i / (A.size + B.size - i); };

test("22.1 → 22.3 : accueils distincts et similarité moyenne sur les 15 scénarios de référence", () => {
  const ctx = { db: null, organizationId: 0 };
  const res = SCENARIOS.map((s) => {
    const site = { name: s.label, description: `${s.design.sector} ${s.brief}`, direction: s.design.text };
    const r = L.composePage(ctx, home(s), site);
    return { id: s.id, report: r.report, sigs: r.sections.map((x) => L.signature(x)), ids: r.report.filter((x) => x.patternId).map((x) => x.patternId), score: r.report.filter((x) => x.score != null).map((x) => x.score) };
  });
  const whole = res.map((r) => r.sigs.join("|"));
  const distinct = new Set(whole).size;
  let sum = 0, n = 0; for (let i = 0; i < res.length; i++) for (let j = i + 1; j < res.length; j++) { sum += jaccard(res[i].ids, res[j].ids); n++; }
  const sim = sum / n, minScore = Math.min(...res.flatMap((r) => r.score));
  console.log(`   accueils distincts : ${distinct}/15 (22.1 : 1/15) · similarité moyenne des layouts : ${sim.toFixed(2)} (22.1 : 1,00) · score d'équilibre minimal : ${minScore}`);
  assert.ok(distinct >= 8, `distincts ${distinct}`);
  assert.ok(sim < 0.6, `similarité ${sim}`);
  assert.ok(minScore >= 70);
  for (const r of res) assert.ok(r.report.every((x) => x.status === "ok"), `${r.id} : ${JSON.stringify(r.report.filter((x) => x.status !== "ok"))}`);
});
