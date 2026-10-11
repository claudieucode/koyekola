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

  // ---------- Défilement « de → à », souris, composition ----------
  const spacer = (i, vh) => ({ id: nid(i), type: "heading", props: { text: `Espace ${i}`, level: "3" }, styles: { desktop: { minHeight: `${vh}vh` } } });
  const target = (i, extra) => ({ id: nid(i), type: "heading", props: { text: "Cible", level: "2" }, styles: { desktop: { minHeight: "200px" } }, ...extra });
  const near = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg} : ${a} ≠ ${b} (± ${tol})`);
  // Place l'élément pour que sa progression brute dans la fenêtre vaille raw (0 = il entre par le bas, 1 = il sort par le haut)
  const at = (page, id, raw) => page.evaluate(([nodeId, r]) => { const el = document.querySelector(`.kw-n-${nodeId}`); const b = el.getBoundingClientRect(); const vh = innerHeight; window.scrollTo(0, scrollY + b.top - (vh - r * (vh + b.height))); // Sous forte charge de la machine, le moteur peut appliquer l'effet plusieurs images après le défilement : on attend une valeur stable (deux lectures identiques)
    const read = () => { const e = document.querySelector(`.kw-n-${nodeId}`); return e.style.translate + "|" + e.style.opacity + "|" + e.style.scale + "|" + e.style.rotate + "|" + e.style.filter; };
    const frame = () => new Promise((ok) => requestAnimationFrame(() => requestAnimationFrame(ok)));
    return (async () => { let last = null; for (let i = 0; i < 40; i++) { await frame(); await new Promise((ok) => setTimeout(ok, 30)); const now = read(); if (now === last) return; last = now; } })(); }, [id, raw]);
  const styleOfEl = (page, id) => page.evaluate((nodeId) => { const s = document.querySelector(`.kw-n-${nodeId}`).style; return { translate: s.translate, scale: s.scale, rotate: s.rotate, opacity: s.opacity, filter: s.filter }; }, id);
  const ty = (st) => Number((/(-?[\d.]+)px (-?[\d.]+)px/.exec(st.translate) || [0, 0, 0])[2]);

  test("défilement de → à : déplacement 0→200 px, opacité 0→1, échelle 1→1,5, rotation 0→90° suivent la progression réelle (début, milieu, fin)", async () => {
    const url = await publishPage("Mouvement — défilement", [spacer(1, 150), target(2, { motion: { scrollFx: { translateY: { from: 0, to: 200 }, opacity: { from: 0, to: 1 }, scale: { from: 1, to: 1.5 }, rotate: { from: 0, to: 90 } } } }), spacer(3, 200)]);
    const { ctx, page, errors } = await open(url);
    await at(page, nid(2), 0.01);
    let st = await styleOfEl(page, nid(2));
    near(Number(st.opacity), 0.01, 0.03, "opacité au début"); near(ty(st), 2, 6, "déplacement au début");
    await at(page, nid(2), 0.5);
    st = await styleOfEl(page, nid(2));
    near(ty(st), 100, 8, "déplacement au milieu"); near(Number(st.opacity), 0.5, 0.05, "opacité au milieu"); near(Number(st.scale), 1.25, 0.03, "échelle au milieu"); near(parseFloat(st.rotate), 45, 3, "rotation au milieu");
    await at(page, nid(2), 0.99);
    st = await styleOfEl(page, nid(2));
    near(ty(st), 198, 8, "déplacement à la fin"); near(Number(st.opacity), 0.99, 0.03, "opacité à la fin"); near(Number(st.scale), 1.5, 0.03, "échelle à la fin"); near(parseFloat(st.rotate), 90, 3, "rotation à la fin");
    // composition : translate, scale, rotate et opacity sont posés ENSEMBLE, sans écraser le « transform » de l'élément
    const css = await page.evaluate((n) => { const e = document.querySelector(`.kw-n-${n}`); const c = getComputedStyle(e); return { tf: c.transform, tr: c.translate, sc: c.scale, ro: c.rotate }; }, nid(2));
    assert.notEqual(css.tr, "none"); assert.notEqual(css.sc, "none"); assert.notEqual(css.ro, "none");
    assert.deepEqual(errors, []);
    await ctx.close();
  });

  test("défilement : zone de déclenchement (25 % → 75 %), inversion, et sens (vers le bas seulement : la valeur reste en place en remontant)", async () => {
    const win = await publishPage("Mouvement — zone", [spacer(1, 150), target(2, { motion: { scrollFx: { translateY: { from: 0, to: 100 }, start: 25, end: 75 } } }), spacer(3, 200)]);
    let { ctx, page } = await open(win);
    await at(page, nid(2), 0.1); assert.equal(ty(await styleOfEl(page, nid(2))), 0, "avant la zone : au départ");
    await at(page, nid(2), 0.5); near(ty(await styleOfEl(page, nid(2))), 50, 6, "milieu de la zone");
    await at(page, nid(2), 0.9); near(ty(await styleOfEl(page, nid(2))), 100, 4, "après la zone : à l'arrivée");
    await ctx.close();
    const inv = await publishPage("Mouvement — inversé", [spacer(1, 150), target(2, { motion: { scrollFx: { translateY: { from: 0, to: 100 }, invert: true } } }), spacer(3, 200)]);
    ({ ctx, page } = await open(inv));
    await at(page, nid(2), 0.2); near(ty(await styleOfEl(page, nid(2))), 80, 8, "inversé : 80 au lieu de 20");
    await ctx.close();
    const dir = await publishPage("Mouvement — sens", [spacer(1, 150), target(2, { motion: { scrollFx: { translateY: { from: 0, to: 100 }, dir: "down" } } }), spacer(3, 200)]);
    ({ ctx, page } = await open(dir));
    await at(page, nid(2), 0.2); await at(page, nid(2), 0.7);
    const down = ty(await styleOfEl(page, nid(2))); near(down, 70, 8, "en descendant : suit");
    await at(page, nid(2), 0.3); // on remonte : la valeur reste
    near(ty(await styleOfEl(page, nid(2))), down, 1, "en remontant : figée");
    await at(page, nid(2), 0.9); near(ty(await styleOfEl(page, nid(2))), 90, 8, "redescend : reprend");
    await ctx.close();
  });

  test("souris : déplacement ±40 px, rotation 3D et échelle suivent le curseur réel, lissés, et reviennent au centre", async () => {
    const url = await publishPage("Mouvement — souris", [{ id: nid(1), type: "heading", props: { text: "Souris", level: "2" }, motion: { mouseFx: { translateX: 40, translateY: -30, rotateY: 20, rotateX: 10, scale: 20, speed: 60 } } }]);
    const { ctx, page, errors } = await open(url);
    await page.mouse.move(1299, 400);
    const right = await until(async () => { const st = await styleOfEl(page, nid(1)); return parseFloat(st.translate) > 35 ? st : null; }, { what: "suit le curseur à droite" });
    near(parseFloat(right.translate), 40, 3, "x à droite"); assert.ok(right.rotate && right.rotate !== "0deg", "rotation 3D posée"); assert.ok(Number(right.scale) > 1.1, "échelle");
    await page.mouse.move(1299, 799); // coin : rotations X et Y ensemble → une seule rotation composée (axe + angle)
    const corner = await until(async () => { const st = await styleOfEl(page, nid(1)); return /^[-\d.]+ [-\d.]+ [-\d.]+ [-\d.]+deg$/.test(st.rotate) ? st : null; }, { what: "rotations X et Y composées en une seule propriété" });
    assert.ok(corner);
    await page.mouse.move(0, 400);
    await until(async () => { const st = await styleOfEl(page, nid(1)); return parseFloat(st.translate) < -35 ? st : null; }, { what: "suit le curseur à gauche" });
    await page.mouse.move(650, 400);
    await until(async () => { const st = await styleOfEl(page, nid(1)); return Math.abs(parseFloat(st.translate || "0")) < 1 ? st : null; }, { what: "revient au repos au centre" });
    assert.deepEqual(errors, []);
    await ctx.close();
  });

  test("composition : une animation d'entrée garde la transformation propre de l'élément (rotation 10°) pendant et après son mouvement", async () => {
    const url = await publishPage("Mouvement — composition", [{ id: nid(1), type: "heading", props: { text: "Tourné", level: "2" }, styles: { desktop: { transform: { rotate: 10 } } }, motion: { entrance: "fade-in-up", duration: 2000 } }]);
    const { ctx, page } = await open(url);
    await wait(500);
    const mid = await page.evaluate((n) => new DOMMatrix(getComputedStyle(document.querySelector(`.kw-n-${n}`)).transform), nid(1));
    assert.ok(mid.b > 0.1, `pendant l'animation, la rotation de 10° est conservée (b = ${mid.b})`);
    assert.ok(Math.abs(mid.f) > 1, `et le mouvement s'y ajoute (f = ${mid.f})`);
    await wait(2200);
    const end = await page.evaluate((n) => new DOMMatrix(getComputedStyle(document.querySelector(`.kw-n-${n}`)).transform), nid(1));
    near(end.b, Math.sin(10 * Math.PI / 180), 0.01, "à la fin : exactement la rotation d'origine"); near(end.f, 0, 0.5, "plus de décalage");
    await ctx.close();
  });

  // ---------- Épinglage (position: sticky réel) ----------
  const stickyBox = (i, st, extra = {}) => ({ id: nid(i), type: "container", props: {}, styles: { desktop: { minHeight: "120px", alignSelf: "flex-start", ...st } }, children: [{ id: nid(i + 50), type: "heading", props: { text: "Épinglé", level: "3" } }], ...extra });
  const rectTop = (page, i) => page.evaluate((n) => Math.round(document.querySelector(`.kw-n-${n}`).getBoundingClientRect().top), nid(i));
  const rectBottom = (page, i) => page.evaluate((n) => Math.round(document.querySelector(`.kw-n-${n}`).getBoundingClientRect().bottom), nid(i));

  test("épinglage réel : en haut (distance 20 px) puis en bas, dans un conteneur Flexbox, une Grille et des conteneurs imbriqués ; z-index appliqué", async () => {
    const flex = { id: nid(1), type: "container", props: {}, styles: { desktop: { display: "flex", flexDirection: "row", minHeight: "250vh" } }, children: [stickyBox(2, { position: "sticky", top: "20px", zIndex: 7 })] };
    const grid = { id: nid(3), type: "grid", props: {}, styles: { desktop: { columns: 2, minHeight: "250vh" } }, children: [
      { id: nid(4), type: "container", props: {}, styles: { desktop: { minHeight: "250vh" } }, children: [stickyBox(5, { position: "sticky", top: "30px" })] },
      { id: nid(6), type: "container", props: {}, styles: { desktop: { minHeight: "100px" } }, children: [] }] };
    const nested = { id: nid(7), type: "container", props: {}, styles: { desktop: { minHeight: "250vh" } }, children: [{ id: nid(8), type: "container", props: {}, styles: { desktop: { minHeight: "240vh" } }, children: [spacer(60, 150), stickyBox(9, { position: "sticky", bottom: "20px" })] }] };
    const url = await publishPage("Mouvement — épinglage", [flex, grid, nested]);
    const { ctx, page, errors } = await open(url);
    await page.evaluate((n) => window.scrollTo(0, document.querySelector(`.kw-n-${n}`).getBoundingClientRect().top + scrollY + 600), nid(1));
    await wait(200);
    near(await rectTop(page, 2), 20, 2, "Flexbox : épinglé à 20 px du haut");
    assert.equal(await page.evaluate((n) => getComputedStyle(document.querySelector(`.kw-n-${n}`)).zIndex, nid(2)), "7", "z-index appliqué");
    await page.evaluate((n) => window.scrollTo(0, document.querySelector(`.kw-n-${n}`).getBoundingClientRect().top + scrollY + 500), nid(3));
    await wait(200);
    near(await rectTop(page, 5), 30, 2, "Grille : épinglé à 30 px");
    await page.evaluate((n) => window.scrollTo(0, document.querySelector(`.kw-n-${n}`).getBoundingClientRect().top + scrollY + 50), nid(7)); // l'élément, placé bien plus bas dans le conteneur, est retenu à 20 px du bas de la fenêtre
    await wait(200);
    near(await rectBottom(page, 9), 800 - 20, 3, "imbriqué : épinglé à 20 px du bas");
    assert.deepEqual(errors, []);
    await ctx.close();
  });

  test("épinglage par écran : ordinateur épinglé, tablette libre, mobile épinglé — résultat réel sur les trois largeurs", async () => {
    const sticky = { id: nid(2), type: "container", props: {}, styles: { desktop: { minHeight: "120px", alignSelf: "flex-start", position: "sticky", top: "10px" }, tablet: { position: "static" }, mobile: { position: "sticky", top: "10px" } }, children: [{ id: nid(52), type: "heading", props: { text: "Épinglé", level: "3" } }] };
    const url = await publishPage("Mouvement — épinglage écrans", [{ id: nid(1), type: "container", props: {}, styles: { desktop: { display: "flex", minHeight: "250vh" } }, children: [sticky] }]);
    for (const [width, expectSticky] of [[1300, true], [900, false], [420, true]]) {
      const { ctx, page } = await open(url, { viewport: { width, height: 800 } });
      await page.evaluate(() => window.scrollTo(0, 700)); await wait(200);
      const pos = await page.evaluate((n) => getComputedStyle(document.querySelector(`.kw-n-${n}`)).position, nid(2));
      assert.equal(pos, expectSticky ? "sticky" : "static", `${width}px`);
      const top = await rectTop(page, 2);
      if (expectSticky) near(top, 10, 2, `${width}px : reste en haut`); else assert.ok(top < -100, `${width}px : défile avec la page (top ${top})`);
      await ctx.close();
    }
  });

  test("aperçu de l'éditeur : l'animation d'entrée et le défilement fonctionnent sur le brouillon (sans publier)", async () => {
    const id = Number((await boss.post("/marketing/pages", { name: "Mouvement — aperçu" })).location.match(/(\d+)$/)[1]);
    const rev = db().prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(id).revision;
    const kids = [spacer(1, 120), { id: nid(2), type: "heading", props: { text: "Aperçu", level: "2" }, styles: { desktop: { minHeight: "200px" } }, motion: { entrance: "zoom-in-up", scrollFx: { translateY: { from: 0, to: 80 } } } }, spacer(3, 150)];
    assert.equal((await boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", json: { revision: rev, content: { sections: [{ id: "sect00000001", type: "layout", children: kids }] } }, headers: { Origin: srv.base } })).status, 200);
    const ctx = await browser.newContext({ viewport: { width: 1300, height: 800 } });
    await ctx.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    const page = await ctx.newPage();
    await page.goto(`${srv.base}/marketing/pages/${id}/apercu`);
    await scrollTo(page, nid(2));
    const r = await until(async () => { const x = await info(page, nid(2)); return x && x.names.includes("kw-a-zoom-in-up") ? x : null; }, { what: "animation d'entrée dans l'aperçu" });
    assert.ok(r.keyframes >= 2);
    await at(page, nid(2), 0.5);
    near(ty(await styleOfEl(page, nid(2))), 40, 6, "défilement dans l'aperçu");
    await ctx.close();
  });

  test("performance : 150 éléments animés (entrée + défilement + souris), défilement et souris continus, aucune erreur ; au repos plus aucune boucle ; destroy() ne laisse rien", async () => {
    const kids = [];
    for (let i = 1; i <= 150; i++) kids.push({ id: nid(i), type: "heading", props: { text: `Élément ${i}`, level: "3" }, styles: { desktop: { minHeight: "30vh" } },
      motion: { entrance: ids[i % 40], ...(i % 3 === 0 ? { scrollFx: { translateY: { from: -30, to: 30 }, opacity: { from: 0.4, to: 1 } } } : {}), ...(i % 5 === 0 ? { mouseFx: { translateX: 20, rotateY: 8 } } : {}) } });
    const url = await publishPage("Mouvement — performance", kids);
    const ctx = await browser.newContext({ viewport: { width: 1300, height: 800 } });
    const page = await ctx.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => { if (m.type() === "error" && !/favicon|Failed to load resource/.test(m.text())) errors.push(m.text()); });
    await page.addInitScript(() => { window.__raf = 0; const orig = window.requestAnimationFrame.bind(window); window.requestAnimationFrame = (cb) => { window.__raf++; return orig(cb); }; });
    await page.goto(url);
    const t0 = Date.now();
    const frames = await page.evaluate(async () => {
      let worst = 0, last = performance.now(), n = 0;
      await new Promise((done) => { let y = 0; const step = () => { y += 220; window.scrollTo(0, y); const now = performance.now(); worst = Math.max(worst, now - last); last = now; n++; if (y < document.body.scrollHeight - innerHeight) requestAnimationFrame(step); else done(); }; requestAnimationFrame(step); });
      return { worst: Math.round(worst), n };
    });
    for (let i = 0; i < 30; i++) await page.mouse.move(100 + i * 35, 100 + (i % 7) * 90);
    assert.ok(Date.now() - t0 < 25000, "parcours complet raisonnable");
    assert.ok(frames.worst < 600, `aucun gel de la page (pire image : ${frames.worst} ms)`);
    // au repos : plus de boucle d'animation
    await wait(1200);
    const idle = await page.evaluate(async () => { const a = window.__raf; await new Promise((r) => setTimeout(r, 700)); return window.__raf - a; });
    assert.ok(idle <= 5, `au repos, aucune boucle (${idle} appels)`);
    // destroy : tous les styles de mouvement sont retirés, plus d'écouteurs
    const left = await page.evaluate(() => { const inst = window.kwEffectsInstance; const n = inst.records.length; inst.destroy(); return { n, dirty: [...document.querySelectorAll("[data-kw-sfx],[data-kw-mfx]")].filter((e) => e.style.translate || e.style.rotate || e.style.scale || e.style.filter).length }; });
    assert.ok(left.n >= 50, `${left.n} éléments suivis`); assert.equal(left.dirty, 0, "destroy() retire tout");
    assert.deepEqual(errors, []);
    await ctx.close();
  });
});
