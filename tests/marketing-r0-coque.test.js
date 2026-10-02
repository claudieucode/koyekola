// Marketing R0 — registre de navigation, coque autonome (sidebar, en-tête), design system et page « Composants ».
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { startServer, Client, loginInstructor, newStudent } = require("./helpers");
const { TEST_KEY } = require("./marketing-helpers");
const { buildNav, SECTIONS, ITEMS } = require("../src/marketing/web/nav");
const { PERMISSIONS, can } = require("../src/marketing/organizations");

const ROOT = path.join(__dirname, "..");
const roleCan = (role) => (permission) => can(role, permission);
const labels = (nav) => nav.sections.flatMap((s) => s.items.map((i) => i.label));

describe("registre de navigation", () => {
  test("intégrité : clés uniques, adresses sous /marketing, permissions connues, chaque « à venir » nomme sa phase", () => {
    const keys = ITEMS.map((i) => i.key);
    assert.equal(new Set(keys).size, keys.length, "clés d'entrée uniques");
    for (const i of ITEMS) {
      assert.match(i.href, /^\/marketing(\/|$)/, i.key);
      if (i.status !== "soon") assert.ok(Object.hasOwn(PERMISSIONS, i.permission), `permission inconnue pour ${i.key}`);
      if (i.status === "soon") assert.match(i.since, /^(M\d|R\d|S\d)$/, `${i.key} doit indiquer la phase prévue`);
      if (i.primary) assert.ok(Object.hasOwn(PERMISSIONS, i.primary.permission), `permission du bouton principal de ${i.key}`);
    }
  });
  test("toute page existante est rattachée au registre (aucune clé « active » orpheline)", () => {
    const used = new Set();
    for (const f of fs.readdirSync(path.join(ROOT, "src", "marketing", "web"))) {
      const src = fs.readFileSync(path.join(ROOT, "src", "marketing", "web", f), "utf8");
      for (const m of src.matchAll(/active: "([a-z]+)"/g)) used.add(m[1]);
    }
    assert.ok(used.size >= 12, `seulement ${used.size} clés trouvées`);
    assert.deepEqual([...used].filter((k) => !ITEMS.some((i) => i.key === k)), []);
  });
  test("les fonctionnalités futures sont prévues au registre mais JAMAIS affichées", () => {
    const future = ITEMS.filter((i) => i.status === "soon").map((i) => i.label);
    for (const wanted of ["Tests A/B", "Domaines"]) assert.ok(future.includes(wanted), wanted);
    const nav = buildNav({ can: () => true, active: "dashboard" });
    for (const l of future) assert.ok(!labels(nav).includes(l), `${l} ne doit pas être visible`);
  });
  test("propriétaire : toutes les pages existantes ; lecteur : seulement ce que son rôle permet", () => {
    const owner = labels(buildNav({ can: roleCan("owner"), active: "dashboard" }));
    for (const l of ["Accueil", "Tous les contacts", "Listes", "Segments", "Étiquettes", "Propriétés", "Formulaires d'inscription", "Importer des contacts", "Toutes les campagnes", "Modèles d'e-mails", "Automatisations", "Réglages d'envoi", "KOYEKOLA", "Conformité"]) assert.ok(owner.includes(l), l);
    const viewer = labels(buildNav({ can: roleCan("viewer"), active: "dashboard" }));
    assert.ok(viewer.includes("Tous les contacts") && viewer.includes("Conformité"));
    assert.ok(!viewer.includes("Réglages d'envoi"), "les réglages d'envoi demandent un administrateur");
    assert.ok(!viewer.includes("Importer des contacts"), "l'import demande un éditeur");
  });
  test("une section sans entrée visible disparaît ; une section à une seule entrée devient un lien direct", () => {
    // Organisation à la Mailchimp : Paramètres regroupe envoi + conformité + apparence ; un lecteur n'y voit que la
    // conformité et son apparence (choix personnel) ; l'onglet SMS ne lui montre pas les réglages SMS (administrateur)
    const viewer = buildNav({ can: roleCan("viewer"), active: "dashboard" });
    const viewerSettings = viewer.sections.find((s) => s.key === "settings");
    assert.deepEqual(viewerSettings.items.map((i) => i.key), ["compliance", "appearance"]);
    assert.deepEqual(viewer.sections.find((s) => s.key === "sms").items.map((i) => i.key), ["smscampaigns", "smsaudience"]);
    assert.equal(viewer.sections.find((s) => s.key === "analytics").flat, true, "une seule entrée visible : lien direct");
    const owner = buildNav({ can: roleCan("owner"), active: "dashboard" });
    assert.equal(owner.sections.find((s) => s.key === "settings").flat, false);
    assert.equal(owner.sections.find((s) => s.key === "automations").flat, true);
    assert.equal(owner.sections.find((s) => s.key === "audience").flat, false);
    assert.deepEqual(owner.sections.map((s) => s.key), ["marketing", "campaigns", "sms", "automations", "audience", "analytics", "integrations", "settings"]);
  });
  test("entrée courante, section ouverte, fil d'Ariane et bouton principal selon la page et le rôle", () => {
    const nav = buildNav({ can: roleCan("editor"), active: "segments" });
    assert.equal(nav.sections.find((s) => s.key === "audience").open, true);
    assert.equal(nav.sections.find((s) => s.key === "campaigns").open, false);
    assert.equal(nav.sections.find((s) => s.key === "audience").items.find((i) => i.key === "segments").current, true);
    assert.deepEqual(nav.breadcrumb, ["Audience", "Segments"]);
    assert.deepEqual(nav.primary, { label: "Nouveau segment", href: "/marketing/segments/nouveau" });
    assert.equal(buildNav({ can: roleCan("viewer"), active: "segments" }).primary, null, "pas de bouton sans le droit");
    assert.deepEqual(buildNav({ can: roleCan("owner"), active: "dashboard" }).breadcrumb, ["Accueil"]);
    assert.equal(buildNav({ can: roleCan("owner"), active: "inconnu" }).breadcrumb, null);
  });
  test("aucun bouton principal ne pointe vers une page inexistante : chaque adresse est une route ou une ancre déjà présente", () => {
    const webSrc = fs.readdirSync(path.join(ROOT, "src", "marketing", "web")).map((f) => fs.readFileSync(path.join(ROOT, "src", "marketing", "web", f), "utf8")).join("\n");
    for (const i of ITEMS.filter((x) => x.primary)) {
      const [pathname] = i.primary.href.replace("/marketing", "").split("#");
      assert.ok(webSrc.includes(`"${pathname || "/"}"`) || webSrc.includes(`"${pathname}"`), `route absente pour ${i.primary.href}`);
    }
  });
});

