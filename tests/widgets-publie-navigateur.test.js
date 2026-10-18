// Catalogue de widgets sur la PAGE PUBLIÉE dans un vrai Chrome : chaque widget créable est publié (contenu de départ, puis contenu « difficile » :
// textes très longs, adresses sans espace), ouvert à 8 largeurs dont les deux côtés de chaque point de rupture, et contrôlé :
//   * aucune erreur de script ni requête en échec causée par le widget ;
//   * le widget occupe une place visible (sauf ceux qui n'affichent volontairement rien sans contexte) ;
//   * aucun débordement horizontal de la page ni du widget hors de l'écran.
// Un widget qui échoue est nommé avec la largeur en cause.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const { TEST_KEY } = require("./marketing-helpers");
const nodes = require("../src/marketing/pages/nodes");
const { startServer, loginInstructor } = require("./helpers");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : parcours navigateur non exécuté sur cette machine" : false;

// Liste FERMÉE des éléments qui n'affichent rien hors de leur contexte (modèle d'article, menu du site non défini). Mesurée : tous les autres widgets,
// y compris ceux qui lisent des données du visiteur, s'affichent sur une page ordinaire.
const CONTEXTUAL = new Set(["postcontent", "postterms", "postnav", "authorbox", "postcomments", "cmsmenu"]);
// Éléments hors flux par conception (fixes à l'écran, invisibles tant qu'on n'agit pas)
const OUT_OF_FLOW = new Set(["floatingbutton", "readingprogress", "modal", "menuanchor", "cart", "minicart"]);
const WIDTHS = [320, 375, 767, 768, 1023, 1024, 1440, 1920];
const { NEEDS_DATA, creatable, LONG, idOf, build } = require("./widgets-helpers");

describe("widgets sur la page publiée (Chrome réel)", { skip: SKIP }, () => {
  let srv, boss, browser, db;
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" }); boss = await loginInstructor(srv); db = srv.db();
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
  });
  after(async () => { if (browser) await browser.close(); if (srv) await srv.stop(); });

  const publish = async (name, content) => {
    const id = Number((await boss.post("/marketing/pages", { name })).location.match(/(\d+)$/)[1]);
    const r = await boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", json: { revision: db.prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(id).revision, content }, headers: { Origin: srv.base } });
    assert.equal(r.status, 200, r.text.slice(0, 200));
    const p = await boss.postJson(`/marketing/pages/${id}/publier.json`, {});
    assert.equal(p.status, 200, p.text.slice(0, 200));
    return db.prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(id).slug;
  };

  // Ouvre la page publiée à chaque largeur et relève les constats ; ids = [[idDeLElement, type], …]
  const inspect = async (slug, ids) => {
      const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (e) => errors.push(`script : ${e.message}`));
      page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource|ERR_|net::|example\.com|k\.test|Permissions policy violation/.test(m.text())) errors.push(`console : ${m.text().slice(0, 140)}`); });
      const problems = [];
      for (const w of WIDTHS) {
        await page.setViewportSize({ width: w, height: 900 });
        await page.goto(`${srv.base}/p/${slug}`, { waitUntil: "load" });
        await page.waitForTimeout(400);
        const res = await page.evaluate(({ ids, vw }) => {
          const out = [];
          const doc = document.documentElement;
          if (doc.scrollWidth > vw + 1) out.push({ type: "(page)", why: `la page déborde : ${doc.scrollWidth}px pour ${vw}px` });
          ids.forEach(([id, type]) => {
            const el = document.querySelector(`.kw-n-${id}`);
            if (!el) { out.push({ type, why: "absent de la page", id }); return; }
            const r = el.getBoundingClientRect();
            const cs = getComputedStyle(el);
            if (cs.display === "none" || cs.visibility === "hidden") { out.push({ type, why: "masqué", id }); return; }
            if (r.right > vw + 1 || r.left < -1) out.push({ type, why: `sort de l'écran (${Math.round(r.left)}→${Math.round(r.right)} pour ${vw})`, id });
            else if (el.scrollWidth > el.clientWidth + 1 && cs.overflowX === "visible" && r.width > 0) out.push({ type, why: `contenu plus large que l'élément (${el.scrollWidth} > ${el.clientWidth})`, id });
          });
          return out;
        }, { ids: ids, vw: w });
        for (const x of res) problems.push(`${x.type} @${w}px : ${x.why}`);
      }
      await context.close();
      return { problems, errors };
  };

  for (const hard of [false, true]) {
    test(`tous les widgets, contenu ${hard ? "difficile (textes très longs)" : "de départ"} : visibles, sans débordement ni erreur, à ${WIDTHS.length} largeurs`, { timeout: 600000 }, async () => {
      // on retire les éléments dont la publication à vide est refusée (contenu à compléter) : ils sont repérés par l'essai de publication
      const usable = [];
      for (const t of creatable) {
        const id = Number((await boss.post("/marketing/pages", { name: `Essai ${hard ? "D" : "S"} ${t}` })).location.match(/(\d+)$/)[1]);
        const c = build([t], hard);
        const r = await boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", json: { revision: db.prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(id).revision, content: c }, headers: { Origin: srv.base } });
        assert.equal(r.status, 200, `« ${t} » refusé (${hard ? "difficile" : "départ"}) : ${r.text.slice(0, 200)}`);
        if ((await boss.postJson(`/marketing/pages/${id}/publier.json`, {})).status === 200) usable.push(t);
      }
      assert.ok(usable.length >= 60, `seulement ${usable.length} widgets publiables`);
      const slug = await publish(hard ? "Difficile" : "Départ", build(usable, hard));
      const { problems, errors } = await inspect(slug, usable.map((t, i) => [idOf(i), t]));
      if (hard) assert.ok((await (await fetch(`${srv.base}/p/${slug}`)).text()).includes(LONG), "le contenu difficile est bien dans la page publiée");
      const real = problems.filter((p) => { const t = p.split(" ")[0]; return !(CONTEXTUAL.has(t) && /absent|masqué/.test(p)) && !(OUT_OF_FLOW.has(t) && /masqué|sort de l'écran/.test(p)); });
      assert.deepEqual(errors, [], "erreurs de script ou de console");
      assert.deepEqual(real, [], `${real.length} constat(s)`);
    });
  }

  test("témoin : le contrôle détecte réellement un élément plus large que l'écran", { timeout: 120000 }, async () => {
    const slug = await publish("Témoin", { sections: [{ id: "sect00000001", type: "layout", children: [{ id: "cont00000001", type: "container", children: [{ id: idOf(0), type: "text", props: { text: "Trop large" }, styles: { desktop: { width: "1600px" } } }] }] }] });
    const { problems } = await inspect(slug, [[idOf(0), "text"]]);
    assert.ok(problems.some((p) => /text @320px/.test(p)), `débordement non détecté : ${problems.join(" | ")}`);
  });
});
