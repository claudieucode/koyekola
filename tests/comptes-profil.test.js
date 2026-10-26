// KOLAKISA CMS → Comptes → Profil : profil personnel (identité, préférences, photo, e-mail, mot de passe, sessions) — par les vraies routes d'un vrai serveur.
// Sécurité testée explicitement : accès sans connexion, compte sans accès au CMS, IDOR (identifiant d'un autre compte dans la requête), faux fichier image,
// lien d'e-mail falsifié ou rejoué, session fermée après changement de mot de passe, accès limité à un site.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, Client, loginInstructor, newStudent } = require("./helpers");

let srv, boss, db, orgId;
const P = "/marketing/site-web/profil";
const SECRET = "secret-de-test-assez-long-1234567890";
const one = (sql, ...a) => db.prepare(sql).get(...a);
const idOf = (client) => one("SELECT id FROM users WHERE email = ?", client.email).id;
const flashOf = (html) => (html.match(/class="mk-flash[^"]*"[^>]*>[\s\S]*?<\/div>/) || [""])[0].replace(/&#39;/g, "'");
const PNG = Buffer.from("89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d49444154789c6360000002000001e221bc330000000049454e44ae426082", "hex");
const emailToken = (userId, email, exp = Date.now() + 3600000) => {
  const body = Buffer.from(JSON.stringify({ u: userId, e: email.toLowerCase(), x: exp })).toString("base64url");
  return `${body}.${crypto.createHmac("sha256", SECRET).update(`change-email:${body}`).digest("base64url")}`;
};
const member = async (role = "editor") => { const c = await newStudent(srv); db.prepare("INSERT INTO mk_org_members (organization_id, user_id, role) VALUES (?, ?, ?)").run(orgId, idOf(c), role); return c; };
const sendProfile = (client, fields, file) => {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.append(k, v);
  if (file) fd.append("thumbnail", new Blob([file.data], { type: file.type }), file.name);
  return client.request(P, { method: "POST", multipart: fd });
};
const valid = { first_name: "Claire", last_name: "Martin", nickname: "clairem", display_name: "Claire Martin", website: "exemple.fr/blog", bio: "Formatrice <b>web</b>.", theme: "dark" };

before(async () => {
  srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "", SESSION_SECRET: SECRET });
  boss = await loginInstructor(srv); db = srv.db();
  orgId = one("SELECT id FROM mk_organizations").id;
});
after(() => srv.stop());

describe("Profil : accès", () => {
  test("sans connexion : renvoi à la connexion, aucune donnée", async () => {
    const anon = new Client(srv.base);
    const r = await anon.get(P);
    assert.equal(r.status, 302); assert.match(r.location, /^\/connexion/);
    assert.equal((await anon.post(P, valid)).status, 302);
  });
  test("un compte sans accès au CMS (élève) est refusé, en lecture comme en écriture", async () => {
    const s = await newStudent(srv);
    assert.notEqual((await s.get(P)).status, 200);
    assert.equal((await s.post(`${P}/mot-de-passe`, { current_password: "MotDePasseEleve123", new_password: "Nouveau1234", confirm_password: "Nouveau1234" })).status, 403);
    assert.equal((await s.post(`${P}/sessions/revoquer`, {})).status, 403);
  });
  test("tout membre de l'équipe, même un simple Lecteur, ouvre SON profil ; le menu propose « Profil »", async () => {
    const v = await member("viewer");
    const r = await v.get(P);
    assert.equal(r.status, 200);
    assert.match(r.text, /<h1>Profil<\/h1>/);
    assert.match(r.text, new RegExp(`value="${one("SELECT username FROM users WHERE email = ?", v.email).username}" disabled`));
    assert.match(r.text, /href="\/marketing\/site-web\/profil"/);
  });
  test("une personne qui n'a accès qu'à un site ouvre son profil (sans accès à d'autres écrans hors de son site)", async () => {
    const siteId = Number(db.prepare("INSERT INTO mk_sites (organization_id, name, tokens) VALUES (?, 'Site profil', '{}')").run(orgId).lastInsertRowid);
    const c = await newStudent(srv);
    db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, 'viewer')").run(siteId, idOf(c));
    assert.equal((await c.get(P)).status, 200);
    assert.equal((await c.get(`/marketing/site-web/sites/${siteId}/equipe-profil`)).status, 200, "le profil s'ouvre aussi dans le cadre du site");
    assert.notEqual((await c.get("/marketing/site-web/utilisateurs")).status, 200);
  });
});

