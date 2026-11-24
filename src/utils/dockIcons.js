// Icônes illustrées de la barre de navigation principale (rail « Mon espace » / dock) : tuiles à plat 40 × 40, glyphe blanc, une touche d'or.
// Direction : même langage que les illustrations de l'administration (aplats, formes géométriques, une seule étincelle chaude), teintes issues de la
// palette des espaces (charte §2 bis) — pas d'arc-en-ciel : la couleur indique la FAMILLE de la rubrique.
//   marine   contenu et structure        lagon   communication       baie  croissance (Marketing)
//   émeraude données, SEO et gestion      violet  apparence           ardoise réglages et compte
// SVG en ligne (aucune requête réseau, net en Retina, taille fixe donc aucun décalage de mise en page). Couleurs : classes .dk-* de public/css/app-rail.css.
// Usage (EJS) : <%- dockIcon("marketing") %>. Clé inconnue → chaîne vide (la vue retombe sur l'icône monochrome habituelle).

const TONES = { marine: "marine", lagon: "lagon", baie: "baie", emeraude: "emeraude", violet: "violet", ardoise: "ardoise" };

// Glyphes dessinés dans la tuile 40 × 40 (w = blanc, s = blanc adouci, g = or, t = couleur de la tuile pour les évidements)
const GLYPHS = {
  overview: ["marine", '<rect class="dk-w" x="8.5" y="8.5" width="23" height="6.5" rx="2"/><rect class="dk-w" x="8.5" y="18" width="10.5" height="13.5" rx="2"/><rect class="dk-s" x="22" y="18" width="9.5" height="5.5" rx="2"/><rect class="dk-g" x="22" y="26" width="9.5" height="5.5" rx="2"/>'],
  courses: ["marine", '<path class="dk-w" d="M20 13.2c-3.6-2.2-7.8-2.4-11-1.4v18c3.2-1 7.4-.8 11 1.4 3.6-2.2 7.8-2.4 11-1.4v-18c-3.2-1-7.4-.8-11 1.4z"/><path class="dk-st" d="M20 14v17"/><path class="dk-g" d="M25 8.5h4.5v10l-2.25-2-2.25 2z"/>'],
  chapters: ["marine", '<circle class="dk-g" cx="11" cy="12.5" r="2.3"/><rect class="dk-w" x="16" y="11.2" width="15" height="2.6" rx="1.3"/><circle class="dk-w" cx="11" cy="20" r="2.3"/><rect class="dk-s" x="16" y="18.7" width="15" height="2.6" rx="1.3"/><circle class="dk-w" cx="11" cy="27.5" r="2.3"/><rect class="dk-s" x="16" y="26.2" width="11" height="2.6" rx="1.3"/>'],
  categories: ["marine", '<path class="dk-w" d="M9 10.5A1.5 1.5 0 0 1 10.5 9h9.4c.4 0 .8.2 1.1.4l9.5 9.5a2 2 0 0 1 0 2.8l-8.6 8.6a2 2 0 0 1-2.8 0L9.4 20.8c-.3-.3-.4-.7-.4-1.1z"/><circle class="dk-g" cx="15" cy="15" r="2.4"/>'],
  messages: ["lagon", '<rect class="dk-w" x="8" y="11.5" width="24" height="17" rx="3.2"/><path class="dk-st" d="M9.6 14.2 20 22l10.4-7.8" fill="none"/>'],
  blog: ["lagon", '<rect class="dk-w" x="10.5" y="8" width="16.5" height="24" rx="3"/><rect class="dk-t" x="14" y="13" width="9.5" height="2.2" rx="1.1"/><rect class="dk-t" x="14" y="18" width="9.5" height="2.2" rx="1.1"/><rect class="dk-t" x="14" y="23" width="6" height="2.2" rx="1.1"/><path class="dk-g" d="m27.5 19.5 4-4a1.6 1.6 0 0 1 2.3 0l.7.7a1.6 1.6 0 0 1 0 2.3l-4 4-4.2 1.4z"/>'],
  support: ["lagon", '<circle class="dk-sw" cx="20" cy="20" r="8.5" stroke-width="5.2"/><path class="dk-sg" d="m14 14 3.6 3.6M26 14l-3.6 3.6M14 26l3.6-3.6M26 26l-3.6-3.6" stroke-width="2.6"/><circle class="dk-t" cx="20" cy="20" r="3.4"/>'],
  marketing: ["baie", '<path class="dk-w" d="M9.5 19.6 30.8 9.4a.9.9 0 0 1 1.2 1.1L25.6 31a.9.9 0 0 1-1.6.3l-4.6-7.6z"/><path class="dk-st" d="m19.4 23.7 12-13.2" stroke-width="1.7" fill="none"/><path class="dk-sg" d="M8.5 27.5c3.4-.6 5.8-2 7.6-4.4" stroke-width="2" stroke-dasharray="1 4.2"/>'],
  seo: ["emeraude", '<circle class="dk-sw" cx="18" cy="18" r="8" stroke-width="3.2"/><path class="dk-sw" d="m24.2 24.2 6 6" stroke-width="3.8"/><rect class="dk-g" x="14.2" y="19.5" width="2.6" height="4" rx=".8"/><rect class="dk-w" x="17.2" y="16.3" width="2.6" height="7.2" rx=".8"/><rect class="dk-w" x="20.2" y="13.2" width="2.6" height="10.3" rx=".8"/>'],
  sourcing: ["baie", '<path class="dk-w" d="M20 8.6 30.4 13v13.6L20 31.4 9.6 26.6V13z"/><path class="dk-st" d="M9.9 13.2 20 17.8l10.1-4.6M20 17.8v13.3" fill="none"/><path class="dk-g" d="m27.4 6.4.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9z"/>'],
  gestion: ["emeraude", '<rect class="dk-s" x="9" y="22" width="5.6" height="9" rx="1.6"/><rect class="dk-w" x="17.2" y="16" width="5.6" height="15" rx="1.6"/><rect class="dk-g" x="25.4" y="9" width="5.6" height="22" rx="1.6"/>'],
  journal: ["emeraude", '<rect class="dk-w" x="10.5" y="10" width="19" height="22" rx="3"/><rect class="dk-g" x="15.5" y="7.5" width="9" height="5.4" rx="2"/><path class="dk-st" d="m14.3 19 1.9 1.9 3.2-3.5M14.3 26l1.9 1.9 3.2-3.5" stroke-width="2" fill="none"/><rect class="dk-t" x="22" y="18.6" width="4.4" height="2" rx="1"/><rect class="dk-t" x="22" y="25.6" width="4.4" height="2" rx="1"/>'],
  faq: ["marine", '<path class="dk-w" d="M10.5 11.2c0-1.5 1.2-2.7 2.7-2.7h13.6c1.5 0 2.7 1.2 2.7 2.7v11.4c0 1.5-1.2 2.7-2.7 2.7H19l-6 5v-5h-.8c-1.4 0-1.7-1.2-1.7-2.4z"/><path class="dk-st" d="M17.6 15.2a2.6 2.6 0 1 1 3.8 2.3c-.9.5-1.4 1-1.4 2" stroke-width="2.2" fill="none"/><circle class="dk-g" cx="20" cy="21.9" r="1.4"/>'],
  about: ["marine", '<circle class="dk-w" cx="20" cy="20" r="11.5"/><circle class="dk-g" cx="20" cy="14.6" r="1.9"/><rect class="dk-t" x="18.7" y="18.2" width="2.6" height="8.2" rx="1.3"/>'],
  appearance: ["violet", '<rect class="dk-w" x="8.5" y="11.8" width="23" height="2.6" rx="1.3"/><circle class="dk-g" cx="15" cy="13.1" r="3.4"/><rect class="dk-s" x="8.5" y="18.7" width="23" height="2.6" rx="1.3"/><circle class="dk-w" cx="25.5" cy="20" r="3.4"/><rect class="dk-w" x="8.5" y="25.6" width="23" height="2.6" rx="1.3"/><circle class="dk-s" cx="17" cy="26.9" r="3.4"/>'],
  settings: ["ardoise", '<g transform="translate(20 20)"><rect class="dk-w" x="-2.2" y="-11.5" width="4.4" height="23" rx="1.6"/><rect class="dk-w" x="-2.2" y="-11.5" width="4.4" height="23" rx="1.6" transform="rotate(45)"/><rect class="dk-w" x="-2.2" y="-11.5" width="4.4" height="23" rx="1.6" transform="rotate(90)"/><rect class="dk-w" x="-2.2" y="-11.5" width="4.4" height="23" rx="1.6" transform="rotate(135)"/><circle class="dk-w" r="8"/><circle class="dk-t" r="4.1"/><circle class="dk-g" r="1.9"/></g>'],
  site: ["lagon", '<circle class="dk-sw" cx="20" cy="20" r="10.5" stroke-width="2.4"/><ellipse class="dk-sw" cx="20" cy="20" rx="4.6" ry="10.5" stroke-width="2.2"/><path class="dk-sw" d="M9.8 20h20.4" stroke-width="2.2"/><circle class="dk-g" cx="27.4" cy="12.6" r="2.4"/>'],
  more: ["ardoise", '<circle class="dk-w" cx="12" cy="20" r="2.6"/><circle class="dk-w" cx="20" cy="20" r="2.6"/><circle class="dk-g" cx="28" cy="20" r="2.6"/>'],
  dockpos: ["ardoise", '<rect class="dk-sw" x="9" y="9.5" width="22" height="21" rx="3.2" stroke-width="2.4"/><rect class="dk-g" x="13.5" y="24.2" width="13" height="3.6" rx="1.8"/>'],
  logout: ["ardoise", '<path class="dk-sw" d="M17.5 10.5h-5a2.5 2.5 0 0 0-2.5 2.5v14a2.5 2.5 0 0 0 2.5 2.5h5" stroke-width="2.8"/><path class="dk-sg" d="M21.5 20h10M27.4 15.6 31.8 20l-4.4 4.4" stroke-width="2.8"/>'],
};

function dockIcon(key) {
  const def = GLYPHS[key];
  if (!def) return "";
  const tone = TONES[def[0]] || "marine";
  return `<svg class="dk dk--${tone}" viewBox="0 0 40 40" width="40" height="40" aria-hidden="true" focusable="false"><rect class="dk-tile" width="40" height="40" rx="10"/>${def[1]}</svg>`;
}

module.exports = { dockIcon, GLYPHS };
