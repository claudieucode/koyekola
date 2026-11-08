// Thèmes de boutique « E-commerce 1/2 » : leurs scripts interactifs testés dans un VRAI Chrome, sur un VRAI serveur.
// Chaque thème est activé sur un site de test, ses pages de démonstration sont PUBLIÉES, puis ouvertes comme le ferait un visiteur (clics souris, saisie, liens suivis).
// Un petit relais local (proxy) donne au navigateur l'adresse du site, journalise les requêtes envoyées par la page et sait couper le script du thème (test « sans JavaScript »).
// Le mouvement réduit est testé avec un second Chrome lancé avec l'option --force-prefers-reduced-motion (vraie préférence du système, pas une simulation).
// Ignoré proprement si Chrome est absent. Lent : TEST_START_TIMEOUT_MS=900000 node --test --test-concurrency=1 tests/themes-interactifs-ecom1-navigateur.test.js
const { test, describe, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const cdp = require("./helpers-chrome-cdp");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor, Client } = require("./helpers");
const library = require("../src/marketing/themes/library");
const shopkit = require("../src/marketing/themes/packs/shopkit");

const HOST = "www.interactif-shop.example";
const PACKS = path.join(__dirname, "..", "src", "marketing", "themes", "packs");
const MINE = ["salon-vivant", "sommeil-doux", "museau", "boucles-fieres", "pagne-vif", "corde-et-bois", "service-dresse"];
const nombre = (txt) => { const m = String(txt).match(/\d(?:[\d\s  ]*\d)?(?:[.,]\d+)?/); return m ? parseFloat(m[0].replace(/[\s  ]/g, "").replace(",", ".")) : NaN; };

let srv, boss, db, siteId, orgId, pbase, chrome, chromeCalme;
const state = { nojs: false, log: [] };
const pagesOpen = [];
const published = new Map();
let activeKey = null;
const one = (sql, ...a) => db.prepare(sql).get(...a);
const site = { headers: { "x-forwarded-host": HOST, "User-Agent": "Mozilla/5.0 (test)" } };

// Chrome « moins d'animations » : même pilote, avec l'option de lancement qui règle la vraie préférence du système
function launchCalme() {
  const cp = require("node:child_process"); const orig = cp.spawn; const file = require.resolve("./helpers-chrome-cdp");
  delete require.cache[file];
  cp.spawn = (c, a, o) => orig(c, [...a, "--force-prefers-reduced-motion"], o);
  try { return require(file).launch(); } finally { cp.spawn = orig; delete require.cache[file]; }
}

// En-têtes tels que le serveur les verrait avec un vrai navigateur sur le vrai site : même hôte, origine et référent du site (sinon la protection contre les envois venus d'ailleurs refuse les POST)
const fromBrowser = (h) => {
  const out = { ...h, host: new URL(srv.base).host, "x-forwarded-host": HOST, "accept-encoding": "identity" };
  if (out.origin) out.origin = `https://${HOST}`;
  if (out.referer) out.referer = String(out.referer).replace(pbase, `https://${HOST}`);
  return out;
};
async function startProxy() {
  const u = new URL(srv.base);
  const proxy = http.createServer((req, res) => {
    if (state.nojs && /\/motion\.js/.test(req.url)) { res.writeHead(200, { "content-type": "application/javascript", "cache-control": "no-store" }); return res.end("/* test : navigation sans le script du thème */"); }
    const chunks = []; req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      const body = Buffer.concat(chunks);
      state.log.push({ method: req.method, url: req.url, body: body.toString() });
      const up = http.request({ host: u.hostname, port: u.port, path: req.url, method: req.method, headers: fromBrowser(req.headers) }, (r0) => {
        const r = { statusCode: r0.statusCode, on: (...a) => r0.on(...a), pipe: (x) => r0.pipe(x), headers: { ...r0.headers, "cache-control": "no-store" } }; // jamais de cache : chaque ouverture relit la page et son script
        // « sans JavaScript » : le script du thème est retiré de la page elle-même (le navigateur pourrait l'avoir gardé en cache)
        if (!state.nojs || !/text\/html/.test(String(r.headers["content-type"] || ""))) { res.writeHead(r.statusCode, r.headers); return r.pipe(res); }
        const parts = []; r.on("data", (c) => parts.push(c));
        r.on("end", () => { const h = { ...r.headers }; delete h["content-length"]; delete h["content-encoding"]; res.writeHead(r.statusCode, h); res.end(Buffer.concat(parts).toString().replace(/<script[^>]*motion\.js[^>]*>\s*<\/script>/g, "")); });
      });
      up.on("error", () => { res.statusCode = 502; res.end(); });
      up.end(body);
    });
  });
  await new Promise((r) => proxy.listen(0, "127.0.0.1", r));
  return proxy;
}
let proxyServer;
// Machine chargée (plusieurs Chrome en parallèle) : Chrome peut mettre longtemps à démarrer, on réessaie
async function retry(fn, n = 4) { for (let i = 1; ; i++) { try { return await fn(); } catch (e) { if (i >= n) throw e; await cdp.wait(2000); } } }

before(async () => {
  if (cdp.SKIP) return;
  srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
  boss = await loginInstructor(srv); db = srv.db();
  orgId = one("SELECT id FROM mk_organizations ORDER BY id LIMIT 1").id;
  siteId = Number(String((await boss.post("/marketing/site-web/sites", { name: "Interactif" })).location).match(/sites\/(\d+)/)[1]);
  const cur = JSON.parse((await boss.get(`/marketing/site-web/sites/${siteId}/reglages.json`)).text);
  await boss.request(`/marketing/site-web/sites/${siteId}/reglages.json`, { method: "PUT", json: { revision: cur.revision, tokens: cur.tokens, settings: { ...cur.settings, seo: { ...cur.settings.seo, publicUrl: `https://${HOST}` } } } });
  const SA = `/marketing/site-web/sites/${siteId}/boutique`;
  await boss.post(`${SA}/livraison/zones`, { name: "France", countries: "FR" });
  const zid = one("SELECT id FROM mk_shop_shipping_zones WHERE site_id = ?", siteId).id;
  await boss.post(`${SA}/livraison/zones/${zid}/methodes`, { name: "Colis", kind: "flat", cost: "5,90" });
  await boss.post(`${SA}/reglages`, { currency: "eur", default_country: "FR", enabled: "1", payment_methods: ["manual"], guest_checkout: "1", order_prefix: "INT" });
  await boss.post(`/marketing/site-web/sites/${siteId}/modules/commerce`, { etat: "activer" });
  proxyServer = await startProxy(); pbase = `http://127.0.0.1:${proxyServer.address().port}`;
  chrome = await retry(() => cdp.launch()); chromeCalme = await retry(() => launchCalme());
});
after(async () => {
  for (const p of pagesOpen) { try { await p.close(); } catch { /* déjà fermée */ } }
  if (chrome) await chrome.close();
  if (chromeCalme && chromeCalme.close) await chromeCalme.close();
  if (proxyServer) proxyServer.close();
  if (db) { try { db.close(); } catch { /* ok */ } }
  if (srv) await srv.stop();
});

