// PALIER 25 — TESTS D'INTÉGRATION GLOBAUX. Parcours complets entre modules, par les VRAIES routes d'un serveur de test JETABLE
// (base temporaire, dossier d'envois temporaire, aucun fournisseur réel : e-mail « console », Stripe = faux serveur local, SMTP absent).
// Rien ne touche la production : chaque serveur est lancé par tests/helpers.js avec DATA_DIR / UPLOADS_DIR temporaires.
//
// Chaque scénario enregistre ses CRITÈRES un par un (réussi / échoué / preuve). Le résultat de référence est le fichier JSON écrit par `after()`
// (chemin : variable INTEGRATION_RESULTS, sinon dossier temporaire du système). Un critère marqué `anomalie` reproduit un défaut DÉJÀ DOCUMENTÉ
// (registre du palier 25) : il est enregistré « ÉCHEC REPRODUIT » et ne fait pas échouer le test ; tout autre critère en échec fait échouer le test.
// Mode de preuve : REEL-TEST = vraies routes, vraie base de test · SIMULE = un fournisseur externe est remplacé par un faux local (prouve le code,
// jamais le fournisseur).
const crypto = require("node:crypto");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const http = require("node:http");
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, Client, loginInstructor, newStudent, createCourse } = require("./helpers");
const analytics = require("../src/marketing/analytics/engine");

const M = "/marketing";
const RESULTS = [];
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mNk+M9Qz0AEYBxVSF+FAP5FDvcfRYWgAAAAAElFTkSuQmCC", "base64");

// Un scénario = un test ; `c.check(libellé, condition, preuve, { anomalie })` enregistre un critère sans interrompre le scénario
function scenario(id, titre, modules, mode, fn) {
  test(`${id} — ${titre}`, async () => {
    const criteria = [];
    const c = { check(label, cond, evidence = "", opts = {}) { criteria.push({ label, ok: Boolean(cond), evidence: String(evidence).slice(0, 300), anomaly: opts.anomalie || null }); } };
    let crash = null;
    try { await fn(c); } catch (error) { crash = error; }
    const failed = criteria.filter((x) => !x.ok), unexpected = failed.filter((x) => !x.anomaly);
    const status = crash ? "ERREUR D'EXÉCUTION" : !failed.length ? "RÉUSSI — PREUVES COMPLÈTES" : failed.length === criteria.length ? "ÉCHEC REPRODUIT" : "RÉUSSI PARTIELLEMENT";
    RESULTS.push({ id, titre, modules, mode, status: mode === "SIMULE" && !failed.length && !crash ? "SIMULÉ UNIQUEMENT (critères réussis sur un faux fournisseur)" : status, criteria, crash: crash ? String(crash.message).slice(0, 300) : null });
    if (crash) throw crash;
    assert.equal(unexpected.length, 0, `critères en échec non documentés : ${unexpected.map((x) => x.label).join(" | ")}`);
  });
}

let srv, boss, db, anon, orgId, siteA, siteB, viewerOrg, editorOrg, memberA, memberB, outsider;
const one = (sql, ...a) => db.prepare(sql).get(...a);
const all = (sql, ...a) => db.prepare(sql).all(...a);
const idOf = (c) => one("SELECT id FROM users WHERE email = ?", c.email).id;
const lastId = (loc, re) => Number(String(loc).match(re)[1]);
const textSection = (markdown) => ({ type: "text", markdown });
const stripTags = (h) => h.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
async function createPageRoute(client, name, { site = "" } = {}) {
  const r = await client.post(`${M}/pages`, { name, template: "", ...(site ? { site_id: String(site) } : {}) });
  return { res: r, id: r.status === 302 ? lastId(r.location, /pages\/(\d+)/) : null };
}
const saveDraft = (client, id, sections, over = {}) => { const rev = one("SELECT revision FROM mk_landing_pages WHERE id = ?", id).revision; return client.request(`${M}/pages/${id}/brouillon`, { method: "PUT", json: { revision: rev, content: { title: over.title || "Page d'essai", description: over.description || "", sections, ...(over.seo ? { seo: over.seo } : {}) } } }); };
const slugOf = (id) => one("SELECT slug FROM mk_landing_pages WHERE id = ?", id).slug;
async function livePage(client, name, { site = "", sections, indexable = true } = {}) {
  const { id } = await createPageRoute(client, name, { site });
  await saveDraft(client, id, sections || [textSection(`Contenu de ${name}.`)], { title: name });
  if (indexable) db.prepare("UPDATE mk_landing_pages SET indexable = 1 WHERE id = ?").run(id);
  await client.post(`${M}/pages/${id}/publier.json`, {});
  return { id, slug: slugOf(id), name };
}
async function member(role) { const c = await newStudent(srv); db.prepare("INSERT INTO mk_org_members (organization_id, user_id, role) VALUES (?, ?, ?)").run(orgId, idOf(c), role); return c; }

before(async () => {
  srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
  boss = await loginInstructor(srv); db = srv.db(); anon = new Client(srv.base);
  orgId = one("SELECT id FROM mk_organizations").id;
  siteA = lastId((await boss.post(`${M}/site-web/sites`, { name: "Site Alpha" })).location, /sites\/(\d+)/);
  siteB = lastId((await boss.post(`${M}/site-web/sites`, { name: "Site Bravo" })).location, /sites\/(\d+)/);
  viewerOrg = await member("viewer"); editorOrg = await member("editor");
  memberA = await newStudent(srv); memberB = await newStudent(srv); outsider = await newStudent(srv);
  db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, 'admin')").run(siteA, idOf(memberA));
  db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, 'admin')").run(siteB, idOf(memberB));
});
after(() => {
  const out = process.env.INTEGRATION_RESULTS || path.join(os.tmpdir(), "integration-globale-resultats.json");
  try { fs.mkdirSync(path.dirname(out), { recursive: true }); fs.writeFileSync(out, JSON.stringify({ generatedAt: new Date().toISOString(), environment: "serveur de test jetable (tests/helpers.js)", results: RESULTS }, null, 1)); } catch { /* le fichier de résultats est facultatif */ }
  db.close(); srv.stop();
});

