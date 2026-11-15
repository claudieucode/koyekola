// Éditeur de pages — gestionnaire de panneaux (Chrome réel) : masquer / afficher, détacher, déplacer, redimensionner, ancrer, barre d'icônes,
// repli de la Structure et des propriétés, espaces de travail (enregistrer, renommer, dupliquer, supprimer, restaurer), persistance après
// rechargement, raccourcis, écran étroit, et surtout : le DOCUMENT n'est jamais modifié et la sélection reste liée aux propriétés.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");
const { launch, SKIP, wait } = require("./helpers-chrome-cdp");

describe("panneaux de l'éditeur de pages (navigateur)", { skip: SKIP }, () => {
  let srv, boss, chrome, pageId, cookies;
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    pageId = Number((await boss.post("/marketing/pages", { name: "Panneaux" })).location.match(/(\d+)$/)[1]);
    chrome = await launch();
    cookies = [...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base }));
  });
  after(async () => { if (chrome) await chrome.close(); await srv.stop(); });
  const open = async (width = 1500, height = 900) => {
    const page = await chrome.newPage({ width, height, cookies });
    await page.goto(`${srv.base}/marketing/pages/${pageId}/editeur`);
    await page.waitFor(() => window.pbPanels && document.querySelector(".pbp-bar") && document.querySelector("[data-pb-layers] .pb-node"), "éditeur prêt");
    await wait(300);
    return page;
  };
  const state = (page) => page.evaluate(() => ({ ...window.pbPanels.state(), cols: getComputedStyle(document.querySelector("[data-pb-main]")).gridTemplateColumns.split(" ").map(parseFloat), undo: document.querySelector("[data-pb-undo]").disabled }));
  const rect = (page, sel) => page.evaluate((s) => { const r = document.querySelector(s).getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; }, sel);
  const canvasW = (page) => page.evaluate(() => document.querySelector("[data-pb-canvas]").getBoundingClientRect().width);

  test("1-6. masquer et afficher chaque panneau, les deux, restaurer ; le canevas récupère la place", async () => {
    const page = await open();
    try {
      const w0 = await canvasW(page);
      await page.evaluate(() => window.pbPanels.toggle("left")); await wait(100);
      assert.equal((await state(page)).left, "hidden"); const w1 = await canvasW(page); assert.ok(w1 > w0 + 200, "canevas élargi");
      await page.evaluate(() => window.pbPanels.toggle("left")); assert.equal((await state(page)).left, "docked");
      await page.evaluate(() => window.pbPanels.toggle("right")); assert.equal((await state(page)).right, "hidden");
      await page.evaluate(() => window.pbPanels.toggle("right"));
      await page.evaluate(() => window.pbPanels.toggleBoth()); let s = await state(page);
      assert.deepEqual([s.left, s.right], ["hidden", "hidden"]); assert.ok(await canvasW(page) > w0 + 500);
      await page.evaluate(() => window.pbPanels.toggleBoth()); s = await state(page);
      assert.deepEqual([s.left, s.right], ["docked", "docked"]);
      assert.ok(Math.abs((await canvasW(page)) - w0) < 2, "largeur d'origine retrouvée");
      assert.equal(s.undo, true, "le document n'a pas bougé (rien à annuler)");
    } finally { await page.close(); }
  });

  test("7-10. détacher en glissant l'en-tête, déplacer sans toucher à la page, redimensionner, ancrer au bord", async () => {
    const page = await open();
    try {
      const w0 = await canvasW(page);
      const b = await rect(page, ".pb-left .pbp-bar");
      await page.mouseDrag(b.x + 70, b.y + 15, b.x + 470, b.y + 140);
      await wait(250);
      let s = await state(page); assert.equal(s.left, "floating");
      const f = await rect(page, ".pb-left");
      assert.ok(Math.abs(f.x - (b.x + 400)) < 6 && f.y > b.y + 60, "il suit le pointeur : " + JSON.stringify(f));
      assert.ok((await canvasW(page)) > w0, "le canevas récupère la place libérée");
      // redimensionner par le coin
      const br = await rect(page, ".pb-left");
      await page.mouseDrag(br.x + br.w - 6, br.y + br.h - 6, br.x + br.w + 94, br.y + br.h - 66);
      await wait(150);
      const r2 = await rect(page, ".pb-left"); assert.ok(r2.w >= br.w + 80, "plus large"); assert.ok(r2.h <= br.h - 50, "moins haut");
      // limites : jamais en dessous du minimum
      await page.mouseDrag(r2.x + r2.w - 6, r2.y + r2.h - 6, r2.x + 20, r2.y + 20);
      const r3 = await rect(page, ".pb-left"); assert.ok(r3.w >= 240 && r3.h >= 180, "dimensions minimales respectées : " + JSON.stringify(r3));
      // hors écran : ramené dans la zone de travail
      const h = await rect(page, ".pb-left .pbp-bar");
      await page.mouseDrag(h.x + 60, h.y + 15, -400, -400);
      const r4 = await rect(page, ".pb-left"); assert.ok(r4.x >= 0 && r4.y >= 100, "reste dans la zone : " + JSON.stringify(r4));
      // ancrer : déposé sur la zone d'ancrage au bord gauche
      const h2 = await rect(page, ".pb-left .pbp-bar");
      await page.mouseDrag(h2.x + 60, h2.y + 15, 70, h2.y + 15);
      await wait(200); s = await state(page); assert.equal(s.left, "docked");
      assert.equal(s.undo, true, "aucun changement du document");
      assert.ok(Math.abs((await canvasW(page)) - w0) < 2);
    } finally { await page.close(); }
  });

  test("un panneau lâché loin du bord reste flottant (aucun ancrage involontaire), clavier : flèches", async () => {
    const page = await open();
    try {
      await page.evaluate(() => window.pbPanels.setMode("right", "floating")); await wait(150);
      const b = await rect(page, ".pb-right .pbp-bar");
      await page.mouseDrag(b.x + 20, b.y + 15, b.x - 300, b.y + 60); await wait(150);
      assert.equal((await state(page)).right, "floating");
      const x0 = (await rect(page, ".pb-right")).x;
      await page.evaluate(() => document.querySelector(".pb-right .pbp-bar").focus());
      await page.key("ArrowRight"); await wait(80);
      assert.equal(Math.round((await rect(page, ".pb-right")).x - x0), 16);
      await page.evaluate(() => window.pbPanels.setMode("right", "docked")); assert.equal((await state(page)).right, "docked");
    } finally { await page.close(); }
  });

  test("barre d'icônes : le panneau se réduit, un clic ouvre un panneau temporaire, Échap le referme", async () => {
    const page = await open();
    try {
      await page.evaluate(() => window.pbPanels.setMode("left", "icons")); await wait(200);
      let s = await state(page); assert.equal(s.left, "icons"); assert.equal(Math.round(s.cols[1]), 44);
      assert.ok(await page.evaluate(() => getComputedStyle(document.querySelector(".pb-left")).display === "none"));
      await page.evaluate(() => document.querySelector('.pbp-strip[data-side="left"] [data-key="pb-tab-blocks"]').click()); await wait(200);
      assert.ok(await page.evaluate(() => document.querySelector(".pb-left").classList.contains("pbp-peek") && document.querySelector("#pb-pane-blocks").hidden === false), "panneau Blocs ouvert");
      await page.key("Escape"); await wait(100);
      assert.ok(await page.evaluate(() => !document.querySelector(".pb-left").classList.contains("pbp-peek")));
      await page.evaluate(() => window.pbPanels.setMode("left", "docked"));
    } finally { await page.close(); }
  });

  test("13-14. propriétés repliées / Structure repliée, répartition verticale ; la sélection reste liée aux propriétés", async () => {
    const page = await open();
    try {
      await page.evaluate(() => document.querySelector("[data-pb-layers] .pb-node .pb-row-item").click()); await wait(200);
      const label = () => page.evaluate(() => document.querySelector("[data-pb-inspector]").textContent.slice(0, 80));
      const before = await label(); assert.ok(!/Aucun élément sélectionné/.test(before), "propriétés affichées : " + before);
      await page.evaluate(() => document.querySelector('.pb-right [data-pbp="props"]').click()); await wait(100);
      assert.ok(await page.evaluate(() => document.querySelector(".pb-right").classList.contains("pbp-insp-collapsed") && getComputedStyle(document.querySelector("[data-pb-inspector]")).display === "none"));
      const hTree = await page.evaluate(() => document.querySelector("[data-pb-layers]").getBoundingClientRect().height); assert.ok(hTree > 250, "la Structure prend la place");
      await page.evaluate(() => document.querySelector('.pb-right [data-pbp="props"]').click()); await wait(100);
      assert.equal(await label(), before, "sélection et propriétés conservées");
      // Structure repliée : les propriétés gardent tout l'espace
      await page.evaluate(() => document.querySelector('.pb-right [data-pbp="struct"]').click()); await wait(100);
      assert.ok(await page.evaluate(() => document.querySelector(".pb-right").classList.contains("is-layers-collapsed")));
      await page.evaluate(() => document.querySelector('.pb-right [data-pbp="struct"]').click());
      // séparateur : plus de hauteur à la Structure
      const sp = await rect(page, "[data-pb-split]"), t0 = await page.evaluate(() => document.querySelector("[data-pb-layers]").getBoundingClientRect().height);
      await page.mouseDrag(sp.x + 100, sp.y + 3, sp.x + 100, sp.y + 103); await wait(100);
      const t1 = await page.evaluate(() => document.querySelector("[data-pb-layers]").getBoundingClientRect().height); assert.ok(t1 > t0 + 60, "Structure plus haute");
      assert.equal((await state(page)).undo, true, "document intact");
    } finally { await page.close(); }
  });

  test("15-17. espaces de travail : fournis, enregistrer, renommer, dupliquer, supprimer, restaurer, persistance après rechargement", async () => {
    const page = await open();
    try {
      assert.deepEqual(await page.evaluate(() => window.pbPanels.workspaces().map((w) => w.name)), ["Standard", "Conception", "Structure"]);
      await page.evaluate(() => window.pbPanels.applyWorkspace("conception")); await wait(150);
      let s = await state(page); assert.deepEqual([s.left, s.right, s.active], ["hidden", "hidden", "conception"]);
      await page.evaluate(() => window.pbPanels.applyWorkspace("structure")); await wait(150);
      s = await state(page); assert.deepEqual([s.left, s.right], ["icons", "docked"]);
      // enregistrer la disposition actuelle par le menu
      await page.evaluate(() => document.querySelector('.pb-right [data-pbp="ws"]').click()); await wait(100);
      await page.evaluate(() => { const i = document.querySelector(".pbp-new input"); i.value = "Ma vue"; i.form.requestSubmit(); }); await wait(150);
      assert.ok(await page.evaluate(() => [...document.querySelectorAll(".pbp-row-t strong")].some((x) => x.textContent === "Ma vue")), "enregistrée");
      // dupliquer
      await page.evaluate(() => document.querySelector('.pbp-mini[aria-label^="Dupliquer"]').click()); await wait(100);
      assert.ok(await page.evaluate(() => [...document.querySelectorAll(".pbp-row-t strong")].some((x) => x.textContent === "Ma vue (copie)")));
      // renommer la copie
      await page.evaluate(() => { const b = [...document.querySelectorAll('.pbp-mini[aria-label^="Renommer"]')].pop(); b.click(); }); await wait(100);
      await page.evaluate(() => { const i = document.querySelector(".pbp-row .pbp-in"); i.value = "Vue B"; i.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true })); }); await wait(100);
      assert.ok(await page.evaluate(() => [...document.querySelectorAll(".pbp-row-t strong")].some((x) => x.textContent === "Vue B")));
      // supprimer « Vue B »
      await page.evaluate(() => { document.querySelector('.pbp-mini[aria-label="Supprimer : Vue B"]').click(); }); await wait(100);
      assert.ok(await page.evaluate(() => ![...document.querySelectorAll(".pbp-row-t strong")].some((x) => x.textContent === "Vue B")));
      await page.key("Escape");
      // retour à Standard, puis restaurer « Ma vue »
      await page.evaluate(() => window.pbPanels.applyWorkspace("standard")); await wait(100);
      s = await state(page); assert.deepEqual([s.left, s.right], ["docked", "docked"]);
      const id = await page.evaluate(() => window.pbPanels.workspaces().find((w) => w.name === "Ma vue").id);
      await page.evaluate((i) => window.pbPanels.applyWorkspace(i), id); await wait(150);
      s = await state(page); assert.deepEqual([s.left, s.right], ["icons", "docked"]);
      // persistance : rechargement
      await page.goto(`${srv.base}/marketing/pages/${pageId}/editeur`);
      await page.waitFor(() => window.pbPanels && document.querySelector(".pbp-bar"), "rechargé"); await wait(300);
      s = await state(page); assert.deepEqual([s.left, s.right], ["icons", "docked"], "disposition conservée");
      assert.ok(await page.evaluate(() => window.pbPanels.workspaces().some((w) => w.name === "Ma vue")), "disposition personnelle conservée");
      // réinitialiser
      await page.evaluate(() => window.pbPanels.reset()); await wait(150);
      s = await state(page); assert.deepEqual([s.left, s.right, s.active], ["docked", "docked", "standard"]);
      // préférences propres à la personne ET au site
      const keys = await page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith("pb:pbp")));
      assert.ok(keys.every((k) => /^pb:pbp(-ws)?:\d+:\d+$/.test(k)), "clés par personne et par site : " + keys);
    } finally { await page.close(); }
  });

  test("11. raccourcis : gauche, droite, les deux, conception étendue, réinitialisation ; sans effet dans un champ de saisie", async () => {
    const page = await open();
    try {
      const press = (code, key) => page.evaluate((c) => document.dispatchEvent(new KeyboardEvent("keydown", { code: c.code, key: c.key, ctrlKey: true, altKey: true, bubbles: true, cancelable: true })), { code, key });
      await press("Digit1", "1"); assert.equal((await state(page)).left, "hidden");
      await press("Digit1", "1"); assert.equal((await state(page)).left, "docked");
      await press("Digit2", "2"); assert.equal((await state(page)).right, "hidden");
      await press("Digit0", "0"); let s = await state(page); assert.deepEqual([s.left, s.right], ["hidden", "hidden"]);
      await press("Digit0", "0"); s = await state(page); assert.deepEqual([s.left, s.right], ["docked", "docked"]);
      await press("KeyF", "f"); s = await state(page); assert.deepEqual([s.left, s.right], ["hidden", "hidden"]);
      await press("KeyF", "f"); s = await state(page); assert.deepEqual([s.left, s.right], ["docked", "docked"]);
      // dans un champ de saisie : aucun effet
      await page.evaluate(() => document.querySelector("#pb-el-search").focus());
      await page.evaluate(() => document.querySelector("#pb-el-search").dispatchEvent(new KeyboardEvent("keydown", { code: "Digit1", key: "1", ctrlKey: true, altKey: true, bubbles: true, cancelable: true })));
      assert.equal((await state(page)).left, "docked");
    } finally { await page.close(); }
  });

  test("12. écran étroit : pas de panneau flottant ni de barre d'icônes, aucun débordement", async () => {
    const page = await open(900, 900);
    try {
      await page.evaluate(() => window.pbPanels.setMode("left", "floating")); await wait(100);
      assert.equal((await state(page)).left, "docked", "refusé sur écran étroit");
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), 0);
    } finally { await page.close(); }
  });

  test("18-20. interactions avec le canevas et fluidité : déplacer un panneau ne redessine pas le canevas ; aucune erreur ; mouvement réduit", async () => {
    const page = await open();
    try {
      await page.evaluate(() => window.pbPanels.setMode("left", "floating")); await wait(150);
      const w0 = await canvasW(page);
      const r = await page.evaluate(async () => {
        const bar = document.querySelector(".pb-left .pbp-bar"), b = bar.getBoundingClientRect(), wait = (ms) => new Promise((x) => setTimeout(x, ms));
        let mut = 0; const fr = document.querySelector("[data-pb-frame]"); const mo = new MutationObserver((l) => { mut += l.filter((m) => m.target !== fr).length; }); // l'iframe reçoit seulement pointer-events pendant le geste mo.observe(document.querySelector("[data-pb-canvas]"), { subtree: true, attributes: true, childList: true });
        const fire = (t, x, y) => bar.dispatchEvent(new PointerEvent(t, { pointerId: 1, clientX: x, clientY: y, button: 0, buttons: 1, bubbles: true }));
        fire("pointerdown", b.left + 60, b.top + 15);
        for (let i = 1; i <= 30; i++) { fire("pointermove", b.left + 60 + i * 10, b.top + 15 + i * 4); await wait(8); }
        fire("pointerup", b.left + 360, b.top + 135); await wait(100); mo.disconnect();
        return { mut, x: document.querySelector(".pb-left").getBoundingClientRect().left };
      });
      assert.equal(r.mut, 0, "le canevas n'est pas touché pendant le déplacement");
      assert.equal(Math.round(await canvasW(page)), Math.round(w0), "largeur du canevas stable (aucun recalcul de mise en page)");
      assert.equal(page.errors.length, 0, "aucune erreur JavaScript : " + page.errors.join("|"));
      assert.equal((await state(page)).undo, true);
    } finally { await page.close(); }
    const rm = await open();
    try {
      await rm.emulateMedia([{ name: "prefers-reduced-motion", value: "reduce" }]);
      await rm.evaluate(() => window.pbPanels.setMode("left", "icons")); await wait(50);
      await rm.evaluate(() => document.querySelector('.pbp-strip[data-side="left"] .pbp-strip-btn').click()); await wait(50);
      assert.equal(await rm.evaluate(() => getComputedStyle(document.querySelector(".pb-left")).animationName), "none");
    } finally { await rm.close(); }
  });
});
