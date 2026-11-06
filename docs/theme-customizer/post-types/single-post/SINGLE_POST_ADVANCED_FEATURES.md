# Publication unique — fonctionnalités avancées (natives)

| Capacité « Pro » des captures | Dans Kolakisa | Détails réels et limites |
|---|---|---|
| Boîte d'auteur avec partage social | **Fait** | Avatar (taille), nom (lien), biographie, position (avant/après contenu/partage/navigation), alignement, articles récents de l'auteur (0–5). **Profils sociaux : le modèle utilisateur n'a qu'un « site web » ; seul celui-ci est affiché s'il existe. Aucun lien social n'est fabriqué.** Le partage social est celui de l'article (section Partage). |
| Chargement automatique | **Fait** | Voir RENDERING_ENGINE. Testé : configuration, plafond, dernier article sans précédent. Test navigateur non exécuté (voir rapport). |
| Navigation entre publications | **Fait** | Précédent/suivant réels (chronologique ou même catégorie), cartes ou liens, titres et images facultatifs, position, alignement. |
| Taille personnalisée de l'image mise en avant | **Fait** | Prédéfinie / originale / personnalisée (largeur, hauteur), ratio, `object-fit`, `object-position`, alignement ; jamais déformée. **Pas de génération de nouvelles vignettes** : l'image servie reste le fichier de la médiathèque (le navigateur la met à l'échelle). |
| Temps de lecture | **Fait** | Mots réels du texte (hors code, scripts, légendes, tableaux, médias), vitesse 100–500 mots/min, texte avec `{n}`, minutes ou fourchette. Un temps saisi à la main dans l'éditeur garde la priorité. |
| Typographie étendue | **Fait** | 14 groupes × police (bibliothèque + polices du site), taille par appareil, graisse, hauteur de ligne, espacement des lettres, casse, alignement. Vide = hérité. |
| Espacement étendu | **Fait** | Marges et paddings à 4 côtés, par appareil, unités px/em/rem/% ; 12 espacements indépendants. |
| Partage social | **Fait** | Facebook, X, LinkedIn, WhatsApp, Pinterest, Telegram, e-mail, copier le lien ; avant/après/flottant ; libellés ; style, taille, espacement. Liens sur l'URL réelle. Aucun compteur. |

## Commentaires
Affichage, compteur, titre, texte du champ, bouton, message « aucun commentaire », position. **La profondeur des réponses, la pagination, la modération, l'anti-spam et les invités restent les réglages du module Commentaires** (déjà complets, par site) : ils ne sont pas dupliqués ici. Aucun commentaire fictif.
