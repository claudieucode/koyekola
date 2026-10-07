// Rénovation de l'éditeur de pages : propriétés ajoutées (écarts lignes / colonnes, épaisseur par côté, voile, répétition
// et défilement du fond), nouveaux éléments (badge, chronologie, barre de progression, menu, carrousel), accordéon à une
// réponse ouverte, onglets verticaux, ancres dans les liens (non comptées comme clics), nouveaux blocs et modèles,
// comparaison de versions.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY, freshMarketing } = require("./marketing-helpers");
const pages = require("../src/marketing/pages");
const nodes = require("../src/marketing/pages/nodes");
const { compareContents } = require("../src/marketing/pages/compare");
const { startServer, Client, loginInstructor } = require("./helpers");

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) Chrome/120";
const layout = (children) => ({ id: "sect00000001", type: "layout", children: [{ id: "cont00000001", type: "container", children }] });
const IMG = (n) => ({ src: `https://k.test/${n}.png`, alt: `Image ${n}` });

describe("modèle (sans serveur)", () => {
  test("propriétés : écarts séparés, épaisseur par côté (après l'épaisseur générale), voile au-dessus de l'image, répétition, fond fixe", () => {
    const { A } = freshMarketing();
    const p = pages.createPage(A, { name: "Styles", kind: "page" });
    const r = pages.saveDraft(A, p.id, { sections: [layout([])].map((s) => { s.children[0].styles = { desktop: { borderBottomWidth: "3px", borderWidth: "0", borderStyle: "solid", rowGap: "8px", columnGap: "24px", overlay: { color: "#00000080" }, backgroundImage: { src: "https://k.test/fond.png" }, backgroundRepeat: "no-repeat", backgroundAttachment: "fixed" } }; return s; }) }, { revision: p.revision });
    const css = nodes.pageCss(r.content.sections);
    assert.match(css, /row-gap:8px/);
    assert.match(css, /column-gap:24px/);
    assert.match(css, /border-width:0;.*border-bottom-width:3px/);
    assert.match(css, /background-repeat:no-repeat/);
    assert.match(css, /background-attachment:fixed/);
    assert.match(css, /background-image:linear-gradient\(#00000080, #00000080\), url\("https:\/\/k\.test\/fond\.png"\)/);
    const bad = (styles) => assert.throws(() => pages.saveDraft(A, p.id, { sections: [{ ...layout([]), children: [{ id: "cont00000001", type: "container", children: [], styles: { desktop: styles } }] }] }, { revision: pages.getPage(A, p.id).revision }));
    bad({ backgroundRepeat: "space" });
    bad({ borderLeftWidth: "-1px" });
  });

  test("nouveaux éléments : valeurs validées, contenus de départ valides", () => {
    const { A } = freshMarketing();
    const p = pages.createPage(A, { name: "Éléments", kind: "page" });
    const save = (children) => pages.saveDraft(A, p.id, { sections: [layout(children)] }, { revision: pages.getPage(A, p.id).revision });
    const r = save([
      { id: "badg00000001", type: "badge", props: { text: "Nouveau", tone: "success" } },
      { id: "tl0000000001", type: "timeline", props: { items: [{ date: "Lundi", title: "Inscription", text: "On commence." }, { title: "" }] } },
      { id: "prog00000001", type: "progress", props: { label: "Places réservées", value: 70 } },
      { id: "menu00000001", type: "menu", props: { items: [{ label: "Tarifs", url: "#tarifs" }, { label: "Blog", url: "/blog" }] } },
      { id: "car000000001", type: "carousel", props: { images: [IMG(1), IMG(2)] } },
      { id: "acc000000001", type: "accordion", props: { single: true, items: [{ q: "A ?", a: "Oui." }] } },
      { id: "tabs00000001", type: "tabs", props: { vertical: true, items: [{ title: "Un", text: "1" }, { title: "Deux", text: "2" }] } },
    ]);
    const kids = r.content.sections[0].children[0].children;
    assert.equal(kids[0].props.tone, "success");
    assert.equal(kids[1].props.items.length, 1, "étape sans titre écartée");
    assert.equal(kids[2].props.showValue, true);
    assert.equal(kids[3].props.items[0].url, "#tarifs");
    assert.equal(kids[3].props.label, "Menu");
    assert.equal(kids[5].props.single, true);
    assert.equal(kids[6].props.vertical, true);
    assert.match(nodes.pageCss(r.content.sections), /\.kw-n-prog00000001 \.kw-progress-bar\{width:70%\}/);
    assert.throws(() => save([{ id: "prog00000001", type: "progress", props: { label: "X", value: 140 } }]), /entre 0 et 100/);
    assert.throws(() => save([{ id: "car000000001", type: "carousel", props: { images: [IMG(1)] } }]), /au moins deux images/);
    assert.throws(() => save([{ id: "car000000001", type: "carousel", props: { images: [IMG(1), { src: "https://k.test/2.png", alt: "" }] } }]), /texte de remplacement manquant/);
    assert.throws(() => save([{ id: "menu00000001", type: "menu", props: { items: [{ label: "X", url: "javascript:alert(1)" }] } }]), /adresse doit commencer/);
    assert.throws(() => save([{ id: "menu00000001", type: "menu", props: { items: [{ label: "X", url: "#1x" }] } }]), /adresse doit commencer/);
    for (const t of nodes.editorSpec().types.filter((x) => !x.asks)) save([{ id: "blank0000001", type: t.type, ...JSON.parse(JSON.stringify(t.blank)) }]);
  });

  test("blocs et modèles : tous valides, sans chiffre inventé", () => {
    const { A } = freshMarketing();
    const patterns = require("../src/marketing/pages/patterns").catalog(A);
    for (const k of ["iconbox", "team", "steps"]) assert.ok(patterns.some((b) => b.key === k), k);
    for (const k of ["apropos", "contact", "portfolio", "saas", "entreprise"]) {
      const p = pages.createPage(A, { name: `Modèle ${k}`, template: k });
      assert.ok(p.working.sections.length >= 3, k);
      assert.doesNotMatch(JSON.stringify(p.working.sections), /\b\d{2,}\s?%|\b\d{3,} (élèves|clients|inscrits)/, k);
    }
  });

  test("comparaison : ajouté, retiré, contenu, style, masqué, déplacé (rang parmi les éléments communs)", () => {
    const a = { title: "A", sections: [layout([{ id: "head00000001", type: "heading", props: { text: "Bonjour", level: "2" } }, { id: "text00000001", type: "text", props: { html: "<p>x</p>" } }, { id: "head00000002", type: "heading", props: { text: "Fin", level: "2" } }])] };
    const b = { title: "B", sections: [layout([{ id: "butn00000001", type: "button", props: { label: "Go", url: "/" } }, { id: "head00000001", type: "heading", props: { text: "Salut", level: "2" }, styles: { desktop: { color: "#000000" } }, hidden: true }, { id: "head00000002", type: "heading", props: { text: "Fin", level: "2" } }])] };
    const d = compareContents(a, b);
    assert.deepEqual(d.page, ["Titre de la page"]);
    assert.deepEqual(d.added.map((x) => x.id), ["butn00000001"]);
    assert.deepEqual(d.removed.map((x) => x.id), ["text00000001"]);
    assert.deepEqual(d.modified, [{ id: "head00000001", label: "Titre · Salut", what: ["contenu", "style", "masqué"] }]);
    assert.equal(compareContents(a, a).total, 0);
  });
});

describe("vrai serveur", () => {
  let srv, boss, db;
  before(async () => { srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" }); boss = await loginInstructor(srv); db = srv.db(); });
  after(() => srv.stop());

  test("page publiée : nouveaux éléments rendus, ancres non comptées, liens du menu comptés dans l'ordre ; comparaison de version", async () => {
    const id = Number((await boss.post("/marketing/pages", { name: "Pro" })).location.match(/(\d+)$/)[1]);
    const sections = [layout([
      { id: "menu00000001", type: "menu", props: { label: "Menu principal", items: [{ label: "Tarifs", url: "#tarifs" }, { label: "Blog", url: "/blog" }] } },
      { id: "badg00000001", type: "badge", props: { text: "Nouveau", tone: "primary" } },
      { id: "prog00000001", type: "progress", props: { label: "Places réservées", value: 70 } },
      { id: "tl0000000001", type: "timeline", props: { items: [{ date: "Lundi", title: "Inscription", text: "" }] } },
      { id: "car000000001", type: "carousel", props: { images: [IMG(1), IMG(2)] } },
      { id: "acc000000001", type: "accordion", props: { single: true, items: [{ q: "A ?", a: "Oui." }] } },
      { id: "head00000001", type: "heading", anchor: "tarifs", props: { text: "Tarifs", level: "2" } },
      { id: "butn00000001", type: "button", props: { label: "Catalogue", url: "/catalogue" } },
    ])];
    const rev = db.prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(id).revision;
    const put = await boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", json: { revision: rev, content: { sections } } });
    assert.equal(put.status, 200, put.text);
    assert.equal((await boss.postJson(`/marketing/pages/${id}/publier.json`, {})).status, 200);
    const slug = db.prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(id).slug;
    const html = (await new Client(srv.base).get(`/p/${slug}`, { headers: { "User-Agent": UA } })).text;
    assert.match(html, /<nav class="kw-node kw-menu kw-n-menu00000001" aria-label="Menu principal"><ul class="kw-menu-list" id="kw-menu-menu00000001"><li class="kw-menu-item"><a class="kw-menu-link" href="#tarifs">Tarifs<\/a><\/li><li class="kw-menu-item"><a class="kw-menu-link" href="\/p\/[^"]+\/clic\/0">Blog/);
    assert.match(html, /href="\/p\/[^"]+\/clic\/1"[^>]*>Catalogue/, "le bouton suit le menu dans l'ordre des liens comptés");
    assert.match(html, /<h2 class="kw-node kw-heading kw-n-head00000001" id="tarifs">Tarifs<\/h2>/);
    assert.match(html, /class="kw-node kw-badge kw-n-badg00000001 kw-badge-primary">Nouveau/);
    assert.match(html, /role="progressbar" aria-label="Places réservées" aria-valuemin="0" aria-valuemax="100" aria-valuenow="70"/);
    assert.match(html, /\.kw-n-prog00000001 \.kw-progress-bar\{width:70%\}/);
    assert.match(html, /<ol class="kw-node kw-timeline[^"]*"><li class="kw-tl-item"><span class="kw-tl-date">Lundi<\/span>/);
    assert.match(html, /aria-roledescription="carrousel"[^>]*data-kw-carousel/);
    assert.match(html, /<details class="lp-faq-item" name="kw-acc-acc000000001">/);
    assert.doesNotMatch(html, /style="width/);
    const go = (await new Client(srv.base).get(`/p/${slug}/clic/0`, { headers: { "User-Agent": UA } })).location;
    assert.equal(go, "/blog");
    // Comparaison : version 1 ↔ brouillon modifié
    const rev2 = db.prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(id).revision;
    const changed = JSON.parse(JSON.stringify(sections));
    changed[0].children[0].children = changed[0].children[0].children.filter((n) => n.type !== "badge");
    changed[0].children[0].children[5].props.text = "Nos tarifs";
    assert.equal((await boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", json: { revision: rev2, content: { sections: changed } } })).status, 200);
    const cmp = (await boss.get(`/marketing/pages/${id}/versions/1/comparer`)).text;
    assert.match(cmp, /Retirés depuis la version 1/);
    assert.match(cmp, /Badge · Nouveau/);
    assert.match(cmp, /Titre · Nos tarifs<\/strong> : contenu/);
    assert.match((await boss.get(`/marketing/pages/${id}`)).text, /versions\/1\/comparer/);
    assert.equal((await boss.get(`/marketing/pages/${id}/versions/99/comparer`)).status, 404);
  });
});
