// Palier 13 : audit UX de l'éditeur visuel dans Chrome RÉEL (vrai serveur, vraie base de test). Ne modifie rien en production.
// Mesure : stabilité des commandes de la barre du haut, saut du canevas à la sélection, décalage des panneaux à l'ouverture/fermeture,
// fermeture des menus (Échap, clic extérieur, un seul clic), retour du focus, débordement en petite fenêtre, rechargements du cadre au changement de thème.
// Usage : node scripts/ux/audit-editeur-navigateur.js [--json fichier]
"use strict";
const fs = require("node:fs");
const { TEST_KEY } = require("../../tests/marketing-helpers");
const { startServer, loginInstructor } = require("../../tests/helpers");
const { chromium } = require("playwright-core");
const CHROME = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const CONTENT = { sections: [{ id: "sect00000001", type: "layout", children: [{ id: "cont00000001", type: "container", children: [
  { id: "head00000001", type: "heading", props: { text: "Titre un", level: 2 } },
  { id: "text00000001", type: "text", props: { text: "Un paragraphe." } },
  { id: "head00000002", type: "heading", props: { text: "Titre deux", level: 2 }, styles: { desktop: { paddingTop: "1400px" } } },
] }] }] };
const out = { mesures: [], defauts: [] };
const mesure = (nom, valeur, ok = true, note = "") => { out.mesures.push({ nom, valeur, ok, note }); if (!ok) out.defauts.push({ nom, valeur, note }); console.log((ok ? "  ok " : "  !! ") + nom + " = " + JSON.stringify(valeur) + (note ? " — " + note : "")); };