describe("coque dans le navigateur", () => {
  let srv, boss;
  const run = (query, ...args) => { const db = srv.db(); db.prepare(query).run(...args); db.close(); };
  const member = async (role) => {
    const c = await newStudent(srv);
    run("INSERT INTO mk_org_members (organization_id, user_id, role) VALUES (1, (SELECT id FROM users WHERE email = ?), ?)", c.email, role);
    return c;
  };
  before(async () => { srv = await startServer({ ENCRYPTION_KEY: TEST_KEY }); boss = await loginInstructor(srv); });
  after(() => srv.stop());

  test("structure : coque autonome (ni en-tête ni pied du site), repères d'accessibilité, styles et script du système", async () => {
    const html = (await boss.get("/marketing")).text;
    assert.match(html, /^<!DOCTYPE html>\s*<html lang="fr"/);
    assert.match(html, /<title>[^<]*Marketing[^<]*<\/title>/);
    assert.match(html, /<meta name="robots" content="noindex/);
    assert.match(html, /<a class="skip-link" href="#main">/);
    assert.equal((html.match(/<main[ >]/g) || []).length, 1);
    assert.match(html, /<main id="main"[^>]*tabindex="-1"/);
    assert.equal((html.match(/<aside class="mk-sidebar"/g) || []).length, 1);
    assert.match(html, /<header class="mk-topbar"/);
    assert.match(html, /href="\/css\/marketing\.css/);
    assert.match(html, /<script src="\/js\/mk\/shell\.js/);
    assert.doesNotMatch(html, /class="site-header"|class="site-footer"|<footer/);
  });
  test("sidebar : entrées selon le rôle, entrée courante marquée, section courante ouverte", async () => {
    const html = (await boss.get("/marketing/segments")).text;
    for (const href of ["/marketing", "/marketing/contacts", "/marketing/listes", "/marketing/segments", "/marketing/campagnes", "/marketing/modeles", "/marketing/automatisations", "/marketing/envoi", "/marketing/evenements", "/marketing/conformite", "/marketing/importer"]) {
      assert.ok(html.includes(`href="${href}"`), href);
    }
    assert.equal((html.match(/aria-current="page"/g) || []).length >= 1, true);
    assert.match(html, /<a class="mk-nav-sublink" href="\/marketing\/segments" aria-current="page"/);
    assert.match(html, /class="mk-nav-group is-open" data-mk-group="audience"/);
    const viewer = await member("viewer");
    const v = (await viewer.get("/marketing/contacts")).text;
    assert.doesNotMatch(v, /href="\/marketing\/envoi"|href="\/marketing\/importer"/);
    assert.match(v, /href="\/marketing\/conformite"/);
  });
  test("aucune fonctionnalité à venir n'apparaît dans l'interface", async () => {
    const html = (await boss.get("/marketing")).text;
    for (const word of ["Tests A/B", "Domaines"]) assert.ok(!html.includes(word), word);
  });
  test("repli du menu : bouton avec état, libellés portés par title pour le mode icônes", async () => {
    const html = (await boss.get("/marketing")).text;
    assert.match(html, /data-mk-sidebar-collapse[^>]*aria-pressed="false"/);
    assert.match(html, /data-mk-sidebar-toggle[^>]*aria-controls="mk-sidebar"[^>]*aria-expanded="false"/);
    assert.match(html, /<button type="button" class="mk-nav-head"[^>]*title="Audience"/);
    assert.match(html, /<a class="mk-nav-link" href="\/marketing"[^>]*title="Accueil"/);
  });
  test("en-tête : fil d'Ariane, bouton principal contextuel selon la page et le droit, menu utilisateur avec déconnexion", async () => {
    const contacts = (await boss.get("/marketing/contacts")).text;
    assert.match(contacts, /<nav class="mk-breadcrumb" aria-label="Fil d'Ariane">/);
    assert.match(contacts, /<a class="btn btn-primary btn-sm mk-primary" href="\/marketing\/contacts\/nouveau">[^<]*Ajouter un contact/);
    assert.match((await boss.get("/marketing/campagnes")).text, /class="btn btn-primary btn-sm mk-primary" href="\/marketing\/campagnes\/nouvelle">[^<]*Créer une campagne/);
    assert.doesNotMatch((await boss.get("/marketing/conformite")).text, /mk-primary/, "pas de bouton principal sans action évidente");
    const viewer = await member("viewer");
    assert.doesNotMatch((await viewer.get("/marketing/contacts")).text, /mk-primary/);
    assert.match(contacts, /data-mk-dropdown/);
    assert.match(contacts, /<form action="\/deconnexion" method="post"[^>]*>[\s\S]*?role="menuitem"/);
    assert.match(contacts, /href="\/formateur"/);
    assert.match((await viewer.get("/marketing/contacts")).text, /href="\/mes-cours"/);
  });
  test("message d'action dans la coque, avec le bon rôle ARIA", async () => {
    const res = await boss.post("/marketing/contacts", { email: "coque@ex.fr" });
    const page = await boss.get(res.location);
    assert.match(page.text, /<div class="mk-flash mk-flash-ok" role="status">[\s\S]*Contact créé/);
    const bad = await boss.post("/marketing/contacts", { email: "pas-un-email" });
    assert.match((await boss.get(bad.location)).text, /<div class="mk-flash mk-flash-error" role="alert">/);
  });
  test("titre de page échappé (aucune injection par un nom d'objet)", async () => {
    const res = await boss.post("/marketing/modeles", { name: "</title><script>alert(1)</script>", starter: "blank", kind: "marketing" });
    const html = (await boss.get(res.location)).text;
    assert.doesNotMatch(html, /<script>alert\(1\)/);
    assert.match(html, /<title>&lt;\/title&gt;/);
  });
  test("toutes les pages existantes s'affichent dans la coque (200, une seule coque)", async () => {
    for (const url of ["/marketing", "/marketing/contacts", "/marketing/contacts/nouveau", "/marketing/listes", "/marketing/segments", "/marketing/segments/nouveau", "/marketing/modeles", "/marketing/campagnes", "/marketing/campagnes/nouvelle", "/marketing/envoi", "/marketing/automatisations", "/marketing/evenements", "/marketing/etiquettes", "/marketing/proprietes", "/marketing/importer", "/marketing/conformite"]) {
      const r = await boss.get(url);
      assert.equal(r.status, 200, url);
      assert.equal((r.text.match(/<aside class="mk-sidebar"/g) || []).length, 1, url);
    }
  });
  test("ressources du système servies (CSS, JS) et règles de conception respectées", async () => {
    const css = await boss.get("/css/marketing.css");
    assert.equal(css.status, 200);
    assert.match(css.headers.get("content-type"), /css/);
    assert.match(css.text, /:focus-visible/);
    assert.match(css.text, /prefers-reduced-motion:\s*reduce/);
    assert.doesNotMatch(css.text, /outline:\s*none/);
    const js = await boss.get("/js/mk/shell.js");
    assert.equal(js.status, 200);
    assert.match(js.text, /mkSidebar/);
  });
  test("l'ancienne barre d'onglets horizontale a disparu", async () => {
    assert.doesNotMatch((await boss.get("/marketing")).text, /class="mk-nav"/);
  });

  describe("page « Composants » (référence du design system)", () => {
    test("réservée aux administrateurs", async () => {
      assert.equal((await boss.get("/marketing/composants")).status, 200);
      const ed = await member("editor");
      assert.equal((await ed.get("/marketing/composants")).status, 403);
    });
    test("présente chaque composant du système", async () => {
      const html = (await boss.get("/marketing/composants")).text;
      for (const marker of ["mk-stat", "mk-status", "mk-tabs", "mk-empty", "mk-skeleton", "mk-datatable", "mk-pager", "mk-filterbar", "mk-search", "mk-progress", "mk-stepper", "mk-dialog", "data-mk-confirm", "data-mk-dropdown", "data-tooltip", "mk-flash", "mk-toast"]) {
        assert.ok(html.includes(marker), marker);
      }
      assert.match(html, /<table class="mk-table mk-datatable" data-mk-select/);
      assert.match(html, /<th scope="col" aria-sort="ascending">/);
    });
  });
});
