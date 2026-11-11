process.env.FOOTER_V2 = "0"; // ces tests décrivent l'ANCIEN catalogue (100 modèles ft-*) : on active l'interrupteur de secours. La bibliothèque v2 est testée par footer-v2-*.test.js.
// FRONTIÈRE DE PIED — tests de COUVERTURE (sans navigateur) : l'exclusion du pied indépendant doit s'appliquer à CHAQUE feuille « du site » émise, et chaque variable du site lue par les
// widgets partagés doit être remplacée sur la racine du pied. Un test qui échoue ici dit exactement quoi corriger quand quelqu'un ajoute un point d'émission de CSS ou une variable.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const FF = require("../src/marketing/pages/footerFrontier");
const tokens = require("../src/marketing/pages/tokens");

const ROOT = path.join(__dirname, "..");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const walkFiles = (dir, ok, out = []) => { for (const e of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) { if (e.name === "node_modules") continue; const p = path.join(dir, e.name); if (e.isDirectory()) walkFiles(p, ok, out); else if (ok.test(e.name)) out.push(p); } return out; };

// Lecteur de feuille indépendant de excludeFooter : liste les sélecteurs de style (hors @font-face, @keyframes…) d'une feuille
function selectorsOf(css) {
  const src = String(css).replace(/\/\*[\s\S]*?\*\//g, "");
  const out = [];
  const splitTop = (s) => { const r = []; let d = 0, q = "", cur = ""; for (const ch of s) { if (q) { cur += ch; if (ch === q) q = ""; continue; } if (ch === '"' || ch === "'") { q = ch; cur += ch; continue; } if ("([".includes(ch)) d++; if (")]".includes(ch)) d--; if (ch === "," && d === 0) { r.push(cur); cur = ""; } else cur += ch; } r.push(cur); return r; };
  const walk = (from, to) => {
    let i = from;
    while (i < to) {
      const open = src.indexOf("{", i); if (open < 0 || open >= to) break;
      const head = src.slice(i, open).trim(); let depth = 1, j = open + 1, q = "";
      while (j < to && depth) { const ch = src[j]; if (q) { if (ch === q) q = ""; } else if (ch === '"' || ch === "'") q = ch; else if (ch === "{") depth++; else if (ch === "}") depth--; j++; }
      if (head.startsWith("@")) { if (/^@(media|supports|container|layer)\b/i.test(head)) walk(open + 1, j - 1); }
      else for (const s of splitTop(head)) if (s.trim()) out.push(s.trim());
      i = j;
    }
  };
  walk(0, src.length);
  return out;
}
const rootOnly = (s) => /^(html|:root)(?![\w-])(?:\s*[:.\[#][^\s>+~,]*)*$/i.test(s);
const unexcluded = (css) => selectorsOf(css).filter((s) => !rootOnly(s) && !s.includes(FF.SUFFIX));

describe("Frontière de pied : excludeFooter (exclusion à spécificité 0)", () => {
  test("ajoute l'exclusion au sujet de chaque sélecteur, y compris dans @media et @supports, avant un pseudo-élément ; laisse intacts :root, html, @font-face, @keyframes, @view-transition", () => {
    const css = `:root{--a:1}html{x:y}body[data-kw-pack="noir"] .lp-main > :not(.pk-bleed) a, .x::before{color:red}@media (max-width:600px){p:hover,h2.kw-heading::after{margin:0}}@font-face{font-family:"a";src:url(a.woff2)}@keyframes k{from{opacity:0}to{opacity:1}}@view-transition{navigation:auto}.a:is(b,c)::placeholder{content:"}"}@supports (display:grid){.g{display:grid}}`;
    const out = FF.excludeFooter(css);
    assert.deepEqual(unexcluded(out), []);
    assert.ok(out.includes(`a${FF.SUFFIX},.x${FF.SUFFIX}::before`), "pseudo-élément après l'exclusion");
    assert.ok(out.includes(`p:hover${FF.SUFFIX}`) && out.includes(`.g${FF.SUFFIX}`), "dans @media et @supports");
    assert.ok(out.includes(":root{--a:1}") && out.includes("html{x:y}") && out.includes('@font-face{font-family:"a";src:url(a.woff2)}') && out.includes("@keyframes k{from{opacity:0}to{opacity:1}}") && out.includes("@view-transition{navigation:auto}"));
    assert.ok(out.includes('content:"}"'), "accolade dans une chaîne conservée");
  });
  test("la spécificité n'augmente pas (:where) et l'ordre/les déclarations sont conservés", () => {
    assert.ok(FF.SUFFIX.startsWith(":not(:where(") && !FF.SUFFIX.includes(","), "suffixe sans virgule, en :where()");
    const css = ".a{color:red!important}.b .c{margin:0}";
    const out = FF.excludeFooter(css);
    assert.ok(out.includes("color:red!important") && out.includes("margin:0"));
    assert.equal(out.indexOf(".a") < out.indexOf(".b .c"), true);
  });
  test("vide, commentaires, instructions sans bloc", () => {
    assert.equal(FF.excludeFooter(""), "");
    assert.deepEqual(unexcluded(FF.excludeFooter("/* a */ @import url(x.css); .a{b:c}")), []);
  });
});

describe("Frontière de pied : TOUTES les feuilles « du site » émises portent l'exclusion", () => {
  test("styles du site (thème : typographie, boutons, champs, réglages Global ; mise en page ; classes ; CSS personnalisé)", () => {
    const { themeCss } = require("../src/marketing/pages/themeCss");
    const S = require("../src/marketing/pages/siteSettings");
    const t = tokens.normalizeTokens({ ...require("./helpers-footer-isolation").STATES.R, ...require("./helpers-footer-isolation").STATES.G });
    const settings = S.normalizeSettings({ customCss: ".ma-classe { color: #0b2a40; } .autre a { text-decoration: none; }", classes: {} });
    const a = S.siteAssets(t, settings, themeCss);
    assert.ok(a.theme.length > 200, "le thème du site produit des règles");
    assert.deepEqual(unexcluded(a.theme), [], "assets.theme");
    assert.ok(a.custom.includes(".ma-classe"), "CSS personnalisé présent");
    assert.deepEqual(unexcluded(a.custom), [], "assets.custom");
  });
  test("les 130 thèmes (paquets) : aucune règle ne peut atteindre le pied", () => {
    const packs = require("../src/marketing/themes/packs");
    const keys = packs.all().map((s) => s.key);
    assert.ok(keys.length >= 100, `${keys.length} thèmes`);
    const bad = [];
    for (const k of keys) { const u = unexcluded(packs.get(k).served); if (u.length) bad.push(`${k} : ${u.slice(0, 2).join(" | ")}`); }
    assert.deepEqual(bad, []);
  });
  test("réglages « Global » seuls, apparence du site principal : chaque règle émise est exclue", () => {
    const g = require("../src/marketing/pages/globalStyles");
    const { themeCss } = require("../src/marketing/pages/themeCss");
    const t = tokens.normalizeTokens(require("./helpers-footer-isolation").STATES.G);
    assert.ok(themeCss(t).includes(".lp-site"), "le thème du site cible .lp-site (donc le pied) : l'exclusion est indispensable");
    assert.ok(g.globalCss(t.global, "principal").length > 50);
    const ap = fs.readFileSync(path.join(ROOT, "src/services/appearance.js"), "utf8");
    assert.ok(/excludeFooter\(rules\.join/.test(ap), "appearance.buildCss applique l'exclusion à ses règles");
  });
  test("aucun NOUVEAU point d'émission de CSS du site : tout fichier qui produit du CSS de thème / personnalisé doit être connu (et appliquer excludeFooter)", () => {
    const KNOWN = {
      // émetteurs : appliquent excludeFooter
      "src/marketing/pages/siteSettings.js": "excludeFooter", "src/marketing/themes/packs/index.js": "excludeFooter", "src/services/appearance.js": "excludeFooter", "src/marketing/landing/index.js": "excludeFooter", "src/marketing/web/themeRender.js": "excludeFooter",
      // producteurs de règles, consommés par les émetteurs ci-dessus ou prévisualisations qui passent par siteAssets
      "src/marketing/pages/themeCss.js": null, "src/marketing/pages/globalStyles.js": null, "src/marketing/pages/index.js": null, "src/marketing/web/siteWeb.js": null, "src/marketing/web/themeDemo.js": null,
      "src/middlewares/stylePreview.js": null, "src/middlewares/themePreview.js": null, "src/services/siteStyles.js": null, "src/layoutGen/validate.js": null, "src/themeBuilder/catalog/single_page/v2/h.js": null,
      // vues : lisent assets.theme / assets.custom déjà exclus à l'émission
      "views/boutique/_top.ejs": null, "views/marketing-public/landing.ejs": null,
    };
    const hits = [...walkFiles("src", /\.js$/), ...walkFiles("views", /\.ejs$/)].filter((f) => /assets\.(theme|custom)|siteAssets\(|themeCss\(|globalCss\(|scopeCss\(|\.customCss\b/.test(read(f)));
    const unknown = hits.filter((f) => !(f in KNOWN));
    assert.deepEqual(unknown, [], `Nouveau point d'émission de CSS du site : appliquez excludeFooter() à sa sortie (src/marketing/pages/footerFrontier.js) puis ajoutez le fichier à KNOWN dans ce test.`);
    for (const [f, need] of Object.entries(KNOWN)) if (need) assert.ok(read(f).includes(need), `${f} doit appliquer ${need}`);
    // la vue publique ne réécrit jamais assets.* après coup
    assert.ok(!/assets\.(theme|custom)\s*=/.test(read("views/marketing-public/landing.ejs")));
  });
});

describe("Frontière de pied : chaque variable du site lue par les widgets partagés est remplacée sur la racine du pied", () => {
  // Variables lues avec un repli (var(--x, valeur)) ou posées par les éléments eux-mêmes : jamais fournies par le site. Une NOUVELLE variable non listée fait échouer ce test.
  const ELEMENT_LOCAL_OR_FALLBACK = new Set(["--kw-pl", "--kw-pr", "--kw-on-secondary", "--kw-ms-cs-gap", "--kw-radius"]);
  const FEUILLES = ["public/css/landing.css", "public/css/motion-studio.css", "public/css/widgets.css"].filter((f) => fs.existsSync(path.join(ROOT, f)));
  const used = new Set();
  for (const f of FEUILLES) for (const m of read(f).matchAll(/var\(\s*(--(?:kw|lp)-[a-z0-9-]+)/g)) used.add(m[1]);
  const declared = new Set();
  // Les fichiers qui posent des variables SUR LE SITE (corps de page) ne comptent pas comme « posée par l'élément » : ces variables doivent être remplacées dans le pied
  const SITE_LEVEL = new Set(["src/marketing/pages/tokens.js", "src/marketing/pages/siteSettings.js", "src/services/appearance.js", "src/marketing/web/themeRender.js", "src/marketing/pages/footerFrontier.js", "views/marketing-public/landing.ejs"]);
  for (const f of [...walkFiles("src", /\.js$/), ...walkFiles("public/css", /\.css$/), ...walkFiles("public/js", /\.js$/), ...walkFiles("views", /\.ejs$/)].filter((x) => !SITE_LEVEL.has(x))) for (const m of read(f).matchAll(/(--(?:kw|lp)-[a-z0-9-]+)\s*:|["'`](--(?:kw|lp)-[a-z0-9-]+)["'`]/g)) declared.add(m[1] || m[2]);

  test("toute variable lue est soit remplacée localement (liste explicite), soit posée par l'élément lui-même, soit connue comme repli", () => {
    const site = new Set(FF.siteVars());
    const unknown = [...used].filter((v) => !site.has(v) && !declared.has(v) && !ELEMENT_LOCAL_OR_FALLBACK.has(v));
    assert.deepEqual(unknown, [], `Variable(s) du site lue(s) par les widgets mais NON remplacée(s) sur la racine du pied : ${unknown.join(", ")}. Ajoutez-la à footerFrontier.js (EXTRA_VARS / LP_VARS) ou aux jetons.`);
    assert.ok(used.size > 60, `${used.size} variables relevées`);
  });
  test("chaque variable du site de la liste explicite est posée par la racine solo, y compris --lp-accent (oubli du prototype)", () => {
    const style = FF.rootStyle({ ftMode: "solo" });
    const decls = new Map(style.split(";").map((d) => [d.slice(0, d.indexOf(":")), d.slice(d.indexOf(":") + 1)]));
    const css = read("public/css/landing.css");
    const block = css.slice(css.indexOf('[data-kw-ft="solo"] {'), css.indexOf("[data-kw-ft=\"site\"]"));
    for (const v of FF.siteVars()) assert.ok(decls.has(v) || new RegExp(`${v}\\s*:`).test(block), `${v} n'est pas redéfinie sur la racine du pied`);
    for (const v of FF.LP_VARS) assert.ok(new RegExp(`${v}\\s*:\\s*var\\(--kw-`).test(block), `${v} doit être rattachée aux valeurs locales`);
    assert.ok(FF.siteVars().includes("--lp-accent") && FF.siteVars().includes("--kw-lb-overlay"));
    // chaque variable des jetons du site est dans la liste
    for (const m of tokens.tokensToCss({ customColors: [] }).split(";").filter(Boolean)) assert.ok(FF.siteVars().includes(m.slice(0, m.indexOf(":"))), m);
  });
  test("les jetons du pied (--ft-*) remplacent les variables correspondantes, dans le pied seulement", () => {
    const s = FF.rootStyle({ ftMode: "solo", ftVars: { "--ft-accent": "#ff0000", "--ft-font": "Georgia, serif" } });
    assert.ok(s.includes("--kw-primary:var(--ft-accent)") && s.includes("--kw-font-body:var(--ft-font)") && s.includes("--ft-accent:#ff0000"));
    assert.ok(!s.includes("--kw-text:var(--ft-text)"), "un jeton absent ne remplace rien");
  });
  test("valeurs refusées : pas d'url(), pas de caractères de balise, nom hors --kw-/--ft-", () => {
    const v = FF.normalizeVars({ "--kw-primary": "#fff", "--ft-bg": "url(javascript:1)", "--kw-x": "a;b", "--other": "1", "--ft-ok": "12px" });
    assert.deepEqual(Object.keys(v).sort(), ["--ft-ok", "--kw-primary"]);
  });
});

describe("Frontière de pied : réglage stocké dans le document", () => {
  test("seuls « solo » et « site » sont conservés (legacy = absence de réglage) ; une valeur inconnue revient à l'ancien comportement", () => {
    assert.deepEqual(FF.normalizeAppearance({ ftMode: "legacy" }), {});
    assert.deepEqual(FF.normalizeAppearance({ ftMode: "x" }), {});
    assert.equal(FF.normalizeAppearance({ ftMode: "solo" }).ftMode, "solo");
    assert.equal(FF.modeOf({}), "legacy"); assert.equal(FF.modeOf({ ftMode: "site" }), "site");
    assert.deepEqual(FF.normalizeAppearance({ ftMode: "site", ftVars: { "--kw-primary": "#111" } }).ftVars, { "--kw-primary": "#111" });
  });
  test("la grammaire des sections garde ftMode / ftVars sur une section de type layout et ne les invente jamais", () => {
    const S = require("../src/marketing/pages/sections");
    const out = S.normalizeSection({}, { type: "layout", id: "sect00000001", children: [], ftMode: "solo", ftVars: { "--kw-primary": "#123456" } }, 0);
    assert.equal(out.ftMode, "solo"); assert.deepEqual(out.ftVars, { "--kw-primary": "#123456" });
    const plain = S.normalizeSection({}, { type: "layout", id: "sect00000002", children: [] }, 0);
    assert.ok(!("ftMode" in plain) && !("ftVars" in plain), "un pied existant n'a aucun réglage : ancien comportement");
    assert.ok(!("ftMode" in S.normalizeSection({}, { type: "layout", id: "sect00000003", children: [], ftMode: "legacy" }, 0)));
  });
  test("un modèle de la future bibliothèque qui se déclare indépendant (ftMode: \"solo\") s'insère en « solo » : le document construit porte le réglage et la grammaire le garde", () => {
    const Catalog = require("../src/themeBuilder/catalog");
    const S = require("../src/marketing/pages/sections");
    const meta = Catalog.find("footer", Catalog.entries("footer")[55].key);
    meta.ftMode = "solo";
    try {
      const doc = Catalog.build("footer", meta.key, {});
      assert.equal(doc.section.ftMode, "solo");
      assert.equal(S.normalizeSection({}, { ...doc.section, id: "sect00000009" }, 0).ftMode, "solo", "createComponent normalise le document sans perdre le réglage");
    } finally { delete meta.ftMode; }
  });
  test("le catalogue actuel (100 modèles) ne déclare aucun mode indépendant : tous s'insèrent en ancien comportement", () => {
    const Catalog = require("../src/themeBuilder/catalog");
    const with_ = Catalog.entries("footer").filter((m) => m.ftMode);
    assert.deepEqual(with_.map((m) => m.key), []);
    const doc = Catalog.build("footer", Catalog.entries("footer")[0].key, {});
    assert.ok(!("ftMode" in doc.section));
  });
});
