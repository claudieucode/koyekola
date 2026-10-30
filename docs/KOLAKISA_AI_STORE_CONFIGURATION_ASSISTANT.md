# KOLAKISA — Store Configuration Assistant

## Principe
Il **guide** et vérifie ; il n'invente **aucune** valeur commerciale. Chaque réglage n'est écrit que s'il a été saisi par la personne, via les services natifs (`store.saveSettings`, `saveZone`, `saveMethod`, `saveTaxRule`). Droit exigé : `shop.payments`.

| Domaine | Ce que fait l'assistant | Ce qu'il ne fait jamais |
|---|---|---|
| Pays et marché | Pays/marchés cités dans le brief, pays par défaut | Supposer un pays américain ; vendre dans un pays non saisi |
| Devise | Écrit le code saisi ; signale que **seul l'euro est testé** | Convertir un prix, proposer un taux de change |
| Paiements | Liste les moyens **réellement intégrés** (carte Stripe, paiement manuel), leur état sur le serveur ; n'active que ce qui est configuré | Activer la carte sans clés serveur ; **recevoir une clé** (elles se configurent sur le serveur, jamais dans un formulaire ni une consigne IA) ; annoncer une disponibilité par pays que Kolakisa ne vérifie pas |
| Livraison | Crée zone et méthode avec le tarif **saisi** | Inventer un tarif ou un délai (une méthode sans tarif est refusée) |
| Taxes | Crée la règle avec le taux **saisi** (points de base) | Proposer un taux ; donner un avis fiscal |
| Informations commerciales | Adresse de notification, instructions de paiement manuel | — |
Les « à traiter » (bloquant / avertissement / information) sont calculés sur l'état réel : module Commerce, paiement utilisable, zones sans méthode, taxes activées sans règle, devise non testée.

## Fournisseurs de paiement réellement disponibles
Carte bancaire (Stripe) : dépend des clés du serveur et du secret de webhook ; **mode test uniquement vérifié** ; une paire de clés pour toute la plateforme ; **aucune disponibilité par pays vérifiée**. Paiement manuel : toujours disponible (aucun traitement automatique). Aucun autre fournisseur (PayPal, Mobile Money…).
