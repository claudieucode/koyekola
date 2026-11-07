// Pied de page (chantier B) — conditions d'affichage et publication.
// Partie 1 (sans serveur) : chaque type de condition vrai/faux sur de vraies adresses, inclusions/exclusions, conditions multiples, priorité, conflits, rétro-compatibilité des autres types.
// Partie 2 (serveur réel) : « Où afficher ce pied ? » à la première publication, le bouton Publier applique réellement les conditions (pages publiques), dépublication,
//   conflits expliqués avant publication, test d'une adresse, sélecteurs, isolation entre deux sites, droits.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const TB = require("../src/themeBuilder");
const URLC = require("../src/themeBuilder/urlContext");
const R = require("../src/themeBuilder/render");
const { normalize, describe: desc } = TB.conditions;
const { resolve, conflicts, condOverlap } = TB.resolve;
const { scoreOf } = TB.match;
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, Client, loginInstructor, newStudent } = require("./helpers");

let n = 0;
const T = (type, name, cond, o = {}) => ({ id: ++n, type, name, status: "published", publishedAt: "2026-01-01T00:00:00Z", conditions: normalize(cond, type), ...o });
const F = (name, cond, o) => T("footer", name, cond, o);
const ctxOf = (view, o = {}) => ({ siteId: 1, view, id: null, authorId: null, parents: [], categories: [], categoryAncestors: [], tags: [], ...o });
const win = (ts, c, type = "footer") => { const r = resolve(ts, c, { type }); return r.winner && r.winner.name; };
const viewAt = (path) => (URLC.viewOfPath(path) || {}).view || null;

describe("Adresses réelles → vue de résolution", () => {
  test("compte client, pages de la boutique, produit, liste, fiche formation", () => {
    assert.equal(viewAt("/boutique/compte"), "account");
    assert.equal(viewAt("/boutique/compte/commandes"), "account");
    assert.equal(viewAt("/boutique/panier"), "shop_page");
    assert.equal(viewAt("/boutique/commande"), "shop_page");
    assert.equal(viewAt("/boutique"), "product_archive");
    assert.equal(viewAt("/boutique/categorie/chaussures"), "product_archive");
    assert.equal(viewAt("/boutique/produit/sac-rouge"), "product");
    assert.equal(viewAt("/cours/seo-pour-debutants"), "course");
    assert.equal(viewAt("/cours/seo-pour-debutants?x=1"), "course");
  });
  test("les autres adresses gardent le comportement d'origine (null = repli historique)", () => {
    for (const p of ["/", "/blog", "/p/accueil", "/cours", "/cours/seo/plan", "/a-propos", "//evil.test/boutique/compte"]) assert.equal(viewAt(p), null, p);
  });
  test("defaultContext (rendu public) : compte, panier et formation ont leur propre vue ; le reste inchangé", () => {
    assert.equal(R.defaultContext(1, "/boutique/compte").view, "account");
    assert.equal(R.defaultContext(1, "/boutique/panier").view, "shop_page");
    assert.equal(R.defaultContext(1, "/cours/seo").view, "course");
    assert.equal(R.defaultContext(1, "/").view, "front");
    assert.equal(R.defaultContext(1, "/une-page").view, "page");
  });
});

