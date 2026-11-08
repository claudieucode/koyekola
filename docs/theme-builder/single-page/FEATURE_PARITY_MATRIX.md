# Matrice de parité Single Page : Elementor / Kolakisa

**OK** présent et testé ; **Partiel** ; **Absent** ; **À vérifier**.

| Fonction | Elementor | Kolakisa | État |
|---|---|---|---|
| Modèle Single Page + bibliothèque | Oui | 100 modèles (assemblés, voir audit) | Partiel (diversité) |
| Insertion / copie indépendante | Oui | « Utiliser » = copie | OK |
| Édition visuelle complète | Oui | Page Builder | OK |
| Aperçu avec une page réelle | Oui | Absent pour ce type | **Absent** |
| Conditions inclure/exclure | Oui | Oui (toutes, précise, enfants, accueil) | OK |
| Priorités, un gagnant | N | Documenté et testé | OK |
| Titre dynamique | Page Title | `{{post.title}}` | OK |
| Contenu de la page | Post Content | `postcontent` unique | OK |
| Extrait/description | Oui | `{{post.excerpt}}` | OK |
| Image mise en avant | Selon contexte | Retirée pour une page | Partiel |
| Champs personnalisés dynamiques | Oui (Pro) | Aucun champ de page | **Absent** |
| Données entreprise dynamiques | Oui (tags) | `biz*`, `business.*` | OK |
| Widgets natifs de présentation | ~60 | ~160 au registre, ~30 utilisés | OK (sous-utilisés) |
| Formulaires | Form (Pro) | `signupform` (formulaires du site), `emailsubscribe`, `bizcontact` | OK / constructeur de formulaire libre : À vérifier |
| Connexion / inscription | Login (Pro) | `account` | À vérifier |
| Popup / modale | Pro | `modal`, `floatingbutton` | À vérifier |
| Carte | Google Maps | `map` | OK |
| Animations, effets | Oui | Studio de mouvement + 45 composants motion | OK |
| Visibilité conditionnelle (appareil, audience, planning) | Pro | Oui (`AUDIENCES`, `scheduleMatches`, masquage par appareil) | À vérifier sur modèles |
| Responsive par appareil | Oui | `styles.desktop/tablet/mobile` | OK |
| Styles globaux / variables | Oui | Jetons du site, classes globales | OK |
| CSS personnalisé | Pro | CSS de page assaini | À vérifier |
| Header/footer séparés | Oui | Oui | OK |
| Multi-site | Multisite WP | Copie indépendante par site | OK (testé) |
| SEO : un seul H1 | Dépend du thème | H1 du modèle (risque de doublon avec le contenu) | Partiel |
| Répétiteurs, boucles de page | Pro | `loop` (grilles de liste dynamiques) | À vérifier pour les pages |
