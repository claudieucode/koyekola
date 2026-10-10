// Réinitialisation intelligente de l'éditeur : moteur de comparaison / restauration (calculs purs, sans serveur).
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const R = require("../public/js/page-builder-reset.js");

const node = () => ({ id: "a1", type: "button", props: { text: "Acheter", href: "/x" }, styles: { desktop: { color: "#FF0000", paddingTop: "10px" }, mobile: { fontSize: "14px" } }, states: { hover: { color: "#00f" } }, name: "CTA", children: [{ id: "c1", type: "text", props: { text: "enfant" } }] });
const clone = (x) => JSON.parse(JSON.stringify(x));

describe("moteur de réinitialisation", () => {
  test("un élément identique à sa référence n'a aucun changement", () => {
    assert.deepEqual(R.diff(node(), node(), true), []);
  });

  test("les écritures équivalentes ne sont pas des modifications (couleur, longueur)", () => {
    const cur = node();
    cur.styles.desktop.color = "rgb(255, 0, 0)";
    cur.styles.desktop.paddingTop = "10.0px";
    cur.states.hover.color = "#0000FF";
    assert.deepEqual(R.diff(cur, node(), true), []);
    assert.ok(R.same("0px", "0") && R.same(0.1 + 0.2, 0.3) && !R.same("10px", "10%"));
  });

  test("un changement de valeur, un ajout et un retrait sont repérés chacun à leur chemin", () => {
    const cur = node();
    cur.props.text = "Commander";
    cur.styles.desktop.marginTop = "8px";
    delete cur.styles.desktop.paddingTop;
    cur.styles.mobile.fontSize = "16px";
    assert.deepEqual(R.diff(cur, node(), true).sort(), ["p:text", "s:desktop:marginTop", "s:desktop:paddingTop", "s:mobile:fontSize"]);
  });

  test("les enfants ne comptent jamais dans les réglages d'un parent", () => {
    const cur = node();
    cur.children[0].props.text = "modifié";
    cur.children.push({ id: "c2", type: "text" });
    assert.deepEqual(R.diff(cur, node(), true), []);
  });

  test("ordinateur, tablette et téléphone sont séparés", () => {
    const cur = node();
    cur.styles.mobile.fontSize = "20px";
    assert.deepEqual(R.diff(cur, node(), true), ["s:mobile:fontSize"]);
    R.restore(cur, node(), ["s:mobile:fontSize"], true);
    assert.equal(cur.styles.mobile.fontSize, "14px");
    assert.equal(cur.styles.desktop.color, "#FF0000");
  });

  test("restaurer un réglage ne touche aucun autre réglage modifié", () => {
    const cur = node();
    cur.props.text = "Commander";
    cur.styles.desktop.color = "#00ff00";
    cur.name = "Autre";
    R.restore(cur, node(), ["s:desktop:color"], true);
    assert.equal(cur.styles.desktop.color, "#FF0000");
    assert.equal(cur.props.text, "Commander");
    assert.equal(cur.name, "Autre");
    assert.deepEqual(R.diff(cur, node(), true).sort(), ["m:name", "p:text"]);
  });

  test("restaurer un réglage ajouté le retire, et un réglage retiré le remet ; les écrans vides disparaissent", () => {
    const base = node(); delete base.styles.mobile;
    const cur = node(); delete cur.styles.mobile; cur.styles.tablet = { width: "50%" }; delete cur.styles.desktop.color;
    R.restore(cur, base, R.diff(cur, base, true), true);
    assert.deepEqual(cur, base);
    assert.ok(!("tablet" in cur.styles));
  });

  test("la valeur restaurée est une copie : modifier l'élément ne change pas la référence", () => {
    const base = { id: "z", type: "list", props: { items: [{ t: "a" }] } };
    const cur = { id: "z", type: "list", props: { items: [{ t: "b" }] } };
    R.restore(cur, base, ["p:items"], true);
    cur.props.items[0].t = "c";
    assert.equal(base.props.items[0].t, "a");
  });

  test("une ancienne section (champs à plat) est suivie par champ", () => {
    const base = { id: "s1", type: "hero", title: "Bonjour", cta: "Go" };
    const cur = clone(base); cur.title = "Salut";
    assert.deepEqual(R.diff(cur, base, false), ["f:title"]);
    R.restore(cur, base, ["f:title"], false);
    assert.deepEqual(cur, base);
  });

  test("les chemins sont rangés par groupe", () => {
    const g = (k) => ({ color: "color", paddingTop: "spacing" })[k];
    assert.equal(R.groupOf("s:desktop:color", g), "color");
    assert.equal(R.groupOf("t:hover:paddingTop", g), "spacing");
    assert.equal(R.groupOf("p:text", g), "content");
    assert.equal(R.groupOf("m:name", g), "element");
  });

  test("la référence retrouve un élément par son identifiant, y compris imbriqué ; un élément nouveau n'a pas de référence", () => {
    const b = new R.Baseline();
    b.set([{ id: "sec", type: "layout", children: [node()] }]);
    assert.equal(b.get("c1").props.text, "enfant");
    assert.equal(b.has("a1"), true);
    assert.equal(b.has("neuf"), false);
    assert.equal(b.get("neuf"), null);
    const v = b.version; b.set([]); assert.ok(b.version > v); assert.equal(b.has("a1"), false);
  });
});
