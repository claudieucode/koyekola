# Mapping contenu → mise en page

`intent.profile` mesure : longueur du titre (court ≤ 24, moyen ≤ 60, long), du texte, nombre d'éléments, longueur moyenne/maximale des éléments, nombre d'images, orientation (si largeur/hauteur fournies, sinon « inconnue »). Règles : titre court → hero expressif ; long → taille réduite ; 2/3/4/6 éléments → 2/3/2/3 colonnes (jusqu'à 4) ; texte moyen d'élément > 260 car. → 2 colonnes ; image portrait → ratio d'image ajusté.
Garantie testée : titre de 190 caractères, texte de 5 000, 12 éléments longs → tout le contenu repris (`validate.preserved`). Le contenu est borné aux limites du moteur natif, jamais raccourci pour « faire entrer ».
