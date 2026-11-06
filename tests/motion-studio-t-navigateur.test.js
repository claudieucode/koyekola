// Motion Studio, lot « t » (textes et cascade), dans un VRAI Chrome : page publiée (12 composants : contenu accessible, animation réellement exécutée, déclencheurs,
// pause, mouvement réduit, sans JavaScript, écran coupé, 320 / 768 / 1920 sans débordement), puis éditeur (insertion depuis la bibliothèque, réglages, listes, canevas).
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
const until = async (fn, what, ms = 15000) => { const end = Date.now() + ms; for (;;) { let v = false; try { v = await fn(); } catch { /* on réessaie */ } if (v) return v; if (Date.now() > end) throw new Error(`Délai dépassé : ${what}`); await wait(80); } };

const id = (k) => `t${k}`.padEnd(12, "0").slice(0, 12);
const IDS = { heading: id("head"), reveal: id("reveal"), kinetic: id("kinetic"), typewriter: id("typew"), rotating: id("rotat"), gradient: id("gradi"), mask: id("mask"), scramble: id("scram"), ticker: id("ticker"), marquee: id("marq"), circular: id("circ"), cascade: id("casc"), cascadeLow: id("cascl"), kineticScroll: id("kinsc"), offMobile: id("offm"), clickType: id("clickt") };
const spacer = (k) => ({ id: id("spc" + k), type: "spacer", props: { size: "128" } });
const node = (key, type, props, studio) => ({ id: IDS[key], type, props, ...(studio ? { motion: { studio: { v: 1, ...studio } } } : {}) });
const LONG = "Un très long titre qui doit passer à la ligne sur les petits écrans sans jamais déborder de la page";

const CHILDREN = () => [
  node("heading", "motionanimatedheading", { before: "Créez des pages", highlight: "inoubliables", after: "vite", tag: "h2", color: "", thickness: "normal" }, { trigger: "load", preset: "circle" }),
  node("reveal", "motionrevealtext", { text: "Révélation lettre par lettre", tag: "p", split: "chars" }, { trigger: "load", preset: "wipe" }),
  node("kinetic", "motionkinetictext", { lines: [{ text: "Le mouvement", look: "solid" }, { text: "donne du", look: "outline" }, { text: "caractère", look: "accent" }], tag: "h2", accent: "token:primary" }, { trigger: "load" }),
  node("typewriter", "motiontypewriter", { prefix: "Nous créons", phrases: [{ text: "des sites" }, { text: "des boutiques" }], suffix: "", tag: "h2", cursor: "bar" }, { trigger: "load", params: { speed: 60, hold: 600 } }),
  node("rotating", "motionrotatingtext", { before: "Pour", words: [{ text: "enseigner" }, { text: "vendre" }, { text: "grandir" }], after: "mieux", tag: "h2" }, { trigger: "load", duration: 300, params: { hold: 500 } }),
  node("gradient", "motiongradienttext", { text: "Un texte plein de couleurs", tag: "h2", colors: [{ color: "#ff0066" }, { color: "#3366ff" }], highlight: "" }, { trigger: "load", duration: 2000 }),
  node("mask", "motiontextmask", { text: "ÉNERGIE", tag: "h2", fill: "color", image: "", color: "token:primary" }, { trigger: "load", duration: 1500 }),
  node("scramble", "motiontextscramble", { phrases: [{ text: "Décodez votre message" }], tag: "h2" }, { trigger: "load", duration: 1600 }),
  node("ticker", "motionnumberticker", { from: 0, to: 1250, decimals: 0, prefix: "", suffix: "+", thousands: "space", decimal: "comma", label: "clients" }, { trigger: "load", duration: 1800 }),
  node("marquee", "motionmarqueevelocity", { items: [{ text: "Formations" }, { text: "Communauté" }, { text: "Accompagnement" }, { text: "Certificats" }], separator: "•", label: "Bandeau" }, null),
  node("circular", "motioncirculartext", { text: "Créer · Animer · Publier ·", center: "✦", size: 240, fontSize: 14, weight: "600", startAngle: 0 }, { trigger: "load", duration: 4000 }),
  node("cascade", "motioncascade", { items: [{ title: "Simple", text: "Un", image: "", alt: "", link: "" }, { title: "Rapide", text: "Deux", image: "", alt: "", link: "/" }, { title: "Souple", text: "Trois", image: "", alt: "", link: "" }, { title: "Clair", text: "Quatre", image: "", alt: "", link: "" }], layout: "grid", columns: "4", look: "card", titleTag: "h3" }, { trigger: "load", stagger: 200, duration: 900 }),
  node("offMobile", "motiontypewriter", { prefix: "", phrases: [{ text: "Coupé sur mobile" }], suffix: "", tag: "p", cursor: "bar" }, { trigger: "load", off: ["mobile"] }),
  node("clickType", "motiontextscramble", { phrases: [{ text: "Survolez ou cliquez" }], tag: "p" }, { trigger: "click", duration: 800 }),
  node("kineticScroll", "motionkinetictext", { lines: [{ text: "Dérive", look: "solid" }, { text: "au défilement", look: "solid" }], tag: "h2", accent: "token:primary" }, { trigger: "scroll", preset: "drift" }),
  spacer(1), spacer(2), spacer(3), spacer(4), spacer(5), spacer(6),
  node("cascadeLow", "motioncascade", { items: [{ title: "A", text: "", image: "", alt: "", link: "" }, { title: "B", text: "", image: "", alt: "", link: "" }, { title: "C", text: "", image: "", alt: "", link: "" }], layout: "list", columns: "3", look: "line", titleTag: "h3" }, { trigger: "viewport", stagger: 250, duration: 700 }),
  { id: id("long"), type: "motionrevealtext", props: { text: LONG, tag: "p", split: "lines" }, motion: { studio: { v: 1, trigger: "load" } } },
  spacer(7),
];

