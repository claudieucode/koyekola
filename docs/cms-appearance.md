# KOLAKISA CMS — Palier 8 : moteur d'apparence (Éditeur du site)

## Ce qui existait et a été réutilisé (rien de parallèle)
- **Design system du Page Builder** (`src/marketing/pages/tokens.js`, `themeCss.js`) : jetons de couleurs, polices, tailles, rayons, ombres, boutons, liens, conteneurs, variables `--kw-…`. C'est la **source de vérité unique** des styles.
- **Modèles de thème** (`pages/themeTemplates.js`, `web/themeRender.js`) : une page du Page Builder affectée à une famille de pages du site. Étendus (voir Templates).
- **Composants** du Page Builder (`mk_web_components`) = le mode **synchronisé** des patterns. **Blocs** (`pages/patterns.js`) = patterns intégrés.
- **Navigation Engine** (palier 7) pour tous les menus ; **Médiathèque** pour les images ; **Taxonomies** et **Commentaires** pour les données des templates.
- Les sites du Page Builder gardent leurs jetons dans `mk_sites.tokens` (inchangé, isolés les uns des autres).

## Nouveau
- `appearance_configs` (brouillon, version publiée, CSS compilé, révision), `appearance_revisions` (historique des publications, 30 dernières), `appearance_patterns` (patterns enregistrés).
- `src/services/appearance.js` : configuration du site public principal = `{ tokens, header, footer }`. Brouillon → aperçu → publication. Sans configuration publiée le site est **identique à l'origine** (aucun CSS ajouté) ; seules les valeurs modifiées produisent des règles.
- Rendu : `<style id="kw-appearance">` dans l'en-tête public (variables du site + `--kw-…` + règles faibles en spécificité), en-tête et pied de page lus dans la configuration publiée. Les modèles de thème rendus par le Page Builder reçoivent les mêmes jetons (une seule source).
- Aperçu : `?kwpreview=1` (équipe seulement : formateur ou éditeur et plus) affiche le **brouillon** sur le vrai site, avec une barre d'aperçu et `noindex`. L'écran « Éditeur du site » l'affiche dans un cadre ordinateur / tablette / mobile.

## Cascade des styles (le plus local gagne)
1. jetons globaux (variables) → 2. styles du thème (`:where`, faible spécificité) → 3. style du modèle (page du Page Builder) → 4. classe / style de l'élément (inspecteur) → 5. CSS personnalisé du site.

## Écrans (CMS → Apparence)
Éditeur du site (état, aperçu, publication, historique, sites du Page Builder) · Styles · En-tête · Pied de page · Templates · Patterns. Menus : voir Navigation.

## Templates : familles et priorité
Article · Liste du blog · Archive de catégorie · Archive d'étiquette · Résultats de recherche · Page du site (À propos) · Page introuvable (404). Chaque famille essaie ses modèles puis retombe : archive de catégorie → liste du blog ; archive d'étiquette → liste du blog ; recherche → liste du blog ; sinon affichage d'origine.
**Priorité** quand plusieurs modèles conviennent : article précis (8) › catégorie (4 ; la catégorie de l'article avant ses parentes) › étiquette (2) › public (1) › modèle général ; à score égal, le plus ancien ; seulement si la page est en ligne.
Le contenu réel (article, texte, liste) est injecté dans la page du modèle (éléments « Contenu de l'article », boucles, `{{post.…}}`, `{{query.categorie}}`, `{{query.etiquette}}`, `{{query.q}}`) : le modèle ne copie jamais le contenu.

## En-tête / pied de page (Template Parts du site public)
En-tête : logo (texte ou image de la médiathèque), recherche, panier, compte, bouton d'action (+ dans le tiroir mobile), barre d'annonce. Pied de page : marque, phrase, mention `{année}`, lien Cookies. Les **menus** viennent de Navigation (emplacements en-tête / mobile / pied de page). Un seul en-tête et un seul pied de page pour tous les templates : les modifier les change partout.

## Patterns
Statique (copie indépendante) : « Créer un pattern à partir d'une section » d'une page → proposé dans « Ajouter → Blocs » du Page Builder. Synchronisé : composants du Page Builder (existants). Les deux sont listés dans Apparence → Patterns.

## Sécurité
Les jetons sont validés strictement (couleurs `#rrggbb`/`token:`, polices d'une liste fermée, nombres bornés — une valeur hors limites est refusée, jamais corrigée en silence) ; le CSS n'est produit que de ces valeurs (pas de champ CSS libre). Textes d'en-tête / pied de page échappés ; adresses validées (liste blanche) ; logo = image de la médiathèque uniquement.

## Droits
`appearance.read` (lecteur) · `appearance.styles`, `.parts`, `.templates`, `.patterns` (éditeur : brouillon) · `appearance.publish` (administrateur : publier, retirer).

## Préparé, non implémenté
Pattern synchronisé créé depuis cet écran (le mode synchronisé existe via les composants) · surcharge d'en-tête / pied de page par page pour le site public (existe pour les pages du Page Builder : en-tête par page) · template par type de contenu personnalisé · aperçu d'un seul template avant publication de sa page · jetons propres à un template · apparence distincte par site du Page Builder depuis cet écran (leur fiche reste le lieu) · éditeur d'en-tête visuel (le Page Builder reste réservé aux pages et modèles).
