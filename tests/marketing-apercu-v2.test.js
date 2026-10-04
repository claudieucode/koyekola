// Aperçu V2 : HTML d'e-mail réellement responsive (moteur commun), analyse du rendu (liens, taille, balises de fusion,
// préheader), aperçu tolérant aux blocs incomplets, envoi de test en JSON, affichage dans le navigateur.
// Le rendu aux différentes largeurs est vérifié dans un vrai navigateur (protocole pv1.js : 9 largeurs, 0 débordement).
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { compileTemplate, renderEmail } = require("../src/marketing/templates/blocks");
const inspect = require("../src/marketing/templates/inspect");
const { startServer, loginInstructor } = require("./helpers");
const { TEST_KEY } = require("./marketing-helpers");

const ALLOW = (p) => /^(contact\.(first_name|company|email)|org\.(name|address)|unsubscribe_url|preferences_url|view_url)$/.test(p);
const CTX = { contact: { first_name: "Awa", company: "", email: "awa@ex.fr" }, org: { name: "K", address: "" }, unsubscribe_url: "https://exemple.invalid/desinscription", preferences_url: "", view_url: "" };
const render = (blocks, extra = {}) => renderEmail(compileTemplate({ kind: "marketing", subject: "S", blocks, ...extra }, { allowed: ALLOW }), CTX).html;
const LONG = "x".repeat(300);

