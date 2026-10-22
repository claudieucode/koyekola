// Marketing R5 (3/3) — pages : liste des modèles (catégories, recherche), bibliothèque avec aperçus, éditeur en trois colonnes.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { startServer, Client, loginInstructor, newStudent } = require("./helpers");
const { TEST_KEY } = require("./marketing-helpers");
const { STARTERS } = require("../src/marketing/templates/starters");
const { TYPES } = require("../src/marketing/templates/blocks");
const { CATEGORIES } = require("../src/marketing/templates/categories");

let srv, boss;
const sql = (query, ...args) => { const db = srv.db(); const r = db.prepare(query).all(...args); db.close(); return r; };
const run = (query, ...args) => { const db = srv.db(); db.prepare(query).run(...args); db.close(); };
const member = async (role) => {
  const c = await newStudent(srv);
  run("INSERT INTO mk_org_members (organization_id, user_id, role) VALUES (1, (SELECT id FROM users WHERE email = ?), ?)", c.email, role);
  return c;
};
const tplId = (name) => sql("SELECT id FROM mk_templates WHERE name = ?", name)[0]?.id;
const editorData = (html) => JSON.parse(html.match(/<script type="application\/json" id="mk-editor-data">([\s\S]*?)<\/script>/)[1]);
const rowNames = (html) => [...html.matchAll(/<a href="\/marketing\/modeles\/\d+">([^<]+)<\/a>/g)].map((m) => m[1].replace(/&#39;/g, "'"));
const flash = async (client, res) => (await client.get(res.location)).text;
const create = (name, starter, kind = "marketing") => boss.post("/marketing/modeles", { name, starter, kind });

before(async () => {
  srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
  boss = await loginInstructor(srv);
});
after(() => srv.stop());

describe("liste : état vide et création rapide", () => {
  test("aucun modèle : état vide avec renvoi vers la bibliothèque", async () => {
    const html = (await boss.get("/marketing/modeles")).text;
    assert.match(html, /class="mk-empty"/);
    assert.match(html, /Aucun modèle/);
    assert.match(html, /href="\/marketing\/modeles\/bibliotheque"/);
  });
  test("formulaire de création rapide : nom, type, modèle de départ regroupé par catégorie (tous les modèles proposés)", async () => {
    const html = (await boss.get("/marketing/modeles")).text;
    assert.match(html, /Créer un modèle/);
    assert.match(html, /<select id="m-starter" name="starter">/);
    for (const key of Object.keys(STARTERS)) assert.match(html, new RegExp(`<option value="${key}"`), key);
    assert.match(html, /<optgroup label="Bienvenue">/);
    assert.match(html, /id="creer"/);
  });
});

describe("création depuis la bibliothèque", () => {
  test("la catégorie du modèle de départ est enregistrée", async () => {
    const res = await create("Offre d'été", "promo");
    assert.match(res.location, /^\/marketing\/modeles\/\d+$/);
    assert.equal(sql("SELECT category, kind FROM mk_templates WHERE name = ?", "Offre d'été")[0].category, "promo");
  });
  test("un modèle transactionnel de départ crée un modèle transactionnel, même si « marketing » est envoyé", async () => {
    await create("Confirmation commande", "order_confirmation", "marketing");
    assert.equal(sql("SELECT kind, category FROM mk_templates WHERE name = ?", "Confirmation commande")[0].kind, "transactional");
  });
  test("chaque modèle de départ peut être créé par l'interface", async () => {
    for (const key of Object.keys(STARTERS)) {
      const res = await create(`Départ ${key}`, key);
      assert.equal(res.status, 302, key);
      assert.match(res.location, /^\/marketing\/modeles\/\d+$/, key);
    }
  });
  test("erreurs claires conservées : nom double, vide, modèle de départ inconnu", async () => {
    assert.match(await flash(boss, await create("offre d'été", "promo")), /porte déjà ce nom/);
    assert.match(await flash(boss, await create("  ", "promo")), /obligatoire/);
    assert.match(await flash(boss, await create("Bizarre", "__proto__")), /départ|inconnu/i);
  });
});

describe("liste : catégories, recherche, tri", () => {
  test("onglets de catégories avec effectifs, onglet courant marqué", async () => {
    const html = (await boss.get("/marketing/modeles")).text;
    assert.match(html, /<nav class="mk-tabs" aria-label="Filtrer par catégorie">/);
    assert.match(html, /<a class="mk-tab" href="\/marketing\/modeles" aria-current="page"[^>]*>Tous <span class="mk-tab-count">\d+<\/span><\/a>/);
    assert.match(html, /<a class="mk-tab" href="\/marketing\/modeles\?categorie=promo"[^>]*>Promotion <span class="mk-tab-count">2<\/span><\/a>/);
    assert.doesNotMatch(html, />Événement <span class="mk-tab-count">0</, "les catégories vides n'ont pas d'onglet");
  });
  test("filtre par catégorie et par type", async () => {
    const promo = rowNames((await boss.get("/marketing/modeles?categorie=promo")).text).sort();
    assert.deepEqual(promo, ["Départ promo", "Offre d'été"]);
    assert.match((await boss.get("/marketing/modeles?categorie=promo")).text, /<a class="mk-tab" href="[^"]*categorie=promo[^"]*" aria-current="page"[^>]*>Promotion/);
    const tx = rowNames((await boss.get("/marketing/modeles?type=transactional")).text);
    assert.ok(tx.includes("Confirmation commande") && !tx.includes("Offre d'été"));
  });
  test("recherche dans le nom et l'objet ; conservée dans les onglets ; nombre de résultats annoncé", async () => {
    const html = (await boss.get("/marketing/modeles?q=offre")).text;
    assert.ok(rowNames(html).includes("Offre d'été"));
    assert.match(html, /<p class="mk-filter-count" role="status">\d+ modèle/);
    assert.match(html, /<a class="mk-tab" href="[^"]*q=offre[^"]*"[^>]*>Tous/);
    assert.match(html, /<input id="f-q" type="search" name="q" value="offre"/);
  });
  test("tri par nom avec sens indiqué ; paramètres invalides ignorés sans erreur", async () => {
    const asc = (await boss.get("/marketing/modeles?tri=name&sens=asc")).text;
    const names = rowNames(asc);
    assert.deepEqual(names, [...names].sort((a, b) => a.localeCompare(b, "fr", { sensitivity: "base" })));
    assert.match(asc, /<th scope="col" aria-sort="ascending"><a href="[^"]*tri=name&amp;sens=desc[^"]*">Modèle<\/a><\/th>/);
    for (const q of ["categorie=zzz", "type=zzz", "tri=zzz&sens=x", "tri=id;DROP TABLE t"]) assert.equal((await boss.get(`/marketing/modeles?${q}`)).status, 200, q);
    assert.ok(sql("SELECT COUNT(*) n FROM mk_templates")[0].n >= 15);
  });
  test("aucun résultat : message et lien de réinitialisation", async () => {
    const html = (await boss.get("/marketing/modeles?q=introuvable-xyz")).text;
    assert.match(html, /Aucun modèle ne correspond/);
    assert.match(html, /<a [^>]*href="\/marketing\/modeles"[^>]*>Réinitialiser/);
  });
  test("colonnes : catégorie lisible, type, blocs, utilisé par, date ; noms échappés", async () => {
    await boss.post("/marketing/modeles", { name: "<i>x</i>", starter: "blank" });
    const html = (await boss.get("/marketing/modeles")).text;
    for (const h of ["Modèle", "Catégorie", "Type", "Blocs", "Utilisé par", "Modifié le"]) assert.match(html, new RegExp(`<th[^>]*>(?:<a [^>]+>)?${h}`), h);
    assert.match(html, /data-label="Catégorie">Promotion</);
    assert.doesNotMatch(html, /<i>x<\/i>/);
    assert.match(html, /&lt;i&gt;x&lt;\/i&gt;/);
  });
  test("utilisé par : nombre de campagnes", async () => {
    run("INSERT INTO mk_campaigns (organization_id, name, template_id, target_type, target_id) VALUES (1, 'C', ?, 'list', 1)", tplId("Offre d'été"));
    assert.match((await boss.get("/marketing/modeles?q=Offre")).text, /data-label="Utilisé par">1 campagne</);
  });
  test("actions : dupliquer et supprimer (avec confirmation) pour les éditeurs ; rien pour le lecteur", async () => {
    const html = (await boss.get("/marketing/modeles?q=Offre")).text;
    const id = tplId("Offre d'été");
    assert.match(html, new RegExp(`<form action="/marketing/modeles/${id}/dupliquer" method="post"`));
    assert.match(html, new RegExp(`<form action="/marketing/modeles/${id}/supprimer" method="post"[\\s\\S]*?data-mk-confirm="[^"]*campagne`));
    const v = (await (await member("viewer")).get("/marketing/modeles?q=Offre")).text;
    assert.doesNotMatch(v, /dupliquer|supprimer|<select id="m-starter"/);
  });
  test("adresse du pied de page : bloc conservé", async () => {
    assert.match((await boss.get("/marketing/modeles")).text, /id="adresse"/);
  });
});

describe("bibliothèque avec aperçus", () => {
  test("catégories en navigation, une carte par modèle, aperçu isolé et chargé à la demande", async () => {
    const html = (await boss.get("/marketing/modeles/bibliotheque")).text;
    assert.match(html, /<nav class="mk-tabs" aria-label="Catégories de la bibliothèque">/);
    for (const c of CATEGORIES) assert.match(html, new RegExp(`id="cat-${c.key}"`), c.key);
    assert.equal((html.match(/class="mk-lib-card"/g) || []).length, Object.keys(STARTERS).length);
    for (const key of Object.keys(STARTERS)) {
      assert.match(html, new RegExp(`<iframe class="mk-lib-frame" src="/marketing/modeles/bibliotheque/${key}/apercu" sandbox="" loading="lazy" tabindex="-1" title="Aperçu : [^"]+"`), key);
    }
  });
  test("chaque carte propose « Utiliser ce modèle » avec un nom prérempli (éditeurs seulement)", async () => {
    const html = (await boss.get("/marketing/modeles/bibliotheque")).text;
    assert.match(html, /<form action="\/marketing\/modeles" method="post" class="mk-lib-form">/);
    assert.match(html, /<input type="hidden" name="starter" value="promo">/);
    assert.match(html, /<input type="hidden" name="kind" value="transactional">/);
    assert.match(html, /Utiliser ce modèle/);
    const v = (await (await member("viewer")).get("/marketing/modeles/bibliotheque")).text;
    assert.doesNotMatch(v, /Utiliser ce modèle|<form action="\/marketing\/modeles"/);
    assert.equal((v.match(/class="mk-lib-card"/g) || []).length, Object.keys(STARTERS).length, "le lecteur voit la bibliothèque");
  });
  test("descriptions et libellés échappés et lisibles", async () => {
    const html = (await boss.get("/marketing/modeles/bibliotheque")).text;
    assert.match(html, /Offre spéciale/);
    assert.match(html, /Invitation à un webinaire/);
  });
  test("accès : anonyme redirigé, étudiant refusé", async () => {
    assert.match((await new Client(srv.base).get("/marketing/modeles/bibliotheque")).location, /^\/connexion/);
    assert.equal((await (await newStudent(srv)).get("/marketing/modeles/bibliotheque")).status, 403);
  });
});

describe("aperçu d'un modèle de départ (contenu de l'iframe)", () => {
  test("document HTML complet, en-têtes restrictifs (aucun script, cadre du même site seulement)", async () => {
    const r = await boss.get("/marketing/modeles/bibliotheque/promo/apercu");
    assert.equal(r.status, 200);
    assert.match(r.headers.get("content-type"), /text\/html/);
    assert.match(r.text, /^<!DOCTYPE html>/);
    assert.match(r.headers.get("content-security-policy"), /default-src 'none'/);
    assert.match(r.headers.get("content-security-policy"), /style-src 'unsafe-inline'/);
    assert.doesNotMatch(r.headers.get("content-security-policy"), /script-src[^;]*(?<!none)'unsafe/);
    assert.equal(r.headers.get("x-frame-options"), "SAMEORIGIN");
    assert.match(r.headers.get("x-robots-tag"), /noindex/);
    assert.doesNotMatch(r.text, /<script|onerror=|javascript:/i);
  });
  test("tous les modèles de départ s'affichent", async () => {
    for (const key of Object.keys(STARTERS)) {
      const r = await boss.get(`/marketing/modeles/bibliotheque/${key}/apercu`);
      assert.equal(r.status, 200, key);
      assert.match(r.text, /<html/);
    }
  });
  test("modèle inconnu, noms piégés : 404 ; lecteur autorisé ; étudiant et anonyme refusés", async () => {
    for (const key of ["inexistant", "__proto__", "constructor", "..%2f..%2fetc", "promo%00"]) assert.equal((await boss.get(`/marketing/modeles/bibliotheque/${key}/apercu`)).status, 404, key);
    assert.equal((await (await member("viewer")).get("/marketing/modeles/bibliotheque/promo/apercu")).status, 200);
    assert.equal((await (await newStudent(srv)).get("/marketing/modeles/bibliotheque/promo/apercu")).status, 403);
    assert.match((await new Client(srv.base).get("/marketing/modeles/bibliotheque/promo/apercu")).location, /^\/connexion/);
  });
  test("la route « bibliotheque » ne masque pas un modèle enregistré (pas de conflit avec /modeles/:id)", async () => {
    assert.equal((await boss.get(`/marketing/modeles/${tplId("Offre d'été")}`)).status, 200);
    assert.equal((await boss.get("/marketing/modeles/999999")).status, 404);
  });
});

describe("éditeur : barre d'outils, onglets, canevas, réglages", () => {
  let id, html;
  before(async () => { id = tplId("Offre d'été"); html = (await boss.get(`/marketing/modeles/${id}`)).text; });

  test("quatre zones : onglets d'outils, panneau, canevas (rendu réel sans script), réglages du bloc", () => {
    assert.match(html, /<div class="mk-builder" id="mk-editor">/);
    assert.match(html, /<nav class="mk-b-rail" role="tablist" aria-label="Outils de l'éditeur" aria-orientation="vertical">/);
    assert.match(html, /<nav class="mk-palette" id="mk-palette" aria-label="Ajouter un bloc">/);
    assert.match(html, /<iframe id="mk-frame"[^>]*sandbox="allow-same-origin"/, "canevas : rendu manipulable par l'éditeur, aucun script");
    assert.match(html, /<iframe id="mk-preview-frame"[^>]*sandbox="allow-same-origin"/, "aperçu plein écran : aucun script (sandbox sans allow-scripts), mesurable par l'éditeur");
    assert.match(html, /<aside class="mk-b-props" id="mk-props" aria-label="Réglages du bloc sélectionné">/);
  });
  test("la palette propose CHAQUE type de bloc, en groupes, avec icône et description, sans « HTML libre »", () => {
    for (const type of TYPES) assert.match(html, new RegExp(`<button type="button" class="mk-palette-btn" data-add="${type}"[^>]* draggable="true" aria-label="Ajouter un bloc « [^»]+ » : [^"]+"`), type);
    for (const group of ["Texte", "Médias", "Actions", "Mise en page"]) assert.match(html, new RegExp(`<span class="mk-palette-title-text">${group}</span>`), group);
    assert.doesNotMatch(html, /data-add="(html|code|embed|iframe|script)"/);
  });
  test("annuler / rétablir : boutons nommés, désactivés au départ, raccourcis annoncés", () => {
    assert.match(html, /id="mk-undo" aria-label="Annuler la dernière modification \(Ctrl\+Z\)" data-tip="Annuler" disabled>/);
    assert.match(html, /id="mk-redo" aria-label="Rétablir \(Ctrl\+Maj\+Z\)" data-tip="Rétablir" disabled>/);
  });
  test("onglets accessibles (Blocs, Structure, Médias, Styles, Message, Vérification) ; tous les champs historiques sont toujours là", () => {
    assert.match(html, /role="tab" class="mk-b-tab" id="tab-blocks" data-pane="blocks" aria-controls="pane-blocks" aria-selected="true" tabindex="0"/);
    for (const key of ["structure", "media", "styles", "message", "check"]) assert.match(html, new RegExp(`id="tab-${key}" data-pane="${key}" aria-controls="pane-${key}" aria-selected="false" tabindex="-1"`), key);
    assert.match(html, /id="pane-message" role="tabpanel" aria-labelledby="tab-message" hidden/);
    for (const field of ["t-name", "t-kind", "t-category", "t-subject", "t-preheader", "t-bg", "t-cbg", "t-text", "t-accent", "t-font", "t-footer", "mk-var", "mk-contact", "mk-save", "mk-status", "mk-live"]) assert.ok(html.includes(`id="${field}"`), field);
    // fonctions conservées : versions, test, duplication, suppression
    assert.match(html, /action="\/marketing\/modeles\/\d+\/restaurer"|Aucune version précédente/);
    assert.match(html, /action="\/marketing\/modeles\/\d+\/test"/);
    assert.match(html, /action="\/marketing\/modeles\/\d+\/dupliquer"/);
    assert.match(html, /action="\/marketing\/modeles\/\d+\/supprimer"/);
  });
  test("champ « catégorie » : toutes les catégories proposées", () => {
    assert.match(html, /<select id="t-category">/);
    for (const c of CATEGORIES) assert.match(html, new RegExp(`<option value="${c.key}">${c.label.replace(/'/g, "&#39;")}</option>`), c.key);
  });
  test("données JSON : catégorie du modèle, catégories, formations publiées", async () => {
    const data = editorData(html);
    assert.equal(data.template.category, "promo");
    assert.deepEqual(data.categories.map((c) => c.key), CATEGORIES.map((c) => c.key));
    assert.ok(Array.isArray(data.courses));
  });
  test("lecteur : consultation seule, sans palette d'ajout ni bouton d'enregistrement", async () => {
    const v = (await (await member("viewer")).get(`/marketing/modeles/${id}`)).text;
    assert.equal(editorData(v).readOnly, true);
    assert.doesNotMatch(v, /data-add=|id="mk-save"|id="mk-undo"|id="mk-media-file"/);
  });
  test("le script de l'éditeur est servi et déclare l'historique", async () => {
    const js = await boss.get("/js/marketing-editor.js");
    assert.equal(js.status, 200);
    assert.match(js.text, /mk-undo/);
    assert.match(js.text, /mk-redo/);
    // innerHTML : uniquement les icônes du registre fournies par le serveur (jamais une donnée saisie)
    const uses = js.text.split("\n").filter((l) => /innerHTML\s*=/.test(l));
    assert.ok(uses.length > 0);
    for (const l of uses) assert.match(l, /innerHTML = (ICONS\[(name|a\[0\])\] \|\| ""|info\.icon \|\| ""|\(BLOCKS\[b\.type\] \|\| \{\}\)\.icon \|\| "")/, l.trim());
  });
});

describe("éditeur : enregistrement, catégorie et nouveaux blocs", () => {
  let id, version;
  before(async () => {
    id = tplId("Départ blank");
    version = editorData((await boss.get(`/marketing/modeles/${id}`)).text).template.version;
  });
  const save = (template, v) => boss.postJson(`/marketing/modeles/${id}`, { template, version: v });
  const base = (over = {}) => ({ name: "Départ blank", kind: "marketing", subject: "Sujet", preheader: "Aperçu", blocks: [{ type: "text", markdown: "Bonjour" }], ...over });

  test("nouveaux blocs : citation, liste, réseaux sociaux, vidéo enregistrés et normalisés", async () => {
    const blocks = [
      { type: "quote", text: "Belle idée", author: "Awa" },
      { type: "list", style: "checks", items: ["Un", "Deux"] },
      { type: "social", links: [{ network: "facebook", url: "https://facebook.com/x" }] },
      { type: "video", url: "https://youtube.com/watch?v=1", thumbnail: "https://i.fr/a.jpg", title: "Ma vidéo" },
    ];
    const r = await save(base({ blocks, category: "newsletter" }), version);
    assert.equal(r.status, 200, r.text);
    version = JSON.parse(r.text).version;
    const data = editorData((await boss.get(`/marketing/modeles/${id}`)).text);
    assert.deepEqual(data.template.blocks.map((b) => b.type), ["quote", "list", "social", "video"]);
    assert.equal(data.template.category, "newsletter");
    assert.equal(sql("SELECT category FROM mk_templates WHERE id = ?", id)[0].category, "newsletter");
  });
  test("catégorie invalide : 400, rien d'enregistré", async () => {
    const r = await save(base({ category: "nimporte" }), version);
    assert.equal(r.status, 400);
    assert.match(JSON.parse(r.text).error, /Catégorie/);
    assert.equal(sql("SELECT category FROM mk_templates WHERE id = ?", id)[0].category, "newsletter");
  });
  test("bloc invalide : 400 avec le numéro du bloc", async () => {
    const r = await save(base({ blocks: [{ type: "text", markdown: "ok" }, { type: "social", links: [{ network: "facebook", url: "http://facebook.com/x" }] }] }), version);
    assert.equal(r.status, 400);
    assert.match(JSON.parse(r.text).error, /Bloc 2/);
  });
  test("aucun bloc « HTML libre » n'est accepté", async () => {
    const r = await save(base({ blocks: [{ type: "html", html: "<script>alert(1)</script>" }] }), version);
    assert.equal(r.status, 400);
    assert.match(JSON.parse(r.text).error, /inconnu/i);
  });
  test("aperçu (éditeur) des nouveaux blocs : HTML sans balise dangereuse", async () => {
    const r = await boss.postJson("/marketing/modeles/apercu", { template: base({ blocks: [{ type: "quote", text: "<script>x</script>" }, { type: "video", url: "https://y.fr/v", title: "T" }] }) });
    assert.equal(r.status, 200);
    const html = JSON.parse(r.text).html;
    assert.doesNotMatch(html, /<script>x/);
    assert.match(html, /Regarder la vidéo/);
  });

  describe("bloc formation du catalogue", () => {
    let courseId;
    before(() => {
      run("INSERT INTO courses (instructor_id, title, slug, subtitle, price_cents, published) VALUES ((SELECT id FROM users WHERE role = 'formateur' LIMIT 1), 'Excel <pro>', 'excel-pro', 'De zéro à expert', 4900, 1)");
      run("INSERT INTO courses (instructor_id, title, slug, published) VALUES ((SELECT id FROM users WHERE role = 'formateur' LIMIT 1), 'Brouillon caché', 'brouillon-cache', 0)");
      courseId = sql("SELECT id FROM courses WHERE slug = 'excel-pro'")[0].id;
    });
    test("la liste proposée à l'éditeur ne contient que les formations publiées", async () => {
      const data = editorData((await boss.get(`/marketing/modeles/${id}`)).text);
      assert.deepEqual(data.courses.map((c) => c.title), ["Excel <pro>"]);
      assert.deepEqual(Object.keys(data.courses[0]).sort(), ["id", "title"]);
      assert.doesNotMatch((await boss.get(`/marketing/modeles/${id}`)).text, /Brouillon caché/);
    });
    test("enregistrement : instantané pris dans le catalogue (titre, prix, adresse du site), relu ensuite", async () => {
      const r = await save(base({ blocks: [{ type: "text", markdown: "Bonjour" }, { type: "course", courseId }] }), version);
      assert.equal(r.status, 200, r.text);
      const body = JSON.parse(r.text);
      version = body.version;
      const block = editorData((await boss.get(`/marketing/modeles/${id}`)).text).template.blocks[1];
      assert.deepEqual(body.courseSnapshots[block.id], block.snapshot, "la réponse renvoie l'instantané pour que l'éditeur le conserve");
      assert.equal(block.snapshot.title, "Excel <pro>");
      assert.equal(block.snapshot.priceCents, 4900);
      assert.equal(block.snapshot.url, "https://k.test/cours/excel-pro");
    });
    test("l'aperçu affiche la carte (titre échappé)", async () => {
      const r = await boss.postJson("/marketing/modeles/apercu", { template: base({ blocks: [{ type: "course", courseId }] }) });
      const html = JSON.parse(r.text).html;
      assert.match(html, /Excel &lt;pro&gt;/);
      assert.doesNotMatch(html, /Excel <pro>/);
      assert.match(html, /49,00 €/);
    });
    test("formation inconnue ou non publiée : 400 avec un message clair", async () => {
      const hidden = sql("SELECT id FROM courses WHERE slug = 'brouillon-cache'")[0].id;
      for (const cid of [999999, hidden]) {
        const r = await save(base({ blocks: [{ type: "course", courseId: cid }] }), version);
        assert.equal(r.status, 400);
        assert.match(JSON.parse(r.text).error, /formation/i);
      }
    });
    test("un instantané forgé n'est pas cru", async () => {
      const r = await save(base({ blocks: [{ type: "course", courseId, snapshot: { id: 12345, title: "Faux", subtitle: "", priceCents: 1, url: "https://evil.fr/", image: "" } }] }), version);
      assert.equal(r.status, 200, r.text);
      version = JSON.parse(r.text).version;
      const snap = editorData((await boss.get(`/marketing/modeles/${id}`)).text).template.blocks[0].snapshot;
      assert.equal(snap.title, "Excel <pro>");
      assert.equal(snap.url, "https://k.test/cours/excel-pro");
    });
  });
});
