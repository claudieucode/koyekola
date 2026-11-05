// Fournil — boulangerie et café artisanal. Direction artistique : papier kraft, tampons, étiquettes de boulanger et illustrations dessinées au trait épais avec aplats décalés.
// Barre « ticket de caisse » à languettes, collage dessiné, carte du jour en étiquettes, horaires vivants (ouvert / ferme à… / fournée sortie) et composeur de commande à retirer.
const { sec, form, esc, nav } = require("../kit");

const INK = "#2e1d10";
const S = (inner, cls = "", vb = "0 0 100 80") => `<svg class="fn-ill ${cls}" viewBox="${vb}" aria-hidden="true" fill="none" stroke="${INK}" stroke-width="3.5">${inner}</svg>`;
const LIGHT = "#f6dc9f";
const ILL = {
  baguette: () => S(`<g transform="rotate(-20 50 40)"><rect x="4" y="27" width="92" height="26" rx="13" fill="#e0a24f"/><path d="M22 33l7 14M40 33l7 14M58 33l7 14M76 33l7 14" stroke="${LIGHT}" stroke-width="5"/></g>`),
  boule: () => S(`<ellipse cx="50" cy="46" rx="40" ry="28" fill="#dc9c4a"/><path d="M27 32c6 6 8 14 6 22M46 24c4 8 4 18 0 28M65 32c-2 8-2 14 2 22" stroke="${LIGHT}" stroke-width="5"/>`),
  graines: () => S(`<ellipse cx="50" cy="46" rx="40" ry="28" fill="#c98a3d"/><path d="M26 40h48M30 54h40M34 28h32" stroke="${LIGHT}" stroke-width="2.5"/><circle cx="34" cy="36" r="2" fill="${INK}"/><circle cx="52" cy="30" r="2" fill="${INK}"/><circle cx="66" cy="44" r="2" fill="${INK}"/><circle cx="44" cy="52" r="2" fill="${INK}"/><circle cx="26" cy="50" r="2" fill="${INK}"/><circle cx="58" cy="58" r="2" fill="${INK}"/>`),
  seigle: () => S(`<ellipse cx="50" cy="46" rx="40" ry="28" fill="#a9703a"/><path d="M30 34l40 24M30 58l40-24M50 22v48" stroke="${LIGHT}" stroke-width="3.5" opacity=".85"/>`),
  croissant: () => S(`<g fill="#e8a94d"><ellipse cx="14" cy="58" rx="8" ry="13" transform="rotate(48 14 58)"/><ellipse cx="86" cy="58" rx="8" ry="13" transform="rotate(-48 86 58)"/><ellipse cx="28" cy="44" rx="12" ry="20" transform="rotate(34 28 44)"/><ellipse cx="72" cy="44" rx="12" ry="20" transform="rotate(-34 72 44)"/><ellipse cx="50" cy="36" rx="15" ry="23"/></g><path d="M43 17q-4 18 0 38M57 17q4 18 0 38M24 28q6 10 4 26M76 28q-6 10-4 26" stroke-width="2.5"/>`),
  brioche: () => S(`<ellipse cx="50" cy="54" rx="37" ry="22" fill="#d9903e"/><path d="M26 42c4 6 4 16 0 24M40 46c2 6 2 14 0 22M60 46c-2 6-2 14 0 22M74 42c-4 6-4 16 0 24" stroke-width="2.5"/><circle cx="50" cy="26" r="13" fill="#e8a94d"/><path d="M44 22q6-6 12 0" stroke="${LIGHT}" stroke-width="4"/>`),
  painchoc: () => S(`<g transform="rotate(-12 50 40)"><rect x="10" y="16" width="80" height="48" rx="16" fill="#e0a24f"/><path d="M30 18v44M50 18v44M70 18v44" stroke-width="2.5"/><rect x="16" y="33" width="68" height="14" rx="7" fill="#5b3418"/></g>`),
  chausson: () => S(`<path d="M8 62C8 32 28 14 50 14s42 18 42 48z" fill="#e2a54f"/><path d="M28 30l14 28M44 22l16 36M62 26l14 32" stroke="${LIGHT}" stroke-width="4"/><path d="M8 62h84"/>`),
  cookie: () => S(`<circle cx="50" cy="42" r="34" fill="#d99a4a"/><ellipse cx="36" cy="32" rx="6" ry="4.5" fill="#4a2814"/><ellipse cx="60" cy="28" rx="6" ry="4.5" fill="#4a2814"/><ellipse cx="68" cy="50" rx="6" ry="4.5" fill="#4a2814"/><ellipse cx="42" cy="54" rx="6" ry="4.5" fill="#4a2814"/><ellipse cx="52" cy="42" rx="4" ry="3" fill="#4a2814"/>`),
  tarte: () => S(`<path d="M6 62h88L50 14z" fill="#f2c232"/><circle cx="50" cy="22" r="5.5" fill="#fff"/><circle cx="40" cy="34" r="5.5" fill="#fff"/><circle cx="60" cy="34" r="5.5" fill="#fff"/><circle cx="31" cy="46" r="5.5" fill="#fff"/><circle cx="50" cy="45" r="5.5" fill="#fff"/><circle cx="69" cy="46" r="5.5" fill="#fff"/><rect x="6" y="58" width="88" height="14" rx="7" fill="#d99a4a"/>`),
  quiche: () => S(`<path d="M6 62h88L50 14z" fill="#f1d27a"/><circle cx="48" cy="30" r="3" fill="#7fb04a"/><circle cx="38" cy="44" r="3" fill="#c97a6a"/><circle cx="58" cy="42" r="3" fill="#7fb04a"/><circle cx="26" cy="54" r="3" fill="#c97a6a"/><circle cx="72" cy="54" r="3" fill="#7fb04a"/><circle cx="50" cy="52" r="3" fill="#c97a6a"/><rect x="6" y="58" width="88" height="14" rx="7" fill="#d99a4a"/>`),
  sandwich: () => S(`<path d="M8 44c0-14 16-24 42-24s42 10 42 24z" fill="#e0a24f"/><path d="M12 56c6 6 10-4 16 0s10-4 16 0 10-4 16 0 10-4 16 0V46H12z" fill="#7fb04a"/><rect x="12" y="50" width="76" height="8" rx="3" fill="#f0a3a3"/><path d="M8 62h84c0 8-8 14-20 14H28C16 76 8 70 8 62z" fill="#e0a24f"/>`),
  focaccia: () => S(`<rect x="8" y="16" width="84" height="48" rx="14" fill="#e8b45a"/><circle cx="28" cy="34" r="7" fill="#c2431f"/><circle cx="54" cy="28" r="7" fill="#c2431f"/><circle cx="76" cy="40" r="7" fill="#c2431f"/><circle cx="42" cy="50" r="7" fill="#c2431f"/><circle cx="66" cy="54" r="5" fill="#7fb04a"/><circle cx="20" cy="52" r="5" fill="#7fb04a"/>`),
  tasse: (c = "#6b3b1e", band = "#2a5b8c") => S(`<path class="fn-steam" d="M36 22c-5-5 5-8 0-15M50 22c-5-5 5-8 0-15M64 22c-5-5 5-8 0-15" stroke-width="3"/><path d="M16 32h56v14c0 14-10 24-28 24S16 60 16 46z" fill="#fbf3e1"/><path d="M17 48h54" stroke="${band}" stroke-width="7"/><ellipse cx="44" cy="32" rx="28" ry="5" fill="${c}"/><path d="M72 36h6c9 0 9 15 0 15h-8"/><ellipse cx="44" cy="73" rx="38" ry="5" fill="${band}"/>`),
  verre: () => S(`<path d="M72 6 58 40" stroke-width="4"/><path d="M26 22h48l-6 52H32z" fill="#f3e4c4"/><path d="M28 36h44l-4 38H32z" fill="#8d5a2c"/><rect x="36" y="26" width="13" height="13" rx="3" fill="#ffffffcc" transform="rotate(-10 42 32)"/><rect x="52" y="30" width="12" height="12" rx="3" fill="#ffffffcc" transform="rotate(12 58 36)"/>`),
  wheat: () => S(`<path d="M20 88C20 60 20 40 20 14"/><g fill="#e8b45a"><ellipse cx="20" cy="10" rx="5" ry="9"/><ellipse cx="12" cy="26" rx="5" ry="9" transform="rotate(-30 12 26)"/><ellipse cx="28" cy="26" rx="5" ry="9" transform="rotate(30 28 26)"/><ellipse cx="12" cy="42" rx="5" ry="9" transform="rotate(-30 12 42)"/><ellipse cx="28" cy="42" rx="5" ry="9" transform="rotate(30 28 42)"/><ellipse cx="12" cy="58" rx="5" ry="9" transform="rotate(-30 12 58)"/><ellipse cx="28" cy="58" rx="5" ry="9" transform="rotate(30 28 58)"/></g>`, "fn-wheat", "0 0 40 92"),
  four: () => S(`<path d="M14 150V84a86 74 0 0 1 172 0v66z" fill="#b9633f"/><path d="M14 112h172M14 132h172M50 92v20M90 76v36M130 76v36M170 92v20M70 112v20M110 112v20M150 112v20M30 132v18M90 132v18M150 132v18" stroke-width="2" opacity=".55"/><path d="M58 150V104a42 40 0 0 1 84 0v46z" fill="#3b2415"/><path class="fn-fire" d="M80 150c-8-16 4-22 2-34 10 6 10 14 8 18 6-4 8-12 6-20 16 14 18 34 8 36z" fill="#f2b632"/><ellipse cx="120" cy="140" rx="14" ry="8" fill="#dc9c4a"/><ellipse cx="68" cy="144" rx="9" ry="6" fill="#dc9c4a"/><rect x="154" y="8" width="22" height="40" fill="#8c4a2c"/><path d="M4 150h192" stroke-width="5"/>`, "fn-four", "0 0 200 160"),
  panier: () => S(`<path d="M10 34h80l-8 38H18z" fill="#c98a3d"/><path d="M18 46h64M20 58h60M36 34l-2 38M50 34v38M64 34l2 38" stroke-width="2.5"/><path d="M26 34c0-18 48-18 48 0" />`),
};
const face = (skin, hair, mus) => S(`<path d="M30 36c-9-4-7-20 6-18 3-9 25-9 28 0 13-2 15 14 6 18v7H30z" fill="#fbf3e1"/><circle cx="50" cy="56" r="22" fill="${skin}"/><path d="M30 50c2-8 8-12 20-12s18 4 20 12c-6-4-12-5-20-5s-14 1-20 5z" fill="${hair}" stroke-width="2.5"/><circle cx="42" cy="56" r="2.4" fill="${INK}"/><circle cx="58" cy="56" r="2.4" fill="${INK}"/><path d="M42 66q8 7 16 0" stroke-width="3"/>${mus ? `<path d="M40 63q10-5 20 0" fill="${hair}" stroke-width="2.5"/>` : ""}`, "fn-face", "0 0 100 90");

