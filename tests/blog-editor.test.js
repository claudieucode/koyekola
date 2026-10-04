// Éditeur éditorial du blog : sécurité du contenu, analyse SEO, statuts et programmation, versions, sauvegarde automatique,
// médiathèque, liens internes, IA (propositions), référencement (robots, Open Graph, X, Schema.org), compatibilité.
const { test, before, after, describe } = require("node:test");
const assert = require("node:assert/strict");
const { startServer, Client, loginInstructor, newStudent, createCourse } = require("./helpers");
const { sanitizeBlogHtml, renderBlogHtml, markdownToEditorHtml } = require("../src/utils/blogHtml");
const { analyze } = require("../src/utils/seoAnalyzer");
const blogAi = require("../src/services/blogAi");

const meta = (html, name) => (html.match(new RegExp(`<meta[^>]+(?:name|property)="${name}"[^>]+content="([^"]*)"`)) || [])[1];
const jsonLd = (html) => [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].flatMap((m) => { const o = JSON.parse(m[1]); return o["@graph"] || [o]; });

describe("sécurité du contenu (assainissement)", () => {
  test("aucun script, gestionnaire d'événement, iframe, lien javascript:, image externe ni style dangereux n'est enregistré", () => {
    const dirty = `<p onclick="x()" style="position:fixed;color:#ff0000">A<script>alert(1)</script></p><img src="x" onerror="alert(1)">
      <iframe src="https://evil.example"></iframe><a href="javascript:alert(1)">x</a><a href="data:text/html,x">y</a>
      <img src="https://pisteur.example/p.gif" alt=""><svg onload="x()"></svg><style>body{}</style>
      <div class="kb-video" data-url="javascript:alert(1)"></div><div class="kb-audio" data-src="/uploads/videos/a.mp3"></div>
      <div class="evil kb-cta" onmouseover="x">ok</div><a href="https://ex.com" class="btn btn-primary evil" rel="evil sponsored">b</a>`;
    const s = sanitizeBlogHtml(dirty);
    for (const bad of [/<script/, /onclick|onerror|onload|onmouseover/, /<iframe/, /javascript:/, /data:text/, /pisteur/, /<svg/, /<style/, /position:fixed/, /kb-audio/, /\bevil\b/]) assert.doesNotMatch(s, bad, String(bad));
    assert.match(s, /style="color:#ff0000"/);
    assert.match(s, /<div class="kb-cta">ok<\/div>/);
    assert.match(s, /<a href="https:\/\/ex.com" (?:class="btn btn-primary" rel="sponsored"|rel="sponsored" class="btn btn-primary")>b<\/a>/);
  });
  test("liens : nouvel onglet = noopener noreferrer ; seuls nofollow, sponsored, ugc sont gardés", () => {
    const s = sanitizeBlogHtml('<p><a href="https://ex.com" target="_blank" rel="ugc nofollow">a</a> <a href="/cours/x" target="_top">b</a></p>');
    assert.match(s, /<a href="https:\/\/ex.com" target="_blank" rel="ugc nofollow noopener noreferrer">a<\/a>/);
    assert.match(s, /<a href="\/cours\/x">b<\/a>/);
  });
  test("affichage : lecteurs vidéo fabriqués par le serveur (YouTube sans cookies, Vimeo, fichier du blog) ; le reste devient un lien", () => {
    const r = renderBlogHtml('<div class="kb-video" data-url="https://youtu.be/dQw4w9WgXcQ" data-caption="Démo"></div><div class="kb-embed" data-url="https://vimeo.com/76979871"></div><div class="kb-embed" data-url="https://open.spotify.com/x"></div><div class="kb-video" data-url="/uploads/blog/a.mp4"></div><div class="kb-video" data-url="https://evil.example/a.mp4"></div>');
    assert.match(r.html, /<iframe src="https:\/\/www\.youtube-nocookie\.com\/embed\/dQw4w9WgXcQ\?rel=0" title="Démo" loading="lazy"/);
    assert.match(r.html, /player\.vimeo\.com\/video\/76979871/);
    assert.match(r.html, /<a href="https:\/\/open\.spotify\.com\/x" target="_blank" rel="noopener noreferrer nofollow">Voir le contenu sur open\.spotify\.com<\/a>/);
    assert.match(r.html, /<video src="\/uploads\/blog\/a\.mp4" controls preload="metadata"/);
    assert.doesNotMatch(r.html, /evil\.example/);
  });
  test("affichage : sommaire (H2 + H3, ou H2 seuls), H1 du contenu affiché en H2, image (largeur, crédit, chargement différé), FAQ et étapes extraites", () => {
    const html = `<h1>Grand</h1><h2>Un</h2><h3>Sous</h3><h4>Petit</h4><div class="callout callout-conseil" data-callout="conseil"><h2>Dans l'encadré</h2></div>
      <figure class="kb-image" data-width="50" data-credit="Ana"><img src="/uploads/thumbnails/a.webp" alt="A"><figcaption>Légende</figcaption></figure>
      <div class="kb-faq"><details class="kb-faq-item"><summary>Q1 ?</summary><div class="kb-faq-answer"><p>R1.</p></div></details></div>
      <ol class="kb-steps" data-title="Créer un site"><li><p><strong>Nom</strong> choisir</p></li><li><p><strong>Publier</strong> en ligne</p></li></ol>`;
    const r = renderBlogHtml(html);
    assert.deepEqual(r.toc.map((t) => [t.level, t.id]), [[2, "grand"], [2, "un"], [3, "sous"]], "H4 et titres d'encadré hors sommaire");
    assert.match(r.html, /<h2 class="rt-h1" id="grand">Grand<\/h2>/);
    assert.deepEqual(renderBlogHtml(html, { tocDepth: 2 }).toc.map((t) => t.level), [2, 2]);
    assert.match(r.html, /<figure class="kb-image" data-width="50" data-credit="Ana" style="max-width: 50%"><img src="\/uploads\/thumbnails\/a\.webp" alt="A" loading="lazy" decoding="async"><figcaption>Légende<span class="kb-credit">Crédit : Ana<\/span><\/figcaption><\/figure>/);
    assert.match(r.html, /<p class="callout-title">Conseil<\/p>/);
    assert.deepEqual(r.faq, [{ q: "Q1 ?", a: "R1." }]);
    assert.deepEqual(r.howto, [{ name: "Créer un site", steps: [{ name: "Nom", text: "choisir" }, { name: "Publier", text: "en ligne" }] }]);
  });
  test("ancien article Markdown ouvert dans l'éditeur : encadrés, images, formations et boutons conservés", () => {
    const h = markdownToEditorHtml(":::a-retenir Point clé\nTexte\n:::\n\n![Alt](/uploads/thumbnails/a.webp)\nLégende : cap\n\n[[formation:excel]]\n\n[[bouton:Go|/catalogue]]\n\n## Titre");
    assert.match(h, /<div class="callout callout-a-retenir" data-callout="a-retenir" data-title="Point clé"><p>Texte<\/p><\/div>/);
    assert.match(h, /<figure class="kb-image" data-align="center"><img src="\/uploads\/thumbnails\/a\.webp" alt="Alt"><figcaption>cap<\/figcaption><\/figure>/);
    assert.match(h, /<div class="kb-course" data-course="excel"><\/div>/);
    assert.match(h, /<p class="kb-button" data-align="center"><a href="\/catalogue" class="btn btn-primary">Go<\/a><\/p>/);
    assert.match(h, /<h2>Titre<\/h2>/);
  });
});

