// Identité graphique d'un modèle : trois modes (indépendant / suit le site / hybride), sans jamais réécrire le document. Code : transformation exacte et réversible sur les 100 modèles d'article.
// Serveur réel : mémorisation à l'insertion, changement de mode, rendu public qui suit (ou non) la charte du site, retour au mode indépendant identique à l'octet, copie, isolation entre sites, droits.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");
const Catalog = require("../src/themeBuilder/catalog");
const IM = require("../src/themeBuilder/identityMode");
const Own = require("../src/themeBuilder/catalog/single_post/identities");

const snapOf = (e) => IM.snapshot(Own.ALL.find((x) => x.key === e.skinKey));

describe("Identité d'un modèle : transformation (code, 100 modèles d'article)", () => {
  const all = Catalog.entries("single_post");
  test("« suit le site » : plus aucune valeur de l'identité (couleurs, polices) dans le document rendu, le document d'origine est intact", () => {
    for (const e of all) {
      const doc = Catalog.build("single_post", e.key).sections, before = JSON.stringify(doc), cfg = { ...snapOf(e), mode: "site", use: Object.keys(IM.GROUPS) };
      const out = JSON.stringify(IM.apply(doc, cfg));
      assert.equal(JSON.stringify(doc), before, `${e.key} : le document d'origine a été modifié`);
      for (const r of ["bg", "fg", "mute", "alt", "accent", "onAccent"]) assert.ok(!out.toLowerCase().includes(`"${cfg.own[r]}"`), `${e.key} : ${r} ${cfg.own[r]} subsiste`);
      assert.ok(!out.includes(`"${cfg.own.font}"`) && !out.includes(`"${cfg.own.head}"`), `${e.key} : police subsistante`);
      assert.match(out, /token:/, `${e.key} : aucun jeton du site`);
    }
  });
  test("« indépendant » : le document est rendu tel quel (même objet) ; « hybride » : seuls les groupes cochés changent", () => {
    const e = all[0], doc = Catalog.build("single_post", e.key).sections, snap = snapOf(e);
    assert.equal(IM.apply(doc, snap), doc, "mode indépendant : aucune copie ni changement");
    const fonts = JSON.stringify(IM.apply(doc, { ...snap, mode: "hybrid", use: ["fonts"] }));
    assert.ok(fonts.includes(`"${snap.own.accent}"`) && fonts.includes(`"${snap.own.bg}"`), "couleurs gardées");
    assert.ok(!fonts.includes(`"${snap.own.font}"`), "polices reprises du site");
    const accent = JSON.stringify(IM.apply(doc, { ...snap, mode: "hybrid", use: ["accent"] }));
    assert.match(accent, /token:primary/); assert.ok(accent.includes(`"${snap.own.fg}"`), "texte gardé");
  });
  test("une couleur choisie par l'utilisateur (différente de l'identité) n'est jamais touchée ; validations", () => {
    const e = all[0], doc = JSON.parse(JSON.stringify(Catalog.build("single_post", e.key).sections)), snap = snapOf(e);
    doc[0].children[0].styles.desktop.color = "#123456";
    assert.ok(JSON.stringify(IM.apply(doc, { ...snap, mode: "site", use: ["colors", "accent", "fonts"] })).includes('"#123456"'));
    assert.throws(() => IM.normalize({ mode: "n'importe quoi" }, snap), /inconnu/);
    assert.throws(() => IM.normalize({ mode: "hybrid", use: [] }, snap), /au moins un groupe/);
    assert.throws(() => IM.normalize({ mode: "site" }, null), /pas d'identité mémorisée/);
    assert.deepEqual(IM.normalize({ mode: "hybrid", use: ["fonts", "bidon"] }, snap).use, ["fonts"]);
  });
});

describe("Identité d'un modèle : modes de bout en bout (serveur réel)", () => {
  let srv, boss, db, org, A, B, tpl, beige, id;
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
    const r = await boss.request(`/marketing/site-web/sites/${site}/reglages.json`, { method: "PUT", json: { settings, tokens, revision: cur.revision }, headers: ORIGIN() }); assert.equal(r.status, 200, r.text.slice(0, 300));
  };
  const own = (html) => [...html.matchAll(/\.kw-n-[a-z0-9]+[^{}]*\{[^}]*\}/g)].map((m) => m[0]).join("\n");
  const mkPost = (site, slug, title) => { const pid = Number(db.prepare("INSERT INTO posts (slug, title, content, excerpt, published, status, published_at) VALUES (?, ?, ?, 'Résumé', 1, 'published', datetime('now'))").run(slug, title, "## Intertitre\n\nCORPS-MODES premier paragraphe.").lastInsertRowid); db.prepare("INSERT INTO mk_content_sites (content_type, content_id, organization_id, site_id, address) VALUES ('post', ?, ?, ?, ?)").run(pid, org, site, slug); };
  const mode = async (t, body, site = A) => post(U(site, `/api/modeles/${t.id}/identite`), body);
  const stored = () => JSON.parse(one("SELECT identity FROM mk_tb_templates WHERE id = ?", tpl.id).identity);

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db(); org = one("SELECT id FROM mk_organizations").id;
    A = mkSite("Site Marine", "site-marine"); B = mkSite("Site Témoin", "site-temoin");
    for (const [s, n] of [[A, "a"], [B, "b"]]) db.prepare("INSERT INTO mk_landing_pages (organization_id, name, slug, title, status, site_id, published_at, kind, indexable) VALUES (?, ?, ?, ?, 'published', ?, datetime('now'), 'page', 1)").run(org, `Accueil ${n}`, `accueil-${n}`, `Accueil ${n}`, s);
    await setSite(A, { url: "https://a.test", colors: { primary: "#0b2a40", secondary: "#0b2a40", background: "#0b2a40", surface: "#12395a", text: "#ffffff" } });
    await setSite(B, { url: "https://b.test" });
    mkPost(A, "article-a", "Titre-MODES-A"); mkPost(B, "article-b", "Titre-MODES-B");
    beige = Catalog.entries("single_post").find((e) => e.skinKey === "sable-voyage"); id = Own.ALL.find((x) => x.key === "sable-voyage");
    tpl = JSON.parse((await post(U(A, "/api/bibliotheque/utiliser"), { type: "single_post", key: beige.key })).text).template;
    assert.equal((await post(U(A, `/api/modeles/${tpl.id}/publier`))).status, 200);
  });
  after(async () => { if (db) db.close(); if (srv) await srv.stop(); });

  test("à l'insertion l'identité est mémorisée en mode indépendant ; la carte l'expose", async () => {
    assert.equal(stored().mode, "own"); assert.equal(stored().own.bg, id.bg);
    const list = JSON.parse((await boss.get(U(A, "/api/modeles"))).text);
    const card = (list.templates || list.items || []).find((t) => t.id === tpl.id); assert.ok(card && card.identity && card.identity.mode === "own", JSON.stringify(card && card.identity));
  });
  test("indépendant → suit le site → hybride → indépendant : l'affichage public suit, le retour est identique à l'octet près, le document n'est jamais réécrit", async () => {
    const docBefore = one("SELECT sections, draft FROM mk_landing_pages WHERE id = ?", tpl.sourceId);
    const r0 = await hostReq("a.test", "/blog/article-a"); assert.equal(r0.status, 200); const css0 = own(r0.text);
    assert.ok(css0.toLowerCase().includes(id.bg) && !/var\(--kw-primary/.test(css0), "indépendant : couleurs fixes");
    const s = await mode(tpl, { mode: "site" }); assert.equal(s.status, 200, s.text.slice(0, 300));
    const rs = await hostReq("a.test", "/blog/article-a"), cssS = own(rs.text);
    assert.match(cssS, /var\(--kw-(primary|background|text|surface)/, "suit le site : variables de la charte"); assert.ok(!cssS.toLowerCase().includes(id.bg), "plus de fond beige");
    await setSite(A, { colors: { primary: "#d00000", background: "#fff0f0" } });
    const rr = await hostReq("a.test", "/blog/article-a"); assert.match(rr.text, /#d00000/i, "la charte du site suit au rendu"); assert.equal(own(rr.text), cssS, "règles du modèle identiques : elles lisent les variables du site");
    await setSite(A, { colors: { primary: "#0b2a40", background: "#0b2a40" } });
    const h = await mode(tpl, { mode: "hybrid", use: ["fonts"] }); assert.equal(h.status, 200);
    const cssH = own((await hostReq("a.test", "/blog/article-a")).text);
    assert.ok(cssH.toLowerCase().includes(id.bg), "hybride (polices du site) : couleurs gardées"); assert.match(cssH, /var\(--kw-font-(body|heading)/, "polices du site");
    assert.equal((await mode(tpl, { mode: "own" })).status, 200);
    assert.equal(own((await hostReq("a.test", "/blog/article-a")).text), css0, "retour indépendant : identique à l'origine");
    assert.deepEqual(one("SELECT sections, draft FROM mk_landing_pages WHERE id = ?", tpl.sourceId), docBefore, "le document du modèle n'a jamais été réécrit");
    assert.equal(stored().own.bg, id.bg, "l'identité mémorisée est conservée d'un mode à l'autre");
  });
  test("refus : mode inconnu, hybride sans groupe, modèle sans identité, modèle d'un autre site, révision périmée, sans connexion", async () => {
    assert.equal((await mode(tpl, { mode: "x" })).status, 422);
    assert.equal((await mode(tpl, { mode: "hybrid", use: [] })).status, 422);
    const hdr = JSON.parse((await post(U(A, "/api/modeles"), { type: "header", name: "Entête sans identité" })).text).template;
    const bad = await mode(hdr, { mode: "site" }); assert.equal(bad.status, 422); assert.match(bad.text, /pas d'identité/);
    assert.equal((await mode(tpl, { mode: "site" }, B)).status, 404, "le modèle de A n'existe pas pour B");
    assert.equal((await mode(tpl, { mode: "site", revision: 0 })).status, 409, "révision périmée");
    const anon = await fetch(`${srv.base}${U(A, `/api/modeles/${tpl.id}/identite`)}`, { method: "POST", redirect: "manual", headers: { "Content-Type": "application/json", Origin: srv.base }, body: JSON.stringify({ mode: "site" }) });
    assert.ok([301, 302, 401, 403].includes(anon.status), `${anon.status}`);
    assert.equal(stored().mode, "own", "aucun refus n'a modifié le mode");
  });
  test("dupliquer garde l'identité ; l'autre site n'est pas touché", async () => {
    assert.equal((await mode(tpl, { mode: "site" })).status, 200);
    const d = JSON.parse((await post(U(A, `/api/modeles/${tpl.id}/dupliquer`))).text).template;
    const copy = JSON.parse(one("SELECT identity FROM mk_tb_templates WHERE id = ?", d.id).identity); assert.equal(copy.mode, "site"); assert.equal(copy.own.bg, id.bg);
    const b = await hostReq("b.test", "/blog/article-b"); assert.equal(b.status, 200); assert.doesNotMatch(b.text, /kw-theme-template/); assert.doesNotMatch(b.text, /fbf7f0/i);
  });
});
