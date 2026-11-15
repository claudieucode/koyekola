// Médiathèque, lot 2 : sections de la barre latérale, dossiers intelligents et recherches enregistrées, ordre et copie des dossiers, historique, seuils de stockage.
// VRAI serveur, vraies requêtes, droits et isolation entre sites.
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

describe("médiathèque : organisation (lot 2)", () => {
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

  describe("préférences : sections de la barre latérale et colonnes", () => {
    test("ordre et masquage enregistrés ; « organisation » ne se masque pas ; clés inconnues ignorées ; l'ordre des colonnes est conservé", async () => {
      const r = await post(adminA, "/preferences", A, { sections: { order: ["tags", "types", "inconnue", "tags"], hidden: ["collections", "organisation", "nimporte"] }, columns: ["size", "type", "bidon", "size"] });
      assert.equal(r.status, 200);
      const p = body(await get(adminA, "/preferences.json", A)).prefs;
      assert.equal(p.sections.order[0], "tags"); assert.equal(p.sections.order[1], "types");
      assert.equal(new Set(p.sections.order).size, 9, "toutes les sections présentes, sans doublon");
      assert.deepEqual(p.sections.hidden, ["collections"]);
      assert.deepEqual(p.columns, ["size", "type"]);
    });
  });

  describe("dossiers intelligents et recherches enregistrées", () => {
    test("un dossier intelligent est partagé par le site, une recherche est personnelle ; critères validés ; modifiable ; aucun fichier déplacé", async () => {
      const f = body(await post(adminA, "/dossiers", A, { name: "Réel" })).folder; const m = await up(adminA, A, "grand.png", [5, 5, 5], { dossier: f.id });
      const r = await post(adminA, "/vues", A, { kind: "smart", name: "Images PNG", criteria: { ext: "png", type: "image", tmin: "0", sql: "1; DROP TABLE x", tmax: "abc" } });
      assert.equal(r.status, 201); const v = body(r).view;
      assert.deepEqual(v.criteria, { type: "image", ext: "png", tmin: "0" }, "critères filtrés : clés et valeurs inconnues ignorées");
      assert.equal((await post(adminA, "/vues", A, { kind: "smart", name: "Images PNG", criteria: { ext: "png" } })).status, 409, "nom unique");
      assert.equal((await post(adminA, "/vues", A, { kind: "smart", name: "Vide", criteria: {} })).status, 422, "au moins un critère");
      // partagé : l'éditeur du même site la voit
      assert.ok(body(await get(editorA, "/vues.json", A)).items.some((x) => x.id === v.id));
      // une recherche personnelle n'est visible que de son auteur
      const s = body(await post(editorA, "/vues", A, { kind: "search", name: "Ma recherche", criteria: { q: "plage" } })).view;
      assert.ok(body(await get(editorA, "/vues.json", A)).items.some((x) => x.id === s.id));
      assert.ok(!body(await get(adminA, "/vues.json", A)).items.some((x) => x.id === s.id), "recherche personnelle invisible aux autres");
      assert.equal((await post(adminA, `/vues/${s.id}/supprimer`, A, {})).status, 404, "on ne supprime pas la recherche d'un autre");
      // droits : un lecteur ne crée pas de dossier intelligent partagé mais peut enregistrer une recherche
      assert.equal((await post(viewerA, "/vues", A, { kind: "smart", name: "Non", criteria: { q: "x" } })).status, 403);
      assert.equal((await post(viewerA, "/vues", A, { kind: "search", name: "Ma lecture", criteria: { q: "x" } })).status, 201);
      assert.equal((await post(viewerA, `/vues/${v.id}`, A, { name: "Piraté" })).status, 403, "lecteur ne modifie pas un dossier partagé");
      // modifier les critères après coup
      const u = await post(adminA, `/vues/${v.id}`, A, { name: "PNG lourds", criteria: { ext: "png", volumineux: "1" } });
      assert.equal(u.status, 200); assert.deepEqual(body(u).view.criteria, { ext: "png", volumineux: "1" }); assert.equal(body(u).view.name, "PNG lourds");
      // la vue ne déplace rien
      assert.equal(one("SELECT folder_id f FROM mk_media WHERE id = ?", m.id).f, f.id);
      // isolation : l'autre site ne voit rien ni ne peut agir dessus
      assert.ok(!body(await get(adminB, "/vues.json", B)).items.some((x) => x.id === v.id));
      assert.equal((await post(adminB, `/vues/${v.id}`, B, { name: "X" })).status, 404);
      assert.equal((await post(adminB, `/vues/${v.id}/supprimer`, B, {})).status, 404);
      // suppression : la vue disparaît, les fichiers restent
      assert.equal((await post(adminA, `/vues/${v.id}/supprimer`, A, {})).status, 200);
      assert.ok(one("SELECT 1 x FROM mk_media WHERE id = ?", m.id));
    });
    test("la page de la médiathèque liste les vues de la personne dans la barre latérale", async () => {
      await post(adminA, "/vues", A, { kind: "smart", name: "Photos récentes", criteria: { periode: "7" } });
      const html = (await adminA.get(`/marketing/site-web/sites/${A}/medias`)).text;
      assert.match(html, /Photos récentes/);
      assert.match(html, /data-mx-smart=/);
    });
  });

  describe("ordre manuel et copie des dossiers", () => {
    test("monter / descendre entre frères, sans effet entre sites ; l'ordre apparaît dans l'arbre", async () => {
      const mk = async (name, parent) => body(await post(adminA, "/dossiers", A, { name, parent_id: parent })).folder.id;
      const parent = await mk("Animaux", null);
      const x = await mk("Zèbre", parent), y = await mk("Abeille", parent), z = await mk("Mouton", parent);
      const order = async () => body(await get(adminA, "/dossiers.json", A)).folders.filter((f) => [x, y, z].includes(f.id)).map((f) => f.id);
      assert.deepEqual(await order(), [y, z, x], "ordre alphabétique par défaut");
      assert.equal(body(await post(adminA, `/dossiers/${x}/ordre`, A, { dir: "up" })).moved, true);
      assert.deepEqual(await order(), [y, x, z]);
      assert.equal(body(await post(adminA, `/dossiers/${y}/ordre`, A, { dir: "up" })).moved, false, "déjà premier");
      assert.equal((await post(adminA, `/dossiers/${x}/ordre`, A, { dir: "n'importe" })).status, 422);
      assert.equal((await post(adminB, `/dossiers/${x}/ordre`, B, { dir: "down" })).status, 404, "dossier d'un autre site");
      assert.equal((await post(viewerA, `/dossiers/${x}/ordre`, A, { dir: "down" })).status, 403);
    });
    test("copier un dossier : sous-dossiers et fichiers copiés (nouveaux fichiers), original intact, nom unique, droits et isolation", async () => {
      const root = body(await post(adminA, "/dossiers", A, { name: "Drapeau" })).folder; const sub = body(await post(adminA, "/dossiers", A, { name: "Logos", parent_id: root.id })).folder;
      const m1 = await up(adminA, A, "d1.png", [40, 41, 42], { dossier: root.id }), m2 = await up(adminA, A, "d2.png", [43, 44, 45], { dossier: sub.id });
      const r = await post(adminA, `/dossiers/${root.id}/copier`, A, {}); assert.equal(r.status, 201);
      const out = body(r); assert.equal(out.folder.name, "Drapeau (copie)"); assert.equal(out.copiedFiles, 2); assert.equal(out.subfolders, 1); assert.deepEqual(out.failures, []);
      const newSub = one("SELECT id FROM mk_media_folders WHERE parent_id = ? AND name = 'Logos'", out.folder.id); assert.ok(newSub, "sous-dossier recréé");
      const copied = db.prepare("SELECT id, name, path FROM mk_media WHERE folder_id IN (?, ?) ORDER BY name").all(out.folder.id, newSub.id);
      assert.deepEqual(copied.map((c) => c.name), ["d1.png", "d2.png"], "les fichiers gardent leur nom");
      assert.ok(copied.every((c) => ![m1.path, m2.path].includes(c.path)), "nouveaux fichiers, nouvelles adresses");
      assert.equal(one("SELECT folder_id f FROM mk_media WHERE id = ?", m1.id).f, root.id, "original intact");
      assert.equal(body(await post(adminA, `/dossiers/${root.id}/copier`, A, {})).folder.name, "Drapeau (copie 2)", "nom unique");
      assert.equal((await post(adminB, `/dossiers/${root.id}/copier`, B, {})).status, 404, "dossier d'un autre site");
      assert.equal((await post(viewerA, `/dossiers/${root.id}/copier`, A, {})).status, 403);
    });
  });

  describe("historique", () => {
    test("les opérations apparaissent avec la personne, la cible et un libellé ; filtre par action ; pagination ; réservé à ceux qui gèrent les médias ; limité au site", async () => {
      const f = body(await post(adminA, "/dossiers", A, { name: "Historique test" })).folder;
      await post(adminA, `/dossiers/${f.id}`, A, { name: "Historique renommé" });
      const h = body(await get(adminA, "/historique.json", A));
      const item = h.items.find((i) => i.action === "media.folder_renamed" && i.target === "Historique renommé");
      assert.ok(item, "renommage listé avec le nouveau nom"); assert.equal(item.label, "Dossier renommé"); assert.ok(item.user);
      const only = body(await get(adminA, "/historique.json?action=media.folder_created", A)); assert.ok(only.items.length && only.items.every((i) => i.action === "media.folder_created"));
      const p1 = body(await get(adminA, "/historique.json?limite=2", A)); assert.equal(p1.items.length, 2); assert.ok(p1.next);
      const p2 = body(await get(adminA, `/historique.json?limite=2&avant=${p1.next}`, A)); assert.ok(p2.items.every((i) => i.id < p1.next));
      assert.equal((await get(viewerA, "/historique.json", A)).status, 403);
      assert.ok(!body(await get(adminB, "/historique.json", B)).items.some((i) => i.target === "Historique renommé"), "pas d'événement d'un autre site");
    });
  });

  describe("alertes de stockage", () => {
    test("seuils par médiathèque : sans seuil aucune alerte ; avertissement puis critique selon la taille réelle ; validation ; droits ; isolation", async () => {
      await up(adminA, A, "stock1.png", [90, 91, 92]);
      let s = body(await get(adminA, "/stockage.json", A)); assert.equal(s.alerts.level, "ok"); assert.equal(s.alerts.warnMb, 0);
      assert.equal((await post(adminA, "/stockage/alertes", A, { warn_mb: "10", crit_mb: "5" })).status, 422, "avertissement < critique");
      assert.equal((await post(adminA, "/stockage/alertes", A, { warn_mb: "abc", crit_mb: "" })).status, 422);
      assert.equal((await post(viewerA, "/stockage/alertes", A, { warn_mb: "1" })).status, 403);
      // un seuil minuscule est dépassé par un vrai fichier : on simule en lisant la taille réelle (> 0 octet) avec des seuils de 1 Mo → ok, puis seuil via base pour tester le niveau
      assert.equal((await post(adminA, "/stockage/alertes", A, { warn_mb: "1", crit_mb: "2" })).status, 200);
      s = body(await get(adminA, "/stockage.json", A)); assert.equal(s.alerts.warnMb, 1); assert.equal(s.alerts.critMb, 2); assert.equal(s.alerts.level, "ok", "un petit fichier ne déclenche rien");
      db.prepare("UPDATE mk_media SET size = ? WHERE organization_id = ? AND site_id = ? AND name = 'stock1.png'").run(1.5 * 1048576, orgId, A);
      s = body(await get(adminA, "/stockage.json", A)); assert.equal(s.alerts.level, "warn");
      db.prepare("UPDATE mk_media SET size = ? WHERE organization_id = ? AND site_id = ? AND name = 'stock1.png'").run(3 * 1048576, orgId, A);
      s = body(await get(adminA, "/stockage.json", A)); assert.equal(s.alerts.level, "crit");
      assert.equal(body(await get(adminB, "/stockage.json", B)).alerts.warnMb, 0, "les seuils d'un site ne s'appliquent pas à l'autre");
    });
  });
});
