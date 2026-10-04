// Petit set d'icônes "flat design" en SVG (inspiré des icônes ligne type Feather),
// sans dépendance externe ni police d'icônes. Utilisé partout à la place des emojis.

const ICONS = {
  search: { body: '<circle cx="11" cy="11" r="7"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>' },
  moreVertical: { body: '<circle cx="12" cy="5" r="1.6" fill="currentColor" stroke="none"></circle><circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none"></circle><circle cx="12" cy="19" r="1.6" fill="currentColor" stroke="none"></circle>' },
  // Étapes des scénarios d'automatisation (même trait que le reste du set : 24 px, contour 2)
  calendarClock: { body: '<path d="M21 10V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h5"></path><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="12" y2="10"></line><circle cx="17" cy="17" r="5"></circle><polyline points="17 14.5 17 17 18.5 18"></polyline>' },
  userPen: { body: '<circle cx="10" cy="7" r="4"></circle><path d="M3 21v-2a4 4 0 0 1 4-4h5"></path><path d="M18.4 13.6a1.9 1.9 0 0 1 2.7 2.7L16 21.4l-3.4.7.7-3.4z"></path>' },
  tagPlus: { body: '<path d="M20.6 13.4l-7.2 7.2a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"></path><line x1="7.5" y1="5.5" x2="7.5" y2="9.5"></line><line x1="5.5" y1="7.5" x2="9.5" y2="7.5"></line>' },
  tagMinus: { body: '<path d="M20.6 13.4l-7.2 7.2a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"></path><line x1="5.5" y1="7.5" x2="9.5" y2="7.5"></line>' },
  listPlus: { body: '<line x1="3" y1="6" x2="15" y2="6"></line><line x1="3" y1="12" x2="12" y2="12"></line><line x1="3" y1="18" x2="11" y2="18"></line><line x1="18" y1="12" x2="18" y2="20"></line><line x1="14" y1="16" x2="22" y2="16"></line>' },
  listMinus: { body: '<line x1="3" y1="6" x2="15" y2="6"></line><line x1="3" y1="12" x2="12" y2="12"></line><line x1="3" y1="18" x2="11" y2="18"></line><line x1="14" y1="16" x2="22" y2="16"></line>' },
  // Éditeur d'e-mails (Campagnes → Modèles) : blocs et outils
  type: { body: '<polyline points="4 7 4 4 20 4 20 7"></polyline><line x1="9" y1="20" x2="15" y2="20"></line><line x1="12" y1="4" x2="12" y2="20"></line>' },
  alignLeft: { body: '<line x1="17" y1="10" x2="3" y2="10"></line><line x1="21" y1="6" x2="3" y2="6"></line><line x1="21" y1="14" x2="3" y2="14"></line><line x1="17" y1="18" x2="3" y2="18"></line>' },
  quote: { body: '<path d="M7 7h4v4H8a3 3 0 0 0 3 3v2a5 5 0 0 1-5-5V8a1 1 0 0 1 1-1z"></path><path d="M15 7h4v4h-3a3 3 0 0 0 3 3v2a5 5 0 0 1-5-5V8a1 1 0 0 1 1-1z"></path>' },
  image: { body: '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline>' },
  mousePointer: { body: '<path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"></path><path d="M13 13l6 6"></path>' },
  share2: { body: '<circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>' },
  columns: { body: '<rect x="3" y="3" width="18" height="18" rx="2"></rect><line x1="12" y1="3" x2="12" y2="21"></line>' },
  moveVertical: { body: '<polyline points="8 18 12 22 16 18"></polyline><polyline points="8 6 12 2 16 6"></polyline><line x1="12" y1="2" x2="12" y2="22"></line>' },
  copy: { body: '<rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>' },
  eyeOff: { body: '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line>' },
  undo: { body: '<path d="M9 14 4 9l5-5"></path><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"></path>' },
  redo: { body: '<path d="m15 14 5-5-5-5"></path><path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13"></path>' },
  monitor: { body: '<rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line>' },
  tablet: { body: '<rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line>' },
  layers: { body: '<polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline>' },
  arrowUp: { body: '<line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline>' },
  arrowDown: { body: '<line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline>' },
  edit: { body: '<path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>' },
  link: { body: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>' },
  braces: { body: '<path d="M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5a2 2 0 0 0 2 2h1"></path><path d="M16 21h1a2 2 0 0 0 2-2v-5a2 2 0 0 1 2-2 2 2 0 0 1-2-2V5a2 2 0 0 0-2-2h-1"></path>' },
  moreHorizontal: { body: '<circle cx="5" cy="12" r="1.6" fill="currentColor" stroke="none"></circle><circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none"></circle><circle cx="19" cy="12" r="1.6" fill="currentColor" stroke="none"></circle>' },
  cart: {
    body:
      '<circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle>' +
      '<path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>',
  },
  menu: { body: '<line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="18" x2="21" y2="18"></line>' },
  close: { body: '<line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>' },
  user: { body: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle>' },
  graduation: { body: '<path d="M22 10L12 5 2 10l10 5 10-5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path>' },
  briefcase: { body: '<rect x="2" y="7" width="20" height="14" rx="2"></rect><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"></path>' },
  users: {
    body:
      '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle>' +
      '<path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path>',
  },
  star: { body: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>', filled: true },
  starOutline: { body: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>' },
  pause: { body: '<rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect>', filled: true },
  play: { body: '<polygon points="6 3 20 12 6 21 6 3"></polygon>', filled: true },
  video: { body: '<rect x="2" y="6" width="14" height="12" rx="2"></rect><path d="M16 10.5l6-3.5v10l-6-3.5z"></path>' },
  lock: { body: '<rect x="4" y="11" width="16" height="10" rx="2"></rect><path d="M7.5 11V7.5a4.5 4.5 0 0 1 9 0V11"></path>' },
  check: { body: '<polyline points="20 6 9 17 4 12"></polyline>' },
  checkCircle: { body: '<circle cx="12" cy="12" r="9"></circle><polyline points="8.5 12.5 11 15 15.5 9.5"></polyline>' },
  arrowLeft: { body: '<line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline>' },
  arrowRight: { body: '<line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline>' },
  chevronDown: { body: '<polyline points="6 9 12 15 18 9"></polyline>' },
  trophy: {
    body:
      '<path d="M8 4h8v4a4 4 0 0 1-8 0V4z"></path><path d="M8 4.5H4.5v1A3.5 3.5 0 0 0 8 9"></path>' +
      '<path d="M16 4.5h3.5v1A3.5 3.5 0 0 1 16 9"></path><line x1="12" y1="12" x2="12" y2="17"></line>' +
      '<line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line>',
  },
  quiz: { body: '<rect x="3" y="3" width="18" height="18" rx="3"></rect><path d="M8 12.5l2.5 2.5L16 9"></path>' },
  trash: {
    body:
      '<polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>' +
      '<path d="M10 11v6"></path><path d="M14 11v6"></path><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path>',
  },
  printer: {
    body:
      '<polyline points="6 9 6 2 18 2 18 9"></polyline>' +
      '<path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>' +
      '<rect x="6" y="14" width="12" height="8"></rect>',
  },
  clip: { body: '<path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>' },
  list: { body: '<line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line>' },
  fileText: { body: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"></path><polyline points="14 3 14 8 19 8"></polyline><line x1="9" y1="13" x2="15" y2="13"></line><line x1="9" y1="17" x2="15" y2="17"></line>' },
  globe: { body: '<circle cx="12" cy="12" r="9"></circle><line x1="3" y1="12" x2="21" y2="12"></line><path d="M12 3a14 14 0 0 1 0 18a14 14 0 0 1 0-18"></path>' },
  download: { body: '<path d="M12 3v12"></path><polyline points="7 10 12 15 17 10"></polyline><path d="M5 21h14"></path>' },
  eye: { body: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>' },
  infinity: { body: '<path d="M18.178 8c5.096 0 5.096 8 0 8-5.095 0-7.988-8-13.083-8-5.096 0-5.096 8 0 8 5.095 0 7.988-8 13.083-8z"></path>' },
  smartphone: { body: '<rect x="7" y="2" width="10" height="20" rx="2"></rect><line x1="11" y1="18" x2="13" y2="18"></line>' },
  info: { body: '<circle cx="12" cy="12" r="9"></circle><line x1="12" y1="16" x2="12" y2="11.5"></line><circle cx="12" cy="8" r="1" fill="currentColor" stroke="none"></circle>' },
  coin: {
    body:
      '<circle cx="12" cy="12" r="9"></circle>' +
      '<path d="M9.5 15.2s.9 1.3 2.7 1.3 2.6-.9 2.6-1.9-1-1.4-2.6-1.8-2.8-.9-2.8-1.9 1-1.7 2.6-1.7 2.6.9 2.6.9"></path>' +
      '<line x1="12" y1="6" x2="12" y2="7.3"></line><line x1="12" y1="16.7" x2="12" y2="18"></line>',
  },
  book: {
    body:
      '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H13v18H6.5A2.5 2.5 0 0 1 4 18.5v-13z"></path>' +
      '<path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H13v18h4.5a2.5 2.5 0 0 0 2.5-2.5v-13z"></path>',
  },
  grip: {
    body:
      '<circle cx="9" cy="6" r="1.3" fill="currentColor" stroke="none"></circle><circle cx="9" cy="12" r="1.3" fill="currentColor" stroke="none"></circle>' +
      '<circle cx="9" cy="18" r="1.3" fill="currentColor" stroke="none"></circle><circle cx="15" cy="6" r="1.3" fill="currentColor" stroke="none"></circle>' +
      '<circle cx="15" cy="12" r="1.3" fill="currentColor" stroke="none"></circle><circle cx="15" cy="18" r="1.3" fill="currentColor" stroke="none"></circle>',
  },
  bell: { body: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path>' },
  heart: { body: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21.2l7.8-7.7 1-1.1a5.5 5.5 0 0 0 0-7.8z"></path>' },
  heartFilled: { body: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21.2l7.8-7.7 1-1.1a5.5 5.5 0 0 0 0-7.8z"></path>', filled: true },
  clock: { body: '<circle cx="12" cy="12" r="9"></circle><polyline points="12 7 12 12 15.5 14"></polyline>' },
  // Espace marketing (navigation et composants)
  home: { body: '<path d="M3 11l9-8 9 8"></path><path d="M5 10v10h14V10"></path><path d="M10 20v-6h4v6"></path>' },
  tag: { body: '<path d="M20.6 13.4l-7.2 7.2a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"></path><circle cx="7.5" cy="7.5" r="1.2" fill="currentColor" stroke="none"></circle>' },
  sliders: { body: '<line x1="4" y1="6" x2="20" y2="6"></line><line x1="4" y1="12" x2="20" y2="12"></line><line x1="4" y1="18" x2="20" y2="18"></line><circle cx="9" cy="6" r="2" fill="#fff"></circle><circle cx="15" cy="12" r="2" fill="#fff"></circle><circle cx="8" cy="18" r="2" fill="#fff"></circle>' },
  upload: { body: '<path d="M12 15V3"></path><polyline points="7 8 12 3 17 8"></polyline><path d="M5 21h14"></path>' },
  mail: { body: '<rect x="3" y="5" width="18" height="14" rx="2"></rect><polyline points="3 7 12 13 21 7"></polyline>' },
  send: { body: '<line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>' },
  layout: { body: '<rect x="3" y="3" width="18" height="18" rx="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="9" x2="9" y2="21"></line>' },
  zap: { body: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>' },
  activity: { body: '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>' },
  shield: { body: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"></path><polyline points="9 12 11 14 15 10"></polyline>' },
  settings: { body: '<circle cx="12" cy="12" r="3"></circle><path d="M12 2v3"></path><path d="M12 19v3"></path><path d="M2 12h3"></path><path d="M19 12h3"></path><path d="M4.9 4.9l2.1 2.1"></path><path d="M17 17l2.1 2.1"></path><path d="M4.9 19.1L7 17"></path><path d="M17 7l2.1-2.1"></path>' },
  chevronRight: { body: '<polyline points="9 6 15 12 9 18"></polyline>' },
  chevronLeft: { body: '<polyline points="15 6 9 12 15 18"></polyline>' },
  panelLeft: { body: '<rect x="3" y="4" width="18" height="16" rx="2"></rect><line x1="9" y1="4" x2="9" y2="20"></line>' },
  plug: { body: '<path d="M9 2v6"></path><path d="M15 2v6"></path><path d="M6 8h12v4a6 6 0 0 1-12 0V8z"></path><path d="M12 18v4"></path>' },
  help: { body: '<circle cx="12" cy="12" r="9"></circle><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7"></path><circle cx="12" cy="17" r="1" fill="currentColor" stroke="none"></circle>' },
  logout: { body: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line>' },
  plus: { body: '<line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>' },
  minus: { body: '<line x1="5" y1="12" x2="19" y2="12"></line>' },
  filter: { body: '<polygon points="22 3 2 3 10 12.5 10 19 14 21 14 12.5 22 3"></polygon>' },
  // Éditeur graphique des scénarios (canevas d'automatisation, src/editor/automation-flow.js)
  gitBranch: { body: '<line x1="6" y1="3" x2="6" y2="15"></line><circle cx="18" cy="6" r="3"></circle><circle cx="6" cy="18" r="3"></circle><path d="M18 9a9 9 0 0 1-9 9"></path>' },
  shuffle: { body: '<polyline points="16 3 21 3 21 8"></polyline><line x1="4" y1="20" x2="21" y2="3"></line><polyline points="21 16 21 21 16 21"></polyline><line x1="15" y1="15" x2="21" y2="21"></line><line x1="4" y1="4" x2="9" y2="9"></line>' },
  stopCircle: { body: '<circle cx="12" cy="12" r="9"></circle><rect x="9" y="9" width="6" height="6"></rect>' },
  maximize: { body: '<path d="M8 3H5a2 2 0 0 0-2 2v3"></path><path d="M16 3h3a2 2 0 0 1 2 2v3"></path><path d="M8 21H5a2 2 0 0 1-2-2v-3"></path><path d="M16 21h3a2 2 0 0 0 2-2v-3"></path>' },
  externalLink: { body: '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line>' },
  alertTriangle: { body: '<path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><circle cx="12" cy="17" r="1" fill="currentColor" stroke="none"></circle>' },
  inbox: { body: '<polyline points="22 12 16 12 14 15 10 15 8 12 2 12"></polyline><path d="M5.5 5.1L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.5-6.9A2 2 0 0 0 16.7 4H7.3a2 2 0 0 0-1.8 1.1z"></path>' },
  // Espace SEO
  searchCheck: { body: '<circle cx="11" cy="11" r="7"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><polyline points="8 11 10.5 13.5 14.5 9"></polyline>' },
  arrowRightLeft: { body: '<polyline points="16 3 20 7 16 11"></polyline><line x1="20" y1="7" x2="4" y2="7"></line><polyline points="8 21 4 17 8 13"></polyline><line x1="4" y1="17" x2="20" y2="17"></line>' },
  alertCircle: { body: '<circle cx="12" cy="12" r="9"></circle><line x1="12" y1="8" x2="12" y2="12.5"></line><circle cx="12" cy="16" r="1" fill="currentColor" stroke="none"></circle>' },
  network: { body: '<rect x="9" y="2" width="6" height="6" rx="1"></rect><rect x="2" y="16" width="6" height="6" rx="1"></rect><rect x="16" y="16" width="6" height="6" rx="1"></rect><path d="M5 16v-3h14v3"></path><line x1="12" y1="8" x2="12" y2="13"></line>' },
  bot: { body: '<rect x="4" y="8" width="16" height="12" rx="2"></rect><line x1="12" y1="4" x2="12" y2="8"></line><circle cx="12" cy="3" r="1"></circle><line x1="9" y1="13" x2="9" y2="15"></line><line x1="15" y1="13" x2="15" y2="15"></line><line x1="2" y1="13" x2="2" y2="16"></line><line x1="22" y1="13" x2="22" y2="16"></line>' },
  listChecks: { body: '<polyline points="3 6 4.5 7.5 7 5"></polyline><polyline points="3 12 4.5 13.5 7 11"></polyline><polyline points="3 18 4.5 19.5 7 17"></polyline><line x1="11" y1="6" x2="21" y2="6"></line><line x1="11" y1="12" x2="21" y2="12"></line><line x1="11" y1="18" x2="21" y2="18"></line>' },
  barChart: { body: '<line x1="4" y1="20" x2="20" y2="20"></line><rect x="6" y="11" width="3" height="7" rx="0.5"></rect><rect x="11" y="6" width="3" height="12" rx="0.5"></rect><rect x="16" y="13" width="3" height="5" rx="0.5"></rect>' },
  history: { body: '<path d="M3 12a9 9 0 1 0 3-6.7"></path><polyline points="3 3 3 8 8 8"></polyline><polyline points="12 7 12 12 15 14"></polyline>' },
  palette: { body: '<path d="M12 3a9 9 0 0 0 0 18c1.1 0 1.8-.8 1.8-1.8 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.2 0-1 .8-1.8 1.8-1.8H17a4 4 0 0 0 4-4C21 6.6 17 3 12 3z"></path><circle cx="7.5" cy="11" r="1.2" fill="currentColor" stroke="none"></circle><circle cx="10" cy="7" r="1.2" fill="currentColor" stroke="none"></circle><circle cx="15" cy="7" r="1.2" fill="currentColor" stroke="none"></circle>' },
};

function icon(name, opts = {}) {
  const def = ICONS[name];
  if (!def) return "";
  const { size = 20, className = "" } = opts;
  const fill = def.filled ? "currentColor" : "none";
  return `<svg class="icon ${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="${fill}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${def.body}</svg>`;
}

function starRow(rating, size = 16) {
  const filled = Math.round(rating || 0);
  let out = '<span class="stars-row">';
  for (let i = 1; i <= 5; i++) {
    out += icon(i <= filled ? "star" : "starOutline", { size, className: "star-ico" });
  }
  out += "</span>";
  return out;
}

module.exports = { icon, starRow };
