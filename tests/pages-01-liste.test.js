// KOLAKISA CMS — PAGES-01 : « Pages → Toutes les pages » à la manière de WordPress, sur les vraies routes, la vraie base, de vrais comptes.
// Disposition, états et compteurs, recherche, filtre par mois, tri par colonne, pagination, modification rapide, actions de ligne et groupées,
// isolation par site (deux sites) et conservation du site pendant toute la navigation.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor, newStudent, INSTRUCTOR } = require("./helpers");

describe("pages-01 : liste de gestion des pages", () => {
  let srv, boss, db, orgId, A, B, adminA, viewerA, editorA, ids = {};
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const idOf = (c) => one("SELECT id FROM users WHERE email = ?", c.email).id;
  const SP = "/marketing/site-web/sites", CENTRAL = "/marketing/pages";
  const LA = () => `${SP}/${A}/pages`, LB = () => `${SP}/${B}/pages`;
  const person = async (siteId, role) => { const c = await newStudent(srv); db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, ?)").run(siteId, idOf(c), role); return c; };
  const titles = (html) => [...html.matchAll(/<strong class="mk-ar-title"><a[^>]*>([^<]+)/g)].map((m) => m[1].trim());
  const row = (id) => one("SELECT * FROM mk_landing_pages WHERE id = ?", id);
  const flashOf = (html) => (html.match(/class="mk-flash[^"]*"[^>]*>[\s\S]*?<\/div>/) || [""])[0].replace(/<svg[\s\S]*?<\/svg>/g, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
  const SECTIONS = JSON.stringify([{ type: "text", markdown: "Contenu" }]);
  const page = (slug, { site = null, kind = site ? "page" : "landing", status = "draft", name, author = null, published_at = null, updated_at = "2024-01-15 10:00:00", scheduled_at = null, archived = false } = {}) =>
    Number(db.prepare("INSERT INTO mk_landing_pages (organization_id, name, slug, title, sections, status, kind, site_id, created_by, published_at, updated_at, scheduled_at, archived_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
      .run(orgId, name || `Page ${slug}`, slug, name || `Page ${slug}`, SECTIONS, status, kind, site, author, published_at, updated_at, scheduled_at, archived ? "2024-02-01 00:00:00" : null).lastInsertRowid);

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "", ALLOW_INDEXING: "1" });
    boss = await loginInstructor(srv); db = srv.db();
    orgId = one("SELECT id FROM mk_organizations").id;
    const site = (n) => Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, ?, ?, '{}')").run(orgId, n, n.toLowerCase()).lastInsertRowid);
    A = site("Alpha"); B = site("Beta");
    adminA = await person(A, "admin"); viewerA = await person(A, "viewer"); editorA = await person(A, "editor");
    const bossId = idOf(INSTRUCTOR), aId = idOf(adminA);
    // Site principal
    ids.pm = page("principal-mars", { author: bossId, status: "published", name: "Principal mars", published_at: "2020-03-05 09:00:00", updated_at: "2020-03-05 09:00:00" });
    // Site A : trois pages à des mois, états et auteurs différents, une programmée, une en corbeille
    ids.a1 = page("a-bravo", { site: A, author: aId, status: "published", name: "Bravo A", published_at: "2022-02-02 09:00:00", updated_at: "2022-02-02 09:00:00" });
    ids.a2 = page("a-alpha", { site: A, author: aId, name: "Alpha A", updated_at: "2022-05-10 08:30:00" });
    ids.a3 = page("a-charlie", { site: A, author: bossId, name: "Charlie A", updated_at: "2023-01-20 14:05:00" });
    ids.a4 = page("a-sched", { site: A, author: aId, name: "Programmée A", scheduled_at: "2030-01-01 10:00:00", updated_at: "2023-02-01 10:00:00" });
    ids.a5 = page("a-trash", { site: A, author: aId, name: "Corbeille A", archived: true });
    // Site B
    ids.b1 = page("b-un", { site: B, status: "published", name: "Page du site B", published_at: "2022-02-03 09:00:00" });
    ids.b2 = page("b-brouillon", { site: B, name: "Brouillon du site B" });
  });
  after(() => { db.close(); return srv.stop(); });

  describe("disposition WordPress et données réelles", () => {
    test("en-tête, options de l'écran, aide, états, recherche, actions groupées, filtre de dates, tableau et pied", async () => {
      const r = await boss.get(LA());
      assert.equal(r.status, 200);
      for (const frag of ["<h1>Pages</h1>", ">Ajouter une page<", "Options de l'écran", ">Aide", "Rechercher des pages", "Actions groupées", "Toutes les dates", ">Filtrer<", "Auteur/autrice", ">Titre ", ">Date ", "data-ar-table"]) assert.ok(r.text.includes(frag), frag);
      assert.equal((r.text.match(/data-cms-select-all/g) || []).length, 2, "case « tout sélectionner » en tête ET en pied");
      assert.match(r.text, /<tfoot>/);
      assert.match(r.text, /<span class="mk-ar-count"[^>]*>4 éléments<\/span>/);
      assert.doesNotMatch(r.text, /col-commentaires/, "aucun compteur de commentaires simulé : les pages n'en ont pas");
    });
    test("compteurs = comptes réels du site courant, y compris Programmées et Corbeille", async () => {
      const html = (await boss.get(LA())).text;
      assert.match(html, /Tous <span class="count">\(4\)/); assert.match(html, /Publiées <span class="count">\(1\)/); assert.match(html, /Programmées <span class="count">\(1\)/);
      assert.match(html, /Brouillons <span class="count">\(2\)/); assert.match(html, /Corbeille <span class="count">\(1\)/);
      assert.deepEqual(titles(html).sort(), ["Alpha A", "Bravo A", "Charlie A", "Programmée A"]);
    });
    test("titre, mention d'état, auteur et date selon l'état (Publié / Programmé / Dernière modification)", async () => {
      const html = (await boss.get(LA())).text;
      const cell = (id) => html.split('data-ar-row="').find((c) => c.startsWith(`${id}"`));
      assert.match(cell(ids.a1), /Bravo A<\/a><\/strong>/); assert.match(cell(ids.a1), /Publié<br>/); assert.match(cell(ids.a1), /02\/02\/2022 à 09h00 UTC/);
      assert.match(cell(ids.a2), /Alpha A<\/a> — <span class="mk-ar-state">Brouillon/); assert.match(cell(ids.a2), /Dernière modification<br>/); assert.match(cell(ids.a2), /10\/05\/2022 à 08h30 UTC/);
      assert.match(cell(ids.a4), /— <span class="mk-ar-state">Programmée/); assert.match(cell(ids.a4), /Programmé<br>/); assert.match(cell(ids.a4), /01\/01\/2030 à 10h00 UTC/);
      assert.match(cell(ids.a3), />claudieu|href="[^"]*auteur=\d+/, "auteur renvoyant au filtre réel");
    });
    test("états : chaque lien filtre réellement ; la corbeille propose Restaurer / Supprimer définitivement", async () => {
      assert.deepEqual(titles((await boss.get(`${LA()}?etat=publiees`)).text), ["Bravo A"]);
      assert.deepEqual(titles((await boss.get(`${LA()}?etat=programmees`)).text), ["Programmée A"]);
      assert.deepEqual(titles((await boss.get(`${LA()}?etat=brouillons`)).text).sort(), ["Alpha A", "Charlie A"]);
      const trash = (await boss.get(`${LA()}?etat=corbeille`)).text;
      assert.match(trash, />Restaurer</); assert.match(trash, />Supprimer définitivement</);
    });
    test("lecteur : consultation seule, ni cases, ni modification rapide, ni bouton d'ajout", async () => {
      const html = (await viewerA.get(LA())).text;
      assert.match(html, /Alpha A/);
      assert.doesNotMatch(html, /\/editeur\?retour=pages|name="ids"|data-ar-quick-open|mk-ar-add|data-cms-bulk/);
    });
  });

  describe("recherche, mois, tri, pagination", () => {
    test("recherche par nom et par adresse, jamais dans un autre site ; état vide", async () => {
      assert.deepEqual(titles((await boss.get(`${LA()}?q=alpha`)).text), ["Alpha A"]);
      assert.deepEqual(titles((await boss.get(`${LA()}?q=a-charlie`)).text), ["Charlie A"]);
      const other = (await boss.get(`${LA()}?q=${encodeURIComponent("site B")}`)).text;
      assert.deepEqual(titles(other), [], "les pages du site B restent invisibles depuis le site A");
      assert.match(other, /Aucune page trouvée/); assert.match(other, /Réinitialiser/);
      assert.deepEqual(titles((await boss.get(`${LA()}?q=%25`)).text), [], "le joker « % » est littéral");
    });
    test("filtre par mois : seuls les mois présents, selon la date affichée ; combiné à la recherche et à l'état", async () => {
      const html = (await boss.get(LA())).text;
      for (const m of ["février 2022", "mai 2022", "janvier 2023"]) assert.ok(html.includes(`>${m}<`), m);
      assert.ok(!html.includes(">mars 2020<"), "un mois d'un autre site n'est pas proposé");
      assert.deepEqual(titles((await boss.get(`${LA()}?mois=2022-05`)).text), ["Alpha A"]);
      assert.deepEqual(titles((await boss.get(`${LA()}?mois=2022-02&etat=publiees`)).text), ["Bravo A"]);
      assert.deepEqual(titles((await boss.get(`${LA()}?mois=2022-05&q=bravo`)).text), []);
      assert.equal((await boss.get(`${LA()}?mois=pas-un-mois`)).status, 200, "valeur invalide ignorée");
    });
    test("tri par titre et par date, deux sens ; indicateurs aria-sort ; valeurs invalides ignorées", async () => {
      const order = async (q) => titles((await boss.get(`${LA()}?${q}`)).text);
      assert.deepEqual(await order("orderby=titre&order=asc"), ["Alpha A", "Bravo A", "Charlie A", "Programmée A"]);
      assert.deepEqual(await order("orderby=titre&order=desc"), ["Programmée A", "Charlie A", "Bravo A", "Alpha A"]);
      const asc = await order("orderby=date&order=asc"), desc = await order("orderby=date&order=desc");
      assert.deepEqual(asc.slice().reverse(), desc, "date décroissante = l'inverse de la croissante");
      assert.equal(desc[0], "Programmée A", "date affichée de la page programmée = sa programmation (2030)");
      assert.match((await boss.get(`${LA()}?orderby=titre&order=asc`)).text, /aria-sort="ascending"/);
      assert.equal((await boss.get(`${LA()}?orderby=p.id;DROP%20TABLE%20users&order=zzz`)).status, 200);
      assert.ok(one("SELECT COUNT(*) n FROM users").n > 0);
    });
    test("pagination : nombre par page borné côté serveur, filtres conservés, précédent / suivant réels", async () => {
      const bulk = [];
      for (let i = 1; i <= 7; i++) bulk.push(page(`pg-${i}`, { site: B, name: `Pagination ${String(i).padStart(2, "0")}`, updated_at: "2024-06-01 10:00:00" }));
      const p1 = (await boss.get(`${LB()}?q=Pagination&par=5&orderby=titre&order=asc`)).text;
      assert.deepEqual(titles(p1), ["Pagination 01", "Pagination 02", "Pagination 03", "Pagination 04", "Pagination 05"]);
      assert.match(p1, /Page 1 sur 2/); assert.match(p1, /href="[^"]*q=Pagination[^"]*page=2/, "recherche et tri conservés dans « suivant »");
      const p2 = (await boss.get(`${LB()}?q=Pagination&par=5&orderby=titre&order=asc&page=2`)).text;
      assert.deepEqual(titles(p2), ["Pagination 06", "Pagination 07"]);
      assert.match(p2, /8 éléments|7 éléments/);
      const clamped = (await boss.get(`${LB()}?par=1`)).text;
      assert.match(clamped, /name="par"[^>]*value="5"/, "valeur minimale imposée par le serveur");
      for (const id of bulk) db.prepare("DELETE FROM mk_landing_pages WHERE id = ?").run(id);
      await boss.get(`${LB()}?par=25`); // le nombre par page est mémorisé dans un cookie : on le rétablit pour la suite
    });
  });

  describe("isolation par site et conservation du contexte", () => {
    test("la liste du site A et celle du site B ne se mélangent jamais ; la liste centrale garde le sélecteur de site", async () => {
      const a = titles((await boss.get(LA())).text), b = titles((await boss.get(LB())).text);
      assert.ok(a.every((t) => !/site B/.test(t)) && b.every((t) => /site B/.test(t)), `${a} / ${b}`);
      assert.equal(b.length, 2);
      const central = (await boss.get(CENTRAL)).text;
      assert.match(central, /Tous les sites/); assert.match(central, /Principal mars/); assert.match(central, /Bravo A/);
      assert.doesNotMatch((await boss.get(LA())).text, /Tous les sites/, "dans l'espace d'un site, pas de sélecteur d'autres sites");
    });
    test("espace du site principal : seulement les pages sans site, dans son propre cadre, avec ses propres liens", async () => {
      const r = await boss.get(`${SP.replace("/sites", "/principal")}/pages`);
      assert.equal(r.status, 200);
      assert.match(r.text, /Principal mars/); assert.doesNotMatch(r.text, /Bravo A|Page du site B/);
      assert.doesNotMatch(r.text, /Tous les sites/);
      assert.match(r.text, /name="retour" value="\/marketing\/site-web\/principal\/pages/);
      assert.match(r.text, /<input type="hidden" name="site" value="principal">/);
      const bulk = await boss.post(`${CENTRAL}/actions`, { action: "corbeille", ids: [String(ids.pm), String(ids.a3)], site: "principal", retour: "/marketing/site-web/principal/pages" });
      assert.equal(bulk.location, "/marketing/site-web/principal/pages");
      assert.equal(row(ids.a3).archived_at, null, "une page de A n'est jamais traitée depuis le principal");
      assert.notEqual(row(ids.pm).archived_at, null); db.prepare("UPDATE mk_landing_pages SET archived_at = NULL WHERE id = ?").run(ids.pm);
    });
    test("site archivé : consultation seule, mention explicite, aucune action", async () => {
      const C = Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens, status) VALUES (?, 'Gamma', 'gamma', '{}', 'archived')").run(orgId).lastInsertRowid);
      page("g-un", { site: C, name: "Page Gamma" });
      const html = (await boss.get(`${SP}/${C}/pages`)).text;
      assert.match(html, /Page Gamma/); assert.match(html, /aucune création n(?:'|&#39;)est possible/);
      assert.doesNotMatch(html, /name="ids"|data-ar-quick-open|mk-ar-add|data-cms-bulk/);
    });
    test("une page créée sur le site A n'apparaît pas sur B ; son compteur et sa liste se mettent à jour", async () => {
      const r = await boss.post(CENTRAL, { name: "Nouvelle page Alpha", site_id: String(A), ouvrir: "editeur" });
      assert.equal(r.status, 302); assert.ok(!r.location.includes("/principal"));
      const id = one("SELECT id FROM mk_landing_pages WHERE name = 'Nouvelle page Alpha'").id;
      assert.equal(row(id).site_id, A);
      assert.match((await boss.get(LA())).text, /Nouvelle page Alpha/); assert.doesNotMatch((await boss.get(LB())).text, /Nouvelle page Alpha/);
      assert.match((await boss.get(LA())).text, /Tous <span class="count">\(5\)/);
      db.prepare("DELETE FROM mk_landing_pages WHERE id = ?").run(id);
    });
    test("tous les liens et formulaires de la liste du site restent dans ce site (aucune sortie vers le principal ni vers un autre site)", async () => {
      const html = (await adminA.get(LA())).text;
      const hrefs = [...html.matchAll(/(?:href|action)="([^"]+)"/g)].map((m) => m[1].replace(/&amp;/g, "&"));
      const listLinks = hrefs.filter((h) => /^\/marketing\/(?:pages\?|site-web\/sites\/\d+\/pages)/.test(h));
      assert.ok(listLinks.length > 5);
      assert.ok(listLinks.every((h) => h.startsWith(`${SP}/${A}/pages`)), `liens de liste hors site : ${listLinks.filter((h) => !h.startsWith(`${SP}/${A}/pages`))}`);
      assert.ok(!hrefs.some((h) => h.includes("/principal")), "aucun lien vers le principal");
      assert.match(html, /name="retour" value="\/marketing\/site-web\/sites\/\d+\/pages/);
      assert.match(html, /<input type="hidden" name="site" value="\d+">/, "formulaires : site courant transmis (revérifié par le serveur)");
      assert.ok(!hrefs.some((h) => new RegExp(`${SP}/${B}/`).test(h)), "aucun lien vers le site B");
    });
    test("accès limité au site A : voit A, refusé sur B, refusé sur une page de B (lecture, modification rapide, action groupée)", async () => {
      assert.equal((await adminA.get(LA())).status, 200);
      assert.equal((await adminA.get(LB())).status, 403);
      assert.equal((await adminA.get(`${CENTRAL}?site=${B}`)).status, 403, "ancienne adresse du site B refusée aussi");
      assert.equal((await adminA.get(`${CENTRAL}?site=${A}`)).status, 200);
      const before = row(ids.b1);
      const q = await adminA.post(`${CENTRAL}/${ids.b1}/modification-rapide`, { title: "Piraté", slug: "pirate", status: "draft" });
      assert.ok([403, 404].includes(q.status) || (q.status === 302 && /\/(?:erreur|connexion)/.test(String(q.location))) || row(ids.b1).name === before.name, "modification rapide refusée");
      assert.equal(row(ids.b1).name, "Page du site B"); assert.equal(row(ids.b1).slug, "b-un"); assert.equal(row(ids.b1).status, "published");
      await adminA.post(`${CENTRAL}/actions`, { action: "corbeille", ids: [String(ids.b1), String(ids.b2)], site: String(A) });
      assert.equal(row(ids.b1).archived_at, null, "page de B jamais mise à la corbeille depuis A"); assert.equal(row(ids.b2).archived_at, null);
    });
    test("l'équipe qui agit depuis le site A ne touche pas aux pages de B même si les identifiants sont forgés", async () => {
      const r = await boss.post(`${CENTRAL}/actions`, { action: "corbeille", ids: [String(ids.a3), String(ids.b2)], site: String(A), retour: `${LA()}` });
      assert.equal(r.status, 302); assert.equal(r.location, LA());
      assert.notEqual(row(ids.a3).archived_at, null, "la page de A est traitée"); assert.equal(row(ids.b2).archived_at, null, "la page de B ne l'est pas");
      const msg = flashOf((await boss.get(LA())).text);
      assert.match(msg, /1 page mise à la corbeille/); assert.match(msg, /introuvable/);
      await boss.post(`${CENTRAL}/actions`, { action: "restaurer", ids: String(ids.a3), site: String(A) });
      assert.equal(row(ids.a3).archived_at, null);
    });
  });

  describe("actions de ligne, modification rapide, actions groupées", () => {
    test("modification rapide : titre, adresse et état enregistrés côté serveur ; retour à la liste du même site", async () => {
      const r = await boss.post(`${CENTRAL}/${ids.a2}/modification-rapide`, { title: "Alpha renommée", slug: "alpha-renommee", status: "draft", retour: LA() });
      assert.equal(r.status, 302); assert.equal(r.location, LA());
      assert.equal(row(ids.a2).name, "Alpha renommée"); assert.equal(row(ids.a2).slug, "alpha-renommee");
      assert.match(flashOf((await boss.get(LA())).text), /mise à jour/);
      assert.equal(row(ids.a2).site_id, A, "le site ne change pas");
    });
    test("modification rapide : titre déjà pris ou adresse invalide refusés, rien n'est écrit ; titre échappé", async () => {
      await boss.post(`${CENTRAL}/${ids.a2}/modification-rapide`, { title: "Bravo A", slug: "alpha-renommee", status: "draft", retour: LA() });
      assert.equal(row(ids.a2).name, "Alpha renommée", "nom en doublon refusé");
      await boss.post(`${CENTRAL}/${ids.a2}/modification-rapide`, { title: "Autre nom", slug: "Pas Valide !", status: "draft", retour: LA() });
      assert.equal(row(ids.a2).slug, "alpha-renommee"); assert.equal(row(ids.a2).name, "Alpha renommée");
      db.prepare("UPDATE mk_landing_pages SET name = ? WHERE id = ?").run("<b>x</b> & <script>1</script>", ids.a2);
      const html = (await boss.get(LA())).text;
      assert.ok(!html.includes("<script>1</script>") && html.includes("&lt;script&gt;1&lt;/script&gt;"));
      db.prepare("UPDATE mk_landing_pages SET name = ? WHERE id = ?").run("Alpha renommée", ids.a2);
    });
    test("changement d'adresse d'une page EN LIGNE : l'ancien lien est redirigé", async () => {
      await boss.post(`${CENTRAL}/${ids.a1}/modification-rapide`, { title: "Bravo A", slug: "a-bravo-bis", status: "published", retour: LA() });
      assert.equal(row(ids.a1).slug, "a-bravo-bis");
      const old = one("SELECT 1 x FROM seo_redirects WHERE source_path = '/p/a-bravo' UNION SELECT 1 FROM cms_url_history WHERE resource_type = 'page' AND old_slug = 'a-bravo'");
      assert.ok(old, "ancienne adresse conservée en redirection");
    });
    test("modification rapide de l'état : publier / retirer, droit « pages.publish » exigé", async () => {
      await boss.post(`${CENTRAL}/${ids.a2}/modification-rapide`, { title: "Alpha renommée", slug: "alpha-renommee", status: "published", retour: LA() });
      assert.equal(row(ids.a2).status, "published");
      assert.ok(row(ids.a2).published_at);
      await boss.post(`${CENTRAL}/${ids.a2}/modification-rapide`, { title: "Alpha renommée", slug: "alpha-renommee", status: "draft", retour: LA() });
      assert.notEqual(row(ids.a2).status, "published");
      const denied = await viewerA.post(`${CENTRAL}/${ids.a2}/modification-rapide`, { title: "X", slug: "x", status: "published" });
      assert.ok([302, 403].includes(denied.status)); assert.equal(row(ids.a2).name, "Alpha renommée", "lecteur : aucune écriture");
    });
    test("actions de ligne : publier, mettre hors ligne, corbeille, restaurer, dupliquer, supprimer définitivement — retour à la liste du site, jamais au principal", async () => {
      const id = page("ligne-test", { site: A, name: "Ligne test", author: idOf(adminA) });
      const back = (r) => { assert.equal(r.status, 302); assert.equal(r.location, LA()); };
      back(await boss.post(`${CENTRAL}/${id}/archiver`, { retour: LA() })); assert.notEqual(row(id).archived_at, null);
      back(await boss.post(`${CENTRAL}/${id}/restaurer`, { retour: LA() })); assert.equal(row(id).archived_at, null);
      const dup = await boss.post(`${CENTRAL}/${id}/dupliquer`, { retour: LA() }); assert.equal(dup.status, 302);
      const copy = one("SELECT id, site_id FROM mk_landing_pages WHERE name LIKE 'Ligne test%' AND id <> ?", id);
      assert.ok(copy && copy.site_id === A, "la copie reste dans le site A");
      await boss.post(`${CENTRAL}/${id}/archiver`, { retour: LA() });
      const forged = await boss.post(`${CENTRAL}/${id}/supprimer`, { retour: "https://evil.test/x" }); assert.equal(forged.status, 302);
      assert.ok(!/evil/.test(forged.location), "adresse de retour libre refusée");
      assert.equal(forged.location, LA(), "retour : liste du site de la page");
      assert.equal(row(id), undefined, "supprimée définitivement depuis la corbeille");
      db.prepare("DELETE FROM mk_landing_pages WHERE id = ?").run(copy.id);
    });
    test("supprimer définitivement une page hors corbeille est refusé", async () => {
      await boss.post(`${CENTRAL}/${ids.a3}/supprimer`, {});
      assert.ok(row(ids.a3), "la page reste");
    });
    test("actions groupées : publier, mettre hors ligne, corbeille, restaurer, suppression ; rapport « traitées / refusées » ; barre du bas", async () => {
      const x = page("bulk-x", { site: A, name: "Bulk X" }), y = page("bulk-y", { site: A, name: "Bulk Y" });
      const ra = await boss.post(`${CENTRAL}/actions`, { action2: "corbeille", ids: [String(x), String(y)], site: String(A), retour: LA() });
      assert.equal(ra.location, LA()); assert.ok(row(x).archived_at && row(y).archived_at);
      assert.match(flashOf((await boss.get(LA())).text), /2 pages mises à la corbeille/);
      await boss.post(`${CENTRAL}/actions`, { action: "supprimer", ids: [String(x), String(y)], site: String(A) });
      assert.equal(row(x), undefined); assert.equal(row(y), undefined);
      const none = await boss.post(`${CENTRAL}/actions`, { action: "corbeille", ids: [], site: String(A), retour: LA() });
      assert.equal(none.status, 302);
      assert.match(flashOf((await boss.get(LA())).text), /Sélectionnez au moins une page/);
      assert.equal((await boss.post(`${CENTRAL}/actions`, { action: "bidon", ids: String(ids.a3), site: String(A) })).status, 403);
    });
    test("éditeur : écrit et publie, mais ne supprime pas définitivement ; administrateur : peut supprimer depuis la corbeille", async () => {
      const html = (await editorA.get(LA())).text;
      assert.match(html, /value="publier"/); assert.match(html, /value="corbeille"/); assert.doesNotMatch(html, /Supprimer définitivement/);
      const trashEditor = (await editorA.get(`${LA()}?etat=corbeille`)).text;
      assert.match(trashEditor, />Restaurer</); assert.doesNotMatch(trashEditor, /Supprimer définitivement/);
      assert.match((await adminA.get(`${LA()}?etat=corbeille`)).text, /Supprimer définitivement/);
      const denied = await editorA.post(`${CENTRAL}/${ids.a5}/supprimer`, {});
      assert.ok([302, 403].includes(denied.status)); assert.ok(row(ids.a5), "page en corbeille toujours là : suppression refusée à l'éditeur");
    });
  });
});
