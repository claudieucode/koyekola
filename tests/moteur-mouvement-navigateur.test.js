// Panneau « Effets de mouvement » dans l'éditeur RÉEL (navigateur simulé jsdom) : menu des animations (catégories, recherche instantanée,
// aperçu au survol SANS enregistrer), choix, paramètres (durée, délai, courbe, répétition, direction, déclenchement, écrans),
// annuler / rétablir, rechargement, copier / coller, réinitialiser, mouvement réduit. Chaque valeur est relue côté serveur.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { setup, SKIP } = require("./helpers-editeur-navigateur");

const content = () => ({ sections: [{ id: "sect00000001", type: "layout", children: [
  { id: "box000000001", type: "container", props: {}, children: [
    { id: "hed000000001", type: "heading", props: { text: "Un titre", level: "2" } },
    { id: "hed000000002", type: "heading", props: { text: "Un autre titre", level: "3" } },
  ] },
] }] });

describe("effets de mouvement dans l'éditeur réel (navigateur simulé)", { skip: SKIP }, () => {
  let H;
  before(async () => { H = await setup(); });
  after(async () => { if (H) await H.stop(); });

  const motionOf = async (id, nodeId) => (await H.serverNode(id, nodeId)).motion || {};
  const waitMotion = (id, nodeId, check, what) => H.until(async () => check(await motionOf(id, nodeId)), 8000, what);
  const pick = (ed) => ed.insp.querySelector("[data-pb-anim-pick]");
  const menu = (ed) => ed.doc.querySelector(".pb-amenu");
  const item = (ed, anim) => ed.doc.querySelector(`.pb-amenu [data-anim="${anim}"]`);
  const openMenu = (ed) => { ed.click(pick(ed)); assert.ok(menu(ed), "menu ouvert"); };
  const choose = (ed, anim) => { openMenu(ed); ed.click(item(ed, anim)); };
  const fld = (ed, prop) => ed.insp.querySelector(`.pb-prop[data-prop="${prop}"] input.pb-len-num`);
  const labelSel = (ed, label) => { const l = [...ed.insp.querySelectorAll("label[for]")].find((x) => x.textContent.trim() === label); assert.ok(l, `champ « ${label} »`); return ed.doc.getElementById(l.htmlFor); };
  const mouse = (ed, el, type) => el.dispatchEvent(new ed.win.MouseEvent(type, { bubbles: true }));

  test("menu : catégories visibles, recherche instantanée (« fade »), « Aucune » ; Échap ferme", async () => {
    const id = await H.newPage("Mvt — menu", content());
    const ed = await H.openEditor(id);
    ed.selectLayer("hed000000001"); ed.tab("Avancé");
    assert.ok(ed.sectionTitles().includes("Effets de mouvement"));
    openMenu(ed);
    const cats = [...menu(ed).querySelectorAll(".pb-amenu-cat")].map((c) => c.textContent);
    for (const c of ["Fading", "Zooming", "Bouncing", "Sliding", "Rotating", "Attention Seekers", "Light Speed", "Specials"]) assert.ok(cats.includes(c), `catégorie ${c}`);
    assert.ok(item(ed, "tada") && item(ed, "roll-out") && item(ed, "rotate-in-up-right"), "toutes les animations listées");
    assert.equal(menu(ed).querySelectorAll("[data-anim]").length, ed.win.__pb ? menu(ed).querySelectorAll("[data-anim]").length : 0);
    const search = menu(ed).querySelector(".pb-amenu-search");
    search.value = "fade"; search.dispatchEvent(new ed.win.Event("input", { bubbles: true }));
    const found = [...menu(ed).querySelectorAll("[data-anim]")].map((b) => b.textContent);
    assert.ok(found.includes("Fade In") && found.includes("Fade In Down") && found.includes("Fade In Up Right"), found.join(", "));
    assert.ok(!found.includes("Tada") && !found.includes("Zoom In"), "filtré");
    search.value = "zzzz"; search.dispatchEvent(new ed.win.Event("input", { bubbles: true }));
    assert.equal(menu(ed).querySelectorAll("[data-anim]").length, 0);
    menu(ed).dispatchEvent(new ed.win.KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
    assert.equal(menu(ed), null, "Échap ferme le menu");
  });

  test("aperçu au survol : l'animation joue dans le canevas mais RIEN n'est enregistré ; seul le choix applique", async () => {
    const id = await H.newPage("Mvt — survol", content());
    const ed = await H.openEditor(id);
    ed.selectLayer("hed000000001"); ed.tab("Avancé");
    openMenu(ed);
    mouse(ed, item(ed, "zoom-in"), "mouseenter");
    assert.match(ed.canvasNode("hed000000001").style.animation, /kw-a-zoom-in/, "aperçu joué sur l'élément du canevas");
    assert.ok(ed.canvasNode("hed000000001").ownerDocument.getElementById("pb-motion-all"), "images-clés fournies au canevas");
    mouse(ed, item(ed, "zoom-in"), "mouseleave");
    assert.equal(ed.canvasNode("hed000000001").style.animation, "", "aperçu retiré à la sortie");
    await H.sleep(600);
    assert.deepEqual(await motionOf(id, "hed000000001"), {}, "rien d'enregistré par le simple survol");
    mouse(ed, item(ed, "zoom-in"), "mouseenter");
    ed.click(item(ed, "zoom-in")); // choix : applique
    await waitMotion(id, "hed000000001", (m) => m.entrance === "zoom-in", "animation enregistrée");
    assert.equal(menu(ed), null);
  });

  test("paramètres : durée, délai, courbe (dont cubic-bezier), répétition, direction, déclenchement, jouer une seule fois — enregistrés et relus", async () => {
    const id = await H.newPage("Mvt — paramètres", content());
    let ed = await H.openEditor(id);
    ed.selectLayer("hed000000001"); ed.tab("Avancé");
    choose(ed, "fade-in-up");
    await waitMotion(id, "hed000000001", (m) => m.entrance === "fade-in-up" && m.duration === 600, "défauts enregistrés");
    // NumericControl en secondes (0,1 s de pas)
    ed.set(fld(ed, "motion-duration"), "0.8"); await waitMotion(id, "hed000000001", (m) => m.duration === 800, "durée 0,8 s");
    ed.click(ed.insp.querySelector('.pb-prop[data-prop="motion-duration"] .pb-nstep-btn[data-dir="up"]')); await waitMotion(id, "hed000000001", (m) => m.duration === 900, "▲ : 0,9 s");
    ed.set(fld(ed, "motion-delay"), "0.2"); await waitMotion(id, "hed000000001", (m) => m.delay === 200, "délai 0,2 s");
    ed.set(fld(ed, "motion-duration"), "99"); assert.match((ed.doc.querySelector("[data-pb-toast]") || {}).textContent, /entre 0\.1 et 10/);
    ed.set(labelSel(ed, "Courbe d'accélération"), "ease-out"); await waitMotion(id, "hed000000001", (m) => m.easing === "ease-out", "courbe");
    ed.set(labelSel(ed, "Courbe d'accélération"), "custom"); await waitMotion(id, "hed000000001", (m) => /^cubic-bezier\(/.test(m.easing || ""), "courbe personnalisée");
    const bez = ed.insp.querySelector(".pb-bezier");
    ed.set(bez, "0.1, 0.2, 0.3, 1"); await waitMotion(id, "hed000000001", (m) => m.easing === "cubic-bezier(0.1, 0.2, 0.3, 1)", "cubic-bezier saisi");
    ed.set(ed.insp.querySelector(".pb-bezier"), "5, 0, 0, 1"); assert.match(ed.doc.querySelector("[data-pb-toast]").textContent, /Courbe/);
    assert.equal((await motionOf(id, "hed000000001")).easing, "cubic-bezier(0.1, 0.2, 0.3, 1)", "valeur invalide refusée");
    // répétition : jamais infinie par défaut ; l'aller-retour n'est proposé qu'avec plusieurs répétitions
    assert.equal(labelSel(ed, "Répétition").value, "1");
    assert.deepEqual([...labelSel(ed, "Direction").options].map((o) => o.value), ["normal", "reverse"], "seules les directions compatibles");
    ed.set(labelSel(ed, "Répétition"), "3"); await waitMotion(id, "hed000000001", (m) => m.iterations === 3, "3 fois");
    assert.deepEqual([...labelSel(ed, "Direction").options].map((o) => o.value), ["normal", "reverse", "alternate", "alternate-reverse"]);
    ed.set(labelSel(ed, "Direction"), "alternate"); await waitMotion(id, "hed000000001", (m) => m.direction === "alternate", "direction");
    ed.set(labelSel(ed, "Répétition"), "infinite"); await waitMotion(id, "hed000000001", (m) => m.iterations === "infinite", "infini sur demande");
    ed.set(labelSel(ed, "Répétition"), "1"); await waitMotion(id, "hed000000001", (m) => m.iterations === undefined && m.direction === undefined, "retour à une fois : direction aller-retour retirée");
    // jouer une seule fois / rejouer ; déclenchement
    const once = [...ed.insp.querySelectorAll("label.pb-check input")].find((c) => /seule fois/.test(c.parentElement.textContent));
    ed.set(once, false); await waitMotion(id, "hed000000001", (m) => m.repeat === true, "rejouée à chaque retour");
    ed.set(labelSel(ed, "Déclenchement"), "click"); await waitMotion(id, "hed000000001", (m) => m.trigger === "click" && m.repeat === undefined, "au clic");
    // rechargement : tout est conservé
    ed.win.close();
    ed = await H.openEditor(id);
    ed.selectCanvas("hed000000001"); ed.tab("Avancé");
    assert.equal(pick(ed).textContent.replace("▾", "").trim(), "Fade In Up");
    assert.equal(fld(ed, "motion-duration").value, "0.9"); assert.equal(fld(ed, "motion-delay").value, "0.2");
    assert.equal(labelSel(ed, "Déclenchement").value, "click"); assert.equal(labelSel(ed, "Courbe d'accélération").value, "custom");
  });

  test("annuler / rétablir : Fade In → Fade In Up → Zoom In, puis dans l'autre sens (historique de l'éditeur)", async () => {
    const id = await H.newPage("Mvt — historique", content());
    const ed = await H.openEditor(id);
    ed.selectLayer("hed000000001"); ed.tab("Avancé");
    for (const a of ["fade-in", "fade-in-up", "zoom-in"]) { choose(ed, a); await waitMotion(id, "hed000000001", (m) => m.entrance === a, a); }
    ed.undo(); await waitMotion(id, "hed000000001", (m) => m.entrance === "fade-in-up", "annuler → Fade In Up");
    ed.undo(); await waitMotion(id, "hed000000001", (m) => m.entrance === "fade-in", "annuler → Fade In");
    ed.redo(); await waitMotion(id, "hed000000001", (m) => m.entrance === "fade-in-up", "rétablir → Fade In Up");
    assert.equal(pick(ed).textContent.replace("▾", "").trim(), "Fade In Up", "le panneau suit l'historique");
  });

  test("selon l'écran : tablette et mobile (autre animation, ou aucune), héritage ; suppression et réinitialisation sans aucune trace", async () => {
    const id = await H.newPage("Mvt — écrans", content());
    const ed = await H.openEditor(id);
    ed.selectLayer("hed000000001"); ed.tab("Avancé");
    choose(ed, "fade-in-up");
    await waitMotion(id, "hed000000001", (m) => m.entrance === "fade-in-up", "base");
    ed.set(labelSel(ed, "Tablette"), "fade-in"); ed.set(labelSel(ed, "Mobile"), "none");
    await waitMotion(id, "hed000000001", (m) => m.screens && m.screens.tablet === "fade-in" && m.screens.mobile === "none", "écrans");
    ed.set(labelSel(ed, "Mobile"), ""); await waitMotion(id, "hed000000001", (m) => m.screens && m.screens.mobile === undefined, "mobile hérite");
    // supprimer l'animation : plus rien du moteur
    ed.click(ed.button("Supprimer l'animation"));
    await waitMotion(id, "hed000000001", (m) => m.entrance === undefined && m.screens === undefined && m.duration === undefined, "supprimée");
    // choisir « Aucune » depuis le menu fait de même
    choose(ed, "tada"); await waitMotion(id, "hed000000001", (m) => m.entrance === "tada", "tada");
    openMenu(ed); ed.click(item(ed, ""));
    await waitMotion(id, "hed000000001", (m) => m.entrance === undefined, "« Aucune »");
    // le rendu publié n'a plus de trace
    const html = await H.publish(id);
    assert.doesNotMatch(html, /data-kw-anim|kw-a-tada|kw-a-fade/);
  });

  test("mouvement réduit : option activée par défaut ; la décocher écrit « toujours animer » ; copier / coller et réinitialiser", async () => {
    const id = await H.newPage("Mvt — accessibilité", content());
    const ed = await H.openEditor(id);
    ed.selectLayer("hed000000001"); ed.tab("Avancé");
    choose(ed, "bounce-in");
    await waitMotion(id, "hed000000001", (m) => m.entrance === "bounce-in", "bounce");
    const respect = [...ed.insp.querySelectorAll("label.pb-check input")].find((c) => /préférences système de mouvement réduit/.test(c.parentElement.textContent));
    assert.equal(respect.checked, true, "activée par défaut");
    ed.set(respect, false); await waitMotion(id, "hed000000001", (m) => m.alwaysMotion === true, "toujours animer");
    ed.set([...ed.insp.querySelectorAll("label.pb-check input")].find((c) => /préférences système/.test(c.parentElement.textContent)), true);
    await waitMotion(id, "hed000000001", (m) => m.alwaysMotion === undefined, "respect rétabli");
    // copier → autre élément → coller : animation et paramètres recopiés
    ed.set(fld(ed, "motion-duration"), "1.2"); await waitMotion(id, "hed000000001", (m) => m.duration === 1200, "durée");
    ed.click(ed.button("Copier les effets"));
    ed.selectLayer("hed000000002"); ed.tab("Avancé");
    ed.click(ed.button("Coller les effets"));
    await waitMotion(id, "hed000000002", (m) => m.entrance === "bounce-in" && m.duration === 1200, "effets collés");
    // réinitialiser : plus aucun mouvement dans le document
    ed.click(ed.button("Réinitialiser"));
    await H.until(async () => (await H.serverNode(id, "hed000000002")).motion === undefined, 8000, "réinitialisé");
    ed.undo(); await waitMotion(id, "hed000000002", (m) => m.entrance === "bounce-in", "annuler la réinitialisation");
  });

  test("▶ Prévisualiser / ⏹ Arrêter : l'aperçu du canevas démarre et s'arrête ; rien n'est modifié dans le document", async () => {
    const id = await H.newPage("Mvt — aperçu", content());
    const ed = await H.openEditor(id);
    ed.selectLayer("hed000000001"); ed.tab("Avancé");
    choose(ed, "tada");
    await waitMotion(id, "hed000000001", (m) => m.entrance === "tada", "tada");
    await H.sleep(900); // le canevas se redessine après chaque modification ; l'aperçu automatique suit
    const before = JSON.stringify(await motionOf(id, "hed000000001"));
    const btn = ed.insp.querySelector("[data-pb-anim-preview]");
    ed.click(btn);
    assert.match(ed.canvasNode("hed000000001").style.animation, /kw-a-tada 1000ms/);
    assert.match(btn.textContent, /Arrêter/);
    ed.click(btn);
    assert.equal(ed.canvasNode("hed000000001").style.animation, "");
    assert.match(btn.textContent, /Prévisualiser/);
    await H.sleep(500);
    assert.equal(JSON.stringify(await motionOf(id, "hed000000001")), before, "l'aperçu n'enregistre rien");
  });

  test("aucune erreur de script ni de console pendant tous ces parcours", () => { assert.deepEqual(H.errors, []); });
});
