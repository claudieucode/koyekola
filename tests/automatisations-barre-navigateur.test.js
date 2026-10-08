// Éditeur de scénarios — la barre verticale d'icônes (palette réduite) reste DANS sa zone, mesurée dans un VRAI Chrome (Playwright) :
// avant la correction, une palette réduite passait en « overflow: visible » et ses 24 icônes (plus hautes que la barre) coulaient sur
// « Contrôle avant activation », « Actions » et « Statistiques ». Les mesures (boîtes réelles, élément réellement présent sous chaque
// icône) portent sur : repli / dépli répétés, rechargement, hauteurs et largeurs de fenêtre, zoom du canevas, défilement de la page,
// défilement interne de la barre, infobulles, clic sur les icônes, petit écran (tiroir).
// Ignoré (avec la raison) si Playwright ou Chrome ne sont pas installés : `npm i --no-save playwright-core`, ou CHROME_PATH.
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

describe("barre verticale d'icônes des scénarios : toujours contenue dans sa zone (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, context, page, errors, autoId, n = 0;

  async function openEditor(viewport = { width: 1600, height: 900 }, collapsed = true) {
    n += 1;
    if (context) await context.close();
    context = await browser.newContext({ viewport });
    await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    page = await context.newPage();
    page.on("pageerror", (e) => errors.push(`pageerror : ${e.message}`));
    page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errors.push(`console : ${m.text().slice(0, 200)}`); });
    const r = await boss.post("/marketing/automatisations", { name: `Barre ${n}`, kind: "marketing", trigger_event: "lms.user_registered" });
    autoId = Number(String(r.location).match(/(\d+)$/)[1]);
    await page.addInitScript((c) => { try { if (!localStorage.getItem("kolakisa-flow-palette")) localStorage.setItem("kolakisa-flow-palette", JSON.stringify({ collapsed: c })); } catch { /* ignoré */ } }, collapsed);
    await page.goto(`${srv.base}/marketing/automatisations/${autoId}`);
    await page.waitForSelector("#au-palette .mk-pal-item", { state: "attached" }); // petit écran : le tiroir est caché par conception
    await wait(250);
  }
  const toggle = async () => { await page.locator(".mk-pal-collapse").click(); await wait(120); };
  const isCollapsed = () => page.evaluate(() => document.querySelector("#au-workspace").classList.contains("is-palette-collapsed"));
  const setState = async (collapsed) => { if ((await isCollapsed()) !== collapsed) await toggle(); };

  // Mesures de la page (coordonnées de la page, indépendantes du défilement)
  const geometry = () => page.evaluate(() => {
    const abs = (el) => { const b = el.getBoundingClientRect(); return { top: Math.round(b.top + scrollY), bottom: Math.round(b.bottom + scrollY), left: Math.round(b.left + scrollX), right: Math.round(b.right + scrollX), w: Math.round(b.width), h: Math.round(b.height) }; };
    const pal = document.querySelector("#au-palette"), body = pal.querySelector(".mk-pal-body"), shell = document.querySelector(".mk-flow-shell");
    const items = [...pal.querySelectorAll(".mk-pal-item")].filter((e) => !e.closest("li").hidden && e.offsetParent !== null);
    const panels = [...document.querySelectorAll("section.mk-panel")].map((s) => ({ title: (s.querySelector("h2") || {}).textContent, ...abs(s) }));
    const cs = getComputedStyle(body);
    return { collapsed: document.querySelector("#au-workspace").classList.contains("is-palette-collapsed"), pal: abs(pal), body: abs(body), shell: abs(shell), panels, order: items.map((e) => e.dataset.stepType || (e.hasAttribute("data-add-trigger") ? "trigger" : "?")), count: items.length,
      bodyOverflowY: cs.overflowY, palOverflow: getComputedStyle(pal).overflow, scrollable: body.scrollHeight > body.clientHeight + 1, itemW: items[0] ? Math.round(items[0].getBoundingClientRect().width) : 0, itemH: items[0] ? Math.round(items[0].getBoundingClientRect().height) : 0 };
  });

  // Règle d'or : aucune icône n'est visible hors de la barre. Pour chaque icône : si elle est dans la barre, c'est bien ELLE qui est
  // sous son centre ; sinon (poussée plus bas par le défilement interne), AUCUNE des icônes n'est visible ailleurs, et surtout pas sur une carte.
  async function assertContained(label) {
    const g = await geometry();
    const r = await page.evaluate(() => {
      const pal = document.querySelector("#au-palette"), pr = pal.getBoundingClientRect(), items = [...pal.querySelectorAll(".mk-pal-item")].filter((e) => !e.closest("li").hidden && e.offsetParent !== null);
      const panelHit = [], leaks = [];
      for (const it of items) {
        const b = it.getBoundingClientRect();
        const cx = b.left + b.width / 2, cy = b.top + b.height / 2;
        if (cx < 0 || cy < 0 || cx > innerWidth || cy > innerHeight) continue; // hors de la fenêtre : rien à voir
        const top = document.elementFromPoint(cx, cy);
        const inside = cy >= pr.top && cy <= pr.bottom && cx >= pr.left && cx <= pr.right;
        if (top && (top === it || it.contains(top))) { if (!inside) leaks.push(it.dataset.stepType); }
        if (top && top.closest && top.closest("section.mk-panel") && it.getBoundingClientRect().height > 0 && (top === it || it.contains(top))) panelHit.push(it.dataset.stepType);
      }
      return { leaks, panelHit };
    });
    assert.deepEqual(r.leaks, [], `${label} : aucune icône visible hors de la barre`);
    assert.deepEqual(r.panelHit, [], `${label} : aucune icône par-dessus une carte`);
    // la barre elle-même ne déborde pas de son conteneur et ne touche pas les cartes du dessous
    assert.ok(g.pal.bottom <= g.panels[0].top, `${label} : la barre (bas ${g.pal.bottom}) finit avant « ${g.panels[0].title} » (haut ${g.panels[0].top})`);
    assert.equal(g.bodyOverflowY === "auto" || g.bodyOverflowY === "scroll", true, `${label} : la liste d'icônes défile dans la barre (overflow-y ${g.bodyOverflowY})`);
    assert.notEqual(g.palOverflow, "visible", `${label} : la barre ne laisse pas déborder son contenu`);
    assert.equal(g.count, 24, `${label} : toutes les icônes sont là`);
    return g;
  }

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
    errors = [];
  });
  after(async () => { if (browser) await browser.close(); if (srv) await srv.stop(); });

  test("A-B : replié, les 24 icônes restent dans la barre (fenêtre 1600 × 900) ; développé, rien n'a changé", async () => {
    await openEditor();
    const c = await assertContained("replié");
    assert.equal(c.collapsed, true);
    assert.equal(c.pal.w, 60, "barre repliée : 60 px de large"); assert.equal(c.itemW, 44, "icônes de 44 px");
    assert.ok(c.scrollable, "la liste est plus haute que la barre : défilement INTERNE");
    await toggle();
    const e = await assertContained("développé");
    assert.equal(e.pal.w, 252, "barre développée : 252 px"); assert.equal(e.pal.h, c.pal.h, "même hauteur développée ou repliée");
    assert.equal(e.pal.top, c.pal.top, "même position verticale"); assert.deepEqual(e.order, c.order, "même ordre d'icônes");
  });

  test("C : replier / déplier 12 fois — la hauteur, la position et les cartes du dessous ne bougent jamais ; aucune icône ne sort", async () => {
    await openEditor({ width: 1600, height: 900 }, false);
    const ref = { expanded: await assertContained("référence développée") };
    await toggle(); ref.collapsed = await assertContained("référence repliée");
    for (let i = 0; i < 12; i++) {
      const wantCollapsed = i % 2 === 1;
      await setState(wantCollapsed);
      const g = await assertContained(`cycle ${i + 1} (${wantCollapsed ? "replié" : "développé"})`);
      const same = wantCollapsed ? ref.collapsed : ref.expanded;
      assert.deepEqual({ top: g.pal.top, h: g.pal.h, w: g.pal.w }, { top: same.pal.top, h: same.pal.h, w: same.pal.w }, `cycle ${i + 1} : mêmes dimensions`);
      assert.deepEqual(g.panels.map((p) => p.top), ref.expanded.panels.map((p) => p.top), `cycle ${i + 1} : les cartes du dessous ne bougent pas`);
      assert.deepEqual(g.order, ref.expanded.order, `cycle ${i + 1} : même ordre`);
    }
  });

  test("D : rechargement — replié puis rechargé = replié identique ; développé puis rechargé = développé identique", async () => {
    await openEditor({ width: 1600, height: 900 }, false);
    await setState(true); const before1 = await assertContained("replié avant rechargement");
    await page.reload(); await page.waitForSelector("#au-palette .mk-pal-item", { state: "attached" }); await wait(250);
    const after1 = await assertContained("replié après rechargement");
    assert.equal(after1.collapsed, true); assert.deepEqual({ w: after1.pal.w, h: after1.pal.h, dy: after1.pal.top - after1.shell.top }, { w: before1.pal.w, h: before1.pal.h, dy: before1.pal.top - before1.shell.top }); // (le bandeau « Scénario créé » décale la page entière au premier affichage : on compare à l'espace de travail)
    await setState(false); const before2 = await assertContained("développé avant rechargement");
    await page.reload(); await page.waitForSelector("#au-palette .mk-pal-item", { state: "attached" }); await wait(250);
    const after2 = await assertContained("développé après rechargement");
    assert.equal(after2.collapsed, false); assert.deepEqual({ w: after2.pal.w, h: after2.pal.h, dy: after2.pal.top - after2.shell.top }, { w: before2.pal.w, h: before2.pal.h, dy: before2.pal.top - before2.shell.top });
  });

  test("E-G : zoom 80 % / 100 % / 120 % du canevas — la barre, ses icônes et les cartes ne bougent pas", async () => {
    await openEditor();
    const ref = await assertContained("avant zoom");
    const level = () => page.locator("#au-zoom-level").innerText();
    for (const [target, button] of [["80", "#au-zoom-out"], ["100", "#au-zoom-100"], ["120", "#au-zoom-in"]]) {
      for (let i = 0; i < 6 && !(await level()).startsWith(target); i++) { await page.locator(button).click(); await wait(80); }
      const g = await assertContained(`zoom ${await level()}`);
      assert.deepEqual({ pal: g.pal, itemW: g.itemW, itemH: g.itemH }, { pal: ref.pal, itemW: ref.itemW, itemH: ref.itemH }, "barre et icônes inchangées par le zoom");
      assert.deepEqual(g.panels, ref.panels, "cartes du dessous inchangées");
    }
  });

  test("H : défilement de la page — la barre reste liée à son espace de travail, jamais devant les cartes", async () => {
    await openEditor();
    const ref = await geometry();
    for (const y of [0, 300, 700, 1100, 1500, 2500]) {
      await page.evaluate((v) => window.scrollTo(0, v), y); await wait(60);
      await assertContained(`page défilée à ${y}`);
      const g = await geometry();
      assert.deepEqual({ top: g.pal.top, bottom: g.pal.bottom }, { top: ref.pal.top, bottom: ref.pal.bottom }, `page défilée à ${y} : la barre ne se déplace pas dans la page`);
    }
  });

  test("défilement interne : la barre défile, la dernière icône est atteignable et cliquable sans sortir de la barre", async () => {
    await openEditor();
    const g0 = await geometry();
    await page.evaluate(() => window.scrollTo(0, 250));
    await page.evaluate(() => { const b = document.querySelector("#au-palette .mk-pal-body"); b.scrollTop = b.scrollHeight; });
    await wait(80);
    const last = page.locator("#au-palette .mk-pal-item").last();
    const box = await last.boundingBox();
    const pal = await page.locator("#au-palette").boundingBox();
    assert.ok(box.y >= pal.y - 1 && box.y + box.height <= pal.y + pal.height + 1, "la dernière icône est entièrement dans la barre une fois défilée");
    const before = await page.locator(".drawflow-node").count();
    await last.click();
    await wait(300);
    assert.ok((await page.locator(".drawflow-node").count()) >= before, "cliquer la dernière icône ne casse rien");
    const g1 = await assertContained("après défilement interne");
    assert.deepEqual({ top: g1.pal.top, h: g1.pal.h }, { top: g0.pal.top, h: g0.pal.h });
  });

  test("I : hauteurs de fenêtre 1080 / 900 / 800 / 600 — jamais d'icône sur les cartes ; la barre garde sa hauteur minimale", async () => {
    for (const height of [1080, 900, 800, 600]) {
      await openEditor({ width: 1600, height }, true);
      const g = await assertContained(`hauteur ${height} replié`);
      assert.ok(g.pal.h >= 520, `hauteur ${height} : barre d'au moins 520 px (${g.pal.h})`);
      await toggle(); await assertContained(`hauteur ${height} développé`);
    }
  });

  test("J : largeurs de fenêtre 1920 / 1440 / 1280 / 1024 — stable replié et développé", async () => {
    for (const width of [1920, 1440, 1280, 1024]) {
      await openEditor({ width, height: 900 }, true);
      const c = await assertContained(`largeur ${width} replié`);
      assert.equal(c.pal.w, 60, `largeur ${width} : barre repliée de 60 px`);
      await toggle(); const e = await assertContained(`largeur ${width} développé`);
      assert.equal(e.pal.w, 252, `largeur ${width} : barre développée de 252 px`);
    }
  });

  test("infobulles de la barre repliée : posées à droite de l'icône (position fixe, non coupées par le défilement), au survol et au clavier", async () => {
    await openEditor();
    const probe = (sel) => page.evaluate((s) => { const el = document.querySelector(s), b = el.getBoundingClientRect(), a = getComputedStyle(el, "::after"); return { content: a.content, position: a.position, left: parseFloat(a.left), top: parseFloat(a.top), right: b.right, mid: b.top + b.height / 2 }; }, sel);
    const wait2 = (sel) => page.locator(sel).first();
    const sel = '#au-palette .mk-pal-item[data-step-type="wait"]';
    await page.locator(sel).hover(); await wait(120);
    let t = await probe(sel);
    assert.match(t.content, /\S/, "infobulle affichée"); assert.equal(t.position, "fixed", "position fixe : jamais coupée par la zone de défilement");
    assert.ok(Math.abs(t.left - (t.right + 10)) <= 1, `à 10 px à droite de l'icône (${t.left} ≈ ${t.right + 10})`); assert.ok(Math.abs(t.top - t.mid) <= 1, "centrée verticalement sur l'icône");
    await page.mouse.move(900, 600); await wait(100);
    await page.locator(sel).focus(); await page.keyboard.press("Tab"); await page.keyboard.press("Shift+Tab"); await wait(120);
    t = await probe(sel); assert.match(t.content, /\S/, "infobulle aussi au clavier");
    // infobulle du bouton « Développer »
    await page.locator(".mk-pal-collapse").hover(); await wait(120);
    const c = await probe(".mk-pal-collapse"); assert.equal(c.position, "fixed"); assert.ok(Math.abs(c.left - (c.right + 10)) <= 1);
    // après un défilement interne, l'infobulle suit l'icône survolée
    await page.locator(sel).hover();
    await page.evaluate(() => { document.querySelector("#au-palette .mk-pal-body").scrollTop = 60; }); await wait(150);
    const moved = await probe(sel);
    assert.ok(Math.abs(moved.top - moved.mid) <= 1, "l'infobulle reste alignée sur l'icône après défilement");
  });

  test("clic sur une icône de la barre repliée : l'étape est ajoutée au canevas ; groupes et séparateurs conservés", async () => {
    await openEditor();
    const before = await page.locator(".drawflow-node").count();
    await page.locator('#au-palette .mk-pal-item[data-step-type="wait"]').click();
    await page.waitForFunction((b) => document.querySelectorAll(".drawflow-node").length > b, before, { timeout: 5000 });
    const seps = await page.evaluate(() => [...document.querySelectorAll("#au-palette .mk-pal-group")].filter((g, i) => i > 0 && getComputedStyle(g).borderTopWidth !== "0px").length);
    assert.ok(seps >= 3, `séparateurs entre les groupes (${seps})`);
    await assertContained("après ajout d'une étape");
  });

  test("petit écran (700 px) : la palette est un tiroir ; fermée, aucune icône n'est visible ni sur les cartes ; ouverte, elle est dans le tiroir", async () => {
    await openEditor({ width: 700, height: 900 }, true);
    const closed = await page.evaluate(() => { const pal = document.querySelector("#au-palette"); const cs = getComputedStyle(pal); return { visibility: cs.visibility, position: cs.position, visibleItems: [...pal.querySelectorAll(".mk-pal-item")].filter((e) => { const r = e.getBoundingClientRect(); const t = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return t && (t === e || e.contains(t)); }).length }; });
    assert.equal(closed.visibility, "hidden"); assert.equal(closed.position, "fixed"); assert.equal(closed.visibleItems, 0, "tiroir fermé : aucune icône visible");
    await page.locator("#au-palette-open").click(); await wait(400);
    const open = await page.evaluate(() => { const pal = document.querySelector("#au-palette"), r = pal.getBoundingClientRect(); const items = [...pal.querySelectorAll(".mk-pal-item")].filter((e) => e.offsetParent); const hit = items.filter((e) => { const b = e.getBoundingClientRect(); if (b.bottom > innerHeight || b.top < 0) return false; const t = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2); return t && (t === e || e.contains(t)); }); return { left: r.left, w: r.width, h: r.height, hit: hit.length, inDrawer: hit.every((e) => { const b = e.getBoundingClientRect(); return b.left >= r.left - 1 && b.right <= r.right + 1; }) }; });
    assert.ok(open.left >= -1 && open.w > 200, "tiroir ouvert, à gauche"); assert.ok(open.hit > 5 && open.inDrawer, "icônes visibles dans le tiroir");
    await page.keyboard.press("Escape"); await wait(400);
  });

  test("aucune erreur de script ni de console pendant tous ces parcours", () => { assert.deepEqual(errors, []); });
});
