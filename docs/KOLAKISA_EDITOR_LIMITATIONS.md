# Limites connues

1. **Documentation Elementor partielle** : 8 widgets lus en détail sur plus de 80 ; beaucoup de pages d'aide ne sont connues que par leur titre ou un extrait de recherche (voir `elementor-reference/16-official-sources.md`). Gratuit/Pro non établi pour la plupart des widgets.
2. **Pas de tailles carrées recadrées ni de taille « personnalisée »** pour les images : les versions conservent le ratio (aucun recadrage), largeurs fixes. Volontaire (pas de recadrage destructif sans contrôle utilisateur).
3. **Autres sources d'image** (fond d'image, image mise en avant, vignettes de listes, avatar de témoignage, logo) servent toujours l'original.
4. **`sharp` est une dépendance native optionnelle** : si l'hébergement ne peut pas l'installer, l'éditeur affiche « Les versions réduites ne sont pas disponibles sur ce serveur » et sert les originaux. Premier déploiement à surveiller (installation npm, journal d'exécution).
5. **AVIF** : dimensions inconnues → aucune taille proposée pour ces images (pas de lien cassé).
6. **GIF** : non réduit (peut être animé) ; **SVG** non accepté par la médiathèque.
7. Stockage : chaque taille choisie crée un fichier de plus (jusqu'à 5 par image) ; pas de nettoyage automatique des tailles devenues inutilisées (retirées seulement à la suppression définitive).
8. Écarts non traités : voir `KOLAKISA_EDITOR_GAP_ANALYSIS.md`.
9. Palier 3 à 9 de la mission : non réalisés dans cette session (décisions de produit à prendre : galerie, points de rupture).
