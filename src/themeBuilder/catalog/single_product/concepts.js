// id|nom|secteur|galerie|infos|contenu|achat|signature|briques
const raw = `
A01|Atelier vertical|Généraliste|V|R|TAB|IN|Vignettes verticales, onglets|G1
A02|Rail horizontal|Mode|H|K|ACC|STK|Vignettes sous l'image, infos collantes|G1
A03|Grille double|Déco|G|K|SEC|CARD|Images en grille 2 colonnes, achat en carte|G1
A04|Pile pleine largeur|Luxe|S|O|EDI|BAR|Images empilées, infos flottantes sur l'image|G1
A05|Carrousel plein cadre|Photo|C|B|FLAT|DRAW|Carrousel large, achat en tiroir|G1
A06|Mosaïque asymétrique|Déco|M|L|SEC|IN|Cinq images en mosaïque|G1
A07|Loupe joaillière|Bijoux|Z|R|SPEC|CARD|Image unique, loupe macro|G1
A08|Boutique latérale|Généraliste|V|L|ACC|IN|Galerie à droite, barre latérale catégories|G1
A09|Défilement rapide|Streetwear|S|K|FLAT|BAR|Images en défilement vertical, barre mobile|G1
A10|Héros plein écran|Sneakers|F|B|TAB|STK|Visuel 100 % de la hauteur, achat sous le pli|G1
B01|Guide des tailles|Mode|V|R|ACC|CARD|Tableau des tailles intégré|G1,V1,S1
B02|Pastilles couleur|Mode|H|R|FLAT|IN|Pastilles couleur qui changent l'image|G1,V1
B03|Look complet|Mode|G|C3|SEC|CARD|Tenue complète et produits à associer|G1,P1,F1
B04|Lookbook|Mode|M|Ctr|EDI|IN|Récit éditorial puis fiche|G1
B05|Drop limité|Sneakers|F|O|FLAT|BAR|Page de lancement, stock réel affiché|G1,V1
B06|Maroquinerie|Sacs|Z|L|SPEC|STK|Détails matière, loupe sur coutures|G1,S1
B07|Capsule saison|Mode|T|K|SEC|IN|Volet image fixe, texte qui défile|G1
B08|Chaussure de ville|Chaussures|V|K|TAB|CARD|Pointures avec stock par pointure|G1,V1
B09|Basiques enfants|Enfants|H|R|ACC|IN|Tailles par âge, couleurs vives|G1,V1
B10|Lingerie douce|Mode|S|Ctr|FLAT|DRAW|Fiche discrète, tiroir d'achat|G1,V1
C01|Noir et or|Luxe|Z|Ctr|EDI|IN|Page monochrome, grands blancs|G1
C02|Maison de montres|Montres|V|L|SPEC|CARD|Calibre et caractéristiques détaillées|G1,S1
C03|Écrin|Bijoux|S|R|SEC|STK|Coffret cadeau et gravure|G1,X1
C04|Salon privé|Luxe|F|B|EDI|DRAW|Accès sur demande, contact conseiller|G1
C05|Pièce unique|Art|Z|K|FLAT|CARD|Un seul exemplaire, certificat|G1
C06|Parfumerie|Parfum|M|Ctr|ACC|IN|Notes olfactives en pyramide|G1,S1
C07|Cave à vins|Boissons|N|R|SPEC|CARD|Étiquette, millésime, accords|S1
C08|Haute joaillerie|Bijoux|C|O|TAB|BAR|Carrousel de détails, rendez-vous boutique|G1
C09|Cuir et patine|Maroquinerie|G|L|SEC|IN|Gros plans matière en grille|G1
C10|Édition numérotée|Luxe|T|Ctr|EDI|STK|Numéro de série, récit de fabrication|G1
D01|Routine soin|Beauté|S|L|ACC|CARD|Étapes d'utilisation et ingrédients|G1,S1
D02|Teintes maquillage|Cosmétiques|M|K|TAB|DRAW|Nuancier cliquable|G1,V1
D03|Avant après|Soins|G|R|SEC|IN|Comparaison avant/après|G1,H1
D04|Coffret découverte|Beauté|M|C3|FLAT|STK|Produits du coffret en liste|G1,GR
D05|Cure abonnement|Bien-être|Z|L|ACC|CARD|Achat unique ou abonnement|G1,X1
D06|Pharmacie douce|Soins|N|R|SPEC|IN|Composition et précautions|S1
D07|Rituel vidéo|Beauté|F|Ctr|TAB|BAR|Vidéo d'application en tête|M1
D08|Naturel|Cosmétiques bio|S|K|EDI|CARD|Labels et origine des ingrédients|G1,S1
D09|Barbier|Soins homme|V|B|FLAT|IN|Bandeau sombre, grande typographie|G1
D10|Parfum personnalisé|Beauté|Z|L|ACC|STK|Texte de gravure sur flacon|G1,X1
E01|Fiche technique|Électronique|V|R|SPEC|STK|Tableau de spécifications complet|G1,S1
E02|Comparateur|Informatique|H|K|TAB|CARD|Comparaison avec d'autres modèles|G1,W1
E03|Casque studio|Audio|F|O|SEC|BAR|Sections par fonction avec ancres|G1,M1
E04|Téléphone|Mobile|C|C3|SPEC|IN|Capacités et coloris en pastilles|G1,V1,S1
E05|Accessoire malin|Mobile|H|R|FLAT|CARD|Compatibilité par modèle|V1
E06|Objectif photo|Photographie|Z|L|TAB|IN|Zoom, exemples de clichés|G1,S1
E07|Éclaté produit|Électronique|N|Ctr|SEC|DRAW|Repères sur l'image|H1
E08|Configuration PC|Informatique|S|K|SPEC|CFG|Options à composer|V1,X1
E09|Offre reconditionnée|Électronique|G|B|ACC|BAR|États et garantie|S1
E10|Test vidéo|Audio|T|K|EDI|STK|Vidéo de test et points forts|M1
F01|Salon scandinave|Mobilier|S|O|SEC|STK|Ambiances et dimensions|G1,S1
F02|Cuisine pro|Cuisine|H|C3|TAB|DRAW|Capacités et accessoires|G1,S1
F03|Atelier déco|Déco|M|Ctr|EDI|CARD|Mise en scène éditoriale|G1
F04|Électroménager|Électroménager|H|L|SPEC|BAR|Classe énergie et dimensions|G1,S1
F05|Livraison volumineuse|Mobilier|V|K|ACC|STK|Délai et montage détaillés|G1,D1
F06|Luminaire|Maison|F|B|FLAT|IN|Visuel d'ambiance plein cadre|G1
F07|Textile maison|Maison|G|R|ACC|CARD|Matières et entretien|G1,V1
F08|Vaisselle|Cuisine|Z|Ctr|SEC|IN|Pièces associées du service|G1,P1
F09|Meuble sur mesure|Mobilier|S|L|FLAT|CFG|Dimensions et finitions à choisir|V1,X1
F10|Art de table|Maison|C|K|TAB|DRAW|Carrousel d'ambiances|G1
G01|Épicerie fine|Alimentaire|C|Ctr|SPEC|IN|Valeurs nutritionnelles, allergènes|G1,S1
G02|Marché du terroir|Alimentaire|N|L|EDI|IN|Producteur et origine|S1
G03|Panier abonnement|Alimentaire|H|R|ACC|CARD|Livraison récurrente|G1,X1
G04|Chocolatier|Alimentaire|F|Ctr|EDI|BAR|Fiche gourmande plein cadre|G1
G05|Thé et café|Boissons|V|K|SEC|IN|Profil de dégustation en jauges|G1,S1
G06|Atelier artisan|Artisanat|M|L|EDI|STK|Histoire du créateur|G1
G07|Poterie|Artisanat|G|R|FLAT|CARD|Pièces uniques et dimensions|G1,V1
G08|Pâtisserie sur commande|Alimentaire|S|R|ACC|CARD|Message personnalisé, délai|G1,X1
G09|Boîte cadeau|Alimentaire|Z|B|SEC|DRAW|Composition du coffret|G1,GR
G10|Bio local|Alimentaire|N|Ctr|TAB|IN|Labels et circuits courts|S1
H01|Équipement sportif|Sport|V|K|TAB|STK|Niveaux et pratiques|G1,V1
H02|Fitness|Sport|T|O|SEC|DRAW|Programme associé|G1
H03|Vélo|Sport|H|R|SPEC|CARD|Géométrie et tailles|G1,S1,V1
H04|Pièces auto|Auto|N|L|SPEC|IN|Compatibilité véhicule|S1
H05|Jouets|Jouets|M|R|ACC|CARD|Âge conseillé et sécurité|G1,S1
H06|Éveil bébé|Enfants|G|Ctr|FLAT|IN|Couleurs douces, conseils|G1
H07|Animalerie|Animaux|H|K|TAB|STK|Taille et race conseillées|G1,V1
H08|Matériel pro|Professionnel|V|C3|SPEC|STK|Tarifs par quantité|S1,Q1
H09|Randonnée|Sport|S|L|SEC|BAR|Poids, contenance, saisons|G1,S1
H10|Atelier outillage|Professionnel|V|B|SPEC|IN|Bandeau titre, références|G1,S1
I01|Logiciel licence|Logiciel|N|Ctr|TAB|CARD|Licences et versions|DL
I02|Livre numérique|Livres|Z|L|EDI|IN|Extrait et sommaire|DL
I03|Formation en ligne|Formation|T|K|SEC|STK|Programme et ce qui est inclus|DL
I04|Pack de ressources|Numérique|G|Ctr|FLAT|CARD|Aperçu des fichiers|DL
I05|Modèle à télécharger|Numérique|F|B|FLAT|BAR|Aperçu plein cadre|DL
I06|Livre papier|Livres|V|R|SPEC|IN|Quatrième de couverture, auteur|G1,S1
I07|Manuel scolaire|Éducatif|H|L|TAB|CARD|Niveau et programme|S1
I08|Kit éducatif|Éducatif|M|C3|SEC|STK|Contenu du kit|G1,GR
I09|Police ou plugin|Logiciel|N|K|ACC|CARD|Démonstration et licence étendue|DL
I10|Cours à l'unité|Formation|C|R|SEC|DRAW|Extraits vidéo|M1,DL
J01|Produit à personnaliser|Personnalisable|Z|K|FLAT|CFG|Aperçu en direct du texte|X1
J02|Lien partenaire|Affiliation|V|R|TAB|CARD|Bouton vers la boutique du partenaire|EX
J03|Lot groupé|Groupé|G|R|ACC|STK|Composition et quantités|GR,G1
J04|Abonnement mensuel|Services|N|Ctr|SEC|CARD|Fréquences et avantages|X1
J05|Précommande|Lancement|F|O|EDI|BAR|Date annoncée, acompte|G1
J06|Vente privée|Mode|S|B|FLAT|DRAW|Accès réservé aux membres|G1
J07|Réservation|Services|T|L|SEC|STK|Créneaux et lieu|X1
J08|Catalogue sans achat|Industrie|V|K|SPEC|IN|Demande de devis|S1
J09|Tarifs dégressifs|B2B|N|K|TAB|CFG|Tableau de prix par quantité|Q1
J10|Cadeau rapide|Cadeaux|H|Ctr|FLAT|DRAW|Achat rapide en trois clics|G1,A1
`.trim().split("\n").map(l=>{const [id,nom,secteur,gal,inf,cont,ach,sig,br]=l.split("|");return {id,nom,secteur,gal,inf,cont,ach,sig,br:br.split(",")}});
module.exports = raw;
if (require.main===module){
  const ids=new Set(raw.map(r=>r.id));
  console.log("count",raw.length,"unique ids",ids.size);
  const key=r=>[r.gal,r.inf,r.cont,r.ach].join("/");
  const dup={};raw.forEach(r=>(dup[key(r)]=dup[key(r)]||[]).push(r.id));
  console.log("tuples identiques:",Object.entries(dup).filter(([,v])=>v.length>1).map(([k,v])=>k+" "+v.join(",")));
  let near=[];
  for(let i=0;i<raw.length;i++)for(let j=i+1;j<raw.length;j++){const a=raw[i],b=raw[j];const d=["gal","inf","cont","ach"].filter(k=>a[k]!==b[k]).length;if(d<2)near.push(a.id+"~"+b.id+" d="+d)}
  console.log("paires a distance<2:",near.length,near.slice(0,40).join(" ; "));
}
