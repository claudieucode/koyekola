// Éditeur de pages, mission V3 : HTML sécurisé, contenus intégrés (services connus), CSS / classes / attributs vérifiés,
// CSS de page confiné, interactions, programmation, vidéo de fond, filtres, contenu dynamique (articles, formations,
// recherche, compte, texte personnalisé), liste d'icônes, infobulle, image à points, panneau latéral, en-tête et pied
// de page du site, modèles de pages de l'équipe, export / import, mise hors ligne.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY, freshMarketing } = require("./marketing-helpers");
const pages = require("../src/marketing/pages");
const nodes = require("../src/marketing/pages/nodes");
const { startServer, Client, loginInstructor, newStudent, createCourse } = require("./helpers");

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) Chrome/120";
const layout = (children, id = "sect00000001") => ({ id, type: "layout", children: [{ id: `cont${id.slice(4)}`, type: "container", children }] });

describe("sécurité et validation (sans serveur)", () => {
  test("HTML : scripts, événements, styles, cadres, formulaires et liens dangereux retirés ; SVG sûr gardé", () => {
    const out = nodes.sanitizeHtmlBlock(`<p onclick="x()">A<script>alert(1)</script></p><img src=x onerror=alert(1)><a href="javascript:alert(1)">l</a><iframe src="https://evil"></iframe><style>*{}</style><form><input></form><div style="background:url(https://evil)" class="ok">v</div><svg viewBox="0 0 10 10" onload="x()"><circle cx="5" cy="5" r="4"/><foreignObject><b>x</b></foreignObject></svg>`);
    for (const bad of ["script", "onerror", "onclick", "onload", "javascript:", "iframe", "<style", "<form", "<input", "style=", "foreignObject"]) assert.ok(!out.includes(bad), bad);
    assert.match(out, /<div class="ok">v<\/div>/);
    assert.match(out, /<svg viewBox="0 0 10 10"><circle cx="5" cy="5" r="4"/);
  });

  test("CSS d'élément et de page : aucune ressource externe ni échappement ; sélecteurs confinés à la page", () => {
    assert.equal(nodes.cssDeclarations("color: red; letter-spacing: 1px", "x"), "color:red;letter-spacing:1px");
    for (const bad of ["background:url(https://evil)", "color:red}body{x:y", "@import x", "content:'\\41'", "x: image-set(a)", "behavior: url(x)"]) assert.throws(() => nodes.cssDeclarations(bad, "x"), undefined, bad);
    assert.equal(nodes.normalizePageCss(".carte h2 { color: #0b2a40 } .btn:hover{opacity:.8}"), ".lp-main .carte h2{color:#0b2a40}\n.lp-main .btn:hover{opacity:.8}");
    for (const bad of ["body { color: red }", "a{background:url(x)}", "@media (max-width:1px){a{b:c}}", "a{b:c} </style><script>"]) assert.throws(() => nodes.normalizePageCss(bad), undefined, bad);
  });

  test("élément : classes, attributs, interactions, programmation, vidéo de fond, filtres validés", () => {
    const { A } = freshMarketing();
    const p = pages.createPage(A, { name: "V3", kind: "page" });
    const save = (node) => pages.saveDraft(A, p.id, { sections: [layout([node, { id: "text00000001", type: "text", props: { html: "<p>Cible des interactions</p>" } }])] }, { revision: pages.getPage(A, p.id).revision }).content.sections[0].children[0].children[0]; // la cible d'une interaction doit exister dans la page (sinon elle est écartée)
    const n = save({ id: "head00000001", type: "heading", props: { text: "A", level: 2 }, css: "letter-spacing: 2px", cssHover: "opacity: .8", classes: "carte  carte mise-en-avant", attrs: [{ name: "data-suivi", value: "hero" }, { name: "aria-describedby", value: "x" }], interactions: [{ trigger: "click", action: "toggle", target: "text00000001" }, { trigger: "nope", action: "toggle", target: "x" }], startHidden: true, schedule: { from: "2026-01-01T09:00:00Z", until: "2030-01-01T00:00:00Z" }, styles: { desktop: { filter: { blur: 2, brightness: 100, grayscale: 50 }, backdropBlur: 6, display: "inline-flex" } } });
    assert.equal(n.classes, "carte mise-en-avant");
    assert.deepEqual(n.attrs, [{ name: "data-suivi", value: "hero" }, { name: "aria-describedby", value: "x" }]);
    assert.deepEqual(n.interactions, [{ trigger: "click", action: "toggle", target: "text00000001" }]);
    assert.equal(n.startHidden, true);
    assert.deepEqual(n.schedule, { from: "2026-01-01T09:00:00.000Z", until: "2030-01-01T00:00:00.000Z" });
    assert.deepEqual(n.styles.desktop.filter, { blur: 2, grayscale: 50 }, "valeurs neutres retirées");
    const css = nodes.pageCss([layout([n])]);
    assert.match(css, /filter:blur\(2px\) grayscale\(50%\)/);
    assert.match(css, /backdrop-filter:blur\(6px\)/);
    assert.match(css, /display:inline-flex/);
    assert.match(css, /\.kw-node\.kw-n-head00000001\{letter-spacing:2px\}\n\.kw-node\.kw-n-head00000001:hover\{opacity:\.8\}$/, "CSS personnalisé en dernier");
    for (const [bad, re] of [
      [{ classes: "kw-node" }, /réservés/], [{ classes: "a b c d e f g h i" }, /8 au plus/], [{ attrs: [{ name: "onclick", value: "x" }] }, /non autorisé/], [{ attrs: [{ name: "style", value: "x" }] }, /non autorisé/],
      [{ css: "background: url(x)" }, /pas autorisé/], [{ schedule: { from: "2030-01-01", until: "2026-01-01" } }, /doit suivre/],
    ]) assert.throws(() => save({ id: "head00000001", type: "heading", props: { text: "A", level: 2 }, ...bad }), re, JSON.stringify(bad));
    assert.throws(() => save({ id: "cont00000099", type: "container", children: [], bgVideo: { src: "https://evil.example/x.php" } }), /vidéo de fond/);
    assert.equal(save({ id: "cont00000099", type: "container", children: [], bgVideo: { src: "https://cdn.example/fond.mp4" } }).bgVideo.src, "https://cdn.example/fond.mp4");
    assert.equal(nodes.scheduleMatches({ from: "2999-01-01T00:00:00Z" }), false);
    assert.equal(nodes.scheduleMatches({ until: "2000-01-01T00:00:00Z" }), false);
    assert.equal(nodes.scheduleMatches({ from: "2000-01-01T00:00:00Z" }), true);
  });

  test("contenu intégré : services connus seulement, adresse jamais reprise telle quelle ; nouveaux éléments valides", () => {
    assert.equal(nodes.embedOf("https://www.youtube.com/watch?v=dQw4w9WgXcQ").src, "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ");
    assert.equal(nodes.embedOf("https://calendly.com/kolakisa/30min").src, "https://calendly.com/kolakisa/30min?embed_type=Inline");
    assert.equal(nodes.embedOf("https://evil.example/x"), null);
    assert.equal(nodes.embedOf("javascript:alert(1)"), null);
    const { A } = freshMarketing();
    const p = pages.createPage(A, { name: "V3b", kind: "page" });
    const save = (node) => pages.saveDraft(A, p.id, { sections: [layout([node])] }, { revision: pages.getPage(A, p.id).revision });
    assert.throws(() => save({ id: "emb000000001", type: "embed", props: { url: "https://evil.example", title: "x" } }), /service accepté/);
    assert.throws(() => save({ id: "htm000000001", type: "html", props: { html: "<script>x</script>" } }), /contenu vide/);
    assert.throws(() => save({ id: "dyn000000001", type: "dyntext", props: { source: "password" } }), /source inconnue/);
    assert.throws(() => save({ id: "hot000000001", type: "hotspot", props: { src: "https://k.test/a.png" } }), /texte de remplacement/);
    for (const t of nodes.editorSpec().types.filter((x) => !x.asks)) save({ id: "blank0000001", type: t.type, ...JSON.parse(JSON.stringify(t.blank)) });
  });
});

