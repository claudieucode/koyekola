# KOLAKISA CMS — Outils → Admin Notes (mission ADMIN-NOTES-01)

Branche `admin-notes-01`, issue de `origin/main`. Référence : l'outil « Admin Notes » de WordPress (formulaire titre + contenu, liste des notes avec date et suppression). Ce document décrit l'état **réel**.

## 1. Audit

| Élément | Constat |
|---|---|
| Notes d'administration existantes | **Aucune.** `mk_contact_notes` (notes sur les contacts du CRM) et `lesson_notes` (notes d'élèves sur une leçon) ont une autre portée et d'autres droits : non réutilisables. |
| Stockage | Pas de mécanisme générique de « notes ». Création de **`mk_admin_notes`** (migration additive 103). |
| Navigation | Registre unique `cmsNav.js` : une entrée dans Outils, ouverte aussi dans le cadre d'un site (`outils/notes`). |
| Droits | Rôles par permissions (`organizations.js` + `cmsAccess.js`) : 4 permissions distinctes ajoutées. |
| Journal | `auditLog` des outils : réutilisé, sans jamais y écrire le contenu d'une note. |
| CSRF | Le middleware de sécurité refuse les envois venus d'une autre origine : réutilisé (testé). |

## 2. Ce qui a été réalisé

- **Écran** `/marketing/site-web/outils/notes[?site=<id>]` (et `/sites/<id>/outils/notes` dans le cadre d'un site) : formulaire « Ajouter une nouvelle note » (titre, contenu, compteurs de caractères), « Notes existantes » (titre, contenu intégral à retours à la ligne conservés, date de création, auteur, date de modification, actions), pagination (20 par page), état vide, message de confirmation ou d'erreur. Notes très longues : repliées avec « Afficher toute la note » (le contenu complet reste dans la page).
- **Modifier** (édition dans la liste, « Annuler » sans écriture), **Supprimer** (page de confirmation côté serveur nommant la note ; sans confirmation rien n'est supprimé ; définitif — Kolakisa n'a pas de corbeille pour les notes).
- **Anti double envoi** : bouton désactivé pendant l'envoi + garde serveur (même note, même auteur, même portée en moins de 15 s : non dupliquée).
- **Échec de stockage** : page d'erreur (HTTP 500), saisie conservée, jamais présenté comme un succès, aucun détail technique affiché.
- Fichiers : `src/marketing/migrations/103_admin_notes.sql`, `src/services/adminNotes.js`, `src/marketing/web/tools.js` (routes), `views/marketing/tools-notes.ejs`, `public/js/cms-notes.js`, `public/css/cms.css` (`.mk-nt-*`), `src/marketing/web/cmsNav.js`, `src/marketing/organizations.js`, `src/services/cmsAccess.js`, `views/marketing/partials/bottom.ejs`.

## 3. Données et isolation

`mk_admin_notes` : `organization_id`, `site_id` (NULL = site principal), `title` (1–200), `body` (1–20 000), `author_id`, `created_at`, `updated_at`, `updated_by`. Toute lecture et toute écriture porte sur `(organization_id, site_id)` fournis par le contexte vérifié de la requête : l'identifiant d'une note d'un autre site se comporte comme une note inexistante. Un compte limité à un site ne peut lire ni écrire ailleurs que dans son site (jamais le site principal). Aucune note n'est copiée à la création d'un site ni par un starter pack ; aucune donnée de démonstration.

Retour arrière de la migration : `DROP TABLE mk_admin_notes;` (les notes sont alors perdues : elles n'existent qu'ici).

## 4. Sécurité

- Permissions distinctes `notes.view`, `notes.create`, `notes.edit`, `notes.delete` (rôle minimum « Administrateur » ; attribuables à un rôle personnalisé). Contrôlées côté serveur à chaque requête ; boutons absents sans le droit.
- Texte stocké en **texte brut**, échappé à l'affichage (jamais interprété comme HTML) ; requêtes paramétrées ; caractères de contrôle et séparateurs de ligne Unicode nettoyés ; longueurs bornées côté serveur et base (CHECK).
- Le contenu et le titre ne sont **jamais** écrits dans les journaux (seuls l'action `tools.note_*` et l'identifiant le sont) ; réponses `no-store`.

## 5. Évolutivité (non développée dans ce palier)

La table et le service acceptent sans refonte : recherche (index sur la portée et la date), épinglage / archivage / étiquettes (colonnes additives), notes privées (colonne de visibilité), historique (table liée par `note_id`).

## 6. Limites

- Suppression définitive (pas de corbeille pour les notes).
- Pas de recherche, filtre ni épinglage (voir §5).
- Les dates sont affichées en heure de Paris.
