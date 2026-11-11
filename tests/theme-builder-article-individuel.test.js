// Catégorie « Article individuel » du Theme Builder : 100 modèles distincts, utilisables, publiables, liés au BON article, isolés par site, vignette = aperçu = copie du site = rendu public.
// Serveur réel, deux sites sur deux domaines. Contrôle chaque modèle de la bibliothèque (100) : utiliser → publier → page publique de l'article.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");
const Catalog = require("../src/themeBuilder/catalog");

// forme d'un document : types d'éléments, textes et nombre d'enfants (la copie du site est normalisée par le moteur : valeurs par défaut ajoutées, identifiants posés)
const outline = (n) => JSON.stringify(n, (k, v) => (["id", "styles", "motionAttr", "parts", "anchor", "css"].includes(k) ? undefined : k === "props" ? (v && (v.text || v.html || v.src) ? { text: v.text, html: v.html, src: v.src } : undefined) : v));
const strip = (n) => JSON.stringify(n, (k, v) => (k === "id" ? undefined : v));
const hostReq = (srv, host, path) => {
  const u = new URL(srv.base);
  return new Promise((resolve, reject) => {
    const r = http.request({ host: u.hostname, port: u.port, path, method: "GET", headers: { Host: host, "User-Agent": "Mozilla/5.0 Chrome/120 Safari/537.36" } }, (resp) => {
      let text = ""; resp.on("data", (d) => (text += d)); resp.on("end", () => resolve({ status: resp.statusCode, text }));
    });
    r.on("error", reject); r.end();
  });
};

