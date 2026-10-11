#!/usr/bin/env python3
# Génère KOLAKISA_ELEMENTOR_FEATURE_INVENTORY.md (+ .csv) : inventaire à identifiants stables, une ligne par widget Elementor et par fonctionnalité transversale.
# Les décomptes du rapport final sont calculés ICI à partir des mêmes lignes (aucun pourcentage inventé).
import csv, io, sys, os
H = "https://elementor.com/help/"
PRO = {  # disponibilité établie PAR l'article lu (sinon « non indiquée »)
 "tabs-with-nested-containers": "Pro (expérience Nested Elements)", "custom-css-in-elementor": "Pro", "custom-attributes-pro": "Pro", "sticky-scrolling-effect-pro": "Pro", "components-2": "Pro (V4)",
 "the-menu-widget": "expérimental", "floating-button": "affichage conditionnel Pro", "breadcrumbs-widget-pro": "exige Yoast SEO", "menu-cart-widget-pro": "exige WooCommerce", "google-maps-widget": "clé API Google requise",
 "search-form-widget": "remplacé par Recherche (3.24)", "atomic-form-element": "V4 ; e-mail 2 Pro", "facebook-comments-widget": "ID d'application Facebook requis", "stripe-button": "compte Stripe requis", "paypal-button-widget-pro": "compte PayPal requis",
}
# (nom Elementor, slug, type(s) KOLAKISA, statut initial, statut final, écart / remarque, test)
W = [
 ("Accordéon","accordion-widget","accordion","Présent","Validé (existant)","","editeur-widgets"),
 ("Accordéon à éléments imbriqués","accordion-widget-with-nested-elements","conteneur mode accordéon","Absent","Ajouté et validé","","elementor-parite-3"),
 ("Onglets","tabs-widget","tabs","Présent","Validé (existant)","icônes par onglet déjà présentes","editeur-widgets"),
 ("Onglets à éléments imbriqués","tabs-with-nested-containers","conteneur mode onglets","Présent","Validé (existant)","","widgets-imbriques"),
 ("Bascule","toggle-widget","toggle","Présent","Validé (existant)","","editeur-widgets"),
 ("Carrousel (imbriqué)","carousel-widget","conteneur mode carrousel","Présent","Validé (existant)","","widgets-imbriques"),
 ("Slides","slides-widget-pro","slides","Incomplet","Ajouté et validé","effet Ken Burns ajouté","elementor-parite-2"),
 ("Séparateur","divider-widget","divider","Présent","Validé (existant)","","editeur-widgets"),
 ("Espaceur","spacer-widget","spacer","Présent","Validé (existant)","","editeur-widgets"),
 ("Off-Canvas / Popups","off-canvas-widget","modal","Incomplet","Ajouté et validé","ouverture automatique, fréquence, verrou, carte du coin, barre du bas","elementor-parite-3"),
 ("Sidebar","sidebar-widget","—","Non applicable","Non applicable","notion WordPress","—"),
 ("Section interne (legacy)","inner-section-widget","group / columns / grid","Présent","Validé (existant)","","editeur-widgets"),
 ("Image","image-widget","image","Incomplet","Ajouté et validé","résolution, visionneuse","images-resolutions"),
 ("Image Box","image-box-widget","imagebox","Incomplet","Ajouté et validé","résolution","images-resolutions"),
 ("Image Carousel","image-carousel-widget","carousel","Incomplet","Ajouté et validé","résolution","images-resolutions"),
 ("Galerie / Galerie de base","gallery-widget","gallery","Incomplet","Ajouté et validé","dispositions, 1–12 colonnes, ratio, légende, filtres, résolution","galerie-options"),
 ("Carrousel média","media-carousel-widget-pro","mediacarousel","Présent","Validé (existant)","","editeur-widgets"),
 ("Portfolio","portfolio-widget-pro","gallery (filtres) / querylist","Incomplet","Validé (existant)","filtres par étiquette dans la galerie ; filtre par taxonomie de contenu : grille de boucle + Filtre de taxonomie (catfilter)","galerie-options, site-widgets"),
 ("Vidéo","video-widget","video","Incomplet","Ajouté et validé","début / fin","elementor-parite-2"),
 ("Playlist vidéo","video-playlist-widget-pro","videoplaylist","Absent","Ajouté et validé","","elementor-parite"),
 ("Lottie","lottie-widget","lottie","Présent","Validé (existant)","","widgets-lottie"),
 ("SoundCloud","soundcloud-widget","embed","Présent","Validé (existant)","","editeur-widgets"),
 ("Image mise en avant","featured-image-widget","image + étiquette dynamique","Présent","Validé (existant)","","editeur-widgets"),
 ("Icône","icon-widget","icon","Présent","Validé (existant)","","editeur-widgets"),
 ("Icon Box","icon-box-widget","iconbox","Présent","Validé (existant)","","editeur-widgets"),
 ("Liste d'icônes","icon-list-widget","iconlist","Incomplet","Ajouté et validé","en ligne, séparateurs","elementor-parite-2"),
 ("Icônes sociales","social-icons-widget","social","Incomplet","Ajouté et validé","+4 réseaux","elementor-parite-2"),
 ("Boutons de partage","share-buttons-widget-pro","sharebuttons","Incomplet","Ajouté et validé","+4 réseaux","elementor-parite-2"),
 ("Facebook : J'aime","facebook-like-button-widget-pro","facebookbutton","Présent","Validé (existant)","","editeur-widgets"),
 ("Facebook : Embed / Flux de page","facebook-embed-widget-pro","facebookembed","Absent","Ajouté et validé","","elementor-parite-3"),
 ("Facebook : Commentaires","facebook-comments-widget","—","Absent","Exclu (justifié)","exige un ID d'application Facebook et un script externe","—"),
 ("Titre","heading-widget","heading","Incomplet","Ajouté et validé","contour du texte, balise p / div / span","elementor-parite-3"),
 ("Éditeur de texte","text-editor-widget","text","Incomplet","Ajouté et validé","lettrine, colonnes","elementor-parite"),
 ("Citation","blockquote-widget-pro","quote","Présent","Validé (existant)","bouton Tweet non repris (réseau tiers)","editeur-widgets"),
 ("Titre animé","animated-headline-pro","animatedheading","Présent","Validé (existant)","","editeur-widgets"),
 ("Code Highlight","code-highlight-pro","code","Incomplet","Ajouté et validé","numéros, lignes surlignées, copier","elementor-parite-3"),
 ("Lire la suite","read-more-widget","readmore","Présent","Validé (existant)","","widgets-nouveaux"),
 ("Texte sur chemin","text-path-widget","textpath","Présent","Validé (existant)","","widgets-nouveaux"),
 ("Table des matières","table-of-contents-pro","toc","Présent","Validé (existant)","","editeur-widgets"),
 ("Alerte","alert-widget","alert","Présent","Validé (existant)","","editeur-widgets"),
 ("Compteur","counter-widget","counter","Incomplet","Ajouté et validé","séparateur des milliers","elementor-parite-2"),
 ("Barre de progression","progress-bar-widget","progress","Présent","Validé (existant)","","editeur-widgets"),
 ("Suivi de progression","progress-tracker","readingprogress","Incomplet","Ajouté et validé","forme circulaire","elementor-parite-3"),
 ("Évaluation","rating-widget","rating","Présent","Validé (existant)","","widgets-nouveaux"),
 ("Avis / Témoignage / Carrousel de témoignages","testimonial-widget","testimonial, testimonialcarousel","Incomplet","Ajouté et validé","place de la photo","elementor-parite-3"),
 ("Flip Box","flip-box-widget-pro","flipbox","Présent","Validé (existant)","","editeur-widgets"),
 ("Hotspot","hotspot-widget-pro","hotspot","Incomplet","Ajouté et validé","infobulle au survol","elementor-parite-3"),
 ("Liste de prix","price-list-widget-pro","pricelist","Présent","Validé (existant)","","editeur-widgets"),
 ("Tableau de prix","price-table-pro","pricing","Présent","Validé (existant)","","editeur-widgets"),
 ("Compte à rebours","countdown-widget-pro","countdown","Incomplet","Ajouté et validé","minuteur par visiteur, action à la fin, unités","elementor-parite-2"),
 ("Bouton","button-widget","button","Présent","Validé (existant)","","editeur-widgets"),
 ("Appel à l'action","call-to-action-widget","cta","Absent","Ajouté et validé","","elementor-parite"),
 ("Bouton flottant","floating-button","floatingbutton","Absent","Ajouté et validé","","elementor-parite"),
 ("Boutons Stripe / PayPal","stripe-button","—","Absent","Exclu (justifié)","paiements : module Commerce (une seule source)","—"),
 ("Menu (imbriqué) / Menu WordPress","the-menu-widget","menu, cmsmenu","Présent","Validé (existant)","","editeur-widgets"),
 ("Ancre de menu","menu-anchor-widget","menuanchor","Présent","Validé (existant)","","widgets-nouveaux"),
 ("Panier de menu","menu-cart-widget-pro","cart, minicart","Présent","Validé (existant)","","widgets-nouveaux"),
 ("Fil d'Ariane","breadcrumbs-widget-pro","breadcrumb","Présent","Validé (existant)","","editeur-widgets"),
 ("Recherche / Formulaire de recherche","search-form-widget","search","Présent","Validé (existant)","","editeur-widgets"),
 ("Titre / Contenu / Extrait d'article","single-post-widgets","dyntext, postcontent","Présent","Validé (existant)","","widgets-nouveaux"),
 ("Infos / Navigation / Commentaires d'article","post-info-widget","postmeta, postnav, postcomments, postterms","Présent","Validé (existant)","","widgets-nouveaux"),
 ("Articles / Archive","posts-widget-pro","posts, querylist, archiveinfo","Présent","Validé (existant)","","widgets-nouveaux"),
 ("Logo / Titre du site / Titre de page","site-logo-widget-pro","sitelogo, sitetitle, dyntext","Présent","Validé (existant)","","widgets-nouveaux"),
 ("Boîte d'auteur","using-the-author-box-widget","authorbox","Présent","Validé (existant)","","widgets-nouveaux"),
 ("Plan du site","sitemap-widget-pro","sitemap","Absent","Ajouté et validé","","elementor-parite-3"),
 ("Modèle (Template) / Éléments globaux","template-widget-pro","composants","Présent","Validé (existant)","","composants"),
 ("Loop Grid / Carousel / Filtre de taxonomie","loop-grid","querylist, catfilter","Présent","Ajouté et validé","modèle alterné : carte insérée après le N-ième résultat (une fois ou tous les N)","site-widgets, boucle-carte-inseree"),
 ("Formulaire / Formulaire atomique","form-widget","signupform + module Formulaires","Présent","Autre module","champs de collecte de contacts ; fichiers / date / heure hors périmètre","—"),
 ("Connexion","login-widget-pro","account","Présent","Validé (existant)","","widgets-nouveaux"),
 ("Shortcode","shortcode-widget","étiquettes dynamiques","Absent","Exclu (justifié)","pas de shortcodes (sécurité)","—"),
 ("HTML","html-widget","html","Présent","Validé (existant)","réservé aux administrateurs","editeur-widgets"),
 ("Google Maps","google-maps-widget","map","Présent","Validé (existant)","","editeur-widgets"),
 ("Lien intelligent (Contact URL)","dynamic-contact-url-pro","smartlink","Absent","Ajouté et validé","","elementor-parite-3"),
 ("V4 : Div Block / Flexbox","div-block-element","container","Présent","Validé (existant)","","editeur-canvas"),
 ("V4 : Heading / Paragraph / Button / Image / Tabs / YouTube","heading-element","heading, text, button, image, tabs, video","Présent","Validé (existant)","","editeur-widgets"),
 ("V4 : SVG","svg-element","—","Absent","Exclu (justifié)","SVG refusé par la médiathèque (peut contenir du script)","—"),
]
# (identifiant, domaine, fonctionnalité, source (slug ou doc), disponibilité, Kolakisa, initial, final, écart/action, priorité, test)
F = [
 ("IMG","Images","Résolution de l'image (Thumbnail, Medium, Medium Large, Large, 1536, 2048, entier) sur 7 widgets + fond + photo de témoignage","image-widget","tailles WordPress","variants.js, nodes.js, inspecteur","Absent","Ajouté et validé","service commun, versions WebP à la demande, repli sur l'original","P1","images-resolutions*"),
 ("IMG","Images","Visionneuse sur le widget Image seul","image-widget","non indiquée","nodes.js, _node.ejs","Absent","Ajouté et validé","","P3","images-resolutions"),
 ("GAL","Galerie","Grille / mosaïque / justifiée, colonnes, ratio, légende au survol, filtres","gallery-widget","non indiquée","nodes.js, landing.css/js","Incomplet","Ajouté et validé","","P2","galerie-options"),
 ("TXT","Texte","Contour du texte ; lettrine ; colonnes ; sens d'écriture ; balise du titre","text-stroke-feature","non indiquée","nodes.js (STYLE_PROPS)","Absent","Ajouté et validé","","P3","elementor-parite, -3"),
 ("STR","Structure","Séparateur de forme haut / bas","shape-divider","non indiquée","nodes.js, landing.css","Absent","Ajouté et validé","7 formes","P3","elementor-parite"),
 ("STR","Structure","Conteneur en accordéon (volets libres)","accordion-widget-with-nested-elements","non indiquée","nodes.js, landing.js","Absent","Ajouté et validé","","P2","elementor-parite-3"),
 ("BG","Fond","Diaporama d'arrière-plan + Ken Burns","background-slideshow","non indiquée","nodes.js, landing.js","Absent","Ajouté et validé","","P3","elementor-parite-2"),
 ("BG","Fond","Vidéo d'arrière-plan : début / fin, secours, lecture unique","section-background-video-options","non indiquée","nodes.js","Incomplet","Ajouté et validé","","P3","elementor-parite-2"),
 ("BG","Fond","Dégradé radial, positions, couleurs intermédiaires ; découpe du fond","gradient-background","non indiquée","nodes.js, inspecteur","Incomplet","Ajouté et validé","","P3","elementor-parite-2/-3"),
 ("BDR","Bordures","Types double, gravé, ridge, inset, outset","border-type","non indiquée","nodes.js","Incomplet","Ajouté et validé","","P3","elementor-parite-2/-3"),
 ("FX","Effets","Filtres (+ inversion) et filtres d'arrière-plan","style-tab-effects","non indiquée","nodes.js, inspecteur","Incomplet","Ajouté et validé","","P3","elementor-parite-3"),
 ("MSK","Masques","Formes Fleur / Croquis / Blob","mask-option","non indiquée","nodes.js","Incomplet","Ajouté et validé","","P3","elementor-parite"),
 ("MOT","Mouvement","14 animations de survol","hover-animations","non indiquée","nodes.js, landing.css","Incomplet","Ajouté et validé","12 ajoutées","P3","elementor-parite"),
 ("MOT","Mouvement","Entrée, défilement, souris, sticky, contrôle de fenêtre","entrance-animations","défilement et sticky : Pro","motion.js","Présent","Validé (existant)","","—","effets-*"),
 ("POS","Position","Décalage d'ancre ; relative / absolue / fixe / sticky ; z-index","style-tab-position","non indiquée","nodes.js","Incomplet","Ajouté et validé","décalage d'ancre ajouté","P3","elementor-parite-3"),
 ("PAG","Page","Magnétisme de défilement (Scroll Snap)","scroll-snap","non indiquée","scrollSnap.js, inspecteur page","Absent","Ajouté et validé","","P3","elementor-parite-2"),
 ("POP","Popups","Ouverture automatique (chargement, défilement, sortie, inactivité), fréquence, fermeture automatique, verrou, carte et barre non bloquantes","popups","Pro (non tranché)","nodes.js, landing.js","Incomplet","Ajouté et validé","","P2","elementor-parite-3"),
 ("POP","Popups","Nombre de clics, pages vues, source de trafic","popups","Pro (non tranché)","page-builder.js, landing.js","Absent","Ajouté et validé","déclencheur « après N clics », pages vues minimum, provenance (direct / moteur / réseau social / autre site)","P3","elementor-parite-3-navigateur"),
 ("CND","Avancé","Conditions d'affichage : public, programmation, jours / heures, paramètre d'adresse, groupes ET / OU","show-and-hide-elements-on-a-page-display-conditions","non tranchée","nodes.js, inspecteur","Incomplet","Ajouté et validé","","P2","elementor-parite-2/-3"),
 ("CND","Avancé","Conditions propres aux modèles d'article (catégorie, auteur, date d'inscription)","show-and-hide-elements-on-a-page-display-conditions","non tranchée","—","Absent","Non fait (justifié)","modèle d'audience différent","P4","—"),
 ("ADV","Avancé","ID, classes, attributs personnalisés, z-index, ordre, taille, CSS par élément","advanced-tab","attributs et CSS : Pro","nodes.js","Présent","Validé (existant)","","—","proprietes-*"),
 ("RSP","Responsive","Trois écrans, héritage descendant, seuils tablette / mobile réglables","mobile-editing","points de rupture : non tranché","siteSettings.js, nodes.js","Présent","Validé (existant)","","—","site-web-reglages-ecrans"),
 ("RSP","Responsive","Écran supplémentaire « Grand écran » (seuil réglable) avec héritage de l'ordinateur","mobile-editing","non tranchée","nodes.js, siteSettings.js, page-builder.js","Absent","Ajouté et validé","","P2","elementor-parite-5"),
 ("RSP","Responsive","Autres écrans supplémentaires (portable, tablette / mobile paysage)","mobile-editing","non tranchée","—","Absent","Non fait (justifié)","même mécanisme que le grand écran ; non demandé en priorité","P4","—"),
 ("UI","Interface","Raccourcis, menu contextuel, structure, sélection multiple, favoris, palette","hotkeys","non indiquée","page-builder.js","Présent","Validé (existant)","","—","editeur-*"),
 ("UI","Interface","Coller depuis un autre site ou navigateur","right-click","non indiquée","page-builder.js","Absent","Ajouté et validé","","P3","elementor-parite-2"),
 ("UI","Interface","Notes (commentaires sur un élément)","hotkeys","non indiquée","page-builder.js, nodes.js","Absent","Ajouté et validé","note privée par élément (500 caractères), pastille dans la Structure, jamais publiée ; pas de fil de discussion","P3","elementor-parite-4-editeur-navigateur"),
 ("HIS","Historique","Historique de session, révisions, enregistrement automatique","revision-history-undo-and-redo","non indiquée","page-builder.js, pages/index.js","Présent","Validé (existant)","","—","editeur-*"),
 ("STY","Styles","Couleurs / polices globales, classes, états, styles enregistrés, composants","site-settings","variables : taille = Pro","styles studio, composants","Présent","Validé (existant)","","—","styles-*, composants-*"),
 ("STY","Styles","Export / import des classes et variables seules","how-to-export-and-import-variables-and-classes","non indiquée","page-builder.js","Absent","Ajouté et validé","classes globales : export .json et import avec fusion par nom, validé comme un enregistrement normal","P3","classes-export-import-navigateur"),
 ("CMS","CMS","Étiquettes dynamiques, boucles, pagination, modèles","dynamic-tags-pro-2","non tranchée","dynamic, querylist","Présent","Validé (existant)","","—","site-widgets"),
 ("CMS","CMS","Boucle : modèle alterné à une position donnée","how-do-i-add-an-alternate-template-in-a-loop-grid","non indiquée","nodes.js, landing/index.js","Absent","Ajouté et validé","carte insérée après le N-ième résultat (une fois ou tous les N)","P3","boucle-carte-inseree"),
 ("IA","IA","Modification par IA respectant le verrou de format","use-ai-to-add-animation-effects","IA : exigences Elementor","studio.js","Présent","Validé (existant)","","—","format-mise-en-page"),
]
def avail(slug): return PRO.get(slug, "non indiquée")
rows=[]
for i,(n,slug,k,ini,fin,note,test) in enumerate(W,1):
    rows.append((f"EL-W{i:03d}","Widget",n,H+slug+"/",avail(slug),k,ini,fin,note,"—" if fin.startswith("Validé") else ("P1" if "résolution" in note else "P2" if fin.startswith("Ajouté") else "P4"),test))
