// Widgets animés : réglages propres à chaque widget (compteur, barre de progression, titre animé, boîte retournable, points d'intérêt).
// 1) validation stricte et rétro-compatibilité (un réglage absent ne change RIEN aux données ni au CSS existants) ;
// 2) CSS publié ; 3) rendu par le VRAI serveur (aperçu de page) ; 4) scripts publics : réglages lus, mouvement réduit respecté.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const n = require("../src/marketing/pages/nodes");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");

const H = { ctx: {}, imageUrl: (v) => String(v || ""), linkUrl: (v) => String(v || ""), iconNames: n.iconNames() };
const norm = (type, props, extra = {}) => n.normalizeNode({ id: "node" + type.slice(0, 7).padEnd(7, "0"), type, props, ...extra }, type, H, 1, { n: 0, ids: new Set() });
const css = (node) => n.pageCss([{ id: "sect00000001", type: "layout", children: [node] }]);
const root = path.join(__dirname, "..");
const read = (f) => fs.readFileSync(path.join(root, f), "utf8");

describe("compteur : délai, départ, courbe", () => {
  const base = { value: 1250, label: "Élèves inscrits (base, oct. 2026)", duration: 1500 };
  test("réglages valides conservés, valeurs par défaut non écrites (rétro-compatibilité)", () => {
    const plain = norm("counter", base).props;
    assert.ok(!("delay" in plain) && !("start" in plain) && !("easing" in plain));
    const p = norm("counter", { ...base, delay: 600, start: 100, easing: "linear" }).props;
    assert.equal(p.delay, 600); assert.equal(p.start, 100); assert.equal(p.easing, "linear");
  });
  test("valeurs hors liste ou hors bornes ignorées sans casser l'enregistrement", () => {
    const p = norm("counter", { ...base, delay: 999999, start: "abc", easing: "bounce" }).props;
    assert.ok(!("delay" in p) && !("start" in p) && !("easing" in p));
  });
});

describe("barre de progression : durée et courbe du remplissage", () => {
  const base = { label: "Maîtrise", value: 60, animate: true };
  test("sans réglage : aucun CSS ajouté ; avec réglage : règle propre à l'élément, bornée", () => {
    assert.ok(!/transition-duration/.test(css(norm("progress", base))));
    const out = css(norm("progress", { ...base, duration: 2500, easing: "out" }));
    assert.match(out, /\.kw-progress-anim \.kw-progress-bar\{transition-duration:2500ms;transition-timing-function:cubic-bezier\(\.16,1,\.3,1\)\}/);
    const bad = norm("progress", { ...base, duration: 1, easing: "x" }).props;
    assert.ok(!("duration" in bad) && !("easing" in bad));
  });
});

describe("titre animé : effets et curseur", () => {
  const base = { before: "Apprenez", words: ["Photoshop", "Blender"], after: "vite", level: "2", interval: 2500 };
  test("effets proposés valides ; effet inconnu = fondu ; curseur masquable (machine à écrire)", () => {
    for (const e of ["fade", "type", "slide", "blur", "zoom"]) assert.equal(norm("animatedheading", { ...base, effect: e }).props.effect, e);
    assert.equal(norm("animatedheading", { ...base, effect: "spin" }).props.effect, "fade");
    assert.equal(norm("animatedheading", { ...base, effect: "type", cursor: false }).props.cursor, false);
    assert.ok(!("cursor" in norm("animatedheading", { ...base, effect: "type" }).props));
  });
});

describe("boîte retournable : sens et vitesse", () => {
  const base = { frontTitle: "Recto", backTitle: "Verso", effect: "flip", height: 280 };
  test("sens vertical et durée bornée ; défauts non écrits ; CSS propre à l'élément", () => {
    const plain = norm("flipbox", base).props;
    assert.ok(!("direction" in plain) && !("duration" in plain));
    const node = norm("flipbox", { ...base, direction: "vertical", duration: 1000 });
    assert.equal(node.props.direction, "vertical"); assert.equal(node.props.duration, 1000);
    assert.match(css(node), /\.kw-flip-inner\{transition-duration:1000ms\}/);
    assert.ok(!("duration" in norm("flipbox", { ...base, duration: 50 }).props));
    assert.ok(!("direction" in norm("flipbox", { ...base, direction: "diagonal" }).props));
  });
});

describe("points d'intérêt : pulsation", () => {
  const base = { src: "/uploads/x.jpg", alt: "Plan", spots: [{ x: 10, y: 20, title: "Entrée", text: "Ici." }] };
  test("pulse seulement si vrai", () => {
    assert.equal(norm("hotspot", { ...base, pulse: true }).props.pulse, true);
    assert.ok(!("pulse" in norm("hotspot", { ...base, pulse: "oui" }).props));
    assert.ok(!("pulse" in norm("hotspot", base).props));
  });
});

