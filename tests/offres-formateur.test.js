// Onglet « Offres » de la fiche formation : création, validation côté serveur, modification, activation, suppression, accès.
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { startServer, Client, loginInstructor, newStudent, createCourse } = require("./helpers");

let srv, prof, A, B;
const base = (c) => `/formateur/cours/${c.id}/offres`;
const rows = (courseId) => { const db = srv.db(); try { return db.prepare("SELECT * FROM offers WHERE course_id = ? ORDER BY id").all(courseId); } finally { db.close(); } };
const day = (offsetDays) => new Date(Date.now() + offsetDays * 864e5).toISOString().slice(0, 10);

before(async () => {
  srv = await startServer();
  prof = await loginInstructor(srv);
  A = await createCourse(prof, srv, { title: "Formation Offres A", price: 50 });
  B = await createCourse(prof, srv, { title: "Formation Offres B", price: 80 });
});
after(() => srv.stop());

test("l'onglet Offres existe dans la fiche formation et affiche le prix standard", async () => {
  const page = await prof.get(base(A));
  assert.equal(page.status, 200);
  assert.match(page.text, new RegExp(`href="${base(A)}"[^>]*>Offres<`));
  assert.match(page.text, /Aucune offre/);
  assert.match(page.text, /Prix standard de la formation : <strong>50,00\s*€<\/strong>/);
});

test("création : offre enregistrée, dates en jour de Paris (fin incluse), visible « En cours »", async () => {
  const r = await prof.post(base(A), { name: "  Lancement  ", price: "39,90", starts_at: day(-1), ends_at: day(10), active: "on" });
  assert.equal(r.status, 302);
  assert.equal(r.location, base(A));
  const [o] = rows(A.id);
  assert.equal(o.name, "Lancement", "espaces superflus retirés");
  assert.equal(o.price_cents, 3990);
  assert.equal(o.active, 1);
  assert.match(o.starts_at, /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
  assert.ok(o.ends_at > o.starts_at);
  const page = await prof.get(base(A));
  assert.match(page.text, /Offre créée\./);
  assert.match(page.text, /Lancement/);
  assert.match(page.text, /En cours/);
  assert.equal((await prof.get(base(A))).text.includes("Offre créée."), false, "le message ne s'affiche qu'une fois");
});

test("validation serveur : prix ≥ standard, prix invalide ou négatif, nom vide, dates incohérentes → refusé, rien d'enregistré", async () => {
  const before = rows(A.id).length;
  const bad = [
    [{ name: "Trop cher", price: "50" }, /inférieur au prix standard/],
    [{ name: "Plus cher", price: "75,00" }, /inférieur au prix standard/],
    [{ name: "Texte", price: "abc" }, /Prix en euros/],
    [{ name: "Négatif", price: "-5" }, /Prix en euros/],
    [{ name: "Trois décimales", price: "10,999" }, /Prix en euros/],
    [{ name: "", price: "10" }, /Donnez un nom/],
    [{ name: "x".repeat(61), price: "10" }, /Donnez un nom/],
    [{ name: "Dates", price: "10", starts_at: day(5), ends_at: day(2) }, /date de fin doit suivre/],
    [{ name: "Date folle", price: "10", ends_at: "2026-13-45" }, /Date invalide/],
  ];
  for (const [form, expected] of bad) {
    const r = await prof.post(base(A), form);
    assert.equal(r.status, 400, JSON.stringify(form));
    assert.match(r.text, expected, JSON.stringify(form));
  }
  assert.equal(rows(A.id).length, before);
});

test("offre gratuite (0 €) acceptée ; la valeur saisie est conservée en cas d'erreur", async () => {
  const ok = await prof.post(base(A), { name: "Gratuite d'essai", price: "0", active: "on" });
  assert.equal(ok.status, 302);
  assert.equal(rows(A.id).at(-1).price_cents, 0);
  const err = await prof.post(base(A), { name: "Garde mon texte", price: "999" });
  assert.match(err.text, /value="Garde mon texte"/);
});

test("modification, désactivation / activation, suppression", async () => {
  const [o] = rows(A.id);
  const form = await prof.get(`${base(A)}?modifier=${o.id}`);
  assert.match(form.text, /Modifier l(?:'|&#39;)offre « Lancement »/);
  assert.match(form.text, /value="39\.90"/);
  const up = await prof.post(`${base(A)}/${o.id}`, { name: "Lancement prolongé", price: "34,50", active: "on" });
  assert.equal(up.status, 302);
  assert.deepEqual([rows(A.id)[0].name, rows(A.id)[0].price_cents, rows(A.id)[0].ends_at], ["Lancement prolongé", 3450, null]);
  await prof.post(`${base(A)}/${o.id}/desactiver`, {});
  assert.equal(rows(A.id)[0].active, 0);
  assert.match((await prof.get(base(A))).text, /Désactivée/);
  await prof.post(`${base(A)}/${o.id}/activer`, {});
  assert.equal(rows(A.id)[0].active, 1);
  await prof.post(`${base(A)}/${o.id}/supprimer`, {});
  assert.equal(rows(A.id).some((x) => x.id === o.id), false);
});

test("états : une offre terminée ou à venir est signalée comme telle", async () => {
  await prof.post(base(B), { name: "Passée", price: "10", starts_at: day(-20), ends_at: day(-10), active: "on" });
  await prof.post(base(B), { name: "Future", price: "10", starts_at: day(10), ends_at: day(20), active: "on" });
  const page = (await prof.get(base(B))).text;
  assert.match(page, /Terminée/);
  assert.match(page, /À venir/);
});

test("une offre n'est accessible que par SA formation (pas d'accès en changeant l'identifiant) et par le formateur", async () => {
  const [offerB] = rows(B.id);
  // l'identifiant d'une offre de B, utilisé dans l'URL de A : introuvable, et rien ne change
  for (const action of ["", "/activer", "/desactiver", "/supprimer"]) {
    const r = await prof.post(`${base(A)}/${offerB.id}${action}`, { name: "Piraté", price: "1" });
    assert.equal(r.status, 404, action);
  }
  assert.doesNotMatch((await prof.get(`${base(A)}?modifier=${offerB.id}`)).text, /Modifier l(?:'|&#39;)offre/, "pas de préremplissage avec l'offre d'une autre formation");
  assert.equal(rows(B.id).find((x) => x.id === offerB.id).name, offerB.name);
  assert.equal((await prof.get(`/formateur/cours/999999/offres`)).status, 404);
  // élève et visiteur : aucun accès
  const e = await newStudent(srv);
  for (const [client, label] of [[e, "élève"], [new Client(srv.base), "visiteur"]]) {
    const g = await client.get(base(A));
    assert.notEqual(g.status, 200, label);
    const p = await client.post(base(A), { name: "Intrus", price: "1" });
    assert.notEqual(p.status, 200, label);
    assert.ok(![200, 400].includes(p.status));
  }
  assert.equal(rows(A.id).some((x) => x.name === "Intrus"), false);
});
