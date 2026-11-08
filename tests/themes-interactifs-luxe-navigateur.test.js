// Thèmes boutique « Luxe » à signature interactive, essayés dans un VRAI Chrome (sans Playwright : tests/helpers-chrome-cdp.js) comme le ferait un visiteur :
// cuir (atelier d'initiales), plume-or (gravure), lumiere-objet (simulateur d'ambiance), carre-soie (vue plein écran + zoom), dentelle (guide des tailles),
// monture-claire (sélecteur de formes par visage), percale-fine (sélecteur de lit).
// Pour chaque thème : un site de test, le thème installé et activé, ses pages de démonstration PUBLIÉES, une vraie boutique (produits du thème). Les pages sont servies par le vrai
// serveur (CSS et motion.js du thème chargés par la page, comme en production) ; un petit relais local ajoute l'en-tête du domaine du site.
// Vérifié à chaque fois : interaction réelle, résultat dans le DOM et les styles calculés, zéro erreur JavaScript, page lisible SANS le script du thème, et « moins d'animations »
// (Chrome lancé avec --force-prefers-reduced-motion). Ignoré proprement si Chrome est absent.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const http = require("node:http");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");
const shopkit = require("../src/marketing/themes/packs/shopkit");
const normal = require("./helpers-chrome-cdp");

const KEYS = ["cuir", "plume-or", "lumiere-objet", "carre-soie", "dentelle", "monture-claire", "percale-fine"];
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
// Chrome met parfois plus de 16 s à démarrer quand la machine est chargée : jusqu'à 4 essais (le pilote arrête lui-même un lancement raté)
async function launchRetry(mod) { for (let i = 1; ; i++) { try { return await mod.launch(); } catch (e) { if (i >= 4) throw e; } } }
const REALCHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));

