# Inventaire des fonctionnalités WordPress

Colonnes : **S** = système (C = Customizer classique, É = éditeur de site) · **Preuve** (Doc / Connu / Déduit). Détail dans les autres fichiers.

| # | Fonctionnalité | S | Emplacement | Prérequis thème | Prévisualisation | Sauvegarde | Preuve |
|---|---|---|---|---|---|---|---|
| 1 | Titre et slogan | C/É | Identité | tous | direct | publier / enregistrer | Doc |
| 2 | Logo | C/É | Identité | thème avec `custom-logo` | direct | idem | Doc |
| 3 | Icône du site (≥ 512 px carré) | C/É | Identité | tous | onglet | idem | Doc |
| 4 | Afficher/masquer titre+slogan | C | Identité | thème | direct | idem | Doc |
| 5 | Couleur d'arrière-plan | C | Couleurs | thème | direct | idem | Doc |
| 6 | Mode sombre | C | Couleurs | Twenty Twenty-One | direct | idem | Doc |
| 7 | Image d'arrière-plan + options | C/É | Arrière-plan | thème | direct | idem | Doc |
| 8 | Image d'en-tête | C | En-tête | `custom-header` | direct | idem | Doc (liste de sections) |
| 9 | Menus (créer, items, emplacements) | C | Menus | emplacements du thème | direct | idem | Doc |
| 10 | Widgets / blocs de zones | C | Widgets | zones du thème | direct | idem | Doc |
| 11 | Page d'accueil statique/derniers articles | C | Accueil | tous | recharge | idem | Doc |
| 12 | Extraits (résumé/texte intégral) | C | Extraits | thème | recharge | idem | Doc |
| 13 | CSS additionnel | C/É | Css | tous / bloc | direct | idem | Doc |
| 14 | Aperçu d'appareil | C/É | bas / menu aperçu | tous | — | — | Doc |
| 15 | Édition directe (crayon) | C | aperçu | thème (partials) | — | — | Doc |
| 16 | Contexte (`active_callback`) | C | panneau | — | selon page | — | Doc |
| 17 | Brouillon, planification, lien de partage | C | Publier | tous | — | changeset | Connu |
| 18 | Variations de styles | É | Styles | bloc | direct | enregistrer | Doc |
| 19 | Palette, dégradés, personnalisés | É | Styles→Couleurs | bloc | direct | idem | Doc |
| 20 | Typographie globale (H1–H6, texte, liens, boutons) | É | Styles | bloc | direct | idem | Doc |
| 21 | Tailles préréglées / fluides | É | Styles | bloc | direct | idem | Doc |
| 22 | Largeurs, remplissage, espacement des blocs | É | Styles→Mise en page | bloc | direct | idem | Doc |
| 23 | Styles par bloc (bordure, rayon, ombre…) | É | Styles→Blocs | bloc | direct | idem | Doc |
| 24 | Style Book | É | Styles | bloc | oui | — | Doc |
| 25 | CSS global / par bloc | É | Styles ⋯ | bloc | direct | idem | Doc |
| 26 | Révisions de styles, réinitialisation | É | Styles ⋯ | bloc | — | oui | Doc |
| 27 | Modèles (créer, éditer, assigner, renommer, supprimer, réinitialiser) | É | Modèles | bloc | oui | enregistrer | Doc |
| 28 | Parties de modèles (en-tête, pied…) | É | Compositions | bloc | oui | enregistrer | Doc |
| 29 | Compositions (patterns), synchronisées | É | Compositions | bloc | oui | enregistrer | Doc / Connu |
| 30 | Navigation (bloc) | É | Navigation | bloc | oui | enregistrer | Doc |
| 31 | Pages dans l'éditeur | É | Pages (6.3+) | bloc | oui | enregistrer | Doc |
| 32 | Vue en liste (structure) | É | barre | bloc | — | — | Doc |
| 33 | Annuler / rétablir | É | barre | bloc | — | session | Doc |
| 34 | Palette de commandes | É | Cmd+K | bloc | — | — | Doc |
| 35 | Export du thème (zip) | É | Options→Outils | bloc | — | fichier | Doc |
| 36 | Avertissement de modifications non enregistrées | É | retour | bloc | — | — | Doc |
