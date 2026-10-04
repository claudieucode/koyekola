// Éditeur de campagnes « pro » : texte riche (HTML nettoyé → HTML d'e-mail), colonnes réglables, réglages communs des
// blocs (marges, fond, affichage par appareil), bouton avancé, blocs Lien et Coupon, styles globaux étendus.
// Une seule source de vérité : ces rendus sont ceux du canevas, de l'aperçu, du test et de l'envoi.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { Parser } = require("htmlparser2");
const { compileTemplate, renderEmail } = require("../src/marketing/templates/blocks");

const ALLOW = (p) => /^(contact\.(first_name|last_name|email|company)|org\.(name|address)|unsubscribe_url|preferences_url|view_url)$/.test(p);
const CTX = { contact: { first_name: "Awa", last_name: "Koffi", email: "awa@ex.fr", company: "" }, org: { name: "KOLAKISA", address: "Paris" }, unsubscribe_url: "https://k.test/u/tok", preferences_url: "https://k.test/p/tok", view_url: "" };
const build = (blocks, extra = {}) => { const c = compileTemplate({ kind: "marketing", subject: "S", blocks, ...extra }, { allowed: ALLOW }); return { c, r: renderEmail(c, CTX) }; };
const bad = (blocks, re, extra) => assert.throws(() => build(blocks, extra), re);

