// Pulse — label musical et festival de nuit (fictif). Direction artistique : énergie nocturne, noir profond, magenta acide et vert fluo, titres déformés façon liquide,
// barre de navigation fixe en bas, programme horaire en colonnes (scènes × heures), line-up filtrable avec favoris locaux et lecteur d'extraits synthétisés (Web Audio).
const { sec, esc } = require("../kit");

// ---- données de démonstration (artistes, lieux et dates fictifs) ----
const DAYS = { ven: ["Vendredi", "18 juin", ["21h–23h", "23h–01h", "01h–03h"]], sam: ["Samedi", "19 juin", ["21h–23h", "23h–01h", "01h–03h"]], dim: ["Dimanche", "20 juin", ["19h–21h", "21h–23h", "23h–01h"]] };
const SCENES = { cuve: "La Cuve", dome: "Le Dôme", quai: "Le Quai" };
const GENRES = ["house sombre", "électro néon", "downtempo", "breaks rapides", "ambient pulsé"];
// [nom, genre, ville fictive, jour, scène, créneau, piste, accroche]
const ART = [
  ["Nuit Sodium", "house sombre", "Valdraye", "ven", "cuve", 0, 0, "Quatre temps, une basse qui respire et des arpèges de néon."],
  ["Lessive Néon", "électro néon", "Brumeval", "ven", "cuve", 1, 1, "Électro frontale, claps secs et mélodies qui grésillent."],
  ["Cire Perdue", "breaks rapides", "Fort-Lumière", "ven", "cuve", 2, 3, "Des breaks cassés à 170 battements, sans une seconde de répit."],
  ["Marée Haute", "ambient pulsé", "Cap-Verveine", "ven", "dome", 0, 4, "Nappes lentes et pouls discret pour ouvrir la nuit en douceur."],
  ["Orchidée Sauvage", "downtempo", "Roquefaille", "ven", "dome", 1, 2, "Un downtempo moite, entre basse ronde et accords flottants."],
  ["Tram 3AM", "downtempo", "Saint-Orage", "ven", "quai", 1, 2, "Le dernier tram de la nuit, joué en direct sur machines."],
  ["Mille Voltiges", "breaks rapides", "Mirebel", "sam", "cuve", 0, 3, "Un set acrobatique : tout accélère, rien ne tombe."],
  ["Sirène Hertzienne", "électro néon", "Valdraye", "sam", "cuve", 1, 1, "Voix filtrées, synthés stridents, refrains à scander."],
  ["Kilomètre Zéro", "house sombre", "Brumeval", "sam", "cuve", 2, 0, "Le set de fermeture : lent, profond, hypnotique."],
  ["Velours Cassé", "house sombre", "Roquefaille", "sam", "dome", 1, 0, "Une house veloutée avec un grain volontairement abîmé."],
  ["Hôtel Mirage", "ambient pulsé", "Fort-Lumière", "sam", "dome", 2, 4, "Un live planant pour regarder le jour se lever."],
  ["Poney Pirate", "électro néon", "Cap-Verveine", "sam", "quai", 0, 1, "Électro de fête foraine : drôle, bruyant, sincère."],
  ["Sel et Fer", "breaks rapides", "Mirebel", "dim", "cuve", 0, 3, "Percussions métalliques et basses qui rouillent joliment."],
  ["Cendre Rose", "downtempo", "Saint-Orage", "dim", "cuve", 1, 2, "Un coucher de soleil sonore, chaud et ralenti."],
  ["Pluie Acide", "électro néon", "Valdraye", "dim", "cuve", 2, 1, "Le final : arpèges acides et lumières qui s'éteignent une à une."],
  ["Grand Huit", "house sombre", "Brumeval", "dim", "dome", 1, 0, "Des montagnes russes de filtres, pour danser sans réfléchir."],
  ["Bleu Pétrole", "ambient pulsé", "Roquefaille", "dim", "dome", 2, 4, "Une longue nappe sombre où le pouls revient doucement."],
  ["Mauve Mécanique", "downtempo", "Cap-Verveine", "dim", "quai", 0, 2, "Boîtes à rythmes anciennes et mélodies de poche."],
].map(([name, genre, city, day, scene, slot, track, hook], i) => ({ id: "a" + (i + 1), i, name, genre, city, day, scene, slot, track, hook, time: DAYS[day][2][slot] }));
const TRACKS = [["Sodium 124", "124 BPM · house sombre"], ["Néon 140", "140 BPM · électro"], ["Tram 90", "90 BPM · downtempo"], ["Cire 172", "172 BPM · breaks"], ["Marée 100", "100 BPM · ambient"]];

