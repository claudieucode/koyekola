// Barre contextuelle de l'éditeur de pages dans un VRAI Chrome : chaque commande est exécutée pour de bon et vérifiée dans le brouillon ENREGISTRÉ
// (base de données), avec annuler / rétablir, menu « Plus » regroupé, visibilité par écran, déplacement vers un autre conteneur, note interne,
// personnalisation (propre à l'utilisateur), confirmation de suppression, chargement à la demande, clavier et mouvement réduit.
// Ignoré (avec la raison) si Playwright ou Chrome sont absents : `npm i --no-save playwright-core`, ou CHROME_PATH.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : parcours navigateur non exécuté sur cette machine" : false;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const many = Array.from({ length: 16 }, (_, i) => ({ id: `m${String(i).padStart(11, "0")}`, type: "text", props: { html: `<p>Ligne ${i}</p>` } }));
const CONTENT = () => ({ sections: [{ id: "sect00000001", type: "layout", children: [
  { id: "boxa00000001", type: "container", props: {}, children: [
    { id: "btn000000001", type: "button", props: { label: "Acheter", url: "/catalogue" }, styles: { desktop: { fontSize: "22px", color: "#aa0000" } } },
    { id: "hed000000001", type: "heading", props: { text: "Titre", level: "2" } },
    { id: "txt000000001", type: "text", props: { html: "<p>Bonjour</p>" } },
  ] },
  { id: "boxb00000001", type: "container", props: {}, children: [] },
  { id: "boxc00000001", type: "container", props: {}, children: many },
] }] });

