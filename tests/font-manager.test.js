// Font Manager central : bibliothèque typographique (360+ familles réellement présentes, valides et sous licence ouverte), catégories,
// graisses réelles, règles @font-face, polices dans les pages (enregistrées, publiées, anciennes valeurs conservées) et dans les e-mails
// (repli renforcé), routes de service (manifeste, CSS à la demande, fichiers en cache long).
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { TEST_KEY } = require("./marketing-helpers");
const fonts = require("../src/utils/fontLibrary");
const nodes = require("../src/marketing/pages/nodes");
const { compileTemplate, renderEmail } = require("../src/marketing/templates/blocks");
const { startServer, Client, loginInstructor } = require("./helpers");

const LIB = path.join(__dirname, "../public/fonts/library");
const CATS = ["sans-serif", "serif", "display", "cursive", "monospace"];
const OPEN = new Set(["OFL-1.1", "Apache-2.0", "Ubuntu-font-1.0", "UFL-1.0"]);

describe("bibliothèque (manifeste et fichiers)", () => {
  const list = fonts.list();
  test("au moins 360 familles, identifiants uniques et stables, aucune valeur codée en dur dans le code", () => {
    assert.ok(list.length >= 360, `${list.length} familles`);
    assert.equal(new Set(list.map((f) => f.id)).size, list.length, "identifiants uniques");
    assert.equal(new Set(list.map((f) => f.family.toLowerCase())).size, list.length, "pas de doublon de nom");
    for (const f of list) assert.match(f.id, /^font\.[a-z0-9-]+$/);
  });
  test("chaque famille : catégorie réelle, repli, licence ouverte, source, graisses et styles réels", () => {
    for (const f of list) {
      assert.ok(CATS.includes(f.category), `${f.family} : catégorie`);
      assert.ok(f.categories.includes(f.category));
      assert.equal(f.fallback, { "sans-serif": "sans-serif", serif: "serif", display: "sans-serif", cursive: "cursive", monospace: "monospace" }[f.category], `${f.family} : repli`);
      assert.ok(OPEN.has(f.license), `${f.family} : licence ${f.license}`);
      assert.match(f.sourceUrl, /^https:\/\/fonts\.google\.com\//);
      assert.ok(f.weights.length >= 1 && f.weights.every((w) => w >= 100 && w <= 900), `${f.family} : graisses`);
      assert.ok(f.styles.includes("normal"));
      assert.equal(f.styles.includes("italic"), f.italicWeights.length > 0, `${f.family} : italique déclaré = italique présent`);
    }
  });
  test("tous les fichiers existent, sont de vrais WOFF2 (en-tête wOF2) et couvrent exactement les variantes annoncées", () => {
    let files = 0;
    for (const f of list) {
      for (const style of ["normal", "italic"]) {
        const map = f.files[style] || {};
        const names = Object.entries(map);
        if (style === "italic" && !f.styles.includes("italic")) { assert.equal(names.length, 0, `${f.family} : italique non annoncé`); continue; }
        assert.ok(names.length > 0, `${f.family} ${style} : au moins un fichier`);
        for (const [key, name] of names) {
          const file = path.join(LIB, f.slug, name);
          const buf = fs.readFileSync(file);
          assert.ok(buf.length > 800, `${f.family} ${name} : trop petit`);
          assert.equal(buf.subarray(0, 4).toString("latin1"), "wOF2", `${f.family} ${name} : pas un WOFF2`);
          if (key !== "variable") assert.ok(f.weights.includes(Number(key)) || f.italicWeights.includes(Number(key)), `${f.family} : graisse ${key} annoncée`);
          files++;
        }
        if (map.variable) assert.ok(f.variable && f.axes && f.axes.wght && f.axes.wght.min < f.axes.wght.max, `${f.family} : axe wght`);
      }
    }
    assert.ok(files > list.length);
    // aucun dossier orphelin
    const dirs = fs.readdirSync(LIB).filter((d) => fs.statSync(path.join(LIB, d)).isDirectory());
    assert.deepEqual(dirs.sort(), list.map((f) => f.slug).sort(), "dossiers = familles du manifeste");
  });
  test("catégories alimentées par des métadonnées réelles ; polices de référence présentes", () => {
    const count = (c) => list.filter((f) => f.categories.includes(c)).length;
    for (const c of [...CATS, "slab-serif", "variable"]) assert.ok(count(c) >= 5, `catégorie ${c} : ${count(c)}`);
    for (const name of ["Inter", "Roboto", "Montserrat", "Playfair Display", "Caveat", "Roboto Mono", "Lobster", "Open Sans", "Lato"]) assert.ok(fonts.byName(name), name);
    assert.ok(fonts.byName("Montserrat").weights.length >= 9, "Montserrat : 100 à 900");
    assert.ok(fonts.byName("Inter").variable && fonts.byName("Inter").styles.includes("italic"));
    assert.ok(fonts.byName("Lobster").weights.length === 1, "Lobster : une seule graisse, rien d'inventé");
    assert.ok(fs.existsSync(path.join(LIB, "LICENCES.md")));
  });
  test("règles @font-face : variable = une règle par style avec plage de graisses ; statique = une par graisse ; jamais de variante inventée", () => {
    const inter = fonts.faceCss(fonts.byName("Inter"));
    assert.match(inter, /font-weight:100 900/); assert.equal((inter.match(/@font-face/g) || []).length, 2);
    const lobster = fonts.faceCss(fonts.byName("Lobster"));
    assert.equal((lobster.match(/@font-face/g) || []).length, 1); assert.doesNotMatch(lobster, /italic/);
    assert.match(lobster, /url\(\/fonts\/library\/lobster\/latin-400-normal\.woff2\) format\("woff2"\)/);
    assert.match(fonts.faceCss(fonts.byName("Lobster"), { base: "https://k.test" }), /url\(https:\/\/k\.test\/fonts\/library/);
  });
  test("piles : nom entre guillemets simples + repli ; repli renforcé pour les e-mails ; valeurs libres refusées", () => {
    assert.equal(fonts.stackOf("font.inter"), "'Inter', sans-serif");
    assert.equal(fonts.emailStack(fonts.byName("Playfair Display")), "'Playfair Display', Georgia, 'Times New Roman', serif");
    assert.equal(fonts.isId("font.inter"), true); assert.equal(fonts.isId("font.inexistante"), false);
    assert.equal(fonts.isId("Arial"), false); assert.equal(fonts.isId("font.inter;color:red"), false);
    assert.deepEqual(fonts.usedIn("a{font-family:'Lobster', cursive}b{font-family:Arial}").map((f) => f.family), ["Lobster"]);
  });
});

describe("pages et e-mails (sans serveur)", () => {
  test("page : un identifiant de la bibliothèque est une valeur valide, les anciens réglages restent valides, le reste est refusé", () => {
    const sp = nodes.STYLE_PROPS.fontFamily;
    assert.equal(sp.check("font.lora"), "font.lora");
    for (const old of ["heading", "body", "system", "serif", "mono"]) assert.equal(sp.check(old), old);
    assert.equal(sp.check("Arial"), null); assert.equal(sp.check("font.nope"), null); assert.equal(sp.check("serif;color:red"), null);
    assert.equal(sp.out("font.lora"), "'Lora', serif"); assert.equal(sp.out("system"), nodes.FONT_STACKS.system);
  });
  const ALLOW = () => true;
  const ctx = { contact: {}, org: { name: "K", address: "x" }, unsubscribe_url: "https://k.test/u", preferences_url: "https://k.test/p", view_url: "" };
  test("e-mail : famille de la bibliothèque acceptée (thème et bloc), pile avec repli, anciennes polices intactes, inconnue refusée", () => {
    const save = process.env.SITE_URL; process.env.SITE_URL = "https://k.test";
    try {
      const make = (theme, block) => compileTemplate({ kind: "marketing", subject: "S", theme, blocks: [{ id: "b1", type: "heading", text: "Bonjour", ...block }] }, { allowed: ALLOW });
      const c = make({ fontFamily: "font.lora" }, { font: "font.playfair-display" });
      const html = renderEmail(c, ctx).html;
      assert.match(html, /font-family:'Playfair Display', Georgia/); assert.match(html, /font-family:'Lora', Georgia/);
      assert.match(html, /<style>@font-face\{font-family:'Lora'/); assert.match(html, /url\(https:\/\/k\.test\/fonts\/library\/lora\//);
      assert.deepEqual(c.meta.webFonts.sort(), ["Lora", "Playfair Display"]);
      const old = renderEmail(make({ fontFamily: "georgia" in {} ? "serif" : "serif" }, { font: "arial" }), ctx).html;
      assert.doesNotMatch(old, /@font-face/); assert.match(old, /Arial,Helvetica,sans-serif/);
      assert.throws(() => make({ fontFamily: "font.nope" }, {}), /Police inconnue/);
      assert.throws(() => make({}, { font: "font.nope" }), /Police inconnue/);
    } finally { if (save === undefined) delete process.env.SITE_URL; else process.env.SITE_URL = save; }
  });
});

describe("vrai serveur : routes, pages publiées", () => {
  let srv, boss, db;
  before(async () => { srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" }); boss = await loginInstructor(srv); db = srv.db(); });
  after(() => srv.stop());
  const anon = () => new Client(srv.base);
  test("manifeste léger, CSS à la demande (au plus 40 familles, ids inconnus ignorés), fichiers WOFF2 en cache long", async () => {
    const m = JSON.parse((await anon().get("/polices/manifeste.json")).text);
    assert.equal(m.count, fonts.list().length); assert.ok(m.count >= 360);
    const inter = m.families.find((f) => f.id === "font.inter");
    assert.ok(inter.stack === "'Inter', sans-serif" && inter.variable && inter.weights.length === 9);
    assert.ok(JSON.stringify(m).length < 400000, "manifeste léger");
    const css = await anon().get("/polices.css?f=font.inter,font.lobster,font.nope,<script>");
    assert.match(css.headers.get("content-type"), /text\/css/); assert.match(css.headers.get("cache-control"), /max-age=86400/);
    const text = css.text; assert.match(text, /font-family:'Inter'/); assert.match(text, /font-family:'Lobster'/); assert.doesNotMatch(text, /nope|script/);
    const file = await anon().get("/fonts/library/lobster/latin-400-normal.woff2");
    assert.equal(file.status, 200); assert.match(file.headers.get("cache-control"), /max-age=2592000.*immutable/);
    assert.ok(/woff2/.test(file.headers.get("content-type") || ""), file.headers.get("content-type"));
  });
  test("page : police et enregistrement conservés, @font-face livré avec la page publiée (seulement les familles utilisées), ancienne valeur intacte", async () => {
    const id = Number((await boss.post("/marketing/pages", { name: "Polices" })).location.match(/(\d+)$/)[1]);
    const rev = db.prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(id).revision;
    const content = { sections: [{ id: "sect00000001", type: "layout", children: [{ id: "cont00000001", type: "container", children: [
      { id: "head00000001", type: "heading", props: { text: "Titre", level: 1 }, styles: { desktop: { fontFamily: "font.playfair-display", fontWeight: "700", fontStyle: "italic" } } },
      { id: "text00000001", type: "text", props: { html: "<p>Texte</p>" }, styles: { desktop: { fontFamily: "serif" } } },
    ] }] }] };
    const put = await boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", json: { revision: rev, content }, headers: { Origin: srv.base } });
    assert.equal(put.status, 200, put.text);
    const saved = JSON.parse(db.prepare("SELECT draft FROM mk_landing_pages WHERE id = ?").get(id).draft);
    const nodesOf = (l, o = []) => { for (const x of l || []) { o.push(x); nodesOf(x.children, o); } return o; };
    const head = nodesOf(saved.sections).find((n) => n.id === "head00000001");
    assert.deepEqual([head.styles.desktop.fontFamily, head.styles.desktop.fontWeight, head.styles.desktop.fontStyle], ["font.playfair-display", "700", "italic"], "identifiant stable enregistré, pas la pile");
    assert.equal(nodesOf(saved.sections).find((n) => n.id === "text00000001").styles.desktop.fontFamily, "serif", "ancienne valeur non réécrite");
    assert.equal((await boss.postJson(`/marketing/pages/${id}/publier.json`, {})).status, 200);
    const slug = db.prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(id).slug;
    const html = (await anon().get(`/p/${slug}`, { headers: { "User-Agent": "Mozilla/5.0 Chrome/120" } })).text;
    assert.match(html, /@font-face\{font-family:'Playfair Display'/); assert.match(html, /font-family:'Playfair Display', serif/);
    assert.doesNotMatch(html, /font-family:'Inter'/, "seules les familles utilisées sont livrées");
    // une valeur inconnue est refusée à l'enregistrement
    const rev2 = db.prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(id).revision;
    content.sections[0].children[0].children[0].styles.desktop.fontFamily = "font.inexistante";
    const bad = await boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", json: { revision: rev2, content }, headers: { Origin: srv.base } });
    assert.notEqual(bad.status, 200);
  });
});
