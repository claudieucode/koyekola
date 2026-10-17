// Manipulation visuelle dans l'éditeur RÉEL (Chrome, vraies souris) : sélection sans effets de visiteur, redimensionnement par poignées
// (propriété et unité justes, appareil affiché seulement, bornes min / max, une étape d'annulation), glisser-déposer dans la structure
// (identifiants et styles gardés, cycles refusés), duplication d'un arbre imbriqué (identités neuves, références gardées), suppression,
// annuler / rétablir, rechargement.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : édition visuelle non exécutée sur cette machine" : false;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
async function until(check, { timeout = 12000, what = "condition" } = {}) { const end = Date.now() + timeout; for (;;) { let v = null; try { v = await check(); } catch { v = null; } if (v) return v; if (Date.now() > end) throw new Error(`Délai dépassé : ${what}`); await wait(80); } }

const content = () => ({ title: "Édition", sections: [{ id: "sect00000001", type: "layout", children: [
  { id: "box000000001", type: "container", props: {}, styles: { desktop: { display: "flex", flexDirection: "column", gap: "10px" } }, children: [
    { id: "pct000000001", type: "container", classes: "carte", props: {}, styles: { desktop: { width: "50%", minHeight: "60px", backgroundColor: "#dddddd", color: "token:primary" }, tablet: { width: "80%" } }, children: [{ id: "tx0000000001", type: "text", props: { html: '<p>pourcent <a href="https://example.com/dans-le-texte">lien</a></p>' } }] },
    { id: "cap000000001", type: "container", props: {}, styles: { desktop: { maxWidth: "300px", minHeight: "60px", backgroundColor: "#ccccff" } }, children: [{ id: "tx0000000002", type: "text", props: { html: "<p>plafonné</p>" } }] },
    { id: "aut000000001", type: "container", props: {}, styles: { desktop: { minHeight: "60px", backgroundColor: "#ffdddd" } }, children: [{ id: "tx0000000003", type: "text", props: { html: "<p>auto</p>" } }] },
    { id: "pix000000001", type: "container", props: {}, styles: { desktop: { width: "400px", minHeight: "60px", backgroundColor: "#ddffdd" } }, children: [{ id: "tx0000000004", type: "text", props: { html: "<p>pixels</p>" } }] },
    { id: "lnk000000001", type: "button", props: { label: "Lien externe", url: "https://example.com/dehors", newTab: true, variant: "primary" } },
  ] } ] }] });

