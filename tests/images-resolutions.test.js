// Résolutions d'image (Page Builder) : service commun media/variants.js, de bout en bout par les vraies routes.
// Original jamais modifié ; versions réduites WebP fabriquées à la demande ; aucun lien cassé (repli sur l'original) ;
// choix enregistré dans la page, relu, appliqué à la page publiée (Image, Galerie, Carrousel, Boîte d'image).
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, Client, loginInstructor } = require("./helpers");

let sharp = null;
try { sharp = require("sharp"); } catch { /* sharp absent */ }
const SKIP = sharp ? false : "sharp absent : fabrication des versions non testée sur cette machine";
const json = (r) => JSON.parse(r.text);
const BASE = "/marketing/site-web/mediatheque";

describe("résolutions d'image", { skip: SKIP }, () => {
  let uploadsRoot, srv, boss, anon, db, big, small, big2, pageId, slug;
  const send = async (buffer, name, type) => { const fd = new FormData(); fd.append("file", new Blob([buffer], { type }), name); const r = await boss.request(`${BASE}/televerser`, { method: "POST", multipart: fd }); assert.equal(r.status, 201, r.text); return json(r).media; };
  const make = (w, h, fmt = "jpeg") => sharp({ create: { width: w, height: h, channels: 3, background: { r: 20, g: 120, b: 200 } } })[fmt]().toBuffer();
  const save = async (children, content = {}) => {
    const rev = db.prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(pageId).revision;
    return boss.request(`/marketing/pages/${pageId}/brouillon`, { method: "PUT", json: { revision: rev, content: { title: "Résolutions", ...content, sections: [{ type: "layout", children: [{ type: "container", children }] }] } } });
  };
  const publish = async () => { assert.equal((await boss.post(`/marketing/pages/${pageId}/publier.json`, {})).status, 200); return (await anon.get(`/p/${slug}`)).text; };
  const draftNodes = () => { const r = db.prepare("SELECT draft FROM mk_landing_pages WHERE id = ?").get(pageId); return JSON.parse(r.draft).sections[0].children[0].children; };
  const variantUrl = (m, w) => m.path.replace(/\/([^/]+)\.\w+$/, `/v/${w}/$1.webp`);
  const get = (url) => fetch(srv.base + url, { redirect: "manual" });

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    uploadsRoot = path.join(srv.dir, "uploads");
    boss = await loginInstructor(srv); anon = new Client(srv.base); db = srv.db();
    big = await send(await make(1400, 900), "grande.jpg", "image/jpeg");
    small = await send(await make(200, 120, "png"), "petite.png", "image/png");
    big2 = await send(await make(1100, 700), "grande2.jpg", "image/jpeg");
    const created = await boss.post("/marketing/pages", { name: "Résolutions", template: "", ouvrir: "editeur" });
    pageId = Number(created.location.match(/pages\/(\d+)/)[1]);
    slug = db.prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(pageId).slug;
  });
  after(() => srv.stop());

  test("une version réduite est fabriquée à la demande : vrai WebP, largeur demandée, ratio gardé, original intact", async () => {
    const before = fs.readFileSync(path.join(uploadsRoot, big.path.replace("/uploads/", "")));
    const r = await get(variantUrl(big, 640));
    assert.equal(r.status, 200);
    assert.equal(r.headers.get("content-type"), "image/webp");
    const meta = await sharp(Buffer.from(await r.arrayBuffer())).metadata();
    assert.equal(meta.format, "webp"); assert.equal(meta.width, 640); assert.equal(meta.height, Math.round(900 * 640 / 1400));
    assert.deepEqual(fs.readFileSync(path.join(uploadsRoot, big.path.replace("/uploads/", ""))), before, "l'original n'est pas modifié");
    assert.equal((await get(variantUrl(big, 640))).status, 200, "deuxième accès : servie depuis le disque");
  });

  test("variante manquante : si le fichier d'une version a disparu du disque, la visite suivante le refabrique", async () => {
    await get(variantUrl(big, 320));
    const f = path.join(uploadsRoot, "marketing", String(big.path.split("/")[3]), "v", "320", path.basename(big.path).replace(/\.\w+$/, ".webp"));
    assert.ok(fs.existsSync(f)); fs.unlinkSync(f);
    const r = await get(variantUrl(big, 320));
    assert.equal(r.status, 200); assert.equal(r.headers.get("content-type"), "image/webp"); assert.ok(fs.existsSync(f), "refabriquée");
  });

  test("grande image : tous les paliers d'Elementor (miniature … 768, 1024, 1536, 2048) proposés et fabriqués à la bonne largeur", async () => {
    const huge = await send(await make(2600, 1700), "enorme.jpg", "image/jpeg");
    const info = json(await boss.get(`/marketing/site-web/medias/resolutions.json?src=${encodeURIComponent(huge.path)}`));
    assert.deepEqual(info.sizes.map((x) => [x.key, x.width]), [["thumbnail", 150], ["small", 320], ["medium", 640], ["mediumlarge", 768], ["large", 1024], ["w1536", 1536], ["xlarge", 1600], ["w2048", 2048]]);
    for (const w of [768, 1536, 2048]) {
      const r = await get(variantUrl(huge, w));
      assert.equal(r.status, 200, `${w}`);
      const meta = await sharp(Buffer.from(await r.arrayBuffer())).metadata();
      assert.equal(meta.width, w); assert.equal(meta.height, Math.round(1700 * w / 2600));
    }
  });

  test("aucun lien cassé : image plus petite que la taille demandée → l'original ; largeur inventée → 404 ; nom inventé → 404", async () => {
    const r = await get(variantUrl(small, 640));
    assert.equal(r.status, 302); assert.equal(r.headers.get("location"), small.path);
    assert.equal((await get(small.path)).status, 200);
    assert.equal((await get(variantUrl(big, 700))).status, 404, "seules les cinq largeurs de la liste");
    assert.equal((await get("/uploads/marketing/1/v/640/1-aaaaaaaaaaaa.webp")).status, 404);
    assert.equal((await get("/uploads/marketing/1/v/640/..%2F..%2Fserver.webp")).status, 404);
  });

  test("tailles proposées : seulement celles plus petites que l'original ; image de la médiathèque seulement", async () => {
    const a = json(await boss.get(`/marketing/site-web/medias/resolutions.json?src=${encodeURIComponent(big.path)}`));
    assert.equal(a.available, true); assert.equal(a.complete, true); assert.equal(a.width, 1400);
    assert.deepEqual(a.sizes.map((s) => s.key), ["thumbnail", "small", "medium", "mediumlarge", "large"], "paliers plus petits que 1400 px, dans l'ordre des largeurs");
    const s = json(await boss.get(`/marketing/site-web/medias/resolutions.json?src=${encodeURIComponent(small.path)}`));
    assert.deepEqual(s.sizes.map((x) => x.key), ["thumbnail"], "200 px : seule la miniature (150) est plus petite");
    const ext = json(await boss.get("/marketing/site-web/medias/resolutions.json?src=" + encodeURIComponent("https://exemple.test/a.jpg")));
    assert.equal(ext.complete, false); assert.deepEqual(ext.sizes, []);
    const lot = json(await boss.get(`/marketing/site-web/medias/resolutions.json?src=${encodeURIComponent(big.path)}&src=${encodeURIComponent(small.path)}`));
    assert.equal(lot.width, 200, "un lot : limité par la plus petite image");
  });

  test("widget Image : le choix est enregistré, relu, appliqué à la page publiée ; « original » ne s'enregistre pas ; valeur inconnue ignorée", async () => {
    let r = await save([{ type: "image", props: { src: big.path, alt: "Une image", size: "medium" } }]);
    assert.equal(r.status, 200, r.text);
    assert.equal(draftNodes()[0].props.size, "medium");
    assert.match((await boss.get(`/marketing/pages/${pageId}/editeur`)).text, new RegExp(big.path.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&")));
    let html = await publish();
    assert.ok(html.includes(`src="${variantUrl(big, 640)}"`), "la page publiée charge la version moyenne");
    assert.ok(!html.includes(`src="${big.path}"`), "plus l'original");
    r = await save([{ type: "image", props: { src: big.path, alt: "Une image", size: "full" } }]);
    assert.equal(draftNodes()[0].props.size, undefined);
    html = await publish(); assert.ok(html.includes(`src="${big.path}"`));
    r = await save([{ type: "image", props: { src: big.path, alt: "Une image", size: "énorme" } }]);
    assert.equal(r.status, 200); assert.equal(draftNodes()[0].props.size, undefined, "valeur inconnue ignorée");
  });

  test("image ancienne (sans choix) et image externe : rendu inchangé", async () => {
    await save([{ type: "image", props: { src: big.path, alt: "Ancienne" } }, { type: "image", props: { src: "https://exemple.test/photo.jpg", alt: "Externe", size: "medium" } }]);
    const html = await publish();
    assert.ok(html.includes(`src="${big.path}"`));
    assert.ok(html.includes('src="https://exemple.test/photo.jpg"'), "une adresse externe n'est jamais réécrite");
  });

  test("taille adaptative : src + srcset avec les versions plus petites que l'original et l'original lui-même", async () => {
    await save([{ type: "image", props: { src: big.path, alt: "Adaptative", size: "auto" } }]);
    const html = await publish();
    const m = /<img src="([^"]+)" srcset="([^"]+)" sizes="([^"]+)"/.exec(html);
    assert.ok(m, "srcset présent");
    assert.equal(m[1], variantUrl(big, 640));
    assert.ok(m[2].includes(`${variantUrl(big, 320)} 320w`) && m[2].includes(`${variantUrl(big, 1024)} 1024w`) && m[2].includes(`${big.path} 1400w`));
    assert.ok(!m[2].includes("/v/1600/"), "pas de version plus grande que l'original");
  });

  test("Galerie, Carrousel et Boîte d'image utilisent le même service ; la visionneuse garde l'original", async () => {
    await save([
      { type: "gallery", props: { images: [{ src: big.path, alt: "A" }, { src: big2.path, alt: "B" }], lightbox: true, size: "small" } },
      { type: "carousel", props: { images: [{ src: big.path, alt: "C" }, { src: big2.path, alt: "D" }], size: "large" } },
      { type: "imagebox", props: { src: big.path, alt: "E", title: "Boîte", size: "thumbnail" } },
    ]);
    const html = await publish();
    assert.ok(html.includes(`src="${variantUrl(big, 320)}"`) && html.includes(`src="${variantUrl(big2, 320)}"`), "galerie : petites");
    assert.ok(html.includes(`href="${big.path}" class="kw-lb-open"`), "agrandissement : l'original");
    assert.ok(html.includes(`src="${variantUrl(big2, 1024)}"`), "carrousel : grandes");
    assert.ok(html.includes(`src="${variantUrl(big, 150)}"`), "boîte d'image : miniature");
  });

  test("suppression définitive : les versions fabriquées sont retirées avec l'image", async () => {
    const f = path.join(uploadsRoot, "marketing", String(big2.path.split("/")[3]), "v", "640", path.basename(big2.path).replace(/\.\w+$/, ".webp"));
    await get(variantUrl(big2, 640));
    assert.ok(fs.existsSync(f), "version fabriquée");
    await save([]); await publish(); // la page publiée ne doit plus utiliser l'image (sinon la suppression est refusée)
    assert.equal((await boss.post(`${BASE}/${big2.id}/corbeille`, {})).status < 300, true);
    const r = await boss.post(`${BASE}/${big2.id}/supprimer`, {});
    assert.ok(r.status < 300, r.text);
    assert.equal(fs.existsSync(f), false, "version supprimée avec l'original");
  });
});

