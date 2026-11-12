// BASCULE v2 : une fois les 100 modèles v2 construits, la bibliothèque ne liste QUE la v2 ; les anciens identifiants (ft-* et d'avant la refonte) restent ouvrables ; l'interrupteur FOOTER_V2=0 rétablit l'ancienne liste.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const path = require("node:path");
const racine = path.join(__dirname, "..");
const lire = (env, code) => JSON.parse(execFileSync(process.execPath, ["-e", code], { cwd: racine, env: { ...process.env, ...env }, encoding: "utf8" }));
const CODE = `const F=require("./src/themeBuilder/catalog/footer");
const actuels=F.hiddenLayouts.filter(l=>!l.legacy).map(l=>l.fullKey);
console.log(JSON.stringify({mode:F.v2&&F.v2.mode,liste:F.layouts.length,tousV2:F.layouts.every(l=>l.v2===true),premier:F.layouts[0].fullKey,
 actuelsOuvrables:actuels.length,actuelsOk:actuels.every(id=>F.resolveAlias(id)),ancOk:Object.keys(F.aliases).every(id=>F.resolveAlias(id)),nb:actuels.length}))`;
describe("Bascule v2 de la bibliothèque de pieds", () => {
  test("par défaut : 185 modèles v2 listés, 100 modèles actuels et tous les anciens identifiants restent ouvrables", () => {
    const r = lire({ FOOTER_V2: "", FOOTER_V2_APERCU: "" }, CODE);
    assert.equal(r.mode, "v2"); assert.equal(r.liste, 185); assert.ok(r.tousV2); assert.match(r.premier, /^ft2-/);
    assert.equal(r.actuelsOuvrables, 100); assert.ok(r.actuelsOk); assert.ok(r.ancOk);
  });
  test("interrupteur de secours FOOTER_V2=0 : la liste actuelle (ft-*) est rétablie, rien d'autre ne change", () => {
    const r = lire({ FOOTER_V2: "0" }, CODE);
    assert.equal(r.mode, "actuel"); assert.equal(r.liste, 100); assert.equal(r.tousV2, false); assert.match(r.premier, /^ft-/);
  });
});
