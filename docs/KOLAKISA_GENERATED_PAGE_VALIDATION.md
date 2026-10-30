# Validation des pages générées

1. Plan : version, bornes, genres, clés uniques, propriétés inconnues écartées.
2. Structure (`validateSections`) : tableau ; ≤ 30 sections (limite du moteur) ; chaque section est un objet dont le `type` est un composant **utilisable** (pas `layout`/`component`) ; chaque propriété est dans la liste du normaliseur réel + attributs communs. Sinon rejet.
3. Valeurs : `sections.normalizeSections` (services natifs) — adresses, images, vidéos, formations existantes, longueurs.
4. Correction contrôlée : une section dont les **valeurs** sont refusées est retirée et signalée ; une erreur de **structure** invalide la page entière.
5. Juste avant l'écriture : revalidation (une proposition altérée en base est refusée), droits et site vérifiés, révision du brouillon contrôlée par `saveDraft`.
6. Publication : jamais. Le contrôle de publication du moteur (formulaire associé, formations en ligne…) reste appliqué le jour où la personne publie.
