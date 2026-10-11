// Sonde d'audit palier 23 — lisibilité de la Médiathèque (sélecteur partagé) dans l'éditeur, thème clair puis sombre. Mesure le contraste WCAG réel de chaque texte visible. Serveur de test jetable.
const { chromium } = require("playwright-core");
const { TEST_KEY } = require("../tests/marketing-helpers");
const { startServer, loginInstructor } = require("../tests/helpers");
const fs = require("fs");
const exe = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mNk+M9Qz0AEYBxVSF+FAP5FDvcfRYWgAAAAAElFTkSuQmCC", "base64");
(async () => {
  const srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
  const boss = await loginInstructor(srv); const M = "/marketing";
  await boss.post(`${M}/pages`, { name: "Page Audit", template: "vente" });
  const fd = new FormData(); fd.append("file", new Blob([PNG], { type: "image/png" }), "image-audit.png");
  console.log("upload", (await boss.request(`${M}/site-web/mediatheque/televerser`, { method: "POST", multipart: fd })).status);
  const browser = await chromium.launch({ executablePath: exe, headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  await ctx.addCookies([...boss.cookies].map(([n, v]) => ({ name: n, value: v, url: srv.base })));
  const scan = () => {
    const parse = (c) => { const m = c.match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?/); return m ? [+m[1], +m[2], +m[3], m[4] === undefined ? 1 : +m[4]] : [0, 0, 0, 0]; };
    const lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
    const bgOf = (el) => { let layers = []; for (let e = el; e; e = e.parentElement) { const c = parse(getComputedStyle(e).backgroundColor); if (c[3] > 0) { layers.push(c); if (c[3] === 1) break; } } let base = [255, 255, 255]; for (const c of layers.reverse()) base = base.map((v, i) => c[i] * c[3] + v * (1 - c[3])); return base; };
    const dlg = document.querySelector("dialog.kwmp"); if (!dlg) return { error: "dialogue absent" };
    const rows = []; const w = document.createTreeWalker(dlg, NodeFilter.SHOW_TEXT);
    for (let n = w.nextNode(); n; n = w.nextNode()) { const t = n.textContent.trim(); if (!t) continue; const el = n.parentElement; const s = getComputedStyle(el); const r = el.getBoundingClientRect(); if (!r.width || !r.height || s.visibility === "hidden" || s.display === "none") continue; const fg = parse(s.color), bg = bgOf(el); const a = fg[3]; const f2 = fg.slice(0, 3).map((v, i) => v * a + bg[i] * (1 - a)); const L1 = lum(f2), L2 = lum(bg); const ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05); rows.push({ text: t.slice(0, 40), color: s.color, bg: `rgb(${bg.map(Math.round)})`, ratio: Math.round(ratio * 100) / 100, size: s.fontSize }); }
    return { dialogBg: getComputedStyle(dlg).backgroundColor, rows };
  };
  for (const theme of ["clair", "sombre"]) {
    const page = await ctx.newPage(); const errs = []; page.on("pageerror", (e) => errs.push(e.message));
    await page.goto(`${srv.base}${M}/pages/1/editeur`, { waitUntil: "load" }); await page.waitForTimeout(1200);
    if (theme === "sombre") { await page.click("[data-pb-theme-toggle]"); await page.waitForTimeout(400); }
    await page.evaluate(() => window.KWMediaPicker && window.KWMediaPicker.open({ title: "Choisir une image", type: "image" })); await page.waitForTimeout(1500);
    const res = await page.evaluate(scan);
    const bad = (res.rows || []).filter((r) => r.ratio < 4.5);
    console.log(`\n== Page Builder, thème ${theme} : fond du dialogue ${res.dialogBg} ; ${(res.rows || []).length} textes mesurés, ${bad.length} sous 4,5:1 ${res.error || ""}`);
    for (const b of bad.slice(0, 12)) console.log("  ", b.ratio, b.size, JSON.stringify(b.text), b.color, "sur", b.bg);
    await page.screenshot({ path: process.env.TMPDIR + `/mediatheque-${theme}.png` }); console.log("  erreurs page:", errs.length);
    await page.close();
  }
  await browser.close(); await srv.stop();
})().catch((e) => { console.error("ERR", e); process.exit(1); });
