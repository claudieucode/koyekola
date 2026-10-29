# Audit du catalogue de widgets de KOLAKISA (mission 8)

*Branche `widgets-catalogue`, partie de `origin/main` = `738322d`. Les rapports des missions 1 à 7 (`KOLAKISA_CORE_*`, `PROPERTY_CONTROLS_*`, `LAYOUT_RENDERING_*`, `RESPONSIVE_*`, `GLOBAL_STYLES_*`, `VISUAL_EDITING_*`, `PERSISTENCE_*`) ont été lus avant de modifier quoi que ce soit ; leurs interfaces (historique, `change()`, `patchCanvas`, enregistrement avec révision, `saveNow()`) ont été réutilisées sans modification.*

## 1. Ce que l'audit a trouvé en une phrase

Le catalogue est solide : **sur 92 types d'éléments, l'audit n'a trouvé aucun défaut de rendu, de publication, de responsive, de sécurité ni d'accessibilité de base**, et **cinq défauts réels dans l'éditeur** : **le canevas pouvait disparaître** quand deux rendus se chevauchaient sur une page lourde (D5, le plus grave, trouvé grâce à la mesure de performance), une copie d'« Ancre de menu » qui rendait toute la page impossible à enregistrer (D4), une saisie perdue sans message (D1), un champ muet (D2), et des boutons à deux champs qui disparaissent sans explication (D3). Tous sont corrigés ; D1 à D4 sont couverts par un test qui échouait avant, D5 par la mesure de performance (échec intermittent avant, 8 réussites sur 8 après — voir les limites).

## 2. Architecture réelle du catalogue

Il n'y a **pas** de second moteur : un seul registre alimente le serveur, l'éditeur et la page publiée.

```
src/marketing/pages/nodes.js  (2 098 lignes)
 ├─ NODE_TYPES   92 types : label, category, props(p, at, h) = validateur / normalisateur du contenu du widget
 ├─ PALETTE      icône, contenu de départ (blank), « asks » = choix demandé à l'insertion (image, adresse, formation…)
 ├─ WIDGETS      groupe de bibliothèque + mots de recherche
 ├─ CUSTOM_WIDGETS  25 widgets déclarés par schéma (src/marketing/pages/widgets/*.js : 16 fichiers) : schema, template, status, version
 ├─ STYLE_PROPS  110 propriétés de style communes à tous les widgets (mission 2)
 ├─ parts.js     PARTS : sous-éléments stylables séparément pour 50 types (image, titre, bouton d'une carte…)
 └─ editorSpec() description envoyée à l'éditeur (types, catégories, parties, limites : 400 éléments, profondeur 8)

public/js/page-builder.js  (≈ 8 100 lignes)
 ├─ renderElements()   bibliothèque (boutons .pb-pal-item[data-widget])
 ├─ addElement(type)   insertion (dialogue si « asks »), addItems → change() → historique + patchCanvas
 ├─ inspecteur         un « case "<type>" » par widget (champs de contenu) + onglets Style / Avancé communs
 ├─ duplicateSelected / reId / reIdAll   identifiants neufs, ancres, interactions remappées
 └─ window.__pb        lecture du document, de la sélection, de l'état « à enregistrer »

views/marketing-public/_node.ejs + public/js/landing.js   rendu serveur (canevas ET page publiée) + comportements (onglets, carrousels, compte à rebours…)
```

Chaîne vérifiée pour chaque widget : **contrôle → document de l'éditeur → CSS/rendu du canevas → PUT brouillon (validateur du widget) → rechargement → publication → `/p/<page>`**. Le canevas et la page publiée utilisent le même gabarit (`_node.ejs`) et la même fonction `pageCss` : la différence volontaire est le mode « éditeur » (aide « Aucun titre… » dans la table des matières, boutons désactivés).

### Familles de widgets (92 types)

| Catégorie | Nombre | Exemples |
|---|---|---|
| Structure | 8 | conteneur, colonnes, colonne, grille, pile, groupe, espace, séparateur |
| Texte | 11 | titre, texte, liste, citation, code, badge, chronologie, alerte, liste d'icônes, tableau, titre animé |
| Média | 10 | image, galerie, vidéo, audio, carrousel, points d'intérêt, carte, boîte d'image, boîte d'icône, icône |
| Interaction | 15 | bouton, lien, accordéon, onglets, menu, bascule, fil d'Ariane, réseaux, partage, fenêtre, infobulle, boîte retournable, table des matières, barre de lecture, ancre |
| Marketing | 33 | progression, compteur, témoignage, tarif, compte à rebours, formulaire, évaluation, diaporama, carrousels, panier, appel à l'action, Facebook, bouton flottant, lien en bio, Lottie, carte de profil, lire la suite, listes dynamiques, éléments d'article, plan du site, texte sur tracé, playlist vidéo… |
| Avancé | 2 | HTML (réservé aux administrateurs : permission `pages.code`), contenu intégré |
| Contenu dynamique | 10 | derniers articles, formations, recherche, compte, texte dynamique, logo, contenu d'article, filtre, titre du site, copyright |
| Formations | 3 | formation, bouton d'achat, avis |

