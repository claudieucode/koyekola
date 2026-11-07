// Motion Studio, lot d : données animées et micro-interactions (progression circulaire, jauge, barres, graphique, comparaison, carte de métrique, onglets,
// notification, chargement et squelettes, retour de formulaire, interrupteurs et cases). Schéma, rendu serveur (contenu lisible sans JavaScript), modules (fonctions pures).
// Navigateur réel : tests/motion-studio-d-navigateur.test.js.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ejs = require("ejs");
const nodes = require("../src/marketing/pages/nodes");
const sections = require("../src/marketing/pages/sections");
const ROOT = path.join(__dirname, "..");
const H = { ctx: {}, imageUrl: sections.imageUrl, linkUrl: sections.linkUrl, iconNames: nodes.iconNames() };

const TYPES = ["motioncircular", "motiongauge", "motionbars", "motionchart", "motioncompare", "motionmetric", "motiontabs", "motiontoast", "motionloader", "motionformfeedback", "motionswitch"];
const MODULES = { motioncircular: "circular", motiongauge: "gauge", motionbars: "bars", motionchart: "chart", motioncompare: "compare", motionmetric: "metric", motiontabs: "tabs", motiontoast: "toast", motionloader: "loader", motionformfeedback: "form-feedback", motionswitch: "switch" };
const mk = (type, props = {}, studio) => nodes.normalizeNode({ id: "dd0000000001", type, props: { ...nodes.PALETTE[type].blank().props, ...props }, ...(studio ? { motion: { studio } } : {}) }, "test", H, 1, { n: 0, ids: new Set() });
const render = (n) => {
  const def = nodes.CUSTOM_WIDGETS[n.type];
  return ejs.render(fs.readFileSync(path.join(ROOT, "views/marketing-public/widgets", `${def.template}.ejs`), "utf8"), { p: n.props, cls: `kw-node kw-${n.type} kw-n-${n.id}`, attrs: nodes.motionAttrs(n), L: {}, isBuilder: false }).trim();
};
const html = (type, props, studio) => render(mk(type, props, studio));
const mod = (name) => require(path.join(ROOT, "public/js/motion-studio", `${name}.js`));
const throwsMsg = (fn, re) => assert.throws(fn, re);