describe("vrai serveur", () => {
  let srv, boss, db;
  before(async () => { srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "", PAIEMENT_SIMULE: "1" }); boss = await loginInstructor(srv); db = srv.db(); });
  after(() => srv.stop());
  const put = async (id, content) => {
    const rev = db.prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(id).revision;
    return boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", json: { revision: rev, content } });
  };
  const newPage = async (name, extra = {}) => Number((await boss.post("/marketing/pages", { name, ...extra })).location.match(/(\d+)$/)[1]);
  const slugOf = (id) => db.prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(id).slug;

  test("page publiée : contenu dynamique réel, sécurité du rendu, interactions, programmation, CSS de page", async () => {
    const course = await createCourse(boss, srv, { title: "Retouche photo", price: 39 });
    db.prepare("INSERT INTO posts (slug, title, excerpt, published, published_at, status) VALUES ('premier-article', 'Premier article', 'Résumé.', 1, datetime('now', '-1 hour'), 'published')").run();
    const id = await newPage("Dynamique");
    const sections = [layout([
      { id: "pos000000001", type: "posts", props: { count: 3 } },
      { id: "crs000000001", type: "courselist", props: { count: 3 } },
      { id: "srh000000001", type: "search", props: { target: "blog" } },
      { id: "acc000000001", type: "account", props: { showCart: true } },
      { id: "dyn000000001", type: "dyntext", props: { source: "firstName", before: "Bonjour ", after: " !", fallback: "à vous" } },
      { id: "dyn000000002", type: "dyntext", props: { source: "courseCount", before: "", after: " formation(s)" } },
      { id: "htm000000001", type: "html", props: { html: `<p class="note">Sûr<script>alert(1)</script></p>` } },
      { id: "emb000000001", type: "embed", props: { url: "https://calendly.com/kolakisa/30min", title: "Prendre rendez-vous" } },
      { id: "icl000000001", type: "iconlist", props: { items: [{ text: "Accès à vie", icon: "check", link: "/catalogue" }], iconColor: "#0277b6" } },
      { id: "tip000000001", type: "tooltip", props: { text: "SEO", tip: "Référencement naturel" } },
      { id: "hot000000001", type: "hotspot", props: { src: "https://k.test/plan.png", alt: "Plan", spots: [{ x: 20, y: 30, title: "Entrée", text: "Ici." }] } },
      { id: "mdl000000001", type: "modal", props: { buttonLabel: "Menu", title: "Navigation", text: "Liens.", position: "right" } },
      { id: "head00000001", type: "heading", classes: "carte", attrs: [{ name: "data-suivi", value: "titre" }], css: "letter-spacing: 2px", props: { text: "Titre", level: 2 }, interactions: [{ trigger: "click", action: "toggle", target: "text00000001" }] },
      { id: "text00000001", type: "text", startHidden: true, props: { html: "<p>Caché au départ</p>" } },
      { id: "fut000000001", type: "heading", schedule: { from: "2999-01-01T00:00:00Z" }, props: { text: "Bientôt visible", level: 2 } },
      { id: "old000000001", type: "heading", schedule: { until: "2000-01-01T00:00:00Z" }, props: { text: "Offre expirée", level: 2 } },
    ])];
    assert.equal((await put(id, { sections, theme: { css: ".carte { color: #0b2a40 }" } })).status, 200);
    assert.equal((await put(id, { sections, theme: { css: "a { background: url(https://evil) }" } })).status, 422, "CSS de page dangereux refusé");
    assert.equal((await put(id, { sections, theme: { css: ".carte { color: #0b2a40 }" } })).status, 200);
    assert.equal((await boss.postJson(`/marketing/pages/${id}/publier.json`, {})).status, 200);
    const visitor = new Client(srv.base);
    const html = (await visitor.get(`/p/${slugOf(id)}`, { headers: { "User-Agent": UA } })).text;
    assert.match(html, /<style>\.lp-main \.carte\{color:#0b2a40\}<\/style>/);
    assert.match(html, /<h3 class="kw-post-title"><a href="\/p\/[^"]+\/clic\/0">Premier article<\/a><\/h3>/);
    assert.match(html, /<h3 class="kw-post-title">Retouche photo<\/h3>.*39,00 €.*href="\/p\/[^"]+\/clic\/1"/s);
    assert.match(html, /<form class="kw-node kw-search kw-n-srh000000001" role="search" action="\/blog" method="get">/);
    assert.match(html, /class="kw-account-link" href="\/p\/[^"]+\/clic\/2">Se connecter/);
    assert.match(html, /<p class="kw-node kw-dyntext kw-n-dyn000000001">Bonjour à vous !<\/p>/);
    assert.match(html, /<p class="kw-node kw-dyntext kw-n-dyn000000002">1 formation\(s\)<\/p>/);
    assert.match(html, /<div class="kw-node kw-html kw-n-htm000000001"><p class="note">Sûr<\/p><\/div>/);
    assert.match(html, /<iframe src="https:\/\/calendly\.com\/kolakisa\/30min\?embed_type=Inline" title="Prendre rendez-vous"[^>]*sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-presentation"><\/iframe>/);
    assert.match(html, /\.kw-n-hot000000001-s0\{left:20%;top:30%\}/);
    assert.match(html, /\.kw-n-icl000000001 \.kw-iconlist-icon\{color:#0277b6\}/);
    assert.match(html, /class="kw-modal kw-modal-md kw-offcanvas kw-offcanvas-right"/);
    assert.match(html, /class="kw-node kw-heading kw-n-head00000001 carte"[^>]* data-suivi="titre" data-kw-ix="\[\[&quot;click&quot;,&quot;toggle&quot;,&quot;text00000001&quot;\]\]"/);
    assert.match(html, /\.kw-node\.kw-n-head00000001\{letter-spacing:2px\}/);
    assert.match(html, /class="kw-node kw-text kw-n-text00000001 kw-ix-hidden"/);
    assert.doesNotMatch(html, /Bientôt visible|Offre expirée/, "programmation appliquée sur la page publique");
    assert.doesNotMatch(html, /<script>alert/);
    // Visiteur connecté, contact connu avec prénom, une formation dans son panier
    const student = await newStudent(srv);
    db.prepare("UPDATE mk_contacts SET first_name = 'Awa' WHERE email = ?").run(student.email);
    await student.post(`/panier/ajouter/${course.id}`, {});
    const html2 = (await student.get(`/p/${slugOf(id)}`, { headers: { "User-Agent": UA } })).text;
    assert.match(html2, /Bonjour Awa !/);
    assert.match(html2, />Mon compte<\/a>/);
    assert.match(html2, /<span class="kw-cart-count" aria-label="1 formation\(s\)">1<\/span>/);
    assert.equal((await student.get(`/p/${slugOf(id)}/clic/2`, { headers: { "User-Agent": UA } })).location, "/mon-compte", "lien du compte compté et redirigé selon le visiteur");
    // Canevas de l'éditeur : tout est montré, éléments programmés signalés, contenu intégré représenté (pas chargé)
    const canvas = (await boss.postJson(`/marketing/pages/${id}/rendu`, { content: { sections } })).text;
    assert.match(canvas, /data-schedule-label="Programmé dès le/);
    assert.match(canvas, /Bientôt visible/);
    assert.match(canvas, /Contenu intégré · Calendly/);
    assert.doesNotMatch(canvas, /<iframe src="https:\/\/calendly/);
  });

  test("en-tête et pied de page du site : affichés sur les pages du site, non modifiables dans le canevas", async () => {
    const created = await boss.post("/marketing/site-web/sites", { name: "Site test V3" });
    const siteId = Number(created.location.match(/(\d+)$/)[1]);
    const comp = await boss.postJson("/marketing/site-web/composants", { name: "En-tête V3", siteId, section: layout([{ id: "menuhdr00001", type: "menu", props: { items: [{ label: "Accueil", url: "/" }] } }], "secthdr00001") });
    assert.equal(comp.status, 201, comp.text);
    const compId = JSON.parse(comp.text).component.id;
    const foot = JSON.parse((await boss.postJson("/marketing/site-web/composants", { name: "Pied V3", siteId, section: layout([{ id: "textftr00001", type: "text", props: { html: "<p>Pied du site V3</p>" } }], "sectftr00001") })).text).component.id;
    const r = await boss.post(`/marketing/site-web/sites/${siteId}/parties`, { header: String(compId), footer: String(foot) });
    assert.equal(r.status, 302);
    assert.deepEqual([db.prepare("SELECT header_component_id h, footer_component_id f FROM mk_sites WHERE id = ?").get(siteId).h, db.prepare("SELECT footer_component_id f FROM mk_sites WHERE id = ?").get(siteId).f], [compId, foot]);
    const id = await newPage("Page du site V3", { site_id: String(siteId) });
    assert.equal((await put(id, { sections: [layout([{ id: "headpage0001", type: "heading", props: { text: "Contenu de la page", level: 2 } }], "sectpage0001")] })).status, 200);
    assert.equal((await boss.postJson(`/marketing/pages/${id}/publier.json`, {})).status, 200);
    const html = (await new Client(srv.base).get(`/p/${slugOf(id)}`, { headers: { "User-Agent": UA } })).text;
    const iHead = html.indexOf("lp-site-header"), iBody = html.indexOf("Contenu de la page"), iFoot = html.indexOf("Pied du site V3");
    assert.ok(iHead > 0 && iHead < iBody && iBody < iFoot, "en-tête, contenu, pied dans l'ordre");
    const page = db.prepare("SELECT * FROM mk_landing_pages WHERE id = ?").get(id);
    const canvas = (await boss.postJson(`/marketing/pages/${id}/rendu`, { content: { sections: JSON.parse(page.sections) } })).text;
    assert.match(canvas, /data-site-part="En-tête du site"/);
    assert.doesNotMatch(canvas, /data-node-id="menuhdr00001"/, "les éléments de l'en-tête ne sont pas sélectionnables dans cette page");
    // Composant d'un autre site refusé
    const other = Number((await boss.post("/marketing/site-web/sites", { name: "Autre site V3" })).location.match(/(\d+)$/)[1]);
    const r2 = await boss.post(`/marketing/site-web/sites/${other}/parties`, { header: String(compId) });
    assert.match(decodeURIComponent(r2.location || "") + (await boss.get(r2.location || "/")).text, /autre site/);
  });

  test("modèles de l'équipe, export / import, mise hors ligne", async () => {
    const id = await newPage("Source de modèle");
    const sections = [layout([{ id: "head00000001", type: "heading", props: { text: "Mon modèle", level: 1 } }])];
    assert.equal((await put(id, { sections, theme: { css: ".x { color: #0b2a40 }" } })).status, 200);
    const saved = await boss.postJson("/marketing/site-web/modeles", { name: "Lancement maison", category: "Lancements", content: { sections, theme: { css: ".x { color: #0b2a40 }" } } });
    assert.equal(saved.status, 201, saved.text);
    const tplId = JSON.parse(saved.text).template.id;
    const list = JSON.parse((await boss.get("/marketing/site-web/modeles.json")).text).templates;
    assert.deepEqual(list.map((t) => [t.name, t.category, t.sections]), [["Lancement maison", "Lancements", 1]]);
    assert.match((await boss.get("/marketing/pages")).text, /value="mine:\d+"[^>]*><span><strong>Lancement maison/);
    const fromTpl = await newPage("Depuis mon modèle", { template: `mine:${tplId}` });
    const row = db.prepare("SELECT sections, theme FROM mk_landing_pages WHERE id = ?").get(fromTpl);
    assert.match(row.sections, /Mon modèle/);
    assert.match(row.theme, /\.x \{ color: #0b2a40 \}/);
    assert.equal((await boss.postJson("/marketing/site-web/modeles", { name: "Vide", content: { sections: [] } })).status, 422);
    // Export puis import (nouvelle page, contenu revalidé)
    const exp = await boss.get(`/marketing/pages/${id}/exporter`);
    assert.match(exp.headers.get ? exp.headers.get("content-disposition") || "" : String(exp.headers["content-disposition"] || ""), /attachment; filename="page-.+\.kolakisa\.json"/);
    const data = JSON.parse(exp.text);
    assert.equal(data.format, "kolakisa-page@1");
    const imp = await boss.postJson("/marketing/pages/importer.json", { data });
    assert.equal(imp.status, 201, imp.text);
    const impId = JSON.parse(imp.text).page.id;
    assert.notEqual(impId, id);
    assert.match(db.prepare("SELECT draft FROM mk_landing_pages WHERE id = ?").get(impId).draft, /Mon modèle/);
    assert.equal((await boss.postJson("/marketing/pages/importer.json", { data: { format: "autre" } })).status, 422);
    data.content.sections[0].children[0].children[0].props.html = "<script>x</script>";
    data.content.sections[0].children[0].children[0].type = "html";
    assert.equal((await boss.postJson("/marketing/pages/importer.json", { data })).status, 422, "import revalidé comme une saisie (HTML vide après nettoyage)");
    // Suppression du modèle
    const del = await boss.post(`/marketing/site-web/modeles/${tplId}/supprimer`, {});
    assert.equal(del.status, 302);
    assert.equal(db.prepare("SELECT COUNT(*) n FROM mk_page_templates").get().n, 0);
    // Mise hors ligne depuis l'éditeur
    assert.equal((await boss.postJson(`/marketing/pages/${id}/publier.json`, {})).status, 200);
    const off = await boss.postJson(`/marketing/pages/${id}/depublier.json`, {});
    assert.equal(off.status, 200, off.text);
    assert.equal(db.prepare("SELECT status FROM mk_landing_pages WHERE id = ?").get(id).status, "unpublished");
  });
});
