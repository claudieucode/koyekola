// PIEDS v2 DANS UN VRAI CHROME (vrai serveur, page publiée réelle, pilote CDP de helpers-chrome-cdp.js). Pour chaque modèle v2 déjà écrit (FOOTER_V2_APERCU activé ici ET pour le serveur) :
//  · page publiée en 200, un seul <footer data-kw-ft="solo"> enfant du <body>, après </main>, de la largeur de la fenêtre (390, 820, 1280, 1920 px), aucun défilement horizontal ;
//  · polices du modèle réellement CHARGÉES (document.fonts) sur la page publique, avec et sans formulaire d'abonnement publié ;
//  · accessibilité : contour de focus visible (≥ 2 px) sur chaque lien, bouton et champ ; cibles tactiles ≥ 44 px à 390 px ; « mouvement réduit » : aucune transition ni animation ;
//  · survol : un lien dont le modèle déclare un état de survol change réellement d'aspect (couleur, position ou soulignement).
// FOOTER_V2_ONLY=ft2-017-phrase-de-lancement,… pour cibler. Ignoré (avec la raison) si Chrome est absent.
process.env.FOOTER_V2_APERCU = "1";
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const Chrome = require("./helpers-chrome-cdp");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");
const H = require("./helpers-footer-isolation");
const Catalog = require("../src/themeBuilder/catalog");

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const ONLY = process.env.FOOTER_V2_ONLY ? process.env.FOOTER_V2_ONLY.split(",") : null;
const KEYS = Catalog.entries("footer").filter((e) => e.v2 && (!ONLY || ONLY.includes(e.key))).map((e) => e.key);

