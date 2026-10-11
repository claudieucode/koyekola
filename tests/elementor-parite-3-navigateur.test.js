// Parité Elementor, partie 4 (Chrome réel, vrai serveur) : liens intelligents, contenu Facebook, plan du site, ouverture automatique d'une fenêtre,
// balise du titre, propriétés de style (sens d'écriture, ancre, découpe du fond, bordures, filtres, verre dépoli, dégradé à plusieurs couleurs),
// galerie à 12 colonnes, conteneur en accordéon, témoignage / points d'intérêt / code / barre de lecture, groupes de conditions d'affichage (ET / OU).
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, Client, loginInstructor } = require("./helpers");

let chromium = null, sharp = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
try { sharp = require("sharp"); } catch { /* sharp absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : parcours navigateur non exécuté sur cette machine" : false;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
async function until(check, { timeout = 10000, every = 80, what = "condition" } = {}) {
  const end = Date.now() + timeout;
  for (;;) { let v = null; try { v = await check(); } catch { v = null; } if (v) return v; if (Date.now() > end) throw new Error(`Délai dépassé : ${what}`); await wait(every); }
}

describe("parité Elementor : suite 3 (navigateur)", { skip: SKIP }, () => {
  let srv, boss, anon, browser, context, page, errors, id, slug, imgs = [];
  const db = () => srv.db();
  const row = () => db().prepare("SELECT * FROM mk_landing_pages WHERE id = ?").get(id);
  const put = (children, extra = {}) => boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", json: { revision: row().revision, content: { title: "Suite 3", sections: [{ id: "sect00000001", type: "layout", children: [{ id: "cont00000001", type: "container", ...extra, children }] }] } } });
  const publish = async () => assert.equal((await boss.post(`/marketing/pages/${id}/publier.json`, {})).status, 200);
  const open = async () => { await publish(); await page.goto(`${srv.base}/p/${slug}`); };
  const hrefs = async () => page.locator(".kw-smartlink a").evaluateAll((as) => as.map((a) => a.getAttribute("href")));

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); anon = new Client(srv.base);
    if (sharp) for (const c of [{ r: 200, g: 40, b: 40 }, { r: 40, g: 200, b: 40 }]) {
      const buf = await sharp({ create: { width: 300, height: 200, channels: 3, background: c } }).jpeg().toBuffer();
      const fd = new FormData(); fd.append("file", new Blob([buf], { type: "image/jpeg" }), "t.jpg");
      imgs.push(JSON.parse((await boss.request("/marketing/site-web/mediatheque/televerser", { method: "POST", multipart: fd })).text).media);
    }
    const created = await boss.post("/marketing/pages", { name: "Suite 3", template: "", ouvrir: "editeur" });
    id = Number(created.location.match(/pages\/(\d+)/)[1]);
    slug = db().prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(id).slug;
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
    context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
    await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    page = await context.newPage(); errors = [];
    page.on("pageerror", (e) => errors.push(`pageerror : ${e.message}`));
  });
  after(async () => { if (browser) await browser.close(); if (srv) await srv.stop(); });

  test("lien intelligent : adresse reconstruite pour chaque action ; valeurs invalides refusées", async () => {
    const mk = (props) => ({ type: "smartlink", props: { label: "Go", ...props } });
    const r = await put([
      mk({ kind: "email", target: "a@b.fr", subject: "Bonjour tout", message: "Salut" }), mk({ kind: "tel", target: "+33 6 12 34 56 78" }), mk({ kind: "sms", target: "33612345678", message: "Hi" }),
      mk({ kind: "whatsapp", target: "33612345678", message: "Hello" }), mk({ kind: "messenger", target: "kolakisa" }), mk({ kind: "skype", target: "live:kolakisa" }), mk({ kind: "viber", target: "33612345678" }),
      mk({ kind: "waze", target: "10 rue de Rivoli, Paris" }),
      mk({ kind: "google", target: "Paris", subject: "Atelier", message: "Apportez un ordinateur", start: "2026-11-05T14:00", end: "2026-11-05T16:30" }),
      mk({ kind: "outlook", target: "Paris", subject: "Atelier", start: "2026-07-05T14:00" }), mk({ kind: "yahoo", target: "Paris", subject: "Atelier", start: "2026-11-05T14:00" }),
    ]);
    assert.equal(r.status, 200, r.text); await open();
    const h = await hrefs();
    assert.equal(h[0], "mailto:a@b.fr?subject=Bonjour%20tout&body=Salut"); assert.equal(h[1], "tel:+33612345678"); assert.equal(h[2], "sms:+33612345678?body=Hi");
    assert.equal(h[3], "https://wa.me/33612345678?text=Hello"); assert.equal(h[4], "https://m.me/kolakisa"); assert.equal(h[5], "skype:live%3Akolakisa?chat"); assert.equal(h[6], "viber://chat?number=%2B33612345678");
    assert.equal(h[7], "https://waze.com/ul?q=10%20rue%20de%20Rivoli%2C%20Paris&navigate=yes");
    assert.match(h[8], /^https:\/\/calendar\.google\.com\/calendar\/render\?action=TEMPLATE&text=Atelier&dates=20261105T130000Z\/20261105T153000Z&details=/, "heure de Paris (hiver, UTC+1) convertie en UTC");
    assert.match(h[9], /startdt=2026-07-05T12%3A00%3A00\.000Z/, "été : UTC+2");
    assert.match(h[10], /^https:\/\/calendar\.yahoo\.com\/\?v=60&title=Atelier&st=20261105T130000Z&et=20261105T140000Z/, "fin par défaut : une heure après");
    for (const props of [{ kind: "email", target: "pas-un-mail" }, { kind: "tel", target: "12" }, { kind: "google", target: "Paris", subject: "x", start: "demain" }, { kind: "google", target: "Paris", subject: "x", start: "2026-11-05T14:00", end: "2026-11-05T13:00" }, { kind: "messenger", target: "a b<script>" }]) {
      assert.equal((await put([mk(props)])).status, 422, JSON.stringify(props));
    }
  });

  test("contenu Facebook : cadre officiel reconstruit (page, publication, vidéo) ; adresse hors facebook.com refusée", async () => {
    let r = await put([{ type: "facebookembed", props: { kind: "page", url: "https://www.facebook.com/kolakisa", title: "Page", tabs: "events", height: 420 } }, { type: "facebookembed", props: { kind: "video", url: "https://fb.watch/abc123/", title: "Vidéo" } }, { type: "facebookembed", props: { kind: "post", url: "https://www.facebook.com/kolakisa/posts/123", title: "Post", showText: false } }]);
    assert.equal(r.status, 200, r.text); await open();
    const src = await page.locator("iframe.kw-fbe-frame").evaluateAll((f) => f.map((x) => x.getAttribute("src")));
    assert.match(src[0], /^https:\/\/www\.facebook\.com\/plugins\/page\.php\?href=https%3A%2F%2Fwww\.facebook\.com%2Fkolakisa&tabs=events&width=500&height=420/);
    assert.match(src[1], /plugins\/video\.php\?href=https%3A%2F%2Ffb\.watch%2Fabc123%2F&show_text=true/); assert.match(src[2], /plugins\/post\.php\?.*show_text=false/);
    r = await put([{ type: "facebookembed", props: { kind: "page", url: "https://exemple.test/facebook.com", title: "x" } }]); assert.equal(r.status, 422);
    r = await put([{ type: "facebookembed", props: { kind: "page", url: "http://www.facebook.com/x", title: "x" } }]); assert.equal(r.status, 422, "http refusé");
  });

  test("plan du site : liste les pages publiées indexables ; au moins un type exigé", async () => {
    let r = await put([{ type: "sitemap", props: { label: "Plan", columns: "3", pages: true, articles: false, courses: false } }]);
    assert.equal(r.status, 200, r.text); await open();
    assert.match(await page.locator("nav.kw-sitemap").getAttribute("class"), /is-cols-3/);
    assert.equal(await page.locator("nav.kw-sitemap").getAttribute("aria-label"), "Plan");
    assert.ok(await page.locator(".kw-sitemap-group").count() >= 1, "au moins un groupe (la page elle-même est publiée)");
    assert.ok((await page.locator(".kw-sitemap-link").evaluateAll((a) => a.map((x) => x.getAttribute("href")))).some((h) => h.includes(slug)), "la page publiée figure dans son propre plan");
    r = await put([{ type: "sitemap", props: { label: "Plan", pages: false, articles: false, courses: false } }]); assert.equal(r.status, 422);
  });

  test("fenêtre : ouverture automatique au chargement, une seule fois par visite ; Échap verrouillé ; au défilement ; à l'inactivité", async () => {
    let r = await put([{ type: "modal", id: "modal0000001", props: { buttonLabel: "Ouvrir", title: "Offre", text: "Bonjour", auto: "load", delay: 1, freq: "session", autoClose: 2, lock: true } }]);
    assert.equal(r.status, 200, r.text);
    assert.deepEqual({ a: JSON.parse(row().draft).sections[0].children[0].children[0].props.auto, l: JSON.parse(row().draft).sections[0].children[0].children[0].props.lock }, { a: "load", l: true });
    await open();
    assert.equal(await page.locator("dialog.kw-modal").evaluate((d) => d.open), false, "pas ouverte tout de suite");
    await until(async () => page.locator("dialog.kw-modal").evaluate((d) => d.open), { timeout: 5000, what: "ouverture automatique" });
    await page.keyboard.press("Escape"); await wait(200);
    assert.equal(await page.locator("dialog.kw-modal").evaluate((d) => d.open), true, "verrouillée : Échap ne ferme pas");
    await until(async () => !(await page.locator("dialog.kw-modal").evaluate((d) => d.open)), { timeout: 6000, what: "fermeture automatique après 2 s" });
    await page.reload(); await wait(2500);
    assert.equal(await page.locator("dialog.kw-modal").evaluate((d) => d.open), false, "une fois par visite : ne revient pas après rechargement");
    // défilement
    r = await put([{ type: "modal", id: "modal0000002", props: { buttonLabel: "O", title: "Scroll", text: "x", auto: "scroll", scrollAt: 30, freq: "always" } }], { styles: { desktop: { minHeight: "3000px" } } });
    assert.equal(r.status, 200, r.text); await open();
    await page.evaluate(() => { const h = document.documentElement.scrollHeight - innerHeight; window.scrollTo(0, h * 0.5); });
    await until(async () => page.locator("dialog.kw-modal").evaluate((d) => d.open), { timeout: 5000, what: "ouverture au défilement" });
    // inactivité
    r = await put([{ type: "modal", id: "modal0000003", props: { buttonLabel: "O", title: "Idle", text: "x", auto: "idle", delay: 1, freq: "always" } }]);
    assert.equal(r.status, 200, r.text); await open();
    await until(async () => page.locator("dialog.kw-modal").evaluate((d) => d.open), { timeout: 5000, what: "ouverture après inactivité" });
    // carte dans le coin : fenêtre non bloquante (la page reste utilisable), ouverte au chargement
    r = await put([{ type: "button", props: { label: "Reste cliquable", url: "/catalogue", variant: "primary" } }, { type: "modal", id: "modal0000005", props: { buttonLabel: "O", title: "Coin", text: "x", position: "corner", auto: "load", delay: 1, freq: "always" } }]);
    assert.equal(r.status, 200, r.text); await open();
    await until(async () => page.locator("dialog.kw-popup-corner").evaluate((d) => d.open), { timeout: 5000, what: "carte dans le coin ouverte" });
    await wait(500); // fin de l'animation d'apparition
    const corner = await page.evaluate(() => { const d = document.querySelector("dialog.kw-popup-corner"); const r = d.getBoundingClientRect(); return { modal: d.matches(":modal"), right: Math.round(innerWidth - r.right), bottom: Math.round(innerHeight - r.bottom) }; });
    assert.equal(corner.modal, false, "non modale"); assert.equal(corner.right, 18); assert.equal(corner.bottom, 18);
    assert.equal(await page.locator("a.kw-button", { hasText: "Reste cliquable" }).isEnabled(), true);
    // validation : sans déclencheur, rien de plus n'est enregistré
    r = await put([{ type: "modal", id: "modal0000004", props: { buttonLabel: "O", title: "T", text: "x", delay: 9, lock: true, freq: "once" } }]);
    assert.equal(JSON.parse(row().draft).sections[0].children[0].children[0].props.delay, undefined);
  });

  test("balise du titre : p / div / span ; valeur inconnue → titre", async () => {
    const r = await put([{ type: "heading", props: { text: "A", level: "2", tag: "p" } }, { type: "heading", props: { text: "B", level: "2", tag: "span" } }, { type: "heading", props: { text: "C", level: "3", tag: "script" } }, { type: "heading", props: { text: "D", level: "2" } }]);
    assert.equal(r.status, 200, r.text); await open();
    const tags = await page.locator(".kw-heading").evaluateAll((e) => e.map((x) => x.tagName));
    assert.deepEqual(tags, ["P", "SPAN", "H3", "H2"]);
  });

  test("propriétés de style : sens d'écriture, ancre, découpe du fond, bordures, filtres, verre dépoli, dégradé à 3 couleurs", async () => {
    const r = await put([{ type: "text", props: { html: "<p>x</p>" }, styles: { desktop: { direction: "rtl", scrollMarginTop: "90px", backgroundClip: "text", gradient: { from: "#ff0000", to: "#0000ff", angle: 90, extra: [{ color: "#00ff00", at: 50 }] }, borderStyle: "ridge", borderWidth: "6px", borderColor: "#333333", filter: { invert: 100 }, backdrop: { blur: 6, saturate: 160 } } } }]);
    assert.equal(r.status, 200, r.text); await open();
    const m = await page.evaluate(() => { const c = getComputedStyle(document.querySelector(".kw-text")); return { dir: c.direction, sm: c.scrollMarginTop, clip: c.backgroundClip || c.webkitBackgroundClip, bi: c.backgroundImage, bs: c.borderTopStyle, f: c.filter, bf: c.backdropFilter || c.webkitBackdropFilter }; });
    assert.equal(m.dir, "rtl"); assert.equal(m.sm, "90px"); assert.match(m.clip, /text/); assert.match(m.bi, /rgb\(255, 0, 0\) 0%, rgb\(0, 255, 0\) 50%, rgb\(0, 0, 255\) 100%/); assert.equal(m.bs, "ridge");
    assert.match(m.f, /invert\(1\)/); assert.match(m.bf, /blur\(6px\) saturate\(1\.6\)/);
  });

  test("galerie à 12 colonnes", { skip: !sharp }, async () => {
    const images = Array.from({ length: 12 }, (_, i) => ({ src: imgs[i % 2].path, alt: "i" + i }));
    const r = await put([{ type: "gallery", props: { images, columns: 12 } }]);
    assert.equal(r.status, 200, r.text); await open();
    assert.equal(await page.evaluate(() => getComputedStyle(document.querySelector(".kw-gallery")).gridTemplateColumns.split(" ").length), 12);
  });

  test("conteneur en accordéon : volets libres, un seul ouvert à la fois, clavier", async () => {
    const panel = (n, text) => ({ type: "container", name: n, children: [{ type: "text", props: { html: `<p>${text}</p>` } }] });
    const r = await put([panel("Premier", "AAA"), panel("Deuxième", "BBB"), panel("Troisième", "CCC")], { props: { mode: "accordion", accStart: "first", accSingle: true } });
    assert.equal(r.status, 200, r.text);
    assert.deepEqual({ m: JSON.parse(row().draft).sections[0].children[0].props.mode, s: JSON.parse(row().draft).sections[0].children[0].props.accSingle }, { m: "accordion", s: true });
    await open();
    const heads = page.locator(".kw-nacc-head");
    assert.equal(await heads.count(), 3);
    assert.deepEqual(await heads.evaluateAll((h) => h.map((x) => x.getAttribute("aria-expanded"))), ["true", "false", "false"]);
    await heads.nth(1).click();
    assert.deepEqual(await heads.evaluateAll((h) => h.map((x) => x.getAttribute("aria-expanded"))), ["false", "true", "false"], "un seul volet ouvert");
    assert.equal(await page.locator(".kw-nacc-panel").nth(1).isVisible(), true); assert.equal(await page.locator(".kw-nacc-panel").nth(0).isVisible(), false);
    await heads.nth(1).focus(); await page.keyboard.press("ArrowDown");
    assert.equal(await page.evaluate(() => document.activeElement.textContent), "Troisième");
  });

  test("témoignage (photo au-dessus), points d'intérêt (survol), code (numéros, lignes surlignées, copier), barre de lecture circulaire", { skip: !sharp }, async () => {
    const code = "ligne 1\nligne 2\nligne 3\nligne 4\nligne 5";
    const r = await put([
      { type: "testimonial", props: { text: "Super", name: "Ana", avatar: imgs[0].path, avatarPos: "above" } },
      { type: "hotspot", props: { src: imgs[1].path, alt: "carte", spots: [{ x: 50, y: 50, title: "Ici", text: "Info" }], trigger: "hover" } },
      { type: "code", props: { text: code, lineNumbers: true, copy: true, highlight: "2-3, 5, 99" } },
      { type: "readingprogress", props: { shape: "circle", position: "bottom" } },
    ]);
    assert.equal(r.status, 200, r.text);
    assert.equal(JSON.parse(row().draft).sections[0].children[0].children[2].props.highlight, "2,3,5,99", "plages développées ; une ligne au-delà du texte est gardée mais jamais dessinée");
    await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: srv.base });
    await open();
    assert.equal(await page.evaluate(() => getComputedStyle(document.querySelector(".kw-testimonial")).flexDirection), "column");
    assert.equal(await page.evaluate(() => document.querySelector(".kw-testimonial > img.kw-avatar-side") !== null), true);
    await page.locator(".kw-spot").hover(); await wait(150);
    assert.equal(await page.locator(".kw-spot-card").isVisible(), true, "infobulle au survol");
    assert.equal((await page.locator(".kw-code-nums").innerText()).split("\n").length, 5);
    assert.deepEqual(await page.locator(".kw-code-hl").evaluateAll((e) => e.map((x) => x.className.match(/hl-(\d+)/)[1])), ["2", "3", "5"]);
    await page.locator("[data-kw-copy]").click();
    await until(async () => (await page.evaluate(() => navigator.clipboard.readText())) === code, { what: "code copié" });
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await until(async () => (await page.locator(".kw-readring-pct").textContent()) !== "0%", { what: "pourcentage de lecture" });
  });

  test("conditions d'affichage : groupes ET / OU évalués sur la page publiée (visiteur inconnu)", async () => {
    const t = (txt, audience) => ({ type: "text", props: { html: `<p>${txt}</p>` }, audience });
    const r = await put([
      t("TOUS", undefined),
      t("INCONNU-SEUL", { who: "anonymous" }),
      t("CONNU-ET-CLIENT", { who: "known", and: [{ who: "customer" }] }),
      t("CONNU-OU-INCONNU", { who: "known", or: [{ who: "anonymous" }] }),
      t("INCONNU-ET-CLIENT-OU-INCONNU", { who: "anonymous", and: [{ who: "customer" }], or: [{ who: "not_student", and: [{ who: "anonymous" }] }] }),
    ]);
    assert.equal(r.status, 200, r.text);
    assert.deepEqual(JSON.parse(row().draft).sections[0].children[0].children[3].audience, { who: "known", or: [{ who: "anonymous" }] });
    await publish();
    const html = (await anon.get(`/p/${slug}`)).text;
    for (const shown of ["TOUS", "INCONNU-SEUL", "CONNU-OU-INCONNU", "INCONNU-ET-CLIENT-OU-INCONNU"]) assert.ok(html.includes(shown), shown);
    assert.ok(!html.includes("CONNU-ET-CLIENT<"), "connu ET client : masqué à un inconnu");
    assert.equal((await put([t("x", { who: "known", or: [{ who: "inconnue" }] })])).status, 422, "condition inconnue refusée");
  });

  test("aucune erreur de script", () => { assert.deepEqual(errors, []); });
});
