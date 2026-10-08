// Éditeur de pages — RÈGLES, GUIDES, GRILLE ET MAGNÉTISME : calculs du moteur (public/js/page-builder-snap.js), sans navigateur.
// Les gestes dans le vrai navigateur sont dans editeur-regles-magnetisme-navigateur.test.js.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const S = require("../public/js/page-builder-snap.js");

describe("graduations de la règle", () => {
  test("le pas s'adapte au zoom et reste lisible (≥ 56 px d'écran entre deux repères)", () => {
    for (const z of [0.25, 0.5, 0.64, 0.75, 1, 1.25, 1.5, 2]) {
      const step = S.niceStep(z);
      assert.ok(step * z >= 56, `zoom ${z} : pas ${step}`);
      assert.ok(S.minorStep(step, z) < step);
    }
    assert.ok(S.niceStep(0.25) > S.niceStep(1), "zoom faible : pas plus grand");
    assert.ok(S.niceStep(2) < S.niceStep(1), "zoom fort : pas plus fin");
    assert.equal(S.niceStep(1), 100);
    assert.equal(S.niceStep(2), 50);
  });
});

describe("unités : coordonnée du canevas (px) et valeur CSS", () => {
  const ctx = { vw: 1280, vh: 800, root: 16, font: 20, parent: 640 };
  test("conversions dans les deux sens", () => {
    assert.equal(S.fromPx(320, "rem", ctx), 20);
    assert.equal(S.fromPx(320, "em", ctx), 16);
    assert.equal(S.fromPx(640, "vw", ctx), 50);
    assert.equal(S.fromPx(400, "vh", ctx), 50);
    assert.equal(S.fromPx(160, "%", ctx), 25);
    assert.equal(S.toPx(25, "%", ctx), 160);
    assert.equal(S.toPx(2, "rem", ctx), 32);
    assert.equal(S.format(321.4, "px", ctx), "321");
    assert.equal(S.format(40, "rem", ctx), "2,5");
  });
  test("saisie : unité explicite ou unité courante, virgule ou point, texte invalide refusé", () => {
    assert.equal(S.parse("12,5 rem", "px", ctx), 200);
    assert.equal(S.parse("640", "px", ctx), 640);
    assert.equal(S.parse("50vw", "px", ctx), 640);
    assert.equal(S.parse("abc", "px", ctx), null);
    assert.equal(S.parse("", "px", ctx), null);
  });
});

describe("préférences", () => {
  test("valeurs par défaut quand rien n'est enregistré ou que c'est abîmé", () => {
    for (const raw of [undefined, null, "x", 12, { step: "beaucoup", unit: "km", web: { columns: 7 } }]) {
      const p = S.normalize(raw);
      assert.equal(p.unit, "px"); assert.equal(p.step, 8); assert.equal(p.web.columns, 12);
      assert.equal(p.snap.on, true); assert.equal(p.mode, "free");
    }
  });
  test("valeurs valides conservées et bornées", () => {
    const p = S.normalize({ unit: "rem", step: 12, distance: 99, strength: 3, mode: "web", snap: { on: false }, web: { columns: 6, gutter: 40, maxWidth: 960 }, devices: { mobile: { columns: 2 } } });
    assert.equal(p.unit, "rem"); assert.equal(p.step, 12); assert.equal(p.distance, 48); assert.equal(p.strength, 3);
    assert.equal(p.mode, "web"); assert.equal(p.snap.on, false); assert.equal(p.snap.guides, true);
    assert.deepEqual([p.web.columns, p.web.gutter, p.web.maxWidth], [6, 40, 960]);
    assert.equal(S.gridFor(p, "mobile").columns, 2);
    assert.equal(S.gridFor(p, "desktop").columns, 6);
    assert.equal(S.gridFor(p, "tablet").columns, 8);
  });
});

