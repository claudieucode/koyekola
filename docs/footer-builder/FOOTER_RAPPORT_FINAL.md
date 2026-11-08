# Footer Builder — rapport final (7 novembre 2026)

Périmètre : **pied de page uniquement** (aucune autre partie du Theme Builder n'a été développée).

## Ce qui a été livré
| Livrable demandé | Où |
|---|---|
| Documentation exhaustive du footer Elementor (≈ 100 articles lus) | `ELEMENTOR_FOOTER_*.md` (7 documents, plan de ~150 tests) |
| Audit comparatif Elementor / Kolakisa | `KOLAKISA_FOOTER_*.md` (6 documents), `..._ECARTS_VS_ELEMENTOR.md` |
| Rendu unifié, balise `<footer>`, un seul pied | `FOOTER_RENDU_UNIFIE.md` (chantier A) |
| Conditions d'affichage et publication | `FOOTER_CONDITIONS_ET_PUBLICATION.md` (B) |
| Données d'entreprise + 10 widgets (migration 140) | `FOOTER_DONNEES_ET_WIDGETS.md` (C) |
| États par écran, mouvement réduit, barre du bas | `FOOTER_EDITEUR_ETATS_ET_MOUVEMENT.md` (D) |
| Révisions, retour au modèle d'origine (migration 141) | `FOOTER_REVISIONS.md` (E) |
| Catalogue des 100 modèles mis à jour | `FOOTER_CATALOGUE.md` (F) |
| Import / export / duplication | `FOOTER_IMPORT_EXPORT.md` (G) |

## Tests (exécutés sur l'état final, un fichier à la fois)
35 suites, 0 échec : footer-rendu-unifie 10, footer-conditions 46, footer-widgets-entreprise 40, footer-revisions 14, footer-import-export 13, footer-editeur-etats 18, footer-catalogue-widgets 15, isolation-proprietes 28, plus les suites existantes du Theme Builder, des widgets, des thèmes, de l'éditeur et des migrations.
Mesures Chrome du catalogue : 600 mesures (100 modèles × avec/sans données × 390/820/1280 px) : 0 débordement, 0 erreur JavaScript.

## Fonctionnalités validées
Un seul `<footer>` par page (10 puis 25 widgets, pages éditeur / blog / boutique / 404) ; conditions (tout le site, pages, articles, archives, catégories, étiquettes, recherche, 404, boutique, produit, compte client, panier, formation, visiteur connecté / rôle, exclusions) avec sélecteurs, conflits expliqués avant publication, première publication avec choix explicite ; publication et dépublication réelles ; isolation entre sites ; données d'entreprise centrales et étiquettes dynamiques ; `tel:` et `mailto:` (liste blanche) ; 10 widgets (coordonnées, téléphone, e-mail, horaires avec « ouvert maintenant », infos légales, paiements, livraison, champs libres, retour en haut, abonnement e-mail) ; états normal / survol / focus / actif par écran avec héritage ; mouvement réduit centralisé ; barre du bas ; révisions (50), restauration sans publier, comparaison, retour au modèle d'origine, archivage récupérable ; export / import sûrs en brouillon.

## Limites restantes (franches)
- Interfaces (fenêtres, sélecteurs, historique, import) vérifiées par code, tests serveur et — pour l'éditeur d'états — Chrome ; **pas essayées à la main dans un navigateur par un humain**.
- Types de contenu personnalisés : Kolakisa n'en a pas (rien à cibler).
- Condition « visiteur » : pas de combinaison ET avec une condition de page ; à exclure si un cache public est ajouté un jour.
- Pied collant : exclu volontairement (masque le contenu mobile, recouvre le focus clavier).
- Import : pas de `.zip`, images référencées seulement, numéro de formulaire à reconfigurer, pas de bibliothèque personnelle.
- Anciens pieds : pas de « modèle d'origine » (seulement ceux installés après le chantier E).
- Abonnement e-mail : absent des modèles (bloque la publication sans formulaire publié).
- Mouvement réduit : le CSS personnalisé d'un élément n'est pas neutralisé.
- Aperçu forcé d'un état : pas pour les parties de widgets. Studio IA : pas d'états par écran.
- Non couverts par la campagne : performances chiffrées (Lighthouse), lecteur d'écran réel (NVDA / VoiceOver).
- Échecs préexistants hors périmètre : cms-interface, migration 081, agent-ia, infobulles, apparence-themes, theme-builder-catalogue (20/21) et catalogue-public (4/5) (en-têtes).
- Empreinte de la migration 140/141 à ajouter au test des migrations figées après publication.

## À faire par l'utilisateur
Fusionner la PR, redéployer (hPanel), puis essayer à la main : publier un pied avec conditions, restaurer une révision, exporter / importer, régler un survol sur mobile.