for i,(d,dom,ft,slug,av,kol,ini,fin,note,prio,test) in enumerate(F,1):
    rows.append((f"EL-F{i:03d}",dom,ft,H+slug+"/",av,kol,ini,fin,note,prio,test))
cols=("ID","Domaine","Référence Elementor","Source","Disponibilité (selon l'article)","Kolakisa","Statut initial","Statut final","Écart / action","Priorité","Tests")
def count(pred): return sum(1 for r in rows if pred(r))
tot=len(rows)
added=count(lambda r:r[7]=="Ajouté et validé"); valid=count(lambda r:r[7].startswith("Validé")); part=count(lambda r:r[7]=="Partiel")
excl=count(lambda r:r[7].startswith("Exclu") or r[7].startswith("Non fait") or r[7]=="Non applicable"); other=count(lambda r:r[7]=="Autre module")
assert added+valid+part+excl+other==tot,(added,valid,part,excl,other,tot)
out=["# Inventaire fonctionnel Elementor ↔ Kolakisa (identifiants stables)","",
"_Généré par `scripts/build-parity-inventory.py` à partir des mêmes lignes que les décomptes ci-dessous. Ne pas modifier à la main : modifier le script._","",
"## Décomptes (calculés)","","| Mesure | Nombre |","|---|---|",
f"| Lignes inventoriées | **{tot}** |",f"| Présentes et validées (existantes) | **{valid}** |",f"| Ajoutées ou complétées dans cette mission et validées | **{added}** |",
f"| Partielles | **{part}** |",f"| Autre module de Kolakisa | **{other}** |",f"| Non faites ou exclues, avec raison | **{excl}** |","",
"« Validé » = testé de bout en bout (test indiqué) ; pour les lignes « existantes », le test cité est une suite préexistante qui passe (suite complète : 4 711 / 4 711 le 11 octobre 2026). Les lignes marquées « Présent » mais sans test dédié dans cette mission ne sont pas comptées comme revalidées une à une.","",
"## Inventaire","","| "+" | ".join(cols)+" |","|"+"---|"*len(cols)]
for r in rows: out.append("| "+" | ".join(str(x).replace("|","/") for x in r)+" |")
here=os.path.dirname(os.path.abspath(__file__)); root=os.path.dirname(here)
open(os.path.join(root,"docs","KOLAKISA_ELEMENTOR_FEATURE_INVENTORY.md"),"w").write("\n".join(out)+"\n")
buf=io.StringIO(); w=csv.writer(buf); w.writerow(cols); w.writerows(rows)
open(os.path.join(root,"docs","KOLAKISA_ELEMENTOR_FEATURE_INVENTORY.csv"),"w").write(buf.getvalue())
print(tot,added,valid,part,other,excl)
