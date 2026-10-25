// « Messages reçus » de Mon espace (/formateur/messages) : boîte de réception du formulaire de contact. Liste paginée (aucun message n'est masqué), recherche et filtre côté serveur,
// ordre stable, lecture d'un message (marqué lu à l'ouverture, rétablissable), suppression en deux temps, redirections sans adresse libre, échappement, accès réservé au formateur.
// Volet unitaire (services/inbox) puis volet serveur réel.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { startServer, loginInstructor, newStudent, Client } = require("./helpers");

const read = (...p) => fs.readFileSync(path.join(__dirname, "..", ...p), "utf8");

describe("Messages : service (unitaire)", () => {
  let inbox, db;
  const add = (name, email, subject, message, offset = "0 minutes", readAt = null) =>
    db.prepare("INSERT INTO contact_messages (name, email, subject, message, created_at, read_at) VALUES (?, ?, ?, ?, datetime('now', ?), ?)").run(name, email, subject, message, `-${offset}`, readAt).lastInsertRowid;
  before(() => {
    const tmp = fs.mkdtempSync(path.join(require("node:os").tmpdir(), "koyekola-mb-"));
    process.env.DATA_DIR = path.join(tmp, "data"); process.env.UPLOADS_DIR = path.join(tmp, "uploads");
    db = require("../src/config/database");
    inbox = require("../src/services/inbox");
  });

  test("boîte vide : aucune ligne, une seule page", () => {
    const r = inbox.list();
    assert.deepEqual([r.rows.length, r.total, r.pages, r.page], [0, 0, 1, 1]);
    assert.deepEqual(inbox.counts(), { total: 0, unread: 0 });
  });

  test("tous les messages restent accessibles : 70 messages = 3 pages, aucun n'est coupé", () => {
    for (let i = 0; i < 70; i++) add(`Expéditeur ${i}`, `e${i}@x.fr`, `Objet ${i}`, `Texte ${i}`, `${i} hours`);
    const p1 = inbox.list(), p3 = inbox.list({ page: 3 });
    assert.equal(p1.total, 70); assert.equal(p1.pages, 3); assert.equal(p1.rows.length, inbox.PAGE_SIZE);
    assert.equal(p3.rows.length, 70 - 2 * inbox.PAGE_SIZE);
    assert.equal(p1.rows[0].name, "Expéditeur 0", "du plus récent au plus ancien");
    assert.equal(p3.rows.at(-1).name, "Expéditeur 69", "le plus ancien est atteignable");
    assert.equal(inbox.list({ page: 99 }).page, 3, "page hors limites ramenée à la dernière");
    assert.equal(inbox.list({ page: "abc" }).page, 1);
  });

  test("marquer un message lu ne le déplace pas dans la liste", () => {
    const before = inbox.list().rows.map((m) => m.id);
    inbox.markRead(before[0]);
    assert.deepEqual(inbox.list().rows.map((m) => m.id), before);
  });

  test("lu / non lu : rétablissable, compteurs cohérents, identifiant invalide sans effet", () => {
    const [{ id }] = inbox.list().rows;
    inbox.markRead(id); const read1 = inbox.get(id).read_at; assert.ok(read1);
    inbox.markRead(id); assert.equal(inbox.get(id).read_at, read1, "déjà lu : la date d'origine est conservée");
    const unreadBefore = inbox.counts().unread;
    inbox.markUnread(id); assert.equal(inbox.get(id).read_at, null); assert.equal(inbox.counts().unread, unreadBefore + 1);
    assert.equal(inbox.get("abc"), null); assert.equal(inbox.get(-1), null); assert.equal(inbox.get(999999), null);
    assert.equal(inbox.markRead(999999), false);
  });

  test("recherche : nom, e-mail, objet et texte ; % et _ sont du texte, pas des motifs", () => {
    add("Marie Curie", "marie@radium.fr", "Radioactivité", "Un message sur le polonium.");
    add("Pierre", "pierre@x.fr", "100% satisfait", "Un_texte avec tiret bas.");
    assert.equal(inbox.list({ q: "curie" }).total, 1);
    assert.equal(inbox.list({ q: "radium.fr" }).total, 1);
    assert.equal(inbox.list({ q: "radioactiv" }).total, 1);
    assert.equal(inbox.list({ q: "polonium" }).total, 1);
    assert.equal(inbox.list({ q: "%" }).total, 1, "« % » ne correspond pas à tout");
    assert.equal(inbox.list({ q: "t_xte" }).total, 0, "« _ » ne remplace pas un caractère");
    assert.equal(inbox.list({ q: "Un_texte" }).total, 1);
    assert.equal(inbox.list({ q: "introuvable" }).rows.length, 0);
    assert.equal(inbox.list({ q: "'; DROP TABLE contact_messages; --" }).total, 0);
    assert.ok(inbox.counts().total >= 72, "la table est intacte");
  });

  test("filtre « non lus » combinable avec la recherche", () => {
    const all = inbox.counts();
    assert.equal(inbox.list({ unreadOnly: true }).total, all.unread);
    const id = add("Lecteur", "l@x.fr", "Déjà lu", "mot-unique", "0 minutes", "2026-01-01 10:00:00");
    assert.equal(inbox.list({ q: "mot-unique", unreadOnly: true }).total, 0);
    assert.equal(inbox.list({ q: "mot-unique" }).total, 1);
    assert.ok(id);
  });

  test("page d'un message et message ouvert conservé dans « non lus »", () => {
    const rows = inbox.list({ page: 2 }).rows; const target = rows[3];
    assert.equal(inbox.pageOf(target.id, {}), 2);
    assert.equal(inbox.pageOf(inbox.list().rows[0].id, {}), 1);
    assert.equal(inbox.pageOf(999999, {}), 1);
    inbox.markRead(target.id);
    assert.equal(inbox.list({ unreadOnly: true }).rows.some((m) => m.id === target.id), false);
    assert.equal(inbox.list({ unreadOnly: true, keepId: target.id }).rows.concat(inbox.list({ unreadOnly: true, keepId: target.id, page: 2 }).rows).some((m) => m.id === target.id), true);
    inbox.markUnread(target.id);
  });

  test("aperçu, initiales et lien de réponse", () => {
    assert.equal(inbox.preview("  a\n\n b\t c  "), "a b c");
    assert.ok(inbox.preview("x".repeat(500)).endsWith("…"));
    assert.equal(inbox.initials("Julie Moreau"), "JM");
    assert.equal(inbox.initials("Madonna"), "MA");
    assert.equal(inbox.initials("  "), "?");
    assert.equal(inbox.initials("Émile Zola Dupont"), "ÉD");
    assert.equal(inbox.replyHref({ email: "a@b.fr", subject: "Facture" }), "mailto:a%40b.fr?subject=Re%3A%20Facture");
    assert.equal(inbox.replyHref({ email: "a@b.fr", subject: "Re: Facture" }), "mailto:a%40b.fr?subject=Re%3A%20Facture", "pas de « Re: Re: »");
    assert.equal(inbox.replyHref({ email: "a@b.fr", subject: "" }), "mailto:a%40b.fr?subject=Re%3A%20votre%20message");
    assert.doesNotMatch(inbox.replyHref({ email: "a@b.fr", subject: "x\r\nBcc: z@z.fr" }), /%0[AD]/i, "pas d'injection d'en-tête par retour à la ligne");
  });

  test("repère de date de la liste, à l'heure de Paris", () => {
    const now = new Date("2026-10-25T10:00:00Z");
    assert.equal(inbox.shortDate("2026-10-25 08:30:00", now).text, "09:30");
    assert.equal(inbox.shortDate("2026-10-24 23:30:00", now).text, "01:30", "23 h 30 UTC le 24 = 01:30 le 25 à Paris (heure d'été)");
    assert.equal(inbox.shortDate("2026-09-12 08:00:00", now).text, "12 sept.");
    assert.equal(inbox.shortDate("2025-09-12 08:00:00", now).text, "12/09/2025");
    assert.equal(inbox.shortDate("n'importe quoi", now).text, "");
  });
});

