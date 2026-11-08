// Article individuel : IDENTITÉ GRAPHIQUE INDÉPENDANTE. Les 100 modèles portent leurs propres couleurs et polices (valeurs fixes) : aucun jeton du site, aucune police « du site »,
// lisibilité vérifiée (contraste WCAG), réglages natifs conservés par le moteur, clés de modèles inchangées. Scénario de bout en bout : site bleu marine + modèle beige/noir/blanc → le modèle garde son aspect,
// la charte du site change → le modèle ne change pas ; un autre site n'est pas touché.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");
const Catalog = require("../src/themeBuilder/catalog");
const Own = require("../src/themeBuilder/catalog/single_post/identities");

const lum = (h) => { const v = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; };
const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
const six = (c) => /^#[0-9a-f]{6}$/i.test(c);

describe("Article individuel : identités propres (code)", () => {
  const all = Catalog.entries("single_post");
  test("33 identités ou plus, toutes à couleurs fixes et polices de la bibliothèque ; clés de modèles inchangées (« mise en page.ancienne identité »)", () => {
    assert.ok(Own.ALL.length >= 30, `${Own.ALL.length}`);
    assert.equal(new Set(Own.ALL.map((x) => x.key)).size, Own.ALL.length, "clés d'identité uniques");
    for (const id of Own.ALL) { for (const c of ["bg", "fg", "mute", "alt", "accent", "onAccent"]) assert.ok(six(id[c]), `${id.key}.${c} : ${id[c]}`); assert.match(id.font, /^font\./); assert.match(id.head, /^font\./); }
    for (const e of all) assert.match(e.key, /\.(clair|marque|nuit|editorial|doux)$/, `${e.key} : l'ancienne clé est conservée (liens d'aperçu existants)`);
    assert.ok(new Set(all.map((e) => e.skinKey)).size >= 30, "au moins 30 identités réellement utilisées");
  });
  test("lisibilité : texte/fond ≥ 4,5, texte d'accent/accent ≥ 4,5, accent/fond ≥ 3, texte secondaire/fond ≥ 3 pour chaque identité", () => {
    for (const id of Own.ALL) {
      assert.ok(ratio(id.fg, id.bg) >= 4.5, `${id.key} : texte/fond ${ratio(id.fg, id.bg).toFixed(2)}`);
      assert.ok(ratio(id.onAccent, id.accent) >= 4.5, `${id.key} : texte d'accent ${ratio(id.onAccent, id.accent).toFixed(2)}`);
      assert.ok(ratio(id.accent, id.bg) >= 3, `${id.key} : accent/fond ${ratio(id.accent, id.bg).toFixed(2)}`);
      assert.ok(ratio(id.mute, id.bg) >= 3, `${id.key} : secondaire/fond ${ratio(id.mute, id.bg).toFixed(2)}`);
    }
  });
  test("les 100 modèles : aucun jeton du site (token:…), aucune police « du site », réglages « parties » du contenu conservés par le moteur", () => {
    const sections = require("../src/marketing/pages/sections");
    const ctx = { db: null, organizationId: 1, settings: { get: () => "[]", set() {} } };
    for (const e of all) {
      const doc = Catalog.build("single_post", e.key), raw = JSON.stringify(doc.sections);
      assert.doesNotMatch(raw, /token:/, `${e.key} : dépend de la charte du site`);
      const fams = [...raw.matchAll(/"fontFamily":"([^"]+)"/g)].map((m) => m[1]);
      for (const f of fams) assert.match(f, /^font\./, `${e.key} : police « ${f} » hors bibliothèque`);
      assert.match(raw, /"type":"postcontent"[^]*?"parts":\{/, `${e.key} : contenu de l'article sans identité propre`);
      const norm = sections.normalizeSections(ctx, JSON.parse(raw).map((s) => ({ ...s, id: s.id || sections.newSectionId() })));
      assert.match(JSON.stringify(norm), /"parts":\{[^]*"link":\{/, `${e.key} : le moteur a supprimé les liens du contenu`);
    }
  });
  test("diversité : deux mises en page voisines n'ont jamais la même identité ; chaque identité sert plusieurs familles", () => {
    for (let i = 1; i < all.length; i += 1) if (all[i].skinKey === all[i - 1].skinKey) assert.notEqual(all[i].layoutId, all[i - 1].layoutId);
    const adjacentSame = all.slice(1).filter((e, i) => e.skinKey === all[i].skinKey && e.layoutKey === all[i].layoutKey).length;
    assert.ok(adjacentSame <= 3, `${adjacentSame} paires voisines de même famille et même identité`);
  });
});

describe("Article individuel : le modèle garde SON identité quand la charte du site change (serveur réel)", () => {
  let srv, boss, db, org, A, B;
  const ORIGIN = () => ({ Origin: srv.base });
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const U = (s, p = "") => `/marketing/site-web/sites/${s}/constructeur-de-theme${p}`;
  const post = (path, body) => boss.request(path, { method: "POST", json: body || {}, headers: ORIGIN() });
  const mkSite = (name, slug) => Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, ?, ?, '{}')").run(org, name, slug).lastInsertRowid);
  const hostReq = (host, path) => { const u = new URL(srv.base); return new Promise((resolve, reject) => { const r = http.request({ host: u.hostname, port: u.port, path, method: "GET", headers: { Host: host, "User-Agent": "Mozilla/5.0 Chrome/120 Safari/537.36" } }, (resp) => { let text = ""; resp.on("data", (d) => (text += d)); resp.on("end", () => resolve({ status: resp.statusCode, text })); }); r.on("error", reject); r.end(); }); };
  const setSite = async (site, { url, colors } = {}) => {
    const cur = JSON.parse((await boss.get(`/marketing/site-web/sites/${site}/reglages.json`)).text);
    const tokens = colors ? { ...cur.tokens, colors: { ...cur.tokens.colors, ...colors } } : cur.tokens;
    const settings = url ? { ...cur.settings, seo: { ...cur.settings.seo, publicUrl: url } } : cur.settings;
    const r = await boss.request(`/marketing/site-web/sites/${site}/reglages.json`, { method: "PUT", json: { settings, tokens, revision: cur.revision }, headers: ORIGIN() });
    assert.equal(r.status, 200, r.text.slice(0, 300));
  };
  // règles propres aux éléments du modèle (.kw-n-<id>) : ce que le modèle écrit lui-même, indépendamment de la charte du site
  const own = (html) => [...html.matchAll(/\.kw-n-[a-z0-9]+[^{}]*\{[^}]*\}/g)].map((m) => m[0]).join("\n");
  const siteVars = (html) => (html.match(/class="kw-theme-template[^"]*"[^>]*style="([^"]*)"/) || [, ""])[1];
  const mkPost = (site, slug, title) => { const id = Number(db.prepare("INSERT INTO posts (slug, title, content, excerpt, published, status, published_at) VALUES (?, ?, ?, 'Résumé', 1, 'published', datetime('now'))").run(slug, title, "## Intertitre\n\nCORPS-IDENTITE premier paragraphe.").lastInsertRowid); db.prepare("INSERT INTO mk_content_sites (content_type, content_id, organization_id, site_id, address) VALUES ('post', ?, ?, ?, ?)").run(id, org, site, slug); };
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db(); org = one("SELECT id FROM mk_organizations").id;
    A = mkSite("Site Marine", "site-marine"); B = mkSite("Site Témoin", "site-temoin");
    for (const [s, n] of [[A, "a"], [B, "b"]]) db.prepare("INSERT INTO mk_landing_pages (organization_id, name, slug, title, status, site_id, published_at, kind, indexable) VALUES (?, ?, ?, ?, 'published', ?, datetime('now'), 'page', 1)").run(org, `Accueil ${n}`, `accueil-${n}`, `Accueil ${n}`, s);
    await setSite(A, { url: "https://a.test", colors: { primary: "#0b2a40", secondary: "#0b2a40", background: "#0b2a40", surface: "#12395a", text: "#ffffff" } });
    await setSite(B, { url: "https://b.test" });
    mkPost(A, "article-a", "Titre-IDENTITE-A"); mkPost(B, "article-b", "Titre-IDENTITE-B");
  });
  after(async () => { if (db) db.close(); if (srv) await srv.stop(); });

  test("scénario : site bleu marine + modèle beige → le modèle garde son aspect ; la charte du site change → le modèle ne change pas ; l'autre site n'est pas touché", async () => {
    const beige = Catalog.entries("single_post").find((e) => e.skinKey === "sable-voyage"), id = Own.ALL.find((x) => x.key === "sable-voyage");
    const t = JSON.parse((await post(U(A, "/api/bibliotheque/utiliser"), { type: "single_post", key: beige.key })).text).template;
    assert.equal((await post(U(A, `/api/modeles/${t.id}/publier`))).status, 200);
    const marine = await hostReq("a.test", "/blog/article-a");
    assert.equal(marine.status, 200); assert.match(marine.text, /kw-theme-template/);
    assert.match(siteVars(marine.text), /#0b2a40/i, "la charte du site est bien bleu marine");
    const css1 = own(marine.text);
    assert.ok(css1.toLowerCase().includes(id.bg), "le modèle écrit lui-même son fond beige");
    assert.doesNotMatch(css1, /var\(--kw-(primary|secondary|accent|background|surface|text|muted|font-body|font-heading|on-primary)/, "aucune règle du modèle ne lit la charte du site");
    // la charte du site change : rouge vif
    await setSite(A, { colors: { primary: "#d00000", secondary: "#7a0000", background: "#fff0f0", surface: "#ffe0e0", text: "#220000", accent: "#00a0ff" } });
    const rouge = await hostReq("a.test", "/blog/article-a");
    assert.equal(rouge.status, 200); assert.match(siteVars(rouge.text), /#d00000/i, "la charte du site a bien changé");
    assert.equal(own(rouge.text), css1, "les règles du modèle sont identiques : le modèle indépendant n'a pas bougé");
    // l'autre site (sans modèle d'article publié) n'est pas touché
    const b = await hostReq("b.test", "/blog/article-b"); assert.equal(b.status, 200); assert.doesNotMatch(b.text, /kw-theme-template/);
    assert.doesNotMatch(b.text, /fbf7f0/i, "aucune couleur du modèle ne fuit sur le site B");
  });
});
