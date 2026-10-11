const fs=require("fs");
const files=process.argv.slice(2);
const all=files.flatMap(f=>JSON.parse(fs.readFileSync(f))).filter(r=>!r.failure);
const med=a=>{const s=[...a].sort((x,y)=>x-y);return s.length?s[Math.floor(s.length/2)]:null};
const p95=a=>{const s=[...a].sort((x,y)=>x-y);return s.length?s[Math.min(s.length-1,Math.floor(s.length*.95))]:null};
const r=x=>x==null?null:Math.round(x*10)/10;
for(const x of all){
 console.log("\n=== ",x.nodes,"éléments (cible",x.target,")");
 console.log("ouverture ms",x.openMs,"| DCL",r(x.open.domContentLoaded),"load",r(x.open.load),"| DOM main/frame",x.open.domNodesMain,x.open.domNodesFrame,"| heap",x.open.heapMB,"MB → fin",x.heapEndMB,"| long tasks ouverture",x.open.longTasks,"total",x.open.longTaskTotalMs,"max",x.open.longTaskMax,"| css cadre",x.cssBytesFrame);
 console.log("réseau ouverture",JSON.stringify(x.open.net));
 console.log("sélection sync med/p95",r(med(x.select.sync)),r(p95(x.select.sync)),"→ image",r(med(x.select.paint)),r(p95(x.select.paint)));
 console.log("désélection sync",r(med(x.deselect.sync)),"image",r(med(x.deselect.paint)));
 for(const k of Object.keys(x.hover)) console.log("survol",k,"coût/évt med",r(med(x.hover[k].perEventMs)),"p95",r(p95(x.hover[k].perEventMs)),"| image med",r(med(x.hover[k].frameMs)),"p95",r(p95(x.hover[k].frameMs)));
 console.log("style (touche→canevas) ms",x.styleLatency.map(r).join(","));
 console.log("style une fois: réseau",JSON.stringify(x.styleOnce.net),"long",x.styleOnce.long.join(","));
 console.log("rafale 40 touches: durée Playwright",x.burstKeyMs,"réseau",JSON.stringify(x.burst.net),"long",x.burst.long.join(","),"events lents",x.burst.ev.length,"max",Math.max(0,...x.burst.ev.map(e=>e.d)));
 console.log("sérialisation document:",JSON.stringify(x.serialize),"backup localStorage octets",x.burstBackupBytes);
 const rs=x.resize; if(rs.error) console.log("resize",rs.error); else console.log("resize: mousedown",r(rs.startMs),"ms, mouseup",r(rs.upMs),"| coût sync/move med",r(med(rs.moveSyncMs)),"p95",r(p95(rs.moveSyncMs)),"max",r(Math.max(...rs.moveSyncMs)),"| image med",r(med(rs.frameMs)),"p95",r(p95(rs.frameMs)),"max",r(Math.max(...rs.frameMs)));
 console.log("après resize réseau",JSON.stringify(x.resizeNet));
 console.log("zoom",Object.entries(x.zoom).map(([k,v])=>k+":"+r(v.sync)+"/"+r(v.paint)).join(" "));
 console.log("undo sync/image",x.undoRedo.undo.map(v=>r(v.sync)+"/"+r(v.paint)).join(" "),"| redo",x.undoRedo.redo.map(v=>r(v.sync)+"/"+r(v.paint)).join(" "));
 console.log("panneaux",JSON.stringify(Object.fromEntries(Object.entries(x.panels).filter(([k])=>k!="tabs").map(([k,v])=>[k,[r(v.sync),r(v.paint)]]))),"onglets",x.panels.tabs.map(t=>t.name.trim()+":"+r(t.sync)+"/"+r(t.paint)).join(" "));
 console.log("save",JSON.stringify(x.save));
 console.log("erreurs",JSON.stringify(x.errors));
}
