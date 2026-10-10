// Éditeur — comportement des accordéons (moteur commun) : trois modes réglables depuis le menu, groupes indépendants, accordéons imbriqués,
// états conservés, persistance, clavier, responsive, pas de reconstruction de l'inspecteur ni du canevas. Chrome réel, vrai serveur.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : parcours navigateur non exécuté sur cette machine" : false;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
async function until(check, { timeout = 12000, every = 50, what = "condition" } = {}) {
  const end = Date.now() + timeout;
  for (;;) { let v = null; try { v = await check(); } catch { v = null; } if (v) return v; if (Date.now() > end) throw new Error(`Délai dépassé : ${what}`); await wait(every); }
}
const CONTENT = { sections: [{ id: "sect00000001", type: "layout", children: [{ id: "cont00000001", type: "container", children: [
  { id: "head00000001", type: "heading", props: { text: "Titre", level: 2 } },
] }] }] };

describe("accordéons : moteur commun, trois modes (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, context, page, pageId, errors;
  const db = () => srv.db();
  const draft = () => JSON.parse(db().prepare("SELECT draft FROM mk_landing_pages WHERE id = ?").get(pageId).draft);
  const search = (id, list) => { for (const x of list || []) { if (x.id === id) return x; const f = search(id, x.children); if (f) return f; } return null; };
  const row = (id) => page.locator(`[data-pb-layers] .pb-node[data-id="${id}"] > .pb-row-item`);
  const saved = () => until(() => page.evaluate(() => /Enregistré/.test(document.querySelector("[data-pb-save]").textContent)), { what: "enregistrement", every: 100 });
  const sum = (g) => page.locator(`[data-pb-inspector] details.pb-acc[data-group="${g}"] > summary`).first();
  // état ouvert / fermé des sections d'un groupe (ordre du DOM)
  const states = async (ids) => { await ensure(); return statesRaw(ids); };
  const statesRaw = (ids) => page.evaluate((list) => list.map((g) => { const d = document.querySelector(`[data-pb-inspector] details.pb-acc[data-group="${g}"]`); return d ? d.open : null; }), ids);
  // la sélection peut avoir été perdue (Échap ferme un menu mais désélectionne aussi) : on revient sur le conteneur, onglet Style
  const ensure = async () => { if ((await page.locator(`[data-pb-inspector] details.pb-acc[data-group="${G[0]}"]`).count()) === 0) { await row("cont00000001").click(); await wait(300); await tab("Style"); } };
  const click = async (g) => { await ensure(); await sum(g).scrollIntoViewIfNeeded(); await sum(g).click(); await wait(60); };
  const setMode = async (label) => {
    await page.locator("[data-pb-mainmenu]").click();
    await page.locator(".pb-menu:not([hidden]) .pb-menu-item", { hasText: label }).first().click();
    await until(async () => (await page.locator(".pb-menu:not([hidden])").count()) === 0, { what: "menu fermé" });
  };
  const closeAll = async () => { await ensure(); return closeAllRaw(); };
  const closeAllRaw = () => page.evaluate(() => { document.querySelectorAll("[data-pb-inspector] details.pb-acc[open]").forEach((d) => { d.open = false; }); });
  const tab = async (name) => { const t = page.locator("[data-pb-inspector] .pb-insp-tabs").getByRole("tab", { name }); await t.click(); await wait(250); };
  let G; // les quatre premières sections de l'onglet Style du conteneur (identifiants logiques lus dans la page, jamais écrits en dur)

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    pageId = Number((await boss.post("/marketing/pages", { name: "Accordéons" })).location.match(/(\d+)$/)[1]);
    const rev = db().prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(pageId).revision;
    const put = await boss.request(`/marketing/pages/${pageId}/brouillon`, { method: "PUT", json: { revision: rev, content: CONTENT }, headers: { Origin: srv.base } });
    assert.equal(put.status, 200, put.text.slice(0, 200));
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
    context = await browser.newContext({ viewport: { width: 1600, height: 950 } });
    await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    page = await context.newPage();
    errors = [];
    page.on("pageerror", (e) => errors.push(`pageerror : ${e.message}`));
    await page.goto(`${srv.base}/marketing/pages/${pageId}/editeur`);
    await page.waitForFunction(() => { const f = document.querySelector("[data-pb-frame]"); return f && f.contentDocument && f.contentDocument.body && f.contentDocument.body.classList.contains("lp-builder") && f.contentDocument.querySelector("[data-node-id]"); });
    await wait(500);
    await row("cont00000001").click(); await wait(300);
    await tab("Style");
    G = await page.evaluate(() => [...document.querySelectorAll("[data-pb-inspector] .pb-insp-body > details.pb-acc")].slice(0, 4).map((d) => d.getAttribute("data-group")));
    assert.equal(G.length, 4, "au moins quatre sections dans l'onglet Style d'un conteneur : " + G);
  });
  after(async () => { if (browser) await browser.close(); if (srv) await srv.stop(); });

  test("par défaut : « Plusieurs ouverts » (comportement historique inchangé) ; le menu propose les trois modes, le mode actif est coché", async () => {
    await closeAll();
    await click(G[0]); await click(G[1]);
    assert.deepEqual(await states(G), [true, true, false, false], "ouvrir B n'a pas fermé A");
    await page.locator("[data-pb-mainmenu]").click();
    const items = await page.locator(".pb-menu:not([hidden]) .pb-menu-item").allInnerTexts();
    for (const l of ["Un seul ouvert", "Plusieurs ouverts", "Fermer ceux situés en dessous"]) assert.ok(items.some((t) => t.includes(l)), l);
    assert.ok(items.some((t) => t.startsWith("● Plusieurs ouverts")), "le mode actif est marqué");
    assert.ok(await page.locator(".pb-menu:not([hidden])").innerText().then((t) => t.includes("Chaque section peut rester ouverte indépendamment.")), "description courte");
    await page.keyboard.press("Escape");
    await ensure();
  });

  test("« Un seul ouvert » : A, B, C → une seule section ouverte à la fois", async () => {
    await closeAll();
    await setMode("Un seul ouvert");
    await click(G[0]); assert.deepEqual(await states(G), [true, false, false, false]);
    await click(G[1]); assert.deepEqual(await states(G), [false, true, false, false]);
    await click(G[2]); assert.deepEqual(await states(G), [false, false, true, false]);
    await click(G[2]); assert.deepEqual(await states(G), [false, false, false, false], "fermer la section ouverte la ferme (aucune autre ne s'ouvre)");
  });

  test("« Plusieurs ouverts » : états indépendants et conservés ; ouvrir n'ouvre jamais les autres", async () => {
    await closeAll();
    await setMode("Plusieurs ouverts");
    await click(G[0]); assert.deepEqual(await states(G), [true, false, false, false]);
    await click(G[2]); assert.deepEqual(await states(G), [true, false, true, false], "B ne s'ouvre pas tout seul");
    await click(G[1]); assert.deepEqual(await states(G), [true, true, true, false], "A et C restent ouverts");
    await click(G[1]); assert.deepEqual(await states(G), [true, false, true, false], "fermer B ne touche pas A ni C");
  });

  test("« Fermer ceux situés en dessous » : A, C, B, D — le dessus reste ouvert, le dessous se ferme (ordre du groupe, pas de coordonnées)", async () => {
    await closeAll();
    await setMode("Fermer ceux situés en dessous");
    await click(G[0]); assert.deepEqual(await states(G), [true, false, false, false]);
    await click(G[2]); assert.deepEqual(await states(G), [true, false, true, false]);
    await click(G[1]); assert.deepEqual(await states(G), [true, true, false, false], "C (dessous) refermée, A (dessus) reste");
    await click(G[3]); assert.deepEqual(await states(G), [true, true, false, true]);
    await click(G[0]); // fermer A : ne ferme rien d'autre
    assert.deepEqual(await states(G), [false, true, false, true]);
    await click(G[0]); assert.deepEqual(await states(G), [true, false, false, false], "rouvrir A referme tout ce qui est dessous");
  });

  test("passage à « un seul ouvert » avec plusieurs sections ouvertes : la dernière ouverte par la personne est gardée (règle explicite), pas de remise à zéro", async () => {
    await closeAll();
    await setMode("Plusieurs ouverts");
    await click(G[0]); await click(G[1]); await click(G[3]);
    assert.deepEqual(await states(G), [true, true, false, true]);
    await setMode("Un seul ouvert");
    assert.deepEqual(await states(G), [false, false, false, true], "D, la dernière ouverte, reste ouverte");
    assert.match(await page.locator("[data-pb-toast]").innerText(), /refermées?|Un seul ouvert/);
  });

  test("la section cliquée ne saute pas (défilement compensé), le clavier fonctionne (Entrée, Espace), aucune reconstruction de l'inspecteur ni du canevas", async () => {
    await closeAll();
    await setMode("Un seul ouvert");
    await click(G[0]);
    await page.evaluate(() => { const box = document.querySelector("[data-pb-inspector]"); box.__garde = 1; document.querySelector("[data-pb-frame]").contentDocument.__garde = 1; window.__muts = 0; new MutationObserver((ms) => ms.forEach((m) => { if (m.type === "childList" && m.target === box.querySelector(".pb-insp-body")) window.__muts++; })).observe(box, { childList: true, subtree: true }); });
    await sum(G[2]).focus(); await wait(100); // le focus peut faire défiler jusqu'à la section : on mesure après
    const topBefore = (await sum(G[2]).boundingBox()).y;
    await page.keyboard.press("Enter"); await wait(150);
    assert.deepEqual(await states(G), [false, false, true, false], "Entrée applique le mode");
    const topAfter = (await sum(G[2]).boundingBox()).y;
    assert.ok(Math.abs(topAfter - topBefore) <= 3, `la section cliquée reste en place (${topBefore} → ${topAfter})`);
    await sum(G[3]).focus(); await page.keyboard.press("Space"); await wait(150);
    assert.deepEqual(await states(G), [false, false, false, true], "Espace applique le mode");
    assert.equal(await page.evaluate(() => !!document.querySelector("[data-pb-inspector]").__garde), true, "l'inspecteur n'a pas été reconstruit");
    assert.equal(await page.evaluate(() => document.querySelector("[data-pb-frame]").contentDocument.__garde), 1, "le canevas n'a pas été touché");
    assert.equal(await page.evaluate(() => window.__muts), 0, "aucun nœud ajouté ou retiré dans le corps de l'inspecteur");
  });

  test("groupes indépendants et accordéons imbriqués : un groupe ne ferme jamais un autre groupe ; un enfant ne ferme pas son parent", async () => {
    await setMode("Un seul ouvert");
    await page.evaluate(() => {
      const mk = (id, kids) => { const d = document.createElement("details"); d.className = "pb-acc"; d.setAttribute("data-group", id); d.innerHTML = `<summary><span class="pb-acc-title">${id}</span></summary>`; const b = document.createElement("div"); b.className = "pb-acc-body"; (kids || []).forEach((k) => b.appendChild(k)); d.appendChild(b); return d; };
      const host = document.createElement("div"); host.id = "banc"; host.style.cssText = "position:fixed;left:0;top:0;width:300px;background:#fff;z-index:99999";
      const gA = document.createElement("div"), gB = document.createElement("div");
      ["A1", "A2", "A3"].forEach((i) => gA.appendChild(mk(i))); ["B1", "B2", "B3"].forEach((i) => gB.appendChild(mk(i)));
      const enfants = [mk("E1"), mk("E2")]; const gP = document.createElement("div"); gP.appendChild(mk("P1", enfants)); gP.appendChild(mk("P2"));
      host.append(gA, gB, gP); document.body.appendChild(host);
    });
    const op = (id) => page.evaluate((i) => document.querySelector(`#banc details[data-group="${i}"]`).open, id);
    const ck = async (id) => { await page.locator(`#banc details[data-group="${id}"] > summary`).click(); await wait(40); };
    await ck("A1"); await ck("B1");
    assert.deepEqual([await op("A1"), await op("B1")], [true, true], "B1 ne ferme pas A1 (groupes indépendants)");
    await ck("A2"); assert.deepEqual([await op("A1"), await op("A2"), await op("B1")], [false, true, true], "dans son groupe, A2 ferme A1 ; B1 intact");
    // imbriqués : parent ouvert, puis enfant ouvert → le parent reste ouvert ; l'enfant E2 ferme E1 seulement
    await ck("P1"); await ck("E1"); assert.deepEqual([await op("P1"), await op("E1")], [true, true], "ouvrir l'enfant ne ferme pas son parent");
    await ck("E2"); assert.deepEqual([await op("P1"), await op("E1"), await op("E2")], [true, false, true]);
    // fermer le parent puis le rouvrir : l'état interne de l'enfant est conservé
    await ck("P1"); assert.equal(await op("P1"), false); assert.equal(await op("E2"), true, "fermer le parent ne modifie pas l'état de l'enfant");
    await ck("P1"); assert.deepEqual([await op("P1"), await op("E2")], [true, true]);
    // ouvrir le frère P2 ferme P1 (même groupe) sans changer l'état interne de ses enfants
    await ck("P2"); assert.deepEqual([await op("P1"), await op("P2"), await op("E2")], [false, true, true]);
    // exception par groupe (évolution prévue) : data-acc-mode sur le parent prime sur le réglage global
    await page.evaluate(() => { document.querySelector('#banc details[data-group="B1"]').parentElement.setAttribute("data-acc-mode", "many"); });
    await ck("B2"); assert.deepEqual([await op("B1"), await op("B2")], [true, true], "le groupe B suit son propre mode");
    await page.evaluate(() => document.getElementById("banc").remove());
  });

  test("les valeurs des contrôles survivent à la fermeture / réouverture ; mode et états sont mémorisés après rechargement ; écrans ordinateur / tablette / mobile", async () => {
    await closeAll();
    await setMode("Plusieurs ouverts");
    // modifier une valeur dans la première section, la fermer, la rouvrir
    await click(G[0]);
    const dir = () => page.locator(`[data-pb-inspector] details[data-group="${G[0]}"] [data-prop="flexDirection"] button[data-value="column"]`).first();
    await dir().scrollIntoViewIfNeeded(); await dir().click();
    await until(() => ((search("cont00000001", draft().sections).styles || {}).desktop || {}).flexDirection === "column", { what: "Direction enregistrée" });
    assert.equal(await dir().getAttribute("aria-checked"), "true");
    await click(G[0]); await click(G[0]);
    assert.equal(await dir().getAttribute("aria-checked"), "true", "la valeur « Direction » est exactement conservée après fermeture / réouverture");
    // écrans : le même moteur s'applique quel que soit l'écran actif
    for (const nom of ["Tablette", "Mobile", "Ordinateur"]) {
      await page.locator("[data-pb-inspector] button, [data-pb-inspector] [role=tab], [data-pb-inspector] label", { hasText: new RegExp(`^${nom}$`) }).first().click(); await wait(400);
      await setMode("Un seul ouvert");
      await click(G[1]); await click(G[2]);
      assert.deepEqual((await states(G)).filter(Boolean).length, 1, `${nom} : une seule section ouverte`);
      await setMode("Plusieurs ouverts");
    }
    // persistance : le mode et les états ouverts / fermés reviennent après rechargement ; rien n'est écrit dans le document de la page
    await closeAll(); await click(G[1]); await click(G[3]);
    await setMode("Fermer ceux situés en dessous");
    const doc0 = JSON.stringify(draft());
    await page.reload();
    await page.waitForFunction(() => { const f = document.querySelector("[data-pb-frame]"); return f && f.contentDocument && f.contentDocument.querySelector("[data-node-id]"); });
    await wait(600);
    await row("cont00000001").click(); await wait(300); await tab("Style");
    assert.equal(await page.evaluate(() => localStorage.getItem("pb:acc-mode")), JSON.stringify("below"));
    assert.deepEqual(await states(G), [false, true, false, true], "états individuels restitués (aucune normalisation en mode « en dessous »)");
    assert.equal(JSON.stringify(draft()), doc0, "le réglage est un état d'interface : jamais dans le document de la page");
    await page.locator("[data-pb-mainmenu]").click();
    assert.ok((await page.locator(".pb-menu:not([hidden]) .pb-menu-item").allInnerTexts()).some((t) => t.startsWith("● Fermer ceux situés en dessous")), "le mode mémorisé est coché");
    await page.keyboard.press("Escape");
    assert.deepEqual(errors, []);
  });

  test("tous les onglets de l'inspecteur utilisent le moteur : chaque onglet a son groupe, et l'ouverture d'un onglet n'affecte pas un autre", async () => {
    await row("cont00000001").click(); await wait(300);
    await setMode("Un seul ouvert");
    const tabs = ["Général", "Style", "Interactions"];
    const seen = {};
    for (const t of tabs) {
      await tab(t);
      const ids = await page.evaluate(() => [...document.querySelectorAll("[data-pb-inspector] .pb-insp-body > details.pb-acc")].map((d) => d.getAttribute("data-group")));
      seen[t] = ids; assert.ok(ids.length >= 3, `${t} : ${ids}`);
      await closeAllRaw(); for (const g of [ids[0], ids[1]]) { await sum(g).scrollIntoViewIfNeeded(); await sum(g).click(); await wait(60); }
      assert.equal((await page.evaluate(() => document.querySelectorAll("[data-pb-inspector] .pb-insp-body > details.pb-acc[open]").length)), 1, `${t} : un seul ouvert`);
    }
    await setMode("Plusieurs ouverts");
    assert.deepEqual(errors, []);
  });
});
