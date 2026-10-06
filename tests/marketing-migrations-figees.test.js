// Migrations marketing FIGÉES : une migration déjà appliquée en production ne doit plus jamais changer, pas même un
// commentaire. Le serveur compare l'empreinte (sha256) de chaque fichier à celle enregistrée lors de son application et
// désactive tout le module marketing en cas de différence (incident du 2026-10-03 : un mot changé dans un commentaire
// de la migration 013 a coupé l'emailing en ligne). Pour faire évoluer le schéma : créer une NOUVELLE migration, puis
// ajouter son empreinte ici une fois publiée.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const FROZEN = {
  "001_fondations.sql": "e7646c1a9002f269ed480aff548f18719286d0bb7ca6471d45aea95b94604dc7",
  "002_evenements_et_file.sql": "9355fc38d14fba8f46c3f7e783fba5f1eeca307efe4713d6db22bb1e793780e0",
  "003_audience.sql": "3c4c274d152913492416ff6a5640419c25e989d39e62a299b1a06d7e87235ad4",
  "004_conformite.sql": "287e3a2ad1393fdae52803bf6f33a8583f04aff32ad2f878c54e644fc60d0c4b",
  "005_segments.sql": "f1190bb02c1e79886394f29f7d669c03b214683c131a7e2c1599e8148067a7ec",
  "006_imports.sql": "4a3bf4379976d4ebe30950a02576383bf6b9350348e0b42f813d01d6eb9ea0c3",
  "007_modeles.sql": "9d57da8521b6de8868ac59b572e7daebb94721831f62b692b721885f105829fa",
  "008_envoi.sql": "70094fcda79ca0bbacf206e3e91dd65559d33b0b70298a610f0fefc7f422eb35",
  "009_pont_automatisations.sql": "2b73adff71042958318c63f47e5834a19db389dc35747d449d092557fe07dbd7",
  "010_index_evenements_contact.sql": "7458cffba0dc6c5df3a6bb1ed3e20f7a2f395958c1da7523e9ddea47f7593827",
  "011_categorie_modeles.sql": "ab075f61f267b678740eb39f4d4c763f8994e2df6db409904d358cafdb0dd433",
  "012_cles_api.sql": "534da8a58870b23d85d43cc91d6028bd00f9f397923bd47a15b755406b5ba6d4",
  "013_webhooks_sortants.sql": "34ac468d4a73c3e3e5731fda3baca39e8a8c12dffe9bce776a1b7e1ffc4523dd",
  "014_formulaires.sql": "011fb0c35ad8f6e8bad95dc00dc135bcd58e268055b243871a1e71ff856f0053",
  "015_popups.sql": "2cd8ad4771492f681f4548d0b6845e9e1914fd56a4bc19635a3c74707332b4df",
  "016_canvas.sql": "cf96bccc15b25242ed8ed6ed368702f151e5ab96834aa46fdab3bb94f016642b",
  "017_declencheurs_multiples.sql": "7870ac72f63a0bd8aa2b381aaf7914ea68a6c03305c4b0a104734a0a02efb66f",
  "018_formulaires_suite.sql": "2211e3fa9887a69294ad0c1fef2640d58f9830ebb0f85c21c1166511d2bba36f",
  "019_sms.sql": "6ac7edb23760277fd40a7ade16dcd30da134d9e50cd1b2d4d54802e3a5dbab9f",
  "020_campagnes_sms.sql": "1d91b3206ceca268c980a39f3411b6ba89fef3f5c297b944c8a98ce36a72a3db",
  "021_double_optin.sql": "d2d0ff266b4381838cbe9c50e778f81ac7bcb23a0494ac1b6f12034a5f1b8b5e",
  "022_tests_ab.sql": "d80e9b4c5538975468d01e8490561bfb9e5a22f5749fed0590a96b0b7ff1b1c9",
  "023_revenus.sql": "c4d67399a995ce1a08a0008fc0db55ee5b3a5ac15f655d588b2111470e988b33",
  "024_medias.sql": "c86eb7f59e824b0bc8c3392db747ae71695a8376027e25842ad8b35c83b922db",
  "034_parcours_bibliotheque.sql": "6a2204704c6e9f80ef75581ef11539e675b2e823948a9ee2475365798c9e6576",
  "035_index_cles_etrangeres.sql": "6fece1f4d8780e4ad9946b965956521e6d4929c309482e2b6678c981e71d7c8c",
  "036_site_web_fondations.sql": "dc1b85df1f1cb0193df9028ebe7ba7003af55105bb76e344ad1e985ed22babcb",
  "037_formulaires_etendus.sql": "e6bbe9d4bf096899759d57791d16b884d26823e640b62d818fd38a39fe5e69d1"
};

test("aucune migration marketing publiée n'a été modifiée", () => {
  const dir = path.join(__dirname, "..", "src", "marketing", "migrations");
  for (const [file, sum] of Object.entries(FROZEN)) {
    const sql = fs.readFileSync(path.join(dir, file), "utf8").replace(/\r\n/g, "\n");
    const actual = crypto.createHash("sha256").update(sql).digest("hex");
    assert.equal(actual, sum, `${file} a été modifiée : remettez-la exactement comme avant et créez une nouvelle migration (sinon le module marketing est désactivé en production).`);
  }
});
