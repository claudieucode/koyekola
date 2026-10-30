// Palier 15 — accessibilité : défauts reproduits dans Chrome réel (sonde scripts/a11y/audit-accessibilite.js) puis corrigés.
//  A1 titres : le pied de page (h4) et les états vides (h3) sautaient des niveaux sous le h1/h2 ;
//  A2 deux <nav> sans nom sur chaque page du tableau de bord ;
//  A3 erreurs de formulaire rendues par le serveur sans role="alert" (connexion, inscription, mot de passe, formulaire public, formation) ;
//  A4 bandeau de consentement fixe : l'élément focalisé au clavier restait DERRIÈRE lui (dont le lien « Cookies » du pied de page) ;
//  A5 lien d'évitement : masqué par la barre d'administration fixe (z-index) ;
//  A7 menu « Catégories » sans état annoncé ni fermeture au clavier (WCAG 1.4.13) ;
//  A6 compteur de la puce active du tableau de bord : 3,2:1 (opacité 0,7 sur fond d'accent).
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor, Client, createCourse } = require("./helpers");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : parcours navigateur non exécuté sur cette machine" : false;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// Niveaux de titres dans l'ordre du document (le HTML est celui rendu par le serveur)
const niveaux = (html) => [...html.replace(/<script[\s\S]*?<\/script>/g, "").matchAll(/<h([1-6])[\s>]/g)].map((m) => Number(m[1]));
const sauts = (n) => n.map((l, i) => (i > 0 && l > n[i - 1] + 1 ? `h${n[i - 1]}→h${l}` : null)).filter(Boolean);

