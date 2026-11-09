// FRONTIÈRE DE PIED — indépendance graphique du pied de page, sur un VRAI serveur et un VRAI Chrome.
// Le SCÉNARIO EN 10 ÉTAPES de l'utilisateur est automatisé : site marine → insertion du pied → relevé des styles calculés → couleurs du site → polices → échelle de texte → réglages « Global »
// → boutons / champs / rayons / espacements → 4 thèmes (maille, noir, sape, volt) → rechargement et republication. Un pied « solo » ne doit changer d'AUCUNE propriété visible (390 et 1280 px),
// ne doit pas déformer l'en-tête ni le contenu, et garder sa largeur. Le mode « legacy » reste le comportement historique ; le mode « site » suit la charte.
// FOOTER_ISO_ALL=1 : les 100 modèles (états réduits) au lieu d'un modèle par famille.
// FOOTER_ISO_V2=1 : les modèles de la NOUVELLE bibliothèque (ids ft2-…, mode d'essai FOOTER_V2_APERCU activé aussi pour le serveur) au lieu de la bibliothèque actuelle ; les témoins « legacy » et « site » sont passés.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");
const Chrome = require("./helpers-chrome-cdp");
const H = require("./helpers-footer-isolation");
if (process.env.FOOTER_ISO_V2 === "1") process.env.FOOTER_V2_APERCU = "1"; // avant de charger le catalogue (et hérité par le serveur de test)
const Catalog = require("../src/themeBuilder/catalog");

const ALL = process.env.FOOTER_ISO_ALL === "1";
const ISO_V2 = process.env.FOOTER_ISO_V2 === "1";
const entries = Catalog.entries("footer").filter((e) => !ISO_V2 || e.v2);
const ONE_PER_FAMILY = [...new Map(entries.map((m) => [m.layoutKey, m.key])).values()];
const KEYS = (ALL ? entries.map((m) => m.key) : ONE_PER_FAMILY).slice(0, Number(process.env.FOOTER_ISO_N) || 1000);
const LEGACY_KEYS = ONE_PER_FAMILY.slice(0, 6);
const WIDTHS = ALL ? [1280] : [390, 1280];
const STATE_LIST = ALL ? ["F", "R", "P:noir", "P:volt"] : ["C", "F", "T", "G", "R", ...H.PACKS.map((p) => `P:${p}`)];

