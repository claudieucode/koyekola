# Maillage interne

## Analyse (`linking.analyze`)
Pour un site : liens sortants et entrants entre ses pages, **pages orphelines** (publiées, sans lien entrant depuis le contenu d'une autre page, hors page d'accueil), **ancres génériques** (« cliquez ici », « en savoir plus »…), **liens depuis une page publiée vers une page non publiée**, liens vers un chemin de page inexistant.
**Limite déclarée dans la réponse** : seuls les liens écrits dans le contenu sont comptés ; menus et pieds de page ne le sont pas. La vérification des liens cassés en conditions réelles reste celle de l'analyse SEO du site.

## Propositions
`propose` : pour chaque page publiée, les autres pages **publiées du même site** dont le mot-clé/titre est cité dans son texte et vers lesquelles elle ne pointe pas (réutilise `seo/linkSuggestions.suggest`). Enregistrées dans `mk_ci_link_props` (unique par page/cible/ancre : jamais deux fois, jamais rouvertes après une décision).

## Décision
- **Refuser** : la proposition est close.
- **Accepter** : le lien Markdown est inséré dans le **brouillon**, dans un texte où l'ancre apparaît encore **et n'est pas déjà dans un lien** (premier emplacement trouvé ; l'intérieur d'un lien existant n'est jamais touché). Avant écriture : version de la page (`regen.takeSnapshot`, restaurable). La page en ligne est inchangée ; il faut la publier.
- Refus explicites : `target_gone` (cible supprimée ou plus publiée), `cannot_apply` (ancre introuvable), `conflict` (déjà traitée), `not_found` (autre site).

## Frontières
Toutes les lectures filtrent `site_id` et `organization_id` ; accepter ou refuser avec l'identifiant d'un autre site → 404.

## Limites
Détection par présence littérale du sujet (pas d'analyse sémantique) ; un lien n'est inséré que dans une section « texte » (pas dans les titres, listes ou FAQ).
