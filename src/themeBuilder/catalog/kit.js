// Kit de construction du catalogue de modèles du Theme Builder. Un modèle = une MISE EN PAGE (structure d'éléments) × une IDENTITÉ VISUELLE (« skin » : couleurs du site, typographie, arrondis,
// bordures, relief, densité). Tout est fait d'éléments natifs du Page Builder (grammaire fermée de nodes.js) : le catalogue ne contient ni HTML libre, ni CSS libre, ni image factice.
// Les couleurs sont des JETONS du site (token:primary…) : un modèle prend la charte du site qui l'utilise. Seul le skin « Nuit » pose des teintes propres.
const crypto = require("crypto");
const id = () => crypto.randomBytes(6).toString("hex");

// Identités visuelles. Chacune change la structure du rendu (bordures, relief, casse, arrondis, densité), pas seulement les couleurs.
const SKINS = [
  { key: "clair", label: "Clair épuré", bg: "token:background", fg: "token:text", mute: "token:muted", alt: "token:surface", accent: "token:primary", onAccent: "token:on-primary", line: "token:surface",
    radius: "10px", btnRadius: "8px", shadow: "none", font: "body", head: "heading", weight: "700", caps: "none", track: "0px", bw: "1px", pad: "16px", gap: "24px", btn: "solid", rule: "single" },
  { key: "marque", label: "Couleur de marque", bg: "token:primary", fg: "token:on-primary", mute: "token:on-primary", alt: "#ffffff22", accent: "token:accent", onAccent: "token:on-accent", line: "#ffffff55",
    radius: "14px", btnRadius: "999px", shadow: "md", font: "body", head: "heading", weight: "800", caps: "none", track: "0px", bw: "0px", pad: "18px", gap: "28px", btn: "solid", rule: "none" },
  { key: "nuit", label: "Nuit", bg: "#0b1220", fg: "#f1f5f9", mute: "#94a3b8", alt: "#131c2e", accent: "token:accent", onAccent: "token:on-accent", line: "#24304a",
    radius: "12px", btnRadius: "10px", shadow: "lg", font: "body", head: "heading", weight: "700", caps: "none", track: "0px", bw: "1px", pad: "16px", gap: "24px", btn: "outline", rule: "single" },
  { key: "editorial", label: "Éditorial", bg: "token:background", fg: "token:text", mute: "token:muted", alt: "token:surface", accent: "token:text", onAccent: "token:background", line: "token:text",
    radius: "0px", btnRadius: "0px", shadow: "none", font: "serif", head: "serif", weight: "700", caps: "uppercase", track: "1.5px", bw: "2px", pad: "20px", gap: "32px", btn: "solid", rule: "double" },
  { key: "doux", label: "Doux et arrondi", bg: "token:surface", fg: "token:text", mute: "token:muted", alt: "token:background", accent: "token:primary", onAccent: "token:on-primary", line: "token:background",
    radius: "28px", btnRadius: "999px", shadow: "md", font: "body", head: "heading", weight: "600", caps: "none", track: "0px", bw: "0px", pad: "24px", gap: "20px", btn: "solid", rule: "none" },
];
const skinOf = (key) => SKINS.find((s) => s.key === key);

const sty = (desktop, tablet, mobile) => ({ styles: { desktop, ...(tablet ? { tablet } : {}), ...(mobile ? { mobile } : {}) } });
const compact = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined && v !== null && v !== ""));

