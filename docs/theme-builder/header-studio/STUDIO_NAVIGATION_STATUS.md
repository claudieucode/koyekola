# Studio de navigation des en-têtes : état, matrice et architecture (12 novembre 2026)

Ce document suit la mission « studio professionnel de conception de navigation ». Il dit ce qui existait, ce qui est livré dans ce lot et ce qui reste. Il n'affirme rien qui ne soit pas testé.

## 1. Limites de l'étude des logiciels de référence
Je n'ai pas relu aujourd'hui les documentations officielles complètes d'Elementor Pro, JetMenu, Max Mega Menu, UberMenu, Bricks et Webflow (les références Elementor déjà documentées dans ce dépôt : `elementor-header-reference.md`, `ELEMENTOR_THEME_BUILDER_REFERENCE.md`). La matrice ci-dessous compare donc **les capacités connues de ces outils (de mémoire, à confirmer)** à ce que Kolakisa fait réellement, vérifié dans le code. Une étude détaillée source par source reste à faire (lot suivant).

## 2. Matrice : existant, livré dans ce lot, manquant
| Capacité | Avant ce lot | Livré dans ce lot | Reste à faire |
|---|---|---|---|
| Style par partie du menu (liste, lien, bouton mobile) avec états survol / focus | Oui (parties) | + traits du bouton, panneau des sous-menus, liens des sous-menus, indicateur, icônes, badges, panneau des méga-menus | Contrôles de timeline |
| **Style individuel d'un lien** (couleur, fond, typo, espacement, bordure, rayon, ombre, opacité…) | Non : réglages communs à tous les liens | **Oui** : `props.itemStyles`, clé par lien (`p0`, `p2-1`, ou `m<id>` du menu du CMS) | Contrôle visuel du choix du lien directement dans l'aperçu |
| États par lien : normal, survol, focus, clic, page courante | Partiel (survol/focus communs) | **Oui**, indépendants par lien | « Désactivé », « visité » |
| Réglages par écran pour un lien (ordinateur, tablette, mobile, grand écran) | Non | **Oui** (grammaire de style existante) | Écrans personnalisés au-delà des 4 clés |
| Sous-menu / méga-menu / icône / badge **d'un lien précis** | Non | **Oui** (parties `sub`, `icon`, `badge` d'un lien) | Constructeur visuel de colonnes de méga-menu par lien (le panneau est un composant du site, existant) |
| Panneau du menu mobile (fond, largeur, fond assombri, fermeture, liens) | Mode et côté seulement | **Oui** : `props.panelStyles` (panneau, fond assombri, fermeture, liste, liens) | Animations d'entrée/sortie personnalisées, panneau flottant centré |
| Copier / coller le style d'un lien, réinitialiser un lien | Non | **Oui** (inspecteur) | Copier seulement typo / couleurs / animations |
| Méga-menu (un composant par rubrique du CMS, hover/clic, largeur) | Oui | Inchangé | Contenu dynamique (produits, catégories) |
| Hamburger : modèle d'icône, texte, forme, tiroir/plein écran/panneau du bas | Oui | + dimensions et épaisseur des traits, état survol, fond du bouton | Morphing personnalisé, SVG personnalisé |
| Sticky / transparent / réduit / masqué au défilement, logo alternatif | Oui | Inchangé | Seuils numériques, masquer en descendant / afficher en remontant |
| Accessibilité : clavier, Échap, focus piégé dans le tiroir, ARIA | Oui | Conservé et testé | Audit lecteur d'écran réel |
| Motion : animation d'entrée, survol, transitions | Oui (effets de mouvement généraux) | Les transitions sont réglables par lien (durée dans les parties) | Séquences / cascade / timeline dédiées au menu |
| Breakpoints personnalisés nommés | Quatre écrans fixes + seuil de repli du menu | Inchangé | Écrans personnalisés |

## 3. Architecture (modèle de propriétés)
Ordre de priorité, du plus général au plus précis : styles du site (charte) → modèle d'en-tête → réglages du widget menu → **partie** du menu (ex. « Liens ») → **réglage individuel du lien** (`itemStyles`) → état (survol, focus, clic, page courante) → écran. Une valeur plus précise remplace la plus générale ; supprimer une valeur la rend à la couche inférieure (aucune valeur « fantôme »).

Stockage (dans le JSON du widget menu, donc avec l'en-tête, par site, versionné par les versions existantes) :
```
props.itemStyles = { "<clé du lien>": { link|sub|icon|badge: { styles:{écran:{…}}, states:{état[@écran]:{…}}, current:{écran:{…}} } } }
props.panelStyles = { panel|backdrop|close|list|links: { styles, states } }
```
* Clé du lien : `p<position>` (`p1`, `p2-0` pour un sous-lien) ou `m<identifiant du menu du CMS>` (stable si l'ordre du menu change). Les deux sont acceptées ; le rendu pose `data-ik` et `data-mid` sur chaque `<li>`.
* Validation : la même grammaire fermée que tous les éléments (aucun CSS libre, aucune ressource externe, valeurs bornées). Une clé invalide ou une partie inconnue est refusée.
* Rendu : une règle CSS par lien et par état, écrite une seule fois dans la feuille de la page ; aucun JavaScript supplémentaire (sauf une classe de rattachement `kw-pn-<id>` posée sur le panneau mobile, qui sort du menu à l'ouverture). Aucun style n'est écrit sur les liens non personnalisés.
* Isolation multisite : les réglages sont dans l'en-tête du site ; un autre site ne les voit jamais.

## 4. Guide d'utilisation (éditeur)
Sélectionnez le menu dans l'en-tête, ouvrez « Style d'un lien (individuel) » : choisissez le lien (● = déjà personnalisé), la partie (lien, sous-menu, icône, badge), l'état et l'écran, puis saisissez les valeurs (couleur `#rrggbb`, tailles `16px`…). Un champ vide retire la valeur. « Panneau du menu mobile » dans la liste des liens règle le tiroir. Réinitialiser, copier et coller le style d'un lien sont disponibles.

## 5. Tests
* `tests/menu-liens-individuels.test.js` (7) : validation, enregistrement, règles par lien/état/écran/page courante/sous-menu/badge, clé du CMS, refus des valeurs dangereuses, aucun style sur les liens non réglés, panneau mobile.
* `tests/header-widgets-navigateur.test.js` (+2, vrai Chrome) : seul « Boutique » est personnalisé (couleur, graisse, fond, arrondi, survol) et « Accueil » et « Contact » restent intacts ; tiroir mobile stylé (fond, largeur 300 px, fond assombri, fermeture, liens) et fermé par Échap.
* Limite honnête : le panneau de l'inspecteur (`linkStylePanel` dans `public/js/page-builder.js`) est vérifié par contrôle de syntaxe et par les tests existants de l'éditeur, pas encore par un test piloté dans Chrome.

## 6. Prochains lots (non faits)
Séquences d'animation en cascade et timeline ; comportements de défilement (afficher en remontant) ; constructeur de méga-menu par lien avec contenu dynamique ; écrans personnalisés ; copier uniquement typo/couleurs ; audit lecteur d'écran ; étude détaillée source par source des six logiciels.
