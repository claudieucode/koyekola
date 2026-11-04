// Banc d'essai léger de la bibliothèque de thèmes : un mini-serveur qui monte SEULEMENT l'aperçu de démonstration et les visuels, sur une base temporaire
// (schéma réel + migrations), avec un compte de formateur simulé. Il utilise exactement le même code de rendu que l'application (routes themeDemo et themeArtPublic,
// gabarit de page, moteur de styles) : la différence est de ne pas démarrer le serveur complet (très lent sur une machine chargée). Sert aux aperçus et aux tests.
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

async function startHarness() {
  const ROOT = path.join(__dirname, "..", "..");
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "kola-harness-"));
  process.env.DATA_DIR = tmp; process.env.UPLOADS_DIR = path.join(tmp, "uploads"); process.env.NODE_ENV = process.env.NODE_ENV || "test"; process.env.SITE_URL = process.env.SITE_URL || "";
  const express = require(path.join(ROOT, "node_modules", "express"));
  const db = require(path.join(ROOT, "src", "config", "database"));
  const { migrate } = require(path.join(ROOT, "src", "marketing", "db", "migrate"));
  migrate(db, { dir: path.join(ROOT, "src", "marketing", "migrations"), dbPath: ":memory:", log: { log() {}, warn() {}, error() {} } });
  db.exec("INSERT INTO mk_organizations (name, slug) VALUES ('Organisation de démonstration', 'demo')");
  const { injectLocals } = require(path.join(ROOT, "src", "middlewares", "locals"));
  const app = express();
  app.set("view engine", "ejs"); app.set("views", path.join(ROOT, "views")); app.set("trust proxy", 1);
  app.locals.fontFacesFor = (css, siteId) => require(path.join(ROOT, "src", "utils", "fontLibrary")).faceCssFor(css, { siteId }); // @font-face des familles citées (comme server.js)
  app.use((req, res, next) => { req.session = { user: { id: 1, username: "formateur", role: "formateur" } }; next(); });
  app.use(injectLocals);
  app.use("/fonts/library", express.static(path.join(ROOT, "public", "fonts", "library"), { maxAge: "30d", immutable: true, index: false }));
  app.use(express.static(path.join(ROOT, "public")));
  app.use(require(path.join(ROOT, "src", "marketing", "web", "themeArtPublic"))());
  app.use(require(path.join(ROOT, "src", "marketing", "web", "themePackPublic"))());
  const ctx = { db, organizationId: 1, userId: 1, can: () => true };
  app.use("/marketing", (req, res, next) => { req.mk = { ctx, can: () => true, perms: new Set(), siteOnly: false, siteId: null, site: null, role: "owner" }; next(); }, require(path.join(ROOT, "src", "marketing", "web", "themeDemo"))());
  app.use((err, req, res, next) => { console.error(err); res.status(500).send(String(err && err.stack || err)); }); // eslint-disable-line no-unused-vars
  const server = await new Promise((resolve) => { const s = app.listen(0, "127.0.0.1", () => resolve(s)); });
  return { base: `http://127.0.0.1:${server.address().port}`, db, ctx, stop: () => new Promise((r) => server.close(() => { try { db.close(); } catch { /* déjà fermée */ } fs.rmSync(tmp, { recursive: true, force: true }); r(); })) };
}
module.exports = { startHarness };
