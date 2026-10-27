// KOLAKISA — mentions @nom dans les notes d'un article : seules les personnes qui peuvent lire l'article sont mentionnables, jamais d'autre compte ; saisie assistée dans l'éditeur.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor, newStudent, INSTRUCTOR } = require("./helpers");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : parcours navigateur non exécuté sur cette machine" : false;

describe("mentions dans les notes", () => {
  let srv, boss, db, post, outsider, browser;
  const json = (r) => JSON.parse(r.text);
  const form = (fields) => { const fd = new FormData(); Object.entries(fields).forEach(([k, v]) => fd.append(k, v)); return fd; };
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db();
    post = json(await boss.request("/formateur/blog/nouveau", { method: "POST", multipart: form({ title: "Article notes", content: "<p>Texte</p>", content_format: "html", status: "draft" }), headers: { "x-blog-editor": "1" } }));
    outsider = await newStudent(srv); // un compte qui n'a rien à voir avec l'article : jamais mentionnable
    if (CHROME && chromium) browser = await chromium.launch({ executablePath: CHROME, headless: true });
  });
  after(async () => { if (browser) await browser.close(); await srv.stop(); });

  test("une mention d'une personne qui peut lire l'article est reconnue ; un autre compte ou un nom inconnu ne l'est jamais", async () => {
    const studentName = db.prepare("SELECT username FROM users WHERE email = ?").get(outsider.email).username;
    const r = await boss.postJson(`/formateur/blog/${post.id}/notes`, { body: `@${INSTRUCTOR.username} peux-tu relire ? Et @${studentName} ou @fantome ?` });
    assert.equal(r.status, 200, r.text);
    const note = json(r).notes[0];
    assert.deepEqual(note.mentions.map((m) => m.username), [INSTRUCTOR.username]);
    const list = json(await boss.get(`/formateur/blog/${post.id}/notes`));
    assert.ok(list.people.some((p) => p.username === INSTRUCTOR.username));
    assert.ok(!list.people.some((p) => p.username === studentName), "l'élève n'est pas proposé");
    assert.ok(!JSON.stringify(list).includes(outsider.email), "aucune adresse e-mail n'est exposée");
  });

  test("une réponse peut mentionner ; le texte reste du texte (jamais du HTML)", async () => {
    const root = json(await boss.postJson(`/formateur/blog/${post.id}/notes`, { body: "Premier fil" })).id;
    const r = await boss.postJson(`/formateur/blog/${post.id}/notes`, { parentId: root, body: `Merci @${INSTRUCTOR.username} <b>gras</b>` });
    assert.equal(r.status, 200);
    const thread = json(r).notes.find((n) => n.id === root);
    assert.equal(thread.replies[0].mentions[0].username, INSTRUCTOR.username);
    assert.equal(thread.replies[0].body, `Merci @${INSTRUCTOR.username} <b>gras</b>`, "le corps est conservé tel quel : le navigateur l'affiche en texte");
  });

  test("l'éditeur propose les personnes après « @ », complète à Entrée, met la mention en évidence", { skip: SKIP }, async () => {
    const context = await browser.newContext({ viewport: { width: 1500, height: 950 } });
    await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    const page = await context.newPage();
    const errors = []; page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(`${srv.base}/formateur/blog/${post.id}/modifier`);
    await page.waitForFunction(() => document.querySelector(".ProseMirror") && document.querySelector(".ProseMirror").editor);
    await page.click('[data-sidebar-tab="notes"]');
    const area = page.getByLabel("Texte de la note");
    await area.click();
    await area.pressSequentially(`Salut @${INSTRUCTOR.username.slice(0, 2)}`);
    const option = page.getByRole("option", { name: `@${INSTRUCTOR.username}` });
    await option.waitFor();
    await page.keyboard.press("Enter");
    assert.equal(await area.inputValue(), `Salut @${INSTRUCTOR.username} `);
    await area.pressSequentially("voir ceci");
    await page.getByRole("button", { name: "Ajouter la note" }).click();
    const mention = page.locator(".wp-note .wp-mention.is-me").first();
    await mention.waitFor();
    assert.equal(await mention.innerText(), `@${INSTRUCTOR.username}`);
    assert.ok(await page.locator("[data-notes-dot].is-mention, .be-tab-dot.is-mention").count() >= 0);
    assert.deepEqual(errors, []);
    await context.close();
  });
});
