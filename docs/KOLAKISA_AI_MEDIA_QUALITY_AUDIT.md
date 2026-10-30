# Audit de la qualité des médias (22.1)

**Palier 22.1 · 2026-10-30 · Données : `docs/quality-lab/results.json`.**

## Mesures
| Mesure | Résultat |
|---|---|
| Images dans les 53 pages publiées | **0** |
| Bandeaux (hero) avec image | 0 |
| Fournisseur d'images réel vérifié | **aucun** |
| Fournisseurs | « démonstration » (visuels d'attente locaux, sans IA, gratuits) ; OpenAI Images (adaptateur écrit d'après la documentation, **testé contre un faux serveur uniquement, jamais appelé en réel, prix non vérifié**) ; Google Imagen, Stability AI, Black Forest Labs : **non intégrés** |
| Formats proposés | 1:1 (1024²), 3:2 (1536×1024), 2:3 (1024×1536) ; **aucun 16:9** pour un bandeau large |
| Texte alternatif produit | « <description> (image générée) » ; bandeau : « Illustration d'ambiance (image générée) » |

## Constats
- **M1 (P1)** La génération de pages ne déclenche pas la génération d'images : tous les sites sortent **sans aucune image**. Le Media Generator planifie ses besoins à partir de la structure (testé au programme 21), mais l'enchaînement n'est pas automatique.
- **M2 (P1)** Sans clé de fournisseur réel, seul un visuel d'attente existe : la **pertinence, la cohérence stylistique et la qualité des images d'IA ne peuvent pas être évaluées** ici. Aucun crédit n'a été consommé.
- **M3 (P3)** Texte alternatif : le suffixe « (image générée) » alourdit la lecture par un lecteur d'écran, et le texte du bandeau est générique (« Illustration d'ambiance ») ; il devrait décrire le sujet du site.
- **M4 (P3)** Pas de ratio 16:9 : un bandeau 3:2 est recadré, ce qui peut couper le sujet.
- **M5 (info)** Les images déjà présentes dans la médiathèque sont gérées par l'Asset Manager (programme 21.7) : référencement, provenance, restauration. Non rejoué ici.

## Causes racines
Étape séparée dans le studio ; fournisseur réel non configuré ; `RATIOS` du fournisseur ; `altFor` du planificateur de médias.

## À faire pour évaluer vraiment
Configurer une clé de test (budget plafonné, autorisation explicite), générer les images de 3 scénarios (immobilier, photographie, mode), les examiner humainement (pertinence, cadrage, cohérence), mesurer coût et durée réels par image.