describe("Pieds v2 : vrai Chrome, page publiée", { skip: Chrome.SKIP || (KEYS.length ? false : "aucun modèle v2 écrit") }, () => {
  let srv, boss, db, chrome, A, cookie;
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "", ALLOW_INDEXING: "1" });
    boss = await loginInstructor(srv); db = srv.db();
    A = await H.makeSite(srv, boss, "Site pieds v2");
    require("../src/marketing/pages/business").save(db, db.prepare("SELECT organization_id AS o FROM mk_sites WHERE id = ?").get(A.S).o, A.S, { legalName: "Atelier Soleil SARL", legalPages: { notice: "/mentions-legales", privacy: "/confidentialite" } });
    cookie = [...boss.cookies].map(([n, value]) => ({ name: n, value, url: srv.base }));
    for (let i = 0; i < 4 && !chrome; i++) { try { chrome = await Chrome.launch(); } catch (e) { if (i === 3) throw e; await wait(3000); } }
  });
  after(async () => { if (chrome) await chrome.close(); if (db) db.close(); if (srv) await srv.stop(); });

  const info = (pg) => pg.evaluate(() => {
    const f = document.querySelector("footer"), main = document.querySelector("main");
    const fams = new Set(), faces = new Map(); for (const e of f.querySelectorAll("*")) { const cs = getComputedStyle(e), ff = cs.fontFamily.split(",")[0].replace(/["']/g, "").trim(); if (ff && e.getClientRects().length && ![...e.childNodes].every((n) => n.nodeType !== 3 || !n.textContent.trim())) { fams.add(ff); faces.set(`${cs.fontStyle} ${cs.fontWeight} 16px "${ff}"`, ff); } }
    // on teste la graisse et le style réellement employés (un modèle peut n'utiliser une police qu'en 700 italique)
    const notLoaded = [...new Set([...faces].filter(([d, n]) => !/^(sans-serif|serif|monospace|system-ui)$/.test(n) && !document.fonts.check(d)).map(([, n]) => n))];
    const fl = [...document.fonts].filter((x) => x.status === "loaded").map((x) => x.family.replace(/["']/g, ""));
    return { count: document.querySelectorAll("footer").length, solo: f.getAttribute("data-kw-ft"), parentBody: f.parentElement === document.body, afterMain: Boolean(main.compareDocumentPosition(f) & Node.DOCUMENT_POSITION_FOLLOWING), w: f.getBoundingClientRect().width, vw: document.documentElement.clientWidth, sw: document.documentElement.scrollWidth, fams: [...fams], notLoaded, loadedFaces: fl };
  });

  for (const key of KEYS) {
    test(`${key} : page publiée 200, pied solo après </main>, pleine largeur, 0 défilement horizontal, polices propres chargées (390 / 820 / 1280 / 1920 ; avec et sans formulaire publié)`, async () => {
      const tpl = await A.footer(key, "solo");
      const probs = [];
      for (const avecForm of [false, true]) {
        if (avecForm) {
          const forms = require("../src/marketing/forms"), org = db.prepare("SELECT organization_id AS o FROM mk_sites WHERE id = ?").get(A.S).o;
          const ctx = { db, organizationId: org, userId: 7, settings: {}, tokenKey: TEST_KEY, baseUrl: "https://k.test", now: () => Date.now(), log: () => {} };
          const f = forms.createForm(ctx, { name: "Lettre", fields: [], consentText: "J'accepte de recevoir la lettre.", siteId: A.S }); forms.setStatus(ctx, f.id, "published");
        }
        const res = await fetch(A.url, { headers: { "User-Agent": "Mozilla/5.0 Chrome/120 Safari/537.36" } });
        if (res.status !== 200) probs.push(`HTTP ${res.status}`);
        for (const w of [390, 820, 1280, 1920]) {
          const pg = await chrome.newPage({ width: w, height: 900, cookies: [] });
          await pg.goto(A.url); await wait(700);
          const i = await info(pg);
          const t = `${avecForm ? "avec" : "sans"} formulaire ${w}px`;
          if (i.count !== 1 || i.solo !== "solo" || !i.parentBody || !i.afterMain) probs.push(`${t} : structure ${JSON.stringify({ c: i.count, s: i.solo, b: i.parentBody, a: i.afterMain })}`);
          if (Math.abs(i.w - i.vw) > 1) probs.push(`${t} : pied ${i.w} px pour une fenêtre de ${i.vw}`);
          if (i.sw > i.vw + 1) probs.push(`${t} : défilement horizontal ${i.sw} > ${i.vw}`);
          if (i.notLoaded.length) probs.push(`${t} : police(s) non chargée(s) ${i.notLoaded.join(", ")}`);
          if (pg.errors.length) probs.push(`${t} : erreur JavaScript ${pg.errors[0].slice(0, 100)}`);
          await pg.close();
        }
      }
      await A.unpublish(tpl);
      db.prepare("DELETE FROM mk_forms WHERE site_id = ?").run(A.S);
      assert.deepEqual(probs, [], probs.join("\n"));
    });

    test(`${key} : focus visible sur chaque élément interactif, cibles ≥ 44 px à 390 px, survol qui change l'aspect, mouvement réduit sans animation`, async () => {
      const tpl = await A.footer(key, "solo");
      const probs = [];
      const pg = await chrome.newPage({ width: 390, height: 900, cookies: [] });
      await pg.goto(A.url); await wait(700);
      // focus : on parcourt la page au clavier (vraie touche Tab), chaque élément interactif du pied doit afficher un contour visible
      const n = await pg.evaluate(() => [...document.querySelectorAll("footer a[href], footer button, footer input:not([type=hidden]), footer summary")].filter((e) => e.getClientRects().length).length);
      await pg.evaluate("document.activeElement && document.activeElement.blur(); window.scrollTo(0,0); document.body.focus()");
      const faibles = []; const vus = new Set();
      for (let i = 0; i < n + 40 && vus.size < n; i++) {
        await pg.key("Tab");
        const r = await pg.evaluate(() => { const e = document.activeElement; if (!e || !e.closest("footer")) return null; const c = getComputedStyle(e); return { id: e.tagName + ":" + (e.textContent || e.name || "").trim().slice(0, 18) + ":" + Math.round(e.getBoundingClientRect().top + scrollY), ow: parseFloat(c.outlineWidth) || 0, os: c.outlineStyle, oc: c.outlineColor, bs: c.boxShadow, hp: e.name === "website" }; });
        if (r && !vus.has(r.id)) { vus.add(r.id); if (!r.hp && !(r.os !== "none" && r.ow >= 2) && r.bs === "none") faibles.push(`${r.id} (contour ${r.os} ${r.ow}px)`); }
      }
      console.log(`[v2-navigateur] ${key} : ${vus.size}/${n} éléments atteints au clavier, ${faibles.length} sans contour visible`);
      if (vus.size < Math.max(1, n - 3)) probs.push(`parcours clavier : ${vus.size} éléments atteints sur ${n}`);
      if (faibles.length) probs.push(`focus peu ou pas visible : ${faibles.slice(0, 5).join(", ")}`);
      // cibles tactiles à 390 px
      const petites = await pg.evaluate(() => [...document.querySelectorAll("footer a[href], footer button, footer summary")].filter((e) => e.getClientRects().length && getComputedStyle(e).visibility !== "hidden").map((e) => { const r = e.getBoundingClientRect(); return { enPhrase: e.tagName === "A" && getComputedStyle(e).display === "inline" && e.parentElement && (e.parentElement.textContent || "").trim().length > (e.textContent || "").trim().length + 12, html: (() => { const c = getComputedStyle(e); return [c.display, c.minHeight, c.paddingTop, c.lineHeight, c.fontSize, c.boxSizing, e.getBoundingClientRect().height].join("/"); })(), t: (e.textContent || "").trim().slice(0, 16), w: Math.round(r.width), h: Math.round(r.height), txt: (e.textContent || "").trim().length > 0 && e.tagName === "A" }; }).filter((x) => !x.enPhrase).filter((x) => (x.txt ? x.h < 43.5 : x.h < 43.5 || x.w < 43.5)));
      if (petites.length) probs.push(`cibles < 44 px : ${petites.slice(0, 5).map((x) => `${x.t} ${x.w}×${x.h} ${process.env.DBGH ? x.html : ""}`).join(", ")}`);
      await pg.close();
      // survol (souris réelle à 1280 px) : le premier lien à état de survol change d'aspect
      const pc = await chrome.newPage({ width: 1280, height: 900, cookies: [] });
      await pc.goto(A.url); await wait(700);
      // un lien « change d'aspect » si l'une de ces propriétés (lien ou premier enfant) varie ; on essaie les 8 premiers liens visibles
      const SIG = (l) => { const f = (e) => { const c = getComputedStyle(e); return [c.color, c.textDecorationLine, c.textDecorationColor, c.textDecorationThickness, c.textUnderlineOffset, c.backgroundColor, c.transform, c.borderTopColor, c.borderBottomColor, c.opacity, c.boxShadow, c.letterSpacing, c.paddingLeft, c.filter, c.backgroundSize, c.backgroundPositionX].join("|"); }; return f(l) + "#" + (l.firstElementChild ? f(l.firstElementChild) : ""); };
      const cibles = await pc.evaluate((sigSrc) => { const SIG = eval(sigSrc); return [...document.querySelectorAll("footer a[href]")].filter((e) => e.getClientRects().length && e.textContent.trim()).slice(0, 8).map((l, i) => { l.scrollIntoView({ block: "center" }); const r = l.getBoundingClientRect(); return { i, x: r.left + r.width / 2, y: r.top + r.height / 2, avant: SIG(l) }; }); }, SIG.toString());
      let survolOk = !cibles.length;
      for (const cible of cibles) {
        await pc.evaluate((i) => { const l = [...document.querySelectorAll("footer a[href]")].filter((e) => e.getClientRects().length && e.textContent.trim())[i]; l.scrollIntoView({ block: "center" }); }, cible.i);
        const pos = await pc.evaluate((i) => { const l = [...document.querySelectorAll("footer a[href]")].filter((e) => e.getClientRects().length && e.textContent.trim())[i]; const r = l.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }, cible.i);
        await pc.mouseMove(pos.x, pos.y); await wait(450);
        const apres = await pc.evaluate((p) => { const SIG = eval(p.sigSrc); const e = document.elementFromPoint(p.x, p.y); const l = e && e.closest("a"); return l ? SIG(l) : null; }, { x: pos.x, y: pos.y, sigSrc: SIG.toString() });
        if (apres && apres !== cible.avant) { survolOk = true; break; }
      }
      if (!survolOk) probs.push("survol : aucun changement visible sur les 8 premiers liens");      // mouvement réduit : plus aucune transition ni animation dans le pied
      await pc.emulateMedia([{ name: "prefers-reduced-motion", value: "reduce" }]); await pc.goto(A.url); await wait(500);
      const animes = await pc.evaluate(() => [...document.querySelectorAll("footer, footer *")].filter((e) => { const c = getComputedStyle(e); return [...c.transitionDuration.split(","), ...c.animationDuration.split(",")].some((d) => parseFloat(d) > 0.05 * (d.includes("ms") ? 1000 : 1)); }).length);
      if (animes) probs.push(`mouvement réduit : ${animes} éléments encore animés`);
      await pc.close();
      await A.unpublish(tpl);
      assert.deepEqual(probs, [], probs.join("\n"));
    });
  }
});
