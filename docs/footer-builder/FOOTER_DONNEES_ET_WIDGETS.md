# Pied de page : données d'entreprise et widgets (chantier C, 7 novembre 2026)

## 1. Ce qui a été ajouté

### Données d'entreprise par site
* **Où les régler** : Administration du site → *Paramètres → Général* → raccourci « Données de l'entreprise », ou directement `/marketing/site-web/parametres/entreprise?site=<id>` (sans `?site=` : site principal). Même permissions que les autres Paramètres : lecture `settings.read`, écriture `settings.write` ; un site archivé est en lecture seule ; un accès limité à un site ne voit que son site (barrière `siteTarget`).
* **Ce qu'on peut saisir** : raison sociale, slogan ; adresse (rue, code postal, ville, pays) ; jusqu'à 3 téléphones (avec libellé) ; e-mail de contact ; **horaires** (7 jours, jusqu'à 3 plages par jour, jours fermés, 24 :00 pour minuit, jusqu'à 24 jours spéciaux datés qui remplacent les horaires habituels, remarque) ; informations légales (forme juridique, capital, jusqu'à 5 numéros libres SIRET/RCS/TVA ou équivalent, directeur de publication, hébergeur nom + adresse) ; pages légales (mentions, confidentialité, CGV : page du site ou `https://`) ; moyens de paiement (cases : carte bancaire, PayPal, virement, chèque, espèces, paiement à la livraison, paiement mobile, paiement en plusieurs fois) ; livraison et retours (texte court, 300 caractères) ; jusqu'à 6 informations personnalisées (nom + valeur) ; trois cases « ne pas afficher au public » (adresse, téléphones, e-mail).
* **Stockage** : migration `src/marketing/migrations/140_donnees_entreprise.sql` (additive) : table `mk_business_profile` (`organization_id`, `site_id` NULL = site principal, `data` JSON, `updated_by`, `updated_at`), index unique `(organization_id, COALESCE(site_id, 0))` : une ligne par organisation et par site. Aucune table existante modifiée. Son empreinte n'est volontairement PAS ajoutée à `tests/marketing-migrations-figees.test.js` (à faire une fois la migration publiée, comme le demande ce test).
* **Validation (serveur)** : `src/marketing/pages/business.js` (`normalize`) : tout est du texte (les chevrons `<` `>` sont retirés), e-mail et téléphone au format strict (6 à 15 chiffres), heures `HH:MM`, plages ordonnées sans chevauchement, dates réelles, liens légaux validés par `linkUrl` (jamais `mailto:`/`tel:`/`javascript:` pour une page légale). Une erreur refuse TOUT l'enregistrement (rien n'est écrit) et la saisie est réaffichée avec un message en français. Une donnée corrompue en base donne un profil vide, jamais une erreur de page.
* **Écran** : `src/marketing/web/businessSettings.js` + `views/marketing/business-settings.ejs` (formulaire classique, fonctionne sans JavaScript). Monté dans `src/marketing/web/index.js` avant le moteur de réglages.

### Étiquettes dynamiques (groupe « Entreprise »)
Les clés sont en minuscules (la casse tapée est indifférente : `{{business.legalName}}` fonctionne). Valeur vide = rien (ou le repli `| fallback: …`).
`business.legalname`, `business.tagline` (et `site.tagline`), `business.address`, `business.street`, `business.postalcode`, `business.city`, `business.country`, `business.phone`, `business.phone2`, `business.phone_url` (lien `tel:`), `business.email`, `business.email_url` (lien `mailto:`), `business.hours` (résumé « Lun–Ven : 9h–18h · Sam : 10h–12h · Dim : fermé »), `business.open_now` (« Ouvert maintenant » / « Fermé actuellement »), `business.legalform`, `business.registration`, `business.publisher`, `business.host`, `business.delivery`, `business.returns`, `business.notice_url`, `business.privacy_url`, `business.terms_url`, `business.custom1` à `business.custom6`, et `site.year` (année courante), `site.copyright` (« © 2026 Raison sociale », nom du site si pas de raison sociale).
Sécurité : une étiquette ne produit que du texte ; dans un texte riche la valeur est échappée ; dans un champ d'adresse la valeur résolue est revalidée par `linkUrl` (une valeur piégée est vidée). Les données masquées par les cases « ne pas afficher » ne sont lues par aucune étiquette ni aucun widget (`publicView`).
Le contexte vient de `baseScope` (`src/marketing/landing/index.js`) : `scope.business = { profile, tz }`, calculé pour le site de la page affichée ; aperçu de démonstration d'un thème = rien.

