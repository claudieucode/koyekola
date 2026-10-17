# API publique — /api/v1 et webhooks sortants (jalon M5 — Intégrations)

> Deux premiers tiers du jalon « M5 Croissance » (voir EMAIL_MARKETING_ARCHITECTURE.md §11) : les clés d'API avec une
> API minimale (contacts, événements), et les webhooks sortants. Les tests A/B, les formulaires/pop-ups, l'attribution
> du revenu et les domaines/délivrabilité restent à construire (toujours marqués « à venir » dans le menu, jamais
> affichés comme s'ils existaient).

## Authentification

Chaque requête porte l'en-tête `Authorization: Bearer mk_live_…`. Une clé se crée dans `Marketing → Intégrations → Clés d'API`
(droit `api_keys.manage`, réservé aux administrateurs). **La clé complète n'est affichée qu'une seule fois**, à la création :
si elle est perdue, il faut la révoquer et en créer une nouvelle. Seule son empreinte SHA-256 est stockée (comme un mot
de passe) ; un préfixe de 12 caractères reste affiché dans l'interface pour la reconnaître.

Une clé a une **portée** :
- `read` — lecture seule (`GET`).
- `write` — lecture et écriture (`GET`, `POST`).

Une clé révoquée cesse de fonctionner **immédiatement** (vérifié à chaque requête, pas seulement à la connexion).

## Réponses

JSON uniquement. Succès : `{ "data": … }` (objet ou tableau). Échec : `{ "error": { "code": "…", "message": "…" } }`.

| Code HTTP | `error.code` | Cas |
|---|---|---|
| 401 | `unauthorized` | En-tête absent, clé inconnue ou révoquée |
| 403 | `read_only` | Écriture demandée avec une clé en lecture seule |
| 404 | `not_found` | Ressource introuvable, ou route d'API inconnue |
| 400 | `invalid_field`, `invalid_email` | Corps de requête invalide |
| 409 | `duplicate` | Conflit (ex. adresse déjà utilisée avec `failIfExists`) |
| 429 | `rate_limited` | Plus de 120 requêtes/minute pour cette clé (en-tête `Retry-After`) |
| 503 | `unavailable` | Module marketing indisponible (voir le journal du serveur) |
| 500 | `server_error` | Erreur interne (jamais de détail technique renvoyé) |

## Points d'accès

### `GET /api/v1/contacts`
Liste paginée par curseur. Paramètres : `after` (identifiant du dernier contact vu, 0 par défaut), `limit` (50 par défaut, 200 au plus).
Réponse : `{ "data": [ { id, email, status, first_name, last_name, source, created_at } ], "next_cursor": 123 | null }`.
`next_cursor` vaut `null` quand il n'y a plus de page suivante.

### `GET /api/v1/contacts/:id`
Une fiche. 404 si l'identifiant n'existe pas ou appartient à une autre organisation.

### `POST /api/v1/contacts` (portée `write`)
Crée un contact, ou complète les champs vides d'un contact existant (même adresse) — jamais son statut d'abonnement :
**le statut n'est modifiable par aucune voie autre que la conformité** (preuve de consentement), API comprise, exactement
comme un import ou la saisie manuelle. Un contact créé par l'API a le statut `unknown` (ou `suppressed` si son adresse
est déjà sur liste de suppression) : il ne recevra donc aucune campagne tant qu'un consentement n'est pas enregistré.

Corps : `{ "email": "...", "first_name"?, "last_name"?, "phone"?, "company"?, "country"?, "language"?, "properties"? }`.
Réponse : `201` (créé) ou `200` (complété) avec `{ "data": <contact>, "created": true|false }`.

**Clé limitée à un site (R7 lot 2, 16/10/2026 — changement de contrat pour ces clés seulement ; les clés d'organisation sont inchangées)** :
le contact créé a pour origine le site de la clé (jamais un site demandé dans le corps). Pour qu'une clé de site ne puisse pas deviner quelles
adresses existent ailleurs dans l'organisation, la réponse est **`202` `{ "data": null, "accepted": true }`** dans deux cas indiscernables :
l'adresse est nouvelle (le contact est créé), ou l'adresse est déjà connue sans que ce site en soit l'origine (rien n'est lu, modifié ni confirmé ;
la tentative est journalisée `api_key.out_of_scope`). Seule la mise à jour d'un contact dont **l'origine est le site de la clé** répond `200` avec la fiche.
Pour retrouver un contact créé, utilisez `GET /contacts` (limité aux contacts associés au site). Ancien comportement supprimé : `201` avec la fiche à la création
et `403 out_of_scope` pour une adresse d'un autre site (ce `403` confirmait l'existence de l'adresse).
Dans `POST /events`, un `email` connu hors de la portée de la clé n'est plus refusé (`403`) : l'événement est enregistré **sans identité** (comme pour une adresse inconnue) et n'est rattaché à aucun contact.

### `POST /api/v1/events` (portée `write`)
Enregistre un événement personnalisé, qui peut déclencher une automatisation (voir EMAIL_MARKETING_AUTOMATIONS.md).
Corps : `{ "name": "minuscules.points_soulignes", "email"?, "contact_id"?, "metadata"? }`. En-tête `Idempotency-Key`
conseillé (ou `idempotency_key` dans le corps) : renvoyer deux fois la même requête ne crée jamais deux événements —
la réponse indique `"duplicate": true` la seconde fois, avec le même `id`.

**Limite actuelle, à connaître** : ces événements alimentent les automatisations, mais ne sont *pas encore* utilisables
comme critère de segment — le moteur de segments n'accepte pour l'instant que les événements du pont KOLAKISA
(`event:lms.*`, voir EMAIL_MARKETING_ARCHITECTURE.md §18). Étendre cette liste blanche est un choix délibéré à faire
séparément (elle protège contre un nom d'événement mal formé qui casserait un segment).

## Limites connues de l'API `/api/v1`
- Pas de `PATCH`/`DELETE` sur les contacts par l'API (seulement créer/compléter).
- Pas de points d'accès pour les listes, segments, modèles, campagnes ou automatisations : seuls les contacts et les
  événements sont exposés — ce sont les deux qui permettent de « piloter le marketing depuis l'extérieur » sans
  dupliquer les pages d'administration.
- Pas de révocation en masse ni de rotation automatique des clés.
- Limite fixe de 120 requêtes/minute par clé (non configurable pour l'instant).

---

## Webhooks sortants

Un webhook **notifie votre système** (Zapier, un entrepôt de données, un service interne…) quand un événement
KOLAKISA se produit — l'inverse de l'API : ici, c'est KOLAKISA qui appelle **votre** adresse.

### Créer un webhook
`Marketing → Intégrations → Webhooks` (droit `webhooks.manage`, réservé aux administrateurs) : nom, adresse
(`https://` recommandé ; `http://` accepté mais jamais vers une adresse privée), événements auxquels s'abonner
(liste précise, ou « Tous »). Un **secret de signature** (`whsec_…`) est généré à la création. Contrairement à une
clé d'API, ce secret **peut être révélé à nouveau** à tout moment (bouton « Révéler ») — vous en avez besoin en
continu, dans le code qui vérifie les signatures, pas seulement au moment de la création.

### Ce que vous recevez
Une requête `POST` sur votre adresse, à chaque événement abonné :

```
POST /votre-route HTTP/1.1
Content-Type: application/json
X-KOYEKOLA-Event: contact.subscribed
X-KOYEKOLA-Signature: t=1735000000,v1=8f3a1c9e...(64 caractères hexadécimaux)

{"id":"evt_482","event":"contact.subscribed","occurred_at":1735000000000,"data":{...}}
```

### Vérifier la signature (obligatoire pour faire confiance à la requête)
`v1` est un HMAC-SHA256 de `"{timestamp}.{corps exact de la requête}"` avec votre secret. Exemple en Node.js :

```js
const crypto = require("crypto");
function isValidKoyekolaWebhook(rawBody, signatureHeader, secret) {
  const [tPart, v1Part] = signatureHeader.split(",");
  const timestamp = tPart.slice(2);
  const expected = crypto.createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(v1Part.slice(3)), Buffer.from(expected));
}
```
Utilisez le corps **brut** de la requête (avant toute analyse JSON) : signer un corps ré-encodé donnerait une
signature différente. Rejetez toute requête dont la signature ne correspond pas.

### Garanties et limites
- **Blocage SSRF** : avant CHAQUE envoi (pas seulement à la création), le nom de votre adresse est résolu et
  **toute** IP privée, locale ou de lien-local (dont `169.254.169.254`, l'adresse « métadonnées » des fournisseurs
  cloud) est refusée — protection contre un serveur qui réécrirait sa résolution DNS entre-temps. Liste utile mais
  **non exhaustive** (RFC1918, boucle locale, lien-local IPv4/IPv6, multidiffusion), pas une liste CIDR complète.
- **Reprises** : gérées par la file de travaux existante (`mk_jobs`) — jusqu'à 6 tentatives, délai croissant. Une
  réponse **4xx** de votre serveur est considérée comme une erreur définitive de configuration (aucune reprise :
  corrigez votre côté) ; une réponse **5xx** ou l'absence de réponse est reprise normalement.
- **Livraisons** journalisées sur la fiche du webhook (état, tentatives, dernière erreur) ; une livraison abandonnée
  peut être rejouée manuellement.
- **Idempotence** : un même événement n'est jamais mis en file deux fois pour le même webhook, même si l'événement
  est rejoué côté KOLAKISA. Votre système doit tout de même être idempotent sur `id` (une livraison réessayée après
  un succès non confirmé, ex. coupure réseau juste après votre 200, resterait possible en théorie).
- **Délai** : 10 secondes par tentative ; au-delà, la tentative est considérée en échec (reprise).
- Pas encore : tableau de bord des livraisons multi-webhooks, alerte automatique en cas d'échecs répétés, rotation
  du secret (il faut supprimer et recréer le webhook pour en changer).