describe("barre contextuelle (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, context, page, errors, n = 0, pageId, requests;
  const db = () => srv.db();
  const ready = () => page.waitForFunction(() => { const f = document.querySelector("[data-pb-frame]"); return f && f.contentDocument && f.contentDocument.querySelector("[data-node-id]"); }, null, { timeout: 90000 });
  async function openEditor(opts = {}) {
    n += 1;
    if (context) await context.close();
    context = await browser.newContext({ viewport: { width: 1600, height: 900 }, reducedMotion: opts.reduced ? "reduce" : "no-preference" });
    await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    page = await context.newPage(); requests = [];
    page.on("request", (r) => requests.push(r.url()));
    page.on("pageerror", (e) => errors.push(`pageerror : ${e.message}`));
    page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errors.push(`console : ${m.text().slice(0, 200)}`); });
    if (!opts.same) pageId = Number((await boss.post("/marketing/pages", { name: `Barre ${n}` })).location.match(/(\d+)$/)[1]);
    if (!opts.same) {
      const revision = db().prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(pageId).revision;
      const put = await boss.request(`/marketing/pages/${pageId}/brouillon`, { method: "PUT", json: { revision, content: opts.content || CONTENT() }, headers: { Origin: srv.base } });
      assert.equal(put.status, 200, put.text.slice(0, 160));
    }
    await page.goto(`${srv.base}/marketing/pages/${pageId}/editeur`);
    await ready(); await wait(500);
  }
  const pick = async (id) => { await page.locator(`[data-pb-layers] .pb-node[data-id="${id}"] > .pb-row-item`).click(); await wait(300); };
  const draft = () => { const r = db().prepare("SELECT draft, sections FROM mk_landing_pages WHERE id = ?").get(pageId); return r.draft ? JSON.parse(r.draft) : { sections: JSON.parse(r.sections) }; };
  const find = (id) => { let out = null; const walk = (list) => { for (const x of list || []) { if (x.id === id) out = x; walk(x.children); } }; walk(draft().sections); return out; };
  const parentOf = (id) => { let out = null; const walk = (list, p) => { for (const x of list || []) { if (x.id === id) out = p; walk(x.children, x); } }; walk(draft().sections, null); return out; };
  const saveNow = async () => { await page.locator("[data-pb-save-now]").click(); await wait(900); };
  const bar = () => page.locator(".pb-cbar:not([hidden])");
  const barBtn = (a) => page.locator(`.pb-cbar-btn[data-action="${a}"]`);
  const openMore = async () => { await barBtn("more").click(); await page.locator(".pb-menu:not([hidden])").waitFor(); await wait(150); };
  const item = (label) => page.locator(".pb-menu:not([hidden]) .pb-menu-item", { hasText: label }).first();
  const choose = async (label) => { await item(label).click(); await wait(350); };
  const undo = async () => { await page.keyboard.press("Control+z"); await wait(350); };
  const redo = async () => { await page.keyboard.press("Control+Shift+z"); await wait(350); };

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); errors = [];
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
  });
  after(async () => { if (browser) await browser.close(); await srv.stop(); });

  test("la barre apparaît sur la sélection, sans déplacer le contenu, et les outils avancés ne sont PAS chargés au départ", async () => {
    await openEditor();
    const frameBox = await page.locator("[data-pb-frame]").boundingBox();
    const y0 = await page.evaluate(() => document.querySelector("[data-pb-frame]").contentDocument.querySelector('[data-node-id="hed000000001"]').getBoundingClientRect().top);
    await pick("hed000000001");
    await bar().waitFor();
    const y1 = await page.evaluate(() => document.querySelector("[data-pb-frame]").contentDocument.querySelector('[data-node-id="hed000000001"]').getBoundingClientRect().top);
    assert.equal(y1, y0, "le contenu ne bouge pas quand la barre apparaît");
    const fb2 = await page.locator("[data-pb-frame]").boundingBox();
    assert.deepEqual(fb2, frameBox, "le canevas garde ses dimensions");
    assert.equal(await page.evaluate(() => getComputedStyle(document.querySelector(".pb-cbar")).position), "fixed");
    assert.ok(!requests.some((u) => /page-builder-ctx\.js/.test(u)), "page-builder-ctx.js n'est pas chargé au démarrage");
    for (const a of ["parent", "move", "duplicate", "hide", "responsive", "more", "remove"]) assert.equal(await barBtn(a).count(), 1, `action ${a}`);
    // chaque bouton a un libellé accessible et une infobulle
    const bad = await page.evaluate(() => [...document.querySelectorAll(".pb-cbar-btn")].filter((b) => !b.getAttribute("aria-label") || !b.getAttribute("data-tip")).length);
    assert.equal(bad, 0);
    assert.equal(await page.locator(".pb-cbar").getAttribute("role"), "toolbar");
  });

  test("le menu « Plus » est regroupé en catégories et ses commandes sont adaptées à l'élément", async () => {
    await openEditor();
    await pick("boxa00000001");
    await openMore();
    const heads = await page.locator(".pb-menu:not([hidden]) .pb-menu-heading").allTextContents();
    assert.deepEqual(heads, ["Organisation", "Presse-papiers", "Apparence", "Réutilisation", "Avancé"]);
    for (const l of ["Ajouter à l'intérieur", "Sélectionner le premier enfant", "Déplacer vers un autre conteneur", "Ouvrir dans Structure", "Enregistrer comme élément global", "Informations sur l'élément", "Masquer sur tablette", "Personnaliser la barre"]) assert.ok(await item(l).count(), `entrée « ${l} »`);
    await page.keyboard.press("Escape"); await wait(300);
    assert.equal(await page.locator(".pb-menu:not([hidden])").count(), 0, "Échap ferme le menu");
    // un titre : pas de « Ajouter à l'intérieur » ni d'enfant
    await pick("hed000000001"); await openMore();
    assert.equal(await item("Ajouter à l'intérieur").count(), 0);
    assert.equal(await item("Sélectionner le premier enfant").count(), 0);
    assert.ok(await item("Sélectionner le parent").count());
    await page.keyboard.press("Escape");
  });

  test("sélectionner parent / enfant / frère, depuis le menu", async () => {
    await openEditor();
    await pick("hed000000001");
    await openMore(); await choose("Sélectionner le parent");
    assert.equal(await page.evaluate(() => document.querySelector("[data-pb-frame]").contentDocument.querySelector(".pb-sel-box") ? 1 : 0), 1);
    assert.ok(await page.locator('[data-pb-layers] .pb-node[data-id="boxa00000001"] > .pb-row-item.is-selected, [data-pb-layers] .pb-node.is-selected[data-id="boxa00000001"]').count());
    await openMore(); await choose("Sélectionner le premier enfant");
    assert.ok(await page.locator('[data-pb-layers] [data-id="btn000000001"].is-selected, [data-pb-layers] [data-id="btn000000001"] > .pb-row-item.is-selected').count());
    await openMore(); await choose("Sélectionner l'élément suivant");
    assert.ok(await page.locator('[data-pb-layers] [data-id="hed000000001"].is-selected, [data-pb-layers] [data-id="hed000000001"] > .pb-row-item.is-selected').count());
  });

  test("dupliquer : structure complète, identifiants uniques, annuler et rétablir ; verrouiller / déverrouiller", async () => {
    await openEditor();
    await pick("boxa00000001");
    await barBtn("duplicate").click(); await wait(500); await saveNow();
    let d = draft(); const kids = d.sections[0].children;
    assert.equal(kids.length, 4, "une copie du conteneur est ajoutée");
    const copy = kids[1];
    assert.equal(copy.children.length, 3, "les enfants sont copiés");
    const ids = []; const walk = (l) => l.forEach((x) => { ids.push(x.id); walk(x.children || []); }); walk(d.sections);
    assert.equal(new Set(ids).size, ids.length, "aucun identifiant dupliqué");
    assert.equal(copy.children[0].styles.desktop.fontSize, "22px", "les styles sont copiés");
    await undo(); await saveNow();
    assert.equal(draft().sections[0].children.length, 3, "annuler retire la copie");
    await redo(); await saveNow();
    assert.equal(draft().sections[0].children.length, 4, "rétablir la remet");
    // verrouillage
    await pick("hed000000001");
    await barBtn("lock").count() ? await barBtn("lock").click() : await (async () => { await openMore(); await choose("Verrouiller"); })();
    await wait(400); await saveNow();
    assert.equal(find("hed000000001").locked, true);
    await pick("hed000000001"); await openMore();
    assert.ok(await item("Déverrouiller").count());
    assert.equal(await page.locator(".pb-menu:not([hidden]) .pb-menu-item", { hasText: /^Supprimer/ }).isDisabled(), true, "un élément verrouillé ne se supprime pas");
    await choose("Déverrouiller"); await saveNow();
    assert.ok(!find("hed000000001").locked);
  });

  test("copier / coller, copier le style / coller le style (la présentation seulement, jamais le texte ni le lien)", async () => {
    await openEditor();
    await pick("txt000000001");
    await openMore(); await choose("Copier");
    await pick("boxb00000001"); await openMore(); await choose("Coller"); await saveNow();
    assert.equal(find("boxb00000001").children.length, 1, "l'élément copié est collé dans le conteneur sélectionné");
    assert.equal(find("boxb00000001").children[0].type, "text");
    // style
    await pick("btn000000001"); await openMore(); await choose("Copier le style");
    await pick("hed000000001"); await openMore(); await choose("Coller le style"); await saveNow();
    const h = find("hed000000001");
    assert.equal((h.styles || {}).desktop && h.styles.desktop.fontSize, "22px", "la taille de police est collée");
    assert.equal(h.props.text, "Titre", "le texte du titre n'est pas touché");
    assert.equal(find("btn000000001").props.url, "/catalogue", "le lien du bouton n'est pas touché");
    await undo(); await saveNow();
    assert.ok(!(find("hed000000001").styles || {}).desktop || !find("hed000000001").styles.desktop.fontSize, "annuler restaure le style précédent");
    // réinitialiser le style
    await pick("btn000000001"); await openMore(); await choose("Réinitialiser le style"); await saveNow();
    assert.ok(!find("btn000000001").styles || !Object.keys(find("btn000000001").styles.desktop || {}).length);
  });

  test("visibilité par écran : tablette et mobile séparés du masquage général ; il reste toujours un écran", async () => {
    await openEditor();
    await pick("txt000000001");
    await barBtn("responsive").click(); await page.locator(".pb-menu:not([hidden])").waitFor();
    await choose("Masquer sur tablette"); await saveNow();
    assert.deepEqual(find("txt000000001").hideOn, ["tablet"]);
    assert.ok(!find("txt000000001").hidden, "masquer sur tablette ne désactive pas l'élément partout");
    await barBtn("responsive").click(); await page.locator(".pb-menu:not([hidden])").waitFor();
    assert.ok(await item("Afficher sur tablette").count(), "l'état est lisible dans le menu");
    await choose("Masquer sur mobile"); await saveNow();
    assert.deepEqual(find("txt000000001").hideOn.sort(), ["mobile", "tablet"]);
    await barBtn("responsive").click(); await page.locator(".pb-menu:not([hidden])").waitFor();
    assert.equal(await page.locator(".pb-menu:not([hidden]) .pb-menu-item").count(), 3, "seuls les trois écrans réellement pris en charge sont proposés");
    await choose("Masquer sur ordinateur"); await saveNow();
    assert.deepEqual(find("txt000000001").hideOn.sort(), ["mobile", "tablet"], "refusé : il doit rester visible sur au moins un écran (le serveur refuse aussi)");
    await undo(); await undo(); await saveNow();
    assert.ok(!find("txt000000001").hideOn, "annuler restaure la visibilité (deux étapes, pas trois : le refus n'a rien écrit)");
    await redo(); await saveNow();
    assert.deepEqual(find("txt000000001").hideOn, ["tablet"], "rétablir remet le premier masquage");
    // masquage général (site publié)
    await pick("txt000000001"); await barBtn("hide").click(); await wait(400); await saveNow();
    assert.equal(find("txt000000001").hidden, true);
  });

  test("déplacer vers un autre conteneur (fenêtre de choix), jamais dans un descendant ; annuler", async () => {
    await openEditor();
    await pick("hed000000001");
    await openMore(); await choose("Déplacer vers un autre conteneur");
    const dlg = page.locator("dialog.pb-comp-dlg[open]"); await dlg.waitFor();
    assert.ok(await page.evaluate(() => !!window.pbCtx), "les outils avancés se chargent à la demande");
    const opts = await dlg.locator("#pb-ctx-move-to option").allTextContents();
    assert.ok(opts.length >= 2);
    await dlg.locator("#pb-ctx-move-to").selectOption("boxb00000001");
    await dlg.locator("[data-cd-ok]").click(); await wait(500); await saveNow();
    assert.equal(parentOf("hed000000001").id, "boxb00000001");
    await undo(); await saveNow();
    assert.equal(parentOf("hed000000001").id, "boxa00000001", "annuler remet l'élément à sa place");
    // un conteneur ne propose pas ses propres descendants
    await pick("boxa00000001"); await openMore(); await choose("Déplacer vers un autre conteneur");
    const o2 = await page.locator("dialog.pb-comp-dlg[open] #pb-ctx-move-to option").evaluateAll((os) => os.map((o) => o.value));
    assert.ok(!o2.includes("boxa00000001"));
    await page.keyboard.press("Escape"); await wait(300);
  });

  test("renommer, note interne (jamais publiée), informations réelles, ouvrir dans Structure", async () => {
    await openEditor();
    await pick("hed000000001");
    await openMore(); await choose("Renommer");
    const input = page.locator("input.pb-rename"); await input.fill("Mon super titre"); await input.press("Enter"); await wait(400); await saveNow();
    assert.equal(find("hed000000001").name, "Mon super titre");
    await openMore(); await choose("Ajouter une note de l'équipe");
    const ta = page.locator('[data-pb-inspector] details[data-group="g-note"] textarea, [data-pb-inspector] details[data-group="g-note"] input[type=text]').first();
    await ta.waitFor(); await ta.fill("NOTE-SECRETE-123"); await ta.blur(); await wait(500); await saveNow();
    assert.equal(find("hed000000001").note, "NOTE-SECRETE-123");
    const pub = await boss.request(`/marketing/pages/${pageId}/apercu`, {});
    if (pub.status === 200) assert.ok(!pub.text.includes("NOTE-SECRETE-123"), "la note n'apparaît jamais dans la page");
    await pick("hed000000001"); await openMore(); await choose("Informations sur l'élément");
    const dlg = page.locator("dialog.pb-comp-dlg[open]"); await dlg.waitFor();
    const txt = await dlg.innerText();
    assert.ok(txt.includes("hed000000001") && txt.includes("Mon super titre") && txt.includes("NOTE-SECRETE-123"), txt.slice(0, 300));
    await dlg.locator("[data-cd-ok]").click(); await wait(300);
    await openMore(); await choose("Ouvrir dans Structure"); await wait(500);
    assert.equal(await page.locator("[data-pb-doc]:not([hidden])").count(), 1, "le mode Structure est ouvert");
  });

  test("élément global : un seul choix explicite, composant synchronisé enregistré ; modèle standard distinct", async () => {
    await openEditor();
    await pick("boxa00000001");
    await openMore(); await choose("Enregistrer comme élément global");
    const dlg = page.locator("dialog.pb-comp-dlg[open]"); await dlg.waitFor();
    assert.equal(await dlg.locator("#pb-comp-kind-glo").isChecked(), true);
    await dlg.locator("#pb-comp-dlg-name").fill("Bloc global test");
    await dlg.locator("[data-cd-ok]").click(); await wait(900);
    const row = db().prepare("SELECT name, kind FROM mk_web_components WHERE name = ?").get("Bloc global test");
    assert.ok(row && row.kind === "global", JSON.stringify(row));
    await pick("boxc00000001"); await openMore(); await choose("Enregistrer comme modèle");
    const d2 = page.locator("dialog.pb-comp-dlg[open]"); await d2.waitFor();
    assert.equal(await d2.locator("#pb-comp-kind-glo").count(), 0, "modèle simple : pas de choix global");
    await page.keyboard.press("Escape"); await wait(300);
  });

  test("personnaliser la barre : choix mémorisé pour CE compte, restauration par défaut", async () => {
    await openEditor();
    await pick("hed000000001");
    assert.equal(await barBtn("duplicate").count(), 1);
    await openMore(); await choose("Personnaliser la barre");
    const dlg = page.locator("dialog.pb-comp-dlg[open]"); await dlg.waitFor();
    await dlg.locator("#pb-ctx-pref-duplicate").uncheck();
    await dlg.locator("[data-cd-ok]").click(); await wait(500);
    assert.equal(await barBtn("duplicate").count(), 0, "le raccourci masqué disparaît de la barre");
    assert.equal(await barBtn("more").count(), 1, "« Plus d'actions » reste toujours visible");
    assert.ok(await barBtn("remove").count());
    const keys = await page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith("pb:cbar-hide-")));
    assert.equal(keys.length, 1); assert.ok(/pb:cbar-hide-\d+$/.test(keys[0]), "la clé contient l'identifiant de l'utilisateur : " + keys[0]);
    await page.reload(); await ready(); await wait(600); await pick("hed000000001");
    assert.equal(await barBtn("duplicate").count(), 0, "le choix survit au rechargement");
    await openMore(); await choose("Personnaliser la barre");
    await page.locator("dialog.pb-comp-dlg[open]").getByText("Restaurer la disposition par défaut").click();
    await page.locator("dialog.pb-comp-dlg[open] [data-cd-ok]").click(); await wait(500);
    assert.equal(await barBtn("duplicate").count(), 1, "restaurée");
  });

  test("supprimer : un gros ensemble demande confirmation (annuler la fenêtre garde tout), un petit non ; annulable", async () => {
    await openEditor();
    await pick("boxc00000001");
    await barBtn("remove").click(); await wait(400);
    const dlg = page.locator("dialog.pb-comp-dlg[open]"); await dlg.waitFor();
    assert.ok((await dlg.innerText()).includes("16"), "le nombre d'éléments est annoncé");
    await dlg.locator("[data-cd-cancel]").click(); await wait(300); await saveNow();
    assert.ok(find("boxc00000001"), "refus : rien n'est supprimé");
    await pick("boxc00000001"); await barBtn("remove").click(); await page.locator("dialog.pb-comp-dlg[open] [data-cd-ok]").click(); await wait(500); await saveNow();
    assert.equal(find("boxc00000001"), null);
    await undo(); await saveNow();
    assert.equal(find("boxc00000001").children.length, 16, "annuler restaure l'ensemble");
    // petit élément : sans confirmation
    await pick("txt000000001"); await barBtn("remove").click(); await wait(400);
    assert.equal(await page.locator("dialog.pb-comp-dlg[open]").count(), 0);
    await saveNow(); assert.equal(find("txt000000001"), null);
  });

  test("clavier et mouvement : focus rendu après Échap, mouvement réduit respecté, aucune erreur de console", async () => {
    await openEditor();
    await pick("hed000000001");
    await barBtn("more").focus(); await page.keyboard.press("Enter"); await page.locator(".pb-menu:not([hidden])").waitFor();
    await page.keyboard.press("ArrowDown"); await page.keyboard.press("Escape"); await wait(300);
    assert.equal(await page.locator(".pb-menu:not([hidden])").count(), 0);
    assert.equal(await page.evaluate(() => document.activeElement && document.activeElement.getAttribute("data-action")), "more", "le focus revient sur le bouton qui a ouvert le menu");
    // mouvement réduit : plus d'animation sur la barre
    await openEditor({ reduced: true, same: true });
    await pick("hed000000001"); await bar().waitFor();
    assert.ok(await page.evaluate(() => parseFloat(getComputedStyle(document.querySelector(".pb-cbar")).animationDuration) < 0.001), "durée nulle en mouvement réduit");
    // mouvement normal : une animation d'apparition existe, sur transform/opacité seulement
    await openEditor({ same: true });
    const kf = await page.evaluate(() => { const out = []; for (const sh of document.styleSheets) { try { for (const r of sh.cssRules) if (r.type === CSSRule.KEYFRAMES_RULE && /^kol-scale-in$/.test(r.name)) out.push(r.cssText); } catch (e) { /* feuille externe */ } } return out.join(""); });
    assert.ok(kf && !/width|height|top|left|margin|padding/.test(kf), "keyframes : transform / opacity seulement → " + kf.slice(0, 120));
    assert.deepEqual(errors, [], errors.join("\n"));
  });
});
