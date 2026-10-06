// Formulaires étendus (Site Web, phase 5a) : options par champ (obligatoire, affichage, condition), pays, fichier joint
// (type réel, taille, stockage protégé), anti-robot temporel signé, événement « formulaire envoyé » (déclencheur).
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { TEST_KEY } = require("./marketing-helpers");
const fields = require("../src/marketing/forms/fields");
const antispam = require("../src/marketing/forms/antispam");
const { TRIGGERS } = require("../src/marketing/automations/catalog");
const { startServer, Client, loginInstructor, newStudent } = require("./helpers");

const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");

describe("règles des champs (sans serveur)", () => {
  const form = { fields: ["first_name", "country"] };
  const defs = [{ name: "prop_logiciel", type: "select", options: ["Photoshop", "Blender"], label: "Logiciel" }, { name: "prop_niveau", type: "text", label: "Niveau" }];

  test("une condition ne vise qu'un champ placé AVANT ; affichages réservés aux bons types", () => {
    assert.throws(() => fields.normalizeFieldSettings({ first_name: { showIf: { field: "country", op: "filled" } } }, form, defs), /placé AVANT/);
    assert.throws(() => fields.normalizeFieldSettings({ prop_niveau: { showIf: { field: "prop_logiciel", op: "equals" } } }, form, defs), /valeur attendue/);
    const s = fields.normalizeFieldSettings({ prop_logiciel: { display: "radio", required: "1" }, prop_niveau: { display: "radio", showIf: { field: "prop_logiciel", op: "equals", value: "Photoshop" } }, inconnu: { required: "1" } }, form, defs);
    assert.deepEqual(s, { prop_logiciel: { required: true, display: "radio" }, prop_niveau: { showIf: { field: "prop_logiciel", op: "equals", value: "Photoshop" } } }, "radio refusé sur un texte, champ inconnu ignoré");
  });

  test("champ caché : ni exigé ni gardé ; un champ dont la condition dépend d'un champ caché est caché aussi", () => {
    const f = { ...form, fieldSettings: { prop_logiciel: { showIf: { field: "country", op: "equals", value: "France" } }, prop_niveau: { required: true, showIf: { field: "prop_logiciel", op: "equals", value: "Photoshop" } } } };
    const label = (x) => x.key;
    let r = fields.applySettings(f, defs, { country: "Congo", prop_logiciel: "Photoshop" }, label);
    assert.equal(r.ok, true);
    assert.deepEqual([...r.hidden].sort(), ["prop_logiciel", "prop_niveau"]);
    r = fields.applySettings(f, defs, { country: "France", prop_logiciel: "Photoshop", prop_niveau: "" }, label);
    assert.equal(r.ok, false);
    assert.match(r.message, /prop_niveau » est obligatoire/);
  });

  test("type réel du fichier lu dans son contenu", () => {
    assert.equal(fields.sniffMime(PNG), "image/png");
    assert.equal(fields.sniffMime(Buffer.from("%PDF-1.7 contenu")), "application/pdf");
    assert.equal(fields.sniffMime(Buffer.from("<script>alert(1)</script>")), null);
  });

  test("anti-robot : jeton signé, refusé s'il est faux ou trop récent", () => {
    const t = antispam.issue(Date.now() - 3000);
    assert.equal(antispam.check(t), true);
    assert.equal(antispam.check(antispam.issue()), false, "moins de 2 secondes");
    assert.equal(antispam.check(t.replace(/.$/, (c) => (c === "A" ? "B" : "A"))), false, "signature modifiée");
    assert.equal(antispam.check(""), false);
  });

  test("déclencheur de scénario « Un formulaire est envoyé », filtrable par formulaire", () => {
    assert.deepEqual(TRIGGERS["form.submitted"].filters.map(([k]) => k), ["formId"]);
  });
});

