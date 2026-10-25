// CHAPITRES (programme d'une formation) : structure, renommage, ordre persistant, déplacements clavier/tactile, isolation, accessibilité,
// puis mesures dans un vrai Chrome (320 à 1920 px, clavier, repli, renommage, déplacements enregistrés, échec d'enregistrement).
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { startServer, loginInstructor, newStudent, createCourse, Client } = require("./helpers");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : mesures navigateur non exécutées sur cette machine" : false;

let srv, prof, other, course;
const rows = (sql, ...a) => { const db = srv.db(); const r = db.prepare(sql).all(...a); db.close(); return r; };
const J = async (client, url, json) => {
  const r = await client.request(url, { method: "POST", json, headers: { Accept: "application/json" } });
  let parsed = {}; try { parsed = JSON.parse(r.text); } catch { /* réponse non JSON (redirection, page d'erreur) */ }
  return Object.assign(r, { json: parsed });
};
const sections = (id) => rows("SELECT id, title, position FROM sections WHERE course_id = ? ORDER BY position, id", id);
const lessons = (sid) => rows("SELECT id, title, position FROM lessons WHERE section_id = ? ORDER BY position, id", sid);

before(async () => {
  srv = await startServer();
  prof = await loginInstructor(srv);
  const second = await newStudent(srv);
  const db = srv.db(); db.prepare("UPDATE users SET role = 'formateur' WHERE email = ?").run(second.email); db.close();
  other = await new Client(srv.base).login(second.email, "MotDePasseEleve123"); // le rôle est relu à la connexion
  course = await createCourse(prof, srv, { title: "Programme refondu", price: 0, publish: false, lessons: [{ title: "Alpha" }, { title: "Beta" }, { title: "Gamma" }] });
  await prof.post(`/formateur/cours/${course.id}/sections`, { title: "Deuxième chapitre" });
  await prof.post(`/formateur/cours/${course.id}/sections`, { title: "Troisième chapitre" });
});
after(async () => { await srv.stop(); });

