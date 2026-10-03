// Registre des règles d'audit SEO. Chaque règle : identifiant, catégorie, gravité, message, recommandation, correction
// automatique éventuelle. La gravité suit des critères documentés (SEO_CORE.md) :
//   critical : la page ne peut pas être correctement indexée ou affichée (noindex dans le plan du site, JSON-LD invalide…)
//   high     : problème net qui pénalise l'affichage ou la compréhension (titre absent, lien cassé, image introuvable…)
//   medium   : à corriger, effet probable mais limité (contenu faible, page orpheline, chaîne de redirections…)
//   low      : amélioration conseillée (longueur d'un titre, dimensions d'image…)
//   info     : constat sans action obligatoire
// Les messages décrivent un constat ou une analyse, jamais une promesse de classement.
const SEVERITIES = { critical: { label: "Critique", weight: 10 }, high: { label: "Élevée", weight: 5 }, medium: { label: "Moyenne", weight: 3 }, low: { label: "Faible", weight: 1 }, info: { label: "Info", weight: 0 } };
const CATEGORIES = { indexability: "Indexabilité", metadata: "Métadonnées", content: "Contenu", links: "Liens", images: "Images", schema: "Données structurées", technical: "Technique" };

const R = (id, category, severity, title, recommendation, extra = {}) => ({ id, category, severity, title, recommendation, ...extra });
const RULES = [
  R("noindex_in_sitemap", "indexability", "critical", "Page en noindex présente dans le plan du site", "Retirer la page du plan du site ou la rendre indexable : les deux consignes se contredisent."),
  R("sitemap_url_error", "indexability", "critical", "Adresse du plan du site en erreur ou redirigée", "Le plan du site ne doit contenir que des adresses qui répondent directement (200)."),
  R("robots_blocks_sitemap", "indexability", "critical", "Adresse du plan du site interdite par robots.txt", "Retirer la règle robots.txt qui bloque cette adresse, ou la retirer du plan du site."),
  R("x_robots_noindex", "indexability", "high", "En-tête X-Robots-Tag noindex sur une page indexable", "Vérifier la configuration du serveur pour cette page."),
  R("canonical_missing", "indexability", "high", "Canonical absente", "Chaque page indexable doit déclarer son adresse canonique."),
  R("canonical_broken", "indexability", "high", "Canonical vers une adresse en erreur ou redirigée", "La canonical doit pointer vers une adresse qui répond 200."),
  R("canonical_other", "indexability", "info", "Canonical vers une autre adresse", "Normal si le contenu a été publié ailleurs en premier ; sinon, vider l'URL canonique."),
  R("title_missing", "metadata", "critical", "Titre (<title>) absent", "Renseigner un titre."),
  R("title_multiple", "metadata", "high", "Plusieurs balises <title>", "Une seule balise <title> par page."),
  R("title_duplicate", "metadata", "high", "Titre identique à celui d'une autre page", "Chaque page indexable devrait avoir un titre unique qui décrit son sujet."),
  R("title_too_long", "metadata", "low", "Titre long (risque d'être coupé)", "Au-delà d'environ 60 caractères, Google coupe souvent le titre : placer l'essentiel au début."),
  R("title_too_short", "metadata", "low", "Titre très court", "Un titre plus descriptif aide à comprendre le sujet de la page."),
  R("description_missing", "metadata", "high", "Méta description absente", "Rédiger 120 à 160 caractères qui résument la page."),
  R("description_duplicate", "metadata", "medium", "Méta description identique à celle d'une autre page", "Chaque page devrait avoir sa propre description."),
  R("description_length", "metadata", "low", "Méta description trop courte ou trop longue", "Viser environ 70 à 160 caractères."),
  R("h1_missing", "content", "high", "Aucun titre H1", "La page doit avoir un titre principal (H1)."),
  R("h1_multiple", "content", "medium", "Plusieurs titres H1", "Un seul H1 par page ; utiliser H2/H3 pour les sections."),
  R("heading_skip", "content", "low", "Niveau de titre sauté", "Un H3 suit un H2, un H4 suit un H3."),
  R("thin_content", "content", "medium", "Contenu potentiellement faible", "Le contenu est court au regard du type de page : l'enrichir si le sujet le demande."),
  R("long_without_h2", "content", "low", "Long texte sans intertitre", "Découper avec des titres H2 aide la lecture."),
  R("near_duplicate", "content", "medium", "Contenu très similaire à une autre page", "Analyse de similarité des textes : différencier les contenus, les fusionner, ou indiquer une canonical."),
  R("cannibalization", "content", "medium", "Conflit potentiel de ciblage (cannibalisation)", "Deux contenus semblent viser la même recherche : différencier leurs sujets ou leurs mots-clés, ou les fusionner."),
  R("broken_internal_link", "links", "high", "Lien interne cassé", "Corriger ou retirer le lien (ou créer une redirection depuis l'adresse disparue)."),
  R("link_to_redirect", "links", "low", "Lien interne vers une adresse redirigée", "Pointer directement vers l'adresse finale.", { fix: "replace_redirected_links" }),
  R("broken_external_link", "links", "medium", "Lien externe cassé (404 / 410)", "Le site cible répond que la page n'existe plus : mettre à jour ou retirer le lien."),
  R("external_unreachable", "links", "info", "Lien externe injoignable lors de la vérification", "Le site cible n'a pas répondu (délai, refus, robot bloqué) : vérifier à la main."),
  R("orphan_page", "links", "medium", "Page orpheline (aucun lien interne vers elle)", "Ajouter au moins un lien depuis une page pertinente du site."),
  R("weak_inlinks", "links", "low", "Contenu relié uniquement par le menu ou une liste", "Ajouter des liens depuis le texte d'autres pages (maillage interne)."),
  R("image_alt_missing", "images", "medium", "Image sans attribut alt", "Décrire l'image (ou alt vide si elle est purement décorative)."),
  R("image_broken", "images", "high", "Image introuvable", "Le fichier de l'image n'existe pas : la remplacer."),
  R("image_heavy", "images", "low", "Image lourde", "Au-delà de 400 Ko, compresser l'image (WebP, AVIF) accélère la page."),
  R("image_no_dimensions", "images", "low", "Image sans dimensions", "Indiquer largeur et hauteur évite que la page « saute » pendant le chargement."),
  R("og_image_missing", "images", "low", "Pas d'image de partage", "Une image rend le partage sur les réseaux plus visible."),
  R("schema_invalid", "schema", "critical", "Données structurées invalides", "Corriger le JSON-LD de la page."),
  R("schema_problem", "schema", "high", "Données structurées incomplètes", "Compléter la propriété signalée."),
  R("viewport_missing", "technical", "critical", "Balise viewport absente (mobile)", "Ajouter <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">."),
  R("html_lang_missing", "technical", "low", "Langue de la page non déclarée", "Ajouter l'attribut lang à la balise <html>."),
  R("slow_response", "technical", "medium", "Réponse lente du serveur", "Plus de 1,5 s pour produire la page (mesuré depuis le serveur lui-même)."),
  R("redirect_chain", "technical", "medium", "Chaîne de redirections", "Mener directement à la destination finale.", { fix: "shorten_chain" }),
  R("not_found_hits", "technical", "high", "Adresse introuvable visitée par des personnes", "Créer une redirection vers la page la plus proche (Erreurs 404)."),
  R("url_format", "technical", "low", "Adresse peu lisible", "Adresse courte, en minuscules, avec des tirets, sans caractère spécial."),
];
const BY_ID = Object.fromEntries(RULES.map((r) => [r.id, r]));

module.exports = { RULES, BY_ID, SEVERITIES, CATEGORIES };
