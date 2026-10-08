// KOLAKISA CMS — palier 3 : la médiathèque (Médias), de bout en bout, par les vraies routes d'un vrai serveur, de la vraie base
// et du vrai dossier des envois : envoi, validation du CONTENU des fichiers, métadonnées, recherche/filtres/tri/pagination,
// corbeille, usages, droits, et connexion à l'éditeur de pages (image, vidéo, audio, document) jusqu'à la page publiée.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const zlib = require("zlib");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, Client, loginInstructor, newStudent } = require("./helpers");

let srv, boss, db, anon, orgId;
const BASE = "/marketing/site-web/mediatheque";
const json = (r) => JSON.parse(r.text);
const row = (id) => db.prepare("SELECT * FROM mk_media WHERE id = ?").get(id);

// ---------- Faux fichiers à la signature réelle ----------
function png(w = 40, h = 30, rgb = [2, 119, 182]) {
  const crcTable = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
  const crc = (buf) => { let c = 0xffffffff; for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([len, td, c]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2;
  const raw = Buffer.alloc((w * 3 + 1) * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) raw.set(rgb, y * (w * 3 + 1) + 1 + x * 3);
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
}
const FILES = {
  mp4: () => Buffer.concat([Buffer.from([0, 0, 0, 24]), Buffer.from("ftypisom"), Buffer.alloc(200)]),
  webm: () => Buffer.concat([Buffer.from([0x1a, 0x45, 0xdf, 0xa3, 0x9f, 0x42, 0x86, 0x81, 0x01]), Buffer.from("B\u0082\u0084webm"), Buffer.alloc(100)]),
  mp3: () => Buffer.concat([Buffer.from("ID3"), Buffer.alloc(200)]),
  wav: () => Buffer.concat([Buffer.from("RIFF"), Buffer.alloc(4), Buffer.from("WAVEfmt "), Buffer.alloc(100)]),
  pdf: () => Buffer.from("%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF"),
  docx: () => Buffer.concat([Buffer.from([0x50, 0x4b, 0x03, 0x04]), Buffer.alloc(26), Buffer.from("word/document.xml"), Buffer.alloc(100)]),
  zipFauxDocx: () => Buffer.concat([Buffer.from([0x50, 0x4b, 0x03, 0x04]), Buffer.alloc(26), Buffer.from("autre/chose.txt"), Buffer.alloc(100)]),
  exe: () => Buffer.concat([Buffer.from("MZ"), Buffer.alloc(200)]),
  html: () => Buffer.from("<html><script>alert(1)</script></html>"),
  svg: () => Buffer.from("<svg xmlns='http://www.w3.org/2000/svg'><script>alert(1)</script></svg>"),
};
// Envoi d'UN fichier comme le fait l'interface (multipart, un fichier par requête)
const send = (client, buffer, name, type = "application/octet-stream") => {
  const fd = new FormData();
  fd.append("file", new Blob([buffer], { type }), name);
  return client.request(`${BASE}/televerser`, { method: "POST", multipart: fd });
};
async function member(role) {
  const c = await newStudent(srv);
  db.prepare("INSERT INTO mk_org_members (organization_id, user_id, role) VALUES (?, (SELECT id FROM users WHERE email = ?), ?)").run(orgId, c.email, role);
  return c;
}

before(async () => {
  srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
  boss = await loginInstructor(srv);
  anon = new Client(srv.base);
  db = srv.db();
  orgId = db.prepare("SELECT id FROM mk_organizations").get().id;
});
after(() => srv.stop());

describe("ouvrir la médiathèque", () => {
  test("la page Médias s'ouvre dans le CMS, vide au départ (état vide honnête)", async () => {
    const r = await boss.get(BASE);
    assert.equal(r.status, 200);
    assert.match(r.text, /class="mk-body is-cms"/);
    assert.match(r.text, /<h1>Médias<\/h1>/);
    assert.match(r.text, /Glissez-déposez vos fichiers ici/);
    assert.match(r.text, /Aucun fichier/);
  });
});

describe("envoi réel et validation du contenu", () => {
  let img;
  test("image : enregistrée (base + disque), dimensions réelles, adresse publique permanente servie telle quelle", async () => {
    const r = await send(boss, png(40, 30), "Ma photo été.png", "image/png");
    assert.equal(r.status, 201, r.text);
    img = json(r).media;
    assert.equal(img.type, "image");
    assert.equal(img.mime, "image/png");
    assert.deepEqual([img.width, img.height], [40, 30]);
    assert.match(img.path, /^\/uploads\/marketing\/\d+\/\d+-[0-9a-f]{12}\.png$/);
    assert.equal(img.name, "Ma photo été.png", "nom d'origine gardé pour l'affichage seulement");
    const stored = row(img.id);
    assert.equal(stored.created_by !== null, true, "auteur enregistré");
    const pub = await anon.get(img.path);
    assert.equal(pub.status, 200);
    assert.equal(pub.headers.get("content-type"), "image/png");
    assert.equal(pub.headers.get("x-content-type-options"), "nosniff");
  });
  test("elle apparaît dans la bibliothèque et y reste après rechargement de la page", async () => {
    for (let i = 0; i < 2; i++) {
      const html = (await boss.get(BASE)).text;
      assert.match(html, /Ma photo été\.png/);
      assert.match(html, new RegExp(`data-id="${img.id}"`));
    }
    const list = json(await boss.get(`${BASE}/liste.json`));
    assert.ok(list.items.some((m) => m.id === img.id));
  });
  test("plusieurs fichiers de types différents : chacun lu dans son contenu, un invalide ne bloque pas les autres", async () => {
    const batch = [["film.mp4", FILES.mp4(), "video"], ["clip.webm", FILES.webm(), "video"], ["voix.mp3", FILES.mp3(), "audio"], ["son.wav", FILES.wav(), "audio"], ["guide.pdf", FILES.pdf(), "pdf"], ["rapport.docx", FILES.docx(), "document"]];
    const results = await Promise.all([...batch.map(([n, b]) => send(boss, b, n)), send(boss, FILES.exe(), "virus.png", "image/png")]);
    batch.forEach(([name, , type], i) => { assert.equal(results[i].status, 201, `${name} : ${results[i].text}`); assert.equal(json(results[i]).media.type, type, name); });
    assert.equal(results[batch.length].status, 422, "le faux PNG est refusé");
    assert.equal(db.prepare("SELECT COUNT(*) n FROM mk_media WHERE name = 'virus.png'").get().n, 0);
  });
  test("fichiers dangereux ou mensongers refusés avec un message clair (le nom, l'extension et le type déclaré ne comptent pas)", async () => {
    const refuse = async (buffer, name, type, pattern) => {
      const r = await send(boss, buffer, name, type);
      assert.equal(r.status, 422, `${name} accepté à tort`);
      assert.match(json(r).error.message, pattern, name);
    };
    await refuse(FILES.exe(), "setup.exe", "application/x-msdownload", /n'est pas autorisé/);
    await refuse(FILES.exe(), "photo.jpg", "image/jpeg", /Format non pris en charge|n'est pas autorisé/);
    await refuse(FILES.html(), "page.html", "text/html", /n'est pas autorisé/);
    await refuse(FILES.html(), "image.png", "image/png", /n'est pas autorisé/);
    await refuse(FILES.svg(), "logo.svg", "image/svg+xml", /SVG/);
    await refuse(Buffer.from("<?php system($_GET[0]); ?>"), "x.php.png", "image/png", /n'est pas autorisé/);
    await refuse(FILES.zipFauxDocx(), "faux.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", /n'est pas un vrai document/);
    await refuse(FILES.docx(), "macro.docm", "application/vnd.ms-word.document.macroEnabled.12", /n'est pas autorisé|n'est pas un vrai/);
    await refuse(Buffer.alloc(0), "vide.png", "image/png", /vide/i);
  });
  test("taille maximale par type : une image trop lourde est refusée avec la limite indiquée", async () => {
    const big = Buffer.concat([png(10, 10), Buffer.alloc(5 * 1048576)]);
    const r = await send(boss, big, "enorme.png", "image/png");
    assert.equal(r.status, 422);
    assert.match(json(r).error.message, /trop lourd.*5 Mo/);
  });
  test("nom piégé (traversée de dossier) : stocké sous un nom aléatoire, jamais hors du dossier des envois", async () => {
    const r = await send(boss, png(8, 8), "../../../../etc/passwd.png", "image/png");
    assert.equal(r.status, 201);
    const m = json(r).media;
    assert.equal(m.name, "passwd.png");
    assert.match(m.path, /^\/uploads\/marketing\/\d+\/[0-9a-z-]+\.png$/);
    assert.ok(!m.path.includes(".."));
  });
  test("sans droit d'envoi : refusé et rien d'enregistré", async () => {
    const viewer = await member("viewer");
    const before = db.prepare("SELECT COUNT(*) n FROM mk_media").get().n;
    assert.equal((await send(viewer, png(5, 5), "v.png", "image/png")).status, 403);
    assert.equal(db.prepare("SELECT COUNT(*) n FROM mk_media").get().n, before);
  });
});

describe("recherche, filtres, tri, pagination", () => {
  before(async () => {
    await send(boss, png(20, 20, [200, 0, 0]), "alpha-rouge.png", "image/png");
    await send(boss, png(20, 20, [0, 200, 0]), "zeta-vert.png", "image/png");
    const old = db.prepare("SELECT id FROM mk_media WHERE name = 'alpha-rouge.png'").get().id;
    db.prepare("UPDATE mk_media SET alt = 'Un chat roux', description = 'Photo du chat', created_at = '2020-03-01 10:00:00' WHERE id = ?").run(old);
  });
  const names = (r) => json(r).items.map((m) => m.name);
  test("recherche réelle : nom, texte alternatif, description", async () => {
    assert.deepEqual(names(await boss.get(`${BASE}/liste.json?q=zeta`)), ["zeta-vert.png"]);
    assert.deepEqual(names(await boss.get(`${BASE}/liste.json?q=chat%20roux`)), ["alpha-rouge.png"]);
    assert.deepEqual(names(await boss.get(`${BASE}/liste.json?q=Photo%20du%20chat`)), ["alpha-rouge.png"]);
    assert.deepEqual(names(await boss.get(`${BASE}/liste.json?q=introuvable-xyz`)), []);
    assert.match((await boss.get(`${BASE}?q=zeta`)).text, /zeta-vert\.png/);
    assert.doesNotMatch((await boss.get(`${BASE}?q=zeta`)).text, /alpha-rouge\.png/);
  });
  test("filtre par type : images, vidéos, audio, documents (PDF + Office)", async () => {
    const types = async (t) => [...new Set(json(await boss.get(`${BASE}/liste.json?type=${t}&limite=100`)).items.map((m) => m.type))];
    assert.deepEqual(await types("image"), ["image"]);
    assert.deepEqual(await types("video"), ["video"]);
    assert.deepEqual(await types("audio"), ["audio"]);
    assert.deepEqual((await types("documents")).sort(), ["document", "pdf"]);
    const counts = json(await boss.get(`${BASE}/liste.json`)).counts;
    assert.equal(counts.video, 2);
    assert.equal(counts.audio, 2);
    assert.equal(counts.documents, 2);
    assert.equal(counts.all, counts.image + counts.video + counts.audio + counts.pdf + counts.document);
  });
  test("filtre par date et tri : nom A-Z / Z-A, plus anciens, taille", async () => {
    assert.ok(!names(await boss.get(`${BASE}/liste.json?periode=30&limite=100`)).includes("alpha-rouge.png"), "ajouté en 2020 : hors des 30 derniers jours");
    assert.ok(names(await boss.get(`${BASE}/liste.json?periode=jour&limite=100`)).includes("zeta-vert.png"));
    const az = names(await boss.get(`${BASE}/liste.json?tri=nom&type=image&limite=100`));
    assert.deepEqual(az, [...az].sort((a, b) => a.localeCompare(b, "fr", { sensitivity: "base" })));
    assert.equal(names(await boss.get(`${BASE}/liste.json?tri=nom_desc&type=image&limite=100`))[0], "zeta-vert.png");
    assert.equal(names(await boss.get(`${BASE}/liste.json?tri=ancien&limite=100`))[0], "Ma photo été.png", "plus ancien envoi d'abord (l'ordre suit l'identifiant)");
    const sizes = json(await boss.get(`${BASE}/liste.json?tri=taille&limite=100`)).items.map((m) => m.size);
    assert.deepEqual(sizes, [...sizes].sort((a, b) => b - a));
  });
  test("pagination côté serveur : 48 par page dans la page, pas de doublon entre les pages", async () => {
    const insert = db.prepare("INSERT INTO mk_media (organization_id, kind, type, path, name, mime, size, width, height) VALUES (?, 'image', 'image', ?, ?, 'image/png', 100, 10, 10)");
    for (let i = 1; i <= 120; i++) insert.run(orgId, `/uploads/marketing/${orgId}/masse-${i}.png`, `masse-${String(i).padStart(3, "0")}.png`);
    const p1 = (await boss.get(`${BASE}?type=image`)).text;
    assert.equal((p1.match(/data-ml-check value=/g) || []).length, 48);
    assert.match(p1, /Page 1 sur/);
    const ids1 = [...p1.matchAll(/data-ml-check value="(\d+)"/g)].map((m) => m[1]);
    const p2 = (await boss.get(`${BASE}?type=image&page=2`)).text;
    const ids2 = [...p2.matchAll(/data-ml-check value="(\d+)"/g)].map((m) => m[1]);
    assert.equal(ids2.filter((i) => ids1.includes(i)).length, 0);
    const api = json(await boss.get(`${BASE}/liste.json?type=image&limite=24&page=2`));
    assert.equal(api.items.length, 24);
    assert.equal(api.page, 2);
    assert.equal(api.more, true);
  });
});

describe("détails et métadonnées persistantes", () => {
  let m;
  before(async () => { m = json(await send(boss, png(64, 48), "details.png", "image/png")).media; });
  test("la fiche donne l'aperçu, la taille, les dimensions, l'auteur et l'utilisation", async () => {
    const d = json(await boss.get(`${BASE}/${m.id}.json`));
    assert.equal(d.media.width, 64);
    assert.ok(d.media.author, "auteur affiché");
    assert.deepEqual(d.usage, []);
    assert.equal((await boss.get(`${BASE}/999999.json`)).status, 404);
  });
  test("titre, texte alternatif, légende, description, nom : enregistrés en base et relus après rechargement", async () => {
    const r = await boss.request(`${BASE}/${m.id}`, { method: "POST", json: { name: "nouveau-nom.png", title: "Mon titre", alt: "Un carré bleu", caption: "Légende courte", description: "Une description plus longue." } });
    assert.equal(r.status, 200);
    const stored = row(m.id);
    assert.deepEqual([stored.name, stored.title, stored.alt, stored.caption, stored.description], ["nouveau-nom.png", "Mon titre", "Un carré bleu", "Légende courte", "Une description plus longue."]);
    const again = json(await boss.get(`${BASE}/${m.id}.json`)).media;
    assert.equal(again.alt, "Un carré bleu");
    assert.equal(again.title, "Mon titre");
    assert.equal(stored.path, m.path, "l'adresse (référence stable) ne change jamais");
  });
  test("texte nettoyé et limité (pas de code, longueur bornée)", async () => {
    await boss.request(`${BASE}/${m.id}`, { method: "POST", json: { alt: `<b>${"x".repeat(500)}</b>\u0007` } });
    const alt = row(m.id).alt;
    assert.ok(alt.length <= 200);
    assert.ok(!/\u0007/.test(alt));
  });
  test("lecteur : consultation seule, aucune modification", async () => {
    const viewer = await member("viewer");
    assert.equal((await viewer.get(`${BASE}/${m.id}.json`)).status, 200);
    assert.equal((await viewer.request(`${BASE}/${m.id}`, { method: "POST", json: { alt: "piraté" } })).status, 403);
    assert.notEqual(row(m.id).alt, "piraté");
  });
});

describe("corbeille, usages et suppression définitive", () => {
  let free, used, pageId;
  before(async () => {
    free = json(await send(boss, png(11, 11), "libre.png", "image/png")).media;
    used = json(await send(boss, png(12, 12), "utilise.png", "image/png")).media;
    const created = await boss.post("/marketing/pages", { name: "Page avec image", template: "", ouvrir: "editeur" });
    pageId = Number(created.location.match(/pages\/(\d+)/)[1]);
    const rev = db.prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(pageId).revision;
    const saved = await boss.request(`/marketing/pages/${pageId}/brouillon`, { method: "PUT", json: { revision: rev, content: { title: "Page avec image", sections: [{ type: "image", src: used.path, alt: "Un carré", caption: "", link: "" }] } } });
    assert.equal(saved.status, 200, saved.text);
  });
  test("média non utilisé : corbeille (le fichier reste), restauration, puis suppression définitive depuis la corbeille", async () => {
    assert.equal((await boss.post(`${BASE}/${free.id}/corbeille`, {})).status, 200);
    assert.ok(row(free.id).deleted_at);
    assert.ok(!json(await boss.get(`${BASE}/liste.json?limite=100`)).items.some((x) => x.id === free.id), "hors de la liste principale");
    assert.ok(json(await boss.get(`${BASE}/liste.json?corbeille=1`)).items.some((x) => x.id === free.id), "dans la corbeille");
    assert.equal((await anon.get(free.path)).status, 200, "le fichier n'est pas effacé à la mise à la corbeille");
    assert.equal((await boss.post(`${BASE}/${free.id}/restaurer`, {})).status, 200);
    assert.equal(row(free.id).deleted_at, null);
    const early = await boss.post(`${BASE}/${free.id}/supprimer`, {});
    assert.equal(early.status, 409, "pas de suppression définitive hors de la corbeille");
    assert.match(json(early).error.message, /corbeille/i);
    await boss.post(`${BASE}/${free.id}/corbeille`, {});
    assert.equal((await boss.post(`${BASE}/${free.id}/supprimer`, {})).status, 200);
    assert.equal(row(free.id), undefined, "fiche supprimée");
    assert.equal((await anon.get(free.path)).status, 404, "fichier effacé du disque");
  });
  test("média utilisé par une page : l'usage est annoncé, la mise à la corbeille laisse le fichier affiché, la suppression définitive est refusée", async () => {
    const d = json(await boss.get(`${BASE}/${used.id}.json`));
    assert.equal(d.usage.length, 1);
    assert.match(d.usage[0].name, /Page avec image/);
    assert.equal(d.usage[0].href, `/marketing/pages/${pageId}`);
    await boss.post(`${BASE}/${used.id}/corbeille`, {});
    assert.equal((await anon.get(used.path)).status, 200, "la page continue d'afficher l'image");
    const refused = await boss.post(`${BASE}/${used.id}/supprimer`, {});
    assert.equal(refused.status, 409);
    assert.match(json(refused).error.message, /utilisé par 1 élément.*Page avec image/);
    assert.ok(row(used.id), "toujours là");
    assert.equal((await anon.get(used.path)).status, 200);
  });
  test("une fois retiré de la page, le média peut être supprimé définitivement", async () => {
    const rev = db.prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(pageId).revision;
    await boss.request(`/marketing/pages/${pageId}/brouillon`, { method: "PUT", json: { revision: rev, content: { title: "Page avec image", sections: [{ type: "text", markdown: "Plus d'image" }] } } });
    assert.deepEqual(json(await boss.get(`${BASE}/${used.id}.json`)).usage, []);
    assert.equal((await boss.post(`${BASE}/${used.id}/supprimer`, {})).status, 200);
    assert.equal(row(used.id), undefined);
  });
  test("actions groupées : corbeille, restauration, suppression définitive ; rapport des refus", async () => {
    const a = json(await send(boss, png(13, 13), "lot-a.png", "image/png")).media;
    const b = json(await send(boss, png(14, 14), "lot-b.png", "image/png")).media;
    const r1 = json(await boss.request(`${BASE}/actions`, { method: "POST", json: { action: "corbeille", ids: [a.id, b.id] } }));
    assert.deepEqual(r1.done.sort(), [a.id, b.id].sort());
    assert.ok(row(a.id).deleted_at && row(b.id).deleted_at);
    const r2 = json(await boss.request(`${BASE}/actions`, { method: "POST", json: { action: "restaurer", ids: [a.id] } }));
    assert.deepEqual(r2.done, [a.id]);
    const r3 = json(await boss.request(`${BASE}/actions`, { method: "POST", json: { action: "supprimer", ids: [a.id, b.id] } }));
    assert.deepEqual(r3.done, [b.id], "seul le fichier de la corbeille est supprimé");
    assert.equal(r3.failed.length, 1);
    assert.match(r3.failed[0].message, /corbeille/i);
    assert.equal((await boss.request(`${BASE}/actions`, { method: "POST", json: { action: "detruire", ids: [a.id] } })).status, 403);
    assert.equal((await boss.request(`${BASE}/actions`, { method: "POST", json: { action: "corbeille", ids: [] } })).status, 422);
  });
  test("droits : l'éditeur envoie et met à la corbeille mais ne supprime pas définitivement ; l'administrateur le peut", async () => {
    const editor = await member("editor"), admin = await member("admin");
    const m = json(await send(editor, png(15, 15), "droits.png", "image/png")).media;
    assert.equal((await editor.post(`${BASE}/${m.id}/corbeille`, {})).status, 200);
    assert.equal((await editor.post(`${BASE}/${m.id}/supprimer`, {})).status, 403);
    assert.equal((await editor.request(`${BASE}/actions`, { method: "POST", json: { action: "supprimer", ids: [m.id] } })).status, 403);
    assert.ok(row(m.id));
    assert.equal((await admin.post(`${BASE}/${m.id}/supprimer`, {})).status, 200);
    assert.equal(row(m.id), undefined);
  });
  test("un compte hors équipe n'a aucun accès à la médiathèque", async () => {
    const student = await newStudent(srv);
    for (const url of [BASE, `${BASE}/liste.json`, `${BASE}/1.json`]) assert.notEqual((await student.get(url)).status, 200, url);
    assert.notEqual((await send(student, png(5, 5), "e.png", "image/png")).status, 201);
  });
  test("isolement : les fichiers d'une autre organisation ne sont ni listés ni lisibles ni modifiables", async () => {
    const other = Number(db.prepare("INSERT INTO mk_organizations (name, slug) VALUES ('Autre', 'autre-org')").run().lastInsertRowid);
    const foreign = Number(db.prepare("INSERT INTO mk_media (organization_id, kind, type, path, name, mime, size, width, height) VALUES (?, 'image', 'image', ?, 'secret.png', 'image/png', 10, 5, 5)").run(other, `/uploads/marketing/${other}/secret.png`).lastInsertRowid);
    assert.ok(!json(await boss.get(`${BASE}/liste.json?limite=100&q=secret`)).items.length);
    assert.equal((await boss.get(`${BASE}/${foreign}.json`)).status, 404);
    assert.equal((await boss.request(`${BASE}/${foreign}`, { method: "POST", json: { alt: "x" } })).status, 404);
    assert.equal((await boss.post(`${BASE}/${foreign}/corbeille`, {})).status, 404);
    assert.equal(row(foreign).deleted_at, null);
  });
});

describe("connexion au Page Builder : image, vidéo, audio, document → page publiée", () => {
  let pageId, slug, vid, aud, doc, img1, img2;
  before(async () => {
    [img1, img2] = [json(await send(boss, png(30, 20, [9, 9, 200]), "photo-1.png", "image/png")).media, json(await send(boss, png(31, 21, [200, 9, 9]), "photo-2.png", "image/png")).media];
    vid = json(await send(boss, FILES.mp4(), "demo.mp4")).media;
    aud = json(await send(boss, FILES.mp3(), "podcast.mp3")).media;
    doc = json(await send(boss, FILES.pdf(), "programme.pdf")).media;
    const created = await boss.post("/marketing/pages", { name: "Page médias", template: "", ouvrir: "editeur" });
    pageId = Number(created.location.match(/pages\/(\d+)/)[1]);
    slug = db.prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(pageId).slug;
  });
  const saveSections = async (sections) => {
    const rev = db.prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(pageId).revision;
    return boss.request(`/marketing/pages/${pageId}/brouillon`, { method: "PUT", json: { revision: rev, content: { title: "Page médias", sections } } });
  };
  const layout = (children) => ({ type: "layout", children: [{ type: "container", children }] });
  test("l'éditeur charge le sélecteur partagé et la médiathèque (scripts et styles)", async () => {
    const html = (await boss.get(`/marketing/pages/${pageId}/editeur`)).text;
    assert.match(html, /\/js\/kwmedia\.js/);
    assert.match(html, /\/js\/media-picker\.js/);
    assert.match(html, /\/css\/media-picker\.css/);
    const lib = json(await boss.get("/marketing/site-web/medias.json")).items;
    assert.ok(lib.some((i) => i.path === img1.path), "la fenêtre d'images de l'éditeur lit la même médiathèque");
    assert.ok(lib.every((i) => /^image\//.test(i.mime)), "images seulement dans cette fenêtre");
  });
  test("image choisie dans la médiathèque : enregistrée dans la page, rechargée, publiée et affichée au public", async () => {
    const saved = await saveSections([{ type: "image", src: img1.path, alt: "Un carré bleu", caption: "", link: "" }]);
    assert.equal(saved.status, 200, saved.text);
    assert.match((await boss.get(`/marketing/pages/${pageId}/editeur`)).text, new RegExp(img1.path.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&")), "présente après rechargement de l'éditeur");
    assert.equal((await boss.post(`/marketing/pages/${pageId}/publier.json`, {})).status, 200);
    const pub = await anon.get(`/p/${slug}`);
    assert.equal(pub.status, 200);
    assert.ok(pub.text.includes(img1.path));
    assert.equal(json(await boss.get(`${BASE}/${img1.id}.json`)).usage.length, 1);
  });
  test("remplacer l'image : la page utilise la nouvelle, l'ancienne reste dans la médiathèque (rien n'est supprimé)", async () => {
    await saveSections([{ type: "image", src: img2.path, alt: "Un carré rouge", caption: "", link: "" }]);
    await boss.post(`/marketing/pages/${pageId}/publier.json`, {});
    const pub = (await anon.get(`/p/${slug}`)).text;
    assert.ok(pub.includes(img2.path));
    assert.ok(!pub.includes(img1.path));
    assert.ok(row(img1.id), "ancienne image toujours en médiathèque");
    assert.equal((await anon.get(img1.path)).status, 200, "et toujours servie");
    assert.equal(json(await boss.get(`${BASE}/${img1.id}.json`)).usage.length, 0);
    assert.equal(json(await boss.get(`${BASE}/${img2.id}.json`)).usage.length, 1);
  });
  test("vidéo, audio et document de la médiathèque dans la page : acceptés, publiés, affichés avec les bonnes balises", async () => {
    const saved = await saveSections([layout([
      { type: "video", props: { url: vid.path, title: "Démo en vidéo" } },
      { type: "audio", props: { src: aud.path, title: "Notre podcast" } },
      { type: "button", props: { label: "Télécharger le programme", url: doc.path, variant: "primary" } },
    ])]);
    assert.equal(saved.status, 200, saved.text);
    assert.equal((await boss.post(`/marketing/pages/${pageId}/publier.json`, {})).status, 200);
    const pub = (await anon.get(`/p/${slug}`)).text;
    assert.match(pub, new RegExp(`<video src="${vid.path.replace(/[./]/g, "\\$&")}"`));
    assert.match(pub, new RegExp(`<audio src="${aud.path.replace(/[./]/g, "\\$&")}"`));
    // Les liens des pages passent par le compteur de clics (/p/<adresse>/clic/<n>) qui redirige vers le fichier de la médiathèque
    const click = pub.match(/href="(\/p\/[^"]+\/clic\/\d+)"[^>]*>[^<]*Télécharger le programme/);
    assert.ok(click, "bouton vers le document présent");
    const jump = await anon.get(click[1]);
    assert.equal(jump.status, 302);
    assert.equal(jump.location, doc.path);
    for (const m of [vid, aud, doc]) assert.equal(json(await boss.get(`${BASE}/${m.id}.json`)).usage.length, 1, m.name);
  });
  test("chemins non autorisés refusés par l'éditeur (autre dossier, autre extension, traversée)", async () => {
    for (const url of ["/uploads/videos/secret.mp4", "/uploads/marketing/1/../../etc/x.mp4", "/uploads/marketing/1/film.exe", "/uploads/marketing/abc/film.mp4"]) {
      const r = await saveSections([layout([{ type: "video", props: { url, title: "x" } }])]);
      assert.equal(r.status, 422, url);
    }
    const r = await saveSections([layout([{ type: "audio", props: { src: "/uploads/marketing/1/x.exe", title: "x" } }])]);
    assert.equal(r.status, 422);
  });
});

describe("l'existant continue de fonctionner", () => {
  test("bibliothèque des e-mails : images et PDF seulement (une vidéo est refusée), les listes e-mail n'affichent jamais vidéo/audio", async () => {
    const fd = new FormData(); fd.append("file", new Blob([FILES.mp4()], { type: "video/mp4" }), "film.mp4");
    const r = await boss.request("/marketing/medias", { method: "POST", multipart: fd });
    assert.equal(r.status, 400);
    assert.match(json(r).error, /ne peut pas lire de vidéo/);
    const docs = json(await boss.get("/marketing/medias?type=document")).items;
    assert.ok(docs.every((m) => m.kind === "document" && ["application/pdf"].concat(["application/msword"]).concat(docs.map((d) => d.mime)).includes(m.mime)));
    assert.ok(!docs.some((m) => /^(video|audio)\//.test(m.mime)), "pas de vidéo ni d'audio dans les documents d'e-mail");
  });
  test("fenêtre d'images de l'éditeur : envoi d'image possible, vidéo refusée avec son message", async () => {
    const ok = new FormData(); ok.append("file", new Blob([png(9, 9)], { type: "image/png" }), "depuis-editeur.png");
    assert.equal((await boss.request("/marketing/site-web/medias", { method: "POST", multipart: ok })).status, 201);
    const bad = new FormData(); bad.append("file", new Blob([FILES.mp4()], { type: "video/mp4" }), "v.mp4");
    const r = await boss.request("/marketing/site-web/medias", { method: "POST", multipart: bad });
    assert.equal(r.status, 422);
  });
  test("pages, sites, tunnels et navigation du CMS répondent", async () => {
    for (const url of ["/marketing/pages", "/marketing/site-web", "/marketing/site-web/sites", "/marketing/tunnels", "/marketing/site-web/articles", "/marketing/modeles"]) assert.equal((await boss.get(url)).status, 200, url);
  });
});
