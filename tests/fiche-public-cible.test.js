// « À qui s'adresse cette formation ? » : une carte par profil (titre + description), jamais de Markdown brut.
const { test, before, after, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { startServer, Client, loginInstructor, createCourse } = require("./helpers");
const { parseAudience, audienceFromText, audienceFromItems, listLines, inlineMarkdownToHtml, stripMarkdown, audienceIcon } = require("../src/utils/profiles");
const rich = require("../src/utils/richText");

const CSS = fs.readFileSync(path.join(__dirname, "..", "public", "css", "style.css"), "utf8");

// Texte exact enregistré pour la formation « Découvrir Final Cut Pro X 10.1 » (Markdown collé tel quel)
const REAL = [
  "Cette formation s’adresse à :",
  "* **Les débutants** qui souhaitent découvrir le montage vidéo avec Final Cut Pro X 10.1.",
  "* **Les personnes qui n’ont jamais utilisé Final Cut Pro** et souhaitent apprendre à partir de zéro.",
  "* **Les créateurs de contenu** qui veulent apprendre à réaliser leurs propres vidéos.",
  "* **Les vidéastes débutants** souhaitant acquérir de bonnes bases en montage vidéo.",
  "* **Les étudiants et passionnés d’audiovisuel** qui souhaitent développer leurs compétences.",
  "* **Les entrepreneurs et professionnels** souhaitant créer et monter leurs propres contenus vidéo.",
  "* Toute personne souhaitant **apprendre Final Cut Pro X 10.1 progressivement**, sans avoir besoin de connaissances avancées en montage vidéo.",
].join("\n");

const EXPECTED = [
  ["Les débutants", "Les débutants qui souhaitent découvrir le montage vidéo avec Final Cut Pro X 10.1.", "user"],
  ["Les personnes qui n’ont jamais utilisé Final Cut Pro", "Les personnes qui n’ont jamais utilisé Final Cut Pro et souhaitent apprendre à partir de zéro.", "user"],
  ["Les créateurs de contenu", "Les créateurs de contenu qui veulent apprendre à réaliser leurs propres vidéos.", "video"],
  ["Les vidéastes débutants", "Les vidéastes débutants souhaitant acquérir de bonnes bases en montage vidéo.", "video"],
  ["Les étudiants et passionnés d’audiovisuel", "Les étudiants et passionnés d’audiovisuel qui souhaitent développer leurs compétences.", "graduation"],
  ["Les entrepreneurs et professionnels", "Les entrepreneurs et professionnels souhaitant créer et monter leurs propres contenus vidéo.", "briefcase"],
  ["Toute personne souhaitant apprendre Final Cut Pro X 10.1 progressivement", "Toute personne souhaitant apprendre Final Cut Pro X 10.1 progressivement, sans avoir besoin de connaissances avancées en montage vidéo.", "users"],
];

describe("analyse du texte enregistré (src/utils/profiles.js)", () => {
  test("le texte réel donne 7 profils dans l'ordre, chacun avec son titre et sa description", () => {
    const profiles = audienceFromText(REAL);
    assert.equal(profiles.length, 7);
    profiles.forEach((p, i) => {
      assert.equal(p.title, EXPECTED[i][0], `titre ${i + 1}`);
      assert.equal(p.description, EXPECTED[i][1], `description ${i + 1}`);
      assert.equal(p.icon, EXPECTED[i][2], `icône ${i + 1}`);
    });
  });
  test("la ligne d'introduction « … : » n'est pas un profil", () => {
    assert.ok(!audienceFromText(REAL).some((p) => /s’adresse à/.test(p.title + p.description)));
  });
  test("jamais d'astérisque, de tiret de liste ni de balise dans les profils", () => {
    for (const p of audienceFromText(REAL)) assert.doesNotMatch(p.title + p.description, /[*_]|^\s*-|<|>/);
  });
  test("puces variées : -, +, 1. et 2)", () => {
    const t = ["- **A** fait ceci", "+ **B** fait cela", "1. **C** pareil", "2) **D** aussi"].join("\n");
    assert.deepEqual(audienceFromText(t).map((p) => p.title), ["A", "B", "C", "D"]);
  });
  test("sans puces : une ligne = un profil (ancien comportement conservé)", () => {
    const list = audienceFromText("Débutants complets\nPersonnes en reconversion");
    assert.deepEqual(list.map((p) => p.title), ["Débutants complets", "Personnes en reconversion"]);
    assert.deepEqual(list.map((p) => p.description), ["", ""]);
  });
  test("titre en gras suivi d'un séparateur (« : », « — », « - ») : le séparateur disparaît", () => {
    const [a, b, c] = audienceFromText("* **Freelances** : Ils veulent gagner du temps.\n* **Monteurs** — Ils veulent progresser.\n* **Étudiants** - Ils apprennent.");
    assert.equal(a.title, "Freelances");
    assert.equal(a.description, "Ils veulent gagner du temps.");
    assert.equal(b.description, "Ils veulent progresser.");
    assert.equal(c.description, "Ils apprennent.");
  });
  test("une phrase qui continue le titre est reconstituée en phrase complète", () => {
    const [p] = audienceFromText("* **Les débutants** qui souhaitent apprendre.");
    assert.equal(p.description, "Les débutants qui souhaitent apprendre.");
  });
  test("une longue phrase sans mise en forme : titre court + phrase complète en description", () => {
    const [p] = audienceFromText("Les personnes qui souhaitent apprendre à monter des vidéos de qualité professionnelle pour les réseaux sociaux et le web.");
    assert.ok(p.title.length > 0 && p.title.length <= 90 && p.description.length > p.title.length, JSON.stringify(p));
  });
  test("un profil très court sans description reste un titre seul", () => {
    assert.deepEqual(audienceFromText("Graphistes").map((p) => [p.title, p.description]), [["Graphistes", ""]]);
  });
  test("astérisques isolés ou mal fermés : nettoyés, jamais affichés", () => {
    const [p] = audienceFromText("* **Les pros* qui veulent **progresser");
    assert.doesNotMatch(p.title + p.description, /\*/);
  });
  test("vide, lignes vides, introduction seule : aucun profil", () => {
    assert.deepEqual(audienceFromText(""), []);
    assert.deepEqual(audienceFromText("\n\n  \n"), []);
    assert.deepEqual(audienceFromText("Cette formation s'adresse à :"), []);
  });
  test("HTML saisi : reste du texte (échappé plus tard par la vue), sans balise interprétée", () => {
    const [p] = audienceFromText("* **<b>Gras</b>** <script>alert(1)</script> après");
    assert.ok(typeof p.title === "string" && typeof p.description === "string");
    assert.doesNotMatch(JSON.stringify(p), /\*\*/);
  });
  test("nouveau format (éditeur riche) : le titre en gras est reconnu comme dans le Markdown", () => {
    const items = rich.listItems("<ul><li><p><strong>Freelances</strong> qui veulent gagner du temps</p></li><li><p>Toute personne curieuse</p></li></ul>");
    const list = audienceFromItems(items);
    assert.equal(list[0].title, "Freelances");
    assert.equal(list[0].description, "Freelances qui veulent gagner du temps");
    assert.equal(list[1].title, "Toute personne curieuse");
  });
  test("icônes choisies selon le sens du profil (sans accents ni casse)", () => {
    assert.equal(audienceIcon("Les ÉTUDIANTS"), "graduation");
    assert.equal(audienceIcon("Freelances et indépendants"), "briefcase");
    assert.equal(audienceIcon("Vidéastes"), "video");
    assert.equal(audienceIcon("Tous les curieux"), "users");
    assert.equal(audienceIcon("Quelqu'un"), "user");
  });
  test("outils : puces retirées, gras converti, échappement HTML", () => {
    assert.deepEqual(listLines("Intro :\n* a\n* b"), ["a", "b"]);
    assert.equal(inlineMarkdownToHtml("**gras** et *italique* & <b>"), "<strong>gras</strong> et <em>italique</em> &amp; &lt;b&gt;");
    assert.equal(stripMarkdown("* **Titre** suite"), "Titre suite");
  });
});

describe("même nettoyage pour les autres listes (objectifs, prérequis, compétences), le PDF et l'éditeur", () => {
  test("liste de l'ancien format : plus d'astérisques ; le gras devient un vrai gras", () => {
    const t = rich.courseTexts({ rich_text: 0, description: "", objectives: "Vous saurez :\n* **Monter** une vidéo\n* Exporter *proprement*", prerequisites: "", target_audience: "", skills: "- **Cadrer** un plan" });
    assert.deepEqual(t.objectives.map((i) => i.html), ["<strong>Monter</strong> une vidéo", "Exporter <em>proprement</em>"]);
    assert.deepEqual(t.objectives.map((i) => i.text), ["Monter une vidéo", "Exporter proprement"]);
    assert.deepEqual(t.skills.map((i) => i.html), ["<strong>Cadrer</strong> un plan"]);
  });
  test("une liste simple (une ligne par élément) donne le même résultat qu'avant", () => {
    const t = rich.courseTexts({ rich_text: 0, description: "", objectives: "Un\nDeux <b>gras</b> & co", prerequisites: "", target_audience: "", skills: "" });
    assert.deepEqual(t.objectives.map((i) => i.html), ["Un", "Deux &lt;b&gt;gras&lt;/b&gt; &amp; co"]);
  });
  test("l'éditeur reçoit une vraie liste avec du vrai gras, sans astérisques ni introduction", () => {
    const html = rich.legacyListToHtml(REAL);
    assert.doesNotMatch(html, /\*|s’adresse à/);
    assert.match(html, /<li><strong>Les débutants<\/strong> qui souhaitent/);
    assert.equal((html.match(/<li>/g) || []).length, 7);
  });
  test("courseTexts fournit les profils du public visé (ancien et nouveau format)", () => {
    const legacy = rich.courseTexts({ rich_text: 0, description: "", objectives: "", prerequisites: "", skills: "", target_audience: REAL });
    assert.equal(legacy.audienceProfiles.length, 7);
    const modern = rich.courseTexts({ rich_text: 1, description: "", objectives: "", prerequisites: "", skills: "", target_audience: "<ul><li><strong>Freelances</strong> pressés</li></ul>" });
    assert.equal(modern.audienceProfiles[0].title, "Freelances");
  });
});

describe("page publique", () => {
  let srv, prof, course;
  const anon = () => new Client(srv.base);
  const block = async (slug) => {
    const html = (await anon().get(`/cours/${slug}`)).text.replace(/\s+/g, " ");
    const start = html.indexOf('id="public"');
    return start < 0 ? "" : html.slice(start, html.indexOf('id="competences"') > start ? html.indexOf('id="competences"') : html.indexOf('id="description"'));
  };
  before(async () => {
    srv = await startServer();
    prof = await loginInstructor(srv);
    course = await createCourse(prof, srv, { title: "Public réel", price: 10, extra: { target_audience: REAL } });
  });
  after(() => srv.stop());

  test("une carte indépendante par profil, dans l'ordre, chacune avec son titre (h3) et sa description", async () => {
    const b = await block(course.slug);
    const items = [...b.matchAll(/<li class="audience-item">([\s\S]*?)<\/li>/g)].map((m) => m[1]);
    assert.equal(items.length, 7);
    items.forEach((item, i) => {
      assert.match(item, new RegExp(`<h3 class="audience-title">${EXPECTED[i][0].replace(/[’.]/g, ".")}</h3>`.replace(/\./g, "[^<]?")), `titre ${i + 1}`);
      assert.match(item, /<p class="audience-desc">[^<]+<\/p>/, `description ${i + 1}`);
      assert.match(item, /<svg[^>]+aria-hidden="true"/, `icône décorative ${i + 1}`);
    });
  });
  test("le titre de la section est un h2 relié à la liste", async () => {
    const b = await block(course.slug);
    assert.match(b, /<h2[^>]*>À qui s'adresse cette formation \?<\/h2>/);
  });
  test("aucun caractère Markdown ni ligne d'introduction à l'écran", async () => {
    const b = await block(course.slug);
    const text = b.replace(/<[^>]+>/g, " ");
    assert.doesNotMatch(text, /[*]/);
    assert.doesNotMatch(text, /s’adresse à :/);
  });
  test("les profils reprennent exactement le texte enregistré (rien d'inventé)", async () => {
    const b = await block(course.slug);
    const text = b.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").replace(/&#39;/g, "'");
    for (const [title, desc] of EXPECTED) {
      assert.ok(text.includes(title.replace(/’/g, "’")) || text.includes(title.replace(/’/g, "'")), title);
      assert.ok(text.includes(desc) || text.includes(desc.replace(/’/g, "'")), desc);
    }
  });
  test("le contenu saisi est neutralisé (échappement)", async () => {
    const c = await createCourse(prof, srv, { title: "Public piégé", price: 0, extra: { target_audience: "* **<img src=x onerror=alert(1)>** <script>alert(2)</script> texte" } });
    const html = (await anon().get(`/cours/${c.slug}`)).text;
    assert.doesNotMatch(html, /<img src=x|<script>alert\(2\)/);
  });
  test("nouveau format (éditeur) : mêmes cartes", async () => {
    const c = await createCourse(prof, srv, { title: "Public éditeur", price: 0, extra: { rich_text: "1", target_audience: "<ul><li><p><strong>Freelances</strong> qui veulent aller vite</p></li><li><p><strong>Étudiants</strong></p></li></ul>" } });
    const b = await block(c.slug);
    assert.equal((b.match(/class="audience-item"/g) || []).length, 2);
    assert.match(b, /<h3 class="audience-title">Freelances<\/h3>/);
    assert.match(b, /<h3 class="audience-title">Étudiants<\/h3>/);
    assert.doesNotMatch(b.slice(b.indexOf("Étudiants")), /audience-desc[^>]*>\s*<\/p>/);
  });
  test("profil sans description : pas de paragraphe vide", async () => {
    const c = await createCourse(prof, srv, { title: "Public court", price: 0, extra: { target_audience: "Débutants" } });
    const b = await block(c.slug);
    assert.match(b, /<h3 class="audience-title">Débutants<\/h3>/);
    assert.doesNotMatch(b, /class="audience-desc"/);
  });
  test("aucun profil : la section est masquée, la page reste valide", async () => {
    const c = await createCourse(prof, srv, { title: "Sans public", price: 0 });
    const res = await anon().get(`/cours/${c.slug}`);
    assert.equal(res.status, 200);
    assert.doesNotMatch(res.text, /id="public"/);
  });
  test("le PDF du plan n'affiche plus d'astérisques pour le public visé", async () => {
    const res = await fetch(`${srv.base}/cours/${course.slug}/programme.pdf`);
    const raw = Buffer.from(await res.arrayBuffer()).toString("latin1");
    const text = [...raw.matchAll(/\[((?:<[0-9a-f]*>|\s|-?[\d.]+)*)\]\s*TJ/gi)].map((m) => [...m[1].matchAll(/<([0-9a-f]*)>/gi)].map((h) => Buffer.from(h[1], "hex").toString("latin1")).join("")).join("\n");
    assert.match(text, /Les d.butants/);
    assert.doesNotMatch(text, /\*/);
  });
  test("le formulaire d'édition d'une ancienne formation n'affiche plus d'astérisques dans l'éditeur", async () => {
    const form = (await prof.get(`/formateur/cours/${course.id}/modifier`)).text;
    const tpl = form.match(/<template[^>]+data-rich-source="target_audience">([\s\S]*?)<\/template>/)[1];
    assert.doesNotMatch(tpl, /\*/);
    assert.match(tpl, /<strong>Les débutants<\/strong>/);
  });
  test("la consigne du champ explique le format titre en gras + description", async () => {
    const form = (await prof.get(`/formateur/cours/${course.id}/modifier`)).text;
    assert.match(form, /titre en gras/i);
  });
});

describe("style : une colonne, cartes sans hauteur fixe, code propre", () => {
  const rules = (selectorPattern) => [...CSS.matchAll(/([^{}]+)\{([^{}]*)\}/g)].filter(([, sel]) => selectorPattern.test(sel)).map(([, sel, body]) => ({ sel: sel.trim(), body }));
  test("la liste est une colonne unique (flex vertical), sans grille à colonnes", () => {
    const list = rules(/\.audience-list\b/).filter((r) => !/@media/.test(r.sel));
    assert.ok(list.length >= 1);
    for (const r of list) assert.doesNotMatch(r.body, /grid-template-columns/);
    assert.match(list.map((r) => r.body).join(";"), /flex-direction:\s*column/);
  });
  test("aucune hauteur fixe, position absolue, marge négative ni !important sur les cartes", () => {
    const all = rules(/\.audience-/).map((r) => r.body).join(";");
    assert.doesNotMatch(all, /(?:^|[;\s])(?:height|max-height):\s*\d/);
    assert.doesNotMatch(all, /position:\s*absolute/);
    assert.doesNotMatch(all, /margin[^;]*:\s*-\d/);
    assert.doesNotMatch(all, /!important/);
  });
  test("largeur 100 % (pas de largeur fixe), texte qui passe à la ligne", () => {
    const item = rules(/\.audience-item\b/).map((r) => r.body).join(";");
    assert.doesNotMatch(item, /(?:^|[;\s])width:\s*\d+px/);
    assert.match(rules(/\.audience-(?:copy|desc|title)/).map((r) => r.body).join(";"), /overflow-wrap:\s*anywhere|min-width:\s*0/);
  });
  test("tailles de texte : titre 16–20 px, description 15–17 px, interligne 1,5–1,7", () => {
    const px = (v) => (/rem$/.test(v) ? parseFloat(v) * 16 : parseFloat(v));
    const title = rules(/\.audience-title\b/).map((r) => r.body.match(/font-size:\s*([\d.]+(?:rem|px))/)).filter(Boolean)[0];
    const desc = rules(/\.audience-desc\b/).map((r) => r.body.match(/font-size:\s*([\d.]+(?:rem|px))/)).filter(Boolean)[0];
    const lh = rules(/\.audience-desc\b/).map((r) => r.body.match(/line-height:\s*([\d.]+)/)).filter(Boolean)[0];
    assert.ok(px(title[1]) >= 16 && px(title[1]) <= 20, `titre ${title[1]}`);
    assert.ok(px(desc[1]) >= 15 && px(desc[1]) <= 17, `description ${desc[1]}`);
    assert.ok(Number(lh[1]) >= 1.5 && Number(lh[1]) <= 1.7, `interligne ${lh[1]}`);
  });
  test("les anciennes règles à deux colonnes de cette section ont disparu", () => {
    assert.doesNotMatch(CSS, /\.audience-list\s*\{[^}]*grid-template-columns/);
    assert.doesNotMatch(CSS, /\.audience-icon\b/);
  });
});
