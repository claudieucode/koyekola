# Risques et compatibilité

| Risque | Gravité | Mesure |
|---|---|---|
| Modèles qui font double emploi avec la bibliothèque de pages complètes | Élevée | Option A (cadre riche) ; décision n° 1 à valider |
| Faux sentiment de diversité (assemblage de pièces communes) | Élevée | Fichier par modèle, seuil 0,70, test de profil |
| Titre en double (H1 du modèle + titre dans la page) | Moyenne | Documenter ; consigne dans le modèle ; option de masquer le H1 par modèle |
| Remplacement du catalogue casse des sites | Faible | « Utiliser » copie ; aucune clé dans les sites ; à confirmer par inventaire en production (non consultable ici) |
| Pages à sections historiques et tunnels | Moyenne | Rendu inchangé (comportement actuel conservé) |
| Données inventées (prix, témoignages, adresses, dates) | Élevée | Consignes entre crochets ; compte à rebours à date obligatoire à renseigner |
| Liens sociaux génériques | Faible | Remplacer par les réseaux du site ; aucun lien inventé |
| Formulaires sans formulaire réel sur le site | Moyenne | Encart de contact de repli (comportement actuel) |
| Concepts nécessitant une brique absente (filtre de catalogue, commerce) | Moyenne | Version réduite ou module requis, jamais de fausse fonction |
| Charge des tests sur machine partagée | Faible | Temps de démarrage élevé |
| Hors périmètre | — | Autres catégories, éditeur central, pages réelles, médias : aucune modification |

Sauvegarde et retour arrière : commit précédent ; aucun document de site n'est modifié par le catalogue.
