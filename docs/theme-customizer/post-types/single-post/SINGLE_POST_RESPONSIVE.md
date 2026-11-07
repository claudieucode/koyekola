# Publication unique — responsive

## Appareils
Ordinateur (par défaut) · Tablette (≤ 1023 px) · Mobile (≤ 767 px) ; les points de rupture du site (`settings.layout.breakpoints`) sont repris pour le CSS généré.

## Réglages par appareil
- **Marges et paddings** (4 côtés) : valeur par appareil ; un appareil sans valeur **hérite** de l'ordinateur (la valeur héritée s'affiche en grisé), réinitialisation indépendante par appareil.
- **Taille de police** de chacun des 14 groupes et **12 espacements** : même principe (`desktop` / `tablet` / `mobile`, vide = hérité).
- Les autres réglages (couleurs, graisse, etc.) sont communs aux appareils.
- Le sélecteur Ordinateur / Tablette / Mobile du Customizer change l'appareil édité **et** la largeur de l'aperçu ; les champs concernés se rafraîchissent.

## Comportement de la page
| Élément | Tablette | Mobile |
|---|---|---|
| Colonnes | une seule colonne ; sommaire masqué sur mobile (sommaire déroulant) | une colonne |
| Colonne latérale | sous le contenu | après / avant / masquée (réglage) |
| Similaires | 2 colonnes au plus | 1 colonne (liste : image au-dessus) |
| Partage flottant | n'existe qu'à partir de 861 px ; en dessous, la barre en ligne est affichée |
| Navigation | cartes qui passent à la ligne | idem |
| Contenu | images, vidéos et iframes bornées à la largeur ; tableaux défilants ; mots longs coupés |
Aucun débordement horizontal n'est attendu ; contrôlé à 1280 / 820 / 390 px (voir rapport de tests).
