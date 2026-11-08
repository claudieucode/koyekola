# Matrice de parité fonctionnelle — Page 404 (Elementor ↔ Kolakisa)

Légende : ✅ présent et vérifié dans le code/les tests · 🟡 partiel · ❌ absent · ❓ non vérifié.
Référence Elementor : niveau de confiance dans ELEMENTOR_404_REFERENCE.md.

| # | Fonction | Elementor | Kolakisa | Écart / action |
|---|---|---|---|---|
| 1 | Créer un modèle 404 | ✅ (Pro) | ✅ catégorie « Page 404 », « Utiliser » | — |
| 2 | Bibliothèque de modèles | ✅ | ✅ 100 modèles (peu diversifiés) | **Refonte demandée** |
| 3 | Départ vide | ✅ | ✅ | — |
| 4 | Éditer avec widgets | ✅ | ✅ 159 types | — |
| 5 | Conteneurs / flexbox / grille | ✅ | ✅ `container`, `grid`, `stack`, `columns` | — |
| 6 | Typographie, couleurs, arrière-plans | ✅ | ✅ jetons du site + styles par élément | — |
| 7 | Images, vidéos, icônes | ✅ | ✅ widgets existent ; ❌ **non utilisés** par la bibliothèque | Utiliser ; décision sur la source des photos |
| 8 | Animations / effets | ✅ (certaines Pro) | ✅ 45 `motion*`, `lottie`, `marquee`, `animatedheading` ; ❌ non utilisés | Utiliser, avec `prefers-reduced-motion` (❓ à vérifier par widget) |
| 9 | Lottie | ✅ (Pro ?) | ✅ widget `lottie` / `motionlottie` | Fichiers d'animation à fournir (licence) |
| 10 | Recherche | ✅ (Pro ?) | ✅ widget `search` (moteur du site) | Vérifier recherche pages / articles / produits / cours |
| 11 | Articles / produits / formations dynamiques | ✅ (Pro) | ✅ `posts`, `querylist`, `courselist`, `shop*` | Messages vides propres, pas de faux contenu |
| 12 | Formulaires | ✅ (Pro) | ✅ `signupform`, `emailsubscribe`, formulaires | Câbler au formulaire réel du site |
| 13 | Mini-jeu | ❌ natif (tiers/HTML) | 🟡 `html` / `embed` disponibles | **Aucun jeu existant** : à écrire (accessibilité, mouvement réduit) |
| 14 | Responsive par appareil | ✅ | ✅ styles bureau / tablette / mobile | Vérification visuelle par modèle |
| 15 | Conditions d'affichage (inclure/exclure) | ✅ | ✅ | — |
| 16 | Priorité entre plusieurs modèles | ✅ (récent) [tiers] | ✅ score → récent → id | — |
| 17 | Aperçu | ✅ | ✅ aperçu + vignette | ❌ test aperçu = vignette en échec aujourd'hui (voir risques) |
| 18 | Publication / brouillon | ✅ | ✅ | — |
| 19 | Statut HTTP 404 réel | ❓ non garanti par l'aide | ✅ posé avant le rendu | À reconfirmer par test sur les 100 modèles |
| 20 | `noindex` | ❓ | ✅ balise + en-tête (domaines de site) | Canonical ❓ |
| 21 | Redirections avant 404 | extension | ✅ | — |
| 22 | Modèle 404 pour **toutes** les erreurs de contenu (article, produit, brouillon…) | ❓ | ❌ ces cas rendent l'erreur simple, sans modèle | **Incohérence confirmée** : à décider (voir TARGET_ARCHITECTURE.md §4) |
| 23 | Multi-sites, isolation | ❌ (WordPress mono-site) | ✅ | — |
| 24 | Retour au modèle initial | ✅ (bibliothèque) | ❌ refusé pour 404 | Hors périmètre, à discuter |
| 25 | Recherche / filtres / tri dans la bibliothèque | ✅ | 🟡 recherche texte, identité, mise en page ; ❌ famille, tri, favoris | À ajouter (famille obligatoire) |
| 26 | Favoris | ❓ | ❌ | Optionnel (« si disponibles ») |
