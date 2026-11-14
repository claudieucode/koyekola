# Créer une extension Kolakisa

Une extension = **un fichier manifeste** + son code. Le noyau n'est pas modifié.

## 1. Le manifeste : `src/extensions/manifests/<id>.js`
Le nom du fichier est l'identifiant. Exemple complet :
```js
module.exports = {
  id: "avis_clients", name: "Avis clients", description: "Collecte et affiche les avis des visiteurs, site par site.",
  icon: "star", version: "1.0.0", publisher: "Kolakisa", category: "marketing",
  availability: "available",            // available | beta | unavailable
  maintenance: "stable",                // stable | maintenance (non activable) | deprecated (confirmation exigée)
  scope: "optional",                    // optional | always_on_primary
  compatibility: { kolakisa: ">=1.0.0" },
  dependencies: [{ id: "commerce", range: "^1.0.0" }],   // doivent être activées avant
  conflicts: [],                        // ne peut pas coexister avec…
  permissions: ["reviews.read"],        // clés du catalogue services/cmsAccess.js
  migrations: ["160_avis_clients.sql"], // fichiers de src/marketing/migrations
  entry: { lifecycle: "src/extensions/avis/lifecycle.js", admin: "src/marketing/web/avis.js", public: "src/marketing/web/avisPublic.js" },
  adminRoutes: ["^\\/avis(?:\\/|$)"],   // écrans d'administration (le préfixe /site-web/sites/N est retiré avant comparaison)
  publicRoutes: ["^\\/avis(?:\\/|$)"],  // pages publiques d'un domaine de site
  menus: [{ key: "avis", label: "Avis", icon: "star", items: [{ key: "avis", label: "Tous les avis", href: "/marketing/site-web/avis", permission: "reviews.read" }] }],
  settings: [{ key: "moderation", type: "boolean", label: "Modérer avant publication", default: true }],
  events: ["avis.created"], hooks: [], tasks: [], resources: { css: ["/css/avis.css"] }, docs: "docs/extensions/avis.md",
};
```
Validation : `node -e 'require("./src/extensions/registry").load()'` échoue avec la liste des défauts. Types de réglages : `string`, `number`, `boolean`, `select` (avec `options`).

## 2. Les migrations
Fichier SQL numéroté dans `src/marketing/migrations/` (**additif** : tables nouvelles, colonnes nullables ; jamais de `DROP`/`DELETE` de données). Chaque table porte `organization_id` et `site_id` ; vérifiez l'appartenance du site à l'organisation par déclencheur, comme `084` et `153`. Documentez le retour arrière en tête du fichier.

## 3. Les pages d'administration et les routes
- Routeur Express monté dans `src/marketing/web/index.js`. Chaque route : `need("<permission>")` (côté serveur) puis le site de l'adresse (`req.mk.site`).
- Déclarez dans `adminRoutes` les adresses de vos écrans : la garde `denies` les ferme pour tout site où l'extension n'est pas activée, sans code supplémentaire.
- Pour un service appelé hors route : `siteModules.assertEnabled(ctx, "avis_clients")`.
- Pages publiques : déclarez `publicRoutes` ; `runtime.publicGuard` répond 404 sur un domaine où l'extension n'est pas activée.

## 4. Permissions
Ajoutez-les au catalogue `src/services/cmsAccess.js` (GROUPS) **et** à `src/marketing/organizations.js` (rôle minimum). Le registre refuse une permission inconnue.

## 5. Menus
Déclarés dans `menus` ; ils apparaissent seulement dans les espaces où l'extension est activée, pour les personnes qui ont la permission de l'entrée. Icônes : `src/utils/icons.js`. Une entrée peut ouvrir un espace propre avec `external: true`.

## 6. Cycle de vie (optionnel)
`entry.lifecycle` exporte `onEnable(ctx, siteId)` / `onDisable(ctx, siteId)` ; exécutés **dans la transaction** d'activation : s'ils lèvent une erreur, l'activation est annulée. Ne jamais supprimer de données dans `onDisable`.

## 7. Événements, hooks, tâches
Déclarez leurs noms dans le manifeste (validés). Branchez-les au bus d'événements du marketing (`marketing.bus`).

## 8. Paramètres par site
`activation.getSettings(ctx, siteId, id)` / `setSetting(...)` : validés par le manifeste, isolés par site, journalisés. L'écran « Gestion » les affiche.

## 9. Versions
Version sémantique `majeur.mineur.correctif`. Une dépendance se déclare avec une plage (`^1.0.0`, `>=1.2.0 <2.0.0`). Au démarrage, le registre refuse une dépendance introuvable, une version non satisfaite, un cycle, un conflit inconnu ou une extension incompatible avec la version de Kolakisa (`package.json`).

## 10. Tester
Copiez `tests/extensions-activation.test.js` : base synthétique (`freshMarketing`), `registry.override(registry.createRegistry([...]))` pour vos fixtures, puis vérifiez : activation, désactivation confirmée, dépendances, isolation entre deux sites, conservation des données, historique. Pour la partie HTTP, copiez `tests/extensions-serveur.test.js` (trois sites, domaines `a.test`…).

## 11. Activer / désactiver
Menu **Extensions → Gestion** (équipe de l'organisation), ou `activation.enable(ctx, siteId, id, { confirm })` / `disable(...)`.

## 12. Liste de contrôle avant de livrer
Manifeste valide · migration additive et idempotente · permissions dans le catalogue · gardes (`adminRoutes`/`publicRoutes`) · test d'isolation site A / site B · désactivation sans perte de données · documentation `docs`.
