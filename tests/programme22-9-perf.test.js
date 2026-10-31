// Programme 22.9 — moteur de performance : seuils, analyse statique, recommandations, régressions, optimisation du LCP (sans serveur).
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const V = require("../src/perfEngine/vitals");
const { analyzeHtml, localSizer } = require("../src/perfEngine/htmlAnalyzer");
const { recommend } = require("../src/perfEngine/recommend");
const { compare } = require("../src/perfEngine/regress");
const { prioritizeLcp } = require("../src/perfEngine/optimize");
const path = require("node:path");

const PAGE = (main, head = "") => `<!doctype html><html><head><meta name="viewport" content="width=device-width">${head}</head><body><header><img src="/logo.png" class="logo" alt="logo"></header><main>${main}</main></body></html>`;
const ids = (a) => recommend(a).map((r) => r.id);

describe("Core Web Vitals : seuils officiels et étiquetage", () => {
  test("seuils web.dev (LCP 2,5 s/4 s, INP 200/500 ms, CLS 0,1/0,25) et versions documentées", () => {
    assert.deepEqual([V.THRESHOLDS.lcp.good, V.THRESHOLDS.lcp.poor, V.THRESHOLDS.inp.good, V.THRESHOLDS.inp.poor, V.THRESHOLDS.cls.good, V.THRESHOLDS.cls.poor], [2500, 4000, 200, 500, 0.1, 0.25]);
    assert.match(V.VERSION, /2024/);
  });
  test("notation : bon / à améliorer / mauvais, bornes incluses, valeur absente = inconnu", () => {
    assert.equal(V.rate("lcp", 2500), "bon"); assert.equal(V.rate("lcp", 2501), "à améliorer"); assert.equal(V.rate("lcp", 4001), "mauvais");
    assert.equal(V.rate("cls", 0.1), "bon"); assert.equal(V.rate("cls", 0.26), "mauvais"); assert.equal(V.rate("inp", 200), "bon");
    assert.equal(V.rate("lcp", null), "inconnu"); assert.equal(V.rate("lcp", NaN), "inconnu"); assert.equal(V.rate("zzz", 1), "inconnu");
  });
  test("une métrique porte toujours son origine ; sans valeur elle devient « indisponible », jamais zéro", () => {
    const m = V.metric("lcp", null, { env: "laboratoire" }); assert.equal(m.kind, "indisponible"); assert.equal(m.value, null); assert.equal(m.rating, undefined);
    const l = V.metric("lcp", 1800, { kind: "mesure", env: "laboratoire", profile: "mobile lent", samples: 5 }); assert.equal(l.rating, "bon"); assert.equal(l.profile, "mobile lent");
    assert.throws(() => V.metric("lcp", 1, { kind: "inventé" })); assert.throws(() => V.metric("lcp", 1, { env: "ailleurs" }));
  });
});

