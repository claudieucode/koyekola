# Interactions : popups, déclencheurs, conditions

_Vue de `ELEMENTOR_PARITY_MATRIX.md` générée par `scripts/build-elementor-matrix.py` (familles PU). Ne pas modifier à la main._

**39 lignes** : Complet 22, Partiel 14, Absent 3.

| ID | Référence Elementor | Source | Disponibilité | Kolakisa | État | Écart | Solution prévue | Prio |
|---|---|---|---|---|---|---|---|---|
| EL-PU001 | Déclencheur : Au chargement de la page (On Page Load, délai) | https://elementor.com/help/popups/ | documenté | modal auto=load + delai (1–600 s); ND:1580-1584 | Complet | — | — | P4 |
| EL-PU002 | Déclencheur : Au défilement (On Scroll, %) | https://elementor.com/help/popups/ | documenté | modal auto=scroll, scrollAt 5–95 %; popup formulaires: scroll 1–100 | Complet | Pas de défilement vers le haut (scroll up) | Ajouter sens de défilement | P3 |
| EL-PU003 | Déclencheur : Défilement jusqu'à un élément (On Scroll To Element) | https://elementor.com/help/popups/ | documenté | Déclencheur « élément visible » (modal.auto=element, ancre) — lot 5 (nodes.js modalAuto, landing.js) | Complet |  |  | P2 |
| EL-PU004 | Déclencheur : Au clic (On Click) | https://elementor.com/help/popups/ | documenté | Bouton d'ouverture du widget modal; interaction « open » sur n'importe quel élément (runAction) | Complet | Pas de sélecteur CSS arbitraire ni lien d'ancre #popup | Lien d'action « Ouvrir popup » universel | P3 |
| EL-PU005 | Déclencheur : Après un nombre de clics (Click count) | https://elementor.com/help/conditions-triggers-and-advanced-rules | documenté | auto=clicks, 1–50 | Complet | — | — | P4 |
| EL-PU006 | Déclencheur : Après inactivité (After Inactivity) | https://elementor.com/help/popups/ | documenté | auto=idle, délai 1–600 s (défaut 20) | Complet | — | — | P4 |
| EL-PU007 | Déclencheur : Intention de sortie (Exit Intent) | https://elementor.com/help/popups/ | documenté | auto=exit via mouseout sur le haut de la page | Partiel | Pas d'alternative mobile; souris uniquement | Repli mobile (retour arrière, défilement vers le haut) | P3 |
| EL-PU008 | Déclencheur : Défilement vers le haut (On Scroll Up) | https://elementor.com/help/popups/ | déduit (demandé dans le périmètre, absent des listes lues) | Déclencheur « remontée de page » (modal.auto=scrollup) — lot 5 | Complet |  |  | P4 |
| EL-PU009 | Pop-up de formulaire (module Formulaires): déclencheurs delay/scroll/exit | https://elementor.com/help/popups/ | observé | POPUP_TRIGGERS delay/scroll/exit; FI:27-29 | Partiel | Pas de inactivité/clics/élément | Aligner sur modal | P3 |
| EL-PU010 | Règle avancée : Afficher après X pages vues | https://elementor.com/help/popups/ | documenté | minViews 2–20 (modal) / minPages (formulaire); compteur sessionStorage | Complet | Mémoire d'onglet seulement | — | P4 |
| EL-PU011 | Règle avancée : Afficher après X sessions | https://elementor.com/help/popups/ | documenté | Aucun compteur de sessions inter-visites (visiteur new/returning pour les pop-ups de formulaire seulement) | Partiel | new/returning exige le suivi accepté; pas de compteur N sessions | Compteur de sessions localStorage | P3 |
| EL-PU012 | Règle avancée : Afficher jusqu'à X fois (Show up to X times) | https://elementor.com/help/popups/ | documenté | freq always/session/once; formulaires: frequencyDays 1–90 | Partiel | Pas de limite à N affichages | Compteur d'affichages | P3 |
| EL-PU013 | Règle avancée : Venant d'une URL / source | https://elementor.com/help/popups/ | documenté | source direct/search/social/other (modal); utmSource/utmCampaign/referrer (formulaire) | Partiel | Pas de correspondance sur URL précise pour le modal; moteurs/réseaux listés en dur | Referrer contient + UTM sur modal | P3 |
| EL-PU014 | Règle avancée : Appareils (Show on devices) | https://elementor.com/help/popups/ | documenté | devices desktop/mobile (formulaire) | Partiel | Non disponible sur les modal de page (visibilité par appareil via responsive de l'élément, déduit) | Option appareils sur modal | P3 |
| EL-PU015 | Règle avancée : Masquer aux utilisateurs connectés | https://elementor.com/help/popups/ | documenté | hideForStudents; AUDIENCES student/not_student sur les éléments | Complet | Rôle = élève/formateur seulement | — | P4 |
| EL-PU016 | Règle avancée : navigateur | https://elementor.com/help/popups/ | déduit | Aucun | Absent | — | Faible priorité | P4 |
| EL-PU017 | Règle avancée : rôle / audience | https://elementor.com/help/popups/ | observé | AUDIENCES: abonnés, clients, élèves, étiquette, score, panier, paramètre d'URL | Complet | Dépasse Elementor sur l'audience marketing | — | P4 |
| EL-PU018 | Règle avancée : période (dates de début/fin) | https://elementor.com/help/popups/ | déduit (Display Conditions Elementor non lu) | Période d'affichage (modal.startDate/endDate, date du visiteur) — lot 5, widget Modal seulement | Partiel | Pas de période pour les pop-ups du module Formulaires | Planification début/fin | P3 |
| EL-PU019 | Règle avancée : URL / pages concernées (Conditions) | https://elementor.com/help/conditions-triggers-and-advanced-rules | documenté | pages include/exclude + jokers (formulaire); modal rattaché à la page où il est placé | Partiel | Pas de conditions « tout le site » pour le modal (un modal = une page, sauf modèles de site) | Pop-ups de site avec conditions | P2 |
| EL-PU020 | Règle avancée : Abonné déjà inscrit | https://elementor.com/help/popups/ | observé | hideIfSubscribed | Complet | Propre à Kolakisa | — | P4 |
| EL-PU021 | Modèle de pop-up réutilisable (Popup Builder, templates) | https://elementor.com/help/popups/ | documenté | Pas de gabarit de pop-up global; le modal est un widget dans la page | Absent | Pas d'éditeur dédié ni modèle partagé entre pages | Type de modèle « popup » dans la bibliothèque | P2 |
| EL-PU022 | Mise en page : largeur / hauteur | https://elementor.com/help/popups/ | documenté | size sm/md/lg | Partiel | Pas de largeur/hauteur libres | Contrôles dimensions | P3 |
| EL-PU023 | Mise en page : position (Horizontal / Vertical) | https://elementor.com/help/popups/ | documenté | position center/left/right/corner/bar | Partiel | 6 positions fixes, pas de décalage libre | Position libre | P3 |
| EL-PU024 | Slide-in / Bottom Bar | https://elementor.com/help/popups/ | documenté | corner (non bloquant) et bar | Complet | — | — | P4 |
| EL-PU025 | Panneau latéral (off-canvas) gauche/droite | https://elementor.com/help/popups/ | documenté | position left/right | Complet | — | — | P4 |
| EL-PU026 | Superposition (Overlay) : couleur/flou | https://elementor.com/help/popups/ | documenté | Superposition : modal.overlayColor (couleur ou jeton) + overlayBlur — lot 5 | Complet |  |  | P3 |
| EL-PU027 | Animation d'entrée | https://elementor.com/help/popups/ | documenté | Animation d'entrée : modal.animIn fade/zoom/slide-up/slide-down — lot 5 (respecte « mouvement réduit ») | Complet |  |  | P2 |
| EL-PU028 | Animation de sortie | https://elementor.com/help/popups/ | documenté | Animation de sortie : modal.animOut — lot 5 | Complet |  |  | P2 |
| EL-PU029 | Fermeture : bouton × | https://elementor.com/help/popups/ | documenté | Bouton de fermeture; popup formulaire idem | Partiel | Pas de délai d'apparition du bouton ni de masquage | Option bouton | P4 |
| EL-PU030 | Fermeture : touche Échap (Prevent Closing on ESC) | https://elementor.com/help/popups/ | documenté | Échap ferme (natif); verrou lock l'empêche | Complet | Verrou combiné avec clic extérieur | Séparer les deux options | P4 |
| EL-PU031 | Fermeture : clic sur l'overlay (Prevent Closing on Overlay) | https://elementor.com/help/popups/ | documenté | Clic extérieur ferme sauf lock | Complet | Même verrou que Échap | Séparer | P4 |
| EL-PU032 | Fermeture automatique (Automatically Close After) | https://elementor.com/help/popups/ | documenté | autoClose 1–600 s | Complet | Elementor en ms; équivalent | — | P4 |
| EL-PU033 | Désactiver le défilement de la page (Disable Page Scrolling) | https://elementor.com/help/popups/ | documenté | modal.noScroll bloque le défilement de la page pendant l'ouverture — lot 5 | Complet |  |  | P4 |
| EL-PU034 | Fréquence d'affichage | https://elementor.com/help/popups/ | documenté | always/session/once | Partiel | Pas de « tous les N jours » pour le modal (existe pour les formulaires) | Délai en jours | P3 |
| EL-PU035 | Action de lien : Ouvrir un popup | https://elementor.com/help/popups/ | documenté | Interaction « open » (runAction) sur dialog | Partiel | Par interaction d'élément, pas un lien d'URL | Action de lien | P3 |
| EL-PU036 | Action de lien : Fermer un popup | https://elementor.com/help/popups/ | documenté | Bouton × seulement | Partiel | Pas d'action « fermer » configurable sur un bouton | Action | P3 |
| EL-PU037 | Action de lien : Basculer (Toggle) un popup | https://elementor.com/help/popups/ | déduit | Interaction toggle sur éléments mais pas sur dialog | Absent | — | Action toggle | P4 |
| EL-PU038 | Action « Ne plus afficher » (Don't Show Again) | https://elementor.com/help/popups/ | documenté | Bouton « Ne plus afficher » (modal.dismissBtn, mémorisé en stockage local) — lot 5 | Complet |  |  | P3 |
| EL-PU039 | Un seul popup à la fois | https://elementor.com/help/popups/ | observé | document.querySelector('dialog[open]') bloque | Complet | Propre à Kolakisa | — | P4 |
