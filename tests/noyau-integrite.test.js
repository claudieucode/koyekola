// Noyau de l'éditeur : invariants du modèle de page (identifiants, références, aller-retour d'enregistrement), sur un vrai serveur.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const n = require("../src/marketing/pages/nodes");
const { startServer, loginInstructor } = require("./helpers");

const H = { ctx: {}, imageUrl: (v) => String(v || ""), linkUrl: (v) => String(v || ""), iconNames: n.iconNames() };
const layout = (children, id = "sect00000001") => ({ id, type: "layout", children: [{ id: `cont${id.slice(4)}`, type: "container", children }] });

describe("noyau : normalisation des éléments", () => {
  test("idempotente pour chaque type, et aucun réglage du modèle vierge n'est perdu", () => {
    let vus = 0;
    for (const type of Object.keys(n.NODE_TYPES).sort()) {
      const blank = n.PALETTE[type].blank();
      if (blank.props && blank.props.until) blank.props.until = "2030-01-01T00:00:00Z";
      const raw = { id: "node" + type.slice(0, 7).padEnd(7, "0"), type, ...blank, styles: { desktop: { marginTop: "8px" }, tablet: { paddingTop: "10px" } }, name: "N", note: "x", anchor: "a-" + type.slice(0, 5) };
      if (n.NODE_TYPES[type].container) raw.children = [];
      let a;
      try { a = n.normalizeNode(raw, type, H, 1, { n: 0, ids: new Set() }); } catch { continue; } // exige un contexte (formation, image…) : couvert ailleurs
      vus++;
      const b = n.normalizeNode(JSON.parse(JSON.stringify(a)), type, H, 1, { n: 0, ids: new Set() });
      assert.deepEqual(b, a, `${type} : la normalisation change encore le résultat au deuxième passage`);
      for (const k of Object.keys(raw.props || {})) assert.ok(k in (a.props || {}), `${type} : le réglage « ${k} » du modèle vierge est perdu`);
    }
    assert.ok(vus >= 60, `seulement ${vus} types vérifiés`);
  });
});

describe("noyau : enregistrement du brouillon (vrai serveur)", () => {
  let srv, boss, db, id;
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db();
    id = Number((await boss.post("/marketing/pages", { name: "Noyau" })).location.match(/(\d+)$/)[1]);
  });
  after(() => srv.stop());
  const put = (content) => { const rev = db.prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(id).revision; return boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", json: { revision: rev, content }, headers: { Origin: srv.base } }); };
  const draft = () => JSON.parse(db.prepare("SELECT draft FROM mk_landing_pages WHERE id = ?").get(id).draft);
  const find = (nid) => { let f = null; const w = (l) => (l || []).forEach((x) => { if (x.id === nid) f = x; w(x.children); }); w(draft().sections); return f; };

  test("aller-retour : réenregistrer le brouillon relu ne change rien (identifiants, ordre, réglages)", async () => {
    const doc = { title: "Noyau", sections: [layout([
      { id: "head00000001", type: "heading", name: "Titre", note: "à relire", props: { text: "Bonjour", level: "2" }, styles: { desktop: { color: "#112233" }, mobile: { fontSize: "15px" } } },
      { id: "cont00000009", type: "container", children: [{ id: "btn000000001", type: "button", props: { label: "Go", url: "/catalogue", variant: "primary" }, interactions: [{ trigger: "click", action: "toggle", target: "head00000001" }] }] },
    ])] };
    assert.equal((await put(doc)).status, 200);
    const first = draft();
    assert.equal((await put(first)).status, 200);
    assert.deepEqual(draft(), first);
    assert.deepEqual(first.sections[0].children[0].children.map((x) => x.id), ["head00000001", "cont00000009"], "ordre et identifiants conservés");
    assert.equal(find("head00000001").note, "à relire");
  });

  test("interaction vers un élément absent : retirée avec un avertissement (jamais un élément caché pour toujours)", async () => {
    const r = await put({ title: "Noyau", sections: [layout([
      { id: "head00000002", type: "heading", props: { text: "Cible", level: "2" }, startHidden: true },
      { id: "btn000000002", type: "button", props: { label: "Voir", url: "/catalogue", variant: "primary" }, interactions: [{ trigger: "click", action: "show", target: "head00000002" }, { trigger: "click", action: "show", target: "disparu00001" }] },
    ])] });
    assert.equal(r.status, 200, r.text);
    assert.deepEqual(find("btn000000002").interactions, [{ trigger: "click", action: "show", target: "head00000002" }]);
    const warn = JSON.parse(r.text).warnings || [];
    assert.ok(warn.some((w) => w.kind === "interaction_target" && w.target === "disparu00001" && w.nodeId === "btn000000002"), JSON.stringify(warn));
    // toutes les interactions orphelines : le champ disparaît
    const r2 = await put({ title: "Noyau", sections: [layout([{ id: "btn000000003", type: "button", props: { label: "Voir", url: "/catalogue", variant: "primary" }, interactions: [{ trigger: "click", action: "hide", target: "disparu00002" }] }])] });
    assert.equal(r2.status, 200, r2.text);
    assert.equal(find("btn000000003").interactions, undefined);
  });

  test("deux éléments de même identifiant : refusés", async () => {
    const r = await put({ title: "Noyau", sections: [layout([{ id: "head00000004", type: "heading", props: { text: "A", level: "2" } }, { id: "head00000004", type: "heading", props: { text: "B", level: "2" } }])] });
    assert.equal(r.status, 422);
  });

  test("propriété inconnue d'un élément : écartée sans erreur, le reste est conservé", async () => {
    const r = await put({ title: "Noyau", sections: [layout([{ id: "head00000005", type: "heading", props: { text: "Garde", level: "2", inconnue: "x" }, inconnueNoeud: true }])] });
    assert.equal(r.status, 200, r.text);
    assert.equal(find("head00000005").props.text, "Garde");
    assert.equal(find("head00000005").props.inconnue, undefined);
  });
});