describe("Article individuel : la bibliothèque (code)", () => {
  const all = Catalog.entries("single_post");
  test("exactement 100 modèles, clés et noms uniques, 100 mises en page, aucune ancienne clé « mise en page × identité »", () => {
    assert.equal(all.length, 100);
    assert.equal(new Set(all.map((e) => e.key)).size, 100); assert.equal(new Set(all.map((e) => e.name)).size, 100);
    assert.equal(new Set(all.map((e) => e.layoutId)).size, 100, "100 compositions, pas 20 × 5"); assert.ok(Catalog.list("single_post", { limit: 60 }).layouts.length >= 12, "filtre par familles");
    assert.ok(all.every((e) => /^[a-z0-9-]+\.ai-\d{3}$/.test(e.key)), "clés v3 : nom.ai-NNN");
  });
  test("liste, recherche sans accents et filtres par identité cohérents (la somme des identités fait 100)", () => {
    // identités PROPRES (valeurs fixes, voir single_post/identities.js) : plus aucune des cinq identités du site
    const skins = Catalog.list("single_post", { limit: 60 }).skins;
    assert.ok(skins.length >= 30, `${skins.length} identités`);
    assert.equal(skins.reduce((n, s) => n + Catalog.list("single_post", { skin: s.key }).total, 0), 100);
    for (const s of ["clair", "marque", "nuit", "editorial", "doux"]) assert.equal(Catalog.list("single_post", { skin: s }).total, 0, `l'identité du site « ${s} » ne doit plus exister`);
    assert.equal(Catalog.list("single_post", { q: "zzzz-inconnu" }).total, 0);
    assert.ok(Catalog.list("single_post", { q: "MAGAZINE" }).total >= 3);
  });
  test("chaque modèle : un titre {{post.title}}, un contenu d'article, aucune image ni lien inventé, vignette = document construit", () => {
    for (const e of all) {
      const b = Catalog.build("single_post", e.key), raw = strip(b.sections);
      assert.equal((raw.match(/\{\{post\.title\}\}/g) || []).length >= 1, true, `${e.key} : titre`);
      assert.equal((raw.match(/"type":"postcontent"/g) || []).length, 1, `${e.key} : un seul contenu d'article`);
      assert.doesNotMatch(raw, /https?:\/\/|"src":"(?!\{\{)/, `${e.key} : image ou lien inventé`);
      assert.equal(strip(Catalog.thumbDoc("single_post", e.key)), strip(b.sections[0]), `${e.key} : la vignette vient du même document`);
    }
  });
  test("aucune structure en double (empreinte des types d'éléments, des colonnes et des réglages de mise en page)", () => {
    const shape = (n) => JSON.stringify(n, (k, v) => (k === "id" ? undefined : k === "props" ? Object.keys(v).sort() : k === "styles" ? Object.keys(v.desktop || {}).sort() : v));
    assert.equal(new Set(all.map((e) => shape(Catalog.build("single_post", e.key).sections))).size, 100, "100 structures différentes");
  });
});

describe("Article individuel : de la bibliothèque au site public (100 modèles, serveur réel)", () => {
  let srv, boss, db, org, A, B;
  const ORIGIN = () => ({ Origin: srv.base });
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const U = (s, p = "") => `/marketing/site-web/sites/${s}/constructeur-de-theme${p}`;
  const post = (path, body) => boss.request(path, { method: "POST", json: body || {}, headers: ORIGIN() });
  const mkSite = (name, slug) => Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, ?, ?, '{}')").run(org, name, slug).lastInsertRowid);
  const setDomain = async (site, url) => {
    const cur = JSON.parse((await boss.get(`/marketing/site-web/sites/${site}/reglages.json`)).text);
    return boss.request(`/marketing/site-web/sites/${site}/reglages.json`, { method: "PUT", json: { settings: { ...cur.settings, seo: { ...cur.settings.seo, publicUrl: url } }, revision: cur.revision }, headers: ORIGIN() });
  };
  const mkPost = (site, slug, title, body) => {
    const id = Number(db.prepare("INSERT INTO posts (slug, title, content, excerpt, published, status, published_at) VALUES (?, ?, ?, 'Résumé de départ', 1, 'published', datetime('now'))").run(slug, title, body).lastInsertRowid);
    db.prepare("INSERT INTO mk_content_sites (content_type, content_id, organization_id, site_id, address) VALUES ('post', ?, ?, ?, ?)").run(id, org, site, slug);
    return id;
  };
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db(); org = one("SELECT id FROM mk_organizations").id;
    A = mkSite("Site A", "site-a"); B = mkSite("Site B", "site-b");
    for (const [s, n] of [[A, "a"], [B, "b"]]) { const home = Number(db.prepare("INSERT INTO mk_landing_pages (organization_id, name, slug, title, status, site_id, published_at, kind, indexable) VALUES (?, ?, ?, ?, 'published', ?, datetime('now'), 'page', 1)").run(org, `Accueil ${n}`, `accueil-${n}`, `Accueil ${n}`, s).lastInsertRowid); db.prepare("UPDATE mk_sites SET home_page_id = ? WHERE id = ?").run(home, s); }
    assert.equal((await setDomain(A, "https://a.test")).status, 200); assert.equal((await setDomain(B, "https://b.test")).status, 200);
    mkPost(A, "article-a", "Titre-ARTICLE-A", "## Intertitre-A\n\nCORPS-UNIQUE-A premier paragraphe.\n\n### Sous-intertitre-A\n\nSecond paragraphe de A.");
    mkPost(A, "article-a2", "Titre-ARTICLE-A2", "CORPS-UNIQUE-A2");
    mkPost(B, "article-b", "Titre-ARTICLE-B", "CORPS-UNIQUE-B");
  });
  after(async () => { if (db) db.close(); if (srv) await srv.stop(); });

  test("les 100 modèles : utiliser → publier → l'article A s'affiche avec SON titre et SON contenu, jamais ceux d'un autre article ni d'un autre site", async () => {
    const keys = Catalog.entries("single_post").map((e) => e.key); let last = null;
    for (const key of keys) {
      const u = await post(U(A, "/api/bibliotheque/utiliser"), { type: "single_post", key }); assert.equal(u.status, 200, `${key} : ${u.text.slice(0, 200)}`);
      const t = JSON.parse(u.text).template; assert.equal(t.status, "draft", `${key} : brouillon`);
      // la copie du site = le document du catalogue (sans identifiants) : vignette, aperçu, éditeur et site publié partent de la même source
      const copy = JSON.parse(one("SELECT sections FROM mk_landing_pages WHERE id = ?", t.sourceId).sections);
      assert.equal(outline(copy), outline(Catalog.build("single_post", key, { formId: null }).sections), `${key} : la copie du site diffère du catalogue`);
      assert.equal((await post(U(A, `/api/modeles/${t.id}/publier`))).status, 200, `${key} : publication`);
      const r = await hostReq(srv, "a.test", "/blog/article-a"); assert.equal(r.status, 200, `${key} : article`);
      assert.match(r.text, /kw-theme-template/, `${key} : modèle appliqué`);
      assert.equal((r.text.match(/Titre-ARTICLE-A(?![0-9])/g) || []).length >= 1, true, `${key} : titre de l'article`);
      assert.equal((r.text.match(/CORPS-UNIQUE-A(?!2)/g) || []).length, 1, `${key} : contenu de l'article affiché une seule fois`);
      assert.doesNotMatch(r.text, /Titre-ARTICLE-B|CORPS-UNIQUE-B/, `${key} : contenu d'un autre site`);
      assert.doesNotMatch(r.text, /\{\{post\./, `${key} : étiquette dynamique non résolue`);
      const r2 = await hostReq(srv, "a.test", "/blog/article-a2"); assert.match(r2.text, /CORPS-UNIQUE-A2/, `${key} : le second article garde son contenu`); assert.doesNotMatch(r2.text, /CORPS-UNIQUE-A(?!2)/, `${key} : fuite du premier article`);
      assert.equal((await post(U(A, `/api/modeles/${t.id}/archiver`))).status, 200); last = t;
    }
    assert.ok(last);
    const b = await hostReq(srv, "b.test", "/blog/article-b"); assert.equal(b.status, 200); assert.doesNotMatch(b.text, /kw-theme-template/, "le site B n'est pas touché");
    assert.match(b.text, /CORPS-UNIQUE-B/);
  });
  test("fonctionnalités liées à l'article courant : le sommaire liste les intertitres de l'article, le partage vise l'adresse de l'article", async () => {
    const has = (t) => Catalog.entries("single_post").find((e) => JSON.stringify(Catalog.build("single_post", e.key).sections).includes(`"type":"${t}"`)).key;
    for (const key of [has("toc"), has("sharebuttons")]) {
      const t = JSON.parse((await post(U(A, "/api/bibliotheque/utiliser"), { type: "single_post", key })).text).template;
      assert.equal((await post(U(A, `/api/modeles/${t.id}/publier`))).status, 200);
      const r = await hostReq(srv, "a.test", "/blog/article-a"); assert.equal(r.status, 200);
      if (/"type":"toc"/.test(JSON.stringify(Catalog.build("single_post", key).sections))) {
        const nav = (r.text.match(/<nav[^>]*kw-toc[\s\S]*?<\/nav>/) || [""])[0];
        assert.match(nav, /Intertitre-A/, "sommaire : intertitre de l'article"); assert.match(nav, /Sous-intertitre-A/);
        const href = nav.match(/href="#([^"]+)"/)[1]; assert.ok(r.text.includes(`id="${href}"`), "l'ancre du sommaire existe dans l'article");
      } else {
        assert.match(r.text, /sharer\.php\?u=[^"]*article-a/, "partage : adresse de l'article, pas de la page-modèle");
      }
      assert.equal((await post(U(A, `/api/modeles/${t.id}/archiver`))).status, 200);
    }
  });
  test("modification, enregistrement et rechargement d'une copie (échantillon de 10 modèles) ; la bibliothèque reste intacte", async () => {
    const keys = Catalog.entries("single_post").map((e) => e.key).filter((_, i) => i % 10 === 3);
    for (const key of keys) {
      const t = JSON.parse((await post(U(A, "/api/bibliotheque/utiliser"), { type: "single_post", key })).text).template;
      const row = one("SELECT sections, revision FROM mk_landing_pages WHERE id = ?", t.sourceId), sections = JSON.parse(row.sections);
      const edit = JSON.parse(JSON.stringify(sections)); const heads = []; (function walk(x) { if (Array.isArray(x)) return x.forEach(walk); if (x && typeof x === "object") { if (x.type === "heading" && x.props && /post\.title/.test(x.props.text)) heads.push(x); Object.values(x).forEach(walk); } })(edit);
      assert.ok(heads.length); heads[0].styles = { ...(heads[0].styles || {}), desktop: { ...((heads[0].styles || {}).desktop || {}), color: "token:accent" } };
      const put = await boss.request(`/marketing/pages/${t.sourceId}/brouillon`, { method: "PUT", headers: ORIGIN(), json: { revision: row.revision, content: { title: "t", sections: edit } } }); assert.equal(put.status, 200, `${key} : ${put.text.slice(0, 200)}`);
      const back = one("SELECT draft, revision FROM mk_landing_pages WHERE id = ?", t.sourceId);
      assert.ok(back.revision > row.revision, `${key} : révision incrémentée`); assert.match(back.draft || "", /token:accent/, `${key} : la modification est rechargée depuis le brouillon enregistré`);
      await post(U(A, `/api/modeles/${t.id}/archiver`));
    }
    assert.equal(Catalog.entries("single_post").length, 100, "catalogue intact");
  });
  test("droits : sans connexion, un modèle d'article ne peut pas être utilisé", async () => {
    const use = await fetch(`${srv.base}${U(A, "/api/bibliotheque/utiliser")}`, { method: "POST", redirect: "manual", headers: { "Content-Type": "application/json", Origin: srv.base }, body: JSON.stringify({ type: "single_post", key: Catalog.entries("single_post")[0].key }) });
    assert.ok([301, 302, 401, 403].includes(use.status), `${use.status}`);
  });
  test("miniature et aperçu de chacun des 100 modèles : réponses valides, issues du même document", async () => {
    for (const e of Catalog.entries("single_post")) {
      const th = await boss.get(U(A, `/api/bibliotheque/single_post/${e.key}/miniature`)); assert.equal(th.status, 200, `${e.key} miniature`); assert.match(th.text, /<svg/);
      const ap = await boss.get(U(A, `/api/bibliotheque/single_post/${e.key}/apercu`)); assert.equal(ap.status, 200, `${e.key} aperçu`); assert.match(ap.text, /kw-theme-template/);
    }
  });
});