// ---- illustrations SVG ----
const M = "#ff2fd0", L = "#b8ff1a";
const sigil = (i) => {
  const k = i % 6, f = (n) => Math.round(n * 10) / 10; let g = "";
  if (k === 0) for (let r = 8; r <= 52; r += 11) g += `<circle class="${(r / 11) % 2 < 1 ? "pm" : "pl"}" cx="60" cy="60" r="${r}"/>`;
  if (k === 1) for (let y = 0; y < 5; y++) { let p = ""; for (let x = 0; x <= 100; x += 10) p += `${10 + x},${f(26 + y * 17 + Math.sin((x + y * 20 + i * 9) / 11) * 8)} `; g += `<polyline class="${y % 2 ? "pl" : "pm"}" points="${p.trim()}"/>`; }
  if (k === 2) { let p = ""; for (let n = 0; n < 16; n++) { const a = n * Math.PI / 8 - 1.57, r = n % 2 ? 22 : 52; p += `${f(60 + Math.cos(a) * r)},${f(60 + Math.sin(a) * r)} `; } g = `<polygon class="fm" points="${p.trim()}"/><circle class="fi" cx="60" cy="60" r="12"/><circle class="fl" cx="60" cy="60" r="5"/>`; }
  if (k === 3) for (let n = 0; n < 16; n++) { const a = n * Math.PI / 8, r2 = 30 + ((n * 7 + i * 5) % 5) * 5; g += `<line class="${n % 3 ? "pm" : "pl"}" x1="${f(60 + Math.cos(a) * 18)}" y1="${f(60 + Math.sin(a) * 18)}" x2="${f(60 + Math.cos(a) * r2)}" y2="${f(60 + Math.sin(a) * r2)}"/>`; }
  if (k === 4) { g = `<circle class="fl" cx="60" cy="60" r="50"/>`; for (let y = 14; y < 110; y += 14) g += `<rect class="fi" x="6" y="${y}" width="108" height="${5 + (y % 3) * 2}"/>`; g += `<circle class="pm" cx="60" cy="60" r="50"/>`; }
  if (k === 5) for (let n = 0; n < 9; n++) { const h = 14 + ((n * 37 + i * 11) % 9) * 7; g += `<rect class="${n % 2 ? "fm" : "fl"}" x="${10 + n * 11}" y="${100 - h}" width="8" height="${h}"/>`; }
  return `<svg class="pu-sigil" viewBox="0 0 120 120" aria-hidden="true">${g}</svg>`;
};
const warp = (t) => `<span class="pu-ln" aria-hidden="true">${[...t].map((ch) => (ch === " " ? " " : `<span class="pu-l">${esc(ch)}</span>`)).join("")}</span>`;
const IC = {
  home: '<path d="M4 11 12 4l8 7v9h-5v-6H9v6H4z" fill="currentColor"/>',
  mic: '<rect x="9" y="3" width="6" height="11" rx="3" fill="currentColor"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3" fill="none" stroke="currentColor" stroke-width="2"/>',
  grid: '<path d="M4 4h7v7H4zm9 0h7v7h-7zM4 13h7v7H4zm9 0h7v7h-7z" fill="currentColor"/>',
  tix: '<path d="M3 7h18v4a2 2 0 0 0 0 4v4H3v-4a2 2 0 0 0 0-4z" fill="currentColor"/><path d="M14 8v10" stroke="#07050d" stroke-width="1.6"/>',
  more: '<circle cx="6" cy="12" r="2.2" fill="currentColor"/><circle cx="12" cy="12" r="2.2" fill="currentColor"/><circle cx="18" cy="12" r="2.2" fill="currentColor"/>',
};
const ico = (k) => `<svg viewBox="0 0 24 24" aria-hidden="true">${IC[k]}</svg>`;
const arrow = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.6"/></svg>`;
const star = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 2.5 2.9 6.3 6.8.7-5.1 4.6 1.5 6.8L12 17.4l-6.1 3.5 1.5-6.8L2.3 9.5l6.8-.7z"/></svg>`;
const play = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5v15l12-7.5z" fill="currentColor"/></svg>`;

// ---- structure commune ----
const header = (c, page) => {
  const L1 = c.menu.filter((m) => !["/billetterie"].includes(m.url));
  const cur = (u) => (u === page ? ' aria-current="page"' : "");
  const mob = [["/", "Accueil", "home"], ["/lineup", "Line-up", "mic"], ["/programme", "Programme", "grid"], ["/billetterie", "Billets", "tix"]];
  const more = [["/infos", "Infos pratiques"], ["/artistes", "Artistes"], ["/actualites", "Actualités"], ["/contact", "Contact"], ["/recherche", "Recherche"]];
  return `<header class="pu-top pk-bleed"><a class="pu-logo" href="/" aria-label="${esc(c.brand)} — accueil"><span class="pu-logo-mark" aria-hidden="true"><i></i><i></i><i></i><i></i></span>PULSE<small>Nocturne</small></a><p class="pu-top-date"><b>18→20 juin 2027</b> · Valdraye · édition de démonstration</p></header>
  <div class="pu-dock" role="navigation" aria-label="Navigation principale"><a class="pu-dock-logo" href="/" aria-label="Accueil"><span class="pu-logo-mark" aria-hidden="true"><i></i><i></i><i></i><i></i></span></a>
    <div class="pu-dock-desk">${L1.map((m) => `<a href="${esc(m.url)}"${cur(m.url)}>${esc(m.label)}</a>`).join("")}</div>
    <div class="pu-dock-mob">${mob.map(([u, l, k]) => `<a href="${u}"${cur(u)}>${ico(k)}<span>${l}</span></a>`).join("")}<details class="pu-more"><summary aria-label="Plus de pages">${ico("more")}<span>Plus</span></summary><div class="pu-sheet" role="navigation" aria-label="Menu complet">${more.map(([u, l]) => `<a href="${u}"${cur(u)}>${l}</a>`).join("")}</div></details></div>
    <a class="pu-dock-cta" href="/billetterie">Billets ${arrow}</a></div>`;
};
const footer = (c) => `<footer class="pu-foot pk-bleed"><div class="pu-foot-word" aria-hidden="true">PULSE</div>
  <div class="pu-wrap pu-foot-grid"><div><p class="pu-foot-lead">Trois nuits, trois scènes, zéro silence.</p><address>Friche du Gazomètre<br>Valdraye — lieu fictif</address></div>
  <div><p class="pu-fh">Le festival</p><a href="/lineup">Line-up</a><a href="/programme">Programme</a><a href="/artistes">Artistes</a></div>
  <div><p class="pu-fh">Pratique</p><a href="/billetterie">Billetterie</a><a href="/infos">Infos pratiques</a><a href="/contact">Contact</a></div>
  <div><p class="pu-fh">Suivre</p><a href="/actualites">Actualités</a><a href="/recherche">Recherche</a></div></div>
  <p class="pu-legal">© ${esc(c.brand)} — site de démonstration. Label, festival, artistes, lieux et dates sont fictifs ; aucune vente ni inscription n'a lieu ici.</p></footer>`;
