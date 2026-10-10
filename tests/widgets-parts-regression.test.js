// Filet de sécurité du contrôle des widgets (LOT 4a) : pour CHAQUE type du registre, le contenu de départ + un jeu de styles (3 écrans + survol) est
// normalisé puis converti en CSS ; l'empreinte du résultat est comparée à celle d'avant l'ajout des « parties ». Tant qu'aucune partie n'est utilisée,
// rien ne change à l'octet près (JSON enregistré ET CSS publié). Régénérer volontairement : UPDATE_FIXTURE=1 node --test tests/widgets-parts-regression.test.js
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const n = require("../src/marketing/pages/nodes");

const FIXTURE = path.join(__dirname, "fixtures", "widgets-regression.json");
const H = { ctx: {}, imageUrl: (v) => String(v || ""), linkUrl: (v) => String(v || ""), iconNames: n.iconNames() };
const sha = (s) => crypto.createHash("sha1").update(s).digest("hex");
const STYLES = { desktop: { marginTop: "8px", color: "#112233", borderRadius: "12px", boxShadow: "md" }, tablet: { paddingTop: "10px" }, mobile: { fontSize: "15px" } };
const STATES = { hover: { opacity: 0.9 } };

function snapshot() {
  const out = {};
  for (const type of Object.keys(n.NODE_TYPES).sort()) {
    const blank = n.PALETTE[type].blank();
    if (blank.props && blank.props.until) blank.props.until = "2030-01-01T00:00:00Z"; // le contenu de départ du compte à rebours dépend de l'heure courante
    const raw = { id: "node" + type.slice(0, 7).padEnd(7, "0"), type, ...blank, styles: STYLES, states: STATES };
    if (n.NODE_TYPES[type].container) raw.children = [];
    try {
      const node = n.normalizeNode(raw, type, H, 1, { n: 0, ids: new Set() });
      const section = { id: "sect00000001", type: "layout", children: [node] };
      out[type] = { json: sha(JSON.stringify(node)), css: sha(n.pageCss([section])) };
    } catch (error) { out[type] = { error: sha(String(error.message)) }; }
  }
  return out;
}

describe("filet de sécurité : contrôle des widgets", () => {
  test("rendu enregistré et CSS de chacun des types identiques à la référence (aucune partie utilisée)", () => {
    const now = snapshot();
    if (process.env.UPDATE_FIXTURE === "1") { fs.writeFileSync(FIXTURE, JSON.stringify(now, null, 1) + "\n"); return; }
    const ref = JSON.parse(fs.readFileSync(FIXTURE, "utf8"));
    assert.deepEqual(Object.keys(now), Object.keys(ref), "types du registre différents de la référence : régénérer la référence en connaissance de cause");
    const diff = Object.keys(ref).filter((t) => JSON.stringify(ref[t]) !== JSON.stringify(now[t]));
    assert.deepEqual(diff, [], `types dont la sortie a changé : ${diff.join(", ")}`);
  });
});
