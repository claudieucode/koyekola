// R8 lot 3 — MATRICE des droits de l'espace CMS d'un site : rôles × actions, sur un vrai serveur. Chaque case dit si l'action est PERMISE (ok) ou REFUSÉE (non), et vérifie l'EFFET en base pour les écritures
// (une action refusée ne laisse aucune trace ; une action permise agit sur le site de l'adresse seulement). Classement « réseau » (équipe de l'organisation seulement) ou « site » (selon le rôle sur le site).
const zlib = require("node:zlib");
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, Client, loginInstructor, newStudent } = require("./helpers");

const ROLES = ["equipe", "equipeLecteur", "adminSite", "editeurSite", "lecteurSite", "autreSite", "sansAcces", "anonyme"];
// action → { portee, ok: rôles autorisés }  (portee : "reseau" = relève de l'équipe de l'organisation ; "site" = relève du rôle sur le site)
const MATRICE = {
  "voir le tableau de bord du site":        { portee: "site",   ok: ["equipe", "equipeLecteur", "adminSite", "editeurSite", "lecteurSite"] },
  "lire les articles":                       { portee: "site",   ok: ["equipe", "equipeLecteur", "adminSite", "editeurSite", "lecteurSite"] },
  "créer un article":                        { portee: "site",   ok: ["equipe", "adminSite", "editeurSite"] },
  "lire les médias":                         { portee: "site",   ok: ["equipe", "equipeLecteur", "adminSite", "editeurSite", "lecteurSite"] },
  "téléverser un média":                     { portee: "site",   ok: ["equipe", "adminSite", "editeurSite"] },
  "lire les commentaires":                   { portee: "site",   ok: ["equipe", "equipeLecteur", "adminSite", "editeurSite", "lecteurSite"] },
  "lire les contacts":                       { portee: "site",   ok: ["equipe", "equipeLecteur", "adminSite", "editeurSite", "lecteurSite"] },
  "modifier un contact du site":             { portee: "site",   ok: ["equipe", "adminSite", "editeurSite"] },
  "lire les formulaires":                    { portee: "site",   ok: ["equipe", "equipeLecteur", "adminSite", "editeurSite", "lecteurSite"] },
  "créer un formulaire":                     { portee: "site",   ok: ["equipe", "adminSite", "editeurSite"] },
  "activer un module du site":               { portee: "reseau", ok: ["equipe"] },
  "autoriser un réseau social au site":      { portee: "reseau", ok: ["equipe"] },
  "créer un site":                           { portee: "reseau", ok: ["equipe"] },
  "archiver le site":                        { portee: "reseau", ok: ["equipe"] },
  "ouvrir le site principal":                { portee: "reseau", ok: ["equipe", "equipeLecteur"] },
  "régler les règles de score":              { portee: "reseau", ok: ["equipe"] },
};
const OPEN_STATUS = (s) => s < 400 && s !== 0;

