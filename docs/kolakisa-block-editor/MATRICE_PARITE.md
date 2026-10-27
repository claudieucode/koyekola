# Matrice de parité — éditeur d'articles Kolakisa vs Gutenberg (WordPress 7.1.3 / plugin 24.2.0)

Statuts : COMPLET (testé) · PARTIEL · VISUEL SEULEMENT · ABSENT · BLOQUÉ · NON APPLICABLE · À VÉRIFIER.
« Preuve » = ce que l'audit du 2026-10-27 a établi (statique). **Aucune ligne n'est COMPLET sur la seule inspection** : seules les lignes couvertes par un test exécuté le sont. Une inspection de code sans test = PARTIEL ou À VÉRIFIER.
Sources de référence : `INVENTAIRE_BLOCS.md`, `INVENTAIRE_INTERFACE.md`, `REGLAGES_ET_TRANSFORMATIONS.md`, `API_ET_EXTENSIBILITE.md`, `PERSISTANCE_ET_COMPATIBILITE.md`. Abréviations de fichiers : BE = `src/editor/blog-editor.js`.

## A. Blocs (registre officiel : 120 `block.json`, dont blocs système)

| Famille Gutenberg | Équivalent Kolakisa | Statut initial | Remarque / écart | Test d'acceptation |
|---|---|---|---|---|
| core/paragraph, heading | StarterKit | PARTIEL | pas d'ancre ni de classe CSS ; pas de couleur de bloc ni de lettrine | création, attributs, aller-retour HTML |
| core/list, list-item | bulletList/orderedList/listItem | PARTIEL | pas de `reversed`/`start` à vérifier | à vérifier |
| core/quote, pullquote | blockquote + `pullquote` | PARTIEL | citation en exergue = attribut, pas bloc distinct | |
| core/code, preformatted, verse | codeBlock ; préformaté/verset | PARTIEL / ABSENT | préformaté et verset absents | |
| core/table | TableKit | PARTIEL | pas de légende, pas de pied de tableau, largeur fixe | |
| core/separator | horizontalRule | PARTIEL | pas de variantes (point, large) | |
| core/more, nextpage | `kbPageBreak` | PARTIEL | « Lire la suite » absent | |
| core/html (HTML personnalisé) | — | ABSENT | volontaire (sécurité, PB-13) ; à décider : réservé aux administrateurs | |
| core/freeform (Classique) | — | NON APPLICABLE | pas d'éditeur TinyMCE ; Markdown hérité converti | |
| core/image | `kbImage` | PARTIEL | légende/alt/lien/ratio/largeur OK ; pas de `srcset` ; 33/66 % hors sélecteur | |
| core/gallery | `kbGallery` | PARTIEL | colonnes 2-4, espacement ; pas de recadrage ni lien par image | |
| core/audio, video | `kbAudio`, `kbVideo` | PARTIEL | marqueur + lecteur serveur ; pas de sous-titres, `preload` | |
| core/file | — | ABSENT | | |
| core/cover, media-text | — | ABSENT | | |
| core/embed (33 fournisseurs) | `kbEmbed` | PARTIEL | liste blanche d'URL côté serveur (à inventorier) | |
| core/group | `kbGroup` | PARTIEL | fond 5 teintes, marges, largeur, bordure ; pas de Row/Stack/Grid | |
| core/columns, column | `kbColumns`, `kbColumn` | PARTIEL | 2-4 colonnes, présets, empilement ; largeur de colonne libre absente | |
| core/buttons, button | `kbButtons`, `kbButton` | PARTIEL | couleurs, taille, coins, largeur ; pas de dégradé/ombre | |
| core/spacer | `kbSpacer` | PARTIEL | 4 tailles + mobile ; pas de hauteur libre | |
| core/details | `kbAccordion` | PARTIEL | toujours ouvert dans l'éditeur | |
| Blocs spécifiques Kolakisa (encadré, CTA, FAQ, étapes, comparaison, formation, newsletter) | natifs | COMPLET fonctionnellement côté serveur (sanitisation/rendu testés) ; côté éditeur non testé en navigateur → PARTIEL | sans équivalent Gutenberg | |
| Blocs dynamiques de requête (query, post-*, navigation, comments…) | — | NON APPLICABLE | dépendent d'un thème bloc/éditeur de site ; Kolakisa rend le blog côté serveur (EJS) | |
| core/block (motif synchronisé) | `kbReusable` | PARTIEL | synchronisé + copie OK ; **pas de site/organisation (D7)**, édition globale sans historique (D6/D7) | |
| core/missing (bloc inconnu) | — | ABSENT | un bloc inconnu perd sa classe et est aplati (D11) | fixture de bloc inconnu → conservé |

## B. Interface et commandes

