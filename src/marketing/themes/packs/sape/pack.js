// Sape — sapologie et couture sur mesure. Direction artistique : un atelier de couture à l'élégance flamboyante. Fond ivoire bleuté en alternance avec des bandes brique-chocolat et or ;
// navigation en étiquette de vêtement cousue au fil, défilé de silhouettes en costumes de couleurs franches qui glissent sur un podium, lookbook en pages de livre dépliantes,
// et composant signature : prise de mesures guidée (schéma du corps qui s'illumine, cm/in, vérification de cohérence) puis choix du look qui recolore la silhouette.
const { sec, esc } = require("../kit");

// ---------- Silhouettes ----------
// Un gentleman dessiné en aplats. Les couleurs viennent de classes CSS (sp-l-<look>) : le même dessin sert pour le défilé, le lookbook et le configurateur (all = tous les accessoires, activés par classes).
const gent = (o = {}) => {
  const { look = "", hat = "none", cane = false, bow = false, db = false, all = false, flip = false, skin = "s1", label = "" } = o;
  const og = (name, on, inner) => (all || on ? `<g class="sp-og sp-g-${name}${!all && on ? " sp-on" : ""}">${inner}</g>` : "");
  const body = `<ellipse cx="100" cy="450" rx="64" ry="6" fill="#1b0b08" opacity=".25"/>
<g class="sp-lg"><path class="sp-su" d="M67 236H133L129 432H104L100 300L96 432H71Z"/><path class="sp-su2" d="M71 424H96V432H71ZM104 424H129V432H104Z"/></g>
<g><path class="sp-sh" d="M68 432H97V443Q97 449 90 449H70Q62 449 62 442Q62 436 68 432Z"/><path class="sp-sh2" d="M62 442Q62 449 70 449H79V439Q70 437 62 442Z"/><path class="sp-sh" d="M103 432H132Q138 436 138 442Q138 449 130 449H110Q103 449 103 443Z"/><path class="sp-sh2" d="M138 442Q138 449 130 449H121V439Q130 437 138 442Z"/></g>
<g class="sp-${skin}"><path class="sp-sk" d="M92 76H108V104H92Z"/><ellipse class="sp-sk" cx="100" cy="60" rx="16" ry="20"/><ellipse class="sp-sk" cx="84" cy="62" rx="3" ry="5"/><ellipse class="sp-sk" cx="116" cy="62" rx="3" ry="5"/><path class="sp-hr" d="M84 56Q85 38 100 38Q115 38 116 56Q110 46 100 46Q90 46 84 56Z"/><circle cx="94" cy="60" r="1.5" fill="#1b0b08"/><circle cx="106" cy="60" r="1.5" fill="#1b0b08"/><path d="M94 70Q100 75 106 70" stroke="#1b0b08" stroke-width="1.6" fill="none" stroke-linecap="round"/>
<g class="sp-up"><path class="sp-su" d="M60 106Q78 94 100 102Q122 94 140 106L135 190L139 264Q100 272 61 264L65 190Z"/>
<path class="sp-su" d="M60 106Q45 110 43 142L37 236L57 241L66 150L71 114Z"/><path class="sp-su" d="M140 106Q155 110 157 142L163 236L143 241L134 150L129 114Z"/>
${all ? `<path class="sp-hl" d="M64 112L82 106L78 262L63 262Z"/><path class="sp-sd" d="M118 108L136 108L138 262L120 264Z"/>` : ""}
<path class="sp-wh" d="M37 232L57 237L56 244L36 239ZM143 237L163 232L164 239L144 244Z"/><path class="sp-li" d="M36 240L56 245L55 248L35 243ZM144 245L164 240L165 243L145 248Z"/>
<ellipse class="sp-sk" cx="46" cy="254" rx="8" ry="11"/><ellipse class="sp-sk" cx="154" cy="254" rx="8" ry="11"/>
<path class="sp-wh" d="M84 100L100 178L116 100Z"/><path class="sp-wh" d="M86 96L100 112L114 96L108 90L100 100L92 90Z"/>
<path class="sp-su2" d="M72 100L100 180L88 184L62 130ZM128 100L100 180L112 184L138 130Z"/><path class="sp-lis" d="M86 100L100 174M114 100L100 174" stroke-width="3" fill="none"/>
${og("tie", !bow, `<path class="sp-ti" d="M96 100H104L103 110H97Z"/><path class="sp-ti" d="M97 110H103L107 166L100 180L93 166Z"/><path d="M98 126L105 122M97 140L105 135M97 154L105 149" stroke="#fff" opacity=".4" fill="none"/>`)}
${og("bow", bow, `<path class="sp-ti" d="M85 104L99 108V117L85 121ZM115 104L101 108V117L115 121Z"/><rect class="sp-ti" x="96" y="106" width="8" height="12" rx="2"/>`)}
<path class="sp-po" d="M71 143L74 131L80 138L85 129L90 144Z"/><path d="M69 145H93" stroke="#000" opacity=".28" fill="none"/>

${og("db", db, `<path class="sp-su" d="M100 184L127 190L132 264Q116 268 100 267Z"/><path d="M100 184L127 190L132 264" stroke="#000" opacity=".25" fill="none"/><circle class="sp-bt" cx="86" cy="200" r="2.6"/><circle class="sp-bt" cx="86" cy="228" r="2.6"/><circle class="sp-bt" cx="114" cy="204" r="2.6"/><circle class="sp-bt" cx="114" cy="232" r="2.6"/>`)}
<circle class="sp-bt" cx="100" cy="208" r="2.6"/><circle class="sp-bt" cx="100" cy="234" r="2.6"/></g></g>
${og("fedora", hat === "fedora", `<ellipse class="sp-hat" cx="100" cy="44" rx="36" ry="8"/><path class="sp-hat" d="M79 44Q78 17 100 15Q122 17 121 44Z"/><path class="sp-hb" d="M79 37H121V44H79Z"/><path d="M92 16Q100 24 108 16" stroke="#000" opacity=".3" fill="none"/>`)}
${og("bowler", hat === "bowler", `<ellipse class="sp-hat" cx="100" cy="45" rx="29" ry="6"/><path class="sp-hat" d="M80 45Q78 18 100 17Q122 18 120 45Z"/><path class="sp-hb" d="M80 39H120V45H80Z"/>`)}
${og("panama", hat === "panama", `<ellipse class="sp-hat2" cx="100" cy="44" rx="38" ry="8"/><path class="sp-hat2" d="M82 44V24Q100 19 118 24V44Z"/><path class="sp-hb" d="M82 36H118V43H82Z"/><path d="M90 24V44M100 21V44M110 24V44" stroke="#000" opacity=".1" fill="none"/>`)}
${og("cane", cane, `<path class="sp-cs" d="M165 238L170 446" stroke-width="4" fill="none" stroke-linecap="round"/><path class="sp-cs" d="M165 240Q165 222 151 225" stroke-width="4" fill="none" stroke-linecap="round"/><rect class="sp-gd" x="163" y="236" width="7" height="5" rx="1"/>`)}`;
  return `<svg class="sp-gent ${look ? "sp-l-" + look : ""}${all ? " sp-all" : ""}" viewBox="0 0 200 460" ${label ? `role="img" aria-label="${esc(label)}"` : 'aria-hidden="true"'}>${flip ? `<g transform="translate(200 0) scale(-1 1)">${body}</g>` : body}</svg>`;
};