// Construit les éléments d'un skin : k.H(...), k.T(...), k.B(...), k.row(...), k.card(...)…
function kit(S) {
  const text = (extra = {}) => ({ color: S.fg, fontFamily: S.font, ...extra });
  const k = {
    S,
    // conteneur flex en ligne, retour à la ligne au besoin
    row: (children, st = {}, t, m) => ({ type: "group", children, ...sty(compact({ display: "flex", flexDirection: "row", alignItems: "center", gap: "16px", flexWrap: "wrap", ...st }), t, m) }),
    col: (children, st = {}, t, m) => ({ type: "stack", children, ...sty(compact({ display: "flex", flexDirection: "column", gap: "12px", ...st }), t, m) }),
    // bande pleine largeur du skin (fond, bordure basse selon la règle du skin) : le contenu reste dans la colonne du site
    band: (children, st = {}, t, m, name) => ({ type: "container", ...(name ? { name } : {}), props: { full: true }, children,
      ...sty(compact({ backgroundColor: S.bg, color: S.fg, paddingTop: S.pad, paddingBottom: S.pad, paddingLeft: "24px", paddingRight: "24px", display: "flex", flexDirection: "column", alignItems: "stretch", gap: "12px", borderStyle: S.bw !== "0px" ? "solid" : undefined, borderWidth: "0px", borderBottomWidth: S.rule === "none" ? undefined : S.rule === "double" ? "4px" : S.bw, borderColor: S.line, boxShadow: S.shadow === "none" ? undefined : S.shadow, ...st }), t, m) }),
    // zone de contenu centrée
    inner: (children, st = {}, t, m) => ({ type: "container", children, ...sty(compact({ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: S.gap, flexWrap: "wrap", maxWidth: "1180px", width: "100%", marginLeft: "auto", marginRight: "auto", ...st }), t, m) }),
    H: (txt, level = "2", st = {}, t, m) => ({ type: "heading", props: { text: txt, level: String(level) }, ...sty(compact({ color: S.fg, fontFamily: S.head, fontWeight: S.weight, textTransform: level === "1" || level === "2" ? undefined : undefined, ...st }), t, m) }),
    // petit libellé de rubrique (casse et espacement du skin)
    L: (txt, st = {}) => ({ type: "heading", props: { text: txt, level: "3", tag: "p" }, ...sty(compact({ color: S.mute, fontFamily: S.font, fontSize: "13px", fontWeight: "600", textTransform: S.caps === "none" ? undefined : S.caps, letterSpacing: S.caps === "none" ? "0.4px" : S.track, ...st })) }),
    T: (html, st = {}, t, m) => ({ type: "text", props: { html }, ...sty(text(compact({ lineHeight: 1.6, ...st })), t, m) }),
    B: (label, url = "/", variant, st = {}, t, m) => {
      const solid = (variant || S.btn) === "solid";
      return { type: "button", props: { label, url, variant: solid ? "primary" : "outline" }, ...sty(compact({ backgroundColor: solid ? S.accent : "transparent", color: solid ? S.onAccent : S.accent, borderStyle: "solid", borderWidth: solid ? "0px" : "1.5px", borderColor: S.accent, borderRadius: S.btnRadius, fontWeight: "600", textTransform: S.caps === "none" ? undefined : S.caps, letterSpacing: S.caps === "none" ? undefined : S.track, ...st }), t, m) };
    },
    LINK: (label, url = "/", st = {}) => ({ type: "link", props: { label, url }, ...sty(compact({ color: S.fg, fontWeight: "600", textTransform: S.caps === "none" ? undefined : S.caps, letterSpacing: S.caps === "none" ? undefined : S.track, ...st })) }),
    logo: (h = 44) => ({ type: "sitelogo", props: { height: h, link: true } }),
    siteTitle: (st = {}) => ({ type: "sitetitle", props: { tag: "p", link: true }, ...sty(compact({ color: S.fg, fontFamily: S.head, fontWeight: S.weight, fontSize: "22px", textTransform: S.caps === "none" ? undefined : S.caps, letterSpacing: S.caps === "none" ? undefined : S.track, ...st })) }),
    // navigation du CMS (menu affecté à l'emplacement) : jamais de lien factice
    menu: (location = "header", st = {}, vertical = false) => ({ type: "menu", props: { label: location === "footer" ? "Navigation du pied de page" : "Navigation principale", source: "location", location, items: [], vertical, mobileToggle: !vertical }, ...sty(compact({ color: S.fg, fontWeight: "600", textTransform: S.caps === "none" ? undefined : S.caps, letterSpacing: S.caps === "none" ? undefined : S.track, fontSize: "15px", ...st })) }),
    search: (target = "blog", st = {}) => ({ type: "search", props: { target, placeholder: "Rechercher…", button: "Rechercher" }, ...sty(compact({ borderRadius: S.btnRadius, ...st })) }),
    account: (st = {}) => ({ type: "account", props: { login: "Se connecter", account: "Mon compte", showCart: true, cart: "Panier" }, ...sty(compact({ color: S.fg, ...st })) }),
    social: (items, st = {}) => ({ type: "social", props: { items, size: "32", shape: S.radius === "0px" ? "square" : "circle", label: "Nos réseaux" }, ...sty(compact(st)) }),
    divider: (st = {}) => ({ type: "divider", props: { line: true, size: "md" }, ...sty(compact({ borderColor: S.line, ...st })) }),
    spacer: (size = "16") => ({ type: "spacer", props: { size } }),
    dyn: (src, st = {}, tag = "p") => ({ type: "text", props: { html: `<p>{{${src}}}</p>` }, ...sty(text(compact(st))) }),
    // carte (surface du skin : fond, arrondi, bordure et relief propres)
    card: (children, st = {}, t, m) => ({ type: "stack", children, ...sty(compact({ display: "flex", flexDirection: "column", gap: "12px", backgroundColor: S.alt, color: S.fg, borderRadius: S.radius, paddingTop: S.pad, paddingBottom: S.pad, paddingLeft: S.pad, paddingRight: S.pad, boxShadow: S.shadow === "none" ? undefined : S.shadow, borderStyle: S.bw === "0px" ? undefined : "solid", borderWidth: S.bw === "0px" ? undefined : S.bw, borderColor: S.line, ...st }), t, m) }),
    grid: (n, children, st = {}) => ({ type: "grid", children, ...sty(compact({ columns: n, gap: S.gap, ...st }), { columns: Math.min(n, 2) }, { columns: 1 }) }),
    // widget natif du Page Builder (postcontent, postmeta, archiveinfo, shopbuy, shopgrid…) : { type, props } + styles
    W: (type, props = {}, st = {}, t, m) => ({ type, props, ...sty(compact(st), t, m) }),
    // image dont l'adresse est une étiquette dynamique ({{post.image}}, {{product.image}}) : revalidée à l'affichage, jamais d'image factice
    img: (token, st = {}, t, m) => ({ type: "image", props: { src: `{{${token}}}`, alt: "", decorative: true }, ...sty(compact({ width: "100%", objectFit: "cover", borderRadius: S.radius, ...st }), t, m) }),
    // boucle : la grille répète son PREMIER enfant (le modèle de carte) pour chaque résultat réel ; loop = { source: "posts" | "products" | "courses", count, paginate… }
    loop: (cols, itemChildren, loop = {}, st = {}, cardSt = {}) => ({ type: "grid", props: { loop: { source: "posts", count: 6, ...loop } },
      children: [{ type: "stack", children: itemChildren, ...sty(compact({ display: "flex", flexDirection: "column", gap: "10px", backgroundColor: S.alt, color: S.fg, borderRadius: S.radius, overflow: "hidden", paddingTop: "0px", boxShadow: S.shadow === "none" ? undefined : S.shadow, borderStyle: S.bw === "0px" ? undefined : "solid", borderWidth: S.bw === "0px" ? undefined : S.bw, borderColor: S.line, ...cardSt })) }],
      ...sty(compact({ columns: cols, gap: S.gap, ...st }), { columns: Math.min(cols, 2) }, { columns: 1 }) }),
    // section de page : bande pleine largeur au fond du skin (le texte reste lisible sur la page), contenu centré dans une colonne
    // pleine largeur par défaut : une seule bande dont le contenu est centré sur la largeur de contenu du site (band) ; colonne plus étroite demandée (maxWidth) : bande + colonne
    section: (children, st = {}, t, m) => {
      const { maxWidth, marginLeft: _ml, marginRight: _mr, width: _w, ...rest } = st;
      const base = { display: "flex", flexDirection: "column", gap: S.gap, paddingTop: "56px", paddingBottom: "56px", color: S.fg };
      if (!maxWidth || maxWidth === "1180px") return { type: "container", props: { band: true }, children, ...sty(compact({ ...base, backgroundColor: S.bg, paddingLeft: "24px", paddingRight: "24px", ...rest }), t, m) };
      return { type: "container", props: { full: true }, children: [{ type: "container", children, ...sty(compact({ ...base, maxWidth, width: "100%", marginLeft: "auto", marginRight: "auto", ...rest }), t, m) }], ...sty({ backgroundColor: S.bg, color: S.fg, paddingLeft: "24px", paddingRight: "24px" }) };
    },  };
  return k;
}
// Section (document) d'un composant ou d'une page : une section libre
const layout = (children) => ({ type: "layout", children });

// Donne des identifiants uniques aux éléments (les modèles du catalogue n'en portent pas : ils sont posés à l'utilisation)
function withIds(nodes) {
  const walk = (n) => { const o = { id: n.id || id(), ...n }; if (n.children) o.children = n.children.map(walk); return o; };
  return nodes.map(walk);
}
module.exports = { SKINS, skinOf, kit, layout, withIds, sty, compact };
