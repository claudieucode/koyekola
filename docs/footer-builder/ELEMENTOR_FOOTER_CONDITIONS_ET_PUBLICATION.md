# Conditions d'affichage, priorité, publication, révisions, import/export du pied de page

Légende : **[C]** lu dans l'article officiel · **[O]** déduit · **[N]** non vérifiable · **[K]** choix Kolakisa.
Sources lues : `conditions` (modifié 01/10/2026), `show-and-hide-elements-on-a-page-display-conditions` (15/09/2026), `copy-and-clear-display-conditions`, `conditions-triggers-and-advanced-rules` (concerne les popups), `how-to-fix-a-missing-header-or-footer-in-elementor`, `the-elementor-theme-builder`, `footer-site-part`, `revision-history-undo-and-redo`, `how-many-versions-of-a-post-does-elementor-store`, `import-and-export-elementor-website-templates`, `template-library`, `using-elementor-pros-theme-builder-templates-with-wpml`. La page développeur `developers.elementor.com/docs/theme-conditions/` a été résumée dans `ELEMENTOR_DISPLAY_CONDITIONS.md` (lecture précédente) ; non relue ici.

## 1. Fenêtre des conditions d'un pied

* **[C]** À « Publish » (première fois) la fenêtre s'ouvre ; « Add condition » ; réglage par défaut = tout le site ; « Save & Close ».
* **[C]** Pour limiter : liste de gauche = **Include (inclure) / Exclude (exclure)** ; liste de droite = les pages visées.
* **[C]** Plusieurs conditions possibles sur un modèle (ex. catégorie Chemises + catégorie Pantalons).
* **[C]** Modification ultérieure : éditeur > flèche à côté de « Publish » > « Display Conditions », ou carte du Theme Builder > « Edit Conditions ».
* **[C]** Un **avertissement** s'affiche si la condition entre en conflit avec celle d'un autre modèle.
* **[C]** « Copy and clear display conditions » : cela concerne les **conditions d'éléments** (clic droit sur un élément : copier, « Paste display conditions », « Clear display conditions »), pas celles des modèles.

## 2. Cibles des conditions de modèle (liste complète lue) [C]

| Famille | Choix |
|---|---|
| **Entire Site** | toutes les pages |
| **Singular** | All Singular · Front Page (accueil) · Posts (tous / précis ; In Category ; In Child Categories ; In Tag ; Posts by Author) · Pages (toutes / précises ; Page by Author) · Landing Pages (+ by Author) · Floating Buttons (+ by Author) · Media (+ by Author) · Direct child of · Any child of · By Author · 404 Page |
| **Archives** | toutes / précises : Author Archive · Date Archive · Search Results · Posts Archive · Categories · Direct Child Category of · Any Child Category of · Tags |
| **WooCommerce** | All Product Archives · Shop Page · Search Results · Product Category · Product Tags · Products · In Category · In Child Product Categories · In Tag · Products by Author |

Remarques de lecture :
* **[C]** « Page by Author » est décrit « All posts by a selected author » et « In Tag » WooCommerce « All WooCommerce pages in a selected category » : **textes copiés d'autres entrées** (erreurs de l'article, déjà notées en interne).
* **[C]** « By Author » = tout élément d'un auteur.
* **Types de contenu personnalisés (CPT)** : la doc d'introduction dit qu'on peut créer des modèles Single/Archive pour des CPT dans le Theme Builder avec conditions ; la **liste détaillée des conditions par CPT** n'est pas dans l'article `conditions` → **[N]** pour les détails.
* **Par taxonomie personnalisée** : **[N]** (seules catégories et étiquettes sont listées).

## 3. Priorité, spécificité, conflits

* **[C]** Un avertissement existe en cas de conflit (exemple : deux en-têtes sur « toutes les pages »).
* **[N]** La règle qui décide lequel s'affiche : **non écrite** dans les articles. Pas de barème de spécificité publié. Pas de règle publiée pour « inclure + exclure ».
* **[N]** Nombre maximal de conditions par modèle, suppression de toutes les conditions (le modèle redevient brouillon : seule la pastille grise est décrite comme « sans condition = brouillon » [C]).
* **[K]** Barème Kolakisa (déjà décidé, voir `ELEMENTOR_DISPLAY_CONDITIONS.md`) : une exclusion l'emporte ; le plus précis gagne (contenu précis 100 › enfant direct/descendant 80 › taxonomie/auteur précis 60 › type de contenu/archive précise 40 › type général 20 › tout le site 10) ; égalité → le plus récent publié → plus petit identifiant ; égalité parfaite de conditions refusée à la publication ; brouillon/archivé ne s'applique jamais ; **un seul pied par page**.
* **[K]** Pour le pied : « Tout le site » par défaut ; exclusions pour pages d'atterrissage ; pied spécial pour boutique / blog / une page précise.

## 4. Display Conditions d'un élément (hors modèle) [C]

