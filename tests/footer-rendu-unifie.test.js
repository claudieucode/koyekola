// Chantier A — RENDU UNIFIÉ DU PIED DE PAGE (Footer Builder) sur un VRAI serveur : page de l'éditeur (/p/:slug), blog et boutique (/boutique/*) résolvent et rendent le pied du Theme Builder
// de la même façon. Un SEUL <footer> par page (balise sémantique + repère data-kw-footer), jamais de second pied (10 puis 25 éléments), zones de widgets de pied et ligne légale présentes
// aussi sur le blog, repli EXACT du pied boutique sans modèle, isolation entre deux sites, exclusion sans pied « fantôme ».
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, Client, loginInstructor } = require("./helpers");

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 Chrome/120 Safari/537.36";
const H1 = "www.pied-un.example", H2 = "www.pied-deux.example";
const as = (host) => ({ headers: { "x-forwarded-host": host, "User-Agent": UA } });
const count = (t, s) => t.split(s).length - 1;
const footers = (h) => count(h, "<footer");
const sect = (id, text, n = 1) => ({ id, type: "layout", children: Array.from({ length: n }, (_, i) => ({ id: `${id}h${i}`.slice(0, 20), type: "heading", props: { text: i === 0 ? text : `${text}-${i}`, level: "2" } })) });

