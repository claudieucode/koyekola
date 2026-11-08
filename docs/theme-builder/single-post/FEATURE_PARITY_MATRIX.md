# Matrice de parité Single Post : Elementor / Kolakisa

État : **OK** = présent et testé ; **Partiel** = présent avec écart ; **Absent** ; **À vérifier** = non audité dans cette étape.

| Fonction | Elementor | Kolakisa | État |
|---|---|---|---|
| Modèle Single + bibliothèque | Oui | 100 compositions | OK |
| Aperçu avec un article choisi | Oui | « Aperçu avec » | OK |
| Conditions inclure/exclure | Oui | Oui (ids, catégorie, sous-cat., étiquette, auteur) | OK |
| Priorités, un gagnant | N (non documenté) | Hiérarchie documentée | OK (choix Kolakisa) |
| Titre, contenu, image, extrait | Oui | Étiquettes + `postcontent` | OK / extrait sans limite de mots : Partiel |
| Post Info | Oui, riche | `postmeta` | Partiel |
| Termes (catégories, étiquettes) | Oui | `postterms` | OK |
| Boîte auteur | Oui | `authorbox` | Partiel |
| Navigation précédent/suivant | Oui | `postnav` | Partiel (catégorie seulement) |
| Table des matières | Oui | `toc` | Partiel |
| Fil d'Ariane | Oui | `breadcrumb` manuel | Partiel (choix) |
| Partage social | Oui | `sharebuttons` | OK |
| Copier le lien | Oui | À vérifier | À vérifier |
| Barre de progression | tiers | `readingprogress` | OK (avance sur Elementor) |
| Commentaires + formulaire | Oui | `postcomments` ; formulaire du blog | OK / états modération, erreur, signalement : À vérifier |
| Articles liés / récents / populaires / même auteur | Posts / Loop Grid | `querylist` | OK |
| Champs personnalisés dynamiques | Oui (Pro + ACF) | — | **Absent** |
| Sidebars | Oui | Type `sidebar` sous le contenu | Partiel |
| Newsletter / formulaires | Oui | Widget formulaire du Page Builder | À vérifier |
| Réactions / likes | tiers | — | Absent |
| Responsive par appareil | Oui | `styles.desktop/tablet/mobile` | OK (testé 3 largeurs) |
| Visibilité par appareil / conditionnelle | Oui | À vérifier | À vérifier |
| Animations / effets | Oui | Studio de mouvement + animations des widgets | À vérifier sur les modèles |
| Données structurées | Via SEO | `routes/blog.js` + `seo/schema.js`, un seul graphe | OK (aucun JSON-LD dans les modèles : à confirmer par test) |
| Multi-site | Multisite WP | Copie indépendante par site | OK (testé) |