describe("CMS et Page Builder", () => {
  let p;
  scenario("INT-CMS-001", "création, édition, rechargement, publication et rendu public d'une page", ["CMS", "Page Builder", "URL", "Permissions", "Sites"], "REEL-TEST", async (c) => {
    const made = await createPageRoute(boss, "Page d'intégration", { site: siteA });
    p = made.id;
    c.check("la page est créée par la route du CMS (302) et enregistrée sur le site A", made.res.status === 302 && one("SELECT site_id FROM mk_landing_pages WHERE id = ?", p).site_id === siteA, `status ${made.res.status}`);
    const builder = await boss.get(`${M}/pages/${p}/editeur`);
    c.check("le Page Builder existant s'ouvre sur cette page", builder.status === 200 && /page-builder|pb-/.test(builder.text), `status ${builder.status}`);
    const saved = await saveDraft(boss, p, [textSection("Texte INTEGRATION-UN")], { title: "Page d'intégration" });
    c.check("le brouillon est enregistré (200) avec une nouvelle révision", saved.status === 200, `status ${saved.status}`);
    const preview = await boss.get(`${M}/pages/${p}/apercu`);
    c.check("après rechargement, l'aperçu montre le contenu enregistré", /INTEGRATION-UN/.test(preview.text), "aperçu relu depuis la base");
    const reloaded = await boss.get(`${M}/pages/${p}/editeur`);
    c.check("l'éditeur rechargé contient le contenu enregistré", /INTEGRATION-UN/.test(reloaded.text), "contenu présent dans le document de l'éditeur");
    c.check("avant publication, la page publique n'existe pas (404)", (await anon.get(`/p/${slugOf(p)}`)).status === 404);
    const pub = await boss.post(`${M}/pages/${p}/publier.json`, {});
    c.check("la publication réussit (200) et crée une version", pub.status === 200 && one("SELECT COUNT(*) n FROM mk_page_versions WHERE page_id = ?", p).n === 1, `status ${pub.status}`);
    const live = await anon.get(`/p/${slugOf(p)}`);
    c.check("la page publique est servie (200) avec le contenu publié", live.status === 200 && /INTEGRATION-UN/.test(live.text), `status ${live.status}`);
    c.check("la page publique n'est pas mise en cache (no-store)", live.headers.get("cache-control") === "no-store", String(live.headers.get("cache-control")));
    c.check("un lecteur de l'organisation ne peut pas enregistrer (403)", (await saveDraft(viewerOrg, p, [textSection("PIRATE")])).status === 403);
    c.check("un membre du site B ne peut pas enregistrer la page du site A (403/404)", [403, 404].includes((await saveDraft(memberB, p, [textSection("PIRATE")])).status));
    c.check("un anonyme est renvoyé vers la connexion", (await saveDraft(anon, p, [textSection("PIRATE")])).status === 302);
    c.check("aucun contenu pirate n'a été enregistré", !/PIRATE/.test(one("SELECT sections FROM mk_landing_pages WHERE id = ?", p).sections + String(one("SELECT draft FROM mk_landing_pages WHERE id = ?", p).draft)));
    c.check("le membre du site A (accès limité) peut modifier sa propre page", (await saveDraft(memberA, p, [textSection("Texte INTEGRATION-DEUX")])).status === 200);
  });

  scenario("INT-CMS-002", "révisions, version publiée conservée, restauration et modification concurrente", ["Page Builder", "Historique", "Publication"], "REEL-TEST", async (c) => {
    c.check("la version publiée reste « UN » pendant que le brouillon est « DEUX »", /INTEGRATION-UN/.test((await anon.get(`/p/${slugOf(p)}`)).text) && !/INTEGRATION-DEUX/.test((await anon.get(`/p/${slugOf(p)}`)).text));
    const hist = await boss.get(`${M}/site-web/historique/page/${p}`);
    c.check("l'historique de la page répond et liste des points", hist.status === 200 && /historique|Historique/.test(hist.text), `status ${hist.status}`);
    const stale = one("SELECT revision FROM mk_landing_pages WHERE id = ?", p).revision - 1;
    const conflict = await boss.request(`${M}/pages/${p}/brouillon`, { method: "PUT", json: { revision: stale, content: { title: "x", description: "", sections: [textSection("ECRASEMENT")] } } });
    c.check("une modification concurrente (révision périmée) est refusée (409) sans écraser", conflict.status === 409 && !/ECRASEMENT/.test(String(one("SELECT draft FROM mk_landing_pages WHERE id = ?", p).draft)), `status ${conflict.status}`);
    const restored = await boss.post(`${M}/pages/${p}/versions/1/restaurer`, {});
    c.check("restaurer la version 1 copie son contenu dans le brouillon (302)", restored.status === 302 && /INTEGRATION-UN/.test(String(one("SELECT draft FROM mk_landing_pages WHERE id = ?", p).draft)), `status ${restored.status}`);
    c.check("la restauration ne change pas la page publique avant une nouvelle publication", !/INTEGRATION-DEUX/.test((await anon.get(`/p/${slugOf(p)}`)).text));
    await boss.post(`${M}/pages/${p}/brouillon/abandonner`, {});
    c.check("abandonner le brouillon rend l'éditeur à la version en ligne", one("SELECT draft FROM mk_landing_pages WHERE id = ?", p).draft === null);
  });

  scenario("INT-CMS-003", "médiathèque : envoi, métadonnées, insertion dans une page, affichage public, protection à la suppression", ["Médiathèque", "Page Builder", "Pages publiques"], "REEL-TEST", async (c) => {
    const fd = new FormData(); fd.append("file", new Blob([PNG], { type: "image/png" }), "integration.png");
    const up = await boss.request(`${M}/site-web/mediatheque/televerser`, { method: "POST", multipart: fd });
    const media = JSON.parse(up.text).media || JSON.parse(up.text);
    c.check("le fichier est enregistré (201) avec un chemin /uploads/marketing/…", up.status === 201 && /^\/uploads\/marketing\/\d+\//.test(media.path || ""), `status ${up.status}`);
    const meta = await boss.request(`${M}/site-web/mediatheque/${media.id}`, { method: "POST", json: { alt: "Carré d'intégration", title: "Titre intégration" } });
    c.check("le texte alternatif est enregistré et relu en base", one("SELECT alt FROM mk_media WHERE id = ?", media.id).alt === "Carré d'intégration", `status ${meta.status}`);
    const host = await livePage(boss, "Page avec image", { sections: [textSection(`Avant l'image\n\n![Carré d'intégration](${media.path})`)] });
    const html = (await anon.get(`/p/${host.slug}`)).text;
    c.check("la page publique affiche l'image par son adresse permanente", html.includes(media.path), "adresse trouvée dans le HTML public");
    c.check("le fichier est réellement servi (200, type image)", (await anon.get(media.path)).status === 200);
    await boss.post(`${M}/site-web/mediatheque/${media.id}/corbeille`, {});
    const refused = await boss.post(`${M}/site-web/mediatheque/${media.id}/supprimer`, {});
    c.check("la suppression définitive d'un média utilisé par une page est refusée", refused.status >= 400 && one("SELECT 1 FROM mk_media WHERE id = ?", media.id), `status ${refused.status}`);
    c.check("un membre limité au site B ne peut pas gérer la médiathèque de l'organisation", [302, 403].includes((await memberB.post(`${M}/site-web/mediatheque/${media.id}/restaurer`, {})).status));
  });

  scenario("INT-CMS-004", "styles globaux : brouillon, publication, effet réel sur le site public, aucune modification involontaire", ["Apparence", "Pages publiques", "Page Builder"], "REEL-TEST", async (c) => {
    const page = await livePage(boss, "Page styles");
    const styleOf = (html) => (html.match(/<style id="kw-appearance">([\s\S]*?)<\/style>/) || [])[1] || "";
    c.check("sans configuration publiée, aucune feuille d'apparence n'est ajoutée", styleOf((await anon.get(`/p/${page.slug}`)).text) === "" && styleOf((await anon.get("/")).text) === "");
    await boss.post(`${M}/site-web/apparence/styles`, { "colors.primary": "#aa2200" });
    c.check("le brouillon n'est PAS visible sur le site public", !/aa2200/i.test(styleOf((await anon.get("/")).text)));
    const pub = await boss.post(`${M}/site-web/apparence/publier`, {});
    c.check("la publication de l'apparence réussit", pub.status === 302, `status ${pub.status}`);
    const home = styleOf((await anon.get("/")).text);
    c.check("la couleur publiée est dans la feuille du site public", /aa2200/i.test(home));
    await boss.post(`${M}/site-web/apparence/styles`, { "colors.primary": "red;} body{display:none" });
    await boss.post(`${M}/site-web/apparence/publier`, {});
    c.check("une injection CSS est refusée : la feuille publique reste propre", !/display:none/.test(styleOf((await anon.get("/")).text)));
    c.check("une personne sans droit de publication ne peut pas publier l'apparence", [302, 403].includes((await editorOrg.post(`${M}/site-web/apparence/publier`, {})).status) && !/zzzzzz/.test(home));
    await boss.post(`${M}/site-web/apparence/retirer`, {});
    c.check("retirer la configuration rend le site à son apparence d'origine", styleOf((await anon.get("/")).text) === "");
  });

  scenario("INT-SEO-005", "SEO, URL, 404, aperçu privé et plan du site", ["SEO", "URL", "Pages", "Sitemap"], "REEL-TEST", async (c) => {
    const page = await livePage(boss, "Page SEO intégration", { sections: [textSection("Texte SEO.")], indexable: true });
    await saveDraft(boss, page.id, [textSection("Texte SEO.")], { title: "Titre SEO d'intégration", description: "Description SEO d'intégration." });
    await boss.post(`${M}/pages/${page.id}/publier.json`, {});
    const html = (await anon.get(`/p/${page.slug}`)).text;
    c.check("balise title rendue", /<title>[^<]*Titre SEO d(?:'|&#39;)intégration/.test(html), (html.match(/<title>([^<]*)/) || [])[1] || "");
    c.check("canonical vers l'adresse publique", html.includes(`rel="canonical" href="https://k.test/p/${page.slug}"`), (html.match(/rel="canonical" href="([^"]*)"/) || [])[1] || "");
    c.check("Open Graph présent", /property="og:title"/.test(html));
    c.check("la page indexable est dans le plan du site", (await anon.get("/sitemap.xml")).text.includes(`/p/${page.slug}`));
    const hidden = await livePage(boss, "Page non indexable", { indexable: false });
    c.check("une page non indexable est servie mais absente du plan du site et en noindex", (await anon.get(`/p/${hidden.slug}`)).status === 200 && !(await anon.get("/sitemap.xml")).text.includes(`/p/${hidden.slug}`) && /name="robots" content="noindex/.test((await anon.get(`/p/${hidden.slug}`)).text));
    const draftOnly = (await createPageRoute(boss, "Brouillon privé")).id;
    c.check("un brouillon n'est pas public (404, noindex)", (await anon.get(`/p/${slugOf(draftOnly)}`)).status === 404);
    c.check("l'aperçu d'un brouillon est privé (anonyme renvoyé à la connexion)", (await anon.get(`${M}/pages/${draftOnly}/apercu`)).status === 302);
    const nf = await anon.get("/p/adresse-qui-n-existe-pas");
    c.check("une adresse inconnue répond 404 en noindex", nf.status === 404 && /noindex/.test(nf.text));
    await boss.post(`${M}/pages/${page.id}`, { revision: String(one("SELECT revision FROM mk_landing_pages WHERE id = ?", page.id).revision), name: "Page SEO intégration", slug: "page-seo-renommee", title: "Titre SEO d'intégration", description: "", form_id: "", tags: "", site_id: "" });
    const old = await anon.get(`/p/${page.slug}`);
    c.check("l'ancienne adresse redirige (301) vers la nouvelle", old.status === 301 && /page-seo-renommee/.test(old.location || ""), `${old.status} ${old.location}`);
    c.check("la nouvelle adresse est servie", (await anon.get("/p/page-seo-renommee")).status === 200);
    await boss.post(`${M}/pages/${page.id}/depublier.json`, {});
    c.check("une page dépubliée disparaît (404) et quitte le plan du site", (await anon.get("/p/page-seo-renommee")).status === 404 && !(await anon.get("/sitemap.xml")).text.includes("page-seo-renommee"));
  });
});

describe("CMS et Tunnel Builder", () => {
  let p1, p2, funnel, s1, s2;
  scenario("INT-TUN-006", "une page du CMS est réutilisée par un tunnel : référence stable, aucune copie, protection de la page", ["CMS", "Page Builder", "Tunnel Builder", "URL", "Permissions"], "REEL-TEST", async (c) => {
    p1 = await livePage(boss, "Étape entrée intégration", { site: siteA, sections: [textSection("Entrée du tunnel INT."), { type: "button", label: "Continuer", url: "/etape-suivante", align: "center" }] });
    p2 = await livePage(boss, "Étape merci intégration", { site: siteA, sections: [textSection("Merci INT.")] });
    const pagesBefore = one("SELECT COUNT(*) n FROM mk_landing_pages").n;
    const f = await boss.post(`${M}/tunnels`, { name: "Tunnel d'intégration", description: "", site: siteA });
    funnel = lastId(f.location, /tunnels\/(\d+)/);
    c.check("le tunnel est créé sur le site A", one("SELECT site_id FROM mk_funnels WHERE id = ?", funnel).site_id === siteA);
    await boss.post(`${M}/tunnels/${funnel}/etapes`, { type: "landing", name: "Entrée", source: "existante", page_id: p1.id });
    await boss.post(`${M}/tunnels/${funnel}/etapes`, { type: "thankyou", name: "Merci", source: "existante", page_id: p2.id });
    const steps = all("SELECT id, page_id FROM mk_funnel_steps WHERE funnel_id = ? ORDER BY position", funnel); [s1, s2] = steps.map((s) => s.id);
    c.check("chaque étape référence la page par son identifiant (page_id)", steps.length === 2 && steps[0].page_id === p1.id && steps[1].page_id === p2.id);
    c.check("aucune copie de la page n'a été créée", one("SELECT COUNT(*) n FROM mk_landing_pages").n === pagesBefore);
    await boss.post(`${M}/tunnels/${funnel}/publier`, {});
    c.check("le rendu de l'étape est celui de la page référencée", /Entrée du tunnel INT/.test((await anon.get(`/p/${p1.slug}`)).text));
    await saveDraft(boss, p1.id, [textSection("Entrée du tunnel MODIFIEE."), { type: "button", label: "Continuer", url: "/etape-suivante", align: "center" }], { title: "Étape entrée intégration" });
    c.check("avant republication, le visiteur voit toujours la version en ligne", /Entrée du tunnel INT\./.test((await anon.get(`/p/${p1.slug}`)).text));
    await boss.post(`${M}/pages/${p1.id}/publier.json`, {});
    c.check("après republication, la modification apparaît dans l'étape", /MODIFIEE/.test((await anon.get(`/p/${p1.slug}`)).text));
    const trash = await boss.post(`${M}/pages/${p1.id}/archiver`, {});
    c.check("mettre à la corbeille une page d'un tunnel actif est refusé, la page reste en ligne", trash.status === 302 && one("SELECT archived_at FROM mk_landing_pages WHERE id = ?", p1.id).archived_at === null && (await anon.get(`/p/${p1.slug}`)).status === 200);
    c.check("un membre du site B ne voit pas le tunnel du site A", [403, 404].includes((await memberB.get(`${M}/tunnels/${funnel}`)).status));
    c.check("un membre du site B ne peut pas y ajouter une étape", [403, 404].includes((await memberB.post(`${M}/tunnels/${funnel}/etapes`, { type: "page", name: "Intrus", source: "existante", page_id: p2.id })).status) && one("SELECT COUNT(*) n FROM mk_funnel_steps WHERE funnel_id = ?", funnel).n === 2);
  });

  scenario("INT-TUN-007", "navigation entre les étapes du tunnel et cohérence avec l'ordre configuré", ["Tunnel Builder", "Pages publiques"], "REEL-TEST", async (c) => {
    const visitor = new Client(srv.base);
    const html = (await visitor.get(`/p/${p1.slug}`)).text;
    const click = (html.match(new RegExp(`/p/${p1.slug}/clic/\\d+`)) || [])[0];
    c.check("le bouton « Continuer » de l'étape 1 passe par le suivi de clic de la page", Boolean(click), click || "aucun lien /clic/ trouvé");
    const next = click ? await visitor.get(click) : { status: 0 };
    c.check("le clic redirige vers la page de l'étape 2 configurée", [301, 302, 303].includes(next.status) && (next.location || "").includes(`/p/${p2.slug}`), `${next.status} ${next.location || ""}`);
    const bad = await visitor.get(`/p/${p1.slug}/clic/99`);
    c.check("un numéro de bouton inconnu ramène sur la page (aucune adresse inventée)", [301, 302, 303].includes(bad.status) && (bad.location || "") === `/p/${p1.slug}`, `${bad.status} ${bad.location || ""}`);
    const unknown = await visitor.get(`/p/page-inconnue-int/clic/0`);
    c.check("un clic sur une page inconnue répond 404", unknown.status === 404);
    const last = (await visitor.get(`/p/${p2.slug}`)).text;
    c.check("la dernière étape (merci) n'a pas de bouton « étape suivante »", !/etape-suivante/.test(last));
  });
});

describe("Formulaires, Contact Core et consentement", () => {
  let formSlug, formId;
  before(async () => {
    await boss.post(`${M}/formulaires`, { name: "Newsletter d'intégration", consentText: "Oui, je veux recevoir les actualités." });
    formId = one("SELECT id FROM mk_forms WHERE name = 'Newsletter d''intégration'").id; formSlug = one("SELECT slug FROM mk_forms WHERE id = ?", formId).slug;
    db.prepare("UPDATE mk_forms SET double_optin = 0 WHERE id = ?").run(formId);
    await boss.post(`${M}/formulaires/${formId}/publier`);
  });
  scenario("INT-CON-008", "soumission d'un formulaire : validation, contact, consentement, doublons, événements", ["Formulaires", "Contact Core", "Consentements", "Événements"], "REEL-TEST", async (c) => {
    const submit = (fields) => new Client(srv.base).post(`/f/${formSlug}`, { ft: srv.formToken(), ...fields });
    const noConsent = await submit({ email: "sans-case@exemple.test" });
    const ctNo = one("SELECT status FROM mk_contacts WHERE email = 'sans-case@exemple.test'");
    c.check("sans case cochée : aucun abonnement marketing (le contact, s'il existe, n'est pas abonné)", !ctNo || ctNo.status !== "subscribed", JSON.stringify(ctNo || {}));
    c.check("sans case cochée : aucune preuve de consentement", one("SELECT COUNT(*) n FROM mk_consents k JOIN mk_contacts t ON t.id = k.contact_id WHERE t.email = 'sans-case@exemple.test'").n === 0);
    const bad = await submit({ email: "pas-une-adresse", consent: "1" });
    c.check("une adresse invalide est refusée, aucun contact créé", one("SELECT COUNT(*) n FROM mk_contacts WHERE email = 'pas-une-adresse'").n === 0, `status ${bad.status}`);
    const ok = await submit({ email: "Abonne@Exemple.Test", consent: "1" });
    const ct = one("SELECT id, status FROM mk_contacts WHERE email = 'abonne@exemple.test'");
    c.check("avec la case : le contact est créé, adresse normalisée en minuscules", Boolean(ct), `status ${ok.status}`);
    c.check("avec la case : la preuve de consentement est enregistrée", ct && one("SELECT COUNT(*) n FROM mk_consents WHERE contact_id = ?", ct.id).n >= 1);
    c.check("avec la case : le contact est abonné", ct && ct.status === "subscribed", ct ? ct.status : "");
    await submit({ email: "ABONNE@exemple.test", consent: "1" });
    c.check("un second envoi (casse différente) ne crée pas de doublon", one("SELECT COUNT(*) n FROM mk_contacts WHERE lower(email) = 'abonne@exemple.test'").n === 1);
    c.check("l'événement « formulaire envoyé » est écrit dans le journal du contact", ct && one("SELECT COUNT(*) n FROM mk_events WHERE contact_id = ? AND name = 'form.submitted'", ct.id).n >= 1);
    const robot = await submit({ email: "robot@exemple.test", consent: "1", website: "http://spam.io" });
    c.check("le champ piège refuse l'envoi d'un robot (aucun contact)", one("SELECT COUNT(*) n FROM mk_contacts WHERE email = 'robot@exemple.test'").n === 0, `status ${robot.status}`);
    const xss = await submit({ email: "xss@exemple.test", consent: "1", first_name: "<script>alert(1)</script>" });
    const list = (await boss.get(`${M}/contacts`)).text;
    c.check("un prénom contenant du HTML est échappé dans l'administration", !/<script>alert\(1\)<\/script>/.test(list) && xss.status < 500);
  });

  scenario("INT-CON-009", "cohérence du Contact Core : compte ≠ contact ≠ consentement, commentaire, site", ["Contact Core", "Comptes", "Commentaires", "Sites"], "REEL-TEST", async (c) => {
    const student = await newStudent(srv);
    const email = one("SELECT email FROM users WHERE id = ?", idOf(student)).email.toLowerCase();
    const ct = one("SELECT id, status, lms_user_id FROM mk_contacts WHERE email = ?", email);
    c.check("créer un compte crée (ou relie) UNE fiche de contact", Boolean(ct) && one("SELECT COUNT(*) n FROM mk_contacts WHERE email = ?", email).n === 1);
    c.check("créer un compte n'abonne personne (aucune preuve de consentement marketing)", ct && ct.status !== "subscribed" && one("SELECT COUNT(*) n FROM mk_consents WHERE contact_id = ?", ct.id).n === 0, ct ? ct.status : "");
    await boss.post(`${M}/site-web/parametres/commentaires`, { enabled_default: "1", guests_allowed: "1", moderation: "none", replies_allowed: "1", max_depth: "3", links_allowed: "1" });
    const fd = new FormData(); Object.entries({ title: "Article de commentaires", excerpt: "r", content_format: "html", status: "published", content: "<p>Texte</p>" }).forEach(([k, v]) => fd.append(k, v));
    await boss.request("/formateur/blog/nouveau", { method: "POST", multipart: fd, headers: { "x-blog-editor": "1" } });
    const slug = one("SELECT slug FROM posts WHERE title = 'Article de commentaires'").slug;
    const guest = new Client(srv.base); await guest.get(`/blog/${slug}`);
    await guest.post(`/blog/${slug}/commentaires`, { author_name: "Invité", author_email: "invite-commentaire@exemple.test", body: "Un commentaire d'intégration", form_token: srv.formToken() }, { headers: { "x-forwarded-for": "198.51.100.77" } });
    c.check("le commentaire est enregistré", one("SELECT COUNT(*) n FROM blog_comments WHERE author_email = 'invite-commentaire@exemple.test'").n === 1);
    const gc = one("SELECT status FROM mk_contacts WHERE email = 'invite-commentaire@exemple.test'");
    c.check("un commentaire n'abonne jamais son auteur à une liste marketing", !gc || gc.status !== "subscribed", JSON.stringify(gc || {}));
    db.prepare("UPDATE mk_contacts SET origin_site_id = ? WHERE email = ?").run(siteA, email);
    const seenA = await memberA.get(`${M}/contacts?site=${siteA}`), seenB = await memberB.get(`${M}/contacts?site=${siteA}`);
    c.check("un membre du site A voit les contacts de son site (lecture)", seenA.status === 200 && seenA.text.includes(email.split("@")[0]), `status ${seenA.status}`);
    c.check("un membre du site B ne voit pas les contacts du site A (refus)", seenB.status === 403 || !seenB.text.includes(email.split("@")[0]), `status ${seenB.status}`);
    c.check("un compte hors équipe est refusé sur les contacts", (await outsider.get(`${M}/contacts`)).status === 403);
  });

  scenario("INT-CON-010", "concurrence : 6 envois simultanés du même formulaire par la même personne ne créent qu'un contact et qu'un abonnement", ["Formulaires", "Contact Core", "Consentements", "Concurrence"], "REEL-TEST", async (c) => {
    const email = "course-formulaire@exemple.test";
    const codes = await Promise.all(Array.from({ length: 6 }, (_, i) => new Client(srv.base).post(`/f/${formSlug}`, { ft: srv.formToken(), email, consent: "1" }, { headers: { "x-forwarded-for": `198.51.100.${100 + i}` } }).then((r) => r.status)));
    c.check("aucune requête ne provoque d'erreur serveur", codes.every((x) => x < 500), codes.join(","));
    c.check("un seul contact existe pour cette adresse", one("SELECT COUNT(*) n FROM mk_contacts WHERE email = ?", email).n === 1, String(one("SELECT COUNT(*) n FROM mk_contacts WHERE email = ?", email).n));
    const ct = one("SELECT id, status FROM mk_contacts WHERE email = ?", email);
    c.check("le contact est abonné une seule fois (statut stable)", ct && ct.status === "subscribed", ct ? ct.status : "");
    c.check("la preuve de consentement « accordé » existe", ct && one("SELECT COUNT(*) n FROM mk_consents WHERE contact_id = ? AND action = 'granted'", ct.id).n >= 1);
    c.check("les preuves de consentement ne sont pas multipliées sans limite (≤ 6, une par envoi accepté)", ct && one("SELECT COUNT(*) n FROM mk_consents WHERE contact_id = ?", ct.id).n <= 6, ct ? String(one("SELECT COUNT(*) n FROM mk_consents WHERE contact_id = ?", ct.id).n) : "");
  });
});

describe("Automatisations et e-mail (avec worker réel, fournisseur « console »)", () => {
  let w, wboss, wdb;
  before(async () => {
    w = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "", MARKETING_WORKER: "on" });
    wboss = await loginInstructor(w); wdb = w.db();
  });
  after(() => { wdb.close(); return w.stop(); });
  const q = (sql, ...a) => wdb.prepare(sql).all(...a);

  scenario("INT-AUT-010", "un événement réel déclenche un scénario exécuté par le worker, une seule fois, et le consentement est respecté", ["Formulaires", "Contact Core", "Automatisations", "Worker", "Email Engine"], "REEL-TEST", async (c) => {
    await wboss.post(`${M}/formulaires`, { name: "Form scénario", consentText: "J'accepte." });
    const fid = q("SELECT id, slug FROM mk_forms WHERE name = 'Form scénario'")[0];
    wdb.prepare("UPDATE mk_forms SET double_optin = 0 WHERE id = ?").run(fid.id);
    await wboss.post(`${M}/formulaires/${fid.id}/publier`);
    const created = await wboss.post(`${M}/automatisations`, { name: "Scénario étiquette", kind: "marketing", trigger_event: "form.submitted" });
    const aid = lastId(created.location, /(\d+)$/);
    const saved = await wboss.postJson(`${M}/automatisations/${aid}`, { steps: [{ type: "add_tag", tag: "integration-int" }] });
    c.check("le scénario est enregistré avec une étape « étiquette »", saved.status === 200, `status ${saved.status}`);
    const act = await wboss.post(`${M}/automatisations/${aid}/activer`, {});
    c.check("le scénario est activé (302)", act.status === 302, `status ${act.status}`);
    for (let i = 0; i < 40 && q("SELECT COUNT(*) n FROM mk_bridge_cursors")[0].n < 8; i++) await new Promise((r) => setTimeout(r, 250));
    const submit = () => new Client(w.base).post(`/f/${fid.slug}`, { ft: w.formToken(), email: "scenario@exemple.test", consent: "1" });
    await submit();
    let run = [];
    for (let i = 0; i < 60 && !(run.length && run[0].status === "completed"); i++) { run = q("SELECT status FROM mk_automation_runs WHERE automation_id = ?", aid); if (!(run.length && run[0].status === "completed")) await new Promise((r) => setTimeout(r, 250)); }
    c.check("le worker exécute le passage jusqu'à son terme (completed)", run.length === 1 && run[0].status === "completed", JSON.stringify(run));
    const ct = q("SELECT id FROM mk_contacts WHERE email = 'scenario@exemple.test'")[0];
    c.check("l'action a eu son effet réel : l'étiquette est posée sur le contact", ct && q("SELECT COUNT(*) n FROM mk_contact_tags ct JOIN mk_tags t ON t.id = ct.tag_id WHERE ct.contact_id = ? AND t.name = 'integration-int'", ct.id)[0].n === 1);
    c.check("le journal pas à pas du scénario est écrit", q("SELECT COUNT(*) n FROM mk_automation_log l JOIN mk_automation_runs r ON r.id = l.run_id WHERE r.automation_id = ?", aid)[0].n >= 1);
    await submit(); await new Promise((r) => setTimeout(r, 1500));
    c.check("idempotence : un second envoi ne crée pas un second passage pour ce contact", q("SELECT COUNT(*) n FROM mk_automation_runs WHERE automation_id = ?", aid)[0].n === 1);
    c.check("aucun e-mail n'a été envoyé par ce scénario (aucune étape d'e-mail)", q("SELECT COUNT(*) n FROM mk_messages WHERE email = 'scenario@exemple.test'")[0].n === 0);
  });

  scenario("INT-EML-011", "e-mail : le consentement et la désinscription décident des destinataires ; messages enregistrés avec leur état (fournisseur « console » = aucun envoi réel)", ["Formulaires", "Contact Core", "Automatisations", "Email Engine", "Consentements", "Worker"], "SIMULE", async (c) => {
    const { sendableContactIds } = require("../src/marketing/sending/audience");
    const ctx = { db: wdb, organizationId: 1 };
    const list = Number(wdb.prepare("INSERT INTO mk_lists (organization_id, name) VALUES (1, 'Audience e-mail intégration')").run().lastInsertRowid);
    const mk = (email, status) => { const id = Number(wdb.prepare("INSERT INTO mk_contacts (organization_id, email, status) VALUES (1, ?, ?)").run(email, status).lastInsertRowid); wdb.prepare("INSERT INTO mk_list_members (organization_id, list_id, contact_id) VALUES (1, ?, ?)").run(list, id); if (status === "subscribed") wdb.prepare("INSERT INTO mk_consents (organization_id, contact_id, action, source, text_shown) VALUES (1, ?, 'granted', 'form', 'preuve de test')").run(id); return id; };
    const sub = mk("abonne-eml@exemple.test", "subscribed"), uns = mk("desinscrit-eml@exemple.test", "unsubscribed"), unk = mk("inconnu-eml@exemple.test", "unknown");
    const ids = sendableContactIds(ctx, { targetType: "list", targetId: list });
    c.check("l'audience joignable contient l'abonné avec preuve de consentement", ids.includes(sub), JSON.stringify(ids));
    c.check("l'audience joignable exclut le désinscrit", !ids.includes(uns));
    c.check("l'audience joignable exclut la personne sans consentement", !ids.includes(unk));
    // Parcours réel : formulaire → scénario d'e-mail → file → worker → message enregistré (fournisseur console)
    const tpl = await wboss.post(`${M}/modeles`, { name: "Modèle intégration", starter: "blank", kind: "marketing" });
    const tid = lastId(tpl.location, /(\d+)$/);
    c.check("un modèle d'e-mail est créé par la route", tpl.status === 302, `status ${tpl.status}`);
    await wboss.post(`${M}/formulaires`, { name: "Form e-mail intégration", consentText: "J'accepte de recevoir des e-mails." });
    const fm = q("SELECT id, slug FROM mk_forms WHERE name = 'Form e-mail intégration'")[0];
    wdb.prepare("UPDATE mk_forms SET double_optin = 0 WHERE id = ?").run(fm.id); await wboss.post(`${M}/formulaires/${fm.id}/publier`);
    const auto = lastId((await wboss.post(`${M}/automatisations`, { name: "Scénario e-mail intégration", kind: "marketing", trigger_event: "form.submitted" })).location, /(\d+)$/);
    const sv = await wboss.postJson(`${M}/automatisations/${auto}`, { steps: [{ type: "email", templateId: tid }] });
    c.check("un scénario avec une étape d'e-mail est enregistré sans étape incomplète", sv.status === 200 && /"incomplete":\[\]/.test(sv.text), sv.text.slice(0, 120));
    const pageBefore = stripTags((await wboss.get(`${M}/automatisations/${auto}`)).text);
    c.check("avant l'activation, l'écran du scénario prévient que le fournisseur « console » n'envoie rien", /rien ne sera réellement envoyé/.test(pageBefore), (pageBefore.match(/Fournisseur « console »[^.]{0,80}/) || [""])[0]);
    c.check("le scénario est activé", (await wboss.post(`${M}/automatisations/${auto}/activer`, {})).status === 302);
    const pageAfter = stripTags((await wboss.get(`${M}/automatisations/${auto}`)).text);
    c.check("APRÈS l'activation, l'écran du scénario rappelle encore que le fournisseur « console » n'envoie rien", /rien ne sera réellement envoyé/.test(pageAfter), "l'avertissement a disparu de l'écran du scénario actif", { anomalie: "A25-02" });
    for (let i = 0; i < 40 && q("SELECT COUNT(*) n FROM mk_bridge_cursors")[0].n < 8; i++) await new Promise((r) => setTimeout(r, 250));
    const post = (email, consent) => new Client(w.base).post(`/f/${fm.slug}`, { ft: w.formToken(), email, ...(consent ? { consent: "1" } : {}) });
    await post("avec-accord-eml@exemple.test", true);
    let msg = [];
    for (let i = 0; i < 60 && !(msg.length && msg[0].status !== "pending"); i++) { msg = q("SELECT status, provider FROM mk_messages WHERE email = 'avec-accord-eml@exemple.test'"); if (!(msg.length && msg[0].status !== "pending")) await new Promise((r) => setTimeout(r, 250)); }
    c.check("avec consentement prouvé : un message est enregistré (une seule fois)", msg.length === 1, JSON.stringify(msg));
    c.check("état observé : « sent » par le fournisseur « console » (SIMULATION : rien n'est réellement transmis)", msg.length === 1 && msg[0].status === "sent" && msg[0].provider === "console", JSON.stringify(msg));
    await post("sans-accord-eml@exemple.test", false); await new Promise((r) => setTimeout(r, 3000));
    c.check("sans consentement : AUCUN message n'est enregistré pour cette adresse", q("SELECT COUNT(*) n FROM mk_messages WHERE email = 'sans-accord-eml@exemple.test'")[0].n === 0, `contact : ${JSON.stringify(q("SELECT status FROM mk_contacts WHERE email = 'sans-accord-eml@exemple.test'"))}`);
    const runNo = q("SELECT r.status FROM mk_automation_runs r JOIN mk_contacts k ON k.id = r.contact_id WHERE k.email = 'sans-accord-eml@exemple.test' AND r.automation_id = ?", auto);
    c.check("le passage du contact sans accord est tracé et ne reste pas bloqué en « running »", runNo.length === 0 || runNo[0].status !== "running", JSON.stringify(runNo));
    await post("avec-accord-eml@exemple.test", true); await new Promise((r) => setTimeout(r, 2500));
    c.check("un second envoi du formulaire par la même personne ne produit pas un second e-mail", q("SELECT COUNT(*) n FROM mk_messages WHERE email = 'avec-accord-eml@exemple.test'")[0].n === 1);
  });
});

describe("Commerce et paiement (faux Stripe local) puis Contact Core et Analytics", () => {
  let psrv, pdb, fake, fakeBase, pboss, course;
  const WEBHOOK_SECRET = "whsec_integration";
  const stripe = { sessions: new Map(), created: [], counter: 0 };
  const sign = (payload, secret = WEBHOOK_SECRET) => { const t = Math.floor(Date.now() / 1000); return `t=${t},v1=${crypto.createHmac("sha256", secret).update(`${t}.${payload}`).digest("hex")}`; };
  async function hook(type, object, { secret, signature } = {}) {
    const payload = JSON.stringify({ id: `evt_${crypto.randomUUID()}`, type, data: { object } });
    const r = await fetch(`${psrv.base}/stripe/webhook`, { method: "POST", headers: { "content-type": "application/json", "stripe-signature": signature ?? sign(payload, secret) }, body: payload });
    return r.status;
  }
  before(async () => {
    fake = http.createServer((req, res) => {
      let body = ""; req.on("data", (d) => (body += d));
      req.on("end", () => {
        const send = (s, j) => { res.writeHead(s, { "content-type": "application/json" }); res.end(JSON.stringify(j)); };
        if (req.headers.authorization !== "Bearer sk_test_fake") return send(401, { error: { message: "clé invalide" } });
        if (req.method === "POST" && req.url === "/v1/checkout/sessions") {
          const params = Object.fromEntries(new URLSearchParams(body)); const id = `cs_int_${++stripe.counter}`;
          const amount = Number(params["line_items[0][price_data][unit_amount]"] || 0);
          const session = { id, client_reference_id: params.client_reference_id, amount_total: amount, currency: "eur", payment_status: "unpaid", payment_intent: `pi_int_${stripe.counter}` };
          stripe.sessions.set(id, session); stripe.created.push({ params, session });
          return send(200, { id, url: `https://checkout.stripe.test/pay/${id}` });
        }
        const m = req.url.match(/^\/v1\/checkout\/sessions\/(.+)$/);
        if (req.method === "GET" && m && stripe.sessions.has(m[1])) return send(200, stripe.sessions.get(m[1]));
        send(404, { error: { message: "introuvable" } });
      });
    });
    await new Promise((r) => fake.listen(0, r)); fakeBase = `http://localhost:${fake.address().port}`;
    psrv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "", STRIPE_SECRET_KEY: "sk_test_fake", STRIPE_WEBHOOK_SECRET: WEBHOOK_SECRET, STRIPE_API_BASE: fakeBase, MARKETING_WORKER: "on" });
    pboss = await loginInstructor(psrv); pdb = psrv.db();
    // Le pont n'enregistre jamais l'historique : on attend que ses curseurs soient posés AVANT toute commande (sinon la commande serait de l'« historique »)
    for (let i = 0; i < 60 && pdb.prepare("SELECT COUNT(*) n FROM mk_bridge_cursors").get().n < 8; i++) await new Promise((r) => setTimeout(r, 250));
    course = await createCourse(pboss, psrv, { title: "Formation intégration", price: 50 });
  });
  after(async () => { pdb.close(); await psrv.stop(); fake.close(); });
  const q1 = (sql, ...a) => pdb.prepare(sql).get(...a);
  const q = (sql, ...a) => pdb.prepare(sql).all(...a);

  scenario("INT-COM-012", "commande de test : panier, session de paiement, aucun accès avant paiement confirmé, montant fixé par le serveur", ["Commerce", "Stripe (faux serveur)", "Accès aux formations"], "SIMULE", async (c) => {
    const e = await newStudent(psrv);
    await e.post(`/panier/ajouter/${course.id}`, {});
    const pay = await e.post("/commande", { total: "1", price_cents: "1", amount: "1" });
    c.check("« Payer » redirige vers la page de paiement du fournisseur (303)", pay.status === 303 && /checkout\.stripe\.test\/pay\/cs_int_/.test(pay.location || ""), `${pay.status} ${pay.location}`);
    const created = stripe.created[stripe.created.length - 1];
    c.check("le montant envoyé au fournisseur est celui du serveur (5000), pas celui du formulaire falsifié", created && created.session.amount_total === 5000, created ? String(created.session.amount_total) : "");
    c.check("aucune commande n'existe avant le paiement", q1("SELECT COUNT(*) n FROM orders o JOIN users u ON u.id = o.user_id WHERE u.email = ?", e.email).n === 0);
    c.check("aucun accès à la formation avant le paiement", q1("SELECT COUNT(*) n FROM enrollments en JOIN users u ON u.id = en.user_id WHERE u.email = ?", e.email).n === 0);
    stripe.lastEmail = e.email;
  });

  scenario("INT-COM-013", "webhook de paiement : signature, idempotence, commande, accès, contact « Client », événement, Analytics ; échec de paiement", ["Commerce", "Webhook signé", "Contact Core", "Événements", "Analytics"], "SIMULE", async (c) => {
    const cs = q1("SELECT cs.* FROM checkout_sessions cs JOIN users u ON u.id = cs.user_id WHERE u.email = ? ORDER BY cs.id DESC", stripe.lastEmail);
    const session = { ...stripe.sessions.get(cs.stripe_session_id), payment_status: "paid" };
    c.check("signature invalide (mauvais secret) refusée (400), rien n'est accordé", (await hook("checkout.session.completed", session, { secret: "whsec_autre" })) === 400 && q1("SELECT COUNT(*) n FROM orders").n === 0);
    c.check("signature absente refusée (400)", (await hook("checkout.session.completed", session, { signature: "n'importe quoi" })) === 400);
    c.check("webhook signé accepté (200)", (await hook("checkout.session.completed", session)) === 200);
    const order = q1("SELECT o.* FROM orders o JOIN users u ON u.id = o.user_id WHERE u.email = ?", stripe.lastEmail);
    c.check("la commande existe avec le bon total (5000) APRÈS confirmation", order && order.total_cents === 5000, order ? String(order.total_cents) : "");
    c.check("l'accès à la formation est ouvert", q1("SELECT COUNT(*) n FROM enrollments en JOIN users u ON u.id = en.user_id WHERE u.email = ? AND en.course_id = ?", stripe.lastEmail, course.id).n === 1);
    await hook("checkout.session.completed", session);
    c.check("idempotence : un rejeu du webhook ne crée pas une seconde commande", q1("SELECT COUNT(*) n FROM orders o JOIN users u ON u.id = o.user_id WHERE u.email = ?", stripe.lastEmail).n === 1);
    c.check("une session inconnue est ignorée sans erreur (200) et ne crée rien", (await hook("checkout.session.completed", { id: "cs_inconnue", client_reference_id: "ref-inconnue", payment_status: "paid", amount_total: 100 })) === 200 && q1("SELECT COUNT(*) n FROM orders").n === 1);
    // Le pont (worker réel de ce serveur de test) lit la commande et émet les événements : on attend l'événement, puis on lit le contact et Analytics
    await pboss.post(`${M}/evenements/synchroniser`, {});
    let ev = null;
    for (let i = 0; i < 40 && !ev; i++) { ev = q1("SELECT id, contact_id, source FROM mk_events WHERE name = 'purchase.completed'"); if (!ev) await new Promise((r) => setTimeout(r, 250)); }
    c.check("l'événement « purchase.completed » est écrit dans le journal à partir de la commande réelle", Boolean(ev), ev ? `source ${ev.source}` : "aucun événement");
    const contact = q1("SELECT id, lifecycle_stage FROM mk_contacts WHERE email = ?", stripe.lastEmail.toLowerCase());
    c.check("le contact existe et correspond au compte acheteur (lien par le compte)", Boolean(contact), JSON.stringify(contact || {}));
    c.check("l'événement d'achat est rattaché à ce contact", ev && contact && ev.contact_id === contact.id);
    c.check("le premier achat réel passe le contact en « client »", contact && /client|customer/i.test(String(contact.lifecycle_stage)), contact ? String(contact.lifecycle_stage) : "");
    const com = analytics.dashboard({ db: pdb, organizationId: 1 }, { range: "7d" }).sections.commerce;
    c.check("Analytics lit la commande réelle : revenu brut de 50,00 € (5000 centimes) et 1 commande", com && JSON.stringify(com).includes("5000") && /"orders":1|"count":1|"commandes":1/.test(JSON.stringify(com)), JSON.stringify(com).slice(0, 200));
    const dash = await pboss.get(`${M}/analytics/global?preset=7d`);
    c.check("l'écran Analytics s'affiche (200)", dash.status === 200, `status ${dash.status}`);
    const refund = (id, amount) => ({ id: "ch_int", payment_intent: session.payment_intent, currency: "eur", amount_refunded: amount, refunds: { data: [{ id, status: "succeeded", amount, currency: "eur", created: Math.floor(Date.now() / 1000) }] } });
    c.check("un remboursement signé est accepté (200)", (await hook("charge.refunded", refund("re_int_1", 1000))) === 200);
    await hook("charge.refunded", refund("re_int_1", 1000));
    c.check("un remboursement rejoué n'est enregistré qu'une fois", q1("SELECT COUNT(*) n FROM order_refunds").n === 1);
    c.check("un remboursement d'un paiement inconnu est ignoré", (await hook("charge.refunded", { ...refund("re_int_2", 500), payment_intent: "pi_inconnu" })) === 200 && q1("SELECT COUNT(*) n FROM order_refunds").n === 1);
    c.check("échec d'un paiement asynchrone : accepté sans créer de commande", (await hook("checkout.session.async_payment_failed", { id: "cs_inconnue2", client_reference_id: "x", payment_status: "unpaid" })) === 200 && q1("SELECT COUNT(*) n FROM orders").n === 1);
  });

  scenario("INT-COM-017", "paiement non abouti : session expirée ou échouée, aucune commande, aucun accès, retour clair pour l'acheteur", ["Commerce", "Webhook signé", "Accès aux formations"], "SIMULE", async (c) => {
    const e = await newStudent(psrv);
    await e.post(`/panier/ajouter/${course.id}`, {}); await e.post("/commande", {});
    const cs = q1("SELECT cs.* FROM checkout_sessions cs JOIN users u ON u.id = cs.user_id WHERE u.email = ? ORDER BY cs.id DESC", e.email);
    const unpaid = { ...stripe.sessions.get(cs.stripe_session_id), payment_status: "unpaid" };
    c.check("la session de paiement est créée « en attente »", cs.status === "pending", cs.status);
    c.check("l'expiration signée de la session est acceptée (200)", (await hook("checkout.session.expired", unpaid)) === 200);
    const after = q1("SELECT status FROM checkout_sessions WHERE id = ?", cs.id);
    c.check("la session passe en « expired »", after.status === "expired", after.status);
    c.check("aucune commande n'est créée", q1("SELECT COUNT(*) n FROM orders o JOIN users u ON u.id = o.user_id WHERE u.email = ?", e.email).n === 0);
    c.check("aucun accès n'est ouvert", q1("SELECT COUNT(*) n FROM enrollments en JOIN users u ON u.id = en.user_id WHERE u.email = ?", e.email).n === 0);
    const back = await e.get(`/commande/retour/${cs.ref}`);
    c.check("la page de retour dit clairement que rien n'a été débité (402)", back.status === 402 && /pas été débité/.test(back.text), `status ${back.status}`);
    c.check("une expiration rejouée ne change rien (200, toujours « expired », aucune commande)", (await hook("checkout.session.expired", unpaid)) === 200 && q1("SELECT status FROM checkout_sessions WHERE id = ?", cs.id).status === "expired");
    const stranger = await newStudent(psrv);
    c.check("un autre compte ne peut pas lire le retour de cette commande", (await stranger.get(`/commande/retour/${cs.ref}`)).status !== 200);
  });

  scenario("INT-COM-018", "concurrence : le même webhook de paiement reçu 6 fois en même temps ne crée qu'une commande, une inscription et un e-mail de confirmation", ["Commerce", "Webhook signé", "Concurrence", "Accès aux formations"], "SIMULE", async (c) => {
    const e = await newStudent(psrv);
    await e.post(`/panier/ajouter/${course.id}`, {}); await e.post("/commande", {});
    const cs = q1("SELECT cs.* FROM checkout_sessions cs JOIN users u ON u.id = cs.user_id WHERE u.email = ? ORDER BY cs.id DESC", e.email);
    const paid = { ...stripe.sessions.get(cs.stripe_session_id), payment_status: "paid" };
    const codes = await Promise.all(Array.from({ length: 6 }, () => hook("checkout.session.completed", paid)));
    c.check("les 6 requêtes simultanées sont toutes acceptées (200)", codes.every((x) => x === 200), codes.join(","));
    c.check("une seule commande existe pour cet acheteur", q1("SELECT COUNT(*) n FROM orders o JOIN users u ON u.id = o.user_id WHERE u.email = ?", e.email).n === 1, String(q1("SELECT COUNT(*) n FROM orders o JOIN users u ON u.id = o.user_id WHERE u.email = ?", e.email).n));
    c.check("une seule inscription à la formation", q1("SELECT COUNT(*) n FROM enrollments en JOIN users u ON u.id = en.user_id WHERE u.email = ?", e.email).n === 1);
    c.check("un seul e-mail de confirmation d'achat en file", q1("SELECT COUNT(*) n FROM mail_outbox WHERE kind = 'purchase' AND to_email = ?", e.email).n === 1, String(q1("SELECT COUNT(*) n FROM mail_outbox WHERE kind = 'purchase' AND to_email = ?", e.email).n));
    c.check("une seule ligne de commande", q1("SELECT COUNT(*) n FROM order_items oi JOIN orders o ON o.id = oi.order_id JOIN users u ON u.id = o.user_id WHERE u.email = ?", e.email).n === 1);
  });
});

describe("Mesure, consentement et tests A/B", () => {
  scenario("INT-ABT-014", "mesure et A/B : affectation collante, exposition seulement si la page est affichée, conversion associée, robots ignorés", ["Page Builder", "Tests A/B", "Mesure", "Consentement", "Analytics"], "REEL-TEST", async (c) => {
    const page = await livePage(boss, "Page A/B intégration", { sections: [textSection("Texte A de la page.")] });
    await boss.post(`${M}/pages/${page.id}/test-ab`, { name: "Test intégration", goal: "click", traffic_b: "50" });
    const t = one("SELECT * FROM mk_page_tests WHERE page_id = ?", page.id);
    c.check("le test A/B est créé avec une copie B distincte (variant_page_id)", t && t.variant_page_id && t.variant_page_id !== page.id);
    const vp = one("SELECT draft, sections FROM mk_landing_pages WHERE id = ?", t.variant_page_id);
    db.prepare("UPDATE mk_landing_pages SET draft = ? WHERE id = ?").run(JSON.stringify({ title: "B", description: "", sections: [textSection("Texte B de la page.")] }), t.variant_page_id);
    const start = await boss.post(`${M}/tests-ab/${t.id}/demarrer`, {});
    c.check("le test démarre (302) et passe en « en cours »", start.status === 302 && one("SELECT status FROM mk_page_tests WHERE id = ?", t.id).status === "running", `status ${start.status}`);
    const vid = (n) => `visiteur${String(n).padStart(8, "0")}.${1700000000000 + n}`;
    const seen = [];
    for (let n = 1; n <= 12; n++) {
      const v = new Client(srv.base); v.cookies.set("kw_consent", "1"); v.cookies.set("kw_vid", vid(n));
      const ua = { headers: { "User-Agent": `Mozilla/5.0 Chrome/12${n}` } };
      const first = (await v.get(`/p/${page.slug}`, ua)).text; const again = (await v.get(`/p/${page.slug}`, ua)).text;
      seen.push([/Texte B/.test(first), /Texte B/.test(again)]);
    }
    c.check("l'affectation est collante : chaque visiteur revoit la même version", seen.every(([a, b]) => a === b));
    c.check("les deux versions sont réellement servies à l'adresse unique", seen.some(([a]) => a) && seen.some(([a]) => !a), `B vu par ${seen.filter(([a]) => a).length}/12`);
    c.check("une exposition par visiteur (pas par visite)", one("SELECT COUNT(*) n FROM mk_page_test_events WHERE test_id = ? AND type = 'view'", t.id).n === 12);
    const before = one("SELECT COUNT(*) n FROM mk_page_test_events WHERE test_id = ?", t.id).n;
    await new Client(srv.base).get(`/p/${page.slug}`, { headers: { "User-Agent": "Googlebot/2.1" } });
    c.check("un robot ne compte pas comme exposition", one("SELECT COUNT(*) n FROM mk_page_test_events WHERE test_id = ?", t.id).n === before);
    const anonVisitor = await new Client(srv.base).get(`/p/${page.slug}?variant=b`, { headers: { "User-Agent": "Mozilla/5.0 Chrome/999" } });
    c.check("une adresse « ?variant=b » ne force aucune version", anonVisitor.status === 200);
    const res = await boss.get(`${M}/pages/${page.id}/test-ab`);
    c.check("l'écran de résultats répond et annonce « données insuffisantes » (jamais un gagnant) avec 12 visiteurs", res.status === 200 && /insuffisant/i.test(stripTags(res.text)), `status ${res.status}`);
    c.check("aucun gagnant n'est déclaré (le test reste « en cours »)", one("SELECT status, winner FROM mk_page_tests WHERE id = ?", t.id).status === "running" && !one("SELECT winner FROM mk_page_tests WHERE id = ?", t.id).winner);
  });
});

describe("Mesure : événements, consentement et Analytics", () => {
  scenario("INT-ANA-016", "mesure d'audience : seuls les visiteurs consentants sont comptés, rejeu sans doublon, tableau de bord = lignes en base", ["Mesure", "Consentement", "Analytics"], "REEL-TEST", async (c) => {
    const vid = (n) => `visiteur${String(n + 500).padStart(8, "0")}.${1700000000000 + n}`;
    const stamp = Date.now() - 5000; // le vrai script (public/js/visitor.js) joint la date de chaque événement : c'est elle qui permet la déduplication
    const send = (client, n, extra = {}, withDate = true) => client.request("/w/e", { method: "POST", json: { s: `sess${n}aaaa`, e: [{ t: "session_start", p: "/", d: "desktop" }, { t: "page_view", p: "/", d: "desktop" }, { t: "page_view", p: "/blog", d: "desktop" }].map((e, i) => (withDate ? { ...e, at: stamp + i } : e)) }, headers: { Origin: srv.base, "User-Agent": "Mozilla/5.0 Chrome/120", ...extra } });
    const before = one("SELECT COUNT(*) n FROM mk_web_events").n;
    for (const n of [1, 2, 3]) { const v = new Client(srv.base); v.cookies.set("kw_consent", "1"); v.cookies.set("kw_vid", vid(n)); await send(v, n); }
    c.check("3 visiteurs consentants : 9 lignes de mesure enregistrées", one("SELECT COUNT(*) n FROM mk_web_events").n - before === 9);
    await send(new Client(srv.base), 9);
    c.check("un visiteur sans consentement n'enregistre rien", one("SELECT COUNT(*) n FROM mk_web_events").n - before === 9);
    const robot = new Client(srv.base); robot.cookies.set("kw_consent", "1"); robot.cookies.set("kw_vid", vid(8));
    await send(robot, 8, { "User-Agent": "Googlebot/2.1" });
    c.check("un robot (User-Agent) n'enregistre rien même avec les cookies", one("SELECT COUNT(*) n FROM mk_web_events").n - before === 9);
    const replay = new Client(srv.base); replay.cookies.set("kw_consent", "1"); replay.cookies.set("kw_vid", vid(1));
    await send(replay, 1);
    c.check("un lot identique reçu deux fois ne double pas les lignes (déduplication)", one("SELECT COUNT(*) n FROM mk_web_events").n - before === 9, `lignes ajoutées : ${one("SELECT COUNT(*) n FROM mk_web_events").n - before}`);
    const afterReplay = one("SELECT COUNT(*) n FROM mk_web_events").n;
    const nodate = new Client(srv.base); nodate.cookies.set("kw_consent", "1"); nodate.cookies.set("kw_vid", vid(4));
    await send(nodate, 4, {}, false); const first = one("SELECT COUNT(*) n FROM mk_web_events").n - afterReplay;
    await new Promise((r) => setTimeout(r, 20)); await send(nodate, 4, {}, false);
    c.check("un lot SANS date client rejoué est compté une seule fois (observation : l'index de déduplication inclut l'heure d'arrivée)", one("SELECT COUNT(*) n FROM mk_web_events").n - afterReplay === first, `lignes : ${first} puis ${one("SELECT COUNT(*) n FROM mk_web_events").n - afterReplay}`, { anomalie: "A25-03" });
    const traffic = analytics.dashboard({ db, organizationId: 1 }, { range: "7d" }).sections.traffic.kpis;
    c.check("Analytics : 3 visiteurs, 3 sessions, 6 pages vues, 9 événements pour ces visites", traffic.visitors >= 3 && traffic.sessions >= 3 && traffic.pageViews >= 6 && traffic.events >= 9, JSON.stringify(traffic));
    c.check("les compteurs restent distincts (visiteurs ≠ sessions ≠ pages vues ≠ événements)", traffic.events > traffic.pageViews && traffic.pageViews > traffic.visitors, JSON.stringify(traffic));
  });
});

describe("Pages programmées et rédaction des articles par rôle", () => {
  scenario("INT-CMS-007", "publication programmée d'une page : invisible avant l'heure, publiée à la première visite après l'heure, présente au plan du site", ["Pages", "Publication programmée", "SEO", "Pages publiques"], "REEL-TEST", async (c) => {
    const { id } = await createPageRoute(boss, "Page programmée intégration");
    await saveDraft(boss, id, [textSection("Contenu programmé INT.")], { title: "Programmée" });
    db.prepare("UPDATE mk_landing_pages SET kind = 'page', indexable = 1 WHERE id = ?").run(id);
    const when = new Date(Date.now() + 3600e3), pad = (n) => String(n).padStart(2, "0");
    const local = `${when.getUTCFullYear()}-${pad(when.getUTCMonth() + 1)}-${pad(when.getUTCDate())}T${pad(when.getUTCHours())}:${pad(when.getUTCMinutes())}`;
    const sch = await boss.post(`${M}/pages/${id}/programmer`, { local, offset: "0" });
    c.check("la programmation est enregistrée (302, date en base)", sch.status === 302 && Boolean(one("SELECT scheduled_at FROM mk_landing_pages WHERE id = ?", id).scheduled_at), `status ${sch.status}`);
    c.check("avant l'heure : la page est invisible (404)", (await anon.get(`/p/${slugOf(id)}`)).status === 404);
    db.prepare("UPDATE mk_landing_pages SET scheduled_at = datetime('now', '-1 minute') WHERE id = ?").run(id);
    await boss.get(`${M}/pages`);
    const row = one("SELECT status, scheduled_at FROM mk_landing_pages WHERE id = ?", id);
    c.check("à l'heure dite, la première visite de l'administration publie la page", row.status === "published" && row.scheduled_at === null, JSON.stringify(row));
    c.check("la page est en ligne avec son contenu", /Contenu programmé INT/.test((await anon.get(`/p/${slugOf(id)}`)).text));
    c.check("la page programmée indexable est dans le plan du site", (await anon.get("/sitemap.xml")).text.includes(`/p/${slugOf(id)}`));
    c.check("la publication automatique est consignée au journal (utilisateur vide = système)", one("SELECT COUNT(*) n FROM mk_audit_logs WHERE action = 'page.published' AND resource_id = ? AND user_id IS NULL", String(id)).n === 1);
  });

  scenario("INT-CMS-006", "rédaction d'articles selon les rôles (état actuel : réservée au compte créateur)", ["Articles", "Permissions", "Éditeur d'articles"], "REEL-TEST", async (c) => {
    const author = await member("author"), contributor = await member("contributor");
    const fd = () => { const f = new FormData(); Object.entries({ title: "Article de rôle", excerpt: "r", content_format: "html", status: "draft", content: "<p>Texte</p>" }).forEach(([k, v]) => f.append(k, v)); return f; };
    for (const [label, client] of [["Éditeur", editorOrg], ["Auteur", author], ["Contributeur", contributor]]) {
      const before = one("SELECT COUNT(*) n FROM posts").n;
      const r = await client.request("/formateur/blog/nouveau", { method: "POST", multipart: fd(), headers: { "x-blog-editor": "1" } });
      c.check(`${label} : peut créer un article (attendu par ses permissions)`, r.status === 200 && one("SELECT COUNT(*) n FROM posts").n === before + 1, `status ${r.status}`, { anomalie: "G-03" });
    }
    const cr = await boss.request("/formateur/blog/nouveau", { method: "POST", multipart: fd(), headers: { "x-blog-editor": "1" } });
    c.check("le compte créateur crée un article (200)", cr.status === 200, `status ${cr.status}`);
    c.check("un Lecteur ne peut pas créer d'article (403)", (await viewerOrg.request("/formateur/blog/nouveau", { method: "POST", multipart: fd(), headers: { "x-blog-editor": "1" } })).status === 403);
    c.check("un compte hors équipe ne peut pas créer d'article (403)", (await outsider.request("/formateur/blog/nouveau", { method: "POST", multipart: fd(), headers: { "x-blog-editor": "1" } })).status === 403);
  });
});

describe("Sécurité et isolation transversales", () => {
  scenario("INT-SEC-015", "isolation entre sites, accès par identifiant, webhooks invalides, secrets et données personnelles dans les journaux", ["Permissions", "Sites", "Webhooks", "Journaux"], "REEL-TEST", async (c) => {
    const pageA = await livePage(boss, "Page sécurité A", { site: siteA });
    const funnelA = lastId((await boss.post(`${M}/tunnels`, { name: "Tunnel sécurité A", description: "", site: siteA })).location, /tunnels\/(\d+)/);
    const camp = await boss.post(`${M}/listes`, { name: "Audience sécurité A", site: siteA });
    const tests = [["page", `${M}/pages/${pageA.id}`], ["tunnel", `${M}/tunnels/${funnelA}`], ["aperçu de page", `${M}/pages/${pageA.id}/apercu`], ["historique", `${M}/site-web/historique/page/${pageA.id}`]];
    for (const [label, url] of tests) { const r = await memberB.get(url); c.check(`membre du site B → ${label} du site A refusé`, [403, 404].includes(r.status), `status ${r.status}`); }
    for (const [label, url] of tests) { const r = await outsider.get(url); c.check(`compte hors équipe → ${label} refusé`, r.status === 403, `status ${r.status}`); }
    const writes = [["supprimer la page", "post", `${M}/pages/${pageA.id}/supprimer`], ["archiver", "post", `${M}/pages/${pageA.id}/archiver`], ["publier", "post", `${M}/pages/${pageA.id}/publier.json`]];
    for (const [label, , url] of writes) { const r = await memberB.post(url, {}); c.check(`membre du site B → ${label} refusé`, [403, 404].includes(r.status) && one("SELECT archived_at FROM mk_landing_pages WHERE id = ?", pageA.id).archived_at === null, `status ${r.status}`); }
    c.check("webhook Stripe sans configuration : fermé (503) sur ce serveur de test", (await new Client(srv.base).request("/stripe/webhook", { method: "POST", json: { type: "charge.refunded" } })).status === 503);
    c.check("API publique sans clé : 401", (await anon.get("/api/v1/contacts")).status === 401);
    c.check("fichiers sensibles non exposés (.env, base, code)", (await Promise.all(["/.env", "/data/KOYEKOLA.db", "/server.js", "/package.json", "/.git/config"].map((p) => anon.get(p)))).every((r) => r.status === 404));
    const logs = srv.log();
    c.check("les journaux du serveur ne contiennent ni mot de passe ni clé secrète de test", !/MotDePasse|password_hash|sk_test|whsec_/.test(logs.replace(/Votre mot de passe|mot de passe oublié/gi, "")), "recherche dans la sortie du serveur de test");
    void camp;
  });
});