describe("grille web", () => {
  test("12 colonnes, gouttière 24, marges 32, conteneur 1200 dans une page de 1280", () => {
    const g = S.webGrid({ columns: 12, gutter: 24, marginL: 32, marginR: 32, maxWidth: 1200 }, 1280);
    assert.deepEqual(g.container, { left: 40, right: 1240 });
    assert.deepEqual(g.inner, { left: 72, right: 1208 });
    assert.equal(g.columns.length, 12);
    assert.equal(g.columns[0].left, 72);
    assert.ok(Math.abs(g.columns[11].right - 1208) < 1e-9);
    const w = g.columns[0].right - g.columns[0].left;
    for (let i = 1; i < 12; i++) assert.ok(Math.abs(g.columns[i].left - g.columns[i - 1].right - 24) < 1e-9, "gouttière régulière");
    assert.ok(Math.abs(w - g.colWidth) < 1e-9);
  });
  test("page plus étroite que le conteneur : le conteneur épouse la page ; marges trop grandes ignorées", () => {
    const g = S.webGrid({ columns: 4, gutter: 16, marginL: 16, marginR: 16, maxWidth: 0 }, 390);
    assert.deepEqual(g.container, { left: 0, right: 390 });
    assert.deepEqual(g.inner, { left: 16, right: 374 });
    const t = S.webGrid({ columns: 16, gutter: 0, marginL: 400, marginR: 400, maxWidth: 0 }, 390);
    assert.equal(t.inner.right - t.inner.left, 390);
  });
});

describe("accrochage", () => {
  test("la cible la plus proche gagne, hors portée on ne bouge pas", () => {
    const t = [{ v: 600, kind: "guide" }, { v: 640, kind: "grid" }];
    assert.equal(S.nearest(596, t, 8).v, 600);
    assert.equal(S.nearest(620, t, 8), null);
    assert.equal(S.nearest(637, t, 8).v, 640);
  });
  test("distance d'accrochage réelle : force et zoom", () => {
    const p = S.normalize({ distance: 8, strength: 2 });
    assert.equal(S.reach(p, 1), 8);
    assert.equal(S.reach(p, 2), 4, "zoom 200 % : moitié moins de pixels de page");
    assert.ok(S.reach(S.normalize({ distance: 8, strength: 3 }), 1) > S.reach(S.normalize({ distance: 8, strength: 1 }), 1));
  });
  test("plusieurs bords : le plus proche d'une cible se cale (gauche 596 → guide 600)", () => {
    const hit = S.snapAxis([{ v: 596, name: "left" }, { v: 700, name: "center" }, { v: 804, name: "right" }], [{ v: 600, kind: "guide" }], 8);
    assert.equal(hit.delta, 4); assert.equal(hit.edge.name, "left"); assert.equal(hit.target.kind, "guide");
    assert.equal(S.snapAxis([{ v: 300, name: "left" }], [{ v: 600, kind: "guide" }], 8), null);
  });
  test("cibles de grille : multiples du pas autour de la valeur, bords de colonnes en mode web, rien si désactivé", () => {
    const free = S.gridTargets(S.normalize({ step: 8 }), "desktop", 1280, 597, "x");
    assert.deepEqual(free.map((t) => t.v), [592, 600]);
    assert.equal(S.nearest(597, free, 8).v, 600);
    assert.equal(S.gridTargets(S.normalize({ snap: { grid: false } }), "desktop", 1280, 597, "x").length, 0);
    const web = S.gridTargets(S.normalize({ mode: "web" }), "desktop", 1280, 0, "x");
    assert.equal(web.length, 24);
    assert.equal(S.gridTargets(S.normalize({ mode: "web" }), "desktop", 1280, 0, "y").length, 0, "pas de colonnes sur l'axe vertical");
    assert.equal(S.gridTargets(S.normalize({ mode: "web", snap: { columns: false } }), "desktop", 1280, 0, "x").length, 0);
  });
  test("à distance égale, la cible la plus prioritaire gagne ; un guide l'emporte même s'il est un peu plus loin", () => {
    const eq = [{ v: 604, kind: "grid", pri: 6 }, { v: 596, kind: "guide", pri: 0 }, { v: 596, kind: "element", pri: 3 }];
    assert.equal(S.nearest(600, eq, 8).kind, "guide");
    assert.equal(S.nearest(600, [{ v: 601, kind: "grid", pri: 6 }, { v: 596, kind: "guide", pri: 0 }], 8).kind, "guide");
    assert.equal(S.nearest(600, [{ v: 601, kind: "grid", pri: 6 }, { v: 595, kind: "guide", pri: 0 }], 4).kind, "grid", "guide hors de portée : on ne l'attend pas");
    assert.equal(S.nearest(600, [{ v: 602, kind: "element", pri: 3 }, { v: 602, kind: "column", pri: 2 }], 8).kind, "column");
  });
});

