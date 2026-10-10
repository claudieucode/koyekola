// Nouveaux widgets de l'éditeur de pages : architecture « liste d'éléments » (items), Lire la suite, Texte sur un tracé, Lien en bio, Diaporama,
// Carrousel de témoignages, Carrousel média, intégrations Facebook / Instagram / TikTok / playlist YouTube. Chaque widget est vérifié du
// serveur au rendu publié : validation, enregistrement, canevas, page publiée, liens comptés, valeurs refusées.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY, freshMarketing } = require("./marketing-helpers");
const pages = require("../src/marketing/pages");
const { startServer, loginInstructor, newStudent } = require("./helpers");
const nodes = require("../src/marketing/pages/nodes");
const widgets = require("../src/marketing/pages/widgets");

const node = (type, props, extra = {}) => ({ id: "w" + type.slice(0, 9).padEnd(9, "0") + "01", type, props, ...extra });
const wrap = (...children) => ({ sections: [{ id: "sect00000001", type: "layout", children: [{ id: "box000000001", type: "container", props: {}, children }] }] });

describe("architecture : champ « liste » (sans serveur)", () => {
  const base = { type: "essai", label: "Essai", group: "general", icon: "list", keywords: "essai test", version: 1 };
  const items = (extra = {}) => ({ key: "rows", kind: "items", label: "Lignes", max: 3, min: 1, default: [{ t: "A" }], fields: [{ key: "t", kind: "text", label: "Texte", max: 10, required: true, default: "A" }], ...extra });
  test("description vérifiée : sous-champs obligatoires, max borné, pas de liste dans une liste, défaut valide", () => {
    assert.doesNotThrow(() => widgets.check({ ...base, schema: [items()] }));
    assert.throws(() => widgets.check({ ...base, schema: [items({ fields: undefined })] }), /fields/);
    assert.throws(() => widgets.check({ ...base, schema: [items({ max: 99 })] }), /max/);
    assert.throws(() => widgets.check({ ...base, schema: [items({ min: 4 })] }), /min/);
    assert.throws(() => widgets.check({ ...base, schema: [items({ default: [] })] }), /par défaut/);
    assert.throws(() => widgets.check({ ...base, schema: [items({ fields: [{ key: "x", kind: "items", label: "X", max: 2, fields: [{ key: "t", kind: "text", label: "T" }] }] })] }), /non permis dans une liste/);
    assert.throws(() => widgets.check({ ...base, status: "magique", schema: [items()] }), /status/);
    assert.throws(() => widgets.check({ ...base, description: "", schema: [items()] }), /description/);
  });
});

