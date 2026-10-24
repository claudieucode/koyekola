// KOLAKISA CMS — Paramètres → Commentaires : chaque réglage a un EFFET réel sur le site publié (formulaire, statut des commentaires, pagination, avatars, cookies,
// notifications) et reste PROPRE À SON SITE. Vrai serveur, vraie base d'essai, vraies routes ; les règles de modération et de blocage sont appliquées à la soumission réelle.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, Client, loginInstructor, newStudent } = require("./helpers");

describe("réglages des commentaires : effets réels", () => {
  let srv, boss, db, orgId, postId, slug, S, siteSlug;
  const SET = "/marketing/site-web/parametres/commentaires";
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const UA = { "User-Agent": "Mozilla/5.0 (test)" };
  let ipN = 0;
  const ip = () => `10.55.${Math.floor(++ipN / 250)}.${ipN % 250}`;
  // Tous les réglages d'un coup, comme le formulaire : les cases décochées sont absentes (marqueur _b_ présent)
  const BOOLS = ["enabled_default", "guests_allowed", "require_name_email", "close_enabled", "cookie_consent", "replies_allowed", "paginate", "notify_published", "notify_pending", "links_allowed", "show_avatars", "avatar_external"];
  const BASE = { enabled_default: "1", guests_allowed: "1", require_name_email: "1", close_enabled: "", close_days: "14", cookie_consent: "", replies_allowed: "1", max_depth: "3", paginate: "1", per_page: "20", default_page: "first", order: "oldest", notify_published: "", notify_pending: "1", moderation: "none", max_links: "2", mod_keys: "", block_keys: "", links_allowed: "1", show_avatars: "1", avatar_rating: "G", avatar_default: "mystery", avatar_external: "" };
  const form = (over, site) => {
    const v = { ...BASE, ...over }, out = { confirm: "1", ...(site ? { site: String(site) } : {}) };
    for (const [k, val] of Object.entries(v)) { out[`comments_${k}`] = val; if (BOOLS.includes(k)) { out[`_b_comments_${k}`] = "1"; if (!val) delete out[`comments_${k}`]; } }
    return out;
  };
  const save = (over, site) => boss.post(`${SET}${site ? `?site=${site}` : ""}`, form(over, site));
  const post = (s, published = 1, at = "datetime('now')") => Number(db.prepare(`INSERT INTO posts (slug, title, content, content_format, status, published, published_at, comments_enabled) VALUES (?, ?, '<p>Contenu</p>', 'html', 'published', ?, ${at}, 1)`).run(s, `Titre ${s}`, published).lastInsertRowid);
  async function send(body, extra = {}, { client = new Client(srv.base), slug: sl = slug, headers = {} } = {}) {
    await client.get(`/blog/${sl}`);
    return client.post(`/blog/${sl}/commentaires`, { author_name: "Camille", author_email: "camille@example.com", body, form_token: srv.formToken(), ...extra }, { headers: { "x-forwarded-for": ip(), ...UA, ...headers } });
  }
  const row = (b) => one("SELECT * FROM blog_comments WHERE body = ?", b);
  const page = async (sl = slug, qs = "") => (await new Client(srv.base).get(`/blog/${sl}${qs}`)).text;

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "", CONTACT_EMAIL: "equipe@example.com" });
    boss = await loginInstructor(srv); db = srv.db();
    orgId = one("SELECT id FROM mk_organizations").id;
    slug = "article-cm"; postId = post(slug);
  });
  after(() => { db.close(); return srv.stop(); });

  describe("écran et persistance", () => {
    test("six sections, tous les contrôles, aperçus d'avatars locaux ; Gravatar verrouillé tant qu'il n'est pas accepté", async () => {
      const r = await boss.get(SET); assert.equal(r.status, 200);
      for (const f of ["Publication et accès", "Fil de discussion et pagination", "Modération et lutte contre le courrier indésirable", "Notifications par e-mail", "Avatars", "cms-commentaires.js",
        'name="comments_enabled_default"', 'name="comments_guests_allowed"', 'name="comments_require_name_email"', 'name="comments_close_days"', 'name="comments_cookie_consent"', 'name="comments_max_depth"', 'name="comments_per_page"',
        'name="comments_default_page"', 'name="comments_order"', 'name="comments_notify_published"', 'name="comments_notify_pending"', 'name="comments_moderation"', 'name="comments_max_links"', 'name="comments_mod_keys"', 'name="comments_block_keys"',
        'name="comments_show_avatars"', 'name="comments_avatar_rating"', 'name="comments_avatar_default"', "Personne mystère", "Identicon", "Initiales", "Couleur", "Nécessite « Autoriser Gravatar »", "Paramètres → Écriture"]) assert.ok(r.text.includes(f), f);
      assert.match(r.text, /max="10"/, "jusqu'à 10 niveaux");
      assert.doesNotMatch(r.text, /\/avatar\/preview\//, "aucun appel externe tant que Gravatar n'est pas accepté");
    });
    test("chaque réglage est enregistré, rechargé et stocké UNE fois (moteur de commentaires, sans copie)", async () => {
      const mod = "spamdomain.example\n  Bonus  Gratuit \n12.34.56.78\nbonus gratuit";
      const r = await save({ enabled_default: "", guests_allowed: "", require_name_email: "", close_enabled: "1", close_days: "30", cookie_consent: "1", max_depth: "7", per_page: "5", default_page: "last", order: "newest", notify_published: "1", notify_pending: "", moderation: "first", max_links: "0", mod_keys: mod, block_keys: "casino", links_allowed: "", show_avatars: "1", avatar_default: "identicon" });
      assert.equal(r.status, 302, r.text.slice(0, 200));
      const s = JSON.parse(one("SELECT value FROM mk_settings WHERE key = 'comments.settings'").value);
      assert.deepEqual([s.enabled_default, s.guests_allowed, s.require_name_email, s.close_enabled, s.close_days, s.cookie_consent, s.max_depth, s.per_page, s.default_page, s.order, s.notify_published, s.notify_pending, s.moderation, s.max_links, s.links_allowed, s.avatar_default],
        [false, false, false, true, 30, true, 7, 5, "last", "newest", true, false, "first", 0, false, "identicon"]);
      assert.equal(s.mod_keys, "spamdomain.example\nBonus Gratuit\n12.34.56.78", "une entrée par ligne, espaces et doublons nettoyés");
      assert.equal(one("SELECT COUNT(*) n FROM mk_settings WHERE key LIKE 'cms.comments%'").n, 0);
      const html = (await boss.get(SET)).text;
      assert.match(html, /name="comments_close_days"[^>]*value="30"/); assert.match(html, /name="comments_per_page"[^>]*value="5"/); assert.match(html, /<option value="last" selected>/);
      assert.match(html, /name="comments_avatar_default" value="identicon" checked/); assert.match(html, /spamdomain\.example/);
      await save({});
    });
    test("valeurs invalides refusées côté serveur : rien n'est enregistré, les saisies sont conservées", async () => {
      const before = one("SELECT value FROM mk_settings WHERE key = 'comments.settings'");
      for (const bad of [{ close_days: "0" }, { close_days: "-5" }, { close_days: "99999" }, { close_days: "" }, { max_depth: "11" }, { max_depth: "0" }, { per_page: "0" }, { per_page: "101" }, { per_page: "abc" }, { max_links: "-1" }, { max_links: "51" }, { default_page: "milieu" }, { order: "hasard" }, { moderation: "tout" }, { avatar_rating: "Z" }, { avatar_default: "pirate" }]) {
        const r = await save(bad); assert.equal(r.status, 422, JSON.stringify(bad));
      }
      const tooMany = await save({ mod_keys: Array.from({ length: 501 }, (_, i) => `terme${i}`).join("\n") }); assert.equal(tooMany.status, 422); assert.match(tooMany.text, /500 lignes au plus/);
      const kept = await save({ per_page: "0", block_keys: "ma saisie" }); assert.match(kept.text, /ma saisie/, "la saisie reste dans le formulaire");
      assert.deepEqual(one("SELECT value FROM mk_settings WHERE key = 'comments.settings'"), before);
    });
  });

  describe("effets sur le site public", () => {
    test("nouvelles publications : la valeur par défaut s'applique aux NOUVEAUX articles seulement, jamais aux existants", async () => {
      const create = async (title) => { const r = await boss.post("/marketing/site-web/articles", { title }); const id = Number(String(r.location).match(/blog\/(\d+)\//)[1]); return one("SELECT id, comments_enabled FROM posts WHERE id = ?", id); };
      await save({ enabled_default: "" });
      const off = await create("Sans commentaires"); assert.equal(off.comments_enabled, 0);
      await save({ enabled_default: "1" });
      assert.equal((await create("Avec commentaires")).comments_enabled, 1);
      assert.equal(one("SELECT comments_enabled FROM posts WHERE id = ?", off.id).comments_enabled, 0, "l'article existant n'est pas réécrit");
      assert.equal(one("SELECT comments_enabled FROM posts WHERE id = ?", postId).comments_enabled, 1);
    });
    test("compte obligatoire : l'envoi anonyme est refusé côté serveur, le formulaire n'est pas proposé", async () => {
      await save({ guests_allowed: "" });
      const html = await page(); assert.doesNotMatch(html, /name="author_email"/); assert.match(html, /Connectez-vous pour laisser un commentaire/);
      const r = await send("Anonyme forgé"); assert.match(r.location, /^\/connexion/); assert.equal(row("Anonyme forgé"), undefined);
      await save({});
    });
    test("nom et e-mail obligatoires, ou facultatifs ; une adresse saisie reste validée", async () => {
      const html = await page(); assert.match(html, /id="comment-name"[^>]*required/); assert.match(html, /id="comment-email"[^>]*required/);
      await send("Sans e-mail", { author_email: "" }); assert.equal(row("Sans e-mail"), undefined, "refusé : e-mail obligatoire");
      await save({ require_name_email: "" });
      const open = await page(); assert.doesNotMatch(open, /id="comment-email"[^>]*required/); assert.match(open, /E-mail \(facultatif\)/);
      await send("Anonyme facultatif", { author_name: "", author_email: "" }); assert.equal(row("Anonyme facultatif").status, "approved");
      await send("Mauvais e-mail", { author_email: "pas-un-email" }); assert.equal(row("Mauvais e-mail"), undefined, "une adresse saisie doit être valide");
      await save({});
    });
    test("fermeture automatique : N jours après la publication, côté serveur ; les commentaires publiés restent visibles", async () => {
      const old = post("article-ancien", 1, "datetime('now', '-40 days')");
      db.prepare("INSERT INTO blog_comments (post_id, content_type, content_id, user_id, author_name, author_email, body, status, approved_at) VALUES (?, 'post', ?, NULL, 'Ancien', 'a@example.com', 'Déjà publié', 'approved', datetime('now'))").run(old, old);
      await save({ close_enabled: "", close_days: "30" });
      assert.equal((await send("Ouvert", {}, { slug: "article-ancien" })).status, 302); assert.ok(row("Ouvert"), "désactivée : jamais fermé");
      await save({ close_enabled: "1", close_days: "30" });
      const html = await page("article-ancien"); assert.match(html, /fermés : cette publication date de plus de 30 jours/); assert.doesNotMatch(html, /name="body"/); assert.match(html, /Déjà publié/);
      await send("Trop tard", {}, { slug: "article-ancien" }); assert.equal(row("Trop tard"), undefined);
      await send("Article récent", {}); assert.ok(row("Article récent"), "un article récent reste ouvert");
      await save({ close_enabled: "1", close_days: "60" }); await send("Dans les 60 jours", {}, { slug: "article-ancien" }); assert.ok(row("Dans les 60 jours"));
      await save({});
    });
    test("cookie du commentateur : la case n'existe que si le réglage est actif, et le cookie n'est écrit que si elle est cochée", async () => {
      assert.doesNotMatch(await page(), /name="remember"/);
      const none = await send("Sans case", { remember: "1" }); assert.equal(none.headers.getSetCookie().filter((c) => c.startsWith("kw_commenter")).length, 0, "réglage inactif : jamais de cookie");
      await save({ cookie_consent: "1" });
      assert.match(await page(), /name="remember"/);
      const no = await send("Sans consentement", {}); assert.equal(no.headers.getSetCookie().filter((c) => c.startsWith("kw_commenter=")).length, 0);
      assert.equal(row("Sans consentement").status, "approved", "l'absence de consentement n'empêche pas l'envoi");
      const c = new Client(srv.base);
      const yes = await send("Avec consentement", { remember: "1" }, { client: c });
      const cookie = yes.headers.getSetCookie().find((x) => x.startsWith("kw_commenter="));
      assert.ok(cookie); assert.match(cookie, /HttpOnly/i); assert.match(cookie, /SameSite=Lax/i); assert.match(cookie, /Max-Age=\d+/i);
      assert.match((await c.get(`/blog/${slug}`)).text, /name="author_name"[^>]*value="Camille"/, "le nom mémorisé préremplit le formulaire");
      await save({});
    });
    test("commentaires imbriqués : profondeur choisie appliquée, réponse refusée au-delà ; désactivés : aucune réponse", async () => {
      const sl = "article-fil"; const pid = post(sl);
      await save({ max_depth: "2" });
      const mk = (parent, body) => Number(db.prepare("INSERT INTO blog_comments (post_id, content_type, content_id, parent_id, author_name, author_email, body, status, approved_at) VALUES (?, 'post', ?, ?, 'X', 'x@example.com', ?, 'approved', datetime('now'))").run(pid, pid, parent, body).lastInsertRowid);
      const a = mk(null, "Niveau 1"); const b = mk(a, "Niveau 2");
      await send("Niveau 3 refusé", { parent_id: String(b) }, { slug: sl }); assert.equal(row("Niveau 3 refusé"), undefined);
      await send("Niveau 2 ok", { parent_id: String(a) }, { slug: sl }); assert.ok(row("Niveau 2 ok"));
      await save({ max_depth: "10" }); await send("Niveau 3 ok", { parent_id: String(b) }, { slug: sl }); assert.ok(row("Niveau 3 ok"));
      assert.equal((await send("Réponse à un inexistant", { parent_id: "999999" }, { slug: sl })).status, 302); assert.equal(row("Réponse à un inexistant"), undefined);
      await save({ replies_allowed: "" }); await send("Réponse désactivée", { parent_id: String(a) }, { slug: sl }); assert.equal(row("Réponse désactivée"), undefined);
      assert.doesNotMatch(await page(sl), /Répondre à/);
      await save({});
    });
    test("pagination, page par défaut et ordre : appliqués au rendu public ; désactivée : tout sur une page", async () => {
      const sl = "article-pages"; const pid = post(sl);
      for (let i = 1; i <= 7; i++) db.prepare("INSERT INTO blog_comments (post_id, content_type, content_id, author_name, author_email, body, status, created_at, approved_at) VALUES (?, 'post', ?, 'P', 'p@example.com', ?, 'approved', datetime('now', ?), datetime('now'))").run(pid, pid, `Com-${i}`, `-${8 - i} hours`);
      const bodies = (h) => [...h.matchAll(/Com-(\d)/g)].map((m) => Number(m[1])).filter((v, i, arr) => arr.indexOf(v) === i);
      await save({ per_page: "3", default_page: "first", order: "oldest" });
      const p1 = await page(sl); assert.deepEqual(bodies(p1), [1, 2, 3]); assert.match(p1, /Page 1 sur 3/);
      assert.deepEqual(bodies(await page(sl, "?cpage=3")), [7]);
      await save({ per_page: "3", default_page: "last", order: "oldest" });
      assert.deepEqual(bodies(await page(sl)), [7], "dernière page par défaut"); assert.deepEqual(bodies(await page(sl, "?cpage=1")), [1, 2, 3], "une page demandée l'emporte");
      await save({ per_page: "3", default_page: "first", order: "newest" });
      assert.deepEqual(bodies(await page(sl)), [7, 6, 5], "les plus récents en haut");
      await save({ paginate: "", per_page: "3" });
      const all = await page(sl); assert.deepEqual(bodies(all).sort(), [1, 2, 3, 4, 5, 6, 7]); assert.doesNotMatch(all, /Pages de commentaires/);
      await save({});
    });
  });

  describe("modération", () => {
    test("approbation manuelle : en attente, invisible, puis approuvée par une personne autorisée (historique conservé)", async () => {
      await save({ moderation: "all" });
      await send("À approuver"); const c = row("À approuver"); assert.equal(c.status, "pending");
      assert.doesNotMatch(await page(), /À approuver/);
      assert.equal((await boss.post(`/marketing/site-web/commentaires/${c.id}/approuver`, {})).status, 302);
      const after = row("À approuver"); assert.equal(after.status, "approved"); assert.ok(after.approved_by && after.approved_at);
      assert.match(await page(), /À approuver/);
      await save({});
    });
    test("auteur sans commentaire approuvé : en attente la première fois, reconnu ensuite par e-mail ET nom, jamais par l'e-mail seul", async () => {
      await save({ moderation: "first" });
      await send("Premier", { author_name: "Nouvelle Personne", author_email: "nouvelle@example.com" }); assert.equal(row("Premier").status, "pending");
      await boss.post(`/marketing/site-web/commentaires/${row("Premier").id}/approuver`, {});
      await send("Second", { author_name: "Nouvelle Personne", author_email: "nouvelle@example.com" }); assert.equal(row("Second").status, "approved", "même e-mail et même nom : reconnu");
      await send("Usurpation", { author_name: "Quelqu'un d'autre", author_email: "nouvelle@example.com" }); assert.equal(row("Usurpation").status, "pending", "même e-mail, autre nom : pas reconnu");
      await save({ moderation: "all" });
      await send("Priorité", { author_name: "Nouvelle Personne", author_email: "nouvelle@example.com" }); assert.equal(row("Priorité").status, "pending", "« tous » l'emporte");
      await save({});
    });
    test("nombre de liens : seuil strict, www et liens encodés comptés, jamais supprimé", async () => {
      await save({ max_links: "2" });
      await send("L2 http://a.example et http://b.example"); assert.equal(row("L2 http://a.example et http://b.example").status, "approved", "2 liens ≤ 2");
      await send("L3 http://a.example http://b.example www.c.example"); assert.equal(row("L3 http://a.example http://b.example www.c.example").status, "pending", "3 liens > 2");
      await send("Enc http://a.example %68ttp://b.example/x www.c.example"); assert.equal(row("Enc http://a.example %68ttp://b.example/x www.c.example").status, "pending");
      await save({ max_links: "0" }); await send("Un seul lien http://a.example"); assert.equal(row("Un seul lien http://a.example").status, "pending");
      await save({ max_links: "5" }); await send("Quatre http://a.ex http://b.ex http://c.ex http://d.ex"); assert.equal(row("Quatre http://a.ex http://b.ex http://c.ex http://d.ex").status, "approved");
      await send("Cassé http:// et https://ok.example/page"); assert.equal(row("Cassé http:// et https://ok.example/page").status, "approved", "un lien mal formé ne compte pas comme deux");
      await save({});
    });
    test("liste de modération : texte, nom, e-mail, adresse IP, agent utilisateur ; dans les mots ; sans casse ni accents", async () => {
      await save({ mod_keys: "bonus gratuit\nfraudeur@example.org\nspamcorp\n10.200.0.9\nBadBot" });
      await send("Un BONUS   gratuit pour vous"); assert.equal(row("Un BONUS   gratuit pour vous").status, "pending");
      await send("Mon avis", { author_email: "fraudeur@example.org" }); assert.equal(row("Mon avis").status, "pending");
      await send("Avis nom", { author_name: "Équipe SpamCorp" }); assert.equal(row("Avis nom").status, "pending");
      await send("Avis ip", {}, { headers: { "x-forwarded-for": "10.200.0.9" } }); assert.equal(row("Avis ip").status, "pending", "adresse IP exacte");
      await send("Avis agent", {}, { headers: { "User-Agent": "xxbadbotxx/1.0" } }); assert.equal(row("Avis agent").status, "pending");
      await send("Un message tout à fait normal"); assert.equal(row("Un message tout à fait normal").status, "approved");
      assert.equal(one("SELECT COUNT(*) n FROM blog_comments WHERE ip_hash LIKE '%10.200.0.9%'").n, 0, "aucune adresse IP en clair");
      await save({});
    });
    test("liste de blocage : indésirable (jamais publié ni supprimé), restaurable, distincte de la liste de modération", async () => {
      await save({ block_keys: "casino\nlotterie-gratuite.example", mod_keys: "soupçon" });
      await send("Venez au CASINO en ligne"); const b = row("Venez au CASINO en ligne"); assert.equal(b.status, "spam"); assert.match(b.metadata, /blocklist/);
      await send("Un soupçon de retard"); assert.equal(row("Un soupçon de retard").status, "pending", "modération ≠ blocage");
      await send("Casino ET soupçon"); assert.equal(row("Casino ET soupçon").status, "spam", "le blocage l'emporte");
      assert.doesNotMatch(await page(), /CASINO/);
      assert.match((await boss.get("/marketing/site-web/commentaires/indesirables")).text, /CASINO/, "consultable dans le module");
      await boss.post(`/marketing/site-web/commentaires/${b.id}/restaurer`, {});
      assert.notEqual(row("Venez au CASINO en ligne").status, "spam", "restaurable");
      assert.ok(row("Venez au CASINO en ligne"), "jamais supprimé");
      await save({});
    });
    test("un modérateur n'est jamais retenu par ses propres règles", async () => {
      await save({ moderation: "all", block_keys: "casino" });
      const r = await boss.post(`/marketing/site-web/commentaires/${row("Venez au CASINO en ligne").id}/repondre`, { body: "Réponse de l'équipe casino" });
      assert.ok([200, 302].includes(r.status)); assert.equal(row("Réponse de l'équipe casino").status, "approved");
      await save({});
    });
  });

  describe("notifications", () => {
    const mails = (kind) => db.prepare("SELECT * FROM mail_outbox WHERE kind = ? ORDER BY id").all(kind);
    test("publié : un e-mail par commentaire de visiteur, seulement si le réglage est actif ; attente : un e-mail, limité dans le temps", async () => {
      await save({ notify_published: "", notify_pending: "" });
      const n0 = mails("comment_published").length, p0 = mails("comment_pending").length;
      await send("Silence"); assert.equal(mails("comment_published").length, n0);
      await save({ notify_published: "1", notify_pending: "" });
      await send("Annonce publiée"); assert.equal(mails("comment_published").length, n0 + 1); assert.match(mails("comment_published")[0].subject, /Nouveau commentaire/);
      await send("Annonce publiée 2"); assert.equal(mails("comment_published").length, n0 + 2, "un par commentaire");
      assert.equal(mails("comment_pending").length, p0, "attente désactivée");
      // Attente : la limite (un e-mail par tranche de 10 minutes) est PAR SITE ; un site neuf la voit à zéro
      const N = Number(String((await boss.post("/marketing/site-web/sites", { name: "Notif B" })).location).match(/sites\/(\d+)/)[1]);
      const nid = post("article-notif"); db.prepare("INSERT INTO mk_content_sites (content_type, content_id, organization_id, site_id, scope, address) VALUES ('post', ?, ?, ?, '', NULL)").run(nid, orgId, N);
      await save({ notify_published: "", notify_pending: "1", moderation: "all", guests_allowed: "1" }, N);
      const q0 = mails("comment_pending").length;
      await send("Attente 1", {}, { slug: "article-notif" }); await send("Attente 2", {}, { slug: "article-notif" });
      assert.equal(mails("comment_pending").length, q0 + 1, "au plus un e-mail par tranche de 10 minutes");
      assert.equal(mails("comment_published").length, n0 + 2, "un commentaire en attente n'est pas « publié »");
      assert.ok(!mails("comment_pending").at(-1).body.includes("Attente 1"), "jamais le texte d'un inconnu");
      assert.match(mails("comment_pending").at(-1).subject, /en attente de modération/);
      await save({});
    });
  });

  describe("avatars", () => {
    test("désactivés : aucun avatar dans les commentaires publics ; activés : image locale, sans e-mail dans l'adresse", async () => {
      const sl = "article-avatars"; const pid = post(sl);
      db.prepare("INSERT INTO blog_comments (post_id, content_type, content_id, author_name, author_email, body, status, approved_at) VALUES (?, 'post', ?, 'Zoé Martin', 'zoe@example.com', 'Avatar test', 'approved', datetime('now'))").run(pid, pid);
      await save({ show_avatars: "", avatar_default: "mystery" });
      assert.doesNotMatch(await page(sl), /comment-avatar/);
      await save({ show_avatars: "1", avatar_default: "initials" });
      const h = await page(sl); const m = /src="(\/avatar\/l\/initials\/[0-9a-f]+\.svg\?i=[^"]+)"/.exec(h); assert.ok(m, "avatar initiales");
      assert.doesNotMatch(h, /zoe@example\.com|gravatar/i);
      assert.match(m[1], /i=ZM/);
      const img = await new Client(srv.base).get(m[1]); assert.equal(img.status, 200); assert.match(img.headers.get("content-type"), /image\/svg\+xml/); assert.match(img.text, />ZM</);
      await save({});
    });
    test("types locaux : mystère, vide, identicon (stable), initiales, couleur ; entrées invalides refusées", async () => {
      for (const t of ["mystery", "blank", "identicon", "initials", "color"]) { const r = await new Client(srv.base).get(`/avatar/l/${t}/0123456789abcdef01234567.svg`); assert.equal(r.status, 200, t); assert.match(r.text, /<svg/); }
      const a = (await new Client(srv.base).get("/avatar/l/identicon/0123456789abcdef01234567.svg")).text, b = (await new Client(srv.base).get("/avatar/l/identicon/0123456789abcdef01234567.svg")).text, c = (await new Client(srv.base).get("/avatar/l/identicon/fedcba9876543210fedcba98.svg")).text;
      assert.equal(a, b); assert.notEqual(a, c);
      for (const bad of ["/avatar/l/pirate/0123456789abcdef.svg", "/avatar/l/identicon/ZZZZ.svg", "/avatar/l/initials/0123456789abcdef.svg?i=%3Cscript%3E"]) { const r = await new Client(srv.base).get(bad); assert.ok(r.status === 404 || !/<script/.test(r.text), bad); }
    });
    test("Gravatar : sans accord explicite, aucun appel externe et repli sur la personne mystère ; l'e-mail ne sort jamais", async () => {
      const sl = "article-gravatar"; const pid = post(sl);
      const id = Number(db.prepare("INSERT INTO blog_comments (post_id, content_type, content_id, author_name, author_email, body, status, approved_at) VALUES (?, 'post', ?, 'G', 'g@example.com', 'Gravatar test', 'approved', datetime('now'))").run(pid, pid).lastInsertRowid);
      await save({ avatar_default: "robohash", avatar_external: "" });
      assert.match(await page(sl), /\/avatar\/l\/mystery\//, "sans accord : avatar local");
      const r = await new Client(srv.base).get(`/avatar/g/${id}.png`); assert.equal(r.status, 302); assert.match(r.location, /\/avatar\/l\/mystery\//);
      await save({ avatar_default: "robohash", avatar_external: "1" });
      assert.match(await page(sl), new RegExp(`/avatar/g/${id}\\.png`), "avec accord : image servie par Kolakisa");
      assert.doesNotMatch(await page(sl), /gravatar\.com|g@example\.com/);
      assert.equal((await new Client(srv.base).get("/avatar/g/999999.png")).status, 404);
      db.prepare("UPDATE blog_comments SET status = 'pending' WHERE id = ?").run(id);
      assert.equal((await new Client(srv.base).get(`/avatar/g/${id}.png`)).status, 404, "un commentaire non publié n'a pas d'avatar public");
      await save({});
    });
    test("Gravatar est un réglage sensible : confirmation requise ; l'empreinte n'est pas l'adresse", async () => {
      const r = await boss.post(SET, { ...form({ avatar_external: "1" }), confirm: "" }); assert.equal(r.status, 409); assert.match(r.text, /gravatar\.com/i);
      assert.equal(JSON.parse(one("SELECT value FROM mk_settings WHERE key = 'comments.settings'").value).avatar_external, false);
      const opts = [...(await boss.get(SET)).text.matchAll(/name="comments_avatar_default" value="([a-z]+)"/g)].map((m) => m[1]);
      assert.deepEqual(opts, ["mystery", "blank", "gravatar", "identicon", "wavatar", "monsterid", "retro", "robohash", "initials", "color"], "les dix choix de WordPress");
    });
  });

  describe("site à domaine propre : réglages et listes isolés", () => {
    let hostSlug;
    before(async () => {
      S = Number(String((await boss.post("/marketing/site-web/sites", { name: "Commentaires B" })).location).match(/sites\/(\d+)/)[1]);
      hostSlug = "article-site-b"; const id = post(hostSlug);
      db.prepare("INSERT INTO mk_content_sites (content_type, content_id, organization_id, site_id, scope, address) VALUES ('post', ?, ?, ?, '', NULL)").run(id, orgId, S);
    });
    test("sans réglage propre, le site hérite du principal ; la première modification crée ses réglages sans toucher au principal", async () => {
      await save({ moderation: "all", block_keys: "principalmot", per_page: "9" });
      assert.equal(JSON.parse(one("SELECT settings FROM mk_sites WHERE id = ?", S).settings).comments ?? null, null, "pas de réglages propres : hérite");
      const inherited = await boss.get(`${SET}?site=${S}`); assert.match(inherited.text, /name="comments_moderation" value="all" checked/, "affiche les valeurs héritées");
      assert.equal((await save({ moderation: "none", block_keys: "motdusite", per_page: "4", guests_allowed: "1" }, S)).status, 302);
      const mine = JSON.parse(one("SELECT settings FROM mk_sites WHERE id = ?", S).settings).comments;
      assert.deepEqual([mine.moderation, mine.block_keys, mine.per_page], ["none", "motdusite", 4]);
      const main = JSON.parse(one("SELECT value FROM mk_settings WHERE key = 'comments.settings'").value);
      assert.deepEqual([main.moderation, main.block_keys, main.per_page], ["all", "principalmot", 9], "le principal n'a pas bougé");
    });
    test("listes de blocage et de modération isolées : le mot du site B n'agit pas sur le principal, et inversement", async () => {
      await send("Texte motdusite", {}); assert.equal(row("Texte motdusite").status, "pending", "principal : modération « tous », mot de B sans effet de blocage");
      await send("Texte principalmot", {}); assert.equal(row("Texte principalmot").status, "spam");
      const ok = await send("Bonjour de B motdusite", {}, { slug: hostSlug }); assert.equal(ok.status, 302);
      assert.equal(row("Bonjour de B motdusite").status, "spam", "le site B applique SA liste");
      await send("Bonjour de B principalmot", {}, { slug: hostSlug }); assert.equal(row("Bonjour de B principalmot").status, "approved", "la liste du principal n'agit pas sur B");
    });
    test("un administrateur d'un autre site ne peut pas modifier les réglages de ce site ; un site inexistant est refusé", async () => {
      const other = Number(String((await boss.post("/marketing/site-web/sites", { name: "Voisin commentaires" })).location).match(/sites\/(\d+)/)[1]);
      const c = await newStudent(srv);
      db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, (SELECT id FROM users WHERE email = ?), 'admin')").run(other, c.email);
      const before = one("SELECT settings FROM mk_sites WHERE id = ?", S).settings;
      const r = await c.post(`${SET}?site=${S}`, form({ per_page: "77" }, S));
      assert.ok([302, 403, 404].includes(r.status)); assert.equal(one("SELECT settings FROM mk_sites WHERE id = ?", S).settings, before, "rien n'a changé");
      assert.equal((await boss.post(`${SET}?site=999999`, form({}, 999999))).status, 404);
    });
    test("réglages des commentaires d'un site : pagination propre au site", async () => {
      const id = one("SELECT id FROM posts WHERE slug = ?", hostSlug).id;
      for (let i = 1; i <= 6; i++) db.prepare("INSERT INTO blog_comments (post_id, content_type, content_id, author_name, author_email, body, status, created_at, approved_at) VALUES (?, 'post', ?, 'S', 's@example.com', ?, 'approved', datetime('now', ?), datetime('now'))").run(id, id, `Site-${i}`, `-${7 - i} hours`);
      const pg = (await new Client(srv.base).get(`/blog/${hostSlug}`)).text;
      assert.match(pg, /Page 1 sur 2/, "4 par page sur le site B");
      assert.match((await new Client(srv.base).get(`/blog/${slug}`)).text, /Page 1 sur \d+/, "le principal garde sa propre pagination (9 par page)");
    });
  });

  describe("permissions et sécurité", () => {
    test("sans connexion ou sans droit : refus ; aucune donnée personnelle dans la page publique", async () => {
      assert.equal((await new Client(srv.base).post(SET, form({ per_page: "5" }))).status, 302);
      const student = await newStudent(srv); const r = await student.post(SET, form({ per_page: "5" })); assert.ok([302, 403].includes(r.status));
      assert.equal(JSON.parse(one("SELECT value FROM mk_settings WHERE key = 'comments.settings'").value).per_page, 9);
      const html = await page(); assert.doesNotMatch(html, /camille@example\.com/);
    });
    test("la liste affichée contient du texte inoffensif : une entrée HTML est stockée comme du texte et échappée à l'affichage", async () => {
      await save({ mod_keys: "<script>alert(1)</script>" });
      const html = (await boss.get(SET)).text; assert.doesNotMatch(html, /<script>alert\(1\)<\/script>/); assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
      await save({});
    });
  });
});
