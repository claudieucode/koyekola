# Synthèse — périmètre recommandé du Footer Builder Kolakisa

Une page. Légende : [C] confirmé par un article lu · [N] non vérifiable · [K] recommandation. Détails dans les six autres fichiers de ce dossier.

## Ce qu'Elementor fait (en bref)
Le pied est un modèle du Theme Builder (fonction Pro). On le dessine avec des conteneurs et des widgets, on publie, puis on choisit **où il s'affiche** avec des conditions « inclure / exclure » [C]. Brouillon = pastille grise, en ligne = pastille verte [C]. Les révisions, l'annulation, l'export `.json` et la bibliothèque de modèles existent [C]. Elementor respecte la préférence « réduire les animations » du visiteur pour ses effets de mouvement [C].

## OBLIGATOIRE (à livrer en premier)
1. **Un pied par page, choisi par conditions** : Tout le site, accueil, pages, articles (catégorie/étiquette/auteur), archives, recherche, 404, boutique ; inclure et exclure ; le plus précis gagne ; avertissement de conflit ; brouillon / publié / dépublié.
2. **Balise `footer`** (repère pour lecteurs d'écran) posée automatiquement [C].
3. **Structure en conteneurs** : direction, justification, alignement, écart, retour à la ligne, largeur boxed/pleine, hauteur min., marges, remplissages, ordre, masquage par appareil [C].
4. **Style** : couleur/dégradé/image de fond avec voile, bordure, rayon, ombre, typographie, couleurs globales [C].
5. **Widgets essentiels** : Image, Logo du site, Titre du site, Titre, Texte, Menu (de l'emplacement « Pied de page »), Liste d'icônes, Bouton, Séparateur, Icônes sociales, Copyright (année automatique), Recherche, Formulaire d'abonnement réel, coordonnées, liens légaux [C pour les réglages].
6. **Responsive à 3 appareils avec héritage** (1024 / 767) [C] ; aucune barre de défilement horizontale.
7. **Animations sobres + respect de « réduire les animations »** (entrée, survol) [C].
8. **Révisions, annuler/rétablir, export/import JSON** validés, import en brouillon sans conditions [C/K].
9. **Isolation par site** (un pied n'est jamais visible ni modifiable d'un autre site) et **rendu sans code non sûr** [K].
10. **Plan de tests** : au moins les groupes A, B, C, E, G, H, I du fichier PLAN_DE_TESTS.

## SOUHAITABLE (ensuite)
Dupliquer un pied ; états Survol/Focus/Actif sur tous les widgets ; séparateur de forme ; vidéo de fond avec image de secours ; compteur ; accordéon (liens repliables sur mobile) ; carte ; mini-panier / Mon compte / catégories produit (si boutique) ; liste des derniers articles ; points de rupture personnalisables ; conditions « enfant de », « par auteur », types de contenu perso ; z-index et position absolue encadrés ; autosave du brouillon.

## HORS PÉRIMÈTRE (pour l'instant) et pourquoi
| Fonction | Raison |
|---|---|
| Parallaxe, effets de souris (suivi, inclinaison 3D) | Coût en performance, aucun besoin d'un pied, risque pour le mouvement réduit |
| Pied collant (sticky) | Elementor ne le documente que pour l'en-tête [N] ; gêne sur mobile |
| Widget HTML / Shortcode libres | Risque de sécurité (Elementor les limite lui-même aux administrateurs [C]) |
| CSS personnalisé libre, attributs personnalisés | Risque de fuite de style / sécurité ; Pro avancé chez Elementor [C] |
| Display Conditions par date, heure, rôle, provenance | Dépend du cache et de l'heure serveur [C] |
| Modes de fusion, masques, transformations 3D, diaporama de fond | Peu utiles à un pied, coût élevé |
| Lottie, Off Canvas, widgets Facebook, boutons flottants | Hors besoin d'un pied ; dépendances tierces |
| Traduction type WPML | Sujet séparé (multilingue) |
| Pages panier / paiement / compte comme parties de site | Hors pied ; faux paiement interdit |

## Ce qui n'a PAS pu être confirmé
* **Règle de priorité exacte** d'Elementor entre plusieurs pieds, et « inclure + exclure » : non écrite [N] (Kolakisa garde son propre barème).
* **Autosave, bouton Aperçu, dépublication** comme actions propres : non décrits dans les articles lus [N].
* **Conditions par type de contenu perso / taxonomie perso** : non détaillées [N].
* **Noms des six points de rupture optionnels**, et ce que « réduire les animations » couvre exactement (survol, compteur, vidéo, Lottie…) [N].
* **Accessibilité interne des widgets** (menu, onglets, accordéon, icônes sociales) : non décrite [N].
* **Comportement des conditions à l'import** d'un pied [N].
* **Plan requis des Display Conditions d'éléments**, effets souris [N].
* **Articles récupérés mais non étudiés en détail** : Loop Grid, Posts, Lottie, Off Canvas, Contact/Floating Button (réglages), Galerie, Carrousels, Interactions, restauration de version, Global Colors/Fonts, grille (Grid), articles de dépannage (import, Safari, Windows 11).
* **Aucune interface Elementor réelle** n'a été ouverte : aucune observation directe [O] n'est revendiquée.
* La mention « Hello Biz » (pied type Marque / Navigation / Contact) vient de `docs/theme-builder/elementor-footer-reference.md` (lecture antérieure) ; l'article `customize-your-hello-biz-footer` a été récupéré mais pas relu ici.
