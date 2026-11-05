# Bibliothèque de thèmes web — version 2 (« paquets de thème »)

Remplace les 360 thèmes générés (ancienne bibliothèque archivée dans `src/marketing/themes/_ancienne-bibliotheque/` et `docs/themes/ANCIENNE_BIBLIOTHEQUE_V1.md`).

## Principe
Chaque thème est un **paquet autonome** : `src/marketing/themes/packs/<clé>/{pack.js, style.css, motion.js}`.
- `pack.js` : identité (concept, catégorie, tags, empreinte `dna`), jetons (couleurs, polices, formes), options de personnalisation, menu, pages de démonstration (sections du Page Builder).
- `style.css` : CSS propre au thème. Le chargeur préfixe **automatiquement** chaque règle par `body[data-kw-pack="<clé>"]` ; `html`, `:root`, `@import` sont refusés, les `@keyframes` doivent être préfixés. Aucune fuite vers le CMS ni vers un autre thème.
- `motion.js` : animations légères sans dépendance, désactivées avec `prefers-reduced-motion`, contenu jamais masqué sans JavaScript.
- `base.css` (commun) : met les sections en pleine largeur, rien d'esthétique.

Fichiers servis sur `/theme-packs/<clé>/style.css|motion.js` (ETag, cache 7 jours).

## Thèmes livrés (40)
Liste complète, avec concept, polices, palette, pages et options : `docs/themes/FICHES_IDENTITE.md` (générée par `node scripts/themes-fiches.js`).
Univers couverts : sport, gastronomie (restaurant, boulangerie, thé et café), science, architecture, technologie (SaaS, néobanque), mode (luxe, streetwear), éducation (école, crèche), santé (clinique, vétérinaire), immobilier, agences et portfolios (agence, photographe, portfolio, art afro-contemporain), musique et jeux (festival, podcast, esport), voyage (hôtel, aventure), beauté (yoga, spa, skincare), services (avocats, coworking, BTP, logistique), associations (ONG, communauté spirituelle), mariage, presse et édition (magazine, éditeur, musée), automobile, nature (ferme bio, solaire).

## Contrôle de diversité
`packs/audit.js` : `auditPack` (balises supprimées par le filtre, liens morts, un seul h1, alt, limite 20 000 car.) et `auditDiversity` : **empreinte à 8 axes** (navigation, hero, grille, paire typographique, formes, animation, rythme, composant signature) ; deux thèmes ne partagent jamais plus de 3 axes, jamais la même paire de polices ni la même palette dominante. Matrice complète : `docs/themes/MATRICE_ANTI_CLONE.md` (régénérée par `node scripts/themes-matrice.js`, qui échoue si une règle est violée). Vérification : `node -e 'console.log(require("./src/marketing/themes/library").problems())'` doit afficher `[]`.

## Personnalisation et retour arrière
Préférences → Thèmes des sites web → thème → Options (variables `--pk-*`, attributs `data-pk-*`). « Rétablir les valeurs d'origine » et « Revenir au thème précédent » restaurent l'état antérieur.

## Sites existants
Aucun contenu touché : chaque site garde le manifeste de son thème actif (`cms_themes`) ; l'ancien thème continue de s'afficher et le changement reste réversible.

## Ajouter un thème
Créer `packs/<clé>/` sur le modèle de `packs/arene/`, lancer `tests/themes-packs.test.js`, contrôler le rendu à 320, 390, 768, 1024, 1440, 1920 px.

## Limites connues
- Les pages du site principal (sans site rattaché) n'appliquent pas encore le CSS d'un paquet.
- Contrôles visuels réalisés surtout à 390 et 1440 px ; 320, 768, 1024 et 1920 px mesurés (absence de débordement) pour une partie seulement des pages.
- Pas de photographies : toutes les illustrations sont des SVG/CSS dessinés pour chaque thème (le filtre de sécurité des blocs HTML interdit les images externes). Les photos de l'utilisateur s'ajoutent par la médiathèque.
- Les composants signature (calculateurs, simulateurs, quiz, lecteurs, planning, panier fictif) fonctionnent dans le navigateur avec des données de démonstration ; aucun ne réalise de paiement, don, réservation ou inscription réels : l'étape finale envoie un récapitulatif vers le formulaire de contact.
- Le filtre de sécurité retire `input`, `button`, `label`, `id`, `hidden` des blocs : les champs interactifs sont construits par le JavaScript du thème ; sans JavaScript, certains panneaux s'affichent tous ensemble.
- Le JavaScript de plusieurs thèmes dépasse la cible initiale de 8 Ko (jusqu'à 21 Ko) ; il est servi compressé et chargé uniquement par le thème actif (limite testée : 25 Ko).
- Lighthouse n'est pas installé dans l'environnement : les performances n'ont pas été mesurées par ce moyen.
- Le bloc de formulaire natif du moteur n'apparaît pas dans le banc d'essai des aperçus : son habillage a été écrit mais vérifié seulement sur le site réel.