describe("lot d : fiches et contrat", () => {
  for (const t of TYPES) {
    test(`${t} : enregistré, module présent, contenu de départ valide et idempotent, rendu complet sans « undefined »`, () => {
      const def = nodes.CUSTOM_WIDGETS[t];
      assert.ok(def, "enregistré"); assert.equal(def.motion.module, MODULES[t]);
      assert.ok(fs.existsSync(path.join(ROOT, "public/js/motion-studio", `${MODULES[t]}.js`)));
      assert.equal(def.group, "advanced"); assert.ok(def.description.length <= 160);
      const once = mk(t), twice = nodes.normalizeNode(JSON.parse(JSON.stringify(once)), "test", H, 1, { n: 0, ids: new Set() });
      assert.deepEqual(twice, once);
      const out = render(once);
      assert.ok(out.includes(`data-kw-ms-module="${MODULES[t]}"`)); assert.ok(out.includes("kw-ms kw-ms-d") || out.includes("kw-ms-d "), "classes communes");
      assert.ok(!/undefined|NaN|\[object/.test(out), out.slice(0, 300));
      const cfg = JSON.parse(nodes.motionAttrs(once).match(/data-kw-ms="([^"]*)"/)[1].replace(/&quot;/g, '"'));
      assert.equal(cfg.duration, def.motion.defaults.duration);
    });
    test(`${t} : aucun réglage ne contient de code (classes de ton en liste fermée, texte échappé)`, () => {
      const def = nodes.CUSTOM_WIDGETS[t];
      const textKey = def.schema.find((f) => f.kind === "text" && f.required) || def.schema.find((f) => f.kind === "text" || f.kind === "textarea");
      const out = html(t, { [textKey.key]: '"><img src=x onerror=alert(1)>' });
      assert.ok(!/<img src=x/.test(out), "échappé");
      if (def.schema.some((f) => f.key === "tone")) { const o2 = html(t, { tone: 'primary" onclick="x' }); assert.ok(!/onclick/.test(o2)); }
    });
  }
  test("les modules s'enregistrent sous le nom de la fiche et n'animent que des propriétés autorisées", () => {
    for (const t of TYPES) {
      const src = fs.readFileSync(path.join(ROOT, "public/js/motion-studio", `${MODULES[t]}.js`), "utf8");
      assert.ok(src.includes(`KWMS.register("${MODULES[t]}"`), t);
      assert.ok(!/animate\([^)]*\b(width|height|top|left|margin|padding)\s*:/.test(src), `${t} : propriété de mise en page animée`);
      assert.ok(!/https?:\/\/(?!www\.w3\.org)/.test(src.replace(/\/\/.*$/gm, "")), `${t} : pas d'adresse externe`);
    }
  });
  test("CSS du lot : bloc ms:d, aucune couleur blanche ou noire en dur, pas de transition « all »", () => {
    const css = fs.readFileSync(path.join(ROOT, "public/css/motion-studio.css"), "utf8");
    assert.ok(css.includes("/* ms:d begin") && css.includes("/* ms:d end */"));
    const mine = css.slice(css.indexOf("/* ms:d begin"), css.indexOf("/* ms:d end */"));
    assert.ok(!/#(?:f{3}|f{6}|0{3}|0{6})\b/i.test(mine)); assert.ok(!/transition:\s*all/.test(mine));
    for (const kf of ["kw-ms-spin", "kw-ms-shimmer", "kw-ms-dot"]) assert.ok(mine.includes(`@keyframes ${kf}`));
  });
});

describe("progression circulaire", () => {
  test("anneau final écrit : décalage = 100 - valeur, valeur bornée, rôle progressbar", () => {
    const o = html("motioncircular", { value: 72 });
    assert.match(o, /stroke-dashoffset="28"/); assert.match(o, /role="progressbar"/); assert.match(o, /aria-valuenow="72"/); assert.match(o, /pathLength="100"/);
    assert.equal(mk("motioncircular", { value: 250 }).props.value, 72, "hors bornes : valeur par défaut");
    assert.match(html("motioncircular", { value: 100 }), /stroke-dashoffset="0"/);
    assert.match(html("motioncircular", { value: 33.5, decimals: "1" }), /33,5/);
  });
  test("options : nombre masqué, unité, extrémité, taille", () => {
    const o = html("motioncircular", { showValue: false, cap: "butt", size: "lg", caption: "Légende" });
    assert.ok(!o.includes("kw-ms-num")); assert.match(o, /stroke-linecap="butt"/); assert.match(o, /kw-ms-cp-lg/); assert.match(o, /Légende/);
  });
});

describe("jauge", () => {
  test("maximum inférieur ou égal au minimum refusé", () => {
    throwsMsg(() => mk("motiongauge", { min: 10, max: 10 }), /supérieur au minimum/);
    throwsMsg(() => mk("motiongauge", { min: 50, max: 5 }), /supérieur au minimum/);
  });
  test("aiguille : angle final, zone courante lue, rôle meter ; arc rempli sans aiguille", () => {
    const o = html("motiongauge", { value: 0 });
    assert.match(o, /role="meter"/); assert.match(o, /Faible/); assert.match(o, /kw-ms-g-needle/);
    const hi = html("motiongauge", { value: 100 }); assert.match(hi, /Bon/);
    const fill = html("motiongauge", { mode: "fill", value: 25 });
    assert.match(fill, /stroke-dashoffset="75"/); assert.ok(!fill.includes("kw-ms-g-needle"));
  });
  test("valeur hors échelle ramenée dans l'échelle pour le dessin, valeur réelle affichée", () => {
    const o = html("motiongauge", { value: 500 });
    assert.match(o, /aria-valuenow="100"/); assert.match(o, />500</);
  });
  test("zones facultatives (liste vide) : arc neutre", () => {
    const o = html("motiongauge", { zones: [] }); assert.ok(!o.includes("kw-ms-g-seg"));
  });
});

describe("barres de progression", () => {
  test("une barre par élément, largeur et valeur finales, rôle progressbar lié à son libellé", () => {
    const o = html("motionbars", { items: [{ label: "A", value: 40 }, { label: "B", value: 100, tone: "success" }] });
    assert.equal((o.match(/role="progressbar"/g) || []).length, 2); assert.match(o, /width:40%/); assert.match(o, /width:100%/);
    assert.match(o, /aria-labelledby="kw-pb-0-kw-n-dd0000000001"/); assert.match(o, /id="kw-pb-0-kw-n-dd0000000001"/); assert.match(o, /kw-ms-tone-success/);
  });
  test("bornes : 12 barres au plus, au moins une, valeur 0 à 100", () => {
    throwsMsg(() => mk("motionbars", { items: Array.from({ length: 13 }, (_, i) => ({ label: `x${i}`, value: 1 })) }), /12 élément/);
    throwsMsg(() => mk("motionbars", { items: [] }), /au moins|obligatoire/);
    assert.equal(mk("motionbars", { items: [{ label: "x", value: 400 }] }).props.items[0].value, 50);
  });
  test("valeurs masquées, unité, forme", () => {
    const o = html("motionbars", { showValue: false, variant: "thin" }); assert.ok(!o.includes("kw-ms-pb-val")); assert.match(o, /kw-ms-pb-thin/);
  });
});

describe("graphique animé", () => {
  const items = [{ label: "T1", value: 120 }, { label: "T2", value: 180 }, { label: "T3", value: 150 }, { label: "T4", value: 240 }];
  test("barres : hauteur relative à un maximum « rond », tableau de données présent (lecteurs d'écran), visuel masqué", () => {
    const o = html("motionchart", { type: "bar", items });
    assert.match(o, /height:100%/, "240 = maximum de l'échelle"); assert.match(o, /height:50%/); assert.match(o, /<span>60<\/span>/);
    assert.match(o, /<table class="kw-ms-ch-table">/); assert.match(o, /<th scope="row">T2<\/th><td>180<\/td>/);
    assert.match(o, /class="kw-ms-sr"><table/); assert.match(o, /aria-hidden="true">\s*<div class="kw-ms-ch-y"/);
  });
  test("tableau visible à la demande", () => {
    assert.match(html("motionchart", { showTable: true }), /class="kw-ms-ch-data"><table/);
  });
  test("ligne : un point par donnée, polygone et tracé", () => {
    const o = html("motionchart", { type: "line", items });
    assert.equal((o.match(/kw-ms-ch-dot/g) || []).length, 4); assert.match(o, /<polyline class="kw-ms-ch-path"/); assert.match(o, /kw-ms-cht-line/);
  });
  test("anneau : un secteur par donnée, total, légende avec parts, secteurs consécutifs", () => {
    const o = html("motionchart", { type: "donut", items: [{ label: "A", value: 50 }, { label: "B", value: 50 }] });
    assert.equal((o.match(/<circle class="kw-ms-ch-seg/g) || []).length, 2); assert.match(o, /stroke-dashoffset="-50"/); assert.match(o, /50 %/); assert.match(o, /kw-ms-ch-total-n">100</);
  });
  test("données vides ou nulles : pas d'erreur de dessin", () => {
    assert.ok(html("motionchart", { type: "donut", items: [{ label: "A", value: 0 }, { label: "B", value: 0 }] }).includes("kw-ms-ch-seg"));
    assert.ok(html("motionchart", { type: "bar", items: [{ label: "A", value: 0 }, { label: "B", value: 0 }] }).includes("height:0%"));
  });
  test("au moins 2 et au plus 12 données, valeurs positives", () => {
    throwsMsg(() => mk("motionchart", { items: [{ label: "A", value: 1 }] }), /au moins/);
    throwsMsg(() => mk("motionchart", { items: Array.from({ length: 13 }, (_, i) => ({ label: `x${i}`, value: 1 })) }), /12 élément/);
    assert.equal(mk("motionchart", { items: [{ label: "A", value: -5 }, { label: "B", value: 1 }] }).props.items[0].value, 100);
  });
});

describe("comparaison de données", () => {
  test("écart calculé, sens favorable ou défavorable, accessibilité des séries", () => {
    const o = html("motioncompare", { items: [{ label: "Visites", a: 100, b: 150 }, { label: "Coût", a: 100, b: 80 }, { label: "Stable", a: 10, b: 10 }, { label: "Zéro", a: 0, b: 5 }] });
    assert.match(o, /is-up is-good[^>]*>.*?\+50,0 %/s); assert.match(o, /is-down is-bad[^>]*>.*?−20,0 %/s); assert.match(o, /is-flat[^>]*>.*?=/s); assert.match(o, /is-none[^>]*>.*?—/s);
    assert.match(o, /Avant : <\/span>/); assert.match(o, /Évolution : /);
    assert.match(html("motioncompare", { better: "down", items: [{ label: "x", a: 100, b: 150 }] }), /is-up is-bad/);
  });
  test("échelle commune ou par ligne", () => {
    const items = [{ label: "x", a: 50, b: 100 }, { label: "y", a: 10, b: 20 }];
    assert.match(html("motioncompare", { items, scale: "shared" }), /width:10%/); assert.match(html("motioncompare", { items, scale: "row" }), /width:50%/);
  });
  test("écart masqué", () => { assert.ok(!html("motioncompare", { showDelta: false }).includes("kw-ms-cmp-delta")); });
});

describe("carte de métrique", () => {
  test("valeur lisible (copie pour lecteurs d'écran), variation, mini-courbe avec description", () => {
    const o = html("motionmetric", { value: 12480, suffix: "€" });
    assert.match(o, /<span class="kw-ms-sr">12\s480 €<\/span>/); assert.match(o, /En hausse de /); assert.match(o, /\+12,4 %/); assert.match(o, /<polyline class="kw-ms-mc-line"/); assert.match(o, /Évolution récente : /);
  });
  test("baisse défavorable, neutre, sans variation ni courbe", () => {
    assert.match(html("motionmetric", { delta: -3 }), /is-down is-bad/); assert.match(html("motionmetric", { delta: -3, better: "down" }), /is-down is-good/);
    assert.match(html("motionmetric", { delta: -3, better: "none" }), /is-down"/);
    const o = html("motionmetric", { showDelta: false, spark: "" }); assert.ok(!o.includes("kw-ms-mc-delta") && !o.includes("kw-ms-mc-spark"));
  });
  test("mini-courbe invalide refusée avec un message clair", () => {
    throwsMsg(() => mk("motionmetric", { spark: "1" }), /2 à 24 nombres/); throwsMsg(() => mk("motionmetric", { spark: "1, a, 3" }), /2 à 24 nombres/);
    throwsMsg(() => mk("motionmetric", { spark: Array.from({ length: 25 }, (_, i) => i).join(",") }), /2 à 24 nombres/);
    assert.doesNotThrow(() => mk("motionmetric", { spark: "1 2 3" }));
  });
});

describe("onglets animés", () => {
  test("sans JavaScript : tous les panneaux avec leur titre, paragraphes séparés, onglet de départ borné", () => {
    const o = html("motiontabs", { start: 7 });
    assert.equal((o.match(/<section class="kw-ms-tabs-panel">/g) || []).length, 3); assert.match(o, /<h3 class="kw-ms-tabs-title">Présentation<\/h3>/); assert.equal((o.match(/<p>/g) || []).length, 4);
    assert.match(o, /data-kw-ms-start="3"/);
  });
  test("au moins 2 onglets, 8 au plus", () => {
    throwsMsg(() => mk("motiontabs", { items: [{ title: "a", text: "b" }] }), /au moins/); throwsMsg(() => mk("motiontabs", { items: Array.from({ length: 9 }, (_, i) => ({ title: `t${i}`, text: "x" })) }), /8 élément/);
  });
  test("module : navigation au clavier (flèches, Début, Fin, boucle ; vertical)", () => {
    const { nextIndex } = mod("tabs");
    assert.equal(nextIndex("ArrowRight", 0, 3, false), 1); assert.equal(nextIndex("ArrowRight", 2, 3, false), 0); assert.equal(nextIndex("ArrowLeft", 0, 3, false), 2);
    assert.equal(nextIndex("Home", 2, 3, false), 0); assert.equal(nextIndex("End", 0, 3, false), 2); assert.equal(nextIndex("ArrowDown", 0, 3, true), 1); assert.equal(nextIndex("ArrowRight", 0, 3, true), null); assert.equal(nextIndex("a", 0, 3, false), null);
  });
});

describe("notification animée", () => {
  test("sans JavaScript : message en clair avec le bon rôle ; réglages portés par des attributs", () => {
    const o = html("motiontoast", { tone: "error", launch: "delay", after: 9, hideAfter: 0, placement: "top-left" });
    assert.match(o, /role="alert"/); assert.match(o, /Merci ! Nous vous répondons/); assert.match(o, /data-kw-ms-launch="delay"/); assert.match(o, /data-kw-ms-after="9"/); assert.match(o, /data-kw-ms-place="top-left"/);
    assert.match(html("motiontoast", {}), /role="status"/);
  });
  test("bornes : délai 1 à 120 s, disparition 0 à 60 s", () => {
    assert.equal(mk("motiontoast", { after: 5000 }).props.after, 5); assert.equal(mk("motiontoast", { hideAfter: 5000 }).props.hideAfter, 6);
  });
  test("module : effets d'entrée selon la position, uniquement opacity et transform", () => {
    const { frames } = mod("toast");
    assert.match(frames("slide", "bottom-right")[0].transform, /translateX\(32px\)/); assert.match(frames("slide", "top-center")[0].transform, /translateY\(-24px\)/); assert.match(frames("slide", "bottom-center")[0].transform, /translateY\(24px\)/);
    for (const p of ["slide", "fade", "pop"]) for (const f of frames(p, "top-left")) for (const k of Object.keys(f)) assert.ok(["opacity", "transform"].includes(k));
  });
});

describe("chargement et squelettes", () => {
  test("chaque forme se dessine, texte pour lecteurs d'écran toujours présent", () => {
    for (const v of ["spinner", "ring", "dots", "bars", "pulse", "skeleton-text", "skeleton-card", "skeleton-profile", "skeleton-list"]) {
      const o = html("motionloader", { variant: v }); assert.match(o, new RegExp(`kw-ms-ld-${v}`)); assert.match(o, /role="status"/); assert.match(o, /Chargement en cours/);
    }
    assert.equal((html("motionloader", { variant: "skeleton-text", lines: 5 }).match(/kw-ms-sk-line/g) || []).length, 5);
    assert.equal((html("motionloader", { variant: "dots" }).match(/<i><\/i>/g) || []).length, 3);
  });
  test("libellé affiché à la demande ; pause proposée par défaut", () => {
    assert.match(html("motionloader", { showLabel: true }), /class="kw-ms-ld-label"/); assert.match(html("motionloader", {}), /data-kw-ms-pausable="1"/); assert.match(html("motionloader", { pausable: false }), /data-kw-ms-pausable="0"/);
  });
  test("module : jamais plus de ~1,6 cycle par seconde (pas de flash)", () => {
    const { speedOf } = mod("loader"); assert.equal(speedOf(50), 600); assert.equal(speedOf(1200), 1200); assert.equal(speedOf(99999), 10000); assert.equal(speedOf("x"), 1200);
  });
});

describe("retour de formulaire animé", () => {
  test("démonstration : les deux états décrits en clair, mention « rien n'est envoyé » configurable", () => {
    const o = html("motionformfeedback", {}); assert.match(o, /data-kw-ms-mode="demo"/); assert.match(o, /Succès :/); assert.match(o, /Erreur :/); assert.match(o, /data-kw-ms-note="1"/);
    assert.match(html("motionformfeedback", { note: false }), /data-kw-ms-note="0"/);
  });
  test("mode page : rien de visible côté public sans formulaire, note dans l'éditeur seulement", () => {
    const n = mk("motionformfeedback", { mode: "page" });
    const def = nodes.CUSTOM_WIDGETS[n.type], tpl = fs.readFileSync(path.join(ROOT, "views/marketing-public/widgets", `${def.template}.ejs`), "utf8");
    const pub = ejs.render(tpl, { p: n.props, cls: "c", attrs: "", L: {}, isBuilder: false }), ed = ejs.render(tpl, { p: n.props, cls: "c", attrs: "", L: {}, isBuilder: true });
    assert.ok(!/Succès :/.test(pub) && !/formulaire d'inscription de cette page/.test(pub)); assert.match(ed, /formulaire d'inscription de cette page/);
  });
  test("statut honnête : partiel, dépendance documentée", () => {
    const def = nodes.CUSTOM_WIDGETS.motionformfeedback; assert.equal(def.status, "partial"); assert.ok(def.dependencies.length);
  });
  test("module : secousse, rebond, fondu ; libellés nettoyés (astérisque)", () => {
    const m = mod("form-feedback"); assert.equal(m.errorFrames("shake").length, 6); assert.equal(m.errorFrames("nudge").length, 4); assert.equal(m.errorFrames("fade").length, 2);
    for (const p of ["shake", "nudge", "fade"]) for (const f of m.errorFrames(p)) for (const k of Object.keys(f)) assert.ok(["opacity", "transform"].includes(k));
    assert.equal(m.cleanLabel("Adresse e-mail *"), "Adresse e-mail"); assert.equal(m.cleanLabel("  Prénom  "), "Prénom");
  });
});

describe("interrupteurs et cases animés", () => {
  test("vrais <input type=checkbox> étiquetés, role=switch pour l'interrupteur, état de départ, description liée", () => {
    const o = html("motionswitch", {});
    assert.equal((o.match(/<input class="kw-ms-sw-input" type="checkbox"/g) || []).length, 2); assert.equal((o.match(/role="switch"/g) || []).length, 2);
    assert.match(o, /<label class="kw-ms-sw-row" for="kw-sw-kw-n-dd0000000001-0">/); assert.match(o, /id="kw-sw-kw-n-dd0000000001-0"[^>]* checked/); assert.match(o, /aria-describedby="kw-sw-kw-n-dd0000000001-0-h"/);
    assert.match(o, /<fieldset/); assert.match(o, /<legend class="kw-ms-sw-legend">Préférences<\/legend>/);
  });
  test("cases à cocher : pas de role=switch, coche SVG tracée ; mémorisation signalée", () => {
    const o = html("motionswitch", { variant: "checkbox", remember: true }); assert.ok(!o.includes('role="switch"')); assert.match(o, /kw-ms-sw-tick/); assert.match(o, /data-kw-ms-remember/);
    assert.ok(!html("motionswitch", {}).includes("data-kw-ms-remember"));
  });
  test("module : réglage de vitesse selon l'effet ; clé de mémorisation propre au composant", () => {
    const { timing, key } = mod("switch"); const KW = { easingCss: (e) => `E(${e})` };
    assert.deepEqual(timing({ duration: 240, easing: "smooth", preset: "smooth" }, KW), { dur: 240, ease: "E(smooth)" }); assert.deepEqual(timing({ duration: 240, easing: "smooth", preset: "spring" }, KW), { dur: 240, ease: "E(spring)" });
    assert.deepEqual(timing({ duration: 240, easing: "smooth", preset: "snap" }, KW), { dur: 120, ease: "ease-out" });
    assert.equal(key({ className: "a kw-n-abc123" }, { location: { pathname: "/p/x" } }), "kwms-sw:/p/x:abc123"); assert.equal(key({ className: "a" }, {}), null);
  });
});

describe("modules : nombres et suivi d'animation", () => {
  test("format français identique au serveur", () => {
    for (const n of ["circular", "gauge", "bars", "compare", "metric"]) { assert.equal(mod(n).fmt(12480, 0), (12480).toLocaleString("fr-FR")); assert.equal(mod(n).fmt(33.5, 1), "33,5"); }
  });
  test("suivi : valeur finale quand l'animation est annulée, progression bornée, arrêt propre", () => {
    const { follow } = mod("circular"); const seen = []; const queue = []; let st = "running", pr = 0.4;
    const anim = { effect: { getComputedTiming: () => ({ progress: pr }) } }; Object.defineProperty(anim, "playState", { get: () => st });
    const win = { requestAnimationFrame: (f) => queue.push(f), cancelAnimationFrame() {}, setTimeout: (f) => { queue.push(f); return 1; }, clearTimeout() {} };
    const step = () => { const f = queue.shift(); if (f) f(); };
    const f = follow(win, anim, (p) => seen.push(p)); f.kick(); step(); step();
    assert.deepEqual(seen, [0.4, 0.4], "tant que l'animation joue, la progression réelle est lue");
    pr = 1.7; st = "finished"; step(); assert.equal(seen[seen.length - 1], 1, "progression bornée à 1"); assert.equal(queue.length, 0, "plus de boucle une fois terminée");
    st = "idle"; pr = null; f.kick(); step(); assert.equal(seen[seen.length - 1], 1, "animation annulée : valeur finale");
    st = "running"; f.kick(); f.stop(); const n = seen.length; step(); assert.equal(seen.length, n, "arrêt propre");
  });
});
