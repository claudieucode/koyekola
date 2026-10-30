// Palier 15 : audit d'accessibilité mesuré dans Chrome réel (vrai serveur, base de test). Aucun outil tiers (axe-core / Lighthouse non installés) :
// ce sont des contrôles AUTOMATIQUES partiels, écrits ici, qui ne valent pas conformité WCAG. Calculs : contraste WCAG 2.x (alpha composité sur les fonds parents),
// parcours Tab réel (visibilité du focus, focus masqué par un élément superposé), noms accessibles, titres, repères, champs étiquetés, images, mouvement réduit.
// Usage : node scripts/a11y/audit-accessibilite.js [--json f] [--captures dossier] [--only /adresse1,/adresse2]  (--only : ne mesure que ces adresses, en tant qu'écrans d'administration)
"use strict";
const fs = require("node:fs");
const { TEST_KEY } = require("../../tests/marketing-helpers");
const { startServer, loginInstructor } = require("../../tests/helpers");
const { chromium } = require("playwright-core");
const CHROME = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const arg = (k, d) => { const i = process.argv.indexOf("--" + k); return i > 0 ? process.argv[i + 1] : d; };
const PUBLIC = ["/", "/catalogue", "/blog", "/connexion", "/inscription", "/contact", "/faq", "/a-propos"];
const ADMIN = ["/formateur", "/formateur/formations", "/formateur/blog", "/formateur/gestion", "/formateur/gestion/ventes", "/formateur/gestion/eleves", "/formateur/messages", "/formateur/seo",
  "/marketing", "/marketing/contacts", "/marketing/campagnes", "/marketing/pages", "/marketing/formulaires", "/marketing/tunnels", "/marketing/listes", "/marketing/segments"];

