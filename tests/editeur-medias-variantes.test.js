// Médiathèque : versions réduites WebP d'une image (srcset). Chaque version est vérifiée par le serveur (vrai WebP,
// largeur annoncée = largeur réelle, plus petite que l'original) ; elles sont supprimées avec l'image.
const { describe, test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const zlib = require("zlib");
const { startServer, loginInstructor } = require("./helpers");

// PNG valide de w × h ; WebP minimal (en-tête VP8X) déclarant w × h
const png = (w, h) => {
  const raw = Buffer.alloc((w * 3 + 1) * h);
  const chunk = (t, d) => { const len = Buffer.alloc(4); len.writeUInt32BE(d.length); const crc = Buffer.alloc(4); crc.writeUInt32BE(zlib.crc32 ? zlib.crc32(Buffer.concat([Buffer.from(t), d])) >>> 0 : 0); return Buffer.concat([len, Buffer.from(t), d, crc]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2;
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
};
const webp = (w, h) => {
  const b = Buffer.alloc(30);
  b.write("RIFF", 0); b.writeUInt32LE(22, 4); b.write("WEBP", 8); b.write("VP8X", 12); b.writeUInt32LE(10, 16);
  b.writeUIntLE(w - 1, 24, 3); b.writeUIntLE(h - 1, 27, 3);
  return b;
};

describe("Médiathèque : versions réduites des images", () => {
  let srv, prof;
  const upload = (fields) => { const fd = new FormData(); for (const [k, v] of fields) fd.append(k, v); return prof.request("/formateur/blog/api/medias", { method: "POST", multipart: fd }); };
  before(async () => { srv = await startServer(); prof = await loginInstructor(srv); });
  after(() => srv.stop());

  test("versions valides conservées et servies ; version mensongère refusée", async () => {
    const r = JSON.parse((await upload([
      ["article_image", new Blob([png(2000, 1000)], { type: "image/png" }), "photo.png"], ["width", "2000"], ["height", "1000"],
      ["image_variant", new Blob([webp(480, 240)], { type: "image/webp" }), "v480.webp"],
      ["image_variant", new Blob([webp(800, 400)], { type: "image/webp" }), "v960.webp"],
      ["variant_widths", "480,960"],
    ])).text);
    assert.deepEqual(r.variants, [480], "la version annoncée 960 mais large de 800 est refusée");
    const base = r.path.replace(/\.png$/, "");
    assert.equal((await fetch(`${srv.base}${base}-480w.webp`)).status, 200);
    assert.equal((await fetch(`${srv.base}${base}-960w.webp`)).status, 404);
    // Suppression de l'image : ses versions disparaissent aussi
    await prof.request(`/formateur/blog/api/medias/${r.media.id}/supprimer`, { method: "POST" });
    assert.equal((await fetch(`${srv.base}${base}-480w.webp`)).status, 404);
  });

  test("rendu public : srcset seulement pour les versions présentes", async () => {
    const r = JSON.parse((await upload([["article_image", new Blob([png(1200, 600)], { type: "image/png" }), "b.png"], ["width", "1200"], ["height", "600"], ["image_variant", new Blob([webp(480, 240)], { type: "image/webp" }), "v.webp"], ["variant_widths", "480"]])).text);
    const fd = new FormData();
    for (const [k, v] of Object.entries({ content_format: "html", title: "Srcset", content: `<figure class="kb-image"><img src="${r.path}" alt="Photo"></figure><figure class="kb-image"><img src="/uploads/thumbnails/autre.png" alt="x"></figure>`, status: "published" })) fd.append(k, v);
    await prof.request("/formateur/blog/nouveau", { method: "POST", multipart: fd, headers: { "x-blog-editor": "1" } });
    const html = (await prof.get("/blog/srcset")).text;
    assert.match(html, new RegExp(`srcset="${r.path.replace(/\.png$/, "")}-480w\\.webp 480w, ${r.path} 1200w"`));
    assert.equal((html.match(/srcset=/g) || []).length, 1, "pas de srcset inventé pour une image sans versions");
  });
});