function danger(html) {
  const found = [];
  const p = new Parser({ onopentag(name, a) {
    if (["script", "iframe", "object", "embed", "form", "img"].includes(name) && name !== "img") found.push(name);
    for (const [k, v] of Object.entries(a)) {
      if (/^on/i.test(k)) found.push(k);
      if (["href", "src"].includes(k) && !/^(https:\/\/|mailto:|tel:)/i.test(v)) found.push(`${k}=${v}`);
      if (k === "style" && /url\(|expression\(|javascript:|position\s*:/i.test(v)) found.push("style");
    }
  } });
  p.write(html); p.end();
  return found;
}

describe("texte riche", () => {
  test("mise en forme conservée (gras, italique, souligné, barré, titres, listes, alignement, couleur, taille, retrait) en styles en ligne", () => {
    const html = '<h2>Titre</h2><p style="text-align:center">Bonjour <strong>gras</strong> <em>ita</em> <u>sous</u> <s>barré</s> <span style="color:#d1121f;background-color:#fff3a0;font-size:20px">rouge</span> x<sup>2</sup></p><ul><li>un</li></ul><ol><li>a</li></ol><p style="margin-left:40px">retrait</p><p style="text-align:justify">j</p>';
    const { c, r } = build([{ id: "t1", type: "text", html }]);
    for (const re of [/<h2 style="margin:0 0 12px;font-size:22px[^"]*">Titre<\/h2>/, /<p style="margin:0 0 16px;color:#10222f;text-align:center">/, /<strong style="font-weight:700">gras<\/strong>/, /<em style="font-style:italic">ita<\/em>/,
      /<u style="text-decoration:underline">sous<\/u>/, /<s style="text-decoration:line-through">barré<\/s>/, /<span style="color:#d1121f;background-color:#fff3a0;font-size:20px">rouge<\/span>/, /<sup>2<\/sup>/,
      /<ul style="margin:0 0 16px;padding-left:24px"><li style="margin:0 0 6px">un<\/li><\/ul>/, /<ol style/, /margin-left:40px">retrait/, /text-align:justify/]) assert.match(r.html, re);
    assert.equal(c.normalized.blocks[0].html.includes("<strong>gras</strong>"), true, "enregistré : HTML nettoyé, réédifiable");
    assert.match(r.text, /Bonjour gras ita sous barré rouge/);
  });
  test("variables : restent des variables (remplacées et échappées à l'envoi), valeur par défaut comprise ; enregistrées telles qu'écrites", () => {
    const { c, r } = build([{ id: "t1", type: "text", html: '<p>Bonjour <strong>{{contact.first_name | default:"cher(e) membre"}}</strong>, {{contact.company | default:"ami"}}</p>' }]);
    assert.match(r.html, /Bonjour <strong style="font-weight:700">Awa<\/strong>, ami/);
    assert.match(c.normalized.blocks[0].html, /\{\{contact\.first_name \| default:"cher\(e\) membre"\}\}/);
    const evil = renderEmail(c, { ...CTX, contact: { ...CTX.contact, first_name: "<img src=x onerror=alert(1)>" } });
    assert.match(evil.html, /&lt;img src=x onerror=alert\(1\)&gt;/);
    assert.deepEqual(danger(evil.html), []);
  });
  test("nettoyage : script, image, gestionnaires d'événements, javascript:, styles non autorisés retirés — jamais enregistrés", () => {
    const { c, r } = build([{ id: "t1", type: "text", html: '<p onclick="x()" style="position:fixed;color:#000000">a<script>alert(1)</script><img src=x onerror=1> <a href="javascript:alert(1)">j</a> <a href="https://ok.fr" target="_blank">ok</a><iframe src="https://e.fr"></iframe></p>' }]);
    assert.deepEqual(danger(r.html), []);
    assert.doesNotMatch(c.normalized.blocks[0].html, /script|onerror|onclick|javascript|position|iframe/i);
    assert.match(r.html, /<a href="https:\/\/ok\.fr" target="_blank" rel="noopener noreferrer"/);
  });
  test("refus clairs : texte vide, variable dans une adresse, variable inconnue, condition", () => {
    bad([{ id: "t1", type: "text", html: "<p><br></p>" }], /obligatoire/);
    bad([{ id: "t1", type: "text", html: '<p><a href="https://x.fr/{{contact.email}}">a</a></p>' }], /adresse d'un lien/);
    bad([{ id: "t1", type: "text", html: "<p>{{secret.cle}}</p>" }], /./);
    bad([{ id: "t1", type: "text", html: "<p>{% if contact.company %}x{% endif %}</p>" }], /condition/i);
    bad([{ id: "t1", type: "text", html: "<p>{{contact.first_name</p>" }], /mal fermée/);
  });
  test("liens système permis dans le texte : {{unsubscribe_url}} → vraie adresse de désinscription", () => {
    const { r } = build([{ id: "t1", type: "text", html: '<p><a href="{{unsubscribe_url}}">Se désinscrire ici</a></p>' }]);
    assert.match(r.html, /<a href="https:\/\/k\.test\/u\/tok" rel="noopener noreferrer"/);
  });
  test("typographie du bloc : police, taille, interligne, couleur (bornées)", () => {
    const { r } = build([{ id: "t1", type: "text", html: "<p>x</p>", font: "georgia" }].map(() => ({ id: "t1", type: "text", html: "<p>x</p>", font: "verdana", fontSize: 18, lineHeight: 1.8, color: "#123456" })));
    assert.match(r.html, /<div style="font-family:Verdana,Geneva,sans-serif;font-size:18px;line-height:1.8;color:#123456"><p style="margin:0 0 16px;color:#123456">x<\/p><\/div>/);
    bad([{ id: "t1", type: "text", html: "<p>x</p>", fontSize: 90 }], /taille/i);
    bad([{ id: "t1", type: "text", html: "<p>x</p>", font: "Comic" }], /police/i);
    bad([{ id: "t1", type: "text", html: "<p>x</p>", lineHeight: 9 }], /interligne/i);
  });
  test("anciens modèles en Markdown : rendu inchangé", () => {
    const { r } = build([{ id: "t1", type: "text", markdown: "Bonjour **{{contact.first_name}}**" }]);
    assert.match(r.html, /Bonjour <strong style="font-weight:700">Awa<\/strong>/);
  });
});

describe("colonnes", () => {
  test("texte riche, répartition 60/40, empilées sur mobile par défaut", () => {
    const { c, r } = build([{ id: "c1", type: "columns", leftHtml: "<p>G <strong>g</strong></p>", rightHtml: "<p>D</p>", ratio: "60-40" }]);
    assert.match(r.html, /<td class="mk-col" width="60%" valign="top" style="width:60%;[^"]*"><p[^>]*>G <strong/);
    assert.match(r.html, /<td class="mk-col" width="40%"/);
    assert.equal(c.normalized.blocks[0].ratio, "60-40");
  });
  test("non empilées : côte à côte même sur mobile ; inversées : colonne de droite d'abord sur mobile (dir=rtl)", () => {
    assert.doesNotMatch(build([{ id: "c1", type: "columns", leftHtml: "<p>G</p>", rightHtml: "<p>D</p>", stack: false }]).r.html, /class="mk-col"/);
    const { r } = build([{ id: "c1", type: "columns", leftHtml: "<p>G</p>", rightHtml: "<p>D</p>", reverse: true, ratio: "70-30" }]);
    assert.match(r.html, /<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="table-layout:fixed" dir="rtl"><tr><td class="mk-col" width="30%" valign="top" dir="ltr"[^>]*><p[^>]*>D<\/p><\/td><td class="mk-col" width="70%" valign="top" dir="ltr"[^>]*><p[^>]*>G/);
    bad([{ id: "c1", type: "columns", leftHtml: "<p>G</p>", rightHtml: "<p>D</p>", ratio: "90-10" }], /répartition/i);
  });
});

describe("réglages communs des blocs", () => {
  test("marges haut/bas, fond, masqué sur mobile / sur ordinateur (règles mobiles dans l'en-tête)", () => {
    const { c, r } = build([{ id: "a", type: "heading", text: "A", box: { padTop: 32, padBottom: 0, background: "#fff3a0", hideMobile: true } }, { id: "b", type: "heading", text: "B", box: { hideDesktop: true } }]);
    assert.match(r.html, /<tr class="mk-hide-m"><td style="padding:32px 24px 0px;[^"]*;background:#fff3a0">/);
    assert.match(r.html, /<tr class="mk-hide-d" style="display:none;mso-hide:all;max-height:0;overflow:hidden">/);
    assert.match(r.html, /\.mk-hide-m\{display:none!important\}\.mk-hide-d\{display:table-row!important/);
    assert.deepEqual(c.normalized.blocks[0].box, { padTop: 32, padBottom: 0, background: "#fff3a0", hideMobile: true });
    bad([{ id: "a", type: "heading", text: "A", box: { padTop: 500 } }], /marge/i);
    bad([{ id: "a", type: "heading", text: "A", box: { background: "url(x)" } }], /couleur/i);
    bad([{ id: "a", type: "heading", text: "A", box: { hideMobile: true, hideDesktop: true } }], /à la fois/);
  });
  test("styles globaux : largeur maximale, espacement général, couleur secondaire (séparateur)", () => {
    const { r } = build([{ id: "d", type: "divider" }], { theme: { maxWidth: 680, spacing: "large", secondary: "#aabbcc" } });
    assert.match(r.html, /class="mk-container" width="680"[^>]*style="width:680px/);
    assert.match(r.html, /max-width:704px/); // bascule mobile = largeur du message + marges extérieures (2 × 12 px)
    assert.match(r.html, /padding:16px 24px 16px/);
    assert.match(r.html, /border-top:1px solid #aabbcc/);
  });
});

describe("bouton, image, lien, coupon", () => {
  test("bouton : couleur du texte, taille, arrondi, pleine largeur, nouvel onglet ; arrondi par défaut = styles globaux", () => {
    const { c, r } = build([{ id: "b", type: "button", label: "Go", url: "https://ex.fr", color: "#111111", textColor: "#ffffff", fontSize: 20, radius: 20, size: "l", fullWidth: true, newTab: true }]);
    assert.match(r.html, /width="100%"[^>]*><tr><td align="center" style="background:#111111;border-radius:20px"><a href="https:\/\/ex\.fr" target="_blank" style="display:block;padding:16px 32px;font-size:20px;font-weight:700;text-decoration:none;color:#ffffff;border-radius:20px">Go<\/a>/);
    assert.equal(c.normalized.blocks[0].size, "l");
    assert.match(build([{ id: "b", type: "button", label: "Go", url: "https://ex.fr" }], { theme: { radius: 12 } }).r.html, /border-radius:12px/);
    bad([{ id: "b", type: "button", label: "Go", url: "https://ex.fr", size: "xxl" }], /taille de bouton/i);
    bad([{ id: "b", type: "button", label: "Go", url: "https://ex.fr", textColor: "white" }], /couleur/i);
  });
  test("image : arrondi, lien dans un nouvel onglet", () => {
    const { r } = build([{ id: "i", type: "image", src: "https://ex.fr/a.png", alt: "A", radius: 12, href: "https://ex.fr", newTab: true }]);
    assert.match(r.html, /<a href="https:\/\/ex\.fr" target="_blank"[^>]*><img src="https:\/\/ex\.fr\/a\.png" alt="A"[^>]*border-radius:12px;/);
  });
  test("bloc Lien : texte + adresse (https ou mailto), alignement ; variable dans l'adresse refusée", () => {
    const { r } = build([{ id: "l", type: "link", label: "Voir {{contact.first_name}}", url: "mailto:contact@ex.fr", align: "center" }]);
    assert.match(r.html, /<p style="margin:0;text-align:center"><a href="mailto:contact@ex\.fr"[^>]*>Voir Awa<\/a><\/p>/);
    bad([{ id: "l", type: "link", label: "X", url: "https://ex.fr/{{contact.email}}" }], /adresse/i);
    bad([{ id: "l", type: "link", label: "", url: "https://ex.fr" }], /obligatoire/);
  });
  test("bloc Coupon : code (obligatoire), titre, conditions, couleur", () => {
    const { c, r } = build([{ id: "k", type: "coupon", code: "RENTREE20", title: "-20 % sur tout", details: "Valable jusqu'au 30/09.", color: "#1e7a34" }]);
    assert.match(r.html, /border:2px dashed #1e7a34[^>]*>.*-20 % sur tout.*RENTREE20.*Valable jusqu&#39;au 30\/09\./s);
    assert.match(r.text, /RENTREE20/);
    assert.equal(c.normalized.blocks[0].code, "RENTREE20");
    bad([{ id: "k", type: "coupon", code: " " }], /obligatoire/);
  });
});
