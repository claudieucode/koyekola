# Audit fonctionnel final — capacités Elementor dans l'éditeur KOLAKISA (8 octobre 2026)

Légende : ✅ fonctionnel · ⚠️ partiel · ❌ non implémenté · ➡️ couvert par un autre module de KOLAKISA (réutilisé, pas de doublon) ·
🆕 construit pendant cette mission · 🔄 existant amélioré. Les lignes sont celles de `ELEMENTOR_FEATURE_INVENTORY.md` (91 lignes).

| ID | Fonctionnalité | Statut | Fonctionnelle | Testée | Compatible Kolakisa | Problème | Action |
|---|---|---|---|---|---|---|---|
| A01 | Containers flex / grille / imbriqués | ✅ | oui | oui | oui | — | — |
| A02 | Direction, wrap, justify, align, gap, order, grow, shrink, basis | ✅ | oui | oui | oui | — | — |
| A03 | Largeur, hauteur, min/max, débordement, z-index | ✅ | oui | oui | oui | — | — |
| A04 | Positions relative / sticky / absolute / fixed | ✅ | oui | oui | oui | — | — |
| A05 | Grille : colonnes, lignes, étendue, modèle de colonnes | ✅ | oui | oui | oui | — | — |
| A06 | Grille : auto-fit / auto-fill / minmax, zones nommées | ⚠️ | partiel | non | oui | non vérifié | à vérifier |
| A07 | Largeur de section | ✅ | oui | oui | oui | — | — |
| A08 | Inner Section | ✅ | oui | oui | oui | — | — |
| B01 | Heading | ✅ | oui | oui | oui | — | — |
| B02 | Text Editor | ✅ | oui | oui | oui | — | — |
| B03 | Image / Image Box | ✅ | oui | oui | oui | — | — |
| B04 | Icon / Icon Box / Icon List | ✅ | oui | oui | oui | — | — |
| B05 | Button | ✅ | oui | oui | oui | — | — |
| B06 | Divider / Spacer | ✅ | oui | oui | oui | — | — |
| B07 | Google Maps | ✅ | oui | oui | oui | — | — |
| B08 | Video | ✅ | oui | oui | oui | — | — |
| B09 | Image Carousel / Gallery | ✅ | oui | oui | oui | — | — |
| B10 | Audio / SoundCloud | ✅ | oui | oui | oui | — | — |
| B11 | HTML | ✅ | oui | oui | oui | — | — |
| B12 | Shortcode (équivalent sûr : étiquettes dynamiques) | ✅ 🆕 | oui | oui | oui | pas de code libre, par sécurité | fait (D01) |
| B13 | Text Path | ❌ | — | — | — | non construit | à faire |
| B14 | Lottie | ❌ | — | — | — | refusé : pas de bibliothèque locale / JSON externe | documenté |
| B15 | Video Playlist | ❌ | — | — | — | non construit | à faire |
| B16 | Slides | ⚠️ | partiel | oui (carrousel) | oui | pas de texte / bouton par diapositive | à faire |
| B17 | Blockquote | ✅ | oui | oui | oui | — | — |
| B18 | Read More | ❌ | — | — | — | non construit | à faire |
| B19 | Call to Action | ⚠️ | partiel | oui (blocs) | oui | pas d'élément unique | à faire |
| B20 | Alert | ✅ | oui | oui | oui | — | — |
| B21 | Code Highlight | ✅ | oui | oui | oui | — | — |
| B22 | Menu Anchor | ✅ | oui | oui | oui | — | — |
| B23 | Sidebar | ❌ | — | — | — | non construit | à décider |
| B24 | Template (insérer un modèle) | ✅ | oui (composants) | oui | oui | — | — |
| C01 | Accordion / Toggle / Tabs | ✅ | oui | oui | oui | — | — |
| C02 | Flip Box | ✅ | oui | oui | oui | — | — |
| C03 | Progress / Counter / Countdown / Rating | ✅ | oui | oui | oui | — | — |
| C04 | Testimonial / Carousel / Reviews | ⚠️ | partiel | oui | oui | pas de carrousel de témoignages | à faire |
| C05 | Price Table / Price List | ✅ | oui | oui | oui | — | — |
| C06 | Animated Headline | ✅ | oui | oui | oui | — | — |
| C07 | Hotspot | ✅ | oui | oui | oui | — | — |
| C08 | Social Icons / Share Buttons | ✅ | oui | oui | oui | — | — |
| C09 | Facebook / Instagram embeds | ⚠️ | partiel | oui | oui | liste blanche du contenu intégré seulement | à vérifier |
| C10 | Off-Canvas / fenêtre dans la page | ✅ | oui | oui | oui | — | — |
| C11 | Popup Builder | ➡️ | oui (module Pop-ups) | oui (existant) | oui | — | pas de doublon |
| C12 | Form (conditions, upload, e-mail, webhook…) | ➡️ | oui (module Formulaires) | oui (existant) | oui | multi-étapes / honeypot non revérifiés | à vérifier |
| C13 | Login / Register | ⚠️ | partiel | oui | oui | pas de formulaire de connexion dans la page | à faire |
| C14 | PayPal / paiement | ➡️ | oui (Stripe côté serveur) | oui (existant) | oui | — | — |
| C15 | Tooltip, Reading progress | ✅ | oui | oui | oui | — | — |
| D01 | Étiquettes dynamiques {{…}} (texte, adresse, image, repli, filtres) | ✅ 🆕 | oui | oui (serveur + Chrome) | oui | pas dans les styles CSS (fond), par sécurité | fait |
| D02 | Loop Grid / Carousel / Item (requête, filtres, tri, pagination) | ✅ 🆕 | oui (grille en boucle ; pas de carrousel) | oui (serveur + Chrome) | oui | carrousel de boucle non construit | fait |
| D03 | Posts / Portfolio / Archive Posts | ✅ 🔄 | oui | oui | oui | — | amélioré par D02 |
| D04 | Taxonomy Filter / Search Results | ✅ 🆕 | oui (filtre par catégorie + ?q=) | oui | oui | — | fait |
| D05 | Widgets d'article (titre, contenu, résumé, image, infos, navigation, auteur, commentaires) | ✅ 🆕 | oui (étiquettes + « Contenu de l'article » ; navigation / auteur / commentaires = ceux du blog, conservés) | oui | oui | — | fait |
| D06 | Breadcrumbs / Sitemap / Table of Contents | ⚠️ | partiel | oui | oui | pas de plan du site | à faire |
| D07 | Theme Builder (article, liste du blog, 404 ; en-tête / pied existants) | ⚠️ 🆕 | oui pour 3 familles + en-tête / pied | oui (serveur) | oui | pas : recherche, auteur / étiquette distincts, fiche formation, catégorie de formation | partiel |
| D08 | Conditions d'affichage | ⚠️ 🔄 | oui (13 règles + paramètre d'adresse, panier, formateur, extensible) | oui | oui | pas : page / catégorie précises, rôle autre que formateur | partiel |
| D09 | Champs personnalisés / taxonomies / données utilisateur | ❌ | — | — | — | le CMS n'a pas de modèle de champs personnalisés | hors périmètre |
| E01 | Add To Cart | ✅ | oui | oui | oui | — | — |
| E02 | Éléments de fiche produit / formation | ⚠️ 🔄 | oui en boucle ({{course.…}}) ; pas de modèle de fiche formation | oui | oui | pas de modèle « fiche formation » | partiel |
| E03 | Images / Meta / Stock / Related / Upsells / Onglets de fiche | ❌ | — | — | — | stock sans objet (accès numérique) ; reste non construit | à décider |
| E04 | Products / Categories / Shop / Archive | ✅ 🔄 | oui (boucle formations + filtre) | oui | oui | — | fait |
| E05 | Menu Cart (mini-panier) | ✅ | oui (compte + compteur du panier) | oui | oui | — | — |
| E06 | Checkout / My Account / Notice | ➡️ | oui (pages serveur) | oui (existant) | oui | — | — |
| F01 | Couleurs et typographies globales | ✅ | oui | oui | oui | — | — |
| F02 | Variables personnalisées nommées | ⚠️ | partiel | oui | oui | variables d'espacement / rayon / ombre ; pas de variables libres | à faire |
| F03 | Classes globales (créer, appliquer, mettre à jour, supprimer) | ✅ 🆕 | oui | oui (serveur + Chrome) | oui | — | fait |
| F04 | Composants réutilisables | ✅ | oui | oui | oui | surcharges de propriétés par instance non revérifiées | — |
| F05 | Copier / coller le style | ✅ | oui | oui | oui | — | — |
| F06 | Export / import de classes et variables | ❌ | — | — | — | non construit | à faire |
| F07 | Polices personnalisées (envoi) | ⚠️ | partiel | — | oui | non vérifié | à vérifier |
| G01 | Marges, bordures, ombres, filtres, transformations, opacité | ✅ | oui | oui | oui | — | — |
| G02 | Fonds : couleur, dégradé, image, vidéo, voile, survol, responsive | ✅ | oui | oui | oui | diaporama de fond non construit | — |
| G03 | Animations, transitions, défilement, parallaxe, souris, 3D | ✅ | oui | oui | oui | — | — |
| G04 | Interactions | ✅ | oui | oui | oui | — | — |
| G05 | CSS personnalisé, classes, ID, attributs | ✅ | oui | oui | oui | — | — |
| G06 | JavaScript personnalisé | ❌ | — | — | — | refusé : sécurité (domaine des comptes élèves) | documenté |
| G07 | Visibilité par écran | ✅ | oui | oui | oui | — | — |
| G08 | Barre / bouton flottants | ⚠️ | partiel | — | oui | réalisable avec une position fixe, non validé | à vérifier |
| H01 | Annuler / rétablir, versions, autosave | ✅ | oui | oui | oui | — | — |
| H02 | Copier / coller / dupliquer | ✅ | oui | oui | oui | — | — |
| H03 | Menu contextuel | ✅ | oui | oui | oui | « copier l'ID / la classe » non vérifié | — |
| H04 | Navigateur / calques | ✅ | oui | oui | oui | — | — |
| H05 | Recherche, favoris, récents | ✅ | oui | oui | oui | — | — |
| H06 | Glisser-déposer, multi-sélection | ✅ | oui | oui | oui | édition groupée non revérifiée | — |
| H07 | Modèles : page, bloc, composant ; export / import | ✅ | oui | oui | oui | — | — |
| H08 | Règles, guides, grille, magnétisme | ✅ 🆕 | oui | oui | oui | — | fait le 8 octobre |
| H09 | Panneaux Contenu / Style / Avancé | ✅ | oui | oui | oui | — | — |
| H10 | Aperçu responsive, publication | ✅ | oui | oui | oui | — | — |
| H11 | Registre d'extension (registerWidget, registerDynamicSource, registerCondition, registerTemplateType) | ⚠️ 🆕 | oui (4 sur 6) | oui | oui | registerControl et registerExtension non construits | partiel |
| H12 | Accessibilité et SEO des éléments | ✅ | oui | oui | oui | — | — |
| H13 | Édition en ligne | ✅ | oui | oui | oui | bloquée sur un texte dynamique (voulu) | — |
| H14 | IA (assistant de génération) | ❌ | — | — | — | hors périmètre | — |

## Score (calculé à partir du tableau, sans arrondi flatteur)

| Mesure | Calcul | Résultat |
|---|---|---|
| Couverture complète | ✅ / lignes identifiées = 63 / 91 | **69 %** |
| Couverture complète + autre module KOLAKISA | (✅ + ➡️) / 91 = 67 / 91 | **74 %** |
| Avec les lignes partielles comptées pour moitié | (67 + 14 / 2) / 91 | **81 %** |
| Lignes passées à ✅ ou améliorées pendant cette mission | 🆕 + 🔄 | **13** |
| Fonctionnalités opérationnelles | testées et ✅ / implémentées | voir `ELEMENTOR_IMPLEMENTATION_TEST_REPORT.md` |

Refusées volontairement (sécurité, comptées « non implémenté » ci-dessus) : JavaScript libre (G06), Lottie (B14).
Aucune ligne n'a été retirée de l'inventaire sans justification : chaque ❌ a une raison dans la colonne « Problème ».