describe("Chaque condition : vrai et faux", () => {
  const cases = [
    ["Compte client", { kind: "account" }, [["account", {}]], [["shop_page", {}], ["page", {}], ["front", {}], ["product", {}], ["course", {}]]],
    ["Pages de la boutique (panier, commande…)", { kind: "shop_page" }, [["shop_page", {}]], [["account", {}], ["product_archive", {}], ["page", {}]]],
    ["Toute la boutique", { kind: "shop" }, [["account", {}], ["shop_page", {}], ["product_archive", {}], ["product", {}]], [["page", {}], ["front", {}], ["post", {}], ["course", {}], ["not_found", {}]]],
    ["Produits (effet réel)", { kind: "product" }, [["product", {}]], [["product_archive", {}], ["account", {}], ["page", {}]]],
    ["Produits d'une catégorie", { kind: "product", category: ["Chaussures"] }, [["product", { categories: ["chaussures"] }]], [["product", { categories: ["Sacs"] }], ["product", {}]]],
    ["Boutique : liste (effet réel)", { kind: "product_archive", sub: "shop" }, [["product_archive", { archive: { kind: "shop", name: "" } }]], [["product_archive", { archive: { kind: "category", name: "X" } }], ["product", {}]]],
    ["Fiche formation", { kind: "course" }, [["course", {}]], [["page", {}], ["post", {}], ["account", {}]]],
    ["Formation précise", { kind: "course", ids: [12] }, [["course", { id: 12 }]], [["course", { id: 13 }], ["page", { id: 12 }]]],
    ["Formations d'une catégorie", { kind: "course", category: ["Marketing"] }, [["course", { categories: ["marketing"] }]], [["course", { categories: ["Code"] }], ["course", {}]]],
    ["Pages précises (sélecteur)", { kind: "page", ids: [5, 6] }, [["page", { id: 5 }], ["page", { id: 6 }], ["front", { id: 5 }]], [["page", { id: 7 }], ["account", { id: 5 }], ["post", { id: 5 }]]],
    ["Articles d'une catégorie", { kind: "post", category: ["News"] }, [["post", { categories: ["News"] }]], [["post", { categories: ["Promo"] }], ["page", { categories: ["News"] }]]],
    ["Articles d'une étiquette", { kind: "post", tag: ["Été"] }, [["post", { tags: ["été"] }]], [["post", { tags: ["hiver"] }]]],
    ["Visiteur connecté", { kind: "visitor", state: "in" }, [["page", { visitor: { loggedIn: true, role: "etudiant" } }], ["account", { visitor: { loggedIn: true, role: "" } }]], [["page", { visitor: { loggedIn: false, role: "" } }], ["page", {}]]],
    ["Visiteur non connecté", { kind: "visitor", state: "out" }, [["page", { visitor: { loggedIn: false, role: "" } }]], [["page", { visitor: { loggedIn: true, role: "etudiant" } }], ["page", {}]]],
    ["Rôle formateur", { kind: "visitor", state: "in", roles: ["formateur"] }, [["page", { visitor: { loggedIn: true, role: "formateur" } }]], [["page", { visitor: { loggedIn: true, role: "etudiant" } }], ["page", { visitor: { loggedIn: false, role: "formateur" } }]]],
  ];
  for (const [label, cond, yes, no] of cases) {
    test(label, () => {
      const ts = [F("Pied", { include: [cond] })];
      for (const [view, o] of yes) assert.equal(win(ts, ctxOf(view, o)), "Pied", `${label} devrait correspondre à ${view}`);
      for (const [view, o] of no) assert.equal(win(ts, ctxOf(view, o)), null, `${label} ne devrait pas correspondre à ${view}`);
    });
  }
  test("un visiteur inconnu (aperçu sans précision) ne correspond jamais à une condition de connexion, même en exclusion", () => {
    const ts = [F("Pied", { exclude: [{ kind: "visitor", state: "in" }] })];
    assert.equal(win(ts, ctxOf("page")), "Pied", "exclusion non évaluable = non exclu");
    assert.equal(win(ts, ctxOf("page", { visitor: { loggedIn: true, role: "" } })), null);
  });
});

