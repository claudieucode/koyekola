# Génère les documents de spécification de l'entête À PARTIR de la table réelle (headerSettings.js) : usage « python3 scripts/gen-header-docs.py » depuis la racine du projet.
import json, subprocess, os
out = subprocess.check_output(["node", "-e", '''
const HS=require("./src/marketing/pages/headerSettings");
const rows=HS.catalog().filter(e=>e.resp===undefined||e.resp==="");
console.log(JSON.stringify(rows.map(e=>({id:e.id,g:e.g,tab:e.tab,type:e.type,label:e.label,def:e.def,resp:e.resp!==undefined,min:e.min,max:e.max,unit:e.unit,options:(e.options||[]).map(o=>o[0]),help:e.help||""}))))
''']).decode()
rows = json.loads(out)
D = "docs/theme-customizer/header/"
def dv(v): return "—" if v in (None, "") else str(v).lower() if isinstance(v, bool) else str(v)
def table(gs, tab=None):
    t = ["| Réglage (clé `settings.header.…`) | Libellé | Type | Valeurs / bornes | Défaut | Par appareil |", "|---|---|---|---|---|---|"]
    kinds = {"vis": "sous-ensemble de d, t, m", "color": "#rrggbb, couleur du site ou vide", "space": "haut,droite,bas,gauche;unité", "text": "texte", "bool": "oui/non", "media": "image de la médiathèque"}
    for r in rows:
        if r["g"] in gs and (tab is None or r["tab"] == tab):
            if r["options"]: vals = "/".join(x or "(hérité)" for x in r["options"])
            elif r.get("min") is not None: vals = f"{r['min']}–{r['max']} {r.get('unit') or ''}".strip()
            else: vals = kinds.get(r["type"], "")
            t.append(f'| `{r["id"]}` | {r["label"]} | {r["type"]} | {vals} | {dv(r["def"])} | {"oui" if r["resp"] else "non"} |')
    return "\n".join(t)
def w(name, text):
    open(D + name, "w").write(text)
w("HEADER_ELEMENTS_SPECIFICATION.md", f"""# Entête — spécification des éléments et de leurs réglages

Généré par `scripts/gen-header-docs.py` à partir de la table `src/marketing/pages/headerSettings.js` (la même qui valide, construit l'interface et alimente le rendu) : ce document ne peut pas diverger du code.

## Éléments du moteur (rangée principale)
| Élément | Identifiant | Rendu | Réglages |
|---|---|---|---|
| Identité du site (logo, titre, slogan) | `brand` (`.lp-autohead-brand`) | `views/marketing-public/_autohead.ejs` | groupe « Titre et logo » |
| Menu principal | `nav` (`.lp-autohead-nav`) | `_autonav.ejs` (menu affecté à « En-tête du site ») | groupe « Menu principal » |
| Menu hors-champ | `oc` (`.lp-oc`, `.lp-oc-toggle`, `.lp-oc-backdrop`) | `_autohead.ejs` + `public/js/kw-header.js` | groupe « Menu hors-champ » |

Les éléments « recherche », « bouton », « HTML », « widgets », « réseaux sociaux », « compte » et « panier » ne sont pas rendus par ce moteur : leurs couleurs ne figurent donc pas dans les réglages (aucun contrôle sans effet). Ils sont prévus dans l'architecture (voir `HEADER_ARCHITECTURE.md`).

## Titre et logo — Général
{table(["logo"], "general")}

## Titre et logo — Design
{table(["logo"], "design")}

## Menu principal — Général
{table(["menu"], "general")}

## Menu principal — Design
{table(["menu"], "design")}

## Menu hors-champ — Général
{table(["oc"], "general")}

## Menu hors-champ — Design
{table(["oc"], "design")}
""")
w("HEADER_DESIGN_SETTINGS.md", f"""# Entête — réglages de structure et de design (vue principale)

{table(["entete"])}

## Notes
- **Largeur** : « Pleine largeur » étend le fond de l'entête sur toute la page ; « Largeur du contenu » aligne le contenu sur la largeur de conteneur du site (réglage « Largeur du conteneur » de Mise en page), avec 24 px de bord au minimum.
- **Marge externe / espacement** : quatre côtés (une case vide vaut 0), unités px, em, rem ou %, liaison des quatre valeurs dans l'interface.
- **Par appareil** : la valeur ordinateur s'applique partout ; la tablette et le mobile ne posent une règle que si une valeur propre est saisie — sinon ils héritent.
- **Rangées** : le moteur a une seule rangée (principale). Les rangées « au-dessus » et « sous l'entête » d'Astra ne sont pas disponibles ; la composition montre l'état réel des trois éléments.
""")
w("TRANSPARENT_HEADER_SPECIFICATION.md", f"""# Entête transparent — spécification

## Comportement
- **Activer sur tout le site** (`tpEnabled`) : l'entête devient `position:absolute` en haut de la page (le contenu passe derrière), fond transparent (ou la « superposition » `tpBg`).
- **Activer sur** (`tpOn`) : `desktop` (au-dessus du point de rupture tablette), `mobile` (tablette + mobile : **la tablette suit le mobile**) ou `both`.
- **Logo transparent différent** (`tpLogo` + `tpLogoUrl`) : le second logo remplace le principal tant que l'entête est transparent ; sinon le logo principal est conservé.
- **Couleurs** : titre (+ survol), slogan, logo (masque), menu (normal / survol / actif, arrière-plan), sous-menu, déclencheur du menu hors-champ, bordure inférieure.
- S'applique à l'entête automatique du site et, pour la structure et le menu, au composant d'en-tête du Theme Builder.

## Non couvert (dépendances absentes du moteur)
Couleurs des médias sociaux, de la recherche, des boutons, du HTML, des widgets, du compte et de la permutation : ces éléments n'existent pas dans l'entête automatique. Les superpositions « au-dessus » et « sous l'entête » demandent des rangées qui n'existent pas encore. Les règles d'exclusion par type de page (articles, archives, erreur) sont prévues dans l'architecture mais ne sont pas exposées tant qu'aucun contrôle ne les honore.

## Réglages
{table(["tp"])}
""")
w("RESPONSIVE_HEADER_SPECIFICATION.md", """# Entête — comportement responsive

Appareils d'aperçu : Ordinateur, Tablette, Mobile (sélecteur du personnalisateur). Les points de rupture sont ceux du site (`settings.layout.breakpoints`, 1023 px et 767 px par défaut).

| Mécanisme | Règle |
|---|---|
| Valeur par appareil | ordinateur = clé nue ; tablette = clé + `T` ; mobile = clé + `M`. Une valeur vide hérite de l'appareil plus grand (affichée en grisé dans le champ). Jamais d'écrasement entre appareils. |
| Visibilité | chaîne `dtm` (d ordinateur, t tablette, m mobile) ; un appareil absent reçoit `display:none`. |
| Menu hors-champ | `ocVis` liste les appareils où le panneau remplace le menu principal ; ailleurs le menu reste en ligne. Par défaut : aucun (un site existant ne change pas). |
| Entête transparent | `tpOn` : `desktop` / `mobile` (tablette incluse) / `both`. |
| Mouvement | `prefers-reduced-motion` coupe les transitions du panneau, du bouton et des sous-menus. |

Vérifié dans Chrome à 390 px (mobile), 900 px (tablette), 1280 px et 1600 px (ordinateur) : voir `HEADER_TEST_REPORT.md`.
""")
print("docs générés")
