# Programme 21.9 — Tests

| Fichier | Tests | Résultat |
|---|---|---|
| `tests/programme21-9-regeneration.test.js` (service, IA simulée, vrai moteur de pages et Content Generator) | 28 | **28 réussis** |
| `tests/programme21-9-regeneration-http.test.js` (serveur réel, faux serveur d'IA, personnalisateur réel) | 6 | **6 réussis** |
| `tests/manuel/regen-ui-smoke.js` (Chrome réel, bureau 1280 et mobile 390) | 15 contrôles | **15 OK** (hors suite automatique) |

IA simulée et déterministe, aucun appel réseau, aucun coût.

## Couverture de la liste
1 analyse · 2-3 widget et page par identifiant, ambiguïtés · 4-5 dépendances (local, partagé, global), impact · 6 propriété · 7 texte (un champ, un appel IA) · 7b variante inventant un fait refusée · 8 image · 9 section · 10 page (confirmation) · ajout de section · demandes ambiguës / non prises en charge · 11 protection d'un texte manuel (+ autorisation ciblée) · 12 verrou (section, page, Content Generator, restauration) · validé · 13 snapshots (5 niveaux, dédupliqués, références de médias) · 14 historique (filtres, pagination, acteur, aucun secret) · 15 comparaison (ajout, suppression, déplacement, style, média, contenu, identique) · 16-18 restauration élément / section / page (+ partielle, verrous) · 19 site (pages + design, page archivée) · 20-21 annuler / rétablir (opération logique) · 22-23 conflits (fusion sûre, conflit, résolution `use_ai`, conflit d'annulation et de restauration) · 24 erreurs IA (quota, non configurée, réponse invalide) · 25 quotas (plafond réel d'`ai.call`, une modification locale ne consomme rien) · 26-27 isolation et permissions (autre site, autre organisation, accès limité, lecteur sans droit, administrateur d'un autre site) · 28-29 préservation des médias et structures · 30 historique natif des révisions non contourné.

## Mutations et régressions
Les tests du Content Generator (27 + 3 HTTP) passent après l'extraction de `reviseValue` et le contrôle de verrou. Fichiers voisins exécutés (un par un, tous verts) : portee-des-routes 8, site-menu-p1a 70, site-espace 25, marketing-migrations 18 + figées 1, content-generator 27 + HTTP 3, page-generator 26, design-generator 25, ai-media 21, ai-core 48, brief-planner 26, ai-builder-http (21.8 de main) 28, cms-revisions 39, revisions-articles 15, ia-par-site 13, modules-par-site 14, journal-audit-par-site 13.

## Non exécuté
Suite complète (700+ fichiers) ; lint, typecheck et build : **aucun script n'existe** dans ce dépôt pour ce code (seuls `build:editor` et `build:automation-flow`, non concernés) — vérification de syntaxe par `node --check` et chargement des modules ; Firefox / Safari ; lecteur d'écran réel ; test de charge avec un historique volumineux ; appel à un vrai fournisseur d'IA.
