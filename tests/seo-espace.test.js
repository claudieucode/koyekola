// Refonte de l'espace SEO (SEO Workspace) : coquille partagée avec « Mon espace », navigation propre, tâches à faire,
// surveillance, vues de l'audit, contenus, journal, apparence. Les fonctions SEO elles-mêmes sont testées ailleurs.
const { test, before, after, describe } = require("node:test");
const assert = require("node:assert/strict");
const { startServer, loginInstructor, newStudent, createCourse } = require("./helpers");

let srv, prof, eleve;
const q = (sql, ...a) => {
  const db = srv.db();
  const r = db.prepare(sql).all(...a);
  db.close();
  return r;
};

before(async () => {
  srv = await startServer();
  prof = await loginInstructor(srv);
  await createCourse(prof, srv, { title: "Excel avancé", price: 49 });
  eleve = await newStudent(srv);
});
after(() => srv.stop());

describe("Coquille de l'espace SEO", () => {
  test("navigation SEO propre, rail « Mon espace », fil d'Ariane, pas de pied de page public", async () => {
    const r = await prof.get("/formateur/seo/audit");
    assert.equal(r.status, 200);
    assert.match(r.text, /class="dash has-rail dash-seo"/);
    assert.match(r.text, /class="app-rail"/);
    assert.match(r.text, /seo-workspace\.css/);
    assert.match(r.text, />SEO Workspace</);
    for (const href of ["/formateur/seo", "/formateur/seo/audit", "/formateur/seo/contenus", "/formateur/seo/redirections", "/formateur/seo/erreurs-404", "/formateur/seo/technique", "/formateur/seo/integrations", "/formateur/seo/surveillance", "/formateur/seo/taches", "/formateur/seo/rapports", "/formateur/seo/reglages", "/formateur/seo/journal", "/formateur/seo/apparence"]) {
      assert.match(r.text, new RegExp(`href="${href.replace(/\//g, "\\/")}"`), href);
    }
    assert.match(r.text, /href="\/formateur\/seo\/audit" class="dash-link" data-tip="Audit" aria-current="page"/);
    assert.match(r.text, /<nav class="dash-crumbs" aria-label="Fil d'Ariane">/);
    assert.doesNotMatch(r.text, /class="site-footer"/);
    // « Mon espace » garde sa propre navigation
    const home = await prof.get("/formateur");
    assert.doesNotMatch(home.text, /dash-seo/);
    assert.match(home.text, /href="\/formateur\/seo"/);
  });

  test("toutes les rubriques s'affichent", async () => {
    for (const url of ["/formateur/seo", "/formateur/seo/audit", "/formateur/seo/contenus", "/formateur/seo/redirections", "/formateur/seo/redirections?nouvelle=1", "/formateur/seo/erreurs-404", "/formateur/seo/technique", "/formateur/seo/integrations", "/formateur/seo/surveillance", "/formateur/seo/taches", "/formateur/seo/rapports", "/formateur/seo/reglages", "/formateur/seo/journal", "/formateur/seo/apparence", "/formateur/seo/regles", "/formateur/seo/analyse?path=%2F"]) {
      const r = await prof.get(url);
      assert.equal(r.status, 200, url);
      assert.match(r.text, /dash-seo/, url);
    }
  });

  test("un élève n'a pas accès à l'espace SEO", async () => {
    for (const url of ["/formateur/seo", "/formateur/seo/surveillance", "/formateur/seo/apparence"]) assert.notEqual((await eleve.get(url)).status, 200, url);
    const r = await eleve.post("/formateur/seo/a-faire", { key: "config:org_logo", done: "1" });
    assert.notEqual(r.status, 200);
    assert.equal(q("SELECT COUNT(*) n FROM seo_tasks_done")[0].n, 0);
  });
});

