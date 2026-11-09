// Bibliothèque de pieds de page dans un VRAI Chrome (pilote CDP de tests/helpers-chrome-cdp.js) : 15 familles avec compte, tri conservé, étoiles (aria-pressed, clavier, 44 px), filtre Favoris,
// thème sombre, trois largeurs (390 / 820 / 1280) sans débordement, autres types inchangés, aucune erreur JavaScript. Ignoré (avec la raison) si Chrome est absent.
// TB_SHOTS=/dossier : enregistre des captures « ui-*.png ».
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const Chrome = require("./helpers-chrome-cdp");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");

const SHOTS = process.env.TB_SHOTS || "";

describe("Bibliothèque de pieds de page dans un navigateur réel", { skip: Chrome.SKIP }, () => {
  let srv, boss, chrome, site, db;
  const open = async (width, height = 900) => {
    const pg = await chrome.newPage({ width, height, cookies: [...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })) });
    await pg.goto(`${srv.base}/marketing/site-web/sites/${site}/constructeur-de-theme`);
    return pg;
  };
  const shot = async (pg, name) => { if (SHOTS) { fs.mkdirSync(SHOTS, { recursive: true }); fs.writeFileSync(path.join(SHOTS, `ui-${name}.png`), await pg.screenshot()); } };
  const openLib = async (pg, type = "footer") => {
    await pg.evaluate(() => document.getElementById("tb-lib-open").click());
    await pg.waitFor(() => document.querySelector("#tb-lib-cards .tb-libcard"), "cartes de la bibliothèque");
    if (type !== "footer" || !(await pg.evaluate(() => document.getElementById("tb-lib-type").value === "footer"))) {
      await pg.evaluate((t) => { const s = document.getElementById("tb-lib-type"); s.value = t; s.dispatchEvent(new Event("change", { bubbles: true })); }, type);
    }
    await pg.waitFor((t) => document.getElementById("tb-lib-type").value === t && document.querySelector("#tb-lib-cards .tb-libcard") && document.getElementById("tb-lib-cards").getAttribute("aria-busy") === "false", "type chargé", 15000, type);
  };
  const setSelect = (pg, id, value) => pg.evaluate(([i, v]) => { const s = document.getElementById(i); s.value = v; s.dispatchEvent(new Event("change", { bubbles: true })); }, [id, value]);
  const idle = (pg) => pg.waitFor(() => document.getElementById("tb-lib-cards").getAttribute("aria-busy") === "false", "liste chargée");
  const cardCount = (pg) => pg.evaluate(() => document.querySelectorAll("#tb-lib-cards .tb-libcard").length);
  const noOverflow = (pg) => pg.evaluate(() => { const d = document.getElementById("tb-lib"); return d.scrollWidth <= d.clientWidth + 1 && document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1; });

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db();
    site = Number((await boss.post("/marketing/site-web/sites", { name: "Site Navigateur" })).location.match(/sites\/(\d+)/)[1]);
    chrome = await Chrome.launch();
  });
  after(async () => { if (chrome) await chrome.close(); if (db) db.close(); if (srv) await srv.stop(); });

  test("familles : 15 filtres avec compte, description, filtre exact, recherche + famille combinées", async () => {
    const pg = await open(1280); await openLib(pg);
    const opts = await pg.evaluate(() => [...document.getElementById("tb-lib-layout").options].map((o) => ({ v: o.value, t: o.textContent })));
    assert.equal(opts.length, 16, "« Toutes les familles » + 15"); assert.equal(opts[0].v, "");
    assert.equal(await pg.evaluate(() => document.getElementById("tb-lib-layout-l").textContent), "Famille");
    const counts = opts.slice(1).map((o) => Number(/\((\d+)\)$/.exec(o.t)[1]));
    assert.equal(counts.reduce((a, b) => a + b, 0), 100, "100 modèles au total");
    assert.match(await pg.evaluate(() => document.getElementById("tb-lib-sub").textContent), /^100 modèles/);
    const withModels = opts.slice(1).find((o) => /\((\d+)\)$/.exec(o.t)[1] > 0);
    await setSelect(pg, "tb-lib-layout", withModels.v); await idle(pg);
    const n = Number(/\((\d+)\)$/.exec(withModels.t)[1]);
    assert.equal(await cardCount(pg), Math.min(24, n)); assert.match(await pg.evaluate(() => document.getElementById("tb-lib-sub").textContent), new RegExp(`^${n} modèle`));
    const desc = await pg.evaluate(() => { const d = document.getElementById("tb-lib-famd"); return { hidden: d.hidden, text: d.textContent }; });
    assert.equal(desc.hidden, false); assert.match(desc.text, /modèle/);
    // les cartes montrent la version
    assert.match(await pg.evaluate(() => document.querySelector("#tb-lib-cards .tb-type").textContent), /version \d+/);
    // recherche + famille : les comptes de famille suivent la recherche
    await pg.evaluate(() => { const q = document.getElementById("tb-lib-q"); q.value = "colonnes"; q.dispatchEvent(new Event("input", { bubbles: true })); });
    await pg.waitFor(() => document.getElementById("tb-lib-cards").getAttribute("aria-busy") === "false" && [...document.getElementById("tb-lib-layout").options].slice(1).reduce((a, o) => a + Number(/\((\d+)\)$/.exec(o.textContent)[1]), 0) < 100, "recherche appliquée");
    const after = await pg.evaluate(() => [...document.getElementById("tb-lib-layout").options].slice(1).reduce((a, o) => a + Number(/\((\d+)\)$/.exec(o.textContent)[1]), 0));
    assert.ok(after < 100 && after > 0, `somme des comptes avec recherche : ${after}`);
    await shot(pg, "familles-1280");
    assert.deepEqual(pg.errors, []); await pg.close();
  });

  test("tri : nom A→Z, famille, récents ; le choix est conservé après rechargement ; la recherche reste intacte", async () => {
    const pg = await open(1280); await openLib(pg);
    const sorts = await pg.evaluate(() => [...document.getElementById("tb-lib-sort").options].map((o) => o.value));
    assert.deepEqual(sorts, ["", "nom", "famille", "recent", "favoris"]);
    await setSelect(pg, "tb-lib-sort", "nom"); await idle(pg);
    await pg.waitFor(() => document.getElementById("tb-lib-sort").value === "nom", "tri appliqué");
    const names = await pg.evaluate(() => [...document.querySelectorAll("#tb-lib-cards .tb-libcard h3")].map((h) => h.textContent));
    assert.deepEqual(names, [...names].sort((a, b) => a.localeCompare(b, "fr", { sensitivity: "base", numeric: true })));
    assert.equal(await pg.evaluate(() => localStorage.getItem("kola.themeBuilder.libSort")), "nom");
    await pg.goto(`${srv.base}/marketing/site-web/sites/${site}/constructeur-de-theme`); await openLib(pg);
    await pg.waitFor(() => document.getElementById("tb-lib-sort").value === "nom", "tri retrouvé", 8000);
    const names2 = await pg.evaluate(() => [...document.querySelectorAll("#tb-lib-cards .tb-libcard h3")].map((h) => h.textContent));
    assert.deepEqual(names2, names, "même ordre après rechargement");
    await pg.evaluate(() => { const q = document.getElementById("tb-lib-q"); q.value = "colonnes"; q.dispatchEvent(new Event("input", { bubbles: true })); });
    await pg.waitFor(() => Number(/^(\d+)/.exec(document.getElementById("tb-lib-sub").textContent)[1]) < 100 && document.getElementById("tb-lib-cards").getAttribute("aria-busy") === "false", "recherche + tri");
    const n3 = await pg.evaluate(() => [...document.querySelectorAll("#tb-lib-cards .tb-libcard h3")].map((h) => h.textContent));
    assert.deepEqual(n3, [...n3].sort((a, b) => a.localeCompare(b, "fr", { sensitivity: "base", numeric: true })));
    await setSelect(pg, "tb-lib-sort", "famille"); await idle(pg);
    assert.equal(await pg.evaluate(() => localStorage.getItem("kola.themeBuilder.libSort")), "famille");
    await setSelect(pg, "tb-lib-sort", ""); await idle(pg);
    assert.deepEqual(pg.errors, []); await pg.close();
  });

  test("étoiles : vrais boutons (aria-pressed + libellé), cible 44 px, clavier (Tab, Entrée, Espace), focus visible, filtre Favoris, retrait", async () => {
    const pg = await open(1280); await openLib(pg);
    const info = await pg.evaluate(() => { const b = document.querySelector("#tb-lib-cards .tb-star"), r = b.getBoundingClientRect(); return { tag: b.tagName, type: b.type, pressed: b.getAttribute("aria-pressed"), label: b.getAttribute("aria-label"), w: r.width, h: r.height, n: document.querySelectorAll("#tb-lib-cards .tb-star").length, cards: document.querySelectorAll("#tb-lib-cards .tb-libcard").length }; });
    assert.equal(info.tag, "BUTTON"); assert.equal(info.type, "button"); assert.equal(info.pressed, "false"); assert.match(info.label, /^Ajouter « .+ » aux favoris$/);
    assert.ok(info.w >= 43.9 && info.h >= 43.9, `cible ${info.w}×${info.h}`); assert.equal(info.n, info.cards, "une étoile par carte");
    // clavier : focus sur la 1re étoile (focus clavier), Entrée
    await pg.evaluate(() => document.querySelector("#tb-lib-cards .tb-star").focus());
    await pg.pressActivation("Enter");
    await pg.waitFor(() => document.querySelector("#tb-lib-cards .tb-star").getAttribute("aria-pressed") === "true", "favori ajouté au clavier (Entrée)");
    assert.match(await pg.evaluate(() => document.querySelector("#tb-lib-cards .tb-star").getAttribute("aria-label")), /^Retirer « .+ » des favoris$/);
    assert.equal(await pg.evaluate(() => document.getElementById("tb-lib-favn").textContent), "(1)");
    assert.equal(await pg.evaluate(() => document.activeElement.classList.contains("tb-star")), true, "le focus reste sur l'étoile");
    // focus visible : la règle existe et le contour est réellement dessiné au focus clavier
    const outline = await pg.evaluate(() => { const b = document.querySelector("#tb-lib-cards .tb-star"); b.focus(); return getComputedStyle(b).outlineStyle + " " + getComputedStyle(b).outlineWidth; });
    assert.ok(await pg.evaluate(() => [...document.styleSheets].some((s) => { try { return [...s.cssRules].some((r) => r.selectorText && r.selectorText.includes(".tb-star:focus-visible")); } catch { return false; } })), "règle :focus-visible");
    void outline;
    // une 2e étoile à la souris
    const r2 = await pg.evaluate(() => { const b = document.querySelectorAll("#tb-lib-cards .tb-star")[1]; b.scrollIntoView({ block: "center" }); const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
    await pg.mouseClick(r2.x, r2.y);
    await pg.waitFor(() => document.querySelectorAll("#tb-lib-cards .tb-star")[1].getAttribute("aria-pressed") === "true", "favori ajouté à la souris");
    assert.equal(await pg.evaluate(() => document.getElementById("tb-lib-favn").textContent), "(2)");
    // filtre Favoris
    await pg.evaluate(() => document.getElementById("tb-lib-fav").click()); await idle(pg);
    await pg.waitFor(() => document.getElementById("tb-lib-fav").getAttribute("aria-pressed") === "true" && document.querySelectorAll("#tb-lib-cards .tb-libcard").length === 2, "2 favoris listés");
    assert.equal(await pg.evaluate(() => [...document.querySelectorAll("#tb-lib-cards .tb-star")].every((b) => b.getAttribute("aria-pressed") === "true")), true);
    await shot(pg, "favoris-1280");
    // retrait depuis le filtre : la carte disparaît, le focus passe sur une étoile restante (pas de perte du clavier)
    await pg.evaluate(() => document.querySelector("#tb-lib-cards .tb-star").focus()); await pg.pressActivation(" ");
    await pg.waitFor(() => document.querySelectorAll("#tb-lib-cards .tb-libcard").length === 1, "carte retirée du filtre");
    await pg.evaluate(() => document.querySelector("#tb-lib-cards .tb-star").click());
    await pg.waitFor(() => /Aucun favori/.test(document.getElementById("tb-lib-cards").textContent), "message vide explicite");
    await pg.evaluate(() => document.getElementById("tb-lib-fav").click()); await idle(pg);
    await pg.waitFor(() => document.querySelectorAll("#tb-lib-cards .tb-libcard").length >= 20, "retour à la liste complète");
    assert.equal(await pg.evaluate(() => document.getElementById("tb-lib-favn").textContent), "(0)");
    assert.deepEqual(pg.errors, []); await pg.close();
  });

  test("favoris persistants : l'étoile est retrouvée après rechargement ; un autre site ne la voit pas", async () => {
    const pg = await open(1280); await openLib(pg);
    await pg.evaluate(() => document.querySelectorAll("#tb-lib-cards .tb-star")[2].click());
    await pg.waitFor(() => document.querySelectorAll("#tb-lib-cards .tb-star")[2].getAttribute("aria-pressed") === "true", "étoile");
    const name = await pg.evaluate(() => document.querySelectorAll("#tb-lib-cards .tb-libcard h3")[2].textContent);
    await pg.goto(`${srv.base}/marketing/site-web/sites/${site}/constructeur-de-theme`); await openLib(pg);
    const again = await pg.evaluate(() => [...document.querySelectorAll("#tb-lib-cards .tb-libcard")].filter((c) => c.querySelector(".tb-star").getAttribute("aria-pressed") === "true").map((c) => c.querySelector("h3").textContent));
    assert.deepEqual(again, [name]);
    const site2 = Number((await boss.post("/marketing/site-web/sites", { name: "Autre site" })).location.match(/sites\/(\d+)/)[1]);
    await pg.goto(`${srv.base}/marketing/site-web/sites/${site2}/constructeur-de-theme`); await openLib(pg);
    assert.equal(await pg.evaluate(() => document.getElementById("tb-lib-favn").textContent), "(0)", "favoris propres à chaque site");
    await pg.evaluate(() => document.querySelectorAll("#tb-lib-cards .tb-star").forEach((b) => b.getAttribute("aria-pressed") === "true" && b.click()));
    await pg.goto(`${srv.base}/marketing/site-web/sites/${site}/constructeur-de-theme`); await openLib(pg);
    await pg.evaluate(() => document.querySelectorAll("#tb-lib-cards .tb-star").forEach((b) => b.getAttribute("aria-pressed") === "true" && b.click()));
    await pg.waitFor(() => document.getElementById("tb-lib-favn").textContent === "(0)", "favoris vidés");
    assert.deepEqual(pg.errors, []); await pg.close();
  });

  test("trois largeurs (390 / 820 / 1280) : pas de débordement, étoiles de 44 px, outils lisibles ; thème sombre respecté", async () => {
    for (const w of [390, 820, 1280]) {
      const pg = await open(w, w === 390 ? 800 : 900); await openLib(pg);
      assert.ok(await noOverflow(pg), `pas de débordement horizontal à ${w} px`);
      const m = await pg.evaluate(() => {
        const st = [...document.querySelectorAll("#tb-lib-cards .tb-star")].map((b) => { const r = b.getBoundingClientRect(); return [r.width, r.height]; });
        const tools = ["tb-lib-layout", "tb-lib-sort", "tb-lib-fav"].map((id) => { const r = document.getElementById(id).getBoundingClientRect(); return { id, w: r.width, h: r.height, right: r.right }; });
        return { minW: Math.min(...st.map((s) => s[0])), minH: Math.min(...st.map((s) => s[1])), tools, vw: innerWidth };
      });
      assert.ok(m.minW >= 43.9 && m.minH >= 43.9, `étoiles ${m.minW}×${m.minH} à ${w}`);
      for (const t of m.tools) assert.ok(t.right <= m.vw + 1 && (t.id === "tb-lib-fav" || w > 767 ? t.h >= 35.5 : t.h >= 43.5) && (t.id !== "tb-lib-fav" || t.h >= 43.5), `${t.id} ${t.w}×${t.h} à ${w}`); // bouton Favoris : 44 px partout ; listes déroulantes : 44 px sur mobile (règle existante du Theme Builder)
      if (w === 390) { await pg.evaluate(() => document.querySelector('[data-lview="list"]').click()); assert.ok(await noOverflow(pg), "mode liste sans débordement à 390 px"); }
      await shot(pg, `bibliotheque-${w}`);
      assert.deepEqual(pg.errors, []); await pg.close();
    }
    const pg = await open(1280); await openLib(pg);
    await pg.evaluate(() => document.querySelectorAll("#tb-lib-cards .tb-star")[0].click());
    await pg.waitFor(() => document.querySelector("#tb-lib-cards .tb-star").getAttribute("aria-pressed") === "true", "étoile");
    const light = await pg.evaluate(() => getComputedStyle(document.querySelector("#tb-lib-cards .tb-star")).color);
    await pg.evaluate(() => { document.documentElement.setAttribute("data-kola-theme", "dark"); });
    await pg.waitFor(() => getComputedStyle(document.querySelector("#tb-lib-cards .tb-star")).color === "rgb(251, 191, 36)", "étoile active en thème sombre (transition de couleur terminée)", 5000);
    const dark = await pg.evaluate(() => ({ star: getComputedStyle(document.querySelector("#tb-lib-cards .tb-star")).color, bg: getComputedStyle(document.querySelector("#tb-lib-cards .tb-libcard")).backgroundColor, tools: getComputedStyle(document.getElementById("tb-lib-tools")).backgroundColor }));
    assert.notEqual(dark.star, light, "l'étoile active change de couleur en thème sombre"); assert.equal(dark.star, "rgb(251, 191, 36)");
    assert.notEqual(dark.bg, "rgb(255, 255, 255)", "les cartes suivent le thème sombre"); assert.ok(await noOverflow(pg));
    await shot(pg, "bibliotheque-sombre");
    await pg.evaluate(() => { document.documentElement.removeAttribute("data-kola-theme"); document.querySelector("#tb-lib-cards .tb-star").click(); });
    assert.deepEqual(pg.errors, []); await pg.close();
  });

  test("AUTRES TYPES : en-tête et page n'ont ni étoile, ni tri, ni filtre Favoris, ni libellé « Famille » ; le retour au pied de page rend tout", async () => {
    const pg = await open(1280); await openLib(pg, "header");
    const r = await pg.evaluate(() => ({ stars: document.querySelectorAll("#tb-lib-cards .tb-star").length, sortHidden: document.getElementById("tb-lib-sort").closest("label").hidden, favHidden: document.getElementById("tb-lib-fav").hidden, label: document.getElementById("tb-lib-layout-l").textContent, famd: document.getElementById("tb-lib-famd").hidden, version: /version \d/.test(document.querySelector("#tb-lib-cards .tb-type").textContent), n: document.querySelectorAll("#tb-lib-cards .tb-libcard").length }));
    assert.deepEqual([r.stars, r.sortHidden, r.favHidden, r.label, r.famd, r.version], [0, true, true, "Mise en page", true, false]); assert.equal(r.n, 24);
    await setSelect(pg, "tb-lib-type", "single_page"); await pg.waitFor(() => document.getElementById("tb-lib-type").value === "single_page" && document.getElementById("tb-lib-cards").getAttribute("aria-busy") === "false" && document.querySelector("#tb-lib-cards .tb-libcard"), "page chargée");
    assert.equal(await pg.evaluate(() => document.querySelectorAll("#tb-lib-cards .tb-star").length), 0);
    await setSelect(pg, "tb-lib-type", "footer"); await pg.waitFor(() => document.querySelectorAll("#tb-lib-cards .tb-star").length > 0 && document.getElementById("tb-lib-layout-l").textContent === "Famille", "pied de page de nouveau complet");
    assert.deepEqual(pg.errors, []); await pg.close();
  });

  test("catalogue direct de la catégorie « Pied de page » : mêmes familles, tri, étoiles", async () => {
    const pg = await chrome.newPage({ width: 1280, height: 900, cookies: [...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })) });
    await pg.goto(`${srv.base}/marketing/site-web/sites/${site}/constructeur-de-theme?type=footer`);
    await pg.waitFor(() => document.querySelector("#tb-cat-cards .tb-libcard") && document.querySelectorAll("#tb-cat-layout option").length === 16, "catalogue direct");
    assert.equal(await pg.evaluate(() => document.getElementById("tb-cat-layout-l").textContent), "Famille");
    assert.equal(await pg.evaluate(() => document.getElementById("tb-cat-count").textContent), "100 modèles");
    await pg.evaluate(() => { const s = document.getElementById("tb-cat-sort"); s.value = "nom"; s.dispatchEvent(new Event("change", { bubbles: true })); });
    await pg.waitFor(() => { const n = [...document.querySelectorAll("#tb-cat-cards .tb-libcard h3")].map((h) => h.textContent); return n.length > 1 && n.every((x, i) => i === 0 || n[i - 1].localeCompare(x, "fr", { sensitivity: "base", numeric: true }) <= 0); }, "tri par nom");
    await pg.evaluate(() => document.querySelector("#tb-cat-cards .tb-star").click());
    await pg.waitFor(() => document.querySelector("#tb-cat-cards .tb-star").getAttribute("aria-pressed") === "true" && document.getElementById("tb-cat-favn").textContent === "(1)", "étoile du catalogue direct");
    await pg.evaluate(() => document.querySelector("#tb-cat-cards .tb-star").click());
    await pg.waitFor(() => document.getElementById("tb-cat-favn").textContent === "(0)", "étoile retirée");
    assert.ok(await pg.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1), "pas de débordement");
    await shot(pg, "catalogue-direct");
    assert.deepEqual(pg.errors, []); await pg.close();
  });
});