describe("Motion Studio lot t : 12 composants de texte (Chrome réel)", { skip: SKIP }, () => {
  let srv, boss, db, browser, slug, editId;
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" }); boss = await loginInstructor(srv); db = srv.db();
    const mk = async (name, children, publish) => {
      const pid = Number((await boss.post("/marketing/pages", { name })).location.match(/(\d+)$/)[1]);
      const rev = db.prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(pid).revision;
      const content = { sections: [{ id: "sect00000001", type: "layout", children: [{ id: "box000000001", type: "container", props: {}, children }] }] };
      const r = await boss.request(`/marketing/pages/${pid}/brouillon`, { method: "PUT", json: { revision: rev, content }, headers: { Origin: srv.base } });
      assert.equal(r.status, 200, r.text.slice(0, 400));
      if (publish) assert.equal((await boss.request(`/marketing/pages/${pid}/publier.json`, { method: "POST", json: {}, headers: { Origin: srv.base } })).status, 200);
      return pid;
    };
    const pub = await mk("MS lot t public", CHILDREN(), true);
    slug = db.prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(pub).slug;
    editId = await mk("MS lot t éditeur", [], false);
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
  });
  after(async () => { if (browser) await browser.close(); if (srv) await srv.stop(); });

  const open = async (opts = {}, { js = true } = {}) => {
    const ctx = await browser.newContext({ viewport: { width: 1200, height: 800 }, javaScriptEnabled: js, ...opts });
    const page = await ctx.newPage(); const errs = [];
    page.on("pageerror", (e) => errs.push(e.message));
    page.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
    await page.goto(`${srv.base}/p/${slug}`, { waitUntil: "load" });
    return { page, ctx, errs };
  };
  const sel = (k) => `.kw-n-${IDS[k]}`;
  const state = (page, k) => page.getAttribute(sel(k), "data-kw-ms-state");
  const ready = (page, k) => page.waitForFunction((s) => { const e = document.querySelector(s); return e && e.getAttribute("data-kw-ms-state"); }, sel(k), { timeout: 15000 });
  const readyAll = async (page, keys = ["heading", "reveal", "kinetic", "typewriter", "rotating", "gradient", "mask", "scramble", "ticker", "marquee", "circular", "cascade"]) => { for (const k of keys) await ready(page, k); };
  const noOverflow = (page) => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1);
  const text = (page, s) => page.evaluate((s) => document.querySelector(s).textContent.replace(/\s+/g, " ").trim(), s);

  test("page publiée : feuille, runtime et modules chargés ; les 12 composants démarrent sans erreur", async () => {
    const reqs = []; const { page, errs, ctx } = await (async () => { const c = await browser.newContext({ viewport: { width: 1200, height: 800 } }); const p = await c.newPage(); const er = []; p.on("pageerror", (e) => er.push(e.message)); p.on("request", (r) => reqs.push(r.url())); await p.goto(`${srv.base}/p/${slug}`, { waitUntil: "load" }); return { page: p, errs: er, ctx: c }; })();
    await readyAll(page);
    for (const m of ["text-fx", "kinetic", "cascade", "marquee-velocity", "split-text"]) assert.ok(reqs.some((u) => new RegExp(`/js/motion-studio/${m}\\.js\\?v=`).test(u)), `module ${m}`);
    assert.ok(reqs.some((u) => /\/css\/motion-studio\.css\?v=/.test(u)));
    for (const k of ["heading", "reveal", "kinetic", "typewriter", "rotating", "gradient", "mask", "scramble", "ticker", "marquee", "circular", "cascade"]) assert.equal(await state(page, k), "ready", k);
    assert.deepEqual(errs, []); await ctx.close();
  });

  test("texte complet accessible : chaque composant garde son texte lisible par les lecteurs d'écran pendant l'animation", async () => {
    const { page, errs, ctx } = await open(); await readyAll(page);
    const sr = (k) => page.evaluate((s) => { const e = document.querySelector(s); const copy = e.querySelector(".kw-ms-sr"); return copy ? copy.textContent : e.textContent; }, sel(k));
    assert.equal(await sr("typewriter"), "Nous créons des sites, des boutiques");
    assert.equal(await sr("rotating"), "Pour enseigner, vendre, grandir mieux");
    assert.equal(await sr("scramble"), "Décodez votre message");
    assert.equal(await sr("ticker"), "1 250+");
    assert.equal(await page.getAttribute(`${sel("typewriter")} .kw-ms-tpw-vis`, "aria-hidden"), "true");
    assert.equal(await page.getAttribute(`${sel("circular")} svg`, "aria-label"), "Créer · Animer · Publier ·");
    assert.match(await text(page, sel("heading")), /Créez des pages inoubliables vite/);
    assert.match(await text(page, sel("kinetic")), /Le mouvement donne du caractère/);
    assert.deepEqual(errs, []); await ctx.close();
  });

  test("machine à écrire : le texte s'écrit lettre par lettre, s'efface, passe à la phrase suivante ; le bouton Pause fige la boucle", async () => {
    const { page, errs, ctx } = await open(); await ready(page, "typewriter");
    const typed = () => page.evaluate((s) => { const e = document.querySelector(s + " .kw-ms-tbox-live"); return e ? e.textContent : null; }, sel("typewriter"));
    const seen = new Set();
    await until(async () => { seen.add(await typed()); return [...seen].some((t) => t === "des sites") && [...seen].some((t) => /^des b/.test(t) && t.length < 13 && t.length > 5); }, "écriture puis phrase suivante", 14000);
    assert.ok([...seen].some((t) => t.length > 0 && t.length < "des sites".length), "lettres intermédiaires observées");
    assert.ok(await page.locator(`${sel("typewriter")} .kw-ms-tcursor`).count() === 1, "curseur");
    // pause : le texte ne change plus
    const btn = page.locator(".kw-ms-tpause").first();
    await btn.scrollIntoViewIfNeeded(); assert.equal(await btn.getAttribute("aria-pressed"), "false");
    await btn.click(); assert.equal(await btn.getAttribute("aria-pressed"), "true");
    const a = await typed(); await wait(900); assert.equal(await typed(), a, "texte figé pendant la pause");
    await btn.click(); await until(async () => (await typed()) !== a, "reprise après la pause", 6000);
    assert.deepEqual(errs, []); await ctx.close();
  });

  test("texte rotatif : un seul mot visible à la fois, les mots se succèdent, la place du mot ne bouge pas", async () => {
    const { page, errs, ctx } = await open(); await ready(page, "rotating");
    const heights = new Set(), shown = new Set();
    const sample = () => page.evaluate((s) => { const e = document.querySelector(s); const ws = [...e.querySelectorAll(".kw-ms-rot-w")].map((w) => +getComputedStyle(w).opacity); return { ws, h: Math.round(e.getBoundingClientRect().height) }; }, sel("rotating"));
    await until(async () => { const { ws, h } = await sample(); heights.add(h); const max = Math.max(...ws), sum = ws.reduce((a, b) => a + b, 0); assert.ok(sum <= 1.15, `opacités ${ws}`); if (max > 0.95) shown.add(ws.indexOf(max)); return shown.size === 3; }, "les trois mots ont été affichés", 14000);
    assert.equal(heights.size, 1, `hauteur stable ${[...heights]}`);
    assert.equal(await page.locator(".kw-ms-tpause").count() >= 2, true, "boutons pause (boucles sans fin)");
    assert.deepEqual(errs, []); await ctx.close();
  });

  test("compteur : monte réellement jusqu'à la valeur finale, chiffres à largeur fixe, mise en forme française", async () => {
    const { page, errs, ctx } = await open(); await ready(page, "ticker");
    const val = () => text(page, `${sel("ticker")} .kw-ms-tbox-live`);
    const seen = []; await until(async () => { const v = await val(); if (seen[seen.length - 1] !== v) seen.push(v); return v === "1 250+"; }, "valeur finale", 8000);
    assert.ok(seen.length >= 4, `valeurs intermédiaires : ${seen.join(" | ")}`);
    const nums = seen.map((s) => parseInt(s.replace(/\D/g, ""), 10)); for (let i = 1; i < nums.length; i++) assert.ok(nums[i] >= nums[i - 1], "croissant");
    assert.equal(await page.evaluate((s) => getComputedStyle(document.querySelector(s + " .kw-ms-tick-num")).fontVariantNumeric, sel("ticker")), "tabular-nums");
    assert.equal(await page.locator(`${sel("ticker")} .kw-ms-tpause`).count() + (await page.locator(".kw-ms-tpause").count() > 0 ? 0 : 0), 0);
    assert.deepEqual(errs, []); await ctx.close();
  });

  test("brouillage : lettres au hasard puis texte final, espaces conservés ; clic : contenu visible avant, joué au clic", async () => {
    const { page, errs, ctx } = await open(); await ready(page, "scramble");
    const live = () => text(page, `${sel("scramble")} .kw-ms-tbox-live`);
    const seen = new Set(); await until(async () => { const v = await live(); seen.add(v); return v === "Décodez votre message"; }, "texte final", 8000);
    const mids = [...seen].filter((v) => v !== "Décodez votre message");
    assert.ok(mids.length >= 3, `états intermédiaires ${mids.length}`);
    for (const m of mids) { assert.equal(m.length, "Décodez votre message".length); assert.equal(m[7], " "); }
    await ready(page, "clickType");
    await page.locator(sel("clickType")).scrollIntoViewIfNeeded();
    assert.equal(await text(page, `${sel("clickType")} .kw-ms-tbox-live`), "Survolez ou cliquez", "visible avant le clic");
    await page.locator(sel("clickType")).click();
    await until(async () => (await text(page, `${sel("clickType")} .kw-ms-tbox-live`)) !== "Survolez ou cliquez", "brouillage au clic", 3000);
    await until(async () => (await text(page, `${sel("clickType")} .kw-ms-tbox-live`)) === "Survolez ou cliquez", "retour au texte", 6000);
    assert.deepEqual(errs, []); await ctx.close();
  });

  test("dégradé, masque, cercle, titre souligné, révélation, cinétique : l'animation tourne réellement et finit sur l'état final", async () => {
    const { page, errs, ctx } = await open(); await readyAll(page);
    // dégradé : la position du fond change, le fond est découpé dans le texte
    const pos = () => page.evaluate((s) => getComputedStyle(document.querySelector(s + " .kw-ms-grad-text")).backgroundPositionX, sel("gradient"));
    const p1 = await pos(); await wait(500); assert.notEqual(await pos(), p1, "le dégradé coule");
    assert.equal(await page.evaluate((s) => getComputedStyle(document.querySelector(s + " .kw-ms-grad-text")).webkitBackgroundClip, sel("gradient")), "text");
    // cercle : la rotation change
    const rot = () => page.evaluate((s) => getComputedStyle(document.querySelector(s + " .kw-ms-circ-spin")).transform, sel("circular"));
    const r1 = await rot(); await wait(400); assert.notEqual(await rot(), r1, "le cercle tourne");
    assert.ok(await page.locator(`${sel("circular")} textPath`).count() === 1);
    // masque : balayage jusqu'à l'état final plein
    await until(() => page.evaluate((s) => getComputedStyle(document.querySelector(s + " .kw-ms-tmask-text")).clipPath, sel("mask")).then((c) => c === "inset(0px)" || c === "none" || c === "inset(0px 0px 0px 0px)"), "balayage terminé", 8000);
    assert.equal(await page.locator(`${sel("mask")} .kw-ms-tmask-out`).count(), 1, "contour sous le remplissage");
    // titre : tracé dessiné jusqu'au bout
    await until(() => page.evaluate((s) => { const d = document.querySelector(s + " .kw-ms-ahd-deco"); const c = getComputedStyle(d).clipPath; return c === "none" || /inset\(0(px)?( 0(px)?){0,3}\)/.test(c); }, sel("heading")), "tracé terminé", 8000);
    // révélation par lettres et cinétique : état final lisible (opacité 1, pas de transformation)
    for (const k of ["reveal", "kinetic"]) await until(() => page.evaluate((s) => [...document.querySelectorAll(s + " .kw-ms-u, " + s + " .kw-ms-kin-line")].every((u) => getComputedStyle(u).opacity === "1" && ["none", "matrix(1, 0, 0, 1, 0, 0)"].includes(getComputedStyle(u).transform)), sel(k)), `${k} terminé`, 9000);
    assert.ok(await page.locator(`${sel("reveal")} .kw-ms-u`).count() === "Révélation lettre par lettre".replace(/ /g, "").length, "une unité par lettre");
    assert.equal(await page.evaluate((s) => getComputedStyle(document.querySelector(s)).overflowX, sel("kinetic")), "clip");
    assert.deepEqual(errs, []); await ctx.close();
  });

  test("liste animée : cascade réelle (décalage entre éléments), tout visible à la fin ; déclencheur « quand visible » : le bas attend", async () => {
    const { page, errs, ctx } = await open(); await ready(page, "cascade"); await ready(page, "cascadeLow");
    const ops = () => page.evaluate((s) => [...document.querySelectorAll(s + " .kw-ms-casc-item")].map((i) => +getComputedStyle(i).opacity), sel("cascade"));
    let mixed = false; await until(async () => { const o = await ops(); if (o[0] > 0.6 && o[3] < 0.4) mixed = true; return o.every((v) => v === 1); }, "cascade terminée", 8000);
    assert.ok(mixed, "premier élément déjà affiché pendant que le dernier attend");
    const low = () => page.evaluate((s) => [...document.querySelectorAll(s + " .kw-ms-casc-item")].map((i) => +getComputedStyle(i).opacity), sel("cascadeLow"));
    assert.deepEqual(await low(), [0, 0, 0], "hors écran : état de départ tenu");
    await page.locator(sel("cascadeLow")).scrollIntoViewIfNeeded();
    await until(async () => (await low()).every((v) => v === 1), "révélation à l'arrivée à l'écran", 8000);
    assert.equal(await page.locator(`${sel("cascade")} a.kw-ms-casc-link`).count(), 1, "titre en lien");
    assert.deepEqual(errs, []); await ctx.close();
  });

  test("défilement : la dérive du texte cinétique suit la position de la page", async () => {
    const { page, errs, ctx } = await open(); await ready(page, "kineticScroll");
    const t = () => page.evaluate((s) => Math.round(document.querySelector(s + " .kw-ms-kin-line").getAnimations()[0].currentTime), sel("kineticScroll"));
    await page.evaluate(() => window.scrollTo(0, 0)); await wait(200); const t0 = await t();
    await page.locator(sel("kineticScroll")).scrollIntoViewIfNeeded(); await page.mouse.wheel(0, 150); await wait(400);
    assert.notEqual(await t(), t0, `progression ${t0} -> ${await t()}`);
    assert.deepEqual(errs, []); await ctx.close();
  });

  test("bande liée au défilement : avance seule, accélère quand la page défile, pause par bouton", async () => {
    const { page, errs, ctx } = await open(); await ready(page, "marquee");
    await page.locator(sel("marquee")).scrollIntoViewIfNeeded(); await page.evaluate(() => window.scrollTo(0, 0)); await wait(300);
    const x = () => page.evaluate((s) => { const t = document.querySelector(s + " .kw-ms-mvel-track"); return new DOMMatrixReadOnly(getComputedStyle(t).transform).m41; }, sel("marquee"));
    // la bande est hors écran en haut de page ? on la place dans la fenêtre
    await page.evaluate((s) => document.querySelector(s).scrollIntoView({ block: "center" }), sel("marquee")); await wait(500);
    const dist = async (ms) => { let last = await x(), total = 0; const end = Date.now() + ms; while (Date.now() < end) { await wait(50); const v = await x(); const d = Math.abs(v - last); if (d < 500) total += d; last = v; } return total / (ms / 1000); };
    const slow = await dist(1200);
    assert.ok(slow > 25 && slow < 140, `vitesse de base ${Math.round(slow)} px/s`);
    const scrolling = (async () => { for (let i = 0; i < 18; i++) { await page.mouse.wheel(0, i % 2 ? 90 : -90); await wait(40); } })();
    const fast = await dist(1000); await scrolling;
    assert.ok(fast > slow * 1.4, `plus rapide pendant le défilement : ${Math.round(slow)} -> ${Math.round(fast)} px/s`);
    // plusieurs copies, une seule liste lisible
    assert.ok(await page.locator(`${sel("marquee")} .kw-ms-mvel-group`).count() >= 2);
    assert.equal(await page.locator(`${sel("marquee")} .kw-ms-mvel-group[aria-hidden="true"]`).count(), (await page.locator(`${sel("marquee")} .kw-ms-mvel-group`).count()) - 1);
    const btn = page.locator(".kw-ms-tpause", { hasText: "défilement" });
    await btn.click(); await wait(400); const f1 = await x(); await wait(600); assert.equal(await x(), f1, "bande figée");
    await btn.click(); await wait(500); assert.notEqual(await x(), f1, "bande relancée");
    assert.deepEqual(errs, []); await ctx.close();
  });

  test("écran coupé : texte intact sur mobile puis animé en revenant sur ordinateur ; 320 / 768 / 1920 sans débordement", async () => {
    const { page, errs, ctx } = await open({ viewport: { width: 1200, height: 800 } }); await ready(page, "offMobile");
    assert.equal(await state(page, "offMobile"), "ready");
    for (const w of [320, 768, 1920]) { await page.setViewportSize({ width: w, height: 800 }); await wait(700); assert.ok(await noOverflow(page), `débordement à ${w}px`); }
    await page.setViewportSize({ width: 375, height: 800 }); await wait(500);
    assert.equal(await state(page, "offMobile"), "off");
    assert.equal(await text(page, sel("offMobile")), "Coupé sur mobile");
    assert.equal(await page.locator(`${sel("offMobile")} .kw-ms-tbox`).count(), 0);
    await page.setViewportSize({ width: 1200, height: 800 }); await wait(500);
    assert.equal(await state(page, "offMobile"), "ready");
    assert.deepEqual(errs, []); await ctx.close();
  });

  test("320 px dès le chargement (animations en cours) : aucun défilement horizontal, y compris texte cinétique et lignes longues", async () => {
    const { page, errs, ctx } = await open({ viewport: { width: 320, height: 700 } });
    for (let i = 0; i < 6; i++) { assert.ok(await noOverflow(page), `débordement ${i}`); await wait(250); }
    await readyAll(page); await wait(1500); assert.ok(await noOverflow(page));
    assert.deepEqual(errs, []); await ctx.close();
  });

  test("mouvement réduit : aucun mouvement ni découpage, textes intacts, pas de bouton Pause, bande en liste", async () => {
    const { page, errs, ctx } = await open({ reducedMotion: "reduce" }); await readyAll(page);
    for (const k of ["typewriter", "rotating", "gradient", "mask", "scramble", "ticker", "circular", "cascade", "kinetic", "heading", "marquee"]) assert.equal(await state(page, k), "reduced", k);
    assert.equal(await text(page, sel("typewriter")), "Nous créons des sites , des boutiques");
    assert.equal(await page.locator(`${sel("typewriter")} .kw-ms-tpw-vis`).count(), 0, "pas de version animée");
    assert.equal(await text(page, sel("ticker")), "1 250+ clients");
    assert.equal(await text(page, sel("scramble")), "Décodez votre message");
    assert.equal(await page.locator(`${sel("marquee")} .kw-ms-mvel-track`).count(), 0, "bande immobile");
    assert.equal(await page.locator(".kw-ms-tpause").count(), 0, "rien ne bouge : pas de bouton Pause");
    assert.equal(await page.evaluate(() => document.getAnimations().filter((a) => !(a.effect.target && a.effect.target.closest(".kw-ms-tcursor"))).length), 0, "aucune animation");
    assert.equal(await page.locator(`${sel("rotating")} .kw-ms-rot-live`).count(), 0);
    const rot = await page.evaluate((s) => [...document.querySelectorAll(s + " .kw-ms-rot-w")].map((w) => { const st = getComputedStyle(w); return [st.position, st.width]; }), sel("rotating"));
    assert.equal(rot.length, 3);
    assert.equal(await page.locator(`${sel("cascade")} .kw-ms-casc-item`).evaluateAll((l) => l.every((i) => getComputedStyle(i).opacity === "1")), true);
    assert.deepEqual(errs, []); await ctx.close();
  });

  test("sans JavaScript : tous les textes sont affichés, visibles et lisibles ; fond découpé conservé ; aucun débordement", async () => {
    const { page, ctx } = await open({ viewport: { width: 320, height: 700 } }, { js: false });
    const vis = (s) => page.evaluate((s) => { const e = document.querySelector(s); const st = getComputedStyle(e); return { t: e.textContent.replace(/\s+/g, " ").trim(), op: st.opacity, v: st.visibility, d: st.display }; }, s);
    assert.match((await vis(sel("typewriter"))).t, /^Nous créons des sites/);
    assert.equal((await vis(sel("rotating"))).t, "Pour enseigner vendre grandir mieux");
    assert.equal((await vis(sel("ticker"))).t, "1 250+clients");
    assert.equal((await vis(sel("scramble"))).t.startsWith("Décodez votre message"), true);
    assert.equal((await vis(sel("mask"))).t, "ÉNERGIE");
    assert.equal((await vis(sel("gradient"))).t, "Un texte plein de couleurs");
    assert.match((await vis(sel("heading"))).t, /Créez des pages inoubliables vite/);
    assert.match((await vis(sel("cascade"))).t, /Simple Un Rapide Deux Souple Trois Clair Quatre/);
    assert.match((await vis(sel("marquee"))).t, /Formations/);
    for (const k of ["typewriter", "rotating", "ticker", "mask", "gradient", "heading", "kinetic", "cascade", "marquee", "circular"]) { const v = await vis(sel(k)); assert.deepEqual([v.op, v.v], ["1", "visible"], k); }
    // seul le premier mot du texte rotatif est affiché, les autres sont retirés de l'affichage sans l'être des lecteurs d'écran
    const w = await page.evaluate((s) => [...document.querySelectorAll(s + " .kw-ms-rot-w")].map((e) => { const r = e.getBoundingClientRect(); return r.width <= 1 && r.height <= 1; }), sel("rotating"));
    assert.deepEqual(w, [false, true, true]);
    assert.ok(await noOverflow(page));
    await ctx.close();
  });

  // ---------------------------------------------------------------- éditeur
  test("éditeur : les 12 composants s'insèrent depuis la bibliothèque, le canevas les rend, les listes et réglages sont éditables, annulables et enregistrés", { timeout: 600000 }, async () => {
    const LABELS = { motionanimatedheading: "Titre à mot souligné", motionrevealtext: "Révélation de texte", motionkinetictext: "Texte cinétique", motiontypewriter: "Machine à écrire", motionrotatingtext: "Texte rotatif", motiongradienttext: "Texte dégradé animé", motiontextmask: "Texte masqué par image", motiontextscramble: "Brouillage de texte", motionnumberticker: "Compteur animé", motionmarqueevelocity: "Bande liée au défilement", motioncirculartext: "Texte circulaire", motioncascade: "Liste ou grille animée" };
    const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
    await ctx.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    const page = await ctx.newPage(); const errs = [];
    page.on("pageerror", (e) => errs.push(e.message));
    await page.goto(`${srv.base}/marketing/pages/${editId}/editeur`);
    await page.waitForFunction(() => { const f = document.querySelector("[data-pb-frame]"); return f && f.contentDocument && f.contentDocument.body && f.contentDocument.body.classList.contains("lp-builder") && window.__pb; }, null, { timeout: 60000 });
    await wait(800);
    const doc = () => page.evaluate(() => window.__pb.content());
    const flat = (c) => { const o = []; const w = (l) => (l || []).forEach((n) => { o.push(n); w(n.children); }); w(c.sections); return o; };
    const settle = () => page.waitForFunction(() => !window.__pb.dirty(), null, { timeout: 40000 });
    const ofType = async (type) => flat(await doc()).filter((n) => n.type === type);
    const frameEval = (fn, arg) => page.evaluate(([src, a]) => { const f = document.querySelector("[data-pb-frame]"); return new f.contentWindow.Function("a", "return (" + src + ")(a)")(a); }, [fn.toString(), arg]);

    // 1. insertion des 12 composants par la bibliothèque (recherche par nom)
    await page.evaluate(() => { const b = document.querySelector("#pb-tab-elements"); if (b) b.click(); });
    for (const [type, label] of Object.entries(LABELS)) {
      await page.locator("[data-pb-el-search]").fill(label); await wait(150);
      await page.locator(`.pb-pal-item[data-widget="${type}"]`).first().click({ timeout: 10000 }); await wait(250);
      assert.equal((await ofType(type)).length, 1, `${type} inséré`);
      await settle();
    }
    const c = await doc();
    assert.equal(flat(c).filter((n) => n.type.startsWith("motion")).length, 12);
    const NID = {}; for (const type of Object.keys(LABELS)) NID[type] = (await ofType(type))[0].id;

    // 2. le canevas rend les 12 : démarrés (mode éditeur), état final visible, contenu complet
    await until(() => frameEval((ids) => Object.values(ids).every((i) => { const e = document.querySelector('[data-node-id="' + i + '"]'); return e && e.getAttribute("data-kw-ms-state") === "ready"; }), NID).catch(() => false), "12 composants initialisés dans le canevas", 40000).catch(async () => {
      const st = await frameEval((ids) => Object.entries(ids).map(([t, i]) => { const e = document.querySelector('[data-node-id="' + i + '"]'); return t + ":" + (e && e.getAttribute("data-kw-ms-state")); }), NID); throw new Error("états : " + st.join(" "));
    });
    const cv = (type, selector) => frameEval(([i, s]) => { const e = document.querySelector('[data-node-id="' + i + '"]'); const t = s ? e.querySelector(s) : e; return t ? t.textContent.replace(/\s+/g, " ").trim() : null; }, [NID[type], selector]);
    assert.equal(await cv("motiontypewriter", ".kw-ms-tbox-live"), "des sites", "machine à écrire : phrase complète au repos");
    assert.equal(await cv("motionnumberticker", ".kw-ms-tbox-live"), "1 250+", "compteur : valeur finale au repos");
    assert.equal(await cv("motiontextscramble", ".kw-ms-tbox-live"), "Décodez votre message");
    assert.equal(await frameEval((i) => document.querySelector('[data-node-id="' + i + '"]').getAnimations({ subtree: true }).filter((a) => a.playState === "running").length, NID.motionrotatingtext), 0, "rien ne tourne tout seul dans l'éditeur");
    assert.match(await cv("motioncirculartext", "textPath"), /Créer/);
    assert.equal(await frameEval((i) => document.querySelectorAll('[data-node-id="' + i + '"] .kw-ms-casc-item').length, NID.motioncascade), 3);

    // 3. sélection : le panneau a six sections ; liste de phrases (ajouter, dupliquer, réordonner, supprimer) rendue dans le canevas
    const select = async (type) => { await page.locator(`[data-pb-layers] .pb-node[data-id="${NID[type]}"] > .pb-row-item`).first().click(); await wait(350); };
    await select("motiontypewriter");
    const titles = await page.locator("[data-pb-inspector] .pb-acc-title").allTextContents();
    for (const t of ["Contenu", "Style", "Animation", "Interactions", "Responsive", "Avancé"]) assert.ok(titles.includes(t), `section ${t} : ${titles.join("|")}`);
    const phrases = async () => (await ofType("motiontypewriter"))[0].props.phrases.map((p) => p.text);
    assert.deepEqual(await phrases(), ["des sites rapides", "des boutiques claires", "des formations vivantes"]);
    const list = page.locator('[data-pb-inspector] .pb-items[aria-label="Phrases qui s\'écrivent"]');
    await list.getByRole("button", { name: "Ajouter un élément" }).click(); await wait(300);
    assert.equal((await phrases()).length, 4);
    await list.getByRole("button", { name: "Dupliquer l'élément 1" }).click(); await wait(300);
    assert.deepEqual((await phrases()).slice(0, 2), ["des sites rapides", "des sites rapides"]);
    await list.getByRole("button", { name: "Descendre l'élément 1" }).click(); await wait(300);
    await list.getByRole("button", { name: "Supprimer l'élément 2" }).click(); await wait(300);
    assert.equal((await phrases()).length, 4);
    // édition du texte d'une phrase : le canevas se met à jour
    await list.locator(".pb-items-item").nth(0).locator("input").first().fill("des histoires"); await wait(700);
    assert.equal((await phrases())[0], "des histoires");
    await until(async () => (await frameEval((i) => { const e = document.querySelector('[data-node-id="' + i + '"] .kw-ms-sr'); return e && e.textContent; }, NID.motiontypewriter)) === "Nous créons des histoires, des boutiques claires, des formations vivantes, " + (await phrases())[3], "texte de la liste dans le canevas", 12000).catch(() => { throw new Error("canevas : " + "phrases non reportées"); });
    // lecture dans le canevas : le texte s'écrit réellement, arrêt = phrase complète
    await page.locator('[data-pb-inspector] [data-ms-act="play"]').click({ force: true });
    const live = () => cv("motiontypewriter", ".kw-ms-tbox-live");
    const seen = new Set(); await until(async () => { seen.add(await live()); return [...seen].some((t) => t && t.length > 0 && t.length < "des histoires".length); }, "écriture dans le canevas", 8000);
    await page.locator('[data-pb-inspector] [data-ms-act="stop"]').click({ force: true }); await wait(300);
    assert.equal(await live(), "des histoires");
    // réglage propre au composant : curseur ; annulation
    const cur = page.locator('[data-pb-inspector] .pb-field:has(> label:text-is("Curseur")) select');
    await cur.selectOption("block"); await wait(400);
    assert.equal((await ofType("motiontypewriter"))[0].props.cursor, "block");
    assert.ok(await frameEval((i) => document.querySelector('[data-node-id="' + i + '"]').classList.contains("is-cursor-block"), NID.motiontypewriter), "curseur « bloc » rendu");
    await page.evaluate(() => { const b = [...document.querySelectorAll("button")].find((x) => /Annuler/.test(x.getAttribute("data-tip") || "") && !x.disabled); if (b) b.click(); }); await wait(500);
    assert.equal((await ofType("motiontypewriter"))[0].props.cursor, "bar", "annulé");

    // 4. déclencheur et paramètre du panneau Motion Studio : enregistrés dans motion.studio
    await page.evaluate(() => { const d = [...document.querySelectorAll("[data-pb-inspector] details")].find((x) => /Interactions/.test(x.textContent)); if (d) d.open = true; });
    await page.locator('[data-pb-inspector] .pb-field:has(> label:text-is("Déclencheur")) select').selectOption("load"); await wait(400);
    assert.equal((await ofType("motiontypewriter"))[0].motion.studio.trigger, "load");

    // 5. compteur : valeur d'arrivée et séparateur, rendu final dans le canevas
    await select("motionnumberticker");
    const to = page.locator('[data-pb-inspector] .pb-field:has(label:text-is("Valeur d\'arrivée")) input').first();
    await to.fill("98765"); await to.press("Enter"); await wait(900);
    assert.equal((await ofType("motionnumberticker"))[0].props.to, 98765);
    await until(async () => (await cv("motionnumberticker", ".kw-ms-tbox-live")) === "98 765+", "valeur du compteur dans le canevas", 12000);
    await page.locator('[data-pb-inspector] .pb-field:has(> label:text-is("Séparateur des milliers")) select').selectOption("dot"); await wait(900);
    await until(async () => (await cv("motionnumberticker", ".kw-ms-tbox-live")) === "98.765+", "séparateur dans le canevas", 12000);

    // 6. cascade : un élément de plus apparaît dans le canevas ; effet choisi enregistré
    await select("motioncascade");
    await page.locator('[data-pb-inspector] .pb-items[aria-label="Éléments"]').getByRole("button", { name: "Ajouter un élément" }).click(); await wait(900);
    await until(async () => (await frameEval((i) => document.querySelectorAll('[data-node-id="' + i + '"] .kw-ms-casc-item').length, NID.motioncascade)) === 4, "4e élément dans le canevas", 12000);
    await page.locator('[data-pb-inspector] .pb-field:has(> label:text-is("Effet")) select').selectOption("flip"); await wait(500);
    assert.equal((await ofType("motioncascade"))[0].motion.studio.preset, "flip");

    // 7. bande liée au défilement : pas de bouton Lire (rien à lire), réglage de vitesse présent
    await select("motionmarqueevelocity");
    assert.equal(await page.locator('[data-pb-inspector] [data-ms-act="play"]').count(), 0, "pas de lecture pour un composant continu");
    assert.ok(await page.locator('[data-pb-inspector] label', { hasText: "Vitesse de base" }).count() >= 1);

    // 8. enregistrement serveur : tout est rechargé identique
    await settle();
    const saved = JSON.parse(db.prepare("SELECT draft FROM mk_landing_pages WHERE id = ?").get(editId).draft);
    const sf = flat(saved); assert.equal(sf.filter((n) => n.type.startsWith("motion")).length, 12);
    assert.equal(sf.find((n) => n.type === "motionnumberticker").props.to, 98765);
    assert.equal(sf.find((n) => n.type === "motioncascade").props.items.length, 4);
    assert.deepEqual(errs, []); await ctx.close();
  });
});
