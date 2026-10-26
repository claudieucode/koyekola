// Route POST /marketing/modeles/apercu/liens : permission, adresses internes refusées sans sortie réseau, limitation par personne.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { startServer, loginInstructor, newStudent } = require("./helpers");
const { TEST_KEY } = require("./marketing-helpers");

const template = (...urls) => ({ kind: "marketing", subject: "Vérif", preheader: "", blocks: urls.map((url, i) => ({ id: `b${i}`, type: "button", label: `Lien ${i}`, url })) });

describe("vérification des liens d'un modèle", () => {
  let srv, boss;
  before(async () => { srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" }); boss = await loginInstructor(srv); });
  after(() => srv.stop());

  test("un élève n'a pas accès (403)", async () => {
    const s = await newStudent(srv);
    assert.equal((await s.postJson("/marketing/modeles/apercu/liens", { template: template("https://exemple.fr") })).status, 403);
  });

  test("adresses internes : signalées en erreur, sans aucune connexion", async () => {
    const r = await boss.postJson("/marketing/modeles/apercu/liens", { template: template("https://127.0.0.1/admin", "https://169.254.169.254/latest", "https://10.0.0.1/") });
    assert.equal(r.status, 200, r.text);
    const body = JSON.parse(r.text);
    assert.equal(body.checked, 3);
    assert.ok(body.results.every((x) => x.state === "error" && /non joignable/.test(x.message)), r.text);
  });

  test("modèle sans lien web : rien à vérifier", async () => {
    const r = await boss.postJson("/marketing/modeles/apercu/liens", { template: template("mailto:a@b.fr") });
    assert.equal(JSON.parse(r.text).checked, 0);
  });

  test("contenu absent ou inconnu : jamais une erreur 500", async () => {
    // (3 appels seulement : la limite est de 6 vérifications par heure et par personne, comptées sur tout le fichier)
    for (const template of [undefined, "x", { blocks: [{ type: "script" }] }]) {
      const r = await boss.postJson("/marketing/modeles/apercu/liens", { template });
      assert.ok(r.status === 200 || r.status === 400, `${JSON.stringify(template)} → ${r.status}`);
    }
  });

  test("au-delà de 6 vérifications par heure : 429", async () => {
    let last;
    for (let i = 0; i < 4; i++) last = await boss.postJson("/marketing/modeles/apercu/liens", { template: template("https://127.0.0.1/") });
    assert.equal(last.status, 429);
  });
});
