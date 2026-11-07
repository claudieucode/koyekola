(function(){var B=document.body;if(!B||B.getAttribute("data-kw-pack")!=="ossature")return;
var RM=window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches;
var $=function(s,e){return(e||document).querySelector(s)},$$=function(s,e){return[].slice.call((e||document).querySelectorAll(s))};
function el(t,c,h){var e=document.createElement(t);if(c)e.className=c;if(h!=null)e.innerHTML=h;return e}
function norm(s){return(s||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"")}
var uid=0;
$$("[data-anchor]").forEach(function(e){e.id=e.getAttribute("data-anchor")});$$(".os-tablewrap").forEach(function(e){e.tabIndex=0});
if(location.hash){var th=document.getElementById(location.hash.slice(1));if(th)setTimeout(function(){th.scrollIntoView()},60)}
/* ----- onglets ----- */
$$("[data-os-tabs]").forEach(function(box){var panels=$$("[data-tab]",box),id="ost"+(++uid),list=el("div","os-tablist");list.setAttribute("role","tablist");var tabs=[];
 panels.forEach(function(p,i){p.id=id+"-p"+i;p.setAttribute("role","tabpanel");p.setAttribute("aria-labelledby",id+"-t"+i);var b=el("button","os-tab",p.getAttribute("data-tab"));b.type="button";b.id=id+"-t"+i;b.setAttribute("role","tab");b.setAttribute("aria-controls",p.id);tabs.push(b);list.appendChild(b)});
 function sel(i,focus){tabs.forEach(function(b,k){var on=k===i;b.setAttribute("aria-selected",on?"true":"false");b.tabIndex=on?0:-1;panels[k].hidden=!on});if(focus)tabs[i].focus()}
 tabs.forEach(function(b,i){b.addEventListener("click",function(){sel(i)});b.addEventListener("keydown",function(e){var n=tabs.length,k=-1;if(e.key==="ArrowRight")k=(i+1)%n;else if(e.key==="ArrowLeft")k=(i+n-1)%n;else if(e.key==="Home")k=0;else if(e.key==="End")k=n-1;if(k>-1){e.preventDefault();sel(k,true)}})});
 box.insertBefore(list,box.firstChild);box.classList.add("os-tabs--on");sel(0)});
/* ----- bascule des prix ----- */
$$("[data-os-pricing]").forEach(function(box){var bar=el("div","os-toggle");bar.setAttribute("role","group");bar.setAttribute("aria-label","Période de facturation");
 var m=el("button","os-tg","Mensuel"),y=el("button","os-tg","Annuel <small>−20 %</small>");m.type=y.type="button";
 function set(p){box.setAttribute("data-period",p);m.setAttribute("aria-pressed",p==="m"?"true":"false");y.setAttribute("aria-pressed",p==="y"?"true":"false")}
 m.addEventListener("click",function(){set("m")});y.addEventListener("click",function(){set("y")});bar.appendChild(m);bar.appendChild(y);box.insertBefore(bar,box.firstChild);set("m")});
/* ----- compteurs ----- */
var cs=$$("[data-os-count]");
if(cs.length&&"IntersectionObserver"in window&&!RM){var io=new IntersectionObserver(function(es){es.forEach(function(e){if(!e.isIntersecting)return;io.unobserve(e.target);var t=+e.target.getAttribute("data-os-count"),s=null;(function st(ts){if(s===null)s=ts;var p=Math.min((ts-s)/1100,1);e.target.textContent=Math.round(t*(1-Math.pow(1-p,3)));if(p<1)requestAnimationFrame(st)})(0)})});cs.forEach(function(c){io.observe(c)})}
/* ----- FAQ : tout ouvrir ----- */
$$("[data-os-faq]").forEach(function(f){var ds=$$("details",f),b=el("button","os-mini","Tout ouvrir"),open=false;b.type="button";b.addEventListener("click",function(){open=!open;ds.forEach(function(d){d.open=open});b.textContent=open?"Tout fermer":"Tout ouvrir"});f.insertBefore(b,f.firstChild)});
/* ----- filtres : articles et bibliothèque ----- */
function filter(tools,items,counter){var cat="",q="";var lab=el("label","os-search"),inp=el("input","os-qin");inp.type="search";inp.placeholder="Chercher un mot…";inp.setAttribute("aria-label","Filtrer");lab.appendChild(inp);tools.appendChild(lab);
 var chips=$$("[data-cat]",tools);
 function app(){var n=0;items.forEach(function(it){var ok=(!cat||it.getAttribute("data-cat")===cat)&&(!q||norm(it.getAttribute("data-q")).indexOf(q)>-1);it.hidden=!ok;if(ok)n++});chips.forEach(function(a){var v=a.getAttribute("data-cat")==="tous"?"":a.getAttribute("data-cat");if(v===cat)a.setAttribute("aria-current","true");else a.removeAttribute("aria-current")});$("[data-os-n]",tools).textContent=n;if(counter)counter(n)}
 chips.forEach(function(a){a.addEventListener("click",function(e){e.preventDefault();var v=a.getAttribute("data-cat");cat=v==="tous"?"":v;app()})});inp.addEventListener("input",function(){q=norm(inp.value.trim());app()});app()}
var nt=$("[data-os-tools]"),nl=$("[data-os-list]");if(nt&&nl)filter(nt,$$(".os-post",nl),function(n){var e=$("[data-os-empty]");if(e)e.hidden=n>0});
var lt=$("[data-os-lib]");if(lt)filter(lt,$$(".os-spec"));
/* ----- ombre de l'en-tête au défilement ----- */
var hd=$(".os-head");if(hd){var on=function(){hd.classList.toggle("os-head--s",window.scrollY>8)};window.addEventListener("scroll",on,{passive:true});on()}
})();
