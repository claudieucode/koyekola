// Inspecteur d'un conteneur dans l'éditeur RÉEL : le vrai serveur, le vrai script de l'éditeur (public/js/page-builder.js) chargé
// dans un navigateur simulé (jsdom), et des clics comme ceux d'une personne (calques, canevas, onglets, champs, annuler / rétablir,
// rechargement). Chaque valeur est relue côté serveur : rien n'est « visuel seulement ».
// Limites : jsdom ne calcule aucune mise en page (aucune mesure en pixels) et ne charge pas les cadres intégrés (srcdoc) : le banc
// d'essai les remplace par l'écriture du même HTML dans le cadre. Ce n'est pas un vrai navigateur (pas de capture d'écran).
// Lancer : npm install --no-save jsdom  puis  node --test tests/inspecteur-navigateur.test.js
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");

let JSDOM = null;
try { ({ JSDOM } = require("jsdom")); } catch { /* jsdom absent : les tests sont ignorés avec un message clair */ }
const SKIP = JSDOM ? false : "TEST NON EXÉCUTABLE — jsdom n'est pas installé (npm install --no-save jsdom)";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function until(fn, ms = 8000, label = "condition") {
  const end = Date.now() + ms;
  for (;;) {
    let v; try { v = await fn(); } catch { v = false; }
    if (v) return v;
    if (Date.now() > end) throw new Error(`Délai dépassé : ${label}`);
    await sleep(80);
  }
}

