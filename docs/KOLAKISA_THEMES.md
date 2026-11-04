# Bibliothèque de thèmes web — version 2 (« paquets de thème »)

Remplace les 360 thèmes générés (ancienne bibliothèque archivée dans `src/marketing/themes/_ancienne-bibliotheque/` et `docs/themes/ANCIENNE_BIBLIOTHEQUE_V1.md`).

## Principe
Chaque thème est un **paquet autonome** : `src/marketing/themes/packs/<clé>/{pack.js, style.css, motion.js}`.
- `pack.js` : identité (concept, catégorie, tags, empreinte `dna`), jetons (couleurs, polices, formes), options de personnalisation, menu, pages de démonstration (sections du Page Builder).
- `style.css` : CSS propre au thème. Le chargeur préfixe **automatiquement** chaque règle par `body[data-kw-pack="<clé>"]` ; `html`, `:root`, `@import` sont refusés, les `@keyframes` doivent être préfixés. Aucune fuite vers le CMS ni vers un autre thème.
- `motion.js` : animations légères sans dépendance, désactivées avec `prefers-reduced-motion`, contenu jamais masqué sans JavaScript.
- `base.css` (commun) : met les sections en pleine largeur, rien d'esthétique.

Fichiers servis sur `/theme-packs/<clé>/style.css|motion.js` (ETag, cache 7 jours).

## Thèmes livrés
| Clé | Univers | Direction artistique |
|---|---|---|
| arene | sport | affiche de match noir/os/orange |
| fleur | gastronomie | livre de cuisine de luxe, ivoire et vert |
| labo | science | carnet de laboratoire, papier millimétré |
| volume | architecture | plans et masses, rail vertical |
| orbite | tech / SaaS | produit sombre, bento, spotlight |
| noir | mode luxe | lookbook éditorial noir |
| cursus | éducation | cahier d'écolier Seyès, intercalaires, surligneur |
| pierre | immobilier | carnet d'architecte, fenêtre en arche, biens filtrables |
| atelier | agence créative | collage brutaliste, autocollants, projets filtrables |
| seve | santé | soins rassurants, formes organiques |

## Contrôle de diversité
`packs/audit.js` : `auditPack` (balises supprimées par le filtre, liens morts, un seul h1, alt, limite 20 000 car.) et `auditDiversity` (aucune valeur d'empreinte partagée entre thèmes). Vérification : `node -e 'console.log(require("./src/marketing/themes/library").problems())'` doit afficher `[]`.

## Personnalisation et retour arrière
Préférences → Thèmes des sites web → thème → Options (variables `--pk-*`, attributs `data-pk-*`). « Rétablir les valeurs d'origine » et « Revenir au thème précédent » restaurent l'état antérieur.

## Sites existants
Aucun contenu touché : chaque site garde le manifeste de son thème actif (`cms_themes`) ; l'ancien thème continue de s'afficher et le changement reste réversible.

## Ajouter un thème
Créer `packs/<clé>/` sur le modèle de `packs/arene/`, lancer `tests/themes-packs.test.js`, contrôler le rendu à 320, 390, 768, 1024, 1440, 1920 px.

## Limites connues
- Les pages du site principal (sans site rattaché) n'appliquent pas encore le CSS d'un paquet.
- Contrôles visuels réalisés surtout à 390 et 1440 px.
