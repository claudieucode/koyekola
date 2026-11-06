(function(){var B=document.body;if(!B||B.getAttribute("data-kw-pack")!=="jardin")return;
var RM=window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches;
var $=function(s,e){return(e||document).querySelector(s)},$$=function(s,e){return[].slice.call((e||document).querySelectorAll(s))};
function el(t,c,h){var e=document.createElement(t);if(c)e.className=c;if(h!=null)e.innerHTML=h;return e}
function norm(s){return(s||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"")}
function qs(k){var m=new RegExp("[?&]"+k+"=([a-z0-9-]+)").exec(location.search);return m?m[1]:""}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
var SN={graine:"Graine",pousse:"Pousse",arbre:"Arbre"};
$$("[data-anchor]").forEach(function(e){e.id=e.getAttribute("data-anchor")});$$(".ja-tablewrap").forEach(function(e){e.tabIndex=0});
if(location.hash){var th=document.getElementById(location.hash.slice(1));if(th)setTimeout(function(){th.scrollIntoView()},60)}
/* ----- index des notes : stade, étiquette, mot ----- */
var tools=$("[data-ja-tools]"),lst=$("[data-ja-list]");
if(tools&&lst&&!$(".ja-bricks--home")){var items=$$(".ja-item",lst),st=qs("s"),tag=qs("tag"),q="";if(st==="tous")st="";
 var lab=el("label","ja-search"),inp=el("input","ja-qin");inp.type="search";inp.placeholder="Un mot, un titre…";inp.setAttribute("aria-label","Filtrer les notes");lab.appendChild(inp);tools.insertBefore(lab,tools.children[1]||null);
 var app=function(){var n=0;items.forEach(function(it){var tg=(it.getAttribute("data-tags")||"").split("|").map(norm);var ok=(!st||it.getAttribute("data-s")===st)&&(!tag||tg.indexOf(tag)>-1)&&(!q||norm(it.getAttribute("data-q")).indexOf(q)>-1);it.hidden=!ok;if(ok)n++});
  $$("[data-s]",tools).forEach(function(a){var v=a.getAttribute("data-s")==="tous"?"":a.getAttribute("data-s");if(v===st)a.setAttribute("aria-current","true");else a.removeAttribute("aria-current")});
  $$("[data-tag]",tools).forEach(function(a){if(norm(a.getAttribute("data-tag"))===tag)a.setAttribute("aria-current","true");else a.removeAttribute("aria-current")});
  $("[data-ja-n]",tools).textContent=n;var e=$("[data-ja-empty]");if(e)e.hidden=n>0};
 $$("[data-s]",tools).forEach(function(a){a.addEventListener("click",function(e){e.preventDefault();var v=a.getAttribute("data-s");st=v==="tous"?"":v;app()})});
 $$("[data-tag]",tools).forEach(function(a){a.addEventListener("click",function(e){e.preventDefault();var v=norm(a.getAttribute("data-tag"));tag=tag===v?"":v;app()})});
 inp.addEventListener("input",function(){q=norm(inp.value.trim());app()});app()}
/* ----- aperçu des liens internes ----- */
if(B.getAttribute("data-pk-apercu")!=="off"&&window.matchMedia&&matchMedia("(hover: hover)").matches){
 var pv=el("div","ja-prev");pv.setAttribute("role","tooltip");pv.hidden=true;B.appendChild(pv);var cur=null;
 var show=function(a){cur=a;pv.innerHTML='<p class="ja-prev-s">'+(SN[a.getAttribute("data-s")]||"")+'</p><p class="ja-prev-t">'+esc(a.getAttribute("data-t")||"")+'</p><p class="ja-prev-x">'+esc(a.getAttribute("data-x")||"")+"</p>";pv.hidden=false;
  var r=a.getBoundingClientRect(),w=pv.offsetWidth,x=Math.min(Math.max(8,r.left),window.innerWidth-w-8),y=r.bottom+8;if(y+pv.offsetHeight>window.innerHeight-8)y=Math.max(8,r.top-pv.offsetHeight-8);pv.style.left=x+"px";pv.style.top=y+"px";a.setAttribute("aria-describedby","ja-prev-tip");pv.id="ja-prev-tip"};
 var hide=function(){if(cur)cur.removeAttribute("aria-describedby");cur=null;pv.hidden=true};
 $$("a.ja-wl").forEach(function(a){a.addEventListener("mouseenter",function(){show(a)});a.addEventListener("focus",function(){show(a)});a.addEventListener("mouseleave",hide);a.addEventListener("blur",hide)});
 document.addEventListener("keydown",function(e){if(e.key==="Escape")hide()});window.addEventListener("scroll",hide,{passive:true})}
/* ----- cartes du jardin ----- */
$$("[data-ja-svg]").forEach(function(svg){var nodes=$$(".ja-n",svg),edges=$$(".ja-e",svg),panel=$("[data-ja-panel]"),full=svg.classList.contains("ja-g--full"),T={};
 nodes.forEach(function(n,i){T[n.getAttribute("data-id")]=n;n.style.setProperty("--d",(i*0.37).toFixed(2)+"s")});
 function nb(id){var o=[];edges.forEach(function(e){var a=e.getAttribute("data-a"),b=e.getAttribute("data-b");if(a===id)o.push(b);else if(b===id)o.push(a)});return o}
 function light(id){var ns=id?nb(id):[];svg.classList.toggle("ja-g--sel",!!id);nodes.forEach(function(n){var k=n.getAttribute("data-id");n.classList.toggle("ja-n--on",k===id);n.classList.toggle("ja-n--nb",ns.indexOf(k)>-1)});
  edges.forEach(function(e){var a=e.getAttribute("data-a"),b=e.getAttribute("data-b");e.classList.toggle("ja-e--on",!!id&&(a===id||b===id))})}
 function choose(id){svg.setAttribute("data-sel",id);light(id);if(!panel)return;var n=T[id],ns=nb(id);panel.innerHTML='<p class="ja-panel-s">'+(SN[n.getAttribute("data-s")]||"")+'</p><p class="ja-panel-t">'+esc(n.getAttribute("data-t"))+'</p><p class="ja-panel-x">'+esc(n.getAttribute("data-x")||"")+'</p><p class="ja-panel-h">'+ns.length+" note"+(ns.length>1?"s":"")+' reliée'+(ns.length>1?"s":"")+'</p><ul class="ja-panel-l">'+ns.map(function(k){return'<li><button type="button" data-go="'+k+'">'+esc(T[k].getAttribute("data-t"))+"</button></li>"}).join("")+'</ul><p><a class="ja-btn ja-btn--sm" href="/note">Ouvrir la note</a></p>';
  $$("[data-go]",panel).forEach(function(b){b.addEventListener("click",function(){choose(b.getAttribute("data-go"))})})}
 if(full){nodes.forEach(function(n){n.setAttribute("tabindex","0");n.setAttribute("role","button");n.setAttribute("aria-label",n.getAttribute("data-t")+", "+(SN[n.getAttribute("data-s")]||"").toLowerCase());
  n.addEventListener("click",function(){choose(n.getAttribute("data-id"))});n.addEventListener("keydown",function(e){if(e.key==="Enter"||e.key===" "){e.preventDefault();choose(n.getAttribute("data-id"))}});
  n.addEventListener("mouseenter",function(){light(n.getAttribute("data-id"))});n.addEventListener("mouseleave",function(){light(svg.getAttribute("data-sel")||"")});n.addEventListener("focus",function(){light(n.getAttribute("data-id"))})});
  svg.addEventListener("click",function(e){if(e.target.classList&&e.target.classList.contains("ja-n"))svg.setAttribute("data-sel",e.target.getAttribute("data-id"))})}
 else if(!RM){nodes.forEach(function(n){n.addEventListener("mouseenter",function(){light(n.getAttribute("data-id"))});n.addEventListener("mouseleave",function(){light("")})})}
});
})();
