# Traitement des images

Réutilisé tel quel (aucune seconde infrastructure) :
1. **Vérification** : `media.sniff` (type réel par signature, jamais le type annoncé), refus SVG/PDF déguisés/fichiers vides, limites de taille du site, dimensions lues obligatoires.
2. **Stockage** : nom entièrement fabriqué par le serveur (pas de chemin ni de nom du client), dossier du site, empreinte SHA-256 (doublons signalés par la médiathèque).
3. **Original conservé** ; **variantes responsives** : `variants` fabrique à la demande des versions réduites **WebP** (largeurs 150 à 1536 px, liste blanche), jamais d'agrandissement, retour à l'original si sharp est absent. `responsive()` expose la liste.
4. **Pas de conversion AVIF** (non pris en charge par le pipeline actuel), pas de recadrage automatique, pas de compression supplémentaire à l'envoi (limitation connue).
5. **Données EXIF** : les images générées n'en contiennent pas ; les variantes WebP sont ré-encodées sans métadonnées ; l'original importé par la personne est conservé tel quel (voir limites).
Le fournisseur de démonstration produit de petits PNG (1/8 de la résolution demandée) ; un fournisseur réel renvoie la résolution demandée dans les limites de la médiathèque.
