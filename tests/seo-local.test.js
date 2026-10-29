// SEO Intelligence : SEO local — l'organisation publie téléphone, e-mail et adresse SEULEMENT s'ils sont saisis (HTML réellement rendu).
const { describe, test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { startServer, Client, loginInstructor } = require("./helpers");

const jsonLd = (html) => [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
const orgOf = (html) => jsonLd(html).flatMap((d) => d["@graph"] || [d]).find((n) => ["Organization", "EducationalOrganization", "LocalBusiness"].includes([].concat(n["@type"])[0]));

describe("SEO local : données de l'organisation", () => {
  let srv, prof;
  before(async () => { srv = await startServer({ SITE_URL: "https://kolakisa.test" }); prof = await loginInstructor(srv); });
  after(() => srv.stop());

  test("sans saisie : aucune coordonnée inventée dans le JSON-LD", async () => {
    const org = orgOf((await new Client(srv.base).get("/")).text);
    assert.ok(org);
    for (const k of ["telephone", "email", "address"]) assert.equal(k in org, false, k);
  });

  test("saisie complète : téléphone, e-mail et adresse postale publiés, type LocalBusiness", async () => {
    await prof.post("/formateur/seo/reglages", { org_type: "LocalBusiness", org_phone: "+33 1 23 45 67 89", org_email: "contact@exemple.fr", org_street: "12 rue des Lilas", org_postal_code: "75011", org_city: "Paris", org_country: "fr" });
    const org = orgOf((await new Client(srv.base).get("/")).text);
    assert.equal(org["@type"], "LocalBusiness");
    assert.equal(org.telephone, "+33 1 23 45 67 89");
    assert.equal(org.email, "contact@exemple.fr");
    assert.deepEqual(org.address, { "@type": "PostalAddress", streetAddress: "12 rue des Lilas", addressLocality: "Paris", postalCode: "75011", addressCountry: "FR" });
  });

  test("valeurs invalides : téléphone ou e-mail douteux non publiés ; adresse sans ville non publiée", async () => {
    await prof.post("/formateur/seo/reglages", { org_type: "LocalBusiness", org_phone: "appelez-moi", org_email: "pas un email", org_street: "12 rue des Lilas", org_city: "" });
    const org = orgOf((await new Client(srv.base).get("/")).text);
    for (const k of ["telephone", "email", "address"]) assert.equal(k in org, false, k);
  });
});
