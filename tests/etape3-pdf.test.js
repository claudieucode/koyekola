// Étape 3b : « Télécharger le programme PDF » — un vrai fichier PDF généré par le site.
const { test, before, after, describe } = require("node:test");
const assert = require("node:assert/strict");
const { startServer, Client, loginInstructor, newStudent, createCourse, buy } = require("./helpers");

let srv, prof, course;
const anon = () => new Client(srv.base);
const q = (sql, ...a) => {
  const db = srv.db();
  const r = db.prepare(sql).all(...a);
  db.close();
  return r;
};

// Le PDF n'est pas compressé : le texte y est écrit en morceaux hexadécimaux « [<466f…> 40 <726d…>] TJ ».
// On les recolle pour retrouver le texte affiché (encodage Windows-1252 des polices standard).
const WIN1252_SPECIALS = { 0x91: "‘", 0x92: "’", 0x93: "“", 0x94: "”", 0x96: "–", 0x97: "—", 0x85: "…", 0x95: "•", 0x9c: "œ", 0x80: "€" };
function pdfText(buffer) {
  const raw = buffer.toString("latin1");
  const lines = [];
  for (const m of raw.matchAll(/\[((?:<[0-9a-f]*>|\s|-?[\d.]+)*)\]\s*TJ/gi)) {
    const text = [...m[1].matchAll(/<([0-9a-f]*)>/gi)]
      .map((h) => [...Buffer.from(h[1], "hex")].map((b) => WIN1252_SPECIALS[b] || String.fromCharCode(b)).join(""))
      .join("");
    lines.push(text);
  }
  return lines.join("\n");
}
const pageCount = (buffer) => (buffer.toString("latin1").match(/\/Type \/Page\b(?!s)/g) || []).length;
const getPdf = async (client, url) => {
  const res = await fetch(client.base + url, { headers: { cookie: [...client.cookies].map(([k, v]) => `${k}=${v}`).join("; ") }, redirect: "manual" });
  return { status: res.status, headers: res.headers, buffer: Buffer.from(await res.arrayBuffer()), location: res.headers.get("location") };
};

before(async () => {
  srv = await startServer();
  prof = await loginInstructor(srv);
  await prof.post("/formateur/cours/nouveau", {
    title: "Étalonnage vidéo : les bases", category: "Design", level: "intermediaire", price: "49",
    subtitle: "Maîtrisez la couleur", description: "## Présentation\nUne formation **complète** avec des exemples réels.\n\n- Des exercices corrigés\n- Un projet final",
    objectives: "Corriger une image\nCréer un style visuel", prerequisites: "Un ordinateur\nUn logiciel de montage",
    target_audience: "Monteurs débutants\nCréateurs de contenu", skills: "Étalonner un plan\nExporter en 4K",
  });
  const row = q("SELECT id, slug FROM courses WHERE title LIKE 'Étalonnage%'")[0];
  await prof.post(`/formateur/cours/${row.id}/sections`, { title: "Premiers pas" });
  await prof.post(`/formateur/cours/${row.id}/sections`, { title: "Aller plus loin" });
  const [s1, s2] = q("SELECT id FROM sections WHERE course_id = ? ORDER BY position, id", row.id);
  const lessons = [[s1, "Comprendre les courbes", true], [s1, "Les outils de base", false], [s2, "Étalonnage créatif", false], [s2, "Export final", false]];
  for (const [sec, title, preview] of lessons) {
    await prof.post(`/formateur/sections/${sec.id}/lecons`, { title });
    const l = q("SELECT id FROM lessons WHERE section_id = ? AND title = ?", sec.id, title)[0];
    const fd = new FormData();
    fd.append("title", title);
    fd.append("duration_minutes", "5");
    if (preview) fd.append("is_preview", "1");
    await prof.request(`/formateur/lecons/${l.id}/modifier`, { method: "POST", multipart: fd });
  }
  await prof.post(`/formateur/cours/${row.id}/publier`, {});
  course = row;
});
after(() => srv.stop());

describe("téléchargement", () => {
  test("un vrai PDF, proposé en téléchargement avec un nom de fichier clair", async () => {
    const r = await getPdf(anon(), `/cours/${course.slug}/programme.pdf`);
    assert.equal(r.status, 200);
    assert.equal(r.headers.get("content-type"), "application/pdf");
    assert.match(r.headers.get("content-disposition"), new RegExp(`attachment; filename="programme-${course.slug}\\.pdf"`));
    assert.equal(r.buffer.subarray(0, 5).toString(), "%PDF-");
    assert.match(r.buffer.subarray(-8).toString(), /%%EOF/);
    assert.ok(r.buffer.length > 2000, `PDF trop petit : ${r.buffer.length}`);
  });
  test("la fiche formation propose le bouton « Télécharger le programme PDF »", async () => {
    const html = (await anon().get(`/cours/${course.slug}`)).text;
    assert.match(html, new RegExp(`<a[^>]+href="/cours/${course.slug}/programme\\.pdf"[^>]*>[^<]*(?:<[^>]+>[^<]*)*Télécharger le programme PDF`));
  });
});

