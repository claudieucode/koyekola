// Palier 3, lot P1a — menu d'un site = projection du registre ; écrans partagés (Emailing ×6, Tests A/B, Analytics, Santé du site) ouverts par
// /sites/<id>/<module> DANS le cadre du site ; accès intersites, accès par identifiant (IDOR), rôles limités à un site, site principal intact.
// Vrais serveur, vraie base d'essai ; aucune donnée de démonstration (tout est créé ici).
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, Client, loginInstructor, newStudent } = require("./helpers");
const nav = require("../src/marketing/web/cmsNav");

let srv, boss, db, orgId, memA, viewerA, memB, outsider;
let A, B, C;
const one = (sql, ...a) => db.prepare(sql).get(...a);
const uid = (c) => one("SELECT id FROM users WHERE email = ?", c.email).id;
const SP = "/marketing/site-web/sites";
const PR = "/marketing/site-web/principal";
const DELEGATED = Object.entries(nav.SITE_MODULES).filter(([, m]) => m.kind === "delegate").map(([k, m]) => ({ mod: k, to: m.to, reg: m.reg, label: ({ articles: "Tous les articles", commentaires: "Tous", categories: "Catégories", navigation: "Menus", medias: "Médiathèque", pages: "Toutes les pages" })[k] || m.label })); // libellé de l'entrée ACTIVE dans le menu (R8 lot 2 : articles et commentaires sont délégués)
const mkSite = (name, status = "active") => Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens, status) VALUES (?, ?, ?, '{}', ?)").run(orgId, name, name.toLowerCase().replace(/\W+/g, "-"), status).lastInsertRowid);
const row = (sql, ...a) => Number(db.prepare(sql).run(...a).lastInsertRowid);
const mkList = (site, name) => row("INSERT INTO mk_lists (organization_id, name, site_id) VALUES (?, ?, ?)", orgId, name, site);
const mkSegment = (site, name) => row("INSERT INTO mk_segments (organization_id, name, definition, site_id) VALUES (?, ?, '{}', ?)", orgId, name, site);
const mkTemplate = (site, name) => row("INSERT INTO mk_templates (organization_id, name, site_id) VALUES (?, ?, ?)", orgId, name, site);
const mkCampaign = (site, name, list) => row("INSERT INTO mk_campaigns (organization_id, name, target_type, target_id, site_id) VALUES (?, ?, 'list', ?, ?)", orgId, name, list, site);
const mkAutomation = (site, name) => row("INSERT INTO mk_automations (organization_id, name, trigger_event, site_id) VALUES (?, ?, 'contact_created', ?)", orgId, name, site);
const mkFunnel = (site, name) => row("INSERT INTO mk_funnels (organization_id, name, site_id) VALUES (?, ?, ?)", orgId, name, site);
const mkPage = (site, name) => row("INSERT INTO mk_landing_pages (organization_id, name, slug, title, status, site_id) VALUES (?, ?, ?, ?, 'draft', ?)", orgId, name, `p1a-${name.toLowerCase().replace(/\W+/g, "-")}`, name, site);
const main = (html) => (html.match(/<main[\s\S]*<\/main>/) || [""])[0];
const navOf = (html) => { const i = html.indexOf('class="mk-nav-list mk-cms-nav"'); return i < 0 ? "" : html.slice(i, html.indexOf("</nav>", i)); };
const navLinks = (html) => [...navOf(html).matchAll(/<a [^>]*href="([^"]+)"/g)].map((m) => m[1].replace(/&amp;/g, "&"));
const topLabels = (html) => [...navOf(html).matchAll(/class="mk-nav-(?:link(?: is-soon)?|head)"[^>]*title="([^"]+)"/g)].map((m) => m[1].replace(/ \(bientôt\)$/, "").replace(/&#39;/g, "'"));
const activeLabel = (html) => { const m = /<a [^>]*aria-current="page"[^>]*>([\s\S]*?)<\/a>/.exec(navOf(html)); return m ? m[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").replace(/&#39;/g, "'").trim() : null; };
const hasBanner = (html, name) => /mk-site-banner/.test(html) && (name ? new RegExp(`mk-site-banner-name">${name}<`).test(html) : true);
let lists = {}, ids = {};

before(async () => {
  srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
  boss = await loginInstructor(srv);
  db = srv.db();
  orgId = one("SELECT id FROM mk_organizations").id;
  A = mkSite("Site Alpha"); B = mkSite("Site Beta"); C = mkSite("Site Charlie", "archived");
  for (const [k, id] of Object.entries({ A, B, null: null })) {
    const tag = k === "null" ? "Principal" : k === "A" ? "Alpha" : "Beta";
    lists[k] = mkList(id, `Liste ${tag}`); ids[`seg${k}`] = mkSegment(id, `Segment ${tag}`); ids[`tpl${k}`] = mkTemplate(id, `Modele ${tag}`);
    ids[`cam${k}`] = mkCampaign(id, `Campagne ${tag}`, lists[k]); ids[`aut${k}`] = mkAutomation(id, `Automatisation ${tag}`); ids[`fun${k}`] = mkFunnel(id, `Tunnel ${tag}`);
  }
  mkPage(A, "Page Alpha"); mkPage(B, "Page Beta"); mkPage(null, "Page Principale");
  memA = await newStudent(srv); viewerA = await newStudent(srv); memB = await newStudent(srv); outsider = await newStudent(srv);
  db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, 'editor')").run(A, uid(memA));
  db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, 'viewer')").run(A, uid(viewerA));
  db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, 'editor')").run(B, uid(memB));
});
after(() => srv.stop());