const pagehead = (kicker, title, sub) => sec(`<section class="pu-ph pk-bleed"><div class="pu-wrap"><p class="pu-kicker" data-reveal>${esc(kicker)}</p><div class="pu-h1" role="heading" aria-level="1" aria-label="${esc(title)}">${title.split(" ").map(warp).join("")}</div>${sub ? `<p class="pu-ph-sub" data-reveal>${esc(sub)}</p>` : ""}</div></section>`);

// ---- composants ----
const card = (a) => `<article class="pu-card" data-art data-id="${a.id}" data-day="${a.day}" data-scene="${a.scene}" data-reveal>${sigil(a.i)}
  <div class="pu-card-b"><p class="pu-card-meta"><span>${DAYS[a.day][0]} ${a.time.split("–")[0]}</span><span>${SCENES[a.scene]}</span></p><h3><a href="/artistes" data-fiche-link="${a.id}">${esc(a.name)}</a></h3><p class="pu-card-g">${esc(a.genre)} · ${esc(a.city)}</p>
  <div class="pu-card-act"><a class="pu-mini" href="#ecouter" role="button" data-play="${a.track}" aria-label="Écouter un extrait de ${esc(a.name)}">${play}<span>Écouter</span></a><a class="pu-mini pu-mini--fav" href="#favori" role="button" aria-pressed="false" data-fav="${a.id}" aria-label="Ajouter ${esc(a.name)} aux favoris">${star}<span>Favori</span></a></div></div></article>`;
const player = () => `<section class="pu-player pk-bleed" data-player><div class="pu-wrap pu-player-in"><div class="pu-player-h"><p class="pu-kicker" data-reveal>Extraits · synthétisés dans votre navigateur</p><h2 class="pu-h2" data-reveal>Écoutez<br>la nuit.</h2>
  <p class="pu-muted" data-reveal>Cinq courtes boucles générées en direct, sans fichier audio. Le son ne démarre que si vous appuyez sur lecture ; baissez le volume avant d'essayer au casque.</p><p class="pu-noscript">Le lecteur d'extraits demande JavaScript.</p></div>
  <div class="pu-player-ui" data-ui></div>
  <ol class="pu-tracks" aria-label="Extraits disponibles">${TRACKS.map(([t, d], n) => `<li data-track="${n}"><span class="pu-tn">${String(n + 1).padStart(2, "0")} · ${t}</span><span class="pu-td">${d}</span></li>`).join("")}</ol></div></section>`;
const marquee = (txt, cls = "") => `<div class="pu-marq pk-bleed ${cls}" aria-hidden="true"><div class="pu-marq-t">${Array(2).fill(`<span>${txt.map((t) => `${t} <i>✦</i> `).join("")}</span>`).join("")}</div></div>`;
const newsItems = [
  ["12 oct. 2026", "Le label", "Premier maxi du label : trois titres pour chauffer l'hiver", "Une face A taillée pour le club, une face B pour le retour à pied."],
  ["28 sept. 2026", "Festival", "La Cuve s'agrandit : un deuxième plancher pour 2027", "Plus de place pour danser, un son recalibré sur toute la salle."],
  ["9 sept. 2026", "Coulisses", "Comment on prépare un plateau de trois nuits", "Des artistes à placer, des heures à équilibrer, un plan de sol à dessiner."],
  ["20 août 2026", "Le label", "Nouveau résidu : Marée Haute rejoint l'équipe", "Un live ambient pour ouvrir la nuit en douceur."],
];

