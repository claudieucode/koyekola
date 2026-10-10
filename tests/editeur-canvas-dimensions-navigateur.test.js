// Éditeur de pages — DIMENSIONS des conteneurs (mission « Canvas façon Elementor », phase 18), mesurées dans un VRAI Chrome sur la page
// publiée (et, pour la parité, sur le canevas) : largeur automatique / fixe / en % / vw, largeurs min. et max., hauteur automatique et
// minimale, intérieur, marges, écart, retour à la ligne, contenu long, nombreux enfants, plusieurs écrans. Aucun débordement horizontal
// involontaire ; unités non rendables refusées par le serveur.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : parcours navigateur non exécuté sur cette machine" : false;

const ID = (s) => (s + "x").padEnd(12, "0"); // « x » final : « t1 » et « t10 » restent distincts
const box = (id, st, kids, props) => ({ id: ID(id), type: "container", ...(props ? { props } : {}), styles: { desktop: st }, children: kids || [] });
const text = (id, html, st) => ({ id: ID(id), type: "text", props: { html }, ...(st ? { styles: { desktop: st } } : {}) });
const sec = (n, kids) => ({ id: `sect${String(n).padStart(7, "0")}`, type: "layout", children: kids });
const LONG = "Un texte assez long pour passer à la ligne plusieurs fois dans une colonne étroite, avec des mots, des mots et encore des mots.";
const CONTENT = { sections: [
  sec(1, [box("boxed", { paddingTop: "20px", paddingRight: "20px", paddingBottom: "20px", paddingLeft: "20px" }, [text("t1", `<p>${LONG}</p>`)])]),                                       // encadré : largeur du site
  sec(2, [box("full", { paddingTop: "20px", paddingRight: "20px", paddingBottom: "20px", paddingLeft: "20px" }, [text("t2", `<p>${LONG}</p>`)], { full: true })]),                     // pleine largeur
  sec(3, [box("pct", { width: "50%" }, [text("t3", `<p>${LONG}</p>`)], { full: true })]),                          // 50 % du parent
  sec(4, [box("vw", { width: "50vw" }, [text("t4", `<p>${LONG}</p>`)], { full: true })]),                          // 50 % de la fenêtre
  sec(5, [box("maxw", { width: "800px", maxWidth: "300px" }, [text("t5", "<p>x</p>")], { full: true })]),          // max l'emporte sur la largeur
  sec(6, [box("minw", { width: "100px", minWidth: "250px" }, [text("t6", "<p>x</p>")], { full: true })]),          // min l'emporte
  sec(7, [box("auto", {}, [text("t7", "<p>a</p><p>b</p><p>c</p>")], { full: true })]),                             // hauteur automatique
  sec(8, [box("minh", { minHeight: "240px" }, [text("t8", "<p>court</p>")], { full: true })]),                     // hauteur minimale
  sec(9, [box("fixh", { height: "60px", overflow: "hidden" }, [text("t9", `<p>${LONG}</p><p>${LONG}</p>`)], { full: true })]), // hauteur fixe + débordement masqué
  sec(10, [box("bb", { width: "300px", paddingTop: "30px", paddingRight: "30px", paddingBottom: "30px", paddingLeft: "30px", borderWidth: "5px", borderStyle: "solid" }, [text("t10", "<p>x</p>")], { full: true })]), // modèle de boîte
  sec(11, [box("row", { display: "flex", flexDirection: "row", flexWrap: "wrap", gap: "20px" }, ["a", "b", "c"].map((k) => box("w" + k, { width: "300px", minHeight: "40px" }, [text("x" + k, "<p>x</p>")])), { full: true })]), // retour à la ligne
  sec(12, [box("nowrap", { display: "flex", flexDirection: "row", flexWrap: "nowrap", gap: "20px" }, ["a", "b", "c"].map((k) => box("n" + k, { width: "400px", minHeight: "40px" }, [text("y" + k, "<p>x</p>")])), { full: true })]), // sans retour : les enfants rétrécissent
  sec(13, [box("marg", { marginTop: "30px", marginBottom: "50px", paddingTop: "10px", paddingRight: "10px", paddingBottom: "10px", paddingLeft: "10px" }, [text("t13", "<p>x</p>")], { full: true })]),
  sec(14, [box("long", {}, [text("t14", "<p>https://exemple.org/un/chemin/tres/long/sans/aucune/espace/ni/tiret/qui/pourrait/faire/deborder/la/colonne/sur/un/petit/ecran/mobile/0123456789</p>")], { full: true })]), // mot très long
  sec(15, [box("nest", { paddingTop: "10px", paddingRight: "10px", paddingBottom: "10px", paddingLeft: "10px" }, [box("in1", { paddingTop: "10px", paddingRight: "10px", paddingBottom: "10px", paddingLeft: "10px" }, [box("in2", { paddingTop: "10px", paddingRight: "10px", paddingBottom: "10px", paddingLeft: "10px" }, [text("t15", `<p>${LONG}</p>`)])])], { full: true })]),   // imbrication
] };

