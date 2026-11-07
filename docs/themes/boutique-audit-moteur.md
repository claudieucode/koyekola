# Thèmes de boutique (Luxe / Boutiques en ligne) — audit du moteur et état d'avancement

## 1. Audit du moteur e-commerce (Phase 0)
| Capacité | État | Détail |
|---|---|---|
| Catalogue : produits, catégories, étiquettes | Existe | `src/marketing/shop/catalog.js` ; catégories avec sous-catégories, image et description. |
| Collections libres | Absent | Seulement des catégories et des étiquettes. |
| Attributs et variantes | Existe | 5 attributs au plus ; prix, stock, SKU, poids et image par variante. |
| Stock et ruptures | Existe | Stock par produit ou variante, journal, seuil de stock bas. |
| Panier | Existe | Panier serveur, version anti-conflit, `panier.json`. |
| Tunnel de commande | Existe | Invité possible, adresse, livraison (zones, méthodes), paiement, confirmation. |
| Paiement | Partiel | Stripe Checkout hébergé, paiement manuel, commande gratuite. Pas de « mode test » propre : dépend des clés Stripe de test du serveur. |
| Codes promo, prix barrés | Existe | Coupons ; prix promotionnel avec dates. |
| Comptes clients | Existe | Inscription, connexion, mot de passe oublié, profil, adresses. |
| Historique des commandes | Partiel | Données présentes ; affichage complet non vérifié. |
| Liste de souhaits | **Absent** | |
| Avis clients | **Absent** | Aucune note ni avis ne peut être affiché (et aucun n'est inventé). |
| Taxes, devise | Existe / partiel | Règles par pays ; une devise par boutique. |
| E-mails transactionnels | Existe | Commande reçue, payée, expédiée, annulée, remboursée. |
| Données structurées `Product` / `Offer` | **Absent** | Seules les formations en ont. |
| Abonnements | **Absent** | |
| Options personnalisées sur une ligne (gravure, initiales, dimensions) | **Absent** | |
| Contrôle d'âge, créneaux de livraison, accès membre, produits groupés | **Absent** | Le type « groupé » existe en base mais est refusé par le service. |
| Thèmes appliqués aux pages de boutique | **Absent avant ce chantier** | Les pages `/boutique/*` ne chargeaient pas le thème du site. **Corrigé** (voir §2). |

## 2. Ce qui a été fait
- **La boutique réelle prend l'identité du thème** : `views/boutique/_top.ejs` et `_bottom.ejs` chargent la feuille de style, l'attribut `data-kw-pack` et le script du thème actif, exactement comme le site public. Catalogue, fiche produit, panier, commande, confirmation et compte héritent donc du thème. Aucun thème ne réimplémente le commerce : les grilles de produits de l'accueil sont le vrai widget `shopgrid` (prix, promotions et stock réels).
- Deux catégories de galerie : **Boutiques de luxe** et **Boutiques en ligne**. Un menu de thème peut renvoyer vers `/boutique/*`.
- `packs/shopkit.js` : `shopgrid`, et `seed()` pour créer un catalogue de démonstration (24 produits, variantes, promotions, ruptures) dans une boutique de test.
- **4 thèmes pilotes** : Maille (cachemire, Luxe), Flamme (bougies, Luxe), Verdure (plantes, E-commerce), Pointure (sneakers, E-commerce). Chacun : 7 pages de démonstration, feuille de style confinée, 24 produits de démonstration, composant signature branché sur des données réelles (étiquettes ou contenu éditable).
- Tests : `tests/themes-boutique.test.js` (fiche valide, audit de balisage, pas de pratique trompeuse, parcours complet catalogue → fiche → panier → commande invité en paiement manuel → confirmation sur un vrai serveur, isolation entre sites).

## 3. Limites connues (non simulées)
- Les 26 autres thèmes de la mission ne sont pas livrés. Ceux qui exigent des briques absentes du moteur (gravure et personnalisation, abonnement, contrôle d'âge, créneaux de livraison, accès membre, produits groupés, comparateurs, liste de naissance, avis) restent bloqués tant que ces briques n'existent pas.
- Pas d'avis ni de notes, pas de données structurées `Product`/`Offer`, pas de liste de souhaits.
- Les produits de démonstration n'ont pas de photos : chaque thème montre une surface colorée à la place d'une image.
- Les structures de pages (fiche produit, panier, filtres) sont celles du moteur ; la diversité vient du CSS (grille, galerie collante ou défilante, bouton d'achat fixe sur mobile, mosaïque…). Un tiroir de panier ou un panneau de filtres superposé demanderait de nouveaux gabarits.
- Les mesures de performance (Lighthouse, LCP, CLS, INP), la revue de conception chiffrée, le test clavier complet et la validation des données structurées n'ont pas été exécutés pour ces thèmes.
- Vérification visuelle réalisée (`scripts/verification-visuelle-boutique.js`) : 4 thèmes × 7 pages réelles (catalogue, catalogue sans résultat, fiche simple, fiche à variantes, panier, commande, compte) × 3 largeurs (1280, 820, 390) = 84 mesures dans Chrome, 0 débordement horizontal. Les pages d'accueil des thèmes (blocs du Page Builder) ne sont pas mesurées par ce script.

## 4. Architecture proposée pour les briques manquantes (séparée des thèmes)
1. Avis vérifiés (achat réel, modération) + `schema.org` `Product`/`Offer`/`AggregateRating`/`BreadcrumbList`.
2. Liste de souhaits et collections.
3. Options personnalisées par ligne de commande (texte, choix, supplément de prix).
4. Produits groupés / kits.
5. Abonnements (récurrence Stripe, pause, résiliation en un clic).
6. Contrôle d'âge, créneaux de livraison, accès membre.

## Briques ajoutées au moteur (migration 131)
| Brique | Ce qui existe maintenant | Fichiers |
|---|---|---|
| Avis vérifiés | Un avis ne peut venir que d'une commande **payée** contenant le produit (jeton de la commande ou compte client). Un seul avis par commande et produit. Modération dans l'admin (onglet « Avis ») : à relire / publié / refusé, ou publication directe (réglage). HTML retiré. | `shop/reviews.js`, `views/boutique/avis.ejs`, `views/marketing/boutique/avis.ejs` |
| Données Google | `Product` + `Offer` (ou `AggregateOffer` pour les variantes) et `BreadcrumbList` sur chaque fiche. `AggregateRating` et `Review` **uniquement** s'il existe des avis publiés. | `shop/seo.js` |
| Personnalisation par ligne | Réglage par produit (libellé, aide, longueur max, obligatoire). Le texte est validé côté serveur, séparé par ligne de panier, copié sur la commande, visible dans l'admin et l'e-mail. Le prix ne change pas. | `shop/personalization.js` |
| Créneaux de livraison (migration 135) | Créneaux récurrents par boutique (jours, plage, capacité, délai min, horizon, jours exclus) ; une méthode de livraison peut « exiger un créneau » (froid). Le client ne voit que les créneaux réellement libres ; revalidation serveur à la commande (complet = refusé) ; créneau enregistré sur la commande, visible en admin, e-mail et confirmation. | `shop/deliverySlots.js`, migration `135_creneaux_livraison.sql`, `tests/boutique-creneaux.test.js` |
| Liste de souhaits | Par navigateur (cookie) et rattachée au compte si connecté ; propre à chaque boutique ; page `/boutique/souhaits`. | `shop/wishlist.js` |
| Prise de rendez-vous (migration 137) | Le vendeur définit des types (nom, durée, sur place ou visio, description), des disponibilités hebdomadaires, des exceptions, un pas, un délai minimum et un horizon. Page publique `/boutique/rendez-vous` (paramètre `?produit=slug` pour rattacher un produit) : seuls des créneaux réellement libres sont proposés ; double réservation et chevauchement refusés (contrainte unique en base + contrôle du service). Confirmation à l'écran, e-mail au client (avec lien d'annulation signé) et au vendeur (`notify.js`). Admin (onglet « Rendez-vous ») : agenda, confirmer, annuler, reporter, réglages. Aucun paiement. Limites : heure murale d'un seul fuseau par boutique, disponibilités communes à tous les types, pas de lien visio généré, pas de rappel automatique. | `shop/appointments.js`, `web/shopRdv.js`, `views/boutique/rendez-vous.ejs`, `views/marketing/boutique/rendez-vous*.ejs` ; tests : `tests/boutique-rdv.test.js` |
| Comparateur de produits (migration 133) | 4 produits maximum par boutique, liste dans un cookie propre à la boutique (revalidée à chaque lecture). Page `/boutique/comparer` (tableau avec en-têtes, lignes en différence signalées en texte et en couleur), JSON `/boutique/comparer.json`, bouton sur la fiche (sans JavaScript). Caractéristiques libellé/valeur (20 max) éditables dans l'admin produit. | `shop/compare.js`, `views/boutique/comparer.ejs`, `views/boutique/_compare.ejs` |
| Contrôle d'âge légal (migration 134) | Âge minimum 16/18/21 par produit et/ou par catégorie (le plus élevé gagne). Fiche et catalogue restent visibles ; l'ajout au panier est **refusé côté serveur** sans déclaration (cookie signé propre à la boutique, 30 jours) ; à la commande, case **non précochée** exigée côté serveur, date et âge enregistrés sur la commande et visibles dans l'admin. **Simple déclaration sur l'honneur, aucune vérification d'identité** (la livraison peut exiger une pièce d'identité). | `shop/age.js`, `views/boutique/age.ejs`, `tests/boutique-age.test.js` |
| Accès membre et ventes privées (migration 136) | Produit ou catégorie « réservé aux membres » (masqué du catalogue ou visible avec cadenas, au choix). Membre = client inscrit approuvé par le vendeur, ou entré avec un code d'invitation (usage maximum et expiration vérifiés à chaque usage). Page `/boutique/invitation`. Vente privée = fenêtre réelle (UTC) sur des produits/catégories : hors fenêtre, ajout au panier et commande refusés par le serveur ; la date de fin affichée vient de la base (aucun compte à rebours). Admin : onglet « Accès membre ». Limites : dates en UTC ; les grilles du Page Builder traitent tout visiteur en non-membre (produits masqués absents, verrouillés visibles) ; une commande déjà créée peut encore être payée après la fin. | `shop/access.js`, `views/boutique/invitation.ejs`, `views/marketing/boutique/acces.ejs`, `tests/boutique-membre.test.js` |
| Liste de naissance / de cadeaux (migration 138) | Liste à lien public secret (jeton 160 bits) et gestion par second secret haché ou compte client ; articles avec quantité souhaitée ; page `/boutique/liste/<jeton>` avec souhaités / offerts / restants réels ; « Offrir » ajoute la ligne au panier avec référence de liste ; « offert » n'augmente QU'au paiement de la commande, redescend au remboursement ; plafond vérifié au panier, à la commande (unités des commandes en attente réservées) et au paiement ; livraison à l'adresse de l'invité ou chez le bénéficiaire (adresse jamais affichée, visible du vendeur sur la commande) ; mot et prénom facultatifs du donateur visibles du bénéficiaire ; onglet admin « Listes cadeaux ». Limites : produits personnalisables exclus ; livraison au bénéficiaire seulement si le panier ne contient que des cadeaux d'une seule liste ; frais de port calculés d'après le pays de la liste. | `shop/giftLists.js`, `views/boutique/liste*.ejs`, `views/marketing/boutique/listes-cadeaux.ejs`, `tests/boutique-liste-cadeaux.test.js` |

Toujours absents (donc interdits dans les thèmes) : collections, produits groupés/coffrets, abonnements, contrôle d'âge, accès membre, comparateur, liste de naissance, prix variable selon la personnalisation.
Tests : `tests/boutique-briques.test.js`.
