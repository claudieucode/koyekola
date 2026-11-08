// Bibliothèque « Page 404 » du Theme Builder : 100 modèles distincts par leur COMPOSITION (pas par la couleur seule), valides, responsives, sans lien factice ;
// aperçu = vignette, utilisation → publication → page introuvable réelle du site ; isolation entre sites ; remplacement sans contenu périmé.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");
const Catalog = require("../src/themeBuilder/catalog");

const walk = (n, f) => { f(n); (n.children || []).forEach((c) => walk(c, f)); };
const docOf = (key) => { const b = Catalog.build("not_found", key); return { type: "layout", children: b.sections[0].children }; };
// Arbre des types d'éléments seulement (la composition), sans valeurs ni identifiants
const tree = (n) => `${n.type}${n.children ? `(${n.children.map(tree).join(",")})` : ""}`;

describe("Page 404 : 100 modèles distincts, structurés et responsives (catalogue)", () => {
  const all = Catalog.entries("not_found");
  test("exactement 100 modèles, clés et noms uniques ; les anciens modèles ont disparu", () => {
    assert.equal(all.length, 100);
    assert.equal(new Set(all.map((e) => e.key)).size, 100);
    assert.equal(new Set(all.map((e) => e.name)).size, 100);
    for (const old of ["minimale.clair", "grand-404.clair", "deux-colonnes.clair", "bandeau.marque", "complet.nuit"]) assert.equal(Catalog.find("not_found", old), null, old);
  });
  test("distincts par la composition : les 5 traitements d'un même contenu ont 5 structures différentes, et aucun document n'est répété", () => {
    const byLayout = {};
    for (const e of all) (byLayout[e.layoutKey] ||= []).push(tree(docOf(e.key)));
    assert.equal(Object.keys(byLayout).length, 20);
    for (const [k, trees] of Object.entries(byLayout)) assert.equal(new Set(trees).size, 5, `${k} : 5 compositions`);
    const docs = all.map((e) => JSON.stringify(docOf(e.key), (key, v) => (key === "id" ? undefined : v)));
    assert.equal(new Set(docs).size, 100, "aucun document identique");
    assert.ok(new Set(all.map((e) => tree(docOf(e.key)))).size >= 60, "au moins 60 compositions différentes sur 100");
  });
  test("chaque modèle : un message 404 compréhensible, une action utile, aucun lien factice, aucune position absolue, responsive", () => {
    const OK_URL = /^\/(?:|blog|catalogue|contact|boutique|compte)$/;
    for (const e of all) {
      const doc = docOf(e.key); let h1 = 0, actions = 0, grids = 0, badGrid = 0, abs = 0, rows = 0, badRow = 0; const bad = [];
      walk(doc, (n) => {
        if (n.type === "heading" && n.props && n.props.level === "1") h1 += 1;
        if (n.type === "button" || n.type === "link") { actions += 1; if (!OK_URL.test(String(n.props.url))) bad.push(n.props.url); }
        if (n.type === "search" || n.type === "menu") actions += 1;
        if (n.type === "menu") { assert.equal(n.props.source, "manual", `${e.key} : menu à liens manuels (jamais vide)`); for (const it of n.props.items) if (!OK_URL.test(it.url)) bad.push(it.url); }
        const d = (n.styles && n.styles.desktop) || {};
        if (n.type === "grid" && !(n.props && n.props.loop)) { grids += 1; if (!(n.styles.tablet && n.styles.mobile)) badGrid += 1; }
        if (d.position === "absolute" || d.position === "fixed") abs += 1;
        if (d.display === "flex" && d.flexDirection === "row") { rows += 1; if (d.flexWrap !== "wrap") badRow += 1; }
      });
      assert.equal(h1, 1, `${e.key} : un seul titre principal`);
      assert.ok(actions >= 1, `${e.key} : au moins une action`);
      assert.deepEqual(bad, [], `${e.key} : liens réels`);
      assert.equal(badGrid, 0, `${e.key} : grilles adaptées tablette / mobile`);
      assert.equal(abs, 0, `${e.key} : pas de positionnement absolu`);
      assert.equal(badRow, 0, `${e.key} : lignes qui passent à la ligne sur petit écran`);
    }
  });
  test("les 5 identités visuelles sont toutes présentes, 20 modèles chacune", () => {
    const n = {}; for (const e of all) n[e.skinKey] = (n[e.skinKey] || 0) + 1;
    assert.deepEqual(Object.values(n), [20, 20, 20, 20, 20]);
  });
});

const hostReq = (srv, host, path) => {
  const u = new URL(srv.base);
  return new Promise((resolve, reject) => {
    const r = http.request({ host: u.hostname, port: u.port, path, method: "GET", headers: { Host: host, "User-Agent": "Mozilla/5.0 Chrome/120 Safari/537.36" } }, (resp) => {
      let text = ""; resp.on("data", (d) => (text += d)); resp.on("end", () => resolve({ status: resp.statusCode, text }));
    });
    r.on("error", reject); r.end();
  });
};