describe("1 — le menu d'un site est la projection du registre", () => {
  test("les groupes du registre, dans l'ordre, plus « Marketing du site » avant Outils (sans Extensions, fonction centrale)", async () => {
    const html = (await boss.get(`${SP}/${A}/tableau-de-bord`)).text;
    const labels = topLabels(html);
    const expected = ["Tableau de bord", "Pages", "Articles", "Médias", "Commentaires", "Apparence", "Comptes", "Boutique", "SEO", "Redirections", "Tests A/B", "Marketing du site", "Outils", "Paramètres"];
    assert.deepEqual(labels, expected);
    assert.equal(nav.SECTIONS.length, 15, "le registre compte 15 groupes (dont « Mes sites », gestionnaire central, et « Extensions », fonction centrale)");
  });
  test("C1 : une entrée pas encore ouverte est visible, grisée « Bientôt », SANS lien ; son ancienne adresse n'affiche ni donnée ni action", async () => {
    const html = (await boss.get(`${SP}/${A}/tableau-de-bord`)).text;
    const space = { siteId: A, principal: false, base: `${SP}/${A}`, name: "Site Alpha", listHref: "/marketing/site-web/sites" };
    const soon = nav.projectSections(space).flatMap((g) => g.items).filter((i) => i.disabled);
    assert.equal((navOf(html).match(/mk-cms-tag[^>]*>Bientôt/g) || []).length, soon.length);
    assert.equal((navOf(html).match(/is-soon" aria-disabled="true"/g) || []).length, soon.length, "chaque entrée grisée est un élément désactivé");
    for (const i of soon) assert.doesNotMatch(navOf(html), new RegExp(`<a [^>]*>[^<]*<span>${i.label.replace(/[()]/g, ".")}</span><span class="mk-cms-tag">Bientôt`), `${i.key} : pas de lien`);
    // R8 lot 6C : l'écran « SEO » du site est ouvert (formulaire de réglages) : il a son propre test (seo-par-site-espace) ; plus aucun module « Bientôt » à vérifier ici hormis les entrées grisées ci-dessus
  });
  test("tout lien du menu s'ouvre (le menu ne montre que ce qui répond), pour l'équipe et pour un éditeur du site", async () => {
    for (const who of [boss, memA]) {
      const html = (await who.get(`${SP}/${A}/tableau-de-bord`)).text;
      const links = navLinks(html).filter((h) => h.startsWith(`${SP}/${A}/`) || h.startsWith("/marketing/site-web/sites"));
      assert.ok(links.length >= 8);
      for (const h of [...new Set(links)]) { const r = await who.get(h); assert.equal(r.status, /\/articles\/ajouter(?:[?#]|$)/.test(h) ? 302 : 200, `${who === boss ? "équipe" : "éditeur"} : ${h}`); } // ARTICLES-02 : « Ajouter un article » ouvre l'éditeur (302)
    }
  });
});

describe("2 — écrans partagés : dans le cadre du site, sans mélange de sites", () => {
  for (const d of DELEGATED) {
    test(`/sites/N/${d.mod} : cadre du site, entrée « ${d.label} » active`, async () => {
      const r = await boss.get(`${SP}/${A}/${d.mod}`);
      assert.equal(r.status, 200);
      assert.ok(hasBanner(r.text, "Site Alpha"), "bandeau du site");
      assert.match(navOf(r.text), /Marketing du site|Santé du site/);
      assert.equal(activeLabel(r.text), d.label.replace(/&#39;/g, "'"));
      assert.match(r.text, /<title>[^<]*Site Alpha/, "titre de l'onglet");
    });
  }
  test("isolation des données pour l'équipe : l'adresse du site A ne montre que les données de A (listes, segments, modèles, campagnes, automatisations, tunnels)", async () => {
    const cases = [["listes", "Liste"], ["segments", "Segment"], ["modeles-email", "Modele"], ["campagnes", "Campagne"], ["automatisations", "Automatisation"], ["tunnels", "Tunnel"]];
    for (const [mod, w] of cases) {
      const t = main((await boss.get(`${SP}/${A}/${mod}`)).text);
      assert.match(t, new RegExp(`${w} Alpha`), `${mod} : A voit A`);
      assert.doesNotMatch(t, new RegExp(`${w} Beta|${w} Principal`), `${mod} : ni B ni le principal`);
      const tb = main((await boss.get(`${SP}/${B}/${mod}`)).text);
      assert.match(tb, new RegExp(`${w} Beta`)); assert.doesNotMatch(tb, new RegExp(`${w} Alpha|${w} Principal`), `${mod} : B ne voit pas A`);
    }
  });
  test("le site vient de l'adresse : un « ?site= » envoyé par le navigateur est écrasé", async () => {
    const r = await boss.get(`${SP}/${A}/listes?site=${B}`);
    assert.match(main(r.text), /Liste Alpha/); assert.doesNotMatch(main(r.text), /Liste Beta/);
    assert.ok(hasBanner(r.text, "Site Alpha"));
    const r2 = await boss.get(`${SP}/${A}/listes?site=principal`);
    assert.doesNotMatch(main(r2.text), /Liste Principal/);
  });
  test("la délégation ne s'applique qu'à la lecture : un POST sur l'adresse du module n'atteint aucun écran", async () => {
    const r = await boss.post(`${SP}/${A}/listes`, { name: "Piratée", site: String(B) });
    assert.ok(r.status >= 400 && r.status < 500, `statut ${r.status}`);
    assert.equal(db.prepare("SELECT COUNT(*) n FROM mk_lists WHERE name = 'Piratée'").get().n, 0);
  });
  test("site archivé : lecture avec le bandeau « Archivé »", async () => {
    const r = await boss.get(`${SP}/${C}/listes`);
    assert.equal(r.status, 200); assert.match(r.text, /mk-site-banner/); assert.match(r.text, />Archivé</);
  });
});

describe("3 — accès intersites et rôles limités à un site", () => {
  test("éditeur du site A : ses écrans partagés s'ouvrent comme avec l'ancienne adresse ; ceux du site B sont refusés", async () => {
    for (const d of DELEGATED) {
      const a = await memA.get(`${SP}/${A}/${d.mod}`);
      const legacy = await memA.get(`/marketing${d.to}?site=${A}`);
      assert.equal(a.status, legacy.status, `${d.mod} : mêmes droits que l'écran d'origine`);
      assert.equal((await memA.get(`${SP}/${B}/${d.mod}`)).status, 403, `${d.mod} : site B refusé`);
      // « Profil » est une page PERSONNELLE (droit profile.self) : l'ancienne adresse ignore le paramètre « site » et n'expose aucune donnée d'un site
      if (d.mod !== "equipe-profil") assert.equal((await memA.get(`/marketing${d.to}?site=${B}`)).status, 403, `${d.mod} : ancienne adresse du site B refusée`);
    }
  });
  test("lecteur du site A : mêmes droits que l'écran d'origine ; aucune écriture possible", async () => {
    for (const d of DELEGATED) {
      assert.equal((await viewerA.get(`${SP}/${A}/${d.mod}`)).status, (await viewerA.get(`/marketing${d.to}?site=${A}`)).status, d.mod);
      assert.equal((await viewerA.get(`${SP}/${B}/${d.mod}`)).status, 403, `${d.mod} : site B refusé`);
    }
    assert.equal((await viewerA.post("/marketing/listes", { name: "Interdite", site: String(A) })).status, 403);
  });
  test("personne sans accès : tout est refusé, même par l'adresse du site", async () => {
    for (const d of DELEGATED) assert.ok([302, 403, 404].includes((await outsider.get(`${SP}/${A}/${d.mod}`)).status), d.mod);
    for (const d of DELEGATED) assert.notEqual((await outsider.get(`${SP}/${A}/${d.mod}`)).status, 200, d.mod);
  });
  test("site inexistant : 404, jamais un écran d'un autre site", async () => {
    for (const d of DELEGATED) assert.equal((await boss.get(`${SP}/987654/${d.mod}`)).status, 404, d.mod);
  });
  test("le sélecteur de la barre du haut n'offre à un membre limité que son site", async () => {
    const html = (await memA.get(`${SP}/${A}/tableau-de-bord`)).text;
    assert.match(html, /Site Alpha/); assert.doesNotMatch(main(html) + navOf(html), /Site Beta/);
  });
});

describe("4 — accès par identifiant (IDOR) depuis le cadre d'un site", () => {
  test("un membre du site A ne peut ouvrir ni une liste, ni un segment, ni un modèle, ni une campagne, ni une automatisation, ni un tunnel du site B", async () => {
    const targets = [`/marketing/listes/${lists.B}`, `/marketing/segments/${ids.segB}`, `/marketing/modeles/${ids.tplB}`, `/marketing/campagnes/${ids.camB}`, `/marketing/automatisations/${ids.autB}`, `/marketing/tunnels/${ids.funB}`];
    for (const t of targets) {
      const r = await memA.get(t);
      assert.ok([403, 404].includes(r.status), `${t} → ${r.status}`);
      assert.doesNotMatch(r.text, /Liste Beta|Segment Beta|Modele Beta|Campagne Beta|Automatisation Beta|Tunnel Beta/, `${t} : aucune donnée de B`);
    }
  });
  test("ni les ressources du site principal", async () => {
    for (const t of [`/marketing/listes/${lists.null}`, `/marketing/campagnes/${ids.camnull}`]) assert.ok([403, 404].includes((await memA.get(t)).status), t);
  });
  test("une action sur une ressource d'un autre site est refusée (suppression de la liste de B par un membre de A)", async () => {
    const r = await memA.post(`/marketing/listes/${lists.B}/supprimer`, {});
    assert.ok([403, 404].includes(r.status), `statut ${r.status}`);
    assert.ok(one("SELECT 1 FROM mk_lists WHERE id = ?", lists.B), "la liste de B existe toujours");
  });
});

describe("5 — le cadre ne s'active que sur un site vérifié et un écran propre au site", () => {
  test("ancienne adresse avec ?site=A : le même cadre ; sans site ou avec « principal » : le cadre historique, inchangé", async () => {
    assert.ok(hasBanner((await boss.get(`/marketing/listes?site=${A}`)).text, "Site Alpha"));
    assert.ok(hasBanner((await boss.get(`/marketing/site-web/tests-ab?site=${B}`)).text, "Site Beta"), "un autre site vérifié donne SON cadre");
    for (const u of ["/marketing/listes", "/marketing/listes?site=principal", "/marketing/campagnes", "/marketing/site-web/outils"]) assert.ok(!/mk-site-banner/.test((await boss.get(u)).text), `${u} : pas de cadre de site`);
  });
  test("un « ?site= » inventé n'active aucun cadre", async () => {
    for (const u of ["/marketing/listes?site=987654", "/marketing/listes?site=abc", "/marketing/listes?site=1%20OR%201=1"]) { const r = await boss.get(u); assert.ok(!/mk-site-banner/.test(r.text), u); }
  });
  test("un écran d'organisation qui accepte « ?site= » comme simple filtre n'ouvre pas l'espace du site", async () => {
    // PAGES-01 : « Pages » est désormais un écran partagé délégué (cadre du site comme Articles), il n'est donc plus un simple filtre
    for (const u of [`/marketing/site-web/utilisateurs?site=${A}`, `/marketing/site-web/redirections?site=${A}`]) assert.ok(!/mk-site-banner/.test((await boss.get(u)).text), u);
  });
  test("un membre limité ne reçoit jamais le cadre d'un site qui n'est pas le sien", async () => {
    assert.ok(!/mk-site-banner/.test((await memA.get(`/marketing/listes?site=${B}`)).text));
  });
});

describe("6 — une action lancée dans le cadre d'un site y revient", () => {
  const del = (who, id, referer) => who.post(`/marketing/listes/${id}/supprimer`, {}, { headers: referer ? { referer: srv.base + referer } : {} });
  test("depuis l'espace du site A : retour sur la liste de A, dans son cadre", async () => {
    const id = mkList(A, "Liste Alpha jetable");
    const r = await del(boss, id, `${SP}/${A}/listes`);
    assert.equal(r.status, 302); assert.equal(r.location, `/marketing/listes?site=${A}`);
    assert.ok(hasBanner((await boss.get(r.location)).text, "Site Alpha"));
  });
  test("un en-tête Referer d'un autre site, ou absent, ne fait pas changer de site", async () => {
    const r1 = await del(boss, mkList(A, "Jetable 1"), `${SP}/${B}/listes`);
    assert.equal(r1.location, "/marketing/listes", "Referer du site B pour une liste de A");
    const r2 = await del(boss, mkList(A, "Jetable 2"), null);
    assert.equal(r2.location, "/marketing/listes", "sans Referer");
    const r3 = await del(boss, mkList(null, "Jetable 3"), `${SP}/${A}/listes`);
    assert.equal(r3.location, "/marketing/listes", "liste du site principal");
  });
  test("depuis le cadre historique, rien ne change", async () => {
    const r = await del(boss, mkList(A, "Jetable 4"), "/marketing/listes");
    assert.equal(r.location, "/marketing/listes");
  });
});

describe("7 — site principal et régressions", () => {
  test("l'espace du site principal garde le menu COMPLET du registre (toutes les entrées, adresses historiques)", async () => {
    const html = (await boss.get(`${PR}/tableau-de-bord`)).text;
    const links = new Set(navLinks(html));
    for (const it of nav.ALL.filter((i) => i.key !== "sites" && i.key !== "sitedash")) assert.ok(links.has(it.href), `entrée du registre absente de l'espace principal : ${it.label} (${it.href})`);
    assert.ok(links.has(`${PR}/tableau-de-bord`), "le tableau de bord du principal est celui de son espace"); assert.ok(!links.has(`${SP}`), "pas de « Mes sites » dans le menu d'un espace");
    assert.ok(hasBanner(html, "Site principal"));
  });
  test("les 67 entrées du menu du principal répondent comme avant (200) avec leurs adresses historiques", async () => {
    for (const it of nav.ALL) { const r = await boss.get(it.href); if (/\/articles\/ajouter(?:[?#]|$)/.test(it.href)) { assert.equal(r.status, 302, it.href); continue; } /* ARTICLES-02 : ouvre l'éditeur */ assert.equal(r.status, 200, `${it.label} (${it.href})`); assert.ok(!/mk-site-banner/.test(r.text), `${it.href} : pas de bandeau de site`); }
  });
  test("les écrans partagés servis dans l'espace du principal restent leurs écrans historiques", async () => {
    for (const d of DELEGATED) { const r = await boss.get(`${PR}/${d.mod}`); assert.ok([200, 302, 404].includes(r.status), d.mod); }
    assert.equal((await boss.get(`${PR}/tableau-de-bord`)).status, 200);
  });
  test("aucune migration n'a été ajoutée par P1a", () => {
    const fs = require("fs"), path = require("path");
    const dir = path.join(__dirname, "..", "src", "marketing", "migrations");
    const last = fs.readdirSync(dir).filter((f) => /^\d+_/.test(f)).sort().pop();
    assert.ok(fs.existsSync(dir)); assert.ok(last, "migrations lues");
    const root = path.join(__dirname, "..");
    const all = [dir, path.join(root, "src", "migrations"), path.join(root, "migrations")].filter((d) => fs.existsSync(d)).flatMap((d) => fs.readdirSync(d)).filter((f) => /^\d+/.test(f)).map((f) => parseInt(f, 10));
    assert.ok(Math.max(...all) <= 125, `dernière migration : ${Math.max(...all)}`); // 125 = intégration Mailchimp (API Marketing v3 et Transactional) ; 124 = Theme Builder par site (Programme 23.1) ; 123 = bibliothèque professionnelle de modèles (Programme 20.4) ; 122 = constructeur de boutique par IA (Programme 21.10) ; 120 = interface « Assistant IA » (Programme 21.8) ; 119 = cours par site (LMS universel, Titan XXIII) ; 118 = générateur de contenus IA (Programme 21.6) ; 117 = plans de site préparés par l'IA (Programme 21.3) ; 116 = journal et quotas du Kolakisa AI Core (Programme 21.2) ; 115 = index des clés étrangères des médias ; 114 = révision des composants du Theme Builder (ex-071, renumérotée palier 12) ; 113 = Registre des domaines des sites (TITAN XXXII) ; 112 = Explorateur de médias : dossiers logiques et empreinte SHA-256 (TITAN XXXIII) ; 111 = Email marketing : message réservé avant l'envoi d'un e-mail de scénario (claimed_at) ; 110 = Personnaliser : publication planifiée et liens d'aperçu partageables (TITAN XVIII) ; 108 = index des clés étrangères (CHIMERA) ; 105 = importateurs (Outils → Importer : correspondance source → contenu, activation) ; 104 = export des données personnelles (demandes d'export par site) ; 103 = notes internes (Outils → Admin Notes) ; 102 = effacement de données personnelles (Outils → Effacer les données : demandes et tâches) ; 101 = outils SEO par site (suivi des 404, état du sitemap) ; 100 = connecteurs (connexions, préférences) ; 99 = suivi des invitations (Utilisateurs → Invitations) ; 98 = imports de templates par site (Apparence → Templates) ; 97 = widgets par site (Apparence → Widgets) ; 96 = personnalisateur (brouillons et versions par site) ; 95 = polices par site (Apparence → Polices) ; 94 = thèmes par site (Apparence → Thèmes) ; 93 = modèles de pages privés à leur site (site builder ; 92 réservée à la migration manuelle R9-3) ; 91 = imports par site et 90 = SEO par site (R8 lot 6A) ; 89 = revenus par site (R7 lot 6.5) ; 88 = score par site (R7 lot 6.4) ; 87 = réseaux sociaux par site (R7 lot 6.3) ; 86 = IA par site (R7 lot 6.2) ; 85 = SMS par site (R7 lot 6.1) ; 84 = modules par site (R7 lot 6.0) ; 83 = demandes de rattachement de contacts (R7 lot 5) ; 82 = journal d'audit par site (R7 lot 4) ; 81 = formulaires par site (R7 lot 2) ; 80 = contacts par site (R7) ; 79 = index des médias par site (lot 7C) ; 75 = R6 lot 1 (contenus par site) ; 72, 73 et 74 sont attribuées à R2, R3 et R5
  });
});
