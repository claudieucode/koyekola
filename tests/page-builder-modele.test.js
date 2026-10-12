// Page Builder — lot 1 : modèle d'éléments imbriqués (« Section libre »). Arbre validé (types connus, identifiants
// uniques, profondeur et nombre bornés), styles par écran et par état validés un à un puis transformés en CSS sous la
// classe de l'élément, texte riche assaini, rendu public identique au canevas (éléments masqués exclus), liens comptés.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY, freshMarketing } = require("./marketing-helpers");
const pages = require("../src/marketing/pages");
const nodes = require("../src/marketing/pages/nodes");
const landing = require("../src/marketing/landing");
const { startServer, Client, loginInstructor } = require("./helpers");

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) Chrome/120";
const layout = (children, extra = {}) => ({ id: "sect00000001", type: "layout", children, ...extra });
const tree = () => layout([
  { id: "cont00000001", type: "container", styles: { desktop: { paddingTop: "64px", backgroundColor: "token:surface" }, tablet: { paddingTop: "48px" }, mobile: { paddingTop: "32px" } }, children: [
    { id: "cols00000001", type: "columns", children: [
      { id: "colA00000001".toLowerCase(), type: "column", children: [
        { id: "head00000001", type: "heading", props: { text: "Apprenez Photoshop", level: 1 }, styles: { desktop: { fontSize: "48px", color: "#102a3a" }, mobile: { fontSize: "32px" } } },
        { id: "text00000001", type: "text", props: { html: "<p>Un <strong>vrai</strong> programme.</p>" } },
        { id: "btn000000001", type: "button", props: { label: "Je commence", url: "/catalogue" }, states: { hover: { backgroundColor: "#0b5c8a" }, focus: { boxShadow: "md" } } },
      ] },
      { id: "colb00000001", type: "column", children: [
        { id: "link00000001", type: "link", props: { label: "Programme", url: "https://kolakisa.com/programme" } },
        { id: "hide00000001", type: "button", hidden: true, props: { label: "Caché", url: "/cache" } },
      ] },
    ] },
  ] },
]);