const LOOKS = [
  { id: "lagon", n: "Le Lagon", color: "Turquoise", hat: "fedora", cane: true, bow: false, db: false, skin: "s2", tissu: "Soie et laine", coupe: "Cintrée", doublure: "Soie rose", acc: "Cravate canari, pochette rose, feutre assorti", d: "Un turquoise de lagune, une cravate canari et un feutre qui s'incline juste ce qu'il faut. Le look d'ouverture du défilé." },
  { id: "canari", n: "Canari du dimanche", color: "Jaune canari", hat: "panama", cane: false, bow: false, db: false, skin: "s3", tissu: "Lin lourd", coupe: "Droite", doublure: "Satin turquoise", acc: "Cravate émeraude, pochette orange, panama", d: "Le jaune qui se voit de l'autre côté de l'avenue. Lin lourd, coupe droite, panama clair : on marche lentement, on salue tout le monde." },
  { id: "rose", n: "Rose Bonbon", color: "Rose", hat: "none", cane: false, bow: true, db: false, skin: "s1", tissu: "Laine froide", coupe: "Cintrée", doublure: "Satin canari", acc: "Nœud papillon turquoise, pochette canari", d: "Un rose franc, un nœud papillon turquoise, aucune excuse. La coupe cintrée dessine la ligne, la doublure canari fait le reste." },
  { id: "mandarine", n: "Mandarine", color: "Orange", hat: "none", cane: true, bow: false, db: true, skin: "s2", tissu: "Velours côtelé", coupe: "Croisée", doublure: "Turquoise uni", acc: "Cravate émeraude, pochette canari, canne", d: "Un veston croisé en velours côtelé orange, porté avec la canne de la maison. Pour les soirées où l'on veut entrer en dernier." },
  { id: "emeraude", n: "Émeraude royal", color: "Vert émeraude", hat: "bowler", cane: true, bow: false, db: false, skin: "s3", tissu: "Soie et laine", coupe: "Droite", doublure: "Soie rose", acc: "Cravate canari, pochette rose, melon, canne", d: "Un vert profond, un melon, une canne : l'allure du gentleman des grands boulevards, avec une doublure rose qui trahit son humour." },
  { id: "matonge", n: "Minuit à Matonge", color: "Brique-chocolat", hat: "fedora", cane: false, bow: false, db: true, skin: "s1", tissu: "Laine froide", coupe: "Croisée", doublure: "Satin doré", acc: "Cravate or, pochette rose, feutre chocolat", d: "Le seul look sombre du défilé, mais jamais discret : croisé chocolat, cravate dorée et pochette rose pour les nuits qui s'étirent." },
];
const lookSvg = (l, i, extra = {}) => gent({ look: l.id, hat: l.hat, cane: l.cane, bow: l.bow, db: l.db, skin: l.skin, flip: i % 2 === 1, label: `Silhouette du look ${l.n}`, ...extra });
const lookSvgDeco = (l, i, extra = {}) => gent({ look: l.id, hat: l.hat, cane: l.cane, bow: l.bow, db: l.db, skin: l.skin, flip: i % 2 === 1, ...extra });
const num2 = (n) => String(n).padStart(2, "0");

// ---------- Schéma du corps (mannequin de couturier) ----------
const MEAS = [
  { k: "cou", n: "Tour de cou", min: 34, max: 48, def: 39, tip: "Passez le mètre à la base du cou, là où se posera le col de la chemise. Glissez un doigt entre le ruban et la peau pour garder de l'aisance.", how: "Ruban horizontal, sans serrer, menton droit." },
  { k: "epaules", n: "Largeur d'épaules", min: 38, max: 56, def: 46, tip: "D'un bout d'épaule à l'autre en passant par le haut du dos, bras relâchés. Demandez à quelqu'un de tenir le ruban : seul, on se tord.", how: "Repérez l'os au bout de l'épaule, là où la couture de la manche viendra se poser." },
  { k: "poitrine", n: "Tour de poitrine", min: 80, max: 135, def: 100, tip: "Au plus fort de la poitrine, sous les aisselles, ruban bien horizontal dans le dos. Respirez normalement, bras le long du corps.", how: "Le ruban doit toucher sans comprimer ; une main à plat doit pouvoir passer." },
  { k: "taille", n: "Tour de taille", min: 66, max: 130, def: 86, tip: "À l'endroit le plus étroit du buste, à peu près au niveau du nombril. Ne rentrez pas le ventre : la veste doit fermer sans tirer.", how: "Pour un pantalon, mesurez aussi là où vous le portez d'habitude." },
  { k: "hanches", n: "Tour de hanches", min: 82, max: 136, def: 100, tip: "Au plus large des hanches, pieds joints, ruban horizontal. C'est cette mesure qui règle la tenue du pantalon et la longueur de la veste.", how: "Videz vos poches avant de mesurer." },
  { k: "manche", n: "Longueur de manche", min: 56, max: 72, def: 64, tip: "De l'os de l'épaule jusqu'au poignet, bras légèrement plié : le ruban suit le coude. Le bord de la chemise doit dépasser d'un centimètre.", how: "Gardez le bras plié, comme pour tenir une canne." },
  { k: "entrejambe", n: "Entrejambe", min: 70, max: 92, def: 80, tip: "De l'entrejambe jusqu'à la cheville, le long de la jambe, pieds à plat. Un pantalon bien ajusté que vous portez déjà aide à contrôler la valeur.", how: "Décidez aussi de l'effet voulu : cassure franche, cheville apparente." },
  { k: "stature", n: "Stature", min: 150, max: 205, def: 178, tip: "Pieds nus, talons contre le mur, regard droit. Posez une règle à plat sur la tête et marquez le mur, puis mesurez du sol à la marque.", how: "Cette mesure sert surtout à vérifier la cohérence des autres." },
];

const mannequin = (active = "poitrine", cls = "") => `<svg class="sp-man ${cls}" viewBox="0 0 260 540" role="img" aria-label="Schéma d'un mannequin de couturier avec les points de mesure : cou, épaules, poitrine, taille, hanches, manche, entrejambe et stature">
<ellipse cx="130" cy="526" rx="70" ry="6" fill="#1b0b08" opacity=".18"/>
<path class="sp-mq" d="M118 60H142V96H118Z"/><ellipse class="sp-mq" cx="130" cy="36" rx="23" ry="29"/>
<path class="sp-mq" d="M60 118Q80 98 118 92H142Q180 98 200 118L196 224Q190 254 186 314H74Q70 254 64 224Z"/>
<path class="sp-mq" d="M60 118Q44 128 42 164L30 314L52 320L72 174L78 126ZM200 118Q216 128 218 164L230 314L208 320L188 174L182 126Z"/>
<path class="sp-mq" d="M74 304H186L190 354L172 524H140L131 376L120 524H88L70 354Z"/>
<path d="M130 100V300M92 150Q130 160 168 150M92 232Q130 242 168 232" class="sp-guide" stroke="#b9a981" stroke-width="1.2" fill="none"/>
<g class="sp-ml${active === "cou" ? " is-on" : ""}" data-m="cou"><path d="M108 84Q130 98 152 84" fill="none"/><circle cx="108" cy="84" r="3.6"/><circle cx="152" cy="84" r="3.6"/></g>
<g class="sp-ml${active === "epaules" ? " is-on" : ""}" data-m="epaules"><path d="M62 118Q130 98 198 118" fill="none"/><circle cx="62" cy="118" r="4"/><circle cx="198" cy="118" r="4"/></g>
<g class="sp-ml${active === "poitrine" ? " is-on" : ""}" data-m="poitrine"><path d="M68 168Q130 182 192 168" fill="none"/><circle cx="68" cy="168" r="3.6"/><circle cx="192" cy="168" r="3.6"/></g>
<g class="sp-ml${active === "taille" ? " is-on" : ""}" data-m="taille"><path d="M72 240Q130 254 188 240" fill="none"/><circle cx="72" cy="240" r="3.6"/><circle cx="188" cy="240" r="3.6"/></g>
<g class="sp-ml${active === "hanches" ? " is-on" : ""}" data-m="hanches"><path d="M72 316Q130 330 188 316" fill="none"/><circle cx="72" cy="316" r="3.6"/><circle cx="188" cy="316" r="3.6"/></g>
<g class="sp-ml${active === "manche" ? " is-on" : ""}" data-m="manche"><path d="M60 118Q44 132 42 168L34 312" fill="none"/><circle cx="60" cy="118" r="4"/><circle cx="34" cy="312" r="4"/></g>
<g class="sp-ml${active === "entrejambe" ? " is-on" : ""}" data-m="entrejambe"><path d="M126 378L112 520" fill="none"/><circle cx="126" cy="378" r="4"/><circle cx="112" cy="520" r="4"/></g>
<g class="sp-ml${active === "stature" ? " is-on" : ""}" data-m="stature"><path d="M246 8V524M238 8H254M238 524H254" fill="none"/></g>
</svg>`;

