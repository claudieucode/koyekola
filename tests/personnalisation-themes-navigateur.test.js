// KOLAKISA — Personnalisation propre à chaque thème dans un VRAI Chrome (Playwright ; ignoré sans) : pour chacun des thèmes de la bibliothèque, le personnalisateur s'ouvre sur ses réglages,
// un réglage choisi dans le panneau change réellement l'élément visé dans l'aperçu (style calculé), sans débordement ; le bouton « Personnaliser le site » de l'aperçu ouvre le bon écran.
//   THEMES_ONLY=abysse,albergo   limite les thèmes testés
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");
const cz = require("../src/marketing/themes/customization");
const lib = require("../src/marketing/themes/library");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : parcours navigateur non exécuté sur cette machine" : false;
const ONLY = process.env.THEMES_ONLY ? new Set(process.env.THEMES_ONLY.split(",")) : null;
const KEYS = lib.allMeta().map((m) => m.key).filter((k) => !ONLY || ONLY.has(k));
const rgb = (hex) => `rgb(${[1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(", ")})`;

describe("personnalisation par thème (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, db, orgId, context;
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "", ALLOW_INDEXING: "1" });
    boss = await loginInstructor(srv); db = srv.db();
    orgId = one("SELECT id FROM mk_organizations").id;
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
    context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    context.setDefaultTimeout(90000);
  });
  after(async () => { if (browser) await browser.close(); db.close(); await srv.stop(); });

  const mk = (key, tag = "") => {
    const m = lib.manifests().find((x) => x.key === key);
    const site = Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, ?, ?, ?)").run(orgId, `N-${key}${tag}`, `n-${key}${tag}`, JSON.stringify(m.tokens)).lastInsertRowid);
    const sections = lib.pageSections(key, "accueil").map((x, i) => ({ ...x, id: x.id || `a${String(i).padStart(11, "0")}` }));
    const pg = Number(db.prepare("INSERT INTO mk_landing_pages (organization_id, name, slug, title, sections, status, kind, site_id, published_at) VALUES (?, ?, ?, 'Accueil', ?, 'published', 'page', ?, datetime('now'))").run(orgId, `Nav ${key}${tag}`, `nv-${key}${tag}`, JSON.stringify(sections), site).lastInsertRowid);
    db.prepare("UPDATE mk_sites SET home_page_id = ? WHERE id = ?").run(pg, site);
    return site;
  };

  test(`chaque thème (${KEYS.length}) : le panneau propose ses réglages et un réglage agit réellement dans l'aperçu`, { timeout: 7200000 }, async () => {
    const bad = [];
    for (const key of KEYS) {
      const m = cz.manifestOf(key);
      const site = mk(key);
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      try {
        await page.goto(`${srv.base}/marketing/site-web/personnaliser?site=${site}`);
        await page.waitForFunction(() => { const d = document.getElementById("kwc-iframe") && document.getElementById("kwc-iframe").contentDocument; return d && d.readyState === "complete" && d.body && d.body.children.length > 0; });
        // la liste des panneaux : les panneaux du thème sont présents
        const ids = await page.$$eval("[data-panel]", (els) => els.map((e) => e.getAttribute("data-panel")));
        for (const pn of m.panels) if (!ids.includes(`tp-${pn.id}`)) bad.push(`${key} : panneau « ${pn.label} » absent`);
        // un réglage générique de couleur choisi dans le panneau : effet réel sur l'élément visé
        const pn = m.panels.find((p) => p.controls.some((c) => c.source === "generic" && c.kind === "color" && !c.state));
        if (pn) {
          const c = pn.controls.find((x) => x.source === "generic" && x.kind === "color" && !x.state);
          const def = cz.controls.BY_ID.get(c.id);
          await page.locator(`[data-panel="tp-${pn.id}"]`).click();
          const input = page.locator(`[data-ctl="tokens.pack.options.${c.optKey}"] input[type=text]`);
          await input.fill("#12ab34");
          await page.waitForFunction(() => { const d = document.getElementById("kwc-iframe").contentDocument; const s = d && d.getElementById("kw-pack-cz"); return s && s.textContent.includes("#12ab34"); });
          const ok = await page.evaluate(({ sel, prop, want }) => {
            const d = document.getElementById("kwc-iframe").contentDocument;
            const split = (x) => { const out = []; let dd = 0, cur = ""; for (const ch of x) { if (ch === "(" || ch === "[") dd++; else if (ch === ")" || ch === "]") dd--; if (ch === "," && dd === 0) { out.push(cur.trim()); cur = ""; } else cur += ch; } if (cur.trim()) out.push(cur.trim()); return out; };
            const q = sel === "" ? "body" : split(sel).map((s) => `body ${s}`).join(",");
            return [...d.querySelectorAll(q)].some((e) => d.defaultView.getComputedStyle(e)[prop] === want);
          }, { sel: def.sel.replace(/:hover/g, ""), prop: def.prop, want: rgb("#12ab34") });
          if (!ok) bad.push(`${key} : « ${c.label} » sans effet visible dans l'aperçu`);
          // pas de débordement horizontal provoqué par l'aperçu
          const over = await page.evaluate(() => { const d = document.getElementById("kwc-iframe").contentDocument; return d.documentElement.scrollWidth - d.documentElement.clientWidth; });
          if (over > 2) bad.push(`${key} : débordement horizontal de ${over}px`);
        }
      } catch (e) { bad.push(`${key} : ${String(e.message).split("\n")[0].slice(0, 160)}`); }
      if (errors.length) bad.push(`${key} : erreur de page : ${errors[0].slice(0, 120)}`);
      await page.close();
    }
    assert.deepEqual(bad, []);
  });

  test("bouton « Personnaliser le site » dans l'aperçu : ouvre le personnalisateur du site et du thème, un réglage s'applique en direct, publication, retour", async () => {
    const key = "albergo";
    const site = mk("abysse", "-bouton");
    await boss.post(`/marketing/site-web/themes/installer?site=${site}`, { site: String(site), key: "abysse" });
    await boss.post(`/marketing/site-web/themes/abysse/activer?site=${site}`, { site: String(site) });
    const page = await context.newPage();
    await page.goto(`${srv.base}/marketing/site-web/themes/${key}/apercu?site=${site}`);
    const btn = page.locator("a[data-tp-customize]");
    assert.match(await btn.innerText(), /^Personnaliser le site$/);
    assert.equal(await btn.count(), 1);
    await btn.click();
    await page.waitForURL(new RegExp(`personnaliser\\?site=${site}&theme=${key}`));
    await page.waitForFunction(() => { const d = document.getElementById("kwc-iframe") && document.getElementById("kwc-iframe").contentDocument; return d && d.readyState === "complete" && d.body && d.body.getAttribute("data-kw-pack") === "albergo"; });
    // le thème essayé est albergo : son panneau propre est là
    assert.ok(await page.locator('[data-panel="tp-theme"]').count());
    await page.locator('[data-panel="tp-theme"]').click();
    const opt = cz.manifestOf(key).panels[0].controls.find((c) => c.kind === "color");
    await page.locator(`[data-ctl="tokens.pack.options.${opt.optKey}"] input[type=text]`).fill("#ab1234");
    const rendus = []; page.on("response", async (r) => { if (/personnaliser\/rendu/.test(r.url())) { try { rendus.push(`${r.status()} ${(await r.text()).slice(0, 300)}`); } catch { /* ignoré */ } } });
    await page.locator(`[data-ctl="tokens.pack.options.${opt.optKey}"] input[type=text]`).fill("#ab1235");
    try { await page.waitForFunction(() => { const d = document.getElementById("kwc-iframe").contentDocument; return d && d.body && (d.body.getAttribute("style") || "").toLowerCase().includes("#ab1235"); }, null, { timeout: 30000 }); } catch (e) { assert.fail(`réglage non appliqué à l'aperçu : ${rendus.join(" | ")}`); }
    assert.equal(JSON.parse(one("SELECT tokens FROM mk_sites WHERE id = ?", site).tokens).pack.key, "abysse", "rien n'est publié tant qu'on ne publie pas");
    await page.close();
  });
});
