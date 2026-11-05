// Refonte à 360 thèmes : un site qui avait installé ou activé un ANCIEN thème (retiré du catalogue) n'est jamais cassé.
// Chaque site garde l'instantané du manifeste ; ses jetons restent ceux qui étaient appliqués ; il peut activer un nouveau thème puis revenir à l'ancien.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "kola-themes-mig-"));
process.env.DATA_DIR = TMP; process.env.NODE_ENV = "test";
const db = require("../src/config/database");
const { migrate } = require("../src/marketing/db/migrate");
const { MIGRATIONS, quiet } = require("./marketing-helpers");
const themes = require("../src/services/themes");
const catalog = require("../src/marketing/themes/catalog");
const crypto = require("node:crypto");

const OLD = {
  key: "ocean", name: "Océan", version: "1.0.0", author: "Équipe Kolakisa", api: 1,
  description: "Bleus profonds et fond glacé : sobre, lumineux, adapté aux sites de formation.",
  tokens: { colors: { primary: "#0b6e99", secondary: "#073b4c", accent: "#06b6a4", background: "#eff9fd", surface: "#ffffff", text: "#0c2230", muted: "#4d6675" } },
};
let siteId, other; const ctx = () => ({ db, organizationId: 1, userId: 1, can: () => true });
const tokensOf = (id) => JSON.parse(db.prepare("SELECT tokens FROM mk_sites WHERE id = ?").get(id).tokens);

before(() => {
  migrate(db, { dir: MIGRATIONS, dbPath: ":memory:", log: quiet });
  db.exec("INSERT INTO mk_organizations (name, slug) VALUES ('Org', 'org')");
  const mk = (n, tk) => Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (1, ?, ?, ?)").run(n, n.toLowerCase(), JSON.stringify(tk)).lastInsertRowid);
  siteId = mk("Ancien", OLD.tokens); other = mk("Autre", {});
  const m = JSON.stringify(OLD);
  db.prepare("INSERT INTO cms_themes (site_id, theme_key, name, version, source, manifest, checksum, active, previous_key, previous_tokens) VALUES (?, 'ocean', 'Océan', '1.0.0', 'catalogue', ?, ?, 1, '', '{}')").run(siteId, m, crypto.createHash("sha256").update(m).digest("hex"));
});
after(() => { try { db.close(); } catch { /* déjà fermée */ } fs.rmSync(TMP, { recursive: true, force: true }); });

describe("sites ayant un ancien thème", () => {
  test("l'ancien thème n'est plus au catalogue mais reste installé et actif sur son site, avec les mêmes jetons", () => {
    assert.equal(catalog.fromCatalog("ocean"), null);
    const list = themes.installed(siteId);
    const o = list.find((t) => t.key === "ocean");
    assert.ok(o && o.state === "active" && o.compatible, "Océan reste affiché et actif");
    assert.equal(themes.activeKey(siteId), "ocean");
    assert.equal(themes.get(siteId, "ocean").name, "Océan");
    assert.equal(tokensOf(siteId).colors.primary, "#0b6e99");
    assert.equal(themes.installed(other).some((t) => t.key === "ocean"), false, "aucun effet sur un autre site");
  });
  test("la galerie de thèmes et la liste des disponibles fonctionnent pour ce site", () => {
    const g = themes.gallery(siteId, { perPage: 24 });
    assert.ok(g && g.total >= 6, `galerie : ${g && g.total}`);
    assert.ok(themes.available(siteId).length >= 6);
  });
  test("on peut installer et activer un nouveau thème, puis revenir à l'ancien sans rien perdre", () => {
    const key = catalog.catalog()[0].key;
    themes.installFromCatalog(ctx(), siteId, key); themes.activate(ctx(), siteId, key);
    assert.equal(themes.activeKey(siteId), key);
    assert.notEqual(tokensOf(siteId).colors.primary, "#0b6e99");
    themes.revert(ctx(), siteId);
    assert.equal(themes.activeKey(siteId), "ocean");
    assert.equal(tokensOf(siteId).colors.primary, "#0b6e99");
  });
});
