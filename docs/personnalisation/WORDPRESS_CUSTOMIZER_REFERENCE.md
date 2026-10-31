# Référence WordPress Customizer (vue d'ensemble pour la refonte de la personnalisation Kolakisa)

*Consultée le 26/10/2026 (étude TITAN XVIII), complétée le 31/10/2026. Étude détaillée et sourcée : `docs/wordpress-customizer/` (7 fichiers). Marques : **[Doc]** lu dans une page officielle · **[Connu]** connaissance générale non relue · **[Déduit]**. Aucun code source WordPress n'a été lu.*

## 1. Deux systèmes distincts
| | Customizer classique | Éditeur de site (thèmes blocs) |
|---|---|---|
| Accès | Apparence → Personnaliser [Doc] | Apparence → Éditeur (WP 5.9+) [Doc] |
| Modèle de données | Réglages (`theme_mod`/options) groupés en panneaux → sections → contrôles [Doc] | Modèles, parties de modèles, compositions, styles globaux (`theme.json`) [Doc] |
| Aperçu | Cadre de la vraie page, transport `refresh` ou `postMessage` [Doc/Connu] | Canevas de blocs |
| Persistance | Changeset (brouillon sauvegardé, planifiable) [Connu] | Entités de la base (modèles, styles globaux utilisateur) [Déduit] |

## 2. Fonctions pertinentes pour cette mission
| Fonction | Comportement WordPress | Niveau de preuve |
|---|---|---|
| Identité du site | Titre, slogan, logo, icône du site : section native | [Doc] |
| Couleurs / typographie | Natifs seulement si le thème les déclare (couleurs d'en-tête, fond) ; les thèmes blocs passent par les styles globaux | [Doc] |
| Menus | Création de menus, éléments imbriqués, **affectation à des emplacements déclarés par le thème** | [Doc] |
| Widgets | Zones (sidebars) déclarées par le thème, widgets classiques ou blocs | [Doc] |
| Page d'accueil | Page statique ou derniers articles | [Doc] |
| CSS additionnel | Champ libre filtré | [Doc/Connu] |
| En-tête / pied | **Pas natifs** : options du thème (classique) ou **parties de modèle** (thèmes blocs) | [Doc] |
| Aperçu en direct | Les contrôles `postMessage` mettent à jour sans recharger ; les autres rechargent le cadre | [Connu] |
| Brouillon / publication | Les modifications ne sont pas publiées avant « Publier » ; brouillon récupérable, planification, lien de partage | [Connu] |
| Responsive | Boutons Ordinateur / Tablette / Mobile (aperçu) ; valeurs par appareil seulement si le thème les propose | [Doc] |
| Contrôles conditionnels | `active_callback` : un contrôle n'apparaît que si une condition est vraie | [Connu] |
| Annulation / restauration | Révisions de changeset ; avertissement avant de quitter avec des modifications | [Connu] |

## 3. Point décisif pour ce chantier
Dans le Customizer **tout réglage est global au thème** : il n'existe pas de « modifier seulement cet élément » dans le Customizer. La modification d'un bloc unique se fait dans l'éditeur de blocs (réglages locaux du bloc), les styles de **bloc globaux** dans l'éditeur de site [Doc/Déduit]. WordPress sépare donc deux outils selon la portée ; Kolakisa doit faire de même et **dire laquelle s'applique**.

## 4. Natif vs thème/extension
Natif : identité, menus (création), widgets (mécanisme), page d'accueil, CSS additionnel, brouillon/publication. Dépend du thème : couleurs, typographie, en-tête, pied, options de mise en page, emplacements de menus, zones de widgets.

## 5. Limites de cette référence
Pages « Navigation / Patterns / theme.json détaillé » non lues ; versions 7.x citées par la doc ; les points [Connu] sont à revérifier avant de s'en servir comme argument.
