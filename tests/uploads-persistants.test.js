// Fichiers envoyés : rangés dans un dossier conservé entre deux déploiements (DATA_DIR/uploads quand UPLOADS_DIR
// n'est pas défini) ; au démarrage, les fichiers restés dans les anciennes versions déployées sont recopiés.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");
const { recoverUploads } = require("../src/config/recoverUploads");

test("sans UPLOADS_DIR mais avec DATA_DIR : les fichiers envoyés vont dans DATA_DIR/uploads (conservé)", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "kolakisa-paths-"));
  const out = execFileSync(process.execPath, ["-e", "console.log(require('./src/config/paths').uploadsRoot)"], { cwd: path.join(__dirname, ".."), env: { ...process.env, DATA_DIR: dir, UPLOADS_DIR: "" } }).toString().trim();
  assert.equal(out, path.join(dir, "uploads"));
  assert.ok(fs.existsSync(path.join(dir, "uploads", "thumbnails")));
  const explicit = execFileSync(process.execPath, ["-e", "console.log(require('./src/config/paths').uploadsRoot)"], { cwd: path.join(__dirname, ".."), env: { ...process.env, DATA_DIR: dir, UPLOADS_DIR: path.join(dir, "ailleurs") } }).toString().trim();
  assert.equal(explicit, path.join(dir, "ailleurs"), "UPLOADS_DIR reste prioritaire");
});

test("récupération : fichiers des anciennes versions recopiés, rien d'écrasé, rien de supprimé", async () => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), "kolakisa-versions-"));
  const versions = path.join(base, "hbuilds", "versions");
  const put = (file, content) => { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, content); };
  put(path.join(versions, "ancienne-1", "nodejs", "uploads", "thumbnails", "photo-a.png"), "A");
  put(path.join(versions, "ancienne-2", "nodejs", "uploads", "thumbnails", "photo-b.png"), "B");
  put(path.join(versions, "ancienne-2", "nodejs", "uploads", "blog", "son.mp3"), "S");
  const projectRoot = path.join(versions, "actuelle", "nodejs");
  fs.mkdirSync(projectRoot, { recursive: true });
  const kept = path.join(base, "koyekola-data", "uploads");
  put(path.join(kept, "thumbnails", "photo-b.png"), "DÉJÀ LÀ");
  const r = await recoverUploads({ log: () => {}, uploadsRoot: kept, projectRoot, projectUploads: path.join(projectRoot, "uploads") });
  assert.equal(r.copied, 2);
  assert.equal(fs.readFileSync(path.join(kept, "thumbnails", "photo-a.png"), "utf8"), "A");
  assert.equal(fs.readFileSync(path.join(kept, "thumbnails", "photo-b.png"), "utf8"), "DÉJÀ LÀ", "jamais écrasé");
  assert.equal(fs.readFileSync(path.join(kept, "blog", "son.mp3"), "utf8"), "S");
  assert.ok(fs.existsSync(path.join(versions, "ancienne-1", "nodejs", "uploads", "thumbnails", "photo-a.png")), "rien supprimé");
  const again = await recoverUploads({ log: () => {}, uploadsRoot: kept, projectRoot, projectUploads: path.join(projectRoot, "uploads") });
  assert.equal(again.copied, 0, "idempotent");
});