const CATS = [["pains", "Les pains"], ["vienn", "Viennoiseries"], ["sucre", "Le sucré"], ["sale", "Le salé"]];
const CARTE = [
  ["baguette", "Baguette tradition", 1.3, "pains", "Levain et longue pousse, croûte craquante.", "baguette"],
  ["campagne", "Pain de campagne", 4.8, "pains", "La grosse miche à la farine de blé local.", "boule"],
  ["graines", "Pain aux graines", 3.2, "pains", "Tournesol, lin, sésame et un peu de miel.", "graines"],
  ["seigle", "Seigle et noix", 4.2, "pains", "Mie dense, parfait avec un fromage.", "seigle"],
  ["croissant", "Croissant au beurre", 1.4, "vienn", "Feuilleté à la main, sorti vers 8 h 30.", "croissant"],
  ["painchoc", "Pain au chocolat", 1.6, "vienn", "Deux barres de chocolat noir.", "painchoc"],
  ["brioche", "Brioche à tête", 3.9, "vienn", "Mie filante, œufs de la ferme voisine.", "brioche"],
  ["chausson", "Chausson aux pommes", 1.9, "vienn", "Compote maison, pommes de saison.", "chausson"],
  ["cookie", "Cookie noisette", 2.2, "sucre", "Pépites de chocolat, cœur moelleux.", "cookie"],
  ["citron", "Tarte citron meringuée", 3.6, "sucre", "Part de tarte, meringue dorée au chalumeau.", "tarte"],
  ["quiche", "Quiche du jour", 3.8, "sale", "Part généreuse, garniture selon l'arrivage.", "quiche"],
  ["jambon", "Sandwich jambon-beurre", 5.2, "sale", "Baguette du matin, beurre doux, jambon blanc.", "sandwich"],
  ["focaccia", "Focaccia tomates", 3.5, "sale", "Huile d'olive, tomates et basilic.", "focaccia"],
];
const eur = (p) => p.toFixed(2).replace(".", ",") + " €";
const addLink = (it, txt = "+ Ajouter") => `<a class="fn-add" href="#ajouter" data-add data-id="${it[0]}" data-name="${esc(it[1])}" data-price="${it[2]}" role="button" aria-label="Ajouter ${esc(it[1])} à ma commande">${txt}</a>`;
const tagCard = (it, i) => `<article class="fn-tag fn-tag--${i % 4}" data-cat="${it[3]}" data-reveal><span class="fn-hole" aria-hidden="true"></span><div class="fn-tag-ill">${ILL[it[5]]()}</div><h3>${esc(it[1])}</h3><p>${esc(it[4])}</p><div class="fn-tag-foot"><b class="fn-price">${eur(it[2])}</b>${addLink(it)}</div></article>`;
const filters = (extra = []) => `<div class="fn-chips" role="group" aria-label="Filtrer la carte"><a href="#tout" class="is-on" data-filter="all" role="button" aria-pressed="true">Tout</a>${(extra.length ? extra : CATS).map(([k, l]) => `<a href="#${k}" data-filter="${k}" role="button" aria-pressed="false">${l}</a>`).join("")}</div>`;

