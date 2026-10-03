// Marketing M2b — blocs → HTML d'e-mail sûr, texte brut, contrôle qualité.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { compileTemplate, renderEmail, DEFAULT_THEME } = require("../src/marketing/templates/blocks");
const { lintEmail } = require("../src/marketing/templates/lint");
const { htmlToText } = require("../src/marketing/templates/text");
const { Parser } = require("htmlparser2");

// Analyse réelle du HTML (pas d'expression régulière) : éléments dangereux, attributs d'événement, adresses actives
function violations(html) {
  const found = [];
  const parser = new Parser({
    onopentag(name, attribs) {
      if (["script", "iframe", "object", "embed", "form", "link", "meta", "base", "svg", "math"].includes(name) && !(name === "meta")) found.push(`balise <${name}>`);
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

const ALLOW = (p) => /^(contact\.(first_name|last_name|full_name|email|company|country|props\.[a-z_]+)|org\.(name|address)|unsubscribe_url|preferences_url|view_url)$/.test(p);
const CTX = (extra = {}) => ({
  contact: { first_name: "Awa", last_name: "Koffi", full_name: "Awa Koffi", email: "awa@ex.fr", company: "", country: "FR", props: { niveau: "confirmé" }, ...extra },
  org: { name: "KOLAKISA", address: "12 rue des Écoles\n75005 Paris" },
  unsubscribe_url: "https://k.test/u/tok?a=1&b=2", preferences_url: "https://k.test/preferences/tok", view_url: "",
});
const tpl = (over = {}) => ({ kind: "marketing", subject: "Nouveautés de {{org.name}}", preheader: "Le meilleur du mois", blocks: [{ type: "text", markdown: "Bonjour {{contact.first_name}} !" }], ...over });
const build = (over, ctx = CTX()) => { const c = compileTemplate(tpl(over), { allowed: ALLOW }); return { c, r: renderEmail(c, ctx) }; };
const code = (fn) => { try { fn(); } catch (e) { return e.code; } return null; };
const message = (fn) => { try { fn(); } catch (e) { return e.message; } return ""; };
const bad = (over, pattern) => {
  assert.equal(code(() => compileTemplate(tpl(over), { allowed: ALLOW })), "invalid_template", JSON.stringify(over).slice(0, 80));
  if (pattern) assert.match(message(() => compileTemplate(tpl(over), { allowed: ALLOW })), pattern);
};

describe("structure de l'e-mail", () => {
  test("HTML complet, compatible clients mail : tableaux de présentation, largeur 600, langue, viewport, préheader caché", () => {
    const { r } = build();
    assert.match(r.html, /^<!DOCTYPE html>/);
    assert.match(r.html, /<html lang="fr"/);
    assert.match(r.html, /<meta name="viewport"/);
    assert.match(r.html, /<table role="presentation"[^>]*width="600"/);
    assert.match(r.html, /display:none[^"]*"[^>]*>Le meilleur du mois/);
    assert.match(r.html, /Bonjour Awa !/);
    assert.doesNotMatch(r.html, /<script|<link|@import|url\(|javascript:|<iframe|<form/i);
  });
  test("objet rendu avec les variables ; le titre du document est l'objet échappé", () => {
    const { r } = build({ subject: "Salut {{contact.first_name}} <b>" }, CTX({ first_name: "Awa" }));
    assert.equal(r.subject, "Salut Awa <b>");
    assert.match(r.html, /<title>Salut Awa &lt;b&gt;<\/title>/);
  });
  test("objet : injection d'en-tête par une valeur de contact impossible", () => {
    const { r } = build({ subject: "Bonjour {{contact.first_name}}" }, CTX({ first_name: "Awa\r\nBcc: x@y.fr" }));
    assert.doesNotMatch(r.subject, /[\r\n]/);
  });
  test("conditions dans l'objet", () => {
    const { c } = build({ subject: "{% if contact.company %}{{contact.company}} : {% endif %}Nouveautés" });
    assert.equal(renderEmail(c, CTX()).subject, "Nouveautés");
    assert.equal(renderEmail(c, CTX({ company: "Acme" })).subject, "Acme : Nouveautés");
  });
  test("thème : couleurs appliquées ; couleur invalide refusée (pas d'injection CSS)", () => {
    const { r } = build({ theme: { accent: "#ff0000", background: "#eeeeee" }, blocks: [{ type: "button", label: "Go", url: "https://ex.fr" }] });
    assert.match(r.html, /#ff0000/);
    assert.match(r.html, /background:#eeeeee/);
    bad({ theme: { accent: "red; background:url(https://evil.example/x)" } }, /couleur/i);
    bad({ theme: { accent: "#12345" } }, /couleur/i);
    bad({ theme: { fontFamily: "Comic Sans" } }, /police/i);
    assert.deepEqual(Object.keys(DEFAULT_THEME).sort(), ["accent", "background", "contentBackground", "fontFamily", "textColor"]);
  });
});

describe("pied de page légal", () => {
  test("marketing : lien de désinscription ET de préférences automatiques, adresse de l'organisation, non supprimables", () => {
    const { r } = build();
    assert.match(r.html, /href="https:\/\/k\.test\/u\/tok\?a=1&amp;b=2"/);
    assert.match(r.html, /href="https:\/\/k\.test\/preferences\/tok"/);
    assert.match(r.html, /Se désinscrire/);
    assert.match(r.html, /12 rue des Écoles/);
    assert.match(r.text, /Se désinscrire.*https:\/\/k\.test\/u\/tok/s);
  });
  test("un bloc « footer » fourni par l'utilisateur est refusé : le pied est géré par le système", () => {
    bad({ blocks: [{ type: "footer", markdown: "x" }] }, /type|inconnu|pied/i);
  });
  test("le texte du pied est personnalisable mais le lien reste", () => {
    const { r } = build({ footer: { text: "Vous recevez ce message car vous suivez {{org.name}}." } });
    assert.match(r.html, /vous suivez KOLAKISA/);
    assert.match(r.html, /Se désinscrire/);
  });
  test("sans lien de préférences fourni, seul le lien de désinscription apparaît", () => {
    const { r } = build({}, { ...CTX(), preferences_url: "" });
    assert.doesNotMatch(r.html, /Gérer mes préférences/);
    assert.match(r.html, /Se désinscrire/);
  });
  test("transactionnel : pas de désinscription imposée (messages liés au compte)", () => {
    const { r } = build({ kind: "transactional" });
    assert.doesNotMatch(r.html, /Se désinscrire/);
  });
  test("type de modèle inconnu refusé", () => bad({ kind: "spam" }, /type/i));
});

describe("bloc texte (Markdown sûr)", () => {
  test("gras, italique, listes, liens https, titres : rendus avec styles en ligne", () => {
    const { r } = build({ blocks: [{ type: "text", markdown: "## Titre\n\nVoir **ceci** et *cela* : [le site](https://ex.fr/a?b=1&c=2)\n\n- un\n- deux\n\n1. a\n2. b" }] });
    assert.match(r.html, /<h3[^>]*style="[^"]*"[^>]*>Titre<\/h3>|<h2[^>]*>Titre<\/h2>/);
    assert.match(r.html, /<strong[^>]*>ceci<\/strong>/);
    assert.match(r.html, /<em[^>]*>cela<\/em>/);
    assert.match(r.html, /<a href="https:\/\/ex\.fr\/a\?b=1&amp;c=2"[^>]*style="[^"]*color:#0277b6/);
    assert.match(r.html, /<ul[^>]*><li[^>]*>un<\/li>/);
    assert.match(r.html, /<ol[^>]*><li[^>]*>a<\/li>/);
  });
  test("HTML brut, scripts, événements, javascript:, data:, images : jamais actifs", () => {
    const evil = "<script>alert(1)</script> <img src=x onerror=alert(1)> [x](javascript:alert(1)) [d](data:text/html,<b>) ![i](https://evil.example/t.png) <a href=\"https://a.b\" onclick=\"x()\">a</a> <iframe src=//e></iframe>";
    const { r } = build({ blocks: [{ type: "text", markdown: evil }] });
    const body = r.html.split("<table")[1];
    assert.doesNotMatch(body, /<script|<img[^>]*(onerror|evil)|<iframe|onclick|javascript:|data:text/i);
    assert.doesNotMatch(r.html, /<img[^>]*evil\.example/i);
    assert.deepEqual(violations(r.html), []);
  });
  test("liens : https ou mailto seulement, sans target, avec rel ; http et liens relatifs deviennent du texte", () => {
    const { r } = build({ blocks: [{ type: "text", markdown: "[a](https://ok.fr) [b](mailto:x@y.fr) [c](http://non.fr) [d](/interne)" }] });
    assert.match(r.html, /href="https:\/\/ok\.fr"/);
    assert.match(r.html, /href="mailto:x@y\.fr"/);
    assert.doesNotMatch(r.html, /href="http:\/\/non\.fr"|href="\/interne"|target=/);
    assert.match(r.html, /rel="noopener noreferrer"/);
  });
  test("les variables sont insérées APRÈS le Markdown, échappées : un nom de contact ne peut pas devenir un lien, du gras ou du HTML", () => {
    const { r } = build({ blocks: [{ type: "text", markdown: "Bonjour {{contact.first_name}} — **{{contact.last_name}}**" }] }, CTX({
      first_name: "[Cliquez ici](https://evil.example) <img src=x onerror=alert(1)>", last_name: "**gras** _it_",
    }));
    assert.doesNotMatch(r.html, /href="https:\/\/evil\.example"|<img[^>]*onerror/);
    assert.match(r.html, /\[Cliquez ici\]\(https:\/\/evil\.example\) &lt;img src=x onerror=alert\(1\)&gt;/);
    assert.match(r.html, /<strong[^>]*>\*\*gras\*\* _it_<\/strong>/);
  });
  test("filtres dans le texte : default, upper…", () => {
    const { r } = build({ blocks: [{ type: "text", markdown: "Bonjour {{contact.company | default:\"cher(e) membre\"}}, {{contact.first_name | upper}}" }] });
    assert.match(r.html, /Bonjour cher\(e\) membre, AWA/);
  });
  test("liens système autorisés en adresse : {{unsubscribe_url}}, {{preferences_url}}, {{view_url}}", () => {
    const { r } = build({ blocks: [{ type: "text", markdown: "[Me désinscrire]({{unsubscribe_url}}) · [Voir en ligne]({{view_url}})" }] }, { ...CTX(), view_url: "https://k.test/v/1" });
    assert.match(r.html, /href="https:\/\/k\.test\/u\/tok\?a=1&amp;b=2"[^>]*>Me désinscrire/);
    assert.match(r.html, /href="https:\/\/k\.test\/v\/1"/);
  });
  test("une variable de contact dans l'ADRESSE d'un lien est refusée (redirection/phishing)", () => {
    bad({ blocks: [{ type: "text", markdown: "[x](https://evil.example/{{contact.first_name}})" }] }, /adresse d'un lien|adresse du lien/i);
    bad({ blocks: [{ type: "text", markdown: "[x]({{contact.email}})" }] }, /adresse d'un lien|adresse du lien/i);
  });
  test("conditions interdites dans un texte Markdown (voir « condition d'affichage » du bloc)", () => {
    bad({ blocks: [{ type: "text", markdown: "{% if contact.company %}x{% endif %}" }] }, /condition.*affichage|bloc/i);
  });
  test("variable inconnue : erreur qui nomme le bloc", () => {
    bad({ blocks: [{ type: "text", markdown: "ok" }, { type: "text", markdown: "{{secret.cle}}" }] }, /Bloc 2.*secret\.cle/s);
  });
  test("texte trop long ou vide refusé", () => {
    bad({ blocks: [{ type: "text", markdown: "x".repeat(10001) }] }, /trop long/i);
    bad({ blocks: [{ type: "text", markdown: "   " }] }, /vide|obligatoire/i);
  });
});

describe("autres blocs", () => {
  test("titre : niveau, alignement, texte échappé ; variables", () => {
    const { r } = build({ blocks: [{ type: "heading", text: "Salut {{contact.first_name}} <3", level: 1, align: "center" }] });
    assert.match(r.html, /<h1[^>]*text-align:center[^>]*>Salut Awa &lt;3<\/h1>/);
    bad({ blocks: [{ type: "heading", text: "x", align: "middle" }] }, /alignement/i);
    bad({ blocks: [{ type: "heading", text: "x", level: 4 }] }, /niveau/i);
  });
  test("image : https, alt obligatoire (ou décorative), largeur bornée, lien facultatif", () => {
    const { r } = build({ blocks: [{ type: "image", src: "https://cdn.ex.fr/a.png?x=1&y=2", alt: "Logo \"KOLAKISA\"", width: 300, href: "https://ex.fr" }] });
    assert.match(r.html, /<a href="https:\/\/ex\.fr"[^>]*><img src="https:\/\/cdn\.ex\.fr\/a\.png\?x=1&amp;y=2" alt="Logo &quot;KOLAKISA&quot;" width="300"/);
    assert.match(r.html, /style="display:block;border:0;/);
    const deco = build({ blocks: [{ type: "image", src: "https://cdn.ex.fr/a.png", alt: "", decorative: true }] });
    assert.match(deco.r.html, /alt=""/);
    bad({ blocks: [{ type: "image", src: "https://cdn.ex.fr/a.png", alt: "" }] }, /alternatif|alt/i);
    bad({ blocks: [{ type: "image", src: "http://cdn.ex.fr/a.png", alt: "x" }] }, /https/i);
    bad({ blocks: [{ type: "image", src: "javascript:alert(1)", alt: "x" }] }, /https/i);
    bad({ blocks: [{ type: "image", src: "data:image/png;base64,AAAA", alt: "x" }] }, /https/i);
    bad({ blocks: [{ type: "image", src: "https://user:pw@evil.example/a.png", alt: "x" }] }, /identifiant|https/i);
    bad({ blocks: [{ type: "image", src: "https://a.b/c.png\" onerror=\"x", alt: "x" }] }, /https|adresse/i);
    bad({ blocks: [{ type: "image", src: "https://a.b/c.png", alt: "x", width: 5000 }] }, /largeur/i);
  });
  test("bouton : https/mailto ou lien système ; libellé obligatoire ; couleur du texte choisie pour le contraste", () => {
    const light = build({ blocks: [{ type: "button", label: "Voir {{contact.first_name}}", url: "https://ex.fr/x", color: "#ffff00" }] });
    assert.match(light.r.html, /<a href="https:\/\/ex\.fr\/x"[^>]*color:#10222f[^>]*>Voir Awa<\/a>/);
    const dark = build({ blocks: [{ type: "button", label: "Go", url: "https://ex.fr/x", color: "#0b2a40" }] });
    assert.match(dark.r.html, /color:#ffffff/);
    const sys = build({ blocks: [{ type: "button", label: "Préférences", url: "{{preferences_url}}" }] });
    assert.match(sys.r.html, /href="https:\/\/k\.test\/preferences\/tok"/);
    bad({ blocks: [{ type: "button", label: "x", url: "javascript:alert(1)" }] }, /https|adresse/i);
    bad({ blocks: [{ type: "button", label: "", url: "https://ex.fr" }] }, /libellé/i);
    bad({ blocks: [{ type: "button", label: "x", url: "{{contact.email}}" }] }, /https|adresse/i);
  });
  test("séparateur, espace, deux colonnes", () => {
    const { r } = build({ blocks: [{ type: "divider" }, { type: "spacer", height: 32 }, { type: "columns", left: "**Gauche** {{contact.first_name}}", right: "Droite" }] });
    assert.match(r.html, /border-top:1px solid/);
    assert.match(r.html, /height:32px/);
    assert.match(r.html, /class="mk-col"[\s\S]*<strong[^>]*>Gauche<\/strong> Awa[\s\S]*class="mk-col"[\s\S]*Droite/);
    bad({ blocks: [{ type: "spacer", height: 500 }] }, /hauteur/i);
  });
  test("champs inconnus ignorés (pas de style ni d'attribut libre) ; type inconnu refusé", () => {
    const { r } = build({ blocks: [{ type: "divider", style: "x", onclick: "y" }] });
    assert.doesNotMatch(r.html, /onclick/);
    bad({ blocks: [{ type: "script", src: "x" }] }, /type/i);
    bad({ blocks: ["texte"] }, /bloc/i);
    bad({ blocks: "pas une liste" }, /blocs/i);
  });
  test("limites : 60 blocs, identifiants valides", () => {
    bad({ blocks: Array.from({ length: 61 }, () => ({ type: "divider" })) }, /60/);
    bad({ blocks: [{ type: "divider", id: "<x>" }] }, /identifiant/i);
    assert.doesNotThrow(() => build({ blocks: Array.from({ length: 60 }, () => ({ type: "divider" })) }));
  });
});

describe("condition d'affichage d'un bloc", () => {
  const t = { blocks: [{ type: "text", markdown: "Pour la France", showIf: "contact.country == \"FR\"" }, { type: "text", markdown: "Pour les autres", showIf: "not contact.country == \"FR\"" }] };
  test("le bloc est affiché ou masqué selon le contact", () => {
    const c = compileTemplate(tpl(t), { allowed: ALLOW });
    assert.match(renderEmail(c, CTX({ country: "FR" })).html, /Pour la France/);
    assert.doesNotMatch(renderEmail(c, CTX({ country: "FR" })).html, /Pour les autres/);
    assert.match(renderEmail(c, CTX({ country: "TG" })).html, /Pour les autres/);
  });
  test("condition invalide, variable inconnue ou tentative de sortir de la balise : refusées", () => {
    bad({ blocks: [{ type: "divider", showIf: "contact.country ==" }] }, /Bloc 1/);
    bad({ blocks: [{ type: "divider", showIf: "secret.x" }] }, /inconnue/i);
    bad({ blocks: [{ type: "divider", showIf: "contact.vip %}{% if x" }] }, /condition/i);
    bad({ blocks: [{ type: "divider", showIf: "{{contact.email}}" }] }, /condition/i);
    bad({ blocks: [{ type: "divider", showIf: "x".repeat(201) }] }, /trop long/i);
  });
});

describe("version texte automatique", () => {
  test("liens conservés (texte + adresse), listes, titres ; ni balises ni styles ; entités décodées ; préheader exclu", () => {
    const { r } = build({ subject: "S", preheader: "Texte caché", blocks: [{ type: "heading", text: "Bienvenue" }, { type: "text", markdown: "Voir [le site](https://ex.fr) & **plus**\n\n- un\n- deux" }, { type: "button", label: "Commencer", url: "https://ex.fr/go" }] });
    assert.doesNotMatch(r.text, /<[a-z\/]|display:none|font-family/i);
    assert.match(r.text, /Bienvenue/);
    assert.match(r.text, /le site \(https:\/\/ex\.fr\)/);
    assert.match(r.text, /& plus/);
    assert.match(r.text, /^- un$/m);
    assert.match(r.text, /Commencer \(https:\/\/ex\.fr\/go\)/);
    assert.doesNotMatch(r.text, /Texte caché/);
  });
  test("htmlToText : script/style ignorés, blocs séparés, lignes vides normalisées", () => {
    const text = htmlToText("<style>p{color:red}</style><p>Un</p><p>Deux<br>trois</p><script>x()</script><table><tr><td>A</td><td>B</td></tr></table>");
    assert.equal(text, "Un\n\nDeux\ntrois\n\nA B");
  });
});

describe("contrôle qualité", () => {
  const lint = (over, ctx) => { const { c, r } = build(over, ctx); return lintEmail(c, r); };
  const codes = (w) => w.map((x) => x.code);
  test("gabarit propre : aucune alerte bloquante", () => {
    const w = lint({ blocks: [{ type: "heading", text: "Bonjour" }, { type: "text", markdown: "Un texte assez complet pour ne pas être vide." }] });
    assert.ok(!w.some((x) => x.level === "error"));
  });
  test("objet trop long, tout en majuscules, points d'exclamation multiples, préheader vide", () => {
    assert.ok(codes(lint({ subject: "x".repeat(80) })).includes("subject_long"));
    assert.ok(codes(lint({ subject: "PROMOTION EXCEPTIONNELLE MAINTENANT" })).includes("subject_caps"));
    assert.ok(codes(lint({ subject: "Gagnez !!! vite !!!" })).includes("subject_exclamation"));
    assert.ok(codes(lint({ preheader: "" })).includes("preheader_missing"));
  });
  test("variable sans valeur par défaut : peut afficher un blanc", () => {
    assert.ok(codes(lint({ blocks: [{ type: "text", markdown: "Bonjour {{contact.first_name}}" }] })).includes("variable_no_default"));
    assert.ok(!codes(lint({ blocks: [{ type: "text", markdown: "Bonjour {{contact.first_name | default:\"ami\"}}" }] })).includes("variable_no_default"));
  });
  test("e-mail composé uniquement d'images, poids proche de la limite Gmail, adresse absente, contraste insuffisant", () => {
    assert.ok(codes(lint({ blocks: [{ type: "image", src: "https://a.b/c.png", alt: "x" }] })).includes("image_only"));
    assert.ok(codes(lint({ blocks: [{ type: "text", markdown: "a" }, { type: "text", markdown: "y".repeat(9000) }, { type: "text", markdown: "y".repeat(9000) }, { type: "text", markdown: "y".repeat(9000) }, { type: "text", markdown: "y".repeat(9000) }, { type: "text", markdown: "y".repeat(9000) }, { type: "text", markdown: "y".repeat(9000) }, { type: "text", markdown: "y".repeat(9000) }, { type: "text", markdown: "y".repeat(9000) }, { type: "text", markdown: "y".repeat(9000) }, { type: "text", markdown: "y".repeat(9000) }, { type: "text", markdown: "y".repeat(9000) }] })).includes("html_heavy"));
    const noAddress = lint({}, { ...CTX(), org: { name: "K", address: "" } });
    assert.ok(codes(noAddress).includes("address_missing"));
    assert.ok(codes(lint({ blocks: [{ type: "button", label: "x", url: "https://a.b", color: "#888888" }], theme: { accent: "#888888" } })).includes("button_contrast") === false, "le texte est choisi pour le contraste : pas d'alerte");
  });
});

describe("robustesse", () => {
  test("le rendu n'est pas contaminé d'un contact à l'autre", () => {
    const c = compileTemplate(tpl({ blocks: [{ type: "text", markdown: "Bonjour {{contact.first_name}}" }] }), { allowed: ALLOW });
    const a = renderEmail(c, CTX({ first_name: "Alice" }));
    const b = renderEmail(c, CTX({ first_name: "Bob" }));
    assert.match(a.html, /Alice/); assert.doesNotMatch(a.html, /Bob/);
    assert.match(b.html, /Bob/); assert.doesNotMatch(b.html, /Alice/);
  });
  test("5 000 rendus d'un modèle compilé : rapide", () => {
    const c = compileTemplate(tpl({ blocks: [{ type: "heading", text: "Salut {{contact.first_name}}" }, { type: "text", markdown: "Bonjour **{{contact.first_name | default:\"ami\"}}**\n\n- a\n- b" }, { type: "button", label: "Go", url: "https://ex.fr" }] }), { allowed: ALLOW });
    const ctx = CTX();
    const t = Date.now();
    for (let i = 0; i < 5000; i++) renderEmail(c, ctx);
    assert.ok(Date.now() - t < 3000, `${Date.now() - t} ms`);
  });
  test("fuzz : aucune valeur hostile dans un champ ne produit de balise ou d'attribut actif", () => {
    const hostile = ["<script>alert(1)</script>", "\"><img src=x onerror=alert(1)>", "' onmouseover='alert(1)", "javascript:alert(1)", "{{ contact.email }}", "{% if x %}", "</td></tr></table><script>x()</script>", "  "];
    for (const h of hostile) {
      const c = compileTemplate(tpl({ blocks: [{ type: "heading", text: "{{contact.first_name}}" }, { type: "text", markdown: "{{contact.first_name}}" }, { type: "button", label: "{{contact.first_name}}", url: "https://ex.fr" }, { type: "image", src: "https://a.b/c.png", alt: "{{contact.first_name}}" }] }), { allowed: ALLOW });
      const html = renderEmail(c, CTX({ first_name: h })).html;
      assert.deepEqual(violations(html), [], h);
    }
  });
});
