// Accessibilité de base des widgets sur la page publiée (Chrome réel) : tout ce qui est actionnable a un nom, les images ont un texte alternatif,
// les cadres un titre, aucun identifiant en double, aucun tabindex positif, et un repère de focus visible au clavier. Les widgets fautifs sont nommés.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");
const { creatable, idOf, build } = require("./widgets-helpers");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : parcours navigateur non exécuté sur cette machine" : false;

describe("accessibilité des widgets sur la page publiée (Chrome réel)", { skip: SKIP }, () => {
  let srv, browser, page;
  const usable = [];
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    const boss = await loginInstructor(srv); const db = srv.db();
    const put = async (id, content) => boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", json: { revision: db.prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(id).revision, content }, headers: { Origin: srv.base } });
    for (const t of creatable) {
      const id = Number((await boss.post("/marketing/pages", { name: "A11y " + t })).location.match(/(\d+)$/)[1]);
      assert.equal((await put(id, build([t], false))).status, 200);
      if ((await boss.postJson(`/marketing/pages/${id}/publier.json`, {})).status === 200) usable.push(t);
    }
    const id = Number((await boss.post("/marketing/pages", { name: "A11y tout" })).location.match(/(\d+)$/)[1]);
    assert.equal((await put(id, build(usable, false))).status, 200);
    assert.equal((await boss.postJson(`/marketing/pages/${id}/publier.json`, {})).status, 200);
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
    page = await (await browser.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
    await page.goto(`${srv.base}/p/${db.prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(id).slug}`, { waitUntil: "load" });
    await page.waitForTimeout(800);
  });
  after(async () => { if (browser) await browser.close(); if (srv) await srv.stop(); });

  // Les constats sont rattachés au widget (élément .kw-n-<id>) qui les contient
  const owner = `(el) => { const w = el.closest('[class*="kw-n-pub"]'); const m = w && /kw-n-(pub\\d+)/.exec(w.className); return m ? m[1] : "(hors widget)"; }`;
  const typeOf = (key) => { const i = Number(String(key).replace("pub", "")); return usable[i] || key; };

  const findNameless = () => page.evaluate(`(() => {
      const owner = ${owner};
      const name = (el) => {
        const lb = el.getAttribute("aria-labelledby"); if (lb && lb.split(/\\s+/).some((i) => (document.getElementById(i) || {}).textContent)) return "ok";
        if ((el.getAttribute("aria-label") || "").trim()) return "ok";
        if (el.labels && [...el.labels].some((l) => l.textContent.trim())) return "ok";
        if ((el.textContent || "").trim()) return "ok";
        if ([...el.querySelectorAll("img[alt]")].some((i) => i.alt.trim())) return "ok";
        if ((el.getAttribute("title") || "").trim()) return "ok";
        if (el.tagName === "INPUT" && ["submit", "button"].includes(el.type) && el.value) return "ok";
        return "";
      };
      const out = [];
      document.querySelectorAll('a[href], button, input:not([type=hidden]), select, textarea, summary, [role=button], [role=tab], [role=link]').forEach((el) => {
        if (el.closest("[hidden], dialog:not([open])")) return;
        if (!name(el)) out.push(owner(el) + " : " + el.tagName.toLowerCase() + (el.className ? "." + String(el.className).split(" ")[0] : ""));
      });
      return out;
    })()`);
  const findStructure = () => page.evaluate(`(() => {
      const owner = ${owner};
      const out = { img: [], iframe: [], ids: [], tab: [] };
      document.querySelectorAll("img").forEach((i) => { if (!i.hasAttribute("alt")) out.img.push(owner(i)); });
      document.querySelectorAll("iframe").forEach((f) => { if (!(f.getAttribute("title") || "").trim()) out.iframe.push(owner(f)); });
      const seen = {}; document.querySelectorAll("[id]").forEach((e) => { seen[e.id] = (seen[e.id] || 0) + 1; }); for (const k in seen) if (seen[k] > 1) out.ids.push(k);
      document.querySelectorAll("[tabindex]").forEach((e) => { if (Number(e.getAttribute("tabindex")) > 0) out.tab.push(owner(e)); });
      return out;
    })()`);

  test("tout contrôle actionnable de la page publiée a un nom accessible", async () => {
    const bad = await findNameless();
    const named = bad.map((b) => { const [k, rest] = b.split(" : "); return `${typeOf(k)} (${rest})`; });
    assert.deepEqual(named, [], "contrôles sans nom accessible");
  });

  test("images avec texte alternatif, cadres avec titre, identifiants uniques, pas de tabindex positif", async () => {
    const r = await findStructure();
    assert.deepEqual({ img: r.img.map(typeOf), iframe: r.iframe.map(typeOf), ids: r.ids, tab: r.tab.map(typeOf) }, { img: [], iframe: [], ids: [], tab: [] });
  });

  test("témoin : les contrôles ci-dessus détectent bien un bouton sans nom, une image sans alt, un cadre sans titre, un identifiant en double", async () => {
    await page.evaluate(() => { document.body.insertAdjacentHTML("beforeend", '<button id="dup-t"></button><span id="dup-t"></span><img src="data:image/gif;base64,R0lGODlhAQABAAAAACw="><iframe src="about:blank"></iframe><i tabindex="3"></i>'); });
    const a = await findNameless(), b = await findStructure();
    assert.ok(a.some((x) => /button/.test(x)), "bouton sans nom non détecté");
    assert.ok(b.img.length && b.iframe.length && b.ids.includes("dup-t") && b.tab.length, `témoin non détecté : ${JSON.stringify(b)}`);
    await page.reload({ waitUntil: "load" }); await page.waitForTimeout(500);
  });

  test("les boîtes de dialogue sont nommées et le focus clavier est visible sur les contrôles", async () => {
    const dialogs = await page.evaluate(() => [...document.querySelectorAll("dialog")].filter((d) => !(d.getAttribute("aria-label") || d.getAttribute("aria-labelledby"))).length);
    assert.equal(dialogs, 0, "dialogues sans nom");
    // Tab parcourt les contrôles ; chacun doit montrer un repère (contour ou ombre) quand il a le focus au clavier
    const invisible = [];
    await page.evaluate(() => document.body.focus());
    for (let i = 0; i < 90; i++) {
      await page.keyboard.press("Tab");
      const info = await page.evaluate(() => {
        const e = document.activeElement; if (!e || e === document.body) return null;
        const cs = getComputedStyle(e);
        const m = /kw-n-(pub\d+)/.exec((e.closest('[class*="kw-n-pub"]') || {}).className || "");
        const shown = (cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) > 0) || (cs.boxShadow && cs.boxShadow !== "none") || e.matches(":focus-visible") && cs.outlineStyle !== "none";
        return { key: m ? m[1] : "", tag: e.tagName.toLowerCase(), cls: String(e.className).split(" ")[0], shown: !!shown, hidden: cs.visibility === "hidden" || e.offsetParent === null && cs.position !== "fixed", native: ["IFRAME", "AUDIO", "VIDEO"].includes(e.tagName) };
      });
      if (info && !info.shown && !info.hidden && !info.native) // lecteurs et cadres intégrés : le navigateur dessine lui-même leur repère
         invisible.push(`${typeOf(info.key)} (${info.tag}.${info.cls})`);
    }
    assert.deepEqual([...new Set(invisible)], [], "contrôles sans repère de focus visible");
  });
});
