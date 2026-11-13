# Produits numériques à télécharger

- Produit de type **Numérique** → section « Fichiers à télécharger » (administration).
- **Stockage privé** : `DATA_DIR/shop-files`, nom aléatoire, jamais sous `/uploads` (public). Formats : PDF, ZIP, EPUB, audio, vidéo, images, Office, texte ; 25 Mo au plus ; l'extension **et** les premiers octets sont vérifiés (un HTML renommé en .pdf est refusé).
- **Droits** : créés à l'encaissement (un par fichier et par ligne), jamais avant. Par défaut 5 téléchargements et 30 jours ; réglable par produit (0 = illimité / sans limite de date).
- **Lien signé** : `/boutique/telechargement/<id>-<signature>` ; falsification → 404 ; autre site → 404. Le compteur est décrémenté de façon **atomique** (deux demandes simultanées ne dépassent jamais la limite).
- **Révocation** : remboursement total ou annulation → `410`.
- **Livraison** : page de commande (liens et nombre restant) et e-mail de paiement confirmé (lien vers la page de commande).
- Réponse en pièce jointe (`Content-Disposition: attachment`, `nosniff`), 30 téléchargements / 10 min / adresse.

Tests : `tests/boutique-telechargements.test.js`. Migration : `147_boutique_telechargements.sql`.