describe("dimensions des conteneurs (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, ctx, pageId, slug, boot;
  const measure = (win) => { const o = {}; win.document.querySelectorAll("[class*=\"kw-n-\"]").forEach((e) => { const m = /kw-n-([a-z0-9]+)/.exec(e.className); const r = e.getBoundingClientRect(); const cs = win.getComputedStyle(e); if (m) o[m[1]] = { x: r.x, y: r.y, w: r.width, h: r.height, cs: { maxWidth: cs.maxWidth, boxSizing: cs.boxSizing, overflow: cs.overflow, flexShrink: cs.flexShrink } }; }); return { vw: win.innerWidth, sw: win.document.documentElement.scrollWidth, o }; };
  const published = async (width) => { const p = await ctx.newPage(); await p.setViewportSize({ width, height: 900 }); await p.goto(`${srv.base}/p/${slug}`); await p.waitForTimeout(400); const r = await p.evaluate(`(${measure})(window)`); await p.close(); return r; };
  const n = (r, k) => { const v = r.o[ID(k)]; assert.ok(v, `élément absent : ${k}`); return v; };
  const near = (a, b, tol, what) => assert.ok(Math.abs(a - b) <= tol, `${what} : ${a.toFixed(1)} attendu ≈ ${b.toFixed(1)}`);
  // identifiants : le serveur conserve les identifiants fournis ; la classe est kw-n-<id>
  const K = (k) => ID(k);

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
    ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    await ctx.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    pageId = Number((await boss.post("/marketing/pages", { name: "Dimensions" })).location.match(/(\d+)$/)[1]);
    const rev = srv.db().prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(pageId).revision;
    const put = await boss.request(`/marketing/pages/${pageId}/brouillon`, { method: "PUT", json: { revision: rev, content: CONTENT }, headers: { Origin: srv.base } });
    assert.equal(put.status, 200, put.text.slice(0, 300));
    slug = srv.db().prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(pageId).slug;
    assert.equal((await boss.request(`/marketing/pages/${pageId}/publier.json`, { method: "POST", json: {} })).status, 200);
  });
  after(async () => { if (browser) await browser.close(); if (srv) await srv.stop(); });

  test("largeur : encadrée / pleine largeur, 50 %, 50 vw ; max. et min. respectés (y compris en pleine largeur)", async () => {
    const r = await published(1280);
    const main = r.vw;
    const boxed = n(r, "boxed"), full = n(r, "full"), pct = n(r, "pct"), vw = n(r, "vw");
    // Par défaut, la colonne de contenu d'une page fait 760 px (Réglages du site › Mise en page : « Contenu pleine largeur », largeur du
    // contenu et largeur des conteneurs sont réglables) moins deux gouttières de 16 px : un conteneur ne peut pas être plus large
    assert.equal(boxed.w, 728, "encadré : limité par la colonne de la page");
    assert.equal(boxed.cs.maxWidth, "1100px", "encadré : largeur max. du site (1100 px par défaut)");
    assert.equal(full.cs.maxWidth, "none", "pleine largeur : aucune largeur max.");
    near(pct.w, full.w / 2, 1, "50 % du parent");
    near(vw.w, main / 2, 1, "50 vw");
    assert.equal(n(r, "maxw").w, 300, "la largeur max. (300 px) l'emporte sur la largeur 800 px, même en pleine largeur");
    assert.equal(n(r, "minw").w, 250, "la largeur min. l'emporte sur la largeur 100 px");
  });
  test("hauteur : automatique selon le contenu, minimale respectée, fixe avec débordement masqué", async () => {
    const r = await published(1280);
    assert.ok(n(r, "auto").h > 40 && n(r, "auto").h < 200, `hauteur automatique ${n(r, "auto").h}`);
    assert.equal(n(r, "minh").h, 240, "hauteur minimale");
    assert.equal(n(r, "fixh").h, 60, "hauteur fixe");
    assert.equal(n(r, "fixh").cs.overflow, "hidden");
  });
  test("modèle de boîte : la largeur inclut l'intérieur et la bordure ; les marges s'ajoutent autour", async () => {
    const r = await published(1280);
    assert.equal(n(r, "bb").w, 300, "300 px = contenu + intérieur + bordure");
    assert.equal(n(r, "bb").cs.boxSizing, "border-box");
    const m = n(r, "marg"), next = n(r, "long");
    assert.ok(next.y - (m.y + m.h) >= 50, "marge basse de 50 px entre ce conteneur et le suivant");
  });
  test("Flexbox : retour à la ligne (3 × 300 px + écarts) et sans retour (les enfants rétrécissent sans déborder)", async () => {
    const r = await published(1280);
    const a = n(r, "wa"), b = n(r, "wb"), c = n(r, "wc");
    assert.equal(a.y, b.y, "a et b sur la même ligne (728 px ≥ 2 × 300 + 20)");
    assert.ok(c.y > b.y, "le troisième passe à la ligne (3 × 300 + 2 × 20 > 728)");
    near(b.x - (a.x + a.w), 20, 1, "écart de 20 px");
    const narrow = await published(600);
    const na = n(narrow, "wa"), nb = n(narrow, "wb"), nc = n(narrow, "wc");
    assert.ok(nb.y > na.y && nc.y > nb.y, "600 px : un par ligne");
    const x = n(r, "na");
    assert.ok(x.w < 400, `sans retour à la ligne, l'enfant de 400 px rétrécit (${x.w})`);
    const nn = [n(narrow, "na"), n(narrow, "nb"), n(narrow, "nc")];
    assert.ok(nn[2].x + nn[2].w <= narrow.vw + 1, "rien ne dépasse de la fenêtre");
  });
  test("imbrication : les enfants respectent leur parent (largeur = parent − intérieurs)", async () => {
    const r = await published(1280);
    const o = n(r, "nest"), i1 = n(r, "in1"), i2 = n(r, "in2");
    near(i1.w, o.w - 20, 1, "premier niveau"); near(i2.w, i1.w - 20, 1, "deuxième niveau");
    assert.ok(i2.x >= i1.x && i2.x + i2.w <= i1.x + i1.w + 1);
  });
  test("aucun débordement horizontal involontaire à 1280, 1024, 820 et 390 px (contenu long, mot très long, imbrication)", async () => {
    for (const w of [1280, 1024, 820, 390]) {
      const r = await published(w);
      assert.ok(r.sw <= r.vw, `${w} px : la page déborde (${r.sw} > ${r.vw})`);
    }
  });
  test("le canevas de l'éditeur donne les mêmes dimensions que la page publiée", async () => {
    const page = await ctx.newPage(); await page.setViewportSize({ width: 1700, height: 1000 });
    await page.goto(`${srv.base}/marketing/pages/${pageId}/editeur`);
    await page.waitForFunction(() => { const f = document.querySelector("[data-pb-frame]"); return f && f.contentDocument && f.contentDocument.body && f.contentDocument.body.classList.contains("lp-builder") && f.contentDocument.querySelector("[data-node-id]"); }, null, { timeout: 30000 });
    await page.waitForTimeout(800);
    const canvas = await page.evaluate(`(${measure})(document.querySelector("[data-pb-frame]").contentWindow)`);
    const real = await published(canvas.vw);
    const bad = Object.keys(real.o).filter((k) => !canvas.o[k] || ["x", "w", "h"].some((p) => Math.abs(canvas.o[k][p] - real.o[k][p]) > 1));
    assert.deepEqual(bad, [], `éléments différents : ${bad.slice(0, 4).map((k) => `${k} ${JSON.stringify(canvas.o[k] && [canvas.o[k].x, canvas.o[k].w, canvas.o[k].h])} / ${JSON.stringify([real.o[k].x, real.o[k].w, real.o[k].h])}`).join(" ; ")}`);
    await page.close();
  });
  test("unités : celles qui peuvent être rendues sont acceptées, les autres refusées par le serveur", async () => {
    const rev = () => srv.db().prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(pageId).revision;
    const trial = async (prop, value) => { const c = JSON.parse(JSON.stringify(CONTENT)); c.sections[0].children[0].styles.desktop[prop] = value; return (await boss.request(`/marketing/pages/${pageId}/brouillon`, { method: "PUT", json: { revision: rev(), content: c }, headers: { Origin: srv.base } })).status; };
    for (const v of ["320px", "50%", "20rem", "30em", "60vw", "auto"]) assert.equal(await trial("width", v), 200, `largeur ${v}`);
    for (const v of ["300px", "40vh", "10rem"]) assert.equal(await trial("minHeight", v), 200, `hauteur min. ${v}`);
    for (const v of ["10pt", "5cm", "12in", "calc(100%)", "expression(1)", "12 px"]) assert.equal(await trial("width", v), 422, `largeur ${v} refusée`);
  });
});
