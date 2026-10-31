# Theme Builder — identité Kolakisa, navigation, aperçus, performances (31/10/2026)

Périmètre : écran `/marketing/site-web/sites/:id/constructeur-de-theme` uniquement (`views/marketing/theme-builder.ejs`, `public/js/theme-builder.js`, `public/css/theme-builder.css`, `src/marketing/web/themeBuilder.js`). Éditeur de pages, canevas, widgets, création guidée, moteur de rendu public, stockage et résolution : **non modifiés**.

## 1. Audit de départ
| Constat | Preuve |
|---|---|
| Interface générique : couleurs système (`Canvas`/`CanvasText`), blanc/noir, bordures de 3 px, vocabulaire d'Elementor (« THEME BUILDER » en capitales, nav à barre grise) | `theme-builder.css` d'avant |
| Aucun retour : changer de catégorie rechargeait tout sans trace dans l'historique ; Précédent quittait l'écran | `load()` sans `pushState` |
| Aucun aperçu réel : seulement un filaire (SVG) | `thumb.js` |
| Une seule présentation (cartes) | — |
| Liste lourde : **chaque** requête ouvrait le document de **chaque** modèle pour dessiner sa miniature (26 modèles = 26 lectures de pages/composants) | `card()` appelait `getPage`/`getComponent` |
| Rechargement complet à chaque clic, sans annulation ni cache ; renommer par `prompt()` ; aucune garde sur les saisies en cours | — |
| Le Theme Builder n'est **pas** en React : JavaScript natif (≈ 210 lignes). Les « re-rendus React » du cahier des charges ne s'appliquent pas ; l'équivalent mesuré est le nombre de lectures serveur et de requêtes. | |

## 2. Ce qui change
* **Identité** : barre marine profond (`--kb-navy-deep`), logo « K » bleu d'action, titres en police d'affichage, surfaces à plat, rayon 12 px, un seul bleu d'action, badges d'état aux jetons `--kb-live` / `--kb-draft` / `--kb-alert`, filaire des miniatures aux couleurs de la charte. Tous les jetons sont `--kb-*` : le **mode sombre** fonctionne (testé). Aucun blanc ou noir en dur hors de la barre marine (fond fixe).
* **Retour** : bouton « Retour » (ou « Toutes les parties ») dans chaque catégorie ; l'état (catégorie, recherche, état) est dans l'adresse (`?type=…&q=…&statut=…`) : Précédent/Suivant du navigateur, adresse copiée et rechargement retrouvent la même vue. Fenêtres de conditions/création/renommage modifiées : Échap, Annuler, Précédent et fermeture de l'onglet demandent confirmation avant de perdre la saisie.
* **Aperçu** : action « Aperçu » sur chaque carte, ligne et menu ⋯. Vue plein écran qui charge le **rendu réel enregistré** par les routes existantes (`/marketing/pages/:id/apercu`, `/marketing/site-web/composants/:id/apercu`), à 1280 / 820 / 390 px (mise à l'échelle), avec « Ouvrir dans un onglet » et « Modifier ». Un en-tête/pied (composant) se prévisualise dans une **page d'exemple** au choix.
* **Grille / liste** : bascule instantanée (View Transition si disponible), mêmes actions ; la liste est un vrai tableau (colonnes nommées) qui devient une pile de fiches sur téléphone. Choix conservé dans `localStorage` (`kola.themeBuilder.view`, tri `kola.themeBuilder.sort`), avec repli silencieux si le stockage est bloqué.
* **Ergonomie** : tri (récents, nom, état), « Effacer les filtres », états de chargement (squelettes), vide et erreur (« Réessayer »), bandeau de confirmation flottant (la zone `role=status` est conservée), renommage en fenêtre, raccourcis `/` (recherche), `n` (nouveau), `v` (grille/liste), Échap (efface la recherche).
* **Animations** : apparition échelonnée des cartes, zoom léger des miniatures, ouverture des menus/fenêtres, déplacement de l'indicateur de navigation — uniquement `opacity`/`transform` (aucun décalage de mise en page). `prefers-reduced-motion: reduce` supprime toutes les animations et transitions (testé).

## 3. Performances (mesures indicatives, machine partagée, charge 5–15)
| Indicateur | Avant | Après |
|---|---|---|
| Documents ouverts par chargement de la liste (26 modèles) | 26 | **0** (miniatures lues à la demande) |
| Miniatures demandées au premier affichage (1440×900) | 26 | **4** ; 26 après défilement complet |
| Poids de la réponse `/modeles` (26 modèles) | 23 876 o | **15 452 o** (−35 %) |
| Temps serveur médian de la liste (9 requêtes) | 9,8 ms | 7,3 ms |
| Requêtes simultanées de miniatures | — | 4 au plus |
Autres : réponses mises en cache côté navigateur par vue (retour instantané, rafraîchi en arrière-plan, vidé après toute action), chargement annulé si une vue plus récente est demandée, affichage par tranches de 48 modèles (« Afficher la suite »), observation des miniatures après insertion dans la page. Non mesuré : Lighthouse, mémoire du navigateur, très grands sites (> 200 modèles) — le plafond par site est `MAX_PER_SITE`.

## 4. Serveur
`GET …/api/modeles?leger=1` (sans miniature, avec `previewUrl`), `GET …/api/modeles/:tid/miniature` (filaire d'un modèle, vérifié par site et organisation, 404 sinon). La réponse complète d'avant reste disponible (sans `leger`) : aucune route existante n'a changé de contrat.

## 5. Tests
`tests/theme-builder-kolakisa-ui.test.js` (7, Chrome réel) : liste légère et miniature (isolation entre sites), identité (barre marine, mode sombre), miniatures différées, grille/liste et persistance, retour/historique/garde, aperçu (3 largeurs, page d'exemple, libération du cadre), raccourcis et mouvement réduit. Les tests existants (`theme-builder-*`) passent ; seul le libellé « THEME BUILDER » (désormais « Theme Builder ») a été ajusté dans `theme-builder-elementor-ui.test.js`.

## 6. Limites
* L'aperçu montre le document **enregistré** ; les contenus dynamiques (article, produit, archive) affichent le contenu d'exemple du modèle, pas un vrai article du site (pas de sélecteur de contenu).
* L'état de chargement d'un cadre en erreur HTTP n'est pas détecté (le cadre affiche la page d'erreur du serveur).
* Pas de comparaison visuelle automatisée avec l'ancienne interface (captures revues à la main).
