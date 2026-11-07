# HEADER — Matrice de couverture et de traçabilité

Date : 2026-11-07 (état « documentation terminée, développement non commencé »).
Règle : aucune ligne n'est **testé** ou **validé** sans preuve. « Source » renvoie aux fichiers de ce dossier (les URL Elementor y sont citées une à une).
Statuts : `documenté` (étudié, pas encore développé) · `développé` · `testé` (preuve citée) · `validé` (testé + vérifié en navigateur + audit) · `exclu` (justifié).
Colonnes condensées : **Contrôles** et **Responsive** sont détaillés dans les fichiers 02, 04, 07 ; ils ne sont répétés ici que s'ils changent le développement.

## 1. Structure et conteneurs
| ID | Référence Elementor | Source | Comportement attendu | Équivalent Kolakisa | Tests prévus | Statut | Preuve |
|---|---|---|---|---|---|---|---|
| H-001 | Conteneur Flexbox (direction, wrap, justify, align, gap) | 03 | Disposer des éléments en ligne/colonne | `container`/`group`/`stack` (existant) | Rendu des 4 sens ; retour à la ligne | documenté (existant, preuve à rattacher) | — |
| H-002 | Conteneur imbriqué | 03 | Rangées/zones imbriquées | `MAX_DEPTH = 8` | Profondeur 8 acceptée, 9 refusée | documenté (existant) | — |
| H-003 | Largeur boxed / pleine | 03 | Contenu encadré ou pleine largeur | `container` `full:true` | Rendu des deux modes | documenté (existant) | — |
| H-004 | Hauteur min, débordement, z-index, position | 03 | Réglages de boîte | 86 propriétés de style | Persistance + rendu | documenté (existant) | — |
| H-005 | Grille | 03 | Grille de colonnes | `grid` (existant) | Rendu 2–4 colonnes | documenté (existant) | — |
| H-006 | Ajouter / déplacer / glisser-déposer / dupliquer / copier-coller / supprimer | 03, 04 | Édition directe sur le canevas | éditeur (existant) | Parcours navigateur sans perte d'élément | documenté (existant) | — |
| H-007 | Masquer / verrouiller / renommer (Navigator) | 03, 04 | Panneau de structure | calques (existant) | Navigateur | documenté (existant) | — |
| H-008 | Copier/coller le style | 04 | Réutiliser un style | existant (par groupe) | Navigateur | documenté (existant) | — |
| H-009 | Enregistrer comme élément réutilisable | 03 | Template d'élément | composants (existant) | Navigateur | documenté (existant) | — |
| H-010 | Calques orientés rangées/zones d'un en-tête | 03 | Lire la hiérarchie d'un coup d'œil | Vue en-tête dans les calques | Navigateur | documenté (à développer, L7) | — |

## 2. Widgets d'identité
| ID | Référence Elementor | Source | Comportement | Équivalent Kolakisa | Tests prévus | Statut | Preuve |
|---|---|---|---|---|---|---|---|
| H-020 | Site Logo | 02 | Logo + lien accueil | `sitelogo` | Rendu + lien | documenté (existant) | `theme-builder-entetes-bibliotheque` (chaque en-tête a une identité) |
| H-021 | Site Title / Tagline | 02 | Titre / description | `sitetitle` ; description : à vérifier | Rendu | documenté (existant partiel) | — |
| H-022 | Logo par état (clair/sombre/transparent) | — (bonne pratique ; non documenté Elementor) | Variante selon l'état de l'en-tête | `sitelogo` + variantes | Changement au défilement ; isolation | testé | `tests/header-etats-navigateur.test.js` : logo « en haut de page » → logo principal après défilement ; logo mobile ≤ 767 px ; un seul affiché ; en-tête ordinaire : logo principal |

