# Erreur Anthropic 400 « compiled grammar is too large » — « Analyser mon projet »

## 1. Cause exacte
**Aucun outil n'est transmis à Anthropic** par ce parcours : `grep` sur `tools`, `tool_choice`, `input_schema` et `strict` ne trouve rien dans `src/` (hors normaliseurs sans rapport). Aucun serveur MCP n'est chargé par le code serveur. La phrase « Simplify your tool schemas or reduce the number of strict tools » est le texte générique d'Anthropic ; ici la grammaire compilée vient de la **sortie structurée** (`output_config.format = { type: "json_schema", schema }`), posée par `src/services/aiCore.js › runJson`.

Le schéma refusé est celui de l'analyse du brief, `contracts.analysisSchema()` (appelé par `brief.analyze`) :
| Mesure (avant) | Valeur |
|---|---|
| Objets | **19** (un objet « fait » à 4 champs requis recopié 14 fois : nom, type, secteur, pays, ville, langue, public, ton, formalité, style, typographie + listes) |
| Énumérations | **17**, soit **106 valeurs** (états des faits ×14, 18 types de site, 10 objectifs, 22 fonctionnalités…) |
| Propriétés | 89, tout `required`, `additionalProperties:false` |
Le schéma de plan (`planSchema`, étape suivante) était plus petit (8 objets, 71 valeurs d'énumération ; 27 après correction) mais répétait deux fois la liste des 22 clés de fonctionnalités.

Les anciens tests passaient parce que le client factice n'applique aucune grammaire. Seul Anthropic la compile, donc seul un vrai appel peut le révéler.

## 2. Parcours (fichiers et fonctions)
Bouton « Analyser mon projet » (`views/marketing/ai-builder-home.ejs`) → route `/marketing/ia/studio/projets` → `workspace.createProject` (contrôle du brief, création éventuelle du site) → `plans.analyzeBrief` → `brief.analyze` (consigne `brief.system()`, schéma `contracts.analysisSchema()`) → `ai.call` (`src/marketing/ai/index.js` : module IA du site, quota, clé du connecteur, journal `mk_ai_requests`) → `aiCore.runJson` → Anthropic → `brief.normalize` (validation serveur de tout ce que renvoie le modèle). Échec : `translateError`, puis `createProject` archive le site créé pour l'occasion.

## 3. Corrections
| Fichier | Changement |
|---|---|
| `src/marketing/ai/builder/contracts.js` | `analysisSchema()` compact : UN objet « fait » (`field` parmi 12 noms) et UN objet « signal » (objectif / fonctionnalité / type secondaire) → **7 objets, 4 énumérations (23 valeurs, contre 19 objets et 106 valeurs)**. `expandAnalysis()` reconstruit l'ancienne forme lue par `normalize` (une réponse à l'ancienne forme passe telle quelle). `planSchema()` : les clés de fonctionnalités ne sont plus des énumérations |
| `src/marketing/ai/builder/brief.js` | La consigne liste les champs, objectifs et types autorisés (ce que l'énumération disait) ; `analyze` passe par `expandAnalysis` |
| `src/services/schemaBudget.js` (nouveau) | Mesure d'un schéma et seuils empiriques |
| `src/services/aiCore.js` | Mesure du schéma **avant** l'appel : hors budget → `schema_too_complex`, rien n'est envoyé. Refus de grammaire par Anthropic → même code, message dédié, trace `[ia] … schéma « brief » … outils transmis : 0` avec les mesures |
| `src/marketing/ai/index.js` | Transmet le nom de l'action comme étiquette de log |

Aucune capacité retirée : `normalize` et `planner` revalident toujours chaque clé (type de site, objectif, fonctionnalité, widget). La validation stricte côté serveur est inchangée ; le mode « strict » (schéma fermé, tous champs requis) est conservé.

## 4. Architecture retenue — et ce qui n'a PAS été fait
La demande évoquait une exposition sélective d'**outils** (analyse / construction / design / configuration / validation). Ce parcours n'a **pas d'outils** : chaque étape est déjà un appel séparé avec son propre schéma (brief → plan → contenus → design → validation), chargé uniquement quand l'étape s'exécute. L'analyse initiale n'envoie donc déjà que son schéma. Introduire une couche d'outils à charger à la demande n'aurait pas corrigé cette erreur et aurait ajouté du code sans objet ; je ne l'ai pas faite. Ce qui protège désormais chaque étape : schéma compact, mesure avant envoi, message clair, trace, aucun site actif laissé derrière un échec.

## 5. Risques résiduels
- **Aucun appel réel à Anthropic n'a été fait** (aucune clé dans l'environnement de travail, et je ne touche pas à la clé de production). La correction est démontrée par la mesure (19→7 objets, 106→23 valeurs d'énumération) et par des tests avec client factice, **pas** par la preuve qu'Anthropic accepte le nouveau schéma. La limite exacte d'Anthropic n'est pas publiée : les seuils de `schemaBudget` sont empiriques.
- Les autres schémas du produit (blog, e-mails, contenus, design, boutique) ne sont pas bloqués par le garde-fou (testés), mais pas non plus validés contre la vraie API.
- Sur le site existant, un échec n'écrit rien ; sur un nouveau site, le site créé est **archivé** (pas supprimé), comportement existant conservé.
