// Centre de gestion → Ressources : cohérence base de données / stockage.
// Une ressource n'est « disponible » que si sa fiche existe ET que son fichier est réellement sur le serveur ; sinon elle
// est « à traiter » (zone séparée, hors compteurs), avec ses dépendances et l'action sûre (nettoyer / remplacer).
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const bcrypt = require("bcryptjs");
const { startServer, Client, loginInstructor, newStudent } = require("./helpers");

const G = "/formateur/gestion/ressources";
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
const PDF = Buffer.from("%PDF-1.4\n1 0 obj << >> endobj\ntrailer << >>\n%%EOF\n");
let srv, prof, db;

const onDisk = (p) => path.join(srv.dir, "uploads", p.replace(/^\/uploads\//, ""));
const chip = (html, label) => { const m = new RegExp(`>${label}s? <span class="dash-chip-count">(\\d+)<`).exec(html); return m ? Number(m[1]) : null; };
async function upload(name, type, content) {
  const fd = new FormData();
  fd.append("count", "1");
  fd.append("fichiers", new Blob([content], { type }), name);
  return prof.request(G, { method: "POST", multipart: fd });
}
const mediaRow = (title) => db.prepare("SELECT * FROM media WHERE title = ?").get(title);

before(async () => {
  srv = await startServer();
  prof = await loginInstructor(srv);
  db = srv.db();
});
after(async () => { if (srv) await srv.stop(); });

test("1 · envoi d'une image : fichier écrit, fiche créée, visible dans la médiathèque et comptée", async () => {
  const r = await upload("photo-test.png", "image/png", PNG);
  assert.equal(r.status, 302);
  const m = mediaRow("photo-test");
  assert.ok(m, "fiche créée");
  assert.ok(fs.existsSync(onDisk(m.path)), "fichier présent dans le stockage");
  const page = await prof.get(G);
  assert.match(page.text, /photo-test/);
  assert.equal(chip(page.text, "Tous"), 1);
  assert.equal(chip(page.text, "Image"), 1);
});

test("2 · envoi d'un document PDF : vérifié, visible comme document ; un faux PDF est refusé sans laisser de trace", async () => {
  await upload("guide-test.pdf", "application/pdf", PDF);
  const m = mediaRow("guide-test");
  assert.ok(m && m.kind === "document" && fs.existsSync(onDisk(m.path)));
  const page = await prof.get(`${G}?type=document`);
  assert.match(page.text, /guide-test/);
  assert.equal(chip(page.text, "Document"), 1);
  // Le PDF ne pollue pas la médiathèque de l'éditeur d'articles (images, vidéos, audio seulement)
  const editor = JSON.parse((await prof.get("/formateur/blog/api/medias")).text);
  assert.ok(!editor.media.some((x) => x.kind === "document"));

  const before = fs.readdirSync(path.join(srv.dir, "uploads", "blog")).length;
  const fake = await upload("faux.pdf", "application/pdf", Buffer.from("<html>pas un pdf</html>"));
  assert.equal(fake.status, 302);
  assert.match((await prof.get(G)).text, /n&#39;est pas un vrai PDF|n'est pas un vrai PDF/);
  assert.equal(mediaRow("faux"), undefined, "aucune fiche");
  assert.equal(fs.readdirSync(path.join(srv.dir, "uploads", "blog")).length, before, "aucun fichier laissé");
});

test("3 · suppression d'une ressource valide : fichier ET fiche supprimés", async () => {
  await upload("a-supprimer.png", "image/png", PNG);
  const m = mediaRow("a-supprimer");
  const r = await prof.post(`${G}/supprimer`, { cle: `site:${m.id}` });
  assert.equal(r.status, 302);
  assert.equal(mediaRow("a-supprimer"), undefined);
  assert.ok(!fs.existsSync(onDisk(m.path)));
  assert.match((await prof.get(G)).text, /« a-supprimer » supprimé/);
});

test("4 · fichier disparu du stockage : sorti de la médiathèque et des compteurs, nettoyage possible, ne revient pas", async () => {
  await upload("disparu.png", "image/png", PNG);
  const m = mediaRow("disparu");
  fs.rmSync(onDisk(m.path)); // le fichier disparaît (ancien déploiement, suppression manuelle…)
  const lib = await prof.get(G);
  assert.doesNotMatch(lib.text, /disparu/, "absent de la médiathèque principale");
  assert.doesNotMatch(lib.text, /Fichier introuvable/);
  assert.equal(chip(lib.text, "Tous"), 2, "compteur = fichiers réellement disponibles (image + PDF)");
  assert.match(lib.text, /1 fichier\(s\) à traiter/);

  const todo = await prof.get(`${G}?etat=a-traiter`);
  assert.match(todo.text, /disparu/);
  assert.match(todo.text, /Fichier absent du stockage/);
  assert.match(todo.text, /Utilisé nulle part/);
  assert.match(todo.text, /Nettoyer/);

  const clean = await prof.post(`${G}/supprimer`, { cle: `site:${m.id}`, retour: "?etat=a-traiter" });
  assert.equal(clean.location, `${G}?etat=a-traiter`);
  assert.equal(mediaRow("disparu"), undefined, "fiche nettoyée");
  // 8 · après actualisation : aucun retour
  const again = await prof.get(`${G}?etat=a-traiter`);
  assert.doesNotMatch(again.text, /disparu<\/strong>/);
  assert.match(again.text, /Aucun fichier à traiter/);
});

test("5 · ressource encore utilisée : suppression refusée (même forcée), réparation qui remet le fichier en place", async () => {
  await upload("utilisee.png", "image/png", PNG);
  const m = mediaRow("utilisee");
  db.prepare("INSERT INTO posts (title, slug, content, status) VALUES ('Article test', 'article-test', ?, 'draft')").run(`<p><img src="${m.path}"></p>`);
  const lib = await prof.get(`${G}?q=utilisee`);
  assert.match(lib.text, /Suppression impossible : Encore utilisé : Article « Article test »/);
  const forced = await prof.post(`${G}/supprimer`, { cle: `site:${m.id}` });
  assert.equal(forced.status, 302);
  assert.ok(mediaRow("utilisee") && fs.existsSync(onDisk(m.path)), "fiche et fichier conservés");

  fs.rmSync(onDisk(m.path));
  const todo = await prof.get(`${G}?etat=a-traiter`);
  assert.match(todo.text, /Encore utilisé par/);
  assert.match(todo.text, /Article « Article test »/);
  assert.match(todo.text, /Nettoyage impossible/);
  assert.match(todo.text, /Remplacer le fichier/);
  assert.equal((await prof.post(`${G}/supprimer`, { cle: `site:${m.id}` })).status, 302);
  assert.ok(mediaRow("utilisee"), "toujours conservée : l'article la cite");

  // Réparation : mauvais type refusé, bon type accepté au MÊME emplacement
  const bad = new FormData(); bad.append("cle", `site:${m.id}`); bad.append("fichier", new Blob([PDF], { type: "application/pdf" }), "x.pdf");
  await prof.request(`${G}/reparer`, { method: "POST", multipart: bad });
  assert.ok(!fs.existsSync(onDisk(m.path)));
  const good = new FormData(); good.append("cle", `site:${m.id}`); good.append("fichier", new Blob([PNG], { type: "image/png" }), "remplacement.png");
  const rep = await prof.request(`${G}/reparer`, { method: "POST", multipart: good });
  assert.equal(rep.status, 302);
  assert.ok(fs.existsSync(onDisk(m.path)), "fichier remis au même emplacement");
  assert.match((await prof.get(`${G}?etat=a-traiter`)).text, /réparé/);
  assert.match((await prof.get(`${G}?q=utilisee`)).text, /utilisee/, "de retour dans la médiathèque");
  // Une ressource disponible n'est jamais écrasée par une « réparation »
  const again = new FormData(); again.append("cle", `site:${m.id}`); again.append("fichier", new Blob([PNG], { type: "image/png" }), "autre.png");
  await prof.request(`${G}/reparer`, { method: "POST", multipart: again });
  assert.match((await prof.get(G)).text, /n&#39;a pas besoin d&#39;être réparé|n'a pas besoin d'être réparé/);
});

test("6 · envoi en échec : aucune fiche fantôme, aucun fichier orphelin", async () => {
  const dir = path.join(srv.dir, "uploads", "thumbnails");
  const files = fs.readdirSync(dir).length;
  const rows = db.prepare("SELECT COUNT(*) n FROM media").get().n;
  db.exec("CREATE TRIGGER casse_envoi BEFORE INSERT ON media BEGIN SELECT RAISE(ABORT, 'écriture refusée (test)'); END");
  try {
    const r = await upload("echec.png", "image/png", PNG);
    assert.equal(r.status, 302);
    assert.match((await prof.get(G)).text, /L&#39;envoi n&#39;a pas abouti|L'envoi n'a pas abouti/);
  } finally { db.exec("DROP TRIGGER casse_envoi"); }
  assert.equal(db.prepare("SELECT COUNT(*) n FROM media").get().n, rows, "aucune fiche");
  assert.equal(fs.readdirSync(dir).length, files, "aucun fichier laissé dans le stockage");
});

test("7 · adresse invalide : traitée proprement (à traiter, non réparable, nettoyable) ; adresse externe : non signalée", async () => {
  db.prepare("INSERT INTO media (path, kind, mime, size, title) VALUES ('blob:http://localhost/123', 'image', 'image/png', 0, 'adresse-temporaire')").run();
  db.prepare("INSERT INTO media (path, kind, mime, size, title) VALUES ('/uploads/../data/KOYEKOLA.db', 'image', 'image/png', 0, 'chemin-hors-dossier')").run();
  const todo = await prof.get(`${G}?etat=a-traiter`);
  assert.match(todo.text, /adresse-temporaire/);
  assert.match(todo.text, /Adresse invalide/);
  const id = mediaRow("chemin-hors-dossier").id;
  const fd = new FormData(); fd.append("cle", `site:${id}`); fd.append("fichier", new Blob([PNG], { type: "image/png" }), "x.png");
  await prof.request(`${G}/reparer`, { method: "POST", multipart: fd });
  assert.ok(fs.existsSync(path.join(srv.dir, "data", "KOYEKOLA.db")), "jamais d'écriture hors du dossier des envois");
  await prof.post(`${G}/supprimer`, { cle: `site:${id}` });
  assert.equal(mediaRow("chemin-hors-dossier"), undefined, "fiche nettoyée");
  assert.ok(fs.existsSync(path.join(srv.dir, "data", "KOYEKOLA.db")), "la base n'a pas été touchée");
  await prof.post(`${G}/supprimer`, { cle: `site:${mediaRow("adresse-temporaire").id}` });
  assert.equal(mediaRow("adresse-temporaire"), undefined);
  // Adresse externe (autre site) : non vérifiable depuis le serveur → affichée comme telle, jamais « à traiter »
  db.prepare("INSERT INTO media (path, kind, mime, size, title) VALUES ('https://cdn.example.com/logo.png', 'image', 'image/png', 0, 'logo-externe')").run();
  assert.match((await prof.get(`${G}?q=logo-externe`)).text, /adresse externe/);
  assert.doesNotMatch((await prof.get(`${G}?etat=a-traiter`)).text, /logo-externe/);
  db.prepare("DELETE FROM media WHERE title = 'logo-externe'").run();
});

test("9 · compteurs Tous / Images / Vidéos / Audios / Documents = fichiers réellement disponibles", async () => {
  const page = await prof.get(G);
  const avail = db.prepare("SELECT path, kind FROM media").all().filter((m) => fs.existsSync(onDisk(m.path)));
  assert.equal(chip(page.text, "Tous"), avail.length);
  assert.equal(chip(page.text, "Image"), avail.filter((m) => m.kind === "image").length);
  assert.equal(chip(page.text, "Document"), avail.filter((m) => m.kind === "document").length);
  assert.equal(chip(page.text, "Vidéo"), 0);
  assert.equal(chip(page.text, "Audio"), 0);
});

test("10 · modèles d'e-mails : dépendance détectée, modèle jamais modifié, nettoyage par la logique Marketing", async () => {
  const fd = new FormData();
  fd.append("file", new Blob([PNG], { type: "image/png" }), "Bannière.png");
  const up = JSON.parse((await prof.request("/marketing/medias", { method: "POST", multipart: fd })).text).media;
  const org = db.prepare("SELECT organization_id FROM mk_media WHERE id = ?").get(up.id).organization_id;
  const blocks = JSON.stringify([{ type: "image", src: up.path, alt: "" }]);
  const tid = Number(db.prepare("INSERT INTO mk_templates (organization_id, name, blocks) VALUES (?, 'Lettre test', ?)").run(org, blocks).lastInsertRowid);
  fs.rmSync(onDisk(up.path));

  const todo = await prof.get(`${G}?etat=a-traiter&source=marketing`);
  assert.match(todo.text, /Bannière/);
  assert.match(todo.text, new RegExp(`href="/marketing/modeles/${tid}"`));
  assert.match(todo.text, /Nettoyage impossible/);
  await prof.post(`${G}/supprimer`, { cle: `marketing:${up.id}` });
  assert.ok(db.prepare("SELECT id FROM mk_media WHERE id = ?").get(up.id), "fiche conservée : le modèle l'utilise");
  assert.equal(db.prepare("SELECT blocks FROM mk_templates WHERE id = ?").get(tid).blocks, blocks, "modèle intact");
  assert.equal((await prof.get(`/marketing/modeles/${tid}`)).status, 200, "le modèle s'ouvre toujours");

  // Réparation au même emplacement → le modèle retrouve son image
  const rep = new FormData(); rep.append("cle", `marketing:${up.id}`); rep.append("fichier", new Blob([PNG], { type: "image/png" }), "b.png");
  await prof.request(`${G}/reparer`, { method: "POST", multipart: rep });
  assert.ok(fs.existsSync(onDisk(up.path)));
  assert.equal((await prof.get(up.path)).status, 200, "image de nouveau servie");

  // Plus utilisée par aucun modèle → suppression possible depuis le Centre de gestion (logique et journal Marketing)
  db.prepare("UPDATE mk_templates SET blocks = '[]' WHERE id = ?").run(tid);
  await prof.post(`${G}/supprimer`, { cle: `marketing:${up.id}` });
  assert.equal(db.prepare("SELECT id FROM mk_media WHERE id = ?").get(up.id), undefined);
  assert.ok(!fs.existsSync(onDisk(up.path)));
  assert.ok(db.prepare("SELECT 1 FROM mk_audit_logs WHERE action = 'media.deleted'").get(), "suppression tracée par le module Marketing");
  assert.equal((await prof.get("/marketing/modeles")).status, 200);
});

test("16 · sécurité : élève refusé, formateur sans rôle Marketing refusé, clé inconnue sans effet", async () => {
  await upload("protegee.png", "image/png", PNG);
  const m = mediaRow("protegee");
  const eleve = await newStudent(srv);
  assert.equal((await eleve.post(`${G}/supprimer`, { cle: `site:${m.id}` })).status, 403);
  const fd = new FormData(); fd.append("cle", `site:${m.id}`); fd.append("fichier", new Blob([PNG], { type: "image/png" }), "x.png");
  assert.equal((await eleve.request(`${G}/reparer`, { method: "POST", multipart: fd })).status, 403);
  assert.ok(mediaRow("protegee"));

  const mfd = new FormData(); mfd.append("file", new Blob([PNG], { type: "image/png" }), "m.png");
  const mk = JSON.parse((await prof.request("/marketing/medias", { method: "POST", multipart: mfd })).text).media;
  db.prepare("INSERT INTO users (username, email, password_hash, role) VALUES ('Second', 'second@test.local', ?, 'formateur')").run(bcrypt.hashSync("MotDePasseSecond123", 4));
  db.prepare("DELETE FROM mk_org_members WHERE user_id = (SELECT id FROM users WHERE email = 'second@test.local')").run();
  const second = await new Client(srv.base).login("second@test.local", "MotDePasseSecond123");
  await second.post(`${G}/supprimer`, { cle: `marketing:${mk.id}` });
  assert.ok(db.prepare("SELECT id FROM mk_media WHERE id = ?").get(mk.id), "médiathèque marketing protégée");

  const r = await prof.post(`${G}/supprimer`, { cle: "site:999999" });
  assert.equal(r.status, 302);
  assert.equal((await prof.post(`${G}/supprimer`, { cle: "../../etc" })).status, 302);
});
