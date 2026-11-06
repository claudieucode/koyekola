// Motion Studio, lot 3 (timeline), dans un VRAI Chrome : scènes publiées (charger / visible / clic / défilement, écrans, mouvement réduit, sans JavaScript, 320 / 768 / 1920),
// transitions de page (API View Transitions entre deux documents) et de sections, défilement fluide (molette, ancres, collant, mouvement réduit, magnétisme),
// puis l'éditeur : création de scène, pistes, pas, durée / délai / courbe / synchronisation, glisser, réordonner, lecture / pause / reprise / arrêt, enregistrement, annulation.
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
const until = async (fn, what, ms = 15000) => { const end = Date.now() + ms; for (;;) { let v = false; try { v = await fn(); } catch { /* on réessaie */ } if (v) return v; if (Date.now() > end) throw new Error(`Délai dépassé : ${what}`); await wait(100); } };

// Trace des animations demandées (avant tout script de la page) : élément, images-clés, durée, délai
const SPY = () => {
  window.__anims = [];
  const o = Element.prototype.animate;
  Element.prototype.animate = function (f, opts) {
    const a = o.call(this, f, opts);
    try { window.__anims.push({ cls: String(this.className), frames: JSON.stringify(f), duration: opts && opts.duration, delay: opts && opts.delay, composite: opts && opts.composite, fill: opts && opts.fill }); } catch (e) { /* trace au mieux */ }
    return a;
  };
  addEventListener("pagereveal", (e) => { try { sessionStorage.setItem("__vt", e.viewTransition ? "vt" : "none"); } catch (x) { /* rien */ } });
};

