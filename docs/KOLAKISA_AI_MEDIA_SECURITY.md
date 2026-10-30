# Sécurité

- **Serveur seulement** : aucun appel de fournisseur depuis le navigateur ; clés dans les connecteurs (chiffrées, par site), jamais renvoyées ; erreurs et historique débarrassés de tout secret (testé avec une clé factice).
- **Réseau** : couche des connecteurs de l'AI Core — HTTPS, hôte déclaré (jamais fourni par l'utilisateur → pas de SSRF), adresses privées refusées, pas de redirection, délai et taille de réponse bornés, JSON seulement. Aucune URL externe n'est téléchargée : les images arrivent en Base64 de la réponse du fournisseur (décodage validé).
- **Dépense** : un fournisseur payant exige à la fois (1) IA activée pour le site et fournisseur autorisé dans l'AI Core, (2) clé configurée, (3) autorisation de dépense de l'organisation (équipe, `settings.write`). Quotas de l'AI Core appliqués avant l'appel ; une limite de coût avec tarif non vérifié refuse la demande.
- **Isolation** : site de l'adresse, vérifié par le serveur ; médias d'un autre site introuvables ; page d'un autre site refusée ; accès limité à un site cantonné ; lecteur sans écriture ; anonyme renvoyé à la connexion ; organisations étanches.
- **Fichiers** : type réel, taille, nom fabriqué (pas de traversée de chemin), écriture exclusive. Aucune analyse antivirus n'existe dans le projet (non ajoutée).
- **Données non fiables** : réponse du fournisseur = donnée ; seules des images valides sont enregistrées ; consignes bornées (10–1500 caractères).
