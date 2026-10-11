# Rapport final de parité Elementor ↔ Kolakisa — 11 octobre 2026

_Ce rapport ne déclare ni « tout est terminé » ni « parité parfaite ». Il donne ce qui a été fait, ce qui a été vérifié et ce qui reste, avec les chiffres calculés._

## 1. Périmètre documenté
- **Version de référence** : Elementor tel que décrit par son centre d'aide et sa documentation développeur le 10–11 octobre 2026 : éditeur classique (v3) **et** Éditeur V4 (éléments atomiques), sans mélanger les deux ; extensions tierces et fonctions expérimentales signalées comme telles.
- **Lu en entier** : environ **180 articles** (≈ 90 widgets et éléments, onglet Avancé, responsive, historique, réglages du site, conditions d'affichage, masques, composants, mouvement, étiquettes dynamiques, style V4, classes et variables, popups, boucles, recettes, liens intelligents…). Liste : `docs/elementor-reference/16-official-sources.md`.
- **Non lu** (liste dans `17-functional-inventory.md`) : e-commerce / WooCommerce, Theme Builder et kits (détails), intégrations de formulaires et dépannage, IA / MCP, accessibilité, performance, hébergement, domaines, e-mail, quelques tutoriels. La documentation **ne couvre donc pas 100 % d'Elementor** ; elle couvre le périmètre éditeur défini ci-dessus, et rend visible ce qui manque.
- **Documentation produite** : `docs/elementor-reference/` (30 fichiers : les 18 demandés, plus `04b…04k`, `18`, `19`).
- **Disponibilité gratuit / Pro** : établie seulement quand l'article le dit (voir `15-versions-and-availability.md`) ; sinon « non indiquée ».

## 2. Inventaire (calculé par `scripts/build-parity-inventory.py`, 109 lignes à identifiants stables)
| Mesure | Nombre |
|---|---|
| Fonctionnalités inventoriées | **109** (73 widgets / éléments, 36 fonctions transversales) |
| Applicables à Kolakisa | **101** (109 moins 8 sans objet, exclues ou confiées à un autre module) |
| Présentes dès le départ et validées (suites existantes) | **52** |
| **Ajoutées ou complétées dans cette mission et validées** (test dédié) | **49** |
| Partielles | **0** |
| Confiées à un autre module (formulaires) | **1** |
| Non faites ou exclues avec raison | **7** |
| Non testées | **0 parmi les lignes comptées « validées »** ; les 52 lignes « existantes » ne sont pas revalidées une à une dans cette mission : elles reposent sur la suite préexistante qui passe |

## 3. Ce qui a été corrigé ou ajouté (49 lignes)
Résolutions d'image (miniature 150, petite 320, moyenne 640, moyenne grande 768, grande 1024, 1536, 1600, 2048, entier, adaptative) sur 7 widgets, le fond d'image et la photo de témoignage ; visionneuse du widget Image ; galerie (3 dispositions, 1–12 colonnes, ratio, légende au survol, filtres) ; contour du texte, lettrine, colonnes, sens d'écriture, balise du titre ; **9 nouveaux widgets** (Appel à l'action, Playlist vidéo, Bouton flottant, Lien intelligent, Contenu Facebook, Plan du site, conteneur en accordéon, et deux complétés en profondeur : fenêtres, diaporama) ; séparateur de forme ; diaporama et vidéo de fond ; dégradé radial / multicolore, découpe du fond, bordures, filtres et filtres d'arrière-plan, formes de masque ; 12 animations de survol ; magnétisme de défilement ; jours / heures et groupes ET / OU ; popups automatiques ; **écran « Grand écran »** ; collage depuis un autre site ou navigateur ; compteur, compte à rebours, liste d'icônes, partage, vidéo, témoignage, points d'intérêt, code, suivi de lecture.