describe("Avant le premier audit", () => {
  test("vue d'ensemble : état vide et tâches de configuration réelles", async () => {
    const r = await prof.get("/formateur/seo");
    assert.match(r.text, /Aucun audit pour l&#39;instant|Aucun audit pour l'instant/);
    assert.match(r.text, /Logo de l&#39;organisation manquant|Logo de l'organisation manquant/);
    assert.match(r.text, /Profils sociaux non configurés/);
    assert.match(r.text, /seo-prio is-important/);
  });
  test("contenus : « Non analysé » tant qu'aucun audit n'existe, indexation lue dans le plan du site", async () => {
    const r = await prof.get("/formateur/seo/contenus");
    assert.match(r.text, /Non analysé/);
    assert.match(r.text, /Indexée/);
    assert.match(r.text, /Excel avancé/);
  });
  test("rapports : aucune donnée inventée", async () => {
    const r = await prof.get("/formateur/seo/rapports");
    assert.match(r.text, /Pas encore d&#39;historique|Pas encore d'historique/);
    assert.doesNotMatch(r.text, /class="seo-chart"/);
  });
  test("surveillance : état vide avec les actions", async () => {
    const r = await prof.get("/formateur/seo/surveillance");
    assert.match(r.text, /Aucune surveillance active/);
    assert.match(r.text, /action="\/formateur\/seo\/taches\/monitor\/executer"/);
    assert.match(r.text, /Configurer la surveillance/);
  });
});

describe("Tâches à faire", () => {
  test("marquer comme terminée puis rouvrir ; compteur de la barre latérale", async () => {
    const badge = async () => Number(((await prof.get("/formateur/seo")).text.match(/aria-label="(\d+) tâche\(s\) à faire"/) || [])[1] || 0);
    const before = await badge();
    assert.ok(before >= 2, `au moins 2 tâches de configuration (${before})`);
    const r = await prof.post("/formateur/seo/a-faire", { key: "config:social_profiles", done: "1" });
    assert.match(decodeURIComponent(r.location), /Tâche marquée comme terminée/);
    assert.equal(await badge(), before - 1);
    const page = await prof.get("/formateur/seo/taches");
    assert.match(page.text, /data-done="1"/);
    await prof.post("/formateur/seo/a-faire", { key: "config:social_profiles", done: "0" });
    assert.equal(await badge(), before);
  });
  test("clé inconnue refusée", async () => {
    const r = await prof.post("/formateur/seo/a-faire", { key: "<script>", done: "1" });
    assert.match(decodeURIComponent(r.location), /err=Tâche inconnue/);
    assert.equal(q("SELECT COUNT(*) n FROM seo_tasks_done WHERE key = '<script>'")[0].n, 0);
  });
  test("une tâche de configuration disparaît une fois le réglage fait", async () => {
    await prof.post("/formateur/seo/reglages", { social_profiles: "https://www.facebook.com/kolakisa" });
    assert.doesNotMatch((await prof.get("/formateur/seo/taches")).text, /Profils sociaux non configurés/);
  });
});

describe("Après un audit", () => {
  let auditId;
  before(async () => {
    const r = await prof.post("/formateur/seo/audit", { kind: "full" });
    auditId = Number(new URL(r.location, srv.base).searchParams.get("id"));
  });
  test("vue d'ensemble : score, faits réels, catégories", async () => {
    const r = await prof.get("/formateur/seo");
    const a = q("SELECT pages, issues, scores FROM seo_audits WHERE id = ?", auditId)[0];
    const score = JSON.parse(a.scores).overall.score;
    assert.match(r.text, new RegExp(`aria-label="Note SEO : ${score} sur 100`));
    assert.match(r.text, /Dernier audit/);
    assert.match(r.text, /aria-label="Scores par catégorie"/);
  });
  test("audit : vues critiques / avertissements / réussites et filtre par règle", async () => {
    const all = await prof.get(`/formateur/seo/audit?id=${auditId}`);
    assert.match(all.text, /Réussites/);
    const ok = await prof.get(`/formateur/seo/audit?id=${auditId}&vue=reussites`);
    assert.match(ok.text, /class="seo-passed"/);
    const issue = q("SELECT rule_id FROM seo_issues WHERE audit_id = ? AND severity <> 'info' LIMIT 1", auditId)[0];
    if (issue) {
      const one = await prof.get(`/formateur/seo/audit?id=${auditId}&regle=${issue.rule_id}`);
      const shown = (one.text.match(/<li class="seo-issue /g) || []).length;
      assert.equal(shown, q("SELECT COUNT(*) n FROM seo_issues WHERE audit_id = ? AND rule_id = ?", auditId, issue.rule_id)[0].n);
      // la tâche correspondante existe et mène à ce filtre
      assert.match((await prof.get("/formateur/seo/taches")).text, new RegExp(`regle=${issue.rule_id}`));
    }
  });
  test("contenus : état calculé d'après l'audit", async () => {
    const r = await prof.get("/formateur/seo/contenus");
    assert.doesNotMatch(r.text, /Non analysé<\/span>/);
    assert.match(r.text, /seo-state tone-(good|warn|bad)/);
  });
  test("journal : audits et modifications lisibles", async () => {
    await prof.post("/formateur/seo/redirections", { source: "/ancien-chemin", target: "/catalogue", status: "301" });
    const r = await prof.get("/formateur/seo/journal");
    assert.match(r.text, /Scan complet terminé/);
    assert.match(r.text, /Redirection créée/);
    assert.match(r.text, /\/ancien-chemin → \/catalogue \(301\)/);
  });
  test("redirections : filtres actives / désactivées", async () => {
    const id = q("SELECT id FROM seo_redirects WHERE source_path = '/ancien-chemin'")[0].id;
    await prof.post(`/formateur/seo/redirections/${id}`, { source: "/ancien-chemin", target: "/catalogue", status: "301", enabled: "0" });
    assert.match((await prof.get("/formateur/seo/redirections?etat=desactivees")).text, /\/ancien-chemin/);
    assert.doesNotMatch((await prof.get("/formateur/seo/redirections?etat=actives")).text, /\/ancien-chemin/);
  });
});

describe("Apparence partagée", () => {
  test("le thème choisi depuis l'espace SEO s'applique aussi à Mon espace", async () => {
    assert.match((await prof.get("/formateur/seo/apparence")).text, /data-appearance/);
    await prof.postJson("/formateur/apparence", { theme: "gris-fonce" });
    assert.match((await prof.get("/formateur/seo")).text, /--dash-sidebar: #1f2329/);
    assert.match((await prof.get("/formateur")).text, /--dash-sidebar: #1f2329/);
  });
  test("couleur des cartes personnalisée, texte lisible et jetons d'état", async () => {
    const r = await prof.postJson("/formateur/apparence", { theme: "perso", colors: { card: "#1A1F25" } });
    assert.deepEqual(JSON.parse(r.text).prefs.colors, { card: "#1a1f25" });
    const page = (await prof.get("/formateur/seo")).text;
    assert.match(page, /--dash-card: #1a1f25/);
    assert.match(page, /--dash-text: #e8ecef/);
    assert.match(page, /--dash-success: #4ade80/);
    await prof.postJson("/formateur/apparence", { theme: "clair", colors: {} });
  });
});
