# Compatibilité universelle des propriétés — audit et correction

Date : 2026-10-10.

## 1. Cause exacte de l'erreur observée (confirmée par reproduction)

> « …Accordéon / FAQ > Question + réponse : le réglage alignSelf n'est pas disponible pour cette partie. »

1. Le registre des **parties** (`parts.js`) déclare, pour chaque zone interne d'un widget, les groupes de réglages acceptés. « Question + réponse » (`accordion.item`) accepte fond, bordure, espacements, effets, quelques tailles — **pas** le groupe « Mise en page » (donc pas `alignSelf`).
2. Le serveur (`nodes.js#normalizeParts`) refusait tout réglage hors de cette liste en **levant une erreur qui bloquait l'aperçu et l'enregistrement de toute la page**.
3. Le client, lui, ajoutait les réglages « d'enfant de son parent » (`withChildKeys` : alignSelf, flexGrow, order, colonnes de grille…) **à l'inspecteur de la partie**, dès que le widget est dans un conteneur Flexbox ou Grille — alors que ces réglages concernent le **widget** dans son parent, jamais une de ses parties. Les valeurs étaient ensuite écrites dans `parts.<partie>` (la cible d'écriture `styleTarget` est globale).
4. Les deux registres n'étaient donc pas cohérents : l'interface proposait ce que le serveur refusait.

**Étendue (mesurée)** : sur 41 widgets du registre contenant 156 parties, **156 parties** proposaient `alignSelf` quand le widget était enfant d'un conteneur Flexbox. Ce n'était pas propre à l'accordéon.

## 2. Inventaire des mécanismes concernés

| Mécanisme | Fichier | Rôle | État |
|---|---|---|---|
| Propriétés valides (grammaire fermée) | `nodes.js` `STYLE_PROPS` (104) | valeurs, CSS, groupe | sain |
| Registre des parties | `parts.js` `PARTS` + `allows` | groupes/états acceptés par partie | sain, **source unique** |
| Capacités du widget (inspecteur) | `page-builder.js` `INSPECTORS` | groupes affichés pour le widget | sain |
| Validation des parties | `nodes.js` `normalizeParts` | refus bloquant | **corrigé** (écarté + diagnostic) |
| Cible d'écriture (widget / partie) | `page-builder.js` `holderOf/styleSet` | écrit dans la partie choisie | **corrigé** (acceptation par le registre) |
| Réglages d'enfant du parent | `page-builder.js` `withChildKeys` | placement dans le parent | **corrigé** (jamais pour une partie) |
| Enregistrement du brouillon | `pages/index.js` `saveDraft` | normalise et enregistre | renvoie les diagnostics |
| Aperçu / rendu du canevas | `normalizeContent` (même chemin) | rendu serveur | ne bloque plus pour ce cas |

## 3. Corrections

1. **Inspecteur** : le placement dans le parent n'est plus proposé pour une partie.
2. **Cible d'écriture** : `holderOf(it, create, key)` n'écrit dans la partie que si `partAllowsKey` (registre des parties, même règle que le serveur) l'accepte ; sinon le réglage va au **widget** (cas des barres contextuelles). Lecture (`ownValue`, `inheritedValue`) alignée.
3. **Serveur** : un réglage valide mais non proposé pour la partie (ou un état non proposé) est **écarté**, le reste est conservé et enregistré ; un diagnostic structuré est renvoyé (`warnings`: nœud, partie, réglage, écran, message en français). Les valeurs invalides, parties inconnues et injections restent des **erreurs bloquantes**.
4. **Client** : à la réception des diagnostics, l'éditeur retire ces réglages de son propre document (sans étape d'historique) et affiche un message non bloquant.
5. **Données existantes** : le serveur étant strict jusqu'ici, aucune donnée enregistrée ne peut contenir ces réglages. Contrôle en lecture seule : `node scripts/scan-property-compat.js` (`parts.scan`) ; aucune migration nécessaire, aucune valeur supprimée silencieusement dans les documents enregistrés.

## 4. Risques restants / à tester
- Réglages composés (filtre, ombre, dégradé…) : acceptation par le groupe de leurs contrôles, non par clé.
- Le widget racine accepte toute propriété de la grammaire (pas de contrôle par type de widget côté serveur) : volontaire, hors de ce périmètre.
- Widgets personnalisés : ils n'ont pas de parties (registre `PARTS`) : non concernés.
