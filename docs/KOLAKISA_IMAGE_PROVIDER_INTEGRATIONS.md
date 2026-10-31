# Fournisseurs d'images — état réel

**Connectés et vérifiés en réel : aucun.** Les informations ci-dessous viennent de la documentation publique telle que connue à la rédaction ; elles n'ont pas été revérifiées ni testées (`verified: false` dans `licenses.js`). Relire les conditions du jour avant toute intégration.

| Source | État | Accès | Coût | Licence / crédit |
|---|---|---|---|---|
| Médiathèque Kolakisa | intégrée | session | stockage | celle déclarée à l'import |
| Visuels d'attente | intégrée | local | gratuit | à remplacer |
| OpenAI Images | adaptateur écrit, **jamais appelé** | clé du site | payant, tarif non vérifié | conditions du fournisseur : à vérifier |
| Unsplash | non intégrée | clé API | gratuit, quotas | usage commercial gratuit ; crédit et point de téléchargement demandés par l'API |
| Pexels | non intégrée | clé gratuite | gratuit, quotas | usage libre sous restrictions ; lien/crédit demandés |
| Pixabay | non intégrée | clé gratuite | gratuit | usage commercial ; copie sur son serveur attendue |
| Openverse | non intégrée | anonyme/OAuth | gratuit | **par image** (CC) ; crédit souvent obligatoire ; exclure « NC » |
| Wikimedia Commons | non intégrée | publique | gratuit | **par fichier** |
| Shutterstock / Adobe Stock / Getty | non intégrées | accord commercial | payant | licencier avant usage |

Pays couverts et restrictions géographiques : **non vérifiés** pour tous. Règles appliquées : aucune connexion simulée ; aucun téléchargement automatique (`autoImportAllowed` renvoie faux pour toute source externe) ; une licence inconnue n'est jamais « libre de droits » (seuls CC0, domaine public et création de la personne le sont) ; traçabilité par `mk_aimedia_meta` (source, licence, auteur, note). Route : `GET …/medias-ia/sources.json`.
