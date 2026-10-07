// Éditeur de pages, mission V2 : propriétés (grille, ombres, transformations, positions, transitions), animations,
// visibilité par écran, nouveaux éléments (bascule, alerte, compteur, témoignage, offre, fil d'Ariane, réseaux sociaux,
// fenêtre), améliorations (bouton, image, icône, galerie, carrousel, onglets, accordéon, séparateur, tableau, audio,
// menu), ordre des liens comptés, typographie globale (titres 5 et 6).
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY, freshMarketing } = require("./marketing-helpers");
const pages = require("../src/marketing/pages");
const nodes = require("../src/marketing/pages/nodes");
const tokens = require("../src/marketing/pages/tokens");
const { startServer, Client, loginInstructor } = require("./helpers");

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) Chrome/120";
const layout = (children) => ({ id: "sect00000001", type: "layout", children: [{ id: "cont00000001", type: "container", children }] });
const IMG = (n, extra = {}) => ({ src: `https://k.test/${n}.png`, alt: `Image ${n}`, ...extra });

describe("modèle (sans serveur)", () => {
  test("propriétés : modèle de colonnes, lignes, étendue, ombre du texte, ombre personnalisée, inclinaison, positions, transition", () => {
    const { A } = freshMarketing();
    const p = pages.createPage(A, { name: "Styles", kind: "page" });
    const save = (styles, type = "container") => pages.saveDraft(A, p.id, { sections: [layout([{ id: "elem00000001", type, children: [], styles: { desktop: styles } }])] }, { revision: pages.getPage(A, p.id).revision });
    const r = save({ columns: 3, gridTemplate: "2fr 240px auto", gridRows: 2, gridColumnSpan: 2, gridRowSpan: 1, textShadow: "md", shadow: { x: 0, y: 8, blur: 24, spread: -4, color: "#10222f33" }, transform: { skewX: 8, rotate: 3 }, transformOrigin: "top left", position: "absolute", right: "0", bottom: "12px", transitionDuration: 300, flexWrap: "wrap-reverse" }, "grid");
    const css = nodes.pageCss(r.content.sections);
    assert.match(css, /grid-template-columns:repeat\(3, minmax\(0, 1fr\)\);.*grid-template-columns:minmax\(0, 2fr\) 240px auto/, "le modèle de colonnes passe après le nombre de colonnes");
    for (const re of [/grid-template-rows:repeat\(2, auto\)/, /grid-column:span 2/, /grid-row:span 1/, /text-shadow:0 2px 6px/, /box-shadow:0px 8px 24px -4px #10222f33/, /transform:rotate\(3deg\) skewX\(8deg\)/, /transform-origin:top left/, /position:absolute/, /right:0/, /bottom:12px/, /transition:color 300ms ease/, /flex-wrap:wrap-reverse/]) assert.match(css, re);
    for (const bad of [{ gridTemplate: "1fr; color:red" }, { gridTemplate: "repeat(3, 1fr)" }, { position: "inherit" }, { transitionDuration: 9000 }, { textShadow: "x" }]) assert.throws(() => save(bad), /valeur invalide/, JSON.stringify(bad));
    const r2 = save({ shadow: { x: 999, color: "nope" }, transform: { skewX: 80 } });
    assert.equal(r2.content.sections[0].children[0].children[0].styles, undefined, "ombre sans couleur valide et inclinaison hors bornes ignorées");
  });

  test("animations et visibilité par écran : validées, rendues par des classes et variables (aucun style écrit)", () => {
    const { A } = freshMarketing();
    const p = pages.createPage(A, { name: "Anim", kind: "page" });
    const save = (node) => pages.saveDraft(A, p.id, { sections: [layout([node])] }, { revision: pages.getPage(A, p.id).revision });
    const r = save({ id: "head00000001", type: "heading", props: { text: "A", level: 2 }, motion: { entrance: "slide-up", duration: 900, delay: 150, hover: "lift" }, hideOn: ["mobile", "bogus"] });
    const n = r.content.sections[0].children[0].children[0];
    assert.deepEqual(n.motion, { entrance: "slide-up", duration: 900, delay: 150, hover: "lift" });
    assert.deepEqual(n.hideOn, ["mobile"]);
    assert.match(nodes.pageCss(r.content.sections), /\.kw-n-head00000001\{--kw-anim-dur:900ms;--kw-anim-delay:150ms\}/);
    assert.equal(save({ id: "head00000001", type: "heading", props: { text: "A", level: 2 }, motion: { entrance: "explode", hover: "spin" } }).content.sections[0].children[0].children[0].motion, undefined);
    assert.throws(() => save({ id: "head00000001", type: "heading", props: { text: "A", level: 2 }, hideOn: ["desktop", "tablet", "mobile"] }), /au moins un écran|masqué sur tous/);
  });

  test("éléments : validation des nouveaux, améliorations des existants, contenus de départ valides", () => {
    const { A } = freshMarketing();
    const p = pages.createPage(A, { name: "Éléments", kind: "page" });
    const save = (children) => pages.saveDraft(A, p.id, { sections: [layout(children)] }, { revision: pages.getPage(A, p.id).revision });
    const kids = save([
      { id: "tog000000001", type: "toggle", props: { title: "Détails", text: "Le **contenu**.", open: true } },
      { id: "alrt00000001", type: "alert", props: { tone: "warning", title: "Attention", text: "Places limitées.", dismissible: true } },
      { id: "cnt000000001", type: "counter", props: { value: 1250, suffix: " élèves", label: "Élèves inscrits (base KOLAKISA, oct. 2026)", decimals: 0 } },
      { id: "tst000000001", type: "testimonial", props: { text: "Très clair.", name: "Awa D.", role: "Élève", rating: 5, avatar: "https://k.test/a.png" } },
      { id: "prc000000001", type: "pricing", props: { title: "Essentiel", price: "29 €", period: "/ mois", features: ["Accès aux cours", ""], ctaLabel: "Choisir", ctaUrl: "/catalogue", highlight: true, badge: "Le plus choisi" } },
      { id: "brd000000001", type: "breadcrumb", props: { items: [{ label: "Accueil", url: "/" }, { label: "Formations", url: "/catalogue" }, { label: "Cette page", url: "/ignore" }] } },
      { id: "soc000000001", type: "social", props: { items: [{ network: "instagram", url: "https://instagram.com/kolakisa" }, { network: "email", url: "mailto:contact@kolakisa.com" }, { network: "inconnu", url: "https://x" }], size: "40", shape: "square" } },
      { id: "mdl000000001", type: "modal", props: { buttonLabel: "En savoir plus", title: "Programme", text: "Détails.", ctaLabel: "S'inscrire", ctaUrl: "/catalogue" } },
      { id: "btn000000001", type: "button", props: { label: "Go", url: "https://partenaire.example", newTab: true, rel: "sponsored", icon: "arrowRight", iconPos: "after" } },
      { id: "img000000001", type: "image", props: { src: "https://k.test/i.png", alt: "Photo", title: "Infobulle", link: "https://site.example", newTab: true } },
      { id: "icn000000001", type: "icon", props: { name: "star", size: "96", label: "Favori", link: "/catalogue" } },
      { id: "gal000000001", type: "gallery", props: { images: [IMG(1, { caption: "Un" }), IMG(2, { link: "/blog" })], lightbox: true, masonry: true } },
      { id: "car000000001", type: "carousel", props: { images: [IMG(1), IMG(2)], autoplay: true, interval: 7, loop: true, dots: false } },
      { id: "tabs00000001", type: "tabs", props: { items: [{ title: "Un", text: "1", icon: "star" }, { title: "Deux", text: "2", icon: "pas-une-icone" }] } },
      { id: "acc000000001", type: "accordion", props: { icon: "plus", items: [{ q: "A ?", a: "Oui." }] } },
      { id: "div000000001", type: "divider", props: { lineStyle: "dashed", thickness: 3, color: "token:primary" } },
      { id: "tbl000000001", type: "table", props: { rows: [["Offre", "Prix"], ["A", "10"], ["B", "20"], ["Total", "30"]], footer: true, striped: true, align: "center" } },
      { id: "aud000000001", type: "audio", props: { src: "https://k.test/son.mp3", loop: true } },
      { id: "menu00000001", type: "menu", props: { mobileToggle: true, items: [{ label: "Formations", url: "/catalogue", children: [{ label: "Photoshop", url: "/p/photoshop" }, { label: "", url: "/x" }] }] } },
    ]).content.sections[0].children[0].children;
    const by = (id) => kids.find((k) => k.id === id).props;
    assert.equal(by("prc000000001").features.length, 1, "point vide écarté");
    assert.equal(by("brd000000001").items[2].url, undefined, "le dernier niveau est la page actuelle (sans lien)");
    assert.deepEqual(by("soc000000001").items.map((x) => x.network), ["instagram", "email"], "réseau inconnu écarté");
    assert.equal(by("btn000000001").rel, "sponsored");
    assert.equal(by("btn000000001").iconPos, "after");
    assert.equal(by("img000000001").newTab, true);
    assert.equal(by("icn000000001").size, "96");
    assert.deepEqual(by("gal000000001").images[1], { src: "https://k.test/2.png", alt: "Image 2", link: "/blog" });
    assert.equal(by("car000000001").interval, 7);
    assert.equal(by("tabs00000001").items[0].icon, "star");
    assert.equal(by("tabs00000001").items[1].icon, undefined, "icône inconnue ignorée");
    assert.equal(by("tbl000000001").footer, true);
    assert.equal(by("menu00000001").items[0].children.length, 1);
    const css = nodes.pageCss([layout(kids)]);
    assert.match(css, /\.kw-n-div000000001\{border:0;border-top:3px dashed var\(--kw-primary\)\}/);
    assert.match(css, /\.kw-n-soc000000001\{--kw-soc:40px\}/);
    for (const [node, re] of [
      [{ type: "counter", props: { value: "beaucoup", label: "x" } }, /nombre réel/],
      [{ type: "counter", props: { value: 3 } }, /ce que mesure ce nombre/],
      [{ type: "testimonial", props: { text: "x" } }, /témoignage réel/],
      [{ type: "pricing", props: { title: "A" } }, /prix réel/],
      [{ type: "breadcrumb", props: { items: [{ label: "Seul" }] } }, /deux niveaux/],
      [{ type: "social", props: { items: [{ network: "email", url: "contact@x.fr" }] } }, /mailto/],
      [{ type: "modal", props: { buttonLabel: "x" } }, /obligatoires/],
      [{ type: "icon", props: { name: "star", link: "/x" } }, /description/],
      [{ type: "button", props: { label: "x", url: "javascript:alert(1)" } }, /adresse doit commencer/],
    ]) assert.throws(() => save([{ id: "bad000000001", ...node }]), re, node.type);
    for (const t of nodes.editorSpec().types.filter((x) => !x.asks)) save([{ id: "blank0000001", type: t.type, ...JSON.parse(JSON.stringify(t.blank)) }]);
  });

  test("design system : titres 5 et 6 (valeurs par défaut, bornes, variables CSS)", () => {
    const t = tokens.normalizeTokens({ type: { h5: { size: 999, weight: 600 }, h6: { size: 13 } } });
    assert.equal(t.type.h5.size, 17, "taille hors bornes : valeur par défaut");
    assert.equal(t.type.h5.weight, 600);
    assert.equal(t.type.h6.size, 13);
    assert.match(tokens.tokensToCss(t), /--kw-h5-size:17px/);
    assert.match(tokens.tokensToCss(t), /--kw-h6-size:13px/);
  });
});

describe("vrai serveur", () => {
  let srv, boss, db;
  before(async () => { srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" }); boss = await loginInstructor(srv); db = srv.db(); });
  after(() => srv.stop());

  test("page publiée : rendu réel des éléments, liens comptés dans l'ordre (e-mail et ancres exclus), animation absente de l'éditeur", async () => {
    const id = Number((await boss.post("/marketing/pages", { name: "V2" })).location.match(/(\d+)$/)[1]);
    const sections = [layout([
      { id: "menu00000001", type: "menu", props: { mobileToggle: true, items: [{ label: "Formations", url: "/catalogue", children: [{ label: "Photoshop", url: "/p/photoshop" }] }] } },
      { id: "icn000000001", type: "icon", props: { name: "star", size: "32", label: "Favori", link: "/favoris" } },
      { id: "gal000000001", type: "gallery", props: { lightbox: true, images: [IMG(1, { caption: "Légende 1" }), IMG(2, { link: "/galerie-lien" })] } },
      { id: "prc000000001", type: "pricing", props: { title: "Essentiel", price: "29 €", ctaLabel: "Choisir", ctaUrl: "/offre" } },
      { id: "brd000000001", type: "breadcrumb", props: { items: [{ label: "Accueil", url: "/" }, { label: "Ici" }] } },
      { id: "soc000000001", type: "social", props: { items: [{ network: "email", url: "mailto:contact@kolakisa.com" }, { network: "linkedin", url: "https://linkedin.com/company/kolakisa" }] } },
      { id: "mdl000000001", type: "modal", props: { buttonLabel: "Infos", title: "Programme", text: "Détails.", ctaLabel: "S'inscrire", ctaUrl: "/inscription" } },
      { id: "btn000000001", type: "button", props: { label: "Partenaire", url: "https://partenaire.example", newTab: true, rel: "sponsored", icon: "arrowRight", iconPos: "after" }, motion: { entrance: "fade", hover: "grow" }, hideOn: ["mobile"] },
      { id: "cnt000000001", type: "counter", props: { value: 1250, label: "Élèves inscrits", suffix: " +" } },
      { id: "alrt00000001", type: "alert", props: { tone: "error", text: "Attention.", dismissible: true } },
      { id: "tog000000001", type: "toggle", props: { title: "Voir", text: "Caché." } },
      { id: "tst000000001", type: "testimonial", props: { text: "Bien.", name: "Awa D.", rating: 4 } },
      { id: "tbl000000001", type: "table", props: { rows: [["A", "B"], ["1", "2"], ["Total", "3"]], footer: true, striped: true } },
    ])];
    const rev = db.prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(id).revision;
    const put = await boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", json: { revision: rev, content: { sections } } });
    assert.equal(put.status, 200, put.text);
    assert.equal((await boss.postJson(`/marketing/pages/${id}/publier.json`, {})).status, 200);
    const slug = db.prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(id).slug;
    const html = (await new Client(srv.base).get(`/p/${slug}`, { headers: { "User-Agent": UA } })).text;
    // Ordre des liens comptés : menu (lien puis sous-lien), icône, image de galerie liée, offre, fil d'Ariane, réseau (pas l'e-mail), fenêtre, bouton
    const order = ["/catalogue", "/p/photoshop", "/favoris", "/galerie-lien", "/offre", "/", "https://linkedin.com/company/kolakisa", "/inscription", "https://partenaire.example"];
    for (let k = 0; k < order.length; k++) assert.equal((await new Client(srv.base).get(`/p/${slug}/clic/${k}`, { headers: { "User-Agent": UA } })).location, order[k], `lien ${k}`);
    assert.match(html, /href="mailto:contact@kolakisa\.com"/, "e-mail direct, non compté");
    assert.match(html, /class="kw-submenu" id="kw-sub-menu00000001-0"><li><a class="kw-menu-link" href="\/p\/[^"]+\/clic\/1">Photoshop/);
    assert.match(html, /data-kw-menu-toggle/);
    assert.match(html, /<a class="kw-node kw-icon kw-n-icn000000001" href="\/p\/[^"]+\/clic\/2" aria-label="Favori">/);
    assert.match(html, /data-kw-lightbox[^>]*>.*<a href="https:\/\/k\.test\/1\.png" class="kw-lb-open" aria-label="Agrandir : Image 1">.*<figcaption>Légende 1<\/figcaption>/s);
    assert.match(html, /target="_blank" rel="noopener noreferrer sponsored" data-node-id|target="_blank" rel="noopener noreferrer sponsored"/);
    assert.match(html, /<span>Partenaire<\/span><span class="kw-btn-icon" aria-hidden="true">/);
    assert.match(html, /class="kw-node kw-button kw-n-btn000000001 [^"]*lp-hide-mobile kw-hover-grow[^"]*"/);
    assert.match(html, /data-kw-anim="fade"/);
    assert.match(html, /<span class="kw-counter-num" data-kw-count="1250"[^>]*><span class="kw-counter-value">1\u202f250<\/span>&#8239;\+<\/span>/);
    assert.match(html, /class="kw-node kw-alert kw-n-alrt00000001 kw-alert-error" role="alert" data-kw-dismiss>/);
    assert.match(html, /<details class="kw-node kw-toggle kw-n-tog000000001"><summary class="kw-toggle-title">Voir<\/summary>/);
    assert.match(html, /role="img" aria-label="Note : 4 sur 5">★★★★<span class="kw-stars-off">★<\/span>/);
    assert.match(html, /<dialog class="kw-modal kw-modal-md" id="kw-m-mdl000000001" aria-labelledby="kw-m-mdl000000001-t">/);
    assert.match(html, /<ol class="kw-crumbs"><li><a href="\/p\/[^"]+\/clic\/5">Accueil<\/a><\/li><li><span aria-current="page">Ici<\/span><\/li><\/ol>/);
    assert.match(html, /<tfoot><tr><td>Total<\/td><td>3<\/td><\/tr><\/tfoot>/);
    assert.match(html, /<svg class="kw-social-svg" viewBox="0 0 24 24"/);
    assert.doesNotMatch(html, /data-kw-builder/);
    // Canevas de l'éditeur : marqué, pour que les animations et lectures automatiques n'y jouent pas
    const canvas = (await boss.postJson(`/marketing/pages/${id}/rendu`, { content: { sections } })).text;
    assert.match(canvas, /<body class="lp-body" data-kw-builder/);
  });
});
