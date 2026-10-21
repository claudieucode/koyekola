// KOLAKISA CMS — MEDIA-01 : médiathèque à la manière de WordPress, UNE MÉDIATHÈQUE DISTINCTE PAR SITE.
// Vrai serveur, vraie base, vrais fichiers sur disque : disposition, envoi (validation par la signature réelle), grille / liste, filtres (type, mois, recherche),
// pagination, détails et métadonnées, corbeille et suppression (références), sélection groupée, intégration à l'éditeur d'articles, isolation stricte entre sites.
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

describe("media-01 : médiathèque", () => {
  let srv, boss, db, orgId, A, B, adminA, viewerA, adminB, uploadsDir;
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const all = (sql, ...a) => db.prepare(sql).all(...a);
  const L = "/marketing/site-web/mediatheque";
  const idOf = (c) => one("SELECT id FROM users WHERE email = ?", c.email).id;
  const person = async (siteId, role) => { const c = await newStudent(srv); db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, ?)").run(siteId, idOf(c), role); return c; };
  const send = (client, buffer, name, site, type = "application/octet-stream") => { const fd = new FormData(); fd.append("file", new Blob([buffer], { type }), name); return client.request(`${L}/televerser${site ? `?site=${site}` : ""}`, { method: "POST", multipart: fd }); };
  const body = (r) => { try { return JSON.parse(r.text); } catch { return {}; } };
  const mediaRow = (id) => one("SELECT * FROM mk_media WHERE id = ?", id);
  const diskOf = (p) => path.join(uploadsDir, p.replace(/^\/uploads\//, ""));
  const names = (html) => [...html.matchAll(/data-ml-name[^>]*>([^<]+)</g)].map((m) => m[1].trim()).sort();
  const listNames = async (client, qs) => { const r = await client.get(`${L}/liste.json?${qs}`); return { status: r.status, names: r.status === 200 ? body(r).items.map((m) => m.name).sort() : null, total: r.status === 200 ? body(r).total : null }; };
  const fake = (site, name, type, createdAt, extra = {}) => Number(db.prepare("INSERT INTO mk_media (organization_id, kind, type, path, name, mime, size, width, height, alt, title, caption, description, created_at, reach, site_id) VALUES (?, ?, ?, ?, ?, ?, 100, 10, 10, ?, ?, ?, ?, ?, ?, ?)")
    .run(orgId, type === "image" ? "image" : "document", type, `/uploads/marketing/${orgId}/${site ? `site-${site}/` : ""}fake-${Math.random().toString(36).slice(2)}.${type === "image" ? "png" : "pdf"}`, name, type === "image" ? "image/png" : "application/pdf", extra.alt || "", extra.title || "", extra.caption || "", extra.description || "", createdAt, site ? "site" : "shared", site || null).lastInsertRowid);
  let imgA, docA, imgB, common;

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db(); uploadsDir = path.join(srv.dir, "uploads");
    orgId = one("SELECT id FROM mk_organizations").id;
    const site = (n) => Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, ?, ?, '{}')").run(orgId, n, n.toLowerCase()).lastInsertRowid);
    A = site("Alpha"); B = site("Beta");
    adminA = await person(A, "admin"); viewerA = await person(A, "viewer"); adminB = await person(B, "admin");
  });
  after(() => srv.stop());

  describe("disposition", () => {
    test("titre « Médiathèque », bouton d'ajout, barre (liste / grille, type, dates, sélection groupée, recherche), état vide honnête", async () => {
      const t = (await adminA.get(`${L}?site=${A}`)).text;
      assert.match(t, /<h1>Médiathèque<\/h1>/); assert.match(t, /Ajouter un fichier média/);
      assert.match(t, /aria-label="Affichage en liste"/); assert.match(t, /aria-label="Affichage en grille"/);
      assert.match(t, /Tous les médias \(0\)/); assert.match(t, /<option value="image">Images/); assert.match(t, /<option value="audio">Audio/); assert.match(t, /<option value="video">Vidéo/); assert.match(t, /<option value="documents">Documents/);
      assert.match(t, /Toutes les dates/); assert.match(t, /Sélection groupée/); assert.match(t, /Rechercher des médias/);
      assert.match(t, /Aucun fichier/); assert.doesNotMatch(t, /Speed up|WPForms|Elementor/, "aucune notification promotionnelle");
    });
    test("Médias → Médiathèque et Ajouter un fichier média : sous-rubriques du menu ; « Ajouter » est une page dédiée (MEDIA-02)", async () => {
      const page = await boss.get(`${L}/ajouter`);
      assert.equal(page.status, 200);
      assert.match(page.text, /aria-current="page"[^>]*>(?:<[^>]+>)*[^<]*Ajouter un fichier média/);
      assert.match(page.text, /<h1>Téléverser un média<\/h1>/);
      assert.match((await boss.get(`${L}?site=${A}`)).text, /id="ml-upload" hidden/, "sur la médiathèque, la zone d'envoi s'ouvre avec le bouton");
      assert.equal((await viewerA.get(`${L}/ajouter?site=${A}`)).status, 403, "lecteur : pas d'envoi");
    });
    test("le site accompagne chaque appel du navigateur : balise mk-media-site et noyau KWMedia", async () => {
      assert.match((await boss.get(`${L}?site=${A}`)).text, new RegExp(`<meta name="mk-media-site" content="${A}">`));
      assert.match((await adminA.get(`${L}?site=${A}`)).text, new RegExp(`<meta name="mk-media-site" content="${A}">`));
      assert.doesNotMatch((await boss.get(L)).text, /mk-media-site/, "sans site : médiathèque de l'organisation");
      const js = (await boss.get("/js/kwmedia.js")).text;
      assert.match(js, /mk-media-site/); assert.match(js, /withSite\(BASE \+ "\/televerser"\)/); assert.match(js, /fetch\(withSite\(url\)/);
    });
  });

  describe("importation", () => {
    test("image : enregistrée dans le dossier du site, type et dimensions lus dans le fichier, auteur et site enregistrés", async () => {
      const r = await send(adminA, png(40, 30), "Mon image.png", A, "image/png");
      assert.equal(r.status, 201, r.text); const m = body(r).media; imgA = m;
      assert.deepEqual([m.type, m.width, m.height, m.reach, m.siteId], ["image", 40, 30, "site", A]);
      assert.match(m.path, new RegExp(`^/uploads/marketing/${orgId}/site-${A}/\\d+-[0-9a-f]{12}\\.png$`));
      assert.ok(fs.existsSync(diskOf(m.path)), "fichier présent sur le disque"); assert.equal(m.name, "Mon image.png");
      assert.equal(mediaRow(m.id).created_by, idOf(adminA));
    });
    test("document PDF et fichier audio/vidéo autorisés selon leur contenu réel", async () => {
      const r = await send(adminA, pdf(), "Dossier.pdf", A, "application/pdf");
      assert.equal(r.status, 201, r.text); docA = body(r).media; assert.equal(docA.type, "pdf"); assert.equal(docA.siteId, A);
    });
    test("envoi multiple : chaque fichier a son propre résultat ; l'échec de l'un ne bloque pas les autres", async () => {
      const results = [];
      for (const [buf, name] of [[png(8, 8, [1, 2, 3]), "a.png"], [Buffer.from("pas une image du tout"), "faux.png"], [png(9, 9, [4, 5, 6]), "c.png"]]) results.push(await send(adminA, buf, name, A, "image/png"));
      assert.deepEqual(results.map((r) => r.status), [201, 422, 201]);
      assert.match(body(results[1]).error.message, /Format non pris en charge|n'est pas autorisé/);
      assert.deepEqual(all("SELECT name FROM mk_media WHERE site_id = ? AND name IN ('a.png', 'faux.png', 'c.png') ORDER BY name", A).map((r) => r.name), ["a.png", "c.png"]);
    });
    test("types dangereux ou trompeurs refusés d'après le CONTENU : SVG, exécutable, HTML déguisé en image, script", async () => {
      const n = one("SELECT COUNT(*) n FROM mk_media").n;
      const cases = [["logo.svg", Buffer.from("<svg xmlns='http://www.w3.org/2000/svg'><script>alert(1)</script></svg>"), "image/svg+xml"], ["setup.exe", Buffer.from("MZ\x90\x00\x03\x00\x00\x00"), "application/octet-stream"],
        ["page.png", Buffer.from("<html><script>alert(1)</script></html>"), "image/png"], ["x.php", Buffer.from("<?php system($_GET['c']); ?>"), "image/jpeg"], ["vide.png", Buffer.alloc(0), "image/png"]];
      for (const [name, buf, type] of cases) { const r = await send(adminA, buf, name, A, type); assert.equal(r.status, 422, name); assert.ok(body(r).error.message, name); }
      assert.equal(one("SELECT COUNT(*) n FROM mk_media").n, n, "rien d'enregistré");
      assert.deepEqual(fs.readdirSync(path.join(uploadsDir, "marketing", String(orgId), `site-${A}`)).filter((f) => /\.(svg|exe|php|html)$/i.test(f)), []);
    });
    test("fichier trop volumineux : message explicite avec la limite, rien d'enregistré", async () => {
      const big = Buffer.concat([png(10, 10), Buffer.alloc(5.5 * 1048576)]);
      const n = one("SELECT COUNT(*) n FROM mk_media").n;
      const r = await send(adminA, big, "enorme.png", A, "image/png");
      assert.equal(r.status, 422); assert.match(body(r).error.message, /trop lourd|dépasse/i); assert.match(body(r).error.message, /5 Mo/);
      assert.equal(one("SELECT COUNT(*) n FROM mk_media").n, n);
    });
    test("nom d'origine : jamais un chemin ; le nom de stockage est fabriqué par le serveur (aucune traversée)", async () => {
      const r = await send(adminA, png(6, 6, [9, 9, 9]), "../../../etc/passwd.png", A, "image/png");
      assert.equal(r.status, 201); const m = body(r).media;
      assert.equal(m.name, "passwd.png"); assert.ok(!m.path.includes(".."), m.path);
      assert.ok(diskOf(m.path).startsWith(path.join(uploadsDir, "marketing", String(orgId), `site-${A}`)));
    });
    test("lecteur : envoi refusé (403), rien d'écrit ; anonyme refusé", async () => {
      const n = one("SELECT COUNT(*) n FROM mk_media").n;
      assert.equal((await send(viewerA, png(5, 5), "v.png", A, "image/png")).status, 403);
      assert.ok([302, 401, 403].includes((await send(new Client(boss.base), png(5, 5), "anon.png", A, "image/png")).status));
      assert.equal(one("SELECT COUNT(*) n FROM mk_media").n, n);
    });
  });

  describe("isolation par site", () => {
    test("site B : son propre média ; A et B ne se voient jamais (liste, compteurs, mois, recherche, détails)", async () => {
      imgB = body(await send(adminB, png(50, 50, [200, 0, 0]), "secret-beta.png", B, "image/png")).media;
      assert.equal(imgB.siteId, B); assert.match(imgB.path, new RegExp(`/site-${B}/`));
      common = fake(null, "historique-commun.png", "image", "2023-05-10 10:00:00");
      const a = await listNames(adminA, `site=${A}`);
      assert.ok(a.names.includes("Mon image.png") && !a.names.includes("secret-beta.png") && !a.names.includes("historique-commun.png"), a.names.join());
      const b = await listNames(adminB, `site=${B}`); assert.deepEqual(b.names, ["secret-beta.png"]);
      assert.deepEqual((await listNames(adminA, `site=${A}&q=secret`)).names, [], "la recherche ne révèle rien d'un autre site");
      assert.deepEqual((await listNames(adminA, `site=${A}&q=historique`)).names, [], "les fichiers communs historiques ne sont plus proposés dans un site");
      const page = (await adminA.get(`${L}?site=${A}`)).text;
      assert.ok(!page.includes("secret-beta") && !page.includes("historique-commun"));
      assert.ok(!page.includes("2023") && !/mai 2023/.test(page), "les mois proposés ne viennent que du site");
    });
    test("accès par identifiant ou site falsifié : refusé, jamais le fichier d'un autre site", async () => {
      assert.equal((await adminA.get(`${L}/${imgB.id}.json?site=${A}`)).status, 403);
      assert.equal((await adminA.get(`${L}/${imgB.id}.json`)).status, 403);
      assert.equal((await adminA.get(`${L}/liste.json?site=${B}`)).status, 403, "le site B lui est fermé");
      assert.equal((await send(adminA, png(7, 7), "x.png", B, "image/png")).status, 403, "pas d'envoi dans un autre site");
      assert.equal((await adminA.get(`${L}/${common}.json?site=${A}`)).status, 403);
    });
    test("modifier, mettre à la corbeille, restaurer, supprimer le média d'un autre site : refusé, rien ne change", async () => {
      const before = JSON.stringify(mediaRow(imgB.id));
      const attempts = [[`${L}/${imgB.id}?site=${A}`, { alt: "piraté" }], [`${L}/${imgB.id}/corbeille?site=${A}`, {}], [`${L}/${imgB.id}/restaurer?site=${A}`, {}], [`${L}/${imgB.id}/supprimer?site=${A}`, {}], [`${L}/${imgB.id}/partage?site=${A}`, { reach: "shared" }]];
      for (const [u, f] of attempts) { const r = await adminA.postJson(u, f); assert.ok([403, 404].includes(r.status), `${u} → ${r.status}`); }
      assert.equal(JSON.stringify(mediaRow(imgB.id)), before); assert.ok(fs.existsSync(diskOf(imgB.path)));
    });
    test("actions groupées : seuls les médias du site sont touchés (les autres sont refusés et listés)", async () => {
      const mine = body(await send(adminA, png(11, 11, [7, 7, 7]), "lot.png", A, "image/png")).media;
      const r = await adminA.postJson(`${L}/actions?site=${A}`, { action: "corbeille", ids: [mine.id, imgB.id, common] });
      assert.equal(r.status, 200); const out = body(r);
      assert.deepEqual(out.done, [mine.id]); assert.deepEqual(out.failed.map((f) => f.id).sort(), [imgB.id, common].sort());
      assert.ok(mediaRow(mine.id).deleted_at); assert.equal(mediaRow(imgB.id).deleted_at, null); assert.equal(mediaRow(common).deleted_at, null);
      await adminA.postJson(`${L}/${mine.id}/restaurer?site=${A}`, {});
    });
    test("équipe : sans site choisi elle voit la médiathèque du SITE PRINCIPAL ; la vue d'ensemble est un choix explicite (?portee=tous) ; avec un site choisi, seulement ce site", async () => {
      assert.deepEqual((await listNames(boss, "")).names, ["historique-commun.png"], "par défaut : le site principal, jamais tous les sites");
      const everything = (await listNames(boss, "portee=tous")).names;
      assert.ok(["Mon image.png", "secret-beta.png", "historique-commun.png"].every((n) => everything.includes(n)));
      assert.ok(!(await listNames(boss, `site=${A}`)).names.includes("secret-beta.png"));
      assert.deepEqual((await listNames(boss, `site=${B}`)).names, ["secret-beta.png"]);
    });
    test("stockage : un dossier par site ; l'adresse d'un fichier ne se devine pas et le dossier ne se liste pas", async () => {
      const dirA = path.join(uploadsDir, "marketing", String(orgId), `site-${A}`), dirB = path.join(uploadsDir, "marketing", String(orgId), `site-${B}`);
      assert.ok(fs.existsSync(dirA) && fs.existsSync(dirB) && dirA !== dirB);
      assert.ok(fs.readdirSync(dirB).includes(path.basename(imgB.path)) && !fs.readdirSync(dirA).includes(path.basename(imgB.path)));
      // Dossier non listé ; aucune sortie du dossier des médias (un chemin « ../ » qui reste DANS le dossier public revient à l'adresse publique du même fichier : rien de nouveau)
      for (const u of [`/uploads/marketing/${orgId}/site-${A}/`, `/uploads/marketing/${orgId}/`, `/uploads/marketing/`, `/uploads/marketing/${orgId}/site-${A}/..%2f..%2f..%2f..%2f..%2fpackage.json`, `/uploads/marketing/${orgId}/%2e%2e/%2e%2e/%2e%2e/package.json`, `/uploads/marketing/..%2f..%2fpackage.json`]) {
        const r = await new Client(boss.base).get(u);
        assert.ok(r.status >= 300 && !/"name"|PNG|<ul/.test(r.text.slice(0, 200)), `${u} → ${r.status}`);
      }
      const direct = await new Client(boss.base).get(imgB.path);
      assert.equal(direct.status, 200, "un média public garde son adresse publique (c'est le fonctionnement des pages) : adresse non devinable, jamais listée");
      assert.equal(direct.headers.get("x-content-type-options"), "nosniff");
    });
  });

  describe("affichage, filtres, recherche, pagination", () => {
    let m1, m2, m3;
    test("jeu d'essai du site A : mois et types différents", async () => {
      db.prepare("DELETE FROM mk_media WHERE site_id = ? AND name NOT IN ('Mon image.png', 'Dossier.pdf')").run(A);
      m1 = fake(A, "rapport-mars.pdf", "pdf", "2024-03-05 09:00:00", { description: "bilan trimestriel" });
      m2 = fake(A, "photo-mars.png", "image", "2024-03-20 09:00:00", { alt: "coucher de soleil", caption: "Légende dorée", title: "Titre solaire" });
      m3 = fake(A, "photo-juin.png", "image", "2024-06-01 09:00:00");
      assert.ok(m1 && m2 && m3);
    });
    test("grille et liste : mêmes données, mêmes filtres ; le changement de vue conserve la recherche, le type et le mois", async () => {
      const grid = (await adminA.get(`${L}?site=${A}&mois=2024-03`)).text, list = (await adminA.get(`${L}?site=${A}&mois=2024-03&vue=liste`)).text;
      assert.match(grid, /data-ml-grid/); assert.doesNotMatch(grid, /data-ml-list/); assert.match(list, /data-ml-list/); assert.doesNotMatch(list, /data-ml-grid/);
      assert.deepEqual(names(grid), ["photo-mars.png", "rapport-mars.pdf"]); assert.deepEqual(names(list), names(grid));
      assert.match(grid, /vue=liste[^"]*mois=2024-03|mois=2024-03[^"]*vue=liste/, "le lien Liste garde le filtre");
      for (const col of ["Fichier", "Type", "Taille", "Dimensions", "Ajouté le", "Auteur"]) assert.ok(list.includes(`>${col}<`), col);
      assert.match(grid, /<img src="\/uploads\/marketing\/[^"]+" alt="" loading="lazy"/, "vraie miniature d'image"); assert.match(grid, /mk-ml-badge">PDF</, "badge PDF, pas une icône d'image");
    });
    test("filtre par date : mois réellement présents, résultats réels, combiné au type, à la recherche et à la pagination", async () => {
      const t = (await adminA.get(`${L}?site=${A}`)).text;
      assert.match(t, /<option value="2024-03">mars 2024/); assert.match(t, /<option value="2024-06">juin 2024/); assert.ok(!t.includes("2023"));
      assert.deepEqual((await listNames(adminA, `site=${A}&mois=2024-06`)).names, ["photo-juin.png"]);
      assert.deepEqual((await listNames(adminA, `site=${A}&mois=2024-03&type=image`)).names, ["photo-mars.png"]);
      assert.deepEqual((await listNames(adminA, `site=${A}&mois=2024-03&type=documents`)).names, ["rapport-mars.pdf"]);
      assert.deepEqual((await listNames(adminA, `site=${A}&mois=2024-03&q=photo`)).names, ["photo-mars.png"]);
      assert.deepEqual((await listNames(adminA, `site=${A}&mois=2030-01`)).names, []);
      assert.equal((await adminA.get(`${L}?site=${A}&mois=n-importe-quoi`)).status, 200, "valeur invalide ignorée");
    });
    test("filtre par type : seulement les types gérés ; compteurs par type du site", async () => {
      assert.deepEqual((await listNames(adminA, `site=${A}&type=image`)).names, ["Mon image.png", "photo-juin.png", "photo-mars.png"].sort());
      assert.deepEqual((await listNames(adminA, `site=${A}&type=video`)).names, []);
      const t = (await adminA.get(`${L}?site=${A}`)).text;
      assert.match(t, /Images \(3\)/); assert.match(t, /Documents \(2\)/); assert.match(t, /Tous les médias \(5\)/);
    });
    test("recherche : nom, titre, texte alternatif, légende, description ; état vide ; joker % littéral ; retour à la liste complète", async () => {
      for (const [q, expected] of [["rapport", ["rapport-mars.pdf"]], ["solaire", ["photo-mars.png"]], ["coucher", ["photo-mars.png"]], ["dorée", ["photo-mars.png"]], ["trimestriel", ["rapport-mars.pdf"]]]) assert.deepEqual((await listNames(adminA, `site=${A}&q=${encodeURIComponent(q)}`)).names, expected, q);
      const none = (await adminA.get(`${L}?site=${A}&q=zzzz`)).text; assert.match(none, /Aucun fichier trouvé/); assert.match(none, /Réinitialiser/);
      assert.deepEqual((await listNames(adminA, `site=${A}&q=%25`)).names, []);
    });
    test("pagination : total exact, pages, aucune ligne répétée, filtres conservés", async () => {
      for (let i = 1; i <= 50; i++) fake(A, `lot-${String(i).padStart(2, "0")}.png`, "image", "2025-01-15 10:00:00");
      const p1 = (await adminA.get(`${L}?site=${A}&mois=2025-01`)).text, p2 = (await adminA.get(`${L}?site=${A}&mois=2025-01&page=2`)).text;
      assert.match(p1, /50 fichiers/); assert.match(p1, /Page 1 sur 2/); assert.match(p1, /mois=2025-01[^"]*page=2|page=2[^"]*mois=2025-01/);
      assert.equal(names(p1).length, 48); assert.equal(names(p2).length, 2);
      assert.equal(new Set([...names(p1), ...names(p2)]).size, 50);
      db.prepare("DELETE FROM mk_media WHERE name LIKE 'lot-%' AND site_id = ?").run(A);
    });
    test("sélection groupée : cases et actions seulement avec le droit d'écrire ; lecteur : consultation seule", async () => {
      const w = (await adminA.get(`${L}?site=${A}`)).text, v = (await viewerA.get(`${L}?site=${A}`)).text;
      assert.match(w, /data-ml-select-toggle/); assert.match(w, /data-ml-check/); assert.match(w, /<option value="corbeille">/);
      assert.doesNotMatch(v, /data-ml-select-toggle|data-ml-check|data-ml-bulk-action/); assert.match(v, /data-ml-open/, "le lecteur peut consulter les détails");
    });
  });

  describe("détails, métadonnées, corbeille, suppression", () => {
    test("détails : informations réelles ; métadonnées modifiables et persistantes ; URL réelle du fichier", async () => {
      const d = body(await adminA.get(`${L}/${imgA.id}.json?site=${A}`));
      assert.equal(d.media.name, "Mon image.png"); assert.equal(d.media.width, 40); assert.equal(d.media.author !== undefined, true);
      assert.equal(d.media.url, `https://k.test${imgA.path}`.replace("https://k.test", d.media.url.replace(imgA.path, "")), "URL = adresse publique du fichier");
      const r = await adminA.postJson(`${L}/${imgA.id}?site=${A}`, { alt: "Un carré bleu", title: "Carré", caption: "Légende du carré", description: "Description longue", name: "carre-bleu.png" });
      assert.equal(r.status, 200, r.text);
      const row = mediaRow(imgA.id); assert.deepEqual([row.alt, row.title, row.caption, row.description, row.name], ["Un carré bleu", "Carré", "Légende du carré", "Description longue", "carre-bleu.png"]);
      assert.equal(row.path, imgA.path, "le fichier original et son adresse ne changent pas"); assert.ok(fs.existsSync(diskOf(imgA.path)));
      assert.equal(body(await adminA.get(`${L}/${imgA.id}.json?site=${A}`)).media.alt, "Un carré bleu", "persistant après rechargement");
      assert.equal((await viewerA.postJson(`${L}/${imgA.id}?site=${A}`, { alt: "x" })).status, 403);
    });
    test("références : un média utilisé par un article est signalé ; sa suppression définitive est refusée avec l'article cité ; aucun contenu supprimé", async () => {
      const slug = "article-avec-image";
      const postId = Number(db.prepare("INSERT INTO posts (slug, title, content, published, status, cover_path, created_at, updated_at) VALUES (?, 'Article avec image', '<p>x</p>', 0, 'draft', ?, datetime('now'), datetime('now'))").run(slug, imgA.path).lastInsertRowid);
      const d = body(await adminA.get(`${L}/${imgA.id}.json?site=${A}`));
      assert.ok(d.usage.some((u) => u.kind === "article" && u.name === "Article avec image"));
      assert.equal((await adminA.postJson(`${L}/${imgA.id}/corbeille?site=${A}`, {})).status, 200, "la corbeille est permise (le fichier reste en place)");
      const purge = await adminA.postJson(`${L}/${imgA.id}/supprimer?site=${A}`, {});
      assert.equal(purge.status, 409); assert.match(body(purge).error.message, /article « Article avec image »/);
      assert.ok(mediaRow(imgA.id) && fs.existsSync(diskOf(imgA.path)), "fiche et fichier conservés"); assert.ok(one("SELECT 1 FROM posts WHERE id = ?", postId));
      db.prepare("UPDATE posts SET cover_path = NULL WHERE id = ?").run(postId);
      await adminA.postJson(`${L}/${imgA.id}/restaurer?site=${A}`, {});
    });
    test("suppression d'un fichier inutilisé : corbeille puis suppression définitive (fiche ET fichier) ; avant la corbeille : refusée", async () => {
      const m = body(await send(adminA, png(12, 12, [8, 1, 1]), "ephemere.png", A, "image/png")).media;
      assert.equal((await adminA.postJson(`${L}/${m.id}/supprimer?site=${A}`, {})).status, 409, "d'abord la corbeille");
      await adminA.postJson(`${L}/${m.id}/corbeille?site=${A}`, {});
      assert.equal((await adminA.postJson(`${L}/${m.id}/supprimer?site=${A}`, {})).status, 200);
      assert.equal(mediaRow(m.id), undefined); assert.ok(!fs.existsSync(diskOf(m.path)), "fichier effacé");
    });
  });

  describe("intégration aux éditeurs", () => {
    const save = (client, url, fields) => { const fd = new FormData(); Object.entries({ excerpt: "Résumé.", content_format: "html", status: "draft", content: "<p>Texte</p>", ...fields }).forEach(([k, v]) => fd.append(k, v)); return client.request(url, { method: "POST", multipart: fd, headers: { "x-blog-editor": "1" } }); };
    test("image mise en avant choisie dans la médiathèque du site : enregistrée, rattachée par identifiant, retrouvée au rechargement", async () => {
      const r = await save(adminA, `/formateur/blog/nouveau?site=${A}`, { title: "Article A", cover_media: imgA.path });
      assert.equal(r.status < 300, true, r.text); const out = body(r);
      const row = one("SELECT cover_path, featured_media_id FROM posts WHERE id = ?", out.id);
      assert.equal(row.cover_path, imgA.path); assert.equal(row.featured_media_id, imgA.id);
      assert.ok((await adminA.get(`/formateur/blog/${out.id}/modifier`)).text.includes(imgA.path), "association retrouvée à la réouverture");
    });
    test("image d'un AUTRE site, ou fichier du site principal : refusée comme image mise en avant (article du site A)", async () => {
      for (const p of [imgB.path, `/uploads/marketing/${orgId}/site-${B}/inexistant.png`]) {
        const out = body(await save(adminA, `/formateur/blog/nouveau?site=${A}`, { title: "Tentative", cover_media: p }));
        assert.equal(one("SELECT cover_path FROM posts WHERE id = ?", out.id).cover_path, null, p);
      }
      const common2 = one("SELECT path FROM mk_media WHERE id = ?", common).path;
      const out = body(await save(adminA, `/formateur/blog/nouveau?site=${A}`, { title: "Tentative commun", cover_media: common2 }));
      assert.equal(one("SELECT cover_path FROM posts WHERE id = ?", out.id).cover_path, null, "un fichier commun n'est pas dans la médiathèque du site");
      const mod = body(await save(adminA, `/formateur/blog/${out.id}/modifier`, { title: "Tentative commun", cover_media: imgB.path, base_updated_at: "" }));
      assert.equal(one("SELECT cover_path FROM posts WHERE id = ?", out.id).cover_path, null, "même refus en modification");
    });
    test("article du site principal : accepte les fichiers du principal, refuse ceux d'un site", async () => {
      const common2 = one("SELECT path FROM mk_media WHERE id = ?", common).path;
      const ok = body(await save(boss, "/formateur/blog/nouveau", { title: "Principal OK", cover_media: common2 }));
      assert.equal(one("SELECT cover_path FROM posts WHERE id = ?", ok.id).cover_path, common2);
      const no = body(await save(boss, "/formateur/blog/nouveau", { title: "Principal refus", cover_media: imgA.path }));
      assert.equal(one("SELECT cover_path FROM posts WHERE id = ?", no.id).cover_path, null);
    });
    test("sélecteur partagé : la liste servie à l'éditeur du site A ne contient que les médias de A, filtrés par type", async () => {
      const r = await listNames(adminA, `site=${A}&type=image&limite=100`);
      assert.ok(r.names.includes("carre-bleu.png") && !r.names.includes("secret-beta.png") && !r.names.includes("historique-commun.png"), r.names.join());
      assert.ok(!r.names.includes("rapport-mars.pdf"), "filtre de type respecté");
    });
  });
});
