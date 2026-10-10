// Éditeur de pages — CHAQUE réglage d'un conteneur est EFFECTIF : valeur enregistrée → CSS réellement appliqué dans la page publiée (vrai
// Chrome, style calculé). Détecte un réglage « décoratif » (écrasé par une règle par défaut plus spécifique), pour un conteneur de premier
// niveau, un conteneur en pleine largeur et un conteneur IMBRIQUÉ (le cas le plus exposé aux règles par défaut).
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : parcours navigateur non exécuté sur cette machine" : false;

// [propriété enregistrée, valeur, propriété CSS calculée, valeur attendue, réglages associés nécessaires]
const CASES = [
  ["width", "300px", "width", "300px"], ["width", "40%", "width", null], ["minWidth", "280px", "min-width", "280px"], ["maxWidth", "260px", "max-width", "260px"],
  ["height", "120px", "height", "120px"], ["minHeight", "130px", "min-height", "130px"], ["maxHeight", "90px", "max-height", "90px"],
  ["marginTop", "17px", "margin-top", "17px"], ["marginRight", "19px", "margin-right", "19px"], ["marginBottom", "21px", "margin-bottom", "21px"], ["marginLeft", "23px", "margin-left", "23px"],
  ["paddingTop", "11px", "padding-top", "11px"], ["paddingRight", "12px", "padding-right", "12px"], ["paddingBottom", "13px", "padding-bottom", "13px"], ["paddingLeft", "14px", "padding-left", "14px"],
  ["display", "grid", "display", "grid"], ["display", "block", "display", "block"], ["flexDirection", "row", "flex-direction", "row"], ["flexDirection", "column-reverse", "flex-direction", "column-reverse"],
  ["flexWrap", "wrap", "flex-wrap", "wrap"], ["justifyContent", "space-between", "justify-content", "space-between"], ["alignItems", "center", "align-items", "center"], ["alignContent", "center", "align-content", "center"],
  ["gap", "33px", "row-gap", "33px"], ["rowGap", "9px", "row-gap", "9px"], ["columnGap", "8px", "column-gap", "8px"],
  ["alignSelf", "flex-end", "align-self", "flex-end"], ["order", 3, "order", "3"], ["flexGrow", 2, "flex-grow", "2"], ["flexShrink", 0, "flex-shrink", "0"], ["flexBasis", "240px", "flex-basis", "240px"],
  ["position", "relative", "position", "relative"], ["position", "absolute", "position", "absolute"], ["zIndex", 7, "z-index", "7"],
  ["overflow", "hidden", "overflow", "hidden"], ["overflow", "auto", "overflow", "auto"], ["opacity", 0.5, "opacity", "0.5"],
  ["backgroundColor", "#336699", "background-color", "rgb(51, 102, 153)"], ["borderStyle", "solid", "border-top-style", "solid"], ["borderWidth", "3px", "border-top-width", "3px", { borderStyle: "solid" }],
  ["borderRadius", "9px", "border-top-left-radius", "9px"], ["color", "#aa0000", "color", "rgb(170, 0, 0)"], ["fontSize", "21px", "font-size", "21px"],
];
const CONTEXTS = [["premier niveau (encadré)", { nest: false, full: false }], ["premier niveau (pleine largeur)", { nest: false, full: true }], ["imbriqué", { nest: true, full: false }]];
const ID = (s) => (s + "x").padEnd(12, "0");

