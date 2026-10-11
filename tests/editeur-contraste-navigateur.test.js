// Éditeur de pages — LISIBILITÉ des panneaux (vrai Chrome) en thèmes sombres : tout texte fonctionnel de l'Inspecteur, de Structure et de la
// palette d'éléments, pour 7 types d'éléments et tous leurs onglets, a au moins 4,5:1 de contraste avec son fond RÉEL (opacité et fonds
// superposés comptés) ; les éléments désactivés restent compréhensibles ; les champs se distinguent du panneau (surface et bordure) ;
// aucune surface claire codée en dur ne subsiste dans un panneau sombre. Un nouveau composant qui oublie les jetons de couleur échoue ici.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : parcours navigateur non exécuté sur cette machine" : false;
const ID = (s) => (s + "x").padEnd(12, "0");
const CONTENT = { sections: [{ id: "sect0000001", type: "layout", children: [{ id: ID("cont"), type: "container", styles: { desktop: { paddingTop: "20px" } }, children: [
  { id: ID("head"), type: "heading", props: { text: "Titre", level: 2 } }, { id: ID("txt"), type: "text", props: { html: "<p>Texte</p>" } },
  { id: ID("btn"), type: "button", props: { label: "Bouton", url: "https://kolakisa.com/" } }, { id: ID("img"), type: "image", props: { src: "https://127.0.0.1:1/p.jpg", alt: "x" } },
  { id: ID("tab"), type: "tabs", props: { items: [{ title: "A", text: "a" }, { title: "B", text: "b" }] } }, { id: ID("acc"), type: "accordion", props: { items: [{ q: "Q ?", a: "R." }] } },
] }] }] };
const NODES = ["cont", "head", "txt", "btn", "img", "tab", "acc"];

