// Marketing R5 (1/3) — nouveaux blocs : citation, liste, réseaux sociaux, vidéo, formation du catalogue. Jamais de HTML libre.
const { test, describe, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { compileTemplate, renderEmail, TYPES } = require("../src/marketing/templates/blocks");
const { lintEmail } = require("../src/marketing/templates/lint");
const { htmlToText } = require("../src/marketing/templates/text");
const { Parser } = require("htmlparser2");
const { freshMarketing, addLmsSchema, T0 } = require("./marketing-helpers");
const templates = require("../src/marketing/templates");

// Analyse réelle du HTML : éléments dangereux, attributs d'événement, adresses actives non https
function violations(html) {
  const found = [];
  const parser = new Parser({
    onopentag(name, attribs) {
      if (["script", "iframe", "object", "embed", "form", "link", "base", "svg", "math", "video", "audio", "source"].includes(name)) found.push(`balise <${name}>`);
      for (const [k, v] of Object.entries(attribs)) {
        if (/^on/i.test(k)) found.push(`attribut ${k}`);
        if (["href", "src"].includes(k) && !/^(https:\/\/|mailto:|tel:)/i.test(v)) found.push(`${k}=${v.slice(0, 30)}`);
        if (k === "style" && /url\(|expression\(|javascript:|@import/i.test(v)) found.push("style dangereux");
      }
    },
  });
  parser.write(html); parser.end();
  return found;
}

const ALLOW = (p) => /^(contact\.(first_name|last_name|full_name|email|company|country)|org\.(name|address)|unsubscribe_url|preferences_url|view_url)$/.test(p);
const CTX = (first = "Awa") => ({
  contact: { first_name: first, last_name: "Koffi", full_name: `${first} Koffi`, email: "awa@ex.fr", company: "", country: "FR" },
  org: { name: "KOLAKISA", address: "12 rue des Écoles" },
  unsubscribe_url: "https://k.test/u/tok", preferences_url: "https://k.test/preferences/tok", view_url: "",
});
const tpl = (blocks) => ({ kind: "marketing", subject: "Sujet", preheader: "Aperçu", blocks });
const build = (block, ctx = CTX()) => { const c = compileTemplate(tpl([block]), { allowed: ALLOW }); return { c, r: renderEmail(c, ctx) }; };
const code = (fn) => { try { fn(); } catch (e) { return e.code; } return null; };
const message = (fn) => { try { fn(); } catch (e) { return e.message; } return ""; };
const bad = (block, pattern) => {
  assert.equal(code(() => compileTemplate(tpl([block]), { allowed: ALLOW })), "invalid_template", JSON.stringify(block).slice(0, 90));
  if (pattern) assert.match(message(() => compileTemplate(tpl([block]), { allowed: ALLOW })), pattern);
};

describe("catalogue des blocs", () => {
  test("les nouveaux types existent ; aucun type « HTML libre »", () => {
    for (const t of ["heading", "text", "image", "button", "divider", "spacer", "columns", "quote", "list", "social", "video", "course"]) assert.ok(TYPES.includes(t), t);
    assert.ok(!TYPES.some((t) => /html|code|embed|script|iframe/i.test(t)));
    bad({ type: "html", html: "<b>x</b>" }, /inconnu/i);
    bad({ type: "iframe", src: "https://x.fr" }, /inconnu/i);
  });
});

describe("bloc citation", () => {
  test("rendu : filet d'accent, guillemets, auteur facultatif, texte échappé", () => {
    const { r } = build({ type: "quote", text: "Apprendre <b>vite</b> & bien", author: "Awa" });
    assert.match(r.html, /border-left:4px solid #0277b6/);
    assert.match(r.html, /“Apprendre &lt;b&gt;vite&lt;\/b&gt; &amp; bien”/);
    assert.match(r.html, /— Awa/);
    assert.deepEqual(violations(r.html), []);
    assert.doesNotMatch(r.html, /<b>vite/);
  });
  test("variables permises et échappées à chaque destinataire ; auteur facultatif", () => {
    const { c } = build({ type: "quote", text: "Merci {{contact.first_name}}" });
    assert.match(renderEmail(c, CTX("<i>Zoé</i>")).html, /Merci &lt;i&gt;Zoé&lt;\/i&gt;/);
    assert.doesNotMatch(build({ type: "quote", text: "Seul" }).r.html, /—/);
  });
  test("validation : texte obligatoire et borné, variable inconnue refusée", () => {
    bad({ type: "quote", text: "" }, /obligatoire/i);
    bad({ type: "quote", text: "x".repeat(501) }, /trop long/i);
    bad({ type: "quote", text: "ok", author: "y".repeat(101) }, /trop long/i);
    bad({ type: "quote", text: "{{secret.cle}}" });
  });
  test("normalisation et texte brut", () => {
    const { c, r } = build({ type: "quote", text: "  Belle citation  ", author: " Awa " });
    assert.deepEqual(c.normalized.blocks[0], { id: "b1", type: "quote", text: "Belle citation", author: "Awa" });
    assert.match(r.text, /Belle citation/);
  });
});

describe("bloc liste", () => {
  test("puces, numéros et coches : éléments échappés, structure de liste réelle pour puces/numéros", () => {
    const bullets = build({ type: "list", style: "bullets", items: ["Un", "<u>Deux</u>", "Trois"] }).r.html;
    assert.match(bullets, /<ul style="[^"]*"><li style="[^"]*">Un<\/li><li[^>]*>&lt;u&gt;Deux&lt;\/u&gt;<\/li>/);
    assert.match(build({ type: "list", style: "numbers", items: ["A", "B"] }).r.html, /<ol style="[^"]*"><li/);
    const checks = build({ type: "list", style: "checks", items: ["Fait", "À faire"] }).r.html;
    assert.equal((checks.match(/✓/g) || []).length, 2);
    assert.deepEqual(violations(bullets + checks), []);
  });
  test("style par défaut : puces ; variables dans les éléments", () => {
    const { c, r } = build({ type: "list", items: ["Bonjour {{contact.first_name}}"] });
    assert.match(r.html, /<ul/);
    assert.match(renderEmail(c, CTX("Zoé")).html, /Bonjour Zoé/);
  });
  test("texte brut : « - » devant chaque élément", () => {
    assert.match(build({ type: "list", style: "bullets", items: ["Un", "Deux"] }).r.text, /- Un\n- Deux/);
  });
  test("validation : 1 à 20 éléments, chacun borné, style connu, tableau exigé", () => {
    bad({ type: "list", items: [] }, /au moins/i);
    bad({ type: "list", items: Array.from({ length: 21 }, (_, i) => `e${i}`) }, /20/);
    bad({ type: "list", items: ["ok", ""] }, /vide|obligatoire/i);
    bad({ type: "list", items: ["x".repeat(201)] }, /trop long/i);
    bad({ type: "list", style: "romain", items: ["a"] }, /style/i);
    bad({ type: "list", items: "a\nb" }, /liste|tableau/i);
    bad({ type: "list", items: [{ a: 1 }] });
  });
  test("normalisation : éléments rognés", () => {
    assert.deepEqual(build({ type: "list", style: "numbers", items: [" a ", "b"] }).c.normalized.blocks[0], { id: "b1", type: "list", style: "numbers", items: ["a", "b"] });
  });
});

describe("bloc réseaux sociaux", () => {
  const links = [{ network: "facebook", url: "https://facebook.com/koyekola" }, { network: "youtube", url: "https://youtube.com/@koyekola" }];
  test("liens texte (aucune image externe), libellés français, alignement", () => {
    const { r } = build({ type: "social", links, align: "center" });
    assert.match(r.html, /text-align:center/);
    assert.match(r.html, /<a href="https:\/\/facebook\.com\/koyekola"[^>]*>Facebook<\/a>/);
    assert.match(r.html, /<a href="https:\/\/youtube\.com\/@koyekola"[^>]*>YouTube<\/a>/);
    assert.doesNotMatch(r.html, /<img/);
    assert.deepEqual(violations(r.html), []);
  });
  test("tous les réseaux proposés ont un libellé", () => {
    const nets = ["facebook", "instagram", "x", "linkedin", "youtube", "tiktok", "whatsapp", "website"];
    const { r } = build({ type: "social", links: nets.map((network) => ({ network, url: `https://${network}.exemple.fr/p` })) });
    for (const label of ["Facebook", "Instagram", "LinkedIn", "YouTube", "TikTok", "WhatsApp", "Site web"]) assert.match(r.html, new RegExp(`>${label}</a>`), label);
  });
  test("validation : https seulement, réseau connu, sans doublon, 1 à 8 liens", () => {
    bad({ type: "social", links: [{ network: "facebook", url: "http://facebook.com/x" }] }, /https/);
    bad({ type: "social", links: [{ network: "facebook", url: "javascript:alert(1)" }] }, /https/);
    bad({ type: "social", links: [{ network: "myspace", url: "https://m.fr" }] }, /réseau/i);
    bad({ type: "social", links: [{ network: "facebook", url: "https://a.fr" }, { network: "facebook", url: "https://b.fr" }] }, /deux fois|doublon/i);
    bad({ type: "social", links: [] }, /au moins/i);
    bad({ type: "social", links: Array.from({ length: 9 }, (_, i) => ({ network: ["facebook", "instagram", "x", "linkedin", "youtube", "tiktok", "whatsapp", "website", "facebook"][i], url: "https://a.fr" })) }, /8|trop/i);
    bad({ type: "social", links: [{ network: "facebook", url: "https://u:p@facebook.com/x" }] }, /identifiant/i);
    bad({ type: "social", links: [{ network: "facebook", url: "https://a.fr/{{contact.email}}" }] });
    bad({ type: "social", links: "facebook" });
  });
  test("adresse échappée dans l'attribut", () => {
    const { r } = build({ type: "social", links: [{ network: "website", url: "https://a.fr/?x=1&y=2" }] });
    assert.match(r.html, /href="https:\/\/a\.fr\/\?x=1&amp;y=2"/);
  });
});

describe("bloc vidéo", () => {
  test("miniature cliquable + lien texte « Regarder la vidéo » (un e-mail ne lit pas de vidéo)", () => {
    const { r } = build({ type: "video", url: "https://youtube.com/watch?v=abc", thumbnail: "https://img.exemple.fr/v.jpg", title: "Présentation de la formation" });
    assert.match(r.html, /<a href="https:\/\/youtube\.com\/watch\?v=abc"[^>]*><img src="https:\/\/img\.exemple\.fr\/v\.jpg" alt="Présentation de la formation"/);
    assert.match(r.html, /▶ Regarder la vidéo : Présentation de la formation/);
    assert.doesNotMatch(r.html, /<video|<iframe|<embed|<object/i);
    assert.deepEqual(violations(r.html), []);
  });
  test("sans miniature : uniquement le lien texte", () => {
    const { r } = build({ type: "video", url: "https://youtube.com/watch?v=abc", title: "Ma vidéo" });
    assert.doesNotMatch(r.html, /<img/);
    assert.match(r.html, /Regarder la vidéo : Ma vidéo/);
  });
  test("le titre sert de texte alternatif : obligatoire ; variables permises et échappées", () => {
    bad({ type: "video", url: "https://y.fr/v", title: "" }, /titre|obligatoire/i);
    const { c } = build({ type: "video", url: "https://y.fr/v", title: "Pour {{contact.first_name}}" });
    assert.match(renderEmail(c, CTX("<b>X</b>")).html, /Pour &lt;b&gt;X&lt;\/b&gt;/);
  });
  test("validation des adresses : https seulement, pas d'identifiants, pas de variable", () => {
    bad({ type: "video", url: "http://y.fr/v", title: "T" }, /https/);
    bad({ type: "video", url: "https://y.fr/v", thumbnail: "http://i.fr/a.jpg", title: "T" }, /https/);
    bad({ type: "video", url: "https://y.fr/v", thumbnail: "data:image/png;base64,AAAA", title: "T" }, /https/);
    bad({ type: "video", url: "https://u:p@y.fr/v", title: "T" }, /identifiant/i);
    bad({ type: "video", url: "https://y.fr/{{contact.email}}", title: "T" });
    bad({ type: "video", title: "T" }, /obligatoire/i);
  });
  test("largeur bornée, alignement, normalisation ; le contrôle qualité signale l'absence de texte si seule la vidéo", () => {
    bad({ type: "video", url: "https://y.fr/v", title: "T", width: 10 }, /largeur/i);
    const { c, r } = build({ type: "video", url: "https://y.fr/v", thumbnail: "https://i.fr/a.jpg", title: "T", width: 400, align: "center" });
    assert.deepEqual(c.normalized.blocks[0], { id: "b1", type: "video", url: "https://y.fr/v", thumbnail: "https://i.fr/a.jpg", title: "T", width: 400, align: "center" });
    assert.ok(lintEmail(c, r).every((w) => w.code !== "image_only"), "le lien texte compte comme du texte");
  });
});

describe("bloc formation du catalogue", () => {
  const snapshot = { id: 7, title: "Excel <avancé>", subtitle: "De zéro à expert", priceCents: 4900, url: "https://k.test/cours/excel-avance", image: "https://k.test/uploads/excel.jpg" };
  test("carte : titre, sous-titre, prix, image, bouton — tout échappé", () => {
    const { r } = build({ type: "course", courseId: 7, snapshot });
    assert.match(r.html, /Excel &lt;avancé&gt;/);
    assert.doesNotMatch(r.html, /Excel <avancé>/);
    assert.match(r.html, /De zéro à expert/);
    assert.match(r.html, /49,00 €/);
    assert.match(r.html, /<img src="https:\/\/k\.test\/uploads\/excel\.jpg" alt="Excel &lt;avancé&gt;"/);
    assert.match(r.html, /<a href="https:\/\/k\.test\/cours\/excel-avance"[^>]*>Voir la formation<\/a>/);
    assert.deepEqual(violations(r.html), []);
    assert.match(r.text, /Excel <avancé>|Excel/);
  });
  test("gratuit, sans image, libellé du bouton personnalisé", () => {
    const { r } = build({ type: "course", courseId: 7, cta: "Je m'inscris", snapshot: { ...snapshot, priceCents: 0, image: "" } });
    assert.match(r.html, /Gratuit/);
    assert.doesNotMatch(r.html, /<img/);
    assert.match(r.html, />Je m(?:'|&#39;)inscris<\/a>/);
  });
  test("le bloc est compilé sans jamais toucher au LMS : tout vient de l'instantané enregistré", () => {
    const { c } = build({ type: "course", courseId: 7, snapshot });
    assert.deepEqual(c.normalized.blocks[0], { id: "b1", type: "course", courseId: 7, cta: "Voir la formation", snapshot });
  });
  test("validation : instantané obligatoire et cohérent, adresses sûres", () => {
    bad({ type: "course", courseId: 7 }, /formation/i);
    bad({ type: "course", courseId: 0, snapshot }, /formation/i);
    bad({ type: "course", courseId: 8, snapshot }, /formation/i);
    bad({ type: "course", courseId: 7, snapshot: { ...snapshot, url: "javascript:alert(1)" } }, /adresse/i);
    bad({ type: "course", courseId: 7, snapshot: { ...snapshot, url: "http://k.test/cours/x" } }, /https/i);
    bad({ type: "course", courseId: 7, snapshot: { ...snapshot, image: "data:image/png;base64,AAAA" } }, /image|adresse/i);
    bad({ type: "course", courseId: 7, snapshot: { ...snapshot, priceCents: -5 } }, /prix/i);
    bad({ type: "course", courseId: 7, snapshot: { ...snapshot, title: "" } }, /titre/i);
    bad({ type: "course", courseId: 7, snapshot, cta: "x".repeat(81) }, /trop long/i);
  });
  test("http://localhost accepté pour le développement local", () => {
    assert.doesNotThrow(() => build({ type: "course", courseId: 7, snapshot: { ...snapshot, url: "http://localhost:3000/cours/x", image: "" } }));
  });
});

describe("blocs de contenu dans un modèle complet", () => {
  test("tous les nouveaux blocs ensemble : HTML sans élément dangereux, texte brut lisible, aucune alerte d'erreur", () => {
    const blocks = [
      { type: "heading", text: "Bonjour {{contact.first_name}}", level: 1 },
      { type: "quote", text: "Citation", author: "Auteur" },
      { type: "list", style: "checks", items: ["Un", "Deux"] },
      { type: "video", url: "https://y.fr/v", thumbnail: "https://i.fr/a.jpg", title: "Vidéo" },
      { type: "social", links: [{ network: "facebook", url: "https://f.fr/k" }] },
    ];
    const c = compileTemplate(tpl(blocks), { allowed: ALLOW });
    const r = renderEmail(c, CTX());
    assert.deepEqual(violations(r.html), []);
    assert.equal(c.normalized.blocks.length, 5);
    assert.ok(r.text.length > 20);
    assert.ok(lintEmail(c, r).every((w) => w.level !== "error"));
  });
  test("condition d'affichage utilisable sur les nouveaux blocs", () => {
    const c = compileTemplate(tpl([{ type: "quote", text: "Réservé FR", showIf: 'contact.country == "FR"' }]), { allowed: ALLOW });
    assert.match(renderEmail(c, CTX()).html, /Réservé FR/);
    const ctx = CTX(); ctx.contact.country = "TG";
    assert.doesNotMatch(renderEmail(c, ctx).html, /Réservé FR/);
  });
});

describe("bloc formation : instantané pris dans le catalogue au moment de l'enregistrement", () => {
  let m, A;
  const course = (title, o = {}) => Number(m.db.prepare("INSERT INTO courses (title, slug, published, subtitle, price_cents, thumbnail_path) VALUES (?, ?, ?, ?, ?, ?)").run(title, o.slug ?? title.toLowerCase().replace(/[^a-z0-9]+/g, "-"), o.published ?? 1, o.subtitle ?? "", o.price ?? 2500, o.thumb ?? null).lastInsertRowid);
  beforeEach(() => {
    m = freshMarketing(); A = m.A;
    m.db.exec("DROP TABLE IF EXISTS courses");
    addLmsSchema(m.db);
    m.db.exec("ALTER TABLE courses ADD COLUMN subtitle TEXT NOT NULL DEFAULT ''; ALTER TABLE courses ADD COLUMN price_cents INTEGER NOT NULL DEFAULT 0; ALTER TABLE courses ADD COLUMN thumbnail_path TEXT");
  });
  const make = (blocks, ctx = A) => templates.createTemplate(ctx, { name: `T${Math.random()}`, subject: "S", blocks });

  test("création : l'instantané (titre, prix, adresse, image) est ajouté depuis le catalogue", () => {
    const id = course("Excel", { subtitle: "Pour tous", price: 4900, thumb: "/uploads/excel.jpg" });
    const t = make([{ type: "text", markdown: "x" }, { type: "course", courseId: id }]);
    const block = t.blocks[1];
    assert.deepEqual(block.snapshot, { id, title: "Excel", subtitle: "Pour tous", priceCents: 4900, url: "https://k.test/cours/excel", image: "https://k.test/uploads/excel.jpg" });
    assert.equal(block.cta, "Voir la formation");
  });
  test("formation inconnue, non publiée : refusée avec un message clair", () => {
    const draft = course("Brouillon", { published: 0 });
    assert.equal(code(() => make([{ type: "course", courseId: 999 }])), "invalid_template");
    assert.match(message(() => make([{ type: "course", courseId: draft }])), /formation/i);
    assert.equal(code(() => make([{ type: "course" }])), "invalid_template");
  });
  test("l'instantané est conservé tel quel à la duplication et à l'enregistrement (le prix ne change pas tout seul)", () => {
    const id = course("Excel", { price: 4900 });
    const t = make([{ type: "course", courseId: id }]);
    m.db.prepare("UPDATE courses SET price_cents = 9900, title = 'Excel 2' WHERE id = ?").run(id);
    const copy = templates.duplicateTemplate(A, t.id);
    assert.equal(copy.blocks[0].snapshot.priceCents, 4900);
    const saved = templates.updateTemplate(A, t.id, { subject: "Autre" });
    assert.equal(saved.blocks[0].snapshot.title, "Excel");
    assert.match(templates.renderTemplate(A, t.id, null).html, /49,00 €/);
  });
  test("« refresh » recharge les informations du catalogue ; changer de formation aussi", () => {
    const a = course("Excel", { price: 4900 }), b = course("Python", { price: 1000 });
    const t = make([{ type: "course", courseId: a }]);
    m.db.prepare("UPDATE courses SET price_cents = 9900 WHERE id = ?").run(a);
    const refreshed = templates.updateTemplate(A, t.id, { blocks: [{ ...t.blocks[0], refresh: true }] });
    assert.equal(refreshed.blocks[0].snapshot.priceCents, 9900);
    assert.equal(Object.hasOwn(refreshed.blocks[0], "refresh"), false, "« refresh » n'est jamais enregistré");
    const switched = templates.updateTemplate(A, t.id, { blocks: [{ type: "course", courseId: b, snapshot: refreshed.blocks[0].snapshot }] });
    assert.equal(switched.blocks[0].snapshot.title, "Python");
  });
  test("un instantané forgé côté client n'est pas cru : identifiant incohérent → recharge depuis le catalogue", () => {
    const a = course("Excel", { price: 4900 });
    const t = make([{ type: "course", courseId: a, snapshot: { id: 9999, title: "Faux", subtitle: "", priceCents: 1, url: "https://evil.fr/x", image: "" } }]);
    assert.equal(t.blocks[0].snapshot.title, "Excel");
    assert.match(t.blocks[0].snapshot.url, /^https:\/\/k\.test\/cours\//);
  });
  test("aperçu d'un brouillon : même enrichissement, rien n'est écrit", () => {
    const id = course("Excel");
    const before = m.db.prepare("SELECT COUNT(*) n FROM mk_templates").get().n;
    const p = templates.previewTemplate(A, { subject: "S", blocks: [{ type: "text", markdown: "x" }, { type: "course", courseId: id }] });
    assert.match(p.html, /Excel/);
    assert.equal(m.db.prepare("SELECT COUNT(*) n FROM mk_templates").get().n, before);
  });
  test("adresse publique absente : message explicite plutôt qu'un lien cassé", () => {
    const id = course("Excel");
    assert.match(message(() => make([{ type: "course", courseId: id }], { ...A, baseUrl: "" })), /SITE_URL/);
  });
  test("catalogue absent (base sans tables LMS) : formation introuvable, pas de plantage", () => {
    const bare = freshMarketing();
    assert.equal(code(() => templates.createTemplate(bare.A, { name: "X", subject: "S", blocks: [{ type: "course", courseId: 1 }] })), "invalid_template");
  });
  test("formations proposées à l'éditeur : publiées seulement, sans donnée sensible", () => {
    course("Publiée"); course("Brouillon", { published: 0 });
    const list = require("../src/marketing/bridge/catalog").listCourses(A);
    assert.deepEqual(list.map((c) => c.title), ["Publiée"]);
    assert.deepEqual(Object.keys(list[0]).sort(), ["id", "title"]);
  });
});
