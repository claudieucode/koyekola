// Thèmes autonomes (paquets) : registre sans erreur, isolation du CSS par construction, indépendance vis-à-vis de la charte de Kolakisa, diversité réelle entre thèmes,
// balisage intact après le filtre de sécurité du Page Builder, liens vivants, installation / activation / options / retour en arrière par site, fichiers publics.
const { test, describe, before } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const http = require("node:http");

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "kola-themes-packs-"));
process.env.DATA_DIR = TMP; process.env.NODE_ENV = "test";
const db = require("../src/config/database");
const { migrate } = require("../src/marketing/db/migrate");
const { MIGRATIONS, quiet } = require("./marketing-helpers");
const library = require("../src/marketing/themes/library");
const packs = require("../src/marketing/themes/packs");
const audit = require("../src/marketing/themes/packs/audit");
const themes = require("../src/services/themes");
const catalog = require("../src/marketing/themes/catalog");
const tokensLib = require("../src/marketing/pages/tokens");

const specs = () => library.load().specs;
const key = () => specs().find((s) => s.key === "arene").key; // thème de référence du banc d'essai
const ctx = () => ({ db, organizationId: 1, userId: 1, can: () => true });
let siteA, siteB;
const siteTokens = (id) => JSON.parse(db.prepare("SELECT tokens FROM mk_sites WHERE id = ?").get(id).tokens);
const pages = () => require("../src/marketing/pages");

before(() => {
  migrate(db, { dir: MIGRATIONS, dbPath: ":memory:", log: quiet });
  db.exec("INSERT INTO mk_organizations (name, slug) VALUES ('Org', 'org')");
  const mk = (n) => Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (1, ?, ?, '{}')").run(n, n.toLowerCase()).lastInsertRowid);
  siteA = mk("Alpha"); siteB = mk("Beta");
});

describe("registre des thèmes autonomes", () => {
  test("aucun paquet écarté, au moins un thème, catalogue = bibliothèque", () => {
    assert.deepEqual(library.problems(), []);
    assert.ok(specs().length >= 1);
    assert.deepEqual(catalog.catalog().map((m) => m.key).sort(), specs().map((s) => s.key).sort());
  });
  test("identifiants, noms et descriptions uniques ; chaque thème a un concept, une empreinte, 4 pages métier minimum et ses options", () => {
    const s = specs();
    for (const k of ["key", "name", "description", "brand"]) assert.equal(new Set(s.map((x) => x[k])).size, s.length, `${k} uniques`);
    for (const t of s) {
      assert.ok(t.concept && t.concept.length > 20, `${t.key} : concept`);
      assert.ok(t.pages.length >= 7, `${t.key} : ${t.pages.length} pages`);
      assert.ok((t.options || []).length >= 3, `${t.key} : options de personnalisation`);
    }
  });
});

