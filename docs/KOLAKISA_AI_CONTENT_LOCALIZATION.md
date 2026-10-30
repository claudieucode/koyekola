# Localisation et multilinguisme

## Langues (`localize.js`)
- **Prises en charge** : français, anglais, espagnol, portugais.
- **Selon le fournisseur** (qualité non vérifiée, signalée, relecture indispensable) : allemand, italien, swahili, lingala, arabe.
- Toute autre langue : refusée (`language_unsupported`).

## Localisation, pas traduction littérale
Le prompt demande une rédaction directe dans la langue cible, avec le vocabulaire professionnel local, et, pour une version dérivée, d'« adapter (localiser) le texte source, pas de le traduire mot à mot ». Il fournit le profil du pays : devise de référence (+ usage courant), fuseau, système d'unités, **exemples de formats** calculés par `Intl` (nombre, date) ; il interdit d'importer une devise, une marque ou une référence d'un autre pays, et de **présumer** un moyen de paiement, une livraison ou une obligation légale (`payments` et `legal` valent toujours `unverified`).

Table pays (17) : RDC, Congo-Brazzaville, Cameroun, Sénégal, Côte d'Ivoire, Maroc, France, Belgique, Suisse, Canada, États-Unis, Royaume-Uni, Espagne, Mexique, Portugal, Brésil, Angola. Pays absent : aucune valeur par défaut, note explicite.

## Versions linguistiques
`engine.localizeSet(setId, {language})` crée (ou met à jour) l'ensemble de la langue cible, relié à l'original (`source_set_id`), sans `page_id` : **le CMS n'a pas de pages multilingues** (le registre le déclare « indisponible »). La version n'est donc appliquée que sur une page cible choisie explicitement (`pageId`, retrouvée par identifiant de section puis par position et type).
**Aucun texte manuel n'est écrasé** : à la relocalisation, les champs écrits par une personne ou verrouillés sont conservés et listés (`preserved`) ; seuls les autres sont régénérés.

## Garde des faits
Les données chiffrées du texte **source** sont des faits (elles peuvent être reprises) ; tout nombre, contact ou adresse nouveau est remplacé par `[à compléter]` comme à la génération.

## Limites
Pas de détection fiable de la langue (indices lexicaux fr/en/es/pt, sert à *signaler*) ; pas de vérification de la qualité des langues « selon le fournisseur » ; les formats régionaux ne sont donnés qu'en exemples (rien n'est converti) ; pas de `hreflang` ni de sélecteur de langue (fonctions du CMS inexistantes).