// Active un thème (catalogue de démonstration + thème actif) ; options facultatives du thème
function activate(key, options = {}) {
  const t = JSON.parse(one("SELECT tokens FROM mk_sites WHERE id = ?", siteId).tokens); t.pack = { key, options };
  db.prepare("UPDATE mk_sites SET tokens = ? WHERE id = ?").run(JSON.stringify(t), siteId);
  if (activeKey !== key) {
    db.prepare("DELETE FROM mk_shop_products WHERE site_id = ?").run(siteId); db.prepare("DELETE FROM mk_shop_categories WHERE site_id = ?").run(siteId);
    shopkit.seed({ db, organizationId: orgId, siteId }, require(`${PACKS}/${key}/demo.js`));
    activeKey = key;
  }
}
// Publie une page de démonstration du thème (une seule fois) ; renvoie son adresse publique
async function publishDemo(key, pageKey) {
  const id = `${key}/${pageKey}`;
  if (published.has(id)) return published.get(id);
  const name = `Demo ${key} ${pageKey}`;
  await boss.post("/marketing/pages", { name, site_id: String(siteId) });
  const row = one("SELECT id, revision FROM mk_landing_pages WHERE name = ?", name);
  const s = await boss.request(`/marketing/pages/${row.id}/brouillon`, { method: "PUT", json: { revision: row.revision, content: { sections: library.pageSections(key, pageKey), title: name, description: "" } } });
  assert.equal(s.status, 200, "brouillon : " + s.text.slice(0, 200));
  const pub = await boss.request(`/marketing/pages/${row.id}/publier.json`, { method: "POST", json: {} });
  assert.equal(pub.status, 200, "publication : " + pub.text.slice(0, 200));
  const url = JSON.parse(pub.text).url; published.set(id, url); return url;
}
// Ouvre une adresse du site dans Chrome (nojs : script du thème coupé ; calme : Chrome avec « moins d'animations » ; width : largeur de l'écran)
async function open(url, { nojs = false, calme = false, width = 1280, height = 900 } = {}) {
  state.nojs = nojs;
  const page = await (calme ? chromeCalme : chrome).newPage({ width, height }); pagesOpen.push(page);
  await page.goto(pbase + url);
  return page;
}
const slugOf = (name) => one("SELECT slug FROM mk_shop_products WHERE site_id = ? AND name = ?", siteId, name).slug;
// Vrai clic de souris au centre d'un élément (le fait défiler dans l'écran d'abord)
async function realClick(page, sel) {
  const r = await page.evaluate((s) => { const e = document.querySelector(s); if (!e) return null; e.scrollIntoView({ block: "center" }); const b = e.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; }, sel);
  assert.ok(r, "introuvable : " + sel);
  await page.mouseClick(r.x, r.y);
}
const click = (page, sel) => page.evaluate((s) => { const e = document.querySelector(s); if (!e) throw new Error("introuvable : " + s); e.click(); }, sel);
// Clic sur un bouton d'après son texte exact (parmi ceux d'un conteneur)
const clickText = (page, scope, text) => page.evaluate(([sc, t]) => { const all = [...document.querySelectorAll(sc)]; const b = all.find((x) => x.textContent.trim() === t); if (!b) throw new Error(`bouton « ${t} » introuvable dans ${sc} (présents : ${all.map((x) => x.textContent.trim()).join(" | ")} ; classe du corps : ${document.body.className})`); b.click(); }, [scope, text]);
const setValue = (page, sel, v) => page.evaluate(([s, val]) => { const e = document.querySelector(s); e.value = val; e.dispatchEvent(new Event("input", { bubbles: true })); e.dispatchEvent(new Event("change", { bubbles: true })); }, [sel, v]);
const text = (page, sel) => page.evaluate((s) => { const e = document.querySelector(s); return e ? e.textContent.trim().replace(/\s+/g, " ") : null; }, sel);
const noErrors = (page, what = "") => assert.deepEqual(page.errors, [], `erreurs JavaScript ${what}`);
// Les liens d'une liste mènent à des pages qui répondent (200) et, pour le catalogue, qui montrent au moins un produit
async function liensVivants(hrefs, { produits = true } = {}) {
  const cli = new Client(srv.base);
  for (const h of [...new Set(hrefs)]) {
    const r = await cli.get(h, site);
    assert.equal(r.status, 200, `lien mort : ${h} (${r.status})`);
    if (produits && /^\/boutique(\/|\?)/.test(h)) assert.match(r.text, /\/boutique\/produit\//, `lien vide (aucun produit) : ${h}`);
  }
}
// Animations qui tournent sans fin dans la page (ce que « moins d'animations » doit couper)
const infinies = (page) => page.evaluate(() => [...document.querySelectorAll("body *, body")].filter((e) => { const c = getComputedStyle(e); return c.animationName !== "none" && c.animationIterationCount === "infinite" && parseFloat(c.animationDuration) > 0; }).map((e) => (e.className && e.className.toString().slice(0, 30)) || e.tagName));

describe("règles des paquets (rapide, sans navigateur)", () => {
  for (const k of MINE) {
    test(`${k} : script court, garde de thème, mention du mouvement réduit, aucun mot interdit`, () => {
      const js = fs.readFileSync(path.join(PACKS, k, "motion.js"), "utf8");
      assert.ok(js.length < 25000, `${k} : ${js.length} caractères`);
      assert.match(js, new RegExp(`data-kw-pack"\\) !== "${k}"`));
      assert.match(js, /prefers-reduced-motion/);
      const src = fs.readdirSync(path.join(PACKS, k)).map((f) => fs.readFileSync(path.join(PACKS, k, f), "utf8")).join("\n");
      assert.doesNotMatch(src, /plus que \d+|il en reste|personnes? (regardent|consultent)|Math\.random|setInterval|countdown|checked/i);
    });
  }
});

describe("salon-vivant : scène, lampe, contrôle de passage, fiche produit", { skip: cdp.SKIP }, () => {
  beforeEach(() => activate("salon-vivant"));
  test("scène : repères cliquables vers de vrais rayons, bouton « Allumer la lampe » (vrai clic) qui change vraiment l'ambiance", async () => {
    activate("salon-vivant");
    const url = await publishDemo("salon-vivant", "accueil");
    const page = await open(url);
    assert.equal(await page.evaluate("document.body.dataset.kwPack"), "salon-vivant");
    assert.ok(await page.evaluate("document.body.classList.contains('sv-js')"));
    const hs = await page.evaluate("[...document.querySelectorAll('.sv-scene a.sv-hs')].map(a=>a.getAttribute('href'))");
    assert.ok(hs.length >= 3, "au moins trois repères sur la scène");
    await liensVivants(hs);
    assert.equal(await text(page, ".sv-lamp-btn"), "Allumer la lampe");
    assert.equal(await page.evaluate("document.querySelector('.sv-lamp-btn').getAttribute('aria-pressed')"), "false");
    const mur = () => page.evaluate("getComputedStyle(document.querySelector('.sv-scene .sv-wall')).fill");
    const avant = await mur();
    await realClick(page, ".sv-lamp-btn");
    assert.equal(await text(page, ".sv-lamp-btn"), "Éteindre la lampe");
    assert.ok(await page.evaluate("document.querySelector('[data-salon-scene]').classList.contains('is-soir')"));
    assert.equal(await page.evaluate("document.querySelector('.sv-lamp-btn').getAttribute('aria-pressed')"), "true");
    await page.waitFor("getComputedStyle(document.querySelector('.sv-scene .sv-wall')).fill !== " + JSON.stringify(avant), "la couleur du mur change vraiment", 5000);
    await realClick(page, ".sv-lamp-btn");
    assert.equal(await text(page, ".sv-lamp-btn"), "Allumer la lampe");
    // clavier : c'est un vrai bouton, atteignable avec la touche Tab
    assert.equal(await page.evaluate("document.querySelector('.sv-lamp-btn').tagName + document.querySelector('.sv-lamp-btn').tabIndex"), "BUTTON0");
    noErrors(page);
  });
  test("contrôle de passage : deux mesures → verdict (passe / très juste / ne passe pas), champs vides, valeurs absurdes", async () => {
    const url = await publishDemo("salon-vivant", "dimensions-livraison");
    const page = await open(url);
    const ids = await page.evaluate("[...document.querySelectorAll('[data-salon-passage] input')].map(i=>i.id)");
    assert.equal(ids.length, 2);
    assert.equal(await page.evaluate("document.querySelectorAll('[data-salon-passage] label[for]').length"), 2, "chaque champ a son étiquette");
    const verdict = () => text(page, ".sv-verdict");
    assert.match(await verdict(), /Renseignez les deux mesures/);
    const mesure = async (m, p) => { await setValue(page, "#" + ids[0], m); await setValue(page, "#" + ids[1], p); return verdict(); };
    assert.match(await mesure("80", "90"), /Ça devrait passer.*10 cm/);
    assert.ok(await page.evaluate("document.querySelector('.sv-verdict').classList.contains('is-ok')"));
    assert.match(await mesure("88", "90"), /Très juste/);
    assert.match(await mesure("86", "90"), /Ça devrait passer.*4 cm/, "4 cm de marge = limite basse du « ça passe »");
    assert.match(await mesure("95", "90"), /Ne passera pas.*5 cm/);
    assert.ok(await page.evaluate("document.querySelector('.sv-verdict').classList.contains('is-ko')"));
    assert.match(await mesure("0", "90"), /Renseignez les deux mesures/);
    assert.match(await mesure("-5", "90"), /Renseignez les deux mesures/);
    assert.match(await mesure("", ""), /Renseignez les deux mesures/);
    assert.equal(await page.evaluate("document.querySelector('.sv-verdict').getAttribute('role')"), "status");
    noErrors(page);
  });
  test("fiche produit : un seul lien « Mesurer avant de commander », visible, sans toucher au panier", async () => {
    activate("salon-vivant");
    const page = await open(`/boutique/produit/${slugOf("Table basse Meule")}`);
    assert.equal(await page.evaluate("document.querySelectorAll('.sv-mesure a').length"), 1);
    const a = await page.evaluate("(function(){var a=document.querySelector('.sv-mesure a');var b=a.getBoundingClientRect();return {t:a.textContent,h:a.getAttribute('href'),w:b.width,hh:b.height}})()");
    assert.match(a.t, /Mesurer avant de commander/); assert.equal(a.h, "/dimensions-livraison"); assert.ok(a.w > 50 && a.hh > 8, "lien visible");
    assert.equal(await page.evaluate("document.querySelectorAll('form[data-sh-add]').length"), 1, "le formulaire d'achat d'origine est intact");
    noErrors(page);
  });
  test("sans JavaScript : scène, repères et conseils de mesure restent lisibles et cliquables", async () => {
    const url = await publishDemo("salon-vivant", "accueil");
    const page = await open(url, { nojs: true });
    assert.equal(await page.evaluate("document.body.classList.contains('sv-js')"), false);
    assert.equal(await page.evaluate("document.querySelectorAll('.sv-lamp-btn').length"), 0);
    assert.ok(await page.evaluate("[...document.querySelectorAll('.sv-scene a.sv-hs')].every(a=>a.getAttribute('href').startsWith('/boutique/'))"));
    const vis = await page.evaluate("(function(){var a=document.querySelector('.sv-scene a.sv-hs');var b=a.getBoundingClientRect();return b.width>0&&b.height>0})()");
    assert.ok(vis, "repère visible");
    const dim = await open(await publishDemo("salon-vivant", "dimensions-livraison"), { nojs: true });
    assert.match(await text(dim, ".sv-fallback"), /plus petite dimension/);
    noErrors(page); noErrors(dim);
  });
  test("mouvement réduit : plus aucune animation sans fin, même lampe allumée ; en usage normal elles existent", async () => {
    const url = await publishDemo("salon-vivant", "accueil");
    const normal = await open(url);
    await click(normal, ".sv-lamp-btn");
    assert.ok((await infinies(normal)).length > 0, "(contrôle) lampe allumée = halo animé en mode normal");
    const calme = await open(url, { calme: true });
    assert.ok(await calme.evaluate("matchMedia('(prefers-reduced-motion: reduce)').matches"), "Chrome est bien en mode « moins d'animations »");
    assert.ok(await calme.evaluate("document.body.classList.contains('pk-calme')"));
    await click(calme, ".sv-lamp-btn");
    assert.deepEqual(await infinies(calme), []);
    noErrors(normal); noErrors(calme);
  });
});

describe("sommeil-doux : quiz de matelas", { skip: cdp.SKIP }, () => {
  beforeEach(() => activate("sommeil-doux"));
  const parcours = async (page, pos, sens, duo) => {
    await clickText(page, ".sd-opt b", pos); await page.waitFor("document.querySelector('.sd-qt').textContent.includes('sensation')", "question 2");
    await clickText(page, ".sd-opt b", sens); await page.waitFor("document.querySelector('.sd-qt').textContent.includes('dormez')", "question 3");
    await clickText(page, ".sd-opt b", duo); await page.waitFor("document.querySelector('.sd-res')", "résultat");
  };
  const liens = (page) => page.evaluate("[...document.querySelectorAll('.sd-res a.sd-btn')].map(a=>({h:a.getAttribute('href'),t:a.textContent}))");
  test("3 questions : chaque profil mène au bon lien (souple / mi-ferme / ferme), vers un rayon qui contient des produits", async () => {
    activate("sommeil-doux");
    const page = await open(await publishDemo("sommeil-doux", "quiz"));
    assert.ok(await page.evaluate("document.body.classList.contains('sd-js')"));
    assert.equal(await page.evaluate("document.querySelectorAll('.sd-opts button').length"), 4, "4 réponses à la question 1");
    assert.equal(await page.evaluate("document.querySelectorAll('.sd-dots li').length"), 3);
    await parcours(page, "Sur le côté", "Enveloppante", "Seul(e)");
    assert.deepEqual((await liens(page)).map((l) => l.h), ["/boutique?categorie=matelas&etiquette=souple"]);
    await clickText(page, ".sd-back", "Recommencer le quiz");
    await page.waitFor("document.querySelector('.sd-opts')", "retour à la question 1");
    await parcours(page, "Sur le dos", "Équilibrée", "Seul(e)");
    assert.deepEqual((await liens(page)).map((l) => l.h), ["/boutique?categorie=matelas&etiquette=mi-ferme"]);
    await clickText(page, ".sd-back", "Recommencer le quiz");
    await parcours(page, "Sur le ventre", "Soutenante", "Seul(e)");
    assert.deepEqual((await liens(page)).map((l) => l.h), ["/boutique?categorie=matelas&etiquette=ferme"]);
    await liensVivants(["/boutique?categorie=matelas&etiquette=souple", "/boutique?categorie=matelas&etiquette=mi-ferme", "/boutique?categorie=matelas&etiquette=ferme"]);
    noErrors(page);
  });
  test("à deux : un second lien « couples » apparaît ; retour arrière et « Recommencer » fonctionnent ; le filtre du catalogue filtre vraiment", async () => {
    const page = await open(await publishDemo("sommeil-doux", "quiz"));
    await parcours(page, "Sur le dos", "Équilibrée", "À deux");
    const l = await liens(page);
    assert.deepEqual(l.map((x) => x.h), ["/boutique?categorie=matelas&etiquette=mi-ferme", "/boutique/etiquette/couple"]);
    await liensVivants(["/boutique/etiquette/couple"]);
    // le filtre étiquette réduit réellement la liste des produits
    const cli = new Client(srv.base);
    const n = (t) => new Set(t.match(/\/boutique\/produit\/[a-z0-9-]+/g)).size;
    const tout = n((await cli.get("/boutique?categorie=matelas", site)).text), souple = n((await cli.get("/boutique?categorie=matelas&etiquette=souple", site)).text);
    assert.ok(souple > 0 && souple < tout, `le filtre souple (${souple}) doit montrer moins de matelas que tous (${tout})`);
    // retour arrière
    await click(page, ".sd-back"); // « Recommencer » sur l'écran résultat
    await page.waitFor("document.querySelector('.sd-opts')", "question 1");
    await clickText(page, ".sd-opt b", "Sur le dos");
    await page.waitFor("document.querySelector('.sd-back') && document.querySelector('.sd-back').textContent==='Question précédente'", "bouton retour");
    await click(page, ".sd-back");
    assert.match(await text(page, ".sd-qt"), /position/);
    noErrors(page);
  });
  test("sans JavaScript : les repères dépliants et leurs liens sont utilisables", async () => {
    const page = await open(await publishDemo("sommeil-doux", "quiz"), { nojs: true });
    assert.equal(await page.evaluate("document.body.classList.contains('sd-js')"), false);
    const n = await page.evaluate("document.querySelectorAll('[data-sommeil-quiz] details.sd-fbq').length");
    assert.equal(n, 4);
    // ouvrir un repère fermé avec un vrai clic sur son titre
    await realClick(page, "details.sd-fbq:nth-of-type(2) summary");
    await page.waitFor("document.querySelector('details.sd-fbq:nth-of-type(2)').open", "le repère s'ouvre");
    const a = await page.evaluate("(function(){var a=document.querySelector('details.sd-fbq:nth-of-type(2) a');var b=a.getBoundingClientRect();return {h:a.getAttribute('href'),vis:b.width>0&&b.height>0}})()");
    assert.equal(a.h, "/boutique?categorie=matelas&etiquette=mi-ferme"); assert.ok(a.vis);
    noErrors(page);
  });
  test("mouvement réduit : aucune animation sans fin", async () => {
    const page = await open(await publishDemo("sommeil-doux", "quiz"), { calme: true });
    assert.ok(await page.evaluate("document.body.classList.contains('pk-calme')"));
    assert.deepEqual(await infinies(page), []);
    noErrors(page);
  });
});

describe("museau : profil d'animal", { skip: cdp.SKIP }, () => {
  beforeEach(() => activate("museau"));
  const chips = (page, i) => page.evaluate((n) => [...document.querySelectorAll(".mu-chips")[n].querySelectorAll("button")].map((b) => b.textContent + ":" + b.getAttribute("aria-pressed")), i);
  const sortie = (page) => page.evaluate("[...document.querySelectorAll('.mu-out a')].map(a=>a.getAttribute('href'))");
  test("animal, âge, gabarit : la mascotte change, les liens sont les bons et vivants", async () => {
    activate("museau");
    const page = await open(await publishDemo("museau", "profil"));
    await page.evaluate("localStorage.clear()");
    await page.goto(pbase + await publishDemo("museau", "profil"));
    assert.ok(await page.evaluate("document.body.classList.contains('mu-js')"));
    assert.equal(await page.evaluate("document.querySelector('[data-museau-profil]').getAttribute('data-animal')"), "chien");
    assert.deepEqual((await chips(page, 0)).map((x) => x.split(":")[0]), ["Chien", "Chat", "Petit animal"]);
    await clickText(page, ".mu-chips:nth-of-type(1) button, .mu-row:nth-child(1) .mu-cp", "Chat");
    await page.waitFor("document.querySelector('[data-museau-profil]').getAttribute('data-animal')==='chat'", "mascotte chat");
    assert.equal(await page.evaluate("getComputedStyle(document.querySelector('.mu-fig--chat')).display !== 'none'"), true, "la figure du chat est affichée");
    assert.equal(await page.evaluate("getComputedStyle(document.querySelector('.mu-fig--chien')).display"), "none", "celle du chien est masquée");
    await clickText(page, ".mu-row:nth-child(2) .mu-cp", "Chaton");
    assert.equal(await page.evaluate("document.querySelector('[data-museau-profil]').getAttribute('data-age')"), "junior");
    assert.ok((await sortie(page)).includes("/boutique/etiquette/chat-junior"));
    assert.ok((await sortie(page)).includes("/boutique/etiquette/chat"));
    await clickText(page, ".mu-row:nth-child(1) .mu-cp", "Chien");
    assert.equal(await page.evaluate("document.querySelector('.mu-row:nth-child(3)').hidden"), false, "le gabarit existe pour le chien");
    await clickText(page, ".mu-row:nth-child(3) .mu-cp", "Grand gabarit");
    assert.equal(await page.evaluate("document.querySelector('[data-museau-profil]').getAttribute('data-taille')"), "grand");
    const liens = await sortie(page);
    assert.ok(liens.includes("/boutique/etiquette/chien-grand") && liens.includes("/boutique/etiquette/chien"));
    await liensVivants(liens);
    await clickText(page, ".mu-row:nth-child(1) .mu-cp", "Petit animal");
    assert.equal(await page.evaluate("document.querySelector('.mu-row:nth-child(3)').hidden"), true, "pas de gabarit pour un petit animal");
    noErrors(page);
  });
  test("mémoire (option « oui ») : rien n'est gardé avant un choix ; ensuite, stockage local seulement, et la pastille de l'en-tête devient « Pour mon chat »", async () => {
    const url = await publishDemo("museau", "profil");
    const page = await open(url);
    await page.evaluate("localStorage.clear()");
    await page.goto(pbase + url);
    assert.equal(await page.evaluate("localStorage.getItem('museau-profil')"), null, "aucun choix du visiteur : rien n'est stocké");
    assert.equal(await text(page, "[data-museau-mon]"), "Mon animal", "pastille neutre tant qu'aucun animal n'a été choisi");
    state.log.length = 0;
    await clickText(page, ".mu-row:nth-child(1) .mu-cp", "Chat");
    await clickText(page, ".mu-row:nth-child(2) .mu-cp", "Senior");
    const saved = JSON.parse(await page.evaluate("localStorage.getItem('museau-profil')"));
    assert.equal(saved.a, "chat"); assert.equal(saved.g, "senior"); assert.equal(saved.h, "/boutique/etiquette/chat-senior");
    assert.equal(await text(page, "[data-museau-mon]"), "Pour mon chat");
    assert.equal(await page.evaluate("document.querySelector('[data-museau-mon]').getAttribute('href')"), "/boutique/etiquette/chat-senior");
    assert.deepEqual(state.log.filter((r) => r.method !== "GET"), [], "aucune requête d'envoi : le choix reste dans le navigateur");
    // autre page du site : la pastille se souvient, et le choix est repris dans le profil
    const autre = await open(await publishDemo("museau", "conseils"));
    assert.equal(await text(autre, "[data-museau-mon]"), "Pour mon chat");
    await page.goto(pbase + url);
    assert.equal(await page.evaluate("document.querySelector('[data-museau-profil]').getAttribute('data-animal')"), "chat");
    // « Pour mon chien » aussi
    await clickText(page, ".mu-row:nth-child(1) .mu-cp", "Chien");
    assert.equal(await text(page, "[data-museau-mon]"), "Pour mon chien");
    noErrors(page); noErrors(autre);
  });
  test("mémoire (option « non ») : aucun stockage, aucune pastille personnalisée", async () => {
    activate("museau", { memoire: "off" });
    const url = await publishDemo("museau", "profil");
    const page = await open(url);
    assert.equal(await page.evaluate("document.body.getAttribute('data-pk-memoire')"), "off");
    await page.evaluate("localStorage.clear()");
    await clickText(page, ".mu-row:nth-child(1) .mu-cp", "Chat");
    assert.equal(await page.evaluate("localStorage.getItem('museau-profil')"), null);
    assert.equal(await text(page, "[data-museau-mon]"), "Mon animal");
    noErrors(page);
    activate("museau");
  });
  test("sans JavaScript : la liste dépliante par animal reste visible avec tous ses liens ; mouvement réduit sans animation sans fin", async () => {
    const url = await publishDemo("museau", "profil");
    const page = await open(url, { nojs: true });
    assert.equal(await page.evaluate("document.body.classList.contains('mu-js')"), false);
    const n = await page.evaluate("[...document.querySelectorAll('[data-museau-liste] a')].filter(a=>{var b=a.getBoundingClientRect();return a.closest('details')&&true}).length");
    assert.ok(n >= 15, "liens présents : " + n);
    assert.equal(await page.evaluate("getComputedStyle(document.querySelector('[data-museau-liste]')).display !== 'none'"), true);
    const calme = await open(url, { calme: true });
    assert.deepEqual(await infinies(calme), []);
    noErrors(page); noErrors(calme);
  });
});

describe("boucles-fieres : diagnostic de boucles", { skip: cdp.SKIP }, () => {
  beforeEach(() => activate("boucles-fieres"));
  const choisir = async (page, g, label) => clickText(page, `.bf-fs:nth-of-type(${g}) .bf-opt b`, label);
  const etapes = (page) => page.evaluate("[...document.querySelectorAll('.bf-rsteps li')].map(li=>({t:li.querySelector('b').textContent,h:li.querySelector('a').getAttribute('href'),k:li.classList.contains('is-key')}))");
  test("type 3A-4C × porosité × besoin → routine de 4 gestes (5 pour « protéger la nuit »), bons liens, liens vivants", async () => {
    activate("boucles-fieres");
    const page = await open(await publishDemo("boucles-fieres", "diagnostic"));
    assert.ok(await page.evaluate("document.body.classList.contains('bf-js')"));
    assert.deepEqual(await page.evaluate("[...document.querySelectorAll('.bf-fs:nth-of-type(1) .bf-opt b')].map(b=>b.textContent)"), ["3A", "3B", "3C", "4A", "4B", "4C"]);
    assert.match(await text(page, ".bf-res"), /Reste à choisir : le type, la porosité, le besoin/);
    await choisir(page, 1, "4C");
    assert.match(await text(page, ".bf-res"), /Reste à choisir : la porosité, le besoin/);
    await choisir(page, 2, "Haute");
    assert.equal(await page.evaluate("document.querySelectorAll('.bf-rsteps').length"), 0, "pas de routine tant qu'il manque un choix");
    await choisir(page, 3, "Hydrater");
    let e = await etapes(page);
    assert.deepEqual(e.map((x) => x.h), ["/boutique/etiquette/nettoyage-doux", "/boutique/etiquette/hydratation", "/boutique/etiquette/definition", "/boutique/etiquette/scellage"]);
    assert.equal(e.length, 4);
    assert.match(await text(page, ".bf-h3"), /boucles 4C, porosité haute/);
    const chips = await page.evaluate("[...document.querySelectorAll('.bf-res .bf-links a')].map(a=>a.getAttribute('href'))");
    assert.deepEqual(chips, ["/boutique/etiquette/boucles-4", "/boutique/etiquette/porosite-haute"]);
    await liensVivants([...e.map((x) => x.h), ...chips]);
    // autre combinaison : 3A, basse, protéger → 5 gestes, « protection » pour le scellage ET la nuit
    await choisir(page, 1, "3A"); await choisir(page, 2, "Basse"); await choisir(page, 3, "Protéger la nuit");
    e = await etapes(page);
    assert.equal(e.length, 5);
    assert.deepEqual(e.map((x) => x.h.split("/").pop()), ["nettoyage-doux", "hydratation", "definition", "protection", "protection"]);
    assert.equal(e[4].t, "Protéger la nuit");
    // démêler + porosité moyenne : pas de lien « porosité moyenne » (il n'existerait pas)
    await choisir(page, 1, "3C"); await choisir(page, 2, "Moyenne"); await choisir(page, 3, "Démêler");
    e = await etapes(page);
    assert.equal(e[1].h, "/boutique/etiquette/demelage");
    assert.deepEqual(await page.evaluate("[...document.querySelectorAll('.bf-res .bf-links a')].map(a=>a.getAttribute('href'))"), ["/boutique/etiquette/boucles-3"]);
    await liensVivants(["/boutique/etiquette/demelage", "/boutique/etiquette/protection"]);
    // Recommencer
    await click(page, ".bf-again");
    assert.match(await text(page, ".bf-res"), /Reste à choisir/);
    assert.equal(await page.evaluate("document.querySelectorAll('.bf-opt[aria-pressed=true]').length"), 0);
    noErrors(page);
  });
  test("chaque combinaison (6 types × 3 porosités × 4 besoins) produit une routine sans erreur et sans lien mort", async () => {
    const page = await open(await publishDemo("boucles-fieres", "diagnostic"));
    const tous = await page.evaluate(`(function(){
      var out=[], types=document.querySelectorAll('.bf-fs:nth-of-type(1) .bf-opt'), poro=document.querySelectorAll('.bf-fs:nth-of-type(2) .bf-opt'), need=document.querySelectorAll('.bf-fs:nth-of-type(3) .bf-opt');
      for (var i=0;i<types.length;i++) for (var j=0;j<poro.length;j++) for (var k=0;k<need.length;k++) { types[i].click(); poro[j].click(); need[k].click();
        var li=document.querySelectorAll('.bf-rsteps li'); out.push({n:li.length, need:k, links:[].map.call(document.querySelectorAll('.bf-res a'),function(a){return a.getAttribute('href')})}); }
      return out; })()`);
    assert.equal(tous.length, 72);
    assert.ok(tous.every((r) => r.n === (r.need === 3 ? 5 : 4)), "4 gestes, 5 pour la protection de nuit");
    const hrefs = new Set(tous.flatMap((r) => r.links)); assert.ok([...hrefs].every((h) => /^\/boutique\/etiquette\/[a-z0-9-]+$/.test(h)));
    await liensVivants([...hrefs]);
    noErrors(page);
  });
  test("sans JavaScript : fiches dépliantes lisibles ; mouvement réduit : boucles tracées d'emblée et aucune animation sans fin", async () => {
    const url = await publishDemo("boucles-fieres", "diagnostic");
    const page = await open(url, { nojs: true });
    assert.equal(await page.evaluate("document.body.classList.contains('bf-js')"), false);
    assert.ok(await page.evaluate("document.querySelectorAll('[data-boucles-diag] details').length") >= 3);
    const liens = await page.evaluate("[...document.querySelectorAll('[data-boucles-diag] details a')].map(a=>a.getAttribute('href'))");
    assert.ok(liens.length >= 3); await liensVivants(liens);
    const calme = await open(url, { calme: true });
    assert.equal(await calme.evaluate("document.querySelectorAll('.bf-curl').length === document.querySelectorAll('.bf-curl.is-in').length"), true, "tous les tracés sont déjà affichés");
    assert.deepEqual(await infinies(calme), []);
    noErrors(page); noErrors(calme);
  });
});

describe("pagne-vif : fiche produit au mètre", { skip: cdp.SKIP }, () => {
  beforeEach(() => activate("pagne-vif"));
  const totalTxt = (page) => text(page, ".pv-tt");
  test("produit « au-metre » : champ « Mètres », − / +, repères, total en direct, valeurs invalides", async () => {
    activate("pagne-vif");
    const page = await open(`/boutique/produit/${slugOf("Bogolan crème et terre")}`);
    assert.ok(await page.evaluate("document.body.classList.contains('pv-js')"));
    assert.equal(await page.evaluate("document.querySelector('input[name=quantity]').closest('label').firstChild.nodeValue"), "Mètres");
    assert.equal(nombre(await totalTxt(page)), 22, "1 m × 22 €");
    await realClick(page, ".pv-qbox .pv-sb:last-of-type");
    assert.equal(await page.evaluate("document.querySelector('input[name=quantity]').value"), "2");
    assert.equal(nombre(await totalTxt(page)), 44);
    assert.match(await text(page, ".pv-tl"), /^2 mètres × 22,00 € le mètre =/);
    await realClick(page, ".pv-pre:nth-child(4)"); // 5 m
    assert.equal(await page.evaluate("document.querySelector('input[name=quantity]').value"), "5");
    assert.equal(nombre(await totalTxt(page)), 110);
    await setValue(page, "input[name=quantity]", "99"); assert.equal(nombre(await totalTxt(page)), 2178);
    await click(page, ".pv-qbox .pv-sb:last-of-type"); assert.equal(await page.evaluate("document.querySelector('input[name=quantity]').value"), "99", "plafonné à 99");
    await setValue(page, "input[name=quantity]", "1"); await click(page, ".pv-qbox .pv-sb:first-of-type");
    assert.equal(await page.evaluate("document.querySelector('input[name=quantity]').value"), "1", "jamais en dessous de 1");
    for (const bad of ["0", "100", "2.5", ""]) { await setValue(page, "input[name=quantity]", bad); assert.match(await text(page, ".pv-total"), /Indiquez un nombre entier entre 1 et 99/, `valeur « ${bad} »`); }
    assert.equal(await page.evaluate("document.querySelectorAll('select[name=variant_id]').length"), 0);
    noErrors(page);
  });
  test("promotion + variantes : total = mètres × prix affiché (promo comprise) ; nuancier construit depuis les variantes « Coloris », synchronisé avec la liste", async () => {
    const page = await open(`/boutique/produit/${slugOf("Wax Œil de panthère")}`);
    const prix = nombre(await text(page, ".sh-price-lg strong"));
    assert.equal(prix, 12, "prix affiché = prix promo");
    await setValue(page, "input[name=quantity]", "5");
    assert.equal(nombre(await totalTxt(page)), 60);
    assert.match(await text(page, ".pv-total"), /À partir de 5 mètres/);
    const pills = await page.evaluate("[...document.querySelectorAll('.pv-pill')].map(b=>b.textContent.trim())");
    assert.deepEqual(pills, ["Indigo", "Hibiscus", "Terre"]);
    assert.equal(await text(page, ".pv-nl"), "Coloris");
    await realClick(page, ".pv-pill:nth-child(2)");
    assert.equal(await page.evaluate("document.querySelector('select[name=variant_id] option:checked').textContent"), "Hibiscus");
    assert.equal(await page.evaluate("document.querySelectorAll('.pv-pill[aria-pressed=true]').length"), 1);
    await page.evaluate("var s=document.querySelector('select[name=variant_id]');s.selectedIndex=3;s.dispatchEvent(new Event('change',{bubbles:true}))");
    assert.equal(await page.evaluate("document.querySelector('.pv-pill:nth-child(3)').getAttribute('aria-pressed')"), "true", "la pastille suit la liste");
    // variante épuisée : pastille désactivée
    const p2 = await open(`/boutique/produit/${slugOf("Wax Éventail du soir")}`);
    assert.ok(await p2.evaluate("[...document.querySelectorAll('.pv-pill')].some(b=>b.disabled && /rupture/.test(b.textContent))"), "une pastille épuisée est désactivée");
    noErrors(page); noErrors(p2);
  });
  test("coupon de 6 yards, promotion simple ; produit sans étiquette : champ d'origine intact", async () => {
    const page = await open(`/boutique/produit/${slugOf("Pagne Œil de panthère, 6 yards")}`);
    assert.equal(await page.evaluate("document.querySelector('input[name=quantity]').closest('label').firstChild.nodeValue"), "Coupons de 6 yards");
    await setValue(page, "input[name=quantity]", "3");
    assert.equal(nombre(await totalTxt(page)), 207, "3 × 69 €");
    assert.equal(await page.evaluate("document.querySelectorAll('.pv-pre').length"), 0, "pas de repères en mètres pour des coupons");
    const nu = await open(`/boutique/produit/${slugOf("Fermeture à glissière 50 cm")}`);
    assert.equal(await nu.evaluate("document.querySelector('input[name=quantity]').closest('label').firstChild.nodeValue"), "Quantité");
    assert.equal(await nu.evaluate("document.querySelectorAll('.pv-qbox,.pv-total,.pv-bar2').length"), 0);
    noErrors(page); noErrors(nu);
  });
  test("monnaie sans décimales (F CFA) : total entier, bien formaté", async () => {
    db.prepare("UPDATE mk_shop_settings SET currency = 'xof' WHERE site_id = ?").run(siteId);
    try {
      const page = await open(`/boutique/produit/${slugOf("Bogolan crème et terre")}`);
      const shown = await text(page, ".sh-price-lg strong");
      assert.match(shown, /CFA/); assert.doesNotMatch(shown, /[.,]\d{2}\b/);
      await setValue(page, "input[name=quantity]", "7");
      const t = await totalTxt(page);
      assert.match(t, /CFA/); assert.doesNotMatch(t, /[.,]\d/);
      assert.equal(t.replace(/\D/g, ""), String(7 * Number(shown.replace(/\D/g, ""))));
      noErrors(page);
    } finally { db.prepare("UPDATE mk_shop_settings SET currency = 'eur' WHERE site_id = ?").run(siteId); }
  });
  test("mobile : la barre d'achat reste collée en bas de l'écran ; l'ajout au panier envoie les bons mètres au serveur", async () => {
    const page = await open(`/boutique/produit/${slugOf("Wax Cercles de mil")}`, { width: 390, height: 300 });
    await page.evaluate("document.querySelector('form[data-sh-add]').scrollIntoView({block:'start'})"); // écran court : le bouton d'achat serait hors écran sans la barre collée
    const m = await page.evaluate("(function(){var b=document.querySelector('.pv-bar2');var r=b.getBoundingClientRect();return {pos:getComputedStyle(b).position,bottom:r.bottom,ih:innerHeight,top:r.top,sw:document.documentElement.scrollWidth,iw:innerWidth}})()");
    assert.equal(m.pos, "sticky");
    assert.ok(m.bottom <= m.ih + 1 && m.top < m.ih && m.bottom > m.ih - 4, `barre collée en bas de l'écran (bas=${m.bottom}, écran=${m.ih})`);
    assert.ok(m.sw <= m.iw + 1, "pas de défilement horizontal");
    await setValue(page, "input[name=quantity]", "4");
    await page.evaluate("document.querySelector('.pv-pill:not([disabled])').click()");
    state.log.length = 0;
    await realClick(page, ".pv-bar2 button[type=submit]");
    // le script de la boutique envoie le formulaire sans quitter la page, puis met à jour le compteur du panier
    await page.waitFor("document.querySelector('[data-sh-cart-count]') && document.querySelector('[data-sh-cart-count]').textContent.trim() !== '0'", "compteur du panier mis à jour", 20000);
    assert.equal(nombre(await text(page, "[data-sh-cart-count]")), 4);
    const post = state.log.find((r) => r.method === "POST" && /panier\/ajouter/.test(r.url));
    assert.ok(post, "requête d'ajout envoyée");
    const body = new URLSearchParams(post.body);
    assert.equal(body.get("quantity"), "4"); assert.ok(body.get("variant_id"));
    const cart = await page.evaluate("fetch('/boutique/panier').then(r=>r.text())");
    assert.match(cart, /Wax Cercles de mil/); assert.match(cart, /value="4"/);
    noErrors(page);
  });
  test("métreur de la page d'accueil : projets, − / +, règle ; sans JavaScript la liste reste lisible ; mouvement réduit", async () => {
    const url = await publishDemo("pagne-vif", "metrage");
    const page = await open(url);
    const n = await page.evaluate("document.querySelectorAll('[data-pv-metreur] .pv-chip').length");
    assert.ok(n >= 3);
    await click(page, ".pv-chip:nth-child(2)");
    const m2 = await page.evaluate("document.querySelector('.pv-chip:nth-child(2)').getAttribute('aria-pressed')"); assert.equal(m2, "true");
    const start = nombre(await text(page, ".pv-resn"));
    await click(page, ".pv-stepper .pv-sb:last-of-type");
    assert.equal(nombre(await text(page, ".pv-resn")), start + 1);
    assert.equal(await page.evaluate("document.querySelectorAll('.pv-rule i').length"), Math.min(start + 1, 12));
    for (let i = 0; i < 120; i++) await click(page, ".pv-stepper .pv-sb:last-of-type");
    assert.equal(nombre(await text(page, ".pv-resn")), 99);
    for (let i = 0; i < 120; i++) await click(page, ".pv-stepper .pv-sb:first-of-type");
    assert.equal(nombre(await text(page, ".pv-resn")), 1);
    const nojs = await open(url, { nojs: true });
    assert.ok(await nojs.evaluate("[...document.querySelectorAll('[data-pv-metreur] li[data-m]')].every(li=>li.getBoundingClientRect().height>0)"), "liste de métrages visible sans script");
    const calme = await open(url, { calme: true });
    assert.deepEqual(await infinies(calme), []);
    noErrors(page); noErrors(nojs); noErrors(calme);
  });
  test("sans JavaScript, la fiche produit garde son champ Quantité et sa liste de variantes", async () => {
    const page = await open(`/boutique/produit/${slugOf("Wax Cercles de mil")}`, { nojs: true });
    assert.equal(await page.evaluate("document.querySelector('input[name=quantity]').closest('label').firstChild.nodeValue"), "Quantité");
    assert.equal(await page.evaluate("document.querySelectorAll('select[name=variant_id]').length"), 1);
    assert.equal(await page.evaluate("document.querySelectorAll('.pv-pill').length"), 0);
    noErrors(page);
  });
});

describe("corde-et-bois : grille niveau × style", { skip: cdp.SKIP }, () => {
  beforeEach(() => activate("corde-et-bois"));
  const puces = (page, i) => page.evaluate((n) => [...document.querySelectorAll(".cb-chp")[n].querySelectorAll("button")].map((b) => b.textContent + ":" + b.getAttribute("aria-pressed")), i);
  test("puces, surlignage ligne / colonne / croisement, lien exact, combinaison absente → message + alternatives", async () => {
    activate("corde-et-bois");
    const url = await publishDemo("corde-et-bois", "choisir");
    const page = await open(url);
    await page.evaluate("localStorage.clear()"); await page.goto(pbase + url);
    assert.ok(await page.evaluate("document.body.classList.contains('cb-js')"));
    assert.equal((await puces(page, 0)).length, 3); assert.equal((await puces(page, 1)).length, 4);
    assert.match(await text(page, ".cb-out-t"), /Choisissez un niveau/);
    await clickText(page, ".cb-chp:nth-of-type(1) button, .cb-row:nth-child(1) .cb-cp", "Intermédiaire");
    assert.equal(await page.evaluate("document.querySelectorAll('[data-corde-liste] .cb-hl').length > 0"), true, "colonne surlignée");
    await clickText(page, ".cb-row:nth-child(2) .cb-cp", "Rock");
    assert.ok(await page.evaluate("(function(){var x=[].slice.call(document.querySelectorAll('[data-corde-liste] .cb-hl2'));return x.length>=1&&x.every(function(n){return n.getAttribute('data-niveau')==='intermediaire'&&n.getAttribute('data-style')==='rock'})})()"), "seul le croisement choisi est marqué");
    assert.equal(await page.evaluate("getComputedStyle(document.querySelector('td.cb-hl2 a')).backgroundImage !== getComputedStyle(document.querySelector('[data-corde-liste] td:not(.cb-hl):not(.cb-hl2) a')).backgroundImage"), true, "le surlignage se voit vraiment");
    assert.deepEqual(await page.evaluate("[...document.querySelectorAll('.cb-out a')].map(a=>a.getAttribute('href'))"), ["/boutique/etiquette/intermediaire-rock", "/boutique/etiquette/intermediaire", "/boutique/etiquette/rock"]);
    await liensVivants(["/boutique/etiquette/intermediaire-rock", "/boutique/etiquette/intermediaire", "/boutique/etiquette/rock"]);
    // combinaison absente de la grille : débutant × jazz
    await clickText(page, ".cb-row:nth-child(1) .cb-cp", "Débutant");
    await clickText(page, ".cb-row:nth-child(2) .cb-cp", "Jazz");
    assert.match(await text(page, ".cb-out"), /Pas encore d'instrument pour cette combinaison/);
    const alt = await page.evaluate("[...document.querySelectorAll('.cb-out a')].map(a=>a.getAttribute('href'))");
    assert.deepEqual(alt, ["/boutique/etiquette/debutant", "/boutique/etiquette/jazz"]);
    await liensVivants(alt);
    // Désélection
    await clickText(page, ".cb-row:nth-child(2) .cb-cp", "Jazz");
    assert.equal(await page.evaluate("document.querySelectorAll('[data-corde-liste] .cb-hl2').length"), 0);
    noErrors(page);
  });
  test("tous les croisements de la grille : lien exact présent exactement quand la case existe", async () => {
    const page = await open(await publishDemo("corde-et-bois", "choisir"));
    const r = await page.evaluate(`(function(){
      var out=[], N=document.querySelectorAll('.cb-row:nth-child(1) .cb-cp').length, S=document.querySelectorAll('.cb-row:nth-child(2) .cb-cp').length;
      for (var i=0;i<N;i++) for (var j=0;j<S;j++) { var nb=document.querySelectorAll('.cb-row:nth-child(1) .cb-cp'); if (nb[i].getAttribute('aria-pressed')==='true') nb[i].click(); document.querySelectorAll('.cb-row:nth-child(1) .cb-cp')[i].click();
        var sb=document.querySelectorAll('.cb-row:nth-child(2) .cb-cp'); if (sb[j].getAttribute('aria-pressed')==='true') sb[j].click(); document.querySelectorAll('.cb-row:nth-child(2) .cb-cp')[j].click();
        out.push({n:i,s:j,hl2:document.querySelectorAll('[data-corde-liste] .cb-hl2').length,exact:!!document.querySelector('.cb-gb:not(.cb-gb--o)') && /^Voir/.test(document.querySelector('.cb-go a').textContent), msg:/Pas encore/.test(document.querySelector('.cb-out').textContent)});
        document.querySelectorAll('.cb-row:nth-child(1) .cb-cp')[i].click(); document.querySelectorAll('.cb-row:nth-child(2) .cb-cp')[j].click(); }
      return out; })()`);
    assert.equal(r.length, 12);
    assert.ok(r.every((x) => x.exact !== x.msg), "soit un lien exact, soit le message — jamais les deux ni aucun");
    assert.equal(r.filter((x) => x.msg).length, 2, "deux combinaisons absentes (débutant × jazz, pro × folk)");
    noErrors(page);
  });
  test("mémoire locale du niveau (option « oui ») : gardé après rechargement, effaçable ; option « non » : rien n'est stocké", async () => {
    const url = await publishDemo("corde-et-bois", "choisir");
    const page = await open(url);
    await page.evaluate("localStorage.clear()"); await page.goto(pbase + url);
    assert.equal(await page.evaluate("localStorage.getItem('corde-et-bois-niveau')"), null, "rien avant un choix");
    state.log.length = 0;
    await clickText(page, ".cb-row:nth-child(1) .cb-cp", "Confirmé");
    assert.equal(await page.evaluate("localStorage.getItem('corde-et-bois-niveau')"), "pro");
    assert.deepEqual(state.log.filter((r) => r.method !== "GET"), []);
    await page.goto(pbase + url);
    assert.equal(await page.evaluate("document.querySelector('.cb-row:nth-child(1) .cb-cp[aria-pressed=true]').textContent"), "Confirmé");
    await clickText(page, ".cb-row:nth-child(1) .cb-cp", "Confirmé");
    assert.equal(await page.evaluate("localStorage.getItem('corde-et-bois-niveau')"), null, "désélection = effacement");
    activate("corde-et-bois", { memoire: "off" });
    await page.goto(pbase + url);
    await clickText(page, ".cb-row:nth-child(1) .cb-cp", "Confirmé");
    assert.equal(await page.evaluate("localStorage.getItem('corde-et-bois-niveau')"), null);
    activate("corde-et-bois");
    noErrors(page);
  });
  test("sans JavaScript : la grille complète et tous ses liens sont là ; mouvement réduit", async () => {
    const url = await publishDemo("corde-et-bois", "choisir");
    const page = await open(url, { nojs: true });
    assert.equal(await page.evaluate("document.body.classList.contains('cb-js')"), false);
    const liens = await page.evaluate("[...document.querySelectorAll('[data-corde-liste] a')].map(a=>a.getAttribute('href'))");
    assert.ok(liens.length >= 17, "liens de la grille : " + liens.length);
    assert.equal(await page.evaluate("getComputedStyle(document.querySelector('[data-corde-liste]')).display !== 'none' && document.querySelector('[data-corde-liste]').getBoundingClientRect().height > 50"), true);
    const calme = await open(url, { calme: true });
    assert.deepEqual(await infinies(calme), []);
    noErrors(page); noErrors(calme);
  });
});

describe("service-dresse : composeur de service", { skip: cdp.SKIP }, () => {
  beforeEach(() => activate("service-dresse"));
  const lignes = (page) => page.evaluate(() => [...document.querySelectorAll(".sd-row")].map((r, i) => ({ i, nom: r.querySelector(".sd-rn").textContent, prix: r.querySelector(".sd-rp").textContent, variable: /à partir de/i.test(r.querySelector(".sd-rp").textContent), rupture: r.classList.contains("sd-row--out"), grp: r.parentNode.querySelector(".sd-gh").firstChild.nodeValue, fixe: /en tout/.test(r.parentNode.querySelector(".sd-gm").textContent) })));
  const plus = (page, i, fois = 1) => page.evaluate(([n, f]) => { const b = document.querySelectorAll(".sd-row")[n].querySelectorAll(".sd-sb")[1]; for (let k = 0; k < f; k++) b.click(); }, [i, fois]);
  test("composeur : lit les cartes réelles, convives × pièces × prix, total, récapitulatif, remise à zéro", async () => {
    activate("service-dresse");
    const url = await publishDemo("service-dresse", "composer");
    const page = await open(url);
    assert.ok(await page.evaluate("document.body.classList.contains('sd-js')"));
    const L = await lignes(page); assert.ok(L.length >= 6, "lignes lues depuis les cartes : " + L.length);
    assert.equal(new Set(L.map((l) => l.nom)).size, L.length, "un produit n'apparaît qu'une fois");
    assert.match(await text(page, ".sd-tot"), /Choisissez des pièces/);
    assert.equal(await page.evaluate("document.querySelector('.sd-add').disabled"), true);
    assert.equal(await text(page, ".sd-gn"), "6 convives");
    const A = L.find((l) => !l.variable && !l.rupture && !l.fixe), B = L.find((l) => !l.variable && !l.rupture && l.fixe);
    assert.ok(A, "une pièce « par convive » à prix fixe");
    await plus(page, A.i, 2); // 2 pièces par convive
    await click(page, ".sd-gstep .sd-sb:last-of-type"); // 7 convives
    assert.equal(await text(page, ".sd-gn"), "7 convives");
    const pa = nombre(A.prix);
    assert.equal(Math.round(nombre(await text(page, ".sd-tt")) * 100), Math.round(pa * 14 * 100), "total = 2 × 7 × prix");
    assert.match(await text(page, ".sd-rec"), new RegExp(`^14 × ${A.nom.replace(/[()]/g, ".")}`));
    if (B) { await plus(page, B.i, 3); assert.equal(Math.round(nombre(await text(page, ".sd-tt")) * 100), Math.round((pa * 14 + nombre(B.prix) * 3) * 100), "pièce « en tout » : non multipliée par les convives"); }
    const rupt = L.find((l) => l.rupture);
    if (rupt) assert.equal(await page.evaluate((i) => document.querySelectorAll(".sd-row")[i].querySelectorAll(".sd-sb").length, rupt.i), 0, "une pièce en rupture ne peut pas être choisie");
    await click(page, ".sd-reset");
    assert.match(await text(page, ".sd-tot"), /Choisissez des pièces/); assert.equal(await page.evaluate("document.querySelector('.sd-add').disabled"), true);
    // bornes des convives
    for (let i = 0; i < 40; i++) await click(page, ".sd-gstep .sd-sb:last-of-type");
    assert.equal(await text(page, ".sd-gn"), "24 convives");
    for (let i = 0; i < 40; i++) await click(page, ".sd-gstep .sd-sb:first-of-type");
    assert.equal(await text(page, ".sd-gn"), "1 convive");
    noErrors(page);
  });
  test("ajout au panier : une vraie requête POST par ligne, puis le panier du site contient bien les lignes", async () => {
    const url = await publishDemo("service-dresse", "composer");
    const page = await open(url);
    const L = await lignes(page);
    const bons = L.filter((l) => !l.variable && !l.rupture).slice(0, 2); assert.equal(bons.length, 2);
    await plus(page, bons[0].i, 1); await plus(page, bons[1].i, 2);
    for (let i = 0; i < 2; i++) await click(page, ".sd-gstep .sd-sb:first-of-type"); // 4 convives
    const attendu = bons.map((l, k) => ({ nom: l.nom, q: (k === 0 ? 1 : 2) * (l.fixe ? 1 : 4) }));
    state.log.length = 0;
    await realClick(page, ".sd-add");
    await page.waitFor("/ajoutée/.test(document.querySelector('.sd-out').textContent)", "message de fin d'ajout", 20000);
    const details = await page.evaluate("[...document.querySelectorAll('.sd-rs')].map(s=>s.textContent).join(' | ')");
    const posts = state.log.filter((r) => r.method === "POST" && /\/boutique\/panier\/ajouter$/.test(r.url));
    assert.equal(posts.length, 2, "une demande par ligne");
    assert.deepEqual(posts.map((p) => Number(new URLSearchParams(p.body).get("quantity"))), attendu.map((a) => a.q));
    assert.match(await text(page, ".sd-out"), /^2 lignes ajoutées au panier/, "détail des lignes : " + details + " ; réponses : " + JSON.stringify(state.log.slice(-3)));
    const cart = await page.evaluate("fetch('/boutique/panier').then(r=>r.text())");
    for (const a of attendu) { assert.ok(cart.includes(a.nom.replace(/&/g, "&amp;")) || cart.includes(a.nom), "panier : " + a.nom); assert.match(cart, new RegExp(`value="${a.q}"`), "quantité " + a.q); }
    // Le même panier existe côté serveur (autre client = panier vide, donc le panier est bien celui de CE navigateur)
    const vide = await new Client(srv.base).get("/boutique/panier", site);
    assert.ok(!vide.text.includes(attendu[0].nom));
    noErrors(page);
  });
  test("quantité > 99 : avertissement, bouton bloqué, rien n'est envoyé ; le serveur refuse aussi une quantité hors limites", async () => {
    const url = await publishDemo("service-dresse", "composer");
    const page = await open(url);
    const A = (await lignes(page)).find((l) => !l.variable && !l.rupture && !l.fixe);
    for (let i = 0; i < 20; i++) await click(page, ".sd-gstep .sd-sb:last-of-type"); // 24 convives
    await plus(page, A.i, 5); // 5 × 24 = 120
    assert.match(await text(page, ".sd-warn"), /99 pièces au plus par ligne/);
    assert.equal(await page.evaluate("document.querySelector('.sd-add').disabled"), true);
    state.log.length = 0;
    await page.evaluate("document.querySelector('.sd-add').click()");
    assert.equal(state.log.filter((r) => r.method === "POST").length, 0);
    const rep = await page.evaluate("(async()=>{var pid=document.querySelector('.kw-pg-card form[data-sh-add] input[name=product_id]').value;var d=new URLSearchParams({product_id:pid,quantity:'150',retour:'/boutique'});var r=await fetch('/boutique/panier/ajouter',{method:'POST',body:d,headers:{Accept:'application/json','X-Requested-With':'fetch'}});return {ok:r.ok,status:r.status}})()");
    assert.equal(rep.ok, false, "le serveur reste seul juge : " + rep.status);
    noErrors(page);
  });
  test("sans JavaScript : la page reste un catalogue normal (liens et boutons d'ajout des cartes) ; mouvement réduit", async () => {
    const url = await publishDemo("service-dresse", "composer");
    const page = await open(url, { nojs: true });
    assert.equal(await page.evaluate("document.body.classList.contains('sd-js')"), false);
    assert.ok(await page.evaluate("document.querySelectorAll('.kw-pg-card a.kw-pg-link').length") >= 6);
    assert.ok(await page.evaluate("document.querySelectorAll('.kw-pg-card form[data-sh-add]').length") >= 3);
    const calme = await open(url, { calme: true });
    assert.deepEqual(await infinies(calme), []);
    noErrors(page); noErrors(calme);
  });
});