const DAYS = [[1, "Lundi", "Fermé"], [2, "Mardi", "6 h 30 – 19 h"], [3, "Mercredi", "6 h 30 – 19 h"], [4, "Jeudi", "6 h 30 – 19 h"], [5, "Vendredi", "6 h 30 – 19 h"], [6, "Samedi", "6 h 30 – 19 h 30"], [0, "Dimanche", "7 h – 13 h"]];
const BATCH = [["06:45", "6 h 45", "Baguettes tradition et pains du matin", "0,2,3,4,5,6"], ["08:30", "8 h 30", "Croissants et pains au chocolat", "0,2,3,4,5,6"], ["10:30", "10 h 30", "Pains de campagne et seigle", "0,2,3,4,5,6"], ["15:30", "15 h 30", "Brioches et cookies du goûter", "2,3,4,5,6"]];
const hours = (full) => `<div class="fn-hours${full ? " fn-hours--full" : ""}" data-hours data-state="off">
  <div class="fn-hours-top"><span class="fn-lamp" aria-hidden="true"></span><div><p class="fn-hours-state" data-hr="state" role="status">Ouvert du mardi au dimanche</p><p class="fn-hours-detail" data-hr="detail">Horaires de la semaine ci-dessous.</p></div></div>
  <p class="fn-hours-batch" data-hr="batch">Quatre fournées par jour, la première à 6 h 45.</p>
  <ol class="fn-batches" aria-label="Fournées du jour">${BATCH.map(([t, h, n, d]) => `<li data-t="${t}" data-days="${d}"><time>${h}</time><span>${n}</span></li>`).join("")}</ol>
  <table class="fn-week"><caption>Horaires de la semaine</caption><thead><tr><th scope="col">Jour</th><th scope="col">Ouverture</th></tr></thead><tbody>${DAYS.map(([d, n, h]) => `<tr data-d="${d}"><th scope="row">${n}</th><td>${h}</td></tr>`).join("")}</tbody></table>
</div>`;

const header = (c) => `<header class="fn-head pk-bleed">
  <div class="fn-announce"><span class="fn-live" data-live>Pain tous les jours sauf le lundi</span><a class="fn-bagpill" href="/commandes" data-bagpill hidden>Ma commande : <b data-bagcount>0</b></a></div>
  <div class="fn-ticket"><a class="fn-logo" href="/" aria-label="${esc(c.brand)} — accueil">${ILL.wheat().replace("fn-ill", "fn-ill fn-logo-ill")}<span class="fn-logo-t">Le Fournil<small>de Lison · boulangerie &amp; café</small></span></a>
    <div class="fn-tabs" role="navigation" aria-label="Navigation principale">${c.menu.map(({ label, url }, i) => `<a class="fn-tab fn-t${i % 4}" href="${esc(url)}">${esc(label)}</a>`).join("")}</div>
    <details class="fn-burger"><summary aria-label="Ouvrir le menu"><span class="fn-burger-ico" aria-hidden="true"></span>Menu</summary><div class="fn-drawer" role="navigation" aria-label="Menu mobile">${c.menu.map(({ label, url }, i) => `<a class="fn-dr fn-t${i % 4}" href="${esc(url)}">${esc(label)}</a>`).join("")}</div></details>
  </div></header>`;

const footer = (c) => `<footer class="fn-foot pk-bleed"><div class="fn-wrap fn-foot-grid">
  <div class="fn-foot-brand"><p class="fn-foot-logo">Le Fournil de Lison</p><address>12 rue des Meuniers<br>69007 Lyon<br><a href="mailto:bonjour@fournil-de-lison.example">bonjour@fournil-de-lison.example</a></address></div>
  <div><h3>Horaires</h3><p class="fn-foot-h">Mar – ven · 6 h 30 – 19 h<br>Samedi · 6 h 30 – 19 h 30<br>Dimanche · 7 h – 13 h<br>Lundi · fermé</p></div>
  <div><h3>Le fournil</h3>${nav(c.menu.slice(1, 5), "fn-fl")}</div>
  <div><h3>Pratique</h3>${nav(c.menu.slice(5), "fn-fl")}<a class="fn-fl" href="/recherche">Rechercher</a></div></div>
  <p class="fn-legal">© Le Fournil de Lison — site de démonstration. Boulangerie, adresses, prix, horaires et fournées fictifs.</p></footer>`;

const pagehead = (kicker, title, sub, ill, tone = "kraft") => sec(`<section class="fn-ph fn-ph--${tone} pk-bleed"><div class="fn-wrap fn-ph-in"><div><p class="fn-kicker" data-reveal>${esc(kicker)}</p><div class="fn-h1" role="heading" aria-level="1" data-reveal>${title}</div>${sub ? `<p class="fn-sub" data-reveal>${esc(sub)}</p>` : ""}</div><div class="fn-ph-ill" aria-hidden="true">${ill}</div></div></section>`);

