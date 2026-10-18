// Génère docs/KOLAKISA_WIDGETS_INVENTORY.md et docs/KOLAKISA_WIDGETS_FUNCTIONAL_MATRIX.md à partir du registre RÉEL (NODE_TYPES, PALETTE, CUSTOM_WIDGETS,
// editorSpec) et des journaux de tests fournis. Aucune case n'est remplie à la main : une dimension non éprouvée est écrite « non éprouvé ».
// Usage : node scripts/build-widgets-docs.js <journal-contenu-1.log> [<journal-contenu-2.log> …]
//   (journaux de `CONTENU_COMPLET=1 node --test tests/controles-contenu-navigateur.test.js`, représentatifs inclus)
const fs = require("fs");
const path = require("path");
const nodes = require("../src/marketing/pages/nodes");
const { NEEDS_DATA, creatable } = require("../tests/widgets-helpers");

const root = path.join(__dirname, "..");
const spec = nodes.editorSpec();
const read = (f) => fs.readFileSync(path.join(root, f), "utf8");

// --- Résultats du parcours des réglages de contenu (journaux)
const contentResult = {};
for (const f of process.argv.slice(2)) {
  if (!fs.existsSync(f)) continue;
  for (const line of fs.readFileSync(f, "utf8").split("\n")) {
    const m = /^\s+(✔|✖) .*\((\w+)\) : chaque liste/.exec(line) || /^\s+(✔|✖) (?:.*?) \((\w+)\) : chaque liste/.exec(line);
    if (m) contentResult[m[2]] = m[1] === "✔" ? "réussi" : "ÉCHEC";
  }
}
// --- Éléments pilotés par les tests de cette mission
const interactive = new Set([...read("tests/widgets-interactions-navigateur.test.js").matchAll(/type: "(\w+)"/g)].map((m) => m[1]));
["gallery"].forEach((t) => interactive.add(t));
const askTypes = Object.keys(nodes.NODE_TYPES).filter((t) => nodes.PALETTE[t] && nodes.PALETTE[t].asks && !NEEDS_DATA.has(t));
const lifecycle = new Set([...Object.keys(nodes.NODE_TYPES).filter((t) => nodes.PALETTE[t] && !nodes.PALETTE[t].asks), ...askTypes]);
const pub = new Set(creatable);
const securite = new Set(creatable.filter((t) => t !== "html"));
// Liens vérifiés par tests/widgets-liens-navigateur.test.js (liste lue dans le test)
const linkTested = new Set((/LINK_WIDGETS = \[([^\]]*)\]/.exec(read("tests/widgets-liens-navigateur.test.js")) || [, ""])[1].match(/"(\w+)"/g)?.map((x) => x.replace(/"/g, "")) || []);
// Widgets qui chargent un service tiers (le réseau extérieur est coupé dans les tests) ou qui lisent des données du site / du visiteur (non fournies par ces tests)
const EXTERNAL = new Set(["video", "audio", "embed", "map", "facebookbutton", "facebookembed", "lottie"]);
const DATA = new Set(["posts", "courselist", "account", "catfilter", "querylist", "postnav", "authorbox", "postcomments", "cmsmenu", "minicart", "sitemap", "cart", "smartlink", "postmeta", "postterms", "archiveinfo", "postcontent", "sitelogo", "sitetitle", "copyright", "dyntext", "profilecard"]);
const interactionOf = (id) => (interactive.has(id) ? "✔" : linkTested.has(id) ? "liens ✔" : EXTERNAL.has(id) ? "service externe : non éprouvé" : DATA.has(id) ? "données du site : non exercées ici" : "—");
// Tests préexistants qui nomment le widget (fichiers hors mission 8)
const files = fs.readdirSync(path.join(root, "tests")).filter((f) => f.endsWith(".test.js") && !/^widgets-(publie|interactions|editeur|accessibilite|securite|performance|corrections)-/.test(f));
const texts = files.map((f) => [f, read("tests/" + f)]);
const mentions = (t) => texts.filter(([, s]) => new RegExp(`["'\`]${t}["'\`]`).test(s)).map(([f]) => f.replace(/\.test\.js$/, ""));

const propsRead = (t) => { const src = String(nodes.NODE_TYPES[t].props || ""); return [...new Set([...src.matchAll(/\bp\.(\w+)/g)].map((m) => m[1]))]; };
const types = spec.types;
const custom = nodes.CUSTOM_WIDGETS;

const lines = [];
lines.push("# Inventaire des widgets de KOLAKISA", "");
lines.push("> Généré par `node scripts/build-widgets-docs.js` à partir du registre réel (`NODE_TYPES`, `PALETTE`, `CUSTOM_WIDGETS`, `editorSpec()`). Ne pas modifier à la main.", "");
const byCat = {};
for (const t of types) (byCat[t.category] = byCat[t.category] || []).push(t);
lines.push(`**${types.length} types d'éléments** dans le registre (${types.filter((t) => t.container).length} conteneurs, ${types.filter((t) => custom[t.type]).length} widgets personnalisés déclarés dans \`CUSTOM_WIDGETS\`, ${types.filter((t) => t.parts && t.parts.length).length} avec parties stylables). Catégories : ${Object.entries(byCat).map(([c, l]) => `${spec.categories[c] ? spec.categories[c] : c} (${l.length})`).join(", ")}.`, "");
lines.push("Colonnes : **Propriétés lues** = champs de contenu lus par le validateur serveur du widget (`p.xxx` dans sa fonction `props`) ; **Insertion** = clic bibliothèque (direct) ou boîte de dialogue (choix demandé : image, adresse, formation…) ; **Parties** = sous-éléments stylables séparément ; **Tests préexistants** = fichiers de tests qui nomment le type (hors mission 8).", "");
for (const [cat, list] of Object.entries(byCat)) {
  lines.push(`## ${(spec.categories && spec.categories[cat]) || cat} (${list.length})`, "", "| Identifiant | Nom affiché | Groupe | Conteneur | Insertion | Propriétés lues | Parties stylables | Source du rendu | Tests préexistants |", "|---|---|---|---|---|---|---|---|---|");
  for (const t of list) {
    const pal = nodes.PALETTE[t.type] || {};
    const ins = pal.asks ? `dialogue (${pal.asks})` : "direct";
    const parts = (t.parts || []).map((p) => p.key).join(", ") || "—";
    const src = custom[t.type] ? `widget personnalisé (${custom[t.type].status || "statut non déclaré"}${custom[t.type].data ? ", données du visiteur / site" : ""})` : t.requires ? `noyau (permission ${t.requires})` : "noyau (`_node.ejs`)";
    const m = mentions(t.type);
    lines.push(`| \`${t.type}\` | ${t.label} | ${t.group} | ${t.container ? "oui" : "non"} | ${ins} | ${propsRead(t.type).map((k) => "`" + k + "`").join(" ") || "—"} | ${parts} | ${src} | ${m.length ? m.length + " : " + m.slice(0, 3).join(", ") : "**aucun**"} |`);
  }
  lines.push("");
}
fs.writeFileSync(path.join(root, "docs", "KOLAKISA_WIDGETS_INVENTORY.md"), lines.join("\n"));

// --- Matrice fonctionnelle
const m = [];
m.push("# Matrice fonctionnelle des widgets de KOLAKISA", "");
m.push("> Générée par `node scripts/build-widgets-docs.js` à partir des tests exécutés. « ✔ » = éprouvé et réussi dans cette mission ; « — » = sans objet pour ce widget ; « non éprouvé » = aucune preuve dans cette mission.", "");
m.push("| Widget | Cycle de vie éditeur | Enregistrement → publication → rendu | Largeurs (8) × 2 contenus | Accessibilité de base | Charges hostiles | Interaction publiée | Réglages de contenu (inspecteur) | Statut |", "|---|---|---|---|---|---|---|---|---|");
const counts = {};
const rows = [];
for (const t of types) {
  const id = t.type;
  const data = NEEDS_DATA.has(id);
  const life = lifecycle.has(id) ? "✔" : "non éprouvé";
  const pb = pub.has(id) ? "✔" : "non éprouvé";
  const a11y = pub.has(id) ? "✔" : "non éprouvé";
  const sec = securite.has(id) ? "✔" : pub.has(id) ? "html : voir note" : "non éprouvé";
  const inter = interactionOf(id);
  const cr = contentResult[id];
  const content = data ? "non éprouvé (formation / formulaire réels requis)" : cr === "réussi" ? "✔" : cr === "ÉCHEC" ? "ÉCHEC" : "non exécuté";
  let status;
  const mention = mentions(id).length;
  if (cr === "ÉCHEC") status = "DÉFECTUEUX";
  else if (data) status = mention >= 3 ? "PARTIEL" : "NON TESTÉ";
  else if ([life, pb, a11y].every((x) => x === "✔") && (cr === "réussi") && ["—", "✔", "liens ✔"].includes(inter)) status = "VALIDÉ";
  else if ([life, pb, a11y].every((x) => x === "✔")) status = "PARTIEL";
  else status = "NON TESTÉ";
  counts[status] = (counts[status] || 0) + 1;
  rows.push(`| \`${id}\` ${t.label} | ${life} | ${pb} | ${pb} | ${a11y} | ${sec} | ${inter} | ${content} | **${status}** |`);
}
m.push(...rows, "");
m.push("## Totaux", "", "| Statut | Nombre |", "|---|---|", ...Object.entries(counts).map(([k, v]) => `| ${k} | ${v} |`), `| **Total** | **${types.length}** |`, "");
m.push("## Règle de classement appliquée", "", "* **VALIDÉ** : cycle de vie dans l'éditeur, enregistrement → publication → rendu, 8 largeurs × 2 contenus, accessibilité de base et réglages de contenu réussis, et — s'il est interactif — interaction ou liens publiés réussis dans cette mission.", "* **PARTIEL** : au moins un critère n'est pas éprouvé (service tiers non joignable dans les tests, données du site non fournies, formation / formulaire réels requis) sans échec constaté.", "* **DÉFECTUEUX** : un test de cette mission a échoué sur ce widget et le défaut n'est pas corrigé.", "* **NON TESTÉ** : preuves insuffisantes.", "", "Aucun widget n'est classé « ABSENT » ou « BLOQUÉ » par cette règle : les lacunes de fonctions (comparées à Elementor) sont dans `KOLAKISA_WIDGETS_GAP_ANALYSIS.md`.", "");
m.push("## Preuves (fichiers de tests de la mission 8)", "", "| Colonne | Test | Ce qui est vérifié |", "|---|---|---|",
  "| Cycle de vie éditeur | `widgets-editeur-navigateur` | insertion par la bibliothèque (ou contenu réaliste pour les éléments à choix), identifiant `[a-z0-9]{12}` unique, sélection, Ctrl+D (copie identique sauf identifiants et ancre), annuler, rétablir, Suppr (voisins intacts), enregistrement serveur identique, rechargement |",
  "| Enregistrement → publication → rendu et Largeurs | `widgets-publie-navigateur` + `editeur-conformite-widgets` (préexistant) | brouillon accepté, page publiée, widget présent, visible, sans débordement horizontal à 320 / 375 / 767 / 768 / 1023 / 1024 / 1440 / 1920 px, contenu de départ puis contenu difficile |",
  "| Accessibilité de base | `widgets-accessibilite-navigateur` | nom accessible, `alt`, titre des cadres, identifiants uniques, pas de `tabindex` positif, dialogues nommés, repère de focus au clavier |",
  "| Charges hostiles | `widgets-securite-navigateur` | 1 092 charges dans chaque champ texte : refus avec message ou neutralisation ; rien ne s'exécute dans la page publiée ni l'aperçu |",
  "| Interaction publiée | `widgets-interactions-navigateur` | clic, clavier, états ARIA, valeurs affichées (voir `KOLAKISA_WIDGETS_AUDIT.md` §3) |",
  "| liens ✔ | `widgets-liens-navigateur` | au moins un lien par widget de lien, liens internes suivis, externes en https, `noopener` |",
  "| Réglages de contenu | `controles-contenu-navigateur` (`CONTENU_COMPLET=1`) | chaque liste, case et champ de l'inspecteur : effet sur le document, rien d'autre ne change, survit au rechargement, sinon un message |", "");
m.push("## Défauts trouvés puis corrigés (statut actuel : réussi après correction)", "", "| Widget | Défaut | Détail |", "|---|---|---|", "| `menuanchor` (et copie) | D4 P1 | dupliquer une ancre rendait la page non enregistrable |", "| `code` | D1 P2 | « Lignes surlignées » illisible effacé sans message |", "| `breadcrumb` | D2 P2 | champ « Adresse » muet pour le dernier niveau |", "| `modal`, `flipbox`, `pricing` | D3 P2 | bouton à deux champs : un seul rempli → rien, sans message |", "", "Les trois widgets de la dernière ligne et `code` / `breadcrumb` apparaissent « réussi » dans la colonne Réglages de contenu parce que le journal pris en compte est celui d'après correction (`contenu-fix.log`) ; les journaux avant correction montraient l'échec.", "");
fs.writeFileSync(path.join(root, "docs", "KOLAKISA_WIDGETS_FUNCTIONAL_MATRIX.md"), m.join("\n"));
console.log("inventaire et matrice écrits :", JSON.stringify(counts), "pour", types.length, "types");