describe("thèmes Luxe interactifs dans un vrai Chrome", { skip: normal.SKIP, timeout: 3000000 }, () => {
  let srv, boss, db, sites = {}, proxies = [], chrome, calm, wrapDir;

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db();
    const orgId = db.prepare("SELECT id FROM mk_organizations ORDER BY id LIMIT 1").get().id;
    const target = new URL(srv.base);
    for (const key of KEYS) {
      const siteId = Number((await boss.post("/marketing/site-web/sites", { name: "Interactif " + key })).location.match(/sites\/(\d+)/)[1]);
      const host = `${key}.example`;
      const cur = JSON.parse((await boss.get(`/marketing/site-web/sites/${siteId}/reglages.json`)).text);
      const r = await boss.request(`/marketing/site-web/sites/${siteId}/reglages.json`, { method: "PUT", json: { revision: cur.revision, tokens: cur.tokens, settings: { ...cur.settings, seo: { ...cur.settings.seo, publicUrl: `https://${host}` } } } });
      assert.equal(r.status, 200, "réglages du site " + key);
      const SA = `/marketing/site-web/sites/${siteId}/boutique`;
      await boss.post(`${SA}/livraison/zones`, { name: "France", countries: "FR" });
      const zid = db.prepare("SELECT id FROM mk_shop_shipping_zones WHERE site_id = ?").get(siteId).id;
      await boss.post(`${SA}/livraison/zones/${zid}/methodes`, { name: "Colis", kind: "flat", cost: "5,90" });
      await boss.post(`${SA}/reglages`, { currency: "eur", default_country: "FR", enabled: "1", payment_methods: ["manual"], guest_checkout: "1", order_prefix: "INT" });
      await boss.post(`/marketing/site-web/sites/${siteId}/modules/commerce`, { etat: "activer" });
      shopkit.seed({ db, organizationId: orgId, siteId }, require(`../src/marketing/themes/packs/${key}/demo.js`));
      if (key === "cuir") { // le vendeur active la personnalisation d'un produit (champ « initiales » du moteur de boutique)
        const pid = db.prepare("SELECT id FROM mk_shop_products WHERE site_id = ? AND slug = ?").get(siteId, "sac-edition-atelier").id;
        db.prepare("INSERT INTO mk_shop_product_personalization (product_id, label, hint, max_length, required) VALUES (?, 'Vos initiales', 'AB', 3, 0)").run(pid);
      }
      await boss.post("/marketing/site-web/themes/installer", { key, site: siteId });
      await boss.post(`/marketing/site-web/themes/${key}/activer`, { site: siteId, demo: "1" });
      const pages = db.prepare("SELECT id, slug, name FROM mk_landing_pages WHERE site_id = ?").all(siteId);
      const published = [];
      for (const p of pages) { const y = await boss.post(`/marketing/pages/${p.id}/publier.json`, {}); if (y.status === 200) published.push(p); }
      // relais local : ajoute l'en-tête du domaine du site (Chrome ne sait pas résoudre « x.example »)
      const proxy = http.createServer((q, s) => {
        const u = http.request({ host: target.hostname, port: target.port, path: q.url, method: q.method, headers: { ...q.headers, host: target.host, "x-forwarded-host": host } }, (resp) => { s.writeHead(resp.statusCode, resp.headers); resp.pipe(s); });
        u.on("error", () => s.destroy()); q.pipe(u);
      });
      await new Promise((ok) => proxy.listen(0, "127.0.0.1", ok)); proxies.push(proxy);
      const slugOf = (start) => (published.find((p) => p.name.toLowerCase().startsWith(start)) || {}).slug;
      sites[key] = { siteId, base: `http://127.0.0.1:${proxy.address().port}`, slugOf };
    }
    chrome = await launchRetry(normal);
    // Second Chrome : « moins d'animations » imposé par le navigateur (script enveloppe, supprimé à la fin)
    wrapDir = fs.mkdtempSync(path.join(os.tmpdir(), "kw-reduit-"));
    const wrapper = path.join(wrapDir, "chrome-reduit.sh");
    fs.writeFileSync(wrapper, `#!/bin/sh\nexec "${REALCHROME}" --force-prefers-reduced-motion "$@"\n`, { mode: 0o755 });
    const keep = process.env.CHROME_PATH; process.env.CHROME_PATH = wrapper;
    delete require.cache[require.resolve("./helpers-chrome-cdp")];
    const reduced = require("./helpers-chrome-cdp");
    if (keep === undefined) delete process.env.CHROME_PATH; else process.env.CHROME_PATH = keep;
    calm = await launchRetry(reduced);
  });
  after(async () => {
    if (chrome) await chrome.close();
    if (calm) await calm.close();
    proxies.forEach((p) => p.close());
    if (wrapDir) fs.rmSync(wrapDir, { recursive: true, force: true });
    if (db) db.close();
    if (srv) await srv.stop();
  });

  // ---------- outils ----------
  const OPTS = { width: 1500, height: 1000 };
  async function open(key, url, { browser = chrome, opts = OPTS } = {}) {
    const page = await browser.newPage(opts);
    await page.goto(sites[key].base + url);
    await wait(500);
    return page;
  }
  const home = (key) => "/" + sites[key].slugOf("accueil");
  const slug = (key, start) => { const s = sites[key].slugOf(start); assert.ok(s, `${key} : page « ${start} » publiée`); return "/" + s; };
  // Le thème est bien actif et ses fichiers se chargent (statut 200), sans erreur JavaScript
  async function themeOk(page, key) {
    const info = await page.evaluate(() => ({
      pack: document.body.getAttribute("data-kw-pack"),
      res: performance.getEntriesByType("resource").filter((r) => /\/theme-packs\//.test(r.name)).map((r) => r.name.replace(/^.*\/theme-packs\//, "") + ":" + r.responseStatus),
    }));
    assert.equal(info.pack, key);
    assert.ok(info.res.some((r) => /^[^/]+\/style\.css.*:200$/.test(r)), `${key} : style.css chargé (${info.res})`);
    return info;
  }
  const noErrors = (page, what) => assert.deepEqual(page.errors, [], `${what} : aucune erreur JavaScript`);
  // Même page SANS le script du thème (on retire la balise motion.js puis on réécrit le document)
  async function sansScript(key, url) {
    const page = await chrome.newPage(OPTS);
    await page.goto(sites[key].base + url);
    await page.evaluate(async () => { const t = (await (await fetch(location.href)).text()).replace(/<script[^>]*theme-packs[^>]*motion\.js[^>]*><\/script>/, ""); document.open(); document.write(t); document.close(); });
    await wait(1200);
    return page;
  }
  // Un lien interne répond (≠ 404 / 5xx)
  const linksOk = (page, selector) => page.evaluate(async (sel) => {
    const hrefs = [...new Set([...document.querySelectorAll(sel)].map((a) => a.getAttribute("href")))];
    const bad = [];
    for (const h of hrefs) { const r = await fetch(h); if (r.status >= 400) bad.push(h + " → " + r.status); }
    return { n: hrefs.length, bad };
  }, selector);
  const click = (page, sel, i = 0) => page.evaluate(([s, n]) => { const e = document.querySelectorAll(s)[n]; if (!e) throw new Error("introuvable : " + s + "[" + n + "]"); e.click(); return true; }, [sel, i]);
  // Saisie réelle (événements de clavier du navigateur) dans le champ ciblé
  const typeInto = (page, sel, text) => page.evaluate(([s, t]) => { const i = document.querySelector(s); i.focus(); i.select(); document.execCommand("delete"); for (const c of t) document.execCommand("insertText", false, c); return i.value; }, [sel, text]);

  // =========================================================================================================
  test("calibrage : le navigateur « moins d'animations » le demande vraiment, l'autre non", async () => {
    const a = await open("cuir", home("cuir"), { browser: chrome }), b = await open("cuir", home("cuir"), { browser: calm });
    assert.equal(await a.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches), false);
    assert.equal(await b.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches), true);
    await a.close(); await b.close();
  });

  // =========================================================================================================
  describe("cuir : atelier d'initiales", () => {
    test("le champ est créé par motion.js ; initiales nettoyées, aperçu SVG qui suit le texte, cuir / fil / modèle", async () => {
      const url = slug("cuir", "atelier");
      const page = await open("cuir", url);
      await themeOk(page, "cuir");
      const stat = await page.evaluate(async () => (await (await fetch(location.href)).text()).includes("<input"));
      assert.equal(stat, false, "aucun champ dans le HTML d'origine : il est créé par motion.js");
      assert.equal(await page.evaluate(() => document.body.classList.contains("cu-js")), true);
      assert.equal(await page.evaluate(() => document.querySelector("[data-cuir-ui] input").maxLength), 3, "longueur max = data-max");
      // initiales
      const typed = await typeInto(page, "[data-cuir-ui] input", "jé-x9yz");
      assert.equal(typed.toUpperCase(), "JÉX", "lettres seulement (le tiret et le chiffre sont refusés), 3 au plus");
      assert.equal(await page.evaluate(() => getComputedStyle(document.querySelector("[data-cuir-ui] input")).textTransform), "uppercase", "le champ se voit en majuscules");
      assert.deepEqual(await page.evaluate(() => [...document.querySelectorAll("[data-cuir-stage] text")].map((t) => t.textContent.replace(/\s/g, " "))), ["J É X", "J É X"], "l'aperçu (ombre + texte) suit la saisie");
      assert.equal(await page.evaluate(() => document.querySelector("[data-cuir-stage] text.cu-mono:not(.cu-mono--sh)").classList.contains("is-ghost")), false);
      // cuir et fil : variables CSS + couleur réellement peinte
      await click(page, "[data-cuir-ui] fieldset:nth-of-type(2) button", 2); // Bordeaux (le 1er fieldset est « Modèle »)
      const c1 = await page.evaluate(() => ({ v: document.querySelector("[data-cuir-stage]").style.getPropertyValue("--cu-leather"), fill: getComputedStyle(document.querySelector("[data-cuir-stage] .cu-leather")).fill, pressed: [...document.querySelectorAll("[data-cuir-ui] fieldset:nth-of-type(2) button")].map((b) => b.getAttribute("aria-pressed")) }));
      assert.equal(c1.v.trim(), "#5a1d26"); assert.equal(c1.fill, "rgb(90, 29, 38)"); assert.deepEqual(c1.pressed, ["false", "false", "true", "false", "false"]);
      await click(page, "[data-cuir-ui] fieldset:nth-of-type(3) button", 1); // fil Ivoire
      const c2 = await page.evaluate(() => ({ v: document.querySelector("[data-cuir-stage]").style.getPropertyValue("--cu-fil"), stroke: getComputedStyle(document.querySelector("[data-cuir-stage] .cu-thread")).stroke }));
      assert.equal(c2.v.trim(), "#efe6d6"); assert.match(c2.stroke, /rgb\(239, 230, 214\)/);
      // modèle : l'illustration change, les initiales restent, le texte lu à voix haute est annoncé
      await click(page, "[data-cuir-ui] fieldset:nth-of-type(1) button", 1);
      const m = await page.evaluate(() => ({ aria: document.querySelector("[data-cuir-stage] svg").getAttribute("aria-label"), t: document.querySelector("[data-cuir-stage] text.cu-mono:not(.cu-mono--sh)").textContent.replace(/\s/g, " "), st: document.querySelector("[data-cuir-ui] [role=status]").textContent, anchor: document.querySelector("[data-cuir-stage] text").getAttribute("text-anchor") }));
      assert.match(m.aria, /Portefeuille/); assert.equal(m.t, "J É X"); assert.match(m.st, /initiales J É X, cuir Bordeaux, fil Ivoire/); assert.equal(m.anchor, "end");
      // champ vidé : exemple grisé
      await typeInto(page, "[data-cuir-ui] input", "");
      assert.equal(await page.evaluate(() => document.querySelector("[data-cuir-stage] text.cu-mono:not(.cu-mono--sh)").textContent.replace(/\s/g, " ") + "|" + document.querySelector("[data-cuir-stage] text.is-ghost").classList.contains("is-ghost")), "A B|true");
      noErrors(page, "cuir/atelier");
      await page.close();
    });

    test("fiche produit : petit aperçu sous le champ de personnalisation, il suit le texte et le coloris choisi", async () => {
      const page = await open("cuir", "/boutique/produit/sac-edition-atelier");
      const opts = await page.evaluate(() => [...document.querySelector("select[name=variant_id]").options].map((o) => o.value + "=" + o.text));
      assert.ok(opts.length > 2, "variantes présentes : " + opts);
      const pos = await page.evaluate(() => { const f = document.querySelector("input[data-sh-custom]"), m = document.querySelector(".cu-mini"); return !!m && (f.closest("label") || f.parentNode).nextElementSibling === m; });
      assert.equal(pos, true, "aperçu inséré juste sous le champ");
      assert.equal(await page.evaluate(() => document.querySelectorAll(".cu-mini").length), 1, "un seul aperçu");
      assert.equal(await page.evaluate(() => document.querySelector(".cu-mini text").textContent.replace(/\s/g, " ")), "A B", "exemple grisé au départ");
      await typeInto(page, "input[data-sh-custom]", "cm");
      assert.equal(await page.evaluate(() => document.querySelector(".cu-mini text.cu-mono:not(.cu-mono--sh)").textContent.replace(/\s/g, " ")), "C M");
      assert.equal(await page.evaluate(() => document.querySelector("input[data-sh-custom]").value), "cm", "le champ du moteur n'est pas modifié (le texte commandé reste tel que saisi)");
      const nameNoir = opts.map((o) => o.split("=")[1]).find((n) => /noir/i.test(n));
      if (nameNoir) {
        await page.evaluate((n) => { const s = document.querySelector("select[name=variant_id]"); s.selectedIndex = [...s.options].findIndex((o) => o.text === n); s.dispatchEvent(new Event("change", { bubbles: true })); }, nameNoir);
        assert.equal((await page.evaluate(() => document.querySelector(".cu-mini .cu-stage").style.getPropertyValue("--cu-leather"))).trim(), "#1d1814", "le coloris choisi se voit dans l'aperçu");
      }
      noErrors(page, "cuir/fiche");
      await page.close();
    });

    test("sans le script : l'atelier reste lisible (message + illustration), le champ du moteur marche", async () => {
      const page = await sansScript("cuir", slug("cuir", "atelier"));
      const t = await page.evaluate(() => ({ cls: document.body.className, txt: document.querySelector("[data-cuir-atelier]").innerText, svg: document.querySelectorAll("[data-cuir-stage] svg").length, h: document.querySelector("[data-cuir-atelier]").getBoundingClientRect().height }));
      assert.doesNotMatch(t.cls, /cu-js/); assert.match(t.txt, /demande JavaScript/); assert.ok(t.svg >= 1 && t.h > 100);
      noErrors(page, "cuir/sans script");
      await page.close();
    });

    test("moins d'animations : les coutures sont tracées tout de suite", async () => {
      const page = await open("cuir", home("cuir"), { browser: calm });
      const r = await page.evaluate(() => ({ seams: document.querySelectorAll(".cu-seam").length, inn: document.querySelectorAll(".cu-seam.is-in").length }));
      assert.ok(r.seams > 0 && r.inn === r.seams, JSON.stringify(r));
      noErrors(page, "cuir/calme");
      await page.close();
    });
  });

  // =========================================================================================================
  describe("plume-or : gravure", () => {
    test("champ créé par motion.js, longueur max, 3 styles, 4 laques, texte nettoyé", async () => {
      const page = await open("plume-or", slug("plume-or", "gravure"));
      await themeOk(page, "plume-or");
      const base = await page.evaluate(() => ({ max: document.querySelector("[data-po-grav]").getAttribute("data-max"), inpMax: document.querySelector(".po-in").maxLength, chips: document.querySelectorAll(".po-grp")[0].children.length, sw: document.querySelectorAll(".po-grp")[1].children.length, out: document.querySelector("[data-po-out]").textContent, val: document.querySelector(".po-in").value }));
      assert.equal(base.inpMax, Number(base.max)); assert.equal(base.chips, 3); assert.equal(base.sw, 4); assert.equal(base.val, base.out, "le champ démarre avec le texte d'exemple");
      const max = Number(base.max);
      const v = await typeInto(page, ".po-in", "X".repeat(max + 30));
      assert.equal(v.length, max, "pas plus de " + max + " caractères");
      await typeInto(page, ".po-in", "Léa <b>Rose</b>");
      const g = await page.evaluate(() => ({ v: document.querySelector(".po-in").value, out: document.querySelector("[data-po-out]").textContent, cnt: document.querySelector(".po-cnt").textContent }));
      assert.doesNotMatch(g.v, /[<>]/); assert.equal(g.out, g.v); assert.match(g.cnt, new RegExp(`^${g.v.length} sur ${max} caractères`));
      // styles
      const styles = ["capitales", "italique", "monogramme"], seen = {};
      for (let i = 0; i < 3; i++) {
        await click(page, ".po-grp:first-of-type .po-chip", i);
        seen[styles[i]] = await page.evaluate(() => ({ attr: document.querySelector(".po-pen").getAttribute("data-style"), fs: getComputedStyle(document.querySelector("[data-po-out]")).fontStyle, tt: getComputedStyle(document.querySelector("[data-po-out]")).textTransform, ff: getComputedStyle(document.querySelector("[data-po-out]")).fontFamily, ls: getComputedStyle(document.querySelector("[data-po-out]")).letterSpacing, pressed: [...document.querySelectorAll(".po-grp")[0].children].map((b) => b.getAttribute("aria-pressed")) }));
        assert.equal(seen[styles[i]].attr, styles[i]);
        assert.deepEqual(seen[styles[i]].pressed, [0, 1, 2].map((k) => String(k === i)));
      }
      assert.equal(seen.italique.fs, "italic");
      assert.notEqual(JSON.stringify([seen.capitales.fs, seen.capitales.tt, seen.capitales.ff, seen.capitales.ls]), JSON.stringify([seen.monogramme.fs, seen.monogramme.tt, seen.monogramme.ff, seen.monogramme.ls]), "capitales et monogramme se voient différemment");
      // laques : la couleur du stylo change réellement
      const fills = new Set();
      for (let i = 0; i < 4; i++) {
        await click(page, ".po-grp:last-of-type .po-chip", i);
        const r = await page.evaluate(() => ({ lq: document.querySelector(".po-pen").getAttribute("data-laque"), fill: getComputedStyle(document.querySelector(".po-pen .po-b")).fill, pressed: [...document.querySelectorAll(".po-grp")[1].children].map((b) => b.getAttribute("aria-pressed")) }));
        assert.equal(r.lq, ["petrole", "bordeaux", "nuit", "noir"][i]); assert.deepEqual(r.pressed, [0, 1, 2, 3].map((k) => String(k === i))); fills.add(r.fill);
      }
      assert.equal(fills.size, 4, "4 laques = 4 couleurs de fût différentes : " + [...fills]);
      noErrors(page, "plume-or");
      await page.close();
    });

    test("sans le script : la gravure d'exemple reste visible ; moins d'animations : pk-calme", async () => {
      const page = await sansScript("plume-or", slug("plume-or", "gravure"));
      const t = await page.evaluate(() => ({ out: document.querySelector("[data-po-out]").textContent.trim(), w: document.querySelector("[data-po-out]").getBoundingClientRect().width, inp: document.querySelectorAll(".po-in").length }));
      assert.ok(t.out.length > 2 && t.w > 20 && t.inp === 0, JSON.stringify(t)); noErrors(page, "plume-or/sans script"); await page.close();
      const c = await open("plume-or", home("plume-or"), { browser: calm });
      assert.equal(await c.evaluate(() => document.body.classList.contains("pk-calme")), true); noErrors(c, "plume-or/calme"); await c.close();
    });
  });

  // =========================================================================================================
  describe("lumiere-objet : simulateur d'ambiance", () => {
    const states = (page) => page.evaluate(() => ({ open: [...document.querySelectorAll("details.lo-sw")].map((d) => d.open), st: [...document.querySelectorAll(".lo-st")].filter((s) => getComputedStyle(s).display !== "none").map((s) => s.textContent), glow: getComputedStyle(document.querySelector(".lo-glow--a")).opacity }));
    test("un seul interrupteur ouvert à la fois, pastille d'état éteint / allumé, lueur", async () => {
      const page = await open("lumiere-objet", slug("lumiere-objet", "ambiances"));
      await themeOk(page, "lumiere-objet");
      let s = await states(page);
      assert.deepEqual(s.open, [false, false, false]); assert.deepEqual(s.st, ["Éteint"]); assert.equal(s.glow, "0");
      for (const [i, label] of [[0, /chaude 2700/], [1, /neutre 4000/], [2, /froide 5500/]]) {
        await click(page, "details.lo-sw summary", i); await wait(900);
        s = await states(page);
        assert.deepEqual(s.open, [0, 1, 2].map((k) => k === i), "seul l'interrupteur " + i + " est ouvert");
        assert.equal(s.st.length, 1); assert.match(s.st[0], label); assert.ok(Number(s.glow) > 0.3, "la pièce s'éclaire : " + s.glow);
      }
      await click(page, "details.lo-sw summary", 2); await wait(900); // referme
      s = await states(page);
      assert.deepEqual(s.open, [false, false, false]); assert.deepEqual(s.st, ["Éteint"]);
      noErrors(page, "lumiere-objet/ambiances"); await page.close();
    });

    test("faisceau de l'accueil : suit le curseur (souris réelle)", async () => {
      const page = await open("lumiere-objet", home("lumiere-objet"));
      const r = await page.evaluate(() => { const h = document.querySelector(".lo-hero"); h.scrollIntoView({ block: "start" }); const b = h.getBoundingClientRect(); return { x: b.x, y: b.y, w: b.width, h: b.height, has: h.style.getPropertyValue("--lo-x") }; });
      await wait(300);
      const b = await page.evaluate(() => { const b = document.querySelector(".lo-hero").getBoundingClientRect(); return { x: b.x, y: b.y, w: b.width, h: b.height }; });
      await page.mouseMove(b.x + b.w * 0.2, b.y + Math.min(b.h, 800) * 0.25); await wait(250);
      const p1 = await page.evaluate(() => ({ x: parseFloat(document.querySelector(".lo-hero").style.getPropertyValue("--lo-x")), y: parseFloat(document.querySelector(".lo-hero").style.getPropertyValue("--lo-y")) }));
      await page.mouseMove(b.x + b.w * 0.8, b.y + Math.min(b.h, 800) * 0.25); await wait(250);
      const p2 = await page.evaluate(() => ({ x: parseFloat(document.querySelector(".lo-hero").style.getPropertyValue("--lo-x")) }));
      assert.ok(Math.abs(p1.x - 20) < 6, "20 % attendu, obtenu " + p1.x); assert.ok(Math.abs(p2.x - 80) < 6, "80 % attendu, obtenu " + p2.x);
      assert.equal(r.has, "", "avant le mouvement la position n'est pas imposée");
      noErrors(page, "lumiere-objet/accueil"); await page.close();
    });

    test("moins d'animations : le faisceau ne suit plus le curseur ; sans script : le simulateur s'ouvre quand même (details)", async () => {
      const c = await open("lumiere-objet", home("lumiere-objet"), { browser: calm });
      const b = await c.evaluate(() => { const h = document.querySelector(".lo-hero"); h.scrollIntoView({ block: "start" }); const r = h.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width }; });
      await wait(200); await c.mouseMove(b.x + b.w * 0.3, b.y + 200); await wait(250);
      assert.equal(await c.evaluate(() => document.querySelector(".lo-hero").style.getPropertyValue("--lo-x")), "", "pas de suivi du curseur");
      assert.equal(await c.evaluate(() => [...document.querySelectorAll(".lo-beam, .lo-hl-c")].every((e) => getComputedStyle(e).animationName === "none")), true, "aucune animation en cours");
      noErrors(c, "lumiere-objet/calme"); await c.close();
      const page = await sansScript("lumiere-objet", slug("lumiere-objet", "ambiances"));
      await click(page, "details.lo-sw summary", 1); await wait(900);
      const s = await states(page);
      assert.deepEqual(s.open, [false, true, false]); assert.match(s.st.join(), /neutre 4000/);
      noErrors(page, "lumiere-objet/sans script"); await page.close();
    });
  });

  // =========================================================================================================
  describe("carre-soie : vue plein écran du motif", () => {
    const view = (page) => page.evaluate(() => { const b = document.querySelector("details[data-cs-motif][open]") || document.querySelector("details[data-cs-motif]"); const s = b.querySelector(".cs-stage"); return { open: b.open, level: b.querySelector("[data-cs-level]").textContent, z: b.querySelector(".cs-canvas").style.getPropertyValue("--cs-z"), sw: s.scrollWidth, cw: s.clientWidth, focus: document.activeElement.className, rect: s.getBoundingClientRect().toJSON(), bw: innerWidth, bh: innerHeight, nopen: document.querySelectorAll("details[data-cs-motif][open]").length }; });
    test("ouverture plein écran, boutons + − et réinitialisation, touches + − 0, ctrl+molette, double clic, glissement, Échap", async () => {
      const page = await open("carre-soie", slug("carre-soie", "les motifs"));
      await themeOk(page, "carre-soie");
      assert.equal(await page.evaluate(() => document.querySelectorAll("details[data-cs-motif]").length) >= 2, true);
      await click(page, "details[data-cs-motif] summary.cs-sum", 0); await wait(400);
      let v = await view(page);
      assert.equal(v.open, true); assert.equal(v.level, "100 %"); assert.equal(v.focus, "cs-stage", "le focus passe dans la vue");
      assert.ok(v.rect.width >= v.bw - 2 && v.rect.height >= v.bh * 0.8, "plein écran : " + JSON.stringify(v.rect));
      await click(page, "[data-cs-z='1']"); v = await view(page); assert.equal(v.level, "150 %"); assert.equal(v.z, "1.5");
      await click(page, "[data-cs-z='1']"); v = await view(page); assert.equal(v.level, "225 %"); assert.ok(v.sw > v.cw, "le contenu zoomé dépasse la fenêtre (défilable)");
      await click(page, "[data-cs-z='-1']"); v = await view(page); assert.equal(v.level, "150 %");
      await click(page, "[data-cs-z='0']"); v = await view(page); assert.equal(v.level, "100 %");
      for (let i = 0; i < 12; i++) await click(page, "[data-cs-z='1']");
      v = await view(page); assert.equal(v.level, "800 %", "plafonné à 8×");
      for (let i = 0; i < 12; i++) await click(page, "[data-cs-z='-1']");
      v = await view(page); assert.equal(v.level, "100 %", "plancher à 100 %");
      // clavier
      await page.key("+"); v = await view(page); assert.equal(v.level, "150 %");
      await page.key("-"); v = await view(page); assert.equal(v.level, "100 %");
      await page.key("="); await page.key("="); await page.key("0"); v = await view(page); assert.equal(v.level, "100 %");
      // ctrl + molette sur le curseur ; molette seule = défilement, pas de zoom
      const r = v.rect;
      await page.evaluate(([x, y]) => { const s = document.querySelector("details[data-cs-motif][open] .cs-stage"); const e = new WheelEvent("wheel", { deltaY: 120, clientX: x, clientY: y, bubbles: true, cancelable: true }); s.dispatchEvent(e); }, [r.x + 200, r.y + 200]);
      assert.equal((await view(page)).level, "100 %", "molette seule : pas de zoom");
      const prevented = await page.evaluate(([x, y]) => { const s = document.querySelector("details[data-cs-motif][open] .cs-stage"); const e = new WheelEvent("wheel", { ctrlKey: true, deltaY: -100, clientX: x, clientY: y, bubbles: true, cancelable: true }); s.dispatchEvent(e); return e.defaultPrevented; }, [r.x + 200, r.y + 200]);
      v = await view(page); assert.equal(prevented, true, "ctrl+molette ne zoome pas la page entière"); assert.equal(v.level, "272 %");
      // double clic : retour à 100 % puis zoom ×3
      await page.evaluate(() => { document.querySelector("details[data-cs-motif][open] .cs-canvas").dispatchEvent(new MouseEvent("dblclick", { bubbles: true, clientX: 300, clientY: 300 })); });
      assert.equal((await view(page)).level, "100 %", "double clic quand c'est zoomé : retour");
      await page.evaluate(() => { document.querySelector("details[data-cs-motif][open] .cs-canvas").dispatchEvent(new MouseEvent("dblclick", { bubbles: true, clientX: 300, clientY: 300 })); });
      assert.equal((await view(page)).level, "300 %", "double clic : zoom ×3");
      // glissement (souris) : le défilement bouge dans le sens inverse
      const sc0 = await page.evaluate(() => { const s = document.querySelector("details[data-cs-motif][open] .cs-stage"); s.scrollLeft = 400; s.scrollTop = 300; return [s.scrollLeft, s.scrollTop]; });
      await page.evaluate(() => { const s = document.querySelector("details[data-cs-motif][open] .cs-stage"); const ev = (t, x, y, tgt) => (tgt || s).dispatchEvent(new PointerEvent(t, { pointerType: "mouse", button: 0, clientX: x, clientY: y, bubbles: true })); ev("pointerdown", 500, 500); ev("pointermove", 450, 460, window); });
      const sc1 = await page.evaluate(() => { const s = document.querySelector("details[data-cs-motif][open] .cs-stage"); const out = [s.scrollLeft, s.scrollTop, s.classList.contains("cs-drag")]; window.dispatchEvent(new PointerEvent("pointerup", { pointerType: "mouse" })); return out.concat(s.classList.contains("cs-drag")); });
      assert.equal(sc1[0], sc0[0] + 50); assert.equal(sc1[1], sc0[1] + 40); assert.equal(sc1[2], true); assert.equal(sc1[3], false, "fin du glissement");
      // Échap ferme et rend le focus au résumé
      await page.key("Escape"); await wait(300);
      const e = await page.evaluate(() => ({ open: document.querySelectorAll("details[data-cs-motif][open]").length, focus: document.activeElement.className }));
      assert.equal(e.open, 0); assert.equal(e.focus, "cs-sum");
      noErrors(page, "carre-soie"); await page.close();
    });

    test("un seul motif ouvert à la fois, zoom remis à 100 % à l'ouverture ; sans script la vue s'ouvre et se ferme", async () => {
      const page = await open("carre-soie", slug("carre-soie", "les motifs"));
      await click(page, "details[data-cs-motif] summary.cs-sum", 0); await wait(300);
      await click(page, "[data-cs-z='1']");
      await click(page, "details[data-cs-motif] summary.cs-sum", 1); await wait(500); // ouvre le 2e (le 1er est sous la vue : clic par le script)
      const o = await page.evaluate(() => ({ opened: [...document.querySelectorAll("details[data-cs-motif]")].map((d) => d.open), lv: [...document.querySelectorAll("[data-cs-level]")].map((l) => l.textContent) }));
      assert.deepEqual(o.opened.slice(0, 2), [false, true], JSON.stringify(o)); assert.equal(o.lv[1], "100 %");
      noErrors(page, "carre-soie/exclusif"); await page.close();
      const s = await sansScript("carre-soie", slug("carre-soie", "les motifs"));
      await click(s, "details[data-cs-motif] summary.cs-sum", 0); await wait(300);
      const nj = await s.evaluate(() => { const b = document.querySelector("details[data-cs-motif]"); const z = b.querySelector(".cs-zoom"); const zc = b.querySelector(".cs-zc"); const vis = getComputedStyle(z).display !== "none"; z.querySelector("summary").click(); return { zoomBtn: vis, controlsHidden: getComputedStyle(zc).display === "none", z: getComputedStyle(b.querySelector(".cs-canvas")).getPropertyValue("--cs-z").trim() }; });
      assert.equal(nj.zoomBtn, true, "sans script : bouton « Loupe ×3 »"); assert.equal(nj.controlsHidden, true, "sans script : pas de boutons + − qui ne feraient rien"); assert.equal(nj.z, "3", "la loupe agrandit en CSS");
      const q = await s.evaluate(() => ({ open: document.querySelector("details[data-cs-motif]").open, w: document.querySelector("details[data-cs-motif] .cs-stage").getBoundingClientRect().width }));
      assert.equal(q.open, true); assert.ok(q.w > 300);
      await click(s, "details[data-cs-motif] summary.cs-sum", 0); await wait(200);
      assert.equal(await s.evaluate(() => document.querySelector("details[data-cs-motif]").open), false);
      noErrors(s, "carre-soie/sans script"); await s.close();
    });

    test("moins d'animations : pk-calme et la vue fonctionne", async () => {
      const c = await open("carre-soie", slug("carre-soie", "les motifs"), { browser: calm });
      assert.equal(await c.evaluate(() => document.body.classList.contains("pk-calme")), true);
      await click(c, "details[data-cs-motif] summary.cs-sum", 0); await wait(300);
      assert.deepEqual(await c.evaluate(() => { const b = document.querySelector("details[data-cs-motif]"); return [getComputedStyle(b.querySelector(".cs-zc")).display !== "none", getComputedStyle(b.querySelector(".cs-zoom")).display === "none"]; }), [true, true], "avec script : boutons + − visibles, loupe CSS masquée");
      await click(c, "[data-cs-z='1']");
      assert.equal((await view(c)).level, "150 %"); noErrors(c, "carre-soie/calme"); await c.close();
    });
  });

  // =========================================================================================================
  describe("dentelle : guide des tailles", () => {
    test("pas de motion.js ; volets dépliants, tableaux cohérents entre eux et avec l'exemple", async () => {
      const page = await open("dentelle", slug("dentelle", "guide"));
      await themeOk(page, "dentelle");
      const files = await page.evaluate(() => performance.getEntriesByType("resource").map((r) => r.name).filter((n) => /theme-packs/.test(n) && /motion/.test(n)));
      assert.deepEqual(files, [], "dentelle n'a pas de script de thème (guide 100 % balisage)");
      const d = await page.evaluate(() => [...document.querySelectorAll("details.dt-g")].map((x) => ({ open: x.open, t: x.querySelector(".dt-g-t").textContent })));
      assert.ok(d.length >= 5, JSON.stringify(d)); assert.equal(d[0].open, true); assert.ok(d.slice(1).every((x) => !x.open));
      // chaque volet s'ouvre / se ferme au clic, contenu rendu visible
      for (let i = 1; i < d.length; i++) {
        await click(page, "details.dt-g summary", i); await wait(80);
        const r = await page.evaluate((n) => { const x = document.querySelectorAll("details.dt-g")[n]; const b = x.querySelector(".dt-g-b").getBoundingClientRect(); return { open: x.open, h: b.height, w: b.width }; }, i);
        assert.equal(r.open, true); assert.ok(r.h > 20 && r.w > 100, `volet ${i} visible : ${JSON.stringify(r)}`);
      }
      await click(page, "details.dt-g summary", 1); await wait(80);
      assert.equal(await page.evaluate(() => document.querySelectorAll("details.dt-g")[1].open), false, "second clic = referme");
      // cohérence des tableaux : lire les trois barèmes dans la page et refaire les règles
      const T = await page.evaluate(() => [...document.querySelectorAll("table.dt-tb")].map((t) => ({ cap: t.querySelector("caption").textContent, rows: [...t.querySelectorAll("tbody tr")].map((r) => [r.querySelector("th").textContent.trim(), ...[...r.querySelectorAll("td")].map((c) => c.textContent.trim())]) })));
      assert.equal(T.length, 3);
      const bands = T[0].rows, cups = T[1].rows, sisters = T[2].rows;
      for (const [rng, fr, eu, uk] of bands) {
        const [a, b] = rng.match(/\d+/g).map(Number);
        assert.equal(b - a, 4, "plage de 5 cm : " + rng); assert.equal(Number(eu), (a + b) / 2, "bande européenne = centre de la plage"); assert.equal(Number(fr), Number(eu) + 15); assert.equal(Number(uk), 30 + (2 * (Number(eu) - 65)) / 5);
      }
      const order = ["AA", "A", "B", "C", "D", "E", "F", "G", "H"];
      cups.forEach(([rng, cup], i) => { const [a, b] = rng.match(/\d+/g).map(Number); assert.equal(a, 10 + 2 * i); assert.equal(b, a + 1); assert.equal(cup, order[i]); });
      assert.deepEqual(cups.map((r) => r[2]), ["AA", "A", "B", "C", "D", "DD", "E", "F", "FF"], "lettres britanniques");
      for (const [size, up, down] of sisters) {
        const [, band, cup] = /^(\d+)([A-Z]+)$/.exec(size) ? [0, Number(/^(\d+)/.exec(size)[1]), /([A-Z]+)$/.exec(size)[1]] : [];
        const i = order.indexOf(cup); assert.equal(up, `${band + 5}${order[i - 1]}`); assert.equal(down, `${band - 5}${order[i + 1]}`);
      }
      // l'exemple chiffré du guide (77 / 93 cm) retombe sur les tableaux : 90C
      const ex = await page.evaluate(() => [...document.querySelectorAll("details.dt-g")].map((x) => x.textContent).find((t) => /77 cm sous la poitrine/.test(t)));
      assert.match(ex, /90C/); assert.equal(bands.find((r) => r[0].startsWith("73"))[1], "90"); assert.equal(cups.find((r) => r[0].startsWith("16"))[1], "C");
      noErrors(page, "dentelle"); await page.close();
    });

    test("tableaux lisibles sur mobile (défilement interne, pas de débordement de la page) et sans mouvement à l'ouverture", async () => {
      const page = await open("dentelle", slug("dentelle", "guide"), { opts: { width: 390, height: 800 } });
      for (let i = 1; i < 4; i++) await click(page, "details.dt-g summary", i);
      await wait(200);
      const r = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: innerWidth }));
      assert.ok(r.sw <= r.iw + 1, "la page ne défile pas à l'horizontale : " + JSON.stringify(r));
      noErrors(page, "dentelle/mobile"); await page.close();
      const c = await open("dentelle", slug("dentelle", "guide"), { browser: calm });
      await click(c, "details.dt-g summary", 2); assert.equal(await c.evaluate(() => document.querySelectorAll("details.dt-g")[2].open), true); noErrors(c, "dentelle/calme"); await c.close();
    });
  });

  // =========================================================================================================
  describe("monture-claire : sélecteur de formes par visage", () => {
    const sel = (page) => page.evaluate(() => ({ open: [...document.querySelectorAll("details[data-visage]")].map((d) => d.open), status: document.querySelector("[data-mc-status]").textContent, svgs: document.querySelectorAll("[data-mc-stage] svg").length, g: (document.querySelector("[data-mc-stage] svg g") || { getAttribute: () => null }).getAttribute("transform"), mini: document.querySelector("[data-mc-stage] svg") ? document.querySelector("[data-mc-stage] svg").innerHTML.length : 0 }));
    test("un seul menu ouvert, aperçu visage + monture au clic, au survol et au focus, liens vivants", async () => {
      const page = await open("monture-claire", slug("monture-claire", "trouver"));
      await themeOk(page, "monture-claire");
      let s = await sel(page);
      assert.deepEqual(s.open, [true, false, false, false, false], "démarre sur le visage ovale"); assert.match(s.status, /visage ovale, monture pantos/); assert.equal(s.svgs, 1);
      const before = s.mini;
      const names = ["ovale", "rond", "carré", "en cœur", "long"];
      for (const i of [2, 4, 1, 3]) {
        await click(page, "details[data-visage] summary", i); await wait(300);
        s = await sel(page);
        assert.deepEqual(s.open, [0, 1, 2, 3, 4].map((k) => k === i), "un seul menu ouvert (" + i + ")");
        assert.match(s.status, new RegExp("visage " + names[i])); assert.equal(s.svgs, 1, "une seule illustration");
      }
      const status3 = (await sel(page)).status;
      // survol réel d'une autre forme du menu ouvert
      const pos = await page.evaluate(() => { const a = document.querySelectorAll("details[data-visage][open] .mc-fl a")[2]; a.scrollIntoView({ block: "center" }); const r = a.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2, name: a.querySelector(".mc-fn").textContent.toLowerCase() }; });
      await page.mouseMove(pos.x, pos.y); await wait(250);
      s = await sel(page); assert.match(s.status, new RegExp("monture " + pos.name + "\\.")); assert.notEqual(s.status, status3);
      // focus clavier sur la 2e forme
      const nm = await page.evaluate(() => { const a = document.querySelectorAll("details[data-visage][open] .mc-fl a")[1]; a.focus(); return a.querySelector(".mc-fn").textContent.toLowerCase(); });
      await wait(200); s = await sel(page); assert.match(s.status, new RegExp("monture " + nm + "\\."));
      assert.notEqual(s.mini, before);
      // les liens des formes et des catégories répondent
      const l = await linksOk(page, "details[data-visage] a[href]"); assert.ok(l.n >= 6); assert.deepEqual(l.bad, []);
      noErrors(page, "monture-claire"); await page.close();
    });

    test("clavier : Entrée sur un menu l'ouvre et ferme les autres ; les liens des formes ont le rôle « lien »", async () => {
      const page = await open("monture-claire", slug("monture-claire", "trouver"));
      await page.evaluate(() => document.querySelectorAll("details[data-visage] summary")[1].focus());
      await page.key("Enter"); await wait(400);
      let s = await sel(page);
      if (!s.open[1]) { await page.key(" "); await wait(400); s = await sel(page); } // certains Chrome n'activent que l'espace en mode sans fenêtre
      assert.deepEqual(s.open, [false, true, false, false, false]);
      const roles = await page.evaluate(() => [...document.querySelectorAll("details[data-visage] .mc-fl a")].map((a) => a.getAttribute("role")));
      assert.ok(roles.length > 0 && roles.every((r) => r === null), "aucun role=listitem sur un lien (il supprimait son rôle de lien) : " + roles);
      noErrors(page, "monture-claire/clavier"); await page.close();
    });

    test("fiche produit : note de forme tirée des étiquettes du produit (pas de lien « Trouver ma forme » si le menu du site ne contient pas /formes)", async () => {
      const page = await open("monture-claire", "/boutique/produit/solaire-verriere");
      const n = await page.evaluate(() => [...document.querySelectorAll(".mc-fiche-note")].map((p) => p.textContent));
      assert.equal(n.length, 1); assert.match(n[0], /^Forme ovale/); assert.match(n[0], /à confirmer en essayant/);
      const hasMenu = await page.evaluate(() => !!document.querySelector('a[href="/formes"]'));
      assert.equal(await page.evaluate(() => !!document.querySelector(".mc-fiche-note a")), hasMenu);
      // un produit sans étiquette de forme : aucune note
      const p2 = await open("monture-claire", "/boutique/produit/chiffon-microfibre");
      assert.equal(await p2.evaluate(() => document.querySelectorAll(".mc-fiche-note").length), 0); noErrors(p2, "monture-claire/fiche sans forme"); await p2.close();
      noErrors(page, "monture-claire/fiche"); await page.close();
    });

    test("sans le script : les menus restent de vrais « details » avec de vrais liens ; moins d'animations : tout est révélé", async () => {
      const page = await sansScript("monture-claire", slug("monture-claire", "trouver"));
      await click(page, "details[data-visage] summary", 2); await wait(200);
      const r = await page.evaluate(() => ({ open: document.querySelectorAll("details[data-visage][open]").length, links: document.querySelectorAll("details[data-visage][open] .mc-fl a").length, h: document.querySelector("[data-mc-stage]").getBoundingClientRect().height, svg: document.querySelectorAll("[data-mc-stage] svg").length }));
      assert.ok(r.links >= 3 && r.open >= 1 && r.h > 100 && r.svg === 1, JSON.stringify(r)); noErrors(page, "monture-claire/sans script"); await page.close();
      const c = await open("monture-claire", home("monture-claire"), { browser: calm });
      const v = await c.evaluate(() => ({ n: document.querySelectorAll(".mc-rv").length, inn: document.querySelectorAll(".mc-rv.is-in").length }));
      assert.equal(v.inn, v.n, JSON.stringify(v)); noErrors(c, "monture-claire/calme"); await c.close();
    });
  });

  // =========================================================================================================
  describe("percale-fine : sélecteur de lit", () => {
    test("boutons aria-pressed, ligne mise en avant, liens de dimension, choix mémorisé", async () => {
      const url = slug("percale-fine", "choisir");
      const page = await open("percale-fine", url);
      await themeOk(page, "percale-fine");
      assert.equal(await page.evaluate(async () => (await (await fetch(location.href)).text()).includes("pc-opt")), false, "boutons créés par motion.js");
      const base = await page.evaluate(() => ({ b: [...document.querySelectorAll("[data-pc-pick] button")].map((x) => x.getAttribute("data-lit") + ":" + x.getAttribute("aria-pressed")), rows: document.querySelectorAll("tbody tr[data-lit]").length }));
      assert.equal(base.b.length, base.rows); assert.ok(base.b.every((x) => x.endsWith(":false")), "rien de sélectionné au départ : " + base.b);
      const table = await page.evaluate(() => [...document.querySelectorAll("tbody tr[data-lit]")].map((r) => [r.getAttribute("data-lit"), ...[...r.querySelectorAll("td")].map((c) => c.textContent.trim())]));
      const heads = await page.evaluate(() => [...document.querySelectorAll("thead th a")].map((a) => a.textContent.toLowerCase() + "|" + a.getAttribute("href")));
      for (const i of [1, 3, 0]) {
        await click(page, "[data-pc-pick] button", i);
        const r = await page.evaluate(() => ({ pressed: [...document.querySelectorAll("[data-pc-pick] button")].map((b) => b.getAttribute("aria-pressed")), cls: [...document.querySelectorAll("tbody tr[data-lit]")].map((t) => t.className), op: [...document.querySelectorAll("tbody tr[data-lit]")].map((t) => getComputedStyle(t).opacity), res: document.querySelector("[data-pc-res]").innerText, links: [...document.querySelectorAll("[data-pc-res] a")].map((a) => a.textContent + "|" + a.getAttribute("href")), vals: [...document.querySelectorAll("[data-pc-res] li b")].map((b) => b.textContent) }));
        assert.deepEqual(r.pressed, table.map((_, k) => String(k === i)), "un seul bouton enfoncé");
        assert.deepEqual(r.cls.map((c) => /pc-on/.test(c)), table.map((_, k) => k === i)); assert.deepEqual(r.cls.map((c) => /pc-dim/.test(c)), table.map((_, k) => k !== i));
        assert.ok(Number(r.op[i]) > Number(r.op[(i + 1) % table.length]) || r.op[i] === "1", "ligne choisie plus lisible que les autres : " + r.op);
        assert.match(r.res, new RegExp(`lit de ${table[i][0]} cm`)); assert.deepEqual(r.vals, table[i].slice(1), "valeurs = ligne du tableau");
        assert.deepEqual(r.links, heads.map((h) => "Voir : " + h.split("|")[0] + "|" + h.split("|")[1]), "liens de dimension = en-têtes du tableau");
      }
      const l = await linksOk(page, "[data-pc-res] a"); assert.equal(l.n, 3); assert.deepEqual(l.bad, [], "les liens de dimension ouvrent le catalogue");
      // mémorisé : au rechargement la ligne revient
      await click(page, "[data-pc-pick] button", 2);
      await page.goto(sites["percale-fine"].base + url); await wait(500);
      assert.equal(await page.evaluate(() => document.querySelector("[data-pc-pick] button[aria-pressed=true]").getAttribute("data-lit")), table[2][0], "choix retrouvé");
      noErrors(page, "percale-fine"); await page.close();
    });

    test("sans le script : le tableau reste lisible ; moins d'animations : pk-calme ; pas de stockage : aucune erreur", async () => {
      const page = await sansScript("percale-fine", slug("percale-fine", "choisir"));
      const r = await page.evaluate(() => ({ rows: document.querySelectorAll("tbody tr[data-lit]").length, ops: [...document.querySelectorAll("tbody tr[data-lit]")].map((t) => getComputedStyle(t).opacity), btn: document.querySelectorAll("[data-pc-pick] button").length, links: document.querySelectorAll("thead th a[href]").length }));
      assert.ok(r.rows >= 4 && r.btn === 0 && r.links === 3 && r.ops.every((o) => Number(o) > 0.9), JSON.stringify(r)); noErrors(page, "percale-fine/sans script"); await page.close();
      const c = await open("percale-fine", slug("percale-fine", "choisir"), { browser: calm });
      assert.equal(await c.evaluate(() => document.body.classList.contains("pk-calme")), true);
      await click(c, "[data-pc-pick] button", 1); assert.equal(await c.evaluate(() => document.querySelectorAll("[data-pc-pick] button[aria-pressed=true]").length), 1); noErrors(c, "percale-fine/calme"); await c.close();
    });
  });

  // =========================================================================================================
  test("petit écran (390 px) : les blocs interactifs ouverts ne font pas déborder la page", async () => {
    const pages = [["cuir", "atelier"], ["plume-or", "gravure"], ["lumiere-objet", "ambiances"], ["carre-soie", "les motifs"], ["dentelle", "guide"], ["monture-claire", "trouver"], ["percale-fine", "choisir"]];
    for (const [key, start] of pages) {
      const page = await open(key, slug(key, start), { opts: { width: 390, height: 800 } });
      await page.evaluate(() => { document.querySelectorAll("details:not([data-cs-motif]) > summary").forEach((s, i) => { if (i < 4) s.click(); }); document.querySelectorAll("[data-pc-pick] button, .po-chip, .cu-opt").forEach((b, i) => { if (i < 3) b.click(); }); });
      await wait(900);
      const r = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: innerWidth, out: [...document.querySelectorAll("main *")].filter((e) => { const b = e.getBoundingClientRect(); return b.width > 0 && b.right > innerWidth + 1 && !e.closest("svg, .dt-tw, .pc-tw, table, [data-cs-motif]") && getComputedStyle(e).position !== "fixed"; }).slice(0, 3).map((e) => e.className || e.tagName) }));
      assert.ok(r.sw <= r.iw + 1, `${key} : la page déborde (${r.sw} > ${r.iw}) ${r.out}`);
      noErrors(page, key + "/mobile"); await page.close();
    }
  });

  test("stockage du navigateur interdit : le sélecteur de lit fonctionne quand même, sans erreur", async () => {
    const page = await chrome.newPage(OPTS);
    await page.goto(sites["percale-fine"].base + slug("percale-fine", "choisir"));
    await page.evaluate(async () => { const t = (await (await fetch(location.href)).text()).replace("<head>", '<head><script>Object.defineProperty(window,"localStorage",{get:function(){throw new Error("stockage interdit")}})</script>'); document.open(); document.write(t); document.close(); });
    await wait(1200);
    assert.equal(await page.evaluate(() => { try { return typeof localStorage; } catch (e) { return "bloqué"; } }), "bloqué", "le blocage est bien en place");
    await click(page, "[data-pc-pick] button", 2);
    assert.equal(await page.evaluate(() => document.querySelectorAll("[data-pc-pick] button[aria-pressed=true]").length), 1);
    noErrors(page, "percale-fine/stockage interdit"); await page.close();
  });

  test("fiches et panier réels des sept thèmes : les scripts n'ajoutent aucune erreur", async () => {
    for (const key of KEYS) {
      const slugP = db.prepare("SELECT slug FROM mk_shop_products WHERE site_id = ? AND type = 'simple' AND stock_qty > 0 ORDER BY id LIMIT 1").get(sites[key].siteId).slug;
      for (const u of ["/boutique", `/boutique/produit/${slugP}`, "/boutique/panier"]) {
        const page = await open(key, u); await themeOk(page, key); noErrors(page, key + u); await page.close();
      }
    }
  });
});
