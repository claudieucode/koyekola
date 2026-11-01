// Theme Builder — stabilisation (audit global) : parcours RÉELS par type, sur un vrai serveur.
// Sélection → contenu réel → éditeur (bon document, bon site, contexte du modèle) → enregistrement → publication → rendu.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");

const TYPES = ["header", "footer", "single_page", "single_post", "archive", "search_results", "not_found", "single_product", "product_archive"];
const J = (r) => JSON.parse(r.text);
const bootOf = (html) => { const m = /<script type="application\/json" id="pb-boot">([\s\S]*?)<\/script>/.exec(html); return m ? JSON.parse(m[1]) : null; };

describe("Theme Builder — parcours réels par type", () => {
  let srv, boss, db, A, B;
  const json = (method, path, body) => boss.request(path, { method, json: body || {}, headers: { Origin: srv.base } });
  const api = (site, p) => `/marketing/site-web/sites/${site}/constructeur-de-theme/api${p}`;
  const mkSite = async (name) => Number((await boss.post("/marketing/site-web/sites", { name })).location.match(/sites\/(\d+)/)[1]);
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db();
    A = await mkSite("Site A"); B = await mkSite("Site B");
    for (const s of [A, B]) db.prepare("INSERT OR IGNORE INTO mk_site_modules (organization_id, site_id, module, enabled) VALUES (1, ?, 'commerce', 1)").run(s);
  });
  after(() => srv.stop());

  for (const type of TYPES) {
    test(`${type} : le modèle utilisé s'ouvre dans l'éditeur avec son vrai contenu, son site et son contexte`, async () => {
      const list = J(await boss.get(api(A, `/bibliotheque?type=${type}&limite=2`)));
      assert.equal(list.ok, true, JSON.stringify(list).slice(0, 200));
      if (!list.available) return;
      const key = list.items[1].key;
      const used = J(await json("POST", api(A, "/bibliotheque/utiliser"), { type, key }));
      assert.equal(used.ok, true, used.error);
      const t = used.template;
      assert.equal(t.siteId, A); assert.equal(t.type, type);
      const ed = await boss.get(t.editUrl);
      assert.equal(ed.status, 200);
      const boot = bootOf(ed.text);
      assert.ok(boot, "boot présent");
      const docId = t.sourceKind === "page" ? boot.page.id : `c${boot.page.component.id}`;
      assert.equal(String(docId), t.sourceKind === "page" ? String(t.sourceId) : `c${t.sourceId}`, "l'éditeur ouvre le document du modèle");
      assert.equal(boot.page.siteId, A, "même site");
      assert.ok(boot.themeTemplate, "contexte Theme Builder fourni à l'éditeur");
      assert.equal(boot.themeTemplate.id, t.id); assert.equal(boot.themeTemplate.type, type);
      assert.equal(boot.themeTemplate.siteId, A); assert.equal(boot.themeTemplate.status, "draft");
      assert.match(boot.themeTemplate.backUrl, new RegExp(`/sites/${A}/constructeur-de-theme`));
      assert.ok(JSON.stringify(boot.content).length > 400, "contenu réel et non vide");
    });
  }

  describe("cycle complet : modifier → enregistrer → publier → rendu, sans basculer ailleurs", () => {
    const use = async (site, type, idx = 0) => {
      const list = J(await boss.get(api(site, `/bibliotheque?type=${type}&limite=5`)));
      return J(await json("POST", api(site, "/bibliotheque/utiliser"), { type, key: list.items[idx].key })).template;
    };
    const editPage = async (t, text) => {
      const ed = bootOf((await boss.get(t.editUrl)).text);
      const content = JSON.parse(JSON.stringify(ed.content));
      const walk = (n) => { if (n && n.type === "heading" && !n.__done) { n.props.text = text; n.__done = true; return true; } return (n && n.children || []).some(walk); };
      content.sections.some(walk);
      const r = await json("PUT", `/marketing/pages/${t.sourceId}/brouillon`, { revision: ed.page.revision, content });
      return r;
    };
    test("page : l'enregistrement va dans le document du modèle, la publication par le Theme Builder rend ce texte", async () => {
      const t = await use(A, "single_page", 2);
      const saved = await editPage(t, "TEXTE-STAB-PAGE");
      assert.equal(saved.status, 200, saved.text);
      const row = db.prepare("SELECT draft FROM mk_landing_pages WHERE id = ?").get(t.sourceId);
      assert.match(row.draft, /TEXTE-STAB-PAGE/);
      const pub = J(await json("POST", api(A, `/modeles/${t.id}/publier`), {}));
      assert.equal(pub.ok, true, pub.error);
      const res = J(await boss.get(api(A, "/resolution?vue=page&type=single_page")));
      assert.equal(res.winner && res.winner.id, t.id);
    });
    test("isolation : aucune route d'un autre site ne lit ni ne modifie ce modèle", async () => {
      const t = await use(A, "footer", 1);
      for (const [m, p] of [["POST", "renommer"], ["POST", "publier"], ["POST", "depublier"], ["POST", "archiver"], ["POST", "restaurer"], ["POST", "dupliquer"], ["POST", "supprimer"], ["POST", "conditions"], ["GET", "versions"], ["GET", "instances"], ["GET", "miniature"], ["GET", "export.json"]]) {
        const r = m === "GET" ? await boss.get(api(B, `/modeles/${t.id}/${p}`).replace("/api/modeles", m === "GET" && p === "export.json" ? "/api/modeles" : "/api/modeles")) : await json(m, api(B, `/modeles/${t.id}/${p}`), { name: "x", conditions: {} });
        assert.ok([404, 403].includes(r.status), `${m} ${p} depuis un autre site → ${r.status}`);
      }
      assert.equal(db.prepare("SELECT status FROM mk_tb_templates WHERE id = ?").get(t.id).status, "draft");
    });
    test("« Publier » de l'éditeur = publication du MODÈLE (mêmes contrôles) ; la page-modèle n'est jamais une page publique autonome", async () => {
      const t = await use(A, "single_post", 3);
      const pg = db.prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(t.sourceId);
      assert.equal((await boss.get(`/p/${pg.slug}`)).status, 404, "brouillon : pas de page publique");
      const r = await json("POST", `/marketing/pages/${t.sourceId}/publier.json`, {});
      assert.equal(r.status, 200, r.text);
      assert.equal(J(r).themeTemplate.id, t.id);
      assert.equal(db.prepare("SELECT status FROM mk_tb_templates WHERE id = ?").get(t.id).status, "published", "l'état du modèle suit la publication");
      assert.equal(db.prepare("SELECT COUNT(*) n FROM mk_tb_versions WHERE template_id = ?").get(t.id).n, 1, "une version est journalisée");
      assert.equal((await boss.get(`/p/${pg.slug}`)).status, 404, "publié : toujours aucune page autonome");
      const res = J(await boss.get(api(A, "/resolution?vue=post&type=single_post")));
      assert.equal(res.winner && res.winner.id, t.id);
    });
    test("« Dépublier » de l'éditeur dépublie le MODÈLE : plus aucun état « publié sans contenu »", async () => {
      const t = await use(A, "search_results", 0);
      assert.equal((await json("POST", `/marketing/pages/${t.sourceId}/publier.json`, {})).status, 200);
      const r = await json("POST", `/marketing/pages/${t.sourceId}/depublier.json`, {});
      assert.equal(r.status, 200, r.text);
      assert.equal(db.prepare("SELECT status FROM mk_tb_templates WHERE id = ?").get(t.id).status, "draft");
      const res = J(await boss.get(api(A, "/resolution?vue=search&type=search_results")));
      assert.equal(res.winner, null);
    });
    test("un conflit bloquant refuse aussi la publication faite depuis l'éditeur (aucun remplacement silencieux)", async () => {
      const a = await use(A, "not_found", 0), b = await use(A, "not_found", 1);
      assert.equal((await json("POST", `/marketing/pages/${a.sourceId}/publier.json`, {})).status, 200);
      const r = await json("POST", `/marketing/pages/${b.sourceId}/publier.json`, {});
      assert.equal(r.status, 409, r.text);
      assert.equal(db.prepare("SELECT status FROM mk_tb_templates WHERE id = ?").get(b.id).status, "draft");
      assert.equal(db.prepare("SELECT status FROM mk_landing_pages WHERE id = ?").get(b.sourceId).status !== "published", true, "la page du second modèle n'a pas été publiée");
    });
  });
});
