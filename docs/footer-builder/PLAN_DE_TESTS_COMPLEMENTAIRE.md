# Plan de tests complémentaire (uniquement ce qui manque aux tests actuels)

Date : 8 novembre 2026. **Proposition : aucun test n'a été ajouté ni modifié.**

**Vérifié par exécution** : la liste des tests existants (titres lus dans `tests/theme-builder-pieds-bibliotheque.test.js`, `theme-builder-pied-unique`, `footer-*`) et le résultat de leur exécution (voir l'audit). **Non vérifié** : tout ce qui est listé ci-dessous comme « à écrire ».

## Ce qui est déjà couvert (ne pas refaire)
100 modèles exactement, clés et noms uniques, clés sûres pour une adresse, anciennes clés en 404, au moins 98 structures différentes, copyright partout, pas de faux contenu, grammaire du Page Builder, copie indépendante à l'insertion, aperçu = vignette = rendu publié, un seul pied par page, conditions (46 tests), isolation entre deux sites, contraste WCAG calculé, zones cliquables de 44 px (réglage présent), états survol/focus, import/export, révisions.

## Ce qui manque

| # | Test à écrire | Pourquoi (écart constaté) | Type |
|---|---|---|---|
| T1 | **Distinction structurelle chiffrée** : similarité maximale entre deux modèles ≤ seuil (ex. 0,90) et 0 paire identique | Le test actuel tolère 2 doublons (`≥ 98`) ; l'audit en trouve 3 paires identiques et 11 paires > 90 % | unitaire (sans serveur) |
| T2 | **Répartition par famille** : exactement N modèles par famille déclarée, 15 familles | Aujourd'hui 10 × 10 ; le test fige « 10 familles de 10 » | unitaire |
| T3 | **Aucun identifiant perdu** : chaque identifiant du fichier figé existe ou a un alias | Étape 1 du plan de remplacement | unitaire |
| T4 | **Liste servie = code** : la route `/bibliotheque?type=footer` renvoie exactement les identifiants du catalogue (pas de cache ancien) après changement | « Aucun ancien modèle ne réapparaît » | serveur |
| T5 | **Newsletter** : champ e-mail, consentement, succès/erreur, état « non configuré » explicite dans chaque modèle `news` | Aujourd'hui repli « Nous contacter » sans champ | serveur + Chrome |
| T6 | **Accordéon mobile** : à 390 px, section repliée par défaut, ouverture au clavier et au clic, aria-expanded ; à 1280 px, tout visible | Un seul modèle, jamais testé en clic | Chrome |
| T7 | **Tablette à 820 px et intermédiaires (600, 1024, 1440, 1920)** : aucune mesure à 600/1024/1440/1920 aujourd'hui (3 largeurs seulement : 390/820/1280) | Cahier des charges : « grand écran, desktop, portable, tablette, smartphone » | Chrome |
| T8 | **Texte coupé** (ellipsis, overflow caché) et **chevauchement** mesurés sur les 100 en CI | Le script existant n'est pas lancé par une suite et exige `playwright-core` non installé | Chrome |
| T9 | **Fond pleine largeur + contenu dans un conteneur** : largeur de la bande = largeur de la fenêtre et contenu ≤ 1180 px centré, à 1920 px | Le rapport l’affirme ; je n’ai pas trouvé de test dédié (recherche rapide, non exhaustive) | Chrome |
| T10 | **Insertion = instance indépendante entre sites** : insérer le même modèle sur deux sites, modifier l'un, l'autre inchangé ; médias et réglages isolés | Partiellement couvert (copie) ; pas les médias | serveur |
| T11 | **Permissions** : un utilisateur sans `forms.write` ne peut pas insérer ; sans `pages.code` ne peut pas poser de CSS/HTML dans un pied | Sécurité | serveur |
| T12 | **Favoris / tri** (quand livrés) | Fonctions absentes | serveur + Chrome |
| T13 | **Captures des 100 modèles** comparées à leurs vignettes (même pixels dans une tolérance) | Cahier des charges point 9 ; aujourd'hui comparaison d'éléments, pas de pixels | Chrome |
| T14 | **Migration + restauration** : appliquer la migration sur une copie d'une base contenant des pieds, vérifier Q1–Q9 avant/après, restaurer la copie AVANT-MIGRATION | Plan de remplacement | script |
