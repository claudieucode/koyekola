# 16 - Liens internes (Rank Math)

Date de consultation : 2026-10-29. Statuts : officiel / observation / hypothèse.

## 1. Fonctions

| Fonction | Détail | Niveau | WP | Pertinence Kolakisa |
|---|---|---|---|---|
| Link Counter | Compte liens internes, externes et entrants par article/page, visible dans les listes WP. Recomptage possible : Status & Tools > Database Tools > « Delete Internal Links Data », puis réenregistrer chaque article | La KB ne précise pas gratuit/PRO ; free-vs-pro liste « Link Report » et « Internal Linking Suggestions » ; icônes illisibles : lacune | Oui (hooks d'enregistrement) | Élevée : table `links` alimentée à l'enregistrement |
| Suggestions de liens internes (éditeur) | Listées sur free-vs-pro ; la FAQ de la page indique que le linking IA avancé exige PRO avec Content AI, ce qui contredit la liste gratuite (observation) | Ambigu | Oui | Élevée (recherche par mots-clés ou embeddings) |
| Pillar content | « Choose Pillar Posts & Pages » (free-vs-pro) | Listé | Oui | Moyenne |
| Rapport de liens, détecteur de liens cassés, détecteur de pages orphelines | Listés sur free-vs-pro ; MCP : le rapport de liens de base (comptes, articles sans liens) est gratuit, l'audit complet est PRO | Mixte | Oui | Élevée |
| AI Link Genius | Module PRO (officiel : « disponible exclusivement dans Rank Math PRO ») | PRO | Oui | Voir 3 |

## 2. Audit de liens (AI Link Genius, officiel, `kb/how-to-do-link-audit/`)

Rapporte : liens cassés (4xx/5xx, filtrables par code), liens redirigés (3xx), liens internes nofollow, liens bloqués par robots.txt, articles orphelins (zéro lien entrant), liens entrants avec source et ancre.
- Étape « Crawl » (statuts HTTP) = PRO. Options : tous les liens, non vérifiés, seulement erreurs ; type interne seul.
- Corrections manuelles (redirections : éditer l'ancre ; nofollow : retirer l'attribut).
- Non précisés : fréquence, plafond de taille, durée.

## 3. AI Link Genius : fonctions documentées

- **Keyword Maps** (`kb/how-to-automate-internal-linking/`) : nom (ancre), URL cible, description interne, variations (avec génération IA), max de liens par article (défaut 3), sensibilité à la casse, auto-link à la publication, activation. Flux : créer, « Preview & execute », décocher, appliquer ; historique et **rollback** par lien.
- **Mise à jour en masse** (`kb/how-to-update-links-in-bulk/`) : rechercher/remplacer ancres et URL, filtres (interne/externe, nofollow, texte/image, type de contenu, date), correspondance exacte/contient/regex/mot entier/casse, domaine ou URL partielle, aperçu, historique, rollback.
- **Suppression de liens** (article `removing-links-using-ai-link-genius` : listé, non lu).
- **Articles associés** : bloc et shortcode (`customize-related-posts` : listé, non lu).
- Command Center > Generate Link : suggère des liens internes à partir d'une ancre sélectionnée (Content AI).
- Limites mensuelles : suggestions de liens 100/500/1 000 ; opportunités de liens 50/200/1 000 ; articles associés 50/200/1 000 (Starter/Creator/Expert, voir 15).

## 4. Pertinence pour Kolakisa

- Natif et peu coûteux : table des liens (source, cible, ancre, nofollow, statut HTTP, type) alimentée à l'enregistrement et par un crawl planifié ; détection d'orphelines par requête SQL ; liens cassés par vérification HEAD/GET avec limitation de débit (hypothèse de conception).
- Remplacement en masse et keyword maps : faisables avec aperçu et rollback (stockage des diffs avant/après).
- Suggestions : recherche plein texte SQLite FTS5 avant tout embedding (hypothèse).
- Multi-sites : isoler par `site_id`, ne jamais lier ou suggérer entre sites sans choix explicite.
- Risques : sur-optimisation d'ancres, modification de contenu publié sans validation, boucles de redirection.
- Critère de validation : aucune écriture sans prévisualisation ; rollback vérifié ; zéro faux orphelin sur un jeu de test.

## 5. Sources

| URL | Date | Statut |
|---|---|---|
| https://rankmath.com/kb/how-to-do-link-audit/ | 2026-10-29 | officiel |
| https://rankmath.com/kb/how-to-automate-internal-linking/ | 2026-10-29 | officiel |
| https://rankmath.com/kb/how-to-update-links-in-bulk/ | 2026-10-29 | officiel |
| https://rankmath.com/kb/link-counter/ | 2026-10-29 | officiel |
| https://rankmath.com/kb/mcp-tools/ | 2026-10-29 | officiel |
| https://rankmath.com/free-vs-pro/ | 2026-10-29 | officiel (icônes illisibles) |
| https://rankmath.com/kb/rank-math-ai-rebranding/ | 2026-10-29 | officiel |
| https://rankmath.com/kb/ (liste de catégories : AI Link Genius, 9 articles) | 2026-10-29 | officiel |

## 6. Lacunes

- `kb/internal-linking/` : 404.
- Niveau gratuit/PRO exact du Link Counter, des suggestions et des orphelines : ambigu.
- Articles non lus : suppression de liens, articles associés (personnalisation), 4 autres articles Link Genius non listés.
- Algorithme de suggestion : non documenté.
