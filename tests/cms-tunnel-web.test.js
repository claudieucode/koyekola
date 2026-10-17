// KOLAKISA CMS — palier 18 : CMS ↔ Tunnel de bout en bout par les vraies routes (vrai serveur, vraie base) :
// page CMS construite et publiée, tunnel, étape = référence, rendu réel, modification visible, aucune copie, protection à la suppression,
// SEO / pied de page de l'étape, étapes suivante et précise, permissions croisées, isolation des sites (IDOR), journal et santé.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, Client, loginInstructor, newStudent } = require("./helpers");

let srv, boss, db, anon, orgId, siteA, siteB;
let pageA1, pageA2, pageB1, funnelA, step1, step2;
const one = (sql, ...a) => db.prepare(sql).get(...a);
const count = (sql, ...a) => one(sql, ...a).n;
const M = "/marketing";
const idOf = (c) => one("SELECT id FROM users WHERE email = ?", c.email).id;
const lastId = (loc, re) => Number(String(loc).match(re)[1]);
async function livePage(client, name, { site = "", sections = [{ type: "text", markdown: `Contenu de ${name}.` }] } = {}) {
  const r = await client.post(`${M}/pages`, { name, template: "", ...(site ? { site_id: String(site) } : {}) });
  assert.equal(r.status, 302, r.text.slice(0, 200));
  const id = lastId(r.location, /pages\/(\d+)/);
  const rev = one("SELECT revision FROM mk_landing_pages WHERE id = ?", id).revision;
  assert.equal((await client.request(`${M}/pages/${id}/brouillon`, { method: "PUT", json: { revision: rev, content: { title: name, description: "", sections } } })).status, 200);
  db.prepare("UPDATE mk_landing_pages SET indexable = 1 WHERE id = ?").run(id);
  assert.equal((await client.post(`${M}/pages/${id}/publier.json`, {})).status, 200);
  return { id, slug: one("SELECT slug FROM mk_landing_pages WHERE id = ?", id).slug, name };
}
async function member(role) {
  const c = await newStudent(srv);
  db.prepare("INSERT INTO mk_org_members (organization_id, user_id, role) VALUES (?, ?, ?)").run(orgId, idOf(c), role);
  return c;
}
async function customMember(name, perms) {
  const r = await boss.post(`${M}/site-web/utilisateurs/roles`, { name, description: "t", perm: perms });
  assert.ok([200, 302].includes(r.status), r.text.slice(0, 200));
  return member(one("SELECT key FROM mk_roles WHERE name = ?", name).key);
}

before(async () => {
  srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
  boss = await loginInstructor(srv); db = srv.db(); anon = new Client(srv.base);
  orgId = one("SELECT id FROM mk_organizations").id;
  siteA = lastId((await boss.post(`${M}/site-web/sites`, { name: "Site Alpha" })).location, /sites\/(\d+)/);
  siteB = lastId((await boss.post(`${M}/site-web/sites`, { name: "Site Bravo" })).location, /sites\/(\d+)/);
});
after(() => srv.stop());