// ---------- Accessoires dessinés ----------
const ACC = [
  { n: "La cravate", t: "Soie tissée, nœud Windsor. Elle porte la deuxième couleur du look.", svg: `<svg viewBox="0 0 120 120" aria-hidden="true"><path class="sp-a1" d="M52 12H68L65 28H55Z"/><path class="sp-a1" d="M55 28H65L76 96L60 112L44 96Z"/><path d="M52 52L68 44M50 70L70 62M48 88L72 80" stroke="#fff" opacity=".45" stroke-width="3" fill="none"/><path d="M52 12H68L65 28H55Z" fill="#000" opacity=".15"/></svg>` },
  { n: "La pochette", t: "Pliée en trois pointes : elle répond à la cravate sans la copier.", svg: `<svg viewBox="0 0 120 120" aria-hidden="true"><path class="sp-a2" d="M22 74L34 34L48 58L62 26L76 58L92 36L100 74Z"/><path d="M34 34L48 58M62 26L76 58" stroke="#000" opacity=".2" fill="none"/><path class="sp-a3" d="M12 70H108V108H12Z"/><path d="M12 70H108" stroke="#fff" opacity=".35" stroke-width="2"/></svg>` },
  { n: "Le chapeau", t: "Feutre, melon ou panama : il se choisit après le costume, jamais avant.", svg: `<svg viewBox="0 0 120 120" aria-hidden="true"><ellipse class="sp-a3" cx="60" cy="82" rx="52" ry="14"/><path class="sp-a3" d="M30 82Q28 30 60 26Q92 30 90 82Z"/><path class="sp-a1" d="M30 70H90V82H30Z"/><path d="M48 28Q60 44 72 28" stroke="#000" opacity=".3" fill="none" stroke-width="2"/></svg>` },
  { n: "La canne", t: "Bois sombre, pommeau doré. Elle ne soutient pas : elle ponctue.", svg: `<svg viewBox="0 0 120 120" aria-hidden="true"><path class="sp-a4" d="M86 112L70 36" stroke-width="7" fill="none" stroke-linecap="round"/><path class="sp-a4" d="M70 36Q66 14 48 18Q36 22 40 36" stroke-width="7" fill="none" stroke-linecap="round"/><rect class="sp-a1" x="64" y="36" width="14" height="8" rx="2" transform="rotate(-14 71 40)"/><circle class="sp-a1" cx="40" cy="36" r="5"/></svg>` },
  { n: "Les souliers", t: "Bicolores ou vernis, toujours cirés. On les regarde avant le visage.", svg: `<svg viewBox="0 0 120 120" aria-hidden="true"><path class="sp-a3" d="M12 92V66Q12 58 20 58H38L44 72Q64 74 84 84Q96 88 100 94V100H12Z"/><path class="sp-a2" d="M12 92V66Q12 58 20 58H30L34 100H12Z"/><path d="M38 58L44 72M50 74L56 62M58 76L66 64" stroke="#fff" opacity=".6" stroke-width="2" fill="none"/><path d="M8 100H108" stroke="#000" opacity=".35" stroke-width="4"/><path d="M52 30L60 44L72 40" stroke="#c9a24a" stroke-width="0" fill="none"/></svg>` },
];

// ---------- Pictos de l'atelier ----------
const IC = {
  patron: `<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M8 6H28L40 18V42H8Z" fill="none" stroke-width="2.4"/><path d="M14 20H34M14 28H34M14 36H26" fill="none" stroke-width="2" class="sp-ds"/><path d="M28 6V18H40" fill="none" stroke-width="2.4"/></svg>`,
  craie: `<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M10 38L30 10L38 16L18 44Z" fill="none" stroke-width="2.4" stroke-linejoin="round"/><path d="M30 10L38 16" stroke-width="2.4"/><path d="M6 44H16" stroke-width="2.4" class="sp-ds"/></svg>`,
  ciseaux: `<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="12" cy="36" r="6" fill="none" stroke-width="2.4"/><circle cx="26" cy="40" r="6" fill="none" stroke-width="2.4"/><path d="M16 31L38 6M23 34L42 18" fill="none" stroke-width="2.4" stroke-linecap="round"/></svg>`,
  aiguille: `<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M40 6L10 40" fill="none" stroke-width="2.4" stroke-linecap="round"/><ellipse cx="38" cy="9" rx="2" ry="5" transform="rotate(42 38 9)" fill="none" stroke-width="2"/><path d="M12 38C6 38 6 28 14 28C22 28 20 40 30 40C38 40 40 32 44 34" fill="none" stroke-width="2" class="sp-ds"/></svg>`,
  epingles: `<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M12 12L36 40M22 8L44 30M6 22L28 44" fill="none" stroke-width="2.2" stroke-linecap="round"/><circle cx="10" cy="10" r="3.4" fill="none" stroke-width="2"/><circle cx="20" cy="6" r="3.4" fill="none" stroke-width="2"/><circle cx="4" cy="20" r="3.4" fill="none" stroke-width="2"/></svg>`,
  fer: `<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M6 36Q6 20 24 18H36Q44 20 44 28V36Z" fill="none" stroke-width="2.4" stroke-linejoin="round"/><path d="M14 28H34" stroke-width="2.4" class="sp-ds"/><path d="M22 18Q22 10 30 10H36" fill="none" stroke-width="2.4"/><path d="M8 42H44" stroke-width="2.4"/></svg>`,
};

// ---------- Éléments communs ----------
const arrow = `<svg class="sp-arr" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12H20M14 6L20 12L14 18" fill="none" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const hanger = `<svg class="sp-hang" viewBox="0 0 48 40" aria-hidden="true"><path d="M24 4A5 5 0 1 1 29 9V14L45 32Q47 36 43 36H5Q1 36 3 32L19 14" fill="none" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const tapeRule = `<div class="sp-tape" aria-hidden="true"><span>0</span><span>10</span><span>20</span><span>30</span><span>40</span><span>50</span><span>60</span><span>70</span><span>80</span><span>90</span><span>100</span></div>`;

const links = (menu) => menu.map((m) => `<a class="sp-nl" href="${esc(m.url)}">${esc(m.label)}</a>`).join('<i class="sp-st" aria-hidden="true"></i>');
const header = (c) => `<header class="sp-head pk-bleed">${tapeRule}
<div class="sp-head-in"><a class="sp-logo" href="/" aria-label="${esc(c.brand)} : accueil">${hanger}<span class="sp-logo-t">Maison Kassa<small>sapologie et couture sur mesure</small></span></a>
<div class="sp-label" role="navigation" aria-label="Navigation principale"><span class="sp-thread-l" aria-hidden="true"></span>${links(c.menu)}<span class="sp-thread-r" aria-hidden="true"></span></div>
<details class="sp-tagmenu"><summary aria-label="Ouvrir le menu"><span class="sp-tag-hole" aria-hidden="true"></span><span class="sp-tag-t">Menu</span></summary>
<div class="sp-tag-body" role="navigation" aria-label="Menu mobile"><p class="sp-tag-k">Étiquette d'entretien</p>${c.menu.map((m) => `<a class="sp-nl" href="${esc(m.url)}">${esc(m.label)}</a>`).join("")}<a class="sp-btn sp-btn--gold" href="/mesures">Prendre mes mesures</a></div></details>
</div><div class="sp-wax" aria-hidden="true"></div></header>`;

