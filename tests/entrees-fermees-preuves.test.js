// R8 — preuves de l'inventaire des entrées FERMÉES (« Bientôt ») du menu d'un site : décompte exact, état fidèle (grisée, sans lien), aucune adresse directe qui prétende fonctionner (espace du site ni adresse centrale pour un compte limité),
// permission du registre. Réécrit l'inventaire en JSON si INVENTAIRE_SORTIE est défini (pour le rapport). Vrais serveurs, comptes réels, base jetable.
const fs = require("node:fs");
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor, newStudent } = require("./helpers");
const nav = require("../src/marketing/web/cmsNav");

describe("entrées fermées du menu d'un site : preuves", () => {
  let srv, boss, adminA, A, db;
  const SP = "/marketing/site-web/sites";
  const space = () => ({ siteId: A, principal: false, base: `${SP}/${A}`, name: "S", listHref: `${nav.BASE}/sites`, limited: false });
  const closed = () => nav.projectSections(space()).flatMap((g) => g.items.map((i) => ({ group: g.label, ...i }))).filter((i) => i.disabled && nav.ALL.some((r) => r.key === i.key));
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db();
    A = Number(String((await boss.post(SP, { name: "Alpha Preuves" })).location).match(/sites\/(\d+)/)[1]);
    adminA = await newStudent(srv); db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, (SELECT id FROM users WHERE email = ?), 'admin')").run(A, adminA.email);
  });
  after(() => { db.close(); return srv.stop(); });

  test("décompte exact : 2 entrées fermées sur 79 du registre, par groupe", () => {
    const list = closed(); const by = {}; for (const i of list) by[i.group] = (by[i.group] || 0) + 1;
    assert.equal(list.length, 2);
    assert.deepEqual(by, { Redirections: 2 });
    assert.equal(nav.projectSections(space()).flatMap((g) => g.items).filter((i) => nav.ALL.some((r) => r.key === i.key)).length, 79); // 75 + 4 écrans SEO du lot 2 (liens internes, positions, Google, export/import)
  });
  test("chaque entrée fermée : grisée « Bientôt » sans lien dans le menu rendu (équipe et administrateur du site), avec la permission du registre ; aucune adresse directe ne prétend fonctionner", async () => {
    const inventory = [];
    const pages = { team: (await boss.get(`${SP}/${A}/tableau-de-bord`)).text, admin: (await adminA.get(`${SP}/${A}/tableau-de-bord`)).text };
    const labelCount = {}; for (const i of closed()) labelCount[i.label] = (labelCount[i.label] || 0) + 1;
    for (const [who, html] of Object.entries(pages)) for (const [label, n] of Object.entries(labelCount)) {
      const esc = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      assert.equal((html.match(new RegExp(`<span class="mk-nav-sublink is-soon" aria-disabled="true" title="${esc} \\(bientôt\\)"`, "g")) || []).length, n, `${who} : « ${label} » grisée ×${n}`);
    }
    for (const e of closed()) {
      const reg = nav.ALL.find((r) => r.key === e.key);
      assert.equal(e.href, null, e.key); assert.equal(e.status, "preview", e.key); assert.ok(e.phase, `${e.key} : lot annoncé`); assert.equal(e.permission, reg.permission, `${e.key} : permission du registre`);
      // Un mot qui est aussi l'adresse d'un module OUVERT (ex. « importer » = import de contacts, « seo », « commentaires », « medias ») désigne cet autre module : exclu des adresses candidates
      const openModules = new Set(Object.entries(nav.SITE_MODULES).filter(([, m]) => m.kind !== "soon").map(([k]) => k).concat(["tableau-de-bord"]));
      const seg = e.key.split("/").pop(), slugs = [...new Set([seg, e.key.replace(/\//g, "-")])].filter((x) => !openModules.has(x));
      const direct = [];
      for (const [who, c] of [["équipe", boss], ["admin", adminA]]) for (const s of slugs) {
        const r = await c.get(`${SP}/${A}/${s}`); const main = (r.text.match(/<main[\s\S]*<\/main>/) || [""])[0];
        const faithful = [403, 404].includes(r.status) || (r.status === 200 && /Prochain palier/.test(r.text) && !/<table|<form|<button(?![^>]*disabled)/.test(main));
        assert.ok(faithful, `${e.key} : ${who} ${SP}/${A}/${s} → ${r.status}`); direct.push(`${who}:${s}:${r.status}`);
      }
      const central = await adminA.get(reg.href); // adresse centrale (administration de l'organisation) : jamais ouverte à un compte limité à un site
      assert.notEqual(central.status, 200, `${e.key} : adresse centrale ${reg.href} refusée à un compte limité (${central.status})`);
      inventory.push({ group: e.group, key: e.key, label: e.label, phase: e.phase, permission: e.permission, centrale: reg.href, adminSite: central.status, directes: direct });
    }
    if (process.env.INVENTAIRE_SORTIE) fs.writeFileSync(process.env.INVENTAIRE_SORTIE, JSON.stringify(inventory, null, 1));
    assert.equal(inventory.length, 2);
  });
});
