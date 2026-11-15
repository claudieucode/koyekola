// Médiathèque : glisser-déposer professionnel (VRAI Chrome) : déplacer (fichiers, plusieurs, dossiers), réordonner (ordre personnalisé enregistré),
// conflits de noms, interdits (cycle), retour visuel (carte avec compteur, trait d'insertion), Annuler / Rétablir. Ignoré si Playwright / Chrome sont absents.
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

describe("médiathèque : glisser-déposer dans Chrome", { skip: SKIP }, () => {
  let env, context, page, S, L, errors = [];
  const F = {}, M = {};
  const one = (sql, ...a) => env.db.prepare(sql).get(...a);
  const api = (url, json) => env.boss.request(`${L}${url}?site=${S}`, { method: "POST", json });
  const upload = async (buffer, name, extra = {}) => { const fd = new FormData(); fd.append("file", new Blob([buffer], { type: "image/png" }), name); for (const [k, v] of Object.entries(extra)) fd.append(k, String(v)); const r = await env.boss.request(`${L}/televerser?site=${S}`, { method: "POST", multipart: fd }); assert.equal(r.status, 201, r.text); return JSON.parse(r.text).media; };
  const folderOf = (id) => one("SELECT folder_id f FROM mk_media WHERE id = ?", id).f;
  const nameOf = (id) => one("SELECT name n FROM mk_media WHERE id = ?", id).n;
  const url = (q = "") => `${env.srv.base}/marketing/site-web/sites/${S}/medias${q}`;
  const open = async (q = "") => { await page.goto(url(q)); await page.waitForSelector("[data-mx]"); await page.waitForTimeout(250); };
  const item = (id) => page.locator(`[data-ml-item][data-id="${id}"]`);
  const domOrder = () => page.$$eval("[data-ml-item]", (els) => els.map((e) => Number(e.getAttribute("data-id"))));
  const dbOrder = (folder) => env.db.prepare("SELECT id FROM mk_media WHERE folder_id IS ? AND deleted_at IS NULL ORDER BY sort_order IS NULL, sort_order, id DESC").all(folder).map((r) => r.id);
  const say = () => page.evaluate(() => [...document.querySelectorAll(".mx-undobar-text, [class*=toast]")].map((e) => e.textContent.trim()).join(" | "));
  const sidebarFolders = () => page.$$eval(".mx-tree-row[data-mx-folder]", (els) => els.map((e) => Number(e.getAttribute("data-mx-folder"))));

  before(async () => {
    env = await setup({ siteName: "Site glisser-déposer" }); S = env.site; L = "/marketing/site-web/mediatheque";
    context = await env.browser.newContext({ viewport: { width: 1440, height: 900 } });
    await context.addCookies([...env.boss.cookies].map(([name, value]) => ({ name, value, url: env.srv.base })));
    context.setDefaultTimeout(15000);
    const mk = async (name, parent) => JSON.parse((await api("/dossiers", parent ? { name, parent_id: parent } : { name })).text).folder.id;
    F.a = await mk("Photos"); F.b = await mk("Marque"); F.c = await mk("Logos", F.b); F.d = await mk("Archives");
    for (let i = 1; i <= 4; i++) M[i] = (await upload(png(40 + i, 30, [i * 30, 90, 160]), `photo-${i}.png`, { dossier: F.a })).id;
    for (let i = 5; i <= 7; i++) M[i] = (await upload(png(40 + i, 30, [i * 30, 90, 160]), `vrac-${i}.png`)).id;
    page = await context.newPage();
    page.on("pageerror", (e) => errors.push(e.message)); page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errors.push(m.text()); });
  });
  after(async () => { if (context) await context.close(); if (env) await env.close(); });

  test("aperçu pendant le glisser : carte avec miniatures et COMPTEUR, dossier cible mis en évidence, destination nommée, puis déplacement persisté de plusieurs fichiers", async () => {
    await open();
    await item(M[5]).locator(".mx-thumb").click(); await item(M[6]).locator(".mx-thumb").click({ modifiers: ["Meta"] });
    const src = await item(M[5]).locator(".mx-thumb").boundingBox(), dst = await page.locator(`.mx-tree-row[data-mx-folder="${F.d}"]`).boundingBox();
    await page.mouse.move(src.x + 20, src.y + 20); await page.mouse.down();
    await page.mouse.move(src.x + 60, src.y + 60, { steps: 4 });
    await page.mouse.move(dst.x + dst.width / 2, dst.y + dst.height / 2, { steps: 12 });
    await page.mouse.move(dst.x + dst.width / 2 + 2, dst.y + dst.height / 2 + 1, { steps: 3 }); await page.waitForTimeout(250);
    await page.waitForSelector(".mx-drag-ghost");
    assert.equal(await page.locator(".mx-ghost-count").textContent(), "2", "le compteur indique 2 éléments");
    assert.match(await page.locator(".mx-ghost-label").textContent(), /Déplacer 2 fichiers vers « Archives »/);
    assert.ok(await page.locator(`.mx-tree-row[data-mx-folder="${F.d}"].is-drop`).count(), "le dossier cible est mis en évidence");
    await page.mouse.up(); await page.waitForTimeout(700);
    assert.equal(folderOf(M[5]), F.d); assert.equal(folderOf(M[6]), F.d);
    assert.equal(await item(M[5]).getAttribute("data-folder"), String(F.d), "la carte est mise à jour sur place (vue « Tous les fichiers » : elle reste affichée)");
    assert.ok(await page.locator(".mx-undobar").count(), "la barre « Annuler » apparaît");
  });

  test("Annuler puis Rétablir (bouton et Ctrl+Z) remettent exactement l'état", async () => {
    await page.locator(".mx-undobar-btn", { hasText: "Annuler" }).click(); await page.waitForTimeout(900);
    assert.equal(folderOf(M[5]), null); assert.equal(folderOf(M[6]), null);
    assert.equal(await item(M[5]).count(), 1, "le fichier revient dans la vue");
    await page.locator("[data-mx-redo]").click(); await page.waitForTimeout(900);
    assert.equal(folderOf(M[5]), F.d);
    await page.keyboard.press("Control+z"); await page.waitForTimeout(900);
    assert.equal(folderOf(M[5]), null, "Ctrl+Z annule aussi");
  });

  test("réorganiser dans le dossier : ordre personnalisé enregistré, restauré après actualisation ; en tri automatique, on explique comment l'activer", async () => {
    await open(`?dossier=${F.a}`);
    const auto = await domOrder(), first = auto[0], last = auto.slice(-1)[0];
    await item(first).locator(".mx-thumb").dragTo(item(last), { targetPosition: { x: 4, y: 20 } }).catch(() => {}); await page.waitForTimeout(600);
    assert.deepEqual(await domOrder(), auto, "tri automatique : aucun changement d'ordre");
    assert.ok(await page.locator(".mx-undobar-btn", { hasText: "Activer l'ordre personnalisé" }).count(), "l'aide propose d'activer l'ordre personnalisé");
    await page.locator(".mx-undobar-btn", { hasText: "Activer l'ordre personnalisé" }).click(); await page.waitForSelector("#ml-tri"); await page.waitForTimeout(500);
    assert.equal(await page.locator("#ml-tri").inputValue(), "perso");
    const before = await domOrder(); assert.equal(before.length, 4);
    // premier élément déposé sur la moitié GAUCHE du dernier : il se place AVANT lui
    await item(before[0]).locator(".mx-thumb").dragTo(item(before[3]), { targetPosition: { x: 4, y: 20 } }); await page.waitForTimeout(800);
    const after1 = await domOrder(); assert.deepEqual(after1, [before[1], before[2], before[0], before[3]], `message : ${await say()} ; base : ${dbOrder(F.a)}`);
    assert.deepEqual(dbOrder(F.a), after1, "l'ordre est enregistré en base");
    await page.reload(); await page.waitForSelector("[data-mx-items]"); await page.waitForTimeout(300);
    assert.deepEqual(await domOrder(), after1, "restauré après actualisation");
    // Annuler (l'historique vit pendant la session : on refait un geste après l'actualisation)
    const now = await domOrder();
    await item(now[0]).locator(".mx-thumb").dragTo(item(now[3]), { targetPosition: { x: 4, y: 20 } }); await page.waitForTimeout(800);
    assert.notDeepEqual(await domOrder(), now);
    await page.locator("[data-mx-undo]").click(); await page.waitForTimeout(900);
    assert.deepEqual(await domOrder(), now);
  });

  test("conflit de noms : fenêtre à trois choix ; « Conserver les deux » renomme, rien n'est écrasé ; « Annuler l'opération » ne change rien", async () => {
    const twin = (await upload(png(60, 30, [7, 8, 9]), "photo-1.png")).id;   // même nom qu'un fichier du dossier Photos
    await open();
    await item(twin).locator(".mx-thumb").dragTo(page.locator(`.mx-tree-row[data-mx-folder="${F.a}"]`)); await page.waitForSelector("dialog[open] .mx-conflict");
    const texts = await page.locator("dialog[open] .mx-conflict-opt strong").allTextContents();
    assert.deepEqual(texts, ["Conserver les deux", "Remplacer", "Ignorer"]);
    await page.locator("dialog[open] button", { hasText: "Annuler l'opération" }).click(); await page.waitForTimeout(400);
    assert.equal(folderOf(twin), null, "annulé : rien n'a bougé");
    await item(twin).locator(".mx-thumb").dragTo(page.locator(`.mx-tree-row[data-mx-folder="${F.a}"]`)); await page.waitForSelector("dialog[open] .mx-conflict");
    await page.locator("dialog[open] .mx-conflict-opt", { hasText: "Conserver les deux" }).click(); await page.waitForTimeout(800);
    assert.equal(folderOf(twin), F.a); assert.equal(nameOf(twin), "photo-1 (2).png"); assert.equal(nameOf(M[1]), "photo-1.png");
  });

  test("dossiers : réordonner dans la barre latérale (bord haut/bas), déplacer dans un autre dossier, interdit dans soi-même ou un descendant", async () => {
    await open();
    const order0 = await sidebarFolders(); assert.ok(order0.length >= 4);
    const rowOf = (id) => page.locator(`.mx-tree-row[data-mx-folder="${id}"]`);
    // « Archives » déposée sur le bord HAUT de « Photos » : elle passe avant
    await rowOf(F.d).dragTo(rowOf(F.a), { targetPosition: { x: 40, y: 3 } }); await page.waitForTimeout(900);
    const order1 = (await sidebarFolders()).filter((id) => [F.a, F.d].includes(id)); assert.deepEqual(order1, [F.d, F.a]);
    assert.ok(one("SELECT sort_order o FROM mk_media_folders WHERE id = ?", F.d).o < one("SELECT sort_order o FROM mk_media_folders WHERE id = ?", F.a).o, "ordre enregistré");
    // Au milieu d'une ligne : DANS le dossier
    await rowOf(F.d).dragTo(rowOf(F.b)); await page.waitForTimeout(900);
    assert.equal(one("SELECT parent_id p FROM mk_media_folders WHERE id = ?", F.d).p, F.b, `la hiérarchie change réellement en base (message : ${await say()})`);
    await page.keyboard.press("Control+z"); await page.waitForTimeout(900);
    assert.equal(one("SELECT parent_id p FROM mk_media_folders WHERE id = ?", F.d).p, null, "annulé");
    // Interdit : « Marque » dans son sous-dossier « Logos »
    await rowOf(F.b).dragTo(rowOf(F.c)).catch(() => {}); await page.waitForTimeout(600);
    assert.equal(one("SELECT parent_id p FROM mk_media_folders WHERE id = ?", F.b).p, null, "un dossier ne peut pas entrer dans son sous-dossier");
  });

  test("depuis la barre latérale vers la zone principale : un dossier glissé sur le contenu entre dans le dossier affiché", async () => {
    await open(`?dossier=${F.b}`);
    await page.locator(`.mx-tree-row[data-mx-folder="${F.d}"]`).dragTo(page.locator("[data-mx-main] .mx-scroll"), { targetPosition: { x: 300, y: 300 } }); await page.waitForTimeout(1000);
    assert.equal(one("SELECT parent_id p FROM mk_media_folders WHERE id = ?", F.d).p, F.b);
  });

  test("aucune erreur de script pendant tout le parcours", () => { assert.deepEqual(errors, []); });
});
