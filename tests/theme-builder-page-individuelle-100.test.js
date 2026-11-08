// Theme Builder · catégorie « Page individuelle » : 100 modèles de pages réellement distincts, valides, sans donnée inventée, utilisables (copie indépendante), aperçus fidèles, isolés par site.
// Partie 1 (sans serveur) : le catalogue lui-même. Partie 2 (vrai serveur) : bibliothèque → « Utiliser » → éditeur/aperçu → publication → site public → isolation.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");
const Catalog = require("../src/themeBuilder/catalog");
const { normalizeSections, newSectionId } = require("../src/marketing/pages/sections");

const TYPE = "single_page";
const entries = Catalog.entries(TYPE);
const docOf = (key) => Catalog.build(TYPE, key, {});
const walk = (n, f) => { f(n); (n.children || []).forEach((c) => walk(c, f)); };
const nodesOf = (doc) => { const out = []; doc.sections.forEach((s) => walk(s, (n) => out.push(n))); return out; };
// Signature de structure : types, gabarits de grille, familles de boutons ; deux modèles qui ne diffèrent que par leurs couleurs auraient la même.
const sig = (n) => `${n.type}${n.props && n.props.full ? "F" : ""}${n.props && n.props.band ? "B" : ""}${n.styles && n.styles.desktop && n.styles.desktop.gridTemplate ? "[" + n.styles.desktop.gridTemplate + "]" : ""}${n.styles && n.styles.desktop && n.styles.desktop.columns ? "#" + n.styles.desktop.columns : ""}${n.type === "widget" || n.type === "button" ? ":" + (n.props && n.props.variant) : ""}${n.children ? "(" + n.children.map(sig).join(",") + ")" : ""}`;

