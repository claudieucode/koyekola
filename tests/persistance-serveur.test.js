// Persistance côté serveur (vrai serveur, sans navigateur) : révisions et concurrence, publication, versions, restauration, historique.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");

describe("persistance côté serveur : révisions, publication, versions", () => {
  let srv, boss, db, id;
  const row = () => db.prepare("SELECT * FROM mk_landing_pages WHERE id = ?").get(id);
  const doc = (t, extra = {}) => ({ title: "Persistance", sections: [{ id: "sect00000001", type: "layout", children: [{ id: "hed000000001", type: "heading", props: { text: t, level: "2" }, ...extra }] }] });
  const put = (t, revision = row().revision, extra) => boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", headers: { Origin: srv.base }, json: { revision, content: doc(t, extra) } });
  const publish = () => boss.request(`/marketing/pages/${id}/publier.json`, { method: "POST", json: {} });
  const versions = () => db.prepare("SELECT number FROM mk_page_versions WHERE page_id = ? ORDER BY number").all(id).map((v) => v.number);
  const draftText = () => JSON.parse(row().draft).sections[0].children[0].props.text;
  const revisionsOf = () => db.prepare("SELECT COUNT(*) n FROM cms_revisions WHERE content_type = 'page' AND content_id = ?").get(id).n;

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db();
    id = Number((await boss.post("/marketing/pages", { name: "Persistance serveur" })).location.match(/(\d+)$/)[1]);
  });
  after(() => srv.stop());

  test("révision périmée : 409 et rien n'est écrasé ; deux enregistrements simultanés avec la même révision : un seul gagne", async () => {
    assert.equal((await put("Départ")).status, 200);
    const rev = row().revision;
    const [a, b] = await Promise.all([put("Onglet A", rev), put("Onglet B", rev)]);
    assert.deepEqual([a.status, b.status].sort(), [200, 409], "exactement un gagnant");
    const winner = a.status === 200 ? "Onglet A" : "Onglet B";
    assert.equal(draftText(), winner);
    const stale = await put("Périmé", rev);
    assert.equal(stale.status, 409); assert.match(stale.text, /conflict|modifi/i);
    assert.equal(draftText(), winner, "le brouillon n'a pas bougé");
  });

  test("publication : une version par contenu publié ; republier SANS changement n'en fabrique pas de copie ; republier après dépublication non plus", async () => {
    assert.equal((await put("Version un")).status, 200);
    assert.equal((await publish()).status, 200);
    assert.deepEqual(versions(), [1]);
    assert.equal((await publish()).status, 200, "republier est accepté");
    assert.equal((await publish()).status, 200);
    assert.deepEqual(versions(), [1], "aucune copie identique (l'historique borné n'est pas pollué)");
    assert.equal((await boss.request(`/marketing/pages/${id}/depublier.json`, { method: "POST", json: {} })).status, 200);
    assert.equal(row().status, "unpublished");
    assert.equal((await publish()).status, 200);
    assert.equal(row().status, "published", "remise en ligne");
    assert.deepEqual(versions(), [1], "contenu identique : pas de nouvelle version");
    assert.equal((await put("Version deux")).status, 200);
    assert.equal((await publish()).status, 200);
    assert.deepEqual(versions(), [1, 2], "un vrai changement crée la version suivante");
    assert.equal(JSON.parse(row().sections)[0].children[0].props.text, "Version deux", "la page publiée est le brouillon enregistré");
    assert.equal(row().draft, null, "plus de brouillon en attente");
  });

  test("restaurer une version : copiée dans le brouillon, la page en ligne ne change pas, l'ancien brouillon est gardé dans l'historique ; version inconnue refusée", async () => {
    assert.equal((await put("Brouillon à ne pas perdre")).status, 200);
    const before = revisionsOf(), revBefore = row().revision;
    const r = await boss.request(`/marketing/pages/${id}/versions/1/restaurer`, { method: "POST", json: {} });
    assert.ok([200, 302].includes(r.status), String(r.status));
    assert.equal(draftText(), "Version un", "le brouillon est la version 1");
    assert.equal(JSON.parse(row().sections)[0].children[0].props.text, "Version deux", "la page en ligne n'a pas changé");
    assert.ok(row().revision > revBefore, "la révision avance : un éditeur ouvert sera averti par un conflit");
    assert.ok(revisionsOf() > before, "l'état précédent du brouillon est conservé dans l'historique");
    assert.equal((await put("Éditeur resté ouvert", revBefore)).status, 409, "un éditeur ouvert avant la restauration ne l'écrase pas");
    const ghost = await boss.request(`/marketing/pages/${id}/versions/99/restaurer`, { method: "POST", json: {} });
    assert.notEqual(ghost.status, 500);
    assert.equal(draftText(), "Version un", "une version inconnue ne change rien");
  });

  test("un enregistrement refusé par la validation ne modifie rien (ni brouillon, ni révision)", async () => {
    const rev = row().revision, d = row().draft;
    const bad = await boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", headers: { Origin: srv.base }, json: { revision: rev, content: doc("x", { styles: { desktop: { fontSize: "abc" } } }) } });
    assert.equal(bad.status, 422);
    assert.equal(row().revision, rev); assert.equal(row().draft, d);
  });

  test("aller-retour : relire le brouillon et le réenregistrer ne change rien ; styles, classes et références du site conservés", async () => {
    const rich = { classes: "carte", styles: { desktop: { color: "token:primary", fontSize: "20px" }, tablet: { fontSize: "16px" } } };
    assert.equal((await put("Riche", row().revision, rich)).status, 200);
    const first = JSON.parse(row().draft);
    const again = await boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", headers: { Origin: srv.base }, json: { revision: row().revision, content: first } });
    assert.equal(again.status, 200);
    assert.deepEqual(JSON.parse(row().draft), first, "document identique");
    const n = first.sections[0].children[0];
    assert.equal(n.classes, "carte"); assert.equal(n.styles.desktop.color, "token:primary"); assert.equal(n.styles.tablet.fontSize, "16px");
  });
});
