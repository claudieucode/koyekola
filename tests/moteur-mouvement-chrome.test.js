// Moteur de mouvement sur la PAGE PUBLIÉE, dans un vrai Chrome (Playwright) : chaque animation du catalogue est réellement exécutée par le
// navigateur (Web Animations : nom, images-clés, durée, délai, répétition, direction), les déclencheurs fonctionnent (visible, chargement,
// clic), l'écran (tablette / mobile) remplace ou coupe l'animation, et « mouvement réduit » est respecté (fondu court ou rien).
// Ignoré (avec la raison) si Playwright ou Chrome ne sont pas installés : `npm i --no-save playwright-core`, ou CHROME_PATH.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");
const motion = require("../src/marketing/pages/motion");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : parcours navigateur non exécuté sur cette machine" : false;

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
async function until(check, { timeout = 10000, every = 80, what = "condition" } = {}) {
  const end = Date.now() + timeout;
  for (;;) {
    let v = null;
    try { v = await check(); } catch { /* on réessaie */ }
    if (v) return v;
    if (Date.now() > end) throw new Error(`Délai dépassé : ${what}`);
    await wait(every);
  }
}
const ids = Object.keys(motion.ANIMATIONS);
const nid = (i) => `an${String(i).padStart(10, "0")}`;
const tall = { desktop: { minHeight: "70vh" } };