const footer = (c) => `<footer class="sp-foot pk-bleed"><div class="sp-wax sp-wax--top" aria-hidden="true"></div>
<div class="sp-foot-in"><div class="sp-foot-brand"><div class="sp-foot-logo">Maison Kassa</div><p>Costumes taillés sur mesure, couleurs assumées. Chaque pièce est dessinée, coupée et finie à la main dans un seul atelier.</p><address>Atelier : 14 avenue des Élégants, 1000 (adresse fictive)<br>Sur rendez-vous, du mardi au samedi</address></div>
<div><h2 class="sp-foot-h">La maison</h2><div class="sp-fl-col">${c.menu.slice(1, 5).map((m) => `<a class="sp-fl" href="${esc(m.url)}">${esc(m.label)}</a>`).join("")}</div></div>
<div><h2 class="sp-foot-h">Plus</h2><div class="sp-fl-col"><a class="sp-fl" href="/contact">Contact</a><a class="sp-fl" href="/recherche">Recherche</a><a class="sp-fl" href="/mesures">Prise de mesures</a></div></div></div>
<p class="sp-legal">© Maison Kassa : site de démonstration. Looks, tissus, adresses et horaires fictifs ; aucune commande, aucun paiement ni rendez-vous n'est enregistré ici.</p></footer>`;

const pagehead = (kicker, title, sub) => sec(`<section class="sp-ph pk-bleed"><div class="sp-ph-bg" aria-hidden="true"><svg viewBox="0 0 1200 220" preserveAspectRatio="xMidYMid slice"><path d="M0 208H1200" stroke="#c9a24a" stroke-width="1.5" class="sp-ds" fill="none" opacity=".6"/><path d="M-20 60Q300 -10 600 70T1220 50" stroke="#c9a24a" stroke-width="1.2" fill="none" opacity=".35"/><g fill="#c9a24a" opacity=".5"><circle cx="1020" cy="208" r="4"/><circle cx="1090" cy="208" r="4"/><circle cx="150" cy="208" r="4"/></g></svg></div>
<div class="sp-wrap sp-ph-in"><p class="sp-kick" data-reveal>${esc(kicker)}</p><div class="sp-title" role="heading" aria-level="1" data-reveal>${title}</div>${sub ? `<p class="sp-ph-sub" data-reveal>${esc(sub)}</p>` : ""}</div></section>`);

const sechead = (k, h, p) => `<div class="sp-sechead"><div><p class="sp-kick" data-reveal>${k}</p><h2 class="sp-h2" data-reveal>${h}</h2></div>${p ? `<p class="sp-sechead-p" data-reveal>${p}</p>` : ""}</div>`;

// ---------- Défilé ----------
const model = (l, i, hidden = false) => `<figure class="sp-model"${hidden ? ' aria-hidden="true"' : ""}>${lookSvg(l, i, hidden ? { label: "" } : {})}<figcaption class="sp-plate"><span class="sp-plate-n">Look ${num2((i % LOOKS.length) + 1)}</span><b>${esc(l.n)}</b></figcaption></figure>`;
const runway = () => `<div class="sp-run" data-run role="group" aria-label="Défilé : six silhouettes en costume sur un podium"><div class="sp-track">${LOOKS.map((l, i) => model(l, i)).join("")}</div><div class="sp-floor" aria-hidden="true"></div></div>`;

// ---------- Lookbook (pages de livre dépliantes) ----------
const spread = (l, i) => `<article class="sp-spread${i === 0 ? " is-on" : ""}" data-i="${i}" aria-label="Look ${i + 1} sur ${LOOKS.length} : ${esc(l.n)}">
<div class="sp-pg sp-pg--l sp-bgc-${l.id}">${lookSvg(l, i)}<span class="sp-folio">${i * 2 + 1}</span></div>
<div class="sp-pg sp-pg--r"><p class="sp-kick">Look ${num2(i + 1)} · ${esc(l.color)}</p><h3 class="sp-h3">${esc(l.n)}</h3><p class="sp-pg-d">${esc(l.d)}</p>
<dl class="sp-spec"><div><dt>Tissu</dt><dd>${esc(l.tissu)}</dd></div><div><dt>Coupe</dt><dd>${esc(l.coupe)}</dd></div><div><dt>Doublure</dt><dd>${esc(l.doublure)}</dd></div><div><dt>Accessoires</dt><dd>${esc(l.acc)}</dd></div></dl>
<a class="sp-more" href="/mesures">Composer un look proche ${arrow}</a><span class="sp-folio sp-folio--r">${i * 2 + 2}</span></div></article>`;
const bookBar = () => `<div class="sp-book-bar"><a class="sp-bk" href="#precedent" data-bk="prev">${arrow}<span>Page précédente</span></a><p class="sp-folio-t" data-bk-t aria-live="polite">Look 1 sur ${LOOKS.length}</p><a class="sp-bk sp-bk--next" href="#suivant" data-bk="next"><span>Page suivante</span>${arrow}</a></div>`;
const bookIdx = () => `<ol class="sp-idx" aria-label="Sommaire du lookbook">${LOOKS.map((l, i) => `<li><a class="sp-idx-a${i === 0 ? " is-on" : ""}" href="#look-${i + 1}" data-bk-go="${i}"><span class="sp-sw sp-bgc-${l.id}"></span><b>${num2(i + 1)}</b>${esc(l.n)}</a></li>`).join("")}</ol>`;
const bookA = () => `<section class="sp-sec sp-sec--blue sp-join-a sp-bkz pk-bleed" data-book><div class="sp-wrap"><div class="sp-book">${bookBar()}<div class="sp-book-body">${LOOKS.slice(0, 3).map((l, i) => spread(l, i)).join("")}</div></div></div></section>`;
const bookB = () => `<section class="sp-sec sp-sec--blue sp-join-b sp-bkz pk-bleed"><div class="sp-wrap"><div class="sp-book"><div class="sp-book-body">${LOOKS.slice(3).map((l, i) => spread(l, i + 3)).join("")}</div>${bookIdx()}</div></div></section>`;

