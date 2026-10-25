// Page « À propos » dans un VRAI Chrome : 9 largeurs (320 à 1920 px), contenu par défaut puis contenu saisi avec mots interminables,
// aucun défilement horizontal, aucun élément hors cadre, un seul h1, contraste du texte du bandeau, focus visible au clavier, mouvement réduit respecté, éditeur.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { startServer, loginInstructor, createCourse } = require("./helpers");
const { measure } = require("../scripts/lib/auditMeasure");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : parcours navigateur non exécuté sur cette machine" : false;
const WIDTHS = [320, 360, 390, 430, 768, 1024, 1280, 1440, 1920];
const LONGWORD = "Anticonstitutionnellement".repeat(6);
const lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };

describe("à propos (navigateur)", { skip: SKIP }, () => {
  let srv, prof, browser;
  before(async () => {
    srv = await startServer(); prof = await loginInstructor(srv);
    await createCourse(prof, srv, { title: "Excel", price: 10 });
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
  });
  after(async () => { if (browser) await browser.close(); await srv.stop(); });
  const open = async (width, opts = {}) => {
    const touch = width <= 768;
    const ctx = await browser.newContext({ viewport: { width, height: 900 }, hasTouch: touch, isMobile: touch, deviceScaleFactor: touch ? 2 : 1, ...opts });
    const page = await ctx.newPage(); const errors = [];
    page.on("pageerror", (e) => errors.push(String(e.message))); page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
    return { ctx, page, errors };
  };
  const audit = async (label) => {
    const problems = [];
    for (const width of WIDTHS) {
      const { ctx, page, errors } = await open(width);
      await page.goto(srv.base + "/a-propos", { waitUntil: "load" });
      if (process.env.ABOUT_SHOTS && (width === 390 || width === 1280)) await page.screenshot({ path: `${process.env.ABOUT_SHOTS}/${label}-${width}.png`, fullPage: true });
      const geom = (await page.evaluate(measure)).filter((g) => (g.kind === "h-scroll" || g.kind === "hors-cadre" || g.kind === "chevauchement") && !/sr-only|skip/.test(g.sel) && !/app-dock|mk-nav/.test(g.sel));
      const m = await page.evaluate(() => ({ over: document.documentElement.scrollWidth - innerWidth, h1: document.querySelectorAll("h1").length, imgs: [...document.images].filter((i) => i.complete && !i.naturalWidth).length }));
      const bad = [m.over > 1 && `défilement horizontal ${m.over}px`, geom.length && `géométrie ${geom.map((g) => g.kind + ":" + g.sel).join(",")}`, m.h1 !== 1 && `h1=${m.h1}`, m.imgs && `images cassées ${m.imgs}`, errors.length && `console ${errors[0]}`].filter(Boolean);
      if (bad.length) problems.push(`${label} @${width} : ${bad.join(" ; ")}`);
      await ctx.close();
    }
    return problems;
  };

  test("contenu par défaut : 9 largeurs sans défaut", async () => { assert.deepEqual(await audit("defaut"), []); });

  test("contenu saisi (mots interminables, nombreuses parties) : 9 largeurs sans défaut", async () => {
    const parts = Array.from({ length: 6 }, (_, i) => `## Partie ${i + 1} ${LONGWORD}\n\nTexte ${LONGWORD} avec un [lien](https://example.com/${LONGWORD}).\n\n- **Point ${i}.** ${LONGWORD}\n- **Autre.** court`).join("\n\n");
    await prof.post("/formateur/pages/a-propos", { content: `# Titre ${LONGWORD}\n\nIntroduction ${LONGWORD}.\n\nSuite.\n\n${parts}`, seo_description: "" });
    assert.deepEqual(await audit("saisi"), []);
    await prof.post("/formateur/pages/a-propos", { content: "", seo_description: "" });
  });

  test("contraste : texte du bandeau et du corps ≥ 4,5:1", async () => {
    const { ctx, page } = await open(1280);
    await page.goto(srv.base + "/a-propos", { waitUntil: "load" });
    const c = await page.evaluate(() => { const rgb = (s) => s.match(/\d+(\.\d+)?/g).slice(0, 3).map(Number); const q = (sel) => getComputedStyle(document.querySelector(sel)).color; return { h1: rgb(q(".about-hero h1")), lead: rgb(q(".about-lead")), fact: rgb(q(".about-fact a")), body: rgb(q(".about-text")), muted: rgb(q(".about-text ul li")), bg: [11, 42, 64], white: [255, 255, 255] }; });
    for (const k of ["h1", "lead", "fact"]) assert.ok(ratio(c[k], c.bg) >= 4.5, `${k} sur le bandeau : ${ratio(c[k], c.bg).toFixed(2)}`);
    for (const k of ["body", "muted"]) assert.ok(ratio(c[k], c.white) >= 4.5, `${k} sur blanc : ${ratio(c[k], c.white).toFixed(2)}`);
    await ctx.close();
  });

  test("clavier : le lien du catalogue et les boutons de fin ont un focus visible", async () => {
    const { ctx, page } = await open(1280);
    await page.goto(srv.base + "/a-propos", { waitUntil: "load" });
    for (const sel of [".about-fact a", ".about-close .btn-primary", ".about-close .btn-outline"]) {
      await page.focus(sel);
      const ring = await page.evaluate(() => { const s = getComputedStyle(document.activeElement); return (s.outlineStyle !== "none" && parseFloat(s.outlineWidth) >= 1) || s.boxShadow !== "none"; });
      assert.ok(ring, `focus visible sur ${sel}`);
    }
    await ctx.close();
  });

  test("mouvement : animation d'ouverture présente par défaut, supprimée si l'utilisateur demande moins de mouvement", async () => {
    const a = await open(1280); await a.page.goto(srv.base + "/a-propos", { waitUntil: "load" });
    assert.equal(await a.page.evaluate(() => getComputedStyle(document.querySelector(".about-hero h1")).animationName), "about-rise");
    await a.ctx.close();
    const b = await open(1280, { reducedMotion: "reduce" }); await b.page.goto(srv.base + "/a-propos", { waitUntil: "load" });
    assert.equal(await b.page.evaluate(() => getComputedStyle(document.querySelector(".about-hero h1")).animationName), "none");
    await b.ctx.close();
  });

  test("éditeur : un bouton ajoute un titre, le compteur suit, l'alerte de sortie est armée", async () => {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    await ctx.addCookies([...prof.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    const page = await ctx.newPage();
    await page.goto(srv.base + "/formateur/pages/a-propos", { waitUntil: "load" });
    await page.getByRole("button", { name: "Notre mission" }).click();
    assert.match(await page.inputValue("#page-content"), /## Notre mission/);
    assert.notEqual((await page.textContent("[data-page-count]")).trim(), "0");
    await page.fill("#page-desc", "x".repeat(40));
    assert.equal((await page.textContent("[data-page-desc-count]")).trim(), "40");
    // Chrome sans affichage n'ouvre pas la boîte « quitter la page ? » : on vérifie que l'événement est bien intercepté (c'est lui qui déclenche la boîte)
    const armed = await page.evaluate(() => { const e = new Event("beforeunload", { cancelable: true }); window.dispatchEvent(e); return e.defaultPrevented; });
    assert.ok(armed, "avertissement armé quand il y a des modifications non enregistrées");
    await ctx.close();
  });
});
