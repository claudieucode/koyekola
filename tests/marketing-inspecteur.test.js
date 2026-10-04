// Panneau de réglages « Contenu / Styles / Visibilité » : chaque réglage est une vraie donnée du bloc, validée par le
// serveur, rendue par LE moteur commun (canevas = aperçu = test = envoi), enregistrée et relue à l'identique.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { compileTemplate, renderEmail } = require("../src/marketing/templates/blocks");
const { startServer, loginInstructor } = require("./helpers");
const { TEST_KEY } = require("./marketing-helpers");

const ALLOW = (p) => /^(contact\.(first_name|email)|org\.(name|address)|unsubscribe_url|preferences_url|view_url)$/.test(p);
const CTX = { contact: { first_name: "Awa", email: "awa@ex.fr" }, org: { name: "KOLAKISA", address: "Paris" }, unsubscribe_url: "https://k.test/u", preferences_url: "", view_url: "" };
const build = (blocks) => { const c = compileTemplate({ kind: "marketing", subject: "S", blocks }, { allowed: ALLOW }); return { c, html: renderEmail(c, CTX).html }; };
const bad = (blocks, re) => assert.throws(() => build(blocks), re);
const mediaQuery = (html) => html.match(/<style>@media[^<]*<\/style>/)[0];

// Un bloc de chaque type, avec tous les nouveaux réglages
const FULL = [
  { id: "h", type: "heading", text: "Bonjour {{contact.first_name}}", level: 3, align: "center", href: "https://k.test/a", newTab: true, weight: "normal", italic: true, letterSpacing: 2, color: "#123456",
    box: { padTop: 4, padBottom: 6, padLeft: 10, padRight: 12, background: "#fafafa", border: { style: "dashed", width: 2, color: "#ff0000", radius: 8 } }, mobile: { fontSize: 18, align: "left", padLeft: 4 } },
  { id: "t", type: "text", html: "<p>Texte <strong>gras</strong></p>", align: "right", letterSpacing: 1, mobile: { fontSize: 14, align: "center" } },
  { id: "i", type: "image", src: "https://k.test/i.png", alt: "Photo", width: 400, align: "center", radius: 6, mobile: { width: 200, align: "left" }, box: { hideMobile: true } },
  { id: "b", type: "button", label: "Découvrir", url: "https://k.test/f", radius: 40, color: "#0277b6", borderStyle: "dotted", borderWidth: 3, borderColor: "#000000", weight: "normal", italic: true, letterSpacing: 1, size: "l", mobile: { fullWidth: true, fontSize: 14 } },
  { id: "d", type: "divider", style: "dashed", thickness: 4, width: 60, color: "#00aa00", align: "right" },
  { id: "s", type: "spacer", height: 48, mobile: { height: 12 }, box: { hideDesktop: true } },
  { id: "so", type: "social", display: "buttons", colors: "accent", align: "left", links: [{ network: "linkedin", url: "https://linkedin.com/x" }, { network: "facebook", url: "https://fb.com/x" }], mobile: { align: "center" } },
  { id: "c", type: "columns", leftHtml: "<p>G</p>", rightHtml: "<p>D</p>", ratio: "60-40", mobile: { padTop: 0 } },
];

