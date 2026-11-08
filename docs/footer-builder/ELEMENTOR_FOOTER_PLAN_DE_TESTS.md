# Plan de tests du Footer Builder Kolakisa

Chaque ligne = un test à écrire. Identifiant `FT-xxx`. Colonne « Réf. » = point de référence Elementor ([C] confirmé, [N] non vérifiable, [K] règle Kolakisa). Les tests marqués **auto** sont automatisables (serveur/DOM) ; **manuel** = à regarder dans un navigateur ; **a11y** = accessibilité. Priorité : P1 bloquant, P2 important, P3 confort.

## A. Cycle de vie du modèle de pied
| Id | Test | Réf. | Type | P |
|---|---|---|---|---|
| FT-001 | Créer un pied vierge : il apparaît dans la liste en brouillon, sans conditions | [C] | auto | P1 |
| FT-002 | Créer un pied depuis un modèle de la bibliothèque : copie indépendante (modifier la copie ne change pas le catalogue) | [K] | auto | P1 |
| FT-003 | Renommer : nom mis à jour, ancien nom absent, nom vide refusé, nom très long tronqué | [C] | auto | P2 |
| FT-004 | Dupliquer : copie en brouillon, sans conditions, nom « copie » | [N]/[K] | auto | P2 |
| FT-005 | Archiver / corbeille puis restaurer : le pied revient en brouillon | [C]/[K] | auto | P2 |
| FT-006 | Supprimer un pied publié : confirmation obligatoire ; le pied du thème/par défaut revient | [C] | auto | P1 |
| FT-007 | Publier sans condition : refusé ou conditions « tout le site » proposées | [C] | auto | P1 |
| FT-008 | Brouillon jamais visible sur le site public | [C] | auto | P1 |
| FT-009 | Dépublier : le pied disparaît immédiatement du public, contenu conservé | [N]/[K] | auto | P1 |
| FT-010 | Brouillon de travail séparé du publié : modifier sans publier ne change pas le public | [K] | auto | P1 |
| FT-011 | Enregistrement automatique : après une interruption, le brouillon de travail est récupérable | [N]/[K] | manuel | P2 |

## B. Conditions d'affichage
| Id | Test | Réf. | Type | P |
|---|---|---|---|---|
| FT-020 | « Tout le site » : le pied s'affiche sur accueil, page, article, archive, recherche, 404 | [C] | auto | P1 |
| FT-021 | Inclure « Page d'accueil » seulement | [C] | auto | P1 |
| FT-022 | Inclure « Pages » (toutes) / une page précise ; autres pages sans ce pied | [C] | auto | P1 |
| FT-023 | Inclure « Articles » : tous, par catégorie, par catégorie enfant, par étiquette, par auteur | [C] | auto | P1 |
| FT-024 | Archives : blog, catégorie, étiquette, auteur, date (si dispo) | [C] | auto | P2 |
| FT-025 | Résultats de recherche | [C] | auto | P2 |
| FT-026 | Page 404 | [C] | auto | P1 |
| FT-027 | Boutique : page boutique, catégorie produit, fiche produit, étiquette produit | [C] | auto | P2 |
| FT-028 | Type de contenu personnalisé : si pris en charge, tous / un seul ; sinon option absente de l'interface | [N]/[K] | auto | P3 |
| FT-029 | Exclure une page : le pied ne s'y affiche pas même si « tout le site » est inclus | [C] | auto | P1 |
| FT-030 | Inclusion + exclusion qui se contredisent : l'exclusion l'emporte | [K] | auto | P1 |
| FT-031 | Plusieurs conditions (catégorie A OU catégorie B) | [C] | auto | P2 |
| FT-032 | Enfant direct / tout descendant d'une page | [C] | auto | P3 |
| FT-033 | Deux pieds publiés : le plus précis gagne ; à précision égale, le plus récent ; à égalité parfaite, publication refusée | [K] | auto | P1 |
| FT-034 | Un seul pied rendu par page (jamais deux `<footer>` de modèle) | [C]/[K] | auto | P1 |
| FT-035 | Avertissement de conflit affiché à la publication | [C] | manuel | P2 |
| FT-036 | Suppression de toutes les conditions : le pied devient brouillon (ou publication refusée) | [C]/[N] | auto | P2 |
| FT-037 | Aucune condition ne correspond : aucun pied de modèle, pied par défaut du site (jamais une page vide) | [K] | auto | P1 |
| FT-038 | Mise en page « sans en-tête ni pied » (équivalent Canvas) : aucun pied | [C] | auto | P2 |
| FT-039 | Page protégée par mot de passe / privée : le pied reste cohérent | [N] | auto | P3 |

