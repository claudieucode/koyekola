// KOLAKISA CMS — Paramètres → Médias : tailles des images (miniature recadrée ou proportionnelle, moyenne, grande), organisation des envois par année et par mois,
// persistance, validation, isolation par site, et EFFET RÉEL sur le moteur média (versions fabriquées par sharp, lues et mesurées). Vrai serveur, vraies routes.
// Les essais de fabrication d'images exigent « sharp » (dépendance facultative) : ils sont ignorés, avec la raison, s'il est absent.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, Client, loginInstructor, newStudent } = require("./helpers");

let sharp = null;
try { sharp = require("sharp"); } catch { /* ignoré plus bas */ }
const SKIP = sharp ? false : "sharp absent : fabrication d'images impossible à vérifier ici";
const P = "/marketing/site-web/parametres/medias";
let srv, boss, db, anon, org;
const one = (sql, ...a) => db.prepare(sql).get(...a);
const png = (w, h, color = { r: 20, g: 120, b: 200 }) => sharp({ create: { width: w, height: h, channels: 3, background: color } }).png().toBuffer();
async function newSite(name) { return Number(String((await boss.post("/marketing/site-web/sites", { name })).location).match(/sites\/(\d+)/)[1]); }
async function upload(client, buffer, name = "photo.png", site = null) {
  const fd = new FormData();
  fd.append("file", new Blob([buffer], { type: "image/png" }), name);
  const r = await client.request(`/marketing/site-web/mediatheque/televerser${site ? `?site=${site}` : ""}`, { method: "POST", multipart: fd });
  assert.equal(r.status, 201, r.text.slice(0, 300));
  return JSON.parse(r.text).media;
}
const diskOf = (publicPath) => path.join(srv.dir, "uploads", publicPath.replace(/^\/uploads\//, ""));
const save = (fields, site) => boss.post(`${P}${site ? `?site=${site}` : ""}`, { thumb_w: "150", thumb_h: "0", medium_w: "640", medium_h: "0", large_w: "1024", large_h: "0", ...(site ? { site: String(site) } : {}), ...fields });
const reset = async (site) => { const r = await save({}, site); assert.equal(r.status, 302, r.text.slice(0, 300)); };
const variantUrl = (media, code) => media.path.replace(/\/(?:\d{4}\/\d{2}\/)?([^/]+)\.(png|jpg|webp|avif)$/, (m, base) => `/v/${code}/${base}.webp`);
const dims = async (buf) => { const m = await sharp(buf).metadata(); return [m.width, m.height]; };
const get = (p) => anon.get(p, { headers: { "User-Agent": "Mozilla/5.0 (test)" } });

before(async () => {
  srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
  boss = await loginInstructor(srv); db = srv.db(); anon = new Client(srv.base);
  org = one("SELECT id FROM mk_organizations").id;
});
after(async () => { await srv.stop(); });

describe("écran : chargement, persistance, validation", () => {
  test("la page charge les valeurs d'origine (miniature 150, moyenne 640, grande 1024, dossier unique) avec les trois groupes et le téléversement", async () => {
    const r = await boss.get(P);
    assert.equal(r.status, 200);
    for (const label of ["Tailles des images", "Taille des miniatures", "Taille moyenne", "Grande taille", "Téléversement des médias", "Recadrer les miniatures", "Organiser mes téléversements dans des dossiers mensuels et annuels", "Aperçu avec une photo d'exemple"]) assert.match(r.text, new RegExp(label), label);
    assert.match(r.text, /name="thumb_w" value="150"/); assert.match(r.text, /name="thumb_h" value="0"/);
    assert.match(r.text, /name="medium_w" value="640"/); assert.match(r.text, /name="large_w" value="1024"/);
    assert.doesNotMatch(r.text, /name="thumb_crop" value="1" checked/); assert.doesNotMatch(r.text, /name="organize" value="1" checked/);
    assert.match(r.text, /<button[^>]*data-md-save/);
  });
  test("enregistrement puis rechargement : tout persiste (base et écran) ; revenir aux valeurs d'origine efface les lignes", async () => {
    const w = await save({ thumb_w: "200", thumb_h: "200", thumb_crop: "1", medium_w: "300", medium_h: "300", large_w: "1200", large_h: "800", organize: "1" });
    assert.equal(w.status, 302, w.text.slice(0, 300));
    assert.equal(one("SELECT value FROM mk_settings WHERE key = 'mediasize.main.thumb_w'").value, "200");
    assert.equal(one("SELECT value FROM mk_settings WHERE key = 'mediasize.main.thumb_crop'").value, "1");
    const again = (await boss.get(P)).text;
    assert.match(again, /name="thumb_w" value="200"/); assert.match(again, /name="thumb_h" value="200"/); assert.match(again, /name="large_h" value="800"/);
    assert.match(again, /name="thumb_crop" value="1" checked/); assert.match(again, /name="organize" value="1" checked/);
    await reset();
    assert.equal(one("SELECT COUNT(*) n FROM mk_settings WHERE key LIKE 'mediasize.main.%' AND key NOT LIKE '%known'").n, 0, "valeurs d'origine : aucune ligne stockée");
  });
  test("validation serveur : vide, négatif, zéro, non numérique, excessif, moyenne > grande, recadrage sans hauteur — rien n'est enregistré, la saisie est conservée", async () => {
    const before = JSON.stringify(db.prepare("SELECT key, value FROM mk_settings WHERE key LIKE 'mediasize.%' ORDER BY key").all());
    const bad = async (fields, re) => {
      const r = await save(fields);
      assert.equal(r.status, 422, JSON.stringify(fields)); assert.match(r.text, re, JSON.stringify(fields));
      assert.equal(JSON.stringify(db.prepare("SELECT key, value FROM mk_settings WHERE key LIKE 'mediasize.%' ORDER BY key").all()), before, "rien d'enregistré");
      return r;
    };
    await bad({ thumb_w: "" }, /valeur obligatoire/);
    await bad({ medium_w: "-5" }, /16 pixels au moins/);
    await bad({ large_w: "0" }, /16 pixels au moins/);
    await bad({ thumb_w: "abc" }, /nombre entier/);
    await bad({ large_w: "99999" }, /4000 pixels au plus/);
    await bad({ medium_h: "7" }, /16 pixels au moins/);
    await bad({ medium_w: "2000", large_w: "1024" }, /taille moyenne ne peut pas/);
    const crop = await bad({ thumb_crop: "1", thumb_h: "0" }, /recadrage exige une hauteur/);
    assert.match(crop.text, /name="thumb_crop" value="1" checked/, "la case reste cochée");
    const kept = await bad({ medium_w: "-5", large_w: "777" }, /16 pixels au moins/);
    assert.match(kept.text, /name="large_w" value="777"/, "la saisie valide est conservée");
  });
});

describe("effet réel sur le moteur média (sharp)", () => {
  test("miniature recadrée 150×150 : paysage, portrait et carré donnent EXACTEMENT 150×150, sans déformation ; l'original est intact", { skip: SKIP }, async () => {
    assert.equal((await save({ thumb_w: "150", thumb_h: "150", thumb_crop: "1" })).status, 302);
    const shots = [[800, 400], [400, 800], [500, 500]];
    for (const [w, h] of shots) {
      const buf = await png(w, h, { r: w % 255, g: h % 255, b: 90 });
      const m = await upload(boss, buf, `crop-${w}x${h}.png`);
      const before = crypto.createHash("sha256").update(fs.readFileSync(diskOf(m.path))).digest("hex");
      const r = await get(variantUrl(m, "150x150c"));
      assert.equal(r.status, 200, `${w}×${h} → ${r.status}`);
      const file = diskOf(variantUrl(m, "150x150c"));
      assert.deepEqual(await dims(fs.readFileSync(file)), [150, 150], `${w}×${h}`);
      assert.equal(crypto.createHash("sha256").update(fs.readFileSync(diskOf(m.path))).digest("hex"), before, "l'original n'a pas changé");
    }
    await reset();
  });
  test("miniature proportionnelle 150×150 (recadrage désactivé) : la boîte borne l'image sans la déformer (paysage 150×75, portrait 75×150)", { skip: SKIP }, async () => {
    assert.equal((await save({ thumb_w: "150", thumb_h: "150" })).status, 302);
    const land = await upload(boss, await png(800, 400), "prop-land.png"), port = await upload(boss, await png(400, 800), "prop-port.png");
    assert.equal((await get(variantUrl(land, "150x150"))).status, 200); assert.equal((await get(variantUrl(port, "150x150"))).status, 200);
    assert.deepEqual(await dims(fs.readFileSync(diskOf(variantUrl(land, "150x150")))), [150, 75]);
    assert.deepEqual(await dims(fs.readFileSync(diskOf(variantUrl(port, "150x150")))), [75, 150]);
    await reset();
  });
  test("moyenne 300×300 et grande 1024×1024 : limites maximales (jamais carrées), proportions conservées, images très larges et très hautes comprises", { skip: SKIP }, async () => {
    assert.equal((await save({ medium_w: "300", medium_h: "300", large_w: "1024", large_h: "1024" })).status, 302);
    const cases = [[800, 400, [300, 150]], [400, 800, [150, 300]], [3000, 200, [300, 20]], [200, 3000, [20, 300]], [1000, 1000, [300, 300]]];
    for (const [w, h, want] of cases) {
      const m = await upload(boss, await png(w, h), `med-${w}x${h}.png`);
      assert.equal((await get(variantUrl(m, "300x300"))).status, 200, `${w}×${h}`);
      assert.deepEqual(await dims(fs.readFileSync(diskOf(variantUrl(m, "300x300")))), want, `${w}×${h} → moyenne`);
    }
    const big = await upload(boss, await png(2000, 1000), "grande.png");
    assert.equal((await get(variantUrl(big, "1024x1024"))).status, 200);
    assert.deepEqual(await dims(fs.readFileSync(diskOf(variantUrl(big, "1024x1024")))), [1024, 512]);
    await reset();
  });
  test("aucun agrandissement : une image plus petite que la cible n'est jamais fabriquée en plus grand, l'original est servi (redirection)", { skip: SKIP }, async () => {
    assert.equal((await save({ thumb_w: "150", thumb_h: "150", thumb_crop: "1", medium_w: "300", medium_h: "300", large_w: "1024", large_h: "1024" })).status, 302);
    const small = await upload(boss, await png(100, 80), "petite.png");
    for (const code of ["150x150c", "300x300", "1024x1024"]) {
      const r = await get(variantUrl(small, code));
      assert.equal(r.status, 302, `${code} → ${r.status}`); assert.equal(r.location, small.path, "renvoie vers l'original");
      assert.equal(fs.existsSync(diskOf(variantUrl(small, code))), false, "aucun fichier fabriqué");
    }
    await reset();
  });
  test("réglage d'origine : l'adresse « v/<largeur>/ » historique fonctionne toujours (aucune page publiée ne casse)", { skip: SKIP }, async () => {
    const m = await upload(boss, await png(800, 400), "legacy.png");
    const r = await get(variantUrl(m, "150")); assert.equal(r.status, 200);
    assert.deepEqual(await dims(fs.readFileSync(diskOf(variantUrl(m, "150")))), [150, 75]);
    assert.equal((await get(variantUrl(m, "1024"))).status, 302, "plus grande que l'original (800 px) : l'original est servi");
  });
  test("liste blanche : des dimensions jamais réglées ne fabriquent rien ; les anciennes dimensions (déjà réglées) restent servies après un changement", { skip: SKIP }, async () => {
    const m = await upload(boss, await png(1200, 900), "liste-blanche.png");
    assert.equal((await get(variantUrl(m, "77x77"))).status, 404, "dimensions non réglées");
    assert.equal((await save({ medium_w: "300", medium_h: "300" })).status, 302);
    assert.equal((await get(variantUrl(m, "300x300"))).status, 200);
    assert.equal((await save({ medium_w: "400", medium_h: "400" })).status, 302);
    assert.equal((await get(variantUrl(m, "400x400"))).status, 200, "nouvelles dimensions");
    assert.equal((await get(variantUrl(m, "300x300"))).status, 200, "ancienne version : l'adresse déjà publiée reste valide");
    assert.equal((await get(variantUrl(m, "500x500"))).status, 404);
    await reset();
  });
  test("fichier piégé (dimensions déclarées démesurées) : refus de décoder, l'original est servi, aucun fichier partiel", { skip: SKIP }, async () => {
    const base = await png(8, 8);
    const evil = Buffer.from(base);
    evil.writeUInt32BE(30000, 16); evil.writeUInt32BE(30000, 20); // IHDR : 30 000 × 30 000 px (900 millions de pixels)
    const r0 = await (async () => { const fd = new FormData(); fd.append("file", new Blob([evil], { type: "image/png" }), "bombe.png"); return boss.request("/marketing/site-web/mediatheque/televerser", { method: "POST", multipart: fd }); })();
    if (r0.status !== 201) { assert.ok([415, 422].includes(r0.status), `refusé à l'envoi : ${r0.status}`); return; } // refus dès l'envoi : protection suffisante
    const m = JSON.parse(r0.text).media;
    assert.equal((await save({ thumb_w: "150", thumb_h: "150" })).status, 302);
    const r = await get(variantUrl(m, "150x150"));
    assert.equal(r.status, 302, "décodage refusé : l'original est servi");
    const dir = path.dirname(diskOf(variantUrl(m, "150x150")));
    assert.ok(!fs.existsSync(dir) || fs.readdirSync(dir).every((f) => !f.endsWith(".tmp")), "aucun fichier temporaire laissé");
    await reset();
  });
  test("l'éditeur de pages propose les tailles réellement disponibles, avec les dimensions du site (et seulement celles plus petites que l'original)", { skip: SKIP }, async () => {
    assert.equal((await save({ thumb_w: "150", thumb_h: "150", thumb_crop: "1", medium_w: "300", medium_h: "300" })).status, 302);
    const m = await upload(boss, await png(700, 500), "editeur.png");
    const r = await boss.get(`/marketing/site-web/medias/resolutions.json?src=${encodeURIComponent(m.path)}`);
    assert.equal(r.status, 200);
    const j = JSON.parse(r.text);
    assert.equal(j.available, true);
    const by = Object.fromEntries(j.sizes.map((s) => [s.key, s]));
    assert.deepEqual([by.thumbnail.width, by.thumbnail.height, by.thumbnail.crop], [150, 150, true]);
    assert.deepEqual([by.medium.width, by.medium.height], [300, 300]);
    assert.ok(!by.large, "la grande taille (1024) dépasse l'image de 700 px : non proposée");
    await reset();
  });
});

describe("organisation des envois par année et par mois", () => {
  const ym = () => { const d = new Date(); return [String(d.getUTCFullYear()), String(d.getUTCMonth() + 1).padStart(2, "0")]; };
  test("option activée : les NOUVEAUX fichiers vont dans /aaaa/mm/ (date du serveur), sont servis, et les anciens ne bougent pas ; désactivée : dossier unique", { skip: SKIP }, async () => {
    const [y, mo] = ym();
    const flatBefore = await upload(boss, await png(300, 200), "avant.png");
    assert.match(flatBefore.path, new RegExp(`^/uploads/marketing/${org}/\\d{13}-[0-9a-f]{12}\\.png$`), "dossier unique par défaut");
    assert.equal((await save({ organize: "1" })).status, 302);
    const dated = await upload(boss, await png(300, 200), "apres.png");
    assert.match(dated.path, new RegExp(`^/uploads/marketing/${org}/${y}/${mo}/\\d{13}-[0-9a-f]{12}\\.png$`));
    assert.ok(fs.existsSync(diskOf(dated.path)));
    assert.equal((await get(dated.path)).status, 200, "le fichier daté est servi");
    assert.equal((await get(flatBefore.path)).status, 200, "l'ancien fichier reste servi, à la même adresse");
    assert.ok(fs.existsSync(diskOf(flatBefore.path)), "l'ancien fichier n'a pas été déplacé");
    const v = await get(dated.path.replace(`/${y}/${mo}/`, "/").replace(/\/([^/]+)\.png$/, "/v/150/$1.webp")); assert.equal(v.status, 200, "les versions réduites d'un fichier daté sont fabriquées");
    assert.equal((await save({ organize: "" })).status, 302);
    const flatAfter = await upload(boss, await png(300, 200), "apres-off.png");
    assert.match(flatAfter.path, new RegExp(`^/uploads/marketing/${org}/\\d{13}-[0-9a-f]{12}\\.png$`), "désactivée : retour au dossier unique, les fichiers datés restent en place");
    assert.equal((await get(dated.path)).status, 200);
    const row = one("SELECT path FROM mk_media WHERE id = ?", dated.id); assert.equal(row.path, dated.path, "référence stable en base");
  });
  test("un site : sa médiathèque est datée DANS son dossier ; les autres sites et le principal gardent leur propre choix", { skip: SKIP }, async () => {
    const A = await newSite("Médias A"), B = await newSite("Médias B");
    const [y, mo] = ym();
    assert.equal((await save({ organize: "1" }, A)).status, 302);
    const a = await upload(boss, await png(300, 200), "a.png", A), b = await upload(boss, await png(300, 200), "b.png", B), main = await upload(boss, await png(300, 200), "m.png");
    assert.match(a.path, new RegExp(`^/uploads/marketing/${org}/site-${A}/${y}/${mo}/`));
    assert.match(b.path, new RegExp(`^/uploads/marketing/${org}/site-${B}/\\d{13}-`), "B : dossier unique");
    assert.match(main.path, new RegExp(`^/uploads/marketing/${org}/\\d{13}-`), "principal : dossier unique");
    assert.equal((await get(a.path)).status, 200);
  });
});

describe("multi-sites, nouveaux sites et permissions", () => {
  test("chaque site a ses propres dimensions : la version d'une image est celle du site propriétaire ; les dimensions d'un autre site ne fabriquent rien", { skip: SKIP }, async () => {
    const A = await newSite("Taille A"), B = await newSite("Taille B");
    assert.equal((await save({ thumb_w: "120", thumb_h: "120", thumb_crop: "1" }, A)).status, 302);
    assert.equal((await save({ thumb_w: "200", thumb_h: "200", thumb_crop: "1" }, B)).status, 302);
    assert.equal(one(`SELECT value FROM mk_settings WHERE key = 'mediasize.site_${A}.thumb_w'`).value, "120");
    assert.equal(one("SELECT value FROM mk_settings WHERE key = 'mediasize.main.thumb_w'"), undefined, "le principal n'est pas touché");
    const imgA = await upload(boss, await png(800, 600), "ia.png", A), imgB = await upload(boss, await png(800, 600), "ib.png", B);
    assert.equal((await get(variantUrl(imgA, "120x120c"))).status, 200);
    assert.deepEqual(await dims(fs.readFileSync(diskOf(variantUrl(imgA, "120x120c")))), [120, 120]);
    assert.equal((await get(variantUrl(imgB, "200x200c"))).status, 200);
    assert.equal((await get(variantUrl(imgA, "200x200c"))).status, 404, "les dimensions de B ne servent pas l'image de A");
    assert.equal((await get(variantUrl(imgB, "120x120c"))).status, 404);
    assert.match((await boss.get(`${P}?site=${A}`)).text, /name="thumb_w" value="120"/);
    assert.match((await boss.get(`${P}?site=${B}`)).text, /name="thumb_w" value="200"/);
    assert.match((await boss.get(P)).text, /name="thumb_w" value="150"/);
  });
  test("un nouveau site démarre avec les valeurs d'origine documentées, sans rien hériter d'un autre site", async () => {
    const A = await newSite("Réglé"); assert.equal((await save({ medium_w: "250", medium_h: "250" }, A)).status, 302);
    const N = await newSite("Neuf");
    const page = (await boss.get(`${P}?site=${N}`)).text;
    assert.match(page, /name="medium_w" value="640"/); assert.match(page, /name="medium_h" value="0"/); assert.match(page, /name="thumb_w" value="150"/);
    assert.equal(one(`SELECT COUNT(*) n FROM mk_settings WHERE key LIKE 'mediasize.site_${N}.%'`).n, 0);
  });
  test("permissions : un lecteur de l'organisation, un accès limité à un autre site et un anonyme ne modifient rien ; un identifiant de site du navigateur n'est pas une preuve", async () => {
    const A = await newSite("Perm A"), B = await newSite("Perm B");
    const member = async (site, role) => { const c = await newStudent(srv); db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, ?)").run(site, one("SELECT id FROM users WHERE email = ?", c.email).id, role); return c; };
    const adminA = await member(A, "admin"), viewerA = await member(A, "viewer");
    const snap = () => JSON.stringify(db.prepare("SELECT key, value FROM mk_settings WHERE key LIKE 'mediasize.%' ORDER BY key").all());
    const before = snap();
    const form = { thumb_w: "222", thumb_h: "222", medium_w: "333", medium_h: "0", large_w: "1111", large_h: "0" };
    for (const [client, url] of [[adminA, `${P}?site=${B}`], [adminA, P], [viewerA, `${P}?site=${A}`], [anon, P]]) {
      const r = await client.post(url, { ...form, site: String(B) });
      assert.doesNotMatch(String(r.location || ""), /parametres\/medias/, `${url} → ${r.status} ${r.location}`);
    }
    assert.equal(snap(), before, "aucune configuration modifiée");
    assert.notEqual((await adminA.get(`${P}?site=${B}`)).status, 200, "lecture d'un autre site refusée");
    const own = await adminA.post(`${P}?site=${A}`, { ...form, site: String(A) });
    assert.equal(own.status, 302, "l'administrateur du site A modifie le site A");
    assert.equal(one(`SELECT value FROM mk_settings WHERE key = 'mediasize.site_${A}.thumb_w'`).value, "222");
    assert.equal(one(`SELECT COUNT(*) n FROM mk_settings WHERE key LIKE 'mediasize.site_${B}.%'`).n, 0);
  });
  test("limites d'envoi : modifiables depuis le site principal par l'équipe, en lecture seule dans un site", async () => {
    const S = await newSite("Limites");
    const siteScreen = (await boss.get(`${P}?site=${S}`)).text;
    assert.match(siteScreen, /Limites communes à tous les sites/); assert.doesNotMatch(siteScreen, /name="media_max_image_mb"/);
    assert.match((await boss.get(P)).text, /name="media_max_image_mb"/);
    const r = await save({ media_max_image_mb: "3" });
    assert.equal(r.status, 302, r.text.slice(0, 200));
    assert.equal(one("SELECT value FROM mk_settings WHERE key = 'cms.media_max_image_mb'").value, "3");
    await boss.request("/marketing/site-web/parametres/api/media_max_image_mb?confirm=1", { method: "DELETE" });
  });
});
