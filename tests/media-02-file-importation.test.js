// KOLAKISA CMS — MEDIA-02 : la LOGIQUE de la file d'importation du navigateur (public/js/media-upload.js), testée sous Node avec un transport simulé :
// validation avant envoi, états explicites, concurrence limitée, doublons, échecs isolés, nouveaux essais, annulation, « réussi » seulement après la réponse du serveur.
// (L'affichage — zone de dépôt, glisser-déposer — n'est pas testable sans navigateur : voir le rapport.)
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const U = require("../public/js/media-upload.js");
const media = require("../src/marketing/media");

const cfg = media.uploadConfig();
const file = (name, size = 1000, lastModified = 1) => ({ name, size, lastModified });
// Transport simulé : chaque envoi reste en suspens jusqu'à ce que le test le résolve ; il permet de contrôler progression, « octets partis » et réponse du serveur
function fakeTransport() {
  const jobs = [];
  const transport = (f, cb) => {
    const job = { file: f, cb, aborted: false };
    job.promise = new Promise((resolve, reject) => { job.resolve = resolve; job.reject = reject; });
    job.abort = () => { job.aborted = true; const e = new Error("Envoi annulé."); e.aborted = true; job.reject(e); };
    jobs.push(job); return job;
  };
  return { jobs, transport };
}
const tick = () => new Promise((r) => setImmediate(r));
const make = (over = {}) => { const t = fakeTransport(); const log = []; const q = U.createQueue({ validate: (f) => U.validate(f, cfg), transport: t.transport, concurrency: 2, onChange: (items, it) => { if (it) log.push([it.name, it.state]); }, ...over }); return { q, t, log }; };
const states = (q) => q.items().map((i) => i.state);

describe("media-02 : validation avant envoi (le serveur revalide tout)", () => {
  test("la configuration du navigateur est celle du serveur : mêmes extensions, mêmes limites effectives", () => {
    assert.deepEqual(cfg.extTypes, media.EXT_TYPES); assert.equal(cfg.accept, media.ACCEPT);
    for (const t of media.TYPES) assert.equal(cfg.limits[t] * 1048576, Math.round(media.effectiveLimit(t) / 1048576 * 10) / 10 * 1048576);
    assert.equal(cfg.requestMax * 1048576, media.MAX_UPLOAD);
  });
  test("extension inconnue, fichier vide, fichier trop lourd (limite du TYPE) : refusés avec un message ; fichier valide accepté", () => {
    assert.match(U.validate(file("virus.exe"), cfg).message, /Format non pris en charge \(\.exe\)/);
    assert.match(U.validate(file("sans-extension"), cfg).message, /Format non pris en charge/);
    assert.match(U.validate(file("vide.png", 0), cfg).message, /vide/);
    const big = U.validate(file("photo.png", 5 * 1048576 + 1), cfg); assert.equal(big.ok, false); assert.match(big.message, /5 Mo au plus pour une image/);
    assert.equal(U.validate(file("clip.mp4", 40 * 1048576), cfg).ok, true, "une vidéo de 40 Mo passe (50 Mo pour une vidéo)");
    assert.equal(U.validate(file("doc.pdf", 10 * 1048576 + 1), cfg).ok, false);
    assert.deepEqual(U.validate(file("PHOTO.JPG", 10), cfg), { ok: true, type: "image" }, "extension insensible à la casse");
  });
  test("une limite abaissée dans Paramètres → Médias est celle que la validation applique", () => {
    const low = { ...cfg, limits: { ...cfg.limits, image: 1 } };
    assert.equal(U.validate(file("a.png", 1048577), low).ok, false); assert.equal(U.validate(file("a.png", 1048576), low).ok, true);
  });
});