// ---- exécuté dans la page ----
function statique() {
  const out = [];
  const vis = (e) => { const r = e.getBoundingClientRect(); const c = getComputedStyle(e); return r.width > 0 && r.height > 0 && c.visibility !== "hidden" && c.display !== "none" && !e.closest("[hidden],[aria-hidden='true'],[inert]"); };
  const sel = (e) => e.tagName.toLowerCase() + (e.id ? "#" + e.id : "") + (typeof e.className === "string" && e.className.trim() ? "." + e.className.trim().split(/\s+/).slice(0, 2).join(".") : "");
  const txt = (e) => (e.textContent || "").replace(/\s+/g, " ").trim();
  const nameOf = (e) => {
    const al = e.getAttribute("aria-label"); if (al && al.trim()) return al.trim();
    const lb = e.getAttribute("aria-labelledby"); if (lb) { const t = lb.split(/\s+/).map((i) => { const x = document.getElementById(i); return x ? txt(x) : ""; }).join(" ").trim(); if (t) return t; }
    if (e.labels && e.labels.length) { const t = [...e.labels].map(txt).join(" ").trim(); if (t) return t; }
    const t = txt(e); if (t) return t;
    const img = e.querySelector("img[alt]"); if (img && img.alt.trim()) return img.alt.trim();
    const svgT = e.querySelector("svg title"); if (svgT && txt(svgT)) return txt(svgT);
    const so = e.querySelector(".sr-only"); if (so && txt(so)) return txt(so);
    if (e.getAttribute("title")) return e.getAttribute("title"); if (e.getAttribute("placeholder") && /INPUT|TEXTAREA/.test(e.tagName)) return "(placeholder seul)";
    return "";
  };
  // 1. noms accessibles
  for (const e of document.querySelectorAll("a[href], button, input:not([type=hidden]), select, textarea, [role=button], [role=link], [role=tab], [role=menuitem]")) {
    if (!vis(e)) continue; const n = nameOf(e);
    if (!n) out.push({ k: "nom-manquant", d: sel(e) });
    else if (n === "(placeholder seul)") out.push({ k: "champ-placeholder-seul", d: sel(e) });
  }
  // 2. images
  for (const i of document.querySelectorAll("img")) if (vis(i) && !i.hasAttribute("alt")) out.push({ k: "img-sans-alt", d: sel(i) });
  // 3. titres
  const hs = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")].filter(vis);
  const h1 = hs.filter((h) => h.tagName === "H1").length;
  if (h1 !== 1) out.push({ k: "h1", d: h1 + " titre(s) de niveau 1" });
  let prev = 0; for (const h of hs) { const l = +h.tagName[1]; if (prev && l > prev + 1) out.push({ k: "saut-de-titre", d: `h${prev} → h${l} « ${txt(h).slice(0, 40)} »` }); prev = l; if (!txt(h)) out.push({ k: "titre-vide", d: sel(h) }); }
  // 4. repères, langue, titre
  if (!document.documentElement.lang) out.push({ k: "lang", d: "attribut lang absent" });
  if (!document.title.trim()) out.push({ k: "titre-page", d: "document.title vide" });
  if (!document.querySelector("main, [role=main]")) out.push({ k: "main", d: "aucun repère main" });
  const navs = [...document.querySelectorAll("nav, [role=navigation]")].filter(vis); if (navs.length > 1) for (const n of navs) if (!n.getAttribute("aria-label") && !n.getAttribute("aria-labelledby")) out.push({ k: "nav-sans-nom", d: sel(n) });
  // 5. identifiants en double, tabindex positif
  const ids = {}; for (const e of document.querySelectorAll("[id]")) ids[e.id] = (ids[e.id] || 0) + 1; for (const [i, n] of Object.entries(ids)) if (n > 1) out.push({ k: "id-double", d: i + " ×" + n });
  for (const e of document.querySelectorAll("[tabindex]")) if (+e.getAttribute("tabindex") > 0) out.push({ k: "tabindex-positif", d: sel(e) });
  // 6. champs : étiquette, erreurs
  for (const f of document.querySelectorAll("form")) { if (!vis(f)) continue; for (const i of f.querySelectorAll("input:not([type=hidden]):not([type=submit]):not([type=button]), select, textarea")) { if (vis(i) && i.required && i.getAttribute("aria-required") !== "true" && !i.required) out.push({ k: "requis", d: sel(i) }); } }
  // 7. lien « vide » / cible nouvelle fenêtre sans info : ignoré (non automatisable sans heuristique fragile)
  // 8. contraste
  const parse = (s) => { const m = s.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[,\s/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
  const over = (f, b) => ({ r: f.r * f.a + b.r * (1 - f.a), g: f.g * f.a + b.g * (1 - f.a), b: f.b * f.a + b.b * (1 - f.a), a: 1 });
  const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const bgOf = (e) => { let stack = []; for (let p = e; p; p = p.parentElement) { const cs = getComputedStyle(p); if (cs.backgroundImage && cs.backgroundImage !== "none") return null; const c = parse(cs.backgroundColor); if (c && c.a > 0) { stack.push(c); if (c.a >= 1) break; } } let base = { r: 255, g: 255, b: 255, a: 1 }; for (let i = stack.length - 1; i >= 0; i--) base = over(stack[i], base); return base; };
  const seen = new Map(); let inconnus = 0, mesures = 0;
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n; (n = walker.nextNode());) {
    if (!n.nodeValue.trim()) continue; const e = n.parentElement; if (!e || !vis(e) || e.closest("script,style,noscript,svg")) continue;
    const cs = getComputedStyle(e); if (+cs.opacity === 0) continue; let opAll = 1; for (let p = e; p; p = p.parentElement) opAll *= +getComputedStyle(p).opacity; if (opAll < 0.05) continue; /* texte encore invisible (révélation au défilement) */
    const bg = bgOf(e); if (!bg) { inconnus++; continue; }
    let fg = parse(cs.color); if (!fg) continue; let op = 1; for (let p = e; p; p = p.parentElement) op *= +getComputedStyle(p).opacity; fg = { ...fg, a: fg.a * op }; fg = over(fg, bg);
    const size = parseFloat(cs.fontSize), bold = +cs.fontWeight >= 700, large = size >= 24 || (size >= 18.66 && bold);
    const need = large ? 3 : 4.5, r = ratio(fg, bg); mesures++;
    const disabled = e.closest(":disabled,[aria-disabled=true]"); // exception WCAG 1.4.3 : composants inactifs
    if (r < need && !disabled) { const k = sel(e) + "|" + cs.color + "|" + cs.backgroundColor; if (!seen.has(k)) seen.set(k, { k: "contraste", d: `${sel(e)} ${r.toFixed(2)}:1 (min ${need}) texte ${cs.color} sur ${Math.round(bg.r)},${Math.round(bg.g)},${Math.round(bg.b)} « ${n.nodeValue.trim().slice(0, 30)} »` }); }
  }
  out.push(...seen.values()); out.push({ k: "info", d: `contraste: ${mesures} textes mesurés, ${inconnus} sur image/dégradé non évaluables` });
  return out;
}

// ---- parcours Tab réel ----
async function parcoursTab(page, max) {
  const res = [];
  await page.evaluate(() => { document.activeElement && document.activeElement.blur && document.activeElement.blur(); window.scrollTo(0, 0); });
  let first = null;
  for (let i = 0; i < max; i++) {
    await page.keyboard.press("Tab"); await page.waitForTimeout(380); /* transitions de focus (~200 ms) terminées */
    const r = await page.evaluate(() => {
      const e = document.activeElement; if (!e || e === document.body) return { fin: true };
      const cs = getComputedStyle(e), rc = e.getBoundingClientRect();
      const sel = e.tagName.toLowerCase() + (e.id ? "#" + e.id : "") + (typeof e.className === "string" && e.className.trim() ? "." + e.className.trim().split(/\s+/).slice(0, 2).join(".") : "");
      const outline = cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) > 0 && !/rgba\(\d+, \d+, \d+, 0\)/.test(cs.outlineColor);
      const shadow = cs.boxShadow !== "none";
      // focus porté par un ancêtre ou un frère (pill, :focus-within)
      let wrap = false; for (let p = e.parentElement; p && p !== document.body; p = p.parentElement) { const pc = getComputedStyle(p); if (p.matches(":focus-within") && ((pc.outlineStyle !== "none" && parseFloat(pc.outlineWidth) > 0) || pc.boxShadow !== "none" || pc.borderColor !== getComputedStyle(p).borderColor)) { wrap = true; break; } }
      const visible = rc.width > 0 && rc.height > 0;
      let masque = false, by = ''; if (visible) { const x = Math.min(innerWidth - 1, Math.max(0, rc.left + rc.width / 2)), y = Math.min(innerHeight - 1, Math.max(0, rc.top + rc.height / 2)); if (rc.bottom > 0 && rc.top < innerHeight) { const t = document.elementFromPoint(x, y); masque = Boolean(t && t !== e && !e.contains(t) && !t.contains(e)); if (masque) by = t.tagName.toLowerCase() + (typeof t.className === 'string' && t.className ? '.' + t.className.trim().split(/\s+/)[0] : ''); } else masque = true; }
      return { by, tx: (e.textContent || e.value || '').trim().slice(0, 30), sel, outline, shadow, wrap, visible, masque, w: Math.round(rc.width), h: Math.round(rc.height), id: sel + "@" + Math.round(rc.left) + "," + Math.round(rc.top) };
    });
    if (r.fin) break; if (first === null) first = r.id; else if (r.id === first) break;
    if (!r.visible) res.push({ k: "focus-sur-element-invisible", d: r.sel }); else {
      if (!r.outline && !r.shadow && !r.wrap) res.push({ k: "focus-invisible", d: `${r.sel} « ${r.tx} »` });
      if (r.masque) res.push({ k: "focus-masque", d: `${r.sel} « ${r.tx} » masqué par ${r.by}` });
    }
  }
  return res;
}

