# Compatibilité des propriétés — limites

1. Le jeu de test contient 41 widgets ayant des parties ; 6 widgets avec parties exigent un contenu réel (galerie, boîte d'image, formulaire, carrousel, image à points, évaluation) et n'ont pas pu être instanciés avec leurs valeurs par défaut : ils sont couverts par le registre commun (même code) mais **non exercés dans le navigateur**.
2. Le placement dans le parent d'un widget enfant de Flexbox/Grille reste réglé sur le widget (inchangé) ; il n'existe pas de « placement » propre à une partie.
3. Les réglages composés sont routés par leurs contrôles (groupe), pas clé par clé.
4. Un réglage écarté n'est pas reconverti en un autre (pas d'équivalence automatique par ressemblance de nom).
5. Le diagnostic n'est renvoyé qu'à l'enregistrement du brouillon (pas dans le rendu de l'aperçu seul) ; le client se nettoie à ce moment.
6. Les widgets du serveur sans cible « partie » gardent leur comportement antérieur.