describe("réglages de conteneur effectifs (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, ctx, slug;
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
    ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const sections = [];
    for (const [cname, c] of CONTEXTS) {
      const ci = CONTEXTS.findIndex((x) => x[0] === cname);
      const kids = CASES.map((cs, i) => {
        const id = ID(`c${ci}${String(i).padStart(2, "0")}`);
        const target = { id, type: "container", props: c.full ? { full: true } : undefined, styles: { desktop: { [cs[0]]: cs[1], ...(cs[4] || {}) } }, children: [{ id: ID(`t${ci}${String(i).padStart(2, "0")}`), type: "text", props: { html: "<p>x</p><p>y</p><p>z</p>" } }] };
        if (!target.props) delete target.props;
        return c.nest ? { id: ID(`p${ci}${String(i).padStart(2, "0")}`), type: "container", props: { full: true }, children: [target] } : target;
      });
      sections.push({ id: `sect${String(ci + 1).padStart(7, "0")}`, type: "layout", children: kids });
    }
    // Mêmes réglages sur des widgets (titre, texte, bouton) placés dans un conteneur Flexbox : la boîte d'un widget obéit aussi à ses réglages
    const WIDGETS = [["heading", { text: "Titre", level: 2 }], ["text", { html: "<p>Texte</p>" }], ["button", { label: "Bouton", url: "https://kolakisa.com/" }]];
    WIDGETS.forEach(([type, props], wi) => {
      const kids = CASES.filter((cs) => !["display", "flexDirection", "flexWrap", "justifyContent", "alignItems", "alignContent", "gap", "rowGap", "columnGap"].includes(cs[0])).map((cs, i) => ({ id: ID(`w${wi}${String(i).padStart(2, "0")}`), type, props, styles: { desktop: { [cs[0]]: cs[1], ...(cs[4] || {}) } } }));
      sections.push({ id: `sect${String(10 + wi).padStart(7, "0")}`, type: "layout", children: [{ id: ID(`wr${wi}`), type: "container", props: { full: true }, styles: { desktop: { display: "flex", flexDirection: "column" } }, children: kids }] });
    });
    const pageId = Number((await boss.post("/marketing/pages", { name: "Propriétés" })).location.match(/(\d+)$/)[1]);
    const rev = srv.db().prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(pageId).revision;
    const put = await boss.request(`/marketing/pages/${pageId}/brouillon`, { method: "PUT", json: { revision: rev, content: { sections } }, headers: { Origin: srv.base } });
    assert.equal(put.status, 200, put.text.slice(0, 300));
    slug = srv.db().prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(pageId).slug;
    assert.equal((await boss.request(`/marketing/pages/${pageId}/publier.json`, { method: "POST", json: {} })).status, 200);
  });
  after(async () => { if (browser) await browser.close(); if (srv) await srv.stop(); });

  for (const [cname] of CONTEXTS) {
    test(`conteneur ${cname} : les ${CASES.length} réglages ont leur effet réel`, async () => {
      const ci = CONTEXTS.findIndex((x) => x[0] === cname);
      const page = await ctx.newPage();
      await page.goto(`${srv.base}/p/${slug}`);
      const got = await page.evaluate(([ci, cases]) => cases.map((cs, i) => {
        const id = `c${ci}${String(i).padStart(2, "0")}x`.padEnd(12, "0");
        const e = document.querySelector(`.kw-n-${id}`); if (!e) return null;
        const c = getComputedStyle(e); const out = c.getPropertyValue(cs[2]);
        return { out, parentW: e.parentElement.getBoundingClientRect().width, w: e.getBoundingClientRect().width };
      }), [ci, CASES]);
      await page.close();
      const bad = [];
      CASES.forEach((cs, i) => {
        const g = got[i];
        if (!g) { bad.push(`${cs[0]}=${cs[1]} : élément absent`); return; }
        if (cs[3] === null) { if (Math.abs(g.w - g.parentW * 0.4) > 1.5) bad.push(`${cs[0]}=${cs[1]} : ${g.w.toFixed(1)} px au lieu de 40 % de ${g.parentW.toFixed(1)}`); return; }
        if (g.out !== cs[3]) bad.push(`${cs[0]}=${cs[1]} → ${cs[2]} : « ${g.out} » au lieu de « ${cs[3]} »`);
      });
      assert.deepEqual(bad, [], bad.join(" | "));
    });
  }
  for (const [type] of [["heading"], ["text"], ["button"]]) {
    test(`widget « ${type} » dans un conteneur Flexbox : ses réglages de boîte ont leur effet réel`, async () => {
      const wi = ["heading", "text", "button"].indexOf(type);
      const list = CASES.filter((cs) => !["display", "flexDirection", "flexWrap", "justifyContent", "alignItems", "alignContent", "gap", "rowGap", "columnGap"].includes(cs[0]));
      const page = await ctx.newPage();
      await page.goto(`${srv.base}/p/${slug}`);
      const got = await page.evaluate(([wi, cases]) => cases.map((cs, i) => {
        const id = `w${wi}${String(i).padStart(2, "0")}x`.padEnd(12, "0");
        const e = document.querySelector(`.kw-n-${id}`); if (!e) return null;
        return { out: getComputedStyle(e).getPropertyValue(cs[2]), parentW: e.parentElement.getBoundingClientRect().width, w: e.getBoundingClientRect().width };
      }), [wi, list]);
      await page.close();
      const bad = [];
      list.forEach((cs, i) => {
        const g = got[i];
        if (!g) { bad.push(`${cs[0]}=${cs[1]} : élément absent`); return; }
        if (cs[3] === null) { if (Math.abs(g.w - g.parentW * 0.4) > 1.5) bad.push(`${cs[0]}=${cs[1]} : ${g.w.toFixed(1)} px au lieu de 40 % de ${g.parentW.toFixed(1)}`); return; }
        if (g.out !== cs[3]) bad.push(`${cs[0]}=${cs[1]} → ${cs[2]} : « ${g.out} » au lieu de « ${cs[3]} »`);
      });
      assert.deepEqual(bad, [], bad.join(" | "));
    });
  }
});
