// Moteur d'effets dans l'éditeur RÉEL : l'onglet Avancé / Interactions est CONTEXTUEL (seules les sections que le type d'élément peut
// vraiment honorer), chaque contrôle écrit dans le document (relu côté serveur), annuler / rétablir, rechargement, écrans, page publiée.
// Banc d'essai : voir helpers-editeur-navigateur.js (navigateur simulé, ignoré sans jsdom).
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { setup, SKIP } = require("./helpers-editeur-navigateur");

const IMG = "https://exemple.fr/photo.jpg";
const content = () => ({ sections: [{ id: "sect00000001", type: "layout", children: [
  { id: "box000000001", type: "container", props: {}, children: [
    { id: "hed000000001", type: "heading", props: { text: "Un titre", level: "2" } },
    { id: "txt000000001", type: "text", props: { html: "<p>Du texte</p>" } },
    { id: "btn000000001", type: "button", props: { label: "Acheter", url: "/catalogue" } },
    { id: "ico000000001", type: "icon", props: { name: "star", size: "32" } },
    { id: "img000000001", type: "image", props: { src: IMG, alt: "Photo" } },
    { id: "spc000000001", type: "spacer", props: { size: "32" } },
  ] },
  { id: "grd000000001", type: "grid", props: {}, children: [{ id: "hed000000002", type: "heading", props: { text: "Case", level: "3" } }] },
] }] });

