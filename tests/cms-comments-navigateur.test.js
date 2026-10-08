// KOLAKISA CMS — palier 6 : parcours en vrai Chrome (commentaire invité, réponse, modération, actions groupées, mobile).
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : parcours navigateur non exécuté sur cette machine" : false;

describe("commentaires (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, db, errors;
  const open = async (width = 1280, cookies = false) => {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    if (cookies) await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    const page = await context.newPage();
    page.on("pageerror", (e) => errors.push(`pageerror : ${e.message}`));
    page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errors.push(`console : ${m.text().slice(0, 200)}`); });
    return page;
  };
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db(); errors = [];
    db.prepare("INSERT INTO posts (slug, title, content, content_format, status, published, published_at, comments_enabled) VALUES ('nav', 'Article nav', '<p>x</p>', 'html', 'published', 1, datetime('now'), 1)").run();
    await boss.post("/marketing/site-web/parametres/commentaires", { enabled_default: "1", guests_allowed: "1", moderation: "all", replies_allowed: "1", max_depth: "3", links_allowed: "1" });
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
  });
  after(async () => { if (browser) await browser.close(); await srv.stop(); });

  test("visiteur : écrit un commentaire (après 2 s), reçoit le message d'attente ; l'admin l'approuve ; il devient public", async () => {
    const page = await open();
    await page.goto(`${srv.base}/blog/nav`);
    await page.fill("#comment-name", "Léa");
    await page.fill("#comment-email", "lea@example.com");
    await page.fill("#comment-body", "Bravo pour cet article !");
    await page.waitForTimeout(2300);
    await page.click(".comment-form button[type=submit]");
    await page.waitForSelector(".comment-notice");
    assert.match(await page.locator(".comment-notice").innerText(), /en attente de modération/);
    assert.equal(await page.locator(".comment").count(), 0);
    const admin = await open(1280, true);
    await admin.goto(`${srv.base}/marketing/site-web/commentaires/en-attente`);
    assert.match(await admin.locator("body").innerText(), /Bravo pour cet article/);
    await admin.locator("tr", { hasText: "Bravo pour cet article" }).getByRole("button", { name: "Approuver" }).click();
    await admin.waitForSelector("text=approuvé");
    await page.reload();
    await page.waitForSelector(".comment");
    assert.match(await page.locator(".comment-body").first().innerText(), /Bravo pour cet article/);
    assert.doesNotMatch(await page.content(), /lea@example\.com/);
  });

  test("réponse : le bouton ouvre le formulaire préparé, la réponse (modération) puis l'approbation en lot affichent le fil", async () => {
    await boss.post("/marketing/site-web/parametres/commentaires", { enabled_default: "1", guests_allowed: "1", moderation: "none", replies_allowed: "1", max_depth: "3", links_allowed: "1" });
    await new Promise((r) => setTimeout(r, 5500)); // limite de débit des invités : un envoi toutes les 5 secondes par adresse
    const page = await open();
    await page.goto(`${srv.base}/blog/nav`);
    await page.getByRole("link", { name: /Répondre à Léa/ }).click();
    await page.waitForSelector(".comment-replying");
    await page.fill("#comment-name", "Marc");
    await page.fill("#comment-email", "marc@example.com");
    await page.fill("#comment-body", "Je suis d'accord avec Léa.");
    await page.waitForTimeout(2300);
    await page.click(".comment-form button[type=submit]");
    await page.waitForSelector(".comment-replies .comment");
    assert.match(await page.locator(".comment-replies").innerText(), /d'accord avec Léa/);
    assert.equal(db.prepare("SELECT COUNT(*) n FROM blog_comments WHERE parent_id IS NOT NULL").get().n, 1);
  });

  test("administration : sélection multiple et action groupée réellement exécutée ; aucune erreur JavaScript", async () => {
    const ins = db.prepare("INSERT INTO blog_comments (post_id, content_type, content_id, author_name, body, status) VALUES (1, 'post', 1, 'Lot', ?, 'pending')");
    ins.run("Lot A"); ins.run("Lot B");
    const admin = await open(1280, true);
    await admin.goto(`${srv.base}/marketing/site-web/commentaires/en-attente`);
    await admin.locator("[data-cms-select-all]").check();
    await admin.selectOption("#cm-bulk-action", "indesirable");
    await admin.locator("#cm-bulk button[type=submit]").click();
    await admin.waitForSelector("text=marqué");
    assert.equal(db.prepare("SELECT COUNT(*) n FROM blog_comments WHERE status = 'spam'").get().n, 2);
    assert.deepEqual(errors, []);
  });

  test("mobile (375 px) : commentaires et formulaire sans défilement horizontal, administration aussi", async () => {
    const page = await open(375);
    await page.goto(`${srv.base}/blog/nav`);
    assert.ok((await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)) <= 1, "page article");
    const admin = await open(375, true);
    await admin.goto(`${srv.base}/marketing/site-web/commentaires`);
    assert.ok((await admin.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)) <= 1, "administration");
  });
});
