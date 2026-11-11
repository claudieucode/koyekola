process.env.FOOTER_V2 = "0"; // ces tests décrivent l'ANCIEN catalogue (100 modèles ft-*) : on active l'interrupteur de secours. La bibliothèque v2 est testée par footer-v2-*.test.js.
// FRONTIÈRE DE PIED — surfaces et API, sur un VRAI serveur et un VRAI Chrome : plusieurs sites (un en « solo », l'autre en « legacy »), aperçu de la bibliothèque (jamais le thème du site),
// pages hors Page Builder (blog, page introuvable, domaine d'un site), canevas de l'éditeur, API d'apparence du pied (bascule, aperçu avant/après, révisions, copie, export/import).
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor, Client } = require("./helpers");
const Chrome = require("./helpers-chrome-cdp");
const H = require("./helpers-footer-isolation");
const Catalog = require("../src/themeBuilder/catalog");

const KEY = "ft-corporate-01-grande-marque-volets";
const KEY2 = "ft-ecommerce-03-place-de-marche";
const count = (t, s) => t.split(s).length - 1;
// Mode porté par la balise <footer> elle-même (le CSS en ligne du site contient aussi le texte data-kw-ft="solo" dans ses exclusions)
const modeOf = (html) => ((/<footer[^>]*\sdata-kw-ft="(\w+)"/.exec(html) || [])[1]) || null;

// Styles calculés des éléments du pied porteurs d'une classe kw-n-<id> (couplage par identifiant : insensible aux éléments d'exemple d'un aperçu)
const byId = () => {
  const P = ["color", "backgroundColor", "fontFamily", "fontSize", "fontWeight", "lineHeight", "letterSpacing", "textTransform", "textDecorationLine", "paddingTop", "paddingLeft", "marginTop", "marginBottom", "borderTopWidth", "borderTopLeftRadius", "boxShadow", "opacity", "display"];
  const o = {};
  document.querySelectorAll("footer [class*=kw-n-]").forEach((e) => { const c = [...e.classList].find((x) => /^kw-n-/.test(x)); const cs = getComputedStyle(e); o[c] = Object.fromEntries(P.map((p) => [p, cs[p]])); o[c].tag = e.tagName; });
  return o;
};
const pairDiff = (X, Y) => { let paired = 0; const diffs = []; for (const k of Object.keys(X)) if (Y[k]) { paired += 1; for (const p of Object.keys(X[k])) if (X[k][p] !== Y[k][p]) diffs.push(`${X[k].tag}|${p}: ${X[k][p]} → ${Y[k][p]}`); } return { paired, diffs }; };