describe("Rendu unifié du pied de page : page de l'éditeur, blog, boutique", () => {
  let srv, boss, db, S1, S2, pA, pX, pB, pM;
  const U = (s, p = "") => `/marketing/site-web/${s === null ? "principal" : `sites/${s}`}/constructeur-de-theme${p}`;
  const post = (path, body) => boss.request(path, { method: "POST", json: body || {} });
  const json = (r) => JSON.parse(r.text);
  const slug = (id) => db.prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(id).slug;
  const page = async (id) => (await new Client(srv.base).get(`/p/${slug(id)}`, { headers: { "User-Agent": UA } })).text; /* /p/<adresse> : le site est celui de la page, jamais celui de l'hôte */
  const get = async (path, host) => { const r = await new Client(srv.base).get(path, host ? as(host) : { headers: { "User-Agent": UA } }); return { status: r.status, text: r.text }; };
  const mkSite = async (name, host) => {
    const id = Number((await boss.post("/marketing/site-web/sites", { name })).location.match(/sites\/(\d+)/)[1]);
    const cur = json(await boss.get(`/marketing/site-web/sites/${id}/reglages.json`));
    const r = await boss.request(`/marketing/site-web/sites/${id}/reglages.json`, { method: "PUT", json: { revision: cur.revision, tokens: cur.tokens, settings: { ...cur.settings, seo: { ...cur.settings.seo, publicUrl: `https://${host}` } } } });
    assert.equal(r.status, 200);
    return id;
  };
  const mkPage = async (site, name) => {
    const id = Number((await boss.post("/marketing/pages", { name, site_id: site, kind: "page", template: "", ouvrir: "editeur" })).location.match(/pages\/(\d+)/)[1]);
    const rev = db.prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(id).revision;
    assert.equal((await boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", headers: { Origin: srv.base }, json: { revision: rev, content: { title: name, sections: [sect("sect00000001", `CORPS-${name}`)] } } })).status, 200);
    assert.equal((await boss.request(`/marketing/pages/${id}/publier.json`, { method: "POST", json: {}, headers: { Origin: srv.base } })).status, 200);
    return id;
  };
  const footer = async (site, name, conditions) => json(await post(U(site, "/api/modeles"), { type: "footer", name, conditions })).template;
  const saveDraft = async (t, text, n = 1) => {
    const rev = db.prepare("SELECT revision FROM mk_web_components WHERE id = ?").get(t.sourceId).revision;
    const r = await boss.request(`/marketing/site-web/composants/${t.sourceId}/brouillon`, { method: "PUT", headers: { Origin: srv.base }, json: { revision: rev, content: { title: "t", sections: [sect(`sect${String(t.id).padStart(7, "0")}`, text, n)] } } });
    assert.equal(r.status, 200, r.text.slice(0, 200));
  };
  const publish = async (site, t) => { const r = await post(U(site, `/api/modeles/${t.id}/publier`)); assert.equal(r.status, 200, r.text.slice(0, 300)); };
  const zones = async (site, texts) => {
    const q = site ? `?site=${site}` : "";
    const cur = db.prepare("SELECT revision FROM cms_widget_layouts WHERE COALESCE(site_id, 0) = COALESCE(?, 0)").get(site || null);
    const blocks = texts.map((t, i) => ({ id: `z${String(i).padStart(8, "0")}`, type: "paragraph", settings: { text: t } }));
    const r = await boss.postJson(`/marketing/site-web/widgets/enregistrer${q}`, { revision: cur ? cur.revision : 0, layout: { zones: { sidebar: [], "footer-1": blocks, "footer-2": [] }, inactive: [] } });
    assert.equal(r.status, 200, r.text.slice(0, 200));
  };
  const shop = async (site, host) => {
    assert.equal((await boss.post(`/marketing/site-web/sites/${site}/modules/commerce`, { etat: "activer" })).status, 302);
    assert.equal((await boss.post(`/marketing/site-web/sites/${site}/boutique/reglages`, { currency: "eur", default_country: "FR", enabled: "1", payment_methods: ["manual"], guest_checkout: "1", order_prefix: "PIE", manual_instructions: "Virement" })).status, 302);
    assert.equal((await get("/boutique", host)).status, 200);
  };

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "", ALLOW_INDEXING: "1" });
    boss = await loginInstructor(srv); db = srv.db();
    S1 = await mkSite("Site Un", H1); S2 = await mkSite("Site Deux", H2);
    pA = await mkPage(S1, "Accueil"); pX = await mkPage(S1, "Exclue"); pB = await mkPage(S2, "Autre"); pM = await mkPage("", "Principale");
    db.prepare("UPDATE mk_sites SET home_page_id = ? WHERE id = ?").run(pA, S1); db.prepare("UPDATE mk_sites SET home_page_id = ? WHERE id = ?").run(pB, S2); /* sites « construits » : leur page introuvable est habillée */
    db.prepare("INSERT INTO posts (slug, title, content, published, status, published_at, category, tags, created_at, updated_at) VALUES ('article-pied', 'Article du pied', '<p>x</p>', 1, 'published', datetime('now'), 'Actualités', 'a', datetime('now'), datetime('now'))").run();
    await shop(S1, H1); await shop(S2, H2);
  });
  after(async () => { if (db) db.close(); if (srv) await srv.stop(); });

  // Les surfaces d'un site à domaine propre : page de l'éditeur, boutique (catalogue, panier). Le blog et la page introuvable habillée sont couverts par le site principal (le blog est en 404 sur le domaine d'un site).
  const siteSurfaces = async (pageId, host) => ({ editeur: await page(pageId), catalogue: (await get("/boutique", host)).text, panier: (await get("/boutique/panier", host)).text });
  const mainSurfaces = async () => ({ blog: (await get("/blog")).text, article: (await get("/blog/article-pied")).text, introuvable: (await get("/page-introuvable-xyz")).text, accueilEditeur: await page(pM) });
  const KO_ORIGINE = (h) => !h.includes('class="site-footer"') && !h.includes('class="sh-foot"') && count(h, 'class="lp-foot"') === 0;

  test("sans modèle : repli exact. Page éditeur : un seul <footer> d'origine ; boutique : pied fixe d'origine ; blog : un seul pied d'origine", async () => {
    const a = await page(pA);
    assert.equal(footers(a), 1); assert.equal(count(a, 'class="lp-foot"'), 1); assert.equal(count(a, " data-kw-footer="), 0);
    const s = await get("/boutique", H2);
    assert.equal(s.status, 200); assert.equal(footers(s.text), 1);
    assert.ok(s.text.includes('<footer class="sh-foot"><a href="/boutique">Site Deux</a> · <a href="/boutique/panier">Panier</a> · <a href="/boutique/compte">Mon compte</a></footer>'), "pied boutique d'origine, à l'identique");
    assert.equal(count(s.text, " data-kw-footer="), 0);
    const b = await get("/blog");
    assert.equal(b.status, 200); assert.equal(footers(b.text), 1, "blog : un seul pied d'origine"); assert.ok(b.text.includes('class="site-footer"'));
  });

  let T1;
  test("site 1 : un pied publié, MÊME pied dans UN <footer data-kw-footer> sur page éditeur et boutique, sans pied d'origine", async () => {
    await zones(S1, ["ZONE-PIED-UN"]);
    T1 = await footer(S1, "Pied Un", { exclude: [{ kind: "page", ids: [pX] }] });
    await saveDraft(T1, "PIED-UN-TB", 10); await publish(S1, T1);
    for (const [nom, h] of Object.entries(await siteSurfaces(pA, H1))) {
      assert.ok(h.includes("PIED-UN-TB"), `${nom} : le pied du Theme Builder est là`);
      assert.equal(footers(h), 1, `${nom} : un seul <footer>`);
      assert.equal(count(h, 'data-kw-footer="1"'), 1, `${nom} : un seul repère`);
      assert.equal(count(h, 'role="contentinfo"'), 1, `${nom} : un seul repère contentinfo`);
      assert.equal(count(h, 'PIED-UN-TB-9"') + count(h, "PIED-UN-TB-9<"), 1, `${nom} : les 10 éléments sont rendus une seule fois`);
      assert.ok(KO_ORIGINE(h), `${nom} : aucun pied d'origine en plus`);
    }
  });

  test("zones de widgets de pied et ligne légale (Cookies) DANS le pied : page éditeur et boutique du site", async () => {
    for (const [nom, h] of Object.entries(await siteSurfaces(pA, H1))) {
      assert.ok(h.includes("ZONE-PIED-UN"), `${nom} : zone de widgets de pied`);
      assert.equal(count(h, "lp-foot-widgets"), 1, `${nom} : une seule zone`);
      const i = h.indexOf("data-kw-footer"), j = h.indexOf("ZONE-PIED-UN"), k = h.indexOf("data-kw-consent-open", j);
      assert.ok(i > -1 && j > i, `${nom} : la zone est après l'ouverture du pied`);
      assert.ok(k > j, `${nom} : ligne légale (Cookies) après la zone, dans le pied`);
      assert.ok(h.indexOf("</footer>", j) > k, `${nom} : tout cela est avant la fermeture du <footer>`);
    }
  });

  test("site 1 : 10 puis 25 éléments dans le pied ne créent jamais un second pied", async () => {
    for (const n of [10, 25]) {
      await saveDraft(T1, "PIED-UN-TB", n);
      assert.equal((await post(U(S1, `/api/modeles/${T1.id}/publier`))).status, 200);
      for (const [nom, h] of Object.entries(await siteSurfaces(pA, H1))) {
        assert.equal(footers(h), 1, `${nom}, ${n} éléments : un seul <footer>`);
        assert.equal(count(h, " data-kw-footer="), 1);
        assert.equal(count(h, `PIED-UN-TB-${n - 1}"`) + count(h, `PIED-UN-TB-${n - 1}<`), 1, `${nom}, ${n} éléments : le dernier est rendu une fois`);
      }
    }
  });

  test("page de commande : le pied fixe d'origine reste (jamais le pied du Theme Builder), un seul <footer>", async () => {
    const c = await get("/boutique/commande", H1);
    if (c.status === 200) { assert.equal(footers(c.text), 1); assert.ok(c.text.includes('<footer class="sh-foot">')); assert.ok(!c.text.includes("PIED-UN-TB")); }
    else assert.ok([301, 302, 303].includes(c.status), `commande : ${c.status}`);
  });

  test("page exclue des conditions : aucun pied Theme Builder, aucun pied fantôme ; le repli d'origine s'affiche une seule fois", async () => {
    const h = await page(pX);
    assert.ok(!h.includes("PIED-UN-TB")); assert.equal(count(h, " data-kw-footer="), 0);
    assert.equal(footers(h), 1); assert.equal(count(h, 'class="lp-foot"'), 1);
  });

  test("isolation : le pied du site 1 n'apparaît sur aucune page du site 2 ni du principal ; le site 2 a son propre pied, le site 1 garde le sien", async () => {
    for (const [nom, h] of Object.entries(await siteSurfaces(pB, H2))) { assert.ok(!h.includes("PIED-UN-TB") && !h.includes("ZONE-PIED-UN"), `${nom} : rien du site 1`); assert.equal(footers(h), 1, `${nom} : repli historique`); assert.equal(count(h, " data-kw-footer="), 0); }
    for (const [nom, h] of Object.entries(await mainSurfaces())) { assert.ok(!h.includes("PIED-UN-TB") && !h.includes("ZONE-PIED-UN"), `${nom} (principal) : rien du site 1`); assert.equal(footers(h), 1); }
    const T2 = await footer(S2, "Pied Deux", {}); await saveDraft(T2, "PIED-DEUX-TB", 3); await publish(S2, T2);
    for (const [nom, h] of Object.entries(await siteSurfaces(pB, H2))) { assert.ok(h.includes("PIED-DEUX-TB") && !h.includes("PIED-UN-TB"), nom); assert.equal(footers(h), 1); }
    for (const [nom, h] of Object.entries(await siteSurfaces(pA, H1))) { assert.ok(!h.includes("PIED-DEUX-TB") && h.includes("PIED-UN-TB"), nom); }
  });

  test("pas de <footer> imbriqué : un modèle qui contient déjà un conteneur <footer> garde UN seul <footer> (l'enveloppe devient un <div>)", async () => {
    const T3 = await footer(S2, "Pied Natif", { include: [{ kind: "page", ids: [pB] }] });
    const rev = db.prepare("SELECT revision FROM mk_web_components WHERE id = ?").get(T3.sourceId).revision;
    const doc = { id: "sectnative001", type: "layout", children: [{ id: "nativefoot0001", type: "container", props: { tag: "footer" }, children: [{ id: "nativehead0001", type: "heading", props: { text: "PIED-NATIF", level: "2" } }] }] };
    assert.equal((await boss.request(`/marketing/site-web/composants/${T3.sourceId}/brouillon`, { method: "PUT", headers: { Origin: srv.base }, json: { revision: rev, content: { title: "t", sections: [doc] } } })).status, 200);
    await publish(S2, T3);
    const h = await page(pB);
    assert.ok(h.includes("PIED-NATIF"));
    assert.equal(footers(h), 1, "un seul <footer>, jamais imbriqué");
    assert.equal(count(h, 'data-kw-footer="wrap"'), 1);
  });

  test("thème en paquet : son pied de démonstration n'est pas ajouté quand un pied Theme Builder s'applique ; sans pied TB, un seul <footer> reste", async () => {
    const packFoot = { id: "sectpackfoot1", type: "layout", children: [{ id: "packfoothtml1", type: "html", props: { html: '<footer class="he-foot">PIED-DU-THEME</footer>' } }] };
    const mk = async (site, name) => {
      const id = Number((await boss.post("/marketing/pages", { name, site_id: site, kind: "page", template: "", ouvrir: "editeur" })).location.match(/pages\/(\d+)/)[1]);
      const rev = db.prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(id).revision;
      assert.equal((await boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", headers: { Origin: srv.base }, json: { revision: rev, content: { title: name, sections: [sect("sect00000001", `CORPS-${name}`), packFoot] } } })).status, 200);
      assert.equal((await boss.request(`/marketing/pages/${id}/publier.json`, { method: "POST", json: {}, headers: { Origin: srv.base } })).status, 200);
      return id;
    };
    const h = await page(await mk(S1, "Pack avec pied"));
    assert.ok(h.includes("PIED-UN-TB") && !h.includes("PIED-DU-THEME"), "le pied du thème est retiré");
    assert.equal(footers(h), 1);
    const S3 = await mkSite("Site Trois", "www.pied-trois.example"), h3 = await page(await mk(S3, "Pack seul"));
    assert.ok(h3.includes("PIED-DU-THEME")); assert.equal(footers(h3), 1); assert.equal(count(h3, 'class="lp-foot"'), 1);
  });

  test("site principal : blog, article, page introuvable et page de l'éditeur rendent le MÊME pied Theme Builder (zones + ligne légale), un seul <footer>, 10 puis 25 éléments", async () => {
    await zones(null, ["ZONE-PIED-PRINCIPAL"]);
    const T = await footer(null, "Pied principal", {}); await saveDraft(T, "PIED-PRINCIPAL-TB", 10); await publish(null, T);
    for (const n of [10, 25]) {
      if (n === 25) { await saveDraft(T, "PIED-PRINCIPAL-TB", 25); assert.equal((await post(U(null, `/api/modeles/${T.id}/publier`))).status, 200); }
      for (const [nom, h] of Object.entries(await mainSurfaces())) {
        assert.ok(h.includes("PIED-PRINCIPAL-TB"), `${nom} : pied du Theme Builder`);
        assert.equal(footers(h), 1, `${nom} : un seul <footer>`); assert.equal(count(h, " data-kw-footer="), 1);
        assert.equal(count(h, `PIED-PRINCIPAL-TB-${n - 1}"`) + count(h, `PIED-PRINCIPAL-TB-${n - 1}<`), 1);
        assert.ok(KO_ORIGINE(h), `${nom} : aucun pied d'origine en plus`);
        const j = h.indexOf("ZONE-PIED-PRINCIPAL"), k = h.indexOf("data-kw-consent-open", j);
        assert.ok(j > h.indexOf("data-kw-footer") && k > j && h.indexOf("</footer>", j) > k, `${nom} : zone puis ligne légale dans le pied`);
      }
    }
    for (const [nom, h] of [...Object.entries(await siteSurfaces(pA, H1)), ...Object.entries(await siteSurfaces(pB, H2))]) assert.ok(!h.includes("PIED-PRINCIPAL-TB") && !h.includes("ZONE-PIED-PRINCIPAL"), `${nom} : rien du principal sur les sites`);
  });
});