// ---------- Prise de mesures ----------
const stageMeasure = (m, i) => `<article class="sp-stg" data-stg="${i}" data-key="${m.k}" data-min="${m.min}" data-max="${m.max}" data-def="${m.def}" data-lbl="${esc(m.n)}"><p class="sp-kick">Étape ${i + 1} sur 11</p><h3 class="sp-h3">${esc(m.n)}</h3><p class="sp-tip">${esc(m.tip)}</p><p class="sp-how">${esc(m.how)}</p><div class="sp-ctl" data-ctl></div></article>`;
const opt = (grp, val, label, extra = "") => `<a class="sp-op" href="#${grp}-${val}" data-opt="${grp}:${val}" role="radio" aria-checked="false">${extra}<span>${esc(label)}</span></a>`;
const sw = (grp, val, label, col) => opt(grp, val, label, `<i class="sp-dot" data-c="${col}" aria-hidden="true"></i>`);
const COLORS = [["turquoise", "Turquoise", "lagon"], ["canari", "Jaune canari", "canari"], ["rose", "Rose", "rose"], ["orange", "Orange", "mandarine"], ["emeraude", "Vert émeraude", "emeraude"], ["chocolat", "Chocolat", "matonge"]];
const stageLook = () => `<article class="sp-stg" data-stg="9" data-kind="look"><p class="sp-kick">Étape 10 sur 11</p><h3 class="sp-h3">Choisissez votre look</h3><p class="sp-tip">Chaque choix recolore la silhouette en direct. Vos mesures restent associées au projet.</p>
<div class="sp-opts"><div class="sp-og-g" role="radiogroup" aria-label="Coupe"><p class="sp-og-t">Coupe</p>${opt("cut", "droite", "Droite")}${opt("cut", "cintree", "Cintrée")}${opt("cut", "croisee", "Croisée")}</div>
<div class="sp-og-g" role="radiogroup" aria-label="Tissu"><p class="sp-og-t">Tissu</p>${opt("fab", "laine", "Laine froide")}${opt("fab", "lin", "Lin lourd")}${opt("fab", "soie", "Soie et laine")}${opt("fab", "velours", "Velours côtelé")}</div>
<div class="sp-og-g" role="radiogroup" aria-label="Couleur"><p class="sp-og-t">Couleur</p>${COLORS.map(([v, n, c]) => sw("col", v, n, c)).join("")}</div>
<div class="sp-og-g" role="radiogroup" aria-label="Doublure"><p class="sp-og-t">Doublure</p>${sw("lin", "or", "Satin doré", "or")}${sw("lin", "rose", "Soie rose", "rose")}${sw("lin", "turq", "Turquoise uni", "turq")}${sw("lin", "wax", "Wax orange", "wax")}</div>
<div class="sp-og-g" role="radiogroup" aria-label="Cravate"><p class="sp-og-t">Cravate</p>${opt("tie", "tie", "Cravate")}${opt("tie", "bow", "Nœud papillon")}</div>
<div class="sp-og-g" role="radiogroup" aria-label="Chapeau"><p class="sp-og-t">Chapeau</p>${opt("hat", "none", "Aucun")}${opt("hat", "fedora", "Feutre")}${opt("hat", "bowler", "Melon")}${opt("hat", "panama", "Panama")}</div>
<div class="sp-og-g" role="radiogroup" aria-label="Canne"><p class="sp-og-t">Canne</p>${opt("cane", "off", "Sans")}${opt("cane", "on", "Avec")}</div></div></article>`;
const fit = () => `<div class="sp-fit" data-fit>
<div class="sp-fit-vis"><div class="sp-vis sp-vis--m">${mannequin("cou")}</div><div class="sp-vis sp-vis--l">${gent({ look: "lagon", hat: "fedora", all: true, label: "Silhouette recolorée selon vos choix" })}</div><p class="sp-vis-cap" data-vcap aria-hidden="true">Point de mesure : tour de cou</p></div>
<div class="sp-fit-panel"><div class="sp-fit-top"><div class="sp-prog" aria-hidden="true"><span class="sp-prog-bar" data-bar></span></div><p class="sp-prog-t" data-prog>Étape 1 sur 11</p>
<div class="sp-units" role="radiogroup" aria-label="Unité de mesure"><a class="sp-un is-on" href="#cm" data-unit="cm" role="radio" aria-checked="true">cm</a><a class="sp-un" href="#in" data-unit="in" role="radio" aria-checked="false">in</a></div></div>
<ol class="sp-dots" data-dots aria-label="Aller à une étape">${Array.from({ length: 11 }, (_, i) => `<li><a href="#etape-${i + 1}" data-go="${i}" aria-label="Étape ${i + 1}"><i></i></a></li>`).join("")}</ol>
<div class="sp-stages">${MEAS.map(stageMeasure).join("")}
<article class="sp-stg" data-stg="8" data-kind="check"><p class="sp-kick">Étape 9 sur 11</p><h3 class="sp-h3">Vérification de cohérence</h3><p class="sp-tip">Le tailleur recoupe vos mesures : certains rapports entre elles sont presque toujours les mêmes. Un avertissement n'est pas une erreur, c'est une invitation à remesurer.</p><ul class="sp-checks" data-checks></ul></article>
${stageLook()}
<article class="sp-stg" data-stg="10" data-kind="recap"><p class="sp-kick">Étape 11 sur 11</p><h3 class="sp-h3">Récapitulatif de votre projet</h3><p class="sp-look-name" data-lname>Veste cintrée, turquoise</p><dl class="sp-recap" data-recap></dl><p class="sp-sum" data-sum></p>
<div class="sp-acts"><a class="sp-btn sp-btn--gold" href="/contact" data-send>Envoyer ce projet à l'atelier ${arrow}</a><a class="sp-btn sp-btn--ghost" href="#copier" data-copy>Copier le récapitulatif</a></div><p class="sp-fine">Aucun rendez-vous ni aucune commande n'est enregistré ici : le récapitulatif est transmis par le formulaire de contact. Mesures et prix de démonstration.</p></article></div>
<p class="sp-sr" role="status" aria-live="polite" data-live></p>
<div class="sp-fit-nav"><a class="sp-btn sp-btn--ghost" href="#precedent" data-prev>Étape précédente</a><a class="sp-btn sp-btn--gold" href="#suivant" data-next>Étape suivante ${arrow}</a></div></div></div>`;

// ---------- Coupes et tissus ----------
const CUTS = [
  { k: "droite", n: "La droite", p: "Épaules naturelles, taille douce, deux boutons. Le classique de la maison : elle va à tout le monde et vieillit bien.", e: "Naturelles", t: "Légèrement marquée", l: "Mi-fesses", b: "Un rang, 2 boutons" },
  { k: "cintree", n: "La cintrée", p: "Épaules fines, taille dessinée par deux pinces, manche étroite. Elle affine la silhouette et demande des mesures très précises.", e: "Fines", t: "Marquée", l: "Courte", b: "Un rang, 2 boutons" },
  { k: "croisee", n: "La croisée", p: "Double rang de boutons, revers larges, longueur généreuse. La coupe des ambianceurs : elle impose le pas et le port de tête.", e: "Structurées", t: "Ajustée", l: "Longue", b: "Deux rangs, 6 boutons" },
];
const FABS = [
  { n: "Laine froide 120", c: "sp-fab-laine", s: "toute", d: "Un tombé net, qui garde son pli. Le choix des grandes cérémonies." },
  { n: "Lin lourd", c: "sp-fab-lin", s: "chaud", d: "Frais en saison chaude, il se froisse avec noblesse." },
  { n: "Soie et laine", c: "sp-fab-soie", s: "toute", d: "Un éclat discret qui capte la lumière du défilé." },
  { n: "Velours côtelé", c: "sp-fab-velours", s: "frais", d: "Épais, chaud, profond. Pour les costumes de soirée." },
  { n: "Coton imprimé wax", c: "sp-fab-wax", s: "chaud", d: "Réservé aux doublures, aux pochettes et aux revers cachés." },
  { n: "Flanelle à rayures", c: "sp-fab-rayure", s: "frais", d: "Une rayure tennis, très fine, qui allonge la silhouette." },
];

const cutBlock = () => `<div class="sp-cuts" data-cuts><div class="sp-cut-tabs" role="tablist" aria-label="Choisir une coupe">${CUTS.map((c, i) => `<a class="sp-chip${i === 0 ? " is-on" : ""}" href="#coupe-${c.k}" role="tab" aria-selected="${i === 0}" data-cut="${c.k}">${esc(c.n)}</a>`).join("")}</div>
<div class="sp-cut-grid"><div class="sp-cut-fig sp-cut-droite" data-cutfig>${gent({ look: "lagon", hat: "fedora", all: true, label: "Silhouette de la coupe choisie" })}</div>
<div class="sp-cut-txt">${CUTS.map((c, i) => `<div class="sp-cut-p${i === 0 ? " is-on" : ""}" data-cutp="${c.k}"><h3 class="sp-h3">${esc(c.n)}</h3><p>${esc(c.p)}</p></div>`).join("")}</div></div></div>`;

