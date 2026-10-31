# Elementor — conditions d'affichage

## Source documentée (elementor.com/help/conditions/)
Chaque condition = **Inclure / Exclure** + une cible. Défaut : toutes les pages. Plusieurs conditions possibles (ex. catégorie « Chemises » + catégorie « Pantalons »). Un avertissement s'affiche si une condition entre en conflit avec une autre partie (ex. deux headers sur « toute la page ») ; la résolution n'est pas décrite.

### Cibles
* **Entire Site**.
* **Singular** : All Singular · Front Page · Posts (tous / précis ; In Category, In Child Categories, In Tag, Posts by Author) · Pages (toutes / précises) · Page by Author · Landing Pages · Floating buttons · Media · Direct child of · Any child of · By Author · 404 Page.
* **Archives** : toutes / précises : Author Archive · Date Archive · Search Results · Posts Archive · Categories · Direct Child Category of · Any Child Category of · Tags.
* **WooCommerce** : All Product Archives · Shop Page · Search Results · Product Category · Product Tags · Products · In Category · In Child Product Categories · In Tag · Products by Author.
Incohérences de la documentation source : « Page by Author » et « WooCommerce > In Tag » semblent copiées d'autres entrées.

## Modèle développeur (developers.elementor.com/docs/theme-conditions/)
Les conditions couvrent l'essentiel de la hiérarchie de modèles WordPress ; on enregistre des conditions personnalisées ; les mêmes conditions servent aux Theme Builder, Popups et Custom Code. Sous-pages non lues : Condition Structure, Group Type, Data, Check, Sub-Conditions.

## Règles de résolution retenues pour Kolakisa (CHOIX DE CONCEPTION)
Non établies par les sources ; définies ici pour être déterministes, testables et affichables :
1. Une condition vaut sur un **contexte** (type de page + attributs : catégorie, étiquette, auteur, id…). Un modèle s'applique si **au moins une inclusion** correspond ET **aucune exclusion** ne correspond. Sans inclusion explicite : « tout le site ».
2. **Une exclusion l'emporte toujours** sur une inclusion.
3. Entre modèles candidats d'un même type, **le plus spécifique gagne** : contenu précis (100) › enfant direct/descendant (80) › taxonomie/auteur précis (60) › type de contenu/archive précise (40) › type général (20) › tout le site (10). À égalité : le plus récemment publié ; à égalité encore : l'identifiant le plus petit (déterministe).
4. **Conflit** = deux modèles publiés du même type avec la même précision sur un même contexte atteignable. Détecté à la publication et affiché ; la publication reste possible mais signalée (règle 3 tranche), sauf **égalité parfaite de conditions** : refusée.
5. Un modèle brouillon ou archivé ne s'applique jamais.
6. Groupes AND/OR : les inclusions sont combinées en OU ; chaque condition peut porter des sous-conditions combinées en ET (ex. « Articles » ET « catégorie Actu »).
