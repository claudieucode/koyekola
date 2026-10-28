// « Blog » de Mon espace (/formateur/blog) : espace de travail éditorial. Liste paginée dans la base (le contenu des articles n'est jamais envoyé), onglets d'état aux effectifs réels, recherche, tri,
// actions qui passent par le service partagé avec le CMS (contrôle avant publication, corbeille réversible, duplication), retour à la liste sans adresse libre, accès réservé au créateur, échappement.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor, newStudent, Client } = require("./helpers");

const read = (...p) => fs.readFileSync(path.join(__dirname, "..", ...p), "utf8");

describe("Blog : aides de la page (unitaire)", () => {
  const ws = require("../src/services/blogWorkspace");
  test("paramètres : valeurs inconnues ramenées aux valeurs par défaut, jamais conservées", () => {
    assert.deepEqual(ws.parse({}), { etat: "toutes", q: "", tri: "modifie", page: 1 });
    assert.deepEqual(ws.parse({ etat: "corbeille", q: "  seo  ", tri: "titre", page: "3" }), { etat: "corbeille", q: "seo", tri: "titre", page: 3 });
    assert.deepEqual(ws.parse({ etat: "http://evil", tri: "1; DROP TABLE posts", page: "-4" }), { etat: "toutes", q: "", tri: "modifie", page: 1 });
    assert.equal(ws.parse({ q: "x".repeat(500) }).q.length, 100);
    assert.deepEqual(ws.parse({ etat: ["toutes", "publies"], q: ["a", "b"] }), { etat: "publies", q: "b", tri: "modifie", page: 1 }, "valeur répétée : la dernière l'emporte");
  });
  test("adresses : seuls les paramètres non par défaut figurent, encodés", () => {
    const base = ws.parse({});
    assert.equal(ws.url(base), "/formateur/blog");
    assert.equal(ws.url(base, { etat: "publies", page: 2 }), "/formateur/blog?etat=publies&page=2");
    assert.equal(ws.url({ ...base, q: "a&b=c d" }), "/formateur/blog?q=a%26b%3Dc+d");
    assert.match(ws.url({ ...base, q: "//evil.example" }), /^\/formateur\/blog\?/);
  });
  test("synthèse : effectifs réels, rien d'inventé", () => {
    assert.match(ws.summary({ toutes: 0, publies: 0, programmes: 0, brouillons: 0, corbeille: 0 }), /Rédigez/);
    assert.equal(ws.summary({ toutes: 6, publies: 3, programmes: 1, brouillons: 2, corbeille: 4 }), "6 articles : 3 publiés, 1 programmé, 2 brouillons.");
    assert.equal(ws.summary({ toutes: 1, publies: 0, programmes: 0, brouillons: 1, corbeille: 0 }), "1 article : 1 brouillon.");
  });
});

