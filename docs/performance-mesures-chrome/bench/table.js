const fs=require("fs");
const all=["../mesures-initiales/results-20-100.json","../mesures-initiales/results-300-400.json"].flatMap(f=>JSON.parse(fs.readFileSync(f))).filter(r=>!r.failure);
const med=a=>{const s=[...a].sort((x,y)=>x-y);return s.length?s[Math.floor(s.length/2)]:null};
const p95=a=>{const s=[...a].sort((x,y)=>x-y);return s.length?s[Math.min(s.length-1,Math.floor(s.length*.95))]:null};
const r=x=>x==null?"–":(Math.round(x*10)/10).toString();
const pair=(arr,k)=>r(med(arr.map(v=>v[k])));
const rows=[
 ["Éléments réels dans la page",x=>x.nodes],
 ["Ouverture : éditeur prêt (ms, mur)",x=>x.openMs],
 ["Ouverture : tâches longues (nombre / total ms / max ms)",x=>`${x.open.longTasks} / ${x.open.longTaskTotalMs} / ${x.open.longTaskMax}`],
 ["Nœuds DOM (fenêtre / canevas)",x=>`${x.open.domNodesMain} / ${x.open.domNodesFrame}`],
 ["Tas JS (Mo) au départ → à la fin",x=>`${x.open.heapMB} → ${x.heapEndMB}`],
 ["Sélection par clic : gestionnaire (ms, médiane / p95)",x=>`${r(med(x.select.sync))} / ${r(p95(x.select.sync))}`],
 ["Sélection : jusqu'à l'image affichée (ms, médiane / p95)",x=>`${r(med(x.select.paint))} / ${r(p95(x.select.paint))}`],
 ["Désélection : gestionnaire / image (ms)",x=>`${r(med(x.deselect.sync))} / ${r(med(x.deselect.paint))}`],
 ["Survol : coût par mousemove (ms, p95) règles actives",x=>r(p95(x.hover.rulers.perEventMs))],
 ["Survol : durée d'image (ms, p95) règles actives",x=>r(p95(x.hover.rulers.frameMs))],
 ["Modifier une propriété : touche → canevas à jour (ms, médiane)",x=>r(med(x.styleLatency))],
 ["  … même mesure, 1re modification (ms)",x=>r(x.styleLatency[0])],
 ["Redimensionner (poignée) : durée d'image (ms, p95 / max)",x=>`${r(p95(x.resize.frameMs))} / ${r(Math.max(...x.resize.frameMs))}`],
 ["Redimensionner : relâchement (ms)",x=>r(x.resize.upMs)],
 ["Zoom (clic) : gestionnaire / image (ms, médiane)",x=>`${r(med(Object.values(x.zoom).map(v=>v.sync)))} / ${r(med(Object.values(x.zoom).map(v=>v.paint)))}`],
 ["Annuler : gestionnaire / image (ms, médiane)",x=>`${pair(x.undoRedo.undo,"sync")} / ${pair(x.undoRedo.undo,"paint")}`],
 ["Rétablir : gestionnaire / image (ms, médiane)",x=>`${pair(x.undoRedo.redo,"sync")} / ${pair(x.undoRedo.redo,"paint")}`],
 ["Annuler/Rétablir : pire image (ms)",x=>r(Math.max(...x.undoRedo.undo.concat(x.undoRedo.redo).map(v=>v.paint)))],
 ["Structure fermer / ouvrir : image (ms)",x=>`${r(x.panels.structureClose.paint)} / ${r(x.panels.structureOpen.paint)}`],
 ["Inspecteur : onglet Style gestionnaire / image (ms)",x=>{const t=x.panels.tabs.find(t=>/Style/.test(t.name));return `${r(t.sync)} / ${r(t.paint)}`}],
 ["Rendu serveur /rendu : envoyé / reçu (Ko)",x=>{const n=x.save.find(v=>/rendu/.test(v.url));return n?`${r(n.req/1024)} / ${r(n.res/1024)}`:"–"}],
 ["Rendu serveur /rendu : durée (ms)",x=>{const n=x.styleOnce.net.find(v=>/rendu/.test(v.url));return n?n.ms:"–"}],
 ["Enregistrement PUT /brouillon (ms, 1 modif / après rafale)",x=>{const a=x.styleOnce.net.find(v=>/brouillon/.test(v.url)),b=x.burst.net.find(v=>/brouillon/.test(v.url));return `${a?a.ms:"–"} / ${b?b.ms:"–"}`}],
 ["Analyse SEO POST /seo/analyse par modification (ms)",x=>{const a=x.styleOnce.net.find(v=>/seo/.test(v.url));return a?a.ms:"–"}],
 ["Rafale de 40 touches : requêtes /rendu / PUT",x=>`${x.burst.net.filter(v=>/rendu/.test(v.url)).length} / ${x.burst.net.filter(v=>/brouillon/.test(v.url)).length}`],
 ["Rafale : évènements > 16 ms (nombre / max ms)",x=>`${x.burst.ev.length} / ${Math.max(0,...x.burst.ev.map(e=>e.d))}`],
 ["Sérialisation du document (JSON, Ko) / copie (ms)",x=>`${r(x.serialize.bytes/1024)} / ${r(x.serialize.cloneMs)}`],
];
let out="| Mesure | "+all.map(x=>x.nodes+" él.").join(" | ")+" |\n|---|"+all.map(()=>"---").join("|")+"|\n";
for(const [n,f] of rows) out+="| "+n+" | "+all.map(x=>{try{return f(x)}catch(e){return "?"}}).join(" | ")+" |\n";
console.log(out);