// ---------- Pages ----------
const home = (c) => [
  sec(header(c)),
  sec(`<section class="sp-hero sp-hero--a pk-bleed"><div class="sp-hero-bg" aria-hidden="true"><i class="sp-beam sp-beam--a"></i><i class="sp-beam sp-beam--b"></i><i class="sp-beam sp-beam--c"></i></div>
<div class="sp-wrap sp-hero-in"><p class="sp-kick sp-kick--g" data-reveal>Sapologie · couture sur mesure</p><div class="sp-mega" role="heading" aria-level="1" data-reveal>L'élégance <em>ose</em> la couleur.</div>
<p class="sp-lead sp-lead--w" data-reveal>Des costumes taillés à la main, du turquoise au rose, de l'émeraude au canari. Prenez vos mesures en ligne, composez votre look, puis venez le faire essayer à l'atelier.</p>
<div class="sp-acts" data-reveal><a class="sp-btn sp-btn--gold" href="/mesures">Prendre mes mesures ${arrow}</a><a class="sp-btn sp-btn--line" href="/lookbook">Feuilleter le lookbook</a></div></div></section>`),
  sec(`<section class="sp-hero sp-hero--b pk-bleed">${runway()}<a class="sp-pause" href="#pause" data-pause hidden>Suspendre le défilé</a></section>`),
  sec(`<section class="sp-sec sp-sec--brick pk-bleed"><div class="sp-wax sp-wax--top" aria-hidden="true"></div><div class="sp-wrap sp-manif"><div><p class="sp-kick sp-kick--g" data-reveal>Le manifeste</p><h2 class="sp-h2 sp-h2--w" data-reveal>La Sape n'est pas une mode.<br>C'est une façon de se tenir.</h2></div>
<ol class="sp-rules"><li data-reveal><b>I</b><div><h3>Trois couleurs, pas une de plus</h3><p>Le costume, la cravate, la pochette : chacune répond aux deux autres. Le reste se tait.</p></div></li><li data-reveal><b>II</b><div><h3>Les souliers d'abord</h3><p>On commence par les chaussures, on finit par le chapeau. Tout se joue dans l'équilibre.</p></div></li><li data-reveal><b>III</b><div><h3>L'élégance se marche</h3><p>Un costume bien coupé change la démarche. Vous le sentirez au premier pas.</p></div></li></ol></div></section>`),
  sec(`<section class="sp-sec pk-bleed"><div class="sp-wrap">${sechead("Le lookbook", "Trois pages<br>du livre de la saison", 'Six looks, six couleurs franches. Chaque page se déplie : recto pour la silhouette, verso pour les tissus et les accessoires.')}
<div class="sp-fold-grid">${[0, 3, 4].map((i, n) => `<a class="sp-fold sp-fold--${n}" href="/lookbook" data-reveal aria-label="Voir le look ${esc(LOOKS[i].n)} dans le lookbook"><div class="sp-fold-art sp-bgc-${LOOKS[i].id}">${lookSvgDeco(LOOKS[i], i)}<span class="sp-fold-corner" aria-hidden="true"></span></div><div class="sp-fold-t"><p class="sp-kick">Look ${num2(i + 1)}</p><h3 class="sp-h3">${esc(LOOKS[i].n)}</h3><p>${esc(LOOKS[i].tissu)} · coupe ${esc(LOOKS[i].coupe.toLowerCase())}</p></div></a>`).join("")}</div>
<p class="sp-center"><a class="sp-more" href="/lookbook" data-reveal>Tout le lookbook ${arrow}</a></p></div></section>`),
  sec(`<section class="sp-sec sp-sec--pat pk-bleed"><div class="sp-wrap sp-teaser"><div class="sp-teaser-txt"><p class="sp-kick" data-reveal>L'atelier en ligne</p><h2 class="sp-h2" data-reveal>Huit mesures,<br>un costume qui vous va.</h2>
<p class="sp-lead" data-reveal>Notre guide vous accompagne pas à pas : le schéma du corps s'illumine à chaque étape, les conseils sont écrits comme dans l'atelier, et une vérification repère les mesures qui ne s'accordent pas.</p>
<ul class="sp-ticks">${MEAS.map((m) => `<li data-reveal>${esc(m.n)}</li>`).join("")}</ul><a class="sp-btn sp-btn--brick" href="/mesures" data-reveal>Commencer la prise de mesures ${arrow}</a></div>
<div class="sp-teaser-art" data-reveal data-cycle>${mannequin("poitrine", "sp-man--teaser")}</div></div></section>`),
  sec(`<section class="sp-sec sp-sec--blue pk-bleed"><div class="sp-wrap"><ul class="sp-stats"><li data-reveal><b data-count="60">60</b><span>heures de travail à la main par costume</span></li><li data-reveal><b data-count="8">8</b><span>mesures relevées avec vous</span></li><li data-reveal><b data-count="3">3</b><span>essayages avant la livraison</span></li><li data-reveal><b data-count="6">6</b><span>couleurs franches à la saison</span></li></ul><p class="sp-fine">Chiffres de démonstration.</p></div></section>`),
  sec(`<section class="sp-sec pk-bleed"><div class="sp-wrap">${sechead("Tissus et coupes", "Le tissu fait le tombé,<br>la coupe fait la silhouette", "")}
<div class="sp-swatches">${FABS.slice(0, 4).map((f) => `<article class="sp-swatch" data-reveal><div class="sp-sw-art ${f.c}" aria-hidden="true"></div><h3 class="sp-h3">${esc(f.n)}</h3><p>${esc(f.d)}</p></article>`).join("")}</div>
<p class="sp-center"><a class="sp-more" href="/tissus" data-reveal>Toutes les coupes et les tissus ${arrow}</a></p></div></section>`),
  sec(`<section class="sp-sec sp-sec--brick pk-bleed"><div class="sp-wrap sp-cta"><div><p class="sp-kick sp-kick--g" data-reveal>Venez à l'atelier</p><h2 class="sp-h2 sp-h2--w" data-reveal>Un costume,<br>une présence.</h2></div><div><p class="sp-lead sp-lead--w" data-reveal>Écrivez-nous avec le récapitulatif de votre projet : nous vous répondons pour proposer un premier essayage.</p><a class="sp-btn sp-btn--gold" href="/contact" data-reveal>Écrire à l'atelier ${arrow}</a></div></div></section>`),
  sec(footer(c)),
];

const lookbook = (c) => [
  sec(header(c)),
  pagehead("Saison démonstration", "Le lookbook", "Six looks à feuilleter. Utilisez les flèches du livre ou le sommaire : chaque page se déplie."),
  sec(bookA()),
  sec(bookB()),
  sec(`<section class="sp-sec pk-bleed"><div class="sp-wrap">${sechead("La penderie", "Cinq accessoires,<br>un ensemble", "Dessinés pour le défilé : chacun a son rôle. Aucun n'est là pour décorer.")}
<div class="sp-accs">${ACC.map((a, i) => `<article class="sp-acc sp-acc--${i}" data-reveal><div class="sp-acc-art">${a.svg}</div><h3 class="sp-h3">${esc(a.n)}</h3><p>${esc(a.t)}</p></article>`).join("")}</div></div></section>`),
  sec(`<section class="sp-sec sp-sec--brick pk-bleed"><div class="sp-wax sp-wax--top" aria-hidden="true"></div><div class="sp-wrap sp-three"><div><p class="sp-kick sp-kick--g" data-reveal>La règle des trois couleurs</p><h2 class="sp-h2 sp-h2--w" data-reveal>Costume, cravate, pochette</h2><p class="sp-lead sp-lead--w" data-reveal>Choisissez un costume franc, puis deux couleurs qui lui répondent sans l'imiter. Au-delà, le regard se perd.</p><a class="sp-btn sp-btn--gold" href="/mesures" data-reveal>Composer mon look ${arrow}</a></div>
<ul class="sp-trios">${LOOKS.slice(0, 4).map((l) => `<li class="sp-trio sp-l-${l.id}" data-reveal><i class="sp-t-su"></i><i class="sp-t-ti"></i><i class="sp-t-po"></i><span>${esc(l.n)}</span></li>`).join("")}</ul></div></section>`),
  sec(footer(c)),
];

