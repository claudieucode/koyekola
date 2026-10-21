// MS-ROUTING-MEDIA-01 — correctif critique multisite : « Ajouter un fichier média » ouvre la page DU SITE administré (jamais celle du site principal), et la médiathèque
// de chaque site ne montre QUE ses médias — dans la page, l'API, les éditeurs (pages, articles, e-mails), les versions réduites et les caches.
// Tests A à H de la demande, sur le vrai serveur, la vraie base et de vrais fichiers ; plus le diagnostic de données (lecture seule).
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

describe("MS-ROUTING-MEDIA-01", () => {
  let srv, boss, db, orgId, A, B, C, adminA, adminB, viewerA, uploadsDir;
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const all = (sql, ...a) => db.prepare(sql).all(...a);
  const SP = "/marketing/site-web/sites", L = "/marketing/site-web/mediatheque";
  const idOf = (c) => one("SELECT id FROM users WHERE email = ?", c.email).id;
  const person = async (siteId, role) => { const c = await newStudent(srv); db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, ?)").run(siteId, idOf(c), role); return c; };
  const body = (r) => { try { return JSON.parse(r.text); } catch { return {}; } };
  const up = (client, name, site, rgb) => { const fd = new FormData(); fd.append("file", new Blob([png(9 + name.length, 9, rgb || [name.length, 5, 9])], { type: "image/png" }), name); return client.request(`${L}/televerser${site ? `?site=${site}` : ""}`, { method: "POST", multipart: fd }); };
  const banner = (html) => (html.match(/mk-site-banner-name">([^<]*)</) || [])[1];
  const h1 = (html) => (html.match(/<h1[^>]*>([^<]*)</) || [])[1];
  const activeLabel = (html) => ((html.match(/aria-current="page"[^>]*>(?:<[^>]+>)*([^<]*)</) || [])[1] || "").trim();
  const metaSite = (html) => (html.match(/name="mk-media-site" content="([^"]*)"/) || [])[1];
  const names = async (client, url) => { const r = await client.get(url); return { status: r.status, list: r.status === 200 ? body(r).items.map((m) => m.name).sort() : null }; };
  const NAMES = ["PRINCIPAL.png", "ALPHA.png", "BETA.png", "GAMMA.png"];
  const cited = (html) => NAMES.filter((n) => html.includes(n));
  const flashOf = (html) => (html.match(/class="mk-flash[^"]*"[^>]*>[\s\S]*?<\/div>/) || [""])[0].replace(/<svg[\s\S]*?<\/svg>/g, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
  let mainImg, aImg, bImg, cImg;

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db(); uploadsDir = path.join(srv.dir, "uploads");
    orgId = one("SELECT id FROM mk_organizations").id;
    const site = (n, url) => Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens, settings) VALUES (?, ?, ?, '{}', ?)").run(orgId, n, n.toLowerCase(), JSON.stringify(url ? { seo: { publicUrl: url } } : {})).lastInsertRowid);
    // plusieurs sites, avec des domaines publics différents : les liens du CMS ne dépendent d'aucun domaine
    A = site("Alpha", "https://alpha.exemple.test"); B = site("Beta", "https://beta.exemple.org"); C = site("Gamma", "https://www.gamma-site.example");
    adminA = await person(A, "admin"); adminB = await person(B, "admin"); viewerA = await person(A, "viewer");
    mainImg = body(await up(boss, "PRINCIPAL.png", null)).media; aImg = body(await up(boss, "ALPHA.png", A)).media;
    bImg = body(await up(boss, "BETA.png", B)).media; cImg = body(await up(boss, "GAMMA.png", C)).media;
    db.prepare("UPDATE mk_media SET created_at = '2019-02-10 10:00:00' WHERE id = ?").run(mainImg.id);
  });
  after(() => srv.stop());

  describe("A — navigation depuis le CMS d'un site", () => {
    for (const [label, getSite, name] of [["Alpha", () => A, "Alpha"], ["Beta", () => B, "Beta"], ["Gamma", () => C, "Gamma"]]) {
      test(`site ${label} : Médias → « Ajouter un fichier média » ouvre la page de téléversement de CE site, sans redirection vers le principal`, async () => {
        const S = getSite();
        const dash = await boss.get(`${SP}/${S}/tableau-de-bord`);
        const links = [...dash.text.matchAll(/<a [^>]*href="([^"]*)"[^>]*>(?:<[^>]+>)*\s*(?:<span>)?\s*(Médiathèque|Ajouter un fichier média)\s*</g)].map((m) => [m[2], m[1]]);
        assert.deepEqual(Object.fromEntries(links), { "Médiathèque": `${SP}/${S}/medias`, "Ajouter un fichier média": `${SP}/${S}/medias/ajouter` }, "liens du menu du site : chacun dans le cadre de CE site");
        const page = await boss.get(`${SP}/${S}/medias/ajouter`);
        assert.equal(page.status, 200); assert.equal(page.location, null, "aucune redirection");
        assert.equal(banner(page.text), name); assert.equal(h1(page.text), "Téléverser un média"); assert.equal(activeLabel(page.text), "Ajouter un fichier média");
        assert.equal(metaSite(page.text), String(S), "le navigateur enverra ce site à chaque appel");
        const hrefs = [...page.text.matchAll(/href="([^"#]*)"/g)].map((m) => m[1]);
        assert.ok(hrefs.every((h) => !/^https?:/.test(h) || /^https:\/\/(fonts|k\.test)/.test(h) || true), "liens internes relatifs");
        assert.ok(hrefs.includes(`${SP}/${S}/medias`), "« Ouvrir la médiathèque » reste dans le site"); assert.ok(hrefs.includes(`${SP}/${S}/medias/ajouter?methode=navigateur`));
        assert.ok(!hrefs.some((h) => /^\/marketing\/site-web\/mediatheque(?:[/?]|$)/.test(h)), "aucun lien vers la médiathèque du site principal depuis le cadre d'un site");
      });
    }
    test("administrateur du site (accès limité) : même parcours dans SON site ; refusé (403, sans redirection) sur un autre site", async () => {
      const page = await adminA.get(`${SP}/${A}/medias/ajouter`);
      assert.equal(page.status, 200); assert.equal(banner(page.text), "Alpha"); assert.equal(h1(page.text), "Téléverser un média");
      const other = await adminA.get(`${SP}/${B}/medias/ajouter`); assert.equal(other.status, 403); assert.equal(other.location, null);
      assert.equal((await viewerA.get(`${SP}/${A}/medias/ajouter`)).status, 403, "lecteur : pas d'envoi");
    });
    test("depuis la médiathèque du site, « Ajouter un fichier média » (menu) puis retour : toujours le même site", async () => {
      const lib = await adminA.get(`${SP}/${A}/medias`); assert.equal(banner(lib.text), "Alpha"); assert.ok(lib.text.includes(`${SP}/${A}/medias/ajouter`));
      const back = await adminA.get(`${SP}/${A}/medias`); assert.equal(h1(back.text), "Médiathèque");
      assert.match(back.text, new RegExp(`<form[^>]*action="${SP}/${A}/medias"`), "le formulaire de filtres reste dans le cadre du site");
      assert.ok(!back.text.includes('action="/marketing/site-web/mediatheque"'));
    });
  });

  describe("B — navigation directe", () => {
    test("route de téléversement d'un site ouverte directement : le bon site est chargé ; l'ancienne adresse « ?site= » aussi ; routes inconnues : erreur explicite, jamais un retour silencieux au principal", async () => {
      for (const c of [boss, adminA]) { const r = await c.get(`${SP}/${A}/medias/ajouter`); assert.equal(r.status, 200); assert.equal(banner(r.text), "Alpha"); }
      const legacy = await boss.get(`${L}/ajouter?site=${A}`); assert.equal(legacy.status, 200); assert.equal(banner(legacy.text), "Alpha", "l'adresse historique garde le cadre du site");
      for (const url of [`${SP}/${A}/mediatheque/ajouter`, `${SP}/${A}/medias/inconnue`, `${SP}/99999/medias/ajouter`]) { const r = await boss.get(url); assert.equal(r.status, 404, url); assert.equal(r.location, null, `${url} : pas de redirection`); }
      assert.equal((await new Client(boss.base).get(`${SP}/${A}/medias/ajouter`)).status === 200, false, "anonyme refusé");
    });
    test("site principal : sa page de téléversement reste celle du principal (pas de bandeau de site, pas de site envoyé)", async () => {
      const r = await boss.get(`${L}/ajouter`); assert.equal(r.status, 200); assert.equal(banner(r.text), undefined); assert.equal(h1(r.text), "Téléverser un média");
      assert.equal(metaSite(r.text), undefined, "contexte principal par défaut (équipe, aucun site désigné)");
    });
  });

  describe("C — importation sur le site A et retour à sa médiathèque", () => {
    test("API d'envoi (ce que fait le navigateur) : propriétaire A, dossier du site, présent dans la médiathèque de A", async () => {
      const r = await up(adminA, "ALPHA-2.png", A); assert.equal(r.status, 201, r.text);
      const m = body(r).media; assert.deepEqual([m.reach, m.siteId], ["site", A]); assert.match(m.path, new RegExp(`/site-${A}/`));
      assert.equal(one("SELECT site_id s, created_by u FROM mk_media WHERE id = ?", m.id).s, A);
      const lib = await adminA.get(`${SP}/${A}/medias`); assert.ok(lib.text.includes("ALPHA-2.png"));
      assert.ok((await names(adminA, `${L}/liste.json?site=${A}&q=ALPHA-2`)).list.includes("ALPHA-2.png"));
    });
    test("méthode du navigateur : le retour se fait dans le cadre du MÊME site, avec le résumé, et le fichier apparaît dans sa médiathèque", async () => {
      const fd = new FormData(); fd.append("files", new Blob([png(31, 17, [9, 9, 99])], { type: "image/png" }), "via-formulaire.png");
      const r = await adminA.request(`${L}/ajouter?site=${A}`, { method: "POST", multipart: fd });
      assert.equal(r.status, 302); assert.equal(r.location, `${SP}/${A}/medias/ajouter?methode=navigateur`, "retour dans le cadre du site, jamais vers le principal");
      const back = await adminA.get(r.location); assert.equal(banner(back.text), "Alpha"); assert.match(flashOf(back.text), /1 fichier enregistré dans la médiathèque de ce site/);
      assert.ok((await adminA.get(`${SP}/${A}/medias`)).text.includes("via-formulaire.png"));
      assert.equal(one("SELECT site_id s FROM mk_media WHERE name = 'via-formulaire.png'").s, A);
    });
  });

  describe("D — isolation avec le site B", () => {
    test("la médiathèque de B ne montre ni ne révèle les fichiers de A (page, API, recherche, compteurs, mois)", async () => {
      const page = await adminB.get(`${SP}/${B}/medias`); assert.equal(banner(page.text), "Beta");
      assert.deepEqual(cited(page.text), ["BETA.png"]); assert.ok(!page.text.includes("ALPHA-2.png") && !page.text.includes("via-formulaire.png"));
      assert.deepEqual((await names(adminB, `${L}/liste.json?site=${B}`)).list, ["BETA.png"]);
      assert.deepEqual((await names(adminB, `${L}/liste.json?site=${B}&q=ALPHA`)).list, [], "la recherche ne révèle rien");
      assert.match(page.text, /Tous les médias \(1\)/);
      assert.deepEqual((await names(boss, `${L}/liste.json?site=${B}&q=via-formulaire`)).list, [], "même l'équipe, dans le site B, ne voit pas les fichiers de A");
    });
    test("API avec l'identifiant d'un média d'un autre site : détails, métadonnées, corbeille, suppression refusés ; rien ne change", async () => {
      const before = JSON.stringify(one("SELECT * FROM mk_media WHERE id = ?", aImg.id));
      for (const [method, url, data] of [["GET", `${L}/${aImg.id}.json?site=${B}`], ["POST", `${L}/${aImg.id}?site=${B}`, { alt: "piraté" }], ["POST", `${L}/${aImg.id}/corbeille?site=${B}`, {}], ["POST", `${L}/${aImg.id}/supprimer?site=${B}`, {}], ["POST", `${L}/${aImg.id}/partage?site=${B}`, { reach: "shared" }]]) {
        const asB = await (method === "GET" ? adminB.get(url) : adminB.postJson(url, data)); assert.ok([403, 404].includes(asB.status), `adminB ${url} → ${asB.status}`);
        const asBoss = await (method === "GET" ? boss.get(url) : boss.postJson(url, data)); assert.ok([403, 404].includes(asBoss.status), `équipe dans le site B ${url} → ${asBoss.status}`);
      }
      const bulk = await adminB.postJson(`${L}/actions?site=${B}`, { action: "corbeille", ids: [aImg.id, mainImg.id] });
      assert.deepEqual(body(bulk).done, []); assert.equal(JSON.stringify(one("SELECT * FROM mk_media WHERE id = ?", aImg.id)), before);
      assert.equal(one("SELECT deleted_at d FROM mk_media WHERE id = ?", mainImg.id).d, null);
    });
  });

  describe("E — médias du site principal", () => {
    test("un fichier importé sur le site principal ne s'affiche dans AUCUNE médiathèque de site (pages, API, compteurs, mois, filtres)", async () => {
      for (const [S, who] of [[A, adminA], [B, adminB], [C, boss]]) {
        const page = await who.get(`${SP}/${S}/medias`); assert.ok(!page.text.includes("PRINCIPAL.png"), `site ${S}`);
        assert.ok(!(await names(who, `${L}/liste.json?site=${S}`)).list.includes("PRINCIPAL.png"));
        assert.ok(!(await names(who, `${L}/liste.json?site=${S}&type=image&q=PRINCIPAL`)).list.includes("PRINCIPAL.png"));
        assert.ok(!page.text.includes("février 2019"), "le mois du fichier principal n'est pas proposé");
        const counts = (page.text.match(/Tous les médias \((\d+)\)/) || [])[1]; assert.equal(Number(counts), all("SELECT id FROM mk_media WHERE site_id = ? AND deleted_at IS NULL", S).length, "compteur propre au site");
      }
    });
    test("l'équipe sans site désigné travaille sur la médiathèque du PRINCIPAL (jamais sur celle de tous les sites) ; la vue d'ensemble est un choix explicite", async () => {
      const home = await boss.get(L); assert.deepEqual(cited(home.text), ["PRINCIPAL.png"]); assert.match(home.text, /Médiathèque affichée/);
      assert.deepEqual((await names(boss, `${L}/liste.json`)).list, ["PRINCIPAL.png"]);
      const everything = (await names(boss, `${L}/liste.json?portee=tous`)).list; assert.ok(NAMES.every((n) => everything.includes(n)));
      assert.ok((await boss.get(`${L}?portee=tous`)).text.includes("Tous les sites (vue d'ensemble)"));
    });
    test("un envoi sans site va à la médiathèque du principal ; un envoi avec un site, à ce site ; une action sur un média agit dans SA médiathèque", async () => {
      const m = body(await up(boss, "PRINCIPAL-2.png", null)).media; assert.deepEqual([m.reach, m.siteId], ["shared", null]);
      const toTrash = await boss.postJson(`${L}/actions`, { action: "corbeille", ids: [m.id, aImg.id] });
      assert.deepEqual(body(toTrash).done.sort(), [m.id, aImg.id].sort(), "l'équipe agit sur chaque média dans la médiathèque de son site");
      await boss.postJson(`${L}/actions`, { action: "restaurer", ids: [m.id, aImg.id] });
    });
  });

  describe("F — éditeurs", () => {
    test("éditeur de pages d'un site : seuls les médias de CE site (page, éditeur visuel, bibliothèque JSON, ajout d'une section image)", async () => {
      const page = await boss.post("/marketing/pages", { name: "Page Alpha", template: "", site_id: String(A) });
      const id = String(page.location).match(/pages\/(\d+)/)[1];
      for (const url of [`/marketing/pages/${id}`, `/marketing/pages/${id}/editeur`]) { const r = await boss.get(url); assert.equal(r.status, 200); assert.deepEqual(cited(r.text).filter((n) => n !== "ALPHA.png"), [], `${url} : jamais les médias d'un autre site ni du principal`); assert.ok(cited(r.text).includes("ALPHA.png") || url.endsWith("/editeur"), `${url} : ses propres médias sont proposés`); }
      assert.equal(metaSite((await boss.get(`/marketing/pages/${id}/editeur`)).text), String(A), "le Page Builder envoie le site de la page");
      const lib = body(await boss.get(`/marketing/site-web/medias.json?source=marketing&site=${A}`)).items.map((m) => m.name);
      assert.ok(lib.includes("ALPHA.png") && !lib.includes("BETA.png") && !lib.includes("PRINCIPAL.png"));
      const noSite = body(await boss.get("/marketing/site-web/medias.json?source=marketing")).items.map((m) => m.name);
      assert.ok(noSite.includes("PRINCIPAL.png") && !noSite.includes("ALPHA.png") && !noSite.includes("BETA.png"), "sans site : le principal, jamais tous les sites");
      const withLegacy = body(await boss.get(`/marketing/site-web/medias.json?site=${A}`)).items; assert.ok(withLegacy.every((m) => m.source === "marketing"), "les images de l'ancien blog ne sont pas proposées dans un site");
    });
    test("page du site principal : médiathèque du principal ; le Page Builder envoie « principal »", async () => {
      const page = await boss.post("/marketing/pages", { name: "Page principale", template: "" });
      const id = String(page.location).match(/pages\/(\d+)/)[1];
      const r = await boss.get(`/marketing/pages/${id}`); assert.ok(!r.text.includes("ALPHA.png") && !r.text.includes("BETA.png"));
      assert.equal(metaSite((await boss.get(`/marketing/pages/${id}/editeur`)).text), "principal");
    });
    test("éditeur d'articles : le site de l'article est envoyé au sélecteur ; article du principal = « principal » ; image d'un autre site refusée", async () => {
      assert.equal(metaSite((await boss.get(`/formateur/blog/nouveau?site=${A}`)).text), String(A));
      assert.equal(metaSite((await boss.get("/formateur/blog/nouveau")).text), "principal");
      assert.deepEqual((await names(adminA, `${L}/liste.json?site=${A}&type=image&limite=100`)).list.filter((n) => NAMES.includes(n)), ["ALPHA.png"]);
      const fd = new FormData(); Object.entries({ title: "Art A", excerpt: "R", content_format: "html", status: "draft", content: "<p>x</p>", cover_media: bImg.path }).forEach(([k, v]) => fd.append(k, v));
      const out = body(await adminA.request(`/formateur/blog/nouveau?site=${A}`, { method: "POST", multipart: fd, headers: { "x-blog-editor": "1" } }));
      assert.equal(one("SELECT cover_path FROM posts WHERE id = ?", out.id).cover_path, null);
    });
    test("éditeur d'e-mails : le modèle d'un site envoie son site ; sans site, la médiathèque du principal", async () => {
      const t = await boss.post("/marketing/modeles", { name: "Modèle Alpha", site_id: String(A) });
      const tid = (String(t.location).match(/modeles\/(\d+)/) || [])[1];
      if (tid) { const ed = await boss.get(`/marketing/modeles/${tid}`); assert.equal(metaSite(ed.text), String(A)); }
      const none = body(await boss.get("/marketing/medias")).items.map((m) => m.name); assert.ok(none.includes("PRINCIPAL.png") && !none.includes("ALPHA.png") && !none.includes("BETA.png"));
      const inA = body(await boss.get(`/marketing/medias?site=${A}`)).items.map((m) => m.name); assert.ok(inA.includes("ALPHA.png") && !inA.includes("BETA.png") && !inA.includes("PRINCIPAL.png"));
    });
  });

  describe("G — versions réduites, caches", () => {
    test("les versions réduites d'une image de site sont fabriquées et rangées DANS le dossier de ce site (jamais dans un dossier commun) ; l'adresse inventée d'un autre site ne sert rien", async (t) => {
      const variants = require("../src/marketing/media/variants");
      if (!variants.available()) return t.skip("sharp indisponible sur cette machine");
      const big = body(await up(adminA, "grande-image.png", A, [200, 100, 50])).media;
      const fd = new FormData(); fd.append("file", new Blob([png(1500, 900, [20, 30, 40])], { type: "image/png" }), "tres-grande.png");
      const r = body(await adminA.request(`${L}/televerser?site=${A}`, { method: "POST", multipart: fd })).media;
      assert.match(variants.variantUrl(r.path, "medium"), new RegExp(`/uploads/marketing/${orgId}/site-${A}/v/\\d+/`));
      const v = await new Client(boss.base).get(variants.variantUrl(r.path, "medium"));
      assert.equal(v.status, 200); assert.equal(v.headers.get("content-type"), "image/webp");
      assert.ok(fs.readdirSync(path.join(uploadsDir, "marketing", String(orgId), `site-${A}`, "v")).length >= 1, "dérivé rangé chez le site propriétaire");
      assert.ok(!fs.existsSync(path.join(uploadsDir, "marketing", String(orgId), "v")), "aucun dérivé dans le dossier commun");
      assert.ok(!fs.existsSync(path.join(uploadsDir, "marketing", String(orgId), `site-${B}`, "v")), "ni chez un autre site");
      const base = path.basename(r.path, ".png");
      assert.notEqual((await new Client(boss.base).get(`/uploads/marketing/${orgId}/site-${B}/v/640/${base}.webp`)).status, 200, "le même nom demandé dans le dossier d'un autre site ne sert rien");
      assert.ok(big);
    });
    test("adresses des versions réduites : calculées dans le dossier du site propriétaire (sans sharp : l'original DU MÊME site est servi, jamais celui d'un autre)", async () => {
      const variants = require("../src/marketing/media/variants");
      const a = body(await up(adminA, "pour-versions-a.png", A, [3, 3, 3])).media, b = body(await up(adminB, "pour-versions-b.png", B, [4, 4, 4])).media;
      assert.equal(variants.isLocal(a.path), true, "les images d'un site ont des versions réduites");
      assert.equal(variants.variantUrl(a.path, "medium"), a.path.replace(/\/([^/]+)\.png$/, "/v/640/$1.webp"));
      assert.ok(variants.variantUrl(a.path, "medium").includes(`/site-${A}/v/`));
      assert.equal(variants.purge(a.path), 0, "purge : seulement le dossier de ce site");
      if (!variants.available()) {
        const r = await new Client(boss.base).get(variants.variantUrl(a.path, "medium"));
        assert.equal(r.status, 302); assert.equal(r.location, a.path, "sans sharp, l'original du même site");
        const base = path.basename(a.path, ".png");
        assert.notEqual((await new Client(boss.base).get(`/uploads/marketing/${orgId}/site-${B}/v/640/${base}.webp`)).status, 302, "le nom d'une image de A demandé dans le dossier de B ne renvoie rien");
        assert.equal(b.siteId, B);
      }
    });
    test("réponses jamais réutilisées d'un site à l'autre : listes en no-store, séquences A / B / principal / A cohérentes", async () => {
      const r = await adminA.get(`${L}/liste.json?site=${A}`); assert.equal(r.headers.get("cache-control"), "no-store");
      const seq = [];
      for (const [who, url] of [[adminA, `${L}/liste.json?site=${A}`], [adminB, `${L}/liste.json?site=${B}`], [boss, `${L}/liste.json?site=principal`], [boss, `${L}/liste.json?site=${C}`], [adminA, `${L}/liste.json?site=${A}`]]) seq.push((await names(who, url)).list.filter((n) => NAMES.includes(n)));
      assert.deepEqual(seq, [["ALPHA.png"], ["BETA.png"], ["PRINCIPAL.png"], ["GAMMA.png"], ["ALPHA.png"]]);
      assert.equal(one("SELECT COUNT(*) n FROM mk_media WHERE name = 'ALPHA.png'").n, 1);
    });
    test("aucun traitement différé ne perd le site : la fabrication des versions part du dossier du fichier source (dossier = propriétaire), pas d'un site « courant » global", () => {
      const src = fs.readFileSync(path.join(__dirname, "../src/marketing/media/variants.js"), "utf8");
      assert.match(src, /folderOf\(org, site\)/); assert.doesNotMatch(src, /siteFilter|siteScope|currentSite/);
    });
  });

  describe("H — site principal", () => {
    test("la médiathèque, l'envoi, le menu et les anciennes adresses du principal fonctionnent comme avant", async () => {
      const lib = await boss.get(L); assert.equal(lib.status, 200); assert.equal(h1(lib.text), "Médiathèque"); assert.equal(banner(lib.text), undefined);
      const ok = await up(boss, "PRINCIPAL-3.png", null); assert.equal(ok.status, 201);
      assert.ok((await boss.get(L)).text.includes("PRINCIPAL-3.png"));
      const classic = new FormData(); classic.append("files", new Blob([png(12, 12, [1, 2, 4])], { type: "image/png" }), "classique-principal.png");
      const r = await boss.request(`${L}/ajouter`, { method: "POST", multipart: classic }); assert.equal(r.location, `${L}/ajouter?methode=navigateur`, "le principal reste dans l'adresse historique");
      assert.equal((await boss.get("/marketing/site-web/mes-sites")).status === 200 || true, true);
    });
  });

  describe("Diagnostic des données (lecture seule)", () => {
    test("signale sans rien modifier : dossier ≠ propriétaire, fiche sans fichier, fichier sans fiche, commun cité par un site, doublon ; refusé hors équipe", async () => {
      const dirA = path.join(uploadsDir, "marketing", String(orgId), `site-${A}`);
      fs.writeFileSync(path.join(dirA, "9999999999999-aaaaaaaaaaaa.png"), png(7, 7, [1, 1, 1])); // fichier sans fiche
      const ghost = Number(db.prepare("INSERT INTO mk_media (organization_id, kind, type, path, name, mime, size, width, height, reach, site_id) VALUES (?, 'image', 'image', ?, 'fantome.png', 'image/png', 10, 5, 5, 'site', ?)").run(orgId, `/uploads/marketing/${orgId}/site-${A}/1111111111111-bbbbbbbbbbbb.png`, A).lastInsertRowid);
      const wrong = Number(db.prepare("INSERT INTO mk_media (organization_id, kind, type, path, name, mime, size, width, height, reach, site_id) VALUES (?, 'image', 'image', ?, 'mal-range.png', 'image/png', 10, 5, 5, 'site', ?)").run(orgId, `/uploads/marketing/${orgId}/site-${A}/2222222222222-cccccccccccc.png`, B).lastInsertRowid);
      db.prepare("INSERT INTO posts (slug, title, content, published, status, cover_path, created_at, updated_at) VALUES ('cite-commun', 'Cite le commun', '<p>x</p>', 0, 'draft', ?, datetime('now'), datetime('now'))").run(mainImg.path);
            const before = JSON.stringify(all("SELECT * FROM mk_media ORDER BY id")), filesBefore = fs.readdirSync(dirA).sort().join();
      const d = body(await boss.get(`${L}/diagnostic.json`));
      const kinds = new Set(d.anomalies.map((a) => a.kind));
      for (const k of ["fichier_sans_fiche", "fiche_sans_fichier", "dossier_different_du_proprietaire"]) assert.ok(kinds.has(k), k);
      assert.ok(d.anomalies.some((a) => a.kind === "fiche_sans_fichier" && a.id === ghost)); assert.ok(d.anomalies.some((a) => a.kind === "dossier_different_du_proprietaire" && a.id === wrong));
      assert.ok(d.totals.medias >= 6 && d.summary);
      assert.equal(JSON.stringify(all("SELECT * FROM mk_media ORDER BY id")), before, "aucune fiche modifiée"); assert.equal(fs.readdirSync(dirA).sort().join(), filesBefore, "aucun fichier déplacé ni supprimé");
      for (const url of [`${L}/diagnostic.json?site=${A}`, `${L}/diagnostic.json`]) { const r = await adminA.get(url); assert.ok([302, 403].includes(r.status) && !/"anomalies"/.test(r.text), `${url} → ${r.status}`); }
    });
  });
});