describe("matrice des droits : rôles × actions de l'espace CMS d'un site", () => {
  let srv, boss, db, A, B, clients = {}, ids = {};
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const idOf = (c) => one("SELECT id FROM users WHERE email = ?", c.email).id;
  const SP = "/marketing/site-web/sites", M = "/marketing";
  const png = (() => { const table = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; }); const crc = (buf) => { let c = 0xffffffff; for (const b of buf) c = table[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; }; const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([len, td, c]); }; return (n) => { const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(4, 0); ihdr.writeUInt32BE(4, 4); ihdr[8] = 8; ihdr[9] = 2; const raw = Buffer.alloc((4 * 3 + 1) * 4); for (let i = 0; i < raw.length; i++) raw[i] = i % 13 === 0 ? 0 : (n * 37 + i) & 255; return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]); }; })();
  let seq = 0;
  // Chaque action renvoie { status, effect } : effect = changement constaté en base (nombre de lignes créées / valeur modifiée) pour l'espace de A
  const ACTIONS = {
    "voir le tableau de bord du site": async (c) => ({ status: (await c.get(`${SP}/${A}/tableau-de-bord`)).status, effect: 0 }),
    "lire les articles": async (c) => ({ status: (await c.get(`${SP}/${A}/articles`)).status, effect: 0 }),
    "créer un article": async (c) => { const n = () => one("SELECT COUNT(*) n FROM mk_content_sites WHERE content_type = 'post' AND site_id = ?", A).n; const b = n(); const r = await c.post(`${M}/site-web/articles?site=${A}`, { site: A, title: `Brouillon ${++seq}` }); return { status: r.status, effect: n() - b }; },
    "lire les médias": async (c) => ({ status: (await c.get(`${SP}/${A}/medias`)).status, effect: 0 }),
    "téléverser un média": async (c) => { const n = () => one("SELECT COUNT(*) n FROM mk_media WHERE site_id = ?", A).n; const b = n(); const fd = new FormData(); fd.append("file", new Blob([png(++seq)], { type: "image/png" }), `m${seq}.png`); const r = await c.request(`${M}/site-web/mediatheque/televerser?site=${A}`, { method: "POST", multipart: fd }); return { status: r.status, effect: n() - b }; },
    "lire les commentaires": async (c) => ({ status: (await c.get(`${SP}/${A}/commentaires`)).status, effect: 0 }),
    "lire les contacts": async (c) => ({ status: (await c.get(`${SP}/${A}/contacts`)).status, effect: 0 }),
    "modifier un contact du site": async (c) => { const v = `Nom${++seq}`; const r = await c.post(`${M}/contacts/${ids.contact}?site=${A}`, { site: A, first_name: v }); return { status: r.status, effect: one("SELECT first_name f FROM mk_contacts WHERE id = ?", ids.contact).f === v ? 1 : 0 }; },
    "lire les formulaires": async (c) => ({ status: (await c.get(`${SP}/${A}/formulaires`)).status, effect: 0 }),
    "créer un formulaire": async (c) => { const n = () => one("SELECT COUNT(*) n FROM mk_forms WHERE site_id = ?", A).n; const b = n(); const r = await c.post(`${M}/formulaires?site=${A}`, { site: A, name: `Formulaire ${++seq}`, consentText: "oui" }); return { status: r.status, effect: n() - b }; },
    "activer un module du site": async (c) => { const on = () => one("SELECT enabled e FROM mk_site_modules WHERE site_id = ? AND module = 'sms'", A)?.e ?? 0; db.prepare("DELETE FROM mk_site_modules WHERE site_id = ? AND module = 'sms'").run(A); const r = await c.post(`${SP}/${A}/modules/sms`, { etat: "activer" }); const e = on(); db.prepare("DELETE FROM mk_site_modules WHERE site_id = ? AND module = 'sms'").run(A); return { status: r.status, effect: e }; },
    "autoriser un réseau social au site": async (c) => { const n = () => one("SELECT COUNT(*) n FROM mk_social_site_grants WHERE site_id = ?", A).n; db.prepare("DELETE FROM mk_social_site_grants WHERE site_id = ?").run(A); const r = await c.post(`${M}/reseaux/reglages/sites`, { site_id: A, networks: "facebook" }); const e = n(); db.prepare("DELETE FROM mk_social_site_grants WHERE site_id = ?").run(A); return { status: r.status, effect: e }; },
    "créer un site": async (c) => { const n = () => one("SELECT COUNT(*) n FROM mk_sites").n; const b = n(); const r = await c.post(SP, { name: `Site matrice ${++seq}` }); return { status: r.status, effect: n() - b }; },
    "archiver le site": async (c) => { const t = Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (1, ?, ?, '{}')").run(`Cible ${++seq}`, `cible-${seq}`).lastInsertRowid); const r = await c.post(`${SP}/${t}/archiver`, {}); const e = one("SELECT status s FROM mk_sites WHERE id = ?", t).s === "archived" ? 1 : 0; return { status: r.status, effect: e }; },
    "ouvrir le site principal": async (c) => ({ status: (await c.get(`${SP.replace("/sites", "")}/principal/tableau-de-bord`)).status, effect: 0 }),
    "régler les règles de score": async (c) => { const n = () => one("SELECT COUNT(*) n FROM mk_score_rules").n; const b = n(); const r = await c.post(`${M}/score/regles`, { event: "page.visited", points: "5", max_times: "", site: A }); return { status: r.status, effect: n() - b }; },
  };

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db();
    const mk = async (name) => Number(String((await boss.post(SP, { name })).location).match(/sites\/(\d+)/)[1]);
    A = await mk("Alpha Matrice"); B = await mk("Bravo Matrice");
    const person = async (siteId, role, orgRole) => { const c = await newStudent(srv); if (orgRole) db.prepare("INSERT INTO mk_org_members (organization_id, user_id, role) VALUES (1, ?, ?)").run(idOf(c), orgRole); if (siteId) db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, ?)").run(siteId, idOf(c), role); return c; };
    clients = { equipe: boss, equipeLecteur: await person(null, null, "viewer"), adminSite: await person(A, "admin"), editeurSite: await person(A, "editor"), lecteurSite: await person(A, "viewer"), autreSite: await person(B, "admin"), sansAcces: await newStudent(srv), anonyme: new Client(srv.base) };
    ids.contact = Number(db.prepare("INSERT INTO mk_contacts (organization_id, email, first_name, origin_site_id) VALUES (1, 'matrice@ex.cd', 'Avant', ?)").run(A).lastInsertRowid);
  });
  after(() => { db.close(); return srv.stop(); });

  for (const [action, def] of Object.entries(MATRICE)) {
    test(`${def.portee === "reseau" ? "[réseau]" : "[site]"} ${action} : permis seulement à ${def.ok.join(", ")}`, async () => {
      for (const role of ROLES) {
        const r = await ACTIONS[action](clients[role]);
        const allowed = def.ok.includes(role);
        const writes = /^(créer|téléverser|modifier|activer|autoriser|archiver|régler)/.test(action);
        if (allowed) { assert.ok(OPEN_STATUS(r.status), `${role} : ${action} devrait être permis (statut ${r.status})`); if (writes) assert.ok(r.effect > 0, `${role} : ${action} devrait avoir un effet`); }
        else { assert.ok(!writes ? !(r.status === 200) : true, `${role} : ${action} ne doit pas répondre 200 (statut ${r.status})`); if (writes) assert.equal(r.effect > 0, false, `${role} : ${action} refusé ne doit laisser aucune trace`); }
      }
    });
  }
  test("la matrice classe chaque action « réseau » ou « site » et couvre les 8 rôles demandés (équipe, lecteur d'équipe, administrateur, éditeur, lecteur, autre site, sans accès, anonyme)", () => {
    assert.equal(ROLES.length, 8); for (const [a, d] of Object.entries(MATRICE)) { assert.ok(["reseau", "site"].includes(d.portee), a); assert.ok(d.ok.every((r) => ROLES.includes(r)), a); assert.ok(a in ACTIONS, a); }
    assert.ok(Object.values(MATRICE).filter((d) => d.portee === "reseau").length >= 5 && Object.values(MATRICE).filter((d) => d.portee === "site").length >= 10);
  });
});