describe("Pied indépendant (frontière de pied) : scénario en 10 étapes", { skip: Chrome.SKIP }, () => {
  let srv, boss, db, chrome, A, cookie, base;
  const pages = {};
  const stats = { comparisons: 0, changed: 0, models: 0, legacyChanged: 0, legacyComparisons: 0 };
  const settings = {};
  const resetTokens = async () => { await A.putSettings({ tokens: base.tokens, settings: base.settings }); };
  const applyState = async (st) => {
    if (st === "marine") await resetTokens();
    else if (H.STATES[st]) await A.setTokens(H.STATES[st]);
    else { await resetTokens(); await A.activatePack(st.slice(2)); }
  };

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "", ALLOW_INDEXING: "1" });
    boss = await loginInstructor(srv); db = srv.db();
    A = await H.makeSite(srv, boss, "Site isolation");
    await A.setTokens({ colors: H.NAVY });
    base = await A.getSettings();
    for (const p of H.PACKS) { await A.activatePack(p); await resetTokens(); }
    cookie = [...boss.cookies].map(([n, value]) => ({ name: n, value, url: srv.base }));
    chrome = await Chrome.launch();
    for (const w of [390, 1280]) pages[w] = await chrome.newPage({ width: w, height: 900, cookies: cookie });
  });
  after(async () => {
    console.log(`[isolation] ${stats.models} modèles solo, ${stats.comparisons} comparaisons, ${stats.changed} propriété(s) modifiée(s) ; legacy : ${stats.legacyComparisons} comparaisons, ${stats.legacyChanged} propriété(s) modifiée(s) par le site`);
    if (chrome) await chrome.close();
    if (db) db.close();
    if (srv) await srv.stop();
  });

  test("solo : 0 propriété visible modifiée sous 9 changements du site × 2 largeurs, 0 déformation de l'en-tête et du contenu, largeur identique", async () => {
    const failures = [];
    for (const key of KEYS) {
      await resetTokens();
      const tpl = await A.footer(key, "solo");
      stats.models += 1;
      const ref = {};
      for (const w of WIDTHS) ref[w] = await H.grab(pages[w], A.url);
      for (const w of WIDTHS) {
        assert.equal(ref[w].extra.footers, 1, `${key} : un seul <footer>`);
        assert.equal(ref[w].extra.insideMain, false, `${key} : le pied n'est pas dans <main>`);
        assert.ok(ref[w].foot.n > 5, `${key} : le pied contient des éléments`);
      }
      for (const st of STATE_LIST) {
        await applyState(st);
        for (const w of WIDTHS) {
          const g = await H.grab(pages[w], A.url);
          const d = H.diff(ref[w].foot, g.foot);
          stats.comparisons += 1; stats.changed += d.pairs >= 1e9 ? 1 : d.pairs;
          if (d.pairs) failures.push(`${key} ${st} ${w}px : ${H.summary(d)}`);
          const rw = g.foot.els[0].g.width;
          if (Math.abs(rw - ref[w].foot.els[0].g.width) > 1) failures.push(`${key} ${st} ${w}px : largeur du pied ${ref[w].foot.els[0].g.width} → ${rw}`);
          if (g.extra.sw > g.extra.vw + 1) failures.push(`${key} ${st} ${w}px : défilement horizontal`);
          if (g.extra.footers !== 1 || g.extra.insideMain) failures.push(`${key} ${st} ${w}px : structure du pied`);
        }
      }
      // étape 10 : retour à l'identité marine, rechargement et REPUBLICATION du pied : toujours identique
      await resetTokens();
      await A.setMode(tpl, "solo", { publish: true });
      for (const w of WIDTHS) { const g = await H.grab(pages[w], A.url); const d = H.diff(ref[w].foot, g.foot); stats.comparisons += 1; stats.changed += d.pairs >= 1e9 ? 1 : d.pairs; if (d.pairs) failures.push(`${key} republié ${w}px : ${H.summary(d)}`); }
      await A.unpublish(tpl);
    }
    assert.deepEqual(failures, [], `Le pied « solo » a bougé :\n${failures.slice(0, 20).join("\n")}`);
    assert.equal(stats.changed, 0);
    assert.ok(stats.comparisons >= KEYS.length * (STATE_LIST.length * WIDTHS.length), "comparaisons effectivement faites");
  });

  test("témoin : le MÊME relevé détecte les déformations d'un pied « legacy » (le test est sensible) et le comportement historique est conservé", { skip: ALL || ISO_V2 }, async () => {
    await resetTokens();
    let changed = 0;
    for (const key of LEGACY_KEYS) {
      const tpl = await A.footer(key, "legacy");
      await resetTokens();
      const ref = await H.grab(pages[1280], A.url);
      assert.equal(ref.extra.insideMain, true, `${key} : un pied legacy reste à sa place historique (dans <main>)`);
      assert.equal(ref.extra.footers, 1);
      for (const st of ["F", "T", "R", "P:noir", "P:volt"]) {
        await applyState(st);
        const g = await H.grab(pages[1280], A.url);
        const d = H.diff(ref.foot, g.foot);
        stats.legacyComparisons += 1; stats.legacyChanged += d.pairs >= 1e9 ? 1 : d.pairs; changed += d.pairs >= 1e9 ? 1 : d.pairs;
      }
      await resetTokens();
      await A.unpublish(tpl);
    }
    assert.ok(changed > 100, `un pied legacy est toujours déformé par le site (comportement historique conservé) : ${changed} propriétés`);
  });

  test("site : le pied suit la charte du site (polices, échelle de texte, thèmes le modifient) tout en étant posé après </main>", { skip: ALL || ISO_V2 }, async () => {
    await resetTokens();
    const key = ONE_PER_FAMILY[0];
    const tpl = await A.footer(key, "site");
    const ref = await H.grab(pages[1280], A.url);
    assert.equal(ref.extra.insideMain, false, "mode site : le pied est hors de <main>");
    assert.equal(ref.extra.footers, 1);
    const attr = await pages[1280].evaluate(() => document.querySelector("footer").getAttribute("data-kw-ft"));
    assert.equal(attr, "site");
    let changed = 0;
    for (const st of ["F", "T", "G", "R", "P:noir", "P:volt"]) { await applyState(st); const g = await H.grab(pages[1280], A.url); const d = H.diff(ref.foot, g.foot); changed += d.pairs >= 1e9 ? 1 : d.pairs; }
    assert.ok(changed > 20, `mode site : la charte du site agit sur le pied (${changed} propriétés)`);
    await resetTokens();
    await A.unpublish(tpl);
  });

  test("structure : un seul <footer> hors de <main>, aucun <header> ajouté, widgets et ligne légale dans le pied, 0 fuite vers l'en-tête et le contenu (états sensibles)", { skip: ALL }, async () => {
    const out = [];
    for (const key of ONE_PER_FAMILY.slice(0, 3)) {
      await resetTokens();
      const tpl = await A.footer(key, "solo");
      for (const st of ["marine", "F", "G", "P:noir", "P:volt"]) {
        await applyState(st);
        for (const w of [390, 1280]) {
          const avec = await H.grab(pages[w], A.url);
          await A.unpublish(tpl);
          const sans = await H.grab(pages[w], A.url);
          await A.setMode(tpl, "solo", { publish: true });
          for (const part of ["head", "body"]) { const d = H.diff(sans[part], avec[part]); if (d.pairs) out.push(`${key} ${st} ${w}px ${part} : ${H.summary(d)}`); }
          if (avec.extra.headers !== sans.extra.headers) out.push(`${key} ${st} ${w}px : <header> ${sans.extra.headers} → ${avec.extra.headers}`);
          if (avec.extra.footers !== 1 || avec.extra.insideMain) out.push(`${key} ${st} ${w}px : structure`);
        }
      }
      await resetTokens();
      await pages[1280].goto(A.url);
      const s = await pages[1280].evaluate(() => {
        const f = document.querySelector("footer"), m = document.querySelector("main");
        const ids = [...f.querySelectorAll("[class*=kw-n-]")].map((e) => [...e.classList].find((c) => /^kw-n-/.test(c)));
        const outside = ids.filter((c) => [...document.querySelectorAll("." + c)].some((e) => !f.contains(e)));
        return { count: document.querySelectorAll("footer").length, role: f.getAttribute("role"), attr: f.getAttribute("data-kw-ft"), afterMain: Boolean(m.compareDocumentPosition(f) & Node.DOCUMENT_POSITION_FOLLOWING), parentIsBody: f.parentElement === document.body, legalInside: document.querySelectorAll("footer .lp-foot").length, legalOutside: document.querySelectorAll(".lp-foot").length - document.querySelectorAll("footer .lp-foot").length, links: f.querySelectorAll("a").length, outside: outside.length, nodes: ids.length, contentinfo: document.querySelectorAll("[role=contentinfo], footer:not([role])").length };
      });
      assert.equal(s.count, 1); assert.equal(s.role, "contentinfo"); assert.equal(s.attr, "solo");
      assert.ok(s.afterMain, "le pied suit </main>"); assert.ok(s.parentIsBody, "le pied est un enfant direct du <body>");
      assert.equal(s.legalInside, 1, "ligne légale dans le pied"); assert.equal(s.legalOutside, 0, "aucune ligne légale hors du pied");
      assert.ok(s.links > 0 && s.nodes > 5 && s.outside === 0, "tous les éléments du pied sont dans le <footer>");
      await A.unpublish(tpl);
    }
    assert.deepEqual(out, [], out.slice(0, 15).join("\n"));
  });

  test("mouvement réduit : un pied solo n'a plus aucune transition ni animation, un pied legacy en garde", { skip: ALL }, async () => {
    await resetTokens();
    const count = async () => { await pages[1280].goto(A.url); return pages[1280].evaluate(() => [...document.querySelectorAll("footer, footer *")].filter((e) => { const c = getComputedStyle(e); return [...c.transitionDuration.split(","), ...c.animationDuration.split(",")].some((d) => parseFloat(d) * (d.trim().endsWith("ms") ? 1 : 1000) > 0.02); }).length); };
    const key = ONE_PER_FAMILY.find((k) => /ecommerce|corporate/.test(k)) || ONE_PER_FAMILY[0];
    const tpl = await A.footer(key, "solo");
    await pages[1280].emulateMedia([{ name: "prefers-reduced-motion", value: "reduce" }]);
    const solo = await count();
    await A.setMode(tpl, "legacy", { publish: true });
    const legacy = await count();
    await pages[1280].emulateMedia([{ name: "prefers-reduced-motion", value: "no-preference" }]);
    await A.unpublish(tpl);
    assert.equal(solo, 0, `solo : éléments encore animés sous « mouvement réduit » : ${solo}`);
    console.log(`[isolation] mouvement réduit : solo ${solo} élément(s) animé(s), legacy ${legacy}`);
  });
});
