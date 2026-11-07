// Thèmes de boutique (E-commerce 2/2 et spécialisés) dans un VRAI Chrome : chaque thème est installé sur son propre site de test (catalogue de démonstration + pages de démonstration publiées),
// puis un visiteur réel clique, saisit et regarde. Zéro erreur JavaScript, comportement sans script (JavaScript coupé dans Chrome), « réduire les animations » (émulé dans Chrome),
// liens vers les briques du moteur (/boutique/comparer, /boutique/rendez-vous…). Ignoré proprement si Chrome est absent.
// Le pilote de ce fichier est local (même principe que tests/helpers-chrome-cdp.js, avec en plus : erreurs de console, JavaScript coupé, mouvement réduit, résolution *.example).
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawn } = require("node:child_process");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, Client, loginInstructor } = require("./helpers");
const cdp = require("./helpers-chrome-cdp");
const library = require("../src/marketing/themes/library");
const shopkit = require("../src/marketing/themes/packs/shopkit");
const { sec } = require("../src/marketing/themes/packs/kit");

const ALL = ["ambre-rare", "cercle-prive", "cabine-haute", "performance-pure", "box-du-mois", "deuxieme-vie", "produit-unique", "objectif-noir", "perle-noire", "atelier-botte", "petit-nid", "cuisine-claire"];
const KEYS = ALL.filter((k) => fs.existsSync(path.join(__dirname, "..", "src", "marketing", "themes", "packs", k, "pack.js")));
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const wait = cdp.wait;
const flat = (s) => String(s).replace(/\s+/g, "").replace(/ | /g, "");

// ---------- Pilote Chrome local ----------
async function launchChrome() {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "kw-chrome-ie2-"));
  const child = spawn(CHROME, ["--headless=new", "--remote-debugging-port=0", `--user-data-dir=${profile}`, "--no-first-run", "--no-default-browser-check", "--disable-gpu", "--window-size=1500,1000", "--host-resolver-rules=MAP *.example localhost", "about:blank"], { stdio: ["ignore", "ignore", "pipe"], detached: true });
  let err = ""; child.stderr.on("data", (d) => (err += d));
  let wsUrl = null;
  for (let i = 0; i < 300 && !wsUrl; i++) { const m = /DevTools listening on (ws:\/\/\S+)/.exec(err); if (m) wsUrl = m[1]; else await wait(100); }
  const kill = () => { try { process.kill(-child.pid, "SIGKILL"); } catch { /* déjà arrêté */ } };
  if (!wsUrl) { kill(); throw new Error("Chrome n'a pas démarré : " + err.slice(0, 300)); }
  const ws = new WebSocket(wsUrl);
  await new Promise((ok, ko) => { ws.addEventListener("open", ok); ws.addEventListener("error", ko); });
  let seq = 0; const waiting = new Map(); const listeners = [];
  ws.addEventListener("message", (m) => { const x = JSON.parse(m.data); if (x.id && waiting.has(x.id)) { const w = waiting.get(x.id); waiting.delete(x.id); x.error ? w.ko(new Error(x.error.message)) : w.ok(x.result); } else listeners.forEach((l) => l(x)); });
  const send = (method, params = {}, sessionId) => new Promise((ok, ko) => { const id = ++seq; const timer = setTimeout(() => { waiting.delete(id); ko(new Error("Chrome ne répond pas : " + method)); }, 60000); waiting.set(id, { ok: (v) => { clearTimeout(timer); ok(v); }, ko: (e) => { clearTimeout(timer); ko(e); } }); ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) })); });

  async function newPage({ width = 1280, height = 900, reduce = false, noJs = false, init = "" } = {}) {
    const { targetId } = await send("Target.createTarget", { url: "about:blank" });
    const { sessionId } = await send("Target.attachToTarget", { targetId, flatten: true });
    const cmd = (m, p) => send(m, p, sessionId);
    await cmd("Page.enable"); await cmd("Runtime.enable"); await cmd("Log.enable");
    await cmd("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: false });
    if (reduce) await cmd("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
    if (init) await cmd("Page.addScriptToEvaluateOnNewDocument", { source: init });
    if (noJs) await cmd("Emulation.setScriptExecutionDisabled", { value: true });
    const errors = [];
    listeners.push((x) => {
      if (x.sessionId !== sessionId) return;
      if (x.method === "Page.javascriptDialogOpening") cmd("Page.handleJavaScriptDialog", { accept: true }).catch(() => {});
      if (x.method === "Runtime.exceptionThrown") errors.push("exception : " + ((x.params.exceptionDetails.exception && x.params.exceptionDetails.exception.description) || x.params.exceptionDetails.text));
      if (x.method === "Log.entryAdded" && x.params.entry.level === "error" && !/favicon/.test(x.params.entry.url || x.params.entry.text || "")) errors.push("journal : " + x.params.entry.text + " " + (x.params.entry.url || ""));
      if (x.method === "Runtime.consoleAPICalled" && x.params.type === "error") errors.push("console.error : " + x.params.args.map((a) => a.value || a.description).join(" "));
    });
    const page = {
      errors,
      // JavaScript coupé : la page se charge sans exécuter aucun script, puis l'exécution est rétablie pour pouvoir LIRE la page (les scripts de la page ne se relancent pas)
      async goto(url) { await cmd("Page.navigate", { url }); if (noJs) { await wait(2000); await cmd("Emulation.setScriptExecutionDisabled", { value: false }); return; } await wait(150); for (let i = 0; i < 300; i++) { if (await page.evaluate("document.readyState === 'complete'").catch(() => false)) break; await wait(100); } await wait(150); },
      async evaluate(fn, arg) {
        const expression = typeof fn === "function" ? `(${fn})(${JSON.stringify(arg === undefined ? null : arg)})` : fn;
        const r = await cmd("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
        if (r.exceptionDetails) throw new Error((r.exceptionDetails.exception && r.exceptionDetails.exception.description) || r.exceptionDetails.text);
        return r.result.value;
      },
      async waitFor(fn, what = "condition", timeout = 8000, arg) {
        const end = Date.now() + timeout;
        for (;;) { let v = false; try { v = await page.evaluate(fn, arg); } catch { /* pas encore */ } if (v) return v; if (Date.now() > end) throw new Error("Délai dépassé : " + what); await wait(60); }
      },
      // Clic de souris RÉEL au centre de l'élément (défilé d'abord à l'écran)
      async click(sel, nth = 0) {
        const r = await page.evaluate((a) => { const e = document.querySelectorAll(a[0])[a[1]]; if (!e) return null; e.scrollIntoView({ block: "center" }); const b = e.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; }, [sel, nth]);
        if (!r) throw new Error("Élément introuvable : " + sel);
        await wait(80);
        await cmd("Input.dispatchMouseEvent", { type: "mouseMoved", x: r.x, y: r.y });
        await cmd("Input.dispatchMouseEvent", { type: "mousePressed", x: r.x, y: r.y, button: "left", clickCount: 1 });
        await cmd("Input.dispatchMouseEvent", { type: "mouseReleased", x: r.x, y: r.y, button: "left", clickCount: 1 });
      },
      async mouseMove(x, y) { await cmd("Input.dispatchMouseEvent", { type: "mouseMoved", x, y }); },
      // Saisie réelle : focus, sélection, effacement puis frappe caractère par caractère
      async type(sel, text, nth = 0) {
        await page.evaluate((a) => { const e = document.querySelectorAll(a[0])[a[1]]; e.scrollIntoView({ block: "center" }); e.focus(); if (e.select) e.select(); }, [sel, nth]);
        await cmd("Input.dispatchKeyEvent", { type: "keyDown", key: "Backspace", code: "Backspace", windowsVirtualKeyCode: 8 });
        await cmd("Input.dispatchKeyEvent", { type: "keyUp", key: "Backspace", code: "Backspace", windowsVirtualKeyCode: 8 });
        for (const ch of String(text)) { await cmd("Input.dispatchKeyEvent", { type: "keyDown", text: ch, key: ch }); await cmd("Input.dispatchKeyEvent", { type: "keyUp", key: ch }); }
      },
      async key(key) {
        const code = key.length === 1 ? "Key" + key.toUpperCase() : key; const vk = { ArrowRight: 39, ArrowLeft: 37, Enter: 13, Tab: 9 }[key] || 0;
        await cmd("Input.dispatchKeyEvent", { type: "keyDown", key, code, windowsVirtualKeyCode: vk, ...(key === "Enter" ? { text: "\r" } : {}) });
        await cmd("Input.dispatchKeyEvent", { type: "keyUp", key, code, windowsVirtualKeyCode: vk });
      },
      // Parcourt toute la page par paliers (déclenche les observateurs d'apparition)
      async scrollThrough() { await page.evaluate(async () => { const h = document.documentElement.scrollHeight; for (let y = 0; y < h; y += 350) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 40)); } window.scrollTo(0, h); await new Promise((r) => setTimeout(r, 200)); }); },
      async close() { await send("Target.closeTarget", { targetId }).catch(() => {}); },
    };
    return page;
  }
  async function close() { try { ws.close(); } catch { /* ok */ } kill(); await wait(200); try { fs.rmSync(profile, { recursive: true, force: true }); } catch { /* ok */ } }
  return { newPage, close };
}