describe("isolation graphique", () => {
  test("chaque règle CSS d'un thème est confinée à son corps de page ; aucune fuite html / :root", () => {
    for (const k of specs().map((s) => s.key)) {
      const css = packs.get(k).css;
      assert.ok(css.length > 4000, `${k} : feuille de styles réelle`);
      const rules = css.replace(/@keyframes[^{]+\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g, "").replace(/@media[^{]+\{|@supports[^{]+\{/g, "");
      for (const m of rules.matchAll(/(?:^|\})([^{}@]+)\{/g)) for (const sel of m[1].split(",")) assert.ok(sel.trim().startsWith(`body[data-kw-pack="${k}"]`), `${k} : sélecteur non confiné « ${sel.trim().slice(0, 50)} »`);
      assert.doesNotMatch(css, /(^|[\s,{}])(html|:root)\b/i);
    }
  });
  test("le chargeur refuse html, :root, @import et les animations non préfixées", () => {
    assert.throws(() => packs.scopeCss("html{a:b}", "zz"), /interdit/);
    assert.throws(() => packs.scopeCss(":root{--a:1}", "zz"), /interdit/);
    assert.throws(() => packs.scopeCss("@import url(x);", "zz"), /style\.css/);
    assert.throws(() => packs.scopeCss("@keyframes autre{from{a:b}}", "zz"), /doit commencer par/);
    assert.equal(packs.scopeCss(".a{b:c}", "zz"), 'body[data-kw-pack="zz"] .a{b:c}');
  });
  test("aucun thème n'emprunte la charte de Kolakisa (couleurs, polices, jetons ou classes de l'administration)", () => {
    const cms = tokensLib.DEFAULT_TOKENS;
    for (const s of specs()) {
      const css = packs.get(s.key).css, js = packs.get(s.key).js;
      assert.notEqual(s.tokens.colors.primary.toLowerCase(), cms.colors.primary, `${s.key} : couleur principale de Kolakisa`);
      assert.notEqual(s.tokens.colors.secondary.toLowerCase(), cms.colors.secondary, `${s.key} : bleu marine de Kolakisa`);
      assert.notEqual(s.tokens.fonts.heading, cms.fonts.heading, `${s.key} : police de titres de Kolakisa`);
      assert.doesNotMatch(css + js, /--kb-|--k-accent|kola-brand|kola-stable|\bkb-[a-z]/, `${s.key} : jeton ou classe de l'administration`);
      assert.doesNotMatch(css, /#0277b6|#0b2a40/i, `${s.key} : bleu de la charte`);
    }
  });
  test("mouvement : chaque thème respecte prefers-reduced-motion ; son script ne s'active que sur son propre thème", () => {
    for (const s of specs()) {
      const p = packs.get(s.key);
      assert.match(p.css, /prefers-reduced-motion/, `${s.key} : CSS`);
      if (p.js) { assert.match(p.js, new RegExp(`data-kw-pack["']\\)\\s*!==\\s*["']${s.key}["']`), `${s.key} : garde de thème`); assert.match(p.js, /prefers-reduced-motion/, `${s.key} : JS`); assert.ok(p.js.length < 20000, `${s.key} : JS léger`); }
      assert.ok(p.css.length < 70000, `${s.key} : CSS ${p.css.length} octets`);
    }
  });
});

describe("qualité des pages", () => {
  test("balisage intact après le filtre de sécurité, liens vivants, un seul titre de niveau 1 par page", () => {
    for (const s of specs()) assert.deepEqual(audit.auditPack(s), [], s.key);
  });
  test("chaque page se compile en sections valides du Page Builder", () => {
    const sections = require("../src/marketing/pages/sections");
    for (const s of specs()) for (const p of s.pages) {
      const raw = library.pageSections(s.key, p.key);
      assert.ok(Array.isArray(raw) && raw.length >= 2, `${s.key}/${p.key}`);
      assert.doesNotThrow(() => sections.normalizeSections({ organizationId: 1 }, raw.map((x, i) => ({ ...x, id: `s${String(i).padStart(7, "0")}` }))), `${s.key}/${p.key}`);
    }
  });
});

describe("diversité contrôlée", () => {
  test("aucune composition (en-tête, hero, grille, mouvement) n'est partagée et la distance minimale est respectée", () => {
    assert.deepEqual(audit.auditDiversity(specs(), 0.6), []);
  });
  test("les pages d'un même thème n'ont pas toutes la même structure", () => {
    for (const s of specs()) {
      const shapes = new Set(s.pages.filter((p) => !["contact", "recherche", "introuvable"].includes(p.key)).map((p) => audit.htmlNodes(library.pageSections(s.key, p.key)).map((h) => (h.match(/class="([^" ]+)/g) || []).slice(0, 40).join("|")).join("#")));
      assert.ok(shapes.size >= 4, `${s.key} : ${shapes.size} structures de pages différentes`);
    }
  });
});

describe("jetons et options", () => {
  test("les jetons conservent l'identifiant du thème ; les anciens jetons n'en ont pas ; une clé invalide est écartée", () => {
    assert.equal(tokensLib.normalizeTokens({}).pack.key, "");
    assert.equal(tokensLib.normalizeTokens({ pack: { key: "arene", options: { accent: "#ff0000", "bad key": "x", ok: "<script>" } } }).pack.options.accent, "#ff0000");
    assert.deepEqual(tokensLib.normalizeTokens({ pack: { key: "arene", options: { ok: "<script>" } } }).pack.options, {});
    assert.equal(tokensLib.normalizeTokens({ pack: { key: "../../etc" } }).pack.key, "");
  });
  test("options : valeurs invalides = valeur par défaut du thème, aucune injection dans les variables CSS", () => {
    const s = specs()[0];
    const first = s.options[0];
    const r = packs.resolveOptions(s, { [first.key]: "red;}body{display:none", zzz: "1" });
    assert.equal(r[first.key], first.default);
    assert.equal(r.zzz, undefined);
    const head = packs.headHtml({ key: s.key, options: { [first.key]: "red;}body{display:none" } });
    assert.doesNotMatch(head.vars + head.attr, /display:none|;\}/);
  });
});

describe("installation, activation, options et retour en arrière (par site)", () => {
  test("installer puis activer : le site public charge le CSS du thème, pas l'autre site", () => {
    assert.equal(pages().getSite(ctx(), siteA).assets.pack.link, "");
    themes.installFromCatalog(ctx(), siteA, key());
    themes.activate(ctx(), siteA, key());
    assert.equal(siteTokens(siteA).pack.key, key());
    const a = pages().getSite(ctx(), siteA).assets.pack;
    assert.match(a.link, new RegExp(`/theme-packs/${key()}/style\\.css\\?v=[0-9a-f]{10}`));
    assert.match(a.attr, new RegExp(`data-kw-pack="${key()}"`));
    assert.equal(pages().getSite(ctx(), siteB).assets.pack.link, "", "l'autre site n'est pas touché");
  });
  test("options : enregistrées pour le site actif seulement, rétablissables", () => {
    const o = specs().find((s) => s.key === key()).options.find((x) => x.type === "color");
    const val = o.type === "color" ? "#123456" : o.type === "choice" ? o.choices[o.choices.length - 1][0] : String(o.max);
    themes.setPackOptions(ctx(), siteA, key(), { [o.key]: val });
    assert.equal(themes.packOptionValues(ctx(), siteA, key())[o.key], val);
    assert.ok(pages().getSite(ctx(), siteA).assets.pack.vars.includes(val) || pages().getSite(ctx(), siteA).assets.pack.attr.includes(val));
    assert.throws(() => themes.setPackOptions(ctx(), siteB, key(), { [o.key]: val }), /actif/);
    themes.setPackOptions(ctx(), siteA, key(), {}, { reset: true });
    assert.equal(themes.packOptionValues(ctx(), siteA, key())[o.key], o.default);
  });
  test("revenir au thème précédent retire le CSS du thème sans toucher au contenu", () => {
    const before = db.prepare("SELECT COUNT(*) n FROM mk_landing_pages").get().n;
    themes.revert(ctx(), siteA);
    assert.equal(siteTokens(siteA).pack.key || "", "");
    assert.equal(pages().getSite(ctx(), siteA).assets.pack.link, "");
    assert.equal(db.prepare("SELECT COUNT(*) n FROM mk_landing_pages").get().n, before);
  });
  test("pages de démonstration : créées en brouillon seulement, sans rien écraser", () => {
    const r = themes.installDemo(ctx(), siteA, key(), { menu: false });
    assert.ok(r.pages.length > 0);
    assert.equal(r.pages.length, specs().find((s) => s.key === key()).pages.length);
    const rows = db.prepare("SELECT status FROM mk_landing_pages WHERE site_id = ?").all(siteA);
    assert.ok(rows.length >= r.pages.length);
    assert.ok(rows.every((x) => x.status === "draft"));
  });
});

describe("fichiers publics des thèmes", () => {
  test("/theme-packs/<clé>/style.css et motion.js : types, cache, 404 sur thème ou fichier inconnu, aucune traversée de dossier", async () => {
    const express = require("express");
    const app = express(); app.use(require("../src/marketing/web/themePackPublic")());
    const server = await new Promise((r) => { const s = app.listen(0, "127.0.0.1", () => r(s)); });
    const get = (p) => new Promise((resolve) => http.get({ host: "127.0.0.1", port: server.address().port, path: p }, (res) => { let b = ""; res.on("data", (c) => (b += c)); res.on("end", () => resolve({ status: res.statusCode, headers: res.headers, body: b })); }));
    try {
      const k = key();
      const css = await get(`/theme-packs/${k}/style.css`);
      assert.equal(css.status, 200); assert.match(css.headers["content-type"], /text\/css/); assert.match(css.headers["cache-control"], /max-age=\d+/); assert.match(css.body, new RegExp(`body\\[data-kw-pack="${k}"\\]`));
      const etag = css.headers.etag; assert.ok(etag);
      const again = await new Promise((resolve) => http.get({ host: "127.0.0.1", port: server.address().port, path: `/theme-packs/${k}/style.css`, headers: { "if-none-match": etag } }, (res) => resolve(res.statusCode)));
      assert.equal(again, 304);
      assert.equal((await get(`/theme-packs/inconnu/style.css`)).status, 404);
      assert.equal((await get(`/theme-packs/${k}/pack.js`)).status, 404);
      assert.equal((await get(`/theme-packs/..%2F..%2Fserver/style.css`)).status, 404);
    } finally { server.close(); }
  });
});
