// Images du blog : une image encore citée QUELQUE PART n'est jamais supprimée — ni à la main (médiathèque), ni
// automatiquement (couverture remplacée, article supprimé). Avant : seuls les articles étaient vérifiés, et une image
// gardée par un bloc réutilisable, une sauvegarde automatique, une page du site ou un e-mail pouvait disparaître.
const { describe, test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const zlib = require("zlib");
const { startServer, loginInstructor } = require("./helpers");

const png = (w, h) => {
  const crcTable = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
  const crc = (b) => { let c = 0xffffffff; for (const x of b) c = crcTable[(c ^ x) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const chunk = (t, d) => { const len = Buffer.alloc(4); len.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([len, td, c]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2;
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(Buffer.alloc((w * 3 + 1) * h))), chunk("IEND", Buffer.alloc(0))]);
};

describe("protection des images du blog", () => {
  let srv, prof;
  const sql = (q, ...a) => { const db = srv.db(); const r = db.prepare(q).all(...a); db.close(); return r; };
  const run = (q, ...a) => { const db = srv.db(); db.prepare(q).run(...a); db.close(); };
  const upload = async (name) => {
    const fd = new FormData(); fd.append("article_image", new Blob([png(64, 32)], { type: "image/png" }), name); fd.append("width", "64"); fd.append("height", "32");
    return JSON.parse((await prof.request("/formateur/blog/api/medias", { method: "POST", multipart: fd })).text);
  };
  const del = (id) => prof.request(`/formateur/blog/api/medias/${id}/supprimer`, { method: "POST" });
  const served = async (p) => (await fetch(`${srv.base}${p}`)).status;
  const post = async (fields) => {
    const fd = new FormData();
    for (const [k, v] of Object.entries({ content_format: "html", content: "<p>Texte</p>", ...fields })) fd.append(k, v);
    return JSON.parse((await prof.request("/formateur/blog/nouveau", { method: "POST", multipart: fd, headers: { "x-blog-editor": "1" } })).text);
  };
  before(async () => { srv = await startServer(); prof = await loginInstructor(srv); });
  after(() => srv.stop());

  test("article supprimé : sa couverture, encore utilisée par un bloc réutilisable, est GARDÉE (fichier servi, médiathèque)", async () => {
    const a = await upload("couverture.png");
    const p = await post({ title: "Article A", cover_media: a.path });
    assert.ok(p.id);
    run("INSERT INTO blog_reusable_blocks (name, content) VALUES (?, ?)", "Bandeau", JSON.stringify({ type: "image", attrs: { src: a.path } }));
    await prof.post(`/formateur/blog/${p.id}/supprimer`, {}); // corbeille, puis suppression définitive
    await prof.post(`/formateur/blog/${p.id}/supprimer-definitivement`, {});
    assert.equal(sql("SELECT COUNT(*) n FROM posts WHERE id = ?", p.id)[0].n, 0, "article supprimé");
    assert.equal(await served(a.path), 200, "l'image du bloc réutilisable est toujours là");
    assert.equal(sql("SELECT COUNT(*) n FROM media WHERE path = ?", a.path)[0].n, 1);
    // suppression manuelle refusée, avec l'endroit qui l'utilise
    const r = await del(a.media.id);
    assert.equal(r.status, 400);
    assert.match(JSON.parse(r.text).error, /Bloc réutilisable « Bandeau »/);
    // plus aucune citation : suppression permise, fichier retiré
    run("DELETE FROM blog_reusable_blocks WHERE name = 'Bandeau'");
    assert.equal((await del(a.media.id)).status, 200);
    assert.equal(await served(a.path), 404);
  });

  test("image citée par une page du site, une sauvegarde automatique ou un modèle d'e-mail : suppression refusée", async () => {
    const b = await upload("page.png");
    run("INSERT INTO site_pages (slug, title, content) VALUES (?, ?, ?)", "a-propos-proteg", "À propos", `<p><img src="${b.path}" alt=""></p>`);
    assert.match(JSON.parse((await del(b.media.id)).text).error, /Page « À propos »/);
    const c = await upload("auto.png");
    const p = await post({ title: "Brouillon" });
    run("INSERT INTO post_autosaves (post_id, user_id, payload) VALUES (?, ?, ?)", p.id, 1, JSON.stringify({ content: `<img src="${c.path}">` }));
    assert.match(JSON.parse((await del(c.media.id)).text).error, /Sauvegarde automatique de « Brouillon »/);
    const d = await upload("email.png");
    const tpl = sql("SELECT id FROM mk_templates LIMIT 1")[0];
    if (tpl) {
      run("UPDATE mk_templates SET blocks = ? WHERE id = ?", JSON.stringify([{ id: "i", type: "image", src: `https://kolakisa.com${d.path}`, alt: "x" }]), tpl.id);
      assert.match(JSON.parse((await del(d.media.id)).text).error, /Modèle d'e-mail/);
    }
    for (const m of [b, c, d]) assert.equal(await served(m.path), 200, "aucun fichier supprimé");
  });

  test("couverture remplacée : l'ancienne image reste tant qu'une révision la cite (« Restaurer » doit la rendre)", async () => {
    const one = await upload("une.png"), two = await upload("deux.png");
    const p = await post({ title: "Couverture", cover_media: one.path });
    const fd = new FormData();
    for (const [k, v] of Object.entries({ content_format: "html", content: "<p>Texte</p>", title: "Couverture", cover_media: two.path })) fd.append(k, v);
    await prof.request(`/formateur/blog/${p.id}/modifier`, { method: "POST", multipart: fd, headers: { "x-blog-editor": "1" } });
    assert.equal(sql("SELECT cover_path FROM posts WHERE id = ?", p.id)[0].cover_path, two.path);
    assert.equal(await served(one.path), 200, "gardée : la révision précédente la cite (Restaurer doit la rendre)");
  });
});