describe("moteur commun : nouveaux réglages", () => {
  test("enregistré → relu → réenregistré : identique (aucun réglage perdu ni transformé)", () => {
    const first = build(FULL).c.normalized.blocks;
    const again = build(first).c.normalized.blocks;
    assert.deepEqual(again, first);
    const h = first.find((b) => b.id === "h");
    assert.deepEqual(h.box.border, { style: "dashed", width: 2, color: "#ff0000", radius: 8 });
    assert.deepEqual(h.mobile, { fontSize: 18, align: "left", padLeft: 4 });
    assert.equal(first.find((b) => b.id === "b").borderStyle, "dotted");
    assert.equal(first.find((b) => b.id === "so").display, "buttons");
  });

  test("ordinateur : styles en ligne (Outlook compris) — titre, bouton, ligne, bordure, marges, pastilles", () => {
    const { html } = build(FULL);
    assert.match(html, /<h3 class="mkf-h" style="margin:0;font-size:18px;line-height:1.25;font-weight:400;color:#123456;text-align:center;font-style:italic;letter-spacing:2px"><a href="https:\/\/k.test\/a" target="_blank" style="color:#123456;text-decoration:none">Bonjour Awa<\/a><\/h3>/);
    assert.match(html, /<td class="mkc-h" style="padding:4px 12px 6px 10px;[^"]*background:#fafafa;border:2px dashed #ff0000;border-radius:8px">/);
    assert.match(html, /<div class="mkf-t" style="letter-spacing:1px;text-align:right">/);
    assert.match(html, /border-radius:40px;border:3px dotted #000000"><a class="mkf-b"/);
    assert.match(html, /font-weight:400;font-style:italic;letter-spacing:1px;text-decoration:none/);
    assert.match(html, /<table role="presentation" width="60%" align="right"[^>]*><tr><td style="border-top:4px dashed #00aa00/);
    assert.match(html, /<a href="https:\/\/linkedin.com\/x" style="display:inline-block;margin:4px;padding:8px 14px;background:#0277b6;[^"]*">LinkedIn<\/a>/); // pastilles qui passent à la ligne
    assert.match(html, /<tr class="mk-hide-m"[^>]*><td class="mkc-i"/, "masqué sur mobile");
    assert.match(html, /<tr class="mk-hide-d" style="display:none;mso-hide:all/, "masqué sur ordinateur (Outlook compris)");
  });

  test("mobile : règles uniquement dans la requête média, ciblées sur le bloc ; l'ordinateur n'est jamais modifié", () => {
    const { html } = build(FULL);
    const mq = mediaQuery(html);
    for (const rule of [".mkc-h{padding-left:4px!important}", ".mkf-h{font-size:18px!important}", ".mkf-h{text-align:left!important}", ".mkw-i{width:200px!important;max-width:100%!important}",
      ".mka-b{width:100%!important}.mkf-b{display:block!important}", ".mkf-b{font-size:14px!important}", ".mkh-s{height:12px!important;line-height:12px!important}", ".mka-so{float:none!important;margin-left:auto!important;margin-right:auto!important}", ".mkc-c{padding-top:0px!important}"]) {
      assert.ok(mq.includes(rule), rule);
    }
    // En dehors de la requête média : aucune règle mobile
    assert.equal(html.replace(mq, "").includes("!important"), false);
    // Réglages ordinateur intacts (largeur de l'image, taille du bouton)
    assert.match(html, /<img class="mkw-i mka-i" src="https:\/\/k.test\/i.png" alt="Photo" width="400"/);
  });

  test("anciens modèles : HTML inchangé (aucune classe ni règle ajoutée), espacements écrits comme avant", () => {
    const { html } = build([{ id: "t1", type: "text", markdown: "Bonjour" }, { id: "d1", type: "divider" }, { id: "b1", type: "button", label: "Go", url: "https://k.test" }]);
    assert.doesNotMatch(html, /mk[cfawh]-/);
    assert.match(html, /<tr><td style="padding:8px 24px 8px;font-size:16px/);
    assert.match(html, /<table role="presentation" width="100%" align="center" cellpadding="0" cellspacing="0" style="width:100%;margin:0 auto"><tr><td style="border-top:1px solid #d5e3ee/);
    assert.match(html, /font-size:16px;font-weight:700;text-decoration:none/);
  });

  test("refus clairs : réglage mobile non applicable, valeurs hors limites, niveau de titre, bordure inconnue", () => {
    bad([{ id: "i", type: "image", src: "https://k.test/i.png", alt: "x", mobile: { fontSize: 14 } }], /non applicable/);
    bad([{ id: "t", type: "text", html: "<p>x</p>", mobile: { fontSize: 60 } }], /12 à 28/);
    bad([{ id: "h", type: "heading", text: "x", level: 4 }], /1, 2 ou 3/);
    bad([{ id: "t", type: "text", html: "<p>x</p>", box: { border: { style: "groove" } } }], /bordure inconnu/);
    bad([{ id: "b", type: "button", label: "x", url: "https://k.test", borderStyle: "solid", borderWidth: 20 }], /1 à 8/);
    bad([{ id: "h", type: "heading", text: "x", href: "javascript:alert(1)" }], /https:\/\//);
    bad([{ id: "t", type: "text", html: "<p>x</p>", box: { hideMobile: true, hideDesktop: true } }], /à la fois/);
    bad([{ id: "t", type: "text", html: "<p>x</p>", letterSpacing: 40 }], /0 à 10/);
  });
});

describe("éditeur : enregistrement, rechargement, vérification et test", () => {
  let srv, boss;
  const sql = (q, ...a) => { const db = srv.db(); const r = db.prepare(q).all(...a); db.close(); return r; };
  const editorData = (html) => JSON.parse(html.match(/<script type="application\/json" id="mk-editor-data">([\s\S]*?)<\/script>/)[1]);
  before(async () => { srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SMTP_HOST: "" }); boss = await loginInstructor(srv); });
  after(() => srv && srv.stop());

  test("tous les réglages enregistrés puis relus à l'identique dans l'éditeur ; aperçu = même rendu", async () => {
    await boss.post("/marketing/modeles", { name: "Inspecteur", starter: "blank", kind: "marketing" });
    const id = sql("SELECT id FROM mk_templates WHERE name = 'Inspecteur'")[0].id;
    const data = editorData((await boss.get(`/marketing/modeles/${id}`)).text);
    const r = await boss.postJson(`/marketing/modeles/${id}`, { template: { ...data.template, subject: "Objet", blocks: FULL }, version: data.template.version });
    assert.equal(r.status, 200, r.text);
    const reloaded = editorData((await boss.get(`/marketing/modeles/${id}`)).text).template.blocks;
    assert.deepEqual(reloaded, build(FULL).c.normalized.blocks);
    // Aperçu (canevas et fenêtre « Aperçu ») : même moteur, mêmes règles mobiles que l'envoi
    const preview = await boss.postJson("/marketing/modeles/apercu", { template: { ...data.template, subject: "Objet", blocks: reloaded } });
    assert.equal(preview.status, 200, preview.text);
    const html = JSON.parse(preview.text).html;
    assert.ok(html.includes(".mkf-b{font-size:14px!important}"));
    assert.match(html, /border:3px dotted #000000/);
  });

  test("image de la médiathèque absente du serveur : erreur dans la vérification et test refusé (message clair)", async () => {
    const id = sql("SELECT id FROM mk_templates WHERE name = 'Inspecteur'")[0].id;
    const data = editorData((await boss.get(`/marketing/modeles/${id}`)).text);
    const dir = path.join(srv.dir, "uploads", "marketing", "1");
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "present.png"), "PNG");
    const url = (f) => `${srv.base}/uploads/marketing/1/${f}`;
    const blocks = [{ id: "a", type: "image", src: url("present.png"), alt: "ok" }, { id: "b", type: "image", src: url("perdue.png"), alt: "perdue" }, { id: "t", type: "text", html: "<p>Texte</p>" }];
    const saved = await boss.postJson(`/marketing/modeles/${id}`, { template: { ...data.template, blocks }, version: data.template.version });
    assert.equal(saved.status, 200, saved.text);
    const body = JSON.parse(saved.text);
    const w = body.warnings.find((x) => x.code === "image_missing");
    assert.ok(w && w.level === "error" && /perdue\.png/.test(w.message) && !/present\.png/.test(w.message), JSON.stringify(body.warnings));
    const me = sql("SELECT email FROM users WHERE role = 'formateur'")[0].email;
    const res = await boss.post(`/marketing/modeles/${id}/test`, { to: me });
    const page = await boss.get(res.location || `/marketing/modeles/${id}`);
    assert.match(page.text, /Test non envoyé : une image n&#39;existe plus sur le serveur \(perdue\.png\)/);
  });
});
