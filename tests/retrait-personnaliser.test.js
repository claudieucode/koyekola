// Retrait définitif du module « Personnaliser » : plus d'écran, plus de route, plus d'entrée de menu, plus de fichier ni d'appel mort ;
// tables propres au module supprimées, tables partagées (brouillons/versions des styles) conservées ; Styles, Theme Builder et rendu public intacts.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");

const ROOT = path.join(__dirname, "..");
const walk = (dir, out = []) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === "node_modules" || e.name === "migrations") continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out); else if (/\.(js|ejs|css)$/.test(e.name)) out.push(p);
  }
  return out;
};

describe("retrait du module Personnaliser : fichiers et références", () => {
  test("les fichiers du module n'existent plus", () => {
    for (const f of ["views/marketing/customizer.ejs", "public/js/customizer.js", "public/css/customizer.css", "src/marketing/web/customizer.js", "src/services/previewParts.js", "src/services/customizer.js", "src/middlewares/customizerPreview.js", "src/marketing/themes/customization"]) {
      assert.equal(fs.existsSync(path.join(ROOT, f)), false, f);
    }
  });
  test("aucun code ne référence encore les modules retirés, ni la route, ni le nom du module", () => {
    const bad = [];
    for (const dir of ["src", "views", "public/js", "public/css"]) {
      for (const f of walk(path.join(ROOT, dir))) {
        const t = fs.readFileSync(f, "utf8");
        if (/services\/customizer\b|\.\/customizer["']|customizerPreview|previewParts|themes\/customization|kwPartsPreview|kwShared|kwshare|apparence\/personnaliser/.test(t)) bad.push(path.relative(ROOT, f));
      }
    }
    // _ancienne-bibliotheque : pages de démonstration d'un thème boutique (« Comment personnaliser » = contenu de vitrine, sans lien avec le module)
    assert.deepEqual(bad.filter((f) => !f.includes("_ancienne-bibliotheque")), []);
  });
  test("le moteur de styles partagé existe et se charge sans le module", () => {
    const s = require("../src/services/siteStyles");
    for (const k of ["state", "saveDraft", "discardDraft", "previewFor", "publish", "history", "restoreVersion", "applyChanges"]) assert.equal(typeof s[k], "function", k);
    for (const id of ["theme-choice"]) assert.equal(s.PANELS.some((p) => p.id === id), false, `panneau ${id} retiré`);
    for (const k of ["schedule", "unschedule", "runDue", "createShare", "shareLookup"]) assert.equal(s[k], undefined, `${k} retiré (planification et liens partagés)`);
  });
});

describe("retrait du module Personnaliser : serveur réel", () => {
  let srv, boss, db;
  before(async () => { srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" }); boss = await loginInstructor(srv); db = srv.db(); });
  after(() => srv && srv.stop());

  test("les routes de l'ancien module (brouillon, publication, planification, partage) répondent 404", async () => {
    for (const u of ["/marketing/site-web/personnaliser/brouillon", "/marketing/site-web/personnaliser/publier", "/marketing/site-web/personnaliser/planifier", "/marketing/site-web/personnaliser/partager"]) {
      const r = await boss.get(u);
      assert.equal(r.status, 404, u);
    }
  });
  test("l'écran Styles fonctionne et ne mentionne plus Personnaliser ; Thèmes et Theme Builder s'ouvrent", async () => {
    const st = await boss.get("/marketing/site-web/styles");
    assert.equal(st.status, 200);
    assert.match(st.text, /personnaliser\?site|personnaliser"/, "lien vers la nouvelle coque"); assert.doesNotMatch(st.text, /planifier|partager/i);
    for (const u of ["/marketing/site-web/themes", "/marketing/site-web/apparence/theme-builder", "/marketing/site-web/sites"]) {
      const r = await boss.get(u);
      assert.equal(r.status, 200, u);
      assert.doesNotMatch(r.text, /Personnaliser le site|>Personnaliser</, u);
    }
  });
  test("tables : propres au module supprimées, partagées conservées, colonnes de planification retirées", () => {
    const has = (n) => Boolean(db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name=?").get(n));
    assert.equal(has("cms_customizer_shares"), false);
    assert.equal(has("cms_theme_settings"), false);
    assert.equal(has("cms_customizer_drafts"), true);
    assert.equal(has("cms_customizer_versions"), true);
    const cols = db.prepare("PRAGMA table_info(cms_customizer_drafts)").all().map((c) => c.name);
    for (const c of ["publish_at", "scheduled_by", "publish_error"]) assert.equal(cols.includes(c), false, c);
    for (const t of ["mk_sites", "mk_landing_pages", "cms_themes", "mk_tb_templates"]) assert.equal(has(t), true, `${t} conservée`);
  });
});