describe("moteur de mouvement : page publiée dans Chrome", { skip: SKIP }, () => {
  let srv, boss, browser;
  const db = () => srv.db();
  async function publishPage(name, children) {
    const id = Number((await boss.post("/marketing/pages", { name })).location.match(/(\d+)$/)[1]);
    const rev = db().prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(id).revision;
    const put = await boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", json: { revision: rev, content: { sections: [{ id: "sect00000001", type: "layout", children }] } }, headers: { Origin: srv.base } });
    assert.equal(put.status, 200, put.text.slice(0, 300));
    assert.equal((await boss.request(`/marketing/pages/${id}/publier.json`, { method: "POST", json: {} })).status, 200);
    return `${srv.base}/p/${db().prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(id).slug}`;
  }
  const heading = (i, motionCfg, text = "Titre") => ({ id: nid(i), type: "heading", props: { text: `${text} ${i}`, level: "2" }, styles: tall, motion: motionCfg });
  async function open(url, opts = {}) {
    const ctx = await browser.newContext({ viewport: opts.viewport || { width: 1300, height: 800 }, reducedMotion: opts.reduce ? "reduce" : "no-preference" });
    const page = await ctx.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(`pageerror : ${e.message}`));
    page.on("console", (m) => { if (m.type() === "error" && !/favicon|Failed to load resource/.test(m.text())) errors.push(`console : ${m.text()}`); });
    await page.goto(url);
    return { ctx, page, errors };
  }
  const info = (page, id) => page.evaluate((nodeId) => {
    const el = document.querySelector(`.kw-n-${nodeId}`);
    if (!el) return null;
    const anims = el.getAnimations().filter((a) => a.animationName);
    const cs = getComputedStyle(el);
    return { cls: el.className, opacity: cs.opacity, names: anims.map((a) => a.animationName), keyframes: anims.length ? anims[0].effect.getKeyframes().length : 0,
      timing: anims.length ? anims[0].effect.getComputedTiming() : null, attrs: Object.fromEntries([...el.attributes].filter((a) => a.name.startsWith("data-kw")).map((a) => [a.name, a.value])) };
  }, id);
  const scrollTo = (page, id) => page.evaluate((nodeId) => document.querySelector(`.kw-n-${nodeId}`).scrollIntoView({ block: "center" }), id);

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
  });
  after(async () => { if (browser) await browser.close(); if (srv) await srv.stop(); });

  test("CHAQUE animation du catalogue est réellement exécutée par le navigateur (nom, images-clés, durée, délai) — aucune animation fictive", async () => {
    const url = await publishPage("Mouvement — catalogue", ids.map((id, i) => heading(i + 1, { entrance: id, duration: 400, delay: 50, ...(motion.ANIMATIONS[id].kind === "out" ? {} : {}) })));
    const { ctx, page, errors } = await open(url);
    for (let i = 0; i < ids.length; i++) {
      const id = ids[i], nodeId = nid(i + 1), a = motion.ANIMATIONS[id];
      const before = await info(page, nodeId);
      if (a.kind === "in") assert.equal(before.opacity, "0", `${id} : caché avant son déclenchement`);
      else assert.notEqual(before.opacity, "0", `${id} : visible avant son déclenchement`);
      await scrollTo(page, nodeId);
      const got = await until(async () => { const r = await info(page, nodeId); return r && r.names.includes(`kw-a-${id}`) ? r : null; }, { what: `${id} : animation démarrée` });
      assert.ok(got.keyframes >= 2, `${id} : images-clés réelles (${got.keyframes})`);
      assert.equal(got.timing.duration, 400, `${id} : durée`);
      assert.equal(got.timing.delay, 50, `${id} : délai`);
      assert.equal(got.timing.iterations, 1, `${id} : une seule fois par défaut`);
      assert.equal(got.timing.fill, a.fill, `${id} : remplissage`);
    }
    // la page ne contient que les images-clés utilisées : ici, toutes (le catalogue entier), une seule fois chacune
    const css = await page.evaluate(() => [...document.querySelectorAll("style")].map((s) => s.textContent).join("\n"));
    for (const id of ids) assert.equal((css.match(new RegExp(`@keyframes kw-a-${id}\\{`, "g")) || []).length, 1, id);
    assert.deepEqual(errors, []);
    await ctx.close();
  });

  test("page légère : seules les animations utilisées sont livrées ; sans mouvement, aucune image-clé du moteur", async () => {
    const url = await publishPage("Mouvement — léger", [heading(1, { entrance: "fade-in-up" }), heading(2, undefined)]);
    const { ctx, page } = await open(url);
    const css = await page.evaluate(() => [...document.querySelectorAll("style")].map((s) => s.textContent).join("\n"));
    assert.match(css, /@keyframes kw-a-fade-in-up\{/);
    assert.doesNotMatch(css, /@keyframes kw-a-(zoom-in|tada|bounce-in)\{/);
    await ctx.close();
    const plain = await publishPage("Mouvement — aucun", [heading(1, undefined)]);
    const p2 = await open(plain);
    assert.doesNotMatch(await p2.page.evaluate(() => [...document.querySelectorAll("style")].map((s) => s.textContent).join("\n")), /@keyframes kw-a-/);
    await p2.ctx.close();
  });

  test("paramètres réels : durée, délai, courbe, répétition (jamais infinie par défaut), direction", async () => {
    const url = await publishPage("Mouvement — paramètres", [
      heading(1, { entrance: "fade-in", duration: 1500, delay: 250, easing: "ease-in", iterations: 3, direction: "alternate" }),
      heading(2, { entrance: "pulse", iterations: "infinite" }),
      heading(3, { entrance: "fade-in", easing: "cubic-bezier(0.1, 0.2, 0.3, 1)", direction: "reverse" }),
      heading(4, { entrance: "fade-in" }),
    ]);
    const { ctx, page } = await open(url);
    const get = async (i) => { await scrollTo(page, nid(i)); return until(async () => { const r = await info(page, nid(i)); return r && r.names.length ? r : null; }, { what: `animation ${i}` }); };
    const a = await get(1);
    assert.equal(a.timing.duration, 1500); assert.equal(a.timing.delay, 250); assert.equal(a.timing.iterations, 3); assert.equal(a.timing.direction, "alternate");
    assert.equal(await page.evaluate((n) => getComputedStyle(document.querySelector(`.kw-n-${n}`)).animationTimingFunction, nid(1)), "ease-in");
    const b = await get(2); assert.equal(b.timing.iterations, Infinity, "infini seulement sur demande");
    const c = await get(3);
    assert.equal(c.timing.direction, "reverse");
    assert.equal(await page.evaluate((n) => getComputedStyle(document.querySelector(`.kw-n-${n}`)).animationTimingFunction, nid(3)), "cubic-bezier(0.1, 0.2, 0.3, 1)");
    const d = await get(4); assert.equal(d.timing.iterations, 1, "par défaut : une fois"); assert.equal(d.timing.direction, "normal");
    await ctx.close();
  });

  test("déclencheurs : visible (par défaut), chargement, clic ; « une seule fois » ou rejouée à chaque retour à l'écran", async () => {
    const url = await publishPage("Mouvement — déclencheurs", [
      { id: nid(1), type: "heading", props: { text: "Chargement", level: "2" }, styles: { desktop: { minHeight: "120vh" } }, motion: { entrance: "fade-in", trigger: "load" } },
      heading(2, { entrance: "fade-in-up" }),
      heading(3, { entrance: "fade-in-left", repeat: true }),
      { id: nid(4), type: "heading", props: { text: "Au clic", level: "2" }, motion: { entrance: "tada", trigger: "click" } },
    ]);
    const { ctx, page } = await open(url);
    // au chargement : joue sans défilement
    await until(async () => (await info(page, nid(1))).cls.includes("is-in"), { what: "animation au chargement" });
    // visible : ne joue pas tant que l'élément est hors de l'écran
    assert.equal((await info(page, nid(2))).cls.includes("is-in"), false);
    await scrollTo(page, nid(2));
    await until(async () => (await info(page, nid(2))).cls.includes("is-in"), { what: "animation quand visible" });
    await scrollTo(page, nid(3));
    await until(async () => (await info(page, nid(3))).cls.includes("is-in"), { what: "rejouable : jouée" });
    await scrollTo(page, nid(2)); await page.evaluate(() => window.scrollTo(0, 0)); await wait(200);
    await page.evaluate((n) => document.querySelector(`.kw-n-${n}`).scrollIntoView({ block: "end" }), nid(4)); // met 3 hors écran
    await wait(300);
    assert.equal((await info(page, nid(2))).cls.includes("is-in"), true, "une seule fois : reste à l'état final");
    // clic : visible avant, joue au clic
    assert.notEqual((await info(page, nid(4))).opacity, "0");
    assert.equal((await info(page, nid(4))).cls.includes("kw-ix-replay"), false);
    await page.evaluate((n) => document.querySelector(`.kw-n-${n}`).click(), nid(4)); // clic sur l'élément (le bandeau de la page peut le recouvrir en bas)
    await until(async () => { const r = await info(page, nid(4)); return r.names.includes("kw-a-tada"); }, { what: "animation au clic" });
    await ctx.close();
  });

  test("écrans : ordinateur Fade In Up, tablette Fade In, mobile aucune — résultat réel sur les trois largeurs", async () => {
    const url = await publishPage("Mouvement — écrans", [heading(1, { entrance: "fade-in-up", screens: { tablet: "fade-in", mobile: "none" } })]);
    const expected = [[{ width: 1300, height: 800 }, "kw-a-fade-in-up"], [{ width: 900, height: 800 }, "kw-a-fade-in"], [{ width: 420, height: 800 }, null]];
    for (const [viewport, name] of expected) {
      const { ctx, page } = await open(url, { viewport });
      await scrollTo(page, nid(1));
      await wait(250);
      const r = await info(page, nid(1));
      if (name) assert.ok(r.names.includes(name), `${viewport.width}px : ${name} attendu, obtenu ${r.names.join(",") || "rien"}`);
      else { assert.deepEqual(r.names, [], `${viewport.width}px : aucune animation`); assert.equal(r.opacity, "1", `${viewport.width}px : l'élément reste visible`); }
      await ctx.close();
    }
  });

  test("mouvement réduit : animations supprimées (ou fondu court), élément toujours visible ; « toujours animer » garde l'animation", async () => {
    const url = await publishPage("Mouvement — réduit", [
      heading(1, { entrance: "bounce-in-up" }),
      heading(2, { entrance: "tada" }),
      heading(3, { entrance: "bounce-in-up", alwaysMotion: true }),
    ]);
    const { ctx, page } = await open(url, { reduce: true });
    for (const i of [1, 2, 3]) await scrollTo(page, nid(i));
    await wait(300);
    const calm = await info(page, nid(1));
    assert.equal(calm.opacity === "1" || calm.names.join() === "kw-rm-fade", true, "visible, sans rebond");
    assert.ok(!calm.names.includes("kw-a-bounce-in-up"), "le rebond n'est pas joué");
    const attn = await info(page, nid(2));
    assert.deepEqual(attn.names, [], "attention : aucune animation");
    assert.notEqual(attn.opacity, "0");
    await scrollTo(page, nid(3));
    const forced = await until(async () => { const r = await info(page, nid(3)); return r.names.includes("kw-a-bounce-in-up") ? r : null; }, { what: "alwaysMotion : animation conservée" });
    assert.ok(forced);
    await ctx.close();
  });

  test("non destructif : le contenu, la structure et la mise en page de l'élément animé sont intacts", async () => {
    const url = await publishPage("Mouvement — non destructif", [heading(1, { entrance: "zoom-in" }), heading(2, undefined)]);
    const { ctx, page } = await open(url);
    await scrollTo(page, nid(1)); await wait(1200);
    const r = await page.evaluate(() => [1, 2].map((i) => { const el = document.querySelector(`.kw-n-an${String(i).padStart(10, "0")}`); const b = el.getBoundingClientRect(); return { text: el.textContent.trim(), h: Math.round(b.height), w: Math.round(b.width), tf: getComputedStyle(el).transform }; }));
    assert.equal(r[0].text, "Titre 1"); assert.equal(r[0].h, r[1].h); assert.equal(r[0].w, r[1].w);
    assert.equal(r[0].tf, "none", "après l'animation, plus aucune transformation résiduelle");
    await ctx.close();
  });
});
