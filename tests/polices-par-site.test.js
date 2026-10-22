// KOLAKISA CMS — Apparence → Polices : bibliothèque, téléversement et installation (Google Fonts auto-hébergées) PAR SITE, sur les vraies routes, la vraie base,
// de vrais comptes. Lecture réelle des fichiers (WOFF2 / WOFF / TTF), refus des faux formats, stockage réel, isolation entre deux sites (+ le site principal),
// protection des polices utilisées, intégration aux réglages typographiques du site et au rendu public.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const zlib = require("node:zlib");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor, newStudent } = require("./helpers");
const fontFile = require("../src/utils/fontFile");

// ---------- Fabrication de vraies polices minimales (structure sfnt valide : head, cmap, glyf, name, OS/2) ----------
const u16 = (n) => { const b = Buffer.alloc(2); b.writeUInt16BE(n); return b; };
const u32 = (n) => { const b = Buffer.alloc(4); b.writeUInt32BE(n >>> 0); return b; };
function nameTable(family, sub) {
  const items = [[1, family], [2, sub], [4, `${family} ${sub}`]].map(([id, s]) => [id, Buffer.from(s, "utf16le").swap16()]);
  const head = [u16(0), u16(items.length), u16(6 + 12 * items.length)];
  let off = 0; const recs = [], strs = [];
  for (const [id, b] of items) { recs.push(Buffer.concat([u16(3), u16(1), u16(0x409), u16(id), u16(b.length), u16(off)])); strs.push(b); off += b.length; }
  return Buffer.concat([...head, ...recs, ...strs]);
}
function sfnt({ family, sub = "Regular", weight = 400, italic = false, flavor = "ttf" }) {
  const os2 = Buffer.alloc(96); os2.writeUInt16BE(4, 0); os2.writeUInt16BE(weight, 4); os2.writeUInt16BE(italic ? 1 : 0, 62);
  const head = Buffer.alloc(54); head.writeUInt32BE(0x00010000, 0); head.writeUInt16BE(italic ? 2 : 0, 44);
  const tables = { OS_2: os2, cmap: Buffer.alloc(8), glyf: flavor === "ttf" ? Buffer.alloc(16, 1) : null, "CFF ": flavor === "otf" ? Buffer.alloc(16, 2) : null, head, name: nameTable(family, sub) };
  const list = Object.entries(tables).filter(([, v]) => v).map(([k, v]) => [k === "OS_2" ? "OS/2" : k, v]).sort((a, b) => (a[0] < b[0] ? -1 : 1));
  let offset = 12 + 16 * list.length; const dir = [], data = [];
  for (const [tag, buf] of list) { dir.push(Buffer.concat([Buffer.from(tag, "latin1"), u32(0), u32(offset), u32(buf.length)])); const pad = (4 - (buf.length % 4)) % 4; data.push(buf, Buffer.alloc(pad)); offset += buf.length + pad; }
  return { list, file: Buffer.concat([flavor === "otf" ? Buffer.from("OTTO", "latin1") : u32(0x00010000), u16(list.length), u16(0), u16(0), u16(0), ...dir, ...data]) };
}
const ttf = (o) => sfnt(o).file;
function woff(o) {
  const { list } = sfnt(o);
  const comp = list.map(([tag, buf]) => { const z = zlib.deflateSync(buf); return [tag, z.length < buf.length ? z : buf, buf.length]; });
  let offset = 44 + 20 * comp.length; const dir = [], data = [];
  for (const [tag, b, orig] of comp) { dir.push(Buffer.concat([Buffer.from(tag, "latin1"), u32(offset), u32(b.length), u32(orig), u32(0)])); const pad = (4 - (b.length % 4)) % 4; data.push(b, Buffer.alloc(pad)); offset += b.length + pad; }
  const total = list.reduce((n, [, b]) => n + b.length, 0);
  return Buffer.concat([Buffer.from("wOFF", "latin1"), u32(0x00010000), u32(offset), u16(comp.length), u16(0), u32(total), u16(1), u16(0), u32(0), u32(0), u32(0), u32(0), u32(0), ...dir, ...data]);
}
const REAL_WOFF2 = fs.readFileSync(path.join(__dirname, "..", "public", "fonts", "library", "abeezee", "latin-400-normal.woff2"));

describe("polices : lecture et contrôle des fichiers (octets réels)", () => {
  test("TTF, OTF et WOFF fabriqués : famille, graisse et style lus dans les tables", () => {
    assert.deepEqual(fontFile.inspect(ttf({ family: "Atelier", sub: "Bold", weight: 700 })), { format: "ttf", family: "Atelier", subfamily: "Bold", weight: 700, weightMax: null, style: "normal", variable: false });
    assert.equal(fontFile.inspect(ttf({ family: "Atelier", sub: "Italic", weight: 400, italic: true })).style, "italic");
    assert.equal(fontFile.inspect(ttf({ family: "Atelier", flavor: "otf" })).format, "otf");
    const w = fontFile.inspect(woff({ family: "Atelier", sub: "Light", weight: 300 }));
    assert.equal(w.format, "woff"); assert.equal(w.family, "Atelier"); assert.equal(w.weight, 300);
  });
  test("WOFF2 réel (décompression Brotli) : famille ABeeZee lue", () => {
    const i = fontFile.inspect(REAL_WOFF2);
    assert.equal(i.format, "woff2"); assert.equal(i.family, "ABeeZee"); assert.equal(i.weight, 400); assert.equal(i.style, "normal");
  });
  test("faux formats refusés : extension trompeuse, texte, image, fichier tronqué, collection, structure incohérente", () => {
    const png = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(200)]);
    for (const [label, buf, re] of [["png", png, /pas une police/], ["texte", Buffer.from("Ceci n'est pas une police, juste du texte assez long."), /pas une police/], ["html", Buffer.from("<html><script>alert(1)</script></html>"), /pas une police/],
      ["collection", Buffer.concat([Buffer.from("ttcf"), Buffer.alloc(64)]), /collections/], ["vide", Buffer.alloc(0), /vide/], ["trop court", Buffer.from("wOF2"), /trop court/]]) {
      assert.throws(() => fontFile.inspect(buf), (e) => e instanceof fontFile.FontError && re.test(e.message), label);
    }
    const good = ttf({ family: "Atelier" });
    assert.throws(() => fontFile.inspect(good.subarray(0, 60)), fontFile.FontError, "tronqué");
    const broken = Buffer.from(good); broken.writeUInt32BE(0x7fffffff, 12 + 8); // offset de table hors du fichier
    assert.throws(() => fontFile.inspect(broken), /hors du fichier/);
    const noGlyph = ttf({ family: "Atelier" }); const bad = Buffer.from(noGlyph.toString("latin1").replace("glyf", "zzzz"), "latin1");
    assert.throws(() => fontFile.inspect(bad), /tables obligatoires/);
    assert.throws(() => fontFile.inspect(Buffer.concat([Buffer.from("wOF2"), Buffer.alloc(8, 1), Buffer.alloc(40, 0xff)])), fontFile.FontError, "WOFF2 corrompu");
  });
  test("taille maximale : un fichier trop gros est refusé avant toute lecture", () => {
    assert.throws(() => fontFile.inspect(Buffer.alloc(fontFile.MAX_FILE + 1)), /trop volumineux/);
  });
});

