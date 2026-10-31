# Contenus multilingues et multi-pays

## Existant réutilisé
`contentGen/localize.js` : 17 pays (devise, fuseau, système de mesure, locale), langues avec niveau de fiabilité (fr/en/es/pt « full », de/it/sw/ln/ar… « model »), consignes de localisation (jamais une traduction littérale), formats calculés par `Intl`. Paiements et obligations légales ne sont **jamais** présumés.

## Ajouts 22.6
- **Marché du site** (`setMarket`) : langue, pays, langues secondaires — par site.
- **Relations entre traductions** (`i18n.js`, table `mk_ci_translations`) : une page appartient à **un** groupe ; au plus une page par couple langue/région dans un groupe ; type `translation` ou `adaptation` (adaptation locale). Une page d'un autre site est refusée.
- **Validation d'un groupe** : balise en double, page non publiée, `x-default` hors groupe (erreur), langue peu fiable, variante régionale unique, rappel que l'adaptation exige un contenu propre au marché.
- **Balises alternates** (`alternates`) : réciproques, **seulement entre pages publiées**, auto-référencées, `x-default` uniquement s'il est choisi explicitement ; aucune balise s'il y a moins de deux pages publiées.

## Ce qui n'est PAS fait
- **hreflang est émis dans le `<head>` des pages du CMS** (`i18n.alternatesForPage`, branché dans `seo/webPages.head`, partial `seo-head-tags.ejs`) : lecture seule, par site, réciproque avec auto-référence ; jamais pour une page non publiée, archivée ou en noindex, ni quand il reste moins de deux pages publiées. Limites : pas de `x-default` (non stocké), pas d'émission pour les articles de blog ni pour la page d'accueil du site principal (hors CMS Pages).
- Pas d'URL localisée générée automatiquement ni de métadonnées localisées automatiques : chaque page liée a ses propres `seo.*`.
- Pas de traduction automatique ajoutée (la traduction de 21.6 existe côté Content Generator).
- Tests de rédaction locale : seul le français est contrôlé finement.