(async () => {
  const srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
  const boss = await loginInstructor(srv);
  const pageId = Number((await boss.post("/marketing/pages", { name: "Audit accessibilité" })).location.match(/(\d+)$/)[1]);
  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  const results = [];
  const ctxs = {};
  const mk = async (theme) => { const c = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: theme, reducedMotion: "reduce" }); /* mouvement réduit : mesure sur des états stables, pas au milieu d'un fondu */ await c.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base }))); return c; };
  for (const theme of ["light", "dark"]) {
    ctxs[theme] = await mk(theme);
    const page = await ctxs[theme].newPage();
    const only = arg("only", ""), list = only ? only.split(",").map((u) => ["admin", u]) : [...PUBLIC.map((u) => ["public", u]), ...ADMIN.map((u) => ["admin", u]), ["éditeur", `/marketing/pages/${pageId}/editeur`]];
    for (const [cat, url] of list) {
      try {
        await page.goto(srv.base + url, { waitUntil: "load" }); await page.waitForTimeout(cat === "éditeur" ? 1500 : 350);
        const st = await page.evaluate(`(${statique.toString()})()`);
        const tab = theme === "light" ? await parcoursTab(page, cat === "éditeur" ? 120 : 70) : [];
        for (const f of [...st, ...tab]) results.push({ theme, cat, url, ...f });
      } catch (e) { results.push({ theme, cat, url, k: "erreur", d: String(e.message).slice(0, 120) }); }
    }
    process.stdout.write(`thème ${theme} fait\n`);
  }
  // mouvement réduit : animations/transitions restantes
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
  const pm = await ctx.newPage();
  for (const u of ["/", "/catalogue", "/blog"]) {
    await pm.goto(srv.base + u, { waitUntil: "load" }); await pm.waitForTimeout(500);
    const n = await pm.evaluate(() => { let a = 0; const ex = []; for (const e of document.body.querySelectorAll("*")) { const cs = getComputedStyle(e); if (cs.animationName !== "none" && parseFloat(cs.animationDuration) > 0.05 && cs.animationIterationCount === "infinite") { a++; if (ex.length < 3) ex.push(e.tagName + "." + String(e.className).slice(0, 30) + ":" + cs.animationName); } } return { a, ex }; });
    if (n.a) results.push({ theme: "-", cat: "public", url: u, k: "mouvement-reduit", d: `${n.a} animation(s) infinies actives : ${n.ex.join(" ")}` });
  }
  await browser.close(); await srv.stop();
  const f = arg("json", ""); if (f) fs.writeFileSync(f, JSON.stringify(results, null, 1));
  const by = {}; for (const r of results) { if (r.k === "info") continue; const k = `${r.cat} | ${r.k}`; by[k] = (by[k] || 0) + 1; }
  console.log(`${results.filter((r) => r.k !== "info").length} constats`); for (const [k, v] of Object.entries(by).sort()) console.log(String(v).padStart(4), k);
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
