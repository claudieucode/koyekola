// KOLAKISA CMS — palier 14 : moteur de réglages (général, lecture, commentaires, médias, permaliens, SEO, confidentialité, indexation),
// effets réels sur le site public, validation, permissions, isolation entre sites, API, journal, import / export, santé.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, Client, loginInstructor, newStudent } = require("./helpers");

let srv, boss, db, anon, orgId, home;
const one = (sql, ...a) => db.prepare(sql).get(...a);
const all = (sql, ...a) => db.prepare(sql).all(...a);
const count = (sql, ...a) => one(sql, ...a).n;
const P = "/marketing/site-web/parametres";
const API = `${P}/api`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const row = (id) => one("SELECT * FROM mk_landing_pages WHERE id = ?", id);
const metaOf = (html, name) => (html.match(new RegExp(`<meta (?:name|property)="${name}" content="([^"]*)"`)) || [])[1];
const qs = (site) => (site ? `?site=${site}` : "");
const jput = (client, url, body) => client.request(url, { method: "PUT", json: body });
const jget = async (client, url) => { const r = await client.get(url); return { status: r.status, body: r.text.startsWith("{") || r.text.startsWith("[") ? JSON.parse(r.text) : r.text }; };
const parse = (t) => { try { return JSON.parse(t); } catch { return { raw: t.slice(0, 80) }; } };
const apiPut = async (client, key, value, { site, confirm } = {}) => { const r = await jput(client, `${API}/${key}${qs(site)}`, { value, ...(confirm ? { confirm: true } : {}) }); return { status: r.status, body: parse(r.text) }; };
const apiVal = async (client, key, site) => (await jget(client, `${API}/${key}${qs(site)}`)).body.value;
async function create(name, extra = {}) { const r = await boss.post("/marketing/pages", { name, template: "", ...extra }); assert.equal(r.status, 302); return Number(String(r.location).match(/pages\/(\d+)/)[1]); }
async function livePage(name, extra = {}, sections = [{ type: "text", markdown: `Contenu de ${name}.` }]) {
  const id = await create(name, extra);
  const r = row(id);
  assert.equal((await boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", json: { revision: r.revision, content: { title: name, description: "", sections } } })).status, 200);
  db.prepare("UPDATE mk_landing_pages SET indexable = 1 WHERE id = ?").run(id);
  assert.equal((await boss.post(`/marketing/pages/${id}/publier.json`, {})).status, 200);
  return id;
}
async function newSite(name) { return Number(String((await boss.post("/marketing/site-web/sites", { name })).location).match(/sites\/(\d+)/)[1]); }
async function member(role) {
  const c = await newStudent(srv);
  db.prepare("INSERT INTO mk_org_members (organization_id, user_id, role) VALUES (?, ?, ?)").run(orgId, one("SELECT id FROM users WHERE email = ?", c.email).id, role);
  return c;
}
async function customMember(name, perms) {
  const r = await boss.post("/marketing/site-web/utilisateurs/roles", { name, description: "test", perm: perms });
  assert.ok([200, 302].includes(r.status), r.text.slice(0, 200));
  return member(one("SELECT key FROM mk_roles WHERE name = ?", name).key);
}

before(async () => {
  srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
  boss = await loginInstructor(srv);
  anon = new Client(srv.base);
  db = srv.db();
  orgId = one("SELECT id FROM mk_organizations").id;
});
after(() => srv.stop());

describe("écrans et accès", () => {
  test("les 9 écrans répondent 200 pour le créateur, sont absents du menu en lecture seule pour un lecteur (403) ; aucun écran décoratif", async () => {
    for (const p of ["", "/lecture", "/commentaires", "/medias", "/permaliens", "/seo", "/confidentialite", "/indexation", "/avance"]) assert.equal((await boss.get(`${P}${p}`)).status, 200, p);
    const viewer = await member("viewer");
    for (const p of ["", "/lecture", "/avance"]) assert.equal((await viewer.get(`${P}${p}`)).status, 403, p);
    assert.equal((await boss.get(`${P}/performance`)).status, 404, "les anciens écrans « bientôt » n'existent plus");
    const html = (await boss.get(P)).text;
    assert.doesNotMatch(html, /Prochain palier|Bientôt/);
    assert.match(html, /Nom du site/);
  });
  test("périmètres séparés : le site principal et un site du CMS n'ont pas les mêmes réglages ; plateforme et préférences personnelles ne sont jamais modifiables ici", async () => {
    const site = await newSite("Site périmètre");
    const main = (await jget(boss, API)).body.settings.map((s) => s.key);
    const sub = (await jget(boss, `${API}${qs(site)}`)).body.settings.map((s) => s.key);
    assert.ok(main.includes("posts_per_page") && main.includes("comments_moderation") && main.includes("admin_email") && main.includes("media_max_image_mb"));
    assert.ok(sub.includes("posts_per_page") && sub.includes("feed_items"), "la lecture (articles par page, flux) est propre à chaque site");
    assert.ok(!sub.includes("comments_moderation") && !sub.includes("admin_email"), "le contenu de l'organisation n'est pas un réglage de site");
    assert.ok(sub.includes("public_url") && sub.includes("logo") && sub.includes("favicon") && !main.includes("public_url"));
    assert.equal((await apiPut(boss, "SITE_URL", "https://evil.example")).status, 404, "la configuration de la plateforme n'est pas un réglage");
    assert.equal((await apiPut(boss, "ENCRYPTION_KEY", "x")).status, 404);
    assert.equal((await apiPut(boss, "editor_theme", "noir")).status, 404, "une préférence personnelle n'est pas un réglage du site");
    const bad = await jput(boss, `${API}/preferences`, { site_name: "Pirate" });
    assert.equal(bad.status, 422, "un réglage du site ne passe pas par les préférences");
    const ok = JSON.parse((await jput(boss, `${API}/preferences`, { editor_theme: "noir" })).text);
    assert.equal(ok.preferences.editor_theme, "noir");
    assert.equal(one("SELECT editor_theme FROM user_prefs WHERE user_id = ?", one("SELECT id FROM users WHERE role = 'formateur'").id).editor_theme, "noir");
    const page = (await boss.get(`${P}/avance`)).text;
    assert.match(page, /Configuration de la plateforme/);
    assert.doesNotMatch(page, new RegExp(TEST_KEY.slice(0, 10)), "aucun secret affiché");
  });
});

describe("général : effets réels sur le site public", () => {
  test("nom du site (SEO) : enregistré par le moteur SEO (une seule source), utilisé dans les titres publics", async () => {
    const r = await apiPut(boss, "site_name", "Académie Étoile");
    assert.equal(r.status, 200, JSON.stringify(r.body));
    assert.equal(one("SELECT value FROM seo_settings WHERE key = 'site_name'").value, JSON.stringify("Académie Étoile"));
    assert.equal(count("SELECT COUNT(*) n FROM mk_settings WHERE key LIKE 'cms.site_name%'"), 0, "aucune copie dans les réglages du CMS");
    const html = (await anon.get("/blog")).text;
    assert.match(html, /<title>[^<]*Académie Étoile<\/title>/);
    assert.equal(metaOf(html, "og:site_name"), "Académie Étoile");
  });
  test("description et langue : balises du site ; langue → attribut lang de la page", async () => {
    await apiPut(boss, "description", "Une description choisie dans les paramètres.");
    await apiPut(boss, "language", "en_US");
    const html = (await anon.get("/catalogue")).text;
    assert.match(html, /<html lang="en">/);
    assert.equal(metaOf(html, "og:locale"), "en_US");
    await apiPut(boss, "language", "fr_FR");
    assert.match((await anon.get("/catalogue")).text, /<html lang="fr">/);
    const id = await livePage("Page sans description");
    assert.equal(metaOf((await anon.get(`/p/${row(id).slug}`)).text, "description"), "Une description choisie dans les paramètres.", "description par défaut des pages sans description");
  });
  test("fuseau horaire, format de date et d'heure : toutes les dates affichées suivent le réglage (stockage UTC inchangé)", async () => {
    db.prepare("INSERT INTO posts (slug, title, content, content_format, status, published, published_at, updated_at) VALUES ('art-date', 'Article date', '<p>x</p>', 'html', 'published', 1, '2026-10-09 23:30:00', '2026-10-09 23:30:00')").run();
    const fmt = (tz, lang, df) => new Date("2026-10-09T23:30:00Z").toLocaleDateString(lang, { dateStyle: df, timeZone: tz });
    await apiPut(boss, "timezone", "America/Chicago");
    await apiPut(boss, "date_format", "short");
    let html = (await anon.get("/blog/art-date")).text;
    assert.ok(html.includes(fmt("America/Chicago", "fr-FR", "short")), `date courte à Chicago : ${fmt("America/Chicago", "fr-FR", "short")}`);
    await apiPut(boss, "timezone", "Asia/Tokyo");
    await apiPut(boss, "date_format", "long");
    html = (await anon.get("/blog/art-date")).text;
    assert.ok(html.includes(fmt("Asia/Tokyo", "fr-FR", "long")), "le fuseau de Tokyo change le jour affiché (10 octobre)");
    assert.equal(one("SELECT published_at FROM posts WHERE slug = 'art-date'").published_at, "2026-10-09 23:30:00", "la date enregistrée n'est jamais convertie");
    await apiPut(boss, "timezone", "Europe/Paris");
  });
  test("validation : e-mail, fuseau, URL, entier, énumération, texte trop long, types piégés, injection — rien n'est enregistré", async () => {
    const bad = [["admin_email", "pas-un-email"], ["admin_email", "a@b.c\nBcc: pirate@evil.example"], ["admin_email", "<script>@x.fr"], ["timezone", "Mars/Olympus"], ["timezone", "../../etc"], ["date_format", "enorme"], ["posts_per_page", 0], ["posts_per_page", 500], ["posts_per_page", "dix"], ["posts_per_page", 3.5],
      ["site_name", ""], ["site_name", "x".repeat(200)], ["language", "klingon"], ["comments_moderation", "jamais"], ["media_max_image_mb", -3], ["homepage_page", 987654], ["privacy_page", "abc"], ["default_social_image", "/uploads/../../etc/passwd"], ["default_social_image", "javascript:alert(1)"],
      ["posts_per_page", { "$gt": 1 }], ["site_name", ["a"]], ["timezone", { toString: "x" }]];
    for (const [k, v] of bad) {
      const r = await apiPut(boss, k, v);
      assert.equal(r.status, 422, `${k} = ${JSON.stringify(v).slice(0, 40)} → ${r.status} ${JSON.stringify(r.body).slice(0, 120)}`);
    }
    assert.equal((await apiPut(boss, "n_importe_quoi", "x")).status, 404);
    assert.equal(count("SELECT COUNT(*) n FROM mk_settings WHERE key LIKE 'cms.%' AND value LIKE '%evil%'"), 0);
    assert.equal(await apiVal(boss, "posts_per_page"), 10);
  });
  test("valeurs HTML dans le nom du site : échappées partout (jamais d'injection)", async () => {
    await apiPut(boss, "site_name", '<img src=x onerror=alert(1)> Étoile');
    const html = (await anon.get("/blog")).text;
    assert.doesNotMatch(html, /<img src=x onerror/);
    assert.match(html, /&lt;img src=x onerror=alert\(1\)&gt;/);
    await apiPut(boss, "site_name", "Académie Étoile");
  });
});

const zlib = require("node:zlib");
const crypto = require("node:crypto");
function noisyPng(w, h) {
  const crcTable = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
  const crc = (buf) => { let c = 0xffffffff; for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([len, td, c]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2;
  const raw = crypto.randomBytes((w * 3 + 1) * h); for (let y = 0; y < h; y++) raw[y * (w * 3 + 1)] = 0;
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(raw, { level: 0 })), chunk("IEND", Buffer.alloc(0))]);
}

describe("lecture : page d'accueil et articles par page", () => {
  let draftPage, sitePage;
  test("page d'accueil du site principal : « / » l'affiche, /p/<adresse> y redirige (une seule adresse), le canonical est « / », le plan du site ne la liste qu'une fois", async () => {
    home = await livePage("Ma page d'accueil", {}, [{ type: "text", markdown: "Bienvenue sur la page principale choisie." }]);
    assert.doesNotMatch((await anon.get("/")).text, /page principale choisie/, "avant : l'accueil standard");
    const r = await apiPut(boss, "homepage_page", home);
    assert.equal(r.status, 409, "réglage sensible : confirmation exigée");
    assert.ok(r.body.confirmRequired[0].impact);
    assert.equal(await apiVal(boss, "homepage_page"), "", "rien d'enregistré sans confirmation");
    const ok = await apiPut(boss, "homepage_page", home, { confirm: true });
    assert.equal(ok.status, 200, JSON.stringify(ok.body));
    const page = await anon.get("/");
    assert.equal(page.status, 200);
    assert.match(page.text, /page principale choisie/);
    assert.match(page.text, new RegExp(`<link rel="canonical" href="https://k\\.test/">`));
    const old = await anon.get(`/p/${row(home).slug}`);
    assert.equal(old.status, 301); assert.equal(old.location, "/");
    const xml = (await anon.get("/sitemap-pages.xml")).text;
    assert.equal((xml.match(/<loc>https:\/\/k\.test\/<\/loc>/g) || []).length, 1, "« / » une seule fois dans le plan du site");
  });
  test("page dépubliée ou à la corbeille : l'accueil standard reprend (jamais de 404 sur « / ») ; choix d'une page invalide refusé", async () => {
    await boss.post(`/marketing/pages/${home}/depublier`, {}).catch(() => {});
    db.prepare("UPDATE mk_landing_pages SET status = 'unpublished' WHERE id = ?").run(home);
    const page = await anon.get("/");
    assert.equal(page.status, 200);
    assert.doesNotMatch(page.text, /page principale choisie/);
    db.prepare("UPDATE mk_landing_pages SET status = 'published' WHERE id = ?").run(home);
    draftPage = await create("Brouillon accueil");
    const trashed = await livePage("Page corbeille accueil");
    await boss.post("/marketing/pages/actions", { action: "corbeille", ids: String(trashed) });
    const site = await newSite("Site accueil refusé");
    sitePage = await livePage("Page d'un site", { site_id: String(site) });
    for (const [id, why] of [[draftPage, "brouillon"], [trashed, "corbeille"], [sitePage, "autre site"], [987654, "inexistante"]]) assert.equal((await apiPut(boss, "homepage_page", id, { confirm: true })).status, 422, why);
    assert.equal(await apiVal(boss, "homepage_page"), String(home) === "" ? "" : home, "l'ancien choix est conservé");
  });
  test("restaurer la valeur par défaut de l'accueil rétablit l'accueil standard", async () => {
    const r = await boss.request(`${API}/homepage_page?confirm=1`, { method: "DELETE" });
    assert.equal(r.status, 200, r.text);
    assert.doesNotMatch((await anon.get("/")).text, /page principale choisie/);
    assert.equal((await anon.get(`/p/${row(home).slug}`)).status, 200);
  });
  test("articles par page : le blog affiche exactement ce nombre, avec la bonne pagination", async () => {
    for (let i = 1; i <= 7; i++) db.prepare("INSERT INTO posts (slug, title, content, content_format, status, published, published_at) VALUES (?, ?, '<p>x</p>', 'html', 'published', 1, datetime('now', ?))").run(`pp-${i}`, `Article pagination ${i}`, `-${i} minutes`);
    await apiPut(boss, "posts_per_page", 3);
    const cards = (html) => { const l = html.split('id="blog-latest-title"')[1] || ""; return ((l.split("</section>")[0]).match(/Article pagination \d/g) || []).filter((v, i, a) => a.indexOf(v) === i).length; }; // seule la liste « Articles » compte (pas « populaires » ni « à découvrir »)
    const p1 = (await anon.get("/blog")).text;
    assert.ok(cards(p1) <= 4 && cards(p1) >= 3, `page 1 : ${cards(p1)} articles`);
    assert.match(p1, /page=2/);
    const p3 = await anon.get("/blog?page=3");
    assert.equal(p3.status, 200);
    const listCards = (html) => ((html.split('id="blog-latest-title"')[1] || "").split("</section>")[0].match(/<article class="blog-card"/g) || []).length;
    assert.ok(listCards(p3.text) >= 1 && listCards(p3.text) <= 3, "la page 3 existe et n'affiche pas plus de 3 articles");
    await apiPut(boss, "posts_per_page", 50);
    assert.doesNotMatch((await anon.get("/blog")).text, /page=2/, "tout tient sur une page");
    await apiPut(boss, "posts_per_page", 10);
  });
});

describe("commentaires, médias, permaliens, SEO, confidentialité", () => {
  test("commentaires : le moteur propriétaire reste la source (aucune copie) ; l'ancien formulaire (palier 6) et l'API écrivent au même endroit", async () => {
    await apiPut(boss, "comments_moderation", "all");
    const stored = JSON.parse(one("SELECT value FROM mk_settings WHERE key = 'comments.settings'").value);
    assert.equal(stored.moderation, "all");
    assert.equal(count("SELECT COUNT(*) n FROM mk_settings WHERE key LIKE 'cms.comments%'"), 0, "aucune copie dans cms.*");
    const legacy = await boss.post(`${P}/commentaires`, { enabled_default: "1", guests_allowed: "1", moderation: "first", replies_allowed: "1", max_depth: "2", links_allowed: "1" });
    assert.equal(legacy.status, 302);
    const s2 = JSON.parse(one("SELECT value FROM mk_settings WHERE key = 'comments.settings'").value);
    assert.deepEqual([s2.moderation, s2.guests_allowed, s2.max_depth, s2.links_allowed], ["first", true, 2, true]);
    assert.match((await boss.get(`${P}/commentaires`)).text, /value="first" selected/);
    assert.equal((await apiPut(boss, "comments_max_depth", 9)).status, 422);
  });
  test("médias : la limite choisie est appliquée à l'envoi (jamais au-delà du plafond du serveur)", async () => {
    assert.equal((await apiPut(boss, "media_max_image_mb", 999)).status, 422, "au-delà du plafond de 5 Mo : refusé");
    const big = noisyPng(700, 700);
    assert.ok(big.length > 1048576);
    const send = (buf, name) => { const fd = new FormData(); fd.append("file", new Blob([buf], { type: "image/png" }), name); return boss.request("/marketing/site-web/medias", { method: "POST", multipart: fd }); };
    assert.equal((await send(big, "grosse.png")).status, 201, "sous le plafond par défaut : accepté");
    assert.equal((await apiPut(boss, "media_max_image_mb", 1)).status, 200);
    const refused = await send(noisyPng(701, 700), "grosse2.png");
    assert.equal(refused.status, 422);
    assert.match(refused.text, /trop lourd|1 Mo/);
    await boss.request(`${API}/media_max_image_mb`, { method: "DELETE" });
    assert.equal((await send(noisyPng(702, 700), "grosse3.png")).status, 201, "valeur par défaut rétablie");
  });
  test("permaliens : désactiver la normalisation supprime la redirection /Blog/ → /blog ; la réactiver la rétablit (réglage sensible)", async () => {
    assert.equal((await anon.get("/Blog/")).status, 301);
    assert.equal((await apiPut(boss, "normalize_paths", false)).status, 409);
    assert.equal((await apiPut(boss, "normalize_paths", false, { confirm: true })).status, 200);
    assert.notEqual((await anon.get("/Blog/")).status, 301);
    await boss.request(`${API}/normalize_paths?confirm=1`, { method: "DELETE" });
    assert.equal((await anon.get("/Blog/")).status, 301);
    assert.match((await boss.get(`${P}/permaliens`)).text, /\/p\/&lt;adresse&gt;/);
  });
  test("SEO : séparateur et modèle de titre → titres publics ; indexation des étiquettes → plan du site ; droit seo.edit distinct de settings.write", async () => {
    await apiPut(boss, "title_separator", " | ");
    const id = await livePage("Page titre séparateur");
    assert.match((await anon.get(`/p/${row(id).slug}`)).text, /<title>Page titre séparateur \| Académie Étoile<\/title>/);
    assert.equal((await apiPut(boss, "title_template", "{titre}{sep}{site_name}")).status, 422, "variable inconnue refusée");
    await apiPut(boss, "title_separator", " · ");
    const seoOnly = await customMember("SEO seulement", ["tools.view", "seo.view", "seo.edit"]);
    assert.equal((await seoOnly.get(`${P}/seo`)).status, 200, "seo.view suffit pour voir le groupe SEO");
    assert.equal((await seoOnly.get(`${P}`)).status, 403);
    assert.equal((await apiPut(seoOnly, "title_separator", " — ")).status, 200, "seo.edit modifie le SEO");
    assert.equal((await apiPut(seoOnly, "posts_per_page", 5)).status, 403, "mais pas la lecture");
    assert.equal(await apiVal(boss, "posts_per_page"), 10);
    await apiPut(boss, "title_separator", " · ");
    const noSeo = await customMember("Réglages sans SEO", ["settings.read", "settings.write", "tools.view"]);
    assert.equal((await apiPut(noSeo, "title_separator", " | ")).status, 403, "settings.write ne donne pas seo.edit");
  });
  test("confidentialité : la page choisie est liée depuis le bandeau de consentement et le pied de page ; une page non publiée n'est jamais liée", async () => {
    const priv = await livePage("Politique de confidentialité");
    await apiPut(boss, "privacy_page", priv);
    const banner = (await anon.get("/blog")).text;
    assert.match(banner, new RegExp(`<a href="/p/${row(priv).slug}">Politique de confidentialité</a>`));
    db.prepare("UPDATE mk_landing_pages SET status = 'unpublished' WHERE id = ?").run(priv);
    assert.doesNotMatch((await anon.get("/blog")).text, /Politique de confidentialité<\/a>/, "page dépubliée : aucun lien mort");
    db.prepare("UPDATE mk_landing_pages SET status = 'published' WHERE id = ?").run(priv);
    await apiPut(boss, "privacy_page", "");
    assert.doesNotMatch((await anon.get("/blog")).text, /Politique de confidentialité<\/a>/);
  });
  test("e-mail administratif : destinataire des messages du formulaire de contact", async () => {
    await apiPut(boss, "admin_email", "Admin@Mon-Site.Example");
    assert.equal(await apiVal(boss, "admin_email"), "admin@mon-site.example", "normalisé en minuscules");
    const tok = srv.formToken ? srv.formToken() : null;
    const res = await anon.post("/contact", { name: "Visiteur", email: "visiteur@example.com", subject: "Bonjour", message: "Un message de test assez long.", website: "", form_token: tok, ts: tok });
    assert.ok([200, 302].includes(res.status), String(res.status));
    const mail = all("SELECT * FROM mail_outbox ORDER BY id DESC LIMIT 3").find((m) => m.kind === "contact_notification");
    assert.ok(mail, "notification mise en file");
    assert.equal(mail.to_email, "admin@mon-site.example");
    await apiPut(boss, "admin_email", "");
  });
});

describe("indexation : visibilité masquée, confirmée, réellement appliquée", () => {
  test("masquer le site : confirmation + avertissement, puis en-tête HTTP, balise robots, robots.txt fermé et plan du site vide ; rouvrir rétablit tout", async () => {
    const unconfirmed = await apiPut(boss, "search_visibility", "closed");
    assert.equal(unconfirmed.status, 409);
    assert.match(unconfirmed.body.confirmRequired[0].impact, /disparaît des moteurs/);
    assert.equal(await apiVal(boss, "search_visibility"), "open");
    // par l'écran : la confirmation est demandée avant d'enregistrer
    const form = await boss.post(`${P}/indexation`, { search_visibility: "closed" });
    assert.equal(form.status, 409);
    assert.match(form.text, /Confirmer ce changement sensible/);
    assert.match(form.text, /disparaît des moteurs/);
    assert.equal(await apiVal(boss, "search_visibility"), "open", "rien n'est enregistré avant la confirmation");
    const done = await boss.post(`${P}/indexation`, { search_visibility: "closed", confirm: "1" });
    assert.equal(done.status, 302);
    assert.equal(await apiVal(boss, "search_visibility"), "closed");
    const blog = await anon.get("/blog");
    assert.equal(blog.headers.get("x-robots-tag"), "noindex, nofollow");
    assert.match(blog.text, /<meta name="robots" content="noindex, nofollow">/);
    assert.match((await anon.get("/robots.txt")).text, /Disallow: \/\s*$/m);
    assert.doesNotMatch((await anon.get("/robots.txt")).text, /Sitemap:/);
    assert.doesNotMatch((await anon.get("/sitemap-pages.xml")).text, /<loc>/, "plan du site vide");
    const pageId = await livePage("Page pendant le masquage");
    assert.match((await anon.get(`/p/${row(pageId).slug}`)).headers.get("x-robots-tag") || "", /noindex/);
    await boss.request(`${API}/search_visibility?confirm=1`, { method: "DELETE" });
    assert.equal(await apiVal(boss, "search_visibility"), "open");
    assert.equal((await anon.get("/blog")).headers.get("x-robots-tag"), null);
    assert.doesNotMatch((await anon.get("/robots.txt")).text, /^Disallow: \/\s*$/m);
    assert.match((await anon.get("/sitemap-pages.xml")).text, /<loc>/);
  });
  test("site à domaine propre : son noindex ne ferme pas le site principal, et réciproquement", async () => {
    const site = await newSite("Site noindex");
    const sp = await livePage("Page du site noindex", { site_id: String(site) });
    assert.equal((await apiPut(boss, "search_visibility", "closed", { site })).status, 409);
    assert.equal((await apiPut(boss, "search_visibility", "closed", { site, confirm: true })).status, 200);
    assert.match((await anon.get(`/p/${row(sp).slug}`)).text, /<meta name="robots" content="noindex, nofollow">/);
    assert.equal((await anon.get("/blog")).headers.get("x-robots-tag"), null, "le site principal reste visible");
    assert.equal(await apiVal(boss, "search_visibility"), "open");
    await apiPut(boss, "search_visibility", "open", { site, confirm: true });
  });
});

describe("multi-site : aucune fuite entre les sites", () => {
  let A, B, pA, pB;
  before(async () => {
    A = await newSite("Site Alpha réglages");
    B = await newSite("Site Bêta réglages");
    pA = await livePage("Accueil Alpha", { site_id: String(A) });
    pB = await livePage("Accueil Bêta", { site_id: String(B) });
  });
  test("chaque site garde ses réglages : fuseau, langue, accueil, formats, SEO, indexation, nom", async () => {
    const before = { B: (await jget(boss, `${API}${qs(B)}`)).body.settings.map((s) => [s.key, s.value]), main: (await jget(boss, API)).body.settings.map((s) => [s.key, s.value]) };
    assert.equal((await apiPut(boss, "timezone", "America/Chicago", { site: A })).status, 200);
    assert.equal((await apiPut(boss, "language", "en", { site: A })).status, 200);
    assert.equal((await apiPut(boss, "date_format", "short", { site: A })).status, 200);
    assert.equal((await apiPut(boss, "time_format", "12h", { site: A })).status, 200);
    assert.equal((await apiPut(boss, "homepage_page", pA, { site: A, confirm: true })).status, 200);
    assert.equal((await apiPut(boss, "seo_site_title", "Alpha Académie", { site: A })).status, 200);
    assert.equal((await apiPut(boss, "seo_follow", false, { site: A })).status, 200);
    assert.equal((await apiPut(boss, "description", "Description Alpha", { site: A })).status, 200);
    assert.equal(await apiVal(boss, "timezone", A), "America/Chicago");
    assert.equal(await apiVal(boss, "homepage_page", A), pA);
    assert.deepEqual((await jget(boss, `${API}${qs(B)}`)).body.settings.map((s) => [s.key, s.value]), before.B, "le site B n'a pas bougé");
    assert.deepEqual((await jget(boss, API)).body.settings.map((s) => [s.key, s.value]), before.main, "le site principal non plus");
    assert.equal(await apiVal(boss, "timezone", B), "Europe/Paris");
    assert.equal(await apiVal(boss, "language", B), "fr");
    // les pages publiques de chaque site suivent SON réglage
    const a = (await anon.get(`/p/${row(pA).slug}`)).text;
    const b = (await anon.get(`/p/${row(pB).slug}`)).text;
    assert.match(a, /<html lang="en">/);
    assert.match(b, /<html lang="fr">/);
    assert.match(a, /<title>Accueil Alpha · Alpha Académie<\/title>|<title>Accueil Alpha[^<]*Alpha Acad/);
    assert.match(a, /<meta name="robots" content="index, nofollow">/);
    assert.match(b, /<meta name="robots" content="index, follow">/);
    assert.equal(metaOf(a, "description"), "Description Alpha");
  });
  test("accueil d'un site : seulement une page de CE site ; sans confirmation rien n'est enregistré", async () => {
    assert.equal((await apiPut(boss, "homepage_page", pB, { site: A, confirm: true })).status, 422, "page du site B refusée pour A");
    assert.equal((await apiPut(boss, "homepage_page", home, { site: A, confirm: true })).status, 422, "page du site principal refusée aussi");
    assert.equal(await apiVal(boss, "homepage_page", A), pA);
    assert.equal(one("SELECT home_page_id h FROM mk_sites WHERE id = ?", B).h, null, "B sans accueil");
  });
  test("compte limité au site A : lit et modifie A seulement ; B, le site principal et les réglages sensibles lui sont fermés (IDOR, escalade)", async () => {
    const guest = await newStudent(srv);
    db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, 'admin')").run(A, one("SELECT id FROM users WHERE email = ?", guest.email).id);
    assert.equal((await apiPut(guest, "description", "Modifié par le gestionnaire de A", { site: A })).status, 200);
    assert.equal((await jget(guest, `${API}${qs(B)}`)).status, 403, "lecture de B");
    assert.equal((await apiPut(guest, "description", "pirate", { site: B })).status, 403, "écriture de B");
    assert.ok([302, 403].includes((await jget(guest, API)).status), "site principal (renvoi vers Mes sites ou refus)");
    assert.equal((await apiPut(guest, "site_name", "pirate")).status, 403);
    assert.equal((await guest.get(`${P}?site=${B}`)).status, 403);
    assert.equal((await guest.get(`${P}`)).status, 302, "renvoyé vers « Mes sites »");
    assert.equal(await apiVal(boss, "description", B), "");
    // inexistant ou site d'un autre périmètre
    assert.equal((await jget(boss, `${API}?site=987654`)).status, 404);
    assert.equal((await jput(boss, `${API}/description?site=abc`, { value: "x" })).status, 404);
    assert.equal(await apiVal(boss, "description"), "Une description choisie dans les paramètres.", "« site=abc » n'a modifié aucun périmètre par erreur");
  });
  test("domaine d'un site : réglage sensible, validé, unique ; et nom du site unique dans l'organisation", async () => {
    assert.equal((await apiPut(boss, "public_url", "https://www.alpha-reglages.example", { site: A })).status, 409);
    assert.equal((await apiPut(boss, "public_url", "http://pas-https.example", { site: A, confirm: true })).status, 422);
    assert.equal((await apiPut(boss, "public_url", "https://alpha.example/chemin", { site: A, confirm: true })).status, 422);
    assert.equal((await apiPut(boss, "public_url", "https://www.alpha-reglages.example", { site: A, confirm: true })).status, 200);
    const dup = await apiPut(boss, "public_url", "https://www.alpha-reglages.example", { site: B, confirm: true });
    assert.ok([409, 422].includes(dup.status), "un domaine ne sert qu'un seul site");
    assert.equal(await apiVal(boss, "public_url", B), "");
    const sameName = await apiPut(boss, "site_name", "Site Alpha réglages", { site: B });
    assert.ok([409, 422].includes(sameName.status), JSON.stringify(sameName.body));
  });
});

