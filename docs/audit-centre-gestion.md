# Audit du Centre de gestion (Mon espace → Centre de gestion, `/formateur/gestion`)

Audit réalisé avant toute modification (code lu, 16 pages parcourues dans Chrome aux 9 largeurs, tests existants exécutés : 16/16).

## 1. Ce qu'est (et n'est pas) le Centre de gestion
C'est le **centre d'activité du compte créateur (rôle `formateur`)** : ventes, élèves, support, analytics, ressources, activité, sauvegardes, journal.
Il **ne gère pas** les sites, domaines, utilisateurs/rôles ni modules : ceux-ci vivent dans le CMS (Marketing → Site web : `sites`, équipe et rôles `cmsAccess`, domaines, outils),
avec leur propre système de permissions par site (`mk_site_members`, `effectivePermissions`) déjà testé (`gestionnaire-de-sites`, `cms-acces`…). Les phases « sites / domaines / utilisateurs /
modules » de la mission ne sont donc **pas dupliquées ici** (consigne : pas de doublon Centre de gestion / CMS). Le Centre de gestion renvoie vers elles quand c'est utile.

## 2. Inventaire et état réel
| Fonction | Routes | État |
|---|---|---|
| Vue d'ensemble | `GET /formateur/gestion` | opérationnelle ; blocs indépendants (un échec = « Données indisponibles ») ; **incomplète** : ni support, ni sauvegardes, ni journal ; tuile Analytics = texte statique |
| Ventes : commandes, détail, transactions, remboursements, codes promo | `/ventes/*` | opérationnelle (paiement simulé déclaré, pas de faux bouton) |
| Élèves, fiche, certificats (révoquer/rétablir) | `/eleves/*`, `/certificats/*` | opérationnelle, confirmations décrivant la conséquence |
| Support (tickets) | `/support/*` | opérationnelle ; ne voit que ses tickets |
| Analytics | `/analytics` | opérationnelle (périodes réelles, heure de Paris) |
| Ressources (fichiers du site) | `/ressources/*` | opérationnelle ; suppression bloquée si l'usage est invérifiable |
| Activité (flux, notifications, alertes) | `/activite/*` | opérationnelle ; lu/non lu par compte |
| Sauvegardes, audit d'isolation des sites, essai de reconstruction, archive des fichiers | `/sauvegardes/*` | opérationnelle |
| Journal d'activité | `/journal` | opérationnelle, lecture seule |

## 3. Sécurité et isolation (vérifié par requêtes directes, `tests/centre-gestion-isolation.test.js`, 5/5)
- Tout `/formateur/gestion` exige le rôle `formateur` côté serveur (anonyme → connexion, élève → 403).
- **Données métier isolées par formateur** : un second formateur ne voit ni commandes, élèves, coupons, tickets, notifications du premier, et ses requêtes directes (id connu) donnent 404 / aucun effet.
- **Décision de modèle (constatée, non modifiée)** : `syncInstructorMembers` fait de **tout compte `formateur` un propriétaire de l'organisation** ; le rôle `formateur` n'est créé que par l'amorçage de l'installation (le formulaire d'inscription crée uniquement des élèves). Les pages de **niveau installation** (Sauvegardes de toute la base, Audit des sites, Journal global, flux « commentaires/articles », Ressources du site) sont donc ouvertes à tout formateur, ce qui est cohérent avec ce modèle (co-propriétaires) mais **deviendrait une fuite si l'on créait des formateurs limités**. À traiter avec toute évolution du modèle d'accès (hors périmètre de cette mission ; documenté ici).

## 4. Défauts constatés
1. **Responsive tactile** : les règles `pointer: coarse` (champs ≥ 16 px, cibles ≥ 44 px) n'existent que pour l'espace Marketing (`.mk-body`). Dans Mon espace / Centre de gestion : champs à 14 px (iOS zoome au focus) sur 9 pages, `summary` à 22 px (Analytics), champs de codes promo à 21 px. Aucun débordement horizontal ni erreur de console.
2. **Vue d'ensemble** : n'expose pas les signaux réels déjà disponibles (tickets en attente, âge de la dernière sauvegarde, dernière entrée du journal) ; Analytics sans indicateur.
3. Aucune alerte sur l'absence de sauvegarde récente (le fichier le plus important du site).

## 5. Plan
1. Vue d'ensemble : tuiles Support / Sauvegardes / Journal avec chiffres réels ; Analytics comparée aux 30 jours précédents ; panneau « À traiter » avec niveaux (bloquant / à surveiller / information) incluant l'état des sauvegardes.
2. Responsive tactile du shell « Mon espace » (`.dash`) : champs 16 px, cibles 44 px (au pointeur grossier seulement).
3. Tests (indicateurs sur données réelles, navigateur 9 largeurs) ; documentation.

## 6. Réalisé (après l'audit)
- Vue d'ensemble : tuiles Support, Sauvegardes, Journal (chiffres lus en base / dans les fichiers), tendance des ventes sur 30 jours comparée aux 30 précédents, alerte « sauvegarde absente ou ancienne » (au-delà de 2 jours) partagée avec la page Activité, niveau des alertes écrit en toutes lettres (Bloquant / À surveiller / Information).
- Responsive tactile de la coquille « Mon espace » (`@media (pointer: coarse)` dans `dashboard.css`) : champs ≥ 16 px, cibles ≥ 44 px, y compris le bouton « ⋯ » des cartes de formation.
- Aucun changement de route, de données ni de permissions. Aucune dépendance ajoutée.
- Outils : `scripts/audit-gestion.js` (pages × 9 largeurs, `--shell` pour inclure Mon espace) ; tests `centre-gestion-vue`, `-isolation`, `-navigateur`.

## 7. Limites
- Pas de gestion des sites, domaines, utilisateurs/rôles ni modules dans le Centre de gestion : ces fonctions existent dans le CMS (autres sections, déjà testées) et n'ont pas été dupliquées.
- Pages de niveau installation (sauvegardes, journal global, audit des sites) ouvertes à tout compte `formateur` : voir §3 (cohérent avec le modèle actuel de co-propriétaires, à revoir si des formateurs limités sont créés un jour).
- Paiements simulés : les écrans Transactions et Remboursements le déclarent ; aucun paiement réel n'est vérifiable ici.