describe("résolutions d'image : fond d'image et photo de témoignage", { skip: SKIP }, () => {
  let srv, boss, anon, db, img, pageId, slug;
  const variantUrl = (m, w) => m.path.replace(/\/([^/]+)\.\w+$/, `/v/${w}/$1.webp`);
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); anon = new Client(srv.base); db = srv.db();
    const buf = await sharp({ create: { width: 1800, height: 1000, channels: 3, background: { r: 10, g: 80, b: 160 } } }).jpeg().toBuffer();
    const fd = new FormData(); fd.append("file", new Blob([buf], { type: "image/jpeg" }), "fond.jpg");
    const up = await boss.request(`${BASE}/televerser`, { method: "POST", multipart: fd }); assert.equal(up.status, 201, up.text); img = json(up).media;
    const created = await boss.post("/marketing/pages", { name: "Fonds", template: "", ouvrir: "editeur" });
    pageId = Number(created.location.match(/pages\/(\d+)/)[1]);
    slug = db.prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(pageId).slug;
  });
  after(() => srv.stop());
  const save = (children) => { const rev = db.prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(pageId).revision; return boss.request(`/marketing/pages/${pageId}/brouillon`, { method: "PUT", json: { revision: rev, content: { title: "Fonds", sections: [{ type: "layout", children: [{ type: "container", children }] }] } } }); };
  const publish = async () => { assert.equal((await boss.post(`/marketing/pages/${pageId}/publier.json`, {})).status, 200); return (await anon.get(`/p/${slug}`)).text; };

  test("image de fond : la taille choisie est enregistrée et la feuille de style charge la version ; sans choix, l'original", async () => {
    let r = await save([{ type: "container", styles: { desktop: { backgroundImage: { src: img.path, size: "large" }, minHeight: "200px" } }, children: [{ type: "text", props: { html: "<p>x</p>" } }] }]);
    assert.equal(r.status, 200, r.text);
    assert.equal(JSON.parse(db.prepare("SELECT draft FROM mk_landing_pages WHERE id = ?").get(pageId).draft).sections[0].children[0].children[0].styles.desktop.backgroundImage.size, "large");
    let html = await publish();
    assert.ok(html.includes(`url("${variantUrl(img, 1024)}")`), "version 1024 dans le CSS");
    r = await save([{ type: "container", styles: { desktop: { backgroundImage: { src: img.path }, minHeight: "200px" } }, children: [{ type: "text", props: { html: "<p>x</p>" } }] }]);
    html = await publish();
    assert.ok(html.includes(`url("${img.path}")`) && !html.includes("/v/1024/"), "original sans choix");
    r = await save([{ type: "container", styles: { desktop: { backgroundImage: { src: img.path, size: "enorme" } } }, children: [{ type: "text", props: { html: "<p>x</p>" } }] }]);
    assert.equal(r.status, 200); assert.equal(JSON.parse(db.prepare("SELECT draft FROM mk_landing_pages WHERE id = ?").get(pageId).draft).sections[0].children[0].children[0].styles.desktop.backgroundImage.size, undefined);
  });

  test("photo de témoignage : même service", async () => {
    await save([{ type: "testimonial", props: { text: "Super", name: "Ana", avatar: img.path, size: "thumbnail" } }]);
    const html = await publish();
    assert.ok(html.includes(`src="${variantUrl(img, 150)}"`), html.slice(html.indexOf("kw-avatar") - 40, html.indexOf("kw-avatar") + 200));
    assert.equal((await fetch(srv.base + variantUrl(img, 150))).status, 200);
  });
});

