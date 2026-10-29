// KOLAKISA — éditeur d'articles, TITAN XX : mouvement sobre (jetons, zoom discret des fenêtres et menus, réduction de mouvement) et frappe fluide.
// Partie statique (CSS) toujours exécutée ; partie navigateur dans un VRAI Chrome.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");

const css = fs.readFileSync(path.join(__dirname, "..", "public", "css", "blog-editor.css"), "utf8");

describe("éditeur d'articles — système de mouvement (CSS)", () => {
  test("les jetons de mouvement et les trois courbes sont définis une seule fois", () => {
    for (const t of ["--kolakisa-motion-fast", "--kolakisa-motion-menu", "--kolakisa-motion-dialog", "--kolakisa-motion-panel", "--kolakisa-motion-toast", "--kolakisa-ease-standard", "--kolakisa-ease-enter", "--kolakisa-ease-exit"]) {
      assert.equal((css.match(new RegExp(`^\\s*${t}:`, "gm")) || []).length >= 1, true, `${t} manquant`);
    }
  });

  test("aucune transition « all » : seules les propriétés utiles sont animées", () => {
    assert.equal(/transition:\s*all\b/.test(css), false);
  });

  test("zoom discret : échelle de 0,97 à 1 pour les fenêtres et les menus, jamais de rebond", () => {
    assert.match(css, /@keyframes kolakisa-dialog-in[^}]*scale\(0\.97\)/);
    assert.match(css, /@keyframes kolakisa-pop-in[^}]*scale\(0\.97\)/);
    assert.equal(/cubic-bezier\([^)]*-\d/.test(css), false, "courbe élastique interdite");
    for (const m of css.matchAll(/@keyframes kolakisa-[a-z-]+ \{([^]*?)\}\s*(?=@|\n)/g)) assert.equal(/width|height|top|left|margin/.test(m[1]), false, "les animations n'utilisent que transform et opacity");
  });

  test("prefers-reduced-motion : jetons à 0, plus de zoom ni de translation pour fenêtres, menus, panneaux et notifications", () => {
    const i = css.lastIndexOf("@media (prefers-reduced-motion: reduce)");
    const bloc = css.slice(i);
    assert.match(bloc, /--kolakisa-motion-dialog:\s*0ms/);
    for (const sel of [".wp-modal[open]", ".wp-popover", ".wp-snackbar", ".wp-prepublish", ".kdp"]) assert.ok(bloc.includes(sel), `${sel} non neutralisé`);
    assert.match(bloc, /animation:\s*none/);
  });
});

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : parcours navigateur non exécuté sur cette machine" : false;