describe("Page individuelle · le catalogue", () => {
  test("exactement 100 modèles, tous du type single_page, clés et noms uniques, sans reste de l'ancienne bibliothèque", () => {
    assert.equal(entries.length, 100);
    assert.equal(new Set(entries.map((e) => e.key)).size, 100);
    assert.equal(new Set(entries.map((e) => e.name)).size, 100, "deux modèles portent le même nom");
    assert.ok(entries.every((e) => e.type === TYPE && e.name && e.desc && e.tags.length >= 2));
    // l'ancien catalogue (20 mises en page × 5 identités) avait des clés « classique.clair », « heros.nuit »… : aucune ne subsiste
    for (const old of ["classique.clair", "etroit.clair", "heros.nuit", "a-propos.doux", "faq.editorial", "minimal.marque"]) assert.equal(Catalog.find(TYPE, old), null, old);
    assert.equal(Catalog.build(TYPE, "classique.clair", {}), null);
    assert.equal(Catalog.stats().find((s) => s.type === TYPE).count, 100);
  });
  test("15 familles de pages (accueil, à propos, services, contact, vente, portfolio, institutionnel, éducation, communauté, tarifs, aide, événements, local, personnelles, créatif)", () => {
    const by = {}; for (const e of entries) { const f = e.layoutKey.split("-")[0]; (by[f] = by[f] || []).push(e); }
    const expected = { accueil: 7, apropos: 7, services: 7, contact: 7, vente: 7, portfolio: 7, institution: 6, education: 6, communaute: 6, tarifs: 7, aide: 6, evenement: 7, local: 7, perso: 6, creatif: 7 };
    assert.deepEqual(Object.fromEntries(Object.entries(by).map(([f, r]) => [f, r.length])), expected);
  });
  test("100 compositions différentes : aucune paire de modèles n'a la même structure (pas seulement une autre couleur)", () => {
    const seen = new Map();
    for (const e of entries) {
      const s = docOf(e.key).sections.map(sig).join("|");
      assert.ok(!seen.has(s), `${e.key} a la même structure que ${seen.get(s)}`);
      seen.set(s, e.key);
    }
    assert.equal(seen.size, 100);
  });
  test("chaque modèle garde le titre de la page ({{post.title}} en H1) et son contenu (postcontent), et reste une page : ni article, ni archive", () => {
    for (const e of entries) {
      const nodes = nodesOf(docOf(e.key));
      const h1 = nodes.filter((n) => n.type === "heading" && n.props.level === "1");
      assert.equal(h1.length, 1, `${e.key} : un seul H1`); assert.equal(h1[0].props.text, "{{post.title}}", e.key);
      assert.ok(nodes.some((n) => n.type === "postcontent"), `${e.key} : contenu de la page`);
      for (const n of nodes) {
        assert.ok(!["posts", "postmeta", "postnav", "postcomments", "archiveinfo", "shopgrid", "shopbuy"].includes(n.type), `${e.key} : ${n.type} n'a pas sa place dans une page`);
        
      }
    }
  });
  test("aucune donnée inventée : prix, noms, citations, adresses et dates sont des consignes entre crochets", () => {
    for (const e of entries) {
      for (const n of nodesOf(docOf(e.key))) {
        const pr = n.props || {};
        if (n.type === "pricing") { assert.match(pr.price, /^\[/, `${e.key} prix`); pr.features.forEach((f) => assert.match(f, /^\[/)); }
        if (n.type === "testimonial") { assert.match(pr.name, /^\[/, `${e.key} nom`); assert.match(pr.text, /^\[/, `${e.key} citation`); }
        if (n.type === "profilecard") { assert.match(pr.name, /^\[/, `${e.key} membre`); assert.match(pr.bio, /^\[/); }
        if (n.type === "map") assert.match(pr.address, /^\[/, `${e.key} adresse`);
        if (n.type === "accordion") pr.items.forEach((i) => { assert.match(i.q, /^\[/); assert.match(i.a, /^\[/); });
        if (n.type === "image") assert.match(pr.src, /^\{\{post\.image\}\}$/, `${e.key} : image factice`);
      }
      const json = JSON.stringify(nodesOf(docOf(e.key)).map((n) => n.props || {})); // textes et réglages seulement (les styles ont des « 100% »)
      assert.doesNotMatch(json, /€|\$\d|\d{2}\s?%|@[a-z0-9-]+\.[a-z]{2,}|\+33|https?:\/\/(?!www\.(facebook|linkedin)\.com\/)/i, `${e.key} : chiffre, e-mail, téléphone ou lien inventé`);
    }
  });
  test("mise en page robuste : aucun positionnement absolu ni largeur en pixels sur les colonnes, grilles repliées en tablette (≤ 2) et mobile (1)", () => {
    for (const e of entries) {
      for (const n of nodesOf(docOf(e.key))) {
        const d = (n.styles && n.styles.desktop) || {};
        assert.ok(!/absolute|fixed/.test(String(d.position || "")), `${e.key} : position ${d.position}`);
        if (n.type === "grid") {
          const t = n.styles.tablet || {}, m = n.styles.mobile || {};
          assert.ok(Number(t.columns) <= 2, `${e.key} : grille tablette`); assert.equal(Number(m.columns), 1, `${e.key} : grille mobile`);
        }
        if (d.width) assert.match(String(d.width), /%$/, `${e.key} : largeur ${d.width}`);
      }
    }
  });
  test("chaque modèle est accepté par la grammaire du Page Builder (mêmes contrôles que la sauvegarde) ; tous les composants sont natifs et éditables", () => {
    const ctx = { organizationId: 1, db: { prepare: () => ({ get: () => null, all: () => [] }) } };
    const used = new Set();
    for (const e of entries) {
      const doc = docOf(e.key);
      assert.doesNotThrow(() => normalizeSections(ctx, doc.sections.map((s, i) => ({ ...s, id: newSectionId() }))), e.key);
      nodesOf(doc).forEach((n) => used.add(n.type));
      assert.ok(doc.sections.every((sec) => (sec.children || []).every((c) => { let ok = true; walk(c, (n) => { if (!n.id) ok = false; }); return ok; })), `${e.key} : identifiants`);
    }
    for (const t of ["heading", "text", "button", "postcontent", "grid", "iconbox", "accordion", "tabs", "timeline", "pricing", "testimonial", "profilecard", "signupform", "toc", "map", "table", "alert", "countdown"]) {
      if (t === "signupform") continue; // proposé seulement quand le site a un vrai formulaire (testé plus bas)
      assert.ok(used.has(t), `composant jamais utilisé : ${t}`);
    }
  });
  test("recherche et filtres du catalogue : par famille, par mot, par identité ; liste sans documents", () => {
    assert.equal(Catalog.list(TYPE, { tag: "tarifs", limit: 60 }).total, entries.filter((e) => e.tags.includes("tarifs")).length); assert.ok(entries.filter((e) => e.tags.includes("tarifs")).length >= 6);
    assert.equal(Catalog.list(TYPE, { q: "faq", limit: 60 }).total, Catalog.list(TYPE, { q: "FAQ", limit: 60 }).total);
    assert.ok(Catalog.list(TYPE, { q: "contact", limit: 60 }).total >= 7);
    const all = []; for (let p = 1; p <= 5; p++) all.push(...Catalog.list(TYPE, { page: p, limit: 24 }).items);
    assert.equal(all.length, 100); assert.ok(all.every((i) => !("sections" in i)));
    const skins = Catalog.list(TYPE, {}).skins; assert.ok(skins.length >= 50, "chaque modèle porte sa propre identité");
  });
  test("avec un vrai formulaire sur le site, les pages d'inscription et de contact l'utilisent ; sans formulaire, aucune fausse saisie", () => {
    const withForm = entries.filter((e) => nodesOf(Catalog.build(TYPE, e.key, { formId: 7 })).some((n) => n.type === "signupform"));
    const without = entries.filter((e) => nodesOf(docOf(e.key)).some((n) => n.type === "signupform"));
    assert.ok(withForm.length >= 10, `${withForm.length} modèles à formulaire`); assert.equal(without.length, 0);
    for (const e of withForm) assert.ok(nodesOf(Catalog.build(TYPE, e.key, { formId: 7 })).filter((n) => n.type === "signupform").every((n) => n.props.formId === 7));
  });
});

const hostReq = (srv, host, path) => {
  const u = new URL(srv.base);
  return new Promise((resolve, reject) => {
    const r = http.request({ host: u.hostname, port: u.port, path, method: "GET", headers: { Host: host, "User-Agent": "Mozilla/5.0 Chrome/120 Safari/537.36" } }, (resp) => {
      let text = ""; resp.on("data", (d) => (text += d)); resp.on("end", () => resolve({ status: resp.statusCode, text, headers: resp.headers }));
    });
    r.on("error", reject); r.end();
  });
};

describe("Page individuelle · de la bibliothèque au site public (vrai serveur)", () => {
  let srv, boss, db, org, A, B;
  const ORIGIN = () => ({ Origin: srv.base });
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const U = (s, p = "") => `/marketing/site-web/sites/${s}/constructeur-de-theme${p}`;
  const post = (path, body) => boss.request(path, { method: "POST", json: body || {}, headers: ORIGIN() });
  const mkSite = (name, slug) => Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, ?, ?, '{}')").run(org, name, slug).lastInsertRowid);
  const setDomain = async (site, url) => {
    const cur = JSON.parse((await boss.get(`/marketing/site-web/sites/${site}/reglages.json`)).text);
    return boss.request(`/marketing/site-web/sites/${site}/reglages.json`, { method: "PUT", json: { settings: { ...cur.settings, seo: { ...cur.settings.seo, publicUrl: url } }, revision: cur.revision }, headers: ORIGIN() });
  };
  const use = async (site, key, extra = {}) => { const u = await post(U(site, "/api/bibliotheque/utiliser"), { type: TYPE, key, ...extra }); assert.equal(u.status, 200, `${key} : ${u.text.slice(0, 300)}`); return JSON.parse(u.text).template; };

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db(); org = one("SELECT id FROM mk_organizations").id;
    A = mkSite("Site A", "site-a"); B = mkSite("Site B", "site-b");
    assert.equal((await setDomain(A, "https://a.test")).status, 200); assert.equal((await setDomain(B, "https://b.test")).status, 200);
  });
  after(async () => { if (db) db.close(); if (srv) await srv.stop(); });

  test("API : 100 modèles de page, pagination, filtres, miniature et aperçu fiables pour chaque famille", async () => {
    const l = JSON.parse((await boss.get(U(A, `/api/bibliotheque?type=${TYPE}&limite=24&page=5`))).text);
    assert.equal(l.total, 100); assert.equal(l.items.length, 4); assert.ok(!("sections" in l.items[0]));
    assert.equal(JSON.parse((await boss.get(U(A, `/api/bibliotheque?type=${TYPE}&etiquette=tarifs&limite=60`))).text).total, entries.filter((e) => e.tags.includes("tarifs")).length);
    const types = JSON.parse((await boss.get(U(A, "/api/bibliotheque"))).text).types; assert.equal(types.find((t) => t.type === TYPE).count, 100);
    for (const fam of ["accueil", "apropos", "services", "contact", "vente", "portfolio", "institution", "education", "communaute", "tarifs", "aide", "evenement", "local", "perso", "creatif"]) {
      const key = entries.find((e) => e.layoutKey.split("-")[0] === fam).key;
      const th = await boss.get(U(A, `/api/bibliotheque/${TYPE}/${key}/miniature`)); assert.equal(th.status, 200); assert.match(th.text, /<svg/);
      const ap = await boss.get(U(A, `/api/bibliotheque/${TYPE}/${key}/apercu`)); assert.equal(ap.status, 200, key); assert.match(ap.text, /<!doctype html>/i); assert.match(ap.text, /kw-theme-template/);
      const vg = await boss.get(U(A, `/api/bibliotheque/${TYPE}/${key}/vignette`)); assert.equal(vg.status, 200, `${key} vignette`);
    }
    assert.equal((await boss.get(U(A, `/api/bibliotheque/${TYPE}/classique.clair/apercu`))).status, 404, "ancien modèle introuvable");
  });
  test("« Utiliser » les 100 modèles : 100 copies distinctes, chacune avec son propre document ; le catalogue n'est jamais modifié", async () => {
    const before = JSON.stringify(entries.map((e) => docOf(e.key)));
    const made = [];
    for (const e of entries) { const t = await use(A, e.key); made.push({ key: e.key, t }); }
    assert.equal(new Set(made.map((m) => m.t.id)).size, 100); assert.equal(new Set(made.map((m) => m.t.sourceId)).size, 100, "deux modèles partagent le même document");
    // la page créée contient le contenu de CE modèle (et pas celui d'un autre)
    for (const m of made.filter((_, i) => i % 7 === 0)) {
      const row = one("SELECT sections FROM mk_landing_pages WHERE id = ?", m.t.sourceId);
      const got = JSON.parse(row.sections); const expected = docOf(m.key).sections;
      assert.equal(got.length, expected.length); assert.equal(JSON.stringify(got).includes("{{post.title}}"), true);
      assert.equal(nodesOf({ sections: got }).filter((n) => n.type === "postcontent").length, 1, m.key);
      assert.equal(sig(got[0]).replace(/\s/g, "").length > 0, true);
    }
    assert.equal(JSON.stringify(entries.map((e) => docOf(e.key))), before, "le catalogue a changé");
    for (const m of made) db.prepare("UPDATE mk_tb_templates SET status = 'archived' WHERE id = ?").run(m.t.id);
  });
  test("aperçu de la bibliothèque = vignette de la copie ; une modification de la copie ne touche ni le catalogue ni un autre modèle", async () => {
    const e1 = entries[3], e2 = entries[57];
    const t1 = await use(A, e1.key), t2 = await use(A, e2.key);
    const lib = await boss.get(U(A, `/api/bibliotheque/${TYPE}/${e1.key}/apercu`)); assert.equal(lib.status, 200);
    const vg = await boss.get(U(A, `/api/modeles/${t1.id}/vignette`)); assert.equal(vg.status, 200);
    const heads = (h) => [...h.matchAll(/<h[123][^>]*>([^<]*)</g)].map((m) => m[1].trim()).join("|");
    assert.ok(heads(lib.text).length > 10); assert.equal(heads(vg.text), heads(lib.text), "vignette et aperçu de la bibliothèque rendent le même document");
    const before2 = one("SELECT sections FROM mk_landing_pages WHERE id = ?", t2.sourceId).sections;
    db.prepare("UPDATE mk_landing_pages SET sections = ? WHERE id = ?").run(JSON.stringify([]), t1.sourceId);
    assert.equal(one("SELECT sections FROM mk_landing_pages WHERE id = ?", t2.sourceId).sections, before2, "un autre modèle a changé");
    assert.equal(JSON.stringify(docOf(e1.key)).includes("{{post.title}}"), true, "catalogue intact");
  });
  const mkPage = (site, slug, title, text) => Number(db.prepare("INSERT INTO mk_landing_pages (organization_id, name, slug, title, status, site_id, published_at, kind, indexable, sections) VALUES (?, ?, ?, ?, 'published', ?, datetime('now'), 'page', 1, ?)").run(org, title, slug, title, site, JSON.stringify([{ id: "abcdef012345", type: "layout", children: [{ id: "abcdef012346", type: "text", props: { html: `<p>${text}</p>` } }] }])).lastInsertRowid);
  test("publication → site public : une page du site prend le modèle (titre de la page, son propre contenu, texte du modèle) ; un brouillon ne s'applique jamais", async () => {
    mkPage(A, "notre-histoire", "Contact A", "CORPS-PROPRE-DE-LA-PAGE-A"); mkPage(B, "notre-histoire-b", "Contact B", "CORPS-PROPRE-DE-LA-PAGE-B");
    const t = await use(A, entries.find((e) => e.layoutId === "apropos-histoire").key);
    let r = await hostReq(srv, "a.test", "/notre-histoire"); assert.equal(r.status, 200);
    assert.match(r.text, /CORPS-PROPRE-DE-LA-PAGE-A/); assert.doesNotMatch(r.text, /Notre parcours/, "un brouillon s'applique");
    const pub = await post(U(A, `/api/modeles/${t.id}/publier`)); assert.equal(pub.status, 200, pub.text.slice(0, 300));
    r = await hostReq(srv, "a.test", "/notre-histoire"); assert.equal(r.status, 200);
    assert.match(r.text, /Notre parcours/, "le modèle publié n'est pas appliqué"); assert.match(r.text, /CORPS-PROPRE-DE-LA-PAGE-A/, "le contenu de la page a disparu");
    assert.match(r.text, /<h1[^>]*>\s*Contact A\s*</, "le titre de la page n'est pas celui de la page"); assert.equal((r.text.match(/<h1\b/g) || []).length, 1, "un seul H1");
    assert.ok(r.text.indexOf("Notre parcours") > r.text.indexOf("CORPS-PROPRE-DE-LA-PAGE-A"), "le contenu précède le bloc « mission » du modèle");
  });
  test("conditions : une page exclue garde son rendu historique ; dépublier le modèle rend la page d'origine", async () => {
    const t = one("SELECT id, revision FROM mk_tb_templates WHERE site_id = ? AND type = 'single_page' AND status = 'published'", A);
    const pageId = one("SELECT id FROM mk_landing_pages WHERE site_id = ? AND slug = 'notre-histoire'", A).id;
    const c = await post(U(A, `/api/modeles/${t.id}/conditions`), { conditions: { include: [{ kind: "page" }], exclude: [{ kind: "page", ids: [pageId] }] }, revision: t.revision });
    assert.equal(c.status, 200, c.text.slice(0, 200));
    let r = await hostReq(srv, "a.test", "/notre-histoire"); assert.doesNotMatch(r.text, /Notre parcours/, "page exclue"); assert.match(r.text, /CORPS-PROPRE-DE-LA-PAGE-A/);
    const c2 = await post(U(A, `/api/modeles/${t.id}/conditions`), { conditions: { include: [{ kind: "page" }] }, revision: t.revision + 1 }); assert.equal(c2.status, 200, c2.text.slice(0, 200));
    r = await hostReq(srv, "a.test", "/notre-histoire"); assert.match(r.text, /Notre parcours/);
    assert.equal((await post(U(A, `/api/modeles/${t.id}/depublier`))).status, 200);
    r = await hostReq(srv, "a.test", "/notre-histoire"); assert.doesNotMatch(r.text, /Notre parcours/, "dépublié"); assert.match(r.text, /CORPS-PROPRE-DE-LA-PAGE-A/);
  });
  test("isolation : le modèle publié sur le site A n'apparaît jamais sur le site B ; sa copie est introuvable depuis B", async () => {
    const t = await use(A, entries.find((e) => e.layoutId === "apropos-histoire").key);
    assert.equal((await post(U(A, `/api/modeles/${t.id}/publier`))).status, 200);
    const b = await hostReq(srv, "b.test", "/notre-histoire-b"); assert.equal(b.status, 200); assert.match(b.text, /CORPS-PROPRE-DE-LA-PAGE-B/); assert.doesNotMatch(b.text, /Notre parcours/);
    const cross = await boss.get(U(B, `/api/modeles/${t.id}/vignette`)); assert.ok([403, 404].includes(cross.status), `${cross.status}`);
    assert.equal(one("SELECT COUNT(*) n FROM mk_tb_templates WHERE site_id = ? AND type = 'single_page'", B).n, 0);
  });
  test("avec un formulaire réel sur le site, « Utiliser » intègre ce formulaire (et lui seul)", async () => {
    const formId = Number(db.prepare("INSERT INTO mk_forms (organization_id, name, slug, site_id, consent_text) VALUES (?, 'Contact A', 'contact-a', ?, 'ok')").run(org, A).lastInsertRowid);
    const key = entries.find((e) => e.layoutId === "contact-corporate").key;
    const t = await use(A, key);
    const secs = JSON.parse(one("SELECT sections FROM mk_landing_pages WHERE id = ?", t.sourceId).sections);
    const f = nodesOf({ sections: secs }).filter((n) => n.type === "signupform"); assert.equal(f.length, 1); assert.equal(f[0].props.formId, formId);
    const tb = await use(B, key);
    const fb = nodesOf({ sections: JSON.parse(one("SELECT sections FROM mk_landing_pages WHERE id = ?", tb.sourceId).sections) }).filter((n) => n.type === "signupform");
    assert.equal(fb.filter((n) => n.props.formId === formId).length, 0, "le formulaire du site A ne doit pas fuiter sur B");
  });
});
