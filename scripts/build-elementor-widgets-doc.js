#!/usr/bin/env node
// Génère docs/widgets-elementor/ELEMENTOR_WIDGETS_2026-11.md à partir de la table officielle (src/marketing/pages/elementorWidgets.json) ET du registre RÉEL de l'éditeur (nodes.editorSpec).
// Aucun chiffre n'est écrit à la main : tout est calculé ici. Ne pas modifier le .md : modifier la table ou ce script, puis `node scripts/build-elementor-widgets-doc.js`.
const fs = require("fs");
const path = require("path");
const nodes = require("../src/marketing/pages/nodes");
const MAP = require("../src/marketing/pages/elementorWidgets.json");

const ADDED = new Set(["stripebutton", "paypalbutton", "sidebar"]); // ajoutés par cette mission (registre d'origine : 99 types, 0 de ces trois)
const spec = nodes.editorSpec();
const types = new Map(spec.types.map((t) => [t.type, t]));
const shortcuts = new Map(spec.shortcuts.map((s) => [s.key, s]));
// Disponibilité : seules les mentions explicites de la source officielle (billet elementor.com/blog/?p=151985) sont reprises ; tout le reste est « non établie ».
const FREE = new Set(["Text Editor", "Image", "Button", "Divider", "Icon", "Video", "Google Maps"]);
const PRO = new Set(["Posts", "Portfolio", "Price Table", "Animated Headline", "Reviews", "Lottie", "Table of Contents"]);
const avail = (n) => (FREE.has(n) ? "Gratuit (cité par la source)" : PRO.has(n) ? "Pro (cité par la source)" : "non établie par la source consultée");
const GROUPS = spec.widgetGroups || {};
const rows = MAP.widgets.map((w) => {
  const k = w.kolakisa; const t = k && (types.get(k) || shortcuts.get(k));
  const kind = !k ? "—" : types.has(k) ? "widget" : "raccourci";
  const label = t ? t.label : "—";
  const group = types.has(k) ? (GROUPS[types.get(k).group] || types.get(k).group) : shortcuts.has(k) ? (GROUPS[shortcuts.get(k).group] || shortcuts.get(k).group) : "—";
  const initial = !k ? "Absent" : ADDED.has(k) ? "Absent" : "Présent mais introuvable par son nom Elementor";
  const work = !k ? "Non implémenté (voir limites)" : ADDED.has(k) ? "Ajouté pendant cette intervention" : "Corrigé : nom Elementor ajouté à la recherche de la bibliothèque";
  const tests = !k ? "—" : ADDED.has(k) ? "widgets-paiement-barre-laterale-navigateur ; elementor-widgets-decouverte-navigateur ; widgets-editeur-navigateur ; widgets-publie-navigateur" : "elementor-widgets-decouverte-navigateur (recherche par nom + ajout par clic)" + (types.has(k) ? " ; widgets-editeur-navigateur (cycle de vie)" : "");
  const final = !k ? (/Facebook Comments/.test(w.name) ? "Bloqué par une dépendance" : "Non implémenté (choix de conception)") : ADDED.has(k) ? "Ajouté pendant cette intervention" : "Corrigé";
  return { ...w, kind, label, group, initial, work, tests, final, avail: avail(w.name) };
});
const total = rows.length, mapped = rows.filter((r) => r.kolakisa).length, added = rows.filter((r) => ADDED.has(r.kolakisa)).length;
const none = rows.filter((r) => !r.kolakisa);
const lines = [];
lines.push("# Widgets Elementor → Kolakisa : table de vérification (2026-11-01)", "");
lines.push("_Généré par `scripts/build-elementor-widgets-doc.js` à partir de `src/marketing/pages/elementorWidgets.json` et du registre réel de l'éditeur. Ne pas modifier à la main._", "");
lines.push(`**Source de la liste des widgets :** ${MAP.source}, consultée le ${MAP.consulted}. **Disponibilité Free/Pro :** la source ne l'indique pas widget par widget ; seules les mentions du billet https://elementor.com/blog/?p=151985 (32 widgets de base, 118+ au total avec Pro) sont reprises. Aucun widget n'est présenté comme gratuit ou Pro sans cette source.`, "");
lines.push("## Résumé chiffré (calculé)", "");
lines.push(`| Mesure | Valeur |`, `|---|---|`);
lines.push(`| Widgets Elementor documentés (liste officielle du centre d'aide) | ${total} |`);
lines.push(`| Présents dans la bibliothèque de l'éditeur avant l'intervention | ${mapped - added} |`);
lines.push(`| …dont corrigés (introuvables par leur nom Elementor → recherche corrigée) | ${mapped - added} |`);
lines.push(`| Ajoutés pendant l'intervention | ${added} (${[...ADDED].join(", ")}) |`);
lines.push(`| Disponibles dans l'éditeur à la fin | ${mapped} sur ${total} |`);
lines.push(`| Non implémentés | ${none.length} (${none.map((n) => n.name).join(", ")}) |`);
lines.push(`| Types enregistrés dans le registre (éditeur) | ${spec.types.length} (dont ${Object.keys(nodes.CUSTOM_WIDGETS).length} widgets déclaratifs) ; raccourcis de bibliothèque : ${spec.shortcuts.length} |`, "");
lines.push("## Table de vérification", "");
lines.push("| Widget Elementor | Disponibilité Elementor | Kolakisa (clé) | Libellé / catégorie | Statut initial | Travail effectué | Tests | Statut final |", "|---|---|---|---|---|---|---|---|");
for (const r of rows) lines.push(`| ${r.name} | ${r.avail} | ${r.kolakisa ? `\`${r.kolakisa}\` (${r.kind})` : "—"} | ${r.kolakisa ? `${r.label} / ${r.group}` : "—"}${r.note ? ` — ${r.note}` : ""} | ${r.initial} | ${r.work} | ${r.tests} | ${r.final} |`);
lines.push("", "## Limites et écarts assumés", "");
lines.push("- **Facebook Comments** : exige un identifiant d'application Facebook et le chargement du script externe Facebook ; Kolakisa n'en charge aucun (sécurité, performance). Bloqué par une dépendance.");
lines.push("- **Shortcode** : notion WordPress ; un shortcode exécute du code côté serveur. Remplacé par les étiquettes dynamiques et le HTML sécurisé. Non implémenté par choix de sécurité.");
lines.push("- **Template** : l'équivalent existe sous un autre chemin — onglet « Blocs » → Composants (insertion d'un composant enregistré) ; ce n'est pas une entrée de la liste « Éléments », d'où l'absence de clé dans la table.");
lines.push("- **Stripe / PayPal** : liens de paiement HÉBERGÉS par le prestataire (liste blanche de domaines). Pas de clé API stockée, pas de script externe, pas de création de produit ni de prix dans Kolakisa, contrairement aux widgets Elementor qui s'intègrent à l'API du prestataire.");
lines.push("- Le contenu détaillé des contrôles de chaque widget Elementor n'a pas été relu intégralement lors de cette intervention ; la référence détaillée précédente reste dans `docs/elementor-reference/` (non rouverte ici).");
const out = path.join(__dirname, "..", "docs", "widgets-elementor", "ELEMENTOR_WIDGETS_2026-11.md");
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, lines.join("\n") + "\n");
console.log(`${total} widgets, ${mapped} disponibles, ${added} ajoutés, ${none.length} non implémentés -> ${path.relative(process.cwd(), out)}`);