describe("lisibilité des panneaux sombres (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, pageId;
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
    pageId = Number((await boss.post("/marketing/pages", { name: "Contraste" })).location.match(/(\d+)$/)[1]);
    const rev = srv.db().prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(pageId).revision;
    const put = await boss.request(`/marketing/pages/${pageId}/brouillon`, { method: "PUT", json: { revision: rev, content: CONTENT }, headers: { Origin: srv.base } });
    assert.equal(put.status, 200, put.text);
  });
  after(async () => { if (browser) await browser.close(); if (srv) await srv.stop(); });

  const scanInPage = () => {
    const parse = (c) => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p[3] === undefined ? 1 : p[3] }; };
    const over = (f, bg) => ({ r: f.r * f.a + bg.r * (1 - f.a), g: f.g * f.a + bg.g * (1 - f.a), b: f.b * f.a + bg.b * (1 - f.a), a: 1 });
    const lum = (c) => { const v = [c.r, c.g, c.b].map((x) => { x /= 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; }); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; };
    const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
    const bgOf = (el) => { const st = []; for (let n = el; n; n = n.parentElement) { const c = parse(getComputedStyle(n).backgroundColor); if (c && c.a > 0) { st.push(c); if (c.a >= 1) break; } } let base = { r: 255, g: 255, b: 255, a: 1 }; for (let i = st.length - 1; i >= 0; i--) base = st[i].a >= 1 ? st[i] : over(st[i], base); return base; };
    const opacityOf = (el) => { let o = 1; for (let n = el; n; n = n.parentElement) o *= parseFloat(getComputedStyle(n).opacity); return o; };
    const shown = (el) => { const r = el.getBoundingClientRect(), cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && cs.display !== "none"; };
    const out = { text: [], fields: [], light: [] };
    for (const sel of [".pb-right", ".pb-left", ".pb-tools"]) {
      const zone = document.querySelector(sel); if (!zone) continue;
      zone.querySelectorAll("*").forEach((el) => {
        if (!shown(el)) return;
        const cs = getComputedStyle(el), op = opacityOf(el);
        const f = parse(cs.backgroundColor);
        if (f && f.a > 0.5 && lum(f) > 0.45 && !/pb-swatch|pb-thumb|pb-cpop-|kw-|pb-media|pb-color-btn/.test(String(el.className)) && !el.closest(".pb-cpop")) out.light.push(el.tagName + "." + String(el.className).slice(0, 30));
        const own = [...el.childNodes].filter((n) => n.nodeType === 3 && n.textContent.trim()).map((n) => n.textContent.trim()).join(" ");
        const isField = /^(INPUT|SELECT|TEXTAREA)$/.test(el.tagName) && !/^(checkbox|radio|hidden|color|range)$/.test(el.type || "");
        let text = own;
        if (isField) text = el.tagName === "SELECT" ? (el.options[el.selectedIndex] || {}).text || "" : (el.value || el.placeholder || "");
        if (!text || op < 0.05) return; // texte absent, ou élément volontairement caché jusqu'au survol
        const fg = parse(cs.color), bg = bgOf(el);
        out.text.push({ cls: el.tagName + "." + String(el.className).split(" ")[0], text: text.slice(0, 20), r: ratio(over({ ...fg, a: fg.a * op }, bg), bg), disabled: Boolean(el.disabled || el.closest(":disabled") || el.getAttribute("aria-disabled") === "true") });
      });
      zone.querySelectorAll("input[type=text], input[type=search], select, textarea, .pb-len").forEach((el) => {
        if (!shown(el)) return; const cs = getComputedStyle(el), panel = bgOf(el.parentElement || el), f = parse(cs.backgroundColor), bc = parse(cs.borderTopColor);
        if (!f || !bc || el.closest(".pb-len") || el.classList.contains("pb-box-input")) return;
        out.fields.push({ cls: el.tagName + "." + String(el.className).split(" ")[0], surface: ratio(f.a > 0 ? over(f, panel) : panel, panel), border: ratio(over(bc, panel), panel) });
      });
    }
    return out;
  };

  for (const [skin, label] of [["classic", "Classique sombre"], ["navy", "Navy Premium"]]) {
    test(`${label} : textes ≥ 4,5:1, désactivés lisibles, champs distincts, aucune surface claire`, async () => {
      // Mouvement réduit : les apparitions (fondus de quelques dizaines de ms) ne faussent pas la mesure d'opacité des textes
      const ctx = await browser.newContext({ viewport: { width: 1700, height: 1100 }, reducedMotion: "reduce" });
      await ctx.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
      await ctx.addInitScript(([k]) => { try { localStorage.setItem("pb:palette-theme", '"dark"'); localStorage.setItem("pb:editor-skin", JSON.stringify(k)); } catch { /* sans effet */ } }, [skin]);
      const page = await ctx.newPage();
      await page.goto(`${srv.base}/marketing/pages/${pageId}/editeur`);
      await page.waitForFunction(() => document.querySelector("[data-pb-frame]").contentDocument.querySelector("[data-node-id]"), null, { timeout: 30000 });
      await page.waitForTimeout(800);
      assert.equal(await page.evaluate(() => document.body.dataset.palette), "dark");
      const all = { text: [], fields: [], light: [] };
      const add = (r) => { all.text.push(...r.text); all.fields.push(...r.fields); all.light.push(...r.light); };
      add(await page.evaluate(`(${scanInPage})()`));
      for (const n of NODES) {
        await page.locator(`[data-pb-layers] .pb-node[data-id="${ID(n)}"] > .pb-row-item`).click(); await page.waitForTimeout(300);
        for (const tab of ["Général", "Style", "Interactions", "Contenu", "Avancé"]) {
          const t = page.locator(".pb-right button", { hasText: new RegExp(`^${tab}$`) }).first(); if (!(await t.count())) continue;
          await t.click(); await page.waitForTimeout(220);
          for (let i = 0; i < 20; i++) { const d = page.locator(".pb-inspector details.pb-acc:not([open]) > summary").first(); if (!(await d.count())) break; await d.click().catch(() => {}); }
          add(await page.evaluate(`(${scanInPage})()`));
        }
      }
      await ctx.close();
      const uniq = (rows, f) => [...new Map(rows.map((r) => [f(r), r])).values()];
      assert.ok(all.text.length > 400, `${all.text.length} textes mesurés`);
      const lowText = uniq(all.text.filter((r) => !r.disabled && r.r < 4.5), (r) => r.cls + r.text);
      assert.deepEqual(lowText.map((r) => `${r.cls} « ${r.text} » ${r.r.toFixed(2)}`), [], "textes fonctionnels sous 4,5:1");
      const lowDisabled = uniq(all.text.filter((r) => r.disabled && r.r < 3), (r) => r.cls + r.text);
      assert.deepEqual(lowDisabled.map((r) => `${r.cls} « ${r.text} » ${r.r.toFixed(2)}`), [], "éléments désactivés sous 3:1 (atténués, jamais invisibles)");
      const weakFields = uniq(all.fields.filter((f) => f.surface < 1.15 || f.border < 1.4), (f) => f.cls);
      assert.deepEqual(weakFields.map((f) => `${f.cls} surface ${f.surface.toFixed(2)} bordure ${f.border.toFixed(2)}`), [], "champs qui se fondent dans le panneau (surface ≥ 1,15:1 et bordure ≥ 1,4:1 attendues)");
      assert.deepEqual([...new Set(all.light)], [], "surfaces claires codées en dur dans un panneau sombre");
    });
  }
});
