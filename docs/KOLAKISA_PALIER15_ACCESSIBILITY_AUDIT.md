# Palier 15 — Audit d'accessibilité

Date : 2026-10-29. Branche `palier15`, créée depuis `origin/main` (6c589dd5 : contient les Paliers 12, 13 et 14). Sites publics, administration et éditeur sont **documentés séparément** ci-dessous.

## Outils réellement disponibles
| Outil | Statut |
|---|---|
| axe-core, Lighthouse, pa11y | **Non installés** : non utilisés (aucune dépendance ajoutée) |
| Chrome via Playwright | Utilisé : sonde `scripts/a11y/audit-accessibilite.js` (écrite pour ce palier) |
| VoiceOver (lecteur d'écran macOS) | Présent sur la machine, **non utilisé** : non pilotable depuis ce terminal |
| Tests existants | `rendu-accessibilite-navigateur` (86 widgets : noms, alt, titres, repères), `widgets-accessibilite-navigateur`, `editeur-contraste-navigateur`, `espace-contrastes`, `editeur-blocs-a11y-perf-navigateur`, `accordeons-navigateur` |

## La sonde (limites assumées)
Contrôles **automatiques partiels**, ni exhaustifs ni équivalents à axe-core : noms accessibles (calcul approché), `alt`, titres (saut de niveau, vide, nombre de h1), repères, `lang`, `title`, identifiants en double, `tabindex` positif, champs sans libellé, **contraste WCAG 2.x** (couleurs calculées, alpha composité sur les fonds parents ; les textes sur image ou dégradé sont comptés « non évaluables » : 10 à 12 par page publique), **parcours Tab réel** (visibilité du focus, focus masqué par un élément superposé), animations infinies sous `prefers-reduced-motion`. Pages : 8 publiques, 16 d'administration, l'éditeur ; thèmes clair et sombre (le parcours Tab en clair seulement). **Mesures prises avec `reducedMotion: reduce`** pour ne pas mesurer des états en cours de fondu : des « défauts » de contraste ou de masquage apparus à la première exécution (1,0:1 à 3,3:1 sur des textes encore transparents) étaient des artefacts d'animation et ont été écartés.

## Défauts confirmés et corrigés
| # | Contexte | Gravité | Critère | Défaut | Cause racine |
|---|---|---|---|---|---|
| A1 | Public | Moyenne | 1.3.1 / 2.4.6 | Pied de page en `h4` sous un `h2` (saut de niveau) sur **toutes** les pages publiques ; états vides en `h3` juste après le `h1` (catalogue, FAQ, mes formations) ; idem formations du formateur | Niveau choisi pour la taille visuelle |
| A2 | Administration | Faible | 1.3.1 / 4.1.2 | Deux repères `<nav>` sans nom sur chaque page du tableau de bord | `aria-label` absent sur `.dash-nav` |
| A3 | Public + admin | Moyenne | 3.3.1 / 4.1.3 | Messages d'erreur serveur (connexion, inscription, mot de passe oublié/réinitialisé, formulaire marketing public, formation) sans `role="alert"` : non annoncés | Markup oublié sur 6 vues (les autres l'avaient) |
| A4 | Public | **Élevée** | 2.4.11 (WCAG 2.2) | Le bandeau de consentement, fixé en bas, **recouvrait** le lien « Cookies » du pied de page, « Créer un compte » et des champs au clavier (`Tab`) : l'élément focalisé restait derrière (7 cas sur 5 pages) | Aucun espace réservé en bas du document : le dernier lien ne peut pas remonter au-dessus du bandeau fixe |
| A5 | Admin (Marketing) | Moyenne | 2.4.1 / 2.4.7 | Lien d'évitement (z-index 100) **derrière** la barre d'administration fixe (z-index 110) : invisible quand il reçoit le focus | Empilement |
| A6 | Administration | Faible | 1.4.3 | Compteur de la puce active du tableau de bord : 3,24:1 (blanc sur #0a76b2 avec `opacity: .7`) | Opacité appliquée sur fond d'accent |
| A7 | Public | Faible | 1.4.13 / 4.1.2 | Menu « Catégories » : ouvert au survol/focus par CSS, **non fermable** avec Échap, état non annoncé (`aria-haspopup` sans `aria-expanded`) | Pas de logique de fermeture |

Note : la sonde teste le point central de l'élément ; le test de non-régression exige qu'au moins 24 px (ou l'élément entier) restent visibles au-dessus du bandeau, en tenant compte de sa colonne. Après correction, la sonde signale encore 7 éléments dont le **centre** est sous le bandeau (pas la totalité) : critère plus strict que celui du test (WCAG 2.4.11 exige « pas entièrement caché »), à ne pas lire comme un échec de 2.4.11.

## Faux positifs de la sonde (écartés après vérification)
- **Champs date** (`/formateur/gestion/ventes`, `/eleves`) : « focus invisible » au 4ᵉ arrêt de Tab. Capture d'écran avant/après : Chrome dessine déjà une bague bleue sur le bouton calendrier interne ; **aucune correction** (j'en avais écrit une, retirée).
- **Lien d'évitement sur `/`** signalé une fois « masqué » : au repos il est visible (0–50 px) ; effet de timing de la transition.
- **Contrastes 1,0:1 à 3,3:1** sur « Rechercher », « Modifier », « 0 »… : textes en fondu.

## Vérifié sans défaut (mesuré)
Noms accessibles (0 contrôle sans nom sur 25 pages × 2 thèmes), `alt` (0 image sans), `lang`/`title`/`main`, une seule `h1`, identifiants uniques, aucun `tabindex` positif, **mouvement réduit** (aucune animation infinie active), **menu mobile** du site public (lu dans le code : `aria-expanded`, focus à l'ouverture, Échap, retour du focus au bouton), contrastes évaluables des 8 pages publiques et 16 d'administration, dans les deux thèmes (reste 0 hors A6).

## Non vérifié (voir limites)
Lecteur d'écran réel, Safari/Firefox pour ce palier, contraste des textes sur image/dégradé, ordre de lecture, erreurs de champ associées par `aria-describedby`/`aria-invalid` (les erreurs sont au niveau du formulaire), sous-titres des vidéos, zoom du texte seul à 200 %, focus trap des dialogues de l'éditeur (le Palier 13 couvre Échap et le retour du focus).
