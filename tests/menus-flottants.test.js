// Menus « ⋮ » et déroulants : un seul calque flottant pour tout le site (public/js/floating.js), chargé partout où un
// menu existe, utilisé par chaque système de menus ; échelle de superposition unique (aucune valeur arbitraire).
// Le comportement réel (géométrie, placement, interactions) est vérifié dans un navigateur (protocole dd1.js).
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { startServer, loginInstructor } = require("./helpers");
const { TEST_KEY } = require("./marketing-helpers");

const ROOT = path.join(__dirname, "..");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");

describe("calque flottant commun", () => {
  test("chaque système de menus passe par kbFloat (ouverture et fermeture)", () => {
    for (const f of ["public/js/mk/shell.js", "public/js/dashboard.js", "public/js/marketing-editor.js", "src/editor/blog-editor.js", "src/editor/automation/ui.js", "public/js/blog-editor.js", "public/js/automation-flow.js"]) {
      const src = read(f);
      assert.match(src, /kbFloat\??\.open\(/, `${f} : ouverture`);
      assert.match(src, /kbFloat\??\.close\(/, `${f} : fermeture`);
    }
  });
  test("le moteur : position fixe, bascule au-dessus, maintien dans l'écran, suivi du défilement et du redimensionnement, un seul ouvert", () => {
    const src = read("public/js/floating.js");
    for (const re of [/"bottom" : "top"/, /Math\.max\(MARGIN, Math\.min\(left/, /addEventListener\("scroll", schedule, true\)/, /addEventListener\("resize", schedule\)/, /close\(current\.panel, \{ reason: "other" \}\)/, /pagehide/, /trapsFixed/]) assert.match(src, re);
    assert.match(read("public/css/style.css"), /\.kb-floating \{ position: fixed !important;[^}]*z-index: var\(--z-dropdown\)/);
  });
  test("échelle de superposition : aucun z-index arbitraire (≥ 500) dans les feuilles du site ; menus sur --z-dropdown", () => {
    for (const f of ["public/css/style.css", "public/css/marketing.css", "public/css/dashboard.css", "public/css/app-rail.css", "public/css/seo-workspace.css"]) {
      const big = [...read(f).matchAll(/z-index:\s*(\d+)/g)].map((m) => Number(m[1])).filter((n) => n >= 500);
      assert.deepEqual(big, [], f);
    }
    assert.match(read("public/css/marketing.css"), /\.mk-menu \{[^}]*z-index: var\(--z-dropdown\)/);
    assert.match(read("public/css/dashboard.css"), /\.dmenu-list \{[^}]*z-index: var\(--z-dropdown\)/);
  });
});

describe("pages : le moteur est chargé avant les scripts qui l'utilisent", () => {
  let srv, boss;
  before(async () => { srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SMTP_HOST: "" }); boss = await loginInstructor(srv); });
  after(() => srv && srv.stop());
  const order = (html, a, b) => { const i = html.indexOf(a), j = html.indexOf(b); return i !== -1 && j !== -1 && i < j; };
  test("Marketing, Mon espace / SEO, éditeur du blog", async () => {
    await boss.post("/marketing/modeles", { name: "M", starter: "blank", kind: "marketing" });
    assert.ok(order((await boss.get("/marketing/modeles")).text, "/js/floating.js", "/js/mk/shell.js"), "Marketing");
    assert.ok(order((await boss.get("/formateur/seo/redirections")).text, "/js/floating.js", "/js/dashboard.js"), "SEO");
    assert.ok(order((await boss.get("/formateur")).text, "/js/floating.js", "/js/dashboard.js"), "Mon espace");
    assert.ok(order((await boss.get("/formateur/blog/nouveau")).text, "/js/floating.js", "/js/blog-editor.js"), "éditeur du blog");
    assert.equal((await boss.get("/js/floating.js")).status, 200);
  });
});
