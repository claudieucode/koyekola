# Sécurité de la boutique

- **Prix** : le serveur recalcule tout (prix, promotions, remises, taxes, livraison). Un total affiché périmé ou falsifié est refusé (`409`). Aucun champ de prix du navigateur n'est lu.
- **Paiement** : une page de succès ne prouve rien ; confirmation seulement après relecture de l'état réel chez le fournisseur (ou webhook signé) et contrôle du montant/devise. Webhooks idempotents ; messages jamais crus tels quels. Voir PASSERELLES_PAIEMENT.
- **Secrets** : identifiants des passerelles chiffrés (AES-256-GCM, clé `ENCRYPTION_KEY`, contexte organisation+site), jamais ré-affichés ni journalisés. Aucune donnée de carte ou de compte Mobile Money stockée.
- **Comptes clients** : un compte invité ne s'active que par un lien envoyé à son adresse (pas de prise de contrôle) ; limites de tentatives ; mots de passe hachés (scrypt) ; affectation de masse impossible (statut, exonération, site).
- **Accès aux commandes** : lien secret signé (HMAC) ou client connecté ; un jeton ne vaut que pour sa commande et son site. Factures et téléchargements : mêmes règles.
- **Isolation** : toutes les requêtes portent organisation + site ; un site ne lit ni n'écrit rien d'un autre (testé pour commandes, factures, téléchargements, webhooks, API, administration).
- **Administration** : permissions `shop.read / write / orders / payments` ; rembourser et confirmer un paiement exigent `shop.payments` ; contrôle d'origine sur les actions ; journal d'audit (exports, remboursements, identifiants, suppressions).
- **Injection / XSS** : requêtes préparées partout ; échappement systématique (catalogue, fiche, panier, confirmation, facture, administration) ; CSV protégé contre l'injection de formule.
- **Débit** : limites sur panier, validation de commande, connexions, téléchargements, webhooks, API (120/min/clé).
- **Fichiers numériques** : stockés hors du dossier public, nom aléatoire, type vérifié (extension + octets), servis en pièce jointe avec `nosniff`.
- **API** : aucun mouvement d'argent (payer/rembourser interdits) ; clés limitées à un site possibles.

Tests : `tests/boutique-securite.test.js`, `tests/boutique-charge.test.js`, `tests/boutique-passerelles.test.js`.
