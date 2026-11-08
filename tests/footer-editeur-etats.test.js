// CHANTIER D du Footer Builder : états (survol / focus / clic) PAR ÉCRAN, mouvement réduit général, options du pied.
// Voir docs/footer-builder/FOOTER_EDITEUR_ETATS_ET_MOUVEMENT.md.
//  - modèle et CSS serveur (sans navigateur) : états × écrans × héritage, anciennes données lues telles quelles, mouvement réduit, contour de focus conservé ;
//  - vrai Chrome (page publiée) : un survol réglé pour le mobile n'écrase pas l'ordinateur ; le mouvement réduit ÉMULÉ neutralise les transitions,
//    mais la couleur au survol (sans durée) reste instantanée ; le focus clavier est visible ;
//  - vrai éditeur : le sélecteur d'état écrit dans la bonne clé (« hover@mobile ») sans toucher aux voisins ni à l'ordinateur.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");
const cdp = require("./helpers-chrome-cdp");
const nodes = require("../src/marketing/pages/nodes");
const sections = require("../src/marketing/pages/sections");
const patterns = require("../src/marketing/pages/patterns");

const SKIP = cdp.SKIP;
const wait = cdp.wait;
const ID = (s) => String(s).padEnd(12, "0");
const btn = (id, extra) => ({ id: ID(id), type: "button", props: { label: id, url: "https://kolakisa.com/" }, children: [], ...(extra || {}) });
const page = (...kids) => [{ id: ID("sect1"), type: "layout", children: [{ id: ID("cont1"), type: "container", props: {}, children: kids }] }];
const clean = (secs) => sections.normalizeSections({}, JSON.parse(JSON.stringify(secs)));
const rulesOf = (css) => css.split("\n");