describe("thèmes E-commerce 2/2 et spécialisés : parcours réels dans Chrome", { skip: cdp.SKIP || (!CHROME ? "Chrome absent" : false), timeout: 3000000 }, () => {
  let srv, boss, db, ch, orgId, port;
  const sites = {};
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const ctx = () => ({ db, organizationId: orgId, userId: null, can: () => true });
  const pagesApi = () => require("../src/marketing/pages");
  const SS = (id) => `/marketing/site-web/sites/${id}`;

  // Site de test d'un thème : boutique réglée, catalogue de démonstration, thème actif, pages de démonstration publiées (nom = clé de la page => adresse /<clé>).
  async function siteOf(key) {
    if (sites[key]) return sites[key];
    const host = `www.${key}-ie2.example`;
    const id = Number(String((await boss.post("/marketing/site-web/sites", { name: `Test ${key}` })).location).match(/sites\/(\d+)/)[1]);
    const cur = JSON.parse((await boss.get(`${SS(id)}/reglages.json`)).text);
    const put = await boss.request(`${SS(id)}/reglages.json`, { method: "PUT", json: { revision: cur.revision, tokens: cur.tokens, settings: { ...cur.settings, seo: { ...cur.settings.seo, publicUrl: `https://${host}` } } } });
    assert.equal(put.status, 200, String(put.text).slice(0, 300));
    const SA = `${SS(id)}/boutique`;
    await boss.post(`${SA}/livraison/zones`, { name: "France", countries: "FR" });
    const zid = one("SELECT id FROM mk_shop_shipping_zones WHERE site_id = ?", id).id;
    await boss.post(`${SA}/livraison/zones/${zid}/methodes`, { name: "Colis", kind: "flat", cost: "5,90" });
    await boss.post(`${SA}/reglages`, { currency: "eur", default_country: "FR", enabled: "1", payment_methods: ["manual"], guest_checkout: "1", order_prefix: "IE2", manual_instructions: "Virement" });
    await boss.post(`${SS(id)}/modules/commerce`, { etat: "activer" });
    shopkit.seed({ db, organizationId: orgId, siteId: id }, require(`../src/marketing/themes/packs/${key}/demo.js`));
    const t = JSON.parse(one("SELECT tokens FROM mk_sites WHERE id = ?", id).tokens); t.pack = { key, options: {} };
    db.prepare("UPDATE mk_sites SET tokens = ? WHERE id = ?").run(JSON.stringify(t), id);
    const urls = {}; let homeId = null;
    for (const p of library.specOf(key).pages) {
      const page = pagesApi().createPage(ctx(), { name: `${key} ${p.key}`, siteId: id, kind: "page", sections: noForms(library.pageSections(key, p.key)) });
      pagesApi().publish(ctx(), page.id);
      if (p.key === "accueil") homeId = page.id;
      urls[p.key] = p.key === "accueil" ? "/" : `/${one("SELECT slug FROM mk_landing_pages WHERE id = ?", page.id).slug}`;
    }
    if (homeId) pagesApi().setHomePage(ctx(), id, homeId);
    const product = one("SELECT id, slug FROM mk_shop_products WHERE site_id = ? AND type = 'simple' AND stock_qty > 0 ORDER BY id LIMIT 1", id);
    // Le registre des sites est mis en cache quelques secondes : on attend que le nouveau domaine soit reconnu (sinon la première page serait celle du site principal)
    for (let i = 0; i < 60; i++) {
      const r = await new Client(srv.base).get("/", { headers: { "x-forwarded-host": host, "User-Agent": "Mozilla/5.0 (test)" } });
      if (r.status === 200 && r.text.includes(`data-kw-pack="${key}"`)) break;
      if (i === 59) throw new Error(`${key} : le site de test n'est pas reconnu`);
      await wait(500);
    }
    return (sites[key] = { id, key, host, base: `http://${host}:${port}`, urls, product });
  }
  // Un bloc « formulaire d'inscription » exige un formulaire publié (hors sujet ici) : il est retiré avant publication
  const noForms = (nodes) => (Array.isArray(nodes) ? nodes.filter((n) => !(n && n.type === "form")).map((n) => (n && n.children ? { ...n, children: noForms(n.children) } : n)) : nodes);
  // Page supplémentaire (bloc modifié par le vendeur) publiée sur le site du thème
  async function extraPage(key, name, html) {
    const s = await siteOf(key);
    const page = pagesApi().createPage(ctx(), { name: `${key} ${name}`, siteId: s.id, kind: "page", sections: [sec(html)] });
    pagesApi().publish(ctx(), page.id);
    return `/${one("SELECT slug FROM mk_landing_pages WHERE id = ?", page.id).slug}`;
  }
  const open = async (key, p, opts) => { const s = await siteOf(key); const pg = await ch.newPage(opts); await pg.goto(`${s.base}${p}`); return pg; };
  const engine = async (key, p) => { const s = await siteOf(key); return new Client(srv.base).get(p, { headers: { "x-forwarded-host": s.host, "User-Agent": "Mozilla/5.0 (test)" } }); };
  const urlOf = async (key, pk) => (await siteOf(key)).urls[pk];
  const guard = async (pg, fn) => { try { return await fn(pg); } finally { await pg.close(); } };
  const noErrors = (pg, what) => assert.deepEqual(pg.errors, [], `${what} : erreurs JavaScript / console`);
  const hiddenCount = (sel) => `[...document.querySelectorAll(${JSON.stringify(sel)})].filter((e) => Number(getComputedStyle(e).opacity) < 0.99).length`;

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    port = new URL(srv.base).port;
    boss = await loginInstructor(srv); db = srv.db();
    orgId = one("SELECT id FROM mk_organizations ORDER BY id LIMIT 1").id;
    ch = await launchChrome();
  });
  after(async () => { if (ch) await ch.close(); if (db) db.close(); if (srv) await srv.stop(); });

  // ===== Général : tous les thèmes, toutes les pages =====
  describe("toutes les pages : zéro erreur, thème actif, script chargé, sans JavaScript, mouvement réduit, liens du moteur", () => {
    for (const key of KEYS) {
      test(`${key} : chaque page de démonstration se charge sans erreur (script actif, script coupé, mouvement réduit) ; liens /boutique valides`, async () => {
        const s = await siteOf(key);
        const jsFile = path.join(__dirname, "..", "src", "marketing", "themes", "packs", key, "motion.js");
        const hasJs = fs.existsSync(jsFile) && fs.statSync(jsFile).size > 0;
        const links = new Set();
        for (const [pk, u] of Object.entries(s.urls)) {
          for (const mode of Object.keys(s.urls).indexOf(pk) < 3 ? [{}, { noJs: true }, { reduce: true }] : [{}]) {
            const pg = await open(key, u, mode);
            await guard(pg, async () => {
              await pg.scrollThrough();
              const info = await pg.evaluate(() => ({ pack: document.body.getAttribute("data-kw-pack"), h1: document.querySelectorAll("h1,[role=heading][aria-level='1']").length, scripts: [...document.scripts].map((x) => x.src).filter((x) => /motion\.js/.test(x)).length, sw: document.documentElement.scrollWidth, iw: innerWidth, links: [...document.querySelectorAll("a[href^='/boutique']")].map((a) => a.getAttribute("href")) }));
              assert.equal(info.pack, key, `${key}/${pk} : thème actif`);
              assert.ok(info.h1 >= 1, `${key}/${pk} : un titre de niveau 1`);
              assert.equal(info.scripts, hasJs ? 1 : 0, `${key}/${pk} : script du thème ${hasJs ? "chargé" : "absent (le thème n'en a pas)"}`);
              assert.ok(info.sw <= info.iw + 1, `${key}/${pk} : pas de défilement horizontal (${info.sw} > ${info.iw})`);
              if (!mode.noJs) noErrors(pg, `${key}/${pk} ${JSON.stringify(mode)}`);
              if (!mode.noJs && !mode.reduce) info.links.forEach((l) => links.add(l));
            });
          }
        }
        // Liens vers les briques du moteur : page 200 avec le thème, ou message du moteur (jamais une erreur serveur / page cassée)
        const bad = [];
        for (const l of links) {
          const r = await engine(key, l);
          if (r.status >= 500) bad.push(`${l} -> ${r.status}`);
          else if (r.status >= 400 && !(r.status === 404 && r.text.length > 300 && !/Cannot GET|stack|at \w+ \(/.test(r.text) && /\b(Ce|Cette|Aucun|Aucune|n'existe|disponible|ouverte|soumis)\b/.test(r.text))) bad.push(`${l} -> ${r.status} sans message du moteur`);
          else if (r.status === 200 && !new RegExp(`data-kw-pack="${key}"`).test(r.text)) bad.push(`${l} -> 200 sans le thème`);
        }
        assert.deepEqual(bad, [], `${key} : liens /boutique cassés`);
      });
    }
  });

  // ===== ambre-rare =====
  describe("ambre-rare", { skip: !KEYS.includes("ambre-rare") }, () => {
    test("fiches de dégustation : un choix colore le verre, une fiche à la fois, clavier, niveau d'ambre", async () => {
      const pg = await open("ambre-rare", await urlOf("ambre-rare", "degustation"));
      await guard(pg, async () => {
        const info = () => pg.evaluate(() => {
          const fs = [...document.querySelectorAll(".ar-fiche")], tabs = [...document.querySelectorAll(".ar-tab")];
          const lq = document.querySelector(".ar-lq2");
          return { n: fs.length, tabs: tabs.length, visible: fs.map((f) => !f.hidden && f.offsetParent !== null), selected: tabs.map((t) => t.getAttribute("aria-selected")), fill: getComputedStyle(lq).fill, data: fs.map((f) => f.getAttribute("data-robe")), nom: fs.map((f) => f.getAttribute("data-nom")), tabText: tabs.map((t) => t.textContent) };
        });
        const toRgb = (hex) => pg.evaluate((h) => { const e = document.createElement("i"); e.style.color = h; document.body.appendChild(e); const c = getComputedStyle(e).color; e.remove(); return c; }, hex);
        const a = await info();
        assert.ok(a.n >= 2); assert.equal(a.tabs, a.n, "un onglet par fiche");
        assert.equal(a.visible.filter(Boolean).length, 1, "une seule fiche visible");
        assert.deepEqual(a.tabText, a.nom);
        assert.equal(a.fill, await toRgb(a.data[0]), "le verre prend la robe de la fiche 1");
        await pg.click(".ar-tab", 1);
        await wait(2200); // le liquide change de couleur en 1,8 s (transition)
        const b = await info();
        assert.deepEqual(b.visible, b.visible.map((v, i) => i === 1), "seule la fiche 2 est visible");
        assert.equal(b.selected[1], "true");
        assert.equal(b.fill, await toRgb(b.data[1]), "le verre prend la robe de la fiche 2");
        assert.notEqual(b.fill, a.fill);
        await pg.evaluate(() => document.querySelectorAll(".ar-tab")[1].focus());
        await pg.key("ArrowRight");
        await wait(2200);
        const c = await info();
        assert.ok(c.visible[2], "flèche droite : fiche 3"); assert.equal(c.fill, await toRgb(c.data[2]));
        assert.equal(await pg.evaluate(() => document.querySelector(".ar-liquid").classList.contains("is-fill")), true, "niveau d'ambre");
        noErrors(pg, "ambre-rare dégustation");
      });
    });
    test("sans JavaScript : toutes les fiches lisibles l'une sous l'autre, sans onglets ; mouvement réduit : le choix fonctionne", async () => {
      const pg = await open("ambre-rare", await urlOf("ambre-rare", "degustation"), { noJs: true });
      await guard(pg, async () => {
        const r = await pg.evaluate(() => { const f = [...document.querySelectorAll(".ar-fiche")]; return { n: f.length, vis: f.filter((x) => !x.hidden && x.offsetHeight > 20 && getComputedStyle(x).visibility !== "hidden" && getComputedStyle(x).display !== "none").length, tabs: document.querySelectorAll(".ar-tab").length, gl: getComputedStyle(document.querySelector(".ar-lq2")).fill }; });
        assert.ok(r.n >= 2); assert.equal(r.vis, r.n, "toutes les fiches visibles"); assert.equal(r.tabs, 0);
        assert.notEqual(r.gl, "none");
      });
      const pr = await open("ambre-rare", await urlOf("ambre-rare", "degustation"), { reduce: true });
      await guard(pr, async () => { await pr.click(".ar-tab", 2); assert.equal(await pr.evaluate(() => document.querySelectorAll(".ar-fiche:not([hidden])").length), 1); noErrors(pr, "mouvement réduit"); });
    });
    test("écran du moteur « contrôle d'âge » : mis en forme avec le thème (fond sombre, boutons du thème), la confirmation ramène à la fiche", async () => {
      const s = await siteOf("ambre-rare");
      const prod = s.product;
      assert.equal((await boss.post(`${SS(s.id)}/boutique/produits/${prod.id}/age`, { min_age: "18" })).status, 302);
      const pg = await open("ambre-rare", `/boutique/age?p=${prod.id}&retour=${encodeURIComponent("/boutique/produit/" + prod.slug)}`);
      await guard(pg, async () => {
        const r = await pg.evaluate(() => { const b = document.querySelector(".sh-main form button, .sh-main form .sh-btn"); return { pack: document.body.dataset.kwPack, bg: getComputedStyle(document.body).backgroundColor, btnBg: b ? getComputedStyle(b).backgroundColor : null, btnN: document.querySelectorAll(".sh-main form button, .sh-main form .sh-btn").length, ow: document.documentElement.scrollWidth <= innerWidth }; });
        assert.equal(r.pack, "ambre-rare");
        assert.ok(r.bg.match(/\d+/g).slice(0, 3).reduce((a, v) => a + Number(v), 0) < 200, "fond sombre du thème : " + r.bg);
        assert.ok(r.btnBg && r.btnBg !== "rgb(239, 239, 239)" && r.btnBg !== "rgba(0, 0, 0, 0)", "boutons mis en forme : " + r.btnBg);
        assert.ok(r.btnN >= 2, "deux choix"); assert.ok(r.ow, "pas de débordement");
        await pg.click(".sh-main form button[value=oui]");
        await pg.waitFor(() => !/\/boutique\/age/.test(location.pathname), "retour après confirmation");
        noErrors(pg, "écran d'âge");
      });
    });
  });

  // ===== cercle-prive =====
  describe("cercle-prive", { skip: !KEYS.includes("cercle-prive") }, () => {
    const iso = (ms) => new Date(Date.now() + ms).toISOString().replace(/\.\d+Z$/, "Z").replace(/:\d\dZ$/, ":00Z");
    const bloc = (attrs) => `<section class="cp-ventes"><article class="cp-vente cp-card" data-cp-vente ${attrs}><h3 class="cp-h3">Vente</h3><p class="cp-etat" data-cp-etat role="status">Texte neutre par défaut</p></article></section>`;
    test("dates valides : état affiché en UTC (à venir / en cours / terminée) ; dates invalides ou absentes : texte neutre intact ; une seule lecture de l'heure, aucune minuterie", async () => {
      const D = 86400000;
      const cases = [
        ["future", `data-debut="${iso(5 * D)}" data-fin="${iso(9 * D)}"`, /ouvre le .*se termine le .*\(UTC\)/, "is-soon"],
        ["passee", `data-debut="${iso(-9 * D)}" data-fin="${iso(-5 * D)}"`, /terminée depuis le .*\(UTC\)/, "is-over"],
        ["cours", `data-debut="${iso(-2 * D)}" data-fin="${iso(3 * D)}"`, /en cours, jusqu'au .*\(UTC\)/, "is-open"],
        ["sansfin", `data-debut="${iso(-2 * D)}"`, /^Vente en cours\./, "is-open"],
        ["fixe", `data-debut="2099-01-15T10:30Z" data-fin="2099-02-01T18:00:00Z"`, /15 janvier 2099.*10:30.*\(UTC\).*1(er)? février 2099.*18:00/, "is-soon"],
      ];
      const neutres = [["aucune", ""], ["texte", `data-debut="demain" data-fin="bientôt"`], ["mois13", `data-debut="2026-13-45T10:00Z"`], ["sansZ", `data-debut="2026-11-07 10:00"`], ["local", `data-debut="2099-01-01T10:00:00+02:00"`], ["vide", `data-debut="" data-fin=""`], ["balise", `data-debut="&lt;img src=x onerror=alert(1)&gt;"`]];
      const html = [...cases, ...neutres].map((c) => bloc(c[1])).join("");
      const etat = (i) => `document.querySelectorAll('[data-cp-vente]')[${i}].querySelector('[data-cp-etat]')`;
      const url = await extraPage("cercle-prive", "ventes-test", html);
      const init = "window.__timers=[];window.__dates=0;(function(){var si=window.setInterval;window.setInterval=function(){window.__timers.push(new Error().stack);return si.apply(this,arguments)};var D=Date;var N=function(){window.__dates++;return arguments.length?new (Function.prototype.bind.apply(D,[null].concat([].slice.call(arguments))))():new D()};N.prototype=D.prototype;N.now=function(){window.__dates++;return D.now()};N.UTC=D.UTC;N.parse=D.parse;window.Date=N})()";
      const pg = await open("cercle-prive", url, { init });
      await guard(pg, async () => {
        for (const [i, [n, , re, cls]] of cases.entries()) {
          const r = await pg.evaluate(`(function(){var e=${etat(i)};return {t:e.textContent,c:e.className}})()`);
          assert.match(r.t, re, `${n} : ${r.t}`); assert.ok(r.c.includes(cls), `${n} : classe ${r.c}`);
          assert.match(r.t, /Dates posées par la maison/);
        }
        for (const [j, [n]] of neutres.entries()) assert.equal(await pg.evaluate(`${etat(cases.length + j)}.textContent`), "Texte neutre par défaut", `${n} : texte neutre`);
        const d1 = await pg.evaluate("window.__dates"); await wait(2500); const d2 = await pg.evaluate("window.__dates");
        const timers = await pg.evaluate("window.__timers");
        assert.deepEqual(timers.filter((t) => /theme-packs/.test(t)), [], "le thème ne lance aucune minuterie (setInterval)");
        assert.equal(d2, d1, "l'heure n'est plus lue après le chargement");
        const first = await pg.evaluate(`${etat(0)}.textContent`); await wait(1200);
        assert.equal(await pg.evaluate(`${etat(0)}.textContent`), first, "texte stable");
        noErrors(pg, "cercle-prive ventes");
      });
      const nj = await open("cercle-prive", url, { noJs: true });
      await guard(nj, async () => assert.equal(await nj.evaluate(`${etat(0)}.textContent`), "Texte neutre par défaut", "sans JS : texte neutre, aucune date inventée"));
    });
    test("cartons : apparition douce puis tous visibles ; mouvement réduit : visibles d'emblée", async () => {
      for (const reduce of [false, true]) {
        const pg = await open("cercle-prive", await urlOf("cercle-prive", "accueil"), { reduce });
        await guard(pg, async () => {
          assert.ok(await pg.evaluate(() => document.querySelectorAll(".cp-card").length) > 0);
          await pg.scrollThrough(); await wait(900);
          assert.equal(await pg.evaluate(hiddenCount(".cp-card")), 0, "aucun carton resté invisible");
          noErrors(pg, "cartons");
        });
      }
    });
  });

  // ===== cabine-haute =====
  describe("cabine-haute", { skip: !KEYS.includes("cabine-haute") }, () => {
    test("gabarit : 3 cotes saisies comparées au tableau (vérifié à la main), message « cote d'exemple », aucune promesse d'embarquement", async () => {
      const pg = await open("cabine-haute", await urlOf("cabine-haute", "gabarit"));
      await guard(pg, async () => {
        const set = async (a, b, c) => { for (const [i, v] of [a, b, c].entries()) await pg.type("#cb-dim-" + i, String(v)); await wait(80); };
        const read = () => pg.evaluate(() => ({ items: [...document.querySelectorAll(".cb-res li")].map((l) => ({ nom: l.querySelector("b").textContent, ok: l.classList.contains("is-ok"), msg: l.querySelector("span").textContent })), live: document.querySelector(".cb-vh").textContent, rowsOk: [...document.querySelectorAll("tr[data-cabine]")].filter((r) => r.classList.contains("is-ok")).length }));
        const lignes = await pg.evaluate(() => [...document.querySelectorAll("tr[data-cabine]")].map((r) => [r.getAttribute("data-nom"), r.getAttribute("data-cabine")]));
        assert.equal(lignes.length, 6);
        const attendu = (mine) => { const a = mine.slice().sort((x, y) => y - x); return lignes.map(([nom, cote]) => { const b = cote.split("x").map(Number).sort((x, y) => y - x); const over = a.map((v, i) => Math.max(0, Math.round((v - b[i]) * 10) / 10)); return { nom, ok: over.every((o) => o === 0), worst: Math.max(...over) }; }); };
        for (const mine of [[55, 35, 25], [40, 30, 15], [60, 40, 20], [100, 50, 30], [56, 45, 25]]) {
          await set(...mine);
          const r = await read(), exp = attendu(mine);
          assert.deepEqual(r.items.map((x) => [x.nom, x.ok]), exp.map((x) => [x.nom, x.ok]), `cotes ${mine.join("x")}`);
          exp.filter((x) => !x.ok).forEach((x) => assert.match(r.items.find((y) => y.nom === x.nom).msg, new RegExp(`Dépasse la cote d'exemple d'au moins ${String(x.worst).replace(".", "\\.")} cm`)));
          r.items.filter((x) => x.ok).forEach((x) => assert.match(x.msg, /Entre dans la cote d'exemple/));
          assert.match(r.live, new RegExp(`^${exp.filter((x) => x.ok).length} compagnie\\(s\\) sur 6 dans la cote d'exemple`));
          assert.equal(r.rowsOk, exp.filter((x) => x.ok).length, "lignes du tableau marquées");
        }
        await set(25, 55, 35); assert.ok((await read()).items.find((x) => x.nom === "Air France").ok, "l'ordre des cotes est indifférent");
        await pg.type("#cb-dim-1", ""); await wait(80);
        const v = await read(); assert.equal(v.items.length, 0); assert.match(v.live, /Saisissez les trois dimensions/);
        const all = await pg.evaluate(() => document.querySelector(".cb-gab").textContent.replace(/\s+/g, " "));
        assert.match(all, /ce n'est pas une garantie d'embarquement/i); assert.match(all, /exemple/i);
        assert.doesNotMatch(all, /(embarquement (garanti|accepté|assuré)|garanti[es]? en cabine|passe(ra)? toujours)/i);
        noErrors(pg, "cabine-haute gabarit");
      });
    });
    test("sans JavaScript : tableau lisible et texte de repli ; mouvement réduit : contrôle fonctionnel", async () => {
      const nj = await open("cabine-haute", await urlOf("cabine-haute", "gabarit"), { noJs: true });
      await guard(nj, async () => {
        const r = await nj.evaluate(() => ({ rows: document.querySelectorAll("tr[data-cabine]").length, fb: (document.querySelector(".cb-fallback") || {}).textContent, vis: Boolean(document.querySelector(".cb-fallback") && document.querySelector(".cb-fallback").offsetHeight > 0) }));
        assert.equal(r.rows, 6); assert.match(r.fb, /demande JavaScript/); assert.ok(r.vis);
      });
      const pr = await open("cabine-haute", await urlOf("cabine-haute", "gabarit"), { reduce: true });
      await guard(pr, async () => { assert.equal(await pr.evaluate(() => document.querySelectorAll(".cb-res li").length), 6); assert.equal(await pr.evaluate(() => document.querySelectorAll(".cb-fallback").length), 0); noErrors(pr, "réduit"); });
    });
  });

  // ===== performance-pure =====
  describe("performance-pure", { skip: !KEYS.includes("performance-pure") }, () => {
    const cases = [
      { sx: "h", age: 30, t: 180, p: 80, act: "1.55", bmr: 10 * 80 + 6.25 * 180 - 5 * 30 + 5, prot: [96, 160] },
      { sx: "f", age: 25, t: 165, p: 60, act: "1.375", bmr: 10 * 60 + 6.25 * 165 - 5 * 25 - 161, prot: [72, 120] },
      { sx: "f", age: 50, t: 160, p: 90, act: "1.2", bmr: 10 * 90 + 6.25 * 160 - 5 * 50 - 161, prot: [108, 180] },
    ];
    test("calculateur : trois cas calculés à la main (femme / homme), résultat marqué estimation, saisies invalides refusées", async () => {
      const pg = await open("performance-pure", await urlOf("performance-pure", "calculateur"));
      await guard(pg, async () => {
        const fill = async (c) => {
          await pg.evaluate((c) => { const s = document.querySelectorAll("[data-pp-calc] select"); s[0].value = c.sx; s[1].value = c.act; s[0].dispatchEvent(new Event("change", { bubbles: true })); s[1].dispatchEvent(new Event("change", { bubbles: true })); }, c);
          await pg.type("[data-pp-calc] input", String(c.age), 0); await pg.type("[data-pp-calc] input", String(c.t), 1); await pg.type("[data-pp-calc] input", String(c.p), 2);
        };
        const r10 = (x) => Math.round(x / 10) * 10;
        for (const c of cases) {
          await fill(c);
          await pg.click(".pp-btn");
          await pg.waitFor(() => !document.querySelector(".pp-res").hidden, "résultat");
          const out = await pg.evaluate(() => ({ k: [...document.querySelectorAll(".pp-kpi")].map((k) => k.querySelector("strong").textContent), small: document.querySelector(".pp-res .pp-small").textContent, err: document.querySelector(".pp-err").textContent }));
          assert.equal(out.err, "");
          assert.equal(flat(out.k[0]), String(r10(c.bmr)), `repos ${c.sx} : attendu ${r10(c.bmr)}`);
          assert.equal(flat(out.k[1]), String(r10(c.bmr * Number(c.act))), `jour moyen ${c.sx}`);
          assert.equal(flat(out.k[2]), `${c.prot[0]}à${c.prot[1]}`, "protéines");
          assert.match(out.small, /Estimation indicative/); assert.match(out.small, /Mifflin-St Jeor/); assert.match(out.small, /ni un conseil médical/);
        }
        for (const [age, t, p, re] of [[17, 170, 70, /âge/i], [30, 100, 70, /taille/i], [30, 170, 20, /poids/i], ["3,5", 170, 70, /âge/i]]) {
          await pg.type("[data-pp-calc] input", String(age), 0); await pg.type("[data-pp-calc] input", String(t), 1); await pg.type("[data-pp-calc] input", String(p), 2);
          await pg.click(".pp-btn");
          assert.match(await pg.evaluate(() => document.querySelector(".pp-err").textContent), re, `refus ${age}/${t}/${p}`);
          assert.equal(await pg.evaluate(() => document.querySelector(".pp-res").hidden), true);
        }
        await fill(cases[0]); await pg.evaluate(() => document.querySelectorAll("[data-pp-calc] input")[2].focus()); await pg.key("Enter");
        await pg.waitFor(() => !document.querySelector(".pp-res").hidden, "Entrée lance le calcul");
        noErrors(pg, "performance-pure calculateur");
      });
      const pc = await open("performance-pure", await urlOf("performance-pure", "reassort"));
      await guard(pc, async () => {
        const pg = pc;
        await pg.type("[data-pp-cadence] input", "30", 0); await pg.type("[data-pp-cadence] input", "1", 1);
        assert.match(await pg.evaluate(() => document.querySelector("[data-pp-cadence] .pp-recap").textContent), /environ 30 jours.*toutes les 4 semaines ou chaque mois/);
        await pg.type("[data-pp-cadence] input", "14", 0);
        assert.match(await pg.evaluate(() => document.querySelector("[data-pp-cadence] .pp-recap").textContent), /environ 14 jours.*toutes les 2 semaines/);
        await pg.type("[data-pp-cadence] input", "7", 0);
        assert.match(await pg.evaluate(() => document.querySelector("[data-pp-cadence] .pp-recap").textContent), /environ 7 jours.*chaque semaine/);
        noErrors(pg, "performance-pure");
      });
    });
    test("sans JavaScript : formules écrites en clair ; mouvement réduit : blocs visibles", async () => {
      const nj = await open("performance-pure", await urlOf("performance-pure", "calculateur"), { noJs: true });
      await guard(nj, async () => { const t = await nj.evaluate(() => document.body.innerText); assert.match(t, /Mifflin/i); assert.match(t, /demande JavaScript/); });
      const pr = await open("performance-pure", await urlOf("performance-pure", "accueil"), { reduce: true });
      await guard(pr, async () => { await pr.scrollThrough(); assert.equal(await pr.evaluate(hiddenCount("[data-pp-reveal]")), 0); noErrors(pr, "réduit"); });
    });
  });

  // ===== box-du-mois =====
  describe("box-du-mois", { skip: !KEYS.includes("box-du-mois") }, () => {
    test("aperçu de gestion d'abonnement : pause, reprise, changement de formule, résiliation en un clic, recommencer ; rien n'est envoyé", async () => {
      const pg = await open("box-du-mois", await urlOf("box-du-mois", "gerer"), { init: "window.__post=0;(function(){var f=window.fetch;window.fetch=function(){window.__post++;return f.apply(this,arguments)};var o=XMLHttpRequest.prototype.open;XMLHttpRequest.prototype.open=function(){window.__post++;return o.apply(this,arguments)}})()" });
      await guard(pg, async () => {
        const st = () => pg.evaluate(() => ({ state: document.querySelector(".bm-state").textContent, s: document.querySelector(".bm-state").getAttribute("data-s"), info: document.querySelector(".bm-demo .bm-small").textContent, btns: [...document.querySelectorAll(".bm-ab")].filter((b) => !b.hidden).map((b) => b.textContent), mail: document.querySelector(".bm-mail").hidden }));
        const clickBtn = async (re) => { const i = await pg.evaluate((src) => [...document.querySelectorAll(".bm-ab")].findIndex((b) => !b.hidden && new RegExp(src).test(b.textContent)), re); assert.ok(i >= 0, "bouton " + re); await pg.click(".bm-ab", i); };
        let s = await st(); assert.equal(s.s, "active"); assert.match(s.state, /actif/); assert.match(s.info, /29,90 € chaque mois/);
        await clickBtn("^Mettre en pause"); s = await st(); assert.match(s.state, /en pause.*Aucun prélèvement/); assert.ok(s.btns.includes("Reprendre"));
        await clickBtn("^Reprendre"); s = await st(); assert.equal(s.s, "active");
        await clickBtn("^Passer à"); s = await st(); assert.match(s.info, /27,00 € tous les 2 mois/); assert.ok(s.btns.some((b) => /^Revenir à/.test(b)));
        await clickBtn("^Revenir à"); s = await st(); assert.match(s.info, /29,90 €/);
        await clickBtn("^Résilier"); s = await st();
        assert.equal(s.s, "ended"); assert.match(s.state, /résilié.*Plus aucun prélèvement/); assert.equal(s.mail, false); assert.deepEqual(s.btns, ["Recommencer l'aperçu"]);
        assert.ok(await pg.evaluate("document.querySelector('.bm-mail').textContent.length > 20"));
        await clickBtn("^Recommencer"); s = await st(); assert.equal(s.s, "active"); assert.equal(s.mail, true);
        assert.equal(await pg.evaluate("window.__post"), 0, "aucune requête réseau");
        assert.match(await pg.evaluate(() => document.querySelector(".bm-badge").textContent), /Aperçu/);
        noErrors(pg, "box gestion");
      });
    });
    test("page « Comment résilier » : titre, lien vers la vraie gestion (/boutique/abonnements) valide ; sans JS l'aperçu laisse son texte de repli", async () => {
      const pg = await open("box-du-mois", await urlOf("box-du-mois", "comment-resilier"));
      await guard(pg, async () => {
        const r = await pg.evaluate(() => ({ h1: (document.querySelector("h1,[role=heading][aria-level='1']") || {}).textContent, t: document.body.innerText, hrefs: [...document.querySelectorAll("a")].map((a) => a.getAttribute("href")) }));
        assert.match(r.h1, /Comment résilier/); assert.ok(r.hrefs.includes("/boutique/abonnements"), "lien vers la gestion réelle");
        assert.doesNotMatch(r.t, /conserver mon abonnement|êtes-vous sûr|nous contacter pour résilier/i);
        noErrors(pg, "comment résilier");
      });
      const e = await engine("box-du-mois", "/boutique/abonnements"); assert.ok(e.status < 500, "engine abonnements " + e.status);
      const nj = await open("box-du-mois", await urlOf("box-du-mois", "gerer"), { noJs: true });
      await guard(nj, async () => assert.match(await nj.evaluate(() => document.querySelector("[data-bm-demo]").textContent), /demande JavaScript/));
    });
  });

  // ===== deuxieme-vie =====
  describe("deuxieme-vie", { skip: !KEYS.includes("deuxieme-vie") }, () => {
    test("échelle d'état : liens-étiquettes vers des pages du moteur, barres qui se remplissent une fois, lisibles sans JS / mouvement réduit", async () => {
      const u = await urlOf("deuxieme-vie", "etat");
      const pg = await open("deuxieme-vie", u, { height: 600 });
      await guard(pg, async () => {
        const links = await pg.evaluate(() => [...document.querySelectorAll("[data-dv-etat]")].map((a) => a.getAttribute("href")));
        assert.ok(links.length >= 3); links.forEach((l) => assert.match(l, /^\/boutique\/etiquette\/[a-z0-9-]+$/));
        for (const l of links) { const r = await engine("deuxieme-vie", l); assert.equal(r.status, 200, l); assert.match(r.text, /data-kw-pack="deuxieme-vie"/); }
        const state = () => pg.evaluate(() => [...document.querySelectorAll("[data-dv-etat]")].map((e) => { const r = e.getBoundingClientRect(); return { vu: e.classList.contains("dv-vu"), inView: r.top < innerHeight && r.bottom > 0 }; }));
        await pg.evaluate(() => scrollTo(0, 0)); await wait(500);
        const a = await state();
        assert.ok(a.some((x) => !x.vu && !x.inView), "les barres hors écran ne sont pas encore remplies");
        await pg.scrollThrough(); await wait(1200);
        assert.ok((await state()).every((x) => x.vu), "toutes remplies après défilement");
        await pg.evaluate(() => scrollTo(0, 0)); await wait(400); assert.ok((await state()).every((x) => x.vu), "elles restent remplies (une seule fois)");
        noErrors(pg, "deuxieme-vie");
      });
      for (const mode of [{ noJs: true }, { reduce: true }]) {
        const p2 = await open("deuxieme-vie", u, mode);
        await guard(p2, async () => {
          await p2.scrollThrough();
          assert.equal(await p2.evaluate(() => document.body.classList.contains("dv-js")), false, "pas de mode animé");
          assert.ok(await p2.evaluate(() => [...document.querySelectorAll("[data-dv-etat]")].every((e) => Number(getComputedStyle(e).opacity) > 0.99 && e.offsetHeight > 10)), "échelle lisible " + JSON.stringify(mode));
          noErrors(p2, "mode");
        });
      }
    });
    test("fiche produit réelle du moteur : thème actif, zone d'achat présente, aucune erreur", async () => {
      const s = await siteOf("deuxieme-vie");
      const pg = await open("deuxieme-vie", `/boutique/produit/${s.product.slug}`);
      await guard(pg, async () => {
        const r = await pg.evaluate(() => ({ pack: document.body.dataset.kwPack, buy: !!document.querySelector(".sh-buy") }));
        assert.equal(r.pack, "deuxieme-vie"); assert.ok(r.buy);
        noErrors(pg, "fiche deuxième vie");
      });
    });
  });

  // ===== produit-unique =====
  describe("produit-unique", { skip: !KEYS.includes("produit-unique") }, () => {
    test("liens « Acheter » redirigés vers la fiche du produit vedette ; chapitres dévoilés au défilement ; barre de lecture (animation-timeline)", async () => {
      const pg = await open("produit-unique", await urlOf("produit-unique", "accueil"), { height: 700 });
      await guard(pg, async () => {
        const r = await pg.evaluate(() => { const card = document.querySelector(".kw-pg-card a[href*='/produit/'], .sh-card a[href*='/produit/']"); return { card: card && card.getAttribute("href"), buy: [...document.querySelectorAll("a[data-pu-fiche]")].map((a) => a.getAttribute("href")) }; });
        assert.ok(r.card, "la carte du produit vedette est sur la page"); assert.ok(r.buy.length >= 3);
        assert.deepEqual([...new Set(r.buy)], [r.card], "tous les liens Acheter pointent vers la fiche du vedette");
        assert.equal((await engine("produit-unique", r.card)).status, 200);
        await pg.evaluate(() => scrollTo(0, 0)); await wait(400);
        const before = await pg.evaluate(() => [...document.querySelectorAll(".pu-rv")].filter((e) => e.getBoundingClientRect().top > innerHeight + 50).map((e) => Number(getComputedStyle(e).opacity)));
        assert.ok(before.length > 0 && before.every((o) => o < 0.5), "chapitres cachés avant d'être vus : " + JSON.stringify(before) + " classe " + (await pg.evaluate(() => document.body.className)));
        const supports = await pg.evaluate(() => CSS.supports("animation-timeline: scroll()"));
        const prog = () => pg.evaluate(() => { const el = document.querySelector(".pu-prog"); const m = getComputedStyle(el).transform; return { v: m === "none" ? 1 : Number(m.match(/matrix\(([^,]+)/)[1]), d: getComputedStyle(el).display }; });
        const p0 = await prog();
        await pg.evaluate(() => scrollTo(0, (document.documentElement.scrollHeight - innerHeight) / 2)); await wait(500); const p1 = await prog();
        await pg.evaluate(() => scrollTo(0, document.documentElement.scrollHeight)); await wait(500); const p2 = await prog();
        if (supports) { assert.equal(p0.d, "block"); assert.ok(p0.v < 0.05, "barre vide en haut " + p0.v); assert.ok(p1.v > 0.3 && p1.v < 0.7, "barre à moitié " + p1.v); assert.ok(p2.v > 0.95, "barre pleine en bas " + p2.v); }
        await pg.scrollThrough(); await wait(800);
        assert.equal(await pg.evaluate(hiddenCount(".pu-rv")), 0, "tout est dévoilé");
        noErrors(pg, "produit-unique");
      });
    });
    test("sans JavaScript : liens Acheter vers /boutique (200), contenu visible ; mouvement réduit : contenu visible d'emblée", async () => {
      const u = await urlOf("produit-unique", "accueil");
      const nj = await open("produit-unique", u, { noJs: true });
      await guard(nj, async () => {
        const r = await nj.evaluate(() => ({ buy: [...new Set([...document.querySelectorAll("a[data-pu-fiche]")].map((a) => a.getAttribute("href")))] }));
        assert.deepEqual(r.buy, ["/boutique"]); assert.equal(await nj.evaluate(hiddenCount(".pu-rv")), 0, "contenu visible sans script");
        assert.equal((await engine("produit-unique", "/boutique")).status, 200);
      });
      const pr = await open("produit-unique", u, { reduce: true });
      await guard(pr, async () => { assert.equal(await pr.evaluate(hiddenCount(".pu-rv")), 0); assert.equal(await pr.evaluate(() => document.body.classList.contains("pu-js")), false); noErrors(pr, "réduit"); });
    });
  });

  // ===== objectif-noir =====
  describe("objectif-noir", { skip: !KEYS.includes("objectif-noir") }, () => {
    test("accueil : les anneaux suivent le curseur sans erreur ; mouvement réduit : immobiles", async () => {
      const pg = await open("objectif-noir", await urlOf("objectif-noir", "accueil"));
      await guard(pg, async () => {
        const box = await pg.evaluate(() => { const r = document.querySelector(".on-reticle"); if (!r) return null; r.scrollIntoView({ block: "center" }); const b = r.getBoundingClientRect(); return { l: b.left, t: b.top, w: b.width, h: b.height }; });
        assert.ok(box, "anneaux présents");
        const vx = () => pg.evaluate(() => document.querySelector(".on-reticle").style.getPropertyValue("--on-x"));
        await pg.mouseMove(box.l + box.w * 0.2, box.t + box.h * 0.3); await wait(250);
        const a = await vx(); assert.ok(Math.abs(parseFloat(a) - 20) < 3, "x ≈ 20 % : " + a);
        await pg.mouseMove(box.l + box.w * 0.8, box.t + box.h * 0.7); await wait(250);
        assert.ok(Math.abs(parseFloat(await vx()) - 80) < 3);
        await pg.mouseMove(2, 2); await wait(250);
        assert.equal(await vx(), "50%", "retour au centre");
        noErrors(pg, "objectif-noir");
      });
      const pr = await open("objectif-noir", await urlOf("objectif-noir", "accueil"), { reduce: true });
      await guard(pr, async () => { const b = await pr.evaluate(() => { const r = document.querySelector(".on-reticle"); r.scrollIntoView({ block: "center" }); const q = r.getBoundingClientRect(); return { x: q.left + 40, y: q.top + 40 }; }); await pr.mouseMove(b.x, b.y); await wait(250); assert.equal(await pr.evaluate(() => document.querySelector(".on-reticle").style.getPropertyValue("--on-x")), "", "mouvement réduit : rien ne bouge"); });
    });
    test("comparateur du moteur : /boutique/comparer répond 200 avec le thème", async () => {
      const r = await engine("objectif-noir", "/boutique/comparer"); assert.equal(r.status, 200); assert.match(r.text, /data-kw-pack="objectif-noir"/);
    });
  });

  // ===== perle-noire =====
  describe("perle-noire", { skip: !KEYS.includes("perle-noire") }, () => {
    test("thème sans script : aucun motion.js chargé, pages lisibles, liens du moteur valides", async () => {
      const s = await siteOf("perle-noire");
      assert.doesNotMatch((await engine("perle-noire", "/boutique")).text, /perle-noire\/motion\.js/);
      assert.match((await engine("perle-noire", "/boutique/comparer")).text, /data-kw-pack="perle-noire"/);
      const pg = await open("perle-noire", s.urls.accueil, { noJs: true }); await guard(pg, async () => { assert.ok(await pg.evaluate(() => document.body.innerText.length > 500)); noErrors(pg, "perle-noire sans JS"); });
    });
  });

  // ===== atelier-botte =====
  describe("atelier-botte", { skip: !KEYS.includes("atelier-botte") }, () => {
    test("fiche d'essayage : finition et patine changent l'aperçu ; lien « Essayer en atelier » sur la fiche mène à une page du moteur", async () => {
      const pg = await open("atelier-botte", await urlOf("atelier-botte", "essayage"));
      await guard(pg, async () => {
        const read = () => pg.evaluate(() => { const st = document.querySelector("[data-ab-stage]"); return { cuir: st.style.getPropertyValue("--ab-cuir"), pat: st.style.getPropertyValue("--ab-patine"), pressed: [...document.querySelectorAll(".ab-opt")].map((b) => b.getAttribute("aria-pressed")), n: document.querySelectorAll(".ab-opt").length, live: document.querySelector("[role=status].ab-vh").textContent, fin: document.querySelector("[data-ab-patine]").getAttribute("data-finitions") }; });
        const a = await read(); assert.ok(a.n >= 4);
        const fins = a.fin.split(";").map((p) => p.slice(p.lastIndexOf(":") + 1).trim());
        assert.equal(a.cuir, fins[0]); assert.equal(a.pat, "0");
        await pg.click(".ab-opt", 1); let b = await read(); assert.equal(b.cuir, fins[1]); assert.equal(b.pressed[1], "true"); assert.match(b.live, /Aperçu : finition/);
        await pg.click(".ab-opt", fins.length + 2); b = await read(); assert.equal(b.pat, "0.34", "patine après cinq ans"); assert.equal(b.pressed[fins.length + 2], "true"); assert.equal(b.pressed[fins.length], "false");
        noErrors(pg, "atelier-botte essayage");
      });
      const nj = await open("atelier-botte", await urlOf("atelier-botte", "essayage"), { noJs: true });
      await guard(nj, async () => assert.ok(await nj.evaluate(() => document.body.innerText.length > 400)));
      const s = await siteOf("atelier-botte");
      const f = await open("atelier-botte", `/boutique/produit/${s.product.slug}`);
      await guard(f, async () => {
        const href = await f.evaluate(() => { const a = document.querySelector(".ab-essai a"); return a && a.getAttribute("href"); });
        assert.equal(href, `/boutique/rendez-vous?produit=${s.product.slug}`);
        const r = await engine("atelier-botte", href);
        assert.ok(r.status === 200 || (r.status < 500 && /rendez-vous|ouvert|disponible/i.test(r.text)), "rendez-vous : " + r.status);
        assert.match(r.text, /data-kw-pack="atelier-botte"/);
        noErrors(f, "fiche produit atelier-botte");
      });
    });
  });

  // ===== petit-nid =====
  describe("petit-nid", { skip: !KEYS.includes("petit-nid") }, () => {
    test("guide : les étapes apparaissent au défilement et finissent toutes visibles ; sans JS / réduit : visibles d'emblée ; liens listes / invitation valides", async () => {
      const s = await siteOf("petit-nid");
      let withSteps = null;
      for (const [k, p] of Object.entries(s.urls)) { const pg = await open("petit-nid", p); await guard(pg, async () => { if (!withSteps && await pg.evaluate(() => document.querySelectorAll(".pn-st").length)) withSteps = k; }); }
      assert.ok(withSteps, "une page avec des étapes");
      for (const mode of [{}, { noJs: true }, { reduce: true }]) {
        const pg = await open("petit-nid", s.urls[withSteps], { ...mode, height: 600 });
        await guard(pg, async () => {
          if (!mode.noJs && !mode.reduce) { await pg.evaluate(() => scrollTo(0, 0)); await wait(300); assert.ok(await pg.evaluate(() => [...document.querySelectorAll(".pn-st")].some((e) => !e.classList.contains("pn-in"))), "étapes hors écran pas encore apparues"); }
          await pg.scrollThrough(); await wait(900);
          assert.equal(await pg.evaluate(hiddenCount(".pn-st")), 0, "toutes visibles " + JSON.stringify(mode)); noErrors(pg, "petit-nid");
        });
      }
      for (const l of ["/boutique/listes", "/boutique/invitation", "/boutique/souhaits", "/boutique/comparer"]) { const r = await engine("petit-nid", l); assert.ok(r.status < 500 && (r.status === 200 || /Cette|ouverte|disponible/.test(r.text)), l + " " + r.status); }
    });
  });

  // ===== cuisine-claire =====
  describe("cuisine-claire", { skip: !KEYS.includes("cuisine-claire") }, () => {
    test("guides et traits de cotation : apparition au défilement, tout visible à la fin, visible d'emblée sans JS / mouvement réduit", async () => {
      const s = await siteOf("cuisine-claire");
      let withR = null;
      for (const [k, p] of Object.entries(s.urls)) { const pg = await open("cuisine-claire", p); await guard(pg, async () => { if (!withR && await pg.evaluate(() => document.querySelectorAll("[data-cc-reveal]").length)) withR = k; }); }
      assert.ok(withR, "une page avec des éléments à dévoiler");
      for (const mode of [{}, { noJs: true }, { reduce: true }]) {
        const pg = await open("cuisine-claire", s.urls[withR], { ...mode, height: 600 });
        await guard(pg, async () => {
          if (!mode.noJs && !mode.reduce) { await pg.evaluate(() => scrollTo(0, 0)); await wait(300); assert.ok(await pg.evaluate(() => document.body.classList.contains("cc-js"))); }
          await pg.scrollThrough(); await wait(900);
          assert.equal(await pg.evaluate(hiddenCount("[data-cc-reveal]")), 0, "tout visible " + JSON.stringify(mode)); noErrors(pg, "cuisine-claire");
        });
      }
      for (const l of ["/boutique/comparer", "/boutique/rendez-vous", "/boutique/listes", "/boutique/invitation"]) { const r = await engine("cuisine-claire", l); assert.ok(r.status < 500, l + " " + r.status); }
    });
  });
});
