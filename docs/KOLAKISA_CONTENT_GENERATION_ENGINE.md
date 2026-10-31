# Génération de contenu — ce que 22.6 ajoute, ce qu'il réutilise

**Le moteur de génération n'a pas été réécrit.** Il existe depuis 21.6 (`src/contentGen`) : génération de pages et de sites, révision de champs, SEO de contenu, localisation, voix, garde anti-invention, versions, application contrôlée au brouillon.

## Ajouts de 22.6 pour la génération
1. **Planificateur de structure** (`kinds.plan`, route `POST …/contenu-seo/api/plan`) : pour un des 12 genres (accueil, service, produit, catégorie, institutionnelle, présentation, contact, destination commerciale, article, étude de cas, FAQ, comparaison), renvoie les sections natives à prévoir, la longueur de repère, l'importance de l'appel à l'action, **les faits manquants à demander avant d'écrire**, l'intention estimée et les consignes de voix du site.
2. **Évaluation de ce qui est généré** : le même évaluateur de qualité s'applique à une page générée ou écrite à la main.
3. **Revue d'ensemble** (`CI.review`) : après la génération d'un site, liste ce qui reste à compléter (espaces réservés `[à compléter]`, mot-clé principal absent, faits attendus par genre absents).

## Règles conservées
Jamais de certification, chiffre, avis, récompense, garantie ou résultat commercial inventé : la garde de `contentGen/facts.js` remplace ou signale. Une information manquante devient une question ou un espace réservé identifié.

## Limites
- Les textes générés dépendent d'un fournisseur d'IA configuré par le propriétaire ; **aucun fournisseur réel n'a été vérifié** (voir `KOLAKISA_PROGRAMME21_AI_PROVIDER_STATUS.md`). Les tests utilisent une IA simulée.
- Le Blog Studio n'a pas de bouton « évaluer » : l'API `POST …/api/evaluer-texte` est prête (même évaluateur) mais n'est pas branchée dans son éditeur.
