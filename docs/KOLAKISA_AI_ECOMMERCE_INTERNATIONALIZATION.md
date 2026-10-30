# KOLAKISA — Internationalisation de la boutique

## Pris en charge
- Reconnaissance de 19 pays (dont RDC, Congo, France, Belgique, Suisse, Canada, Cameroun, Sénégal, Côte d'Ivoire, Maroc, Tunisie, Algérie, Mali, Bénin, Togo, Gabon, Rwanda, États-Unis, Royaume-Uni) ; marchés multiples cités dans le brief.
- Devise : détectée si écrite (euro, dollar, FCFA, franc congolais, dirham…) ; sinon la devise **usuelle du pays est une HYPOTHÈSE signalée**, jamais un fait.
- Montants en plus petite unité de la devise ; devises sans décimale (XOF, XAF, RWF) traitées pour l'import CSV.
- Langue du brief (français, anglais) : choisit la langue du contenu produit.
- Pages légales : « Mentions légales » proposée pour les pays de l'UE reconnus ; pour les autres, note d'avertissement.
- Zones de livraison par **codes pays saisis** ; règles de taxe par pays/région **saisies**.

## Limites réelles (ne rien supposer)
- Le moteur accepte tout code de devise mais **seul l'euro est testé**.
- **Pas de conversion de devises**, pas de boutique multi-devises.
- **Pas de formats de date, de nombre ou d'unités propres au pays** dans le constructeur ; pas de traduction de la boutique en plusieurs langues.
- Disponibilité des paiements par pays : **non vérifiée** (dépend du compte Stripe du propriétaire).
- Taxes : une règle par commande, pas d'OSS/TVA intracommunautaire (limite du moteur).
- Aucune règle américaine n'est codée en dur ; mais aucune règle locale n'est non plus fournie : tout est saisi.
