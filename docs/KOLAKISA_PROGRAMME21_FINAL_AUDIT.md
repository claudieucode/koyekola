# Programme 21 — audit final (21.11)

Audit fait sur `origin/main` (commit `a39abd87`, après fusion des paliers 20.5, 21.9 et 21.10 survenue PENDANT ce palier) puis corrigé dans la branche `feat/programme-21-11-validation`. Chaque ligne s'appuie sur du code lu ou un test exécuté ; aucune ligne ne repose sur un document seul.

> Chronologie à connaître : l'audit a d'abord été fait sur un `main` qui ne contenait NI 21.9, NI 21.10, NI le moteur de boutique 20.5 ; quinze commits les ont apportés en cours de route. L'audit a été **refait** sur le code fusionné ; les conclusions ci-dessous sont celles du code fusionné.

## État des paliers
| Palier | Statut réel | Preuve principale |
|---|---|---|
| 21.1 audit et architecture | OPÉRATIONNEL (documentaire) ; « AI Orchestrator » = PARTIELLEMENT (pas de module unique) | `docs/KOLAKISA_PROGRAMME21_1_*.md` |
| 21.2 AI Core | PARTIELLEMENT : testé avec fournisseurs simulés, aucune connexion réelle, branché surtout pour les médias | `ai-core*.test.js` (56) |
| 21.3 Brief Analyzer + Site Planner | OPÉRATIONNEL (clé d'IA requise) ; registre non aligné sur la boutique (voir I1) | 30 tests |
| 21.4 Page Generator + Component Mapper | OPÉRATIONNEL | 26 tests + scénario vitrine |
| 21.5 Design Generator | OPÉRATIONNEL | 25 tests |
| 21.6 Content Generator | OPÉRATIONNEL (clé d'IA requise) | 30 tests |
| 21.7 Media Generator + Asset Manager | PARTIELLEMENT : fournisseur d'images réel non vérifié | 21 tests |
| 21.8 interface (studio) | OPÉRATIONNEL ; navigateur réel non exécuté | 28 tests |
| 21.9 régénération et historique | PARTIELLEMENT OPÉRATIONNEL : analyse, contexte, impact, snapshots, comparaison, restauration, conflits, protections ; **ne couvre pas le catalogue**, pas de pile unifiée, pas de lien depuis le studio | 34 tests |
| 21.10 constructeur de boutique | PARTIELLEMENT OPÉRATIONNEL : brief → plan → catalogue natif → config → validation → publication ; **paiements simulés seulement**, pas de fiche produit générée, pas d'images de produits générées | 46 tests (+ moteur 20.5 : 83) |

## Défauts d'intégration trouvés
| Id | Gravité | Défaut | Traitement |
|---|---|---|---|
| F1 | P1 | Le studio IA, l'API des plans, la régénération (21.9) et le constructeur de boutique (21.10) lisaient projets, plans, versions et états avec le seul droit `forms.read` : un rôle quasi sans droit voyait ces écrans (la matrice R7 des routes de moteur échouait, deux fois). | **Corrigé** : `templates.read` exigé en plus sur toutes les lectures de ces quatre routeurs ; matrice R7 6/6 |
| F2 | P2 | Publication groupée du studio : confirmation exigée seulement par la boîte de dialogue du navigateur. | **Corrigé** : confirmation exigée par le service (422 `confirm_required`), après le contrôle d'accès |
| F3 | P3 | Feuille de style du studio : teinte rose résiduelle (audit « anti-rose »). | **Corrigé** |
| F4 | — | Tests et libellé périmés par l'ouverture du module « Formations » aux sites. | **Corrigé** (commit `dd0d37d8`) |
| I1 | P1 | **Registre du Site Planner non aligné** : il déclare « boutique » et « catalogue de produits » indisponibles (et les types de pages `boutique`/`panier`… exigent « Boutique en ligne ») alors que le moteur Boutique natif existe et que 21.10 construit des boutiques. Le planificateur général ne planifiera donc pas de boutique. | **Atténué** : texte du registre corrigé (renvoie au constructeur de boutique) ; statut volontairement conservé « indisponible » pour le planificateur général (ses pages ne savent pas bâtir une boutique), ce qui est vrai ; l'unification reste à faire |
| I2 | P2 | 21.9 et 21.10 ne sont pas reliés à l'interface 21.8 (pas de lien depuis le studio vers la régénération/les versions) ; deux piles d'annulation et plusieurs journaux d'historique coexistent. | Documenté |
| I3 | P2 | Les protections de 21.9 ne sont consultées que par 21.9 et le Content Generator, pas par le Page Generator, le Design Generator ni les médias appelés directement. | Documenté |
| I4 | P2 | 21.9 ne couvre pas produits, catégories ni configuration commerciale (historique minimal propre à 21.10). | Documenté |

Aucune fuite entre sites, aucune faille d'écriture, aucun défaut P0 n'a été trouvé.
