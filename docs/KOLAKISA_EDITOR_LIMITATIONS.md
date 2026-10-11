# Limites connues — 10 octobre 2026

1. **Lecture d'Elementor** : environ 140 articles lus en entier ; **non lus** : e-commerce/WooCommerce, Theme Builder et kits (détails), IA, MCP, accessibilité, performance, hébergement, et de nombreux tutoriels pas à pas (liste dans `elementor-reference/17-…`). Gratuit / Pro établi seulement quand l'article le dit.
2. **`sharp` (version réduite des images)** : dépendance native **optionnelle**. Sans elle, l'éditeur le dit et sert les originaux. Son chargement sur Hostinger doit être vérifié dans l'éditeur après déploiement.
3. **Images** : pas de tailles carrées recadrées ni de taille « personnalisée » (ratio toujours conservé) ; logo du site et image « héros » historique sans choix de taille ; AVIF (dimensions inconnues) et GIF non réduits ; pas de nettoyage automatique des tailles devenues inutilisées (retirées à la suppression définitive).
4. **Compte à rebours par visiteur** : mémorisé dans le navigateur (`localStorage`) ; un visiteur qui l'efface repart de zéro (comme chez Elementor).
5. **Jours et heures d'affichage** : heure de Paris, évaluée à chaque affichage ; pas de groupes ET / OU, ni de condition de rôle.
6. **Magnétisme de défilement** : inactif dans l'éditeur ; dépend du navigateur (`:has()`, Chrome / Safari / Firefox récents).
7. **Galerie** : 6 colonnes au plus (Elementor 24) ; pas de type « Multiple » avec titre ; filtres par étiquettes saisies à la main.
8. **Playlist vidéo** : YouTube et Vimeo ; pas de lecture automatique de la suivante (exigerait l'API des lecteurs).
9. **Bouton flottant** : WhatsApp, Messenger, e-mail, SMS ; pas de fenêtre de discussion intégrée.
10. **Collage depuis un autre site** : demande l'autorisation du navigateur de lire le presse-papiers.
11. **Poids des pages publiques** : `landing.css` +11 Ko (+2,5 Ko compressé), `landing.js` +3 Ko (+0,8 Ko compressé), sur chaque page publique.
12. **Navigateurs** : tout est testé sur Chrome seulement ; Safari et Firefox non testés.
13. **Non faits** (raison dans `KOLAKISA_EDITOR_GAP_ANALYSIS.md`) : appareils supplémentaires, liens intelligents (agenda, Waze…), widgets Facebook (embed, commentaires, flux), dons et abonnements PayPal, Sitemap, SVG, shortcodes, icônes personnalisées, titres en p / div / span.
