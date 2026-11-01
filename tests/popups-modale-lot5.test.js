// Lot 5 de la parité Elementor — fenêtres (popups) : animations d'entrée / de sortie, superposition (couleur, flou), blocage du défilement,
// déclencheurs « remontée de page » et « élément visible », période d'affichage, bouton « Ne plus afficher ».
// Serveur : validation, enregistrement, rechargement, canevas, page publiée. Navigateur (Chrome réel) : comportement dans la page publiée.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");
const nodes = require("../src/marketing/pages/nodes");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP_BROWSER = !chromium || !CHROME ? "Playwright ou Chrome absent : parcours navigateur non exécuté sur cette machine" : false;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const H = { ctx: {}, imageUrl: (v) => String(v || ""), linkUrl: (v) => String(v || ""), iconNames: nodes.iconNames() };
const norm = (props) => nodes.normalizeNode({ id: "modal0000001", type: "modal", props: { buttonLabel: "Ouvrir", title: "Titre", text: "Contenu", ...props } }, "essai", H, 1, { n: 0, ids: new Set() }).props;
const modal = (props, id = "modal0000001") => ({ id, type: "modal", props: { buttonLabel: "Ouvrir", title: "Titre", text: "Contenu", ...props } });
// hauteur d'un « espace » bornée à 128 px : on empile des espaces pour obtenir une page qui défile
const spacers = (n, tag) => Array.from({ length: n }, (_, i) => ({ id: tag + String(i).padStart(12 - tag.length, "0"), type: "spacer", props: { size: "128" } }));
const wrap = (...children) => ({ sections: [{ id: "sect00000001", type: "layout", children: [{ id: "box000000001", type: "container", props: {}, children }] }] });

describe("lot 5 : validation des réglages de la fenêtre (sans serveur)", () => {
  test("sans réglage du lot : propriétés inchangées (aucune clé ajoutée)", () => {
    const p = norm({});
    for (const k of ["animIn", "animOut", "overlayColor", "overlayBlur", "noScroll", "startDate", "endDate", "dismissBtn", "target"]) assert.ok(!(k in p), `${k} ne doit pas apparaître`);
  });
  test("animations, superposition et blocage du défilement : conservés ; « aucune » et valeurs inconnues écartées", () => {
    const p = norm({ animIn: "slide-up", animOut: "fade", overlayColor: "#112233", overlayBlur: 8, noScroll: true });
    assert.deepEqual([p.animIn, p.animOut, p.overlayColor, p.overlayBlur, p.noScroll], ["slide-up", "fade", "#112233", 8, true]);
    const q = norm({ animIn: "none", animOut: "spin", overlayBlur: 0, noScroll: "oui" });
    assert.ok(!("animIn" in q) && !("animOut" in q) && !("overlayBlur" in q) && !("noScroll" in q));
    assert.equal(norm({ overlayBlur: 99 }).overlayBlur, undefined, "flou hors bornes ignoré");
  });
  test("couleur de superposition : jeton du site accepté, valeur injectée refusée", () => {
    assert.equal(norm({ overlayColor: "token:primary" }).overlayColor, "token:primary");
    assert.throws(() => norm({ overlayColor: "red;}</style><script>x" }), /couleur de superposition/);
  });
  test("déclencheur « élément visible » : ancre obligatoire et bornée ; « remontée » sans réglage", () => {
    assert.equal(norm({ auto: "element", target: "#tarifs" }).target, "tarifs");
    assert.throws(() => norm({ auto: "element" }), /ancre/);
    assert.throws(() => norm({ auto: "element", target: "a b\"><x" }), /ancre/);
    assert.equal(norm({ auto: "scrollup" }).auto, "scrollup");
    assert.equal(norm({ auto: "element", target: "tarifs" }).freq, "session");
  });
  test("période d'affichage : dates réelles, fin après début ; bouton « Ne plus afficher »", () => {
    const p = norm({ auto: "load", startDate: "2026-12-01", endDate: "2026-12-31", dismissBtn: true });
    assert.deepEqual([p.startDate, p.endDate, p.dismissBtn], ["2026-12-01", "2026-12-31", true]);
    assert.ok(!("startDate" in norm({ auto: "load", startDate: "2026-02-31" })), "date inexistante ignorée");
    assert.throws(() => norm({ auto: "load", startDate: "2026-12-31", endDate: "2026-12-01" }), /date de fin/);
  });
  test("l'éditeur reçoit la liste des animations ; le déclencheur « élément visible » figure dans la liste", () => {
    const spec = nodes.editorSpec();
    assert.deepEqual(spec.modalAnims.map((a) => a[0]), ["none", "fade", "zoom", "slide-up", "slide-down"]);
    assert.ok(spec.modalTriggers.some((t) => t[0] === "element") && spec.modalTriggers.some((t) => t[0] === "scrollup"));
  });
});

