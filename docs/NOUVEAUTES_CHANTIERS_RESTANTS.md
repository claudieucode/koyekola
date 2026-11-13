# Chantiers restants : ce qui a été ajouté

| Fonction | Où la trouver | Remarques |
|---|---|---|
| Boucle « Avis clients vérifiés » | Éditeur → grille → « Répéter pour chaque… » → *Avis clients vérifiés (témoignages)* | Seuls les avis **publiés**, issus d'une **vraie commande**, d'un produit publié, du **même site**. Étiquettes `review.author`, `review.rating`, `review.stars`, `review.title`, `review.text`, `review.date`, `review.product`, `review.product_url`. Module Commerce requis. |
| Catégorie en liste déroulante | Même panneau (articles, formations, produits) | Si aucune catégorie n'existe, retour à la saisie du nom exact. |
| Mode sombre avec bouton visiteur | Styles du site → Mode sombre → *Selon la préférence du visiteur + bouton clair / sombre* | Bouton rond en bas à droite ; le choix est gardé dans le navigateur du visiteur (`kw-theme`). |
| Alerte « test concluant » | Site web → Tests A/B | Bandeau affiché seulement pour un test **en cours** : assez de visiteurs, écart significatif, mesure saine, au moins 7 jours. Rien n'est décidé automatiquement. |
| Versions nommées | Pages → page → *Versions publiées* → champ « Nommer cette version » | 60 caractères, texte simple. Une version nommée n'est **jamais** effacée par le nettoyage (limite de 100 versions). Migration 146. |
| Formulaire dans une fenêtre (modale) | Éditeur → fenêtre → *Formulaire dans la fenêtre* | Même formulaire, mêmes champs et même enregistrement que le widget « Formulaire ». Après l'envoi, la page se recharge et rouvre la fenêtre pour montrer le remerciement ou l'erreur. La publication est refusée si le formulaire n'est pas publié. |
| Dupliquer un site | Site web → Mes sites → menu ⋯ → Dupliquer | Existait déjà (pages ou réglages seuls). |

Tests : `boucle-avis-clients`, `mode-sombre-bouton-navigateur`, `cms-abtest` (alerte), `pages-versions-nommees`, `modale-formulaire`.

Non fait volontairement : test A/B sur en-tête ou pied de page (risque de casser tous les sites), import Rank Math / AIOSEO / SEOPress validé sur de vrais fichiers (aucun fichier réel disponible).
