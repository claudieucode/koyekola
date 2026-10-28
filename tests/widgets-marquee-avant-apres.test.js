// Palier 11 : « Défilement continu » (marquee) et « Avant / Après » (beforeafter). Vérifiés du serveur au rendu publié :
// registre, validation, valeurs hostiles, enregistrement, canevas, page publiée, accessibilité du balisage.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { TEST_KEY, freshMarketing } = require("./marketing-helpers");
const pages = require("../src/marketing/pages");
const { startServer, loginInstructor } = require("./helpers");
const nodes = require("../src/marketing/pages/nodes");

const wrap = (...children) => ({ sections: [{ id: "sect00000001", type: "layout", children: [{ id: "box000000001", type: "container", props: {}, children }] }] });
const spec = (t) => nodes.editorSpec().types.find((x) => x.type === t);
const IMG = "https://exemple.fr/a.jpg", IMG2 = "https://exemple.fr/b.jpg";

describe("palier 11 : registre et validation (sans serveur)", () => {
  const { A } = freshMarketing();
  let n = 0;
  const save = (type, props) => {
    const p = pages.createPage(A, { name: `P11 ${++n}`, kind: "page" });
    return pages.saveDraft(A, p.id, wrap({ id: "essai0000001", type, props }), { revision: pages.getPage(A, p.id).revision }).content.sections[0].children[0].children[0].props;
  };
  test("les deux widgets sont déclarés, opérationnels, décrits, dans une catégorie existante, et ajoutables avec leur contenu de départ", () => {
    for (const t of ["marquee", "beforeafter"]) {
      const s = spec(t);
      assert.ok(s && s.description && s.status === "operational" && s.version === 1 && s.group, t);
      assert.doesNotThrow(() => save(t, s.blank.props), t);
    }
  });
  test("marquee : 1 à 12 textes, texte obligatoire, valeurs inconnues ramenées au défaut", () => {
    const b = spec("marquee").blank.props;
    assert.throws(() => save("marquee", { ...b, items: [] }), /au moins/);
    assert.throws(() => save("marquee", { ...b, items: Array.from({ length: 13 }, () => ({ text: "x" })) }), /12 élément/);
    assert.throws(() => save("marquee", { ...b, items: [{ text: "" }] }), /obligatoire/);
    const r = save("marquee", { ...b, speed: "supersonique", direction: "haut", separator: "abcdef" });
    assert.equal(r.speed, "normal"); assert.equal(r.direction, "left"); assert.ok(r.separator.length <= 3);
  });
  test("beforeafter : position bornée 0–100, format limité, image dangereuse refusée", () => {
    const b = spec("beforeafter").blank.props;
    // convention du moteur : une valeur hors bornes ou non numérique est ramenée au défaut (50), jamais enregistrée telle quelle
    for (const v of [150, -1, "abc"]) assert.equal(save("beforeafter", { ...b, position: v }).position, 50, String(v));
    assert.equal(save("beforeafter", { ...b, ratio: "50 / 1" }).ratio, "16 / 9");
    assert.throws(() => save("beforeafter", { ...b, before: "javascript:alert(1)" }), /image|adresse/i);
    assert.equal(save("beforeafter", { ...b, before: IMG, after: IMG2, position: 30 }).position, 30);
  });
});

