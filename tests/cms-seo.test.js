// KOLAKISA CMS — palier 11 : le moteur SEO central, de bout en bout (vraies routes, vraie base, vrai HTML public).
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, Client, loginInstructor, newStudent } = require("./helpers");

let srv, boss, db, anon, orgId;
const row = (id) => db.prepare("SELECT * FROM mk_landing_pages WHERE id = ?").get(id);
const idOf = (location) => Number(String(location).match(/pages\/(\d+)/)[1]);
const metaOf = (html, name) => (html.match(new RegExp(`<meta (?:name|property)="${name}" content="([^"]*)"`)) || [])[1];
const linkOf = (html, rel) => (html.match(new RegExp(`<link rel="${rel}" href="([^"]*)"`)) || [])[1];
const titleOf = (html) => (html.match(/<title>([^<]*)<\/title>/) || [])[1];
const ldOf = (html) => [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));

async function create(name, extra = {}) {
  const r = await boss.post("/marketing/pages", { name, template: "", ...extra });
  assert.equal(r.status, 302);
  return idOf(r.location);
}
async function saveDraft(client, id, content = {}) {
  const r = row(id);
  const cur = r.draft ? JSON.parse(r.draft) : { sections: JSON.parse(r.sections), seo: JSON.parse(r.seo || "{}") };
  return client.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", json: { revision: r.revision, content: { title: r.title || r.name, description: cur.description || "", seo: cur.seo || {}, ...content, sections: content.sections || cur.sections } } });
}
// Rend une page publique : indexable, en ligne
async function publish(id, { indexable = true } = {}) {
  const p = row(id);
  db.prepare("UPDATE mk_landing_pages SET indexable = ? WHERE id = ?").run(indexable ? 1 : 0, id);
  const r = await boss.post(`/marketing/pages/${id}/publier.json`, {});
  assert.equal(r.status, 200, r.text);
  return p.slug;
}
async function member(role) {
  const c = await newStudent(srv);
  const u = db.prepare("SELECT id FROM users WHERE email = ?").get(c.email);
  db.prepare("INSERT INTO mk_org_members (organization_id, user_id, role) VALUES (?, ?, ?)").run(orgId, u.id, role);
  return c;
}

before(async () => {
  srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
  boss = await loginInstructor(srv);
  anon = new Client(srv.base);
  db = srv.db();
  orgId = db.prepare("SELECT id FROM mk_organizations").get().id;
});
after(() => srv.stop());

const H = "/marketing/site-web/historique";
const U = "/marketing/site-web/utilisateurs";
const one = (sql, ...a) => db.prepare(sql).get(...a);
const settingsUrl = (siteId) => `/marketing/site-web/sites/${siteId}/reglages.json`;
const newSite = async (name) => {
  const r = await boss.post("/marketing/site-web/sites", { name });
  return Number(String(r.location).match(/sites\/(\d+)/)[1]);
};
// Enregistre des réglages du site (complète les réglages actuels)
async function putSite(client, siteId, patch) {
  const cur = JSON.parse((await boss.get(settingsUrl(siteId))).text);
  const settings = { ...cur.settings, ...patch };
  return client.request(settingsUrl(siteId), { method: "PUT", json: { revision: cur.revision, tokens: cur.tokens, settings } });
}
const pageIn = async (name, siteId) => {
  const id = await create(name, siteId ? { site_id: String(siteId) } : {});
  await saveDraft(boss, id, { sections: [{ type: "text", markdown: "Contenu de la page." }] });
  return id;
};

