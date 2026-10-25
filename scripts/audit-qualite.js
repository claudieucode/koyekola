// Audit de qualité de l'administration dans un vrai Chrome, clair ET sombre : contrastes de texte, commandes sans nom accessible,
// visibilité du focus clavier, géométrie des boîtes de dialogue, animations qui déplacent la mise en page.
//   NODE_PATH=…/node_modules node scripts/audit-qualite.js [--out rapport.json] [--only fragment] [--themes light,dark] [--width 1440]
// N'écrit rien dans le dépôt : rapport JSON + résumé.
const fs = require("node:fs");
const { startServer, loginInstructor } = require("../tests/helpers");
const { TEST_KEY } = require("../tests/marketing-helpers");
const nav = require("../src/marketing/web/nav");
const cms = require("../src/marketing/web/cmsNav");
const { chromium } = require("playwright-core");
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const OUT = arg("--out", "/tmp/audit-qualite.json");
const ONLY = arg("--only", "");
const THEMES = arg("--themes", "light,dark").split(",");
const WIDTH = Number(arg("--width", "1440"));

function inPage() {
  const res = { contrast: [], unnamed: [], focus: [], dialogs: [], lightSurfaces: [], noTip: [] };
  const sel = (el) => { let s = el.tagName.toLowerCase(); if (el.id) s += "#" + el.id; const c = String(el.className && el.className.baseVal === undefined ? el.className : "").trim().split(/\s+/).filter(Boolean).slice(0, 2); if (c.length) s += "." + c.join("."); return s; };
  const parse = (c) => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
  const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
  const blend = (top, bottom) => ({ r: top.r * top.a + bottom.r * (1 - top.a), g: top.g * top.a + bottom.g * (1 - top.a), b: top.b * top.a + bottom.b * (1 - top.a), a: 1 });
  const bgOf = (el) => { const layers = []; for (let p = el; p; p = p.parentElement) { const cs = getComputedStyle(p); if (cs.backgroundImage !== "none") return null; const c = parse(cs.backgroundColor); if (c && c.a > 0) { layers.push(c); if (c.a >= 1) break; } } let base = { r: 255, g: 255, b: 255, a: 1 }; if (!layers.length || layers[layers.length - 1].a < 1) { const root = parse(getComputedStyle(document.documentElement).backgroundColor); if (root && root.a > 0) base = root; else base = parse(getComputedStyle(document.body).backgroundColor) || base; if (base.a < 1) base = { r: 255, g: 255, b: 255, a: 1 }; } return layers.reduceRight((acc, l) => blend(l, acc), base); };
  const visible = (el) => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && cs.display !== "none" && Number(cs.opacity) > 0.05 && !el.closest("[hidden],[inert],[aria-hidden='true'],dialog:not([open]),details:not([open]) > :not(summary)") && !el.closest(".sr-only"); };
  // 1) contrastes
  const seen = new Set();
  for (const el of document.querySelectorAll("body *")) {
    if (![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 1)) continue;
    if (!visible(el)) continue; if (el.closest("svg,script,style,option,code")) continue;
    const cs = getComputedStyle(el); const fg = parse(cs.color); const bg = bgOf(el); if (!fg || !bg) continue;
    const fgc = fg.a < 1 ? blend(fg, bg) : fg; const l1 = lum(fgc), l2 = lum(bg); const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    const px = parseFloat(cs.fontSize); const bold = Number(cs.fontWeight) >= 700; const large = px >= 24 || (px >= 18.66 && bold);
    const need = large ? 3 : 4.5; if (ratio >= need) continue;
    if (el.disabled || el.getAttribute("aria-disabled") === "true" || el.closest("[disabled],[aria-disabled='true']")) continue;
    const key = sel(el) + "|" + ratio.toFixed(1); if (seen.has(key)) continue; seen.add(key);
    res.contrast.push({ sel: sel(el), ratio: Math.round(ratio * 100) / 100, need, text: el.textContent.trim().slice(0, 36), px });
  }
  // 1 bis) en sombre : surfaces restées claires (fond écrit en dur) — cause des textes illisibles
  if (document.documentElement.getAttribute("data-kola-theme") === "dark") {
    const seenS = new Set();
    for (const el of document.querySelectorAll("body *")) {
      if (!visible(el) || el.closest("svg,iframe,canvas,img,picture,video,.kx-art,[class*=shot],[class*=preview],[class*=swatch],[class*=thumb]")) continue;
      const cs = getComputedStyle(el); const bg = parse(cs.backgroundColor); if (!bg || bg.a < 0.9) continue; if (cs.backgroundImage !== "none") continue;
      const r = el.getBoundingClientRect(); if (r.width * r.height < 900) continue;
      if (lum(bg) < 0.55) continue; const k = sel(el); if (seenS.has(k)) continue; seenS.add(k);
      res.lightSurfaces.push({ sel: k, bg: cs.backgroundColor, color: cs.color, text: (el.textContent || "").trim().slice(0, 24) });
    }
  }
  // 2) commandes sans nom accessible
  const named = (el) => { const t = (el.getAttribute("aria-label") || el.getAttribute("title") || el.getAttribute("data-tip") || "").trim(); if (t) return true; if (el.getAttribute("aria-labelledby")) return true; if ((el.textContent || "").trim()) return true; if (el.labels && el.labels.length) return true; if (el.querySelector("img[alt]:not([alt=''])")) return true; if (el.closest("label")) return true; if (el.type === "submit" && el.value) return true; if (el.placeholder && /^(INPUT|TEXTAREA)$/.test(el.tagName)) return true; return false; };
  for (const el of document.querySelectorAll("button, a[href], input:not([type=hidden]), select, textarea, [role=button], [role=tab], [role=switch]")) { if (!visible(el)) continue; if (!named(el)) res.unnamed.push({ sel: sel(el), outer: el.outerHTML.slice(0, 110) }); }
  // 3 bis) commandes réduites à une icône sans infobulle visible (data-tip / title) : l'aria-label seul n'aide pas à la souris
  for (const el of document.querySelectorAll("button, a[href], [role=button]")) { if (!visible(el)) continue; if ((el.textContent || "").trim()) continue; if (el.getAttribute("data-tip") || el.getAttribute("title")) continue; if (el.closest("[data-tip],[title]")) continue; res.noTip.push({ sel: sel(el), label: el.getAttribute("aria-label") || "" }); }
  // 4) boîtes de dialogue (présentes mais fermées) : on les ouvre une à une
  for (const d of document.querySelectorAll("dialog")) {
    try { if (d.open) continue; d.showModal(); } catch { continue; }
    const r = d.getBoundingClientRect(); const head = d.querySelector(".mk-dialog-head, header, h2"); const close = d.querySelector(".mk-dialog-close, [data-mk-modal-close]"); const acts = d.querySelector(".mk-dialog-actions, footer");
    const body = d.querySelector(".mk-dialog-body, form");
    res.dialogs.push({ sel: sel(d), w: Math.round(r.width), h: Math.round(r.height), vw: innerWidth, vh: innerHeight, offscreen: r.left < -1 || r.right > innerWidth + 1 || r.top < -1 || r.bottom > innerHeight + 1, tooTall: r.height > innerHeight * 0.92, hOverflow: d.scrollWidth > d.clientWidth + 1, hasClose: !!close, title: !!(head && head.textContent.trim()), actions: !!acts, autofocusInside: d.contains(document.activeElement), focusTag: document.activeElement && document.activeElement.tagName });
    d.close();
  }
  return res;
}

