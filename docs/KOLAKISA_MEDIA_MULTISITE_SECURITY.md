# Médias : multi-sites et sécurité

## Audit (inchangé, vérifié par les tests existants)
Une médiathèque par site, dossier `site-<id>`, accès limité à un site imposé côté serveur, médias communs du site principal, rapport d'isolation, envoi : type lu dans le contenu, extensions en liste blanche, nom aléatoire, 5 Mo par image, SVG/HEIC/exécutables refusés, variantes en liste blanche de largeurs.

## Ajouté et testé
- Les 4 routes nouvelles exigent `forms.read` et passent par `aiMedia.siteOf`/`visibleMedia` : un administrateur du site B reçoit 403/404 sur le site A ; une image d'un autre site est introuvable (analyse, inspection, diagnostic vide).
- Lecture seule : aucune écriture en base, aucune tâche, aucun appel de fournisseur.
- Analyse bornée : fichier > 25 Mo refusé, 60 millions de pixels maximum, 3 analyses simultanées, cache de 300 entrées.
- Les chemins viennent de `parsePublicPath` (jamais d'une entrée libre).

## Non testé
Liens temporaires, domaines personnalisés, antivirus d'envoi, accès aux ressources externes (aucune n'existe).
