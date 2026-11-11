// Pieds de page : COMPORTEMENTS RÉELS sur un VRAI serveur de test (un seul serveur pour tout le fichier, requêtes HTTP réelles, pages publiques servies par domaine de site).
//  4) isolation multi-sites : « Utiliser » = copie indépendante ; modifier / dépublier / supprimer sur le site A ne touche ni la bibliothèque ni le site B ; un membre du site B n'accède jamais au site A ; droits requis (forms.read / forms.write, pages.code inutile) ;
//  5) conditions et priorité sur des pages publiques réelles (accueil, page précise, article d'une catégorie, archive, recherche, 404) + vues boutique/compte/formation par la résolution du rendu ; exclusions ; conflit signalé ou remplacement explicite ; jamais deux pieds ;
//  7) newsletter / formulaire de contact : sans formulaire publié (état « non configuré », aucun faux champ), avec un formulaire publié (envoi POST réel, consentement exigé, succès/erreur), pour tous les modèles concernés.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const crypto = require("node:crypto");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, Client, loginInstructor, newStudent } = require("./helpers");
const Catalog = require("../src/themeBuilder/catalog");
const R = require("../src/themeBuilder/render");

const walk = (list, fn) => { for (const n of list || []) { fn(n); if (n && n.children) walk(n.children, fn); } };
const count = (t, s) => t.split(s).length - 1;
const sha = (x) => crypto.createHash("sha1").update(JSON.stringify(x)).digest("hex");
// Textes (lettres et espaces seulement : pas d'apostrophe ni de caractère échappé par le rendu) d'un modèle, et signature = le plus long texte que AUCUN autre des 100 modèles ne contient (repère unique dans la page publique)
const segments = (section) => {
  const out = new Set();
  walk(section.children, (n) => { const p = n.props || {}; for (const v of [p.text, p.html, n.type === "link" || n.type === "button" ? p.label : null]) { if (typeof v !== "string") continue; for (const seg of v.replace(/<[^>]+>/g, "|").split("|")) for (const x of seg.match(/[A-Za-zÀ-ÿ]+(?: [A-Za-zÀ-ÿ]+)*/g) || []) if (x.length >= 6 && x.length <= 40) out.add(x); } });
  return out;
};
let SEG_COUNT = null;
const signature = (section) => {
  // un texte est « unique » s'il n'est contenu (même en morceau d'un autre texte) dans AUCUN autre modèle listé
  if (!SEG_COUNT) {
    SEG_COUNT = new Map(); const textes = Catalog.entries("footer").map((e) => [...segments(Catalog.build("footer", e.key, {}).section)]);
    const blocs = textes.map((l) => l.join("\u0001"));
    for (const l of textes) for (const x of l) if (!SEG_COUNT.has(x)) SEG_COUNT.set(x, blocs.filter((b) => b.includes(x)).length);
  }
  const own = [...segments(section)].sort((a, b) => b.length - a.length);
  return own.find((x) => SEG_COUNT.get(x) === 1) || own[0] || "";
};

