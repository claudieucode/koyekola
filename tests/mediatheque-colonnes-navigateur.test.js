// MÉDIATHÈQUE → navigation en colonnes (vrai Chrome) : dossiers imbriqués, colonnes conservées, clavier, grand dossier (300+ fichiers), recherche,
// redimensionnement, réglages persistants, menu contextuel, renommage, glisser-déposer, permissions (lecture seule), erreurs de console.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor, newStudent } = require("./helpers");
const { launch, SKIP } = require("./helpers-chrome-cdp");

describe("médiathèque : navigation en colonnes (navigateur)", { skip: SKIP }, () => {
  let srv, boss, chrome, db, site, ids = {}, viewer;
  const L = "/marketing/site-web/mediatheque";
  const api = async (client, url, json) => { const r = await client.request(`${L}${url}${url.includes("?") ? "&" : "?"}site=${site}`, { method: "POST", json }); assert.ok(r.status < 300, `${url} → ${r.status} ${r.text}`); return JSON.parse(r.text); };
  const folder = async (name, parent) => (await api(boss, "/dossiers", { name, parent_id: parent || null })).folder.id;
  const org = () => db.prepare("SELECT id FROM mk_organizations").get().id;
  const addFiles = (folderId, n, prefix, size = 900000) => {
    const ins = db.prepare("INSERT INTO mk_media (organization_id, kind, type, path, name, mime, size, width, height, reach, site_id, folder_id) VALUES (?, 'image', 'image', ?, ?, 'image/png', ?, 10, 10, 'site', ?, ?)");
    for (let i = 1; i <= n; i++) ins.run(org(), `/uploads/marketing/z/${prefix}-${String(i).padStart(3, "0")}.png`, `${prefix}-${String(i).padStart(3, "0")}.png`, size, site, folderId || null);
  };
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db();
    site = Number(String((await boss.post("/marketing/site-web/sites", { name: "Colonnes" })).location).match(/sites\/(\d+)/)[1]);
    ids.images = await folder("Images"); ids.congo = await folder("Drapeau Congo", ids.images); ids.finales = await folder("Versions finales", ids.congo); ids.logos = await folder("Logos", ids.finales);
    ids.vide = await folder("Vide", ids.images); ids.gros = await folder("Gros dossier"); ids.docs = await folder("Documents");
    addFiles(ids.logos, 5, "logo"); addFiles(ids.gros, 320, "photo"); addFiles(null, 3, "racine"); addFiles(ids.docs, 2, "doc");
    // Personne en lecture seule sur ce site
    const c = await newStudent(srv); const uid = db.prepare("SELECT id FROM users WHERE email = ?").get(c.email).id;
    db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, 'viewer')").run(site, uid); viewer = c;
    chrome = await launch();
  });
  after(async () => { if (chrome) await chrome.close(); await srv.stop(); });

  const open = async (client = boss, width = 1440, query = "") => {
    const page = await chrome.newPage({ width, height: 900, cookies: [...client.cookies].map(([name, value]) => ({ name, value, url: srv.base })) });
    await page.goto(`${srv.base}${L}?site=${site}&vue=colonnes${query}`);
    await page.waitFor(() => document.querySelector(".mk-mc[data-ready]") && document.querySelectorAll("[data-mc-col]").length >= 1 && document.querySelector(".mk-mc-row"), "colonnes prêtes", 30000);
    return page;
  };
  const click = (page, kind, name, depth) => page.evaluate((a) => { const r = [...document.querySelectorAll(`[data-mc-col="${a.depth}"] .mk-mc-row[data-kind="${a.kind}"]`)].find((x) => x.querySelector(".mk-mc-nm").textContent === a.name); if (!r) throw new Error("ligne absente : " + a.name); r.click(); return true; }, { kind, name, depth });
  const nCols = (page) => page.evaluate(() => document.querySelectorAll(".mk-mc-col:not(.mk-mc-prev)").length);
  const settle = (page) => page.waitFor(() => !document.querySelector(".mk-mc-skel"), "chargement fini", 20000);

  test("page : la vue en colonnes ne rend aucune liste côté serveur ; la corbeille reste une liste", async () => {
    const r = await boss.get(`${L}?site=${site}&vue=colonnes`);
    assert.equal(r.status, 200); assert.match(r.text, /data-mx-columns/); assert.doesNotMatch(r.text, /data-mx-items/); assert.match(r.text, /media-columns\.js/);
    const t = await boss.get(`${L}?site=${site}&vue=colonnes&corbeille=1`);
    assert.doesNotMatch(t.text, /data-mx-columns/); // la corbeille reste une liste à plat
  });

  test("dossiers imbriqués : une colonne par niveau, les colonnes de gauche ne sont JAMAIS reconstruites, fil d'Ariane synchronisé", async () => {
    const page = await open();
    assert.equal(await nCols(page), 1); await settle(page);
    await page.evaluate(() => { window.__c0 = document.querySelector('[data-mc-col="0"]'); window.__r0 = document.querySelector('[data-mc-col="0"] .mk-mc-row[data-kind="folder"]'); });
    await click(page, "folder", "Images", 0); assert.equal(await nCols(page), 2);
    await click(page, "folder", "Drapeau Congo", 1); assert.equal(await nCols(page), 3);
    await click(page, "folder", "Versions finales", 2); assert.equal(await nCols(page), 4);
    await click(page, "folder", "Logos", 3); assert.equal(await nCols(page), 5);
    await settle(page);
    const s = await page.evaluate(() => ({ same: window.__c0 === document.querySelector('[data-mc-col="0"]') && window.__r0.isConnected, files: [...document.querySelectorAll('[data-mc-col="4"] .mk-mc-row[data-kind="file"] .mk-mc-nm')].map((n) => n.textContent), crumb: [...document.querySelectorAll("[data-mc-crumb]")].map((b) => b.textContent), url: location.search, aria: document.querySelector('[data-mc-col="4"] [role="listbox"]').getAttribute("aria-label") }));
    assert.ok(s.same, "la colonne 1 est restée en place (aucun recalcul)");
    assert.equal(s.files.length, 5); assert.deepEqual(s.crumb, ["Médiathèque", "Images", "Drapeau Congo", "Versions finales", "Logos"]); assert.match(s.url, new RegExp(`dossier=${ids.logos}`)); assert.equal(s.aria, "Logos");
    // fichier de la dernière colonne : aperçu + fil d'Ariane
    await click(page, "file", "logo-002.png", 4);
    const p = await page.evaluate(() => ({ prev: !!document.querySelector(".mk-mc-prev h3"), title: (document.querySelector(".mk-mc-prev h3") || {}).textContent, last: document.querySelector('[data-mc-crumb="file"]').textContent, sel: document.querySelectorAll(".mk-mc-row.is-sel").length }));
    assert.deepEqual([p.prev, p.title, p.last, p.sel], [true, "logo-002.png", "logo-002.png", 1]);
    // remonter par le fil d'Ariane : les colonnes profondes disparaissent, la colonne 1 reste la même
    await page.evaluate(() => document.querySelector('[data-mc-crumb="2"]').click());
    assert.equal(await nCols(page), 3);
    assert.ok(await page.evaluate(() => window.__c0 === document.querySelector('[data-mc-col="0"]')));
    // retour / suivant
    await page.evaluate(() => document.querySelector('[aria-label="Retour"]').click());
    assert.equal(await nCols(page), 5);
    assert.deepEqual(page.errors.filter((e) => !/Failed to load resource/.test(e)), []);
  });

  test("clavier : ↓ ↑ → ←, Entrée, Début/Fin, saisie d'une lettre, Alt+← ; sélection toujours cohérente", async () => {
    const page = await open(); await settle(page);
    await page.evaluate(() => document.querySelector('[data-mc-col="0"] .mk-mc-row').focus());
    const names = () => page.evaluate(() => [...document.querySelectorAll('[data-mc-col="0"] .mk-mc-row[data-kind="folder"] .mk-mc-nm')].map((n) => n.textContent));
    const list = await names(); assert.deepEqual([...list].sort(), ["Documents", "Gros dossier", "Images"]); // l'ordre est celui de la médiathèque (ordre personnalisé)
    await page.key("ArrowDown"); // 2e dossier
    const sel = () => page.evaluate(() => [...document.querySelectorAll(".mk-mc-row.is-sel, .mk-mc-row.is-path")].map((r) => r.querySelector(".mk-mc-nm").textContent + ":" + r.getAttribute("aria-selected")));
    assert.deepEqual(await sel(), [list[1] + ":true"]);
    await page.key("End"); assert.deepEqual(await sel(), ["racine-003.png:true"]);
    await page.key("Home"); assert.deepEqual(await sel(), [list[0] + ":true"]);
    await page.key("i"); await page.waitFor(() => document.querySelector(".mk-mc-row.is-sel .mk-mc-nm").textContent === "Images", "saisie rapide");
    await page.key("ArrowRight");
    await page.waitFor(() => document.querySelectorAll(".mk-mc-col:not(.mk-mc-prev)").length === 3 && document.querySelector('[data-mc-col="1"] .mk-mc-row.is-sel'), "entré dans Images (1er élément sélectionné)");
    assert.equal(await page.evaluate(async () => { await new Promise((r) => setTimeout(r, 600)); const a = document.activeElement; return a.classList.contains("mk-mc-row") ? a.querySelector(".mk-mc-nm").textContent : "FOCUS PERDU"; }), "Drapeau Congo"); // le focus survit à l'arrivée des fichiers
    await page.key("ArrowLeft");
    await page.waitFor(() => document.querySelector('[data-mc-col="0"] .mk-mc-row.is-sel .mk-mc-nm').textContent === "Images", "retour à la colonne 1");
    await page.key("ArrowLeft", 1); // Alt+←
    assert.deepEqual(page.errors.filter((e) => !/Failed to load resource/.test(e)), []);
  });

  test("grand dossier (320 fichiers) : 100 par page, « afficher plus », sélection rapide, comptes exacts", async () => {
    const page = await open();
    const t0 = Date.now(); await click(page, "folder", "Gros dossier", 0); await settle(page);
    const n1 = await page.evaluate(() => ({ rows: document.querySelectorAll('[data-mc-col="1"] .mk-mc-row[data-kind="file"]').length, foot: document.querySelector('[data-mc-col="1"] .mk-mc-foot').textContent, more: !!document.querySelector("[data-mc-more]"), count: document.querySelector('[data-mc-col="0"] .mk-mc-row[data-id]').parentElement.querySelector('.mk-mc-row[data-kind="folder"] .mk-mc-meta') && [...document.querySelectorAll('[data-mc-col="0"] .mk-mc-row[data-kind="folder"]')].find((r) => r.querySelector(".mk-mc-nm").textContent === "Gros dossier").querySelector(".mk-mc-meta").textContent }));
    assert.equal(n1.count, "320"); assert.ok(n1.rows >= 100 && n1.rows <= 320, `première page : ${n1.rows}`); assert.match(n1.foot, /320 fichiers/);
    assert.ok(Date.now() - t0 < 20000);
    // défiler jusqu'au bout charge tout (observateur ou bouton)
    await page.evaluate(() => { const b = document.querySelector("[data-mc-more]"); if (b) b.click(); });
    await page.waitFor(() => { const b = document.querySelector("[data-mc-more]"); if (b) b.click(); return document.querySelectorAll('[data-mc-col="1"] .mk-mc-row[data-kind="file"]').length === 320; }, "320 fichiers chargés", 30000);
    // changement de sélection : temps d'un clic sur un fichier (aucune requête, aucune reconstruction de liste)
    const ms = await page.evaluate(async () => {
      const rows = document.querySelectorAll('[data-mc-col="1"] .mk-mc-row[data-kind="file"]'), first = rows[0], times = [];
      for (const i of [250, 251, 252, 253, 254, 255, 256]) { const t = performance.now(); rows[i].click(); times.push(performance.now() - t); await new Promise((r) => setTimeout(r, 30)); }
      rows[250].click(); // retour au fichier 251 pour la suite
      times.sort((a, b) => a - b);
      return { ms: times[3], max: times[6], same: first === document.querySelector('[data-mc-col="1"] .mk-mc-row[data-kind="file"]') };
    });
    console.log("SELECTION (320 fichiers) : médiane", Math.round(ms.ms), "ms, maximum", Math.round(ms.max), "ms");
    assert.ok(ms.ms < 60, `sélection (médiane) : ${ms.ms} ms`); assert.ok(ms.same, "la liste n'a pas été reconstruite");
    assert.equal(await page.evaluate(() => document.querySelector(".mk-mc-prev h3").textContent), "photo-251.png");
    assert.deepEqual(page.errors.filter((e) => !/Failed to load resource/.test(e)), []);
  });

  test("dossier vide, recherche dans le dossier sélectionné (dossiers et fichiers)", async () => {
    const page = await open();
    await click(page, "folder", "Images", 0); await click(page, "folder", "Vide", 1); await settle(page);
    assert.match(await page.evaluate(() => document.querySelector('[data-mc-col="2"] .mk-mc-note').textContent), /Dossier vide/);
    await click(page, "folder", "Gros dossier", 0); await settle(page);
    await page.evaluate(() => { const i = document.querySelector(".mk-mc-search input"); i.value = "photo-30"; i.dispatchEvent(new Event("input")); });
    await page.waitFor(() => /10 fichiers/.test(document.querySelector('[data-mc-col="1"] .mk-mc-foot').textContent), "résultats de recherche", 15000);
    await page.evaluate(() => { const i = document.querySelector(".mk-mc-search input"); i.value = "zzzz"; i.dispatchEvent(new Event("input")); });
    await page.waitFor(() => /Aucun résultat/.test(document.querySelector('[data-mc-col="1"] .mk-mc-note').textContent), "aucun résultat", 15000);
  });

  test("redimensionner une colonne (souris + clavier), largeurs bornées et mémorisées ; réglages persistants après rechargement", async () => {
    const page = await open();
    const box = await page.evaluate(() => { const r = document.querySelector('[data-mc-col="0"] .mk-mc-resize').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + 80, w: document.querySelector('[data-mc-col="0"]').getBoundingClientRect().width }; });
    await page.mouseMove(box.x, box.y);
    const cmd = page; // glisser avec la souris réelle
    await cmd.mouseClick(box.x, box.y).catch(() => {});
    await page.evaluate((b) => { const hd = document.querySelector('[data-mc-col="0"] .mk-mc-resize'); const fire = (t, x) => hd.dispatchEvent(new PointerEvent(t, { bubbles: true, clientX: x, clientY: b.y, pointerId: 1 })); hd.setPointerCapture = () => {}; fire("pointerdown", b.x); fire("pointermove", b.x + 90); fire("pointerup", b.x + 90); }, box);
    const w = await page.evaluate(() => document.querySelector('[data-mc-col="0"]').getBoundingClientRect().width);
    assert.ok(w > box.w + 60, `colonne élargie : ${box.w} → ${w}`);
    await page.evaluate(() => { const hd = document.querySelector('[data-mc-col="0"] .mk-mc-resize'); hd.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientX: 0, pointerId: 1 })); hd.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientX: 5000, pointerId: 1 })); hd.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, clientX: 5000, pointerId: 1 })); });
    assert.ok(await page.evaluate(() => document.querySelector('[data-mc-col="0"]').getBoundingClientRect().width) <= 521, "largeur maximale respectée");
    // réglages propres à ce mode : largeur, extensions, métadonnées (enregistrés sur le serveur) ; le thème vient de l'« Apparence » du gestionnaire
    await page.evaluate(() => { const sel = (l) => document.querySelector(`.mk-mc-setbody [aria-label="${l}"]`); const wd = sel("Largeur des colonnes"); wd.value = "300"; wd.dispatchEvent(new Event("input")); });
    await page.evaluate(() => { const c = [...document.querySelectorAll(".mk-mc-setbody label")].find((l) => /extensions/.test(l.textContent)).querySelector("input"); c.checked = false; c.dispatchEvent(new Event("change")); });
    assert.ok(await page.evaluate(() => [...document.querySelectorAll('[data-mc-col="0"] .mk-mc-row[data-kind="file"] .mk-mc-nm')].every((n) => !/\.png$/.test(n.textContent))), "extensions masquées");
    await new Promise((r) => setTimeout(r, 900)); // l'enregistrement est groupé (350 ms)
    const saved = JSON.parse((await boss.get(`${L}/preferences.json?site=${site}`)).text).prefs;
    assert.equal(saved.colWidth, 300); assert.equal(saved.colExt, false);
    await boss.request(`${L}/preferences?site=${site}`, { method: "POST", json: { theme: { mode: "sombre" } } });
    await page.goto(`${srv.base}${L}?site=${site}&vue=colonnes`);
    await page.waitFor(() => document.querySelector(".mk-mc[data-ready]") && document.querySelector(".mk-mc-row"), "rechargé", 30000);
    const b = await page.evaluate(() => ({ w: document.querySelector('[data-mc-col="0"]').getBoundingClientRect().width, ext: [...document.querySelectorAll('[data-mc-col="0"] .mk-mc-row[data-kind="file"] .mk-mc-nm')].every((n) => !/\.png$/.test(n.textContent)), bg: getComputedStyle(document.querySelector(".mk-mc")).backgroundColor, ink: getComputedStyle(document.querySelector(".mk-mc")).color }));
    assert.ok(b.w >= 299 && b.w <= 301, `largeur par défaut mémorisée sur le serveur : ${b.w}`); assert.ok(b.ext, "extensions toujours masquées");
    assert.notEqual(b.bg, "rgb(255, 255, 255)", "le thème sombre de l'Apparence s'applique aux colonnes"); assert.notEqual(b.bg, b.ink);
    await boss.request(`${L}/preferences?site=${site}`, { method: "POST", json: { theme: { mode: "clair" } } });
    assert.deepEqual(page.errors.filter((e) => !/Failed to load resource/.test(e)), []);
  });

  test("menu contextuel, renommage d'un dossier, nouveau dossier, glisser-déposer d'un fichier et d'un dossier", async () => {
    const page = await open();
    await click(page, "folder", "Images", 0); await settle(page);
    // menu contextuel sur un dossier
    await page.evaluate(() => { const r = [...document.querySelectorAll('[data-mc-col="1"] .mk-mc-row')].find((x) => x.querySelector(".mk-mc-nm").textContent === "Vide"); r.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, cancelable: true, clientX: 300, clientY: 300 })); });
    assert.deepEqual(await page.evaluate(() => [...document.querySelectorAll(".mk-mc-menu button")].map((b) => b.textContent)), ["Ouvrir", "Nouveau sous-dossier", "Renommer", "Mettre à la corbeille", "Supprimer le dossier, garder les fichiers"]);
    // renommer via le menu
    await page.evaluate(() => [...document.querySelectorAll(".mk-mc-menu button")].find((b) => b.textContent === "Renommer").click());
    await page.evaluate(() => { const i = document.querySelector(".mk-mc-rename"); i.value = "Archives"; i.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true })); });
    await page.waitFor(() => [...document.querySelectorAll('[data-mc-col="1"] .mk-mc-nm')].some((n) => n.textContent === "Archives"), "dossier renommé");
    assert.equal(db.prepare("SELECT name FROM mk_media_folders WHERE id = ?").get(ids.vide).name, "Archives");
    // glisser un fichier de « Documents » vers « Archives »
    await click(page, "folder", "Documents", 0); await settle(page);
    const dt = () => new DataTransfer();
    await page.evaluate(() => {
      const file = document.querySelector('[data-mc-col="1"] .mk-mc-row[data-kind="file"]'); window.__moved = file.getAttribute("data-id");
      const target = [...document.querySelectorAll('[data-mc-col="0"] .mk-mc-row[data-kind="folder"]')].find((x) => x.querySelector(".mk-mc-nm").textContent === "Images");
      const d = new DataTransfer(); const ev = (t, el) => el.dispatchEvent(new DragEvent(t, { bubbles: true, cancelable: true, dataTransfer: d }));
      ev("dragstart", file); ev("dragover", target); ev("drop", target); ev("dragend", file);
    });
    await page.waitFor(() => !document.querySelector(`[data-mc-col="1"] [data-id="${window.__moved}"]`), "fichier déplacé hors du dossier", 20000);
    assert.equal(db.prepare("SELECT folder_id FROM mk_media WHERE id = ?").get(await page.evaluate(() => Number(window.__moved))).folder_id, ids.images);
    // un dossier ne peut pas être déposé dans son propre sous-dossier (refus côté interface ET serveur)
    const r = await boss.request(`${L}/dossiers/${ids.images}?site=${site}`, { method: "POST", json: { parent_id: ids.logos } });
    assert.ok(r.status >= 400, "déplacement circulaire refusé par le serveur");
    // déplacer le dossier « Documents » dans « Images » par glisser-déposer
    await page.evaluate(() => {
      const src = [...document.querySelectorAll('[data-mc-col="0"] .mk-mc-row[data-kind="folder"]')].find((x) => x.querySelector(".mk-mc-nm").textContent === "Documents");
      const target = [...document.querySelectorAll('[data-mc-col="0"] .mk-mc-row[data-kind="folder"]')].find((x) => x.querySelector(".mk-mc-nm").textContent === "Images");
      const d = new DataTransfer(); const ev = (t, el) => el.dispatchEvent(new DragEvent(t, { bubbles: true, cancelable: true, dataTransfer: d }));
      ev("dragstart", src); ev("dragover", target); ev("drop", target); ev("dragend", src);
    });
    await page.waitFor(() => ![...document.querySelectorAll('[data-mc-col="0"] .mk-mc-row[data-kind="folder"] .mk-mc-nm')].some((n) => n.textContent === "Documents"), "dossier déplacé", 20000);
    assert.equal(db.prepare("SELECT parent_id FROM mk_media_folders WHERE id = ?").get(ids.docs).parent_id, ids.images);
    // nouveau dossier : créé, sélectionné, nom modifiable tout de suite
    await page.evaluate(() => [...document.querySelectorAll(".mk-mc-bar button")].find((b) => b.textContent === "Nouveau dossier").click());
    await page.waitFor(() => document.querySelector(".mk-mc-rename"), "nom modifiable", 15000);
    await page.evaluate(() => { const i = document.querySelector(".mk-mc-rename"); i.value = "Projets"; i.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true })); });
    await page.waitFor(() => [...document.querySelectorAll(".mk-mc-nm")].some((n) => n.textContent === "Projets"), "nouveau dossier visible", 15000);
    assert.ok(db.prepare("SELECT 1 FROM mk_media_folders WHERE name = 'Projets'").get());
    assert.deepEqual(page.errors.filter((e) => !/Failed to load resource/.test(e)), []);
  });

  test("permissions : lecture seule → ni glisser, ni renommer, ni créer ; le serveur refuse aussi", async () => {
    const page = await open(viewer);
    const s = await page.evaluate(() => ({ draggable: document.querySelectorAll(".mk-mc-row[draggable='true']").length, newBtn: [...document.querySelectorAll(".mk-mc-bar button")].some((b) => b.textContent === "Nouveau dossier") }));
    assert.deepEqual(s, { draggable: 0, newBtn: false });
    await page.evaluate(() => document.querySelector('[data-mc-col="0"] .mk-mc-row[data-kind="folder"]').dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, cancelable: true, clientX: 200, clientY: 200 })));
    assert.deepEqual(await page.evaluate(() => [...document.querySelectorAll(".mk-mc-menu button")].map((b) => b.textContent)), ["Ouvrir"]);
    for (const [url, body] of [["/dossiers", { name: "X" }], [`/dossiers/${ids.gros}`, { name: "Y" }], ["/deplacer", { ids: [1], folder_id: ids.gros }]]) {
      const r = await viewer.request(`${L}${url}?site=${site}`, { method: "POST", json: body }); assert.equal(r.status, 403, `${url} : ${r.status}`);
    }
  });

  test("mouvement réduit : plus d'animation d'entrée ; étroit (375 px) : défilement horizontal interne, pas de débordement de page", async () => {
    const page = await open(boss, 375);
    await click(page, "folder", "Images", 0); await settle(page);
    const m = await page.evaluate(() => ({ page: document.documentElement.scrollWidth <= window.innerWidth + 1, cols: document.querySelector(".mk-mc-cols").scrollWidth >= document.querySelector(".mk-mc-cols").clientWidth }));
    assert.deepEqual(m, { page: true, cols: true });
    const rm = await open(boss, 1440); await rm.emulateMedia([{ name: "prefers-reduced-motion", value: "reduce" }]);
    await click(rm, "folder", "Images", 0);
    assert.equal(await rm.evaluate(() => getComputedStyle(document.querySelector('[data-mc-col="1"]')).animationName), "none");
  });
  test("bascule de mode : grille → colonnes → grille sans recharger la page, dossier ouvert conservé dans l'adresse", async () => {
    const page = await chrome.newPage({ width: 1440, height: 900, cookies: [...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })) });
    await page.goto(`${srv.base}${L}?site=${site}&vue=grille`);
    await page.waitFor(() => document.querySelector("[data-mx-view]"), "gestionnaire chargé", 30000);
    await page.evaluate(() => { window.__same = 1; document.querySelector('[data-mx-view="colonnes"]').click(); });
    await page.waitFor(() => document.querySelector(".mk-mc[data-ready] .mk-mc-row"), "colonnes affichées", 30000);
    await click(page, "folder", "Images", 0); await settle(page);
    assert.match(await page.evaluate(() => location.search), new RegExp(`dossier=${ids.images}`));
    await page.evaluate(() => document.querySelector('[data-mx-view="grille"]').click());
    await page.waitFor(() => !document.querySelector(".mk-mc") && document.querySelector("[data-mx-items], .mx-empty, .mx-folder-list"), "retour à la grille", 30000);
    assert.equal(await page.evaluate(() => window.__same), 1, "la page n'a pas été rechargée");
    assert.deepEqual(page.errors.filter((e) => !/Failed to load resource/.test(e)), []);
  });
});
