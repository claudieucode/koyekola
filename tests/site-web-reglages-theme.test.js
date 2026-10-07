// Réglages du site (lots 2 et 3) : styles du thème (typographie, liens, listes, boutons, images, champs), identité,
// arrière-plan, mise en page et points de rupture, visionneuse, transitions, CSS personnalisé, réglages supplémentaires.
// Par les vraies routes d'un vrai serveur : on enregistre, on relit, puis on contrôle la page PUBLIÉE et le canevas.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, Client, loginInstructor, newStudent } = require("./helpers");
const { normalizeSettings, DEFAULT_SETTINGS, normalizeSiteCss } = require("../src/marketing/pages/siteSettings");
const { normalizeTokens, DEFAULT_TOKENS } = require("../src/marketing/pages/tokens");
const { themeCss } = require("../src/marketing/pages/themeCss");

const UA = { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 Chrome/120 Safari/537.36" };
const idFrom = (location) => Number(location.match(/(\d+)(#.*)?$/)[1]);
const layout = (children) => ({ id: "sect00000001", type: "layout", children: [{ id: "cont00000001", type: "container", children }] });

describe("moteur de réglages (sans serveur)", () => {
  test("par défaut : aucun CSS de thème — un site existant garde exactement son aspect", () => {
    assert.equal(themeCss(normalizeTokens({})), "");
    assert.deepEqual(normalizeSettings({}), JSON.parse(JSON.stringify(DEFAULT_SETTINGS)));
  });

  test("seules les valeurs réglées produisent du CSS, avec des sélecteurs de faible spécificité (:where) pour les éléments", () => {
    const t = normalizeTokens({
      type: { h2: { letterSpacing: 0.04, transform: "uppercase", fontStyle: "italic", color: "token:primary" } },
      link: { color: "token:accent", underline: "hover", hoverColor: "#112233" }, list: { gap: 10, markerColor: "token:primary" },
      buttons: { paddingY: 14, normal: { bg: "#112233" }, hover: { bg: "#223344", color: "#ffffff" }, focus: { color: "#ff0000", width: 4, offset: 2 } },
      images: { radius: 12, shadow: "md", borderWidth: 2, borderColor: "token:secondary", fit: "cover", position: "top" },
      forms: { bg: "#fafafa", radius: 4, focusColor: "token:primary", placeholderColor: "#777777", accent: "token:primary" },
    }, { strict: true });
    const css = themeCss(t);
    assert.match(css, /\.lp-site :where\(h2\.kw-heading\)\{letter-spacing:0\.04em;text-transform:uppercase;font-style:italic;color:var\(--kw-primary\)\}/);
    assert.doesNotMatch(css, /h1\.kw-heading/, "un niveau non réglé n'émet rien");
    assert.match(css, /\.lp-site \.kw-text a[^{]*\{color:var\(--kw-accent\);text-decoration:none\}/);
    assert.match(css, /\.lp-site \.kw-text a:hover[^{]*\{color:#112233;text-decoration:underline\}/);
    assert.match(css, /\.lp-site :where\(\.kw-list\) > li\{margin-block:5px\}/);
    assert.match(css, /\.lp-site :where\(\.kw-btn-primary, \.lp-btn\)\{background:#112233\}/);
    assert.match(css, /\.lp-site :where\(\.kw-btn-primary, \.lp-btn\):hover\{background:#223344;color:#ffffff\}/);
    assert.match(css, /:focus-visible\{outline:4px solid #ff0000;outline-offset:2px\}/);
    assert.match(css, /border-radius:12px/);
    assert.match(css, /box-shadow:0 4px 16px/);
    assert.match(css, /object-fit:cover;object-position:top/);
    assert.match(css, /::placeholder\{color:#777777;opacity:1\}/);
    assert.match(css, /accent-color:var\(--kw-primary\)/);
    assert.doesNotMatch(css, /</, "aucun caractère de balise");
  });

  test("validation stricte : bornes, listes fermées, couleurs, adresses d'images", () => {
    const bad = (s, re) => assert.throws(() => normalizeSettings(s, { strict: true }), re);
    bad({ layout: { gutter: 999 } }, /Marges latérales/);
    bad({ layout: { breakpoints: { tablet: 900, mobile: 900 } } }, /Point de rupture mobile/);
    bad({ layout: { breakpoints: { tablet: 500 } } }, /Point de rupture tablette/);
    bad({ extras: { language: "xx" } }, /Langue/);
    bad({ transitions: { type: "spin" } }, /Transition de page/);
    bad({ lightbox: { overlayOpacity: 5 } }, /opacité/i);
    bad({ identity: { logoUrl: "javascript:alert(1)" } }, /Logo/);
    bad({ identity: { logoUrl: "/uploads/../secret.png" } }, /Logo/);
    bad({ background: { image: 'https://x.test/a.png");}body{display:none' } }, /Image d'arrière-plan/);
    bad({ background: { color: "rouge" } }, /couleur/i);
    bad({ background: { position: "diagonale" } }, /position/);
    bad({ customCss: "@import url(x);" }, /@/);
    bad({ customCss: "body { color: red; }" }, /sélecteur non autorisé/);
    bad({ customCss: ".a { background: url(https://x.test/a.png); }" }, /n'est pas autorisé/);
    assert.equal(normalizeSettings({ layout: { gutter: 999 } }).layout.gutter, 16, "lecture tolérante : valeur invalide remplacée par la valeur par défaut");
  });

  test("CSS du site : chaque sélecteur est confiné à .lp-site", () => {
    assert.equal(normalizeSiteCss(".kw-button, h1 { color: #0b2a40; }"), ".lp-site .kw-button, .lp-site h1{color:#0b2a40}");
    assert.throws(() => normalizeSiteCss("a { color: red }\ntexte libre"), /en dehors d'une règle/);
    assert.equal(normalizeSiteCss(""), "");
  });
});

describe("réglages du site : effet sur la page publiée (vrai serveur)", () => {
  let srv, boss, db, editor, siteId, pageId, slug, rev;
  const url = () => `/marketing/site-web/sites/${siteId}/reglages.json`;
  const load = async (who = boss) => JSON.parse((await who.get(url())).text);
  const put = (body, who = boss) => who.request(url(), { method: "PUT", json: body });
  const publicHtml = async () => (await new Client(srv.base).get(`/p/${slug}`, { headers: UA })).text;
  async function apply(mutate) {
    const cur = await load();
    const body = { tokens: cur.tokens, settings: cur.settings, revision: cur.revision };
    mutate(body);
    const r = await put(body);
    assert.equal(r.status, 200, r.text);
    rev = JSON.parse(r.text).revision;
    return JSON.parse(r.text);
  }

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    db = srv.db();
    editor = await newStudent(srv);
    db.prepare("INSERT INTO mk_org_members (organization_id, user_id, role) VALUES (1, (SELECT id FROM users WHERE email = ?), 'editor')").run(editor.email);
    siteId = idFrom((await boss.post("/marketing/site-web/sites", { name: "Atelier thème" })).location);
    pageId = idFrom((await boss.post("/marketing/pages", { name: "Page thème", site_id: String(siteId) })).location);
    const content = { sections: [layout([
      { id: "hed000000001", type: "heading", props: { text: "Titre un", level: "1" } },
      { id: "grd000000001", type: "grid", props: {}, styles: { desktop: { columns: 3 }, tablet: { columns: 2 } }, children: [{ id: "txt000000001", type: "text", props: { html: "<p>Un <a href=\"/catalogue\">lien</a></p>" }, hideOn: ["mobile"] }] },
    ])] };
    const revision = db.prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(pageId).revision;
    assert.equal((await boss.request(`/marketing/pages/${pageId}/brouillon`, { method: "PUT", json: { revision, content } })).status, 200);
    assert.equal((await boss.request(`/marketing/pages/${pageId}/publier.json`, { method: "POST", json: {} })).status, 200);
    slug = db.prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(pageId).slug;
    rev = (await load()).revision;
  });
  after(() => srv.stop());

  test("site vierge : aucune règle de thème ni de mise en page n'est ajoutée à la page publiée", async () => {
    const html = await publicHtml();
    assert.match(html, /<html lang="fr">/);
    assert.doesNotMatch(html, /view-transition/);
    assert.match(html, /<link rel="icon" href="\/favicon\.svg"/);
    assert.doesNotMatch(html, /:where\(h1\.kw-heading\)\{/);
  });

  test("Typographie, boutons, images et champs : enregistrés, relus, et présents dans la page publiée", async () => {
    const out = await apply((b) => {
      b.tokens.type.h1.transform = "uppercase"; b.tokens.type.h1.letterSpacing = 0.05; b.tokens.type.h1.color = "token:secondary";
      b.tokens.link.underline = "hover"; b.tokens.link.color = "token:accent";
      b.tokens.buttons.paddingY = 14; b.tokens.buttons.hover.bg = "#223344";
      b.tokens.images.radius = 16; b.tokens.images.shadow = "lg";
      b.tokens.forms.radius = 2; b.tokens.forms.focusColor = "token:primary";
    });
    assert.equal(out.tokens.type.h1.transform, "uppercase", "relu après enregistrement");
    const html = await publicHtml();
    assert.match(html, /:where\(h1\.kw-heading\)\{letter-spacing:0\.05em;text-transform:uppercase;color:var\(--kw-secondary\)\}/);
    assert.match(html, /\.lp-site \.kw-text a[^{]*\{color:var\(--kw-accent\);text-decoration:none\}/);
    assert.match(html, /padding-block:14px/);
    assert.match(html, /\.kw-btn-primary, \.lp-btn\):hover\{background:#223344\}/);
    assert.match(html, /border-radius:16px/);
    assert.match(html, /\.kw-signup-form[^{]*focus-visible[^{]*\{outline:3px solid var\(--kw-primary\)/);
    assert.ok(html.indexOf(":where(h1.kw-heading){letter-spacing") < html.indexOf(".kw-n-grd000000001{"), "le thème précède les styles des éléments, qui restent prioritaires");
  });

  test("le canevas de l'éditeur reçoit les mêmes styles du thème que la page publiée", async () => {
    const r = await boss.request(`/marketing/pages/${pageId}/rendu`, { method: "POST", json: { content: { sections: [layout([{ id: "hed000000001", type: "heading", props: { text: "Titre un", level: "1" } }])] } } });
    assert.equal(r.status, 200);
    assert.match(r.text, /:where\(h1\.kw-heading\)\{letter-spacing:0\.05em/);
  });

  test("Identité : nom, description, logo, favicon, langue, indexation → page publiée (head et pied de page)", async () => {
    await apply((b) => {
      b.name = "Atelier Nakewenze";
      b.settings.identity = { description: "Mode et art de vivre, choisis pour durer.", logoUrl: "/uploads/thumbnails/logo.png", logoMobileUrl: "/uploads/thumbnails/logo-mobile.png", faviconUrl: "/uploads/thumbnails/fav.png" };
      b.settings.extras.language = "en";
    });
    const html = await publicHtml();
    assert.match(html, /<html lang="en">/);
    assert.match(html, /<meta name="description" content="Mode et art de vivre, choisis pour durer\.">/);
    assert.match(html, /<meta property="og:site_name" content="Atelier Nakewenze">/);
    assert.match(html, /<link rel="icon" href="\/uploads\/thumbnails\/fav\.png">/);
    assert.match(html, /<footer class="lp-foot"><a href="\/"><picture><source media="\(max-width: 767px\)" srcset="\/uploads\/thumbnails\/logo-mobile\.png"><img class="lp-foot-logo" src="\/uploads\/thumbnails\/logo\.png" alt="Atelier Nakewenze">/);
    assert.match(html, /<meta property="og:image" content="https:\/\/k\.test\/uploads\/thumbnails\/logo\.png">/, "le logo sert d'image de partage quand la page n'en a pas");
    assert.equal((await load()).site.name, "Atelier Nakewenze", "le nom du site est relu");
    // description propre à la page : elle l'emporte
    db.prepare("UPDATE mk_landing_pages SET description = 'Description de la page' WHERE id = ?").run(pageId);
    assert.match(await publicHtml(), /<meta name="description" content="Description de la page">/);
    db.prepare("UPDATE mk_landing_pages SET description = '' WHERE id = ?").run(pageId);
  });

  test("noms de site : un doublon est refusé", async () => {
    await boss.post("/marketing/site-web/sites", { name: "Autre atelier" });
    const cur = await load();
    const r = await put({ tokens: cur.tokens, settings: cur.settings, name: "autre atelier", revision: cur.revision });
    assert.equal(r.status, 422);
    assert.match(JSON.parse(r.text).error.message, /porte déjà ce nom/);
  });

  test("Arrière-plan et Mise en page : couleur, dégradé, image, largeurs, marges", async () => {
    await apply((b) => {
      b.settings.background = { color: "token:surface", gradient: { enabled: true, from: "token:primary", to: "#112233", angle: 90 }, image: "/uploads/thumbnails/fond.jpg", position: "top", size: "cover", repeat: "no-repeat", fixed: true };
      b.settings.layout = { fullWidth: false, contentWidth: 900, containerWidth: 1200, gutter: 32, breakpoints: { tablet: 1023, mobile: 767 } };
    });
    const html = await publicHtml();
    assert.match(html, /\.lp-site\.lp-body\{background-color:var\(--kw-surface\);background-image:linear-gradient\(90deg, var\(--kw-primary\), #112233\),url\("\/uploads\/thumbnails\/fond\.jpg"\);background-position:top;background-size:cover;background-repeat:no-repeat\}/);
    assert.match(html, /@media \(min-width:1025px\)\{\.lp-site\.lp-body\{background-attachment:fixed\}\}/);
    assert.match(html, /\.lp-site \.lp-main\{max-width:900px;padding-left:32px;padding-right:32px\}/);
    assert.match(html, /:where\(\.kw-container:not\(\.kw-full\)\)\{max-width:1200px\}/);
    await apply((b) => { b.settings.layout.fullWidth = true; });
    assert.match(await publicHtml(), /\.lp-site \.lp-main\{max-width:none;padding-left:32px;padding-right:32px\}/);
  });

  test("Points de rupture : le CSS des éléments et « masquer sur cet écran » suivent les réglages du site", async () => {
    let html = await publicHtml();
    assert.match(html, /@media \(max-width: 1023px\)\{\.kw-n-grd000000001\{grid-template-columns:repeat\(2/);
    assert.match(html, /@media \(max-width:767px\)\{\.lp-hide-mobile\{display:none\}\}/);
    await apply((b) => { b.settings.layout.breakpoints = { tablet: 1100, mobile: 700 }; });
    html = await publicHtml();
    assert.match(html, /@media \(max-width: 1100px\)\{\.kw-n-grd000000001\{grid-template-columns:repeat\(2/);
    assert.match(html, /@media \(max-width:700px\)\{\.lp-hide-mobile\{display:none\}\}/);
    assert.match(html, /@media \(min-width:1101px\)\{\.lp-hide-desktop\{display:none\}\}/);
    assert.doesNotMatch(html, /max-width: 1023px\)\{\.kw-n-grd/, "l'ancien seuil n'est plus utilisé");
    assert.equal((await boss.get("/css/landing.css")).text.includes("lp-hide-"), false, "plus de seuil fixe dans la feuille de style de base");
  });

  test("Visionneuse : attributs et variables sur la page, valeurs relues", async () => {
    await apply((b) => { b.settings.lightbox = { enabled: false, overlay: "#102030", overlayOpacity: 60, arrows: false, closeOnOverlay: false, captions: false, animation: "zoom" }; });
    const html = await publicHtml();
    assert.match(html, /<body[^>]* data-kw-lb="off" data-kw-lb-arrows="0" data-kw-lb-overlay-close="0" data-kw-lb-captions="0" data-kw-lb-anim="zoom"/);
    assert.match(html, /--kw-lb-overlay:rgba\(16,32,48,0\.6\)/);
  });

  test("Transitions : règle de transition entre pages sur le site publié, jamais dans l'éditeur ; « aucune » la retire", async () => {
    await apply((b) => { b.settings.transitions = { type: "slide", duration: 400 }; });
    let html = await publicHtml();
    assert.match(html, /@media \(prefers-reduced-motion:no-preference\)\{@view-transition\{navigation:auto\}/);
    assert.match(html, /animation:400ms ease both kw-vt-out/);
    assert.match(html, /translateX\(-24px\)/);
    const canvas = await boss.request(`/marketing/pages/${pageId}/rendu`, { method: "POST", json: { content: { sections: [layout([{ id: "hed000000001", type: "heading", props: { text: "T", level: "2" } }])] } } });
    assert.doesNotMatch(canvas.text, /view-transition/, "pas de transition dans le canevas de l'éditeur");
    await apply((b) => { b.settings.transitions = { type: "none", duration: 400 }; });
    assert.doesNotMatch(await publicHtml(), /view-transition/);
  });

  test("Réglages supplémentaires : défilement doux et « ne pas indexer » s'appliquent à toutes les pages du site", async () => {
    await apply((b) => { b.settings.extras.smoothScroll = true; b.settings.extras.noindex = true; });
    const html = await publicHtml();
    assert.match(html, /@media \(prefers-reduced-motion:no-preference\)\{html\{scroll-behavior:smooth\}\}/);
    assert.match(html, /<meta name="robots" content="noindex, nofollow">/);
    await apply((b) => { b.settings.extras.noindex = false; });
  });

  test("CSS personnalisé : validé, confiné à .lp-site, appliqué sur le site publié et le canevas ; invalide refusé sans rien écraser", async () => {
    await apply((b) => { b.settings.customCss = ".kw-button { letter-spacing: 1px; }\nh1 { margin-bottom: 8px; }"; });
    const html = await publicHtml();
    assert.match(html, /\.lp-site \.kw-button\{letter-spacing:1px\}\n\.lp-site h1\{margin-bottom:8px\}/);
    const canvas = await boss.request(`/marketing/pages/${pageId}/rendu`, { method: "POST", json: { content: { sections: [layout([{ id: "hed000000001", type: "heading", props: { text: "T", level: "2" } }])] } } });
    assert.match(canvas.text, /\.lp-site \.kw-button\{letter-spacing:1px\}/);
    const cur = await load();
    for (const [css, re] of [["@import url(//evil.test/x.css);", /@/], ["body { display: none; }", /sélecteur non autorisé/], [".a { background: url(https://evil.test/p.png); }", /n'est pas autorisé/], [`.a { color: red; }${"x".repeat(21000)}`, /caractères au plus/], ["</style><script>alert(1)</script>", /n'est pas autorisé|<|>/]]) {
      const r = await put({ tokens: cur.tokens, settings: { ...cur.settings, customCss: css }, revision: cur.revision });
      assert.equal(r.status, 422, css.slice(0, 30));
      assert.match(JSON.parse(r.text).error.message, re);
    }
    assert.equal((await load()).settings.customCss.includes("letter-spacing"), true, "le CSS valide est conservé après les refus");
    assert.doesNotMatch(await publicHtml(), /<script>alert/);
  });

  test("droits : un rédacteur règle le thème mais ne peut pas modifier le CSS du site (code) ; un élève n'a aucun accès", async () => {
    const cur = await load();
    const settings = JSON.parse(JSON.stringify(cur.settings));
    // le rédacteur lit, y compris le CSS, avec canCode faux
    const seen = await load(editor);
    assert.equal(seen.canWrite, true);
    assert.equal(seen.canCode, false);
    // modifier un réglage non code : permis
    settings.layout.gutter = 20;
    const ok = await put({ tokens: cur.tokens, settings, revision: cur.revision }, editor);
    assert.equal(ok.status, 200, ok.text);
    const next = JSON.parse(ok.text);
    // modifier le CSS : refusé (403), rien n'est changé
    const denied = await put({ tokens: next.tokens, settings: { ...next.settings, customCss: ".x { color: red; }" }, revision: next.revision }, editor);
    assert.equal(denied.status, 403);
    assert.match(JSON.parse(denied.text).error.message, /pages\.code/);
    assert.equal((await load()).settings.customCss.includes(".x"), false);
    // renvoyer le même CSS (sans le modifier) : permis
    const same = await put({ tokens: next.tokens, settings: next.settings, revision: next.revision }, editor);
    assert.equal(same.status, 200, "ne pas toucher au CSS ne demande pas la permission code");
    const student = await newStudent(srv);
    assert.notEqual((await student.get(url())).status, 200);
  });

  test("un autre site n'est pas affecté, et la duplication d'un site copie ses réglages", async () => {
    const otherId = idFrom((await boss.post("/marketing/site-web/sites", { name: "Site voisin" })).location);
    const other = JSON.parse((await boss.get(`/marketing/site-web/sites/${otherId}/reglages.json`)).text);
    assert.deepEqual(other.settings, JSON.parse(JSON.stringify(DEFAULT_SETTINGS)));
    assert.deepEqual(other.tokens.type.h1, DEFAULT_TOKENS.type.h1);
    const d = await boss.post(`/marketing/site-web/sites/${siteId}/dupliquer`, {});
    const copyId = idFrom(d.location);
    const copy = JSON.parse((await boss.get(`/marketing/site-web/sites/${copyId}/reglages.json`)).text);
    const source = await load();
    assert.deepEqual(copy.settings, source.settings, "réglages copiés");
    assert.deepEqual(copy.tokens, source.tokens, "jetons copiés");
  });

  test("valeurs hors limites refusées par l'API, sans consommer de révision", async () => {
    const cur = await load();
    const tryBad = async (mutate, re) => {
      const body = { tokens: JSON.parse(JSON.stringify(cur.tokens)), settings: JSON.parse(JSON.stringify(cur.settings)), revision: cur.revision };
      mutate(body);
      const r = await put(body);
      assert.equal(r.status, 422);
      assert.match(JSON.parse(r.text).error.message, re);
    };
    await tryBad((b) => { b.settings.layout.contentWidth = 100; }, /Largeur du contenu/);
    await tryBad((b) => { b.settings.layout.breakpoints = { tablet: 900, mobile: 800 }; }, /Point de rupture mobile/);
    await tryBad((b) => { b.settings.identity.logoUrl = "http://x.test/a.png"; }, /Logo/);
    await tryBad((b) => { b.tokens.buttons.paddingY = 1; }, /marge intérieure verticale/);
    await tryBad((b) => { b.tokens.type.h3.color = "bleu"; }, /couleur attendue/);
    await tryBad((b) => { b.tokens.images.fit = "stretch"; }, /ajustement/);
    assert.equal((await load()).revision, cur.revision);
  });
});
