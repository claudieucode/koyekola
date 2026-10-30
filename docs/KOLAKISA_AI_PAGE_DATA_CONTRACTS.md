# Contrats de données

## Site Plan v1 (entrée)
```
{ "version": 1, "site": {"name","description"},
  "pages": [ { "key","name","slug?","type","goal?",
    "sections": [ { "key?","kind","title?","text?","items?","image?","images?","cta?","courseIds?","url?","columns?" } ] } ] }
```
`kind` ∈ hero, intro, services, benefits, steps, gallery, testimonials, faq, contact, cta, pricing, listing, video, text. `type` : identifiant libre (accueil, apropos, services, contact, galerie, tarifs, blog, formation, immobilier, boutique, panier…). Un `type` présent dans l'inventaire des types de pages avec une fonctionnalité requise absente (boutique, panier…) n'est pas généré.
## Proposition (sortie, table `mk_pagegen_runs.result`)
`{ pages: [ { key, name, type, status: ready|invalid|unavailable, sections: [<sections natives>], maps: [{key, need, status, components, justification, limitations, missing, example, alternative}], warnings, errors, existing: {id,name,status,sameSite}|null } ], warnings, aiFilled }`
## Page enregistrée
Format natif inchangé : `mk_landing_pages.sections` = tableau de sections `{type, …propriétés du normaliseur…, id, style?}`, page en `draft`.
## Réponse IA (texte seulement)
`{ pages: [ { key, sections: [ { key, title, text, items: [ {title, text} ] } ] } ] }` — schéma imposé ; tout le reste est ignoré.
