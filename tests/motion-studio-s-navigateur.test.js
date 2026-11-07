// Motion Studio, lot S (storytelling et sections), dans un VRAI Chrome : page publiée (rendu, animations réellement exécutées, défilement, clavier, mouvement réduit,
// sans JavaScript, 320 / 768 / 1920 sans débordement) puis éditeur (insertion des 12 composants depuis la bibliothèque, liste d'éléments, réglages, aperçu).
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
const IMG = (i) => `/themes-art/formation-en-ligne/wide-${i}.svg`;

describe("Motion Studio lot S : storytelling et sections (Chrome réel)", { skip: SKIP }, () => {
  let srv, boss, db, browser, editId;
  const slugs = {};
  const w = (type, id, props = {}, studio) => ({ id, type, props, ...(studio ? { motion: { studio } } : {}) });
  const spacer = (id, size = "128") => ({ id, type: "spacer", props: { size } });
  const spacers = (prefix, n) => Array.from({ length: n }, (_, i) => spacer(`${prefix}${String(i).padStart(12 - prefix.length, "0")}`));
  const until = async (fn, what, ms = 15000) => { const end = Date.now() + ms; for (;;) { let v = false; try { v = await fn(); } catch { /* on réessaie */ } if (v) return v; if (Date.now() > end) throw new Error(`Délai dépassé : ${what}`); await wait(100); } };
  const sel = (id) => `.kw-n-${id}`;

  before(async () => { try {
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
    const pub = async (key, children) => { const id = await mk(`MS-S ${key}`, children, true); slugs[key] = db.prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(id).slug; };
    const after2 = [spacer("tail00000001", "400")];
    await pub("hero", [w("motionhero", "mshero000001", { eyebrow: "Nouveau", title: "Bienvenue chez nous", subtitle: "Un sous-titre clair.", buttons: [{ label: "Commencer", url: "/", style: "primary" }, { label: "Voir", url: "/x", style: "outline" }], image: IMG(1), imageAlt: "Illustration", layout: "split-right", height: "tall", bg: "aurora", bgSpeed: "slow" }),
      w("motionhero", "mshero000002", { title: "Fond dégradé", bg: "gradient", image: "", layout: "centered", height: "auto", eyebrow: "", subtitle: "" }, { v: 1, trigger: "load", preset: "blur" })]);
    await pub("stack", [spacer("pre000000001", "128"), w("motioncardstack", "msstack00001", { height: 55, cards: [
      { kicker: "Un", title: "Carte un", text: "Texte un", image: IMG(1), buttonLabel: "Go", buttonUrl: "/go", tone: "surface" },
      { kicker: "Deux", title: "Carte deux", text: "Texte deux", image: "", buttonLabel: "", buttonUrl: "", tone: "accent" },
      { kicker: "Trois", title: "Carte trois", text: "Texte trois", image: "", buttonLabel: "", buttonUrl: "", tone: "dark" }] }), ...after2, ...spacers("stk", 8)]);
    await pub("story", [spacer("pre000000001", "128"), w("motionstickystory", "msstory00001", { side: "right", steps: [
      { kicker: "A", title: "Étape un", text: "Texte un", image: IMG(1), imageAlt: "Vue un" }, { kicker: "B", title: "Étape deux", text: "Texte deux", image: IMG(2), imageAlt: "Vue deux" }, { kicker: "C", title: "Étape trois", text: "Texte trois", image: "", imageAlt: "" }] }), ...after2]);
    await pub("pin", [spacer("pre000000001", "128"), w("motionpinscenes", "mspin0000001", { label: "Scènes", scenes: [
      { title: "Scène un", text: "Un", image: IMG(1), imageAlt: "" }, { title: "Scène deux", text: "Deux", image: "", imageAlt: "" }, { title: "Scène trois", text: "Trois", image: IMG(3), imageAlt: "" }] }), ...after2, ...spacers("pn", 4)]);
    await pub("hg", [spacer("pre000000001", "128"), w("motionhgallery", "mshg00000001", { label: "Galerie", items: [
      { image: IMG(1), imageAlt: "Un", title: "Un", caption: "c", url: "" }, { image: IMG(2), imageAlt: "Deux", title: "Deux", caption: "", url: "" },
      { image: "", imageAlt: "", title: "Trois", caption: "", url: "" }, { image: IMG(3), imageAlt: "Quatre", title: "Quatre", caption: "fin", url: "/quatre" }] }), ...after2, ...spacers("hg", 4)]);
    await pub("seq", [...spacers("sp", 20), w("motionscrollseq", "msseq0000001", { label: "Produit en 4 images", title: "Le produit", caption: "Faites défiler", frames: [{ image: IMG(1) }, { image: IMG(2) }, { image: IMG(3) }, { image: IMG(4) }] }, { v: 1, params: { length: 200 } }), ...after2, ...spacers("sq", 6)]);
    await pub("tl", [spacer("pre000000001", "400"), w("motiontimeline", "mstl00000001", { layout: "left", items: Array.from({ length: 5 }, (_, i) => ({ date: `20${20 + i}`, title: `Étape ${i + 1}`, text: "Un texte assez long pour occuper de la hauteur sur plusieurs lignes dans la chronologie animée, afin que les étapes basses restent sous la ligne de flottaison au chargement." })) }), ...after2, ...spacers("tl", 4)]);
    await pub("pr", [w("motionprocess", "mspr00000001", { layout: "row", items: [{ title: "Contact", text: "On se parle" }, { title: "Étude", text: "On prépare" }, { title: "Livraison", text: "On livre" }, { title: "Suivi", text: "" }] }),
      w("motionprocess", "mspr00000002", { layout: "column", items: [{ title: "Un", text: "a" }, { title: "Deux", text: "b" }] }, { v: 1, trigger: "load" })]);
    await pub("menu", [w("motionfsmenu", "msmenu000001", { label: "Navigation", links: [{ label: "Accueil", url: "/" }, { label: "Formations", url: "/catalogue" }, { label: "Fin de page", url: "#fin" }, { label: "Contact", url: "/contact" }] }),
      w("motionfsmenu", "msmenu000002", { links: [{ label: "A", url: "/" }, { label: "B", url: "/b" }], align: "center" }, { v: 1, preset: "circle", stagger: 40 }), spacer("fin000000001", "300")]);
    await pub("ts", [w("motiontestimonials", "msts00000001", { label: "Avis", items: [{ quote: "Premier avis", name: "Ana", role: "CEO", photo: "", stars: 5 }, { quote: "Deuxième avis", name: "Bob", role: "", photo: "", stars: 0 }, { quote: "Troisième avis", name: "Cléo", role: "", photo: "", stars: 3 }] }),
      w("motiontestimonials", "msts00000002", { label: "Avis auto", items: [{ quote: "Auto un", name: "Dan", role: "", photo: "", stars: 0 }, { quote: "Auto deux", name: "Eve", role: "", photo: "", stars: 0 }] }, { v: 1, preset: "fade", params: { autoplay: true, interval: 3 } })]);
    await pub("logo", [w("motionlogomarquee", "mslogo000001", { label: "Clients", logos: [{ name: "Alpha", image: IMG(1), url: "/alpha" }, { name: "Beta", image: IMG(2), url: "" }, { name: "Gamma", image: "", url: "" }, { name: "Delta", image: IMG(3), url: "" }] }, { v: 1, params: { speed: 80 } })]);
    await pub("pf", [w("motionportfolio", "mspf00000001", { label: "Projets", items: [
      { title: "Site A", category: "Web", description: "d", image: IMG(1), imageAlt: "", url: "/a" }, { title: "Photo B", category: "Photo", description: "", image: IMG(2), imageAlt: "", url: "" },
      { title: "Site C", category: "Web", description: "", image: "", imageAlt: "", url: "" }, { title: "Marque D", category: "Marque", description: "", image: "", imageAlt: "", url: "" },
      { title: "Photo E", category: "Photo", description: "", image: IMG(3), imageAlt: "", url: "" }, { title: "Marque F", category: "Marque", description: "", image: "", imageAlt: "", url: "/f" }] })]);
    editId = await mk("MS-S éditeur", [w("motionhero", "msedit000001", { title: "Titre à éditer" }), w("motioncardstack", "msedit000002", {})], false);
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
  } catch (e) { fs.writeFileSync("/tmp/ms-s-before-error.txt", String(e && e.stack || e)); throw e; } });
  after(async () => { if (browser) await browser.close(); if (srv) await srv.stop(); });

  const open = async (key, opts = {}, { js = true, routes } = {}) => {
    const ctx = await browser.newContext({ viewport: { width: 1200, height: 800 }, javaScriptEnabled: js, ...opts });
    const page = await ctx.newPage(); const errs = []; const reqs = [];
    page.on("pageerror", (e) => errs.push(e.message));
    page.on("request", (r) => reqs.push(r.url()));
    if (routes) await routes(page);
    await page.goto(`${srv.base}/p/${slugs[key]}`, { waitUntil: "load" });
    return { page, ctx, errs, reqs };
  };
  const ready = (page, id) => page.waitForFunction((id) => { const e = document.querySelector(`.kw-n-${id}`); return e && e.getAttribute("data-kw-ms-state"); }, id, { timeout: 20000 });
  const noOverflow = (page) => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1);
  const scrollTo = async (page, y) => { await page.evaluate((y) => window.scrollTo(0, y), y); await wait(250); };
  const docTop = (page, s) => page.evaluate((s) => { const r = document.querySelector(s).getBoundingClientRect(); return r.top + window.pageYOffset; }, s);
  const tx = (page, s) => page.evaluate((s) => { const m = new DOMMatrix(getComputedStyle(document.querySelector(s)).transform); return m.m41; }, s);
  const sizes = async (page, selector) => { for (const wd of [320, 768, 1920]) { await page.setViewportSize({ width: wd, height: 800 }); await wait(500); assert.ok(await noOverflow(page), `${selector} : débordement à ${wd}px`); } };
  // Contrôle commun : pas de JavaScript → tout le texte est là, visible, sans état caché
  const nojs = async (key, id, expected, extra) => {
    const r = await open(key, {}, { js: false });
    const info = await r.page.evaluate(([s]) => { const e = document.querySelector(s); const cs = getComputedStyle(e); return { text: e.textContent.replace(/\s+/g, " "), op: cs.opacity, vis: cs.visibility, h: e.getBoundingClientRect().height }; }, [sel(id)]);
    for (const t of expected) assert.ok(info.text.includes(t), `sans JavaScript : « ${t} » absent`);
    assert.equal(info.op, "1"); assert.equal(info.vis, "visible"); assert.ok(info.h > 20);
    if (extra) await extra(r.page);
    await r.ctx.close();
  };

  test("images de test servies (les visuels de thème existent)", async () => {
    for (const i of [1, 2, 3, 4]) { const r = await boss.request(IMG(i)); assert.equal(r.status, 200, IMG(i)); }
  });

  test("hero : entrée en séquence réellement exécutée (cascade croissante), fond animé en boucle avec pause, texte intact", async () => {
    const { page, errs } = await open("hero");
    await ready(page, "mshero000001");
    const delays = await page.evaluate((s) => [...document.querySelectorAll(`${s} [data-ms-seq]`)].map((p) => p.getAnimations()[0].effect.getComputedTiming().delay), sel("mshero000001"));
    assert.equal(delays.length, 5); for (let i = 1; i < delays.length; i++) assert.ok(delays[i] > delays[i - 1], `cascade ${delays.join(",")}`);
    await until(() => page.evaluate((s) => [...document.querySelectorAll(`${s} [data-ms-seq]`)].every((p) => getComputedStyle(p).opacity === "1"), sel("mshero000001")), "séquence terminée", 12000);
    assert.equal((await page.textContent(`${sel("mshero000001")} h1`)).trim(), "Bienvenue chez nous");
    const bg = () => page.evaluate((s) => [...document.querySelectorAll(`${s} .kw-ms-hr-orb`)].map((o) => o.getAnimations().map((a) => a.playState).join()).join("|"), sel("mshero000001"));
    assert.match(await bg(), /^running\|running\|running$/);
    const btn = page.locator(`${sel("mshero000001")} .kw-ms-hr-pause`);
    assert.equal((await btn.textContent()).trim(), "Mettre le fond animé en pause"); await btn.click();
    assert.match(await bg(), /^paused\|paused\|paused$/); assert.equal((await btn.textContent()).trim(), "Reprendre le fond animé"); await btn.click(); assert.match(await bg(), /^running/);
    await ready(page, "mshero000002");
    assert.match(await page.evaluate((s) => document.querySelector(`${s} .kw-ms-hr-orb.is-1`).getAnimations()[0].effect.getKeyframes().map((k) => k.transform).join(), sel("mshero000002")), /rotate\(0deg\).*rotate\(360deg\)/);
    await sizes(page, "hero");
    assert.deepEqual(errs, []); await page.close();
  });
  test("hero : mouvement réduit = rien ne bouge (ni entrée ni fond ni bouton de pause) ; sans JavaScript : tout est visible", async () => {
    const { page, errs } = await open("hero", { reducedMotion: "reduce" });
    await ready(page, "mshero000001");
    assert.equal(await page.getAttribute(sel("mshero000001"), "data-kw-ms-state"), "reduced");
    assert.equal(await page.evaluate(() => document.getAnimations().length), 0); assert.equal(await page.locator(".kw-ms-hr-pause").count(), 0);
    assert.equal(await page.evaluate((s) => [...document.querySelectorAll(`${s} [data-ms-seq]`)].every((p) => Number(getComputedStyle(p).opacity) > 0.5), sel("mshero000001")), true);
    assert.deepEqual(errs, []); await page.close();
    await nojs("hero", "mshero000001", ["Nouveau", "Bienvenue chez nous", "Un sous-titre clair.", "Commencer", "Voir"], async (pg) => { assert.equal(await pg.locator(`${sel("mshero000001")} a.kw-button`).count(), 2); assert.equal(await pg.locator(`${sel("mshero000001")} img[alt="Illustration"]`).count(), 1); });
  });

  test("cartes empilées : les cartes se collent (sticky) décalées, la carte du dessous rétrécit et s'assombrit ; mobile ; mouvement réduit = liste simple", async () => {
    const { page, errs } = await open("stack");
    await ready(page, "msstack00001");
    assert.ok(await page.evaluate((s) => document.querySelector(s).classList.contains("kw-ms-live"), sel("msstack00001")));
    const top = await docTop(page, sel("msstack00001"));
    const cards = () => page.evaluate((s) => [...document.querySelectorAll(`${s} .kw-ms-cs-card`)].map((c) => { const r = c.getBoundingClientRect(), i = c.querySelector(".kw-ms-cs-in"); return { top: Math.round(r.top), scale: new DOMMatrix(getComputedStyle(i).transform).a, dim: Number(getComputedStyle(i).getPropertyValue("--kw-ms-cs-dim") || 0) }; }), sel("msstack00001"));
    await scrollTo(page, top - 80 + 300); // première carte collée (80 px du haut), les suivantes arrivent
    let c = await cards(); assert.equal(c[0].top, 80, JSON.stringify(c));
    await scrollTo(page, top + 700);
    c = await cards(); assert.equal(c[0].top, 80, "carte 1 toujours collée"); assert.equal(c[1].top, 104, `carte 2 collée 24 px plus bas ${JSON.stringify(c)}`);
    assert.ok(c[0].scale < 0.97, `carte 1 rétrécie : ${c[0].scale}`); assert.ok(c[0].dim > 0.05, `carte 1 assombrie : ${c[0].dim}`); assert.ok(c[2].scale >= c[1].scale && c[1].scale >= c[0].scale);
    await scrollTo(page, 0); c = await cards(); assert.ok(c.every((x) => x.scale === 1 && x.dim === 0), "retour en haut : cartes intactes");
    await page.setViewportSize({ width: 375, height: 700 }); await wait(500); await scrollTo(page, (await docTop(page, sel("msstack00001"))) + 20);
    assert.ok((await cards())[0].top <= 60, "mobile : décalage du haut réduit");
    await sizes(page, "cartes empilées");
    assert.deepEqual(errs, []); await page.close();
    const r = await open("stack", { reducedMotion: "reduce" }); await ready(r.page, "msstack00001");
    const st = await r.page.evaluate((s) => ({ live: document.querySelector(s).classList.contains("kw-ms-live"), pos: getComputedStyle(document.querySelector(`${s} .kw-ms-cs-card`)).position, tr: getComputedStyle(document.querySelector(`${s} .kw-ms-cs-in`)).transform }), sel("msstack00001"));
    assert.deepEqual(st, { live: false, pos: "static", tr: "none" }); assert.deepEqual(r.errs, []); await r.ctx.close();
    await nojs("stack", "msstack00001", ["Carte un", "Carte deux", "Carte trois", "Texte trois", "Go"]);
  });

  test("histoire collante : le visuel reste collé, l'étape au centre devient active et son visuel apparaît ; petit écran = visuel en ligne ; mouvement réduit = statique", async () => {
    const { page, errs } = await open("story");
    await ready(page, "msstory00001");
    const S = sel("msstory00001"), top = await docTop(page, S);
    assert.equal(await page.evaluate((s) => getComputedStyle(document.querySelector(`${s} .kw-ms-ss-stage`)).position, S), "sticky");
    const info = () => page.evaluate((s) => ({ steps: [...document.querySelectorAll(`${s} [data-ms-step]`)].map((x) => x.classList.contains("is-active")), figs: [...document.querySelectorAll(`${s} [data-ms-fig]`)].map((x) => getComputedStyle(x).opacity), stage: Math.round(document.querySelector(`${s} .kw-ms-ss-stage`).getBoundingClientRect().top) }), S);
    await scrollTo(page, top + 100); let a = await info(); assert.equal(a.steps.indexOf(true), 0);
    await page.evaluate((s) => document.querySelectorAll(`${s} [data-ms-step]`)[1].scrollIntoView({ block: "center" }), S); await wait(300);
    await until(async () => (await info()).figs[1] === "1", "fondu du visuel 2"); a = await info();
    assert.deepEqual(a.steps, [false, true, false]); assert.ok(Number(a.figs[0]) < 0.01); assert.equal(a.stage, 96, "visuel collé à 96 px du haut");
    await page.evaluate((s) => document.querySelectorAll(`${s} [data-ms-step]`)[2].scrollIntoView({ block: "center" }), S); await wait(300); a = await info();
    assert.equal(a.steps.indexOf(true), 2); assert.equal(await page.textContent(`${S} [data-ms-fig].is-active .kw-ms-ss-num`), "03", "étape sans image : son numéro");
    assert.ok(await page.evaluate((s) => document.querySelector(`${s} [data-ms-step].is-active`).getAttribute("aria-current") === "step", S));
    await page.setViewportSize({ width: 600, height: 800 }); await wait(500);
    const small = await page.evaluate((s) => ({ stage: getComputedStyle(document.querySelector(`${s} .kw-ms-ss-stage`)).display, inline: getComputedStyle(document.querySelector(`${s} .kw-ms-ss-inline`)).display }), S);
    assert.deepEqual(small, { stage: "none", inline: "block" });
    await sizes(page, "histoire collante");
    assert.deepEqual(errs, []); await page.close();
    const r = await open("story", { reducedMotion: "reduce" }); await ready(r.page, "msstory00001");
    assert.equal(await r.page.evaluate((s) => document.querySelector(s).classList.contains("kw-ms-live"), S), false); assert.equal(await r.page.evaluate((s) => getComputedStyle(document.querySelector(`${s} .kw-ms-ss-stage`)).display, S), "none");
    await r.ctx.close();
    await nojs("story", "msstory00001", ["Étape un", "Texte deux", "Étape trois"], async (pg) => assert.equal(await pg.locator(`${S} .kw-ms-ss-inline`).count(), 2));
  });

  test("section épinglée : la scène reste collée, le défilement change de scène, les points et le clavier changent de scène ; mouvement réduit = scènes l'une sous l'autre", async () => {
    const { page, errs } = await open("pin");
    await ready(page, "mspin0000001");
    const S = sel("mspin0000001"), top = await docTop(page, S);
    const H = await page.evaluate((s) => document.querySelector(s).getBoundingClientRect().height, S); assert.equal(Math.round(H), 3200, "100 % + 3 scènes × 100 % de 800 px");
    const info = () => page.evaluate((s) => ({ scenes: [...document.querySelectorAll(`${s} [data-ms-scene]`)].map((x) => x.classList.contains("is-active")).indexOf(true), stage: Math.round(document.querySelector(`${s} .kw-ms-pn-stage`).getBoundingClientRect().top), cur: [...document.querySelectorAll(`${s} .kw-ms-pn-dot`)].findIndex((d) => d.getAttribute("aria-current") === "true"), bar: document.querySelector(`${s} .kw-ms-pn-fill`).style.transform }), S);
    assert.equal(await page.locator(`${S} .kw-ms-pn-dot`).count(), 3);
    await scrollTo(page, top + 100); assert.deepEqual((({ scenes, stage, cur }) => ({ scenes, stage, cur }))(await info()), { scenes: 0, stage: 0, cur: 0 });
    await scrollTo(page, top + 1000); let a = await info(); assert.equal(a.scenes, 1); assert.equal(a.stage, 0, "scène collée"); assert.match(a.bar, /scaleX\(0\.4/);
    await scrollTo(page, top + 2300); a = await info(); assert.equal(a.scenes, 2); assert.equal(a.cur, 2);
    await page.locator(`${S} .kw-ms-pn-dot`).nth(0).click(); await wait(300); assert.equal((await info()).scenes, 0);
    await page.locator(`${S} .kw-ms-pn-dot`).nth(2).focus(); await page.keyboard.press("Enter"); await wait(300); assert.equal((await info()).scenes, 2);
    assert.match(await page.getAttribute(`${S} .kw-ms-pn-dot`, "aria-label"), /^Scène 1 sur 3 : Scène un$/);
    await scrollTo(page, top + 3200 + 200); assert.ok((await info()).stage < 0, "la section se libère après la dernière scène");
    await sizes(page, "section épinglée");
    assert.deepEqual(errs, []); await page.close();
    const short = await open("pin", { viewport: { width: 700, height: 400 } }); await ready(short.page, "mspin0000001");
    assert.equal(await short.page.evaluate((s) => document.querySelector(s).classList.contains("kw-ms-live"), S), false, "fenêtre très basse : rien n'est épinglé"); await short.ctx.close();
    const r = await open("pin", { reducedMotion: "reduce" }); await ready(r.page, "mspin0000001");
    const st = await r.page.evaluate((s) => ({ live: document.querySelector(s).classList.contains("kw-ms-live"), pos: getComputedStyle(document.querySelector(`${s} .kw-ms-pn-scene`)).position, op: [...document.querySelectorAll(`${s} .kw-ms-pn-scene`)].map((x) => getComputedStyle(x).opacity).join(), nav: document.querySelectorAll(`${s} .kw-ms-pn-nav`).length }), S);
    assert.deepEqual(st, { live: false, pos: "static", op: "1,1,1", nav: 0 }); await r.ctx.close();
    await nojs("pin", "mspin0000001", ["Scène un", "Scène deux", "Scène trois"]);
  });

  test("galerie horizontale : le défilement vertical fait avancer la bande ; clavier ; mobile et mouvement réduit = bande native focalisable", async () => {
    const { page, errs } = await open("hg");
    await ready(page, "mshg00000001");
    const S = sel("mshg00000001"), top = await docTop(page, S);
    assert.ok(await page.evaluate((s) => document.querySelector(s).classList.contains("kw-ms-live"), S));
    const H = await page.evaluate((s) => document.querySelector(s).getBoundingClientRect().height, S); assert.ok(H > 1200, `hauteur ${H}`);
    const T = `${S} .kw-ms-hg-track`;
    await scrollTo(page, top); assert.ok(Math.abs(await tx(page, T)) < 1);
    await scrollTo(page, top + (H - 800) / 2); const mid = await tx(page, T); assert.ok(mid < -100, `milieu ${mid}`);
    await scrollTo(page, top + (H - 800)); const end = await tx(page, T); assert.ok(end < mid, `fin ${end}`);
    assert.match(await page.getAttribute(`${S} .kw-ms-hg-fill`, "style"), /scaleX\(1\)/);
    assert.equal(await page.getAttribute(`${S} [data-ms-view]`, "tabindex"), null);
    // clavier : le lien du dernier élément, hors champ, ramène la page à la bonne position
    await scrollTo(page, top); await page.locator(`${S} .kw-ms-hg-link`).focus(); await wait(400);
    const vis = await page.evaluate((s) => { const r = document.querySelectorAll(`${s} [data-ms-item]`)[3].getBoundingClientRect(); return { left: r.left, right: r.right, w: window.innerWidth, sy: window.pageYOffset }; }, S);
    assert.ok(vis.left >= -1 && vis.right <= vis.w + 1 && vis.sy > top, JSON.stringify(vis));
    await sizes(page, "galerie horizontale");
    assert.deepEqual(errs, []); await page.close();
    const m = await open("hg", { viewport: { width: 375, height: 700 } }); await ready(m.page, "mshg00000001");
    const mob = await m.page.evaluate((s) => ({ live: document.querySelector(s).classList.contains("kw-ms-live"), ox: getComputedStyle(document.querySelector(`${s} [data-ms-view]`)).overflowX, tab: document.querySelector(`${s} [data-ms-view]`).getAttribute("tabindex"), sw: document.querySelector(`${s} [data-ms-view]`).scrollWidth > document.querySelector(`${s} [data-ms-view]`).clientWidth }), S);
    assert.deepEqual(mob, { live: false, ox: "auto", tab: "0", sw: true }); assert.ok(await noOverflow(m.page)); await m.ctx.close();
    const r = await open("hg", { reducedMotion: "reduce" }); await ready(r.page, "mshg00000001");
    assert.equal(await r.page.evaluate((s) => document.querySelector(s).classList.contains("kw-ms-live"), S), false); await r.ctx.close();
    await nojs("hg", "mshg00000001", ["Un", "Deux", "Trois", "Quatre"], async (pg) => assert.equal(await pg.getAttribute(`${S} [data-ms-view]`, "tabindex"), "0"));
  });

  test("séquence d'images : seule la première image au départ, le reste à l'approche ; canvas dessiné et qui change avec le défilement ; repli sur la première image", async () => {
    const { page, errs, reqs } = await open("seq");
    await ready(page, "msseq0000001");
    const S = sel("msseq0000001"), seqReq = () => reqs.filter((u) => /\/themes-art\/formation-en-ligne\/wide-\d\.svg/.test(u)).map((u) => u.match(/wide-(\d)/)[1]);
    await wait(600);
    assert.deepEqual([...new Set(seqReq())], ["1"], `chargement différé : ${seqReq()}`);
    const top = await docTop(page, S);
    await scrollTo(page, top - 1500); await until(() => new Set(seqReq()).size === 4, "toutes les images demandées à l'approche");
    await scrollTo(page, top + 10);
    await until(() => page.evaluate((s) => document.querySelector(s).classList.contains("is-canvas"), S), "canvas affiché");
    const sig = () => page.evaluate((s) => { const c = document.querySelector(`${s} .kw-ms-sq-canvas`), g = c.getContext("2d"), d = g.getImageData(0, 0, c.width, c.height).data; let h = 0, a = 0; for (let i = 0; i < d.length; i += 97) { h = (h * 31 + d[i] + d[i + 1] * 3 + d[i + 2] * 7) >>> 0; a += d[i + 3]; } return { h, a, w: c.width }; }, S);
    const first = await sig(); assert.ok(first.a > 0 && first.w > 100, "image dessinée");
    await until(() => page.evaluate((s) => [...document.querySelectorAll(`${s} .kw-ms-sq-canvas`)].length === 1 && getComputedStyle(document.querySelector(`${s} .kw-ms-sq-stage`)).position === "sticky", S), "scène collée");
    const H = await page.evaluate((s) => document.querySelector(s).getBoundingClientRect().height, S); assert.equal(Math.round(H), 2400, "100 % + 200 % de 800 px");
    await scrollTo(page, top + (H - 800)); await wait(300);
    const last = await sig(); assert.notEqual(last.h, first.h, "la dernière image diffère de la première");
    assert.equal(await page.evaluate((s) => getComputedStyle(document.querySelector(`${s} .kw-ms-sq-first`)).width, S), "1px", "image du serveur conservée pour les lecteurs d'écran, masquée visuellement");
    assert.equal(await page.getAttribute(`${S} .kw-ms-sq-first`, "alt"), "Produit en 4 images"); assert.equal(await page.getAttribute(`${S} .kw-ms-sq-canvas`, "aria-hidden"), "true");
    await sizes(page, "séquence");
    assert.deepEqual(errs, []); await page.close();
    // repli : images bloquées → l'image du serveur reste affichée, aucun canvas, aucune erreur
    const b = await open("seq", {}, { routes: (pg) => pg.route("**/themes-art/**", (r) => r.abort()) }); await ready(b.page, "msseq0000001"); await wait(500);
    assert.equal(await b.page.evaluate((s) => document.querySelector(s).classList.contains("is-canvas"), S), false); assert.deepEqual(b.errs, []); await b.ctx.close();
    const r = await open("seq", { reducedMotion: "reduce" }); await ready(r.page, "msseq0000001");
    const st = await r.page.evaluate((s) => ({ live: document.querySelector(s).classList.contains("kw-ms-live"), canvas: getComputedStyle(document.querySelector(`${s} .kw-ms-sq-canvas`)).display, img: getComputedStyle(document.querySelector(`${s} .kw-ms-sq-first`)).display }), S);
    assert.deepEqual(st, { live: false, canvas: "none", img: "block" }); await r.ctx.close();
    await nojs("seq", "msseq0000001", ["Le produit", "Faites défiler"], async (pg) => assert.equal(await pg.locator(`${S} img.kw-ms-sq-first`).count(), 1));
  });

  test("chronologie : la ligne se remplit au défilement, les étapes apparaissent quand elles arrivent ; mouvement réduit = complète", async () => {
    const { page, errs } = await open("tl", { viewport: { width: 1200, height: 600 } });
    await ready(page, "mstl00000001");
    const S = sel("mstl00000001"), top = await docTop(page, S);
    const info = () => page.evaluate((s) => ({ fill: new DOMMatrix(getComputedStyle(document.querySelector(`${s} [data-ms-fill]`)).transform).d, ops: [...document.querySelectorAll(`${s} .kw-ms-tl-card`)].map((c) => getComputedStyle(c).opacity), reached: [...document.querySelectorAll(`${s} [data-ms-dot]`)].filter((d) => d.classList.contains("is-reached")).length }), S);
    await scrollTo(page, top - 600); let a = await info(); assert.ok(a.fill < 0.6, `ligne partielle : ${a.fill}`); assert.equal(a.ops[4], "0", "étape basse pas encore apparue");
    await until(async () => (await info()).ops[0] === "1", "première étape apparue");
    await scrollTo(page, top + 300); const b = await info(); assert.ok(b.fill > a.fill, `${a.fill} -> ${b.fill}`); assert.ok(b.reached >= 1);
    await scrollTo(page, top + 1500); await until(async () => (await info()).ops.every((o) => o === "1"), "toutes les étapes apparues"); const c = await info();
    assert.ok(c.fill > 0.9 && c.reached === 5, JSON.stringify(c));
    await page.setViewportSize({ width: 1200, height: 600 });
    await sizes(page, "chronologie");
    assert.deepEqual(errs, []); await page.close();
    const r = await open("tl", { reducedMotion: "reduce", viewport: { width: 1200, height: 600 } }); await ready(r.page, "mstl00000001");
    const st = await r.page.evaluate((s) => ({ ops: [...document.querySelectorAll(`${s} .kw-ms-tl-card`)].map((c) => getComputedStyle(c).opacity).join(), fill: getComputedStyle(document.querySelector(`${s} [data-ms-fill]`)).transform, anims: document.getAnimations().length }), S);
    assert.deepEqual(st, { ops: "1,1,1,1,1", fill: "none", anims: 0 }); await r.ctx.close();
    await nojs("tl", "mstl00000001", ["2020", "Étape 1", "Étape 5"]);
  });

  test("étapes de processus : les pastilles apparaissent l'une après l'autre puis le trait se trace ; colonne sur mobile ; mouvement réduit = tout visible", async () => {
    const { page, errs } = await open("pr");
    await ready(page, "mspr00000001");
    const S = sel("mspr00000001");
    const delays = await page.evaluate((s) => [...document.querySelectorAll(`${s} [data-ms-badge]`)].map((b) => b.getAnimations()[0].effect.getComputedTiming().delay), S);
    assert.equal(delays.length, 4); for (let i = 1; i < 4; i++) assert.ok(delays[i] - delays[i - 1] >= 200, `cascade ${delays}`);
    assert.equal(await page.evaluate((s) => document.querySelectorAll(`${s} [data-ms-draw]`)[0].getAnimations()[0].effect.getKeyframes()[0].transform, S), "scaleX(0)");
    await until(() => page.evaluate((s) => [...document.querySelectorAll(`${s} [data-ms-reveal], ${s} [data-ms-draw]`)].every((e) => getComputedStyle(e).opacity !== "0" && /^(none|matrix\(1, 0, 0, 1, 0, 0\))$/.test(getComputedStyle(e).transform)), S), "tout est apparu", 15000);
    await ready(page, "mspr00000002");
    assert.equal(await page.evaluate((s) => document.querySelectorAll(`${s} [data-ms-draw]`)[0].getAnimations()[0].effect.getKeyframes()[0].transform, sel("mspr00000002")), "scaleY(0)");
    assert.equal(await page.textContent(`${S} .kw-ms-pr-step:nth-child(2) .kw-ms-pr-title`), "Étape 2 : Étude");
    await sizes(page, "étapes");
    assert.deepEqual(errs, []); await page.close();
    const r = await open("pr", { reducedMotion: "reduce" }); await ready(r.page, "mspr00000001");
    assert.equal(await r.page.evaluate(() => document.getAnimations().length), 0); assert.equal(await r.page.evaluate((s) => [...document.querySelectorAll(`${s} [data-ms-badge]`)].every((b) => getComputedStyle(b).opacity === "1"), S), true); await r.ctx.close();
    await nojs("pr", "mspr00000001", ["Contact", "On se parle", "Suivi"]);
  });

  test("menu plein écran : ouverture animée, liens en cascade, focus piégé, Échap, retour du focus, aria ; mouvement réduit sans animation ; sans JavaScript la liste est affichée", async () => {
    const { page, errs } = await open("menu");
    await ready(page, "msmenu000001");
    const S = sel("msmenu000001"), panel = `${S} .kw-ms-fm-panel`, tog = `${S} .kw-ms-fm-toggle`;
    assert.equal(await page.isVisible(tog), true); assert.equal(await page.evaluate((p) => getComputedStyle(document.querySelector(p)).display, panel), "none");
    assert.equal(await page.getAttribute(tog, "aria-expanded"), "false");
    await page.click(tog);
    assert.equal(await page.evaluate((p) => getComputedStyle(document.querySelector(p)).display, panel), "flex"); assert.equal(await page.getAttribute(tog, "aria-expanded"), "true");
    assert.equal(await page.getAttribute(panel, "role"), "dialog"); assert.equal(await page.getAttribute(panel, "aria-modal"), "true");
    assert.equal(await page.evaluate(() => document.activeElement.className), "kw-ms-fm-close");
    assert.equal(await page.evaluate(() => document.documentElement.classList.contains("kw-ms-lock")), true);
    const an = await page.evaluate((s) => ({ panel: document.querySelector(`${s} .kw-ms-fm-panel`).getAnimations().length, items: [...document.querySelectorAll(`${s} .kw-ms-fm-item`)].map((i) => i.getAnimations()[0].effect.getComputedTiming().delay) }), S);
    assert.equal(an.panel, 1); for (let i = 1; i < an.items.length; i++) assert.ok(an.items[i] > an.items[i - 1], `cascade ${an.items}`);
    // focus piégé : 12 Tab restent dans le panneau ; Maj+Tab depuis le premier va au dernier
    for (let i = 0; i < 12; i++) { await page.keyboard.press("Tab"); assert.equal(await page.evaluate((p) => document.querySelector(p).contains(document.activeElement), panel), true, `Tab ${i}`); }
    await page.locator(`${S} .kw-ms-fm-close`).focus(); await page.keyboard.press("Shift+Tab");
    assert.equal(await page.evaluate(() => document.activeElement.textContent.trim().replace(/\s+/g, " ")), "04Contact");
    await page.keyboard.press("Escape");
    await until(() => page.evaluate((p) => getComputedStyle(document.querySelector(p)).display === "none", panel), "fermeture");
    assert.equal(await page.getAttribute(tog, "aria-expanded"), "false"); assert.equal(await page.evaluate(() => document.activeElement.className), "kw-ms-fm-toggle");
    assert.equal(await page.evaluate(() => document.documentElement.classList.contains("kw-ms-lock")), false);
    // un clic sur un lien d'ancre ferme le menu
    await page.keyboard.press("Enter"); await until(() => page.evaluate((p) => getComputedStyle(document.querySelector(p)).display === "flex", panel), "réouverture clavier");
    await page.locator(`${S} .kw-ms-fm-link[href="#fin"]`).click(); await until(() => page.evaluate((p) => getComputedStyle(document.querySelector(p)).display === "none", panel), "fermeture par un lien");
    // effet « cercle » du second menu
    const p2 = `${sel("msmenu000002")} .kw-ms-fm-panel`;
    await page.click(`${sel("msmenu000002")} .kw-ms-fm-toggle`);
    assert.match(await page.evaluate((p) => document.querySelector(p).getAnimations()[0].effect.getKeyframes()[0].clipPath, p2), /circle\(0px at/);
    await page.keyboard.press("Escape");
    await page.setViewportSize({ width: 320, height: 640 }); await wait(400); await page.click(tog);
    assert.ok(await noOverflow(page)); assert.equal(await page.evaluate((p) => { const r = document.querySelector(p).getBoundingClientRect(); return r.width === window.innerWidth && r.height === window.innerHeight; }, panel), true, "le panneau remplit l'écran à 320 px");
    await page.keyboard.press("Escape");
    await sizes(page, "menu");
    assert.deepEqual(errs, []); await page.close();
    const r = await open("menu", { reducedMotion: "reduce" }); await ready(r.page, "msmenu000001");
    await r.page.click(tog); assert.equal(await r.page.evaluate((p) => getComputedStyle(document.querySelector(p)).display, panel), "flex"); assert.equal(await r.page.evaluate(() => document.getAnimations().length), 0, "ouverture sans animation");
    await r.page.keyboard.press("Escape"); await until(() => r.page.evaluate((p) => getComputedStyle(document.querySelector(p)).display === "none", panel), "fermeture réduite"); assert.deepEqual(r.errs, []); await r.ctx.close();
    await nojs("menu", "msmenu000001", ["Accueil", "Formations", "Fin de page", "Contact"], async (pg) => {
      assert.equal(await pg.isVisible(`${S} .kw-ms-fm-toggle`), false); assert.equal(await pg.isVisible(`${S} .kw-ms-fm-link >> nth=0`), true); assert.equal(await pg.evaluate((p) => getComputedStyle(document.querySelector(p)).position, panel), "static");
    });
  });

  test("témoignages : un seul visible, flèches, points, clavier, transition animée ; lecture automatique avec pause (bouton, survol) ; mouvement réduit = tous visibles", async () => {
    const { page, errs } = await open("ts");
    await ready(page, "msts00000001"); await ready(page, "msts00000002");
    const S = sel("msts00000001");
    const state = () => page.evaluate((s) => ({ active: [...document.querySelectorAll(`${s} [data-ms-slide]`)].map((x) => x.classList.contains("is-active")).indexOf(true), vis: [...document.querySelectorAll(`${s} [data-ms-slide]`)].filter((x) => getComputedStyle(x).visibility === "visible" && getComputedStyle(x).opacity !== "0").length, inert: [...document.querySelectorAll(`${s} [data-ms-slide]`)].map((x) => x.hasAttribute("inert")).join(), dot: [...document.querySelectorAll(`${s} .kw-ms-ts-dot`)].findIndex((d) => d.getAttribute("aria-current") === "true") }), S);
    let a = await state(); assert.deepEqual(a, { active: 0, vis: 1, inert: "false,true,true", dot: 0 });
    assert.equal(await page.locator(`${S} .kw-ms-ts-dot`).count(), 3);
    await page.click(`${S} .kw-ms-ts-btn[aria-label="Témoignage suivant"]`);
    assert.ok(await page.evaluate((s) => document.querySelector(s).getAnimations({ subtree: true }).length >= 2, S), "transition animée");
    await until(async () => (await state()).vis === 1, "fin de transition"); a = await state(); assert.deepEqual([a.active, a.dot], [1, 1]);
    await page.locator(`${S} .kw-ms-ts-dot`).nth(2).click(); await until(async () => (await state()).active === 2, "point 3");
    await page.keyboard.press("ArrowRight"); await until(async () => (await state()).active === 0, "boucle vers le premier (flèche clavier)");
    await page.click(`${S} .kw-ms-ts-btn[aria-label="Témoignage précédent"]`); await until(async () => (await state()).active === 2, "précédent depuis le premier");
    assert.equal(await page.getAttribute(`${S} [data-ms-list]`, "aria-live"), "polite");
    // lecture automatique (3 s) : avance seule, s'arrête au bouton Pause, au survol
    const S2 = sel("msts00000002"), cur2 = () => page.evaluate((s) => [...document.querySelectorAll(`${s} [data-ms-slide]`)].map((x) => x.classList.contains("is-active")).indexOf(true), S2);
    assert.equal(await page.getAttribute(`${S2} [data-ms-list]`, "aria-live"), "off");
    await page.locator(S2).scrollIntoViewIfNeeded(); await page.mouse.move(2, 2);
    const c0 = await cur2(); await until(async () => (await cur2()) !== c0, "avance automatique", 6500);
    const btn = page.locator(`${S2} .kw-ms-ts-btn.is-text`); assert.equal((await btn.textContent()).trim(), "Pause"); await btn.click(); assert.equal((await btn.textContent()).trim(), "Lecture");
    const c1 = await cur2(); await wait(3800); assert.equal(await cur2(), c1, "en pause : ne bouge plus"); assert.equal(await page.getAttribute(`${S2} [data-ms-list]`, "aria-live"), "polite");
    await btn.click(); await page.mouse.move(600, 500); await page.hover(S2); const c2 = await cur2(); await wait(3800); assert.equal(await cur2(), c2, "survol : ne bouge pas");
    await sizes(page, "témoignages");
    assert.deepEqual(errs, []); await page.close();
    const r = await open("ts", { reducedMotion: "reduce" }); await ready(r.page, "msts00000001");
    const st = await r.page.evaluate((s) => ({ vis: [...document.querySelectorAll(`${s} [data-ms-slide]`)].filter((x) => getComputedStyle(x).visibility === "visible").length, ctl: document.querySelectorAll(`${s} .kw-ms-ts-controls`).length }), S);
    assert.deepEqual(st, { vis: 3, ctl: 0 }); await r.ctx.close();
    await nojs("ts", "msts00000001", ["Premier avis", "Deuxième avis", "Troisième avis", "Cléo"]);
  });

  test("bande de logos : défilement en boucle, copies inertes, pause au bouton / survol / clavier ; mouvement réduit = grille statique", async () => {
    const { page, errs } = await open("logo");
    await ready(page, "mslogo000001");
    const S = sel("mslogo000001");
    await until(() => page.evaluate((s) => document.querySelector(`${s} .kw-ms-lm-track`).getAnimations().length === 1, S), "piste animée");
    const info = () => page.evaluate((s) => { const t = document.querySelector(`${s} .kw-ms-lm-track`), a = t.getAnimations()[0]; return { state: a.playState, iter: a.effect.getComputedTiming().iterations, dur: a.effect.getComputedTiming().duration, lists: t.querySelectorAll("ul").length, clones: [...t.querySelectorAll("ul[aria-hidden]")].every((u) => u.hasAttribute("inert") && [...u.querySelectorAll("a")].every((x) => x.tabIndex === -1)), tx: new DOMMatrix(getComputedStyle(t).transform).m41 }; }, S);
    let a = await info(); assert.equal(a.state, "running"); assert.equal(a.iter, Infinity); assert.ok(a.lists >= 2 && a.clones); assert.ok(a.dur > 3000);
    await wait(400); const t1 = (await info()).tx; await wait(400); assert.notEqual((await info()).tx, t1, "la piste avance");
    const btn = page.locator(`${S} .kw-ms-lm-pause`); await btn.click(); assert.equal((await info()).state, "paused"); assert.match((await btn.textContent()), /Relancer/);
    await btn.click(); assert.equal((await info()).state, "running");
    await page.hover(`${S} .kw-ms-lm-view`); assert.equal((await info()).state, "paused", "survol"); await page.mouse.move(2, 2); assert.equal((await info()).state, "running");
    await page.evaluate(() => document.activeElement.blur()); await page.locator(`${S} .kw-ms-lm-link`).first().focus(); assert.equal((await info()).state, "paused", "focus clavier"); await page.evaluate(() => document.activeElement.blur()); assert.equal((await info()).state, "running");
    assert.equal(await page.locator(`${S} li[aria-hidden] , ${S} ul[aria-hidden] a`).count() > 0, true);
    await sizes(page, "logos");
    assert.deepEqual(errs, []); await page.close();
    const r = await open("logo", { reducedMotion: "reduce" }); await ready(r.page, "mslogo000001");
    const st = await r.page.evaluate((s) => ({ anims: document.getAnimations().length, lists: document.querySelectorAll(`${s} ul`).length, wrap: getComputedStyle(document.querySelector(`${s} .kw-ms-lm-list`)).flexWrap, pause: document.querySelectorAll(`${s} .kw-ms-lm-pause`).length }), S);
    assert.deepEqual(st, { anims: 0, lists: 1, wrap: "wrap", pause: 0 }); await r.ctx.close();
    await nojs("logo", "mslogo000001", ["Gamma"], async (pg) => assert.equal(await pg.locator(`${S} img`).count(), 3));
  });

  test("portfolio : filtres animés (sortie en fondu puis glissement des cartes restantes), aria-pressed, annonce du nombre ; clics rapprochés ; mouvement réduit = filtres instantanés", async () => {
    const { page, errs } = await open("pf");
    await ready(page, "mspf00000001");
    const S = sel("mspf00000001");
    const vis = () => page.evaluate((s) => [...document.querySelectorAll(`${s} [data-ms-item]`)].filter((x) => !x.hidden).map((x) => x.querySelector(".kw-ms-pf-title").textContent), S);
    assert.equal((await vis()).length, 6); assert.equal(await page.isVisible(`${S} [data-ms-filters]`), true);
    assert.deepEqual(await page.locator(`${S} .kw-ms-pf-filter`).allTextContents(), ["Tous", "Web", "Photo", "Marque"]);
    await page.click(`${S} .kw-ms-pf-filter >> text=Photo`);
    assert.ok(await page.evaluate((s) => document.querySelector(s).getAnimations({ subtree: true }).length > 0, S), "animation de sortie lancée");
    await until(async () => (await vis()).length === 2, "filtre Photo"); assert.deepEqual(await vis(), ["Photo B", "Photo E"]);
    await until(() => page.evaluate((s) => [...document.querySelectorAll(`${s} [data-ms-item]`)].filter((x) => !x.hidden).every((x) => x.getAnimations().length === 0 || x.getAnimations().every((a) => a.playState !== "running")), S), "fin des animations", 4000);
    assert.equal(await page.getAttribute(`${S} .kw-ms-pf-filter >> text=Photo`, "aria-pressed"), "true"); assert.equal(await page.getAttribute(`${S} .kw-ms-pf-filter >> text=Tous`, "aria-pressed"), "false");
    assert.equal((await page.textContent(`${S} [data-ms-status]`)).trim(), "2 projets affichés");
    // la carte restante glisse vers sa nouvelle place (FLIP) quand on revient à « Web » (les positions changent)
    await page.click(`${S} .kw-ms-pf-filter >> text=Web`);
    await until(async () => (await vis()).length === 2 && (await vis())[0] === "Site A", "filtre Web");
    // clics rapprochés : l'état final est celui du dernier clic
    await page.click(`${S} .kw-ms-pf-filter >> text=Marque`); await page.click(`${S} .kw-ms-pf-filter >> text=Tous`); await page.click(`${S} .kw-ms-pf-filter >> text=Photo`);
    await until(async () => (await vis()).join() === "Photo B,Photo E", "dernier clic gagnant", 6000); await wait(800);
    assert.deepEqual(await vis(), ["Photo B", "Photo E"]); assert.equal(await page.evaluate((s) => [...document.querySelectorAll(`${s} [data-ms-item]`)].filter((x) => !x.hidden).every((x) => getComputedStyle(x).opacity === "1"), S), true, "aucune carte restée transparente");
    await page.click(`${S} .kw-ms-pf-filter >> text=Tous`); await until(async () => (await vis()).length === 6, "retour à tous");
    assert.match(await page.getAttribute(`${S} a.kw-ms-pf-card >> nth=0`, "href"), /^\/a$|\/clic\//);
    await sizes(page, "portfolio");
    assert.deepEqual(errs, []); await page.close();
    const r = await open("pf", { reducedMotion: "reduce" }); await ready(r.page, "mspf00000001");
    await r.page.click(`${S} .kw-ms-pf-filter >> text=Marque`);
    assert.deepEqual(await r.page.evaluate((s) => [...document.querySelectorAll(`${s} [data-ms-item]`)].filter((x) => !x.hidden).map((x) => x.querySelector(".kw-ms-pf-title").textContent), S), ["Marque D", "Marque F"]);
    assert.equal(await r.page.evaluate(() => document.getAnimations().length), 0); assert.deepEqual(r.errs, []); await r.ctx.close();
    await nojs("pf", "mspf00000001", ["Site A", "Photo B", "Marque F"], async (pg) => { assert.equal(await pg.isVisible(`${S} [data-ms-filters]`), false); assert.equal(await pg.locator(`${S} [data-ms-item]:visible`).count(), 6); });
  });

  // ---------------------------------------------------------------- éditeur
  test("éditeur : les 12 composants s'insèrent depuis la bibliothèque et s'affichent dans le canevas ; liste d'éléments (ajouter, dupliquer, monter, supprimer), réglages annulables, aperçu seulement pour les composants qui en ont un", { timeout: 420000 }, async () => {
    const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
    await ctx.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    const page = await ctx.newPage(); const errs = [];
    page.on("pageerror", (e) => errs.push(e.message));
    await page.goto(`${srv.base}/marketing/pages/${editId}/editeur`);
    await page.waitForFunction(() => { const f = document.querySelector("[data-pb-frame]"); return f && f.contentDocument && f.contentDocument.body && f.contentDocument.body.classList.contains("lp-builder") && window.__pb; }, null, { timeout: 40000 });
    await wait(800);
    const doc = () => page.evaluate(() => window.__pb.content());
    const flat = (c) => { const o = []; const walk = (l) => (l || []).forEach((n) => { o.push(n); walk(n.children); }); walk(c.sections); return o; };
    const settle = () => page.waitForFunction(() => !window.__pb.dirty(), null, { timeout: 30000 });
    const TYPES = { motionhero: "Hero animé", motioncardstack: "Cartes empilées", motionstickystory: "Histoire collante", motionpinscenes: "Section épinglée à scènes", motionhgallery: "Galerie à défilement horizontal", motionscrollseq: "Séquence d'images au défilement",
      motiontimeline: "Chronologie animée", motionprocess: "Étapes de processus", motionfsmenu: "Menu plein écran animé", motiontestimonials: "Témoignages animés", motionlogomarquee: "Bande de logos", motionportfolio: "Portfolio filtrable animé" };
    await page.evaluate(() => { const b = document.querySelector("#pb-tab-elements"); if (b) b.click(); });
    for (const [type, label] of Object.entries(TYPES)) {
      await page.locator("[data-pb-el-search]").fill(label); await wait(150);
      await page.locator(`.pb-pal-item[data-widget="${type}"]`).first().click({ timeout: 10000 }); await wait(250);
    }
    await settle();
    const c = await doc(), all = flat(c);
    for (const type of Object.keys(TYPES)) assert.ok(all.some((n) => n.type === type), `${type} inséré`);
    // canevas : chaque composant inséré est rendu avec son gabarit (Motion Studio initialisé, pas d'erreur)
    await until(async () => (await page.evaluate(() => { const d = document.querySelector("[data-pb-frame]").contentDocument; return d.querySelectorAll(".kw-ms[data-node-id], [data-node-id].kw-ms").length; })) >= 13, "canevas rendu", 40000);
    const inFrame = await page.evaluate(() => { const d = document.querySelector("[data-pb-frame]").contentDocument; return [...d.querySelectorAll("[data-node-id].kw-ms")].map((e) => e.className.match(/kw-(motion[a-z]+)/)[1]); });
    for (const type of Object.keys(TYPES)) assert.ok(inFrame.includes(type), `${type} dans le canevas : ${inFrame.join()}`);
    const until2 = (fn, what, ms) => until(fn, what, ms);
    // sélection du hero de départ : panneau Motion Studio, liste de boutons éditable
    await page.locator(`[data-pb-layers] .pb-node[data-id="msedit000002"] > .pb-row-item`).first().click(); await wait(400);
    const titles = await page.locator("[data-pb-inspector] .pb-acc-title").allTextContents();
    for (const t of ["Contenu", "Style", "Animation", "Responsive", "Avancé"]) assert.ok(titles.includes(t), `section ${t} : ${titles.join("|")}`);
    assert.equal(await page.locator('[data-pb-inspector] [data-ms-act="play"]').count(), 0, "cartes empilées : pas de bouton Lire (rien à lire dans l'éditeur)");
    const cards = () => doc().then((d) => flat(d).find((n) => n.id === "msedit000002").props.cards);
    assert.equal((await cards()).length, 3);
    await page.locator('[data-pb-inspector] button:has-text("Ajouter un élément")').click(); await wait(300); assert.equal((await cards()).length, 4);
    await page.locator('[data-pb-inspector] button[aria-label="Dupliquer l\'élément 1"]').click(); await wait(300);
    let cs = await cards(); assert.equal(cs.length, 5); assert.equal(cs[1].title, cs[0].title, "copie juste après l'original");
    await page.locator('[data-pb-inspector] button[aria-label="Monter l\'élément 3"]').click(); await wait(300);
    const moved = await cards(); assert.equal(moved[1].title, cs[2].title);
    await page.locator('[data-pb-inspector] button[aria-label="Supprimer l\'élément 5"]').click(); await wait(300); assert.equal((await cards()).length, 4);
    // le canevas suit : 4 cartes
    await until2(() => page.evaluate(() => document.querySelector("[data-pb-frame]").contentDocument.querySelectorAll('[data-node-id="msedit000002"] .kw-ms-cs-card').length === 4), "canevas : 4 cartes");
    // saisie dans une carte → canevas
    const t0 = page.locator('[data-pb-inspector] .pb-items-item').first().locator('input[type="text"]').nth(1);
    await t0.fill("Nouveau titre de carte"); await wait(500);
    await until2(() => page.evaluate(() => document.querySelector("[data-pb-frame]").contentDocument.querySelector('[data-node-id="msedit000002"] .kw-ms-cs-title').textContent === "Nouveau titre de carte"), "canevas : titre modifié");
    // paramètre numérique (réglage propre au composant) enregistré dans motion.studio.params ; annulation
    const topInput = page.locator('[data-pb-inspector] [data-prop="ms-p-top"] input').first();
    await topInput.fill("120"); await topInput.press("Enter"); await wait(500);
    assert.equal(flat(await doc()).find((n) => n.id === "msedit000002").motion.studio.params.top, 120);
    // hero : sélection, aperçu (Lire / Pause) présent, effet modifiable
    await page.locator(`[data-pb-layers] .pb-node[data-id="msedit000001"] > .pb-row-item`).first().click(); await wait(400);
    assert.equal(await page.locator('[data-pb-inspector] [data-ms-act="play"]').count(), 1);
    await until2(() => page.evaluate(() => { const e = document.querySelector("[data-pb-frame]").contentDocument.querySelector('[data-node-id="msedit000001"]'); return e && e.getAttribute("data-kw-ms-state") === "ready"; }), "hero prêt dans le canevas");
    assert.equal(await page.evaluate(() => [...document.querySelector("[data-pb-frame]").contentDocument.querySelectorAll('[data-node-id="msedit000001"] [data-ms-seq]')].every((p) => Number(getComputedStyle(p).opacity) > 0.5)), true, "état final visible dans l'éditeur");
    await page.locator('[data-pb-inspector] .pb-field:has(> label:text-is("Effet")) select').selectOption("blur"); await wait(400);
    assert.equal(flat(await doc()).find((n) => n.id === "msedit000001").motion.studio.preset, "blur");
    await page.locator('[data-pb-inspector] [data-ms-act="play"]').click({ force: true }); await wait(150);
    assert.match(await page.evaluate(() => [...document.querySelector("[data-pb-frame]").contentDocument.querySelectorAll('[data-node-id="msedit000001"] [data-ms-seq]')].flatMap((p) => p.getAnimations().map((a) => a.playState)).join()), /running|finished/);
    // boutons du hero : liste éditable ; au minimum 0 (on peut tous les supprimer)
    for (let i = 0; i < 2; i++) await page.locator('[data-pb-inspector] button[aria-label^="Supprimer l\'élément"]').first().click().catch(() => {});
    await settle();
    const saved = JSON.parse(db.prepare("SELECT draft FROM mk_landing_pages WHERE id = ?").get(editId).draft);
    assert.ok(flat(saved).filter((n) => /^motion(hero|cardstack|stickystory|pinscenes|hgallery|scrollseq|timeline|process|fsmenu|testimonials|logomarquee|portfolio)$/.test(n.type)).length >= 14, "tout est enregistré dans le brouillon");
    assert.deepEqual(errs, []); await ctx.close();
  });
});