describe("inspecteur d'un conteneur dans l'éditeur réel (navigateur simulé)", { skip: SKIP }, () => {
  let srv, boss, db, cookie;
  const errors = []; // erreurs de script ou de console de TOUS les éditeurs ouverts
  const editors = [];

  const content = () => ({ sections: [{ id: "sect00000001", type: "layout", children: [
    { id: "box000000001", type: "container", props: { tag: "section" }, children: [
      { id: "box000000002", type: "container", props: {}, children: [{ id: "hed000000001", type: "heading", props: { text: "Titre A", level: "2" } }] },
      { id: "box000000003", type: "container", props: {}, children: [{ id: "hed000000002", type: "heading", props: { text: "Titre B", level: "2" } }] },
    ] },
    { id: "box000000004", type: "container", props: {}, children: [{ id: "btn000000001", type: "button", props: { label: "Acheter", url: "/catalogue" } }] },
    { id: "grd000000001", type: "grid", props: {}, children: [{ id: "hed000000003", type: "heading", props: { text: "Case", level: "3" } }] },
  ] }] });

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db();
    cookie = [...boss.cookies].map(([k, v]) => `${k}=${v}`).join("; ");
  });
  after(async () => { editors.forEach((e) => { try { e.win.close(); } catch { /* déjà fermé */ } }); db && db.close(); srv && await srv.stop(); });

  async function newPage(name) {
    const id = Number((await boss.post("/marketing/pages", { name })).location.match(/(\d+)$/)[1]);
    const rev = db.prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(id).revision;
    assert.equal((await boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", json: { revision: rev, content: content() } })).status, 200);
    return id;
  }
  const bootOf = async (id) => JSON.parse((await boss.get(`/marketing/pages/${id}/editeur`)).text.match(/<script type="application\/json" id="pb-boot">([\s\S]*?)<\/script>/)[1]);
  const find = (nodes, id) => { for (const n of nodes || []) { if (n.id === id) return n; const f = find(n.children, id); if (f) return f; } return null; };
  // Le nœud tel que le SERVEUR l'a enregistré (relu dans l'éditeur rechargé)
  const serverNode = async (pageId, id) => find((await bootOf(pageId)).content.sections.flatMap((s) => s.children || []), id);

  async function openEditor(pageId) {
    const html = (await boss.get(`/marketing/pages/${pageId}/editeur`)).text;
    const dom = new JSDOM(html, {
      url: `${srv.base}/marketing/pages/${pageId}/editeur`, runScripts: "dangerously", resources: "usable", pretendToBeVisual: true,
      beforeParse(w) {
        w.fetch = (u, o = {}) => fetch(new URL(u, srv.base), { ...o, headers: { ...(o.headers || {}), cookie }, redirect: "manual" });
        w.Element.prototype.scrollIntoView = function () {};
        w.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} });
        w.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
        w.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} };
        w.addEventListener("error", (e) => errors.push(`script : ${e.message || e.error}`));
        const logError = w.console.error; w.console.error = (...a) => { const t = a.join(" "); if (!/Not implemented/.test(t)) errors.push(`console : ${t.slice(0, 200)}`); logError.apply(w.console, a); };
      },
    });
    const win = dom.window, doc = win.document;
    const frame = doc.querySelector("[data-pb-frame]");
    // jsdom ne charge pas srcdoc : on écrit le même HTML dans le cadre, puis on déclenche « load » comme le ferait le navigateur
    let last = "";
    const syncFrame = () => { const h = frame.getAttribute("srcdoc"); if (h && h !== last) { last = h; const fd = frame.contentDocument; fd.open(); fd.write(h); fd.close(); frame.dispatchEvent(new win.Event("load")); } };
    new win.MutationObserver(syncFrame).observe(frame, { attributes: true, attributeFilter: ["srcdoc"] });
    syncFrame();
    await until(() => frame.contentDocument.querySelector("[data-node-id]"), 10000, "canevas affiché");

    const ed = {
      win, doc, frame, pageId,
      get insp() { return doc.querySelector("[data-pb-inspector]"); },
      click(el) { assert.ok(el, "élément à cliquer introuvable"); el.dispatchEvent(new win.MouseEvent("click", { bubbles: true, cancelable: true })); },
      selectLayer(id) { ed.click(doc.querySelector(`li.pb-node[data-id="${id}"] > .pb-row-item`)); },
      selectCanvas(id) { ed.click(frame.contentDocument.querySelector(`[data-node-id="${id}"]`)); },
      canvasNode: (id) => frame.contentDocument.querySelector(`[data-node-id="${id}"]`),
      tabs: () => [...ed.insp.querySelectorAll("[role=tab]")].map((t) => t.textContent),
      tab(name) { ed.click([...ed.insp.querySelectorAll("[role=tab]")].find((t) => t.textContent === name)); },
      currentTab: () => (([...ed.insp.querySelectorAll("[role=tab]")].find((t) => t.getAttribute("aria-selected") === "true")) || {}).textContent,
      labels: () => [...ed.insp.querySelectorAll("label")].map((l) => l.textContent.trim()),
      ctl(label, exact = false) {
        const l = [...ed.insp.querySelectorAll("label")].find((x) => (exact ? x.textContent.trim() === label : x.textContent.trim().startsWith(label)));
        assert.ok(l, `champ « ${label} » introuvable (champs : ${ed.labels().join(" ; ")})`);
        return (l.htmlFor && doc.getElementById(l.htmlFor)) || l.querySelector("input,select,textarea");
      },
      prop(name) { const c = ed.insp.querySelector(`[data-prop="${name}"]`); assert.ok(c, `réglage « ${name} » introuvable`); return c.matches("input,select") ? c : c.querySelector("select,input.pb-len-num,input"); },
      set(el, value) {
        if (el.type === "checkbox") el.checked = Boolean(value); else el.value = value;
        el.dispatchEvent(new win.Event("input", { bubbles: true })); el.dispatchEvent(new win.Event("change", { bubbles: true }));
      },
      section(title) { const d = [...ed.insp.querySelectorAll("details")].find((x) => x.querySelector("summary .pb-acc-title").textContent === title); assert.ok(d, `section « ${title} » introuvable`); d.open = true; return d; },
      button(text) { const b = [...ed.insp.querySelectorAll("button")].find((x) => (x.textContent || x.getAttribute("aria-label") || "").trim() === text); assert.ok(b, `bouton « ${text} » introuvable`); return b; },
      device(label) { ed.click([...ed.insp.querySelectorAll("button, [role=radio]")].find((x) => (x.getAttribute("aria-label") || x.title || x.textContent).trim() === label)); },
      undo() { ed.click(doc.querySelector("[data-pb-undo]")); },
      redo() { ed.click(doc.querySelector("[data-pb-redo]")); },
      emptyState: () => /Aucun élément sélectionné/.test((ed.insp.querySelector("h2") || {}).textContent || ""),
    };
    editors.push(ed);
    return ed;
  }

  test("sélection : depuis le canevas ET depuis les calques, le même élément ouvre son inspecteur « Modifier Conteneur » avec ses propres valeurs", async () => {
    const id = await newPage("Banc — sélection");
    const ed = await openEditor(id);
    assert.ok(ed.emptyState(), "au départ : aucun élément sélectionné");
    ed.selectLayer("box000000002");
    assert.equal(ed.insp.dataset.for, "box000000002");
    assert.equal(ed.insp.querySelector(".pb-kind").textContent, "Modifier Conteneur");
    assert.deepEqual(ed.tabs(), ["Général", "Style", "Interactions"]);
    assert.equal(ed.currentTab(), "Général");
    ed.set(ed.ctl("Nom du calque"), "Carte B");
    // un autre conteneur : aucune donnée de l'ancien ne reste
    ed.selectLayer("box000000003");
    assert.equal(ed.insp.dataset.for, "box000000003");
    assert.equal(ed.ctl("Nom du calque").value, "");
    assert.doesNotMatch(ed.insp.querySelector("h2").textContent, /Carte B/);
    // canevas → inspecteur
    ed.selectCanvas("box000000002");
    assert.equal(ed.insp.dataset.for, "box000000002");
    assert.equal(ed.ctl("Nom du calque").value, "Carte B");
    assert.ok(ed.canvasNode("box000000002").classList.contains("is-selected"), "le canevas montre la sélection");
    // calques → canevas + calques
    ed.selectLayer("box000000003");
    assert.ok(ed.canvasNode("box000000003").classList.contains("is-selected"));
    assert.ok(!ed.canvasNode("box000000002").classList.contains("is-selected"));
    assert.equal(ed.doc.querySelector('li.pb-node[data-id="box000000003"]').getAttribute("aria-selected"), "true");
    // changer d'onglet ne change jamais la sélection
    ed.tab("Style");
    assert.equal(ed.insp.dataset.for, "box000000003");
    assert.equal(ed.currentTab(), "Style");
    ed.tab("Interactions");
    assert.equal(ed.insp.dataset.for, "box000000003");
    // le nom saisi est réellement enregistré dans le document du serveur
    await until(async () => (await serverNode(id, "box000000002")).name === "Carte B", 8000, "nom enregistré");
  });

  test("Général : balise HTML, ID, lien, attributs — enregistrés, rendus sur la page publiée, restaurés après rechargement", async () => {
    const id = await newPage("Banc — Général");
    let ed = await openEditor(id);
    ed.selectLayer("box000000002");
    ed.set(ed.ctl("Balise HTML"), "article");
    ed.set(ed.ctl("Ancre"), "zone-carte");
    ed.set(ed.ctl("Lien (toute la zone"), "https://exemple.fr/offre");
    assert.ok(ed.labels().some((l) => l.startsWith("Ouvrir le lien dans un nouvel onglet")), "la case « nouvel onglet » apparaît avec un lien");
    ed.set(ed.ctl("Ouvrir le lien dans un nouvel onglet"), true);
    ed.click(ed.button("Ajouter un attribut"));
    ed.set(ed.ctl("Nom", true), "data-zone");
    ed.set(ed.ctl("Valeur", true), "carte");
    const saved = await until(async () => { const n = await serverNode(id, "box000000002"); return n.props && n.props.link && n.anchor && n.attrs && n.attrs[0].name === "data-zone" && n.attrs[0].value === "carte" ? n : false; }, 8000, "réglages enregistrés");
    assert.deepEqual(saved.props, { tag: "article", link: "https://exemple.fr/offre", newTab: true });
    assert.equal(saved.anchor, "zone-carte");
    // rendu réel sur la page publiée
    assert.equal((await boss.request(`/marketing/pages/${id}/publier.json`, { method: "POST", json: {} })).status, 200);
    const slug = db.prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(id).slug;
    const html = (await boss.get(`/p/${slug}`)).text;
    assert.match(html, /<a class="kw-box-link" href="[^"]*" target="_blank" rel="noopener noreferrer"><article class="kw-node kw-container kw-n-box000000002"[^>]*id="zone-carte"[^>]*data-zone="carte"/);
    // rechargement : le même élément, les mêmes valeurs
    ed.win.close();
    ed = await openEditor(id);
    ed.selectCanvas("box000000002");
    assert.equal(ed.ctl("Balise HTML").value, "article");
    assert.equal(ed.ctl("Ancre").value, "zone-carte");
    assert.equal(ed.ctl("Lien (toute la zone").value, "https://exemple.fr/offre");
    assert.equal(ed.ctl("Ouvrir le lien dans un nouvel onglet").checked, true);
    assert.equal(ed.ctl("Nom", true).value, "data-zone");
    assert.equal(ed.ctl("Valeur", true).value, "carte");
  });

  test("Général : ID en double ou invalide refusé ; un lien refusé par le serveur n'est pas enregistré", async () => {
    const id = await newPage("Banc — refus");
    const ed = await openEditor(id);
    ed.selectLayer("box000000002");
    ed.set(ed.ctl("Ancre"), "zone-a");
    await until(async () => (await serverNode(id, "box000000002")).anchor === "zone-a", 8000, "ID enregistré");
    ed.selectLayer("box000000003");
    ed.set(ed.ctl("Ancre"), "zone-a"); // déjà utilisé
    assert.match(ed.doc.querySelector("[data-pb-toast]").textContent, /déjà utilisée/);
    ed.set(ed.ctl("Ancre"), "Zone Invalide");
    assert.match(ed.doc.querySelector("[data-pb-toast]").textContent, /Ancre invalide/);
    await sleep(1500);
    assert.equal((await serverNode(id, "box000000003")).anchor, undefined);
    // un conteneur qui contient déjà un bouton ne peut pas devenir un lien (un lien ne contient pas un lien)
    ed.selectLayer("box000000004");
    ed.set(ed.ctl("Lien (toute la zone"), "/promo");
    const err = ed.doc.querySelector("[data-pb-render-error]");
    await until(() => !err.hidden && /ne peut pas contenir/.test(err.textContent), 8000, "erreur du serveur affichée");
    assert.equal((await serverNode(id, "box000000004")).props.link, undefined, "le lien refusé n'est pas enregistré");
  });

  test("Style : direction, répartition des lignes, espacement, taille, bordure — rendus, puis indépendants par écran (ordinateur / tablette / mobile)", async () => {
    const id = await newPage("Banc — Style");
    const ed = await openEditor(id);
    ed.selectLayer("box000000002");
    ed.tab("Style");
    assert.deepEqual([...ed.insp.querySelectorAll("summary .pb-acc-title")].map((t) => t.textContent), ["Mise en page", "Dimensions", "Espacement", "Couleurs", "Fond", "Bordure", "Effets", "Position", "CSS personnalisé et classes"]);
    ed.section("Mise en page");
    assert.ok(ed.labels().includes("Répartition des lignes"), "align-content proposé");
    ed.set(ed.prop("display"), "flex");
    ed.set(ed.prop("flexDirection"), "column");
    ed.set(ed.prop("alignContent"), "space-between");
    ed.section("Espacement");
    ed.set(ed.insp.querySelector('input[data-prop="paddingTop"]'), "20");
    ed.set(ed.insp.querySelector('input[data-prop="paddingLeft"]'), "30px");
    ed.section("Bordure");
    ed.set(ed.prop("borderRadius"), "10");
    const desktop = await until(async () => { const n = await serverNode(id, "box000000002"); const s = (n.styles || {}).desktop || {}; return s.paddingLeft && s.borderRadius && s.alignContent ? s : false; }, 8000, "styles ordinateur enregistrés");
    assert.equal(desktop.display, "flex");
    assert.equal(desktop.flexDirection, "column");
    assert.equal(desktop.alignContent, "space-between");
    assert.equal(desktop.paddingTop, "20px");
    assert.equal(desktop.paddingLeft, "30px");
    assert.equal(desktop.borderRadius, "10px");
    // la tablette hérite (champ vide, valeur reprise en grisé) puis reçoit SA valeur sans écraser celle de l'ordinateur
    ed.device("Tablette");
    const padTab = ed.insp.querySelector('input[data-prop="paddingTop"]');
    assert.equal(padTab.value, "", "tablette : pas de valeur propre");
    assert.match(padTab.placeholder, /20/, "tablette : la valeur de l'ordinateur est montrée en grisé");
    ed.set(padTab, "10");
    ed.device("Mobile");
    ed.set(ed.insp.querySelector('input[data-prop="paddingTop"]'), "5");
    const all = await until(async () => { const s = (await serverNode(id, "box000000002")).styles; return s.mobile && s.mobile.paddingTop && s.tablet && s.tablet.paddingTop ? s : false; }, 8000, "styles par écran enregistrés");
    assert.deepEqual([all.desktop.paddingTop, all.tablet.paddingTop, all.mobile.paddingTop], ["20px", "10px", "5px"]);
    // rendu public : les trois valeurs, chacune dans sa requête média
    assert.equal((await boss.request(`/marketing/pages/${id}/publier.json`, { method: "POST", json: {} })).status, 200);
    const css = (await boss.get(`/p/${db.prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(id).slug}`)).text;
    assert.match(css, /\.kw-n-box000000002\{[^}]*padding-top:20px[^}]*align-content:space-between|\.kw-n-box000000002\{[^}]*align-content:space-between[^}]*padding-top:20px/);
    assert.match(css, /@media \(max-width: 1023px\)\{[^}]*\.kw-n-box000000002\{[^}]*padding-top:10px/);
    assert.match(css, /@media \(max-width: 767px\)\{[^}]*\.kw-n-box000000002\{[^}]*padding-top:5px/);
  });

  test("annuler / rétablir : la valeur précédente revient dans le champ ET dans le document enregistré, puis repart", async () => {
    const id = await newPage("Banc — historique");
    const ed = await openEditor(id);
    ed.selectLayer("box000000002");
    ed.tab("Style");
    ed.section("Espacement");
    ed.set(ed.insp.querySelector('input[data-prop="paddingTop"]'), "20");
    await until(async () => (((await serverNode(id, "box000000002")).styles || {}).desktop || {}).paddingTop === "20px", 8000, "20px enregistré");
    ed.set(ed.insp.querySelector('input[data-prop="paddingTop"]'), "50");
    await until(async () => (((await serverNode(id, "box000000002")).styles || {}).desktop || {}).paddingTop === "50px", 8000, "50px enregistré");
    ed.undo();
    assert.match(ed.insp.querySelector('input[data-prop="paddingTop"]').value, /^20/, "annuler : 20 revient dans le champ");
    await until(async () => (((await serverNode(id, "box000000002")).styles || {}).desktop || {}).paddingTop === "20px", 8000, "annulation enregistrée");
    ed.redo();
    assert.match(ed.insp.querySelector('input[data-prop="paddingTop"]').value, /^50/, "rétablir : 50 revient");
    await until(async () => (((await serverNode(id, "box000000002")).styles || {}).desktop || {}).paddingTop === "50px", 8000, "rétablissement enregistré");
  });

  test("Grille : ses propres réglages (colonnes, répartition des lignes), sans les réglages Flexbox inutiles ; valeur enregistrée", async () => {
    const id = await newPage("Banc — grille");
    const ed = await openEditor(id);
    ed.selectLayer("grd000000001");
    assert.equal(ed.insp.querySelector(".pb-kind").textContent, "Modifier Grille");
    assert.deepEqual(ed.tabs(), ["Général", "Style", "Interactions"]);
    ed.tab("Style");
    ed.section("Mise en page");
    const labels = ed.labels();
    assert.ok(labels.includes("Répartition des lignes"));
    assert.ok(labels.some((l) => /Colonnes/.test(l)));
    for (const flexOnly of ["Direction", "Retour ligne"]) assert.ok(!labels.includes(flexOnly), `« ${flexOnly} » (Flexbox) n'est pas proposé pour une grille`);
    ed.set(ed.prop("alignContent"), "center");
    await until(async () => (((await serverNode(id, "grd000000001")).styles || {}).desktop || {}).alignContent === "center", 8000, "align-content de la grille enregistré");
  });

  test("Interactions : animation réellement appliquée ; l'onglet n'affiche que des réglages réels", async () => {
    const id = await newPage("Banc — interactions");
    const ed = await openEditor(id);
    ed.selectLayer("box000000002");
    ed.tab("Interactions");
    const titles = [...ed.insp.querySelectorAll("summary .pb-acc-title")].map((t) => t.textContent);
    assert.ok(titles.includes("Animation") && titles.includes("Interactions et conditions"), titles.join(" | "));
    const entrance = [...ed.insp.querySelectorAll("select")].find((s) => [...s.options].some((o) => /fondu|apparition|fade/i.test(o.textContent)));
    assert.ok(entrance, "choix d'une animation d'entrée");
    const choice = [...entrance.options].find((o) => o.value);
    ed.set(entrance, choice.value);
    await until(async () => ((await serverNode(id, "box000000002")).motion || {}).entrance === choice.value, 8000, "animation enregistrée");
    assert.equal((await boss.request(`/marketing/pages/${id}/publier.json`, { method: "POST", json: {} })).status, 200);
    const html = (await boss.get(`/p/${db.prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(id).slug}`)).text;
    assert.match(html, new RegExp(`kw-n-box000000002"[^>]*data-kw-anim="${choice.value}"`));
  });

  test("suppression et désélection : l'inspecteur revient à son état neutre, jamais les réglages de l'élément supprimé", async () => {
    const id = await newPage("Banc — suppression");
    const ed = await openEditor(id);
    ed.selectLayer("box000000003");
    ed.click(ed.button("Supprimer"));
    assert.ok(ed.emptyState(), "plus rien de sélectionné");
    assert.equal(ed.doc.querySelector('li.pb-node[data-id="box000000003"]'), null, "le calque a disparu");
    await until(async () => (await serverNode(id, "box000000003")) === null, 8000, "suppression enregistrée");
    ed.undo();
    assert.ok(ed.doc.querySelector('li.pb-node[data-id="box000000003"]'), "annuler restaure l'élément");
    // désélection par le fil d'Ariane : retour à l'état neutre
    ed.selectLayer("box000000002");
    assert.ok(!ed.emptyState());
    ed.click(ed.button("Page"));
    assert.ok(ed.emptyState());
    assert.equal(ed.insp.dataset.for, "");
  });

  test("accessibilité : aucun identifiant en double dans la page (chaque libellé désigne SON champ), quel que soit l'élément sélectionné", async () => {
    const id = await newPage("Banc — identifiants");
    const ed = await openEditor(id);
    const dupes = () => { const seen = new Map(); ed.doc.querySelectorAll("[id]").forEach((e) => seen.set(e.id, (seen.get(e.id) || 0) + 1)); return [...seen].filter(([, n]) => n > 1).map(([k]) => k); };
    for (const target of ["box000000002", "grd000000001", "box000000004"]) {
      ed.selectLayer(target);
      for (const tab of ["Général", "Style", "Interactions"]) { ed.tab(tab); assert.deepEqual(dupes(), [], `${target} / ${tab}`); }
    }
    ed.click(ed.button("Page"));
    assert.deepEqual(dupes(), []);
    // chaque libellé de l'inspecteur désigne un champ de l'inspecteur lui-même
    ed.selectLayer("box000000002"); ed.tab("Général");
    for (const l of ed.insp.querySelectorAll("label[for]")) assert.ok(ed.insp.contains(ed.doc.getElementById(l.htmlFor)), `libellé « ${l.textContent.trim()} » : champ hors de l'inspecteur`);
  });

  test("aucune erreur de script ni de console pendant tous ces parcours", () => {
    assert.deepEqual(errors, []);
  });
});