describe("analyse SEO et lisibilité (repères internes)", () => {
  const sentence = "La formation en ligne aide à progresser. Par exemple, on apprend le soir. Ensuite, on pratique sur des cas réels. ";
  const base = { title: "Formation en ligne : guide", seoTitle: "Formation en ligne : le guide complet", metaDescription: "Découvrez comment la formation en ligne vous aide à progresser à votre rythme, avec des conseils concrets et des exemples utiles.", slug: "formation-en-ligne-guide", focusKeyword: "formation en ligne", hasCover: true, coverAlt: "x" };
  const status = (r, id) => r.checks.find((c) => c.id === id).status;
  test("mot-clé : absent, utilisation naturelle, répétition excessive (jamais encouragée)", () => {
    const natural = `<p>${"Apprendre à son rythme change tout. ".repeat(30)} La formation en ligne aide.</p><h2>La formation en ligne au quotidien</h2><p>${"Un texte varié et utile pour le lecteur. ".repeat(30)}</p><p>La formation en ligne encore.</p>`;
    assert.equal(status(analyze({ ...base, html: "<p>Rien à voir.</p>" }), "kw-density"), "problem");
    assert.equal(status(analyze({ ...base, html: natural }), "kw-density"), "good");
    const stuffed = analyze({ ...base, html: `<p>${sentence.repeat(12)}</p>` });
    assert.equal(status(stuffed, "kw-density"), "problem");
    assert.match(stuffed.checks.find((c) => c.id === "kw-density").label, /trop répété/);
  });
  test("structure : H1 dans le contenu, niveau sauté, image sans texte alternatif, liens internes et externes", () => {
    const r = analyze({ ...base, html: '<h1>X</h1><h3>Saut</h3><figure class="kb-image"><img src="/uploads/thumbnails/a.webp" alt=""></figure><p><a href="/cours/x">a</a> <a href="https://ex.com">b</a></p>' });
    assert.equal(status(r, "h1"), "improve");
    assert.equal(status(r, "hierarchy"), "improve");
    assert.equal(status(r, "images"), "problem");
    assert.equal(status(r, "internal"), "good");
    assert.equal(status(r, "external"), "good");
  });
  test("méta : description absente, titre SEO long, canonique vers un autre site, contenu court", () => {
    const r = analyze({ ...base, metaDescription: "", seoTitle: "x".repeat(66), canonical: "https://autre-site.example/a", siteUrl: "https://kolakisa.com", html: "<p>Court.</p>" });
    assert.equal(status(r, "meta"), "problem");
    assert.equal(status(r, "seo-title"), "improve");
    assert.equal(status(r, "canonical"), "improve");
    assert.equal(status(r, "length"), "problem");
  });
  test("lisibilité : phrases trop longues et paragraphes interminables signalés", () => {
    const long = `Cette phrase ${"vraiment ".repeat(28)}longue se termine ici. `;
    const r = analyze({ ...base, html: `<p>${long.repeat(6)}</p>` });
    assert.equal(status(r, "sentences"), "improve");
    assert.equal(status(r, "paragraphs"), "improve");
  });
});