describe("Pied indépendant : multisite, aperçu, pages hors Page Builder, éditeur, API", { skip: Chrome.SKIP }, () => {
  let srv, boss, db, chrome, S1, S2, cookie, page, base;
  const post = (path, json) => boss.request(path, { method: "POST", json: json || {}, headers: { Origin: srv.base } });
  const J = (r) => JSON.parse(r.text);
  const PRINC = (p = "") => `/marketing/site-web/principal/constructeur-de-theme${p}`;
  const hostGet = async (host, path) => { const r = await new Client(srv.base).get(path, { headers: { "x-forwarded-host": host, "User-Agent": "Mozilla/5.0 Chrome/120" } }); return { status: r.status, text: r.text }; };

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "", ALLOW_INDEXING: "1" });
    boss = await loginInstructor(srv); db = srv.db();
    S1 = await H.makeSite(srv, boss, "Site Un"); S2 = await H.makeSite(srv, boss, "Site Deux");
    await S1.setTokens({ colors: H.NAVY });
    for (const [S, host] of [[S1, "www.iso-un.example"], [S2, "www.iso-deux.example"]]) { const cur = await S.getSettings(); await S.putSettings({ settings: { ...cur.settings, seo: { ...cur.settings.seo, publicUrl: `https://${host}` } } }); S.host = host; }
    base = { 1: await S1.getSettings(), 2: await S2.getSettings() };
    for (const S of [S1, S2]) for (const p of ["noir", "volt"]) { await S.activatePack(p); }
    await S1.putSettings({ tokens: base[1].tokens, settings: base[1].settings }); await S2.putSettings({ tokens: base[2].tokens, settings: base[2].settings });
    cookie = [...boss.cookies].map(([n, value]) => ({ name: n, value, url: srv.base }));
    chrome = await Chrome.launch();
    page = await chrome.newPage({ width: 1280, height: 900, cookies: cookie });
  });
  after(async () => { if (chrome) await chrome.close(); if (db) db.close(); if (srv) await srv.stop(); });

  test("multisite : le même modèle en « solo » sur un site et en « legacy » sur l'autre ; chaque site garde son thème, seul le pied solo reste intact", async () => {
    const t1 = await S1.footer(KEY, "solo"), t2 = await S2.footer(KEY, "legacy");
    const ref1 = await H.grab(page, S1.url), ref2 = await H.grab(page, S2.url);
    assert.equal(ref1.extra.insideMain, false); assert.equal(ref2.extra.insideMain, true, "le site 2 garde l'ancien emplacement");
    assert.equal(await page.evaluate(() => document.querySelector("footer").getAttribute("data-kw-ft")), "legacy");
    // thèmes différents, par site
    await S1.activatePack("noir"); await S2.activatePack("volt");
    const g1 = await H.grab(page, S1.url), g2 = await H.grab(page, S2.url);
    const d1 = H.diff(ref1.foot, g1.foot), d2 = H.diff(ref2.foot, g2.foot);
    assert.equal(d1.pairs, 0, `site 1 (solo) : ${H.summary(d1)}`);
    assert.ok(d2.pairs > 20, `site 2 (legacy) suit son thème comme avant : ${d2.pairs}`);
    assert.equal(H.diff(ref1.head, g1.head).pairs > 0, true, "le thème du site 1 agit bien sur son en-tête (le thème est réellement actif)");
    // la feuille SERVIE d'un thème porte l'exclusion du pied indépendant (route publique /theme-packs/<clé>/style.css)
    const served = await new Client(srv.base).get("/theme-packs/noir/style.css");
    assert.equal(served.status, 200); assert.ok(served.text.includes(require("../src/marketing/pages/footerFrontier").SUFFIX), "feuille du thème servie avec l'exclusion");
    // chaque site n'a que son pied
    const h1 = (await new Client(srv.base).get(`/p/${S1.slug}`)).text, h2 = (await new Client(srv.base).get(`/p/${S2.slug}`)).text;
    assert.equal(count(h1, "<footer"), 1); assert.equal(count(h2, "<footer"), 1);
    assert.equal(modeOf(h1), "solo"); assert.equal(modeOf(h2), "legacy");
    // le pied solo du site 1 est le même que celui du site 2 une fois les deux en solo, sauf les variables figées de chaque site
    await S1.putSettings({ tokens: base[1].tokens, settings: base[1].settings }); await S2.putSettings({ tokens: base[2].tokens, settings: base[2].settings });
    await S1.unpublish(t1); await S2.unpublish(t2);
  });

  test("aperçu de la bibliothèque : jamais le thème, les couleurs, les polices ni le CSS du site (0 changement sous 7 états du site) ; « voir avec mon thème » le montre habillé", async () => {
    const url = (extra = "") => `${srv.base}${S1.U(`/api/bibliotheque/footer/${KEY}/apercu${extra}`)}`;
    const states = ["marine", "C", "F", "T", "G", "R", "P:noir", "P:volt"];
    const apply = async (st) => { if (st === "marine") await S1.putSettings({ tokens: base[1].tokens, settings: base[1].settings }); else if (H.STATES[st]) await S1.setTokens(H.STATES[st]); else { await S1.putSettings({ tokens: base[1].tokens, settings: base[1].settings }); await S1.activatePack(st.slice(2)); } };
    await apply("marine");
    const roots = { foot: ["footer[data-kw-footer]"] };
    const ref = await H.grab(page, url(), roots);
    assert.equal(ref.extra.footers, 1); assert.equal(await page.evaluate(() => document.querySelector("footer").getAttribute("data-kw-ft")), "solo", "l'aperçu montre le pied en mode indépendant");
    assert.equal(await page.evaluate(() => !document.querySelector("#kw-site-theme, link[href*=theme-packs], [data-kw-pack]")), true, "aucune feuille ni attribut de thème de site");
    const refIds = await page.evaluate(byId);
    assert.ok(Object.keys(refIds).length > 20, "l'aperçu contient les éléments du pied");
    const bad = [];
    for (const st of states.slice(1)) {
      await apply(st);
      for (const w of [1280]) { const g = await H.grab(page, url(), roots); const d = H.diff(ref.foot, g.foot); if (d.pairs) bad.push(`${st} : ${H.summary(d)}`); const ids = await page.evaluate(byId); const pd = pairDiff(refIds, ids); if (pd.diffs.length) bad.push(`${st} (par identifiant) : ${pd.diffs.slice(0, 3).join(" ; ")}`); }
    }
    assert.deepEqual(bad, [], bad.join("\n"));
    // avec le thème : habillé par le site (comportement de l'ancien aperçu), mode propre du modèle (legacy)
    await apply("P:noir");
    await S1.setTokens(H.STATES.F);
    const th = await H.grab(page, url("?theme=1"), roots);
    assert.equal(await page.evaluate(() => document.querySelector("footer").getAttribute("data-kw-ft")), "legacy");
    assert.ok(H.diff(ref.foot, th.foot).pairs > 10, "« avec mon thème » : le thème et les polices du site agissent");
    // vignette : même moteur, sans thème non plus
    const v = await boss.get(S1.U(`/api/bibliotheque/footer/${KEY}/vignette`));
    assert.equal(v.status, 200); assert.equal(modeOf(v.text), "solo"); assert.ok(!v.text.includes("kw-site-theme") && !v.text.includes("theme-packs"));
    await apply("marine");
  });

  test("blog, page introuvable (site principal) et domaine d'un site : un seul <footer> hors <main>, sans colonne de contenu, mêmes styles que l'aperçu", async () => {
    const used = await post(PRINC("/api/bibliotheque/utiliser"), { type: "footer", key: KEY });
    assert.equal(used.status, 200, used.text.slice(0, 200));
    const t = J(used).template;
    assert.equal((await post(PRINC(`/api/modeles/${t.id}/apparence-pied`), { mode: "solo" })).status, 200);
    assert.equal((await post(PRINC(`/api/modeles/${t.id}/publier`), { strict: true, scope: "site", replace: true })).status, 200);
    const roots = { foot: ["footer[data-kw-footer]"] };
    await page.goto(`${srv.base}${PRINC(`/api/bibliotheque/footer/${KEY}/apercu`)}`);
    await H.settle(page);
    const prev = await page.evaluate(byId);
    for (const path of ["/blog", "/page-introuvable-xyz"]) {
      const g = await H.grab(page, srv.base + path, roots);
      assert.equal(g.extra.footers, 1, `${path} : un seul <footer>`); assert.equal(g.extra.insideMain, false, `${path} : hors de <main>`);
      const info = await page.evaluate(() => { const f = document.querySelector("footer"); return { attr: f.getAttribute("data-kw-ft"), inLpMain: Boolean(f.closest(".lp-main")), afterMain: Boolean(document.querySelector("main") && (document.querySelector("main").compareDocumentPosition(f) & Node.DOCUMENT_POSITION_FOLLOWING)) }; });
      assert.equal(info.attr, "solo", path); assert.equal(info.inLpMain, false, `${path} : sans colonne .lp-main`); assert.equal(info.afterMain, true, `${path} : après </main>`);
      assert.equal(g.extra.sw <= g.extra.vw + 1, true, `${path} : pas de défilement horizontal`);
      const pd = pairDiff(prev, await page.evaluate(byId));
      assert.ok(pd.paired > 20, `${path} : ${pd.paired} éléments comparés`);
      assert.deepEqual(pd.diffs, [], `${path} : le pied publié diffère de l'aperçu : ${pd.diffs.slice(0, 4).join(" ; ")}`);
    }
    // domaine propre d'un site : page introuvable habillée avec le pied du site
    const t1 = await S1.footer(KEY2, "solo");
    const r = await hostGet(S1.host, "/page-introuvable-xyz");
    assert.equal(r.status, 404); assert.equal(count(r.text, "<footer"), 1); assert.equal(modeOf(r.text), "solo", "pied solo sur la page introuvable du site");
    assert.ok(r.text.indexOf("</main>") > -1 && r.text.indexOf("</main>") < r.text.indexOf("<footer"), "après </main>");
    assert.ok(!/class="lp-main"[^>]*>\s*<footer/.test(r.text));
    // boutique du site (pages hors Page Builder : catalogue, panier) : le pied indépendant remplace le pied fixe, une seule fois, après </main>
    assert.equal((await boss.post(`/marketing/site-web/sites/${S1.S}/modules/commerce`, { etat: "activer" })).status, 302);
    assert.equal((await boss.post(`/marketing/site-web/sites/${S1.S}/boutique/reglages`, { currency: "eur", default_country: "FR", enabled: "1", payment_methods: ["manual"], guest_checkout: "1", order_prefix: "ISO", manual_instructions: "Virement" })).status, 302);
    for (const path of ["/boutique", "/boutique/panier"]) {
      const b = await hostGet(S1.host, path);
      assert.equal(b.status, 200, path); assert.equal(count(b.text, "<footer"), 1, `${path} : un seul <footer>`); assert.equal(modeOf(b.text), "solo", `${path} : indépendant`);
      assert.ok(b.text.lastIndexOf("</main>") < b.text.indexOf("<footer"), `${path} : après </main>`);
      assert.ok(!b.text.includes('class="sh-foot"'), `${path} : pas de pied fixe en plus`);
    }
    await S1.unpublish(t1);
  });

  test("éditeur du pied : le canevas porte la même frontière (attributs et styles) que la page publiée", async () => {
    const t = await S1.footer(KEY, "solo");
    const comp = db.prepare("SELECT id, revision FROM mk_web_components WHERE id = ?").get(t.sourceId);
    const open = await boss.get(`/marketing/site-web/composants/${comp.id}/editeur?modele=${t.id}`);
    assert.equal(open.status, 200, "l'éditeur du pied s'ouvre");
    const section = JSON.parse(db.prepare("SELECT COALESCE(draft, section) s FROM mk_web_components WHERE id = ?").get(comp.id).s);
    assert.equal(section.ftMode, "solo", "le document du composant porte le réglage");
    // canevas : le client envoie son contenu SANS connaître le réglage ; le serveur le reprend du document
    const { ftMode: _m, ftVars: _v, ...bare } = section;
    const rendu = await post(`/marketing/site-web/composants/${comp.id}/rendu`, { content: { title: "t", sections: [bare] } });
    assert.equal(rendu.status, 200, rendu.text.slice(0, 200));
    assert.ok(rendu.text.includes('data-kw-ft="solo"') && /data-kw-ft="solo"[^>]*style="--kw-primary/.test(rendu.text), "canevas : racine indépendante avec ses variables");
    // fidélité : mêmes styles calculés (par identifiant d'élément) dans le canevas et sur le site publié
    await page.goto(S1.url); await H.settle(page);
    const pub = await page.evaluate(byId);
    await page.evaluate((html) => { document.open(); document.write(html); document.close(); }, rendu.text);
    await page.waitFor("document.readyState === 'complete'", "canevas chargé", 20000);
    await new Promise((r) => setTimeout(r, 800)); await H.settle(page);
    const ed = await page.evaluate(() => { const o = {}; const P = ["color", "backgroundColor", "fontFamily", "fontSize", "fontWeight", "lineHeight", "letterSpacing", "textTransform", "textDecorationLine", "paddingTop", "paddingLeft", "marginTop", "marginBottom", "borderTopWidth", "borderTopLeftRadius", "boxShadow", "opacity", "display"]; document.querySelectorAll("[data-kw-ft] [class*=kw-n-]").forEach((e) => { const c = [...e.classList].find((x) => /^kw-n-/.test(x)); const cs = getComputedStyle(e); o[c] = Object.fromEntries(P.map((p) => [p, cs[p]])); o[c].tag = e.tagName; }); return o; });
    const pd = pairDiff(pub, ed);
    assert.ok(pd.paired > 20, `${pd.paired} éléments comparés`);
    assert.deepEqual(pd.diffs, [], `éditeur ≠ publié : ${pd.diffs.slice(0, 5).join(" ; ")}`);
    await S1.unpublish(t);
  });

  test("API d'apparence : trois états, bascule d'un pied ancien avec aperçu avant/après, révision créée, rien de publié avant la publication, retour arrière, copie et export conservent le réglage", async () => {
    const t = await S1.footer(KEY2, "legacy");
    const A = (p = "") => S1.U(`/api/modeles/${t.id}/apparence-pied${p}`);
    let st = J(await boss.get(A()));
    assert.equal(st.mode, "legacy"); assert.equal(st.publishedMode, "legacy"); assert.deepEqual(st.options.map((o) => o.key), ["solo", "site", "legacy"]);
    assert.ok(st.options.every((o) => o.label && o.help), "libellés clairs en français");
    const html0 = (await new Client(srv.base).get(`/p/${S1.slug}`)).text;
    assert.equal(modeOf(html0), "legacy");
    // erreurs
    assert.equal((await post(A(), { mode: "inconnu" })).status, 422);
    assert.equal((await boss.get(S1.U(`/api/modeles/999999/apparence-pied`))).status, 404);
    // bascule vers solo : copie de travail seulement
    const r = await post(A(), { mode: "solo" }); assert.equal(r.status, 200);
    st = J(r); assert.equal(st.mode, "solo"); assert.equal(st.publishedMode, "legacy"); assert.equal(st.hasDraft, true);
    const html1 = (await new Client(srv.base).get(`/p/${S1.slug}`)).text;
    assert.equal(html1, html0, "rien n'est publié avant la publication");
    // aperçu « après » (copie de travail) : pied indépendant ; « avant » : le site publié, inchangé
    const ap = await boss.get(st.previewUrl.replace(/\?.*/, "") + `?page=${S1.pageId}`);
    assert.equal(ap.status, 200); assert.equal(modeOf(ap.text), "solo", "aperçu après : indépendant");
    // les variables du site sont figées dans le pied
    const doc = JSON.parse(db.prepare("SELECT COALESCE(draft, section) s FROM mk_web_components WHERE id = ?").get(t.sourceId).s);
    assert.equal(doc.ftMode, "solo"); assert.equal(doc.ftVars["--kw-primary"], H.NAVY.primary, "la charte marine du site est figée dans le pied");
    // redemander « indépendant » sur un pied déjà indépendant ne refige pas et n'efface pas la charte figée (bug trouvé par le passage sur les 100 modèles)
    const frozen = JSON.stringify(doc.ftVars);
    const again = await post(A(), { mode: "solo" }); assert.equal(again.status, 200);
    const doc2 = JSON.parse(db.prepare("SELECT COALESCE(draft, section) s FROM mk_web_components WHERE id = ?").get(t.sourceId).s);
    assert.equal(JSON.stringify(doc2.ftVars), frozen, "ftVars inchangés");
    // une révision « brouillon » est tracée
    const rev = J(await boss.get(S1.U(`/api/modeles/${t.id}/revisions`)));
    assert.ok(rev.revisions.length >= 1);
    // copie, export puis import conservent le réglage
    const dup = J(await post(S1.U(`/api/modeles/${t.id}/dupliquer`))).template;
    assert.equal(JSON.parse(db.prepare("SELECT COALESCE(draft, section) s FROM mk_web_components WHERE id = ?").get(dup.sourceId).s).ftMode, "solo", "la copie garde le réglage");
    const exp = J(await boss.get(S1.U(`/api/modeles/${t.id}/export.json`)));
    assert.equal(exp.document.section.ftMode, "solo");
    const imp = await post(S1.U("/api/importer"), { payload: exp });
    assert.equal(imp.status, 200, imp.text.slice(0, 200));
    const impT = J(imp).templates[0];
    assert.equal(JSON.parse(db.prepare("SELECT COALESCE(draft, section) s FROM mk_web_components WHERE id = ?").get(impT.sourceId).s).ftMode, "solo", "l'import garde le réglage");
    // publication puis retour arrière
    assert.equal((await post(S1.U(`/api/modeles/${t.id}/publier`), { strict: true, scope: "site", replace: true })).status, 200);
    assert.equal(modeOf((await new Client(srv.base).get(`/p/${S1.slug}`)).text), "solo");
    st = J(await post(A(), { mode: "legacy" })); assert.equal(st.mode, "legacy");
    await S1.setMode(t, "site"); assert.equal(modeOf((await new Client(srv.base).get(`/p/${S1.slug}`)).text), "site");
    await S1.setMode(t, "legacy"); assert.equal(modeOf((await new Client(srv.base).get(`/p/${S1.slug}`)).text), "legacy");
    // un en-tête n'a pas d'apparence de pied
    assert.equal((await post(S1.U(`/api/modeles/${S1.headerTemplate.id}/apparence-pied`), { mode: "solo" })).status, 422, "un en-tête n'a pas d'apparence de pied");
    await S1.unpublish(t);
  });

  test("les modèles actuels de la bibliothèque s'insèrent en « legacy » (aucun réglage dans leur document)", async () => {
    const keys = Catalog.entries("footer").map((m) => m.key);
    for (const k of [keys[0], keys[41], keys[99]]) {
      const t = J(await post(S1.U("/api/bibliotheque/utiliser"), { type: "footer", key: k })).template;
      const doc = JSON.parse(db.prepare("SELECT section s FROM mk_web_components WHERE id = ?").get(t.sourceId).s);
      assert.equal(doc.ftMode, undefined, `${k} : ancien comportement`); assert.equal(doc.ftVars, undefined);
    }
  });

  test("5 largeurs (320 à 1920) : le pied indépendant remplit la fenêtre, sans défilement horizontal ; la page publiée répond 200 dans les trois états", async () => {
    const t = await S1.footer(KEY, "solo");
    for (const w of [320, 390, 820, 1280, 1920]) {
      const p = await chrome.newPage({ width: w, height: 900, cookies: cookie });
      const g = await H.grab(p, S1.url);
      assert.ok(g.extra.sw <= g.extra.vw + 1, `${w}px : défilement horizontal ${g.extra.sw} > ${g.extra.vw}`);
      assert.ok(Math.abs(g.foot.els[0].g.width - g.extra.vw) <= 1, `${w}px : le pied occupe la largeur de la fenêtre (${g.foot.els[0].g.width} / ${g.extra.vw})`);
      await p.close();
    }
    for (const mode of ["solo", "site", "legacy"]) { await S1.setMode(t, mode); const r = await new Client(srv.base).get(`/p/${S1.slug}`); assert.equal(r.status, 200, mode); assert.equal(count(r.text, "<footer"), 1, mode); }
    await S1.unpublish(t);
  });
});