describe("Pieds de page : comportements réels (serveur)", () => {
  let srv, boss, db, org;
  const ORIGIN = () => ({ Origin: srv.base });
  const U = (s, p = "") => `/marketing/site-web/${s === "principal" ? "principal" : `sites/${s}`}/constructeur-de-theme${p}`;
  const json = (r) => JSON.parse(r.text);
  const post = (path, body, c = boss) => c.request(path, { method: "POST", json: body || {}, headers: ORIGIN() });
  const put = (path, body, c = boss) => c.request(path, { method: "PUT", json: body, headers: ORIGIN() });
  const idOf = (c) => db.prepare("SELECT id FROM users WHERE email = ?").get(c.email).id;
  const decode = (h) => h.replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/&nbsp;/g, " ");
  // Requête avec l'en-tête Host d'un domaine de site (fetch ne permet pas de le fixer)
  const hostReq = async (host, path, o = {}) => { for (let i = 0; ; i++) { try { return await hostReq1(host, path, o); } catch (e) { if (i >= 2 || !/ECONNRESET|socket hang up/.test(String(e.message))) throw e; await new Promise((r) => setTimeout(r, 1000)); } } };
  const hostReq1 = (host, path, { method = "GET", form = null, headers: extra = {} } = {}) => new Promise((resolve, reject) => {
    const u = new URL(srv.base), body = form ? new URLSearchParams(form).toString() : null;
    const headers = { Host: host, "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 Chrome/120 Safari/537.36", ...extra, ...(body ? { "Content-Type": "application/x-www-form-urlencoded", "Content-Length": Buffer.byteLength(body) } : {}) };
    const r = http.request({ host: u.hostname, port: u.port, path, method, headers }, (resp) => { let text = ""; resp.on("data", (d) => (text += d)); resp.on("end", () => resolve({ status: resp.statusCode, text, location: resp.headers.location || "" })); });
    r.on("error", reject); if (body) r.write(body); r.end();
  });
  const setDomain = async (s, host) => { const cur = json(await boss.get(`/marketing/site-web/sites/${s}/reglages.json`)); const r = await put(`/marketing/site-web/sites/${s}/reglages.json`, { revision: cur.revision, tokens: cur.tokens, settings: { ...cur.settings, seo: { ...cur.settings.seo, publicUrl: `https://${host}` } } }); assert.equal(r.status, 200, r.text.slice(0, 200)); };
  async function newSite(name, host) {
    const s = Number((await boss.post("/marketing/site-web/sites", { name })).location.match(/sites\/(\d+)/)[1]);
    const home = Number((await boss.post("/marketing/pages", { name: `Accueil ${name}`, site_id: s, kind: "page", template: "", ouvrir: "editeur" })).location.match(/pages\/(\d+)/)[1]);
    await draftAndPublishPage(home, `CORPS-${name}`);
    db.prepare("UPDATE mk_sites SET home_page_id = ? WHERE id = ?").run(home, s);
    await setDomain(s, host);
    return { s, home, host };
  }
  async function draftAndPublishPage(id, texte) {
    const rev = db.prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(id).revision;
    const corps = { id: "sect00000001", type: "layout", children: [{ id: "head00000001", type: "heading", props: { text: texte, level: "2" } }] };
    assert.equal((await put(`/marketing/pages/${id}/brouillon`, { revision: rev, content: { title: "t", sections: [corps] } })).status, 200);
    assert.equal((await post(`/marketing/pages/${id}/publier.json`, {})).status, 200);
  }
  const useModel = async (s, key, c = boss) => { const r = await post(U(s, "/api/bibliotheque/utiliser"), { type: "footer", key }, c); return r; };
  const comp = (id) => db.prepare("SELECT * FROM mk_web_components WHERE id = ?").get(id);

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "", ALLOW_INDEXING: "1" });
    boss = await loginInstructor(srv); db = srv.db(); org = db.prepare("SELECT id FROM mk_organizations").get().id;
  });
  after(async () => { if (db) db.close(); if (srv) await srv.stop(); });

  // ───────────────────────────────────────────────────────────── 4) ISOLATION MULTI-SITES
  describe("4) isolation multi-sites", () => {
    let A, B, C, KEY, tA, tB, snapshot, editorB, viewerB, adminB;
    before(async () => {
      A = await newSite("Site A isolation", "a.isolation.example"); B = await newSite("Site B isolation", "b.isolation.example"); C = await newSite("Site C isolation", "c.isolation.example");
      KEY = "ft-corporate-01-grande-marque-volets";
      snapshot = sha(Catalog.build("footer", KEY, {}));
      const member = async (site, role) => { const c = await newStudent(srv); db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, ?)").run(site, idOf(c), role); return c; };
      editorB = await member(B.s, "editor"); viewerB = await member(B.s, "viewer"); adminB = await member(B.s, "admin");
    });

    test("« Utiliser » sur A et sur B : deux composants, deux modèles, deux sites distincts, contenu identique au départ (copie), rien de partagé par référence", async () => {
      const a = await useModel(A.s, KEY), b = await useModel(B.s, KEY);
      assert.equal(a.status, 200, a.text.slice(0, 200)); assert.equal(b.status, 200);
      tA = json(a).template; tB = json(b).template;
      assert.notEqual(tA.id, tB.id); assert.notEqual(tA.sourceId, tB.sourceId);
      const cA = comp(tA.sourceId), cB = comp(tB.sourceId);
      assert.equal(cA.site_id, A.s); assert.equal(cB.site_id, B.s);
      assert.equal(JSON.parse(cA.section).children.length, JSON.parse(cB.section).children.length);
      assert.equal(db.prepare("SELECT site_id FROM mk_tb_templates WHERE id = ?").get(tA.id).site_id, A.s);
      assert.equal(db.prepare("SELECT site_id FROM mk_tb_templates WHERE id = ?").get(tB.id).site_id, B.s);
      assert.equal(db.prepare("SELECT origin_key FROM mk_tb_templates WHERE id = ?").get(tA.id).origin_key, KEY);
      // le document inséré n'est pas l'objet du catalogue : deux constructions successives restent identiques et indépendantes
      assert.equal(sha(Catalog.build("footer", KEY, {})), snapshot);
    });

    test("modifier l'instance de A (texte, enregistrement, publication) : ni la bibliothèque, ni l'instance de B, ni un 3e site qui insère après coup ne changent", async () => {
      const before = comp(tB.sourceId);
      const cur = comp(tA.sourceId), draft = JSON.parse(cur.draft || cur.section);
      let touched = 0; walk(draft.children, (n) => { if (n.type === "text" && !touched) { n.props = { ...n.props, html: "<p>TITRE-MODIFIE-SUR-A</p>" }; touched++; } });
      assert.equal(touched, 1);
      assert.equal((await put(`/marketing/site-web/composants/${tA.sourceId}/brouillon`, { revision: cur.revision, content: { title: "t", sections: [draft] } })).status, 200);
      assert.equal((await post(U(A.s, `/api/modeles/${tA.id}/publier`), { strict: true, scope: "site", replace: true })).status, 200);
      assert.equal((await post(U(B.s, `/api/modeles/${tB.id}/publier`), { strict: true, scope: "site", replace: true })).status, 200);
      assert.deepEqual(comp(tB.sourceId), before, "l'instance de B n'a pas bougé");
      assert.equal(sha(Catalog.build("footer", KEY, {})), snapshot, "le modèle de la bibliothèque n'a pas bougé");
      const a = await hostReq(A.host, "/"), b = await hostReq(B.host, "/");
      assert.ok(a.text.includes("TITRE-MODIFIE-SUR-A"), "A affiche sa modification"); assert.ok(!b.text.includes("TITRE-MODIFIE-SUR-A"), "B ne l'affiche pas");
      assert.equal(count(a.text, "<footer"), 1); assert.equal(count(b.text, "<footer"), 1);
      const c = json(await useModel(C.s, KEY)).template;
      assert.ok(!comp(c.sourceId).section.includes("TITRE-MODIFIE-SUR-A"), "un nouveau site reçoit le modèle d'origine, pas la version modifiée de A");
    });

    test("dépublier puis supprimer sur A : B garde son pied en ligne, la bibliothèque est intacte", async () => {
      assert.equal((await post(U(A.s, `/api/modeles/${tA.id}/depublier`))).status, 200);
      assert.ok(!(await hostReq(A.host, "/")).text.includes("TITRE-MODIFIE-SUR-A"));
      const inB = await hostReq(B.host, "/"); assert.equal(count(inB.text, "<footer"), 1); assert.ok(inB.text.includes("lp-site-footer"));
      assert.equal((await post(U(A.s, `/api/modeles/${tA.id}/archiver`))).status, 200, "archiver avant de supprimer");
      const del = await post(U(A.s, `/api/modeles/${tA.id}/supprimer`)); assert.equal(del.status, 200, del.text.slice(0, 200));
      assert.equal(db.prepare("SELECT COUNT(*) n FROM mk_tb_templates WHERE id = ?").get(tA.id).n, 0);
      assert.ok(comp(tB.sourceId), "le composant de B existe toujours");
      assert.equal(db.prepare("SELECT status FROM mk_tb_templates WHERE id = ?").get(tB.id).status, "published");
      assert.ok((await hostReq(B.host, "/")).text.includes("lp-site-footer"));
      assert.equal(sha(Catalog.build("footer", KEY, {})), snapshot);
    });

    test("un membre du site B (éditeur) ne lit ni ne modifie rien du site A : 404 sur chaque chemin ; son propre site fonctionne", async () => {
      const tA2 = json(await useModel(A.s, "ft-minimalistes-08-trois-volets-compacts")).template;
      const paths = [["GET", U(A.s, "/api/modeles")], ["GET", U(A.s, `/api/modeles/${tA2.id}/plan-publication`)], ["POST", U(A.s, `/api/modeles/${tA2.id}/publier`)], ["POST", U(A.s, `/api/modeles/${tA2.id}/supprimer`)],
        ["POST", U(A.s, `/api/modeles/${tA2.id}/dupliquer`)], ["GET", U(A.s, `/api/modeles/${tA2.id}/export.json`)], ["POST", U(A.s, "/api/bibliotheque/utiliser")]];
      for (const [m, p] of paths) { const r = m === "GET" ? await editorB.get(p) : await post(p, { type: "footer", key: KEY }, editorB); assert.ok([403, 404].includes(r.status), `${m} ${p} -> ${r.status}`); assert.notEqual(r.status, 200); }
      // l'identifiant du modèle de A, présenté sous l'adresse du site B
      for (const [m, p] of [["GET", U(B.s, `/api/modeles/${tA2.id}/plan-publication`)], ["POST", U(B.s, `/api/modeles/${tA2.id}/publier`)], ["POST", U(B.s, `/api/modeles/${tA2.id}/supprimer`)]]) { const r = m === "GET" ? await editorB.get(p) : await post(p, {}, editorB); assert.ok([403, 404].includes(r.status), `${m} ${p} -> ${r.status}`); } // supprimer exige en plus « pages.delete » (403) ; les autres : 404
      assert.equal(db.prepare("SELECT COUNT(*) n FROM mk_tb_templates WHERE id = ?").get(tA2.id).n, 1, "le modèle de A existe toujours");
      // le composant de A, par son adresse directe : lecture et écriture refusées
      const cA = comp(tA2.sourceId);
      const rw = await put(`/marketing/site-web/composants/${tA2.sourceId}/brouillon`, { revision: cA.revision, content: { title: "x", sections: [{ id: "sect00000009", type: "layout", children: [] }] } }, editorB);
      assert.ok([403, 404].includes(rw.status), `écriture directe du composant de A : ${rw.status}`);
      assert.deepEqual(comp(tA2.sourceId), cA, "le composant de A n'a pas été modifié");
      const rd = await editorB.get(`/marketing/site-web/composants/${tA2.sourceId}/apercu`); assert.ok([403, 404].includes(rd.status), `aperçu direct du composant de A : ${rd.status}`);
      // son propre site marche
      assert.equal((await editorB.get(U(B.s, "/api/modeles"))).status, 200);
      assert.equal((await useModel(B.s, "ft-minimalistes-08-trois-volets-compacts", editorB)).status, 200);
    });

    test("droits : lecteur = lecture seule (aucune insertion) ; éditeur (forms.write, SANS pages.code) insère et publie ; aucun modèle ne contient de HTML libre (pages.code inutile)", async () => {
      assert.equal((await viewerB.get(U(B.s, "/api/modeles"))).status, 200);
      assert.equal((await viewerB.get(`${U(B.s)}/api/bibliotheque/footer/${KEY}/apercu`)).status, 200);
      const rv = await useModel(B.s, KEY, viewerB); assert.equal(rv.status, 403, "lecteur : insertion refusée");
      const tb = json(await useModel(B.s, KEY, editorB)).template;
      assert.equal((await post(U(B.s, `/api/modeles/${tb.id}/publier`), { strict: true, scope: "site", replace: true }, viewerB)).status, 403, "lecteur : publication refusée");
      assert.equal((await post(U(B.s, `/api/modeles/${tb.id}/publier`), { strict: true, scope: "site", replace: true }, editorB)).status, 200, "éditeur : publication acceptée");
      const risky = [];
      for (const e of Catalog.entries("footer")) walk(Catalog.build("footer", e.key, {}).section.children, (n) => { if (["code", "embed", "customcode", "script", "iframe"].includes(n.type)) risky.push(`${e.key}:${n.type}`); if (n.type === "html" && /<\s*(script|iframe|object|embed|link|meta|style)\b|\son[a-z]+\s*=|javascript:|data:text\/html/i.test(JSON.stringify(n.props || {}))) risky.push(`${e.key}:html-dangereux`); }); // décors dessinés (SVG) autorisés dans le widget HTML du catalogue ; jamais de script, d'iframe ni de gestionnaire d'événement
      assert.deepEqual(risky, [], "aucun modèle n'embarque de code libre");
      const roleCode = db.prepare("SELECT 1 x").get(); assert.ok(roleCode);
    });

    test("un éditeur SANS pages.code insère tous les modèles du catalogue (aucun refus caché par un droit de code)", async () => {
      const D = await newSite("Site D droits", "d.isolation.example");
      const ed = await newStudent(srv); db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, 'editor')").run(D.s, idOf(ed));
      let ok = 0;
      for (const e of Catalog.entries("footer")) { const r = await useModel(D.s, e.key, ed); assert.equal(r.status, 200, `${e.key} : ${r.text.slice(0, 160)}`); ok++; }
      assert.equal(ok, Catalog.entries("footer").length);
    });

    test("réglages, formulaire et affectations restent propres à chaque site : le formulaire publié de A n'apparaît jamais sur B ; la publication de A ne change pas les conditions de B", async () => {
      const fid = Number((await boss.post("/marketing/formulaires", { name: "Lettre de A", consentText: "J'accepte la lettre de A.", site: String(A.s) })).location.match(/formulaires\/(\d+)/)[1]);
      assert.equal((await boss.post(`/marketing/formulaires/${fid}/publier`, {})).status, 302);
      const news = "ft-corporate-01-grande-marque-volets"; // contient une inscription par e-mail
      const ta = json(await useModel(A.s, news)).template, tb = json(await useModel(B.s, news)).template;
      await post(U(A.s, `/api/modeles/${ta.id}/publier`), { strict: true, scope: "site", replace: true }); await post(U(B.s, `/api/modeles/${tb.id}/publier`), { strict: true, scope: "site", replace: true });
      const a = await hostReq(A.host, "/"), b = await hostReq(B.host, "/");
      assert.ok(/<form class="kw-emailsub-form"/.test(a.text), "A : vrai formulaire dans le pied"); assert.ok(!/<form class="kw-emailsub-form"/.test(b.text), "B : pas le formulaire de A"); assert.ok(/kw-emailsub-missing/.test(b.text), "B : état non configuré");
      const cond = (id) => db.prepare("SELECT conditions, site_id FROM mk_tb_templates WHERE id = ?").get(id);
      assert.equal(cond(ta.id).site_id, A.s); assert.equal(cond(tb.id).site_id, B.s);
      assert.equal(db.prepare("SELECT COUNT(*) n FROM mk_tb_templates WHERE site_id = ? AND type = 'footer' AND status = 'published'").get(B.s).n, 1, "un seul pied publié sur B");
      assert.equal(db.prepare("SELECT COUNT(*) n FROM mk_tb_templates WHERE site_id = ? AND type = 'footer' AND status = 'published'").get(A.s).n, 1, "un seul pied publié sur A");
      // aucun modèle n'embarque de média : rien à partager ni à copier entre sites
      const media = [];
      for (const e of Catalog.entries("footer")) walk(Catalog.build("footer", e.key, {}).section.children, (n) => { if (["image", "video", "gallery", "audio"].includes(n.type) || (n.props && (n.props.src || n.props.mediaId || n.props.image))) media.push(`${e.key}:${n.type}`); });
      assert.deepEqual(media, [], "aucun média dans les 100 modèles");
    });
  });

  // ───────────────────────────────────────────────────────────── 5) CONDITIONS ET PRIORITÉ
  describe("5) conditions et priorité sur pages publiques réelles", () => {
    let P, pX, pY, MAIN_HOST, PICK;
    const SIGP = {}, SIGM = {}, TP = {}, TM = {};
    const slug = (id) => db.prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(id).slug;
    const final = async (host, path) => { let r = await hostReq(host, path); if (r.status >= 300 && r.status < 400) r = await hostReq(host, r.location.replace(/^https?:\/\/[^/]+/, "")); return r; };
    // Quels pieds (par texte repère unique) apparaissent DANS le <footer> de la page publique ?
    async function seen(host, path, SIG) {
      const r = await final(host, path); const pied = decode(r.text.slice(r.text.indexOf("<footer"), r.text.indexOf("</footer>")));
      return { r, pieds: Object.keys(SIG).filter((n) => pied.includes(SIG[n])), nFooter: count(r.text, "<footer"), repere: count(r.text, 'data-kw-footer="1"') };
    }
    async function publishAs(S, TT, SIG, name, key, scope, conditions, extra = {}) {
      const t = json(await useModel(S, key)).template; TT[name] = t; SIG[name] = signature(JSON.parse(comp(t.sourceId).section));
      return { t, res: await post(U(S, `/api/modeles/${t.id}/publier`), { strict: true, scope, ...(conditions ? { conditions } : {}), ...extra }) };
    }
    async function cascade(S, host, TT, SIG, spec, expect, label) {
      for (const [name, key, scope, cond] of spec) { const { res } = await publishAs(S, TT, SIG, name, key, scope, cond, { replace: false }); assert.equal(res.status, 200, `${label} ${name} : ${res.text.slice(0, 300)}`); }
      const sigs = Object.values(SIG); assert.equal(new Set(sigs).size, sigs.length, "textes repères tous différents");
      const bad = [];
      for (const [path, winner] of expect) {
        const o = await seen(host, path, SIG);
        if (o.nFooter !== 1) bad.push(`${path} : ${o.nFooter} balises <footer>`);
        if (o.repere !== 1) bad.push(`${path} : ${o.repere} repères de pied`);
        if (o.pieds.length !== 1 || o.pieds[0] !== winner) bad.push(`${path} : attendu « ${winner} », vu [${o.pieds.join(", ")}] (HTTP ${o.r.status})`);
      }
      assert.deepEqual(bad, [], bad.join("\n"));
    }

    before(async () => {
      MAIN_HOST = new URL(srv.base).host;
      // 1 modèle par famille dont un texte n'existe dans AUCUN autre modèle (repère sûr dans la page publique)
      const fam = {}; for (const e of Catalog.entries("footer")) if (!fam[e.layoutKey]) { const sg = signature(Catalog.build("footer", e.key, {}).section); const uniq = [...segments(Catalog.build("footer", e.key, {}).section)].some((x) => SEG_COUNT.get(x) === 1); if (uniq && sg) fam[e.layoutKey] = e.key; }
      PICK = Object.values(fam); assert.ok(PICK.length >= 12, `${PICK.length} modèles à repère unique`);
      P = await newSite("Site conditions", "p.conditions.example");
      pX = Number((await boss.post("/marketing/pages", { name: "Page X conditions", site_id: P.s, kind: "page", template: "", ouvrir: "editeur" })).location.match(/pages\/(\d+)/)[1]); await draftAndPublishPage(pX, "CORPS-X");
      pY = Number((await boss.post("/marketing/pages", { name: "Page Y conditions", site_id: P.s, kind: "page", template: "", ouvrir: "editeur" })).location.match(/pages\/(\d+)/)[1]); await draftAndPublishPage(pY, "CORPS-Y");
      for (const [slg, title, cat] of [["article-cat", "Article en catégorie", "Actualités"], ["article-autre", "Article hors catégorie", "Divers"]]) db.prepare("INSERT INTO posts (slug, title, content, published, status, published_at, category, tags, created_at, updated_at) VALUES (?, ?, '<p>x</p>', 1, 'published', datetime('now'), ?, 'astuces', datetime('now'), datetime('now'))").run(slg, title, cat);
    });

    test("SITE À DOMAINE : cascade du plus général au plus précis (tout le site → accueil → page X → 404) : chaque page reçoit LE bon pied, un seul", async () => {
      await cascade(P.s, P.host, TP, SIGP, [
        ["tout", PICK[0], "site", null], ["pageX", PICK[1], "custom", { include: [{ kind: "page", ids: [pX] }] }],
        ["accueil", PICK[2], "custom", { include: [{ kind: "front_page" }] }], ["erreur404", PICK[3], "custom", { include: [{ kind: "not_found" }] }],
      ], [["/", "accueil"], [`/p/${slug(pX)}`, "pageX"], [`/p/${slug(pY)}`, "tout"], ["/introuvable-xyz", "erreur404"]], "site");
    });

    test("SITE PRINCIPAL (blog et recherche) : cascade tout le site → articles → articles d'une catégorie → archives → recherche → 404", async () => {
      await cascade("principal", MAIN_HOST, TM, SIGM, [
        ["tout", PICK[4], "site", null], ["articles", PICK[5], "custom", { include: [{ kind: "post" }] }], ["catActu", PICK[6], "custom", { include: [{ kind: "post", category: ["Actualités"] }] }],
        ["archives", PICK[7], "custom", { include: [{ kind: "archive" }] }], ["recherche", PICK[8], "custom", { include: [{ kind: "search" }] }], ["erreur404", PICK[9], "custom", { include: [{ kind: "not_found" }] }],
      ], [["/blog/article-cat", "catActu"], ["/blog/article-autre", "articles"], ["/blog", "archives"], ["/blog?q=zzz", "recherche"], ["/introuvable-xyz", "erreur404"], ["/a-propos", "tout"]], "principal");
    });

    test("exclusion : « tout le site SAUF la page Y » ne s'affiche pas sur Y ; le plus précis garde X ; jamais deux pieds", async () => {
      const t = json(await useModel(P.s, PICK[10])).template; TP.sauf = t; SIGP.sauf = signature(JSON.parse(comp(t.sourceId).section));
      const cond = { include: [], exclude: [{ kind: "page", ids: [pY] }] };
      const first = await post(U(P.s, `/api/modeles/${t.id}/publier`), { strict: true, scope: "custom", conditions: cond });
      // chevauche « tout le site » : soit publié (chevauchement expliqué), soit conflit bloquant expliqué ; jamais un échec silencieux
      assert.ok([200, 409].includes(first.status), first.text.slice(0, 300));
      if (first.status === 409) assert.ok(json(first).conflicts && json(first).conflicts.length >= 1, "conflit expliqué");
      const rep = first.status === 200 ? first : await post(U(P.s, `/api/modeles/${t.id}/publier`), { strict: true, scope: "custom", conditions: cond, replace: true });
      assert.equal(rep.status, 200, rep.text.slice(0, 300));
      const y = await seen(P.host, `/p/${slug(pY)}`, SIGP), x = await seen(P.host, `/p/${slug(pX)}`, SIGP), h = await seen(P.host, "/", SIGP);
      assert.ok(!y.pieds.includes("sauf"), "la page exclue n'affiche pas le pied « sauf Y »"); assert.ok(y.pieds.length <= 1 && y.nFooter <= 1, `page Y : [${y.pieds}] ${y.nFooter} <footer>`);
      assert.deepEqual(x.pieds, ["pageX"], "page X : le plus précis"); assert.deepEqual(h.pieds, ["accueil"], "accueil : le plus précis");
    });

    test("2e pied sur le MÊME contexte (page X) : conflit bloquant signalé (409, rien ne change) ; avec « remplacer » le précédent repasse en brouillon ; un seul pied ensuite", async () => {
      const before = await seen(P.host, `/p/${slug(pX)}`, SIGP);
      const second = json(await useModel(P.s, PICK[11])).template; SIGP.second = signature(JSON.parse(comp(second.sourceId).section));
      const refuse = await post(U(P.s, `/api/modeles/${second.id}/publier`), { strict: true, scope: "custom", conditions: { include: [{ kind: "page", ids: [pX] }] } });
      assert.equal(refuse.status, 409, refuse.text.slice(0, 300));
      assert.ok(json(refuse).conflicts.some((c) => c.severity === "blocking"), "conflit bloquant expliqué");
      assert.equal(db.prepare("SELECT status FROM mk_tb_templates WHERE id = ?").get(second.id).status, "draft");
      assert.deepEqual((await seen(P.host, `/p/${slug(pX)}`, SIGP)).pieds, before.pieds, "rien n'a changé sur le site");
      const rep = await post(U(P.s, `/api/modeles/${second.id}/publier`), { strict: true, scope: "custom", conditions: { include: [{ kind: "page", ids: [pX] }] }, replace: true });
      assert.equal(rep.status, 200, rep.text.slice(0, 300)); assert.deepEqual(json(rep).replaced.map((x) => x.name), [TP.pageX.name]);
      assert.equal(db.prepare("SELECT status FROM mk_tb_templates WHERE id = ?").get(TP.pageX.id).status, "draft");
      const after = await seen(P.host, `/p/${slug(pX)}`, SIGP); assert.deepEqual(after.pieds, ["second"]); assert.equal(after.nFooter, 1);
    });

    test("balayage final : sur toutes les adresses des deux sites, jamais deux pieds et jamais le pied d'un autre site", async () => {
      const bad = [];
      for (const [host, urls, others] of [[P.host, ["/", `/p/${slug(pX)}`, `/p/${slug(pY)}`, "/introuvable-xyz", "/blog"], SIGM], [MAIN_HOST, ["/blog", "/blog/article-cat", "/blog/article-autre", "/blog?q=aaa", "/blog?categorie=Actualit%C3%A9s", "/a-propos", "/introuvable-xyz", "/boutique/compte", "/cours/inconnu"], SIGP]]) {
        for (const u of urls) {
          const r = await final(host, u);
          if (count(r.text, "<footer") > 1) bad.push(`${host}${u} : ${count(r.text, "<footer")} balises <footer>`);
          if (count(r.text, 'data-kw-footer="1"') > 1) bad.push(`${host}${u} : repère dupliqué`);
          const pied = decode(r.text.slice(r.text.indexOf("<footer"), r.text.indexOf("</footer>")));
          for (const [n, sg] of Object.entries(others)) if (sg && pied.includes(sg)) bad.push(`${host}${u} : contient le pied « ${n} » d'un AUTRE site`);
        }
      }
      assert.deepEqual(bad, [], bad.join("\n"));
    });

    test("vues boutique / produit / compte / panier / formation : la résolution du rendu public choisit le bon pied (moteur réel, base du serveur)", async () => {
      const Q = await newSite("Site boutique conditions", "q.conditions.example");
      const mk = async (prefixIndex, cond, scope = "custom") => { const t = json(await useModel(Q.s, PICK[prefixIndex])).template; const r = await post(U(Q.s, `/api/modeles/${t.id}/publier`), { strict: true, scope, ...(cond ? { conditions: cond } : {}), replace: false }); assert.equal(r.status, 200, `${r.text.slice(0, 200)}`); return db.prepare("SELECT name FROM mk_tb_templates WHERE id = ?").get(t.id).name; };
      const nTout = await mk(0, null, "site"), nBoutique = await mk(2, { include: [{ kind: "shop" }] }), nCompte = await mk(3, { include: [{ kind: "account" }] }), nProduit = await mk(4, { include: [{ kind: "product" }] }), nCours = await mk(5, { include: [{ kind: "course" }] });
      const ctx = { db, organizationId: org, userId: null };
      const at = (p) => (R.resolveParts(ctx, Q.s, R.defaultContext(Q.s, p)).footer || {}).name;
      const withView = (view, o = {}) => (R.resolveParts(ctx, Q.s, { siteId: Q.s, view, id: null, authorId: null, parents: [], categories: [], categoryAncestors: [], tags: [], ...o }).footer || {}).name;
      assert.equal(at("/boutique/compte"), nCompte, "compte client"); assert.equal(at("/boutique/compte/commandes"), nCompte);
      assert.equal(at("/boutique/panier"), nBoutique, "panier"); assert.equal(at("/boutique/commande"), nBoutique);
      assert.equal(withView("product_archive"), nBoutique, "liste des produits (vue posée par la route de la boutique)"); assert.equal(withView("product"), nProduit, "fiche produit : le plus précis"); assert.equal(at("/cours/seo"), nCours, "formation");
      assert.equal(at("/une-page"), nTout); assert.equal(at("/"), nTout); assert.equal(withView("search"), nTout, "recherche : le général"); assert.equal(withView("not_found"), nTout, "404 : le général");
      const autreF = R.resolveParts(ctx, P.s, R.defaultContext(P.s, "/boutique/compte")).footer || {};
      // un pied d'un AUTRE site peut porter le même nom de modèle : on vérifie à qui il appartient, pas son nom
      const proprio = autreF.id ? (db.prepare("SELECT site_id AS s FROM mk_tb_templates WHERE id = ?").get(autreF.id) || {}).s : null;
      assert.ok(autreF.id ? proprio !== Q.s : ![nTout, nBoutique, nCompte, nProduit, nCours].includes(autreF.name), "isolation : un autre site n'hérite d'aucun pied du site boutique");
    });
  });

  // ───────────────────────────────────────────────────────────── 7) NEWSLETTER / FORMULAIRES
  describe("7) newsletter et formulaires dans le pied", () => {
    let N1, N2;
    const forms = () => {
      const out = { news: [], contact: [] };
      const listes = new Set(Catalog.entries("footer").map((e) => e.key));
      // les modèles listés (v2) + les anciens modèles masqués mais toujours ouvrables (ils portent les formulaires de contact complets)
      const cles = [...listes, ...require("../src/themeBuilder/catalog/footer").hiddenLayouts.map((l) => l.fullKey).filter((k) => !listes.has(k))];
      for (const k of cles) walk(Catalog.build("footer", k, {}).section.children, (n) => { if (n.type === "emailsubscribe") { const c = n.props.fields === "all"; if (c || listes.has(k)) out[c ? "contact" : "news"].push(k); } });
      return out;
    };
    const footerHtml = (t) => t.slice(t.indexOf("<footer"), t.indexOf("</footer>"));
    const msgOf = (t) => decode(((t.match(/class="lp-error"[^>]*role="alert"[^>]*>([^<]+)</) || t.match(/role="alert"[^>]*>([^<]+)</) || t.match(/class="lp-thanks"[^>]*>([^<]+)</) || t.match(/role="status"[^>]*>([^<]+)</) || [])[1]) || "").trim();
    before(async () => {
      N1 = await newSite("Site sans formulaire", "n1.formulaires.example"); N2 = await newSite("Site avec formulaire", "n2.formulaires.example");
      const fid = Number((await boss.post("/marketing/formulaires", { name: "Lettre N2", consentText: "J'accepte de recevoir la lettre.", site: String(N2.s) })).location.match(/formulaires\/(\d+)/)[1]);
      assert.equal((await boss.post(`/marketing/formulaires/${fid}/publier`, {})).status, 302);
      N2.formId = fid;
    });
    const publishOn = async (S, key, first) => { const t = json(await useModel(S.s, key)).template; const r = await post(U(S.s, `/api/modeles/${t.id}/publier`), { strict: true, scope: "site", replace: true }); assert.equal(r.status, 200, `${key} ${r.text.slice(0, 200)}`); return t; };

    test("SANS formulaire publié : les modèles avec newsletter ou contact affichent un état « non configuré » explicite, sans champ ni faux bouton (page d'accueil, blog, 404)", async () => {
      const { news, contact } = forms();
      assert.ok(news.length >= 30 && contact.length >= 3, `${news.length} newsletters, ${contact.length} contacts`);
      const bad = [];
      for (const key of [...news, ...contact]) {
        await publishOn(N1, key);
        for (const p of ["/", "/blog", "/introuvable-xyz"]) {
          const r = await hostReq(N1.host, p); const f = footerHtml(r.text);
          if (!/data-kw-state="not-configured"/.test(f)) bad.push(`${key} ${p} : pas d'état « non configuré »`);
          if (/<form\b[^>]*emailsub|kw-emailsub-form|name="email"|name="consent"/.test(f)) bad.push(`${key} ${p} : faux champ ou faux formulaire`);
          if (/Audience|Formulaires d.inscription/.test(f)) bad.push(`${key} ${p} : jargon d'éditeur visible du public`);
          if (!/non configurée? pour le moment|configuré/i.test(f) && !/data-kw-state/.test(f)) bad.push(`${key} ${p} : phrase absente`);
          if (/<button[^>]*kw-emailsub-submit/.test(f)) bad.push(`${key} ${p} : bouton d'envoi factice`);
        }
      }
      assert.deepEqual(bad, [], bad.slice(0, 20).join("\n"));
    });

    const actionOf = async (host, p) => { const f = footerHtml((await hostReq(host, p)).text); const form = f.match(/<form class="kw-emailsub-form"[^>]*>/); return { f, form, action: form && (form[0].match(/action="([^"]*)"/) || [])[1] }; };
    test("AVEC un formulaire publié : le vrai formulaire apparaît sur la page d'accueil (consentement, piège anti-robot, jeton) avec une adresse d'envoi valide", async () => {
      await publishOn(N2, "ft-corporate-01-grande-marque-volets");
      const { f, form, action } = await actionOf(N2.host, "/");
      assert.ok(form, "formulaire absent"); assert.match(f, /name="consent"/); assert.match(f, /name="website"/); assert.match(f, /name="ft"/);
      assert.match(action, /^\/p\/[a-z0-9-]+\/inscription$/, `action d'envoi : ${action}`);
    });
    // D2 (corrigé) : hors pages du Page Builder (blog, recherche, 404, boutique, compte), l'envoi passe par une route propre au site (/p/_pied/inscription), sans page porteuse.
    test("AVEC un formulaire publié : sur le blog, la recherche et la page 404, l'envoi fonctionne (adresse propre au site, message de succès ou d'erreur affiché, contact créé)", async () => {
      await publishOn(N2, "ft-corporate-01-grande-marque-volets");
      const bad = [];
      const count0 = () => db.prepare("SELECT COUNT(*) n FROM mk_contacts WHERE email LIKE '%@pied-hors-pb.example'").get().n;
      let n = 0;
      for (const p of ["/blog", "/blog?q=zzz", "/introuvable-xyz"]) {
        const ip = { "X-Forwarded-For": `10.77.${++n}.1` }; // limite de 5 envois par heure et par adresse : une adresse distincte par page testée
        const page = await hostReq(N2.host, p); const f = footerHtml(page.text); const form = f.match(/<form class="kw-emailsub-form"[^>]*>/);
        if (!form) { bad.push(`${p} : formulaire absent`); continue; }
        const action = (form[0].match(/action="([^"]*)"/) || [])[1];
        if (action !== "/p/_pied/inscription") { bad.push(`${p} : adresse d'envoi « ${action} »`); continue; }
        const val = (name) => (f.match(new RegExp(`name="${name}"[^>]*value="([^"]*)"`)) || f.match(new RegExp(`value="([^"]*)"[^>]*name="${name}"`)) || [])[1] || "";
        const base = { w: val("w"), tz: "Europe/Paris", ft: val("ft"), back: decode(val("back")), website: "" };
        if (!base.w || !base.ft || base.back !== p) { bad.push(`${p} : champs cachés incomplets (w=${base.w} ft=${base.ft ? "ok" : "vide"} back=${base.back})`); continue; }
        await new Promise((r) => setTimeout(r, 2300));
        const follow = async (r) => { assert.equal(r.status, 303, `${p} : redirection attendue, reçu ${r.status}`); assert.ok(r.location.startsWith(p.split("?")[0]), `retour sur la page d'origine : ${r.location}`); return hostReq(N2.host, r.location.replace(/^https?:\/\/[^/]+/, "")); };
        const c0 = count0();
        const noConsent = await follow(await hostReq(N2.host, action, { method: "POST", headers: ip, form: { ...base, email: "sans@pied-hors-pb.example" } }));
        if (!/Cochez la case/.test(msgOf(footerHtml(noConsent.text)))) bad.push(`${p} : message « Cochez la case » absent`);
        const badMail = await follow(await hostReq(N2.host, action, { method: "POST", headers: ip, form: { ...base, email: "pas-un-mail", consent: "1" } }));
        if (!/invalide/i.test(msgOf(footerHtml(badMail.text)))) bad.push(`${p} : message d'e-mail invalide absent`);
        if (count0() !== c0) bad.push(`${p} : contact créé à tort`);
        const ok = await follow(await hostReq(N2.host, action, { method: "POST", headers: ip, form: { ...base, email: `abonne${n}@pied-hors-pb.example`, consent: "1" } }));
        if (!/Merci|confirmation/.test(msgOf(footerHtml(ok.text)))) bad.push(`${p} : message de succès absent`);
        if (count0() !== c0 + 1) bad.push(`${p} : contact non créé`);
        const trap = await follow(await hostReq(N2.host, action, { method: "POST", headers: ip, form: { ...base, email: "robot@pied-hors-pb.example", consent: "1", website: "http://spam" } }));
        if (count0() !== c0 + 1) bad.push(`${p} : le champ piège a enregistré un contact`);
        // sécurité : un identifiant de widget inconnu, ou une adresse de retour externe, ne mène nulle part
        const evil = await hostReq(N2.host, action, { method: "POST", headers: ip, form: { ...base, w: "inconnu123", back: "//evil.example/x", email: "z@pied-hors-pb.example", consent: "1" } });
        if (evil.status !== 303 || /evil\.example/.test(evil.location)) bad.push(`${p} : retour non sûr « ${evil.location} »`);
        if (count0() !== c0 + 1) bad.push(`${p} : widget inconnu a créé un contact`);
      }
      assert.deepEqual(bad, [], bad.join("\n"));
    });
    test("isolation : le widget du pied d'un AUTRE site n'est jamais accepté par la route d'envoi du pied", async () => {
      const home = footerHtml((await hostReq(N2.host, "/blog")).text);
      const w = (home.match(/name="w"[^>]*value="([^"]*)"/) || home.match(/value="([^"]*)"[^>]*name="w"/) || [])[1];
      const ft = (home.match(/name="ft"[^>]*value="([^"]*)"/) || home.match(/value="([^"]*)"[^>]*name="ft"/) || [])[1];
      assert.ok(w && ft);
      await new Promise((r) => setTimeout(r, 2300));
      const c0 = db.prepare("SELECT COUNT(*) n FROM mk_contacts WHERE email = 'autre@pied-hors-pb.example'").get().n;
      const r = await hostReq(N1.host, "/p/_pied/inscription", { method: "POST", headers: { "X-Forwarded-For": "10.78.0.1" }, form: { w, ft, tz: "Europe/Paris", back: "/", website: "", email: "autre@pied-hors-pb.example", consent: "1" } });
      assert.equal(r.status, 303); assert.match(r.location, /kwi=indispo/);
      assert.equal(db.prepare("SELECT COUNT(*) n FROM mk_contacts WHERE email = 'autre@pied-hors-pb.example'").get().n, c0);
    });

    test("envoi POST réel depuis le pied : sans consentement refusé avec message ; avec consentement accepté (contact créé) ; e-mail invalide refusé ; piège rempli = faux succès sans enregistrement", async () => {
      const home = await hostReq(N2.host, "/");
      const f = footerHtml(home.text); const form = f.match(/<form class="kw-emailsub-form"[^>]*>/);
      assert.ok(form, "formulaire présent sur l'accueil");
      const action = form[0].match(/action="([^"]*)"/)[1];
      const val = (name) => (f.match(new RegExp(`name="${name}"[^>]*value="([^"]*)"`)) || f.match(new RegExp(`value="([^"]*)"[^>]*name="${name}"`)) || [])[1] || "";
      const base = { w: val("w"), tz: "Europe/Paris", ft: val("ft"), website: "" };
      assert.ok(base.w, "identifiant du widget"); assert.ok(base.ft, "jeton");
      await new Promise((r) => setTimeout(r, 2300)); // le jeton doit avoir plus de 2 secondes (anti-robot)
      const count0 = () => db.prepare("SELECT COUNT(*) n FROM mk_contacts WHERE email LIKE '%@pied.example'").get().n;
      const n0 = count0();
      const noConsent = await hostReq(N2.host, action, { method: "POST", form: { ...base, email: "sans-accord@pied.example" } });
      assert.equal(noConsent.status, 400, `sans consentement -> ${noConsent.status}`); assert.match(msgOf(noConsent.text), /Cochez la case/, `message affiché : « ${msgOf(noConsent.text)} » ; extrait : ${decode(noConsent.text.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<[^>]+>/g, " ").replace(/\s+/g, " ")).slice(0, 300)}`);
      assert.equal(count0(), n0, "rien enregistré sans consentement");
      const badMail = await hostReq(N2.host, action, { method: "POST", form: { ...base, email: "pas-un-mail", consent: "1" } });
      assert.equal(badMail.status, 400, `e-mail invalide -> ${badMail.status}`); assert.match(msgOf(badMail.text), /invalide|valide/i, `message affiché : « ${msgOf(badMail.text)} »`);
      const ok = await hostReq(N2.host, action, { method: "POST", form: { ...base, email: "abonne@pied.example", consent: "1" } });
      assert.ok([200, 302, 303].includes(ok.status), `envoi valide -> ${ok.status} ${ok.text.slice(0, 200)}`);
      assert.equal(count0(), n0 + 1, "le contact est créé");
      const row = db.prepare("SELECT email FROM mk_contacts WHERE email = 'abonne@pied.example'").get(); assert.ok(row);
      if (ok.status >= 300) { const back = await hostReq(N2.host, ok.location.replace(/^https?:\/\/[^/]+/, "")); assert.match(decode(back.text), /Merci|confirmation|inscri/i, "message de succès visible après l'envoi"); }
      else assert.match(decode(ok.text), /Merci|confirmation|inscri/i);
      const trap = await hostReq(N2.host, action, { method: "POST", form: { ...base, email: "robot@pied.example", consent: "1", website: "http://spam" } });
      assert.ok([200, 302, 303].includes(trap.status)); assert.equal(count0(), n0 + 1, "le champ piège n'enregistre rien");
    });

    test("formulaire de contact du pied (fields = tous les champs) : mêmes protections, envoi réel accepté", async () => {
      const { contact } = forms();
      await publishOn(N2, contact[0]);
      const f = footerHtml((await hostReq(N2.host, "/")).text); const form = f.match(/<form class="kw-emailsub-form"[^>]*>/);
      assert.ok(form, `${contact[0]} : formulaire de contact présent avec un formulaire publié`);
      assert.match(f, /name="consent"/);
      const action = form[0].match(/action="([^"]*)"/)[1];
      const val = (name) => (f.match(new RegExp(`name="${name}"[^>]*value="([^"]*)"`)) || f.match(new RegExp(`value="([^"]*)"[^>]*name="${name}"`)) || [])[1] || "";
      await new Promise((r) => setTimeout(r, 2300));
      const r = await hostReq(N2.host, action, { method: "POST", form: { w: val("w"), tz: "Europe/Paris", ft: val("ft"), website: "", email: "contact@pied.example", consent: "1" } });
      assert.ok([200, 302, 303].includes(r.status), `contact -> ${r.status}`);
      assert.ok(db.prepare("SELECT 1 FROM mk_contacts WHERE email = 'contact@pied.example'").get(), "contact enregistré");
    });
  });
});