describe("Inclusions, exclusions, conditions multiples", () => {
  test("tout le site SAUF le compte client et les pages précises", () => {
    const ts = [F("Pied", { exclude: [{ kind: "account" }, { kind: "page", ids: [9] }] })];
    assert.equal(win(ts, ctxOf("page", { id: 1 })), "Pied");
    assert.equal(win(ts, ctxOf("account")), null);
    assert.equal(win(ts, ctxOf("page", { id: 9 })), null);
    assert.equal(win(ts, ctxOf("course")), "Pied");
  });
  test("plusieurs inclusions se combinent en OU ; l'exclusion l'emporte sur une inclusion plus précise", () => {
    const ts = [F("Pied", { include: [{ kind: "account" }, { kind: "course" }, { kind: "page", ids: [4, 5] }], exclude: [{ kind: "page", ids: [4] }] })];
    assert.equal(win(ts, ctxOf("account")), "Pied");
    assert.equal(win(ts, ctxOf("course")), "Pied");
    assert.equal(win(ts, ctxOf("page", { id: 4 })), null);
    assert.equal(win(ts, ctxOf("page", { id: 5 })), "Pied");
    assert.equal(win(ts, ctxOf("page", { id: 6 })), null);
  });
  test("les critères d'une même condition se combinent en ET (connecté ET rôle)", () => {
    const ts = [F("Pied", { include: [{ kind: "visitor", state: "in", roles: ["formateur", "client"] }] })];
    assert.equal(win(ts, ctxOf("page", { visitor: { loggedIn: true, role: "client" } })), "Pied");
    assert.equal(win(ts, ctxOf("page", { visitor: { loggedIn: true, role: "etudiant" } })), null);
  });
  test("validation : état de connexion obligatoire et borné, rôles bornés, critères étrangers refusés", () => {
    assert.throws(() => normalize({ include: [{ kind: "visitor" }] }), /connect/i);
    assert.throws(() => normalize({ include: [{ kind: "visitor", state: "peut-etre" }] }), /connect/i);
    assert.throws(() => normalize({ include: [{ kind: "account", ids: [1] }] }), /critère/);
    assert.throws(() => normalize({ include: [{ kind: "course", tag: ["x"] }] }), /critère/);
    assert.throws(() => normalize({ include: [{ kind: "visitor", state: "in", roles: Array.from({ length: 51 }, (_, i) => `r${i}`) }] }), /au plus/);
    assert.deepEqual(normalize({ include: [{ kind: "visitor", state: "in", roles: " Formateur , formateur " }] }).include[0], { kind: "visitor", state: "in", roles: ["Formateur", "formateur"] });
  });
  test("libellés lisibles", () => {
    assert.equal(desc(normalize({ include: [{ kind: "account" }] })).include, "Compte client (boutique)");
    assert.equal(desc(normalize({ include: [{ kind: "shop" }, { kind: "course", ids: [3] }] })).include, "Toute la boutique OU Fiche formation (n° 3)");
    assert.equal(desc(normalize({ include: [{ kind: "visitor", state: "out" }] })).include, "Visiteur non connecté");
    assert.match(desc(normalize({ include: [{ kind: "visitor", state: "in", roles: ["formateur"] }] })).include, /connecté.*formateur/);
  });
});

describe("Priorité : le plus précis gagne, déterministe, jamais deux pieds", () => {
  test("page précise › compte › boutique › tout le site", () => {
    assert.ok(scoreOf({ kind: "page", ids: [1] }) > scoreOf({ kind: "account" }));
    assert.ok(scoreOf({ kind: "account" }) > scoreOf({ kind: "shop" }));
    assert.ok(scoreOf({ kind: "shop" }) > scoreOf({ kind: "site" }));
    assert.ok(scoreOf({ kind: "course", ids: [1] }) > scoreOf({ kind: "course", category: ["A"] }));
    assert.ok(scoreOf({ kind: "course", category: ["A"] }) > scoreOf({ kind: "course" }));
    assert.ok(scoreOf({ kind: "visitor", state: "in" }) > scoreOf({ kind: "site" }));
  });
  test("sur le compte client, le pied « Compte » l'emporte sur « Boutique » puis sur « Tout le site »", () => {
    const ts = [F("Général", {}), F("Boutique", { include: [{ kind: "shop" }] }), F("Compte", { include: [{ kind: "account" }] })];
    assert.equal(win(ts, ctxOf("account")), "Compte");
    assert.equal(win(ts, ctxOf("shop_page")), "Boutique");
    assert.equal(win(ts, ctxOf("page", { id: 3 })), "Général");
  });
  test("toujours UN SEUL gagnant, même avec dix pieds ; ordre indépendant de l'ordre de la liste", () => {
    const ts = Array.from({ length: 10 }, (_, i) => F(`P${i}`, { include: [{ kind: "shop" }] }, { id: 100 + i, publishedAt: `2026-01-0${(i % 5) + 1}T00:00:00Z` }));
    const r = resolve(ts, ctxOf("account"), { type: "footer" });
    assert.equal(r.candidates.length, 10);
    const w1 = r.winner.id, w2 = resolve([...ts].reverse(), ctxOf("account"), { type: "footer" }).winner.id;
    assert.equal(w1, w2, "déterministe");
    assert.equal(r.explain.filter((e) => e.state === "winner").length, 1);
  });
  test("égalité de précision : le plus récemment publié gagne, puis le plus petit identifiant", () => {
    const a = F("Ancien", { include: [{ kind: "shop" }] }, { id: 201, publishedAt: "2026-01-01T00:00:00Z" });
    const b = F("Récent", { include: [{ kind: "account" }, { kind: "shop_page" }] }, { id: 202, publishedAt: "2026-03-01T00:00:00Z" });
    const c = F("Compte seul", { include: [{ kind: "account" }] }, { id: 203, publishedAt: "2026-03-01T00:00:00Z" });
    assert.equal(win([a, b], ctxOf("shop_page")), "Récent", "plus précis (shop_page 55 > shop 22)");
    assert.equal(win([b, c], ctxOf("account")), "Récent", "même précision et même date : le plus petit identifiant");
  });
  test("un visiteur connecté bat « tout le site » mais pas une page précise", () => {
    const ts = [F("Général", {}), F("Connectés", { include: [{ kind: "visitor", state: "in" }] }), F("Page 4", { include: [{ kind: "page", ids: [4] }] })];
    const v = { loggedIn: true, role: "etudiant" };
    assert.equal(win(ts, ctxOf("page", { id: 5, visitor: v })), "Connectés");
    assert.equal(win(ts, ctxOf("page", { id: 5, visitor: { loggedIn: false, role: "" } })), "Général");
    assert.equal(win(ts, ctxOf("page", { id: 4, visitor: v })), "Page 4");
  });
});