const home = (c) => [
  sec(header(c, "/")),
  sec(`<section class="pu-hero pk-bleed"><div class="pu-hero-bg" aria-hidden="true"><svg viewBox="0 0 1200 600" preserveAspectRatio="xMidYMax slice"><circle cx="600" cy="330" r="330" fill="#ff2fd0" opacity=".16"/><circle cx="600" cy="330" r="290" fill="#ff2fd0" opacity=".12"/><circle cx="600" cy="330" r="250" fill="none" stroke="#b8ff1a" stroke-width="2" opacity=".5"/><circle cx="600" cy="330" r="170" fill="none" stroke="#ff2fd0" stroke-width="2" opacity=".6"/></svg><div class="pu-eq">${Array.from({ length: 28 }, () => "<i></i>").join("")}</div></div>
    <div class="pu-hero-in"><p class="pu-kicker" data-reveal>Label & festival · 18→20 juin 2027 · Valdraye</p>
    <div class="pu-mega" role="heading" aria-level="1" aria-label="Pulse Nocturne">${warp("PULSE")}${warp("NOCTURNE")}</div>
    <p class="pu-lead" data-reveal>Trois nuits, trois scènes, dix-huit artistes. Un label indépendant qui fait trembler une friche entière — et un site pour préparer votre planning.</p>
    <div class="pu-actions" data-reveal><a class="pu-btn" href="/lineup">Voir le line-up ${arrow}</a><a class="pu-btn pu-btn--line" href="/programme">Programme heure par heure</a></div></div></section>`),
  sec(marquee(["Trois nuits", "Dix-huit artistes", "Trois scènes", "Un label indépendant", "Du vendredi au dimanche"], "pu-marq--lime")),
  sec(`<section class="pu-facts pk-bleed"><div class="pu-wrap pu-facts-in"><div class="pu-fact" data-reveal><p class="pu-fact-k">Dans</p><div class="pu-count" data-countdown="2027-06-18T21:00:00" aria-label="Compte à rebours avant la première nuit"><div><b data-u="d">000</b><i>jours</i></div><div><b data-u="h">00</b><i>h</i></div><div><b data-u="m">00</b><i>min</i></div><div><b data-u="s">00</b><i>s</i></div></div></div>
    <ul class="pu-fact-l"><li data-reveal><b data-count="3">3</b><span>nuits</span></li><li data-reveal><b data-count="3">3</b><span>scènes</span></li><li data-reveal><b data-count="18">18</b><span>artistes</span></li><li data-reveal><b data-count="30" data-suffix=" h">30 h</b><span>de musique</span></li></ul></div></section>`),
  sec(player()),
  sec(`<section class="pu-teaser pk-bleed"><div class="pu-wrap"><div class="pu-sechead"><h2 class="pu-h2" data-reveal>À l'affiche</h2><a class="pu-more-l" href="/lineup">Tout le line-up ${arrow}</a></div>
    <div class="pu-cards">${[0, 6, 12, 3, 7, 14].map((n) => card(ART[n])).join("")}</div></div></section>`),
  sec(`<section class="pu-days pk-bleed"><div class="pu-wrap"><div class="pu-sechead"><h2 class="pu-h2" data-reveal>Trois nuits</h2><a class="pu-more-l" href="/programme">Le programme complet ${arrow}</a></div><div class="pu-days-in">
    ${Object.entries(DAYS).map(([k, [n, d, slots]], j) => `<article class="pu-day pu-day--${j}" data-reveal><p class="pu-day-n">${n}</p><p class="pu-day-d">${d}</p><p class="pu-day-h">${slots[0].split("–")[0]} → ${slots[2].split("–")[1]}</p><ul>${ART.filter((a) => a.day === k).slice(0, 4).map((a) => `<li>${esc(a.name)}</li>`).join("")}</ul></article>`).join("")}</div></div></section>`),
  sec(`<section class="pu-tixband pk-bleed"><div class="pu-wrap pu-tixband-in"><h2 class="pu-h2" data-reveal>Pas encore<br>de billets.</h2><div data-reveal><p class="pu-lead">Ce site est une démonstration : il ne vend rien. La page billetterie explique comment cela fonctionnerait, et le formulaire de contact permet de laisser un message.</p><a class="pu-btn pu-btn--ink" href="/billetterie">Comprendre la billetterie ${arrow}</a></div></div></section>`),
  sec(`<section class="pu-news pk-bleed"><div class="pu-wrap"><div class="pu-sechead"><h2 class="pu-h2" data-reveal>Dernières nouvelles</h2><a class="pu-more-l" href="/actualites">Toute l'actu ${arrow}</a></div><div class="pu-news-g">${newsItems.slice(0, 3).map(([d, t, h, x]) => `<a class="pu-ncard" href="/actualites" data-reveal><time>${d}</time><span class="pu-tag">${t}</span><h3>${esc(h)}</h3><p>${esc(x)}</p></a>`).join("")}</div></div></section>`),
  sec(footer(c)),
];

