// Motion Studio, lot « v » (visuels et médias), dans un VRAI Chrome : page publiée (révélation, parallaxe, tracé SVG, carte inclinée, boutons, fond animé, curseur, Lottie .json et .lottie),
// mouvement réduit, sans JavaScript, tactile, écrans 320 / 768 / 1920 sans débordement, puis éditeur (insertion des neuf composants, panneau, réglage annulable, canevas).
// Ignoré si Playwright ou Chrome sont absents (NODE_PATH=<dossier>/node_modules pour playwright-core).
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : parcours navigateur non exécuté sur cette machine" : false;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function png(w, h, rgb) {
  const table = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
  const crc = (buf) => { let c = 0xffffffff; for (const b of buf) c = table[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([len, td, c]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2;
  const raw = Buffer.alloc((w * 3 + 1) * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) raw.set(rgb, y * (w * 3 + 1) + 1 + x * 3);
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
}
const IMG = png(64, 40, [20, 120, 200]);
// Animation Lottie : un carré rouge qui tourne (90 images à 30 i/s = 3 s)
const ANIM = { v: "5.5.7", fr: 30, ip: 0, op: 90, w: 100, h: 100, nm: "t", ddd: 0, assets: [], layers: [{ ddd: 0, ind: 1, ty: 4, nm: "s", sr: 1, ks: { o: { a: 0, k: 100 }, r: { a: 1, k: [{ t: 0, s: [0], e: [360], i: { x: [0.5], y: [1] }, o: { x: [0.5], y: [0] } }, { t: 90, s: [360] }] }, p: { a: 0, k: [50, 50, 0] }, a: { a: 0, k: [0, 0, 0] }, s: { a: 0, k: [100, 100, 100] } }, ao: 0, shapes: [{ ty: "gr", it: [{ ty: "rc", d: 1, s: { a: 0, k: [40, 40] }, p: { a: 0, k: [0, 0] }, r: { a: 0, k: 0 } }, { ty: "fl", c: { a: 0, k: [1, 0, 0, 1] }, o: { a: 0, k: 100 } }, { ty: "tr", p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 } }] }], ip: 0, op: 90, st: 0, bounds: { l: 0, t: 0, b: 100, r: 100 } }] };
function zip(files) {
  const locals = [], central = []; let offset = 0;
  for (const [name, content] of Object.entries(files)) {
    const raw = Buffer.from(content), data = zlib.deflateRawSync(raw), nm = Buffer.from(name);
    const lh = Buffer.alloc(30); lh.writeUInt32LE(0x04034b50, 0); lh.writeUInt16LE(20, 4); lh.writeUInt16LE(8, 8); lh.writeUInt32LE(data.length, 18); lh.writeUInt32LE(raw.length, 22); lh.writeUInt16LE(nm.length, 26);
    const ch = Buffer.alloc(46); ch.writeUInt32LE(0x02014b50, 0); ch.writeUInt16LE(20, 4); ch.writeUInt16LE(20, 6); ch.writeUInt16LE(8, 10); ch.writeUInt32LE(data.length, 20); ch.writeUInt32LE(raw.length, 24); ch.writeUInt16LE(nm.length, 28); ch.writeUInt32LE(offset, 42);
    locals.push(lh, nm, data); central.push(ch, nm); offset += 30 + nm.length + data.length;
  }
  const cd = Buffer.concat(central), end = Buffer.alloc(22); end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(Object.keys(files).length, 8); end.writeUInt16LE(Object.keys(files).length, 10); end.writeUInt32LE(cd.length, 12); end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, cd, end]);
}
const EVIL_SVG = '<svg viewBox="0 0 100 50" onload="window.__pwned=1"><script>window.__pwned=2</script><style>body{display:none}</style><path d="M5 25 C25 0 45 50 65 25 S95 25 95 25" stroke="currentColor" stroke-width="3" fill="none" stroke-dasharray="3" style="stroke-dasharray:3" onclick="window.__pwned=3"/><image href="https://evil.test/x.png"/></svg>';

