// Correction de parité, lot C1 — le menu RENDU d'un site a la même structure que celui du principal (vrai serveur, vraie base d'essai).
// Compare les deux menus tels qu'ils s'affichent (titres de groupe, sous-entrées, ordre, état grisé), pour l'équipe et pour des rôles limités à un site.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor, newStudent } = require("./helpers");
const nav = require("../src/marketing/web/cmsNav");

let srv, boss, db, orgId, memA, viewerA, memB, outsider, A, B;
const one = (sql, ...a) => db.prepare(sql).get(...a);
const uid = (c) => one("SELECT id FROM users WHERE email = ?", c.email).id;
const SP = "/marketing/site-web/sites";
const PR = "/marketing/site-web/principal";
const mkSite = (name) => Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens, status) VALUES (?, ?, ?, '{}', 'active')").run(orgId, name, name.toLowerCase().replace(/\W+/g, "-")).lastInsertRowid);
const navHtml = (html) => { const i = html.indexOf('class="mk-nav-list mk-cms-nav"'); return i < 0 ? "" : html.slice(i, html.indexOf("</nav>", i)); };
const text = (h) => h.replace(/<svg[\s\S]*?<\/svg>/g, "").replace(/<[^>]+>/g, " ").replace(/&#39;/g, "'").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
// Le menu rendu → [{ titre, flat, entrees:[{ libelle, grise, href }] }] dans l'ordre d'affichage
function parse(html) {
  const n = navHtml(html), out = [];
  const re = /<div class="mk-nav-group[^"]*" data-mk-group="([^"]+)">([\s\S]*?)<\/div>\s*<\/div>|<(a|span) class="mk-nav-link( is-soon)?"([^>]*)>([\s\S]*?)<\/\3>/g;
  let m;
  while ((m = re.exec(n))) {
    if (m[1]) {
      const head = /<span class="mk-nav-label">([^<]*)<\/span>/.exec(m[2])[1];
      const subs = [...m[2].matchAll(/<(a|span) class="mk-nav-sublink( is-soon)?"([^>]*)>([\s\S]*?)<\/\1>/g)].map((s) => ({ libelle: text(s[4]).replace(/ Bientôt$/, ""), grise: Boolean(s[2]), href: (/href="([^"]+)"/.exec(s[3]) || [])[1] || null }));
      out.push({ cle: m[1], titre: head.replace(/&#39;/g, "'"), flat: false, entrees: subs });
    } else out.push({ cle: null, titre: text(m[6]).replace(/ Bientôt$/, ""), flat: true, entrees: [{ libelle: text(m[6]).replace(/ Bientôt$/, ""), grise: Boolean(m[4]), href: (/href="([^"]+)"/.exec(m[5]) || [])[1] || null }] });
  }
  return out;
}
const flatLabels = (menu) => menu.filter((g) => g.cle !== "marketing").flatMap((g) => (g.flat ? [g.titre] : [`# ${g.titre}`, ...g.entrees.map((e) => e.libelle)]));

before(async () => {
  srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
  boss = await loginInstructor(srv); db = srv.db(); orgId = one("SELECT id FROM mk_organizations").id;
  A = mkSite("Site Alpha"); B = mkSite("Site Beta");
  memA = await newStudent(srv); viewerA = await newStudent(srv); memB = await newStudent(srv); outsider = await newStudent(srv);
  db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, 'editor')").run(A, uid(memA));
  db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, 'viewer')").run(A, uid(viewerA));
  db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, 'editor')").run(B, uid(memB));
});
after(() => srv.stop());

describe("C1 — le menu rendu d'un site = le menu rendu du principal", () => {
  test("équipe : mêmes titres de groupe, mêmes sous-entrées, même ordre ; seules les 4 fonctions centrales manquent et le tableau de bord est « Tableau de bord »", async () => {
    const site = parse((await boss.get(`${SP}/${A}/tableau-de-bord`)).text);
    const main = parse((await boss.get(`${PR}/tableau-de-bord`)).text);
    assert.ok(site.length >= 14 && main.length >= 14);
    const strip = (labels) => labels.filter((l) => !["Modules", "Sauvegardes", "Informations système", "Journal d'activité"].includes(l)).map((l) => (l === "Tableau de bord du site principal" ? "Tableau de bord" : l));
    assert.deepEqual(flatLabels(site), strip(flatLabels(main)));
  });
  test("les groupes Utilisateurs, Outils et Paramètres s'affichent sous LEUR titre, avec leurs sous-entrées (plus d'« Équipe du site », de « Réglages du site » en titre)", async () => {
    const site = parse((await boss.get(`${SP}/${A}/tableau-de-bord`)).text);
    const g = Object.fromEntries(site.filter((x) => !x.flat).map((x) => [x.cle, x]));
    assert.deepEqual(g.utilisateurs.entrees.map((e) => e.libelle), ["Tous les utilisateurs", "Inviter", "Rôles", "Permissions", "Invitations"]);
    assert.deepEqual(g.outils.entrees.map((e) => e.libelle), ["Santé du site", "Corbeille", "Importer", "Exporter", "Diagnostic", "Maintenance", "Caches", "Outils de contenu"]);
    assert.deepEqual(g.parametres.entrees.map((e) => e.libelle), ["Général", "Lecture", "Commentaires", "Médias", "Permaliens", "SEO", "Confidentialité", "Indexation", "Emailing", "Tunnels", "Avancé"]);
    assert.ok(!site.some((x) => /Équipe du site|Réglages du site|Design du site/.test(x.titre)), "aucun libellé propre au site en titre");
  });
  test("les entrées non ouvertes sont des éléments grisés SANS lien ; les entrées ouvertes ont toutes un lien dans le cadre du site", async () => {
    const site = parse((await boss.get(`${SP}/${A}/tableau-de-bord`)).text);
    const entries = site.flatMap((g) => g.entrees);
    assert.ok(entries.filter((e) => e.grise).length >= 33, "R8 lots 2 à 4 : médias, articles et commentaires sont ouverts ; le reste reste grisé");
    for (const e of entries) { if (e.grise) assert.equal(e.href, null, e.libelle); else assert.match(e.href, new RegExp(`^(${SP}/${A}/|${SP}$)`), e.libelle); }
  });
  test("chaque lien ouvert du menu répond 200 DANS le cadre du site (bandeau + menu) : aucun lien ne renvoie au CMS principal", async () => {
    const html = (await boss.get(`${SP}/${A}/tableau-de-bord`)).text;
    const links = [...new Set(parse(html).flatMap((g) => g.entrees).map((e) => e.href).filter(Boolean))].filter((h) => h !== SP);
    assert.ok(links.length >= 15, `liens ouverts : ${links.length}`);
    for (const h of links) {
      const r = await boss.get(h.replace(/#.*$/, ""));
      if (/\/articles\/ajouter(?:[?#]|$)/.test(h)) { assert.equal(r.status, 302, h); assert.match(r.location, /^\/formateur\/blog\/nouveau/); continue; } // ARTICLES-02 : ouvre l'éditeur
      assert.equal(r.status, 200, h);
      assert.match(r.text, /mk-site-banner-name">Site Alpha</, `${h} : bandeau du site`);
      assert.ok(navHtml(r.text).includes("Marketing du site"), `${h} : menu du site (${r.status} ${h})`);
    }
  });
  test("une entrée grisée n'ouvre rien : ni adresse « Bientôt » dans le menu, ni écran du principal, ni donnée", async () => {
    const html = navHtml((await boss.get(`${SP}/${A}/tableau-de-bord`)).text);
    for (const w of ["/utilisateurs/roles", "/outils/importer", "/parametres/lecture", `/${A}/corbeille`, "/outils/sauvegardes", "/outils/logs", "/outils/systeme", "/seo/analyse"]) assert.ok(!html.includes(w), w);
    assert.ok(!/href="\/marketing\/site-web\/(?!sites)/.test(html), "aucun lien vers l'administration du site principal");
  });
  test("rôles limités à un site : même ordre de groupes, sous-ensemble selon les permissions, jamais un lien vers un autre site", async () => {
    const full = flatLabels(parse((await boss.get(`${SP}/${A}/tableau-de-bord`)).text));
    for (const [who, name] of [[memA, "éditeur"], [viewerA, "lecteur"]]) {
      const html = (await who.get(`${SP}/${A}/tableau-de-bord`)).text;
      const m = parse(html);
      assert.ok(m.length >= 3, name);
      const order = flatLabels(m).filter((l) => full.includes(l));
      let at = -1; for (const l of order) { const i = full.indexOf(l, at + 1); assert.ok(i > at, `${name} : ordre de ${l}`); at = i; }
      assert.ok(!navHtml(html).includes(`${SP}/${B}/`), `${name} : aucun lien vers le site B`);
      for (const e of m.flatMap((g) => g.entrees).filter((x) => x.href && x.href !== SP)) { const r = await who.get(e.href.replace(/#.*$/, "")); assert.equal(r.status, /\/articles\/ajouter(?:[?#]|$)/.test(e.href) ? 302 : 200, `${name} : ${e.href}`); } // ARTICLES-02 : « Ajouter un article » ouvre l'éditeur (302)
    }
    assert.ok((await memA.get(`${SP}/${B}/tableau-de-bord`)).status >= 403, "éditeur de A refusé sur B");
    assert.ok([403, 404].includes((await outsider.get(`${SP}/${A}/tableau-de-bord`)).status), "sans accès refusé");
  });
  test("site principal : son menu garde les 67 entrées du registre et ses adresses historiques (régression)", async () => {
    const m = parse((await boss.get(`${PR}/tableau-de-bord`)).text);
    const entries = m.flatMap((g) => g.entrees);
    assert.equal(entries.length, 67 + 1 + 10); // 66 entrées du registre (« Mes sites » est le gestionnaire central) ; R8 lot 6D : + « Importer des contacts » dans Marketing
    assert.ok(entries.every((e) => !e.grise && e.href));
    for (const reg of nav.ALL.filter((i) => i.key !== "sites" && i.key !== "sitedash")) assert.ok(entries.some((e) => e.href === reg.href), reg.href);
    assert.ok(entries.some((e) => e.href === `${PR}/tableau-de-bord`));
  });
});
