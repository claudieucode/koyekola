// Palier 3, B1 — espace d'administration d'UN site : « Ouvrir », menu, bandeau, isolation des données, accès croisé (IDOR),
// modules « Bientôt », site principal, compatibilité des anciennes adresses, aucune écriture ni migration — par les vraies routes
// d'un vrai serveur et la vraie base (aucune donnée de démonstration : tout est créé ici, dans une base d'essai).
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const nav = require("../src/marketing/web/cmsNav");
const fs = require("fs");
const path = require("path");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, Client, loginInstructor, newStudent } = require("./helpers");

let srv, boss, db, orgId, memA, memB, outsider, anon;
let A, B, C;
const one = (sql, ...a) => db.prepare(sql).get(...a);
const uid = (c) => one("SELECT id FROM users WHERE email = ?", c.email).id;
const SP = "/marketing/site-web/sites";
const PR = "/marketing/site-web/principal";
const mkSite = (name, status = "active") => Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens, status) VALUES (?, ?, ?, '{}', ?)").run(orgId, name, name.toLowerCase().replace(/\W+/g, "-"), status).lastInsertRowid);
const mkPage = (site, name, status = "draft") => Number(db.prepare("INSERT INTO mk_landing_pages (organization_id, name, slug, title, status, site_id) VALUES (?, ?, ?, ?, ?, ?)").run(orgId, name, `esp-${name.toLowerCase().replace(/\W+/g, "-")}`, name, status, site).lastInsertRowid);
const mkComp = (site, name) => Number(db.prepare("INSERT INTO mk_web_components (organization_id, site_id, name, section) VALUES (?, ?, ?, ?)").run(orgId, site, name, JSON.stringify({ type: "text", title: name, body: "x" })).lastInsertRowid);
const mkRedirect = (site, from) => db.prepare("INSERT INTO seo_redirects (source_path, target, status, enabled, site_id) VALUES (?, '/ailleurs', 301, 1, ?)").run(from, site);
const MODULES_LIVE = ["tableau-de-bord", "pages", "composants", "redirections", "reglages"];
const MODULES_SOON = ["modeles"]; // R8 lot 2 : articles, catégories, commentaires et médias sont ouverts (voir menu-site-inventaire)

before(async () => {
  srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
  boss = await loginInstructor(srv);
  anon = new Client(srv.base);
  db = srv.db();
  orgId = one("SELECT id FROM mk_organizations").id;
  A = mkSite("Site Alpha"); B = mkSite("Site Beta"); C = mkSite("Site Charlie", "archived");
  mkPage(A, "Page Alpha", "published"); mkPage(B, "Page Beta"); mkPage(null, "Page Principale"); mkPage(C, "Page Charlie");
  mkComp(A, "Comp Alpha"); mkComp(B, "Comp Beta"); mkComp(null, "Comp Global");
  mkRedirect(A, "/ancien-alpha"); mkRedirect(B, "/ancien-beta"); mkRedirect(null, "/ancien-principal");
  memA = await newStudent(srv); memB = await newStudent(srv); outsider = await newStudent(srv);
  db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, 'editor')").run(A, uid(memA));
  db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, 'editor')").run(B, uid(memB));
});
after(() => srv.stop());

