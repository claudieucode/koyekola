// Theme Builder (mission 9) dans l'éditeur réel (Chrome) : composant global (deux onglets, « Mettre à jour »), en-tête du site (aperçu = page publiée),
// bouton de diaporama (texte ET adresse). Chaque test lit le résultat sur le serveur ET sur la page publiée.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, Client, loginInstructor } = require("./helpers");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : parcours navigateur non exécuté sur cette machine" : false;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const UA = { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 Chrome/120 Safari/537.36" };
const idFrom = (l) => Number(l.match(/(?:pages|sites)\/(\d+)|(\d+)(?:#.*)?$/).slice(1).find(Boolean));
const layout = (text, hid = "head00000001") => ({ id: "sect00000001", type: "layout", children: [{ id: "cont00000001", type: "container", children: [{ id: hid, type: "heading", props: { text, level: 2 } }] }] });

describe("Theme Builder dans l'éditeur réel (Chrome)", { skip: SKIP }, () => {
  let srv, boss, db, browser, context;
  const errors = [];
  const json = (method, path, body) => boss.request(path, { method, json: body || {}, headers: { Origin: srv.base } });
  const J = (r) => JSON.parse(r.text);
  const newTab = async () => { const p = await context.newPage(); p.on("pageerror", (e) => errors.push(e.message)); return p; };
  const ready = async (p, url) => {
    await p.goto(`${srv.base}${url}`);
    await p.waitForFunction(() => { const f = document.querySelector("[data-pb-frame]"); return f && f.contentDocument && f.contentDocument.body && f.contentDocument.body.classList.contains("lp-builder") && window.__pb; }, null, { timeout: 60000 });
    await wait(500);
  };
  const choose = async (p, nid) => {
    await p.locator(`[data-pb-layers] .pb-node[data-id="${nid}"] > .pb-row-item`).first().click({ timeout: 8000 }); await wait(250);
    const first = (await p.$$eval("[data-pb-inspector] [role=tab]", (e) => e.map((x) => x.textContent))).find((x) => !/^(Style|Avancé|Interactions)$/.test(x));
    if (first) await p.locator("[data-pb-inspector] [role=tab]", { hasText: new RegExp(`^${first}$`) }).click();
    await wait(150);
    await p.$$eval("[data-pb-inspector] details", (ds) => ds.forEach((d) => { d.open = true; })); await wait(150);
  };
  const field = (p, label) => p.locator("[data-pb-inspector] .pb-field", { hasText: label }).locator("input[type=text], textarea").first();
  const toast = (p) => p.evaluate(() => { const t = document.querySelector("[data-pb-toast]"); return t && !t.hidden ? t.textContent.trim() : ""; });
  const comp = (id) => db.prepare("SELECT * FROM mk_web_components WHERE id = ?").get(id);

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    db = srv.db();
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
    context = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
    await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
  });
  after(async () => { if (browser) await browser.close(); if (srv) await srv.stop(); });

  test("composant global : deux onglets — le second ne peut pas écraser le premier ; « Mettre à jour » diffuse la version confirmée sur la page publiée", { timeout: 120000 }, async () => {
    const c = J(await json("POST", "/marketing/site-web/composants", { name: "Bandeau global", section: layout("Version initiale"), global: true, kind: "global" })).component;
    const pageId = idFrom((await boss.post("/marketing/pages", { name: "Page qui utilise le composant" })).location);
    const rev = () => db.prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(pageId).revision;
    assert.equal((await json("PUT", `/marketing/pages/${pageId}/brouillon`, { revision: rev(), content: { sections: [{ id: "link00000001", type: "component", componentId: c.id }] } })).status, 200);
    assert.equal((await json("POST", `/marketing/pages/${pageId}/publier.json`, {})).status, 200);
    const slug = db.prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(pageId).slug;
    const live = async () => (await new Client(srv.base).get(`/p/${slug}`, { headers: UA })).text;
    assert.match(await live(), /Version initiale/);

    const one = await newTab(), two = await newTab();
    await ready(one, `/marketing/site-web/composants/${c.id}/editeur`);
    await ready(two, `/marketing/site-web/composants/${c.id}/editeur`);
    // onglet 1 : modification enregistrée en brouillon, pas encore diffusée
    await choose(one, "head00000001");
    await field(one, "Texte").fill("Onglet un"); await field(one, "Texte").press("Tab");
    await wait(500);
    await one.waitForFunction(() => !window.__pb.dirty(), null, { timeout: 15000 });
    assert.match(JSON.stringify(JSON.parse(comp(c.id).draft)), /Onglet un/);
    assert.match(await live(), /Version initiale/, "rien n'est diffusé avant « Mettre à jour »");
    // onglet 2 (ouvert avant) : son enregistrement part d'une version périmée → refusé, rien d'écrasé, message visible
    await choose(two, "head00000001");
    await field(two, "Texte").fill("Onglet deux"); await field(two, "Texte").press("Tab");
    await wait(2500);
    assert.doesNotMatch(comp(c.id).draft, /Onglet deux/, "le brouillon de l'onglet 1 n'est pas écrasé");
    assert.match(await two.evaluate(() => document.body.innerText), /modifi.{0,30}ailleurs|autre onglet/i, "le conflit est expliqué à l'écran");
    assert.equal(await two.evaluate(() => window.__pb.dirty()), true, "la modification refusée reste signalée comme non enregistrée");
    // onglet 1 : « Mettre à jour » diffuse
    await one.locator("[data-pb-publish]").click();
    // le composant est global et utilisé par une page : l'éditeur montre les pages touchées et demande confirmation
    await one.locator("dialog[open] button", { hasText: /^Mettre à jour$/ }).click({ timeout: 8000 });
    await one.waitForFunction(() => /À jour/.test(document.querySelector("[data-pb-status]").textContent), null, { timeout: 15000 });
    assert.match(await live(), /Onglet un/);
    assert.doesNotMatch(await live(), /Version initiale/);
    assert.equal(comp(c.id).version, 2);
    assert.equal(comp(c.id).draft, null);
    assert.deepEqual(errors, []);
    await one.close(); await two.close();
  });

  test("en-tête du site : ce que montre le canevas est ce que montre la page publiée, sur tous les écrans", { timeout: 120000 }, async () => {
    const siteId = idFrom((await boss.post("/marketing/site-web/sites", { name: "Site en-tête" })).location);
    await boss.post(`/marketing/site-web/sites/${siteId}/entete/creer`, {});
    const headerId = db.prepare("SELECT header_component_id FROM mk_sites WHERE id = ?").get(siteId).header_component_id;
    const pageId = idFrom((await boss.post("/marketing/pages", { name: "Accueil en-tête", site_id: String(siteId) })).location);
    assert.equal((await json("POST", `/marketing/pages/${pageId}/publier.json`, {})).status, 200);
    const slug = db.prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(pageId).slug;
    const rev = () => db.prepare("SELECT revision FROM mk_web_components WHERE id = ?").get(headerId).revision;
    assert.equal((await json("PUT", `/marketing/site-web/composants/${headerId}/brouillon`, { revision: rev(), content: { sections: [layout("MARQUE-DEPART")] } })).status, 200);
    assert.equal((await json("POST", `/marketing/site-web/composants/${headerId}/mettre-a-jour`, { revision: rev() })).status, 200);
    const p = await newTab();
    await ready(p, `/marketing/site-web/composants/${headerId}/editeur`);
    assert.match(await p.locator("[data-pb-status]").innerText(), /En-tête : publié, à jour/);
    await choose(p, "head00000001");
    await field(p, "Texte").fill("MARQUE-TEST"); await field(p, "Texte").press("Tab");
    await p.waitForFunction(() => !window.__pb.dirty(), null, { timeout: 15000 });
    await p.locator("[data-pb-publish]").click();
    await p.waitForFunction(() => /publié, à jour/.test(document.querySelector("[data-pb-status]").textContent), null, { timeout: 15000 });
    const inCanvas = await p.evaluate(() => document.querySelector("[data-pb-frame]").contentDocument.body.innerText);
    assert.match(inCanvas, /MARQUE-TEST/, "canevas");
    for (const width of [320, 768, 1440]) {
      const pub = await context.newPage();
      await pub.setViewportSize({ width, height: 900 });
      await pub.goto(`${srv.base}/p/${slug}`);
      const body = await pub.evaluate(() => ({ text: document.body.innerText, htmlCount: document.documentElement.outerHTML.split("<html").length - 1, headers: document.querySelectorAll(".lp-site-header").length, scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
      assert.match(body.text, /MARQUE-TEST/, `page publiée à ${width}`);
      assert.equal(body.headers, 1, `un seul en-tête à ${width}`);
      assert.ok(body.scroll <= body.client + 1, `pas de défilement horizontal à ${width} (${body.scroll} > ${body.client})`);
      await pub.close();
    }
    await p.close();
    assert.deepEqual(errors, []);
  });

  test("diaporama : texte du bouton sans adresse → refus expliqué à l'écran, adresse précédente conservée sur le serveur, correction possible ; les deux → enregistré", { timeout: 120000 }, async () => {
    const id = idFrom((await boss.post("/marketing/pages", { name: "Diaporama", template: "", ouvrir: "editeur" })).location);
    const rev = () => db.prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(id).revision;
    const slides = [{ title: "Première", text: "t", buttonLabel: "En savoir plus", buttonUrl: "/catalogue", dark: 45 }];
    assert.equal((await json("PUT", `/marketing/pages/${id}/brouillon`, { revision: rev(), content: { title: "D", sections: [{ id: "sect00000001", type: "layout", children: [{ id: "cont00000001", type: "container", children: [{ id: "slid00000001", type: "slides", props: { label: "Diaporama", slides } }] }] }] } })).status, 200);
    const p = await newTab();
    await ready(p, `/marketing/pages/${id}/editeur`);
    await choose(p, "slid00000001");
    const url = field(p, "Adresse du bouton");
    await url.fill(""); await url.press("Tab");
    await p.waitForFunction(() => /bouton demande une adresse/.test(document.querySelector(".pb-save").textContent), null, { timeout: 8000 }).catch(() => {});
    const saved = () => JSON.stringify(JSON.parse(db.prepare("SELECT draft, sections FROM mk_landing_pages WHERE id = ?").get(id).draft || "{}"));
    const bar = await p.locator(".pb-save").innerText();
    assert.match(bar, /Non enregistré/);
    assert.match(bar, /bouton demande une adresse/, "la raison est dite dans la barre d'enregistrement : " + bar);
    assert.match(saved(), /"buttonUrl":"\/catalogue"/, "l'adresse précédente reste enregistrée sur le serveur");
    assert.equal(await p.evaluate(() => window.__pb.dirty()), true, "la saisie refusée reste signalée comme non enregistrée (rien n'est perdu en silence)");
    // la bonne valeur peut ensuite être enregistrée normalement
    await url.fill("/formations"); await url.press("Tab");
    await p.waitForFunction(() => !window.__pb.dirty(), null, { timeout: 15000 });
    assert.match(saved(), /"buttonUrl":"\/formations"/);
    await p.close();
  });

  test("performance : une rafale de modifications dans l'éditeur d'un composant donne un seul enregistrement et aucune erreur de script", { timeout: 120000 }, async () => {
    const c = J(await json("POST", "/marketing/site-web/composants", { name: "Bandeau perf", section: layout("Départ"), global: true, kind: "global" })).component;
    const p = await newTab();
    const puts = []; p.on("request", (r) => { if (r.method() === "PUT" && /\/brouillon$/.test(r.url())) puts.push(r.url()); });
    const renders = []; p.on("request", (r) => { if (r.method() === "POST" && /\/rendu$/.test(r.url())) renders.push(r.url()); });
    await ready(p, `/marketing/site-web/composants/${c.id}/editeur`);
    await choose(p, "head00000001");
    const f = field(p, "Texte");
    const startedRenders = renders.length;
    const t0 = Date.now();
    for (let i = 1; i <= 6; i++) { await f.fill("Saisie " + i); await wait(120); }
    await f.press("Tab");
    await p.waitForFunction(() => !window.__pb.dirty(), null, { timeout: 15000 });
    const elapsed = Date.now() - t0;
    console.log(`# performance composant : 6 saisies → ${puts.length} enregistrement(s), ${renders.length - startedRenders} rendu(s) d'aperçu, ${elapsed} ms`);
    assert.equal(puts.length, 1, "une seule sauvegarde pour la rafale");
    assert.match(comp(c.id).draft, /Saisie 6/);
    assert.deepEqual(errors, []);
    await p.close();
  });

  test("publication d'un composant pendant un enregistrement en cours : la mise à jour attend, puis diffuse la DERNIÈRE saisie confirmée", { timeout: 120000 }, async () => {
    const c = J(await json("POST", "/marketing/site-web/composants", { name: "Bandeau lent", section: layout("Départ lent"), global: true, kind: "global" })).component;
    const p = await newTab();
    await ready(p, `/marketing/site-web/composants/${c.id}/editeur`);
    await choose(p, "head00000001");
    await field(p, "Texte").fill("Premier jet"); await field(p, "Texte").press("Tab");
    await p.waitForFunction(() => !window.__pb.dirty() && !document.querySelector("[data-pb-publish]").hidden, null, { timeout: 15000 });
    // l'enregistrement suivant est ralenti : on clique sur « Mettre à jour » pendant qu'il est en vol
    await p.route((u) => /\/composants\/\d+\/brouillon$/.test(u.pathname), async (route) => { await wait(2500); await route.continue(); });
    const started = p.waitForRequest((r) => r.method() === "PUT" && /\/brouillon$/.test(r.url()));
    await field(p, "Texte").fill("Dernière saisie"); await field(p, "Texte").press("Tab");
    await started;
    await p.locator("[data-pb-publish]").click();
    await p.waitForFunction(() => /À jour/.test(document.querySelector("[data-pb-status]").textContent), null, { timeout: 20000 });
    const section = JSON.stringify(JSON.parse(comp(c.id).section));
    assert.match(section, /Dernière saisie/, "la version diffusée est la dernière confirmée, pas la précédente");
    assert.equal(comp(c.id).draft, null);
    assert.equal(comp(c.id).version, 2, "une seule diffusion");
    await p.close();
  });

  test("réseau coupé puis session expirée pendant l'enregistrement d'un composant : message clair, travail conservé, reprise automatique", { timeout: 120000 }, async () => {
    const c = J(await json("POST", "/marketing/site-web/composants", { name: "Bandeau réseau", section: layout("Départ réseau"), global: true, kind: "global" })).component;
    const p = await newTab();
    await ready(p, `/marketing/site-web/composants/${c.id}/editeur`);
    await choose(p, "head00000001");
    let mode = "coupe";
    await p.route((u) => /\/composants\/\d+\/brouillon$/.test(u.pathname), async (route) => {
      if (mode === "coupe") return route.abort();
      if (mode === "expire") return route.fulfill({ status: 401, contentType: "application/json", body: JSON.stringify({ error: { code: "unauthorized", message: "Session expirée" } }) });
      return route.continue();
    });
    await field(p, "Texte").fill("Après coupure"); await field(p, "Texte").press("Tab");
    await p.waitForFunction(() => /Erreur d'enregistrement/.test(document.querySelector(".pb-save").textContent), null, { timeout: 15000 });
    assert.equal(await p.evaluate(() => window.__pb.dirty()), true, "rien n'est annoncé comme enregistré");
    assert.doesNotMatch(comp(c.id).draft || "", /Après coupure/);
    mode = "expire";
    await p.waitForFunction(() => /Session expirée/.test(document.querySelector(".pb-save").textContent), null, { timeout: 20000 });
    assert.equal(await p.evaluate(() => window.__pb.dirty()), true);
    mode = "ok";
    await p.waitForFunction(() => !window.__pb.dirty(), null, { timeout: 30000 });
    assert.match(comp(c.id).draft, /Après coupure/, "la reprise automatique enregistre le travail conservé");
    await p.close();
  });
});
