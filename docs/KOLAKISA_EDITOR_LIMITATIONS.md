# Limites connues — 10 octobre 2026

1. **Lecture d'Elementor** : environ 180 articles lus en entier. **Non lus** : e-commerce, Theme Builder et kits (détails), intégrations de formulaires et dépannage, IA / MCP, accessibilité, performance, hébergement, domaines et quelques tutoriels (liste dans `elementor-reference/17-…`). Gratuit / Pro établi seulement quand l'article le dit.
2. **`sharp` (version réduite des images)** : dépendance native **optionnelle**. Sans elle, l'éditeur le dit et sert les originaux. Son chargement sur Hostinger doit être vérifié dans l'éditeur après déploiement.
3. **Images** : pas de tailles carrées recadrées ni de taille « personnalisée » ; logo du site et image « héros » historique sans choix de taille ; AVIF et GIF non réduits.
4. **Compte à rebours par visiteur** : mémorisé dans le navigateur ; effacé, il repart de zéro (comme chez Elementor).
5. **Jours et heures d'affichage** : heure de Paris, évaluée à chaque affichage de la page.
6. **Magnétisme de défilement** : inactif dans l'éditeur ; dépend du navigateur (`:has()`).
7. **Galerie** : 12 colonnes au plus (Elementor 24).
8. **Playlist vidéo** : YouTube et Vimeo ; pas de lecture automatique de la suivante.
9. **Fenêtres à ouverture automatique** : déclencheurs chargement, défilement, sortie (souris), inactivité ; la sortie par la souris n'existe pas sur écran tactile. Fréquence mémorisée dans le navigateur.
10. **Contenu Facebook** : dépend de facebook.com (cookies en Europe) ; pas de commentaires.
11. **Lien intelligent** : l'heure de l'événement est celle de Paris ; les schémas `skype:` et `viber://` ne marchent que si l'application est installée.
12. **Plan du site** : reprend le plan XML (pages, articles, formations publiés et indexables) ; les pages d'un site à domaine propre n'y figurent pas.
13. **Collage depuis un autre site** : demande l'autorisation du navigateur de lire le presse-papiers.
14. **Poids des pages publiques** : `landing.css` et `landing.js` ont grossi (voir rapport de performance).
15. **Navigateurs** : tout est testé sur Chrome seulement ; Safari et Firefox non testés.
16. **Non faits** (raison dans `KOLAKISA_EDITOR_GAP_ANALYSIS.md`) : appareils supplémentaires, Commentaires Facebook, PayPal dons / abonnements, SVG, shortcodes, icônes personnalisées, conditions propres aux modèles d'article, popups (clics, pages vues, source), Notes, export des classes, modèle alterné de boucle.
