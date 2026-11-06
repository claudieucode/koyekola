// Mesure, pour chaque thème (paquet), quels réglages du MOTEUR du personnalisateur (jetons : couleurs, polices, tailles, arrondis, boutons, images, formulaires, arrière-plan…) agissent
// réellement sur son rendu. Même principe que mesurer-personnalisation-themes.js : l'aperçu du personnalisateur calcule le CSS d'un réglage d'essai, il est appliqué à la page du thème
// dans Chrome, et le style calculé de la page est comparé avant / après. Complète effective.json (clé « static »).
//   THEMES=abysse,albergo node scripts/mesurer-personnalisation-moteur.js
const fs = require("node:fs");
const path = require("node:path");
const ROOT = path.resolve(__dirname, "..");
process.chdir(ROOT);
const { startServer, loginInstructor } = require(path.join(ROOT, "tests/helpers"));
const { chromium } = require("playwright-core");
const lib = require(path.join(ROOT, "src/marketing/themes/library"));
const cz = require(path.join(ROOT, "src/marketing/themes/customization"));
const customizer = require(path.join(ROOT, "src/services/customizer"));
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const ONLY = process.env.THEMES ? new Set(process.env.THEMES.split(",")) : null;
const KEY = "0".repeat(64);
process.env.KOLAKISA_THEME_MEASURE = "1";

// Dans la page : applique les ressources d'un aperçu et renvoie l'empreinte du style calculé
function snapshot(a) {
  const doc = document;
  const el = (id) => { let e = doc.getElementById(id); if (!e) { e = doc.createElement("style"); e.id = id; doc.head.appendChild(e); } return e; };
  if (typeof a.theme === "string") el("kw-site-theme").textContent = a.theme;
  if (typeof a.custom === "string") el("kw-site-custom").textContent = a.custom;
  if (typeof a.faces === "string") el("kw-site-faces").textContent = a.faces;
  doc.body.setAttribute("style", a.bodyStyle || "");
  const props = ["color", "backgroundColor", "fontFamily", "fontSize", "fontWeight", "lineHeight", "letterSpacing", "textTransform", "textDecorationLine", "borderTopLeftRadius", "borderTopColor", "borderTopWidth", "boxShadow", "paddingTop", "paddingLeft", "marginTop", "maxWidth", "width", "backgroundImage", "minHeight", "objectFit"];
  const out = [];
  const els = [...doc.body.querySelectorAll("*")].filter((e) => e.getClientRects().length).slice(0, 900);
  els.unshift(doc.body);
  for (const e of els) { const cs = getComputedStyle(e); out.push(props.map((p) => cs[p]).join("|")); }
  return out.join("\n");
}

const probes = (c) => {
  if (c.kind === "color") return ["#12ab34", "#ab1234"];
  if (c.kind === "toggle") return [true];
  if (c.kind === "number") { const lo = c.min, hi = c.max; return [lo + (hi - lo) * 0.7, lo + (hi - lo) * 0.2].map((v) => (c.step && c.step < 1 ? Math.round(v * 100) / 100 : Math.round(v))); }
  if (c.kind === "select") { if (typeof c.options === "function") return /^tokens\.fonts\./.test(c.id) ? ["font.lora", "font.exo-2"] : []; return c.options.slice(-2).map(([v]) => v); }
  return [];
};

(async () => {
  const srv = await startServer({ ENCRYPTION_KEY: KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
  const boss = await loginInstructor(srv); const db = srv.db();
  const org = db.prepare("SELECT id FROM mk_organizations").get().id;
  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
  const out = JSON.parse(fs.readFileSync(cz.FILE, "utf8"));
  const keys = lib.allMeta().map((m) => m.key).filter((k) => !ONLY || ONLY.has(k));
  let n = 0;
  for (const key of keys) {
    const manifest = lib.manifests().find((x) => x.key === key);
    const site = Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, ?, ?, ?)").run(org, `M-${key}`, `mm-${key}`, JSON.stringify(manifest.tokens)).lastInsertRowid);
    const sections = lib.pageSections(key, "accueil").map((x, i) => ({ ...x, id: x.id || `a${String(i).padStart(11, "0")}` }));
    const pg = Number(db.prepare("INSERT INTO mk_landing_pages (organization_id, name, slug, title, sections, status, kind, site_id, published_at) VALUES (?, ?, ?, 'Accueil', ?, 'published', 'page', ?, datetime('now'))").run(org, `Moteur ${key}`, `mh-${key}`, JSON.stringify(sections), site).lastInsertRowid);
    db.prepare("UPDATE mk_sites SET home_page_id = ? WHERE id = ?").run(pg, site);
    const page = await context.newPage();
    await page.goto(`${srv.base}/marketing/pages/${pg}/apercu`, { waitUntil: "load" });
    await page.addStyleTag({ content: "*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}" });
    await page.waitForTimeout(300);
    const render = async (changes) => { const r = await boss.postJson(`/marketing/site-web/personnaliser/rendu?site=${site}`, { site: String(site), changes }); let j = null; try { j = JSON.parse(r.text); } catch { j = null; } return j && j.assets ? j.assets : null; };
    const base = await render({});
    const baseFp = await page.evaluate(snapshot, base);
    if ((await page.evaluate(snapshot, base)) !== baseFp) { process.stdout.write(`${key}: aperçu instable (animation) : thème ignoré\n`); await page.close(); continue; }
    const found = [];
    // Les réglages du moteur candidats : ceux d'un site qui ne dépendent pas d'un contenu (CSS seulement), hors identité, menus, composants, CSS libre
    for (const c of customizer.catalog(site, key)) {
      if (!c.live || c.pack || ["identite", "menus", "css", "theme-choice"].includes(c.panel) || c.id.startsWith("parts.") || !["color", "number", "select", "toggle"].includes(c.kind)) continue;
      let hit = false;
      for (const v of probes(c)) {
        let a = null;
        try { a = await render({ [c.id]: v }); } catch { a = null; }
        if (!a) continue;
        const fp = await page.evaluate(snapshot, a);
        if (fp !== baseFp) { hit = true; break; }
      }
      if (hit) found.push(c.id);
    }
    await page.close();
    out.themes[key] = { ...(out.themes[key] || {}), static: found };
    n += 1;
    process.stdout.write(`${key}: ${found.length} réglages du moteur\n`);
    fs.writeFileSync(cz.FILE, JSON.stringify(out, null, 1));
  }
  console.log(`${n} thèmes mesurés (moteur)`);
  await browser.close(); await srv.stop(); process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
