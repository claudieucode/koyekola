// Médiathèque = gestionnaire de fichiers (lot 2, VRAI Chrome) : navigation fluide sans rechargement, préférences mémorisées, sélection, déplacement (glisser-déposer et menu),
// menus contextuels, favoris, tags, prévisualisation, recherche, corbeille, importation (conflits de noms, dossier entier), doublons. Ignoré si Playwright / Chrome sont absents.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const zlib = require("node:zlib");
const fs = require("fs");
const os = require("os");
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

describe("médiathèque : gestionnaire de fichiers dans Chrome", { skip: SKIP }, () => {
  let env, context, page, S, L, errors = [];
  const F = {}, M = {};
  const one = (sql, ...a) => env.db.prepare(sql).get(...a);
  const api = (url, json) => env.boss.request(`${L}${url}?site=${S}`, { method: "POST", json });
  const upload = async (buffer, name, extra = {}) => { const fd = new FormData(); fd.append("file", new Blob([buffer], { type: "image/png" }), name); for (const [k, v] of Object.entries(extra)) fd.append(k, String(v)); const r = await env.boss.request(`${L}/televerser?site=${S}`, { method: "POST", multipart: fd }); assert.equal(r.status, 201, r.text); return JSON.parse(r.text).media; };
  const folderOf = (id) => one("SELECT folder_id f FROM mk_media WHERE id = ?", id).f;
  const url = (q = "") => `${env.srv.base}/marketing/site-web/sites/${S}/medias${q}`;
  const open = async (q = "") => { await page.goto(url(q)); await page.waitForSelector("[data-mx]"); await page.waitForTimeout(250); };
  const item = (id) => page.locator(`[data-ml-item][data-id="${id}"]`);
  const waitIdle = () => page.waitForFunction(() => !document.querySelector("[data-mx]").hasAttribute("aria-busy"));

  before(async () => {
    env = await setup({ siteName: "Site gestionnaire" }); S = env.site; L = "/marketing/site-web/mediatheque";
    context = await env.browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });
    await context.addCookies([...env.boss.cookies].map(([name, value]) => ({ name, value, url: env.srv.base })));
    context.setDefaultTimeout(15000);
    F.a = JSON.parse((await api("/dossiers", { name: "Photos" })).text).folder.id; F.b = JSON.parse((await api("/dossiers", { name: "Marque" })).text).folder.id; F.c = JSON.parse((await api("/dossiers", { name: "Logos", parent_id: F.b })).text).folder.id;
    for (let i = 1; i <= 6; i++) M[i] = (await upload(png(40 + i, 30, [i * 30, 90, 160]), `image-${i}.png`, i <= 3 ? { dossier: F.a } : {})).id;
    page = await context.newPage();
    page.on("pageerror", (e) => errors.push(e.message)); page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errors.push(m.text()); });
  });
  after(async () => { if (context) await context.close(); if (env) await env.close(); });

  test("la page s'ouvre en trois zones, sans erreur de script ni débordement horizontal (ordinateur puis téléphone)", async () => {
    await open();
    for (const sel of ["[data-mx-side]", "[data-mx-head]", "[data-mx-scroll]", "[data-mx-items]"]) assert.ok(await page.locator(sel).count() > 0 || sel === "[data-mx-head]", sel);
    assert.equal(await page.locator("[data-ml-item]").count(), 6);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth <= 1), true, "pas de défilement horizontal (ordinateur)");
    try {
      await page.setViewportSize({ width: 390, height: 800 }); await open();
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth <= 1), true, "pas de défilement horizontal (téléphone)");
      assert.equal(await page.locator("[data-mx-side]").isVisible(), false, "barre latérale en tiroir sur téléphone");
      await page.click("[data-mx-side-toggle]"); await page.waitForTimeout(350);
      assert.equal(await page.locator("[data-mx-side]").isVisible(), true, "le tiroir s'ouvre");
      } finally { await page.setViewportSize({ width: 1440, height: 900 }); }
    await open();
  });

  test("navigation fluide : un clic sur un dossier change le contenu et l'adresse SANS recharger la page ; Précédent revient", async () => {
    await open();
    await page.evaluate(() => { window.__marqueur = "reste"; });
    await page.click(`.mx-tree-link[href*="dossier=${F.a}"]`); await waitIdle();
    await page.waitForFunction((n) => document.querySelectorAll("[data-ml-item]").length === n, 3);
    assert.match(page.url(), new RegExp(`dossier=${F.a}`)); assert.equal(await page.evaluate(() => window.__marqueur), "reste", "pas de rechargement");
    assert.match(await page.locator(".mx-crumb").innerText(), /Photos/);
    await page.goBack(); await page.waitForFunction(() => document.querySelectorAll("[data-ml-item]").length === 6);
    assert.equal(await page.evaluate(() => window.__marqueur), "reste");
  });

  test("modes d'affichage, taille et colonnes : mémorisés par personne et par site (survivent au rechargement)", async () => {
    await open();
    for (const v of ["liste", "details", "icones", "compacte", "grille"]) { await page.click(`[data-mx-view="${v}"]`); assert.equal(await page.locator("[data-mx]").getAttribute("data-view"), v); }
    await page.click('[data-mx-view="liste"]'); await page.waitForTimeout(600);
    await page.locator("[data-mx-cols] summary").click(); await page.locator('[data-mx-col][value="author"]').check(); await page.waitForTimeout(500);
    await page.locator("[data-mx-size]").evaluate((el) => { el.value = "230"; el.dispatchEvent(new Event("input", { bubbles: true })); }); await page.waitForTimeout(700);
    await page.reload(); await page.waitForSelector("[data-mx]");
    assert.equal(await page.locator("[data-mx]").getAttribute("data-view"), "liste"); assert.equal(await page.locator("[data-mx-items]").getAttribute("data-view"), "liste");
    assert.match(await page.locator("[data-mx]").getAttribute("class"), /has-c-author/); assert.match(await page.locator("[data-mx]").getAttribute("style"), /--mx-size:\s*230px/);
    assert.ok(await page.locator("[data-ml-list]").count(), "balise de liste");
    await page.click('[data-mx-view="grille"]'); await page.waitForTimeout(600);
  });

  test("sélection : clic, Maj+clic (plage), Cmd+clic ; barre d'actions avec le nombre et le poids ; Échap désélectionne", async () => {
    await open();
    await item(M[2]).locator(".mx-thumb").click(); assert.match(await item(M[2]).getAttribute("class"), /is-selected/);
    await item(M[4]).locator(".mx-thumb").click({ modifiers: ["Shift"] });
    await page.waitForFunction(() => document.querySelectorAll("[data-ml-item].is-selected").length === 3);
    assert.match(await page.locator("[data-ml-bulk-count]").innerText(), /3 fichiers sélectionnés/);
    await item(M[6]).locator(".mx-thumb").click({ modifiers: ["Meta"] }); await page.waitForFunction(() => document.querySelectorAll("[data-ml-item].is-selected").length === 4);
    await page.keyboard.press("Escape"); await page.waitForFunction(() => document.querySelectorAll("[data-ml-item].is-selected").length === 0);
    assert.equal(await page.locator("[data-mx-bulk]").isHidden(), true);
  });

  test("déplacer : glisser-déposer d'un fichier sur un dossier (persisté) ; un dossier ne peut pas entrer dans son sous-dossier ; déplacement par fenêtre pour plusieurs fichiers", async () => {
    await open();
    await page.dragAndDrop(`[data-ml-item][data-id="${M[5]}"] .mx-thumb`, `.mx-tree-row[data-mx-folder="${F.a}"]`);
    await page.waitForFunction((id) => !!document.querySelector(`[data-ml-item][data-id="${id}"]`), M[5]); await page.waitForTimeout(500);
    assert.equal(folderOf(M[5]), F.a, "le fichier est réellement dans le dossier (base de données)");
    // Interdit : « Marque » dans son sous-dossier « Logos » (aucun changement)
    await open("?section=dossiers");
    await page.dragAndDrop(`.mx-folders .mx-folder[data-mx-folder="${F.b}"]`, `.mx-tree-row[data-mx-folder="${F.c}"]`).catch(() => {}); await page.waitForTimeout(500);
    assert.equal(one("SELECT parent_id p FROM mk_media_folders WHERE id = ?", F.b).p, null, "un dossier ne peut pas entrer dans son sous-dossier");
    // Plusieurs fichiers : Maj+clic puis « Déplacer »
    await open(); await item(M[4]).locator(".mx-thumb").click(); await item(M[6]).locator(".mx-thumb").click({ modifiers: ["Meta"] });
    await page.locator("[data-mx-bulk-actions] button", { hasText: "Déplacer" }).click();
    await page.locator("dialog[open] label.mx-pick-row", { hasText: "Marque" }).first().click(); await page.locator("dialog[open] button[type=submit]").click(); await page.waitForTimeout(700);
    assert.equal(folderOf(M[4]), F.b); assert.equal(folderOf(M[6]), F.b);
  });

  test("menu contextuel (clic droit) : Renommer, Dupliquer, Copier le lien ; fenêtres centrées", async () => {
    await open();
    await item(M[1]).click({ button: "right" });
    const menu = page.locator(".mx-menu"); await menu.waitFor();
    const names = await menu.locator("button").allInnerTexts();
    for (const n of ["Aperçu", "Télécharger", "Copier le lien", "Renommer", "Dupliquer", "Déplacer vers…", "Mettre à la corbeille"]) assert.ok(names.some((t) => t.includes(n)), `entrée « ${n} »`);
    assert.ok((await menu.evaluate((m) => getComputedStyle(m).backgroundColor)) !== "rgba(0, 0, 0, 0)", "le menu a un fond opaque");
    await menu.locator("button", { hasText: "Renommer" }).click();
    const dlg = page.locator("dialog[open]"); await dlg.waitFor();
    const box = await dlg.evaluate((d) => { const b = d.getBoundingClientRect(); return { l: Math.round(b.left), r: Math.round(innerWidth - b.right) }; });
    assert.ok(Math.abs(box.l - box.r) <= 2, `fenêtre centrée (${box.l} / ${box.r})`);
    await dlg.locator("input[type=text]").fill("renomme.png"); await dlg.locator("button[type=submit]").click(); await page.waitForTimeout(700);
    assert.equal(one("SELECT name n FROM mk_media WHERE id = ?", M[1]).n, "renomme.png");
    await item(M[1]).click({ button: "right" }); await page.locator(".mx-menu button", { hasText: "Dupliquer" }).click(); await page.waitForTimeout(900);
    assert.ok(one("SELECT 1 x FROM mk_media WHERE name = 'renomme (copie).png'"), "copie physique créée");
  });

  test("favoris et tags : étoile (propre à la personne), panneau d'informations, tag ajouté, filtre par tag", async () => {
    await open();
    await item(M[2]).hover(); await item(M[2]).locator("[data-mx-star]").click(); await page.waitForTimeout(600);
    assert.ok(one("SELECT 1 x FROM mk_media_stars WHERE kind = 'media' AND target_id = ?", M[2]), "favori enregistré");
    await item(M[2]).locator(".mx-thumb").click(); await page.click("[data-mx-info-toggle]");
    await page.locator("[data-mx-info-body] h2", { hasText: "image-2.png" }).waitFor();
    for (const t of ["Format", "Dimensions", "Emplacement", "Empreinte SHA-256"]) assert.ok((await page.locator("[data-mx-info-body]").innerText()).includes(t), t);
    const tag = page.locator('[data-mx-info-body] input[aria-label="Ajouter un tag"]'); await tag.fill("Été 2026"); await tag.press("Enter"); await page.waitForTimeout(700);
    assert.ok(one("SELECT 1 x FROM mk_media_tag_links l JOIN mk_media_tags t ON t.id = l.tag_id WHERE l.media_id = ? AND t.name = 'Été 2026'", M[2]), "tag enregistré");
    await page.click("[data-mx-info-close]"); await page.waitForTimeout(300);
    await open(); await page.locator('[data-mx-tag]', { hasText: "Été 2026" }).click(); await waitIdle(); await page.waitForTimeout(300);
    assert.equal(await page.locator("[data-ml-item]").count(), 1, "filtre par tag");
    await open(); await page.click("[data-mx-info-toggle]"); await page.waitForTimeout(200); await page.click("[data-mx-info-toggle]");
  });

  test("prévisualisation : double-clic ouvre l'aperçu plein écran, les flèches naviguent, l'image d'origine remplace l'aperçu, Échap ferme et rend le focus", async () => {
    await open();
    await item(M[2]).dblclick(); const pv = page.locator("#mx-preview"); await pv.waitFor();
    const first = await pv.locator("[data-pv-name]").innerText(); assert.equal(first, "image-2.png");
    await page.waitForFunction(() => /\/uploads\/marketing\/[^"]+\.png$/.test(document.querySelector(".mx-pv-img").getAttribute("src")), null, { timeout: 8000 });
    await page.keyboard.press("ArrowRight"); await page.waitForTimeout(300); assert.notEqual(await pv.locator("[data-pv-name]").innerText(), first);
    await page.keyboard.press("+"); await page.keyboard.press("r"); assert.match(await pv.locator(".mx-pv-img").getAttribute("style"), /scale\(1\.25\).*rotate\(90deg\)/);
    await page.keyboard.press("Escape"); assert.equal(await pv.isHidden(), true);
  });

  test("recherche : suggestions (fichier, tag, dossier) et résultat par tag ou par dossier", async () => {
    await open();
    await page.locator("[data-mx-search]").fill("photo"); await page.locator("[data-mx-suggest] li").first().waitFor();
    assert.ok((await page.locator("[data-mx-suggest]").innerText()).includes("Photos"), "le dossier est suggéré");
    await page.locator("[data-mx-suggest] li", { hasText: "Photos" }).first().click(); await waitIdle(); await page.waitForTimeout(300);
    assert.match(page.url(), new RegExp(`dossier=${F.a}`));
    await open(); await page.locator("[data-mx-search]").fill("Été"); await page.keyboard.press("Enter"); await waitIdle(); await page.waitForTimeout(300);
    assert.equal(await page.locator("[data-ml-item]").count(), 1, "la recherche texte trouve aussi par tag");
  });

  test("corbeille : Suppr met à la corbeille (avec confirmation), la rubrique la liste, restaurer ; dossier à la corbeille puis restauré avec son contenu", async () => {
    await open(); await item(M[3]).locator(".mx-thumb").click(); await page.keyboard.press("Delete");
    await page.locator("dialog[open] button[type=submit]").click(); await page.waitForTimeout(800);
    assert.notEqual(one("SELECT deleted_at d FROM mk_media WHERE id = ?", M[3]).d, null);
    await open("?corbeille=1"); assert.equal(await item(M[3]).count(), 1); assert.ok((await page.locator(".mx-trash").innerText()).includes("signalé"), "bandeau d'information");
    await item(M[3]).locator(".mx-thumb").click(); await page.locator("[data-mx-bulk-actions] button", { hasText: "Restaurer" }).click(); await page.waitForTimeout(800);
    assert.equal(one("SELECT deleted_at d FROM mk_media WHERE id = ?", M[3]).d, null);
    // Dossier entier
    await open("?section=dossiers"); await page.locator(`.mx-folders .mx-folder[data-mx-folder="${F.a}"]`).click({ button: "right" });
    await page.locator(".mx-menu button", { hasText: "Mettre à la corbeille" }).click(); await page.locator("dialog[open] button[type=submit]").click(); await page.waitForTimeout(900);
    assert.notEqual(one("SELECT deleted_at d FROM mk_media_folders WHERE id = ?", F.a).d, null); assert.notEqual(one("SELECT deleted_at d FROM mk_media WHERE id = ?", M[5]).d, null, "ses fichiers suivent");
    await open("?corbeille=1"); await page.locator(`[data-mx-trash-folder="${F.a}"] [data-mx-trash-restore]`).click(); await page.waitForTimeout(900);
    assert.equal(one("SELECT deleted_at d FROM mk_media_folders WHERE id = ?", F.a).d, null); assert.equal(one("SELECT deleted_at d FROM mk_media WHERE id = ?", M[5]).d, null, "restauré avec son contenu");
  });

  test("importation : le fichier du même nom est renommé « (2) » (garder les deux) ; un dossier entier recrée ses sous-dossiers dans la destination", async () => {
    await open(); await page.click("[data-ml-browse]"); await page.locator("#ml-upload").waitFor();
    assert.equal(await page.locator("[data-mx-import-dest] option").count() >= 4, true, "choix du dossier de destination");
    await page.selectOption("[data-mx-import-dest]", String(F.b));
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "kw-up-")); fs.writeFileSync(path.join(tmp, "image-4.png"), png(44, 30, [200, 40, 40])); // « image-4.png » existe déjà dans « Marque »
    await page.setInputFiles("[data-ml-input]", [path.join(tmp, "image-4.png")]); await page.waitForSelector(".mk-ml-q-item");
    await page.waitForFunction(() => /Réussi/.test(document.querySelector(".mk-ml-q-status").textContent), null, { timeout: 15000 });
    assert.ok(one("SELECT 1 x FROM mk_media WHERE name = 'image-4 (2).png' AND folder_id = ?", F.b), "conflit de nom : « garder les deux »");
    const dir = path.join(tmp, "Campagne"); fs.mkdirSync(path.join(dir, "Visuels"), { recursive: true }); fs.writeFileSync(path.join(dir, "affiche.png"), png(50, 30, [10, 200, 100])); fs.writeFileSync(path.join(dir, "Visuels", "banniere.png"), png(60, 30, [10, 100, 200]));
    await page.setInputFiles("[data-mx-folder-input]", dir); await page.waitForTimeout(1500);
    await page.waitForFunction(() => document.querySelectorAll(".mk-ml-q-item").length >= 3 && [...document.querySelectorAll(".mk-ml-q-status")].every((s) => !/En cours|En attente|En validation/.test(s.textContent)), null, { timeout: 20000 });
    const camp = one("SELECT id FROM mk_media_folders WHERE name = 'Campagne' AND parent_id = ?", F.b), vis = camp && one("SELECT id FROM mk_media_folders WHERE name = 'Visuels' AND parent_id = ?", camp.id);
    assert.ok(camp && vis, "sous-dossiers recréés sous la destination");
    assert.ok(one("SELECT 1 x FROM mk_media WHERE name = 'affiche.png' AND folder_id = ?", camp.id)); assert.ok(one("SELECT 1 x FROM mk_media WHERE name = 'banniere.png' AND folder_id = ?", vis.id));
  });

  test("doublons : deux fichiers identiques forment un groupe ; garder un exemplaire met l'autre à la corbeille ; stockage et accueil affichent des chiffres réels", async () => {
    const a = await upload(png(77, 33, [5, 5, 5]), "double-a.png"), b = await upload(png(77, 33, [5, 5, 5]), "double-b.png");
    await open("?section=doublons"); await page.locator(".mx-dup").first().waitFor({ timeout: 15000 });
    assert.ok((await page.locator(".mx-dup").first().innerText()).includes("2 fichiers identiques"));
    await page.locator(".mx-dup button", { hasText: "Garder l'exemplaire choisi" }).first().click(); await page.locator("dialog[open] button[type=submit]").click(); await page.waitForTimeout(1000);
    const trashed = [a.id, b.id].filter((id) => one("SELECT deleted_at d FROM mk_media WHERE id = ?", id).d !== null); assert.equal(trashed.length, 1, "un seul exemplaire part à la corbeille (et reste restaurable)");
    await open("?section=stockage"); await page.locator(".mx-cards .mx-card").first().waitFor(); assert.match(await page.locator(".mx-cards").innerText(), /fichiers/); assert.ok((await page.locator("[data-mx-section]").innerText()).includes("originaux"));
    await open("?section=accueil"); await page.locator(".mx-cards").waitFor(); assert.match(await page.locator("[data-mx-section]").innerText(), /récemment ajoutés/i);
  });

  test("barre latérale : réduite en icônes, masquée, rétablie ; le choix est mémorisé ; aucun bouton sans action ; aucune erreur de script pendant tout le parcours", async () => {
    await open();
    await page.click("[data-mx-side-collapse]"); assert.equal(await page.locator("[data-mx]").getAttribute("data-sidebar"), "rail");
    await page.click("[data-mx-side-toggle]"); assert.equal(await page.locator("[data-mx]").getAttribute("data-sidebar"), "hidden");
    await page.waitForTimeout(600); await page.reload(); await page.waitForSelector("[data-mx]"); assert.equal(await page.locator("[data-mx]").getAttribute("data-sidebar"), "hidden", "mémorisé");
    await page.click("[data-mx-side-toggle]"); assert.equal(await page.locator("[data-mx]").getAttribute("data-sidebar"), "open"); await page.waitForTimeout(600);
    assert.deepEqual(errors, [], "aucune erreur de script : " + errors.join(" | "));
  });
});
