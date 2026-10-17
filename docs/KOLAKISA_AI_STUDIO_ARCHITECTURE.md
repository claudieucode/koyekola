# IA Kolakisa — architecture

## Vue d'ensemble

```
Navigateur (éditeur)                              Serveur
─────────────────────────────                     ─────────────────────────────────────────
page-builder-ai.js  ── pbAi.attach(pont) ──┐
  Créer  ─ POST /pages/:id/ia/proposer ───────────▶ studio.propose
  Adapter─ mesures réelles (iframe) ──┐             │  contexte (arbre résumé, périmètre, mesures, annotations)
           POST /pages/:id/ia/responsive ─────────▶ │  ai.call → aiCore.runJson (SDK, schéma JSON) [plafond + journal]
  Corriger─ annotations → éléments ───┘             │  normalizeOps → applyOperations (copie) → validate
                                                    │    (normalizeContent + lockedWidgetChanges)
  renderProposal ◀── { changes, content, needsConfirm, revision }
  Aperçu / Appliquer / Rejeter → pont (page-builder.js) → change() : UNE étape d'historique
```

## Modules

- `src/marketing/ai/studio.js` — moteur : opérations (`set_styles`, `set_props`, `insert`, `move`, `remove`, `set_page`), périmètre, validation, différences avant/après, règles responsive (`responsiveFixes`), prompt système construit depuis le catalogue réel (`nodes.editorSpec`).
- `src/marketing/ai/index.js` — `call` exporté (plafond, journal, option `system`).
- `src/marketing/web/landing.js` — routes `GET /pages/:id/ia/etat`, `POST …/ia/proposer`, `POST …/ia/responsive` (permission `forms.write`/`forms.read`, statuts 503 non configuré, 429 plafond/occupé, 409 conflit).
- `public/js/page-builder-ai.js` — interface : bouton, fenêtre unique (grande fenêtre `showModal` ↔ panneau `show`, même contenu donc même état), trois onglets, propositions, mesures, annotations.
- `public/js/page-builder.js` — pont `pbAi.attach` : `applyContent` (une étape d'historique, enregistrement suspendu en aperçu), `keepPreview`, `discardPreview`, `snapshotKey`.

## Contrat des opérations

Le modèle renvoie `{summary, question, operations[]}` (schéma JSON strict, tous champs textuels). Le serveur : refuse tout élément inconnu, toute valeur de style invalide, tout état sur un écran autre que l'ordinateur, tout élément verrouillé ; crée lui-même les identifiants ; revalide le document entier.

## Responsive

1. Le navigateur passe l'éditeur en tablette puis mobile, attend le rendu et mesure (`getBoundingClientRect`, styles calculés) : débordement, largeur fixe, texte trop petit/grand, zones tactiles, colonnes, retour à la ligne, marges.
2. Le serveur transforme chaque constat en correction par règle, écrite dans **l'écran concerné seulement** ; l'écran ordinateur est comparé avant/après.
3. Chaque correction est cochable ; après application, l'analyse peut être relancée pour vérifier.

## Annotation

Canvas fixe au-dessus du cadre, coordonnées stockées dans le repère du cadre (indépendantes du zoom). Chaque tracé est relié aux éléments réels (`elementsFromPoint` sur une grille d'échantillons). L'IA reçoit : tracés, texte, identifiants, rectangle et styles calculés/propres des éléments. Aucune image n'est envoyée (voir limites).

## Préférences

`localStorage` `pb:ai-mode` (fenêtre / panneau) et `pb:ai-tab`. Jamais dans le document.
