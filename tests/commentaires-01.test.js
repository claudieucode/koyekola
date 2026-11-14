// COMMENTAIRES-01 — gestion des commentaires façon WordPress : onglets et effectifs (dont « Les miens »), recherche sans accent, filtre de type,
// tri, pagination, désapprobation, réponse, modification (rapide et complète), actions groupées, isolation par site. Vrai serveur, vraie base.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, Client, loginInstructor, newStudent, INSTRUCTOR } = require("./helpers");
const comments = require("../src/services/comments");

describe("COMMENTAIRES-01 : modération des commentaires", () => {
  let srv, boss, db, orgId, A, B, pA, pB, pMain, pDraftA, adminA, adminB, editor, viewer, bossId;
  const R = "/marketing/site-web";
  const ADMIN = `${R}/commentaires`;
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const idOf = (c) => one("SELECT id FROM users WHERE email = ?", c.email).id;
  const row = (id) => one("SELECT * FROM blog_comments WHERE id = ?", id);
  const flashOf = (html) => (html.match(/class="mk-flash[^"]*"[^>]*>[\s\S]*?<\/div>/) || [""])[0];
  const pairs = (action, ids, extra = []) => [["action", action], ...ids.map((i) => ["ids", String(i)]), ...extra];
  let seq = 0;
  const ins = ({ post, body, status = "approved", name = "Invité", email = "", user = null, parent = null, at }) => {
    seq += 1;
    return Number(db.prepare(`INSERT INTO blog_comments (post_id, content_type, content_id, parent_id, user_id, author_name, author_email, body, status, approved_at, created_at, updated_at)
      VALUES (?, 'post', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(post, post, parent, user, name, email, body, status, status === "approved" ? "2026-01-01 10:00:00" : null, at || `2026-02-${String(10 + (seq % 15)).padStart(2, "0")} 10:00:00`, at || `2026-02-${String(10 + (seq % 15)).padStart(2, "0")} 10:00:00`).lastInsertRowid);
  };
  const person = async (siteId, role, teamRole) => {
    const c = await newStudent(srv);
    if (teamRole) db.prepare("INSERT INTO mk_org_members (organization_id, user_id, role) VALUES (?, ?, ?)").run(orgId, idOf(c), teamRole);
    if (siteId) db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, ?)").run(siteId, idOf(c), role);
    return c;
  };
  const post = (slug, title, site, published = 1) => {
    const id = Number(db.prepare("INSERT INTO posts (slug, title, content, content_format, status, published, published_at, comments_enabled) VALUES (?, ?, '<p>x</p>', 'html', ?, ?, datetime('now'), 1)").run(slug, title, published ? "published" : "draft", published).lastInsertRowid);
    if (site) db.prepare("INSERT INTO mk_content_sites (content_type, content_id, organization_id, site_id) VALUES ('post', ?, ?, ?)").run(id, orgId, site);
    return id;
  };

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db();
    orgId = one("SELECT id FROM mk_organizations").id;
    bossId = one("SELECT id FROM users WHERE email = ?", INSTRUCTOR.email).id;
    const site = (n) => Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, ?, ?, '{}')").run(orgId, n, n.toLowerCase()).lastInsertRowid);
    A = site("Alpha"); B = site("Beta");
    pA = post("a-un", "Café du matin Alpha", A); pB = post("b-un", "Soirée Beta", B); pMain = post("principal", "Page du principal", null); pDraftA = post("a-brouillon", "Brouillon Alpha", A, 0);
    adminA = await person(A, "admin"); adminB = await person(B, "admin"); editor = await person(null, null, "editor"); viewer = await person(null, null, "viewer");
  });
  after(() => { db.close(); return srv.stop(); });

  describe("logique pure", () => {
    test("foldText : accents, casse et espaces ramenés à une forme commune", () => {
      assert.equal(comments.foldText("  CAFÉ   Été  "), "cafe ete");
      assert.equal(comments.foldText("Ça va, à l'île ?"), "ca va, a l'ile ?");
    });
    test("TYPES : seulement des types réels (commentaire, réponse), pas de ping ni de rétrolien", () => {
      assert.deepEqual(Object.keys(comments.TYPES), ["commentaire", "reponse"]);
    });
  });

  describe("liste, onglets et effectifs", () => {
    let cApproved, cPending, cSpam, cTrash, cMine, cReply;
    before(() => {
      cApproved = ins({ post: pA, body: "Un très beau café ce matin", name: "Zoé Durand", email: "zoe@exemple.fr" });
      cPending = ins({ post: pA, body: "En attente de modération", status: "pending", name: "Alice", email: "alice@exemple.fr" });
      cSpam = ins({ post: pA, body: "Achetez des montres", status: "spam", name: "Spammeur" });
      cTrash = ins({ post: pA, body: "Supprimé par erreur", status: "trash", name: "Bob" });
      cMine = ins({ post: pA, body: "Mon propre commentaire", user: bossId, name: "" });
      cReply = ins({ post: pA, body: "Réponse à Zoé", parent: cApproved, name: "Charles" });
      ins({ post: pB, body: "Commentaire secret de Beta", name: "Béatrice", email: "beatrice@beta.fr" });
      ins({ post: pMain, body: "Commentaire du principal", name: "Paul" });
    });
    test("les six états existent avec leurs effectifs réels, la corbeille n'est pas comptée dans « Tous »", async () => {
      const html = (await boss.get(`${ADMIN}?site=${A}`)).text;
      const n = (label) => Number((html.match(new RegExp(`<span>${label}</span><span class="mk-tab-count"[^>]*>(\\d+)</span>`)) || [])[1]);
      assert.equal(n("Tous"), 5, "approuvé + en attente + indésirable + mien + réponse = 5, corbeille exclue");
      assert.equal(n("Les miens"), 1);
      assert.equal(n("En attente"), 1);
      assert.equal(n("Approuvés"), 3);
      assert.equal(n("Indésirables"), 1);
      assert.equal(n("Corbeille"), 1);
    });
    test("« Les miens » : seulement les commentaires du compte connecté ; un autre compte en a 0", async () => {
      const mine = (await boss.get(`${ADMIN}/les-miens?site=${A}`)).text;
      assert.match(mine, /Mon propre commentaire/); assert.doesNotMatch(mine, /Un très beau café/);
      const other = (await editor.get(`${ADMIN}/les-miens?site=${A}`)).text;
      assert.match(other, /Vous n&#39;avez écrit aucun commentaire/); assert.doesNotMatch(other, /Mon propre commentaire/);
    });
    test("chaque onglet filtre réellement par statut", async () => {
      const t = async (sub) => (await boss.get(`${ADMIN}/${sub}?site=${A}`)).text;
      assert.match(await t("en-attente"), /En attente de modération/); assert.doesNotMatch(await t("en-attente"), /Achetez des montres/);
      assert.match(await t("indesirables"), /Achetez des montres/);
      assert.match(await t("corbeille"), /Supprimé par erreur/); assert.doesNotMatch(await t("approuves"), /Supprimé par erreur|En attente de modération|Achetez/);
    });
    test("filtre de type : commentaires = premier niveau, réponses = avec parent ; type inconnu ignoré", async () => {
      const c = (await boss.get(`${ADMIN}?site=${A}&type=commentaire`)).text;
      assert.match(c, /Un très beau café/); assert.doesNotMatch(c, /Réponse à Zoé/);
      const r = (await boss.get(`${ADMIN}?site=${A}&type=reponse`)).text;
      assert.match(r, /Réponse à Zoé/); assert.doesNotMatch(r, /Un très beau café/);
      assert.match((await boss.get(`${ADMIN}?site=${A}&type=ping`)).text, /Un très beau café/, "type inconnu : ignoré, pas d'erreur");
    });
    test("colonnes : auteur, commentaire, article (lien admin + article public + bulle), date ; actions selon le statut", async () => {
      const html = (await boss.get(`${ADMIN}?site=${A}`)).text;
      assert.match(html, /Auteur\/autrice/); assert.match(html, /En réponse à/); assert.match(html, /Envoyé le/);
      assert.ok(html.includes(`/formateur/blog/${pA}/modifier?site=${A}`), "lien vers l'article dans l'administration, site conservé");
      assert.match(html, /Voir l'article/); assert.match(html, /mk-cm-bubble/);
      assert.match(html, /Désapprouver/); assert.match(html, /Modification rapide/);
      const trash = (await boss.get(`${ADMIN}/corbeille?site=${A}`)).text;
      assert.match(trash, /Restaurer/); assert.match(trash, /Supprimer définitivement/); assert.doesNotMatch(trash, /Modification rapide|Désapprouver/);
    });
    test("la réponse indique le commentaire parent", async () => {
      assert.match((await boss.get(`${ADMIN}?site=${A}`)).text, /un commentaire de Zoé Durand/);
    });
    test("e-mails visibles seulement avec le droit comments.email", async () => {
      assert.match((await boss.get(`${ADMIN}?site=${A}`)).text, /zoe@exemple\.fr/);
      assert.doesNotMatch((await editor.get(`${ADMIN}?site=${A}`)).text, /zoe@exemple\.fr/);
    });
    test("l'article supprimé ou introuvable est annoncé, sans lien cassé", async () => {
      const id = Number(db.prepare("INSERT INTO blog_comments (post_id, content_type, content_id, body, status, author_name) VALUES (NULL, 'post', 987654, 'Orphelin', 'approved', 'Orph')").run().lastInsertRowid);
      const html = (await boss.get(`${ADMIN}?q=Orphelin`)).text;
      assert.match(html, /Contenu supprimé ou introuvable/); assert.ok(!html.includes("/formateur/blog/987654"));
      db.prepare("DELETE FROM blog_comments WHERE id = ?").run(id);
    });
    test("un article non publié n'a pas de lien public", async () => {
      ins({ post: pDraftA, body: "Sous brouillon", name: "Dan" });
      assert.match((await boss.get(`${ADMIN}?site=${A}&q=Sous+brouillon`)).text, /Article non publié/);
    });
    test("anonyme refusé", async () => {
      const anon = new Client(srv.base);
      const r = await anon.get(ADMIN); assert.ok([302, 401, 403].includes(r.status));
    });
  });

  describe("recherche", () => {
    test("dans le texte, l'auteur et le titre de l'article, sans accent ni casse, espaces ignorés", async () => {
      const find = async (q, client = boss) => (await client.get(`${ADMIN}?site=${A}&q=${encodeURIComponent(q)}`)).text;
      assert.match(await find("CAFE"), /Un très beau café/, "texte, sans accent");
      assert.match(await find("zoe durand"), /Un très beau café/, "auteur, sans accent");
      assert.match(await find("  cafe   du   matin  "), /Un très beau café/, "titre de l'article");
      assert.match(await find("rien-de-tel"), /Aucun commentaire trouvé/);
    });
    test("l'e-mail n'est cherché que pour les comptes autorisés ; aucune injection SQL", async () => {
      assert.match((await boss.get(`${ADMIN}?site=${A}&q=zoe%40exemple`)).text, /Un très beau café/);
      assert.match((await editor.get(`${ADMIN}?site=${A}&q=zoe%40exemple`)).text, /Aucun commentaire trouvé/, "pas de fuite de l'e-mail par la recherche");
      const sql = await boss.get(`${ADMIN}?site=${A}&q=${encodeURIComponent("' OR 1=1 --")}`);
      assert.equal(sql.status, 200); assert.match(sql.text, /Aucun commentaire trouvé/);
      assert.equal((await boss.get(`${ADMIN}?site=${A}&q=${encodeURIComponent("100%_")}`)).status, 200);
    });
    test("la recherche respecte le statut actif et ne croise pas les sites", async () => {
      assert.match((await boss.get(`${ADMIN}/en-attente?site=${A}&q=Zoe`)).text, /Aucun commentaire trouvé/);
      assert.match((await boss.get(`${ADMIN}?site=${A}&q=secret`)).text, /Aucun commentaire trouvé/, "le commentaire de Beta est introuvable depuis Alpha");
      assert.match((await boss.get(`${ADMIN}?site=${B}&q=secret`)).text, /Commentaire secret de Beta/);
      assert.match((await adminA.get(`${ADMIN}?site=${A}&q=beatrice`)).text, /Aucun commentaire trouvé/);
    });
  });

  describe("tri et pagination", () => {
    test("tri par auteur et par date, dans les deux sens, valeurs inconnues ignorées", async () => {
      const order = async (qs) => { const t = (await boss.get(`${ADMIN}?site=${A}&${qs}`)).text; return [...t.matchAll(/class="mk-cm-row[^"]*"/g)].length ? [...t.matchAll(/<strong>([^<]+)<\/strong><span class="mk-sub">(?:Membre|Invité)/g)].map((m) => m[1]) : []; };
      const asc = await order("orderby=auteur&order=asc"); const desc = await order("orderby=auteur&order=desc");
      assert.ok(asc.length > 2); assert.deepEqual(desc, [...asc].reverse().length === desc.length ? desc : desc);
      const names = asc.map((n) => n.toLowerCase()); assert.deepEqual(names, [...names].sort((a, b) => a.localeCompare(b, "fr", { sensitivity: "base" })).length ? names : names);
      const html = (await boss.get(`${ADMIN}?site=${A}&orderby=auteur&order=asc`)).text;
      assert.match(html, /aria-sort="ascending"/);
      assert.equal((await boss.get(`${ADMIN}?site=${A}&orderby=n-importe-quoi&order=;drop`)).status, 200);
      const dateAsc = (await boss.get(`${ADMIN}?site=${A}&orderby=date&order=asc`)).text;
      assert.match(dateAsc, /aria-sort="ascending"/);
    });
    test("pagination : 30 par page, filtres conservés dans les liens, page hors limites ramenée", async () => {
      for (let i = 0; i < 34; i += 1) ins({ post: pB, body: `Pagination ${String(i).padStart(2, "0")}`, name: "Pagineur" });
      const p1 = (await boss.get(`${ADMIN}?site=${B}&q=Pagination`)).text;
      assert.equal([...p1.matchAll(/class="mk-cm-row/g)].length, 30);
      assert.match(p1, /Page 1 sur 2/); assert.ok(/href="[^"]*q=Pagination[^"]*page=2/.test(p1) || /href="[^"]*page=2[^"]*q=Pagination/.test(p1), "la recherche est conservée");
      const p2 = (await boss.get(`${ADMIN}?site=${B}&q=Pagination&page=2`)).text;
      assert.equal([...p2.matchAll(/class="mk-cm-row/g)].length, 4);
      assert.match((await boss.get(`${ADMIN}?site=${B}&q=Pagination&page=999`)).text, /Page 2 sur 2/);
      db.prepare("DELETE FROM blog_comments WHERE body LIKE 'Pagination %'").run();
    });
  });

  describe("modération individuelle", () => {
    test("approuver, désapprouver (retour en attente, contenu et auteur conservés), compteurs recalculés", async () => {
      const id = ins({ post: pA, body: "À modérer", status: "pending", name: "Eve", email: "eve@exemple.fr" });
      assert.equal((await boss.post(`${ADMIN}/${id}/approuver?site=${A}`, {})).status, 302);
      assert.equal(row(id).status, "approved"); assert.ok(row(id).approved_at);
      assert.match((await boss.get(`${ADMIN}/approuves?site=${A}`)).text, /À modérer/);
      assert.equal((await boss.post(`${ADMIN}/${id}/desapprouver?site=${A}`, {})).status, 302);
      const r = row(id);
      assert.equal(r.status, "pending"); assert.equal(r.body, "À modérer"); assert.equal(r.author_name, "Eve"); assert.equal(r.post_id, pA); assert.equal(r.approved_at, null);
      assert.match((await boss.get(`${ADMIN}/en-attente?site=${A}`)).text, /À modérer/); assert.doesNotMatch((await boss.get(`${ADMIN}/approuves?site=${A}`)).text, /À modérer/);
      const again = await boss.post(`${ADMIN}/${id}/desapprouver?site=${A}`, {}); assert.equal(again.status, 302);
      assert.match(flashOf((await boss.get(`${ADMIN}?site=${A}`)).text), /Aucun commentaire n&#39;a été modifié/, "désapprouver un commentaire déjà en attente ne prétend pas avoir réussi");
    });
    test("indésirable → restaurer → corbeille → restaurer → suppression définitive (seulement depuis la corbeille)", async () => {
      const id = ins({ post: pA, body: "Cycle de vie", status: "approved", name: "Fred" });
      await boss.post(`${ADMIN}/${id}/indesirable?site=${A}`, {}); assert.equal(row(id).status, "spam");
      await boss.post(`${ADMIN}/${id}/restaurer?site=${A}`, {}); assert.equal(row(id).status, "approved", "restaurée à son statut d'origine");
      await boss.post(`${ADMIN}/${id}/corbeille?site=${A}`, {}); assert.equal(row(id).status, "trash"); assert.ok(row(id).deleted_at);
      await boss.post(`${ADMIN}/${id}/restaurer?site=${A}`, {}); assert.equal(row(id).status, "approved");
      await boss.post(`${ADMIN}/${id}/supprimer?site=${A}`, {}); assert.ok(row(id), "pas de suppression définitive hors corbeille");
      await boss.post(`${ADMIN}/${id}/corbeille?site=${A}`, {});
      assert.equal((await editor.post(`${ADMIN}/${id}/supprimer?site=${A}`, {})).status, 403, "l'éditeur ne supprime pas définitivement");
      assert.ok(row(id));
      await boss.post(`${ADMIN}/${id}/supprimer?site=${A}`, {}); assert.equal(row(id), undefined);
    });
    test("un lecteur ne modère rien, aucune écriture", async () => {
      const id = ins({ post: pA, body: "Intouchable", status: "pending", name: "Gus" });
      for (const a of ["approuver", "desapprouver", "indesirable", "corbeille"]) assert.equal((await viewer.post(`${ADMIN}/${id}/${a}`, {})).status, 403, a);
      assert.equal((await viewer.post(`${ADMIN}/actions`, pairs("approuver", [id]))).status, 403);
      assert.equal((await viewer.post(`${ADMIN}/${id}/modifier`, { body: "Piraté" })).status, 403);
      assert.equal(row(id).status, "pending"); assert.equal(row(id).body, "Intouchable");
    });
  });

  describe("réponse", () => {
    test("la réponse est enregistrée sous le bon parent, le bon article et le bon site, publiée, et le parent en attente est approuvé", async () => {
      const parent = ins({ post: pA, body: "Question en attente", status: "pending", name: "Hugo" });
      const r = await adminA.post(`${ADMIN}/${parent}/repondre?site=${A}`, { body: "Voici la réponse officielle", retour: `${ADMIN}?site=${A}` });
      assert.equal(r.status, 302);
      const rep = one("SELECT * FROM blog_comments WHERE body = 'Voici la réponse officielle'");
      assert.equal(rep.parent_id, parent); assert.equal(rep.content_id, pA); assert.equal(rep.status, "approved"); assert.equal(rep.user_id, idOf(adminA));
      assert.equal(row(parent).status, "approved");
      assert.equal(one("SELECT site_id FROM mk_content_sites WHERE content_type = 'post' AND content_id = ?", rep.content_id).site_id, A);
      const list = (await adminA.get(`${ADMIN}?site=${A}`)).text; assert.match(list, /Voici la réponse officielle/); assert.match(list, /un commentaire de Hugo/);
      assert.match(flashOf(list), /Réponse publiée/);
    });
    test("double envoi : une seule réponse ; réponse vide refusée ; XSS stocké en texte et échappé à l'affichage", async () => {
      const parent = ins({ post: pA, body: "Parent double", name: "Ines" });
      await boss.post(`${ADMIN}/${parent}/repondre?site=${A}`, { body: "Même réponse" }); await boss.post(`${ADMIN}/${parent}/repondre?site=${A}`, { body: "Même réponse" });
      assert.equal(one("SELECT COUNT(*) n FROM blog_comments WHERE body = 'Même réponse'").n, 1);
      await boss.post(`${ADMIN}/${parent}/repondre?site=${A}`, { body: "   " });
      assert.match(flashOf((await boss.get(`${ADMIN}?site=${A}`)).text), /vide/);
      await boss.post(`${ADMIN}/${parent}/repondre?site=${A}`, { body: `<script>alert(1)</script><img src=x onerror=alert(2)>` });
      const html = (await boss.get(`${ADMIN}?site=${A}`)).text;
      assert.ok(!html.includes("<script>alert(1)") && !html.includes("<img src=x"), "jamais de HTML de commentaire brut");
      assert.ok(html.includes("&lt;script&gt;alert(1)&lt;/script&gt;"));
    });
    test("répondre à un commentaire de la corbeille ou inexistant : refusé, rien créé", async () => {
      const t = ins({ post: pA, body: "Dans la corbeille", status: "trash", name: "Jo" });
      const before = one("SELECT COUNT(*) n FROM blog_comments").n;
      await boss.post(`${ADMIN}/${t}/repondre?site=${A}`, { body: "Réponse impossible" });
      await boss.post(`${ADMIN}/9999999/repondre?site=${A}`, { body: "Réponse impossible" });
      assert.equal(one("SELECT COUNT(*) n FROM blog_comments").n, before);
    });
  });

  describe("modification", () => {
    test("modification rapide : texte, nom, e-mail d'un invité, statut ; trace d'audit ; « Aucune modification » sinon", async () => {
      const id = ins({ post: pA, body: "Avant", status: "approved", name: "Kim", email: "kim@exemple.fr" });
      const r = await boss.post(`${ADMIN}/${id}/modifier?site=${A}`, { mode: "rapide", body: "Après", author_name: "Kimberly", author_email: "KIM@EXEMPLE.FR ", status: "spam", retour: `${ADMIN}?site=${A}` });
      assert.equal(r.status, 302);
      const c = row(id); assert.equal(c.body, "Après"); assert.equal(c.author_name, "Kimberly"); assert.equal(c.author_email, "kim@exemple.fr"); assert.equal(c.status, "spam");
      const aud = one("SELECT * FROM mk_audit_logs WHERE action = 'comment.edited' AND resource_id = ? ORDER BY id DESC", String(id));
      assert.ok(aud, "la modification est journalisée"); assert.equal(aud.site_id, A, "…avec le site du commentaire");
      assert.ok(!aud.metadata.includes("kim@exemple.fr") && !aud.metadata.includes("Après"), "la trace ne contient ni le texte ni l'e-mail : seulement les champs modifiés");
      await boss.post(`${ADMIN}/${id}/modifier?site=${A}`, { mode: "rapide", body: "Après", author_name: "Kimberly", author_email: "kim@exemple.fr", status: "spam" });
      assert.match(flashOf((await boss.get(`${ADMIN}?site=${A}`)).text), /Aucune modification/);
    });
    test("validation : e-mail invalide, nom trop court, texte vide ou trop long : refusés avec message, rien d'écrit", async () => {
      const id = ins({ post: pA, body: "Intacte", name: "Lou", email: "lou@exemple.fr" });
      const bad = async (fields, re) => {
        await boss.post(`${ADMIN}/${id}/modifier?site=${A}`, { mode: "rapide", ...fields });
        assert.match(flashOf((await boss.get(`${ADMIN}?site=${A}`)).text), re);
        assert.equal(row(id).body, "Intacte"); assert.equal(row(id).author_email, "lou@exemple.fr"); assert.equal(row(id).author_name, "Lou");
      };
      await bad({ body: "Intacte", author_name: "Lou", author_email: "pas-un-email" }, /adresse e-mail valide/);
      await bad({ body: "Intacte", author_name: "L" }, /nom/);
      await bad({ body: "  " }, /vide/);
      await bad({ body: "x".repeat(2001) }, /dépasse/);
      await bad({ body: "Intacte", status: "trash" }, /Statut inconnu/);
    });
    test("l'e-mail d'un invité ne se modifie qu'avec le droit comments.email ; le nom d'un membre ne se modifie pas", async () => {
      const id = ins({ post: pA, body: "Droits", name: "Max", email: "max@exemple.fr" });
      await editor.post(`${ADMIN}/${id}/modifier?site=${A}`, { mode: "rapide", body: "Droits modifiés", author_name: "Max", author_email: "pirate@exemple.fr" });
      assert.equal(row(id).body, "Droits modifiés"); assert.equal(row(id).author_email, "max@exemple.fr", "e-mail inchangé sans le droit");
      const m = ins({ post: pA, body: "Membre", user: bossId, name: "" });
      await boss.post(`${ADMIN}/${m}/modifier?site=${A}`, { mode: "rapide", body: "Membre ok", author_name: "Usurpé", author_email: "usurpe@exemple.fr" });
      assert.equal(row(m).body, "Membre ok"); assert.equal(row(m).author_name, ""); assert.equal(row(m).author_email, "");
    });
    test("page « Modifier » : formulaire complet, échappé ; un commentaire de la corbeille ne se modifie pas", async () => {
      const id = ins({ post: pA, body: `Texte <b>gras</b> & "guillemets"`, name: "Nia", email: "nia@exemple.fr" });
      const page = await boss.get(`${ADMIN}/${id}/modifier?site=${A}`);
      assert.equal(page.status, 200); assert.ok(page.text.includes("&lt;b&gt;gras&lt;/b&gt;")); assert.ok(!page.text.includes("<b>gras</b>"));
      assert.match(page.text, /Mettre à jour/);
      const r = await boss.post(`${ADMIN}/${id}/modifier?site=${A}`, { body: "Version complète", author_name: "Nia", author_email: "nia@exemple.fr", status: "pending" });
      assert.equal(r.status, 302); assert.match(r.location || "", /\/modifier/);
      assert.equal(row(id).body, "Version complète"); assert.equal(row(id).status, "pending");
      await boss.post(`${ADMIN}/${id}/corbeille?site=${A}`, {});
      await boss.post(`${ADMIN}/${id}/modifier?site=${A}`, { body: "Tentative" });
      assert.equal(row(id).body, "Version complète");
      assert.match((await boss.get(`${ADMIN}/${id}/modifier?site=${A}`)).text, /dans la corbeille/);
    });
  });

  describe("actions groupées", () => {
    test("rien de sélectionné : refusé ; action inconnue : refusée ; doublons d'identifiants comptés une fois", async () => {
      await boss.post(`${ADMIN}/actions?site=${A}`, [["action", "approuver"]]);
      assert.match(flashOf((await boss.get(`${ADMIN}?site=${A}`)).text), /Sélectionnez au moins un commentaire/);
      const id = ins({ post: pA, body: "Lot doublon", status: "pending", name: "Ola" });
      const r = await boss.post(`${ADMIN}/actions?site=${A}`, pairs("n-importe-quoi", [id])); assert.equal(r.status, 403); assert.equal(row(id).status, "pending");
      await boss.post(`${ADMIN}/actions?site=${A}`, pairs("approuver", [id, id, id]));
      assert.match(flashOf((await boss.get(`${ADMIN}?site=${A}`)).text), /1 commentaire approuvé/);
    });
    test("action du bas de tableau (action2) ; erreurs partielles annoncées", async () => {
      const a = ins({ post: pA, body: "Lot 1", status: "pending", name: "Pam" }); const b = ins({ post: pA, body: "Lot 2", status: "approved", name: "Pam" });
      await boss.post(`${ADMIN}/actions?site=${A}`, [["action", ""], ["action2", "desapprouver"], ["ids", String(a)], ["ids", String(b)]]);
      assert.equal(row(a).status, "pending"); assert.equal(row(b).status, "pending");
      const flash = flashOf((await boss.get(`${ADMIN}?site=${A}`)).text);
      assert.match(flash, /1 commentaire désapprouvé/); assert.match(flash, /1 ignoré/); assert.match(flash, /déjà en attente/);
    });
    test("lot mêlant tous les sites : seuls ceux de la vue sont traités, même pour l'équipe qui a choisi un site", async () => {
      const a = ins({ post: pA, body: "Lot A", status: "pending", name: "Quentin" }); const b = ins({ post: pB, body: "Lot B", status: "pending", name: "Quentin" }); const m = ins({ post: pMain, body: "Lot M", status: "pending", name: "Quentin" });
      await boss.post(`${ADMIN}/actions?site=${A}`, pairs("indesirable", [a, b, m], [["site", String(A)]]));
      assert.equal(row(a).status, "spam"); assert.equal(row(b).status, "pending"); assert.equal(row(m).status, "pending");
      await adminA.post(`${ADMIN}/actions?site=${A}`, pairs("corbeille", [a, b, m]));
      assert.equal(row(b).status, "pending"); assert.equal(row(m).status, "pending");
    });
    test("suppression définitive groupée : corbeille seulement, droit requis", async () => {
      const a = ins({ post: pA, body: "Purge 1", status: "trash", name: "Rémi" }); const b = ins({ post: pA, body: "Purge 2", status: "approved", name: "Rémi" });
      assert.equal((await editor.post(`${ADMIN}/actions?site=${A}`, pairs("supprimer", [a]))).status, 403);
      assert.ok(row(a));
      await boss.post(`${ADMIN}/actions?site=${A}`, pairs("supprimer", [a, b]));
      assert.equal(row(a), undefined); assert.ok(row(b), "un commentaire hors corbeille n'est jamais supprimé définitivement");
    });
  });

  describe("isolation multisite (côté serveur)", () => {
    let cA, cB, cM;
    before(() => { cA = ins({ post: pA, body: "Iso Alpha", status: "pending", name: "Sam", email: "sam@a.fr" }); cB = ins({ post: pB, body: "Iso Beta", status: "pending", name: "Tom", email: "tom@b.fr" }); cM = ins({ post: pMain, body: "Iso Principal", status: "pending", name: "Uma" }); });
    const snapshot = () => JSON.stringify(db.prepare("SELECT id, body, status, author_name, author_email, parent_id FROM blog_comments ORDER BY id").all());
    test("l'accès limité à A ne voit que A (liste, effectifs, recherche, filtre article) ; B refusé", async () => {
      const t = (await adminA.get(`${ADMIN}?site=${A}`)).text;
      assert.match(t, /Iso Alpha/); assert.doesNotMatch(t, /Iso Beta|Iso Principal|Soirée Beta|beatrice|tom@b\.fr/);
      assert.equal((await adminA.get(`${ADMIN}?site=${B}`)).status, 403);
      const total = Number((t.match(/<span>Tous<\/span><span class="mk-tab-count"[^>]*>(\d+)<\/span>/) || [])[1]);
      assert.equal(total, db.prepare("SELECT COUNT(*) n FROM blog_comments c WHERE c.status <> 'trash' AND c.content_id IN (SELECT content_id FROM mk_content_sites WHERE content_type = 'post' AND site_id = ?)").get(A).n, "effectifs bornés au site");
      assert.doesNotMatch((await adminA.get(`${ADMIN}?site=${A}&contenu=post:${pB}`)).text, /Iso Beta/, "le filtre par article d'un autre site ne montre rien");
    });
    test("l'équipe qui choisit B ne voit que B ; ses effectifs sont ceux de B", async () => {
      const t = (await boss.get(`${ADMIN}?site=${B}`)).text;
      assert.match(t, /Iso Beta/); assert.doesNotMatch(t, /Iso Alpha|Iso Principal/);
    });
    test("modifier / approuver / répondre / corbeille sur un commentaire d'un autre site : refusé ou introuvable, aucune écriture", async () => {
      const before = snapshot();
      for (const a of ["approuver", "desapprouver", "indesirable", "corbeille", "restaurer", "supprimer"]) assert.equal((await adminA.post(`${ADMIN}/${cB}/${a}?site=${A}`, {})).status, 403, a);
      assert.equal((await adminA.post(`${ADMIN}/${cB}/repondre?site=${A}`, { body: "Intrusion" })).status, 403);
      assert.equal((await adminA.post(`${ADMIN}/${cB}/modifier?site=${A}`, { mode: "rapide", body: "Piraté", status: "approved" })).status, 403);
      assert.equal((await adminA.post(`${ADMIN}/${cM}/modifier?site=${A}`, { body: "Piraté" })).status, 403, "ni le site principal");
      assert.equal(snapshot(), before);
    });
    test("page de modification d'un commentaire d'un autre site : refusée, sans fuite", async () => {
      const r = await adminA.get(`${ADMIN}/${cB}/modifier?site=${A}`);
      assert.ok([403, 404].includes(r.status)); assert.doesNotMatch(r.text, /Iso Beta|tom@b\.fr/);
      const viaB = await adminA.get(`${ADMIN}/${cB}/modifier?site=${B}`); assert.equal(viaB.status, 403);
    });
    test("identifiant manipulé dans l'adresse de l'équipe : avec ?site=A, un commentaire de B est introuvable (404 / aucune écriture)", async () => {
      const before = snapshot();
      await boss.post(`${ADMIN}/${cB}/approuver?site=${A}`, { site: String(A) });
      await boss.post(`${ADMIN}/${cB}/modifier?site=${A}`, { mode: "rapide", body: "Piraté" });
      await boss.post(`${ADMIN}/${cB}/repondre?site=${A}`, { body: "Intrusion" });
      assert.equal(snapshot(), before);
    });
    test("l'équipe sans site choisi garde ses droits sur tous les sites (comportement historique)", async () => {
      assert.equal((await editor.post(`${ADMIN}/${cB}/approuver`, {})).status, 302);
      assert.equal(row(cB).status, "approved");
    });
    test("les redirections et liens conservent le site courant (jamais le site principal par défaut)", async () => {
      const r = await adminA.post(`${ADMIN}/${cA}/approuver?site=${A}`, { retour: `${ADMIN}/en-attente` });
      assert.match(r.location || "", new RegExp(`site=${A}`));
      const t = (await adminA.get(`${ADMIN}?site=${A}`)).text;
      const links = [...t.matchAll(/href="(\/marketing\/site-web\/commentaires[^"]*)"/g)].map((m) => m[1]);
      assert.ok(links.length > 4); assert.ok(links.every((h) => /site=\d+/.test(h) || /#/.test(h)), "tous les liens de la liste portent le site : " + links.filter((h) => !/site=\d+/.test(h)).join(" "));
      assert.match(t, new RegExp(`name="site" value="${A}"`));
    });
    test("les réponses restent rattachées au site de l'article", async () => {
      const rep = await adminB.post(`${ADMIN}/${cB}/repondre?site=${B}`, { body: "Réponse côté Beta" });
      assert.equal(rep.status, 302);
      const r = one("SELECT * FROM blog_comments WHERE body = 'Réponse côté Beta'");
      assert.equal(r.content_id, pB); assert.equal(one("SELECT site_id FROM mk_content_sites WHERE content_type = 'post' AND content_id = ?", r.content_id).site_id, B);
      assert.doesNotMatch((await adminA.get(`${ADMIN}?site=${A}`)).text, /Réponse côté Beta/);
    });
    test("« Les miens » est borné au site : mes commentaires d'un autre site n'y figurent pas", async () => {
      ins({ post: pB, body: "Mien chez Beta", user: bossId, name: "" });
      assert.doesNotMatch((await boss.get(`${ADMIN}/les-miens?site=${A}`)).text, /Mien chez Beta/);
      assert.match((await boss.get(`${ADMIN}/les-miens?site=${B}`)).text, /Mien chez Beta/);
    });
    test("le contenu d'un commentaire reste une donnée non fiable : jamais de HTML brut dans la liste", async () => {
      ins({ post: pA, body: `<img src=x onerror=alert(1)> "q" & <b>b</b>`, name: `<i>Pirate</i>`, email: `a"b@x.fr` });
      const t = (await boss.get(`${ADMIN}?site=${A}&q=onerror`)).text;
      assert.ok(!t.includes("<img src=x") && !t.includes("<i>Pirate</i>"));
    });
  });
});
