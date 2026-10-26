// Vérification HTTP des liens d'un e-mail : états, redirections, garde SSRF à chaque saut, limites.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { collect, probe, checkLinks, MAX_URLS } = require("../src/marketing/templates/linkcheck");

const pub = async () => [{ address: "93.184.216.34", family: 4 }];
const reply = (table) => async (url, { method }) => { const r = table[`${method} ${url}`] || table[url]; if (!r) throw new Error("ECONNREFUSED"); return typeof r === "function" ? r() : r; };

describe("collect", () => {
  test("seules les adresses http(s) distinctes sont gardées", () => {
    const urls = collect([{ href: "https://a.fr/x" }, { href: "https://a.fr/x" }, { href: "mailto:a@b.fr" }, { href: "#haut" }, { href: "javascript:alert(1)" }, { href: "http://b.fr" }, { href: null }, {}]);
    assert.deepEqual(urls, ["https://a.fr/x", "http://b.fr/"]);
  });
});

describe("probe", () => {
  const run = (table, url = "https://a.fr/p") => probe(url, { lookup: pub, fetchImpl: reply(table) });
  test("200 : ok", async () => assert.equal((await run({ "https://a.fr/p": { status: 200 } })).state, "ok"));
  test("404 et 410 : erreur « introuvable »", async () => {
    assert.equal((await run({ "https://a.fr/p": { status: 404 } })).state, "error");
    assert.equal((await run({ "https://a.fr/p": { status: 410 } })).state, "error");
  });
  test("403, 429 et 5xx : à vérifier à la main, jamais « cassé »", async () => {
    for (const status of [401, 429, 500, 503]) assert.equal((await run({ "https://a.fr/p": { status } })).state, "warning", String(status));
  });
  test("HEAD refusé (405) : repli sur GET", async () => {
    const r = await run({ "HEAD https://a.fr/p": { status: 405 }, "GET https://a.fr/p": { status: 200 } });
    assert.equal(r.state, "ok");
  });
  test("redirection suivie jusqu'à la page finale, qui est indiquée", async () => {
    const r = await run({ "https://a.fr/p": { status: 301, location: "/final" }, "https://a.fr/final": { status: 200 } });
    assert.equal(r.state, "ok"); assert.equal(r.finalUrl, "https://a.fr/final");
  });
  test("boucle de redirections : arrêt après 3 sauts", async () => {
    const r = await run({ "https://a.fr/p": { status: 302, location: "/p" } });
    assert.equal(r.state, "warning"); assert.match(r.message, /redirections/);
  });
  test("redirection vers une adresse interne : refusée AU SAUT, jamais jointe", async () => {
    let touched = false;
    const lookup = async (host) => (host === "a.fr" ? [{ address: "93.184.216.34" }] : (touched = true, [{ address: "10.0.0.5" }]));
    const r = await probe("https://a.fr/p", { lookup, fetchImpl: reply({ "https://a.fr/p": { status: 302, location: "http://interne.exemple/admin" }, "http://interne.exemple/admin": () => { throw new Error("NE DOIT PAS ÊTRE APPELÉ"); } }) });
    assert.equal(r.state, "error"); assert.match(r.message, /non joignable/);
    assert.equal(touched, true, "la résolution a été vérifiée");
  });
  test("adresse qui résout vers une IP privée : refusée sans requête", async () => {
    const r = await probe("https://mauvais.fr/", { lookup: async () => [{ address: "127.0.0.1" }], fetchImpl: async () => { throw new Error("NE DOIT PAS ÊTRE APPELÉ"); } });
    assert.equal(r.state, "error");
  });
  test("réseau coupé : à vérifier, pas d'exception", async () => {
    assert.equal((await run({})).state, "warning");
  });
});

describe("checkLinks", () => {
  test("au plus 25 adresses vérifiées, le reste est compté", async () => {
    const links = Array.from({ length: 40 }, (_, i) => ({ href: `https://s${i}.fr/` }));
    const r = await checkLinks(links, { lookup: pub, fetchImpl: async () => ({ status: 200 }) });
    assert.equal(r.checked, MAX_URLS); assert.equal(r.skipped, 15); assert.equal(r.results.length, MAX_URLS);
  });
});