const lineup = (c) => [
  sec(header(c, "/lineup")),
  pagehead("18→20 juin 2027 · 18 artistes", "LINE-UP", "Filtrez par jour ou par scène, gardez vos favoris (ils restent sur cet appareil) et écoutez un extrait synthétisé."),
  sec(player()),
  sec(`<section class="pu-lineup pk-bleed" data-lineup><div class="pu-wrap"><div class="pu-filters" role="group" aria-label="Filtrer le line-up"><div class="pu-fgroup"><span class="pu-flabel">Jour</span>
    <a href="#tous" role="button" aria-pressed="true" class="is-on" data-fd="all">Tous</a>${Object.entries(DAYS).map(([k, v]) => `<a href="#${k}" role="button" aria-pressed="false" data-fd="${k}">${v[0].slice(0, 3)}. ${v[1].split(" ")[0]}</a>`).join("")}</div>
    <div class="pu-fgroup"><span class="pu-flabel">Scène</span><a href="#toutes" role="button" aria-pressed="true" class="is-on" data-fs="all">Toutes</a>${Object.entries(SCENES).map(([k, v]) => `<a href="#${k}" role="button" aria-pressed="false" data-fs="${k}">${v}</a>`).join("")}</div>
    <div class="pu-fgroup"><a href="#favoris" role="button" aria-pressed="false" class="pu-favonly" data-ff>${star}<span>Mes favoris <b data-favn>0</b></span></a></div></div>
    <p class="pu-result" role="status" aria-live="polite" data-out>18 artistes affichés</p></div></section>`),
  ...[0, 6, 12].map((n) => sec(`<section class="pu-lineup pu-lineup--c pk-bleed" data-lineup><div class="pu-wrap"><div class="pu-cards pu-cards--all">${ART.slice(n, n + 6).map(card).join("")}</div></div></section>`)),
  sec(`<section class="pu-lineup pu-lineup--c pk-bleed" data-lineup><div class="pu-wrap"><p class="pu-empty" data-empty hidden>Aucun artiste ne correspond à ces filtres. Essayez « Tous » ou retirez le filtre favoris.</p>
    <aside class="pu-plan" aria-label="Mon planning"><h2 class="pu-h3">Mon planning</h2><p class="pu-muted" data-planmsg>Aucun favori pour l'instant : touchez l'étoile d'un artiste pour le garder ici.</p><ol data-plan></ol><a class="pu-btn pu-btn--line" href="/programme">Voir le programme ${arrow}</a></aside></div></section>`),
  sec(footer(c)),
];

const programme = (c) => {
  const table = (k) => {
    const [n, d, slots] = DAYS[k];
    return `<div class="pu-tt-wrap" data-daypanel="${k}"><table class="pu-tt"><caption class="pu-tt-cap"><b>${n} ${d}</b> — trois scènes, trois créneaux de deux heures</caption><thead><tr><th scope="col">Heure</th>${Object.values(SCENES).map((s) => `<th scope="col">${s}</th>`).join("")}</tr></thead><tbody>
    ${slots.map((sl, r) => `<tr><th scope="row">${sl}</th>${Object.entries(SCENES).map(([sk, sn]) => { const a = ART.find((x) => x.day === k && x.scene === sk && x.slot === r); return a ? `<td data-scene="${sn}"><a class="pu-set" href="/artistes" data-id="${a.id}"><b>${esc(a.name)}</b><span>${esc(a.genre)}</span><i class="pu-fstar" aria-hidden="true">${star}</i></a></td>` : `<td class="is-empty" data-scene="${sn}"><span>Plateau libre</span></td>`; }).join("")}</tr>`).join("")}</tbody></table></div>`;
  };
  return [sec(header(c, "/programme")), pagehead("Scènes × heures", "PROGRAMME", "Toutes les nuits en colonnes : une colonne par scène, une ligne par créneau. Les favoris du line-up s'allument ici."),
    sec(`<section class="pu-prog pk-bleed" data-days><div class="pu-wrap"><div class="pu-daytabs" role="group" aria-label="Choisir la nuit">${Object.entries(DAYS).map(([k, v], j) => `<a href="#${k}" role="button" aria-pressed="${j ? "false" : "true"}" ${j ? "" : 'class="is-on"'} data-day="${k}"><b>${v[0]}</b><span>${v[1]}</span></a>`).join("")}</div>
      <p class="pu-muted pu-legend"><i class="pu-leg"></i> Étoile jaune-verte : artiste ajouté à vos favoris sur la page Line-up.</p>${Object.keys(DAYS).map(table).join("")}</div></section>`),
    sec(marquee(["La Cuve", "Le Dôme", "Le Quai", "Plateau libre"], "pu-marq--mag")),
    sec(`<section class="pu-scenes pk-bleed"><div class="pu-wrap"><h2 class="pu-h2" data-reveal>Les trois scènes</h2><div class="pu-scenes-in">
      <article data-reveal><svg viewBox="0 0 120 80" aria-hidden="true"><rect x="8" y="14" width="104" height="58" fill="none" stroke="#ff2fd0" stroke-width="3"/><path d="M8 54h104M40 14v40M80 14v40" stroke="#b8ff1a" stroke-width="2"/></svg><h3>La Cuve</h3><p>L'ancien réservoir : grand plancher, basses profondes, house, électro et breaks. La scène des fins de nuit.</p></article>
      <article data-reveal><svg viewBox="0 0 120 80" aria-hidden="true"><path d="M10 72A50 50 0 0 1 110 72z" fill="none" stroke="#b8ff1a" stroke-width="3"/><path d="M30 72a30 30 0 0 1 60 0" fill="none" stroke="#ff2fd0" stroke-width="3"/></svg><h3>Le Dôme</h3><p>Une coupole sous les étoiles pour les lives lents, l'ambient et le downtempo. On s'y assoit, on s'y allonge.</p></article>
      <article data-reveal><svg viewBox="0 0 120 80" aria-hidden="true"><path d="M6 60h108M20 60V30h24v30M60 60V20h40v40" fill="none" stroke="#ff2fd0" stroke-width="3"/><path d="M6 70h108" stroke="#b8ff1a" stroke-width="3"/></svg><h3>Le Quai</h3><p>Une petite scène en bord de voie : sets courts, expériences, invités surprise et machines en direct.</p></article></div></div></section>`),
    sec(footer(c))];
};

