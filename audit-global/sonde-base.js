// Palier 24 — inventaire de la base d'un serveur de test jetable (lecture seule, aucune donnée de production).
const { TEST_KEY } = require("../tests/marketing-helpers");
const { startServer } = require("../tests/helpers");
(async () => {
  const srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" }); const db = srv.db();
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map((r) => r.name);
  const info = tables.map((t) => { const cols = db.prepare(`PRAGMA table_info(${t})`).all().map((c) => c.name); const fks = db.prepare(`PRAGMA foreign_key_list(${t})`).all().length; const idx = db.prepare(`PRAGMA index_list(${t})`).all().length; return { t, cols: cols.length, site: cols.includes("site_id"), org: cols.includes("organization_id"), fks, idx }; });
  const group = (n) => (n.startsWith("mk_") ? "marketing (mk_)" : n.startsWith("seo_") ? "SEO (seo_)" : n.startsWith("cms_") ? "CMS (cms_)" : n.startsWith("nav_") ? "navigation (nav_)" : n.startsWith("appearance_") ? "apparence" : /^(users|courses|lessons|orders|order_|enrollments|reviews|progress|promo|certificates|support|favorites|cart)/.test(n) ? "LMS / commerce de base" : /^(post|blog|taxonomy)/.test(n) ? "blog / taxonomie" : "autres");
  const byGroup = {}; for (const r of info) (byGroup[group(r.t)] = byGroup[group(r.t)] || []).push(r.t);
  console.log("tables:", tables.length, "| avec site_id:", info.filter((r) => r.site).length, "| avec organization_id:", info.filter((r) => r.org).length, "| avec clé étrangère:", info.filter((r) => r.fks).length);
  for (const [g, list] of Object.entries(byGroup)) console.log(" -", g.padEnd(24), list.length);
  console.log("tables avec site_id:", info.filter((r) => r.site).map((r) => r.t).join(", "));
  console.log("tables SANS organization_id ni site_id parmi mk_*:", info.filter((r) => r.t.startsWith("mk_") && !r.org && !r.site).map((r) => r.t).join(", "));
  console.log("PRAGMA integrity_check:", db.prepare("PRAGMA integrity_check").get().integrity_check, "| foreign_key_check lignes:", db.prepare("PRAGMA foreign_key_check").all().length);
  console.log("mode journal:", db.prepare("PRAGMA journal_mode").get().journal_mode, "| triggers:", db.prepare("SELECT COUNT(*) n FROM sqlite_master WHERE type='trigger'").get().n, "| index:", db.prepare("SELECT COUNT(*) n FROM sqlite_master WHERE type='index'").get().n);
  require("fs").writeFileSync(__dirname + "/resultats/tables.json", JSON.stringify(info, null, 1));
  db.close(); await srv.stop();
})().catch((e) => { console.error(e); process.exit(1); });