Détail complet, avec identifiants, propriétés lues et tests préexistants : `KOLAKISA_WIDGETS_INVENTORY.md` (généré depuis le code).

### Points d'architecture utiles à connaître

* **Quatre éléments dépendent de données réelles du site** (`course`, `addtocart`, `courserating`, `signupform`) : l'éditeur demande une formation ou un formulaire à l'insertion.
* **Onze éléments demandent un choix à l'insertion** (`asks`) : image, galerie, vidéo, audio, carrousel, contenu intégré, points d'intérêt, carte, boîte d'image, évaluation, ancre.
* **Le HTML sécurisé** (`html`) est filtré (`sanitizeHtmlBlock`) et réservé aux administrateurs.
* **Un élément « personnalisé »** (`CUSTOM_WIDGETS`) porte un statut ; 15 sont `operational`, 10 n'ont pas de statut déclaré (éléments d'article, listes dynamiques, menu CMS, mini-panier, carte de profil).
* **Doublons / alias / abandons** : aucun alias, aucun doublon, aucun composant abandonné. Les trois tables `NODE_TYPES`, `WIDGETS`, `PALETTE` couvrent exactement les mêmes types (contrat `widgets-contrat`). Pas de widget présent dans d'anciennes pages et absent du catalogue : les anciens blocs « section » (`legacy`) sont des sections entières, hors de ce périmètre.

## 3. Méthode

Rien n'a été déclaré « validé » parce que le code existe. Chaque affirmation vient d'un test exécuté dans **Chrome 150 réel** (Playwright) contre un **vrai serveur** de test avec sa base :

| Dimension | Test (nouveau) | Portée |
|---|---|---|
| Cycle de vie dans l'éditeur | `widgets-editeur-navigateur` | insertion par clic dans la vraie bibliothèque, identifiant, sélection, Ctrl+D, annuler / rétablir, Suppr, enregistrement serveur, rechargement — **88 éléments** |
| Publication et responsive | `widgets-publie-navigateur` | tous les widgets publiés, contenu de départ puis contenu difficile (textes de 140 caractères sans espace, phrases longues), **8 largeurs** (320, 375, 767, 768, 1023, 1024, 1440, 1920) ; débordement, élément masqué, erreurs de script ; témoin qui prouve que le contrôle détecte un débordement |
| Interactions publiées | `widgets-interactions-navigateur` | 19 parcours : accordéon, bascule, lire la suite, onglets (ARIA, flèches, Début/Fin), fenêtre (Échap, clic extérieur, retour du focus), infobulle, boîte retournable, 4 carrousels, galerie, points d'intérêt, compte à rebours, compteur, recherche, table des matières, playlist, titre animé, partage, ancre, barre de lecture |
| Liens | `widgets-liens-navigateur` | liens de tous les widgets : internes suivis (HTTP), externes en https, `noopener`, aucun `javascript:` |
| Accessibilité de base | `widgets-accessibilite-navigateur` | nom accessible de tout contrôle, `alt`, titre des cadres, identifiants uniques, pas de `tabindex` positif, dialogues nommés, repère de focus au clavier ; témoin |
| Sécurité | `widgets-securite-navigateur` | 1 092 charges hostiles (balise + gestionnaire, script, `javascript:`, attribut injecté) dans **chaque champ texte de chaque widget** ; refusées avec message ou neutralisées ; **page publiée et aperçu** chargés dans Chrome ; témoin |
| Réglages de contenu | `controles-contenu-navigateur` (mode complet **réparé**) | chaque liste, case et champ de l'inspecteur de 88 types modifie le document, ne touche pas au reste et survit au rechargement |
| Performance | `widgets-performance-navigateur` | pages de 10, 60, 200 et 380 widgets variés ; mémoire |
| Régressions des défauts | `widgets-corrections-navigateur` | un test par défaut corrigé |

Aucune mesure de simple chaîne CSS : les débordements et la visibilité sont lus sur les **dimensions et styles calculés** du navigateur.

## 4. Ce que l'audit n'a PAS fait

Voir `KOLAKISA_WIDGETS_LIMITATIONS.md` : services tiers (vidéo, carte, Facebook, Lottie) non joignables dans les tests, données réelles du site (articles, panier, compte) non exercées, formation / formulaire réels non créés, navigateurs Firefox / Safari / tactile absents, suite complète non relancée.
