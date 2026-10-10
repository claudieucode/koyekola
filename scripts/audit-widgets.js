// Banc d'essai des widgets de l'éditeur de pages : dans un VRAI Chrome, insère chaque widget de la bibliothèque, l'enregistre, le publie et
// relève ce qui se passe (erreurs de script, élément créé ou non, rendu du canevas, rendu publié). Sert à établir l'inventaire réel — un widget
// n'est pas « terminé » parce qu'il apparaît dans le panneau. Usage : NODE_PATH=<dossier de playwright-core> node scripts/audit-widgets.js [sortie.json]
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright-core");
const { startServer, loginInstructor } = require("../tests/helpers");
const { TEST_KEY } = require("../tests/marketing-helpers");

const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const out = process.argv[2] || path.join(__dirname, "..", "tmp-audit-widgets.json");

(async () => {
  const srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
  const boss = await loginInstructor(srv);
  const db = srv.db();
  const id = Number((await boss.post("/marketing/pages", { name: "Banc d'essai des widgets" })).location.match(/(\d+)$/)[1]);
  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1600, height: 900 } });
  await ctx.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
  const page = await ctx.newPage();
  let window_ = []; // erreurs relevées pendant l'insertion en cours
  page.on("pageerror", (e) => window_.push(`pageerror: ${e.message.slice(0, 160)}`));
  page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) window_.push(`console: ${m.text().slice(0, 160)}`); });
  await page.goto(`${srv.base}/marketing/pages/${id}/editeur`);
  await page.waitForFunction(() => { const f = document.querySelector("[data-pb-frame]"); return f && f.contentDocument && f.contentDocument.body && f.contentDocument.body.classList.contains("lp-builder"); }, null, { timeout: 60000 });
  await page.waitForTimeout(3000);
  // Le panneau de gauche affiche la bibliothèque d'éléments
  const items = await page.evaluate(() => [...document.querySelectorAll(".pb-pal-item[data-widget]")].map((b) => ({ key: b.getAttribute("data-widget"), label: (b.textContent || "").trim().slice(0, 40), disabled: b.disabled, locked: b.classList.contains("is-locked"), group: (b.closest("[data-group]") || {}).dataset ? b.closest("[data-group]").dataset.group : null })));
  const results = [];
  for (const it of items) {
    window_ = [];
    const before = await page.evaluate(() => document.querySelector("[data-pb-frame]").contentDocument.querySelectorAll("[data-node-id]").length);
    let clicked = false;
    if (!it.disabled && !it.locked) { await page.evaluate((k) => document.querySelector(`.pb-pal-item[data-widget="${k}"]`).click(), it.key); clicked = true; }
    await page.waitForTimeout(450);
    const after = await page.evaluate(() => document.querySelector("[data-pb-frame]").contentDocument.querySelectorAll("[data-node-id]").length);
    results.push({ ...it, clicked, nodesBefore: before, nodesAfter: after, errors: [...window_] });
  }
  await page.waitForTimeout(4000);
  // enregistrement : on attend l'autosave puis on lit le brouillon
  await page.keyboard.press("Control+s"); await page.waitForTimeout(3000);
  const row = db.prepare("SELECT draft FROM mk_landing_pages WHERE id = ?").get(id);
  const draft = row && row.draft ? JSON.parse(row.draft) : null;
  const types = {}; const walk = (n) => { if (!n || typeof n !== "object") return; if (n.type) types[n.type] = (types[n.type] || 0) + 1; (n.children || []).forEach(walk); };
  if (draft) (draft.sections || []).forEach(walk);
  // Étape 2 (serveur) : CHAQUE type du registre sur sa propre page — enregistrement, publication, page publiée, rendu du canevas.
  // Les widgets qui demandent un contenu réel à l'insertion (média, adresse, formation…) reçoivent un exemple valide.
  const reg = require("../src/marketing/pages/nodes");
  const courseId = (db.prepare("SELECT id FROM courses ORDER BY id LIMIT 1").get() || {}).id;
  const IMG = (n) => ({ src: `https://exemple.fr/photo-${n}.jpg`, alt: `Photo ${n}` });
  const SAMPLES = {
    video: { props: { url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", title: "Vidéo de démonstration" } },
    audio: { props: { src: "https://exemple.fr/son.mp3", title: "Extrait" } },
    embed: { props: { url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", title: "Contenu intégré" } },
    map: { props: { address: "12 avenue de la Paix, Brazzaville", zoom: 14, height: 350 } },
    gallery: { props: { images: [IMG(1), IMG(2), IMG(3)] } },
    carousel: { props: { images: [IMG(1), IMG(2), IMG(3)] } },
    imagebox: { props: { src: IMG(1).src, alt: "Photo", title: "Un titre clair", text: "Une phrase d'explication." } },
    hotspot: { props: { src: IMG(1).src, alt: "Photo", spots: [{ x: 50, y: 50, title: "Point", text: "Ce qu'il faut savoir." }] } },
    rating: { props: { value: 4.5, title: "Note des élèves" } },
    menuanchor: { anchor: "tarifs" },
    course: courseId ? { props: { courseId } } : null,
    addtocart: courseId ? { props: { courseId, mode: "cart", label: "Ajouter au panier" } } : null,
    courserating: courseId ? { props: { courseId } } : null,
    signupform: null, // demande un formulaire d'inscription publié : voir « dépendances »
  };
  const firstOf = {}; const collect = (n) => { if (!n || typeof n !== "object") return; if (n.type && !firstOf[n.type]) firstOf[n.type] = n; (n.children || []).forEach(collect); };
  if (draft) (draft.sections || []).forEach(collect);
  const perType = [];
  const putPage = async (pid, content) => { const rev = db.prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(pid).revision; return boss.request(`/marketing/pages/${pid}/brouillon`, { method: "PUT", json: { revision: rev, content }, headers: { Origin: srv.base } }); };
  for (const type of Object.keys(reg.NODE_TYPES)) {
    const row = { type, label: reg.NODE_TYPES[type].label, source: null, put: null, publish: null, published: false, canvas: null, error: null };
    let node = null;
    if (Object.prototype.hasOwnProperty.call(SAMPLES, type)) { node = SAMPLES[type] ? { type, ...SAMPLES[type] } : null; row.source = node ? "exemple valide" : "dépendance manquante"; }
    else if (firstOf[type]) { node = JSON.parse(JSON.stringify(firstOf[type])); row.source = "insertion réelle"; }
    if (!node) { row.error = "aucun contenu de départ (dépendance)"; perType.push(row); continue; }
    node.id = "aud000000001"; if (reg.NODE_TYPES[type].container) node.children = node.children && node.children.length ? node.children : [];
    const content = { sections: [{ id: "sect00000001", type: "layout", children: [reg.NODE_TYPES[type].container || type === "layout" ? node : { id: "box000000001", type: "container", props: {}, children: [node] }] }] };
    const pid = Number((await boss.post("/marketing/pages", { name: `Audit ${type}` })).location.match(/(\d+)$/)[1]);
    const put = await putPage(pid, content); row.put = put.status;
    if (put.status !== 200) { row.error = String(put.text).slice(0, 200); perType.push(row); continue; }
    const cv = await boss.request(`/marketing/pages/${pid}/rendu`, { method: "POST", json: { content }, headers: { Origin: srv.base } });
    row.canvas = cv.status === 200 && new RegExp(`kw-${type}\\b`).test(cv.text) ? "ok" : `KO (${cv.status})`;
    const pb = await boss.request(`/marketing/pages/${pid}/publier.json`, { method: "POST", json: {}, headers: { Origin: srv.base } });
    row.publish = pb.status;
    if (pb.status === 200) { const slug = db.prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(pid).slug; const html = (await boss.get(`/p/${slug}`)).text; row.published = new RegExp(`class="kw-node kw-${type}[ "]`).test(html) && !/undefined|\[object /.test(html.replace(/<script[\s\S]*?<\/script>/g, "")); }
    else row.error = String(pb.text).slice(0, 200);
    perType.push(row);
  }
  const html = "", pub = { status: 0 }, published = {};
  fs.writeFileSync(out, JSON.stringify({ items: results, draftTypes: types, perType }, null, 1));
  console.log(`types du registre : ${perType.length} · enregistrés : ${perType.filter((r) => r.put === 200).length} · canevas OK : ${perType.filter((r) => r.canvas === "ok").length} · publiés et rendus : ${perType.filter((r) => r.published).length}`);
  for (const r of perType.filter((x) => !(x.put === 200 && x.canvas === "ok" && x.published))) console.log("  ✖", r.type.padEnd(14), `put=${r.put} canevas=${r.canvas} publication=${r.publish} rendu=${r.published}`, r.error || "");
  console.log("→", out);
  await browser.close(); await srv.stop(); return;
})().catch((e) => { console.error("ERREUR :", e.message.slice(0, 500)); process.exit(1); });
