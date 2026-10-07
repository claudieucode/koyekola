// Page Builder — espace de travail (lots 2 à 7) : chaque élément de la palette et chaque bloc prêt à l'emploi
// produisent un contenu VALIDE pour le serveur ; la médiathèque de l'éditeur (envoi, texte de remplacement,
// suppression refusée si l'image sert à une page) ; l'écran de l'éditeur. Le parcours complet dans un vrai navigateur
// (sélection, glisser-déposer, édition directe, responsive, publication…) est vérifié par un script Playwright.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const zlib = require("zlib");
const { TEST_KEY, freshMarketing } = require("./marketing-helpers");
const pages = require("../src/marketing/pages");
const nodes = require("../src/marketing/pages/nodes");
const patterns = require("../src/marketing/pages/patterns");
const { startServer, loginInstructor, createCourse } = require("./helpers");

function png(w, h) {
  const crcTable = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
  const crc = (buf) => { let c = 0xffffffff; for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([len, td, c]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2;
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(Buffer.alloc((w * 3 + 1) * h))), chunk("IEND", Buffer.alloc(0))]);
}

describe("contenus de départ (sans serveur)", () => {
  test("chaque élément de la palette (hors ceux qui demandent une donnée) donne un élément valide", () => {
    const { A } = freshMarketing();
    const p = pages.createPage(A, { name: "Palette", kind: "page" });
    const spec = nodes.editorSpec();
    const children = spec.types.filter((t) => !t.asks).map((t) => ({ type: t.type, ...t.blank }));
    const r = pages.saveDraft(A, p.id, { sections: [{ type: "layout", children }] }, { revision: p.revision });
    assert.equal(r.content.sections[0].children.length, children.length);
    assert.deepEqual(spec.types.filter((t) => t.asks).map((t) => t.type).sort(), ["audio", "carousel", "course", "gallery", "image", "video"]);
    for (const p0 of spec.styleProps) assert.ok(p0.label && p0.group && ["enum", "color", "number", "length", "text"].includes(p0.kind), p0.key);
  });

  test("chaque bloc prêt à l'emploi est fait de vraies sections valides, sans faux chiffre ; « Formations » seulement s'il y en a", () => {
    const { db, A } = freshMarketing();
    const blocks = patterns.catalog(A);
    assert.ok(!blocks.some((b) => b.key === "courses"), "aucune formation publiée : pas de bloc Formations");
    for (const b of blocks) {
      const p = pages.createPage(A, { name: `Bloc ${b.key}`, kind: "page" });
      const r = pages.saveDraft(A, p.id, { sections: b.sections }, { revision: p.revision });
      assert.ok(r.content.sections.length >= 1, b.key);
      assert.doesNotMatch(JSON.stringify(b.sections), /\d{2,} ?(€|%|élèves|clients)/, `${b.key} : aucun chiffre inventé`);
    }
    db.exec("CREATE TABLE courses (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, slug TEXT, subtitle TEXT, price_cents INTEGER DEFAULT 0, thumbnail_path TEXT, published INTEGER DEFAULT 1); INSERT INTO courses (title, slug) VALUES ('Photoshop', 'photoshop');");
    const withCourse = patterns.catalog(A).find((b) => b.key === "courses");
    assert.ok(withCourse);
    const p = pages.createPage(A, { name: "Bloc formations", kind: "page" });
    assert.ok(pages.saveDraft(A, p.id, { sections: withCourse.sections }, { revision: p.revision }));
  });
});