const billetterie = (c) => [sec(header(c, "/billetterie")),
  pagehead("Comment ça marchera", "BILLETTERIE", "Ce site est une démonstration : aucun billet n'y est vendu et aucun prix n'est annoncé. Voici ce que serait le parcours réel."),
  sec(`<section class="pu-steps pk-bleed"><div class="pu-wrap"><ol class="pu-steps-in">
    <li data-reveal><span class="pu-step-n" aria-hidden="true">01</span><h2 class="pu-h3">Choisir son format</h2><p>Une nuit, deux nuits ou le week-end complet : trois formats de pass seraient proposés, sans placement imposé dans les scènes.</p></li>
    <li data-reveal><span class="pu-step-n" aria-hidden="true">02</span><h2 class="pu-h3">Préparer son planning</h2><p>Avec le line-up et vos favoris, vous repérez les créneaux importants avant de décider combien de nuits vous voulez vivre.</p></li>
    <li data-reveal><span class="pu-step-n" aria-hidden="true">03</span><h2 class="pu-h3">Être prévenu·e</h2><p>L'ouverture d'une vraie billetterie serait annoncée par l'équipe. Pour l'instant, laissez-nous un message via le formulaire de contact.</p></li>
    <li data-reveal><span class="pu-step-n" aria-hidden="true">04</span><h2 class="pu-h3">Retirer son bracelet</h2><p>À l'entrée de la friche, un bracelet remplacerait le billet papier ; les modalités seraient détaillées dans la confirmation officielle.</p></li></ol></div></section>`),
  sec(`<section class="pu-formats pk-bleed"><div class="pu-wrap"><h2 class="pu-h2" data-reveal>Trois formats envisagés</h2><div class="pu-formats-in">
    <article data-reveal><p class="pu-fmt-n">1 nuit</p><p>Le vendredi, le samedi ou le dimanche, au choix. Idéal pour découvrir l'ambiance.</p></article>
    <article class="is-hot" data-reveal><p class="pu-fmt-n">Week-end</p><p>Les trois nuits, du vendredi 21 h au lundi matin. Le format pensé pour le festival entier.</p></article>
    <article data-reveal><p class="pu-fmt-n">2 nuits</p><p>Deux nuits consécutives, pour ceux qui ne veulent manquer ni le samedi ni le dimanche.</p></article></div>
    <p class="pu-muted pu-note" data-reveal>Tarifs, quotas et conditions seraient publiés à l'ouverture d'une billetterie réelle. Rien n'est réservé depuis cette page.</p>
    <a class="pu-btn" href="/contact" data-reveal>Écrire à l'équipe ${arrow}</a></div></section>`),
  sec(`<section class="pu-faq pk-bleed"><div class="pu-wrap pu-faq-in"><h2 class="pu-h2" data-reveal>Questions</h2><div>
    <details data-reveal><summary>Peut-on acheter un billet ici ?</summary><p>Non. Ce site est une démonstration, sans vente ni paiement. Le formulaire de contact envoie seulement un message.</p></details>
    <details data-reveal><summary>Y aura-t-il un tarif réduit ?</summary><p>Les conditions réelles seraient détaillées par les organisateurs à l'ouverture de la billetterie.</p></details>
    <details data-reveal><summary>Les mineurs sont-ils admis ?</summary><p>La règle serait précisée dans les informations officielles. Posez la question via le formulaire de contact.</p></details>
    <details data-reveal><summary>Comment savoir quand ça ouvre ?</summary><p>Par les actualités du site et, si vous le demandez, par un message de l'équipe en réponse à votre formulaire.</p></details></div></div></section>`),
  sec(footer(c))];