describe("édition visuelle dans l'éditeur réel (Chrome)", { skip: SKIP }, () => {
  let srv, boss, browser, ctx, page, fl, id, errors = [];
  const row = () => srv.db().prepare("SELECT * FROM mk_landing_pages WHERE id = ?").get(id);
  const sections = () => JSON.parse(row().draft || row().sections).sections;
  const findIn = (nid, list) => { for (const x of list || []) { if (x.id === nid) return x; const g = findIn(nid, x.children); if (g) return g; } return null; };
  const node = (nid) => findIn(nid, sections());
  const ids = () => { const o = []; const w = (l) => (l || []).forEach((x) => { o.push(x.id); w(x.children); }); w(sections()); return o; };
  const tree = (list = sections()) => (list || []).map((x) => x.id + (x.children && x.children.length ? `[${tree(x.children)}]` : "")).join(",");
  const open = async () => {
    await page.goto(`${srv.base}/marketing/pages/${id}/editeur`);
    await page.waitForFunction(() => { const f = document.querySelector("[data-pb-frame]"); return f && f.contentDocument && f.contentDocument.body && f.contentDocument.body.classList.contains("lp-builder"); }, null, { timeout: 30000 });
    await wait(1000);
  };
  const reset = async () => {
    const r = await boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", headers: { Origin: srv.base }, json: { revision: row().revision, content: content() } });
    assert.equal(r.status, 200, r.text); await open();
  };
  const device = async (d) => { await page.locator(`[role="radio"][data-device="${d}"]`).first().click(); await wait(900); };
  const pick = async (nid) => { await page.locator(`[data-pb-layers] .pb-node[data-id="${nid}"] > .pb-row-item`).click(); await wait(300); };
  const rowOf = (nid) => page.locator(`[data-pb-layers] .pb-node[data-id="${nid}"] > .pb-row-item`);
  const selected = () => page.evaluate(() => [...document.querySelectorAll("[data-pb-layers] .pb-node")].filter((n) => n.querySelector(":scope > .pb-row-item.is-selected, :scope > .pb-row-item[aria-selected=true]")).map((n) => n.dataset.id).join(","));
  const width = (nid) => page.evaluate((nid) => Math.round(document.querySelector("[data-pb-frame]").contentDocument.querySelector(`[data-node-id="${nid}"]`).getBoundingClientRect().width), nid);
  const drag = async (cls, dx, dy) => {
    const b = await fl.locator(cls).boundingBox(); const x = b.x + b.width / 2, y = b.y + b.height / 2;
    await page.keyboard.down("Alt"); // Alt = pas d'accrochage magnétique : la taille suit exactement la souris
    await page.mouse.move(x, y); await page.mouse.down(); for (let i = 1; i <= 10; i++) await page.mouse.move(x + (dx * i) / 10, y + (dy * i) / 10); await page.mouse.up(); await page.keyboard.up("Alt"); await wait(1600);
  };
  const history = () => page.evaluate(() => { const u = document.querySelector("[data-pb-undo]"); return u ? !u.disabled : null; });

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    id = Number((await boss.post("/marketing/pages", { name: "Édition visuelle", template: "", ouvrir: "editeur" })).location.match(/pages\/(\d+)/)[1]);
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
    ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
    await ctx.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    page = await ctx.newPage(); page.on("pageerror", (e) => errors.push(e.message));
    fl = page.frameLocator("[data-pb-frame]");
    await reset();
  });
  after(async () => { if (browser) await browser.close(); if (srv) await srv.stop(); });

  test("clic sur un bouton externe, un lien dans un texte, un conteneur : sélection seulement — aucune navigation, aucun nouvel onglet", async () => {
    const url0 = page.url(), tabs0 = ctx.pages().length;
    for (const [nid, sel] of [["lnk000000001", '[data-node-id="lnk000000001"]'], ["tx0000000001", '[data-node-id="tx0000000001"] a'], ["cap000000001", '[data-node-id="cap000000001"]']]) {
      await fl.locator(sel).first().click({ position: { x: 4, y: 4 }, force: true }); await wait(500);
      assert.equal(page.url(), url0, `${nid} : l'éditeur a navigué`);
      assert.equal(ctx.pages().length, tabs0, `${nid} : un onglet s'est ouvert`);
    }
    await fl.locator('[data-node-id="lnk000000001"]').first().click(); await wait(400);
    assert.equal(await selected(), "lnk000000001", "le bouton est sélectionné, pas son parent");
    assert.deepEqual(errors, []);
  });

  test("redimensionner : un élément en % reste en % (valeur proportionnelle), en px reste en px, sans valeur (auto) reçoit des px ; une seule étape d'annulation", async () => {
    await reset();
    // % : 50 % de la largeur de la colonne → on tire de +120 px
    const w0 = await width("pct000000001"); await pick("pct000000001");
    await drag(".pb-handle-e", 120, 0);
    const pct = node("pct000000001").styles.desktop.width;
    assert.match(pct, /^[\d.]+%$/, `unité perdue : ${pct}`);
    const w1 = await width("pct000000001");
    assert.ok(w1 > w0 + 80, `l'élément a grandi (${w0} → ${w1} px)`); // le canevas peut être zoomé : la souris n'est pas en pixels de page
    assert.ok(Math.abs(parseFloat(pct) - (50 * w1) / w0) < 1.5, `${pct} n'est pas proportionnel à la largeur affichée (${w0} → ${w1} px)`);
    assert.equal(node("pct000000001").styles.tablet.width, "80%", "la tablette n'a pas bougé");
    // px
    await pick("pix000000001"); await drag(".pb-handle-e", -80, 0);
    assert.match(node("pix000000001").styles.desktop.width, /^3\d\dpx$/);
    // auto : hauteur seulement, la largeur n'est pas figée
    await pick("aut000000001"); await drag(".pb-handle-s", 0, 40);
    const aut = node("aut000000001").styles.desktop;
    assert.match(aut.height, /^\d+px$/); assert.equal(aut.width, undefined, "la largeur automatique n'a pas été figée");
    // annuler : UNE étape pour le geste
    await page.keyboard.press("Control+z"); await wait(1500);
    assert.equal(node("aut000000001").styles.desktop.height, undefined, "annuler retire toute la hauteur d'un seul coup");
    assert.match(node("pix000000001").styles.desktop.width, /^3\d\dpx$/, "l'étape précédente est intacte");
    assert.deepEqual(errors, []);
  });

  test("redimensionner au-delà d'une largeur max. : la valeur inatteignable n'est pas enregistrée, l'utilisateur est prévenu", async () => {
    await reset();
    const before = JSON.stringify(node("cap000000001").styles);
    await pick("cap000000001"); await drag(".pb-handle-e", 200, 0);
    assert.equal(JSON.stringify(node("cap000000001").styles), before, "aucune largeur morte enregistrée");
    assert.equal(await width("cap000000001"), 300);
    assert.match(await page.locator("[data-pb-toast]").innerText(), /pas atteignable|limite/i);
  });

  test("redimensionner sur la tablette : seule la zone tablette est modifiée ; ordinateur et mobile intacts ; persiste après rechargement", async () => {
    await reset(); await device("tablet");
    await pick("pix000000001"); const desktopBefore = JSON.stringify(node("pix000000001").styles.desktop);
    await drag(".pb-handle-e", -60, 0);
    const t = node("pix000000001").styles.tablet;
    assert.ok(t && /^\d+px$/.test(t.width), "valeur tablette écrite");
    assert.equal(JSON.stringify(node("pix000000001").styles.desktop), desktopBefore, "ordinateur intact");
    assert.equal(node("pix000000001").styles.mobile, undefined, "mobile intact");
    await open(); await device("tablet");
    assert.ok(Math.abs((await width("pix000000001")) - parseInt(t.width, 10)) <= 2, "valeur relue après rechargement");
  });

  test("glisser-déposer dans la structure : déplacement valide (identifiants, contenu, styles gardés, aucun nœud perdu), cycle refusé, annuler / rétablir, rechargement", async () => {
    await reset();
    const n0 = ids().length, start = tree();
    await rowOf("box000000001").dragTo(rowOf("pct000000001")); await wait(1200);
    assert.equal(tree(), start, "un conteneur ne peut pas devenir son propre descendant");
    assert.equal(ids().length, n0);
    const before = JSON.stringify(node("tx0000000001"));
    await rowOf("tx0000000001").dragTo(rowOf("cap000000001")); await wait(1600);
    assert.match(tree(), /cap000000001\[tx0000000002,tx0000000001\]/, "le texte est dans son nouveau parent");
    assert.equal(ids().length, n0, "aucun nœud perdu ni créé");
    assert.equal(JSON.stringify(node("tx0000000001")), before, "contenu et identité intacts");
    await page.keyboard.press("Control+z"); await wait(1500);
    assert.equal(tree(), start, "annuler restaure l'arbre exact");
    await page.keyboard.press("Control+Shift+z"); await wait(1500);
    assert.match(tree(), /cap000000001\[tx0000000002,tx0000000001\]/);
    await open();
    assert.match(tree(), /cap000000001\[tx0000000002,tx0000000001\]/, "persiste après rechargement");
    assert.deepEqual(errors, []);
  });

  test("dupliquer un conteneur imbriqué : identités neuves et uniques, classes / couleurs du site / écrans conservés, sélection sur la copie ; annuler / rétablir ; supprimer la copie", async () => {
    await reset(); await pick("pct000000001");
    await page.keyboard.press("Control+d");
    const copy = await until(() => { const kids = node("box000000001").children; const c = kids.find((k) => k.id !== "pct000000001" && k.classes === "carte"); return c || null; }, { what: "copie enregistrée" });
    assert.equal(new Set(ids()).size, ids().length, "identifiants tous uniques");
    assert.notEqual(copy.id, "pct000000001"); assert.notEqual(copy.children[0].id, "tx0000000001", "l'enfant a une identité neuve");
    assert.equal(copy.styles.desktop.color, "token:primary", "la couleur du site reste une référence");
    assert.equal(copy.styles.tablet.width, "80%", "la valeur tablette est copiée");
    assert.equal(copy.classes, "carte");
    assert.equal(await selected(), copy.id, "la copie est sélectionnée");
    await page.keyboard.press("Control+z"); await wait(1500);
    assert.equal(node(copy.id), null, "annuler retire la copie ET ses enfants");
    await page.keyboard.press("Control+Shift+z"); await wait(1500);
    assert.ok(node(copy.id), "rétablir la remet");
    await page.keyboard.press("Delete"); await wait(1500);
    assert.equal(node(copy.id), null, "supprimée");
    assert.ok(node("pct000000001"), "l'original est intact");
    assert.ok(!(await selected()).includes(copy.id), "plus de sélection sur un élément supprimé");
    assert.deepEqual(errors, []);
  });
});
