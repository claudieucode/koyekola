// Site Web — phase 3 : section « Site Web » de l'Emailing (tableau de bord réel, sites et design system, pages en
// brouillon / aperçu / publication / versions, SEO), par les vraies routes d'un vrai serveur.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, Client, loginInstructor, newStudent } = require("./helpers");

const UA = { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 Chrome/120 Safari/537.36" };
let srv, boss, db;
const row = (id) => db.prepare("SELECT * FROM mk_landing_pages WHERE id = ?").get(id);
const flashOf = (html) => (html.match(/class="mk-flash[^"]*"[^>]*>[\s\S]*?<\/div>/) || [""])[0];
const idFrom = (location) => Number(location.match(/(\d+)(#.*)?$/)[1]);
// Corps du formulaire de l'éditeur (contenu de travail actuel, éventuellement modifié)
function editorBody(id, { sections, ...over } = {}) {
  const r = row(id);
  const working = r.draft ? JSON.parse(r.draft) : { sections: JSON.parse(r.sections), title: r.title, description: r.description };
  const list = sections || working.sections;
  const body = { revision: String(r.revision), name: r.name, slug: r.slug, title: working.title, description: working.description, form_id: "", tags: "", site_id: r.site_id ? String(r.site_id) : "", theme_accent: "#0277b6", theme_background: "#f3f8fc", theme_text: "#10222f", action: "save" };
  list.forEach((s, i) => { for (const [k, v] of Object.entries(s)) body[`sections[${i}][${k}]`] = Array.isArray(v) ? v.join("\n") : String(v); if (s.type === "hero") body[`sections[${i}][imageUrl]`] = s.image || ""; });
  return { ...body, ...over };
}
const hero = (title) => ({ type: "hero", title, subtitle: "", image: "", imageAlt: "", buttonLabel: "", buttonUrl: "" });

before(async () => {
  srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
  boss = await loginInstructor(srv);
  db = srv.db();
});
after(() => srv.stop());

describe("navigation et tableau de bord", () => {
  test("menu : section « Site Web » (Tableau de bord, Sites, Pages), puis « Tunnels » (noms exacts)", async () => {
    const html = (await boss.get("/marketing/site-web")).text;
    assert.match(html, />Site Web</);
    for (const href of ["/marketing/site-web/sites", "/marketing/pages"]) assert.match(html, new RegExp(`href="${href}"`));
    // « Mes sites » est l'unique point d'entrée central : le tableau de bord du principal s'ouvre par Mes sites → Ouvrir (pas d'entrée parallèle dans le menu)
    assert.doesNotMatch(html.match(/<nav[^>]*mk-cms-nav[\s\S]*?<\/nav>/)[0], /Tableau de bord du site principal/);
    // Depuis le palier 1, Site Web est l'environnement KOLAKISA CMS : « Tunnels » reste une section du Marketing, atteinte par « Retour au Marketing »
    assert.match(html, /class="mk-cms-back" href="\/marketing"/, "retour au Marketing depuis le CMS");
    assert.match((await boss.get("/marketing")).text, /href="\/marketing\/tunnels"/, "section Tunnels (phase 8), dans le menu Marketing");
    assert.doesNotMatch(html, /Funnels|Kolakisa Web/, "noms imposés : « Site Web » et « Tunnels »");
    assert.doesNotMatch(html, /Pages d'atterrissage</, "les pages d'atterrissage sont rattachées à Site Web → Pages");
  });

  test("tableau de bord vide : zéros réels et état vide (aucun chiffre inventé)", async () => {
    const html = (await boss.get("/marketing/site-web")).text;
    assert.match(html, /Aucune page pour l'instant/);
    assert.match(html, /Visiteurs uniques<\/span><span class="mk-stat-value">0</);
  });
});

describe("sites et design system", () => {
  let siteId, pageId;

  test("créer un site, y créer une page, la choisir comme page d'accueil", async () => {
    const r = await boss.post("/marketing/site-web/sites", { name: "Académie Photo" });
    siteId = idFrom(r.location);
    const p = await boss.post("/marketing/pages", { name: "Accueil Photo", site_id: String(siteId) });
    pageId = idFrom(p.location);
    assert.equal(row(pageId).site_id, siteId);
    assert.equal(row(pageId).kind, "page");
    assert.deepEqual(JSON.parse(row(pageId).sections).map((x) => x.type), ["hero", "text"], "page de site : publiable sans formulaire");
    await boss.post(`/marketing/site-web/sites/${siteId}`, { name: "Académie Photo", home_page_id: String(pageId) });
    const html = (await boss.get(`/marketing/site-web/sites/${siteId}/reglages`)).text;
    assert.match(html, /Accueil Photo<\/a> <span class="mk-status">Accueil<\/span>/);
  });

  test("design system : une couleur modifiée s'applique à la page EN LIGNE du site ; valeur invalide refusée", async () => {
    await boss.post(`/marketing/pages/${pageId}`, editorBody(pageId));
    await boss.post(`/marketing/pages/${pageId}/publier`, {});
    assert.equal(row(pageId).status, "published");
    let pub = (await new Client(srv.base).get(`/p/${row(pageId).slug}`, { headers: UA })).text;
    assert.match(pub, /class="lp-body lp-site"/);
    assert.match(pub, /--kw-primary:#0277b6;/);
    await boss.post(`/marketing/site-web/sites/${siteId}/design`, { color_primary: "#aa1100", color_text: "#111111", font_heading: "georgia", type_h1_size: "52", space_lg: "40" });
    pub = (await new Client(srv.base).get(`/p/${row(pageId).slug}`, { headers: UA })).text;
    assert.match(pub, /--kw-primary:#aa1100;/, "la page en ligne suit le design system sans republication");
    assert.match(pub, /--kw-font-heading:Georgia/);
    assert.match(pub, /--kw-h1-size:52px;/);
    assert.match(pub, /--kw-on-primary:#ffffff;/, "texte des boutons choisi pour le contraste");
    const bad = await boss.post(`/marketing/site-web/sites/${siteId}/design`, { color_primary: "rouge\"><script>" });
    assert.match(flashOf((await boss.get(bad.location)).text), /hexadécimal/);
    assert.equal(JSON.parse(db.prepare("SELECT tokens FROM mk_sites WHERE id = ?").get(siteId).tokens).colors.primary, "#aa1100", "rien n'est remplacé en silence");
    await boss.post(`/marketing/site-web/sites/${siteId}/design`, { reset: "1" });
    assert.equal(JSON.parse(db.prepare("SELECT tokens FROM mk_sites WHERE id = ?").get(siteId).tokens).colors.primary, "#0277b6");
  });

  test("dupliquer le site (pages copiées hors ligne), archiver (pages hors ligne), restaurer (rien de republié)", async () => {
    const d = await boss.post(`/marketing/site-web/sites/${siteId}/dupliquer`, {});
    const copyId = idFrom(d.location);
    assert.notEqual(copyId, siteId);
    assert.ok(db.prepare("SELECT COUNT(*) n FROM mk_landing_pages WHERE site_id = ? AND status = 'draft'").get(copyId).n >= 1);
    await boss.post(`/marketing/site-web/sites/${siteId}/archiver`, {});
    assert.equal(row(pageId).status, "unpublished");
    assert.equal((await new Client(srv.base).get(`/p/${row(pageId).slug}`, { headers: UA })).status, 404);
    assert.match((await boss.get("/marketing/site-web/sites?vue=archives")).text, /Académie Photo</);
    await boss.post(`/marketing/site-web/sites/${siteId}/restaurer`, {});
    assert.equal(row(pageId).status, "unpublished");
  });
});

describe("pages : brouillon, aperçu, publication, versions", () => {
  let id, slug;

  test("enregistrer = brouillon : la page en ligne ne change pas avant « Publier les modifications »", async () => {
    id = idFrom((await boss.post("/marketing/pages", { name: "Offre d'automne" })).location);
    slug = row(id).slug;
    await boss.post(`/marketing/pages/${id}`, editorBody(id, { sections: [hero("Version en ligne 1")] }));
    await boss.post(`/marketing/pages/${id}/publier`, {});
    await boss.post(`/marketing/pages/${id}`, editorBody(id, { sections: [hero("Brouillon 2")] }));
    const editor = (await boss.get(`/marketing/pages/${id}`)).text;
    assert.match(editor, /Modifications non publiées/);
    assert.match(editor, /Publier les modifications/);
    assert.match((await new Client(srv.base).get(`/p/${slug}`, { headers: UA })).text, /Version en ligne 1/);
    const preview = (await boss.get(`/marketing/pages/${id}/apercu`)).text;
    assert.match(preview, /Brouillon 2/);
    assert.match(preview, /Aperçu du brouillon/);
    await boss.post(`/marketing/pages/${id}/publier`, {});
    assert.match((await new Client(srv.base).get(`/p/${slug}`, { headers: UA })).text, /Brouillon 2/);
  });

  test("versions : liste, aperçu d'une ancienne version, restauration dans le brouillon (en ligne inchangé)", async () => {
    const editor = (await boss.get(`/marketing/pages/${id}`)).text;
    assert.match(editor, /Version 2<\/strong> <span class="mk-status mk-status-ok">En ligne/);
    assert.match(editor, /Version 1<\/strong>/);
    assert.match((await boss.get(`/marketing/pages/${id}/versions/1/apercu`)).text, /Version en ligne 1/);
    assert.equal((await boss.get(`/marketing/pages/${id}/versions/9/apercu`)).status, 404);
    await boss.post(`/marketing/pages/${id}/versions/1/restaurer`, {});
    assert.equal(JSON.parse(row(id).draft).sections[0].title, "Version en ligne 1");
    assert.match((await new Client(srv.base).get(`/p/${slug}`, { headers: UA })).text, /Brouillon 2/, "en ligne inchangé");
    await boss.post(`/marketing/pages/${id}/brouillon/abandonner`, {});
    assert.equal(row(id).draft, null);
  });

  test("deux onglets : un enregistrement sur une révision dépassée est refusé, rien n'est écrasé", async () => {
    const stale = editorBody(id, { sections: [hero("Onglet A")] });
    await boss.post(`/marketing/pages/${id}`, editorBody(id, { sections: [hero("Onglet B")] }));
    const r = await boss.post(`/marketing/pages/${id}`, stale);
    assert.match(flashOf((await boss.get(r.location)).text), /modifiée ailleurs/);
    assert.equal(JSON.parse(row(id).draft).sections[0].title, "Onglet B");
  });

  test("SEO : titre, description, canonique, image de partage ; plan du site seulement si la page est indexable", async () => {
    const anon = new Client(srv.base);
    assert.doesNotMatch((await anon.get("/sitemap.xml")).text, new RegExp(`/p/${slug}<`));
    await boss.post(`/marketing/pages/${id}`, editorBody(id, { title: "Offre d'automne : -30 %", description: "Toutes les formations photo à -30 %.", indexable: "on" }));
    await boss.post(`/marketing/pages/${id}/publier`, {});
    const pub = (await anon.get(`/p/${slug}`, { headers: UA })).text;
    assert.match(pub, /<title>Offre d&#39;automne : -30 % · KOLAKISA<\/title>/);
    assert.match(pub, /<meta name="robots" content="index, follow">/);
    assert.match(pub, new RegExp(`<link rel="canonical" href="https://k.test/p/${slug}">`));
    assert.match((await anon.get("/sitemap.xml")).text, new RegExp(`https://k.test/p/${slug}<`));
    await boss.post(`/marketing/pages/${id}`, editorBody(id, { seo_canonical: "https://ailleurs.test/offre", indexable: "on" }));
    await boss.post(`/marketing/pages/${id}/publier`, {});
    assert.doesNotMatch((await anon.get("/sitemap.xml")).text, new RegExp(`/p/${slug}<`), "canonique vers une autre adresse : hors du plan du site");
    assert.match((await anon.get(`/p/${slug}`, { headers: UA })).text, /<link rel="canonical" href="https:\/\/ailleurs.test\/offre">/);
  });

  test("dupliquer, archiver (hors ligne, onglet Archivées), restaurer (hors ligne)", async () => {
    const copyId = idFrom((await boss.post(`/marketing/pages/${id}/dupliquer`, {})).location);
    assert.equal(row(copyId).status, "draft");
    await boss.post(`/marketing/pages/${id}/archiver`, {});
    assert.equal((await new Client(srv.base).get(`/p/${slug}`, { headers: UA })).status, 404);
    assert.match((await boss.get("/marketing/pages?vue=archivees")).text, /Offre d&#39;automne</);
    assert.doesNotMatch((await boss.get("/marketing/pages")).text, new RegExp(`/marketing/pages/${id}"`));
    const editor = (await boss.get(`/marketing/pages/${id}`)).text;
    assert.match(editor, /Page archivée/);
    await boss.post(`/marketing/pages/${id}/restaurer`, {});
    assert.equal(row(id).archived_at, null);
    assert.equal(row(id).status, "unpublished");
  });

  test("tableau de bord : chiffres réels (visites d'un vrai visiteur, robots exclus) et meilleures pages", async () => {
    await boss.post(`/marketing/pages/${id}/publier`, {});
    const before = db.prepare("SELECT COUNT(DISTINCT visitor) n FROM mk_landing_events WHERE type = 'view'").get().n;
    await new Client(srv.base).get(`/p/${slug}`, { headers: { "User-Agent": "Googlebot/2.1" } });
    const html = (await boss.get("/marketing/site-web?periode=7")).text;
    const visitors = db.prepare(`SELECT COUNT(DISTINCT visitor || ':' || (occurred_at / 86400000)) n FROM mk_landing_events WHERE type = 'view'`).get().n;
    assert.equal(db.prepare("SELECT COUNT(DISTINCT visitor) n FROM mk_landing_events WHERE type = 'view'").get().n, before, "robot non compté");
    assert.match(html, new RegExp(`Visiteurs uniques</span><span class="mk-stat-value">${visitors}<`));
    // Le graphique par jour additionne exactement les visiteurs uniques de la période
    const stats = require("../src/marketing/pages/stats");
    const d = stats.dashboard({ db, organizationId: 1 }, { days: 7 });
    assert.equal(d.trend.reduce((n, x) => n + x.count, 0), d.visitors);
    assert.ok(d.trend[6].count > 0, "les visites du jour sont dans la dernière colonne");
    assert.match(html, /Meilleures pages/);
    assert.match(html, /Offre d&#39;automne/);
    assert.match(html, /Audience mesurée/);
    assert.match(html, /Aucun visiteur mesuré sur cette période/, "sans visiteur ayant accepté la mesure : rien n'est estimé");
  });
});

describe("droits", () => {
  test("élève refusé ; lecteur : tableau de bord et sites en lecture, aucune modification", async () => {
    const student = await newStudent(srv);
    assert.equal((await student.get("/marketing/site-web")).status, 403);
    const viewer = await newStudent(srv);
    db.prepare("INSERT INTO mk_org_members (organization_id, user_id, role) VALUES (1, (SELECT id FROM users WHERE email = ?), 'viewer')").run(viewer.email);
    assert.equal((await viewer.get("/marketing/site-web")).status, 200);
    assert.equal((await viewer.get("/marketing/site-web/sites")).status, 200);
    assert.equal((await viewer.post("/marketing/site-web/sites", { name: "Pirate" })).status, 403);
    const siteId = db.prepare("SELECT id FROM mk_sites ORDER BY id LIMIT 1").get().id;
    assert.equal((await viewer.post(`/marketing/site-web/sites/${siteId}/design`, { color_primary: "#000000" })).status, 403);
    assert.equal((await viewer.post(`/marketing/site-web/sites/${siteId}/archiver`, {})).status, 403);
  });
});
