// Médiathèque : dossiers libres partout (catégorie d'emplacement, sous-dossiers, icône, couverture, ordre personnalisé), persistance, permissions et isolation entre sites.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const zlib = require("node:zlib");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor, newStudent } = require("./helpers");

function png(w, h) {
  const table = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
  const crc = (buf) => { let c = 0xffffffff; for (const b of buf) c = table[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([len, td, c]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2;
  const raw = Buffer.alloc((w * 3 + 1) * h);
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
}

describe("médiathèque : dossiers libres", () => {
  let srv, boss, db, orgId, A, B, adminA, viewerA, adminB;
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const L = "/marketing/site-web/mediatheque";
  const idOf = (c) => one("SELECT id FROM users WHERE email = ?", c.email).id;
  const person = async (siteId, role) => { const c = await newStudent(srv); db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, ?)").run(siteId, idOf(c), role); return c; };
  const body = (r) => { try { return JSON.parse(r.text); } catch { return {}; } };
  const post = (client, url, site, json) => client.request(`${L}${url}?site=${site}`, { method: "POST", json });
  const page = async (client, site, qs = "") => (await client.get(`${L}?site=${site}${qs}`)).text;
  const cardNames = (html) => [...html.matchAll(/class="mx-folder-name">([^<]+)</g)].map((m) => m[1]);

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db();
    orgId = one("SELECT id FROM mk_organizations").id;
    const site = (n) => Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, ?, ?, '{}')").run(orgId, n, n.toLowerCase()).lastInsertRowid);
    A = site("Alpha"); B = site("Beta");
    adminA = await person(A, "admin"); viewerA = await person(A, "viewer"); adminB = await person(B, "admin");
  });
  after(() => srv.stop());

  let dImg, dVid, dAud, dDoc, dAll, dOld;
  test("créer un dossier dans Images, Vidéos, Audio, Documents, Tous les fichiers et Sans dossier", async () => {
    const mk = async (name, category) => body(await post(adminA, "/dossiers", A, { name, category })).folder;
    dImg = await mk("Drapeau Congo", "image"); dVid = await mk("Tournages", "video"); dAud = await mk("Voix", "audio"); dDoc = await mk("Contrats", "document");
    dAll = await mk("Général", ""); dOld = await mk("Ancien", "inconnue");
    for (const f of [dImg, dVid, dAud, dDoc, dAll]) assert.ok(f && f.id, "dossier créé");
    assert.equal(dImg.category, "image"); assert.equal(dDoc.category, "document");
    assert.equal(dOld.category, "", "une catégorie inconnue est ignorée (dossier général)");
  });
  test("chaque catégorie affiche ses dossiers + les dossiers généraux, pas ceux des autres catégories", async () => {
    const img = cardNames(await page(adminA, A, "&type=image")), vid = cardNames(await page(adminA, A, "&type=video"));
    assert.ok(img.includes("Drapeau Congo") && img.includes("Général") && img.includes("Ancien"), "Images : " + img);
    assert.ok(!img.includes("Tournages") && !img.includes("Voix") && !img.includes("Contrats"), "Images ne montre pas les autres catégories : " + img);
    assert.ok(vid.includes("Tournages") && !vid.includes("Drapeau Congo"));
    const docs = cardNames(await page(adminA, A, "&type=documents"));
    assert.ok(docs.includes("Contrats") && !docs.includes("Voix"));
    const audio = cardNames(await page(adminA, A, "&type=audio"));
    assert.ok(audio.includes("Voix"));
  });
  test("Tous les fichiers et Sans dossier affichent tous les dossiers de premier niveau", async () => {
    const tous = cardNames(await page(adminA, A)), racine = cardNames(await page(adminA, A, "&dossier=racine"));
    for (const n of ["Drapeau Congo", "Tournages", "Voix", "Contrats", "Général"]) { assert.ok(tous.includes(n), "Tous : " + n); assert.ok(racine.includes(n), "Sans dossier : " + n); }
  });
  test("un dossier ouvert depuis Images garde la catégorie dans le lien ; ses sous-dossiers héritent de la catégorie", async () => {
    assert.match(await page(adminA, A, "&type=image"), new RegExp(`href="[^"]*type=image[^"]*dossier=${dImg.id}|href="[^"]*dossier=${dImg.id}[^"]*type=image`));
    const sub = body(await post(adminA, "/dossiers", A, { name: "Versions finales", parent_id: dImg.id, category: "video" })).folder;
    assert.equal(sub.category, "image", "le sous-dossier reste dans la catégorie du dossier parent");
    const sub2 = body(await post(adminA, "/dossiers", A, { name: "2026", parent_id: sub.id })).folder;
    assert.equal(sub2.parent_id, sub.id);
    assert.deepEqual(cardNames(await page(adminA, A, `&dossier=${dImg.id}`)), ["Versions finales"]);
    assert.deepEqual(cardNames(await page(adminA, A, `&type=image&dossier=${sub.id}`)), ["2026"], "plusieurs niveaux, catégorie conservée");
  });
  test("conflits de noms et déplacements impossibles", async () => {
    assert.equal((await post(adminA, "/dossiers", A, { name: "drapeau congo", category: "image" })).status, 409);
    const sub = one("SELECT id FROM mk_media_folders WHERE name = 'Versions finales'").id;
    const r = await post(adminA, `/dossiers/${dImg.id}`, A, { parent_id: sub });
    assert.ok(r.status >= 400, "un dossier ne peut pas entrer dans un de ses descendants");
    assert.equal((await post(adminA, `/dossiers/${dImg.id}`, A, { parent_id: dImg.id })).status >= 400, true, "ni dans lui-même");
  });
  test("icône personnalisée : liste fermée, persistante, visible dans la page", async () => {
    assert.equal((await post(adminA, `/dossiers/${dImg.id}/meta`, A, { icon: "n-importe-quoi" })).status >= 400, true);
    const ok = await post(adminA, `/dossiers/${dImg.id}/meta`, A, { icon: "camera" });
    assert.ok(ok.status >= 400, "« camera » n'est pas dans la liste");
    const good = body(await post(adminA, `/dossiers/${dImg.id}/meta`, A, { icon: "star", color: "bleu", description: "Visuels du drapeau" })).folder;
    assert.equal(good.icon, "star"); assert.equal(good.color, "bleu"); assert.equal(good.description, "Visuels du drapeau");
    assert.equal(one("SELECT icon FROM mk_media_folders WHERE id = ?", dImg.id).icon, "star", "enregistré côté serveur");
    const props = body(await adminA.get(`${L}/dossiers/${dImg.id}/proprietes.json?site=${A}`)).properties;
    assert.equal(props.icon, "star"); assert.ok(props.createdAt); assert.ok(props.updatedAt);
  });
  test("image de couverture : seulement une image de la médiathèque du site", async () => {
    const fd = new FormData(); fd.append("file", new Blob([png(30, 20)], { type: "image/png" }), "couv.png");
    const up = body(await adminA.request(`${L}/televerser?site=${A}`, { method: "POST", multipart: fd })).media;
    assert.ok(up && up.id, "image envoyée");
    const set = body(await post(adminA, `/dossiers/${dImg.id}/meta`, A, { cover_media_id: up.id })).folder;
    assert.equal(set.cover_media_id, up.id);
    assert.equal((await post(adminA, `/dossiers/${dImg.id}/meta`, A, { cover_media_id: 999999 })).status >= 400, true);
    assert.equal((await post(adminA, `/dossiers/${dImg.id}/meta`, A, { cover_media_id: null })).status, 200);
    assert.equal(one("SELECT cover_media_id FROM mk_media_folders WHERE id = ?", dImg.id).cover_media_id, null);
  });
  test("ordre personnalisé : persistant, ne déplace rien, refusé entre emplacements différents", async () => {
    const roots = () => db.prepare("SELECT id FROM mk_media_folders WHERE site_id = ? AND parent_id IS NULL AND deleted_at IS NULL ORDER BY sort_order, name COLLATE NOCASE").all(A).map((r) => r.id);
    const before = roots(), reversed = [...before].reverse();
    const r = await post(adminA, "/dossiers/ordre", A, { parent_id: null, ids: reversed });
    assert.equal(r.status, 200, r.text);
    assert.deepEqual(roots(), reversed, "nouvel ordre enregistré");
    assert.deepEqual(cardNames(await page(adminA, A)).slice(0, 2), reversed.slice(0, 2).map((id) => one("SELECT name FROM mk_media_folders WHERE id = ?", id).name), "la page suit l'ordre personnalisé");
    assert.ok(roots().length === before.length && one("SELECT COUNT(*) n FROM mk_media_folders WHERE parent_id IS NOT NULL AND site_id = ?", A).n >= 2, "aucun dossier déplacé");
    const sub = one("SELECT id FROM mk_media_folders WHERE name = 'Versions finales'").id;
    assert.ok((await post(adminA, "/dossiers/ordre", A, { parent_id: null, ids: [dImg.id, sub] })).status >= 400, "des dossiers d'emplacements différents ne s'ordonnent pas ensemble");
    assert.ok((await post(adminA, "/dossiers/ordre", A, { parent_id: null, ids: [] })).status >= 400);
  });
  test("permissions et isolation : lecteur sans écriture, autre site sans accès", async () => {
    assert.ok((await post(viewerA, "/dossiers", A, { name: "Interdit", category: "image" })).status >= 403 || (await post(viewerA, "/dossiers", A, { name: "Interdit2" })).status >= 400);
    assert.ok((await post(viewerA, "/dossiers/ordre", A, { parent_id: null, ids: [dImg.id] })).status >= 400);
    assert.equal(one("SELECT COUNT(*) n FROM mk_media_folders WHERE name LIKE 'Interdit%'").n, 0);
    assert.ok((await post(adminB, "/dossiers/ordre", B, { parent_id: null, ids: [dImg.id] })).status >= 400, "ordonner un dossier d'un autre site est refusé");
    assert.ok((await post(adminB, `/dossiers/${dImg.id}/meta`, B, { icon: "home" })).status >= 400);
    assert.equal(one("SELECT icon FROM mk_media_folders WHERE id = ?", dImg.id).icon, "star");
    assert.ok(!cardNames(await page(adminB, B)).includes("Drapeau Congo"), "le site Beta ne voit pas les dossiers d'Alpha");
  });
  test("persistance : après rechargement, tout est retrouvé (page entière et fragment)", async () => {
    const full = cardNames(await page(adminA, A, "&type=image")), frag = cardNames((await adminA.get(`${L}?site=${A}&type=image&fragment=1`)).text);
    assert.ok(full.includes("Drapeau Congo") && frag.includes("Drapeau Congo"));
  });
});
