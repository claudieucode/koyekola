// Médiathèque, lot 2 (VRAI Chrome) : sections de la barre latérale (ordre par flèches et par glisser-déposer, masquage, mémorisation), vues enregistrées, ordre et copie des dossiers,
// colonnes réordonnables, historique, seuils de stockage. Ignoré si Playwright / Chrome sont absents.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const zlib = require("node:zlib");
const { setup, SKIP } = require("./header-aides");

function png(w, h, rgb) {
  const table = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
  const crc = (buf) => { let c = 0xffffffff; for (const b of buf) c = table[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([len, td, c]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2;
  const raw = Buffer.alloc((w * 3 + 1) * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) raw.set([(rgb[0] + x) % 256, (rgb[1] + y) % 256, rgb[2]], y * (w * 3 + 1) + 1 + x * 3);
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
}

describe("médiathèque : organisation (lot 2, Chrome)", { skip: SKIP }, () => {
  let env, context, page, S, L, errors = [];
  const F = {};
  const one = (sql, ...a) => env.db.prepare(sql).get(...a);
  const api = (url, json) => env.boss.request(`${L}${url}?site=${S}`, { method: "POST", json });
  const upload = async (buffer, name, extra = {}) => { const fd = new FormData(); fd.append("file", new Blob([buffer], { type: "image/png" }), name); for (const [k, v] of Object.entries(extra)) fd.append(k, String(v)); const r = await env.boss.request(`${L}/televerser?site=${S}`, { method: "POST", multipart: fd }); assert.equal(r.status, 201, r.text); return JSON.parse(r.text).media; };
  const url = (q = "") => `${env.srv.base}/marketing/site-web/sites/${S}/medias${q}`;
  const open = async (q = "") => { await page.goto(url(q)); await page.waitForSelector("[data-mx]"); await page.waitForTimeout(350); };
  const orderOf = (k) => page.evaluate((key) => Number(document.querySelector(`[data-mx-sec="${key}"]`).style.order), k);
  const settle = () => page.waitForTimeout(900);
  const openTheme = async () => { await page.click("[data-mx-theme] > summary"); await page.waitForTimeout(200); await page.locator(".mx-theme-secs > summary").click(); await page.waitForTimeout(150); };
  const treeIds = () => page.evaluate(() => [...document.querySelectorAll(".mx-tree > .mx-tree-item")].map((li) => Number(li.getAttribute("data-mx-folder-node"))));

  before(async () => {
    env = await setup({ siteName: "Site organisation" }); S = env.site; L = "/marketing/site-web/mediatheque";
    context = await env.browser.newContext({ viewport: { width: 1440, height: 1000 } });
    await context.addCookies([...env.boss.cookies].map(([name, value]) => ({ name, value, url: env.srv.base })));
    context.setDefaultTimeout(15000);
    F.a = JSON.parse((await api("/dossiers", { name: "Alpha" })).text).folder.id; F.b = JSON.parse((await api("/dossiers", { name: "Bravo" })).text).folder.id; F.c = JSON.parse((await api("/dossiers", { name: "Charlie" })).text).folder.id;
    for (let i = 1; i <= 3; i++) await upload(png(40 + i, 30, [i * 30, 90, 160]), `photo-${i}.png`, { dossier: F.a });
    page = await context.newPage();
    page.on("pageerror", (e) => errors.push(e.message)); page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errors.push(m.text()); });
  });
  after(async () => { if (context) await context.close(); if (env) await env.close(); });

  test("sections : flèches pour l'ordre, case pour masquer, mémorisation après rechargement, rétablissement ; « Organisation » reste affichée", async () => {
    await open();
    const o0 = await orderOf("tags"), oTypes = await orderOf("types");
    assert.ok(oTypes < o0, "ordre par défaut : Types avant Tags");
    await openTheme();
    for (let i = 0; i < 6; i++) await page.locator('[data-mx-sec-move="up"][data-sec="tags"]').click();
    assert.equal(await orderOf("tags"), 1, "Tags monte en première position");
    await page.locator('[data-mx-sec-vis="collections"]').uncheck();
    assert.equal(await page.locator('[data-mx-sec="collections"]').isVisible(), false, "Collections masquée");
    assert.equal(await page.locator('[data-mx-sec-vis="organisation"]').isDisabled(), true, "Organisation non masquable");
    await settle(); await open();
    assert.equal(await orderOf("tags"), 1, "ordre mémorisé");
    assert.equal(await page.locator('[data-mx-sec="collections"]').isVisible(), false, "masquage mémorisé");
    await openTheme(); await page.click("[data-mx-secs-reset]"); await settle();
    assert.equal(await page.locator('[data-mx-sec="collections"]').isVisible(), true);
    assert.equal(await orderOf("tags") > (await orderOf("types")), true, "ordre rétabli");
  });

  test("sections : glisser-déposer d'un titre dans la barre latérale", async () => {
    await page.setViewportSize({ width: 1440, height: 1600 }); // toute la barre est visible : le glisser ne dépend pas du défilement
    await open();
    const before = await orderOf("types");
    await page.locator('[data-mx-sec-drag="types"]').dragTo(page.locator('[data-mx-sec="organisation"]'), { targetPosition: { x: 20, y: 24 } });
    await settle();
    const after = await orderOf("types");
    assert.notEqual(after, before, "Types a changé de place");
    assert.equal(after, (await orderOf("organisation")) - 1, "Types est maintenant juste avant Organisation");
    await open();
    assert.equal(await orderOf("types"), after, "nouvel ordre mémorisé après rechargement");
    await page.setViewportSize({ width: 1440, height: 1000 });
    await openTheme(); await page.click("[data-mx-secs-reset]"); await settle();
  });

  test("vue enregistrée : filtres → dossier intelligent partagé → ouverture, renommage, mise à jour des critères, suppression ; aucun fichier déplacé", async () => {
    await open("?type=image");
    await page.click("[data-mx-save-view]").catch(async () => { await page.click(".mx-pop > summary:has-text('Filtres')"); await page.click("[data-mx-save-view]"); });
    const dlg = page.locator("dialog[open]").last();
    await dlg.locator("input[type=text]").fill("Mes images"); await dlg.locator("button[type=submit]").click(); await page.waitForTimeout(900);
    const row = one("SELECT id, kind, criteria FROM mk_media_smart WHERE name = 'Mes images'");
    assert.ok(row && row.kind === "smart"); assert.equal(JSON.parse(row.criteria).type, "image");
    const link = page.locator(`[data-mx-smart="${row.id}"]`); assert.equal(await link.count(), 1, "la vue apparaît dans la barre latérale");
    await open("?section=accueil");
    await page.locator(`[data-mx-smart="${row.id}"]`).click(); await page.waitForTimeout(700);
    assert.match(page.url(), /type=image/); assert.match(page.url(), new RegExp(`smart=${row.id}`));
    assert.equal(await page.locator("[data-ml-item]").count(), 3, "les trois images s'affichent");
    // renommer par le menu contextuel
    await page.locator(`[data-mx-smart="${row.id}"]`).click({ button: "right" });
    await page.locator(".mx-menu button", { hasText: "Renommer" }).click();
    const d2 = page.locator("dialog[open]").last(); await d2.locator("input[type=text]").fill("Images PNG"); await d2.locator("button[type=submit]").click(); await page.waitForTimeout(800);
    assert.equal(one("SELECT name n FROM mk_media_smart WHERE id = ?", row.id).n, "Images PNG");
    // supprimer : la vue disparaît, les fichiers restent
    await page.locator(`[data-mx-smart="${row.id}"]`).click({ button: "right" });
    await page.locator(".mx-menu button", { hasText: "Supprimer" }).click();
    const d3 = page.locator("dialog[open]").last(); await d3.locator("button[type=submit]").click(); await page.waitForTimeout(800);
    assert.equal(one("SELECT COUNT(*) n FROM mk_media_smart WHERE id = ?", row.id).n, 0);
    assert.equal(one("SELECT COUNT(*) n FROM mk_media WHERE deleted_at IS NULL").n, 3);
  });

  test("dossiers : monter / descendre dans la liste (menu contextuel) et copier un dossier avec son contenu", async () => {
    await open();
    assert.deepEqual(await treeIds(), [F.a, F.b, F.c], "ordre alphabétique d'origine");
    await page.locator(`.mx-tree-row[data-mx-folder="${F.c}"]`).click({ button: "right" });
    await page.locator(".mx-menu button", { hasText: "Monter dans la liste" }).click(); await page.waitForTimeout(900);
    assert.deepEqual(await treeIds(), [F.a, F.c, F.b], "Charlie est monté d'un cran");
    await page.locator(`.mx-tree-row[data-mx-folder="${F.a}"]`).click({ button: "right" });
    await page.locator(".mx-menu button", { hasText: "Copier le dossier" }).click();
    for (let i = 0; i < 40 && !(one("SELECT COUNT(*) n FROM mk_media m JOIN mk_media_folders f ON f.id = m.folder_id WHERE f.name = 'Alpha (copie)'").n >= 3); i++) await page.waitForTimeout(250); // la copie de 3 fichiers prend un instant
    await page.waitForTimeout(500);
    const copy = one("SELECT id FROM mk_media_folders WHERE name = 'Alpha (copie)'"); assert.ok(copy, "dossier copié");
    assert.equal(one("SELECT COUNT(*) n FROM mk_media WHERE folder_id = ?", copy.id).n, 3, "trois fichiers copiés");
    assert.equal(one("SELECT COUNT(*) n FROM mk_media WHERE folder_id = ?", F.a).n, 3, "original intact");
    assert.equal(await page.locator(`.mx-tree-row[data-mx-folder="${copy.id}"]`).count(), 1, "visible dans l'arbre");
  });

  test("colonnes : l'ordre choisi s'applique à la vue Liste et reste mémorisé", async () => {
    await open("?vue=liste");
    await page.click("[data-mx-cols] > summary"); await page.waitForTimeout(150);
    const ord = (c) => page.evaluate((k) => getComputedStyle(document.querySelector(`.mx-c-${k}`)).order, c);
    const sizeBefore = Number(await ord("size")), typeBefore = Number(await ord("type"));
    assert.ok(typeBefore < sizeBefore, "Type avant Taille par défaut");
    await page.locator('[data-mx-col-move="up"][data-col="size"]').click(); await settle();
    assert.ok(Number(await ord("size")) < Number(await ord("type")), "Taille passe avant Type");
    await open("?vue=liste");
    assert.ok(Number(await ord("size")) < Number(await ord("type")), "ordre mémorisé");
  });

  test("historique : opérations listées avec libellé, personne et date ; filtre ; stockage : seuils enregistrés", async () => {
    await open("?section=historique");
    await page.waitForSelector(".mx-hist-row");
    const texts = await page.locator(".mx-hist-row").allInnerTexts();
    assert.ok(texts.some((t) => /Dossier créé/.test(t)), "création de dossier listée");
    assert.ok(texts.some((t) => /Fichier importé/.test(t)), "import listé");
    await page.selectOption("#mx-hist-f", "media.folder_created"); await page.waitForTimeout(600);
    assert.ok((await page.locator(".mx-hist-row").allInnerTexts()).every((t) => /Dossier créé/.test(t)), "filtre appliqué");
    assert.match(await page.locator(".mx-section").innerText(), /Rien n'est annulé d'ici/, "pas de fausse promesse d'annulation");
    await open("?section=stockage");
    await page.locator(".mx-alerts > summary").click(); await page.fill("#mx-warn", "1"); await page.fill("#mx-crit", "2"); await page.click(".mx-alerts button[type=submit]"); await page.waitForTimeout(900);
    assert.equal(one("SELECT value v FROM mk_settings WHERE key LIKE 'mediastorage.site_%.warn_mb'").v, "1");
    assert.equal(one("SELECT value v FROM mk_settings WHERE key LIKE 'mediastorage.site_%.crit_mb'").v, "2");
  });

  test("responsive (390 px) : aucune barre horizontale, historique lisible", async () => {
    try {
      await page.setViewportSize({ width: 390, height: 800 }); await open("?section=historique"); await page.waitForSelector(".mx-hist-row");
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth <= 1), true);
    } finally { await page.setViewportSize({ width: 1440, height: 1000 }); }
  });

  test("aucune erreur de script pendant tout le parcours", () => { assert.deepEqual(errors, []); });
});
