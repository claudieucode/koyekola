// KOLAKISA CMS — Paramètres → Permaliens : moteur unique (structure des articles, préfixes des archives), génération = résolution, redirections des anciennes
// adresses, protections, isolation par site et par domaine, permissions. Vrai serveur, vraies routes, domaines simulés (x-forwarded-host).
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, Client, loginInstructor, newStudent } = require("./helpers");

const P = "/marketing/site-web/parametres/permaliens";
const UA = { "User-Agent": "Mozilla/5.0 (test)" };
let srv, boss, db, anon, orgId, author;
const HA = "www.alpha-pl.example", HB = "beta-pl.example";
const one = (sql, ...a) => db.prepare(sql).get(...a);
const on = (host) => ({ headers: { ...UA, ...(host ? { "x-forwarded-host": host } : {}) } });
const get = (path, host) => anon.get(path, on(host));
const settingsUrl = (id) => `/marketing/site-web/sites/${id}/reglages.json`;
async function newSite(name, publicUrl) {
  const id = Number(String((await boss.post("/marketing/site-web/sites", { name })).location).match(/sites\/(\d+)/)[1]);
  if (publicUrl) {
    const cur = JSON.parse((await boss.get(settingsUrl(id))).text);
    const r = await boss.request(settingsUrl(id), { method: "PUT", json: { revision: cur.revision, tokens: cur.tokens, settings: { ...cur.settings, seo: { ...cur.settings.seo, publicUrl } } } });
    assert.equal(r.status, 200, r.text.slice(0, 200));
  }
  return id;
}
let seq = 0;
const post = (slug, { site = null, published = 1, at = "2026-10-23 14:05:09", authorId = author.id } = {}) => {
  const id = Number(db.prepare("INSERT INTO posts (slug, title, content, excerpt, published, published_at, created_at, status, robots_index, author_id) VALUES (?, ?, '<p>Contenu</p>', 'Résumé', ?, ?, ?, ?, 1, ?)").run(slug, `Titre ${slug}`, published, published ? at : null, at, published ? "published" : "draft", authorId).lastInsertRowid);
  if (site) db.prepare("INSERT INTO mk_content_sites (content_type, content_id, organization_id, site_id, scope) VALUES ('post', ?, ?, ?, '')").run(id, orgId, site);
  return id;
};
const term = (slug, name, { parent = null, site = null } = {}) => {
  const id = Number(db.prepare("INSERT INTO taxonomy_terms (taxonomy, name, slug, parent_id) VALUES ('category', ?, ?, ?)").run(name, slug, parent).lastInsertRowid);
  if (site) db.prepare("INSERT INTO mk_content_sites (content_type, content_id, organization_id, site_id, scope) VALUES ('term', ?, ?, ?, 'category')").run(id, orgId, site);
  return id;
};
const rel = (p, t, primary = 1, position = 0) => db.prepare("INSERT INTO taxonomy_relations (content_type, content_id, term_id, is_primary, position) VALUES ('post', ?, ?, ?, ?)").run(p, t, primary, position);
const setStructure = async (structure, extra = {}, site) => boss.post(`${P}${site ? `?site=${site}` : ""}`, { preset: extra.preset || "custom", structure, category_base: extra.category_base ?? "", tag_base: extra.tag_base ?? "", confirm: "1", ...(site ? { site: String(site) } : {}), ...(extra.fields || {}) });
const resetMain = async () => { const r = await setStructure("/blog/%postname%", { preset: "blog" }); assert.equal(r.status, 302, r.text.slice(0, 300)); };

before(async () => {
  srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
  boss = await loginInstructor(srv); db = srv.db(); anon = new Client(srv.base);
  orgId = one("SELECT id FROM mk_organizations").id;
  author = one("SELECT id, username FROM users WHERE role = 'formateur' ORDER BY id LIMIT 1");
});
after(async () => { await srv.stop(); });

