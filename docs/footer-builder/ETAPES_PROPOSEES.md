# Étapes proposées pour combler les écarts réels (pieds de page)

Date : 8 novembre 2026. **Proposition, rien n'est construit.** Chaque étape est indépendante, validable à part, et ne touche à aucune autre catégorie du Theme Builder. Les chiffres viennent de l'audit (voir AUDIT_CAHIER_DES_CHARGES_ECARTS.md). **Non vérifié** : durées ; elles dépendent de la lenteur des tests (une suite = 1 à 2 minutes sur cette machine).

## Verdict (avec chiffres)

**Un enrichissement ciblé suffit ; une reconstruction complète des 100 modèles n'est pas justifiée.**
- Le catalogue contient déjà 100 modèles, ids et noms 100 % uniques, 99 empreintes structurelles distinctes sur 100 (97 si l'on ignore les propriétés de mise en page), et les mesures Chrome refaites ne montrent pas de défaut bloquant (voir l'audit).
- Les vrais manques sont **ailleurs que dans le nombre** : (1) 4 familles métier sur 15 sont vides (éducation, immobilier, finance/juridique, ONG) et 2 quasi vides ; (2) la **newsletter** n'est un vrai formulaire que si le site possède déjà un formulaire d'inscription ; (3) **un seul accordéon mobile** ; (4) **aucun formulaire de contact** ni **catégories de produits** dans les modèles ; (5) **pas de favoris, pas de tri** dans la bibliothèque ; (6) pas de fiche « métadonnées » ni de version par modèle.
- Estimation : **35 à 45 nouvelles compositions** et **10 à 15 remplacements** de quasi-doublons, pas 100.

## Étapes dans l'ordre recommandé

| # | Étape | Objectif | Périmètre / fichiers | Dépend de | Risques | Tests | Critère de validation |
|---|---|---|---|---|---|---|---|
| 1 | **Geler l'existant** | Garantir qu'aucun identifiant n'est perdu | nouveau fichier d'identifiants actuels + table alias ; `catalog/footer.js` (lecture) | — | aucun (lecture) | test « les 100 identifiants actuels existent ou ont un alias » | Q1–Q9 de production archivées ; test vert |
| 2 | **Newsletter honnête** | Un vrai état « non configuré » + usage du widget `emailsubscribe` | `catalog/footer.js` (cas `news`), `widgets/footer.js` | 1 | publication bloquée sans formulaire (limite déjà connue) | rendu avec/sans formulaire ; message explicite ; consentement | aucun bouton « Nous contacter » déguisé en abonnement |
| 3 | **Réseaux et paiements complets** | 13 réseaux proposés ; défaut réglable ; paiements en pastilles | `cas social`, widgets `social`/`bizpayments` | 1 | faible | rendu 3 largeurs | TikTok, X, Pinterest sélectionnables sans code |
| 4 | **Accordéon mobile et menu déroulant** | Sections repliables sur mobile pour les pieds denses | nouveau cas dans `rawItem` ; widget `accordion`/`toggle` existant | 1 | clavier/focus ; contenu masqué hors mobile | Chrome 390 px : ouverture, focus, lecteur d'écran (aria) | au moins 12 modèles denses repliables ; desktop inchangé |
| 5 | **Formulaire de contact et catégories de produits** | Deux briques manquantes | `rawItem` (cas `contactform`, `shopcats`), source `products`/catégories boutique | 1 | dépendance au module boutique | rendu avec/sans module | présent dans ≥ 5 modèles, état vide explicite |
| 6 | **Familles métier vides** | Éducation, immobilier, finance/juridique, ONG, institutionnel, restauration | `catalog/footer.js` : nouvelles compositions (voir REPARTITION_100_PAR_FAMILLE.md) | 2 à 5 | doublons de structure | test de distinction (empreinte) + Chrome 3 largeurs | 15 familles, total exactement 100 |
| 7 | **Remplacer les quasi-doublons** | Supprimer les 3 paires identiques et les voisins > 90 % | idem, avec alias de l'étape 1 | 1, 6 | casser le lien d'origine | test d'unicité renforcé (seuil de similarité) | 0 paire > 90 % |
| 8 | **15 familles dans l'interface** | Filtre par famille métier, métadonnées (nom, description, catégorie, version) | `catalog/index.js` (`families`), `public/js/theme-builder.js` (filtres existants) | 6 | interface partagée avec les autres types : ne pas la casser | test liste/filtres des 9 autres types inchangés | 15 filtres, 100 résultats |
| 9 | **Tri et favoris de la bibliothèque** | Tri (nom, famille, récent) ; favoris par utilisateur et par site | `theme-builder.js`, nouvelle table (migration, donc sauvegarde auto) | 8 | multi-sites : favoris propres au site | isolation entre sites | un favori d'un site invisible sur l'autre |
| 10 | **Version de composition et « origine »** | Numéro de version du modèle + remplissage de l'origine des anciens pieds | colonne via migration | 1, 7 | migration | test migration figée + restauration | « Revenir au modèle d'origine » correct après changement |
| 11 | **Campagne finale** | Captures des 100 modèles, tests de non-régression | `scripts/audit-pieds*.js` (nécessite `playwright-core`) | 6, 7 | lenteur | voir PLAN_DE_TESTS_COMPLEMENTAIRE.md | 0 défaut sur 300 mesures par état (avec / sans données) |

Règle de travail : une étape = une branche = une validation de votre part avant la suivante.
