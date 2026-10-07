// Moteur d'effets — ce que le SERVEUR garantit : capacités par type d'élément, validation des effets de défilement / souris / masque,
// persistance, et rendu réel sur la page publiée (attributs lus par kw-effects.js, CSS du masque et de la transformation).
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { TEST_KEY, freshMarketing } = require("./marketing-helpers");
const pages = require("../src/marketing/pages");
const nodes = require("../src/marketing/pages/nodes");
const { startServer, loginInstructor } = require("./helpers");

const section = (children) => ({ id: "sect00000001", type: "layout", children });
const IMG = "https://exemple.fr/photo.jpg";

describe("capacités par type d'élément (sans serveur)", () => {
  const caps = (type) => nodes.capsOf(type);
  test("matrice : chaque type n'a que les capacités qu'il peut vraiment honorer", () => {
    // conteneurs : épinglage possible, jamais de masque
    for (const t of ["container", "grid", "stack", "group"]) {
      assert.deepEqual(caps(t), ["motion", "scroll", "mouse", "sticky", "transform", "attrs", "css", "responsive"], t);
    }
    // images et médias : masque possible, pas d'épinglage
    for (const t of ["image", "gallery", "video", "imagebox", "hotspot"]) assert.ok(caps(t).includes("mask") && !caps(t).includes("sticky"), t);
    // icône, bouton, texte : défilement, souris, transformation ; ni masque ni épinglage
    for (const t of ["icon", "button", "heading", "text"]) {
      assert.ok(["scroll", "mouse", "transform"].every((c) => caps(t).includes(c)), t);
      assert.ok(!caps(t).includes("mask") && !caps(t).includes("sticky"), t);
    }
    // éléments sans mouvement possible : attributs, CSS et écrans seulement
    for (const t of ["spacer", "modal"]) assert.deepEqual(caps(t), ["attrs", "css", "responsive"], t);
  });

  test("chaque type du registre expose ses capacités à l'éditeur (jamais de type sans liste)", () => {
    const spec = nodes.editorSpec();
    for (const t of spec.types) assert.ok(Array.isArray(t.capabilities) && t.capabilities.length, t.type);
    assert.deepEqual(spec.types.find((t) => t.type === "image").capabilities, caps("image"));
    assert.ok(spec.scrollFx.map((f) => f.key).join() === "y,x,opacity,blur,scale,rotate");
    assert.ok(spec.mouseModes.some(([k]) => k === "tilt") && spec.maskShapes.some(([k]) => k === "hexagon"));
  });
});

