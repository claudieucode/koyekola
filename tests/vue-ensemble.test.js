// « Vue d'ensemble » de Mon espace (/formateur) : données réelles uniquement (rythme des ventes sur 30 jours, activité récente, éléments à traiter), états vides explicites,
// jours à l'heure de Paris, échappement du contenu saisi, accès réservé au formateur. Volet unitaire (services/dashboard.overview, ago) puis volet serveur réel.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { startServer, loginInstructor, newStudent, createCourse, buy, Client } = require("./helpers");

const read = (...p) => fs.readFileSync(path.join(__dirname, "..", ...p), "utf8");

describe("Vue d'ensemble : calcul (unitaire)", () => {
  let dashboard, db, tmp;
  before(() => {
    // Base isolée : le service lit la base du processus (DATA_DIR), jamais celle de l'installation
    tmp = fs.mkdtempSync(path.join(require("node:os").tmpdir(), "koyekola-ov-"));
    process.env.DATA_DIR = path.join(tmp, "data"); process.env.UPLOADS_DIR = path.join(tmp, "uploads");
    db = require("../src/config/database");
    dashboard = require("../src/services/dashboard");
    db.prepare("INSERT INTO users (username, email, password_hash, role) VALUES ('prof', 'p@x.fr', 'x', 'formateur')").run();
    db.prepare("INSERT INTO users (username, email, password_hash, role) VALUES ('eleve', 'e@x.fr', 'x', 'etudiant')").run();
    db.prepare("INSERT INTO courses (id, instructor_id, title, slug, description, price_cents, category, level, published) VALUES (1, 1, 'Cours <b>A</b>', 'cours-a', 'd', 5000, 'c', 'debutant', 1)").run();
    db.prepare("INSERT INTO courses (id, instructor_id, title, slug, description, price_cents, category, level, published) VALUES (2, 1, 'Cours B', 'cours-b', 'd', 3000, 'c', 'debutant', 1)").run();
  });
  const sale = (at, cents, courseId = 1) => {
    const o = db.prepare("INSERT INTO orders (user_id, total_cents, created_at) VALUES (2, ?, ?)").run(cents, at);
    db.prepare("INSERT INTO order_items (order_id, course_id, price_cents) VALUES (?, ?, ?)").run(o.lastInsertRowid, courseId, cents);
  };

  test("sans aucune vente : 30 jours à zéro, jamais de tendance inventée", () => {
    const ov = dashboard.overview(1, new Date("2026-10-25T10:00:00Z"));
    assert.equal(ov.series.length, 30);
    assert.deepEqual(ov.totals, { sales: 0, cents: 0, peak: 0 });
    assert.ok(ov.series.every((d) => d.sales === 0 && d.cents === 0));
    assert.equal(ov.series[29].day, "2026-10-25"); assert.equal(ov.series[0].day, "2026-09-26");
    assert.deepEqual(ov.activity.filter((e) => e.kind === "sale"), []);
  });

  test("les ventes sont rangées par jour DE PARIS : 23 h 30 UTC le 24 octobre appartient au 25 (heure d'été, UTC+2)", () => {
    sale("2026-10-24 22:30:00", 5000); // 00:30 le 25 à Paris
    sale("2026-10-24 12:00:00", 3000, 2);
    sale("2026-10-25 08:00:00", 5000);
    const ov = dashboard.overview(1, new Date("2026-10-25T10:00:00Z"));
    const d = Object.fromEntries(ov.series.map((x) => [x.day, x]));
    assert.deepEqual([d["2026-10-24"].sales, d["2026-10-24"].cents], [1, 3000]);
    assert.deepEqual([d["2026-10-25"].sales, d["2026-10-25"].cents], [2, 10000]);
    assert.deepEqual(ov.totals, { sales: 3, cents: 13000, peak: 10000 });
  });

  test("les ventes hors des 30 jours et celles d'un autre formateur ne comptent pas", () => {
    sale("2026-08-01 10:00:00", 9900);
    db.prepare("INSERT INTO users (username, email, password_hash, role) VALUES ('autre', 'a@x.fr', 'x', 'formateur')").run();
    db.prepare("INSERT INTO courses (id, instructor_id, title, slug, description, price_cents, category, level, published) VALUES (3, 3, 'Autre', 'autre', 'd', 100, 'c', 'debutant', 1)").run();
    sale("2026-10-25 09:00:00", 100, 3);
    const ov = dashboard.overview(1, new Date("2026-10-25T10:00:00Z"));
    assert.equal(ov.totals.cents, 13000);
    assert.equal(dashboard.overview(3, new Date("2026-10-25T10:00:00Z")).totals.cents, 100);
  });

  test("l'activité mêle ventes et messages, du plus récent au plus ancien, limitée", () => {
    db.prepare("INSERT INTO contact_messages (name, email, subject, message, created_at) VALUES ('Zoé', 'z@x.fr', 'Bonjour', 'm', '2026-10-25 09:30:00')").run();
    const ov = dashboard.overview(1, new Date("2026-10-25T10:00:00Z"), { activityLimit: 4 });
    assert.equal(ov.activity.length, 4);
    const times = ov.activity.map((e) => e.at);
    assert.deepEqual(times, [...times].sort().reverse());
    assert.equal(ov.activity[0].kind, "message"); assert.equal(ov.activity[0].unread, true);
    const s = ov.activity.find((e) => e.kind === "sale");
    assert.match(s.href, /^\/formateur\/gestion\/ventes\/commandes\/\d+$/);
  });

  test("« il y a… » : repères à l'heure de Paris, sans valeur négative", () => {
    const now = new Date("2026-10-25T10:00:00Z");
    assert.equal(dashboard.ago("2026-10-25 09:59:50", now).text, "à l'instant");
    assert.equal(dashboard.ago("2026-10-25 09:40:00", now).text, "il y a 20 min");
    assert.equal(dashboard.ago("2026-10-25 06:00:00", now).text, "il y a 4 h");
    assert.match(dashboard.ago("2026-10-24 13:05:00", now).text, /^hier à 15:05$/);
    assert.equal(dashboard.ago("2026-10-25 11:00:00", now).text, "à l'instant", "une date dans le futur ne donne jamais « il y a -1 h »");
    assert.match(dashboard.ago("2026-09-01 10:00:00", now).text, /^1 sept\.?$/);
  });
});

