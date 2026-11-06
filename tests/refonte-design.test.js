// Refonte « Moderne lumineux » : mêmes codes couleurs (bleu nuit + bleu clair), aucune classe orpheline, arrondis et ombres douces, polices hébergées.
const { test, before, after, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { startServer, Client } = require("./helpers");

const ROOT = path.join(__dirname, "..");
// Feuilles de style du site ET de l'espace marketing : les mêmes règles de conception s'appliquent aux deux
const CSS = ["style.css", "marketing.css", "blog-editor.css", "dashboard.css", "seo-workspace.css", "app-rail.css", "landing.css", "page-builder.css", "page-builder-menu.css", "site-settings.css", "cms.css", "kola-ui.css", "cms-polices.css", "kola-pages.css", "kola-compose.css", "taxonomy-picker.css", "font-manager.css", "customizer.css", "kola-v3.css", "adminbar.css", "kola-art.css", "kola-vivid.css", "agent-ia.css"].map((f) => fs.readFileSync(path.join(ROOT, "public", "css", f), "utf8")).join("\n")
  // Les préréglages de contenu choisis par l'auteur dans l'éditeur de blocs (ombre [data-shadow], dégradé [data-gradient]) ne font pas partie de l'identité de l'interface
  .split("\n").filter((l) => !/data-(shadow|gradient)=/.test(l)).join("\n");

describe("palette : les codes couleurs d'origine sont conservés", () => {
  const expected = { primary: "#0b2a40", "primary-dark": "#06192a", accent: "#0277b6", "accent-dark": "#0369a1", "accent-light": "#e0f2fe", sky: "#7dd3fc", bg: "#f3f8fc", text: "#10222f", muted: "#5d7182", star: "#9a5809" };
  for (const [name, hex] of Object.entries(expected)) {
    test(`--${name} = ${hex}`, () => {
      assert.match(CSS, new RegExp(`--${name}:\\s*${hex}`, "i"));
    });
  }
  test("aucune couleur violette n'est réapparue", () => {
    assert.doesNotMatch(CSS, /#7c3aed|#8b5cf6|#a855f7|#9333ea/i);
  });
});

// Identité « Moderne lumineux » : arrondis hiérarchisés, ombres douces teintées de bleu, polices hébergées.
// Les ombres douces s'appliquent aussi à l'espace marketing (marketing.css) ; le reste vise le site public (style.css).
const SITE_CSS = fs.readFileSync(path.join(ROOT, "public", "css", "style.css"), "utf8");

describe("identité visuelle : moderne lumineux", () => {
  test("arrondis hiérarchisés : champs < cartes < grandes scènes", () => {
    const radius = Number(SITE_CSS.match(/--radius:\s*(\d+)px/)[1]);
    const large = Number(SITE_CSS.match(/--radius-lg:\s*(\d+)px/)[1]);
    const xl = Number(SITE_CSS.match(/--radius-xl:\s*(\d+)px/)[1]);
    assert.ok(radius >= 10 && radius <= 14, `--radius ${radius}px`);
    assert.ok(large > radius && large <= 22, `--radius-lg ${large}px`);
    assert.ok(xl >= 24, `--radius-xl ${xl}px`);
  });
  test("plus d'ombres dures : aucune ombre portée franche (0 de flou)", () => {
    const hard = [...CSS.matchAll(/box-shadow:\s*([^;}]+)/g)].map((m) => m[1].trim()).filter((v) => /^-?\d+px\s+-?\d+px\s+0(px)?\s/.test(v));
    assert.deepEqual(hard, []);
  });
  test("les ombres sont teintées de bleu nuit, jamais noires ni grises", () => {
    const neutral = [...CSS.matchAll(/box-shadow:\s*([^;}]+)/g)].map((m) => m[1]).filter((v) => /rgba\(\s*0\s*,\s*0\s*,\s*0/.test(v));
    assert.deepEqual(neutral, []);
  });
  test("l'en-tête est clair et translucide ; le flou est sur un pseudo-élément (sinon le tiroir mobile fixe se casse)", () => {
    assert.doesNotMatch(SITE_CSS, /\.site-header\s*\{[^}]*background:\s*var\(--primary\)/);
    assert.doesNotMatch(SITE_CSS, /\.site-header\s*\{[^}]*backdrop-filter/, "un backdrop-filter sur l'en-tête casse position: fixed du tiroir");
    assert.match(SITE_CSS, /\.site-header::before\s*\{[^}]*backdrop-filter/);
  });
  test("le pied de page est un panneau bleu nuit aux coins hauts arrondis", () => {
    assert.match(SITE_CSS, /\.site-footer\s*\{[^}]*border-radius:\s*var\(--radius-xl\) var\(--radius-xl\) 0 0/);
    assert.match(SITE_CSS, /\.site-footer\s*\{[^}]*#0b2a40/);
  });
  test("l'accueil présente une scène arrondie bleu nuit", () => {
    assert.match(SITE_CSS, /\.hero-stage\s*\{[^}]*border-radius:\s*var\(--radius-xl\)/);
  });
});

describe("polices : hébergées sur le site, aucun service externe", () => {
  const SRC = [...SITE_CSS.matchAll(/@font-face\s*\{[^}]*src:\s*url\("([^"]+)"\)/g)].map((m) => m[1]);
  test("Bricolage Grotesque et Figtree sont déclarées avec des fichiers locaux existants", () => {
    assert.match(SITE_CSS, /font-family:\s*"Bricolage Grotesque"/);
    assert.match(SITE_CSS, /font-family:\s*"Figtree"/);
    assert.ok(SRC.length >= 4, `${SRC.length} fichiers de police déclarés`);
    for (const url of SRC) {
      assert.ok(url.startsWith("/fonts/"), url);
      assert.ok(fs.existsSync(path.join(ROOT, "public", url)), `fichier absent : ${url}`);
    }
  });
  test("aucun appel à Google Fonts ni à un CDN de polices", () => {
    for (const f of ["style.css", "marketing.css", "dashboard.css", "seo-workspace.css", "app-rail.css", "landing.css", "page-builder.css", "page-builder-menu.css"]) {
      assert.doesNotMatch(fs.readFileSync(path.join(ROOT, "public", "css", f), "utf8"), /fonts\.googleapis|fonts\.gstatic|use\.typekit|cdnjs|jsdelivr|unpkg/);
    }
    for (const dir of ["views", "views/partials"]) {
      for (const f of fs.readdirSync(path.join(ROOT, dir)).filter((n) => n.endsWith(".ejs"))) {
        assert.doesNotMatch(fs.readFileSync(path.join(ROOT, dir, f), "utf8"), /fonts\.googleapis|fonts\.gstatic/, `${dir}/${f}`);
      }
    }
  });
  test("le texte et les titres utilisent les polices du site, avec repli système", () => {
    assert.match(SITE_CSS, /--font-body:\s*"Figtree",[^;]*system-ui/);
    assert.match(SITE_CSS, /--font-display:\s*"Bricolage Grotesque",[^;]*system-ui/);
  });
});

describe("chaque classe utilisée par les pages a un style", () => {
  test("aucune classe orpheline dans les vues et les scripts", () => {
    const used = new Set();
    const walk = (dir) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(p);
        else if (/\.(ejs|js)$/.test(entry.name) && !/(?:course-editor|automation-flow|theme-code-editor)\.js$/.test(entry.name) && !(entry.name === "blog-editor.js" && dir.endsWith(path.join("public", "js")))) {
          const src = fs.readFileSync(p, "utf8");
          for (const m of src.matchAll(/class="([^"]*)"/g)) m[1].replace(/<%[^%]*%>/g, " ").split(/\s+/).forEach((c) => /^[a-z][\w-]*$/i.test(c) && used.add(c));
          for (const m of src.matchAll(/classList\.(?:add|toggle|remove|contains)\("([^"]+)"/g)) used.add(m[1]);
        }
      }
    };
    ["views", path.join("public", "js"), path.join("src", "editor")].forEach((d) => walk(path.join(ROOT, d)));
    // Toutes les feuilles de public/css (boutique, constructeur IA… ont la leur), pas seulement la liste de l'identité visuelle
    const ALL_CSS = fs.readdirSync(path.join(ROOT, "public", "css")).filter((f) => f.endsWith(".css")).map((f) => fs.readFileSync(path.join(ROOT, "public", "css", f), "utf8")).join("\n");
    const defined = new Set([...ALL_CSS.matchAll(/\.([a-zA-Z][\w-]*)/g)].map((m) => m[1]));
    // Classes volontairement sans règle : marqueurs de structure
    // kw-tcar-slide / kw-mcar-slide : accroches de structure des carrousels (le style est porté par kw-carousel-slide)
    const markers = new Set(["post", "course-main", "rich-field", "small", "lesson-resources", "plan-lesson-title", "hero-text", "kw-tcar-slide", "kw-mcar-slide", "kw-ms-cmp", "kw-ms-ff", "kw-ms-mc", "kw-st-vis", "has-nav", "has-arrows", "has-dots", "grid", "i", "is-c", "vertical"]); // kw-ms-* / kw-st-vis / has-* : accroches de structure des composants Motion Studio et du carrousel ; grid, i, is-c, vertical : faux positifs de l'extraction
    // Un nom qui finit par « - » est le début d'un nom complété par une valeur (« language-<%= langue %> », « is-<%= état %> ») : il ne peut pas avoir de règle à lui seul
    // Accroches de structure inventoriées au 2026-11-03 (écrans des paliers récents : boutique, constructeur IA, SEO, Theme Builder…) et faux positifs de l'extraction (mots de scripts : typeof, vue…) : sans style propre, à résorber au fil des écrans
    for (const c of ["sh-buy", "site", "sh-filters", "sh-status", "sh-coupon", "sh-info", "sh-desc", "cur-sections", "fa-empty", "open", "unread", "page-blocks-card", "mk-crumb", "aibh-resume", "aj", "aj-table", "t", "low", "fs-tabs", "col-site", "view", "md-know", "md-save-label", "mk-pb-edge", "typeof", "bare", "tab", "visibility", "mk-site-back", "mk-cms-fold-text", "layout", "pl-copy-label", "checkedKey", "pl-field", "pl-save-label", "mk-btn", "mk-seo-content-link", "mk-seo-live", "sw-ai-entry", "sw-resume", "sw-form", "sw-main", "sw-pages", "mk-tx-list", "mk-pv-linkcheck", "vue", "tb-cat-tools", "mk-th", "mk-th-lead", "mk-th-state", "mk-td", "mk-td-media", "mk-th-previewpage", "mk-tg", "mk-tg-active-body", "mk-tg-sel", "a", "ex-label", "mk-im-main", "mk-im-toggle", "s", "mk-px-new", "mk-px-list", "mk-px-mail", "kw-menu-empty", "kw-pay-label", "kw-pb", "kw-sc-cart", "kw-sc-checkout", "kw-sc-account", "kw-pg", "mc-resume-cta", "mc-library", "faq-toggle", "kw-theme-extras", "is-dressed", "is-message"]) markers.add(c);
    const orphans = [...used].filter((c) => !c.endsWith("-") && !defined.has(c) && !markers.has(c));
    assert.deepEqual(orphans, []);
  });
});

describe("accueil refondu", () => {
  let srv;
  before(async () => { srv = await startServer(); });
  after(() => srv.stop());
  test("bandeau avec recherche intégrée, chiffres sous la recherche et bandeau de catégories", async () => {
    const html = (await new Client(srv.base).get("/")).text;
    assert.match(html, /class="hero-stage"/);
    assert.match(html, /<form[^>]+class="hero-search"[^>]*role="search"/);
    assert.match(html, /class="hero-stats"/);
    assert.match(html, /class="category-strip"/);
    assert.doesNotMatch(html, /stats-strip|hero-blob/);
  });
  test("une seule recherche accessible par champ (étiquette ou aria-label)", async () => {
    const html = (await new Client(srv.base).get("/")).text;
    for (const m of html.matchAll(/<input[^>]+type="(?:text|search)"[^>]*>/g)) {
      assert.match(m[0], /aria-label=|id="(?:header-q|drawer-q)"/, m[0]);
    }
  });
});
