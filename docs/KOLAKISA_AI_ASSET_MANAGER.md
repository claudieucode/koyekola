# Gestionnaire de ressources

Réutilise la médiathèque native : mêmes fichiers (`mk_media`), mêmes identifiants, même isolation (médias du site + médias communs en lecture ; écriture dans la médiathèque du site). `mk_aimedia_meta` ajoute : source, fournisseur, modèle, consigne, génération IA, licence + note, auteur, tags, catégorie, légende, description, point focal.
- **Recherche/filtres** : texte (nom, alt, description, tags, catégorie, fournisseur), source, « générées par IA », « inutilisées » (via `mediaUsage`), catégorie.
- **Détails** : provenance, usages (pages, composants…), variantes responsives, proposition d'alt (JSON `…/medias/:id.json`).
- **Sélection d'une image existante** = `assign` avec un média de la médiathèque du site ; **import** = envoi par la médiathèque (type réel vérifié) puis `registerImport`.
- **Remplacer / restaurer** : voir protection ci-dessous. **Suppression et corbeille** : inchangées (écran médiathèque, permissions existantes).
- Dossiers/collections : ceux de la médiathèque (non dupliqués).
## Protection des choix de la personne
- Emplacement occupé : refus (`conflict`) sauf `replace` explicite. Image posée à la main dans l'éditeur : seconde confirmation (`confirmManual`). Le remplissage automatique ne touche que les emplacements vides.
- Restauration de l'image précédente : confirmée, tracée.
- Chaque affectation passe par `saveDraft` (révision vérifiée) : jamais de publication, le reste de la page est conservé.
