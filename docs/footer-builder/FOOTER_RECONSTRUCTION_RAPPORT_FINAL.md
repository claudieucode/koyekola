# Rapport final : nouvelle bibliothèque de 100 pieds de page (Footer) du Theme Builder

Date : 8 novembre 2026. Branche `footer-reconstruction`. Ce document a deux parties : la partie A est écrite pour une personne qui ne programme pas ; la partie B est pour un développeur. Tout ce qui est écrit « vérifié » a été **exécuté** (vrai serveur de test, vrai Chrome) ; ce qui n'a pas été exécuté est dit à part.

---

# Partie A : pour vous (sans jargon)

## Ce qui a été construit

- **100 modèles de pied de page** (la bande tout en bas d'un site), répartis en **15 familles** de métiers : minimalistes, entreprise, boutique, logiciel, presse et blog, créatifs, éducation, communautés, services, restauration et hôtellerie, immobilier, finance et juridique, associations, pages de vente, institutions. Chaque modèle a sa propre composition (ce n'est pas la même chose avec d'autres couleurs) : la comparaison de structure donne au plus **0,72 de ressemblance** pour un plafond fixé à 0,85.
- **Les anciens modèles ne sont plus proposés**, mais leurs 100 anciens identifiants **restent ouvrables** : ils mènent au nouveau modèle le plus proche (« alias »). Les sites qui ont déjà un pied installé ne changent pas : leur pied est une copie à eux.
- **Une vraie bibliothèque dans l'interface** : recherche, familles, favoris, aperçu en grand (ordinateur, tablette, téléphone), vignettes, bouton « Utiliser », « Revenir au modèle d'origine » (une sauvegarde est faite avant). La base de données reçoit une petite mise à jour automatique (migration 142 : favoris et modèle d'origine).
- **Des éléments réels, pas des décors** : lettre d'information et formulaire de contact branchés sur de vrais formulaires de l'espace Audience (consentement obligatoire, piège anti-robot, message de succès ou d'erreur) ; réseaux sociaux (13) ; accordéons sur téléphone ; menu du site ; coordonnées, horaires, mentions légales, moyens de paiement, livraison, téléphone, e-mail de l'entreprise. Quand une information manque (pas de menu, pas d'adresse), le modèle **n'affiche pas de faux contenu** : l'élément disparaît ou dit honnêtement qu'il n'est pas configuré.
- **Un seul pied par page**, toujours en pleine largeur, jamais le pied d'un autre site.

## Les défauts trouvés à la dernière vérification, et ce qu'on en a fait

| N° | Ce qui n'allait pas | Résultat |
|---|---|---|
| D1 | Dans l'aperçu de la bibliothèque, sur téléphone, les volets s'affichaient tous ouverts (ils sont fermés sur un vrai site) | **Corrigé** : l'aperçu charge maintenant le même script que le site ; volets fermés au départ, ils s'ouvrent au clic (mesuré dans Chrome). La petite vignette reste sans script. |
| D2 | La lettre d'information du pied ne pouvait pas être envoyée depuis le blog, la page d'erreur 404, la recherche (adresse d'envoi cassée) | **Corrigé** : une adresse d'envoi propre au site est utilisée. Mesuré : envoi réussi depuis le blog, la recherche et la 404, avec message « Merci » ou message d'erreur. **Non mesuré** : la boutique et le compte client (même mécanisme, mais pas servis par le serveur de test). |
| D3 | (déjà corrigé avant) L'envoi depuis le pied ne marchait pas du tout sur les pages normales | Corrigé et vérifié |
| D4 | 10 modèles avaient des volets (sur téléphone) qui s'ouvraient sur du vide quand le site n'a ni menu ni coordonnées | **Corrigé** : un volet qui n'a que son titre n'a plus de bouton et reste caché. |
| D5 | Le texte de l'aperçu n'avait pas la police du site et la ligne légale était plus basse que sur le site publié | **Corrigé** : l'aperçu est maintenant construit comme un site publié. |
| D6 | Un faux menu « Accueil / Services / Blog » était montré dans l'aperçu seulement | **Corrigé** : il reste (pour juger la mise en page) mais il est annoncé « (menu d'exemple) ». Jamais sur un site publié. |
| D7 | Le pied est placé dans la zone principale de la page (limite connue) | Pas corrigé, sans effet visible |
| D8 | Écarts de 56 px et de 296 px entre aperçu et site publié sur trois modèles | **Expliqué et corrigé** : 296 px = faux écart de la mesure (éléments cachés sur téléphone) ; 56 px = le faux menu d'exemple et une règle de style qui n'existait pas sur les pages normales. Les 60 comparaisons aperçu / publié sont maintenant à moins de 3 px. |

Autres petits restes traités : ligne légale du site (fond de la dernière bande repris), champ de recherche dans une colonne étroite (le bouton reste à côté), pictogrammes de réseaux sociaux « simples » trop petits (24 px au lieu de 12 px).

## Ce qui reste à vérifier à la main (je ne peux pas le faire)

1. Ouvrir 3 ou 4 modèles sur **votre vrai téléphone** et sur Safari (les mesures ont été faites avec Chrome sur Mac seulement).
2. Envoyer une vraie inscription depuis le pied de la **boutique** et du **compte client** sur un site en ligne (non mesuré).
3. Regarder à l'œil, sur un vrai site avec ses vraies données, 5 ou 6 modèles : les captures automatiques ne remplacent pas votre regard.
4. Le plan interactif du modèle « campus » (éducation 06) charge une carte externe, non vue ici.
5. Après mise en ligne : vérifier qu'une fois le site redéployé, un ancien identifiant (alias) ouvre bien un modèle.

## Limites connues (honnêtes)

- Mesuré avec Chrome sous macOS uniquement : pas Firefox, pas Safari, pas de lecteur d'écran.
- Le regard humain (captures) a porté sur les 100 modèles à 1280 px mais seulement sur environ 40 modèles à 390 px ; le reste est mesuré par programme (débordement, chevauchement, contraste, taille des zones tactiles).
- Quelques modèles restent « corrects mais pas excellents » (voir `CAMPAGNE_VISUELLE_FINALE.md`).
- Le déploiement sur Hostinger (hPanel) reste à faire par vous : rien n'est publié par ce travail.

---

# Partie B : pour le développeur

## Où est quoi

| Sujet | Fichiers |
|---|---|
| Catalogue (100 modèles, 15 familles) | `src/themeBuilder/catalog/footer.js` (assembleur), `footer/familles/<famille>.js`, `footer/moteur.js`, `footer/elements.js`, `footer/kit-conception.js`, `footer/empreinte.js` |
| Alias des anciens identifiants | `src/themeBuilder/catalog/footer-aliases.js` (table), `catalog/index.js` (`find` suit les alias) ; doc générée `ALIAS_ANCIENS_MODELES.md` |
| Bibliothèque (interface) | `public/js/theme-builder.js`, `public/css/theme-builder.css`, `views/marketing/theme-builder.ejs`, `src/marketing/web/themeBuilder.js` (routes `apercu`, `vignette`, `miniature`, `utiliser`, `favoris`) |
| Favoris / modèle d'origine | `src/themeBuilder/favoris.js`, `originBackfill.js`, migration `src/marketing/migrations/142_pied_favoris_origine.sql`, `scripts/pieds-remplir-origine.js` |
| Rendu de l'aperçu | `src/marketing/web/themeRender.js` (`previewDoc`) |
| Rendu public d'un pied | `views/marketing-public/_sections.ejs` (balise `<footer>`, `data-kw-footer`, ligne légale), `_foot-extra.ejs`, `public/css/landing.css` (règles `[data-kw-footer]`), `public/js/landing.js` (accordéons) |
| Envoi du formulaire du pied | `views/marketing-public/widgets/emailsubscribe.ejs`, `src/marketing/web/landingPublic.js`, `src/middlewares/themeLayout.js` |

## Correctifs de cette dernière passe

- **D1** `themeRender.js` `previewDoc` : le script `landing.js` est chargé pour l'aperçu complet (`thumb ? "" : <script>`), jamais pour la vignette. Les autres types de modèles (en-tête, archives, produits…) n'ont pas changé de comportement.
- **D5** le `<body>` de l'aperçu d'un pied porte `class="lp-body lp-site"` (comme `landing.ejs`). Les règles `[data-kw-footer]` (ligne légale compacte, colonne réduite à son titre masquée, champ de recherche) ont été **déplacées de `themeRender.js` vers `landing.css`** : elles n'existaient que dans le rendu « hors Page Builder » ; sur une page du Page Builder (`/p/<page>`) le pied était donc différent (ligne légale de 24/32 px au lieu de 12/16, colonnes réduites à leur titre visibles). C'était la vraie cause des +24 à +27 px et des textes « Entreprise / Horaires » en trop.
- **D6** le menu d'exemple (`SAMPLE_MENU`, aperçu et vignette de la bibliothèque seulement) reçoit `data-kw-sample="1"` (`_node.ejs`) et une mention CSS `::after` « (menu d'exemple) » (pieds seulement).
- **D4** `public/js/landing.js` : un volet qui ne contient que son titre (après retrait de `.kw-heading`, ni texte, ni lien, ni image, ni champ) n'est pas transformé en bouton et reçoit `hidden` + `data-kw-empty` ; `restore()` (retour à l'ordinateur) le réaffiche. Valable pour tout futur modèle.
- **D2** nouvelle route `POST /p/_pied/inscription` (`landingPublic.js`, avant `/p/:slug/inscription` ; `_pied` ne peut pas être une adresse de page). Le widget est cherché dans les parties du **site de la requête** (domaine ou site principal : `pages.siteParts` + modèles `header`/`footer` publiés), formulaire du même site obligatoire (`sameSite`). Mêmes protections que la route de page : champ piège et jeton (faux succès silencieux), limite 5 envois/heure/IP, consentement, validation d'e-mail dans `forms.submitForm`. Retour par `303` sur la page d'origine (`back`, contrôlé : chemin local seulement, sans `//` ni `\`), avec `?kwi=<code>&w=<widget>` ; `themeLayout.js` transforme ce code en message (`res.locals.widgetForm`), émet le jeton anti-robot (`formToken`, absent hors Page Builder : sans lui tout envoi était pris pour un robot) et la page de retour (`kwBack`). `emailsubscribe.ejs` choisit l'adresse : `/p/<page>/inscription` si la page existe, sinon `/p/_pied/inscription`.
- **D8** voir D5 / D6 ; plus le test `footer-comportements-navigateur` ignore maintenant les éléments non affichés (rectangle nul).
- **Restes** : ligne légale reprend fond et couleur de la dernière bande (`_sections.ejs`, valeurs filtrées) ; recherche `flex: 1 1 120px` ; réseaux « plain » : taille 44 (pictogramme 24 px), écart 2 px (`elements.js`).

## Tests rouges

- `footer-rendu-unifie` : le test comptait le texte `data-kw-footer` (présent dans le CSS) ; il compte maintenant l'attribut HTML ` data-kw-footer=`.
- `theme-builder-pieds-bibliotheque` « anciennes clés » : les 20 × 5 clés citées par ce test ne sont pas des alias (les alias sont les 100 identifiants de la liste précédente) : elles répondent bien 404 ; le test passe seul. Une vérification de la règle des alias a été ajoutée (alias : 200, jamais listé).
- `theme-builder-404 / archives / recherche / archives-produits -bibliotheque` : **échecs préexistants sur `origin/main`** (le même test échoue sur une copie propre de main : aperçu ≠ vignette parce que l'aperçu des autres types charge un script). Non causés par ce chantier.
- Éditeur, « annuler une suppression » sur `ft-minimalistes-01` : le modèle passe seul (11/11 actions) ; défaillance seulement sous forte charge (enregistrement automatique plus lent que l'attente du test). Pas un défaut d'annulation. Attente portée de 7 à 10 s.

## Ajouter un modèle

Voir `GUIDE_AJOUTER_UN_MODELE.md`. En bref : écrire le modèle dans le fichier de sa famille avec le kit de conception ; relancer `node scripts/documenter-pieds.js` (empreinte, similarité, fiches) ; `node --test tests/footer-reconstruction.test.js tests/footer-100-integration.test.js` ; mesurer avec `node scripts/audit-pieds-cdp.js --id=<clé>` ; mettre à jour la cible de la famille si le total change.

## Comment tester

```
TEST_START_TIMEOUT_MS=900000 node --test --test-concurrency=1 tests/footer-reconstruction.test.js   # un fichier à la fois
node scripts/audit-pieds-cdp.js --sortie=/tmp/audit.json     # 100 modèles x 5 largeurs x avec/sans données (Chrome requis)
node scripts/documenter-pieds.js                              # similarité 100 x 100 et fiches générées
```
Sur une machine chargée, un test Chrome peut échouer au démarrage : le relancer seul avant de conclure.

## Résultats finaux (exécutés le 8 novembre 2026, un fichier à la fois)

| Contrôle | Résultat |
|---|---|
| Mesure Chrome des 100 modèles (`scripts/audit-pieds-cdp.js`, 5 largeurs 390 / 820 / 1280 / 1440 / 1920, avec ET sans données d'entreprise) | **1 000 mesures, 0 défaut** (débordement, chevauchement, hors écran, texte coupé, erreur JavaScript, bande non pleine, cible tactile, contraste, volet vide). Une première passe a signalé 2 « volets vides » : fausse alerte de l'outil (le volet contenait des questions repliables que l'outil ne comptait pas) ; outil corrigé, modèle remesuré : 0 |
| Volets d'accordéon à 390 px, sans et avec données | 28 modèles, 219 volets ouverts un par un : aucun ne s'ouvre sur du vide |
| Aperçu = publié (20 modèles × 3 largeurs = 60 mesures) | 60 sur 60 à moins de 3 px (hauteur et position/taille de chaque bloc) |
| Similarité de structure 100 × 100 (`node scripts/documenter-pieds.js`) | maximum **0,723** (plafond 0,85), moyenne 0,275 |
| 79 fichiers de test lancés (tests `footer-*` y compris les 4 fichiers Chrome, `theme-builder-*` hors Chrome, site-principal, en-tête, thèmes en paquets, isolation, apparence, commerce, widgets de l'éditeur, tunnels, formulaires publics) | **942 contrôles réussis, 6 en échec, 5 annulés**, répartis ci-dessous |

Fichiers `footer-*` : tous verts, y compris `footer-comportements-navigateur` (3/3, qui échouait volontairement avant les correctifs), `footer-comportements-reels` (le test D2 est un vrai test), `footer-comportements-editeur-navigateur` (12 modèles), `footer-rendu-unifie` (10/10).

**Échecs PRÉEXISTANTS (existent aussi sur une copie propre de `origin/main` ou étaient connus), non causés par ce chantier** :
- `theme-builder-catalogue` (20 réussis / 1 échec) et `theme-builder-catalogue-public` (4 / 1) : connus.
- `theme-builder-404-bibliotheque`, `-archives-bibliotheque`, `-recherche-bibliotheque`, `-archives-produits-bibliotheque` (1 échec chacun) : **même échec, même test, sur `origin/main`** (l'aperçu des autres types de modèles charge un script que la vignette n'a pas).
- `site-principal-theme-builder` (5 annulés) : le pilote Chrome de ce vieux test (`tests/helpers-chrome-site.js`) ne démarre pas avec le Chrome de cette machine ; même résultat sur `origin/main`.
- Non relancés (hors périmètre, connus comme préexistants) : `cms-interface`, migration 081, `agent-ia`, infobulles.

**Fausses alertes de charge** : `isolation-proprietes` et `footer-editeur-etats` (échecs de démarrage de Chrome lors d'un premier passage chargé) sont verts quand ils sont lancés seuls (28/28 et 18/18). Dans l'éditeur, « annuler une suppression » sur `ft-minimalistes-01` : vert seul et vert dans la passe finale.

**Vrais échecs corrigés pendant cette passe** : D1, D2, D4, D5, D6, D8 (voir plus haut) ; `footer-rendu-unifie` (le test comptait le texte du CSS) ; `theme-builder-apercu-vignette` (le test ne tolérait pas le `<body class="lp-body lp-site">` de l'aperçu d'un pied ; test adapté, vert 5/5).

## Ce qui n'a pas été vérifié

- Boutique et compte client servis pour de vrai (seulement le même gabarit que le blog et la 404).
- Autres navigateurs, vrai téléphone, lecteur d'écran.
- La ligne légale reprenant le fond de la dernière bande a été mesurée sur 2 modèles (sombre et clair) dans l'aperçu et le site publié ; la lisibilité de tous les modèles est couverte par la mesure de contraste (0 défaut).
- Cartes externes (plan de campus).