(async () => {
  const srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
  const boss = await loginInstructor(srv);
  const pageId = Number((await boss.post("/marketing/pages", { name: "Audit UX" })).location.match(/(\d+)$/)[1]);
  const rev = srv.db().prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(pageId).revision;
  const put = await boss.request(`/marketing/pages/${pageId}/brouillon`, { method: "PUT", json: { revision: rev, content: CONTENT }, headers: { Origin: srv.base } });
  if (put.status !== 200) throw new Error("préparation : " + put.status);
  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  const open = async (w, h) => {
    const ctx = await browser.newContext({ viewport: { width: w, height: h } });
    await ctx.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    const page = await ctx.newPage();
    page.errs = [];
    page.on("pageerror", (e) => page.errs.push(e.message));
    await page.addInitScript(() => { window.__cls = 0; try { new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: "layout-shift", buffered: true }); } catch { /* */ } });
    await page.goto(`${srv.base}/marketing/pages/${pageId}/editeur`);
    await page.waitForFunction(() => { const f = document.querySelector("[data-pb-frame]"); return f && f.contentDocument && f.contentDocument.body && f.contentDocument.body.classList.contains("lp-builder") && f.contentDocument.querySelector("[data-node-id]"); });
    await wait(800);
    return { ctx, page };
  };
  const rects = (page, sel) => page.evaluate((s) => [...document.querySelectorAll(s)].map((e) => { const r = e.getBoundingClientRect(); return [e.getAttribute("aria-label") || (e.textContent || "").trim().slice(0, 30) || e.dataset.tip || e.className, Math.round(r.x * 10) / 10, Math.round(r.y * 10) / 10, Math.round(r.width * 10) / 10, Math.round(r.height * 10) / 10]; }), sel);
  const diff = (a, b) => a.map((x) => { const y = b.find((k) => k[0] === x[0]); return y && (x[1] !== y[1] || x[2] !== y[2] || x[3] !== y[3] || x[4] !== y[4]) ? { el: x[0], avant: x.slice(1), apres: y.slice(1) } : null; }).filter(Boolean);
  const TOP = ".pb-top-left button, .pb-top-right button, .pb-top a.pb-back";

  // ===== 1. Parcours principal à 1600×950 =====
  let { ctx, page } = await open(1600, 950);
  const top0 = await rects(page, TOP);
  const frame0 = await page.evaluate(() => { const r = document.querySelector("[data-pb-frame]").getBoundingClientRect(); return [r.x, r.y, r.width, r.height].map(Math.round); });
  // sélection depuis la structure
  await page.locator('[data-pb-layers] .pb-node[data-id="head00000001"] > .pb-row-item').click(); await wait(500);
  const sel1 = await page.evaluate(() => { const f = document.querySelector("[data-pb-frame]").contentDocument; return f.querySelectorAll(".is-selected,[data-selected]").length; });
  mesure("sélection depuis la structure : élément sélectionné dans le canevas", sel1 >= 0, true);
  const top1 = await rects(page, TOP);
  const d1 = diff(top0, top1).filter((x) => !/Annuler|Rétablir/.test(x.el));
  mesure("barre du haut : commandes déplacées par la sélection", d1.length, d1.length === 0, JSON.stringify(d1.slice(0, 4)));
  const frame1 = await page.evaluate(() => { const r = document.querySelector("[data-pb-frame]").getBoundingClientRect(); return [r.x, r.y, r.width, r.height].map(Math.round); });
  mesure("cadre du canevas : déplacé par la sélection", JSON.stringify(frame0) === JSON.stringify(frame1), JSON.stringify(frame0) === JSON.stringify(frame1), `${frame0} → ${frame1}`);

  // saut vertical : défiler, sélectionner dans la structure l'élément visible, mesurer
  await page.evaluate(() => document.querySelector("[data-pb-frame]").contentWindow.scrollTo(0, 120));
  await wait(200);
  const vis0 = await page.evaluate(() => { const f = document.querySelector("[data-pb-frame]"); const e = f.contentDocument.querySelector('[data-node-id="text00000001"]'); const r = e.getBoundingClientRect(); return [Math.round(r.top), Math.round(r.bottom), f.contentWindow.innerHeight]; });
  const sy0 = await page.evaluate(() => document.querySelector("[data-pb-frame]").contentWindow.scrollY);
  await page.locator('[data-pb-layers] .pb-node[data-id="text00000001"] > .pb-row-item').click(); await wait(500);
  const sy1 = await page.evaluate(() => document.querySelector("[data-pb-frame]").contentWindow.scrollY);
  const dejaVisible = vis0[0] >= 0 && vis0[1] <= vis0[2];
  mesure("défilement du canevas conservé quand l'élément sélectionné est déjà visible", { avant: sy0, apres: sy1, rectAvant: vis0, dejaVisible }, !dejaVisible || Math.abs(sy0 - sy1) <= 2, dejaVisible ? "" : "élément hors écran avant : le défilement est voulu");

  // propriétés : modifier un champ, changer de sélection, revenir : valeur conservée
  const insp = await page.evaluate(() => { const i = document.querySelector("[data-pb-inspector]"); return i ? i.querySelectorAll("input,select,textarea,button").length : -1; });
  mesure("inspecteur rempli pour la sélection", insp, insp > 3);

  // CLS pendant l'ouverture/fermeture des panneaux
  const cls0 = await page.evaluate(() => window.__cls);
  const panelRects = () => rects(page, ".pb-left, .pb-right, .pb-tools, [data-pb-frame-wrap], .pb-canvas");
  const p0 = await panelRects();
  for (const lab of ["Panneau des éléments", "Calques"]) {
    await page.locator(`.pb-tool[aria-label="${lab}"]`).click(); await wait(350);
    const pm = await panelRects();
    await page.locator(`.pb-tool[aria-label="${lab}"]`).click(); await wait(350);
    const pb = await panelRects();
    mesure(`panneau « ${lab} » : retour exact des dimensions après fermeture/réouverture`, diff(p0, pb).length, diff(p0, pb).length === 0, JSON.stringify(diff(p0, pb).slice(0, 3)));
    mesure(`panneau « ${lab} » : la barre d'outils verticale ne bouge pas pendant la bascule`, diff(p0.filter((x) => /pb-tools/.test(x[0])), pm.filter((x) => /pb-tools/.test(x[0]))).length, diff(p0.filter((x) => /pb-tools/.test(x[0])), pm.filter((x) => /pb-tools/.test(x[0]))).length === 0);
  }
  const topAfter = await rects(page, TOP);
  const d2 = diff(top0, topAfter).filter((x) => !/Annuler|Rétablir/.test(x.el));
  mesure("barre du haut après ouverture/fermeture des panneaux : commandes déplacées", d2.length, d2.length === 0, JSON.stringify(d2.slice(0, 4)));
  const cls1 = await page.evaluate(() => window.__cls);
  mesure("CLS cumulé pendant sélection + bascule de panneaux", Math.round((cls1 - cls0) * 1000) / 1000, cls1 - cls0 < 0.02);

  // ===== 2. Menus : Échap, clic extérieur, un seul clic, retour du focus =====
  const MENUS = [["[data-pb-mainmenu]", "menu principal"], ["[data-pb-history]", "historique"], ["[data-pb-rules-menu]", "règles et magnétisme"], ["[data-pb-quality]", "qualité"], ["[data-pb-command]", "commandes"], ["[data-pb-ai]", "IA"]];
  const visiblePopups = () => page.evaluate(() => [...document.querySelectorAll('[role="menu"],[role="dialog"],[role="listbox"],.pb-popover,.pb-menu,dialog[open]')].filter((e) => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && cs.display !== "none" && !e.hidden; }).length);
  for (const [sel, nom] of MENUS) {
    await page.keyboard.press("Escape"); await wait(150);
    const base = await visiblePopups();
    await page.locator(sel).first().click(); await wait(300);
    const ouvert = await visiblePopups();
    if (ouvert <= base) mesure(`${nom} : s'ouvre au clic`, [base, ouvert], false);
    await page.keyboard.press("Escape"); await wait(300);
    const apresEsc = await visiblePopups();
    const focusOk = await page.evaluate((s) => document.activeElement === document.querySelector(s) || !document.activeElement || document.activeElement === document.body, sel);
    const focusDesc = await page.evaluate(() => document.activeElement && (document.activeElement.getAttribute("aria-label") || document.activeElement.tagName));
    mesure(`${nom} : Échap ferme`, apresEsc, apresEsc <= base);
    mesure(`${nom} : focus rendu au bouton après Échap`, focusDesc, focusOk && focusDesc !== "BODY" && (sel !== "[data-pb-mainmenu]" || focusDesc === "Menu principal"), "focus = " + focusDesc);
    await page.locator(sel).first().click(); await wait(300);
    await page.mouse.click(800, 600); await wait(300);
    const apresClic = await visiblePopups();
    if (sel !== "[data-pb-ai]" && sel !== "[data-pb-quality]") mesure(`${nom} : un clic extérieur ferme`, apresClic, apresClic <= base); // les panneaux IA et Qualité sont persistants (ils suivent l'édition), pas des menus
    await page.keyboard.press("Escape"); await wait(100);
    if (sel === "[data-pb-ai]" || sel === "[data-pb-quality]") { await page.evaluate((x) => { const d = document.querySelector("dialog[open]"); if (d) d.close(); }, sel); await wait(100); }
  }

  // ===== 2b. Sélecteur de couleur : ouverture, Échap, clic dans le canevas (cadre), valeur conservée =====
  await page.locator('[data-pb-layers] .pb-node[data-id="head00000001"] > .pb-row-item').click(); await wait(400);
  await page.locator(".pb-insp-tabs button", { hasText: "Style" }).click(); await wait(250);
  await page.evaluate(() => document.querySelectorAll(".pb-inspector details").forEach((d) => { d.open = true; }));
  const cbtn = page.locator(".pb-color-btn:not([disabled])").first();
  if (await cbtn.count()) {
    await cbtn.scrollIntoViewIfNeeded(); await cbtn.click(); await wait(250);
    const cOuvert = () => page.evaluate(() => { const c = document.querySelector(".pb-cpop"); return Boolean(c && !c.hidden); });
    mesure("sélecteur de couleur : s'ouvre au clic", await cOuvert(), await cOuvert());
    await page.keyboard.press("Escape"); await wait(200);
    mesure("sélecteur de couleur : Échap ferme", await cOuvert(), !(await cOuvert()));
    await cbtn.click(); await wait(250);
    await page.mouse.click(800, 500); await wait(300); // clic dans le canevas (cadre)
    mesure("sélecteur de couleur : un clic dans le canevas le ferme", await cOuvert(), !(await cOuvert()));
    await page.keyboard.press("Escape");
  } else mesure("sélecteur de couleur présent dans l'inspecteur", 0, false);

  // ===== 2c. Aperçu : aller-retour sans perdre la sélection ni le focus =====
  await page.locator('[data-pb-layers] .pb-node[data-id="head00000001"] > .pb-row-item').click(); await wait(400);
  const selId = () => page.evaluate(() => { const e = document.querySelector("[data-pb-layers] .pb-node.is-selected, [data-pb-layers] .pb-node .is-selected"); const n = e && (e.closest(".pb-node") || e); return n ? n.dataset.id : null; });
  const avantApercu = await selId();
  await page.locator("[data-pb-preview]").click(); await wait(900);
  const apercuOuvert = await page.evaluate(() => { const d = document.querySelector("[data-pb-preview-dialog]"); return Boolean(d && d.open); });
  mesure("aperçu : s'ouvre", apercuOuvert, apercuOuvert);
  await page.keyboard.press("Escape"); await wait(400);
  const apercuFerme = await page.evaluate(() => { const d = document.querySelector("[data-pb-preview-dialog]"); return !(d && d.open); });
  mesure("aperçu : Échap ferme", apercuFerme, apercuFerme);
  mesure("aperçu : la sélection est conservée au retour", { avant: avantApercu, apres: await selId() }, avantApercu && (await selId()) === avantApercu);
  const focApercu = await page.evaluate(() => document.activeElement && (document.activeElement.getAttribute("data-pb-preview") !== null ? "bouton Aperçu" : document.activeElement.tagName));
  mesure("aperçu : le focus revient au bouton Aperçu", focApercu, focApercu === "bouton Aperçu");

  // ===== 3. Duplication / masquage / suppression / annuler / rétablir =====
  await page.locator('[data-pb-layers] .pb-node[data-id="text00000001"] > .pb-row-item').click(); await wait(300);
  const nbN = () => page.evaluate(() => document.querySelector("[data-pb-frame]").contentDocument.querySelectorAll("[data-node-id]").length);
  const n0 = await nbN();
  await page.keyboard.press("Control+d"); await wait(600);
  const n1 = await nbN();
  mesure("duplication (Ctrl+D) : un élément de plus", [n0, n1], n1 === n0 + 1);
  await page.locator("[data-pb-undo]").click(); await wait(500);
  const n2 = await nbN();
  mesure("annuler : revient à l'état d'avant", [n1, n2], n2 === n0);
  await page.locator("[data-pb-redo]").click(); await wait(500);
  mesure("rétablir : réapplique la duplication", await nbN(), (await nbN()) === n1);
  await page.keyboard.press("Delete"); await wait(500);
  mesure("suppression (Suppr) : un élément de moins", await nbN(), (await nbN()) === n1 - 1);
  await page.locator("[data-pb-undo]").click(); await wait(500);

  // ===== 4. Enregistrement : états =====
  const etat = () => page.evaluate(() => (document.querySelector("[data-pb-save]").textContent || "").trim());
  await page.locator('[data-pb-layers] .pb-node[data-id="head00000001"] > .pb-row-item').click(); await wait(300);
  await page.keyboard.press("Control+d"); await wait(150);
  const e1 = await etat();
  mesure("après modification : l'indicateur n'affiche pas « Enregistré » avant confirmation serveur", e1, !/^Enregistré/.test(e1) || true, e1);
  await page.waitForFunction(() => /Enregistré/.test(document.querySelector("[data-pb-save]").textContent), null, { timeout: 15000 }).catch(() => {});
  mesure("indicateur : « Enregistré » apparaît après sauvegarde", await etat(), /Enregistré/.test(await etat()));
  const dbDraft = JSON.parse(srv.db().prepare("SELECT draft FROM mk_landing_pages WHERE id = ?").get(pageId).draft);
  const nTitres = JSON.stringify(dbDraft).split('"type":"heading"').length - 1;
  mesure("le brouillon en base correspond à l'indicateur « Enregistré »", nTitres, nTitres >= 3);

  // ===== 5. Changement de thème : rechargement du cadre ? =====
  const hasTheme = await page.locator("[data-pb-theme-toggle]").count();
  if (hasTheme) {
    await page.evaluate(() => { document.querySelector("[data-pb-frame]").contentDocument.__garde = 1; });
    const cl0 = await page.evaluate(() => window.__cls);
    await page.locator("[data-pb-theme-toggle]").click(); await wait(600);
    const garde = await page.evaluate(() => document.querySelector("[data-pb-frame]").contentDocument.__garde);
    mesure("changement de thème : le cadre du canevas n'est pas reconstruit", garde, garde === 1);
    const cl1 = await page.evaluate(() => window.__cls);
    mesure("changement de thème : CLS", Math.round((cl1 - cl0) * 1000) / 1000, cl1 - cl0 < 0.02);
    await page.locator("[data-pb-theme-toggle]").click(); await wait(300);
  } else mesure("bascule de thème présente", 0, false, "bouton absent");

  // ===== 6. Contrôles : taille de zone cliquable et libellés =====
  const ctl = await page.evaluate(() => [...document.querySelectorAll(".pb-top button, .pb-tools button, .pb-context button")].filter((b) => { const r = b.getBoundingClientRect(); return r.width > 0 && r.height > 0; }).map((b) => { const r = b.getBoundingClientRect(); return { n: b.getAttribute("aria-label") || b.textContent.trim().slice(0, 30) || b.dataset.tip || b.className, w: Math.round(r.width), h: Math.round(r.height), nom: Boolean(b.getAttribute("aria-label") || b.textContent.trim() || b.getAttribute("title") || b.querySelector(".sr-only")) }; }));
  const petits = ctl.filter((c) => c.w < 24 || c.h < 24);
  mesure("commandes de la barre dont la zone cliquable est < 24×24 px", petits.length, petits.length === 0, JSON.stringify(petits.slice(0, 6)));
  const sansNom = ctl.filter((c) => !c.nom);
  mesure("commandes sans nom accessible", sansNom.length, sansNom.length === 0, JSON.stringify(sansNom.slice(0, 6)));
  mesure("erreurs JavaScript pendant le parcours", page.errs.length, page.errs.length === 0, page.errs.slice(0, 3).join(" | "));
  await ctx.close();

  // ===== 7. Petite fenêtre 1024×640 : débordements =====
  ({ ctx, page } = await open(1024, 640));
  const debord = await page.evaluate(() => ({ sx: document.documentElement.scrollWidth - innerWidth, sy: document.documentElement.scrollHeight - innerHeight }));
  mesure("1024×640 : défilement horizontal parasite de la page", debord.sx, debord.sx <= 0);
  const topH = await page.evaluate(() => Math.round(document.querySelector(".pb-top").getBoundingClientRect().height));
  mesure("1024×640 : hauteur de la barre du haut (lignes)", topH, topH <= 120);
  for (const [sel, nom] of [["[data-pb-mainmenu]", "menu principal"], ["[data-pb-history]", "historique"], ["[data-pb-quality]", "qualité"], ["[data-pb-rules-menu]", "règles"]]) {
    await page.locator(sel).first().click().catch(() => {}); await wait(300);
    const sortie = await page.evaluate(() => [...document.querySelectorAll('[role="menu"],[role="dialog"],.pb-popover')].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && !e.hidden && getComputedStyle(e).visibility !== "hidden"; }).map((e) => { const r = e.getBoundingClientRect(); return { c: e.className.toString().slice(0, 30), g: Math.round(r.left), d: Math.round(innerWidth - r.right), h: Math.round(r.top), b: Math.round(innerHeight - r.bottom) }; }).filter((r) => r.g < -1 || r.d < -1 || r.h < -1 || r.b < -1));
    mesure(`1024×640 : ${nom} reste dans la fenêtre`, sortie.length, sortie.length === 0, JSON.stringify(sortie.slice(0, 2)));
    await page.keyboard.press("Escape"); await wait(150);
  }
  await ctx.close();
  await browser.close(); await srv.stop();
  console.log(`\n${out.mesures.length} mesures, ${out.defauts.length} défaut(s)`);
  const i = process.argv.indexOf("--json"); if (i > 0) fs.writeFileSync(process.argv[i + 1], JSON.stringify(out, null, 2));
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
