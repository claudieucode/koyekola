# KOLAKISA — Composants réutilisables : rapport d'implémentation

Date : 2026-10-10. Branche locale `excellence-lot0`. **Rien n'est poussé ni déployé** (aucune demande en ce sens).

## Cycle de vie livré
ENREGISTRER → RETROUVER → INSÉRER → MODIFIER → RENOMMER → METTRE À JOUR → DÉTACHER → SUPPRIMER.

### Serveur
- Migration `067_composants_cycle_de_vie.sql` : colonnes `kind`, `draft`, `version` ; les composants déjà utilisés comme en-tête/pied/variante ou référencés par des pages passent en `global`. (Numéro 067 à revérifier contre `origin/main` avant toute publication : le lanceur refuse les doublons.)
- Service : `createComponent(kind)`, `saveComponentDraft`, `publishComponent` (transaction, version+1), `discardComponentDraft`, `componentInstances` (comptes exacts), `deleteComponent(mode)` (transaction, modes `instances` / `detach`, renvoie les nouvelles révisions de pages).
- Routes : `GET …/instances.json`, `POST …/mettre-a-jour`, `…/abandonner`, `…/supprimer`.

### Éditeur
- **Enregistrer** : depuis la sélection réelle (menu clic droit, palette de commandes, inspecteur › Avancé › Actions). Un seul bloc → standard uniquement, aucun choix. Plusieurs blocs → nom, nombre, structure, choix Standard / Global avec explication. Annuler ne modifie rien ; la sélection est revérifiée à la validation ; nom unique exigé.
- **Bibliothèque** (onglets « Composants » = standard, « Globales » = global) : recherche, nom, badge de type, nombre de blocs, nombre d'instances liées, Insérer, menu ⋮ (Modifier, Renommer, Insérer une copie indépendante, Pages qui l'utilisent, portée, Supprimer).
- **Insérer** : standard = copie avec nouveaux identifiants ; global = instance liée.
- **Instance liée** : inspecteur dédié (Accéder au composant principal, Détacher du composant). « Modifier cette instance » = la détacher.
- **Détacher** : annulable, conserve contenu et structure, nouveaux identifiants.
- **Mettre à jour** (éditeur du composant) : brouillon → diffusion explicite ; pour un global, fenêtre listant pages et instances avant propagation ; atomique ; blocs détachés non touchés.
- **Supprimer** : sans instance → simple confirmation ; avec instances → exactement deux choix (supprimer composant + instances / convertir en blocs indépendants), transaction, aucun orphelin, succès annoncé seulement après réponse du serveur, historique d'annulation réinitialisé.
- Fenêtres : jetons `--editor-*` (clair/sombre), `<dialog>` natif, focus et libellés accessibles.

## Limites connues (honnêtes)
- Pas de miniature visuelle : aperçu = liste de la structure.
- Un composant est une seule section : plusieurs *sections* ne peuvent pas être enregistrées ensemble (éléments d'une même section : oui).
- La suppression d'un composant n'est pas annulable (l'historique est vidé exprès).
- En-tête, pied de page et variantes gardent la diffusion directe.
- Pas de marqueur « mise à jour disponible » sur les instances d'une page ouverte.