describe("Messages : page (serveur réel)", () => {
  let srv, prof, eleve;
  const sql = (query, ...a) => { const db = srv.db(); const r = db.prepare(query).all(...a); db.close(); return r; };
  const run = (query, ...a) => { const db = srv.db(); const r = db.prepare(query).run(...a); db.close(); return r; };
  const add = (name, subject, message, extra = {}) => Number(run("INSERT INTO contact_messages (name, email, subject, message, created_at, read_at) VALUES (?, ?, ?, ?, ?, ?)", name, extra.email || `${name.replace(/\W/g, "").toLowerCase()}@exemple.fr`, subject, message, extra.at || "2026-10-01 10:00:00", extra.readAt || null).lastInsertRowid);
  before(async () => { srv = await startServer(); prof = await loginInstructor(srv); eleve = await newStudent(srv); });
  after(() => srv.stop());

  test("réservée au formateur : anonyme renvoyé à la connexion, élève refusé, y compris pour les actions", async () => {
    const id = add("Zoé", "Accès", "Message de test pour les accès.");
    assert.equal((await new Client(srv.base).get("/formateur/messages")).status, 302);
    assert.equal((await eleve.get("/formateur/messages")).status, 403);
    assert.equal((await eleve.get(`/formateur/messages?id=${id}`)).status, 403);
    for (const action of ["lu", "non-lu", "supprimer"]) assert.equal((await eleve.post(`/formateur/messages/${id}/${action}`, {})).status, 403, action);
    assert.equal(sql("SELECT COUNT(*) n FROM contact_messages WHERE id = ?", id)[0].n, 1, "rien n'a été supprimé");
    run("DELETE FROM contact_messages");
  });

  test("boîte vide : état explicite, aucune lecture ouverte, aucun chiffre inventé", async () => {
    const r = await prof.get("/formateur/messages");
    assert.equal(r.status, 200);
    assert.match(r.text, /Aucun message pour le moment/);
    assert.match(r.text, /Choisissez un message/);
    assert.doesNotMatch(r.text, /class="mb-item[ "]/);
  });

  test("liste : tous les messages sont atteignables par la pagination, du plus récent au plus ancien", async () => {
    for (let i = 0; i < 65; i++) add(`Personne ${String(i).padStart(2, "0")}`, `Objet ${i}`, `Texte ${i}`, { at: `2026-10-${String(1 + (i % 28)).padStart(2, "0")} 1${i % 10}:00:00` });
    const p1 = await prof.get("/formateur/messages");
    assert.equal((p1.text.match(/class="mb-item[ "]/g) || []).length, 30);
    assert.match(p1.text, /Page 1 sur 3/);
    assert.match(p1.text, /href="\/formateur\/messages\?page=2"[^>]*rel="next"/);
    const p3 = await prof.get("/formateur/messages?page=3");
    assert.equal((p3.text.match(/class="mb-item[ "]/g) || []).length, 5);
    assert.match(p3.text, /Plus récents/);
    assert.doesNotMatch(p3.text, /rel="next"/);
    assert.equal((await prof.get("/formateur/messages?page=999")).status, 200);
  });

  test("recherche et filtre côté serveur, avec réinitialisation", async () => {
    add("Recherchée Unique", "Sujet rare", "Contenu rare xylophone");
    const hit = await prof.get("/formateur/messages?q=xylophone");
    assert.equal((hit.text.match(/class="mb-item[ "]/g) || []).length, 1);
    assert.match(hit.text, /Recherchée Unique/);
    assert.match(hit.text, /1 résultat/);
    const none = await prof.get("/formateur/messages?q=zzzintrouvablezzz");
    assert.match(none.text, /Aucun message ne correspond/);
    assert.match(none.text, /href="\/formateur\/messages">Réinitialiser les filtres/);
    const unread = await prof.get("/formateur/messages?filtre=non-lus");
    assert.match(unread.text, /aria-current="true">Non lus/);
    assert.equal((await prof.get("/formateur/messages?q[]=a&q[]=b")).status, 200, "saisie en tableau tolérée");
  });

  test("ouvrir un message : contenu complet, marqué lu, pastille de navigation à jour, réponse par e-mail", async () => {
    const id = add("Nadia Benali", "Question sur la facture", "Bonjour,\nPouvez-vous m'envoyer ma facture ?\nMerci.", { email: "nadia@exemple.fr" });
    const before = sql("SELECT COUNT(*) n FROM contact_messages WHERE read_at IS NULL")[0].n;
    const r = await prof.get(`/formateur/messages?id=${id}`);
    assert.equal(r.status, 200);
    assert.match(r.text, /<h2 id="mb-title">Question sur la facture<\/h2>/);
    assert.match(r.text, /Pouvez-vous m&#39;envoyer ma facture/);
    assert.match(r.text, /href="mailto:nadia@exemple\.fr\?subject=|href="mailto:nadia%40exemple\.fr\?subject=Re%3A%20Question%20sur%20la%20facture"/);
    assert.match(r.text, /Répondre par e-mail/);
    assert.notEqual(sql("SELECT read_at FROM contact_messages WHERE id = ?", id)[0].read_at, null, "marqué lu à l'ouverture");
    assert.match(r.text, new RegExp(`Messages</span><span class="dash-badge" aria-label="${before - 1} non lu\\(s\\)">${before - 1}</span>`), "la pastille reflète déjà la lecture");
    assert.match(r.text, /Marquer comme non lu/);
    assert.match(r.text, /<div class="mb-shell has-open">/);
  });

  test("ouvrir un message ne touche pas aux autres ; sans id, rien n'est marqué lu", async () => {
    const a = add("Intacte", "Reste non lue", "Message à ne pas toucher.");
    await prof.get("/formateur/messages");
    await prof.get("/formateur/messages?filtre=non-lus");
    assert.equal(sql("SELECT read_at FROM contact_messages WHERE id = ?", a)[0].read_at, null);
  });

  test("marquer comme non lu, puis supprimer en deux temps ; la redirection garde la recherche et la page", async () => {
    const id = add("Cycle Vie", "Cycle", "Message du cycle de vie xylophone2.");
    await prof.get(`/formateur/messages?id=${id}`);
    const r1 = await prof.post(`/formateur/messages/${id}/non-lu`, { q: "xylophone2", filtre: "non-lus", page: "1" });
    assert.equal(r1.status, 302);
    assert.equal(r1.headers.get("location"), `/formateur/messages?q=xylophone2&filtre=non-lus&id=${id}`);
    assert.equal(sql("SELECT read_at FROM contact_messages WHERE id = ?", id)[0].read_at, null);
    const open = await prof.get(`/formateur/messages?id=${id}`);
    assert.match(open.text, /<details class="mb-delete">/, "la suppression demande une confirmation sans JavaScript");
    assert.match(open.text, /Oui, supprimer/);
    const r2 = await prof.post(`/formateur/messages/${id}/supprimer`, { q: "xylophone2" });
    assert.equal(r2.headers.get("location"), "/formateur/messages?q=xylophone2");
    assert.equal(sql("SELECT COUNT(*) n FROM contact_messages WHERE id = ?", id)[0].n, 0);
  });

  test("aucune redirection vers une adresse libre : seuls q, filtre et page sont repris", async () => {
    const id = add("Redir", "Redirection", "Test de redirection.");
    for (const body of [{ retour: "https://evil.example/", q: "" }, { q: "https://evil.example/", page: "//evil.example" }, { filtre: "http://evil.example", page: "-4" }]) {
      const r = await prof.post(`/formateur/messages/${id}/lu`, body);
      assert.match(r.headers.get("location"), /^\/formateur\/messages(\?|$)/, JSON.stringify(body));
      assert.doesNotMatch(r.headers.get("location"), /^\/\/|^https?:/);
    }
  });

  test("message introuvable : avis explicite, la liste reste utilisable ; identifiants invalides sans effet", async () => {
    for (const bad of ["999999", "abc", "-1", "1e3", "0"]) {
      const r = await prof.get(`/formateur/messages?id=${bad}`);
      assert.equal(r.status, 200, bad);
      assert.match(r.text, /Ce message n'existe plus/, bad);
    }
    const count = sql("SELECT COUNT(*) n FROM contact_messages")[0].n;
    await prof.post("/formateur/messages/999999/supprimer", {});
    await prof.post("/formateur/messages/abc/supprimer", {});
    assert.equal(sql("SELECT COUNT(*) n FROM contact_messages")[0].n, count);
  });

  test("contenu saisi par le visiteur : échappé partout, URL et textes très longs sans HTML injecté", async () => {
    const id = add("<img src=x onerror=alert(1)>", "<script>alert(1)</script>", `https://exemple.fr/${"a".repeat(300)}\n<b>gras</b>\n${"mot ".repeat(400)}`, { email: "x@y.fr" });
    const list = (await prof.get("/formateur/messages")).text + (await prof.get(`/formateur/messages?id=${id}`)).text;
    assert.doesNotMatch(list, /<script>alert\(1\)|<img src=x|<b>gras<\/b>/);
    assert.match(list, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
    assert.match(list, /&lt;b&gt;gras&lt;\/b&gt;/);
  });

  test("accessibilité : régions nommées, filtre et page courante indiqués, non-lu dit en toutes lettres, retour vers la liste", async () => {
    const id = add("Accessible", "Titre accessible", "Texte.");
    const r = await prof.get(`/formateur/messages?id=${id}`);
    assert.match(r.text, /<section class="mb-list" aria-label="Liste des messages">/);
    assert.match(r.text, /<section class="mb-reader" aria-label="Message ouvert">/);
    assert.match(r.text, /role="search"/);
    assert.match(r.text, /<label class="sr-only" for="mb-q">/);
    assert.match(r.text, /<nav class="mb-tabs" aria-label="Filtrer les messages">/);
    assert.match(r.text, new RegExp(`class="mb-item is-open" href="/formateur/messages\\?[^"]*id=${id}" aria-current="true"`));
    assert.match(r.text, /<span class="sr-only">Non lu : <\/span>/, "le statut ne repose pas que sur la couleur");
    assert.match(r.text, /class="mb-back" href="\/formateur\/messages(?:\?page=\d+)?">/);
    assert.match(r.text, /aria-hidden="true">[A-Z?]{1,2}<\/span>/, "avatars décoratifs : initiales, jamais d'image inventée");
  });

  test("les actions existantes sont conservées (lu, supprimer) et l'ancien tri « non lus d'abord » n'existe plus", async () => {
    const old = add("Ancien", "Ancien lu", "Message lu, ancien.", { at: "2020-01-01 10:00:00", readAt: "2020-01-02 10:00:00" });
    const recent = add("Récent", "Récent non lu", "Message récent.", { at: "2026-10-24 10:00:00" });
    const page = (await prof.get("/formateur/messages?q=Message")).text;
    assert.ok(page.indexOf(`id=${recent}"`) < page.indexOf(`id=${old}"`), "le plus récent d'abord");
    await prof.post(`/formateur/messages/${recent}/lu`, {});
    assert.notEqual(sql("SELECT read_at FROM contact_messages WHERE id = ?", recent)[0].read_at, null);
    await prof.post(`/formateur/messages/${old}/supprimer`, {});
    assert.equal(sql("SELECT COUNT(*) n FROM contact_messages WHERE id = ?", old)[0].n, 0);
  });

  test("styles : uniquement les variables du thème (--dash-*), une seule animation douce désactivée en mouvement réduit", () => {
    const css = read("public", "css", "dashboard.css");
    const start = css.indexOf("Messages reçus de « Mon espace »"), end = css.indexOf("/* =====", start);
    const block = css.slice(start, end < 0 ? undefined : end);
    assert.ok(start > 0 && block.length > 500);
    assert.doesNotMatch(block.replace(/rgba?\([^)]*\)/g, ""), /#[0-9a-fA-F]{3,8}\b/, "aucune couleur écrite en dur");
    assert.match(block, /@media \(prefers-reduced-motion: no-preference\) \{[\s\S]*mb-message \{ animation/);
    assert.equal((block.match(/animation:/g) || []).length, 1);
    assert.doesNotMatch(block, /infinite|linear-gradient|text-shadow/);
  });
});