describe("moteur d'effets dans l'éditeur réel (navigateur simulé)", { skip: SKIP }, () => {
  let H;
  before(async () => { H = await setup(); });
  after(async () => { if (H) await H.stop(); });

  // Sections de l'inspecteur qui dépendent des CAPACITÉS (les autres — Position, CSS… — existaient déjà)
  const FX = ["Effets de défilement", "Effet de souris", "Épinglage", "Transformer", "Masque"];
  // Champ d'une section précise (certains libellés — Rotation, Échelle — existent dans plusieurs sections)
  const inSec = (ed, title, label) => { const d = ed.section(title); const l = [...d.querySelectorAll("label")].find((x) => x.textContent.trim().startsWith(label)); assert.ok(l, `champ « ${label} » absent de la section`); return (l.htmlFor && ed.doc.getElementById(l.htmlFor)) || l.querySelector("input,select"); };
  const fxOf = (ed) => ed.sectionTitles().filter((t) => FX.includes(t));

  test("contextuel : chaque type reçoit exactement les sections de ses capacités (matrice), sur son bon onglet", async () => {
    const id = await H.newPage("Matrice", content());
    const ed = await H.openEditor(id);
    const expected = {
      // [id, onglet, sections attendues]
      container: ["box000000001", "Interactions", ["Effets de défilement", "Effet de souris", "Épinglage", "Transformer"]],
      grid: ["grd000000001", "Interactions", ["Effets de défilement", "Effet de souris", "Épinglage", "Transformer"]],
      image: ["img000000001", "Avancé", ["Effets de défilement", "Effet de souris", "Transformer", "Masque"]],
      icon: ["ico000000001", "Avancé", ["Effets de défilement", "Effet de souris", "Transformer"]],
      button: ["btn000000001", "Avancé", ["Effets de défilement", "Effet de souris", "Transformer"]],
      text: ["txt000000001", "Avancé", ["Effets de défilement", "Effet de souris", "Transformer"]],
      heading: ["hed000000001", "Avancé", ["Effets de défilement", "Effet de souris", "Transformer"]],
      spacer: ["spc000000001", "Avancé", []],
    };
    for (const [type, [nodeId, tab, sections]] of Object.entries(expected)) {
      ed.selectLayer(nodeId);
      assert.ok(ed.tabs().includes(tab), `${type} : onglet « ${tab} » (onglets : ${ed.tabs().join(", ")})`);
      ed.tab(tab);
      assert.deepEqual(fxOf(ed), sections, `${type} : sections d'effets`);
    }
    // un conteneur n'a jamais de masque ; une image n'a jamais d'épinglage
    ed.selectLayer("box000000001"); ed.tab("Interactions");
    assert.ok(!ed.sectionTitles().includes("Masque"));
    ed.selectLayer("img000000001"); ed.tab("Avancé");
    assert.ok(!ed.sectionTitles().includes("Épinglage"));
  });

  test("effets de défilement : valeurs enregistrées (relues côté serveur), bornées, annulables, restaurées après rechargement", async () => {
    const id = await H.newPage("Défilement", content());
    let ed = await H.openEditor(id);
    ed.selectLayer("img000000001"); ed.tab("Avancé");
    ed.section("Effets de défilement");
    ed.set(ed.ctl("Décalage vertical"), "60");
    ed.set(ed.ctl("Transparence aux bords"), "40");
    ed.set(ed.ctl("Échelle", true), "10");
    ed.set(ed.ctl("Décalage horizontal"), "5000"); // hors bornes : refusé
    assert.match(ed.doc.querySelector("[data-pb-toast]").textContent, /entre -200 et 200/);
    await H.until(async () => { const n = await H.serverNode(id, "img000000001"); return n.motion && n.motion.scroll && n.motion.scroll.y === 60 && n.motion.scroll.opacity === 40 && n.motion.scroll.scale === 10; }, 8000, "défilement enregistré");
    assert.equal((await H.serverNode(id, "img000000001")).motion.scroll.x, undefined, "valeur hors bornes non enregistrée");
    // annuler : la dernière modification disparaît du document enregistré, puis rétablir la ramène
    ed.undo();
    await H.until(async () => ((await H.serverNode(id, "img000000001")).motion.scroll || {}).scale === undefined, 8000, "annulation enregistrée");
    assert.equal(ed.ctl("Échelle", true).value, "", "le champ se vide aussi");
    ed.redo();
    await H.until(async () => ((await H.serverNode(id, "img000000001")).motion.scroll || {}).scale === 10, 8000, "rétablissement enregistré");
    // rechargement : mêmes valeurs dans l'inspecteur
    ed.win.close();
    ed = await H.openEditor(id);
    ed.selectCanvas("img000000001"); ed.tab("Avancé"); ed.section("Effets de défilement");
    assert.deepEqual(["Décalage vertical", "Transparence aux bords"].map((l) => ed.ctl(l).value), ["60", "40"]);
    assert.equal(ed.ctl("Échelle", true).value, "10");
  });

  test("écrans : les effets peuvent être coupés par écran (mobile), au moins un écran reste actif", async () => {
    const id = await H.newPage("Écrans", content());
    const ed = await H.openEditor(id);
    ed.selectLayer("btn000000001"); ed.tab("Avancé"); ed.section("Effets de défilement");
    ed.set(ed.ctl("Décalage vertical"), "30");
    await H.until(async () => ((await H.serverNode(id, "btn000000001")).motion || {}).scroll, 8000, "effet enregistré");
    const mobile = [...ed.section("Effets de défilement").querySelectorAll(".pb-checks label")].find((l) => /Mobile/.test(l.textContent)).querySelector("input");
    ed.set(mobile, false);
    await H.until(async () => JSON.stringify(((await H.serverNode(id, "btn000000001")).motion || {}).off) === '["mobile"]', 8000, "écran coupé enregistré");
    // Les cases suivent la liste des écrans du modèle (ordinateur, grand écran, tablette, mobile) : retrouvées par leur libellé
    const box = (name) => [...ed.section("Effets de défilement").querySelectorAll(".pb-checks label")].find((l) => l.textContent.trim().startsWith(name)).querySelector("input");
    ed.set(box("Ordinateur"), false); // ordinateur coupé en plus (valide : il reste des écrans actifs)
    await H.until(async () => JSON.stringify(((await H.serverNode(id, "btn000000001")).motion || {}).off) === '["desktop","mobile"]', 8000, "deuxième écran coupé enregistré");
    ed.set(box("Grand écran"), false);
    await H.until(async () => JSON.stringify(((await H.serverNode(id, "btn000000001")).motion || {}).off) === '["desktop","wide","mobile"]', 8000, "troisième écran coupé enregistré");
    ed.set(box("Tablette"), false); // couper aussi la tablette = plus aucun écran actif : refusé
    await H.sleep(500);
    assert.match(ed.doc.querySelector("[data-pb-toast]").textContent, /au moins un écran/);
    assert.deepEqual(((await H.serverNode(id, "btn000000001")).motion || {}).off, ["desktop", "wide", "mobile"], "refus : rien n'a changé");
  });

  test("effet de souris : disponible sur ordinateur, masqué sur mobile ; l'inclinaison 3D bloque la rotation au défilement", async () => {
    const id = await H.newPage("Souris", content());
    const ed = await H.openEditor(id);
    ed.selectLayer("icon".length ? "ico000000001" : ""); ed.tab("Avancé");
    ed.section("Effet de souris");
    ed.set(ed.ctl("Effet"), "tilt");
    await H.until(async () => (((await H.serverNode(id, "ico000000001")).motion || {}).mouse || {}).mode === "tilt", 8000, "inclinaison enregistrée");
    ed.set(ed.ctl("Intensité"), "50");
    await H.until(async () => (((await H.serverNode(id, "ico000000001")).motion || {}).mouse || {}).strength === 50, 8000, "intensité enregistrée");
    ed.section("Effets de défilement");
    const rotation = ed.ctl("Rotation");
    assert.ok(rotation.disabled, "rotation au défilement indisponible avec l'inclinaison");
    assert.match(ed.insp.textContent, /Rotation indisponible/);
    // sur un écran mobile : pas de curseur, la section l'explique au lieu de proposer des réglages inutilisables
    ed.tab("Style"); ed.device("Mobile"); ed.tab("Avancé");
    const mouse = ed.section("Effet de souris");
    assert.match(mouse.textContent, /n'a pas de curseur/);
    assert.equal(mouse.querySelectorAll("select").length, 0);
  });

  test("épinglage : « En haut » écrit position sticky + distance, par écran ; « Aucun » nettoie sans toucher aux autres positions", async () => {
    const id = await H.newPage("Épinglage", content());
    const ed = await H.openEditor(id);
    ed.selectLayer("box000000001"); ed.tab("Interactions");
    ed.section("Épinglage");
    ed.set(ed.ctl("Épingler"), "top");
    await H.until(async () => { const s = (((await H.serverNode(id, "box000000001")).styles || {}).desktop || {}); return s.position === "sticky" && s.top === "0px"; }, 8000, "épinglage enregistré");
    ed.set(ed.ctl("Distance du bord"), "24");
    await H.until(async () => ((((await H.serverNode(id, "box000000001")).styles || {}).desktop || {}).top === "24px"), 8000, "distance enregistrée");
    ed.set(ed.ctl("Épingler"), "bottom");
    await H.until(async () => { const s = (((await H.serverNode(id, "box000000001")).styles || {}).desktop || {}); return s.position === "sticky" && s.bottom === "0px" && s.top === undefined; }, 8000, "épinglage en bas");
    ed.set(ed.ctl("Épingler"), "");
    await H.until(async () => { const n = await H.serverNode(id, "box000000001"); const s = ((n.styles || {}).desktop || {}); return s.position === undefined && s.bottom === undefined; }, 8000, "épinglage retiré");
  });

  test("transformer : valeurs au repos et au survol séparées, inclinaison, indépendantes par écran, annulables", async () => {
    const id = await H.newPage("Transformer", content());
    const ed = await H.openEditor(id);
    ed.selectLayer("btn000000001"); ed.tab("Avancé");
        ed.set(inSec(ed, "Transformer", "Rotation"), "8");
    ed.set(inSec(ed, "Transformer", "Inclinaison X"), "5");
    await H.until(async () => { const t = ((((await H.serverNode(id, "btn000000001")).styles || {}).desktop || {}).transform || {}); return t.rotate === 8 && t.skewX === 5; }, 8000, "transformation enregistrée");
    // au survol : une autre valeur, stockée dans l'état « survol », sans toucher au repos
    ed.click(ed.button("Survol"));
    ed.set(inSec(ed, "Transformer", "Échelle"), "1.05");
    await H.until(async () => ((((await H.serverNode(id, "btn000000001")).states || {}).hover || {}).transform || {}).scale === 1.05, 8000, "survol enregistré");
    const n = await H.serverNode(id, "btn000000001");
    assert.deepEqual(n.styles.desktop.transform, { rotate: 8, skewX: 5 }, "le repos n'a pas bougé");
    assert.deepEqual(n.states.hover.transform, { scale: 1.05 });
    // mobile : valeur propre, sans écraser l'ordinateur
    ed.click(ed.button("Normal"));
    ed.device("Mobile");
    ed.set(inSec(ed, "Transformer", "Rotation"), "2");
    await H.until(async () => ((((await H.serverNode(id, "btn000000001")).styles || {}).mobile || {}).transform || {}).rotate === 2, 8000, "mobile enregistré");
    assert.equal(((await H.serverNode(id, "btn000000001")).styles.desktop.transform || {}).rotate, 8);
    ed.undo();
    await H.until(async () => (((await H.serverNode(id, "btn000000001")).styles || {}).mobile || {}).transform === undefined, 8000, "annulation du mobile enregistrée");
    // page publiée : repos, survol et mobile rendus
    const html = await H.publish(id);
    assert.match(html, /\.kw-n-btn000000001\{[^}]*transform:rotate\(8deg\) skewX\(5deg\)/);
    assert.match(html, /\.kw-n-btn000000001:hover\{[^}]*transform:scale\(1\.05\)/);
  });

  test("le bouton n'a pas de transformation en double : la section Position ne répète plus les réglages de transformation", async () => {
    const id = await H.newPage("Doublons", content());
    const ed = await H.openEditor(id);
    ed.selectLayer("btn000000001"); ed.tab("Avancé");
    const position = ed.section("Position");
    assert.doesNotMatch(position.textContent, /Décalage X|Rotation|Échelle|Inclinaison/);
    assert.match(ed.section("Transformer").textContent, /Décalage X[\s\S]*Rotation[\s\S]*Échelle[\s\S]*Inclinaison X/);
  });

  test("masque (image) : forme et image de masque enregistrées, par écran ; absent pour les autres types", async () => {
    const id = await H.newPage("Masque", content());
    const ed = await H.openEditor(id);
    ed.selectLayer("img000000001"); ed.tab("Avancé");
    ed.section("Masque");
    ed.set(ed.ctl("Forme"), "hexagon");
    await H.until(async () => (((((await H.serverNode(id, "img000000001")).styles || {}).desktop || {}).mask) || {}).shape === "hexagon", 8000, "forme enregistrée");
    ed.undo();
    await H.until(async () => ((((await H.serverNode(id, "img000000001")).styles || {}).desktop || {}).mask) === undefined, 8000, "annulation enregistrée");
    ed.redo();
    await H.until(async () => (((((await H.serverNode(id, "img000000001")).styles || {}).desktop || {}).mask) || {}).shape === "hexagon", 8000, "rétablissement enregistré");
    const html = await H.publish(id);
    assert.match(html, /\.kw-n-img000000001\{[^}]*clip-path:polygon\(25% 5%/);
    for (const other of ["btn000000001", "ico000000001", "hed000000001", "box000000001"]) {
      ed.selectLayer(other);
      ed.tab(ed.tabs().includes("Avancé") ? "Avancé" : "Interactions");
      assert.ok(!ed.sectionTitles().includes("Masque"), `${other} n'a pas de masque`);
    }
  });

  test("changement de sélection : les sections se recalculent pour le nouvel élément, jamais celles de l'ancien", async () => {
    const id = await H.newPage("Sélection", content());
    const ed = await H.openEditor(id);
    ed.selectLayer("img000000001"); ed.tab("Avancé");
    assert.ok(ed.sectionTitles().includes("Masque"));
    ed.selectLayer("hed000000001");
    assert.ok(!ed.sectionTitles().includes("Masque"), "le masque de l'image a disparu pour le titre");
    ed.selectLayer("spc000000001");
    assert.deepEqual(fxOf(ed), [], "un espace n'a aucune section d'effet");
    ed.selectCanvas("grd000000001");
    assert.equal(ed.currentTab() === "Interactions" || ed.tabs().includes("Interactions"), true);
  });

  test("page publiée : les effets de défilement et de souris sont écrits et le moteur d'exécution est chargé", async () => {
    const id = await H.newPage("Publication effets", content());
    const ed = await H.openEditor(id);
    ed.selectLayer("hed000000001"); ed.tab("Avancé");
    ed.section("Effets de défilement"); ed.set(ed.ctl("Décalage vertical"), "40");
    ed.section("Effet de souris"); ed.set(ed.ctl("Effet"), "track");
    await H.until(async () => { const m = (await H.serverNode(id, "hed000000001")).motion || {}; return m.scroll && m.mouse; }, 8000, "effets enregistrés");
    const html = await H.publish(id);
    assert.match(html, /kw-n-hed000000001"[^>]*data-kw-scroll="\{&quot;y&quot;:40\}"/);
    assert.match(html, /data-kw-mouse="\{&quot;mode&quot;:&quot;track&quot;,&quot;strength&quot;:30\}"/);
    assert.match(html, /kw-effects\.js/);
  });

  test("aucune erreur de script ni de console pendant tous ces parcours", () => {
    assert.deepEqual(H.errors, []);
  });
});
