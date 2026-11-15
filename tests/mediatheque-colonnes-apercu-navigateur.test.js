// Médiathèque : colonnes personnalisables du mode liste + aperçu rapide (VRAI Chrome). Colonnes : choix, ordre (glisser-déposer et boutons), largeur, tri conservé, configurations,
// disposition adaptée à la catégorie, informations lues dans le fichier. Aperçu : Espace, bouton, menu contextuel, double-clic configurable, image/vidéo/audio/PDF/autre format,
// navigation entre fichiers, zoom (image d'origine seulement au zoom), mode fenêtre, libération des lecteurs. Ignoré si Playwright / Chrome sont absents.
const { test, describe, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const zlib = require("node:zlib");
const fs = require("fs");
const path = require("path");
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
function wav(seconds = 1) {
  const rate = 8000, n = rate * seconds, d = Buffer.alloc(44 + n);
  d.write("RIFF", 0); d.writeUInt32LE(36 + n, 4); d.write("WAVEfmt ", 8); d.writeUInt32LE(16, 16); d.writeUInt16LE(1, 20); d.writeUInt16LE(1, 22); d.writeUInt32LE(rate, 24); d.writeUInt32LE(rate, 28); d.writeUInt16LE(1, 32); d.writeUInt16LE(8, 34); d.write("data", 36); d.writeUInt32LE(n, 40);
  for (let i = 0; i < n; i++) d[44 + i] = 128 + Math.round(30 * Math.sin(i / 8));
  return d;
}
const PDF = Buffer.from("%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 200]>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n");
const WEBM = path.join(__dirname, "fixtures", "mediatheque", "clip.webm");

describe("médiathèque : colonnes personnalisables et aperçu rapide dans Chrome", { skip: SKIP }, () => {
  let env, context, page, S, L, errors = [];
  const M = {};
  const url = (q = "") => `${env.srv.base}/marketing/site-web/sites/${S}/medias${q}`;
  const upload = async (buffer, name, mime) => { const fd = new FormData(); fd.append("file", new Blob([buffer], { type: mime }), name); const r = await env.boss.request(`${L}/televerser?site=${S}`, { method: "POST", multipart: fd }); assert.equal(r.status, 201, r.text); return JSON.parse(r.text).media; };
  const open = async (q = "") => { await page.goto(url(q)); await page.waitForSelector("[data-mx]"); await page.waitForFunction(() => window.MXColumns && window.MXQuick && window.MXViewer && window.MXPreview); await page.waitForTimeout(200); };
  const item = (id) => page.locator(`[data-ml-item][data-id="${id}"]`);
  const heads = () => page.evaluate(() => [...document.querySelectorAll(".mx-colhead [data-col]")].filter((c) => c.dataset.col !== "name" && getComputedStyle(c).display !== "none").sort((a, b) => Number(getComputedStyle(a).order) - Number(getComputedStyle(b).order)).map((c) => c.getAttribute("data-col")));
  const waitIdle = () => page.waitForFunction(() => !document.querySelector("[data-mx]").hasAttribute("aria-busy"));
  const prefs = async () => JSON.parse((await env.boss.get(`${L}/preferences.json?site=${S}`)).text).prefs;
  const flush = async () => { await page.evaluate(() => window.MX.flushPrefs()); };
  const cell = (id, key) => item(id).locator(`.mx-c-${key}`);
  const quickOpen = () => page.evaluate(() => document.querySelector("[data-mx]").getAttribute("data-info") === "open" && document.querySelector("[data-mx]").getAttribute("data-pane") === "apercu");

  before(async () => {
    env = await setup({ siteName: "Site colonnes et aperçu" }); S = env.site; L = "/marketing/site-web/mediatheque";
    context = await env.browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });
    await context.addCookies([...env.boss.cookies].map(([name, value]) => ({ name, value, url: env.srv.base })));
    context.setDefaultTimeout(15000);
    M.i1 = (await upload(png(60, 40, [10, 90, 160]), "alpha.png", "image/png")).id;
    M.i2 = (await upload(png(120, 80, [60, 20, 160]), "bravo.png", "image/png")).id;
    M.i3 = (await upload(png(200, 150, [120, 90, 10]), "charlie.png", "image/png")).id;
    if (fs.existsSync(WEBM)) M.v = (await upload(fs.readFileSync(WEBM), "clip.webm", "video/webm")).id;
    M.a = (await upload(wav(2), "son.wav", "audio/wav")).id;
    M.p = (await upload(PDF, "dossier.pdf", "application/pdf")).id;
    page = await context.newPage();
    page.on("pageerror", (e) => errors.push(e.message)); page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errors.push(m.text()); });
  });
  beforeEach(async () => {
    await env.boss.request(`${L}/preferences?site=${S}`, { method: "POST", json: { view: "liste", columns: ["type", "size", "dims", "modified"], colWidths: {}, colSmart: true, colByType: {}, colConfigs: [], colDefault: "", sort: "recent", pane: "infos", info: "closed", previewMode: "panneau", dblclick: "plein-ecran", infoWidth: 340 } });
  });
  after(async () => { if (context) await context.close(); if (env) await env.close(); });

  test("préférences : le serveur filtre, borne et conserve colonnes, largeurs, configurations et réglages d'aperçu", async () => {
    const post = (json) => env.boss.request(`${L}/preferences?site=${S}`, { method: "POST", json });
    const r = await post({ columns: ["size", "bidon", "ext", "size", "tags"], colWidths: { size: 5, ext: 9999, bidon: 80 }, colSmart: false, pane: "apercu", previewMode: "fenetre", dblclick: "infos", infoWidth: 9999, sort: "dims", colByType: { image: ["format", "x"], inconnu: ["size"] }, colConfigs: [{ id: "abcd1234", name: "  Photos   rapides ", columns: ["dims", "zzz"], colWidths: { dims: 130 } }, { id: "!!", name: "mauvais", columns: [] }], colDefault: "abcd1234" });
    assert.equal(r.status, 200, r.text);
    const p = JSON.parse(r.text).prefs;
    assert.deepEqual(p.columns, ["size", "ext", "tags"], "colonnes inconnues retirées, doublons supprimés, ORDRE conservé");
    assert.deepEqual(p.colWidths, { size: 56, ext: 480 }, "largeurs bornées, colonnes inconnues ignorées");
    assert.equal(p.colSmart, false); assert.equal(p.pane, "apercu"); assert.equal(p.previewMode, "fenetre"); assert.equal(p.dblclick, "infos"); assert.equal(p.infoWidth, 720); assert.equal(p.sort, "dims");
    assert.deepEqual(p.colByType, { image: ["format"] });
    assert.equal(p.colConfigs.length, 1); assert.equal(p.colConfigs[0].name, "Photos rapides"); assert.deepEqual(p.colConfigs[0].columns, ["dims"]); assert.equal(p.colDefault, "abcd1234");
    const bad = JSON.parse((await post({ pane: "x", previewMode: "y", dblclick: "z", sort: "'; DROP TABLE mk_media; --", colSmart: "oui" })).text).prefs;
    assert.equal(bad.pane, "apercu"); assert.equal(bad.previewMode, "fenetre"); assert.equal(bad.dblclick, "infos"); assert.equal(bad.sort, "dims", "valeurs invalides ignorées, rien d'écrit");
    await post({ columns: ["type", "size", "dims", "modified"], colWidths: {}, colSmart: true, pane: "infos", previewMode: "panneau", dblclick: "plein-ecran", infoWidth: 340, sort: "recent", colByType: {}, colConfigs: [], colDefault: "" });
  });

  test("tri : chaque colonne compatible trie dans les deux sens, l'indicateur suit, et le tri est conservé à la réouverture", async () => {
    await open("?vue=liste"); await page.click('[data-mx-view="liste"]'); await flush();
    await open();
    await page.click('.mx-colhead a[data-mx-sort="taille"]'); await page.waitForURL(/tri=taille(&|$)/); await waitIdle();
    assert.match(page.url(), /tri=taille(&|$)/); assert.equal(await page.locator('.mx-colhead a[data-mx-sort="taille"]').getAttribute("aria-sort"), "descending", "taille : plus volumineux d'abord");
    const order = () => page.evaluate(() => [...document.querySelectorAll("[data-ml-item]")].map((e) => Number(e.dataset.size)));
    let sizes = await order(); assert.deepEqual(sizes, [...sizes].sort((a, b) => b - a));
    await page.click('.mx-colhead a[data-mx-sort="taille"]'); await page.waitForURL(/tri=taille_asc/); await waitIdle();
    assert.match(page.url(), /tri=taille_asc/); assert.equal(await page.locator('.mx-colhead a[data-mx-sort^="taille"]').getAttribute("aria-sort"), "ascending");
    sizes = await order(); assert.deepEqual(sizes, [...sizes].sort((a, b) => a - b));
    assert.match(await page.locator(".mx-colhead a[aria-sort] .mx-sortmark").evaluate((n) => getComputedStyle(n).display), /block/, "indicateur visible sur la colonne triée");
    assert.equal(await page.locator(".mx-colhead a[aria-sort]").count(), 1, "un seul indicateur");
    // Réouverture SANS paramètre : le tri enregistré s'applique
    await open("?vue=liste");
    sizes = await order(); assert.deepEqual(sizes, [...sizes].sort((a, b) => a - b), "tri conservé");
    // Les autres colonnes triables
    for (const [key, qs] of [["nom", "tri=nom"], ["type", "tri=type"], ["modifie", "tri=modifie"]]) { await page.click(`.mx-colhead a[data-mx-sort="${key}"]`); await page.waitForURL(new RegExp(qs));  await waitIdle(); assert.match(page.url(), new RegExp(qs)); }
    for (const tri of ["dims", "dims_asc", "ext", "ext_desc", "format", "format_desc", "type_desc", "modifie_asc", "ancien"]) { const r = await env.boss.get(`${L}/liste.json?site=${S}&tri=${tri}`); assert.equal(r.status, 200, tri); }
    const byDims = JSON.parse((await env.boss.get(`${L}/liste.json?site=${S}&type=image&tri=dims`)).text).items.map((m) => m.id);
    assert.deepEqual(byDims, [M.i3, M.i2, M.i1], "tri par dimensions (surface), plus grand d'abord");
    const byExt = JSON.parse((await env.boss.get(`${L}/liste.json?site=${S}&tri=ext`)).text).items.map((m) => m.path.split(".").pop());
    assert.deepEqual(byExt, [...byExt].sort(), "tri par extension");
    await page.evaluate(() => { window.MX.savePrefs({ sort: "recent" }); return window.MX.flushPrefs(); });
  });

  test("colonnes : ajouter, masquer, réorganiser (boutons et glisser-déposer des titres), tout est conservé après rechargement", async () => {
    await open("?vue=liste");
    assert.deepEqual(await heads(), ["type", "size", "dims", "modified"], "disposition d'origine");
    await page.click("[data-mx-cols] summary"); await page.waitForSelector("[data-mx-colpanel] .mx-colrow");
    // Ajouter Format, Extension, Résolution, Durée, Statut ; masquer Type
    for (const k of ["format", "ext", "resolution", "duration", "status"]) await page.locator(`[data-colrow="${k}"] input[type=checkbox]`).check();
    await page.locator('[data-colrow="type"] input[type=checkbox]').uncheck();
    assert.deepEqual(await heads(), ["size", "dims", "modified", "format", "ext", "resolution", "duration", "status"]);
    for (const k of ["type"]) assert.equal(await cell(M.i1, k).isHidden(), true, "colonne masquée = cellules masquées");
    // Monter « format » en première position avec les boutons (clavier)
    for (let i = 0; i < 3; i++) await page.locator('[data-colrow="format"] button[aria-label^="Monter"]').click();
    assert.equal((await heads())[0], "format");
    // Glisser-déposer d'un titre : « status » avant « size »
    await page.evaluate(() => { const dt = new DataTransfer(); const from = document.querySelector('.mx-colhead [data-col="status"]'), to = document.querySelector('.mx-colhead [data-col="size"]'); const r = to.getBoundingClientRect(); const ev = (t, el, x) => el.dispatchEvent(new DragEvent(t, { bubbles: true, cancelable: true, dataTransfer: dt, clientX: x, clientY: r.top + 5 })); ev("dragstart", from, 0); ev("dragover", to, r.left + 2); ev("drop", to, r.left + 2); ev("dragend", from, 0); });
    assert.equal((await heads()).indexOf("status") < (await heads()).indexOf("size"), true, "titre déplacé par glisser-déposer");
    const order = await heads(); await flush();
    assert.deepEqual((await prefs()).columns, order, "ordre enregistré côté serveur");
    await open("?vue=liste"); assert.deepEqual(await heads(), order, "ordre conservé après rechargement");
    // Valeurs réelles : jamais inventées
    assert.equal((await cell(M.i2, "format").innerText()).trim(), "PNG"); assert.equal((await cell(M.i2, "ext").innerText()).trim(), "PNG");
    assert.match(await cell(M.i2, "dims").innerText(), /^120 × 80 px$/); assert.match(await cell(M.i2, "resolution").innerText(), /kpx|Mpx/);
    assert.equal((await cell(M.i2, "duration").innerText()).trim(), "—", "une image n'a pas de durée : « — », rien d'inventé");
    assert.equal((await cell(M.i2, "status").innerText()).trim(), "Prêt");
    if (M.v) { await page.locator(`[data-ml-item][data-id="${M.v}"]`).scrollIntoViewIfNeeded(); await page.waitForFunction((id) => /^0:0[12]$/.test(document.querySelector(`[data-ml-item][data-id="${id}"] .mx-c-duration`).textContent.trim()), M.v); assert.match((await cell(M.v, "duration").innerText()).trim(), /^0:0[12]$/, "durée lue dans la vidéo"); await page.waitForFunction((id) => /160 × 90 px/.test(document.querySelector(`[data-ml-item][data-id="${id}"] .mx-c-dims`).textContent), M.v); }
    await page.waitForFunction((id) => /^0:0[12]$/.test(document.querySelector(`[data-ml-item][data-id="${id}"] .mx-c-duration`).textContent.trim()), M.a);
    // Réinitialiser
    await page.click("[data-mx-cols] summary"); await page.click("[data-mx-colreset]");
    assert.deepEqual(await heads(), ["type", "size", "dims", "modified"], "réinitialisée");
  });

  test("largeur : tirer le bord d'un titre, flèches du clavier, double-clic pour revenir ; conservé ; liste qui défile sans casser la page", async () => {
    await open("?vue=liste");
    const w = () => page.evaluate(() => Math.round(document.querySelector('.mx-colhead [data-col="size"]').getBoundingClientRect().width));
    const before0 = await w(); const box = await page.locator('.mx-colhead [data-col="size"] .mx-rs').boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await page.mouse.down(); await page.mouse.move(box.x + 60, box.y + 6, { steps: 6 }); await page.mouse.up();
    const after = await w(); assert.ok(after >= before0 + 40, `élargie (${before0} → ${after})`);
    assert.equal(await page.evaluate(() => Math.round(document.querySelector('[data-ml-item] .mx-c-size').getBoundingClientRect().width)), after, "les cellules suivent le titre");
    await flush(); assert.equal((await prefs()).colWidths.size, after, "largeur enregistrée");
    await page.locator('.mx-colhead [data-col="size"] .mx-rs').focus(); await page.keyboard.press("ArrowLeft"); await page.keyboard.press("ArrowLeft"); assert.equal(await w(), after - 20, "flèches : 10 px par pression");
    await page.locator('.mx-colhead [data-col="size"] .mx-rs').dblclick(); assert.equal(await w(), before0, "double-clic : largeur d'origine");
    await page.evaluate(() => window.MXColumns.setWidth("tags", 480)); await page.evaluate(() => window.MXColumns.setWidth("size", 480));
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth <= 1), true, "la page ne défile pas horizontalement");
    await page.evaluate(() => window.MX.cfg() && window.MXColumns.reset());
  });

  test("configurations : enregistrer, appliquer, mettre à jour, renommer, définir par défaut, réinitialiser vers elle, supprimer", async () => {
    await open("?vue=liste");
    await page.click("[data-mx-cols] summary"); await page.waitForSelector("[data-mx-colpanel] .mx-colrow");
    await page.locator('[data-colrow="format"] input').check(); await page.locator('[data-colrow="ext"] input').check();
    await page.getByRole("button", { name: "Enregistrer sous…" }).click(); await page.fill("#mx-ask", "Fichiers web"); await page.click('dialog button[type=submit]');
    await page.waitForFunction(() => [...document.querySelectorAll("[data-mx-cfg] option")].some((o) => o.textContent === "Fichiers web"));
    const saved = await heads();
    await page.locator('[data-colrow="format"] input').uncheck(); assert.notDeepEqual(await heads(), saved);
    await page.selectOption("[data-mx-cfg]", { label: "Fichiers web" }); assert.deepEqual(await heads(), saved, "configuration appliquée");
    await page.getByRole("button", { name: "Par défaut" }).click(); await flush();
    const p = await prefs(); assert.equal(p.colConfigs.length, 1); assert.equal(p.colDefault, p.colConfigs[0].id);
    await page.locator('[data-colrow="ext"] input').uncheck(); await page.click("[data-mx-colreset]");
    assert.deepEqual(await heads(), saved, "« Réinitialiser » revient à la configuration par défaut");
    await page.selectOption("[data-mx-cfg]", { index: 1 }); await page.getByRole("button", { name: "Renommer" }).click(); await page.fill("#mx-ask", "Web"); await page.click('dialog button[type=submit]');
    await page.waitForFunction(() => [...document.querySelectorAll("[data-mx-cfg] option")].some((o) => /Web$/.test(o.textContent)));
    await flush(); await open("?vue=liste"); assert.equal((await prefs()).colConfigs[0].name, "Web", "renommée et conservée");
    await page.click("[data-mx-cols] summary"); await page.waitForSelector("[data-mx-colpanel] .mx-colrow");
    await page.selectOption("[data-mx-cfg]", { index: 1 }); await page.getByRole("button", { name: "Supprimer" }).click(); await page.click('dialog button[type=submit]');
    await page.waitForFunction(() => document.querySelectorAll("[data-mx-cfg] option").length === 1);
    await flush(); const q = await prefs(); assert.equal(q.colConfigs.length, 0); assert.equal(q.colDefault, "");
    await page.click("[data-mx-colreset]");
  });

  test("affichage intelligent : chaque catégorie propose les colonnes qui ont un sens pour elle", async () => {
    await open("?vue=liste&type=image"); assert.deepEqual(await heads(), ["format", "size", "dims", "resolution", "modified"], "images : format, taille, dimensions, résolution");
    if (M.v) { await open("?vue=liste&type=video"); assert.deepEqual(await heads(), ["format", "size", "dims", "duration", "modified"], "vidéos : durée, dimensions"); }
    await open("?vue=liste&type=audio"); assert.deepEqual(await heads(), ["format", "size", "duration", "modified"], "audio : durée, format, taille");
    await open("?vue=liste&type=documents"); assert.deepEqual(await heads(), ["format", "size", "modified"], "documents : format, taille, modification");
    // Modifier une catégorie ne touche pas aux autres
    await page.click("[data-mx-cols] summary"); await page.waitForSelector("[data-mx-colpanel] .mx-colrow"); await page.locator('[data-colrow="author"] input').check();
    assert.deepEqual(await heads(), ["format", "size", "modified", "author"]); await flush();
    await open("?vue=liste&type=audio"); assert.deepEqual(await heads(), ["format", "size", "duration", "modified"]);
    await open("?vue=liste&type=documents"); assert.deepEqual(await heads(), ["format", "size", "modified", "author"], "disposition de la catégorie conservée");
    await page.click("[data-mx-cols] summary"); await page.waitForSelector("[data-mx-colpanel] .mx-colrow"); await page.click("[data-mx-colreset]"); assert.deepEqual(await heads(), ["format", "size", "modified"]);
    // Désactiver l'adaptation : la disposition générale s'applique partout
    await page.locator("[data-mx-smart]").uncheck(); assert.deepEqual(await heads(), ["type", "size", "dims", "modified"]); await page.locator("[data-mx-smart]").check();
    await flush();
  });

  test("aperçu rapide : Espace ouvre le panneau, il suit la sélection (flèches, boutons), zoom, rotation, fermeture", async () => {
    await open("?vue=grille&type=image");
    await item(M.i3).click(); await page.keyboard.press("Space");
    await page.waitForFunction(() => document.querySelector("[data-mx]").getAttribute("data-pane") === "apercu" && document.querySelector("[data-mx-ql] .mx-pv-img"));
    assert.equal(await quickOpen(), true);
    const name = () => page.locator(".mx-ql-name").innerText();
    assert.equal(await name(), "charlie.png"); assert.equal(await page.locator(".mx-ql-count").innerText(), "1 / 3");
    for (const k of ["Type", "Taille", "Dimensions", "Ajouté le", "Modifié le", "Dossier", "Étiquettes"]) assert.ok(await page.locator(".mx-ql-dl dt", { hasText: k }).count(), `fiche : ${k}`);
    assert.match(await page.locator(".mx-ql-dl").innerText(), /200 × 150 px/);
    // Image moyenne seulement tant qu'on ne zoome pas
    const src = () => page.locator(".mx-ql-stage .mx-pv-img").getAttribute("src");
    const original = await page.evaluate((id) => document.querySelector(`[data-ml-item][data-id="${id}"]`).dataset.path, M.i3);
    const med = await page.evaluate((id) => document.querySelector(`[data-ml-item][data-id="${id}"]`).dataset.medium, M.i3);
    assert.equal(await src(), med || original, "aperçu : version moyenne");
    await page.click('[data-ql="z+"]'); await page.click('[data-ql="z+"]'); await page.waitForFunction((o) => document.querySelector(".mx-ql-stage .mx-pv-img").getAttribute("src") === o, original);
    await page.click('[data-ql="rot"]'); assert.match(await page.locator(".mx-ql-stage .mx-pv-img").getAttribute("style"), /rotate\(90deg\)/);
    // Passer au fichier suivant SANS fermer
    await page.click('[data-ql="next"]'); await page.waitForFunction(() => document.querySelector(".mx-ql-name").textContent === "bravo.png"); assert.equal(await quickOpen(), true);
    await item(M.i2).click(); await page.keyboard.press("ArrowLeft"); await page.waitForFunction(() => document.querySelector(".mx-ql-name").textContent === "charlie.png"); assert.equal(await quickOpen(), true, "flèches : le panneau reste ouvert et suit");
    await page.click('[data-ql="next"]'); await page.waitForFunction(() => document.querySelector(".mx-ql-name").textContent === "bravo.png");
    // Largeur du panneau
    const rz = await page.locator("[data-mx-resizer]").boundingBox(); await page.mouse.move(rz.x + 3, rz.y + 200); await page.mouse.down(); await page.mouse.move(rz.x - 160, rz.y + 200, { steps: 6 }); await page.mouse.up();
    const infoW = await page.evaluate(() => Math.round(document.querySelector("[data-mx-info]")?.getBoundingClientRect().width || document.querySelector(".mx-info").getBoundingClientRect().width)); assert.ok(infoW > 440, `panneau élargi (${infoW})`);
    await item(M.i2).locator(".mx-thumb").focus(); // Espace sur un bouton du panneau l'actionne : on revient sur le fichier
    await page.keyboard.press("Space"); await page.waitForFunction(() => document.querySelector("[data-mx]").getAttribute("data-info") === "closed"); assert.equal(await page.locator("[data-mx-ql]").count(), 0, "fermé : visionneuse détruite");
  });

  test("aperçu rapide : vidéo, audio, PDF et format sans aperçu ; les lecteurs sont arrêtés et vidés à la fermeture", async () => {
    await open("?vue=grille");
    const openOne = async (id) => { await item(id).click(); await page.evaluate(() => { const m = window.MX; if (m.prefs().info !== "open" || m.prefs().pane !== "apercu") m.quick.toggle(); }); await page.waitForSelector("[data-mx-ql] [data-ql-stage]:not([hidden])"); };
    await openOne(M.a); await page.waitForSelector(".mx-ql-stage audio");
    assert.equal(await page.locator(".mx-ql-stage audio").getAttribute("preload"), "metadata", "audio : métadonnées seulement");
    await page.waitForFunction(() => /Durée/.test(document.querySelector(".mx-ql-dl").textContent)); assert.match(await page.locator(".mx-ql-dl").innerText(), /Durée\s*0:0[12]/);
    await page.evaluate(() => document.querySelector(".mx-ql-stage audio").play().catch(() => {}));
    if (M.v) {
      await item(M.v).click(); await page.waitForSelector(".mx-ql-stage video"); assert.equal(await page.locator(".mx-ql-stage video").getAttribute("preload"), "metadata");
      await page.waitForFunction(() => /Durée/.test(document.querySelector(".mx-ql-dl").textContent) && /160 × 90 px/.test(document.querySelector(".mx-ql-dl").textContent));
      assert.equal(await page.evaluate(() => document.querySelectorAll(".mx-ql-stage audio").length), 0, "l'ancien lecteur est retiré");
      assert.equal(await page.locator(".mx-ql-stage video").getAttribute("controls") !== null, true, "lecture, progression, durée, volume : commandes natives");
      await page.evaluate(() => { window.__v = document.querySelector(".mx-ql-stage video"); return window.__v.play().catch(() => {}); });
    }
    await item(M.p).click(); await page.waitForSelector(".mx-ql-stage iframe.mx-pv-pdf"); assert.match(await page.locator(".mx-ql-stage iframe").getAttribute("src"), /\.pdf#toolbar=1/);
    if (M.v) assert.equal(await page.evaluate(() => window.__v.getAttribute("src") === null && window.__v.paused), true, "vidéo arrêtée et source vidée au changement de fichier");
    await page.keyboard.press("Space"); await page.waitForFunction(() => document.querySelector("[data-mx]").getAttribute("data-info") === "closed");
    assert.equal(await page.evaluate(() => document.querySelectorAll("video, audio, .mx-ql iframe").length), 0, "plus aucun lecteur ni PDF après fermeture");
  });

  test("aperçu rapide : bouton de la barre d'outils, menu contextuel, Alt+P ; double-clic selon le réglage ; mode fenêtre ; retour au panneau", async () => {
    await open("?vue=grille&type=image");
    await item(M.i1).click(); await page.click("[data-mx-quick-toggle]"); await page.waitForFunction(() => document.querySelector("[data-mx-ql]")); assert.equal(await page.locator("[data-mx-quick-toggle]").getAttribute("aria-pressed"), "true");
    await page.click("[data-mx-quick-toggle]"); await page.waitForFunction(() => document.querySelector("[data-mx]").getAttribute("data-info") === "closed");
    await item(M.i2).click({ button: "right" }); await page.getByRole("menuitem", { name: /Aperçu rapide/ }).click(); await page.waitForFunction(() => document.querySelector(".mx-ql-name") && document.querySelector(".mx-ql-name").textContent === "bravo.png");
    await page.keyboard.press("Alt+KeyP"); await page.waitForFunction(() => document.querySelector("[data-mx]").getAttribute("data-info") === "closed");
    // Double-clic : fenêtre plein écran par défaut
    await item(M.i3).dblclick(); await page.waitForSelector("#mx-preview:not([hidden])"); assert.equal(await page.locator("[data-pv-name]").innerText(), "charlie.png");
    await page.keyboard.press("Escape");
    // Réglage : double-clic = panneau d'aperçu
    await page.evaluate(() => { window.MX.savePrefs({ dblclick: "panneau" }); }); await item(M.i3).dblclick(); await page.waitForFunction(() => document.querySelector(".mx-ql-name")?.textContent === "charlie.png");
    // Mode fenêtre pour l'aperçu rapide (Espace)
    await page.evaluate(() => { window.MX.savePrefs({ previewMode: "fenetre" }); }); await page.click("[data-mx-info-close]"); await page.waitForFunction(() => document.querySelector("[data-mx]").getAttribute("data-info") === "closed");
    await item(M.i2).click(); await page.keyboard.press("Space"); await page.waitForSelector("#mx-preview:not([hidden])"); assert.equal(await page.locator("[data-pv-name]").innerText(), "bravo.png");
    await page.keyboard.press("ArrowRight"); await page.waitForFunction(() => document.querySelector("[data-pv-name]").textContent !== "bravo.png");
    await page.evaluate(() => [...document.querySelectorAll("#mx-preview .mx-pv-actions button")].find((x) => /Dans le panneau/.test(x.textContent)).click()); await page.waitForFunction(() => document.querySelector("#mx-preview").hidden && document.querySelector("[data-mx-ql]"));
    assert.equal(await page.evaluate(() => document.querySelectorAll("#mx-preview video, #mx-preview audio, #mx-preview img").length), 0, "fenêtre fermée : rien n'y reste chargé");
    await page.evaluate(() => { window.MX.savePrefs({ previewMode: "panneau", dblclick: "plein-ecran" }); return window.MX.flushPrefs(); });
  });

  test("aucune erreur de script ; pas de débordement horizontal avec le panneau ouvert (ordinateur et téléphone)", async () => {
    await open("?vue=liste"); await item(M.i1).click(); await page.keyboard.press("Space"); await page.waitForSelector("[data-mx-ql]");
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth <= 1), true);
    try {
      await page.setViewportSize({ width: 390, height: 800 }); await open("?vue=liste");
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth <= 1), true, "téléphone : pas de défilement horizontal de la page");
      assert.equal(await page.locator("[data-mx-cols]").isVisible(), true);
    } finally { await page.setViewportSize({ width: 1440, height: 900 }); }
    assert.deepEqual(errors, []);
  });
});
