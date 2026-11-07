# 14 - Stratégie de test d'un header (recherche Elementor, pour Kolakisa)

Légende : [NATIF] [PRO] [EXPÉRIMENTAL] [EXTENSION] ; « NON VÉRIFIÉ » = non confirmé. Elementor ne publie pas (dans les sources lues) de « stratégie de test de header » : ce qui suit combine ses guides de dépannage (cités) et des recommandations Kolakisa (marquées).

## 1. Ce qu'Elementor et la communauté recommandent en pratique
| Pratique | Détail | Source |
|---|---|---|
| Vérifier le statut | Gabarit encore en brouillon (bouton Publier rose) -> header du thème affiché | https://elementor.com/help/how-to-fix-a-missing-header-or-footer-in-elementor/ (snippet) |
| Vérifier les conditions d'affichage | Theme Builder > conditions mal réglées = header absent | idem |
| Vider les caches | Elementor > Outils > Régénérer CSS / « Clear Files & Data », navigateur privé, cache navigateur et serveur | idem |
| Isoler le conflit thème | Passer sur Hello Elementor ou un thème par défaut (ex. Twenty Twenty) | idem ; threads wordpress.org (snippets) |
| Isoler le conflit plugin | Désactiver les plugins ; Safe Mode d'Elementor pour l'éditeur seulement | https://elementor.com/help/what-is-safe-mode/ ; snippets https://elementor.com/help/debugging-safe-mode/ |
| Limite du Safe Mode | Ne sert pas à diagnostiquer le rendu public ni le CSS du front | snippets d'aide Elementor (ci-dessus) |
| Gabarit vide | Un gabarit de header vide à supprimer/désactiver peut masquer le vrai | https://wordpress.org/support/?p=17895189 et autres (snippets, anecdotique) |
| Multilingue | Header global non affiché sur pages traduites (WPML) | https://wpml.org/ja/forums/topic/elementor-global-header-not-shown-on-translated-pages (snippet) |
| Bug thème Hello | Header disparu après mise à jour ; contournement rapporté : changer de thème puis réinstaller | sites tiers (anecdotique, NON VÉRIFIÉ officiellement) |
| Expériences | Désactiver temporairement les expériences (Element Caching, etc.) pour isoler | https://elementor.com/help/what-are-performance-experiments/ |

