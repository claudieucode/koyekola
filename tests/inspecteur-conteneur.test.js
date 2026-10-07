// Inspecteur d'un conteneur (Général / Style / Interactions) : ce que le serveur garantit pour les réglages ajoutés —
// lien d'un conteneur (validation, règle « pas de lien dans un lien », rendu, suivi des clics) et align-content par écran.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY, freshMarketing } = require("./marketing-helpers");
const pages = require("../src/marketing/pages");
const nodes = require("../src/marketing/pages/nodes");
const landing = require("../src/marketing/landing");
const { startServer, loginInstructor } = require("./helpers");

const section = (children) => ({ id: "sect00000001", type: "layout", children });
const box = (id, props, children = [], extra = {}) => ({ id, type: "container", props, children, ...extra });
const heading = (id, props = {}) => ({ id, type: "heading", props: { text: "Titre", level: "2", ...props } });

describe("lien d'un conteneur (sans serveur)", () => {
  const { A } = freshMarketing();
  const p = pages.createPage(A, { name: "Lien conteneur", kind: "page" });
  const save = (kids) => pages.saveDraft(A, p.id, { sections: [section(kids)] }, { revision: pages.getPage(A, p.id).revision }).content.sections[0].children;

  test("conteneur, grille, pile et groupe acceptent un lien : page du site, ancre ou https:// ; nouvel onglet seulement en https://", () => {
    const out = save([
      box("box000000001", { link: "/catalogue", newTab: true }),
      box("box000000002", { link: "#tarifs" }),
      box("box000000003", { link: "https://exemple.fr/offre", newTab: true, tag: "section" }),
      { id: "grd000000001", type: "grid", props: { link: "/contact" }, children: [] },
      { id: "stk000000001", type: "stack", props: { link: "/contact" }, children: [] },
      { id: "grp000000001", type: "group", props: { link: "/contact" }, children: [] },
    ]);
    assert.deepEqual(out[0].props, { link: "/catalogue" }, "un lien interne ne s'ouvre jamais dans un nouvel onglet");
    assert.deepEqual(out[1].props, { link: "#tarifs" });
    assert.deepEqual(out[2].props, { tag: "section", link: "https://exemple.fr/offre", newTab: true });
    for (const i of [3, 4, 5]) assert.deepEqual(out[i].props, { link: "/contact" });
  });

  test("adresses dangereuses ou invalides refusées, jamais enregistrées", () => {
    for (const bad of ["javascript:alert(1)", "data:text/html,<b>x</b>", "http://non-securise.fr", "//autre-site.fr", "https://", "/page avec espace", "mailto:a@b.fr"]) {
      assert.throws(() => save([box("box000000001", { link: bad })]), /lien du conteneur/, bad);
    }
    assert.deepEqual(save([box("box000000001", { link: "" })])[0].props, {}, "lien vide = pas de lien");
  });

  test("les colonnes ne portent pas de lien (elles gardent leur structure)", () => {
    const out = save([{ id: "col000000001", type: "columns", props: { link: "/x" }, children: [{ id: "col000000002", type: "column", props: { link: "/x" }, children: [] }] }]);
    assert.deepEqual(out[0].props, {});
    assert.deepEqual(out[0].children[0].props, {});
  });

  test("un lien ne peut pas en contenir un autre : bouton, lien, titre cliquable, élément profond, autre conteneur cliquable → refusés", () => {
    assert.doesNotThrow(() => save([box("box000000001", { link: "/x" }, [heading("hed000000001"), { id: "txt000000001", type: "text", props: { html: "<p>Du texte</p>" } }])]));
    assert.doesNotThrow(() => save([box("box000000001", {}, [{ id: "btn000000001", type: "button", props: { label: "Ok", url: "/y" } }])]), "sans lien sur le conteneur, un bouton est permis");
    const refuse = (kids, what) => assert.throws(() => save(kids), new RegExp(`ne peut pas contenir « ${what} »`));
    refuse([box("box000000001", { link: "/x" }, [{ id: "btn000000001", type: "button", props: { label: "Ok", url: "/y" } }])], "Bouton");
    refuse([box("box000000001", { link: "/x" }, [{ id: "lnk000000001", type: "link", props: { label: "Ici", url: "/y" } }])], "Lien");
    refuse([box("box000000001", { link: "/x" }, [heading("hed000000001", { link: "/z" })])], "Titre");
    refuse([box("box000000001", { link: "/x" }, [{ id: "grp000000001", type: "group", props: {}, children: [{ id: "grp000000002", type: "group", props: {}, children: [{ id: "btn000000001", type: "button", props: { label: "Ok", url: "/y" } }] }] }])], "Bouton");
    refuse([box("box000000001", { link: "/x" }, [box("box000000002", { link: "/z" })])], "Conteneur");
  });

  test("le lien appartient au conteneur : le copier-coller (sauvegardes successives) le conserve tel quel", () => {
    const first = save([box("box000000001", { link: "https://exemple.fr/offre", newTab: true }, [heading("hed000000001")])]);
    const again = save(first);
    assert.deepEqual(again[0].props, first[0].props);
  });
});