const mesures = (c) => [
  sec(header(c)),
  pagehead("L'atelier en ligne", "Prendre ses mesures", "Huit mesures, un schéma qui s'illumine, une vérification de cohérence, puis le choix de votre look. Comptez dix minutes."),
  sec(`<section class="sp-sec sp-sec--blue pk-bleed"><div class="sp-wrap"><h2 class="sp-sr">Prise de mesures guidée</h2>${fit()}</div></section>`),
  sec(`<section class="sp-sec pk-bleed"><div class="sp-wrap">${sechead("Avant de commencer", "Ce qu'il faut savoir", "")}
<div class="sp-notes"><article class="sp-note" data-reveal><h3 class="sp-h3">Le matériel</h3><p>Un mètre de couturier souple (pas un mètre rigide de bricolage), un crayon, et si possible une seconde personne pour tenir le ruban.</p></article><article class="sp-note" data-reveal><h3 class="sp-h3">Les vêtements</h3><p>Mesurez-vous en sous-vêtements ou avec une chemise fine. Un pull épais fausse la poitrine et les épaules de plusieurs centimètres.</p></article><article class="sp-note" data-reveal><h3 class="sp-h3">Le premier essayage</h3><p>Ces mesures servent de point de départ. À l'atelier, nous les vérifions et ajustons directement sur la toile.</p></article></div>
<div class="sp-faq"><h2 class="sp-h2" data-reveal>Questions<br>fréquentes</h2><div><details data-reveal><summary>Pourquoi proposer des pouces ?</summary><p>Certains ateliers et certains tissus se commandent en pouces. Le sélecteur convertit à l'affichage ; les mesures sont conservées en centimètres (1 pouce = 2,54 cm).</p></details>
<details data-reveal><summary>Que signifie un avertissement de cohérence ?</summary><p>Il signale un rapport inhabituel entre deux mesures, par exemple une taille plus grande que la poitrine. Ce n'est pas bloquant : remesurez, ou gardez la valeur si elle est juste.</p></details>
<details data-reveal><summary>Mes mesures sont-elles enregistrées ?</summary><p>Non. Elles restent dans votre navigateur le temps de la visite. Elles ne sont transmises que si vous envoyez le récapitulatif par le formulaire de contact.</p></details>
<details data-reveal><summary>Puis-je commander ici ?</summary><p>Non : ce site est une démonstration. Le récapitulatif sert à préparer un échange avec l'atelier.</p></details></div></div></div></section>`),
  sec(footer(c)),
];

const tissus = (c) => [
  sec(header(c)),
  pagehead("Le choix de la matière", "Tissus et coupes", "Trois coupes, six tissus. Touchez une coupe pour voir la silhouette changer, filtrez les tissus selon la saison."),
  sec(`<section class="sp-sec pk-bleed"><div class="sp-wrap">${sechead("Les coupes", "Trois façons<br>de porter le costume", "")}${cutBlock()}</div></section>`),
  sec(`<section class="sp-sec sp-sec--blue pk-bleed"><div class="sp-wrap">${sechead("Comparatif", "Les coupes côte à côte", "")}
<table class="sp-table" data-reveal><caption class="sp-sr">Comparaison des trois coupes</caption><thead><tr><th scope="col">Coupe</th><th scope="col">Épaules</th><th scope="col">Taille</th><th scope="col">Longueur</th><th scope="col">Boutonnage</th></tr></thead><tbody>${CUTS.map((x) => `<tr><th scope="row" data-label="Coupe">${esc(x.n)}</th><td data-label="Épaules">${x.e}</td><td data-label="Taille">${x.t}</td><td data-label="Longueur">${x.l}</td><td data-label="Boutonnage">${x.b}</td></tr>`).join("")}</tbody></table></div></section>`),
  sec(`<section class="sp-sec pk-bleed" data-fabs><div class="sp-wrap">${sechead("Le nuancier", "Six tissus de la saison", "Filtrez selon la saison : les échantillons sont dentelés comme chez le drapier.")}
<div class="sp-chips" role="tablist" aria-label="Filtrer les tissus par saison"><a class="sp-chip is-on" href="#toutes" role="tab" aria-selected="true" data-flt="all">Tous</a><a class="sp-chip" href="#chaud" role="tab" aria-selected="false" data-flt="chaud">Saison chaude</a><a class="sp-chip" href="#frais" role="tab" aria-selected="false" data-flt="frais">Saison fraîche</a></div>
<p class="sp-count" aria-live="polite" data-fcount>6 tissus</p>
<div class="sp-swatches sp-swatches--6">${FABS.map((f) => `<article class="sp-swatch" data-season="${f.s}" data-reveal><div class="sp-sw-art ${f.c}" aria-hidden="true"></div><p class="sp-kick">${f.s === "toute" ? "Toute l'année" : f.s === "chaud" ? "Saison chaude" : "Saison fraîche"}</p><h3 class="sp-h3">${esc(f.n)}</h3><p>${esc(f.d)}</p></article>`).join("")}</div></div></section>`),
  sec(`<section class="sp-sec sp-sec--brick pk-bleed"><div class="sp-wrap sp-cta"><div><p class="sp-kick sp-kick--g">Passez à la pratique</p><h2 class="sp-h2 sp-h2--w">Mesures, coupe,<br>tissu : à vous.</h2></div><div><p class="sp-lead sp-lead--w">Dans l'atelier en ligne, ces choix recolorent la silhouette et forment le récapitulatif de votre projet.</p><a class="sp-btn sp-btn--gold" href="/mesures">Ouvrir l'atelier en ligne ${arrow}</a></div></div></section>`),
  sec(footer(c)),
];

const STEPS = [["patron", "Le patron", "Dessiné à vos mesures sur papier kraft, puis reporté à la craie sur la toile de coton."], ["craie", "Le tracé", "La craie de tailleur marque les lignes de coupe : une ligne trop haute et la veste ne se rattrape pas."], ["ciseaux", "La coupe", "Aux grands ciseaux, tissu à plat, une seule fois. On coupe rarement deux fois."], ["epingles", "L'assemblage", "Les pièces sont épinglées, faufilées, puis cousues à la main aux endroits qui comptent."], ["aiguille", "Les essayages", "Trois passages à l'atelier : toile, première forme, finitions. Chaque fois, on ajuste."], ["fer", "Le repassage", "La vapeur donne la forme aux revers et au col : c'est ce qui sépare un costume d'un vêtement."]];
const atelier = (c) => [
  sec(header(c)),
  pagehead("La maison", "L'atelier", "Un atelier de couture, une équipe de quatre mains, et une certitude : l'élégance se construit pièce par pièce."),
  sec(`<section class="sp-sec pk-bleed"><div class="sp-wrap sp-story"><div class="sp-story-txt"><p class="sp-kick" data-reveal>Notre histoire</p><h2 class="sp-h2" data-reveal>Née d'une envie<br>de se faire remarquer.</h2><p class="sp-lead" data-reveal>La Maison Kassa est un atelier imaginaire pour cette démonstration. Elle raconte ce qu'est un tailleur de la sape : un artisan qui coupe des costumes aux couleurs franches, et qui sait qu'on les porte avec le dos droit.</p><p data-reveal>La Sape, la « Société des Ambianceurs et des Personnes Élégantes », est née dans l'espace congolais. Elle a fait de l'élégance une affaire de choix, de couleurs et de tenue. Notre atelier rend hommage à ce goût du costume, sans prétendre l'incarner.</p></div>
<ol class="sp-time"><li data-reveal><b>Les débuts</b><span>Une table de coupe, un mannequin de bois, deux paires de ciseaux.</span></li><li data-reveal><b>Le premier défilé</b><span>Six silhouettes sur un podium de fortune, et une salle debout.</span></li><li data-reveal><b>La maison</b><span>Un atelier à lumière du nord, quatre mains, des tissus du monde entier.</span></li><li data-reveal><b>Aujourd'hui</b><span>Le même mètre ruban jaune, et un guide de mesure en ligne.</span></li></ol></div></section>`),
  sec(`<section class="sp-sec sp-sec--blue pk-bleed"><div class="sp-wrap">${sechead("Le savoir-faire", "Six gestes,<br>un costume", "Chaque costume passe par les mêmes mains et les mêmes étapes, du patron au dernier coup de fer.")}
<ol class="sp-patrons">${STEPS.map(([ic, t, p], i) => `<li class="sp-patron" data-reveal><span class="sp-patron-n">${num2(i + 1)}</span><div class="sp-patron-ic">${IC[ic]}</div><h3 class="sp-h3">${t}</h3><p>${p}</p></li>`).join("")}</ol></div></section>`),
  sec(`<section class="sp-sec sp-sec--brick pk-bleed"><div class="sp-wax sp-wax--top" aria-hidden="true"></div><div class="sp-wrap">${sechead('<span class="sp-g">Les mains de la maison</span>', "Trois métiers,<br>une même exigence", "Équipe fictive, créée pour cette démonstration.")}
<div class="sp-crew">${[["Amina", "Maître tailleur", "Trace et coupe. Elle reconnaît un lin à son bruit.", 0], ["Joël", "Chef d'atelier", "Assemble les épaules à la main, point après point.", 1], ["Nadège", "Finisseuse", "Boutonnières, doublures, pochettes : le dernier regard.", 2]].map(([n, r, p, i]) => `<article class="sp-person" data-reveal><div class="sp-person-art sp-bgc-${LOOKS[(i + 2) % 6].id}">${lookSvgDeco(LOOKS[(i + 2) % 6], i, { hat: "none", cane: false })}</div><h3 class="sp-h3">${n}</h3><p class="sp-kick sp-kick--g">${r}</p><p>${p}</p></article>`).join("")}</div></div></section>`),
  sec(`<section class="sp-sec pk-bleed"><div class="sp-wrap sp-cta sp-cta--l"><div><p class="sp-kick" data-reveal>Visite de l'atelier</p><h2 class="sp-h2" data-reveal>Venez voir<br>les mains travailler.</h2></div><div><p class="sp-lead" data-reveal>L'atelier reçoit sur rendez-vous du mardi au samedi. Écrivez-nous pour convenir d'une visite ou d'un premier essayage.</p><a class="sp-btn sp-btn--brick" href="/contact" data-reveal>Écrire à l'atelier ${arrow}</a></div></div></section>`),
  sec(footer(c)),
];

