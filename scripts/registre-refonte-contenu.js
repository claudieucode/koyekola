// Génère la table du registre de suivi de la refonte des zones de contenu (docs/KOLAKISA_REFONTE_CONTENU.md) à partir des menus réels :
// chaque écran du menu CMS et du menu Marketing y figure, avec sa famille et son état. L'état est saisi ci-dessous (jamais déduit) ; le test
// tests/registre-pages.test.js vérifie que tout écran du menu est présent dans le registre.
const cms = require("../src/marketing/web/cmsNav");
const mk = require("../src/marketing/web/nav");

const FAMILY = [
  [/^\/marketing$/, "Tableau de bord"], [/analytics\/global|site-web$|seo$|outils$/, "Tableau de bord"],
  [/campagnes$|\/modeles$|\/contacts$|\/listes|\/segments|\/etiquettes$|\/proprietes|\/sondages|\/score|\/formulaires|\/sms$|\/sms\/abonnes|\/automatisations$|\/tunnels|\/rss|\/reseaux$|\/tests-ab|\/analytics$|\/revenus|\/analytics\/comparer|\/site-web\/sites|\/site-web\/articles|\/pages$|\/commentaires|\/mediatheque$|\/utilisateurs$|\/redirections$|\/themes|\/polices|\/corbeille|\/articles\/(categories|etiquettes|auteurs)|\/utilisateurs\/(roles|permissions|invitations)|\/seo\/404|\/liens-casses|\/outils\/(sauvegardes|logs)/, "Liste / tableau"],
  [/\/parametres|\/envoi$|\/domaines|\/conformite|\/ia$|\/reseaux\/reglages|\/apparence$|\/outils\/(maintenance|cache|diagnostic|systeme|contenu)|\/seo\//, "Réglages / formulaire"],
  [/ajouter|importer|exporter|\/ajouter$/, "Assistant / import"],
];
const familyOf = (href) => { for (const [re, f] of FAMILY) if (re.test(href)) return f; return "Écran spécialisé"; };

// État de chaque écran : « Refondue et testée » | « En cours » (système partagé appliqué, composition propre à reprendre) | « À auditer »
const DONE = new Set(["/marketing", "/marketing/campagnes", "/marketing/contacts", "/marketing/modeles", "/marketing/formulaires", "/marketing/listes"]);
const DONE_NOTE = {
  "/marketing": "Recomposé : sélecteur de période, instantané des chiffres (infobulles), préparation à l'envoi (étapes + détail, données réelles), audience, scénarios, campagnes récentes, modèles réels, activité.",
  "/marketing/campagnes": "Recomposé : en-tête à actions, onglets d'état, recherche + tri, tableau (nom + type + dates / audience / ouvertures / clics), actions fendues, pagination complète.",
  "/marketing/contacts": "Recomposé : filtres principaux en ligne, filtres avancés repliables, tableau avec sélection et actions groupées, pagination complète.",
  "/marketing/formulaires": "Recomposé : indicateur réel (formulaires actifs), recherche + statuts instantanés, titre + lien public, actions Détails / lien, état vide illustré.",
  "/marketing/listes": "Recomposé : actions d'en-tête, bandeau fermable, actions fendues, état vide illustré.",
  "/marketing/modeles": "Recomposé : onglets de catégories, recherche + type + tri, bascule liste / grille avec aperçus réels, actions fendues.",
};
const SHARED = "en-tête en bande (titre, description, actions), cases à cocher, filtres en texte, infobulle de menu";

const rows = [];
const seen = new Set();
for (const s of cms.SECTIONS) for (const i of s.items) if (!seen.has(i.href)) { seen.add(i.href); rows.push({ href: i.href, label: i.label, menu: "CMS · " + s.label }); }
for (const i of mk.ITEMS) if (!seen.has(i.href)) { seen.add(i.href); const sec = mk.SECTIONS.find((x) => x.key === i.section); rows.push({ href: i.href, label: i.label, menu: "Marketing · " + (sec ? sec.label : i.section) }); }
const table = rows.map((r) => {
  const done = DONE.has(r.href);
  return `| ${r.menu} | ${r.label} | \`${r.href}\` | ${familyOf(r.href)} | ${done ? "Refondue et testée" : "En cours"} | ${done ? DONE_NOTE[r.href] : "Système partagé appliqué (" + SHARED + ") ; composition propre à reprendre"} |`;
});
console.log(table.join("\n"));
console.error(`${rows.length} écrans, ${rows.filter((r) => DONE.has(r.href)).length} refondus`);
