# Registre des layouts (55)

Un layout = (constructeur, paramètres, contraintes de contenu). Aucun layout n'est un widget. Un layout dont le contenu requis manque est écarté **avec sa raison** (jamais de remplissage).

| Famille | Nb | Layouts |
|---|---|---|
| Éditorial | 11 | Editorial Split · Magazine · Asymmetric Editorial · Large Typography · Image-led · Multi-column · Long-form Article · FAQ Split · Testimonials Featured · Gallery Grid · Gallery Masonry |
| Corporate | 13 | Corporate Split · Executive Overview · Structured Corporate Grid · Company Profile · Corporate Storytelling · Corporate Services · Numbered Services · Process Columns · FAQ Stacked · Testimonials Grid · Team Grid · Partner Logos · Contact Split |
| Créatif | 6 | Creative Asymmetric Grid · Portfolio Mosaic · Experimental Grid · Overlapping Composition · Layered Visual · Fullscreen Creative |
| Commercial | 7 | Product-focused · Conversion-focused · Centered CTA · Promotional Grid · Pricing Comparison · Service Showcase · Feature Comparison |
| Immersif | 5 | Fullscreen Hero · Full-bleed Image · Immersive Storytelling · Layered Hero · Visual Narrative |
| Minimaliste | 7 | Minimal Grid · Open Space · Typography-led · Minimal Split · Focused Content · Process Vertical · Team Round |
| E-commerce | 6 | Product Gallery · Product Detail · Category Showcase · Collection Grid · Editorial Commerce · Promotional Commerce |

Rôles couverts : hero, intro, text, services, benefits, steps, stats, team, testimonials, pricing, compare, faq, gallery/portfolio, logos, contact, cta, products, categories, detail.

Non générés : « Scroll-based Sections » (animations de défilement : nœud `motion` existant mais non piloté par ce moteur) ; « Video Hero » (aucun layout vidéo : la vidéo reste le nœud `video` posé à la main) ; formulaire de contact dans l'arbre (section `form` native hors de ce moteur).
Certains noms de la mission partagent une structure avec un autre layout et ne diffèrent que par les paramètres (ex. Magazine / Large Typography : taille du titre) ; les variantes proposées à l'écran sont dédoublonnées par **signature structurelle**.
