// Rôle système « Designer » : règle l'apparence sans publier ni gérer l'équipe. Aucune base : lecture du registre des rôles du code.
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const SCRATCH = fs.mkdtempSync(path.join(os.tmpdir(), "koyekola-designer-"));
process.env.DATA_DIR = path.join(SCRATCH, "data");
process.env.UPLOADS_DIR = path.join(SCRATCH, "uploads");
const { test, describe, after } = require("node:test");
const assert = require("node:assert/strict");
after(() => fs.rmSync(SCRATCH, { recursive: true, force: true }));

describe("rôle Designer", () => {
  const access = require("../src/services/cmsAccess");
  const role = access.SYSTEM_ROLES.find((r) => r.key === "designer");
  const has = (k) => role.permissions.includes(k);
  test("il règle l'apparence et ajoute des médias", () => {
    for (const k of ["appearance.styles", "appearance.parts", "appearance.templates", "appearance.patterns", "media.upload", "appearance.read", "revisions.restore"]) assert.ok(has(k), k);
  });
  test("il ne publie rien, ne supprime rien, ne gère ni l'équipe ni les réglages", () => {
    for (const k of ["appearance.publish", "pages.publish", "pages.delete", "members.manage", "users.view", "settings.read", "revisions.delete", "organization.delete"]) assert.ok(!has(k), k);
  });
  test("il se place entre l'auteur et l'éditeur et n'est pas un rôle personnalisé", () => {
    const author = access.SYSTEM_ROLES.find((r) => r.key === "author"), editor = access.SYSTEM_ROLES.find((r) => r.key === "editor");
    assert.ok(author.rank < role.rank && role.rank < editor.rank);
    assert.equal(access.getRole("designer").system, true);
  });
});
