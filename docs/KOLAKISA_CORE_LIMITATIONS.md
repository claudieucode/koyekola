# Limites et risques restants

- **L1 — Liste blanche.** Une propriété inconnue d'un élément est écartée par le serveur à l'enregistrement (choix de sécurité). Une version future qui ajouterait un réglage doit l'ajouter à sa définition de type ; un réglage d'une version plus récente ouvert par une version plus ancienne serait perdu.
- **L2 — Interactions entre pages / composants globaux.** La suppression des cibles absentes est évaluée sur la page enregistrée. Une interaction placée dans un composant global qui viserait un élément de la page hôte ne peut pas être validée à cet endroit (non observé aujourd'hui : les composants ne portent pas de références externes).
- **L3 — Élément corrompu.** Il est omis (publié) ou signalé (éditeur) mais **pas réparé** : l'utilisateur doit le supprimer ou annuler. Aucune donnée n'est modifiée automatiquement.
- **L4 — `linksOf`.** Un élément corrompu compte 0 lien ; si son rendu avait malgré tout consommé des liens avant d'échouer, le compteur est recalé sur 0 pour cet élément (cohérent avec `linksOf`).
- **L5 — Performance.** Valeurs ponctuelles lentes (sélection p95 231 ms à 100 éléments) non expliquées ni reproduites systématiquement ; non optimisées faute de preuve. Machine ancienne, Chrome seulement, 60 Hz ; Safari/Firefox non testés.
- **L6 — Pas de test de charge** au-delà de 400 éléments (limite du serveur) ni de fuite mémoire sur plusieurs heures (un plateau de 3 000–6 000 nœuds détachés avait été observé lors d'une mission précédente, cause inconnue).
- **L7 — Annuler/rétablir** repose sur des copies complètes du document (150 au plus) : coût mémoire borné (≈ 7 Mo à 400 éléments) mais proportionnel à la taille.
