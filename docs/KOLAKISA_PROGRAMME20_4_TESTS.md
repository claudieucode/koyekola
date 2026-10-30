# KOLAKISA — Programme 20.4 : tests

Commande : `ENCRYPTION_KEY=<64 zéros> TEST_START_TIMEOUT_MS=900000 node --test --test-concurrency=1 <fichiers>` ; vrais serveurs, vraies bases, vrais comptes (propriétaire, administrateur / éditeur / lecteur de site, accès limité), Chrome (Playwright) et Firefox (WebDriver BiDi). Machine partagée à 4 cœurs, charge 10 à 48 par des suites d'autres sessions : les délais de 30 s des tests navigateur y sont fragiles (voir §5).

## 1. Nouveaux tests (60)
| Fichier | Tests | Contenu |
|---|---|---|
| `programme20-4-catalogue.test.js` | 17 | Contrat du catalogue officiel (taxonomie de 8 familles / 48 secteurs en base ; chaque modèle classé, valide au regard du moteur actuel, sans image ni script ni coordonnée / chiffre / témoignage inventé ; 5 types servis ; les 10 secteurs de départ ont un pack) · chargement (liste légère, facettes réelles) · recherche (nom, mot-clé, secteur, catégorie, type ; sans accent ni casse ; tous les mots ; pertinence) · aucun résultat et saisies hostiles · filtres cumulables · facettes cohérentes avec la liste · tri alphabétique / récents / « plus utilisés » (imports réels seulement) · pagination (pages disjointes et complètes, page hors limite, valeurs invalides) · détail (éléments, structure, compatibilité, licence ; modèle d'un autre site ou référence piégée : 404) · aperçu réel des 5 types (styles du site, rien créé, autre site refusé) · secteurs administrables (ajout, officiels en lecture seule, désactivation, suppression refusée si utilisé, autre organisation invisible) · accès direct aux API (anonyme, lecteur, accès limité, site forgé) |
| `programme20-4-import-enregistrement.test.js` | 31 | **Les 110 modèles officiels s'importent** (13 packs, 42 gabarits, 9 composants, 8 modèles de thème, 38 sections) en brouillon, rien publié, rien branché · section : fin / début, révision, page cible invalide (autre site, archivée, absente), composition du site · composant : numérotation, non branché, copie d'un composant partagé, composant d'un autre site refusé · modèle de thème : non affecté par défaut, affectation avec confirmation, conflit annulant tout · compatibilité : élément inconnu (avec élément de remplacement proposé), contenu refusé par la grammaire, formulaire / composant d'un autre site, HTML sans droit, ressource externe (confirmation 409), formation absente, **boutique (module absent / boutique fermée / ouverte, aucune écriture à la lecture)** · conflits de noms, idempotence (3 types), **atomicité sur panne de persistance (5 types)** · annulation (pack + menu, page modifiée / publiée, sections, composant, modèle de thème affecté, droits) · enregistrement (métadonnées, versions, refus du remplacement implicite, page d'un autre site) · modification, partage (droit, visibilité, import depuis un autre site, origine seule modifie, référence propre au site refusée) · suppression · fichiers (export / import, formats, versions, invalides, 413, texte piégé nettoyé, ancien format) · permissions serveur et isolation principal / sites |
| `programme20-4-bibliotheque-navigateur.test.js` (Chrome) | 9 | Ouverture, vignettes vivantes, noms accessibles, titres sans saut · recherche serveur, aucun résultat, filtres cumulés, tri, réinitialisation · « Afficher plus » jusqu'au dernier modèle · détail, Échap et focus rendu, aperçu par page et par appareil · import de section (plan, annulation en deux temps) · composant, modèle de thème, confirmation cochée · enregistrer, modifier, partager, fichier, secteurs · erreur réseau et « Réessayer » · clavier, 820 / 1024 / 1920 / 390 px, lecteur en lecture seule, aucune erreur JavaScript |
| `programme20-4-bibliotheque-firefox.test.js` (Firefox) | 3 | Chargement, recherche, « Afficher plus », détail, aperçu, plan d'import, Échap, sans erreur JavaScript |

Chaque test de comportement est écrit pour échouer si la fonction manque ; les défauts trouvés en cours de route sont dans IMPLEMENTATION §4.

## 2. Couverture des scénarios exigés par le cahier des charges
| Exigence | Preuve |
|---|---|
| Chargement, recherche, filtres, tri, catégories, pagination, états vides, gestion des erreurs | catalogue (serveur) + navigateur (état d'erreur, « Réessayer ») |
| Aperçu : images, pages, responsive, protection des ressources privées | « aucune image embarquée » (contrat) ; vignettes vivantes ; onglets de pages et appareils ; autre site → 404 / 403 |
| Importation : site complet, page, section, composant, modèle de thème, dépendances absentes, widget incompatible, conflits, annulation, erreurs de persistance | import-enregistrement (chaque type, §« compatibilité », « conflits », « annulation ») |
| Enregistrement : création, modification, visibilité, permissions, réutilisation dans un autre site | import-enregistrement (§« enregistrer, modifier, partager ») |
| Non-régression : éditeur, CMS, Theme Builder, rendu public, sauvegarde, publication, isolation multi-sites | §3 |

## 3. Résultats (code final, `programme20-4` après fusion de `main` a39abd87)
| Lot | Fichiers | Tests | Réussis | Échoués | Annulés / ignorés |
|---|---|---|---|---|---|
| **Lot final** : 20.4 (4 fichiers), bibliothèque existante, assistant de création, boutique, Theme Builder 20.3, patterns, composants, portée des routes, migrations, isolation, reconstruction, 20.2 | 36 | **524** | **524** | **0** | 0 / 0 |
| Lot de régression ciblé 3 (migrations, isolation, composants, éditeur de modèles, pages, 20.2 / 20.3 / IA) | 54 | 796 | 794 | 2 → corrigés (tests « le dossier des migrations s'arrête à N », mis à jour pour la migration 123) | 0 / 0 |
| Rejeu de 13 fichiers navigateur en échec dans la suite partielle | 14 | 88 | 69 | 19 dont **18 identiques sur `main` pristine (a39abd87)** : 18 / 88 contre 18 / 88 ; 1 intermittent (`editeur-blocs-p1-navigateur`) qui **passe seul 17 / 17** | 0 / 0 |

| Lot ciblé 6 (droits, révisions, registre de menu, portée des routes, éditeur, pages) | 32 | 538 | 534 | 3 : `entrees-fermees-preuves` et `r7-coherence-moteurs` (**identiques sur `main` pristine**) ; `site-menu-p1a` « aucune migration n'a été ajoutée » (plafond de migration relevé à 123, 70 / 70 ensuite) | 0 / 1 |
| **Après la dernière fusion de `main`** (20.4 ×4, bibliothèque existante, assistant, migrations, sécurité multisite du Programme 21, catalogue guidé, modèles) | 15 | **226** | **226** | **0** | 0 / 0 |

Résultat de la suite complète : voir §4.

## 4. Suite complète
Elle n'a pas pu être menée d'une traite : sur cette machine partagée (4 cœurs, charge moyenne 10 à 48, dont d'autres suites complètes en parallèle), 195 fichiers sur 668 (ordre alphabétique) ont demandé 3 heures. Je l'ai **arrêtée volontairement** à `editeur-droite-navigateur` et traitée ainsi :
1. **Partie exécutée (194 fichiers, `a-propos` à `editeur-curseurs`)** : 14 suites en échec. **2 étaient dues à 20.4 et ont été corrigées** : `registre des types de pages` (les 16 premiers gabarits n'étaient pas déclarés dans `pageTypes.GABARIT_TYPES`) et `apparence-parcours` (le pack était lu dans le JSON embarqué de la page). Les 12 autres sont des tests navigateur (menus, styles, catégories, analytics, contacts, e-mails, automatisations, commentaires, outils, taxonomies, connecteurs, éditeur Firefox, commandes de bloc, canevas) : **rejouées seules, 18 tests échouent à l'identique sur `main` pristine**, 1 passe seul.
2. **Partie restante** : voir §6 (rejouée après coup si le temps l'a permis).

## 5. Fragilités de l'environnement (dites telles quelles)
Les tests navigateur de la bibliothèque dépendent d'une réponse serveur (liste paginée) : ils attendent `aria-busy="false"` ; sans cela, deux tests ont échoué sous charge (une course entre un clic d'onglet et la lecture de la liste, corrigée dans le test). Les tests existants du dépôt qui échouent par délai de 30 s sous charge sont ceux de la liste « identiques sur `main` ». Firefox a une fois refusé d'ouvrir son interface BiDi sous charge (le test s'ignore alors avec un message explicite, jamais en succès silencieux) ; il passe 3 / 3 sur un second essai.

## 6. Reste de la suite (473 fichiers après `editeur-droite-navigateur`)
**Non exécuté en entier.** Une seconde tentative (493 fichiers) a été arrêtée au bout de quelques minutes : les premiers fichiers (éditeur navigateur) y demandent plusieurs minutes chacun sur cette machine. À la place, **les fichiers qui touchent ce que 20.4 modifie** ont été rejoués par lots (lot 3 : 54 fichiers ; lot 6 : 32 ; lot final : 36 ; après fusion : 15) : bibliothèque et gabarits, composants, Theme Builder, patterns, assistant de création de site, permissions, registre de routes, migrations, isolation des sites, reconstruction R6, éditeur de modèles, création de pages, boutique, IA. Un fichier non rejoué peut donc encore contenir une dépendance que je n'ai pas vue : les deux régressions trouvées par la suite partielle (`pageTypes`, `apparence-parcours`) l'avaient échappé aux premiers lots ciblés.

## 7. Mesures
| Mesure | Valeur | Conditions |
|---|---|---|
| `catalogue.json` (12 modèles) | médiane 59 à 150 ms, p95 150 à 440 ms | 99 modèles officiels + 210 modèles du site ; charge machine ≈ 47 |
| `catalogue.json?compat=ok` (construit tout) | médiane ≈ 390 ms, p95 ≈ 750 ms | idem ; seul filtre qui construit tout le catalogue |
| `detail.json` / `apercu` | médiane 14 / 22 ms | idem |
| Page de la bibliothèque (HTML + 1re page de résultats) | 95 Ko | |
| Éditeur ouvert sur la page officielle la plus lourde (« Logiciel en ligne », 5 sections, 54 éléments) | prêt en ≈ 4,4 s (charge ≈ 48) ; réponse à une saisie = 1 image (16,6 ms) | mesure grossière, non contrôlée |
| Sonde d'accessibilité automatique (Chrome, clair + sombre, parcours Tab réel) sur l'écran | 0 constat après correction de 3 (saut de titre h1 → h3, contraste en thème sombre) | `scripts/a11y/audit-accessibilite.js --only /marketing/site-web/templates` — contrôles partiels, pas de conformité WCAG |

## 8. Statuts
Exécutés : voir §3 (lot final 524 / 524, après fusion 226 / 226) et §6 (suite complète NON terminée). Bloqués : Safari (non activable), Edge (ne démarre pas sous Playwright sur cette machine). Non exécutés : lecteur d'écran, axe-core / Lighthouse (non installés), tests de charge sur serveur réel.