describe("lot 5 : enregistrement, canevas et page publiée (vrai serveur)", () => {
  let srv, boss;
  const db = () => srv.db();
  const publish = async (name, content) => {
    const id = Number((await boss.post("/marketing/pages", { name })).location.match(/(\d+)$/)[1]);
    const rev = db().prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(id).revision;
    const put = await boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", json: { revision: rev, content }, headers: { Origin: srv.base } });
    assert.equal(put.status, 200, put.text.slice(0, 300));
    const canvas = await boss.request(`/marketing/pages/${id}/rendu`, { method: "POST", json: { content }, headers: { Origin: srv.base } });
    assert.equal(canvas.status, 200);
    assert.equal((await boss.request(`/marketing/pages/${id}/publier.json`, { method: "POST", json: {}, headers: { Origin: srv.base } })).status, 200);
    const slug = db().prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(id).slug;
    return { id, slug, html: (await boss.get(`/p/${slug}`)).text, canvas: canvas.text, saved: JSON.parse(db().prepare("SELECT sections FROM mk_landing_pages WHERE id = ?").get(id).sections || "[]") };
  };
  before(async () => { srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" }); boss = await loginInstructor(srv); });
  after(() => srv.stop());

  test("réglages enregistrés, relus après rechargement et écrits dans la page publiée (attributs et variables)", async () => {
    const props = { animIn: "zoom", animOut: "slide-down", overlayColor: "#102030", overlayBlur: 6, noScroll: true, auto: "element", target: "tarifs", startDate: "2026-01-01", endDate: "2099-12-31", dismissBtn: true };
    const { html, canvas, saved, id } = await publish("Fenêtre lot 5", wrap(modal(props)));
    const dlg = html.match(/<dialog [^>]*>/)[0];
    assert.match(dlg, /data-kw-anim-in="zoom"/);
    assert.match(dlg, /data-kw-anim-out="slide-down"/);
    assert.match(dlg, /data-kw-noscroll/);
    assert.match(dlg, /style="--kw-ov:#102030;--kw-ov-blur:6px;"/);
    assert.match(dlg, /data-kw-auto="element"/);
    assert.match(dlg, /data-kw-auto-target="tarifs"/);
    assert.match(dlg, /data-kw-auto-from="2026-01-01"/);
    assert.match(dlg, /data-kw-auto-until="2099-12-31"/);
    assert.match(html, /data-kw-modal-dismiss>Ne plus afficher</);
    assert.match(canvas, /data-kw-anim-in="zoom"/, "le canevas de l'éditeur écrit les mêmes réglages");
    assert.ok(!/data-kw-auto=/.test(canvas), "dans l'éditeur, la fenêtre ne s'ouvre jamais d'elle-même");
    const back = saved[0].children[0].children[0].props;
    assert.deepEqual([back.animIn, back.animOut, back.overlayColor, back.overlayBlur, back.noScroll, back.dismissBtn], ["zoom", "slide-down", "#102030", 6, true, true]);
    // rechargement : le contenu relu en base, renvoyé au canevas, redonne les mêmes écritures
    const again = await boss.request(`/marketing/pages/${id}/rendu`, { method: "POST", json: { content: { sections: saved } }, headers: { Origin: srv.base } });
    assert.match(again.text, /--kw-ov-blur:6px;/);
  });

  test("jeton de couleur du site : variable CSS du site ; fenêtre sans réglage : page publiée inchangée", async () => {
    const a = await publish("Fenêtre jeton", wrap(modal({ overlayColor: "token:primary" })));
    assert.match(a.html.match(/<dialog [^>]*>/)[0], /--kw-ov:var\(--kw-primary\);/);
    const b = await publish("Fenêtre simple", wrap(modal({})));
    const tag = b.html.match(/<dialog [^>]*>/)[0];
    assert.ok(!/data-kw-anim|data-kw-noscroll|--kw-ov|data-kw-auto/.test(tag), tag);
    assert.ok(!/data-kw-modal-dismiss/.test(b.html));
  });

  test("valeurs refusées par le serveur avec un message clair (couleur, ancre, dates)", async () => {
    const id = Number((await boss.post("/marketing/pages", { name: "Refus" })).location.match(/(\d+)$/)[1]);
    for (const [props, re] of [[{ overlayColor: "x;}" }, /couleur de superposition/], [{ auto: "element", target: "" }, /ancre/], [{ auto: "load", startDate: "2026-05-02", endDate: "2026-05-01" }, /date de fin/]]) {
      const rev = db().prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(id).revision;
      const res = await boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", json: { revision: rev, content: wrap(modal(props)) }, headers: { Origin: srv.base } });
      assert.ok(res.status >= 400 && res.status < 500, `statut ${res.status} : ${res.text.slice(0, 200)}`);
      assert.match(res.text, re);
    }
  });

  describe("navigateur : page publiée", { skip: SKIP_BROWSER }, () => {
    let browser, ctx;
    before(async () => { browser = await chromium.launch({ executablePath: CHROME, headless: true }); });
    after(async () => { if (browser) await browser.close(); });
    const open = async (html, { reduced = false } = {}) => {
      ctx = await browser.newContext({ viewport: { width: 1000, height: 700 }, reducedMotion: reduced ? "reduce" : "no-preference" });
      const page = await ctx.newPage();
      await page.goto(`${srv.base}${html}`);
      await page.waitForFunction(() => document.querySelector("dialog.kw-modal"));
      await wait(250);
      return page;
    };

    test("clic : animation d'entrée posée puis retirée, page non défilable pendant l'ouverture, animation de sortie puis fermeture, défilement rendu", async () => {
      const { slug } = await publish("Nav animations", wrap(modal({ animIn: "slide-up", animOut: "fade", noScroll: true, overlayColor: "#102030", overlayBlur: 5 })));
      const page = await open(`/p/${slug}`);
      await page.click(".kw-modal-open");
      assert.equal(await page.evaluate(() => document.querySelector("dialog.kw-modal").open), true);
      assert.equal(await page.evaluate(() => document.querySelector("dialog.kw-modal").getAttribute("data-kw-anim")), "slide-up", "animation d'entrée en cours");
      assert.equal(await page.evaluate(() => getComputedStyle(document.documentElement).overflow), "hidden", "défilement de la page bloqué");
      const bd = await page.evaluate(() => { const s = getComputedStyle(document.querySelector("dialog.kw-modal"), "::backdrop"); return [s.backgroundColor, s.backdropFilter]; });
      assert.equal(bd[0], "rgb(16, 32, 48)");
      assert.match(bd[1], /blur\(5px\)/);
      await wait(500);
      assert.equal(await page.evaluate(() => document.querySelector("dialog.kw-modal").hasAttribute("data-kw-anim")), false, "attribut d'animation retiré en fin d'animation");
      await page.click("[data-kw-modal-close]");
      assert.equal(await page.evaluate(() => document.querySelector("dialog.kw-modal").getAttribute("data-kw-anim-out-run")), "fade", "animation de sortie lancée avant la fermeture");
      await page.waitForFunction(() => !document.querySelector("dialog.kw-modal").open, null, { timeout: 3000 });
      await page.waitForFunction(() => getComputedStyle(document.documentElement).overflow !== "hidden", null, { timeout: 3000 }); // défilement rendu à la fermeture
      await ctx.close();
    });

    test("mouvement réduit : aucune animation, fermeture immédiate", async () => {
      const { slug } = await publish("Nav mouvement réduit", wrap(modal({ animIn: "zoom", animOut: "zoom" })));
      const page = await open(`/p/${slug}`, { reduced: true });
      await page.click(".kw-modal-open");
      assert.equal(await page.evaluate(() => document.querySelector("dialog.kw-modal").hasAttribute("data-kw-anim")), false);
      await page.click("[data-kw-modal-close]");
      assert.equal(await page.evaluate(() => document.querySelector("dialog.kw-modal").open), false);
      await ctx.close();
    });

    test("« Ne plus afficher » : ferme, mémorise, et la fenêtre automatique ne revient plus (même après rechargement)", async () => {
      const { slug } = await publish("Nav ne plus afficher", wrap(modal({ auto: "load", delay: 1, freq: "always", dismissBtn: true })));
      const page = await open(`/p/${slug}`);
      await page.waitForFunction(() => document.querySelector("dialog.kw-modal").open, null, { timeout: 4000 });
      await page.click("[data-kw-modal-dismiss]");
      assert.equal(await page.evaluate(() => document.querySelector("dialog.kw-modal").open), false);
      await page.reload();
      await wait(2200);
      assert.equal(await page.evaluate(() => document.querySelector("dialog.kw-modal").open), false, "ne revient pas");
      await page.click(".kw-modal-open");
      assert.equal(await page.evaluate(() => document.querySelector("dialog.kw-modal").open), true, "le bouton d'ouverture manuelle reste utilisable");
      await ctx.close();
    });

    test("période d'affichage : hors période la fenêtre ne s'ouvre pas, dans la période elle s'ouvre", async () => {
      const past = await publish("Nav période passée", wrap(modal({ auto: "load", delay: 1, freq: "always", startDate: "2020-01-01", endDate: "2020-12-31" })));
      let page = await open(`/p/${past.slug}`);
      await wait(2000);
      assert.equal(await page.evaluate(() => document.querySelector("dialog.kw-modal").open), false);
      await ctx.close();
      const now = await publish("Nav période en cours", wrap(modal({ auto: "load", delay: 1, freq: "always", startDate: "2020-01-01", endDate: "2099-12-31" })));
      page = await open(`/p/${now.slug}`);
      await page.waitForFunction(() => document.querySelector("dialog.kw-modal").open, null, { timeout: 4000 });
      await ctx.close();
    });

    test("déclencheur « élément visible » : s'ouvre quand l'ancre entre dans l'écran, pas avant", async () => {
      const filler = spacers(14, "fa");
      const anchor = { id: "anch00000001", type: "menuanchor", props: {}, anchor: "tarifs" };
      const { slug } = await publish("Nav ancre", wrap(modal({ auto: "element", target: "tarifs", freq: "always" }), ...filler, anchor, { id: "text00000001", type: "text", props: { text: "Tarifs" } }));
      const page = await open(`/p/${slug}`);
      await wait(600);
      assert.equal(await page.evaluate(() => document.querySelector("dialog.kw-modal").open), false, "pas avant d'atteindre l'ancre");
      await page.evaluate(() => document.getElementById("tarifs").scrollIntoView());
      await page.waitForFunction(() => document.querySelector("dialog.kw-modal").open, null, { timeout: 4000 });
      await ctx.close();
    });

    test("déclencheur « remontée de page » : ne s'ouvre pas en descendant, s'ouvre en remontant", async () => {
      const filler = spacers(22, "fb");
      const { slug } = await publish("Nav remontée", wrap(modal({ auto: "scrollup", freq: "always" }), ...filler, { id: "text00000002", type: "text", props: { text: "Bas de page" } }));
      const page = await open(`/p/${slug}`);
      await page.evaluate(() => window.scrollTo(0, 1500)); await wait(300);
      await page.evaluate(() => window.scrollTo(0, 1700)); await wait(300);
      assert.equal(await page.evaluate(() => document.querySelector("dialog.kw-modal").open), false, "pas en descendant");
      await page.evaluate(() => window.scrollTo(0, 1500)); await wait(300);
      await page.evaluate(() => window.scrollTo(0, 1300)); await wait(300);
      await page.waitForFunction(() => document.querySelector("dialog.kw-modal").open, null, { timeout: 3000 });
      await ctx.close();
    });
  });
});
