// KOLAKISA CMS — la palette « Outils » du menu latéral : l'entrée sélectionnée correspond TOUJOURS à la page affichée (avant, « Santé du site » restait active partout),
// dans le menu du site principal comme dans l'espace d'un site, y compris pour les sous-pages ; jamais deux entrées actives ; les autres groupes ne changent pas.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, Client, loginInstructor } = require("./helpers");

const R = "/marketing/site-web";
// Liens du menu latéral marqués « page courante » (le fil d'Ariane utilise <li>, pas ces classes)
const currents = (html) => [...html.matchAll(/<a class="mk-nav-(?:sub)?link[^"]*" href="[^"]*"[^>]*aria-current="page"[^>]*>(?:<[^>]+>)*([^<]*)/g)].map((m) => m[1].replace(/&#39;/g, "'").trim()).filter(Boolean);

describe("palette Outils : l'entrée active suit la page affichée", () => {
  let srv, boss, db, S;
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db();
    S = Number(String((await boss.post(`${R}/sites`, { name: "Alpha" })).location).match(/sites\/(\d+)/)[1]);
  });
  after(() => { db.close(); return srv.stop(); });

  const PAGES = [
    ["outils", "Santé du site"], ["outils/disponibles", "Outils disponibles"], ["outils/importer", "Importer"], ["outils/exporter", "Exporter"], ["outils/donnees", "Exporter les données"],
    ["outils/diagnostic", "Diagnostic"], ["outils/maintenance", "Maintenance"], ["outils/cache", "Caches"], ["outils/contenu", "Outils de contenu"], ["outils/effacer-donnees", "Effacer les données"], ["outils/notes", "Admin Notes"],
  ];
  const CENTRAL = [["outils/systeme", "Informations système"], ["outils/sauvegardes", "Sauvegardes"], ["outils/logs", "Journal d'activité"], ["corbeille", "Corbeille"]];
  const open = async (path) => { const r = await boss.get(path); assert.equal(r.status, 200, path); return r.text; };

  test("menu du site principal : chaque page d'outil sélectionne UNE seule entrée, la sienne (jamais « Santé du site » par défaut)", async () => {
    for (const [path, label] of [...PAGES, ...CENTRAL]) assert.deepEqual(currents(await open(`${R}/${path}`)), [label], path);
  });
  test("espace d'un site : même règle dans le cadre du site (adresse /sites/N/outils/…)", async () => {
    for (const [path, label] of PAGES) assert.deepEqual(currents(await open(`${R}/sites/${S}/${path}`)), [label], `${path} (site)`);
  });
  test("sous-pages : rattachées à leur parent, une seule entrée active (assistants d'import, détails, opérations, demandes)", async () => {
    for (const [sub, label] of [["outils/importer/wordpress", "Importer"], ["outils/importer/flux", "Importer"], ["outils/importer/convertisseur", "Importer"], ["outils/importer/wordpress/details", "Importer"], ["outils/sauvegarde-site", "Exporter"]]) {
      assert.deepEqual(currents(await open(`${R}/${sub}`)), [label], sub);
      assert.deepEqual(currents(await open(`${R}/${sub}?site=${S}`)), [label], `${sub} (site)`);
    }
    const ex = await boss.post(`${R}/outils/exporter`, { types: "pages" }); assert.equal(ex.status, 302);
    assert.deepEqual(currents(await open(ex.location)), ["Exporter"], "page d'une opération d'export");
    db.prepare("INSERT INTO mk_erasure_requests (organization_id, subject_hash, subject_label, status) VALUES (?, 'h', 'a***@x.fr', 'pending')").run(one("SELECT id FROM mk_organizations").id);
    const id = one("SELECT id FROM mk_erasure_requests ORDER BY id DESC LIMIT 1").id;
    assert.deepEqual(currents(await open(`${R}/outils/effacer-donnees/${id}`)), ["Effacer les données"], "détail d'une demande d'effacement");
  });
  test("navigation successive et rechargement : chaque URL donne son propre résultat, dans n'importe quel ordre (équivalent du retour arrière)", async () => {
    const seq = ["outils/importer", "outils/exporter", "outils", "outils/cache", "outils/importer", "outils", "outils/diagnostic"];
    for (const path of seq) { const label = PAGES.find(([p]) => p === path)[1]; assert.deepEqual(currents(await open(`${R}/${path}`)), [label], path); assert.deepEqual(currents(await open(`${R}/${path}`)), [label], `${path} (rechargement)`); }
  });
  test("le groupe Outils reste déplié sur ses pages ; les autres groupes ne sont pas touchés (une page hors Outils ne sélectionne aucune entrée d'Outils)", async () => {
    const h = await open(`${R}/outils/importer`);
    const outils = /<div class="mk-nav-group( is-open)?" data-mk-group="outils">/.exec(h);
    assert.ok(outils && outils[1], "le groupe Outils est déplié sur une page d'outil");
    assert.match(h, /aria-expanded="true" aria-controls="mk-sub-outils"/);
    // Une page hors Outils (Paramètres) : le groupe Outils n'est pas déplié et aucune de ses entrées n'est active
    const p = await open(`${R}/parametres`); assert.ok(!/<div class="mk-nav-group is-open" data-mk-group="outils">/.test(p), "Outils replié hors de ses pages");
    for (const [path, label] of [["parametres", "Général"], ["redirections", "Redirections"], ["utilisateurs", "Tous les comptes"]]) {
      const c = currents(await open(`${R}/${path}`));
      assert.ok(c.length >= 1 && !c.some((x) => PAGES.some(([, l]) => l === x) && x !== label), `${path} : ${c.join(",")}`);
    }
    for (const [path, label] of PAGES) { const c = currents(await open(`${R}/${path}`)); assert.equal(c.length, 1, `${path} : jamais deux entrées actives`); void label; }
  });
});
