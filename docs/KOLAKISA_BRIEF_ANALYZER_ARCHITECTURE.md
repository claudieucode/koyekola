# Brief Analyzer — architecture

## Rôle
Transformer un texte libre en `BriefAnalysis` v1 : faits typés (explicite / déduit / hypothèse / inconnu), objectifs, fonctionnalités, contradictions, manques, questions, niveau de préparation. Il **n'invente rien** : un manque devient une question, jamais une valeur.

## Chaîne
```
texte → precheck (sans coût) → ai.call("brief", schéma strict) → normalize (vérifications serveur) → BriefAnalysis → mk_ai_plans (draft)
```
1. **precheck** : vide / sans mots / < 15 caractères ou < 3 mots / > 6 000 caractères sont refusés avant tout appel (messages avec exemple).
2. **Appel** par le seul AI Core existant. Le brief est placé entre `<brief>…</brief>` et déclaré « donnée » dans le prompt ; le modèle n'a aucun outil.
3. **normalize** (déterministe) :
   - citation (`evidence`) d'un fait « explicit » recherchée dans le brief (comparaison sans accents ni ponctuation) ; absente → **déclassé « inferred »** + alerte ;
   - « unknown » → valeur vide, confiance 0 ; plafonds de confiance (déduit 0,8 ; hypothèse 0,6) ;
   - listes fermées : type de site (18), objectifs (10), fonctionnalités (clés du registre) ; hors liste → « autre » ou ignoré ;
   - pays : valeur du modèle rapprochée de la table locale, sinon détection par règle (ville/pays cités) marquée « inferred » ; désaccord → alerte ;
   - langue : celle du brief (modèle + règles) et celle du site ; non prise en charge (hors fr/en) → alerte `error` et question bloquante ;
   - disponibilité de chaque fonctionnalité **relue dans le registre** (jamais celle annoncée par le modèle) ;
   - contradictions : règles déterministes + celles du modèle ;
   - questions : retirées si le sujet est déjà connu, doublons fusionnés, bloquantes d'abord, **5 au plus**, `why` toujours renseigné, `skippable` = non bloquante.
4. **Niveau** : `insufficient` (type de projet non identifié) · `blocked` (question bloquante, contradiction ou langue non prise en charge) · `ready`.

## Questions intelligentes
Le modèle propose, le serveur filtre (voir ci-dessus). Les réponses (`/reponses`) sont facultatives et modifiables : une réponse `null`/vide la retire. Elles sont ajoutées au brief (« Précisions apportées ensuite ») et l'analyse est **refaite** (un appel), de sorte que les règles de preuve s'appliquent aussi aux réponses. Les réponses sont conservées avec la fiche (`answers_json`).

## Continuer avec des hypothèses
Si seul `blocked` subsiste, la planification est possible avec `proceedWithAssumptions: true` ; le plan porte `proceededWithAssumptions` et la liste `assumptions`. `insufficient` n'est jamais contournable.

## Ce qu'il ne fait pas
Pas d'OCR ni de fichiers joints ; pas de reconnaissance de langue autre que fr/en/es/pt par indices lexicaux (le modèle fait le reste) ; pas de mémoire entre fiches.