describe("rendu public d'une page du CMS", () => {
  test("sans SEO personnalisé : titre composé, description de repli, canonical, Open Graph et graphe JSON-LD cohérents", async () => {
    const id = await pageIn("Formation Photoshop");
    const slug = await publish(id);
    const res = await anon.get(`/p/${slug}`);
    assert.equal(res.status, 200);
    assert.equal(titleOf(res.text), "Formation Photoshop · KOLAKISA");
    assert.equal(linkOf(res.text, "canonical"), `https://k.test/p/${slug}`);
    assert.equal(metaOf(res.text, "og:url"), `https://k.test/p/${slug}`);
    assert.equal(metaOf(res.text, "og:type"), "website");
    assert.equal(metaOf(res.text, "og:site_name"), "KOLAKISA");
    assert.ok(metaOf(res.text, "description"), "description de repli (réglages de KOLAKISA)");
    assert.equal(metaOf(res.text, "twitter:card"), "summary");
    assert.equal(metaOf(res.text, "robots"), "index, follow");
    const graph = ldOf(res.text)[0]["@graph"];
    const types = graph.map((n) => n["@type"]);
    assert.deepEqual(types.filter((t) => t === "Organization" || t === "WebSite" || t === "WebPage").sort(), ["Organization", "WebPage", "WebSite"]);
    assert.equal(graph.find((n) => n["@type"] === "WebPage").url, `https://k.test/p/${slug}`);
    assert.ok(!types.includes("Product") && !types.includes("Article"), "aucune donnée structurée inventée");
  });

  test("SEO personnalisé : titre (complet), description, canonical, partage, carte X, mot-clé non publié", async () => {
    const id = await pageIn("Nos formations");
    const r = await saveDraft(boss, id, { seo: { title: "Formations professionnelles en ligne | KOLAKISA", description: "Apprenez à votre rythme avec nos formations.", canonical: "https://k.test/formations", ogTitle: "Rejoignez-nous", ogDescription: "Partage : description dédiée", twitterCard: "summary_large_image", ogImage: "https://cdn.example.com/partage.jpg", focusKeyword: "formation en ligne" } });
    assert.equal(r.status, 200, r.text);
    const slug = await publish(id);
    const html = (await anon.get(`/p/${slug}`)).text;
    assert.equal(titleOf(html), "Formations professionnelles en ligne | KOLAKISA", "titre SEO = titre complet, différent du titre visuel");
    assert.equal(metaOf(html, "description"), "Apprenez à votre rythme avec nos formations.");
    assert.equal(linkOf(html, "canonical"), "https://k.test/formations");
    assert.equal(metaOf(html, "og:title"), "Rejoignez-nous");
    assert.equal(metaOf(html, "og:description"), "Partage : description dédiée");
    assert.equal(metaOf(html, "og:image"), "https://cdn.example.com/partage.jpg");
    assert.equal(metaOf(html, "twitter:card"), "summary_large_image");
    assert.equal(metaOf(html, "twitter:title"), "Rejoignez-nous");
    assert.doesNotMatch(html, /formation en ligne"/, "le mot-clé principal sert à l'analyse seulement");
    assert.equal(ldOf(html)[0]["@graph"].find((n) => n["@type"] === "WebPage").name, "Formations professionnelles en ligne | KOLAKISA");
  });

  test("robots : noindex seul → « noindex, follow » ; nofollow et directives avancées publiés tels que réglés ; page non indexable → noindex, nofollow", async () => {
    const a = await pageIn("Page noindex");
    await saveDraft(boss, a, { seo: { noindex: true } });
    let html = (await anon.get(`/p/${await publish(a)}`)).text;
    assert.equal(metaOf(html, "robots"), "noindex, follow");
    const b = await pageIn("Page directives");
    await saveDraft(boss, b, { seo: { nofollow: true, noarchive: true, nosnippet: true, noimageindex: true } });
    html = (await anon.get(`/p/${await publish(b)}`)).text;
    assert.equal(metaOf(html, "robots"), "index, nofollow, noarchive, nosnippet, noimageindex");
    const c = await pageIn("Page non indexable");
    html = (await anon.get(`/p/${await publish(c, { indexable: false })}`)).text;
    assert.equal(metaOf(html, "robots"), "noindex, nofollow");
    assert.equal(ldOf(html).length, 0, "pas de données structurées sur une page non indexée");
    assert.ok(metaOf(html, "og:title"), "l'aperçu de partage reste publié");
  });

  test("brouillon et aperçu : introuvable pour le public, aperçu de l'équipe en noindex", async () => {
    const id = await pageIn("Brouillon secret");
    const slug = row(id).slug;
    assert.equal((await anon.get(`/p/${slug}`)).status, 404);
    const prev = await boss.get(`/marketing/pages/${id}/apercu`);
    assert.equal(prev.status, 200);
    assert.equal(metaOf(prev.text, "robots"), "noindex, nofollow");
  });

  test("sécurité : HTML et script dans les métadonnées échappés, JSON-LD sans fermeture de balise, adresses dangereuses refusées", async () => {
    const id = await pageIn("Page piège");
    const evil = '"><script>alert(1)</script></script><img src=x onerror=alert(2)>';
    const r = await saveDraft(boss, id, { seo: { title: evil, description: evil, ogTitle: evil, ogDescription: evil } });
    assert.equal(r.status, 200, r.text);
    const slug = await publish(id);
    const html = (await anon.get(`/p/${slug}`)).text;
    const headPart = html.slice(0, html.indexOf("</head>"));
    assert.doesNotMatch(headPart, /<script>alert/, "aucune balise injectée dans l'en-tête");
    assert.doesNotMatch(headPart, /<img src=x/);
    assert.match(headPart, /&lt;script&gt;alert\(1\)/);
    const blocks = [...headPart.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
    assert.ok(blocks.length >= 1);
    for (const b of blocks) assert.doesNotMatch(b[1], /<\/script|<script/i, "JSON-LD : « < » est échappé");
    for (const bad of ["javascript:alert(1)", "http://k.test/x", "https://k.test/x y", 'https://k.test/"onmouseover="x', "//evil.com"]) {
      const res = await saveDraft(boss, id, { seo: { canonical: bad } });
      assert.equal(res.status, 422, `canonical refusé : ${bad}`);
    }
    for (const bad of ["javascript:alert(1)", "data:text/html;base64,AAAA", "http://evil.example/x.png", '"><script>']) {
      const res = await saveDraft(boss, id, { seo: { ogImage: bad } });
      assert.equal(res.status, 422, `image de partage refusée : ${bad}`);
    }
  });

  test("image de partage locale introuvable : jamais publiée (aucun lien cassé)", async () => {
    const id = await pageIn("Image fantôme");
    await saveDraft(boss, id, { seo: { ogImage: "/uploads/marketing/1/inexistante.png" } });
    const html = (await anon.get(`/p/${await publish(id)}`)).text;
    assert.equal(metaOf(html, "og:image"), undefined);
  });

  test("FAQ réelle de la page → FAQPage dans le graphe ; sans FAQ, aucun nœud FAQ", async () => {
    const id = await pageIn("Page avec FAQ");
    await saveDraft(boss, id, { sections: [{ type: "faq", items: [{ q: "Combien de temps ?", a: "Six semaines." }] }] });
    const html = (await anon.get(`/p/${await publish(id)}`)).text;
    const graph = ldOf(html)[0]["@graph"];
    const faq = graph.find((n) => n["@type"] === "FAQPage");
    assert.equal(faq.mainEntity[0].name, "Combien de temps ?");
    const other = await pageIn("Sans FAQ");
    const g2 = ldOf((await anon.get(`/p/${await publish(other)}`)).text)[0]["@graph"];
    assert.ok(!g2.some((n) => n["@type"] === "FAQPage"));
  });
});

describe("multi-site : chaque site garde son adresse, son nom et ses règles", () => {
  let siteA, siteB, pa, pb;
  before(async () => {
    siteA = await newSite("Site Alpha");
    siteB = await newSite("Site Bêta");
    pa = await pageIn("Page Alpha", siteA);
    pb = await pageIn("Page Bêta", siteB);
  });
  test("adresse publique, nom et description du site A : canonical, og:url, JSON-LD et titre ; le site B n'en reçoit rien", async () => {
    const put = await putSite(boss, siteA, { seo: { title: "Alpha Académie", ogImage: "", publicUrl: "https://www.alpha.example", follow: true }, identity: { description: "La description du site Alpha.", logoUrl: "", logoMobileUrl: "", faviconUrl: "" } });
    assert.equal(put.status, 200, put.text.slice(0, 300));
    const sa = await publish(pa), sb = await publish(pb);
    const a = (await anon.get(`/p/${sa}`)).text, b = (await anon.get(`/p/${sb}`)).text;
    assert.equal(titleOf(a), "Page Alpha · Alpha Académie");
    assert.equal(linkOf(a, "canonical"), `https://www.alpha.example/p/${sa}`);
    assert.equal(metaOf(a, "og:url"), `https://www.alpha.example/p/${sa}`);
    assert.equal(metaOf(a, "og:site_name"), "Alpha Académie");
    assert.equal(metaOf(a, "description"), "La description du site Alpha.");
    const ga = JSON.stringify(ldOf(a));
    assert.match(ga, /https:\/\/www\.alpha\.example\/p\//);
    assert.doesNotMatch(ga, /k\.test/, "aucun domaine d'un autre site dans les données structurées du site A");
    assert.equal(titleOf(b), "Page Bêta · Site Bêta");
    assert.equal(linkOf(b, "canonical"), `https://k.test/p/${sb}`);
    assert.doesNotMatch(b, /alpha/i, "rien du site A n'apparaît dans la page du site B");
    assert.doesNotMatch(JSON.stringify(ldOf(b)), /alpha/i);
  });
  test("adresse publique invalide refusée ; fuite d'une adresse entre requêtes impossible", async () => {
    for (const bad of ["http://alpha.example", "https://alpha.example/chemin", "alpha.example", "javascript:alert(1)", "https://a b.example"]) {
      const r = await putSite(boss, siteA, { seo: { title: "", ogImage: "", publicUrl: bad, follow: true } });
      assert.equal(r.status, 422, bad);
    }
    const sb = row(pb).slug;
    const html = (await anon.get(`/p/${sb}`)).text;
    assert.equal(linkOf(html, "canonical"), `https://k.test/p/${sb}`, "la requête précédente n'a pas modifié l'adresse du site B");
  });
  test("site entier en noindex : pages en noindex, absentes du plan du site ; l'autre site reste indexé", async () => {
    const cur = JSON.parse((await boss.get(settingsUrl(siteA))).text);
    const r = await putSite(boss, siteA, { extras: { ...cur.settings.extras, noindex: true } });
    assert.equal(r.status, 200, r.text.slice(0, 200));
    const html = (await anon.get(`/p/${row(pa).slug}`)).text;
    assert.equal(metaOf(html, "robots"), "noindex, nofollow");
    const sitemap = (await anon.get("/sitemap.xml")).text;
    assert.doesNotMatch(sitemap, new RegExp(`/p/${row(pa).slug}<`));
    assert.match(sitemap, new RegExp(`https://k\\.test/p/${row(pb).slug}<`));
    await putSite(boss, siteA, { extras: { ...cur.settings.extras, noindex: false } });
    assert.match((await anon.get("/sitemap.xml")).text, new RegExp(`https://www\\.alpha\\.example/p/${row(pa).slug}<`), "le plan du site utilise l'adresse publique du site");
  });
  test("site sans nofollow : « Autoriser les liens » décoché → nofollow sur toutes les pages du site", async () => {
    await putSite(boss, siteB, { seo: { title: "", ogImage: "", publicUrl: "", follow: false } });
    assert.equal(metaOf((await anon.get(`/p/${row(pb).slug}`)).text, "robots"), "noindex, nofollow".replace("noindex", "index"));
    await putSite(boss, siteB, { seo: { title: "", ogImage: "", publicUrl: "", follow: true } });
    assert.equal(metaOf((await anon.get(`/p/${row(pb).slug}`)).text, "robots"), "index, follow");
  });
});

describe("plan du site : pages indexables seulement", () => {
  test("une page noindex est absente, une page indexable présente avec son adresse", async () => {
    const a = await pageIn("Plan A");
    const b = await pageIn("Plan B");
    await saveDraft(boss, b, { seo: { noindex: true } });
    const sa = await publish(a), sb = await publish(b);
    const xml = (await anon.get("/sitemap.xml")).text;
    assert.match(xml, new RegExp(`https://k\\.test/p/${sa}<`));
    assert.doesNotMatch(xml, new RegExp(`/p/${sb}<`));
  });
});

describe("permissions SEO (seo.view / seo.edit)", () => {
  let id, withSeo, without, viewer;
  before(async () => {
    id = await pageIn("Page permissions");
    await publish(id);
    withSeo = await member("editor");
    // Rôle personnalisé : peut écrire les pages mais pas le SEO
    const perms = ["forms.read", "forms.write", "pages.publish", "seo.view"];
    const created = await boss.post(`${U}/roles`, { name: "Rédacteur sans SEO", description: "test", perm: perms });
    assert.ok([200, 302].includes(created.status), created.text.slice(0, 200));
    const key = one("SELECT key FROM mk_roles WHERE name = 'Rédacteur sans SEO'").key;
    without = await member(key);
    viewer = await member("viewer");
  });
  test("l'éditeur par défaut modifie le SEO de la page ; le rôle sans seo.edit reçoit 403 par l'API et rien n'est écrit", async () => {
    assert.equal((await saveDraft(withSeo, id, { seo: { title: "Titre par l'éditeur" } })).status, 200);
    const before = row(id).draft;
    const r = await saveDraft(without, id, { seo: { title: "Titre pirate" } });
    assert.equal(r.status, 403, r.text);
    assert.equal(row(id).draft, before, "brouillon inchangé");
    // le même rôle enregistre le contenu sans toucher au SEO (sauvegarde automatique)
    const keep = JSON.parse(row(id).draft).seo;
    const ok = await saveDraft(without, id, { sections: [{ type: "text", markdown: "Texte modifié sans toucher au SEO" }], seo: keep });
    assert.equal(ok.status, 200, ok.text);
    assert.equal(JSON.parse(row(id).draft).seo.title, "Titre par l'éditeur");
  });
  test("fiche de la page (formulaire) : un changement de SEO est refusé sans seo.edit", async () => {
    const r = row(id);
    const w = JSON.parse(r.draft);
    const res = await without.post(`/marketing/pages/${id}`, { revision: String(r.revision), name: r.name, slug: r.slug, title: w.title || r.name, description: w.description || "", seo_canonical: "https://k.test/pirate", seo_og_image: "", form_id: "", tags: "", site_id: "" });
    assert.equal(JSON.parse(row(id).draft).seo.canonical, undefined, "canonical non modifié");
    assert.notEqual(res.status, 500);
  });
  test("réglages SEO du site : refusés sans seo.edit, acceptés pour l'éditeur", async () => {
    const siteId = await newSite("Site permissions");
    const cur = JSON.parse((await boss.get(settingsUrl(siteId))).text);
    const patch = { ...cur.settings, seo: { ...cur.settings.seo, title: "Titre du site pirate" } };
    const denied = await without.request(settingsUrl(siteId), { method: "PUT", json: { revision: cur.revision, tokens: cur.tokens, settings: patch } });
    assert.equal(denied.status, 403, denied.text.slice(0, 200));
    const desc = await without.request(settingsUrl(siteId), { method: "PUT", json: { revision: cur.revision, tokens: cur.tokens, settings: { ...cur.settings, identity: { ...cur.settings.identity, description: "Nouvelle description" } } } });
    assert.equal(desc.status, 403, "la description du site fait partie du SEO");
    const ok = await withSeo.request(settingsUrl(siteId), { method: "PUT", json: { revision: cur.revision, tokens: cur.tokens, settings: patch } });
    assert.equal(ok.status, 200, ok.text.slice(0, 200));
    assert.equal(JSON.parse(ok.text).settings.seo.title, "Titre du site pirate".replace("pirate", "pirate"));
    // sans seo.edit, enregistrer d'autres réglages (sans toucher au SEO) reste possible
    const cur2 = JSON.parse((await boss.get(settingsUrl(siteId))).text);
    const fine = await without.request(settingsUrl(siteId), { method: "PUT", json: { revision: cur2.revision, tokens: cur2.tokens, settings: { ...cur2.settings, extras: { ...cur2.settings.extras, smoothScroll: true } } } });
    assert.equal(fine.status, 200, fine.text.slice(0, 200));
  });
  test("analyse SEO : réservée à seo.view ; un lecteur n'y a pas accès, un compte hors équipe non plus", async () => {
    const url = `/marketing/pages/${id}/seo/analyse`;
    assert.equal((await viewer.request(url, { method: "POST", json: {} })).status, 403);
    assert.equal((await withSeo.request(url, { method: "POST", json: {} })).status, 200);
    const stranger = await newStudent(srv);
    assert.ok([302, 403, 404].includes((await stranger.request(url, { method: "POST", json: {} })).status));
    assert.equal((await anon.request(url, { method: "POST", json: {} })).status === 200, false);
  });
  test("l'éditeur de pages expose les droits réels (canEdit / canView)", async () => {
    const boot = (html) => JSON.parse(html.match(/id="pb-boot"[^>]*>([\s\S]*?)<\/script>/)[1]);
    assert.deepEqual(boot((await withSeo.get(`/marketing/pages/${id}/editeur`)).text).seo, { canView: true, canEdit: true, url: `/marketing/pages/${id}/seo/analyse` });
    assert.equal(boot((await without.get(`/marketing/pages/${id}/editeur`)).text).seo.canEdit, false);
    assert.equal(boot((await viewer.get(`/marketing/pages/${id}/editeur`)).text).seo.canView, false);
  });
});

describe("aperçu et analyse (même moteur que la page publique)", () => {
  let id, slug;
  before(async () => {
    id = await pageIn("Page à analyser");
    const hero = (title) => ({ type: "hero", title, subtitle: "", image: "", imageAlt: "", buttonLabel: "", buttonUrl: "" });
    const saved = await saveDraft(boss, id, { sections: [hero("Titre principal"), hero("Deuxième titre principal"), { type: "text", markdown: "Un texte avec un [lien interne](/catalogue) et un [lien externe](https://exemple.org)." }, { type: "image", src: "https://cdn.example.com/a.jpg", alt: "Une illustration", caption: "", link: "" }] });
    assert.equal(saved.status, 200, saved.text);
    slug = await publish(id);
  });
  const analyse = async (body) => JSON.parse((await boss.request(`/marketing/pages/${id}/seo/analyse`, { method: "POST", json: body })).text);
  test("aperçu : titre, adresse et description résolus avec les valeurs NON enregistrées de l'éditeur", async () => {
    const r = await analyse({ title: "Titre visuel", description: "Description de la page", seo: { title: "Titre SEO en direct" } });
    assert.equal(r.serp.title, "Titre SEO en direct");
    assert.equal(r.serp.description, "Description de la page");
    assert.equal(r.serp.url, `https://k.test/p/${slug}`);
    assert.equal(r.resolved.indexable, true);
    const none = await analyse({ title: "Titre visuel", seo: {} });
    assert.equal(none.serp.title, "Titre visuel · KOLAKISA");
  });
  test("aperçu avec une valeur invalide : refus clair, jamais de 500", async () => {
    const r = await boss.request(`/marketing/pages/${id}/seo/analyse`, { method: "POST", json: { seo: { canonical: "javascript:alert(1)" } } });
    assert.equal(r.status, 422);
  });
  test("analyse du brouillon : titre principal, textes alternatifs, liens — avec règles explicites et note honnête", async () => {
    const r = await analyse({ analyse: true, title: "Page à analyser", seo: {} });
    const by = Object.fromEntries(r.checks.map((c) => [c.id, c]));
    assert.match(by.h1.label, /titre principal/);
    assert.equal(by.alt.status, "good", "le texte alternatif est exigé dès l'enregistrement : les images de la page l'ont");
    assert.match(by.alt.label, /1 image avec texte alternatif/);
    assert.equal(by.internal.status, "good");
    assert.match(by.external.label, /1 lien externe/);
    assert.equal(by.index.status, "good");
    assert.match(r.scoreNote, /pas une note officielle|Ce n'est ni une note officielle/);
    const total = r.summary.good + r.summary.improve + r.summary.problem;
    assert.equal(total, r.checks.length, "le résumé compte exactement les contrôles");
    assert.equal(r.score, Math.round((100 * (r.summary.good + r.summary.improve * 0.5)) / r.checks.length), "note = règle explicite");
  });
  test("analyse : une page sans titre principal reçoit un conseil (jamais un blocage)", async () => {
    const plain = await pageIn("Page sans H1");
    const r = JSON.parse((await boss.request(`/marketing/pages/${plain}/seo/analyse`, { method: "POST", json: { analyse: true } })).text);
    const h1 = r.checks.find((c) => c.id === "h1");
    assert.equal(h1.status, "improve");
    assert.match(h1.label, /Aucun titre principal/);
    assert.equal((await saveDraft(boss, plain, { seo: { title: "Autre" } })).status, 200, "l'enregistrement n'est jamais bloqué par l'analyse");
  });
  test("analyse : page noindex signalée comme telle, mot-clé principal contrôlé", async () => {
    const r = await analyse({ analyse: true, title: "Page à analyser", seo: { noindex: true, focusKeyword: "texte" } });
    const by = Object.fromEntries(r.checks.map((c) => [c.id, c]));
    assert.equal(by.index.status, "problem");
    assert.match(by.index.advice, /noindex réglé sur la page/);
    assert.equal(by["kw-text"].status, "good");
    assert.equal(r.resolved.indexable, false);
  });
});

describe("révisions : le SEO d'une page est versionné avec la page", () => {
  test("SEO V1 → SEO V2 → restauration de V1 : les réglages SEO reviennent, le titre de V2 disparaît", async () => {
    const id = await pageIn("Page versionnée");
    await saveDraft(boss, id, { seo: { title: "Titre SEO V1", description: "Description V1" } });
    await publish(id);
    const v1 = one("SELECT number FROM mk_page_versions WHERE page_id = ? ORDER BY number DESC", id).number;
    await saveDraft(boss, id, { seo: { title: "Titre SEO V2", description: "Description V2", noindex: true } });
    await boss.post(`/marketing/pages/${id}/publier.json`, {});
    assert.equal(JSON.parse(row(id).seo).title, "Titre SEO V2");
    await saveDraft(boss, id, { seo: { title: "Titre SEO V3 en cours", noindex: true } });
    const r = await boss.post(`${H}/page/${id}/restaurer`, { ref: `v:${v1}` });
    assert.equal(r.status, 302);
    const draftSeo = JSON.parse(row(id).draft).seo;
    assert.equal(draftSeo.title, "Titre SEO V1");
    assert.equal(draftSeo.description, "Description V1");
    assert.equal(draftSeo.noindex, undefined, "noindex de V2 retiré avec la restauration");
    assert.equal(JSON.parse(row(id).seo).title, "Titre SEO V2", "la version en ligne ne bouge qu'à la publication");
    // l'état d'avant la restauration (V2) reste récupérable
    const snap = one("SELECT id, data FROM cms_revisions WHERE content_type = 'page' AND content_id = ? AND kind = 'before_restore'", id);
    assert.match(snap.data, /Titre SEO V3 en cours/, "le brouillon d'avant la restauration reste récupérable");
    // la version publiée V2 garde son SEO dans l'historique des versions
    assert.match(one("SELECT content FROM mk_page_versions WHERE page_id = ? AND number = ?", id, v1 + 1).content, /Titre SEO V2/);
  });
});

describe("régression : le SEO du reste du site est inchangé", () => {
  test("accueil, catalogue, blog et page 404 : titre, canonical et robots comme avant", async () => {
    const home = (await anon.get("/")).text;
    assert.match(titleOf(home), /KOLAKISA/);
    assert.equal(linkOf(home, "canonical"), "https://k.test/");
    const blog = (await anon.get("/blog")).text;
    assert.equal(linkOf(blog, "canonical"), "https://k.test/blog");
    const missing = await anon.get("/page-qui-n-existe-pas");
    assert.equal(missing.status, 404);
    assert.equal(metaOf(missing.text, "robots"), "noindex, nofollow");
    const robots = (await anon.get("/robots.txt")).text;
    assert.match(robots, /Sitemap: https:\/\/k\.test\/sitemap\.xml/);
  });
});
