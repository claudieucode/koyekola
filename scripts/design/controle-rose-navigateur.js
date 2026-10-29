// Titan XXXV : contrôle RÉEL dans Chrome. Pour chaque page et chaque thème (clair, sombre), parcourt tous les éléments visibles,
// lit les couleurs calculées (fond, bordure, texte, ombre, dégradé, SVG) et signale toute teinte rose/magenta.
// Voit donc aussi les styles inline, les valeurs dynamiques et les règles qui s'écrasent. Usage : node scripts/design/controle-rose-navigateur.js [--captures dossier]
"use strict";
const fs = require("node:fs");
const path = require("node:path");
const { startServer, loginInstructor, createCourse } = require("../../tests/helpers.js");
const { chromium } = require("playwright-core");
const arg = (k, d) => { const i = process.argv.indexOf("--" + k); return i > 0 ? process.argv[i + 1] : d; };
const SHOTS = arg("captures", "");
const CHROME = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PAGES = ["/marketing", "/marketing/contacts", "/marketing/campagnes", "/marketing/listes", "/marketing/segments", "/marketing/formulaires", "/marketing/pages",
  "/marketing/tunnels", "/marketing/automatisations", "/marketing/analytics", "/formateur", "/formateur/formations", "/formateur/blog", "/formateur/gestion",
  "/formateur/gestion/ventes", "/formateur/gestion/eleves", "/formateur/messages", "/formateur/seo", "/connexion", "/", "/catalogue", "/blog"];

function inBrowser() {
  const pinkish = (r, g, b) => {
    r /= 255; g /= 255; b /= 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2; if (mx === mn) return false;
    const d = mx - mn, s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
    const h = (mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4) * 60;
    return h >= 295 && h <= 350 && s >= 0.18 && l >= 0.25 && l <= 0.97;
  };
  const colors = (v) => [...String(v).matchAll(/rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)(?:[,\s/]+([\d.]+))?/g)].filter((m) => m[4] === undefined || Number(m[4]) > 0.02).map((m) => [+m[1], +m[2], +m[3]]);
  const found = new Map();
  for (const el of document.querySelectorAll("body *")) {
    const cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden") continue;
    const r = el.getBoundingClientRect(); if (!r.width || !r.height) continue;
    const props = { fond: cs.backgroundColor, "fond-image": cs.backgroundImage, bordure: cs.borderTopColor + " " + cs.borderLeftColor, texte: cs.color, ombre: cs.boxShadow, contour: cs.outlineColor, remplissage: cs.fill, trait: cs.stroke };
    for (const [k, v] of Object.entries(props)) {
      if (!v || v === "none") continue;
      if (k === "bordure" && cs.borderTopWidth === "0px" && cs.borderLeftWidth === "0px") continue;
      if (colors(v).some(([R, G, B]) => pinkish(R, G, B))) {
        const id = el.tagName.toLowerCase() + (el.className && typeof el.className === "string" ? "." + el.className.trim().split(/\s+/).slice(0, 3).join(".") : "");
        const key = id + "|" + k; if (!found.has(key)) found.set(key, { el: id, prop: k, val: v.slice(0, 80) });
      }
    }
  }
  return [...found.values()];
}

(async () => {
  const srv = await startServer({ ENCRYPTION_KEY: "0".repeat(64), SMTP_HOST: "" });
  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  let total = 0;
  try {
    const boss = await loginInstructor(srv);
    await createCourse(boss, srv, { title: "Formation contrôle" });
    if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });
    for (const theme of ["light", "dark"]) {
      const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, colorScheme: theme });
      await ctx.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
      await ctx.addInitScript((t) => { try { localStorage.setItem("kola-theme", t); } catch {} }, theme);
      const page = await ctx.newPage();
      for (const url of PAGES) {
        const res = await page.goto(srv.base + url, { waitUntil: "load", timeout: 60000 }).catch((e) => ({ status: () => "ERR " + e.message }));
        if (theme === "dark") await page.evaluate(() => document.documentElement.setAttribute("data-kola-theme", "dark"));
        await page.waitForTimeout(450);
        const hits = await page.evaluate(inBrowser);
        total += hits.length;
        console.log(`${theme.padEnd(5)} ${String(res.status()).padEnd(4)} ${url.padEnd(32)} ${hits.length ? "ROSE ×" + hits.length : "ok"}`);
        for (const h of hits) console.log(`        ${h.el} [${h.prop}] ${h.val}`);
        if (SHOTS && ["/marketing", "/marketing/tunnels", "/formateur"].includes(url)) await page.screenshot({ path: path.join(SHOTS, `${theme}${url.replace(/\//g, "_")}.png`) });
      }
      await ctx.close();
    }
  } finally { await browser.close(); await srv.stop(); }
  console.log(`\nTotal : ${total} élément(s) rosé(s) dans les couleurs calculées`);
  process.exit(total ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
