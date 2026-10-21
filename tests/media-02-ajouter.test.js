// KOLAKISA CMS — MEDIA-02 : « Ajouter un fichier média » (Téléverser un média) — vrai serveur, vraie base, vrais fichiers.
// Page et limites EFFECTIVES, méthode du navigateur (plusieurs fichiers en une requête), validation par le contenu, échec du stockage sans fichier orphelin,
// plafond de requête, droits et isolation par site, présence dans la médiathèque et dans le sélecteur de l'éditeur.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const zlib = require("node:zlib");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor, newStudent, Client } = require("./helpers");

function png(w, h, rgb = [2, 119, 182]) {
  const table = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
  const crc = (buf) => { let c = 0xffffffff; for (const b of buf) c = table[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([len, td, c]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2;
  const raw = Buffer.alloc((w * 3 + 1) * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) raw.set(rgb, y * (w * 3 + 1) + 1 + x * 3);
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
}
const pdf = (n = 1) => Buffer.from(`%PDF-1.4\n% fichier ${n}\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n`);

describe("media-02 : ajouter un fichier média", () => {
  let srv, boss, db, orgId, A, B, adminA, viewerA, adminB, uploadsDir;
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const all = (sql, ...a) => db.prepare(sql).all(...a);
  const AJ = "/marketing/site-web/mediatheque/ajouter", L = "/marketing/site-web/mediatheque";
  const idOf = (c) => one("SELECT id FROM users WHERE email = ?", c.email).id;
  const person = async (siteId, role) => { const c = await newStudent(srv); db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, ?)").run(siteId, idOf(c), role); return c; };
  const body = (r) => { try { return JSON.parse(r.text); } catch { return {}; } };
  const siteDir = (s) => path.join(uploadsDir, "marketing", String(orgId), s ? `site-${s}` : "");
  const filesIn = (dir) => (fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => fs.statSync(path.join(dir, f)).isFile()).sort() : []);
  const one_ = (client, buffer, name, site, type) => { const fd = new FormData(); fd.append("file", new Blob([buffer], { type: type || "application/octet-stream" }), name); return client.request(`${L}/televerser${site ? `?site=${site}` : ""}`, { method: "POST", multipart: fd }); };
  const many = (client, parts, site) => { const fd = new FormData(); for (const [buf, name, type] of parts) fd.append("files", new Blob([buf], { type: type || "application/octet-stream" }), name); return client.request(`${AJ}${site ? `?site=${site}` : ""}`, { method: "POST", multipart: fd }); };
  const flashOf = (html) => (html.match(/class="mk-flash[^"]*"[^>]*>[\s\S]*?<\/div>/) || [""])[0].replace(/<svg[\s\S]*?<\/svg>/g, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
  const followFlash = async (client, r) => flashOf((await client.get(r.location)).text);
  const setLimit = (client, key, value) => client.request(`/marketing/site-web/parametres/api/${key}`, { method: value === null ? "DELETE" : "PUT", ...(value === null ? {} : { json: { value } }) });

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db(); uploadsDir = path.join(srv.dir, "uploads");
    orgId = one("SELECT id FROM mk_organizations").id;
    const site = (n) => Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, ?, ?, '{}')").run(orgId, n, n.toLowerCase()).lastInsertRowid);
    A = site("Alpha"); B = site("Beta");
    adminA = await person(A, "admin"); viewerA = await person(A, "viewer"); adminB = await person(B, "admin");
  });
  after(() => srv.stop());

  describe("la page", () => {
    test("« Téléverser un média » : grande zone de dépôt, texte, bouton, plusieurs fichiers, formats et limites ; menu Médias › Ajouter un fichier média actif", async () => {
      const t = (await adminA.get(`${AJ}?site=${A}`)).text;
      assert.match(t, /<h1>Téléverser un média<\/h1>/);
      assert.match(t, /Déposez vos fichiers pour les téléverser/); assert.match(t, /<p class="mk-ml-or">ou<\/p>/); assert.match(t, /Sélectionnez des fichiers/);
      assert.match(t, /data-ml-drop/); assert.match(t, /<input type="file"[^>]*data-ml-input multiple/);
      assert.match(t, /Vous utilisez l'outil de téléversement multi-fichiers/); assert.match(t, /méthode du navigateur/);
      assert.match(t, /aria-current="page"[^>]*>(?:<[^>]+>)*[^<]*Ajouter un fichier média/);
      assert.doesNotMatch(t, /Speed up|WPForms|Elementor|3 Go/);
      for (const f of ["JPEG, PNG, GIF, WebP, AVIF", "MP4, WebM", "MP3, WAV, OGG, M4A", "PDF, Word, Excel, PowerPoint"]) assert.ok(t.includes(f), f);
      assert.match(t, new RegExp(`/marketing/site-web/sites/${A}/medias/ajouter\\?methode=navigateur`), "lien dans le cadre du site, jamais vers le site principal");
    });
    test("les limites affichées SONT les limites effectives du serveur (plafonds, puis Paramètres → Médias)", async () => {
      let t = (await boss.get(AJ)).text;
      assert.match(t, /image 5 Mo/); assert.match(t, /vidéo 50 Mo/); assert.match(t, /audio 25 Mo/); assert.match(t, /PDF 10 Mo/); assert.match(t, /Une requête ne peut pas dépasser 50 Mo/);
      assert.equal((await setLimit(boss, "media_max_image_mb", 1)).status, 200);
      t = (await boss.get(AJ)).text;
      assert.match(t, /image 1 Mo/); const cfg = JSON.parse(t.match(/<script type="application\/json" id="mu-config">([\s\S]*?)<\/script>/)[1]);
      assert.equal(cfg.limits.image, 1); assert.equal(cfg.requestMax, 50);
      const big = Buffer.concat([png(10, 10), Buffer.alloc(1.2 * 1048576)]);
      const r = await one_(adminA, big, "plus-d-un-mo.png", A, "image/png");
      assert.equal(r.status, 422); assert.match(body(r).error.message, /trop lourd/); assert.match(body(r).error.message, /1 Mo/, "le serveur applique la limite affichée");
      await setLimit(boss, "media_max_image_mb", null);
      assert.match((await boss.get(AJ)).text, /image 5 Mo/);
    });
    test("la configuration donnée au navigateur couvre tous les formats acceptés ; la Médiathèque reçoit la même (une seule file)", async () => {
      const lib = (await adminA.get(`${L}?site=${A}`)).text;
      const cfg = JSON.parse(lib.match(/<script type="application\/json" id="mu-config">([\s\S]*?)<\/script>/)[1]);
      assert.ok(Object.keys(cfg.extTypes).length >= 18); assert.ok(cfg.accept.includes(".webp") && cfg.accept.includes(".docx"));
      assert.match(lib, /data-ml-summary/); assert.equal(cfg.libraryUrl, `/marketing/site-web/sites/${A}/medias`, "la médiathèque du site, dans son cadre");
      const js = (await boss.get("/js/media-upload.js")).text; assert.match(js, /En cours de traitement/); assert.match(js, /beforeunload/);
    });
    test("droits : lecteur 403, anonyme refusé ; le site de la page est celui vérifié par le serveur", async () => {
      assert.equal((await viewerA.get(`${AJ}?site=${A}`)).status, 403);
      assert.equal((await adminA.get(`${AJ}?site=${B}`)).status, 403, "le site B lui est fermé");
      assert.ok([302, 401, 403].includes((await new Client(boss.base).get(AJ)).status));
    });
  });

  describe("méthode du navigateur : plusieurs fichiers, une requête", () => {
    test("la page de secours affiche un vrai formulaire (fichiers multiples)", async () => {
      const t = (await adminA.get(`${AJ}?site=${A}&methode=navigateur`)).text;
      assert.match(t, /<form[^>]*method="post"[^>]*action="[^"]*mediatheque\/ajouter\?site=\d+"[^>]*enctype="multipart\/form-data"/); assert.match(t, /<input id="mu-files" type="file" name="files" multiple/);
    });
    test("plusieurs fichiers valides : tous enregistrés dans le site, résumé réel, métadonnées complètes", async () => {
      const before = filesIn(siteDir(A)).length;
      const r = await many(adminA, [[png(30, 20, [1, 1, 1]), "un.png", "image/png"], [pdf(1), "deux.pdf", "application/pdf"], [png(12, 12, [9, 9, 9]), "trois.png", "image/png"]], A);
      assert.equal(r.status, 302); assert.match(await followFlash(adminA, r), /3 fichiers enregistrés dans la médiathèque de ce site/);
      const rows = all("SELECT * FROM mk_media WHERE site_id = ? AND name IN ('un.png', 'deux.pdf', 'trois.png') ORDER BY name", A);
      assert.deepEqual(rows.map((m) => m.name), ["deux.pdf", "trois.png", "un.png"]);
      for (const m of rows) { assert.equal(m.reach, "site"); assert.equal(m.created_by, idOf(adminA)); assert.ok(m.size > 0 && m.mime && m.created_at); assert.ok(fs.existsSync(path.join(uploadsDir, m.path.replace(/^\/uploads\//, "")))); }
      assert.deepEqual([rows[2].width, rows[2].height], [30, 20]); assert.equal(rows[0].type, "pdf");
      assert.equal(filesIn(siteDir(A)).length, before + 3);
    });
    test("échec partiel : les fichiers valides sont enregistrés, les autres refusés avec leur raison ; le résumé distingue les deux", async () => {
      const before = filesIn(siteDir(A)).length, n = one("SELECT COUNT(*) n FROM mk_media").n;
      const r = await many(adminA, [[png(8, 8, [3, 3, 3]), "bon.png", "image/png"], [Buffer.from("<script>alert(1)</script>"), "piege.png", "image/png"], [Buffer.from("MZ\x90\x00"), "setup.exe"], [pdf(2), "bon.pdf", "application/pdf"]], A);
      const f = await followFlash(adminA, r);
      assert.match(f, /2 fichiers enregistrés/); assert.match(f, /2 refusés/); assert.match(f, /piege\.png/); assert.match(f, /setup\.exe/);
      assert.equal(one("SELECT COUNT(*) n FROM mk_media").n, n + 2); assert.equal(filesIn(siteDir(A)).length, before + 2, "aucun fichier refusé n'est resté sur le disque");
    });
    test("aucun fichier valide : message d'échec ; aucun fichier choisi : message clair ; trop de fichiers refusé", async () => {
      const n = one("SELECT COUNT(*) n FROM mk_media").n;
      assert.match(await followFlash(adminA, await many(adminA, [[Buffer.from("rien"), "a.png", "image/png"]], A)), /Aucun fichier n(?:'|&#39;)a pu être enregistré/);
      assert.match(await followFlash(adminA, await many(adminA, [], A)), /au moins un fichier/);
      const tooMany = await many(adminA, Array.from({ length: 21 }, (_, i) => [png(5, 5, [i, i, i]), `m${i}.png`, "image/png"]), A);
      assert.match(await followFlash(adminA, tooMany), /20 au plus/);
      assert.equal(one("SELECT COUNT(*) n FROM mk_media").n, n);
    });
    test("droits et site : lecteur 403 ; un autre site 403 ; sans droit rien n'est écrit", async () => {
      const n = one("SELECT COUNT(*) n FROM mk_media").n, files = filesIn(siteDir(B)).length;
      assert.equal((await many(viewerA, [[png(5, 5), "v.png", "image/png"]], A)).status, 403);
      assert.equal((await many(adminA, [[png(5, 5), "x.png", "image/png"]], B)).status, 403);
      assert.ok([302, 401, 403].includes((await many(new Client(boss.base), [[png(5, 5), "anon.png", "image/png"]], A)).status));
      assert.equal(one("SELECT COUNT(*) n FROM mk_media").n, n); assert.equal(filesIn(siteDir(B)).length, files);
    });
  });

  describe("validation côté serveur", () => {
    test("type MIME falsifié ou extension trompeuse : le CONTENU décide (HTML déclaré image, PNG nommé .php, PDF déclaré image)", async () => {
      assert.equal((await one_(adminA, Buffer.from("<html><script>alert(1)</script></html>"), "x.png", A, "image/png")).status, 422);
      const disguised = await one_(adminA, png(9, 9, [5, 6, 7]), "photo.php.png", A, "text/html");
      assert.equal(disguised.status, 201); assert.match(body(disguised).media.path, /\.png$/); assert.equal(body(disguised).media.mime, "image/png");
      const realPdf = await one_(adminA, pdf(3), "fausse-image.png", A, "image/png");
      assert.equal(realPdf.status, 201); assert.equal(body(realPdf).media.type, "pdf"); assert.match(body(realPdf).media.path, /\.pdf$/, "l'extension enregistrée vient du contenu");
    });
    test("nom hostile : jamais un chemin ; nom de stockage fabriqué ; traversée impossible", async () => {
      for (const name of ["../../../etc/passwd.png", "..\\..\\windows\\x.png", "a/b/c.png", "x\u0000.png", "%2e%2e%2fy.png"]) {
        const r = await one_(adminA, png(6, 6, [name.length, 1, 1]), name, A, "image/png");
        if (name.includes("\u0000")) { assert.equal(r.status, 422, "un nom contenant un octet nul est refusé"); continue; }
        assert.equal(r.status, 201, name); const m = body(r).media;
        assert.ok(!/[\\/]/.test(m.name) && !m.name.includes("\u0000"), m.name); assert.match(m.path, new RegExp(`^/uploads/marketing/${orgId}/site-${A}/\\d+-[0-9a-f]{12}\\.png$`));
      }
    });
    test("fichier plus gros qu'une requête (50 Mo) : refusé avec la limite, rien d'écrit ; les envois suivants fonctionnent", async () => {
      const before = filesIn(siteDir(A)).length, n = one("SELECT COUNT(*) n FROM mk_media").n;
      const r = await one_(adminA, Buffer.alloc(51 * 1048576, 1), "colossal.mp4", A, "video/mp4");
      assert.equal(r.status, 422); assert.match(body(r).error.message, /taille maximale/); assert.match(body(r).error.message, /50 Mo/);
      assert.equal(one("SELECT COUNT(*) n FROM mk_media").n, n); assert.equal(filesIn(siteDir(A)).length, before);
      assert.equal((await one_(adminA, png(7, 7, [4, 4, 4]), "apres.png", A, "image/png")).status, 201);
    });
    test("fichier vide ou illisible : refusé ; permission d'envoi insuffisante : 403", async () => {
      assert.equal((await one_(adminA, Buffer.alloc(0), "vide.png", A, "image/png")).status, 422);
      assert.equal((await one_(viewerA, png(5, 5), "v.png", A, "image/png")).status, 403);
    });
  });

  describe("stockage", () => {
    test("stockage indisponible : message honnête (503), aucune fiche, aucun fichier orphelin, et l'envoi suivant réussit", { skip: process.getuid && process.getuid() === 0 ? "exécuté en tant que root : les permissions de dossier ne s'appliquent pas" : false }, async () => {
      const dir = siteDir(A), n = one("SELECT COUNT(*) n FROM mk_media").n, before = filesIn(dir);
      fs.chmodSync(dir, 0o500);
      try {
        const r = await one_(adminA, png(14, 14, [9, 1, 9]), "bloque.png", A, "image/png");
        assert.equal(r.status, 503); assert.match(body(r).error.message, /stockage est indisponible/);
        assert.equal(one("SELECT COUNT(*) n FROM mk_media").n, n, "aucune fiche sans fichier"); assert.deepEqual(filesIn(dir), before, "aucun fichier orphelin");
        const classic = await many(adminA, [[png(15, 15, [9, 2, 9]), "bloque2.png", "image/png"]], A);
        assert.match(await followFlash(adminA, classic), /stockage est indisponible/);
      } finally { fs.chmodSync(dir, 0o755); }
      assert.equal((await one_(adminA, png(14, 14, [9, 3, 9]), "debloque.png", A, "image/png")).status, 201);
    });
    test("aucun fichier temporaire : tout ce qui est écrit est une fiche enregistrée (médiathèque de l'organisation)", () => {
      const known = new Set(all("SELECT path FROM mk_media WHERE organization_id = ?", orgId).map((m) => path.basename(m.path)));
      for (const dir of [siteDir(A), siteDir(B)]) for (const f of filesIn(dir)) assert.ok(known.has(f), `${f} sans fiche`);
    });
    test("un fichier d'un autre site n'est jamais touché par un envoi ou un échec", async () => {
      const mine = body(await one_(adminB, png(21, 21, [1, 2, 3]), "beta.png", B, "image/png")).media;
      const sum = fs.readFileSync(path.join(uploadsDir, mine.path.replace(/^\/uploads\//, "")));
      await many(adminA, [[Buffer.from("x"), "x.png", "image/png"]], A); await one_(adminA, Buffer.from("x"), "y.png", B, "image/png");
      assert.ok(fs.readFileSync(path.join(uploadsDir, mine.path.replace(/^\/uploads\//, ""))).equals(sum));
      assert.equal(one("SELECT site_id s FROM mk_media WHERE id = ?", mine.id).s, B);
    });
  });

  describe("isolation et intégration", () => {
    test("importé depuis le site A : appartient à A, absent de B, trouvé par la recherche et les filtres de A, jamais ceux de B", async () => {
      const up = body(await one_(adminA, png(33, 22, [66, 66, 66]), "visible-chez-alpha.png", A, "image/png")).media;
      assert.equal(up.siteId, A);
      const names = async (c, qs) => body(await c.get(`${L}/liste.json?${qs}`)).items.map((m) => m.name);
      assert.ok((await names(adminA, `site=${A}&q=visible-chez`)).includes("visible-chez-alpha.png"));
      assert.ok((await names(adminA, `site=${A}&type=image`)).includes("visible-chez-alpha.png"), "disponible dans le sélecteur (images) de l'éditeur du site");
      assert.deepEqual(await names(adminB, `site=${B}&q=visible-chez`), []);
      assert.ok(!(await adminB.get(`${L}?site=${B}`)).text.includes("visible-chez-alpha"));
      assert.equal((await adminB.get(`${L}/${up.id}.json?site=${B}`)).status, 403);
      assert.ok((await adminA.get(`${L}?site=${A}&mois=${new Date().toISOString().slice(0, 7)}`)).text.includes("visible-chez-alpha.png"), "réapparaît après rechargement, filtre par mois compris");
    });
    test("site falsifié dans la requête : l'envoi vers B par l'administrateur de A est refusé (query, formulaire, corps), rien n'est écrit dans B", async () => {
      const n = all("SELECT id FROM mk_media WHERE site_id = ?", B).length, files = filesIn(siteDir(B)).length;
      assert.equal((await one_(adminA, png(5, 5, [8, 8, 8]), "intrus.png", B, "image/png")).status, 403);
      const fd = new FormData(); fd.append("file", new Blob([png(5, 5, [8, 8, 9])], { type: "image/png" }), "intrus2.png"); fd.append("site", String(B)); fd.append("site_id", String(B));
      const viaBody = await adminA.request(`${L}/televerser?site=${A}`, { method: "POST", multipart: fd });
      assert.equal(viaBody.status, 201); assert.equal(body(viaBody).media.siteId, A, "le champ du corps est ignoré : le site vient de l'adresse vérifiée");
      assert.equal(all("SELECT id FROM mk_media WHERE site_id = ?", B).length, n); assert.equal(filesIn(siteDir(B)).length, files);
    });
    test("équipe : sans site choisi, le fichier va à la médiathèque du site principal ; avec un site choisi, à celui-ci", async () => {
      const main = body(await one_(boss, png(40, 40, [70, 70, 70]), "principal.png", null, "image/png")).media;
      assert.deepEqual([main.reach, main.siteId], ["shared", null]); assert.match(main.path, new RegExp(`^/uploads/marketing/${orgId}/\\d+-[0-9a-f]{12}\\.png$`));
      const inB = body(await one_(boss, png(41, 41, [71, 71, 71]), "chez-beta.png", B, "image/png")).media;
      assert.deepEqual([inB.reach, inB.siteId], ["site", B]);
    });
    test("éditeur d'articles : un fichier importé depuis le site A est choisissable comme image mise en avant d'un article de A", async () => {
      const up = body(await one_(adminA, png(50, 30, [12, 34, 56]), "pour-article.png", A, "image/png")).media;
      const fd = new FormData(); Object.entries({ title: "Article avec import", excerpt: "R.", content_format: "html", status: "draft", content: "<p>x</p>", cover_media: up.path }).forEach(([k, v]) => fd.append(k, v));
      const r = await adminA.request(`/formateur/blog/nouveau?site=${A}`, { method: "POST", multipart: fd, headers: { "x-blog-editor": "1" } });
      assert.ok(r.status < 300, r.text.slice(0, 200)); const out = body(r);
      assert.equal(one("SELECT cover_path, featured_media_id FROM posts WHERE id = ?", out.id).cover_path, up.path);
    });
  });
});
