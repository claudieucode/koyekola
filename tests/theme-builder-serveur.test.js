// Theme Builder (mission 9) — par les vraies routes d'un vrai serveur. Chaque test porte sur un point de l'audit :
// protection des modifications concurrentes d'un composant (palier 7), parties globales d'un site copié ou déplacé,
// protection d'une page qui sert de modèle de thème, explication de la résolution (quel modèle, pourquoi), 404 et rendu sans doublon.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { legacyPost } = require("./legacy-parts-helper");
const { startServer, Client, loginInstructor, newStudent } = require("./helpers");

const UA = { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 Chrome/120 Safari/537.36" };
const J = (r) => JSON.parse(r.text);
const idFrom = (location) => Number(location.match(/(\d+)(#.*)?$/)[1]);
const layout = (text, id = "00000001") => ({ id: `sect${id}`, type: "layout", children: [{ id: `cont${id}`, type: "container", children: [{ id: `head${id}`, type: "heading", props: { text, level: 2 } }] }] });

describe("Theme Builder (vrai serveur)", () => {
  let srv, boss, db, editor, reader;
  const json = (who, method, path, body) => who.request(path, { method, json: body || {}, headers: { Origin: srv.base } });
  const newPage = async (name, siteId) => idFrom((await boss.post("/marketing/pages", siteId ? { name, site_id: String(siteId) } : { name })).location);
  const publish = (id) => json(boss, "POST", `/marketing/pages/${id}/publier.json`, {});
  const draftOf = (id) => db.prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(id).revision;
  const saveDraft = async (id, sections) => json(boss, "PUT", `/marketing/pages/${id}/brouillon`, { revision: draftOf(id), content: { sections } });
  const html = async (path, who = new Client(srv.base)) => (await who.get(path, { headers: UA })).text;
  const slugOf = (id) => db.prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(id).slug;
  const newComponent = async (name, text, extra = {}) => J(await json(boss, "POST", "/marketing/site-web/composants", { name, section: layout(text), global: true, ...extra })).component;

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    db = srv.db();
    editor = await newStudent(srv);
    db.prepare("INSERT INTO mk_org_members (organization_id, user_id, role) VALUES (1, (SELECT id FROM users WHERE email = ?), 'editor')").run(editor.email);
    reader = await newStudent(srv);
    db.prepare("INSERT INTO mk_org_members (organization_id, user_id, role) VALUES (1, (SELECT id FROM users WHERE email = ?), 'viewer')").run(reader.email);
  });
  after(() => srv.stop());

  describe("composants : modifications concurrentes (garanties du palier 7)", () => {
    test("deux onglets : l'enregistrement fait avec une révision périmée est refusé (409), le brouillon de l'autre onglet est intact", async () => {
      const c = await newComponent("Bandeau concurrent", "Version A");
      const put = (text, revision) => json(boss, "PUT", `/marketing/site-web/composants/${c.id}/brouillon`, { revision, content: { sections: [layout(text)] } });
      const first = await put("Onglet 1", 0);
      assert.equal(first.status, 200);
      const rev1 = J(first).revision;
      assert.ok(Number.isInteger(rev1) && rev1 >= 1, "la réponse donne la nouvelle révision (pas un 0 fixe)");
      const second = await put("Onglet 2 (partait d'une copie périmée)", 0);
      assert.equal(second.status, 409, "écrasement silencieux refusé");
      assert.match(second.text, /modifi/i);
      const draft = JSON.parse(db.prepare("SELECT draft FROM mk_web_components WHERE id = ?").get(c.id).draft);
      assert.match(JSON.stringify(draft), /Onglet 1/);
      assert.doesNotMatch(JSON.stringify(draft), /Onglet 2/);
      assert.equal((await put("Onglet 1 suite", rev1)).status, 200, "avec la bonne révision, l'enregistrement passe");
    });

    test("« Mettre à jour » diffuse la dernière version CONFIRMÉE ; une révision périmée est refusée et rien n'est diffusé", async () => {
      const c = await newComponent("Bandeau diffusé", "Diffusé v1");
      const put = (text, revision) => json(boss, "PUT", `/marketing/site-web/composants/${c.id}/brouillon`, { revision, content: { sections: [layout(text)] } });
      const r1 = J(await put("Brouillon v2", 0)).revision;
      const stale = await json(boss, "POST", `/marketing/site-web/composants/${c.id}/mettre-a-jour`, { revision: r1 - 1 });
      assert.equal(stale.status, 409, "mise à jour demandée sur une révision que le serveur n'a plus : refusée");
      assert.match(JSON.stringify(JSON.parse(db.prepare("SELECT section FROM mk_web_components WHERE id = ?").get(c.id).section)), /Diffusé v1/, "rien n'a été diffusé");
      const ok = await json(boss, "POST", `/marketing/site-web/composants/${c.id}/mettre-a-jour`, { revision: r1 });
      assert.equal(ok.status, 200);
      assert.match(JSON.stringify(JSON.parse(db.prepare("SELECT section FROM mk_web_components WHERE id = ?").get(c.id).section)), /Brouillon v2/);
      assert.equal(db.prepare("SELECT version FROM mk_web_components WHERE id = ?").get(c.id).version, 2);
      const again = await json(boss, "POST", `/marketing/site-web/composants/${c.id}/mettre-a-jour`, {});
      assert.equal(again.status, 200);
      assert.equal(J(again).changed, false, "version identique : rien de nouveau n'est publié");
      assert.equal(db.prepare("SELECT version FROM mk_web_components WHERE id = ?").get(c.id).version, 2, "pas de version en double");
    });

    test("deux composants distincts se mettent à jour indépendamment ; un composant utilisé par plusieurs pages les met toutes à jour, et seulement elles", async () => {
      const a = await newComponent("Composant A", "A-v1"), b = await newComponent("Composant B", "B-v1");
      const link = (cid) => [{ id: "link00000001", type: "component", componentId: cid }];
      const pagesOf = [];
      for (const [name, cid] of [["Page A1", a.id], ["Page A2", a.id], ["Page B", b.id], ["Page libre", null]]) {
        const id = await newPage(name);
        assert.equal((await saveDraft(id, cid ? link(cid) : [layout("LIBRE")])).status, 200);
        assert.equal((await publish(id)).status, 200);
        pagesOf.push(id);
      }
      const put = (c, text) => json(boss, "PUT", `/marketing/site-web/composants/${c.id}/brouillon`, { revision: db.prepare("SELECT revision FROM mk_web_components WHERE id = ?").get(c.id).revision, content: { sections: [layout(text)] } });
      await put(a, "A-v2"); await put(b, "B-v2");
      const up = await json(boss, "POST", `/marketing/site-web/composants/${a.id}/mettre-a-jour`, { revision: db.prepare("SELECT revision FROM mk_web_components WHERE id = ?").get(a.id).revision });
      assert.equal(up.status, 200);
      assert.equal(J(up).pages, 2, "deux pages utilisent A");
      const live = async (i) => html(`/p/${slugOf(pagesOf[i])}`);
      assert.match(await live(0), /A-v2/); assert.match(await live(1), /A-v2/);
      assert.match(await live(2), /B-v1/, "B n'a pas été touché par la mise à jour de A");
      assert.doesNotMatch(await live(2), /B-v2/, "le brouillon de B n'est pas diffusé");
      assert.match(await live(3), /LIBRE/, "une page sans composant ne change pas");
      assert.ok(db.prepare("SELECT draft FROM mk_web_components WHERE id = ?").get(b.id).draft, "le brouillon de B est toujours là");
    });

    test("un lecteur ne peut ni enregistrer, ni diffuser, ni supprimer un composant (côté serveur)", async () => {
      const c = await newComponent("Bandeau protégé", "Protégé");
      for (const [m, p, b] of [["PUT", `/brouillon`, { revision: 0, content: { sections: [layout("X")] } }], ["POST", `/mettre-a-jour`, {}], ["POST", `/supprimer`, {}], ["POST", `/abandonner`, {}]]) {
        const r = await json(reader, m, `/marketing/site-web/composants/${c.id}${p}`, b);
        assert.ok([401, 403, 302].includes(r.status), `${m} ${p} → ${r.status}`);
      }
      assert.ok(db.prepare("SELECT 1 FROM mk_web_components WHERE id = ?").get(c.id), "le composant existe toujours");
    });
  });

  describe("parties globales d'un site : copie, déplacement, isolation entre sites", () => {
    let siteA, headerA, pageA;
    before(async () => {
      siteA = idFrom((await boss.post("/marketing/site-web/sites", { name: "Site source" })).location);
      legacyPost(srv, `/marketing/site-web/sites/${siteA}/entete/creer`, {});
      headerA = db.prepare("SELECT header_component_id FROM mk_sites WHERE id = ?").get(siteA).header_component_id;
      pageA = await newPage("Accueil source", siteA);
      assert.equal((await publish(pageA)).status, 200);
    });

    test("pied de page : affiché une seule fois sur chaque page du site, jamais sur une page d'un autre site, retiré quand on le retire ; l'exception « aucun en-tête » ne touche pas le pied", async () => {
      const footer = J(await json(boss, "POST", "/marketing/site-web/composants", { name: "Pied commun", section: layout("PIED-TEST", "foot00000001"), siteId: String(siteA) })).component;
      assert.equal((legacyPost(srv, `/marketing/site-web/sites/${siteA}/parties`, { header: String(headerA), footer: String(footer.id) })).status, 302);
      const count = (h, re) => (h.match(re) || []).length;
      const a = await html(`/p/${slugOf(pageA)}`);
      assert.equal(count(a, /lp-site-footer/g) >= 1, true, "le pied de page est affiché");
      assert.equal(count(a, /PIED-TEST/g), 1, "une seule fois");
      assert.equal(count(a, /lp-site-header/g) >= 1, true);
      const noHeader = await newPage("Sans en-tête pied", siteA);
      await publish(noHeader);
      legacyPost(srv, `/marketing/site-web/sites/${siteA}/entete/pages/${noHeader}`, { choice: "none" });
      const b = await html(`/p/${slugOf(noHeader)}`);
      assert.equal(count(b, /lp-site-header/g), 0, "exception : pas d'en-tête");
      assert.equal(count(b, /PIED-TEST/g), 1, "le pied de page reste");
      const other = await newPage("Page d'un autre site", idFrom((await boss.post("/marketing/site-web/sites", { name: "Site sans parties" })).location));
      await publish(other);
      assert.doesNotMatch(await html(`/p/${slugOf(other)}`), /PIED-TEST/, "un pied de page ne sort pas de son site");
      const cross = await legacyPost(srv, `/marketing/site-web/sites/${idFrom((await boss.post("/marketing/site-web/sites", { name: "Troisième" })).location)}/parties`, { header: "", footer: String(footer.id) });
      assert.equal(cross.status, 302);
      assert.equal(db.prepare("SELECT COUNT(*) n FROM mk_sites WHERE footer_component_id = ?").get(footer.id).n, 1, "un composant réservé à un site ne peut pas devenir le pied d'un autre site");
      legacyPost(srv, `/marketing/site-web/sites/${siteA}/parties`, { header: String(headerA), footer: "" });
      assert.doesNotMatch(await html(`/p/${slugOf(pageA)}`), /PIED-TEST/, "pied retiré");
    });

    test("un site dupliqué garde son en-tête (copie propre au nouveau site) et les pages sans en-tête restent sans en-tête", async () => {
      const second = await newPage("Sans en-tête", siteA);
      await publish(second);
      legacyPost(srv, `/marketing/site-web/sites/${siteA}/entete/pages/${second}`, { choice: "none" });
      const r = await boss.post(`/marketing/site-web/sites/${siteA}/dupliquer`, {});
      const copy = idFrom(r.location);
      const row = db.prepare("SELECT header_component_id FROM mk_sites WHERE id = ?").get(copy);
      assert.ok(row.header_component_id, "la copie a un en-tête");
      assert.notEqual(row.header_component_id, headerA, "composant propre à la copie : modifier l'un ne change pas l'autre");
      const comp = db.prepare("SELECT site_id, section FROM mk_web_components WHERE id = ?").get(row.header_component_id);
      assert.equal(comp.site_id, copy, "réservé au site copié");
      const src = JSON.parse(db.prepare("SELECT section FROM mk_web_components WHERE id = ?").get(headerA).section);
      const dup = JSON.parse(comp.section);
      const ids = (s) => { const out = []; const walk = (x) => { if (x.id) out.push(x.id); (x.children || []).forEach(walk); }; walk(s); return out; };
      assert.equal(ids(src).length, ids(dup).length, "même contenu");
      assert.equal(ids(src).filter((i) => ids(dup).includes(i)).length, 0, "identifiants tous régénérés");
      const copiedNone = db.prepare("SELECT header_mode FROM mk_landing_pages WHERE site_id = ? AND name LIKE 'Sans en-tête%'").get(copy);
      assert.equal(copiedNone.header_mode, "none", "l'exception « aucun en-tête » est conservée");
    });

    test("déplacer vers un autre site une page qui a une variante d'en-tête du site d'origine : la variante n'est pas emportée", async () => {
      const siteB = idFrom((await boss.post("/marketing/site-web/sites", { name: "Site destination" })).location);
      const p = await newPage("Page à variante", siteA);
      await publish(p);
      const v = legacyPost(srv, `/marketing/site-web/sites/${siteA}/entete/variante`, { name: "Variante A" });
      const variant = db.prepare("SELECT id FROM mk_web_components WHERE variant_of = ? ORDER BY id DESC").get(headerA);
      assert.ok(variant, "variante créée " + v.status);
      assert.equal((legacyPost(srv, `/marketing/site-web/sites/${siteA}/entete/pages/${p}`, { choice: `variant:${variant.id}` })).status, 302);
      assert.equal(db.prepare("SELECT header_mode FROM mk_landing_pages WHERE id = ?").get(p).header_mode, "variant");
      const mv = await boss.post(`/marketing/pages/${p}`, { name: "Page à variante", slug: slugOf(p), site_id: String(siteB) });
      const after = db.prepare("SELECT site_id, header_mode, header_component_id FROM mk_landing_pages WHERE id = ?").get(p);
      assert.equal(after.site_id, siteB, "la page a bien changé de site (statut " + mv.status + ")");
      assert.equal(after.header_mode, "inherit", "l'exception de l'ancien site est retirée");
      assert.equal(after.header_component_id, null);
      assert.doesNotMatch(await html(`/p/${slugOf(p)}`), /Variante A/, "la page publiée n'affiche pas la variante de l'autre site");
    });
  });

  describe("modèles de thème : protection, explication, rendu", () => {
    let tplPage, tplId;
    const assign = (fields) => boss.post("/marketing/site-web/modeles-de-theme", fields);
    const read = () => { const r = db.prepare("SELECT value FROM mk_settings WHERE key = 'theme.templates'").get(); return r ? JSON.parse(r.value) : []; };
    before(async () => {
      db.prepare("INSERT INTO posts (slug, title, excerpt, content, content_format, category, published, published_at, status, comments_enabled) VALUES ('mon-article', 'Mon article', 'Résumé.', '<p>Texte réel.</p>', 'html', 'Conseils', 1, datetime('now', '-1 hour'), 'published', 1)").run();
      tplPage = await newPage("Modèle d'article");
      await saveDraft(tplPage, [{ id: "sect00000009", type: "layout", children: [{ id: "cont00000009", type: "container", children: [{ id: "head00000009", type: "heading", props: { text: "TPL {{post.title}}", level: 1 } }, { id: "post00000009", type: "postcontent", props: {} }] }] }]);
      await publish(tplPage);
      await assign({ type: "single_post", page_id: String(tplPage) });
      tplId = read()[0].id;
    });

    test("rendu : un seul document HTML, une seule feuille de style du site, le modèle est appliqué", async () => {
      const h = await html("/blog/mon-article");
      assert.match(h, /TPL Mon article/);
      assert.equal((h.match(/<html[\s>]/g) || []).length, 1, "un seul <html>");
      assert.equal((h.match(/<head[\s>]/g) || []).length, 1, "un seul <head>");
      assert.equal((h.match(/<body[\s>]/g) || []).length, 1, "un seul <body>");
      assert.ok((h.match(/id="kw-appearance"/g) || []).length <= 1, "styles du site injectés au plus une fois");
    });

    test("une page qui sert de modèle n'est pas mise à la corbeille en silence : refus qui nomme le modèle, ou détachement explicite", async () => {
      const refused = await boss.post(`/marketing/pages/${tplPage}/archiver`, {});
      assert.equal(refused.status, 302);
      assert.equal(db.prepare("SELECT archived_at FROM mk_landing_pages WHERE id = ?").get(tplPage).archived_at, null, "la page n'est pas archivée");
      assert.equal(read().length, 1, "l'affectation est conservée");
      assert.match(await html("/blog/mon-article"), /TPL Mon article/, "le site public continue d'utiliser le modèle");
      const flash = (await boss.get(refused.location)).text;
      assert.match(flash.replace(/&#39;/g, "'"), /modèle de thème|modèles de thème/);
      const ok = await boss.post(`/marketing/pages/${tplPage}/archiver`, { detacher: "on" });
      assert.equal(ok.status, 302);
      assert.ok(db.prepare("SELECT archived_at FROM mk_landing_pages WHERE id = ?").get(tplPage).archived_at, "archivée après confirmation");
      assert.equal(read().length, 0, "affectation retirée avec elle : aucune référence orpheline");
      assert.doesNotMatch(await html("/blog/mon-article"), /TPL Mon article/, "retour à l'affichage d'origine");
      await boss.post(`/marketing/pages/${tplPage}/restaurer`, {});
    });

    test("explication : pour une adresse donnée, quel modèle est appliqué et pourquoi les autres ne le sont pas", async () => {
      await publish(tplPage);
      const specific = await newPage("Modèle Conseils");
      await saveDraft(specific, [layout("CONSEILS {{post.title}}", "0000000a")]);
      await publish(specific);
      const g = await newPage("Modèle Actus");
      await saveDraft(g, [layout("ACTUS", "0000000b")]);
      await publish(g);
      await assign({ type: "single_post", page_id: String(tplPage) });
      await assign({ type: "single_post", page_id: String(specific), category: "Conseils" });
      await assign({ type: "single_post", page_id: String(g), category: "Actus" });
      const r = await boss.get(`/marketing/site-web/modeles-de-theme/resolution.json?type=single_post&category=Conseils`, { headers: { Accept: "application/json" } });
      assert.equal(r.status, 200);
      const out = J(r);
      assert.equal(out.winner.pageId, specific, "le modèle de la catégorie gagne");
      const why = Object.fromEntries(out.candidates.map((c) => [c.pageId, c]));
      assert.equal(why[specific].applied, true);
      assert.match(why[g].reason, /catégorie/i, "raison de l'exclusion : la catégorie ne correspond pas");
      assert.equal(why[tplPage].applied, false);
      assert.match(why[tplPage].reason, /moins précis|plus précis/i);
      const none = J(await boss.get(`/marketing/site-web/modeles-de-theme/resolution.json?type=not_found`));
      assert.equal(none.winner, null);
      assert.match(none.fallback, /d'origine/);
      assert.equal((await boss.get(`/marketing/site-web/modeles-de-theme/resolution.json?type=inconnu`)).status, 422);
    });

    test("l'écran « Pourquoi ce modèle ? » affiche le gagnant et la raison des exclusions (même règle que le site public)", async () => {
      const page = (await boss.get("/marketing/site-web/modeles-de-theme?why_type=single_post&why_category=Conseils")).text.replace(/&#39;/g, "'");
      assert.match(page, /data-why/);
      assert.match(page, /Modèle utilisé : « Modèle Conseils »/);
      assert.match(page, /ne correspond pas à la page demandée/);
      const none = (await boss.get("/marketing/site-web/modeles-de-theme?why_type=not_found")).text.replace(/&#39;/g, "'");
      assert.match(none, /Aucun modèle utilisé/);
      const bad = (await boss.get("/marketing/site-web/modeles-de-theme?why_type=zzz")).text;
      assert.match(bad, /Type de modèle inconnu/);
      assert.equal((await reader.get("/marketing/site-web/modeles-de-theme?why_type=single_post")).status, 200, "lecture autorisée au lecteur");
    });

    test("un lecteur ne peut ni affecter ni retirer un modèle ; un identifiant invalide ne casse rien", async () => {
      const before = read();
      const r = await reader.post("/marketing/site-web/modeles-de-theme", { type: "single_post", page_id: String(tplPage) });
      assert.ok([302, 401, 403].includes(r.status));
      assert.deepEqual(read(), before, "rien n'a changé");
      const bad = await reader.post(`/marketing/site-web/modeles-de-theme/${before[0].id}/supprimer`, {});
      assert.ok([302, 401, 403].includes(bad.status));
      assert.deepEqual(read(), before);
      const weird = await boss.post(`/marketing/site-web/modeles-de-theme/zzzzzzzz/supprimer`, {});
      assert.ok([302, 404].includes(weird.status));
      for (const pid of ["abc", "-1", "99999999", "1;DROP TABLE posts"]) {
        await assign({ type: "single_post", page_id: pid });
        await assign({ type: "<script>", page_id: String(tplPage) });
      }
      assert.deepEqual(read(), before, "entrées invalides refusées sans effet");
    });

    test("une page d'un tunnel ou d'une autre organisation ne peut pas servir de modèle", async () => {
      const step = await newPage("Étape");
      db.prepare("UPDATE mk_landing_pages SET kind = 'step' WHERE id = ?").run(step);
      const before = read();
      await assign({ type: "single_post", page_id: String(step), category: "Zzz" });
      assert.deepEqual(read(), before);
    });

    test("404 : le modèle s'affiche et la réponse reste un vrai 404", async () => {
      const p = await newPage("Modèle 404");
      await saveDraft(p, [layout("INTROUVABLE-TPL", "0000000c")]);
      await publish(p);
      await assign({ type: "not_found", page_id: String(p) });
      const res = await new Client(srv.base).get("/cette-adresse-n-existe-pas", { headers: UA });
      assert.equal(res.status, 404, "statut HTTP conservé");
      assert.match(res.text, /INTROUVABLE-TPL/);
      assert.equal((res.text.match(/<html[\s>]/g) || []).length, 1);
    });
  });
});
