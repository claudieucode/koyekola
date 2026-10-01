// Éditeur de texte riche pour les textes d'une formation : stockage HTML assaini, compatibilité Markdown, affichage public, PDF, sécurité XSS.
const { test, before, after, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { startServer, Client, loginInstructor } = require("./helpers");
const rich = require("../src/utils/richText");

let srv, prof;
const anon = () => new Client(srv.base);
const q = (sql, ...a) => {
  const db = srv.db();
  const r = db.prepare(sql).all(...a);
  db.close();
  return r;
};
const byTitle = (title) => q("SELECT * FROM courses WHERE title = ? ORDER BY id DESC", title)[0];

// ---------- Sécurité : batterie d'attaques XSS ----------
const ATTACKS = [
  "<script>alert(1)</script>",
  "<img src=x onerror=alert(1)>",
  "<svg onload=alert(1)>",
  "<svg><script>alert(1)</script></svg>",
  '<a href="javascript:alert(1)">clic</a>',
  '<a href="JaVaScRiPt:alert(1)">clic</a>',
  '<a href="jav&#x09;ascript:alert(1)">clic</a>',
  '<a href="&#106;avascript:alert(1)">clic</a>',
  '<a href="data:text/html,<script>alert(1)</script>">clic</a>',
  '<a href="vbscript:msgbox(1)">clic</a>',
  '<a href="//evil.example/x">clic</a>',
  '<a href="https://ok.example" onclick="alert(1)">clic</a>',
  "<iframe src=https://evil.example></iframe>",
  "<object data=x></object><embed src=x>",
  '<form action="https://evil.example"><input name=p></form>',
  "<button onclick=alert(1)>x</button>",
  '<input type="text" value="x" onfocus=alert(1) autofocus>',
  '<p style="background:url(javascript:alert(1))">x</p>',
  '<p style="position:fixed;top:0;left:0;width:100%;height:100%">x</p>',
  '<span style="color:red;behavior:url(x.htc)">x</span>',
  '<span style="width:expression(alert(1))">x</span>',
  '<style>body{display:none}</style>',
  "<textarea><img src=x onerror=alert(1)></textarea>",
  "<textarea/><img src=x onerror=alert(1)>",
  "<noscript><p title=\"</noscript><img src=x onerror=alert(1)>\"></noscript>",
  "<math><mtext><table><mglyph><style><!--</style><img title=\"--&gt;&lt;img src=1 onerror=alert(1)&gt;\">",
  '<base href="https://evil.example/">',
  '<meta http-equiv="refresh" content="0;url=https://evil.example">',
  '<link rel="stylesheet" href="https://evil.example/x.css">',
  "<p onmouseover=alert(1)>x</p>",
  '<div data-type="taskList" onclick="alert(1)">x</div>',
  '<ul data-type="taskList"><li data-type="taskItem"><label><input type="checkbox" onclick="alert(1)"></label></li></ul>',
  "<<script>script>alert(1)<</script>/script>",
  '<a href="https://ok.example" target="_self" rel="opener">x</a>',
];
const DANGEROUS = /<\s*(script|iframe|object|embed|form|button|style|textarea|svg|math|base|meta|link|noscript|img)\b|\son\w+\s*=|javascript:|vbscript:|data:text|expression\(|behavior:|position:\s*fixed|url\(/i;

describe("assainissement : aucune attaque XSS ne survit", () => {
  for (const attack of ATTACKS) {
    test(`neutralisé : ${attack.slice(0, 60)}`, () => {
      for (const out of [rich.sanitizeRich(attack), rich.sanitizeRich(rich.sanitizeRich(attack)), rich.renderRich(attack), rich.sanitizeInline(attack), rich.normalizeList(attack)]) {
        assert.doesNotMatch(out, DANGEROUS, out);
      }
    });
  }
  test("un lien https garde exactement ses protections : nouvel onglet, noopener, nofollow", () => {
    const out = rich.sanitizeRich('<a href="https://ok.example/page" target="_self" rel="opener" onclick="x()">Lien</a>');
    assert.match(out, /^<a href="https:\/\/ok\.example\/page" target="_blank" rel="noopener noreferrer nofollow">Lien<\/a>$/);
  });
  test("mailto et adresse interne acceptés ; adresse sans protocole (//hôte) refusée", () => {
    assert.match(rich.sanitizeRich('<a href="mailto:a@b.fr">m</a>'), /href="mailto:a@b\.fr"/);
    assert.match(rich.sanitizeRich('<a href="/catalogue">c</a>'), /href="\/catalogue"/);
    assert.doesNotMatch(rich.sanitizeRich('<a href="//evil.example">x</a>'), /href/);
  });
  test("un texte géant est borné", () => {
    const out = rich.sanitizeRich("<p>" + "a".repeat(500000) + "</p>");
    assert.ok(out.length <= 120000);
  });
});

describe("mise en forme conservée par l'assainissement", () => {
  const keep = (html) => assert.equal(rich.sanitizeRich(html), html);
  test("paragraphes, gras, italique, souligné, barré, retour à la ligne", () => {
    keep("<p>Un <strong>gras</strong>, <em>italique</em>, <u>souligné</u>, <s>barré</s><br>ligne</p>");
  });
  test("titres H1 H2 H3, listes, liste numérotée, séparateur, citation", () => {
    keep("<h1>Un</h1><h2>Deux</h2><h3>Trois</h3><ul><li><p>a</p></li></ul><ol><li><p>b</p></li></ol><hr><blockquote><p>q</p></blockquote>");
  });
  test("alignement, retrait, couleur, surlignage, taille et police autorisés", () => {
    keep('<p style="text-align: center">c</p>');
    keep('<h2 style="text-align: justify" data-indent="2">t</h2>');
    keep('<p><span style="color: #0277b6">bleu</span> <mark style="background-color: #fff3a3">jaune</mark></p>');
    keep('<p><span style="font-size: 1.25em">grand</span> <span style="font-family: Georgia, serif">serif</span></p>');
  });
  test("couleurs rgb() acceptées", () => {
    assert.match(rich.sanitizeRich('<span style="color: rgb(2, 119, 182)">x</span>'), /color: rgb\(2, 119, 182\)/);
  });
  test("valeurs de style non prévues supprimées, texte conservé", () => {
    const out = rich.sanitizeRich('<p style="text-align: center; font-size: 500px; margin-left: 9999px"><span style="font-family: Comic Sans MS">x</span></p>');
    assert.match(out, /text-align: center/);
    assert.doesNotMatch(out, /500px|9999px|Comic/);
    assert.match(out, />x</);
  });
  test("retrait invalide ignoré", () => {
    assert.doesNotMatch(rich.sanitizeRich('<p data-indent="99">x</p>'), /data-indent/);
    assert.doesNotMatch(rich.sanitizeRich('<p data-indent="a&quot;onclick=1">x</p>'), /onclick|data-indent/);
  });
  test("liste à cases à cocher conservée (les cases sont non modifiables à l'affichage public)", () => {
    const html = '<ul data-type="taskList"><li data-checked="true" data-type="taskItem"><label><input type="checkbox" checked="checked"><span></span></label><div><p>Fait</p></div></li></ul>';
    assert.match(rich.sanitizeRich(html), /data-type="taskList"[\s\S]*data-checked="true"[\s\S]*<input[^>]*type="checkbox"/);
    assert.match(rich.renderRich(html), /<input[^>]*disabled/);
  });
  test("affichage public : H1 rendu en H2 (le titre de la page est déjà le seul H1)", () => {
    assert.equal(rich.sanitizeRich("<h1>Grand</h1>"), "<h1>Grand</h1>");
    assert.equal(rich.renderRich("<h1>Grand</h1>"), '<h2 class="rt-h1">Grand</h2>');
    assert.doesNotMatch(rich.renderRich("<h1>x</h1><p>y</p>"), /<h1/);
  });
  test("un titre vide est retiré (erreur d'accessibilité), un titre avec texte est conservé", () => {
    assert.equal(rich.sanitizeRich("<h2></h2><p>x</p>"), "<p>x</p>");
    assert.equal(rich.sanitizeRich("<h1> </h1><h2>Ok</h2>"), "<h2>Ok</h2>");
  });
  test("le contenu vide de l'éditeur (<p></p>) devient une chaîne vide", () => {
    assert.equal(rich.sanitizeRich("<p></p>"), "");
    assert.equal(rich.sanitizeRich("  "), "");
    assert.equal(rich.sanitizeRich("<p><br></p>"), "");
  });
  test("le résultat est stable : assainir deux fois donne la même chose", () => {
    const html = '<h2 style="text-align: center">T</h2><p>Un <a href="https://a.fr">lien</a> <strong>fort</strong></p><ul><li><p>x</p></li></ul>';
    const once = rich.sanitizeRich(html);
    assert.equal(rich.sanitizeRich(once), once);
  });
});

describe("champs « liste » : un élément par ligne", () => {
  test("éléments d'une liste à puces", () => {
    const items = rich.listItems("<ul><li><p>Monter <strong>une vidéo</strong></p></li><li><p>Étalonner</p></li></ul>");
    assert.deepEqual(items.map((i) => i.text), ["Monter une vidéo", "Étalonner"]);
    assert.equal(items[0].html, "Monter <strong>une vidéo</strong>");
  });
  test("chaque paragraphe est un élément (un par ligne)", () => {
    assert.deepEqual(rich.listItems("<p>Un</p><p>Deux</p><p></p><p>Trois</p>").map((i) => i.text), ["Un", "Deux", "Trois"]);
  });
  test("listes imbriquées : à plat, dans l'ordre", () => {
    assert.deepEqual(rich.listItems("<ul><li><p>A</p><ul><li><p>A1</p></li></ul></li><li><p>B</p></li></ul>").map((i) => i.text), ["A", "A1", "B"]);
  });
  test("titres et alignements sont ramenés à du texte simple ; 30 éléments au plus", () => {
    const many = "<ul>" + Array.from({ length: 45 }, (_, i) => `<li><p>Élément ${i + 1}</p></li>`).join("") + "</ul>";
    assert.equal(rich.listItems(many).length, 30);
    assert.deepEqual(rich.listItems('<h2 style="text-align:center">Titre</h2>').map((i) => i.html), ["Titre"]);
  });
  test("normalizeList : liste plate stockée, mise en forme en ligne conservée", () => {
    const out = rich.normalizeList('<p>Un <strong>fort</strong></p><ul><li><p><span style="color: #d1121f">Deux</span></p></li></ul><h2>Trois</h2>');
    assert.equal(out, '<ul><li>Un <strong>fort</strong></li><li><span style="color: #d1121f">Deux</span></li><li>Trois</li></ul>');
    assert.equal(rich.normalizeList("<p></p>"), "");
  });
  test("normalizeList est stable et sûr", () => {
    const out = rich.normalizeList("<ul><li><p>a <u>b</u></p></li></ul>");
    assert.equal(rich.normalizeList(out), out);
  });
});

describe("compatibilité avec l'ancien format (Markdown / une ligne par élément)", () => {
  test("Markdown → HTML riche : titres, listes, gras, liens", () => {
    const html = rich.legacyDescriptionToHtml("## Présentation\nUne formation **complète**.\n\n- Montage\n- Étalonnage\n\n### Détail\n[Site](https://ex.fr)");
    assert.match(html, /<h3>Présentation<\/h3>/);
    assert.match(html, /<strong>complète<\/strong>/);
    assert.match(html, /<ul><li><p>Montage<\/p><\/li><li><p>Étalonnage<\/p><\/li><\/ul>|<ul><li>Montage<\/li>/);
    assert.match(html, /<h3>Détail<\/h3>/);
    assert.match(html, /<a href="https:\/\/ex\.fr"/);
    assert.doesNotMatch(html, /\*\*|##/);
  });
  test("Markdown piégé : reste neutralisé", () => {
    // Les balises saisies deviennent du TEXTE inerte (&lt;script&gt;) : seules de vraies balises actives seraient dangereuses
    const out = rich.legacyDescriptionToHtml('<script>alert(1)</script> [x](javascript:alert(1)) <img src=x onerror=1>');
    assert.doesNotMatch(out, /<\s*(script|img|iframe)\b|href=|javascript:\S*"/i);
    assert.match(out, /&lt;script&gt;/);
  });
  test("lignes → liste à puces, caractères spéciaux échappés", () => {
    assert.equal(rich.legacyListToHtml("Un\n\nDeux <b>gras</b> & co\n"), "<ul><li>Un</li><li>Deux &lt;b&gt;gras&lt;/b&gt; &amp; co</li></ul>");
    assert.equal(rich.legacyListToHtml(""), "");
  });
});

describe("blocs pour le PDF et texte brut", () => {
  test("blocs : titres, paragraphes, puces, numéros", () => {
    const blocks = rich.descriptionBlocks("<h2>Titre</h2><p>Un <strong>texte</strong><br>suite</p><ul><li><p>a</p></li><li><p>b</p></li></ul><ol><li><p>c</p></li></ol>");
    assert.deepEqual(blocks.map((b) => [b.type, b.text]), [["heading", "Titre"], ["paragraph", "Un texte suite"], ["bullet", "a"], ["bullet", "b"], ["number", "c"]]);
    assert.equal(blocks[4].n, 1);
  });
  test("texte brut : sans balises, blocs séparés par un espace", () => {
    assert.equal(rich.htmlText("<h2>Titre</h2><p>Un <strong>texte</strong> &amp; plus</p><ul><li><p>a</p></li></ul>"), "Titre Un texte & plus a");
    assert.equal(rich.htmlText("<p>" + "mot ".repeat(100) + "</p>", 20).length <= 20, true);
  });
});

// ---------- Intégration : enregistrement, formulaire, affichage public ----------
const RICH = {
  title: "Formation riche",
  category: "Design", level: "debutant", price: "20", subtitle: "",
  rich_text: "1",
  description: '<h2 style="text-align: center">Ce que vous allez découvrir</h2><p>Une formation <strong>complète</strong> avec un <a href="https://exemple.fr/doc">lien</a>.</p><ul><li><p>Montage vidéo</p></li><li><p>Étalonnage</p></li></ul><p><script>alert("xss")</script><img src=x onerror=alert(1)></p>',
  objectives: "<ul><li><p>Monter une <strong>vidéo</strong> de A à Z</p></li><li><p>Maîtriser l'étalonnage</p></li></ul>",
  prerequisites: "<p>Savoir utiliser un ordinateur</p><p>Avoir installé le logiciel</p>",
  target_audience: "<ul><li><p>Débutants complets</p></li></ul>",
  skills: '<ul><li><p><span style="color: #1e7a34">Montage professionnel</span></p></li><li><p>Gestion du son</p></li></ul>',
};

before(async () => {
  srv = await startServer();
  prof = await loginInstructor(srv);
});
after(() => srv.stop());

describe("base de données", () => {
  test("colonne rich_text ajoutée (0 par défaut) sans toucher aux autres", () => {
    const cols = q("PRAGMA table_info(courses)").map((c) => c.name);
    assert.ok(cols.includes("rich_text"));
    for (const c of ["description", "objectives", "prerequisites", "target_audience", "skills"]) assert.ok(cols.includes(c));
  });
});

describe("enregistrement", () => {
  test("nouvelle formation en texte riche : HTML assaini, indicateur rich_text = 1", async () => {
    const r = await prof.post("/formateur/cours/nouveau", RICH);
    assert.equal(r.status, 302);
    const c = byTitle("Formation riche");
    assert.equal(c.rich_text, 1);
    assert.match(c.description, /<h2 style="text-align: center">Ce que vous allez découvrir<\/h2>/);
    assert.match(c.description, /<strong>complète<\/strong>/);
    assert.match(c.description, /<a href="https:\/\/exemple\.fr\/doc" target="_blank" rel="noopener noreferrer nofollow">lien<\/a>/);
    assert.doesNotMatch(c.description, DANGEROUS);
    assert.equal(c.objectives, "<ul><li>Monter une <strong>vidéo</strong> de A à Z</li><li>Maîtriser l'étalonnage</li></ul>");
    assert.equal(c.prerequisites, "<ul><li>Savoir utiliser un ordinateur</li><li>Avoir installé le logiciel</li></ul>");
    assert.equal(c.target_audience, "<ul><li>Débutants complets</li></ul>");
    assert.equal(c.skills, '<ul><li><span style="color: #1e7a34">Montage professionnel</span></li><li>Gestion du son</li></ul>');
  });
  test("ancien envoi (sans rich_text) : texte conservé tel quel, rich_text = 0 — compatibilité et formulaire sans JavaScript", async () => {
    await prof.post("/formateur/cours/nouveau", { title: "Formation ancienne", category: "Design", level: "debutant", price: "0", description: "## Titre\nTexte **fort**", objectives: "Un\nDeux" });
    const c = byTitle("Formation ancienne");
    assert.equal(c.rich_text, 0);
    assert.equal(c.description, "## Titre\nTexte **fort**");
    assert.equal(c.objectives, "Un\nDeux");
  });
  test("attaques XSS envoyées dans les cinq champs : rien de dangereux n'est enregistré", async () => {
    const evil = ATTACKS.join("");
    await prof.post("/formateur/cours/nouveau", { ...RICH, title: "Formation piégée", description: evil, objectives: evil, prerequisites: evil, target_audience: evil, skills: evil });
    const c = byTitle("Formation piégée");
    for (const f of ["description", "objectives", "prerequisites", "target_audience", "skills"]) assert.doesNotMatch(c[f], DANGEROUS, f);
  });
  test("modification : la mise en forme est conservée, rich_text passe à 1", async () => {
    const legacy = byTitle("Formation ancienne");
    await prof.post(`/formateur/cours/${legacy.id}/modifier`, { title: "Formation ancienne", category: "Design", level: "debutant", price: "0", rich_text: "1", description: "<h2>Nouveau</h2><p>Riche</p>", objectives: "<ul><li><p>Un</p></li></ul>" });
    const c = q("SELECT * FROM courses WHERE id = ?", legacy.id)[0];
    assert.equal(c.rich_text, 1);
    assert.equal(c.description, "<h2>Nouveau</h2><p>Riche</p>");
    assert.equal(c.objectives, "<ul><li>Un</li></ul>");
  });
  test("titre manquant : le formulaire est réaffiché, texte saisi conservé (assaini)", async () => {
    const r = await prof.post("/formateur/cours/nouveau", { ...RICH, title: "", description: "<p>Gardé <strong>ici</strong></p><script>x</script>" });
    assert.equal(r.status, 400);
    assert.match(r.text, /Gardé <strong>ici<\/strong>/);
    assert.doesNotMatch(r.text, /<script>x<\/script>/);
  });
  test("un texte énorme est refusé ou borné, sans plantage", async () => {
    // 400 Ko : refusé dès la réception (limite d'envoi d'Express)
    const huge = await prof.post("/formateur/cours/nouveau", { ...RICH, title: "Formation gigantesque", description: "<p>" + "a".repeat(400000) + "</p>" });
    assert.equal(huge.status, 413);
    assert.equal(byTitle("Formation gigantesque"), undefined);
    // 95 Ko : accepté, et borné à 100 000 caractères par l'assainissement
    const big = await prof.post("/formateur/cours/nouveau", { ...RICH, title: "Formation énorme", description: "<p>" + "a".repeat(95000) + "</p>" });
    assert.equal(big.status, 302);
    assert.ok(byTitle("Formation énorme").description.length <= 120000);
  });
});

describe("formulaire d'édition", () => {
  let html;
  before(async () => {
    html = (await prof.get(`/formateur/cours/${byTitle("Formation riche").id}/modifier`)).text;
  });
  test("chaque champ garde son <textarea> (repli sans JavaScript) et reçoit un éditeur", () => {
    for (const name of ["description", "objectives", "prerequisites", "target_audience", "skills"]) {
      assert.match(html, new RegExp(`<textarea[^>]+name="${name}"`), name);
      assert.match(html, new RegExp(`data-rich-editor="${name}"`), name);
      assert.match(html, new RegExp(`<template[^>]+data-rich-source="${name}"`), name);
    }
  });
  test("les libellés restent associés à leur champ (accessibilité)", () => {
    for (const name of ["description", "objectives", "prerequisites", "target_audience", "skills"]) {
      const id = html.match(new RegExp(`<textarea[^>]+id="([^"]+)"[^>]+name="${name}"|<textarea[^>]+name="${name}"[^>]+id="([^"]+)"`));
      const value = id && (id[1] || id[2]);
      assert.ok(value, name);
      assert.match(html, new RegExp(`<label[^>]+for="${value}"`), name);
    }
  });
  test("placeholders professionnels", () => {
    assert.match(html, /Présentez votre formation, ses objectifs et les résultats que les apprenants pourront obtenir\.\.\./);
    assert.match(html, /Ajoutez un objectif par ligne\.\.\./);
    assert.match(html, /Ajoutez un prérequis par ligne\.\.\./);
    assert.match(html, /Ajoutez un profil par ligne\.\.\./);
    assert.match(html, /Ajoutez une compétence par ligne\.\.\./);
  });
  test("le contenu enregistré est fourni à l'éditeur ; indicateur rich_text présent", () => {
    assert.match(html, /<template[^>]+data-rich-source="description">[\s\S]*<strong>complète<\/strong>/);
    assert.match(html, /<input type="hidden" name="rich_text" value="1">/);
  });
  test("le script de l'éditeur est chargé sur cette page, en différé", () => {
    assert.match(html, /<script src="\/js\/course-editor\.js\?v=[0-9a-f]+" defer><\/script>/);
  });
  test("l'ancienne aide Markdown a disparu du libellé", () => {
    assert.doesNotMatch(html, /\*\*gras\*\*|## titre/);
  });
  test("ancienne formation : le contenu Markdown est converti pour l'éditeur SANS modifier la base", async () => {
    const legacy = await (async () => {
      await prof.post("/formateur/cours/nouveau", { title: "Formation à convertir", category: "Design", level: "debutant", price: "0", description: "## Bienvenue\nTexte **fort**\n\n- un\n- deux", objectives: "Objectif A\nObjectif B" });
      return byTitle("Formation à convertir");
    })();
    const form = (await prof.get(`/formateur/cours/${legacy.id}/modifier`)).text;
    assert.match(form, /<template[^>]+data-rich-source="description">[\s\S]*<h3>Bienvenue<\/h3>[\s\S]*<strong>fort<\/strong>[\s\S]*<ul>/);
    assert.match(form, /<template[^>]+data-rich-source="objectives">\s*<ul><li>Objectif A<\/li><li>Objectif B<\/li><\/ul>/);
    assert.doesNotMatch(form, /<input type="hidden" name="rich_text"/);
    const after = q("SELECT description, objectives, rich_text FROM courses WHERE id = ?", legacy.id)[0];
    assert.equal(after.description, "## Bienvenue\nTexte **fort**\n\n- un\n- deux");
    assert.equal(after.rich_text, 0);
  });
  test("nouvelle formation : formulaire avec éditeurs vides", async () => {
    const form = (await prof.get("/formateur/cours/nouveau")).text;
    for (const name of ["description", "objectives"]) assert.match(form, new RegExp(`data-rich-editor="${name}"`));
    assert.match(form, /course-editor\.js/);
  });
  test("le contenu est échappé dans le formulaire : impossible de sortir du <template> avec </template>", async () => {
    const c = byTitle("Formation riche");
    await prof.post(`/formateur/cours/${c.id}/modifier`, { ...RICH, description: "<p></template><script>alert(1)</script></p>" });
    const form = (await prof.get(`/formateur/cours/${c.id}/modifier`)).text;
    assert.doesNotMatch(form, /<script>alert\(1\)<\/script>/);
    // on remet le contenu de départ pour la suite
    await prof.post(`/formateur/cours/${c.id}/modifier`, RICH);
  });
});

describe("affichage public", () => {
  let html;
  before(async () => {
    const c = byTitle("Formation riche");
    await prof.post(`/formateur/cours/${c.id}/modifier`, RICH);
    // une formation publiée doit avoir du contenu : un chapitre et une leçon
    await prof.post(`/formateur/cours/${c.id}/sections`, { title: "Ch" });
    const s = q("SELECT id FROM sections WHERE course_id = ?", c.id)[0];
    await prof.post(`/formateur/sections/${s.id}/lecons`, { title: "Leçon" });
    await prof.post(`/formateur/cours/${c.id}/publier`, {});
    assert.equal(q("SELECT published FROM courses WHERE id = ?", c.id)[0].published, 1);
    html = (await anon().get(`/cours/${c.slug}`)).text.replace(/\s+/g, " ");
  });
  const section = (title) => html.split(new RegExp(`<h2[^>]*>${title.replace(/[?]/g, "\\?")}</h2>`))[1] || "";
  test("vrais titres, vrai gras, vraie liste, vrai lien cliquable — jamais de balises ou de Markdown affichés", () => {
    const d = section("Description").slice(0, 900);
    assert.match(d, /<h2 style="text-align: center">Ce que vous allez découvrir<\/h2>/);
    assert.match(d, /<strong>complète<\/strong>/);
    assert.match(d, /<ul><li><p>Montage vidéo<\/p><\/li><li><p>Étalonnage<\/p><\/li><\/ul>/);
    assert.match(d, /<a href="https:\/\/exemple\.fr\/doc" target="_blank" rel="noopener noreferrer nofollow">lien<\/a>/);
    assert.doesNotMatch(d, /&lt;|\*\*|##/);
  });
  test("objectifs : un élément par ligne avec la coche, mise en forme conservée", () => {
    const s = section("Ce que vous apprendrez").slice(0, 900);
    assert.match(s, /<li><span class="objective-check">[\s\S]*?<\/span><span>Monter une <strong>vidéo<\/strong> de A à Z<\/span><\/li>/);
    assert.match(s, /Maîtriser l&#39;étalonnage|Maîtriser l'étalonnage/);
  });
  test("prérequis, public visé, compétences : listes propres", () => {
    assert.match(section("Prérequis"), /<ul class="plain-list"><li>Savoir utiliser un ordinateur<\/li><li>Avoir installé le logiciel<\/li><\/ul>/);
    assert.match(section("À qui s'adresse cette formation ?"), /<h3 class="audience-title">Débutants complets<\/h3>/);
    assert.match(section("Compétences acquises"), /<span><span style="color: #1e7a34">Montage professionnel<\/span><\/span><\/li>/);
  });
  test("aucun contenu dangereux dans toute la page", () => {
    assert.doesNotMatch(html.replace(/<script[^>]*src=[^>]*><\/script>|<script type="application\/ld\+json">.*?<\/script>/g, ""), /<script>alert|onerror=|javascript:/i);
  });
  test("défense en profondeur : même du HTML piégé écrit directement en base est neutralisé à l'affichage", async () => {
    const c = byTitle("Formation riche");
    const db = srv.db();
    db.prepare("UPDATE courses SET description = ?, objectives = ?, skills = ? WHERE id = ?").run(
      '<p>ok</p><img src=x onerror=alert(1)><script>alert(2)</script><a href="javascript:alert(3)">x</a>',
      '<ul><li><img src=x onerror=alert(4)>obj</li></ul>', '<script>alert(5)</script><ul><li>comp</li></ul>', c.id
    );
    db.close();
    const page = (await anon().get(`/cours/${c.slug}`)).text.replace(/<script[^>]*src=[^>]*><\/script>|<script type="application\/ld\+json">.*?<\/script>/gs, "");
    assert.doesNotMatch(page, /alert\(\d\)|onerror=|javascript:/);
    assert.match(page, /<p>ok<\/p>/);
    await prof.post(`/formateur/cours/${c.id}/modifier`, RICH);
  });
  test("ancienne formation (Markdown) : affichage inchangé", async () => {
    const c = byTitle("Formation à convertir");
    const page = (await anon().get(`/cours/${c.slug}`)).text.replace(/\s+/g, " ");
    // formation non publiée : visible par son auteur seulement
    const own = (await prof.get(`/cours/${c.slug}`)).text.replace(/\s+/g, " ");
    assert.match(own, /<h3>Bienvenue<\/h3>/);
    assert.match(own, /<strong>fort<\/strong>/);
    assert.match(own, /<li><span class="objective-check">[\s\S]*?<\/span><span>Objectif A<\/span><\/li>/);
    assert.equal(page.includes("Bienvenue"), false);
  });
  test("description pour Google : texte brut tiré du texte riche (sans balises)", async () => {
    const c = byTitle("Formation riche");
    const page = (await prof.get(`/cours/${c.slug}`)).text;
    const desc = page.match(/<meta name="description" content="([^"]*)"/)[1];
    assert.doesNotMatch(desc, /&lt;|<|\*\*/);
    assert.match(desc, /Ce que vous allez découvrir Une formation complète/);
  });
});

describe("persistance", () => {
  test("après déconnexion et reconnexion : la mise en forme est toujours là", async () => {
    const c = byTitle("Formation riche");
    const again = await loginInstructor(srv);
    const form = (await again.get(`/formateur/cours/${c.id}/modifier`)).text;
    assert.match(form, /<template[^>]+data-rich-source="description">[\s\S]*<strong>complète<\/strong>/);
    assert.match(form, /<template[^>]+data-rich-source="skills">\s*<ul><li><span style="color: #1e7a34">Montage professionnel<\/span>/);
  });
  test("aller-retour : ce que l'éditeur reçoit puis renvoie ne change pas la base", async () => {
    const c = byTitle("Formation riche");
    const before = q("SELECT description, objectives, prerequisites, target_audience, skills FROM courses WHERE id = ?", c.id)[0];
    await prof.post(`/formateur/cours/${c.id}/modifier`, { ...RICH, ...before, title: "Formation riche", rich_text: "1" });
    assert.deepEqual(q("SELECT description, objectives, prerequisites, target_audience, skills FROM courses WHERE id = ?", c.id)[0], before);
  });
  test("publier et dépublier ne modifie pas les textes", async () => {
    const c = byTitle("Formation riche");
    const texts = () => q("SELECT description, objectives, skills, rich_text FROM courses WHERE id = ?", c.id)[0];
    const before = texts();
    await prof.post(`/formateur/cours/${c.id}/publier`, {}); // dépublie
    assert.equal(q("SELECT published FROM courses WHERE id = ?", c.id)[0].published, 0);
    assert.deepEqual(texts(), before);
    await prof.post(`/formateur/cours/${c.id}/publier`, {}); // republie
    assert.equal(q("SELECT published FROM courses WHERE id = ?", c.id)[0].published, 1);
    assert.deepEqual(texts(), before);
  });
  test("dupliquer une formation copie aussi l'indicateur de format", async () => {
    const c = byTitle("Formation riche");
    await prof.post(`/formateur/cours/${c.id}/dupliquer`, {});
    const copy = q("SELECT * FROM courses WHERE id != ? AND title LIKE 'Formation riche%' ORDER BY id DESC", c.id)[0];
    assert.equal(copy.rich_text, 1);
    assert.equal(copy.description, q("SELECT description FROM courses WHERE id = ?", c.id)[0].description);
  });
});

describe("PDF du plan", () => {
  test("texte riche : titres, listes et texte lisibles, sans balises", async () => {
    const c = byTitle("Formation riche");
    const res = await fetch(`${srv.base}/cours/${c.slug}/programme.pdf`);
    const raw = Buffer.from(await res.arrayBuffer()).toString("latin1");
    const text = [...raw.matchAll(/\[((?:<[0-9a-f]*>|\s|-?[\d.]+)*)\]\s*TJ/gi)].map((m) => [...m[1].matchAll(/<([0-9a-f]*)>/gi)].map((h) => Buffer.from(h[1], "hex").toString("latin1")).join("")).join("\n");
    for (const s of ["Ce que vous allez découvrir", "Une formation complète", "Montage vidéo", "Monter une vidéo de A à Z", "Savoir utiliser un ordinateur", "Débutants complets", "Montage professionnel"]) assert.ok(text.includes(s), `absent : ${s}`);
    assert.doesNotMatch(text, /<[a-z\/]|&lt;|&amp;|\*\*/i);
  });
  test("ancienne formation (Markdown) : PDF inchangé", async () => {
    const c = byTitle("Formation à convertir");
    const res = await prof.request(`/cours/${c.slug}/programme.pdf`);
    assert.equal(res.status, 200);
  });
});

describe("fichier de l'éditeur", () => {
  const bundle = path.join(__dirname, "..", "public", "js", "course-editor.js");
  test("le fichier construit existe, est servi avec un cache long, et reste raisonnable", async () => {
    assert.ok(fs.existsSync(bundle), "lancez : npm run build:editor");
    const size = fs.statSync(bundle).size;
    assert.ok(size > 50000 && size < 900000, `taille : ${size}`);
    const r = await fetch(`${srv.base}/js/course-editor.js`);
    assert.equal(r.status, 200);
    assert.match(r.headers.get("content-type"), /javascript/);
  });
  test("il n'est chargé que sur le formulaire de formation", async () => {
    const c = byTitle("Formation riche");
    for (const url of ["/", "/catalogue", `/cours/${c.slug}`, "/formateur"]) {
      assert.doesNotMatch((await prof.get(url)).text, /course-editor\.js/, url);
    }
  });
  test("il ne contient aucun appel à eval ni chargement de ressource externe", () => {
    const code = fs.readFileSync(bundle, "utf8");
    assert.doesNotMatch(code, /\beval\s*\(/);
    assert.doesNotMatch(code, /https?:\/\/(?!www\.w3\.org|prosemirror|tiptap|github|developer\.mozilla|schema\.org|reactjs|react\.dev)[a-z0-9.-]+\/[^"'\s]*\.(js|css)/i);
  });
});
