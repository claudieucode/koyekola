// KOLAKISA — nouveaux blocs de l'éditeur d'articles (parité Gutenberg) : Préformaté, Vers, Lire la suite, Fichier, Couverture, Média et texte,
// légende de tableau, variantes de style. Règles du serveur : ce qui est conforme est conservé, tout le reste est refusé (jamais d'exécutable, d'adresse externe).
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { sanitizeBlogHtml, renderBlogHtml, excerptBeforeMore, findUnsupported } = require("../src/utils/blogHtml");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");

describe("nouveaux blocs — sanitisation et rendu", () => {
  test("Préformaté et Vers : espaces et sauts de ligne conservés, classe conservée, aucune autre classe", () => {
    const out = sanitizeBlogHtml('<pre class="kb-preformatted">a   b\nc</pre><pre class="kb-verse">v1\nv2</pre><pre class="evil">x</pre>');
    assert.match(out, /<pre class="kb-preformatted">a {3}b\nc<\/pre>/);
    assert.match(out, /<pre class="kb-verse">v1\nv2<\/pre>/);
    assert.match(out, /<pre>x<\/pre>/);
  });
  test("Lire la suite : repère conservé, libellé limité, extrait automatique = texte qui le précède", () => {
    assert.match(sanitizeBlogHtml('<p>Intro</p><div class="kb-more" data-label="Continuer"></div><p>Suite</p>'), /<div class="kb-more" data-label="Continuer"><\/div>/);
    assert.equal(excerptBeforeMore('<p>Première phrase.</p><p>Seconde.</p><div class="kb-more"></div><p>Caché dans la suite.</p>'), "Première phrase. Seconde.");
    assert.equal(excerptBeforeMore("<p>Pas de repère</p>"), "");
    assert.ok(excerptBeforeMore(`<p>${"mot ".repeat(200)}</p><div class="kb-more"></div>`).length <= 300);
  });
  test("Fichier : seuls les documents sûrs de /uploads/blog sont acceptés ; le rendu donne type, poids et lien de téléchargement", () => {
    const ok = '<div class="kb-file" data-url="/uploads/blog/1-abcd.pdf" data-title="Guide" data-download="true"></div>';
    assert.match(sanitizeBlogHtml(ok), /kb-file/);
    for (const bad of ["/uploads/blog/x.exe", "/uploads/blog/x.html", "/uploads/blog/x.svg", "https://exemple.org/x.pdf", "/uploads/resources/x.pdf", "/uploads/blog/../secret.pdf", "javascript:alert(1)"]) {
      assert.doesNotMatch(sanitizeBlogHtml(`<div class="kb-file" data-url="${bad}"></div>`), /kb-file/, bad);
    }
    const html = renderBlogHtml(ok, { fileSize: () => 2097152 }).html;
    assert.match(html, /<a class="kb-file-name" href="\/uploads\/blog\/1-abcd\.pdf" download>Guide<\/a>/);
    assert.match(html, /PDF · 2,0 Mo/);
  });
  test("Couverture : image de la médiathèque uniquement, rendue en vraie balise <img> sous un voile", () => {
    const ok = '<div class="kb-cover" data-src="/uploads/thumbnails/a.png" data-overlay="40" data-height="m" data-alt="Paysage"><h2>Titre</h2><p>Texte</p></div>';
    const html = renderBlogHtml(ok).html;
    assert.match(html, /<div class="kb-cover" data-overlay="40" data-height="m"><img class="kb-cover-img" src="\/uploads\/thumbnails\/a\.png" alt="Paysage"/);
    assert.match(html, /<div class="kb-cover-body"><h2 id="titre">Titre<\/h2><p>Texte<\/p><\/div>/);
    assert.doesNotMatch(sanitizeBlogHtml('<div class="kb-cover" data-src="https://externe.test/a.png"><p>x</p></div>'), /kb-cover/);
    assert.doesNotMatch(sanitizeBlogHtml('<div class="kb-cover" data-src="/uploads/thumbnails/a.png" data-overlay="999" data-height="xxl"><p>x</p></div>'), /data-overlay|data-height/);
  });
  test("Média et texte : côté et largeur contrôlés", () => {
    const out = sanitizeBlogHtml('<div class="kb-mediatext" data-side="right" data-width="33"><figure class="kb-image"><img src="/uploads/thumbnails/a.png" alt="x"></figure><div class="kb-mediatext-body"><p>t</p></div></div>');
    assert.match(out, /data-side="right" data-width="33"/);
    assert.doesNotMatch(sanitizeBlogHtml('<div class="kb-mediatext" data-side="javascript" data-width="9"><p>x</p></div>'), /data-side|data-width/);
  });
  test("Tableau : légende ; variantes de style limitées à une liste fermée par bloc", () => {
    assert.match(renderBlogHtml('<table data-caption="Tarifs 2026"><tbody><tr><td>1</td></tr></tbody></table>').html, /<table><caption>Tarifs 2026<\/caption>/);
    const out = sanitizeBlogHtml('<hr data-variant="dots"><hr data-variant="evil"><figure class="kb-image" data-variant="circle"><img src="/uploads/thumbnails/a.png" alt=""></figure><blockquote data-variant="dots"><p>q</p></blockquote><table data-variant="striped"><tbody><tr><td>1</td></tr></tbody></table>');
    assert.match(out, /<hr data-variant="dots">/);
    assert.match(out, /<hr><figure class="kb-image" data-variant="circle">/);
    assert.match(out, /<blockquote><p>q<\/p><\/blockquote>/, "« dots » n'existe pas pour une citation");
    assert.match(out, /<table data-variant="striped">/);
  });
  test("Spotify, SoundCloud, Dailymotion, Loom, TED : lecteur reconstruit par le serveur ; toute autre adresse reste un simple lien", () => {
    const ok = [["https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC", "https://open.spotify.com/embed/track/4uLU6hMCjMI75M1A2tKUQC"], ["https://soundcloud.com/forss/flickermood", "https://w.soundcloud.com/player/?url=https%3A%2F%2Fsoundcloud.com%2Fforss%2Fflickermood"], ["https://www.dailymotion.com/video/x8abc12", "https://www.dailymotion.com/embed/video/x8abc12"], ["https://www.loom.com/share/0123456789abcdef0123456789abcdef", "https://www.loom.com/embed/0123456789abcdef0123456789abcdef"], ["https://www.ted.com/talks/ken_robinson_says_schools_kill_creativity", "https://embed.ted.com/talks/ken_robinson_says_schools_kill_creativity"]];
    for (const [url, src] of ok) assert.ok(renderBlogHtml(`<div class="kb-embed" data-url="${url}"></div>`).html.includes(`<iframe src="${src}`), url);
    for (const bad of ["https://open.spotify.com.evil.org/track/4uLU6hMCjMI75M1A2tKUQC", "https://evil.org/open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC", "https://open.spotify.com/track/court", "https://soundcloud.com.evil.org/a/b", "https://www.loom.com/share/pasunid"]) {
      const html = renderBlogHtml(`<div class="kb-embed" data-url="${bad}"></div>`).html;
      assert.doesNotMatch(html, /<iframe/, bad);
      assert.match(html, /kb-embed-link/, bad);
    }
  });
  test("Vidéo : sous-titres WebVTT téléversés seulement (langue et intitulé contrôlés) ; Détails ouvert ; lettrine, teinte, liste décroissante", () => {
    const html = renderBlogHtml('<div class="kb-video" data-url="/uploads/blog/a.mp4" data-track="/uploads/blog/s.vtt" data-track-lang="en" data-track-label="English"></div>').html;
    assert.match(html, /<track kind="subtitles" src="\/uploads\/blog\/s\.vtt" srclang="en" label="English" default>/);
    assert.doesNotMatch(renderBlogHtml('<div class="kb-video" data-url="/uploads/blog/a.mp4" data-track="https://evil.org/s.vtt"></div>').html, /<track/);
    assert.match(renderBlogHtml('<details class="kb-accordion" data-open="true"><summary>R</summary><div class="kb-accordion-body"><p>x</p></div></details>').html, /<details class="kb-accordion" open>/);
    const out = sanitizeBlogHtml('<p data-dropcap="true" data-tone="accent">a</p><p data-tone="evil" data-dropcap="oui">b</p><h2 data-tone="muted">t</h2><ol start="3" reversed><li><p>x</p></li></ol>');
    assert.match(out, /<p data-dropcap="true" data-tone="accent">a<\/p>/);
    assert.match(out, /<p>b<\/p>/);
    assert.match(out, /<h2 data-tone="muted">t<\/h2>/);
    assert.match(out, /<ol start="3" reversed="reversed">/);
  });
  test("visibilité par appareil : mobile, tablette, ordinateur (jamais les trois à la fois, jamais d'autre valeur)", () => {
    const out = sanitizeBlogHtml('<p data-hide="desktop mobile">a</p><p data-hide="mobile tablet desktop">b</p><p data-hide="evil">c</p><div class="kb-group" data-hide="tablet"><p>d</p></div>');
    assert.match(out, /<p data-hide="mobile desktop">a<\/p>/);
    assert.match(out, /<p>b<\/p><p>c<\/p>/);
    assert.match(out, /<div class="kb-group" data-hide="tablet">/);
    assert.match(renderBlogHtml('<p data-hide="mobile">x</p>').html, /<p data-hide="mobile">x<\/p>/, "l'attribut reste dans la page : le CSS du site fait le masquage");
  });
  test("aucun de ces blocs n'est signalé comme « inconnu » par le rapport d'éléments retirés", () => {
    assert.deepEqual(findUnsupported('<pre class="kb-verse">v</pre><div class="kb-more"></div><div class="kb-file" data-url="/uploads/blog/a.pdf"></div><div class="kb-cover" data-src="/uploads/thumbnails/a.png"><p>x</p></div><div class="kb-mediatext"><div class="kb-mediatext-body"></div></div>'), []);
  });
});

