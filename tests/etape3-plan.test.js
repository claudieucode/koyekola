// Fiche formation : « Voir le plan du cours » (modale) et « Télécharger le plan du cours (PDF) ».
const { test, before, after, describe } = require("node:test");
const assert = require("node:assert/strict");
const { startServer, Client, loginInstructor, newStudent, createCourse, buy } = require("./helpers");

let srv, prof, eleve, course;
const anon = () => new Client(srv.base);
const q = (sql, ...a) => {
  const db = srv.db();
  const r = db.prepare(sql).all(...a);
  db.close();
  return r;
};

// Même décodeur de texte PDF que etape3-pdf (PDF non compressé)
function pdfText(buffer) {
  const lines = [];
  for (const m of buffer.toString("latin1").matchAll(/\[((?:<[0-9a-f]*>|\s|-?[\d.]+)*)\]\s*TJ/gi)) {
    lines.push([...m[1].matchAll(/<([0-9a-f]*)>/gi)].map((h) => [...Buffer.from(h[1], "hex")].map((b) => (b === 0x97 ? "—" : String.fromCharCode(b))).join("")).join(""));
  }
  return lines.join("\n");
}
const getPdf = async (client, url) => {
  const res = await fetch(client.base + url, { headers: { cookie: [...client.cookies].map(([k, v]) => `${k}=${v}`).join("; ") }, redirect: "manual" });
  return { status: res.status, buffer: Buffer.from(await res.arrayBuffer()), headers: res.headers };
};
const plan = (client, slug) => client.get(`/cours/${slug}/plan`);
const order = (html, ...needles) => needles.map((n) => html.indexOf(n));
const ascending = (list) => list.every((v, i) => v >= 0 && (i === 0 || v > list[i - 1]));

before(async () => {
  srv = await startServer();
  prof = await loginInstructor(srv);
  eleve = await newStudent(srv);
  await prof.post("/formateur/cours/nouveau", { title: "Formation complète sur le montage", category: "Design", level: "debutant", price: "30", subtitle: "Du premier plan à l'export", description: "desc" });
  const row = q("SELECT id, slug FROM courses WHERE title LIKE 'Formation complète%'")[0];
  await prof.post(`/formateur/cours/${row.id}/sections`, { title: "L'interface" });
  await prof.post(`/formateur/cours/${row.id}/sections`, { title: "Le montage" });
  const [s1, s2] = q("SELECT id FROM sections WHERE course_id = ? ORDER BY position, id", row.id);
  const lessons = [
    [s1, "Présentation de l'interface", true, "SECRET-DESCRIPTION-LECON"],
    [s1, "Organisation de l'espace de travail", false, ""],
    [s2, "Importation des médias", false, ""],
    [s2, "Timeline", false, ""],
  ];
  for (const [sec, title, preview, description] of lessons) {
    await prof.post(`/formateur/sections/${sec.id}/lecons`, { title });
    const l = q("SELECT id FROM lessons WHERE section_id = ? AND title = ?", sec.id, title)[0];
    const fd = new FormData();
    fd.append("title", title);
    fd.append("duration_minutes", "7");
    if (preview) fd.append("is_preview", "1");
    if (description) fd.append("description", description);
    fd.append("video_url", "https://www.youtube.com/watch?v=SECRETVIDEOID");
    await prof.request(`/formateur/lecons/${l.id}/modifier`, { method: "POST", multipart: fd });
  }
  await prof.post(`/formateur/cours/${row.id}/publier`, {});
  course = row;
  await buy(eleve, course);
});
after(() => srv.stop());

