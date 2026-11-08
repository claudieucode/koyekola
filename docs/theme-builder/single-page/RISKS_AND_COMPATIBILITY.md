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

## Risques propres à l'indépendance graphique (ajout du 8 novembre 2026)
| Risque | Gravité | Mesure |
|---|---|---|
| Modèle indépendant incohérent avec le reste du site (en-tête, pied de page, autres pages) | Moyenne | C'est voulu et choisi par l'utilisateur ; aperçu avec en-tête/pied du site ; bascule « suit le site » |
| Thème (pack) actif qui écrase un modèle indépendant | Élevée | Couches CSS (`@layer`), test avec packs actifs ; documentation |
| Chargement de trop de polices | Moyenne | 2 polices au plus par modèle, uniquement celles utilisées, repli système |
| Bascule qui perd des réglages | Élevée | Valeurs de l'utilisateur jamais réécrites ; test aller-retour (étapes 4 à 7 du scénario) |
| Modèles insérés avant le changement (anciens, en jetons) | Faible | Inchangés : ce sont des copies ; aucune migration forcée |
| Extension de la validation des couleurs/polices (option B) | Moyenne | Seulement après validation de l'architecture ; rétrocompatible |
| Contraste insuffisant dans une palette fixe | Moyenne | Contrôle de contraste automatique dans l'audit |
| Droits des polices | Faible | Bibliothèque locale libre uniquement |