const infos = (c) => [sec(header(c, "/infos")),
  pagehead("Venir, rester, rentrer", "INFOS PRATIQUES", "Tout ce qu'il faut savoir sur la friche, l'accès, les horaires et le confort sur place."),
  sec(`<section class="pu-info pk-bleed"><div class="pu-wrap pu-info-in"><figure class="pu-map" data-reveal><svg viewBox="0 0 400 300" role="img" aria-label="Plan schématique de la friche avec La Cuve, Le Dôme, Le Quai, l'entrée et le bar"><rect x="6" y="6" width="388" height="288" fill="#130b22" stroke="#ff2fd0" stroke-width="3"/>
      <rect x="30" y="40" width="170" height="130" fill="#ff2fd0"/><path d="M40 150h150M40 120h150" stroke="#07050d" stroke-width="3"/><path d="M240 160a60 60 0 0 1 120 0z" fill="#b8ff1a"/><rect x="240" y="40" width="120" height="50" fill="none" stroke="#b8ff1a" stroke-width="3"/>
      <rect x="30" y="200" width="60" height="70" fill="none" stroke="#f6f1ff" stroke-width="3"/><circle cx="170" cy="240" r="22" fill="none" stroke="#f6f1ff" stroke-width="3"/><path d="M200 292V200h190" fill="none" stroke="#b8ff1a" stroke-width="3"/></svg>
      <figcaption><span><i class="pu-k pu-k--m"></i>La Cuve</span><span><i class="pu-k pu-k--l"></i>Le Dôme</span><span><i class="pu-k pu-k--d"></i>Le Quai</span><span><i class="pu-k pu-k--w"></i>Entrée · bar</span></figcaption></figure>
    <dl class="pu-dl">
      <div data-reveal><dt>Lieu</dt><dd>Friche du Gazomètre, Valdraye — lieu imaginaire pour cette démonstration.</dd></div>
      <div data-reveal><dt>Portes</dt><dd>Vendredi et samedi dès 20 h 30, dimanche dès 18 h 30. Dernier set à 3 h (1 h le dimanche).</dd></div>
      <div data-reveal><dt>Y aller</dt><dd>Une navette de nuit serait prévue depuis la gare de Valdraye, toutes les 20 minutes. Vélos et covoiturage encouragés.</dd></div>
      <div data-reveal><dt>Accessibilité</dt><dd>Cheminements plats vers les trois scènes, plateformes surélevées devant La Cuve et Le Dôme, toilettes adaptées, accompagnant·e admis·e.</dd></div>
      <div data-reveal><dt>Santé</dt><dd>Bouchons d'oreilles à disposition, eau gratuite, espace calme sous le Dôme et équipe de prévention présente toute la nuit.</dd></div>
      <div data-reveal><dt>Règles</dt><dd>Ni verre ni objet contondant. Le respect de chacun·e est la première règle de la maison.</dd></div></dl></div></section>`),
  sec(`<section class="pu-faq pk-bleed"><div class="pu-wrap pu-faq-in"><h2 class="pu-h2" data-reveal>Bon à savoir</h2><div>
    <details data-reveal><summary>Peut-on camper sur place ?</summary><p>Dans cette démonstration, aucun hébergement n'est proposé. Les informations réelles seraient publiées par l'organisation.</p></details>
    <details data-reveal><summary>Y a-t-il de quoi manger ?</summary><p>Un espace restauration avec options végétariennes serait installé entre La Cuve et Le Quai.</p></details>
    <details data-reveal><summary>Peut-on sortir et rentrer ?</summary><p>Oui, avec le bracelet : un contrôle rapide à chaque passage.</p></details>
    <details data-reveal><summary>Où poser une question ?</summary><p>Via le <a href="/contact">formulaire de contact</a>.</p></details></div></div></section>`),
  sec(footer(c))];

const fiche = (a) => `<article class="pu-fiche" data-fiche="${a.id}" aria-label="Fiche de ${esc(a.name)}">${sigil(a.i)}<div class="pu-fiche-b"><p class="pu-kicker">${DAYS[a.day][0]} ${DAYS[a.day][1]} · ${SCENES[a.scene]} · ${a.time}</p><h2 class="pu-h2">${esc(a.name)}</h2><p class="pu-fiche-g">${esc(a.genre)} · ${esc(a.city)}</p><p class="pu-lead">${esc(a.hook)}</p>
  <dl class="pu-fiche-dl"><div><dt>Piste d'écoute</dt><dd>${TRACKS[a.track][0]} — ${TRACKS[a.track][1]}</dd></div><div><dt>Créneau</dt><dd>${a.time}, ${SCENES[a.scene]}</dd></div></dl>
  <div class="pu-actions"><a class="pu-btn" href="#ecouter" role="button" data-play="${a.track}">${play}<span>Écouter l'extrait</span></a><a class="pu-btn pu-btn--line pu-mini--fav" href="#favori" role="button" aria-pressed="false" data-fav="${a.id}">${star}<span>Favori</span></a></div></div></article>`;
const artistes = (c) => [sec(header(c, "/artistes")),
  pagehead("Fiches artistes", "ARTISTES", "Dix-huit artistes imaginaires, trois univers sonores. Choisissez un nom pour ouvrir sa fiche."),
  sec(`<section class="pu-art pk-bleed" data-fiches><div class="pu-wrap"><div class="pu-art-list" role="group" aria-label="Choisir un artiste">${ART.map((a, n) => `<a href="#${a.id}" role="button" aria-pressed="${n ? "false" : "true"}"${n ? "" : ' class="is-on"'} data-fiche-pick="${a.id}"><span>${String(n + 1).padStart(2, "0")}</span>${esc(a.name)}</a>`).join("")}</div></div></section>`),
  ...[0, 6, 12].map((n) => sec(`<section class="pu-art-p pk-bleed" data-fiches><div class="pu-wrap" role="region" aria-label="Fiches artistes">${ART.slice(n, n + 6).map(fiche).join("")}</div></section>`)),
  sec(player()),
  sec(footer(c))];

const actualites = (c) => [sec(header(c, "/actualites")),
  pagehead("Le journal du label", "ACTUALITÉS", "Sorties, annonces du festival et coulisses. Textes de démonstration."),
  sec(`<section class="pu-feat pk-bleed"><div class="pu-wrap"><a class="pu-feat-in" href="/contact" data-reveal>${sigil(2)}<div><time>${newsItems[0][0]}</time><span class="pu-tag">${newsItems[0][1]}</span><h2 class="pu-h2">${esc(newsItems[0][2])}</h2><p class="pu-lead">${esc(newsItems[0][3])}</p><span class="pu-btn pu-btn--ink">Nous écrire ${arrow}</span></div></a></div></section>`),
  sec(`<section class="pu-nlist pk-bleed"><div class="pu-wrap"><ol>${newsItems.slice(1).concat([["15 juil. 2026", "Festival", "Appel aux bénévoles : la friche cherche des bras", "Montage, accueil, bar : les profils recherchés, expliqués."], ["2 juin 2026", "Le label", "Retour sur la fête d'été du label", "Une nuit courte, un plancher plein, de belles rencontres."]]).map(([d, t, h, x]) => `<li data-reveal><a href="/contact"><time>${d}</time><span class="pu-tag">${t}</span><h3>${esc(h)}</h3><p>${esc(x)}</p></a></li>`).join("")}</ol></div></section>`),
  sec(footer(c))];