describe("align-content par écran (sans serveur)", () => {
  const { A } = freshMarketing();
  const p = pages.createPage(A, { name: "Align content", kind: "page" });
  const save = (kids) => pages.saveDraft(A, p.id, { sections: [section(kids)] }, { revision: pages.getPage(A, p.id).revision }).content.sections[0].children;

  test("déclaré dans le registre (libellé, groupe « Mise en page ») et valeurs validées ; une valeur inconnue est refusée", () => {
    const prop = nodes.editorSpec().styleProps.find((x) => x.key === "alignContent");
    assert.ok(prop, "propriété exposée à l'éditeur");
    assert.equal(prop.group, "layout");
    assert.match(prop.label, /Répartition des lignes/);
    assert.ok(prop.options.some(([v]) => v === "space-between"));
    const out = save([box("box000000001", {}, [], { styles: { desktop: { display: "flex", flexWrap: "wrap", alignContent: "space-between" } } })]);
    assert.equal(out[0].styles.desktop.alignContent, "space-between");
    assert.throws(() => save([box("box000000001", {}, [], { styles: { desktop: { alignContent: "diagonale" } } })]), /alignContent/);
  });

  test("valeurs indépendantes par écran : ordinateur, tablette et mobile ne s'écrasent pas", () => {
    const out = save([box("box000000001", {}, [], { styles: { desktop: { alignContent: "center" }, tablet: { alignContent: "flex-start" }, mobile: { alignContent: "stretch" } } })]);
    assert.deepEqual([out[0].styles.desktop.alignContent, out[0].styles.tablet.alignContent, out[0].styles.mobile.alignContent], ["center", "flex-start", "stretch"]);
  });

  test("la feuille de style générée contient align-content, avec la requête média de l'écran", () => {
    const css = nodes.pageCss([section([box("box000000001", {}, [], { styles: { desktop: { alignContent: "center" }, mobile: { alignContent: "flex-start" } } })])]);
    assert.match(css, /\.kw-n-box000000001\{[^}]*align-content:center/);
    assert.match(css, /@media \(max-width: 767px\)\{[^}]*\.kw-n-box000000001\{[^}]*align-content:flex-start/);
  });
});

