# Palier 12 — Limites, risques et actions

## Non résolu (hors périmètre ou non prouvé)
1. **54 tests échouent déjà sur `main`** (rejeu identique, voir TEST_REPORT §2) : menus de site à 30 s de délai (`moteur-pages-navigateur`, `site-menu-c1-navigateur`, `site-espace-navigateur`…), classes CSS orphelines, couleurs violettes/ombres (`refonte-design`, `titan-xxviii-vivid`), inventaire des tables, registre des pages, index de clés étrangères (D3). Ils masquent d'éventuelles régressions du même type. **À traiter avant de déclarer la suite verte.**
2. **Tests intermittents** : `apparence-styles-navigateur` (« erreur serveur et réseau ») et deux autres sous forte charge ; cause probable = délais Chrome sur machine saturée, non démontrée.
3. **Paliers 10-11 non validés par l'utilisateur** : points ouverts de `KOLAKISA_PALIER11_LIMITATIONS.md` (Firefox/Safari/tactile/lecteur d'écran non testés, tâches longues des widgets variés, 6 annulés dans `cms-automation-engine-navigateur` à l'époque) restent des limites connues.
4. **Permission de « Mettre à jour » un composant** = `forms.write` alors que publier une page = `pages.publish`. Identiques (rôle « editor ») aujourd'hui, mais dissociables si un jour les rôles diffèrent. Non modifié (pas de défaut démontré) ; à aligner si les rôles évoluent.
5. **Suppression de composant en mode « instances »** retire des sections de pages avec `forms.write` (éditeur), alors que la suppression d'une page exige `pages.delete` (admin). Comportement existant, non audité plus avant.
6. « Mettre à jour » / « Abandonner » un composant **sans** révision restent acceptés (comportement documenté par un test existant : second clic idempotent) ; seul l'autosave est strict.

## Scénarios non testés
Production et préproduction (aucun accès) ; base réelle déjà migrée (seulement une base de test à 113) ; deux onglets simultanés dans un vrai navigateur sur composant (couvert au niveau serveur uniquement) ; navigateurs autres que Chrome.

## Risques restants / actions avant production
- La migration 114 s'applique au démarrage (sauvegarde automatique préalable par le runner). Vérifier le journal `[KOLAKISA] Migration marketing 114 … appliquée` au premier démarrage.
- Une autre session peut créer un `114_*` avant l'intégration : le runner refusera le doublon — renuméroter alors **avant** de pousser (`git fetch` + contrôle).
- Retour arrière : la colonne `revision` est inoffensive si laissée ; pour revenir au code précédent il suffit de redéployer l'ancien commit (la colonne ajoutée avec défaut n'empêche rien). Ne pas supprimer le fichier 114 d'une base où il est appliquée (le runner l'interdit).
