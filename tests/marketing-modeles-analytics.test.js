// Passe UI/UX (suite §37) — Modèles : création en modale et actions de ligne dans un menu ⋮ (comme Listes) ;
// Analytics : histogramme en colonnes HTML qui occupe toute la largeur et garde un texte lisible sur mobile,
// tableau des campagnes en pleine largeur.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { startServer, loginInstructor } = require("./helpers");
const { TEST_KEY } = require("./marketing-helpers");
const { columnChart } = require("../src/marketing/web/charts");

let srv, boss;
const run = (query, ...args) => { const db = srv.db(); db.prepare(query).run(...args); db.close(); };
const dialogOf = (html, id) => new RegExp(`<dialog class="mk-dialog mk-modal[^"]*" id="${id}" data-mk-modal data-mk-modal-hash="${id}"[\\s\\S]*?<\\/dialog>`).exec(html)?.[0];

before(async () => {
  srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test" });
  boss = await loginInstructor(srv);
});
after(() => srv.stop());

describe("Modèles", () => {
  test("aucun modèle : état vide avec création (modale) et bibliothèque", async () => {
    const html = (await boss.get("/marketing/modeles")).text;
    assert.match(html, /<div class="mk-empty">[\s\S]*?data-mk-modal-open="creer"[\s\S]*?href="\/marketing\/modeles\/bibliotheque"/);
  });
  test("formulaire de création uniquement dans la modale", async () => {
    const html = (await boss.get("/marketing/modeles")).text;
    const dialog = dialogOf(html, "creer");
    assert.ok(dialog, "modale présente");
    assert.match(dialog, /<form action="\/marketing\/modeles" method="post">/);
    assert.match(dialog, /<select id="m-starter" name="starter">/);
    assert.doesNotMatch(html.replace(dialog, ""), /<form action="\/marketing\/modeles" method="post"/);
    assert.match(html, /<a class="btn btn-primary btn-sm mk-primary" href="\/marketing\/modeles#creer">Nouveau modèle<\/a>/);
  });
  test("actions de ligne dans un menu ⋮ : Ouvrir, Dupliquer, Supprimer (avec confirmation)", async () => {
    const res = await boss.post("/marketing/modeles", { name: "Menu M", starter: "blank", kind: "marketing" });
    const id = Number(res.location.match(/(\d+)$/)[1]);
    const html = (await boss.get("/marketing/modeles")).text;
    const menu = new RegExp(`<div class="mk-menu" id="menu-modele-${id}" role="menu" hidden>[\\s\\S]*?<\\/div>`).exec(html)?.[0] ?? "";
    assert.match(html, new RegExp(`aria-controls="menu-modele-${id}" aria-label="Actions pour le modèle Menu M"`));
    assert.match(menu, new RegExp(`<a role="menuitem" href="/marketing/modeles/${id}">Ouvrir</a>`));
    assert.match(menu, new RegExp(`action="/marketing/modeles/${id}/dupliquer"[\\s\\S]*?role="menuitem">Dupliquer</button>`));
    assert.match(menu, /class="mk-menu-danger" data-mk-confirm="[^"]+"[^>]*>Supprimer<\/button>/);
    assert.doesNotMatch(html, /class="btn btn-ghost btn-sm" aria-label="Dupliquer le modèle/, "plus de boutons nus sur chaque ligne");
    const dup = await boss.post(`/marketing/modeles/${id}/dupliquer`, {});
    assert.equal(dup.status, 302);
  });
});

describe("histogramme en colonnes (Analytics)", () => {
  const days = Array.from({ length: 30 }, (_, i) => ({ label: `${String(i + 1).padStart(2, "0")}/09`, count: i === 4 ? 0 : i * 3 }));
  test("une colonne par point, grille à la largeur disponible, résumé accessible", () => {
    const html = columnChart(days, { title: "Envois", unit: " envoi(s)" });
    assert.match(html, /<figure class="mk-chart-cols[^"]*" role="img" aria-label="Envois : 01\/09 0, 02\/09 3/);
    assert.match(html, /style="--n:30"/);
    assert.equal((html.match(/<div class="mk-col[ "]/g) || []).length, 30);
  });
  test("valeur de chaque colonne en infobulle ; zéro visible et distinct", () => {
    const html = columnChart(days, { title: "Envois", unit: " envoi(s)" });
    assert.match(html, /<div class="mk-col" title="30\/09 : 87 envoi\(s\)">/);
    assert.match(html, /<div class="mk-col is-zero" title="05\/09 : 0 envoi\(s\)">/);
  });
  test("valeur écrite au-dessus de chaque colonne non vide ; beaucoup de colonnes : figure marquée pour les masquer sur mobile", () => {
    const few = columnChart([{ label: "a", count: 5 }, { label: "b", count: 0 }], { title: "t" });
    assert.match(few, /<span class="mk-col-value">5<\/span>/);
    assert.equal((few.match(/mk-col-value/g) || []).length, 1, "rien au-dessus d'une colonne à zéro");
    assert.match(few, /<figure class="mk-chart-cols" /);
    const many = columnChart(days, { title: "t" });
    assert.match(many, /<figure class="mk-chart-cols is-dense" /);
    assert.match(many, /<span class="mk-col-value">87<\/span>/);
  });
  test("libellés espacés : 10 au plus sur grand écran, 4 au plus sur mobile, premier et dernier toujours présents", () => {
    const html = columnChart(days, { title: "t" });
    const labels = [...html.matchAll(/<span class="mk-col-label( is-minor)?">([^<]*)<\/span>/g)];
    const shown = labels.filter((m) => m[2]);
    assert.ok(shown.length <= 10 && shown.length >= 4, `grand écran : ${shown.length}`);
    const mobile = shown.filter((m) => !m[1]);
    assert.ok(mobile.length <= 4 && mobile.length >= 2, `mobile : ${mobile.length}`);
    assert.equal(labels[0][2], "01/09");
    assert.equal(labels[29][2], "30/09");
    assert.equal(labels[0][1], undefined, "le premier reste sur mobile");
    assert.equal(labels[29][1], undefined, "le dernier reste sur mobile");
  });
  test("échappement : aucune valeur insérée comme HTML ; liste vide sans erreur", () => {
    const html = columnChart([{ label: '"><script>x</script>', count: 1 }], { title: "<b>t</b>" });
    assert.doesNotMatch(html, /<script>|<b>/);
    assert.match(columnChart([], { title: "t" }), /mk-chart-cols/);
  });
});