describe("assistant IA : propositions seulement", () => {
  after(() => blogAi.setClientForTests(null));
  test("sans clé : indisponible (aucune fausse réponse)", async () => {
    blogAi.setClientForTests(null);
    const saved = process.env.ANTHROPIC_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    await assert.rejects(blogAi.assist({ action: "resumer", article: "Texte" }), (e) => e.code === "not_configured");
    if (saved) process.env.ANTHROPIC_API_KEY = saved;
  });
  test("requête : modèle, repli automatique en cas de refus, réponse au format demandé ; refus signalé ; liens inventés écartés", async () => {
    let request;
    blogAi.setClientForTests({ beta: { messages: { create: async (r) => { request = r; return { stop_reason: "end_turn", model: r.model, content: [{ type: "text", text: JSON.stringify({ links: [{ anchor: "Excel", url: "/cours/excel", reason: "r" }, { anchor: "Excel", url: "/inventee", reason: "r" }, { anchor: "absent", url: "/cours/excel", reason: "r" }] }) }] }; } } } });
    const r = await blogAi.assist({ action: "liens", article: "Apprendre Excel vite", title: "T", candidates: [{ title: "Excel", url: "/cours/excel" }] });
    assert.equal(request.model, "claude-opus-5-5");
    assert.equal(request.fallbacks, "default");
    assert.deepEqual(request.betas, ["server-side-fallback-2026-07-01"]);
    assert.equal(request.output_config.format.type, "json_schema");
    assert.deepEqual(r.result.links, [{ anchor: "Excel", url: "/cours/excel", reason: "r" }]);
    blogAi.setClientForTests({ beta: { messages: { create: async () => ({ stop_reason: "refusal", content: [] }) } } });
    await assert.rejects(blogAi.assist({ action: "resumer", article: "Texte" }), (e) => e.code === "refusal");
    await assert.rejects(blogAi.assist({ action: "reecrire", text: "", article: "" }), (e) => e.code === "invalid");
  });
});