describe("bloc Fichier — téléversement", () => {
  let srv, boss;
  before(async () => { srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" }); boss = await loginInstructor(srv); });
  after(() => srv.stop());
  const send = (name, type, bytes = Buffer.from("%PDF-1.4 test")) => { const fd = new FormData(); fd.append("article_file", new Blob([bytes], { type }), name); return boss.request("/formateur/blog/api/medias", { method: "POST", multipart: fd }); };

  test("un PDF est téléversé dans /uploads/blog avec l'extension imposée par son type, listé sous « file »", async () => {
    const r = await send("../../evil.html", "application/pdf");
    assert.equal(r.status, 200, r.text);
    const media = JSON.parse(r.text).media;
    assert.equal(media.kind, "file");
    assert.match(media.path, /^\/uploads\/blog\/\d+-[0-9a-f]{16}\.pdf$/);
    const list = JSON.parse((await boss.get("/formateur/blog/api/medias?type=file")).text).media;
    assert.ok(list.some((m) => m.id === media.id));
    const images = JSON.parse((await boss.get("/formateur/blog/api/medias?type=image")).text).media;
    assert.ok(!images.some((m) => m.id === media.id), "un document n'apparaît pas parmi les images");
  });
  test("un fichier de sous-titres WebVTT est accepté (extension .vtt imposée)", async () => {
    const r = await send("../../x.php", "text/vtt", Buffer.from("WEBVTT\n\n00:00.000 --> 00:02.000\nBonjour"));
    assert.equal(r.status, 200, r.text);
    assert.match(JSON.parse(r.text).media.path, /^\/uploads\/blog\/\d+-[0-9a-f]{16}\.vtt$/);
  });
  test("exécutables, pages web et SVG sont refusés", async () => {
    for (const [name, type] of [["a.exe", "application/x-msdownload"], ["a.html", "text/html"], ["a.svg", "image/svg+xml"], ["a.js", "application/javascript"], ["a.sh", "application/x-sh"]]) {
      const r = await send(name, type);
      assert.notEqual(r.status, 200, `${name} (${type}) doit être refusé`);
    }
  });
  test("l'extrait d'un article sans extrait est le texte avant « Lire la suite »", async () => {
    const fd = new FormData();
    Object.entries({ title: "Avec suite", content: '<p>Début de l\'article.</p><div class="kb-more"></div><p>Fin.</p>', content_format: "html", status: "draft" }).forEach(([k, v]) => fd.append(k, v));
    const r = await boss.request("/formateur/blog/nouveau", { method: "POST", multipart: fd, headers: { "x-blog-editor": "1" } });
    const id = JSON.parse(r.text).id;
    assert.equal(srv.db().prepare("SELECT excerpt FROM posts WHERE id = ?").get(id).excerpt, "Début de l'article.");
  });
});
