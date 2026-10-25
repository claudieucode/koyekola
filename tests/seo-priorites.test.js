// SEO d'un site : « À traiter en priorité » — problèmes regroupés par type, ordonnés par gravité puis par nombre de pages concernées,
// filtre par règle, présence sur la vue générale, isolation entre sites.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor, newStudent } = require("./helpers");
const { BY_ID } = require("../src/seo/rules");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const SP = "/marketing/site-web/sites";

describe("SEO d'un site : priorités", () => {
  let srv, boss, db, X, Y, orgId;
  const mkSite = async (name) => Number(String((await boss.post(SP, { name })).location).match(/sites\/(\d+)/)[1]);
  const addPage = (site, slug, title, description = "") => Number(db.prepare("INSERT INTO mk_landing_pages (organization_id, name, slug, title, description, status, site_id, published_at, indexable) VALUES (?, ?, ?, ?, ?, 'published', ?, datetime('now'), 1)").run(orgId, slug, slug, title, description, site).lastInsertRowid);
  const analyse = async (site) => {
    const start = await boss.post(`${SP}/${site}/seo/analyse`, {});
    const id = Number(String(start.location).match(/analyse=(\d+)/)[1]);
    let st; for (let i = 0; i < 90; i++) { st = JSON.parse((await boss.get(`${SP}/${site}/seo/analyse/etat?id=${id}`)).text); if (st.status !== "running") break; await sleep(1000); }
    assert.equal(st.status, "done", st.error || "l'analyse doit se terminer");
    return id;
  };

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "", ALLOW_INDEXING: "1" });
    boss = await loginInstructor(srv); db = srv.db();
    orgId = db.prepare("SELECT id FROM mk_organizations").get().id;
    X = await mkSite("Site Priorités X"); Y = await mkSite("Site Priorités Y");
    const home = addPage(X, "accueil", "Accueil X", "Une description de longueur correcte pour la page d'accueil du site X, utile aux visiteurs.");
    addPage(X, "contact", "Contact", "");
    addPage(X, "equipe", "Équipe", "Courte.");
    db.prepare("UPDATE mk_sites SET home_page_id = ? WHERE id = ?").run(home, X);
    addPage(Y, "accueil-y", "Accueil Y", "");
  });
  after(async () => { db.close(); await srv.stop(); });

  test("les problèmes sont regroupés par type, avec le nombre réel de pages, du plus grave et du plus répandu au moins important", async () => {
    const id = await analyse(X);
    const html = (await boss.get(`${SP}/${X}/seo/analyse?analyse=${id}`)).text;
    assert.match(html, /<h2 id="an-prio">À traiter en priorité<\/h2>/);
    const rows = [...html.split('id="an-prio"')[1].split("</section>")[0].matchAll(/<tr>([\s\S]*?)<\/tr>/g)].map((m) => m[1]).filter((r) => r.includes("<td"));
    assert.ok(rows.length >= 2, "plusieurs types de problèmes");
    const rank = { Critique: 0, Avertissement: 1, Recommandation: 2 };
    const parsed = rows.map((r) => ({ level: (r.match(/mk-status[^>]*>([^<]+)</) || [])[1], pages: Number((r.match(/data-label="Pages">(\d+) page/) || [])[1]) }));
    for (let i = 1; i < parsed.length; i++) {
      assert.ok(rank[parsed[i - 1].level] <= rank[parsed[i].level], "gravité décroissante");
      if (parsed[i - 1].level === parsed[i].level) assert.ok(parsed[i - 1].pages >= parsed[i].pages, "à gravité égale, plus de pages d'abord");
    }
    assert.ok(parsed.every((p) => p.pages >= 1));
    assert.match(html, /relancez l'analyse/i, "le moyen de vérifier la correction est indiqué");
  });

  test("filtre par type de problème : seules les lignes de cette règle, les autres filtres sont conservés ; règle inconnue ou piégée sans effet de bord", async () => {
    const id = await analyse(X);
    const issues = db.prepare("SELECT rule_id, COUNT(DISTINCT path) n FROM seo_issues WHERE audit_id = ? GROUP BY rule_id").all(id);
    const target = issues.find((i) => BY_ID[i.rule_id]);
    const html = (await boss.get(`${SP}/${X}/seo/analyse?analyse=${id}&regle=${target.rule_id}`)).text;
    const list = html.split('id="an-list"')[1];
    const titles = [...list.matchAll(/<td data-label="Constat"><strong>([^<]+)<\/strong>/g)].map((m) => m[1]);
    assert.ok(titles.length >= 1);
    assert.ok(titles.every((t) => t === BY_ID[target.rule_id].title), `uniquement « ${BY_ID[target.rule_id].title} »`);
    assert.match(html, new RegExp(`name="regle" value="${target.rule_id}"`), "la règle reste dans le formulaire de filtre");
    for (const bad of ["inconnue_xyz", encodeURIComponent("../../etc"), encodeURIComponent("' OR 1=1 --")]) {
      const r = await boss.get(`${SP}/${X}/seo/analyse?analyse=${id}&regle=${bad}`);
      assert.equal(r.status, 200, bad);
      assert.doesNotMatch(r.text, /<td data-label="Constat">/, "aucun constat ne correspond");
    }
  });

  test("vue générale : « À traiter en premier » (3 au plus) depuis la dernière analyse ; absent avant la première analyse", async () => {
    const before_ = (await boss.get(`${SP}/${Y}/seo`)).text;
    assert.doesNotMatch(before_, /À traiter en premier/);
    const html = (await boss.get(`${SP}/${X}/seo`)).text;
    assert.match(html, /<h2 id="seo-prio">À traiter en premier<\/h2>/);
    const items = html.split('id="seo-prio"')[1].split("</section>")[0].match(/<li>/g) || [];
    assert.ok(items.length >= 1 && items.length <= 3, `${items.length} élément(s)`);
    assert.match(html, /analyse\?analyse=\d+&amp;regle=[a-z0-9_]+#an-list/);
  });

  test("isolation : les priorités d'un site ne montrent ni les pages ni les analyses d'un autre site", async () => {
    await analyse(Y);
    const htmlY = (await boss.get(`${SP}/${Y}/seo/analyse`)).text;
    assert.doesNotMatch(htmlY, /\/p\/contact|\/p\/equipe|Accueil X/, "aucune page de X chez Y");
    const idX = db.prepare("SELECT id FROM seo_audits WHERE site_id = ? ORDER BY id DESC").get(X).id;
    const cross = await boss.get(`${SP}/${Y}/seo/analyse?analyse=${idX}&regle=h1_missing`);
    assert.doesNotMatch(cross.text, /\/p\/contact|\/p\/equipe/, "l'analyse d'un autre site n'est pas lisible");
  });

  test("un compte sans droit sur le site n'accède à aucune priorité", async () => {
    const outsider = await newStudent(srv);
    const r = await outsider.get(`${SP}/${X}/seo/analyse`);
    assert.ok([302, 403, 404].includes(r.status), String(r.status));
    assert.doesNotMatch(r.text || "", /À traiter en priorité/);
  });
});