describe("rendu réel et suivi des clics (vrai serveur)", () => {
  let srv, boss, db;
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db();
  });
  after(() => srv.stop());
  const put = async (id, content) => {
    const rev = db.prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(id).revision;
    return boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", json: { revision: rev, content } });
  };
  const newPage = async (name) => Number((await boss.post("/marketing/pages", { name })).location.match(/(\d+)$/)[1]);
  const publish = async (id) => { assert.equal((await boss.request(`/marketing/pages/${id}/publier.json`, { method: "POST", json: {} })).status, 200); return db.prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(id).slug; };

  test("page publiée : le conteneur est enveloppé d'un vrai lien (nouvel onglet sécurisé en https), et sa mise en page ne change pas", async () => {
    const id = await newPage("Conteneur cliquable");
    const r = await put(id, { sections: [section([
      box("box000000001", { link: "/catalogue", tag: "section" }, [heading("hed000000001", { text: "Carte cliquable" })]),
      box("box000000002", { link: "https://exemple.fr/offre", newTab: true }, [heading("hed000000002", { text: "Carte externe" })]),
      box("box000000003", {}, [heading("hed000000003", { text: "Carte simple" })]),
    ])] });
    assert.equal(r.status, 200, r.text);
    const html = (await boss.get(`/p/${await publish(id)}`)).text;
    assert.match(html, /<a class="kw-box-link" href="[^"]*"><section class="kw-node kw-container kw-n-box000000001"[^>]*>[\s\S]*?Carte cliquable[\s\S]*?<\/section><\/a>/);
    assert.match(html, /<a class="kw-box-link" href="[^"]*" target="_blank" rel="noopener noreferrer"><div class="kw-node kw-container kw-n-box000000002"/);
    assert.doesNotMatch(html, /<a class="kw-box-link"[^>]*><div class="kw-node kw-container kw-n-box000000003"/, "sans lien : aucun enveloppement");
    assert.match(require("node:fs").readFileSync(require("node:path").join(__dirname, "..", "public", "css", "landing.css"), "utf8"), /\.kw-box-link\s*\{\s*display:\s*contents/, "l'enveloppe ne change pas la mise en page");
  });

  test("le clic sur un conteneur cliquable est suivi (comme tous les liens de la page) et mène bien à l'adresse choisie", async () => {
    const id = await newPage("Suivi des clics");
    await put(id, { sections: [section([box("box000000001", { link: "/catalogue" }, [heading("hed000000001")])])] });
    const slug = await publish(id);
    const links = landing.linksOf(landing.getPage({ db, organizationId: 1, userId: null }, id));
    assert.deepEqual(links.map((l) => l.url), ["/catalogue"]);
    assert.match(links[0].label, /^Conteneur : /);
    const html = (await boss.get(`/p/${slug}`)).text;
    const href = html.match(/<a class="kw-box-link" href="([^"]+)"/)[1];
    const go = await boss.get(href.startsWith("http") ? new URL(href).pathname + new URL(href).search : href);
    assert.equal(go.status, 302);
    assert.match(go.location, /\/catalogue$/);
  });

  test("conteneur sans aucun réglage (props absent) : la liste des liens ne plante pas", () => {
    const page = { sections: [{ type: "layout", children: [{ id: "box000000001", type: "container", children: [{ id: "grp000000001", type: "group" }] }] }] };
    assert.deepEqual(landing.linksOf(page), []);
  });

  test("l'éditeur reçoit le nouveau réglage : align-content est dans le registre envoyé au navigateur", async () => {
    const id = await newPage("Registre");
    const boot = JSON.parse((await boss.get(`/marketing/pages/${id}/editeur`)).text.match(/<script type="application\/json" id="pb-boot">([\s\S]*?)<\/script>/)[1]);
    assert.ok(boot.spec.styleProps.some((x) => x.key === "alignContent"));
  });

  test("le lien d'un conteneur survit à l'enregistrement puis au rechargement de l'éditeur (persistance)", async () => {
    const id = await newPage("Persistance");
    await put(id, { sections: [section([box("box000000001", { link: "https://exemple.fr/a", newTab: true, tag: "article" }, [], { anchor: "offre", attrs: [{ name: "data-zone", value: "hero" }] })])] });
    const draft = JSON.parse((await boss.get(`/marketing/pages/${id}/editeur`)).text.match(/<script type="application\/json" id="pb-boot">([\s\S]*?)<\/script>/)[1]).content;
    const node = draft.sections[0].children[0];
    assert.deepEqual(node.props, { tag: "article", link: "https://exemple.fr/a", newTab: true });
    assert.equal(node.anchor, "offre");
    assert.deepEqual(node.attrs, [{ name: "data-zone", value: "hero" }]);
  });
});