describe("éditeur : enregistrement, statuts, versions, sauvegarde automatique, médias, liens", () => {
  let srv, prof;
  const q = (sql, ...a) => { const db = srv.db(); const r = db.prepare(sql).all(...a); db.close(); return r; };
  const run = (sql, ...a) => { const db = srv.db(); db.prepare(sql).run(...a); db.close(); };
  const anon = () => new Client(srv.base);
  const json = (r) => JSON.parse(r.text);
  async function save(url, fields, files = {}) {
    const fd = new FormData();
    for (const [k, v] of Object.entries(fields)) for (const one of [].concat(v)) fd.append(k, one);
    for (const [k, f] of Object.entries(files)) fd.append(k, new Blob([f.data || Buffer.alloc(80, 3)], { type: f.type }), f.name);
    return prof.request(url, { method: "POST", multipart: fd, headers: { "x-blog-editor": "1" } });
  }
  const html = '<p>La formation en ligne aide à progresser.</p><h2>Pourquoi</h2><p>Texte.</p><div class="kb-faq"><details class="kb-faq-item"><summary>Question ?</summary><div class="kb-faq-answer"><p>Réponse.</p></div></details></div><ol class="kb-steps" data-title="Démarrer"><li><p><strong>Un</strong> premier</p></li><li><p><strong>Deux</strong> second</p></li></ol><script>alert(1)</script>';
  const base = { title: "Article riche", excerpt: "Résumé.", content: html, content_format: "html", category: "Bureautique", tags: "Excel, formation" };
  before(async () => {
    srv = await startServer({ SITE_URL: "" });
    prof = await loginInstructor(srv);
  });
  after(() => srv.stop());

  test("création (réponse JSON de l'éditeur) : HTML assaini, brouillon, première version", async () => {
    const r = await save("/formateur/blog/nouveau", base);
    assert.equal(r.status, 200);
    const out = json(r);
    assert.equal(out.status, "draft");
    const p = q("SELECT * FROM posts WHERE id = ?", out.id)[0];
    assert.equal(p.content_format, "html");
    assert.doesNotMatch(p.content, /<script/);
    assert.equal(p.published, 0);
    assert.equal(q("SELECT COUNT(*) n FROM post_revisions WHERE post_id = ?", p.id)[0].n, 1);
    assert.equal((await anon().get(`/blog/${p.slug}`)).status, 404, "brouillon invisible");
  });
  test("statuts : relecture et archivé hors ligne ; publication refusée pour un article vide ; programmé puis publié à l'heure dite", async () => {
    const id = json(await save("/formateur/blog/nouveau", { ...base, title: "Statuts" })).id;
    const p = () => q("SELECT * FROM posts WHERE id = ?", id)[0];
    await save(`/formateur/blog/${id}/modifier`, { ...base, title: "Statuts", status: "review" });
    assert.deepEqual([p().status, p().published], ["review", 0]);
    const empty = await save(`/formateur/blog/${id}/modifier`, { ...base, title: "Statuts", content: "<p></p>", status: "published" });
    assert.equal(empty.status, 400);
    assert.match(json(empty).error, /vide/);
    const past = await save(`/formateur/blog/${id}/modifier`, { ...base, title: "Statuts", status: "scheduled", published_at_utc: "2020-01-01T10:00:00.000Z" });
    assert.equal(past.status, 400, "programmation dans le passé refusée");
    const future = new Date(Date.now() + 3600_000).toISOString();
    await save(`/formateur/blog/${id}/modifier`, { ...base, title: "Statuts", status: "scheduled", published_at_utc: future });
    assert.deepEqual([p().status, p().published], ["scheduled", 0]);
    assert.equal((await anon().get(`/blog/${p().slug}`)).status, 404, "pas encore en ligne");
    run("UPDATE posts SET published_at = datetime('now', '-1 minute') WHERE id = ?", id); // l'heure est passée
    assert.equal((await anon().get(`/blog/${p().slug}`)).status, 200, "publié automatiquement");
    assert.deepEqual([p().status, p().published], ["published", 1]);
    await save(`/formateur/blog/${id}/modifier`, { ...base, title: "Statuts", status: "archived" });
    assert.equal((await anon().get(`/blog/${p().slug}`)).status, 404, "archivé : hors ligne");
    assert.ok(p().published_at, "date de première publication conservée");
  });
  test("calendrier de publication : date UTC exacte enregistrée, « Effacer » sur un article planifié refusé (pas de retour silencieux à l'ancienne date)", async () => {
    const id = json(await save("/formateur/blog/nouveau", { ...base, title: "Calendrier" })).id;
    const p = () => ({ ...q("SELECT status, published_at FROM posts WHERE id = ?", id)[0] });
    // 02/10/2027 15:00 à Los Angeles = 22:00 UTC : ni le jour ni l'heure ne glissent
    await save(`/formateur/blog/${id}/modifier`, { ...base, title: "Calendrier", status: "scheduled", published_at_utc: "2027-10-02T22:00:00.000Z" });
    assert.deepEqual(p(), { status: "scheduled", published_at: "2027-10-02 22:00:00" });
    const form = await prof.get(`/formateur/blog/${id}/modifier`);
    assert.match(form.text, /id="post-date" type="datetime-local" value="2027-10-02T22:00" data-date-input data-utc="1"/);
    // Enregistrement sans toucher à la date : conservée
    await save(`/formateur/blog/${id}/modifier`, { ...base, title: "Calendrier", status: "scheduled" });
    assert.equal(p().published_at, "2027-10-02 22:00:00");
    // Date effacée dans le calendrier : refus explicite, l'ancienne date n'est pas réappliquée en douce
    const cleared = await save(`/formateur/blog/${id}/modifier`, { ...base, title: "Calendrier", status: "scheduled", published_at_utc: "" });
    assert.equal(cleared.status, 400);
    assert.match(json(cleared).error, /date/i);
    assert.deepEqual(p(), { status: "scheduled", published_at: "2027-10-02 22:00:00" });
  });
  test("versions : une par enregistrement, avec auteur et résumé ; consulter ; restaurer (ajoute une version)", async () => {
    const id = json(await save("/formateur/blog/nouveau", { ...base, title: "Versions", content: "<p>Première version.</p>" })).id;
    await save(`/formateur/blog/${id}/modifier`, { ...base, title: "Versions (modifié)", content: "<p>Deuxième version avec plus de mots ici.</p>" });
    const list = json(await prof.get(`/formateur/blog/${id}/versions`)).revisions;
    assert.equal(list.length, 2);
    assert.match(list[0].note, /Titre modifié · Contenu modifié \(\+\d+ mots\)/);
    assert.equal(list[0].author, "Prof");
    const first = list[1];
    assert.match(json(await prof.get(`/formateur/blog/${id}/versions/${first.id}`)).html, /Première version/);
    await prof.request(`/formateur/blog/${id}/versions/${first.id}/restaurer`, { method: "POST", headers: { "x-blog-editor": "1" } });
    const p = q("SELECT title, content FROM posts WHERE id = ?", id)[0];
    assert.deepEqual([p.title, p.content], ["Versions", "<p>Première version.</p>"]);
    assert.match(json(await prof.get(`/formateur/blog/${id}/versions`)).revisions[0].note, /Restauration de la version du/);
  });
  test("sauvegarde automatique : brouillon créé à la volée, contenu assaini, proposé à la réouverture, utilisé par l'aperçu, effacé à l'enregistrement", async () => {
    const created = json(await prof.request("/formateur/blog/api/brouillon", { method: "POST", form: { title: "Auto" } }));
    const fd = new FormData();
    fd.append("title", "Auto");
    fd.append("content", "<p>Texte non enregistré.</p><img src=x onerror=alert(1)>");
    assert.equal((await prof.request(`/formateur/blog/${created.id}/autosave`, { method: "POST", multipart: fd })).status, 200);
    const stored = JSON.parse(q("SELECT payload FROM post_autosaves WHERE post_id = ?", created.id)[0].payload);
    assert.doesNotMatch(stored.content, /onerror/);
    run("UPDATE posts SET updated_at = datetime('now', '-1 hour') WHERE id = ?", created.id);
    const page = (await prof.get(`/formateur/blog/${created.id}/modifier`)).text;
    assert.match(page, /"autosave":\{"savedAt"/);
    assert.match((await prof.get(`/formateur/blog/${created.id}/apercu`)).text, /Texte non enregistré/);
    assert.match((await prof.get(`/formateur/blog/${created.id}/apercu`)).text, /noindex/);
    await save(`/formateur/blog/${created.id}/modifier`, { ...base, title: "Auto" });
    assert.equal(q("SELECT COUNT(*) n FROM post_autosaves WHERE post_id = ?", created.id)[0].n, 0);
    const student = await newStudent(srv);
    assert.equal((await student.request(`/formateur/blog/${created.id}/autosave`, { method: "POST", form: { title: "x" } })).status, 403);
  });
  test("médiathèque : envoi (image, vidéo, audio publics), informations, suppression refusée si utilisée, image principale choisie dans la médiathèque", async () => {
    const up = async (field, name, type) => { const fd = new FormData(); fd.append(field, new Blob([Buffer.alloc(64, 2)], { type }), name); fd.append("width", "1200"); fd.append("height", "675"); return prof.request("/formateur/blog/api/medias", { method: "POST", multipart: fd }); };
    const img = json(await up("article_image", "a.png", "image/png")).media;
    assert.match(img.path, /^\/uploads\/thumbnails\/.+\.png$/);
    assert.equal(img.width, 1200);
    assert.match(json(await up("article_video", "v.mp4", "video/mp4")).media.path, /^\/uploads\/blog\/.+\.mp4$/);
    const audio = json(await up("article_audio", "s.mp3", "audio/mpeg")).media;
    assert.match(audio.path, /^\/uploads\/blog\/.+\.mp3$/);
    assert.equal((await anon().get(audio.path)).status, 200, "fichier audio du blog public");
    assert.equal((await up("article_audio", "x.html", "text/html")).status, 400);
    await prof.request(`/formateur/blog/api/medias/${img.id}`, { method: "POST", json: { alt: "Texte alt", caption: "Légende", credit: "Ana", description: "Desc", title: "T" } });
    assert.deepEqual(Object.values(q("SELECT alt, caption, credit FROM media WHERE id = ?", img.id)[0]), ["Texte alt", "Légende", "Ana"]);
    const id = json(await save("/formateur/blog/nouveau", { ...base, title: "Avec média", cover_media: img.path, content: `<figure class="kb-image"><img src="${img.path}" alt="Texte alt"></figure><p>x</p>` })).id;
    assert.equal(q("SELECT cover_path FROM posts WHERE id = ?", id)[0].cover_path, img.path);
    const del = await prof.request(`/formateur/blog/api/medias/${img.id}/supprimer`, { method: "POST" });
    assert.equal(del.status, 400);
    assert.match(json(del).error, /Avec média/);
    assert.equal((await prof.request("/formateur/blog/nouveau", { method: "POST", multipart: (() => { const fd = new FormData(); fd.append("title", "Pirate"); fd.append("cover_media", "/uploads/videos/secret.mp4"); fd.append("content", "x"); return fd; })(), headers: { "x-blog-editor": "1" } })).status, 200);
    assert.equal(q("SELECT cover_path FROM posts WHERE title = 'Pirate'")[0].cover_path, null, "seules les images connues de la médiathèque");
  });
  test("liens internes : recherche (formations, articles, catégories, pages) et suggestions d'après le texte", async () => {
    await createCourse(prof, srv, { title: "Excel avancé", price: 49 });
    const id = json(await save("/formateur/blog/nouveau", { ...base, title: "Bien utiliser Excel au travail", status: "published" })).id;
    const found = json(await prof.get("/formateur/blog/api/liens?q=excel")).results;
    assert.deepEqual(found.map((r) => r.type).slice(0, 2), ["formation", "article"]);
    assert.ok(json(await prof.get("/formateur/blog/api/liens?q=catalogue")).results.some((r) => r.url === "/catalogue"));
    const sug = json(await prof.request("/formateur/blog/api/suggestions", { method: "POST", json: { text: "Avec Excel avancé vous irez plus vite au travail.", postId: 0, linked: [] } })).suggestions;
    assert.ok(sug.some((s) => s.type === "formation" && /Excel/.test(s.title)));
    assert.ok(sug.some((s) => s.url.startsWith("/blog/bien-utiliser-excel")));
    const without = json(await prof.request("/formateur/blog/api/suggestions", { method: "POST", json: { text: "Avec Excel avancé", postId: id, linked: [found[0].url] } })).suggestions;
    assert.ok(!without.some((s) => s.url === found[0].url), "un lien déjà présent n'est pas reproposé");
  });
  test("IA : sans clé, réponse claire (503) ; réservée au formateur", async () => {
    const r = await prof.request("/formateur/blog/api/ia", { method: "POST", json: { action: "resumer", article: "Texte" } });
    assert.equal(r.status, 503);
    assert.match(json(r).error, /ANTHROPIC_API_KEY/);
    assert.equal(json(await prof.get("/formateur/blog/api/ia")).configured, false);
    const student = await newStudent(srv);
    assert.equal((await student.request("/formateur/blog/api/ia", { method: "POST", json: { action: "resumer" } })).status, 403);
  });
  test("référencement : robots, Open Graph (adresse, type), carte X personnalisée, Article, FAQPage, HowTo, fil d'Ariane, sitemap", async () => {
    const id = json(await save("/formateur/blog/nouveau", { ...base, content: `${base.content}<h2>Deuxième section</h2><p>Suite.</p>`, title: "SEO complet", status: "published", schema_type: "Article", twitter_card: "summary", twitter_title: "Titre X", twitter_description: "Desc X", og_title: "Titre OG", subcategory: "Excel", language: "en", featured: "1", toc_enabled: ["0", "1"], toc_depth: "2", toc_title: "Au programme" })).id;
    const slug = q("SELECT slug FROM posts WHERE id = ?", id)[0].slug;
    let h = (await anon().get(`/blog/${slug}`)).text;
    assert.equal(meta(h, "og:type"), "article");
    assert.match(meta(h, "og:url"), new RegExp(`/blog/${slug}$`));
    assert.equal(meta(h, "og:title"), "Titre OG");
    assert.equal(meta(h, "twitter:card"), "summary");
    assert.equal(meta(h, "twitter:title"), "Titre X");
    assert.equal(meta(h, "twitter:description"), "Desc X");
    assert.equal(meta(h, "robots"), undefined, "indexable par défaut");
    const ld = jsonLd(h);
    const art = ld.find((x) => x["@type"] === "Article");
    assert.ok(art, "Article présent dans le graphe");
    assert.equal(art.inLanguage, "en");
    assert.deepEqual(ld.find((x) => x["@type"] === "FAQPage").mainEntity[0], { "@type": "Question", name: "Question ?", acceptedAnswer: { "@type": "Answer", text: "Réponse." } });
    assert.deepEqual(ld.find((x) => x["@type"] === "HowTo").step.map((s) => s.name), ["Un", "Deux"]);
    assert.deepEqual(ld.find((x) => x["@type"] === "BreadcrumbList").itemListElement.map((i) => i.name), ["Accueil", "Blog", "Bureautique", "SEO complet"]);
    assert.match(h, /<article class="article-main" data-article lang="en">/);
    assert.match(h, /id="toc-title">Au programme<\/p>/);
    assert.match((await anon().get("/blog")).text, /<article class="blog-featured">[\s\S]*SEO complet/);
    assert.match((await anon().get("/sitemap.xml")).text, new RegExp(slug));
    await save(`/formateur/blog/${id}/modifier`, { ...base, title: "SEO complet", status: "published", robots_index: ["0"], robots_follow: ["0", "1"] });
    h = (await anon().get(`/blog/${slug}`)).text;
    assert.equal(meta(h, "robots"), "noindex, follow");
    assert.doesNotMatch((await anon().get("/sitemap.xml")).text, new RegExp(slug), "noindex : hors du plan du site");
  });
  test("catégories et étiquettes sans doublon ; sous-catégorie ; cases à cocher envoyées avec leur champ caché", async () => {
    await save("/formateur/blog/nouveau", { ...base, title: "Référence", subcategory: "Excel" });
    const id = json(await save("/formateur/blog/nouveau", { ...base, title: "Doublons", category: "  bureautique ", subcategory: "excel", tags: "excel, FORMATION, Nouveau" })).id;
    const p = q("SELECT category, subcategory, tags, toc_enabled, featured FROM posts WHERE id = ?", id)[0];
    assert.equal(p.category, "Bureautique", "orthographe existante reprise");
    assert.equal(p.subcategory, "Excel");
    assert.equal(p.tags, "Excel, formation, Nouveau");
    await save(`/formateur/blog/${id}/modifier`, { ...base, title: "Doublons", toc_enabled: ["0"], featured: "0" });
    assert.equal(q("SELECT toc_enabled FROM posts WHERE id = ?", id)[0].toc_enabled, 0);
  });
  test("lien modifié après publication : l'ancienne adresse redirige (301), aucune collision avec un ancien lien", async () => {
    const id = json(await save("/formateur/blog/nouveau", { ...base, title: "Lien mobile", status: "published" })).id;
    const first = q("SELECT slug FROM posts WHERE id = ?", id)[0].slug;
    const r = json(await save(`/formateur/blog/${id}/modifier`, { ...base, title: "Lien mobile", status: "published", slug: "Nouvelle Adresse!" }));
    assert.equal(r.slug, "nouvelle-adresse");
    const old = await anon().get(`/blog/${first}`);
    assert.equal(old.status, 301);
    assert.equal(old.location, "/blog/nouvelle-adresse");
    assert.equal((await anon().get("/blog/nouvelle-adresse")).status, 200);
    // un autre article ne peut pas prendre l'ancienne adresse (elle reste réservée à la redirection)
    const other = json(await save("/formateur/blog/nouveau", { ...base, title: "Autre", slug: first, status: "published" }));
    assert.notEqual(other.slug, first);
  });
  test("statut : un article publié repassé en brouillon est retiré du site (jamais enregistré comme publié)", async () => {
    const id = json(await save("/formateur/blog/nouveau", { ...base, title: "Va et vient", status: "published" })).id;
    const slug = q("SELECT slug FROM posts WHERE id = ?", id)[0].slug;
    for (const st of ["draft", "review", "archived"]) {
      const r = json(await save(`/formateur/blog/${id}/modifier`, { ...base, title: "Va et vient", status: st }));
      assert.equal(r.status, st);
      assert.equal(r.published, 0);
      assert.equal((await anon().get(`/blog/${slug}`)).status, 404, st);
    }
  });
  test("apparence de l'éditeur : enregistrée sur le compte, couleur personnalisée validée", async () => {
    const set = (body) => prof.request("/formateur/blog/api/apparence", { method: "POST", json: body });
    assert.equal(json(await set({ theme: "nuit" })).contrast, "light");
    assert.match((await prof.get("/formateur/blog/nouveau")).text, /data-ed-theme="nuit"/);
    const perso = json(await set({ theme: "perso", color: "#F9D7E8" }));
    assert.deepEqual([perso.key, perso.color, perso.contrast], ["perso", "#f9d7e8", "dark"]);
    assert.equal((await set({ theme: "perso", color: "red;}" })).status, 400);
    assert.equal(json(await set({ theme: "inconnu" })).key, "clair");
    assert.doesNotMatch((await prof.get("/formateur/blog/nouveau")).text, /data-ed-theme=/);
    assert.equal((await anon().request("/formateur/blog/api/apparence", { method: "POST", json: { theme: "noir" } })).status, 302);
  });
  test("images de l'article : dimensions réelles de la médiathèque ajoutées (pas de décalage au chargement)", async () => {
    run("INSERT INTO media (path, kind, mime, size, width, height, alt, title) VALUES ('/uploads/thumbnails/dim-test.webp', 'image', 'image/webp', 10, 1200, 675, '', '')");
    run("INSERT INTO posts (slug, title, content, content_format, published, published_at, status) VALUES ('dimensions', 'Dimensions', '<figure class=\"kb-image\"><img src=\"/uploads/thumbnails/dim-test.webp\" alt=\"a\"></figure><figure class=\"kb-image\"><img src=\"/uploads/thumbnails/inconnue.webp\" alt=\"b\"></figure>', 'html', 1, datetime('now'), 'published')");
    const page = (await anon().get("/blog/dimensions")).text;
    assert.match(page, /<img src="\/uploads\/thumbnails\/dim-test\.webp" alt="a"[^>]*width="1200" height="675"/);
    assert.match(page, /<img src="\/uploads\/thumbnails\/inconnue\.webp" alt="b" loading="lazy" decoding="async">/);
  });
  test("ancien article Markdown : s'ouvre dans l'éditeur (converti) et reste affiché tel quel tant qu'il n'est pas réenregistré", async () => {
    run("INSERT INTO posts (slug, title, content, published, published_at, status) VALUES ('ancien', 'Ancien', ':::conseil\nAstuce\n:::\n\n## Section', 1, datetime('now'), 'published')");
    const editor = (await prof.get(`/formateur/blog/${q("SELECT id FROM posts WHERE slug = 'ancien'")[0].id}/modifier`)).text;
    assert.match(editor, /&lt;div class=&#34;callout callout-conseil&#34;|&lt;div class="callout callout-conseil"|callout callout-conseil/);
    const pub = (await anon().get("/blog/ancien")).text;
    assert.match(pub, /<aside class="callout callout-conseil" role="note">/);
    assert.match(pub, /<h2 id="section">Section<\/h2>/);
  });
});

describe("assistant IA : connexion serveur à Anthropic (API simulée localement), clé jamais exposée", () => {
  const http = require("node:http");
  const SECRET = "sk-ant-api03-cle-de-test-qui-ne-doit-jamais-sortir";
  let srv, prof, fake, status = 200, received = [], errMessage = "x", betaRefused = false;
  before(async () => {
    fake = http.createServer((req, res) => {
      let body = "";
      req.on("data", (c) => (body += c));
      req.on("end", () => {
        received.push({ key: req.headers["x-api-key"], beta: req.headers["anthropic-beta"] || "", body: JSON.parse(body) });
        if (betaRefused && req.headers["anthropic-beta"]) { res.writeHead(400, { "content-type": "application/json" }); return res.end(JSON.stringify({ type: "error", error: { type: "invalid_request_error", message: "Unexpected value(s) `server-side-fallback-2026-07-01` for the `anthropic-beta` header." } })); }
        res.writeHead(status, { "content-type": "application/json" });
        if (status !== 200) return res.end(JSON.stringify({ type: "error", error: { type: status === 401 ? "authentication_error" : status === 400 ? "invalid_request_error" : "api_error", message: errMessage } }));
        res.end(JSON.stringify({ id: "m", type: "message", role: "assistant", model: "claude-opus-5-5", content: [{ type: "text", text: JSON.stringify({ text: "Résumé proposé." }) }], stop_reason: "end_turn", usage: { input_tokens: 1, output_tokens: 1 } }));
      });
    });
    await new Promise((r) => fake.listen(0, "127.0.0.1", r));
    srv = await startServer({ ANTHROPIC_API_KEY: SECRET, ANTHROPIC_BASE_URL: `http://127.0.0.1:${fake.address().port}` });
    prof = await loginInstructor(srv);
  });
  after(async () => { await srv.stop(); fake.close(); });
  const ask = (body) => prof.request("/formateur/blog/api/ia", { method: "POST", json: body });

  test("la clé part uniquement du serveur vers Anthropic ; la réponse au navigateur ne contient que la proposition", async () => {
    const r = await ask({ action: "resumer", article: "Un article sur Excel.", title: "Excel" });
    assert.equal(r.status, 200);
    assert.equal(JSON.parse(r.text).result.text, "Résumé proposé.");
    assert.equal(received.at(-1).key, SECRET);
    assert.equal(received.at(-1).body.model, "claude-opus-5-5");
    assert.doesNotMatch(r.text, /sk-ant/);
    assert.match((await prof.get("/formateur/blog/api/ia")).text, /"configured":true/);
    assert.doesNotMatch((await prof.get("/formateur/blog/nouveau")).text, /sk-ant|Non activé/);
  });
  test("clé refusée / panne d'Anthropic : message clair, jamais la clé, rien dans les journaux", async () => {
    status = 401;
    const denied = await ask({ action: "resumer", article: "Texte." });
    assert.equal(denied.status, 400);
    assert.match(denied.text, /refusée/);
    status = 500;
    const down = await ask({ action: "resumer", article: "Texte." });
    assert.equal(down.status, 400);
    assert.match(down.text, /Réessayez/);
    status = 200;
    for (const r of [denied, down]) assert.doesNotMatch(r.text, /sk-ant/);
    assert.doesNotMatch(srv.log(), new RegExp(SECRET));
  });
  test("crédit Anthropic épuisé (400) : cause expliquée en français", async () => {
    status = 400;
    errMessage = "Your credit balance is too low to access the Anthropic API. Please go to Plans & Billing to upgrade or purchase credits.";
    const r = await ask({ action: "resumer", article: "Texte." });
    assert.equal(r.status, 400);
    assert.match(r.text, /Crédit Anthropic insuffisant/);
    errMessage = "messages: text content blocks must be non-empty";
    assert.match((await ask({ action: "resumer", article: "Texte." })).text, /Anthropic a refusé la demande \(400\) : « messages: text content blocks must be non-empty »/);
    status = 200;
    errMessage = "x";
  });
  test("option bêta refusée pour le compte : la demande est refaite automatiquement sans elle", async () => {
    betaRefused = true;
    received = [];
    const r = await ask({ action: "resumer", article: "Texte." });
    betaRefused = false;
    assert.equal(r.status, 200, r.text);
    assert.equal(JSON.parse(r.text).result.text, "Résumé proposé.");
    assert.equal(received.length, 2);
    assert.match(received[0].beta, /server-side-fallback/);
    assert.equal(received[1].beta, "");
    assert.equal(received[1].body.fallbacks, undefined);
    assert.equal(received[1].body.model, "claude-opus-5-5");
  });
  test("réservé au formateur connecté", async () => {
    const anonymous = await new Client(srv.base).request("/formateur/blog/api/ia", { method: "POST", json: { action: "resumer", article: "x" } });
    assert.equal(anonymous.status, 302);
  });
});