describe("boutons de la colonne d'achat", () => {
  const purchaseColumn = (html) => html.slice(html.indexOf('<aside class="purchase-card">'), html.indexOf("</aside>"));

  test("visiteur non connecté : les deux boutons sont présents, dans l'ordre demandé", async () => {
    const col = purchaseColumn((await anon().get(`/cours/${course.slug}`)).text);
    assert.match(col, /<button[^>]+type="button"[^>]+data-plan-url="\/cours\/[^"]+\/plan"[^>]*>[\s\S]*?Voir le plan du cours/);
    assert.match(col, new RegExp(`<a[^>]+href="/cours/${course.slug}/programme\\.pdf"[^>]+download[^>]*>[\\s\\S]*?Télécharger le plan du cours \\(PDF\\)`));
    assert.ok(ascending(order(col, "Se connecter pour acheter", "Voir le plan du cours", "Télécharger le plan du cours (PDF)", "purchase-includes")));
  });
  test("le bouton « Voir » annonce une fenêtre ; les deux ont une icône (aria-hidden) et un texte explicite", async () => {
    const col = purchaseColumn((await anon().get(`/cours/${course.slug}`)).text);
    assert.match(col, /<button[^>]+aria-haspopup="dialog"[^>]+aria-controls="planDialog"/);
    const buttons = [...col.matchAll(/<(?:button|a)[^>]*(?:data-plan-url|programme\.pdf)[^>]*>([\s\S]*?)<\/(?:button|a)>/g)].map((m) => m[1]);
    assert.equal(buttons.length, 2);
    for (const inner of buttons) assert.match(inner, /<svg[^>]+aria-hidden="true"/);
  });
  test("propriétaire : Gérer → Aperçu → Voir le plan → Télécharger, puis les informations existantes", async () => {
    const col = purchaseColumn((await prof.get(`/cours/${course.slug}`)).text);
    assert.ok(ascending(order(col, "Gérer cette formation", "Aperçu du contenu", "Voir le plan du cours", "Télécharger le plan du cours (PDF)", "sous-chapitres vidéo", "Accès illimité après achat", "Sur mobile, tablette et ordinateur")));
  });
  test("étudiant inscrit et utilisateur connecté non inscrit : boutons présents, achat inchangé", async () => {
    const enrolled = purchaseColumn((await eleve.get(`/cours/${course.slug}`)).text);
    assert.match(enrolled, /Continuer la formation/);
    assert.match(enrolled, /Voir le plan du cours/);
    const other = await newStudent(srv);
    const col = purchaseColumn((await other.get(`/cours/${course.slug}`)).text);
    assert.match(col, /Acheter maintenant/);
    assert.match(col, /Voir le plan du cours/);
    assert.match(col, /Télécharger le plan du cours \(PDF\)/);
  });
  test("la fenêtre : élément <dialog> accessible avec un bouton de fermeture nommé", async () => {
    const html = (await anon().get(`/cours/${course.slug}`)).text;
    assert.match(html, /<dialog[^>]+id="planDialog"[^>]+aria-labelledby="planDialogTitle"/);
    assert.match(html, /<h2[^>]+id="planDialogTitle"[^>]*>Plan du cours<\/h2>/);
    assert.match(html, /<dialog[\s\S]*<button[^>]+data-plan-close[^>]+aria-label="Fermer le plan du cours"/);
  });
  test("l'existant est conservé : accordéon du programme, bouton PDF de la section, avis, FAQ", async () => {
    const html = (await anon().get(`/cours/${course.slug}`)).text;
    assert.match(html, /<h2>Contenu du cours<\/h2>/); // ancien titre « Programme de la formation », renommé
    assert.match(html, /Télécharger le programme PDF/);
    assert.match(html, /id="avis"/);
    assert.equal((html.match(/class="accordion-item/g) || []).length, 2);
  });
  test("formation sans aucune leçon : pas de boutons de plan (rien à montrer)", async () => {
    const empty = await createCourse(prof, srv, { title: "Sans contenu", price: 0, lessons: [], publish: false });
    const col = purchaseColumn((await prof.get(`/cours/${empty.slug}`)).text);
    assert.doesNotMatch(col, /Voir le plan du cours|Télécharger le plan du cours/);
    assert.match(col, /Gérer cette formation/);
  });
});

describe("plan affiché dans la fenêtre (/cours/:slug/plan)", () => {
  test("public : sans connexion, chapitres et leçons réels, dans l'ordre", async () => {
    const r = await plan(anon(), course.slug);
    assert.equal(r.status, 200);
    assert.match(r.headers.get("content-type"), /text\/html/);
    assert.match(r.text, /Formation complète sur le montage/);
    assert.ok(ascending(order(r.text, "L&#39;interface", "Présentation de l&#39;interface", "Organisation de l&#39;espace de travail", "Le montage", "Importation des médias", "Timeline")));
    assert.match(r.text, /Chapitre 1/);
    assert.match(r.text, /Chapitre 2/);
  });
  test("c'est un fragment (pas une page complète) : ni en-tête du site ni pied de page", async () => {
    const r = await plan(anon(), course.slug);
    assert.doesNotMatch(r.text, /<html|<head|<footer|site-header/i);
  });
  test("résumé chiffré, durées et aperçus gratuits", async () => {
    const r = await plan(anon(), course.slug);
    assert.match(r.text, /2 chapitres/);
    assert.match(r.text, /4 sous-chapitres/);
    assert.match(r.text, /28 min/);
    assert.match(r.text, /Aperçu gratuit/);
  });
  test("ne contient AUCUN contenu payant : ni description de leçon, ni adresse de vidéo, ni fichier", async () => {
    for (const client of [anon(), eleve, prof]) {
      const t = (await plan(client, course.slug)).text;
      assert.doesNotMatch(t, /SECRET-DESCRIPTION-LECON|SECRETVIDEOID|youtube|\/uploads\/|\/apprendre\//i);
    }
  });
  test("les liens vers les leçons n'existent pas dans le plan : c'est une liste descriptive", async () => {
    assert.doesNotMatch((await plan(anon(), course.slug)).text, /<a /);
  });
  test("le contenu reste toujours à jour : renommer, ajouter, réordonner, supprimer", async () => {
    const c = await createCourse(prof, srv, { title: "Plan dynamique", price: 0, lessons: [{ title: "Alpha" }, { title: "Beta" }] });
    let t = (await plan(anon(), c.slug)).text;
    assert.ok(ascending(order(t, "Alpha", "Beta")));

    const alpha = q("SELECT id FROM lessons WHERE title = 'Alpha'")[0].id;
    const fd = new FormData();
    fd.append("title", "Alpha renommée");
    fd.append("duration_minutes", "5");
    await prof.request(`/formateur/lecons/${alpha}/modifier`, { method: "POST", multipart: fd });
    t = (await plan(anon(), c.slug)).text;
    assert.match(t, /Alpha renommée/);

    await prof.post(`/formateur/cours/${c.id}/sections`, { title: "Nouveau chapitre" });
    t = (await plan(anon(), c.slug)).text;
    assert.match(t, /Nouveau chapitre/);
    assert.match(t, /2 chapitres/);

    const [first, second] = q("SELECT id FROM sections WHERE course_id = ? ORDER BY position, id", c.id);
    await prof.postJson(`/formateur/cours/${c.id}/sections/reorder`, { order: [second.id, first.id] });
    t = (await plan(anon(), c.slug)).text;
    assert.ok(ascending(order(t, "Nouveau chapitre", "Alpha renommée")), "le nouvel ordre est repris");

    await prof.post(`/formateur/lecons/${alpha}/supprimer`, {});
    t = (await plan(anon(), c.slug)).text;
    assert.doesNotMatch(t, /Alpha renommée/);
    assert.match(t, /Beta/);
  });
  test("titres saisis avec du HTML : neutralisés", async () => {
    const c = await createCourse(prof, srv, { title: "Plan échappé", price: 0, lessons: [{ title: "<img src=x onerror=alert(1)>" }] });
    const t = (await plan(anon(), c.slug)).text;
    assert.doesNotMatch(t, /<img src=x/);
    assert.match(t, /&lt;img src=x/);
  });
  test("grande formation : 12 chapitres et 96 leçons, tous présents et dans l'ordre", async () => {
    const c = await createCourse(prof, srv, { title: "Très grand plan", price: 0, lessons: [], publish: false });
    const db = srv.db();
    const insSec = db.prepare("INSERT INTO sections (course_id, title, position) VALUES (?, ?, ?)");
    const insLes = db.prepare("INSERT INTO lessons (section_id, title, duration_minutes, position) VALUES (?, ?, 3, ?)");
    for (let i = 0; i < 12; i++) {
      const sid = Number(insSec.run(c.id, `Grand chapitre ${i + 1}`, i).lastInsertRowid);
      for (let j = 0; j < 8; j++) insLes.run(sid, `Grande leçon ${i + 1}-${j + 1}`, j);
    }
    db.close();
    await prof.post(`/formateur/cours/${c.id}/publier`, {});
    const t = (await plan(anon(), c.slug)).text;
    const titles = [...t.matchAll(/Grande leçon (\d+)-(\d+)/g)].map((m) => `${m[1]}-${m[2]}`);
    assert.equal(titles.length, 96);
    const expected = [];
    for (let i = 1; i <= 12; i++) for (let j = 1; j <= 8; j++) expected.push(`${i}-${j}`);
    assert.deepEqual(titles, expected);
    assert.match(t, /13 chapitres|12 chapitres/); // createCourse peut ajouter un chapitre vide
    const pdf = pdfText((await getPdf(anon(), `/cours/${c.slug}/programme.pdf`)).buffer);
    for (const s of ["Grand chapitre 12", "Grande leçon 12-8", "Grande leçon 1-1"]) assert.ok(pdf.includes(s), s);
  });
  test("chapitre sans leçon : le chapitre est listé avec un message honnête, rien d'inventé", async () => {
    const c = await createCourse(prof, srv, { title: "Chapitre vide", price: 0, lessons: [], publish: false });
    const t = (await plan(prof, c.slug)).text;
    assert.match(t, /Chapitre 1/);
    assert.match(t, /Aucune leçon dans ce chapitre/);
  });
});

describe("droits d'accès du plan et du PDF", () => {
  test("formation inconnue : 404 pour le plan", async () => {
    assert.equal((await plan(anon(), "inexistante")).status, 404);
  });
  test("brouillon : 404 pour le public (plan et PDF), accessible à son auteur", async () => {
    const d = await createCourse(prof, srv, { title: "Plan brouillon", price: 0, publish: false });
    assert.equal((await plan(anon(), d.slug)).status, 404);
    assert.equal((await plan(eleve, d.slug)).status, 404);
    assert.equal((await getPdf(anon(), `/cours/${d.slug}/programme.pdf`)).status, 404);
    assert.equal((await plan(prof, d.slug)).status, 200);
  });
  test("formation archivée : masquée au public, visible pour un étudiant inscrit", async () => {
    const a = await createCourse(prof, srv, { title: "Plan archivé", price: 0 });
    await buy(eleve, a);
    await prof.post(`/formateur/cours/${a.id}/archiver`, {});
    assert.equal((await plan(anon(), a.slug)).status, 404);
    assert.equal((await plan(eleve, a.slug)).status, 200);
  });
  test("ancienne adresse d'une formation renommée : redirection vers le plan de la nouvelle", async () => {
    const c = await createCourse(prof, srv, { title: "Plan renommé", price: 0 });
    const oldSlug = c.slug;
    const fd = new FormData();
    Object.entries({ title: "Plan renommé v2", category: "Test", level: "debutant", price: "0", description: "desc", slug: "plan-renomme-v2" }).forEach(([k, v]) => fd.append(k, v));
    await prof.request(`/formateur/cours/${c.id}/modifier`, { method: "POST", multipart: fd });
    const r = await fetch(`${srv.base}/cours/${oldSlug}/plan`, { redirect: "manual" });
    assert.equal(r.status, 301);
    assert.equal(r.headers.get("location"), "/cours/plan-renomme-v2/plan");
  });
  test("le plan est inclus dans aucun index : réponse marquée non indexable", async () => {
    const r = await plan(anon(), course.slug);
    assert.match(r.headers.get("x-robots-tag") || "", /noindex/);
  });
  test("/plan n'accepte pas d'écriture", async () => {
    assert.ok([404, 405].includes((await anon().post(`/cours/${course.slug}/plan`, {})).status));
  });
});

describe("PDF « plan complet de la formation »", () => {
  let text;
  before(async () => {
    text = pdfText((await getPdf(anon(), `/cours/${course.slug}/programme.pdf`)).buffer);
  });
  test("titre « PLAN COMPLET DE LA FORMATION » puis titre de la formation, puis programme détaillé", () => {
    const i = text.indexOf("PLAN COMPLET DE LA FORMATION");
    const j = text.indexOf("Formation complète sur le montage");
    const k = text.indexOf("Programme détaillé");
    assert.ok(i >= 0 && j > i && k > j, `ordre incorrect : ${i} ${j} ${k}`);
  });
  test("informations générales et programme réels", () => {
    for (const s of ["KOLAKISA", "Du premier plan à l'export", "Débutant", "2 chapitres", "4 leçons", "28 min", "Chapitre 1 — L'interface", "Chapitre 2 — Le montage", "1.1  Présentation de l'interface", "2.2  Timeline"]) {
      assert.ok(text.includes(s), `absent du PDF : « ${s} »`);
    }
  });
  test("aucun contenu payant dans le PDF", async () => {
    assert.ok(!/SECRET-DESCRIPTION-LECON|SECRETVIDEOID/.test(text));
  });
  test("le PDF suit les modifications : nouvelle leçon visible immédiatement", async () => {
    const [, s2] = q("SELECT id FROM sections WHERE course_id = ? ORDER BY position, id", course.id);
    await prof.post(`/formateur/sections/${s2.id}/lecons`, { title: "Leçon ajoutée après coup" });
    const t = pdfText((await getPdf(anon(), `/cours/${course.slug}/programme.pdf`)).buffer);
    assert.ok(t.includes("Leçon ajoutée après coup"));
    assert.ok(t.includes("5 leçons"));
  });
});
