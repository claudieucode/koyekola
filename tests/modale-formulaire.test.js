// Fenêtre (modale) avec formulaire d'inscription : validation, publication contrôlée, rendu public, envoi (consentement, erreur, remerciement), contact réel créé.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor, Client } = require("./helpers");

describe("modale avec formulaire", () => {
  let srv, boss, db, formId, draftId, pageId, slug;
  const put = (id, content) => boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", json: { revision: db.prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(id).revision, content } });
  const page = (children) => ({ title: "Page modale", sections: [{ id: "sect00000001", type: "layout", children: [{ id: "cont00000001", type: "container", children }] }] });
  const modal = (props) => ({ id: "mod000000001", type: "modal", props: { buttonLabel: "S'abonner", title: "La lettre", text: "Recevez nos nouvelles.", ...props } });
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db();
    formId = Number((await boss.post("/marketing/formulaires", { name: "Lettre modale", consentText: "J'accepte la lettre." })).location.match(/(\d+)$/)[1]);
    db.prepare("UPDATE mk_forms SET double_optin = 0, thank_you_text = 'Merci, c''est noté !' WHERE id = ?").run(formId);
    await boss.post(`/marketing/formulaires/${formId}/publier`, {});
    draftId = Number((await boss.post("/marketing/formulaires", { name: "Brouillon modale", consentText: "J'accepte." })).location.match(/(\d+)$/)[1]);
    pageId = Number((await boss.post("/marketing/pages", { name: "Page modale" })).location.match(/(\d+)$/)[1]);
    slug = db.prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(pageId).slug;
  });
  after(() => srv.stop());

  test("un formulaire inexistant est refusé ; sans formulaire la fenêtre reste comme avant ; un formulaire non publié bloque la publication", async () => {
    assert.equal((await put(pageId, page([modal({ formId: 99999 })]))).status, 422);
    assert.equal((await put(pageId, page([modal({})]))).status, 200);
    assert.equal((await boss.request(`/marketing/pages/${pageId}/publier.json`, { method: "POST", json: {} })).status, 200);
    assert.doesNotMatch((await new Client(srv.base).get(`/p/${slug}`)).text, /kw-modal-form/);
    assert.equal((await put(pageId, page([modal({ formId: draftId })]))).status, 200);
    const pub = await boss.request(`/marketing/pages/${pageId}/publier.json`, { method: "POST", json: {} });
    assert.equal(pub.status, 422); assert.match(pub.text, /n'est pas publié/);
  });

  test("page publiée : le formulaire est dans la fenêtre ; consentement manquant = erreur + fenêtre rouverte ; envoi réussi = remerciement et contact créé", async () => {
    assert.equal((await put(pageId, page([modal({ formId, formButton: "Je m'abonne" })]))).status, 200);
    assert.equal((await boss.request(`/marketing/pages/${pageId}/publier.json`, { method: "POST", json: {} })).status, 200);
    const visitor = new Client(srv.base);
    const html = (await visitor.get(`/p/${slug}`)).text;
    const dlg = html.slice(html.indexOf('<dialog'), html.indexOf("</dialog>"));
    assert.match(dlg, /class="kw-signup kw-modal-form" id="kw-f-mod000000001"/);
    assert.match(dlg, /<input type="hidden" name="w" value="mod000000001">/);
    assert.match(dlg, />Je m&#39;abonne<\/button>/);
    assert.doesNotMatch(dlg, /data-kw-open-now/, "fenêtre fermée au premier affichage");
    const miss = await visitor.post(`/p/${slug}/inscription`, { w: "mod000000001", ft: srv.formToken(), email: "kofi@ex.fr" });
    assert.equal(miss.status, 400);
    assert.match(miss.text, /data-kw-open-now/); assert.match(miss.text, /role="alert">Cochez la case/);
    const ok = await visitor.post(`/p/${slug}/inscription`, { w: "mod000000001", ft: srv.formToken(), email: "kofi@ex.fr", consent: "1" });
    assert.equal(ok.status, 302); assert.match(ok.location, /w=mod000000001/);
    const back = (await visitor.get(ok.location.replace(/#.*/, ""))).text;
    assert.match(back, /data-kw-open-now/); assert.match(back, /role="status">Merci, c&#39;est noté !/);
    assert.ok(db.prepare("SELECT id FROM mk_contacts WHERE email = 'kofi@ex.fr'").get(), "contact créé");
  });
});