describe("accessibilité : structure, formulaires, focus et contrastes (serveur + Chrome)", () => {
  let srv, boss, browser, ctx, page;
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    if (!SKIP) {
      browser = await chromium.launch({ executablePath: CHROME, headless: true });
      ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
      await ctx.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
      page = await ctx.newPage();
    }
  });
  after(async () => { if (browser) await browser.close(); if (srv) await srv.stop(); });

  test("A1 titres : aucune page publique ni état vide ne saute de niveau (pied de page en h2)", async () => {
    const anon = new Client(srv.base);
    for (const u of ["/", "/catalogue", "/catalogue?q=zzzzzz", "/blog", "/faq", "/contact", "/a-propos"]) {
      const r = await anon.get(u); if (r.status !== 200) continue;
      assert.deepEqual(sauts(niveaux(r.text)), [], `${u} : niveaux ${niveaux(r.text).join(",")}`);
      assert.doesNotMatch(r.text.slice(r.text.indexOf("<footer")), /<h4[\s>]/, `${u} : plus de h4 dans le pied de page`);
    }
    const pf = await boss.get("/formateur/formations");
    assert.deepEqual(sauts(niveaux(pf.text)), [], `/formateur/formations : niveaux ${niveaux(pf.text).join(",")}`);
  });

  test("A2 repères : chaque <nav> du tableau de bord porte un nom", async () => {
    for (const u of ["/formateur", "/formateur/formations", "/formateur/gestion"]) {
      const r = await boss.get(u);
      const navs = [...r.text.matchAll(/<nav\b[^>]*>/g)].map((m) => m[0]);
      assert.ok(navs.length >= 1, u);
      if (navs.length > 1) for (const n of navs) assert.match(n, /aria-label="[^"]+"/, `${u} : ${n.slice(0, 80)}`);
    }
  });

  test("A3 erreurs de formulaire rendues par le serveur : annoncées (role=alert)", async () => {
    const c = new Client(srv.base);
    for (const [u, body] of [["/connexion", { email: "nobody@example.com", password: "mauvais-mot-de-passe" }], ["/inscription", {}], ["/mot-de-passe-oublie", { email: "" }]]) {
      const r = await c.post(u, body);
      const html = r.text || "";
      if (!/form-error/.test(html)) continue; // redirection ou page sans erreur : rien à contrôler
      for (const m of html.matchAll(/<p class="form-error"([^>]*)>/g)) assert.match(m[1], /role="(alert|status)"/, `${u} : message d'erreur sans rôle`);
    }
    const files = ["login", "register", "forgot-password", "reset-password", "marketing-public/form", "instructor/course-form"];
    for (const f of files) assert.doesNotMatch(fs.readFileSync(require("node:path").join(__dirname, "..", "views", f + ".ejs"), "utf8"), /<p class="form-error"><%/, `${f}.ejs : message d'erreur sans role`);
  });

  test("A4 bandeau de consentement : tout élément focalisé au clavier reste visible au-dessus de lui (au moins 24 px ou entier ; pied de page compris)", { skip: SKIP }, async () => {
    const anon = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
    const p = await anon.newPage();
    for (const u of ["/", "/contact"]) {
      await p.goto(srv.base + u, { waitUntil: "load" }); await wait(600);
      assert.equal(await p.evaluate(() => { const b = document.getElementById("kw-consent"); return Boolean(b && !b.hidden); }), true, `${u} : bandeau affiché`);
      const masques = [];
      for (let i = 0; i < 90; i++) {
        await p.keyboard.press("Tab"); await wait(60);
        const r = await p.evaluate(() => { const e = document.activeElement; if (!e || e === document.body) return { fin: true }; const rc = e.getBoundingClientRect(); if (!rc.width) return {}; const br = document.getElementById("kw-consent").getBoundingClientRect(); const chevauche = rc.right > br.left && rc.left < br.right && rc.bottom > br.top; /* le bandeau n'occupe que sa colonne */ const visible = Math.min(rc.bottom, br.top) - Math.max(rc.top, 0); /* hauteur réellement visible au-dessus du bandeau */ return { masque: chevauche && visible < Math.min(rc.height, 24), nom: (e.textContent || e.id || e.tagName).trim().slice(0, 30), inBanner: Boolean(e.closest("#kw-consent")) }; });
        if (r.fin) break; if (r.masque && !r.inBanner) masques.push(r.nom);
      }
      assert.deepEqual(masques, [], `${u} : éléments cachés par le bandeau`);
    }
    await anon.close();
  });

  test("A5 lien d'évitement : visible au premier Tab, au-dessus de la barre d'administration fixe", { skip: SKIP }, async () => {
    await page.goto(`${srv.base}/marketing/pages`, { waitUntil: "load" }); await wait(500);
    await page.keyboard.press("Tab"); await wait(450);
    const r = await page.evaluate(() => { const e = document.activeElement; const rc = e.getBoundingClientRect(); const t = document.elementFromPoint(rc.left + rc.width / 2, rc.top + rc.height / 2); return { cls: e.className, devant: t === e || e.contains(t) }; });
    assert.match(r.cls, /skip-link/, "le premier arrêt est le lien d'évitement");
    assert.equal(r.devant, true, "le lien d'évitement n'est pas recouvert");
  });

  test("A6 contraste : le compteur de la puce active (blanc sur accent) atteint 4,5:1", { skip: SKIP }, async () => {
    await page.goto(`${srv.base}/formateur/formations`, { waitUntil: "load" }); await wait(500);
    const ratio = await page.evaluate(() => {
      const e = document.querySelector('.dash-chip[aria-current="page"] .dash-chip-count'); if (!e) return null;
      const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
      const num = (s) => s.match(/[\d.]+/g).slice(0, 4).map(Number);
      const bg = num(getComputedStyle(e.parentElement).backgroundColor), cs = getComputedStyle(e), a = +cs.opacity; const fg = num(cs.color).slice(0, 3).map((v, i) => v * a + bg[i] * (1 - a));
      const [x, y] = [lum(fg), lum(bg)]; return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
    });
    assert.ok(ratio === null || ratio >= 4.5, `contraste ${ratio}`);
  });

  test("A7 menu « Catégories » : aria-expanded suit l'état, Échap le referme (focus sur le bouton), il se rouvre après être sorti", { skip: SKIP }, async () => {
    await createCourse(boss, srv, { title: "Formation menu catégories" });
    const p = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" }).then((c) => c.newPage());
    await p.goto(srv.base + "/", { waitUntil: "load" }); await wait(500);
    const etat = () => p.evaluate(() => { const t = document.querySelector(".nav-dropdown-toggle"); const m = document.querySelector(".nav-dropdown-menu"); return t ? { exp: t.getAttribute("aria-expanded"), visible: getComputedStyle(m).display !== "none" } : null; });
    const e0 = await etat(); assert.ok(e0, "le menu Catégories existe");
    assert.deepEqual(e0, { exp: "false", visible: false });
    await p.focus(".nav-dropdown-toggle"); await wait(150);
    assert.deepEqual(await etat(), { exp: "true", visible: true }, "ouvert au focus");
    await p.keyboard.press("Escape"); await wait(150);
    assert.deepEqual(await etat(), { exp: "false", visible: false }, "Échap referme");
    assert.equal(await p.evaluate(() => document.activeElement.className), "nav-dropdown-toggle", "le focus reste sur le bouton");
    await p.evaluate(() => document.activeElement.blur()); await wait(150);
    await p.focus(".nav-dropdown-toggle"); await wait(150);
    assert.deepEqual(await etat(), { exp: "true", visible: true }, "se rouvre après être sorti");
  });
});
