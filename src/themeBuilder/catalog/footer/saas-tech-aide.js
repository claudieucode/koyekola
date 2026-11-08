// Aides locales de la famille « saas-tech » (le kit n'a pas ces éléments) : statut du service, langues d'exemple, pastilles de conformité, ligne de commande.
const E = "https://exemple.fr";

// Lien de statut (lien d'exemple) précédé d'un point
const statut = (texte) => (k) => k.LINK(`● ${texte}`, `${E}/statut`, { fontSize: "13px", fontWeight: "600" });
// Sélecteur de langue : le moteur n'en propose pas, ce sont des liens de langues d'exemple
const langues = () => fil("Langue :");
const fil = (titre) => (k) => k.row([
  k.T(`<p>${titre}</p>`, { color: k.S.mute, fontSize: "13px", fontFamily: k.S.font }),
  k.LINK("Français", `${E}/fr`, { fontSize: "13px", fontWeight: "600" }),
  k.LINK("English", `${E}/en`, { fontSize: "13px", fontWeight: "600" }),
  k.LINK("Deutsch", `${E}/de`, { fontSize: "13px", fontWeight: "600" }),
], { gap: "14px", alignItems: "center" });
// Pastille de conformité (texte seul, contour)
const pastille = (texte) => (k) => k.T(`<p><strong>${texte}</strong></p>`, {
  fontSize: "12px", fontFamily: k.S.font, color: k.S.fg, borderStyle: "solid", borderWidth: "1px", borderColor: k.S.fg, borderRadius: "999px",
  paddingTop: "4px", paddingBottom: "4px", paddingLeft: "12px", paddingRight: "12px",
});
// Ligne de commande d'exemple
const code = (ligne) => (k) => k.T(`<p>$ ${ligne}</p>`, {
  fontSize: "13px", fontFamily: "font.jetbrains-mono", color: k.S.fg, backgroundColor: k.S.alt, borderRadius: "8px", borderStyle: "solid", borderWidth: "1px", borderColor: k.S.line,
  paddingTop: "10px", paddingBottom: "10px", paddingLeft: "14px", paddingRight: "14px", width: "100%",
});

// Navigation horizontale de liens d'exemple (pas de menu déroulant : les petits boutons de sous-menu du widget de menu restent sous 44 px sur mobile)
const navh = (...paires) => (k) => k.row(paires.map((p) => { const [l, u] = p.split(">"); return k.LINK(l, u, { fontSize: "14px", fontWeight: "500" }); }), { gap: "22px" });

module.exports = { navh, statut, langues, pastille, code, fil };
