# 00 — Périmètre et méthode

Mission : faire du logiciel d'e-mailing de Kolakisa une plateforme de marketing par e-mail et d'automatisation aussi proche que possible de Mailchimp sur le plan fonctionnel, sans copier son interface ni ses textes. Branche de travail : `feat/email-marketing` (issue de `origin/main`).

## Ce que la mission a trouvé au départ

Le module marketing n'est pas à construire : il existe déjà dans `src/marketing` (environ 50 000 lignes, 109 migrations avant cette mission, plus de 100 fichiers de tests marketing) avec ses documents `EMAIL_MARKETING_*.md` à la racine du dépôt. La mission a donc été menée comme **audit, écart, correction et extension**, pas comme reconstruction. Règle appliquée : on réutilise, on corrige ou on étend ; on ne crée pas un second système.

## Méthode

1. **Audit du code**, par lecture et exécution des tests existants : deux audits indépendants.
   - modules 1 à 11 : `00a_AUDIT_CODE_MODULES_1_11.md` ;
   - modules 12 à 21 : `00b_AUDIT_CODE_MODULES_12_21.md`.
2. **Inventaire Mailchimp** à partir de la documentation publique, en deux parties : `01a_…` (audiences, segments, campagnes, éditeur, automatisations, formulaires, landing pages) et `01b_…` (délivrabilité, conformité, rapports, e-commerce, SMS, API, IA, comptes, facturation).
3. **Vérification des défauts signalés** : chaque défaut annoncé par un audit a été relu dans le code avant correction. Un défaut n'est cité comme corrigé que s'il a un test de non-régression qui passe.
4. **Corrections et extensions** avec tests, puis documentation, puis fusion avec `main`.

## États utilisés

| Code | Sens |
|---|---|
| V | fonctionnelle et vérifiée (un test précis la couvre) |
| I | fonctionnelle mais insuffisamment testée |
| P | partielle |
| UI | interface présente, logique absente |
| NI | non implémentée |
| BE | bloquée par une dépendance externe (compte, domaine, fournisseur) |

## Limites de la recherche Mailchimp (à lire avant de s'y fier)

- Les pages ont été lues par un outil de résumé et par des extraits de recherche, pas par une navigation complète. **Les chiffres (limites, tarifs, plans) sont à revérifier** dans un compte réel avant d'être traités comme une spécification.
- Une vingtaine de pages n'ont pas été ouvertes (archivage, export, fusion, déclencheurs, balises de fusion, Form Builder, détails de l'API développeur…) ; elles sont listées dans les sections « Lacunes » des fichiers `01a` et `01b`.
- La page Mailchimp sur les exigences Gmail/Yahoo renvoie une erreur 404 : le seuil de plaintes de 0,3 % et le désabonnement en un clic n'ont donc pas de source Mailchimp ici. Ils sont documentés dans `07_DELIVERABILITY.md` avec leur source réelle (consignes publiques des messageries) ou marqués non vérifiés.
- Aucune dépendance par pays n'a pu être établie, sauf quelques cas (SMS, double opt-in dans l'UE).

## Ce que la mission ne prétend pas

- Elle ne prétend pas que Kolakisa possède toutes les fonctions de Mailchimp : voir `14_FINAL_PARITY_REPORT.md`.
- Aucune campagne réelle n'a été envoyée. Tous les envois testés passent par des fournisseurs simulés.
- La conformité juridique n'est pas garantie : les choix d'implémentation sont documentés, la validation juridique reste à faire.