describe("Conflits et chevauchements", () => {
  test("deux pieds mêmes conditions : doublon bloquant ; même précision sur une zone commune : avertissement", () => {
    const a = F("A", { include: [{ kind: "shop" }] }), b = F("B", { include: [{ kind: "shop" }] });
    assert.equal(conflicts([a, b])[0].severity, "blocking");
    const c = F("C", { include: [{ kind: "account" }] }), d = F("D", { include: [{ kind: "account" }], exclude: [{ kind: "page", ids: [1] }] });
    assert.equal(conflicts([c, d])[0].severity, "warning");
  });
  test("conditions de connexion opposées ou rôles disjoints : pas de chevauchement", () => {
    assert.equal(condOverlap({ kind: "visitor", state: "in" }, { kind: "visitor", state: "out" }), false);
    assert.equal(condOverlap({ kind: "visitor", state: "in", roles: ["formateur"] }, { kind: "visitor", state: "in", roles: ["client"] }), false);
    assert.equal(condOverlap({ kind: "visitor", state: "in" }, { kind: "visitor", state: "in", roles: ["client"] }), true);
    assert.equal(condOverlap({ kind: "course", ids: [1] }, { kind: "course", ids: [2] }), false);
    assert.equal(condOverlap({ kind: "account" }, { kind: "course" }), false, "vues sans rapport");
    assert.equal(condOverlap({ kind: "account" }, { kind: "shop" }), true);
  });
});

describe("Rétro-compatibilité : les autres types de parties", () => {
  test("en-tête, barre latérale et modèle libre acceptent les nouvelles conditions ; les types de contenu les refusent", () => {
    for (const type of ["header", "sidebar", "custom", "footer"]) assert.doesNotThrow(() => normalize({ include: [{ kind: "account" }, { kind: "course" }] }, type), type);
    assert.throws(() => normalize({ include: [{ kind: "account" }] }, "single_post"), /ne peut jamais correspondre/);
    assert.throws(() => normalize({ include: [{ kind: "course" }] }, "single_page"), /ne peut jamais correspondre/);
    assert.doesNotThrow(() => normalize({ include: [{ kind: "shop" }] }, "single_product"));
  });
  test("un modèle de contenu ne s'applique jamais aux nouvelles vues ; un en-tête oui ; anciennes vues inchangées", () => {
    const page = T("single_page", "Page type", {}), art = T("single_post", "Article", {}), head = T("header", "En-tête", {});
    for (const v of ["account", "shop_page", "course"]) { assert.equal(win([page, art], ctxOf(v), null), null, v); assert.equal(win([head], ctxOf(v), "header"), "En-tête", v); }
    assert.equal(win([page], ctxOf("page"), "single_page"), "Page type");
    assert.equal(win([art], ctxOf("post"), "single_post"), "Article");
  });
  test("les conditions existantes se comportent comme avant (article, page, archive, 404)", () => {
    const ts = [F("Général", {}), F("News", { include: [{ kind: "post", category: ["News"] }] }), F("Accueil", { include: [{ kind: "front_page" }] })];
    assert.equal(win(ts, ctxOf("post", { categories: ["News"] })), "News");
    assert.equal(win(ts, ctxOf("front")), "Accueil");
    assert.equal(win(ts, ctxOf("not_found")), "Général");
    assert.equal(scoreOf({ kind: "front_page" }), 90); assert.equal(scoreOf({ kind: "site" }), 10); assert.equal(scoreOf({ kind: "post", ids: [1] }), 100.1);
  });
});