describe("formulaire étendu (vrai serveur)", () => {
  let srv, boss, db, formId, slug;
  const row = (sql, ...a) => db.prepare(sql).get(...a);
  const configure = (over = {}) => boss.post(`/marketing/formulaires/${formId}`, {
    name: "Inscription atelier", consentText: "J'accepte de recevoir les informations de l'atelier.", "fields[0]": "first_name", "fields[1]": "country", "propertyFields[0]": "logiciel", "propertyFields[1]": "projet",
    fsShown: "1", "fs[first_name][required]": "1", "fs[prop_logiciel][display]": "radio", "fs[prop_projet][display]": "textarea", "fs[prop_projet][required]": "1", "fs[prop_projet][field]": "prop_logiciel", "fs[prop_projet][op]": "equals", "fs[prop_projet][value]": "Photoshop",
    fileShown: "1", "file[enabled]": "1", "file[label]": "Votre portfolio", "file[accept]": "both", tags: "", redirectUrl: "", ...over,
  });
  const submit = (fields, file, extra = {}) => {
    const fd = new FormData();
    for (const [k, v] of Object.entries({ ft: srv.formToken(), consent: "1", ...fields })) fd.append(k, v);
    if (file) fd.append("file", new Blob([file.data], { type: file.type || "application/octet-stream" }), file.name);
    return new Client(srv.base).request(`/f/${slug}`, { method: "POST", multipart: fd, headers: { "x-forwarded-for": `10.7.0.${Math.floor(Math.random() * 250)}`, ...extra } });
  };

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    db = srv.db();
    await boss.post("/marketing/proprietes", { key: "logiciel", label: "Logiciel préféré", type: "select", options: "Photoshop\nBlender" });
    await boss.post("/marketing/proprietes", { key: "projet", label: "Votre projet", type: "text" });
    const r = await boss.post("/marketing/formulaires", { name: "Inscription atelier", consentText: "J'accepte de recevoir les informations de l'atelier." });
    formId = Number(r.location.match(/(\d+)$/)[1]);
    assert.equal((await configure()).status, 302);
    db.prepare("UPDATE mk_forms SET double_optin = 0 WHERE id = ?").run(formId);
    await boss.post(`/marketing/formulaires/${formId}/publier`, {});
    slug = row("SELECT slug FROM mk_forms WHERE id = ?", formId).slug;
  });
  after(() => srv.stop());

  test("configuration enregistrée ; page publique : obligatoire, radio, zone de texte, condition, pays, fichier (multipart), jeton", async () => {
    assert.ok(row("SELECT 1 FROM mk_property_defs WHERE key = 'logiciel'"), "propriété créée");
    const f = row("SELECT field_settings, file_field FROM mk_forms WHERE id = ?", formId);
    assert.deepEqual(JSON.parse(f.field_settings).prop_projet, { required: true, display: "textarea", showIf: { field: "prop_logiciel", op: "equals", value: "Photoshop" } });
    const html = (await new Client(srv.base).get(`/f/${slug}`)).text;
    assert.match(html, /enctype="multipart\/form-data"/);
    assert.match(html, /name="ft" value="\d{13}\.[A-Za-z0-9_-]{22}"/);
    assert.match(html, /Prénom <span class="req-mark"/);
    assert.match(html, /name="country" maxlength="200" autocomplete="country-name"/);
    assert.match(html, /<input type="radio" name="prop_logiciel" value="Photoshop"/);
    assert.match(html, /data-show-if="\{&#34;field&#34;:&#34;prop_logiciel&#34;,&#34;op&#34;:&#34;equals&#34;,&#34;value&#34;:&#34;Photoshop&#34;\}"><label for="f-prop-projet">Votre projet/);
    assert.match(html, /<textarea id="f-prop-projet" name="prop_projet"/);
    assert.match(html, /type="file" name="file" accept="image\/jpeg,image\/png,image\/webp,application\/pdf"/);
    assert.match(html, /src="\/js\/form-logic\.js/);
  });

  test("obligatoire vérifié par le serveur ; champ conditionnel caché : ni exigé ni enregistré", async () => {
    let r = await submit({ email: "sans-prenom@ex.fr" });
    assert.equal(r.status, 400);
    assert.match(r.text, /« Prénom » est obligatoire/);
    r = await submit({ email: "photo@ex.fr", first_name: "Awa", prop_logiciel: "Photoshop" });
    assert.match(r.text, /« Votre projet » est obligatoire/, "condition remplie : champ exigé");
    r = await submit({ email: "blender@ex.fr", first_name: "Bema", country: "Congo", prop_logiciel: "Blender", prop_projet: "Envoyé alors que caché" });
    assert.equal(r.status, 302);
    const c = row("SELECT id, country FROM mk_contacts WHERE email = 'blender@ex.fr'");
    assert.equal(c.country, "Congo");
    assert.equal(row("SELECT COUNT(*) n FROM mk_contact_property_values v JOIN mk_property_defs d ON d.id = v.property_id WHERE v.contact_id = ? AND d.key = 'projet'", c.id).n, 0, "champ caché : valeur ignorée");
  });

  test("fichier : image réelle acceptée et rangée à part ; faux fichier refusé ; téléchargement réservé à l'équipe", async () => {
    const bad = await submit({ email: "faux@ex.fr", first_name: "F", prop_logiciel: "Blender" }, { data: "<script>alert(1)</script>", name: "image.png", type: "image/png" });
    assert.equal(bad.status, 400);
    assert.match(bad.text, /Fichier refusé/);
    assert.equal(row("SELECT COUNT(*) n FROM mk_contacts WHERE email = 'faux@ex.fr'").n, 0, "rien n'est créé");
    const ok = await submit({ email: "portfolio@ex.fr", first_name: "Pat", prop_logiciel: "Photoshop", prop_projet: "Retouche" }, { data: PNG, name: "mon portfolio.png", type: "image/png" });
    assert.equal(ok.status, 302);
    const contact = row("SELECT id FROM mk_contacts WHERE email = 'portfolio@ex.fr'");
    const file = row("SELECT * FROM mk_form_files WHERE contact_id = ?", contact.id);
    assert.equal(file.mime, "image/png");
    assert.equal(file.original_name, "mon portfolio.png");
    assert.match(file.path, /^\/uploads\/forms\/1\/[a-f0-9]{24}\.png$/);
    const abs = path.join(srv.dir, "uploads", file.path.replace("/uploads/", ""));
    assert.ok(fs.existsSync(abs));
    assert.equal((await new Client(srv.base).get(file.path)).status, 404, "jamais servi publiquement");
    assert.match((await boss.get(`/marketing/contacts/${contact.id}`)).text, /Fichiers envoyés[\s\S]*mon portfolio\.png/);
    const dl = await boss.get(`/marketing/contacts/${contact.id}/fichiers/${file.id}`);
    assert.equal(dl.status, 200);
    assert.match(dl.headers.get("content-disposition"), /attachment/);
    const other = row("SELECT id FROM mk_contacts WHERE email = 'blender@ex.fr'").id;
    assert.equal((await boss.get(`/marketing/contacts/${other}/fichiers/${file.id}`)).status, 404, "fichier d'un autre contact");
    const student = await newStudent(srv);
    assert.notEqual((await student.get(`/marketing/contacts/${contact.id}/fichiers/${file.id}`)).status, 200);
    // Contact supprimé : la ligne part en cascade et le fichier est effacé du disque
    await boss.post(`/marketing/contacts/${contact.id}/effacer`, { confirm: "on" });
    assert.equal(row("SELECT COUNT(*) n FROM mk_form_files WHERE id = ?", file.id).n, 0);
    assert.equal(fs.existsSync(abs), false);
  });

  test("fichier trop lourd (plus de 5 Mo) : message clair", async () => {
    const big = Buffer.concat([PNG, Buffer.alloc(5 * 1024 * 1024 + 10)]);
    const r = await submit({ email: "lourd@ex.fr", first_name: "L", prop_logiciel: "Blender" }, { data: big, name: "gros.png", type: "image/png" });
    assert.equal(r.status, 400);
    assert.match(r.text, /5 Mo au plus/);
  });

  test("robots : sans jeton, ou envoi trop rapide → faux succès, aucun contact", async () => {
    const fd = new FormData();
    for (const [k, v] of Object.entries({ email: "robot1@ex.fr", first_name: "R", consent: "1", prop_logiciel: "Blender" })) fd.append(k, v);
    const r1 = await new Client(srv.base).request(`/f/${slug}`, { method: "POST", multipart: fd });
    assert.equal(r1.status, 302);
    const page = (await new Client(srv.base).get(`/f/${slug}`)).text;
    const fresh = page.match(/name="ft" value="([^"]+)"/)[1];
    const r2 = await submit({ email: "robot2@ex.fr", first_name: "R", prop_logiciel: "Blender", ft: fresh });
    assert.equal(r2.status, 302);
    assert.equal(row("SELECT COUNT(*) n FROM mk_contacts WHERE email IN ('robot1@ex.fr', 'robot2@ex.fr')").n, 0);
  });

  test("événement « formulaire envoyé » (formulaire, page d'origine) ; pop-up refusé pour un formulaire avec fichier", async () => {
    const ev = db.prepare("SELECT metadata FROM mk_events WHERE name = 'form.submitted' ORDER BY id DESC LIMIT 1").get();
    const meta = JSON.parse(ev.metadata);
    assert.equal(meta.formId, String(formId));
    assert.equal(meta.page, `/f/${slug}`);
    assert.equal(meta.pending, false);
    const r = await configure({ popupEnabled: "1" });
    const html = (await boss.get(r.location)).text;
    assert.match(html, /ne peut pas s&#39;afficher en pop-up|ne peut pas s'afficher en pop-up/);
    assert.equal(row("SELECT popup_enabled p FROM mk_forms WHERE id = ?", formId).p, 0);
  });
});
