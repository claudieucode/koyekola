# Cycle de vie d'un modèle

| Étape | Elementor (documenté) | Kolakisa (cible) |
|---|---|---|
| Création | Add New → type + nom → éditeur | idem ; depuis un gabarit ou vierge ; site = celui de l'adresse |
| Brouillon | gris, sans conditions | état `draft` |
| Publication | Publish dans l'éditeur ; « live » si conditions | état `published` seulement avec ≥ 1 condition valide |
| Édition | Edit / Edit Conditions | idem, brouillon séparé du publié (copie de travail) |
| Renommer | ⋯ › Rename | idem |
| Exporter | ⋯ › Export `.json` | `.json` validé, sans identifiants de site |
| Supprimer | Trash + confirmation | archivage puis suppression avec dépendances affichées |
| Dupliquer | non détaillé dans les pages lues | oui |
| Restaurer | corbeille WordPress | archivage réversible + versions |
| Importer | `.json`/`.zip` | `.json` seulement, schéma validé, aucun code exécutable |