const stamps = `<section class="fn-stamps pk-bleed"><ul class="fn-wrap fn-stamps-in"><li class="fn-stamp fn-stamp--a">Levain maison</li><li class="fn-stamp fn-stamp--b">Farine de blé local</li><li class="fn-stamp fn-stamp--c">Beurre fermier</li><li class="fn-stamp fn-stamp--d">Cuit au feu de bois</li></ul></section>`;

const cta = (title, txt, href, label) => sec(`<section class="fn-cta pk-bleed"><div class="fn-wrap fn-cta-in"><div class="fn-cta-ill" aria-hidden="true">${ILL.panier()}</div><div><h2 class="fn-h2" data-reveal>${title}</h2><p data-reveal>${esc(txt)}</p></div><a class="fn-btn fn-btn--light" href="${href}" data-reveal>${esc(label)}</a></div></section>`);

const NEWS = [
  ["12 nov.", "Nouveau", "Le pain aux noix et figues revient", "Tous les vendredis jusqu'à Noël, à la deuxième fournée.", "wheat"],
  ["4 nov.", "Fournil", "On change de farine", "Un nouveau meunier à vingt kilomètres : même blé ancien, moulu sur meule de pierre.", "boule"],
  ["28 oct.", "Café", "Le café de saison est arrivé", "Un brûlé doux aux notes de noisette, torréfié par un artisan voisin.", "tasse"],
  ["19 oct.", "Atelier", "Atelier pain du dimanche matin", "Pétrissage, façonnage et fournée à partager. Écrivez-nous pour demander une place.", "baguette"],
  ["7 oct.", "Maison", "Le fournil a quinze ans", "Merci aux habitués du matin, aux enfants de la brioche et à la file du samedi.", "brioche"],
  ["30 sept.", "Sucré", "La tarte aux prunes, c'est maintenant", "Les premières mirabelles sont dans le four ; la tarte ne durera pas.", "tarte"],
];
const newsNote = (n, i) => `<article class="fn-note fn-note--${i % 3}" data-reveal><time class="fn-date">${n[0]}</time><span class="fn-pin" aria-hidden="true"></span><div class="fn-note-ill" aria-hidden="true">${ILL[n[4]]()}</div><p class="fn-note-tag">${n[1]}</p><h3>${esc(n[2])}</h3><p>${esc(n[3])}</p></article>`;

const home = (c) => [
  sec(header(c)),
  sec(`<section class="fn-hero pk-bleed"><div class="fn-wrap fn-hero-in">
    <div class="fn-hero-copy"><p class="fn-kicker" data-reveal>Boulangerie &amp; café · Lyon 7<sup>e</sup> (fictif)</p>
      <div class="fn-mega" role="heading" aria-level="1"><span data-reveal>Du pain</span><span class="fn-mega-2" data-reveal>sorti du four</span><span data-reveal>ce matin.</span></div>
      <p class="fn-lead" data-reveal>Quatre fournées par jour, un levain nourri depuis quinze ans et un café qui sent la croûte chaude. Tout est fait à la main, derrière le comptoir.</p>
      <div class="fn-actions" data-reveal><a class="fn-btn" href="/carte">Voir la carte du jour</a><a class="fn-btn fn-btn--line" href="/commandes">Commander à retirer</a></div>
      <p class="fn-hero-live" data-reveal><span class="fn-lamp" aria-hidden="true"></span><span data-live>Pain tous les jours sauf le lundi</span></p></div>
    <div class="fn-collage" aria-hidden="true">
      <div class="fn-piece fn-p1">${ILL.boule()}<span class="fn-tape"></span></div>
      <div class="fn-piece fn-p2">${ILL.croissant()}</div>
      <div class="fn-piece fn-p3">${ILL.tasse()}</div>
      <div class="fn-piece fn-p4">${ILL.baguette()}</div>
      <div class="fn-piece fn-p5">${ILL.wheat()}</div>
      <div class="fn-sticker" data-stamp>Fait<br>main</div>
      <div class="fn-scrap">6 h 45<br><small>1<sup>re</sup> fournée</small></div>
    </div></div></section>`),
  sec(stamps),
  sec(`<section class="fn-today fn-band fn-band--cream pk-bleed"><div class="fn-wrap fn-today-in">
    <div class="fn-today-copy"><p class="fn-kicker" data-reveal>Aujourd'hui au fournil</p><h2 class="fn-h2" data-reveal>Est-ce que ça sent le pain, là, maintenant&nbsp;?</h2><p data-reveal>Cet encart suit l'heure de votre appareil : il dit si le fournil est ouvert, quand il ferme et quelle fournée vient de sortir.</p>
      <div class="fn-today-ill" aria-hidden="true">${ILL.four()}</div></div>
    ${hours(false)}</div></section>`),
  sec(`<section class="fn-board fn-band fn-band--kraft pk-bleed" data-filterbox><div class="fn-wrap"><div class="fn-sechead"><div><p class="fn-kicker" data-reveal>La carte du jour</p><h2 class="fn-h2" data-reveal>Écrit à la craie ce matin.</h2></div>${filters()}</div>
    <div class="fn-tags">${CARTE.slice(0, 8).map(tagCard).join("")}</div>
    <p class="fn-board-foot" data-reveal><a class="fn-more" href="/carte">Toute la carte</a><a class="fn-more fn-more--bag" href="/commandes">Voir ma commande (<b data-bagcount>0</b>)</a><span class="fn-note-msg" data-bagmsg role="status"></span></p></div></section>`),
  sec(`<section class="fn-story fn-band fn-band--blue pk-bleed"><div class="fn-wrap fn-story-in"><div class="fn-story-ill" aria-hidden="true">${face("#e9b88f", "#4a2c17", true)}${face("#c98f66", "#1e130b", false)}</div>
    <div><p class="fn-kicker fn-kicker--light" data-reveal>Le fournil</p><h2 class="fn-h2 fn-h2--light" data-reveal>Cinq ingrédients, beaucoup de patience.</h2><p data-reveal>Farine, eau, sel, levain, et du temps. Pas d'additif, pas de raccourci : la pâte repose dix-huit heures avant de rencontrer le feu. Lison et Malo pétrissent à trois heures du matin pour que vous trouviez le pain encore chaud.</p><a class="fn-btn fn-btn--light" href="/fournil" data-reveal>Découvrir le fournil</a></div></div></section>`),
  sec(`<section class="fn-steps fn-band fn-band--cream pk-bleed"><div class="fn-wrap"><p class="fn-kicker" data-reveal>Commander sans faire la queue</p><h2 class="fn-h2" data-reveal>Vous choisissez, on prépare, vous passez.</h2>
    <ol class="fn-ticks"><li data-reveal><span class="fn-tick-n">1</span><h3>Composez</h3><p>Ajoutez baguettes, viennoiseries ou parts de tarte.</p></li><li data-reveal><span class="fn-tick-n">2</span><h3>Choisissez le créneau</h3><p>Un jour d'ouverture, une plage horaire.</p></li><li data-reveal><span class="fn-tick-n">3</span><h3>Envoyez</h3><p>Le récapitulatif part vers le formulaire de contact. Rien à payer en ligne.</p></li></ol>
    <a class="fn-btn" href="/commandes" data-reveal>Composer ma commande</a></div></section>`),
  sec(`<section class="fn-news fn-band fn-band--kraft pk-bleed"><div class="fn-wrap"><div class="fn-sechead"><div><p class="fn-kicker" data-reveal>Sur le tableau de liège</p><h2 class="fn-h2" data-reveal>Les nouvelles du comptoir</h2></div><a class="fn-more" href="/actualites">Toutes les actualités</a></div>
    <div class="fn-notes fn-notes--three">${NEWS.slice(0, 3).map(newsNote).join("")}</div></div></section>`),
  sec(footer(c)),
];