describe("palier 11 : vrai serveur, canevas et page publiée", () => {
  let srv, boss, db;
  before(async () => { srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" }); boss = await loginInstructor(srv); db = srv.db(); });
  after(() => srv.stop());
  const publish = async (name, content) => {
    const id = Number((await boss.post("/marketing/pages", { name })).location.match(/(\d+)$/)[1]);
    const rev = db.prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(id).revision;
    const put = await boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", json: { revision: rev, content }, headers: { Origin: srv.base } });
    assert.equal(put.status, 200, put.text.slice(0, 300));
    const canvas = await boss.request(`/marketing/pages/${id}/rendu`, { method: "POST", json: { content }, headers: { Origin: srv.base } });
    assert.equal(canvas.status, 200);
    assert.equal((await boss.request(`/marketing/pages/${id}/publier.json`, { method: "POST", json: {}, headers: { Origin: srv.base } })).status, 200);
    const slug = db.prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(id).slug;
    return { id, html: (await boss.get(`/p/${slug}`)).text, canvas: canvas.text, saved: JSON.parse(db.prepare("SELECT sections FROM mk_landing_pages WHERE id = ?").get(id).sections || "[]") };
  };

  test("marquee : rendu publié (une liste lisible + une copie cachée), texte échappé, réglages enregistrés", async () => {
    const props = { items: [{ text: "Premier <b>gras</b>" }, { text: "Second" }], speed: "fast", direction: "right", separator: "•", pauseHover: true, label: "Annonces" };
    const { html, canvas, saved } = await publish("Marquee", wrap({ id: "wmarquee0001", type: "marquee", props }));
    for (const out of [html, canvas]) {
      assert.match(out, /class="[^"]*kw-marquee[^"]*is-fast is-right has-hover-pause"[^>]*role="region" aria-label="Annonces"/);
      assert.equal((out.match(/<ul class="kw-marquee-list"/g) || []).length, 2, "deux listes");
      assert.equal((out.match(/<ul class="kw-marquee-list" aria-hidden="true"/g) || []).length, 1, "une seule copie cachée aux lecteurs d'écran");
      assert.match(out, /Premier &lt;b&gt;gras&lt;\/b&gt;/);
      assert.doesNotMatch(out, /Premier <b>gras<\/b>/);
      assert.match(out, /<input type="checkbox" class="kw-marquee-pause"[^>]*aria-label="Mettre le défilement en pause">/);
    }
    assert.deepEqual(saved[0].children[0].children[0].props.items.map((i) => i.text), ["Premier <b>gras</b>", "Second"], "le texte est stocké tel quel, échappé à l'affichage");
  });

  test("beforeafter : rendu publié (deux images avec description, champ de curseur nommé), position de départ, images manquantes", async () => {
    const props = { before: IMG, beforeAlt: "Cuisine avant travaux", after: IMG2, afterAlt: "Cuisine après travaux", beforeLabel: "Avant", afterLabel: "Après", position: 30, ratio: "4 / 3" };
    const { html, saved } = await publish("Avant Après", wrap({ id: "wbeforeaft01", type: "beforeafter", props }));
    assert.match(html, /data-kw-compare style="--kw-cmp-pos: 30%; --kw-cmp-ratio: 4 \/ 3"/);
    assert.match(html, /<img class="kw-compare-img kw-compare-after" src="https:\/\/exemple\.fr\/b\.jpg" alt="Cuisine après travaux"/);
    assert.match(html, /<img class="kw-compare-img kw-compare-before" src="https:\/\/exemple\.fr\/a\.jpg" alt="Cuisine avant travaux"/);
    assert.match(html, /<input class="kw-compare-range" type="range" min="0" max="100" step="1" value="30" aria-label="Comparer « Avant » et « Après »/);
    assert.equal(saved[0].children[0].children[0].props.position, 30);
    const empty = await publish("Avant Après vide", wrap({ id: "wbeforeaft02", type: "beforeafter", props: { ...props, before: "", after: "" } }));
    assert.doesNotMatch(empty.html, /kw-compare-range/, "sans images, pas de curseur inutile sur la page publiée");
    assert.match(empty.canvas, /Choisissez les images/, "le canevas guide l'auteur");
  });

  test("valeurs hostiles refusées par le serveur : adresse d'image dangereuse, trop de textes", async () => {
    const id = Number((await boss.post("/marketing/pages", { name: "Hostile" })).location.match(/(\d+)$/)[1]);
    const put = (children) => boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", json: { revision: db.prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(id).revision, content: wrap(...children) }, headers: { Origin: srv.base } });
    assert.notEqual((await put([{ id: "whostile0001", type: "beforeafter", props: { ...spec("beforeafter").blank.props, before: "javascript:alert(1)", after: IMG } }])).status, 200);
    assert.notEqual((await put([{ id: "whostile0002", type: "marquee", props: { ...spec("marquee").blank.props, items: Array.from({ length: 40 }, () => ({ text: "x" })) } }])).status, 200);
  });
});

describe("palier 11 : styles et script (statique)", () => {
  const root = path.join(__dirname, "..");
  const css = fs.readFileSync(path.join(root, "public", "css", "landing.css"), "utf8");
  const js = fs.readFileSync(path.join(root, "public", "js", "landing.js"), "utf8");
  test("marquee : l'animation s'arrête avec « réduire les animations », au survol, au clavier et par la case Pause", () => {
    const reduced = css.slice(css.indexOf("@media (prefers-reduced-motion: reduce) {\n  .kw-marquee-track"));
    assert.match(reduced.slice(0, 600), /\.kw-marquee-track \{ animation: none/);
    assert.match(css, /\.kw-marquee\.has-hover-pause:hover \.kw-marquee-track, \.kw-marquee:focus-within \.kw-marquee-track, \.kw-marquee-pause:checked ~ \.kw-marquee-view \.kw-marquee-track \{ animation-play-state: paused/);
  });
  test("beforeafter : le script pilote la position depuis le champ « range » natif", () => {
    assert.match(js, /\[data-kw-compare\]/);
    assert.match(js, /setProperty\("--kw-cmp-pos"/);
  });
});
