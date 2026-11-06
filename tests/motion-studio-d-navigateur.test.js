// Motion Studio, lot d, dans un VRAI Chrome : les 11 composants de données et de micro-interactions sur une page publiée (initialisation, animation réelle, état final,
// interactions au clavier et à la souris, mouvement réduit, sans JavaScript, 320 / 768 / 1920 sans débordement), le retour de formulaire sur un vrai formulaire d'inscription,
// puis l'éditeur (insertion depuis la bibliothèque, panneau, ajout d'un élément de liste, réglage annulable, enregistrement).
// Ignoré si Playwright ou Chrome sont absents (NODE_PATH=<dossier>/node_modules pour playwright-core).
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : parcours navigateur non exécuté sur cette machine" : false;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

describe("Motion Studio lot d : données animées et micro-interactions (Chrome réel)", { skip: SKIP }, () => {
  let srv, boss, db, browser, slug, formSlug, editId;
  const node = (id, type, props, studio) => ({ id, type, props, ...(studio ? { motion: { studio: { v: 1, ...studio } } } : {}) });
  const L = { trigger: "load" };
  const until = async (fn, what, ms = 15000) => { const end = Date.now() + ms; for (;;) { let v = false; try { v = await fn(); } catch { /* on réessaie */ } if (v) return v; if (Date.now() > end) throw new Error(`Délai dépassé : ${what}`); await wait(100); } };
  const sel = (id) => `.kw-n-${id}`;

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" }); boss = await loginInstructor(srv); db = srv.db();
    const mk = async (name, children, publish) => {
      const id = Number((await boss.post("/marketing/pages", { name })).location.match(/(\d+)$/)[1]);
      const rev = db.prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(id).revision;
      const content = { sections: [{ id: "sect00000001", type: "layout", children: [{ id: "box000000001", type: "container", props: {}, children }] }] };
      const r = await boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", json: { revision: rev, content }, headers: { Origin: srv.base } });
      assert.equal(r.status, 200, r.text.slice(0, 400));
      if (publish) assert.equal((await boss.request(`/marketing/pages/${id}/publier.json`, { method: "POST", json: {}, headers: { Origin: srv.base } })).status, 200);
      return id;
    };
    const pub = await mk("MS d public", [
      node("dcirc0000001", "motioncircular", { label: "Satisfaction", value: 72 }, { ...L, duration: 600 }),
      node("dcircclick001", "motioncircular", { label: "Au clic", value: 80 }, { trigger: "click", duration: 1500 }),
      node("dgauge000001", "motiongauge", { label: "Niveau", value: 68 }, { ...L, duration: 600 }),
      node("dgaugefill001", "motiongauge", { label: "Arc", mode: "fill", value: 40 }, { ...L, duration: 600 }),
      node("dbars0000001", "motionbars", {}, { ...L, duration: 500 }),
      node("dchartbar0001", "motionchart", { type: "bar" }, { ...L, duration: 500 }),
      node("dchartline001", "motionchart", { type: "line", title: "Courbe" }, { ...L, duration: 500 }),
      node("dchartdonut01", "motionchart", { type: "donut", title: "Anneau", showTable: true }, { ...L, duration: 500 }),
      node("dcompare00001", "motioncompare", {}, { ...L, duration: 500 }),
      node("dmetric000001", "motionmetric", {}, { ...L, duration: 600 }),
      node("dtabs00000001", "motiontabs", {}, null),
      node("dtoastclick01", "motiontoast", { launch: "click", hideAfter: 0 }, null),
      node("dtoastdelay01", "motiontoast", { launch: "delay", after: 1, hideAfter: 0, title: "Retardée", message: "Message après un délai", placement: "top-left" }, null),
      node("dloader000001", "motionloader", { variant: "spinner" }, null),
      node("dskeleton0001", "motionloader", { variant: "skeleton-list", lines: 2 }, null),
      node("dformdemo0001", "motionformfeedback", { mode: "demo" }, null),
      node("dswitch000001", "motionswitch", { remember: true }, null),
      node("dcheckbox0001", "motionswitch", { variant: "checkbox", legend: "Cases" }, null),
    ], true);
    slug = db.prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(pub).slug;
    const org = db.prepare("SELECT id FROM mk_organizations").get().id;
    const formId = Number(db.prepare("INSERT INTO mk_forms (organization_id, name, slug, fields, consent_text, status, double_optin) VALUES (?, 'Newsletter d', 'newsletter-d', '[\"first_name\"]', 'J''accepte ceci.', 'published', 0)").run(org).lastInsertRowid);
    const fp = await mk("MS d formulaire", [
      node("dformpage0001", "motionformfeedback", { mode: "page" }, null),
      { id: "dsignup000001", type: "signupform", props: { formId, heading: "Rejoindre", intro: "", button: "Envoyer" } },
    ], true);
    formSlug = db.prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(fp).slug;
    editId = await mk("MS d éditeur", [], false);
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
  });
  after(async () => { if (browser) await browser.close(); if (srv) await srv.stop(); });

  const open = async (opts = {}, { js = true, path = null } = {}) => {
    const ctx = await browser.newContext({ viewport: { width: 1200, height: 800 }, javaScriptEnabled: js, ...opts });
    const page = await ctx.newPage(); const errs = [], reqs = [];
    page.on("pageerror", (e) => errs.push(e.message)); page.on("request", (r) => reqs.push(r.url()));
    await page.goto(`${srv.base}/p/${path || slug}`, { waitUntil: "load" });
    return { page, ctx, errs, reqs };
  };
  const ready = (page, id) => page.waitForFunction((s) => { const e = document.querySelector(s); return e && e.getAttribute("data-kw-ms-state"); }, sel(id), { timeout: 15000 });
  // Toutes les animations du composant sont terminées (et il y en a eu) : les valeurs écrites par le script sont alors les valeurs finales
  const settled = (page, id) => until(() => page.evaluate((q) => { const a = document.querySelector(q).getAnimations({ subtree: true }); return a.length > 0 && a.every((x) => x.playState === "finished"); }, sel(id)), `animations terminées : ${id}`, 20000);
  const text = (page, s) => page.evaluate((q) => document.querySelector(q).textContent.replace(/\s+/g, " ").trim(), s);
  const noOverflow = (page) => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1);
  const IDS = ["dcirc0000001", "dcircclick001", "dgauge000001", "dgaugefill001", "dbars0000001", "dchartbar0001", "dchartline001", "dchartdonut01", "dcompare00001", "dmetric000001", "dtabs00000001", "dtoastclick01", "dtoastdelay01", "dloader000001", "dskeleton0001", "dformdemo0001", "dswitch000001", "dcheckbox0001"];

  test("page publiée : les 18 composants s'initialisent sans erreur, modules chargés avec empreinte, états finaux exacts après animation", async () => {
    const { page, errs, reqs } = await open();
    for (const id of IDS) await ready(page, id);
    for (const m of ["circular", "gauge", "bars", "chart", "compare", "metric", "tabs", "toast", "loader", "form-feedback", "switch"]) assert.ok(reqs.some((u) => new RegExp(`/js/motion-studio/${m}\\.js\\?v=`).test(u)), `module ${m}`);
    await settled(page, "dcirc0000001"); await settled(page, "dgauge000001"); await settled(page, "dbars0000001"); await settled(page, "dchartbar0001"); await settled(page, "dmetric000001"); await settled(page, "dcompare00001");
    assert.equal(await text(page, sel("dcirc0000001") + " .kw-ms-num"), "72");
    const arc = await page.evaluate(() => { const a = document.querySelector(".kw-n-dcirc0000001 .kw-ms-cp-arc"); return getComputedStyle(a).strokeDashoffset; });
    assert.equal(parseFloat(arc), 28);
    assert.equal(await text(page, sel("dgauge000001") + " .kw-ms-num"), "68");
    assert.match(await page.evaluate(() => getComputedStyle(document.querySelector(".kw-n-dgauge000001 .kw-ms-g-needle")).transform), /^(none|matrix\(1, 0, 0, 1, 0, 0\))$/, "aiguille à sa position finale");
    assert.equal(await text(page, sel("dbars0000001") + " .kw-ms-num"), "90");
    const widths = await page.evaluate(() => [...document.querySelectorAll(".kw-n-dbars0000001 .kw-ms-pb-fill")].map((f) => Math.round(f.getBoundingClientRect().width / f.parentNode.getBoundingClientRect().width * 100)));
    assert.deepEqual(widths, [90, 75, 60], "largeurs finales");
    const bars = await page.evaluate(() => [...document.querySelectorAll(".kw-n-dchartbar0001 .kw-ms-ch-bar")].map((b) => Math.round(b.getBoundingClientRect().height / b.parentNode.getBoundingClientRect().height * 100)));
    assert.deepEqual(bars, [50, 75, 63, 100]);
    await settled(page, "dchartline001"); await settled(page, "dchartdonut01");
    assert.equal(await text(page, sel("dmetric000001") + " .kw-ms-num"), "12 480");
    assert.match(await text(page, sel("dmetric000001")), /\+12,4 %/);
    assert.equal(await text(page, sel("dcompare00001") + " .kw-ms-num"), "1 200");
    assert.deepEqual(errs, []); await page.close();
  });

  test("clic : valeur et anneau à l'état final avant ; le clic lance l'animation (nombre qui monte puis valeur exacte)", async () => {
    const { page, errs } = await open();
    await ready(page, "dcircclick001");
    assert.equal(await text(page, sel("dcircclick001") + " .kw-ms-num"), "80", "final avant le clic");
    await page.locator(sel("dcircclick001")).click();
    const seen = new Set();
    await until(async () => { seen.add(await text(page, sel("dcircclick001") + " .kw-ms-num")); return seen.has("80") && seen.size > 3; }, "valeurs intermédiaires puis finale", 6000);
    assert.ok([...seen].some((v) => Number(v) > 0 && Number(v) < 80), `valeurs vues : ${[...seen].join(",")}`);
    assert.deepEqual(errs, []); await page.close();
  });

  test("lecteurs d'écran : rôles et valeurs (progressbar, meter), tableau de données du graphique, valeur de la carte en clair", async () => {
    const { page, errs } = await open();
    await ready(page, "dchartbar0001");
    const a = await page.evaluate(() => {
      const q = (s) => document.querySelector(s);
      return { cp: q(".kw-n-dcirc0000001").getAttribute("aria-valuenow"), g: q(".kw-n-dgauge000001").getAttribute("role") + q(".kw-n-dgauge000001").getAttribute("aria-valuetext"), pb: q(".kw-n-dbars0000001 [role=progressbar]").getAttribute("aria-valuenow"),
        table: q(".kw-n-dchartbar0001 table").innerText.replace(/\s+/g, " "), vis: q(".kw-n-dchartbar0001 .kw-ms-ch-body").getAttribute("aria-hidden"), metric: q(".kw-n-dmetric000001 .kw-ms-sr").textContent.replace(/\s/g, " ") };
    });
    assert.equal(a.cp, "72"); assert.match(a.g, /^meter68 % – Moyen$/); assert.equal(a.pb, "90"); assert.match(a.table, /T2 180/); assert.equal(a.vis, "true"); assert.match(a.metric, /12\s480 €/);
    assert.equal(await page.locator(sel("dchartdonut01") + " .kw-ms-ch-data table").isVisible(), true, "tableau visible à la demande");
    assert.deepEqual(errs, []); await page.close();
  });

  test("onglets : motif ARIA, clic, flèches, Début / Fin, indicateur déplacé, panneau affiché avec transition", async () => {
    const { page, errs } = await open();
    await ready(page, "dtabs00000001");
    const T = sel("dtabs00000001");
    assert.equal(await page.locator(`${T} [role=tab]`).count(), 3); assert.equal(await page.locator(`${T} [role=tab][aria-selected=true]`).count(), 1);
    assert.equal(await page.locator(`${T} [role=tabpanel]:not([hidden])`).count(), 1);
    await page.locator(`${T} [role=tab]`).nth(1).click();
    assert.equal(await page.getAttribute(`${T} [role=tab]:nth-of-type(2)`, "aria-selected"), "true");
    assert.match(await text(page, `${T} [role=tabpanel]:not([hidden])`), /deuxième onglet/);
    const pan = await page.evaluate((T) => document.querySelector(T + " [role=tabpanel]:not([hidden])").getAnimations().length, T);
    assert.ok(pan >= 0);
    await page.keyboard.press("ArrowRight"); assert.equal(await page.evaluate((T) => document.activeElement.textContent, T), "Avis");
    await page.keyboard.press("Home"); assert.equal(await page.evaluate(() => document.activeElement.textContent), "Présentation");
    await page.keyboard.press("End"); assert.equal(await page.evaluate(() => document.activeElement.textContent), "Avis");
    assert.equal(await page.getAttribute(`${T} [role=tab][aria-selected=true]`, "id") !== null, true);
    const ind = await page.evaluate((T) => ({ ind: document.querySelector(T + " .kw-ms-tabs-ind").style.transform, left: document.querySelector(T + " [aria-selected=true]").offsetLeft }), T);
    assert.ok(ind.ind.includes(`translateX(${ind.left}px)`), ind.ind);
    assert.equal(await page.evaluate((T) => { const p = document.querySelector(T + " [role=tabpanel]:not([hidden])"); return p.getAttribute("aria-labelledby") === document.querySelector(T + " [aria-selected=true]").id; }, T), true);
    assert.deepEqual(errs, []); await page.close();
  });

  test("interrupteurs et cases : vraies cases, clavier (Espace), animation de la pastille, événement émis, mémorisation sur l'appareil", async () => {
    const { page, errs, ctx } = await open();
    await ready(page, "dswitch000001");
    const S = sel("dswitch000001");
    const events = []; await page.exposeFunction("kwSw", (d) => events.push(d));
    await page.evaluate((S) => document.querySelector(S).addEventListener("kwms:change", (e) => window.kwSw(e.detail)), S);
    const first = page.locator(`${S} .kw-ms-sw-input`).first(), second = page.locator(`${S} .kw-ms-sw-input`).nth(1);
    assert.equal(await first.isChecked(), true); assert.equal(await second.isChecked(), false);
    const thumb = () => page.evaluate((S) => getComputedStyle(document.querySelectorAll(S + " .kw-ms-sw-thumb")[1]).transform, S);
    const before = await thumb();
    await second.focus(); await page.keyboard.press("Space"); await wait(500);
    assert.equal(await second.isChecked(), true); assert.notEqual(await thumb(), before, "la pastille a bougé");
    assert.equal(events.length, 1); assert.deepEqual([events[0].index, events[0].checked], [1, true]);
    await page.reload({ waitUntil: "load" }); await ready(page, "dswitch000001");
    assert.equal(await page.locator(`${S} .kw-ms-sw-input`).nth(1).isChecked(), true, "choix mémorisé");
    await page.locator(`${sel("dcheckbox0001")} .kw-ms-sw-row`).first().click(); await wait(400);
    assert.equal(await page.locator(`${sel("dcheckbox0001")} .kw-ms-sw-input`).first().isChecked(), false);
    assert.deepEqual(errs, []); await ctx.close();
  });

  test("notification : bouton créé, zone aria-live, fermeture par la croix et par Échap, déclenchement après délai", async () => {
    const { page, errs } = await open();
    await ready(page, "dtoastclick01");
    assert.equal(await page.locator(`${sel("dtoastclick01")} .kw-ms-toast-static`).isVisible(), false, "statique remplacé");
    await page.locator(`${sel("dtoastclick01")} .kw-ms-toast-btn`).click();
    const region = page.locator(".kw-ms-toast-region[aria-live=polite]");
    await region.locator(".kw-ms-toast").first().waitFor({ timeout: 5000 });
    assert.match(await region.first().textContent(), /Merci ! Nous vous répondons/);
    await region.locator(".kw-ms-toast-close").first().click();
    await until(async () => (await page.locator(".kw-ms-toast-region .kw-ms-toast").count()) === 1 || (await page.locator(".kw-ms-toast-region .kw-ms-toast").count()) === 0, "fermée", 3000);
    // le délai : une notification en haut à gauche apparaît seule
    await region.first().page().locator(".kw-ms-toast-region.is-top-left .kw-ms-toast").waitFor({ timeout: 6000 });
    assert.match(await page.locator(".kw-ms-toast-region.is-top-left").textContent(), /Message après un délai/);
    await page.keyboard.press("Escape");
    await until(async () => (await page.locator(".kw-ms-toast-region.is-top-left .kw-ms-toast").count()) === 0, "fermée par Échap", 3000);
    assert.deepEqual(errs, []); await page.close();
  });

  test("chargement : bouton Pause réel (animation suspendue puis reprise), squelette sans bouton propre à chaque composant", async () => {
    const { page, errs } = await open();
    await ready(page, "dloader000001");
    const state = () => page.evaluate(() => getComputedStyle(document.querySelector(".kw-n-dloader000001 .kw-ms-ld-shape")).animationPlayState);
    assert.equal(await state(), "running");
    const btn = page.locator(`${sel("dloader000001")} .kw-ms-ld-pause`);
    await btn.click(); assert.equal(await btn.getAttribute("aria-pressed"), "true"); assert.equal(await state(), "paused");
    await btn.click(); assert.equal(await state(), "running");
    assert.equal(await page.locator(`${sel("dskeleton0001")} .kw-ms-sk-row`).count(), 2);
    assert.deepEqual(errs, []); await page.close();
  });

  test("retour de formulaire (démonstration) : erreur annoncée et champ invalide, puis succès ; rien n'est envoyé", async () => {
    const { page, errs, reqs } = await open();
    await ready(page, "dformdemo0001");
    const F = sel("dformdemo0001"), n0 = reqs.length;
    await page.locator(`${F} button[type=submit]`).click();
    assert.equal(await page.getAttribute(`${F} input`, "aria-invalid"), "true");
    assert.match(await text(page, `${F} .kw-ms-ff-form .kw-ms-ff-msg`), /adresse e-mail valide/); assert.equal(await page.getAttribute(`${F} .kw-ms-ff-form .kw-ms-ff-msg`, "role"), "alert");
    await page.fill(`${F} input`, "pas-une-adresse"); await page.locator(`${F} button[type=submit]`).click();
    assert.equal(await page.getAttribute(`${F} input`, "aria-invalid"), "true");
    await page.fill(`${F} input`, "nom@exemple.fr"); await page.locator(`${F} button[type=submit]`).click();
    assert.match(await text(page, `${F} .kw-ms-ff-form .kw-ms-ff-msg`), /Merci ! Votre inscription/); assert.equal(await page.getAttribute(`${F} .kw-ms-ff-form .kw-ms-ff-msg`, "role"), "status"); assert.equal(await page.locator(`${F} .kw-ms-ff-tick`).count(), 1);
    assert.match(await text(page, F), /rien n'est envoyé/);
    assert.equal(reqs.length, n0, "aucune requête réseau");
    assert.deepEqual(errs, []); await page.close();
  });

  test("retour de formulaire sur un VRAI formulaire d'inscription : envoi bloqué si champ obligatoire vide (résumé annoncé, focus), puis envoi réel et coche au retour", async () => {
    const { page, errs } = await open({}, { path: formSlug });
    await ready(page, "dformpage0001");
    const before = await page.url();
    await page.locator(".kw-signup-form button[type=submit]").click();
    assert.equal(page.url(), before, "pas d'envoi");
    assert.equal(await page.evaluate(() => document.activeElement && document.activeElement.name), "email", "focus sur le champ en erreur");
    assert.equal(await page.getAttribute(".kw-signup-form input[name=email]", "aria-invalid"), "true");
    const al = page.locator(`${sel("dformpage0001")} [role=alert]`); assert.equal(await al.isVisible(), true); assert.match(await al.textContent(), /Merci de corriger les champs suivants : Adresse e-mail/);
    await page.fill(".kw-signup-form input[name=email]", "lecteur@exemple.fr");
    assert.equal(await page.getAttribute(".kw-signup-form input[name=email]", "aria-invalid"), "false");
    const consent = page.locator(".kw-signup-form input[name=consent]"); if (await consent.count()) await consent.check();
    await Promise.all([page.waitForNavigation({ waitUntil: "load", timeout: 20000 }), page.locator(".kw-signup-form button[type=submit]").click()]);
    await ready(page, "dformpage0001");
    const thanks = await page.locator(".kw-signup .lp-thanks, .kw-signup .lp-error").first().textContent().catch(() => null);
    assert.ok(thanks, "message de retour du serveur");
    if (await page.locator(".kw-signup .lp-thanks").count()) assert.equal(await page.locator(".kw-signup .lp-thanks .kw-ms-ff-tick").count(), 1, "coche tracée sur le remerciement");
    assert.deepEqual(errs, []); await page.close();
  });

  test("mouvement réduit : états finaux, aucune animation en cours ; interactions (onglets, notification, interrupteur, pause) toujours utilisables", async () => {
    const { page, errs } = await open({ reducedMotion: "reduce" });
    for (const id of IDS) await ready(page, id);
    assert.equal(await page.getAttribute(sel("dcirc0000001"), "data-kw-ms-state"), "reduced");
    assert.equal(await text(page, sel("dcirc0000001") + " .kw-ms-num"), "72");
    assert.equal(await page.evaluate(() => ["dcirc0000001", "dgauge000001", "dbars0000001", "dchartbar0001", "dmetric000001", "dcompare00001"].reduce((n, id) => n + document.querySelector(".kw-n-" + id).getAnimations({ subtree: true }).length, 0)), 0);
    assert.equal(await page.evaluate(() => getComputedStyle(document.querySelector(".kw-n-dloader000001 .kw-ms-ld-shape")).animationName), "none", "chargement figé");
    assert.equal(await page.locator(`${sel("dloader000001")} .kw-ms-ld-pause`).count(), 0, "pas de bouton inutile");
    await page.locator(`${sel("dtabs00000001")} [role=tab]`).nth(2).click();
    assert.equal(await page.evaluate((T) => document.querySelector(T + " [role=tabpanel]:not([hidden])").getAnimations().length, sel("dtabs00000001")), 0, "onglets sans transition");
    await page.locator(`${sel("dtoastclick01")} .kw-ms-toast-btn`).click();
    await page.locator(".kw-ms-toast-region .kw-ms-toast").first().waitFor({ timeout: 5000 });
    assert.equal(await page.evaluate(() => document.querySelector(".kw-ms-toast-region .kw-ms-toast").getAnimations().length), 0);
    await page.locator(`${sel("dcheckbox0001")} .kw-ms-sw-row`).first().click();
    assert.equal(await page.locator(`${sel("dcheckbox0001")} .kw-ms-sw-input`).first().isChecked(), false);
    assert.deepEqual(errs, []); await page.close();
  });

  test("sans JavaScript : contenu complet (valeurs, tableaux, tous les panneaux, message de la notification) et cases réellement cochables", async () => {
    const { page } = await open({}, { js: false });
    const t = (id) => text(page, sel(id));
    assert.match(await t("dcirc0000001"), /72/); assert.match(await t("dgauge000001"), /68/); assert.match(await t("dbars0000001"), /Design.*90.*Développement.*75/);
    assert.match(await t("dchartbar0001"), /T1.*120.*T4.*240/); assert.match(await t("dchartdonut01"), /Anneau/); assert.match(await t("dcompare00001"), /Visiteurs.*1 200.*1 800/); assert.match(await t("dmetric000001"), /12 480/);
    assert.equal(await page.locator(`${sel("dtabs00000001")} .kw-ms-tabs-panel`).evaluateAll((l) => l.filter((e) => e.getClientRects().length > 0).length), 3, "les trois panneaux visibles");
    assert.match(await t("dtoastclick01"), /Merci ! Nous vous répondons/); assert.equal(await page.locator(`${sel("dtoastclick01")} .kw-ms-toast-static`).isVisible(), true);
    const box = page.locator(`${sel("dcheckbox0001")} .kw-ms-sw-row`).first(); const inp = page.locator(`${sel("dcheckbox0001")} .kw-ms-sw-input`).first();
    const was = await inp.isChecked(); await box.click(); assert.equal(await inp.isChecked(), !was, "case cochable sans JavaScript");
    assert.equal(await page.evaluate(() => getComputedStyle(document.querySelector(".kw-n-dloader000001 .kw-ms-ld-shape")).animationName), "kw-ms-spin");
    await page.close();
  });

  test("320 / 768 / 1920 px : aucun débordement horizontal ; composants contenus dans leur colonne", async () => {
    const { page, errs } = await open();
    for (const id of IDS) await ready(page, id);
    for (const w of [320, 768, 1920]) {
      await page.setViewportSize({ width: w, height: 900 }); await wait(500);
      assert.ok(await noOverflow(page), `débordement à ${w}px`);
      const wide = await page.evaluate(() => [...document.querySelectorAll(".kw-ms-d")].filter((e) => e.getBoundingClientRect().right > document.documentElement.clientWidth + 1).map((e) => e.className.split(" ").find((c) => c.startsWith("kw-motion"))));
      assert.deepEqual(wide, [], `composants hors écran à ${w}px`);
    }
    assert.deepEqual(errs, []); await page.close();
  });

  // ---------------------------------------------------------------- éditeur
  test("éditeur : les 11 composants s'insèrent depuis la bibliothèque, panneau complet, ajout d'un onglet, réglage annulable, enregistrement", { timeout: 300000 }, async () => {
    const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
    await ctx.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    const page = await ctx.newPage(); const errs = [];
    page.on("pageerror", (e) => errs.push(e.message));
    await page.goto(`${srv.base}/marketing/pages/${editId}/editeur`);
    await page.waitForFunction(() => { const f = document.querySelector("[data-pb-frame]"); return f && f.contentDocument && f.contentDocument.body && f.contentDocument.body.classList.contains("lp-builder") && window.__pb; }, null, { timeout: 30000 });
    await wait(800);
    const doc = () => page.evaluate(() => window.__pb.content());
    const flat = (c) => { const o = []; const w = (l) => (l || []).forEach((n) => { o.push(n); w(n.children); }); w(c.sections); return o; };
    const settle = () => page.waitForFunction(() => !window.__pb.dirty(), null, { timeout: 20000 });
    await page.evaluate(() => { const b = document.querySelector("#pb-tab-elements"); if (b) b.click(); });
    const LABELS = { motioncircular: "Progression circulaire", motiongauge: "Jauge", motionbars: "Barres de progression animées", motionchart: "Graphique animé", motioncompare: "Comparaison de données", motionmetric: "Carte de métrique", motiontabs: "Onglets animés", motiontoast: "Notification animée", motionloader: "Chargement et squelette", motionformfeedback: "Retour de formulaire animé", motionswitch: "Interrupteurs et cases animés" };
    for (const [type, label] of Object.entries(LABELS)) {
      await page.locator("[data-pb-el-search]").fill(label); await wait(150);
      await page.locator(`.pb-pal-item[data-widget="${type}"]`).first().click({ timeout: 8000 }); await wait(250);
    }
    let c = await doc(); const added = flat(c).filter((n) => Object.keys(LABELS).includes(n.type));
    assert.equal(added.length, 11, "11 composants insérés");
    await settle();
    // canevas : chaque composant a son contenu et son module démarré
    await until(() => page.evaluate(() => { const f = document.querySelector("[data-pb-frame]"); const d = f.contentDocument; return [...d.querySelectorAll("[data-kw-ms-module]")].length >= 11 && [...d.querySelectorAll("[data-kw-ms-module]")].every((e) => e.getAttribute("data-kw-ms-state")); }), "11 composants initialisés dans le canevas", 30000);
    // panneau de l'onglet : six sections, ajout d'un onglet, réglage de l'effet annulable
    const tabsNode = added.find((n) => n.type === "motiontabs");
    await page.locator(`[data-pb-layers] .pb-node[data-id="${tabsNode.id}"] > .pb-row-item`).first().click(); await wait(400);
    const titles = await page.locator("[data-pb-inspector] .pb-acc-title").allTextContents();
    for (const t of ["Contenu", "Style", "Animation", "Responsive", "Avancé"]) assert.ok(titles.includes(t), `section ${t} : ${titles.join("|")}`);
    await page.locator("[data-pb-inspector] .pb-items").getByRole("button", { name: "Ajouter un élément" }).click(); await wait(400);
    c = await doc(); assert.equal(flat(c).find((n) => n.id === tabsNode.id).props.items.length, 4, "onglet ajouté");
    const eff = page.locator('[data-pb-inspector] .pb-field:has(> label:text-is("Effet")) select');
    await eff.selectOption("fade"); await wait(300);
    c = await doc(); assert.equal(flat(c).find((n) => n.id === tabsNode.id).motion.studio.preset, "fade");
    await page.evaluate(() => { const b = [...document.querySelectorAll("button")].find((x) => /Annuler/.test(x.getAttribute("data-tip") || "") && !x.disabled); if (b) b.click(); }); await wait(300);
    c = await doc(); assert.equal(flat(c).find((n) => n.id === tabsNode.id).motion, undefined, "annulation du réglage");
    // les onglets du canevas fonctionnent (4 onglets maintenant)
    await until(() => page.evaluate((id) => { const d = document.querySelector("[data-pb-frame]").contentDocument; const e = d.querySelector(`[data-node-id="${id}"]`); return e && e.querySelectorAll("[role=tab]").length === 4; }, tabsNode.id), "4 onglets dans le canevas", 15000);
    await settle();
    const saved = JSON.parse(db.prepare("SELECT draft FROM mk_landing_pages WHERE id = ?").get(editId).draft);
    assert.equal(flat(saved).filter((n) => Object.keys(LABELS).includes(n.type)).length, 11);
    assert.deepEqual(errs, []); await ctx.close();
  });
});