| Fonction Gutenberg | Statut Kolakisa | Preuve | Test d'acceptation |
|---|---|---|---|
| Barre supérieure, état d'enregistrement | PARTIEL | BE:2566 ; D1 corrigé (frappes pendant l'envoi) | test navigateur à écrire |
| Annuler/Rétablir (boutons désactivables) | PARTIEL | pas d'état `disabled` en mode Blocs | |
| Inserteur global + recherche + récents + favoris | PARTIEL | 44 blocs, recherche OK ; pas de glisser depuis l'inserteur ni d'aperçu | |
| Inserteur contextuel / « / » | PARTIEL | plafond 6/8 résultats | |
| Barre d'outils du bloc, déplacer, options | PARTIEL | OK sauf transformations et styles | |
| Transformer un bloc en un autre | PARTIEL | texte seulement (paragraphe/titres/listes/citation/code) | table de conversions (voir REGLAGES §3.2, « mémoire » à confirmer) |
| Dupliquer, supprimer, insérer avant/après | PARTIEL | OK ; Ctrl+Alt+T/Y absents | |
| Copier/couper/coller blocs | PARTIEL | presse-papiers interne + HTML | |
| **Grouper / Dégrouper** | ABSENT | | grouper 2 blocs → `kbGroup` ; dégrouper |
| **Copier/coller les styles** | ABSENT | | |
| Verrouillage | PARTIEL | niveau 1 seulement, hors historique | verrou sur blocs imbriqués |
| Vue en liste | PARTIEL | hiérarchie, masquer, corbeille ; sans glisser-déposer ni multi-sélection | |
| Plan du document | COMPLET fonctionnellement (non testé en navigateur) → PARTIEL | | |
| Sélection multiple de blocs | ABSENT | | |
| Glisser-déposer de blocs | PARTIEL | par la poignée, dans colonnes/groupes ; pas depuis l'inserteur/la liste | |
| Palette de commandes | PARTIEL | pas de commandes de bloc | |
| Raccourcis clavier (fenêtre d'aide) | PARTIEL | fenêtre statique ; 6+ raccourcis Gutenberg absents | |
| Modes : éditeur de code, concentration, barre fixe | PARTIEL | concentration ≠ Spotlight | |
| Plein écran en mode Blocs | ABSENT | | |
| Aperçu par appareil | PARTIEL | modale iframe, exige un article enregistré | |
| Recherche/remplacement | COMPLET (fonction propre à Kolakisa) → à tester | | |
| Mode Document, IA, espace SEO, corbeille de blocs | SANS ÉQUIVALENT | extensions propres au produit | non-régression |

## C. Réglages de bloc (block supports)

| Support Gutenberg | Statut | Remarque |
|---|---|---|
| color (texte, fond, lien, dégradé) | PARTIEL | marks de texte seulement ; couleurs libres sur Bouton ; pas de couleur de fond générique |
| typography (taille, police, interligne, graisse, casse) | PARTIEL | marks ; 4 tailles ; pas d'interligne ni de graisse par bloc |
| spacing (marge, padding, gap) | PARTIEL | Groupe/Colonnes/Espaceur seulement |
| dimensions / position | ABSENT | |
| border / shadow | PARTIEL | Bouton, Groupe |
| anchor (ancre HTML) | ABSENT | cible : attribut `id` assaini |
| customClassName | ABSENT | cible : classes `kb-x-*` sûres, liste blanche |
| align (large/pleine largeur) | PARTIEL | Image, Groupe |
| visibilité par appareil | ABSENT | masquage global seulement |
| Styles de bloc / variations | ABSENT | |
| Dépendance à `theme.json` | NON APPLICABLE | Kolakisa : jetons du site (`mk_sites.tokens`) |

## D. Document, publication, persistance

| Fonction | Statut | Défaut lié | Test |
|---|---|---|---|
| Brouillon / publication / planification | PARTIEL | D12 (promotion à la requête, sans révision ni recontrôle) | |
| Autosave | PARTIEL → **corrigé (D2) et testé** | D2 | `editeur-blocs-p0-integrite` |
| Détection modifications non enregistrées | PARTIEL → **corrigé (D1), test source seulement** ; test navigateur à écrire | D1 | |
| Conflits de modification | PARTIEL | D3 (facultatif, à la seconde) | |
| Création de brouillon automatique dans le bon site | **corrigé (D4) et testé** | D4 | |
| Doublon d'article autosave/save | À CORRIGER | D5 | |
| Révisions + restauration | PARTIEL | D10 (non re-sanitisée) | |
| Isolation multi-sites (médias, réutilisables, formateur) | PARTIEL | D7, D8, D9 | |
| Blocs inconnus / perte silencieuse | PARTIEL | D11 | |
| Image mise en avant, extrait, catégories, étiquettes, auteur, permalien | COMPLET fonctionnellement (testé côté serveur) | | existants |
| Modèles de page/article, boîtes méta | ABSENT (limite documentée ARTICLES-02) | | |
| Commentaires ouverts/fermés par article | ABSENT côté éditeur (documenté) | | |

## E. API / extensibilité

| Fonction | Statut | Remarque |
|---|---|---|
| Registre central de blocs (nom, attributs, rendu, transformations) | ABSENT | les blocs sont des nœuds Tiptap + liste blanche de sanitisation séparée (deux sources de vérité) |
| API d'extension de blocs, permissions, compatibilité de versions | ABSENT | |
| Dépréciations / migrations | ABSENT | |
| Filtres/hooks, SlotFill (panneaux additionnels) | NON APPLICABLE tel quel | architecture native cible dans `ARCHITECTURE_CIBLE.md` (à écrire) |

## F. Accessibilité, i18n, performance

À VÉRIFIER : aucun test d'accessibilité clavier/lecteur d'écran n'existe pour l'éditeur de blocs ; interface entièrement en français (pas de couche i18n) ; éditeur mesuré à 1,3-2,6 s et 1,2-1,8 Mo (audit palier 23).

Cette matrice sera mise à jour (colonne « statut final ») à chaque jalon, avec les preuves de tests.
