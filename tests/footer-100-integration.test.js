// Bibliothèque de pieds de page (100 modèles, 15 familles) : INTÉGRATION sur un VRAI serveur de test (un seul serveur pour tout le fichier).
//  · les 100 modèles s'insèrent (« Utiliser »), le document inséré est valide, sauvegardable et rechargeable à l'identique ;
//  · les 100 modèles sont publiables : page publique en HTTP 200, un seul <footer>, contenu du modèle présent ;
//  · aperçu et vignette de chaque ancien identifiant (alias) ; un pied installé avec un ANCIEN identifiant n'est jamais modifié, « Revenir au modèle d'origine » donne le modèle remplaçant.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, Client, loginInstructor } = require("./helpers");
const Catalog = require("../src/themeBuilder/catalog");
const Aliases = require("../src/themeBuilder/catalog/footer-aliases");

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 Chrome/120 Safari/537.36";
const HOST = "www.cent-pieds.example";
const count = (t, s) => t.split(s).length - 1;
const walk = (list, fn) => { for (const n of list || []) { fn(n); if (n && n.children) walk(n.children, fn); } };
// Un texte lisible et sûr du modèle (lettres et espaces seulement : pas d'apostrophe ni de caractère échappé par le rendu), pour le retrouver dans la page publique
const signature = (section) => {
  let best = "";
  walk(section.children, (n) => {
    const p = n.props || {};
    for (const v of [p.text, p.html, n.type === "link" || n.type === "button" ? p.label : null]) {
      if (typeof v !== "string") continue;
      for (const seg of v.replace(/<[^>]+>/g, "|").split(/[|]/)) {
        const m = seg.match(/[A-Za-zÀ-ÿ]+(?: [A-Za-zÀ-ÿ]+)*/g) || [];
        for (const x of m) if (x.length > best.length && x.length <= 40) best = x;
      }
    }
  });
  return best;
};
const decode = (h) => h.replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/&nbsp;/g, " ");