## C. Rendu public et structure
| Id | Test | Réf. | Type | P |
|---|---|---|---|---|
| FT-050 | Le pied est dans une balise `footer` (landmark `contentinfo`) | [C] | auto/a11y | P1 |
| FT-051 | Pied présent exactement une fois dans le HTML | [K] | auto | P1 |
| FT-052 | HTML sans erreur de balises (div non fermée) quand en-tête publié mais pas pied, et inversement | [C] | auto | P1 |
| FT-053 | Pied après le contenu principal et avant les scripts de fin | [O] | auto | P2 |
| FT-054 | Contenu volumineux de la page : le pied reste en bas (page courte : pied en bas de la fenêtre ou juste sous le contenu selon le choix de design) | [O] | manuel | P2 |
| FT-055 | Colonnes : retour à la ligne automatique, aucune colonne écrasée sous la largeur minimale | [K] | manuel | P1 |
| FT-056 | Bande de copyright distincte, pleine largeur, centrée | [C] | manuel | P2 |
| FT-057 | Année du copyright = année courante ; test avec date simulée au 31 déc. / 1er janv. | [C] | auto | P2 |
| FT-058 | Nom du site changé : le pied suit (titre du site, logo) | [C] | auto | P1 |
| FT-059 | Logo supprimé : repli sur le nom du site, aucune image cassée | [C]/[K] | auto | P1 |
| FT-060 | Menu du pied : menu affecté à l'emplacement affiché ; emplacement vide → pas de liste vide ni de lien inventé | [K] | auto | P1 |