describe("scénario complet : page CMS → tunnel → rendu → modification → aucune copie", () => {
  test("construire et publier deux pages CMS, créer le tunnel du site, associer les pages (références)", async () => {
    pageA1 = await livePage(boss, "Atterrissage Alpha", { site: siteA, sections: [{ type: "text", markdown: "Version initiale de l'atterrissage." }, { type: "button", label: "Continuer", url: "/etape-suivante", align: "center" }] });
    pageA2 = await livePage(boss, "Remerciement Alpha", { site: siteA });
    pageB1 = await livePage(boss, "Page Bravo", { site: siteB });
    const r = await boss.post(`${M}/tunnels`, { name: "Tunnel Alpha", description: "", site: siteA });
    assert.equal(r.status, 302);
    funnelA = lastId(r.location, /tunnels\/(\d+)/);
    assert.equal(one("SELECT site_id FROM mk_funnels WHERE id = ?", funnelA).site_id, siteA);
    for (const [type, name, page] of [["landing", "Entrée", pageA1], ["thankyou", "Merci", pageA2]]) assert.equal((await boss.post(`${M}/tunnels/${funnelA}/etapes`, { type, name, source: "existante", page_id: page.id })).status, 302);
    const steps = db.prepare("SELECT id, page_id, type FROM mk_funnel_steps WHERE funnel_id = ? ORDER BY position").all(funnelA);
    assert.deepEqual(steps.map((s) => s.page_id), [pageA1.id, pageA2.id]);
    [step1, step2] = steps.map((s) => s.id);
  });
  test("le visiteur voit la VRAIE page CMS ; modifier la page puis republier est visible aussitôt ; aucune copie n'existe", async () => {
    const pagesBefore = count("SELECT COUNT(*) n FROM mk_landing_pages");
    assert.match((await anon.get(`/p/${pageA1.slug}`)).text, /Version initiale de l(?:'|&#39;)atterrissage/);
    const rev = one("SELECT revision FROM mk_landing_pages WHERE id = ?", pageA1.id).revision;
    await boss.request(`${M}/pages/${pageA1.id}/brouillon`, { method: "PUT", json: { revision: rev, content: { title: "Atterrissage Alpha", description: "", sections: [{ type: "text", markdown: "Version MODIFIÉE dans l'éditeur." }, { type: "button", label: "Continuer", url: "/etape-suivante", align: "center" }] } } });
    assert.match((await anon.get(`/p/${pageA1.slug}`)).text, /Version initiale/, "avant publication : toujours la version en ligne");
    await boss.post(`${M}/pages/${pageA1.id}/publier.json`, {});
    const html = (await anon.get(`/p/${pageA1.slug}`)).text;
    assert.match(html, /Version MODIFIÉE dans l(?:'|&#39;)éditeur/); assert.doesNotMatch(html, /Version initiale/);
    assert.equal(one("SELECT page_id FROM mk_funnel_steps WHERE id = ?", step1).page_id, pageA1.id, "l'étape désigne toujours la même page");
    assert.equal(count("SELECT COUNT(*) n FROM mk_landing_pages"), pagesBefore, "aucune copie de page créée");
    assert.equal(count("SELECT COUNT(*) n FROM mk_landing_pages WHERE name LIKE '%Atterrissage Alpha%'"), 1);
    // le tunnel et la fiche de la page se connaissent
    const tunnel = (await boss.get(`${M}/tunnels/${funnelA}`)).text;
    assert.match(tunnel, /Atterrissage Alpha/); assert.match(tunnel, /Modifier la page dans KOLAKISA CMS/);
    assert.match((await boss.get(`${M}/pages/${pageA1.id}`)).text, /Étape de tunnel[\s\S]*Tunnel Alpha/);
    assert.match((await boss.get(`${M}/pages`)).text, /utilisée dans le tunnel « Tunnel Alpha »/);
  });
  test("étape suivante (bouton) et étape précise : redirections réelles vers la page CMS de l'étape, jamais une adresse inventée", async () => {
    const r = await anon.get(`/p/${pageA1.slug}/clic/0`);
    assert.equal(r.status, 302); assert.equal(r.location, `/p/${pageA2.slug}`);
    // bouton « étape précise » : on change l'adresse du bouton pour /etape/<id>
    const rev = one("SELECT revision FROM mk_landing_pages WHERE id = ?", pageA1.id).revision;
    await boss.request(`${M}/pages/${pageA1.id}/brouillon`, { method: "PUT", json: { revision: rev, content: { title: "Atterrissage Alpha", description: "", sections: [{ type: "button", label: "Aller au remerciement", url: `/etape/${step2}`, align: "center" }, { type: "button", label: "Piège", url: `/etape/99999`, align: "center" }] } } });
    await boss.post(`${M}/pages/${pageA1.id}/publier.json`, {});
    assert.equal((await anon.get(`/p/${pageA1.slug}/clic/0`)).location, `/p/${pageA2.slug}`);
    assert.equal((await anon.get(`/p/${pageA1.slug}/clic/1`)).location, `/p/${pageA1.slug}`, "étape inconnue : retour sur la page, pas d'erreur ni de redirection ouverte");
  });
  test("contexte de l'étape : « merci » non indexé par défaut (balise, plan du site), pied de page masquable — la page hors tunnel reste normale", async () => {
    const html = (await anon.get(`/p/${pageA2.slug}`)).text;
    assert.match(html, /<meta name="robots" content="noindex/);
    assert.match(html, /class="lp-foot"/);
    assert.doesNotMatch((await anon.get("/sitemap.xml")).text, new RegExp(`/p/${pageA2.slug}`), "étape non indexée absente du plan du site");
    assert.equal((await boss.post(`${M}/tunnels/${funnelA}/etapes/${step2}/reglages`, { noindex: "on", hideFooter: "on", goal: "Merci" })).status, 302);
    assert.doesNotMatch((await anon.get(`/p/${pageA2.slug}`)).text, /class="lp-foot"/);
    // décocher noindex : la page redevient indexable ; le réglage n'a jamais touché la page CMS
    assert.equal((await boss.post(`${M}/tunnels/${funnelA}/etapes/${step2}/reglages`, { hideFooter: "on" })).status, 302);
    assert.doesNotMatch((await anon.get(`/p/${pageA2.slug}`)).text, /noindex/);
    assert.equal(one("SELECT indexable FROM mk_landing_pages WHERE id = ?", pageA2.id).indexable, 1);
    assert.match((await anon.get("/sitemap.xml")).text, new RegExp(`/p/${pageA2.slug}`));
    // une page de site hors tunnel garde pied de page et indexation
    const free = await livePage(boss, "Hors tunnel", { site: siteA });
    const h = (await anon.get(`/p/${free.slug}`)).text;
    assert.match(h, /class="lp-foot"/); assert.doesNotMatch(h, /noindex/);
  });
});

describe("suppression protégée", () => {
  test("mettre à la corbeille une page d'un tunnel actif : refusé avec la liste des tunnels ; avec détachement explicite : la page part, l'étape reste sans page", async () => {
    const used = await livePage(boss, "Page à protéger", { site: siteA });
    await boss.post(`${M}/tunnels/${funnelA}/etapes`, { type: "page", name: "Protégée", source: "existante", page_id: used.id });
    await boss.post(`${M}/pages/${used.id}/archiver`, {});
    assert.equal(one("SELECT archived_at FROM mk_landing_pages WHERE id = ?", used.id).archived_at, null, "page non archivée");
    const fiche = (await boss.get(`${M}/pages/${used.id}`)).text;
    assert.match(fiche, /utilisée par 1 tunnel/); assert.match(fiche, /Tunnel Alpha/);
    // action groupée : refus par page, avec le motif
    const bulk = await boss.post(`${M}/pages/actions`, { action: "corbeille", ids: String(used.id) });
    assert.equal(bulk.status, 302);
    assert.equal(one("SELECT archived_at FROM mk_landing_pages WHERE id = ?", used.id).archived_at, null);
    await boss.post(`${M}/pages/${used.id}/archiver`, { detacher: "on" });
    assert.ok(one("SELECT archived_at FROM mk_landing_pages WHERE id = ?", used.id).archived_at, "archivée après détachement explicite");
    const step = one("SELECT page_id FROM mk_funnel_steps WHERE name = 'Protégée'");
    assert.equal(step.page_id, null, "l'étape reste, détachée");
    assert.match((await boss.get(`${M}/tunnels/${funnelA}`)).text, /Aucune page n(?:'|&#39;)est associée/);
  });
  test("remplacer, détacher, créer avec KOLAKISA CMS depuis le tunnel : la page détachée n'est jamais supprimée", async () => {
    const extra = await livePage(boss, "Remplaçante", { site: siteA });
    const sid = one("SELECT id FROM mk_funnel_steps WHERE name = 'Protégée'").id;
    assert.equal((await boss.post(`${M}/tunnels/${funnelA}/etapes/${sid}/remplacer`, { page_id: extra.id })).status, 302);
    assert.equal(one("SELECT page_id FROM mk_funnel_steps WHERE id = ?", sid).page_id, extra.id);
    await boss.post(`${M}/tunnels/${funnelA}/etapes/${sid}/detacher`, {});
    assert.equal(one("SELECT page_id FROM mk_funnel_steps WHERE id = ?", sid).page_id, null);
    assert.ok(one("SELECT 1 FROM mk_landing_pages WHERE id = ?", extra.id), "la page détachée existe toujours");
    const made = await boss.post(`${M}/tunnels/${funnelA}/etapes/${sid}/creer-page`, {});
    assert.equal(made.status, 302); assert.match(made.location, /\/marketing\/pages\/\d+\/editeur$/, "ouvre l'éditeur visuel EXISTANT");
    const newId = one("SELECT page_id FROM mk_funnel_steps WHERE id = ?", sid).page_id;
    assert.equal(one("SELECT site_id FROM mk_landing_pages WHERE id = ?", newId).site_id, siteA);
  });
});

describe("permissions croisées (tunnel ≠ pages)", () => {
  let tunnelOnly, pagesOnly, both;
  before(async () => {
    tunnelOnly = await customMember("Tunnels seulement", ["funnels.read", "funnels.write", "forms.read"]);
    pagesOnly = await customMember("Pages seulement", ["forms.read", "forms.write", "pages.publish"]);
    both = await customMember("Tunnels et pages", ["funnels.read", "funnels.write", "forms.read", "forms.write", "pages.publish"]);
  });
  test("gérer le tunnel sans pouvoir modifier les pages : l'édition est désactivée et refusée côté serveur", async () => {
    const html = (await tunnelOnly.get(`${M}/tunnels/${funnelA}`)).text;
    assert.match(html, /<button[^>]*disabled[^>]*>Modifier la page<\/button>/); assert.match(html, /pas modifier ses pages/);
    const sid = one("SELECT id FROM mk_funnel_steps WHERE name = 'Protégée'").id;
    assert.equal((await tunnelOnly.post(`${M}/tunnels/${funnelA}/etapes/${sid}/creer-page`, {})).status, 403, "créer une page demande forms.write");
    assert.equal((await tunnelOnly.post(`${M}/tunnels/${funnelA}/etapes/${step1}/reglages`, { goal: "ok" })).status, 302, "réglages d'étape : droit tunnel suffisant");
    assert.equal((await tunnelOnly.post(`${M}/tunnels/${funnelA}/publier`, {})).status, 403, "mettre en ligne demande aussi pages.publish");
  });
  test("gérer les pages sans le droit tunnel : tunnels fermés ; les pages restent éditables", async () => {
    assert.equal((await pagesOnly.get(`${M}/tunnels`)).status, 403);
    assert.equal((await pagesOnly.get(`${M}/tunnels/${funnelA}`)).status, 403);
    assert.equal((await pagesOnly.post(`${M}/tunnels/${funnelA}/etapes/${step1}/detacher`, {})).status, 403);
    assert.equal((await pagesOnly.get(`${M}/pages/${pageA2.id}`)).status, 200);
    assert.equal(one("SELECT page_id FROM mk_funnel_steps WHERE id = ?", step1).page_id, pageA1.id, "rien n'a bougé");
  });
  test("les deux droits : tout est possible ; un lecteur voit sans rien modifier", async () => {
    assert.match((await both.get(`${M}/tunnels/${funnelA}`)).text, /Modifier la page dans KOLAKISA CMS/);
    const viewer = await member("viewer");
    assert.equal((await viewer.get(`${M}/tunnels/${funnelA}`)).status, 200);
    for (const p of [`etapes/${step1}/detacher`, `etapes/${step1}/reglages`, "dupliquer", "archiver", "publier"]) assert.equal((await viewer.post(`${M}/tunnels/${funnelA}/${p}`, {})).status, 403, p);
  });
});

describe("isolation des sites (IDOR)", () => {
  let editorA, funnelB, stepB;
  before(async () => {
    editorA = await newStudent(srv);
    db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, 'editor')").run(siteA, idOf(editorA));
    funnelB = lastId((await boss.post(`${M}/tunnels`, { name: "Tunnel Bravo", site: siteB })).location, /tunnels\/(\d+)/);
    await boss.post(`${M}/tunnels/${funnelB}/etapes`, { type: "page", name: "B1", source: "existante", page_id: pageB1.id });
    stepB = one("SELECT id FROM mk_funnel_steps WHERE funnel_id = ?", funnelB).id;
  });
  test("le backend refuse une page d'un autre site même si page_id est injecté dans la requête", async () => {
    const before = count("SELECT COUNT(*) n FROM mk_funnel_steps WHERE funnel_id = ?", funnelA);
    await boss.post(`${M}/tunnels/${funnelA}/etapes`, { type: "page", name: "Intrus", source: "existante", page_id: pageB1.id });
    assert.equal(count("SELECT COUNT(*) n FROM mk_funnel_steps WHERE funnel_id = ?", funnelA), before);
    const sid = one("SELECT id FROM mk_funnel_steps WHERE name = 'Protégée'").id;
    await boss.post(`${M}/tunnels/${funnelA}/etapes/${sid}/remplacer`, { page_id: pageB1.id });
    assert.notEqual(one("SELECT page_id FROM mk_funnel_steps WHERE id = ?", sid).page_id, pageB1.id);
    assert.equal(one("SELECT COUNT(*) n FROM mk_funnel_steps WHERE page_id = ?", pageB1.id).n, 1, "la page Bravo n'est que dans le tunnel Bravo");
  });
  test("l'éditeur du site Alpha ne voit que ses tunnels ; tout ce qui touche le site Bravo répond 403", async () => {
    const list = (await editorA.get(`${M}/tunnels?site=${siteA}`)).text;
    assert.match(list, /Tunnel Alpha/); assert.doesNotMatch(list, /Tunnel Bravo/);
    assert.equal((await editorA.get(`${M}/tunnels?site=${siteB}`)).status, 403);
    for (const path of [`${funnelB}`]) assert.equal((await editorA.get(`${M}/tunnels/${path}`)).status, 403, path);
    for (const path of [`${funnelB}`, `${funnelB}/dupliquer`, `${funnelB}/archiver`, `${funnelB}/publier`, `${funnelB}/etapes`, `${funnelB}/etapes/${stepB}/detacher`, `${funnelB}/etapes/${stepB}/remplacer`, `${funnelB}/etapes/${stepB}/retirer`]) {
      assert.equal((await editorA.post(`${M}/tunnels/${path}`, { page_id: pageA2.id, name: "Piraté" })).status, 403, path);
    }
    assert.ok(one("SELECT 1 FROM mk_funnel_steps WHERE id = ? AND page_id = ?", stepB, pageB1.id), "tunnel Bravo intact");
    assert.equal((await editorA.get(`${M}/tunnels/999999`)).status, 403);
  });
  test("création dans son site seulement ; ajout d'une page de son site accepté, d'un autre site refusé", async () => {
    assert.equal((await editorA.post(`${M}/tunnels`, { name: "Créé par Alpha", site: siteA })).status, 302);
    assert.equal(one("SELECT site_id FROM mk_funnels WHERE name = 'Créé par Alpha'").site_id, siteA);
    for (const body of [{ name: "Vers Bravo", site: siteB }, { name: "Sans site" }]) assert.equal((await editorA.post(`${M}/tunnels`, body)).status, 403);
    assert.equal(count("SELECT COUNT(*) n FROM mk_funnels WHERE name IN ('Vers Bravo', 'Sans site')"), 0);
  });
});

describe("santé, XSS, performance", () => {
  test("la santé du site signale une étape de tunnel sans page (contrôle réel, pas un « OK » par défaut)", async () => {
    const O = `${M}/site-web/outils`;
    const run = async () => {
      assert.equal((await boss.post(`${O}/sante?site=${siteA}`, {})).status, 302);
      const id = one("SELECT MAX(id) id FROM cms_tool_runs WHERE kind = 'health'").id;
      for (let i = 0; i < 300; i++) {
        const p = JSON.parse((await boss.get(`${O}/operations/${id}.json?site=${siteA}`)).text);
        if (["done", "failed", "cancelled"].includes(p.status)) break;
        await new Promise((r) => setTimeout(r, 150));
      }
      const row = one("SELECT report FROM cms_tool_runs WHERE id = ?", id);
      return Object.fromEntries(JSON.parse(row.report).results.map((r) => [r.id, r]));
    };
    const res = await run();
    assert.ok(res.funnel_references, "le contrôle existe");
    // une étape détachée (page absente) dans un tunnel actif du site → avertissement qui nomme le tunnel et l'étape
    assert.equal(res.funnel_references.status, "warning", JSON.stringify(res.funnel_references));
    assert.match(res.funnel_references.detail, /Tunnel Alpha/);
  });
  test("XSS : noms de tunnels, d'étapes et objectifs restent du texte", async () => {
    await boss.post(`${M}/tunnels`, { name: "<img src=x onerror=alert(1)>", description: "<svg onload=alert(2)>", site: siteA });
    const sid = one("SELECT id FROM mk_funnel_steps WHERE funnel_id = ? ORDER BY id LIMIT 1", funnelA).id;
    await boss.post(`${M}/tunnels/${funnelA}/etapes/${sid}`, { name: "<script>alert(3)</script>" });
    await boss.post(`${M}/tunnels/${funnelA}/etapes/${sid}/reglages`, { goal: "<b onmouseover=alert(4)>" });
    for (const url of [`${M}/tunnels`, `${M}/tunnels/${funnelA}`, `${M}/pages`]) assert.doesNotMatch((await boss.get(url)).text, /<img src=x onerror|<svg onload|<script>alert\(3\)|<b onmouseover/, url);
  });
  test("tunnel de 30 étapes : la page du tunnel se charge vite et reste bornée", async () => {
    const f = lastId((await boss.post(`${M}/tunnels`, { name: "Grand tunnel", site: siteA })).location, /tunnels\/(\d+)/);
    db.exec("BEGIN");
    const ins = db.prepare("INSERT INTO mk_funnel_steps (organization_id, funnel_id, position, type, name) VALUES (?, ?, ?, 'custom', ?)");
    for (let i = 1; i <= 30; i++) ins.run(orgId, f, i, `Étape ${i}`);
    db.exec("COMMIT");
    const t = Date.now();
    const r = await boss.get(`${M}/tunnels/${f}`);
    assert.equal(r.status, 200); assert.ok(Date.now() - t < 3000, `${Date.now() - t} ms`);
    assert.equal((r.text.match(/class="mk-flow-step"/g) || []).length, 30);
  });
});
