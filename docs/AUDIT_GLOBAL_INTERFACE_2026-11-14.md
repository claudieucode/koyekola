# Audit global de l'interface — campagne du 14/11/2026

Suivi honnête : ce qui est corrigé (avec preuve), ce qui reste à faire. Les captures fournies sont des exemples, pas le périmètre.

## Corrigé dans ce lot

| Prio | Écran / composant | Défaut | Correction | Preuve |
|---|---|---|---|---|
| P1 | Toutes les fenêtres `.mk-dialog` (Redirections, etc.) | Fenêtre collée en haut à gauche (marge automatique écrasée) | `.mk-dialog:modal { position: fixed; inset: 0; margin: auto }` dans `marketing.css`, composant partagé | `tests/_outils/modal-check.js` : marges 440/440 (1440 px) et 8/8 (390 px) |
| P1 | Paramètres → Confidentialité → Guide | Accordéons saccadés (hauteur animée = mise en page à chaque image) | Bascule instantanée + fondu/glissement `opacity`/`transform` | `tests/_outils/acc-bench.js` : recalculs de mise en page 11 → 1 |
| P1 | Mailchimp | 14 onglets horizontaux sur 2 lignes | Barre latérale groupée (Connexion, Tableau de bord, Audience, Campagnes, Création, Automatisation, Analyse, Intégrations, Gestion du compte), repliable, responsive ; mêmes onglets, mêmes ids | `tests/mailchimp-navigateur.test.js` 21/21 (1 échec isolé non reproductible sous charge) |
| P2 | Analytics → Rapports comparatifs | Boutons d'étiquettes collés, panneau « Rapports enregistrés » sans marge | Zone d'actions séparée (filet, marges 16/24), champs alignés | captures |
| P2 | Marketing → Événements | Deux boutons empilés sans espace | Groupe de boutons avec espacement 12 px | captures |
| P2 | Réseaux sociaux → Sites autorisés | Interrupteurs empilés, « Enregistrer » collé | Ligne flex avec espacement | captures |
| P2 | Interrupteurs (`checkbox-row`) | État éteint très pâle | Piste plus contrastée | `kola-compose.css` |
| P1 | Automatisations → Parcours tout prêts | Cartes sans aperçu réel | Miniature du vrai e-mail (HTML rendu avec données d'exemple, cadre isolé sans script, chargement différé) + aperçu ordinateur/mobile sur la fiche | `tests/marketing-parcours-bibliotheque.test.js` 40/40, captures |

## Reste à faire (non traité dans ce lot)

- Réglages d'envoi (curseurs de limites, fuseau horaire en section propre, boutons d'enregistrement) : contrôles de présentation à reprendre un par un.
- Domaines (tableaux, détails de vérification) et Conformité : audit visuel complet non fait.
- Rapports comparatifs : regroupement des filtres en familles.
- Redirections : validation boucles/chaînes/conflits à revérifier de bout en bout (formulaire seulement recentré).
- Fiche d'un parcours : conditions et délais déjà présents ; pas de rendu « miniature » pour les parcours SMS seuls.
- Audit visuel des autres modules (Pages, Articles, Médias, Boutique, Formations, SEO, Tests A/B, Blog Studio, éditeurs) : à faire écran par écran.
- Aucun composant `Drawer`/`Toast`/`DataTable` nouveau créé : les composants partagés existants (`mk-dialog`, `mk-table`, `btn`) ont été corrigés à la source.

## Préexistant (non causé par ce lot)

- `cms-01-navigation`, `site-menu-c1`, `site-menu-p1a`, `menu-site-inventaire`, `extensions-performance` (temps de chargement) et plusieurs tests navigateur de Confidentialité échouent par saturation de la machine de test, sur `main` aussi.
