// Marketing M1d (2/2) — import de contacts : aperçu, correspondance, analyse à blanc, exécution, consentement, reprise.
const { test, describe, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { freshMarketing } = require("./marketing-helpers");
const audience = require("../src/marketing/audience");
const compliance = require("../src/marketing/compliance");
const imports = require("../src/marketing/import");
const { createWorker } = require("../src/marketing/queue/worker");
const { enqueue } = require("../src/marketing/queue/jobs");

let m, A, B;
const code = (fn) => { try { fn(); } catch (e) { return e.code; } return null; };
const HEADER = "E-mail,Prénom,Nom,Téléphone,Société,Pays\n";
const FILE = HEADER + [
  "marie@ex.fr,Marie,Dupont,0601020304,Acme,FR",
  "jean@ex.fr,Jean,Martin,,,TG",
  "pas-un-email,Zoé,X,,,FR",
  "MARIE@ex.fr,Doublon,Dans Le Fichier,,,FR",
  "bloque@ex.fr,Bob,Bloqué,,,FR",
].join("\n");
const MAPPING = ["email", "first_name", "last_name", "phone", "company", "country"];
const preview = (ctx, text = FILE, extra = {}) => imports.previewImport(ctx, { filename: "contacts.csv", data: Buffer.from(text, "utf8"), ...extra });
const count = (t, where = "1=1") => m.db.prepare(`SELECT COUNT(*) n FROM ${t} WHERE ${where}`).get().n;

beforeEach(() => {
  m = freshMarketing(); A = m.A; B = m.B;
  compliance.addSuppression(A, { email: "bloque@ex.fr", reason: "manual" });
});

describe("aperçu", () => {
  test("en-têtes, échantillon, total, séparateur, correspondance suggérée ; RIEN n'est créé", () => {
    const p = preview(A);
    assert.deepEqual(p.headers, ["E-mail", "Prénom", "Nom", "Téléphone", "Société", "Pays"]);
    assert.equal(p.totalRows, 5);
    assert.equal(p.sample.length, 5);
    assert.equal(p.delimiter, ",");
    assert.deepEqual(p.suggestedMapping, MAPPING);
    assert.equal(count("mk_contacts"), 0);
    assert.equal(count("mk_imports"), 1);
  });
  test("l'échantillon est limité à 10 lignes", () => {
    const rows = Array.from({ length: 30 }, (_, i) => `u${i}@x.fr,N${i}`).join("\n");
    assert.equal(preview(A, `email,nom\n${rows}`).sample.length, 10);
  });
  test("fichier Excel français : point-virgule et Windows-1252", () => {
    const data = Buffer.concat([Buffer.from("E-mail;Prénom\n", "latin1"), Buffer.from("a@b.fr;Zoé\n", "latin1")]);
    const p = imports.previewImport(A, { filename: "x.csv", data });
    assert.equal(p.delimiter, ";");
    assert.deepEqual(p.headers, ["E-mail", "Prénom"]);
    assert.equal(p.sample[0][1], "Zoé");
  });
  test("propriétés personnalisées reconnues par leur clé ou leur libellé", () => {
    audience.defineProperty(A, { key: "ville", label: "Ville de résidence", type: "text" });
    assert.deepEqual(preview(A, "email,Ville de résidence,inconnue\na@b.fr,Lomé,x").suggestedMapping, ["email", "property:ville", "ignore"]);
  });
  test("une cible n'est proposée qu'une fois (la première colonne gagne)", () => {
    assert.deepEqual(preview(A, "email,e-mail secondaire\na@b.fr,b@c.fr").suggestedMapping, ["email", "ignore"]);
  });
  test("refus : fichier vide, en-tête seul, trop gros, trop de lignes", () => {
    assert.equal(code(() => preview(A, "")), "invalid_csv");
    assert.equal(code(() => preview(A, "email,nom\n")), "invalid_csv");
    assert.equal(code(() => preview(A, "email\na@b.fr", { limits: { maxBytes: 5 } })), "csv_too_large");
    assert.equal(code(() => preview(A, "email\na@b.fr\nb@b.fr", { limits: { maxRows: 1 } })), "csv_too_large");
    assert.equal(code(() => imports.previewImport(A, { filename: "x.csv", data: 42 })), "invalid_csv");
  });
  test("nom de fichier nettoyé (jamais de chemin)", () => {
    preview(A, FILE, { filename: "../../etc/passwd.csv" });
    assert.equal(m.db.prepare("SELECT filename FROM mk_imports").get().filename, "passwd.csv");
  });
});

describe("correspondance des colonnes", () => {
  const bad = (mapping, pattern) => {
    const id = preview(A).id;
    let error;
    try { imports.analyzeImport(A, id, { mapping }); } catch (e) { error = e; }
    assert.ok(error, JSON.stringify(mapping));
    assert.equal(error.code, "invalid_mapping");
    if (pattern) assert.match(error.message, pattern);
  };
  test("une colonne e-mail est obligatoire, une seule ; une cible ne sert qu'une fois", () => {
    bad(["ignore", "first_name", "last_name", "phone", "company", "country"], /e-mail/i);
    bad(["email", "email", "last_name", "phone", "company", "country"], /une seule fois|plusieurs/i);
    bad(["email", "first_name", "first_name", "phone", "company", "country"], /une seule fois|plusieurs/i);
  });
  test("cible inconnue, statut, longueur incorrecte, propriété inconnue : refusés", () => {
    bad(["email", "status", "last_name", "phone", "company", "country"], /statut/i);
    bad(["email", "mot_de_passe", "last_name", "phone", "company", "country"], /cible|inconnu/i);
    bad(["email", "property:nope", "last_name", "phone", "company", "country"], /propriété/i);
    bad(["email"], /colonne/i);
    bad("email", /colonne|liste/i);
  });
});

describe("analyse à blanc : rien n'est écrit, tout est expliqué", () => {
  test("catégories, numéros de ligne, exemples ; la base est inchangée", () => {
    audience.upsertContact(A, { email: "jean@ex.fr" });
    const before = count("mk_contacts");
    const id = preview(A).id;
    const rep = imports.analyzeImport(A, id, { mapping: MAPPING });
    assert.equal(rep.total, 5);
    assert.equal(rep.willCreate, 1); // marie
    assert.equal(rep.willUpdate, 1); // jean existe déjà
    assert.equal(rep.invalid, 1);
    assert.equal(rep.duplicatesInFile, 1);
    assert.equal(rep.suppressed, 1);
    assert.deepEqual(rep.examples.invalid[0], { line: 4, email: "pas-un-email", reason: rep.examples.invalid[0].reason });
    assert.match(rep.examples.invalid[0].reason, /@/);
    assert.deepEqual(rep.examples.duplicatesInFile[0], { line: 5, email: "marie@ex.fr", firstLine: 2 });
    assert.equal(count("mk_contacts"), before);
    assert.equal(count("mk_import_rejects"), 0);
  });
  test("les valeurs de propriétés invalides sont signalées à l'analyse", () => {
    audience.defineProperty(A, { key: "age", label: "Âge", type: "number" });
    const id = preview(A, "email,age\na@b.fr,34\nc@d.fr,abc").id;
    const rep = imports.analyzeImport(A, id, { mapping: ["email", "property:age"] });
    assert.equal(rep.invalid, 1);
    assert.match(rep.examples.invalid[0].reason, /âge|age/i);
  });
  test("les statuts existants sont annoncés (désinscrits jamais réabonnés)", () => {
    const c = audience.upsertContact(A, { email: "jean@ex.fr" }).contact;
    compliance.unsubscribe(A, c.id, { source: "link" });
    const rep = imports.analyzeImport(A, preview(A).id, { mapping: MAPPING, options: { consent: { declared: true, confirm: true, text: "Inscrits au salon de mars 2026 (papier)" } } });
    assert.equal(rep.blockedUnsubscribed, 1);
  });
});

describe("exécution", () => {
  test("par défaut : contacts créés « unknown », AUCUN consentement inventé, complétés sans écrasement", () => {
    audience.upsertContact(A, { email: "jean@ex.fr", first_name: "Jeannot" });
    const id = preview(A).id;
    const rep = imports.runImport(A, id, { mapping: MAPPING });
    assert.deepEqual([rep.created, rep.updated, rep.invalid, rep.duplicatesInFile, rep.suppressed, rep.subscribed], [1, 1, 1, 1, 1, 0]);
    const marie = audience.findByEmail(A, "marie@ex.fr");
    assert.deepEqual([marie.status, marie.first_name, marie.company, marie.source], ["unknown", "Marie", "Acme", "import"]);
    assert.equal(count("mk_consents"), 0);
    const jean = audience.findByEmail(A, "jean@ex.fr");
    assert.deepEqual([jean.first_name, jean.last_name, jean.country], ["Jeannot", "Martin", "TG"]);
    assert.equal(audience.findByEmail(A, "bloque@ex.fr"), null, "une adresse supprimée n'est pas importée");
  });
  test("rapport final enregistré, lignes rejetées conservées avec leur raison, fichier vidé", () => {
    const id = preview(A).id;
    imports.runImport(A, id, { mapping: MAPPING });
    const row = m.db.prepare("SELECT * FROM mk_imports WHERE id = ?").get(id);
    assert.deepEqual([row.status, row.processed_rows, row.total_rows, row.source_text], ["done", 5, 5, ""]);
    assert.ok(row.finished_at);
    const rejects = m.db.prepare("SELECT line, email, reason FROM mk_import_rejects ORDER BY line").all();
    assert.deepEqual(rejects.map((r) => r.line), [4, 5, 6]);
    assert.match(rejects[0].reason, /@/);
    assert.match(rejects[1].reason, /doublon|déjà/i);
    assert.match(rejects[2].reason, /suppression/i);
    const csv = imports.rejectsCsv(A, id);
    assert.match(csv, /^ligne,e-mail,raison,/);
    assert.match(csv, /pas-un-email/);
  });
  test("pas de tempête d'événements : un seul événement contacts.imported, aucun contact.created", () => {
    imports.runImport(A, preview(A).id, { mapping: MAPPING });
    const names = m.db.prepare("SELECT name FROM mk_events").all().map((e) => e.name);
    assert.deepEqual(names, ["contacts.imported"]);
  });
  test("audit : une entrée de début et une de fin, sans e-mail", () => {
    imports.runImport(A, preview(A).id, { mapping: MAPPING });
    const rows = m.db.prepare("SELECT action, metadata FROM mk_audit_logs WHERE resource_type = 'import' ORDER BY id").all();
    assert.deepEqual(rows.map((r) => r.action), ["import.started", "import.completed"]);
    assert.ok(!rows.some((r) => /@/.test(r.metadata)));
  });
  test("on ne peut pas exécuter deux fois le même import", () => {
    const id = preview(A).id;
    imports.runImport(A, id, { mapping: MAPPING });
    assert.equal(code(() => imports.runImport(A, id, { mapping: MAPPING })), "already_done");
  });
  test("options : liste, étiquette, colonne d'étiquettes, mise à jour « écraser » ou « ignorer »", () => {
    const list = audience.createList(A, { name: "Salon" });
    audience.upsertContact(A, { email: "jean@ex.fr", first_name: "Jeannot" });
    imports.runImport(A, preview(A, "email,prénom,tags\nmarie@ex.fr,Marie,\"vip;webinaire\"\njean@ex.fr,Jean,vip").id, {
      mapping: ["email", "first_name", "tags"], options: { listId: list.id, tag: "Import salon", updateExisting: "overwrite" },
    });
    assert.equal(audience.listMembers(A, list.id).rows.length, 2);
    assert.deepEqual(audience.tagsOf(A, audience.findByEmail(A, "marie@ex.fr").id).map((t) => t.name).sort(), ["Import salon", "vip", "webinaire"]);
    assert.equal(audience.findByEmail(A, "jean@ex.fr").first_name, "Jean");
    const skip = preview(A, "email,prénom\njean@ex.fr,Encore").id;
    const rep = imports.runImport(A, skip, { mapping: ["email", "first_name"], options: { updateExisting: "skip" } });
    assert.deepEqual([rep.updated, rep.unchanged], [0, 1]);
    assert.equal(audience.findByEmail(A, "jean@ex.fr").first_name, "Jean");
  });
  test("liste d'une autre organisation refusée avant tout traitement", () => {
    const lb = audience.createList(B, { name: "B" });
    assert.equal(code(() => imports.runImport(A, preview(A).id, { mapping: MAPPING, options: { listId: lb.id } })), "not_found");
    assert.equal(count("mk_contacts"), 0);
  });
  test("propriétés personnalisées importées ; une valeur invalide rejette la ligne SANS créer le contact", () => {
    audience.defineProperty(A, { key: "age", label: "Âge", type: "number" });
    const rep = imports.runImport(A, preview(A, "email,age\na@b.fr,34\nc@d.fr,abc").id, { mapping: ["email", "property:age"] });
    assert.deepEqual([rep.created, rep.invalid], [1, 1]);
    assert.deepEqual(audience.getContactProperties(A, audience.findByEmail(A, "a@b.fr").id), { age: 34 });
    assert.equal(audience.findByEmail(A, "c@d.fr"), null);
  });
  test("cellules en trop : la ligne est rejetée avec une raison", () => {
    const rep = imports.runImport(A, preview(A, "email,nom\na@b.fr,X,en trop\nc@d.fr,Y").id, { mapping: ["email", "last_name"] });
    assert.deepEqual([rep.created, rep.invalid], [1, 1]);
  });
});

describe("consentement déclaré à l'import", () => {
  const consent = { declared: true, confirm: true, text: "Inscrits à la newsletter du salon de mars 2026 (formulaire papier signé)" };
  test("exige la case cochée ET un texte de preuve suffisant", () => {
    const id = preview(A).id;
    assert.equal(code(() => imports.runImport(A, id, { mapping: MAPPING, options: { consent: { declared: true, text: consent.text } } })), "consent_required");
    assert.equal(code(() => imports.runImport(A, id, { mapping: MAPPING, options: { consent: { declared: true, confirm: true, text: "oui" } } })), "consent_required");
    assert.equal(count("mk_contacts"), 0);
  });
  test("abonne les nouveaux contacts avec une preuve ; ne réabonne JAMAIS un désinscrit ni une adresse supprimée", () => {
    const jean = audience.upsertContact(A, { email: "jean@ex.fr" }).contact;
    compliance.unsubscribe(A, jean.id, { source: "link" });
    const rep = imports.runImport(A, preview(A).id, { mapping: MAPPING, options: { consent } });
    assert.deepEqual([rep.created, rep.subscribed, rep.blockedUnsubscribed, rep.suppressed], [1, 1, 1, 1]);
    assert.equal(audience.findByEmail(A, "marie@ex.fr").status, "subscribed");
    assert.equal(audience.findByEmail(A, "jean@ex.fr").status, "unsubscribed");
    const [proof] = compliance.consentHistory(A, audience.findByEmail(A, "marie@ex.fr").id);
    assert.deepEqual([proof.source, proof.text_shown, proof.action], ["import", consent.text, "granted"]);
    assert.equal(compliance.isSendable(A, audience.findByEmail(A, "marie@ex.fr").id).ok, true);
    assert.equal(compliance.isSendable(A, jean.id).ok, false);
  });
});

describe("tranches et reprise", () => {
  const big = (n) => "email,nom\n" + Array.from({ length: n }, (_, i) => `u${i}@x.fr,N${i}`).join("\n");
  test("l'import se fait par tranches ; interrompu entre deux tranches, il reprend sans doublon ni perte", () => {
    const id = preview(A, big(25)).id;
    imports.startImport(A, id, { mapping: ["email", "last_name"] });
    let s = imports.runImportSlice(A, id, { maxRows: 10 });
    assert.deepEqual([s.done, s.processed], [false, 10]);
    s = imports.runImportSlice(A, id, { maxRows: 10 });
    assert.deepEqual([s.done, s.processed], [false, 20]);
    s = imports.runImportSlice(A, id, { maxRows: 10 });
    assert.equal(s.done, true);
    assert.equal(count("mk_contacts"), 25);
    assert.equal(imports.getImport(A, id).status, "done");
  });
  test("un doublon dans le fichier est détecté même s'il tombe dans une autre tranche", () => {
    const id = preview(A, "email\na@b.fr\nc@d.fr\ne@f.fr\nA@B.fr").id;
    const rep = imports.runImport(A, id, { mapping: ["email"], sliceSize: 2 });
    assert.deepEqual([rep.created, rep.duplicatesInFile], [3, 1]);
  });
  test("une erreur inattendue dans une tranche : import « failed » avec le message, rien d'à moitié écrit dans la tranche", () => {
    const id = preview(A, big(6)).id;
    imports.startImport(A, id, { mapping: ["email", "last_name"] });
    m.db.exec("CREATE TRIGGER boom BEFORE INSERT ON mk_contacts WHEN NEW.email = 'u4@x.fr' BEGIN SELECT RAISE(ABORT, 'panne simulée'); END");
    assert.throws(() => imports.runImportSlice(A, id, { maxRows: 10 }), /panne simulée/);
    const row = imports.getImport(A, id);
    assert.equal(row.status, "failed");
    assert.match(row.error, /panne simulée/);
    assert.equal(count("mk_contacts"), 0, "la tranche entière est annulée");
    m.db.exec("DROP TRIGGER boom");
    imports.resumeImport(A, id);
    assert.equal(imports.runImportSlice(A, id, { maxRows: 10 }).done, true);
    assert.equal(count("mk_contacts"), 6);
  });
  test("5 000 lignes importées en quelques secondes", () => {
    const id = preview(A, big(5000)).id;
    const t = Date.now();
    const rep = imports.runImport(A, id, { mapping: ["email", "last_name"] });
    assert.equal(rep.created, 5000);
    // Seuil large : le coût est linéaire (≈ 2 ms par ligne sur une machine de 2015, ≈ 0,5 ms sur une machine récente) ; une vraie régression (quadratique) dépasserait largement une minute
    assert.ok(Date.now() - t < 25000, `trop lent : ${Date.now() - t} ms`);
  });
  test("via la file de travail : le job « import.run » traite l'import complet", async () => {
    const id = preview(A, big(30)).id;
    imports.startImport(A, id, { mapping: ["email", "last_name"] });
    const worker = createWorker({ db: m.db, handlers: imports.jobHandlers({ db: m.db, bus: m.bus }), workerId: "t", log: { log() {}, warn() {}, error() {} } });
    enqueue(m.db, { organizationId: 1, type: "import.run", payload: { organizationId: 1, importId: id, userId: 7 }, idempotencyKey: `import:${id}` });
    await worker.drain();
    assert.equal(count("mk_contacts"), 30);
    assert.equal(imports.getImport(A, id).status, "done");
  });
});

describe("isolation entre organisations", () => {
  test("un import d'une organisation est introuvable pour une autre", () => {
    const id = preview(A).id;
    assert.equal(code(() => imports.analyzeImport(B, id, { mapping: MAPPING })), "not_found");
    assert.equal(code(() => imports.runImport(B, id, { mapping: MAPPING })), "not_found");
    assert.equal(imports.getImport(B, id), null);
    assert.equal(imports.listImports(B).length, 0);
    assert.equal(imports.listImports(A).length, 1);
  });
  test("les mêmes adresses importées dans deux organisations restent deux jeux séparés", () => {
    imports.runImport(A, preview(A, "email\na@b.fr").id, { mapping: ["email"] });
    imports.runImport(B, preview(B, "email\na@b.fr").id, { mapping: ["email"] });
    assert.equal(count("mk_contacts"), 2);
  });
});