const contact = (c) => [
  sec(header(c)),
  pagehead("Un mot à l'atelier", "Écrivez-nous", "Une question, un projet, une visite ? Collez ici le récapitulatif de la prise de mesures : nous répondons sous deux jours ouvrés."),
  { type: "form", heading: "Envoyer un message", intro: "Si vous avez utilisé l'atelier en ligne, votre récapitulatif de mesures et de look est déjà dans le message." },
  sec(`<section class="sp-sec sp-sec--tight pk-bleed"><div class="sp-wrap sp-cards3"><article class="sp-note" data-reveal><h3 class="sp-h3">L'atelier</h3><address>14 avenue des Élégants<br>1000 (adresse fictive)</address><p>Sur rendez-vous, du mardi au samedi.</p></article><article class="sp-note" data-reveal><h3 class="sp-h3">Avant la visite</h3><p>Prenez vos mesures en ligne : l'essayage sera deux fois plus rapide.</p><a class="sp-more" href="/mesures">Prendre mes mesures ${arrow}</a></article><article class="sp-note" data-reveal><h3 class="sp-h3">Les looks de la saison</h3><p>Repérez le look qui vous parle et citez-le dans votre message.</p><a class="sp-more" href="/lookbook">Voir le lookbook ${arrow}</a></article></div></section>`),
  sec(footer(c)),
];

const recherche = (c) => [sec(header(c)), pagehead("Rechercher", "Une pièce, un tissu ?", "Un look, une coupe, un tissu, un conseil de mesure : cherchez sur tout le site."), { type: "layout", children: [{ type: "search", props: { placeholder: "Velours, croisée, tour de cou…" } }] }, sec(footer(c))];

const introuvable = (c) => [sec(header(c)), sec(`<section class="sp-404 pk-bleed"><div class="sp-wrap sp-404-in"><div><p class="sp-kick sp-kick--g">Pièce introuvable</p><div class="sp-mega sp-mega--404" role="heading" aria-level="1">404</div><p class="sp-lead sp-lead--w">Ce cintre est vide : la page n'existe pas ou a changé d'adresse.</p><div class="sp-acts"><a class="sp-btn sp-btn--gold" href="/">Retour à l'accueil ${arrow}</a><a class="sp-btn sp-btn--line" href="/lookbook">Voir le lookbook</a></div></div><div class="sp-404-art" aria-hidden="true">${mannequin("", "sp-man--404")}</div></div></section>`), sec(footer(c))];

module.exports = {
  key: "sape", name: "Sape", version: "2.0.0", category: "mode", tags: ["luxe", "audacieux", "classique"], siteType: "Sapologie et couture sur mesure", featured: true,
  concept: "Un atelier de couture à l'élégance flamboyante : un défilé de gentlemen en costumes de couleurs franches, une navigation en étiquette cousue et une prise de mesures guidée qui débouche sur le choix du look.",
  description: "Atelier de sapologie sur ivoire bleuté et brique-chocolat à filets d'or : défilé de silhouettes sur podium, étiquette de vêtement, lookbook en pages dépliantes, prise de mesures guidée en 11 étapes et choix du look qui recolore le costume.",
  brand: "Maison Kassa", modules: ["formulaires", "recherche"],
  dna: {
    header: "etiquette-de-vetement-cousue-au-fil-et-etiquette-suspendue-sur-mobile",
    hero: "defile-de-silhouettes-en-costume-sur-podium-qui-glissent-de-gauche-a-droite-avec-nom-du-look",
    grid: "lookbook-en-pages-de-livre-depliantes-recto-verso",
    shapes: "silhouettes-de-gentlemen-pointilles-de-fil-metre-ruban-et-echantillons-dentele",
    motion: "defile-en-translation-pas-de-mannequin-et-pages-qui-se-deplient",
    rhythm: "alterne-ivoire-bleute-et-bandes-brique-chocolat-par-fiches-de-patron-numerotees",
    signature: "prise-de-mesures-guidee-schema-du-corps-qui-s-illumine-puis-choix-de-look-recolorant-la-silhouette",
  },
  tokens: {
    colors: { primary: "#4a1c14", secondary: "#0e9a96", accent: "#c9a24a", background: "#eef3f6", surface: "#fbfcfd", text: "#241310", muted: "#5b4a45", success: "#1c7a3a", warning: "#8a5a00", error: "#b3261e" },
    fonts: { heading: "font.yeseva-one", body: "font.jost", button: "font.jost", link: "font.jost" },
    radius: { sm: 4, md: 6, lg: 10, button: 3, field: 4, card: 6 }, shadow: { card: "0 10px 26px rgba(36,19,16,.14)", button: "0 3px 0 rgba(36,19,16,.35)" }, border: { width: 1, color: "#c9a24a" },
    type: { h1: { size: 76, weight: 400, lineHeight: 1.04, transform: "none" }, h2: { size: 44, weight: 400, lineHeight: 1.1, transform: "none" } },
  },
  options: [
    { key: "gold", label: "Or de la maison", type: "color", default: "#c9a24a" },
    { key: "mood", label: "Ambiance des pages", type: "choice", default: "ivoire", choices: [["ivoire", "Ivoire bleuté"], ["brique", "Brique-chocolat"]] },
    { key: "tape", label: "Mètre ruban en haut de page", type: "choice", default: "on", choices: [["on", "Affiché"], ["off", "Masqué"]] },
    { key: "wax", label: "Motifs wax en bordure", type: "choice", default: "on", choices: [["on", "Discrets"], ["off", "Aucun"]] },
    { key: "pace", label: "Allure du défilé", type: "choice", default: "lent", choices: [["lent", "Lente"], ["vif", "Vive"]] },
  ],
  menu: [["Accueil", "/"], ["Lookbook", "/lookbook"], ["Mesures", "/mesures"], ["Tissus et coupes", "/tissus"], ["L'atelier", "/atelier"], ["Contact", "/contact"]],
  pages: [
    { key: "accueil", name: "Accueil", render: home }, { key: "lookbook", name: "Lookbook", render: lookbook }, { key: "mesures", name: "Prise de mesures", render: mesures },
    { key: "tissus", name: "Tissus et coupes", render: tissus }, { key: "atelier", name: "L'atelier", render: atelier }, { key: "contact", name: "Contact", render: contact },
    { key: "recherche", name: "Recherche", render: recherche }, { key: "introuvable", name: "Page introuvable", render: introuvable },
  ],
};
