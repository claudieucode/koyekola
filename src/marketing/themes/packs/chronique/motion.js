(function(){var B=document.body;if(!B||B.getAttribute("data-kw-pack")!=="chronique")return;
var RM=window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches;
var $=function(s,e){return(e||document).querySelector(s)},$$=function(s,e){return[].slice.call((e||document).querySelectorAll(s))};
function el(t,c,h){var e=document.createElement(t);if(c)e.className=c;if(h!=null)e.innerHTML=h;return e}
function norm(s){return(s||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"")}
function qs(k){var m=new RegExp("[?&]"+k+"=([a-z0-9-]+)").exec(location.search);return m?m[1]:""}
var S={get:function(k,d){try{var v=localStorage.getItem("chronique-"+k);return v===null?d:JSON.parse(v)}catch(x){return d}},set:function(k,v){try{localStorage.setItem("chronique-"+k,JSON.stringify(v))}catch(x){}}};
function hm(m){return m>=60?Math.floor(m/60)+" h "+("0"+Math.round(m%60)).slice(-2):Math.round(m)+" min"}
$$("[data-anchor]").forEach(function(e){e.id=e.getAttribute("data-anchor")});$$(".ch-tablewrap").forEach(function(e){e.tabIndex=0});
if(location.hash){var th=document.getElementById(location.hash.slice(1));if(th)setTimeout(function(){th.scrollIntoView()},60)}
/* ----- compteur ----- */
var cn=$("[data-ch-count]");if(cn&&!RM&&"IntersectionObserver"in window){var t0=+cn.getAttribute("data-ch-count");var io0=new IntersectionObserver(function(es){if(es[0].isIntersecting){io0.disconnect();var s=null;(function st(ts){if(s===null)s=ts;var p=Math.min((ts-s)/800,1);cn.textContent=Math.round(t0*p);if(p<1)requestAnimationFrame(st)})(0)}});io0.observe(cn)}
/* ----- liste des récits : rubrique, durée, mot ----- */
var tools=$("[data-ch-tools]"),lst=$("[data-ch-list]");
if(tools&&lst){var items=$$(".ch-item",lst),cat=qs("cat"),du="",q="";if(cat==="tous")cat="";
 var lab=el("label","ch-search"),inp=el("input","ch-qin");inp.type="search";inp.placeholder="Un mot, un lieu, un nom…";inp.setAttribute("aria-label","Filtrer les récits");lab.appendChild(inp);tools.insertBefore(lab,tools.children[1]||null);
 var dr=function(m){return m<20?"court":m<=30?"moyen":"long"};
 var app=function(){var n=0,tot=0;items.forEach(function(it){var m=+it.getAttribute("data-min"),ok=(!cat||it.getAttribute("data-cat")===cat)&&(!du||dr(m)===du)&&(!q||norm(it.getAttribute("data-q")).indexOf(q)>-1);it.hidden=!ok;if(ok){n++;tot+=m}});
  $$("[data-cat]",tools).forEach(function(a){var v=a.getAttribute("data-cat")==="tous"?"":a.getAttribute("data-cat");if(v===cat)a.setAttribute("aria-current","true");else a.removeAttribute("aria-current")});
  $$("[data-dur]",tools).forEach(function(a){var v=a.getAttribute("data-dur")==="tous"?"":a.getAttribute("data-dur");if(v===du)a.setAttribute("aria-current","true");else a.removeAttribute("aria-current")});
  $("[data-ch-n]",tools).textContent=n;$("[data-ch-t]",tools).textContent=hm(tot);var e=$("[data-ch-empty]");if(e)e.hidden=n>0};
 $$("[data-cat]",tools).forEach(function(a){a.addEventListener("click",function(e){e.preventDefault();var v=a.getAttribute("data-cat");cat=v==="tous"?"":v;app()})});
 $$("[data-dur]",tools).forEach(function(a){a.addEventListener("click",function(e){e.preventDefault();var v=a.getAttribute("data-dur");du=v==="tous"?"":v;app()})});
 inp.addEventListener("input",function(){q=norm(inp.value.trim());app()});app()}
/* ----- parcours de lecture ----- */
$$("[data-ch-path]").forEach(function(box){var id=box.getAttribute("data-ch-path"),steps=$$("[data-ch-step]",box),saved=S.get("path-"+id,[]),out=$("[data-ch-rest]",box);
 function upd(){var rest=0,done=[];steps.forEach(function(s,i){var on=s.getAttribute("aria-checked")==="true";if(on)done.push(i);else rest+=+s.getAttribute("data-min")});out.textContent=rest?hm(rest):"0 min";box.classList.toggle("ch-path--done",rest===0);S.set("path-"+id,done)}
 steps.forEach(function(s,i){s.setAttribute("role","checkbox");s.setAttribute("aria-checked",saved.indexOf(i)>-1?"true":"false");s.tabIndex=0;s.setAttribute("aria-label","Marquer comme lu : "+(s.querySelector("a")||s).textContent);
  var tg=function(e){if(e&&e.target&&e.target.tagName==="A")return;s.setAttribute("aria-checked",s.getAttribute("aria-checked")==="true"?"false":"true");upd()};
  s.addEventListener("click",tg);s.addEventListener("keydown",function(e){if(e.key===" "){e.preventDefault();tg()}})});
 var a=$("[data-ch-pact]",box),b=el("button","ch-mini","Tout décocher");b.type="button";b.addEventListener("click",function(){steps.forEach(function(s){s.setAttribute("aria-checked","false")});upd()});a.appendChild(b);upd()});
/* ----- lecture concentrée, progression, temps restant ----- */
var art=$("[data-ch-art]"),body=$(".ch-body");
if(art&&body){
 var words=(body.textContent||"").split(/\s+/).length,total=Math.max(1,words/220);
 var prog=el("div","ch-prog");prog.setAttribute("role","progressbar");prog.setAttribute("aria-label","Progression de la lecture");prog.setAttribute("aria-valuemin","0");prog.setAttribute("aria-valuemax","100");var pi=el("i");prog.appendChild(pi);B.appendChild(prog);
 var left=$("[data-ch-left]");
 function scroll(){var r=body.getBoundingClientRect(),vh=window.innerHeight,p=Math.max(0,Math.min(1,(vh*.35-r.top)/Math.max(1,r.height-vh*.3)));pi.style.width=(p*100)+"%";prog.setAttribute("aria-valuenow",Math.round(p*100));if(left)left.textContent=p>=.98?"Lecture terminée":"Il reste environ "+Math.max(1,Math.round(total*(1-p)))+" min"}
 window.addEventListener("scroll",scroll,{passive:true});window.addEventListener("resize",scroll);scroll();
 var bar=el("div","ch-tb");bar.setAttribute("role","toolbar");bar.setAttribute("aria-label","Réglages de lecture");
 function btn(label,cls,fn,pressed){var b=el("button","ch-tbb "+(cls||""),label);b.type="button";if(pressed!==undefined)b.setAttribute("aria-pressed",pressed?"true":"false");b.addEventListener("click",fn);bar.appendChild(b);return b}
 var scale=S.get("scale",1),fond=S.get("fond",""),focus=false;
 function apply(){B.style.setProperty("--ch-scale",scale);if(fond)B.setAttribute("data-pk-fond",fond);S.set("scale",scale)}
 var bf=btn("Lecture concentrée","ch-tbb--f",function(){focus=!focus;B.classList.toggle("ch-focus",focus);bf.setAttribute("aria-pressed",focus?"true":"false");bf.textContent=focus?"Quitter la lecture concentrée":"Lecture concentrée"},false);
 btn("A−","",function(){scale=Math.max(.85,Math.round((scale-.08)*100)/100);apply()});btn("A+","",function(){scale=Math.min(1.4,Math.round((scale+.08)*100)/100);apply()});
 [["ivoire","Ivoire"],["sepia","Sépia"],["nuit","Nuit"]].forEach(function(f){btn(f[1],"ch-tbb--"+f[0],function(){fond=f[0];B.setAttribute("data-pk-fond",fond);S.set("fond",fond);$$(".ch-tbb[data-f]",bar).forEach(function(x){x.setAttribute("aria-pressed",x.getAttribute("data-f")===fond?"true":"false")})}).setAttribute("data-f",f[0])});
 document.body.appendChild(bar);apply();
 document.addEventListener("keydown",function(e){if(e.key==="Escape"&&focus){bf.click()}});
 var tl=$$(".ch-toc a");if(tl.length&&"IntersectionObserver"in window){var hs=tl.map(function(a){return document.getElementById(a.getAttribute("href").slice(1))}).filter(Boolean);
  var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){tl.forEach(function(a){a.removeAttribute("aria-current")});var a=$('.ch-toc a[href="#'+e.target.id+'"]');if(a)a.setAttribute("aria-current","true")}})},{rootMargin:"-20% 0px -70% 0px"});hs.forEach(function(h){io.observe(h)})}
}
})();