describe("Analyse statique du HTML servi", () => {
  test("LCP, INP, CLS sont « indisponibles » sur le HTML seul (jamais estimés comme des mesures)", () => {
    const a = analyzeHtml(PAGE("<p>x</p>"));
    for (const k of ["lcp", "inp", "cls"]) { assert.equal(a.metrics[k].value, null); assert.equal(a.metrics[k].kind, "indisponible"); }
  });
  test("comptes DOM, images, scripts bloquants/différés, feuilles, domaines externes", () => {
    const a = analyzeHtml(PAGE('<img src="/a.jpg" width="800" height="400"><img src="/b.jpg" loading="lazy">', '<link rel="stylesheet" href="/css/a.css"><link rel="stylesheet" href="https://cdn.ex.test/x.css"><script src="/js/a.js"></script><script src="/js/b.js" defer></script><script src="https://tiers.test/t.js" async></script>'), { host: "k.test" });
    assert.equal(a.metrics.images.value, 3); assert.equal(a.metrics.blockingScripts.value, 1); assert.equal(a.metrics.blockingStyles.value, 2);
    assert.deepEqual(a.facts.externalOrigins.sort(), ["cdn.ex.test", "tiers.test"]); assert.equal(a.facts.imagesWithoutDimensions, 3 - 1);
  });
  test("candidat LCP : première image du <main>, hors en-tête, hors logo/avatar/petite largeur", () => {
    const a = analyzeHtml(PAGE('<img src="/p.png" width="64" height="64"><img class="kw-avatar" src="/av.png"><img src="/hero.jpg" loading="lazy">'));
    assert.equal(a.facts.lcpCandidate.src, "/hero.jpg"); assert.equal(a.facts.lcpCandidate.estimation, true);
  });
  test("poids réels des fichiers locaux lus sur le disque ; fichier introuvable = non mesuré, jamais inventé", () => {
    const a = analyzeHtml(PAGE("<p>x</p>", '<link rel="stylesheet" href="/css/landing.css"><script src="/js/inexistant-zz.js" defer></script>'), { sizer: localSizer(path.join(__dirname, "..", "public")) });
    assert.ok(a.metrics.cssBytes.value > 10000, "landing.css lu sur le disque"); assert.ok(a.metrics.cssGzipBytes.value < a.metrics.cssBytes.value);
    assert.equal(a.facts.unmeasuredFiles, 1);
  });
  test("le sizer refuse les chemins hors du dossier public", () => {
    const s = localSizer(path.join(__dirname, "..", "public"));
    for (const u of ["/../package.json", "/css/../../package.json", "//evil.test/x.js", "https://x.test/a.js", "relatif.js"]) assert.equal(s(u), null, u);
  });
  test("DOM : profondeur, enveloppes <div> nues à enfant unique, polices sans font-display", () => {
    const deep = "<div><div><div><p>x</p></div></div></div>";
    const a = analyzeHtml(PAGE(deep, "<style>@font-face{font-family:A;src:url(/f/a.woff2)}@font-face{font-family:B;src:url(/f/b.woff2);font-display:swap}</style>"));
    assert.equal(a.facts.wrapperChains, 1); assert.equal(a.facts.longestWrapperChain, 2); assert.equal(a.facts.fontFaces, 2); assert.equal(a.facts.fontFacesWithoutDisplay, 1);
    const ok = analyzeHtml(PAGE('<div class="a"><div class="b"><p>x</p></div></div>')); assert.equal(ok.facts.wrapperChains, 0, "des divs avec classe ne sont pas des enveloppes vides");
  });
  test("HTML hostile ou mal formé : pas d'exception", () => {
    for (const h of ["", "<<<>>>", "<img", "<script>", "<style>@font-face{", "x".repeat(200000), "<div>".repeat(5000)]) assert.doesNotThrow(() => analyzeHtml(h));
  });
});

