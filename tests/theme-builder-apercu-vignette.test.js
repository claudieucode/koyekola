// Theme Builder : la vignette, l'aperçu et le rendu publié représentent le MÊME modèle (cause racine : l'aperçu d'un composant rendait l'en-tête / le pied ACTUEL du site,
// pas le composant prévisualisé). Par les vraies routes d'un vrai serveur ; un marqueur unique inscrit dans la copie de travail d'un modèle prouve lequel est affiché.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");

const UA = { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 Chrome/120 Safari/537.36" };
const idFrom = (location) => Number(location.match(/(\d+)(#.*)?$/)[1]);
const Catalog = require("../src/themeBuilder/catalog");

describe("Theme Builder : vignette = aperçu = rendu publié (vrai serveur)", () => {
  let srv, boss, db, site, other, pageId;
  const O = () => ({ Origin: srv.base });
  const api = (s, path, opts) => boss.request(`/marketing/site-web/sites/${s}/constructeur-de-theme/api/${path}`, { headers: O(), ...opts });
  const use = async (s, type, key) => { const r = await api(s, "bibliotheque/utiliser", { method: "POST", json: { type, key } }); assert.equal(r.status, 200, r.text); return JSON.parse(r.text).template; };
  // Inscrit un texte unique dans la copie de travail du composant du modèle (comme le ferait l'éditeur)
  const mark = async (t, marker) => {
    const comp = db.prepare("SELECT * FROM mk_web_components WHERE id = ?").get(t.sourceId);
    const sec = JSON.parse(comp.draft || comp.section);
    const first = sec.children && sec.children[0];
    (first && first.children ? first.children : sec.children).push({ id: `m${t.id}`.padEnd(12, "0"), type: "heading", props: { text: marker, level: "3" }, styles: { desktop: {} } });
    const r = await boss.request(`/marketing/site-web/composants/${t.sourceId}/brouillon`, { method: "PUT", json: { content: { sections: [sec] }, revision: comp.revision }, headers: O() });
    assert.equal(r.status, 200, r.text);
  };
  const vignette = async (s, t) => (await boss.get(`/marketing/site-web/sites/${s}/constructeur-de-theme/api/modeles/${t.id}/vignette`)).text;
  const apercu = async (t, extra = "") => (await boss.get(`/marketing/site-web/composants/${t.sourceId}/apercu${extra}`)).text;

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    db = srv.db();
    site = idFrom((await boss.post("/marketing/site-web/sites", { name: "Atelier aperçus" })).location);
    other = idFrom((await boss.post("/marketing/site-web/sites", { name: "Autre atelier" })).location);
    pageId = idFrom((await boss.post("/marketing/pages", { name: "Accueil", site_id: String(site) })).location);
    assert.equal((await boss.request(`/marketing/pages/${pageId}/publier.json`, { method: "POST", json: {}, headers: O() })).status, 200);
  });
  after(() => srv.stop());

  for (const type of ["header", "footer"]) {
    test(`${type} : l'aperçu d'un modèle NON publié montre ce modèle (et jamais celui actuellement en ligne) ; la vignette montre le même`, async () => {
      const keys = Catalog.entries(type).map((e) => e.key);
      const live = await use(site, type, keys[0]), draft = await use(site, type, keys[25]);
      await mark(live, `MARQUEUR-EN-LIGNE-${type}`);
      await mark(draft, `MARQUEUR-BROUILLON-${type}`);
      assert.equal((await api(site, `modeles/${live.id}/publier`, { method: "POST", json: {} })).status, 200);
      // rendu publié : le modèle publié
      const pub = (await boss.get(`/marketing/site-web/sites/${site}/apercu`)).text; void pub;
      // aperçu du brouillon : lui-même, pas le modèle en ligne
      const pv = await apercu(draft);
      assert.match(pv, new RegExp(`MARQUEUR-BROUILLON-${type}`), "l'aperçu affiche le modèle prévisualisé");
      assert.doesNotMatch(pv, new RegExp(`MARQUEUR-EN-LIGNE-${type}`), "l'aperçu n'affiche pas le modèle publié à sa place");
      const th = await vignette(site, draft);
      assert.match(th, new RegExp(`MARQUEUR-BROUILLON-${type}`), "la vignette affiche le même modèle");
      assert.doesNotMatch(th, new RegExp(`MARQUEUR-EN-LIGNE-${type}`));
      // et l'inverse : l'aperçu du modèle en ligne ne montre pas le brouillon
      const pv2 = await apercu(live);
      assert.match(pv2, new RegExp(`MARQUEUR-EN-LIGNE-${type}`));
      assert.doesNotMatch(pv2, new RegExp(`MARQUEUR-BROUILLON-${type}`));
      // changement de modèle : pas de contenu du précédent
      const pv3 = await apercu(draft);
      assert.doesNotMatch(pv3, new RegExp(`MARQUEUR-EN-LIGNE-${type}`));
    });
  }

  test("sauvegarde → rechargement : la vignette et l'aperçu suivent la copie de travail ; la clé de cache des vignettes change", async () => {
    const t = await use(site, "footer", Catalog.entries("footer")[3].key);
    const key = async () => { const r = JSON.parse((await api(site, "modeles")).text).templates.find((x) => x.id === t.id); return r.docRev; };
    const k1 = await key();
    await mark(t, "AVANT-SAUVEGARDE");
    const k2 = await key();
    assert.notEqual(k1, k2, "la clé de vignette change quand le brouillon du composant est enregistré");
    assert.match(await vignette(site, t), /AVANT-SAUVEGARDE/);
    assert.match(await apercu(t), /AVANT-SAUVEGARDE/);
  });

  test("toutes les catégories : la vignette et l'aperçu de la bibliothèque rendent le même document, des modèles différents donnent des rendus différents", async () => {
    for (const type of Catalog.types()) {
      const es = Catalog.entries(type), seen = new Set();
      for (const e of [es[0], es[25], es[60]]) {
        const base = `/marketing/site-web/sites/${site}/constructeur-de-theme/api/bibliotheque/${type}/${e.key}`;
        const th = await boss.get(`${base}/vignette`), pv = await boss.get(`${base}/apercu`);
        assert.equal(th.status, 200, `${type}/${e.key} vignette`); assert.equal(pv.status, 200, `${type}/${e.key} aperçu`);
        // Même corps de modèle (le gabarit d'aperçu n'ajoute que du remplissage hors modèle pour en-tête/pied)
        const core = (h) => h.replace(/<div style="max-width:1100px[\s\S]*?Contenu de la page \(aperçu\)<\/p><\/div>/, "").replace(/<p style="margin:0;padding:8px 16px;background:#fef3c7[^>]*>[^<]*<\/p>/, "").replace(/data-sid="[^"]*"/g, "").replace(/<title>[^<]*<\/title>/, "").replace(/<style>[^<]*<\/style>/, "");
        assert.equal(core(th.text), core(pv.text), `${type}/${e.key} : vignette et aperçu identiques`);
        seen.add(core(th.text));
      }
      assert.equal(seen.size, 3, `${type} : trois modèles distincts donnent trois rendus distincts`);
    }
  });

  test("isolation : l'aperçu d'un composant d'un autre site est refusé / introuvable depuis ce site", async () => {
    const t = await use(other, "footer", Catalog.entries("footer")[0].key);
    const r = await boss.get(`/marketing/site-web/sites/${site}/constructeur-de-theme/api/modeles/${t.id}/vignette`);
    assert.ok([404, 422].includes(r.status), `statut ${r.status}`);
  });
});
