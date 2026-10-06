// Éditeur d'e-mails (refonte) : médiathèque persistante, aperçu annoté (blocs cliquables, bloc incomplet montré à sa
// place), bloc masqué jamais envoyé, enregistrement automatique sans noyer l'historique des versions.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");
const { startServer, Client, loginInstructor, newStudent } = require("./helpers");
const { TEST_KEY } = require("./marketing-helpers");

let srv, boss;
const sql = (q, ...a) => { const db = srv.db(); const r = db.prepare(q).all(...a); db.close(); return r; };
const run = (q, ...a) => { const db = srv.db(); db.prepare(q).run(...a); db.close(); };
const json = (r) => JSON.parse(r.text);

// Vraie image PNG (w × h, une couleur) : signature, IHDR, IDAT compressé, IEND avec CRC
function png(w, h, rgb = [2, 119, 182]) {
  const crcTable = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
  const crc = (buf) => { let c = 0xffffffff; for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([len, td, c]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2;
  const raw = Buffer.alloc((w * 3 + 1) * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) raw.set(rgb, y * (w * 3 + 1) + 1 + x * 3);
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
}
const upload = (client, buffer, name, type) => {
  const fd = new FormData();
  fd.append("file", new Blob([buffer], { type }), name);
  return client.request("/marketing/medias", { method: "POST", multipart: fd });
};
const member = async (role) => {
  const c = await newStudent(srv);
  run("INSERT INTO mk_org_members (organization_id, user_id, role) VALUES (1, (SELECT id FROM users WHERE email = ?), ?)", c.email, role);
  return c;
};

before(async () => {
  srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
  boss = await loginInstructor(srv);
});
after(() => srv.stop());

describe("médiathèque", () => {
  let image;
  test("image envoyée : type lu dans le fichier, dimensions réelles, fichier conservé, adresse publique permanente", async () => {
    const r = await upload(boss, png(120, 80), "Bannière équipe.png", "image/png");
    assert.equal(r.status, 201);
    image = json(r).media;
    assert.deepEqual([image.kind, image.mime, image.width, image.height, image.name], ["image", "image/png", 120, 80, "Bannière équipe.png"]);
    assert.match(image.path, /^\/uploads\/marketing\/1\/\d+-[0-9a-f]{12}\.png$/);
    assert.equal(image.url, `https://k.test${image.path}`);
    assert.ok(fs.existsSync(path.join(srv.dir, image.path.replace(/^\//, ""))), "fichier écrit dans le dossier des fichiers envoyés");
    const served = await new Client(srv.base).get(image.path);
    assert.equal(served.status, 200);
    assert.equal(served.headers.get("content-type"), "image/png");
    assert.equal(served.headers.get("x-content-type-options"), "nosniff");
    assert.equal(sql("SELECT COUNT(*) n FROM mk_media")[0].n, 1);
  });
  test("le type DÉCLARÉ ne compte pas : du texte nommé .png est refusé ; SVG, vidéo et inconnu refusés avec une explication", async () => {
    const fake = await upload(boss, Buffer.from("<html><script>alert(1)</script>"), "piege.png", "image/png");
    assert.equal(fake.status, 400);
    assert.match(json(fake).error, /Format non pris en charge/);
    assert.match(json(await upload(boss, Buffer.from("<svg xmlns='http://www.w3.org/2000/svg'/>"), "logo.svg", "image/svg+xml")).error, /SVG ne sont pas acceptées/);
    assert.match(json(await upload(boss, Buffer.from("....ftypmp42"), "film.mp4", "video/mp4")).error, /ne peut pas lire de vidéo/);
    assert.equal(sql("SELECT COUNT(*) n FROM mk_media")[0].n, 1, "rien d'enregistré");
  });
  test("PDF accepté comme document ; image trop lourde refusée", async () => {
    const pdf = await upload(boss, Buffer.from("%PDF-1.4\n%âãÏÓ\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF"), "Programme.pdf", "application/pdf");
    assert.equal(pdf.status, 201);
    assert.equal(json(pdf).media.kind, "document");
    const big = Buffer.concat([png(10, 10), Buffer.alloc(6 * 1024 * 1024)]);
    assert.match(json(await upload(boss, big, "lourde.png", "image/png")).error, /trop lourd/);
  });
  test("liste, recherche, filtre ; texte alternatif enregistré", async () => {
    const all = json(await boss.get("/marketing/medias"));
    assert.equal(all.total, 2);
    assert.deepEqual(json(await boss.get("/marketing/medias?q=banni")).items.map((m) => m.id), [image.id]);
    assert.equal(json(await boss.get("/marketing/medias?type=document")).total, 1);
    const upd = json(await boss.postJson(`/marketing/medias/${image.id}`, { alt: "L'équipe KOLAKISA" }));
    assert.equal(upd.media.alt, "L'équipe KOLAKISA");
  });
  test("utilisée par un modèle : suppression refusée ; inutilisée : supprimée (base + disque)", async () => {
    const tid = Number((await boss.post("/marketing/modeles", { name: "Avec image", starter: "blank", kind: "marketing" })).location.match(/(\d+)$/)[1]);
    const v = sql("SELECT version FROM mk_templates WHERE id = ?", tid)[0].version;
    const saved = await boss.postJson(`/marketing/modeles/${tid}`, { version: v, template: { name: "Avec image", kind: "marketing", subject: "Bonjour", blocks: [{ id: "img1", type: "image", src: image.url, alt: "Équipe", width: 120 }] } });
    assert.equal(saved.status, 200);
    const refused = await boss.postJson(`/marketing/medias/${image.id}/supprimer`, {});
    assert.equal(refused.status, 400);
    assert.match(json(refused).error, /utilisé par 1 élément \(modèle « Avec image »\)/);
    const pdf = json(await boss.get("/marketing/medias?type=document")).items[0];
    assert.equal((await boss.postJson(`/marketing/medias/${pdf.id}/supprimer`, {})).status, 200);
    assert.ok(!fs.existsSync(path.join(srv.dir, pdf.path.replace(/^\//, ""))));
  });
  test("droits : un lecteur voit la médiathèque mais ne peut rien envoyer ni supprimer ; un élève n'y a pas accès", async () => {
    const viewer = await member("viewer");
    assert.equal((await viewer.get("/marketing/medias")).status, 200);
    assert.equal((await upload(viewer, png(4, 4), "x.png", "image/png")).status, 403);
    assert.equal((await viewer.postJson(`/marketing/medias/${image.id}/supprimer`, {})).status, 403);
    const student = await newStudent(srv);
    assert.equal((await student.get("/marketing/medias")).status, 403);
  });
});

describe("aperçu de l'éditeur, bloc masqué, enregistrement automatique", () => {
  let tid;
  before(async () => { tid = Number((await boss.post("/marketing/modeles", { name: "Éditeur v3", starter: "blank", kind: "marketing" })).location.match(/(\d+)$/)[1]); });
  const tpl = (blocks) => ({ name: "Éditeur v3", kind: "marketing", subject: "Bonjour", preheader: "Les nouvelles", blocks });
  test("aperçu annoté : blocs repérables ; un bloc incomplet est montré à sa place au lieu de faire échouer tout l'aperçu", async () => {
    const blocks = [{ id: "h1", type: "heading", text: "Titre" }, { id: "im", type: "image", src: "", alt: "" }, { id: "tx", type: "text", markdown: "Fin." }];
    const r = json(await boss.postJson("/marketing/modeles/apercu", { template: tpl(blocks), annotate: true }));
    assert.match(r.html, /<tr data-mk-block="h1">/);
    assert.match(r.html, /<tr data-mk-block="im" data-mk-error="true">/);
    assert.match(r.html, /<tr data-mk-block="tx">/);
    assert.deepEqual(r.blockErrors.map((e) => [e.id, e.type]), [["im", "image"]]);
    // sans annotation (aperçu réel, envoi) : rien de tout cela, et le bloc incomplet reste refusé
    const strict = await boss.postJson("/marketing/modeles/apercu", { template: tpl(blocks) });
    assert.equal(strict.status, 400);
    assert.match(json(strict).error, /Bloc 2/);
    const ok = json(await boss.postJson("/marketing/modeles/apercu", { template: tpl([blocks[0], blocks[2]]) }));
    assert.doesNotMatch(ok.html, /data-mk-block/);
  });
  test("bloc masqué : enregistré, visible estompé dans l'éditeur, jamais dans l'e-mail envoyé", async () => {
    const v = sql("SELECT version FROM mk_templates WHERE id = ?", tid)[0].version;
    const blocks = [{ id: "a1", type: "heading", text: "Visible" }, { id: "a2", type: "text", markdown: "Paragraphe secret", hidden: true }];
    assert.equal((await boss.postJson(`/marketing/modeles/${tid}`, { version: v, template: tpl(blocks) })).status, 200);
    assert.equal(JSON.parse(sql("SELECT blocks FROM mk_templates WHERE id = ?", tid)[0].blocks)[1].hidden, true);
    const editor = json(await boss.postJson("/marketing/modeles/apercu", { template: tpl(blocks), annotate: true }));
    assert.match(editor.html, /data-mk-block="a2" data-mk-hidden="true"/);
    assert.match(editor.html, /Paragraphe secret/);
    const real = json(await boss.postJson("/marketing/modeles/apercu", { template: tpl(blocks) }));
    assert.doesNotMatch(real.html, /Paragraphe secret/);
    assert.match(real.html, /Visible/);
  });
  test("enregistrement automatique : contenu enregistré à chaque fois, historique limité à une version par 10 minutes", async () => {
    const versionsBefore = sql("SELECT COUNT(*) n FROM mk_template_versions WHERE template_id = ?", tid)[0].n;
    for (let i = 0; i < 4; i++) {
      const v = sql("SELECT version FROM mk_templates WHERE id = ?", tid)[0].version;
      const r = await boss.postJson(`/marketing/modeles/${tid}`, { version: v, autosave: true, template: tpl([{ id: "a1", type: "heading", text: `Brouillon ${i}` }]) });
      assert.equal(r.status, 200);
    }
    assert.equal(JSON.parse(sql("SELECT blocks FROM mk_templates WHERE id = ?", tid)[0].blocks)[0].text, "Brouillon 3", "dernier contenu enregistré");
    // une version vient d'être créée (enregistrement manuel du test précédent) : aucune de plus pour 4 enregistrements automatiques
    assert.equal(sql("SELECT COUNT(*) n FROM mk_template_versions WHERE template_id = ?", tid)[0].n, versionsBefore, "pas une version par enregistrement automatique");
    run("UPDATE mk_template_versions SET created_at = datetime('now', '-11 minutes') WHERE template_id = ?", tid); // 11 minutes plus tard…
    const v2 = sql("SELECT version FROM mk_templates WHERE id = ?", tid)[0].version;
    await boss.postJson(`/marketing/modeles/${tid}`, { version: v2, autosave: true, template: tpl([{ id: "a1", type: "heading", text: "Brouillon 4" }]) });
    assert.equal(sql("SELECT COUNT(*) n FROM mk_template_versions WHERE template_id = ?", tid)[0].n, versionsBefore + 1, "…l'enregistrement automatique garde à nouveau un instantané");
    // l'enregistrement manuel crée toujours une version
    const v = sql("SELECT version FROM mk_templates WHERE id = ?", tid)[0].version;
    await boss.postJson(`/marketing/modeles/${tid}`, { version: v, template: tpl([{ id: "a1", type: "heading", text: "Final" }]) });
    assert.equal(sql("SELECT COUNT(*) n FROM mk_template_versions WHERE template_id = ?", tid)[0].n, versionsBefore + 2, "manuel : toujours une version");
    // conflit : une version périmée est refusée (jamais d'écrasement silencieux)
    const stale = await boss.postJson(`/marketing/modeles/${tid}`, { version: v, autosave: true, template: tpl([{ id: "a1", type: "heading", text: "Écrasement" }]) });
    assert.equal(stale.status, 409);
  });
  test("page de l'éditeur : barre d'outils, onglets, canevas, réglages ; données des blocs et icônes fournies", async () => {
    const page = await boss.get(`/marketing/modeles/${tid}`);
    assert.equal(page.status, 200);
    for (const id of ["mk-save", "mk-undo", "mk-redo", "mk-open-preview", "mk-open-test", "mk-more", "mk-frame", "mk-props", "mk-structure", "mk-media-grid", "mk-check"]) assert.match(page.text, new RegExp(`id="${id}"`), id);
    for (const tab of ["blocks", "structure", "media", "styles", "message", "check"]) assert.match(page.text, new RegExp(`data-pane="${tab}"`), tab);
    assert.match(page.text, /sandbox="allow-same-origin"/, "canevas : rendu sans script");
    const data = JSON.parse(page.text.match(/<script type="application\/json" id="mk-editor-data">([\s\S]*?)<\/script>/)[1]);
    assert.ok(data.blocks.image.icon.startsWith("<svg") && data.icons.trash.startsWith("<svg"));
  });
});
