// Conformité des widgets (contrat commun) : TOUS les éléments créables à vide de la bibliothèque doivent pouvoir être ajoutés, validés, enregistrés,
// rechargés à l'identique, rendus dans l'aperçu et sur la page publiée, dans un budget de rendu. Un futur widget est couvert automatiquement : il n'y a
// rien à déclarer. Un widget qui échoue est nommé dans le message d'erreur.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const nodes = require("../src/marketing/pages/nodes");
const { startServer, Client, loginInstructor } = require("./helpers");

const creatable = Object.keys(nodes.NODE_TYPES).filter((t) => nodes.PALETTE[t] && !nodes.PALETTE[t].asks);
const SILENT_BY_DESIGN = ["toc"];
const idOf = (i) => `wg${String(i).padStart(10, "0")}`;
const build = (types) => {
  let n = 0;
  const make = (t) => { const b = nodes.PALETTE[t].blank(); const id = idOf(++n); const node = { id, type: t, ...(b.props ? { props: JSON.parse(JSON.stringify(b.props)) } : {}), ...(b.v ? { v: b.v } : {}) }; if (b.children) node.children = JSON.parse(JSON.stringify(b.children)).map(function fix(c) { return { ...c, id: idOf(++n), children: c.children && c.children.map(fix) }; }); return node; };
  // « menu » lit désormais un menu du CMS (source « location ») et n'affiche rien tant qu'aucun menu n'est affecté : le contrat s'éprouve avec une liste manuelle (même choix que tests/widgets-helpers.js)
  const list = types.map(make).map((x) => (x.type === "menu" ? { ...x, props: { ...(x.props || {}), source: "manual", items: [{ label: "Programme", url: "/catalogue" }, { label: "Blog", url: "/blog" }] } } : x));
  return { sections: [{ id: "sect00000001", type: "layout", children: [{ id: "cont00000001", type: "container", children: list }] }], ids: list.map((x) => [x.id, x.type]) };
};

describe("contrat des widgets (statique)", () => {
  test("chaque type a une fiche de bibliothèque (catégorie, mots de recherche), un libellé et une icône ; les widgets personnalisés ont version et champs", () => {
    const spec = nodes.editorSpec();
    for (const t of spec.types) {
      assert.ok(t.label && t.group && spec.widgetGroups[t.group], `${t.type} : fiche de bibliothèque`);
      assert.ok(typeof t.keywords === "string", `${t.type} : mots de recherche`);
      assert.ok(t.icon, `${t.type} : icône`);
    }
    for (const [type, def] of Object.entries(nodes.CUSTOM_WIDGETS)) { assert.ok(def.version >= 1, type); assert.ok(def.schema.length, type); }
    assert.ok(creatable.length >= 60, `${creatable.length} widgets créables à vide`);
  });
});