describe("Motion Studio : timeline, transitions, défilement fluide (Chrome réel)", { skip: SKIP }, () => {
  let srv, boss, db, browser, slug = {}, editId;
  const head = (id, text, level = "2") => ({ id, type: "heading", props: { text, level } });
  const spacer = (id) => ({ id, type: "spacer", props: { size: "128" } });
  const spacers = (p, n) => Array.from({ length: n }, (_, i) => spacer(`${p}${String(i + 1).padStart(3, "0")}`));
  const step = (id, target, extra = {}) => ({ id, target, ...extra });

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" }); boss = await loginInstructor(srv); db = srv.db();
    const mk = async (name, sections, theme, publish = true) => {
      const id = Number((await boss.post("/marketing/pages", { name })).location.match(/(\d+)$/)[1]);
      const rev = db.prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(id).revision;
      const r = await boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", json: { revision: rev, content: { sections, ...(theme ? { theme } : {}) } }, headers: { Origin: srv.base } });
      assert.equal(r.status, 200, r.text.slice(0, 300));
      if (publish) assert.equal((await boss.request(`/marketing/pages/${id}/publier.json`, { method: "POST", json: {}, headers: { Origin: srv.base } })).status, 200);
      slug[name] = db.prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(id).slug;
      return id;
    };
    const layout = (id, children) => ({ id, type: "layout", children: [{ id: id + "b", type: "container", props: {}, children }] });
    // ----- scènes publiées
    await mk("scenes", [layout("sect00000001", [
      head("tlh1000001", "Titre d'accueil", "1"), head("tltx000001", "Sous-titre"), { id: "tlclick0001", type: "button", props: { label: "Cliquer ici", url: "/x", variant: "primary" } },
      head("tlout000001", "Message à faire disparaître", "3"), ...spacers("spa", 6),
      head("tlview00001", "Visible plus bas"), head("tlview00002", "Suite plus bas"), ...spacers("spb", 6),
      head("tlscrl00001", "Selon le défilement"), head("tlmob000001", "Coupé sur mobile"), spacer("spc000000001"),
    ])], {
      motionScenes: { v: 1, scenes: [
        { id: "scload0001", name: "Entrée", trigger: "load", steps: [step("sl000001", "tlh1000001", { effect: "slide-up", duration: 600 }), step("sl000002", "tltx000001", { sync: "sl000001", delay: 150, effect: "fade-in" })] },
        { id: "scview0001", name: "Plus bas", trigger: "viewport", anchor: "tlview00001", steps: [step("sv000001", "tlview00001", { effect: "slide-up" }), step("sv000002", "tlview00002", { after: "sv000001", effect: "fade-in" })] },
        { id: "scclick001", name: "Clic", trigger: "click", anchor: "tlclick0001", steps: [step("sc000001", "tlout000001", { effect: "fade-out", duration: 300 })] },
        { id: "scscrol001", name: "Défilement", trigger: "scroll", steps: [step("ss000001", "tlscrl00001", { effect: "slide-up", duration: 1000 })] },
        { id: "scmob00001", name: "Pas sur mobile", trigger: "load", off: ["mobile"], steps: [step("sm000001", "tlmob000001", { effect: "pop" })] },
      ] },
    });
    // ----- défilement fluide
    const longPage = (extra) => [layout("sect00000001", [
      head("smtop000001", "Haut de page", "1"), { id: "smlink00001", type: "button", props: { label: "Aller en bas", url: "#bas", variant: "primary" } },
      { id: "smstick0001", type: "container", props: {}, styles: { desktop: { position: "sticky", top: "16px", zIndex: 20 } }, children: [head("smstick0002", "Collant")] },
      ...spacers("sma", 14), { ...head("smbas000001", "Section du bas"), anchor: "bas" }, ...spacers("smb", 8),
    ]), ...(extra || [])];
    await mk("fluide", longPage(), { motionScenes: { v: 1, smoothScroll: { on: true, strength: 7 } } });
    await mk("simple", longPage(), undefined);
    await mk("magnet", longPage(), { motionScenes: { v: 1, smoothScroll: { on: true } }, scrollSnap: { position: "start" } });
    // ----- transitions de page et de sections
    await mk("trans-a", [layout("sect00000001", [head("tra000000001", "Page A"), { id: "trlink00001", type: "button", props: { label: "Vers B", url: "/p/trans-b", variant: "primary" } }, { id: "trlink00002", type: "button", props: { label: "Vers C", url: "/p/trans-c", variant: "primary" } }])], { motionScenes: { v: 1, pageTransition: { type: "fade", duration: 300 } } });
    await mk("trans-b", [layout("sect00000001", [head("trb000000001", "Page B")])], { motionScenes: { v: 1, pageTransition: { type: "slide", duration: 300 } } });
    await mk("trans-c", [layout("sect00000001", [head("trc000000001", "Page C")])], { motionScenes: { v: 1, pageTransition: { type: "off" } } });
    await mk("sections", [layout("sect00000001", [head("sx1000000001", "Première section"), ...spacers("sxa", 6)]), layout("sect00000002", [head("sx2000000001", "Deuxième section"), ...spacers("sxb", 6)]), layout("sect00000003", [head("sx3000000001", "Troisième section"), ...spacers("sxc", 6)])], { motionScenes: { v: 1, sectionTransition: { type: "wipe-up", duration: 500 } } });
    // ----- éditeur
    editId = await mk("editeur", [layout("sect00000001", [head("edh1000001", "Titre à animer", "1"), head("edtx000001", "Texte à animer"), { id: "edbtn000001", type: "button", props: { label: "Bouton", url: "/x", variant: "primary" } }])], undefined, false);
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
  });
  after(async () => { if (browser) await browser.close(); if (srv) await srv.stop(); });

  const open = async (name, opts = {}, { js = true } = {}) => {
    const ctx = await browser.newContext({ viewport: { width: 1200, height: 700 }, javaScriptEnabled: js, ...opts });
    const page = await ctx.newPage(); const errs = [];
    page.on("pageerror", (e) => errs.push(e.message));
    if (js) await page.addInitScript(SPY);
    await page.goto(`${srv.base}/p/${slug[name]}`, { waitUntil: "load" });
    // Chrome sans écran (machine chargée) ne produit pas d'image tant que rien ne l'y oblige : sans cela la ligne de temps des animations ne démarre pas
    await page.screenshot({ type: "jpeg", quality: 1 }).catch(() => {});
    return { page, ctx, errs };
  };
  const sel = (id) => `.kw-n-${id}`;
  const cs = (page, id, prop) => page.evaluate(([s, p]) => getComputedStyle(document.querySelector(s))[p], [sel(id), prop]);
  const logs = (page, id) => page.evaluate((id) => window.__anims.filter((a) => a.cls.includes("kw-n-" + id)), id);
  const noOverflow = (page) => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1);
  const ready = (page) => until(() => page.evaluate(() => window.kwMotionStudio && window.__anims.length > 0), "scènes démarrées");

  // ---------------------------------------------------------------- scènes publiées
  test("scène « au chargement » : pas de la timeline joués (effet, durée, délai de synchronisation), fin à l'état naturel, aucune erreur", async () => {
    const { page, errs } = await open("scenes");
    await until(async () => (await logs(page, "tlh1000001")).length > 0, "animation du titre");
    const h1 = await logs(page, "tlh1000001"), tx = await logs(page, "tltx000001");
    assert.ok(h1.some((a) => a.composite === "add" && /translateY\(40px\)/.test(a.frames) && a.duration === 600 && a.delay === 0 && a.fill === "both"), JSON.stringify(h1));
    assert.ok(tx.some((a) => a.delay === 150 && /"opacity":0/.test(a.frames)), "le sous-titre part 150 ms après le titre (pas synchronisé)");
    await until(async () => (await cs(page, "tlh1000001", "transform")) === "none" && (await cs(page, "tlh1000001", "opacity")) === "1" && (await page.evaluate((s) => document.querySelector(s).getAnimations().length, sel("tlh1000001"))) === 0, "fin à l'état naturel", 10000);
    assert.deepEqual(errs, []); await page.context().close();
  });
  test("scène « quand l'élément est visible » : état de départ tenu hors écran, jouée à l'arrivée, pas enchaîné à la suite du premier", async () => {
    const { page, errs } = await open("scenes");
    await ready(page);
    assert.equal(await cs(page, "tlview00001", "opacity"), "0", "départ tenu tant que l'élément n'est pas visible");
    await page.locator(sel("tlview00001")).scrollIntoViewIfNeeded();
    const second = await until(async () => (await logs(page, "tlview00002")).find((a) => /"opacity":0/.test(a.frames)), "pas suivant");
    assert.equal(second.delay, 600, "« à la suite » : démarre à la fin du premier (600 ms)");
    await until(async () => (await cs(page, "tlview00001", "opacity")) === "1" && (await cs(page, "tlview00002", "opacity")) === "1", "fin des deux pas", 12000);
    assert.deepEqual(errs, []); await page.context().close();
  });
  test("scène « au clic » : contenu visible avant, l'effet de sortie se joue au clic et laisse l'état final", async () => {
    const { page, errs } = await open("scenes");
    await ready(page);
    assert.equal(await cs(page, "tlout000001", "opacity"), "1");
    await page.evaluate(() => document.querySelector(".kw-n-tlclick0001").addEventListener("click", (e) => e.preventDefault(), true));
    await page.locator(sel("tlclick0001")).scrollIntoViewIfNeeded(); await page.locator(sel("tlclick0001")).click();
    await until(async () => (await cs(page, "tlout000001", "opacity")) === "0", "disparition", 8000);
    assert.deepEqual(errs, []); await page.context().close();
  });
  test("scène « selon le défilement » : l'avancement suit la position de la page (arrière comme avant)", async () => {
    const { page, errs } = await open("scenes");
    await ready(page);
    const t = () => page.evaluate((s) => { const a = document.querySelector(s).getAnimations()[0]; return a ? Math.round(a.currentTime) : -1; }, sel("tlscrl00001"));
    await page.evaluate(() => scrollTo(0, 0)); await wait(200); const t0 = await t();
    await page.locator(sel("tlscrl00001")).scrollIntoViewIfNeeded(); await page.mouse.wheel(0, 120); await wait(400);
    const t1 = await t(); assert.ok(t1 > t0, `${t0} -> ${t1}`);
    await page.mouse.wheel(0, -200); await wait(400);
    assert.ok((await t()) < t1, "recule avec le défilement");
    assert.deepEqual(errs, []); await page.context().close();
  });
  test("écrans : la scène coupée sur mobile ne s'applique pas à 375 px (contenu intact), s'applique sur ordinateur ; 320 / 768 / 1920 sans débordement", async () => {
    const d = await open("scenes");
    await ready(d.page);
    assert.ok((await logs(d.page, "tlmob000001")).length > 0, "active sur ordinateur");
    for (const w of [320, 768, 1920]) { await d.page.setViewportSize({ width: w, height: 800 }); await wait(400); assert.ok(await noOverflow(d.page), `débordement à ${w}px`); }
    assert.deepEqual(d.errs, []); await d.ctx.close();
    const m = await open("scenes", { viewport: { width: 375, height: 800 } });
    await until(async () => (await logs(m.page, "tlh1000001")).length > 0, "autres scènes actives");
    assert.equal((await logs(m.page, "tlmob000001")).length, 0, "coupée sur mobile");
    assert.equal(await cs(m.page, "tlmob000001", "opacity"), "1");
    assert.deepEqual(m.errs, []); await m.ctx.close();
  });
  test("mouvement réduit : aucune animation visible (états finaux) ; l'entrée reste visible, la sortie est appliquée sans animation ; sans JavaScript tout est lisible", async () => {
    const { page, errs } = await open("scenes", { reducedMotion: "reduce" });
    await until(() => page.evaluate(() => !!window.kwMotionStudio), "runtime");
    await wait(500);
    for (const id of ["tlh1000001", "tltx000001", "tlview00001", "tlscrl00001", "tlmob000001"]) assert.equal(await cs(page, id, "opacity"), "1", id);
    assert.ok((await page.evaluate(() => window.__anims.filter((a) => a.duration > 1 && /kw-n-(tlh1|tltx|tlview|tlscrl|tlmob)/.test(a.cls)).length)) === 0, "aucune animation de durée > 1 ms sur les entrées");
    await page.evaluate(() => document.querySelector(".kw-n-tlclick0001").addEventListener("click", (e) => e.preventDefault(), true));
    await page.locator(sel("tlclick0001")).scrollIntoViewIfNeeded(); await page.locator(sel("tlclick0001")).click();
    await until(async () => (await cs(page, "tlout000001", "opacity")) === "0", "état final de la sortie");
    const out = await logs(page, "tlout000001"); assert.ok(out.length > 0 && out.every((a) => a.duration <= 1), JSON.stringify(out));
    assert.deepEqual(errs, []); await page.context().close();
    const nojs = await open("scenes", {}, { js: false });
    for (const id of ["tlh1000001", "tltx000001", "tlview00001", "tlout000001", "tlscrl00001", "tlmob000001"]) assert.equal(await cs(nojs.page, id, "opacity"), "1", `sans JS : ${id}`);
    assert.equal((await nojs.page.textContent(sel("tlh1000001"))).trim(), "Titre d'accueil");
    await nojs.ctx.close();
  });

  // ---------------------------------------------------------------- défilement fluide
  const scrollY = (page) => page.evaluate(() => Math.round(scrollY));
  test("défilement fluide activé : la molette est lissée (positions intermédiaires, arrivée exacte), le collant reste collé", async () => {
    const { page, errs } = await open("fluide");
    await until(() => page.evaluate(() => document.documentElement.getAttribute("data-kw-smooth") === "on"), "défilement fluide actif");
    await page.mouse.move(600, 400);
    await page.evaluate(() => { window.__s = []; (function f() { window.__s.push(scrollY); requestAnimationFrame(f); })(); });
    await page.mouse.wheel(0, 800); await wait(1800);
    const s = await page.evaluate(() => window.__s);
    const mid = [...new Set(s)].filter((v) => v > 0 && v < 800);
    assert.ok(mid.length >= 4, `positions intermédiaires : ${mid.length}`);
    assert.ok(s.every((v, i) => i === 0 || v >= s[i - 1]), "progression monotone");
    assert.ok(Math.abs(s[s.length - 1] - 800) <= 1, `arrivée ${s[s.length - 1]}`);
    const top = await page.evaluate(() => document.querySelector(".kw-n-smstick0001").getBoundingClientRect().top);
    assert.ok(Math.abs(top - 16) <= 1, `élément collant à ${top}px`);
    assert.deepEqual(errs, []); await page.context().close();
  });
  test("défilement fluide : clavier / barre (saut natif) puis molette repartent de la vraie position ; molette dans une zone qui défile seule laissée à elle", async () => {
    const { page } = await open("fluide");
    await until(() => page.evaluate(() => document.documentElement.getAttribute("data-kw-smooth") === "on"), "actif");
    await page.mouse.move(600, 400); await page.keyboard.press("End"); await wait(900);
    const end = await scrollY(page); assert.ok(end > 1000);
    await page.mouse.wheel(0, -300); await wait(1500);
    const after = await scrollY(page); assert.ok(Math.abs(after - (end - 300)) <= 2, `${end} -> ${after}`);
    await page.context().close();
  });
  test("défilement fluide : un lien vers une ancre de la page défile en douceur jusqu'à la cible, met à jour l'adresse et le focus", async () => {
    const { page, errs } = await open("fluide");
    await until(() => page.evaluate(() => document.documentElement.getAttribute("data-kw-smooth") === "on"), "actif");
    await page.evaluate(() => { window.__s = []; (function f() { window.__s.push(scrollY); requestAnimationFrame(f); })(); });
    await page.locator(sel("smlink00001")).click(); await wait(2500);
    const info = await page.evaluate(() => { const t = document.getElementById("bas"); return { hash: location.hash, top: Math.round(t.getBoundingClientRect().top), samples: [...new Set(window.__s)].length, focus: document.activeElement === t }; });
    assert.equal(info.hash, "#bas"); assert.ok(Math.abs(info.top) <= 2 || info.top === 0 || (await page.evaluate(() => scrollY + innerHeight >= document.documentElement.scrollHeight - 2)), `cible à ${info.top}px`);
    assert.ok(info.samples >= 5, `défilement animé (${info.samples} positions)`); assert.ok(info.focus, "focus sur la cible");
    assert.deepEqual(errs, []); await page.context().close();
  });
  test("désactivé par défaut ; jamais actif en mouvement réduit ni avec le magnétisme de défilement", async () => {
    for (const [name, opts] of [["simple", {}], ["fluide", { reducedMotion: "reduce" }], ["magnet", {}]]) {
      const { page, errs } = await open(name, opts); await wait(900);
      assert.equal(await page.evaluate(() => document.documentElement.getAttribute("data-kw-smooth")), null, `${name} ${JSON.stringify(opts)}`);
      const wheelDefault = await page.evaluate(() => new Promise((res) => { let blocked = false; addEventListener("wheel", (e) => { blocked = e.defaultPrevented; }); dispatchEvent(new WheelEvent("wheel", { deltaY: 100, cancelable: true })); setTimeout(() => res(blocked), 50); }));
      assert.equal(wheelDefault, false, "la molette n'est jamais interceptée");
      assert.deepEqual(errs, []); await page.context().close();
    }
    // bascule du mouvement réduit en cours de visite : le lissage s'arrête
    const { page } = await open("fluide");
    await until(() => page.evaluate(() => document.documentElement.getAttribute("data-kw-smooth") === "on"), "actif");
    await page.emulateMedia({ reducedMotion: "reduce" });
    await until(() => page.evaluate(() => document.documentElement.getAttribute("data-kw-smooth") === null), "arrêté après préférence de mouvement réduit");
    await page.context().close();
  });

  // ---------------------------------------------------------------- transitions
  test("transition de page : les deux pages la déclarent → transition de vue réelle ; « aucune » ou mouvement réduit → navigation ordinaire", async () => {
    const probe = await open("trans-a");
    const supported = await probe.page.evaluate(() => typeof CSSViewTransitionRule !== "undefined");
    assert.match(await probe.page.evaluate(() => document.getElementById("kw-page-transition").textContent), /@view-transition\{navigation:auto\}/);
    assert.ok(await probe.page.evaluate(() => [...document.styleSheets].some((s) => [...s.cssRules].some((r) => r.cssText.includes("view-transition")))), "règle lue par le navigateur");
    if (!supported) { await probe.ctx.close(); return; } // navigateur sans API : amélioration progressive, navigation ordinaire (rien à vérifier de plus)
    await probe.page.evaluate(() => sessionStorage.removeItem("__vt"));
    await Promise.all([probe.page.waitForURL(/trans-b/), probe.page.locator(sel("trlink00001")).click()]);
    await until(() => probe.page.evaluate(() => sessionStorage.getItem("__vt")), "pagereveal");
    assert.equal(await probe.page.evaluate(() => sessionStorage.getItem("__vt")), "vt", "transition de vue entre A et B");
    await probe.page.goBack(); await probe.page.evaluate(() => sessionStorage.removeItem("__vt"));
    await Promise.all([probe.page.waitForURL(/trans-c/), probe.page.locator(sel("trlink00002")).click()]);
    await until(() => probe.page.evaluate(() => sessionStorage.getItem("__vt")), "pagereveal C");
    assert.equal(await probe.page.evaluate(() => sessionStorage.getItem("__vt")), "none", "page C : transition désactivée");
    assert.equal(await probe.page.textContent(sel("trc000000001")), "Page C");
    assert.deepEqual(probe.errs.filter((m) => !/Transition was skipped/.test(m)), [], "(une transition de vue annulée par le navigateur sans écran visible n'est pas une erreur de la page)"); await probe.ctx.close();
    const rm = await open("trans-a", { reducedMotion: "reduce" });
    await Promise.all([rm.page.waitForURL(/trans-b/), rm.page.locator(sel("trlink00001")).click()]);
    await until(() => rm.page.evaluate(() => sessionStorage.getItem("__vt")), "pagereveal (mouvement réduit)");
    assert.equal(await rm.page.evaluate(() => sessionStorage.getItem("__vt")), "none", "mouvement réduit : aucune transition");
    await rm.ctx.close();
  });
  test("une page sans réglage n'a ni feuille de transition ni règle de vue (comportement inchangé)", async () => {
    const { page } = await open("simple");
    assert.equal(await page.evaluate(() => document.getElementById("kw-page-transition")), null);
    await page.context().close();
  });
  test("transition des sections : la première (visible) n'est jamais masquée, les suivantes se révèlent à l'arrivée ; réduit / sans JS : tout visible", async () => {
    const { page, errs } = await open("sections");
    await ready(page);
    assert.equal(await page.evaluate(() => getComputedStyle(document.querySelector(".lp-main > :nth-child(1)")).clipPath), "none");
    assert.notEqual(await page.evaluate(() => getComputedStyle(document.querySelector(".lp-main > :nth-child(3)")).clipPath), "none", "section 3 : départ tenu hors écran");
    assert.ok(await page.evaluate(() => window.__anims.some((a) => /clipPath/.test(a.frames) && a.duration === 500)), "effet « révélation » de 500 ms");
    await page.locator(sel("sx3000000001")).scrollIntoViewIfNeeded();
    await until(() => page.evaluate(() => getComputedStyle(document.querySelector(".lp-main > :nth-child(3)")).clipPath === "none"), "section révélée puis animation retirée", 10000);
    assert.deepEqual(errs, []); await page.context().close();
    const rm = await open("sections", { reducedMotion: "reduce" }); await wait(600);
    assert.equal(await rm.page.evaluate(() => getComputedStyle(document.querySelector(".lp-main > :nth-child(3)")).clipPath), "none");
    assert.equal(await rm.page.evaluate(() => window.__anims.length), 0, "aucune animation");
    await rm.ctx.close();
    const nojs = await open("sections", {}, { js: false });
    assert.equal(await nojs.page.evaluate(() => getComputedStyle(document.querySelector(".lp-main > :nth-child(3)")).clipPath), "none");
    await nojs.ctx.close();
  });

  // ---------------------------------------------------------------- éditeur
  test("éditeur : créer une scène, pistes et pas, durée / délai / courbe / synchronisation, glisser, réordonner, lire / pause / reprendre / arrêter, enregistrement réel, annulation", { timeout: 300000 }, async () => {
    const ctx = await browser.newContext({ viewport: { width: 1700, height: 1000 } });
    await ctx.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    const page = await ctx.newPage(); const errs = [];
    page.on("pageerror", (e) => errs.push(e.message));
    await page.goto(`${srv.base}/marketing/pages/${editId}/editeur`);
    await page.waitForFunction(() => { const f = document.querySelector("[data-pb-frame]"); return f && f.contentDocument && f.contentDocument.body && f.contentDocument.body.classList.contains("lp-builder") && window.__pb; }, null, { timeout: 60000 });
    await wait(800);
    const doc = () => page.evaluate(() => window.__pb.content());
    const ms = async () => ((await doc()).theme || {}).motionScenes || null;
    const settle = () => page.waitForFunction(() => !window.__pb.dirty(), null, { timeout: 30000 });
    await page.click("#pb-tab-page"); await wait(300);
    await page.evaluate(() => { const d = document.querySelector('[data-pb-page-settings] details[data-group="ms-scenes"]'); if (d) d.open = true; });
    const root = '[data-pb-page-settings] [data-ms-timeline]';
    await page.waitForSelector(`${root} [data-tl-act="scene-add"]`, { timeout: 15000 });
    // canevas vierge de scène : aucune donnée
    assert.equal(await ms(), null);
    // nouvelle scène
    await page.click(`${root} [data-tl-act="scene-add"]`); await wait(300);
    let m = await ms(); assert.equal(m.scenes.length, 1); const sceneId = m.scenes[0].id;
    // deux éléments → deux pistes
    await page.selectOption(`${root} [data-tl="add-target"]`, "edh1000001"); await page.click(`${root} [data-tl-act="step-add"]`); await wait(250);
    await page.selectOption(`${root} [data-tl="add-target"]`, "edtx000001"); await page.click(`${root} [data-tl-act="step-add"]`); await wait(250);
    m = await ms(); assert.equal(m.scenes[0].steps.length, 2);
    assert.equal(await page.locator(`${root} [data-tl-track]`).count(), 2);
    const [s1, s2] = m.scenes[0].steps.map((s) => s.id);
    // réglages du pas sélectionné (le second, créé en dernier)
    const stepEditor = `${root} [data-tl-step-editor]`;
    await page.waitForSelector(stepEditor);
    await page.selectOption(`${stepEditor} .pb-field:has(> label:text-is("Effet")) select`, "slide-up"); await wait(250);
    await page.fill(`${stepEditor} [data-tl="duration"]`, "900"); await page.dispatchEvent(`${stepEditor} [data-tl="duration"]`, "change"); await wait(250);
    await page.fill(`${stepEditor} [data-tl="delay"]`, "120"); await page.dispatchEvent(`${stepEditor} [data-tl="delay"]`, "change"); await wait(250);
    await page.selectOption(`${stepEditor} .pb-field:has(> label:text-is("Courbe d'accélération")) select`, "ease-out"); await wait(250);
    await page.selectOption(`${stepEditor} .pb-field:has(> label:text-is("Synchronisation")) select`, `sync:${s1}`); await wait(300);
    m = await ms(); let st2 = m.scenes[0].steps.find((s) => s.id === s2);
    assert.deepEqual([st2.effect, st2.duration, st2.delay, st2.easing, st2.sync], ["slide-up", 900, 120, "ease-out", s1]);
    // les deux barres partent ensemble (synchronisation) : la seconde 120 ms après la première
    const starts = await page.evaluate(() => [...document.querySelectorAll("[data-tl-step]")].map((b) => [b.getAttribute("data-tl-step"), Number(b.getAttribute("data-tl-start"))]));
    const startOf = Object.fromEntries(starts);
    assert.equal(startOf[s2] - startOf[s1], 120);
    // courbe personnalisée invalide refusée, valide acceptée
    await page.fill(`${stepEditor} [data-tl="bezier"]`, "cubic-bezier(9, 0, 0, 1)"); await page.dispatchEvent(`${stepEditor} [data-tl="bezier"]`, "change"); await wait(250);
    assert.equal((await ms()).scenes[0].steps.find((s) => s.id === s2).easing, "ease-out");
    await page.fill(`${stepEditor} [data-tl="bezier"]`, "cubic-bezier(0.2, 0.6, 0.4, 1)"); await page.dispatchEvent(`${stepEditor} [data-tl="bezier"]`, "change"); await wait(250);
    assert.equal((await ms()).scenes[0].steps.find((s) => s.id === s2).easing, "cubic-bezier(0.2, 0.6, 0.4, 1)");
    // glisser la barre du premier pas : le début change, le pas lié suit
    const bar1 = page.locator(`${root} [data-tl-step="${s1}"]`); await bar1.scrollIntoViewIfNeeded();
    const bb = await bar1.boundingBox();
    await page.mouse.move(bb.x + 20, bb.y + bb.height / 2); await page.mouse.down(); await page.mouse.move(bb.x + 20 + 45, bb.y + bb.height / 2, { steps: 6 }); await page.mouse.up(); await wait(400);
    m = await ms(); const at1 = m.scenes[0].steps.find((x) => x.id === s1).at;
    assert.ok(at1 >= 450 && at1 <= 550, `début après glissement : ${at1}`);
    const s2start = await page.evaluate((id) => Number(document.querySelector(`[data-tl-step="${id}"]`).getAttribute("data-tl-start")), s2);
    assert.equal(s2start, at1 + 120, "le pas synchronisé suit");
    // redimensionner (poignée de droite) = durée
    const grip = page.locator(`${root} [data-tl-step="${s1}"] [data-tl-grip]`); const gb = await grip.boundingBox();
    await page.mouse.move(gb.x + 3, gb.y + gb.height / 2); await page.mouse.down(); await page.mouse.move(gb.x + 3 + 27, gb.y + gb.height / 2, { steps: 5 }); await page.mouse.up(); await wait(400);
    assert.ok((await ms()).scenes[0].steps.find((x) => x.id === s1).duration >= 850, "durée allongée");
    // réordonner les pistes
    const orderOf = async () => (await ms()).scenes[0].steps.map((x) => x.id);
    assert.deepEqual(await orderOf(), [s1, s2]);
    await page.click(`${root} [data-tl-track="edtx000001"] [data-tl-act="track-up"]`); await wait(300);
    assert.deepEqual(await orderOf(), [s2, s1], "piste remontée");
    // dupliquer, supprimer un pas
    await page.click(`${root} [data-tl-step="${s1}"]`); await wait(200);
    await page.click(`${stepEditor} [data-tl-act="step-dup"]`); await wait(300);
    assert.equal((await ms()).scenes[0].steps.length, 3);
    await page.click(`${stepEditor} [data-tl-act="step-del"]`); await wait(300);
    assert.equal((await ms()).scenes[0].steps.length, 2);
    // lecture / pause / reprise / arrêt sur le canevas
    const rt = (fn, arg) => page.evaluate(([f, a]) => { const w = document.querySelector("[data-pb-frame]").contentWindow; return new Function("w", "a", f)(w, a); }, [fn, arg]);
    await page.click(`${root} [data-tl-act="play"]`);
    await until(async () => (await rt("return w.kwMotionStudio.scenes.state(a)", sceneId)) === "running", "lecture en cours");
    const anims = await rt("return w.document.querySelector('[data-node-id=\"edh1000001\"]').getAnimations().length", null);
    assert.ok(anims > 0, "animations réelles dans le canevas");
    await page.click(`${root} [data-tl-act="pause"]`); await wait(150);
    assert.equal(await rt("return w.kwMotionStudio.scenes.state(a)", sceneId), "paused");
    const t1 = await rt("return w.kwMotionStudio.scenes.time(a)", sceneId); await wait(300);
    assert.equal(await rt("return w.kwMotionStudio.scenes.time(a)", sceneId), t1, "figée");
    await page.click(`${root} [data-tl-act="resume"]`);
    await until(async () => (await rt("return w.kwMotionStudio.scenes.time(a)", sceneId)) > t1 || (await rt("return w.kwMotionStudio.scenes.state(a)", sceneId)) === "finished", "reprise");
    // position : clic sur la règle
    const rb = await page.locator(`${root} [data-tl-ruler]`).boundingBox();
    await page.mouse.click(rb.x + 90, rb.y + 10); await wait(300);
    const tSeek = await rt("return w.kwMotionStudio.scenes.time(a)", sceneId);
    assert.ok(tSeek >= 900 && tSeek <= 1100, `position placée à ~1 s : ${tSeek}`);
    assert.match(await page.textContent(`${root} [data-tl-time]`), /^1,0\d s$/);
    await page.click(`${root} [data-tl-act="stop"]`); await wait(200);
    assert.equal(await rt("return w.kwMotionStudio.scenes.state(a)", sceneId), "idle");
    assert.equal(await rt("return w.document.querySelector('[data-node-id=\"edh1000001\"]').getAnimations().length", null), 0, "page rendue à son état normal");
    // déclencheur et écrans
    await page.selectOption(`${root} [data-tl-scene-settings] .pb-field:has(> label:text-is("Déclencheur")) select`, "click"); await wait(250);
    assert.equal((await ms()).scenes[0].trigger, "click");
    await page.selectOption(`${root} [data-tl-scene-settings] .pb-field:has(> label:text-is("Élément cliqué")) select`, "edbtn000001"); await wait(250);
    assert.equal((await ms()).scenes[0].anchor, "edbtn000001");
    await page.uncheck(`${root} [data-tl-screen="mobile"]`); await wait(250);
    assert.deepEqual((await ms()).scenes[0].off, ["mobile"]);
    // options de page : transition de page, de sections, défilement fluide
    const opts = `${root} ~ [data-tl-page-options], [data-pb-page-settings] [data-tl-page-options]`;
    await page.selectOption(`[data-pb-page-settings] [data-tl-page-options] .pb-field:has(> label:text-is("Cette page")) select`, "zoom"); await wait(250);
    await page.selectOption(`[data-pb-page-settings] [data-tl-page-options] .pb-field:has(> label:text-is("Apparition des sections")) select`, "wipe-right"); await wait(250);
    await page.check(`[data-pb-page-settings] [data-tl-page-options] label:has-text("Lisser le défilement") input`); await wait(300);
    m = await ms(); void opts;
    assert.deepEqual([m.pageTransition, m.sectionTransition, m.smoothScroll], [{ type: "zoom" }, { type: "wipe-right" }, { on: true }]);
    assert.equal(await rt("return w.document.documentElement.getAttribute('data-kw-smooth')", null), null, "le défilement fluide n'agit pas dans l'éditeur");
    // enregistrement serveur réel
    await settle();
    const saved = JSON.parse(db.prepare("SELECT draft FROM mk_landing_pages WHERE id = ?").get(editId).draft).theme.motionScenes;
    assert.equal(saved.scenes[0].steps.length, 2); assert.equal(saved.scenes[0].trigger, "click"); assert.deepEqual(saved.smoothScroll, { on: true });
    assert.equal(saved.scenes[0].steps.find((x) => x.sync).delay, 120);
    // annuler : revient en arrière d'une étape à la fois
    const undo = () => page.evaluate(() => { const b = [...document.querySelectorAll("button")].find((x) => /Annuler/.test(x.getAttribute("data-tip") || "") && !x.disabled); if (b) b.click(); return Boolean(b); });
    assert.ok(await undo()); await wait(400);
    assert.equal((await ms()).smoothScroll, undefined, "annulation du défilement fluide");
    assert.ok(await undo()); await undo(); await wait(400);
    m = await ms(); assert.equal(m.sectionTransition, undefined); assert.equal(m.pageTransition, undefined);
    // élément supprimé : le pas est retiré à la prochaine sauvegarde (avertissement du serveur appliqué)
    await page.evaluate(() => window.pbMotionTimeline.heal({ kind: "scene_target", sceneId: null, target: "edtx000001" }));
    assert.ok(!(await ms()).scenes[0].steps.some((x) => x.target === "edtx000001"));
    assert.deepEqual(errs, []); await ctx.close();
  });
});
