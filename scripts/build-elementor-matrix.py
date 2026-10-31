#!/usr/bin/env python3
# Fusionne l'inventaire historique (109 lignes) et les 3 relevés de la passe « parité complète » (docs/elementor-parite-data/*.csv) en une matrice unique :
# docs/ELEMENTOR_PARITY_MATRIX.md + .csv. Les décomptes sont CALCULÉS ici. Ne pas modifier les .md/.csv à la main.
import csv, glob, collections, io
OLD = "docs/KOLAKISA_ELEMENTOR_FEATURE_INVENTORY.csv"
def state_old(r):
    f = r["Statut final"]
    if f.startswith("Validé") or f.startswith("Ajouté"): return "Complet"
    if f == "Autre module": return "Autre module"
    if f.startswith("Non applicable"): return "Non applicable"
    return "Exclu/Non fait"
rows = []
for r in csv.DictReader(open(OLD, encoding="utf-8")):
    rows.append(dict(id=r["ID"], dom=r["Domaine"], ref=r["Référence Elementor"], src=r["Source"], dispo=r["Disponibilité (selon l'article)"], kol=r["Kolakisa"], etat=state_old(r), ecart=r["Écart / action"], sol="", prio=r["Priorité"], preuve=r["Tests"], origine="inventaire historique"))
for p in sorted(glob.glob("docs/elementor-parite-data/*.csv")):
    for r in csv.DictReader(open(p, encoding="utf-8")):
        k = list(r.keys())
        g = lambda i: r[k[i]]
        rows.append(dict(id=g(0), dom=g(1), ref=g(2), src=g(3), dispo=g(4), kol=g(5), etat=g(6), ecart=g(7), sol=g(8), prio=g(9), preuve=g(10), origine="relevé 22.8"))
ids = [r["id"] for r in rows]
dup = [i for i, n in collections.Counter(ids).items() if n > 1]
assert not dup, f"identifiants en double : {dup}"
cnt = collections.Counter(r["etat"] for r in rows)
byd = collections.defaultdict(collections.Counter)
for r in rows: byd[r["id"].split("-")[1].rstrip("0123456789")][r["etat"]] += 1
with open("docs/ELEMENTOR_PARITY_MATRIX.csv", "w", encoding="utf-8", newline="") as f:
    w = csv.writer(f); w.writerow(["ID","Domaine","Référence Elementor","Source","Disponibilité","Kolakisa","État","Écart","Solution prévue","Priorité","Preuve/Tests","Origine"])
    for r in rows: w.writerow([r[x] for x in ("id","dom","ref","src","dispo","kol","etat","ecart","sol","prio","preuve","origine")])
esc = lambda s: (s or "").replace("|", "\\|").replace("\n", " ")
o = io.StringIO()
o.write("# Matrice de parité Elementor ↔ Kolakisa (identifiants stables)\n\n_Générée par `scripts/build-elementor-matrix.py` depuis `KOLAKISA_ELEMENTOR_FEATURE_INVENTORY.csv` et `docs/elementor-parite-data/*.csv`. Ne pas modifier à la main._\n\n")
o.write("## Décomptes (calculés)\n\n| État | Lignes |\n|---|---|\n")
for k, n in sorted(cnt.items(), key=lambda x: -x[1]): o.write(f"| {k} | {n} |\n")
o.write(f"| **Total** | **{len(rows)}** |\n\n")
o.write("« Complet » = fonctionnalité présente et vérifiée par le code ou un test cité. Les relevés 22.8 sont des constats de lecture du code et de la documentation ; les numéros de ligne cités en preuve sont approximatifs et les lignes marquées « déduit » dans Disponibilité n'ont pas été lues sur une page officielle.\n\n")
o.write("## Par famille d'identifiant\n\n| Famille | " + " | ".join(sorted(cnt)) + " |\n|---|" + "---|" * len(cnt) + "\n")
for fam in sorted(byd): o.write(f"| {fam} | " + " | ".join(str(byd[fam].get(s, 0)) for s in sorted(cnt)) + " |\n")
o.write("\n## Matrice\n\n| ID | Domaine | Référence Elementor | Disponibilité | Kolakisa | État | Écart | Solution prévue | Prio | Preuve |\n|---|---|---|---|---|---|---|---|---|---|\n")
for r in rows: o.write("| " + " | ".join(esc(r[x]) for x in ("id","dom","ref","dispo","kol","etat","ecart","sol","prio","preuve")) + " |\n")
open("docs/ELEMENTOR_PARITY_MATRIX.md", "w", encoding="utf-8").write(o.getvalue())
print(len(rows), dict(cnt))

# Vues par domaine (mêmes lignes que la matrice, aucune donnée en plus)
VIEWS = {
 "ELEMENTOR_WIDGETS_CATALOG": ("Catalogue des widgets Elementor (Free et Pro)", ("W",)),
 "ELEMENTOR_FEATURES_CATALOG": ("Catalogue des outils et fonctionnalités", ("F", "SS", "UI", "FM", "NV")),
 "ELEMENTOR_LAYOUT_AND_STYLE": ("Layout, style et responsive", ("LY", "ST")),
 "ELEMENTOR_DYNAMIC_CONTENT": ("Contenu dynamique et Theme Builder", ("DY", "TB")),
 "ELEMENTOR_INTERACTIONS": ("Interactions : popups, déclencheurs, conditions", ("PU",)),
 "ELEMENTOR_WOOCOMMERCE": ("Widgets et fonctionnalités e-commerce", ("WC",)),
}
for name, (title, fams) in VIEWS.items():
    sel = [r for r in rows if r["id"].split("-")[1].rstrip("0123456789") in fams]
    c = collections.Counter(r["etat"] for r in sel)
    s = io.StringIO()
    s.write(f"# {title}\n\n_Vue de `ELEMENTOR_PARITY_MATRIX.md` générée par `scripts/build-elementor-matrix.py` (familles {', '.join(fams)}). Ne pas modifier à la main._\n\n")
    s.write("**" + str(len(sel)) + " lignes** : " + ", ".join(f"{k} {n}" for k, n in sorted(c.items(), key=lambda x: -x[1])) + ".\n\n")
    s.write("| ID | Référence Elementor | Source | Disponibilité | Kolakisa | État | Écart | Solution prévue | Prio |\n|---|---|---|---|---|---|---|---|---|\n")
    for r in sel: s.write("| " + " | ".join(esc(r[x]) for x in ("id","ref","src","dispo","kol","etat","ecart","sol","prio")) + " |\n")
    open(f"docs/{name}.md", "w", encoding="utf-8").write(s.getvalue())