describe("Page 404 : bibliothèque → aperçu → site public (vrai serveur)", () => {
  let srv, boss, db, org, A, B;
  const ORIGIN = () => ({ Origin: srv.base });
  const U = (s, p = "") => `/marketing/site-web/sites/${s}/constructeur-de-theme${p}`;
  const post = (path, body) => boss.request(path, { method: "POST", json: body || {}, headers: ORIGIN() });
  const mkSite = (name, slug) => Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, ?, ?, '{}')").run(org, name, slug).lastInsertRowid);
  const setDomain = async (site, url) => { const cur = JSON.parse((await boss.get(`/marketing/site-web/sites/${site}/reglages.json`)).text); return boss.request(`/marketing/site-web/sites/${site}/reglages.json`, { method: "PUT", json: { settings: { ...cur.settings, seo: { ...cur.settings.seo, publicUrl: url } }, revision: cur.revision }, headers: ORIGIN() }); };
  const adopt = async (site, key, publish = true) => {
    const u = await post(U(site, "/api/bibliotheque/utiliser"), { type: "not_found", key }); assert.equal(u.status, 200, u.text.slice(0, 300));
    const t = JSON.parse(u.text).template;
    if (publish) { const p = await post(U(site, `/api/modeles/${t.id}/publier`), { replace: true }); assert.equal(p.status, 200, p.text.slice(0, 300)); }
    return t;
  };
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db(); org = db.prepare("SELECT id FROM mk_organizations").get().id;
    A = mkSite("Site A", "site-a"); B = mkSite("Site B", "site-b");
    const home = Number(db.prepare("INSERT INTO mk_landing_pages (organization_id, name, slug, title, status, site_id, published_at, kind, indexable) VALUES (?, 'Accueil A', 'accueil-a', 'Accueil A', 'published', ?, datetime('now'), 'page', 1)").run(org, A).lastInsertRowid);
    db.prepare("UPDATE mk_sites SET home_page_id = ? WHERE id = ?").run(home, A);
    assert.equal((await setDomain(A, "https://a.test")).status, 200); assert.equal((await setDomain(B, "https://b.test")).status, 200);
  });
  after(async () => { if (db) db.close(); if (srv) await srv.stop(); });

  test("les 100 modèles : l'aperçu et la vignette répondent, rendent le même modèle et son message 404", async () => {
    const all = Catalog.entries("not_found"); let n = 0;
    for (const e of all) {
      const base = U(A, `/api/bibliotheque/not_found/${e.key}`);
      const pv = await boss.get(`${base}/apercu`), th = await boss.get(`${base}/vignette`);
      assert.equal(pv.status, 200, e.key); assert.equal(th.status, 200, e.key);
      const core = (h) => h.replace(/data-sid="[^"]*"/g, "").replace(/<title>[^<]*<\/title>/, "").replace(/<style>[^<]*<\/style>/, "").replace(/ data-kw-demo="1"/, "").replace(/<script src="[^"]*landing\.js[^"]*" defer><\/script>/, "");
      assert.equal(core(pv.text), core(th.text), `${e.key} : aperçu = vignette`);
      assert.match(pv.text, /kw-theme-template/, e.key);
      const title = docOf(e.key).children; let t = ""; walk({ children: title }, (x) => { if (x.type === "heading" && x.props.level === "1") t = x.props.text; });
      assert.ok(pv.text.includes(t.replace(/'/g, "&#39;")) || pv.text.includes(t), `${e.key} : titre « ${t} »`);
      n += 1;
    }
    assert.equal(n, 100);
  });
  test("utilisé puis publié : la vraie page introuvable du site A l'affiche, pas celle du site B ; un autre modèle le remplace sans reste de l'ancien", async () => {
    await adopt(A, "humour.centre");
    const a1 = await hostReq(srv, "a.test", "/introuvable-xyz"); assert.equal(a1.status, 404);
    assert.match(a1.text, /Oups, on a perdu cette page/);
    const b = await hostReq(srv, "b.test", "/introuvable-xyz"); assert.doesNotMatch(b.text, /Oups, on a perdu cette page/, "isolation entre sites");
    await adopt(A, "corporate.scinde");
    const a2 = await hostReq(srv, "a.test", "/introuvable-xyz"); assert.equal(a2.status, 404);
    assert.match(a2.text, /La page demandée n&#39;existe pas|La page demandée n'existe pas/);
    assert.doesNotMatch(a2.text, /Oups, on a perdu cette page/, "aucun contenu de l'ancien modèle");
  });
  test("recherche et liens des modèles : le champ de recherche est présent et les boutons pointent vers des pages réelles", async () => {
    await adopt(A, "recherche.carte");
    const r = await hostReq(srv, "a.test", "/introuvable-xyz"); assert.equal(r.status, 404);
    assert.match(r.text, /type="search"|class="[^"]*kw-search/, "champ de recherche");
    assert.match(r.text, /href="\/"/, "retour à l'accueil");
  });
});
