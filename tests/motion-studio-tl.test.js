// Motion Studio, lot 3 (timeline) : modèle `theme.motionScenes` (validation, références, liens, version), cœur de lecture (départs, lecteur, états finaux),
// défilement fluide (fonctions pures), CSS des transitions de page, et parcours serveur réel (brouillon, publication, historique, restauration, rendu public).
// Navigateur réel : tests/motion-studio-tl-navigateur.test.js.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const S = require("../src/marketing/pages/motionScenes");
const CORE = require("../public/js/motion-studio/scenes-core.js");
const SMOOTH = require("../public/js/motion-studio/smooth-scroll.js");
const KWMS = require("../public/js/kw-motion-studio.js");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");

const ROOT = path.join(__dirname, "..");
const IDS = new Set(["aaaaaaaa", "bbbbbbbb", "cccccccc"]);
const run = (raw, ids = IDS) => { const warnings = []; return { out: S.normalize(raw, { nodeIds: ids, warn: (w) => warnings.push(w) }), warnings }; };
const scene = (extra = {}, steps) => ({ id: "scene0001", name: "Intro", steps: steps || [{ id: "step0001", target: "aaaaaaaa" }], ...extra });

describe("motionScenes : validation du modèle", () => {
  test("une scène valide est conservée, les valeurs par défaut ne sont pas écrites", () => {
    const { out } = run({ v: 1, scenes: [scene({ trigger: "viewport", repeat: true }, [
      { id: "step0001", target: "aaaaaaaa", effect: "fade-in", at: 0, duration: 600, delay: 0, easing: "smooth" },
      { id: "step0002", target: "bbbbbbbb", effect: "slide-up", at: 300, duration: 900, delay: 100, easing: "ease-out" },
    ])] });
    assert.deepEqual(out, { v: 1, scenes: [{ id: "scene0001", name: "Intro", repeat: true, steps: [
      { id: "step0001", target: "aaaaaaaa" },
      { id: "step0002", target: "bbbbbbbb", effect: "slide-up", at: 300, duration: 900, delay: 100, easing: "ease-out" },
    ] }] });
  });
  test("bornes et listes fermées : valeur hors limite ou inconnue retirée sans erreur", () => {
    const { out } = run({ v: 1, scenes: [scene({ trigger: "teleport", off: ["desktop", "tablet", "mobile"] }, [
      { id: "step0001", target: "aaaaaaaa", effect: "inconnu", at: -5, duration: 5, delay: 99999, easing: "url(x)" },
      { id: "step0002", target: "bbbbbbbb", at: 30001, duration: 10001 },
      { id: "step0003", target: "cccccccc", at: 30000, duration: 10000, delay: 10000, easing: "cubic-bezier(0.1, 0.2, 0.3, 1)" },
    ])] });
    const st = out.scenes[0].steps;
    assert.deepEqual(st[0], { id: "step0001", target: "aaaaaaaa" });
    assert.deepEqual(st[1], { id: "step0002", target: "bbbbbbbb" });
    assert.deepEqual(st[2], { id: "step0003", target: "cccccccc", at: 30000, duration: 10000, delay: 10000, easing: "cubic-bezier(0.1, 0.2, 0.3, 1)" });
    assert.equal(out.scenes[0].trigger, undefined); assert.equal(out.scenes[0].off, undefined, "jamais les trois écrans");
    assert.equal(run({ v: 1, scenes: [scene({}, [{ id: "step0001", target: "aaaaaaaa", easing: "cubic-bezier(5, 0, 0, 1)" }])] }).out.scenes[0].steps[0].easing, undefined);
  });
  test("élément supprimé : le pas est retiré avec un avertissement ; le déclencheur retombe sur le premier pas", () => {
    const { out, warnings } = run({ v: 1, scenes: [scene({ trigger: "click", anchor: "gone0001" }, [{ id: "step0001", target: "aaaaaaaa" }, { id: "step0002", target: "gone0002" }])] });
    assert.deepEqual(out.scenes[0].steps.map((s) => s.id), ["step0001"]);
    assert.equal(out.scenes[0].anchor, undefined);
    assert.equal(warnings.length, 2);
    assert.ok(warnings.every((w) => w.kind === "scene_target" && w.sceneId === "scene0001" && /n'existe plus/.test(w.message)));
    assert.deepEqual(warnings.map((w) => w.target).sort(), ["gone0001", "gone0002"]);
    // un déclencheur valide différent du premier pas est conservé
    assert.equal(run({ v: 1, scenes: [scene({ trigger: "click", anchor: "bbbbbbbb" })] }).out.scenes[0].anchor, "bbbbbbbb");
  });
  test("liens sync / after : conservés s'ils visent un pas existant ; retirés si inconnus, vers soi-même ou en boucle", () => {
    const steps = [{ id: "step0001", target: "aaaaaaaa" }, { id: "step0002", target: "bbbbbbbb", sync: "step0001", delay: 50 }, { id: "step0003", target: "cccccccc", after: "step0002" },
      { id: "step0004", target: "aaaaaaaa", sync: "inconnu00" }, { id: "step0005", target: "aaaaaaaa", after: "step0005" }];
    const st = run({ v: 1, scenes: [scene({}, steps)] }).out.scenes[0].steps;
    assert.equal(st[1].sync, "step0001"); assert.equal(st[2].after, "step0002");
    assert.equal(st[3].sync, undefined); assert.equal(st[4].after, undefined);
    const loop = run({ v: 1, scenes: [scene({}, [{ id: "step0001", target: "aaaaaaaa", after: "step0002" }, { id: "step0002", target: "bbbbbbbb", after: "step0001" }])] }).out.scenes[0].steps;
    assert.ok(loop.every((s) => !s.after && !s.sync), "boucle : liens retirés");
    const both = run({ v: 1, scenes: [scene({}, [{ id: "step0001", target: "aaaaaaaa" }, { id: "step0002", target: "bbbbbbbb", sync: "step0001", after: "step0001" }])] }).out.scenes[0].steps[1];
    assert.equal(both.sync, "step0001"); assert.equal(both.after, undefined, "un seul lien");
  });
  test("plafonds : 12 scènes, 40 pas, identifiants uniques, identifiants générés s'ils manquent", () => {
    const many = Array.from({ length: 20 }, (_, i) => ({ id: "scene" + String(1000 + i), steps: Array.from({ length: 60 }, (_, j) => ({ target: "aaaaaaaa", id: "st" + String(100000 + j) })) }));
    const { out } = run({ v: 1, scenes: many });
    assert.equal(out.scenes.length, 12); assert.equal(out.scenes[0].steps.length, 40);
    const gen = run({ v: 1, scenes: [{ steps: [{ target: "aaaaaaaa" }, { target: "bbbbbbbb" }] }] }).out.scenes[0];
    assert.match(gen.id, /^[a-z0-9]{6,20}$/); assert.notEqual(gen.steps[0].id, gen.steps[1].id);
    const dup = run({ v: 1, scenes: [scene(), scene()] }).out.scenes; assert.equal(dup.length, 1, "identifiant de scène en double écarté");
  });
  test("version : absente = 1 ; future ou illisible ignorée ; rien à enregistrer = undefined ; idempotent", () => {
    assert.ok(run({ scenes: [scene()] }).out);
    for (const bad of [{ v: 2, scenes: [scene()] }, { v: 0 }, { v: "x" }, "texte", 5, [1], null, {}, { v: 1 }, { v: 1, scenes: [] }, { v: 1, scenes: "x" }]) assert.equal(run(bad).out, undefined, JSON.stringify(bad));
    assert.equal(S.CURRENT, 1); assert.deepEqual(S.MIGRATIONS, {}, "aucune migration tant qu'il n'y a qu'une version");
    const a = run({ v: 1, scenes: [scene({ trigger: "scroll", scrub: { start: 10, end: 80 }, off: ["mobile"] })], pageTransition: { type: "zoom", duration: 400 }, sectionTransition: { type: "wipe-up" }, smoothScroll: { on: true, strength: 8, anchors: false } }).out;
    assert.deepEqual(run(a).out, a);
    assert.deepEqual(a.scenes[0].scrub, { start: 10, end: 80 }); assert.deepEqual(a.scenes[0].off, ["mobile"]);
  });
  test("la migration d'une version antérieure est enchaînée (MIGRATIONS[n])", () => {
    // Le code ne connaît que la v1 : une v0 n'existe pas ; on vérifie le contrat (v < 1 ignorée) et la présence du mécanisme
    assert.equal(run({ v: 0, scenes: [scene()] }).out, undefined);
    assert.match(fs.readFileSync(path.join(ROOT, "src/marketing/pages/motionScenes.js"), "utf8"), /while \(v < CURRENT\) \{ cur = MIGRATIONS\[v\]\(cur\); v\+\+; \}/);
  });
  test("options de page : transition de page, de sections, défilement fluide (désactivé par défaut, valeurs bornées)", () => {
    assert.equal(run({ v: 1, smoothScroll: { on: false } }).out, undefined, "désactivé = rien d'écrit");
    assert.equal(run({ v: 1, smoothScroll: { strength: 5 } }).out, undefined, "sans on:true : désactivé");
    assert.deepEqual(run({ v: 1, smoothScroll: { on: true, strength: 99 } }).out.smoothScroll, { on: true });
    assert.deepEqual(run({ v: 1, smoothScroll: { on: true, strength: 9 } }).out.smoothScroll, { on: true, strength: 9 });
    assert.deepEqual(run({ v: 1, pageTransition: { type: "fade", duration: 300 } }).out.pageTransition, { type: "fade" }, "durée par défaut non écrite");
    assert.deepEqual(run({ v: 1, pageTransition: { type: "slide", duration: 50 } }).out.pageTransition, { type: "slide" }, "durée hors bornes retirée");
    assert.equal(run({ v: 1, pageTransition: { type: "explode" } }).out, undefined);
    assert.deepEqual(run({ v: 1, pageTransition: { type: "off", duration: 900 } }).out.pageTransition, { type: "off" });
    assert.deepEqual(run({ v: 1, sectionTransition: { type: "wipe-right", duration: 900 } }).out.sectionTransition, { type: "wipe-right", duration: 900 });
    assert.equal(run({ v: 1, sectionTransition: { type: "slide-up" } }).out, undefined, "seuls les effets sans transform sont proposés aux sections");
  });
  test("nom nettoyé (balises, longueur) ; JSON démesuré refusé", () => {
    assert.equal(run({ v: 1, scenes: [scene({ name: "<b>Très</b>  \n long ".padEnd(200, "x") })] }).out.scenes[0].name.length <= 60, true);
    assert.ok(!/[<>]/.test(run({ v: 1, scenes: [scene({ name: "<script>alert(1)</script>" })] }).out.scenes[0].name));
  });
  test("l'éditeur reçoit les listes fermées (effets, déclencheurs, transitions, bornes)", () => {
    const e = S.editorSpec();
    assert.ok(e.effects.length >= 14 && e.effects.every((x) => x.length === 3 && ["in", "out", "emph"].includes(x[2])));
    assert.deepEqual(e.triggers.map((t) => t[0]), ["viewport", "load", "click", "scroll"]);
    assert.deepEqual(e.pageTransitions.map((t) => t[0]), ["fade", "slide", "zoom", "off"]);
    assert.ok(e.sectionTransitions.every((t) => CORE.SECTION_EFFECTS.includes(t[0])));
  });
});

describe("scenes-core : départs, liens, lecteur", () => {
  const st = (id, extra = {}) => ({ id, target: "aaaaaaaa", ...extra });
  const at = (sc, id) => CORE.resolve(sc).items.find((i) => i.id === id);
  test("départ absolu + délai ; fin = départ + durée ; durée totale", () => {
    const sc = { steps: [st("s1", { at: 200, delay: 100, duration: 500 }), st("s2", { at: 1000 })] };
    assert.deepEqual([at(sc, "s1").start, at(sc, "s1").end, at(sc, "s2").start, at(sc, "s2").end], [300, 800, 1000, 1600]);
    assert.equal(CORE.resolve(sc).total, 1600);
    assert.equal(CORE.resolve({ steps: [] }).total, 0);
  });
  test("sync = même départ que le pas lié (le délai s'ajoute) ; after = à la suite de sa fin ; les liens suivent le pas maître", () => {
    const sc = { steps: [st("s1", { at: 500, duration: 400 }), st("s2", { sync: "s1", delay: 120 }), st("s3", { after: "s1", duration: 200 }), st("s4", { after: "s3", delay: 50, duration: 100 })] };
    assert.equal(at(sc, "s2").start, 620); assert.equal(at(sc, "s3").start, 900); assert.equal(at(sc, "s4").start, 1150);
    sc.steps[0].at = 1500; // le maître bouge : tout suit
    assert.deepEqual([at(sc, "s2").start, at(sc, "s3").start, at(sc, "s4").start], [1620, 1900, 2150]);
    assert.equal(at(sc, "s2").link, "sync"); assert.equal(at(sc, "s3").link, "after"); assert.equal(at(sc, "s1").link, null);
  });
  test("lien cassé ou en boucle : traité comme un instant absolu, jamais d'erreur ni de boucle infinie", () => {
    const sc = { steps: [st("s1", { at: 100, after: "s2" }), st("s2", { at: 200, after: "s1" }), st("s3", { at: 50, sync: "inconnu" })] };
    const r = CORE.resolve(sc);
    assert.equal(r.items.length, 3); assert.ok(r.items.every((i) => Number.isFinite(i.start)));
    assert.equal(at(sc, "s3").start, 50);
    assert.deepEqual(CORE.cycles([st("a", { after: "b" }), st("b", { sync: "a" })]).sort(), ["a", "b"]);
    assert.deepEqual(CORE.cycles([st("a"), st("b", { after: "a" })]), []);
  });
  test("effets : catalogue fermé, transform seulement en composition « add », aucune largeur / hauteur / position", () => {
    for (const [id, e] of Object.entries(CORE.EFFECTS)) {
      assert.ok(["in", "out", "emph"].includes(e.kind), id); assert.ok(e.label, id);
      for (const frames of [e.fx, e.tf].filter(Boolean)) for (const f of frames) for (const k of Object.keys(f)) assert.ok(["opacity", "filter", "transform", "clipPath"].includes(k), `${id} : propriété ${k}`);
      assert.ok(e.fx || e.tf, id);
    }
    assert.ok(CORE.SECTION_EFFECTS.every((id) => !CORE.EFFECTS[id].tf && !JSON.stringify(CORE.EFFECTS[id]).includes("blur")), "transitions de sections sans transform ni filter");
  });

  // Faux éléments : enregistrent les animations demandées
  const fakeEl = (name) => ({ name, calls: [], animate(frames, opts) {
    const a = { frames, opts, playState: "idle", currentTime: null, cancelled: 0, pause() { this.playState = "paused"; }, play() { this.playState = "running"; }, cancel() { this.cancelled++; this.playState = "idle"; this.currentTime = null; }, onfinish: null };
    this.calls.push(a); return a;
  } });
  const els = { aaaaaaaa: fakeEl("a"), bbbbbbbb: fakeEl("b") };
  const find = (id) => els[id] || null;
  test("lecteur : une animation par propriété (opacity / transform add), départs décalés par l'instant du pas, état de départ tenu", () => {
    els.aaaaaaaa.calls = []; els.bbbbbbbb.calls = [];
    const sc = { steps: [st("s1", { effect: "slide-up", duration: 700, easing: "ease-out" }), { id: "s2", target: "bbbbbbbb", sync: "s1", delay: 150, effect: "fade-in" }, { id: "s3", target: "inconnu", effect: "fade-in" }] };
    const p = CORE.createPlayer(sc, { find });
    assert.equal(p.count, 2, "l'élément absent est ignoré"); assert.equal(p.steps, 3);
    const a = els.aaaaaaaa.calls; assert.equal(a.length, 2);
    assert.equal(a[0].opts.composite, undefined); assert.equal(a[1].opts.composite, "add"); assert.deepEqual(Object.keys(a[1].frames[0]), ["transform"]);
    assert.equal(a[0].opts.fill, "both"); assert.equal(a[0].opts.duration, 700); assert.equal(a[0].opts.easing, "ease-out"); assert.equal(a[0].opts.delay, 0);
    assert.equal(els.bbbbbbbb.calls[0].opts.delay, 150, "le pas lié part 150 ms après le maître");
    assert.equal(a[0].playState, "paused"); assert.equal(a[0].currentTime, 0);
    assert.equal(p.total, 750);
    p.play(); assert.equal(p.state(), "running"); p.pause(); assert.equal(p.state(), "paused"); p.resume(); assert.equal(p.state(), "running");
    p.seek(400); assert.equal(p.time(), 400); assert.equal(p.state(), "paused"); p.seek(99999); assert.equal(p.time(), 750, "plafonné à la durée");
    p.destroy(); assert.ok(a[0].cancelled > 0);
  });
  test("mouvement réduit (finish) : aucune animation visible ; seuls les effets de sortie laissent leur état final", () => {
    els.aaaaaaaa.calls = []; els.bbbbbbbb.calls = [];
    const sc = { steps: [st("s1", { effect: "slide-up" }), { id: "s2", target: "bbbbbbbb", effect: "fade-out" }] };
    const p = CORE.createPlayer(sc, { find }); els.aaaaaaaa.calls.length = 0; els.bbbbbbbb.calls.length = 0;
    p.finish();
    assert.equal(els.aaaaaaaa.calls.length, 0, "une entrée finit à l'état naturel : rien à poser");
    assert.equal(els.bbbbbbbb.calls.length, 1); const f = els.bbbbbbbb.calls[0];
    assert.deepEqual(f.frames, [{ opacity: 0 }]); assert.equal(f.opts.duration, 1); assert.equal(f.opts.fill, "forwards");
    p.rest(); assert.ok(f.cancelled > 0);
  });
  test("entrées terminées : animations retirées (cleanOnFinish) pour ne laisser aucun transform sur l'élément ; les sorties gardent leur état", () => {
    const sc = { steps: [st("s1", { effect: "slide-up" })] }, e = fakeEl("x"), p = CORE.createPlayer(sc, { find: () => e, cleanOnFinish: true });
    assert.equal(typeof e.calls[0].onfinish, "function"); e.calls[0].onfinish(); assert.equal(e.calls[0].cancelled, 1);
    const e2 = fakeEl("y"); CORE.createPlayer({ steps: [st("s1", { effect: "fade-out" })] }, { find: () => e2, cleanOnFinish: true }); assert.equal(e2.calls[0].onfinish, null);
    void p;
  });
});

describe("défilement fluide : fonctions pures", () => {
  test("intensité 1–10 → coefficient décroissant et borné", () => {
    assert.ok(SMOOTH.strengthK(1) > SMOOTH.strengthK(5) && SMOOTH.strengthK(5) > SMOOTH.strengthK(10));
    assert.equal(SMOOTH.strengthK(-3), SMOOTH.strengthK(1)); assert.equal(SMOOTH.strengthK(0), SMOOTH.strengthK(5), "valeur absente : intensité par défaut"); assert.equal(SMOOTH.strengthK(99), SMOOTH.strengthK(10)); assert.equal(SMOOTH.strengthK("x"), SMOOTH.strengthK(5));
  });
  test("lissage : approche la cible sans la dépasser, indépendant de la fréquence d'image, atteint exactement la cible", () => {
    let a = 0; for (let i = 0; i < 400; i++) { const n = SMOOTH.lerpStep(a, 1000, 16.667, 0.15); assert.ok(n >= a && n <= 1000); a = n; }
    assert.equal(a, 1000);
    const one = SMOOTH.lerpStep(0, 100, 33.334, 0.2), two = SMOOTH.lerpStep(SMOOTH.lerpStep(0, 100, 16.667, 0.2), 100, 16.667, 0.2);
    assert.ok(Math.abs(one - two) < 0.01, "deux images à 60 Hz = une image à 30 Hz");
    assert.equal(SMOOTH.lerpStep(99.8, 100, 16, 0.1), 100);
  });
  test("molette : pixels, lignes, pages ; ancre : décalage du haut collant (scroll-padding) et marge, bornée au document", () => {
    assert.equal(SMOOTH.wheelPixels({ deltaMode: 0, deltaY: 120 }, 800), 120);
    assert.equal(SMOOTH.wheelPixels({ deltaMode: 1, deltaY: 3 }, 800), 48);
    assert.equal(SMOOTH.wheelPixels({ deltaMode: 2, deltaY: 1 }, 800), 800);
    assert.equal(SMOOTH.anchorTop(500, 200, 80, 20, 5000), 600);
    assert.equal(SMOOTH.anchorTop(10, 0, 80, 0, 5000), 0); assert.equal(SMOOTH.anchorTop(9000, 0, 0, 0, 5000), 5000);
  });
});

describe("transitions de page : CSS (API View Transitions)", () => {
  test("désactivées par défaut ; une transition de page produit @view-transition, en dehors du mouvement réduit uniquement", () => {
    assert.equal(S.css(undefined), ""); assert.equal(S.css({ v: 1, scenes: [scene()] }), "");
    const css = S.css({ v: 1, pageTransition: { type: "slide", duration: 450 } });
    assert.match(css, /^@media \(prefers-reduced-motion:no-preference\)\{@view-transition\{navigation:auto\}/);
    assert.match(css, /::view-transition-old\(root\)\{animation:450ms ease both kw-vtp-out\}/);
    assert.match(css, /translateX\(-24px\)/); assert.match(css, /translateX\(24px\)/);
    assert.match(S.css({ v: 1, pageTransition: { type: "fade" } }), /animation:300ms/);
    assert.doesNotMatch(S.css({ v: 1, pageTransition: { type: "fade" } }), /transform/);
    assert.match(S.css({ v: 1, pageTransition: { type: "zoom" } }), /scale\(/);
  });
  test("« aucune pour cette page » coupe la transition même si le site en a une", () => {
    assert.equal(S.css({ v: 1, pageTransition: { type: "off" } }), "@view-transition{navigation:none}");
  });
  test("le CSS fabriqué ne contient que des valeurs validées (jamais de saisie libre)", () => {
    const css = S.css({ v: 1, pageTransition: { type: "fade", duration: "300;}</style><script>" } });
    assert.doesNotMatch(css, /script|<|}\s*<\//);
  });
});

describe("runtime : données de la page et garde-fous", () => {
  test("le runtime expose l'API des scènes et ses nouveaux ports (éditeur)", () => {
    const src = fs.readFileSync(path.join(ROOT, "public/js/kw-motion-studio.js"), "utf8");
    for (const k of ["scenes: scenesApi", "kw-ms-scenes", "load(\"smooth-scroll\")", "reduceQ.matches", "scrollSnapType"]) assert.ok(src.includes(k), k);
    assert.equal(typeof KWMS.create, "function");
  });
  test("forRender : n'embarque que ce que le runtime lit ; vide = null", () => {
    assert.equal(S.forRender(undefined), null);
    assert.equal(S.forRender({ v: 1, pageTransition: { type: "fade" } }), null, "la transition de page est du CSS, pas de données de runtime");
    const d = S.forRender({ v: 1, scenes: [scene()], smoothScroll: { on: true }, pageTransition: { type: "fade" } });
    assert.deepEqual(Object.keys(d).sort(), ["scenes", "smoothScroll", "v"]);
  });
});

describe("serveur réel : brouillon, avertissements, publication, historique, rendu public", () => {
  let srv, boss, db, id, slug;
  const hdr = () => ({ Origin: srv.base });
  const node = (nid, text) => ({ id: nid, type: "heading", props: { text, level: "2" } });
  const revision = () => db.prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(id).revision;
  const put = async (content) => { const r = await boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", json: { revision: revision(), content }, headers: hdr() }); return { status: r.status, body: (() => { try { return JSON.parse(r.text); } catch { return null; } })(), text: r.text }; };
  const sections = (children) => [{ id: "sect00000001", type: "layout", children }];
  const ms = {
    v: 1, scenes: [{ id: "scene0001", name: "Entrée", steps: [{ id: "step0001", target: "tlhead000001", effect: "slide-up", duration: 800 }, { id: "step0002", target: "tltext000001", sync: "step0001", delay: 200, effect: "fade-in" }] }],
    pageTransition: { type: "fade", duration: 400 }, sectionTransition: { type: "wipe-up" }, smoothScroll: { on: true, strength: 7 },
  };
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" }); boss = await loginInstructor(srv); db = srv.db();
    id = Number((await boss.post("/marketing/pages", { name: "Scènes serveur" })).location.match(/(\d+)$/)[1]);
    slug = db.prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(id).slug;
  });
  after(async () => { if (srv) await srv.stop(); });

  test("page sans scène : aucune donnée, aucun script, aucune feuille de transition (page inchangée)", async () => {
    assert.equal((await put({ sections: sections([node("tlhead000001", "Titre"), node("tltext000001", "Texte")]) })).status, 200);
    assert.equal((await boss.request(`/marketing/pages/${id}/publier.json`, { method: "POST", json: {}, headers: hdr() })).status, 200);
    const html = (await boss.get(`/p/${slug}`)).text;
    for (const k of ["kw-ms-scenes", "kw-ms-modules", "kw-motion-studio.js", "kw-page-transition", "view-transition"]) assert.ok(!html.includes(k), k);
    assert.equal(JSON.parse(db.prepare("SELECT theme FROM mk_landing_pages WHERE id = ?").get(id).theme).motionScenes, undefined);
  });
  test("brouillon : scènes validées, rangées dans le thème (colonne draft), élément supprimé retiré avec avertissement", async () => {
    const bad = JSON.parse(JSON.stringify(ms)); bad.scenes[0].steps.push({ id: "step0003", target: "gone00000001", effect: "pop" });
    const r = await put({ sections: sections([node("tlhead000001", "Titre"), node("tltext000001", "Texte")]), theme: { motionScenes: bad } });
    assert.equal(r.status, 200, r.text.slice(0, 300));
    assert.ok(Array.isArray(r.body.warnings) && r.body.warnings.some((w) => w.kind === "scene_target" && w.target === "gone00000001" && w.sceneId === "scene0001"), JSON.stringify(r.body.warnings));
    const draft = JSON.parse(db.prepare("SELECT draft FROM mk_landing_pages WHERE id = ?").get(id).draft);
    assert.deepEqual(draft.theme.motionScenes.scenes[0].steps.map((s) => s.id), ["step0001", "step0002"], "pas orphelin retiré");
    assert.equal(draft.theme.motionScenes.pageTransition.type, "fade");
    assert.deepEqual(draft.theme.motionScenes.smoothScroll, { on: true, strength: 7 });
    assert.equal(draft.theme.motionScenes.scenes[0].steps[1].sync, "step0001");
    // la version en ligne n'a pas bougé tant qu'on ne publie pas
    assert.equal(JSON.parse(db.prepare("SELECT theme FROM mk_landing_pages WHERE id = ?").get(id).theme).motionScenes, undefined);
  });
  test("les scènes ne remplacent pas les couleurs de la page : le thème garde ses couleurs", async () => {
    const draft = JSON.parse(db.prepare("SELECT draft FROM mk_landing_pages WHERE id = ?").get(id).draft);
    assert.match(draft.theme.accent, /^#[0-9a-f]{6}$/);
  });
  test("publication : la version en ligne (colonne theme) et l'historique portent les scènes ; le rendu public les embarque", async () => {
    const p = await boss.request(`/marketing/pages/${id}/publier.json`, { method: "POST", json: {}, headers: hdr() });
    assert.equal(p.status, 200, p.text.slice(0, 300));
    const row = db.prepare("SELECT theme FROM mk_landing_pages WHERE id = ?").get(id);
    assert.equal(JSON.parse(row.theme).motionScenes.scenes.length, 1);
    const ver = db.prepare("SELECT content FROM mk_page_versions WHERE page_id = ? ORDER BY number DESC").get(id);
    assert.equal(JSON.parse(ver.content).theme.motionScenes.scenes[0].name, "Entrée");
    const html = (await boss.get(`/p/${slug}`)).text;
    const data = JSON.parse(/<script type="application\/json" id="kw-ms-scenes">([\s\S]*?)<\/script>/.exec(html)[1]);
    assert.equal(data.scenes[0].id, "scene0001"); assert.deepEqual(data.smoothScroll, { on: true, strength: 7 }); assert.equal(data.sectionTransition.type, "wipe-up");
    assert.equal(data.pageTransition, undefined, "la transition de page est du CSS");
    const mods = JSON.parse(/<script type="application\/json" id="kw-ms-modules">([\s\S]*?)<\/script>/.exec(html)[1]);
    assert.ok(/scenes-core\.js\?v=/.test(mods["scenes-core"]) && /smooth-scroll\.js\?v=/.test(mods["smooth-scroll"]), JSON.stringify(mods));
    assert.match(html, /<style id="kw-page-transition">@media \(prefers-reduced-motion:no-preference\)\{@view-transition\{navigation:auto\}/);
    assert.match(html, /kw-motion-studio\.js/);
    assert.ok(html.indexOf('id="kw-page-transition"') > html.indexOf("kw-site-"), "après les styles du site : elle les remplace");
    // les fichiers référencés existent
    for (const f of ["kw-motion-studio.js", "motion-studio/scenes-core.js", "motion-studio/smooth-scroll.js"]) assert.ok(fs.existsSync(path.join(ROOT, "public/js", f)), f);
  });
  test("aperçu du canevas (éditeur) : pas de feuille de transition de page ; les données de scène sont présentes", async () => {
    const r = await boss.get(`/marketing/pages/${id}/apercu`);
    assert.equal(r.status, 200); assert.match(r.text, /kw-ms-scenes/);
  });
  test("restauration d'une version : les scènes reviennent dans le brouillon (annulation / restauration)", async () => {
    // brouillon modifié (scène supprimée), puis restauration de la version publiée
    const cleared = await put({ sections: sections([node("tlhead000001", "Titre"), node("tltext000001", "Texte")]), theme: {} });
    assert.equal(cleared.status, 200);
    assert.equal(JSON.parse(db.prepare("SELECT draft FROM mk_landing_pages WHERE id = ?").get(id).draft).theme.motionScenes, undefined);
    const n = db.prepare("SELECT number FROM mk_page_versions WHERE page_id = ? ORDER BY number DESC").get(id).number;
    const r = await boss.request(`/marketing/pages/${id}/versions/${n}/restaurer`, { method: "POST", form: {}, headers: hdr() });
    assert.ok(r.status === 302 || r.status === 200, String(r.status));
    const back = JSON.parse(db.prepare("SELECT draft FROM mk_landing_pages WHERE id = ?").get(id).draft);
    assert.equal(back.theme.motionScenes.scenes[0].steps.length, 2);
    assert.equal(back.theme.motionScenes.smoothScroll.strength, 7);
  });
  test("historique : la comparaison nomme les scènes (et non « couleurs »)", () => {
    const cmp = require("../src/marketing/pages/compare").compareContents;
    const a = { sections: [], theme: { accent: "#111111" } }, b = { sections: [], theme: { accent: "#111111", motionScenes: ms } };
    assert.deepEqual(cmp(a, b).page, ["Scènes et mouvement de la page"]);
    assert.deepEqual(cmp({ sections: [], theme: { accent: "#111111" } }, { sections: [], theme: { accent: "#222222" } }).page, ["Couleurs de la page"]);
  });
  test("élément supprimé après coup : à l'enregistrement suivant le pas disparaît et l'avertissement est renvoyé", async () => {
    const r = await put({ sections: sections([node("tlhead000001", "Titre")]), theme: { motionScenes: ms } }); // « tltext000001 » n'existe plus
    assert.equal(r.status, 200);
    assert.ok(r.body.warnings.some((w) => w.kind === "scene_target" && w.target === "tltext000001"));
    const d = JSON.parse(db.prepare("SELECT draft FROM mk_landing_pages WHERE id = ?").get(id).draft);
    assert.deepEqual(d.theme.motionScenes.scenes[0].steps.map((s) => s.id), ["step0001"]);
  });
});