describe("contenu du PDF (cahier des charges)", () => {
  let text;
  before(async () => {
    text = pdfText((await getPdf(anon(), `/cours/${course.slug}/programme.pdf`)).buffer);
  });
  const has = (needle) => assert.ok(text.includes(needle), `absent du PDF : « ${needle} »\n--- texte trouvé ---\n${text.slice(0, 1500)}`);

  test("titre de la formation et nom de la plateforme", () => {
    has("Étalonnage vidéo : les bases");
    has("KOLAKISA");
  });
  test("description sans symboles de mise en forme", () => {
    has("complète");
    has("Des exercices corrigés");
    assert.doesNotMatch(text, /\*\*|^##/m);
  });
  test("niveau, durée, nombre de chapitres et de leçons", () => {
    has("Intermédiaire");
    has("20 min");
    has("2 chapitres");
    has("4 leçons");
  });
  test("objectifs, prérequis, public visé et compétences acquises", () => {
    for (const s of ["Objectifs", "Corriger une image", "Prérequis", "Un logiciel de montage", "À qui s'adresse", "Créateurs de contenu", "Compétences acquises", "Exporter en 4K"]) has(s);
  });
  test("programme détaillé : chapitres et leçons, avec durée et aperçus gratuits", () => {
    for (const s of ["Programme détaillé", "Premiers pas", "Aller plus loin", "Comprendre les courbes", "Les outils de base", "Étalonnage créatif", "Export final"]) has(s);
    has("Aperçu gratuit");
    has("5 min");
  });
  test("prix affiché", () => {
    has("49");
  });
});

describe("droits d'accès", () => {
  let draft;
  before(async () => {
    draft = await createCourse(prof, srv, { title: "PDF brouillon", price: 0, publish: false });
  });
  test("un brouillon : 404 pour un visiteur, PDF pour son auteur", async () => {
    assert.equal((await getPdf(anon(), `/cours/${draft.slug}/programme.pdf`)).status, 404);
    assert.equal((await getPdf(prof, `/cours/${draft.slug}/programme.pdf`)).status, 200);
  });
  test("une formation archivée reste téléchargeable par ceux qui l'ont achetée", async () => {
    const c = await createCourse(prof, srv, { title: "PDF archivée", price: 0 });
    const e = await newStudent(srv);
    await buy(e, c);
    await prof.post(`/formateur/cours/${c.id}/archiver`, {});
    assert.equal((await getPdf(anon(), `/cours/${c.slug}/programme.pdf`)).status, 404);
    assert.equal((await getPdf(e, `/cours/${c.slug}/programme.pdf`)).status, 200);
  });
  test("formation inconnue : 404", async () => {
    assert.equal((await getPdf(anon(), "/cours/inconnue/programme.pdf")).status, 404);
  });
  test("ancienne adresse : redirection définitive vers le PDF de la nouvelle", async () => {
    const c = await createCourse(prof, srv, { title: "PDF renommée", price: 0 });
    await prof.post(`/formateur/cours/${c.id}/modifier`, { title: "PDF renommée", category: "Test", level: "debutant", price: "0", description: "d", slug: "pdf-nouvelle-adresse" });
    const r = await getPdf(anon(), `/cours/${c.slug}/programme.pdf`);
    assert.equal(r.status, 301);
    assert.equal(r.location, "/cours/pdf-nouvelle-adresse/programme.pdf");
  });
});

describe("robustesse", () => {
  test("caractères que la police du PDF ne sait pas écrire : pas de plantage", async () => {
    const c = await createCourse(prof, srv, { title: "Œuvres → « futures » 😀 ‘test’", price: 0, extra: { description: "Texte avec → flèche, 😀 emoji, œ et ’apostrophe’.", objectives: "✓ Un objectif\n★ Un autre" } });
    const r = await getPdf(anon(), `/cours/${c.slug}/programme.pdf`);
    assert.equal(r.status, 200);
    assert.equal(r.buffer.subarray(0, 5).toString(), "%PDF-");
    const text = pdfText(r.buffer);
    assert.ok(text.includes("Œuvres") || text.includes("uvres"), "le titre reste lisible");
  });
  test("une grande formation produit un PDF de plusieurs pages", async () => {
    const c = await createCourse(prof, srv, { title: "Très grande formation", price: 0, lessons: [], publish: false });
    const db = srv.db();
    const insSec = db.prepare("INSERT INTO sections (course_id, title, position) VALUES (?, ?, ?)");
    const insLes = db.prepare("INSERT INTO lessons (section_id, title, duration_minutes, position) VALUES (?, ?, 4, ?)");
    for (let i = 0; i < 25; i++) {
      const sid = Number(insSec.run(c.id, `Chapitre numéro ${i + 1}`, i).lastInsertRowid);
      for (let j = 0; j < 8; j++) insLes.run(sid, `Leçon ${i + 1}.${j + 1} avec un titre assez long pour occuper de la place`, j);
    }
    db.close();
    await prof.post(`/formateur/cours/${c.id}/publier`, {}); // publiable maintenant qu'elle a du contenu
    const r = await getPdf(anon(), `/cours/${c.slug}/programme.pdf`);
    assert.equal(r.status, 200);
    assert.ok(pageCount(r.buffer) >= 4, `pages : ${pageCount(r.buffer)}`);
    const text = pdfText(r.buffer);
    assert.ok(text.includes("Chapitre numéro 25") && text.includes("Leçon 25.8"), "rien ne doit être coupé");
    assert.ok(text.includes("26 chapitres") && text.includes("200 leçons"));
  });
  test("le titre d'une formation ne peut pas casser l'en-tête HTTP du nom de fichier", async () => {
    const r = await getPdf(anon(), `/cours/${course.slug}/programme.pdf`);
    assert.doesNotMatch(r.headers.get("content-disposition"), /[\r\n]/);
  });
});
