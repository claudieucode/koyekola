# Publication unique — rétro-ingénierie et audit (Phase 0)

## 1. Ce que montrent les captures (comportements observés)
| Zone | Comportement |
|---|---|
| En-tête | Croix (fermer), pinceau, bouton **Publier** + roue (réglages), flèche retour, fil d'Ariane « Personnalisation ▸ Publication unique », titre. |
| Onglets | **GÉNÉRAL** / **DESIGN** (un seul actif). |
| Article Zone de titre | Ligne encadrée : libellé + interrupteur + chevron (ouvre un sous-panneau). |
| Mise en page du conteneur | 4 vignettes : globe (« par défaut du thème »), contenu cadré avec image, contenu étroit centré (sélectionné), contenu large. Une seule sélectionnée (bordure + fond pleins). |
| Style de conteneur | Segmenté : Par défaut / Ouvert / Encadré - Tout (+ aide « ? »). |
| Mise en page de colonne latérale | 4 vignettes : globe, sans colonne, colonne gauche, colonne droite. Info-bulle au survol (« Par défaut »). |
| Style de colonne latérale | Même segmenté. |
| Largeur du contenu | Segmenté Par défaut / Personnalisé ; en « Personnalisé » : libellé, bouton réinitialiser (↺), unité **px**, curseur + champ numérique (valeur 1200). |
| Ombre portée des images dans le contenu | Interrupteur. |
| Publications similaires | Titre de section + ligne encadrée (interrupteur désactivé + chevron). |
| Commentaires | Ligne encadrée active (interrupteur activé + chevron). |
| Bloc « Pro » | Bandeau de mise à niveau listant 8 capacités : boîte d'auteur avec partage social, chargement automatique des publications précédentes, navigation dans les publications, taille personnalisée des images mises en avant, temps de lecture, typographie étendue, espacement étendu, partage social. **Dans Kolakisa ces 8 capacités sont natives ; aucun bandeau de mise à niveau n'est affiché.** |
| Pied du panneau | « Masquer les contrôles » + Ordinateur / Tablette / Mobile (l'actif souligné). |
| DESIGN | « Espacement de publication » : **Extérieur** et **À l'intérieur**, chacun avec icône d'appareil, unité (px ▾), 4 champs EN HAUT / À DROITE / EN BAS / À GAUCHE et bouton de liaison 🔗. |

Références complémentaires (comportements, aucun code repris) : documentation Astra « Single Post », « Page layout settings », « Blog Pro overview ».

## 2. Audit de l'existant dans Kolakisa
| Sujet | Constat |
|---|---|
| **« Blog / Archive » dans le Customizer** | **Absent.** Le brief la décrit comme « déjà développée » : le Customizer (`services/customizer.js`) n'avait aucune rubrique « Types de publication ». Ce qui existe sous ce nom est la **bibliothèque d'archives du Theme Builder** (gabarits, `themeBuilder/catalog/archive.js`), pas des réglages. Cette phase crée donc la rubrique « Types de publication » avec **uniquement** Publication unique ; Blog/Archive n'est pas touché. |
| Customizer | Catalogue fermé de réglages (`CONTROLS`), brouillon par site (`cms_customizer_drafts`), versions, aperçu réel `?kwcustom=1` (superposition en mémoire), publication transactionnelle. Site principal = `appearance_configs` ; site = `mk_sites.settings`. |
| Rendu d'un article | `routes/blog.js renderPostPage` + `views/blog/show.ejs` : sommaire, partage, auteur, navigation, commentaires, similaires, colonne droite. Aucun réglage. Un **modèle Theme Builder « single_post »** peut remplacer l'en-tête/image/texte (il l'emporte : ses éléments `kw-authorbox`, `kw-postnav`, `kw-postcomments` évitent les doublons). |
| Commentaires | Moteur `services/comments` : réglages par site (profondeur, pagination, modération, invités, anti-spam, cookies). |
| Auteurs | `users` : nom, bio, avatar, **site web** ; pas de profils sociaux. |
| Médias | Médiathèque par site ; l'image mise en avant est `posts.cover_path`. |
| Widgets | Zone « sidebar » (Apparence → Widgets) rendue sous l'article ; la colonne latérale de la page est le bloc « populaires / récents / catégories / newsletter ». |
| Multi-sites | Un site = son hôte (`req.kwSite`) ; les articles sont rattachés par `mk_content_sites`. |

## 3. Dépendances et règles de rendu
- Les réglages vivent **par site** (`settings.singlePost`) ou **pour le principal** (`singlePost` dans la configuration d'apparence) ; `null` = aucune personnalisation = affichage d'origine.
- Priorité : défauts du moteur < défauts du thème (`tokens.pack.singlePost`) < réglages du site.
- Un modèle Theme Builder « article » actif garde la priorité sur l'en-tête qu'il remplace.
- L'aperçu et le site public utilisent **le même code** (`singlePostFor` + `show.ejs`) ; l'aperçu superpose le brouillon en mémoire.