// visibilité du focus : on tabule et on compare l'état avant/après de l'élément actif
async function focusAudit(page) {
  const bad = [];
  await page.evaluate(() => { document.activeElement && document.activeElement.blur && document.activeElement.blur(); window.scrollTo(0, 0); });
  for (let i = 0; i < 22; i += 1) {
    const before = await page.evaluate(() => window.__fa = null);
    await page.keyboard.press("Tab");
    await page.waitForTimeout(220); // laisse finir les transitions d'anneau (0,15 s)
    const r = await page.evaluate(() => {
      const e = document.activeElement; if (!e || e === document.body) return null;
      const cs = getComputedStyle(e); const rect = e.getBoundingClientRect(); if (!rect.width || !rect.height) return null;
      const ring = (cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) > 0) || (cs.boxShadow && cs.boxShadow !== "none");
      // champ enveloppé dans un libellé qui porte l'anneau (:focus-within) : l'anneau visible est celui du libellé
      const wrap = e.closest("label"); const wcs = wrap && wrap !== e ? getComputedStyle(wrap) : null; const wrapRing = !!wcs && wcs.outlineStyle !== "none" && parseFloat(wcs.outlineWidth) >= 2 && !/rgba\([^)]*, 0\)$/.test(wcs.outlineColor) && wcs.outlineColor !== "transparent";
      const sel = e.tagName.toLowerCase() + (e.id ? "#" + e.id : "") + "." + String(e.className).split(/\s+/).filter(Boolean).slice(0, 2).join(".");
      return { sel, ring: ring || wrapRing, skip: /skip/.test(String(e.className)) };
    });
    if (r && !r.ring && !r.skip) bad.push(r.sel);
  }
  return [...new Set(bad)];
}

