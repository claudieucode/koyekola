#!/usr/bin/env node
// Fluidité de l'éditeur d'articles (TITAN XX) : latence de frappe réelle (clavier → image suivante), tâches longues, décalage de mise en page,
// et comportement de mouvement des fenêtres, menus et panneaux. Navigateur réel, aucune instrumentation dans le produit.
//   NODE_PATH=<node_modules> node scripts/perf/mesure-fluidite-editeur.js [--blocs=200] [--n=40] [--json=sortie.json]
const fs = require("fs");
const { startServer, loginInstructor } = require("../../tests/helpers");
const { TEST_KEY } = require("../../tests/marketing-helpers");
const { chromium } = require("playwright-core");
const arg = (n, d) => { const a = process.argv.find((x) => x.startsWith(`--${n}=`)); return a ? a.split("=")[1] : d; };
const GROUPS = Number(arg("blocs", "200")), N = Number(arg("n", "40")), OUT = arg("json", "");
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const stat = (xs) => { const s = xs.slice().sort((a, b) => a - b); const q = (p) => +(s[Math.min(s.length - 1, Math.floor(s.length * p))] || 0).toFixed(1); return { n: s.length, median: q(0.5), p95: q(0.95), max: +(s[s.length - 1] || 0).toFixed(1) }; };

