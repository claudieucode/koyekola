// Palier 26 (G-01, G-02) : l'écran « Santé » dit la VÉRITÉ sur la configuration d'envoi et de paiement (présence des variables, jamais leur valeur).
const { test, describe, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");

const O = "/marketing/site-web/outils";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const servers = [];
after(() => Promise.all(servers.map((s) => s.stop())));

async function health(env) {
  const srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "", STRIPE_SECRET_KEY: "", STRIPE_WEBHOOK_SECRET: "", ...env });
  servers.push(srv);
  const boss = await loginInstructor(srv);
  const db = srv.db();
  assert.equal((await boss.post(`${O}/sante`, {})).status, 302);
  const id = db.prepare("SELECT MAX(id) id FROM cms_tool_runs WHERE kind = 'health'").get().id;
  for (let i = 0; i < 400; i++) {
    const p = JSON.parse((await boss.get(`${O}/operations/${id}.json`)).text);
    if (p.status === "done") break;
    assert.notEqual(p.status, "failed");
    await sleep(150);
  }
  const report = JSON.parse(db.prepare("SELECT report FROM cms_tool_runs WHERE id = ?").get(id).report);
  return { res: Object.fromEntries(report.results.map((r) => [r.id, r])), text: JSON.stringify(report) };
}

describe("santé : configuration d'envoi et de paiement", () => {
  test("par défaut : fournisseur « console » signalé (à surveiller), Stripe non configuré (information)", async () => {
    const { res } = await health({});
    assert.equal(res.sending_provider.status, "warning", res.sending_provider.detail);
    assert.match(res.sending_provider.detail, /console/);
    assert.match(res.sending_provider.impact, /enregistrés comme « envoyés »/);
    assert.equal(res.payments.status, "info");
    assert.match(res.payments.detail, /pas configuré/);
  });
  test("clé Stripe sans secret de webhook : critique (paiement encaissé mais non enregistré) ; la valeur de la clé n'apparaît jamais", async () => {
    const { res, text } = await health({ STRIPE_SECRET_KEY: "sk_test_valeur_secrete_123" });
    assert.equal(res.payments.status, "critical");
    assert.match(res.payments.detail, /webhook/);
    assert.ok(!text.includes("sk_test_valeur_secrete_123"), "le secret ne fuit pas dans le rapport");
  });
  test("clé et secret présents : bon ; secret de webhook seul : à surveiller", async () => {
    const ok = await health({ STRIPE_SECRET_KEY: "sk_test_a", STRIPE_WEBHOOK_SECRET: "whsec_b" });
    assert.equal(ok.res.payments.status, "good");
    assert.ok(!ok.text.includes("whsec_b") && !ok.text.includes("sk_test_a"));
    const half = await health({ STRIPE_WEBHOOK_SECRET: "whsec_b" });
    assert.equal(half.res.payments.status, "warning");
  });
});
