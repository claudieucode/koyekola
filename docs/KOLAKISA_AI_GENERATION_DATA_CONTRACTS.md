# Contrats de données de la génération

Tous les objets sont des JSON à schéma **fermé** (`additionalProperties:false`, exigé par les sorties structurées d'Anthropic). Le serveur revalide tout, quel que soit le fournisseur. Les identifiants sont créés par le serveur. Les longueurs sont bornées côté serveur (le schéma du fournisseur n'impose pas de longueurs).

## 1. Brief (sortie du Brief Analyzer)
```json
{
  "siteType": "vitrine|boutique|blog|formation|portfolio|evenement|autre",
  "sector": "texte ≤ 80",
  "audience": "texte ≤ 200",
  "goals": ["≤ 6 éléments, ≤ 120 car."],
  "language": "fr|en|…", "country": "CD", "tone": "texte ≤ 60",
  "pagesRequested": ["≤ 12"],
  "features": ["formulaire_contact|catalogue_formations|blog|…  (liste fermée)"],
  "brand": { "name": "", "colors": ["#hex"], "style": "sobre|moderne|chaleureux|luxe|…" },
  "knownFacts": ["faits fournis par la personne, mot pour mot"],
  "missing": ["informations manquantes à demander"],
  "assumptions": ["hypothèses faites, à confirmer"]
}
```
`knownFacts` est la **seule** source de faits autorisée pour les textes (adresse, téléphone, chiffres). Tout le reste est signalé « à compléter ».

## 2. SitePlan (Site Planner / Page Planner)
```json
{
  "pages": [{ "key": "accueil", "name": "", "slug": "", "purpose": "", "seo": {"title":"≤60","description":"≤160"},
    "sections": [{ "type": "<un type de sections.TYPES>", "template": "<clé de templates, facultatif>", "intent": "", "needsMedia": false }] }],
  "menu": ["<page.key>"],
  "design": "voir §3",
  "forms": [{ "pageKey": "contact", "purpose": "demande d'information" }],
  "warnings": []
}
```
Règles : `type` ∈ {hero, text, image, list, course, button, quote, form, features, faq, cta, video, testimonials, divider, layout, component} ; ≤ 12 pages, ≤ 30 sections/page ; `slug` normalisé par le serveur, collisions résolues par suffixe ; `menu` ne cite que des pages du plan.

## 3. DesignProposal
Clés autorisées uniquement : `colors` (10 clés de `tokens.COLOR_KEYS`), `fonts` (heading/body/button/link ∈ liste `FONTS`), `type` (h1..button : size/weight/lineHeight bornés), `space`, `radius`, `shadow ∈ {none,sm,md,lg}`. Hors liste : rejet. Contraste calculé par le serveur.

## 4. GeneratedPage (Content Generator → Adapter)
```json
{ "pageKey": "accueil", "blocks": [ { "sectionRef": "<index du plan>", "fields": { "title": "", "subtitle": "", "items": [] } } ],
  "placeholders": [{ "path": "blocks[2].fields.items[0]", "reason": "chiffre réel à fournir" }] }
```
`fields` ne contient que les champs de texte propres au type visé (ex. `hero` : title, subtitle, buttonLabel). L'adaptateur ignore tout champ non textuel et **rejette** la section si un champ d'un type non connu apparaît. Liens : chemins `/…` du site ou `https://` seulement (règle `linkUrl`).

## 5. Marquage de l'authenticité
Chaque texte contenant une donnée factuelle absente de `knownFacts` doit être remplacé par un espace réservé visible `[à compléter : …]` ; un contrôle serveur détecte nombres, e-mails, téléphones, URL et pourcentages non présents dans `knownFacts` et les remplace. Témoignages, certifications, avis, références : **jamais générés** (sections `testimonials` créées avec le texte-guide du gabarit existant).

## 6. Images
`{ "slot": "hero-accueil", "kind": "photo|illustration|logo", "source": "user|library|stock|ai|placeholder", "alt": "", "licence": "" }`. `source:"ai"` impose l'étiquette « générée par IA » dans l'`alt`/les métadonnées et l'interface ; jamais présentée comme photo d'un lieu ou produit réel. En 21.x : seulement `library` et `placeholder` tant qu'aucun fournisseur d'images n'est validé.

## 7. Génération (journal)
`{ id, siteId, kind: site|page|section|design|mobile, status: planned|running|ready|accepted|rejected|failed|undone, provider, model, usage, items:[{kind,refId,fingerprint}], validation:{accepted:[],rejected:[{path,reason}]} }`. Aucun prompt ni texte complet conservé au-delà du nécessaire (durée de rétention à fixer en 21.2, 30 jours proposés).

## 8. Erreurs
Codes stables, réutilisant `AiError` : `not_configured`, `quota`, `rate`, `format` (réponse invalide après 1 nouvelle tentative), `validation` (rejet complet), `conflict` (révision de page changée), `forbidden`. Un échec ne laisse **aucune écriture** partielle.
