// Programme 22.1 — Laboratoire : audit d'un site généré dans un VRAI Chrome (4 formats). Aucun outil tiers (axe-core / Lighthouse non installés) : contrôles automatiques partiels, qui ne valent
// pas conformité WCAG. Chaque mesure est brute ; l'interprétation se fait dans score.js et dans les rapports.
const fs = require("node:fs");
const path = require("node:path");

const VIEWPORTS = { desktop: [1440, 900], laptop: [1024, 768], tablette: [768, 1024], mobile: [375, 812] };

// ---- exécuté DANS la page ----
function inPage() {
  const vis = (e) => { const r = e.getBoundingClientRect(); const c = getComputedStyle(e); return r.width > 0 && r.height > 0 && c.visibility !== "hidden" && c.display !== "none" && !e.closest("[hidden],[aria-hidden='true']"); };
  const sel = (e) => e.tagName.toLowerCase() + (typeof e.className === "string" && e.className.trim() ? "." + e.className.trim().split(/\s+/).slice(0, 2).join(".") : "");
  const doc = document.documentElement; const W = doc.clientWidth;
  const out = { w: W, hscroll: doc.scrollWidth > W + 1, wide: [], small: [], clipped: [], tinyText: [], brokenImages: [], placeholders: [], lorem: 0 };
  for (const e of document.querySelectorAll("body *")) {
    if (!vis(e)) continue; const r = e.getBoundingClientRect();
    if (r.right > W + 1 && !e.closest("[data-scroll],.sh-table-wrap,pre,table")) out.wide.push(sel(e));
    const c = getComputedStyle(e);
    if ((c.overflow === "hidden" || c.textOverflow === "ellipsis") && e.scrollWidth > e.clientWidth + 2 && e.clientWidth > 0 && e.children.length === 0 && (e.textContent || "").trim()) out.clipped.push(sel(e));
  }
  for (const e of document.querySelectorAll("main a, main button, main input:not([type=hidden]), main select, main textarea, header a, header button, footer a")) {
    if (!vis(e)) continue; const r = e.getBoundingClientRect(); if (e.tagName === "A" && getComputedStyle(e).display === "inline" && (e.textContent || "").length > 40) continue;
    if (r.height < 32 || r.width < 32) out.small.push(`${sel(e)}:${Math.round(r.width)}x${Math.round(r.height)}`);
  }
  for (const e of document.querySelectorAll("p, li, a, span, label, td, h1, h2, h3, h4, button")) { if (!vis(e) || !(e.childNodes.length && [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()))) continue; const fs = parseFloat(getComputedStyle(e).fontSize); if (fs < 12) out.tinyText.push(`${sel(e)}:${fs}`); }
  for (const i of document.querySelectorAll("img")) if (vis(i) && (!i.complete || i.naturalWidth === 0)) out.brokenImages.push((i.getAttribute("src") || "").slice(0, 80));
  const text = (document.querySelector("main") || document.body).innerText || "";
  out.placeholders = (text.match(/\[[^\]\n]{2,60}\]/g) || []).slice(0, 40);
  out.lorem = (text.match(/lorem ipsum/gi) || []).length;
  return out;
}
function staticChecks() {
  const vis = (e) => { const r = e.getBoundingClientRect(); const c = getComputedStyle(e); return r.width > 0 && r.height > 0 && c.visibility !== "hidden" && c.display !== "none"; };
  const txt = (e) => (e.textContent || "").replace(/\s+/g, " ").trim();
  const meta = (n) => { const m = document.querySelector(`meta[name="${n}"]`); return m ? m.content : ""; };
  const heads = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")].filter(vis).map((h) => Number(h.tagName[1]));
  let skips = 0; for (let i = 1; i < heads.length; i += 1) if (heads[i] - heads[i - 1] > 1) skips += 1;
  const imgs = [...document.querySelectorAll("img")].filter(vis);
  const rgba = (s) => { const m = String(s).match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[ ,\/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
  const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
  const bgOf = (e) => { let base = { r: 255, g: 255, b: 255 }; const stack = []; for (let n = e; n; n = n.parentElement) { const cs = getComputedStyle(n); if (cs.backgroundImage && cs.backgroundImage !== "none") return null; const c = rgba(cs.backgroundColor); if (c && c.a > 0) { stack.push(c); if (c.a >= 1) break; } } for (const c of stack.reverse()) base = { r: c.r * c.a + base.r * (1 - c.a), g: c.g * c.a + base.g * (1 - c.a), b: c.b * c.a + base.b * (1 - c.a) }; return base; };
  const contrast = { checked: 0, fail: [], unknown: 0 };
  for (const e of document.querySelectorAll("main *, header *, footer *")) {
    if (![...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) || !vis(e)) continue;
    const cs = getComputedStyle(e); const fg = rgba(cs.color); const bg = bgOf(e); if (!fg) continue; if (!bg) { contrast.unknown += 1; continue; }
    const fa = fg.a ?? 1; const f = { r: fg.r * fa + bg.r * (1 - fa), g: fg.g * fa + bg.g * (1 - fa), b: fg.b * fa + bg.b * (1 - fa) };
    const L1 = lum(f), L2 = lum(bg); const ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
    const size = parseFloat(cs.fontSize); const bold = Number(cs.fontWeight) >= 700; const large = size >= 24 || (size >= 18.66 && bold);
    contrast.checked += 1; if (ratio < (large ? 3 : 4.5)) contrast.fail.push(`${e.tagName.toLowerCase()}:${ratio.toFixed(2)}:${txt(e).slice(0, 30)}`);
  }
  const fields = [...document.querySelectorAll("input:not([type=hidden]):not([type=submit]):not([type=button]), select, textarea")].filter(vis);
  const unlabeled = fields.filter((f) => !(f.labels && f.labels.length) && !f.getAttribute("aria-label") && !f.getAttribute("aria-labelledby")).length;
  const emptyButtons = [...document.querySelectorAll("a, button")].filter(vis).filter((b) => !txt(b) && !b.getAttribute("aria-label") && !b.querySelector("img[alt]:not([alt=''])")).length;
  const links = [...new Set([...document.querySelectorAll("a[href]")].map((a) => a.getAttribute("href")).filter((h) => h && !/^(#|mailto:|tel:|javascript:)/i.test(h)))];
  return {
    title: document.title, metaDescription: meta("description"), canonical: (document.querySelector("link[rel=canonical]") || {}).href || "", lang: document.documentElement.lang, robots: meta("robots"),
    og: ["og:title", "og:description", "og:image"].filter((p) => document.querySelector(`meta[property="${p}"]`)), jsonLd: document.querySelectorAll('script[type="application/ld+json"]').length,
    h1: document.querySelectorAll("h1").length, headingSkips: skips, headingCount: heads.length, imgs: imgs.length, imgsNoAlt: imgs.filter((i) => !i.hasAttribute("alt")).length, imgsEmptyAlt: imgs.filter((i) => i.getAttribute("alt") === "").length,
    landmarks: { main: document.querySelectorAll("main").length, nav: document.querySelectorAll("nav").length, header: document.querySelectorAll("header").length, footer: document.querySelectorAll("footer").length },
    fields: fields.length, unlabeled, emptyButtons, contrast, links, skipLink: Boolean(document.querySelector("a[href^='#']:not([href='#'])")),
    h1Text: txt(document.querySelector("h1") || document.body).slice(0, 80),
    headerLinks: [...document.querySelectorAll("header a, nav a")].filter(vis).length, footerLinks: [...document.querySelectorAll("footer a")].filter(vis).length,
    buttonLike: [...document.querySelectorAll("main a, main button")].filter(vis).filter((e) => { const c = rgba(getComputedStyle(e).backgroundColor); const t = txt(e); return c && c.a > 0.5 && t.length > 0 && t.length < 50; }).length,
    mainKinds: (() => { const m = document.querySelector("main"); if (!m) return []; const root = m.children.length === 1 ? m.children[0] : m; return [...root.children].filter(vis).map((c) => `${c.tagName.toLowerCase()}.${typeof c.className === "string" ? c.className.split(/\s+/)[0] : ""}`); })(),
    imgsInMain: [...document.querySelectorAll("main img")].filter(vis).length,
    textBlocks: [...document.querySelectorAll("main h1, main h2, main h3, main p, main li")].filter(vis).map(txt).filter((t) => t.length > 12).slice(0, 120),
    wordCount: txt(document.querySelector("main") || document.body).split(/\s+/).length,
  };
}

async function auditSite(browser, { base, gen, sc, out }) {
  const result = { host: base, pages: [], site: {}, errors: [] };
  const capDir = path.join(out, "captures"); fs.mkdirSync(capDir, { recursive: true });
  const pageList = (gen.pages || []).filter((p) => p.status === "published").map((p) => ({ name: p.name, path: p.id === gen.homeId ? "/" : `/${p.slug}` }));
  if (gen.shop) pageList.push({ name: "Boutique (catalogue)", path: "/boutique" }, { name: "Boutique (panier)", path: "/boutique/panier" });
  result.unpublished = (gen.pages || []).filter((p) => p.status !== "published").map((p) => p.name);
  // Requêtes faites DEPUIS une page chargée (le navigateur applique la résolution du nom de domaine de test ; l'API de requêtes de Playwright ne le fait pas)
  const ctx0 = await browser.newContext({ viewport: { width: 1440, height: 900 } }); const p0 = await ctx0.newPage(); await p0.goto(base + "/", { waitUntil: "load" });
  const statusOf = (u) => p0.evaluate(async (x) => { try { const r = await fetch(x, { redirect: "follow" }); return r.status; } catch (e) { return `erreur ${e.message}`.slice(0, 40); } }, u);
  for (const f of ["/sitemap.xml", "/robots.txt"]) result.site[f] = await statusOf(f);
  for (const [vp, [w, h]] of Object.entries(VIEWPORTS)) {
    const context = await browser.newContext({ viewport: { width: w, height: h } }); context.setDefaultTimeout(15000);
    for (const pg of pageList) {
      const page = await context.newPage(); const rec = { vp, name: pg.name, path: pg.path, console: [], failed: [], requests: 0 };
      page.on("console", (m) => { if (m.type() === "error") rec.console.push(m.text().slice(0, 140)); });
      page.on("pageerror", (e) => rec.console.push(`pageerror: ${e.message.slice(0, 140)}`));
      page.on("requestfailed", (r) => rec.failed.push(`${r.url().slice(0, 100)} ${r.failure() ? r.failure().errorText : ""}`));
      page.on("response", (r) => { rec.requests += 1; if (r.status() >= 400) rec.failed.push(`${r.status()} ${r.url().slice(0, 100)}`); });
      try {
        const t0 = Date.now(); const resp = await page.goto(base + pg.path, { waitUntil: "load" }); rec.status = resp ? resp.status() : 0; rec.loadMs = Date.now() - t0;
        await page.waitForTimeout(300);
        rec.metrics = await page.evaluate(inPage);
        rec.perf = await page.evaluate(() => { const n = performance.getEntriesByType("navigation")[0] || {}; const res = performance.getEntriesByType("resource"); const paint = performance.getEntriesByName("first-contentful-paint")[0];
          return { dcl: Math.round(n.domContentLoadedEventEnd || 0), load: Math.round(n.loadEventEnd || 0), fcp: paint ? Math.round(paint.startTime) : null, transferKB: Math.round(((n.transferSize || 0) + res.reduce((a, r) => a + (r.transferSize || 0), 0)) / 1024), decodedKB: Math.round(((n.decodedBodySize || 0) + res.reduce((a, r) => a + (r.decodedBodySize || 0), 0)) / 1024), resources: res.length, heapMB: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 104857.6) / 10 : null }; });
        if (vp === "desktop") rec.static = await page.evaluate(staticChecks);
        if ((vp === "desktop" || vp === "mobile") && pg.path === "/") {
          // Le bandeau de mesure d'audience (consentement) est un comportement normal du site ; on le refuse pour que la capture montre la page
          await page.locator("button", { hasText: "Refuser" }).first().click({ timeout: 1500 }).catch(() => {}); await page.waitForTimeout(200); await page.screenshot({ path: path.join(capDir, `${sc.id}-${vp}.jpg`), fullPage: true, type: "jpeg", quality: 55 }); rec.capture = `captures/${sc.id}-${vp}.jpg`; }
      } catch (e) { rec.error = e.message.slice(0, 160); }
      result.pages.push(rec); await page.close();
    }
    await context.close();
  }
  // Liens internes : chaque adresse relative trouvée sur les pages doit répondre
  const links = new Set();
  for (const p of result.pages) if (p.static) for (const l of p.static.links) if (l.startsWith("/") && !l.startsWith("//")) links.add(l.split("#")[0] || "/");
  result.links = { total: links.size, broken: [] };
  for (const l of links) { const st = await statusOf(l); if (typeof st !== "number" || st >= 400) result.links.broken.push(`${st} ${l}`); }
  await ctx0.close();
  return result;
}

module.exports = { auditSite, VIEWPORTS };
