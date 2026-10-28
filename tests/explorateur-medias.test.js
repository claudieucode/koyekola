// Explorateur de médias (TITAN XXXIII) : dossiers logiques, déplacement, empreintes et doublons, filtres avancés, isolation entre sites.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const zlib = require("node:zlib");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor, newStudent } = require("./helpers");

function png(w, h, rgb = [2, 119, 182]) {
  const table = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
  const crc = (buf) => { let c = 0xffffffff; for (const b of buf) c = table[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([len, td, c]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2;
  const raw = Buffer.alloc((w * 3 + 1) * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) raw.set(rgb, y * (w * 3 + 1) + 1 + x * 3);
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
}

describe("explorateur de médias", () => {
  let srv, boss, db, orgId, A, B, adminA, viewerA, adminB;
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const L = "/marketing/site-web/mediatheque";
  const idOf = (c) => one("SELECT id FROM users WHERE email = ?", c.email).id;
  const person = async (siteId, role) => { const c = await newStudent(srv); db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, ?)").run(siteId, idOf(c), role); return c; };
  const body = (r) => { try { return JSON.parse(r.text); } catch { return {}; } };
  const send = (client, buffer, name, site, extra = {}) => { const fd = new FormData(); fd.append("file", new Blob([buffer], { type: "image/png" }), name); for (const [k, v] of Object.entries(extra)) fd.append(k, String(v)); return client.request(`${L}/televerser?site=${site}`, { method: "POST", multipart: fd }); };
  const post = (client, url, site, json) => client.request(`${L}${url}?site=${site}`, { method: "POST", json });
  const names = async (client, site, qs = "") => body(await client.get(`${L}/liste.json?site=${site}${qs}`)).items?.map((m) => m.name).sort();

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db();
    orgId = one("SELECT id FROM mk_organizations").id;
    const site = (n) => Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, ?, ?, '{}')").run(orgId, n, n.toLowerCase()).lastInsertRowid);
    A = site("Alpha"); B = site("Beta");
    adminA = await person(A, "admin"); viewerA = await person(A, "viewer"); adminB = await person(B, "admin");
  });
  after(() => srv.stop());

  describe("empreintes et doublons", () => {
    test("chaque envoi reçoit son empreinte SHA-256 ; un fichier identique est signalé mais CONSERVÉ (rien n'est écrasé)", async () => {
      const first = body(await send(adminA, png(40, 30), "un.png", A)).media;
      assert.match(first.sha256, /^[0-9a-f]{64}$/);
      assert.deepEqual(first.duplicateOf, []);
      const second = body(await send(adminA, png(40, 30), "deux.png", A)).media;
      assert.equal(second.sha256, first.sha256);
      assert.deepEqual(second.duplicateOf, [first.id]);
      assert.notEqual(second.path, first.path, "deux fichiers distincts sur le disque");
      const groups = body(await adminA.get(`${L}/doublons.json?site=${A}`)).groups;
      assert.equal(groups.length, 1); assert.equal(groups[0].count, 2); assert.equal(groups[0].items.length, 2);
      assert.ok(groups[0].wastedBytes > 0);
    });
    test("même nom mais contenu différent : pas un doublon", async () => {
      await send(adminA, png(10, 10, [9, 9, 9]), "un.png", A);
      assert.equal(body(await adminA.get(`${L}/doublons.json?site=${A}`)).groups.length, 1);
    });
    test("les doublons ne sont jamais cherchés entre deux sites", async () => {
      const m = body(await send(adminB, png(40, 30), "chez-beta.png", B)).media;
      assert.deepEqual(m.duplicateOf, [], "l'image identique de Alpha n'est pas visible de Beta");
      assert.equal(body(await adminB.get(`${L}/doublons.json?site=${B}`)).groups.length, 0);
    });
    test("empreintes des fichiers déjà présents : calculées par lots, en lisant le vrai fichier", async () => {
      const row = one("SELECT id, sha256 FROM mk_media WHERE name = 'un.png'");
      db.prepare("UPDATE mk_media SET sha256 = NULL WHERE id = ?").run(row.id);
      const r = body(await post(adminA, "/empreintes", A, {}));
      assert.equal(r.done, 1); assert.equal(r.left, 0);
      assert.equal(one("SELECT sha256 FROM mk_media WHERE id = ?", row.id).sha256, row.sha256);
    });
  });

  describe("dossiers logiques", () => {
    let docs, factures, img;
    test("créer, imbriquer, refuser un nom déjà pris à cet endroit", async () => {
      docs = body(await post(adminA, "/dossiers", A, { name: "Documents" })).folder;
      factures = body(await post(adminA, "/dossiers", A, { name: "Factures", parent_id: docs.id })).folder;
      assert.equal(factures.parent_id, docs.id);
      const again = await post(adminA, "/dossiers", A, { name: "documents" });
      assert.equal(again.status, 409, "la casse ne distingue pas deux dossiers");
      assert.equal((await post(adminA, "/dossiers", A, { name: "Factures", parent_id: docs.id })).status, 409);
      assert.equal((await post(adminA, "/dossiers", A, { name: "   " })).status, 422);
    });
    test("jamais de cycle : ni dans lui-même, ni dans un sous-dossier", async () => {
      assert.equal((await post(adminA, `/dossiers/${docs.id}`, A, { parent_id: docs.id })).status, 409);
      assert.equal((await post(adminA, `/dossiers/${docs.id}`, A, { parent_id: factures.id })).status, 409);
      assert.equal(one("SELECT parent_id FROM mk_media_folders WHERE id = ?", docs.id).parent_id, null);
    });
    test("déplacer un fichier : l'adresse publique et le fichier sur le disque ne changent pas ; filtre par dossier ; fil d'Ariane", async () => {
      img = one("SELECT * FROM mk_media WHERE name = 'deux.png'");
      const r = await post(adminA, "/deplacer", A, { ids: [img.id], folder_id: factures.id });
      assert.deepEqual(body(r).done, [img.id]);
      const after = one("SELECT * FROM mk_media WHERE id = ?", img.id);
      assert.equal(after.path, img.path); assert.equal(after.folder_id, factures.id);
      assert.deepEqual(await names(adminA, A, `&dossier=${factures.id}`), ["deux.png"]);
      assert.ok(!(await names(adminA, A, "&dossier=racine")).includes("deux.png"), "le fichier déplacé n'est plus à la racine");
      const tree = body(await adminA.get(`${L}/dossiers.json?site=${A}&dossier=${factures.id}`));
      assert.deepEqual(tree.breadcrumb.map((c) => c.name), ["Documents", "Factures"]);
      assert.equal(tree.folders.find((f) => f.id === factures.id).count, 1);
    });
    test("page : l'arborescence et le fil d'Ariane sont rendus, avec la médiathèque du site", async () => {
      const t = (await adminA.get(`${L}?site=${A}&dossier=${factures.id}`)).text;
      assert.match(t, /Documents/); assert.match(t, /Factures/); assert.match(t, /deux\.png/); assert.doesNotMatch(t, /chez-beta/);
    });
    test("supprimer un dossier ne supprime AUCUN fichier : ils remontent d'un niveau", async () => {
      const r = await post(adminA, `/dossiers/${factures.id}/supprimer`, A, {});
      assert.equal(r.status, 200);
      assert.equal(one("SELECT folder_id FROM mk_media WHERE id = ?", img.id).folder_id, docs.id);
      assert.ok(one("SELECT id FROM mk_media WHERE id = ? AND deleted_at IS NULL", img.id));
    });
  });

  describe("isolation et droits", () => {
    let folderA, mediaA;
    before(async () => { folderA = body(await post(adminA, "/dossiers", A, { name: "Privé Alpha" })).folder; mediaA = one("SELECT id FROM mk_media WHERE name = 'un.png' LIMIT 1"); });
    test("un lecteur ne peut ni créer, ni déplacer, ni supprimer de dossier", async () => {
      assert.equal((await post(viewerA, "/dossiers", A, { name: "Non" })).status, 403);
      assert.equal((await post(viewerA, "/deplacer", A, { ids: [mediaA.id], folder_id: folderA.id })).status, 403);
      assert.equal((await post(viewerA, `/dossiers/${folderA.id}/supprimer`, A, {})).status, 403);
    });
    test("l'administrateur d'un autre site ne voit pas les dossiers de Alpha et ne peut ni les utiliser ni y déplacer ses fichiers", async () => {
      assert.deepEqual(body(await adminB.get(`${L}/dossiers.json?site=${B}`)).folders, []);
      const mB = one("SELECT id FROM mk_media WHERE name = 'chez-beta.png'");
      const r = await post(adminB, "/deplacer", B, { ids: [mB.id], folder_id: folderA.id });
      assert.equal(r.status, 404, "dossier de Alpha introuvable depuis Beta");
      assert.equal((await post(adminB, `/dossiers/${folderA.id}`, B, { name: "Piraté" })).status, 404);
      assert.equal((await post(adminB, `/dossiers/${folderA.id}/supprimer`, B, {})).status, 404);
      assert.equal(one("SELECT name FROM mk_media_folders WHERE id = ?", folderA.id).name, "Privé Alpha");
    });
    test("un site_id falsifié ne donne pas accès : l'administrateur de Beta ne peut pas déplacer les fichiers de Alpha, même en désignant Alpha", async () => {
      const r = await post(adminB, "/deplacer", A, { ids: [mediaA.id], folder_id: folderA.id });
      assert.notEqual(r.status, 200, r.text);
      assert.equal(one("SELECT folder_id FROM mk_media WHERE id = ?", mediaA.id).folder_id, null);
      assert.equal((await adminB.get(`${L}/doublons.json?site=${A}`)).status === 200 ? body(await adminB.get(`${L}/doublons.json?site=${A}`)).groups.length : 0, 0);
    });
    test("un fichier d'un site n'entre pas dans le dossier d'un autre site, même pour l'équipe de l'organisation", async () => {
      const folderB = body(await post(boss, "/dossiers", B, { name: "Dossier Beta" })).folder;
      const r = body(await post(boss, "/deplacer", B, { ids: [mediaA.id], folder_id: folderB.id }));
      assert.deepEqual(r.done, []); assert.equal(r.failed.length, 1);
      assert.equal(one("SELECT folder_id FROM mk_media WHERE id = ?", mediaA.id).folder_id, null);
    });
    test("sans site choisi, l'équipe travaille dans la médiathèque du site principal : ses dossiers ne sont pas ceux d'un site", async () => {
      const t = body(await boss.get(`${L}/dossiers.json`));
      assert.equal(t.enabled, true);
      const f = body(await boss.request(`${L}/dossiers`, { method: "POST", json: { name: "Commun" } })).folder;
      assert.equal(f.site_id, null);
      assert.ok(!body(await adminA.get(`${L}/dossiers.json?site=${A}`)).folders.some((x) => x.id === f.id));
    });
  });

  describe("filtres avancés", () => {
    test("extension, largeur minimale, taille et volumineux se combinent, côté serveur", async () => {
      assert.ok((await names(adminA, A, "&ext=png")).length >= 3);
      assert.deepEqual(await names(adminA, A, "&ext=pdf"), []);
      assert.deepEqual(await names(adminA, A, "&ext=png&lmin=30"), ["deux.png", "un.png"]);
      assert.deepEqual(await names(adminA, A, "&lmin=5000"), []);
      assert.deepEqual(await names(adminA, A, "&tmax=0"), []);
      assert.deepEqual(await names(adminA, A, "&volumineux=1"), []);
      db.prepare("UPDATE mk_media SET size = 6000000 WHERE name = 'deux.png'").run();
      assert.deepEqual(await names(adminA, A, "&volumineux=1"), ["deux.png"]);
      assert.deepEqual(await names(adminA, A, "&doublons=1"), ["deux.png", "un.png"]);
    });
    test("valeurs absurdes ignorées sans erreur", async () => {
      const r = await adminA.get(`${L}/liste.json?site=${A}&tmin=abc&lmax=-5&ext=../../etc&dossier=zzz`);
      assert.equal(r.status, 200);
    });
  });
});
