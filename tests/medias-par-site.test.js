// R5 — médias par site et sauvegarde par site, de bout en bout : vrai serveur, vraie base d'essai, vraies routes.
//  1. Médias : téléversement par site, visibilité, écriture, partage explicite (droits et isolation).
//  2. Paquet de site : téléchargement, analyse (rien n'est écrit), restauration dans un autre site avec ses médias, autres sites inchangés, aucun fichier orphelin.
//  3. Refus : paquet corrompu / tronqué / falsifié refusé sans aucune modification ; échec en cours de restauration défait entièrement.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const zlib = require("node:zlib");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor, newStudent } = require("./helpers");

function png(w, h, rgb = [2, 119, 182]) {
  const table = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
  const crc = (buf) => { let c = 0xffffffff; for (const b of buf) c = table[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([len, td, c]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2;
  const raw = Buffer.alloc((w * 3 + 1) * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) raw.set(rgb, y * (w * 3 + 1) + 1 + x * 3);
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
}

describe("médias par site et sauvegarde par site : bout en bout", () => {
  let srv, boss, db, orgId, A, B, C, uploadsDir;
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const all = (sql, ...a) => db.prepare(sql).all(...a);
  const idOf = (c) => one("SELECT id FROM users WHERE email = ?", c.email).id;
  const O = "/marketing/site-web/outils";
  const L = "/marketing/site-web/mediatheque";
  const sha = (b) => crypto.createHash("sha256").update(b).digest("hex");
  const mkSite = (name) => Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, ?, ?, '{}')").run(orgId, name, name.toLowerCase()).lastInsertRowid);
  const upload = (client, buffer, name, site) => {
    const fd = new FormData();
    fd.append("file", new Blob([buffer], { type: "image/png" }), name);
    return client.request(`${L}/televerser${site ? `?site=${site}` : ""}`, { method: "POST", multipart: fd });
  };
  const person = async (siteId, role) => { const c = await newStudent(srv); if (siteId) db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, ?)").run(siteId, idOf(c), role); return c; };
  const sectionsOf = (site) => (site ? all("SELECT draft FROM mk_landing_pages WHERE site_id = ? ORDER BY id", site).map((r) => r.draft) : []);
  async function pageWith(site, name, markdown) {
    const r = await boss.post("/marketing/pages", { name, template: "", site_id: String(site) });
    assert.equal(r.status, 302, r.text.slice(0, 200));
    const id = Number(String(r.location).match(/pages\/(\d+)/)[1]);
    const row = one("SELECT * FROM mk_landing_pages WHERE id = ?", id);
    const cur = row.draft ? JSON.parse(row.draft) : { sections: JSON.parse(row.sections), seo: JSON.parse(row.seo || "{}") };
    const s = await boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", json: { revision: row.revision, content: { title: name, description: "", seo: cur.seo || {}, sections: [{ type: "text", markdown }] } } });
    assert.equal(s.status, 200, s.text.slice(0, 200));
    return id;
  }
  // Empreinte d'un ensemble de sites : leurs pages, leurs médias (fiches ET octets des fichiers). Sert à prouver que les AUTRES sites n'ont pas bougé.
  function fingerprint(sites) {
    const pages = all(`SELECT id, site_id, name, slug, revision, draft, sections, archived_at FROM mk_landing_pages WHERE site_id IN (${sites.map(() => "?").join(",")}) ORDER BY id`, ...sites);
    const medias = all(`SELECT * FROM mk_media WHERE organization_id = ? AND (site_id IN (${sites.map(() => "?").join(",")}) OR reach = 'shared') ORDER BY id`, orgId, ...sites)
      .map((m) => ({ ...m, bytes: fs.existsSync(diskOf(m.path)) ? sha(fs.readFileSync(diskOf(m.path))) : null }));
    const siteRows = all(`SELECT id, name, slug, tokens, settings FROM mk_sites WHERE id IN (${sites.map(() => "?").join(",")}) ORDER BY id`, ...sites);
    const mainPages = all("SELECT id, name, slug, revision, draft FROM mk_landing_pages WHERE site_id IS NULL ORDER BY id");
    return JSON.stringify({ pages, medias, siteRows, mainPages });
  }
  const diskOf = (p) => path.join(uploadsDir, p.replace(/^\/uploads\//, ""));
  // Aucun fichier sans fiche, aucune fiche sans fichier (médiathèque de l'organisation)
  function orphans() {
    const root = path.join(uploadsDir, "marketing", String(orgId));
    const files = [];
    const walk = (d, rel) => { for (const e of fs.existsSync(d) ? fs.readdirSync(d, { withFileTypes: true }) : []) { if (e.isDirectory()) walk(path.join(d, e.name), `${rel}/${e.name}`); else files.push(`${rel}/${e.name}`); } };
    walk(root, `/uploads/marketing/${orgId}`);
    const rows = all("SELECT path FROM mk_media WHERE organization_id = ?", orgId).map((r) => r.path);
    // les versions réduites fabriquées à la demande ne comptent pas
    const real = files.filter((f) => !/\/variants?\//.test(f));
    return { filesWithoutRow: real.filter((f) => !rows.includes(f)), rowsWithoutFile: rows.filter((p) => !fs.existsSync(diskOf(p))) };
  }
  // Téléchargement binaire (le client des tests ne lit que du texte) : même cookies de session
  const download = async (client, site) => {
    const cookie = [...client.cookies].map(([k, v]) => `${k}=${v}`).join("; ");
    const res = await fetch(`${client.base}${O}/sauvegarde-site/telecharger?site=${site}`, { method: "POST", headers: { cookie, "Content-Type": "application/x-www-form-urlencoded" }, body: "", redirect: "manual" });
    return { status: res.status, buffer: Buffer.from(await res.arrayBuffer()), headers: res.headers };
  };

  let imgCommon, imgA, imgB, bundleBuffer;
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db();
    orgId = one("SELECT id FROM mk_organizations").id;
    uploadsDir = path.join(srv.dir, "uploads");
    A = mkSite("Alpha"); B = mkSite("Beta"); C = mkSite("Cible");
  });
  after(() => srv.stop());

  describe("médias par site : visibilité, écriture, partage", () => {
    test("téléversement : commun par défaut (historique), dans le dossier du site avec ?site= ; un accès limité n'a pas le choix", async () => {
      const rc = await upload(boss, png(10, 10, [1, 2, 3]), "commun.png");
      assert.equal(rc.status, 201, rc.text);
      imgCommon = JSON.parse(rc.text).media;
      assert.deepEqual([imgCommon.reach, imgCommon.siteId], ["shared", null]);
      assert.match(imgCommon.path, /^\/uploads\/marketing\/\d+\/\d+-[0-9a-f]{12}\.png$/);
      const ra = await upload(boss, png(11, 11, [9, 9, 9]), "alpha.png", A);
      assert.equal(ra.status, 201, ra.text);
      imgA = JSON.parse(ra.text).media;
      assert.deepEqual([imgA.reach, imgA.siteId], ["site", A]);
      assert.ok(imgA.path.includes(`/site-${A}/`));
      imgB = JSON.parse((await upload(boss, png(12, 12, [7, 7, 7]), "beta.png", B)).text).media;
      assert.equal(imgB.siteId, B);
      for (const m of [imgCommon, imgA, imgB]) assert.ok(fs.existsSync(diskOf(m.path)), m.path);
    });

    test("accès limité au site A : ne voit QUE ceux d'A (ni les communs ni ceux de B) ; ne téléverse que dans A", async () => {
      const guestA = await person(A, "admin");
      const names = async (site) => { const r = await guestA.get(`${L}/liste.json?site=${site}`); return { status: r.status, names: r.status === 200 ? JSON.parse(r.text).items.map((m) => m.name).sort() : null }; };
      assert.deepEqual(await names(A), { status: 200, names: ["alpha.png"] });
      assert.equal((await guestA.get(`${L}/${imgCommon.id}.json`)).status, 403, "un média commun n'est pas dans la médiathèque d'un site");
      assert.equal((await names(B)).status, 403, "le site B lui est fermé");
      assert.equal((await guestA.get(`${L}/${imgB.id}.json`)).status, 403, "lecture d'un média de B par identifiant");
      assert.equal((await upload(guestA, png(13, 13), "x.png", B)).status, 403);
      const mine = await upload(guestA, png(13, 13, [5, 5, 5]), "mien.png", A);
      assert.equal(mine.status, 201, mine.text);
      assert.equal(JSON.parse(mine.text).media.siteId, A);
      // pas d'écriture sur un média commun
      assert.equal((await guestA.post(`${L}/${imgCommon.id}`, { name: "piraté.png" })).status, 403);
      assert.equal(one("SELECT name FROM mk_media WHERE id = ?", imgCommon.id).name, "commun.png");
      // partage réservé à l'équipe
      const mineId = JSON.parse(mine.text).media.id;
      assert.equal((await guestA.post(`${L}/${mineId}/partage?site=${A}`, { reach: "shared" })).status, 403);
      assert.equal(one("SELECT reach FROM mk_media WHERE id = ?", mineId).reach, "site");
    });

    test("page de la médiathèque : filtre de portée et mention « propre à un site » ", async () => {
      const home = (await boss.get(L)).text;
      assert.ok(home.includes("commun.png") && !home.includes("alpha.png"), "sans site : la médiathèque du site principal");
      const all_ = (await boss.get(`${L}?portee=tous`)).text;
      assert.match(all_, /Fichiers propres à un site/); assert.match(all_, /Tous les sites \(vue d'ensemble\)/);
      assert.ok(all_.includes("alpha.png") && all_.includes("commun.png"), "vue d'ensemble explicite de l'équipe");
      assert.match(all_, /propre à un site/);
      const shared = (await boss.get(`${L}?portee=commun`)).text;
      assert.ok(!shared.includes("alpha.png") && shared.includes("commun.png"), "filtre « communs »");
      const owned = (await boss.get(`${L}?portee=site`)).text;
      assert.ok(owned.includes("alpha.png") && !owned.includes("commun.png"), "filtre « propres à un site »");
    });

    test("l'équipe : partage explicite (site → commun → site), refus site → site direct et « commun → site » si un autre site l'utilise", async () => {
      const share = (id, body) => boss.post(`${L}/${id}/partage`, body);
      assert.equal((await share(imgA.id, { reach: "site", site_id: String(B) })).status, 409, "jamais de site à site direct");
      const toShared = await share(imgA.id, { reach: "shared" });
      assert.equal(toShared.status, 200, toShared.text);
      assert.equal(one("SELECT reach, site_id, path FROM mk_media WHERE id = ?", imgA.id).path, imgA.path, "l'adresse ne change pas");
      assert.ok(fs.existsSync(diskOf(imgA.path)));
      const pB = await pageWith(B, "Page B utilise alpha", `![x](${imgA.path})`);
      const refused = await share(imgA.id, { reach: "site", site_id: String(A) });
      assert.equal(refused.status, 409, "utilisé par B : reste commun");
      assert.equal(one("SELECT reach FROM mk_media WHERE id = ?", imgA.id).reach, "shared");
      db.prepare("UPDATE mk_landing_pages SET archived_at = datetime('now') WHERE id = ?").run(pB);
      db.prepare("UPDATE mk_landing_pages SET draft = NULL, sections = '[]' WHERE id = ?").run(pB); // plus aucun usage
      assert.equal((await share(imgA.id, { reach: "site", site_id: String(A) })).status, 200);
      assert.deepEqual([one("SELECT reach, site_id FROM mk_media WHERE id = ?", imgA.id).reach, one("SELECT site_id FROM mk_media WHERE id = ?", imgA.id).site_id], ["site", A]);
    });
  });

  describe("paquet de site : export, restauration, isolation", () => {
    let pageA, snapshotOthers;
    test("téléchargement : paquet reconnaissable avec manifeste, sommes de contrôle et fichiers du site", async () => {
      pageA = await pageWith(A, "Accueil Alpha", `Bonjour ![a](${imgA.path}) et ![c](${imgCommon.path})`);
      const r = await download(boss, A);
      assert.equal(r.status, 200, r.buffer.toString("utf8").slice(0, 200));
      assert.match(r.headers.get("content-disposition"), /attachment; filename="kolakisa-site-alpha-\d{4}-\d{2}-\d{2}\.kksite"/);
      bundleBuffer = r.buffer;
      assert.equal(bundleBuffer.subarray(0, 8).toString("latin1"), "KKSITE1\n");
      const mlen = bundleBuffer.readUInt32BE(8);
      const manifest = JSON.parse(bundleBuffer.subarray(12, 12 + mlen).toString("utf8"));
      assert.equal(manifest.format, "kolakisa-site-bundle@1");
      assert.deepEqual(manifest.files.map((f) => f.name).sort(), ["alpha.png", "commun.png", "mien.png"], "fichiers d'Alpha (dont celui téléversé par son accès limité) + fichier commun référencé, jamais ceux de B");
      for (const f of manifest.files) assert.equal(sha(bundleBuffer.subarray(12 + mlen + f.offset, 12 + mlen + f.offset + f.length)), f.sha256);
    });

    test("restauration dans le site Cible : contenu en brouillon, médias dans l'espace de Cible, références remappées, autres sites INCHANGÉS, aucun orphelin", async () => {
      snapshotOthers = fingerprint([A, B]);
      const mediaBefore = all("SELECT id FROM mk_media ORDER BY id").length;
      const fd = new FormData();
      fd.append("file", new Blob([bundleBuffer], { type: "application/octet-stream" }), "a.kksite");
      const an = await boss.request(`${O}/sauvegarde-site/analyser?site=${C}`, { method: "POST", multipart: fd });
      assert.equal(an.status, 200, an.text.slice(0, 300));
      assert.match(an.text, /Paquet valide/);
      assert.equal(all("SELECT id FROM mk_media ORDER BY id").length, mediaBefore, "l'analyse n'écrit rien");
      assert.equal(fingerprint([A, B]), snapshotOthers);
      const token = String(an.text).match(/name="token" value="([0-9a-f]{32})"/)[1];
      const re = await boss.post(`${O}/sauvegarde-site/restaurer?site=${C}`, { token, confirm: "1", on_conflict: "duplicate" });
      assert.equal(re.status, 302, re.text.slice(0, 300));
      assert.match(String(re.location), /\/importer\/\d+/, "restauration réussie : redirigé vers le rapport de l'opération");
      // contenu
      const restored = all("SELECT id, name, draft, site_id, status FROM mk_landing_pages WHERE site_id = ?", C);
      assert.equal(restored.length, 1);
      assert.match(restored[0].name, /^Accueil Alpha/);
      // médias : un dans l'espace de Cible (copie de alpha.png) ; le commun est réutilisé (identique) ; fichiers présents
      const mediaC = all("SELECT * FROM mk_media WHERE site_id = ?", C);
      assert.deepEqual(mediaC.map((m) => m.name).sort(), ["alpha.png", "mien.png"]);
      const copyOfAlpha = mediaC.find((m) => m.name === "alpha.png");
      assert.ok(mediaC.every((m) => m.reach === "site" && m.path.includes(`/site-${C}/`)));
      assert.ok(mediaC.every((m) => fs.existsSync(diskOf(m.path))));
      assert.equal(sha(fs.readFileSync(diskOf(copyOfAlpha.path))), sha(fs.readFileSync(diskOf(imgA.path))), "octets identiques à l'original");
      const draft = String(restored[0].draft);
      assert.ok(draft.includes(copyOfAlpha.path), "la page de Cible pointe vers le fichier de Cible");
      assert.ok(!draft.includes(imgA.path), "elle ne pointe plus vers le fichier d'Alpha");
      assert.ok(draft.includes(imgCommon.path), "le fichier commun est réutilisé tel quel");
      // isolation
      assert.equal(fingerprint([A, B]), snapshotOthers, "les autres sites (pages, fiches, octets des fichiers) sont identiques avant/après");
      assert.deepEqual(orphans(), { filesWithoutRow: [], rowsWithoutFile: [] });
      // « Annuler cet import » existe pour cette restauration
      const run = one("SELECT id, kind, status FROM cms_tool_runs WHERE kind = 'import' ORDER BY id DESC LIMIT 1");
      assert.equal(run.status, "done");
    });

    test("le paquet restauré une seconde fois est analysé sans rien dupliquer côté fichiers (réutilisation par contenu)", async () => {
      const filesBefore = all("SELECT id FROM mk_media").length;
      const fd = new FormData();
      fd.append("file", new Blob([bundleBuffer], { type: "application/octet-stream" }), "a.kksite");
      const an = await boss.request(`${O}/sauvegarde-site/analyser?site=${C}`, { method: "POST", multipart: fd });
      assert.equal(an.status, 200);
      assert.match(an.text, /3 fichier\(s\) \(dont 3 déjà présent/);
      assert.equal(all("SELECT id FROM mk_media").length, filesBefore);
    });
  });

  describe("refus : aucun changement quand le paquet est invalide ou quand la restauration échoue", () => {
    const post = async (buffer, site, name = "x.kksite") => {
      const fd = new FormData();
      fd.append("file", new Blob([buffer], { type: "application/octet-stream" }), name);
      return boss.request(`${O}/sauvegarde-site/analyser?site=${site}`, { method: "POST", multipart: fd });
    };
    const state = () => JSON.stringify({ media: all("SELECT id, path FROM mk_media ORDER BY id"), pages: all("SELECT id, site_id, name FROM mk_landing_pages ORDER BY id"), tree: treeOf(path.join(uploadsDir, "marketing")) });
    const treeOf = (d) => { const out = []; const walk = (x) => { for (const e of fs.existsSync(x) ? fs.readdirSync(x, { withFileTypes: true }) : []) { const p = path.join(x, e.name); if (e.isDirectory()) walk(p); else out.push(p); } }; walk(d); return out.sort(); };
    const header = (b) => { const mlen = b.readUInt32BE(8); return { mlen, start: 12 + mlen, manifest: JSON.parse(b.subarray(12, 12 + mlen).toString("utf8")) }; };
    const rebuild = (manifest, tail) => { const head = Buffer.from(JSON.stringify(manifest)); const len = Buffer.alloc(4); len.writeUInt32BE(head.length); return Buffer.concat([Buffer.from("KKSITE1\n", "latin1"), len, head, tail]); };

    test("octet de fichier modifié, paquet tronqué, mauvais en-tête, texte quelconque : tous refusés, rien d'écrit", async () => {
      const before = state();
      const h = header(bundleBuffer);
      const flipped = Buffer.from(bundleBuffer); flipped[h.start + 5] ^= 0xff;
      const cases = {
        "fichier modifié": [flipped, /abîmé|somme de contrôle/],
        "tronqué": [bundleBuffer.subarray(0, bundleBuffer.length - 10), /tronqué/],
        "octets en trop": [Buffer.concat([bundleBuffer, Buffer.from("zz")]), /octets en trop/],
        "mauvais en-tête": [Buffer.concat([Buffer.from("PK\u0003\u0004"), bundleBuffer.subarray(4)]), /non reconnu/],
        "texte": [Buffer.from("ceci n'est pas un paquet"), /non reconnu|court/],
        "vide": [Buffer.from(""), /./],
      };
      for (const [label, [buffer, re]] of Object.entries(cases)) {
        if (!buffer.length) continue; // multer refuse un envoi vide avant nous
        const r = await post(buffer, C);
        assert.equal(r.status, 200, label);
        assert.match(r.text, /Paquet refusé : rien n'a été modifié/, label);
        assert.match(r.text, re, label);
      }
      assert.equal(state(), before, "aucune écriture (base et disque) pour tous les paquets refusés");
    });

    test("manifeste falsifié : chemin d'origine dangereux, contenu modifié, type annoncé faux, doublon de chemin, mime incohérent", async () => {
      const before = state();
      const h = header(bundleBuffer);
      const tail = bundleBuffer.subarray(h.start);
      const clone = () => JSON.parse(JSON.stringify(h.manifest));
      const bad = {
        "chemin dangereux": (m) => { m.files[0].path = "/uploads/marketing/1/../../../etc/passwd"; return /chemin d.{1,6}origine dangereux/; },
        "chemin hors médiathèque": (m) => { m.files[0].path = "/etc/passwd"; return /chemin d.{1,6}origine dangereux/; },
        "contenu modifié": (m) => { m.data.resources.pages[0].name = "Falsifié"; return /modifié ou abîmé/; },
        "type faux": (m) => { m.files[0].mime = "application/pdf"; m.files[0].type = "pdf"; return /ne correspond pas|non reconnu/; },
        "doublon de chemin": (m) => { m.files[1].path = m.files[0].path; return /même chemin/; },
        "somme de contrôle absente": (m) => { m.files[0].sha256 = "xx"; return /somme de contrôle/; },
        "format inconnu": (m) => { m.format = "autre@9"; return /Format de paquet/; },
        "position incohérente": (m) => { m.files[1].offset += 1; return /position ou taille/; },
      };
      for (const [label, mutate] of Object.entries(bad)) {
        const m = clone();
        const re = mutate(m);
        const r = await post(rebuild(m, tail), C);
        assert.match(r.text, /Paquet refusé : rien n'a été modifié/, label);
        assert.match(r.text, re, label);
      }
      assert.equal(state(), before);
    });

    test("restauration directe avec un jeton inventé ou d'un autre compte : refusée, rien d'écrit", async () => {
      const before = state();
      for (const token of ["0".repeat(32), "../../etc/passwd", "x"]) {
        const r = await boss.post(`${O}/sauvegarde-site/restaurer?site=${C}`, { token, confirm: "1" });
        assert.equal(r.status, 302);
      }
      const other = await person(C, "admin");
      const fd = new FormData(); fd.append("file", new Blob([bundleBuffer]), "a.kksite");
      const an = await other.request(`${O}/sauvegarde-site/analyser?site=${C}`, { method: "POST", multipart: fd });
      const token = String(an.text).match(/name="token" value="([0-9a-f]{32})"/)[1];
      const r = await boss.post(`${O}/sauvegarde-site/restaurer?site=${C}`, { token, confirm: "1" });
      assert.equal(r.status, 302);
      assert.equal(state(), before, "le jeton de quelqu'un d'autre n'est pas utilisable");
    });

    test("confirmation absente ou stratégie « tout arrêter » en conflit : rien d'écrit", async () => {
      const before = state();
      const an = await post(bundleBuffer, C);
      const token = String(an.text).match(/name="token" value="([0-9a-f]{32})"/)[1];
      assert.equal((await boss.post(`${O}/sauvegarde-site/restaurer?site=${C}`, { token, on_conflict: "skip" })).status, 302);
      assert.equal(state(), before, "sans confirmation");
      const re = await boss.post(`${O}/sauvegarde-site/restaurer?site=${C}`, { token, confirm: "1", on_conflict: "stop" });
      assert.equal(re.status, 302);
      assert.equal(state(), before, "conflits + « tout arrêter » : refusé avant toute écriture de fichier");
    });

    test("contenu refusé par l'analyse (page sans nom) : rien n'est écrit, ni fichier ni fiche, même si le paquet est intact", async () => {
      const before = state();
      const h = header(bundleBuffer);
      const m = JSON.parse(JSON.stringify(h.manifest));
      m.data.resources.pages[0].name = "";
      m.data.integrity = { sha256: crypto.createHash("sha256").update(JSON.stringify(m.data.resources)).digest("hex") }; // somme du format d'export recalculée aussi
      m.dataSha256 = crypto.createHash("sha256").update(JSON.stringify(m.data)).digest("hex"); // paquet cohérent : seule l'analyse du contenu peut le refuser
      const E = mkSite("Analyse");
      const an = await post(rebuild(m, bundleBuffer.subarray(h.start)), E);
      const token = String(an.text).match(/name="token" value="([0-9a-f]{32})"/)[1];
      const re = await boss.post(`${O}/sauvegarde-site/restaurer?site=${E}`, { token, confirm: "1", on_conflict: "duplicate" });
      assert.equal(re.status, 302);
      assert.equal(state(), before, "aucune écriture : l'analyse du contenu précède l'écriture des fichiers");
      assert.equal(one("SELECT COUNT(*) n FROM mk_landing_pages WHERE site_id = ?", E).n, 0);
    });

    test("échec EN COURS de restauration (un élément refuse d'être créé) : tout ce que la restauration avait écrit est défait, y compris les fichiers", async () => {
      const D = mkSite("Echec");
      // l'écriture du contenu d'une page de ce site est refusée par la base : la page est créée, puis son brouillon échoue
      const pageNames = JSON.parse(header(bundleBuffer).manifest.data ? JSON.stringify(header(bundleBuffer).manifest.data.resources.pages.map((p) => p.name)) : "[]");
      db.exec(`CREATE TRIGGER zz_refuse_page BEFORE UPDATE ON mk_landing_pages WHEN NEW.site_id = ${D} AND NEW.draft IS NOT NULL BEGIN SELECT RAISE(ABORT, 'refus de test'); END`);
      try {
        const settingsBefore = JSON.stringify(one("SELECT tokens, settings, settings_revision, name FROM mk_sites WHERE id = ?", D));
        const before = state();
        const an = await post(bundleBuffer, D);
        const token = String(an.text).match(/name="token" value="([0-9a-f]{32})"/)[1];
        const re = await boss.post(`${O}/sauvegarde-site/restaurer?site=${D}`, { token, confirm: "1", on_conflict: "duplicate" });
        assert.equal(re.status, 302);
        assert.ok(pageNames.length >= 1);
        // Ce que l'import avait créé est retiré : la page créée avant l'échec est à la corbeille (comportement de « Annuler cet import »), jamais en ligne
        const left = all("SELECT archived_at FROM mk_landing_pages WHERE site_id = ?", D);
        assert.ok(left.every((p) => p.archived_at), "aucune page active ne subsiste");
        const noD = (s) => JSON.stringify({ ...JSON.parse(s), pages: JSON.parse(s).pages.filter((p) => p.site_id !== D) });
        assert.equal(noD(state()), noD(before), "ni fiche média, ni fichier ne sont restés");
        assert.equal(JSON.stringify(one("SELECT tokens, settings, settings_revision, name FROM mk_sites WHERE id = ?", D)), settingsBefore, "les réglages du site cible sont rétablis");
        assert.deepEqual(orphans(), { filesWithoutRow: [], rowsWithoutFile: [] });
        const run = one("SELECT status, message FROM cms_tool_runs WHERE kind = 'import' ORDER BY id DESC LIMIT 1");
        assert.equal(run.status, "failed");
      } finally { db.exec("DROP TRIGGER IF EXISTS zz_refuse_page"); }
    });
  });

  describe("compatibilité avec l'export / import existants", () => {
    test("l'export JSON « kolakisa-site@1 » et son import fonctionnent toujours ; le contenu du paquet est lui-même un export valide", async () => {
      const mlen = bundleBuffer.readUInt32BE(8);
      const manifest = JSON.parse(bundleBuffer.subarray(12, 12 + mlen).toString("utf8"));
      assert.equal(manifest.data.format, "kolakisa-site@1");
      const fd = new FormData();
      fd.append("file", new Blob([JSON.stringify(manifest.data)], { type: "application/json" }), "export.json");
      fd.append("types", "pages");
      const r = await boss.request(`${O}/importer?site=${C}`, { method: "POST", multipart: fd });
      assert.equal(r.status, 302, r.text.slice(0, 200));
    });
    test("import « mettre à jour » : une redirection d'un AUTRE site n'est jamais modifiée ni déplacée", async () => {
      db.prepare("INSERT INTO seo_redirects (source_path, target, status, site_id) VALUES ('/ancien-b', '/cible-b', 301, ?)").run(B);
      const before = JSON.stringify(one("SELECT * FROM seo_redirects WHERE source_path = '/ancien-b'"));
      const file = JSON.stringify({ format: "kolakisa-site@1", exportedAt: new Date().toISOString(), source: { siteId: 999, siteName: "X" }, selection: ["redirects"], resources: { redirects: [{ source: "/ancien-b", target: "/autre-cible", status: 302, enabled: true, note: "" }] } });
      const fd = new FormData();
      fd.append("file", new Blob([file], { type: "application/json" }), "r.json");
      fd.append("types", "redirects"); fd.append("on_conflict", "update");
      const r = await boss.request(`${O}/importer?site=${C}`, { method: "POST", multipart: fd });
      assert.equal(r.status, 302, r.text.slice(0, 200));
      const id = Number(String(r.location).match(/importer\/(\d+)/)[1]);
      for (let i = 0; i < 100; i++) { const p = JSON.parse((await boss.get(`${O}/operations/${id}.json?site=${C}`)).text); if (["awaiting", "failed", "done"].includes(p.status)) break; await new Promise((x) => setTimeout(x, 100)); }
      await boss.post(`${O}/importer/${id}/confirmer?site=${C}`, { confirm: "1" });
      for (let i = 0; i < 100; i++) { const p = JSON.parse((await boss.get(`${O}/operations/${id}.json?site=${C}`)).text); if (["failed", "done"].includes(p.status)) break; await new Promise((x) => setTimeout(x, 100)); }
      assert.equal(JSON.stringify(one("SELECT * FROM seo_redirects WHERE source_path = '/ancien-b'")), before, "la redirection du site B est identique");
    });
    test("un accès limité au site A ne peut ni télécharger ni restaurer un paquet d'un autre site", async () => {
      const guestA = await person(A, "admin");
      assert.equal((await download(guestA, B)).status, 403);
      const fd = new FormData(); fd.append("file", new Blob([bundleBuffer]), "a.kksite");
      assert.equal((await guestA.request(`${O}/sauvegarde-site/analyser?site=${B}`, { method: "POST", multipart: fd })).status, 403);
      assert.equal((await guestA.post(`${O}/sauvegarde-site/restaurer?site=${B}`, { token: "0".repeat(32), confirm: "1" })).status, 403);
    });
  });
});
