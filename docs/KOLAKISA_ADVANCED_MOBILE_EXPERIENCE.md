# KOLAKISA — Expérience mobile avancée (22.8)

## Menu de navigation (widget « menu », option « repli sur mobile »)
Existant : bouton « Menu » (min 44 px), `aria-expanded`, `aria-controls`, liste repliée sous 767 px, sous-menus à bascule avec Échap.
**Défauts relevés et corrigés** (`public/js/landing.js`) : le menu ouvert ne se refermait ni avec Échap ni en quittant le menu au clavier ; le focus n'était pas rendu au bouton.
Désormais : Échap referme et rend le focus au bouton ; Tab hors du menu le referme ; ouvrable au clavier (Entrée). Test : `menu mobile` (échoue sans le correctif — vérifié).
Non traité : menu latéral / plein écran (un seul mode : déroulant), pièges de focus (le menu n'est pas modal, donc non nécessaire), fermeture au clic extérieur.

## Cibles tactiles
Mesure sur une page publiée : deux liens du pied de page (« KOLAKISA », « Cookies ») de 17 px de haut (même défaut que l'audit 22.1B). Correctif `landing.css` : 44 px sous 1024 px ou sur pointeur grossier ; boutons « petits » 38 → 44 px. L'ordinateur est inchangé.

## Interdiction de bloquer le zoom
Les pages publiques déclarent `width=device-width, initial-scale=1` (pas de `user-scalable=no`) ; l'audit navigateur échoue si ce n'est plus le cas.

## Non couvert
Claviers virtuels / formulaires sur appareil réel, états de chargement et d'erreur propres au mobile, orientation, « menus latéraux ». Voir restes.