describe("Motion Studio, lot v : visuels et médias (Chrome réel)", { skip: SKIP }, () => {
  let srv, boss, db, browser, slug, editId, lottiePaths;
  const spacer = (id) => ({ id, type: "spacer", props: { size: "128" } });
  const w = (id, type, props, studio) => ({ id, type, props, ...(studio ? { motion: { studio: { v: 1, ...studio } } } : {}) });
  const until = async (fn, what, ms = 15000) => { const end = Date.now() + ms; for (;;) { let v = false; try { v = await fn(); } catch { /* on réessaie */ } if (v) return v; if (Date.now() > end) throw new Error(`Délai dépassé : ${what}`); await wait(100); } };
  const sel = (id) => `.kw-n-${id}`;

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" }); boss = await loginInstructor(srv); db = srv.db();
    const upload = async (buffer, name) => {
      const fd = new FormData(); fd.append("file", new Blob([buffer], { type: "application/octet-stream" }), name);
      const r = await boss.request("/marketing/site-web/mediatheque/televerser", { method: "POST", multipart: fd });
      assert.equal(r.status, 201, r.text.slice(0, 300)); return JSON.parse(r.text).media;
    };
    const json = await upload(Buffer.from(JSON.stringify(ANIM)), "anim.json"), dot = await upload(zip({ "manifest.json": JSON.stringify({ version: "1", animations: [{ id: "a1" }] }), "animations/a1.json": JSON.stringify(ANIM) }), "anim.lottie"), gone = await upload(Buffer.from(JSON.stringify(ANIM)), "disparue.json");
    assert.equal(json.type, "lottie"); assert.equal(dot.mime, "application/zip");
    fs.unlinkSync(path.join(srv.dir, "uploads", gone.path.replace(/^\/uploads\//, ""))); // fichier disparu du disque : état d'erreur propre
    lottiePaths = { json: json.path, dot: dot.path, gone: gone.path };
    // un contrôle strict à l'envoi : refus d'une animation avec expression
    const fd = new FormData(); fd.append("file", new Blob([JSON.stringify({ ...ANIM, layers: [{ ks: { r: { x: "var a" } } }] })]), "expr.json");
    const refused = await boss.request("/marketing/site-web/mediatheque/televerser", { method: "POST", multipart: fd }); assert.equal(refused.status, 422); assert.match(refused.text, /expression/);

    const mk = async (name, children, publish) => {
      const id = Number((await boss.post("/marketing/pages", { name })).location.match(/(\d+)$/)[1]);
      const rev = db.prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(id).revision;
      const content = { sections: [{ id: "sect00000001", type: "layout", children: [{ id: "box000000001", type: "container", props: {}, children }] }] };
      const r = await boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", json: { revision: rev, content }, headers: { Origin: srv.base } });
      assert.equal(r.status, 200, r.text.slice(0, 400));
      if (publish) assert.equal((await boss.request(`/marketing/pages/${id}/publier.json`, { method: "POST", json: {}, headers: { Origin: srv.base } })).status, 200);
      return id;
    };
    const img = "https://img.test/a.png";
    const pub = await mk("MS v public", [
      w("irload000001", "motionimagereveal", { image: img, alt: "Photo A", ratio: "16-9", caption: "Légende A", link: "" }, { trigger: "load", preset: "iris", duration: 800 }),
      w("svgload00001", "motionsvgdraw", { source: "preset", shape: "wave", svg: "", alt: "Vague", strokeWidth: 4, cap: "round", width: 320, align: "center" }, { trigger: "load", duration: 600 }),
      w("svgevil00001", "motionsvgdraw", { source: "custom", shape: "wave", svg: EVIL_SVG, alt: "Collé", strokeWidth: 3, cap: "round", width: 200, align: "left" }, { trigger: "load", duration: 600 }),
      w("tilt00000001", "motiontiltcard", { image: img, imageAlt: "", title: "Carte", titleTag: "h3", text: "Texte de la carte", linkLabel: "Voir", link: "/offre" }, { params: { maxTilt: 15 } }),
      w("btn000000001", "motionbutton", { label: "Découvrir", link: "/offre", newTab: false, arrow: "right", size: "md", block: false, align: "left" }, { preset: "fill-slide" }),
      w("btnc00000001", "motionbutton", { label: "Cercle", link: "/cercle", newTab: true, arrow: "none", size: "md", block: false, align: "left" }, { preset: "fill-circle" }),
      w("mag000000001", "motionmagneticbutton", { label: "Magnétique", link: "/mag", newTab: false, arrow: "none", size: "lg", align: "center" }, { params: { strength: 50, radius: 150 } }),
      w("bg0000000001", "motionanimatedbg", { title: "Fond animé", titleTag: "h2", text: "Un texte lisible", buttonLabel: "Allons-y", link: "/go", color1: "token:primary", color2: "token:secondary", color3: "token:accent", tone: "light", align: "center", minHeight: 240 }, { preset: "mesh", trigger: "load" }),
      w("cur000000001", "motioncursor", { look: "dot-ring", size: 36, grow: 1.6, inertia: 0, blend: false, hideNative: false }),
      w("lotjson00001", "motionlottie", { src: lottiePaths.json, alt: "Carré qui tourne", poster: "", caption: "", height: 120, align: "center" }, { trigger: "load" }),
      w("lotloop00001", "motionlottie", { src: lottiePaths.json, alt: "Boucle", poster: "", caption: "", height: 100, align: "left" }, { trigger: "load", params: { loop: true, speed: 2 } }),
      w("lotseg000001", "motionlottie", { src: lottiePaths.json, alt: "Segment", poster: "", caption: "", height: 100, align: "left" }, { trigger: "load", params: { segStart: 0, segEnd: 15, speed: 4 } }),
      w("lotdot000001", "motionlottie", { src: lottiePaths.dot, alt: "dotLottie", poster: "", caption: "", height: 100, align: "left" }, { trigger: "load" }),
      w("lotclick0001", "motionlottie", { src: lottiePaths.json, alt: "Clic", poster: "", caption: "", height: 100, align: "left" }, { trigger: "click" }),
      w("lotgone00001", "motionlottie", { src: lottiePaths.gone, alt: "Disparue", poster: "", caption: "", height: 100, align: "left" }, { trigger: "load" }),
      spacer("spc000000001"), spacer("spc000000002"), spacer("spc000000003"), spacer("spc000000004"), spacer("spc000000005"), spacer("spc000000006"),
      w("irview000001", "motionimagereveal", { image: img, alt: "Photo B", ratio: "4-3", caption: "", link: "" }, { preset: "curtains" }),
      w("ppx000000001", "motionimageparallax", { image: img, alt: "Parallaxe", ratio: "21-9", caption: "" }, { params: { depth: 20 } }),
      w("irmobile0001", "motionimagereveal", { image: img, alt: "Coupée mobile", ratio: "16-9", caption: "", link: "" }, { trigger: "load", off: ["mobile"] }),
      spacer("spc000000007"),
    ], true);
    slug = db.prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(pub).slug;
    editId = await mk("MS v éditeur", [w("edit00000001", "motionimagereveal", { image: "", alt: "", ratio: "16-9", caption: "", link: "" })], false);
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
  });
  after(async () => { if (browser) await browser.close(); if (srv) await srv.stop(); });

  const open = async (opts = {}, { js = true, wait: waitFor = true } = {}) => {
    const ctx = await browser.newContext({ viewport: { width: 1200, height: 800 }, javaScriptEnabled: js, ...opts });
    await ctx.route("https://img.test/**", (route) => route.fulfill({ status: 200, contentType: "image/png", body: IMG }));
    const page = await ctx.newPage(); const errs = [], reqs = [];
    page.on("pageerror", (e) => errs.push(e.message)); page.on("request", (r) => reqs.push(r.url()));
    await page.goto(`${srv.base}/p/${slug}`, { waitUntil: "load" });
    if (js && waitFor) await page.waitForFunction(() => { const e = document.querySelector(".kw-n-irload000001"); return e && e.getAttribute("data-kw-ms-state"); }, null, { timeout: 20000 });
    return { page, ctx, errs, reqs };
  };
  const state = (page, id) => page.getAttribute(sel(id), "data-kw-ms-state");
  const noOverflow = (page) => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1);
  const anims = (page, s) => page.evaluate((s) => document.querySelector(s).getAnimations({ subtree: true }).map((a) => a.playState), s);
  const lt = (page, id) => page.evaluate((id) => { const e = document.querySelector(`.kw-n-${id} .kw-ms-lt-stage`); return e && e.getAttribute("data-kw-lt"); }, id);

  test("page publiée : feuille, runtime et modules à la demande ; révélation par iris exécutée, image entière à la fin ; contenu accessible", async () => {
    const { page, errs, reqs } = await open();
    assert.ok(reqs.some((u) => /\/css\/motion-studio\.css\?v=/.test(u)) && reqs.some((u) => /\/js\/kw-motion-studio\.js\?v=/.test(u)));
    await until(() => reqs.some((u) => /\/js\/motion-studio\/image-reveal\.js\?v=/.test(u)), "module image-reveal avec empreinte");
    assert.equal(await state(page, "irload000001"), "ready");
    const a = await page.evaluate(() => document.querySelector(".kw-n-irload000001 .kw-ms-ir-frame").getAnimations().map((x) => [x.effect.getKeyframes()[0].clipPath, x.effect.getKeyframes()[1].clipPath]));
    assert.deepEqual(a, [["circle(0% at 50% 50%)", "circle(75% at 50% 50%)"]], "masque iris réel");
    await until(async () => (await anims(page, sel("irload000001"))).every((s) => s === "finished"), "révélation terminée", 10000);
    const info = await page.evaluate(() => { const f = document.querySelector(".kw-n-irload000001 .kw-ms-ir-frame"), i = f.querySelector("img"); return { clip: getComputedStyle(f).clipPath, w: f.getBoundingClientRect().width, nat: i.naturalWidth, alt: i.alt, cap: document.querySelector(".kw-n-irload000001 figcaption").textContent }; });
    assert.equal(info.nat, 64); assert.equal(info.alt, "Photo A"); assert.equal(info.cap, "Légende A"); assert.ok(info.w > 300);
    assert.notEqual(info.clip, "circle(0% at 50% 50%)");
    assert.equal(await state(page, "irview000001"), "ready");
    assert.deepEqual(errs, []); await page.close();
  });

  test("reveal « viewport » : masque tenu hors écran puis levé au défilement ; coupé sur mobile (image entière) ; réactivé au retour", async () => {
    const { page, errs } = await open();
    const clip = () => page.evaluate(() => getComputedStyle(document.querySelector(".kw-n-irview000001 .kw-ms-ir-frame")).clipPath);
    assert.match(await clip(), /inset\(0px 50%\)/, "rideaux fermés tant que l'image n'est pas visible");
    await page.locator(sel("irview000001")).scrollIntoViewIfNeeded();
    try { await until(async () => /^inset\(0px(?: 0(?:px|%))*\)$|^none$/.test(await clip()), "rideaux ouverts", 10000); } catch (e) {
      throw new Error(`${e.message} : ${await clip()} ${JSON.stringify(await page.evaluate(() => { const f = document.querySelector(".kw-n-irview000001 .kw-ms-ir-frame"), r = document.querySelector(".kw-n-irview000001").getBoundingClientRect(); return { top: Math.round(r.top), h: Math.round(r.height), vh: innerHeight, sy: scrollY, state: document.querySelector(".kw-n-irview000001").getAttribute("data-kw-ms-state"), anims: f.getAnimations().map((a) => [a.playState, Math.round(a.currentTime)]) }; }))}`);
    }
    await page.setViewportSize({ width: 375, height: 800 }); await wait(500);
    assert.equal(await state(page, "irmobile0001"), "off");
    assert.equal(await page.evaluate(() => document.querySelector(".kw-n-irmobile0001 .kw-ms-ir-frame").getAnimations().length), 0);
    await page.setViewportSize({ width: 1200, height: 800 }); await wait(500);
    assert.equal(await state(page, "irmobile0001"), "ready");
    assert.deepEqual(errs, []); await page.close();
  });

  test("parallaxe : l'image déborde de son cadre et suit le défilement (avancement lié à la page) ; cadre intact", async () => {
    const { page, errs } = await open();
    const info = () => page.evaluate(() => { const i = document.querySelector(".kw-n-ppx000000001 .kw-ms-pp-img"); return { h: i.style.height, top: i.style.top, t: Math.round(i.getAnimations()[0].currentTime), tf: getComputedStyle(i).transform }; });
    assert.equal(await state(page, "ppx000000001"), "ready");
    await page.evaluate(() => window.scrollTo(0, 0)); await wait(200); const t0 = await info();
    assert.deepEqual([t0.h, t0.top], ["140%", "-20%"]);
    await page.locator(sel("ppx000000001")).scrollIntoViewIfNeeded(); await page.mouse.wheel(0, 80); await wait(400);
    const t1 = await info(); assert.ok(t1.t > t0.t, `avancement ${t0.t} -> ${t1.t}`); assert.notEqual(t1.tf, t0.tf, "l'image a bougé");
    const frame = await page.evaluate(() => { const f = document.querySelector(".kw-n-ppx000000001 .kw-ms-pp-frame"); const r = f.getBoundingClientRect(); return { ratio: Math.round((r.width / r.height) * 100) / 100, over: getComputedStyle(f).overflow }; });
    assert.equal(frame.over, "hidden"); assert.ok(Math.abs(frame.ratio - 2.33) < 0.05);
    assert.deepEqual(errs, []); await page.close();
  });

  test("tracé SVG : stroke-dasharray posé par le script d'après la longueur réelle ; le tracé se dessine ; le SVG collé est nettoyé (aucun script exécuté)", async () => {
    const { page, errs } = await open();
    await until(() => page.evaluate(() => document.querySelector(".kw-n-svgload00001 [data-kw-sd]").style.strokeDasharray !== ""), "dasharray posé");
    const d = await page.evaluate(() => { const p = document.querySelector(".kw-n-svgload00001 [data-kw-sd]"); const len = p.getTotalLength(); return { len, dash: p.style.strokeDasharray, attr: p.getAttribute("stroke-dasharray"), state: p.getAnimations()[0].playState }; });
    const dashes = d.dash.split(/[ ,]+/).map(Number); assert.equal(dashes.length, 2); assert.ok(dashes.every((n) => Math.abs(n - d.len) < 0.01), `${d.dash} pour ${d.len}`); assert.equal(d.attr, null); assert.ok(d.len > 100);
    await until(() => page.evaluate(() => getComputedStyle(document.querySelector(".kw-n-svgload00001 [data-kw-sd]")).strokeDashoffset === "0px"), "tracé terminé", 8000);
    const evil = await page.evaluate(() => { const r = document.querySelector(".kw-n-svgevil00001"); return { scripts: r.querySelectorAll("script, style, image, use, foreignObject").length, attrs: [...r.querySelectorAll("*")].flatMap((e) => [...e.attributes].map((a) => a.name)).filter((n) => /^on|dasharray|href|style/.test(n)), pwned: window.__pwned || 0, vb: r.querySelector("svg").getAttribute("viewBox"), shapes: r.querySelectorAll("[data-kw-sd]").length, label: r.querySelector("svg").getAttribute("aria-label") }; });
    assert.deepEqual(evil.scripts, 0); assert.deepEqual(evil.attrs.filter((n) => n !== "style"), []); assert.equal(evil.pwned, 0); assert.equal(evil.vb, "0 0 100 50"); assert.equal(evil.shapes, 1); assert.equal(evil.label, "Collé");
    assert.equal(await page.evaluate(() => getComputedStyle(document.body).display), "block", "le <style> collé n'a pas été appliqué");
    assert.deepEqual(errs, []); await page.close();
  });

  test("carte inclinée : s'incline vers la souris avec reflet, revient à plat ; tactile : à plat", async () => {
    const { page, errs } = await open();
    const card = () => page.evaluate(() => { const c = document.querySelector(".kw-n-tilt00000001 .kw-ms-tc-card"); return { tf: c.style.transform, go: c.style.getPropertyValue("--kw-ms-go") }; });
    await page.locator(sel("tilt00000001")).scrollIntoViewIfNeeded();
    const box = await page.locator(sel("tilt00000001")).boundingBox();
    await page.mouse.move(box.x + box.width * 0.9, box.y + box.height * 0.1); await page.mouse.move(box.x + box.width * 0.95, box.y + box.height * 0.1, { steps: 4 }); await wait(250);
    const on = await card(); assert.match(on.tf, /^perspective\(900px\) rotateX\(-?[\d.]+deg\) rotateY\([\d.]+deg\) scale\(1\.03\)$/); assert.ok(parseFloat(on.tf.match(/rotateY\(([-\d.]+)deg/)[1]) > 5, on.tf); assert.equal(on.go, "0.35");
    await page.mouse.move(2, 2); await wait(300);
    const off = await card(); assert.equal(off.tf, ""); assert.equal(off.go, "0");
    assert.deepEqual(errs, []); await page.close();
    const touch = await open({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 800 } });
    await touch.page.evaluate(() => { const e = document.querySelector(".kw-n-tilt00000001"); e.dispatchEvent(new PointerEvent("pointermove", { clientX: 10, clientY: 10, pointerType: "touch", bubbles: true })); });
    assert.equal(await touch.page.evaluate(() => document.querySelector(".kw-n-tilt00000001 .kw-ms-tc-card").style.transform), "");
    assert.equal(await touch.page.evaluate(() => matchMedia("(hover: hover) and (pointer: fine)").matches), false);
    await touch.page.close();
  });

  test("boutons : vrais liens ; le remplissage glisse au survol ET au focus clavier ; cercle depuis le pointeur ; magnétique attiré puis relâché", async () => {
    const { page, errs } = await open();
    const links = await page.evaluate(() => ["btn000000001", "btnc00000001", "mag000000001"].map((id) => { const a = document.querySelector(`.kw-n-${id} a.kw-ms-bt`); return [a.tagName, a.getAttribute("href"), a.target, a.rel, a.textContent.trim()]; }));
    // l'adresse est celle du comptage des clics de la plateforme (/p/<page>/clic/<n>, qui redirige vers l'adresse choisie) : c'est bien un lien <a href>
    assert.deepEqual(links.map((l) => [l[0], /\/clic\/\d+$/.test(l[1]), l[2], l[3], l[4]]), [["A", true, "", "", "Découvrir"], ["A", true, "_blank", "noopener noreferrer", "Cercle"], ["A", true, "", "", "Magnétique"]]);
    const fill = (id) => page.evaluate((id) => getComputedStyle(document.querySelector(`.kw-n-${id} .kw-ms-bt-fill`)).transform, id);
    await page.locator(sel("btn000000001")).scrollIntoViewIfNeeded();
    assert.match(await fill("btn000000001"), /matrix\(1, 0, 0, 1, -/, "rempli hors survol : décalé à gauche");
    await page.hover(`${sel("btn000000001")} a`); await wait(700);
    assert.equal(await fill("btn000000001"), "matrix(1, 0, 0, 1, 0, 0)", "survol : rempli");
    await page.mouse.move(2, 2); await wait(700); assert.match(await fill("btn000000001"), /-/);
    await page.focus(`${sel("btn000000001")} a`); await page.keyboard.press("Shift+Tab"); await page.keyboard.press("Tab"); await wait(700);
    assert.equal(await fill("btn000000001"), "matrix(1, 0, 0, 1, 0, 0)", "focus clavier : même effet");
    // cercle : le point d'entrée du pointeur est mémorisé
    const b = await page.locator(`${sel("btnc00000001")} a`).boundingBox();
    await page.mouse.move(b.x + b.width - 3, b.y + b.height / 2); await wait(100);
    assert.match(await page.evaluate(() => document.querySelector(".kw-n-btnc00000001 a").style.getPropertyValue("--kw-ms-x")), /^9\d%$|^100%$/);
    // durée posée par le module
    assert.equal(await page.evaluate(() => document.querySelector(".kw-n-btn000000001").style.getPropertyValue("--kw-ms-dur")), "350ms");
    // magnétique
    await page.locator(sel("mag000000001")).scrollIntoViewIfNeeded();
    const m = await page.locator(`${sel("mag000000001")} a`).boundingBox();
    const tf = () => page.evaluate(() => document.querySelector(".kw-n-mag000000001 a").style.transform);
    await page.mouse.move(m.x + m.width / 2 + 200, m.y + m.height / 2 - 400); await wait(100); assert.equal(await tf(), "", "loin : en place");
    await page.mouse.move(m.x + m.width + 70, m.y + m.height / 2, { steps: 5 }); await wait(250);
    const near = await tf(); assert.match(near, /^translate3d\(\d/, near);
    await page.mouse.move(m.x + m.width / 2 + 400, m.y + m.height / 2 + 500, { steps: 5 }); await wait(250); assert.equal(await tf(), "", "relâché");
    assert.deepEqual(errs, []); await page.close();
  });

  test("fond animé : texte et bouton lisibles, 3 calques animés (mesh), bouton Pause réel qui fige puis reprend", async () => {
    const { page, errs } = await open();
    await page.locator(sel("bg0000000001")).scrollIntoViewIfNeeded();
    await until(async () => (await anims(page, sel("bg0000000001"))).filter((s) => s === "running").length === 3, "3 calques en cours");
    const txt = await page.evaluate(() => { const e = document.querySelector(".kw-n-bg0000000001"); return { h: e.querySelector("h2").textContent, a: e.querySelector("a").getAttribute("href"), color: getComputedStyle(e.querySelector("h2")).color, vars: ["--kw-ms-c1", "--kw-ms-c2", "--kw-ms-c3"].map((v) => e.style.getPropertyValue(v)).every(Boolean) }; });
    assert.deepEqual([txt.h, /\/clic\/\d+$/.test(txt.a), txt.color, txt.vars], ["Fond animé", true, "rgb(255, 255, 255)", true]);
    const btn = page.locator(`${sel("bg0000000001")} .kw-ms-bg-pause`);
    assert.equal(await btn.getAttribute("aria-pressed"), "false");
    await btn.click(); await wait(150);
    assert.ok((await anims(page, sel("bg0000000001"))).every((s) => s === "paused"), "tout est figé"); assert.equal(await btn.getAttribute("aria-pressed"), "true");
    await btn.click(); await wait(150);
    assert.ok((await anims(page, sel("bg0000000001"))).every((s) => s === "running"), "reprise");
    const iters = await page.evaluate((s) => document.querySelector(s + " .kw-ms-bg-l1").getAnimations()[0].effect.getComputedTiming().iterations, sel("bg0000000001"));
    assert.equal(iters, Infinity);
    assert.deepEqual(errs, []); await page.close();
  });

  test("curseur personnalisé : suit la souris, grossit sur un lien ; absent en tactile ; un seul exemplaire", async () => {
    const { page, errs } = await open();
    assert.equal(await page.locator(".kw-ms-cursor").count(), 1);
    await page.mouse.move(300, 300); await page.mouse.move(320, 310, { steps: 3 }); await wait(200);
    const r = await page.evaluate(() => { const c = document.querySelector(".kw-ms-cursor"); return { hidden: c.classList.contains("is-hidden"), ring: c.querySelector(".kw-ms-cursor-ring").style.transform, dot: c.querySelector(".kw-ms-cursor-dot").style.transform, pe: getComputedStyle(c).pointerEvents, aria: c.getAttribute("aria-hidden"), native: getComputedStyle(document.body).cursor }; });
    assert.equal(r.hidden, false); assert.match(r.ring, /translate3d\(302px, 292px, 0px\) scale\(1\)/); assert.match(r.dot, /translate3d\(317px, 307px, 0px\)/); assert.equal(r.pe, "none"); assert.equal(r.aria, "true"); assert.notEqual(r.native, "none", "curseur du système conservé");
    await page.locator(sel("btn000000001")).scrollIntoViewIfNeeded(); const b = await page.locator(`${sel("btn000000001")} a`).boundingBox();
    await page.mouse.move(b.x + 10, b.y + 10, { steps: 3 }); await wait(200);
    assert.equal(await page.evaluate(() => document.querySelector(".kw-ms-cursor").classList.contains("is-grown")), true);
    assert.match(await page.evaluate(() => document.querySelector(".kw-ms-cursor-ring").style.transform), /scale\(1\.6\)/);
    assert.deepEqual(errs, []); await page.close();
    const touch = await open({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 800 } });
    assert.equal(await touch.page.locator(".kw-ms-cursor").count(), 0, "aucun curseur sur écran tactile");
    await touch.page.close();
  });

  test("Lottie : bibliothèque et fichier chargés à la demande, animation dessinée et lue (.json et .lottie), boucle avec Pause, segment terminé plus tôt, clic, fichier disparu = erreur propre", async () => {
    const { page, errs, reqs } = await open();
    await until(async () => (await lt(page, "lotjson00001")) === "playing", "lecture .json");
    assert.ok(reqs.some((u) => /\/js\/vendor\/lottie_light\.min\.js/.test(u)), "bibliothèque vendorisée chargée");
    assert.ok(!reqs.some((u) => /cdn|unpkg|jsdelivr|lottiefiles/.test(u)), "aucun CDN");
    assert.ok(reqs.some((u) => u.includes(lottiePaths.json)));
    assert.equal(await page.evaluate(() => document.querySelectorAll(".kw-n-lotjson00001 .kw-ms-lt-stage svg").length), 1, "SVG dessiné");
    const label = await page.evaluate(() => { const s = document.querySelector(".kw-n-lotjson00001 .kw-ms-lt-stage"); return [s.getAttribute("role"), s.getAttribute("aria-label")]; });
    assert.deepEqual(label, ["img", "Carré qui tourne"]);
    const rot = () => page.evaluate(() => [...document.querySelectorAll(".kw-n-lotjson00001 .kw-ms-lt-stage svg g[transform]")].map((g) => g.getAttribute("transform")).join("|"));
    const r0 = await rot(); await wait(500); assert.notEqual(await rot(), r0, "l'image avance");
    // dotLottie
    await until(async () => (await lt(page, "lotdot000001")) === "playing", "lecture .lottie (décompression du navigateur)");
    assert.equal(await page.evaluate(() => document.querySelectorAll(".kw-n-lotdot000001 .kw-ms-lt-stage svg").length), 1);
    // boucle : bouton Pause visible et fonctionnel
    await until(async () => (await lt(page, "lotloop00001")) === "playing", "boucle");
    const pause = page.locator(`${sel("lotloop00001")} .kw-ms-lt-pause`); assert.equal(await pause.count(), 1);
    await pause.click(); assert.equal(await lt(page, "lotloop00001"), "paused"); assert.equal(await pause.getAttribute("aria-pressed"), "true");
    await pause.click(); assert.equal(await lt(page, "lotloop00001"), "playing");
    assert.equal(await page.locator(`${sel("lotjson00001")} .kw-ms-lt-pause`).count(), 0, "pas de bouton Pause sans boucle");
    // segment 0-15 à vitesse 4 : fini en moins d'une seconde, alors que l'animation complète dure 3 s
    await until(async () => (await lt(page, "lotseg000001")) === "finished", "segment terminé", 4000);
    assert.equal(await lt(page, "lotloop00001"), "playing", "la boucle tourne encore");
    // clic : rien avant, lecture après
    await page.locator(sel("lotclick0001")).scrollIntoViewIfNeeded();
    assert.notEqual(await lt(page, "lotclick0001"), "playing");
    await page.locator(`${sel("lotclick0001")} .kw-ms-lt-stage`).click(); await until(async () => (await lt(page, "lotclick0001")) === "playing", "lecture au clic");
    // fichier disparu : état d'erreur, le reste de la page continue
    await until(async () => (await lt(page, "lotgone00001")) === "error", "erreur propre");
    assert.equal(await page.evaluate(() => document.querySelectorAll(".kw-ms-lt-stage svg").length > 3), true);
    assert.deepEqual(errs, []); await page.close();
  });

  test("mouvement réduit : rien ne bouge (révélation, parallaxe, tracé, fond, curseur, Lottie : première image) et tout le contenu est là", async () => {
    const { page, errs } = await open({ reducedMotion: "reduce" });
    for (const id of ["irload000001", "irview000001", "ppx000000001", "svgload00001", "bg0000000001", "lotjson00001", "tilt00000001", "mag000000001"]) assert.equal(await state(page, id), "reduced", id);
    assert.equal((await anims(page, sel("irload000001"))).length, 0); assert.equal((await anims(page, sel("ppx000000001"))).length, 0); assert.equal((await anims(page, sel("bg0000000001"))).length, 0);
    assert.equal(await page.evaluate(() => document.querySelector(".kw-n-ppx000000001 .kw-ms-pp-img").style.height), "", "parallaxe : image fixe");
    assert.equal(await page.evaluate(() => document.querySelector(".kw-n-svgload00001 [data-kw-sd]").style.strokeDasharray), "", "tracé entier");
    assert.equal(await page.locator(`${sel("bg0000000001")} .kw-ms-bg-pause`).count(), 0, "pas de bouton Pause sans animation");
    assert.equal(await page.locator(".kw-ms-cursor").count(), 0);
    await until(async () => (await lt(page, "lotjson00001")) === "ready", "Lottie : première image seulement");
    assert.equal(await page.evaluate(() => document.querySelectorAll(".kw-n-lotjson00001 .kw-ms-lt-stage svg").length), 1);
    await wait(500); assert.equal(await lt(page, "lotjson00001"), "ready");
    await page.mouse.move(500, 300); assert.equal(await page.evaluate(() => document.querySelector(".kw-n-tilt00000001 .kw-ms-tc-card").style.transform), "");
    assert.deepEqual(errs, []); await page.close();
  });

  test("sans JavaScript : images entières, tracés entiers, liens réels, fond et texte lisibles, aucun curseur ni animation", async () => {
    const { page } = await open({}, { js: false });
    const r = await page.evaluate(() => {
      const vis = (s) => { const e = document.querySelector(s); const c = getComputedStyle(e), b = e.getBoundingClientRect(); return b.width > 0 && b.height > 0 && c.visibility === "visible" && c.opacity === "1"; };
      return {
        reveal: vis(".kw-n-irload000001 .kw-ms-ir-frame") && getComputedStyle(document.querySelector(".kw-n-irload000001 .kw-ms-ir-frame")).clipPath === "none", par: vis(".kw-n-ppx000000001 .kw-ms-pp-img"),
        svg: vis(".kw-n-svgload00001 svg") && document.querySelector(".kw-n-svgload00001 [data-kw-sd]").style.strokeDasharray === "", btn: vis(".kw-n-btn000000001 a") && /\/clic\/\d+$/.test(document.querySelector(".kw-n-btn000000001 a").getAttribute("href")),
        bg: vis(".kw-n-bg0000000001 h2") && vis(".kw-n-bg0000000001 a"), card: vis(".kw-n-tilt00000001 h3"), cursor: document.querySelectorAll(".kw-ms-cursor").length, lottie: document.querySelector(".kw-n-lotjson00001 .kw-ms-lt-stage").getAttribute("aria-label"),
        pause: document.querySelectorAll(".kw-ms-bg-pause, .kw-ms-lt-pause").length,
      };
    });
    assert.deepEqual(r, { reveal: true, par: true, svg: true, btn: true, bg: true, card: true, cursor: 0, lottie: "Carré qui tourne", pause: 0 });
    await page.close();
  });

  test("320 / 768 / 1920 : aucun débordement horizontal", async () => {
    const { page, errs } = await open({ viewport: { width: 1200, height: 800 } });
    for (const wd of [320, 768, 1920]) { await page.setViewportSize({ width: wd, height: 800 }); await wait(500); assert.ok(await noOverflow(page), `débordement à ${wd}px`); }
    assert.deepEqual(errs, []); await page.close();
  });

  // ---------------------------------------------------------------- éditeur
  test("éditeur : insertion des neuf composants depuis la bibliothèque, panneau adapté, réglage annulable, canevas sans erreur", { timeout: 360000 }, async () => {
    const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
    await ctx.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    await ctx.route("https://img.test/**", (route) => route.fulfill({ status: 200, contentType: "image/png", body: IMG }));
    const page = await ctx.newPage(); const errs = [];
    page.on("pageerror", (e) => errs.push(e.message));
    await page.goto(`${srv.base}/marketing/pages/${editId}/editeur`);
    await page.waitForFunction(() => { const f = document.querySelector("[data-pb-frame]"); return f && f.contentDocument && f.contentDocument.body && f.contentDocument.body.classList.contains("lp-builder") && window.__pb; }, null, { timeout: 30000 });
    await wait(800);
    const doc = () => page.evaluate(() => window.__pb.content());
    const flat = (c) => { const o = []; const walk = (l) => (l || []).forEach((n) => { o.push(n); walk(n.children); }); walk(c.sections); return o; };
    const settle = () => page.waitForFunction(() => !window.__pb.dirty(), null, { timeout: 20000 });
    const LABELS = { motionimagereveal: "Révélation d'image", motionimageparallax: "Parallaxe d'image", motionsvgdraw: "Tracé SVG animé", motiontiltcard: "Carte inclinée 3D", motionbutton: "Bouton animé", motionmagneticbutton: "Bouton magnétique", motionanimatedbg: "Fond animé", motioncursor: "Curseur personnalisé", motionlottie: "Lecteur Lottie" };
    for (const [type, label] of Object.entries(LABELS)) {
      await page.evaluate(() => { const b = document.querySelector("#pb-tab-elements"); if (b) b.click(); });
      await page.locator("[data-pb-el-search]").fill(label); await wait(150);
      await page.locator(`.pb-pal-item[data-widget="${type}"]`).first().click({ timeout: 8000 }); await wait(250);
    }
    const c = await doc(); const types = flat(c).map((n) => n.type);
    for (const type of Object.keys(LABELS)) assert.ok(types.includes(type), `inséré : ${type}`);
    await settle();
    // le canevas rend chaque composant avec le même gabarit (module + réglages effectifs)
    const canvas = await page.evaluate((types) => { const f = document.querySelector("[data-pb-frame]").contentDocument; return types.map((t) => { const e = f.querySelector(`[data-node-type="${t}"]`); return [t, !!e, e && e.getAttribute("data-kw-ms-module")]; }); }, Object.keys(LABELS));
    for (const [t, there, mod] of canvas) { assert.ok(there, `canevas : ${t}`); assert.ok(mod, `canevas : module de ${t}`); }
    // panneau du composant de départ : six sections, effet réglable, annulable
    await page.locator(`[data-pb-layers] .pb-node[data-id="edit00000001"] > .pb-row-item`).first().click(); await wait(300);
    const titles = await page.locator("[data-pb-inspector] .pb-acc-title").allTextContents();
    for (const t of ["Contenu", "Style", "Animation", "Interactions", "Responsive", "Avancé"]) assert.ok(titles.includes(t), `section ${t} : ${titles.join("|")}`);
    const eff = page.locator('[data-pb-inspector] .pb-field:has(> label:text-is("Effet")) select');
    assert.equal((await eff.locator("option").allTextContents()).length, 8);
    await eff.selectOption("iris"); await wait(300);
    assert.equal(flat(await doc()).find((n) => n.id === "edit00000001").motion.studio.preset, "iris");
    await page.evaluate(() => { const b = [...document.querySelectorAll("button")].find((x) => /Annuler/.test(x.getAttribute("data-tip") || "") && !x.disabled); if (b) b.click(); }); await wait(300);
    assert.equal(flat(await doc()).find((n) => n.id === "edit00000001").motion, undefined, "annulation : plus de réglage");
    // les composants sans animation lisible n'ont pas de faux lecteur ; la parallaxe n'a pas de faux déclencheur
    const insp = async (type) => { const id = flat(await doc()).find((n) => n.type === type).id; await page.locator(`[data-pb-layers] .pb-node[data-id="${id}"] > .pb-row-item`).first().click(); await wait(300); return { play: await page.locator('[data-pb-inspector] [data-ms-act="play"]').count(), trigger: await page.locator('[data-pb-inspector] .pb-field:has(> label:text-is("Déclencheur"))').count(), scrub: await page.locator('[data-pb-inspector] [data-ms-act]').count() }; };
    assert.equal((await insp("motiontiltcard")).play, 0); assert.equal((await insp("motioncursor")).play, 0); assert.equal((await insp("motionbutton")).play, 0);
    const par = await insp("motionimageparallax"); assert.equal(par.trigger, 0, "parallaxe : déclencheur imposé (défilement)");
    const lot = await insp("motionlottie"); assert.equal(lot.trigger, 1, "Lottie : tous les déclencheurs du runtime");
    assert.match(await page.locator("[data-pb-inspector]").textContent(), /Vitesse \(1 = normale\)/, "vitesse de l'animation réglable");
    await settle();
    const saved = JSON.parse(db.prepare("SELECT draft FROM mk_landing_pages WHERE id = ?").get(editId).draft);
    for (const type of Object.keys(LABELS)) assert.ok(flat(saved).some((n) => n.type === type), `enregistré : ${type}`);
    assert.deepEqual(errs, []); await ctx.close();
  });
});
