// Parité Elementor, partie 3 (Chrome réel, vrai serveur) : compte à rebours (minuteur par visiteur, action à la fin, unités), séparateur des milliers,
// réseaux de partage, début/fin de vidéo, jours et heures d'affichage, magnétisme de défilement, diaporama de fond, Ken Burns, liste d'icônes en ligne,
// collage depuis le presse-papiers du système.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, Client, loginInstructor } = require("./helpers");

let chromium = null, sharp = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
try { sharp = require("sharp"); } catch { /* sharp absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : parcours navigateur non exécuté sur cette machine" : false;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
async function until(check, { timeout = 10000, every = 80, what = "condition" } = {}) {
  const end = Date.now() + timeout;
  for (;;) { let v = null; try { v = await check(); } catch { v = null; } if (v) return v; if (Date.now() > end) throw new Error(`Délai dépassé : ${what}`); await wait(every); }
}

describe("parité Elementor : suite (navigateur)", { skip: SKIP }, () => {
  let srv, boss, anon, browser, context, page, errors, id, slug, imgs = [];
  const db = () => srv.db();
  const row = () => db().prepare("SELECT * FROM mk_landing_pages WHERE id = ?").get(id);
  const draft = () => JSON.parse(row().draft);
  const kids = () => draft().sections[0].children[0].children;
  const put = (children, extra = {}, theme) => boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", json: { revision: row().revision, content: { title: "Suite", ...(theme ? { theme: { ...JSON.parse(row().theme), ...theme } } : {}), sections: [{ id: "sect00000001", type: "layout", children: [{ id: "cont00000001", type: "container", ...extra, children }] }] } } });
  const publish = async () => assert.equal((await boss.post(`/marketing/pages/${id}/publier.json`, {})).status, 200);
  const open = async () => { await publish(); await page.goto(`${srv.base}/p/${slug}`); };

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); anon = new Client(srv.base);
    if (sharp) for (const c of [{ r: 200, g: 40, b: 40 }, { r: 40, g: 200, b: 40 }]) {
      const buf = await sharp({ create: { width: 400, height: 300, channels: 3, background: c } }).jpeg().toBuffer();
      const fd = new FormData(); fd.append("file", new Blob([buf], { type: "image/jpeg" }), "f.jpg");
      imgs.push(JSON.parse((await boss.request("/marketing/site-web/mediatheque/televerser", { method: "POST", multipart: fd })).text).media);
    }
    const created = await boss.post("/marketing/pages", { name: "Suite", template: "", ouvrir: "editeur" });
    id = Number(created.location.match(/pages\/(\d+)/)[1]);
    slug = db().prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(id).slug;
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
    context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
    await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    page = await context.newPage(); errors = [];
    page.on("pageerror", (e) => errors.push(`pageerror : ${e.message}`));
  });
  after(async () => { if (browser) await browser.close(); if (srv) await srv.stop(); });

  test("compte à rebours : minuteur par visiteur (mémorisé), unités masquées, fin = masquer ou rediriger ; validations", async () => {
    const future = new Date(Date.now() + 3 * 86400000).toISOString();
    let r = await put([{ type: "countdown", id: "cd0000000001", props: { until: future, endText: "Fini", mode: "evergreen", minutes: 90, hideUnits: ["days"] } }]);
    assert.equal(r.status, 200, r.text);
    assert.deepEqual({ m: kids()[0].props.mode, mi: kids()[0].props.minutes, h: kids()[0].props.hideUnits }, { m: "evergreen", mi: 90, h: ["days"] });
    await open();
    await until(async () => (await page.locator(".kw-countdown-unit").count()) === 3, { what: "3 unités (jours masqués)" });
    const first = await page.evaluate(() => { const strong = [...document.querySelectorAll(".kw-countdown-unit strong")].map((s) => Number(s.textContent)); return strong; });
    assert.ok(first[0] === 1 && first[1] >= 29 || first[0] === 1, `90 minutes = 1 h 30 (heures masquées incluses) : ${first}`);
    const stored = await page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith("kw-cd-")));
    assert.equal(stored.length, 1, "fin mémorisée dans ce navigateur");
    await page.reload();
    assert.equal((await page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith("kw-cd-")))).length, 1, "pas de nouveau minuteur à la visite suivante");
    // fin : masquer
    r = await put([{ type: "countdown", props: { until: new Date(Date.now() - 5000).toISOString(), mode: "fixed", expire: "hide" } }]);
    assert.equal(r.status, 200, r.text); await open();
    await until(async () => (await page.locator(".kw-countdown").evaluate((n) => n.hidden)), { what: "masqué à la fin" });
    // fin : rediriger
    r = await put([{ type: "countdown", props: { until: new Date(Date.now() - 5000).toISOString(), expire: "redirect", redirectUrl: "/catalogue" } }]);
    assert.equal(r.status, 200, r.text); await publish();
    await Promise.all([page.waitForURL(/\/catalogue/, { timeout: 8000 }), page.goto(`${srv.base}/p/${slug}`)]);
    // validations
    r = await put([{ type: "countdown", props: { until: future, mode: "evergreen", minutes: 0 } }]); assert.equal(r.status, 422);
    r = await put([{ type: "countdown", props: { until: future, expire: "redirect", redirectUrl: "javascript:alert(1)" } }]); assert.equal(r.status, 422);
    r = await put([{ type: "countdown", props: { until: future, expire: "redirect", redirectUrl: "//autre.test" } }]); assert.equal(r.status, 422, "adresse relative au protocole refusée");
  });

  test("compteur : séparateur des milliers (espace, point, aucun)", async () => {
    const r = await put([{ type: "counter", props: { value: 1234567, label: "a", separator: "dot", duration: 0 } }, { type: "counter", props: { value: 1234567, label: "b", separator: "none", duration: 0 } }, { type: "counter", props: { value: 1234567, label: "c", duration: 0 } }]);
    assert.equal(r.status, 200, r.text); await open();
    const v = await page.locator(".kw-counter-value").allTextContents();
    assert.equal(v[0], "1.234.567"); assert.equal(v[1], "1234567"); assert.match(v[2], /^1\s234\s567$/u);
  });

  test("partage : 4 nouveaux réseaux avec leurs adresses de partage", async () => {
    const r = await put([{ type: "sharebuttons", props: { networks: ["telegram", "pinterest", "reddit", "threads"], size: 40, shape: "circle", label: "Partager", shareUrl: "https://k.test/p/x", message: "Salut" } }]);
    assert.equal(r.status, 200, r.text); await open();
    const hrefs = await page.locator("a.kw-social-link").evaluateAll((as) => as.map((a) => a.href));
    assert.match(hrefs[0], /^https:\/\/t\.me\/share\/url\?url=/); assert.match(hrefs[1], /^https:\/\/www\.pinterest\.com\/pin\/create\/button\//);
    assert.match(hrefs[2], /^https:\/\/www\.reddit\.com\/submit\?url=/); assert.match(hrefs[3], /^https:\/\/www\.threads\.net\/intent\/post\?text=/);
  });

  test("vidéo : début et fin (YouTube) ; validation de la fin", async () => {
    let r = await put([{ type: "video", props: { url: "https://www.youtube.com/watch?v=aqz-KE-bpKQ", title: "V", start: 30, end: 90 } }]);
    assert.equal(r.status, 200, r.text); await open();
    const src = await page.locator("iframe").first().getAttribute("src");
    assert.match(src, /[?&]start=30(&|$)/); assert.match(src, /[?&]end=90(&|$)/);
    r = await put([{ type: "video", props: { url: "https://www.youtube.com/watch?v=aqz-KE-bpKQ", title: "V", start: 60, end: 30 } }]);
    assert.equal(r.status, 422); assert.match(r.text, /la fin doit venir après le début/);
  });

  test("jours et heures d'affichage (heure de Paris) : élément masqué hors plage, affiché dedans ; plage incomplète refusée", async () => {
    const nowParis = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Paris", weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date()).reduce((o, p) => ({ ...o, [p.type]: p.value }), {});
    const today = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 }[nowParis.weekday], other = today === 7 ? 1 : today + 1;
    const hh = Number(nowParis.hour), from = `${String((hh + 23) % 24).padStart(2, "0")}:00`, to = `${String((hh + 1) % 24).padStart(2, "0")}:59`;
    const r = await put([
      { type: "text", id: "text00000001", schedule: { days: [today], hours: { from, to } }, props: { html: "<p>ICI-MAINTENANT</p>" } },
      { type: "text", id: "text00000002", schedule: { days: [other] }, props: { html: "<p>AUTRE-JOUR</p>" } },
      { type: "text", id: "text00000003", schedule: { hours: { from: "00:00", to: "00:01" } }, props: { html: "<p>HEURE-INCOMPLETE?</p>" } },
    ]);
    assert.equal(r.status, 200, r.text);
    assert.deepEqual(kids()[0].schedule.days, [today]);
    const html = (await (async () => { await publish(); return anon.get(`/p/${slug}`); })()).text;
    assert.ok(html.includes("ICI-MAINTENANT"), "dans la plage : affiché");
    assert.ok(!html.includes("AUTRE-JOUR"), "autre jour : masqué");
    const bad = await put([{ type: "text", props: { html: "<p>x</p>" }, schedule: { hours: { from: "10:00" } } }]);
    assert.equal(bad.status, 422); assert.match(bad.text, /plage horaire incomplète/);
  });

  test("magnétisme de défilement : réglage enregistré, CSS appliqué à la page publiée, absent de l'éditeur", async () => {
    let r = await put([{ type: "text", props: { html: "<p>a</p>" } }], {}, { scrollSnap: { position: "center", padding: 60, always: true } });
    assert.equal(r.status, 200, r.text);
    assert.deepEqual(draft().theme.scrollSnap, { position: "center", padding: 60, always: true });
    await open();
    const m = await page.evaluate(() => { const c = getComputedStyle(document.documentElement); return { type: c.scrollSnapType, pad: c.scrollPaddingTop, align: getComputedStyle(document.querySelector(".lp-main > *")).scrollSnapAlign }; });
    assert.match(m.type, /^y mandatory/); assert.equal(m.pad, "60px"); assert.match(m.align, /center/);
    r = await put([{ type: "text", props: { html: "<p>a</p>" } }], {}, { scrollSnap: { position: "diagonale" } });
    assert.equal(draft().theme.scrollSnap, undefined, "valeur inconnue ignorée");
    await page.goto(`${srv.base}/marketing/pages/${id}/editeur`);
    await page.waitForFunction(() => { const f = document.querySelector("[data-pb-frame]"); return f && f.contentDocument && f.contentDocument.body && f.contentDocument.body.classList.contains("lp-builder"); }, null, { timeout: 15000 });
  });

  test("diaporama de fond (conteneur) et Ken Burns du diaporama : images en fondu, première visible, cycle", { skip: !sharp }, async () => {
    let r = await put([{ type: "text", props: { html: "<p>sur fond</p>" } }], { bgSlides: { images: [imgs[0].path, imgs[1].path], seconds: 2, kenBurns: true } });
    assert.equal(r.status, 200, r.text);
    assert.deepEqual(JSON.parse(row().draft).sections[0].children[0].bgSlides, { images: [imgs[0].path, imgs[1].path], seconds: 2, kenBurns: true });
    await open();
    assert.equal(await page.locator(".kw-bgslide").count(), 2);
    assert.equal(await page.evaluate(() => document.querySelector(".kw-bgslide").classList.contains("is-on")), true);
    await until(async () => page.evaluate(() => document.querySelectorAll(".kw-bgslide")[1].classList.contains("is-on")), { timeout: 6000, what: "image suivante" });
    r = await put([{ type: "text", props: { html: "<p>x</p>" } }], { bgSlides: { images: ["javascript:alert(1)", imgs[0].path] } });
    assert.equal(r.status, 422, "adresse d'image dangereuse refusée");
    r = await put([{ type: "slides", props: { label: "D", slides: [{ image: imgs[0].path, title: "T", text: "", buttonLabel: "", buttonUrl: "", dark: 20 }], kenBurns: "in", height: 300 } }]);
    assert.equal(r.status, 200, r.text); await open();
    assert.match(await page.locator(".kw-slides").getAttribute("class"), /is-kb-in/);
    assert.notEqual(await page.evaluate(() => getComputedStyle(document.querySelector(".kw-slide-img")).animationName), "none");
  });

  test("liste d'icônes : disposition en ligne et séparateurs", async () => {
    const r = await put([{ type: "iconlist", props: { items: [{ text: "A", icon: "check" }, { text: "B", icon: "check" }], inline: true, divider: true } }]);
    assert.equal(r.status, 200, r.text); await open();
    const m = await page.evaluate(() => { const ul = document.querySelector(".kw-iconlist"); const lis = ul.querySelectorAll("li"); return { disp: getComputedStyle(ul).display, sameRow: Math.abs(lis[0].getBoundingClientRect().top - lis[1].getBoundingClientRect().top) < 3, border: getComputedStyle(lis[1]).borderLeftWidth }; });
    assert.equal(m.disp, "flex"); assert.ok(m.sameRow); assert.equal(m.border, "1px");
  });

  test("éditeur : copier puis « Coller depuis un autre site ou navigateur » (presse-papiers du système)", async () => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: srv.base });
    await put([{ type: "text", id: "text00000001", props: { html: "<p>À COPIER</p>" } }]);
    await page.goto(`${srv.base}/marketing/pages/${id}/editeur`);
    await page.waitForFunction(() => { const f = document.querySelector("[data-pb-frame]"); return f && f.contentDocument && f.contentDocument.body && f.contentDocument.body.classList.contains("lp-builder"); }, null, { timeout: 15000 });
    await wait(500);
    await page.locator('[data-pb-layers] .pb-node[data-id="text00000001"] > .pb-row-item').click();
    await page.keyboard.press("Control+c");
    await until(async () => (await page.evaluate(() => navigator.clipboard.readText())).startsWith("KOLAKISA:"), { what: "texte balisé dans le presse-papiers" });
    await page.evaluate(() => localStorage.clear()); // autre site / navigateur : la copie interne n'existe plus
    await page.locator('[data-pb-layers] .pb-node[data-id="text00000001"] > .pb-row-item').click({ button: "right" });
    await page.getByText("Coller depuis un autre site ou navigateur").first().click();
    await until(() => kids().length === 2, { what: "élément collé" });
    assert.match(kids()[1].props.html, /À COPIER/);
    assert.notEqual(kids()[1].id, kids()[0].id, "nouvel identifiant");
  });

  test("dégradé radial avec positions, bordures double et gravée, vidéo de fond (début, fin, image de secours, lecture unique)", async () => {
    let r = await put([{ type: "text", props: { html: "<p>x</p>" } }], { styles: { desktop: { gradient: { from: "#ff0000", to: "#0000ff", angle: 0, type: "radial", fromAt: 20, toAt: 80 }, borderStyle: "groove", borderWidth: "6px", borderColor: "#333333", minHeight: "120px" } } });
    assert.equal(r.status, 200, r.text);
    const st = JSON.parse(row().draft).sections[0].children[0].styles.desktop;
    assert.deepEqual(st.gradient, { from: "#ff0000", to: "#0000ff", angle: 0, type: "radial", fromAt: 20, toAt: 80 });
    await open();
    const m = await page.evaluate(() => { const c = getComputedStyle(document.querySelector(".kw-container")); return { bg: c.backgroundImage, bs: c.borderTopStyle }; });
    assert.match(m.bg, /^radial-gradient\(/); assert.match(m.bg, /20%/); assert.match(m.bg, /80%/); assert.equal(m.bs, "groove");
    r = await put([{ type: "text", props: { html: "<p>x</p>" } }], { styles: { desktop: { borderStyle: "double", borderWidth: "4px" } } });
    assert.equal(r.status, 200, r.text);
    r = await put([{ type: "text", props: { html: "<p>x</p>" } }], { bgVideo: { src: "https://exemple.test/fond.mp4", start: 3, end: 9, once: true, poster: imgs[0] ? imgs[0].path : "https://exemple.test/p.jpg" } });
    assert.equal(r.status, 200, r.text);
    await open();
    const v = await page.evaluate(() => { const e = document.querySelector("video.kw-bg-video"); return { src: e.getAttribute("src"), loop: e.hasAttribute("loop"), poster: !!e.getAttribute("poster") }; });
    assert.match(v.src, /fond\.mp4#t=3,9$/); assert.equal(v.loop, false); assert.equal(v.poster, true);
    r = await put([{ type: "text", props: { html: "<p>x</p>" } }], { bgVideo: { src: "https://exemple.test/fond.mp4", start: 9, end: 3 } });
    assert.equal(r.status, 422); assert.match(r.text, /la fin doit venir après le début/);
  });

  test("aucune erreur de script", () => { assert.deepEqual(errors, []); });
});