const carte = (c) => [sec(header(c)), pagehead("La carte", "Ce que le four sait faire", "Prix indicatifs de démonstration. Le choix change avec les fournées : certaines pièces partent avant midi.", `<div class="fn-ph-card">${ILL.baguette()}</div><div class="fn-ph-card fn-ph-card--b">${ILL.croissant()}</div>`, "cream"),
  sec(`<section class="fn-menu fn-band fn-band--kraft pk-bleed" data-filterbox><div class="fn-wrap"><div class="fn-menu-top">${filters()}<p class="fn-board-foot"><a class="fn-more fn-more--bag" href="/commandes">Ma commande (<b data-bagcount>0</b>)</a><span class="fn-note-msg" data-bagmsg role="status"></span></p></div>
    <div class="fn-menu-paper">${CATS.map(([k, l]) => `<section class="fn-cat" data-cat="${k}"><h2 class="fn-cat-t">${l}</h2><ul class="fn-lines">${CARTE.filter((i) => i[3] === k).map((it) => `<li class="fn-line-item"><div class="fn-line-ill" aria-hidden="true">${ILL[it[5]]()}</div><div class="fn-line-txt"><h3>${esc(it[1])}</h3><p>${esc(it[4])}</p></div><span class="fn-leader" aria-hidden="true"></span><b class="fn-price">${eur(it[2])}</b>${addLink(it, "+")}</li>`).join("")}</ul></section>`).join("")}</div></div></section>`),
  sec(`<section class="fn-allerg fn-band fn-band--cream pk-bleed"><div class="fn-wrap fn-allerg-in"><div><h2 class="fn-h2">Allergènes</h2><p>Gluten (blé, seigle), lait, œufs, fruits à coque et sésame passent tous par le fournil. Demandez au comptoir la liste précise de chaque pièce.</p></div>
    <details><summary>Les pièces sans œuf</summary><p>Baguette tradition, pain de campagne, pain aux graines, seigle et noix, focaccia. Toujours à vérifier au comptoir.</p></details>
    <details><summary>Les pièces sans fruits à coque</summary><p>Baguette, campagne, croissant, pain au chocolat, chausson, quiche. Le cookie contient de la noisette.</p></details></div></section>`),
  cta("Une commande pour demain ?", "Composez votre sac de pain et envoyez le récapitulatif au fournil.", "/commandes", "Composer ma commande"), sec(footer(c))];

const TL = [
  ["3 h 00", "On allume", "Lison rallume le feu de bois et sort le levain du frais. La rue dort encore.", "four"],
  ["4 h 00", "Pétrissage", "Farine, eau, sel et levain : la pâte est tournée à la main, jamais pressée.", "wheat"],
  ["6 h 45", "Première fournée", "Les baguettes passent sur la sole. On entend la croûte chanter en refroidissant.", "baguette"],
  ["8 h 30", "Le beurre", "Les croissants sortent, dorés, feuilletés, avant que la file ne tourne au coin.", "croissant"],
  ["12 h 00", "Pause", "Quiches, focaccias et sandwiches pour la pause de midi.", "sandwich"],
  ["15 h 30", "Le goûter", "Brioches et cookies pour les enfants qui sortent de l'école.", "cookie"],
  ["19 h 00", "On range", "Dernier coup de balai, le levain est nourri pour demain.", "panier"],
];
const fournil = (c) => [sec(header(c)), pagehead("Le fournil", "Une maison, un four, une équipe.", "Quinze ans d'histoire, racontés par ceux qui pétrissent. Personnages et chiffres fictifs.", `<div class="fn-ph-card">${ILL.four()}</div>`, "blue"),
  sec(`<section class="fn-manifest fn-band fn-band--cream pk-bleed"><div class="fn-wrap fn-manifest-in"><blockquote class="fn-quote" data-reveal><p>« On ne fait pas du pain pour aller vite. On le fait pour que la table s'assoie. »</p><footer>Lison, boulangère (fictive)</footer></blockquote>
    <div class="fn-facts"><div data-reveal><b data-count="18">18</b><span>heures de pousse</span></div><div data-reveal><b data-count="5">5</b><span>ingrédients, pas un de plus</span></div><div data-reveal><b data-count="4">4</b><span>fournées par jour</span></div><div data-reveal><b data-count="15">15</b><span>ans de levain</span></div></div></div></section>`),
  sec(`<section class="fn-timeline fn-band fn-band--kraft pk-bleed"><div class="fn-wrap"><p class="fn-kicker" data-reveal>Une journée au fournil</p><h2 class="fn-h2" data-reveal>De trois heures à sept heures du soir.</h2>
    <ol class="fn-tl">${TL.map((t, i) => `<li class="fn-tl-i fn-tl-i--${i % 2}" data-reveal><time class="fn-tl-t">${t[0]}</time><div class="fn-tl-card"><div class="fn-tl-ill" aria-hidden="true">${ILL[t[3]]()}</div><h3>${t[1]}</h3><p>${t[2]}</p></div></li>`).join("")}</ol></div></section>`),
  sec(`<section class="fn-team fn-band fn-band--cream pk-bleed"><div class="fn-wrap"><h2 class="fn-h2" data-reveal>Ceux qui sont derrière le comptoir</h2>
    <div class="fn-folk"><article data-reveal>${face("#e9b88f", "#4a2c17", false)}<h3>Lison</h3><p class="fn-role">Boulangère et fondatrice</p><p>Garde le levain et choisit la farine.</p></article>
    <article data-reveal>${face("#c98f66", "#1e130b", true)}<h3>Malo</h3><p class="fn-role">Pâtissier</p><p>Tartes, cookies, et la fameuse brioche à tête.</p></article>
    <article data-reveal>${face("#f1cba7", "#a35a2a", false)}<h3>Inès</h3><p class="fn-role">Comptoir et café</p><p>Moud le café, connaît tous les prénoms.</p></article></div></div></section>`),
  cta("Venez sentir par vous-même.", "Le fournil est ouvert du mardi au dimanche, la première fournée sort à 6 h 45.", "/infos", "Horaires et accès"), sec(footer(c))];