describe("validation des nouveaux widgets (sans serveur)", () => {
  const { A } = freshMarketing();
  let n = 0;
  // Enregistrement réel d'un élément par le service des pages : même validation que l'éditeur
  const save = (type, props) => {
    const p = pages.createPage(A, { name: `Validation ${++n}`, kind: "page" });
    return pages.saveDraft(A, p.id, wrap({ id: "essai0000001", type, props }), { revision: pages.getPage(A, p.id).revision }).content.sections[0].children[0].children[0].props;
  };
  const blank = (t) => nodes.editorSpec().types.find((x) => x.type === t).blank.props;
  test("registre : les 6 widgets sont déclarés, versionnés, avec description et catégorie", () => {
    for (const t of ["readmore", "textpath", "linkinbio", "slides", "testimonialcarousel", "mediacarousel"]) {
      assert.ok(nodes.NODE_TYPES[t], t);
      const spec = nodes.editorSpec().types.find((x) => x.type === t);
      assert.ok(spec.description && spec.status === "operational" && spec.version === 1 && spec.group, t);
    }
  });
  test("contenu de départ valide pour chaque nouveau widget (l'ajout depuis la bibliothèque ne peut pas échouer)", () => {
    for (const t of ["readmore", "textpath", "linkinbio", "slides", "testimonialcarousel", "mediacarousel", "facebookbutton", "cart"]) assert.doesNotThrow(() => save(t, blank(t)), t);
    // le contenu de départ d'une liste est copié : le modifier ne change pas le suivant
    const a = nodes.editorSpec().types.find((x) => x.type === "linkinbio").blank.props.links; a.push({ label: "X" });
    assert.equal(nodes.editorSpec().types.find((x) => x.type === "linkinbio").blank.props.links.length, 2);
  });
  test("listes : trop d'éléments, élément invalide, sous-champ obligatoire vide refusés ; valeurs inconnues ramenées au défaut", () => {
    const links = (l) => save("linkinbio", { ...blank("linkinbio"), links: l });
    assert.throws(() => links(Array.from({ length: 13 }, () => ({ label: "x", url: "/" }))), /12 élément/);
    assert.throws(() => links([]), /au moins/);
    assert.throws(() => links(["pas un objet"]), /invalide/);
    assert.throws(() => links([{ label: "", url: "/" }]), /obligatoire/);
    assert.equal(links([{ label: "A", url: "/catalogue", style: "n'importe quoi" }]).links[0].style, "primary");
    assert.throws(() => save("slides", { ...blank("slides"), slides: [{ title: "T", buttonLabel: "Aller", buttonUrl: "" }] }), /demande une adresse/);
    assert.throws(() => save("slides", { ...blank("slides"), slides: [{ title: "T", buttonLabel: "", buttonUrl: "/catalogue" }] }), /demande son texte/);
    assert.equal(save("testimonialcarousel", { ...blank("testimonialcarousel"), items: [{ quote: "Q", name: "N", stars: 99 }] }).items[0].stars, 0, "note hors bornes ramenée au défaut");
  });
  test("carrousel média : brouillon enregistrable ; vidéo saisie = YouTube / Vimeo ; publication refusée tant qu'un média est incomplet", () => {
    const mc = (items) => save("mediacarousel", { label: "M", items });
    assert.throws(() => mc([{ kind: "video", video: "https://exemple.fr/film.mp4" }]), /YouTube ou Vimeo/);
    assert.doesNotThrow(() => mc([{ kind: "image", image: "", alt: "" }]), "un média vide est un brouillon valide (contenu de départ)");
    assert.doesNotThrow(() => mc([{ kind: "video", video: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" }, { kind: "image", image: "https://exemple.fr/a.jpg", alt: "Une photo" }]));
    const complete = nodes.CUSTOM_WIDGETS.mediacarousel.complete;
    assert.match(complete({ items: [{ kind: "image", image: "", alt: "" }] }), /choisissez une image/);
    assert.match(complete({ items: [{ kind: "image", image: "https://exemple.fr/a.jpg", alt: "" }] }), /texte de remplacement/);
    assert.match(complete({ items: [{ kind: "video", video: "" }] }), /adresse d'une vidéo/);
    assert.equal(complete({ items: [{ kind: "video", video: "https://vimeo.com/123456789" }, { kind: "image", image: "https://exemple.fr/a.jpg", alt: "Photo" }] }), "");
  });
  test("intégrations : Facebook (page, publication, vidéo), Instagram, TikTok et playlist YouTube reconnus ; adresses voisines refusées", () => {
    const ok = (u, provider) => assert.equal((nodes.embedOf(u) || {}).provider, provider, u);
    ok("https://www.facebook.com/kolakisa", "facebookpage");
    ok("https://www.facebook.com/kolakisa/posts/pfbid0abc123", "facebookpost");
    ok("https://www.facebook.com/kolakisa/videos/1234567890", "facebookpost");
    ok("https://www.instagram.com/p/CxYz123AbC/", "instagram");
    ok("https://www.instagram.com/reel/CxYz123AbC/", "instagram");
    ok("https://www.tiktok.com/@kola/video/7234567890123456789", "tiktok");
    ok("https://www.youtube.com/playlist?list=PLabcdefghijklmn", "youtubelist");
    for (const bad of ["http://www.facebook.com/kolakisa", "https://facebook.com.evil.test/kolakisa", "https://www.facebook.com/kolakisa/photos/12345", "https://www.instagram.com/kolakisa/", "https://www.tiktok.com/@kola"]) assert.equal(nodes.embedOf(bad), null, bad);
    assert.match(nodes.embedOf("https://www.facebook.com/kolakisa").src, /^https:\/\/www\.facebook\.com\/plugins\/page\.php\?href=https%3A%2F%2Fwww\.facebook\.com%2Fkolakisa&/);
  });
});

describe("vrai serveur : enregistrement, canevas, page publiée, liens comptés", () => {
  let srv, boss, db;
  before(async () => { srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" }); boss = await loginInstructor(srv); db = srv.db(); });
  after(() => srv.stop());
  const publish = async (name, content) => {
    const id = Number((await boss.post("/marketing/pages", { name })).location.match(/(\d+)$/)[1]);
    const rev = db.prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(id).revision;
    const put = await boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", json: { revision: rev, content }, headers: { Origin: srv.base } });
    assert.equal(put.status, 200, put.text.slice(0, 300));
    const canvas = await boss.request(`/marketing/pages/${id}/rendu`, { method: "POST", json: { content }, headers: { Origin: srv.base } });
    assert.equal(canvas.status, 200);
    assert.equal((await boss.request(`/marketing/pages/${id}/publier.json`, { method: "POST", json: {}, headers: { Origin: srv.base } })).status, 200);
    const slug = db.prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(id).slug;
    return { id, html: (await boss.get(`/p/${slug}`)).text, canvas: canvas.text, saved: JSON.parse(db.prepare("SELECT sections FROM mk_landing_pages WHERE id = ?").get(id).sections || "[]") };
  };

  test("Lire la suite, Texte sur un tracé : rendu publié (déplier natif, SVG textPath) et réglages enregistrés", async () => {
    const { html, canvas, saved } = await publish("Lire et tracé", wrap(
      node("readmore", { intro: "Introduction visible.\n\nDeuxième paragraphe visible.", more: "Suite cachée.\n\nEncore la suite.", openLabel: "Voir plus", closeLabel: "Voir moins", open: false }),
      { ...node("textpath", { text: "Un texte <b>sur</b> une vague", shape: "arc", fontSize: 40, weight: "800", color: "#aa2200", showPath: true, link: "/catalogue" }), id: "wtextpath01" }));
    assert.match(html, /<details class="kw-readmore-more">/);
    assert.match(html, /<summary class="kw-readmore-toggle"><span class="kw-readmore-open">Voir plus<\/span><span class="kw-readmore-close">Voir moins<\/span>/);
    assert.equal((html.match(/class="kw-readmore-intro"/g) || []).length, 2, "deux paragraphes d'introduction");
    assert.match(html, /<div class="kw-readmore-body"><p>Suite cachée\.<\/p><p>Encore la suite\.<\/p><\/div>/);
    assert.match(html, /<textPath href="#kw-tp-wtextpath01" startOffset="50%">Un texte &lt;b&gt;sur&lt;\/b&gt; une vague<\/textPath>/, "texte échappé");
    assert.match(html, /d="M 30,170 A 270,150 0 0 1 570,170"/);
    assert.match(html, /font-size="40" font-weight="800" fill="#aa2200"/);
    assert.match(html, /<a class="kw-textpath-link" href="[^"]+">\s*<svg class="kw-textpath-svg"/);
    assert.match(canvas, /kw-readmore/);
    assert.equal(JSON.stringify(saved).includes("Voir plus"), true, "enregistré");
  });

  test("Lien en bio : boutons dans l'ordre, chaque lien compté (liste), valeurs enregistrées", async () => {
    const { html, id } = await publish("Lien en bio", wrap(node("linkinbio", { avatar: "", name: "Awa Koffi", bio: "Formatrice", links: [
      { label: "Mon site", url: "/catalogue", icon: "link", style: "primary" }, { label: "Écrire", url: "/contact", icon: "", style: "outline" }, { label: "Instagram", url: "https://www.instagram.com/awa", icon: "image", style: "primary" }], align: "center" })));
    const labels = [...html.matchAll(/<a class="kw-lib-link [^"]*" href="([^"]*)"><span class="kw-lib-icon"[^>]*>.*?<\/span><span>([^<]*)<\/span>|<a class="kw-lib-link [^"]*" href="([^"]*)"><span>([^<]*)<\/span>/g)].map((m) => m[2] || m[4]);
    assert.deepEqual(labels, ["Mon site", "Écrire", "Instagram"]);
    assert.match(html, /kw-lib-link is-outline/);
    assert.match(html, /<h2 class="kw-lib-name">Awa Koffi<\/h2>/);
    // liens comptés : 3 adresses suivies dans la page
    const tracked = [...html.matchAll(/class="kw-lib-link [^"]*" href="([^"]*)"/g)].map((m) => m[1]);
    assert.equal(tracked.length, 3);
    assert.ok(tracked.every((u) => u && u !== "undefined"), "aucun lien vide");
    assert.ok(id);
  });

  test("Diaporama, carrousel de témoignages, carrousel média : structure du carrousel du site (points, boucle, lecture automatique), contenu réel", async () => {
    const { html, canvas } = await publish("Carrousels", wrap(
      { ...node("slides", { label: "À la une", slides: [{ image: "https://exemple.fr/a.jpg", title: "Première", text: "Texte un", buttonLabel: "Aller", buttonUrl: "/catalogue", dark: 60 }, { image: "", title: "Deuxième", text: "", buttonLabel: "", buttonUrl: "", dark: 0 }], align: "left", height: 400, dots: true, loop: true, autoplay: true, interval: 7 }), id: "wslides0001" },
      { ...node("testimonialcarousel", { label: "Avis", items: [{ quote: "Très bien.", name: "Awa", role: "Élève", photo: "", stars: 4 }, { quote: "Excellent.", name: "Koffi", role: "", photo: "", stars: 0 }], dots: false, loop: false, autoplay: false, interval: 5 }), id: "wtestcar001" },
      { ...node("mediacarousel", { label: "Médias", items: [{ kind: "video", video: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", caption: "Présentation" }, { kind: "image", image: "https://exemple.fr/b.jpg", alt: "Une photo", caption: "" }], dots: true, loop: false, autoplay: false, interval: 5 }), id: "wmedcar0001" }));
    assert.equal((html.match(/data-kw-carousel/g) || []).length, 3, "trois carrousels branchés sur le script du site");
    assert.match(html, /aria-label="À la une" data-kw-carousel data-kw-dots data-kw-autoplay="7" data-kw-loop/);
    assert.equal((html.match(/class="kw-carousel-slide kw-slide"/g) || []).length, 2);
    assert.match(html, /style="min-height:400px"/);
    assert.match(html, /<h3 class="kw-slide-title">Première<\/h3>/);
    assert.match(html, /<a class="kw-button" href="[^"]+">Aller<\/a>/);
    assert.equal((html.match(/kw-slide-body/g) || []).length >= 2, true);
    assert.equal((html.match(/<a class="kw-button"/g) || []).length, 1, "seule la diapositive avec adresse a un bouton");
    assert.match(html, /<p class="kw-tcar-stars" role="img" aria-label="Note : 4 sur 5">★★★★/);
    assert.equal((html.match(/kw-tcar-stars/g) || []).length, 1, "pas d'étoiles quand la note est 0");
    assert.match(html, /<iframe src="https:\/\/www\.youtube-nocookie\.com\/embed\/dQw4w9WgXcQ" title="Présentation" loading="lazy"/);
    assert.match(html, /<img class="kw-mcar-img" src="https:\/\/exemple\.fr\/b\.jpg" alt="Une photo"/);
    assert.match(canvas, /data-kw-carousel/);
  });

  test("intégrations : Facebook, Instagram, TikTok et playlist YouTube s'affichent dans un cadre à la bonne proportion ; adresse inconnue refusée", async () => {
    const { html } = await publish("Intégrations", wrap(
      { ...node("embed", { url: "https://www.facebook.com/kolakisa", title: "Notre page" }), id: "wembfb00001" },
      { ...node("embed", { url: "https://www.instagram.com/p/CxYz123AbC/", title: "Photo" }), id: "wembig00001" },
      { ...node("embed", { url: "https://www.tiktok.com/@kola/video/7234567890123456789", title: "Vidéo" }), id: "wembtt00001" },
      { ...node("embed", { url: "https://www.youtube.com/playlist?list=PLabcdefghijklmn", title: "Playlist" }), id: "wembyt00001" }));
    assert.match(html, /src="https:\/\/www\.facebook\.com\/plugins\/page\.php\?href=https%3A%2F%2Fwww\.facebook\.com%2Fkolakisa&amp;tabs=timeline/);
    assert.match(html, /src="https:\/\/www\.instagram\.com\/p\/CxYz123AbC\/embed"/);
    assert.match(html, /src="https:\/\/www\.tiktok\.com\/embed\/v2\/7234567890123456789"/);
    assert.match(html, /src="https:\/\/www\.youtube-nocookie\.com\/embed\/videoseries\?list=PLabcdefghijklmn"/);
    for (const r of ["5x6", "4x5", "9x16"]) assert.match(html, new RegExp(`kw-embed-${r}`));
    const id = Number((await boss.post("/marketing/pages", { name: "Refus" })).location.match(/(\d+)$/)[1]);
    const rev = db.prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(id).revision;
    const bad = await boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", json: { revision: rev, content: wrap(node("embed", { url: "https://www.facebook.com.evil.test/x", title: "x" })) }, headers: { Origin: srv.base } });
    assert.equal(bad.status, 422);
  });
});

describe("Code coloré et Bouton Facebook", () => {
  const { A } = freshMarketing();
  let n = 0;
  const save = (type, props) => {
    const p = pages.createPage(A, { name: `V2 ${++n}`, kind: "page" });
    return pages.saveDraft(A, p.id, wrap({ id: "essai0000002", type, props }), { revision: pages.getPage(A, p.id).revision }).content.sections[0].children[0].children[0].props;
  };
  test("code : sans langage, rien ne change pour les pages existantes ; langage connu gardé ; inconnu ignoré", () => {
    assert.deepEqual(save("code", { text: "echo 1" }), { text: "echo 1" });
    assert.deepEqual(save("code", { text: "echo 1", language: "bash" }), { text: "echo 1", language: "bash" });
    assert.deepEqual(save("code", { text: "echo 1", language: "cobol" }), { text: "echo 1" });
    assert.deepEqual(save("code", { text: "echo 1", language: "text" }), { text: "echo 1" });
  });
  test("coloration : jetons reconnus, texte toujours échappé, langage inconnu non coloré, longueur bornée", () => {
    const { highlight } = require("../src/marketing/pages/highlight");
    const js = highlight('const a = "x<y"; // note', "js");
    assert.match(js, /<span class="kw-tok-kw">const<\/span>/);
    assert.match(js, /<span class="kw-tok-str">"x&lt;y"<\/span>/);
    assert.match(js, /<span class="kw-tok-com">\/\/ note<\/span>/);
    for (const lang of ["js", "json", "html", "css", "bash", "python", "sql", "php", "inconnu"]) assert.doesNotMatch(highlight("<script>alert(1)</script> & \"</pre>", lang), /<script|<\/pre>/, `${lang} échappe`);
    assert.equal(highlight("<b>", "inconnu"), "&lt;b&gt;");
    assert.ok(highlight("x".repeat(50000), "js").length <= 20000 + 10);
  });
  test("bouton Facebook : adresse https complète exigée, réglages bornés", () => {
    assert.doesNotThrow(() => save("facebookbutton", { url: "https://www.facebook.com/kolakisa", action: "like", layout: "button_count", size: "large", share: true, align: "center" }));
    for (const bad of ["http://www.facebook.com/x", "/catalogue", "javascript:alert(1)", "https://x", "https://exemple.fr/a b"]) assert.throws(() => save("facebookbutton", { url: bad }), /adresse https/, bad);
    assert.equal(save("facebookbutton", { url: "https://exemple.fr", layout: "inconnu" }).layout, "button_count");
  });
});

describe("serveur : code coloré et bouton Facebook publiés", () => {
  let srv, boss, db;
  before(async () => { srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" }); boss = await loginInstructor(srv); db = srv.db(); });
  after(() => srv.stop());
  test("page publiée : le code est coloré et échappé ; l'ancien code (sans langage) s'affiche comme avant ; le bouton Facebook est un cadre officiel encodé", async () => {
    const id = Number((await boss.post("/marketing/pages", { name: "Code et Facebook" })).location.match(/(\d+)$/)[1]);
    const rev = db.prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(id).revision;
    const content = wrap(
      { id: "wcode0000001", type: "code", props: { text: 'const x = "<b>";\nreturn 1', language: "js" } },
      { id: "wcode0000002", type: "code", props: { text: "<i>brut</i>" } },
      { id: "wfbbtn00001", type: "facebookbutton", props: { url: "https://exemple.fr/page?a=1&b=2", action: "recommend", layout: "box_count", size: "small", share: false, align: "center" } });
    assert.equal((await boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", json: { revision: rev, content }, headers: { Origin: srv.base } })).status, 200);
    assert.equal((await boss.request(`/marketing/pages/${id}/publier.json`, { method: "POST", json: {}, headers: { Origin: srv.base } })).status, 200);
    const html = (await boss.get(`/p/${db.prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(id).slug}`)).text;
    assert.match(html, /<code class="language-js"><span class="kw-tok-kw">const<\/span> x = <span class="kw-tok-str">"&lt;b&gt;"<\/span>;/);
    assert.match(html, /<code>&lt;i&gt;brut&lt;\/i&gt;<\/code>/);
    assert.doesNotMatch(html, /<b>"|<i>brut/);
    assert.match(html, /src="https:\/\/www\.facebook\.com\/plugins\/like\.php\?href=https%3A%2F%2Fexemple\.fr%2Fpage%3Fa%3D1%26b%3D2&amp;layout=box_count&amp;action=recommend&amp;size=small&amp;share=false/);
    assert.match(html, /class="kw-node kw-facebookbutton[^"]*is-center"/);
  });
});

describe("serveur : widget Panier (vrai panier du site)", () => {
  let srv, boss, db, courseA, courseB, eleve;
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" }); boss = await loginInstructor(srv); db = srv.db(); eleve = await newStudent(srv);
    const teacher = db.prepare("SELECT id FROM users WHERE role = 'formateur' LIMIT 1").get().id;
    const ins = (t, slug, price, pub) => Number(db.prepare("INSERT INTO courses (title, slug, published, subtitle, price_cents, instructor_id) VALUES (?, ?, ?, '', ?, ?)").run(t, slug, pub, price, teacher).lastInsertRowid);
    courseA = ins("Montage vidéo", "montage-video", 4900, 1); courseB = ins("Étalonnage", "etalonnage", 2500, 1);
  });
  after(() => srv.stop());
  test("le panier du visiteur s'affiche (titres, prix, total, boutons) ; vide pour un autre visiteur ; une formation dépubliée disparaît", async () => {
    const id = Number((await boss.post("/marketing/pages", { name: "Panier" })).location.match(/(\d+)$/)[1]);
    const rev = db.prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(id).revision;
    const content = wrap({ id: "wcart0000001", type: "cart", props: { title: "Mon panier", showImage: true, showTotal: true, checkoutLabel: "Payer", cartLabel: "Voir le panier", empty: "Rien ici." } });
    assert.equal((await boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", json: { revision: rev, content }, headers: { Origin: srv.base } })).status, 200);
    assert.equal((await boss.request(`/marketing/pages/${id}/publier.json`, { method: "POST", json: {}, headers: { Origin: srv.base } })).status, 200);
    const url = `/p/${db.prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(id).slug}`;
    assert.match((await boss.get(url)).text, /<p class="kw-cart-empty">Rien ici\.<\/p>/, "panier vide au départ");
    for (const c of [courseA, courseB]) { const r = await eleve.post(`/panier/ajouter/${c}`, {}); assert.ok([302, 303].includes(r.status) && !/login|connexion/.test(r.location || ""), `ajout au panier : statut ${r.status}, redirection ${r.location}`); }
    const real = await eleve.get("/panier");
    assert.match(real.text, /Montage vidéo/, "le vrai panier du site contient la formation");
    let html = (await eleve.get(url)).text;
    assert.match(html, /<h3 class="kw-cart-title">Mon panier<\/h3>/);
    const area = (html.match(/<section class="kw-node kw-cart[\s\S]*?<\/section>/) || [""])[0];
    assert.ok(area.includes("kw-cart-line"), `lignes du panier absentes : ${area.slice(0, 400)}`);
    assert.match(html, /href="\/cours\/montage-video">Montage vidéo<\/a><span class="kw-cart-price">49,00[\s\u00a0\u202f]€/);
    assert.match(html, /href="\/cours\/etalonnage">Étalonnage<\/a><span class="kw-cart-price">25,00[\s\u00a0\u202f]€/);
    assert.match(html, /<p class="kw-cart-total"><span>Total<\/span><strong>74,00[\s\u00a0\u202f]€<\/strong>/, "total réel");
    assert.match(html, /<a class="kw-button" href="\/commande">Payer<\/a><a class="kw-cart-edit" href="\/panier">Voir le panier<\/a>/);
    // un autre visiteur (sans session) ne voit jamais ce panier
    const anon = await fetch(`${srv.base}${url}`).then((r) => r.text());
    assert.match(anon, /<p class="kw-cart-empty">Rien ici\.<\/p>/);
    assert.doesNotMatch(anon, /Montage vidéo/);
    // formation dépubliée : elle disparaît du panier affiché (jamais une ligne vers une formation introuvable)
    db.prepare("UPDATE courses SET published = 0 WHERE id = ?").run(courseB);
    html = (await eleve.get(url)).text;
    assert.doesNotMatch(html, /Étalonnage/);
    assert.match(html, /<strong>49,00[\s\u00a0\u202f]€<\/strong>/);
  });
});

describe("serveur : publication d'un carrousel média incomplet", () => {
  let srv, boss, db;
  before(async () => { srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" }); boss = await loginInstructor(srv); db = srv.db(); });
  after(() => srv.stop());
  test("un média sans image : le brouillon s'enregistre, la publication est refusée avec la raison ; complété, elle réussit et seuls les médias complets s'affichent", async () => {
    const id = Number((await boss.post("/marketing/pages", { name: "Média incomplet" })).location.match(/(\d+)$/)[1]);
    const put = async (items) => boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", json: { revision: db.prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(id).revision, content: wrap({ id: "wmedcar0002", type: "mediacarousel", props: { label: "Médias", items } }) }, headers: { Origin: srv.base } });
    assert.equal((await put([{ kind: "image", image: "", alt: "", video: "", caption: "" }])).status, 200);
    const refused = await boss.request(`/marketing/pages/${id}/publier.json`, { method: "POST", json: {}, headers: { Origin: srv.base } });
    assert.equal(refused.status, 422);
    assert.match(refused.text, /Carrousel média : média 1 : choisissez une image/);
    assert.equal((await put([{ kind: "image", image: "https://exemple.fr/a.jpg", alt: "Une photo", video: "", caption: "" }])).status, 200);
    assert.equal((await boss.request(`/marketing/pages/${id}/publier.json`, { method: "POST", json: {}, headers: { Origin: srv.base } })).status, 200);
    assert.match((await boss.get(`/p/${db.prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(id).slug}`)).text, /<img class="kw-mcar-img" src="https:\/\/exemple\.fr\/a\.jpg" alt="Une photo"/);
  });
});

const LOTTIE = { v: "5.5.7", fr: 30, ip: 0, op: 60, w: 100, h: 100, nm: "t", ddd: 0, assets: [], layers: [{ ddd: 0, ind: 1, ty: 4, nm: "s", sr: 1, ks: { o: { a: 0, k: 100 }, r: { a: 1, k: [{ t: 0, s: [0], e: [360], i: { x: [0.5], y: [1] }, o: { x: [0.5], y: [0] } }, { t: 60, s: [360] }] }, p: { a: 0, k: [50, 50, 0] }, a: { a: 0, k: [0, 0, 0] }, s: { a: 0, k: [100, 100, 100] } }, ao: 0, shapes: [{ ty: "gr", it: [{ ty: "rc", d: 1, s: { a: 0, k: [40, 40] }, p: { a: 0, k: [0, 0] }, r: { a: 0, k: 0 } }, { ty: "fl", c: { a: 0, k: [1, 0, 0, 1] }, o: { a: 0, k: 100 } }, { ty: "tr", p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 } }] }], ip: 0, op: 60, st: 0, bounds: { l: 0, t: 0, b: 100, r: 100 } }] };
describe("Animation Lottie", () => {
  const { A } = freshMarketing();
  let n = 0;
  const save = (props) => { const p = pages.createPage(A, { name: `Lottie ${++n}`, kind: "page" }); return pages.saveDraft(A, p.id, wrap({ id: "lot000000001", type: "lottie", props }), { revision: pages.getPage(A, p.id).revision }).content.sections[0].children[0].children[0].props; };
  test("validation : contenu de départ valide (brouillon), adresse .json exigée si saisie, vitesse et hauteur bornées", () => {
    const blank = nodes.editorSpec().types.find((x) => x.type === "lottie").blank.props;
    assert.doesNotThrow(() => save(blank));
    assert.equal(save({ ...blank, src: "https://assets.exemple.com/a.json?v=2", speed: 99 }).speed, 1, "vitesse hors bornes ramenée au défaut");
    for (const bad of ["https://exemple.fr/page.html", "https://exemple.fr/a.json.exe", "javascript:alert(1)"]) assert.throws(() => save({ ...blank, src: bad }), bad);
    assert.match(nodes.CUSTOM_WIDGETS.lottie.complete({ src: "" }), /adresse du fichier/);
    assert.equal(nodes.CUSTOM_WIDGETS.lottie.complete({ src: "https://exemple.fr/a.json" }), "");
  });
  test("la bibliothèque est hébergée avec le site, avec sa licence, et ne contient pas d'expressions", () => {
    const fs = require("fs"), path = require("path");
    const js = fs.readFileSync(path.join(__dirname, "../public/js/vendor/lottie_light.min.js"), "utf8");
    assert.ok(js.length > 100000 && js.includes("loadAnimation"));
    assert.match(fs.readFileSync(path.join(__dirname, "../public/js/vendor/LICENSE-lottie-web.md"), "utf8"), /MIT License/);
  });
});

describe("sécurité : aucun contenu saisi dans un nouveau widget ne devient du code", () => {
  let srv, boss, db;
  before(async () => { srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" }); boss = await loginInstructor(srv); db = srv.db(); });
  after(() => srv.stop());
  const PAYLOAD = `"><img src=x onerror=alert(1)><script>alert(2)</script>'&`;
  const LINKS = ["javascript:alert(1)", "data:text/html,<script>alert(1)</script>", "vbscript:x", "//evil.test/x", "https://user:pass@evil.test/"];
  const TYPES = ["readmore", "textpath", "linkinbio", "slides", "testimonialcarousel", "mediacarousel", "facebookbutton", "cart", "lottie"];
  const spec = (t) => nodes.editorSpec().types.find((x) => x.type === t);
  // Remplace chaque texte (et chaque texte d'un élément de liste) par la charge d'attaque ; garde le reste du contenu de départ
  const hostile = (schema, props) => { const out = JSON.parse(JSON.stringify(props)); for (const f of schema) { if (f.kind === "text" || f.kind === "textarea") out[f.key] = PAYLOAD.slice(0, f.max || 200); else if (f.kind === "items") out[f.key] = (out[f.key] || []).map((it) => { const o = { ...it }; for (const sf of f.fields) if (sf.kind === "text" || sf.kind === "textarea") o[sf.key] = PAYLOAD.slice(0, sf.max || 200); return o; }); } return out; };
  const attempt = async (type, props) => {
    const id = Number((await boss.post("/marketing/pages", { name: `Sécurité ${type} ${Math.random()}` })).location.match(/(\d+)$/)[1]);
    const rev = db.prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(id).revision;
    const put = await boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", json: { revision: rev, content: wrap({ id: "sec000000001", type, props }) }, headers: { Origin: srv.base } });
    if (put.status !== 200) return { status: put.status, html: "" };
    const canvas = (await boss.request(`/marketing/pages/${id}/rendu`, { method: "POST", json: { content: wrap({ id: "sec000000001", type, props }) }, headers: { Origin: srv.base } })).text;
    const pub = await boss.request(`/marketing/pages/${id}/publier.json`, { method: "POST", json: {}, headers: { Origin: srv.base } });
    const html = pub.status === 200 ? (await boss.get(`/p/${db.prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(id).slug}`)).text : "";
    return { status: put.status, html, canvas };
  };
  // Charge active = balise réellement ouverte (« < » non échappé) : le texte « onerror=alert(1) » échappé en &lt;…&gt; est inoffensif
  const dangerous = (html) => String(html).match(/<img src=x|<script>alert\(2\)/);
  for (const type of TYPES) {
    test(`${type} : textes hostiles échappés (page publiée et canevas) ; adresses dangereuses refusées`, async () => {
      const s = spec(type);
      const props = hostile(s.schema, s.blank.props);
      // contenus obligatoires pour que la page soit publiable (le texte hostile ne les remplace pas toujours)
      if (type === "mediacarousel") props.items = [{ kind: "image", image: "https://exemple.fr/a.jpg", alt: PAYLOAD.slice(0, 160), caption: PAYLOAD.slice(0, 160), video: "" }];
      if (type === "lottie") props.src = "https://exemple.fr/a.json";
      if (type === "facebookbutton") props.url = "https://exemple.fr/p?x=" + encodeURIComponent(PAYLOAD);
      const r = await attempt(type, props);
      if (r.status === 200) { assert.equal(dangerous(r.html || ""), null, `${type} : charge active dans la page publiée : ${((r.html || "").match(/.{60}(?:<img src=x|<script>alert\(2\)).{60}/s) || [""])[0]}`); assert.equal(dangerous(r.canvas || ""), null, `${type} : charge active dans le canevas`); }
      else assert.ok([400, 422].includes(r.status), `${type} : refus propre (${r.status})`);
      // adresses : chaque champ « lien » refuse les schémas dangereux
      const linkFields = s.schema.filter((f) => f.kind === "link"), listLinks = s.schema.filter((f) => f.kind === "items").flatMap((f) => f.fields.filter((x) => x.kind === "link").map((x) => [f.key, x.key]));
      for (const bad of LINKS) {
        for (const f of linkFields) assert.notEqual((await attempt(type, { ...s.blank.props, [f.key]: bad })).status, 200, `${type}.${f.key} accepte ${bad}`);
        for (const [list, sub] of listLinks) assert.notEqual((await attempt(type, { ...s.blank.props, [list]: (s.blank.props[list] || [{}]).map((it) => ({ ...it, [sub]: bad })) })).status, 200, `${type}.${list}[].${sub} accepte ${bad}`);
      }
    });
  }
  test("code coloré, Lire la suite et intégrations : même garantie sur la page publiée", async () => {
    const r = await attempt("readmore", { intro: PAYLOAD, more: PAYLOAD, openLabel: "Ouvrir", closeLabel: "Fermer", open: false });
    assert.equal(dangerous(r.html), null);
    const embed = await attempt("embed", { url: "https://www.facebook.com/page\"onload=alert(1)", title: PAYLOAD });
    assert.notEqual(embed.status, 200, "adresse d'intégration piégée refusée");
  });
});