(async () => {
  console.error("démarrage du serveur…");
  const srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
  const boss = await loginInstructor(srv);
  console.error("serveur prêt, lancement de Chrome…");
  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  const report = { chrome: browser.version(), blocs: GROUPS * 4 };
  try {
    const open = async (reduced) => {
      const context = await browser.newContext({ viewport: { width: 1500, height: 950 }, reducedMotion: reduced ? "reduce" : "no-preference" });
      await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (e) => errors.push(String(e)));
      page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
      await page.addInitScript(() => {
        window.__perf = { long: [], cls: 0 };
        try { new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__perf.long.push(Math.round(e.duration)); }).observe({ type: "longtask", buffered: true }); } catch {}
        try { new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) { window.__perf.cls += e.value; (window.__perf.src = window.__perf.src || []).push({ v: +e.value.toFixed(4), t: Math.round(e.startTime), n: (e.sources || []).map((x) => { const el = x.node; return el ? `${el.tagName.toLowerCase()}${el.id ? "#" + el.id : ""}${typeof el.className === "string" && el.className ? "." + el.className.split(" ")[0] : ""}` : "?"; }) }); } }).observe({ type: "layout-shift", buffered: true }); } catch {}
      });
      await page.goto(`${srv.base}/formateur/blog/nouveau`);
      await page.waitForFunction(() => document.querySelector(".ProseMirror") && document.querySelector(".ProseMirror").editor);
      return { page, context, errors };
    };

    console.error("chrome prêt, mesure de la frappe…");
    // 1) Frappe réelle sur un grand article : touche → image peinte suivante
    {
      const { page, context, errors } = await open(false);
      await page.evaluate((g) => {
        const ed = document.querySelector(".ProseMirror").editor;
        const parts = [];
        for (let i = 0; i < g; i++) parts.push(`<h2>Titre ${i}</h2><p>Paragraphe ${i} avec un peu de texte pour occuper de la place dans le document.</p><div class="kb-group" data-bg="light"><p>Dans un groupe ${i}</p></div><ul><li><p>Point ${i}</p></li></ul>`);
        ed.commands.setContent(parts.join(""));
        ed.commands.setTextSelection(ed.state.doc.content.size - 5);
        ed.view.focus();
        window.__perf.long.length = 0;
      }, GROUPS);
      await sleep(600);
      const lat = [];
      for (let i = 0; i < N; i++) {
        await page.evaluate(() => { const ed = document.querySelector(".ProseMirror").editor; if (!ed.isFocused) ed.view.focus(); });
        const p = page.evaluate(() => new Promise((res) => {
          const t0 = performance.now();
          const done = () => requestAnimationFrame(() => requestAnimationFrame(() => res(performance.now() - t0)));
          document.querySelector(".ProseMirror").addEventListener("input", done, { once: true });
          setTimeout(() => res(-1), 2000);
        }));
        await page.keyboard.type("a", { delay: 0 });
        const v = await p;
        if (v >= 0) lat.push(v);
        await sleep(25);
      }
      report.frappe = stat(lat);
      report.tachesLongues = await page.evaluate(() => window.__perf.long.slice());
      report.erreursConsole = errors;
      await context.close();
    }

    // 2) Mouvement : fenêtre (revisions), panneau d'insertion, menus — présence d'animation d'entrée/sortie et durée réelle jusqu'à visible
    for (const reduced of [false, true]) {
      const { page, context, errors } = await open(reduced);
      await sleep(400);
      console.error(`mouvement (${reduced ? "réduit" : "normal"})…`);
      const r = await Promise.race([page.evaluate(async () => {
        const out = {};
        const frames = () => new Promise((res) => requestAnimationFrame(() => requestAnimationFrame(res)));
        const motion = (el) => { const cs = getComputedStyle(el); return { animation: cs.animationName, animMs: cs.animationDuration, transition: cs.transitionProperty, transMs: cs.transitionDuration }; };
        // Fenêtre : « Raccourcis clavier » (dialogue natif ouvert par showModal)
        const btn = document.querySelector('[data-option="shortcuts"]');
        if (btn) {
          const t0 = performance.now();
          btn.click();
          let dlg = null;
          while (!dlg && performance.now() - t0 < 3000) { dlg = document.querySelector("dialog.wp-modal[open]"); if (!dlg) await new Promise((r) => setTimeout(r, 4)); }
          out.fenetre = { ouverteAu: dlg ? Math.round(performance.now() - t0) : null, ...(dlg ? motion(dlg) : {}) };
          await frames();
          const dlg2 = document.querySelector("dialog.wp-modal[open]");
          if (dlg2) {
            const closeBtn = dlg2.querySelector('[aria-label="Fermer"]');
            (closeBtn || dlg2).click();
            await frames();
            out.fenetre.retireeApresDeuxImages = !document.querySelector("dialog.wp-modal");
            out.fenetre.focusRendu = document.activeElement === btn;
          }
        } else out.fenetre = "déclencheur Raccourcis introuvable";
        // Panneau d'insertion : mouvement + déplacement du canevas
        const ins = document.querySelector("[data-toggle-inserter]");
        const canvas = document.querySelector(".ProseMirror");
        if (ins && canvas) {
          const before = canvas.getBoundingClientRect();
          ins.click();
          const panel = document.querySelector("[data-secondary-close]").closest('[class*="secondary"]');
          out.inserteur = panel ? motion(panel) : "panneau introuvable";
          await new Promise((r) => setTimeout(r, 400));
          const after = canvas.getBoundingClientRect();
          out.inserteur.canevasDeplacePx = { x: Math.round(after.left - before.left), largeur: Math.round(after.width - before.width) };
          ins.click();
          await frames();
        }
        // Contrôles de mouvement globaux
        const root = getComputedStyle(document.documentElement);
        out.tokens = ["--kolakisa-motion-fast", "--kolakisa-motion-normal", "--kolakisa-motion-panel", "--kolakisa-ease-standard"].map((k) => [k, root.getPropertyValue(k).trim() || null]);
        return out;
      }), sleep(20000).then(() => ({ delaiDepasse: true }))]);
      report[reduced ? "mouvementReduit" : "mouvement"] = { ...r, erreurs: errors, cls: await page.evaluate(() => +window.__perf.cls.toFixed(4)), sourcesCls: await page.evaluate(() => window.__perf.src || []) };
      await context.close();
    }
  } finally {
    await browser.close();
    await srv.stop();
  }
  console.log(JSON.stringify(report, null, 2));
  if (OUT) fs.writeFileSync(OUT, JSON.stringify(report, null, 2));
})().catch((e) => { console.error(e); process.exit(1); });
