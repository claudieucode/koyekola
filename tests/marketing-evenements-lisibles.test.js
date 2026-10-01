// Passe UI/UX (suite §36) — page Événements lisible par un non-technicien : libellé français de chaque événement
// (le code technique reste affiché, en petit), origine traduite, date et heure, état en badge, détail du pont
// replié ; message de synchronisation humanisé. Aucune donnée modifiée : uniquement l'affichage.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { startServer, loginInstructor } = require("./helpers");
const { TEST_KEY } = require("./marketing-helpers");

let srv, boss;
const run = (query, ...args) => { const db = srv.db(); db.prepare(query).run(...args); db.close(); };
const visible = (html) => html.replace(/<details[\s\S]*?<\/details>/g, "");
const rowOf = (html, email) => new RegExp(`<tr>(?:(?!<\\/tr>)[\\s\\S])*?${email.replace(".", "\\.")}[\\s\\S]*?<\\/tr>`).exec(html)?.[0] ?? "";

before(async () => {
  srv = await startServer({ ENCRYPTION_KEY: TEST_KEY });
  boss = await loginInstructor(srv);
});
after(() => srv.stop());

describe("page Événements", () => {
  test("aucun événement : état vide explicatif (composant partagé)", async () => {
    const html = (await boss.get("/marketing/evenements")).text;
    assert.match(html, /<div class="mk-empty">[\s\S]*?Aucun événement/);
    assert.doesNotMatch(html, /class="empty-state"/);
  });
  test("chaque événement : libellé français, code en petit, origine, date et heure, état", async () => {
    const t = Date.UTC(2026, 8, 25, 12, 30);
    run("INSERT INTO mk_events (organization_id, name, email, source, occurred_at, processed_at, created_at) VALUES (1, 'lms.order_completed', 'achat@ex.fr', 'lms', ?, ?, ?)", t, t + 1000, t);
    run("INSERT INTO mk_events (organization_id, name, email, source, occurred_at, created_at) VALUES (1, 'contact.subscribed', 'abo@ex.fr', 'marketing', ?, ?)", t, t);
    run("INSERT INTO mk_events (organization_id, name, email, source, occurred_at, created_at) VALUES (1, 'mon_evenement.special', 'perso@ex.fr', 'api', ?, ?)", t, t);
    const html = (await boss.get("/marketing/evenements")).text;
    const achat = rowOf(html, "achat@ex.fr");
    assert.match(achat, /Une commande est passée/);
    assert.match(achat, /<code class="mk-sub">lms\.order_completed<\/code>/);
    assert.match(achat, />Site KOYEKOLA</);
    assert.match(achat, /\d{2}\/\d{2}\/2026 \d{2}:\d{2}/);
    assert.match(achat, /<span class="mk-status mk-status-ok">Traité<\/span>/);
    const abo = rowOf(html, "abo@ex.fr");
    assert.match(abo, /Un contact s(&#39;|')abonne/);
    assert.match(abo, />Marketing</);
    assert.match(abo, /<span class="mk-status mk-status-warn">En attente<\/span>/);
    const perso = rowOf(html, "perso@ex.fr");
    assert.match(perso, /Événement personnalisé/);
    assert.match(perso, /mon_evenement\.special/);
    assert.match(perso, />API</);
  });
  test("détail du pont replié, sources traduites, dates lisibles", async () => {
    run("INSERT INTO mk_bridge_cursors (organization_id, source, last_id, initialized_at, updated_at) VALUES (1, 'orders', 42, '2026-09-20 08:00:00', '2026-09-25 09:15:00')");
    const html = (await boss.get("/marketing/evenements")).text;
    assert.doesNotMatch(visible(html), /Dernier identifiant lu/, "le tableau technique n'est plus affiché d'emblée");
    const details = /<details class="mk-advanced">[\s\S]*?<\/details>/.exec(html)?.[0] ?? "";
    assert.match(details, /Commandes/);
    assert.match(details, /25\/09\/2026/);
    assert.doesNotMatch(details, /2026-09-25 09:15:00/, "plus de date brute");
    assert.match(visible(html), /Dernière lecture du site : /);
  });
  test("synchronisation : message humanisé, détail technique replié", async () => {
    const r = await boss.post("/marketing/evenements/synchroniser", {});
    const html = (await boss.get(r.location)).text;
    assert.match(html, /Synchronisation terminée/);
    assert.doesNotMatch(visible(html), /traitement en arrière-plan est désactivé/);
  });
});
