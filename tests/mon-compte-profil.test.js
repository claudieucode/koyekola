// KOLAKISA — « Mon compte » (élèves et formateurs) : profil, sécurité et sessions, sur les vraies routes, la vraie base, de vrais comptes.
// Même moteur que « Comptes → Profil » du CMS (services/accountProfile). Garanties : persistance après rechargement, aucune action sur un autre compte,
// réauthentification (mot de passe actuel) pour l'adresse et le mot de passe, autres sessions fermées au changement de mot de passe, photo contrôlée sur son contenu.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor, newStudent, Client } = require("./helpers");

const PW = "MotDePasseEleve123";
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==", "base64");
let srv, db;
const one = (sql, ...a) => db.prepare(sql).get(...a);
const idOf = (c) => one("SELECT id FROM users WHERE email = ?", c.email).id;
const send = (client, path, fields, file) => {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.append(k, v);
  if (file) fd.append("thumbnail", new Blob([file.data], { type: file.type }), file.name);
  return client.request(path, { method: "POST", multipart: fd });
};
const valid = { first_name: "Claire", last_name: "Martin", nickname: "clairem", display_name: "Claire Martin", website: "exemple.fr/blog", bio: "Élève <b>curieuse</b>." };

before(async () => { srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" }); db = srv.db(); });
after(() => srv.stop());

describe("Mon compte : accès", () => {
  test("sans connexion : aucune action n'est possible et rien n'est modifié", async () => {
    const anon = new Client(srv.base);
    for (const path of ["/mon-compte/profil", "/mon-compte/mot-de-passe", "/mon-compte/email", "/mon-compte/email/annuler", "/mon-compte/sessions/revoquer"]) {
      const r = await anon.post(path, { nickname: "x", email: "x@exemple.fr" });
      assert.ok(r.status === 302 && /connexion/.test(r.location), `${path} → ${r.status} ${r.location}`);
    }
  });
});

describe("Mon compte : profil", () => {
  test("enregistré, conservé après rechargement, biographie nettoyée, site web normalisé", async () => {
    const s = await newStudent(srv), id = idOf(s);
    const r = await send(s, "/mon-compte/profil", valid);
    assert.equal(r.status, 302);
    const page = (await s.get("/mon-compte")).text;
    assert.match(page, /Profil enregistré/);
    assert.match(page, /value="Claire"/); assert.match(page, /value="clairem"/);
    assert.equal(one("SELECT bio FROM users WHERE id = ?", id).bio, "Élève curieuse.");
    assert.equal(one("SELECT website FROM mk_user_profiles WHERE user_id = ?", id).website, "https://exemple.fr/blog");
    assert.doesNotMatch((await s.get("/mon-compte")).text, /Profil enregistré/, "le message n'est affiché qu'une fois");
  });
  test("pseudo vide : refusé, rien n'est enregistré, la saisie est conservée près des champs", async () => {
    const s = await newStudent(srv), id = idOf(s);
    await send(s, "/mon-compte/profil", { ...valid, nickname: "", bio: "Ma saisie conservée" });
    assert.equal(one("SELECT bio FROM users WHERE id = ?", id).bio, "", "aucune écriture partielle");
    const page = (await s.get("/mon-compte")).text;
    assert.match(page, /Le pseudo est nécessaire/); assert.match(page, /Ma saisie conservée/);
  });
  test("un identifiant de compte envoyé dans la requête est ignoré : seul le compte connecté change", async () => {
    const a = await newStudent(srv), b = await newStudent(srv), roleBefore = one("SELECT role FROM users WHERE id = ?", idOf(a)).role;
    await send(a, "/mon-compte/profil", { ...valid, nickname: "pirate", user_id: String(idOf(b)), id: String(idOf(b)), email: "x@exemple.fr", role: "instructor" });
    assert.equal(one("SELECT nickname FROM mk_user_profiles WHERE user_id = ?", idOf(a)).nickname, "pirate");
    assert.equal(one("SELECT 1 x FROM mk_user_profiles WHERE user_id = ? AND nickname = 'pirate'", idOf(b)), undefined, "l'autre compte n'est pas touché");
    assert.equal(one("SELECT role FROM users WHERE id = ?", idOf(a)).role, roleBefore, "le rôle n'est pas modifiable");
    assert.notEqual(one("SELECT email FROM users WHERE id = ?", idOf(a)).email, "x@exemple.fr", "l'adresse ne change pas par ce formulaire");
  });
  test("photo : le contenu est contrôlé (un fichier HTML déclaré « image/png » est refusé), une vraie image est acceptée puis supprimable", async () => {
    const s = await newStudent(srv), id = idOf(s);
    await send(s, "/mon-compte/profil", valid, { data: Buffer.from("<html><script>alert(1)</script></html>"), type: "image/png", name: "a.png" });
    assert.equal(one("SELECT avatar_path FROM users WHERE id = ?", id).avatar_path, null);
    assert.match((await s.get("/mon-compte")).text, /n(?:'|&#39;)est pas une image/);
    await send(s, "/mon-compte/profil", valid, { data: png, type: "image/png", name: "a.png" });
    assert.match(one("SELECT avatar_path FROM users WHERE id = ?", id).avatar_path, /^\/uploads\/thumbnails\/.+\.png$/);
    await send(s, "/mon-compte/profil", { ...valid, remove_avatar: "1" });
    assert.equal(one("SELECT avatar_path FROM users WHERE id = ?", id).avatar_path, null);
  });
  test("photo trop lourde (plus de 2 Mo) : refusée", async () => {
    const s = await newStudent(srv), id = idOf(s);
    await send(s, "/mon-compte/profil", valid, { data: Buffer.concat([png, Buffer.alloc(2 * 1024 * 1024 + 10)]), type: "image/png", name: "gros.png" });
    assert.equal(one("SELECT avatar_path FROM users WHERE id = ?", id).avatar_path, null);
    assert.match((await s.get("/mon-compte")).text, /trop lourde/);
  });
});

describe("Mon compte : mot de passe et sessions", () => {
  test("mot de passe actuel faux, confirmation différente ou trop court : refusés sans rien changer", async () => {
    const s = await newStudent(srv), id = idOf(s), before = one("SELECT password_hash h FROM users WHERE id = ?", id).h;
    for (const [body, re] of [
      [{ current_password: "faux", new_password: "NouveauMotDePasse1", confirm_password: "NouveauMotDePasse1" }, /actuel est incorrect/],
      [{ current_password: PW, new_password: "NouveauMotDePasse1", confirm_password: "Autre" }, /pas identiques/],
      [{ current_password: PW, new_password: "court", confirm_password: "court" }, /au moins/],
    ]) {
      await s.post("/mon-compte/mot-de-passe", body);
      assert.match((await s.get("/mon-compte")).text, re);
    }
    assert.equal(one("SELECT password_hash h FROM users WHERE id = ?", id).h, before);
  });
  test("changement réussi : la session courante reste ouverte, les AUTRES sont fermées, l'ancien mot de passe ne marche plus", async () => {
    const s = await newStudent(srv);
    const other = await new Client(srv.base).login(s.email, PW);
    assert.equal((await other.get("/mon-compte")).status, 200);
    const r = await s.post("/mon-compte/mot-de-passe", { current_password: PW, new_password: "NouveauMotDePasse1", confirm_password: "NouveauMotDePasse1" });
    assert.equal(r.status, 302);
    assert.match((await s.get("/mon-compte")).text, /Mot de passe changé/);
    assert.equal((await s.get("/mon-compte")).status, 200, "session courante conservée");
    const o = await other.get("/mon-compte");
    assert.equal(o.status, 302); assert.match(o.location, /connexion/, "l'autre session est fermée");
    await assert.rejects(new Client(srv.base).login(s.email, PW), /refusée/);
    await new Client(srv.base).login(s.email, "NouveauMotDePasse1");
  });
  test("sessions : liste réelle, fermeture d'une session précise, puis de toutes les autres ; une clé étrangère n'atteint aucune session", async () => {
    const s = await newStudent(srv), id = idOf(s);
    const d1 = await new Client(srv.base).login(s.email, PW), d2 = await new Client(srv.base).login(s.email, PW);
    const page = (await s.get("/mon-compte")).text;
    assert.match(page, /cette session/);
    const keys = [...page.matchAll(/\/mon-compte\/sessions\/([0-9a-f]{16})\/revoquer/g)].map((m) => m[1]);
    assert.equal(keys.length, 2, "deux autres sessions listées");
    const stranger = await newStudent(srv);
    await stranger.post(`/mon-compte/sessions/${keys[0]}/revoquer`, {});
    assert.equal((await d1.get("/mon-compte")).status, 200); assert.equal((await d2.get("/mon-compte")).status, 200);
    const strangerSessions = (await stranger.get("/mon-compte")).text;
    assert.doesNotMatch(strangerSessions, new RegExp(keys[0]), "les sessions d'un autre compte ne sont jamais listées");
    await s.post(`/mon-compte/sessions/${keys[0]}/revoquer`, {});
    const closed = [(await d1.get("/mon-compte")).status, (await d2.get("/mon-compte")).status].filter((x) => x === 302).length;
    assert.equal(closed, 1, "exactement une session fermée");
    await s.post("/mon-compte/sessions/revoquer", {});
    assert.equal((await d1.get("/mon-compte")).status, 302); assert.equal((await d2.get("/mon-compte")).status, 302);
    assert.equal((await s.get("/mon-compte")).status, 200, "la session courante reste ouverte");
    assert.ok(id);
  });
});

describe("Mon compte : adresse e-mail", () => {
  test("le mot de passe actuel est exigé : sans lui, ou faux, aucune demande ni e-mail", async () => {
    const s = await newStudent(srv), id = idOf(s);
    for (const body of [{ email: "pirate@exemple.fr" }, { email: "pirate@exemple.fr", current_password: "faux" }]) assert.equal((await s.post("/mon-compte/email", body)).status, 302);
    assert.equal(one("SELECT 1 x FROM mk_user_profiles WHERE user_id = ? AND pending_email IS NOT NULL", id), undefined);
    assert.equal(one("SELECT COUNT(*) n FROM mail_outbox WHERE lower(to_email) = 'pirate@exemple.fr'").n, 0);
    assert.match((await s.get("/mon-compte")).text, /mot de passe actuel est incorrect/);
  });
  test("avec le bon mot de passe : adresse « en attente », e-mail envoyé à la NOUVELLE adresse seulement, adresse actuelle inchangée, annulation possible", async () => {
    const s = await newStudent(srv), id = idOf(s), old = s.email;
    await s.post("/mon-compte/email", { email: "Nouvelle@Exemple.fr", current_password: PW });
    assert.equal(one("SELECT email FROM users WHERE id = ?", id).email, old);
    assert.match((await s.get("/mon-compte")).text, /En attente de confirmation/);
    assert.ok(one("SELECT 1 x FROM mail_outbox WHERE kind = 'email_change' AND lower(to_email) = 'nouvelle@exemple.fr'"));
    assert.equal(one("SELECT COUNT(*) n FROM mail_outbox WHERE kind = 'email_change' AND lower(to_email) = ?", old.toLowerCase()).n, 0);
    await s.post("/mon-compte/email/annuler", {});
    assert.equal(one("SELECT 1 x FROM mk_user_profiles WHERE user_id = ? AND pending_email IS NOT NULL", id), undefined);
  });
  test("adresse déjà utilisée par un autre compte : refusée sans révéler à qui elle appartient", async () => {
    const a = await newStudent(srv), b = await newStudent(srv);
    await a.post("/mon-compte/email", { email: b.email, current_password: PW });
    const page = (await a.get("/mon-compte")).text;
    assert.match(page, /ne peut pas être utilisée/); assert.doesNotMatch(page, /appartient|déjà (pris|inscrit)/, "message générique : l'existence du compte n'est pas confirmée");
    assert.equal(one("SELECT 1 x FROM mk_user_profiles WHERE user_id = ? AND pending_email IS NOT NULL", idOf(a)), undefined);
  });
});

describe("Mon compte : protections transversales", () => {
  test("un envoi venu d'un autre site (CSRF) est refusé et ne modifie rien", async () => {
    const s = await newStudent(srv), id = idOf(s);
    const r = await s.post("/mon-compte/profil", { ...valid, nickname: "csrf" }, { headers: { Origin: "https://evil.example" } });
    assert.ok(r.status === 403 || r.status === 400, `statut ${r.status}`);
    assert.equal(one("SELECT 1 x FROM mk_user_profiles WHERE user_id = ? AND nickname = 'csrf'", id), undefined);
  });
  test("formateur : la photo est contrôlée sur son contenu et sa taille ; la biographie reste enregistrable", async () => {
    const prof = await loginInstructor(srv);
    const bad = await send(prof, "/formateur/profil", { bio: "Bio" }, { data: Buffer.from("<script>alert(1)</script>"), type: "image/png", name: "x.png" });
    assert.equal(bad.status, 400); assert.match(bad.text, /n(?:'|&#39;)est pas une image/);
    assert.equal(one("SELECT avatar_path FROM users WHERE email = 'prof@test.local'").avatar_path, null);
    const ok = await send(prof, "/formateur/profil", { bio: "Bio du formateur" }, { data: png, type: "image/png", name: "x.png" });
    assert.equal(ok.status, 302);
    assert.match(one("SELECT avatar_path FROM users WHERE email = 'prof@test.local'").avatar_path, /\.png$/);
  });
});
