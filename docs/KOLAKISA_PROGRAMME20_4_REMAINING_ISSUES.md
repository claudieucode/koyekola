# KOLAKISA — Programme 20.4 : points restants

Chaque ligne dit ce qui manque, pourquoi, et ce que l'écran affiche à la place. Rien de ce qui suit n'est présenté comme opérationnel dans l'application.

## A. Dépendances d'autres programmes
| # | Point | Effet |
|---|---|---|
| D1 | **Créer un site À PARTIR d'un modèle** : l'assistant de création de `main` (20.2/20.6) utilise déjà les packs ; l'écran de la bibliothèque importe, lui, dans un site **existant** (créer le site, puis « Utiliser ce modèle ») | Deux chemins vers le même import ; pas de bouton « Nouveau site depuis ce modèle » dans la bibliothèque elle-même |
| D2 | Affectations de modèles de thème **par organisation** (limite D2 de 20.3) | L'option « affecter » d'un modèle de thème s'applique à toute l'organisation ; l'écran le dit avant l'import. Corriger demande une migration des affectations (hors périmètre) |

## B. Fonctions du cahier des charges non réalisées ou partielles
| # | Fonction | État |
|---|---|---|
| R1 | Modèles **personnels d'un utilisateur** (visibles de lui seul à travers ses sites) | Non réalisé : les visibilités sont « ce site » et « tous les sites de l'organisation ». Le cahier précisait « si cette fonctionnalité est prévue » |
| R2 | **Image d'aperçu** enregistrée / optimisée ; capture pleine page ; téléversement d'une image d'aperçu par l'utilisateur | Non réalisé volontairement : les aperçus sont des **rendus vivants du moteur** (jamais périmés, aux styles du site), chargés à la demande. Aucune image n'est embarquée, donc aucune licence à documenter (voir la licence affichée dans le détail) |
| R3 | Secteurs **sans aucun modèle officiel** | 9 secteurs sur 48 : Finance, Juridique, Assurance, Architecture, Construction, Écoles, Universités, Cours particuliers, Tourisme. 39 secteurs ont au moins un modèle, mais plusieurs (cabinet, clinique, bien-être, fitness, hôtel) n'ont que 1 à 2 compositions ou gabarits, pas de pack ; mode, beauté, électronique, maison et décoration n'ont que les modèles de boutique **génériques** (aucun texte propre au secteur). Le filtre ne masque rien : il affiche « aucun modèle » |
| R4 | **Boutique** : le moteur est arrivé sur `main` (Programme 20.5) ; les modèles de boutique y sont branchés | Prérequis par site : module « Commerce » activé, boutique ouverte, produits publiés (sinon avertissement et confirmation). Non couverts : pages Panier / Commande / Compte (routes du moteur sous `/boutique`, pas des pages du Page Builder), produits variables / numériques (aucun modèle spécifique), modèles de **pages produit par catégorie** |
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

## D. Pour la suite
Les modèles et leur API sont stables. À décider : D2 (affectations de thème par site), puis choisir parmi R1, R3, R6, R8 selon la priorité produit. Les chantiers arrivés sur `main` pendant ce travail (assistant de création de site, générateur de pages / de design / de contenus par IA, boutique, constructeur de boutique par IA) n'ont pas été modifiés par 20.4, à une exception près (un paramètre `confirm: true` dans l'appel d'import de l'assistant de création de site, voir IMPLEMENTATION §3) ; leurs tests `assistant-creation-site`, `page-generator`, `programme20-5-boutique-builder` ont été rejoués. Aucun travail du Programme suivant n'a été commencé par 20.4.
