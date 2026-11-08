// Pied de page : UNE source de vérité du Theme Builder. L'éditeur, l'aperçu, la vignette, la bibliothèque et le site public montrent le MÊME pied de page enregistré
// (brouillon explicitement choisi ou version publiée) — jamais l'ancien réglage du site, jamais un autre modèle, jamais un doublon. Isolation entre sites.
// Causes racines couvertes : (1) l'aperçu d'un composant n'injectait pas le composant prévisualisé (il montrait le pied hérité du site, ou rien) ; (2) la carte lisait la version
// diffusée et non la copie de travail ; (3) un modèle exclu d'une page laissait réapparaître l'ancien pied ; (4) la bibliothèque prévisualisait sans le formulaire du site.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, Client, loginInstructor } = require("./helpers");
const Res = require("../src/themeBuilder/resolve");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const UA = { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 Chrome/120 Safari/537.36" };
const sect = (id, text, extra = []) => ({ id, type: "layout", children: [{ id: `${id}h`.slice(0, 20), type: "heading", props: { text, level: "2" } }, ...extra] });
const count = (t, s) => t.split(s).length - 1;

describe("Pied de page : cohérence éditeur / aperçu / vignette / site public", () => {
  let srv, boss, db, S1, S2, p1, p2;
  const U = (s, p = "") => `/marketing/site-web/sites/${s}/constructeur-de-theme${p}`;
  const post = (path, body) => boss.request(path, { method: "POST", json: body || {} });
  const json = (r) => JSON.parse(r.text);
  const slug = (id) => db.prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(id).slug;
  const pub = async (id) => (await new Client(srv.base).get(`/p/${slug(id)}`, { headers: UA })).text;
  const mkPage = async (site, name) => {
    const id = Number((await boss.post("/marketing/pages", { name, site_id: site, kind: "page", template: "", ouvrir: "editeur" })).location.match(/pages\/(\d+)/)[1]);
    const rev = db.prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(id).revision;
    assert.equal((await boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", headers: { Origin: srv.base }, json: { revision: rev, content: { title: name, sections: [sect("sect00000001", `CORPS-${name}`)] } } })).status, 200);
    assert.equal((await boss.request(`/marketing/pages/${id}/publier.json`, { method: "POST", json: {}, headers: { Origin: srv.base } })).status, 200);
    return id;
  };
  const footer = async (site, name, conditions) => json(await post(U(site, "/api/modeles"), { type: "footer", name, conditions })).template;
  const saveDraft = async (t, text, extra) => {
    const rev = db.prepare("SELECT revision FROM mk_web_components WHERE id = ?").get(t.sourceId).revision;
    const r = await boss.request(`/marketing/site-web/composants/${t.sourceId}/brouillon`, { method: "PUT", headers: { Origin: srv.base }, json: { revision: rev, content: { title: "t", sections: [sect(`sect${String(t.id).padStart(7, "0")}`, text, extra)] } } });
    assert.equal(r.status, 200, r.text.slice(0, 200));
  };
  const publish = async (site, t) => { const r = await post(U(site, `/api/modeles/${t.id}/publier`)); assert.equal(r.status, 200, r.text.slice(0, 300)); };
  const preview = async (t, q = "") => (await boss.get(`/marketing/site-web/composants/${t.sourceId}/apercu${q}`)).text;
  const editor = async (t) => (await boss.get(`/marketing/site-web/composants/${t.sourceId}/editeur?modele=${t.id}&retour=tb`)).text;
  const card = async (site, t) => json(await boss.get(U(site, "/api/modeles?type=footer"))).templates.find((x) => x.id === t.id);
  const vignette = async (site, t) => (await boss.get(U(site, `/api/modeles/${t.id}/vignette`))).text;

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db();
    const mk = async (n) => Number((await boss.post("/marketing/site-web/sites", { name: n })).location.match(/sites\/(\d+)/)[1]);
    S1 = await mk("Site Un"); S2 = await mk("Site Deux");
    p1 = await mkPage(S1, "Accueil"); p2 = await mkPage(S2, "Accueil2");
  });
  after(async () => { if (db) db.close(); if (srv) await srv.stop(); });

  const A = {}, B = {};
  test("cycle complet : édition → sauvegarde → rechargement → aperçu du brouillon → publication → site public (même texte partout, jamais l'ancienne version)", async () => {
    Object.assign(A, await footer(S1, "Pied A"));
    await saveDraft(A, "PIED-A-V1"); await publish(S1, A);
    assert.ok((await pub(p1)).includes("PIED-A-V1"), "publié");
    await saveDraft(A, "PIED-A-V2"); // brouillon seulement
    const edit = await editor(A); assert.ok(edit.includes("PIED-A-V2") && !edit.includes("PIED-A-V1"), "l'éditeur recharge le brouillon enregistré, pas l'ancienne version");
    const prev = await preview(A); assert.ok(prev.includes("PIED-A-V2") && !prev.includes("PIED-A-V1"), "l'aperçu montre le brouillon exact");
    assert.ok(count(prev, "lp-site-footer") >= 1 && prev.includes("CORPS-Accueil"), "le pied est dans la page du site");
    const live = await pub(p1); assert.ok(live.includes("PIED-A-V1") && !live.includes("PIED-A-V2"), "le public garde la version publiée tant que rien n'est publié");
    assert.match(await vignette(S1, A), /PIED-A-V2/, "la vignette réelle montre la copie de travail");
    await publish(S1, A);
    const after = await pub(p1); assert.ok(after.includes("PIED-A-V2") && !after.includes("PIED-A-V1"), "après publication : la nouvelle version, plus l'ancienne");
    assert.ok((await preview(A)).includes("PIED-A-V2")); assert.ok((await editor(A)).includes("PIED-A-V2"));
  });
  test("aperçu d'un pied jamais publié ou qui n'est pas le gagnant : exactement CE modèle (pas le pied hérité du site, pas un autre)", async () => {
    Object.assign(B, await footer(S1, "Pied B", { include: [{ kind: "page", ids: [p1] }] }));
    await saveDraft(B, "PIED-B-BROUILLON");
    const pb = await preview(B); assert.ok(pb.includes("PIED-B-BROUILLON") && !pb.includes("PIED-A-V2"), "brouillon non publié prévisualisé");
    assert.ok(!(await pub(p1)).includes("PIED-B-BROUILLON"), "un brouillon n'est jamais public");
    await publish(S1, B);
    const live = await pub(p1); assert.ok(live.includes("PIED-B-BROUILLON") && !live.includes("PIED-A-V2") && count(live, "lp-site-footer") === 1, "plus précis gagne, aucun doublon");
    const pa = await preview(A); assert.ok(pa.includes("PIED-A-V2") && !pa.includes("PIED-B-BROUILLON"), "A prévisualisé alors qu'il n'est plus le gagnant : on voit A");
  });
  test("carte du Theme Builder : lit la copie de travail (le nombre d'éléments suit l'édition)", async () => {
    const before = (await card(S1, A)).elements;
    await saveDraft(A, "PIED-A-V3", [{ id: "txt000000001", type: "text", props: { html: "<p>plus</p>" } }, { id: "btn000000001", type: "button", props: { label: "Ok", url: "/", variant: "primary" } }]);
    const c = await card(S1, A); assert.ok(c.elements > before, `la miniature suit le brouillon (${before} → ${c.elements})`);
  });
  test("ancien réglage du site : jamais réaffiché quand le Theme Builder gère le pied (page exclue → aucun pied, pas l'ancien)", async () => {
    const org = db.prepare("SELECT organization_id o FROM mk_sites WHERE id = ?").get(S1).o;
    const legacy = Number(db.prepare("INSERT INTO mk_web_components (organization_id, site_id, name, section, kind) VALUES (?, ?, 'Ancien pied', ?, 'standard')").run(org, S1, JSON.stringify(sect("sect9999999", "ANCIEN-PIED"))).lastInsertRowid);
    db.prepare("UPDATE mk_sites SET footer_component_id = ? WHERE id = ?").run(legacy, S1);
    for (const o of [A, B]) assert.equal((await post(U(S1, `/api/modeles/${o.id}/archiver`))).status, 200); // égalité de précision à la même seconde : on isole le cas testé
    const p3 = await mkPage(S1, "Exclue");
    const t = await footer(S1, "Pied sauf Exclue", { exclude: [{ kind: "page", ids: [p3] }] }); await saveDraft(t, "PIED-GLOBAL"); await publish(S1, t);
    const ex = await pub(p3); assert.ok(!ex.includes("ANCIEN-PIED") && !ex.includes("PIED-GLOBAL"), "page exclue : aucun pied (pas l'ancien)");
    const ok = await pub(await mkPage(S1, "Autre")); assert.ok(ok.includes("PIED-GLOBAL") && !ok.includes("ANCIEN-PIED") && count(ok, "lp-site-footer") === 1, `global=${ok.includes("PIED-GLOBAL")} ancien=${ok.includes("ANCIEN-PIED")} n=${count(ok, "lp-site-footer")}`);
    db.prepare("UPDATE mk_sites SET footer_component_id = NULL WHERE id = ?").run(S1);
  });
  test("priorité déterministe : l'ordre de chargement ne change pas le gagnant ; égalité → plus récent puis plus petit identifiant", () => {
    const mk = (id, publishedAt, conditions) => ({ id, name: `T${id}`, type: "footer", status: "published", publishedAt, conditions });
    const list = [mk(1, "2026-01-01T00:00:00Z", {}), mk(2, "2026-02-01T00:00:00Z", {}), mk(3, "2026-02-01T00:00:00Z", {}), mk(4, "2026-01-01T00:00:00Z", { include: [{ kind: "page", ids: [9] }] })];
    const ctx = { siteId: 1, view: "page", id: 9, parents: [], categories: [], categoryAncestors: [], tags: [] };
    for (let i = 0; i < 12; i += 1) { const shuffled = [...list].sort(() => Math.random() - 0.5); assert.equal(Res.resolve(shuffled, ctx, { type: "footer" }).winner.id, 4); }
    const ctx2 = { ...ctx, id: 10 };
    for (let i = 0; i < 12; i += 1) { const shuffled = [...list].sort(() => Math.random() - 0.5); assert.equal(Res.resolve(shuffled, ctx2, { type: "footer" }).winner.id, 2, "égalité de précision et de date : le plus petit identifiant"); }
  });
  test("isolation : le pied d'un site n'apparaît pas sur l'autre ; vignette d'un modèle d'un autre site refusée", async () => {
    assert.ok(!(await pub(p2)).includes("PIED-"), "site 2 sans modèle : aucun pied du site 1");
    const t2 = await footer(S2, "Pied S2"); await saveDraft(t2, "PIED-SITE-DEUX"); await publish(S2, t2);
    const l2 = await pub(p2); assert.ok(l2.includes("PIED-SITE-DEUX") && !l2.includes("PIED-A") && !l2.includes("PIED-GLOBAL"));
    assert.ok(!(await pub(p1)).includes("PIED-SITE-DEUX"));
    assert.equal((await boss.get(U(S1, `/api/modeles/${t2.id}/vignette`))).status, 404, "vignette d'un modèle d'un autre site");
  });
  test("bibliothèque : aperçu et copie « Utiliser » partent du MÊME document", async () => {
    const key = json(await boss.get(U(S1, "/api/bibliotheque?type=footer&mise=communautes&limite=1"))).items[0].key;
    const lib = (await boss.get(U(S1, `/api/bibliotheque/footer/${key}/apercu`))).text;
    const used = json(await post(U(S1, "/api/bibliotheque/utiliser"), { type: "footer", key })).template;
    const mine = await vignette(S1, used);
    const sig = (h) => ({ form: /<form/i.test(h), subscribe: /S'abonner|S&#39;abonner/.test(h) });
    assert.deepEqual(sig(lib), sig(mine), "même structure d'abonnement");
  });

  describe("rendu dans un vrai navigateur : même composition partout, desktop / tablette / mobile", { skip: !chromium || !CHROME ? "Playwright ou Chrome absent" : false }, () => {
    let browser, tpl;
    before(async () => {
      const key = json(await boss.get(U(S2, "/api/bibliotheque?type=footer&mise=colonnes&limite=1"))).items[0].key;
      tpl = json(await post(U(S2, "/api/bibliotheque/utiliser"), { type: "footer", key, name: "Pied navigateur" })).template;
      const c = await post(U(S2, `/api/modeles/${tpl.id}/conditions`), { conditions: { include: [{ kind: "page", ids: [p2] }] }, revision: tpl.revision }); assert.equal(c.status, 200, c.text.slice(0, 200));
      await publish(S2, tpl);
      browser = await chromium.launch({ executablePath: CHROME, headless: true });
    });
    after(async () => { if (browser) await browser.close(); });
    // Signature de composition : texte visible + nombre de colonnes (positions horizontales distinctes) par rangée flex
    const signature = (page, sel) => page.evaluate((s) => {
      const root = document.querySelector(s); if (!root) return null;
      const vis = (e) => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && cs.display !== "none"; };
      const text = root.innerText.replace(/\s+/g, " ").trim();
      const rows = [...root.querySelectorAll("*")].filter((e) => vis(e) && getComputedStyle(e).display.includes("flex") && e.children.length > 1).map((e) => new Set([...e.children].filter(vis).map((c) => Math.round(c.getBoundingClientRect().left))).size);
      return { text, rows: rows.join(","), width: Math.round(root.getBoundingClientRect().width), vw: innerWidth, inner: [...root.querySelectorAll("*")].filter((e) => vis(e) && getComputedStyle(e).display.includes("flex") && e.children.length > 1).map((e) => Math.round(e.getBoundingClientRect().width)).join(",") };
    }, sel);
    for (const [name, vp] of [["desktop", { width: 1280, height: 900 }], ["tablette", { width: 820, height: 1000 }], ["mobile", { width: 390, height: 800 }]]) {
      test(`${name} : site public, aperçu du modèle et vignette réelle ont la même composition`, async () => {
        const ctxB = await browser.newContext({ viewport: vp }); await ctxB.addCookies([...boss.cookies].map(([n, v]) => ({ name: n, value: v, url: srv.base })));
        const pg = await ctxB.newPage();
        await pg.goto(`${srv.base}/p/${slug(p2)}`); const live = await signature(pg, ".lp-site-footer");
        await pg.goto(`${srv.base}/marketing/site-web/composants/${tpl.sourceId}/apercu`); const prev = await signature(pg, ".lp-site-footer");
        await pg.goto(`${srv.base}${U(S2, `/api/modeles/${tpl.id}/vignette`)}`); const thumb = await signature(pg, ".kw-theme-part");
        const noScroll = await pg.goto(`${srv.base}/p/${slug(p2)}`).then(() => pg.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1));
        // Canevas de l'éditeur (même route que l'éditeur : rendu du composant avec la copie de travail enregistrée)
        const comp = db.prepare("SELECT draft, section FROM mk_web_components WHERE id = ?").get(tpl.sourceId);
        const saved = JSON.parse(comp.draft || comp.section);
        const canvas = await boss.request(`/marketing/site-web/composants/${tpl.sourceId}/rendu`, { method: "POST", headers: { Origin: srv.base }, json: { content: { title: "t", sections: [saved] } } });
        assert.equal(canvas.status, 200, canvas.text.slice(0, 200));
        await pg.goto(`${srv.base}/robots.txt`); await pg.evaluate((h) => { document.open(); document.write(h); document.close(); }, canvas.text); await pg.waitForLoadState("load");
        const edit = await signature(pg, ".lp-block-layout");
        await ctxB.close();
        assert.ok(noScroll, `${name} : aucun défilement horizontal sur le site public`);
        // la ligne légale de la plateforme (« Site · Cookies ») est ajoutée par le site public APRÈS le pied du Theme Builder (_foot-legal.ejs) : l'éditeur ne la rend pas
        assert.ok(edit, "pied trouvé dans le canevas de l'éditeur"); assert.equal(edit.width, live.width, `${name} : canevas de l'éditeur = public (largeur)`); assert.equal(edit.text.replace(/Aucun logo : .*?en attendant\)\./g, "").replace(/Menu du CMS : aucun menu publié à l'emplacement « \w+ » pour ce site\. Créez-le et affectez-le dans Apparence → Menus\./g, "").replace(/\s+/g, " ").trim(), live.text.replace(/ Site Deux · Cookies( · Confidentialité)?$/, ""), `${name} : éditeur = public (texte, hors aides visibles seulement dans l'éditeur)`); const tally = (csv) => csv.split(",").reduce((m, w) => m.set(w, (m.get(w) || 0) + 1), new Map());
        const e = tally(edit.inner), l = tally(live.inner);
        for (const [w, n] of l) assert.ok((e.get(w) || 0) >= n, `${name} : éditeur : chaque conteneur flex du public (${w} px ×${n}) existe dans le canevas (les encadrés d'aide de l'éditeur s'y ajoutent)`);
        assert.ok(live && prev && thumb, "pied trouvé dans les trois rendus");
        if (process.env.TB_DIAG) console.log("DIAG", name, JSON.stringify({ live: [live.width, live.inner], prev: [prev.width, prev.inner], thumb: [thumb.width, thumb.inner] }));
        assert.equal(prev.width, live.width, `${name} : aperçu = public (largeur)`); assert.equal(thumb.width, live.width, `${name} : vignette = public (largeur)`);
        assert.equal(prev.text, live.text, `${name} : aperçu = public (texte)`); assert.equal(thumb.text, live.text.replace(/ Site Deux · Cookies( · Confidentialité)?$/, ""), `${name} : vignette = public (texte)`);
        assert.equal(prev.rows, live.rows, `${name} : aperçu = public (colonnes par rangée)`); assert.equal(thumb.rows, live.rows, `${name} : vignette = public (colonnes par rangée)`);
      });
    }
  });
});