describe("chapitres : structure de la page", () => {
  test("chapitres repliables, numérotés, avec nombre réel de sous-chapitres ; aucun confirm() natif ni formulaire imbriqué", async () => {
    const t = (await prof.get(`/formateur/cours/${course.id}/curriculum?lecon=${course.lessons[0].id}`)).text;
    assert.match(t, /data-cur-fold[^>]*aria-expanded="true"[^>]*aria-controls="chapter-body-\d+"/);
    assert.match(t, /3 sous-chapitres/);
    assert.match(t, /3 chapitres · 3 sous-chapitres/);
    assert.match(t, /aria-current="page"/, "le sous-chapitre ouvert est annoncé");
    assert.doesNotMatch(t, /confirm\(/, "plus de confirm() natif");
    assert.match(t, /<dialog class="cur-dialog"/);
    assert.match(t, /<select id="f-lesson-section" name="section_id">/);
    // un <form> ne contient jamais un autre <form>
    let depth = 0; let max = 0;
    for (const m of t.matchAll(/<(\/?)form\b/g)) { depth += m[1] ? -1 : 1; max = Math.max(max, depth); }
    assert.equal(max, 1, "aucun formulaire imbriqué");
    // chaque bouton d'icône a un nom accessible
    for (const m of t.matchAll(/<button type="(?:submit|button)" class="cur-tool[^"]*"([^>]*)>/g)) assert.match(m[1], /aria-label="[^"]+"/);
  });
  test("chapitre vide : message honnête ; formation sans chapitre : consigne claire", async () => {
    const t = (await prof.get(`/formateur/cours/${course.id}/curriculum`)).text;
    assert.match(t, /Aucun sous-chapitre dans ce chapitre\./);
    const empty = await createCourse(prof, srv, { title: "Sans chapitre", price: 0, publish: false, lessons: [] });
    const db = srv.db(); db.prepare("DELETE FROM sections WHERE course_id = ?").run(empty.id); db.close();
    assert.match((await prof.get(`/formateur/cours/${empty.id}/curriculum`)).text, /Aucun chapitre pour l'instant/);
  });
});

describe("chapitres : renommer, créer, valider", () => {
  test("renommer un chapitre : enregistré, titre normalisé et borné à 120 caractères", async () => {
    const [s1] = sections(course.id);
    let r = await J(prof, `/formateur/sections/${s1.id}/renommer`, { title: "  Bases   et  principes  " });
    assert.equal(r.status, 200); assert.equal(r.json.title, "Bases et principes");
    assert.equal(sections(course.id)[0].title, "Bases et principes");
    r = await J(prof, `/formateur/sections/${s1.id}/renommer`, { title: "x".repeat(400) });
    assert.equal(sections(course.id)[0].title.length, 120);
    r = await J(prof, `/formateur/sections/${s1.id}/renommer`, { title: "   " });
    assert.equal(r.status, 400); assert.match(r.json.error, /obligatoire/);
    assert.equal(sections(course.id)[0].title.length, 120, "un titre vide ne remplace rien");
    await J(prof, `/formateur/sections/${s1.id}/renommer`, { title: "Chapitre 1" });
  });
  test("création : titre vide refusé (JSON 400), caractères de contrôle retirés, texte HTML échappé à l'affichage", async () => {
    const before = sections(course.id).length;
    let r = await J(prof, `/formateur/cours/${course.id}/sections`, { title: "   " });
    assert.equal(r.status, 400); assert.equal(sections(course.id).length, before);
    r = await J(prof, `/formateur/cours/${course.id}/sections`, { title: "<b>Gras</b>\u0007\nligne" });
    assert.equal(r.status, 201);
    assert.equal(sections(course.id).at(-1).title, "<b>Gras</b> ligne");
    assert.doesNotMatch((await prof.get(`/formateur/cours/${course.id}/curriculum`)).text, /<b>Gras<\/b>/);
    await prof.post(`/formateur/sections/${r.json.id}/supprimer`, {});
    assert.equal(sections(course.id).length, before);
  });
  test("titre de sous-chapitre vide refusé sans rien créer", async () => {
    const s = sections(course.id)[0]; const n = lessons(s.id).length;
    const r = await J(prof, `/formateur/sections/${s.id}/lecons`, { title: "  " });
    assert.equal(r.status, 400); assert.equal(lessons(s.id).length, n);
  });
});

describe("chapitres : ordre enregistré (et refus des ordres incohérents)", () => {
  test("réordonner les chapitres : l'ordre persiste ; un chapitre manquant, en trop, doublé ou étranger est refusé sans rien changer", async () => {
    const ids = sections(course.id).map((s) => s.id);
    const reversed = [...ids].reverse();
    assert.equal((await J(prof, `/formateur/cours/${course.id}/sections/reorder`, { order: reversed })).status, 200);
    assert.deepEqual(sections(course.id).map((s) => s.id), reversed);
    for (const bad of [[ids[0]], [...ids, 999999], [ids[0], ids[0], ids[1]], ["abc", ...ids.slice(1)], "x"]) {
      const r = await J(prof, `/formateur/cours/${course.id}/sections/reorder`, { order: bad });
      assert.equal(r.status, 400, JSON.stringify(bad));
    }
    assert.deepEqual(sections(course.id).map((s) => s.id), reversed, "l'ordre précédent est intact");
    await J(prof, `/formateur/cours/${course.id}/sections/reorder`, { order: ids });
  });
  test("réordonner les sous-chapitres et en déplacer un vers un autre chapitre ; les positions restent contiguës", async () => {
    const [s1, s2] = sections(course.id); const [a, b, g] = lessons(s1.id);
    await J(prof, `/formateur/sections/${s1.id}/lecons/reorder`, { order: [g.id, a.id, b.id] });
    assert.deepEqual(lessons(s1.id).map((l) => l.title), ["Gamma", "Alpha", "Beta"]);
    await J(prof, `/formateur/sections/${s2.id}/lecons/reorder`, { order: [a.id] });
    assert.deepEqual(lessons(s2.id).map((l) => l.title), ["Alpha"]);
    assert.deepEqual(lessons(s1.id).map((l) => [l.title, l.position]), [["Gamma", 0], ["Beta", 1]], "le chapitre d'origine est renuméroté");
    await J(prof, `/formateur/sections/${s1.id}/lecons/reorder`, { order: [a.id, g.id, b.id] });
    assert.deepEqual(lessons(s1.id).map((l) => l.title), ["Alpha", "Gamma", "Beta"]);
    assert.equal(lessons(s2.id).length, 0);
  });
  test("monter / descendre (clavier, tactile) : chapitres et sous-chapitres, passage au chapitre voisin en bout de liste, extrémités sans effet", async () => {
    const secs = sections(course.id);
    await J(prof, `/formateur/sections/${secs[0].id}/deplacer`, { direction: "haut" });
    assert.deepEqual(sections(course.id).map((s) => s.id), secs.map((s) => s.id), "le premier chapitre ne monte pas");
    await J(prof, `/formateur/sections/${secs[0].id}/deplacer`, { direction: "bas" });
    assert.deepEqual(sections(course.id).map((s) => s.id), [secs[1].id, secs[0].id, secs[2].id]);
    await J(prof, `/formateur/sections/${secs[0].id}/deplacer`, { direction: "haut" });
    assert.equal(sections(course.id)[0].id, secs[0].id);
    assert.equal((await J(prof, `/formateur/sections/${secs[0].id}/deplacer`, { direction: "n'importe" })).status, 400);

    const [x, y, z] = lessons(secs[0].id);
    await J(prof, `/formateur/lecons/${y.id}/deplacer`, { direction: "haut" });
    assert.deepEqual(lessons(secs[0].id).map((l) => l.id), [y.id, x.id, z.id]);
    await J(prof, `/formateur/lecons/${z.id}/deplacer`, { direction: "bas" });
    assert.deepEqual(lessons(secs[1].id).map((l) => l.id), [z.id], "le dernier sous-chapitre passe au début du chapitre suivant");
    await J(prof, `/formateur/lecons/${z.id}/deplacer`, { direction: "haut" });
    assert.deepEqual(lessons(secs[0].id).map((l) => l.id), [y.id, x.id, z.id], "et revient à la fin du précédent");
    assert.deepEqual(lessons(secs[0].id).map((l) => l.position), [0, 1, 2]);
    // sans JavaScript : redirection vers le programme
    const r = await prof.post(`/formateur/lecons/${y.id}/deplacer`, { direction: "bas" });
    assert.equal(r.status, 302); assert.match(r.location, /\/curriculum\?lecon=/);
  });
  test("changer le chapitre d'un sous-chapitre depuis son éditeur", async () => {
    const [s1, s2] = sections(course.id); const first = lessons(s1.id)[0];
    const fd = new FormData(); fd.append("title", first.title); fd.append("section_id", String(s2.id));
    await prof.request(`/formateur/lecons/${first.id}/modifier`, { method: "POST", multipart: fd });
    assert.ok(lessons(s2.id).some((l) => l.id === first.id));
    const back = new FormData(); back.append("title", first.title); back.append("section_id", String(s1.id));
    await prof.request(`/formateur/lecons/${first.id}/modifier`, { method: "POST", multipart: back });
    assert.ok(lessons(s1.id).some((l) => l.id === first.id));
  });
});

describe("chapitres : droits et isolation entre formateurs", () => {
  test("un autre formateur ne peut ni voir, ni renommer, ni déplacer, ni supprimer, ni réordonner", async () => {
    const [s1] = sections(course.id); const lesson = lessons(s1.id)[0];
    const snapshot = JSON.stringify([sections(course.id), lessons(s1.id)]);
    assert.equal((await other.get(`/formateur/cours/${course.id}/curriculum`)).status, 404);
    for (const [url, body] of [
      [`/formateur/sections/${s1.id}/renommer`, { title: "Piraté" }],
      [`/formateur/sections/${s1.id}/deplacer`, { direction: "bas" }],
      [`/formateur/lecons/${lesson.id}/deplacer`, { direction: "bas" }],
      [`/formateur/sections/${s1.id}/supprimer`, {}],
      [`/formateur/lecons/${lesson.id}/supprimer`, {}],
      [`/formateur/cours/${course.id}/sections`, { title: "Intrus" }],
      [`/formateur/cours/${course.id}/sections/reorder`, { order: [] }],
    ]) assert.equal((await J(other, url, body)).status, 404, url);
    assert.equal(JSON.stringify([sections(course.id), lessons(s1.id)]), snapshot, "rien n'a bougé");
  });
  test("un sous-chapitre d'une AUTRE formation ne peut pas être déposé dans ce chapitre", async () => {
    const foreign = await createCourse(prof, srv, { title: "Autre formation", price: 0, publish: false, lessons: [{ title: "Étrangère" }] });
    const [s1] = sections(course.id); const before = JSON.stringify(lessons(s1.id));
    const r = await J(prof, `/formateur/sections/${s1.id}/lecons/reorder`, { order: [foreign.lessons[0].id, ...lessons(s1.id).map((l) => l.id)] });
    assert.equal(r.status, 400);
    assert.equal(JSON.stringify(lessons(s1.id)), before);
    assert.equal(lessons(foreign.sectionId).length, 1, "la leçon étrangère n'a pas bougé");
  });
  test("session absente : redirection vers la connexion, aucune écriture", async () => {
    const anon = new Client(srv.base); const [s1] = sections(course.id);
    const r = await J(anon, `/formateur/sections/${s1.id}/renommer`, { title: "Anonyme" });
    assert.ok([301, 302, 401, 403].includes(r.status), String(r.status));
    assert.notEqual(sections(course.id)[0].title, "Anonyme");
  });
  test("supprimer un chapitre renumérote les autres ; la page apprenant garde l'ordre", async () => {
    await prof.post(`/formateur/cours/${course.id}/sections`, { title: "Éphémère" });
    const eph = sections(course.id).at(-1);
    await prof.post(`/formateur/sections/${eph.id}/supprimer`, {});
    assert.deepEqual(sections(course.id).map((s) => s.position), sections(course.id).map((_, i) => i));
  });
});

describe("chapitres (navigateur)", { skip: SKIP }, () => {
  let browser, big;
  const open = async (w, h = 900, touch = false) => {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: touch });
    await ctx.addCookies([...prof.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    const page = await ctx.newPage(); page.errors = [];
    page.on("pageerror", (e) => page.errors.push(e.message));
    page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) page.errors.push(m.text().slice(0, 160)); });
    return page;
  };
  before(async () => {
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
    big = await createCourse(prof, srv, { title: "Très grand programme avec un titre particulièrement long pour tester la coupure des lignes dans le plan", price: 0, publish: false, lessons: [] });
    const db = srv.db();
    const insSec = db.prepare("INSERT INTO sections (course_id, title, position) VALUES (?, ?, ?)");
    const insLes = db.prepare("INSERT INTO lessons (section_id, title, duration_minutes, position) VALUES (?, ?, 4, ?)");
    for (let i = 0; i < 20; i++) {
      const sid = Number(insSec.run(big.id, i === 2 ? "Un chapitre au titre exagérément long qui doit passer à la ligne sans jamais chevaucher les boutons d'action ni sortir de la colonne" : `Chapitre ${i + 1}`, i + 1).lastInsertRowid);
      for (let j = 0; j < 6; j++) insLes.run(sid, j === 1 && i === 2 ? "Un sous-chapitre au titre très très long qui doit être tronqué avec des points de suspension" : `Leçon ${i + 1}.${j + 1}`, j);
    }
    db.close();
  });
  after(async () => { if (browser) await browser.close(); });

  for (const w of [320, 360, 390, 430, 768, 1024, 1280, 1440, 1920]) {
    test(`${w} px : aucun débordement horizontal, titres longs contenus, boutons dans leur chapitre`, async () => {
      const page = await open(w, 800, w <= 768);
      await page.goto(`${srv.base}/formateur/cours/${big.id}/curriculum`);
      await page.locator(".chapter-block").first().waitFor();
      const m = await page.evaluate(() => {
        const out = { over: document.documentElement.scrollWidth - document.documentElement.clientWidth, bad: [] };
        const outline = document.querySelector(".builder-outline").getBoundingClientRect();
        document.querySelectorAll(".chapter-block-header").forEach((h) => {
          const hb = h.getBoundingClientRect();
          h.querySelectorAll(".cur-tool, .cur-fold, .cur-num").forEach((el) => { const b = el.getBoundingClientRect(); if (b.right > hb.right + 1 || b.left < hb.left - 1 || b.right > outline.right + 1) out.bad.push(el.className); });
          const t = h.querySelector(".chapter-name").getBoundingClientRect(), a = h.querySelector(".cur-actions").getBoundingClientRect();
          const crossX = t.right > a.left + 1 && a.right > t.left + 1, crossY = t.bottom > a.top + 1 && a.bottom > t.top + 1;
          if (crossX && crossY) out.bad.push("titre sur boutons");
        });
        return out;
      });
      assert.equal(m.over, 0, "pas de défilement horizontal"); assert.deepEqual(m.bad, []);
      assert.deepEqual(page.errors, []);
      await page.context().close();
    });
  }

  test("tactile : cibles de 44 px pour replier, renommer, monter, descendre, supprimer", async () => {
    const page = await open(390, 800, true);
    await page.goto(`${srv.base}/formateur/cours/${big.id}/curriculum`);
    const small = await page.evaluate(() => [...document.querySelectorAll(".chapter-block-header .cur-tool, .chapter-block-header .cur-fold, .cur-lesson .cur-tool")].filter((e) => e.getBoundingClientRect().width < 43.5 || e.getBoundingClientRect().height < 43.5).length);
    assert.equal(small, 0);
    await page.context().close();
  });

  test("replier / déplier : état annoncé, mémorisé après rechargement ; le chapitre ouvert reste déplié", async () => {
    const page = await open(1440);
    await page.goto(`${srv.base}/formateur/cours/${big.id}/curriculum`);
    const first = page.locator(".chapter-block").first();
    const btn = first.locator("[data-cur-fold]");
    await btn.click();
    assert.equal(await btn.getAttribute("aria-expanded"), "false");
    assert.equal(await first.locator(".chapter-body").isVisible(), false);
    await page.reload();
    assert.equal(await page.locator(".chapter-block").first().locator("[data-cur-fold]").getAttribute("aria-expanded"), "false", "mémorisé");
    await page.locator("[data-cur-toggle-all]").click();
    assert.equal(await page.locator(".chapter-block.is-folded").count(), await page.locator(".chapter-block").count());
    await page.locator("[data-cur-toggle-all]").click();
    assert.equal(await page.locator(".chapter-block.is-folded").count(), 0);
    await page.context().close();
  });

  test("renommer sur place : Entrée enregistre en base, Échap annule, titre vide refusé", async () => {
    const page = await open(1440);
    await page.goto(`${srv.base}/formateur/cours/${big.id}/curriculum`);
    const block = page.locator(".chapter-block").first(); const id = await block.getAttribute("data-section-id");
    const original = rows("SELECT title FROM sections WHERE id = ?", id)[0].title;
    await block.locator("[data-cur-rename]").click();
    await page.locator(".cur-rename").fill("Brouillon abandonné"); await page.keyboard.press("Escape");
    assert.equal(rows("SELECT title FROM sections WHERE id = ?", id)[0].title, original, "Échap annule");
    assert.equal(await block.locator("[data-cur-title]").textContent(), original);
    await block.locator("[data-cur-rename]").click();
    await page.locator(".cur-rename").fill("Introduction renommée"); await page.keyboard.press("Enter");
    await page.waitForFunction((i) => document.querySelector(`[data-section-id="${i}"] [data-cur-title]`).textContent === "Introduction renommée", id);
    await page.waitForFunction(() => /Chapitre renommé/.test(document.querySelector("[data-cur-status]").textContent));
    assert.equal(rows("SELECT title FROM sections WHERE id = ?", id)[0].title, "Introduction renommée");
    await block.locator("[data-cur-rename]").click();
    await page.locator(".cur-rename").fill(""); await page.keyboard.press("Enter");
    await page.waitForFunction(() => /obligatoire/.test(document.querySelector("[data-cur-status]").textContent));
    assert.equal(rows("SELECT title FROM sections WHERE id = ?", id)[0].title, "Introduction renommée");
    await page.context().close();
  });

  test("monter / descendre au clavier : l'ordre est enregistré, le focus suit le bouton, la numérotation est à jour", async () => {
    const page = await open(1440);
    await page.goto(`${srv.base}/formateur/cours/${big.id}/curriculum`);
    const second = page.locator(".chapter-block").nth(1); const secondId = await second.getAttribute("data-section-id");
    await second.locator(".chapter-block-header [data-cur-move='up']").focus();
    await page.keyboard.press("Enter");
    await page.waitForFunction(() => /Ordre des chapitres enregistré/.test(document.querySelector("[data-cur-status]").textContent));
    assert.equal(await page.locator(".chapter-block").first().getAttribute("data-section-id"), secondId);
    assert.equal(await page.locator(".chapter-block").first().locator("[data-cur-num]").textContent(), "1");
    assert.equal(rows("SELECT id FROM sections WHERE course_id = ? ORDER BY position, id", big.id)[0].id, Number(secondId));
    // le focus reste sur un bouton de déplacement du chapitre déplacé
    assert.equal(await page.evaluate(() => document.activeElement.closest(".chapter-block").dataset.sectionId), secondId);
    // sous-chapitre
    const lesson = page.locator(".cur-lesson").first(); const lid = await lesson.getAttribute("data-lesson-id");
    await lesson.locator("[data-cur-move='down']").focus(); await page.keyboard.press("Enter");
    await page.waitForFunction(() => /Ordre des sous-chapitres enregistré/.test(document.querySelector("[data-cur-status]").textContent));
    const sid = await page.locator(".chapter-block").first().getAttribute("data-section-id");
    assert.equal(rows("SELECT id FROM lessons WHERE section_id = ? ORDER BY position, id", sid)[1].id, Number(lid));
    await page.reload();
    assert.equal(await page.locator(".chapter-block").first().getAttribute("data-section-id"), secondId, "l'ordre survit au rechargement");
    await page.context().close();
  });

  test("échec d'enregistrement : l'écran revient à l'ordre enregistré et le dit (jamais présenté comme un succès)", async () => {
    const page = await open(1440);
    await page.goto(`${srv.base}/formateur/cours/${big.id}/curriculum`);
    await page.route("**/sections/reorder", (r) => r.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ ok: false, error: "L'enregistrement a échoué." }) }));
    const before = await page.locator(".chapter-block").evaluateAll((els) => els.map((e) => e.dataset.sectionId));
    await page.locator(".chapter-block").nth(2).locator(".chapter-block-header [data-cur-move='up']").click();
    await page.waitForFunction(() => /échoué/.test(document.querySelector("[data-cur-status]").textContent));
    assert.deepEqual(await page.locator(".chapter-block").evaluateAll((els) => els.map((e) => e.dataset.sectionId)), before);
    assert.equal(await page.locator("[data-cur-status].is-error").count(), 1);
    await page.context().close();
  });

  test("suppression : dialogue avec le nombre exact d'éléments ; Annuler ne supprime rien, Supprimer supprime", async () => {
    const page = await open(1440);
    await page.goto(`${srv.base}/formateur/cours/${big.id}/curriculum`);
    const count = () => rows("SELECT COUNT(*) n FROM sections WHERE course_id = ?", big.id)[0].n;
    const n = count();
    const last = page.locator(".chapter-block").last();
    await last.locator("form[data-cur-confirm] button").click();
    assert.match(await page.locator("#curDialogText").textContent(), /6 sous-chapitres/);
    await page.locator("#curDialog button[value='cancel']").click();
    assert.equal(count(), n);
    await last.locator("form[data-cur-confirm] button").click();
    await Promise.all([page.waitForNavigation(), page.locator("#curDialog [data-cur-dialog-ok]").click()]);
    assert.equal(count(), n - 1);
    await page.context().close();
  });

  test("glisser-déposer à la souris : un sous-chapitre passe dans un autre chapitre et l'ordre est enregistré", async () => {
    // programme court (deux chapitres visibles sans défilement) : le geste est reproductible ; pour les longs programmes, les boutons monter / descendre font foi
    const small = await createCourse(prof, srv, { title: "Programme glisser", price: 0, publish: false, lessons: [{ title: "G1" }, { title: "G2" }] });
    await prof.post(`/formateur/cours/${small.id}/sections`, { title: "Autre" });
    const other2 = sections(small.id)[1].id;
    const db = srv.db(); for (let j = 0; j < 4; j++) db.prepare("INSERT INTO lessons (section_id, title, duration_minutes, position) VALUES (?, ?, 4, ?)").run(other2, `H${j}`, j); db.close();
    const page = await open(1440, 1100);
    await page.goto(`${srv.base}/formateur/cours/${small.id}/curriculum`);
    const src = page.locator(".cur-lesson").first(); const lid = Number(await src.getAttribute("data-lesson-id"));
    const targetBlock = page.locator(".chapter-block").nth(1);
    await src.locator(".lesson-item").dragTo(targetBlock.locator(".cur-lesson").nth(2));
    await page.waitForFunction(() => /enregistré|échoué|refusé|perdue/.test(document.querySelector("[data-cur-status]").textContent), null, { timeout: 15000 }).catch(() => {});
    const said = await page.locator("[data-cur-status]").textContent();
    assert.match(said, /Ordre des sous-chapitres enregistré/, `message affiché : « ${said} »`);
    assert.equal(rows("SELECT section_id s FROM lessons WHERE id = ?", lid)[0].s, other2);
    assert.deepEqual(rows("SELECT position p FROM lessons WHERE section_id = ? ORDER BY position", other2).map((r) => r.p), [0, 1, 2, 3, 4]);
    assert.deepEqual(rows("SELECT title FROM lessons WHERE section_id = ? ORDER BY position", small.sectionId).map((r) => r.title), ["G2"], "le chapitre d'origine garde ses autres sous-chapitres");
    await page.reload();
    assert.equal(await page.locator(`.cur-lesson[data-lesson-id="${lid}"]`).evaluate((el) => el.closest(".chapter-block").dataset.sectionId), String(other2), "après rechargement");
    await page.context().close();
  });

  test("mouvement réduit : aucune transition sur les commandes du plan", async () => {
    const page = await open(1440);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(`${srv.base}/formateur/cours/${big.id}/curriculum`);
    const d = await page.evaluate(() => getComputedStyle(document.querySelector(".cur-tool")).transitionDuration);
    assert.ok(d.split(",").every((x) => parseFloat(x) < 0.001), `transitions : ${d}`);
    await page.context().close();
  });
});
