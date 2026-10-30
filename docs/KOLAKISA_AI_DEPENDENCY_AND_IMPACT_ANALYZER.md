# Context Resolver, Dependency Analyzer, Impact Analyzer

`src/regen/context.js`.

## Contexte
Résolution par **identifiants stables** : `pageId`, `sectionId` (identifiant natif), `nodeId`, clé de champ `<section>/<chemin>` (même format que le Content Generator). Un nom visible n'est qu'un indice : correspondance exacte unique → retenue ; sinon ambiguïté. Accès : appartenance du site à l'organisation, portée d'un accès limité, site actif, page du site ; les droits d'action sont ceux de la route.

## Dépendances (`scopeKind`)
| Valeur | Situation |
|---|---|
| `local` | section ou champ propres à la page |
| `page` | demande portant sur toute la page |
| `shared` | image de la section aussi utilisée sur d'autres pages |
| `component` | section « composant réutilisable » : toutes les pages qui l'affichent |
| `global` | couleur du design : tout le site |
Aussi relevés : modules requis (ex. formations), note sur le formulaire (non modifié).

## Impact
Direct, indirect (pages, médias partagés), contenus, médias, paramètres globaux, éléments protégés touchés ; niveau `low | medium | high`. **Confirmation obligatoire** pour `high` : modification globale, composant ou ressource partagés, réécriture de page. Un élément protégé fait passer le niveau à « moyen » et exige une autorisation ciblée (`allow`).

## Limites
L'usage d'une couleur de design est estimé en cherchant les références `token:` et les fonds de section dans les pages : il ne couvre ni le CSS du thème ni les gabarits globaux. Les dépendances d'un widget vers un module activé se limitent aux sections de formation.
