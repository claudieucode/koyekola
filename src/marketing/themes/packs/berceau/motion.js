(function(){var B=document.body;if(!B||B.getAttribute("data-kw-pack")!=="berceau")return;
var RM=window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches;
var $=function(s,e){return(e||document).querySelector(s)},$$=function(s,e){return[].slice.call((e||document).querySelectorAll(s))};
function el(t,c,h){var e=document.createElement(t);if(c)e.className=c;if(h!=null)e.innerHTML=h;return e}
function norm(s){return(s||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"")}
function qs(k){var m=new RegExp("[?&]"+k+"=([a-z0-9-]+)").exec(location.search);return m?m[1]:""}
$$("[data-anchor]").forEach(function(e){e.id=e.getAttribute("data-anchor")});$$(".be-tablewrap").forEach(function(e){e.tabIndex=0});
if(location.hash){var th=document.getElementById(location.hash.slice(1));if(th)setTimeout(function(){th.scrollIntoView()},60)}
/* ----- listes à cocher (état gardé dans ce navigateur seulement) ----- */
var store={get:function(k){try{return JSON.parse(localStorage.getItem("berceau-ck-"+k)||"[]")}catch(x){return[]}},set:function(k,v){try{localStorage.setItem("berceau-ck-"+k,JSON.stringify(v))}catch(x){}}};
var lists=$$("[data-be-ck]");
lists.forEach(function(box){var id=box.getAttribute("data-be-ck"),items=$$("li[data-ck]",box),saved=store.get(id),bar=$(".be-bar2 i",box),out=$("[data-p]",box);
 function upd(){var n=items.filter(function(i){return i.getAttribute("aria-checked")==="true"}).length;out.textContent=n;bar.style.width=(items.length?n/items.length*100:0)+"%";box.classList.toggle("be-ck--done",n===items.length&&n>0);
  store.set(id,items.map(function(i,k){return i.getAttribute("aria-checked")==="true"?k:-1}).filter(function(k){return k>=0}))}
 items.forEach(function(li,k){li.setAttribute("role","checkbox");li.tabIndex=0;li.setAttribute("aria-checked",saved.indexOf(k)>-1?"true":"false");
  var tg=function(){li.setAttribute("aria-checked",li.getAttribute("aria-checked")==="true"?"false":"true");upd()};
  li.addEventListener("click",tg);li.addEventListener("keydown",function(e){if(e.key===" "||e.key==="Enter"){e.preventDefault();tg()}})});
 var act=$("[data-be-act]",box);act.innerHTML="";
 var r=el("button","be-mini","Tout décocher");r.type="button";r.addEventListener("click",function(){items.forEach(function(i){i.setAttribute("aria-checked","false")});upd()});
 var p=el("button","be-mini be-mini--alt","Imprimer");p.type="button";p.addEventListener("click",function(){window.print()});act.appendChild(r);act.appendChild(p);
 box._reset=function(){items.forEach(function(i){i.setAttribute("aria-checked","false")});upd()};upd()});
var ra=$("[data-be-resetall]");if(ra&&lists.length){var rb=el("button","be-mini","Tout décocher partout");rb.type="button";rb.addEventListener("click",function(){lists.forEach(function(b){b._reset()})});ra.appendChild(rb)}
/* ----- frise d'âges sur l'accueil : filtre sur place ----- */
var home=$(".be-cards--home"),fr=$("[data-be-ages]");
if(home&&fr){var its=$$(".be-item",home),links=$$("a[data-age]",fr),cur="",ttl=$("[data-be-now]"),em=$("[data-be-empty]");
 var names={};links.forEach(function(a){names[a.getAttribute("data-age")]=$("b",a).textContent});
 var ap=function(){var n=0;its.forEach(function(i){var ok=!cur||(i.getAttribute("data-ages")||"").split(" ").indexOf(cur)>-1;i.hidden=!ok;if(ok)n++});home.setAttribute("data-filtered",cur?"1":"");
  links.forEach(function(a){if(a.getAttribute("data-age")===cur)a.setAttribute("aria-current","true");else a.removeAttribute("aria-current")});
  if(ttl)ttl.textContent=cur?"À lire pour les "+names[cur]:"Les derniers articles";if(em)em.hidden=n>0};
 links.forEach(function(a){a.addEventListener("click",function(e){e.preventDefault();var k=a.getAttribute("data-age");cur=cur===k?"":k;ap();if(cur){var t=$(".be-sec--now");if(t&&!RM)t.scrollIntoView({behavior:"smooth",block:"start"})}})})}
/* ----- liste d'articles : âge, rubrique, mot ----- */
var tools=$("[data-be-tools]"),lst=$("[data-be-list]");
if(tools&&lst&&!home){var items2=$$(".be-item",lst),age=qs("age"),cat=qs("cat"),q="";if(age==="tous")age="";
 var lab=el("label","be-search"),inp=el("input","be-qin");inp.type="search";inp.placeholder="Un mot : sommeil, rentrée…";inp.setAttribute("aria-label","Filtrer les articles");lab.appendChild(inp);tools.insertBefore(lab,tools.children[1]||null);
 var ap2=function(){var n=0;items2.forEach(function(i){var ok=(!age||(i.getAttribute("data-ages")||"").split(" ").indexOf(age)>-1)&&(!cat||i.getAttribute("data-cat")===cat)&&(!q||norm(i.getAttribute("data-q")).indexOf(q)>-1);i.hidden=!ok;if(ok)n++});
  $$("[data-age]",tools).forEach(function(a){var v=a.getAttribute("data-age")==="tous"?"":a.getAttribute("data-age");if(v===age)a.setAttribute("aria-current","true");else a.removeAttribute("aria-current")});
  $$("[data-cat]",tools).forEach(function(a){var v=a.getAttribute("data-cat")==="tous"?"":a.getAttribute("data-cat");if(v===cat)a.setAttribute("aria-current","true");else a.removeAttribute("aria-current")});
  $("[data-be-n]",tools).textContent=n;var e=$("[data-be-empty]");if(e)e.hidden=n>0};
 $$("[data-age]",tools).forEach(function(a){a.addEventListener("click",function(e){e.preventDefault();var v=a.getAttribute("data-age");age=v==="tous"?"":v;ap2()})});
 $$("[data-cat]",tools).forEach(function(a){a.addEventListener("click",function(e){e.preventDefault();var v=a.getAttribute("data-cat");cat=v==="tous"?"":v;ap2()})});
 inp.addEventListener("input",function(){q=norm(inp.value.trim());ap2()});ap2()}
/* ----- sommaire de la fiche pratique ----- */
var sl=$$(".be-side ol a");
if(sl.length&&"IntersectionObserver"in window){var hs=sl.map(function(a){return document.getElementById(a.getAttribute("href").slice(1))}).filter(Boolean);
 var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){sl.forEach(function(a){a.removeAttribute("aria-current")});var a=$('.be-side ol a[href="#'+e.target.id+'"]');if(a)a.setAttribute("aria-current","true")}})},{rootMargin:"-20% 0px -70% 0px"});hs.forEach(function(h){io.observe(h)})}
})();
