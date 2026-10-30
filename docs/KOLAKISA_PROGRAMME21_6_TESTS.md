# Programme 21.6 — Tests

`node --test tests/programme21-6-content-generator.test.js tests/programme21-6-content-generator-http.test.js` → **29 tests sur 29 verts** (26 service + 3 HTTP réel).

## Méthode
- **IA simulée et déterministe** : une fonction `call` injectée (service) ou un faux serveur d'API local utilisé par le vrai SDK (HTTP). Aucun appel réseau, aucun coût, aucune clé réelle.
- Vraie base en mémoire (vraies migrations jusqu'à 117), vrai moteur de pages (`pages.saveDraft` et normaliseurs natifs), vrai AI Core (`createAiCore` avec fournisseurs simulés) pour les quotas.
- **Limite** : les réponses sont écrites à la main. Les tests prouvent la validité structurelle, la protection des faits et du travail manuel, l'écriture dans les bons champs et la persistance ; **ils ne prouvent pas la qualité rédactionnelle d'un vrai modèle**.

## Correspondance avec les scénarios
| Scénario | Test |
|---|---|
| A site vitrine | génération → proposition (rien n'est écrit) → application en brouillon ; styles, adresses et témoignages réels intacts ; SEO écrit |
| B boutique | produits fournis dans le prompt ; prix/livraison inventés remplacés, constat critique résolu |
| C éducatif | audience, faits et profil du pays dans le prompt ; règles anti-invention dans le système |
| D immobilier | surface, chambres, piscine inventées → remplacées (≥ 2 constats) |
| E ton | voix du site + ajustement de page reflétés dans le prompt ; mots à éviter et tu/vous détectés ; variantes professionnelle vs commerciale, avant/après, choix explicite d'une variante proposée |
| F SEO | limites du CMS, mots-clés étiquetés, volume/difficulté `null`, slug jamais appliqué ; H1/H2/alt ; bourrage ; cannibalisation (unitaire et contre une autre page) ; liens internes suggérés non insérés |
| G multilinguisme | version anglaise reliée à l'originale, formats du pays, langue non prise en charge refusée ; **traduction manuelle jamais écrasée** |
| H inconnus | année, effectifs, ISO, contacts inventés remplacés ; fait fourni conservé ; questions sur l'histoire/mission ; acceptation bloquée ; faits « suggestion » non retenus ; hypothèse du brief non retenue |
| I widgets | chaque champ déclaré accepté par le normaliseur natif ; types protégés ; écriture limitée aux champs déclarés ; bouton sans adresse non rempli |
| J révision partielle | un seul champ change ; historique ; annulation |
| K protection manuelle | texte modifié dans la page conservé, remplacement sur confirmation, annulation de l'application ; champ édité à la main protégé contre une variante, verrou respecté ; texte existant conservé par défaut |
| L qualité | répétitions, langue, mot doublé, ponctuation, longueur ; gravité + certain/probable ; aucun score |
| M quotas | vrai AI Core : quota de site atteint → refus, rien d'enregistré ; chemin `ai.call` : lot arrêté proprement ; ré-exécution identique sans appel ; limites de taille ; réponses invalides |
| N isolation | autre site, autre organisation, accès limité, voix isolée, page d'un autre site |
| O persistance | relecture après « fermeture », la page contient réellement le texte |
| HTTP | équipe : voix → génération → révision → application → annulation ; membre de A ; lecteur sans droit, administrateur de B, page d'un autre site, module coupé : refus **sans appel fournisseur** ; aucune clé dans les réponses |

## Contrôles par mutation
- Application sans protection du texte modifié à la main → 1 test échoue.
- Garde des nombres désactivée → 4 tests échouent.
Code restauré ensuite (26/26).

## Régression (fichiers voisins, un par un ; machine très chargée, load 15 à 60)
Verts : `page-generator` 26, `ai-core` 48, `ai-core-adapters` 8, `ia-studio` 10, `ia-transition-equivalence` 1, `marketing-ia-redaction` 12, `journal-audit-par-site` 13, `modules-par-site` 14, `site-scope-portee` 4, `repository-cache-schema` 1, `marketing-migrations` 18, `marketing-migrations-figees` 1, `portee-des-routes` 8, `site-menu-p1a` 70, `site-espace` 25, `ia-par-site` 13.
Dans un lancement groupé, `marketing-ia-redaction` et `modules-par-site` ont dépassé 120 s sur un test à serveur (charge) ; **ré-exécutés seuls, ils passent**. `site-menu-p1a` et `site-espace` échouaient déjà sur `main` (plafond de numéro de migration périmé) ; leurs plafonds sont mis à 117.

## Build
Pas d'étape de compilation pour le serveur (`node server.js`) ; le bundle de l'éditeur (`build:editor`) n'est pas touché. « Build » = chargement des modules et démarrage de vrais serveurs dans les tests HTTP (3 serveurs démarrés avec la migration 117).

## Non exécuté
La suite complète (`npm test`, 700+ fichiers) n'a pas été lancée (durée, charge de la machine, CI GitHub inutilisable). Aucun test navigateur (aucune interface). Aucun appel à un vrai modèle.
