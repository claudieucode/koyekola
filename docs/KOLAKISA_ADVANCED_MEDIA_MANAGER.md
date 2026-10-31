# Media Manager avancé

## Déjà présent (audit)
Grille/liste, recherche, filtres (type, mois, taille, dimensions, extension, **doublons**, volumineux, site, dossier), tri, dossiers, corbeille, suppression définitive bloquée si utilisé, `mediaUsage` (pages, modèles, composants…), métadonnées (alt, légende, description, étiquettes, catégorie, licence, auteur, focal), provenance et historique.

## Ajouté : diagnostic de site (`GET …/medias-ia/diagnostic.json?limite=40`)
Pour les 40 premières images : doublons stricts (SHA-256), inutilisées, lourdes, de mauvaise qualité (floue, petite, sombre, surexposée), licences non vérifiées, problèmes d'ALT, cohérence de style, correspondance à la marque. Aucune écriture.

## Non fait
Pas d'écran : les routes renvoient du JSON. Pas de recherche « par sujet » (seulement descriptions/étiquettes déjà existantes), pas d'images « semblables » (seulement doublons stricts), pas de favoris/collections, pas de remplacement ni de recadrage persistant depuis le diagnostic. La suppression reste celle de la médiathèque (contrôle des dépendances inchangé, vérifié non modifié).
