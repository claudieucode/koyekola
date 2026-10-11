// Accessibilité du RENDU PUBLIÉ de tous les widgets : une page contenant les 86 types (contenus d'exemple valides) est publiée puis contrôlée dans un vrai Chrome.
// Règles (automatisables) : langue et titre de page, un repère « main », images avec attribut alt, liens / boutons / champs / cadres nommés, identifiants uniques,
// titres non vides et sans saut de niveau, pas de tabindex positif, rien de focalisable dans une zone aria-hidden (sauf tabindex -1 : champ anti-spam).
// Limites assumées : pas de mesure de contraste ni de parcours clavier complet ; un futur widget est contrôlé automatiquement (il entre dans la page).
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");
const nodes = require("../src/marketing/pages/nodes");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : parcours navigateur non exécuté sur cette machine" : false;
const IMG = (k) => ({ src: `https://exemple.fr/photo-${k}.jpg`, alt: `Photo ${k}` });

describe("accessibilité du rendu publié (86 widgets, navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, res, kept, skipped;
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    const db = srv.db();
    const id = Number((await boss.post("/marketing/pages", { name: "Accessibilité" })).location.match(/(\d+)$/)[1]);
    let courseId = (db.prepare("SELECT id FROM courses ORDER BY id LIMIT 1").get() || {}).id;
    if (!courseId) { const teacher = db.prepare("SELECT id FROM users WHERE role = 'formateur' LIMIT 1").get().id; courseId = Number(db.prepare("INSERT INTO courses (title, slug, published, subtitle, price_cents, instructor_id) VALUES ('Formation', 'formation-a11y', 1, '', 4900, ?)").run(teacher).lastInsertRowid); }
    const formId = Number((await boss.post("/marketing/formulaires", { name: "Formulaire a11y", consentText: "J'accepte de recevoir des messages." })).location.match(/(\d+)$/)[1]);
    db.prepare("UPDATE mk_forms SET double_optin = 0 WHERE id = ?").run(formId); await boss.post(`/marketing/formulaires/${formId}/publier`, {});
    const SAMPLES = {
      video: { props: { url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", title: "Vidéo de démonstration" } }, audio: { props: { src: "https://exemple.fr/son.mp3", title: "Extrait" } },
      embed: { props: { url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", title: "Contenu intégré" } }, map: { props: { address: "12 avenue de la Paix, Brazzaville", zoom: 14, height: 350 } },
      gallery: { props: { images: [IMG(1), IMG(2), IMG(3)] } }, carousel: { props: { images: [IMG(1), IMG(2), IMG(3)] } },
      imagebox: { props: { src: IMG(1).src, alt: "Photo", title: "Un titre clair", text: "Une phrase." } },
      hotspot: { props: { src: IMG(1).src, alt: "Photo", spots: [{ x: 50, y: 50, title: "Point", text: "Ce qu'il faut savoir." }] } },
      rating: { props: { value: 4.5, title: "Note des élèves" } }, menuanchor: { anchor: "tarifs", props: {} }, image: { props: IMG(1) },
      course: { props: { courseId } }, addtocart: { props: { courseId, mode: "cart", label: "Ajouter au panier" } }, courserating: { props: { courseId } }, signupform: { props: { formId } },
      mediacarousel: { props: { label: "Médias", items: [{ kind: "image", image: "https://exemple.fr/a.jpg", alt: "Photo", caption: "", video: "" }], dots: true, loop: false, autoplay: false, interval: 5 } },
      lottie: { props: { src: "https://anim.exemple.test/a.json", alt: "Animation", trigger: "viewport", loop: true, speed: 1, height: 200, align: "center" } },
    };
    const put = async (children) => boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", json: { revision: db.prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(id).revision, content: { sections: [{ id: "sect00000001", type: "layout", children }] } }, headers: { Origin: srv.base } });
    kept = []; skipped = []; let cur = [];
    for (const t of Object.keys(nodes.NODE_TYPES)) {
      const b = SAMPLES[t] || nodes.PALETTE[t].blank();
      const node = { id: (t + "x00000000000").slice(0, 12).replace(/[^a-z0-9]/g, "0"), type: t, props: b.props || {}, ...(b.anchor ? { anchor: b.anchor } : {}), ...(b.styles ? { styles: b.styles } : {}), ...(nodes.NODE_TYPES[t].container ? { children: [] } : {}) };
      const next = cur.concat([node]);
      if ((await put(next)).status !== 200) { skipped.push(t); continue; }
      if ((await boss.request(`/marketing/pages/${id}/publier.json`, { method: "POST", json: {} })).status !== 200) { skipped.push(t); await put(cur); continue; }
      cur = next; kept.push(t);
    }
    const slug = db.prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(id).slug;
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
    const page = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage();
    await page.goto(`${srv.base}/p/${slug}`); await page.waitForTimeout(2500);
    res = await page.evaluate(() => {
      const name = (e) => { const t = (e.getAttribute("aria-label") || e.getAttribute("title") || "").trim(); if (t) return t; const lb = e.getAttribute("aria-labelledby"); if (lb && document.getElementById(lb)) return document.getElementById(lb).textContent.trim(); const tx = (e.textContent || "").trim(); if (tx) return tx; const im = e.querySelector("img[alt]:not([alt=''])"); if (im) return im.alt; const sv = e.querySelector("svg title"); return sv ? sv.textContent : ""; };
      const desc = (e) => { const n = e.closest("[class*=kw-n-]"); return e.tagName.toLowerCase() + (e.id ? "#" + e.id : "") + (n ? " [" + [...n.classList].find((c) => c.startsWith("kw-n-")) + "]" : ""); };
      const o = { lang: document.documentElement.getAttribute("lang"), title: document.title, main: document.querySelectorAll("main,[role=main]").length };
      o.imgNoAlt = [...document.querySelectorAll("img:not([alt])")].map(desc);
      o.linkNoName = [...document.querySelectorAll("a[href]")].filter((a) => !name(a)).map(desc);
      o.buttonNoName = [...document.querySelectorAll("button,[role=button]")].filter((a) => !name(a)).map(desc);
      o.inputNoLabel = [...document.querySelectorAll("input:not([type=hidden]):not([type=submit]):not([type=button]),select,textarea")].filter((e) => !(e.getAttribute("aria-label") || e.getAttribute("aria-labelledby") || (e.id && document.querySelector("label[for='" + e.id + "']")) || e.closest("label") || e.getAttribute("title"))).map(desc);
      o.iframeNoTitle = [...document.querySelectorAll("iframe")].filter((e) => !(e.getAttribute("title") || e.getAttribute("aria-label"))).map(desc);
      const ids = {}; document.querySelectorAll("[id]").forEach((e) => { ids[e.id] = (ids[e.id] || 0) + 1; }); o.dupIds = Object.entries(ids).filter(([, v]) => v > 1).map(([k, v]) => k + "×" + v);
      const hs = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")]; const lv = hs.map((h) => +h.tagName[1]); o.headingSkips = lv.filter((x, i) => i > 0 && x - lv[i - 1] > 1).length; o.h1 = lv.filter((x) => x === 1).length;
      o.emptyHeading = hs.filter((h) => !h.textContent.trim() && !h.querySelector("img[alt]")).map(desc);
      o.tabindexPos = [...document.querySelectorAll("[tabindex]")].filter((e) => +e.getAttribute("tabindex") > 0).map(desc);
      o.ariaHiddenFocusable = [...document.querySelectorAll("[aria-hidden=true] a[href],[aria-hidden=true] button,[aria-hidden=true] input,[aria-hidden=true] select,[aria-hidden=true] textarea")].filter((e) => e.getAttribute("tabindex") !== "-1").map(desc);
      return o;
    });
  });
  after(async () => { if (browser) await browser.close(); if (srv) await srv.stop(); });

  test("tous les types du registre sont publiés ensemble sur la page contrôlée", () => assert.deepEqual(skipped, [], `types écartés : ${skipped.join(", ")}`));
  test("langue, titre de page et repère « main »", () => { assert.ok(res.lang, "attribut lang"); assert.ok(res.title.trim().length > 0, "titre de page"); assert.equal(res.main, 1, "un seul repère main"); });
  test("images : toutes ont un attribut alt", () => assert.deepEqual(res.imgNoAlt, []));
  test("liens, boutons, champs et cadres ont un nom accessible", () => { assert.deepEqual(res.linkNoName, [], "liens sans nom"); assert.deepEqual(res.buttonNoName, [], "boutons sans nom"); assert.deepEqual(res.inputNoLabel, [], "champs sans étiquette"); assert.deepEqual(res.iframeNoTitle, [], "cadres sans titre"); });
  test("identifiants uniques, titres non vides sans saut de niveau, un seul H1", () => { assert.deepEqual(res.dupIds, []); assert.deepEqual(res.emptyHeading, []); assert.equal(res.headingSkips, 0); assert.ok(res.h1 <= 1, `H1 : ${res.h1}`); });
  test("pas de tabindex positif ; rien de focalisable dans une zone aria-hidden (sauf tabindex -1)", () => { assert.deepEqual(res.tabindexPos, []); assert.deepEqual(res.ariaHiddenFocusable, []); });
});
