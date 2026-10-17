// Parité Elementor, partie 2 (Chrome réel, vrai serveur) : Appel à l'action, Playlist vidéo, Bouton flottant, séparateurs de forme, animations de survol,
// formes de masque, lettrine et colonnes de texte. Chaque réglage : validé par le serveur, enregistré, relu, appliqué à la page publiée (styles calculés).
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
async function until(check, { timeout = 10000, every = 80, what = "condition" } = {}) {
  const end = Date.now() + timeout;
  for (;;) { let v = null; try { v = await check(); } catch { v = null; } if (v) return v; if (Date.now() > end) throw new Error(`Délai dépassé : ${what}`); await wait(every); }
}

describe("parité Elementor : widgets et effets (navigateur)", { skip: SKIP }, () => {
  let srv, boss, anon, browser, page, errors, id, slug;
  const db = () => srv.db();
  const row = () => db().prepare("SELECT * FROM mk_landing_pages WHERE id = ?").get(id);
  const draftKids = () => JSON.parse(row().draft).sections[0].children[0].children;
  const put = (children, containerExtra = {}) => boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", json: { revision: row().revision, content: { title: "Parité", sections: [{ id: "sect00000001", type: "layout", children: [{ id: "cont00000001", type: "container", ...containerExtra, children }] }] } } });
  const publish = async () => { assert.equal((await boss.post(`/marketing/pages/${id}/publier.json`, {})).status, 200); };
  const open = async () => { await publish(); await page.goto(`${srv.base}/p/${slug}`); };

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); anon = new Client(srv.base);
    const created = await boss.post("/marketing/pages", { name: "Parité", template: "", ouvrir: "editeur" });
    id = Number(created.location.match(/pages\/(\d+)/)[1]);
    slug = db().prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(id).slug;
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
    const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
    await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    page = await context.newPage(); errors = [];
    page.on("pageerror", (e) => errors.push(`pageerror : ${e.message}`));
  });
  after(async () => { if (browser) await browser.close(); if (srv) await srv.stop(); });

  test("Appel à l'action : carte classique avec bouton, carte entière cliquable, bandeau ; refus d'un bouton sans lien", async () => {
    let r = await put([{ type: "cta", props: { title: "Offre", text: "Texte", buttonLabel: "Go", link: "/catalogue", ribbon: "Nouveau" } }, { type: "cta", props: { skin: "cover", title: "Carte", applyOn: "box", link: "/catalogue", buttonLabel: "Voir" } }]);
    assert.equal(r.status, 200, r.text);
    await open();
    assert.equal(await page.locator("a.kw-cta-button").count(), 1, "un seul bouton-lien (l'autre carte est un lien entier)");
    assert.equal(await page.locator("a.kw-cta-whole").count(), 1);
    assert.equal(await page.locator("a.kw-cta-whole a").count(), 0, "aucun lien dans un lien");
    assert.equal(await page.locator(".kw-cta-ribbon").textContent(), "Nouveau");
    r = await put([{ type: "cta", props: { title: "X", buttonLabel: "Go", link: "" } }]);
    assert.equal(r.status, 422); assert.match(r.text, /un bouton demande un lien/);
  });

  test("Playlist vidéo : lecteur reconstruit, clic = lecture dans le lecteur, adresse non YouTube/Vimeo refusée", async () => {
    let r = await put([{ type: "videoplaylist", props: { title: "Série", videos: [{ title: "Un", url: "https://www.youtube.com/watch?v=aqz-KE-bpKQ" }, { title: "Deux", url: "https://vimeo.com/76979871" }] } }]);
    assert.equal(r.status, 200, r.text);
    await open();
    const first = await page.locator(".kw-vp-frame").getAttribute("src");
    assert.match(first, /^https:\/\/www\.youtube(-nocookie)?\.com\/embed\/aqz-KE-bpKQ/);
    await page.locator(".kw-vp-item").nth(1).click();
    await until(async () => /player\.vimeo\.com\/video\/76979871/.test((await page.locator(".kw-vp-frame").getAttribute("src")) || ""), { what: "lecteur Vimeo" });
    assert.equal(await page.locator(".kw-vp-item.is-current").innerText().then((t) => /Deux/.test(t)), true);
    r = await put([{ type: "videoplaylist", props: { videos: [{ title: "X", url: "https://exemple.test/video.mp4" }] } }]);
    assert.equal(r.status, 422); assert.match(r.text, /YouTube ou Vimeo/);
  });

  test("Bouton flottant : adresse reconstruite par service, validée ; fixé au coin sur la page publiée", async () => {
    let r = await put([{ type: "floatingbutton", props: { platform: "whatsapp", contact: "+33 6 12 34 56 78", message: "Bonjour !" } }]);
    assert.equal(r.status, 200, r.text);
    await open();
    assert.equal(await page.locator("a.kw-fb-btn").getAttribute("href"), "https://wa.me/33612345678?text=Bonjour%20!");
    assert.equal(await page.evaluate(() => getComputedStyle(document.querySelector(".kw-floatingbutton")).position), "fixed");
    for (const [props, expect] of [[{ platform: "email", contact: "a@b.fr" }, "mailto:a@b.fr"], [{ platform: "messenger", contact: "kolakisa" }, "https://m.me/kolakisa"], [{ platform: "sms", contact: "33612345678" }, "sms:+33612345678"]]) {
      r = await put([{ type: "floatingbutton", props }]); assert.equal(r.status, 200, r.text); await open();
      assert.equal(await page.locator("a.kw-fb-btn").getAttribute("href"), expect);
    }
    for (const props of [{ platform: "whatsapp", contact: "12" }, { platform: "email", contact: "pas-un-mail" }, { platform: "messenger", contact: "a b<script>" }]) {
      r = await put([{ type: "floatingbutton", props }]); assert.equal(r.status, 422, JSON.stringify(props));
    }
  });

  test("Séparateur de forme : forme, couleur, hauteur et retournement appliqués ; valeurs inconnues ignorées ; pas plus d'un par côté", async () => {
    let r = await put([{ type: "text", props: { html: "<p>x</p>" } }], { shapes: [{ position: "bottom", shape: "wave", color: "#ff0000", height: 140, flip: true }, { position: "bottom", shape: "tilt" }, { position: "top", shape: "inconnue" }] });
    assert.equal(r.status, 200, r.text);
    const saved = JSON.parse(row().draft).sections[0].children[0];
    assert.deepEqual(saved.shapes, [{ position: "bottom", shape: "wave", color: "#ff0000", height: 140, flip: true }]);
    await open();
    const m = await page.evaluate(() => { const s = document.querySelector(".kw-shape-bottom"); const c = getComputedStyle(s); return { h: Math.round(s.getBoundingClientRect().height), color: c.color, clip: c.clipPath.slice(0, 7), pos: c.position, flip: c.transform }; });
    assert.equal(m.h, 140); assert.equal(m.color, "rgb(255, 0, 0)"); assert.equal(m.clip, "polygon"); assert.equal(m.pos, "absolute"); assert.notEqual(m.flip, "none");
  });

  test("Animations de survol (12 nouvelles) et formes de masque (fleur, blob, croquis)", async () => {
    const hovers = ["float", "sink", "rotate", "skew", "push", "pop", "pulse", "bounce", "bob", "hang", "wobble", "buzz"];
    const r = await put(hovers.map((h, i) => ({ type: "text", id: "text0000000" + String.fromCharCode(97 + i), motion: { hover: h }, props: { html: `<p>${h}</p>` } })));
    assert.equal(r.status, 200, r.text);
    assert.deepEqual(draftKids().map((k) => (k.motion || {}).hover), hovers);
    await open();
    for (const h of hovers) {
      const el = page.locator(`.kw-hover-${h}`).first();
      await el.hover(); await wait(120);
      const css = await el.evaluate((n) => { const c = getComputedStyle(n); return { anim: c.animationName, tf: c.transform }; });
      assert.ok(css.anim !== "none" || css.tf !== "none", `${h} : aucune animation ni transformation au survol`);
    }
    const r2 = await put([{ type: "image", props: { src: "https://exemple.test/a.jpg", alt: "a" }, styles: { desktop: { mask: { shape: "blob" } } } }]);
    assert.equal(r2.status, 200, r2.text);
    await open();
    assert.match(await page.evaluate(() => getComputedStyle(document.querySelector(".kw-image")).clipPath), /^polygon\(/);
  });

  test("Lettrine et colonnes de texte", async () => {
    const r = await put([{ type: "text", props: { html: "<p>Une longue histoire commence ici et continue sur plusieurs lignes pour remplir les colonnes du journal.</p>", dropCap: true }, styles: { desktop: { columnCount: 3 } } }]);
    assert.equal(r.status, 200, r.text);
    assert.equal(draftKids()[0].props.dropCap, true); assert.equal(draftKids()[0].styles.desktop.columnCount, 3);
    await open();
    const m = await page.evaluate(() => { const t = document.querySelector(".kw-text"); const c = getComputedStyle(t); const fl = getComputedStyle(t.querySelector("p"), "::first-letter"); return { cols: c.columnCount, gap: c.columnGap, drop: t.classList.contains("kw-dropcap"), float: fl.float }; });
    assert.equal(m.cols, "3"); assert.equal(m.drop, true); assert.equal(m.float, "left"); assert.notEqual(m.gap, "normal");
  });

  test("éditeur : séparateur de forme et lettrine réglables dans l'inspecteur ; la forme apparaît dans le canevas", async () => {
    await put([{ id: "text00000001", type: "text", props: { html: "<p>Un texte</p>" } }]);
    await page.goto(`${srv.base}/marketing/pages/${id}/editeur`);
    await page.waitForFunction(() => { const f = document.querySelector("[data-pb-frame]"); return f && f.contentDocument && f.contentDocument.body && f.contentDocument.body.classList.contains("lp-builder"); }, null, { timeout: 15000 });
    await wait(500);
    // lettrine : texte sélectionné
    await page.locator('[data-pb-layers] .pb-node[data-id="text00000001"] > .pb-row-item').click();
    try { await page.locator('[data-pb-inspector] label:has-text("Lettrine") input, [data-pb-inspector] input[aria-label*="Lettrine"]').first().check({ timeout: 5000 }); } catch (e) { console.log("INSPECTEUR:", (await page.locator("[data-pb-inspector]").innerText()).slice(0, 800)); throw e; }
    await until(() => draftKids()[0].props.dropCap === true, { what: "lettrine enregistrée" });
    // séparateur de forme : conteneur sélectionné
    await page.locator('[data-pb-layers] .pb-node[data-id="cont00000001"] > .pb-row-item').click();
    await page.locator('[data-pb-inspector] [role="tab"]:has-text("Style"), [data-pb-inspector] button:text-is("Style")').first().click();
    await page.locator("[data-pb-inspector] details").evaluateAll((ds) => ds.forEach((d) => { d.open = true; }));
    const sel = page.locator('[data-pb-inspector] .pb-field:has(label:text-is("Séparateur de forme en bas")) select').first();
    try { await sel.waitFor({ state: "visible", timeout: 8000 }); } catch (e) { console.log("GROUPES:", await page.locator("[data-pb-inspector] details").evaluateAll((ds) => ds.map((d) => d.dataset.group + "=" + d.innerText.slice(0, 60).replace(/\n/g, "|")))); throw e; }
    await sel.selectOption("zigzag");
    await until(() => (JSON.parse(row().draft).sections[0].children[0].shapes || [])[0], { what: "forme enregistrée" });
    assert.equal(JSON.parse(row().draft).sections[0].children[0].shapes[0].shape, "zigzag");
    assert.ok(await page.evaluate(() => !!document.querySelector("[data-pb-frame]").contentDocument.querySelector(".kw-shp-zigzag")), "forme visible dans le canevas");
  });

  test("aucune erreur de script", () => { assert.deepEqual(errors, []); });
});
