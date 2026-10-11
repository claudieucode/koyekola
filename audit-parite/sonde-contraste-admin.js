// Sonde d'audit palier 23 — contraste WCAG mesuré (texte visible) sur des écrans du CMS, pour chacun des 4 thèmes de menu. Serveur de test jetable.
const { chromium } = require("playwright-core");
const { TEST_KEY } = require("../tests/marketing-helpers");
const { startServer, loginInstructor } = require("../tests/helpers");
const exe = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
(async () => {
  const srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
  const boss = await loginInstructor(srv); const M = "/marketing";
  await boss.post(`${M}/pages`, { name: "Page Audit", template: "vente" });
  const fd = new FormData(); Object.entries({ title: "Article Audit", excerpt: "r", content_format: "html", status: "published", content: "<p>Texte</p>", category: "Cat" }).forEach(([k, v]) => fd.append(k, v));
  await boss.request("/formateur/blog/nouveau", { method: "POST", multipart: fd, headers: { "x-blog-editor": "1" } });
  const browser = await chromium.launch({ executablePath: exe, headless: true });
  const scan = () => {
    const parse = (c) => { const m = c.match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?/); return m ? [+m[1], +m[2], +m[3], m[4] === undefined ? 1 : +m[4]] : [0, 0, 0, 0]; };
    const lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
    const bgOf = (el) => { const layers = []; for (let e = el; e; e = e.parentElement) { const c = parse(getComputedStyle(e).backgroundColor); if (c[3] > 0) { layers.push(c); if (c[3] === 1) break; } } let base = [255, 255, 255]; for (const c of layers.reverse()) base = base.map((v, i) => c[i] * c[3] + v * (1 - c[3])); return base; };
    const rows = []; const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n = w.nextNode(); n; n = w.nextNode()) { const t = n.textContent.trim(); if (!t || /^(script|style)$/i.test(n.parentElement.tagName)) continue; const el = n.parentElement; const s = getComputedStyle(el); const r = el.getBoundingClientRect(); if (!r.width || !r.height || s.visibility === "hidden" || s.display === "none" || +s.opacity === 0) continue; const fg = parse(s.color), bg = bgOf(el); const f2 = fg.slice(0, 3).map((v, i) => v * fg[3] + bg[i] * (1 - fg[3])); const L1 = lum(f2), L2 = lum(bg); const ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05); const big = parseFloat(s.fontSize) >= 24 || (parseFloat(s.fontSize) >= 18.66 && +s.fontWeight >= 700); if (ratio < (big ? 3 : 4.5)) rows.push({ t: t.slice(0, 32), ratio: Math.round(ratio * 100) / 100, c: s.color, bg: `rgb(${bg.map(Math.round)})`, cls: (el.className || "").toString().slice(0, 40) }); }
    return { n: document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT) && rows.length, rows };
  };
  const screens = [["Pages", `${M}/pages`], ["Articles", `${M}/site-web/articles`], ["Médiathèque", `${M}/site-web/mediatheque`], ["Commentaires", `${M}/site-web/commentaires`], ["Navigation", `${M}/site-web/navigation`], ["Utilisateurs", `${M}/site-web/utilisateurs`], ["Paramètres", `${M}/site-web/parametres`], ["Apparence", `${M}/site-web/apparence`]];
  for (const theme of ["clair", "nuit", "gris", "noir"]) {
    await boss.post(`${M}/apparence`, { theme });
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } }); await ctx.addCookies([...boss.cookies].map(([n, v]) => ({ name: n, value: v, url: srv.base })));
    let total = 0; const seen = new Map();
    for (const [label, url] of screens) { const p = await ctx.newPage(); await p.goto(srv.base + url, { waitUntil: "load" }); await p.waitForTimeout(500); const r = await p.evaluate(scan); total += r.rows.length; for (const x of r.rows) { const k = `${x.cls}|${x.c}|${x.bg}`; if (!seen.has(k)) seen.set(k, { ...x, on: [label] }); else if (!seen.get(k).on.includes(label)) seen.get(k).on.push(label); } await p.close(); }
    console.log(`\n== thème de menu « ${theme} » : ${total} textes sous le seuil WCAG AA, ${seen.size} combinaisons distinctes`);
    for (const x of [...seen.values()].sort((a, b) => a.ratio - b.ratio).slice(0, 8)) console.log("  ", x.ratio, JSON.stringify(x.t), x.c, "sur", x.bg, "·", x.cls, "·", x.on.join("/"));
    await ctx.close();
  }
  await browser.close(); await srv.stop();
})().catch((e) => { console.error("ERR", e); process.exit(1); });
