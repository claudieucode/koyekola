// KOLAKISA — infobulles de l'administration : une seule source (public/js/kola-tips-data.js), un texte réel pour chaque écran du menu, jamais de phrase générique
// répétée, et le mécanisme d'affichage ([data-tip]) présent dans la coque. Le comportement au survol est vérifié par le parcours navigateur (hors suite).
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.join(__dirname, "..");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const win = {};
vm.runInNewContext(read("public/js/kola-tips-data.js"), { window: win });
const TIPS = win.KOLA_TIPS;
const cmsNav = require("../src/marketing/web/cmsNav");
const mkNav = require("../src/marketing/web/nav");

// Même normalisation que le script : sans /marketing, sans /sites/<id>, sans /principal
const keyOf = (href) => {
  let p = href.replace(/^\/marketing/, "").replace(/\/sites\/\d+(?=\/|$)/, "").replace(/\/principal(?=\/|$)/, "").replace(/\/$/, "");
  if (p === "/site-web/principal") p = "/site-web";
  return p;
};

describe("infobulles : registre", () => {
  test("chaque entrée du menu CMS et du menu Marketing a une infobulle qui explique sa fonction", () => {
    const hrefs = new Set();
    for (const s of cmsNav.SECTIONS) for (const i of s.items) hrefs.add(i.href);
    for (const i of mkNav.ITEMS) hrefs.add(i.href);
    const missing = [...hrefs].filter((h) => !TIPS.nav[keyOf(h)]);
    assert.deepEqual(missing, [], `écrans sans infobulle : ${missing.join(", ")}`);
    assert.ok(hrefs.size >= 100, `${hrefs.size} écrans recensés`);
  });
  test("chaque rubrique du menu (Marketing et CMS) a son infobulle de groupe", () => {
    const keys = new Set([...mkNav.SECTIONS.map((s) => s.key), ...cmsNav.SECTIONS.map((s) => s.key)]);
    const missing = [...keys].filter((k) => !TIPS.group[k]);
    assert.deepEqual(missing, [], `rubriques sans infobulle : ${missing.join(", ")}`);
  });
  test("aucune infobulle générique : textes uniques, assez explicites, pas de simple répétition du libellé", () => {
    const seen = new Map();
    for (const [k, v] of Object.entries(TIPS.nav)) {
      assert.ok(v.length >= 30 && v.length <= 160, `« ${k} » : ${v.length} caractères`);
      assert.match(v, /[.!]$/, `« ${k} » : doit finir par un point`);
      assert.ok(!/^Ouvre (la page|l'écran)\b/i.test(v), `« ${k} » : texte générique`);
      if (seen.has(v)) assert.fail(`« ${k} » répète le texte de « ${seen.get(v)} »`);
      seen.set(v, k);
    }
    for (const [k, v] of Object.entries(TIPS.status)) assert.ok(v.length >= 20, `statut « ${k} »`);
  });
  test("les statuts courants des campagnes, formulaires et scénarios sont expliqués", () => {
    for (const w of ["brouillon", "publié", "programmé", "envoyé", "en pause", "actif", "archivé", "échec", "abonné", "désinscrit", "bloqués", "pas de consentement"]) assert.ok(TIPS.status[w], w);
  });
});

describe("infobulles : mécanisme dans la coque", () => {
  test("le script partagé et ses textes sont chargés par toutes les pages d'administration, et la feuille de style les met en forme", () => {
    const bottom = read("views/marketing/partials/bottom.ejs"), top = read("views/marketing/partials/top.ejs");
    assert.match(bottom, /kola-tips-data\.js/); assert.match(bottom, /kola-pages\.js/); assert.match(top, /kola-pages\.css/);
    assert.ok(bottom.indexOf("kola-tips-data.js") < bottom.indexOf("kola-pages.js"), "les textes sont chargés avant le script");
    const css = read("public/css/kola-pages.css");
    for (const f of [".kola-tip", "[data-side=\"top\"]", "prefers-reduced-motion", ".is-on"]) assert.ok(css.includes(f), f);
  });
  test("le script gère clavier (focus, Échap), tactile, positionnement et nom accessible", () => {
    const js = read("public/js/kola-pages.js");
    for (const f of ["focusin", "Escape", "coarse", "aria-describedby", "role\", \"tooltip", "getBoundingClientRect", "removeAttribute(\"title\")"]) assert.ok(js.includes(f), f);
  });
  test("les écrans refondus portent leurs propres infobulles (chiffres, colonnes, actions)", () => {
    for (const [file, min] of [["views/marketing/dashboard.ejs", 10], ["views/marketing/campaigns.ejs", 6], ["views/marketing/templates.ejs", 6]]) {
      const n = (read(file).match(/data-tip="/g) || []).length;
      assert.ok(n >= min, `${file} : ${n} infobulles (minimum ${min})`);
    }
  });
});
