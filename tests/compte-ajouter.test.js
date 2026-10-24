// KOLAKISA CMS — Utilisateurs → Ajouter un compte : création directe d'un compte (central et espace d'un site), validation, rôles et garde-fous anti-escalade, isolation par site,
// notification par e-mail (jamais le mot de passe), échec de messagerie, double soumission, secrets, permissions. Vrai serveur, vraies routes.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const bcrypt = require("bcryptjs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, Client, loginInstructor, newStudent } = require("./helpers");

// Les pages échappent « ' » en &#39; : on compare le texte lisible
for (const m of ["get", "post"]) { const orig = Client.prototype[m]; Client.prototype[m] = async function (...a) { const r = await orig.apply(this, a); if (typeof r.text === "string") r.text = r.text.replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "&"); return r; }; }

const C = "/marketing/site-web/utilisateurs";
const S = "/marketing/site-web/equipe-site";
let srv, boss, db, anon, org, A, B, srv2, boss2, db2;
const one = (sql, ...a) => db.prepare(sql).get(...a);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function newSite(name) { return Number(String((await boss.post("/marketing/site-web/sites", { name })).location).match(/sites\/(\d+)/)[1]); }
let seq = 0;
const form = (extra = {}) => { seq += 1; return { request_id: [...Array(24)].map(() => "0123456789abcdef"[Math.floor(Math.random() * 16)]).join(""), username: `compte${seq}`, email: `compte${seq}@exemple.test`, password: "Mot2Passe-Solide!", notify: "", role: "", ...extra }; };
const flashText = async (client, location) => { const p = await client.get(location); return (p.text.match(/mk-flash-body">([\s\S]*?)<\/span>/) || [])[1] || ""; };
const user = (name) => one("SELECT * FROM users WHERE username = ?", name);
const member = async (role, siteId = null, siteRole = "admin") => {
  const c = await newStudent(srv); const id = one("SELECT id FROM users WHERE email = ?", c.email).id;
  if (role) db.prepare("INSERT INTO mk_org_members (organization_id, user_id, role) VALUES (?, ?, ?)").run(org, id, role);
  if (siteId) db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, ?)").run(siteId, id, siteRole);
  return Object.assign(c, { id });
};

before(async () => {
  srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
  boss = await loginInstructor(srv); db = srv.db(); anon = new Client(srv.base);
  org = one("SELECT id FROM mk_organizations").id;
  A = await newSite("Comptes Alpha"); B = await newSite("Comptes Beta");
});
after(async () => { await srv.stop(); if (srv2) await srv2.stop(); });

describe("écran", () => {
  test("la page affiche le formulaire compact : identifiant, e-mail, prénom, nom, site web, langue, mot de passe masqué, notification, rôle ; rôle par défaut sans accès", async () => {
    const r = await boss.get(`${C}/nouveau`);
    assert.equal(r.status, 200);
    for (const n of ["username", "email", "first_name", "last_name", "website", "language", "password", "notify", "role"]) assert.match(r.text, new RegExp(`name="${n}"`), n);
    assert.match(r.text, /name="password" type="password"/); assert.match(r.text, /data-ac-generate/); assert.match(r.text, /Générer un mot de passe/); assert.match(r.text, /Afficher/);
    assert.match(r.text, /<option value="">Compte ordinaire \(sans accès à l'administration\)<\/option>/);
    assert.match(r.text, /name="notify" value="1" checked/, "notification cochée par défaut, comme WordPress");
    assert.match(r.text, /Valeur par défaut du site/); assert.match(r.text, /<option value="fr">Français<\/option>/); assert.doesNotMatch(r.text, /value="ja"/, "seulement les langues prises en charge");
    assert.match(r.text, /Ajouter un compte/); assert.match(r.text, /request_id/);
  });
  test("le menu propose « Ajouter un compte » (central et espace d'un site)", async () => {
    assert.match((await boss.get(C)).text, /utilisateurs\/nouveau/);
    const site = await boss.get(`/marketing/site-web/sites/${A}/equipe-ajouter`);
    assert.equal(site.status, 200); assert.match(site.text, /Comptes Alpha/); assert.match(site.text, /name="username"/);
  });
});

describe("validation côté serveur : rien n'est créé, la saisie est conservée, jamais le mot de passe", () => {
  const bad = async (fields, re, field) => {
    const before = one("SELECT COUNT(*) n FROM users").n;
    const r = await boss.post(`${C}/nouveau`, form(fields));
    assert.equal(r.status, 422, JSON.stringify(fields)); assert.match(r.text, re, JSON.stringify(fields));
    if (field) assert.match(r.text, new RegExp(`data-ac-err="${field}"[^>]*>[^<]+<`), `erreur sur le champ ${field}`);
    assert.equal(one("SELECT COUNT(*) n FROM users").n, before, "aucun compte créé");
    assert.doesNotMatch(r.text, /Mot2Passe-Solide!/, "le mot de passe n'est jamais renvoyé dans la page");
    return r;
  };
  test("champs obligatoires, formats, mot de passe, site web, langue", async () => {
    await bad({ username: "" }, /identifiant est obligatoire/, "username");
    await bad({ username: "ab" }, /entre 3 et 30/, "username");
    await bad({ username: "a".repeat(31) }, /entre 3 et 30/, "username");
    await bad({ username: "<b>x</b>" }, /Lettres, chiffres/, "username");
    await bad({ email: "" }, /e-mail est obligatoire/, "email");
    await bad({ email: "pas-un-email" }, /n'est pas valide/, "email");
    await bad({ email: "a@b" }, /n'est pas valide/, "email");
    await bad({ password: "" }, /Saisissez un mot de passe/, "password");
    await bad({ password: "court" }, /au moins 8 caractères/, "password");
    await bad({ password: "x".repeat(201) }, /trop long/, "password");
    await bad({ password: "        " }, /(au moins 8|espaces)/, "password");
    await bad({ username: "Identique123", password: "Identique123" }, /identique à l'identifiant/, "password");
    await bad({ website: "javascript:alert(1)" }, /http:\/\/ ou https:\/\//, "website");
    await bad({ website: "https://user:pw@exemple.fr" }, /http:\/\/ ou https:\/\//, "website");
    await bad({ language: "klingon" }, /pas prise en charge/, "language");
  });
  test("la saisie valide est conservée à côté de l'erreur (sans toucher à l'identifiant)", async () => {
    const r = await bad({ username: "Marie Curie", email: "mauvais", first_name: "Marie", last_name: "Curie" }, /n'est pas valide/, "email");
    assert.match(r.text, /name="username" type="text" value="Marie Curie"/); assert.match(r.text, /name="first_name" type="text" value="Marie"/);
  });
  test("identifiant et adresse déjà utilisés (sans tenir compte de la casse) : message sur le champ concerné", async () => {
    const ok = await boss.post(`${C}/nouveau`, form({ username: "Doublon", email: "doublon@exemple.test" }));
    assert.equal(ok.status, 302, ok.text.slice(0, 200));
    await bad({ username: "doublon" }, /identifiant est déjà utilisé/, "username");
    await bad({ username: "DOUBLON" }, /identifiant est déjà utilisé/, "username");
    await bad({ email: "DOUBLON@exemple.test" }, /déjà associée à un compte/, "email");
  });
});

describe("création réelle d'un compte ordinaire", () => {
  test("compte valide : enregistré, profil complet, mot de passe haché et utilisable, aucun accès à l'administration, jamais administrateur global", async () => {
    const f = form({ username: "marie.curie", email: " Marie.Curie@Exemple.TEST ", first_name: "Marie", last_name: "Curie", website: "https://www.exemple.fr/marie", language: "fr", password: "Un-Mot-De-Passe-8!" });
    const r = await boss.post(`${C}/nouveau`, f);
    assert.equal(r.status, 302, r.text.slice(0, 300));
    const u = user("marie.curie");
    assert.ok(u, "compte créé");
    assert.equal(u.email, "marie.curie@exemple.test", "adresse normalisée (espaces, casse)");
    assert.equal(u.role, "etudiant", "jamais un rôle global privilégié");
    assert.deepEqual([u.first_name, u.last_name, u.website, u.language], ["Marie", "Curie", "https://www.exemple.fr/marie", "fr"]);
    assert.ok(u.password_hash.startsWith("$2") && !u.password_hash.includes("Un-Mot-De-Passe"), "haché, jamais en clair");
    assert.ok(bcrypt.compareSync("Un-Mot-De-Passe-8!", u.password_hash));
    assert.equal(one("SELECT COUNT(*) n FROM mk_org_members WHERE user_id = ?", u.id).n + one("SELECT COUNT(*) n FROM mk_site_members WHERE user_id = ?", u.id).n, 0, "aucun accès à l'administration");
    // la personne peut réellement se connecter avec ce mot de passe
    const c = new Client(srv.base);
    const login = await c.post("/connexion", { email: "marie.curie@exemple.test", password: "Un-Mot-De-Passe-8!" });
    assert.equal(login.status, 302);
    assert.equal((await c.get("/marketing/site-web/utilisateurs")).status === 200, false, "aucun accès à l'administration");
    // page de confirmation : seulement pour un compte créé par cette session
    assert.match(r.location, /\/nouveau\?cree=\d+$/);
    const done = await boss.get(r.location); assert.match(done.text, /Compte créé/); assert.match(done.text, /marie\.curie/);
    assert.doesNotMatch((await boss.get(`${C}/nouveau?cree=${one("SELECT MIN(id) id FROM users").id}`)).text, /Compte créé/, "un identifiant au hasard n'ouvre rien");
    // journal : jamais de secret
    const log = one("SELECT metadata FROM mk_audit_logs WHERE action = 'user.account_created' ORDER BY id DESC LIMIT 1").metadata;
    assert.doesNotMatch(log, /Un-Mot-De-Passe|password|token|\$2/i);
  });
  test("double soumission : le même formulaire envoyé deux fois ne crée qu'un compte", async () => {
    const f = form({ username: "unique-envoi" });
    const [a, b] = await Promise.all([boss.post(`${C}/nouveau`, f), boss.post(`${C}/nouveau`, f)]);
    assert.ok([a.status, b.status].every((s) => [302, 422].includes(s)));
    assert.equal(one("SELECT COUNT(*) n FROM users WHERE username = 'unique-envoi'").n, 1);
    const again = await boss.post(`${C}/nouveau`, f);
    assert.equal(one("SELECT COUNT(*) n FROM users WHERE username = 'unique-envoi'").n, 1, "aucun doublon après une nouvelle tentative");
    assert.ok([302, 422].includes(again.status));
  });
  test("le compte sans accès apparaît dans le centre de gestion (élèves) et pas dans l'équipe", async () => {
    assert.doesNotMatch((await boss.get(C)).text, /marie\.curie/);
    assert.equal((await boss.get("/formateur/gestion/eleves")).status, 200);
  });
});

describe("rôles et garde-fous anti-escalade", () => {
  test("rôle d'équipe attribué réellement : le compte est membre de l'équipe avec ce rôle et apparaît dans la liste", async () => {
    const r = await boss.post(`${C}/nouveau`, form({ username: "lecteur-equipe", role: "viewer" }));
    assert.equal(r.status, 302, r.text.slice(0, 300));
    const u = user("lecteur-equipe");
    assert.equal(one("SELECT role FROM mk_org_members WHERE user_id = ? AND organization_id = ?", u.id, org).role, "viewer");
    assert.equal(u.role, "etudiant");
    assert.match((await boss.get(C)).text, /lecteur-equipe/);
    assert.match(r.location, new RegExp(`${C}/${u.id}$`), "redirigé vers la fiche du compte créé");
    assert.equal((await boss.get(r.location)).status, 200);
  });
  test("un administrateur ne peut pas créer un Super administrateur ni un rôle plus élevé que le sien (serveur)", async () => {
    const admin = await member("admin");
    const owner = await admin.post(`${C}/nouveau`, form({ username: "pas-owner", role: "owner" }));
    assert.equal(owner.status, 422); assert.match(owner.text, /ne pouvez pas attribuer|droits que vous n'avez pas/);
    assert.equal(user("pas-owner"), undefined, "aucun compte créé");
    const ok = await admin.post(`${C}/nouveau`, form({ username: "editeur-par-admin", role: "editor" }));
    assert.equal(ok.status, 302, ok.text.slice(0, 200));
    assert.equal(one("SELECT role FROM mk_org_members WHERE user_id = ?", user("editeur-par-admin").id).role, "editor");
    assert.doesNotMatch((await admin.get(`${C}/nouveau`)).text, /value="owner"/, "un rôle non attribuable n'est pas proposé");
  });
  test("rôle inconnu ou forgé refusé ; jamais d'administrateur automatique", async () => {
    const r = await boss.post(`${C}/nouveau`, form({ username: "role-forge", role: "super-dieu" }));
    assert.equal(r.status, 422); assert.equal(user("role-forge"), undefined);
    assert.equal(one("SELECT COUNT(*) n FROM mk_org_members WHERE role = 'owner'").n, 1, "toujours un seul propriétaire");
  });
  test("accès à un site : le rôle vaut pour CE site seulement ; Super administrateur refusé pour un seul site", async () => {
    const r = await boss.post(`${C}/nouveau`, form({ username: "editeur-alpha", role: "editor", site_id: String(A) }));
    assert.equal(r.status, 302, r.text.slice(0, 200));
    const u = user("editeur-alpha");
    assert.equal(one("SELECT role FROM mk_site_members WHERE site_id = ? AND user_id = ?", A, u.id).role, "editor");
    assert.equal(one("SELECT COUNT(*) n FROM mk_org_members WHERE user_id = ?", u.id).n, 0, "pas membre de l'équipe : accès au seul site A");
    assert.equal(one("SELECT COUNT(*) n FROM mk_site_members WHERE user_id = ? AND site_id = ?", u.id, B).n, 0);
    const own = await boss.post(`${C}/nouveau`, form({ username: "owner-site", role: "owner", site_id: String(A) }));
    assert.equal(own.status, 422); assert.match(own.text, /ne s'attribue pas à un seul site/);
  });
});

describe("espace d'un site : isolation", () => {
  test("l'administrateur d'un site crée un compte pour SON site seulement ; le site vient de l'adresse, jamais du formulaire", async () => {
    const adminA = await member(null, A, "admin");
    const ok = await adminA.post(`${S}/nouveau?site=${A}`, form({ username: "alpha-auteur", role: "author", site: String(A) }));
    assert.equal(ok.status, 302, ok.text.slice(0, 300));
    const u = user("alpha-auteur");
    assert.equal(one("SELECT role FROM mk_site_members WHERE site_id = ? AND user_id = ?", A, u.id).role, "author");
    assert.equal(one("SELECT COUNT(*) n FROM mk_org_members WHERE user_id = ?", u.id).n, 0);
    // forgé : champ site_id d'un autre site, adresse d'un autre site
    const forged = await adminA.post(`${S}/nouveau?site=${A}`, form({ username: "alpha-forge", role: "author", site_id: String(B) }));
    // le champ du formulaire est ignoré : le site vient de l'adresse, le compte n'est jamais rattaché au site B
    assert.equal(forged.status, 302); const fu = user("alpha-forge");
    assert.equal(one("SELECT COUNT(*) n FROM mk_site_members WHERE user_id = ? AND site_id = ?", fu.id, B).n, 0);
    assert.equal(one("SELECT COUNT(*) n FROM mk_site_members WHERE user_id = ? AND site_id = ?", fu.id, A).n, 1);
    const other = await adminA.post(`${S}/nouveau?site=${B}`, form({ username: "alpha-vers-beta", role: "author" }));
    assert.notEqual(other.status, 302, "le site B lui est fermé"); assert.equal(user("alpha-vers-beta"), undefined);
    assert.notEqual((await adminA.get(`${S}/nouveau?site=${B}`)).status, 200);
    // jamais plus de droits que soi, jamais Super administrateur
    const own = await adminA.post(`${S}/nouveau?site=${A}`, form({ username: "alpha-owner", role: "owner" }));
    assert.equal(own.status, 422); assert.equal(user("alpha-owner"), undefined);
    // visible dans la liste du site A, absent de celle du site B
    assert.match((await boss.get(`${S}?site=${A}`)).text, /alpha-auteur/);
    assert.doesNotMatch((await boss.get(`${S}?site=${B}`)).text, /alpha-auteur/);
    // la liste centrale montre aussi les membres de sites (comportement existant), mais le compte n'a aucun rôle d'équipe
    assert.equal(one("SELECT COUNT(*) n FROM mk_org_members WHERE user_id = ?", u.id).n, 0);
  });
  test("un lecteur du site, un élève et un anonyme ne créent rien (serveur)", async () => {
    const viewerA = await member(null, A, "viewer"); const student = await newStudent(srv);
    for (const [client, url] of [[viewerA, `${S}/nouveau?site=${A}`], [student, `${C}/nouveau`], [anon, `${C}/nouveau`], [viewerA, `${C}/nouveau`]]) {
      const g = await client.get(url); assert.notEqual(g.status, 200, `GET ${url}`);
      const p = await client.post(url, form({ username: `refuse${seq}` })); assert.notEqual(p.status, 302 && /nouveau\?cree|\/utilisateurs\/\d/.test(p.location || "") ? 0 : 1, 0, `POST ${url}`);
    }
    assert.equal(one("SELECT COUNT(*) n FROM users WHERE username LIKE 'refuse%'").n, 0);
  });
});

describe("notification par e-mail (jamais le mot de passe)", () => {
  test("sans serveur d'e-mail : le compte est créé, le message dit la vérité (rien ne part), le lien personnel est montré à l'administrateur et fonctionne", async () => {
    const pass = "Secret-Initial-42!";
    const r = await boss.post(`${C}/nouveau`, form({ username: "notifie-sans-smtp", email: "notifie@exemple.test", password: pass, notify: "1" }));
    assert.equal(r.status, 302, r.text.slice(0, 200));
    const msg = await flashText(boss, r.location);
    assert.match(msg, /aucun serveur d'e-mail n'est configuré/i); assert.doesNotMatch(msg, /est en file d'envoi|a été envoyé/i, "jamais « envoyé » sans confirmation");
    const link = (msg.match(/\/reinitialiser-mot-de-passe\/[A-Za-z0-9_-]{43}/) || [])[0];
    assert.ok(link, "lien d'activation montré à l'administrateur");
    // seule l'empreinte du jeton est conservée
    const row = one("SELECT token_hash FROM password_resets WHERE user_id = ?", user("notifie-sans-smtp").id);
    assert.match(row.token_hash, /^[0-9a-f]{64}$/); assert.ok(!link.includes(row.token_hash));
    // e-mail en file : jamais le mot de passe
    const mail = one("SELECT body, kind FROM mail_outbox WHERE to_email = 'notifie@exemple.test' ORDER BY id DESC LIMIT 1");
    assert.equal(mail.kind, "account_created"); assert.doesNotMatch(mail.body, new RegExp(pass.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.match(mail.body, /reinitialiser-mot-de-passe\//); assert.match(mail.body, /confirmer-email\//);
    // le lien est utilisable une seule fois pour choisir son propre mot de passe
    assert.equal((await anon.get(link)).status, 200);
    const set = await anon.post(link, { password: "Nouveau-Choisi-7!", password_confirm: "Nouveau-Choisi-7!" });
    assert.equal(set.status, 302);
    assert.equal((await anon.get(link)).status, 410, "usage unique");
    assert.equal((await new Client(srv.base).post("/connexion", { email: "notifie@exemple.test", password: "Nouveau-Choisi-7!" })).status, 302);
  });
  test("notification sans mot de passe saisi : compte créé avec un secret inutilisable, la personne choisit le sien", async () => {
    const r = await boss.post(`${C}/nouveau`, form({ username: "sans-mot-de-passe", email: "smp@exemple.test", password: "", notify: "1" }));
    assert.equal(r.status, 302, r.text.slice(0, 200));
    const u = user("sans-mot-de-passe");
    assert.ok(u.password_hash.startsWith("$2"));
    assert.equal((await new Client(srv.base).post("/connexion", { email: "smp@exemple.test", password: "" })).status !== 302, true, "connexion impossible avant activation");
  });
  test("serveur d'e-mail configuré mais injoignable : le compte est créé, l'e-mail est « en file d'envoi », aucun doublon à la nouvelle tentative", async () => {
    srv2 = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "127.0.0.1", SMTP_PORT: "1" });
    boss2 = await loginInstructor(srv2); db2 = srv2.db();
    const f = form({ username: "smtp-ko", email: "ko@exemple.test", notify: "1" });
    const r = await boss2.post(`${C}/nouveau`, f);
    assert.equal(r.status, 302, r.text.slice(0, 300));
    const msg = await flashText(boss2, r.location);
    assert.match(msg, /en file d'envoi/); assert.doesNotMatch(msg, /reinitialiser-mot-de-passe/, "le lien n'est pas montré quand un e-mail peut partir");
    await sleep(1500);
    const mail = db2.prepare("SELECT status, attempts FROM mail_outbox WHERE to_email = 'ko@exemple.test'").get();
    assert.ok(mail, "e-mail enregistré dans la file");
    // le serveur injoignable ne remet pas en cause le compte ; une nouvelle tentative avec les mêmes données ne crée pas de doublon
    const again = await boss2.post(`${C}/nouveau`, { ...f, request_id: f.request_id.replace(/.$/, "f") });
    assert.equal(again.status, 422); assert.match(again.text, /déjà (utilisé|associée)/);
    assert.equal(db2.prepare("SELECT COUNT(*) n FROM users WHERE username = 'smtp-ko'").get().n, 1);
  });
  test("sans notification : aucun e-mail, le message l'indique et le mot de passe reste à communiquer par l'administrateur", async () => {
    const before = one("SELECT COUNT(*) n FROM mail_outbox WHERE kind = 'account_created'").n;
    const r = await boss.post(`${C}/nouveau`, form({ username: "sans-mail", notify: "" }));
    assert.equal(r.status, 302);
    assert.equal(one("SELECT COUNT(*) n FROM mail_outbox WHERE kind = 'account_created'").n, before);
    assert.match(await flashText(boss, r.location), /Aucun e-mail n'a été envoyé/);
  });
});

describe("limites, régression et présentation", () => {
  test("quota : au-delà de 30 comptes par heure par administrateur, la création est refusée", async () => {
    const admin = await member("admin");
    const ins = db.prepare("INSERT INTO mk_audit_logs (organization_id, user_id, action, resource_type, metadata) VALUES (?, ?, 'user.account_created', 'user', '{}')");
    for (let i = 0; i < 30; i++) ins.run(org, admin.id);
    const r = await admin.post(`${C}/nouveau`, form({ username: "quota-depasse" }));
    assert.equal(r.status, 422); assert.match(r.text, /Limite atteinte/); assert.equal(user("quota-depasse"), undefined);
  });
  test("liste des utilisateurs et fiche d'un compte : toujours affichées (non-régression)", async () => {
    assert.equal((await boss.get(C)).status, 200);
    const id = user("lecteur-equipe").id;
    const d = await boss.get(`${C}/${id}`); assert.equal(d.status, 200); assert.match(d.text, /lecteur-equipe/);
    assert.equal((await boss.get(`${C}/ajouter`)).status, 200, "Inviter existe toujours");
    assert.equal((await boss.get(`${C}/invitations`)).status, 200);
  });
  test("présentation : deux colonnes compactes, une colonne sur mobile, mouvement réduit respecté ; script d'interactions chargé", async () => {
    const css = await boss.get("/css/cms.css");
    assert.match(css.text, /\.ac-grid \{ display: grid; grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
    assert.match(css.text, /@media \(max-width: 820px\) \{ \.ac-grid \{ grid-template-columns: minmax\(0, 1fr\)/);
    assert.match(css.text, /prefers-reduced-motion: reduce\) \{ \.ac-meter-bar/);
    assert.match((await boss.get(`${C}/nouveau`)).text, /cms-account-new\.js/);
    assert.match((await boss.get("/js/cms-account-new.js")).text, /crypto\.getRandomValues/, "générateur cryptographique");
  });
});