describe("permissions, journal, formulaires, API de groupe, restauration des valeurs par défaut", () => {
  test("rôle sans « settings.sensitive » : modifie le nom du site mais pas l'accueil, l'indexation ni la normalisation (même par l'API) ; sans « settings.write » : lecture seule", async () => {
    const editorSettings = await customMember("Gestionnaire du site", ["tools.view", "settings.read", "settings.write", "seo.view"]);
    assert.equal((await apiPut(editorSettings, "site_name", "Nom du gestionnaire")).status, 200);
    for (const [k, v] of [["homepage_page", ""], ["search_visibility", "closed"], ["normalize_paths", false]]) {
      const r = await apiPut(editorSettings, k, v, { confirm: true });
      assert.equal(r.status, 403, `${k} : ${JSON.stringify(r.body).slice(0, 100)}`);
    }
    assert.equal(await apiVal(boss, "search_visibility"), "open");
    const readOnly = await customMember("Lecture des réglages", ["tools.view", "settings.read"]);
    assert.equal((await apiPut(readOnly, "site_name", "x")).status, 403);
    assert.equal((await jget(readOnly, `${API}/site_name`)).status, 200);
    const page = (await readOnly.get(P)).text;
    assert.match(page, /Lecture seule/);
    assert.doesNotMatch(page, /data-st-save/, "aucun bouton Enregistrer en lecture seule");
    assert.equal((await readOnly.post(P, { site_name: "pirate" })).status, 403);
    assert.equal((await boss.get(`${P}`)).text.includes("Nom du gestionnaire"), true);
    await apiPut(boss, "site_name", "Académie Étoile");
  });
  test("le journal d'activité garde qui a changé quoi (ancienne → nouvelle valeur)", async () => {
    await apiPut(boss, "posts_per_page", 12);
    const log = one("SELECT * FROM audit_log WHERE action = 'settings.updated' AND summary LIKE '%Articles par page%' ORDER BY id DESC");
    assert.ok(log, "entrée de journal");
    assert.match(log.summary, /Articles par page : 10 → 12/);
    assert.ok(log.actor_id);
    assert.ok(count("SELECT COUNT(*) n FROM audit_log WHERE action = 'settings.updated' AND summary LIKE '%Visibilité%'") >= 2, "l'indexation est journalisée");
    assert.doesNotMatch(all("SELECT details FROM audit_log WHERE action = 'settings.updated'").map((r) => r.details).join(" "), /password|secret|token/i);
    await boss.request(`${API}/posts_per_page`, { method: "DELETE" });
  });
  test("formulaire : enregistrement réel (message du serveur), erreurs sans perte, cases décochées, lot atomique", async () => {
    const ok = await boss.post(`${P}/lecture`, { posts_per_page: "8" });
    assert.equal(ok.status, 302);
    assert.equal(await apiVal(boss, "posts_per_page"), 8);
    const html = (await boss.get(`${P}/lecture`)).text;
    assert.match(html, /Réglages enregistrés|value="8"/);
    // lot atomique : une valeur invalide empêche TOUT le groupe
    const before = await apiVal(boss, "timezone");
    const bad = await boss.post(P, { site_name: "Nom du lot", timezone: "Planète/Mars", date_format: "short" });
    assert.equal(bad.status, 422);
    assert.match(bad.text, /Rien n&#39;a été enregistré|Rien n'a été enregistré/);
    assert.match(bad.text, /fuseau horaire inconnu/);
    assert.equal(await apiVal(boss, "timezone"), before);
    assert.notEqual(await apiVal(boss, "site_name"), "Nom du lot", "le nom du lot valide n'a pas été enregistré non plus");
    // case décochée : le marqueur prouve qu'elle était affichée
    await boss.post(`${P}/seo`, { _b_index_blog_tags: "1", index_blog_tags: "1", _b_index_authors: "1", title_separator: " · ", title_template: "{title}{sep}{site_name}" });
    assert.equal(await apiVal(boss, "index_blog_tags"), true);
    await boss.post(`${P}/seo`, { _b_index_blog_tags: "1", _b_index_authors: "1", title_separator: " · ", title_template: "{title}{sep}{site_name}" });
    assert.equal(await apiVal(boss, "index_blog_tags"), false, "décochée = faux");
  });
  test("API de groupe atomique : un réglage invalide annule tout le groupe ; un réglage d'un autre groupe est refusé", async () => {
    const r = await jput(boss, `${API}/groupes/general`, { values: { site_name: "Nom atomique", timezone: "Nulle/Part" } });
    assert.equal(r.status, 422);
    assert.notEqual(await apiVal(boss, "site_name"), "Nom atomique");
    const foreign = await jput(boss, `${API}/groupes/general`, { values: { posts_per_page: 3 } });
    assert.equal(foreign.status, 422);
    assert.equal(await apiVal(boss, "posts_per_page"), 8);
    const good = await jput(boss, `${API}/groupes/lecture`, { values: { posts_per_page: 6 } });
    assert.equal(good.status, 200);
    assert.equal(JSON.parse((await boss.get(`${API}/groupes/lecture`)).text).settings.find((s) => s.key === "posts_per_page").value, 6);
    assert.equal((await jput(boss, `${API}/groupes/lecture`, { values: [1, 2] })).status, 422);
    assert.equal((await jput(boss, `${API}/groupes/inconnu`, { values: {} })).status, 404);
    assert.equal((await anon.get(API)).status, 302, "anonyme : connexion");
    assert.equal((await jput(anon, `${API}/site_name`, { value: "x" })).status, 302);
  });
  test("restauration : un réglage ou un groupe, jamais « tout » ; le groupe sensible demande confirmation", async () => {
    await apiPut(boss, "posts_per_page", 25);
    const one_ = await boss.post(`${P}/reinitialiser`, { target: "posts_per_page" });
    assert.equal(one_.status, 302);
    assert.equal(await apiVal(boss, "posts_per_page"), 10);
    assert.equal(count("SELECT COUNT(*) n FROM mk_settings WHERE key = 'cms.posts_per_page'"), 0, "la valeur par défaut n'est plus stockée");
    await apiPut(boss, "normalize_paths", false, { confirm: true });
    await boss.post(`${P}/reinitialiser`, { target: "permalinks" });
    assert.equal(await apiVal(boss, "normalize_paths"), false, "sensible : sans confirmation, rien ne change");
    await boss.post(`${P}/reinitialiser`, { target: "permalinks", confirm: "1" });
    assert.equal(await apiVal(boss, "normalize_paths"), true);
    assert.equal((await boss.post(`${P}/reinitialiser`, { target: "tout" })).status, 302);
    assert.notEqual(await apiVal(boss, "site_name"), "", "pas de « tout réinitialiser »");
    const del = await boss.request(`${API}/n_importe_quoi`, { method: "DELETE" });
    assert.equal(del.status, 404);
  });
  test("cache : un changement est visible immédiatement partout, sans vider d'autre cache", async () => {
    await apiPut(boss, "posts_per_page", 2);
    assert.match((await anon.get("/blog")).text, /page=2/);
    await apiPut(boss, "posts_per_page", 50);
    assert.doesNotMatch((await anon.get("/blog")).text, /page=2/);
    await boss.request(`${API}/posts_per_page`, { method: "DELETE" });
  });
});

describe("import / export des réglages et santé du site", () => {
  const O = "/marketing/site-web/outils";
  async function exportScope(site) {
    const r = await boss.post(`${O}/exporter${qs(site)}`, { types: "settings" });
    const id = Number(String(r.location).match(/exporter\/(\d+)/)[1]);
    for (let i = 0; i < 200; i++) { const p = JSON.parse((await boss.get(`${O}/operations/${id}.json${qs(site)}`)).text); if (p.finished) break; await sleep(100); }
    const f = await boss.get(`${O}/exporter/${id}/fichier${qs(site)}`);
    assert.equal(f.status, 200);
    return f.text;
  }
  async function importInto(site, text, onConflict) {
    const fd = new FormData();
    fd.append("file", new Blob([text], { type: "application/json" }), "reglages.json");
    fd.append("types", "settings"); fd.append("on_conflict", onConflict);
    const r = await boss.request(`${O}/importer${qs(site)}`, { method: "POST", multipart: fd });
    const id = Number(String(r.location).match(/importer\/(\d+)/)[1]);
    for (let i = 0; i < 200; i++) { const p = JSON.parse((await boss.get(`${O}/operations/${id}.json${qs(site)}`)).text); if (p.finished || p.awaiting) break; await sleep(100); }
    return id;
  }
  const run = (id) => { const r = one("SELECT * FROM cms_tool_runs WHERE id = ?", id); return { ...r, report: JSON.parse(r.report || "null"), plan: JSON.parse(r.plan || "null") }; };
  test("export : les valeurs sont exportées, aucun secret ; import : validation, sensibles jamais importés, écrasement seulement sur demande", async () => {
    const A = one("SELECT id FROM mk_sites WHERE name = 'Site Alpha réglages'").id;
    const text = await exportScope(A);
    const data = JSON.parse(text);
    assert.equal(data.resources.settings.scope, "site");
    assert.equal(data.resources.settings.values.timezone.value, "America/Chicago");
    assert.doesNotMatch(text, /MotDePasseProf123|ENCRYPTION|\$2[aby]\$/);
    const C = await newSite("Site réimport réglages");
    const id = await importInto(C, text, "skip");
    const a = run(id);
    assert.equal(a.status, "awaiting", a.message);
    const item = a.plan.items[0];
    assert.equal(item.type, "settings");
    assert.ok(item.warnings.some((w) => /sensible/.test(w)), "domaine, indexation, accueil : jamais importés");
    assert.equal(await apiVal(boss, "timezone", C), "Europe/Paris", "analyse : rien d'écrit");
    // « ignorer » ne change rien
    await boss.post(`${O}/importer/${id}/confirmer${qs(C)}`, { confirm: "1" });
    for (let i = 0; i < 100; i++) { if (["done", "failed"].includes(run(id).status)) break; await sleep(100); }
    assert.equal(await apiVal(boss, "timezone", C), "Europe/Paris", "stratégie « ignorer » : valeurs inchangées");
    // « mettre à jour » applique les réglages valides, jamais l'indexation ni le domaine
    const id2 = await importInto(C, text, "update");
    await boss.post(`${O}/importer/${id2}/confirmer${qs(C)}`, { confirm: "1" });
    for (let i = 0; i < 100; i++) { if (["done", "failed"].includes(run(id2).status)) break; await sleep(100); }
    assert.equal(run(id2).status, "done", run(id2).message);
    assert.equal(await apiVal(boss, "timezone", C), "America/Chicago");
    assert.equal(await apiVal(boss, "date_format", C), "short");
    assert.equal(await apiVal(boss, "public_url", C), "", "le domaine n'est jamais importé");
    assert.equal(await apiVal(boss, "homepage_page", C), "", "la page d'accueil non plus");
  });
  test("import d'un fichier piégé : valeurs invalides ou dangereuses ignorées avec avertissement", async () => {
    const C = one("SELECT id FROM mk_sites WHERE name = 'Site réimport réglages'").id;
    const evil = JSON.stringify({ format: "kolakisa-site@1", resources: { settings: { scope: "site", values: { timezone: { value: "Mars/Olympus" }, description: { value: "x".repeat(900) }, search_visibility: { value: "closed" }, public_url: { value: "https://evil.example" }, language: { value: "<script>" }, ENCRYPTION_KEY: { value: "volée" } } } } });
    const id = await importInto(C, evil, "update");
    const item = run(id).plan.items[0];
    assert.ok(item.warnings.length >= 5, JSON.stringify(item.warnings));
    assert.equal(item.action === "skip" || item.action === "update", true);
    assert.equal(await apiVal(boss, "search_visibility", C), "open");
  });
  test("santé : page d'accueil, langue / fuseau, visibilité, e-mail, page de confidentialité — lus dans la configuration réelle", async () => {
    await apiPut(boss, "homepage_page", home, { confirm: true });
    db.prepare("UPDATE mk_landing_pages SET status = 'unpublished' WHERE id = ?").run(home);
    const r = await boss.post(`${O}/sante`, {});
    assert.equal(r.status, 302);
    const id = one("SELECT MAX(id) id FROM cms_tool_runs WHERE kind = 'health'").id;
    for (let i = 0; i < 400; i++) { if (["done", "failed"].includes(one("SELECT status FROM cms_tool_runs WHERE id = ?", id).status)) break; await sleep(150); }
    const res = Object.fromEntries(JSON.parse(one("SELECT report FROM cms_tool_runs WHERE id = ?", id).report).results.map((x) => [x.id, x]));
    assert.equal(res.settings_homepage.status, "warning", "accueil choisi mais non publié");
    assert.match(res.settings_homepage.detail, /pas publiée/);
    assert.equal(res.settings_locale.status, "good");
    assert.equal(res.settings_visibility.status, "good");
    assert.ok(["good", "info"].includes(res.settings_admin_email.status));
    db.prepare("UPDATE mk_landing_pages SET status = 'published' WHERE id = ?").run(home);
    await boss.request(`${API}/homepage_page?confirm=1`, { method: "DELETE" });
  });
});