describe("Recommandations", () => {
  test("image principale différée : constat « élevée », marqué estimation, corrigé automatiquement si l'option est active", () => {
    const a = analyzeHtml(PAGE('<img src="/hero.jpg" loading="lazy">'));
    const r = recommend(a).find((x) => x.id === "lcp-lazy"); assert.equal(r.severity, "élevée"); assert.equal(r.kind, "estimation"); assert.equal(r.auto, false);
    assert.equal(recommend(a, { autoLcp: true }).find((x) => x.id === "lcp-lazy").auto, true);
  });
  test("script bloquant, polices Google, iframes, vidéo, viewport, DOM trop gros", () => {
    const a = analyzeHtml(`<html><head><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=X"><script src="/js/x.js"></script></head><body><main>${"<p>a</p>".repeat(1600)}<iframe src="https://maps.test/m"></iframe><video autoplay src="/v.mp4"></video></main></body></html>`);
    const got = ids(a); for (const id of ["script-blocking", "font-external", "dom-size", "iframe-lazy", "video-preload", "viewport"]) assert.ok(got.includes(id), id);
  });
  test("chaque constat est complet (origine, impact, correction, difficulté) et trié par gravité", () => {
    const a = analyzeHtml(`<html><head><script src="/js/x.js"></script></head><body><main><img src="/h.jpg" loading="lazy"></main></body></html>`);
    const list = recommend(a); assert.ok(list.length >= 3);
    for (const r of list) for (const k of ["id", "area", "severity", "title", "detail", "origin", "impact", "fix", "difficulty"]) assert.ok(r[k], `${r.id}.${k}`);
    const rank = { critique: 3, élevée: 2, moyenne: 1, info: 0 }; for (let i = 1; i < list.length; i++) assert.ok(rank[list[i - 1].severity] >= rank[list[i].severity]);
  });
  test("une page saine ne reçoit aucun faux constat", () => {
    const a = analyzeHtml(PAGE('<img src="/h.jpg" width="1200" height="600" fetchpriority="high" srcset="/h-1.jpg 600w"><p>ok</p>', '<link rel="stylesheet" href="/css/a.css"><script src="/js/a.js" defer></script>'), { headers: { "content-encoding": "gzip" } });
    assert.deepEqual(recommend(a, { autoLcp: true }).filter((r) => r.severity !== "info").map((r) => r.id), []);
  });
});

describe("Détecteur de régressions", () => {
  const rep = (over = {}, m = {}) => ({ metrics: Object.fromEntries(["htmlGzipBytes", "jsBytes", "cssBytes", "requests", "images", "domNodes", "blockingScripts", "externalOrigins", "lcp", "inp", "cls", "ttfb"].map((k) => [k, V.metric(k, over[k] ?? null, { env: k === "lcp" || k === "cls" ? "laboratoire" : "analyse-statique", ...(m[k] || {}) })])) });
  test("augmentation significative du JavaScript = régression ; variation insignifiante = stable", () => {
    const r = compare(rep({ jsBytes: 100000, domNodes: 1000 }), rep({ jsBytes: 140000, domNodes: 1010 }));
    assert.deepEqual(r.regressions, ["jsBytes"]); assert.equal(r.items.find((i) => i.metric === "domNodes").verdict, "stable"); assert.equal(r.blocking, false);
  });
  test("le seuil relatif ET le plancher absolu doivent être dépassés", () => {
    assert.equal(compare(rep({ jsBytes: 1000 }), rep({ jsBytes: 3000 })).verdict, "stable", "+200 % mais seulement 2 Ko");
    assert.equal(compare(rep({ jsBytes: 1000000 }), rep({ jsBytes: 1005000 })).verdict, "stable", "+5 Ko mais 0,5 %");
  });
  test("laboratoire : variation inférieure à la variabilité mesurée ou moins de 3 relevés = incertain, jamais régression", () => {
    const b = rep({ lcp: 2000 }, { lcp: { samples: 5, profile: "p" } }); b.metrics.lcp.spread = 400;
    const a = rep({ lcp: 2300 }, { lcp: { samples: 5, profile: "p" } }); a.metrics.lcp.spread = 400;
    assert.equal(compare(b, a).items.find((i) => i.metric === "lcp").verdict, "incertain");
    const few = rep({ lcp: 4000 }, { lcp: { samples: 1, profile: "p" } }); assert.equal(compare(b, few).items.find((i) => i.metric === "lcp").verdict, "incertain");
    const big = rep({ lcp: 3500 }, { lcp: { samples: 5, profile: "p" } }); big.metrics.lcp.spread = 100; b.metrics.lcp.spread = 100;
    assert.equal(compare(b, big).items.find((i) => i.metric === "lcp").verdict, "régression");
  });
  test("conditions de mesure différentes : comparaison refusée, donnée absente ignorée avec la raison", () => {
    const x = rep({ lcp: 2000 }, { lcp: { samples: 5, profile: "mobile lent" } }), y = rep({ lcp: 3900 }, { lcp: { samples: 5, profile: "ordinateur" } });
    const r = compare(x, y); assert.ok(r.skipped.find((s) => s.metric === "lcp" && /différentes/.test(s.reason)));
    assert.ok(r.skipped.find((s) => s.metric === "cls" && /indisponible/.test(s.reason)));
  });
  test("rapport illisible ou d'ancien format : comparaison déclarée impossible, sans exception", () => {
    for (const bad of [{}, null, { metrics: null }]) { const r = compare(bad, bad); assert.equal(r.verdict, "indisponible"); assert.equal(r.blocking, false); }
  });
  test("amélioration signalée comme telle ; seuils configurables", () => {
    assert.equal(compare(rep({ jsBytes: 100000 }), rep({ jsBytes: 60000 })).items[0].verdict, "amélioration");
    assert.deepEqual(compare(rep({ jsBytes: 100000 }), rep({ jsBytes: 108000 }), { thresholds: { jsBytes: { rel: 0.05, abs: 5000 } } }).regressions, ["jsBytes"]);
  });
});

