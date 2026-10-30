# Programme 21.7 — limites et reste à faire

1. **Aucun fournisseur d'images réel vérifié.** OpenAI : adaptateur écrit d'après la documentation, jamais appelé en réel (format de requête/réponse non confirmé). Google Imagen, Stability, Flux : non intégrés. Tarifs inconnus : coût estimé « inconnu », coût réel jamais renvoyé.
2. **AI Core** : pas de modèle d'image dans son registre, `execute` inadapté aux images, `ai.use` sans rôle ; l'AI Core textuel n'est pas branché en production. Le Media Generator utilise ses quotas/journal/configuration/connecteurs.
3. **Content Generator (21.6) présent mais non branché** : les consignes d'images utilisent le type du site, le secteur et la direction artistique, pas les textes générés des sections (à relier au prochain palier).
4. **Pas d'analyse visuelle** (aucun modèle de vision) : texte alternatif proposé d'après la demande, la description ou le nom du fichier, à relire.
5. **Traitement** : pas d'AVIF, pas de recadrage automatique, pas de compression à l'envoi, EXIF des originaux importés conservés, pas d'antivirus.
6. **Emplacements** : seulement bandeau et section « Image ». Pas d'image de produit/catégorie/blog/témoignage (aucun composant natif), pas de fond de section.
7. **Banques d'images** : aucune intégration (aucune licence vérifiable disponible).
8. **Asynchrone** en processus : une tâche en cours est abandonnée au redémarrage du serveur (expirée au prochain affichage) ; le worker `mk_jobs` pourra la reprendre quand `MARKETING_WORKER=on`.
9. **Interface** : écran unique serveur ; pas de glisser-déposer ; aperçu = image dans la carte, aperçu de page via l'aperçu natif ; rendu visuel non vérifié en navigateur.
10. **Médiathèque** : « inutilisées » borné aux 200 dernières images.
## Prérequis pour 21.8
Lecture des contenus générés (21.6) par le planificateur ; clé et essai réel d'un fournisseur d'images (puis passage de « non vérifié » à « vérifié ») ; modèles d'image dans le registre de l'AI Core ; composant produit/catégorie ; connecteur de banque d'images avec licence vérifiable.