describe("media-02 : file d'importation", () => {
  test("états dans l'ordre : validation → attente → transfert → traitement → RÉUSSI seulement après la réponse du serveur", async () => {
    const { q, t, log } = make();
    q.add([file("a.png")]);
    assert.deepEqual(log.map((l) => l[1]), ["validating", "waiting", "sending"], "validation, attente puis départ");
    t.jobs[0].cb.onProgress(0.5); assert.equal(q.items()[0].progress, 0.5); assert.equal(q.items()[0].state, "sending");
    t.jobs[0].cb.onSent(); assert.equal(q.items()[0].state, "processing", "octets partis : le fichier n'est PAS encore enregistré");
    assert.equal(q.counts().done, 0); assert.equal(q.pending(), 1);
    t.jobs[0].resolve({ id: 7, name: "a.png", size: 1000 }); await tick();
    assert.equal(q.items()[0].state, "done"); assert.equal(q.items()[0].media.id, 7); assert.equal(q.pending(), 0);
  });
  test("un fichier refusé par la validation n'est jamais envoyé ; les autres partent", () => {
    const { q, t } = make();
    q.add([file("ok.png"), file("faux.exe"), file("gros.png", 6 * 1048576)]);
    assert.equal(t.jobs.length, 1, "un seul envoi réel"); assert.deepEqual(states(q), ["sending", "error", "error"]);
    assert.ok(q.items()[1].rejected && q.items()[2].rejected); assert.match(q.items()[2].message, /trop lourd/);
  });
  test("concurrence limitée : jamais plus de 2 envois simultanés, la file avance quand un envoi se termine", async () => {
    const { q, t } = make();
    q.add([1, 2, 3, 4, 5].map((n) => file(`f${n}.png`, 10, n)));
    assert.equal(t.jobs.length, 2); assert.deepEqual(states(q), ["sending", "sending", "waiting", "waiting", "waiting"]);
    t.jobs[0].resolve({ id: 1 }); await tick(); assert.equal(t.jobs.length, 3); assert.equal(q.items().filter((i) => i.state === "sending").length, 2);
    t.jobs[1].resolve({ id: 2 }); t.jobs[2].resolve({ id: 3 }); await tick(); await tick();
    t.jobs[3].resolve({ id: 4 }); t.jobs[4].resolve({ id: 5 }); await tick(); await tick();
    assert.deepEqual(q.counts(), { done: 5, error: 0, cancelled: 0, active: 0 }); assert.equal(t.jobs.length, 5);
  });
  test("échec partiel : l'échec d'un fichier (erreur serveur) n'empêche pas les autres ; message et compteurs par fichier", async () => {
    const { q, t } = make();
    q.add([file("a.png", 10, 1), file("b.png", 10, 2)]);
    t.jobs[0].reject(new Error("Le stockage est indisponible : le fichier n'a pas été enregistré.")); t.jobs[1].resolve({ id: 2 }); await tick(); await tick();
    assert.deepEqual(states(q), ["error", "done"]); assert.match(q.items()[0].message, /stockage est indisponible/);
    assert.deepEqual(q.counts(), { done: 1, error: 1, cancelled: 0, active: 0 });
  });
  test("doublons accidentels : le même fichier choisi deux fois (ou déposé pendant l'envoi) n'est ajouté qu'une fois ; après un échec il peut être réessayé", async () => {
    const { q, t } = make();
    const f = file("a.png", 10, 5);
    assert.equal(q.add([f]).added.length, 1);
    const again = q.add([f, file("a.png", 10, 5)]); assert.equal(again.added.length, 0); assert.equal(again.skipped.length, 2);
    t.jobs[0].reject(new Error("réseau")); await tick(); assert.equal(q.items()[0].state, "error");
    assert.equal(q.add([file("a.png", 10, 5)]).added.length, 1, "après un échec, le même fichier peut être ajouté de nouveau");
    t.jobs[1].resolve({ id: 1 }); await tick();
    assert.equal(q.add([file("a.png", 10, 5)]).added.length, 0, "déjà téléversé : pas de doublon");
    assert.equal(q.add([file("a.png", 10, 6)]).added.length, 1, "même nom mais autre fichier (date différente) : accepté");
  });
  test("nouvel essai : un échec réseau repart ; un refus de validation ne se « réessaie » pas sans changer le fichier", async () => {
    const { q, t } = make();
    q.add([file("a.png", 10, 1), file("x.exe", 10, 2)]);
    t.jobs[0].reject(new Error("Connexion interrompue")); await tick();
    const [a, x] = q.items(); q.retry(a.id); assert.equal(q.items()[0].state, "sending"); assert.equal(t.jobs.length, 2);
    q.retry(x.id); assert.equal(q.items()[1].state, "error", "revalidé : toujours refusé"); assert.equal(t.jobs.length, 2, "aucun nouvel envoi");
    t.jobs[1].resolve({ id: 1 }); await tick(); assert.equal(q.items()[0].state, "done");
    q.retry(a.id); assert.equal(t.jobs.length, 2, "un fichier réussi ne se renvoie pas");
  });
  test("annulation : d'un fichier en attente et d'un envoi en cours (le transport est interrompu) ; la file continue", async () => {
    const { q, t } = make({ concurrency: 1 });
    q.add([file("a.png", 10, 1), file("b.png", 10, 2), file("c.png", 10, 3)]);
    const [a, b] = q.items();
    q.cancel(b.id); assert.equal(q.items()[1].state, "cancelled");
    q.cancel(a.id); await tick(); assert.ok(t.jobs[0].aborted); assert.equal(q.items()[0].state, "cancelled"); assert.equal(q.items()[0].message, "Envoi annulé.");
    assert.equal(t.jobs.length, 2, "le troisième fichier est parti"); assert.equal(q.items()[2].state, "sending");
    q.retry(b.id); assert.equal(q.items()[1].state === "waiting" || q.items()[1].state === "sending", true, "un fichier annulé peut être relancé");
  });
  test("retirer de la liste : seulement un fichier qui n'est plus actif ; pending() sert l'avertissement avant de quitter la page", async () => {
    const { q, t } = make();
    q.add([file("a.png", 10, 1), file("x.exe", 10, 2)]);
    assert.equal(q.pending(), 1, "un envoi actif : la page avertit avant d'être quittée");
    q.remove(q.items()[0].id); assert.equal(q.items().length, 2, "un envoi actif ne se retire pas");
    q.remove(q.items()[1].id); assert.equal(q.items().length, 1);
    t.jobs[0].resolve({ id: 1 }); await tick(); assert.equal(q.pending(), 0);
  });
  test("grande sélection : tous les fichiers sont traités un par un, aucun n'est perdu ni envoyé deux fois", async () => {
    const { q, t } = make();
    q.add(Array.from({ length: 30 }, (_, n) => file(`lot-${n}.png`, 10, n + 1)));
    for (let i = 0; i < 30; i++) { while (t.jobs.length <= i) await tick(); t.jobs[i].resolve({ id: i }); await tick(); }
    await tick(); assert.equal(q.counts().done, 30); assert.equal(t.jobs.length, 30); assert.equal(new Set(t.jobs.map((j) => j.file.name)).size, 30);
  });
});