describe("Optimisation du LCP appliquée au HTML", () => {
  test("la première grande image du <main> perd loading=lazy et gagne fetchpriority=high ; rien d'autre ne change", () => {
    const html = PAGE('<img src="/a.jpg" alt="a" loading="lazy" decoding="async"><img src="/b.jpg" loading="lazy">');
    const r = prioritizeLcp(html); assert.equal(r.changed, true);
    assert.match(r.html, /<img src="\/a\.jpg" alt="a" decoding="async" fetchpriority="high">/); assert.match(r.html, /<img src="\/b\.jpg" loading="lazy">/);
    assert.equal(r.html.length - html.length, ' fetchpriority="high"'.length - ' loading="lazy"'.length);
  });
  test("logo d'en-tête, <nav>, petites images et avatars sont ignorés", () => {
    const html = PAGE('<nav><img src="/n.png"></nav><img src="/s.png" width="64"><img class="kw-avatar" src="/av.png" loading="lazy"><img src="/hero.jpg" loading="lazy">');
    const r = prioritizeLcp(html); assert.match(r.html, /<img src="\/hero\.jpg" fetchpriority="high">/); assert.match(r.html, /<img class="kw-avatar" src="\/av.png" loading="lazy">/);
  });
  test("image déjà prioritaire ou sans <main> : HTML identique", () => {
    const a = PAGE('<img src="/h.jpg" fetchpriority="high">'); assert.equal(prioritizeLcp(a).html, a);
    const b = "<body><img src=\"/x.jpg\" loading=\"lazy\"></body>"; assert.equal(prioritizeLcp(b).html, b); assert.equal(prioritizeLcp(b).changed, false);
  });
  test("idempotent, et résistant aux entrées hostiles", () => {
    const once = prioritizeLcp(PAGE('<img src="/h.jpg" loading="lazy">')).html; assert.equal(prioritizeLcp(once).html, once);
    for (const h of ["", "<main>", "<main><img", "<main><img src='x' loading=\"lazy\"", "<main>" + "<img src=a loading=lazy>".repeat(3)]) assert.doesNotThrow(() => prioritizeLcp(h));
  });
  test("sur le gabarit réel du produit : l'image d'un widget Image redevient prioritaire sans toucher aux suivantes", () => {
    const real = '<main class="lp-main" id="main"><figure class="kw-image kw-n-aaa"><img src="/uploads/marketing/1/h.jpg" srcset="/uploads/marketing/1/h-m.jpg 800w" sizes="100vw" alt="x" loading="lazy" decoding="async"></figure><figure><img src="/u/2.jpg" alt="y" loading="lazy" decoding="async"></figure></main>';
    const r = prioritizeLcp(real); assert.equal((r.html.match(/loading="lazy"/g) || []).length, 1); assert.equal((r.html.match(/fetchpriority="high"/g) || []).length, 1);
  });
});
