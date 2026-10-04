// Étape 0 : responsive et accessibilité. Ces tests protègent contre le retour des défauts trouvés à l'audit.
const { test, before, after, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { startServer, Client, loginInstructor, newStudent, createCourse, buy } = require("./helpers");

const CSS = ["style.css", "marketing.css", "dashboard.css", "seo-workspace.css"].map((f) => fs.readFileSync(path.join(__dirname, "..", "public", "css", f), "utf8")).join("\n");
const VIEWS = path.join(__dirname, "..", "views");

// ---------- utilitaires de contraste (formule WCAG 2.x) ----------
function luminance(hex) {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}
function token(name) {
  const m = CSS.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`));
  assert.ok(m, `variable --${name} introuvable`);
  return m[1];
}

describe("contrastes des couleurs (WCAG AA : 4,5:1 pour le texte courant)", () => {
  const checks = [
    ["texte blanc sur les boutons bleus", () => contrast("#ffffff", token("accent"))],
    ["lien bleu sur le fond de page", () => contrast(token("accent"), token("bg"))],
    ["lien bleu sur fond blanc", () => contrast(token("accent"), "#ffffff")],
    ["texte bleu foncé sur bleu très clair (badges, filtres actifs)", () => contrast(token("accent-dark"), token("accent-light"))],
    ["texte atténué sur le fond de page", () => contrast(token("muted"), token("bg"))],
    ["étoiles sur fond blanc", () => contrast(token("star"), "#ffffff")],
    ["étoiles sur le fond de page", () => contrast(token("star"), token("bg"))],
  ];
  for (const [name, fn] of checks) {
    test(name, () => {
      const ratio = fn();
      assert.ok(ratio >= 4.5, `contraste ${ratio.toFixed(2)}:1 (minimum 4,5:1)`);
    });
  }
  test("bandeaux dégradés : texte blanc lisible sur CHAQUE couleur du dégradé", () => {
    const gradients = [...CSS.matchAll(/linear-gradient\(135deg,([^)]+)\)/g)].map((m) => m[1]);
    const stops = gradients.flatMap((g) => g.match(/#[0-9a-fA-F]{6}/g) || []);
    assert.ok(stops.length >= 3, "dégradés introuvables");
    for (const stop of stops) {
      if (stop.toLowerCase() === "#ffffff" || stop.toLowerCase() === "#f6fbff") continue; // dégradés clairs (texte foncé)
      assert.ok(contrast("#ffffff", stop) >= 4.5, `${stop} : ${contrast("#ffffff", stop).toFixed(2)}:1`);
    }
  });
});

describe("CSS : marges et confort de lecture", () => {
  test("aucune classe posée sur un conteneur n'écrase sa marge latérale (padding en raccourci)", () => {
    const usedWithContainer = new Set();
    for (const file of fs.readdirSync(VIEWS, { recursive: true })) {
      if (!String(file).endsWith(".ejs")) continue;
      const html = fs.readFileSync(path.join(VIEWS, String(file)), "utf8");
      for (const m of html.matchAll(/class="([^"]*container(?:-wide|-narrow)?[^"]*)"/g)) {
        m[1].split(/\s+/).filter((c) => c && !c.startsWith("container")).forEach((c) => usedWithContainer.add(c));
      }
    }
    const offenders = [];
    for (const [, selector, body] of CSS.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      for (const cls of usedWithContainer) {
        if (!new RegExp(`\\.${cls}(?![\\w-])`).test(selector)) continue;
        const m = body.match(/(?:^|[;\s])padding:\s*([^;]+)/);
        if (!m) continue;
        const parts = m[1].trim().split(/\s+/);
        const horizontal = parts.length === 1 ? parts[0] : parts.length === 4 ? parts[3] : parts[1];
        if (/^0(px)?$/.test(horizontal) || horizontal !== "20px") offenders.push(`.${cls} { padding: ${m[1].trim()} }`);
      }
    }
    assert.deepEqual(offenders, [], "utilisez padding-block pour ne pas écraser la marge horizontale du conteneur");
  });

  test("aucun texte de moins de 12 px", () => {
    const small = [];
    for (const [, selector, body] of CSS.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      const m = body.match(/font-size:\s*([\d.]+)(rem|px)/);
      if (!m) continue;
      const px = m[2] === "rem" ? parseFloat(m[1]) * 16 : parseFloat(m[1]);
      if (px < 12) small.push(`${selector.trim().split("\n").pop().trim()} → ${px.toFixed(1)}px`);
    }
    assert.deepEqual(small, []);
  });

  test("le focus clavier est visible (:focus-visible) et jamais supprimé sans remplacement", () => {
    assert.match(CSS, /:focus-visible/);
    assert.doesNotMatch(CSS, /outline:\s*none/, "outline:none rend le focus invisible");
  });

  test("respect de prefers-reduced-motion", () => {
    assert.match(CSS, /prefers-reduced-motion:\s*reduce/);
  });

  test("tiroir de navigation fermé : hors d'atteinte du clavier et sans ombre visible", () => {
    const drawer = CSS.match(/@media \(max-width: 920px\)\s*\{[\s\S]*?\.header-nav \{([^}]*)\}/);
    assert.ok(drawer, "règle du tiroir introuvable");
    assert.match(drawer[1], /visibility:\s*hidden/);
    assert.doesNotMatch(drawer[1], /box-shadow/, "l'ombre ne doit exister que tiroir ouvert");
  });
});

// ---------- accessibilité du HTML rendu ----------
function controlsWithoutName(html) {
  const problems = [];
  const labelFor = new Set([...html.matchAll(/<label[^>]*\sfor="([^"]+)"/g)].map((m) => m[1]));
  // texte des <label> qui enveloppent un champ (association implicite)
  const wrapped = [...html.matchAll(/<label\b[^>]*>([\s\S]*?)<\/label>/g)].map((m) => m[1]).filter((inner) => /<(input|select|textarea)\b/.test(inner));
  for (const m of html.matchAll(/<(input|select|textarea)\b([^>]*)>/g)) {
    const attrs = m[2];
    if (/type="(hidden|submit|button|image)"/.test(attrs)) continue;
    const id = (attrs.match(/\sid="([^"]+)"/) || [])[1];
    const named = /aria-label(ledby)?="[^"]+"/.test(attrs) || /\stitle="[^"]+"/.test(attrs) || (id && labelFor.has(id));
    const implicit = wrapped.some((inner) => inner.includes(m[0]));
    if (!named && !implicit) problems.push(m[0].slice(0, 90));
  }
  return problems;
}

describe("accessibilité des pages rendues", () => {
  let srv, prof, eleve, course;
  before(async () => {
    srv = await startServer();
    prof = await loginInstructor(srv);
    course = await createCourse(prof, srv, { title: "Pour accessibilité", price: 10, lessons: [{ title: "L1", preview: true }, { title: "L2" }] });
    eleve = await newStudent(srv);
    await eleve.post(`/panier/ajouter/${course.id}`, {});
    // Un quiz pour vérifier aussi ce formulaire
    await prof.post(`/formateur/lecons/${course.lessons[0].id}/quiz`, {});
    const db = srv.db();
    const quiz = db.prepare("SELECT id FROM quizzes").get();
    db.close();
    await prof.post(`/formateur/quiz/${quiz.id}/questions`, { question: "Q ?", option_1: "a", option_2: "b", option_3: "", option_4: "", correct: "1" });
  });
  after(() => srv.stop());

  const anon = () => new Client(srv.base);
  const pages = [
    ["accueil", () => anon().get("/")],
    ["catalogue", () => anon().get("/catalogue")],
    ["connexion", () => anon().get("/connexion")],
    ["inscription", () => anon().get("/inscription")],
    ["fiche formation", () => anon().get(`/cours/${course.slug}`)],
    ["paiement", () => eleve.get("/commande")],
    ["panier", () => eleve.get("/panier")],
    ["admin : tableau de bord", () => prof.get("/formateur")],
    ["admin : nouvelle formation", () => prof.get("/formateur/cours/nouveau")],
    ["admin : modifier la formation", () => prof.get(`/formateur/cours/${course.id}/modifier`)],
    ["admin : programme", () => prof.get(`/formateur/cours/${course.id}/curriculum?lecon=${course.lessons[0].id}`)],
    ["lecteur (aperçu)", () => anon().get(`/apprendre/${course.slug}/${course.lessons[0].id}`)],
  ];

  for (const [name, fetchPage] of pages) {
    test(`${name} : chaque champ de formulaire a un nom accessible`, async () => {
      const r = await fetchPage();
      assert.equal(r.status, 200);
      assert.deepEqual(controlsWithoutName(r.text), []);
    });
    test(`${name} : lien d'évitement, zone principale, images avec alt, langue`, async () => {
      const r = await fetchPage();
      assert.match(r.text, /<a[^>]+class="skip-link"[^>]+href="#main"|<a[^>]+href="#main"[^>]+class="skip-link"/);
      assert.match(r.text, /<main[^>]+id="main"/);
      assert.deepEqual([...r.text.matchAll(/<img\b(?![^>]*\salt=)[^>]*>/g)].map((m) => m[0].slice(0, 80)), [], "image sans attribut alt");
      assert.match(r.text, /<html lang="fr"/);
    });
  }

  test("icône du site déclarée et servie (plus de 404 à chaque page)", async () => {
    const home = await anon().get("/");
    assert.match(home.text, /<link[^>]+rel="icon"/);
    const icon = await anon().get("/favicon.svg");
    assert.equal(icon.status, 200);
    assert.match(icon.headers.get("content-type"), /svg/);
    assert.notEqual((await anon().get("/favicon.ico")).status, 404);
  });

  test("les vignettes de formation ne bloquent pas le chargement (lazy + dimensions)", async () => {
    const fd = new FormData();
    fd.append("title", "Pour vignette");
    fd.append("category", "Test");
    fd.append("level", "debutant");
    fd.append("price", "0");
    fd.append("thumbnail", new Blob([Buffer.alloc(50)], { type: "image/png" }), "a.png");
    await prof.request("/formateur/cours/nouveau", { method: "POST", multipart: fd });
    const db = srv.db();
    const id = db.prepare("SELECT id FROM courses WHERE title = 'Pour vignette'").get().id;
    db.close();
    await createCourse(prof, srv, { title: "Autre pour publier", price: 0 });
    await prof.post(`/formateur/cours/${id}/sections`, { title: "C" });
    const db2 = srv.db();
    const sec = db2.prepare("SELECT id FROM sections WHERE course_id = ?").get(id).id;
    db2.close();
    await prof.post(`/formateur/sections/${sec}/lecons`, { title: "x" });
    await prof.post(`/formateur/cours/${id}/publier`, {});
    const html = (await anon().get("/catalogue")).text;
    const imgs = [...html.matchAll(/<img\b[^>]*thumbnails[^>]*>/g)].map((m) => m[0]);
    assert.ok(imgs.length >= 1, "aucune vignette trouvée");
    for (const img of imgs) {
      assert.match(img, /loading="lazy"/);
      assert.match(img, /width="\d+"/);
      assert.match(img, /height="\d+"/);
    }
  });
});