describe("éditeur et médiathèque (vrai serveur)", () => {
  let srv, boss, db, pageId;
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db();
    pageId = Number((await boss.post("/marketing/pages", { name: "Éditeur" })).location.match(/(\d+)$/)[1]);
  });
  after(() => srv.stop());
  const upload = (buffer, name, type, extra = {}) => {
    const fd = new FormData();
    fd.append("file", new Blob([buffer], { type }), name);
    for (const [k, v] of Object.entries(extra)) fd.append(k, v);
    return boss.request("/marketing/site-web/medias", { method: "POST", multipart: fd });
  };

  test("l'écran de l'éditeur : zones, outils, palette décrite par le serveur, aucun outil HTML/CSS/JS libre", async () => {
    const html = (await boss.get(`/marketing/pages/${pageId}/editeur`)).text;
    for (const z of ["data-pb-tools", "data-pb-elements", "data-pb-layers", "data-pb-inspector", "data-pb-context", "data-pb-frame", "data-pb-media", "data-pb-command-dialog", "data-pb-preview-dialog"]) assert.match(html, new RegExp(z), z);
    const boot = JSON.parse(html.match(/<script type="application\/json" id="pb-boot">([\s\S]*?)<\/script>/)[1]);
    assert.ok(boot.spec.types.length >= 20);
    assert.ok(boot.blocks.some((b) => b.key === "pricing"));
    assert.doesNotMatch(JSON.stringify(boot.spec.types.map((t) => t.type)), /html|script|iframe|css/i);
  });

  test("médiathèque : envoi (avec texte de remplacement), liste des deux bibliothèques, mise à jour, refus d'un PDF", async () => {
    let r = await upload(png(40, 20), "Bannière.png", "image/png", { alt: "Bannière d'accueil" });
    assert.equal(r.status, 201, r.text);
    const m = JSON.parse(r.text).media;
    assert.equal(m.source, "marketing");
    assert.equal(m.alt, "Bannière d'accueil");
    assert.equal(m.name, "Bannière.png");
    assert.equal(m.width, 40);
    db.prepare("INSERT INTO media (path, kind, mime, alt, title) VALUES ('/uploads/thumbnails/photo-blog.webp', 'image', 'image/webp', 'Photo du blog', 'Photo')").run();
    const all = JSON.parse((await boss.get("/marketing/site-web/medias.json")).text).items;
    assert.ok(all.some((x) => x.source === "marketing" && x.id === m.id));
    assert.ok(all.some((x) => x.source === "site" && x.path === "/uploads/thumbnails/photo-blog.webp" && x.editable === false));
    assert.equal(JSON.parse((await boss.get("/marketing/site-web/medias.json?source=site&q=blog")).text).items.length, 1);
    r = await boss.postJson(`/marketing/site-web/medias/${m.id}`, { alt: "Nouvelle description" });
    assert.equal(JSON.parse(r.text).media.alt, "Nouvelle description");
    r = await upload(Buffer.from("%PDF-1.4 test"), "doc.pdf", "application/pdf");
    assert.equal(r.status, 422);
    assert.match(JSON.parse(r.text).error.message, /Une page affiche des images/);
  });

  test("suppression : refusée tant qu'une page (même en brouillon) utilise l'image ; acceptée ensuite", async () => {
    const m = JSON.parse((await upload(png(10, 10), "a-supprimer.png", "image/png")).text).media;
    const rev = db.prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(pageId).revision;
    const put = await boss.request(`/marketing/pages/${pageId}/brouillon`, { method: "PUT", json: { revision: rev, content: { sections: [{ type: "layout", children: [{ type: "image", props: { src: m.path, alt: "Image" } }] }] } } });
    assert.equal(put.status, 200, put.text);
    let r = await boss.postJson(`/marketing/site-web/medias/${m.id}/supprimer`, {});
    assert.equal(r.status, 422);
    assert.match(JSON.parse(r.text).error.message, /page « Éditeur »/);
    const rev2 = db.prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(pageId).revision;
    await boss.request(`/marketing/pages/${pageId}/brouillon`, { method: "PUT", json: { revision: rev2, content: { sections: [{ type: "layout", children: [] }] } } });
    r = await boss.postJson(`/marketing/site-web/medias/${m.id}/supprimer`, {});
    assert.equal(r.status, 200, r.text);
  });

  test("bloc « Formations à la une » : vraies formations du catalogue", async () => {
    await createCourse(boss, srv, { title: "Illustrator express", price: 0 });
    const html = (await boss.get(`/marketing/pages/${pageId}/editeur`)).text;
    const boot = JSON.parse(html.match(/<script type="application\/json" id="pb-boot">([\s\S]*?)<\/script>/)[1]);
    const block = boot.blocks.find((b) => b.key === "courses");
    assert.ok(block);
    assert.match(JSON.stringify(block.sections), /"type":"course"/);
  });
});