// animations : règles CSS qui animent des propriétés de mise en page, et couverture de la réduction des mouvements
function motionStatic() {
  const out = { layoutAnim: [], transitionAll: 0, reducedMotionRules: 0, sheets: 0 };
  const LAYOUT = /\b(width|height|top|left|right|bottom|margin|padding|max-height|min-height|flex-basis)\b/;
  const walk = (rules, inReduced) => { for (const r of rules) { if (r.type === 4 || r.type === 12) { const reduced = r.conditionText && /prefers-reduced-motion/.test(r.conditionText); if (reduced) out.reducedMotionRules += r.cssRules.length; walk(r.cssRules, inReduced || reduced); } else if (r.style && !inReduced) { const t = r.style.transitionProperty || ""; const a = r.style.animationName || ""; if (/\ball\b/.test(t) && r.style.transitionDuration && r.style.transitionDuration !== "0s") out.transitionAll += 1; if (LAYOUT.test(t) && !/all/.test(t)) out.layoutAnim.push(r.selectorText + " { transition: " + t + " }"); } } };
  for (const sh of document.styleSheets) { try { out.sheets += 1; walk(sh.cssRules, false); } catch { /* feuille externe */ } }
  out.layoutAnim = [...new Set(out.layoutAnim)].slice(0, 60);
  return out;
}

(async () => {
  const srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
  const boss = await loginInstructor(srv); const db = srv.db();
  const orgId = db.prepare("SELECT id FROM mk_organizations").get().id;
  const site = Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, 'Site audit', 'site-audit', '{}')").run(orgId).lastInsertRowid);
  const routes = new Set(); for (const i of nav.ITEMS) if (i.href) routes.add(i.href); for (const i of cms.ALL) if (i.href && !/:/.test(i.href)) routes.add(i.href);
  const list = [...routes].filter((r) => !ONLY || r.includes(ONLY));
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true });
  const report = { date: new Date().toISOString(), width: WIDTH, themes: THEMES, routes: list.length, pages: [] };
  let motion = null;
  for (const route of list) for (const theme of THEMES) {
    const ctx = await browser.newContext({ viewport: { width: WIDTH, height: 900 }, colorScheme: theme });
    await ctx.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    await ctx.addInitScript((t) => { try { localStorage.setItem("kolaTheme", t); } catch { /* absent */ } }, theme);
    const page = await ctx.newPage();
    try {
      await page.goto(`${srv.base}${route}${route.includes("?") ? "&" : "?"}site=${site}`, { waitUntil: "load", timeout: 45000 }); await page.waitForTimeout(500);
      const attr = await page.evaluate(() => document.documentElement.getAttribute("data-kola-theme"));
      const r = await page.evaluate(inPage); r.focus = await focusAudit(page); r.route = route; r.theme = theme; r.appliedTheme = attr; report.pages.push(r);
      if (!motion) motion = await page.evaluate(motionStatic);
    } catch (e) { report.pages.push({ route, theme, error: String(e.message).slice(0, 120) }); }
    await ctx.close();
  }
  report.motion = motion;
  await browser.close(); db.close(); await srv.stop();
  fs.writeFileSync(OUT, JSON.stringify(report, null, 1));
  const n = (k) => report.pages.reduce((s, p) => s + ((p[k] && p[k].length) || 0), 0);
  console.log(`Routes ${report.routes} × thèmes ${THEMES.join("/")} : contrastes insuffisants ${n("contrast")}, commandes sans nom ${n("unnamed")}, focus invisible ${n("focus")}, dialogues ${n("dialogs")}`);
})();