describe("modèle (sans serveur)", () => {
  test("largeurs des colonnes (proportions par écran), ancres uniques, options de lecture des vidéos", () => {
    const { A } = freshMarketing();
    const p = pages.createPage(A, { name: "Structures", kind: "page" });
    const col = (id, styles) => ({ id, type: "column", children: [], ...(styles ? { styles } : {}) });
    const vid = (id, props) => ({ id, type: "video", props: { url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", title: "Démo", ...props } });
    const page = (children) => pages.saveDraft(A, p.id, { sections: [layout(children)] }, { revision: pages.getPage(A, p.id).revision });
    const r = page([
      { id: "cols00000001", type: "columns", children: [col("cola00000001", { desktop: { flexGrow: 1.4 }, tablet: { flexGrow: 1.2 } }), col("colb00000001", { desktop: { flexGrow: 0.6 } })] },
      { id: "head00000001", type: "heading", anchor: "Tarifs", props: { text: "Tarifs", level: 2 } },
      vid("vid000000001", { autoplay: true, loop: true, controls: false, muted: false }),
      vid("vid000000002", { muted: true }),
    ]);
    const css = nodes.pageCss(r.content.sections);
    assert.match(css, /\.kw-n-cola00000001\{flex-grow:1\.4\}/);
    assert.match(css, /@media \(max-width: 1023px\)\{[^}]*\.kw-n-cola00000001\{flex-grow:1\.2\}/);
    const kids = r.content.sections[0].children;
    assert.equal(kids[1].anchor, "tarifs", "ancre en minuscules");
    assert.deepEqual(kids[2].props, { url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", title: "Démo", autoplay: true, muted: true, loop: true, controls: false }, "lecture automatique : toujours sans le son");
    assert.deepEqual(kids[3].props, { url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", title: "Démo", muted: true });
    // flex-grow 0 est valide (la case ne grandit pas) ; au-delà de 20, la valeur est refusée
    assert.throws(() => page([col("cola00000001", { desktop: { flexGrow: 99 } })]), /valeur invalide pour « flexGrow »/);
    // Arrondi par coin : toujours après l'arrondi général dans le CSS (quel que soit l'ordre d'enregistrement)
    const rr = page([{ id: "cont00000001", type: "container", children: [], styles: { desktop: { borderTopLeftRadius: "20px", borderRadius: "8px" } } }]);
    assert.match(nodes.pageCss(rr.content.sections), /\.kw-n-cont00000001\{border-radius:8px;border-top-left-radius:20px\}/);
    assert.throws(() => page([{ id: "cont00000001", type: "container", children: [], styles: { desktop: { borderBottomRightRadius: "-4px" } } }]), /borderBottomRightRadius/);
    assert.throws(() => page([vid("vid000000001", { controls: false })]), /sans commandes de lecture, activez la lecture automatique/);
    assert.throws(() => page([{ id: "head00000001", type: "heading", anchor: "1-tarifs", props: { text: "A", level: 2 } }]), /ancre invalide/);
    assert.throws(() => page([{ id: "head00000001", type: "heading", anchor: "main", props: { text: "A", level: 2 } }]), /réservée/);
    assert.throws(() => page([{ id: "head00000001", type: "heading", anchor: "prix", props: { text: "A", level: 2 } }, { id: "head00000002", type: "heading", anchor: "prix", props: { text: "B", level: 2 } }]), /déjà utilisée/);
  });

  test("arbre imbriqué validé : identifiants gardés, styles par écran et par état, CSS généré", () => {
    const { A } = freshMarketing();
    const p = pages.createPage(A, { name: "Libre", kind: "page" });
    const r = pages.saveDraft(A, p.id, { sections: [tree()] }, { revision: p.revision });
    const s = r.content.sections[0];
    assert.equal(s.type, "layout");
    assert.equal(s.children[0].children[0].children[0].children[0].props.text, "Apprenez Photoshop");
    assert.equal(s.children[0].children[0].children[0].children[0].props.level, "1");
    const css = nodes.pageCss(r.content.sections);
    assert.match(css, /\.kw-n-cont00000001\{padding-top:64px;background-color:var\(--kw-surface, #ffffff\)\}/);
    assert.match(css, /\.kw-n-btn000000001:hover\{background-color:#0b5c8a\}/);
    assert.match(css, /\.kw-n-btn000000001:focus-visible\{box-shadow:0 6px 16px/);
    assert.match(css, /@media \(max-width: 1023px\)\{\.kw-n-cont00000001\{padding-top:48px\}\}/);
    assert.match(css, /@media \(max-width: 767px\)\{\.kw-n-cont00000001\{padding-top:32px\}\.kw-n-head00000001\{font-size:32px\}\}/);
  });

  test("valeurs refusées : injection CSS, couleur ou longueur invalides, image et liens dangereux ; type inconnu", () => {
    const { A } = freshMarketing();
    const p = pages.createPage(A, { name: "Refus", kind: "page" });
    const save = (children) => pages.saveDraft(A, p.id, { sections: [layout(children)] }, { revision: pages.getPage(A, p.id).revision });
    const h = (styles) => [{ type: "heading", props: { text: "T" }, styles: { desktop: styles } }];
    assert.throws(() => save(h({ color: "red;}body{display:none" })), /valeur invalide pour « color »/);
    assert.throws(() => save(h({ width: "100px;position:fixed" })), /valeur invalide pour « width »/);
    assert.throws(() => save(h({ paddingTop: "-4px" })), /valeur invalide pour « paddingTop »/, "pas de marge intérieure négative");
    assert.throws(() => save(h({ fontWeight: "bold" })), /fontWeight/);
    assert.throws(() => save([{ type: "heading", props: { text: "T" }, styles: { desktop: { backgroundImage: { src: "javascript:alert(1)" } } } }]), /image doit venir/);
    assert.throws(() => save([{ type: "button", props: { label: "X", url: "javascript:alert(1)" } }]), /https:\/\//);
    assert.throws(() => save([{ type: "script", props: {} }]), /type d'élément inconnu/);
    assert.throws(() => save([{ type: "image", props: { src: "/uploads/marketing/1/a.png" } }]), /texte de remplacement est obligatoire/);
    assert.ok(save([{ type: "image", props: { src: "/uploads/thumbnails/photo-1.webp", decorative: true } }]), "image de la médiathèque du site, décorative");
    assert.ok(save(h({ marginTop: "-16px", letterSpacing: "-0.02em", color: "transparent" })), "marges négatives et lettrage resserré permis");
  });

  test("bornes : identifiants uniques (éléments et sections), profondeur, nombre d'éléments", () => {
    const { A } = freshMarketing();
    const p = pages.createPage(A, { name: "Bornes", kind: "page" });
    const save = (sections) => pages.saveDraft(A, p.id, { sections }, { revision: pages.getPage(A, p.id).revision });
    assert.throws(() => save([layout([{ id: "same00000001", type: "spacer" }, { id: "same00000001", type: "divider" }])]), /même identifiant/);
    assert.throws(() => save([layout([{ id: "sect00000001", type: "spacer" }])]), /Une section et un élément portent le même identifiant/);
    let deep = { type: "heading", props: { text: "fond" } };
    for (let i = 0; i < 9; i++) deep = { type: "group", children: [deep] };
    assert.throws(() => save([layout([deep])]), /trop de niveaux/);
    const many = Array.from({ length: 401 }, () => ({ type: "spacer" }));
    assert.throws(() => save([layout(many)]), /Trop d'éléments sur la page \(400 au plus\)/);
  });

  test("texte riche : liste blanche (script, gestionnaires, javascript:, styles libres retirés)", () => {
    const html = nodes.sanitizeRich('<p style="text-align:center;position:fixed" onclick="x()">A<script>alert(1)</script> <a href="javascript:alert(1)">mal</a> <a href="/catalogue" target="_blank">bien</a> <a href="https://k.test/x" target="_blank">ext</a><img src=x onerror=y></p><h2>Titre</h2><iframe src="https://x"></iframe>');
    assert.equal(html, '<p style="text-align:center">A <span>mal</span> <a href="/catalogue">bien</a> <a href="https://k.test/x" target="_blank" rel="noopener noreferrer">ext</a></p><h2>Titre</h2>');
  });

  test("liens comptés dans l'ordre d'affichage, éléments masqués exclus du public", () => {
    const { A } = freshMarketing();
    const shown = landing.viewModel(A, { sections: [{ ...tree(), children: nodes.visibleTree(tree().children) }] });
    assert.deepEqual(landing.linksOf(shown).map((l) => l.url), ["/catalogue", "https://kolakisa.com/programme"]);
  });
});

describe("rendu (vrai serveur)", () => {
  let srv, boss, db;
  before(async () => { srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" }); boss = await loginInstructor(srv); db = srv.db(); });
  after(() => srv.stop());

  test("titre ou paragraphe vide (bloc en cours d'écriture) : accepté au brouillon, absent de la page publiée, signalé dans l'éditeur", async () => {
    const id = Number((await boss.post("/marketing/pages", { name: "Blocs vides" })).location.match(/(\d+)$/)[1]);
    const rev = db.prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(id).revision;
    const sections = [layout([{ id: "head00000001", type: "heading", props: { text: "", level: 2 } }, { id: "text00000001", type: "text", props: { html: "<p></p>" } }, { id: "text00000002", type: "text", props: { html: "<p>Écrit</p>" } }])];
    const put = await boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", json: { revision: rev, content: { sections } } });
    assert.equal(put.status, 200, put.text);
    const canvas = (await boss.postJson(`/marketing/pages/${id}/rendu`, { content: { sections } })).text;
    assert.match(canvas, /Titre vide/);
    assert.match(canvas, /Paragraphe vide/);
    assert.equal((await boss.postJson(`/marketing/pages/${id}/publier.json`, {})).status, 200);
    const slug = db.prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(id).slug;
    const html = (await new Client(srv.base).get(`/p/${slug}`, { headers: { "User-Agent": UA } })).text;
    assert.doesNotMatch(html, /kw-n-head00000001|kw-n-text00000001|Titre vide|Paragraphe vide/);
    assert.match(html, /<p>Écrit<\/p>/);
  });

  test("page publiée : éléments imbriqués, CSS de la page, élément masqué absent, bouton imbriqué compté et redirigé", async () => {
    const id = Number((await boss.post("/marketing/pages", { name: "Section libre" })).location.match(/(\d+)$/)[1]);
    const page = db.prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(id);
    const put = await boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", json: { revision: page.revision, content: { sections: [tree()], title: "Libre" } } });
    assert.equal(put.status, 200, put.text);
    const pub = await boss.postJson(`/marketing/pages/${id}/publier.json`, {});
    assert.equal(pub.status, 200, pub.text);
    const slug = db.prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(id).slug;
    const html = (await new Client(srv.base).get(`/p/${slug}`, { headers: { "User-Agent": UA } })).text;
    assert.match(html, /<style>[^<]*\.kw-n-cont00000001\{padding-top:64px/);
    assert.match(html, /<h1 class="kw-node kw-heading kw-n-head00000001">Apprenez Photoshop<\/h1>/);
    assert.match(html, /<div class="kw-node kw-text kw-n-text00000001"><p>Un <strong>vrai<\/strong> programme\.<\/p><\/div>/);
    assert.doesNotMatch(html, /Caché/);
    assert.doesNotMatch(html, /data-node-id/, "les identifiants d'édition n'apparaissent pas au public");
    const clic = html.match(/href="(\/p\/[^"]+\/clic\/0)"[^>]*>Je commence/)[1];
    assert.equal((await new Client(srv.base).get(clic, { headers: { "User-Agent": UA } })).location, "/catalogue");
    // Canevas de l'éditeur : identifiants présents, élément masqué visible en transparence
    const canvas = await boss.postJson(`/marketing/pages/${id}/rendu`, { content: { sections: [tree()] } });
    assert.equal(canvas.status, 200);
    assert.match(canvas.text, /data-node-id="hide00000001"/);
    assert.match(canvas.text, /kw-n-hide00000001 is-hidden/);
  });
});
