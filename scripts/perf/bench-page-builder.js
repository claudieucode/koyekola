#!/usr/bin/env node
// Banc de mesure du Page Builder (reproductible) : pages de 20, 100, 300 et 400 éléments (la limite du produit est de 400), scénarios réels
// pilotés dans Chrome (Playwright), mesures prises dans le navigateur (Performance API) ; option --profile : profil CPU (CDP) par scénario,
// agrégé par fonction. Aucune instrumentation n'est requise dans le produit.
//   NODE_PATH=<dossier de playwright-core> node scripts/perf/bench-page-builder.js [--sizes=20,100,300,400] [--profile] [--json=fichier]
// Configuration à indiquer avec les résultats : machine, Chrome (version imprimée), charge de la machine (uptime).
const fs = require("fs");
const path = require("path");
const os = require("os");
const { startServer, loginInstructor } = require("../../tests/helpers");
const { TEST_KEY } = require("../../tests/marketing-helpers");
const { chromium } = require("playwright-core");

const arg = (n, d) => { const a = process.argv.find((x) => x.startsWith(`--${n}=`)); return a ? a.split("=")[1] : d; };
const SIZES = arg("sizes", "20,100,300,400").split(",").map(Number);
const PROFILE = process.argv.includes("--profile");
const JSON_OUT = arg("json", "");
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Page représentative : sections libres, conteneurs imbriqués, titres, textes riches, boutons, images, listes, styles et réglages par écran
function makeContent(total) {
  let n = 0, sid = 0;
  const id = (p) => `${p}${String(++n).padStart(9, "0")}`.slice(0, 12);
  const leaf = (i) => {
    const k = i % 6;
    if (k === 0) return { id: id("hd"), type: "heading", props: { text: `Titre ${i}`, level: 3 }, styles: { desktop: { color: "#10222f", fontWeight: "700" }, mobile: { fontSize: "20px" } } };
    if (k === 1) return { id: id("tx"), type: "text", props: { html: `<p>Paragraphe ${i} : <strong>texte</strong> de démonstration avec un <a href="/blog">lien</a> et assez de mots pour occuper une ligne.</p>` } };
    if (k === 2) return { id: id("bt"), type: "button", props: { label: `Bouton ${i}`, url: "/catalogue", variant: "primary" } };
    if (k === 3) return { id: id("im"), type: "image", props: { src: "https://localhost:9/x.jpg", alt: `Image ${i}` } };
    if (k === 4) return { id: id("li"), type: "list", props: { items: ["Un", "Deux", "Trois"], ordered: false } };
    return { id: id("tx"), type: "text", props: { html: `<p>Note ${i}</p>` }, styles: { desktop: { paddingTop: "8px", paddingBottom: "8px" } } };
  };
  const boxes = [];
  let made = 0;
  while (made < total) {
    // une boîte de 8 éléments (conteneur + 4 feuilles + une grille de 3)
    const box = { id: id("cn"), type: "container", styles: { desktop: { paddingTop: "16px", paddingBottom: "16px", backgroundColor: "#f3f8fc" } }, children: [] };
    made++;
    for (let i = 0; i < 4 && made < total; i++) { box.children.push(leaf(made)); made++; }
    if (made + 4 <= total) { const grid = { id: id("gd"), type: "grid", styles: { desktop: { columns: 3, gap: "12px" } }, children: [] }; made++; for (let i = 0; i < 3 && made < total; i++) { grid.children.push(leaf(made)); made++; } box.children.push(grid); }
    boxes.push(box);
  }
  // au plus 25 sections libres (limite du produit : 30)
  const per = Math.ceil(boxes.length / 25), sections = [];
  for (let i = 0; i < boxes.length; i += per) sections.push({ id: `sect${String(++sid).padStart(8, "0")}`, type: "layout", children: boxes.slice(i, i + per) });
  return { sections, nodes: made };
}

