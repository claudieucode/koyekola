// Widget « Boutons de partage » (Réseaux sociaux) : validation des réseaux, vrais liens de partage vers l'adresse publique de la
// page (construits par le serveur, encodés), rien d'affiché sur la page publiée si l'adresse du site n'est pas en https.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY, freshMarketing } = require("./marketing-helpers");
const pages = require("../src/marketing/pages");
const nodes = require("../src/marketing/pages/nodes");
const { startServer, loginInstructor } = require("./helpers");

const section = (props) => [{ id: "sect00000001", type: "layout", children: [{ id: "shar00000001", type: "sharebuttons", props }] }];

describe("boutons de partage (sans serveur)", () => {
  test("fiche de bibliothèque : catégorie Réseaux sociaux, mots de recherche, contenu de départ valide", () => {
    const spec = nodes.editorSpec();
    const t = spec.types.find((x) => x.type === "sharebuttons");
    assert.equal(t.group, "social");
    assert.equal(spec.widgetGroups.social, "Réseaux sociaux");
    assert.ok(/partager/.test(t.keywords));
    assert.deepEqual(spec.shareNetworks.map((n) => n[0]), ["facebook", "x", "linkedin", "whatsapp", "telegram", "pinterest", "reddit", "threads", "email"]);
    const { A } = freshMarketing();
    const p = pages.createPage(A, { name: "Partage", kind: "page" });
    const out = pages.saveDraft(A, p.id, { sections: section(t.blank.props) }, { revision: p.revision }).content.sections[0].children[0];
    assert.deepEqual(out.props.networks, ["facebook", "x", "linkedin", "whatsapp"]);
  });

  test("réseaux validés (sans doublon, 6 au plus, au moins un), taille et forme par défaut", () => {
    const { A } = freshMarketing();
    const p = pages.createPage(A, { name: "Validation", kind: "page" });
    const save = (props) => pages.saveDraft(A, p.id, { sections: section(props) }, { revision: pages.getPage(A, p.id).revision }).content.sections[0].children[0].props;
    const out = save({ networks: ["x", "x", "facebook", "tiktok", "email", "inconnu"], size: "99", shape: "triangle" });
    assert.deepEqual(out.networks, ["x", "facebook", "email"], "doublons et réseaux inconnus retirés");
    assert.deepEqual([out.size, out.shape, out.label], ["32", "circle", "Partager cette page"]);
    assert.throws(() => save({ networks: [] }), /au moins un réseau/);
    assert.throws(() => save({ networks: ["tiktok"] }), /au moins un réseau/, "tiktok n'est pas un réseau de partage");
    assert.deepEqual(save({ networks: ["whatsapp"], size: "48", shape: "plain", label: "Diffuser", message: "À lire !" }), { networks: ["whatsapp"], size: "48", shape: "plain", label: "Diffuser", message: "À lire !" });
  });
});

describe("boutons de partage (page publiée, vrai serveur)", () => {
  let https, http, bossS, bossH;
  const make = async (srv, boss, title) => {
    const db = srv.db();
    const id = Number((await boss.post("/marketing/pages", { name: title })).location.match(/(\d+)$/)[1]);
    const rev = Number(db.prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(id).revision);
    const put = await boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", json: { revision: rev, content: { title: "Mon titre & co", sections: section({ networks: ["facebook", "x", "linkedin", "whatsapp", "email"], message: "À lire : \"super\" <page>" }) } } });
    assert.equal(put.status, 200, put.text.slice(0, 160));
    assert.equal((await boss.request(`/marketing/pages/${id}/publier.json`, { method: "POST", json: {} })).status, 200);
    return db.prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(id).slug;
  };
  before(async () => {
    https = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    http = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "", SMTP_HOST: "" });
    bossS = await loginInstructor(https); bossH = await loginInstructor(http);
  });
  after(async () => { await https.stop(); await http.stop(); });

  test("liens de partage réels vers la page publiée : encodés, ouverts dans un nouvel onglet, e-mail sans onglet", async () => {
    const slug = await make(https, bossS, "Partage public");
    const html = (await bossS.get(`/p/${slug}`)).text;
    const url = encodeURIComponent(`https://k.test/p/${slug}`);
    const text = encodeURIComponent('À lire : "super" <page>');
    assert.match(html, new RegExp(`href="https://www\\.facebook\\.com/sharer/sharer\\.php\\?u=${url}" target="_blank" rel="noopener noreferrer" aria-label="Partager sur Facebook"`));
    assert.ok(html.includes(`href="https://x.com/intent/post?url=${url}&amp;text=${text}"`), "X : adresse et texte encodés");
    assert.ok(html.includes(`href="https://www.linkedin.com/sharing/share-offsite/?url=${url}"`));
    assert.ok(html.includes(`href="https://wa.me/?text=${encodeURIComponent('À lire : "super" <page> https://k.test/p/' + slug)}"`));
    assert.ok(html.includes(`href="mailto:?subject=${text}&amp;body=${url}"`));
    assert.doesNotMatch(html.split("kw-sharebuttons")[1].split("</ul>")[0], /mailto:[^"]*" target=/, "pas d'onglet pour l'e-mail");
    assert.doesNotMatch(html, /<page>|"super"/, "texte saisi jamais injecté tel quel");
    assert.match(html, /<ul class="kw-node kw-sharebuttons kw-n-shar00000001 kw-social kw-social-circle" aria-label="Partager cette page"/);
  });

  test("adresse du site absente ou non https : aucun lien de partage sur la page publiée (jamais un lien vers localhost)", async () => {
    const slug = await make(http, bossH, "Partage local");
    const html = (await bossH.get(`/p/${slug}`)).text;
    assert.doesNotMatch(html, /sharebuttons|sharer\.php|intent\/post|wa\.me/);
  });

  test("dans l'éditeur : les boutons sont dessinés (liens inertes) même sans adresse publique", async () => {
    const id = Number((await bossH.post("/marketing/pages", { name: "Partage éditeur" })).location.match(/(\d+)$/)[1]);
    const r = await bossH.request(`/marketing/pages/${id}/rendu`, { method: "POST", json: { content: { sections: section({ networks: ["facebook", "email"] }) } } });
    assert.equal(r.status, 200);
    assert.equal((r.text.match(/class="kw-social-link" href="#"/g) || []).length, 2);
  });
});
