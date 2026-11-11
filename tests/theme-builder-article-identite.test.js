// Article individuel v3 : IDENTITÉ GRAPHIQUE INDÉPENDANTE de chacun des 100 modèles. Code : 100 identités distinctes à valeurs fixes (aucun jeton du site, polices de la bibliothèque, contraste), racine isolée,
// fiches de conception cohérentes, modes « suit le site » / « hybride » du catalogue. Serveur réel : site bleu marine puis charte hostile → le modèle ne change pas ; trois modes d'identité de bout en bout.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");
const Catalog = require("../src/themeBuilder/catalog");
const D = require("../src/themeBuilder/catalog/single_post");
const { ARCH } = require("../src/themeBuilder/catalog/single_post/v3/concepts");
const { ratio } = require("../src/themeBuilder/catalog/single_post/v3/skin");

const hue = (h) => { const [r, g, b] = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255), mx = Math.max(r, g, b), mn = Math.min(r, g, b); if (mx === mn) return -1; const d = mx - mn; const x = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; return Math.round(((x * 60) + 360) % 360); };

describe("Article individuel v3 : 100 identités propres (code)", () => {
  const all = Catalog.entries("single_post");
  test("100 identités distinctes à couleurs fixes et polices de la bibliothèque, lisibles (contraste WCAG)", () => {
    assert.equal(D.skins.length, 100); assert.equal(new Set(D.skins.map((s) => s.key)).size, 100);
    assert.equal(new Set(D.skins.map((s) => `${s.bg}${s.accent}${s.head}${s.font}`)).size, 100, "deux identités identiques");
    for (const s of D.skins) {
      for (const c of ["bg", "fg", "mute", "alt", "accent", "onAccent"]) assert.match(s[c], /^#[0-9a-f]{6}$/i, `${s.key}.${c}`);
      assert.match(s.font, /^font\./); assert.match(s.head, /^font\./);
      assert.ok(ratio(s.fg, s.bg) >= 4.5 && ratio(s.mute, s.bg) >= 4.4 && ratio(s.onAccent, s.accent) >= 4.5 && ratio(s.fg, s.alt) >= 4.5, `${s.key} : contraste`);
    }
    assert.ok(new Set(D.skins.map((s) => Math.floor(hue(s.accent) / 30))).size >= 9, "au moins 9 teintes d'accent sur 12");
    assert.ok(new Set(D.skins.flatMap((s) => [s.head, s.font])).size >= 45, "au moins 45 polices différentes");
  });
  test("les 100 modèles : aucun jeton du site, aucune police « du site », racine isolée (variables --kw-* redéfinies, police et couleur de base posées)", () => {
    for (const e of all) {
      const doc = Catalog.build("single_post", e.key), raw = JSON.stringify(doc.sections);
      assert.doesNotMatch(raw, /token:/, `${e.key} : dépend de la charte du site`);
      for (const m of raw.matchAll(/"fontFamily":"([^"]+)"/g)) assert.match(m[1], /^font\./, `${e.key} : police « ${m[1]} » hors bibliothèque`);
      for (const top of doc.sections[0].children) {
        assert.match(top.css || "", /--kw-primary:#/, `${e.key} : racine sans variables locales`);
        const dk = top.styles.desktop; assert.ok(dk.fontFamily && dk.color && dk.fontSize && dk.lineHeight, `${e.key} : racine sans police/couleur de base`);
      }
      assert.match(raw, /"type":"postcontent"[^]*?"parts":\{/, `${e.key} : contenu sans identité propre`);
    }
  });
  test("fiches de conception : 100 concepts AI-001 à AI-100, 28 archétypes au moins, aucune structure répétée, 13 familles ou plus", () => {
    const cs = D.layouts.map((l) => l.concept);
    assert.deepEqual(cs.map((c) => c.id), Array.from({ length: 100 }, (_, i) => `AI-${String(i + 1).padStart(3, "0")}`));
    assert.ok(new Set(cs.map((c) => c.arch)).size >= 28); for (const c of cs) assert.ok(ARCH[c.arch], c.id);
    assert.equal(new Set(cs.map((c) => `${c.arch}|${c.title}|${c.hero}|${c.v.join("")}`)).size, 100);
    assert.ok(D.families.length >= 30, `${D.families.length} directions artistiques`);
  });
  test("modes du catalogue : « suit le site » = plus aucune valeur de l'identité ; « hybride » = accent du site seulement, pour les 100 modèles", () => {
    for (const e of all) {
      const s = D.skins.find((x) => x.key === e.skinKey);
      const site = JSON.stringify(Catalog.build("single_post", e.key, { identity: "site" }).sections).toLowerCase();
      assert.match(site, /token:/); for (const c of ["bg", "fg", "alt", "accent"]) assert.ok(!site.includes(`"${s[c].toLowerCase()}"`), `${e.key} : ${c} subsiste en mode site`);
      const hyb = JSON.stringify(Catalog.build("single_post", e.key, { identity: "hybrid" }).sections).toLowerCase();
      assert.ok(hyb.includes("token:primary") && hyb.includes(`"${s.bg.toLowerCase()}"`) && (s.accent.toLowerCase() === s.fg.toLowerCase() || !hyb.includes(`"${s.accent.toLowerCase()}"`)), `${e.key} : hybride`); // accent = encre : la couleur reste (texte)
    }
  });
});

describe("Article individuel v3 : le modèle garde son identité, trois modes de bout en bout (serveur réel)", () => {
  let srv, boss, db, org, A, B;
  const ORIGIN = () => ({ Origin: srv.base });
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const U = (s, p = "") => `/marketing/site-web/sites/${s}/constructeur-de-theme${p}`;
  const post = (path, body) => boss.request(path, { method: "POST", json: body || {}, headers: ORIGIN() });
  const mkSite = (name, slug) => Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, ?, ?, '{}')").run(org, name, slug).lastInsertRowid);
  const hostReq = (host, path) => { const u = new URL(srv.base); return new Promise((resolve, reject) => { const r = http.request({ host: u.hostname, port: u.port, path, method: "GET", headers: { Host: host, "User-Agent": "Mozilla/5.0 Chrome/120 Safari/537.36" } }, (resp) => { let text = ""; resp.on("data", (d) => (text += d)); resp.on("end", () => resolve({ status: resp.statusCode, text })); }); r.on("error", reject); r.end(); }); };
  const setSite = async (site, { url, colors, mut } = {}) => {
    const cur = JSON.parse((await boss.get(`/marketing/site-web/sites/${site}/reglages.json`)).text);
    const tokens = JSON.parse(JSON.stringify(cur.tokens)); if (colors) Object.assign(tokens.colors, colors); if (mut) mut(tokens);
    const settings = url ? { ...cur.settings, seo: { ...cur.settings.seo, publicUrl: url } } : cur.settings;
    const r = await boss.request(`/marketing/site-web/sites/${site}/reglages.json`, { method: "PUT", json: { settings, tokens, revision: cur.revision }, headers: ORIGIN() }); assert.equal(r.status, 200, r.text.slice(0, 300));
  };
  // règles propres aux éléments du modèle, identifiants neutralisés (chaque installation en crée de nouveaux)
  const own = (html) => [...html.matchAll(/\.kw-n-[a-z0-9]+[^{}]*\{[^}]*\}/g)].map((m) => m[0].replace(/kw-n-[a-z0-9]+/g, "kw-n-X")).join("\n");
  const siteVars = (html) => (html.match(/class="kw-theme-template[^"]*"[^>]*style="([^"]*)"/) || [, ""])[1];
  const mkPost = (site, slug, title) => { const pid = Number(db.prepare("INSERT INTO posts (slug, title, content, excerpt, published, status, published_at) VALUES (?, ?, ?, 'Résumé', 1, 'published', datetime('now'))").run(slug, title, "## Intertitre\n\nCORPS-IDENTITE premier paragraphe.").lastInsertRowid); db.prepare("INSERT INTO mk_content_sites (content_type, content_id, organization_id, site_id, address) VALUES ('post', ?, ?, ?, ?)").run(pid, org, site, slug); };
  const KEY = "grand-numero.ai-001", BG = "#f2efe9";
  const install = async (identity) => { const r = await post(U(A, "/api/bibliotheque/utiliser"), { type: "single_post", key: KEY, ...(identity ? { identity } : {}) }); assert.equal(r.status, 200, r.text.slice(0, 300)); const t = JSON.parse(r.text).template; assert.equal((await post(U(A, `/api/modeles/${t.id}/publier`))).status, 200); return t; };
  const archive = async (t) => assert.equal((await post(U(A, `/api/modeles/${t.id}/archiver`))).status, 200);
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

  test("scénario : site bleu marine + modèle beige → identité gardée ; charte, polices, titres, liens et boutons du site changés → le modèle ne change pas ; l'autre site n'est pas touché", async () => {
    const t = await install();
    const marine = await hostReq("a.test", "/blog/article-a"); assert.equal(marine.status, 200); assert.match(marine.text, /kw-theme-template/);
    assert.match(siteVars(marine.text), /#0b2a40/i, "la charte du site est bien bleu marine");
    const css1 = own(marine.text); assert.ok(css1.toLowerCase().includes(BG), "le modèle écrit lui-même son fond beige");
    assert.doesNotMatch(css1, /var\(--kw-(primary|secondary|accent|background|surface|text|muted|font-body|font-heading|on-primary)/, "aucune règle du modèle ne lit la charte du site");
    await setSite(A, { colors: { primary: "#d00000", secondary: "#7a0000", background: "#fff0f0", surface: "#ffe0e0", text: "#220000", accent: "#00a0ff" }, mut: (tk) => { tk.fonts = { heading: "font.fredoka", body: "font.comfortaa", button: "font.fredoka", link: "font.comfortaa" }; tk.type.h1 = { ...tk.type.h1, size: 90, color: "#ff00aa" }; tk.link = { color: "#ff0000", hoverColor: "#00ff00", underline: "always" }; tk.buttons.normal = { bg: "#00ff00", color: "#ff0000", border: "#ff0000" }; tk.radius.button = 40; } });
    const hostile = await hostReq("a.test", "/blog/article-a"); assert.equal(hostile.status, 200); assert.match(siteVars(hostile.text), /#d00000/i, "la charte du site a bien changé");
    assert.equal(own(hostile.text), css1, "les règles du modèle sont identiques : le modèle indépendant n'a pas bougé");
    const b = await hostReq("b.test", "/blog/article-b"); assert.equal(b.status, 200); assert.doesNotMatch(b.text, /kw-theme-template/); assert.doesNotMatch(b.text, /f2efe9/i, "aucune couleur du modèle ne fuit sur le site B");
    await archive(t);
    await setSite(A, { colors: { primary: "#0b2a40", background: "#0b2a40" } });
  });
  test("trois modes de bout en bout : installé « suit le site » → le rendu suit la charte ; retour « indépendant » = rendu d'origine ; hybride = accent du site ; refus et isolation", async () => {
    const own0 = await install("own"); const css0 = own((await hostReq("a.test", "/blog/article-a")).text); await archive(own0);
    const t = await install("site");
    const row = one("SELECT origin_key, identity_mode FROM mk_tb_templates WHERE id = ?", t.id); assert.equal(row.origin_key, KEY); assert.equal(row.identity_mode, "site");
    const cssS = own((await hostReq("a.test", "/blog/article-a")).text);
    assert.match(cssS, /var\(--kw-(primary|background|text|surface)/, "suit le site : variables de la charte"); assert.ok(!cssS.toLowerCase().includes(BG), "plus de fond beige");
    const pub = async () => assert.equal((await post(U(A, `/api/modeles/${t.id}/publier`))).status, 200); // la bascule agit sur le brouillon : on republie pour voir le site public
    const back = await post(U(A, `/api/modeles/${t.id}/identite`), { mode: "own" }); assert.equal(back.status, 200, back.text.slice(0, 300)); await pub();
    assert.equal(one("SELECT identity_mode FROM mk_tb_templates WHERE id = ?", t.id).identity_mode, "own");
    assert.equal(own((await hostReq("a.test", "/blog/article-a")).text), css0, "retour indépendant : rendu identique à une installation indépendante");
    const hyb = await post(U(A, `/api/modeles/${t.id}/identite`), { mode: "hybrid" }); assert.equal(hyb.status, 200); await pub();
    const cssH = own((await hostReq("a.test", "/blog/article-a")).text); assert.ok(cssH.toLowerCase().includes(BG), "hybride : fond du modèle gardé"); assert.match(cssH, /var\(--kw-primary/, "hybride : accent du site");
    assert.equal((await post(U(A, `/api/modeles/${t.id}/identite`), { mode: "inconnu" })).status, 422);
    assert.equal((await post(U(B, `/api/modeles/${t.id}/identite`), { mode: "site" })).status, 404, "le modèle de A n'existe pas pour B");
    const anon = await fetch(`${srv.base}${U(A, `/api/modeles/${t.id}/identite`)}`, { method: "POST", redirect: "manual", headers: { "Content-Type": "application/json", Origin: srv.base }, body: JSON.stringify({ mode: "site" }) }); assert.ok([301, 302, 401, 403].includes(anon.status), `${anon.status}`);
    await archive(t);
  });
});