async function main() {
  const srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
  const boss = await loginInstructor(srv);
  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  const version = browser.version();
  const results = { config: { os: `${os.type()} ${os.release()}`, cpus: os.cpus().length, model: os.cpus()[0].model, chrome: version, load: os.loadavg().map((x) => +x.toFixed(2)), date: new Date().toISOString().slice(0, 10) }, sizes: {} };
  console.log(`# Page Builder — banc de mesure (${results.config.date}) — ${results.config.model} ×${results.config.cpus}, Chrome ${version}, charge ${results.config.load.join(" ")}`);
  for (const size of SIZES) {
    const { sections, nodes } = makeContent(size);
    const pageId = Number((await boss.post("/marketing/pages", { name: `Banc ${size}` })).location.match(/(\d+)$/)[1]);
    const db = srv.db();
    const rev = db.prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(pageId).revision;
    const put = await boss.request(`/marketing/pages/${pageId}/brouillon`, { method: "PUT", json: { revision: rev, content: { sections } }, headers: { Origin: srv.base } });
    if (put.status !== 200) throw new Error(`Page de ${size} éléments refusée : ${put.text.slice(0, 200)}`);
    const ctx = await browser.newContext({ viewport: { width: 1600, height: 950 } });
    await ctx.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    const page = await ctx.newPage();
    const cdp = PROFILE ? await ctx.newCDPSession(page) : null;
    const res = { nodes };
    const t0 = Date.now();
    await page.goto(`${srv.base}/marketing/pages/${pageId}/editeur`);
    await page.waitForFunction(() => { const f = document.querySelector("[data-pb-frame]"); return f && f.contentDocument && f.contentDocument.body && f.contentDocument.body.classList.contains("lp-builder") && f.contentDocument.querySelector("[data-node-id]"); }, null, { timeout: 120000 });
    res.chargement = Date.now() - t0;
    res.domParent = await page.evaluate(() => document.getElementsByTagName("*").length);
    res.domCadre = await page.evaluate(() => document.querySelector("[data-pb-frame]").contentDocument.getElementsByTagName("*").length);
    res.memoireMo = await page.evaluate(() => (performance.memory ? +(performance.memory.usedJSHeapSize / 1048576).toFixed(1) : null));
    await sleep(800);
    const frame = () => page.frameLocator("[data-pb-frame]");
    // Temps jusqu'à l'image suivante (≈ réponse visuelle) d'une action déclenchée dans la page parent
    const timed = async (fn, arg2) => page.evaluate(async ([src, a]) => { const f = new Function("a", `return (${src})(a)`); const t = performance.now(); await f(a); await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))); return performance.now() - t; }, [fn.toString(), arg2]);
    const stat = (xs) => { const s = xs.slice().sort((a, b) => a - b); return { med: +s[Math.floor(s.length / 2)].toFixed(1), max: +s[s.length - 1].toFixed(1) }; };
    const prof = async (name, run) => {
      if (!cdp) return run();
      await cdp.send("Profiler.enable"); await cdp.send("Profiler.setSamplingInterval", { interval: 200 }); await cdp.send("Profiler.start");
      const out = await run();
      const { profile } = await cdp.send("Profiler.stop");
      const self = new Map(); const byId = new Map(profile.nodes.map((nd) => [nd.id, nd]));
      profile.samples.forEach((sid, i) => { const nd = byId.get(sid); const k = `${nd.callFrame.functionName || "(anonyme)"}:${nd.callFrame.lineNumber + 1}`; self.set(k, (self.get(k) || 0) + (profile.timeDeltas[i] || 0)); });
      // Lignes les plus chaudes (positionTicks) des 3 fonctions les plus coûteuses : où passe le temps À L'INTÉRIEUR d'une fonction
      const lines = new Map();
      profile.nodes.forEach((nd) => (nd.positionTicks || []).forEach((t) => { const k = `${nd.callFrame.functionName || "(anonyme)"}:${t.line}`; lines.set(k, (lines.get(k) || 0) + t.ticks); }));
      res.lignes = res.lignes || {}; res.lignes[name] = [...lines.entries()].filter(([k]) => !k.startsWith("(")).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, v]) => `${k} ${v}`);
      res.profils = res.profils || {}; res.profils[name] = [...self.entries()].filter(([k]) => !k.startsWith("(")).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([k, v]) => `${k} ${(v / 1000).toFixed(0)} ms`);
      return out;
    };
    // Sélection : cliquer successivement 12 lignes de la structure (calques)
    const rows = await page.$$eval("[data-pb-layers] .pb-node[data-id] > .pb-row-item", (els) => els.map((e) => e.parentElement.getAttribute("data-id")));
    const pick = (i) => rows[Math.floor((i + 1) * rows.length / 14)];
    res.selection = await prof("selection", async () => { const xs = []; for (let i = 0; i < 12; i++) { xs.push(await timed((id) => { document.querySelector(`[data-pb-layers] .pb-node[data-id="${id}"] > .pb-row-item`).click(); }, pick(i))); await sleep(60); } return stat(xs); });
    // Modification de texte : saisie dans le champ « Texte » du titre sélectionné (réponse du panneau, puis mise à jour du CANEVAS)
    const heading = await page.evaluate(() => { const r = [...document.querySelectorAll("[data-pb-layers] .pb-node[data-id]")].find((n) => /^hd/.test(n.getAttribute("data-id"))); return r ? r.getAttribute("data-id") : null; });
    await page.evaluate((id) => document.querySelector(`[data-pb-layers] .pb-node[data-id="${id}"] > .pb-row-item`).click(), heading);
    await sleep(300);
    const field = page.locator("[data-pb-inspector] input[type=text], [data-pb-inspector] textarea").first();
    res.saisie = await prof("saisie", async () => {
      const keys = [], canvas = [];
      for (let i = 0; i < 8; i++) {
        const ch = String.fromCharCode(97 + i);
        const t = await page.evaluate(async (c) => { const f = document.querySelector("[data-pb-inspector] input[type=text], [data-pb-inspector] textarea"); const t0 = performance.now(); f.value = f.value + c; f.dispatchEvent(new Event("input", { bubbles: true })); await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))); return performance.now() - t0; }, ch);
        keys.push(t); await sleep(40);
      }
      // latence jusqu'au canevas : dernière frappe → le texte apparaît dans l'iframe
      const final = "zz" + Date.now().toString(36);
      const tc = await page.evaluate(async ([id, text]) => {
        const f = document.querySelector("[data-pb-inspector] input[type=text], [data-pb-inspector] textarea");
        const doc = document.querySelector("[data-pb-frame]").contentDocument; const t0 = performance.now();
        f.value = text; f.dispatchEvent(new Event("input", { bubbles: true }));
        while (performance.now() - t0 < 15000) { const el = document.querySelector("[data-pb-frame]").contentDocument.querySelector(`[data-node-id="${id}"]`); if (el && el.textContent.includes(text)) return performance.now() - t0; await new Promise((r) => setTimeout(r, 4)); }
        return -1;
      }, [heading, final]);
      return { frappe: stat(keys), canevas: +tc.toFixed(0) };
    });
    // Enregistrement automatique : de la dernière modification à « Enregistré »
    res.sauvegarde = await page.evaluate(async () => {
      const t0 = performance.now(); const el = document.querySelector("[data-pb-save]");
      while (performance.now() - t0 < 20000) { if (/Enregistré/.test(el.textContent)) return +(performance.now() - t0).toFixed(0); await new Promise((r) => setTimeout(r, 25)); }
      return -1;
    });
    // Dupliquer, supprimer, annuler, rétablir (clavier réel), puis attente du canevas à jour
    const keyOp = async (keys) => { const t0 = Date.now(); await page.keyboard.press(keys); return Date.now() - t0; };
    const sync = async (fn) => page.evaluate(async (src) => { const t = performance.now(); (new Function(src))(); await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))); return performance.now() - t; }, fn);
    const countBefore = await page.evaluate(() => document.querySelector("[data-pb-frame]").contentDocument.querySelectorAll("[data-node-id]").length);
    await page.locator("[data-pb-canvas]").focus().catch(() => {});
    // Opérations structurelles, 5 cycles « dupliquer → annuler → rétablir → supprimer » : médiane de la durée du traitement (JS synchrone, « synchro »)
    // et jusqu'à l'image suivante (« image »)
    const op = (find) => page.evaluate(async (src) => {
      const btn = [...document.querySelectorAll("button")].find((b) => new RegExp(src).test((b.getAttribute("aria-label") || "") + (b.getAttribute("data-tip") || "") + (b.hasAttribute("data-pb-undo") ? "Annuler" : "") + (b.hasAttribute("data-pb-redo") ? "Rétablir" : "")) && b.offsetParent && !b.disabled);
      if (!btn) return null;
      const t = performance.now(); btn.click(); const sync = performance.now() - t;
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      return { sync, image: performance.now() - t };
    }, find);
    const med = (xs) => { const v = xs.filter((x) => x != null).sort((a, b) => a - b); return v.length ? +v[Math.floor(v.length / 2)].toFixed(1) : -1; };
    const acc = { dupliquer: [], annuler: [], retablir: [], supprimer: [] };
    await prof("structure", async () => {
      for (let i = 0; i < 5; i++) {
        for (const [k, rx] of [["dupliquer", "^Dupliquer"], ["annuler", "Annuler"], ["retablir", "Rétablir"], ["supprimer", "^Supprimer"]]) { const r = await op(rx); acc[k].push(r); await sleep(450); }
      }
    });
    for (const k of Object.keys(acc)) res[k] = { synchro: med(acc[k].map((x) => x && x.sync)), image: med(acc[k].map((x) => x && x.image)) };
    // Défilement du canevas : cadence (images/s) pendant 1 s de défilement continu
    res.fpsDefilement = await page.evaluate(async () => { const w = document.querySelector("[data-pb-frame]").contentWindow; let frames = 0; const t0 = performance.now(); const tick = () => { w.scrollBy(0, 40); frames++; if (performance.now() - t0 < 1000) requestAnimationFrame(tick); }; await new Promise((r) => { const done = () => r(); requestAnimationFrame(tick); setTimeout(done, 1050); }); return frames; });
    // Instantané mémoire / DOM en fin de scénario et taille des données
    res.memoireFinMo = await page.evaluate(() => (performance.memory ? +(performance.memory.usedJSHeapSize / 1048576).toFixed(1) : null));
    res.documentKo = await page.evaluate(async (pid) => (await (await fetch(`/marketing/pages/${pid}/editeur`)).text()).length / 1024 | 0, pageId);
    results.sizes[size] = res;
    console.log(JSON.stringify({ taille: size, ...res }));
    await ctx.close();
  }
  if (JSON_OUT) fs.writeFileSync(JSON_OUT, JSON.stringify(results, null, 2));
  await browser.close(); await srv.stop();
}
main().catch((e) => { console.error(e); process.exit(1); });