describe("apparence-polices : bibliothèque, téléversement, installation, isolation par site", () => {
  let srv, boss, db, orgId, A, B, adminA, editorA, viewerA, limitedB, fontsDir;
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const all = (sql, ...a) => db.prepare(sql).all(...a);
  const idOf = (c) => one("SELECT id FROM users WHERE email = ?", c.email).id;
  const PF = "/marketing/site-web/polices", SP = "/marketing/site-web/sites";
  const flashOf = (html) => (html.match(/class="mk-flash[^"]*"[^>]*>[\s\S]*?<\/div>/) || [""])[0].replace(/<svg[\s\S]*?<\/svg>/g, "").replace(/<[^>]+>/g, " ").replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, " ").trim();
  const person = async (siteId, role) => { const c = await newStudent(srv); db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, ?)").run(siteId, idOf(c), role); return c; };
  const names = (html) => [...html.matchAll(/class="pf-name"[^>]*>([^<]+)</g)].map((m) => m[1].trim());
  const catNames = (html) => [...html.matchAll(/class="pf-cat-name"[^>]*>([^<]+)</g)].map((m) => m[1].trim());
  const rows = (site) => all("SELECT * FROM cms_fonts WHERE COALESCE(site_id, 0) = COALESCE(?, 0) ORDER BY id", site);
  const installG = (c, site, family, variantes) => c.post(`${PF}/installer`, [["famille", family], ...(variantes || []).map((v) => ["variantes", v]), ...(site ? [["site", String(site)]] : [])]);
  function formOf(c, files, extra = {}) {
    const fd = new FormData();
    for (const [k, v] of Object.entries(extra)) fd.append(k, v);
    for (const [name, buf] of files) fd.append("polices", new Blob([buf]), name);
    return fd;
  }
  const upload = (c, site, files, extra = {}, json = true) => c.request(`${PF}/televerser${site ? `?site=${site}` : ""}`, { method: "POST", multipart: formOf(c, files, { ...(site ? { site: String(site) } : {}), ...extra }), headers: json ? { Accept: "application/json" } : {} });
  const jsonOf = (r) => JSON.parse(r.text);

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "", ALLOW_INDEXING: "1" });
    boss = await loginInstructor(srv); db = srv.db();
    fontsDir = path.join(srv.dir, "uploads", "fonts");
    orgId = one("SELECT id FROM mk_organizations").id;
    const site = (n) => Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, ?, ?, '{}')").run(orgId, n, n.toLowerCase()).lastInsertRowid);
    A = site("Alpha"); B = site("Beta");
    adminA = await person(A, "admin"); editorA = await person(A, "editor"); viewerA = await person(A, "viewer"); limitedB = await person(B, "admin");
  });
  after(() => { db.close(); return srv.stop(); });

  describe("interface et menu", () => {
    test("bibliothèque vide : titre, trois onglets, état vide avec actions, aucune police factice", async () => {
      const r = await boss.get(`${PF}?site=${A}`);
      assert.equal(r.status, 200);
      for (const f of ["<h1>Polices", "Bibliothèque", "Téléversement", "Installer des polices", "Aucune police installée sur « Alpha »", "pf-empty-actions"]) assert.ok(r.text.includes(f), f);
      assert.deepEqual(names(r.text), []);
      assert.match(r.text, /cms-polices\.css/); assert.match(r.text, /cms-polices\.js/);
    });
    test("menu : « Polices » est dans Apparence, ouvert dans le cadre du site, et mène à l'écran du site", async () => {
      const r = await boss.get(`${SP}/${A}/polices`);
      assert.equal(r.status, 200); assert.match(r.text, /Site : <strong>Alpha<\/strong>/);
      assert.match(r.text, new RegExp(`href="${SP}/${A}/polices"[^>]*aria-current="page"|aria-current="page"[^>]*href="${SP}/${A}/polices"`));
    });
    test("l'onglet Téléversement montre la zone de dépôt, les formats et les limites", async () => {
      const r = await boss.get(`${PF}/televerser?site=${A}`);
      for (const f of ["Glissez vos fichiers de police ici", "Sélectionner des fichiers", "WOFF2, WOFF, TTF, OTF", "data-pf-drop", 'name="polices"', "multiple"]) assert.ok(r.text.includes(f), f);
    });
  });

  describe("Installer des polices (catalogue Google Fonts hébergé)", () => {
    test("catalogue réel : nombre de familles, lignes dans leur propre police, pagination", async () => {
      const r = await boss.get(`${PF}/installer?site=${A}`);
      const total = Number((r.text.match(/<strong>([\d\s  ]+)<\/strong> famille/) || [])[1].replace(/\D/g, ""));
      assert.ok(total > 1000, `catalogue de ${total} familles`);
      assert.equal(catNames(r.text).length, 20);
      assert.match(r.text, /Page <strong>1<\/strong> sur \d+/); assert.match(r.text, /\/polices\.css\?f=font\./);
      const p2 = await boss.get(`${PF}/installer?site=${A}&page=2`);
      assert.notDeepEqual(catNames(p2.text), catNames(r.text)); assert.equal(catNames(p2.text).length, 20);
    });
    test("recherche exacte, partielle, sans accent, catégorie, combinaison, aucun résultat", async () => {
      const inter = catNames((await boss.get(`${PF}/installer?site=${A}&q=inter`)).text);
      assert.ok(inter.includes("Inter")); assert.ok(inter.every((n) => /inter/i.test(n)), inter.join());
      assert.deepEqual(catNames((await boss.get(`${PF}/installer?site=${A}&q=Inter+Tight`)).text).slice(0, 1), ["Inter Tight"]);
      const mono = catNames((await boss.get(`${PF}/installer?site=${A}&categorie=monospace`)).text);
      assert.ok(mono.length > 5 && !mono.includes("Inter"));
      const both = catNames((await boss.get(`${PF}/installer?site=${A}&categorie=monospace&q=roboto`)).text);
      assert.ok(both.length >= 1 && both.every((n) => /roboto/i.test(n)), both.join());
      assert.match((await boss.get(`${PF}/installer?site=${A}&q=zzzzqqq`)).text, /Aucune famille ne correspond à « zzzzqqq »/);
    });
    test("fiche d'une famille : variantes réelles, aperçu, licence ; famille inexistante : 404", async () => {
      const r = await boss.get(`${PF}/installer/font.lora?site=${A}`);
      assert.equal(r.status, 200);
      for (const f of ["Lora", "Variantes", 'name="variantes"', "Licence", "Installer sur « Alpha »"]) assert.ok(r.text.includes(f), f);
      assert.equal((await boss.get(`${PF}/installer/font.nexiste-pas?site=${A}`)).status, 404);
      assert.equal((await boss.get(`${PF}/installer/%3Cscript%3E?site=${A}`)).status, 404);
    });
    test("installer : ligne réelle en base, visible dans la bibliothèque de CE site, métadonnées, persistance après rechargement", async () => {
      const r = await installG(boss, A, "font.lora", ["400-normal", "700-normal", "400-italic"]);
      assert.equal(r.status, 302);
      const row = rows(A).find((x) => x.font_key === "font.lora");
      assert.ok(row); assert.equal(row.source, "google"); assert.equal(row.family, "Lora"); assert.equal(row.status, "active");
      assert.deepEqual(JSON.parse(row.variants), [{ weight: 400, style: "italic" }, { weight: 400, style: "normal" }, { weight: 700, style: "normal" }]);
      const lib = await boss.get(`${PF}?site=${A}`);
      assert.deepEqual(names(lib.text), ["Lora"]); assert.match(flashOf(lib.text), /Lora.*installée/);
      assert.match(lib.text, /3 variantes/); assert.match(lib.text, />Google Fonts</);
      assert.deepEqual(names((await boss.get(`${PF}?site=${A}`)).text), ["Lora"], "persiste au rechargement");
      assert.match((await boss.get(`${PF}/installer?site=${A}&q=lora`)).text, /Installée/);
    });
    test("réinstaller la même famille : aucun doublon ; de nouvelles variantes sont fusionnées", async () => {
      const r = await installG(boss, A, "font.lora", ["400-normal", "700-normal"]);
      assert.equal(r.status, 302);
      assert.equal(rows(A).filter((x) => x.font_key === "font.lora").length, 1);
      assert.match(flashOf((await boss.get(r.location)).text), /déjà installée/);
      await installG(boss, A, "font.lora", ["500-normal"]);
      assert.equal(JSON.parse(rows(A).find((x) => x.font_key === "font.lora").variants).length, 4);
    });
    test("variante inexistante, famille inconnue, valeur forgée : refusés, rien n'est écrit", async () => {
      const before = rows(A).length;
      assert.match(flashOf((await boss.get((await installG(boss, A, "font.lora", ["123-normal"])).location)).text), /n'existe pas/);
      assert.match(flashOf((await boss.get((await installG(boss, A, "font.nexiste-pas", ["400-normal"])).location)).text), /n'existe pas dans le catalogue/);
      assert.match(flashOf((await boss.get((await installG(boss, A, "font.lora", ["abc"])).location)).text), /invalides/);
      assert.equal(rows(A).length, before);
    });
    test("sans variante choisie : le régulier et le gras par défaut", async () => {
      await installG(boss, A, "font.merriweather");
      const v = JSON.parse(rows(A).find((x) => x.font_key === "font.merriweather").variants);
      assert.ok(v.some((x) => x.weight === 400 && x.style === "normal"));
    });
  });

  describe("Téléversement", () => {
    test("fichiers valides : famille regroupée, 2 variantes enregistrées ET stockées, compte rendu par fichier", async () => {
      const r = await upload(boss, A, [["Atelier-Regular.ttf", ttf({ family: "Atelier", weight: 400 })], ["Atelier-Bold.ttf", ttf({ family: "Atelier", sub: "Bold", weight: 700 })]], { categorie: "serif" });
      assert.equal(r.status, 200);
      const j = jsonOf(r);
      assert.equal(j.imported, 2); assert.equal(j.failed, 0); assert.ok(j.results.every((x) => x.ok && x.family === "Atelier"));
      const fam = rows(A).filter((x) => x.source === "upload");
      assert.equal(fam.length, 1); assert.equal(fam[0].family, "Atelier"); assert.equal(fam[0].category, "serif"); assert.equal(fam[0].font_key, `font.u${fam[0].id}`);
      const files = all("SELECT * FROM cms_font_files WHERE font_id = ? ORDER BY weight", fam[0].id);
      assert.deepEqual(files.map((f) => [f.weight, f.style, f.format]), [[400, "normal", "ttf"], [700, "normal", "ttf"]]);
      for (const f of files) { const p = path.join(fontsDir, `${f.secret}.ttf`); assert.ok(fs.existsSync(p), "fichier réellement stocké"); assert.equal(fs.statSync(p).size, f.size); assert.match(f.secret, /^[a-f0-9]{48}$/); }
    });
    test("un téléversement réussi est visible dans la bibliothèque, servi publiquement avec le bon type, et prévisualisable", async () => {
      const fam = rows(A).find((x) => x.source === "upload");
      const lib = await boss.get(`${PF}?site=${A}`);
      assert.ok(names(lib.text).includes("Atelier")); assert.match(lib.text, /Téléversée/); assert.match(lib.text, /mes-polices\.css/);
      const css = (await boss.get(`${PF}/mes-polices.css?site=${A}`)).text;
      const url = (css.match(/url\((\/polices\/site\/[a-f0-9]{48}\.ttf)\)/) || [])[1];
      assert.ok(url, css); assert.match(css, new RegExp(`font-family:'Atelier \\(u${fam.id}\\)'`));
      const file = await boss.get(url);
      assert.equal(file.status, 200); assert.equal(file.headers.get("content-type"), "font/ttf"); assert.equal(file.headers.get("x-content-type-options"), "nosniff");
      assert.match(file.headers.get("cache-control"), /immutable/);
      const anon = await fetch(`${srv.base}${url}`);
      assert.equal(anon.status, 200, "un site public doit pouvoir charger sa propre police");
      assert.equal((await boss.get(`${PF}/${fam.id}?site=${A}`)).status, 200);
    });
    test("doublon et variante déjà présente : refusés avec une raison ; extension trompeuse, texte, tronqué : refusés", async () => {
      const dup = jsonOf(await upload(boss, A, [["Copie.ttf", ttf({ family: "Atelier", weight: 400 })]]));
      assert.equal(dup.imported, 0); assert.match(dup.results[0].error, /déjà importé/);
      const other = jsonOf(await upload(boss, A, [["Autre400.ttf", ttf({ family: "Atelier", sub: "Regular", weight: 400, flavor: "otf" })]]));
      assert.match(other.results[0].error, /déjà une variante 400/);
      const bad = jsonOf(await upload(boss, A, [["faux.woff2", Buffer.from("PNG pas une police du tout, juste du texte.")], ["page.ttf", Buffer.from("<html>hello</html>")], ["coupee.ttf", ttf({ family: "Zeta" }).subarray(0, 80)]]));
      assert.equal(bad.imported, 0); assert.equal(bad.failed, 3); assert.ok(bad.results.every((x) => !x.ok && x.error));
      assert.equal(rows(A).filter((x) => x.source === "upload").length, 1, "aucune famille fantôme");
    });
    test("lot mixte : les fichiers valides sont importés, les refusés listés (succès partiel) ; fichiers WOFF, WOFF2 réel et OTF acceptés", async () => {
      const j = jsonOf(await upload(boss, A, [["Zeta-Light.woff", woff({ family: "Zeta", sub: "Light", weight: 300 })], ["Rien.txt", Buffer.from("rien du tout qui ressemble à une police")], ["ABeeZee.woff2", REAL_WOFF2], ["Eta.otf", ttf({ family: "Eta", flavor: "otf" })]]));
      assert.equal(j.imported, 3); assert.equal(j.failed, 1);
      assert.deepEqual(j.results.map((x) => x.ok), [true, false, true, true]);
      assert.deepEqual(all("SELECT family, source FROM cms_fonts WHERE COALESCE(site_id,0)=? AND source='upload' ORDER BY family", A).map((x) => x.family), ["ABeeZee", "Atelier", "Eta", "Zeta"]);
      assert.equal(fs.readdirSync(fontsDir).length, all("SELECT id FROM cms_font_files").length, "autant de fichiers sur disque que de lignes en base");
    });
    test("fichier trop volumineux : refusé sans écrire ; trop de fichiers : refusé", async () => {
      const big = Buffer.concat([ttf({ family: "Gros" }), Buffer.alloc(5.2 * 1024 * 1024)]);
      const r = await upload(boss, A, [["gros.ttf", big]]);
      assert.ok([400, 422, 200].includes(r.status)); const j = jsonOf(r);
      assert.equal(j.ok, false); assert.match(j.error || j.results[0].error, /volumineux|taille maximale/);
      assert.equal(rows(A).some((x) => x.family === "Gros"), false);
      const many = Array.from({ length: 14 }, (_, i) => [`f${i}.ttf`, ttf({ family: `M${i}` })]);
      const rr = await upload(boss, A, many);
      assert.equal(rr.status, 400); assert.match(jsonOf(rr).error, /au plus par envoi/);
      assert.equal(rows(A).some((x) => /^M\d+$/.test(x.family)), false);
    });
    test("sans JavaScript : le formulaire affiche le compte rendu fichier par fichier", async () => {
      const r = await upload(boss, A, [["Theta.ttf", ttf({ family: "Theta" })], ["mauvais.ttf", Buffer.from("n'importe quoi de faux et de long")]], {}, false);
      assert.equal(r.status, 200);
      assert.match(r.text, /Compte rendu de l'importation/); assert.match(r.text, /Theta\.ttf/); assert.match(r.text, /pf-result--err/);
    });
    test("nom de famille imposé et catégorie de repli ; catégorie invalide → valeur par défaut", async () => {
      await upload(boss, A, [["x.ttf", ttf({ family: "Original" })]], { famille: "Mon Titre", categorie: "n-importe-quoi" });
      const r = rows(A).find((x) => x.family === "Mon Titre");
      assert.ok(r); assert.equal(r.category, "sans-serif");
    });
  });

  describe("permissions côté serveur", () => {
    test("lecteur : voit, mais ni installer, ni téléverser, ni supprimer ; rien ne change", async () => {
      const before = rows(A).length, files = fs.readdirSync(fontsDir).length;
      assert.equal((await viewerA.get(`${PF}?site=${A}`)).status, 200);
      assert.doesNotMatch((await viewerA.get(`${PF}?site=${A}`)).text, /\/supprimer"/);
      assert.equal((await installG(viewerA, A, "font.inter", ["400-normal"])).status, 403);
      assert.equal((await upload(viewerA, A, [["v.ttf", ttf({ family: "Vue" })]])).status, 403);
      const target = rows(A).find((x) => x.source === "upload");
      assert.equal((await viewerA.post(`${PF}/${target.id}/supprimer`, { site: String(A) })).status, 403);
      assert.equal(rows(A).length, before); assert.equal(fs.readdirSync(fontsDir).length, files);
    });
    test("éditeur : peut téléverser et installer, mais ni désactiver ni supprimer (réservé aux administrateurs)", async () => {
      assert.equal(jsonOf(await upload(editorA, A, [["e.ttf", ttf({ family: "Editeur" })]])).imported, 1);
      assert.equal((await installG(editorA, A, "font.inter", ["400-normal"])).status, 302);
      const t = rows(A).find((x) => x.family === "Editeur");
      assert.equal((await editorA.post(`${PF}/${t.id}/supprimer`, { site: String(A) })).status, 403);
      assert.equal((await editorA.post(`${PF}/${t.id}/desactiver`, { site: String(A) })).status, 403);
      assert.ok(rows(A).some((x) => x.family === "Editeur"));
    });
    test("personne de non connecté : redirigé vers la connexion", async () => {
      const r = await fetch(`${srv.base}${PF}?site=${A}`, { redirect: "manual" });
      assert.equal(r.status, 302); assert.match(r.headers.get("location"), /connexion/);
      const p = await fetch(`${srv.base}${PF}/televerser`, { method: "POST", redirect: "manual" });
      assert.ok([302, 401, 403].includes(p.status));
    });
  });

  describe("isolation entre les sites", () => {
    test("les polices du site A (Google et téléversées) sont absentes du site B et du site principal", async () => {
      const a = names((await boss.get(`${PF}?site=${A}&vue=liste`)).text);
      assert.ok(a.includes("Lora") && a.includes("Atelier"));
      assert.deepEqual(rows(B), []); assert.deepEqual(names((await boss.get(`${SP}/${B}/polices`)).text), []);
      assert.deepEqual(names((await boss.get(PF)).text), [], "site principal");
      assert.match((await boss.get(`${PF}/installer?site=${B}&q=lora`)).text, /pf-cat-name/);
      assert.doesNotMatch((await boss.get(`${PF}/installer?site=${B}&q=lora`)).text, /pf-badge--ok/, "Lora n'est pas « installée » sur B");
      assert.equal((await boss.get(`${PF}/mes-polices.json?site=${B}`).then((r) => jsonOf(r).families.length)), 0);
      assert.ok((await boss.get(`${PF}/mes-polices.json?site=${A}`).then((r) => jsonOf(r).families.length)) >= 2);
    });
    test("accès direct par identifiant : la police de A est introuvable via B et le principal (lecture ET écriture), les fichiers restent intacts", async () => {
      const fam = rows(A).find((x) => x.family === "Atelier");
      const files = fs.readdirSync(fontsDir).length;
      for (const q of [`site=${B}`, ""]) {
        assert.equal((await boss.get(`${PF}/${fam.id}?${q}`)).status, 404, `lecture ${q || "principal"}`);
        for (const act of ["supprimer", "desactiver", "activer", "categorie"]) assert.equal((await boss.post(`${PF}/${fam.id}/${act}`, { ...(q ? { site: String(B) } : {}), categorie: "serif" })).status, q ? 302 : 302, act);
      }
      assert.ok(rows(A).some((x) => x.id === fam.id && x.status === "active")); assert.equal(fs.readdirSync(fontsDir).length, files);
      const f = one("SELECT id FROM cms_font_files WHERE font_id = ?", fam.id);
      await boss.post(`${PF}/${fam.id}/variantes/${f.id}/supprimer`, { site: String(B) });
      assert.ok(one("SELECT id FROM cms_font_files WHERE id = ?", f.id), "la variante de A n'est pas supprimable depuis B");
    });
    test("accès limité au site B : refusé sur A (403), même en forgeant ?site= ou le champ « site »", async () => {
      assert.equal((await limitedB.get(`${PF}?site=${A}`)).status, 403);
      assert.equal((await limitedB.get(`${PF}/installer?site=${A}`)).status, 403);
      assert.equal((await limitedB.get(`${PF}/mes-polices.json?site=${A}`)).status, 403);
      assert.equal((await installG(limitedB, A, "font.inter", ["400-normal"])).status, 403);
      assert.equal((await upload(limitedB, A, [["b.ttf", ttf({ family: "Pirate" })]])).status, 403);
      const fam = rows(A).find((x) => x.family === "Atelier");
      assert.equal((await limitedB.post(`${PF}/${fam.id}/supprimer`, { site: String(A) })).status, 403);
      assert.equal(rows(A).some((x) => x.family === "Pirate"), false);
      assert.equal((await limitedB.get(`${PF}?site=${B}`)).status, 200, "son propre site : accès normal");
      assert.equal(jsonOf(await upload(limitedB, B, [["b.ttf", ttf({ family: "Boreal" })]])).imported, 1);
      assert.deepEqual(rows(B).map((x) => x.family), ["Boreal"]);
      assert.ok(!names((await boss.get(`${PF}?site=${A}`)).text).includes("Boreal"), "la police de B n'apparaît pas sur A");
    });
    test("un fichier de police de B n'est pas lisible par une adresse devinée ou construite avec un autre secret", async () => {
      assert.equal((await boss.get("/polices/site/" + "0".repeat(48) + ".ttf")).status, 404);
      assert.equal((await boss.get("/polices/site/../../data/KOYEKOLA.db")).status, 404);
      assert.equal((await boss.get("/polices/site/" + "a".repeat(47) + ".ttf")).status, 404);
      const secret = one("SELECT f.secret FROM cms_font_files f JOIN cms_fonts t ON t.id = f.font_id WHERE t.site_id = ?", B).secret;
      assert.equal((await fetch(`${srv.base}/polices/site/${secret}.otf`)).status, 404, "mauvaise extension");
      assert.equal((await fetch(`${srv.base}/polices/site/${secret}.ttf`)).status, 200);
    });
    test("supprimer sur un site ne touche aucune ressource d'un autre : deux sites avec la même famille Google", async () => {
      await installG(boss, B, "font.lora", ["400-normal"]);
      assert.equal(rows(A).filter((x) => x.font_key === "font.lora").length, 1); assert.equal(rows(B).filter((x) => x.font_key === "font.lora").length, 1);
      const b = rows(B).find((x) => x.font_key === "font.lora");
      assert.equal((await boss.post(`${PF}/${b.id}/supprimer`, { site: String(B) })).status, 302);
      assert.equal(rows(B).some((x) => x.font_key === "font.lora"), false); assert.ok(rows(A).some((x) => x.font_key === "font.lora"), "Lora reste installée sur A");
      assert.equal(rows(A).find((x) => x.font_key === "font.lora").variants.includes("700"), true);
    });
  });

  describe("utilisation par le site : intégration aux réglages typographiques et au rendu", () => {
    test("choisir une police téléversée dans les réglages du site A : enregistrée ; celle du site B ou d'un identifiant inventé : refusée", async () => {
      const mine = rows(A).find((x) => x.family === "Atelier"), theirs = rows(B).find((x) => x.family === "Boreal");
      const ok = await boss.post(`${SP}/${A}/design`, { font_heading: mine.font_key, font_body: "font.lora" });
      assert.equal(ok.status, 302);
      assert.match(flashOf((await boss.get(ok.location)).text), /Design system enregistré/);
      const tokens = JSON.parse(one("SELECT tokens FROM mk_sites WHERE id = ?", A).tokens);
      assert.equal(tokens.fonts.heading, mine.font_key); assert.equal(tokens.fonts.body, "font.lora");
      const foreign = await boss.post(`${SP}/${A}/design`, { font_heading: theirs.font_key });
      assert.match(flashOf((await boss.get(foreign.location)).text), /Police inconnue/);
      assert.equal(JSON.parse(one("SELECT tokens FROM mk_sites WHERE id = ?", A).tokens).fonts.heading, mine.font_key, "inchangée");
      const fake = await boss.post(`${SP}/${A}/design`, { font_heading: "font.u999999" });
      assert.match(flashOf((await boss.get(fake.location)).text), /Police inconnue/);
      assert.match(flashOf((await boss.get((await boss.post(`${SP}/${B}/design`, { font_heading: mine.font_key })).location)).text), /Police inconnue/, "le site B ne peut pas utiliser la police de A");
    });
    test("la page publique du site A charge réellement la police : @font-face présent, pile de repli, fichier servi", async () => {
      const mine = rows(A).find((x) => x.family === "Atelier");
      const pageA = Number(db.prepare("INSERT INTO mk_landing_pages (organization_id, name, slug, title, sections, status, kind, site_id, published_at) VALUES (?, 'Accueil A', 'accueil-a', 'Accueil A', ?, 'published', 'page', ?, datetime('now'))")
        .run(orgId, JSON.stringify([{ type: "text", markdown: "Bonjour" }]), A).lastInsertRowid);
      void pageA;
      const html = (await fetch(`${srv.base}/p/accueil-a`).then((r) => r.text()));
      assert.match(html, new RegExp(`@font-face\\{font-family:'Atelier \\(u${mine.id}\\)'`));
      assert.match(html, new RegExp(`--kw-font-heading:(?:'|&#39;)Atelier \\(u${mine.id}\\)(?:'|&#39;), serif`));
      const url = (html.match(/url\((\/polices\/site\/[a-f0-9]{48}\.ttf)\)/) || [])[1];
      assert.ok(url); assert.equal((await fetch(`${srv.base}${url}`)).status, 200);
    });
    test("la page d'un AUTRE site ne reçoit jamais les @font-face de A", async () => {
      db.prepare("INSERT INTO mk_landing_pages (organization_id, name, slug, title, sections, status, kind, site_id, published_at) VALUES (?, 'Accueil B', 'accueil-b', 'Accueil B', ?, 'published', 'page', ?, datetime('now'))")
        .run(orgId, JSON.stringify([{ type: "text", markdown: "Salut" }]), B);
      const html = await fetch(`${srv.base}/p/accueil-b`).then((r) => r.text());
      assert.doesNotMatch(html, /Atelier/); assert.doesNotMatch(html, /\/polices\/site\//);
    });
    test("police utilisée : fiche « Utilisée par le site », désactivation et suppression REFUSÉES avec la raison, fichiers intacts", async () => {
      const mine = rows(A).find((x) => x.family === "Atelier"), files = fs.readdirSync(fontsDir).length;
      const fiche = (await boss.get(`${PF}/${mine.id}?site=${A}`)).text;
      assert.match(fiche, /Utilisée par le site/); assert.match(fiche, /Réglages typographiques du site/);
      for (const act of ["supprimer", "desactiver"]) {
        const r = await boss.post(`${PF}/${mine.id}/${act}`, { site: String(A) });
        assert.match(flashOf((await boss.get(r.location)).text), /est utilisée par ce site/, act);
      }
      assert.equal(rows(A).find((x) => x.id === mine.id).status, "active"); assert.equal(fs.readdirSync(fontsDir).length, files);
      const lib = (await boss.get(`${PF}?site=${A}&utilisee=1`)).text;
      assert.deepEqual(names(lib).sort(), ["Atelier", "Lora"]);
    });
    test("une police Google utilisée (Lora, texte courant) est aussi protégée ; libérée, elle se supprime et le contenu reste intact", async () => {
      const lora = rows(A).find((x) => x.font_key === "font.lora");
      const r = await boss.post(`${PF}/${lora.id}/supprimer`, { site: String(A) });
      assert.match(flashOf((await boss.get(r.location)).text), /utilisée par ce site/);
      await boss.post(`${SP}/${A}/design`, { font_heading: "font.u" + rows(A).find((x) => x.family === "Atelier").id, font_body: "figtree" });
      const free = await boss.post(`${PF}/${lora.id}/supprimer`, { site: String(A) });
      assert.match(flashOf((await boss.get(free.location)).text), /supprimée/);
      assert.equal(rows(A).some((x) => x.font_key === "font.lora"), false);
      assert.equal(JSON.parse(one("SELECT tokens FROM mk_sites WHERE id = ?", A).tokens).fonts.heading.startsWith("font.u"), true);
    });
  });

  describe("site principal : Apparence → Styles et rendu public", () => {
    test("une police téléversée du PRINCIPAL se choisit dans les styles, se publie et est chargée par la page d'accueil ; celle d'un site, non", async () => {
      assert.equal(jsonOf(await upload(boss, null, [["Principale.ttf", ttf({ family: "Principale", weight: 400 })]], { categorie: "serif" })).imported, 1);
      const mine = rows(null).find((x) => x.family === "Principale"), other = rows(A).find((x) => x.family === "Atelier");
      assert.ok(mine && !rows(A).some((x) => x.family === "Principale"));
      const bad = await boss.post("/marketing/site-web/apparence/styles", { "fonts.heading": other.font_key });
      assert.match(flashOf((await boss.get(bad.location)).text), /Police inconnue|ne peut pas|invalide/i, "la police du site A est refusée sur le principal");
      const ok = await boss.post("/marketing/site-web/apparence/styles", { "fonts.heading": mine.font_key });
      assert.match(flashOf((await boss.get(ok.location)).text), /Styles enregistrés/);
      const pub = await boss.post("/marketing/site-web/apparence/publier", {});
      assert.match(flashOf((await boss.get(pub.location)).text), /publi/i);
      const home = await fetch(`${srv.base}/`).then((r) => r.text());
      assert.match(home, new RegExp(`@font-face\\{font-family:'Principale \\(u${mine.id}\\)'`));
      assert.doesNotMatch(home, /Atelier \(u/);
      const url = (home.match(/url\((\/polices\/site\/[a-f0-9]{48}\.ttf)\)/) || [])[1];
      assert.ok(url); assert.equal((await fetch(`${srv.base}${url}`)).status, 200);
      const fiche = (await boss.get(`${PF}/${mine.id}`)).text;
      assert.match(fiche, /Utilisée par le site/); assert.match(fiche, /site principal/);
      await boss.post("/marketing/site-web/apparence/styles", { "fonts.heading": "figtree" }); await boss.post("/marketing/site-web/apparence/publier", {});
    });
  });

  describe("désactiver, réactiver, supprimer, catégorie, variantes", () => {
    test("désactiver : plus servie ni proposée dans le sélecteur ; réactiver : de nouveau servie", async () => {
      const t = rows(A).find((x) => x.family === "Editeur");
      const sec = one("SELECT secret FROM cms_font_files WHERE font_id = ?", t.id).secret;
      assert.equal((await fetch(`${srv.base}/polices/site/${sec}.ttf`)).status, 200);
      assert.equal((await boss.post(`${PF}/${t.id}/desactiver`, { site: String(A) })).status, 302);
      assert.equal(rows(A).find((x) => x.id === t.id).status, "disabled");
      assert.equal((await fetch(`${srv.base}/polices/site/${sec}.ttf`)).status, 404, "désactivée : plus servie");
      assert.ok(!jsonOf(await boss.get(`${PF}/mes-polices.json?site=${A}`)).families.some((f) => f.family === "Editeur"));
      assert.match((await boss.get(`${PF}?site=${A}&statut=disabled`)).text, /Désactivée/); assert.deepEqual(names((await boss.get(`${PF}?site=${A}&statut=disabled`)).text), ["Editeur"]);
      await boss.post(`${PF}/${t.id}/activer`, { site: String(A) });
      assert.equal((await fetch(`${srv.base}/polices/site/${sec}.ttf`)).status, 200);
    });
    test("catégorie de repli modifiable (téléversée seulement), valeur invalide refusée", async () => {
      const t = rows(A).find((x) => x.family === "Editeur");
      await boss.post(`${PF}/${t.id}/categorie`, { site: String(A), categorie: "monospace" });
      assert.equal(rows(A).find((x) => x.id === t.id).category, "monospace");
      const r = await boss.post(`${PF}/${t.id}/categorie`, { site: String(A), categorie: "zzz" });
      assert.match(flashOf((await boss.get(r.location)).text), /Catégorie inconnue/);
      assert.equal(rows(A).find((x) => x.id === t.id).category, "monospace");
    });
    test("supprimer une variante, puis la dernière : la famille disparaît et ses fichiers sont effacés du disque", async () => {
      await upload(boss, A, [["Kappa-400.ttf", ttf({ family: "Kappa" })], ["Kappa-700.ttf", ttf({ family: "Kappa", sub: "Bold", weight: 700 })]]);
      const k = rows(A).find((x) => x.family === "Kappa"), fs0 = all("SELECT id, secret FROM cms_font_files WHERE font_id = ? ORDER BY weight", k.id);
      assert.equal(fs0.length, 2);
      await boss.post(`${PF}/${k.id}/variantes/${fs0[0].id}/supprimer`, { site: String(A) });
      assert.equal(all("SELECT id FROM cms_font_files WHERE font_id = ?", k.id).length, 1); assert.equal(fs.existsSync(path.join(fontsDir, `${fs0[0].secret}.ttf`)), false);
      const last = await boss.post(`${PF}/${k.id}/variantes/${fs0[1].id}/supprimer`, { site: String(A) });
      assert.match(flashOf((await boss.get(last.location)).text), /supprimée/);
      assert.equal(rows(A).some((x) => x.family === "Kappa"), false); assert.equal(fs.existsSync(path.join(fontsDir, `${fs0[1].secret}.ttf`)), false);
    });
    test("supprimer une police téléversée inutilisée efface ses fichiers ; une police Google supprimée reste dans le catalogue", async () => {
      const t = rows(A).find((x) => x.family === "Theta"), secs = all("SELECT secret FROM cms_font_files WHERE font_id = ?", t.id).map((x) => x.secret);
      assert.equal((await boss.post(`${PF}/${t.id}/supprimer`, { site: String(A) })).status, 302);
      assert.equal(rows(A).some((x) => x.family === "Theta"), false);
      for (const s of secs) { assert.equal(fs.existsSync(path.join(fontsDir, `${s}.ttf`)), false); assert.equal((await fetch(`${srv.base}/polices/site/${s}.ttf`)).status, 404); }
      const m = rows(A).find((x) => x.font_key === "font.merriweather");
      await boss.post(`${PF}/${m.id}/supprimer`, { site: String(A) });
      assert.ok(catNames((await boss.get(`${PF}/installer?site=${A}&q=merriweather`)).text).includes("Merriweather"));
    });
  });

  describe("bibliothèque : recherche, filtres combinés, tri, liste et grille, pagination", () => {
    before(async () => {
      for (const f of ["font.roboto", "font.open-sans", "font.playfair-display", "font.fira-code", "font.dancing-script", "font.lato", "font.montserrat", "font.poppins", "font.raleway", "font.oswald", "font.nunito", "font.ubuntu", "font.pt-serif", "font.work-sans", "font.inconsolata", "font.quicksand"]) await installG(boss, B, f, ["400-normal"]);
    });
    test("pagination : 15 par page en liste, 12 en grille, compteurs et liens conservant les filtres", async () => {
      const total = rows(B).length;
      assert.ok(total > 15);
      const p1 = await boss.get(`${PF}?site=${B}`);
      assert.equal(names(p1.text).length, 15); assert.match(p1.text, new RegExp(`Page <strong>1</strong> sur ${Math.ceil(total / 15)}`));
      const p2 = await boss.get(`${PF}?site=${B}&page=2`);
      assert.equal(names(p2.text).length, total - 15); assert.equal(names(p1.text).filter((n) => names(p2.text).includes(n)).length, 0);
      assert.equal(names((await boss.get(`${PF}?site=${B}&vue=grille`)).text).length, 12); assert.match((await boss.get(`${PF}?site=${B}&vue=grille`)).text, /class="pf-grid"/);
      assert.match((await boss.get(`${PF}?site=${B}&vue=grille`)).text, /vue=grille&amp;page=2|page=2&amp;vue=grille/);
    });
    test("recherche partielle sans accent, filtres origine + catégorie + statut combinés, tri, aucun résultat, réinitialisation", async () => {
      assert.deepEqual(names((await boss.get(`${PF}?site=${B}&q=ROBO`)).text), ["Roboto"]);
      const mono = names((await boss.get(`${PF}?site=${B}&categorie=monospace`)).text);
      assert.ok(mono.includes("Fira Code") && mono.includes("Inconsolata") && !mono.includes("Roboto"), mono.join());
      assert.deepEqual(names((await boss.get(`${PF}?site=${B}&categorie=monospace&q=fira&origine=google&statut=active`)).text), ["Fira Code"]);
      assert.deepEqual(names((await boss.get(`${PF}?site=${B}&origine=upload&categorie=monospace`)).text), ["Boreal"].filter(() => false));
      const sorted = names((await boss.get(`${PF}?site=${B}&tri=nom`)).text);
      assert.deepEqual(sorted, [...sorted].sort((a, b) => a.localeCompare(b, "fr", { sensitivity: "base" })));
      assert.equal(names((await boss.get(`${PF}?site=${B}&tri=recent`)).text)[0], "Quicksand");
      const none = (await boss.get(`${PF}?site=${B}&q=zzzzzzz`)).text;
      assert.match(none, /Aucune police ne correspond à ces critères/); assert.match(none, /réinitialisez les filtres/);
      assert.match(none, /<a class="pf-reset[^"]*"[^>]*href="[^"]*"(?![^>]*hidden)/);
    });
    test("recherche et filtres instantanés : la page répond au même contenu pour les requêtes AJAX (zone de résultats autonome)", async () => {
      const r = await boss.get(`${PF}?site=${B}&q=lato`, { headers: { Accept: "text/html" } });
      assert.match(r.text, /data-pf-results/); assert.deepEqual(names(r.text), ["Lato"]);
    });
  });

  describe("migration, données et rendu", () => {
    test("tables, index uniques par site et clé étrangère en cascade", async () => {
      assert.ok(one("SELECT name FROM sqlite_master WHERE name = 'uq_cms_fonts_site_key'"));
      assert.ok(one("SELECT name FROM sqlite_master WHERE name = 'uq_cms_font_files_variant'"));
      assert.throws(() => db.prepare("INSERT INTO cms_fonts (site_id, source, font_key, family) VALUES (?, 'google', 'font.inter', 'Inter')").run(null) && db.prepare("INSERT INTO cms_fonts (site_id, source, font_key, family) VALUES (NULL, 'google', 'font.inter', 'Inter')").run(), /UNIQUE/);
    });
    test("journal d'audit : installation, téléversement, suppression tracés sur le bon site", async () => {
      const acts = all("SELECT action, site_id FROM mk_audit_logs WHERE resource_type = 'font'").map((x) => `${x.action}:${x.site_id}`);
      for (const a of [`font.installed:${A}`, `font.uploaded:${A}`, `font.removed:${A}`, `font.uploaded:${B}`]) assert.ok(acts.includes(a), a);
    });
  });
});