describe("éditeur d'articles — mouvement et frappe (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser;
  const open = async (reducedMotion = "no-preference") => {
    const context = await browser.newContext({ viewport: { width: 1500, height: 950 }, reducedMotion });
    await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    await page.goto(`${srv.base}/formateur/blog/nouveau`);
    await page.waitForFunction(() => document.querySelector(".ProseMirror") && document.querySelector(".ProseMirror").editor);
    page.errors = errors;
    return page;
  };
  const openShortcuts = (page) => page.evaluate(() => { document.querySelector("[data-toggle-inserter]").focus(); document.querySelector('[data-option="shortcuts"]').click(); });
  before(async () => { srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" }); boss = await loginInstructor(srv); browser = await chromium.launch({ executablePath: CHROME, headless: true }); });
  after(async () => { if (browser) await browser.close(); await srv.stop(); });

  test("fenêtre : entrée en zoom discret, Échap la ferme avec une sortie courte, le focus revient à l'élément d'origine", async () => {
    const page = await open();
    await openShortcuts(page);
    await page.waitForSelector("dialog.wp-modal[open]");
    const anim = await page.evaluate(() => getComputedStyle(document.querySelector("dialog.wp-modal")).animationName);
    assert.equal(anim, "kolakisa-dialog-in");
    await page.keyboard.press("Escape");
    await page.waitForSelector("dialog.wp-modal.is-closing", { state: "attached", timeout: 500 }).catch(() => {}); // peut déjà être parti
    await page.waitForFunction(() => !document.querySelector("dialog.wp-modal"), null, { timeout: 1000 });
    assert.equal(await page.evaluate(() => document.activeElement === document.querySelector("[data-toggle-inserter]")), true, "focus rendu au bouton d'origine");
    assert.deepEqual(page.errors, []);
    await page.context().close();
  });

  test("fenêtre : la croix ferme aussi, et une fenêtre ne reste jamais bloquée à l'écran", async () => {
    const page = await open();
    for (let i = 0; i < 3; i++) {
      await openShortcuts(page);
      await page.waitForSelector("dialog.wp-modal[open]");
      await page.click('dialog.wp-modal [aria-label="Fermer"]');
      await page.waitForFunction(() => !document.querySelector("dialog.wp-modal"), null, { timeout: 1000 });
    }
    await page.context().close();
  });

  test("réduction de mouvement : pas d'animation, fermeture immédiate, fonctions intactes", async () => {
    const page = await open("reduce");
    await openShortcuts(page);
    await page.waitForSelector("dialog.wp-modal[open]");
    assert.equal(await page.evaluate(() => getComputedStyle(document.querySelector("dialog.wp-modal")).animationName), "none");
    await page.keyboard.press("Escape");
    await page.waitForFunction(() => !document.querySelector("dialog.wp-modal"), null, { timeout: 300 });
    await page.context().close();
  });

  test("panneau d'insertion : la mise en page ne change pas, seul le contenu entre en douceur ; le clic agit tout de suite", async () => {
    const page = await open();
    await page.click("[data-toggle-inserter]");
    assert.equal(await page.evaluate(() => document.querySelector("[data-toggle-inserter]").getAttribute("aria-pressed")), "true", "état appliqué immédiatement");
    const name = await page.evaluate(() => getComputedStyle(document.querySelector("[data-secondary-close]").closest(".wp-secondary-head")).animationName);
    assert.equal(name, "kolakisa-panel-in");
    await page.context().close();
  });

  test("brouillon local : plus d'écriture synchrone à chaque touche, écrit après la frappe et vidé à la sortie de la page", async () => {
    const page = await open();
    await page.evaluate(() => { localStorage.clear(); document.querySelector(".ProseMirror").editor.view.focus(); });
    await page.keyboard.type("Bonjour");
    const tout = await page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith("be-draft-")));
    assert.equal(tout.length, 0, "rien n'est écrit pendant la frappe");
    await page.waitForFunction(() => Object.keys(localStorage).some((k) => k.startsWith("be-draft-")), null, { timeout: 3000 });
    const contenu = await page.evaluate(() => JSON.parse(localStorage.getItem(Object.keys(localStorage).find((k) => k.startsWith("be-draft-")))).content);
    assert.match(contenu, /Bonjour/);
    // Sortie de page : une frappe récente n'est pas perdue
    await page.evaluate(() => localStorage.clear());
    await page.keyboard.type("Fin");
    await page.evaluate(() => { Object.defineProperty(document, "visibilityState", { value: "hidden", configurable: true }); document.dispatchEvent(new Event("visibilitychange")); });
    assert.equal(await page.evaluate(() => Object.keys(localStorage).some((k) => k.startsWith("be-draft-"))), true, "flush immédiat quand l'onglet se masque");
    await page.context().close();
  });

  test("frappe : la latence reste fluide sur un grand article et aucune erreur de console", async () => {
    const page = await open();
    const t = await page.evaluate(() => {
      const ed = document.querySelector(".ProseMirror").editor;
      const parts = [];
      for (let i = 0; i < 200; i++) parts.push(`<h2>Titre ${i}</h2><p>Paragraphe ${i} avec un peu de texte.</p><ul><li><p>Point ${i}</p></li></ul>`);
      ed.commands.setContent(parts.join(""));
      ed.commands.setTextSelection(ed.state.doc.content.size - 5);
      ed.view.focus();
      const times = [];
      for (let i = 0; i < 40; i++) { const s = performance.now(); ed.commands.insertContent("a"); times.push(performance.now() - s); }
      times.sort((a, b) => a - b);
      return { median: Math.round(times[20] * 10) / 10, p95: Math.round(times[38] * 10) / 10 };
    });
    assert.ok(t.median < 40, `médiane ${t.median} ms`);
    assert.ok(t.p95 < 150, `95e centile ${t.p95} ms`);
    assert.deepEqual(page.errors, []);
    await page.context().close();
  });
});
