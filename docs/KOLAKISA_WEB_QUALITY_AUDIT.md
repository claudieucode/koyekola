# Kolakisa — audit de l'existant : qualité web et formats de mise en page (LOT 0)

Date : 2026-10-10. Audit du code réel avant implémentation.

| # | Capacité | État constaté | Décision |
|---|---|---|---|
| 1 | Création de page | `pages.createPage` + fenêtre « Nouvelle page » (nom, modèle, site) — fonctionnelle | Ajout du choix libre / guidé dans la même fenêtre |
| 2 | Modèles de pages | Modèles intégrés + « mes modèles » (thème conservé) | Inchangés ; le format voyage avec le thème |
| 3 | Conteneurs / Flexbox | Moteur complet (`nodes.js`, 104 propriétés) ; sections `layout` sans styles propres, enveloppe `display: contents` | Aucune modification du moteur |
| 4 | Largeur du contenu | `.lp-main { max-width: 760px }` (ou réglage de largeur du site) — il n'existait **aucun** format de page | Format = une règle CSS qui remplace cette colonne pour la page |
| 5 | Responsive | 3 écrans, `styles.{desktop,tablet,mobile}`, points de rupture par site | Réutilisé tel quel ; le format ne touche pas aux écrans |
| 6 | Rendu / aperçu | Canevas = rendu serveur réel (iframe), même CSS que la publication (`viewModel`) | Les contrôles de rendu lisent ce DOM réel |
| 7 | Publication | `publish` (contrôles `preflight`) ; thème publié = colonne `theme` | Le format est dans `theme.layout` : publié/versionné sans migration |
| 8 | SEO existant | `src/seo/webPages.js#analyze` (+ route `/seo/analyse`) : titre, description, H1, alt, liens, indexation | Réutilisé ; aucun second moteur SEO |
| 9 | Validation | `pages.normalizeContent`, `nodes.lockedWidgetChanges`, alt obligatoire des images dans le modèle | Ajout du contrôle de verrou de format au même endroit (`saveDraft`) |
| 10 | Audit navigateur | Aucun inspecteur de qualité. Mesures responsive ponctuelles (IA Kolakisa « Adapter ») | Nouvel inspecteur sur le DOM du canevas |
| 11 | IA | IA Kolakisa (opérations validées) | Informée du format ; passe par la même validation (verrou) |
| 12 | Sauvegarde | Brouillon automatique + révision (409) + versions | Inchangé |
| 13 | Verrouillage existant | Verrou par élément (`locked`) | Verrou de format distinct, appliqué côté moteur |
| 14 | Tests | `node:test`, Chrome réel (Playwright), faux serveur d'API | Utilisés |
| 15 | Causes de lenteur potentielles | Rendu complet du canevas à chaque changement (déjà optimisé : `patchCanvas`) ; `JSON.stringify` des instantanés | Inspecteur : lecture seule du DOM, aucun rendu, pause de saisie, repli progressif |

## Validateurs disponibles
Aucun validateur HTML/CSS W3C complet n'est installé. L'inspecteur fait des **contrôles structurels sur le DOM rendu** (identifiants en double, imbrication d'éléments interactifs, titres vides, langue) et le dit : ce n'est pas une validation W3C.

## Risques et réponses
- Régression de mise en page : le CSS du format n'est émis que pour les pages guidées ; pages existantes inchangées.
- Verrou contournable : appliqué dans `saveDraft` (donc éditeur, IA, API), pas seulement dans l'interface.
- Lenteur : audit continu limité à l'écran affiché, déclenché après 1,1 s sans modification, en temps mort du navigateur, avec repli si le coût dépasse 80 ms.
