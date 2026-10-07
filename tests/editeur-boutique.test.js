// Widget « Bouton d'achat » (E-commerce) : il utilise le VRAI panier de KOLAKISA. Formation obligatoire et publiée, prix venu du
// catalogue, le bouton ajoute vraiment la formation au panier (ou mène à la commande) et disparaît si la formation est dépubliée.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY, freshMarketing } = require("./marketing-helpers");
const pages = require("../src/marketing/pages");
const nodes = require("../src/marketing/pages/nodes");
const { startServer, loginInstructor, newStudent, createCourse } = require("./helpers");

describe("bouton d'achat (sans serveur)", () => {
  test("fiche de bibliothèque : catégorie E-commerce, mots de recherche, formation demandée à l'ajout", () => {
    const spec = nodes.editorSpec();
    const t = spec.types.find((x) => x.type === "addtocart");
    assert.equal(t.group, "commerce");
    assert.equal(spec.widgetGroups.commerce, "E-commerce");
    assert.ok(/panier/.test(t.keywords) && /acheter/.test(t.keywords));
    assert.equal(t.asks, "course");
  });
});

describe("bouton d'achat (vrai serveur)", () => {
  let srv, boss, db, course, free, pageId;
  const put = (content) => {
    const rev = Number(db.prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(pageId).revision);
    return boss.request(`/marketing/pages/${pageId}/brouillon`, { method: "PUT", json: { revision: rev, content } });
  };
  const sections = (props, id = "addc00000001") => [{ id: "sect00000001", type: "layout", children: [{ id, type: "addtocart", props }] }];
  const publish = async () => { assert.equal((await boss.request(`/marketing/pages/${pageId}/publier.json`, { method: "POST", json: {} })).status, 200); return db.prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(pageId).slug; };
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db();
    course = await createCourse(boss, srv, { title: "Photo pour débutants", price: 29 });
    free = await createCourse(boss, srv, { title: "Initiation gratuite", price: 0 });
    pageId = Number((await boss.post("/marketing/pages", { name: "Boutique" })).location.match(/(\d+)$/)[1]);
  });
  after(() => srv.stop());

  test("formation obligatoire et publiée ; valeurs par défaut ; libellé selon l'action", async () => {
    assert.equal((await put({ sections: sections({ courseId: 999999 }) })).status, 422, "formation inconnue refusée");
    const ok = await put({ sections: sections({ courseId: course.id }) });
    assert.equal(ok.status, 200, ok.text.slice(0, 150));
    const saved = JSON.parse(db.prepare("SELECT draft FROM mk_landing_pages WHERE id = ?").get(pageId).draft).sections[0].children[0].props;
    assert.deepEqual(saved, { courseId: course.id, mode: "cart", label: "Ajouter au panier", variant: "primary", size: "md", showPrice: false });
    await put({ sections: sections({ courseId: course.id, mode: "buy" }) });
    assert.equal(JSON.parse(db.prepare("SELECT draft FROM mk_landing_pages WHERE id = ?").get(pageId).draft).sections[0].children[0].props.label, "Acheter maintenant");
  });

  test("page publiée : formulaire vers le vrai panier, prix du catalogue, « acheter maintenant » mène à la commande", async () => {
    await put({ sections: [{ id: "sect00000001", type: "layout", children: [
      { id: "addc00000001", type: "addtocart", props: { courseId: course.id, showPrice: true, variant: "outline", size: "lg" } },
      { id: "addc00000002", type: "addtocart", props: { courseId: free.id, mode: "buy", showPrice: true } },
    ] }] });
    const slug = await publish();
    const html = (await boss.get(`/p/${slug}`)).text;
    assert.match(html, new RegExp(`<form class="kw-node kw-addtocart kw-n-addc00000001 kw-buy" method="post" action="/panier/ajouter/${course.id}">`));
    assert.match(html, /kw-buy-price">29,00 €</);
    assert.match(html, /class="kw-button kw-btn-outline kw-btn-lg">Ajouter au panier</);
    assert.match(html, new RegExp(`action="/panier/ajouter/${free.id}"[^>]*><input type="hidden" name="buyNow" value="1"><span class="kw-buy-price">Gratuit</span>`));
    assert.doesNotMatch(html.split("kw-n-addc00000001")[1].split("</form>")[0], /buyNow/, "le bouton « panier » n'envoie pas à la commande");
    // le bouton fonctionne vraiment : un élève l'utilise
    const student = await newStudent(srv);
    const add = await student.post(`/panier/ajouter/${course.id}`, {}, { headers: { Referer: `${srv.base}/p/${slug}` } });
    assert.equal(add.status, 302);
    assert.equal(add.location, `/p/${slug}`, "retour sur la page de vente");
    assert.match((await student.get("/panier")).text, /Photo pour débutants/);
    const buyNow = await student.post(`/panier/ajouter/${free.id}`, { buyNow: "1" });
    assert.equal(buyNow.location, "/commande", "« acheter maintenant » : directement la commande");
  });

  test("avis de la formation : note et nombre d'avis RÉELS ; texte honnête sans avis ; jamais de chiffre inventé", async () => {
    const solo = await createCourse(boss, srv, { title: "Formation sans avis", price: 10 });
    await put({ sections: [{ id: "sect00000001", type: "layout", children: [
      { id: "rate00000001", type: "courserating", props: { courseId: solo.id } },
      { id: "rate00000002", type: "courserating", props: { courseId: free.id, showCount: false } },
    ] }] });
    let slug = await publish();
    let html = (await boss.get(`/p/${slug}`)).text;
    assert.equal((html.match(/Pas encore d&#39;avis|Pas encore d'avis/g) || []).length, 2, "aucun avis : texte honnête, pas d'étoiles inventées");
    assert.doesNotMatch(html, /kw-stars/);
    // des avis réels : 5, 4 et 4 → moyenne 4,3 sur 3 avis
    for (const [rating, i] of [[5, 1], [4, 2], [4, 3]]) {
      const u = db.prepare("INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, 'x', 'etudiant')").run(`avis${i}`, `avis${i}@test.local`).lastInsertRowid;
      db.prepare("INSERT INTO reviews (course_id, user_id, rating, comment) VALUES (?, ?, ?, '')").run(free.id, u, rating);
    }
    slug = await publish();
    html = (await boss.get(`/p/${slug}`)).text;
    const second = html.split("kw-n-rate00000002")[1].split("</p>")[0];
    assert.match(second, /aria-label="Note : 4,3 sur 5"/, "moyenne réelle, sans le nombre d'avis quand il est masqué");
    assert.match(second, /<strong>4,3<\/strong>/);
    assert.doesNotMatch(second, /\(3 avis\)/);
    await put({ sections: [{ id: "sect00000001", type: "layout", children: [{ id: "rate00000003", type: "courserating", props: { courseId: free.id } }] }] });
    html = (await boss.get(`/p/${await publish()}`)).text;
    assert.match(html, /aria-label="Note : 4,3 sur 5, 3 avis"/);
    assert.match(html, /\(3 avis\)/);
    assert.equal((await put({ sections: [{ id: "sect00000001", type: "layout", children: [{ id: "rate00000004", type: "courserating", props: { courseId: 999999 } }] }] })).status, 422, "formation inconnue refusée");
  });

  test("dans l'éditeur le bouton est inactif ; formation dépubliée : il disparaît de la page publiée", async () => {
    const rendu = await boss.request(`/marketing/pages/${pageId}/rendu`, { method: "POST", json: { content: { sections: sections({ courseId: course.id }) } } });
    assert.match(rendu.text, /class="kw-button kw-btn-primary" disabled>/);
    db.prepare("UPDATE courses SET published = 0 WHERE id = ?").run(course.id);
    await put({ sections: sections({ courseId: free.id }) }); // la page enregistrée reste valide
    const slug = await publish();
    assert.match((await boss.get(`/p/${slug}`)).text, /kw-addtocart/);
    db.prepare("UPDATE courses SET published = 0 WHERE id = ?").run(free.id);
    assert.doesNotMatch((await boss.get(`/p/${slug}`)).text, /kw-addtocart|panier\/ajouter/, "plus de bouton vers une formation indisponible");
  });
});