describe("Profil : informations et préférences", () => {
  test("l'enregistrement est persistant : base, rechargement, thème, URL normalisée, biographie nettoyée", async () => {
    const a = await member("editor"), id = idOf(a);
    const r = await sendProfile(a, valid);
    assert.equal(r.status, 302); assert.match(r.location, /\/profil\?theme=1$/);
    const row = one("SELECT * FROM mk_user_profiles WHERE user_id = ?", id);
    assert.deepEqual([row.first_name, row.last_name, row.nickname, row.display_name], ["Claire", "Martin", "clairem", "Claire Martin"]);
    assert.equal(row.website, "https://exemple.fr/blog");
    assert.equal(JSON.parse(row.prefs).theme, "dark");
    assert.equal(one("SELECT bio FROM users WHERE id = ?", id).bio, "Formatrice web.", "les balises sont supprimées avant l'enregistrement");
    const page = await a.get(P);
    assert.match(page.text, /value="Claire"/); assert.match(page.text, /value="https:\/\/exemple\.fr\/blog"/);
    assert.match(page.text, /<option value="Claire Martin" selected>/);
    // Thème repris sur chaque page de l'administration, sans choix local
    assert.match((await a.get("/marketing/site-web/utilisateurs")).text.replace(/\s+/g, " "), /getItem\("kolaTheme"\) \|\| "dark"/);
  });
  test("le message de réussite n'apparaît qu'après la confirmation du serveur", async () => {
    const a = await member("editor");
    const r = await sendProfile(a, valid);
    assert.equal(r.status, 302);
    const page = await a.get(P);
    assert.match(flashOf(page.text), /Profil enregistré/);
    assert.doesNotMatch(flashOf((await a.get(P)).text), /Profil enregistré/, "message affiché une seule fois");
  });
  test("saisie invalide : rien n'est enregistré, la saisie et l'erreur du champ sont conservées", async () => {
    const a = await member("editor"), id = idOf(a);
    await sendProfile(a, valid);
    const before = one("SELECT * FROM mk_user_profiles WHERE user_id = ?", id);
    const r = await sendProfile(a, { ...valid, nickname: "", first_name: "Autre", website: "javascript:alert(1)" });
    assert.equal(r.status, 302);
    assert.deepEqual(one("SELECT * FROM mk_user_profiles WHERE user_id = ?", id), before, "aucune écriture partielle");
    const page = await a.get(P);
    assert.match(page.text, /Le pseudo est nécessaire/); assert.match(page.text, /doit être une adresse http/);
    assert.match(page.text, /value="Autre"/, "la saisie valide est conservée");
    assert.match(flashOf(page.text), /pas été enregistré/);
    assert.doesNotMatch((await a.get(P)).text, /Le pseudo est nécessaire/, "l'erreur ne revient pas après lecture");
  });
  test("« nom à afficher » : seule une valeur proposée par le serveur est acceptée", async () => {
    const a = await member("editor"), id = idOf(a);
    await sendProfile(a, { ...valid, display_name: "Directeur général" });
    assert.equal(one("SELECT 1 x FROM mk_user_profiles WHERE user_id = ?", id), undefined);
    await sendProfile(a, valid);
    assert.equal(one("SELECT display_name FROM mk_user_profiles WHERE user_id = ?", id).display_name, "Claire Martin");
  });
  test("thème inconnu refusé ; le HTML saisi est échappé à l'affichage", async () => {
    const a = await member("editor"), id = idOf(a);
    await sendProfile(a, { ...valid, theme: "rose" });
    assert.equal(one("SELECT 1 x FROM mk_user_profiles WHERE user_id = ?", id), undefined);
    await sendProfile(a, { ...valid, first_name: '"><img src=x onerror=alert(1)>', theme: "light" });
    const page = (await a.get(P)).text;
    assert.doesNotMatch(page, /<img src=x onerror/);
  });
  test("IDOR : un identifiant d'un autre compte dans la requête est ignoré", async () => {
    const a = await member("editor"), b = await member("editor");
    await sendProfile(b, valid);
    const before = JSON.stringify([one("SELECT * FROM mk_user_profiles WHERE user_id = ?", idOf(b)), one("SELECT bio, avatar_path FROM users WHERE id = ?", idOf(b))]);
    await sendProfile(a, { ...valid, nickname: "pirate", user_id: String(idOf(b)), id: String(idOf(b)), bio: "pwned" });
    assert.equal(JSON.stringify([one("SELECT * FROM mk_user_profiles WHERE user_id = ?", idOf(b)), one("SELECT bio, avatar_path FROM users WHERE id = ?", idOf(b))]), before);
    assert.equal(one("SELECT nickname FROM mk_user_profiles WHERE user_id = ?", idOf(a)).nickname, "pirate");
  });
});

