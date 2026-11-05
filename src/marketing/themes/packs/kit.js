// Outils d'écriture des pages de démonstration d'un paquet de thème. Une section = un bloc « HTML sécurisé » du Page Builder (balises de structure, SVG en ligne, classes du thème,
// attributs data-*), donc modifiable dans l'éditeur existant ; les formulaires utilisent le vrai composant « formulaire » du moteur (jamais un faux formulaire).
const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
// Une bande pleine largeur : le CSS du thème décide de tout (classe pk-bleed = hors de la colonne de page)
const sec = (html) => ({ type: "layout", children: [{ type: "html", props: { html: String(html).trim() } }] });
// Plusieurs blocs HTML dans une même section (au-delà de 20 000 caractères par bloc)
const secs = (...htmls) => htmls.map(sec);
// Formulaire réel du moteur (champs, envoi et notifications gérés par le CMS) ; l'apparence vient du CSS du thème
const form = (props = {}) => ({ type: "layout", children: [{ type: "form", props }] });
const link = (label, url, cls = "") => `<a${cls ? ` class="${esc(cls)}"` : ""} href="${esc(url)}">${esc(label)}</a>`;
const nav = (menu, cls = "") => menu.map(({ label, url }) => link(label, url, cls)).join("");
module.exports = { esc, sec, secs, form, link, nav };