describe("1 — « Ouvrir » mène à l'espace du site (unitaires + intégration)", () => {
  test("la liste « Mes sites » ouvre l'espace, l'ancienne adresse y redirige", async () => {
    const list = (await boss.get(SP)).text;
    assert.match(list, new RegExp(`href="${SP}/${A}/tableau-de-bord">Ouvrir`));
    const r = await boss.get(`${SP}/${A}`);
    assert.equal(r.status, 302);
    assert.equal(r.location, `${SP}/${A}/tableau-de-bord`);
  });
  test("le tableau de bord montre le bandeau d'identité, le menu du site et des chiffres du site", async () => {
    const r = await boss.get(`${SP}/${A}/tableau-de-bord`);
    assert.equal(r.status, 200);
    assert.match(r.text, /Vous êtes dans le site/);
    assert.match(r.text, /<strong class="mk-site-banner-name">Site Alpha<\/strong>/);
    assert.match(r.text, /<title>Tableau de bord · Site Alpha · CMS · KOLAKISA<\/title>/);
    for (const m of ["pages", "composants", "redirections", "reglages"]) assert.match(r.text, new RegExp(`href="${SP}/${A}/${m}`), `menu : ${m}`);
    // R8 lot 2 : Articles, Médias et Commentaires sont OUVERTS (liens dans le cadre du site) ; Navigation et SEO restent visibles mais grisés « Bientôt » (aucun lien)
    for (const m of ["articles", "medias", "commentaires"]) assert.match(r.text, new RegExp(`href="${SP}/${A}/${m}"`), `${m} : lien ouvert`);
    assert.match(r.text, new RegExp(`href="${SP}/${A}/navigation"`), "navigation : lien ouvert (R8 lot 4)");
    for (const m of ["modeles"]) assert.doesNotMatch(r.text, new RegExp(`href="${SP}/${A}/${m}"`), `${m} : pas de lien`); // R8 lot 6C : « seo » est ouvert
    assert.match(r.text, /is-soon" aria-disabled="true" title="Meta \(bientôt\)"/);
    assert.match(r.text, /Pages en ligne/);
  });
  test("chaque module disponible répond 200 pour l'équipe, avec le bandeau du bon site", async () => {
    for (const m of MODULES_LIVE) {
      const r = await boss.get(`${SP}/${A}/${m}`);
      assert.equal(r.status, 200, m);
      assert.match(r.text, /<strong class="mk-site-banner-name">Site Alpha<\/strong>/, m);
    }
  });
  test("un module inconnu est une vraie 404", async () => {
    assert.equal((await boss.get(`${SP}/${A}/nimporte-quoi`)).status, 404);
    assert.equal((await boss.get(`${PR}/nimporte-quoi`)).status, 404);
  });
});

describe("2 — isolation des données entre sites", () => {
  test("pages : chaque espace ne montre que les pages de son site", async () => {
    const a = (await boss.get(`${SP}/${A}/pages`)).text, b = (await boss.get(`${SP}/${B}/pages`)).text, p = (await boss.get(`${PR}/pages`)).text;
    assert.match(a, /Page Alpha/); assert.doesNotMatch(a, /Page Beta|Page Principale|Page Charlie/);
    assert.match(b, /Page Beta/); assert.doesNotMatch(b, /Page Alpha|Page Principale/);
    assert.match(p, /Page Principale/); assert.doesNotMatch(p, /Page Alpha|Page Beta|Page Charlie/);
  });
  test("composants : ceux du site + les composants globaux, jamais ceux d'un autre site", async () => {
    const a = (await boss.get(`${SP}/${A}/composants`)).text;
    assert.match(a, /Comp Alpha/); assert.match(a, /Comp Global/); assert.doesNotMatch(a, /Comp Beta/);
  });
  test("redirections : propres au site", async () => {
    const a = (await boss.get(`${SP}/${A}/redirections`)).text, p = (await boss.get(`${PR}/redirections`)).text;
    assert.match(a, /ancien-alpha/); assert.doesNotMatch(a, /ancien-beta|ancien-principal/);
    assert.match(p, /ancien-principal/); assert.doesNotMatch(p, /ancien-alpha|ancien-beta/);
  });
  test("équipe : seules les personnes du site", async () => {
    const a = (await boss.get(`${SP}/${A}/equipe`)).text;
    assert.match(a, new RegExp(one("SELECT username FROM users WHERE id = ?", uid(memA)).username));
    assert.doesNotMatch(a, new RegExp(one("SELECT username FROM users WHERE id = ?", uid(memB)).username));
  });
  test("tableau de bord : les chiffres sont ceux du site (1 page en ligne pour Alpha, 0 pour Beta)", async () => {
    const num = (html, label) => Number((html.match(new RegExp(`${label}</span><span class="mk-stat-value">(\\d+)`)) || [])[1]);
    assert.equal(num((await boss.get(`${SP}/${A}/tableau-de-bord`)).text, "Pages en ligne"), 1);
    assert.equal(num((await boss.get(`${SP}/${B}/tableau-de-bord`)).text, "Pages en ligne"), 0);
  });
  test("un site forgé dans l'adresse (?site=), un en-tête ou un champ est ignoré : le site vient du chemin", async () => {
    const forged = (await boss.get(`${SP}/${A}/pages?site=${B}&site_id=${B}`, { "X-Site": String(B) })).text;
    assert.match(forged, /Page Alpha/); assert.doesNotMatch(forged, /Page Beta/);
    const forgedPrincipal = (await boss.get(`${PR}/pages?site=${A}`)).text;
    assert.doesNotMatch(forgedPrincipal, /Page Alpha/);
  });
  test("le changement de site ne garde aucun état : A puis B puis A", async () => {
    assert.match((await boss.get(`${SP}/${A}/pages`)).text, /Page Alpha/);
    assert.doesNotMatch((await boss.get(`${SP}/${B}/pages`)).text, /Page Alpha/);
    assert.match((await boss.get(`${SP}/${A}/pages`)).text, /Page Alpha/);
  });
});

describe("3 — sécurité intersites (IDOR) et droits", () => {
  const ALL = [...MODULES_LIVE, ...MODULES_SOON, "equipe"];
  test("un rôle limité au site A n'ouvre aucun module du site B ni du site principal", async () => {
    for (const m of ALL) {
      for (const base of [`${SP}/${B}`, PR]) {
        const r = await memA.get(`${base}/${m}`);
        assert.equal(r.status, 403, `${base}/${m}`);
        assert.doesNotMatch(r.text, /Page Beta|Page Principale|Site Beta/, `fuite sur ${base}/${m}`);
      }
    }
  });
  test("un site inexistant ou d'un autre est refusé de la même façon (aucune révélation)", async () => {
    const other = await memA.get(`${SP}/${B}/pages`);
    const none = await memA.get(`${SP}/987654/pages`);
    assert.equal(other.status, none.status);
    assert.equal((await boss.get(`${SP}/987654/pages`)).status, 404);
  });
  test("le rôle du site A ouvre son espace, avec ses seuls modules, et ne voit ni Beta ni le principal dans le sélecteur", async () => {
    const r = await memA.get(`${SP}/${A}/tableau-de-bord`);
    assert.equal(r.status, 200);
    assert.match(r.text, /Site Alpha/);
    assert.doesNotMatch(r.text, /Site Beta|Site Charlie/);
    assert.doesNotMatch(r.text, new RegExp(`${PR}/tableau-de-bord`), "le site principal n'est pas proposé");
    assert.doesNotMatch(r.text, /Gérer les sites/);
    const pages = (await memA.get(`${SP}/${A}/pages`)).text;
    assert.match(pages, /Page Alpha/); assert.doesNotMatch(pages, /Page Beta|Page Principale/);
  });
  test("visiteur → connexion ; compte sans accès → refusé", async () => {
    const r = await anon.get(`${SP}/${A}/pages`);
    assert.equal(r.status, 302); assert.match(r.location, /^\/connexion/);
    assert.equal((await anon.get(`${PR}/pages`)).status, 302);
    assert.notEqual((await outsider.get(`${SP}/${A}/pages`)).status, 200);
    assert.notEqual((await outsider.get(`${PR}/tableau-de-bord`)).status, 200);
  });
  test("création de page : depuis l'espace A elle est rattachée à A ; vers B elle est refusée", async () => {
    const ok = await memA.post("/marketing/pages", { name: "Nouvelle Alpha", site_id: String(A) });
    assert.ok(ok.status === 302 || ok.status === 200);
    assert.equal(one("SELECT site_id FROM mk_landing_pages WHERE name = 'Nouvelle Alpha'").site_id, A);
    const bad = await memA.post("/marketing/pages", { name: "Pirate", site_id: String(B) });
    assert.equal(bad.status, 403);
    assert.equal(one("SELECT COUNT(*) n FROM mk_landing_pages WHERE name = 'Pirate'").n, 0);
  });
  test("l'espace d'un site n'offre aucune écriture par GET (aucune ligne modifiée)", async () => {
    const snap = () => JSON.stringify(["mk_landing_pages", "mk_web_components", "seo_redirects", "mk_sites", "mk_site_members", "mk_lists", "mk_campaigns"].map((t) => one(`SELECT COUNT(*) n, COALESCE(MAX(rowid), 0) m FROM ${t}`)));
    const before_ = snap();
    for (const base of [`${SP}/${A}`, `${SP}/${B}`, PR]) for (const m of [...MODULES_LIVE, ...MODULES_SOON]) await boss.get(`${base}/${m}`);
    assert.equal(snap(), before_);
  });
});

describe("4 — modules « Bientôt » : aucune donnée, aucune action simulée", () => {
  test("chaque module des paliers suivants est identifié et vide", async () => {
    for (const m of MODULES_SOON) {
      const r = await boss.get(`${SP}/${A}/${m}`);
      assert.equal(r.status, 200, m);
      assert.match(r.text, /Prochain palier/, m);
      assert.match(r.text, /aucune donnée d(?:'|&#39;)un autre site n(?:'|&#39;)est montrée/, m);
      const main = (r.text.match(/<main[\s\S]*<\/main>/) || [""])[0];
      assert.ok(main.length > 100, `${m} : contenu principal trouvé`);
      assert.doesNotMatch(main, /Page Beta|Page Principale|Comp Beta|<table/, `${m} ne montre aucune donnée`);
      assert.doesNotMatch(main, /<form|<button(?![^>]*disabled)/, `${m} n'offre aucune action`);
    }
  });
  test("le menu signale « Bientôt » pour ces modules", async () => {
    const html = (await boss.get(`${SP}/${A}/tableau-de-bord`)).text;
    // C1 : toutes les entrées du registre non encore ouvertes à un site sont visibles, grisées, sans lien ; leur nombre est celui de la projection
    const space = { siteId: A, principal: false, base: `${SP}/${A}`, name: "Site Alpha", listHref: "/marketing/site-web/sites" };
    const soon = nav.projectSections(space).flatMap((x) => x.items).filter((i) => i.disabled).length;
    assert.equal((html.match(/mk-cms-tag[^>]*>Bientôt/g) || []).length, soon);
    assert.equal(soon, 29, "Confidentialité ouverte (−1) ; R8 lots 2 à 6 : 53 − 15 (articles, médias, commentaires) − 1 (formulaires) − 2 (navigation, menus) − 2 (SEO du site, erreurs 404) − 3 (Styles, Patterns et Templates, Apparence)");
  });
});

describe("5 — site principal : même espace, adresses historiques conservées", () => {
  test("l'équipe ouvre l'espace du site principal", async () => {
    const r = await boss.get(`${PR}/tableau-de-bord`);
    assert.equal(r.status, 200);
    assert.match(r.text, /<strong class="mk-site-banner-name">Site principal<\/strong>/);
    assert.equal((await boss.get(PR)).status, 302);
  });
  test("ses modules déjà existants pointent vers les écrans historiques, qui répondent toujours", async () => {
    const html = (await boss.get(`${PR}/tableau-de-bord`)).text;
    for (const href of ["/marketing/site-web/articles", "/marketing/site-web/mediatheque", "/marketing/formulaires", "/marketing/contacts"]) assert.match(html, new RegExp(`href="${href}"`), href);
    for (const old of ["/marketing/site-web", "/marketing/pages", "/marketing/site-web/sites", "/marketing/site-web/articles", "/marketing/site-web/mediatheque", "/marketing/formulaires", "/marketing/contacts"]) {
      assert.equal((await boss.get(old)).status, 200, old);
    }
  });
  test("un site archivé : bandeau explicite, aucune création de page", async () => {
    const r = (await boss.get(`${SP}/${C}/pages`)).text;
    assert.match(r, /Archivé/);
    assert.match(r, /aucune création n(?:'|&#39;)est possible/);
    assert.doesNotMatch(r, /id="nouvelle"/);
    assert.match((await boss.get(`${SP}/${A}/pages`)).text, /id="nouvelle"/);
  });
});

describe("audit des sites : libellé clair", () => {
  test("les comptages qui se recouvrent sont expliqués (actifs / archivés / corbeille)", async () => {
    const html = (await boss.get("/formateur/gestion/sauvegardes/audit-sites?source=active")).text;
    assert.match(html, /\d+ sites? au total : <strong>\d+ actifs?<\/strong>, \d+ archivés?/);
    assert.match(html, /archivés incluent donc ceux de la corbeille/);
    assert.doesNotMatch(html, /dont \d+ archivés? et \d+ supprimés?/);
  });
});

describe("6 — aucune migration, aucun changement de structure", () => {
  test("le dossier des migrations s'arrête à 098 (098 = imports de templates par site, Apparence → Templates ; 097 = widgets par site, Apparence → Widgets ; 096 = personnalisateur : brouillons et versions par site, Apparence → Personnaliser ; 095 = polices par site, Apparence → Polices ; 094 = thèmes par site, Apparence → Thèmes ; 093 = modèles de pages privés à leur site, site builder ; 092 = réservée à la migration manuelle R9-3, hors dossier ; 091 = imports par site et 090 = SEO par site, R8 lot 6A ; 089 = revenus par site, R7 lot 6.5 ; 088 = score par site, R7 lot 6.4 ; 087 = réseaux sociaux par site, R7 lot 6.3 ; 086 = IA par site, R7 lot 6.2 ; 085 = SMS par site, R7 lot 6.1 ; 084 = modules par site, R7 lot 6.0 ; 083 = demandes de rattachement de contacts, R7 lot 5 ; 082 = journal d'audit par site, R7 lot 4 ; 081 = formulaires par site, R7 lot 2 ; 080 = contacts par site, R7 lot 1 ; 079 = index des médias par site, lot 7C ; 075 = R6 lot 1 ; 072, 073 et 074 = R2, R3 et R5 ; 076 à 078 réservées aux reconstructions)", () => {
    const files = fs.readdirSync(path.join(__dirname, "..", "src", "marketing", "migrations")).filter((f) => /^\d+_/.test(f)).sort();
    assert.match(files[files.length - 1], /^098_/);
    assert.ok(!files.some((f) => /^07[678]_/.test(f)), "076 à 078 restent réservées aux reconstructions");
  });
  test("le schéma de la base ne change pas en parcourant l'espace", async () => {
    const schema = () => JSON.stringify(db.prepare("SELECT type, name, sql FROM sqlite_master ORDER BY type, name").all());
    const before_ = schema();
    for (const m of [...MODULES_LIVE, ...MODULES_SOON]) await boss.get(`${SP}/${A}/${m}`);
    assert.equal(schema(), before_);
  });
});