## 3. Navigation
| ID | Référence Elementor | Source | Comportement | Équivalent Kolakisa | Tests prévus | Statut | Preuve |
|---|---|---|---|---|---|---|---|
| H-030 | Menu horizontal / vertical / déroulant | 08 | Navigation principale | `menu`, `cmsmenu` | Rendu 3 dispositions | documenté (existant partiel) | `apparence-menus*` (gestion des menus) |
| H-031 | Menu lié aux menus réels | 08 | Aucun système parallèle | `nav_locations` (existant) | Menu d'un autre site introuvable | testé | `tests/apparence-menus-integration.test.js` |
| H-032 | Sous-menus multi-niveaux | 08 | Profondeur > 1 | profondeur 3 | Rendu + clavier | testé | `tests/header-menus-navigateur.test.js` : trois niveaux rendus, troisième niveau ouvert au survol, bascules dans le tiroir (la limite de 3 niveaux est celle du gestionnaire de menus) |
| H-033 | Icônes, badges, descriptions, images dans le menu | 08 | Éléments enrichis | champs par `nav_item` | Rendu + échappement | développé (icône, description, classe CSS et attribut title : testés ; image et badge : NON faits) | `tests/header-menus-navigateur.test.js` : icône, description, classe du troisième niveau. Image (`media_id`) et badge : à faire (écart assumé, voir plan) |
| H-034 | Hamburger / menu mobile | 08 | Repli sous un seuil | `.kw-menu-burger` (existant, dépliage en place) | aria-expanded, Échap | testé | `tests/header-menus-navigateur.test.js` : bouton « Menu » (≤ 767 px), aria-expanded, Échap, focus rendu au bouton |
| H-035 | Menu hors-canvas (tiroir) | 08, 09 | Panneau latéral à contenu libre | `drawer` | Focus piégé, Échap, retour du focus | testé | `tests/header-menus-navigateur.test.js` : tiroir à droite/à gauche, fond assombri, défilement bloqué, focus piégé (Tab/Maj+Tab sur 14 pas), Échap/fond/bouton Fermer, fermeture au passage en grand écran, mouvement réduit ; réglage dans l'éditeur : `tests/header-reglages-navigateur.test.js` |
| H-036 | Méga-menu (panneau composé) | 08 | Colonnes, images, texte, boutons, cartes | `megapanel` = composant du site relié à une rubrique du menu (`props.mega`), éditeur existant | Survol/clic/tactile/clavier/mobile | testé | `tests/header-megamenu-navigateur.test.js` : panneau composé dans l'éditeur (composant du site), ouvert au survol / clic / clavier, style propre, sous la rubrique ou pleine largeur, accordéon mobile, recalé dans l'écran ; éditeur : `tests/header-reglages-navigateur.test.js` (créer, modifier, retirer) ; isolation : le panneau d'un autre site n'est jamais affiché |
| H-037 | Déclencheurs survol / clic / tactile | 08 | Ouverture des sous-menus | runtime `kw-header.js` | Navigateur (3 modes) | testé (clavier, survol, clic ; un vrai écran tactile n'a pas été testé) | `tests/header-megamenu-navigateur.test.js` : survol, clic, clic extérieur, focus qui sort ; `header-menus-navigateur` : bascules dans le tiroir |
| H-038 | Navigation au clavier des menus | 08, 11 | Flèches, Échap, focus visible | runtime | Navigateur | testé | `tests/header-megamenu-navigateur.test.js` + `tests/header-menus-navigateur.test.js` : Bas entre dans le panneau, Échap referme et rend le focus, flèches/Début/Fin dans les menus, focus piégé dans le tiroir |
| H-039 | Menu secondaire / emplacements | 08 | Plusieurs menus | emplacements header/footer/mobile | Affectation | testé | `tests/apparence-menus-wp.test.js` |

## 4. Éléments interactifs et e-commerce
| ID | Référence Elementor | Source | Comportement | Équivalent Kolakisa | Tests prévus | Statut | Preuve |
|---|---|---|---|---|---|---|---|
| H-040 | Bouton / Icône / Bouton avec icône / CTA | 02 | Actions | `button`, `icon`, `cta` | Rendu + états | documenté (existant) | — |
| H-041 | Barre de recherche | 02, 09 | Formulaire | `search` | Soumission | testé | `tests/header-recherche-navigateur.test.js` : le widget Recherche existant est inchangé (balisage d'origine) |
| H-042 | Recherche plein écran | 09 | Superposition de recherche | peau plein écran | Focus, Échap, mobile | testé | `tests/header-recherche-navigateur.test.js` : loupe → fenêtre plein écran, focus dans le champ, Échap / fond / bouton Fermer, focus rendu à la loupe, mouvement réduit |
| H-043 | Résultats instantanés | 09 (NON VÉRIFIÉ chez Elementor) | Suggestions pendant la frappe | endpoint JSON limité | Limites, isolation | testé | `tests/header-recherche-navigateur.test.js` : suggestions dès 2 caractères, publiés seulement, 6 au plus, texte sans exécution de HTML, flèches + Entrée, annonce aux lecteurs d'écran ; route `/recherche/suggestions` (mêmes règles de portée que `/recherche`, jamais en cache) |
| H-044 | Connexion / compte / avatar / déconnexion | 02, 09 | Compte visiteur | `account` | Invité / membre | testé | `tests/header-compte-navigateur.test.js` : invité (Se connecter) et membre réel (menu) ; widget sans option inchangé |
| H-045 | Menu utilisateur déroulant | 09 | Menu compte | menu compte | Navigateur | testé | `tests/header-compte-navigateur.test.js` : menu déroulant (Mon compte, Panier, Se déconnecter en POST), Entrée / Tab / Échap / clic extérieur, focus rendu au titre |
| H-046 | Panier + nombre + montant | 02, 09 | Compteur réel | `minicart` (lien + compteur) | Ajout produit → compteur | développé (panier des FORMATIONS : nombre réel testé ; panier de la boutique produits non branché) | `tests/header-minipanier-navigateur.test.js` : compteur réel du panier du visiteur ; le montant est dans le tiroir (total) |
| H-047 | Mini-panier (tiroir) | 09 | Aperçu des articles | tiroir branché sur le panier réel | Données réelles ; vide | développé (tiroir branché sur le panier des FORMATIONS, testé ; le panier de la boutique de produits n'est PAS branché) | `tests/header-minipanier-navigateur.test.js` : contenu et total du vrai panier, liens /commande et /panier, panier vide, invité, clavier, widget existant inchangé |
| H-048 | Liste de souhaits / comparaison | 09 | Modules compatibles | **aucun module** | — | exclu (pas de module à connecter ; pas de simulation) | — |
| H-049 | Déclencheur de popup / tiroir | 09 | Ouvrir un panneau | `modal` (déclencheurs existants) | Clic → ouverture | documenté (existant) | — |
| H-050 | Icônes sociales | 02 | Réseaux | `social` | Rendu | documenté (existant) | — |
| H-051 | Séparateur / espaceur / texte / titre / image | 02 | Contenu | `divider`, `spacer`, `text`, `heading`, `image` | Rendu | documenté (existant) | — |
| H-052 | HTML personnalisé sécurisé | 02, 13 | Contenu libre contrôlé | `html` (admin seulement) | Rejet des scripts | documenté (existant) | — |
| H-053 | Barre d'annonce, horaires, contact, bouton d'appel | 02 (NON VÉRIFIÉ chez Elementor) | Messages promotionnels | composition de widgets existants | Rendu | documenté (L5) | — |
| H-054 | Lottie / vidéo / SVG animé | 02 | Médias animés | `lottie`, `video` (existant) | Rendu + reduced-motion | documenté (existant) | — |
| H-055 | Sélecteur de langue / devise | 02, 09 | Commutation | — | — | exclu (pas de multilingue public ; Elementor : extensions) | — |

## 5. Comportements, états, mouvement
| ID | Référence Elementor | Source | Comportement | Équivalent Kolakisa | Tests prévus | Statut | Preuve |
|---|---|---|---|---|---|---|---|
| H-060 | Sticky / fixe | 06 | En-tête collé en haut | `position: sticky` (existant) | Classe, une seule enveloppe | testé | `tests/theme-builder-en-tete-collant-public.test.js` |
| H-061 | Transparent / superposé | 06 | Sur le visuel | `position: absolute` (existant) | Jamais les deux | testé | `tests/theme-builder-en-tete-collant-public.test.js` |
| H-062 | Seuil de défilement réglable, décalage (offset) | 06 | Déclencheur d'état | `behavior.threshold/offset` | Navigateur | testé | `tests/header-reglages.test.js` (unitaire), `tests/header-reglages-navigateur.test.js` (éditeur), `tests/header-etats-navigateur.test.js` (site publié) : seuil 40 px respecté (sous le seuil : pas d'effet), décalage 24 px, niveau d'empilement 77 |
| H-063 | Réduction de hauteur | 06 (Elementor : CSS, pas de contrôle natif) | Rétrécissement au défilement | `shrink` (existe via `headerFx`, sans interface) | Pas de saut de contenu | testé | `tests/header-reglages-navigateur.test.js` : effet « réduire » réglé dans le panneau, enregistré, rechargé, publié ; ancien format lu à l'identique (`theme-builder-en-tete-collant-public`) |
| H-064 | Masquer en descendant / réapparaître | 06 (Elementor : EXTENSION) | Gagner de la place | `hideOnScrollDown` | Défilement ↓↑ ; focus clavier | testé | `tests/header-etats-navigateur.test.js` : masqué en descendant, réapparaît en remontant, focus clavier le révèle, jamais masqué en haut, sans transition en mouvement réduit |
| H-065 | État normal / transparent / défilé / sticky / mobile / menu ouvert | 06 | États stylables | états `top`/`scrolled`/`menuOpen` | Styles par état | testé | `tests/header-etats-navigateur.test.js` (haut / défilé / logos), `tests/header-menus-navigateur.test.js` (classe `is-menu-open`), `tests/header-reglages.test.js` (CSS des états défilé et menu ouvert) |
| H-066 | Hauteur réservée, z-index, empilement | 06 | Pas de saut de contenu | `--kw-hdr-top`, position collée dans le flux (pas d'espaceur) | CLS < 0,1 | testé | `tests/header-performance-navigateur.test.js` : CLS < 0,1 pour les cinq modes (collé, fixé, réduit, masquable, superposé plein) ; le mode « fixé » est réalisé dans le flux (un en-tête hors flux avec espaceur ajouté par script mesurait 0,16) |
| H-067 | Animations d'entrée, transitions (durée, délai, courbe) | 06 | Apparition | Motion Studio (existant) | Déclenchement ; durée | documenté (existant) | — |
| H-068 | Effets de défilement (vertical, horizontal, parallaxe, opacité, échelle) | 06 | Liés au scroll | `kw-effects.js` (existant) | Navigateur | documenté (existant) | — |
| H-069 | Effets de souris (suivi, 3D tilt) | 06 | Profondeur | `kw-effects.js` (existant) | Navigateur ; écran tactile | documenté (existant) | — |
| H-070 | `prefers-reduced-motion` | 06, 11 | Désactiver les animations | existant dans `kw-effects.js` | Émulation | documenté (existant) | — |

## 6. Style et responsive
| ID | Référence Elementor | Source | Comportement | Équivalent Kolakisa | Tests prévus | Statut | Preuve |
|---|---|---|---|---|---|---|---|
| H-080 | Fonds (uni, dégradé, image), typographie, bordures, ombres, transformations | 05 | Style complet | 86 propriétés de style (existant) | Persistance + rendu | documenté (existant) | — |
| H-081 | États normal / survol / focus / actif / ouvert / désactivé | 05 | États visuels | `STATES` (hover/focus/active existants) ; ouvert/désactivé à ajouter | Rendu par état | développé (survol/focus/clic existants + « Après défilement » ; « ouvert/désactivé » restent à ajouter) | `tests/header-reglages.test.js` (CSS généré) ; `header-reglages-navigateur` (état proposé dans l'éditeur) |
| H-082 | Valeurs responsive indépendantes | 07 | Bureau ≠ tablette ≠ mobile | `BREAKPOINTS` (héritage descendant) | Le mobile ne modifie pas le bureau | testé | `tests/controles-numeriques-navigateur.test.js` (écrans : chacun garde sa valeur) ; `tests/header-responsive-navigateur.test.js` : un réglage mobile n'altère pas le bureau |
| H-083 | Visibilité par appareil | 07 | « Masquer sur » | `hideOn` | Jamais les trois à la fois | testé | `tests/header-responsive-navigateur.test.js` : élément masqué sur mobile, visible sur ordinateur et tablette |
| H-084 | Ordre des éléments par appareil, rangées par appareil | 07 | Réordonner | `order` par écran | Navigateur | testé | `tests/header-responsive-navigateur.test.js` : ordre naturel sur ordinateur, inversé sur mobile (propriété `order` par écran, déjà dans le moteur de styles) ; direction ligne → colonne |
| H-085 | Points de rupture configurables | 07 | Seuils | Points de rupture réglables par site (existant) ; seuils par défaut ≤1023 / ≤767 / ≥1920 | — | testé | Points de rupture RÉGLABLES PAR SITE (`settings.layout.breakpoints`) : `tests/responsive-largeurs-navigateur.test.js` + `tests/header-responsive-navigateur.test.js` (tablette ≤ 1279 px) |
| H-086 | Prévisualisation responsive réaliste | 07 | Aperçu par appareil | canevas par écran (existant) | Navigateur | testé | `tests/responsive-largeurs-navigateur.test.js` : concordance du canevas par appareil et de la page publiée |

## 7. Conditions, publication, versions
| ID | Référence Elementor | Source | Comportement | Équivalent Kolakisa | Tests prévus | Statut | Preuve |
|---|---|---|---|---|---|---|---|
| H-090 | Tout le site / accueil / pages / articles / archives / catégories / recherche / 404 | 10 | Où afficher | `conditions.js` (KINDS) | Inclusion/exclusion | testé | `tests/theme-builder-regles.test.js`, `theme-builder-contexte-rendu.test.js` |
| H-091 | Produits et archives produits (WooCommerce) | 10 | Pages boutique | `product`, `product_archive` | Module requis | testé | `tests/theme-builder-stockage.test.js` (module Commerce requis) |
| H-092 | Priorité et conflits | 10 (règle non documentée chez Elementor) | Un seul gagnant | `scoreOf`, `resolve`, `explain` | Précis > général ; égalité signalée | testé | `tests/theme-builder-regles.test.js` |
| H-093 | Aucune page avec deux en-têtes / sans en-tête par conflit | 10 | Cohérence | un gagnant + repli historique | Pas de doublon | testé | `tests/theme-builder-pied-unique.test.js` (équivalent pied), `theme-builder-site-principal.test.js` |
| H-094 | Condition utilisateur connecté / rôle | 10 (EXTENSION chez Elementor) | Selon le visiteur | condition « visiteur » | Invité vs membre, cache | testé | `tests/header-visiteur.test.js` (validation, évaluation, priorité, conflits) et `tests/header-visiteur-public.test.js` (invité et membre réels voient chacun leur en-tête ; page jamais en cache partagé) |
| H-095 | Brouillon / publication / dépublication / archivage | 01 | Cycle de vie | `store.js` | Statuts | testé | `tests/theme-builder-stockage.test.js` |
| H-096 | Versions et restauration | 01, 13 | Historique | `mk_tb_versions` (30) | Restauration non destructive | documenté (existant, preuve ligne par ligne à rattacher) | — |
| H-097 | Import / export | 13 | Portabilité | `portable.js` | Aller-retour | documenté (existant, test à rattacher) | — |
| H-098 | Aperçu sur un autre contenu | 01, 10 | Preview Settings | `/contenus-apercu` | Navigateur | documenté (existant) | — |
| H-099 | Isolation multi-sites | 13, 15 | Aucune fuite | `site_id IS ?` | 2–3 sites | testé | `tests/header-isolation.test.js` : réglages, états, panneaux de méga-menu et route `menu.json` isolés par site ; `theme-builder-site-principal`, `apparence-menus-integration` (existants) |

## 8. Qualité transversale
| ID | Référence | Source | Attendu | Équivalent Kolakisa | Tests prévus | Statut | Preuve |
|---|---|---|---|---|---|---|---|
| H-100 | `<header>`, `<nav>`, ARIA, focus visible, Échap | 11 | Accessible | runtime + gabarits | Audit clavier/lecteur d'écran | testé (repères, noms, focus, cibles ; lecteur d'écran réel NON testé) | `tests/header-accessibilite-navigateur.test.js` : `role="banner"`, navigation nommée, aucun lien/bouton sans nom (y compris tiroir ouvert), focus visible au clavier, cibles ≥ 44 px (bouton Menu, Fermer, bascules), `lang` |
| H-101 | Contrastes, alternatives textuelles | 11 | WCAG 2.1 AA (cible Kolakisa ; Elementor déclare 2.0 AA) | charte | Contrôle auto + manuel | développé (contraste du tiroir testé ≥ 4,5:1 ; contraste des en-têtes personnalisés non audité) | `tests/header-accessibilite-navigateur.test.js` (contraste du panneau du tiroir) |
| H-102 | Sécurité : HTML, attributs, contenus externes | 13 | Aucun script libre | grammaire fermée | Tests de rejet | documenté (existant, à compléter L8) | — |
| H-103 | Performance (DOM, CLS, INP) | 12 | Budget | un seul écouteur passif | Mesures | testé (CLS et tâches longues ; INP réel non mesuré) | `tests/header-performance-navigateur.test.js` |
| H-104 | Non-régression CMS / Theme Builder / éditeur / menus | 14 | Rien ne casse | suites existantes | `npm test` | documenté (L8) | — |

## Bilan (état au dernier lot construit) — chiffres recomptés par script
- Lignes : **72**. `testé` (preuve de test citée) : **35**. `développé` (partiel : reste à tester ou compléter, détail dans la ligne) : **5**. `validé` : **0** (la validation de bout en bout est celle de `HEADER_FINAL_AUDIT.md`).
- `documenté` (présent dans le code avant la mission ; preuve à rattacher ou non reprise) : **29**. `documenté (à développer)` : **1**. `exclu` (justifié) : **2**.
- **Lots construits** : L0 réglages d'en-tête · L1 états et comportements · L2 responsive (prouvé) · L3 menus, tiroir mobile · L4 méga-menu · L5 recherche plein écran + suggestions, menu du compte, mini-panier en tiroir (panier des formations) · L6 condition « visiteur » · L8 accessibilité, isolation, performance.
- **Non faits** : calques orientés rangées/zones (H-010), bascule d'état sur le canevas (G-15), pictogrammes de vignettes (G-16), image et badge d'un élément de menu (H-033), barre d'annonce / horaires / contact dédiés (H-053 : composition des widgets existants), mini-panier de la boutique de PRODUITS (H-047), test sur un vrai écran tactile et avec un lecteur d'écran réel.
