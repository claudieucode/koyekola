// Programme 22.1 — Laboratoire de qualité des sites générés par Kolakisa AI Website Builder.
//   NODE_PATH=…/node_modules node scripts/quality-lab-navigateur/run.js [--only id1,id2] [--out dossier] [--no-browser]
// Étapes : (1) vrai serveur + base de test ; (2) génération des 12 sites vitrines avec les vrais moteurs (IA simulée, aucun coût) ; (3) 3 boutiques par le constructeur de boutique (21.10) ;
// (4) audit dans un VRAI Chrome (4 formats) ; (5) notation. Les résultats sont écrits en JSON pour être comparés aux prochains paliers.
"use strict";
const fs = require("node:fs");
const path = require("node:path");
const arg = (k, d) => { const i = process.argv.indexOf("--" + k); return i > 0 ? process.argv[i + 1] : d; };
const OUT = path.resolve(arg("out", path.join(__dirname, "..", "..", "docs", "quality-lab-navigateur")));
const ONLY = arg("only", "") ? arg("only", "").split(",") : null;
const NO_BROWSER = process.argv.includes("--no-browser");
const PART = arg("part", "all");
fs.mkdirSync(OUT, { recursive: true });

const { startServer, loginInstructor } = require("../../tests/helpers");
const { TEST_KEY } = require("../../tests/marketing-helpers");
const { DatabaseSync } = require("node:sqlite");
const { createEventBus } = require("../../src/marketing/events/bus");
const { createSettings } = require("../../src/marketing/settings");
const { SCENARIOS } = require("./scenarios");
const { auditSite } = require("./browser");

const { scoreSite } = require("./score");

(async () => {
  const srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "", ALLOW_INDEXING: "1" });
  const boss = await loginInstructor(srv);
  // Les moteurs de ce processus écrivent dans la base et le dossier de fichiers du SERVEUR de test (jamais dans ceux du dépôt) : on les désigne AVANT de les charger
  process.env.DATA_DIR = path.join(srv.dir, "data"); process.env.UPLOADS_DIR = path.join(srv.dir, "uploads");
  const { generateVitrine } = require("./generate");
  const { generateShop } = require("./shop");
  const db = srv.db(); db.exec("PRAGMA busy_timeout = 20000");
  const quiet = { log() {}, warn() {}, error() {} };
  const org = db.prepare("SELECT id FROM mk_organizations ORDER BY id LIMIT 1").get();
  const user = db.prepare("SELECT id FROM users ORDER BY id LIMIT 1").get();
  if (!org) throw new Error("organisation introuvable : la base du serveur n'est pas prête");
  const bus = createEventBus(db, { log: quiet }); const settings = createSettings(db, { encryptionKey: TEST_KEY });
  const A = { db, organizationId: org.id, userId: user ? user.id : 1, bus, settings, tokenKey: TEST_KEY, baseUrl: "https://k.test", log: quiet };
  const results = [];
  const list = SCENARIOS.filter((s) => !ONLY || ONLY.includes(s.id));
  for (const sc of list) {
    const t0 = Date.now();
    try {
      const host = `${sc.id}.lab.test`;
      const gen = sc.shop ? await generateShop(A, sc, { host, srv, boss }) : await generateVitrine(A, sc, { host });
      results.push({ sc, gen }); console.log(`[génération] ${sc.id} : ${(Date.now() - t0)} ms`);
    } catch (e) { results.push({ sc, gen: { id: sc.id, error: e.message, stack: String(e.stack).split("\n").slice(0, 4).join(" | ") } }); console.log(`[génération] ${sc.id} : ÉCHEC ${e.message}`); }
  }
  if (!NO_BROWSER) {
    const { chromium } = require("playwright-core");
    const CHROME = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
    const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ["--host-resolver-rules=MAP *.lab.test 127.0.0.1"] });
    const port = new URL(srv.base).port;
    for (const r of results) {
      if (r.gen.error) continue;
      const t0 = Date.now();
      try { r.audit = await auditSite(browser, { base: `http://${r.gen.host}:${port}`, gen: r.gen, sc: r.sc, out: OUT }); console.log(`[navigateur] ${r.sc.id} : ${Date.now() - t0} ms`);
        if (r.sc.shop) { const { journey } = require("./shop"); r.audit.journeys = []; for (const w of [1280, 820, 375]) r.audit.journeys.push(await journey(browser, `http://${r.gen.host}:${port}`, w)); console.log(`[parcours d'achat] ${r.sc.id} : ${JSON.stringify(r.audit.journeys.map((j) => j.failedAt || "ok"))}`); } }
      catch (e) { r.audit = { error: e.message }; console.log(`[navigateur] ${r.sc.id} : ÉCHEC ${e.message}`); }
    }
    await browser.close();
  }
  // Un « lot » = un serveur. Les lots sont fusionnés et notés par merge.js (chaque boutique a son propre serveur : voir le défaut D-G1 du rapport).
  fs.mkdirSync(path.join(OUT, "parts"), { recursive: true });
  fs.writeFileSync(path.join(OUT, "parts", `${PART}.json`), JSON.stringify(results.map((r) => ({ id: r.sc.id, label: r.sc.label, brief: r.sc.brief, shop: Boolean(r.sc.shop), gen: r.gen, audit: r.audit || null })), null, 1));
  console.log(`[lot ${PART}] ${results.length} scénario(s) enregistré(s)`);
  db.close(); await srv.stop();
})().catch((e) => { console.error(e); process.exit(1); });