const contact = (c) => [sec(header(c, "/contact")), pagehead("Une question ?", "CONTACT", "Presse, partenariats, bénévolat ou simple message : écrivez à l'équipe."),
  { type: "form", heading: "Écrire à Pulse", intro: "Indiquez votre demande : l'équipe répond sous quelques jours. Aucune vente ni réservation n'est traitée ici." }, sec(footer(c))];
const recherche = (c) => [sec(header(c, "/recherche")), pagehead("Rechercher", "TROUVER", "Un artiste, une scène, une actualité."), { type: "layout", children: [{ type: "search", props: { placeholder: "Rechercher sur le site…" } }] }, sec(footer(c))];
const introuvable = (c) => [sec(header(c, "/introuvable")), sec(`<section class="pu-404 pk-bleed"><div class="pu-wrap"><p class="pu-kicker">Signal perdu</p><div class="pu-mega" role="heading" aria-level="1" aria-label="404">${warp("404")}</div><p class="pu-ph-sub">Cette page n'existe pas ou a changé d'adresse.</p><div class="pu-actions"><a class="pu-btn" href="/">Retour à l'accueil ${arrow}</a><a class="pu-btn pu-btn--line" href="/lineup">Voir le line-up</a></div></div></section>`), sec(footer(c))];

module.exports = {
  key: "pulse", name: "Pulse", version: "2.0.0", category: "divertissement", tags: ["sombre", "audacieux", "experimental"], siteType: "Label musical et festival", featured: true,
  concept: "Un label et son festival de nuit : titres liquides déformés, barre de navigation fixe en bas, programme en colonnes scènes × heures et line-up avec lecteur d'extraits synthétisés.",
  description: "Label musical et festival fictifs : noir profond, magenta acide et vert fluo, titre plein écran déformé, dock fixe en bas, programme horaire par scène, line-up filtrable avec favoris et lecteur d'extraits Web Audio.",
  brand: "Pulse Nocturne", modules: ["formulaires", "recherche"],
  dna: { header: "dock-fixe-bas-icones", hero: "titre-deforme-liquide-plein-ecran", grid: "programme-horaire-scenes-en-colonnes", motion: "deformation-saccadee-et-egaliseur", shapes: "ondes-halos-neon-et-bandes-obliques", rhythm: "flash-saccade-et-respiration", signature: "lineup-favoris-et-lecteur-audio-synthetise" },
  tokens: {
    colors: { primary: "#ff2fd0", secondary: "#130b22", accent: "#b8ff1a", background: "#07050d", surface: "#130b22", text: "#f6f1ff", muted: "#b9aed1", success: "#b8ff1a", warning: "#ffd23f", error: "#ff6b81" },
    fonts: { heading: "font.rubik-mono-one", body: "font.space-mono", button: "font.rubik-mono-one", link: "font.space-mono" },
    radius: { sm: 0, md: 4, lg: 8, button: 0, field: 0, card: 0 }, shadow: { card: "none", button: "none" }, border: { width: 2, color: "#2d1d4a" },
    type: { h1: { size: 120, weight: 400, lineHeight: 0.9, transform: "uppercase" }, h2: { size: 48, weight: 400, lineHeight: 1, transform: "uppercase" } },
  },
  options: [
    { key: "accent", label: "Magenta acide", type: "color", default: "#ff2fd0" },
    { key: "neon", label: "Vert fluo", type: "color", default: "#b8ff1a" },
    { key: "warp", label: "Déformation des titres", type: "choice", default: "on", choices: [["on", "Active"], ["off", "Statique"]] },
    { key: "scan", label: "Trame de scène (lignes)", type: "choice", default: "on", choices: [["on", "Affichée"], ["off", "Masquée"]] },
    { key: "ticker", label: "Bandeaux défilants", type: "choice", default: "on", choices: [["on", "Affichés"], ["off", "Masqués"]] },
  ],
  menu: [["Accueil", "/"], ["Line-up", "/lineup"], ["Programme", "/programme"], ["Billetterie", "/billetterie"], ["Infos", "/infos"], ["Artistes", "/artistes"], ["Actualités", "/actualites"], ["Contact", "/contact"]],
  pages: [
    { key: "accueil", name: "Accueil", render: home }, { key: "lineup", name: "Line-up", render: lineup }, { key: "programme", name: "Programme", render: programme },
    { key: "billetterie", name: "Billetterie", render: billetterie }, { key: "infos", name: "Infos pratiques", render: infos }, { key: "artistes", name: "Artistes", render: artistes },
    { key: "actualites", name: "Actualités", render: actualites }, { key: "contact", name: "Contact", render: contact }, { key: "recherche", name: "Recherche", render: recherche }, { key: "introuvable", name: "Page introuvable", render: introuvable },
  ],
};
