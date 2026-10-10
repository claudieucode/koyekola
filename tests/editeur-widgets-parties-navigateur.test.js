// Parties d'un widget dans un VRAI Chrome — cas « Derniers articles du blog » : sélecteur de partie, réglages de la carte et du titre par l'Inspector
// (rayon, taille), par écran, au survol ; enregistrement en base, rechargement, annuler / rétablir, aperçu, page publiée ; un widget jamais touché
// garde exactement son rendu ; un geste du canevas n'écrit jamais dans une partie.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const zlib = require("zlib");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : parcours navigateur non exécuté sur cette machine" : false;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const ID = "posts0000001";

describe("parties des widgets (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, pageId, otherId, slug;
  const db = () => srv.db();
  const draft = (id = pageId) => JSON.parse(db().prepare("SELECT draft FROM mk_landing_pages WHERE id = ?").get(id).draft || "null");
  const mkPage = async (name, content) => {
    const id = Number((await boss.post("/marketing/pages", { name })).location.match(/(\d+)$/)[1]);
    const rev = db().prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(id).revision;
    const r = await boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", json: { revision: rev, content }, headers: { Origin: srv.base } });
    assert.equal(r.status, 200, r.text); return id;
  };
  const open = async (id = pageId) => {
    const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
    await ctx.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    const page = await ctx.newPage(); const errors = []; page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(`${srv.base}/marketing/pages/${id}/editeur`);
    await page.waitForFunction(() => { const f = document.querySelector("[data-pb-frame]"); return f && f.contentDocument && f.contentDocument.querySelector(".kw-post-card"); }, null, { timeout: 30000 });
    await wait(500);
    return { ctx, page, errors };
  };
  const frameEval = (page, fn, arg) => page.evaluate(({ src, arg }) => new Function("d", "w", "arg", `return (${src})(d, w, arg)`)(document.querySelector("[data-pb-frame]").contentDocument, document.querySelector("[data-pb-frame]").contentWindow, arg), { src: fn.toString(), arg });
  const selectPosts = async (page) => { await page.evaluate((id) => { const f = document.querySelector("[data-pb-frame]").contentDocument; f.querySelector(`[data-node-id="${id}"]`).dispatchEvent(new MouseEvent("mousedown", { bubbles: true })); f.querySelector(`[data-node-id="${id}"]`).dispatchEvent(new MouseEvent("click", { bubbles: true })); }, ID); await page.waitForFunction((id) => window.__pb.selection().includes(id), ID); await page.locator('[data-pb-inspector] [role=tab]', { hasText: /^Style$/ }).click(); await wait(200); };
  const chip = (page, label) => page.locator(".pb-part", { hasText: new RegExp(`^${label}`) });
  const setLen = async (page, prop, value) => { const input = page.locator(`[data-pb-inspector] [data-prop="${prop}"] input`).first(); await input.evaluate((e) => { let d = e.closest("details"); while (d) { d.open = true; d = d.parentElement && d.parentElement.closest("details"); } }); await input.fill(String(value)); await input.press("Enter"); await wait(900); };
  const computed = (page, sel, prop) => frameEval(page, (d, w, a) => { const e = d.querySelector(a[0]); return e ? w.getComputedStyle(e)[a[1]] : null; }, [sel, prop]);

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
    for (let i = 1; i <= 3; i++) db().prepare("INSERT INTO posts (slug, title, excerpt, published, published_at, status) VALUES (?, ?, 'Un résumé assez long pour tester la coupure de l''extrait sur plusieurs lignes, avec beaucoup de mots à la suite.', 1, datetime('now', ?), 'published')").run(`art-${i}`, `Article ${i}`, `-${i} hour`);
    const content = { sections: [{ id: "sect0000001", type: "layout", children: [{ id: ID, type: "posts", props: { count: 3, layout: "grid" } }] }] };
    pageId = await mkPage("Parties", content);
    otherId = await mkPage("Parties témoin", content);
    slug = db().prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(pageId).slug;
  });
  after(async () => { if (browser) await browser.close(); if (srv) await srv.stop(); });

  test("le sélecteur de partie apparaît pour « Derniers articles » ; chaque partie ne propose que ses groupes de réglages", async () => {
    const { ctx, page, errors } = await open();
    await selectPosts(page);
    const chips = await page.locator(".pb-part").allTextContents();
    assert.deepEqual(chips, ["Widget", "Carte", "Image", "Corps de la carte", "Date", "Titre", "Extrait"]);
    const groups = async () => (await page.locator("[data-pb-inspector] details.pb-acc[data-group]").evaluateAll((els) => els.map((e) => e.getAttribute("data-group"))));
    await chip(page, "Carte").click(); await wait(200);
    const card = await groups(); assert.ok(card.includes("background") && card.includes("border") && card.includes("spacing") && !card.includes("typography"), card.join());
    await chip(page, "Titre").click(); await wait(200);
    const title = await groups(); assert.ok(title.includes("typography") && !title.includes("border") && !title.includes("background"), title.join());
    await chip(page, "Widget").click(); await wait(200);
    assert.ok((await groups()).includes("typography"), "le profil du widget lui-même est inchangé");
    assert.deepEqual(errors, []);
    await ctx.close();
  });

  test("rayon de la carte, taille du titre (ordinateur puis tablette), survol, enregistrement, rechargement, annuler / rétablir", async () => {
    const { ctx, page, errors } = await open();
    const before = { radius: await computed(page, ".kw-post-card", "borderRadius"), title: await computed(page, ".kw-post-title", "fontSize"), excerpt: await computed(page, ".kw-post-excerpt", "fontSize") };
    await selectPosts(page);
    await chip(page, "Carte").click(); await wait(200);
    await setLen(page, "borderRadius", 28);
    assert.equal(await computed(page, ".kw-post-card", "borderRadius"), "28px");
    await chip(page, "Titre").click(); await wait(200);
    await setLen(page, "fontSize", 31);
    assert.equal(await computed(page, ".kw-post-title", "fontSize"), "31px");
    assert.equal(await computed(page, ".kw-post-excerpt", "fontSize"), before.excerpt, "les autres parties ne bougent pas");
    // tablette : une valeur propre à l'écran
    await page.locator('[data-pb-inspector] [data-device="tablet"]').click(); await wait(700);
    await setLen(page, "fontSize", 19);
    assert.equal(await computed(page, ".kw-post-title", "fontSize"), "19px");
    await page.locator('[data-pb-inspector] [data-device="desktop"]').click(); await wait(700);
    assert.equal(await computed(page, ".kw-post-title", "fontSize"), "31px", "ordinateur inchangé");
    // survol de la carte
    await chip(page, "Carte").click(); await wait(200);
    await page.locator('[data-pb-inspector] .pb-state-seg button', { hasText: "Survol" }).click(); await wait(300);
    const sel = page.locator('[data-pb-inspector] [data-prop="boxShadow"] select').first(); await sel.evaluate((e) => { let d = e.closest("details"); while (d) { d.open = true; d = d.parentElement && d.parentElement.closest("details"); } });
    await sel.selectOption("lg"); await wait(900);
    const css = await frameEval(page, (d) => [...d.querySelectorAll("style")].map((s) => s.textContent).join("\n"));
    assert.match(css, /\.kw-node\.kw-n-posts0000001 \.kw-post-card:hover\{box-shadow:/);
    // enregistrement
    await page.waitForFunction(() => !window.__pb.dirty(), null, { timeout: 15000 });
    const saved = draft();
    const node = saved.sections[0].children[0];
    assert.equal(node.parts.card.styles.desktop.borderRadius, "28px");
    assert.equal(node.parts.title.styles.desktop.fontSize, "31px");
    assert.equal(node.parts.title.styles.tablet.fontSize, "19px");
    assert.ok(node.parts.card.states.hover.boxShadow);
    assert.equal(node.styles, undefined, "le widget lui-même n'a reçu aucun style");
    // annuler : le survol, puis la taille tablette
    const live = () => page.evaluate((id) => { const n = window.__pb.content().sections[0].children.find((c) => c.id === id); return n.parts || {}; }, ID);
    await page.locator("[data-pb-undo]").click(); await wait(400);
    assert.equal((await live()).card.states, undefined, "après annulation : plus de survol");
    assert.equal((await live()).card.styles.desktop.borderRadius, "28px", "une seule étape annulée");
    await page.locator("[data-pb-redo]").click(); await wait(400);
    assert.ok((await live()).card.states.hover.boxShadow, "rétabli");
    await page.waitForFunction(() => !window.__pb.dirty(), null, { timeout: 15000 });
    assert.ok(draft().sections[0].children[0].parts.card.states.hover.boxShadow, "rétabli et enregistré");
    // rechargement
    await ctx.close();
    const again = await open();
    assert.equal(await computed(again.page, ".kw-post-card", "borderRadius"), "28px");
    assert.equal(await computed(again.page, ".kw-post-title", "fontSize"), "31px");
    await selectPosts(again.page);
    assert.ok(await chip(again.page, "Carte").evaluate((e) => e.classList.contains("has-own")) && await chip(again.page, "Titre").evaluate((e) => e.classList.contains("has-own")) && !(await chip(again.page, "Date").evaluate((e) => e.classList.contains("has-own"))));
    assert.deepEqual([...errors, ...again.errors], []);
    await again.ctx.close();
  });

  test("aperçu et page publiée : mêmes valeurs ; HTML identique avec et sans parties ; un geste du canevas n'écrit pas dans la partie", async () => {
    const pv = await browser.newContext({ viewport: { width: 1400, height: 900 } });
    await pv.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    const p1 = await pv.newPage();
    await p1.goto(`${srv.base}/marketing/pages/${pageId}/apercu`);
    assert.equal(await p1.evaluate(() => getComputedStyle(document.querySelector(".kw-post-card")).borderRadius), "28px");
    assert.equal(await p1.evaluate(() => getComputedStyle(document.querySelector(".kw-post-title")).fontSize), "31px");
    const html1 = await p1.evaluate(() => document.querySelector(".kw-posts").outerHTML.replace(/\s+/g, " "));
    const p2 = await pv.newPage();
    await p2.goto(`${srv.base}/marketing/pages/${otherId}/apercu`);
    const html2 = await p2.evaluate(() => document.querySelector(".kw-posts").outerHTML.replace(/\s+/g, " ").replace(/kw-n-posts0000001/g, ""));
    assert.equal(html1.replace(/kw-n-posts0000001/g, ""), html2, "le balisage est identique : seules des règles de style ont été ajoutées");
    assert.notEqual(await p2.evaluate(() => getComputedStyle(document.querySelector(".kw-post-card")).borderRadius), "28px", "la page témoin garde son rendu d'origine");
    // publication
    const r = await boss.request(`/marketing/pages/${pageId}/publier.json`, { method: "POST", json: {}, headers: { Origin: srv.base } });
    assert.equal(r.status, 200, r.text);
    const p3 = await pv.newPage();
    await p3.goto(`${srv.base}/p/${slug}`);
    assert.equal(await p3.evaluate(() => getComputedStyle(document.querySelector(".kw-post-card")).borderRadius), "28px");
    assert.equal(await p3.evaluate(() => getComputedStyle(document.querySelector(".kw-post-title")).fontSize), "31px");
    assert.equal(await p3.evaluate(() => /pb-|data-pb|__pb/.test(document.documentElement.outerHTML.replace(/<script[\s\S]*?<\/script>/g, ""))), false, "aucun élément d'éditeur dans la page publiée");
    await pv.close();
    // un geste dans le canevas (clic sur le widget) lâche la partie : aucune écriture dans la partie
    const { ctx, page } = await open();
    await selectPosts(page);
    await chip(page, "Titre").click(); await wait(200);
    assert.equal(await chip(page, "Titre").getAttribute("aria-pressed"), "true");
    await page.evaluate((id) => { const f = document.querySelector("[data-pb-frame]").contentDocument; f.querySelector(`[data-node-id="${id}"]`).dispatchEvent(new MouseEvent("mousedown", { bubbles: true })); }, ID);
    await wait(300);
    assert.equal(await chip(page, "Widget").getAttribute("aria-pressed"), "true", "retour au widget lui-même");
    await ctx.close();
  });

  test("nombre de lignes maximum de l'extrait ; réinitialisation d'une partie ; widget sans parties inchangé", async () => {
    const { ctx, page } = await open();
    await selectPosts(page);
    await chip(page, "Extrait").click(); await wait(200);
    await setLen(page, "lineClamp", 2);
    const clamped = await frameEval(page, (d, w) => { const e = d.querySelector(".kw-post-excerpt"); const cs = w.getComputedStyle(e); return { clamp: cs.webkitLineClamp, overflow: cs.overflow, lines: Math.round(e.getBoundingClientRect().height / parseFloat(cs.lineHeight)) }; });
    assert.equal(clamped.clamp, "2"); assert.equal(clamped.overflow, "hidden"); assert.ok(clamped.lines <= 2, JSON.stringify(clamped));
    await page.locator(".pb-part-reset").click(); await wait(900);
    assert.equal(await computed(page, ".kw-post-excerpt", "overflow"), "visible", "retour aux valeurs par défaut du thème");
    assert.equal(await chip(page, "Extrait").evaluate((e) => e.classList.contains("has-own")), false);
    await page.waitForFunction(() => !window.__pb.dirty(), null, { timeout: 15000 });
    assert.equal(!!(draft().sections[0].children[0].parts && draft().sections[0].children[0].parts.excerpt), false);
    await ctx.close();
  });
});