describe("Pied de page — publication sur serveur réel", () => {
  let srv, boss, db, S1, S2, reader, pA, pB, pOther;
  const UA = { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 Chrome/120 Safari/537.36" };
  const U = (s, p = "") => `/marketing/site-web/sites/${s}/constructeur-de-theme${p}`;
  const post = (path, body, c = boss) => c.request(path, { method: "POST", json: body || {} });
  const get = (path, c = boss) => c.get(path);
  const json = (r) => JSON.parse(r.text);
  const sect = (id, text) => ({ id, type: "layout", children: [{ id: `${id}h`.slice(0, 20), type: "heading", props: { text, level: "2" } }] });
  const slug = (id) => db.prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(id).slug;
  const pub = async (id) => (await new Client(srv.base).get(`/p/${slug(id)}`, { headers: UA })).text;
  const mkPage = async (site, name) => {
    const id = Number((await boss.post("/marketing/pages", { name, site_id: site, kind: "page", template: "", ouvrir: "editeur" })).location.match(/pages\/(\d+)/)[1]);
    const rev = db.prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(id).revision;
    assert.equal((await boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", headers: { Origin: srv.base }, json: { revision: rev, content: { title: name, sections: [sect("sect00000001", `CORPS-${name}`)] } } })).status, 200);
    assert.equal((await boss.request(`/marketing/pages/${id}/publier.json`, { method: "POST", json: {}, headers: { Origin: srv.base } })).status, 200);
    return id;
  };
  const footer = async (site, name, conditions) => json(await post(U(site, "/api/modeles"), { type: "footer", name, conditions })).template;
  const saveDraft = async (t, text) => {
    const rev = db.prepare("SELECT revision FROM mk_web_components WHERE id = ?").get(t.sourceId).revision;
    const r = await boss.request(`/marketing/site-web/composants/${t.sourceId}/brouillon`, { method: "PUT", headers: { Origin: srv.base }, json: { revision: rev, content: { title: "t", sections: [sect(`sect${String(t.id).padStart(7, "0")}`, text)] } } });
    assert.equal(r.status, 200, r.text.slice(0, 200));
  };
  const ctx = () => ({ db, organizationId: db.prepare("SELECT organization_id o FROM mk_tb_templates LIMIT 1").get().o, userId: null });
  const status = (id) => db.prepare("SELECT status FROM mk_tb_templates WHERE id = ?").get(id).status;
  const cond = (id) => JSON.parse(db.prepare("SELECT conditions FROM mk_tb_templates WHERE id = ?").get(id).conditions);
  const strictPublish = (site, t, body) => post(U(site, `/api/modeles/${t.id}/publier`), { strict: true, revision: t.revision, ...body });
  const live = (site, view, o = {}) => { const w = R.resolveParts(ctx(), site, { siteId: site, view, id: null, authorId: null, parents: [], categories: [], categoryAncestors: [], tags: [], ...o }); return w.footer && w.footer.name; };

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db();
    const mk = async (name) => Number((await boss.post("/marketing/site-web/sites", { name })).location.match(/sites\/(\d+)/)[1]);
    S1 = await mk("Site Un"); S2 = await mk("Site Deux");
    pA = await mkPage(S1, "Page A"); pB = await mkPage(S1, "Page B"); pOther = await mkPage(S2, "Page autre site");
    reader = await newStudent(srv);
  });
  after(async () => { if (db) db.close(); if (srv) await srv.stop(); });

  test("première publication : « Où afficher ce pied ? » est exigé (409 + indication), rien n'est publié", async () => {
    const t = await footer(S1, "Pied général", {});
    const plan = json(await get(U(S1, `/api/modeles/${t.id}/plan-publication`)));
    assert.equal(plan.plan.firstPublish, true); assert.equal(plan.plan.summary.text, "Tout le site"); assert.equal(plan.plan.canPublish, true);
    const r = await strictPublish(S1, t, {});
    assert.equal(r.status, 409); assert.equal(json(r).needsScope, true); assert.match(json(r).error, /où afficher/i);
    assert.equal(status(t.id), "draft");
    const bad = await strictPublish(S1, t, { scope: "n-importe-quoi" });
    assert.equal(bad.status, 409); assert.equal(status(t.id), "draft");
  });

  test("« Tout le site » : publié, conditions vides, le pied s'affiche sur TOUTES les pages publiques du site", async () => {
    const t = await footer(S1, "Pied tout le site", {}); await saveDraft(t, "PIED-TOUT");
    const r = await strictPublish(S1, t, { scope: "site" });
    assert.equal(r.status, 200, r.text.slice(0, 300)); assert.equal(json(r).summary.text, "Tout le site");
    assert.equal(status(t.id), "published"); assert.deepEqual(cond(t.id), { include: [], exclude: [] });
    assert.ok((await pub(pA)).includes("PIED-TOUT")); assert.ok((await pub(pB)).includes("PIED-TOUT"));
    assert.ok(!(await pub(pOther)).includes("PIED-TOUT"), "isolation : l'autre site n'est pas touché");
    const again = await strictPublish(S1, { ...t, revision: json(r).template.revision }, {});
    assert.equal(again.status, 200, "republier un pied déjà publié ne redemande pas la portée");
  });

  test("« Conditions personnalisées » : le bouton Publier applique réellement les conditions sur les pages publiques", async () => {
    const t = await footer(S1, "Pied page B seulement", {}); await saveDraft(t, "PIED-B-SEUL");
    const noCond = await strictPublish(S1, t, { scope: "custom" });
    assert.equal(noCond.status, 422, "personnalisé sans condition : refusé"); assert.equal(status(t.id), "draft");
    const r = await strictPublish(S1, t, { scope: "custom", conditions: { include: [{ kind: "page", ids: [pB] }] } });
    assert.equal(r.status, 200, r.text.slice(0, 300)); assert.deepEqual(cond(t.id).include, [{ kind: "page", ids: [pB] }]);
    assert.match(json(r).summary.text, /Uniquement : la page « Page B »/);
    assert.ok((await pub(pB)).includes("PIED-B-SEUL"), "affiché sur la page B");
    const hA = await pub(pA);
    assert.ok(!hA.includes("PIED-B-SEUL") && hA.includes("PIED-TOUT"), "page A : le pied général, pas celui de la page B");
    assert.equal((await pub(pB)).split("lp-site-footer").length - 1, 1, "jamais deux pieds sur une page");
  });

  test("dépublier : le pied disparaît du site et la page retrouve le pied général ; republier le remet", async () => {
    const t = db.prepare("SELECT id FROM mk_tb_templates WHERE name = 'Pied page B seulement'").get();
    const r = await post(U(S1, `/api/modeles/${t.id}/depublier`)); assert.equal(r.status, 200); assert.equal(status(t.id), "draft");
    const hB = await pub(pB); assert.ok(!hB.includes("PIED-B-SEUL") && hB.includes("PIED-TOUT"));
    assert.equal((await post(U(S1, `/api/modeles/${t.id}/depublier`))).status, 409, "déjà dépublié");
    const rev = db.prepare("SELECT revision FROM mk_tb_templates WHERE id = ?").get(t.id).revision;
    assert.equal((await strictPublish(S1, { id: t.id, revision: rev }, {})).status, 200, "déjà publié une fois : pas de nouvelle question, mêmes conditions");
    assert.ok((await pub(pB)).includes("PIED-B-SEUL"));
  });

  test("conflits visibles AVANT publication : doublon exact (remplacer), chevauchement expliqué (garder les deux)", async () => {
    const dup = await footer(S1, "Doublon du général", {}); await saveDraft(dup, "PIED-DOUBLON");
    const plan = json(await get(U(S1, `/api/modeles/${dup.id}/plan-publication`))).plan;
    assert.equal(plan.canPublish, false); assert.equal(plan.blocking.length, 1); assert.match(plan.blocking[0].message, /mêmes conditions/);
    assert.deepEqual(plan.replaceable.map((x) => x.name), ["Pied tout le site"]);
    const refuse = await strictPublish(S1, dup, { scope: "site" });
    assert.equal(refuse.status, 409); assert.equal(status(dup.id), "draft"); assert.ok(json(refuse).conflicts.some((c) => c.severity === "blocking"));
    assert.ok(!(await pub(pA)).includes("PIED-DOUBLON"), "rien n'a changé sur le site");
    const rep = await strictPublish(S1, dup, { scope: "site", replace: true });
    assert.equal(rep.status, 200, rep.text.slice(0, 300)); assert.deepEqual(json(rep).replaced.map((x) => x.name), ["Pied tout le site"]);
    assert.equal(status(dup.id), "published"); assert.equal(db.prepare("SELECT status FROM mk_tb_templates WHERE name = 'Pied tout le site'").get().status, "draft");
    assert.ok((await pub(pA)).includes("PIED-DOUBLON"));
    // chevauchement : un pied plus précis, expliqué avant publication, puis garder les deux
    const prec = await footer(S1, "Pied page A", {}); await saveDraft(prec, "PIED-A");
    const p2 = json(await get(U(S1, `/api/modeles/${prec.id}/plan-publication?conditions=${encodeURIComponent(JSON.stringify({ include: [{ kind: "page", ids: [pA] }] }))}`))).plan;
    assert.equal(p2.canPublish, true); assert.equal(p2.overlaps[0].relation, "mine_wins"); assert.match(p2.overlaps[0].message, /remplacera/);
    assert.equal(p2.impact.wins, 1); assert.equal(p2.impact.takesFrom[0].name, "Doublon du général");
    const keep = await strictPublish(S1, prec, { scope: "custom", conditions: { include: [{ kind: "page", ids: [pA] }] } });
    assert.equal(keep.status, 200); assert.ok((await pub(pA)).includes("PIED-A")); assert.ok((await pub(pB)).includes("PIED-B-SEUL"), "page B garde son pied précis"); assert.ok(!(await pub(pA)).includes("PIED-DOUBLON"), "page A : le pied plus précis a remplacé le général");
  });

  test("effet réel sur les vues compte client, boutique et fiche formation (résolution du rendu public)", async () => {
    const acc = await footer(S1, "Pied compte", { include: [{ kind: "account" }] });
    const shop = await footer(S1, "Pied boutique", {});
    assert.equal((await strictPublish(S1, acc, { scope: "custom", conditions: { include: [{ kind: "account" }] } })).status, 200);
    assert.equal((await strictPublish(S1, shop, { scope: "custom", conditions: { include: [{ kind: "shop" }, { kind: "course" }] } })).status, 200);
    const at = (p) => R.resolveParts(ctx(), S1, R.defaultContext(S1, p)).footer;
    assert.equal(at("/boutique/compte").name, "Pied compte");
    assert.equal(at("/boutique/panier").name, "Pied boutique");
    assert.equal(at("/cours/seo").name, "Pied boutique");
    assert.equal(at("/boutique/compte/commandes").name, "Pied compte");
    assert.equal(at("/une-page").name, "Doublon du général");
    assert.equal(live(S1, "product").length > 0, true);
    assert.equal(live(S2, "account"), null, "isolation : aucun pied sur l'autre site");
  });

  test("« ce pied s'applique-t-il à cette adresse ? » (aperçu par URL)", async () => {
    const acc = db.prepare("SELECT id FROM mk_tb_templates WHERE name = 'Pied compte'").get();
    const ask = async (url, extra = "") => json(await get(U(S1, `/api/modeles/${acc.id}/s-applique?url=${encodeURIComponent(url)}${extra}`)));
    const yes = await ask("/boutique/compte"); assert.equal(yes.applies, true); assert.match(yes.message, /^Oui/);
    const no = await ask("/boutique/panier"); assert.equal(no.applies, false); assert.match(no.message, /^Non/);
    const pg = await ask(`/p/${slug(pA)}`); assert.equal(pg.applies, false); assert.match(pg.pageLabel, /Page A/);
    assert.equal((await ask("/p/" + slug(pOther))).ok, false, "page d'un autre site refusée");
    assert.equal((await get(U(S1, `/api/modeles/${acc.id}/s-applique?url=${encodeURIComponent("//evil.test")}`))).status, 422);
    const draft = await footer(S1, "Pied brouillon", { include: [{ kind: "shop_page" }] });
    const d = json(await get(U(S1, `/api/modeles/${draft.id}/s-applique?url=/boutique/panier`)));
    assert.equal(d.applies, true); assert.equal(d.live, false); assert.match(d.message, /une fois publié/);
  });

  test("conditions de connexion : exclusion « connectés » et rôle, via l'aperçu d'adresse", async () => {
    const t = await footer(S1, "Pied visiteurs", { include: [{ kind: "visitor", state: "out" }] });
    const q = async (extra) => json(await get(U(S1, `/api/modeles/${t.id}/s-applique?url=/blog${extra}`)));
    assert.equal((await q("&visiteur=anonyme")).applies, true);
    assert.equal((await q("&visiteur=connecte&role=etudiant")).applies, false);
    assert.equal((await q("")).applies, false, "visiteur non précisé : jamais supposé");
  });

  test("sélecteurs : pages, catégories, étiquettes, rôles avec recherche ; limités au site", async () => {
    const pages = json(await get(U(S1, "/api/cibles?type=page"))).items; assert.ok(pages.some((p) => p.value === pA) && !pages.some((p) => p.value === pOther));
    assert.deepEqual(json(await get(U(S1, "/api/cibles?type=page&q=page%20b"))).items.map((p) => p.value), [pB]);
    assert.ok(json(await get(U(S2, "/api/cibles?type=page"))).items.some((p) => p.value === pOther));
    assert.ok(json(await get(U(S1, "/api/cibles?type=role"))).items.some((r) => r.value === "formateur"));
    for (const k of ["category", "tag", "author", "product_category", "product_tag", "course"]) assert.equal((await get(U(S1, `/api/cibles?type=${k}`))).status, 200, k);
    assert.equal((await get(U(S1, "/api/cibles?type=nimporte"))).status, 422);
  });

  test("résumé lisible : « Tout le site sauf les pages … »", async () => {
    const t = await footer(S1, "Pied sauf", { exclude: [{ kind: "page", ids: [pA, pB] }] });
    const p = json(await get(U(S1, `/api/modeles/${t.id}/plan-publication`))).plan;
    assert.equal(p.summary.text, "Tout le site, sauf : les pages « Page A », « Page B »");
    assert.equal(p.summary.allSite, true);
  });

  test("isolation et droits : un modèle d'un autre site est introuvable ; sans droit d'écriture, aucune publication", async () => {
    const t = db.prepare("SELECT id FROM mk_tb_templates WHERE name = 'Pied page A'").get();
    assert.equal((await get(U(S2, `/api/modeles/${t.id}/plan-publication`))).status, 404);
    assert.equal((await post(U(S2, `/api/modeles/${t.id}/publier`), { strict: true, scope: "site" })).status, 404);
    assert.equal((await get(U(S2, `/api/modeles/${t.id}/s-applique?url=/`))).status, 404);
    assert.notEqual((await get(U(S1, `/api/modeles/${t.id}/plan-publication`), reader)).status, 200);
    assert.notEqual((await post(U(S1, `/api/modeles/${t.id}/publier`), { strict: true, scope: "site" }, reader)).status, 200);
    assert.equal(db.prepare("SELECT status FROM mk_tb_templates WHERE id = ?").get(t.id).status, "published");
  });

  test("rétro-compatibilité de l'API : publier sans « strict » fonctionne comme avant pour tous les types", async () => {
    const h = json(await post(U(S1, "/api/modeles"), { type: "header", name: "En-tête compat" })).template;
    const r = await post(U(S1, `/api/modeles/${h.id}/publier`)); assert.equal(r.status, 200, r.text.slice(0, 200));
    const f = await footer(S2, "Pied compat", {}); assert.equal((await post(U(S2, `/api/modeles/${f.id}/publier`))).status, 200);
    assert.ok(json(await get(U(S1, "/api/options"))).kinds.some((k) => k.key === "account"));
  });
});
