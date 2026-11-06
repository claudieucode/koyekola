// Mesure l'EFFET réel de chaque réglage de personnalisation sur chaque thème (paquet) : charge la page d'accueil du thème dans Chrome, applique une valeur d'essai
// et compare le rendu calculé. Écrit src/marketing/themes/customization/effective.json (réglages génériques + réglages du moteur qui agissent sur le thème).
//   node scripts/mesurer-personnalisation-themes.js                 → tous les thèmes
//   THEMES=abysse,albergo node scripts/mesurer-personnalisation-themes.js
//   STATIC=1 ...                                                    → mesure aussi les réglages du moteur (jetons) via l'aperçu du personnalisateur
const fs = require("node:fs");
const path = require("node:path");
const ROOT = path.resolve(__dirname, "..");
process.chdir(ROOT);
const { startServer, loginInstructor } = require(path.join(ROOT, "tests/helpers"));
const { chromium } = require("playwright-core");
const lib = require(path.join(ROOT, "src/marketing/themes/library"));
const cz = require(path.join(ROOT, "src/marketing/themes/customization"));
const controls = cz.controls;
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const ONLY = process.env.THEMES ? new Set(process.env.THEMES.split(",")) : null;
const KEY = "0".repeat(64);

const PROBE_COLOR = "#12ab34";
const toHex = (rgb) => { const m = String(rgb).match(/[\d.]+/g); if (!m || (m.length > 3 && Number(m[3]) < 0.5)) return ""; return "#" + m.slice(0, 3).map((x) => Math.round(Number(x)).toString(16).padStart(2, "0")).join(""); };

// Dans la page : éléments concernés, valeur actuelle, valeur après la règle d'essai
function inPage({ scope, ctl, rule }) {
  const split = (sel) => { const out = []; let d = 0, cur = ""; for (const ch of sel) { if (ch === "(" || ch === "[") d++; else if (ch === ")" || ch === "]") d--; if (ch === "," && d === 0) { out.push(cur.trim()); cur = ""; } else cur += ch; } if (cur.trim()) out.push(cur.trim()); return out; };
  const base = ctl.sel === "" ? [scope] : split(ctl.sel).map((s) => `${scope} ${s}`.replace(/:hover/g, ""));
  const body = document.body;
  let els = [];
  try { els = ctl.sel === "" ? [body] : [...document.querySelectorAll(base.join(","))]; } catch { els = []; }
  els = els.filter((e) => e.getClientRects().length || e === body);
  if (!els.length) return { n: 0 };
  if (ctl.probeVar) { els = [...document.querySelectorAll(".lp-main > .lp-block-layout")].filter((e) => e.getClientRects().length); if (!els.length) return { n: 0 }; }
  const prop = ctl.probeVar ? (ctl.id === "pg-max" ? "maxWidth" : "paddingLeft") : ctl.prop;
  const read = () => els.slice(0, 40).map((e) => { const cs = getComputedStyle(e); const v = cs[prop]; if (prop === "letterSpacing" && v === "normal") return "0"; if (ctl.unit === "em" || prop === "lineHeight") { const fs = parseFloat(cs.fontSize) || 16; const px = v === "normal" ? fs * 1.2 : parseFloat(v); return String(Math.round((px / fs) * 1000) / 1000); } return v; });
  const before = read();
  const st = document.createElement("style"); st.id = "kw-probe"; st.textContent = rule; document.head.appendChild(st);
  const after = read();
  st.remove();
  const changed = ctl.state ? true : before.some((v, i) => v !== after[i]);
  const freq = {}; before.forEach((v) => { freq[v] = (freq[v] || 0) + 1; });
  const mode = Object.keys(freq).sort((x, y) => freq[y] - freq[x])[0];
  return { n: els.length, before: mode, changed, after: after[0] };
}

(async () => {
  const srv = await startServer({ ENCRYPTION_KEY: KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
  const boss = await loginInstructor(srv); const db = srv.db();
  const org = db.prepare("SELECT id FROM mk_organizations").get().id;
  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
  const out = fs.existsSync(cz.FILE) ? JSON.parse(fs.readFileSync(cz.FILE, "utf8")) : { version: 1, themes: {} };
  out.version = 1;
  const specs = lib.allMeta().map((m) => m.key).filter((k) => !ONLY || ONLY.has(k));
  let n = 0;
  for (const key of specs) {
    const manifest = lib.manifests().find((x) => x.key === key);
    const site = Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, ?, ?, ?)").run(org, key, `m-${key}`, JSON.stringify(manifest.tokens)).lastInsertRowid);
    const sections = lib.pageSections(key, "accueil").map((x, i) => ({ ...x, id: x.id || `a${String(i).padStart(11, "0")}` }));
    const pg = Number(db.prepare("INSERT INTO mk_landing_pages (organization_id, name, slug, title, sections, status, kind, site_id, published_at) VALUES (?, ?, ?, 'Accueil', ?, 'published', 'page', ?, datetime('now'))").run(org, `Accueil ${key}`, `h-${key}`, JSON.stringify(sections), site).lastInsertRowid);
    db.prepare("UPDATE mk_sites SET home_page_id = ? WHERE id = ?").run(pg, site);
    const page = await context.newPage();
    await page.goto(`${srv.base}/marketing/pages/${pg}/apercu`, { waitUntil: "load" });
    await page.waitForTimeout(400);
    const scope = `body[data-kw-pack="${key}"]`;
    const res = {};
    for (const c of controls.list) {
      let probe;
      const first = await page.evaluate(inPage, { scope, ctl: { ...c, css: undefined, map: undefined }, rule: "" });
      if (!first.n) continue;
      const def = c.kind === "color" ? toHex(first.before) : c.kind === "number" ? String(Math.round(parseFloat(first.before) * 1000) / 1000 || 0) : c.kind === "toggle" ? (first.before === "sticky" ? "on" : "off") : (c.options.some(([o]) => o === first.before) ? first.before : "");
      if (c.kind === "color") probe = PROBE_COLOR;
      else if (c.kind === "number") { const d = parseFloat(def) || 0; const t = d + (c.max - c.min) * 0.3; probe = String(Math.min(c.max, t > c.max ? d - (c.max - c.min) * 0.3 : t)); if (Number(probe) < c.min) probe = String(c.min); }
      else if (c.kind === "select") probe = (c.options.find(([o]) => o !== def) || c.options[0])[0];
      else probe = def === "on" ? "off" : "on";
      if (c.kind === "toggle" && def === "on") continue;
      const rule = controls.rule(key, c, probe);
      if (!rule) continue;
      const r = await page.evaluate(inPage, { scope, ctl: { ...c, css: undefined, map: undefined }, rule });
      if (r.changed) res[c.id] = { default: def, n: r.n };
    }
    await page.close();
    out.themes[key] = { ...(out.themes[key] || {}), controls: res, measuredAt: new Date().toISOString().slice(0, 10) };
    n += 1;
    process.stdout.write(`${key}: ${Object.keys(res).length}/${controls.list.length}\n`);
    fs.writeFileSync(cz.FILE, JSON.stringify(out, null, 1));
  }
  console.log(`${n} thèmes mesurés → ${path.relative(ROOT, cz.FILE)}`);
  await browser.close(); await srv.stop(); process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
