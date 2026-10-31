# Advanced Content Intelligence — architecture

## Principe
Le moteur **lit** les structures natives du CMS (sections de pages, champ `seo`) et **propose**. Il n'écrit jamais en ligne et ne crée aucun format de contenu parallèle. Toute écriture passe par `pages.saveDraft` (brouillon) ou par la régénération 21.9 (avant/après, annulable).

```
page native (working.sections, seo) ──text.fromSections──▶ document commun
article / sélection (texte, Markdown) ──text.fromText────▶ document commun
document + contexte du site (voix, faits, marché, genre, mot-clé, autres pages)
        └─▶ quality.evaluate ─▶ 14 critères + problèmes (explication, priorité, recommandation, correction proposée)
        └─▶ intent.analyze    ─▶ intention estimée (règles, avec preuves)
        └─▶ technical.check   ─▶ cohérence d'indexabilité / données structurées
```

## Contexte d'un site (tout est PAR SITE)
- **Voix** : `mk_content_voice` (existante).
- **Faits** (`mk_ci_settings.facts`) : nom de l'entreprise (nom du site) + faits saisis. C'est la seule base de ce qui est tenu pour vérifié.
- **Marché** : langue, pays, langues secondaires (aucune devise, moyen de paiement ni obligation légale présumés).
- **Genre de page** : déclaré (prioritaire), sinon page d'accueil du site, sinon nom/adresse, sinon **indéterminé** (jamais deviné).
- **Mots-clés** : `mk_ci_keywords` avec provenance.

## Garde d'accès
`CI.guard(ctx, siteId, { write })` : site de l'organisation, dans la portée du membre (`ctx.siteScope`), non supprimé ; en écriture, site actif. Appelée par la route avant tout service ; les services vérifient aussi chaque page et chaque proposition par `site_id` ET `organization_id`.

## Cache
`mk_ci_evals (site_id, page_id, fp, result)`. L'empreinte couvre : texte, titres, liens, images, SEO, structure, voix, faits, marché, mot-clé, genre, adresse, statut, et le texte des autres pages (pour l'originalité). Contenu inchangé = résultat relu sans recalcul.

## Traitements lourds
Une évaluation est un calcul local de quelques millisecondes. Le tableau de bord est borné à 200 pages et 60 pages comparées par page. **Il n'existe pas de file de traitement asynchrone** : à ce volume elle n'est pas justifiée, mais un site de plusieurs milliers de pages demanderait de l'ajouter (voir restes).
