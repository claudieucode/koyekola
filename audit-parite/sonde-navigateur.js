// Sonde d'audit palier 23 — Chrome réel (Playwright) sur les écrans du CMS : erreurs, débordements, accessibilité de base, poids. Serveur de test jetable.
const { chromium } = require("playwright-core");
const { TEST_KEY } = require("../tests/marketing-helpers");
const { startServer, loginInstructor, Client } = require("../tests/helpers");
const fs = require("fs");
const exe = ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"].find((p) => fs.existsSync(p));
(async () => {
  const srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
  const boss = await loginInstructor(srv); const db = srv.db(); const M = "/marketing";
  await boss.post(`${M}/pages`, { name: "Page Audit", template: "vente" });
  const fd = new FormData(); Object.entries({ title: "Article Audit", excerpt: "r", content_format: "html", status: "published", content: "<p>Texte</p>", category: "Cat", tags: "t" }).forEach(([k, v]) => fd.append(k, v));
  await boss.request("/formateur/blog/nouveau", { method: "POST", multipart: fd, headers: { "x-blog-editor": "1" } });
  await boss.post(`${M}/site-web/navigation/menus`, { name: "Menu A" });
  const screens = [
    ["Tableau CMS", `${M}/site-web`], ["Pages", `${M}/pages`], ["Page détail", `${M}/pages/1`], ["Articles", `${M}/site-web/articles`], ["Catégories", `${M}/site-web/articles/categories`], ["Étiquettes", `${M}/site-web/articles/etiquettes`],
    ["Médias", `${M}/medias`], ["Commentaires", `${M}/site-web/commentaires`], ["Navigation", `${M}/site-web/navigation`], ["Menu", `${M}/site-web/navigation/menus/1`], ["Apparence", `${M}/site-web/apparence`],
    ["Utilisateurs", `${M}/site-web/utilisateurs`], ["Rôles", `${M}/site-web/utilisateurs/roles`], ["Historique page", `${M}/site-web/historique/page/1`], ["Corbeille", `${M}/site-web/corbeille`],
    ["Redirections", `${M}/site-web/redirections`], ["Permaliens", `${M}/site-web/permaliens`], ["Outils", `${M}/site-web/outils`], ["Paramètres", `${M}/site-web/parametres`], ["SEO", "/formateur/seo"],
    ["Tests A/B", `${M}/site-web/tests-ab`], ["Analytics global", `${M}/analytics/global`], ["Éditeur d'article", "/formateur/blog/1/modifier"], ["Éditeur de page", `${M}/pages/1/editeur`],
  ];
  const browser = await chromium.launch({ executablePath: exe, headless: true });
  const out = [];
  for (const [vw, size] of [["bureau", { width: 1280, height: 800 }], ["mobile", { width: 375, height: 800 }]]) {
    const ctx = await browser.newContext({ viewport: size }); const [name, value] = [...boss.cookies][0];
    await ctx.addCookies([...boss.cookies].map(([n, v]) => ({ name: n, value: v, url: srv.base })));
    for (const [label, url] of screens) {
      const page = await ctx.newPage(); const errs = [], fails = []; let bytes = 0;
      page.on("console", (m) => { if (m.type() === "error") errs.push(m.text().slice(0, 120)); });
      page.on("pageerror", (e) => errs.push("PAGEERROR " + String(e.message).slice(0, 120)));
      page.on("requestfailed", (r) => fails.push(r.url().slice(-60)));
      page.on("response", async (r) => { try { const b = await r.body(); bytes += b.length; } catch {} });
      const t = Date.now(); let status = 0;
      try { const r = await page.goto(srv.base + url, { waitUntil: "load", timeout: 45000 }); status = r.status(); await page.waitForTimeout(600); } catch (e) { errs.push("NAV " + String(e.message).slice(0, 80)); }
      const m = await page.evaluate(() => {
        const vis = (e) => { const r = e.getBoundingClientRect(); const s = getComputedStyle(e); return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && s.display !== "none"; };
        const name = (e) => (e.getAttribute("aria-label") || e.getAttribute("aria-labelledby") || e.title || (e.id && document.querySelector(`label[for="${CSS.escape(e.id)}"]`)) || e.closest("label") || e.placeholder || e.textContent || "").toString().trim();
        const inputs = [...document.querySelectorAll("input:not([type=hidden]):not([type=submit]):not([type=button]), select, textarea")].filter(vis);
        const buttons = [...document.querySelectorAll("button, [role=button], a[href]")].filter(vis);
        const small = [...document.querySelectorAll("button, a[href], input[type=checkbox], input[type=radio], select")].filter(vis).filter((e) => { const r = e.getBoundingClientRect(); return r.width < 24 || r.height < 24; });
        return { title: document.title, h1: document.querySelectorAll("h1").length, overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth, noLabel: inputs.filter((e) => !name(e)).length, inputs: inputs.length, noName: buttons.filter((e) => !name(e) && !e.querySelector("img[alt]")).length, imgNoAlt: [...document.images].filter((i) => !i.hasAttribute("alt")).length, small: small.length, lang: document.documentElement.lang, main: Boolean(document.querySelector("main, [role=main]")), skip: Boolean(document.querySelector('a[href^="#"][class*=skip], .skip-link')) };
      });
      out.push({ vw, label, url, status, ms: Date.now() - t, kb: Math.round(bytes / 1024), errs: errs.length, errTxt: errs.slice(0, 2).join(" || "), fails: fails.length, ...m });
      await page.close();
    }
    await ctx.close();
  }
  await browser.close(); fs.writeFileSync(process.env.TMPDIR + "/navigateur.json", JSON.stringify(out, null, 1));
  for (const r of out) console.log(r.vw.padEnd(7), r.label.padEnd(18), String(r.status).padEnd(4), `${r.ms}ms ${r.kb}Ko`.padEnd(14), `err=${r.errs} fail=${r.fails} ovfX=${r.overflowX} nolabel=${r.noLabel}/${r.inputs} noname=${r.noName} noalt=${r.imgNoAlt} small=${r.small} h1=${r.h1} main=${r.main}`, r.errTxt ? "| " + r.errTxt : "");
  db.close(); await srv.stop();
})().catch((e) => { console.error("ERR", e); process.exit(1); });