describe("états par écran : modèle et CSS serveur", () => {
  test("anciennes données (états sans écran) : même CSS qu'avant, écrit une seule fois pour tous les écrans", () => {
    const old = page(btn("bta", { states: { hover: { backgroundColor: "#ff0000" }, focus: { outlineStyle: "solid", outlineWidth: "3px" }, active: { opacity: 0.5 } } }));
    const css = nodes.pageCss(clean(old));
    assert.match(css, /\.kw-n-bta000000000:hover\{background-color:#ff0000\}/);
    assert.match(css, /\.kw-n-bta000000000\.kw-n-bta000000000:focus-visible\{outline-style:solid;outline-width:3px\}/); // seul écart voulu : le contour réglé par l'auteur l'emporte sur celui du site (spécificité doublée)
    assert.match(css, /\.kw-n-bta000000000:active\{opacity:0\.5\}/);
    assert.doesNotMatch(css, /@media/, "aucun écran particulier : aucune requête de média");
  });
  test("le modèle accepte hover, hover@tablet, hover@mobile, hover@wide et refuse une clé inconnue (ignorée, jamais écrite)", () => {
    const secs = clean(page(btn("btb", { states: { hover: { color: "#111111" }, "hover@tablet": { color: "#222222" }, "hover@mobile": { color: "#333333" }, "hover@wide": { color: "#444444" }, "hover@xxl": { color: "#555555" }, "pressed": { color: "#666666" } } })));
    const st = secs[0].children[0].children[0].states;
    assert.deepEqual(Object.keys(st).sort(), ["hover", "hover@mobile", "hover@tablet", "hover@wide"]);
  });
  test("héritage ordinateur → tablette → mobile : chaque écran a sa règle dans SA requête de média, après celle de l'ordinateur", () => {
    const css = nodes.pageCss(clean(page(btn("btc", { states: { hover: { color: "#111111", backgroundColor: "#eeeeee" }, "hover@mobile": { color: "#333333" } } }))));
    const base = css.indexOf(".kw-n-btc000000000:hover{"), media = css.indexOf("@media (max-width: 767px){.kw-n-btc000000000:hover{color:#333333}}");
    assert.ok(base >= 0 && media > base, css);
    assert.doesNotMatch(css.slice(media), /#eeeeee/, "le mobile ne redit pas le fond : il l'hérite de l'ordinateur par la cascade");
    assert.doesNotMatch(css, /@media \(max-width: 1023px\)\{[^}]*:hover/, "la tablette n'a pas de règle propre");
  });
  test("grand écran : requête min-width, sans toucher à la tablette ni au mobile", () => {
    const css = nodes.pageCss(clean(page(btn("btd", { states: { "hover@wide": { color: "#444444" } } }))), { tablet: 1023, mobile: 767, wide: 1600 });
    assert.match(css, /@media \(min-width: 1600px\)\{\.kw-n-btd000000000:hover\{color:#444444\}\}/);
  });
  test("isolation : l'état d'un bouton n'écrit aucune règle pour son voisin", () => {
    const css = nodes.pageCss(clean(page(btn("bte", { states: { "hover@mobile": { color: "#333333" } } }), btn("btf"))));
    assert.doesNotMatch(css, /btf000000000/);
    for (const r of rulesOf(css).filter((x) => x.includes("{"))) assert.match(r, /kw-n-bte000000000|^@media/);
  });
  test("parties d'un widget : les états par écran suivent la même règle (état autorisé par le registre, écran libre)", () => {
    const secs = clean([{ id: ID("sect2"), type: "layout", children: [{ id: ID("cont2"), type: "container", props: {}, children: [{ id: ID("men1"), type: "menu", props: { source: "manual", items: [{ label: "A", url: "/a" }] }, parts: { link: { states: { hover: { color: "#111111" }, "hover@mobile": { color: "#222222" } } } } }] }] }]);
    const css = nodes.pageCss(secs);
    assert.match(css, /\.kw-node\.kw-n-men100000000 [^{]*:hover\{color:#111111\}/);
    assert.match(css, /@media \(max-width: 767px\)\{\.kw-node\.kw-n-men100000000 [^{]*:hover\{color:#222222\}/);
  });
  test("classes globales : mêmes états par écran", () => {
    const css = nodes.classCss([{ name: "bouton-x", styles: {}, states: { hover: { color: "#111111" }, "hover@tablet": { color: "#222222" } } }]);
    assert.match(css, /:where\(\.bouton-x\):hover\{color:#111111\}/);
    assert.match(css, /@media \(max-width: 1023px\)\{[^}]*:hover\{color:#222222\}/);
  });
});

describe("mouvement réduit général et contour de focus", () => {
  test("une transition posée à la main produit UNE règle générale sous prefers-reduced-motion: reduce (pas une par élément)", () => {
    const css = nodes.pageCss(clean(page(btn("btg", { styles: { desktop: { transitionDuration: 300 } } }), btn("bth", { styles: { desktop: { transitionDuration: 500 } } }))));
    const rule = /@media \(prefers-reduced-motion:reduce\)\{[^}]*\{transition:none!important\}\}/g;
    assert.equal((css.match(rule) || []).length, 1);
    assert.match(css, /\.kw-node:not\(\[data-kw-motion-always\]/);
  });
  test("sans transition ni mouvement, rien n'est ajouté (sortie inchangée pour les anciennes pages)", () => {
    assert.doesNotMatch(nodes.pageCss(clean(page(btn("bti", { states: { hover: { backgroundColor: "#ff0000" } } })))), /prefers-reduced-motion/);
  });
  test("transformation au survol : réservée à « mouvement non réduit » ; la couleur au survol reste instantanée (hors requête)", () => {
    const css = nodes.pageCss(clean(page(btn("btj", { states: { hover: { backgroundColor: "#ff0000", transform: { scale: 1.1 } } } }))));
    assert.match(css, /\.kw-n-btj000000000:hover\{background-color:#ff0000\}/);
    assert.match(css, /@media \(prefers-reduced-motion:no-preference\)\{\.kw-n-btj000000000:hover\{transform:scale\(1\.1\)/);
    assert.doesNotMatch(css.replace(/@media \(prefers-reduced-motion:no-preference\)\{[^]*?\}\}/g, ""), /transform:scale/);
  });
  test("option « garder malgré le mouvement réduit » (alerte déjà existante) : la transformation reste écrite telle quelle", () => {
    const css = nodes.pageCss(clean(page(btn("btk", { motion: { entrance: "fade", alwaysMotion: true }, states: { hover: { transform: { scale: 1.1 } } } }))));
    assert.match(css, /\.kw-n-btk000000000:hover\{transform:scale\(1\.1\)/);
  });
  test("focus : un état focus qui supprime le contour sans repère de remplacement garde le contour ; avec une ombre ou une bordure, il est respecté", () => {
    const sans = nodes.pageCss(clean(page(btn("btl", { states: { focus: { outlineStyle: "none", color: "#111111" } } }))));
    assert.match(sans, /:focus-visible\{color:#111111\}/);
    assert.doesNotMatch(sans, /outline-style:none/);
    const avec = nodes.pageCss(clean(page(btn("btm", { states: { focus: { outlineStyle: "none", boxShadow: "md" } } }))));
    assert.match(avec, /outline-style:none/);
  });
  test("pied : le bloc « Barre du bas » est valide, sépare par un trait en haut et se range en colonne sur mobile", () => {
    const p = patterns.PATTERNS.find((x) => x.key === "footer-bar");
    assert.ok(p);
    const secs = sections.normalizeSections({}, p.build({}).map((s) => ({ ...s, id: sections.newSectionId() })));
    const css = nodes.pageCss(secs);
    assert.match(css, /border-top-width:1px/);
    assert.match(css, /@media \(max-width: 767px\)\{[^}]*flex-direction:column/);
    const kinds = JSON.stringify(secs);
    for (const t of ["copyright", "bizlegal", "backtotop"]) assert.match(kinds, new RegExp(`"type":"${t}"`));
  });
  test("pied : les réglages du « Retour en haut » sont exposés par le catalogue de l'éditeur", () => {
    const spec = nodes.editorSpec();
    const t = spec.types.find((x) => x.type === "backtotop");
    assert.ok(t && t.schema.map((f) => f.key).join() === "mode,side,label,showLabel,threshold");
  });
});

// ------------------------------------------------------------------------------------------------------------------------------------------
describe("états par écran et mouvement réduit (vrai Chrome, page publiée)", { skip: SKIP }, () => {
  let srv, boss, ch, cookies, counter = 0;
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    ch = await cdp.launch();
    cookies = [...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base }));
  });
  after(async () => { if (ch) await ch.close(); if (srv) await srv.stop(); });

  async function publish(content) {
    const id = Number((await boss.post("/marketing/pages", { name: "Etats " + ++counter })).location.match(/(\d+)$/)[1]);
    const rev = srv.db().prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(id).revision;
    const put = await boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", json: { revision: rev, content }, headers: { Origin: srv.base } });
    assert.equal(put.status, 200, put.text.slice(0, 300));
    assert.equal((await boss.request(`/marketing/pages/${id}/publier.json`, { method: "POST", json: {} })).status, 200);
    return `${srv.base}/p/${srv.db().prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(id).slug}`;
  }
  const colorAfterHover = async (pg, id) => {
    const r = await pg.evaluate((cls) => { const e = document.querySelector("." + cls); e.scrollIntoView({ block: "center" }); const b = e.getBoundingClientRect(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; }, `kw-n-${id}`);
    await pg.mouseMove(r.x, r.y); await wait(700);
    return pg.evaluate((cls) => getComputedStyle(document.querySelector("." + cls)).backgroundColor, `kw-n-${id}`);
  };

  test("un survol réglé pour le MOBILE ne change rien sur l'ordinateur, et le voisin n'est jamais touché", async () => {
    const url = await publish({ sections: page(
      btn("btn1", { states: { hover: { backgroundColor: "#0000ff" }, "hover@mobile": { backgroundColor: "#00ff00" } } }),
      btn("btn2", { states: { hover: { backgroundColor: "#0000ff" } } }),
      btn("btn3"),
    ) });
    const rgb = { blue: "rgb(0, 0, 255)", green: "rgb(0, 255, 0)" };
    const run = async (width, id) => { const pg = await ch.newPage({ width, height: 900, cookies }); try { await pg.goto(url); await wait(200); return await colorAfterHover(pg, id); } finally { await pg.close(); } };
    assert.equal(await run(1400, ID("btn1")), rgb.blue, "ordinateur : survol de l'ordinateur");
    assert.equal(await run(500, ID("btn1")), rgb.green, "mobile : survol propre au mobile");
    assert.equal(await run(500, ID("btn2")), rgb.blue, "mobile : le voisin sans réglage mobile hérite de l'ordinateur");
    const neutral = await run(1400, ID("btn3"));
    assert.notEqual(neutral, rgb.blue); assert.notEqual(neutral, rgb.green);
  });

  test("mouvement réduit ÉMULÉ : la transition est coupée et la transformation au survol n'est pas appliquée ; la couleur reste changée au survol", async () => {
    const url = await publish({ sections: page(
      btn("btn4", { styles: { desktop: { transitionDuration: 800 } }, states: { hover: { backgroundColor: "#ff0000", transform: { scale: 1.3 } } } }),
      btn("btn5", { styles: { desktop: { transitionDuration: 800 } }, motion: { entrance: "fade", alwaysMotion: true }, states: { hover: { backgroundColor: "#ff0000", transform: { scale: 1.3 } } } }),
    ) });
    const probe = async (reduce, id) => {
      const pg = await ch.newPage({ width: 1400, height: 900, cookies });
      try {
        await pg.emulateMedia([{ name: "prefers-reduced-motion", value: reduce ? "reduce" : "no-preference" }]);
        await pg.goto(url); await wait(300);
        const color = await colorAfterHover(pg, id);
        const s = await pg.evaluate((cls) => { const c = getComputedStyle(document.querySelector("." + cls)); return { dur: c.transitionDuration, tf: c.transform }; }, `kw-n-${id}`);
        return { color, ...s };
      } finally { await pg.close(); }
    };
    const normal = await probe(false, ID("btn4"));
    assert.match(normal.dur, /0\.8s/); assert.notEqual(normal.tf, "none");
    const calm = await probe(true, ID("btn4"));
    assert.equal(calm.color, "rgb(255, 0, 0)", "la couleur au survol change quand même (instantanément)");
    assert.match(calm.dur, /^0s/, "plus aucune transition");
    assert.equal(calm.tf, "none", "plus de transformation au survol");
    const kept = await probe(true, ID("btn5"));
    assert.match(kept.dur, /0\.8s/, "option « garder le mouvement » : la transition reste");
    assert.notEqual(kept.tf, "none");
  });

  test("focus clavier visible : le style de l'état focus s'applique par :focus-visible, pas au clic de souris", async () => {
    const url = await publish({ sections: page(btn("btn6", { states: { focus: { outlineStyle: "solid", outlineWidth: "4px", outlineColor: "#ff00ff" } } })) });
    const pg = await ch.newPage({ width: 1400, height: 900, cookies });
    try {
      await pg.goto(url); await wait(200);
      await pg.evaluate((cls) => { document.querySelector("." + cls).focus(); }, `kw-n-${ID("btn6")}`);
      await wait(150);
      const o = await pg.evaluate((cls) => { const c = getComputedStyle(document.querySelector("." + cls)); return c.outlineColor + "|" + c.outlineWidth + "|" + document.querySelector("." + cls).matches(":focus-visible"); }, `kw-n-${ID("btn6")}`);
      assert.equal(o, "rgb(255, 0, 255)|4px|true");
    } finally { await pg.close(); }
  });
});

// ------------------------------------------------------------------------------------------------------------------------------------------
describe("états par écran (vrai éditeur piloté dans Chrome)", { skip: SKIP }, () => {
  let srv, boss, ch, cookies, pg, id;
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    ch = await cdp.launch();
    cookies = [...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base }));
    id = Number((await boss.post("/marketing/pages", { name: "Editeur etats" })).location.match(/(\d+)$/)[1]);
    const rev = srv.db().prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(id).revision;
    const put = await boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", json: { revision: rev, content: { sections: page(btn("edb1", { states: { hover: { color: "#0000ff" } } }), btn("edb2", { states: { hover: { color: "#0000ff" } } })) } }, headers: { Origin: srv.base } });
    assert.equal(put.status, 200, put.text.slice(0, 300));
    pg = await ch.newPage({ width: 1500, height: 1000, cookies });
  });
  after(async () => { if (pg) await pg.close(); if (ch) await ch.close(); if (srv) await srv.stop(); });

  const draft = () => JSON.parse(srv.db().prepare("SELECT draft FROM mk_landing_pages WHERE id = ?").get(id).draft || "{}");

  test("choisir Mobile puis Survol et régler la couleur du texte : écrit « hover@mobile » seulement, l'ordinateur et le voisin gardent leurs valeurs", async () => {
    await pg.goto(`${srv.base}/marketing/pages/${id}/editeur`);
    await pg.waitFor(() => { const f = document.querySelector("[data-pb-frame]"); return f && f.contentDocument && f.contentDocument.body && f.contentDocument.body.classList.contains("lp-builder"); }, "canevas", 60000);
    await wait(900);
    // Sélection par l'arborescence des calques (clic réel sur la ligne du bouton)
    const r = await pg.evaluate((n) => { const row = document.querySelector(`[data-pb-layers] .pb-node[data-id="${n}"] > .pb-row-item`); row.scrollIntoView({ block: "center" }); const b = row.getBoundingClientRect(); return { x: b.x + Math.min(b.width / 2, 60), y: b.y + b.height / 2 }; }, ID("edb1"));
    await pg.mouseClick(r.x, r.y); await wait(500);
    const sel = await pg.evaluate(() => [...document.querySelectorAll("[data-pb-layers] .pb-row-item.is-selected")].map((e) => e.parentElement.dataset.id));
    assert.deepEqual(sel, [ID("edb1")], "le clic sélectionne le bouton");
    await pg.evaluate(() => { const b = [...document.querySelectorAll(".pb-right button")].find((x) => /^Style$/.test(x.textContent.trim())); if (b) b.click(); }); await wait(300);
    await pg.evaluate(() => document.querySelector('.pb-bp-seg [data-device="mobile"]').click()); await wait(300);
    // le sélecteur d'état est un groupe de boutons radio nommé, opérable au clavier (boutons natifs)
    const a11y = await pg.evaluate(() => { const g = document.querySelector(".pb-state-seg"); return { role: g.getAttribute("role"), label: g.getAttribute("aria-label"), buttons: [...g.querySelectorAll("button")].map((b) => b.getAttribute("role") + ":" + b.getAttribute("aria-checked")) }; });
    assert.equal(a11y.role, "radiogroup"); assert.ok(a11y.label);
    assert.ok(a11y.buttons.every((b) => /^radio:(true|false)$/.test(b)) && a11y.buttons.filter((b) => b === "radio:true").length === 1);
    await pg.evaluate(() => document.querySelector('.pb-state-seg [data-state="hover"]').click()); await wait(400);
    const note = await pg.evaluate(() => document.querySelector(".pb-insp-note").textContent);
    assert.match(note, /Mobile/);
    // Régler la couleur du texte (clic sur la pastille, saisie hexadécimale)
    await pg.evaluate(() => { const b = document.querySelector("[data-pb-inspector] [data-color-key='color']"); const d = b.closest("details"); if (d) d.open = true; b.scrollIntoView(); b.click(); }); await wait(300);
    await pg.evaluate(() => { const i = document.querySelector(".pb-cpop-hex"); i.focus(); i.value = "#00ff00"; i.dispatchEvent(new Event("change", { bubbles: true })); }); await wait(300);
    await pg.key("Escape"); await wait(1500);
    // Aperçu : l'état est affiché dans le canevas sans survol réel
    const forced = await pg.evaluate((n) => { const d = document.querySelector("[data-pb-frame]").contentDocument; const e = d.querySelector(`[data-node-id="${n}"]`); return { cls: e.classList.contains("pb-force-state"), style: !!d.getElementById("pb-force-state"), dbg: e.className + " | " + (d.getElementById("pb-force-state") || { textContent: "" }).textContent.slice(0, 200) }; }, ID("edb1"));
    assert.deepEqual({ cls: forced.cls, style: forced.style }, { cls: true, style: true }, forced.dbg);
    // Enregistrement automatique puis lecture du brouillon
    for (let i = 0; i < 60; i++) { try { if (draft().sections[0].children[0].children.find((k) => k.id === ID("edb1")).states["hover@mobile"]) break; } catch { /* pas encore */ } await wait(500); }
    const kids = draft().sections[0].children[0].children;
    const a = kids.find((k) => k.id === ID("edb1")), b = kids.find((k) => k.id === ID("edb2"));
    assert.equal(a.states.hover.color, "#0000ff", "l'ordinateur est inchangé");
    assert.equal(a.states["hover@mobile"].color, "#00ff00");
    assert.deepEqual(b.states, { hover: { color: "#0000ff" } }, "le voisin n'a pas bougé");
  });
});