describe("widget Image : visionneuse", { skip: SKIP }, () => {
  let srv, boss, anon, db, img, pageId, slug;
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); anon = new Client(srv.base); db = srv.db();
    const buf = await sharp({ create: { width: 900, height: 600, channels: 3, background: { r: 1, g: 2, b: 3 } } }).jpeg().toBuffer();
    const fd = new FormData(); fd.append("file", new Blob([buf], { type: "image/jpeg" }), "v.jpg");
    img = json(await boss.request(`${BASE}/televerser`, { method: "POST", multipart: fd })).media;
    const created = await boss.post("/marketing/pages", { name: "Visionneuse", template: "", ouvrir: "editeur" });
    pageId = Number(created.location.match(/pages\/(\d+)/)[1]);
    slug = db.prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(pageId).slug;
  });
  after(() => srv.stop());
  const render = async (props) => {
    const rev = db.prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(pageId).revision;
    const r = await boss.request(`/marketing/pages/${pageId}/brouillon`, { method: "PUT", json: { revision: rev, content: { title: "V", sections: [{ type: "layout", children: [{ type: "container", children: [{ type: "image", props }] }] }] } } });
    assert.equal(r.status, 200, r.text);
    assert.equal((await boss.post(`/marketing/pages/${pageId}/publier.json`, {})).status, 200);
    return (await anon.get(`/p/${slug}`)).text;
  };
  test("visionneuse : l'image d'origine s'ouvre en grand même si une version réduite est affichée ; un lien l'emporte", async () => {
    let html = await render({ src: img.path, alt: "V", size: "small", lightbox: true });
    assert.match(html, /data-kw-lightbox/); assert.ok(html.includes(`<a href="${img.path}" class="kw-lb-open"`));
    assert.ok(html.includes("/v/320/"), "version réduite affichée dans la page");
    html = await render({ src: img.path, alt: "V", lightbox: true, link: "/catalogue" });
    assert.ok(!html.includes("kw-lb-open"), "un lien désactive la visionneuse");
    html = await render({ src: img.path, alt: "V" });
    assert.ok(!html.includes("kw-lb-open"), "sans réglage : rendu inchangé");
  });
});