describe("validation et enregistrement (sans serveur)", () => {
  const { A } = freshMarketing();
  const p = pages.createPage(A, { name: "Effets", kind: "page" });
  const save = (kids) => pages.saveDraft(A, p.id, { sections: [section(kids)] }, { revision: pages.getPage(A, p.id).revision }).content.sections[0].children;
  const heading = (id, extra = {}) => ({ id, type: "heading", props: { text: "Titre", level: "2" }, ...extra });

  test("défilement : valeurs entières bornées, zéro et inconnues retirés, ignoré sur un type sans la capacité", () => {
    const [h1, sp] = save([
      heading("hed000000001", { motion: { scroll: { y: 80, x: -500, opacity: 40, blur: 6, scale: 10, rotate: 0, inconnu: 5 } } }),
      { id: "spc000000001", type: "spacer", props: { size: "32" }, motion: { scroll: { y: 50 } } },
    ]);
    assert.deepEqual(h1.motion.scroll, { y: 80, opacity: 40, blur: 6, scale: 10 }, "x hors bornes, rotation nulle et clé inconnue retirés");
    assert.equal(sp.motion, undefined, "un espace n'a pas de capacité de défilement");
  });

  test("souris : mode connu et intensité bornée ; inclinaison 3D = pas de rotation au défilement (même propriété CSS)", () => {
    const [a, b, c, d] = save([
      heading("hed000000001", { motion: { mouse: { mode: "track", strength: 55, invert: true } } }),
      heading("hed000000002", { motion: { mouse: { mode: "tilt", strength: 500 }, scroll: { rotate: 90, y: 20 } } }),
      heading("hed000000003", { motion: { mouse: { mode: "inconnu", strength: 30 } } }),
      { id: "box000000001", type: "container", props: {}, motion: { mouse: { mode: "track" } }, children: [] },
    ]);
    assert.deepEqual(a.motion.mouse, { mode: "track", strength: 55, invert: true });
    assert.deepEqual(b.motion.mouse, { mode: "tilt", strength: 30 }, "intensité hors bornes → valeur par défaut");
    assert.deepEqual(b.motion.scroll, { y: 20 }, "rotation au défilement retirée avec l'inclinaison");
    assert.equal(c.motion, undefined, "mode inconnu refusé");
    assert.equal(d.motion.mouse.mode, "track");
  });

  test("écrans désactivés : seulement avec un effet, jamais tous les écrans à la fois", () => {
    const [a, b, c] = save([
      heading("hed000000001", { motion: { scroll: { y: 30 }, off: ["mobile", "tablet", "inconnu"] } }),
      heading("hed000000002", { motion: { scroll: { y: 30 }, off: ["desktop", "tablet", "mobile"] } }),
      heading("hed000000003", { motion: { off: ["mobile"] } }),
    ]);
    assert.deepEqual(a.motion.off, ["tablet", "mobile"]);
    assert.equal(b.motion.off, undefined, "tous les écrans coupés = incohérent, ignoré");
    assert.equal(c.motion, undefined, "« off » sans effet n'est pas conservé");
  });

  test("masque : forme connue, image validée (https ou médiathèque), taille/position/répétition bornées, par écran et au survol", () => {
    const [img, boxed] = save([
      { id: "img000000001", type: "image", props: { src: IMG, alt: "Photo" }, styles: { desktop: { mask: { shape: "hexagon" }, transform: { rotate: 10, skewX: 5 } }, mobile: { mask: { shape: "circle" } } }, states: { hover: { transform: { scale: 1.05 } } } },
      { id: "img000000002", type: "image", props: { src: IMG, alt: "Autre photo" }, styles: { desktop: { mask: { shape: "n-importe-quoi", src: IMG, size: "cover", repeat: "nimporte" } } } },
    ]);
    assert.deepEqual(img.styles.desktop.mask, { shape: "hexagon" });
    assert.equal(img.styles.mobile.mask.shape, "circle", "valeur propre à l'écran mobile");
    assert.equal(img.styles.desktop.transform.skewX, 5);
    assert.equal(img.states.hover.transform.scale, 1.05, "transformation au survol");
    assert.deepEqual(boxed.styles.desktop.mask, { src: IMG, size: "cover", position: "center", repeat: "no-repeat" }, "forme inconnue retirée, répétition invalide → défaut");
    assert.throws(() => save([{ id: "img000000003", type: "image", props: { src: IMG, alt: "x" }, styles: { desktop: { mask: { src: "javascript:alert(1)" } } } }]), /masque/);
    assert.throws(() => save([{ id: "img000000004", type: "image", props: { src: IMG, alt: "x" }, styles: { desktop: { mask: { src: 'https://x.fr/a.png"); background:url(//evil' } } } }]), /masque/);
  });

  test("la feuille de style contient la découpe, le masque d'image (préfixé) et la transformation avec inclinaison, par écran et au survol", () => {
    const css = nodes.pageCss([section([{ id: "img000000001", type: "image", props: { src: IMG, alt: "Photo" },
      styles: { desktop: { mask: { shape: "hexagon", src: IMG, size: "cover" }, transform: { rotate: 10, skewX: 8, scale: 1.1 } }, mobile: { transform: { scale: 1.02 } } },
      states: { hover: { transform: { scale: 1.2 } } } }])]);
    assert.match(css, /\.kw-n-img000000001\{[^}]*clip-path:polygon\(25% 5%/);
    assert.match(css, /-webkit-mask-image:url\("https:\/\/exemple\.fr\/photo\.jpg"\)/);
    assert.match(css, /[^-]mask-image:url\("https:\/\/exemple\.fr\/photo\.jpg"\)/);
    assert.match(css, /-webkit-mask-size:cover/);
    assert.match(css, /transform:rotate\(10deg\) scale\(1\.1\) skewX\(8deg\)/);
    assert.match(css, /@media \(max-width: 767px\)\{[^}]*\.kw-n-img000000001\{[^}]*transform:scale\(1\.02\)/);
    assert.match(css, /\.kw-n-img000000001:hover\{[^}]*transform:scale\(1\.2\)/);
  });
});

describe("page publiée (vrai serveur)", () => {
  let srv, boss, db;
  before(async () => { srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" }); boss = await loginInstructor(srv); db = srv.db(); });
  after(() => srv.stop());
  const newPage = async (name) => Number((await boss.post("/marketing/pages", { name })).location.match(/(\d+)$/)[1]);
  const put = async (id, content) => { const rev = db.prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(id).revision; return boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", json: { revision: rev, content } }); };
  const publish = async (id) => { assert.equal((await boss.request(`/marketing/pages/${id}/publier.json`, { method: "POST", json: {} })).status, 200); return db.prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(id).slug; };

  test("les effets sont écrits dans la page publiée (attributs lus par le moteur) et le script d'exécution est chargé", async () => {
    const id = await newPage("Effets publiés");
    const r = await put(id, { sections: [section([
      { id: "hed000000001", type: "heading", props: { text: "Parallaxe", level: "2" }, motion: { scroll: { y: 60, opacity: 30 }, mouse: { mode: "tilt", strength: 40 }, off: ["mobile"] } },
      { id: "hed000000002", type: "heading", props: { text: "Sans effet", level: "2" } },
    ])] });
    assert.equal(r.status, 200, r.text);
    const html = (await boss.get(`/p/${await publish(id)}`)).text;
    assert.match(html, /<h2 class="kw-node kw-heading kw-n-hed000000001"[^>]*data-kw-scroll="\{&quot;y&quot;:60,&quot;opacity&quot;:30\}"/);
    assert.match(html, /data-kw-mouse="\{&quot;mode&quot;:&quot;tilt&quot;,&quot;strength&quot;:40\}"/);
    assert.match(html, /data-kw-fx-off="mobile"/);
    const plain = html.slice(html.indexOf("kw-n-hed000000002"), html.indexOf("kw-n-hed000000002") + 200);
    assert.doesNotMatch(plain, /data-kw-scroll|data-kw-mouse/, "un élément sans effet ne reçoit aucun attribut d'effet");
    assert.match(html, /<script src="[^"]*\/js\/kw-effects\.js[^"]*" defer>/);
    assert.equal((await boss.get("/js/kw-effects.js")).status, 200);
  });

  test("masque, épinglage et transformation au survol : rendus dans la feuille de style de la page publiée", async () => {
    const id = await newPage("Masque et épinglage");
    await put(id, { sections: [section([
      { id: "img000000001", type: "image", props: { src: IMG, alt: "Photo" }, styles: { desktop: { mask: { shape: "star" }, transform: { skewY: -6 } } }, states: { hover: { transform: { rotate: 4, scale: 1.05 } } } },
      { id: "box000000001", type: "container", props: {}, styles: { desktop: { position: "sticky", top: "16px", zIndex: 20 } }, children: [{ id: "hed000000001", type: "heading", props: { text: "Menu", level: "3" } }] },
    ])] });
    const html = (await boss.get(`/p/${await publish(id)}`)).text;
    assert.match(html, /\.kw-n-img000000001\{[^}]*clip-path:polygon\(50% 0%, 61% 35%/);
    assert.match(html, /\.kw-n-img000000001\{[^}]*transform:skewY\(-6deg\)/);
    assert.match(html, /\.kw-n-img000000001:hover\{[^}]*transform:rotate\(4deg\) scale\(1\.05\)/);
    assert.match(html, /\.kw-n-box000000001\{[^}]*position:sticky;[^}]*top:16px/);
  });

  test("persistance : les effets survivent à l'enregistrement puis au rechargement du brouillon de l'éditeur", async () => {
    const id = await newPage("Persistance effets");
    await put(id, { sections: [section([{ id: "btn000000001", type: "button", props: { label: "Acheter", url: "/catalogue" }, motion: { scroll: { scale: 15 }, mouse: { mode: "track", strength: 20 } } }])] });
    const boot = JSON.parse((await boss.get(`/marketing/pages/${id}/editeur`)).text.match(/<script type="application\/json" id="pb-boot">([\s\S]*?)<\/script>/)[1]);
    assert.deepEqual(boot.content.sections[0].children[0].motion, { scroll: { scale: 15 }, mouse: { mode: "track", strength: 20 } });
    assert.ok(boot.spec.types.find((t) => t.type === "button").capabilities.includes("mouse"));
  });

  test("l'éditeur charge le module des sections avancées avant son propre script", async () => {
    const id = await newPage("Chargement");
    const html = (await boss.get(`/marketing/pages/${id}/editeur`)).text;
    const fx = html.indexOf("page-builder-effects.js"), pb = html.search(/page-builder\.js/);
    assert.ok(fx > 0 && pb > fx, "page-builder-effects.js doit précéder page-builder.js");
    assert.ok(fs.existsSync(path.join(__dirname, "..", "public", "js", "page-builder-effects.js")));
  });
});