describe("scripts et styles publics", () => {
  const js = read("public/js/landing.js"), cssSrc = read("public/css/landing.css");
  test("le compteur lit délai, départ et courbe ; le mouvement réduit reste respecté", () => {
    assert.match(js, /data-kw-delay/); assert.match(js, /data-kw-start/); assert.match(js, /data-kw-ease/);
    assert.match(js, /prefers-reduced-motion: reduce/);
  });
  test("la pulsation des points est coupée sous « mouvement réduit »", () => {
    assert.match(cssSrc, /@media \(prefers-reduced-motion: reduce\) \{ \.kw-hotspot\.is-pulse \.kw-spot-dot \{ animation: none; \} \}/);
  });
  test("les nouveaux effets du titre ont leur style, et le retournement vertical aussi", () => {
    for (const c of [".kw-rotate.is-slide.is-out", ".kw-rotate.is-blur.is-out", ".kw-rotate.is-zoom.is-out", ".kw-flipbox.is-vertical.is-flip .kw-flip-back"]) assert.ok(cssSrc.includes(c), c);
  });
  test("l'éditeur expose chaque réglage (aucun contrôle sans effet)", () => {
    const pb = read("public/js/page-builder.js");
    for (const key of ['"delay"', '"easing"', '"direction"', "x.pulse", "x.start", '"duration"']) assert.ok(pb.includes(key), key);
  });
});

describe("rendu par le vrai serveur (aperçu de page)", () => {
  let srv, boss, db, html;
  const origin = { Origin: "" };
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    origin.Origin = srv.base;
    boss = await loginInstructor(srv); db = srv.db();
    const created = await boss.post("/marketing/pages", { name: "Widgets animés", kind: "page", template: "", ouvrir: "editeur" });
    const pid = Number(created.location.match(/pages\/(\d+)/)[1]);
    const rev = db.prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(pid).revision;
    const kid = (type, props, id) => ({ id, type, props });
    const sections = [{ id: "sect00000001", type: "layout", children: [
      kid("counter", { value: 1000, label: "Élèves (base, oct. 2026)", duration: 2000, delay: 600, start: 100, easing: "out" }, "cnt000000001"),
      kid("progress", { label: "Maîtrise", value: 70, animate: true, duration: 2500, easing: "linear" }, "prg000000001"),
      kid("animatedheading", { before: "Un", words: ["mot", "titre"], after: "animé", level: "2", effect: "blur", interval: 2500 }, "anh000000001"),
      kid("flipbox", { frontTitle: "Recto", backTitle: "Verso", effect: "flip", height: 280, direction: "vertical", duration: 1000 }, "flp000000001"),
      kid("hotspot", { src: "https://exemple.test/plan.jpg", alt: "Plan", spots: [{ x: 10, y: 20, title: "Entrée", text: "Ici." }], pulse: true }, "hot000000001"),
    ] }];
    const put = await boss.request(`/marketing/pages/${pid}/brouillon`, { method: "PUT", headers: origin, json: { revision: rev, content: { title: "Widgets animés", sections } } });
    assert.equal(put.status, 200, put.text.slice(0, 400));
    const r = await boss.get(`/marketing/pages/${pid}/apercu`);
    assert.equal(r.status, 200); html = r.text;
  });
  after(async () => { if (db) db.close(); if (srv) await srv.stop(); });
  test("compteur : délai, départ et courbe écrits dans la page", () => {
    assert.match(html, /data-kw-delay="600"/); assert.match(html, /data-kw-start="100"/); assert.match(html, /data-kw-ease="out"/);
  });
  test("barre de progression : règle de durée et de courbe publiée", () => {
    assert.match(html, /\.kw-progress-anim \.kw-progress-bar\{transition-duration:2500ms;transition-timing-function:linear\}/);
  });
  test("titre animé : effet « flou » et texte complet pour les lecteurs d'écran", () => {
    assert.match(html, /kw-rotate is-fade is-blur/); assert.match(html, /<span class="sr-only">Un mot, titre animé<\/span>/);
  });
  test("boîte retournable : sens vertical et durée", () => {
    assert.match(html, /kw-flipbox[^"]* is-flip is-vertical/); assert.match(html, /\.kw-flip-inner\{transition-duration:1000ms\}/);
  });
  test("points d'intérêt : classe de pulsation", () => {
    assert.match(html, /kw-hotspot[^"]* is-pulse/);
  });
});