const DRINKS = [
  ["chaud", "Espresso", "1,80", "2,40", "3,20", "Court, serré, noisette.", "#4a2814"],
  ["chaud", "Café crème", "2,60", "3,20", "3,80", "Lait fermier mousseux.", "#a9703a"],
  ["chaud", "Chocolat chaud", "3,40", "4,00", "4,60", "Chocolat noir fondu, pas de poudre.", "#5b3418"],
  ["sans", "Thé du jour", "2,80", "3,40", "4,00", "Feuilles en vrac, infusion de quatre minutes.", "#c68a2c"],
  ["froid", "Café glacé", "3,20", "3,80", "4,40", "Infusé à froid douze heures.", "#8d5a2c"],
  ["sans", "Citronnade maison", "2,80", "3,40", "4,00", "Citron pressé, miel, menthe.", "#e0c640"],
];
const boissons = (c) => [sec(header(c)), pagehead("Cafés & boissons", "Le café qui va avec la croûte.", "Torréfié par un artisan voisin, moulu à la minute. Prix indicatifs de démonstration.", `<div class="fn-ph-card">${ILL.tasse()}</div><div class="fn-ph-card fn-ph-card--b">${ILL.verre()}</div>`, "dark"),
  sec(`<section class="fn-slate fn-band fn-band--dark pk-bleed" data-filterbox><div class="fn-wrap"><div class="fn-sechead"><h2 class="fn-h2 fn-h2--light" data-reveal>L'ardoise</h2><div class="fn-chips fn-chips--dark" role="group" aria-label="Filtrer les boissons"><a href="#tout" class="is-on" data-filter="all" role="button" aria-pressed="true">Toutes</a><a href="#chaud" data-filter="chaud" role="button" aria-pressed="false">Chaud</a><a href="#froid" data-filter="froid" role="button" aria-pressed="false">Froid</a><a href="#sans" data-filter="sans" role="button" aria-pressed="false">Sans caféine</a></div></div>
    <div class="fn-drinks">${DRINKS.map((d, i) => `<article class="fn-drink" data-cat="${d[0]}" data-reveal><div class="fn-drink-ill" aria-hidden="true">${d[0] === "froid" ? ILL.verre() : ILL.tasse(d[6], i % 2 ? "#c2431f" : "#2a5b8c")}</div><div><h3>${d[1]}</h3><p>${d[5]}</p></div>
      <table class="fn-sizes"><thead><tr><th scope="col">Petit</th><th scope="col">Moyen</th><th scope="col">Grand</th></tr></thead><tbody><tr><td data-l="Petit">${d[2]} €</td><td data-l="Moyen">${d[3]} €</td><td data-l="Grand">${d[4]} €</td></tr></tbody></table></article>`).join("")}</div></div></section>`),
  sec(`<section class="fn-roast fn-band fn-band--cream pk-bleed"><div class="fn-wrap fn-roast-in"><div><p class="fn-kicker" data-reveal>Le café de la maison</p><h2 class="fn-h2" data-reveal>Trois torréfactions, une seule règle : doux.</h2><p data-reveal>Nous ne brûlons pas le café. Le grain reste fruité, il accompagne le beurre sans le couvrir.</p></div>
    <ul class="fn-beans"><li data-reveal><span class="fn-bean fn-bean--1"></span><b>Clair</b><span>Fruits rouges, thé</span></li><li data-reveal><span class="fn-bean fn-bean--2"></span><b>Fournil</b><span>Noisette, caramel</span></li><li data-reveal><span class="fn-bean fn-bean--3"></span><b>Foncé</b><span>Cacao, pain grillé</span></li></ul></div></section>`),
  cta("Un café, un croissant.", "Pour le matin pressé, commandez à l'avance et passez prendre votre sac.", "/commandes", "Commander à retirer"), sec(footer(c))];

