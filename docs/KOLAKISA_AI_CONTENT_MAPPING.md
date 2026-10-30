# Content Mapper — association texte ↔ champs natifs

## Registre (`fields.js`)
Champs écrits, par type de section native (vérifiés contre les normaliseurs de `pages/sections.js` par les tests) :
| Section | Champs |
|---|---|
| hero | title, subtitle, buttonLabel *(si l'adresse existe)*, imageAlt *(si une image existe)* |
| text | markdown |
| list | title, items[i] (chaînes) |
| features | title, intro, items[i].title, items[i].text |
| faq | title, items[i].q, items[i].a |
| cta | title, text, buttonLabel *(si l'adresse existe)* |
| form | heading, intro |
| button | label *(si l'adresse existe)* |
| testimonials | title seulement — **items jamais générés** |
| quote | **rien** (texte et auteur sont des faits) |
| image | alt, caption · video : title, caption · course : cta |

Jamais touchés : styles, `style`, images/`src`, adresses, identifiants, `columns`, `courseId`, composants (`component`), sections libres (`layout`), éléments du Page Builder. Types non listés : ignorés.

## Clé de champ
`<identifiantSection>/<chemin>` ex. `g3f…/items.1.title`. À l'application, la section est retrouvée par identifiant ; à défaut (page dupliquée ou autre langue), par **position et type**.

## Garanties d'écriture
1. `fields.write` opère sur une **copie** et n'écrit que les chemins déclarés ; une clé inconnue est ignorée.
2. Les listes ne sont modifiées que sur les entrées **existantes** : aucune carte/question n'est créée ni supprimée à ce palier.
3. `pages.saveDraft` revalide toute la page avec les normaliseurs natifs ; en cas d'erreur, **rien n'est écrit**. Écritures concurrentes : contrôle de révision (409).
4. Le brouillon n'est jamais publié.
5. Une page d'une autre organisation/site est refusée (`not_found`).

## Protection du travail manuel
Champ de la page modifié depuis la génération → **conservé** et signalé ; remplacement possible seulement avec `overwriteManual: [clés]`. Champ verrouillé → ignoré (sauf demande explicite). Annulation (`unapply`) : restaure la valeur d'avant seulement là où la page n'a pas bougé depuis.

## Limites
Pas de création de sections ni d'éléments ; pas de champs des widgets du Page Builder (les 94 éléments) ; pas de messages de confirmation/erreur de formulaires ni de libellés de champs de formulaire (non natifs des sections) ; pas de fiche produit (aucun composant produit dans le CMS).
