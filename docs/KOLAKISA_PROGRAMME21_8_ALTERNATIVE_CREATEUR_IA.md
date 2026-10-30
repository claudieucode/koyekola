# Programme 21.8 — réalisation alternative « Créateur IA » (NON fusionnée)

Cette branche (`alt/programme-21-8-createur-ia`) contient une seconde implémentation de l'interface du constructeur de sites IA, écrite **en parallèle** de celle déjà fusionnée dans `main` (commit `bdb0607e`, écran `/marketing/ia/studio`). Les deux se recouvrent presque entièrement et **portent les mêmes noms de fichiers** (`public/js/ai-builder.js`, `public/css/ai-builder.css`, `src/marketing/web/aiBuilder.js`) : elles ne peuvent pas être fusionnées telles quelles, et deux interfaces pour la même fonction violeraient la règle « ne duplique aucun moteur ». **Rien n'a été fusionné ni déployé depuis cette branche.**

## Contenu
- `src/aiBuilder/` : façade de projet (tables créées à la demande `mk_aib_projects`, `mk_aib_events`, aucune migration) ; progression calculée sur les états réels des moteurs 21.3 à 21.7 ; journal annuler/rétablir ; liste de contrôle de publication ; assistant à règles avec propositions avant/après.
- `src/marketing/web/aiBuilder.js` + `views/marketing/site-ai-builder.ejs` + `public/js/ai-builder.js` + `public/css/ai-builder.css` : écran `/site-web/sites/:id/createur-ia` (barre fixe, 8 étapes, zone centrale, assistant repliable, mobile par onglets d'étapes).
- Tests : `programme21-8-builder-interface.test.js` (20), `…-http.test.js` (4, parcours réel des 5 moteurs), essai navigateur réel `tests/manuel/ai-builder-ui-smoke.js` (22 contrôles, Chrome).

## Ce que cette version a de plus que celle de `main` (d'après le document de limites de `main`)
- Écran des **contenus** complet : champs par page, indicateur IA / modifié à la main / appliqué / à compléter, édition, verrou, **variantes comparables** (raccourcir, développer, plus commercial…), validation et application protégée du texte manuel (limite L3 de `main`).
- **Rétablir** (plan) en plus d'annuler ; annulation de la génération de pages, du design, des contenus.
- Contrôle des **liens internes cassés** et des images introuvables dans l'aperçu (limite L7 de `main`).
- Progression sans pourcentage inventé, génération d'image « en cours » jamais comptée comme terminée.

## Ce qu'elle n'a pas (et que `main` a)
Migration 120 et historique de projets persistant propre ; 28 tests HTTP + 11 navigateur dans la suite ; passerelle plan→générateur intégrée au module du Site Planner ; écran d'accueil de reprise lié à l'assistant de création.

## Recommandation
Garder **une seule** interface (celle de `main`) et reprendre dans celle-ci, au besoin, l'écran des contenus (variantes, verrou, indicateurs) et les contrôles de liens — plutôt que d'en publier deux.
