// Thèmes (refonte) : compteurs EXACTS (facettes), aperçu rapide (balisage, droits, isolation par site), rendu de démonstration gardé en mémoire sans fuite entre sites,
// carte allégée (une seule image, pas de ligne superflue). Vraies routes, vraie base, de vrais comptes.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, Client, loginInstructor, newStudent } = require("./helpers");

describe("Thèmes : galerie refaite", () => {
  let srv, boss, db, orgId, A, B, adminA, viewerA;
  const TH = "/marketing/site-web/themes";
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const decode = (t) => String(t).replace(/&#39;/g, "'").replace(/&quot;|&#34;/g, '"').replace(/&amp;/g, "&");
  const meta = (html) => JSON.parse(/data-tg-meta>([\s\S]*?)<\/script>/.exec(html)[1]);
  const cards = (html) => (html.match(/data-th-card /g) || []).length;
  const person = async (siteId, role) => { const c = await newStudent(srv); db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, ?)").run(siteId, one("SELECT id FROM users WHERE email = ?", c.email).id, role); return c; };

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "", ALLOW_INDEXING: "1" });
    boss = await loginInstructor(srv); db = srv.db(); orgId = one("SELECT id FROM mk_organizations").id;
    const site = (n) => Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, ?, ?, '{}')").run(orgId, n, n.toLowerCase()).lastInsertRowid);
    A = site("Alpha"); B = site("Beta");
    adminA = await person(A, "admin"); viewerA = await person(A, "viewer");
  });
  after(() => { db.close(); return srv.stop(); });

  test("les compteurs de catégories, d'états et de styles sont ceux des résultats réels, avec tous les autres filtres", async () => {
    const combos = ["", "q=restaurant", "style=sombre", "q=agence&style=moderne", "etat=available", "etat=installed", "categorie=restaurant", "categorie=restaurant&style=chaleureux", "q=zzzzzz"];
    for (const qs of combos) {
      const url = `${TH}?site=${A}&fragment=1&${qs}`;
      const m = meta((await boss.get(url)).text);
      const get = async (extra) => { const p = new URLSearchParams(qs); for (const [k, v] of Object.entries(extra)) { if (v === "") p.delete(k); else p.set(k, v); } p.set("site", A); p.set("fragment", "1"); return meta((await boss.get(`${TH}?${p}`)).text).total; };
      // chaque catégorie annoncée = le total obtenu en la choisissant
      for (const [cat, n] of Object.entries(m.cats).filter(([, n]) => n > 0).slice(0, 4)) assert.equal(await get({ categorie: cat, page: "" }), n, `${qs} → catégorie ${cat}`);
      assert.equal(await get({ etat: "" , categorie: new URLSearchParams(qs).get("categorie") || "" }), m.state.all, `${qs} → tous`);
      assert.equal(await get({ etat: "installed" }), m.state.installed, `${qs} → installés`);
      assert.equal(await get({ etat: "available" }), m.state.available, `${qs} → disponibles`);
      for (const [st, n] of Object.entries(m.styles).slice(0, 4)) assert.equal(await get({ style: st }), n, `${qs} → style ${st}`);
      if (qs === "q=zzzzzz") assert.deepEqual([m.total, m.all, m.state.all], [0, 0, 0]);
    }
  });

  test("page : chaque catégorie a une pastille ; sans résultat avec les autres filtres, elle est inactive ; l'adresse ne porte pas tri=relevance", async () => {
    const html = decode((await adminA.get(`${TH}?site=${A}&q=restaurant`)).text);
    const lib = require("../src/marketing/themes/library");
    for (const c of lib.CATEGORIES) assert.match(html, new RegExp(`data-tg-catlink="${c.key}"`), `pastille ${c.key}`);
    assert.match(html, /is-empty"[^>]*aria-disabled="true" tabindex="-1"/);
    assert.doesNotMatch(html, /tri=relevance/);
    assert.match(html, /<option value="[a-z]+" data-tg-style="[a-z]+"[^>]*disabled>[^<]+\(0\)/, "un style sans résultat est désactivé");
    assert.match(html, /name="etat" value="installed"/, "affichage : choix à un clic");
  });

  test("filtres actifs : une pastille par filtre, retirable seule ; rien sans filtre ; réinitialisation proposée", async () => {
    const none = (await adminA.get(`${TH}?site=${A}&fragment=1`)).text;
    assert.doesNotMatch(none, /mk-tg-chips/); assert.doesNotMatch(none, /data-tg-reset/);
    const f = decode((await adminA.get(`${TH}?site=${A}&fragment=1&q=restaurant&style=chaleureux&etat=available&categorie=restaurant`)).text);
    assert.deepEqual([...f.matchAll(/data-tg-remove="([a-z]+)"/g)].map((m) => m[1]), ["q", "categorie", "style", "etat"]);
    assert.match(f, /aria-label="Retirer le filtre : Recherche : « restaurant »"/); assert.match(f, /data-tg-reset/);
  });

  test("carte : une seule image, pas de pastille mobile ni de ligne de pages ; l'aperçu rapide est proposé avec ses pages ; le lien reste valable sans script", async () => {
    const html = (await adminA.get(`${TH}?site=${A}`)).text;
    assert.doesNotMatch(html, /mk-tg-phone/); assert.doesNotMatch(html, /class="mk-tg-meta"/);
    const link = /<a class="btn btn-outline btn-sm" href="([^"]+\/apercu[^"]*)" data-th-preview data-th-pages="([^"]+)"/.exec(html);
    assert.ok(link, "lien d'aperçu rapide");
    assert.match(link[1], new RegExp(`site=${A}`), "garde le site");
    const pages = JSON.parse(decode(link[2])); assert.ok(pages.length >= 5 && pages.every((p) => p.length === 2));
    assert.match(html, /<dialog class="tq" data-tq aria-labelledby="tq-title">/);
    assert.match(html, /data-tq-prev[^>]*aria-label="Thème précédent"/); assert.match(html, /data-tq-close[^>]*aria-label="Fermer l'aperçu"/);
    const imgs = html.slice(html.indexOf("data-th-grid")).match(/<img class="mk-tg-shot"[^>]*>/g);
    assert.ok(imgs.every((i) => /width="480" height="300"/.test(i)), "dimensions réservées");
    assert.ok(imgs.slice(3).every((i) => /loading="lazy"/.test(i)), "images éloignées chargées au défilement");
  });

  test("rendu de démonstration : mis en cache privé, identique d'un appel à l'autre, liens du site visé, jamais mélangés entre sites", async () => {
    const a1 = await boss.get(`${TH}/atelier-brume/demo/accueil?site=${A}`), a2 = await boss.get(`${TH}/atelier-brume/demo/accueil?site=${A}`);
    const b = await boss.get(`${TH}/atelier-brume/demo/accueil?site=${B}`), p = await boss.get(`${TH}/atelier-brume/demo/accueil`);
    for (const r of [a1, a2, b, p]) { assert.equal(r.status, 200); assert.match(String(r.headers.get("cache-control")), /private, max-age=\d+/); assert.doesNotMatch(String(r.headers.get("cache-control")), /public/); assert.match(String(r.headers.get("x-robots-tag")), /noindex/); }
    assert.equal(a1.text, a2.text);
    assert.match(a1.text, new RegExp(`demo/etudes-de-cas\\?site=${A}`)); assert.match(b.text, new RegExp(`demo/etudes-de-cas\\?site=${B}`));
    assert.doesNotMatch(b.text, new RegExp(`\\?site=${A}\\b`)); assert.doesNotMatch(p.text, /\?site=\d/);
    assert.equal((await new Client(srv.base).get(`${TH}/atelier-brume/demo/accueil?site=${A}`)).status, 302, "anonyme : redirigé, même si la page est en mémoire");
    assert.equal((await boss.get(`${TH}/atelier-brume/demo/page-inconnue?site=${A}`)).status, 404);
  });

  test("lecteur : l'aperçu rapide est proposé mais sans action d'écriture dans les cartes ; fragment sans cadre de page", async () => {
    const html = decode((await viewerA.get(`${TH}?site=${A}`)).text);
    assert.match(html, /data-th-preview/); assert.doesNotMatch(html, /data-th-form/);
    const frag = (await viewerA.get(`${TH}?site=${A}&fragment=1`)).text;
    assert.ok(!/<html/i.test(frag) && /data-tg-meta/.test(frag) && cards(frag) >= 12);
  });

  test("script et styles : annulation des requêtes, cadre détruit à la fermeture, mouvement réduit, aucune règle morte sur l'ancien filtre", () => {
    const js = fs.readFileSync(path.join(__dirname, "..", "public", "js", "cms-themes.js"), "utf8");
    assert.match(js, /ctl\.abort\(\)/); assert.match(js, /frame\.remove\(\)/); assert.match(js, /about:blank/); assert.match(js, /sandbox", "allow-scripts allow-forms"/);
    assert.doesNotMatch(js, /allow-same-origin/);
    const css = fs.readFileSync(path.join(__dirname, "..", "public", "css", "cms.css"), "utf8");
    assert.match(css, /prefers-reduced-motion: reduce\) \{[^}]*\.tq-frame/);
    assert.doesNotMatch(css, /\.mk-tg-card:hover[^{]*\{[^}]*transform/, "aucun déplacement de carte au survol");
    assert.doesNotMatch(fs.readFileSync(path.join(__dirname, "..", "public", "css", "kola-stable.css"), "utf8"), /mk-tg-filters/);
  });
});
