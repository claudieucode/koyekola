// KOLAKISA CMS — palier 9 : parcours en vrai Chrome (liste, invitation, éditeur de rôle avec sélection, matrice responsive, suspension).
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor, newStudent } = require("./helpers");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : parcours navigateur non exécuté sur cette machine" : false;

describe("utilisateurs et rôles (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, db, errors;
  const U = "/marketing/site-web/utilisateurs";
  const open = async (width = 1280, client = boss) => {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    await context.addCookies([...client.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    const page = await context.newPage();
    page.on("pageerror", (e) => errors.push(`pageerror : ${e.message}`));
    page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errors.push(`console : ${m.text().slice(0, 200)}`); });
    return page;
  };
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db(); errors = [];
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
  });
  after(async () => { if (browser) await browser.close(); await srv.stop(); });

  test("rôle personnalisé créé dans l'interface : sélection par groupe, tout cocher / tout décocher, compteur, enregistrement réel", async () => {
    const page = await open();
    await page.goto(`${srv.base}${U}/roles/nouveau`);
    await page.fill("#ro-name", "Gestionnaire du blog");
    const total = await page.locator("[data-us-perm]").count();
    await page.click("[data-us-all='1']");
    assert.match(await page.locator("[data-us-count]").innerText(), new RegExp(`^${total - await page.locator("[data-us-perm]:disabled").count()}`));
    await page.click("[data-us-all='0']");
    assert.match(await page.locator("[data-us-count]").innerText(), /^0 permission/);
    const group = page.locator("[data-us-group]", { hasText: "Articles" });
    await group.locator("[data-us-group-all='1']").click();
    await page.locator("[data-us-group]", { hasText: "Médias" }).locator("input[value='media.read']").check();
    await page.click("form[data-us-roleform] button[type=submit]");
    await page.waitForSelector("text=créé");
    const role = db.prepare("SELECT * FROM mk_roles WHERE name = 'Gestionnaire du blog'").get();
    const perms = JSON.parse(role.permissions);
    assert.ok(perms.includes("articles.publish") && perms.includes("articles.delete") && perms.includes("media.read"));
    assert.ok(!perms.includes("users.view") && !perms.includes("settings.write"));
    await page.reload();
    assert.equal(await page.locator("input[value='articles.publish']").isChecked(), true, "persistance");
  });

  test("inviter depuis l'interface : l'invitation apparaît, le lien est transmis, l'acceptation crée le compte avec le bon rôle", async () => {
    const page = await open();
    await page.goto(`${srv.base}${U}/ajouter`);
    await page.fill("#iv-email", "invitee@exemple.test");
    await page.selectOption("#iv-role", { label: "Éditeur" });
    await page.click("form.mk-us-form button[type=submit]");
    await page.waitForSelector("text=Invitation créée");
    const detail = await page.locator(".mk-flash").innerText();
    await page.locator(".mk-flash summary").click().catch(() => {});
    const body = await page.locator(".mk-flash").innerText();
    const link = (body.match(/\/invitation\/[A-Za-z0-9_-]+/) || [detail.match(/\/invitation\/[A-Za-z0-9_-]+/) || []][0] || [])[0];
    assert.ok(link, "lien d'invitation affiché à l'inviteur");
    assert.match(await page.locator("body").innerText(), /invitee@exemple\.test/);
    const guest = await browser.newPage();
    await guest.goto(`${srv.base}${link}`);
    await guest.fill("#inv-user", "invitee");
    await guest.fill("#inv-pass", "MotDePasseSolide123");
    await guest.click("form[action^='/invitation'] button[type=submit]");
    await guest.waitForURL(/marketing/);
    const u = db.prepare("SELECT id FROM users WHERE username = 'invitee'").get();
    assert.equal(db.prepare("SELECT role FROM mk_org_members WHERE user_id = ?").get(u.id).role, "editor");
    await guest.close();
  });

  test("suspendre depuis la fiche : la personne est déconnectée à sa prochaine page", async () => {
    const victim = await newStudent(srv);
    const vid = db.prepare("SELECT id FROM users WHERE email = ?").get(victim.email).id;
    db.prepare("INSERT INTO mk_org_members (organization_id, user_id, role) VALUES ((SELECT id FROM mk_organizations), ?, 'editor')").run(vid);
    const theirs = await open(1280, victim);
    await theirs.goto(`${srv.base}/marketing/site-web/articles`);
    assert.match(await theirs.locator("h1").first().innerText(), /Articles/);
    const admin = await open();
    await admin.goto(`${srv.base}${U}/${vid}`);
    await admin.click("text=Suspendre");
    await admin.click(".mk-dialog [data-mk-confirm-ok], dialog button:has-text('Suspendre')");
    await admin.waitForSelector("text=Compte suspendu");
    const res = await theirs.goto(`${srv.base}/marketing/site-web/articles`);
    assert.ok(res.status() === 200 || res.status() === 302);
    assert.match(theirs.url(), /connexion/, "renvoyé vers la connexion");
    assert.equal(await theirs.locator("h1:has-text('Articles')").count(), 0);
  });

  test("responsive : liste, rôles et matrice sans défilement horizontal de la page à 375 px (la matrice défile dans son cadre)", async () => {
    for (const width of [1280, 820, 375]) {
      const page = await open(width);
      for (const path of ["", "/roles", "/permissions?role=editor", "/roles/custom-gestionnaire-du-blog", "/invitations"]) {
        await page.goto(`${srv.base}${U}${path}`);
        assert.ok((await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)) <= 1, `${width}px ${path}`);
      }
    }
    assert.deepEqual(errors, []);
  });

  test("accessibilité : la matrice a une légende, des en-têtes de colonne et de ligne, et un équivalent texte pour chaque case", async () => {
    const page = await open();
    await page.goto(`${srv.base}${U}/permissions?role=viewer`);
    assert.ok((await page.locator("caption").innerText()).includes("Lecteur"));
    assert.ok((await page.locator("thead th[scope=col]").count()) >= 5);
    assert.ok((await page.locator("tbody th[scope=row]").count()) >= 5);
    assert.ok((await page.locator("tbody td .sr-only").count()) >= 20);
    await page.keyboard.press("Tab");
    assert.ok(await page.evaluate(() => document.activeElement && document.activeElement !== document.body));
  });
});