describe("Profil : photo", () => {
  test("une vraie image est acceptée, vérifiée sur son contenu, puis supprimable", async () => {
    const a = await member("editor"), id = idOf(a);
    await sendProfile(a, valid, { data: PNG, type: "image/png", name: "moi.png" });
    const path = one("SELECT avatar_path FROM users WHERE id = ?", id).avatar_path;
    assert.match(path, /^\/uploads\/thumbnails\/.+\.png$/);
    assert.equal((await new Client(srv.base).get(path)).status, 200);
    await sendProfile(a, { ...valid, remove_avatar: "1" });
    assert.equal(one("SELECT avatar_path FROM users WHERE id = ?", id).avatar_path, null);
  });
  test("un faux fichier déclaré image/png est refusé : ni enregistrement du profil, ni fichier conservé", async () => {
    const a = await member("editor"), id = idOf(a);
    await sendProfile(a, valid);
    const r = await sendProfile(a, { ...valid, nickname: "faux" }, { data: Buffer.from("<html><script>alert(1)</script></html>"), type: "image/png", name: "evil.png" });
    assert.equal(r.status, 302);
    assert.equal(one("SELECT avatar_path FROM users WHERE id = ?", id).avatar_path, null);
    assert.equal(one("SELECT nickname FROM mk_user_profiles WHERE user_id = ?", id).nickname, "clairem", "profil inchangé");
    assert.match(flashOf((await a.get(P)).text), /n'est pas une image/);
  });
  test("un type non image (SVG, HTML) est refusé", async () => {
    const a = await member("editor");
    await sendProfile(a, valid, { data: Buffer.from("<svg xmlns='http://www.w3.org/2000/svg'><script>1</script></svg>"), type: "image/svg+xml", name: "x.svg" });
    assert.equal(one("SELECT avatar_path FROM users WHERE id = ?", idOf(a)).avatar_path, null);
  });
});

describe("Profil : adresse e-mail", () => {
  test("la demande n'active rien : l'adresse vérifiée reste, la nouvelle est « en attente » et visible", async () => {
    const a = await member("editor"), id = idOf(a), old = a.email;
    const r = await a.post(`${P}/email`, { current_password: "MotDePasseEleve123", email: "Nouvelle.Adresse@Exemple.fr" });
    assert.equal(r.status, 302);
    assert.equal(one("SELECT email FROM users WHERE id = ?", id).email, old, "adresse inchangée avant confirmation");
    assert.equal(one("SELECT pending_email FROM mk_user_profiles WHERE user_id = ?", id).pending_email, "Nouvelle.Adresse@Exemple.fr");
    assert.match((await a.get(P)).text, /En attente de confirmation/);
    assert.ok(one("SELECT 1 x FROM mail_outbox WHERE kind = 'email_change' AND lower(to_email) = 'nouvelle.adresse@exemple.fr'"), "e-mail de confirmation envoyé à la NOUVELLE adresse, pas à l'ancienne");
    assert.equal(one("SELECT COUNT(*) n FROM mail_outbox WHERE kind = 'email_change' AND lower(to_email) = ?", old.toLowerCase()).n, 0);
  });
  test("réauthentification : sans mot de passe actuel, ou avec un faux, l'adresse n'est pas demandée et aucun e-mail ne part", async () => {
    const a = await member("editor"), id = idOf(a);
    for (const body of [{ email: "pirate@exemple.fr" }, { email: "pirate@exemple.fr", current_password: "faux" }]) {
      const r = await a.post(`${P}/email`, body);
      assert.equal(r.status, 302);
    }
    assert.equal(one("SELECT 1 x FROM mk_user_profiles WHERE user_id = ? AND pending_email IS NOT NULL", id), undefined, "rien en attente");
    assert.equal(one("SELECT COUNT(*) n FROM mail_outbox WHERE lower(to_email) = 'pirate@exemple.fr'").n, 0, "aucun e-mail envoyé à la nouvelle adresse");
    assert.match((await a.get(P)).text, /mot de passe actuel est incorrect/);
  });
  test("adresse invalide, identique ou déjà prise : refusée avec message près du champ", async () => {
    const a = await member("editor"), b = await member("editor");
    for (const [bad, re] of [["pas-une-adresse", /pas valide/], [a.email, /déjà l'adresse/], [b.email, /ne peut pas être utilisée/]]) {
      await a.post(`${P}/email`, { current_password: "MotDePasseEleve123", email: bad });
      assert.match((await a.get(P)).text, re, bad);
    }
    assert.equal(one("SELECT 1 x FROM mk_user_profiles WHERE user_id = ? AND pending_email IS NOT NULL", idOf(a)), undefined);
  });
  test("le lien exige un clic de confirmation, change l'adresse une seule fois, et un lien falsifié ou périmé échoue", async () => {
    const a = await member("editor"), id = idOf(a);
    await a.post(`${P}/email`, { current_password: "MotDePasseEleve123", email: "confirme@exemple.fr" });
    const anon = new Client(srv.base), token = emailToken(id, "confirme@exemple.fr");
    const view = await anon.get(`/mon-compte/changer-email/${token}`);
    assert.equal(view.status, 200); assert.match(view.text, /Confirmer la nouvelle adresse/);
    assert.notEqual(one("SELECT email FROM users WHERE id = ?", id).email, "confirme@exemple.fr", "l'ouverture seule du lien ne change rien");
    assert.equal((await anon.get(`/mon-compte/changer-email/${token}x`)).status, 410);
    assert.equal((await anon.post(`/mon-compte/changer-email/${emailToken(id, "confirme@exemple.fr", Date.now() - 1000)}`, {})).status, 410, "lien périmé");
    assert.equal((await anon.post(`/mon-compte/changer-email/${emailToken(id, "autre@exemple.fr")}`, {})).status, 410, "adresse non demandée");
    assert.equal((await anon.post(`/mon-compte/changer-email/${token}`, {})).status, 200);
    assert.equal(one("SELECT email FROM users WHERE id = ?", id).email, "confirme@exemple.fr");
    assert.ok(one("SELECT email_verified_at v FROM users WHERE id = ?", id).v);
    assert.equal((await anon.post(`/mon-compte/changer-email/${token}`, {})).status, 410, "lien déjà utilisé");
    await new Client(srv.base).login("confirme@exemple.fr", "MotDePasseEleve123");
  });
  test("annuler la demande rend le lien inutilisable", async () => {
    const a = await member("editor"), id = idOf(a), old = a.email;
    await a.post(`${P}/email`, { email: "annule@exemple.fr" });
    await a.post(`${P}/email/annuler`, {});
    assert.equal((await new Client(srv.base).post(`/mon-compte/changer-email/${emailToken(id, "annule@exemple.fr")}`, {})).status, 410);
    assert.equal(one("SELECT email FROM users WHERE id = ?", id).email, old);
  });
});

describe("Profil : mot de passe et sessions", () => {
  test("mot de passe actuel faux : refusé, rien ne change ; politique appliquée ; confirmation exigée", async () => {
    const a = await member("editor"), id = idOf(a), hash = one("SELECT password_hash h FROM users WHERE id = ?", id).h;
    for (const [fields, re] of [
      [{ current_password: "faux", new_password: "NouveauMdp123", confirm_password: "NouveauMdp123" }, /actuel est incorrect/],
      [{ current_password: "MotDePasseEleve123", new_password: "court", confirm_password: "court" }, /au moins 8 caractères/],
      [{ current_password: "MotDePasseEleve123", new_password: "MotDePasseEleve123", confirm_password: "MotDePasseEleve123" }, /différent de l'actuel/],
      [{ current_password: "MotDePasseEleve123", new_password: "NouveauMdp123", confirm_password: "autre chose 1" }, /pas identiques/],
    ]) {
      await a.post(`${P}/mot-de-passe`, fields);
      assert.match((await a.get(P)).text, re);
    }
    assert.equal(one("SELECT password_hash h FROM users WHERE id = ?", id).h, hash);
  });
  test("changement réussi : haché en base, ancien mot de passe refusé, nouveau accepté, cette session reste ouverte, les autres sont fermées", async () => {
    const a = await member("editor"), id = idOf(a);
    const other = await new Client(srv.base).login(a.email, "MotDePasseEleve123");
    assert.equal((await other.get(P)).status, 200);
    const r = await a.post(`${P}/mot-de-passe`, { current_password: "MotDePasseEleve123", new_password: "NouveauMdp123", confirm_password: "NouveauMdp123" });
    assert.equal(r.status, 302);
    const hash = one("SELECT password_hash h FROM users WHERE id = ?", id).h;
    assert.match(hash, /^\$2[aby]\$/); assert.doesNotMatch(hash, /NouveauMdp123/);
    assert.equal((await a.get(P)).status, 200, "la session qui change le mot de passe reste ouverte");
    assert.equal((await other.get(P)).status, 302, "l'autre session est fermée");
    await assert.rejects(() => new Client(srv.base).login(a.email, "MotDePasseEleve123"));
    await new Client(srv.base).login(a.email, "NouveauMdp123");
    const page = (await a.get(P)).text;
    assert.doesNotMatch(page, /NouveauMdp123/);
  });
  test("essais de mot de passe actuel limités", async () => {
    const a = await member("editor");
    let last;
    for (let i = 0; i < 12; i++) last = await a.post(`${P}/mot-de-passe`, { current_password: `faux${i}`, new_password: "NouveauMdp123", confirm_password: "NouveauMdp123" });
    assert.equal(last.status, 302);
    assert.match(flashOf((await a.get(P)).text), /Trop d'essais/);
  });
  test("sessions : liste réelle, fermeture d'une session précise puis de toutes les autres ; jamais la session courante", async () => {
    const a = await member("editor"), id = idOf(a);
    const s2 = await new Client(srv.base).login(a.email, "MotDePasseEleve123"), s3 = await new Client(srv.base).login(a.email, "MotDePasseEleve123");
    const page = (await a.get(P)).text;
    assert.equal((page.match(/cette session/g) || []).length, 1);
    const keys = [...page.matchAll(/sessions\/([0-9a-f]{16})\/revoquer/g)].map((m) => m[1]);
    assert.equal(keys.length, 2, "les deux autres sessions sont listées");
    assert.equal(page.includes(one("SELECT sid FROM sessions WHERE data LIKE ?", `%"id":${id},%`).sid), false, "l'identifiant de session n'est jamais affiché");
    await a.post(`${P}/sessions/${keys[0]}/revoquer`, {});
    const alive = [(await s2.get(P)).status, (await s3.get(P)).status].sort();
    assert.deepEqual(alive, [200, 302], "une seule des deux est fermée");
    await a.post(`${P}/sessions/revoquer`, {});
    assert.equal((await s2.get(P)).status, 302); assert.equal((await s3.get(P)).status, 302);
    assert.equal((await a.get(P)).status, 200);
    assert.match((await a.get(P)).text, /qu'à cet emplacement/);
  });
  test("une clé de session d'un AUTRE compte ne ferme rien (IDOR)", async () => {
    const a = await member("editor"), b = await member("editor");
    const bPage = await b.get(P);
    assert.ok(bPage.status === 200);
    const bOther = await new Client(srv.base).login(b.email, "MotDePasseEleve123");
    const key = [...(await b.get(P)).text.matchAll(/sessions\/([0-9a-f]{16})\/revoquer/g)][0][1];
    await a.post(`${P}/sessions/${key}/revoquer`, {});
    assert.equal((await bOther.get(P)).status, 200, "la session de B est intacte");
    assert.match(flashOf((await a.get(P)).text), /n'existe plus/);
  });
  test("journal d'audit : actions enregistrées, sans secret", async () => {
    const rows = db.prepare("SELECT action, metadata FROM mk_audit_logs WHERE action LIKE 'profile.%'").all();
    assert.ok(rows.some((r) => r.action === "profile.updated")); assert.ok(rows.some((r) => r.action === "profile.password_changed"));
    for (const r of rows) assert.doesNotMatch(r.metadata || "", /NouveauMdp123|MotDePasse/);
  });
});