const composer = () => `<div class="fn-order" data-order>
  <div class="fn-order-pick"><h2 class="fn-h2">1. Composez</h2><div class="fn-order-cats">${CATS.map(([k, l]) => `<section><h3 class="fn-oc-t">${l}</h3>${CARTE.filter((i) => i[3] === k).map((it) => `<div class="fn-oline" data-line data-id="${it[0]}" data-name="${esc(it[1])}" data-price="${it[2]}"><span class="fn-oline-n">${esc(it[1])}<small>${eur(it[2])}</small></span><span class="fn-qty"><a href="#moins" data-q="-1" role="button" aria-label="Retirer ${esc(it[1])}">−</a><b data-qv aria-live="polite">0</b><a href="#plus" data-q="1" role="button" aria-label="Ajouter ${esc(it[1])}">+</a></span></div>`).join("")}</section>`).join("")}</div>
    <h2 class="fn-h2">2. Jour et créneau</h2><div class="fn-days" role="radiogroup" aria-label="Jour de retrait" data-days><span class="fn-hint">Les jours d'ouverture s'affichent ici.</span></div>
    <div class="fn-slots" role="radiogroup" aria-label="Créneau de retrait">${[["07:00", "09:00", "7 h – 9 h"], ["09:00", "11:00", "9 h – 11 h"], ["11:00", "13:00", "11 h – 13 h"], ["16:00", "18:00", "16 h – 18 h"]].map(([a, b, l]) => `<a href="#creneau" role="radio" aria-checked="false" data-slot data-from="${a}" data-to="${b}">${l}</a>`).join("")}</div></div>
  <aside class="fn-receipt" aria-label="Récapitulatif de la commande"><div class="fn-receipt-in"><p class="fn-receipt-h">Ticket de commande</p><ul class="fn-receipt-l" data-sum role="status" aria-live="polite"><li class="fn-empty">Aucun article pour l'instant.</li></ul>
    <p class="fn-receipt-t">Total indicatif <b data-total>0,00 €</b></p><p class="fn-receipt-r" data-when>Retrait : à choisir</p>
    <p class="fn-receipt-n">À régler au comptoir. Aucun paiement en ligne : cette démonstration prépare seulement un message.</p>
    <a class="fn-btn fn-btn--block" href="/contact" data-send>Envoyer ce récapitulatif</a><a class="fn-copy" href="#copier" data-copy role="button">Copier le texte</a><a class="fn-copy" href="#vider" data-clear role="button">Tout vider</a><p class="fn-note-msg" data-sendmsg role="status"></p></div></aside></div>`;
const commandes = (c) => [sec(header(c)), pagehead("Commandes à retirer", "Le sac de pain, prêt à l'heure.", "Vous composez, on prépare, vous passez. Aucun paiement en ligne : le récapitulatif arrive dans le formulaire de contact.", `<div class="fn-ph-card">${ILL.panier()}</div>`, "tomato"),
  sec(`<section class="fn-orderband fn-band fn-band--cream pk-bleed"><div class="fn-wrap">${composer()}</div></section>`),
  sec(`<section class="fn-faq fn-band fn-band--kraft pk-bleed"><div class="fn-wrap fn-faq-in"><h2 class="fn-h2" data-reveal>Comment ça marche</h2><div>
    <details data-reveal><summary>Faut-il payer en ligne ?</summary><p>Non. Le total est indicatif, vous réglez au comptoir. Cette démonstration n'enregistre aucun paiement ni aucune réservation.</p></details>
    <details data-reveal><summary>Quand ma commande est-elle prête&nbsp;?</summary><p>Au créneau choisi, pendant les heures d'ouverture. Les baguettes sont sorties du four dans l'heure qui précède.</p></details>
    <details data-reveal><summary>Puis-je modifier mon message&nbsp;?</summary><p>Oui : le récapitulatif s'insère dans le formulaire de contact, vous pouvez le compléter avec votre nom et une remarque.</p></details>
    <details data-reveal><summary>Et pour une grosse quantité&nbsp;?</summary><p>Pour un buffet ou un mariage, écrivez-nous deux jours avant : nous regardons ensemble ce que le four peut faire.</p></details></div></div></section>`),
  sec(footer(c))];

const actualites = (c) => [sec(header(c)), pagehead("Actualités", "Sur le tableau de liège.", "Nouveautés, ateliers et mots du comptoir. Épinglés par ordre d'arrivée.", `<div class="fn-ph-card">${ILL.wheat()}</div>`, "kraft"),
  sec(`<section class="fn-news fn-band fn-band--cream pk-bleed"><div class="fn-wrap"><div class="fn-notes">${NEWS.map(newsNote).join("")}</div></div></section>`),
  sec(`<section class="fn-agenda fn-band fn-band--kraft pk-bleed"><div class="fn-wrap fn-agenda-in"><div><p class="fn-kicker" data-reveal>Au calendrier</p><h2 class="fn-h2" data-reveal>Les dates à retenir</h2></div><ul class="fn-dates"><li data-reveal><time>Dim. 16 nov.</time><span>Atelier pain, 9 h – 12 h. Demander une place par le formulaire de contact.</span></li><li data-reveal><time>Sam. 22 nov.</time><span>Dégustation du café de saison au comptoir.</span></li><li data-reveal><time>Mar. 2 déc.</time><span>Premières bûches : commande ouverte par message.</span></li></ul></div></section>`),
  sec(footer(c))];

const infos = (c) => [sec(header(c)), pagehead("Infos pratiques", "Venir, appeler, s'asseoir.", "Tout ce qu'il faut savoir avant de pousser la porte. Adresse fictive.", `<div class="fn-ph-card">${ILL.four()}</div>`, "cream"),
  sec(`<section class="fn-infos fn-band fn-band--kraft pk-bleed"><div class="fn-wrap fn-infos-in">${hours(true)}
    <div class="fn-where"><div class="fn-plan" aria-hidden="true"><svg viewBox="0 0 300 220" fill="none" stroke="${INK}" stroke-width="3"><rect x="0" y="0" width="300" height="220" fill="#f1e2bf" stroke="none"/><path d="M0 70h300M0 150h300M90 0v220M210 0v220" stroke="#fbf3e1" stroke-width="22"/><path d="M0 70h300M0 150h300M90 0v220M210 0v220" stroke-width="1.5" opacity=".5"/><rect x="104" y="12" width="92" height="44" rx="6" fill="#d8c08c" stroke-width="2"/><rect x="224" y="86" width="60" height="50" rx="6" fill="#c9b27a" stroke-width="2"/><rect x="14" y="164" width="62" height="44" rx="6" fill="#d8c08c" stroke-width="2"/><path d="M104 164h92v44h-92z" fill="#a8c47e" stroke-width="2"/><path d="M150 108c-14-16-14-30 0-30s14 14 0 30z" fill="#c2431f" transform="translate(0 -4) scale(1 1)"/><circle cx="150" cy="86" r="4" fill="#fbf3e1" stroke="none"/></svg><span class="fn-plan-l fn-plan-l--a">rue des Meuniers</span><span class="fn-plan-l fn-plan-l--b">Le Fournil</span><span class="fn-plan-l fn-plan-l--c">square</span></div>
    <address class="fn-addr"><b>Le Fournil de Lison</b>12 rue des Meuniers, 69007 Lyon (adresse fictive)<br>Métro et tram à cinq minutes à pied<br><a href="mailto:bonjour@fournil-de-lison.example">bonjour@fournil-de-lison.example</a></address>
    <ul class="fn-facts-l"><li>Accès de plain-pied, comptoir à hauteur réduite</li><li>Quatre places assises au comptoir, deux tables en terrasse</li><li>Chiens bienvenus, un bol d'eau les attend</li></ul></div></div></section>`),
  sec(`<section class="fn-faq fn-band fn-band--cream pk-bleed"><div class="fn-wrap fn-faq-in"><h2 class="fn-h2" data-reveal>Bon à savoir</h2><div>
    <details data-reveal><summary>Y a-t-il du pain jusqu'à la fermeture&nbsp;?</summary><p>Pas toujours : les baguettes de la dernière fournée partent vite. Commandez à l'avance pour être sûr.</p></details>
    <details data-reveal><summary>Peut-on consommer sur place ?</summary><p>Oui, au comptoir ou en terrasse. Le café se boit chaud avec une viennoiserie du matin.</p></details>
    <details data-reveal><summary>Vendez-vous sans gluten&nbsp;?</summary><p>Non : tout le fournil est à base de blé et de seigle, nous préférons le dire clairement.</p></details></div></div></section>`),
  cta("Une question ?", "Écrivez-nous, nous répondons entre deux fournées.", "/contact", "Écrire au fournil"), sec(footer(c))];

