// Étape 0 : vidéos par lien. Le lecteur ne savait lire que des fichiers vidéo directs (balise <video>) :
// un lien YouTube ou Vimeo restait noir. On l'intègre désormais avec un lecteur adapté, sur liste blanche.
const { test, before, after, describe } = require("node:test");
const assert = require("node:assert/strict");
const { startServer, loginInstructor, newStudent, createCourse, buy } = require("./helpers");
const { parseVideoUrl } = require("../src/utils/video");

describe("analyse des liens vidéo (fonction pure)", () => {
  const cases = [
    ["https://www.youtube.com/watch?v=dQw4w9WgXcQ", "youtube", "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"],
    ["https://youtu.be/dQw4w9WgXcQ?t=42", "youtube", "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"],
    ["https://www.youtube.com/embed/dQw4w9WgXcQ", "youtube", "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"],
    ["https://m.youtube.com/shorts/dQw4w9WgXcQ", "youtube", "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"],
    ["https://vimeo.com/76979871", "vimeo", "https://player.vimeo.com/video/76979871"],
    ["https://vimeo.com/76979871/abcdef1234", "vimeo", "https://player.vimeo.com/video/76979871?h=abcdef1234"],
    ["https://player.vimeo.com/video/76979871?h=abcdef1234", "vimeo", "https://player.vimeo.com/video/76979871?h=abcdef1234"],
    ["https://exemple.com/cours/intro.mp4", "file", "https://exemple.com/cours/intro.mp4"],
    ["https://exemple.com/cours/intro.webm?token=1", "file", "https://exemple.com/cours/intro.webm?token=1"],
    ["https://exemple.com/une-page", "link", "https://exemple.com/une-page"],
  ];
  for (const [input, kind, src] of cases) {
    test(`${input} → ${kind}`, () => {
      const v = parseVideoUrl(input);
      assert.equal(v.kind, kind);
      assert.ok(v.src.startsWith(src), `attendu ${src}, obtenu ${v.src}`);
    });
  }
  for (const bad of ["javascript:alert(1)", "data:text/html,<script>1</script>", "ftp://exemple.com/v.mp4", "pas une url", "", null, undefined]) {
    test(`refusé : ${String(bad)}`, () => assert.equal(parseVideoUrl(bad), null));
  }
  test("un faux domaine YouTube n'est pas intégré", () => {
    assert.equal(parseVideoUrl("https://youtube.com.evil.example/watch?v=dQw4w9WgXcQ").kind, "link");
    assert.equal(parseVideoUrl("https://evil.example/?u=youtube.com/watch?v=dQw4w9WgXcQ").kind, "link");
  });
  test("un identifiant YouTube suspect n'est pas intégré", () => {
    assert.equal(parseVideoUrl('https://www.youtube.com/watch?v="><script>').kind, "link");
  });
});

describe("page de lecture", () => {
  let srv, eleve, course;
  const URLS = {
    youtube: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    vimeo: "https://vimeo.com/76979871",
    mp4: "https://exemple.com/cours/intro.mp4",
    page: "https://exemple.com/une-page",
  };
  before(async () => {
    srv = await startServer();
    const prof = await loginInstructor(srv);
    course = await createCourse(prof, srv, {
      title: "Vidéos par lien",
      price: 0,
      lessons: Object.entries(URLS).map(([k, url]) => ({ title: k, videoUrl: url })),
    });
    eleve = await newStudent(srv);
    await buy(eleve, course);
  });
  after(() => srv.stop());

  const page = async (name) => (await eleve.get(`/apprendre/${course.slug}/${course.lessons.find((l) => l.title === name).id}`)).text;

  test("YouTube : lecteur intégré sans cookies, pas de balise <video> vers YouTube", async () => {
    const html = await page("youtube");
    assert.match(html, /<iframe[^>]+src="https:\/\/www\.youtube-nocookie\.com\/embed\/dQw4w9WgXcQ/);
    assert.doesNotMatch(html, /<video[^>]+youtube/);
  });
  test("Vimeo : lecteur intégré", async () => {
    assert.match(await page("vimeo"), /<iframe[^>]+src="https:\/\/player\.vimeo\.com\/video\/76979871/);
  });
  test("fichier .mp4 distant : balise <video>", async () => {
    const html = await page("mp4");
    assert.match(html, /<video[^>]+src="https:\/\/exemple\.com\/cours\/intro\.mp4"/);
    assert.doesNotMatch(html, /<iframe/);
  });
  test("page web quelconque : ni lecteur ni iframe, un simple lien sûr", async () => {
    const html = await page("page");
    assert.doesNotMatch(html, /<iframe/);
    assert.doesNotMatch(html, /<video/);
    assert.match(html, /<a[^>]+href="https:\/\/exemple\.com\/une-page"[^>]+rel="noopener noreferrer"/);
  });
  test("l'iframe est accessible (titre) et chargée à la demande", async () => {
    const html = await page("youtube");
    assert.match(html, /<iframe[^>]+title="youtube"/);
    assert.match(html, /<iframe[^>]+loading="lazy"/);
  });
});

describe("enregistrement côté formateur", () => {
  test("un lien javascript: n'est jamais enregistré", async () => {
    const srv = await startServer();
    try {
      const prof = await loginInstructor(srv);
      const c = await createCourse(prof, srv, { title: "Lien piégé", price: 0, lessons: [{ title: "L", videoUrl: "javascript:alert(1)" }] });
      const db = srv.db();
      const row = db.prepare("SELECT video_url FROM lessons WHERE id = ?").get(c.lessons[0].id);
      db.close();
      assert.ok(!row.video_url, `enregistré : ${row.video_url}`);
    } finally {
      await srv.stop();
    }
  });
});
