# Page individuelle : responsive

- **Appareils** : points de rupture du site (`settings.layout.breakpoints`, tablette 1023 px, mobile 767 px par défaut). Les valeurs ordinateur sont la base ; tablette et mobile écrivent des règles `@media (max-width: …)` **uniquement** pour les valeurs fournies (héritage : mobile hérite de tablette qui hérite d'ordinateur).
- **Largeur** : toujours `min(N px, 100%)` : jamais plus large que l'écran.
- **Marges** : `padding-*` / `margin-*` par côté et par appareil ; un côté vide n'écrit rien.
- **Colonne** : deux colonnes au-dessus du point de rupture tablette ; en dessous : une colonne, la colonne latérale après ou avant le contenu, ou masquée (choix du réglage). `minmax(0,1fr)` évite tout débordement horizontal.
- **Interface** : le sélecteur Ordinateur / Tablette / Mobile de l'aperçu choisit aussi l'appareil des champs de marges.
- **Vérifié dans Chrome** : panneau et page publiée sans défilement horizontal à 1440, 820 et 390 px (voir le rapport de tests).