## D. Tests par widget (un bloc par widget, mêmes cas à chaque fois)
Pour **chaque** widget de la liste (Image, Site Logo, Site Title, Heading, Text Editor, Nav Menu, Icon List, Menu Anchor, Search, Button, Divider, Spacer, Image Box, Icon, Icon Box, Testimonial, Counter, Progress, Tabs, Accordion, Toggle, Alert, Video, Social Icons, Share, Formulaire, HTML, Shortcode, Carte, Menu Cart, My Account, Catégories produit, Liste d'articles) :
1. **Ajout** au pied, enregistrement, rendu public identique à l'aperçu.
2. **Chaque réglage de Contenu** un à un (valeur normale, valeur vide, valeur très longue, caractères spéciaux et HTML échappé).
3. **Chaque réglage de Style** un à un (couleur, typographie, taille, espacement, bordure, rayon, ombre) : valeur appliquée dans le CSS publié.
4. **États** Normal / Survol / Actif / Focus : le style change, la durée de transition est respectée.
5. **Responsive** : réglage par appareil + héritage (voir E).
6. **Masquage** par appareil.
7. **Animation d'entrée** (voir G).
8. **Accessibilité** : voir H.
9. **Suppression / duplication / déplacement** du widget.

Cas spécifiques :
| Id | Test | Réf. |
|---|---|---|
| FT-100 | Image : sans texte alternatif → alerte à l'édition ; lien externe : nouvelle fenêtre + `rel` sécurisé (nofollow si choisi) | [C] |
| FT-101 | Heading : changement de balise (h2…p) sans changement de style ; interdit H1 dans un pied (avertissement) | [C]/[O] |
| FT-102 | Text Editor : colonnes, lettrine ; contenu HTML nettoyé (pas de script) | [C]/[K] |
| FT-103 | Nav Menu : horizontal/vertical/déroulant ; point de rupture ; sous-menus ; élément actif ; menu absent | [C] |
| FT-104 | Icon List : disposition verticale/en ligne, séparateur, lien sur toute la ligne ou en ligne | [C] |
| FT-105 | Menu Anchor : lien `#ancre` défile jusqu'à l'ancre ; ancre sur une autre page : comportement documenté | [C] |
| FT-106 | Search : trois habillages ; recherche vide ; recherche avec caractères spéciaux ; focus visible | [C] |
| FT-107 | Button : lien interne/externe, icône avant/après, ID unique ; clavier Entrée/Espace | [C] |
| FT-108 | Divider/Spacer : valeurs 0 et extrêmes sans débordement | [C] |
| FT-109 | Counter : nombres de départ/fin, séparateur, durée ; reste lisible sans JavaScript | [C]/[O] |
| FT-110 | Accordion/Toggle/Tabs : ouverture/fermeture souris et clavier, état actif, un seul ouvert vs plusieurs | [C] |
| FT-111 | Social Icons : URL vide → icône non affichée ; couleur officielle ; libellé accessible par icône | [C]/[N] |
| FT-112 | Formulaire d'abonnement : lié à un formulaire réel ; champ requis ; e-mail invalide ; envoi réussi ; erreur serveur ; double envoi ; anti-robot ; consentement RGPD ; isolation par site | [C]/[K] |
| FT-113 | Carte : adresse valide, adresse inconnue (message neutre), respect du consentement tiers | [C]/[K] |
| FT-114 | Vidéo : lecture auto bloquée par défaut ; image de secours ; chargement différé | [C] |
| FT-115 | HTML/Shortcode : désactivé ou assaini ; jamais de script d'un contributeur non admin | [C]/[K] |
| FT-116 | Menu Cart : panier vide/rempli, indicateur, sous-total, ouverture clic/survol ; boutique inactive → widget absent | [C] |
| FT-117 | My Account : visiteur anonyme / connecté | [C] |
| FT-118 | Catégories produit : source, masquer vides, ordre | [C] |
| FT-119 | Étiquettes dynamiques (titre, slogan, date, URL du site) : valeur de repli ; avant/après | [C] |

## E. Responsive
| Id | Test | Réf. |
|---|---|---|
| FT-130 | Trois appareils : ordinateur > 1024, tablette 767–1024, mobile ≤ 767 (largeurs 1440, 1024, 1023, 768, 767, 414, 375, 320) | [C] |
| FT-131 | Héritage : valeur ordinateur appliquée à tablette et mobile si non redéfinie | [C] |
| FT-132 | Redéfinir sur tablette ne change pas l'ordinateur ; redéfinir sur mobile ne change pas la tablette | [C] |
| FT-133 | Valeur héritée affichée grisée dans l'éditeur | [C] |
| FT-134 | Direction ligne→colonne par appareil | [C] |
| FT-135 | Ordre des éléments par appareil | [C] |
| FT-136 | Masquer par appareil (ordinateur/tablette/mobile) ; pied entier masqué par erreur : avertissement | [C] |
| FT-137 | Taille de typographie par appareil | [C] |
| FT-138 | Point de rupture personnalisé (modifier 1024/767 ; ajouter un point) si fonction retenue | [C] |
| FT-139 | Aucun défilement horizontal de la page à 320, 375, 390, 414, 768, 820, 1024 px | [K] |
| FT-140 | Orientation portrait/paysage ; zoom texte 200 % | [O] |
| FT-141 | Nav Menu : bascule vers menu déroulant au bon point de rupture | [C] |

## F. Style du conteneur
| Id | Test | Réf. |
|---|---|---|
| FT-150 | Boxed vs pleine largeur ; largeur px/%/vw | [C] |
| FT-151 | Hauteur minimale px/vh | [C] |
| FT-152 | Direction, justification, alignement, écart, wrap, alignement du contenu | [C] |
| FT-153 | Débordement : défaut/masqué/auto | [C] |
| FT-154 | Arrière-plan : couleur, dégradé (linéaire/radial, angle), image (position/taille), vidéo (+ image de secours), diaporama ; superposition + opacité | [C] |
| FT-155 | Contraste texte/fond ≥ 4,5:1 (3:1 grand texte) pour chaque modèle de la bibliothèque | [O] |
| FT-156 | Bordure, rayon, ombre (extérieure/intérieure, plusieurs couches) | [C] |
| FT-157 | Séparateur de forme haut/bas, retournement, devant | [C] |
| FT-158 | Position absolue/fixe/sticky : ne recouvre jamais le contenu essentiel ni les liens ; z-index | [C] |
| FT-159 | Filtres, opacité, transformations : valeurs extrêmes | [C] |
| FT-160 | ID et classes CSS : caractères interdits refusés (`#`, `.`, espaces) | [C] |
| FT-161 | CSS personnalisé (si offert) : sélecteur limité à l'élément, aucune fuite hors du pied, pas de `@import`/URL externes | [C]/[K] |

## G. Animations et mouvement
| Id | Test | Réf. |
|---|---|---|
| FT-170 | Animation d'entrée : se déclenche une fois à l'arrivée dans la fenêtre ; « aucune » par appareil | [C] |
| FT-171 | **prefers-reduced-motion : reduce** → aucune animation d'entrée, de défilement, de souris, de compteur, de diaporama, de survol animé ; contenu visible tout de suite | [C]/[K] |
| FT-172 | Contenu visible sans JavaScript (pas d'opacité 0 permanente) | [O] |
| FT-173 | Effets de défilement / souris : désactivés sur les appareils non cochés | [C] |
| FT-174 | Sticky : décalage, appareils, ne masque pas le pied | [C] |
| FT-175 | Pas de décalage de mise en page (CLS) provoqué par les animations | [O] |
| FT-176 | Durée de transition de survol respectée | [C] |

## H. Accessibilité
| Id | Test | Réf. |
|---|---|---|
| FT-180 | Landmark `contentinfo` unique ; nom accessible si plusieurs `nav` dans le pied (« Navigation du pied de page ») | [C]/[O] |
| FT-181 | Ordre de tabulation = ordre visuel (y compris après changement d'ordre responsive) | [O] |
| FT-182 | Focus visible sur liens, boutons, champs, icônes | [C] (état Focus)/[O] |
| FT-183 | Lecteur d'écran : icônes sociales avec nom (« Facebook »), pas « lien » seul | [N] |
| FT-184 | Formulaire : libellés associés, messages d'erreur annoncés, champ requis indiqué | [C]/[N] |
| FT-185 | Accordéon/onglets : états ouvert/fermé annoncés, flèches clavier pour les onglets | [N] |
| FT-186 | Liens : texte explicite, nouvelle fenêtre signalée | [O] |
| FT-187 | Hiérarchie des titres : pas de saut ; titres de colonnes cohérents | [O] |
| FT-188 | Zoom 200 % et texte agrandi sans perte de contenu | [O] |
| FT-189 | Pas de piège clavier (menu déroulant, panneau hors-écran) | [O] |

## I. Isolation multisite, sécurité, droits
| Id | Test | Réf. |
|---|---|---|
| FT-200 | Un pied du site A n'apparaît jamais sur le site B (domaines différents, même identifiant de modèle) | [K] |
| FT-201 | Un utilisateur du site A ne peut ni lire, ni modifier, ni publier un pied du site B (API et pages) | [K] |
| FT-202 | Menu, formulaire, catégories, articles, produits cités dans le pied sont ceux du site courant | [K] |
| FT-203 | Export JSON : aucun identifiant de site, utilisateur, clé, adresse e-mail | [K] |
| FT-204 | Import JSON : schéma validé, taille maximale, champs inconnus ignorés, code exécutable rejeté, fichier d'un autre site accepté en brouillon sans conditions | [K]/[N] |
| FT-205 | Droits : rôle sans droit d'édition ne voit pas le bouton Publier | [K] |
| FT-206 | Échappement : titre/texte contenant `<script>` ou guillemets s'affichent comme texte | [K] |
| FT-207 | Liens `javascript:` refusés | [K] |
| FT-208 | Page publique sans authentification ne fuit aucune donnée de brouillon | [K] |

## J. Performance
| Id | Test | Réf. |
|---|---|---|
| FT-220 | Poids HTML/CSS du pied < budget (à fixer, ex. 60 Ko HTML, 50 Ko CSS) pour chaque modèle | [K] |
| FT-221 | Profondeur d'imbrication limitée | [C] (recommandation officielle) |
| FT-222 | Images en chargement différé, dimensions déclarées (pas de saut) | [O] |
| FT-223 | Vidéo/carte/script tiers : chargés seulement à l'interaction ou au défilement | [C] (lazy load vidéo) |
| FT-224 | Caches : après publication, la nouvelle version s'affiche (cache invalidé) ; cache par site | [C]/[K] |
| FT-225 | Rendu de 100 modèles de la bibliothèque sans erreur ni avertissement console | [K] |
| FT-226 | Temps de rendu serveur du pied avec 50 liens, 10 colonnes | [K] |

## K. Révisions, import/export, bibliothèque
| Id | Test | Réf. |
|---|---|---|
| FT-240 | Une révision créée à chaque enregistrement/publication ; liste ordonnée | [C] |
| FT-241 | Restaurer une révision : le brouillon de travail change, le public ne change qu'après publication | [C]/[K] |
| FT-242 | Plafond de révisions (ex. 25) : la plus ancienne disparaît | [C] |
| FT-243 | Annuler / rétablir (Ctrl/Cmd+Z, +Maj) dans l'éditeur | [C] |
| FT-244 | Export puis import dans le même site et dans un autre : design identique | [C] |
| FT-245 | Bibliothèque : recherche, favori, insertion sans perdre le contenu existant (confirmation) | [C] |
| FT-246 | Les 100 modèles se chargent, se sélectionnent, s'enregistrent | [K] |

## L. Cas limites
Texte de 10 000 caractères ; 0 lien ; 200 liens ; langue arabe/hébreu (droite-gauche) ; emoji ; URL très longues ; image 30 Mo refusée ; connexion lente ; JavaScript désactivé ; cookies bloqués ; navigateur ancien ; impression de la page (le pied s'imprime proprement) ; deux utilisateurs éditent le même pied en même temps (avertissement/dernier gagne documenté) ; coupure réseau pendant la publication (pas de pied à moitié publié) ; heure du serveur ≠ heure du visiteur.
