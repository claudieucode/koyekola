// Étape 1b : vidéos protégées Bunny Stream (liens signés à durée limitée).
// Algorithme conforme à la documentation Bunny (non validé auprès de Bunny lui-même : voir le test d'ordre).
const { test, before, after, describe } = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const { startServer, Client, loginInstructor, newStudent, createCourse, buy } = require("./helpers");
const { bunnyToken, bunnyEmbedUrl, isBunnyId } = require("../src/utils/bunny");
const { parseVideoUrl } = require("../src/utils/video");

const GUID = "32d140e2-e4f4-4eec-9d53-20371e9be607";

describe("signature des liens (fonction pure)", () => {
  // Ce que ce test prouve : l'ordre documenté par Bunny (clé + identifiant de vidéo + expiration, SHA-256, hexadécimal)
  // est respecté, sur les valeurs d'exemple de leur documentation. Il ne prouve PAS que Bunny accepte le jeton :
  // la documentation ne publie pas le résultat attendu. La validation réelle exige une vraie vidéo Bunny
  // (voir le guide : « Tester avec une vraie vidéo »).
  test("ordre documenté : clé + identifiant + expiration (SHA-256 hexadécimal)", () => {
    const key = "4742a81b-bf15-42fe-8b1c-8fcb9024c550";
    const id = "32d140e2-e4f4-4eec-9d53-20371e9be607";
    assert.equal(bunnyToken(key, id, 1623440202), crypto.createHash("sha256").update(key + id + "1623440202").digest("hex"));
    assert.equal(bunnyToken(key, id, 1623440202), "a8617f6df2e9b55b65ac7112138c70417766d80614bfe146d0d9bb2bd21fef87");
    assert.notEqual(bunnyToken(key, id, 1623440202), crypto.createHash("sha256").update(id + key + "1623440202").digest("hex"), "l'ordre compte");
  });
  test("adresse d'intégration : bibliothèque, vidéo, jeton et expiration", () => {
    const url = bunnyEmbedUrl({ libraryId: "759", videoId: GUID, key: "cle", ttlSeconds: 3600, now: 1000000 });
    assert.equal(url.startsWith(`https://iframe.mediadelivery.net/embed/759/${GUID}?token=`), true);
    assert.match(url, /&expires=1003600$/);
    const token = url.match(/token=([0-9a-f]{64})/)[1];
    assert.equal(token, crypto.createHash("sha256").update(`cle${GUID}1003600`).digest("hex"));
  });
  test("identifiants acceptés / refusés", () => {
    assert.equal(isBunnyId(GUID), true);
    assert.equal(isBunnyId(GUID.toUpperCase()), true);
    for (const bad of ["", "abc", GUID + "x", `${GUID}/../x`, "<script>", null, undefined]) assert.equal(isBunnyId(bad), false, String(bad));
  });
  test("un identifiant seul est reconnu comme vidéo Bunny", () => {
    const v = parseVideoUrl(GUID);
    assert.equal(v.kind, "bunny");
    assert.equal(v.videoId, GUID);
  });
  test("le préfixe « bunny: » est toléré", () => {
    assert.equal(parseVideoUrl(`bunny:${GUID}`).videoId, GUID);
  });
});

describe("dans les pages (Bunny configuré)", () => {
  let srv, prof, course, eleve, autre;
  before(async () => {
    srv = await startServer({ BUNNY_LIBRARY_ID: "759", BUNNY_TOKEN_KEY: "cle-secrete-de-test" });
    prof = await loginInstructor(srv);
    course = await createCourse(prof, srv, {
      title: "Cours Bunny",
      price: 20,
      lessons: [{ title: "Payante", videoUrl: GUID }, { title: "Aperçu", preview: true, videoUrl: GUID }],
      extra: { intro_video: GUID },
    });
    eleve = await newStudent(srv);
    await buy(eleve, course);
    autre = await newStudent(srv);
  });
  after(() => srv.stop());

  const embed = /<iframe[^>]+src="(https:\/\/iframe\.mediadelivery\.net\/embed\/759\/32d140e2-e4f4-4eec-9d53-20371e9be607\?token=[0-9a-f]{64}&amp;expires=\d+)"/;

  test("étudiant inscrit : lecteur Bunny avec lien signé valide", async () => {
    const html = (await eleve.get(`/apprendre/${course.slug}/${course.lessons[0].id}`)).text;
    const m = html.match(embed);
    assert.ok(m, "iframe Bunny absente");
    const url = new URL(m[1].replace(/&amp;/g, "&"));
    const expires = url.searchParams.get("expires");
    assert.equal(url.searchParams.get("token"), crypto.createHash("sha256").update(`cle-secrete-de-test${GUID}${expires}`).digest("hex"));
    assert.ok(Number(expires) > Date.now() / 1000, "le lien doit être valable dans le futur");
  });
  test("la clé secrète n'apparaît jamais dans la page", async () => {
    const html = (await eleve.get(`/apprendre/${course.slug}/${course.lessons[0].id}`)).text;
    assert.doesNotMatch(html, /cle-secrete-de-test/);
  });
  test("étudiant non inscrit : page refusée, aucun lien signé n'est envoyé", async () => {
    const r = await autre.get(`/apprendre/${course.slug}/${course.lessons[0].id}`);
    assert.equal(r.status, 403);
    assert.doesNotMatch(r.text, /mediadelivery|token=/);
  });
  test("visiteur : la leçon d'aperçu est lisible (lien signé), la leçon payante non", async () => {
    const visiteur = new Client(srv.base);
    assert.match((await visiteur.get(`/apprendre/${course.slug}/${course.lessons[1].id}`)).text, embed);
    const payante = await visiteur.get(`/apprendre/${course.slug}/${course.lessons[0].id}`);
    assert.equal(payante.status, 302);
    assert.doesNotMatch(payante.text, /mediadelivery/);
  });
  test("vidéo de présentation Bunny sur la fiche publique", async () => {
    assert.match((await new Client(srv.base).get(`/cours/${course.slug}`)).text, embed);
  });
  test("chaque affichage produit un lien récent (pas de lien figé dans la base)", async () => {
    const db = srv.db();
    const stored = db.prepare("SELECT video_url FROM lessons WHERE id = ?").get(course.lessons[0].id).video_url;
    db.close();
    assert.equal(stored, GUID, "on ne stocke que l'identifiant, jamais un lien signé");
  });
});

describe("Bunny non configuré", () => {
  test("message clair, aucune iframe cassée", async () => {
    const srv = await startServer({ BUNNY_LIBRARY_ID: "", BUNNY_TOKEN_KEY: "" });
    try {
      const prof = await loginInstructor(srv);
      const c = await createCourse(prof, srv, { title: "Sans config", price: 0, lessons: [{ title: "L", videoUrl: GUID }] });
      const e = await newStudent(srv);
      await buy(e, c);
      const html = (await e.get(`/apprendre/${c.slug}/${c.lessons[0].id}`)).text;
      assert.doesNotMatch(html, /<iframe/);
      assert.match(html, /Bunny Stream n'est pas configuré/);
    } finally {
      await srv.stop();
    }
  });
});
