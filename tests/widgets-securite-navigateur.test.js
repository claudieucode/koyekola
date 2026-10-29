// Sécurité des contenus de widgets : chaque champ texte de chaque widget reçoit, un par un, des charges hostiles (balise avec gestionnaire d'événement,
// script, adresse « javascript: »). Le serveur doit soit REFUSER la valeur (422 avec message), soit l'ACCEPTER en la neutralisant : dans un vrai Chrome,
// ni la page publiée ni l'aperçu de l'éditeur ne doivent exécuter quoi que ce soit, contenir d'attribut « on… », de lien « javascript: » ni de script issu du contenu.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");
const { creatable, OVER, EXTRA } = require("./widgets-helpers");
const nodes = require("../src/marketing/pages/nodes");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : parcours navigateur non exécuté sur cette machine" : false;

const PAYLOADS = ['<img src=x onerror="window.__xss=1">', '"><script>window.__xss=1</script>', "javascript:window.__xss=1", "'\" onmouseover=\"window.__xss=1"];
const leaves = (v, path = []) => (typeof v === "string" ? [path] : Array.isArray(v) ? v.flatMap((x, i) => leaves(x, [...path, i])) : v && typeof v === "object" ? Object.entries(v).flatMap(([k, x]) => leaves(x, [...path, k])) : []);
const setAt = (obj, path, val) => { const c = JSON.parse(JSON.stringify(obj)); let o = c; path.slice(0, -1).forEach((k) => { o = o[k]; }); o[path[path.length - 1]] = val; return c; };

describe("charges hostiles dans les contenus de widgets (Chrome réel)", { skip: SKIP }, () => {
  let srv, boss, db, browser;
  const accepted = []; // { type, path, payload, props }
  let refused = 0, tried = 0;
  const put = (id, content) => boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", json: { revision: db.prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(id).revision, content }, headers: { Origin: srv.base } });
  const doc = (list) => ({ sections: [{ id: "sect00000001", type: "layout", children: [{ id: "cont00000001", type: "container", children: list }] }] });
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" }); boss = await loginInstructor(srv); db = srv.db();
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
  });
  after(async () => { if (browser) await browser.close(); if (srv) await srv.stop(); });

  test("chaque champ texte de chaque widget : charge refusée avec un message, ou acceptée (puis neutralisée au rendu) ; jamais d'erreur serveur", { timeout: 900000 }, async () => {
    const id = Number((await boss.post("/marketing/pages", { name: "Sécurité" })).location.match(/(\d+)$/)[1]);
    for (const t of creatable.filter((x) => x !== "html")) {
      const b = nodes.PALETTE[t].blank();
      const base = { ...(b.props || {}), ...(OVER[t] || {}) };
      for (const path of leaves(base)) for (const payload of PAYLOADS) {
        const props = setAt(base, path, payload); tried++;
        const r = await put(id, doc([{ id: "hostile00001", type: t, props, ...(EXTRA[t] || {}), ...(b.children ? { children: b.children } : {}) }]));
        assert.ok([200, 422].includes(r.status), `${t}.${path.join(".")} : réponse ${r.status} (${r.text.slice(0, 120)})`);
        if (r.status === 422) { refused++; assert.match(r.text, /"message"/, `${t}.${path.join(".")} : refus sans message`); } else accepted.push({ type: t, path: path.join("."), payload, props });
      }
    }
    assert.ok(tried > 300, `${tried} essais`);
    assert.ok(accepted.length > 50, `${accepted.length} charges acceptées à vérifier au rendu`);
  });

  const inspect = async (html, label) => {
    const page = await browser.newPage();
    const dialogs = [];
    page.on("dialog", (d) => { dialogs.push(d.message()); d.dismiss().catch(() => {}); });
    await page.route("**/*", (route) => (/^(https?:)/.test(route.request().url()) && !route.request().url().startsWith(srv.base) ? route.abort() : route.continue()));
    await page.setContent(html, { waitUntil: "load" });
    await page.waitForTimeout(500);
    const r = await page.evaluate(() => ({
      xss: window.__xss === 1,
      onAttrs: [...document.querySelectorAll("*")].filter((e) => [...e.attributes].some((a) => /^on/i.test(a.name))).map((e) => e.tagName.toLowerCase() + "." + String(e.className).split(" ")[0]),
      jsLinks: [...document.querySelectorAll("[href],[src],[action],[formaction]")].filter((e) => ["href", "src", "action", "formaction"].some((k) => /^\s*javascript:/i.test(e.getAttribute(k) || ""))).map((e) => e.tagName.toLowerCase()),
      scripts: [...document.querySelectorAll("script")].filter((s) => /__xss/.test(s.textContent)).length,
    }));
    await page.close();
    assert.deepEqual({ ...r, dialogs: dialogs.length }, { xss: false, onAttrs: [], jsLinks: [], scripts: 0, dialogs: 0 }, `${label} : contenu hostile actif`);
  };

  for (const surface of ["page publiée", "aperçu de l'éditeur"]) {
    test(`les charges acceptées ne s'exécutent pas dans la ${surface}`, { timeout: 900000 }, async () => {
      let checked = 0;
      for (let i = 0; i < accepted.length; i += 60) {
        const chunk = accepted.slice(i, i + 60);
        const id = Number((await boss.post("/marketing/pages", { name: `Hostile ${surface} ${i}` })).location.match(/(\d+)$/)[1]);
        const content = doc(chunk.map((a, k) => { const b = nodes.PALETTE[a.type].blank(); return { id: `h${String(k).padStart(11, "0")}`, type: a.type, props: a.props, ...(EXTRA[a.type] || {}), ...(b.children ? { children: b.children } : {}) }; }));
        assert.equal((await put(id, content)).status, 200);
        let html;
        if (surface === "page publiée") {
          const p = await boss.postJson(`/marketing/pages/${id}/publier.json`, {});
          if (p.status !== 200) continue; // publication refusée avec un message : rien n'est exposé
          const slug = db.prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(id).slug;
          html = (await (await fetch(`${srv.base}/p/${slug}`, { headers: { "User-Agent": "Mozilla/5.0 Chrome/120" } })).text());
        } else {
          const p = await boss.request(`/marketing/pages/${id}/rendu`, { method: "POST", json: { content }, headers: { Origin: srv.base } });
          assert.equal(p.status, 200, p.text.slice(0, 200)); html = p.text;
        }
        checked += chunk.length;
        await inspect(html, `${surface}, lot ${i / 60 + 1} (${chunk.map((a) => a.type + "." + a.path).slice(0, 3).join(", ")}…)`);
      }
      assert.ok(checked >= accepted.length / 2, `${checked} charges sur ${accepted.length} réellement vérifiées dans un navigateur (le reste : publication refusée avec message)`);
      console.log(`# ${surface} : ${checked}/${accepted.length} charges vérifiées (${tried} essais, ${refused} refusées)`);
    });
  }

  test("témoin : un contenu réellement actif serait détecté par ce contrôle", async () => {
    await assert.rejects(() => inspect('<html><body><img src="x" onerror="window.__xss=1"><a href="javascript:void(0)">x</a></body></html>', "témoin"), /contenu hostile actif/);
  });
});
