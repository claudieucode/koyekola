# AI Content Generator — architecture

```
contexte (faits, voix, langue, pays, mots-clés)  ─┐
page native (sections du brouillon)               ─┼─► champs admissibles (fields.js) ─► 1 appel IA / page ─► nettoyage ─► garde anti-invention
                                                    │      (JSON strict : {fields:[{key,value}], seo, questions})         (facts.guard)
                                                    └─► validation qualité + SEO ─► PROPOSITION (mk_content_sets) ─► révision / variantes / traduction
                                                                                           └─► application en BROUILLON (pages.saveDraft) ─► annulation
```

## Flux d'une génération (`engine.generatePage`)
1. **Accès** : le site vient de l'adresse ; il doit appartenir à l'organisation, à la portée de la personne et être actif. La page doit appartenir à ce site (sinon `not_found`).
2. **Contexte** (`facts.buildContext`) : faits par source (`user`, `brief`, `external` = affirmables ; `suggestion` = jamais un fait), audience, ton, langue, pays, mots-clés (fournis / suggérés / externes, séparés).
3. **Voix** (`voice.effective`) : voix du site (`mk_content_voice`) ajustée par page.
4. **Champs** (`pageFields`) : uniquement les champs texte déclarés des sections natives. Un champ est *admissible* s'il est vide, contient un espace réservé `[…]`, ou a été écrit par ce moteur ; un texte existant est **conservé** (`kept`) sauf demande explicite (`scope: "all"`). Les contenus factuels ou personnels (témoignages, auteurs) ne sont jamais générés.
5. **Réutilisation** : une empreinte (contexte + voix + champs) évite tout nouvel appel si rien n'a changé.
6. **Appel** : `gateway` → `ai.call` (défaut, production) ou AI Core (`viaCore`). Tâches distinctes `content.page|revise|translate|seo`. Le contexte est placé entre `<donnees>…</donnees>`, déclaré « donnée » (anti-injection).
7. **Normalisation** : clés inconnues ignorées (constat), valeurs non textuelles ignorées, bornage par champ, garde anti-invention (nombres, années, contacts, URL remplacés par `[à compléter]` ; affirmations non étayées signalées).
8. **Contrôles** : `validate` (certain / probable, 4 gravités), `seo` (métadonnées, structure H1/H2, bourrage, cannibalisation, alt), questions pour les faits manquants.
9. **Enregistrement** : ensemble `proposed` + versions initiales, en une transaction.

## Données (migration 117)
`mk_content_sets` (un ensemble par page et par langue ; `fields` JSON avec valeur, source `ai|user`, verrou, valeur de base, dernière valeur appliquée), `mk_content_versions` (historique, variantes proposées), `mk_content_voice`. `revision` protège les écritures concurrentes (409).

## Statuts
`proposed` → `accepted` (impossible tant qu'un constat **critique non résolu** subsiste) → `applied` (brouillon de page écrit) ; `discarded`. `unapply` revient à `accepted`.

## Application (Content Mapper) — `engine.apply`
Pour chaque champ : section retrouvée par identifiant (sinon par position et type), valeur actuelle lue ; écriture **seulement** si le champ de la page est vide/espace réservé, inchangé depuis la génération, ou égal à la dernière valeur appliquée ; sinon **conservé** et signalé (`overwriteManual` pour forcer, explicitement). Champs verrouillés et champs avec critique non résolu : ignorés. `fields.write` travaille sur une copie et ne touche que les champs déclarés ; `saveDraft` revalide toute la page avec les normaliseurs natifs (échec = rien d'écrit). SEO : `seo.title/description/focusKeyword` du brouillon, mêmes protections ; l'adresse (slug) n'est jamais modifiée.

## Site entier
`generateSite` : pages traitées en séquence (12 au plus), progression par rappel, échec d'une page n'arrête pas les autres, mais un quota/accès/configuration IA arrête le lot proprement (pages restantes `skipped`).

## Branchement IA
Défaut `gateway.legacy()` = `ai.call` : module « ia » du site, plafond quotidien d'organisation, clé du connecteur. `gateway.viaCore(core, actorOf)` : AI Core de 21.2 (quotas par site/module, routage, coûts), testé avec ses fournisseurs simulés (quota de site atteint → refus, rien d'enregistré). Aucun client fournisseur dans ce module ; aucune clé côté navigateur.