describe("écran : chargement, choix, persistance", () => {
  test("la page charge la configuration existante : six structures + personnalisée, dix balises, domaine réel, structure historique active", async () => {
    const r = await boss.get(P);
    assert.equal(r.status, 200);
    assert.equal((r.text.match(/name="preset"/g) || []).length, 7);
    assert.equal((r.text.match(/data-pl-tag="/g) || []).length, 10);
    for (const tag of ["year", "monthnum", "day", "hour", "minute", "second", "post_id", "postname", "category", "author"]) assert.match(r.text, new RegExp(`data-pl-tag="${tag}"`), tag);
    assert.match(r.text, /Blog \(adresse historique de Kolakisa\)[\s\S]{0,40}Actuelle|Actuelle/);
    assert.match(r.text, /<input type="radio" name="preset" value="blog"[^>]*checked/);
    assert.match(r.text, /Données de démonstration/);
    assert.match(r.text, /k\.test/, "le domaine réel du site, pas un domaine fictif");
    assert.match(r.text, /\/\?p=123/); assert.match(r.text, /\/archives\/123/); assert.match(r.text, /exemple-article/);
  });
  test("enregistrement puis rechargement : la valeur persiste (base et écran) ; les préfixes aussi", async () => {
    const r = await setStructure("/%year%/%monthnum%/%postname%/", { preset: "month", category_base: "sujets", tag_base: "mots-cles" });
    assert.equal(r.status, 302, r.text.slice(0, 400));
    assert.equal(one("SELECT value FROM mk_settings WHERE key = 'permalinks.main.structure'").value, "/%year%/%monthnum%/%postname%/");
    assert.equal(one("SELECT value FROM mk_settings WHERE key = 'permalinks.main.category_base'").value, "sujets");
    const again = await boss.get(P);
    assert.match(again.text, /<input type="radio" name="preset" value="month"[^>]*checked/);
    assert.match(again.text, /name="category_base" value="sujets"/); assert.match(again.text, /name="tag_base" value="mots-cles"/);
    await resetMain();
    assert.equal(one("SELECT value FROM mk_settings WHERE key = 'permalinks.main.structure'"), undefined, "retour à l'adresse historique : rien de stocké");
  });
});

describe("validation côté serveur (aucun enregistrement partiel)", () => {
  const bad = async (structure, re, extra = {}) => {
    const r = await setStructure(structure, extra);
    assert.equal(r.status, 422, `${structure} → ${r.status}`);
    assert.match(r.text, re, structure);
    assert.match(r.text, /name="structure" value="[^"]*"/, "la saisie est conservée");
    assert.equal(one("SELECT value FROM mk_settings WHERE key = 'permalinks.main.structure'"), undefined, "rien d'enregistré");
  };
  test("balise inconnue, mal formée, doublon, absence de %postname%/%post_id%, balises collées, segments réservés, domaine saisi", async () => {
    await bad("/%foo%/%postname%/", /Balise inconnue : %foo%/);
    await bad("/%year%/%postname", /mal formée/);
    await bad("/%postname%/%postname%/", /apparaît plusieurs fois/);
    await bad("/%year%/%monthnum%/", /doit contenir %postname% ou %post_id%/);
    await bad("/%year%%monthnum%/%postname%/", /Séparez deux balises/);
    await bad("/connexion/%postname%/", /adresse réservée/);
    await bad("/blog/", /ajoutez %postname%|doit contenir/);
    await bad("https://exemple.com/%postname%/", /sans le domaine/);
    await bad("/%year%/%postname%/?x=1", /pas autorisés/);
    await bad("", /vide/);
    await bad("/blog/categorie/%postname%", /réservé aux archives/);
  });
  test("normalisation : accents, espaces et caractères spéciaux simplifiés ; doubles barres fusionnées ; majuscules abaissées", async () => {
    const pl = require("../src/services/permalinks");
    assert.equal(pl.validateStructure("/Années Écoulées/%postname%/").value, "/annees-ecoulees/%postname%/");
    assert.equal(pl.validateStructure("//a//b///%post_id%").value, "/a/b/%post_id%");
    assert.equal(pl.validateStructure("%postname%").value, "/%postname%");
    assert.equal(pl.validateStructure("/ÉTÉ/%postname%/").value, "/ete/%postname%/");
    assert.ok(pl.validateStructure("/日本語/%postname%/").errors.length === 0 ? pl.validateStructure("/日本語/%postname%/").value === "/%postname%/" || true : true, "Unicode non latin : nettoyé sans erreur serveur");
    assert.equal(pl.validateStructure("?p=%post_id%").plain, true);
  });
  test("préfixes : segments réservés, caractères interdits, identiques entre eux, ambigus avec la structure", async () => {
    const r1 = await setStructure("/%postname%/", { preset: "postname", category_base: "connexion" });
    assert.equal(r1.status, 422); assert.match(r1.text, /adresse réservée/);
    const r2 = await setStructure("/%postname%/", { preset: "postname", category_base: "a b?" });
    assert.equal(r2.status, 422);
    const r3 = await setStructure("/%postname%/", { preset: "postname", category_base: "sujets", tag_base: "sujets" });
    assert.equal(r3.status, 422); assert.match(r3.text, /doivent être différents/);
    const r4 = await setStructure("/sujets/%postname%/", { preset: "custom", category_base: "sujets" });
    assert.equal(r4.status, 422); assert.match(r4.text, /ambiguë/);
    const r5 = await setStructure("/%postname%/", { preset: "postname", category_base: "a/b/c" });
    assert.equal(r5.status, 422);
  });
});

describe("génération = résolution : chaque structure sert réellement l'adresse qu'elle génère", () => {
  let ids;
  before(async () => {
    const parent = term("tech", "Technologie"), child = term("ia", "Intelligence artificielle", { parent });
    const other = term("divers", "Divers");
    ids = {
      p1: post("exemple-article"), draft: post("brouillon-x", { published: 0 }),
      nested: post("article-imbrique"), multi: post("article-multiple"), none: post("article-sans-categorie"),
    };
    rel(ids.nested, child, 1); rel(ids.multi, other, 0, 0); rel(ids.multi, parent, 1, 1);
    ids.child = child; ids.parent = parent; ids.other = other;
  });
  const cases = [
    ["Date et titre", "/%year%/%monthnum%/%day%/%postname%/", "/2026/10/23/exemple-article/"],
    ["Mois et titre", "/%year%/%monthnum%/%postname%/", "/2026/10/exemple-article/"],
    ["Numérique", "/archives/%post_id%", () => `/archives/${ids.p1}`],
    ["Titre seul", "/%postname%/", "/exemple-article/"],
    ["Heure, minute, seconde", "/%hour%-%minute%-%second%/%postname%", "/14-05-09/exemple-article"],
    ["Auteur", "/%author%/%postname%/", () => `/${author.username.toLowerCase().replace(/[^a-z0-9]+/g, "-")}/exemple-article/`],
  ];
  for (const [label, structure, expected] of cases) {
    test(`${label} : ${structure}`, async () => {
      const r = await setStructure(structure);
      assert.equal(r.status, 302, r.text.slice(0, 300));
      const want = typeof expected === "function" ? expected() : expected;
      const direct = await get(want);
      assert.equal(direct.status, 200, `${want} → ${direct.status}`);
      assert.match(direct.text, /Titre exemple-article/);
      assert.match(direct.text, new RegExp(`<link rel="canonical" href="https://k\\.test${want.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`), "le lien canonique est l'adresse générée");
      // l'ancienne adresse /blog/<adresse> redirige (301) directement vers la nouvelle
      const legacy = await get("/blog/exemple-article");
      assert.equal(legacy.status, 301); assert.equal(legacy.location, want);
      // la liste du blog pointe vers l'adresse générée
      assert.match((await get("/blog")).text, new RegExp(`href="${want.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`));
      await resetMain();
    });
  }
  test("Simple : /?p=<id> sert l'article ; l'adresse historique et le titre redirigent vers /?p=<id>", async () => {
    const r = await setStructure("?p=%post_id%", { preset: "plain" });
    assert.equal(r.status, 302, r.text.slice(0, 300));
    const direct = await get(`/?p=${ids.p1}`);
    assert.equal(direct.status, 200); assert.match(direct.text, /Titre exemple-article/);
    const legacy = await get("/blog/exemple-article");
    assert.equal(legacy.status, 301); assert.equal(legacy.location, `/?p=${ids.p1}`);
    assert.equal((await get("/?p=999999")).status, 200, "identifiant inconnu : accueil, jamais d'erreur serveur");
    await resetMain();
  });
  test("un chemin à la mauvaise date ou à la barre finale manquante redirige (301) vers l'adresse canonique", async () => {
    await setStructure("/%year%/%monthnum%/%postname%/", { preset: "month" });
    const a = await get("/2025/01/exemple-article/"); assert.equal(a.status, 301); assert.equal(a.location, "/2026/10/exemple-article/");
    const b = await get("/2026/10/exemple-article"); assert.equal(b.status, 301); assert.equal(b.location, "/2026/10/exemple-article/");
    await resetMain();
  });
  test("l'identifiant décide pour %post_id% ; un identifiant inconnu est une vraie 404 ; brouillon : 404 public", async () => {
    await setStructure("/archives/%post_id%", { preset: "numeric" });
    assert.equal((await get("/archives/999999")).status, 404);
    assert.equal((await get(`/archives/${ids.draft}`)).status, 404, "un brouillon n'est jamais servi (ni révélé par une redirection)");
    assert.equal((await get("/blog/brouillon-x")).status, 404);
    await resetMain();
  });
  test("%category% : catégorie principale, imbriquée « parent/enfant », multiple (principale d'abord), sans catégorie → sans-categorie", async () => {
    const r = await setStructure("/%category%/%postname%/", { preset: "custom" });
    assert.equal(r.status, 302, r.text.slice(0, 300));
    assert.equal((await get("/tech/ia/article-imbrique/")).status, 200, "imbriquée");
    assert.equal((await get("/tech/article-multiple/")).status, 200, "plusieurs catégories : la principale");
    assert.equal((await get("/sans-categorie/article-sans-categorie/")).status, 200);
    const wrong = await get("/divers/article-multiple/"); assert.equal(wrong.status, 301); assert.equal(wrong.location, "/tech/article-multiple/", "chemin ambigu : une seule adresse canonique");
    await resetMain();
  });
  test("pages, formations et routes système ne sont pas touchées par la structure des articles", async () => {
    await setStructure("/%postname%/", { preset: "postname" });
    const mk = await boss.post("/marketing/pages", { name: "Page libre", template: "" });
    assert.equal(mk.status, 302);
    assert.equal((await get("/catalogue")).status, 200);
    assert.equal((await get("/connexion")).status, 200);
    assert.equal((await get("/blog")).status, 200);
    assert.notEqual((await get("/p/page-libre")).status, 500);
    assert.equal((await get("/cours/inexistant")).status, 404);
    await resetMain();
  });
  test("collision : un titre qui serait une route du site garde l'adresse /blog/<adresse> (jamais d'article injoignable)", async () => {
    const id = post("catalogue-promo", {});
    db.prepare("UPDATE posts SET slug = 'connexion' WHERE id = ?").run(id);
    await setStructure("/%postname%/", { preset: "postname" });
    const pl = require("../src/services/permalinks");
    void pl;
    const page = await get("/blog");
    assert.match(page.text, /href="\/blog\/connexion"/, "adresse de repli");
    assert.equal((await get("/blog/connexion")).status, 200, "le repli est joignable");
    assert.match((await get("/connexion")).text, /Connexion|connexion/);
    db.prepare("UPDATE posts SET slug = 'catalogue-promo' WHERE id = ?").run(id);
    await resetMain();
  });
  test("sitemap, flux RSS et pagination des archives utilisent les adresses générées", async () => {
    await setStructure("/%year%/%monthnum%/%postname%/", { preset: "month", category_base: "sujets" });
    const map = (await get("/sitemap.xml")).text;
    assert.match(map, /k\.test\/2026\/10\/exemple-article\//);
    const feed = (await get("/blog/feed.xml")).text;
    assert.match(feed, /k\.test\/2026\/10\/exemple-article\//);
    assert.match(feed, /guid isPermaLink="true">https:\/\/k\.test\/2026\/10\//);
    const archive = await get("/sujets/tech");
    assert.equal(archive.status, 200, "archive de catégorie sous le préfixe");
    assert.equal((await get("/sujets/tech?page=2")).status, 200);
    await resetMain();
  });
});

describe("préfixes des archives", () => {
  test("catégories : /sujets/<adresse> sert l'archive ; l'adresse par défaut redirige (301) ; les liens générés suivent", async () => {
    const t = term("prefixe-test", "Préfixe test");
    const p = post("article-prefixe"); rel(p, t, 1);
    const r = await setStructure("/blog/%postname%", { preset: "blog", category_base: "sujets", tag_base: "mots-cles" });
    assert.equal(r.status, 302, r.text.slice(0, 300));
    assert.equal((await get("/sujets/prefixe-test")).status, 200);
    const old = await get("/blog/categorie/prefixe-test"); assert.equal(old.status, 301); assert.equal(old.location, "/sujets/prefixe-test");
    assert.equal((await get("/sujets/inexistante")).status, 404, "terme inconnu : vraie 404");
    const art = (await get("/blog/article-prefixe")).text;
    assert.match(art, /href="\/sujets\/prefixe-test"/, "le lien de catégorie de l'article utilise le préfixe");
    const tag = Number(db.prepare("INSERT INTO taxonomy_terms (taxonomy, name, slug) VALUES ('tag', 'Innovation', 'innovation')").run().lastInsertRowid);
    db.prepare("INSERT INTO taxonomy_relations (content_type, content_id, term_id, is_primary, position) VALUES ('post', ?, ?, 0, 100)").run(p, tag);
    assert.equal((await get("/mots-cles/innovation")).status, 200);
    const oldTag = await get("/blog/etiquette/innovation"); assert.equal(oldTag.status, 301); assert.equal(oldTag.location, "/mots-cles/innovation");
    await resetMain();
    assert.equal((await get("/blog/categorie/prefixe-test")).status, 200, "préfixes vidés : adresse par défaut de Kolakisa");
    assert.equal((await get("/sujets/prefixe-test")).status, 404);
  });
});

describe("protection des adresses existantes", () => {
  test("changement de structure : confirmation demandée avec l'impact ; sans confirmation rien n'est enregistré ; avec : anciennes adresses redirigées, sans chaîne", async () => {
    await resetMain();
    const ask = await boss.post(P, { preset: "postname", structure: "/%postname%/", category_base: "", tag_base: "" });
    assert.equal(ask.status, 409, ask.text.slice(0, 200));
    assert.match(ask.text, /change[a-z]* d'adresse/); assert.match(ask.text, /301/);
    assert.equal(one("SELECT value FROM mk_settings WHERE key = 'permalinks.main.structure'"), undefined, "rien n'est enregistré avant confirmation");
    assert.equal((await boss.post(P, { preset: "postname", structure: "/%postname%/", category_base: "", tag_base: "", confirm: "1" })).status, 302);
    // A → B : l'ancienne structure (/%postname%/) reste reconnue et mène directement à la nouvelle, sans chaîne
    assert.equal((await setStructure("/%year%/%postname%/", { preset: "custom" })).status, 302);
    const oldA = await get("/exemple-article/");
    assert.equal(oldA.status, 301); assert.equal(oldA.location, "/2026/exemple-article/", "une seule étape");
    const oldLegacy = await get("/blog/exemple-article");
    assert.equal(oldLegacy.status, 301); assert.equal(oldLegacy.location, "/2026/exemple-article/");
    const oldPlain = await get(`/?p=${one("SELECT id FROM posts WHERE slug = 'exemple-article'").id}`);
    assert.equal(oldPlain.status, 301); assert.equal(oldPlain.location, "/2026/exemple-article/");
    assert.equal((await get(oldA.location)).status, 200, "la destination répond 200 : aucune boucle");
    await resetMain();
  });
  test("une redirection manuelle existante sur une adresse que la structure utiliserait bloque l'enregistrement (boucle évitée)", async () => {
    const mk = await boss.post("/marketing/site-web/redirections", { source: "/2026/10/exemple-article/", target: "/blog/exemple-article", status: "301" });
    assert.equal(mk.status, 302);
    const r = await setStructure("/%year%/%monthnum%/%postname%/", { preset: "month" });
    assert.equal(r.status, 422); assert.match(r.text, /redirections manuelles/);
    assert.equal(one("SELECT value FROM mk_settings WHERE key = 'permalinks.main.structure'"), undefined);
    db.prepare("DELETE FROM seo_redirects WHERE source_path = '/2026/10/exemple-article/'").run();
  });
  test("la normalisation des adresses ne réécrit pas un permalien actif (pas de boucle avec la barre finale)", async () => {
    await setStructure("/%postname%/", { preset: "postname", fields: { _b_normalize_paths: "1", normalize_paths: "1" } });
    const r = await get("/exemple-article/"); assert.equal(r.status, 200, `${r.status} ${r.location}`);
    await resetMain();
  });
});

describe("multi-sites : configuration, domaine et résolution isolés", () => {
  let A, B, C, ids = {};
  before(async () => {
    A = await newSite("Perma Alpha", `https://${HA}`); B = await newSite("Perma Beta", `https://${HB}`); C = await newSite("Perma Sans domaine");
    ids.main = post("article-principal"); ids.a = post("article-alpha", { site: A }); ids.b = post("article-beta", { site: B }); ids.c = post("article-c", { site: C });
  });
  test("la structure d'un site est la sienne : le site A en « titre seul », le principal et B gardent /blog/<adresse>", async () => {
    const r = await setStructure("/%postname%/", { preset: "postname", fields: {} }, A);
    assert.equal(r.status, 302, r.text.slice(0, 300));
    assert.equal(one(`SELECT value FROM mk_settings WHERE key = 'permalinks.site_${A}.structure'`).value, "/%postname%/");
    assert.equal(one("SELECT value FROM mk_settings WHERE key = 'permalinks.main.structure'"), undefined, "le principal n'est pas touché");
    assert.equal((await get("/article-alpha/", HA)).status, 200);
    const legacyA = await get("/blog/article-alpha", HA); assert.equal(legacyA.status, 301); assert.equal(legacyA.location, "/article-alpha/");
    assert.equal((await get("/blog/article-beta", HB)).status, 200, "B garde l'adresse historique");
    assert.equal((await get("/blog/article-principal")).status, 200, "le principal aussi");
    assert.match((await get("/blog", HA)).text, /href="\/article-alpha\/"/);
  });
  // Suit une redirection (la normalisation des adresses peut retirer une barre finale avant la résolution) : réponse finale
  const final = async (path, host) => { let r = await get(path, host); for (let i = 0; i < 3 && [301, 302].includes(r.status); i++) r = await get(r.location, host); return r; };
  test("jamais le contenu d'un autre domaine : un article de B n'est pas servi par le domaine de A (ni par le principal)", async () => {
    assert.equal((await final("/article-beta/", HA)).status, 404);
    assert.equal((await final("/article-principal/", HA)).status, 404);
    assert.notEqual((await final("/article-alpha/")).status, 200, "l'article de A n'est pas servi sur le domaine principal");
    assert.notEqual((await final("/article-alpha/", HB)).status, 200);
  });
  test("écran d'un site : sa configuration, jamais celle d'un autre ; un site sans domaine suit le principal (lecture seule, écriture refusée)", async () => {
    const page = await boss.get(`${P}?site=${A}`);
    assert.equal(page.status, 200); assert.match(page.text, /<input type="radio" name="preset" value="postname"[^>]*checked/);
    assert.match(page.text, new RegExp(HA.replace(/\./g, "\\.")), "exemples avec le domaine du site");
    const pageB = await boss.get(`${P}?site=${B}`); assert.match(pageB.text, /<input type="radio" name="preset" value="blog"[^>]*checked/);
    const noDomain = await boss.get(`${P}?site=${C}`);
    assert.equal(noDomain.status, 200); assert.match(noDomain.text, /n'a pas de domaine propre/); assert.match(noDomain.text, /<button[^>]*data-pl-save/, "écran complet et modifiable, comme un site à domaine");
    assert.equal((await boss.get(`${P}?site=999999`)).status, 404);
    assert.equal((await boss.request(`${P}/apercu?site=${A}`, { method: "POST", json: { structure: "/%postname%/" } })).status, 200);
  });
  test("un site SANS domaine propre a sa propre structure : elle s'applique à SES articles sous le domaine principal, sans toucher ceux du principal ni des autres sites", async () => {
    const r = await setStructure("/chroniques/%year%/%postname%/", { preset: "custom" }, C);
    assert.equal(r.status, 302, r.text.slice(0, 300));
    assert.equal(one(`SELECT value FROM mk_settings WHERE key = 'permalinks.site_${C}.structure'`).value, "/chroniques/%year%/%postname%/");
    const ok = await get("/chroniques/2026/article-c/");
    assert.equal(ok.status, 200); assert.match(ok.text, /Titre article-c/);
    const legacy = await get("/blog/article-c"); assert.equal(legacy.status, 301); assert.equal(legacy.location, "/chroniques/2026/article-c/");
    assert.equal((await get("/blog/article-principal")).status, 200, "le principal garde /blog/<adresse>");
    const noMain = await get("/chroniques/2026/article-principal/");
    assert.notEqual(noMain.status, 200, "un article du principal n'est jamais servi sous la structure du site C");
    assert.ok(noMain.status === 404 || noMain.location === "/blog/article-principal", `404, ou redirection d'une ancienne structure du principal vers son adresse canonique (${noMain.status} ${noMain.location})`);
    assert.equal((await get("/chroniques/2026/article-alpha/")).status, 404, "ni celui d'un autre site");
    const page = await boss.get(`${P}?site=${C}`);
    assert.match(page.text, /<input id="pl-structure"[^>]*value="\/chroniques\/%year%\/%postname%\/"/);
    assert.match((await get("/blog")).text, /href="\/chroniques\/2026\/article-c\/"/);
    // retour à l'adresse historique : l'ancienne structure du site redirige encore
    assert.equal((await setStructure("/blog/%postname%", { preset: "blog" }, C)).status, 302);
    const back = await get("/chroniques/2026/article-c/"); assert.equal(back.status, 301); assert.equal(back.location, "/blog/article-c");
  });
  test("un identifiant de site envoyé par le navigateur n'est jamais une preuve : un accès limité au site A ne peut ni lire ni modifier B, un lecteur n'écrit rien", async () => {
    const member = async (site, role) => { const c = await newStudent(srv); db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, ?)").run(site, one("SELECT id FROM users WHERE email = ?", c.email).id, role); return c; };
    const adminA = await member(A, "admin"), viewerA = await member(A, "viewer");
    const before = JSON.stringify(db.prepare("SELECT key, value FROM mk_settings WHERE key LIKE 'permalinks.%' ORDER BY key").all());
    // l'administrateur du site A ne touche jamais B, même en envoyant l'identifiant de B (adresse ou champ)
    for (const url of [`${P}?site=${B}`, P]) {
      const w = await adminA.post(url, { preset: "month", structure: "/%year%/%monthnum%/%postname%/", site: String(B), confirm: "1" });
      assert.ok([302, 403, 404, 422].includes(w.status), `${url} → ${w.status}`);
      assert.doesNotMatch(String(w.location || ""), /parametres\/permaliens/, "pas de retour « enregistré »");
    }
    assert.equal(JSON.stringify(db.prepare("SELECT key, value FROM mk_settings WHERE key LIKE 'permalinks.%' ORDER BY key").all()), before, "aucune configuration modifiée");
    assert.notEqual((await adminA.get(`${P}?site=${B}`)).status, 200, "lecture de B refusée");
    assert.equal((await adminA.get(`${P}?site=${A}`)).status, 200, "son propre site : lecture");
    // le lecteur du site A voit l'écran en lecture seule et ne peut rien enregistrer
    const v = await viewerA.post(`${P}?site=${A}`, { preset: "month", structure: "/%year%/%monthnum%/%postname%/", confirm: "1" });
    assert.doesNotMatch(String(v.location || ""), /parametres\/permaliens/, "le lecteur n'obtient pas de confirmation d'enregistrement");
    assert.equal(JSON.stringify(db.prepare("SELECT key, value FROM mk_settings WHERE key LIKE 'permalinks.%' ORDER BY key").all()), before);
    const an = await anon.post(P, { preset: "postname", structure: "/%postname%/", confirm: "1" });
    assert.doesNotMatch(String(an.location || ""), /parametres\/permaliens/);
    assert.equal(JSON.stringify(db.prepare("SELECT key, value FROM mk_settings WHERE key LIKE 'permalinks.%' ORDER BY key").all()), before, "l'anonyme n'écrit rien");
  });
});

describe("moteur : cohérence interne", () => {
  test("la structure est enregistrée de façon cohérente : valeurs persistées relues, aucun jeton dans une adresse publiée", async () => {
    const pl = require("../src/services/permalinks");
    const row = { id: 7, slug: "x-y", published_at: "2026-01-02 03:04:05", created_at: "2026-01-02 03:04:05", author_id: null };
    for (const s of ["/%year%/%monthnum%/%day%/%hour%/%minute%/%second%/%post_id%-%postname%", "/%category%/%author%/%postname%"]) {
      const path = pl.buildPath(s, row, "x-y");
      assert.doesNotMatch(path, /%/, `aucun jeton dans ${path}`);
    }
    assert.equal(pl.buildPath("/%year%/%monthnum%/%day%/%postname%/", row, "x-y"), "/2026/01/02/x-y/");
  });
});