Réglage sur un widget/conteneur : Réglages > icône « Display Conditions » > « + Add Condition ». **Prennent effet après Save/Publish de la page.**
* **Pages** : parent de la page, auteur.
* **Articles** : dans les catégories, dans les étiquettes, date de modification, date de publication, auteur.
* **Statut de l'utilisateur** : connecté ou non, rôle, date d'inscription.
* **Date et heure** : jour de la semaine, heure, date. **Heure du serveur, pas celle du visiteur** [C].
* **Archives** : « Of Tags », « Of Categories ».
* **Autres** : provenance (From URL).
* Combinaison : bouton **AND** (toutes les conditions) et **Add Condition group** (OR, groupe alternatif). Contradiction interne de l'article : une phrase finale dit que plusieurs conditions sont « toujours reliées par ET » — c'est vrai à l'intérieur d'un groupe ; les groupes sont reliés par OU [O].
* **Limite [C]** : les conditions dynamiques « ne font pas bon ménage avec le cache » → désactiver le cache avancé ou les plugins de cache.
* **Plan requis** : **[N]** (le tableau de comparaison ne liste pas cette fonction).
* **Cas pied** : afficher un bandeau de pied différent selon connecté/non connecté, selon la date (période de fêtes), selon le jour/l'heure (horaires d'ouverture) [O].
* **[K]** Pour Kolakisa : à reporter, sauf « connecté / non connecté » et « appareil » (déjà couvert par masquage).

## 5. Pas de condition = brouillon ; publication

* **[C]** Pastille verte = en ligne (conditions) ; grise = brouillon (aucune).
* **[C]** Bouton rose « Publish » = brouillon ; « Update »/grisé = publié ; brouillon/privé jamais visible.
* **[C]** Dépublier : **non décrit** comme action propre. Les actions décrites : Trash (corbeille, confirmation). Passer en brouillon : **[N]**. En supprimant toutes les conditions (si possible) le modèle est « brouillon » d'après la pastille [O].
* **[C]** « Aperçu » : le Theme Builder ne décrit pas de mode aperçu avec conditions → **[N]**. (Le bouton « Preview Changes » de l'éditeur existe en pratique mais n'est pas dans les articles lus.)
* **[C]** Pourquoi un pied n'apparaît pas : conditions absentes ou mal posées (« Entire Site » pour un global), mise en page de page Canvas, modèle non publié, éléments masqués par appareil, cache. Vérifier dans cet ordre.

## 6. Auto-enregistrement (autosave)
**[N]** Aucun article lu ne décrit un enregistrement automatique des modèles. Les seules traces : l'historique « Actions » de la session et les révisions créées à chaque enregistrement. **[K]** Kolakisa : prévoir un brouillon de travail séparé du publié (déjà acté dans le cycle de vie).

## 7. Révisions [C]
Voir ARCHITECTURE §10. Rappel : Historique > onglet Revisions ; une révision à chaque sauvegarde/publication ; cap WordPress (`WP_POST_REVISIONS`) ; hébergement Elementor : 25 dernières. Restaurer une version précédente : article `restore-previous-version-of-a-post` récupéré mais **non lu** [N] ; la restauration par l'onglet Revisions est, elle, confirmée [C]. Retour à une version précédente **d'Elementor** (logiciel) : article distinct non lu [N].

## 8. Import / export [C]
* Un pied : ⋯ > Export > `.json` ; Import dans le Theme Builder (`.json` ou `.zip`, téléversements non filtrés requis, API REST active).
* Site complet : Elementor > Editor > Tools > Website Templates ; cases Contenu / **Modèles** / Réglages / fichiers perso / thème / extensions ; sortie `.zip` ou bibliothèque cloud.
* Un modèle exporté contient son design ; **le comportement des conditions à l'import** (sont-elles reprises ?) n'est **pas décrit** → **[N]**. [K] Kolakisa : importer en **brouillon, sans conditions**, à confirmer par l'utilisateur.
* Erreurs fréquentes d'import : article `how-to-fix-common-errors-with-import-export` listé, **non lu** [N] ; « page blanche à l'import » listé aussi [N].

## 9. Multilingue [C]
Conditions uniquement sur le modèle de la langue principale ; modèle traduit lié au principal ; taxonomie de la langue secondaire liée.

## 10. Ce que cela implique pour Kolakisa [K]
Obligatoire : inclure/exclure, Tout le site, Page d'accueil, Pages/Articles (tous ou précis), Archives (blog, catégorie, étiquette, auteur), Recherche, 404, boutique/produits si la boutique est active, brouillon/publié, avertissement de conflit, un seul pied par page, export/import JSON, révisions.
Souhaitable : enfants directs/descendants, par auteur, CPT, duplication.
Hors périmètre initial : Display Conditions par date/heure/rôle (cache, serveur), WPML-like (traduction), floating buttons, conditions « Landing Pages ».
