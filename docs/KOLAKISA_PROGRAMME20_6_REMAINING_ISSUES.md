# Programme 20.6 — limites et points restants

## Non terminé ou volontairement absent
1. **Boutique** : pas de panier multi-produits, produits physiques, livraison, taxes ni pages Panier/Commande/Compte. L'assistant ne les propose pas. Reste : le catalogue de formations + module Commerce (compte Stripe à configurer par l'équipe).
2. **Interface en français uniquement.** La langue choisie est celle du site, pas celle de l'assistant. Les pays/langues/devises supportés sont ceux de `catalog.js`.
3. **Informations régionales** (langue, fuseau, devise) enregistrées dans l'assistant ; elles ne pilotent pas encore le rendu public du site ni la devise des ventes. Seuls le nom, la description et les coordonnées alimentent le SEO local.
4. **Aucune conformité fiscale ou juridique** n'est calculée ni affirmée.
5. **Logo** : import via la médiathèque puis chemin ; pas de sélecteur graphique de la médiathèque dans l'assistant.
6. **Réorganisation des pages** : boutons ↑ ↓ + « Enregistrer l'ordre » (pas de glisser-déposer). L'ordre alimente le menu créé par l'assistant.
7. **Images** : à choisir dans l'éditeur (pas d'étape dédiée).
8. **Modules** : seuls sms, ai, social, scoring, commerce sont activables (équipe). Formations (lms) n'est pas encore ouvert aux sites. Réservation, galerie dédiée et avis clients n'existent pas.
9. **Création d'un site** réservée à l'équipe ; une personne limitée à un site peut reprendre le sien.
10. **Domaine** : lecture seule dans l'assistant ; l'ajout, la vérification et le DNS restent dans l'écran Domaines.

## À vérifier avec un navigateur
Mise en page des écrans, étapes sur mobile, accessibilité clavier/lecteur d'écran réelle, comportement hors connexion. Le code prévoit libellés, `aria-current`, `role="progressbar"`, focus visibles et `prefers-reduced-motion`, mais cela n'a pas été constaté visuellement.

## Risques
- Les noms de pages sont uniques dans l'organisation : les pages proposées prennent « Accueil (2) » si « Accueil » existe ailleurs (comportement identique à la Template Library).
- La table de progression est créée au premier usage ; une sauvegarde de base sans cette table reste valide.

## Recommandations pour le programme 20.7
Écran visuel d'essai réel (captures) ; sélecteur de médiathèque ; propagation de la langue/devise du site vers le rendu et le commerce ; glisser-déposer des pages ; panier de produits (prérequis de l'option Boutique complète) ; interface de l'assistant traduisible.
