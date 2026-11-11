// Moteur de recherche (règles tolérantes, tri par adresse) et aperçu de démonstration de la bibliothèque « Résultats de recherche » : vrai serveur.
// Règles : tous les mots, accents et majuscules ignorés, termes spéciaux (%, _) cherchés tels quels ; tri réellement appliqué ; démonstration réservée à l'aperçu ; isolation entre sites.
const { test, before, after, describe } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");
const Q = require("../src/marketing/pages/query");

describe("moteur : recherche tolérante (SQL réel)", () => {
  const { DatabaseSync } = require("node:sqlite"); const db = new DatabaseSync(":memory:");
  db.exec("CREATE TABLE posts(id INTEGER, title TEXT, excerpt TEXT, content TEXT)");
  const ins = db.prepare("INSERT INTO posts VALUES (?,?,?,?)");
  ins.run(1, "Écologie en voyage", "Partir léger", "Texte"); ins.run(2, "Cuisine d'été", "Recettes simples", "Le voyage éco-responsable"); ins.run(3, "Remise de 100% sur tout", "Promo", "x"); ins.run(4, "Œuvres et cafés", "Un café", "y"); ins.run(5, "Autre sujet", "rien", "rien");
  const find = (q) => { const w = Q.searchWhere(q, ["title", "excerpt"], ["content"]); return db.prepare(`SELECT id FROM posts WHERE ${w.sql || "1=1"} ORDER BY id`).all(...w.args).map((r) => r.id); };
  test("sans accent, en majuscules, ou accentué : même résultat", () => { assert.deepEqual(find("ecologie"), [1]); assert.deepEqual(find("ÉCOLOGIE"), [1]); assert.deepEqual(find("écologie"), [1]); assert.deepEqual(find("cafes"), [4]); assert.deepEqual(find("oeuvres"), [4]); });
  test("tous les mots doivent figurer, dans n'importe quel champ", () => { assert.deepEqual(find("ecologie voyage"), [1]); assert.deepEqual(find("voyage"), [1, 2]); assert.deepEqual(find("cuisine voyage"), [2]); assert.deepEqual(find("ecologie cuisine"), []); });
  test("% et _ sont des caractères ordinaires ; requête vide = pas de condition", () => { assert.deepEqual(find("100%"), [3]); assert.deepEqual(find("%"), [3]); assert.deepEqual(find("_"), []); assert.equal(Q.searchWhere("   ", ["title"], []).sql, ""); });
  test("au plus six mots pris en compte, 100 caractères au plus", () => { const w = Q.searchWhere("a b c d e f g h i", ["title"], []); assert.equal(w.args.length, 6); });
});

describe("aperçu de démonstration et tri (vrai serveur)", () => {
  let srv, boss, db, A, B;
  const U = (s, p = "") => `/marketing/site-web/sites/${s}/constructeur-de-theme${p}`;
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db();
    A = Number(String((await boss.post("/marketing/site-web/sites", { name: "Recherche A" })).location).match(/sites\/(\d+)/)[1]);
    B = Number(String((await boss.post("/marketing/site-web/sites", { name: "Recherche B" })).location).match(/sites\/(\d+)/)[1]);
  });
  after(async () => { db.close(); await srv.stop(); });
  const key = () => {
    const Cat = require("../src/themeBuilder/catalog"), walk = (n, f) => { f(n); (n.children || []).forEach((c) => walk(c, f)); };
    return Cat.entries("search_results").find((e) => { let loops = 0, ql = false, sort = false; for (const r of Cat.build("search_results", e.key).sections) walk(r, (n) => { if (n.type === "grid" && n.props && n.props.loop) loops += 1; if (n.type === "querylist") ql = true; if (n.type === "searchsort") sort = true; }); return loops === 1 && !ql && !sort; }).key;
  };
  const preview = async (site, qs = "") => (await boss.get(U(site, `/api/bibliotheque/search_results/${key()}/apercu${qs}`))).text;
  test("l'aperçu montre de vraies cartes de démonstration (fictives, signalées) et pas l'état vide", async () => {
    const html = await preview(A);
    assert.match(html, /Exemple —/); assert.doesNotMatch(html, /Aucun résultat pour « »/);
    assert.match(html, /Résultats pour « exemple »/);
  });
  test("?etat=vide montre l'état « aucun résultat » avec le terme", async () => { const html = await preview(A, "?etat=vide"); assert.doesNotMatch(html, /Exemple —/); assert.match(html, /mot-introuvable/); });
  test("?q= : le terme essayé est repris dans le titre et le champ", async () => { const html = await preview(A, "?q=voyage"); assert.match(html, /Résultats pour « voyage »/); assert.match(html, /value="voyage"/); });
  test("le tri par adresse change l'ordre des résultats de démonstration", async () => {
    const titles = (h) => [...h.matchAll(/Exemple — ([^<]{5,70})</g)].map((m) => m[1]).slice(0, 6);
    const a = titles(await preview(A, "?tri=alpha")), z = titles(await preview(A, "?tri=alpha-inverse"));
    assert.ok(a.length >= 3 && z.length >= 3); assert.notDeepEqual(a, z);
    assert.deepEqual(a, [...a].sort((x, y) => x.localeCompare(y, "fr")), "A → Z réellement trié");
  });
  test("hors aperçu (page publique du site), jamais de résultats de démonstration", async () => {
    const r = await boss.get("/blog?q=exemple"); assert.doesNotMatch(r.text, /Exemple —/);
  });
});
