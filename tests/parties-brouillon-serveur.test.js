// Mission 9.1 — en-tête et pied de page d'un site : brouillon, aperçu privé, publication explicite (« Mettre à jour »).
// Propriété vérifiée : enregistrer un brouillon ne change JAMAIS le site public ; seule une mise à jour réussie, faite sur la dernière révision, le change.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, Client, loginInstructor, newStudent } = require("./helpers");
const { legacyPost } = require("./legacy-parts-helper");

const UA = { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 Chrome/120 Safari/537.36" };
const idFrom = (l) => Number(l.match(/(?:pages|sites)\/(\d+)|(\d+)(?:#.*)?$/).slice(1).find(Boolean));
const J = (r) => JSON.parse(r.text);
const section = (text, hid) => ({ type: "layout", children: [{ type: "container", children: [{ id: hid, type: "heading", props: { text, level: "2" } }] }] });

describe("brouillon, aperçu et publication des parties de site (vrai serveur)", () => {
  let srv, boss, db, viewer, outsider, siteId, otherSiteId, pageIds = {}, parts = {};
  const json = (who, method, path, body) => who.request(path, { method, json: body || {}, headers: { Origin: srv.base } });
  const slugOf = (id) => db.prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(id).slug;
  const live = async (id) => (await new Client(srv.base).get(`/p/${slugOf(id)}`, { headers: UA })).text;
  const rev = (cid) => db.prepare("SELECT revision FROM mk_web_components WHERE id = ?").get(cid).revision;
  const putDraft = (cid, text, who = boss, revision = rev(cid)) => json(who, "PUT", `/marketing/site-web/composants/${cid}/brouillon`, { revision, content: { sections: [section(text, "head00000001")] } });
  const update = (cid, who = boss, revision = rev(cid)) => json(who, "POST", `/marketing/site-web/composants/${cid}/mettre-a-jour`, { revision });
  const preview = (cid, q = "", who = boss) => who.get(`/marketing/site-web/composants/${cid}/apercu${q}`, { headers: UA });
  const bootOf = async (cid) => JSON.parse((await boss.get(`/marketing/site-web/composants/${cid}/editeur`)).text.match(/<script type="application\/json" id="pb-boot">([\s\S]*?)<\/script>/)[1]);

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    db = srv.db();
    viewer = await newStudent(srv);
    db.prepare("INSERT INTO mk_org_members (organization_id, user_id, role) VALUES (1, (SELECT id FROM users WHERE email = ?), 'viewer')").run(viewer.email);
    outsider = await newStudent(srv);
    siteId = idFrom((await boss.post("/marketing/site-web/sites", { name: "Site brouillon" })).location);
    otherSiteId = idFrom((await boss.post("/marketing/site-web/sites", { name: "Autre site brouillon" })).location);
    for (const [key, site] of [["accueil", siteId], ["contact", siteId], ["autre", otherSiteId]]) {
      const id = idFrom((await boss.post("/marketing/pages", { name: key, site_id: String(site) })).location);
      assert.equal((await json(boss, "POST", `/marketing/pages/${id}/publier.json`, {})).status, 200);
      pageIds[key] = id;
    }
    legacyPost(srv, `/marketing/site-web/sites/${siteId}/entete/creer`, {});
    const headerId = db.prepare("SELECT header_component_id FROM mk_sites WHERE id = ?").get(siteId).header_component_id;
    const footer = J(await json(boss, "POST", "/marketing/site-web/composants", { name: "Pied brouillon", section: section("PIED-V1", "foot00000001"), siteId: String(siteId) })).component;
    legacyPost(srv, `/marketing/site-web/sites/${siteId}/parties`, { header: String(headerId), footer: String(footer.id) });
    // en-tête de départ publié : on le remplace par un texte repérable, par le chemin normal (brouillon puis mise à jour)
    assert.equal((await putDraft(headerId, "ENTETE-V1")).status, 200);
    assert.equal((await update(headerId)).status, 200);
    parts = { header: headerId, footer: footer.id };
  });
  after(() => srv.stop());

  for (const [role, label] of [["header", "ENTETE"], ["footer", "PIED"]]) {
    test(`${role === "header" ? "en-tête" : "pied de page"} : brouillon → rechargement → aperçu → « Mettre à jour » ; le public ne change qu'à la fin`, async () => {
      const cid = parts[role], page = pageIds.accueil;
      assert.match(await live(page), new RegExp(`${label}-V1`));
      // 1-3. modifier et enregistrer
      const saved = await putDraft(cid, `${label}-V2`);
      assert.equal(saved.status, 200);
      assert.equal(J(saved).draft, true);
      assert.equal(J(saved).revision, rev(cid));
      // 6. le public n'a pas changé (toutes les pages du site)
      for (const k of ["accueil", "contact"]) { const h = await live(pageIds[k]); assert.match(h, new RegExp(`${label}-V1`)); assert.doesNotMatch(h, new RegExp(`${label}-V2`)); }
      assert.match(JSON.parse(db.prepare("SELECT section FROM mk_web_components WHERE id = ?").get(cid).section).children[0].children[0].props.text, /V1/, "la version diffusée est intacte en base");
      // 4-5. rechargement de l'éditeur : le brouillon est repris
      const boot = await bootOf(cid);
      assert.match(JSON.stringify(boot.content), new RegExp(`${label}-V2`));
      assert.equal(boot.page.component.hasDraft, true);
      assert.equal(boot.page.component.role, role);
      // 7-8. aperçu = brouillon, jamais visible en public
      const pv = await preview(cid, `?rev=${rev(cid)}`);
      assert.equal(pv.status, 200);
      assert.match(pv.text, new RegExp(`${label}-V2`));
      assert.doesNotMatch(pv.text, new RegExp(`${label}-V1`));
      assert.match(pv.text, /pas encore visible par les visiteurs/);
      assert.match(pv.headers.get("cache-control") || "", /no-store/);
      assert.match(await live(page), new RegExp(`${label}-V1`), "consulter l'aperçu ne publie rien");
      // 9-10. mise à jour
      const up = await update(cid);
      assert.equal(up.status, 200);
      assert.equal(J(up).changed, true);
      for (const k of ["accueil", "contact"]) { const h = await live(pageIds[k]); assert.match(h, new RegExp(`${label}-V2`)); assert.doesNotMatch(h, new RegExp(`${label}-V1`)); }
      assert.equal(db.prepare("SELECT draft FROM mk_web_components WHERE id = ?").get(cid).draft, null);
      // publication répétée : rien de nouveau
      const v = db.prepare("SELECT version FROM mk_web_components WHERE id = ?").get(cid).version;
      const again = await update(cid);
      assert.equal(again.status, 200);
      assert.equal(J(again).changed, false);
      assert.equal(db.prepare("SELECT version FROM mk_web_components WHERE id = ?").get(cid).version, v, "pas de version artificielle");
      // l'autre site n'a rien reçu
      assert.doesNotMatch(await live(pageIds.autre), new RegExp(`${label}-V`));
    });
  }

  test("conflits : enregistrement et mise à jour sur une révision périmée → 409, rien n'est écrasé ni diffusé", async () => {
    const cid = parts.header;
    const r1 = J(await putDraft(cid, "ENTETE-A")).revision;
    const stale = await putDraft(cid, "ENTETE-B-perime", boss, r1 - 1);
    assert.equal(stale.status, 409);
    assert.match(JSON.parse(db.prepare("SELECT draft FROM mk_web_components WHERE id = ?").get(cid).draft).children[0].children[0].props.text, /ENTETE-A/);
    const upStale = await update(cid, boss, r1 - 1);
    assert.equal(upStale.status, 409);
    assert.doesNotMatch(await live(pageIds.accueil), /ENTETE-A/, "rien n'est diffusé");
    // un autre onglet a enregistré entre-temps : « Mettre à jour » demandée avec la révision qu'on avait vue → refusée
    const r2 = J(await putDraft(cid, "ENTETE-C", boss, r1)).revision;
    assert.equal((await update(cid, boss, r1)).status, 409);
    assert.equal((await update(cid, boss, r2)).status, 200);
    assert.match(await live(pageIds.accueil), /ENTETE-C/);
  });

  test("aperçu : révision affichée signalée quand elle a changé ; abandon du brouillon rend la version publiée", async () => {
    const cid = parts.footer;
    const r1 = J(await putDraft(cid, "PIED-X1")).revision;
    J(await putDraft(cid, "PIED-X2", boss, r1));
    const old = await preview(cid, `?rev=${r1}`);
    assert.match(old.text.replace(/&#39;/g, "'"), /Attention : cet aperçu montre la révision \d+, plus récente que celle demandée/);
    assert.match(old.text, /PIED-X2/);
    const res = await json(boss, "POST", `/marketing/site-web/composants/${cid}/abandonner`, { revision: rev(cid) });
    assert.equal(res.status, 200);
    assert.equal(db.prepare("SELECT draft FROM mk_web_components WHERE id = ?").get(cid).draft, null);
    const after = await preview(cid);
    assert.match(after.text, /pas de brouillon/);
    assert.doesNotMatch(after.text, /PIED-X/);
  });

  test("exceptions par page : l'aperçu de l'en-tête n'apparaît pas sur une page « sans en-tête » ; la variante a son propre brouillon", async () => {
    const cid = parts.header;
    legacyPost(srv, `/marketing/site-web/sites/${siteId}/entete/pages/${pageIds.contact}`, { choice: "none" });
    legacyPost(srv, `/marketing/site-web/sites/${siteId}/entete/variante`, { name: "Variante brouillon" });
    const variant = db.prepare("SELECT id FROM mk_web_components WHERE variant_of = ? ORDER BY id DESC").get(cid).id;
    legacyPost(srv, `/marketing/site-web/sites/${siteId}/entete/pages/${pageIds.contact}`, { choice: `variant:${variant}` });
    J(await putDraft(variant, "VARIANTE-V2"));
    assert.doesNotMatch(await live(pageIds.contact), /VARIANTE-V2/, "brouillon de variante invisible en public");
    const pv = await preview(variant);
    assert.match(pv.text, /VARIANTE-V2/);
    assert.doesNotMatch(pv.text, /ENTETE-C/, "la page qui utilise la variante n'affiche pas l'en-tête du site");
    assert.equal((await update(variant)).status, 200);
    assert.match(await live(pageIds.contact), /VARIANTE-V2/);
    assert.match(await live(pageIds.accueil), /ENTETE-C/, "l'en-tête du site n'a pas bougé");
    // retour à l'héritage
    legacyPost(srv, `/marketing/site-web/sites/${siteId}/entete/pages/${pageIds.contact}`, { choice: "inherit" });
  });

  test("permissions : aperçu et lecture pour l'équipe seulement ; un lecteur ne peut ni enregistrer ni publier ; un inconnu n'a aucun accès", async () => {
    const cid = parts.header;
    J(await putDraft(cid, "ENTETE-PRIVE"));
    // visiteur anonyme et membre extérieur à l'organisation : pas d'aperçu
    for (const who of [new Client(srv.base), outsider]) {
      const r = await preview(cid, "", who);
      assert.ok([302, 401, 403, 404].includes(r.status), `statut ${r.status}`);
      assert.doesNotMatch(r.text, /ENTETE-PRIVE/);
    }
    assert.equal((await preview(cid, "", viewer)).status, 200, "un lecteur de l'équipe peut voir l'aperçu (comme celui des pages)");
    for (const who of [viewer, outsider, new Client(srv.base)]) {
      const w = await putDraft(cid, "ENTETE-PIRATE", who);
      const p = await update(cid, who);
      assert.ok([302, 401, 403].includes(w.status) && [302, 401, 403].includes(p.status), `écriture refusée (${w.status}/${p.status})`);
    }
    assert.doesNotMatch(await live(pageIds.accueil), /ENTETE-PIRATE|ENTETE-PRIVE/);
    assert.match(db.prepare("SELECT draft FROM mk_web_components WHERE id = ?").get(cid).draft, /ENTETE-PRIVE/);
    // identifiants invalides
    for (const bad of ["99999999", "0"]) assert.equal((await preview(bad)).status, 404);
    assert.equal((await boss.get("/marketing/site-web/composants/abc/apercu")).status, 404);
  });

  test("isolation entre sites : l'aperçu d'un composant n'utilise jamais une page d'un autre site ; le contenu ne peut pas être publié par la route de renommage", async () => {
    const cid = parts.header;
    const pv = await preview(cid, `?page=${pageIds.autre}`);
    assert.equal(pv.status, 200);
    assert.doesNotMatch(pv.text, /<h1>autre<\/h1>/, "la page d'un autre site est ignorée");
    const direct = await json(boss, "POST", `/marketing/site-web/composants/${cid}`, { section: section("ENTETE-DIRECT", "head00000009") });
    assert.equal(direct.status, 422);
    assert.doesNotMatch(await live(pageIds.accueil), /ENTETE-DIRECT/);
    const rename = await json(boss, "POST", `/marketing/site-web/composants/${cid}`, { name: "En-tête renommé" });
    assert.equal(rename.status, 200, "renommer reste possible");
  });

  test("copie de site et déplacement de page : les parties publiées suivent, les pages ordinaires restent identiques", async () => {
    const copy = idFrom((await boss.post(`/marketing/site-web/sites/${siteId}/dupliquer`, {})).location);
    const row = db.prepare("SELECT header_component_id h, footer_component_id f FROM mk_sites WHERE id = ?").get(copy);
    assert.ok(row.h && row.f && row.h !== parts.header && row.f !== parts.footer);
    const page = db.prepare("SELECT id, slug FROM mk_landing_pages WHERE site_id = ? ORDER BY id LIMIT 1").get(copy);
    await json(boss, "POST", `/marketing/pages/${page.id}/publier.json`, {});
    assert.match((await new Client(srv.base).get(`/p/${page.slug}`, { headers: UA })).text, /ENTETE-C|PIED-V2/, "la copie affiche la version publiée de la source");
    // un brouillon de l'original n'est pas copié dans le public de la copie
    J(await putDraft(parts.header, "ENTETE-NON-COPIE"));
    assert.doesNotMatch((await new Client(srv.base).get(`/p/${page.slug}`, { headers: UA })).text, /ENTETE-NON-COPIE/);
    await json(boss, "POST", `/marketing/site-web/composants/${parts.header}/abandonner`, { revision: rev(parts.header) });
    // page ordinaire (hors site) : aucune partie
    const solo = idFrom((await boss.post("/marketing/pages", { name: "Seule" })).location);
    await json(boss, "POST", `/marketing/pages/${solo}/publier.json`, {});
    assert.doesNotMatch(await live(solo), /ENTETE|PIED/);
  });
});
