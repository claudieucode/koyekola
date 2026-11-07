(function(){var B=document.body;if(!B||B.getAttribute("data-kw-pack")!=="sou")return;
var RM=window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches;
var $=function(s,e){return(e||document).querySelector(s)},$$=function(s,e){return[].slice.call((e||document).querySelectorAll(s))};
var nf=new Intl.NumberFormat("fr-FR",{maximumFractionDigits:0}),nd=new Intl.NumberFormat("fr-FR",{maximumFractionDigits:1});
var eur=function(n){return nf.format(Math.round(n))+" €"};
function el(t,c,h){var e=document.createElement(t);if(c)e.className=c;if(h!=null)e.innerHTML=h;return e}
function norm(s){return(s||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"")}
var uid=0;
$$("[data-anchor]").forEach(function(e){e.id=e.getAttribute("data-anchor")});$$(".so-tablewrap").forEach(function(e){e.tabIndex=0});
if(location.hash){var th=document.getElementById(location.hash.slice(1));if(th)setTimeout(function(){th.scrollIntoView()},60)}
/* ----- calculateurs ----- */
var DEF={
interets:{f:[["capital","Capital de départ",0,100000,500,1000,"€"],["mensuel","Versement mensuel",0,2000,10,100,"€"],["taux","Rendement annuel",0,10,.1,3,"%"],["annees","Durée",1,50,1,10,"ans"]],
 run:function(v){var r=Math.pow(1+v.taux/100,1/12)-1,b=v.capital,ys=[],i;for(i=1;i<=v.annees*12;i++){b=b*(1+r)+v.mensuel;if(i%12===0)ys.push(b)}var ver=v.capital+v.mensuel*v.annees*12;
  return{main:["Capital final",eur(b)],rows:[["Total versé",eur(ver)],["Intérêts gagnés",eur(b-ver)],["Part des intérêts",nd.format(b?((b-ver)/b)*100:0)+" %"]],chart:{ys:ys,ver:function(k){return v.capital+v.mensuel*12*(k+1)}}}}},
budget:{f:[["revenu","Revenu net mensuel",500,10000,50,2000,"€"],["modele","Répartition","","","","0","sel",[["0","50 / 30 / 20 (classique)"],["1","60 / 25 / 15 (loyer lourd)"],["2","45 / 25 / 30 (épargne forte)"]]]],
 run:function(v){var M=[[50,30,20],[60,25,15],[45,25,30]][+v.modele||0],n=["Besoins","Envies","Épargne et dettes"];return{main:["À mettre de côté",eur(v.revenu*M[2]/100)],rows:M.map(function(p,i){return[n[i]+" ("+p+" %)",eur(v.revenu*p/100)]}),bars:M}}},
credit:{f:[["montant","Somme empruntée",1000,300000,500,15000,"€"],["taux","Taux annuel",0,15,.1,4,"%"],["duree","Durée",1,25,1,5,"ans"],["assur","Assurance par mois",0,200,5,0,"€"]],
 run:function(v){var n=v.duree*12,t=v.taux/1200,m=t?v.montant*t/(1-Math.pow(1+t,-n)):v.montant/n,tot=(m+v.assur)*n;return{main:["Mensualité",eur(m+v.assur)],rows:[["Dont assurance",eur(v.assur)],["Intérêts payés",eur(m*n-v.montant)],["Total remboursé",eur(tot)]],bars:[Math.round(v.montant/tot*100),Math.round((tot-v.montant)/tot*100)]}}}};
function mount(box){var k=box.getAttribute("data-so-calc"),d=DEF[k];if(!d)return;var vals={},id="soc"+(++uid);box.innerHTML="";box.classList.add("so-calc--on");
 var form=el("div","so-cf"),out=el("div","so-res");out.setAttribute("aria-live","polite");
 d.f.forEach(function(f){var fid=id+"-"+f[0],w=el("div","so-fld"),lab=el("label","",f[1]);lab.htmlFor=fid;w.appendChild(lab);vals[f[0]]=f[6]==="sel"?f[5]:+f[5];
  if(f[6]==="sel"){var s=el("select","so-sel");s.id=fid;f[7].forEach(function(o){var op=el("option","",o[1]);op.value=o[0];s.appendChild(op)});s.value=f[5];s.addEventListener("change",function(){vals[f[0]]=s.value;draw()});w.appendChild(s)}
  else{var r=el("input","so-range");r.type="range";r.id=fid;r.min=f[2];r.max=f[3];r.step=f[4];r.value=f[5];var n=el("input","so-num");n.type="number";n.min=f[2];n.max=f[3];n.step=f[4];n.value=f[5];n.setAttribute("aria-label",f[1]+" ("+f[6]+")");var u=el("span","so-unit",f[6]);
   var sync=function(src){var x=parseFloat(src.value);if(isNaN(x))return;x=Math.max(f[2],Math.min(f[3],x));vals[f[0]]=x;if(src!==r)r.value=x;if(src!==n)n.value=x;draw()};
   r.addEventListener("input",function(){sync(r)});n.addEventListener("input",function(){sync(n)});var row=el("div","so-fr");row.appendChild(r);var nw=el("span","so-nw");nw.appendChild(n);nw.appendChild(u);row.appendChild(nw);w.appendChild(row)}
  form.appendChild(w)});
 box.appendChild(form);box.appendChild(out);
 function draw(){var o=d.run(vals),h='<p class="so-res-l">'+o.main[0]+'</p><p class="so-res-big">'+o.main[1]+'</p><dl class="so-res-d">'+o.rows.map(function(r){return"<div><dt>"+r[0]+"</dt><dd>"+r[1]+"</dd></div>"}).join("")+"</dl>";
  if(o.chart&&o.chart.ys.length){var ys=o.chart.ys,mx=ys[ys.length-1]||1,W=300,H=70,bw=W/ys.length,g="";ys.forEach(function(y,i){var vv=Math.min(o.chart.ver(i),y),a=y/mx*H,b=vv/mx*H;g+='<rect x="'+(i*bw+.5)+'" y="'+(H-a)+'" width="'+Math.max(bw-1,1)+'" height="'+a+'" class="so-bi"/><rect x="'+(i*bw+.5)+'" y="'+(H-b)+'" width="'+Math.max(bw-1,1)+'" height="'+b+'" class="so-bv"/>'});
   h+='<svg class="so-chart" viewBox="0 0 '+W+" "+H+'" role="img" aria-label="Évolution du capital année par année : part versée en foncé, intérêts en clair">'+g+'</svg><p class="so-legend"><span class="so-lg so-lg--v"></span>Versé <span class="so-lg so-lg--i"></span>Intérêts</p>'}
  else if(o.bars){h+='<div class="so-bars" aria-hidden="true">'+o.bars.map(function(p,i){return'<i class="so-b'+i+'" style="width:'+p+'%"></i>'}).join("")+"</div>"}
  h+='<p class="so-fine">Simulation pédagogique : ni offre, ni conseil.</p>';out.innerHTML=h}
 draw()}
$$("[data-so-calc]").forEach(mount);
/* ----- compteurs ----- */
var cs=$$("[data-so-count]");
if(cs.length&&"IntersectionObserver"in window&&!RM){var io=new IntersectionObserver(function(es){es.forEach(function(e){if(!e.isIntersecting)return;io.unobserve(e.target);var t=+e.target.getAttribute("data-so-count"),s=null;function st(ts){if(s===null)s=ts;var p=Math.min((ts-s)/900,1);e.target.textContent=Math.round(t*(1-Math.pow(1-p,3)));if(p<1)requestAnimationFrame(st)}requestAnimationFrame(st)})});cs.forEach(function(c){io.observe(c)})}
/* ----- filtres de la liste d'articles ----- */
var tools=$("[data-so-tools]"),lst=$("[data-so-list]");
if(tools&&lst){var items=$$(".so-item",lst),chips=$$("[data-cat]",tools),cat=(/[?&]cat=([a-z]+)/.exec(location.search)||[])[1]||"",q="";
 var lab=el("label","so-search"),inp=el("input","so-q");inp.type="search";inp.placeholder="Un mot, un auteur…";inp.setAttribute("aria-label","Filtrer les articles");lab.appendChild(inp);tools.insertBefore(lab,tools.children[1]||null);
 var app=function(){var n=0;items.forEach(function(it){var ok=(!cat||it.getAttribute("data-cat")===cat)&&(!q||norm(it.getAttribute("data-q")).indexOf(q)>-1);it.hidden=!ok;if(ok)n++});
  chips.forEach(function(c){var on=(c.getAttribute("data-cat")==="tous"?"":c.getAttribute("data-cat"))===cat;if(on)c.setAttribute("aria-current","true");else c.removeAttribute("aria-current")});
  $("[data-so-n]",tools).textContent=n;var e=$("[data-so-empty]");if(e)e.hidden=n>0};
 chips.forEach(function(c){c.addEventListener("click",function(ev){ev.preventDefault();cat=c.getAttribute("data-cat")==="tous"?"":c.getAttribute("data-cat");try{history.replaceState(null,"",cat?"?cat="+cat:location.pathname)}catch(x){}app()})});
 inp.addEventListener("input",function(){q=norm(inp.value.trim());app()});app()}
/* ----- glossaire ----- */
var gl=$("[data-so-gloss]"),gd=$("[data-so-glist]");
if(gl&&gd){var terms=$$(".so-term",gd),l2=el("label","so-search"),i2=el("input","so-q");i2.type="search";i2.placeholder="Filtrer les mots…";i2.setAttribute("aria-label","Filtrer le glossaire");l2.appendChild(i2);gl.appendChild(l2);
 i2.addEventListener("input",function(){var q2=norm(i2.value.trim()),n=0;terms.forEach(function(t){var ok=!q2||norm(t.getAttribute("data-q")).indexOf(q2)>-1;t.hidden=!ok;if(ok)n++});$("[data-so-n]",gl).textContent=n;var e=$("[data-so-gempty]");if(e)e.hidden=n>0})}
/* ----- sommaire actif ----- */
var tl=$$(".so-toc a");
if(tl.length&&"IntersectionObserver"in window){var hs=tl.map(function(a){return document.getElementById(a.getAttribute("href").slice(1))}).filter(Boolean);
 var io2=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){tl.forEach(function(a){a.removeAttribute("aria-current")});var a=$('.so-toc a[href="#'+e.target.id+'"]');if(a)a.setAttribute("aria-current","true")}})},{rootMargin:"-20% 0px -70% 0px"});hs.forEach(function(h){io2.observe(h)})}
})();
