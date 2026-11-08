// Header Builder, lot L6 — de bout en bout sur le SITE PUBLIÉ : un en-tête pour les invités, un autre pour les membres (compte connecté), deux visiteurs réels.
// Ignoré si Playwright / Chrome sont absents (le même gabarit de test lance un serveur et un navigateur).
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { setup, SKIP } = require("./header-aides");
const { Client, newStudent } = require("./helpers");

const UA = { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 Chrome/120 Safari/537.36" };

describe("Header Builder L6 : en-tête selon le visiteur (site publié)", { skip: SKIP }, () => {
  let env, guestHeader, memberHeader;
  const headerOf = async (client) => { const html = (await client.get(`/p/${env.slug()}`, { headers: UA })).text; return (html.match(/<div class="[^"]*lp-site-header[^"]*"/) || [""])[0]; };
  const adopt = async (key) => { const r = await env.boss.request(env.U("/api/bibliotheque/utiliser"), { method: "POST", json: { type: "header", key }, headers: env.origin }); assert.equal(r.status, 200, r.text.slice(0, 200)); return JSON.parse(r.text).template; };
  const conditions = async (t, conds) => { const r = await env.boss.request(env.U(`/api/modeles/${t.id}/conditions`), { method: "POST", json: { conditions: conds, revision: t.revision }, headers: env.origin }); assert.equal(r.status, 200, r.text.slice(0, 300)); return JSON.parse(r.text).template || t; };
  const publish = async (t) => { const cur = JSON.parse((await env.boss.get(env.U("/api/modeles"))).text).templates.find((x) => x.id === t.id); const r = await env.boss.request(env.U(`/api/modeles/${t.id}/publier`), { method: "POST", json: { revision: cur.revision }, headers: env.origin }); assert.equal(r.status, 200, r.text.slice(0, 300)); };

  before(async () => {
    env = await setup({ siteName: "Site visiteurs" });
    guestHeader = await adopt("luxe-01.luxe-01");           // ordinaire
    memberHeader = await adopt("luxe-02.luxe-02");                   // collé : reconnaissable (kw-theme-sticky)
    guestHeader = await conditions(guestHeader, { include: [{ kind: "visitor", state: "out" }], exclude: [] });
    memberHeader = await conditions(memberHeader, { include: [{ kind: "visitor", state: "in" }], exclude: [] });
    await publish(guestHeader); await publish(memberHeader);
  });
  after(async () => { if (env) await env.close(); });

  test("un invité voit l'en-tête des invités, un membre connecté voit celui des membres", async () => {
    const guest = await headerOf(new Client(env.srv.base));
    assert.ok(guest, "un en-tête est affiché à l'invité"); assert.doesNotMatch(guest, /kw-theme-sticky/, "l'invité voit l'en-tête ordinaire");
    const student = await newStudent(env.srv);
    const member = await headerOf(student);
    assert.match(member, /kw-theme-sticky/, "le membre voit l'en-tête collé");
  });

  test("la page n'est jamais mise en cache partagé (un en-tête réservé aux membres ne peut pas être servi à un invité par un cache)", async () => {
    const r = await new Client(env.srv.base).get(`/p/${env.slug()}`, { headers: UA });
    const cc = String(r.headers.get("cache-control") || "");
    assert.doesNotMatch(cc, /\bpublic\b/, `Cache-Control : « ${cc} »`); assert.doesNotMatch(cc, /s-maxage/, `Cache-Control : « ${cc} »`);
  });

  test("les deux en-têtes publiés ensemble : aucun conflit bloquant (invités et membres ne se chevauchent pas)", async () => {
    const r = JSON.parse((await env.boss.get(env.U("/api/modeles"))).text);
    assert.deepEqual((r.conflicts || []).filter((c) => c.severity === "blocking" || c.kind === "ambiguous"), []);
  });

  test("« Pourquoi ce modèle ? » et la liste décrivent la condition en français", async () => {
    const list = JSON.parse((await env.boss.get(env.U("/api/modeles"))).text).templates;
    const g = list.find((t) => t.id === guestHeader.id), m = list.find((t) => t.id === memberHeader.id);
    assert.match(g.describe.include, /Visiteur non connecté/); assert.match(m.describe.include, /Visiteur connecté/);
  });
});