describe("HTML responsive (moteur commun : canevas, aperçu, test, envoi)", () => {
  test("le message ne peut pas s'élargir : colonnes fixes, mots et adresses longs coupés", () => {
    const html = render([{ id: "t", type: "text", html: `<p>${LONG}</p>` }, { id: "c", type: "columns", leftHtml: `<p>${LONG}</p>`, rightHtml: "<p>b</p>", ratio: "70-30" }]);
    assert.match(html, /class="mk-container"[^>]*style="width:600px;max-width:100%;table-layout:fixed;overflow-wrap:anywhere;word-wrap:break-word;word-break:break-word;/);
    assert.match(html, /<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="table-layout:fixed"><tr><td class="mk-col" width="70%"/);
  });
  test("bascule mobile = largeur du message + marges extérieures (aucune zone où il déborde de 1 à 24 px)", () => {
    assert.match(render([]), /@media only screen and \(max-width:624px\)/);
    assert.match(render([], { theme: { maxWidth: 520 } }), /@media only screen and \(max-width:544px\)/);
  });
  test("bouton jamais plus large que l'écran ; pastilles des réseaux qui passent à la ligne", () => {
    const html = render([{ id: "b", type: "button", label: "Libellé très long", url: "https://k.test" }, { id: "s", type: "social", display: "buttons", links: [{ network: "facebook", url: "https://fb.com/k" }, { network: "x", url: "https://x.com/k" }] }]);
    assert.match(html, /<table role="presentation" align="center" cellpadding="0" cellspacing="0" style="margin:0 auto;max-width:100%">/);
    assert.match(html, /<div style="font-size:0;line-height:0;text-align:center"><a href="https:\/\/fb.com\/k" style="display:inline-block;margin:4px;/);
  });
  test("aperçu tolérant : bloc incomplet montré à sa place (sans marques d'édition), le reste rendu normalement", () => {
    const c = compileTemplate({ kind: "marketing", subject: "S", blocks: [{ id: "i", type: "image", src: "", alt: "x" }, { id: "t", type: "text", html: "<p>Suite</p>" }] }, { allowed: ALLOW, tolerant: true });
    const html = renderEmail(c, CTX).html;
    assert.equal(c.meta.blockErrors.length, 1);
    assert.match(html, /<tr data-mk-error="true">/);
    assert.doesNotMatch(html, /data-mk-block/);
    assert.match(html, /Suite/);
    assert.throws(() => compileTemplate({ kind: "marketing", subject: "S", blocks: [{ id: "i", type: "image", src: "", alt: "x" }] }, { allowed: ALLOW }), /Bloc 1/); // envoi : strict
  });
});

describe("analyse du rendu", () => {
  test("liens : valides, système, exemple, http, ancre, vide, absent, dangereux, mailto invalide", () => {
    const html = '<a href="https://kolakisa.com/a">ok</a><a href="https://exemple.invalid/desinscription">Se désinscrire</a><a href="https://exemple.fr/x">ex</a><a href="http://site.fr">http</a>'
      + '<a href="#haut">ancre</a><a href="">vide</a><a>sans</a><a href="javascript:alert(1)">js</a><a href="mailto:nope">m</a><a href="mailto:a@b.fr">mail</a><a href="https://intranet">dom</a>';
    const r = inspect.analyzeLinks(html).map((l) => `${l.text}:${l.status}`);
    assert.deepEqual(r, ["ok:ok", "Se désinscrire:ok", "ex:warning", "http:warning", "ancre:warning", "vide:error", "sans:error", "js:error", "m:error", "mail:ok", "dom:error"]);
  });
  test("taille réelle du HTML (octets UTF-8) et niveau", () => {
    const s = inspect.sizeInfo("é".repeat(1000));
    assert.equal(s.bytes, 2000);
    assert.equal(s.limitKb, 102);
    assert.equal(s.level, "low");
    assert.equal(inspect.sizeInfo("a".repeat(95000)).level, "high");
  });
  test("balises de fusion : valeur réelle, vide signalé, liens système non signalés ; préheader réel", () => {
    const tags = inspect.mergeTags(["contact.first_name", "contact.company", "unsubscribe_url"], CTX);
    assert.deepEqual(tags.map((t) => [t.path, t.empty]), [["contact.company", true], ["contact.first_name", false], ["unsubscribe_url", false]]);
    assert.equal(tags.find((t) => t.path === "contact.first_name").value, "Awa");
    const html = render([{ id: "t", type: "text", html: "<p>x</p>" }], { preheader: "Bonjour {{contact.first_name}} & bienvenue" });
    assert.equal(inspect.preheaderOf(html), "Bonjour Awa & bienvenue");
  });
});

describe("routes de l'aperçu", () => {
  let srv, boss, id;
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SMTP_HOST: "", SMTP_FROM: "KOLAKISA <envoi@k.test>" });
    boss = await loginInstructor(srv);
    id = Number((await boss.post("/marketing/modeles", { name: "Aperçu", starter: "blank", kind: "marketing" })).location.match(/(\d+)$/)[1]);
  });
  after(() => srv && srv.stop());
  test("mode aperçu : rendu + informations et vérifications calculées sur le vrai HTML", async () => {
    const template = { kind: "marketing", subject: "Bonjour {{contact.first_name}}", preheader: "Texte d'aperçu", blocks: [{ id: "t", type: "text", html: '<p><a href="https://exemple.fr">lien</a> {{contact.company}}</p>' }, { id: "i", type: "image", src: "", alt: "x" }] };
    const r = await boss.postJson("/marketing/modeles/apercu", { template, mode: "preview" });
    assert.equal(r.status, 200, r.text);
    const j = JSON.parse(r.text);
    assert.equal(j.subject, "Bonjour Awa");
    assert.equal(j.preheader, "Texte d'aperçu");
    assert.deepEqual(j.recipient, { email: "awa@exemple.fr", name: "Awa Koffi", sample: true });
    assert.equal(j.sender.address, "KOLAKISA <envoi@k.test>");
    assert.equal(j.size.bytes, Buffer.byteLength(j.html));
    assert.ok(j.links.some((l) => l.text === "lien" && l.status === "warning"));
    assert.ok(j.mergeTags.some((t) => t.path === "contact.company"));
    assert.equal(j.blockErrors.length, 1, "bloc incomplet signalé, aperçu tout de même rendu");
    assert.doesNotMatch(j.html, /data-mk-block/);
  });
  test("envoi de test depuis l'aperçu : réponse JSON (erreur claire sans service d'envoi)", async () => {
    const me = (() => { const db = srv.db(); const r = db.prepare("SELECT email FROM users WHERE role = 'formateur'").get(); db.close(); return r.email; })();
    const r = await boss.request(`/marketing/modeles/${id}/test`, { method: "POST", headers: { Accept: "application/json" }, json: { to: me } });
    const j = JSON.parse(r.text);
    assert.equal(j.ok, false);
    assert.match(j.message, /Aucun service d'envoi configuré/);
    const bad = await boss.request(`/marketing/modeles/${id}/test`, { method: "POST", headers: { Accept: "application/json" }, json: { to: "inconnu@dehors.fr" } });
    assert.equal(bad.status, 400);
    assert.match(JSON.parse(bad.text).message, /membre de l'équipe/);
  });
  test("afficher dans le navigateur : HTML final isolé (aucun script), images du site autorisées", async () => {
    const r = await boss.get(`/marketing/modeles/${id}/apercu`);
    assert.equal(r.status, 200);
    assert.match(r.headers.get("content-security-policy"), /default-src 'none'; img-src 'self' https: data:/);
    assert.match(r.text, /class="mk-container"/);
  });
});