### Liens `tel:` et `mailto:`
`linkUrl` (`src/marketing/pages/sections.js`) accepte désormais, en plus de `/…`, `#ancre` et `https://…` : `mailto:nom@domaine.fr` (aucun paramètre, aucune virgule) et `tel:` + 4 à 15 chiffres (« + » initial permis ; espaces, points, tirets et parenthèses retirés et le lien est renvoyé sous forme compacte). Refusés : `javascript:`, `data:`, `vbscript:`, `sms:`, `file:`, `http://`, `//…`, et toute autre forme (testés). Effet voulu sur TOUS les widgets à lien (bouton, lien, liste d'icônes…). Les clics sur `tel:`/`mailto:` ne sont pas comptés comme les ancres (`_sections.ejs` et `linksOf`).

### Widgets (catégorie « Pied de page »)
Nouvelle catégorie de la bibliothèque (`WIDGET_GROUPS.footer`). Fichier `src/marketing/pages/widgets/footer.js`, gabarits `views/marketing-public/widgets/*.ejs`, styles à la fin de `public/css/landing.css`, script `public/js/kw-backtotop.js`. Chaque widget a icône, description, mots de recherche, contenu de départ valide, onglets Style/Avancé/états/responsive communs du moteur, et des **parties stylables** (`parts.js` : titres, icônes, liens, lignes, boutons…).

| Widget (type) | Rôle |
|---|---|
| Coordonnées (`bizcontact`) | raison sociale, adresse, téléphone et e-mail cliquables ; icônes ; en colonne ou sur une ligne |
| Téléphone cliquable (`bizphone`) | un des 3 numéros, lien `tel:` reconstruit côté serveur |
| E-mail cliquable (`bizemail`) | lien `mailto:` reconstruit côté serveur, texte du lien libre |
| Horaires d'ouverture (`bizhours`) | jours regroupés ou non, jour courant en gras, « Ouvert maintenant » / « Fermé actuellement » **calculé côté serveur à chaque affichage** dans le fuseau du site (Paramètres → Général, Europe/Paris par défaut), jours spéciaux à venir, remarque |
| Informations légales (`bizlegal`) | raison sociale, forme/capital, immatriculations, directeur de publication, hébergeur, liens vers les pages légales |
| Moyens de paiement (`bizpayments`) | étiquettes ou texte simple, **libellés génériques sans marque ni logo** |
| Livraison et retours (`bizdelivery`) | les deux textes courts |
| Champs personnalisés (`bizfields`) | les 6 informations libres |
| Retour en haut (`backtotop`) | bouton fixé dans un coin (apparaît après un seuil de défilement réglable) ou lien en ligne ; vrai lien `<a href="#">` nommé (clavier, lecteurs d'écran) ; défilement fluide désactivé si la personne demande moins de mouvement ; focus rendu au début de la page ; sans JavaScript il reste visible et fonctionne |
| Abonnement par e-mail (`emailsubscribe`) | champ e-mail + bouton ; **réutilise un formulaire d'inscription réel** (mêmes champs de protection, case de consentement, route `/p/<page>/inscription`, anti-robot, enregistrement) : voir `src/marketing/pages/emailSubscribe.js` ; formulaire choisi par son numéro, ou (0) le plus récent formulaire publié DU MÊME SITE dont rien d'autre que l'e-mail n'est obligatoire ; publication bloquée s'il n'y en a aucun |

Règles communes : rendu public **vide** (aucune enveloppe) s'il n'y a rien à montrer ; dans l'éditeur, un cadre d'aide pointe vers « Paramètres → Données de l'entreprise » ; tout texte est échappé par les gabarits ; chaque site ne lit que ses données.

### Déjà existants (rien recréé)
* **Copyright automatique** : widget natif `copyright` (« © année propriétaire. texte », année courante, propriétaire vide = nom du site) + étiquettes `{{site.copyright}}` / `{{site.year}}` pour les textes libres.
* **Séparateur / espaceur** : widgets natifs `divider` et `spacer`.
* **Carte** : widget `map` (l'adresse peut être recopiée depuis `{{business.address}}` dans un texte, mais le champ adresse du widget reste une saisie).

## 2. Champs personnalisés : état réel
Il n'existait AUCUN mécanisme de champs personnalisés dans les étiquettes dynamiques (aucune source `meta.*`). Choix fait : 6 « informations personnalisées » par site (nom + valeur) dans les données d'entreprise, lisibles par le widget `bizfields` et les étiquettes `business.custom1…6`. Ce n'est PAS un système de champs de contenu (articles, produits) : cela reste à faire (écart n° 42, priorité P2).

## 3. Fichiers touchés
Nouveaux : `src/marketing/migrations/140_donnees_entreprise.sql`, `src/marketing/pages/business.js`, `src/marketing/pages/emailSubscribe.js`, `src/marketing/pages/widgets/footer.js`, `src/marketing/web/businessSettings.js`, `views/marketing/business-settings.ejs`, `views/marketing-public/widgets/{bizcontact,bizphone,bizemail,bizhours,bizlegal,bizpayments,bizdelivery,bizfields,backtotop,emailsubscribe}.ejs`, `public/js/kw-backtotop.js`, `tests/footer-widgets-entreprise.test.js`.
Modifiés (changements courts, exacts) : `src/marketing/pages/sections.js` (`linkUrl`), `src/marketing/pages/dynamic.js` (sources + groupe), `src/marketing/pages/nodes.js` (une catégorie `footer`), `src/marketing/pages/parts.js` (parties des 10 widgets), `src/marketing/landing/index.js` (`baseScope.business`, `linksOf` sans `tel:`, publication de l'abonnement), `src/marketing/web/landingPublic.js` (le formulaire du widget d'abonnement), `src/marketing/web/index.js`, `src/marketing/web/generalSettings.js` + `views/marketing/settings-general.ejs` (raccourci), `views/marketing-public/_sections.ejs` (`tel:` non compté), `public/css/landing.css` (ajout en fin de fichier), `tests/editeur-widgets.test.js` (la liste des catégories compte « Pied de page »).

## 4. Limites connues (honnêtes)
* L'abonnement par e-mail se choisit par **numéro de formulaire** (ou automatiquement) : l'éditeur n'a pas de sélecteur de formulaire pour les widgets personnalisés (éviter de modifier `page-builder.js`). Le formulaire d'inscription pointe vers `/p/<page>/inscription` : sur une page qui n'est pas une page du Page Builder (article, boutique), le comportement est celui du widget « Formulaire » existant (non vérifié hors pages du Page Builder).
* Pas d'icône « téléphone », « carte bancaire » ni « camion » dans la bibliothèque d'icônes : icônes génériques utilisées (smartphone, pièce, flèche).
* Les horaires ne gèrent pas les ouvertures qui passent minuit (utiliser deux jours : 18:00–24:00 puis 00:00–02:00 le lendemain). Pas de fuseau propre aux horaires : celui du site.
* Les 100 pieds du catalogue ne sont pas modifiés (chantier F) : ils n'utilisent pas encore ces widgets.
* Le multilingue des libellés fixes (« Ouvert maintenant », noms des jours, moyens de paiement) n'existe pas : français seulement.
* Aucune vérification visuelle dans un navigateur n'a été faite (styles écrits, non vus).
