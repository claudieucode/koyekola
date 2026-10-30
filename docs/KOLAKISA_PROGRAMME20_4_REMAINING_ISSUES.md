# KOLAKISA — Programme 20.4 : points restants

Chaque ligne dit ce qui manque, pourquoi, et ce que l'écran affiche à la place. Rien de ce qui suit n'est présenté comme opérationnel dans l'application.

## A. Dépendances d'autres programmes
| # | Point | Effet |
|---|---|---|
| D1 | **20.1** : aucun document dans le dépôt ; **20.2** (Site Builder) : branche `origin/feat/programme-20-2-site-builder` non fusionnée, 10 tests hérités en échec sur `main` | Pas de « créer un site À PARTIR d'un modèle » en une étape dans « Mes sites » : on crée le site (écran existant, ou assistant de `main`), puis on y importe un pack. Les packs s'importent dans un site existant |
| D2 | Affectations de modèles de thème **par organisation** (limite D2 de 20.3) | L'option « affecter » d'un modèle de thème s'applique à toute l'organisation ; l'écran le dit avant l'import. Corriger demande une migration des affectations (hors périmètre) |

## B. Fonctions du cahier des charges non réalisées ou partielles
| # | Fonction | État |
|---|---|---|
| R1 | Modèles **personnels d'un utilisateur** (visibles de lui seul à travers ses sites) | Non réalisé : les visibilités sont « ce site » et « tous les sites de l'organisation ». Le cahier précisait « si cette fonctionnalité est prévue » |
| R2 | **Image d'aperçu** enregistrée / optimisée ; capture pleine page ; téléversement d'une image d'aperçu par l'utilisateur | Non réalisé volontairement : les aperçus sont des **rendus vivants du moteur** (jamais périmés, aux styles du site), chargés à la demande. Aucune image n'est embarquée, donc aucune licence à documenter (voir la licence affichée dans le détail) |
| R3 | Secteurs **sans aucun modèle officiel** | 13 secteurs sur 48 : Finance, Juridique, Assurance, Architecture, Construction, Mode, Beauté, Électronique, Maison et décoration, Écoles, Universités, Cours particuliers, Tourisme. 35 secteurs ont au moins un modèle ; plusieurs (cabinet, clinique, bien-être, fitness, hôtel) n'ont que 1 à 2 compositions ou gabarits, pas de pack. Le filtre ne les masque pas : il affiche « aucun modèle » |
| R4 | **Boutique en ligne** (produits physiques, panier de produits, fiche produit, archive produits) | Absent du dépôt (confirmé aussi par 20.3 R2). Le pack « Boutique de formations » s'appuie sur le catalogue de formations réel ; il est nommé ainsi |
| R5 | Dons / cotisations en ligne (association) | Aucun moteur de paiement de don : le pack Association n'en simule pas, la page « Nous soutenir » le dit |
| R6 | Filtre **langue** et filtre **gratuit / payant** | La langue est gérée par l'API (`language=`) mais **absente de l'écran** : tous les modèles officiels sont en français (un filtre à une seule valeur serait du décor). Gratuit / payant : aucun système commercial de modèles n'existe, donc rien n'est proposé |
| R7 | Tri **« recommandés »** | Absent : aucune logique de recommandation réelle. « Plus utilisés » est réel (imports non annulés de l'organisation) et n'apparaît qu'avec des données |
| R8 | Fichiers de modèle : **sites complets** et **modèles de thème** ; archive avec médias | Non pris en charge (page, section, composant seulement). Les médias ne sont jamais copiés |
| R9 | Partage entre sites de **compositions** et de **composants** | Seuls les modèles de page se partagent (les composants « globaux » existants le sont déjà, d'une autre façon) |
| R10 | « Ensemble de modèles » à enregistrer | Non réalisé |
| R11 | Position « après la section N » dans l'écran d'import de section | Prise en charge par l'API (`position: after`), l'écran propose début / fin |
| R12 | Annulation d'un import : **brouillon de styles** non revenu en arrière ; refusée dès qu'une page a été modifiée | Par conception (annulation sûre, tout ou rien) ; signalé dans la réponse |
| R13 | Enregistrement depuis le **Page Builder** (« Enregistrer comme modèle ») | Comportement historique conservé (remplace un modèle du même nom, sans métadonnées) ; la bibliothèque refuse le remplacement implicite et permet d'ajouter secteur / mots-clés / visibilité après coup |
| R14 | Numérotation des usages | « Plus utilisés » compte les imports des sites de l'organisation et du site principal (la table des imports ne porte pas l'organisation) : valable avec une organisation ; avec plusieurs, les imports du site principal et les identifiants `mine:<n>` identiques pourraient s'additionner (nombres seulement, jamais de contenu) |

## C. Non vérifié ou limité
| Point | État |
|---|---|
| Navigateurs | Chrome (Playwright) : parcours complet ; **Firefox** (WebDriver BiDi) : test de fumée de la bibliothèque (voir TESTS). **Safari et Edge : non testés** (Safari non activable ici, Edge refuse de démarrer sous Playwright sur cette machine) |
| Accessibilité | Noms accessibles, clavier (onglets fléchés, Échap, focus rendu), contrôle des libellés automatisé ; **pas d'axe-core, de Lighthouse ni de lecteur d'écran** : aucune conformité WCAG n'est déclarée |
| Performance | Mesurée jusqu'à 99 modèles officiels + 210 modèles du site (voir TESTS) ; le filtre « compatibilité » construit tout le catalogue (pas de cache) ; pas de test à plusieurs milliers de modèles |
| Charge | Aucun test de charge sur un serveur réel exposé (interdit en production) |
| Suite complète `npm test` | Non rejouée en entier pour ce programme ; lots ciblés et résultats exacts dans TESTS |
| Textes d'exemple | Fournis en français uniquement ; ils sont des consignes entre crochets, à remplacer ; le moteur ne bloque pas leur publication (la qualité de page peut les signaler) |
| Isolation multi-organisations | Testée au niveau du service et par requêtes (secteurs d'une autre organisation invisibles) ; pas de parcours HTTP complet avec deux organisations |

## D. Pour passer au Programme 20.5
Les modèles et leur API sont stables. Prérequis : décider D1 (fusion de 20.2 ou abandon) et D2 (affectations de thème par site), puis choisir parmi R1, R3, R6, R8 selon la priorité produit. Les ajouts présents sur `main` pendant ce travail (assistant de création de site, générateur de pages par IA) n'ont pas été modifiés par 20.4 ; leurs tests `assistant-creation-site` et `page-generator` ont été rejoués dans les lots (voir TESTS). Le Programme 20.5 n'a pas été commencé.