describe("conformité des widgets (vrai serveur)", () => {
  let srv, boss, db;
  before(async () => { srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" }); boss = await loginInstructor(srv); db = srv.db(); });
  after(() => srv.stop());
  const newPage = async (name) => Number((await boss.post("/marketing/pages", { name })).location.match(/(\d+)$/)[1]);
  const put = (id, content) => boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", json: { revision: db.prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(id).revision, content }, headers: { Origin: srv.base } });

  test("chaque widget créable : validé, enregistré, rechargé identique, rendu (aperçu et page publiée) ; le coût de rendu reste dans le budget", async () => {
    const id = await newPage("Conformité");
    // 1. un par un d'abord : un échec désigne le widget en cause
    for (const t of creatable) {
      const one = build([t]);
      const r = await put(id, { sections: one.sections });
      assert.equal(r.status, 200, `widget « ${t} » refusé à l'enregistrement : ${r.text.slice(0, 160)}`);
    }
    // 2. tous ensemble : enregistrement, relecture, idempotence
    const all = build(creatable);
    const r = await put(id, { sections: all.sections });
    assert.equal(r.status, 200, r.text.slice(0, 200));
    const saved = JSON.parse(db.prepare("SELECT draft FROM mk_landing_pages WHERE id = ?").get(id).draft);
    const kids = saved.sections[0].children[0].children;
    assert.deepEqual(kids.map((k) => k.type), creatable, "ordre et types conservés");
    const r2 = await put(id, saved);
    assert.equal(r2.status, 200, "le brouillon relu est de nouveau accepté tel quel : " + r2.text.slice(0, 160));
    assert.deepEqual(JSON.parse(db.prepare("SELECT draft FROM mk_landing_pages WHERE id = ?").get(id).draft), saved, "enregistrer deux fois ne change rien (idempotent)");
    // 3. aperçu : rendu, et coût (cache de gabarits actif : quelques centaines de ms même pour tous les widgets)
    const times = [];
    let html = "";
    for (let i = 0; i < 4; i++) { const t0 = Date.now(); const p = await boss.request(`/marketing/pages/${id}/rendu`, { method: "POST", json: { content: saved }, headers: { Origin: srv.base } }); times.push(Date.now() - t0); assert.equal(p.status, 200, p.text.slice(0, 160)); html = p.text; }
    times.sort((a, b) => a - b);
    assert.ok(times[1] < 1500, `rendu de ${creatable.length} widgets : ${times.join(" / ")} ms`);
    // chaque widget laisse sa classe d'élément dans la page (sauf ceux qui n'affichent rien hors contexte : données propres au visiteur ou à un article)
    const contextual = new Set([...Object.keys(nodes.CUSTOM_WIDGETS).filter((t) => nodes.CUSTOM_WIDGETS[t].data), "postcontent"]); // « contenu de l'article » : rien à afficher hors d'un modèle d'article
    const missing = all.ids.filter(([i, t]) => !contextual.has(t) && !html.includes(`kw-n-${i}`)).map(([, t]) => t);
    assert.deepEqual(missing, [], `widgets sans rendu : ${missing.join(", ")}`);
    // 4. publication, un widget à la fois : soit la page se publie et le widget y figure, soit la publication est refusée AVEC un message clair (contenu à compléter),
    //    jamais une erreur serveur
    const published = [], refused = [], silent = [];
    for (const t of creatable.filter((x) => !contextual.has(x))) {
      const one = build([t]);
      assert.equal((await put(id, { sections: one.sections })).status, 200);
      const pr = await boss.postJson(`/marketing/pages/${id}/publier.json`, {});
      assert.ok([200, 422].includes(pr.status), `widget « ${t} » : publication ${pr.status} (${pr.text.slice(0, 120)})`);
      if (pr.status === 422) { assert.match(pr.text, /message|error/i); refused.push(t); continue; }
      const slug = db.prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(id).slug;
      const pub = await new Client(srv.base).get(`/p/${slug}`, { headers: { "User-Agent": "Mozilla/5.0 Chrome/120" } });
      assert.equal(pub.status, 200, `widget « ${t} » : page publiée`);
      if (!pub.text.includes(`kw-n-${one.ids[0][0]}`)) { silent.push(t); continue; }
      published.push(t);
    }
    // Éléments qui n'affichent volontairement rien sans contenu associé (table des matières sans titres, contenu d'article hors modèle…) : liste fermée et courte
    assert.deepEqual(silent.sort(), SILENT_BY_DESIGN, `widgets publiés mais absents de la page : ${silent.join(", ")}`);
    assert.ok(published.length >= 40, `${published.length} widgets publiables à vide (refusés : ${refused.join(", ")})`);
  });

  test("responsive : un réglage propre à l'écran mobile survit à l'enregistrement et au rechargement, et sort dans le CSS publié sous la règle mobile", async () => {
    const id = await newPage("Responsive");
    const c = { sections: [{ id: "sect00000001", type: "layout", children: [{ id: "cont00000001", type: "container", children: [{ id: "head00000001", type: "heading", props: { text: "Titre", level: 2 }, styles: { desktop: { color: "#10222f" }, mobile: { fontSize: "20px", paddingTop: "token:space-sm" } } }] }] }] };
    assert.equal((await put(id, c)).status, 200);
    const saved = JSON.parse(db.prepare("SELECT draft FROM mk_landing_pages WHERE id = ?").get(id).draft);
    const h = saved.sections[0].children[0].children[0];
    assert.deepEqual(h.styles.mobile, { fontSize: "20px", paddingTop: "token:space-sm" }, "valeurs conservées, référence au jeton non copiée");
    assert.equal((await boss.postJson(`/marketing/pages/${id}/publier.json`, {})).status, 200);
    const slug = db.prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(id).slug;
    const pub = (await new Client(srv.base).get(`/p/${slug}`, { headers: { "User-Agent": "Mozilla/5.0 Chrome/120" } })).text;
    assert.ok(pub.includes("@media (max-width: 767px){.kw-n-head00000001{font-size:20px;padding-top:var(--kw-space-sm, 8px)}"), "règle mobile, avec la référence réelle au jeton d'espacement (et son repli)");
  });
});
