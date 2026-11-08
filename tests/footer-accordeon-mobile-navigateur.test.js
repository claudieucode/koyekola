// Accordéon MOBILE des pieds de page dans un vrai Chrome (pilote CDP de tests/helpers-chrome-cdp.js) : sur ordinateur le contenu s'affiche normalement (titres de colonne, aucun bouton) ;
// sur mobile (≤ 767 px) chaque titre devient un bouton de 44 px minimum avec aria-expanded / aria-controls, qui ouvre et ferme son volet (souris et flèches) ; le focus est visible.
// Ignoré (avec la raison) si Chrome est absent.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const Chrome = require("./helpers-chrome-cdp");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");

const volet = (id, title, text) => ({ id, type: "container", name: title, props: {}, children: [{ id: `${id}t`, type: "text", props: { html: `<p>${text}</p>` } }] });
const content = { title: "Pied accordéon", sections: [{ id: "sect00000001", type: "layout", children: [{ id: "acc000000001", type: "container", props: { mode: "accordion", accStart: "none", accSingle: false, accMobile: true }, children: [
  volet("pan000000001", "Produits", "Contenu produits"), volet("pan000000002", "Aide", "Contenu aide"), volet("pan000000003", "Société", "Contenu société")] }] }] };

describe("accordéon mobile (vrai Chrome)", { skip: Chrome.SKIP }, () => {
  let srv, boss, chrome, url;
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    const origin = { Origin: srv.base };
    const created = await boss.post("/marketing/pages", { name: "Accordéon", kind: "page", template: "", ouvrir: "editeur" });
    const pid = Number(created.location.match(/pages\/(\d+)/)[1]), db = srv.db();
    const rev = db.prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(pid).revision;
    assert.equal((await boss.request(`/marketing/pages/${pid}/brouillon`, { method: "PUT", headers: origin, json: { revision: rev, content } })).status, 200);
    assert.equal((await boss.request(`/marketing/pages/${pid}/publier.json`, { method: "POST", json: {}, headers: origin })).status, 200);
    url = `${srv.base}/p/${db.prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(pid).slug}`;
    chrome = await Chrome.launch();
  });
  after(async () => { if (chrome) await chrome.close(); if (srv) await srv.stop(); });

  const rect = (pg, sel) => pg.evaluate((s) => { const r = document.querySelector(s).getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height }; }, sel);

  test("ordinateur (1280 px) : aucun bouton, tous les contenus visibles avec leur titre de colonne", async () => {
    const pg = await chrome.newPage({ width: 1280, height: 900 });
    await pg.goto(url);
    const r = await pg.evaluate(() => ({ heads: document.querySelectorAll(".kw-nacc-head").length, hidden: [...document.querySelectorAll(".kw-nacc-panel")].filter((p) => p.hidden || p.offsetParent === null).length,
      enhanced: document.querySelector("[data-kw-nacc]").classList.contains("is-enhanced"), title: getComputedStyle(document.querySelector(".kw-nacc-panel"), "::before").content, text: document.body.innerText }));
    assert.equal(r.heads, 0); assert.equal(r.hidden, 0); assert.equal(r.enhanced, false);
    assert.match(r.title, /Produits/); assert.match(r.text, /Contenu produits/); assert.match(r.text, /Contenu aide/); assert.match(r.text, /Contenu société/);
    assert.deepEqual(pg.errors, []);
    await pg.close();
  });
  test("mobile (390 px) : boutons de 44 px minimum, aria-expanded / aria-controls, volets repliés, ouverture à la souris, navigation aux flèches, focus visible", async () => {
    const pg = await chrome.newPage({ width: 390, height: 800 });
    await pg.goto(url);
    await pg.waitFor(() => document.querySelectorAll(".kw-nacc-head").length === 3, "boutons créés");
    const info = await pg.evaluate(() => [...document.querySelectorAll(".kw-nacc-head")].map((b) => ({ h: b.getBoundingClientRect().height, exp: b.getAttribute("aria-expanded"), ctl: b.getAttribute("aria-controls"), label: b.textContent, open: !document.getElementById(b.getAttribute("aria-controls")).hidden, region: document.getElementById(b.getAttribute("aria-controls")).getAttribute("role") })));
    assert.deepEqual(info.map((i) => i.label), ["Produits", "Aide", "Société"]);
    for (const i of info) { assert.ok(i.h >= 44, `hauteur ${i.h}`); assert.equal(i.exp, "false"); assert.equal(i.open, false); assert.equal(i.region, "region"); assert.ok(i.ctl); }
    assert.ok(!(await pg.evaluate(() => document.body.innerText)).includes("Contenu produits"), "volet replié = contenu masqué");
    const r = await rect(pg, ".kw-nacc-head");
    await pg.mouseClick(r.x, r.y);
    await pg.waitFor(() => document.querySelector(".kw-nacc-head").getAttribute("aria-expanded") === "true", "ouverture");
    assert.match(await pg.evaluate(() => document.body.innerText), /Contenu produits/);
    // flèche bas : le focus passe au bouton suivant ; focus visible (règle CSS :focus-visible présente)
    await pg.evaluate(() => document.querySelector(".kw-nacc-head").focus());
    await pg.key("ArrowDown");
    assert.equal(await pg.evaluate(() => document.activeElement.textContent), "Aide");
    assert.equal(await pg.evaluate(() => document.querySelector(".kw-nacc-head").getAttribute("aria-expanded")), "true");
    assert.ok(await pg.evaluate(() => [...document.styleSheets].some((s) => { try { return [...s.cssRules].some((r) => r.selectorText && r.selectorText.includes(".kw-nacc-head:focus-visible")); } catch { return false; } })), "règle de focus visible");
    // pas de débordement horizontal
    assert.ok(await pg.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1));
    assert.deepEqual(pg.errors, []);
    await pg.close();
  });
});