describe("distances intelligentes", () => {
  const A = { left: 0, top: 0, right: 100, bottom: 50 }, B = { left: 124, top: 10, right: 200, bottom: 60 }, C = { left: 224, top: 0, right: 300, bottom: 50 };
  test("écart horizontal entre deux éléments face à face", () => {
    const g = S.gapBetween(A, B);
    assert.equal(g.axis, "x"); assert.equal(g.value, 24); assert.equal(g.from, 100); assert.equal(g.to, 124);
    assert.equal(S.gapBetween(B, A).value, 24);
  });
  test("pas d'écart pour des éléments qui se chevauchent ou ne se font pas face", () => {
    assert.equal(S.gapBetween(A, { left: 50, top: 20, right: 150, bottom: 80 }), null);
    assert.equal(S.gapBetween(A, { left: 150, top: 200, right: 250, bottom: 260 }), null);
  });
  test("voisins les plus proches par côté, limités par la portée", () => {
    const n = S.neighbours(B, [A, C, { left: 0, top: 500, right: 90, bottom: 560 }], 400);
    assert.equal(n.left.value, 24); assert.equal(n.right.value, 24);
    assert.equal(n.top, null); assert.equal(n.bottom, null);
    assert.equal(S.neighbours(B, [C], 10).right, null);
  });
  test("espacements identiques détectés (24 px deux fois), cibles pour reproduire un écart", () => {
    const r = S.repeatedGaps([A, B, C], "x");
    assert.deepEqual(r, [{ value: 24, count: 2 }]);
    assert.deepEqual(S.repeatedGaps([A, C], "x"), []);
    const t = S.gapTargets({ left: 400, top: 0, right: 450, bottom: 50 }, [C], [24], "x");
    assert.deepEqual(t.map((x) => x.v).sort((m, n) => m - n), [200, 324], "après C (300 + 24) et avant C (224 − 24)");
  });
});

describe("branchement dans l'éditeur", () => {
  const root = path.join(__dirname, "..");
  const read = (p) => fs.readFileSync(path.join(root, p), "utf8");
  test("le moteur est chargé avant l'éditeur, et rien de cela n'existe dans la page publiée", () => {
    const view = read("views/marketing/page-builder.ejs");
    assert.ok(view.indexOf("page-builder-snap.js") > 0 && view.indexOf("page-builder-snap.js") < view.indexOf("/js/page-builder.js"));
    for (const dir of ["views/marketing-public", "src/marketing/pages"]) {
      for (const f of fs.readdirSync(path.join(root, dir), { recursive: true })) {
        const full = path.join(root, dir, String(f));
        if (!fs.statSync(full).isFile() || !/\.(ejs|js)$/.test(full)) continue;
        assert.ok(!/KWSnap|pb-smart|pb-safe|pb-grid-overlay/.test(fs.readFileSync(full, "utf8")), `${dir}/${f} ne doit pas connaître les aides de conception`);
      }
    }
  });
});
