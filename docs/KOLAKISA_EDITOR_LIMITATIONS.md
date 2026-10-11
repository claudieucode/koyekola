# Limites connues

1. **Documentation Elementor partielle** : 8 widgets lus en détail sur plus de 80 ; beaucoup de pages d'aide ne sont connues que par leur titre ou un extrait de recherche (voir `elementor-reference/16-official-sources.md`). Gratuit/Pro non établi pour la plupart des widgets.
2. **Pas de tailles carrées recadrées ni de taille « personnalisée »** pour les images : les versions conservent le ratio (aucun recadrage), largeurs fixes. Volontaire (pas de recadrage destructif sans contrôle utilisateur).
3. **Sources d'image sans choix de résolution** : logo du site, image du bandeau « héros » historique, vignettes d'articles/formations et image mise en avant (ces dernières appartiennent aux bibliothèques du blog et du catalogue, pas à la médiathèque du Page Builder : stockage différent).
4. **`sharp` est une dépendance native optionnelle** : si l'hébergement ne peut pas l'installer, l'éditeur affiche « Les versions réduites ne sont pas disponibles sur ce serveur » et sert les originaux. Premier déploiement à surveiller (installation npm, journal d'exécution).
5. **AVIF** : dimensions inconnues → aucune taille proposée pour ces images (pas de lien cassé).
6. **GIF** : non réduit (peut être animé) ; **SVG** non accepté par la médiathèque.
7. Stockage : chaque taille choisie crée un fichier de plus (jusqu'à 5 par image) ; pas de nettoyage automatique des tailles devenues inutilisées (retirées seulement à la suppression définitive).
8. **Galerie** : 6 colonnes au plus (Elementor : 24) ; pas de type « Multiple » avec titre ; les filtres reposent sur des étiquettes saisies à la main.
9. **Points de rupture personnalisés** et « coller depuis un autre site » : non faits (décisions de produit).
10. **Documentation Elementor** : échantillon (point 1) ; à compléter widget par widget.
11. Suite complète des tests non exécutée (voir rapport de tests).