describe("Vue d'ensemble : page (serveur réel)", () => {
  let srv, boss, db, anon;
  before(async () => {
    srv = await startServer({ SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); anon = new Client(srv.base); db = srv.db();
  });
  after(() => srv.stop());

  test("réservée au formateur : anonyme renvoyé à la connexion, élève refusé", async () => {
    assert.equal((await anon.get("/formateur")).status, 302);
    const s = await newStudent(srv);
    assert.notEqual((await s.get("/formateur")).status, 200);
  });

  test("compte neuf : états vides explicites, parcours en trois étapes, aucun chiffre inventé", async () => {
    const r = await boss.get("/formateur");
    assert.equal(r.status, 200);
    assert.match(r.text, /<h1>Bonjour /);
    assert.match(r.text, /Aucune vente sur les 30 derniers jours/);
    assert.match(r.text, /Vous n'avez pas encore de formation/);
    assert.equal((r.text.match(/<li><a href="\/formateur\/cours\/nouveau">Créer la formation<\/a>/g) || []).length, 1);
    // « À traiter » : soit la liste de ce qui attend réellement (jamais un compteur à zéro), soit la phrase d'état vide
    assert.doesNotMatch(r.text, /class="ov-todo-n">0</);
    assert.equal(/class="ov-todo-list"/.test(r.text), !/Rien à traiter pour le moment/.test(r.text));
    assert.match(r.text, /Aucune activité pour le moment/);
    assert.doesNotMatch(r.text, /class="ov-bar/, "pas de graphique sans vente");
    assert.match(r.text, /class="ov-big">0,00\s?€/);
  });

  test("avec formations, ventes et messages : chiffres, graphique, à-traiter et activité viennent de la base", async () => {
    const c1 = await createCourse(boss, srv, { title: "Photoshop <script>alert(1)</script>", price: 49, lessons: [{ title: "Interface" }, { title: "Calques" }] });
    const c2 = await createCourse(boss, srv, { title: "Lightroom", price: 79, lessons: [{ title: "Importer" }] });
    await createCourse(boss, srv, { title: "Brouillon à finir", price: 10, publish: false, lessons: [{ title: "x" }] });
    for (let i = 0; i < 3; i++) await buy(await newStudent(srv), i === 2 ? c2 : c1);
    db.prepare("INSERT INTO contact_messages (name, email, subject, message) VALUES ('<i>Julie</i>', 'j@x.fr', 'Question', 'm')").run();
    const rows = db.prepare("SELECT COALESCE(SUM(oi.price_cents), 0) c, COUNT(*) n FROM order_items oi").get();
    const html = (await boss.get("/formateur")).text;
    const fmt = (c) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(c / 100).replace(/ | /g, " ");
    const norm = (t) => t.replace(/ | /g, " ");
    assert.ok(norm(html).includes(fmt(rows.c)), "le revenu affiché est la somme réelle des lignes de commande");
    assert.equal((html.match(/<span class="ov-bar/g) || []).length, 30, "30 jours de graphique");
    const withSales = [...html.matchAll(/<span class="ov-bar[^"]*" style="--h: (\d+)%[^>]*role="img" aria-label="([^"]+)"/g)];
    assert.ok(withSales.length >= 1);
    const total = withSales.map((m) => m[2]).join(" ");
    assert.match(total, /3 ventes|1 vente|2 ventes/);
    assert.match(html, /<span class="ov-todo-n">1<\/span><span class="ov-todo-t">formation en brouillon</); assert.match(html, /<span class="ov-todo-n">1<\/span><span class="ov-todo-t">message non lu</);
    assert.equal((html.match(/<li class="ov-ev ov-ev--sale">/g) || []).length, 3, "trois ventes réelles dans l'activité");
    assert.match(html, /<li class="ov-ev ov-ev--message">/);
    for (const l of html.matchAll(/<a class="ov-ev-body" href="([^"]+)"/g)) assert.match(l[1], /^\/formateur\/(?:messages|gestion\/ventes\/commandes\/\d+)$/, "chaque ligne mène à une vraie page");
  });

  test("le contenu saisi (titre de formation, nom d'un expéditeur) est échappé", async () => {
    const html = (await boss.get("/formateur")).text;
    assert.doesNotMatch(html, /<script>alert\(1\)<\/script>/);
    assert.doesNotMatch(html, /<i>Julie<\/i>/);
    assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  });

  test("les actions de chaque formation sont conservées (modifier, aperçu, chapitres, FAQ, étudiants, dupliquer, archiver/supprimer)", async () => {
    const html = (await boss.get("/formateur")).text;
    const row = html.split('<tr class="ov-row">')[1];
    for (const needle of ["/modifier", "/curriculum", "/faq", "/etudiants", "/dupliquer", "/archiver"]) assert.ok(row.includes(needle), needle);
    assert.match(html, /\/supprimer|Déjà vendue/);
    assert.match(html, /aria-haspopup="true" aria-expanded="false" aria-label="Autres actions/);
  });

  test("la page « Mes formations » garde ses cartes et son menu (partiel partagé)", async () => {
    const html = (await boss.get("/formateur/formations")).text;
    assert.match(html, /class="dcard"/); assert.match(html, /class="dmenu-list"/);
    for (const needle of ["/curriculum", "/dupliquer"]) assert.ok(html.includes(needle), needle);
  });

  test("accessibilité : graphique nommé, barres avec ventes focalisables et décrites, aucune barre vide dans l'ordre de tabulation", async () => {
    const html = (await boss.get("/formateur")).text;
    assert.match(html, /role="group" aria-label="Ventes par jour sur les 30 derniers jours\./);
    for (const m of html.matchAll(/<span class="ov-bar is-zero[^>]*>/g)) assert.doesNotMatch(m[0], /tabindex/);
    const sale = [...html.matchAll(/<span class="ov-bar(?! is-zero)[^>]*>/g)].map((m) => m[0]);
    for (const m of sale) assert.match(m, /tabindex="-?[01]" role="img" aria-label="[^"]+ vente/);
    assert.equal(sale.filter((m) => /tabindex="0"/.test(m)).length, 1, "un seul arrêt de tabulation pour tout le graphique");
    assert.match(html, /<nav class="ov-quick" aria-label="Raccourcis">/);
  });

  test("styles : uniquement les variables du thème (--dash-*), animation limitée au graphique et désactivée en mouvement réduit", () => {
    const css = read("public", "css", "dashboard.css");
    const block = css.slice(css.indexOf("Vue d'ensemble de « Mon espace »"));
    assert.doesNotMatch(block.replace(/rgba?\([^)]*\)/g, ""), /#[0-9a-fA-F]{3,8}\b/, "aucune couleur écrite en dur dans le bloc");
    assert.match(block, /@media \(prefers-reduced-motion: no-preference\) \{\s*\.ov-bar:not\(\.is-zero\)/);
    assert.equal((block.match(/animation:/g) || []).length, 1, "un seul moment animé");
    assert.doesNotMatch(block, /infinite/);
  });
});