## 4. Cas de référence : résolution des images (partie VI)
Audit : stockage, dimensions (`mk_media`), aucune variante ni outil de redimensionnement au départ. Mise en œuvre : service `src/marketing/media/variants.js`, versions WebP fabriquées à la demande (jamais l'original modifié), repli sur l'original si `sharp` est absent ou l'image trop petite, anciennes images prises en charge sans migration, suppression des versions avec l'image. Cycle validé : contrôle visible, tailles réellement disponibles seulement, valeur enregistrée, canevas mis à jour **sans remontage**, rechargement, page publiée, responsive (`srcset`), fond d'image, galerie / carrousel / boîte d'image / points d'intérêt / témoignage. **Non vérifié en production : le chargement de `sharp` sur Hostinger** (voir limites).

## 5. Tests
- **Suite complète** (11 octobre, code final fusionné avec `origin/main`) : **4 719 tests, 4 719 réussis, 0 échec, 0 annulé, 0 ignoré** (359 fichiers).
- Tests ajoutés pendant la mission : 20 fichiers (résolutions d'image, galerie, parité 1 à 5, inspecteur, grand écran, repli sans `sharp`).
- Défauts trouvés par les tests et corrigés : légende de galerie qui bloquait le clic, classes sans style, sauts de niveau de titre, parties stylables non descendantes, CSS effacé par un remplacement, écart de nom de classe dans un gabarit, **compatibilité du masquage « ordinateur » à l'arrivée du grand écran**, ombre noire dans `page-builder.css` (hors mission, corrigée).
- Navigateur : Chrome uniquement. Safari et Firefox **non testés**.

## 6. Performance
Voir `KOLAKISA_EDITOR_PERFORMANCE_REPORT.md`. Éditeur (24 sélections, page de 12 images, machine au repos) : script 104–105 ms avant la mission, 99–113 ms après ; mises en page forcées 148–151 avant, 121–162 après : **aucune différence au-delà du bruit**. Pages publiques : `landing.css` +11 Ko (+2,5 Ko compressé) et `landing.js` +3 Ko (+0,8 Ko compressé) au début, plus la troisième passe (voir le rapport de performance pour les chiffres) ; **non mesuré** : temps d'ouverture de l'éditeur, coût d'ajout d'un widget, mémoire.

## 7. Fichiers, migrations, sécurité
- **Fichiers** : 179 fichiers modifiés ou ajoutés depuis le début de la mission (53 de code, 20 de tests, 65 de documentation) ; détail dans `KOLAKISA_EDITOR_IMPLEMENTATION_REPORT.md`.
- **Migrations** : aucune migration de base ; tous les réglages ajoutés sont facultatifs et absents des pages existantes (rendu inchangé, filet de sécurité des widgets régénéré en connaissance de cause).
- **Sécurité** : aucune valeur libre dans les pages (classes fixes, valeurs validées), adresses reconstruites pour les liens intelligents / Facebook / bouton flottant, SVG et shortcodes refusés, collage depuis le presse-papiers borné et revalidé par le serveur, CSS par élément limité aux déclarations (pas d'`url()`).
- **Accessibilité** : test d'accessibilité du rendu publié (86 widgets) réussi ; objectif WCAG 2.2 AA **non certifié** (pas d'audit externe).

## 8. Ce qui reste (7 lignes, toutes dans l'inventaire)
Commentaires Facebook (ID d'application et script externe) ; PayPal dons / abonnements et boutons Stripe (module Commerce) ; SVG, shortcodes, icônes personnalisées (sécurité) ; conditions propres aux modèles d'article (exigent le contexte de rendu de l'article) ; autres écrans supplémentaires (portable, paysage : un cadre de bureau minimum casserait la géométrie testée). Raisons : `KOLAKISA_EDITOR_GAP_ANALYSIS.md`, `KOLAKISA_EDITOR_LIMITATIONS.md`.

**Complété dans la dernière passe** : popups (après N clics, pages vues minimum, provenance du visiteur), note privée par élément, export / import des classes globales, carte insérée dans les boucles, vérification de `sharp` en production par `/sante` (champ `versions_images`), Portfolio (filtre par taxonomie = grille de boucle + Filtre de taxonomie).

## 9. Risques connus
`sharp` : vérifiable en production par `/sante` (`versions_images`: « ok » ou « indisponible ») ; effets de mouvement : seuil du grand écran fixe côté navigateur ; fréquence des popups mémorisée dans le navigateur du visiteur ; collage depuis le presse-papiers soumis à l'autorisation du navigateur ; tout testé sur Chrome seulement.