## 2. Matrice de test proposée pour Kolakisa (Recommandation Kolakisa)
### A. Fonctionnel
- Rendu du header sur : accueil, page, article, archive, 404, recherche, page produit/panier si e-commerce, page à gabarit sans header (landing).
- Conditions d'affichage : inclusion, exclusion, priorité entre deux headers concurrents.
- Brouillon vs publié ; restauration d'une révision ; import/export aller-retour (JSON identique après réimport).
- Menus : 1, 2, 3 niveaux ; 0 élément ; 100 éléments ; libellés très longs ; langues RTL et à accents.
- Utilisateur connecté vs visiteur (barre d'admin WP décale le header sticky : test spécifique).

### B. Responsive
- Largeurs 320, 375, 768, 1024, 1280, 1920 ; rotation ; zoom 200 % et 400 % ; points de rupture personnalisés.
- Passage desktop <-> mobile sans rechargement (redimensionnement) : pas de double menu, pas de focus perdu.

### C. Accessibilité (voir fichier 11)
- Automatisé : axe-core / Lighthouse / pa11y sur chaque gabarit et chaque état (menu ouvert, sous-menu ouvert, header "scrolled").
- Clavier seul : Tab, Maj+Tab, Entrée, Espace, Échap, flèches (si prévues) ; focus visible ; focus rendu au bouton à la fermeture ; focus jamais masqué par le header sticky.
- Lecteurs d'écran : NVDA+Firefox/Chrome, VoiceOver+Safari (macOS/iOS), TalkBack. Vérifier landmarks, noms, états `aria-expanded`.
- Skip link : cible existante sur chaque gabarit (échec fréquent signalé sur Elementor/Hello : https://equalizedigital.com/how-to-fix-broken-skip-links-in-elementor/).
- `prefers-reduced-motion`, contraste (états normal, survol, focus, scrolled), forced-colors / mode contraste élevé.

### D. Performance (voir fichier 12)
- Lighthouse / PageSpeed + WebPageTest sur mobile 4G émulé ; relevés LCP, CLS, INP ; nombre de nœuds DOM, poids CSS/JS du header.
- Test CLS du sticky : défilement lent/rapide, rétrécissement, retour en haut, barre d'admin.
- Test sans JS : le header reste lisible et navigable (liens).
- Test avec/sans cache de fragment ; contrôle que les zones dynamiques (panier, compte) ne sont pas servies périmées.

### E. Compatibilité et conflits
- Thèmes : thème de référence Kolakisa, thème par défaut, thèmes tiers avec header/footer propres (le point de remplacement du header est la source de conflit principale, cf. https://developers.elementor.com/docs/themes/).
- Extensions : plugins de cache/minification (combinaison CSS/JS, report du JS), de sécurité (WAF qui bloque le JSON d'import), d'optimisation d'images, multilingue, e-commerce, constructeurs concurrents, scripts de mesure injectés via code personnalisé.
- Caches : navigateur, CDN, page complète, objet ; scénarios « modification du header puis visite anonyme » pour valider l'invalidation.
- Navigateurs : Chrome, Firefox, Safari (macOS + iOS), Edge ; Safari iOS surtout pour `position: sticky`, hauteur `100vh` et barre d'adresse.
- Mise à jour du cœur / migration de schéma : ouvrir d'anciens JSON (version N-1, N-2) et vérifier le rendu identique.

### F. Sécurité (voir fichier 13 §7)
- Injection : `"><script>`, `onerror=`, `javascript:` dans libellés, URL, attributs personnalisés, noms de menu, alt ; attendu = échappé ou rejeté.
- Capacités : un rôle « contenu » ne peut pas ajouter de code ni changer le style ; import JSON/ZIP par un rôle non autorisé refusé ; SVG non filtré refusé hors administrateur.
- Import de JSON malformé, énorme, avec clés inconnues, chemins relatifs dans un ZIP.
- Régression de CVE : cas équivalents à CVE-2024-1364 (attributs) et CVE-2020-7055 (import ZIP) - https://ocve.arawa.fr/cve/CVE-2024-1364 ; https://www.incibe.es/en/incibe-cert/early-warning/vulnerabilities/cve-2020-7055 (snippets).

## 3. Mode de dépannage Kolakisa (inspiré du Safe Mode d'Elementor)
- Interrupteur « mode sans échec » : rendu du header sans code personnalisé, sans extensions, sans expériences, pour l'utilisateur connecté seulement. Elementor fait l'équivalent uniquement pour l'éditeur et ne résout pas les problèmes du front (sources ci-dessus) ; Kolakisa peut aller plus loin en proposant aussi un aperçu du front en mode sans échec. Recommandation.
- Outil « diagnostic header » : affiche quel gabarit est appliqué, pourquoi (condition gagnante), version du schéma, date de génération du CSS, état du cache.

## 4. Automatisation (Recommandation Kolakisa)
1. Tests unitaires : validation de schéma, migrations, assainissement, calcul des conditions.
2. Tests de rendu « snapshot » du HTML produit à partir de JSON d'exemple.
3. Tests E2E (Playwright) : clavier, mobile, sticky, Échap, focus.
4. Audit CI : axe-core + budget Lighthouse (LCP, CLS, INP, poids) bloquants.
5. Matrice de compatibilité hebdomadaire sur thèmes/plugins/caches courants.
6. Bibliothèque de JSON « cas difficiles » (menus profonds, RTL, valeurs extrêmes, anciennes versions).

## 5. NON VÉRIFIÉ
- Aucune méthodologie de test officielle d'Elementor pour les headers n'a été trouvée ; les tableaux §1 sont des guides de dépannage, pas une stratégie de test.
- Pages d'aide Safe Mode, Role Manager, Révisions, Custom Attributes : corps d'article tronqué à la lecture, contenu repris via extraits de recherche.
