# Limites

## Volontaires
* Verrou optimiste uniquement (pas de fusion) : le second onglet est bloqué plutôt que de risquer un écrasement.
* La publication ne publie que ce que le serveur a confirmé.

## Techniques
* **Copie locale** : une seule, non chiffrée, `localStorage` de ce navigateur ; perdue si le stockage est vidé ; contient le contenu de la page (pas de mot de passe).
* Essais automatiques toutes les 5 à 25 s, sans limite : un serveur durablement indisponible laisse l'éditeur en « Erreur d'enregistrement » jusqu'à son retour ou un rechargement avec reprise de la copie.
* Pas d'enregistrement à la fermeture de l'onglet (alerte du navigateur uniquement, que l'utilisateur peut ignorer).
* Versions : seulement à la publication (pas de version manuelle nommée) ; bornées à 100.
* Les tests simulent le réseau dans Chrome (retards, 500, 401) ; ils n'ont pas coupé la connexion réelle ni testé Safari / Firefox.

## À traiter
Enregistrement à la fermeture, brouillon durable côté serveur pour les très longues sessions, version nommée manuelle, cycle de publication des composants globaux (mission 9).
