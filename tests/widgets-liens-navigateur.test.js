// Liens des widgets sur la page publiée : chaque lien produit par un widget (bouton, lien, appel à l'action, menu, réseaux sociaux, offre tarifaire…)
// doit mener quelque part de réel. Les adresses internes sont suivies (le suivi de clic « /p/<page>/clic/<n> » redirige vers la cible), les adresses
// externes doivent être en https et, si elles s'ouvrent dans un nouvel onglet, protégées par noopener. Aucun lien ne doit rester vide ou mort.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");
const { creatable, idOf, build } = require("./widgets-helpers");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : parcours navigateur non exécuté sur cette machine" : false;
// Widgets dont le rôle principal est un lien (le test exige au moins un lien vérifié pour chacun)
const LINK_WIDGETS = ["button", "link", "cta", "menu", "social", "linkinbio", "pricing", "floatingbutton", "breadcrumb", "sharebuttons", "slides"]; // (boîtes image / icône et boîte retournable ne portent un lien qu'une fois configurées)

describe("liens des widgets sur la page publiée", { skip: SKIP }, () => {
  let srv, browser, links, usable = [];
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    const boss = await loginInstructor(srv); const db = srv.db();
    const put = (id, content) => boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", json: { revision: db.prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(id).revision, content }, headers: { Origin: srv.base } });
    for (const t of creatable) {
      const id = Number((await boss.post("/marketing/pages", { name: "Liens " + t })).location.match(/(\d+)$/)[1]);
      assert.equal((await put(id, build([t], false))).status, 200);
      if ((await boss.postJson(`/marketing/pages/${id}/publier.json`, {})).status === 200) usable.push(t);
    }
    const id = Number((await boss.post("/marketing/pages", { name: "Liens tout" })).location.match(/(\d+)$/)[1]);
    assert.equal((await put(id, build(usable, false))).status, 200);
    assert.equal((await boss.postJson(`/marketing/pages/${id}/publier.json`, {})).status, 200);
    const slug = db.prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(id).slug;
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
    const page = await (await browser.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
    await page.goto(`${srv.base}/p/${slug}`, { waitUntil: "load" });
    await page.waitForTimeout(600);
    links = await page.evaluate(() => [...document.querySelectorAll("a[href]")].map((a) => {
      const w = a.closest('[class*="kw-n-pub"]'); const m = w && /kw-n-pub(\d+)/.exec(w.className);
      return { idx: m ? Number(m[1]) : -1, href: a.getAttribute("href"), target: a.target, rel: a.rel, text: (a.textContent || a.getAttribute("aria-label") || "").trim().slice(0, 40) };
    }));
  });
  after(async () => { if (browser) await browser.close(); if (srv) await srv.stop(); });

  test("chaque widget « lien » produit au moins un lien, et aucun lien n'est vide ou dangereux", () => {
    const byType = {}; for (const l of links) if (l.idx >= 0) (byType[usable[l.idx]] = byType[usable[l.idx]] || []).push(l);
    const missing = LINK_WIDGETS.filter((t) => usable.includes(t) && !(byType[t] || []).length);
    assert.deepEqual(missing, [], "widgets de lien sans aucun lien");
    for (const l of links) {
      assert.ok(l.href && l.href.trim() && l.href !== "#" || /skip|menu|consent|cookies/i.test(l.text) || l.idx < 0, `lien vide dans ${usable[l.idx]}`);
      assert.doesNotMatch(l.href, /^\s*(javascript|data|vbscript):/i, `lien dangereux dans ${usable[l.idx]} : ${l.href}`);
      if (l.target === "_blank") assert.match(l.rel, /noopener/, `lien « ${l.text} » de ${usable[l.idx]} ouvert dans un nouvel onglet sans noopener`);
    }
  });

  test("les liens internes et de suivi répondent (page, redirection de clic) ; les liens externes sont en https", async () => {
    const seen = new Set(); const problems = []; let checked = 0, external = 0;
    for (const l of links.filter((x) => x.idx >= 0)) {
      const type = usable[l.idx];
      if (/^https?:\/\//i.test(l.href)) { external++; if (!/^https:\/\//i.test(l.href) && !l.href.startsWith(srv.base)) problems.push(`${type} : lien externe non sécurisé ${l.href}`); continue; }
      if (!l.href.startsWith("/") || seen.has(l.href)) continue;
      seen.add(l.href);
      const r = await fetch(srv.base + l.href, { redirect: "manual", headers: { "User-Agent": "Mozilla/5.0 Chrome/120" } });
      checked++;
      if (![200, 301, 302, 303, 307, 308].includes(r.status)) problems.push(`${type} : ${l.href} → ${r.status}`);
      if ([301, 302, 303, 307, 308].includes(r.status)) { const loc = r.headers.get("location") || ""; if (!loc || /^\s*(javascript|data):/i.test(loc)) problems.push(`${type} : ${l.href} redirige vers « ${loc} »`); }
    }
    assert.deepEqual(problems, []);
    assert.ok(checked >= 10, `${checked} liens internes vérifiés (${external} externes)`);
    console.log(`# liens : ${checked} internes suivis, ${external} externes contrôlés`);
  });

  test("témoin : un lien « javascript: » serait détecté", () => {
    assert.throws(() => assert.doesNotMatch("javascript:alert(1)", /^\s*(javascript|data|vbscript):/i));
  });
});
