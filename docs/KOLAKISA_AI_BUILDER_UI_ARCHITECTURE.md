# KOLAKISA — Assistant IA : architecture de l'interface

## Couches
`navigateur (public/js/ai-builder.js)` → `routes (web/aiBuilder.js)` → `workspace.js` → moteurs (plans, pageGen, designGen, contentGen, aiMedia, pages) → base.
Aucune logique de moteur dans le navigateur ni dans les routes. Le serveur renvoie un **état complet** (`etat.json`) : étapes, statuts, progression, liste de contrôle, médias, conversation ; le navigateur le dessine. Chaque action renvoie le nouvel état.

## Statuts et progression : calculés, jamais saisis
`workspace.state` lit : le plan (statut, révision), les générations de pages (proposée/appliquée) et les **pages réellement présentes** (une page supprimée devient « Introuvable »), les directions artistiques appliquées, les jeux de textes, les besoins/tâches médias, les contrôles de préparation natifs, les domaines. Une étape n'est « Terminée » que sur ces faits : une génération d'image en attente est « En cours », un plan non validé bloque les pages. Progression = étapes terminées / 8 (le pourcentage affiche cette base).

## Annuler / rétablir
Avant chaque modification du plan faite depuis l'interface, la copie du plan est enregistrée (`mk_ai_builder_states`, 30 niveaux). « Annuler » restaure par `plans.restoreState` (protégé par la révision, historisé « restored »). Plusieurs opérations (dupliquer une page = page + sections) = **une seule** entrée. Un lot dont une opération échoue est entièrement défait. Une nouvelle modification vide la pile « rétablir ». Les pages, le design, les contenus et les médias ont leurs **propres** annulations (génération, application).

## Concurrence
Toute modification du plan envoie la révision vue : conflit → HTTP 409 « rechargez » ; une proposition d'assistant n'est applicable que sur la révision pour laquelle elle a été faite.

## Interface
Page plein écran (grille : 56 px de barre, 264 px de navigation, zone fluide, 340 px d'assistant) : la structure ne change pas d'une étape à l'autre (vérifié par mesure). < 1180 px : l'assistant devient un tiroir replié ; < 760 px : navigation horizontale au-dessus du travail. Textes insérés par `textContent` (jamais `innerHTML`). Anneau de focus 2 px ; focus conservé lors des redessins. Mouvement réduit respecté.

## Performance
État JSON unique par action ; sondage (3 s) seulement quand une génération d'image est en cours et que l'étape médias est ouverte ; listes bornées (messages 200, projets 100, pages ≤ 12 par génération, médias 40). **Pas de virtualisation** (non nécessaire aux volumes de ces moteurs) ; **non mesuré** au-delà de quelques pages.
