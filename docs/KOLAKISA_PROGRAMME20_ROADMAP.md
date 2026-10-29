# Programme 20 — Feuille de route (20.1 à 20.7)

Adaptée à l'audit (`KOLAKISA_PROGRAMME20_1_AUDIT.md`) et à l'architecture (`…_ARCHITECTURE.md`). Les écarts G1–G24 sont dans `…_GAP_ANALYSIS.md`. **Aucune phase ne commence sans validation de la précédente par le propriétaire.** Règles communes à toutes les phases : extension des services existants (pas de second éditeur/rendu/publication), isolation par site vérifiée côté serveur avec un test d'accès croisé par entité, migrations additives numérotées après le dernier numéro réel de `origin/main` (114 au commit audité), un commit dédié, pas de déploiement sans décision explicite, tests listés exécutés et résultats rapportés tels quels.

## 20.1 — Audit et conception (cette phase) — terminée
Livrables : 6 documents `docs/KOLAKISA_PROGRAMME20_*`. Critères : cf. rapport final. **Prérequis pour 20.2** : validation de l'architecture et réponses aux décisions D1–D4 ci-dessous.

### Décisions à prendre avant 20.2 (propriétaire)
- **D1 — Slugs et noms par site (G1)** : autoriser les mêmes slugs/noms sur des sites différents (recommandé ; migration additive sur copie de base d'abord).
- **D2 — En-tête/pied (G7)** : composants globaux comme source de vérité unique (recommandé).
- **D3 — Commerce (G14/G15)** : boutique unique du site principal pour 20.5, ou commerce par site ; produits génériques hors Programme 20 (recommandé).
- **D4 — Permissions (G3)** : valider les 5 permissions proposées et leurs rôles minimaux.

## 20.2 — Intégration du Site Builder
- **Objectifs** : tableau de bord « Mes sites » étendu ; assistant de création (vierge ou kit existant `sitePacks`) ; état de préparation calculé ; accès cohérent au CMS du site, à l'éditeur, aux domaines, modules, aperçu, publication, duplication/archivage.
- **Périmètre** : `views/marketing/sites.ejs` et espace de site ; nouveau service `siteWizard` (orchestration pure) ; permissions G3 ; correction G1 (prérequis) ; G18 ; clarification du module `lms` (G16) ; unification de la lecture des styles (G17, adaptateur).
- **Dépendances** : D1, D4 ; migration G1 (la plus risquée du programme).
- **Fichiers/services** : `pages/index.js` (`createSite`, `duplicateSite`), `pages/sitePacks.js`, `web/siteWeb.js`, `web/sites*`, `siteModules`, `siteDomains`, `routeScopes.js`, `organizations.js`.
- **Livrables** : parcours création → préparation → publication fonctionnel ; checklist ; permissions ; tests.
- **Tests** : accès croisé par rôle (équipe, accès limité, lecteur) ; deux sites créent `/contact` ; assistant transactionnel (échec → rien d'écrit) ; routes publiques par domaine ; non-régression `isolation-des-sites*`, `site-builder-vierge`, `domaines-*`, `palier17-*`.
- **Critères d'acceptation** : un site est créé depuis un kit en brouillon, avec son identité ; aucune donnée d'un autre site lue ni écrite ; la checklist reflète l'état réel ; aucune option « sans effet » affichée comme active.
- **Risques** : migration G1 sur une base de production dont l'état de reconstruction R6 est inconnu ; collisions de numéros de migration entre sessions.
- **Prérequis pour 20.3** : G1, G3 livrés ; D2 appliquée ou planifiée.

## 20.3 — Theme Builder
- **Objectifs** : modèles structurels **par site** ; conditions étendues ; familles de modèles complétées ; en-tête/pied unifiés ; aperçu avec contenu réel ; versions de composants.
- **Périmètre** : `pages/themeTemplates.js`, `web/themeRender.js`, `web/appearanceEditor.js` / `web/siteWeb.js` (deux écrans, un service), composants (`mk_web_components`), `appearance` pour l'adaptateur du site principal.
- **Dépendances** : 20.2 (permissions, G1), D2.
- **Livrables** : G4, G5, G6 (hors produit), G7, G8, G9.
- **Tests** : conditions (inclusion, exclusion, priorité, conflits, défaut, `explain()`), modèle manquant → repli documenté, isolation A→B des modèles, aperçu = rendu public, restauration de version de composant, non-régression `theme-builder-serveur`, `composants-cycle-de-vie`, `palier12-*`, `apparence-templates`.
- **Critères** : deux sites ont des modèles différents ; l'ancien réglage d'organisation reste valable en repli ; un modèle ne s'affiche jamais sur un site non concerné.
- **Risques** : double système d'en-tête/pied ; migration des modèles d'organisation vers les sites.
- **Prérequis pour 20.4** : modèles par site stables ; format de modèle figé.

## 20.4 — Bibliothèque de templates (Template Studio)
- **Objectifs** : catalogue unifié (recherche, catégories, filtres, aperçu) ; format `kolakisa-template@1` ; import sûr ; enregistrement de ses modèles ; versions/variantes ; kits de site (thème + modèles + pages).
- **Périmètre** : `templateCatalog` (lecture), extension de `siteBundle`, `importPage`, `sitePacks`, `mk_page_templates`, `patternLibrary`, `reusableBlocks` ; production de kits.
- **Dépendances** : 20.3, G3 (`templates.*`).
- **Livrables** : G10, G11, G12, G13, G19.
- **Tests** : import hostile (HTML/CSS/URL/bornes/format inconnu/version incompatible) refusé avant écriture ; transaction et idempotence ; accès croisé ; export → import round-trip ; mesure de performance de l'éditeur sur kits réels (G23) ; accessibilité de base.
- **Critères** : un kit s'installe sur un site vierge sans erreur ni écriture ailleurs ; un modèle invalide produit un rapport clair et n'écrit rien.
- **Risques** : fragmentation en 5 stockages (rester en lecture unifiée) ; qualité éditoriale des kits.
- **Prérequis pour 20.5** : décision D3 confirmée.

## 20.5 — E-commerce
- **Objectifs** : habiller le commerce **réel** (formations : catalogue, page de formation, panier, commande, confirmation, compte) par des modèles ; ne rien faire passer pour un service qui n'existe pas.
- **Dépendances** : 20.3/20.4, **D3**. Produits génériques, TVA, achat invité, stock : **hors Programme 20** (chantier commerce distinct à décider).
- **Tests** : parcours d'achat de bout en bout sur l'existant (Stripe en mode test, webhook signé, idempotence) ; isolation selon D3 ; un modèle de panier/paiement n'ouvre aucun flux sans service réel.
- **Critères** : chaque modèle e-commerce est étiqueté « visuel » ou relié à un service vérifié.
- **Risques** : migration `site_id` des commandes si le commerce par site est retenu (élevé) ; dépendance à Stripe/clés d'environnement.

## 20.6 — Expérience de création
- **Objectifs** : parcours guidé (choix du kit, identité graphique, personnalisation, aperçu, publication) ; brand kit par site ; états de progression.
- **Dépendances** : 20.2–20.4.
- **Tests** : parcours navigateur (Playwright) complet, responsive, clavier, mode sombre ; reprise d'un assistant interrompu ; aucun écran vide.
- **Critères** : un utilisateur non technique publie un site depuis un kit sans quitter le parcours ; aucune donnée perdue en cas d'abandon.
- **Risques** : surcharge de l'interface ; dérive visuelle (respecter `KOLAKISA_DESIGN_CHARTE.md`).

## 20.7 — Audit final
- Tests de bout en bout, sécurité (reprendre la méthode du Palier 17 sur les nouvelles routes), isolation multi-sites par entité, performance (éditeur, rendu, kits), responsive, accessibilité, mise à jour des documents obsolètes (G21), validation finale.
- **Critères** : suite complète exécutée et rapportée (réussis / échoués / annulés / ignorés), aucun risque critique ouvert, inventaires de widgets/thèmes régénérés depuis le code.

## Calendrier relatif (indicatif, non engageant)
20.2 est la phase la plus risquée (migration G1). 20.3 et 20.4 sont séquentielles. 20.5 dépend d'une décision, pas de code. 20.6 dépend de 20.2–20.4. 20.7 clôt.