describe("Blog : espace de travail (serveur réel)", () => {
  let srv, prof, eleve, db, orgId, siteB;
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const all = (sql, ...a) => db.prepare(sql).all(...a);
  const add = (title, { status = "draft", content = "<p>Texte de l'article.</p>", author = 1, at = "2026-03-10 09:00:00", slug } = {}) =>
    Number(db.prepare("INSERT INTO posts (slug, title, content, published, status, author_id, published_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
      .run(slug || title.toLowerCase().replace(/\W+/g, "-") + "-" + Math.random().toString(36).slice(2, 6), title, content, status === "published" ? 1 : 0, status, author, status === "published" || status === "scheduled" ? at : null, at, at).lastInsertRowid);
  const row = (id) => one("SELECT * FROM posts WHERE id = ?", id);
  const titles = (html) => [...html.matchAll(/<a class="bl-title"[^>]*>([^<]*)<\/a>|<span class="bl-title">([^<]*)<\/span>/g)].map((m) => (m[1] ?? m[2]).trim());
  const flash = (html) => ((html.match(/<div class="bl-flash[^"]*"[\s\S]*?<\/div>/) || [""])[0]).replace(/<form[\s\S]*?<\/form>/g, "").replace(/<[^>]+>/g, " ").replace(/&#39;/g, "'").replace(/\s+/g, " ").trim();
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    prof = await loginInstructor(srv); eleve = await newStudent(srv); db = srv.db();
    orgId = one("SELECT id FROM mk_organizations").id;
    siteB = Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, ?, ?, '{}')").run(orgId, "Site Beta", "beta").lastInsertRowid);
  });
  after(() => { try { db.close(); } catch { /* déjà fermée */ } srv.stop(); });

  test("accès : anonyme renvoyé à la connexion, élève refusé — liste et chaque action", async () => {
    const id = add("Protégé");
    assert.equal((await new Client(srv.base).get("/formateur/blog")).status, 302);
    assert.equal((await eleve.get("/formateur/blog")).status, 403);
    for (const action of ["publier", "depublier", "supprimer", "restaurer", "dupliquer", "supprimer-definitivement"]) {
      assert.equal((await eleve.post(`/formateur/blog/${id}/${action}`, {})).status, 403, action);
      assert.equal((await new Client(srv.base).post(`/formateur/blog/${id}/${action}`, {})).status, 302, `${action} (anonyme)`);
    }
    assert.equal(one("SELECT status, deleted_at FROM posts WHERE id = ?", id).deleted_at, null, "rien n'a été modifié");
    db.prepare("DELETE FROM posts").run();
  });

  test("aucun article : état vide explicite avec l'action utile ; effectifs à zéro", async () => {
    const r = await prof.get("/formateur/blog");
    assert.equal(r.status, 200);
    assert.match(r.text, /<h1>Blog<\/h1>/);
    assert.match(r.text, /Aucun article pour le moment/);
    assert.match(r.text, /href="\/formateur\/blog\/nouveau"[^>]*>[\s\S]*Rédiger le premier article/);
    assert.match(r.text, /Rédigez, programmez et publiez vos articles/);
    assert.match((await prof.get("/formateur/blog?etat=corbeille")).text, /La corbeille est vide/);
  });

  test("liste : onglets aux effectifs réels, 20 par page, contenu jamais envoyé, pagination complète", async () => {
    for (let i = 0; i < 37; i++) add(`Brouillon ${String(i).padStart(2, "0")}`, { at: `2026-04-${String(1 + (i % 27)).padStart(2, "0")} 10:00:00`, content: `<p>CORPS-SECRET-${i}</p>` });
    for (let i = 0; i < 5; i++) add(`En ligne ${i}`, { status: "published", at: `2026-05-0${i + 1} 10:00:00` });
    add("Programmé unique", { status: "scheduled", at: "2030-01-01 10:00:00" });
    const gone = add("Déjà supprimé"); db.prepare("UPDATE posts SET deleted_at = datetime('now'), deleted_from_status = 'draft' WHERE id = ?").run(gone);
    const p1 = await prof.get("/formateur/blog");
    assert.equal(titles(p1.text).length, 20);
    assert.match(p1.text, /Tous <span>43<\/span>/);
    assert.match(p1.text, /Publiés <span>5<\/span>/);
    assert.match(p1.text, /Programmés <span>1<\/span>/);
    assert.match(p1.text, /Brouillons <span>37<\/span>/);
    assert.match(p1.text, /Corbeille <span>1<\/span>/);
    assert.match(p1.text, /43 articles · page 1 sur 3/);
    assert.doesNotMatch(p1.text, /CORPS-SECRET/, "le contenu n'est pas chargé dans la liste");
    assert.doesNotMatch(p1.text, /Déjà supprimé/, "la corbeille n'est pas dans « Tous »");
    const seen = new Set(titles(p1.text));
    for (const n of [2, 3]) for (const t of titles((await prof.get(`/formateur/blog?page=${n}`)).text)) seen.add(t);
    assert.equal(seen.size, 43, "tous les articles sont atteignables par la pagination");
    assert.match(p1.text, /rel="next"/); assert.doesNotMatch(p1.text, /rel="prev"/);
    assert.equal((await prof.get("/formateur/blog?page=999")).status, 200);
  });

  test("états : chaque onglet ne montre que ses articles", async () => {
    assert.deepEqual(titles((await prof.get("/formateur/blog?etat=programmes")).text), ["Programmé unique"]);
    assert.equal(titles((await prof.get("/formateur/blog?etat=publies")).text).length, 5);
    assert.deepEqual(titles((await prof.get("/formateur/blog?etat=corbeille")).text), ["Déjà supprimé"]);
    assert.match((await prof.get("/formateur/blog?etat=publies")).text, /aria-current="true">Publiés/);
  });

  test("recherche (titre, adresse, texte) et tri, combinables ; % et _ sont du texte", async () => {
    add("Guide du référencement", { content: "<p>mot-rare-xyzzy</p>", slug: "guide-seo-special" });
    assert.deepEqual(titles((await prof.get("/formateur/blog?q=r%C3%A9f%C3%A9rencement")).text), ["Guide du référencement"]);
    assert.deepEqual(titles((await prof.get("/formateur/blog?q=guide-seo-special")).text), ["Guide du référencement"], "par adresse");
    assert.deepEqual(titles((await prof.get("/formateur/blog?q=xyzzy")).text), ["Guide du référencement"], "dans le texte");
    const none = await prof.get("/formateur/blog?q=zzzintrouvablezzz");
    assert.match(none.text, /Aucun article ne correspond/);
    assert.match(none.text, /Réinitialiser la recherche/);
    assert.equal(titles((await prof.get("/formateur/blog?q=%25")).text).length, 0, "« % » ne correspond pas à tout");
    const asc = titles((await prof.get("/formateur/blog?etat=publies&tri=titre")).text), desc = titles((await prof.get("/formateur/blog?etat=publies&tri=titre_desc")).text);
    assert.deepEqual(asc, [...asc].sort((a, b) => a.localeCompare(b, "fr")));
    assert.deepEqual(desc, [...asc].reverse());
    assert.equal((await prof.get("/formateur/blog?tri=1;DROP")).status, 200, "tri inconnu : ignoré");
    assert.ok(one("SELECT COUNT(*) n FROM posts").n > 40, "la table est intacte");
  });

  test("publier : passe par le service partagé (même résultat que le CMS) et le dit ; un article vide est refusé sans rien modifier", async () => {
    const id = add("À publier");
    const r = await prof.post(`/formateur/blog/${id}/publier`, { etat: "toutes" });
    assert.equal(r.status, 302);
    assert.equal(row(id).status, "published"); assert.equal(row(id).published, 1);
    assert.match(row(id).published_at, /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
    assert.match(flash((await prof.get("/formateur/blog")).text), /« À publier » est publié/);
    assert.equal(flash((await prof.get("/formateur/blog")).text), "", "le message ne s'affiche qu'une fois");
    assert.ok(one("SELECT COUNT(*) n FROM post_revisions WHERE post_id = ? AND note LIKE '%Publié%'", id).n >= 1, "une version « Publié » est enregistrée");
    const empty = add("Vide", { content: "" });
    await prof.post(`/formateur/blog/${empty}/publier`, {});
    assert.equal(row(empty).status, "draft");
    assert.match(flash((await prof.get("/formateur/blog")).text), /Impossible de publier un article vide/);
  });

  test("dépublier, annuler une programmation, bascule historique de « publier »", async () => {
    const live = add("En ligne à retirer", { status: "published" });
    await prof.post(`/formateur/blog/${live}/depublier`, {});
    assert.equal(row(live).status, "draft"); assert.equal(row(live).published, 0);
    const sched = add("Programmé à annuler", { status: "scheduled", at: "2031-01-01 10:00:00" });
    await prof.post(`/formateur/blog/${sched}/depublier`, {});
    assert.equal(row(sched).status, "draft");
    assert.match(flash((await prof.get("/formateur/blog")).text), /programmation .* annulée/);
    const toggle = add("Bascule");
    await prof.post(`/formateur/blog/${toggle}/publier`, {}); assert.equal(row(toggle).status, "published");
    const first = row(toggle).published_at;
    await prof.post(`/formateur/blog/${toggle}/publier`, {}); assert.equal(row(toggle).status, "draft");
    await prof.post(`/formateur/blog/${toggle}/publier`, {}); assert.equal(row(toggle).published_at, first, "la date de première publication est conservée");
    const sched2 = add("Programmé à publier", { status: "scheduled", at: "2031-01-01 10:00:00" });
    await prof.post(`/formateur/blog/${sched2}/publier`, {}); assert.equal(row(sched2).status, "published", "« publier » sur un article programmé le publie tout de suite");
  });

  test("supprimer = corbeille réversible : l'article, ses versions et son image sont conservés ; « Annuler » le restaure en brouillon", async () => {
    const id = add("Mis à la corbeille", { status: "published" });
    db.prepare("UPDATE posts SET cover_path = '/uploads/blog/conservee.png' WHERE id = ?").run(id);
    const before = one("SELECT COUNT(*) n FROM post_revisions WHERE post_id = ?", id).n;
    await prof.post(`/formateur/blog/${id}/supprimer`, {});
    const p = row(id);
    assert.ok(p.deleted_at); assert.equal(p.status, "draft"); assert.equal(p.published, 0); assert.equal(p.cover_path, "/uploads/blog/conservee.png");
    assert.ok(one("SELECT COUNT(*) n FROM post_revisions WHERE post_id = ?", id).n >= before);
    assert.equal((await new Client(srv.base).get(`/blog/${p.slug}`)).status, 404, "plus visible du public");
    const page = (await prof.get("/formateur/blog")).text;
    assert.match(flash(page), /est dans la corbeille/);
    assert.match(page, new RegExp(`action="/formateur/blog/${id}/restaurer"`), "le bouton Annuler est proposé");
    assert.ok(!titles(page).includes("Mis à la corbeille"));
    await prof.post(`/formateur/blog/${id}/restaurer`, {});
    assert.equal(row(id).deleted_at, null); assert.equal(row(id).status, "draft", "jamais republié d'office");
    assert.equal((await prof.post(`/formateur/blog/${id}/restaurer`, {})).status, 302);
    assert.match(flash((await prof.get("/formateur/blog")).text), /n'est pas dans la corbeille/, "restaurer un article hors corbeille : refus clair");
  });

  test("suppression définitive : seulement depuis la corbeille ; efface l'article et ses versions", async () => {
    const id = add("Définitif");
    await prof.post(`/formateur/blog/${id}/supprimer-definitivement`, {});
    assert.ok(row(id), "refusé : l'article n'est pas dans la corbeille");
    assert.match(flash((await prof.get("/formateur/blog")).text), /Mettez d'abord l'article à la corbeille/);
    await prof.post(`/formateur/blog/${id}/supprimer`, {});
    const html = (await prof.get("/formateur/blog?etat=corbeille")).text;
    assert.match(html, new RegExp(`action="/formateur/blog/${id}/supprimer-definitivement" method="post" data-confirm="Supprimer définitivement`), "confirmation avant la suppression définitive");
    await prof.post(`/formateur/blog/${id}/supprimer-definitivement`, { etat: "corbeille" });
    assert.equal(row(id), undefined);
    assert.equal(one("SELECT COUNT(*) n FROM post_revisions WHERE post_id = ?", id).n, 0, "les versions partent avec l'article");
    assert.equal((await prof.post("/formateur/blog/999999/supprimer-definitivement", {})).status, 404);
  });

  test("dupliquer : copie en brouillon (titre « (copie) »), originale intacte, lien pour l'ouvrir", async () => {
    const id = add("Original à copier", { status: "published", content: "<p>Contenu à dupliquer</p>" });
    await prof.post(`/formateur/blog/${id}/dupliquer`, {});
    const copy = one("SELECT * FROM posts WHERE title = 'Original à copier (copie)'");
    assert.ok(copy); assert.equal(copy.status, "draft"); assert.equal(copy.published, 0); assert.equal(copy.content, "<p>Contenu à dupliquer</p>"); assert.notEqual(copy.slug, row(id).slug);
    assert.equal(row(id).status, "published");
    const html = (await prof.get("/formateur/blog")).text;
    assert.match(flash(html), /Copie créée/);
    assert.match(html, new RegExp(`href="/formateur/blog/${copy.id}/modifier">Ouvrir la copie`));
  });

  test("retour à la liste : état, recherche, tri et page conservés ; aucune adresse libre acceptée", async () => {
    const id = add("Contexte");
    const r = await prof.post(`/formateur/blog/${id}/publier`, { etat: "brouillons", q: "contexte", tri: "titre", page: "1" });
    assert.equal(r.headers.get("location"), "/formateur/blog?etat=brouillons&q=contexte&tri=titre");
    for (const body of [{ retour: "https://evil.example/" }, { q: "https://evil.example/", page: "//evil.example" }, { etat: "http://evil.example", tri: "x", page: "-3" }]) {
      const res = await prof.post(`/formateur/blog/${id}/dupliquer`, body);
      assert.match(res.headers.get("location"), /^\/formateur\/blog(\?|$)/, JSON.stringify(body));
      assert.doesNotMatch(res.headers.get("location"), /^\/\/|^https?:/);
    }
    assert.equal((await prof.post("/formateur/blog/abc/publier", {})).status, 404, "identifiant invalide");
  });

  test("les articles d'un autre site sont signalés par le nom de leur site", async () => {
    const id = add("Article du site Beta");
    db.prepare("INSERT INTO mk_content_sites (content_type, content_id, organization_id, site_id) VALUES ('post', ?, ?, ?)").run(id, orgId, siteB);
    // Liste PAR SITE : l'article n'apparaît que dans le site sélectionné (jamais dans la liste du site principal)
    assert.doesNotMatch((await prof.get("/formateur/blog?site=principal&q=site+Beta")).text, /Article du site Beta/, "absent de la liste du site principal");
    const html = (await prof.get(`/formateur/blog?site=${siteB}&q=site+Beta`)).text;
    assert.match(html, /<span class="bl-site"[^>]*>Site : Site Beta<\/span>/);
    // Le site choisi reste actif pendant la navigation (session, revérifié côté serveur) : on revient explicitement au principal
    assert.doesNotMatch((await prof.get("/formateur/blog?site=principal&q=Contexte")).text, /class="bl-site"/, "un article du site principal n'a pas de mention");
  });

  test("contenu saisi : échappé (titre, adresse, recherche réaffichée), rien d'injecté", async () => {
    add("<img src=x onerror=alert(1)> <script>alert(2)</script>");
    const html = (await prof.get("/formateur/blog?q=%3Cscript%3E")).text;
    const all2 = (await prof.get("/formateur/blog?etat=toutes")).text + html;
    assert.doesNotMatch(all2, /<img src=x|<script>alert/);
    assert.match(all2, /&lt;img src=x onerror=alert\(1\)&gt;/);
    assert.match(html, /value="&lt;script&gt;"/);
  });

  test("accessibilité : régions et tableau nommés, état indiqué en toutes lettres, menus nommés par article, recherche étiquetée", async () => {
    const html = (await prof.get("/formateur/blog")).text;
    assert.match(html, /<section class="bl-card" aria-label="Articles">/);
    assert.match(html, /<nav class="bl-tabs" aria-label="Filtrer par état">/);
    assert.match(html, /<caption class="sr-only">Articles du blog<\/caption>/);
    assert.match(html, /<label class="sr-only" for="bl-q">/);
    assert.match(html, /<label class="sr-only" for="bl-tri">/);
    assert.match(html, /role="search"/);
    assert.match(html, /class="dmenu-btn"[^>]*aria-haspopup="true"[^>]*aria-expanded="false"[^>]*aria-label="Autres actions : /);
    assert.match(html, /<span class="dash-status is-/, "l'état est un texte, pas seulement une couleur");
    assert.match(html, /<script src="[^"]*dash-blog\.js[^"]*" defer>/);
    assert.match(html, /<th scope="col">Article<\/th>/);
  });

  test("ancienne liste retirée : plus de styles en ligne ni de confirm() en ligne ; réglage newsletter conservé", async () => {
    const view = read("views", "instructor", "blog-list.ejs");
    assert.doesNotMatch(view, /style="|onsubmit="|faq-admin/);
    const html = (await prof.get("/formateur/blog")).text;
    if (html.includes("blog-newsletter")) assert.match(html, /<details class="bl-settings"/);
  });

  test("styles : uniquement les variables du thème (--dash-*), aucune animation, transitions limitées au mouvement non réduit", () => {
    const css = read("public", "css", "dashboard.css");
    const start = css.indexOf("Blog de « Mon espace »"), end = css.indexOf("/* =====", start);
    const block = css.slice(start, end < 0 ? undefined : end);
    assert.ok(start > 0 && block.length > 500);
    assert.doesNotMatch(block.replace(/rgba?\([^)]*\)/g, ""), /#[0-9a-fA-F]{3,8}\b/, "aucune couleur écrite en dur");
    assert.doesNotMatch(block, /animation:|@keyframes|infinite|linear-gradient|text-shadow/);
    assert.match(block, /@media \(prefers-reduced-motion: no-preference\) \{[\s\S]*transition/);
  });
});
