// La documentation Mailchimp est GÉNÉRÉE depuis le catalogue du code : ce test vérifie qu'elle est à jour, complète, sans reste de travail, et que les variables d'environnement documentées existent.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { generate, OUT } = require("../scripts/mailchimp-doc");
const { OPS } = require("../src/marketing/mailchimp/catalog");
const tx = require("../src/marketing/mailchimp/transactional");

const ROOT = path.join(__dirname, "..");
describe("documentation Mailchimp", () => {
  test("docs/mailchimp/MAILCHIMP_DOC.md est à jour (relancer « node scripts/mailchimp-doc.js » sinon)", () => {
    assert.equal(fs.readFileSync(OUT, "utf8"), generate());
  });
  test("chaque opération Marketing et Transactional y figure avec endpoint, priorité, paramètres et cas d'usage", () => {
    const doc = fs.readFileSync(OUT, "utf8");
    for (const op of OPS) {
      assert.ok(doc.includes(`#### \`${op.id}\``), op.id);
      assert.ok(doc.includes(`\`${op.method} /3.0${op.mc}\``), op.id);
    }
    for (const id of Object.keys(tx.OPS)) assert.ok(doc.includes(`#### \`${id}\``), id);
    assert.equal((doc.match(/\*\*Priorité d'intégration\*\* : (CRITIQUE|IMPORTANT|OPTIONNEL)/g) || []).length, OPS.length + Object.keys(tx.OPS).length);
  });
  test("aucun « TODO », « FIXME » ni « à compléter » dans les documents et le code de l'intégration", () => {
    const files = [...fs.readdirSync(path.join(ROOT, "docs", "mailchimp")).map((f) => path.join(ROOT, "docs", "mailchimp", f)), ...fs.readdirSync(path.join(ROOT, "src", "marketing", "mailchimp")).map((f) => path.join(ROOT, "src", "marketing", "mailchimp", f)),
      path.join(ROOT, "src", "marketing", "web", "mailchimp.js"), ...["mailchimp.js", "mailchimp-a.js", "mailchimp-b.js", "mailchimp-c.js"].map((f) => path.join(ROOT, "public", "js", f))];
    for (const f of files) assert.doesNotMatch(fs.readFileSync(f, "utf8"), /\bTODO\b|\bFIXME\b|à compléter|lorem ipsum/i, path.relative(ROOT, f));
  });
  test("les variables d'environnement du document ENV_EXAMPLE.md et de .env.example sont celles que le code lit", () => {
    const code = ["connection.js", "client.js", "scheduler.js", "transactional.js"].map((f) => fs.readFileSync(path.join(ROOT, "src", "marketing", "mailchimp", f), "utf8")).join("\n") + fs.readFileSync(path.join(ROOT, "src", "marketing", "web", "webhooks.js"), "utf8");
    const envDoc = fs.readFileSync(path.join(ROOT, "docs", "mailchimp", "ENV_EXAMPLE.md"), "utf8");
    for (const v of ["MAILCHIMP_API_BASE", "MANDRILL_API_BASE", "MAILCHIMP_SYNC_INTERVAL_MS", "SITE_URL", "ENCRYPTION_KEY"]) {
      assert.ok(envDoc.includes(v), `${v} documentée`);
      assert.ok(code.includes(v) || v === "ENCRYPTION_KEY", `${v} lue par le code`);
    }
    assert.match(fs.readFileSync(path.join(ROOT, ".env.example"), "utf8"), /MAILCHIMP_SYNC_INTERVAL_MS/);
  });
});