const contact = (c) => [sec(header(c)), pagehead("Contact", "Un mot pour le fournil.", "Commande, question, atelier ou simple bonjour. Les récapitulatifs de commande arrivent ici.", `<div class="fn-ph-card">${ILL.baguette()}</div>`, "kraft"),
  { type: "form", heading: "Écrire au fournil", intro: "Dites-nous ce qu'il vous faut : un sac de pain, un gâteau, une question. Nous répondons entre deux fournées." }, sec(footer(c))];
const recherche = (c) => [sec(header(c)), pagehead("Recherche", "Qu'est-ce qu'on cherche ?", "Un pain, une boisson, une actualité.", `<div class="fn-ph-card">${ILL.boule()}</div>`, "cream"), { type: "layout", children: [{ type: "search", props: { placeholder: "Rechercher sur le site…" } }] }, sec(footer(c))];
const introuvable = (c) => [sec(header(c)), sec(`<section class="fn-404 fn-band fn-band--kraft pk-bleed"><div class="fn-wrap fn-404-in"><div class="fn-404-ill" aria-hidden="true">${ILL.panier()}</div><p class="fn-kicker">Plus rien dans le panier</p><div class="fn-h1" role="heading" aria-level="1">Page introuvable</div><p class="fn-sub">Cette page est partie avec la dernière baguette, ou n'a jamais existé.</p><div class="fn-actions"><a class="fn-btn" href="/">Retour à l'accueil</a><a class="fn-btn fn-btn--line" href="/carte">Voir la carte</a></div></div></section>`), sec(footer(c))];

module.exports = {
  key: "fournil", name: "Fournil", version: "2.0.0", category: "gastronomie", tags: ["chaleureux", "ludique", "naturel"], siteType: "Boulangerie et café artisanal", featured: false,
  concept: "Une boulangerie dessinée à la main sur du papier kraft : étiquettes de boulanger, tampons, ticket de caisse à languettes et horaires qui disent si la fournée vient de sortir.",
  description: "Boulangerie et café artisanal : papier kraft, tampons et étiquettes dessinées au trait épais, carte du jour filtrable, horaires vivants (ouvert, ferme à, fournée sortie) et composeur de commande à retirer sans paiement.",
  brand: "Le Fournil de Lison", modules: ["formulaires", "recherche"],
  dna: {
    header: "ticket-de-caisse-a-languettes", hero: "collage-dessine-pains-et-etiquettes", grid: "carte-du-jour-en-etiquettes", motion: "fournee-qui-sort-et-tampons-qui-claquent",
    shapes: "trait-epais-aplats-decales-et-bords-dechires", rhythm: "bandes-kraft-alternees-et-papiers-colles", signature: "horaires-vivants-et-commande-a-retirer",
  },
  tokens: {
    colors: { primary: "#c2431f", secondary: "#2a5b8c", accent: "#f2b632", background: "#ead7b2", surface: "#fbf3e1", text: "#2e1d10", muted: "#6a4b30", success: "#2f6b3a", warning: "#8a5a00", error: "#b3261e" },
    fonts: { heading: "font.caveat-brush", body: "font.nunito", button: "font.gochi-hand", link: "font.nunito" },
    radius: { sm: 6, md: 12, lg: 18, button: 14, field: 10, card: 14 }, shadow: { card: "4px 4px 0 #2e1d10", button: "3px 3px 0 #2e1d10" }, border: { width: 3, color: "#2e1d10" },
    type: { h1: { size: 88, weight: 400, lineHeight: 0.95 }, h2: { size: 52, weight: 400, lineHeight: 1 } },
  },
  options: [
    { key: "accent", label: "Rouge du tampon", type: "color", default: "#c2431f" },
    { key: "kraft", label: "Papier kraft", type: "color", default: "#ead7b2" },
    { key: "grain", label: "Grain du papier", type: "choice", default: "on", choices: [["on", "Papier grainé"], ["off", "Papier lisse"]] },
    { key: "tilt", label: "Étiquettes penchées", type: "choice", default: "on", choices: [["on", "Penchées"], ["off", "Droites"]] },
    { key: "announce", label: "Bandeau d'horaires", type: "choice", default: "on", choices: [["on", "Affiché"], ["off", "Masqué"]] },
  ],
  menu: [["Accueil", "/"], ["La carte", "/carte"], ["Le fournil", "/fournil"], ["Boissons", "/boissons"], ["Commander", "/commandes"], ["Actualités", "/actualites"], ["Infos", "/infos"], ["Contact", "/contact"]],
  pages: [
    { key: "accueil", name: "Accueil", render: home }, { key: "carte", name: "La carte", render: carte }, { key: "fournil", name: "Le fournil", render: fournil },
    { key: "boissons", name: "Cafés et boissons", render: boissons }, { key: "commandes", name: "Commandes", render: commandes }, { key: "actualites", name: "Actualités", render: actualites },
    { key: "infos", name: "Infos pratiques", render: infos }, { key: "contact", name: "Contact", render: contact },
    { key: "recherche", name: "Recherche", render: recherche }, { key: "introuvable", name: "Page introuvable", render: introuvable },
  ],
};
