# Elementor — documentation de référence et méthode (programme 22.8)

## Ce que ce dossier est, et n'est pas
- **Matrice unique** : `ELEMENTOR_PARITY_MATRIX.md` / `.csv` — **544 lignes, une par widget ou fonctionnalité identifiable**, à identifiants stables (EL-W widgets, EL-F transversaux, EL-WC boutique, EL-TB Theme Builder, EL-DY contenu dynamique, EL-FM formulaires, EL-PU popups, EL-NV navigation, EL-SS réglages du site, EL-UI interface de l'éditeur, EL-ST style, EL-LY layout).
- **Vues par domaine** (générées de la même matrice) : widgets, outils, layout et style, contenu dynamique, interactions, boutique.
- **Source des lignes** : l'inventaire historique (109 lignes, missions « parité » précédentes, testées) + trois relevés 22.8 (`docs/elementor-parite-data/`) qui comparent la documentation officielle au code réel de Kolakisa.
- Ce n'est **pas** une reproduction du code ni des ressources d'Elementor : seules les fonctionnalités sont décrites, avec leur source.

## Fiabilité (à lire avant d'utiliser la matrice)
- Colonne **Disponibilité** : « documenté » = page officielle lue ; « déduit » = titre vu seulement, jamais lu. Aucune option n'est inventée, mais une ligne « déduit » est à confirmer avant de coder.
- Les pages d'aide Elementor sont tronquées à 100 000 caractères dans l'outil de lecture ; certaines ont été lues via l'API publique du centre d'aide. Pages **non lues** : tutoriels multi-étapes, reCAPTCHA, mega menu, popups Slide-ins / Bottom bar, intégrations tierces des formulaires, dynamic-colors, plusieurs effets de défilement (liste dans les relevés).
- Les **numéros de ligne** cités en preuve sont approximatifs ; les fichiers et fonctions existent.
- Pas d'accès à une interface Elementor réelle : aucune fonctionnalité n'est « observée dans l'interface », uniquement documentée ou déduite.
- Marquee et Avant/Après n'existent pas dans la documentation officielle : ils ne sont **pas** ajoutés.

## Constats d'architecture qui conditionnent la parité
1. Le formulaire Kolakisa est un **formulaire d'inscription** (e-mail obligatoire, champs contact fixes), pas un constructeur de champs libres.
2. Le moteur de requêtes (`pages/query.js`) n'a **pas de source « produits »** : pas de Loop Grid sur la boutique.
3. Aucun système de **champs personnalisés**.
4. Les couleurs globales sont une **liste fermée de 10 clés**.
5. Pas d'injection de code (head / body) pour les clients.
6. Kolakisa fait **mieux** qu'Elementor sur : logique conditionnelle serveur des formulaires, double opt-in et consentement, priorité déterministe des modèles (« Pourquoi ce modèle ? »), valeurs dynamiques jamais injectées en HTML.

Régénération : `python3 scripts/build-elementor-matrix.py`.