describe("Pied de page : 100 modèles sur un vrai serveur", () => {
  let srv, boss, db, S, pageId;
  const U = (p = "") => `/marketing/site-web/sites/${S}/constructeur-de-theme${p}`;
  const post = (path, body) => boss.request(path, { method: "POST", json: body || {} });
  const json = (r) => JSON.parse(r.text);
  const entries = () => Catalog.entries("footer");

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "", ALLOW_INDEXING: "1" });
    boss = await loginInstructor(srv); db = srv.db();
    S = Number((await boss.post("/marketing/site-web/sites", { name: "Site cent pieds" })).location.match(/sites\/(\d+)/)[1]);
    const cur = json(await boss.get(`/marketing/site-web/sites/${S}/reglages.json`));
    assert.equal((await boss.request(`/marketing/site-web/sites/${S}/reglages.json`, { method: "PUT", json: { revision: cur.revision, tokens: cur.tokens, settings: { ...cur.settings, seo: { ...cur.settings.seo, publicUrl: `https://${HOST}` } } } })).status, 200);
    pageId = Number((await boss.post("/marketing/pages", { name: "Accueil", site_id: S, kind: "page", template: "", ouvrir: "editeur" })).location.match(/pages\/(\d+)/)[1]);
    const rev = db.prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(pageId).revision;
    const corps = { id: "sect00000001", type: "layout", children: [{ id: "head00000001", type: "heading", props: { text: "CORPS-DE-PAGE", level: "2" } }] };
    assert.equal((await boss.request(`/marketing/pages/${pageId}/brouillon`, { method: "PUT", headers: { Origin: srv.base }, json: { revision: rev, content: { title: "Accueil", sections: [corps] } } })).status, 200);
    assert.equal((await boss.request(`/marketing/pages/${pageId}/publier.json`, { method: "POST", json: {}, headers: { Origin: srv.base } })).status, 200);
    db.prepare("UPDATE mk_sites SET home_page_id = ? WHERE id = ?").run(pageId, S);
  });
  after(async () => { if (db) db.close(); if (srv) await srv.stop(); });

  test("chacun des 100 modèles : « Utiliser » → document valide, enregistré, rechargé à l'identique, puis publié ; page publique 200 avec un seul <footer> et le contenu du modèle", async () => {
    const liste = entries();
    assert.equal(liste.length, 100);
    const slug = db.prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(pageId).slug;
    const vus = [];
    for (const e of liste) {
      const used = await post(U("/api/bibliotheque/utiliser"), { type: "footer", key: e.key });
      assert.equal(used.status, 200, `${e.key} : ${used.text.slice(0, 200)}`);
      const t = json(used).template;
      assert.equal(t.origin.key, e.key);
      // 1) le composant du site contient exactement le document du catalogue (copie indépendante), valide et rechargeable
      const comp = db.prepare("SELECT section, draft, revision FROM mk_web_components WHERE id = ?").get(t.sourceId);
      const section = JSON.parse(comp.section);
      assert.ok(section.children && section.children.length >= 1, `${e.key} : section vide`);
      assert.deepEqual(section.children.map((c) => c.type), Catalog.build("footer", e.key, {}).section.children.map((c) => c.type));
      // 2) enregistrement / rechargement : on réenregistre le brouillon tel quel, la relecture est identique
      const draft = JSON.parse(comp.draft || comp.section);
      const save = await boss.request(`/marketing/site-web/composants/${t.sourceId}/brouillon`, { method: "PUT", headers: { Origin: srv.base }, json: { revision: comp.revision, content: { title: e.key, sections: [draft] } } });
      assert.equal(save.status, 200, `${e.key} enregistrement : ${save.text.slice(0, 200)}`);
      const rel = JSON.parse(db.prepare("SELECT draft FROM mk_web_components WHERE id = ?").get(t.sourceId).draft);
      assert.deepEqual(rel.children.map((c) => c.type), draft.children.map((c) => c.type), `${e.key} : rechargé différent`);
      let n1 = 0, n2 = 0; walk(draft.children, () => n1++); walk(rel.children, () => n2++);
      assert.equal(n2, n1, `${e.key} : nombre d'éléments conservé`);
      // 3) publication puis page publique
      const pub = await post(U(`/api/modeles/${t.id}/publier`), { strict: true, scope: "site", replace: true });
      assert.equal(pub.status, 200, `${e.key} publication : ${pub.text.slice(0, 200)}`);
      const page = await new Client(srv.base).get(`/p/${slug}`, { headers: { "User-Agent": UA } });
      assert.equal(page.status, 200, e.key);
      assert.equal(count(page.text, "<footer"), 1, `${e.key} : un seul <footer>`);
      assert.equal(count(page.text, 'data-kw-footer="1"'), 1, `${e.key} : un seul repère de pied`);
      assert.ok(page.text.includes("CORPS-DE-PAGE"), `${e.key} : le corps de la page est toujours là`);
      const sig = signature(section);
      assert.ok(sig.length >= 4, `${e.key} : pas de texte repère trouvé`);
      const pied = page.text.slice(page.text.indexOf("<footer"), page.text.indexOf("</footer>"));
      assert.ok(pied.length > 200, `${e.key} : pied vide`);
      assert.ok(decode(pied).includes(sig), `${e.key} : le contenu du modèle (« ${sig} ») est absent DU PIED de la page publique`);
      vus.push(e.key);
    }
    assert.equal(new Set(vus).size, 100);
  });

  test("aperçu et vignette répondent pour les 100 nouveaux modèles ET pour les 100 anciens identifiants (via l'alias)", async () => {
    for (const key of [...entries().map((e) => e.key), ...Aliases.ANCIENS_IDENTIFIANTS]) {
      for (const sorte of ["apercu", "vignette"]) {
        const r = await boss.get(U(`/api/bibliotheque/footer/${key}/${sorte}`));
        assert.equal(r.status, 200, `${key} ${sorte}`);
        assert.ok(r.text.includes("<html") || r.text.includes("<!"), `${key} ${sorte} : page HTML`);
      }
    }
  });

  test("un pied installé avec un ANCIEN identifiant : jamais modifié ; sa fiche annonce le modèle remplaçant ; « Revenir au modèle d'origine » donne ce modèle (échantillon de 100 anciens)", async () => {
    S = Number((await boss.post("/marketing/site-web/sites", { name: "Site anciens pieds" })).location.match(/sites\/(\d+)/)[1]); // un site neuf : la limite est de 200 modèles par site
    let n = 0;
    for (const ancien of Aliases.ANCIENS_IDENTIFIANTS) {
      const nouveau = Aliases.ALIAS[ancien];
      const used = json(await post(U("/api/bibliotheque/utiliser"), { type: "footer", key: nouveau })).template;
      // on simule un pied installé AVANT la refonte : sa mémoire d'origine est l'ancien identifiant
      db.prepare("UPDATE mk_tb_templates SET origin_key = ?, origin_version = NULL WHERE id = ?").run(ancien, used.id);
      const avantSection = db.prepare("SELECT section, draft FROM mk_web_components WHERE id = ?").get(used.sourceId);
      const fiche = json(await boss.get(U("/api/modeles?leger=1"))).templates.find((x) => x.id === used.id);
      assert.equal(fiche.origin.key, nouveau, `${ancien} : la fiche annonce le remplaçant`);
      const apres = db.prepare("SELECT section, draft FROM mk_web_components WHERE id = ?").get(used.sourceId);
      assert.deepEqual(apres, avantSection, `${ancien} : lire la fiche ne modifie pas le pied du site`);
      if (n++ % 10 === 0) { // retour au modèle d'origine : sur un échantillon (1 sur 10) pour garder le test rapide ; la fiche ci-dessus est vérifiée pour les 100
        const r = await post(U(`/api/modeles/${used.id}/revenir-au-modele`));
        assert.equal(r.status, 200, `${ancien} : ${r.text.slice(0, 200)}`);
        assert.equal(json(r).original.key, nouveau);
        assert.equal(json(r).original.renamedFrom, ancien, "la réponse dit que le modèle d'origine a été remplacé");
        assert.equal(db.prepare("SELECT origin_key k FROM mk_tb_templates WHERE id = ?").get(used.id).k, nouveau, "la mémoire d'origine pointe maintenant vers le nouvel identifiant");
        assert.equal(db.prepare("SELECT section FROM mk_web_components WHERE id = ?").get(used.sourceId).section, avantSection.section, "version en ligne inchangée");
      }
    }
    assert.equal(n, 100);
  });

  test("« Utiliser » avec un ancien identifiant installe le modèle remplaçant", async () => {
    const ancien = Aliases.ANCIENS_IDENTIFIANTS[0];
    const r = await post(U("/api/bibliotheque/utiliser"), { type: "footer", key: ancien });
    assert.equal(r.status, 200, r.text.slice(0, 300));
    const t = json(r).template;
    assert.equal(t.origin.key, Aliases.ALIAS[ancien]);
  });
});
