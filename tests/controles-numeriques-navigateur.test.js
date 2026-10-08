// Contrôles numériques de l'éditeur RÉEL (NumericControl) : saisie, ▲▼, flèches du clavier, unités, curseur, glissement, marges liées,
// écrans, annuler / rétablir, rechargement. Chaque valeur est relue côté serveur et dans le CSS de la page publiée : rien n'est « visuel ».
// Banc d'essai : helpers-editeur-navigateur.js (navigateur simulé jsdom, ignoré sans jsdom : npm install --no-save jsdom).
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { setup, SKIP } = require("./helpers-editeur-navigateur");

const content = () => ({ sections: [{ id: "sect00000001", type: "layout", children: [
  { id: "box000000001", type: "container", props: {}, children: [
    { id: "hed000000001", type: "heading", props: { text: "Un titre", level: "2" } },
    { id: "hed000000002", type: "heading", props: { text: "Un second titre", level: "3" } },
  ] },
] }] });

describe("contrôles numériques dans l'éditeur réel (navigateur simulé)", { skip: SKIP }, () => {
  let H;
  before(async () => { H = await setup(); });
  after(async () => { if (H) await H.stop(); });

  const styleOf = async (id, nodeId, device = "desktop") => (((await H.serverNode(id, nodeId)).styles || {})[device]) || {};
  const waitStyle = (id, nodeId, key, expected, device = "desktop") => H.until(async () => (await styleOf(id, nodeId, device))[key] === expected, 8000, `${key} = ${expected} (${device})`);
  const row = (ed, prop) => { const r = ed.insp.querySelector(`.pb-prop[data-prop="${prop}"]`); assert.ok(r, `ligne « ${prop} » introuvable`); return r; };
  const field = (ed, prop) => { const i = row(ed, prop).querySelector("input.pb-len-num"); assert.ok(i, `champ « ${prop} » introuvable`); return i; };
  const arrow = (ed, input, key, extra = {}) => input.dispatchEvent(new ed.win.KeyboardEvent("keydown", { key, bubbles: true, cancelable: true, ...extra }));
  const stepBtn = (ed, prop, dir) => { const b = row(ed, prop).querySelector(`.pb-nstep-btn[data-dir="${dir}"]`); assert.ok(b, `bouton ${dir} de « ${prop} » introuvable`); ed.click(b); };
  const unitSel = (ed, prop) => row(ed, prop).querySelector("select.pb-len-unit");
  const toast = (ed) => (ed.doc.querySelector("[data-pb-toast]") || {}).textContent || "";
  const pt = (ed, el, type, x) => el.dispatchEvent(new ed.win.MouseEvent(type, { bubbles: true, cancelable: true, clientX: x, button: 0 }));
  const publishedCss = async (id) => H.publish(id);

  test("taille de police : saisie, ▲, ▼, flèches (Maj : ×10), bornes — chaque valeur est dans le document", async () => {
    const id = await H.newPage("Num — taille", content());
    const ed = await H.openEditor(id);
    ed.selectLayer("hed000000001"); ed.tab("Style"); ed.section("Typographie");
    // TEST 1 : saisie manuelle
    ed.set(field(ed, "fontSize"), "24");
    await waitStyle(id, "hed000000001", "fontSize", "24px");
    // TEST 2 : ▲ ; TEST 3 : ▼ (chaque clic = une valeur enregistrée)
    stepBtn(ed, "fontSize", "up"); await waitStyle(id, "hed000000001", "fontSize", "25px");
    stepBtn(ed, "fontSize", "up"); await waitStyle(id, "hed000000001", "fontSize", "26px");
    stepBtn(ed, "fontSize", "down"); await waitStyle(id, "hed000000001", "fontSize", "25px");
    assert.equal(field(ed, "fontSize").value, "25", "le champ affiche la nouvelle valeur");
    // TEST 4 : clavier
    arrow(ed, field(ed, "fontSize"), "ArrowUp"); await waitStyle(id, "hed000000001", "fontSize", "26px");
    arrow(ed, field(ed, "fontSize"), "ArrowDown"); arrow(ed, field(ed, "fontSize"), "ArrowDown"); await waitStyle(id, "hed000000001", "fontSize", "24px");
    arrow(ed, field(ed, "fontSize"), "ArrowUp", { shiftKey: true }); await waitStyle(id, "hed000000001", "fontSize", "34px");
    // TEST 21 : valeur très grande ; négatif refusé ; les flèches s'arrêtent au minimum
    ed.set(field(ed, "fontSize"), "9999");
    await waitStyle(id, "hed000000001", "fontSize", "9999px");
    ed.set(field(ed, "fontSize"), "-4");
    assert.equal((await styleOf(id, "hed000000001")).fontSize, "9999px", "valeur négative refusée");
    ed.set(field(ed, "fontSize"), "1");
    await waitStyle(id, "hed000000001", "fontSize", "1px");
    arrow(ed, field(ed, "fontSize"), "ArrowDown"); assert.equal(field(ed, "fontSize").value, "1", "minimum 1 : la flèche s'arrête");
  });

  test("unités : PX → REM écrit vraiment « 2rem » dans le CSS de la page publiée ; « 1.5em » tapé est compris ; unité inconnue refusée", async () => {
    const id = await H.newPage("Num — unités", content());
    const ed = await H.openEditor(id);
    ed.selectLayer("hed000000001"); ed.tab("Style"); ed.section("Typographie");
    ed.set(field(ed, "fontSize"), "2");
    await waitStyle(id, "hed000000001", "fontSize", "2px");
    assert.deepEqual([...unitSel(ed, "fontSize").options].map((o) => o.value), ["px", "em", "rem", "vw"], "seulement les unités compatibles");
    ed.set(unitSel(ed, "fontSize"), "rem"); // TEST 5
    await waitStyle(id, "hed000000001", "fontSize", "2rem");
    stepBtn(ed, "fontSize", "up"); await waitStyle(id, "hed000000001", "fontSize", "2.1rem"); // pas de 0,1 en rem
    ed.set(field(ed, "fontSize"), "1.5em");
    await waitStyle(id, "hed000000001", "fontSize", "1.5em");
    assert.equal(unitSel(ed, "fontSize").value, "em", "le sélecteur suit l'unité tapée");
    ed.set(field(ed, "fontSize"), "3 %"); assert.match(toast(ed), /unité/i);
    assert.equal((await styleOf(id, "hed000000001")).fontSize, "1.5em");
    const html = await publishedCss(id);
    assert.match(html, /\.kw-n-hed000000001\{[^}]*font-size:1\.5em/);
  });

  test("interligne, interlettrage, espacement des mots, retrait : pas et précision propres à chaque propriété", async () => {
    const id = await H.newPage("Num — typo", content());
    const ed = await H.openEditor(id);
    ed.selectLayer("hed000000001"); ed.tab("Style"); ed.section("Typographie");
    ed.set(field(ed, "lineHeight"), "1.5"); await waitStyle(id, "hed000000001", "lineHeight", 1.5);
    stepBtn(ed, "lineHeight", "up"); await waitStyle(id, "hed000000001", "lineHeight", 1.6);
    ed.set(field(ed, "lineHeight"), "9"); assert.match(toast(ed), /entre 0\.8 et 3/); // borne du serveur
    ed.set(field(ed, "letterSpacing"), "0.2"); await waitStyle(id, "hed000000001", "letterSpacing", "0.2px");
    stepBtn(ed, "letterSpacing", "up"); await waitStyle(id, "hed000000001", "letterSpacing", "0.3px");
    ed.set(field(ed, "letterSpacing"), "-1"); await waitStyle(id, "hed000000001", "letterSpacing", "-1px"); // TEST 22 : négatif autorisé ici
    ed.set(field(ed, "wordSpacing"), "4"); await waitStyle(id, "hed000000001", "wordSpacing", "4px");
    ed.set(field(ed, "textIndent"), "20"); await waitStyle(id, "hed000000001", "textIndent", "20px");
    assert.match(await publishedCss(id), /\.kw-n-hed000000001\{[^}]*word-spacing:4px[^}]*/);
  });

  test("marges et intérieur : unité commune, ▲▼/flèches par côté, liaison et déliaison des 4 côtés, négatif seulement pour les marges", async () => {
    const id = await H.newPage("Num — espacement", content());
    const ed = await H.openEditor(id);
    ed.selectLayer("box000000001"); ed.tab("Style"); ed.section("Espacement");
    const cell = (p) => ed.insp.querySelector(`input[data-prop="${p}"]`);
    // TEST 6 : padding
    ed.set(cell("paddingTop"), "20"); await waitStyle(id, "box000000001", "paddingTop", "20px");
    arrow(ed, cell("paddingTop"), "ArrowUp"); await waitStyle(id, "box000000001", "paddingTop", "21px");
    ed.click(ed.insp.querySelector(".pb-boxcell.is-pt .pb-nstep-btn[data-dir='up']")); await waitStyle(id, "box000000001", "paddingTop", "22px");
    ed.set(cell("paddingTop"), "-5"); assert.equal((await styleOf(id, "box000000001")).paddingTop, "22px", "intérieur négatif refusé");
    // TEST 7 : lier les 4 côtés → une valeur pour tous
    ed.click(ed.insp.querySelector('[data-link="padding"]'));
    await H.until(async () => { const s = await styleOf(id, "box000000001"); return s.paddingRight === "22px" && s.paddingBottom === "22px" && s.paddingLeft === "22px"; }, 8000, "4 côtés liés");
    ed.set(cell("paddingLeft"), "30");
    await H.until(async () => { const s = await styleOf(id, "box000000001"); return s.paddingTop === "30px" && s.paddingRight === "30px" && s.paddingBottom === "30px"; }, 8000, "un côté modifie les 4");
    // TEST 8 : délier → indépendants
    ed.click(ed.insp.querySelector('[data-link="padding"]'));
    ed.set(cell("paddingTop"), "8");
    await waitStyle(id, "box000000001", "paddingTop", "8px");
    assert.equal((await styleOf(id, "box000000001")).paddingBottom, "30px", "les autres côtés ne bougent plus");
    // TEST 9 : marge (négatif et auto permis), unité commune
    ed.set(cell("marginTop"), "-10"); await waitStyle(id, "box000000001", "marginTop", "-10px");
    ed.set(cell("marginLeft"), "auto"); await waitStyle(id, "box000000001", "marginLeft", "auto");
    ed.set(cell("marginBottom"), "16"); await waitStyle(id, "box000000001", "marginBottom", "16px");
    const us = ed.insp.querySelector('.pb-spacing-head select[aria-label^="Intérieur"]');
    ed.set(us, "rem");
    await H.until(async () => { const s = await styleOf(id, "box000000001"); return s.paddingTop === "8rem" && s.paddingBottom === "30rem"; }, 8000, "l'unité commune change le CSS des côtés");
    assert.match(await publishedCss(id), /\.kw-n-box000000001\{[^}]*padding-top:8rem/);
  });

  test("dimensions, arrondi, opacité : unités propres, « auto », plage du serveur, curseur", async () => {
    const id = await H.newPage("Num — dimensions", content());
    const ed = await H.openEditor(id);
    ed.selectLayer("box000000001"); ed.tab("Style");
    ed.section("Dimensions");
    // TEST 10 / 11
    ed.set(field(ed, "width"), "50"); ed.set(unitSel(ed, "width"), "%");
    await waitStyle(id, "box000000001", "width", "50%");
    assert.deepEqual([...unitSel(ed, "width").options].map((o) => o.value), ["px", "%", "rem", "vw", "auto"]);
    ed.set(unitSel(ed, "width"), "auto"); await waitStyle(id, "box000000001", "width", "auto");
    assert.equal(field(ed, "width").disabled, true, "« auto » : pas de nombre à saisir");
    ed.set(field(ed, "height"), "300"); await waitStyle(id, "box000000001", "height", "300px");
    ed.set(unitSel(ed, "height"), "vh"); await waitStyle(id, "box000000001", "height", "300vh");
    ed.set(field(ed, "minHeight"), "120"); await waitStyle(id, "box000000001", "minHeight", "120px");
    // TEST 12 : arrondi
    ed.section("Bordure");
    ed.set(field(ed, "borderRadius"), "12"); await waitStyle(id, "box000000001", "borderRadius", "12px");
    stepBtn(ed, "borderRadius", "up"); await waitStyle(id, "box000000001", "borderRadius", "13px");
    ed.set(field(ed, "borderRadius"), "-3"); assert.equal((await styleOf(id, "box000000001")).borderRadius, "13px", "arrondi négatif refusé");
    // TEST 13 : opacité (pas de 0,01, bornes 0–1, curseur)
    ed.section("Effets");
    ed.set(field(ed, "opacity"), "0.5"); await waitStyle(id, "box000000001", "opacity", 0.5);
    stepBtn(ed, "opacity", "up"); await waitStyle(id, "box000000001", "opacity", 0.51);
    ed.set(field(ed, "opacity"), "1.5"); assert.match(toast(ed), /entre 0 et 1/);
    const range = row(ed, "opacity").querySelector('input[type="range"]');
    assert.ok(range, "l'opacité a un curseur");
    range.value = "0.25"; range.dispatchEvent(new ed.win.Event("input", { bubbles: true }));
    await waitStyle(id, "box000000001", "opacity", 0.25);
    // une propriété qui n'est pas numérique n'a pas de curseur
    ed.section("Bordure");
    assert.equal(row(ed, "borderStyle").querySelector('input[type="range"]'), null);
  });

  test("rotation, échelle, inclinaison, déplacement : champs de la section Transformer", async () => {
    const id = await H.newPage("Num — transformer", content());
    const ed = await H.openEditor(id);
    ed.selectLayer("hed000000002"); ed.tab("Avancé"); ed.section("Transformer");
    const inSec = (label) => { const d = ed.section("Transformer"); const l = [...d.querySelectorAll("label")].find((x) => x.textContent.trim().startsWith(label)); assert.ok(l, label); return ed.doc.getElementById(l.htmlFor); };
    const tf = async () => (await styleOf(id, "hed000000002")).transform || {};
    ed.set(inSec("Rotation"), "45"); // TEST 14
    await H.until(async () => (await tf()).rotate === 45, 8000, "rotation 45");
    ed.click(inSec("Rotation").closest(".pb-prop").querySelector('.pb-nstep-btn[data-dir="up"]')); await H.until(async () => (await tf()).rotate === 46, 8000, "rotation 46");
    ed.set(inSec("Rotation"), "-90"); await H.until(async () => (await tf()).rotate === -90, 8000, "rotation négative"); // TEST 22
    ed.set(inSec("Rotation"), "400"); assert.match(toast(ed), /entre -360 et 360/);
    ed.set(inSec("Échelle"), "1.25"); await H.until(async () => (await tf()).scale === 1.25, 8000, "échelle décimale"); // TEST 23
    ed.click(inSec("Échelle").closest(".pb-prop").querySelector('.pb-nstep-btn[data-dir="up"]')); await H.until(async () => (await tf()).scale === 1.26, 8000, "pas de 0,01");
    ed.set(inSec("Décalage X"), "20"); await H.until(async () => (await tf()).x === "20px", 8000, "décalage px");
    const xsel = inSec("Décalage X").closest(".pb-prop").querySelector("select.pb-len-unit");
    ed.set(xsel, "%"); await H.until(async () => (await tf()).x === "20%", 8000, "décalage en %");
    ed.set(inSec("Inclinaison X"), "10"); await H.until(async () => (await tf()).skewX === 10, 8000, "inclinaison");
  });

  test("écrans : ordinateur, tablette et mobile gardent chacun leur valeur ; ↺ rend l'héritage ; une valeur vide n'écrit jamais NaN / undefined", async () => {
    const id = await H.newPage("Num — écrans", content());
    const ed = await H.openEditor(id);
    ed.selectLayer("hed000000001"); ed.tab("Style"); ed.section("Typographie");
    ed.set(field(ed, "fontSize"), "32"); await waitStyle(id, "hed000000001", "fontSize", "32px"); // TEST 15
    ed.device("Tablette"); ed.section("Typographie");
    assert.equal(field(ed, "fontSize").value, "", "tablette : pas de valeur propre"); assert.equal(field(ed, "fontSize").placeholder, "32", "héritée, en grisé");
    stepBtn(ed, "fontSize", "down"); // part de la valeur héritée : 32 → 31
    await waitStyle(id, "hed000000001", "fontSize", "31px", "tablet");
    ed.set(field(ed, "fontSize"), "28"); await waitStyle(id, "hed000000001", "fontSize", "28px", "tablet"); // TEST 16
    ed.device("Mobile"); ed.section("Typographie");
    ed.set(field(ed, "fontSize"), "24"); await waitStyle(id, "hed000000001", "fontSize", "24px", "mobile"); // TEST 17
    assert.equal((await styleOf(id, "hed000000001")).fontSize, "32px", "l'ordinateur n'est pas écrasé");
    assert.equal((await styleOf(id, "hed000000001", "tablet")).fontSize, "28px");
    // reset du mobile : retour à l'héritage (la tablette)
    ed.click(row(ed, "fontSize").querySelector(".pb-reset"));
    await H.until(async () => (await styleOf(id, "hed000000001", "mobile")).fontSize === undefined, 8000, "mobile réinitialisé");
    assert.equal(field(ed, "fontSize").value, ""); assert.equal(field(ed, "fontSize").placeholder, "28");
    // TEST 24 : vide
    ed.device("Ordinateur"); ed.section("Typographie");
    ed.set(field(ed, "fontSize"), ""); await H.until(async () => (await styleOf(id, "hed000000001")).fontSize === undefined, 8000, "valeur vidée");
    arrow(ed, field(ed, "fontSize"), "ArrowUp"); // ▲ sur un champ vide : repart de la base, jamais NaN
    await H.until(async () => /^\d+px$/.test((await styleOf(id, "hed000000001")).fontSize || ""), 8000, "▲ sur champ vide");
    assert.doesNotMatch(await publishedCss(id), /NaN|undefinedpx|nullpx/);
  });

  test("annuler / rétablir : chaque ▲ est une étape (26 → 25 → 24 → 25), le curseur en fait UNE seule", async () => {
    const id = await H.newPage("Num — historique", content());
    const ed = await H.openEditor(id);
    ed.selectLayer("hed000000001"); ed.tab("Style"); ed.section("Typographie");
    ed.set(field(ed, "fontSize"), "24"); await waitStyle(id, "hed000000001", "fontSize", "24px");
    stepBtn(ed, "fontSize", "up"); stepBtn(ed, "fontSize", "up");
    await waitStyle(id, "hed000000001", "fontSize", "26px");
    ed.undo(); await waitStyle(id, "hed000000001", "fontSize", "25px"); // TEST 18
    assert.equal(field(ed, "fontSize").value, "25", "le champ suit l'annulation");
    ed.undo(); await waitStyle(id, "hed000000001", "fontSize", "24px");
    ed.redo(); await waitStyle(id, "hed000000001", "fontSize", "25px"); // TEST 19
    // curseur : tout le déplacement = une étape
    ed.section("Effets");
    const range = row(ed, "opacity").querySelector('input[type="range"]');
    range.dispatchEvent(new ed.win.Event("pointerdown", { bubbles: true }));
    for (const v of ["0.9", "0.8", "0.7", "0.6"]) { range.value = v; range.dispatchEvent(new ed.win.Event("input", { bubbles: true })); }
    await waitStyle(id, "hed000000001", "opacity", 0.6);
    range.dispatchEvent(new ed.win.Event("change", { bubbles: true }));
    ed.undo();
    await H.until(async () => (await styleOf(id, "hed000000001")).opacity === undefined, 8000, "un seul « annuler » défait tout le déplacement du curseur");
    assert.equal((await styleOf(id, "hed000000001")).fontSize, "25px", "la taille n'a pas bougé");
  });

  test("glissement sur le libellé : la valeur suit la souris, une seule étape d'annulation ; le champ reste du texte ordinaire", async () => {
    const id = await H.newPage("Num — glissement", content());
    const ed = await H.openEditor(id);
    ed.selectLayer("hed000000001"); ed.tab("Style"); ed.section("Typographie");
    ed.set(field(ed, "fontSize"), "20"); await waitStyle(id, "hed000000001", "fontSize", "20px");
    const label = row(ed, "fontSize").querySelector("label.pb-scrub");
    assert.ok(label, "le libellé est la poignée de glissement");
    assert.equal(field(ed, "fontSize").type, "text", "le champ n'est pas un input number : saisie, sélection, copier-coller intacts");
    pt(ed, label, "pointerdown", 100);
    pt(ed, ed.doc, "pointermove", 140); // 40 px → +10 pas
    pt(ed, ed.doc, "pointermove", 160); // 60 px → +15 pas
    await new Promise((r) => setTimeout(r, 120));
    pt(ed, ed.doc, "pointerup", 160);
    await waitStyle(id, "hed000000001", "fontSize", "35px"); // TEST 27
    ed.undo(); await waitStyle(id, "hed000000001", "fontSize", "20px");
    // un simple clic (sans déplacement) ne change rien
    const l2 = row(ed, "fontSize").querySelector("label.pb-scrub");
    pt(ed, l2, "pointerdown", 50); pt(ed, ed.doc, "pointerup", 50);
    assert.equal((await styleOf(id, "hed000000001")).fontSize, "20px");
  });

  test("sauvegarde puis rechargement : les valeurs, unités et écrans reviennent à l'identique", async () => {
    const id = await H.newPage("Num — rechargement", content());
    let ed = await H.openEditor(id);
    ed.selectLayer("hed000000001"); ed.tab("Style"); ed.section("Typographie");
    ed.set(field(ed, "fontSize"), "2.5"); ed.set(unitSel(ed, "fontSize"), "rem"); await waitStyle(id, "hed000000001", "fontSize", "2.5rem");
    ed.set(field(ed, "lineHeight"), "1.4"); await waitStyle(id, "hed000000001", "lineHeight", 1.4);
    ed.win.close();
    ed = await H.openEditor(id); // TEST 20
    ed.selectCanvas("hed000000001"); ed.tab("Style"); ed.section("Typographie");
    assert.equal(field(ed, "fontSize").value, "2.5"); assert.equal(unitSel(ed, "fontSize").value, "rem"); assert.equal(field(ed, "lineHeight").value, "1.4");
  });

  test("clavier : les flèches du champ ne remontent pas aux raccourcis de l'éditeur ; accessibilité des ▲▼", async () => {
    const id = await H.newPage("Num — clavier", content());
    const ed = await H.openEditor(id);
    ed.selectLayer("hed000000001"); ed.tab("Style"); ed.section("Typographie");
    const f = field(ed, "fontSize");
    let reached = false; ed.doc.body.addEventListener("keydown", () => { reached = true; });
    ed.set(f, "20");
    const ev = new ed.win.KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true, cancelable: true }); f.dispatchEvent(ev); // TEST 26
    assert.equal(ev.defaultPrevented, true, "ni curseur déplacé ni défilement");
    assert.equal(reached, false, "l'événement ne remonte pas jusqu'aux raccourcis de l'éditeur");
    for (const b of row(ed, "fontSize").querySelectorAll(".pb-nstep-btn")) {
      assert.match(b.getAttribute("aria-label"), /(Augmenter|Diminuer) : /); assert.equal(b.tabIndex, -1);
    }
    assert.ok(row(ed, "fontSize").querySelector('select[aria-label$="unité"]'), "unité nommée");
    ed.section("Effets");
    assert.match(row(ed, "opacity").querySelector('input[type="range"]').getAttribute("aria-label"), /curseur/);
  });

  test("filtres et ombre : mêmes contrôles", async () => {
    const id = await H.newPage("Num — divers", content());
    const ed = await H.openEditor(id);
    ed.selectLayer("hed000000001"); ed.tab("Style"); ed.section("Effets");
    const f = ed.insp.querySelector('[data-prop="filter-blur"] input.pb-len-num');
    assert.ok(f, "filtre « Flou » : NumericControl");
    ed.set(f, "6");
    await H.until(async () => ((await styleOf(id, "hed000000001")).filter || {}).blur === 6, 8000, "flou 6");
    ed.click(ed.insp.querySelector('[data-prop="filter-blur"] .pb-nstep-btn[data-dir="up"]'));
    await H.until(async () => ((await styleOf(id, "hed000000001")).filter || {}).blur === 7, 8000, "flou 7");
    const sx = ed.insp.querySelector('[data-prop="shadow-x"] input.pb-len-num');
    ed.set(sx, "12"); await H.until(async () => ((await styleOf(id, "hed000000001")).shadow || {}).x === 12, 8000, "ombre X");
    ed.set(sx, "500"); assert.match(toast(ed), /entre -100 et 100/);
  });

  test("aucune erreur de script ni de console pendant tous ces parcours", () => {
    assert.deepEqual(H.errors, []);
  });
});
