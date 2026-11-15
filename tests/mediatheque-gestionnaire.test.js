// Médiathèque = gestionnaire de fichiers (lot 1, socle serveur) : favoris, tags, collections, préférences, dossiers enrichis, corbeille de dossiers,
// conservation de la corbeille, copie, stockage, doublons, suggestions, téléchargement groupé, isolation entre sites et droits. VRAI serveur, vraies requêtes.
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

describe("médiathèque : gestionnaire de fichiers (socle serveur)", () => {
  let srv, boss, db, orgId, A, B, adminA, editorA, viewerA, adminB;
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const L = "/marketing/site-web/mediatheque";
  const idOf = (c) => one("SELECT id FROM users WHERE email = ?", c.email).id;
  const person = async (siteId, role) => { const c = await newStudent(srv); db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, ?)").run(siteId, idOf(c), role); return c; };
  const body = (r) => { try { return JSON.parse(r.text); } catch { return {}; } };
  const send = (client, buffer, name, site, extra = {}) => { const fd = new FormData(); fd.append("file", new Blob([buffer], { type: "image/png" }), name); for (const [k, v] of Object.entries(extra)) fd.append(k, String(v)); return client.request(`${L}/televerser?site=${site}`, { method: "POST", multipart: fd }); };
  const up = async (client, site, name, rgb, extra) => body(await send(client, png(30 + (rgb[0] % 7), 20, rgb), name, site, extra)).media;
  const post = (client, url, site, json) => client.request(`${L}${url}?site=${site}`, { method: "POST", json });
  const get = (client, url, site) => client.get(`${L}${url}${url.includes("?") ? "&" : "?"}site=${site}`);

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db();
    orgId = one("SELECT id FROM mk_organizations").id;
    const site = (n) => Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, ?, ?, '{}')").run(orgId, n, n.toLowerCase()).lastInsertRowid);
    A = site("Alpha"); B = site("Beta");
    adminA = await person(A, "admin"); editorA = await person(A, "editor"); viewerA = await person(A, "viewer"); adminB = await person(B, "admin");
  });
  after(() => srv.stop());

  describe("tags", () => {
    test("créer, étiqueter plusieurs fichiers, filtrer par tag, retrouver par la recherche, renommer, supprimer sans toucher aux fichiers", async () => {
      const m1 = await up(adminA, A, "plage.png", [10, 20, 30]), m2 = await up(adminA, A, "montagne.png", [11, 21, 31]);
      const r = await post(adminA, "/etiqueter", A, { ids: [m1.id, m2.id], add: ["Vacances", "Été 2026"] });
      assert.equal(r.status, 200); assert.deepEqual(body(r).done.sort(), [m1.id, m2.id].sort());
      const tags = body(await get(adminA, "/tags.json", A)).tags;
      assert.deepEqual(tags.map((t) => t.name).sort(), ["Vacances", "Été 2026"].sort()); assert.equal(tags.find((t) => t.name === "Vacances").count, 2);
      const tagId = tags.find((t) => t.name === "Vacances").id;
      const byTag = body(await get(adminA, `/liste.json?tag=${tagId}`, A)).items;
      assert.equal(byTag.length, 2); assert.ok(byTag.every((m) => m.tags.some((t) => t.name === "Vacances")));
      // la recherche texte trouve aussi par tag
      const q = body(await get(adminA, "/liste.json?q=vacances", A)).items.map((m) => m.name).sort();
      assert.deepEqual(q, ["montagne.png", "plage.png"]);
      assert.equal((await post(adminA, `/tags/${tagId}`, A, { name: "Vacances d'été", color: "bleu" })).status, 200);
      assert.equal((await post(adminA, `/${m1.id}/tags`, A, { tags: ["Seul"] })).status, 200);
      assert.deepEqual(body(await get(adminA, `/${m1.id}.json`, A)).media.tags.map((t) => t.name), ["Seul"]);
      assert.equal((await post(adminA, `/tags/${tagId}/supprimer`, A, {})).status, 200);
      assert.ok(body(await get(adminA, `/${m2.id}.json`, A)).media, "le fichier est intact après la suppression du tag");
    });
    test("un lecteur ne peut pas étiqueter ; un autre site ne voit ni les tags ni ne peut étiqueter ces fichiers", async () => {
      const m = await up(adminA, A, "prive.png", [40, 41, 42]);
      assert.equal((await post(viewerA, "/etiqueter", A, { ids: [m.id], add: ["x"] })).status, 403);
      await post(adminA, "/etiqueter", A, { ids: [m.id], add: ["Secret"] });
      assert.ok(!body(await get(adminB, "/tags.json", B)).tags.some((t) => t.name === "Secret"), "tags propres à la médiathèque du site");
      const cross = body(await post(adminB, "/etiqueter", B, { ids: [m.id], add: ["Pirate"] }));
      assert.equal(cross.done.length, 0); assert.equal(cross.failed.length, 1);
    });
  });

  describe("favoris et préférences (par personne)", () => {
    test("un favori est propre à la personne ; le filtre « favoris » et le compteur le reflètent ; un autre site ne peut pas mettre en favori", async () => {
      const m = await up(adminA, A, "fav.png", [50, 51, 52]);
      assert.equal((await post(adminA, "/favoris", A, { kind: "media", id: m.id, on: true })).status, 200);
      assert.deepEqual(body(await get(adminA, "/liste.json?favoris=1", A)).items.map((x) => x.id), [m.id]);
      assert.equal(body(await get(adminA, "/liste.json?favoris=1", A)).items[0].starred, true);
      assert.equal(body(await get(adminA, "/gestionnaire.json", A)).counts.starred, 1);
      assert.equal(body(await get(boss, "/liste.json?favoris=1", A)).items.length, 0, "les favoris d'une autre personne ne sont pas les miens");
      assert.ok([403, 404].includes((await post(adminB, "/favoris", B, { kind: "media", id: m.id, on: true })).status), "le fichier d'un autre site n'existe pas pour moi");
      await post(adminA, "/favoris", A, { kind: "media", id: m.id, on: false });
      assert.equal(body(await get(adminA, "/liste.json?favoris=1", A)).items.length, 0);
    });
    test("les préférences sont validées, mémorisées par personne ET par site", async () => {
      const r = await post(adminA, "/preferences", A, { view: "details", size: 9999, density: "compacte", columns: ["size", "bidon", "tags"], sidebar: "rail", evil: "<script>" });
      const p = body(r).prefs;
      assert.equal(p.view, "details"); assert.equal(p.size, 320, "taille bornée"); assert.deepEqual(p.columns, ["size", "tags"]); assert.equal(p.sidebar, "rail"); assert.ok(!("evil" in p));
      assert.equal(body(await get(adminA, "/preferences.json", A)).prefs.view, "details");
      assert.equal(body(await get(adminB, "/preferences.json", B)).prefs.view, "grille", "autre site, autre personne : valeurs par défaut");
      assert.equal(body(await post(adminA, "/preferences", A, { view: "nimporte" })).prefs.view, "details", "valeur refusée : l'ancienne est conservée");
    });
  });

  describe("collections", () => {
    test("créer, ajouter, filtrer, retirer, supprimer : un regroupement logique, les fichiers ne bougent pas", async () => {
      const m1 = await up(adminA, A, "col1.png", [60, 61, 62]), m2 = await up(adminA, A, "col2.png", [61, 62, 63]);
      const c = body(await post(adminA, "/collections", A, { name: "Campagne rentrée" })).collection;
      assert.ok(c.id);
      assert.equal((await post(adminA, "/collections", A, { name: "campagne RENTRÉE" })).status, 409, "nom déjà pris (insensible à la casse)");
      assert.equal(body(await post(adminA, `/collections/${c.id}/ajouter`, A, { ids: [m1.id, m2.id] })).done.length, 2);
      assert.equal(body(await get(adminA, `/liste.json?collection=${c.id}`, A)).items.length, 2);
      assert.equal(body(await get(adminA, "/collections.json", A)).collections[0].count, 2);
      await post(adminA, `/collections/${c.id}/retirer`, A, { ids: [m1.id] });
      assert.equal(body(await get(adminA, `/liste.json?collection=${c.id}`, A)).items.length, 1);
      assert.equal((await post(adminB, `/collections/${c.id}/ajouter`, B, { ids: [m1.id] })).status, 404, "collection d'un autre site : introuvable");
      await post(adminA, `/collections/${c.id}/supprimer`, A, {});
      assert.equal(body(await get(adminA, `/${m1.id}.json`, A)).media.id, m1.id);
    });
  });

  describe("dossiers enrichis et corbeille de dossiers", () => {
    test("couleur, description, propriétés (récursives), chemin", async () => {
      const f1 = body(await post(adminA, "/dossiers", A, { name: "Marque" })).folder, f2 = body(await post(adminA, "/dossiers", A, { name: "Logos", parent_id: f1.id })).folder;
      const m = await up(adminA, A, "logo.png", [70, 71, 72], { dossier: f2.id });
      assert.equal(body(await post(adminA, `/dossiers/${f1.id}/meta`, A, { color: "violet", description: "Tout sur la marque" })).folder.color, "violet");
      assert.equal((await post(adminA, `/dossiers/${f1.id}/meta`, A, { color: "fluo" })).status, 422);
      const p = body(await get(adminA, `/dossiers/${f1.id}/proprietes.json`, A)).properties;
      assert.equal(p.subfolders, 1); assert.equal(p.files, 1); assert.equal(p.bytes, m.size); assert.equal(p.path, "Médiathèque / Marque"); assert.equal(p.description, "Tout sur la marque");
      assert.equal(body(await get(adminA, `/dossiers/${f2.id}/proprietes.json`, A)).properties.path, "Médiathèque / Marque / Logos");
    });
    test("mettre un dossier à la corbeille emporte ses sous-dossiers et fichiers ; restaurer les rend ; un nom pris reçoit « (restauré) »", async () => {
      const f1 = body(await post(adminA, "/dossiers", A, { name: "Ancien" })).folder, f2 = body(await post(adminA, "/dossiers", A, { name: "Sous", parent_id: f1.id })).folder;
      const m1 = await up(adminA, A, "a1.png", [80, 81, 82], { dossier: f1.id }), m2 = await up(adminA, A, "a2.png", [81, 82, 83], { dossier: f2.id });
      const t = body(await post(adminA, `/dossiers/${f1.id}/corbeille`, A, {}));
      assert.equal(t.files, 2); assert.equal(t.folders, 2);
      assert.ok(!body(await get(adminA, "/dossiers.json", A)).folders.some((f) => f.id === f1.id || f.id === f2.id));
      assert.ok(!body(await get(adminA, "/liste.json", A)).items.some((m) => [m1.id, m2.id].includes(m.id)), "fichiers masqués");
      const trash = body(await get(adminA, "/corbeille.json", A));
      assert.deepEqual(trash.folders.map((f) => f.name), ["Ancien"]); assert.equal(trash.folders[0].files, 2);
      assert.ok(!trash.files.some((m) => [m1.id, m2.id].includes(m.id)), "les fichiers entraînés par un dossier ne sont pas listés seuls");
      // le nom « Ancien » est libre pendant que le dossier est à la corbeille
      const again = await post(adminA, "/dossiers", A, { name: "Ancien" }); assert.equal(again.status, 201);
      assert.equal(body(await post(adminA, `/dossiers/${f1.id}/restaurer`, A, {})).folder.name, "Ancien (restauré)");
      assert.ok(body(await get(adminA, "/liste.json", A)).items.some((m) => m.id === m1.id));
      assert.ok(body(await get(adminA, "/dossiers.json", A)).folders.some((f) => f.id === f2.id), "sous-dossier restauré aussi");
    });
    test("suppression définitive d'un dossier refusée tant qu'un de ses fichiers est utilisé ; permise ensuite", async () => {
      const f = body(await post(adminA, "/dossiers", A, { name: "Utilisé" })).folder;
      const m = await up(adminA, A, "utilise.png", [90, 91, 92], { dossier: f.id });
      db.prepare("UPDATE mk_sites SET tokens = ? WHERE id = ?").run(JSON.stringify({ logo: m.path }), A); // le site cite ce fichier
      await post(adminA, `/dossiers/${f.id}/corbeille`, A, {});
      const refused = await post(boss, `/dossiers/${f.id}/supprimer-definitivement`, A, {});
      assert.equal(refused.status, 409); assert.match(body(refused).error.message, /utilis/);
      assert.ok(one("SELECT 1 FROM mk_media WHERE id = ?", m.id), "rien n'a été supprimé");
      db.prepare("UPDATE mk_sites SET tokens = '{}' WHERE id = ?").run(A);
      assert.equal((await post(editorA, `/dossiers/${f.id}/supprimer-definitivement`, A, {})).status, 403, "réservé à ceux qui peuvent supprimer définitivement (rôle administrateur)");
      assert.equal((await post(boss, `/dossiers/${f.id}/supprimer-definitivement`, A, {})).status, 200);
      assert.equal(one("SELECT 1 FROM mk_media WHERE id = ?", m.id), undefined); assert.equal(one("SELECT 1 FROM mk_media_folders WHERE id = ?", f.id), undefined);
    });
    test("vider la corbeille : l'inutilisé part, l'utilisé est conservé et signalé", async () => {
      const free = await up(adminA, A, "libre.png", [100, 101, 102]), used = await up(adminA, A, "cite.png", [101, 102, 103]);
      db.prepare("UPDATE mk_sites SET tokens = ? WHERE id = ?").run(JSON.stringify({ logo: used.path }), A);
      await post(adminA, `/${free.id}/corbeille`, A, {}); await post(adminA, `/${used.id}/corbeille`, A, {});
      const r = body(await post(boss, "/corbeille/vider", A, {}));
      assert.ok(r.purged >= 1); assert.ok(r.kept.some((k) => k.name === "cite.png"));
      assert.equal(one("SELECT 1 FROM mk_media WHERE id = ?", free.id), undefined); assert.ok(one("SELECT 1 FROM mk_media WHERE id = ?", used.id));
      db.prepare("UPDATE mk_sites SET tokens = '{}' WHERE id = ?").run(A);
    });
    test("conservation : seuls les éléments plus vieux que la durée choisie partent ; jamais un élément utilisé", async () => {
      const old = await up(adminA, A, "vieux.png", [110, 111, 112]), recent = await up(adminA, A, "recent.png", [111, 112, 113]);
      await post(adminA, `/${old.id}/corbeille`, A, {}); await post(adminA, `/${recent.id}/corbeille`, A, {});
      db.prepare("UPDATE mk_media SET deleted_at = datetime('now', '-40 days') WHERE id = ?").run(old.id);
      assert.equal((await post(editorA, "/corbeille/conservation", A, { days: 30 })).status, 403, "réglage réservé à qui peut supprimer définitivement");
      assert.equal((await post(boss, "/corbeille/conservation", A, { days: 12 })).status, 422);
      assert.equal(body(await post(boss, "/corbeille/conservation", A, { days: 30 })).days, 30);
      body(await get(boss, "/corbeille.json", A)); // la lecture déclenche le nettoyage
      assert.equal(one("SELECT 1 FROM mk_media WHERE id = ?", old.id), undefined, "plus vieux que 30 jours : supprimé");
      assert.ok(one("SELECT 1 FROM mk_media WHERE id = ?", recent.id), "récent : conservé");
      await post(boss, "/corbeille/conservation", A, { days: 0 });
    });
  });

  describe("fichiers : copie, stockage, doublons, suggestions, ZIP, conflits", () => {
    test("copier crée un vrai second fichier (autre adresse) avec les mêmes informations, dans le même dossier", async () => {
      const f = body(await post(adminA, "/dossiers", A, { name: "Copies" })).folder;
      const m = await up(adminA, A, "orig.png", [120, 121, 122], { dossier: f.id });
      await post(adminA, `/${m.id}`, A, { alt: "Un carré", title: "Titre" });
      const c = body(await post(adminA, `/${m.id}/copier`, A, {})).media;
      assert.notEqual(c.path, m.path); assert.equal(c.name, "orig (copie).png"); assert.equal(c.alt, "Un carré"); assert.equal(c.folderId, f.id); assert.equal(c.sha256, m.sha256);
      assert.ok([403, 404].includes((await post(adminB, `/${m.id}/copier`, B, {})).status), "copie d'un fichier d'un autre site refusée");
    });
    test("stockage : totaux, par type, plus volumineux, évolution, octets uniques ; la note rappelle ce qui n'est pas compté", async () => {
      const s = body(await get(adminA, "/stockage.json", A));
      assert.ok(s.files >= 5 && s.bytes > 0); assert.ok(s.uniqueBytes <= s.bytes); assert.ok(s.byType.some((t) => t.type === "image"));
      assert.ok(s.largest.length > 0 && s.largest[0].size >= s.largest[s.largest.length - 1].size); assert.ok(s.monthly.length >= 1); assert.match(s.note, /originaux/);
      const sb = body(await get(adminB, "/stockage.json", B)); assert.equal(sb.files, 0, "chaque site ne voit que le sien");
    });
    test("doublons : détail avec usages, garder un exemplaire = les autres à la corbeille (réversible), aucun automatisme", async () => {
      const a = await up(adminA, A, "dup-a.png", [130, 131, 132]), b = await up(adminA, A, "dup-b.png", [130, 131, 132]);
      assert.equal(a.sha256, b.sha256);
      const items = body(await get(adminA, `/doublons/${a.sha256}.json`, A)).items;
      assert.equal(items.length, 2); assert.ok(Array.isArray(items[0].usage));
      assert.equal((await post(adminA, "/doublons/resoudre", A, { sha256: a.sha256, keep_id: 999999, action: "trash" })).status, 422);
      const r = body(await post(adminA, "/doublons/resoudre", A, { sha256: a.sha256, keep_id: a.id, action: "trash" }));
      assert.deepEqual(r.done, [b.id]);
      assert.equal(one("SELECT deleted_at IS NOT NULL t FROM mk_media WHERE id = ?", b.id).t, 1); assert.equal(one("SELECT deleted_at FROM mk_media WHERE id = ?", a.id).deleted_at, null);
      assert.equal(one("SELECT 1 FROM mk_media WHERE id = ?", b.id) ? 1 : 0, 1, "le fichier n'est pas effacé : la corbeille est réversible");
    });
    test("suggestions : noms, tags et dossiers ; deux lettres minimum ; limitées à la médiathèque", async () => {
      const m = await up(adminA, A, "soleil-couchant.png", [140, 141, 142]);
      await post(adminA, "/etiqueter", A, { ids: [m.id], add: ["soleil"] });
      const s = body(await get(adminA, "/suggestions.json?q=sole", A)).items;
      assert.ok(s.some((x) => x.kind === "media" && x.label === "soleil-couchant.png")); assert.ok(s.some((x) => x.kind === "tag" && x.label === "soleil"));
      assert.deepEqual(body(await get(adminA, "/suggestions.json?q=s", A)).items, []);
      assert.deepEqual(body(await get(adminB, "/suggestions.json?q=sole", B)).items, []);
    });
    test("téléchargement groupé : une vraie archive ZIP (noms, contenu, CRC) ; un fichier d'un autre site est refusé", async () => {
      const m1 = await up(adminA, A, "z1.png", [150, 151, 152]), m2 = await up(adminA, A, "z1.png", [151, 152, 153]); // même nom : « (2) »
      const r = await adminA.request(`${L}/telecharger.zip?site=${A}&ids=${m1.id},${m2.id}`, {});
      assert.equal(r.status, 200); assert.match(String(r.headers.get("content-type")), /zip/);
      const buf = r.body;
      assert.equal(buf.readUInt32LE(0), 0x04034b50, "signature ZIP"); const eocd = buf.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
      assert.equal(buf.readUInt16LE(eocd + 10), 2, "deux entrées");
      let p = buf.readUInt32LE(eocd + 16); const names = [];
      for (let i = 0; i < 2; i++) { const n = buf.readUInt16LE(p + 28), crc = buf.readUInt32LE(p + 16), size = buf.readUInt32LE(p + 20), start = buf.readUInt32LE(p + 42); names.push(buf.toString("utf8", p + 46, p + 46 + n));
        const dataAt = start + 30 + buf.readUInt16LE(start + 26) + buf.readUInt16LE(start + 28); assert.equal(zlib.crc32(buf.subarray(dataAt, dataAt + size)) >>> 0, crc, "CRC exact"); assert.equal(buf.subarray(dataAt, dataAt + 8).toString("hex"), "89504e470d0a1a0a"); p += 46 + n; }
      assert.deepEqual(names.sort(), ["z1 (2).png", "z1.png"]);
      assert.notEqual((await adminB.request(`${L}/telecharger.zip?site=${B}&ids=${m1.id}`, {})).status, 200, "fichier d'un autre site : refusé");
    });
    test("avant l'envoi : le serveur signale un fichier de même contenu ou de même nom dans la destination, sans rien écrire", async () => {
      const m = await up(adminA, A, "conflit.png", [160, 161, 162]);
      const r = body(await post(adminA, "/verifier", A, { files: [{ name: "conflit.png" }, { name: "autre.png", sha256: m.sha256 }, { name: "neuf.png" }] })).files;
      assert.equal(r[0].sameName.length, 1); assert.equal(r[1].sameContent.length >= 1, true); assert.equal(r[2].sameName.length + r[2].sameContent.length, 0);
      const renamed = body(await send(adminA, png(33, 20, [160, 161, 162]), "conflit.png", A, { nom: "conflit (2).png" })).media;
      assert.equal(renamed.name, "conflit (2).png");
    });
    test("« récemment utilisés » : l'éditeur signale l'usage, le filtre et le tri suivent", async () => {
      const m = await up(adminA, A, "utilise-recemment.png", [170, 171, 172]);
      assert.equal(body(await get(adminA, "/liste.json?utilise=1", A)).items.some((x) => x.id === m.id), false);
      assert.equal(body(await post(adminA, "/utilise", A, { ids: [m.id] })).updated, 1);
      assert.deepEqual(body(await get(adminA, "/liste.json?utilise=1", A)).items.map((x) => x.id), [m.id]);
    });
  });
});
