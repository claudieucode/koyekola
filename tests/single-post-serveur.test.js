// Publication unique sur un VRAI serveur : réglages publiés (enregistrés directement en base : l'écran d'édition n'existe plus) → page publique réelle ; isolation entre sites.
const { describe, test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, Client, loginInstructor } = require("./helpers");

describe("Publication unique : des réglages publiés à la page publique", () => {
  let srv, boss, db, A, B, orgId;
  const spLib = require("../src/services/singlePost");
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const page = async (slug, path = "") => (await new Client(srv.base).get(`/blog/${slug}${path}`)).text;
  const idx = (html, s) => html.indexOf(s);
  // Enregistre directement des réglages « publiés » (clés pointées « singlePost.… » ou « settings.singlePost.… ») : principal → appearance_configs, site → mk_sites.settings
  const publish = async (site, changes) => {
    const cur = site ? ((JSON.parse(one("SELECT settings FROM mk_sites WHERE id = ?", site).settings || "{}").singlePost) || null) : (one("SELECT published FROM appearance_configs WHERE site_id IS NULL") ? JSON.parse(one("SELECT published FROM appearance_configs WHERE site_id IS NULL").published).singlePost : null);
    const obj = spLib.normalize(cur, { strict: false });
    for (const [k, v] of Object.entries(changes)) spLib.set(obj, k.replace(/^(settings\.)?singlePost\./, ""), v);
    const stored = spLib.compact(obj, { strict: true });
    if (site) {
      const st = JSON.parse(one("SELECT settings FROM mk_sites WHERE id = ?", site).settings || "{}"); st.singlePost = stored;
      db.prepare("UPDATE mk_sites SET settings = ? WHERE id = ?").run(JSON.stringify(st), site);
    } else {
      const row = one("SELECT published FROM appearance_configs WHERE site_id IS NULL"); const pub = row && row.published ? JSON.parse(row.published) : {}; pub.singlePost = stored;
      db.prepare("INSERT INTO appearance_configs (site_id, published) VALUES (NULL, ?) ON CONFLICT (COALESCE(site_id, 0)) DO UPDATE SET published = excluded.published").run(JSON.stringify(pub));
    }
  };
  const PRE = "singlePost.";

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "", ALLOW_INDEXING: "1" });
    boss = await loginInstructor(srv); db = srv.db();
    orgId = one("SELECT id FROM mk_organizations").id;
    const site = (n) => Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, ?, ?, '{}')").run(orgId, n, n.toLowerCase()).lastInsertRowid);
    A = site("Alpha"); B = site("Beta");
    const ins = (slug, title, cat, tags, at, content) => db.prepare("INSERT INTO posts (slug, title, content, content_format, category, tags, published, published_at, status, comments_enabled) VALUES (?, ?, ?, 'html', ?, ?, 1, ?, 'published', 1)").run(slug, title, content, cat, tags, at);
    ins("ancien", "Article ancien", "SEO", "a", "2026-01-01 10:00:00", "<p>Ancien.</p>");
    ins("central", "Article central", "SEO", "a,b", "2026-02-01 10:00:00", `<p>${"mot ".repeat(650)}</p><img src="/uploads/x.png" alt="x" width="600" height="300">`);
    ins("recent", "Article récent", "SEO", "b", "2026-03-01 10:00:00", "<p>Récent.</p>");
    ins("hors-sujet", "Hors sujet", "Cuisine", "z", "2026-03-02 10:00:00", "<p>Autre.</p>");
  });
  after(() => { db.close(); return srv.stop(); });

  test("sans réglage : page d'origine (titre unique, temps de lecture réel, colonne, commentaires, navigation, similaires)", async () => {
    const html = await page("central");
    assert.equal((html.match(/<h1\b/g) || []).length, 1);
    assert.match(html, /class="[^"]*sp-page[^"]*"/);
    assert.match(html, /data-sp-sidebar="default"/);
    assert.match(html, /4 min de lecture/); // 650 mots / 200 par minute, arrondi au-dessus (3,25 → 4)
    assert.match(html, /class="article-right sp-sidebar"/);
    assert.match(html, /id="commentaires"/);
    assert.match(html, /href="\/blog\/ancien" rel="prev"/);
    assert.match(html, /href="\/blog\/recent" rel="next"/);
    assert.match(html, /Vous pourriez également aimer/);
    assert.doesNotMatch(html, /Hors sujet/.source.replace(/\\/g, "") && /post-card-body[\s\S]*?Hors sujet/); // pas de correspondance → pas de hors-sujet en similaire
    assert.ok(!/data-sp-autoload="1"/.test(html));
  });

  test("une valeur invalide est refusée par le moteur de réglages (message clair), rien n'est enregistré", () => {
    const bad = (path, v) => { const o = spLib.normalize(null, { strict: false }); spLib.set(o, path, v); return () => spLib.compact(o, { strict: true }); };
    assert.throws(bad("sidebar.layout", "diagonale"), /choix inconnu/);
    assert.throws(bad("content.widthPx", 99999));
    assert.equal(one("SELECT COUNT(*) n FROM appearance_configs WHERE published LIKE '%singlePost%' AND published NOT LIKE '%\"singlePost\":null%'").n, 0);
  });

  test("publication : structure, ordre des éléments, colonne, commentaires, partage, similaires, navigation sur la page publique", async () => {
    await publish(null, {
      [`${PRE}sidebar.layout`]: "left",
      [`${PRE}container.layout`]: "wide",
      [`${PRE}container.style`]: "open",
      [`${PRE}content.width`]: "custom",
      [`${PRE}content.widthPx`]: 1100,
      [`${PRE}titleArea.items`]: [{ id: "meta", visible: true }, { id: "title", visible: true }, { id: "categories", visible: false }, { id: "excerpt", visible: true }, { id: "breadcrumb", visible: false }, { id: "image", visible: true }],
      [`${PRE}meta.separator`]: "|",
      [`${PRE}readingTime.label`]: "Lecture : {n} min",
      [`${PRE}share.nets.telegram`]: true,
      [`${PRE}share.nets.facebook`]: false,
      [`${PRE}related.title`]: "À lire aussi",
      [`${PRE}related.count`]: 1,
      [`${PRE}postNav.titles`]: false,
      [`${PRE}authorBox.enabled`]: false,
    });
    const html = await page("central");
    assert.match(html, /data-sp-sidebar="left"/);
    assert.match(html, /data-sp-container="wide"/);
    assert.match(html, /data-sp-container-style="open"/);
    assert.match(html, /--sp-content-width:1100px/);
    assert.ok(idx(html, 'class="post-meta article-meta"') < idx(html, 'class="post-title"'), "métadonnées avant le titre");
    assert.doesNotMatch(html, /class="article-category"/);
    assert.doesNotMatch(html, /class="breadcrumb/.source && /sp-breadcrumb/);
    assert.match(html, /Lecture : 4 min/);
    assert.match(html, /t\.me\/share\/url\?url=https%3A%2F%2F[^"]*%2Fblog%2Fcentral/);
    assert.doesNotMatch(html, /facebook\.com\/sharer/);
    assert.match(html, /À lire aussi/);
    assert.equal((html.match(/class="post-card sp-card"/g) || []).length, 1);
    assert.doesNotMatch(html, /sp-authorbox/);
    assert.match(html, /<span class="sr-only">Article ancien<\/span>/); // titres masqués visuellement, restés accessibles
    assert.equal((html.match(/<h1\b/g) || []).length, 1);
    // aucun séparateur orphelin : un « | » n'est jamais en début ou fin de ligne de métadonnées
    const meta = html.match(/<p class="post-meta article-meta">([\s\S]*?)<\/p>/)[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    assert.doesNotMatch(meta, /^\||\|$/);
  });

  test("la configuration publiée est stockée pour le site principal seulement (jamais dans un site)", () => {
    const row = one("SELECT published FROM appearance_configs WHERE site_id IS NULL");
    assert.match(row.published, /"singlePost"/);
    assert.equal(JSON.parse(row.published).singlePost.sidebar.layout, "left");
    for (const id of [A, B]) assert.doesNotMatch(String(one("SELECT settings FROM mk_sites WHERE id = ?", id).settings || ""), /singlePost/);
  });

  test("zone de titre désactivée : titre conservé (invisible) pour le référencement ; article sans image ni auteur : aucun vide", async () => {
    await publish(null, { [`${PRE}titleArea.enabled`]: false });
    const html = await page("ancien");
    assert.equal((html.match(/<h1\b/g) || []).length, 1);
    assert.match(html, /<h1 class="sr-only post-title" data-sp-title-hidden>Article ancien<\/h1>/);
    assert.doesNotMatch(html, /class="article-header sp-header"/);
    assert.doesNotMatch(html, /<figure class="article-cover"/);
    await publish(null, { [`${PRE}titleArea.enabled`]: true });
  });

  test("chargement automatique : désactivé par défaut ; activé → configuration et script, jamais sur le dernier article sans précédent", async () => {
    assert.doesNotMatch(await page("central"), /sp-autoload-config/);
    await publish(null, { [`${PRE}autoload.enabled`]: true, [`${PRE}autoload.max`]: 2 });
    const html = await page("central");
    const cfg = JSON.parse(html.match(/id="sp-autoload-config" type="application\/json">([\s\S]*?)<\/script>/)[1]);
    assert.equal(cfg.max, 2); assert.equal(cfg.prev, "/blog/ancien");
    assert.match(html, /single-post-autoload\.js/);
    assert.doesNotMatch(await page("ancien"), /sp-autoload-config/); // le plus ancien n'a pas de précédent
  });

  test("navigation dans la même catégorie : l'article précédent n'est jamais d'une autre catégorie", async () => {
    await publish(null, { [`${PRE}postNav.mode`]: "category" });
    const html = await page("recent");
    assert.match(html, /href="\/blog\/central" rel="prev"/);
    const nav = html.match(/<nav class="article-pager[\s\S]*?<\/nav>/)[0];
    assert.doesNotMatch(nav, /hors-sujet/); // l'article suivant (plus récent) est d'une autre catégorie : pas de lien « suivant »
    assert.doesNotMatch(nav, /rel="next"/);
  });

  test("site secondaire : ses réglages vont dans SES paramètres, l'autre site et le principal restent intacts", async () => {
    await publish(A, { "settings.singlePost.share.size": 48 });
    assert.equal(JSON.parse(one("SELECT settings FROM mk_sites WHERE id = ?", A).settings).singlePost.share.size, 48);
    assert.doesNotMatch(String(one("SELECT settings FROM mk_sites WHERE id = ?", B).settings || ""), /singlePost/);
    assert.equal(JSON.parse(one("SELECT published FROM appearance_configs WHERE site_id IS NULL").published).singlePost.share.size, 36);
  });

  test("réinitialiser : revenir aux valeurs d'origine ne stocke plus rien", async () => {
    await publish(null, { [`${PRE}sidebar.layout`]: "default", [`${PRE}container.layout`]: "default", [`${PRE}container.style`]: "default", [`${PRE}content.width`]: "default", [`${PRE}content.widthPx`]: 1200, [`${PRE}titleArea.items`]: JSON.parse(JSON.stringify(require("../src/services/singlePost").DEFAULTS.titleArea.items)), [`${PRE}meta.separator`]: "•", [`${PRE}readingTime.label`]: "{n} min de lecture", [`${PRE}share.nets.telegram`]: false, [`${PRE}share.nets.facebook`]: true, [`${PRE}related.title`]: "Vous pourriez également aimer", [`${PRE}related.count`]: 3, [`${PRE}postNav.titles`]: true, [`${PRE}authorBox.enabled`]: true, [`${PRE}autoload.enabled`]: false, [`${PRE}autoload.max`]: 3, [`${PRE}postNav.mode`]: "chronological" });
    assert.equal(JSON.parse(one("SELECT published FROM appearance_configs WHERE site_id IS NULL").published).singlePost, null);
    assert.match(await page("central"), /data-sp-sidebar="default"/);
  });
});