describe("page Analytics", () => {
  test("histogramme en colonnes, campagnes en pleine largeur", async () => {
    run("INSERT INTO mk_campaigns (organization_id, name, target_type, target_id, kind, status, started_at, finished_at, sent_count, total_recipients) VALUES (1, 'Camp A', 'list', 1, 'campaign', 'sent', ?, ?, 10, 10)", Date.now() - 3600e3, Date.now() - 1800e3);
    run("INSERT INTO mk_contacts (organization_id, email, status) VALUES (1, 'an@ex.fr', 'subscribed')");
    run("INSERT INTO mk_messages (organization_id, campaign_id, contact_id, email) VALUES (1, (SELECT id FROM mk_campaigns WHERE name = 'Camp A'), (SELECT id FROM mk_contacts WHERE email = 'an@ex.fr'), 'an@ex.fr')");
    run("INSERT INTO mk_message_events (organization_id, message_id, campaign_id, type, bot, occurred_at) VALUES (1, (SELECT MAX(id) FROM mk_messages), (SELECT id FROM mk_campaigns WHERE name = 'Camp A'), 'sent', 0, ?)", Date.now() - 1000);
    const html = (await boss.get("/marketing/analytics")).text;
    assert.match(html, /<figure class="mk-chart-cols/);
    assert.doesNotMatch(html, /class="mk-grid-2"/);
    assert.match(html, /Camp A/);
  });
});
