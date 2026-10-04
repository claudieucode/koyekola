// Palette d'actions latérale de l'éditeur de scénarios : catégories repliables, recherche, mode réduit (icônes +
// infobulles), tiroir sur petit écran, ajout par clic ou par glisser-déposer. Elle ne crée rien elle-même : elle
// appelle onAdd(type) — l'éditeur (automation-flow.js) crée l'étape avec son propre système de nœuds.
import { el } from "./ui";

// Mêmes types que le moteur (steps.js) ; mots-clés : synonymes acceptés par la recherche
export const CATEGORIES = [
  { key: "communication", label: "Communication", items: [["email", "Envoyer un e-mail", "Un modèle de votre bibliothèque", "email mail courriel message envoi"]] },
  { key: "temps", label: "Temps", items: [["wait", "Attendre", "Une durée fixe", "attente delai pause duree"], ["wait_for_event", "Attendre jusqu'à", "Un événement, avec délai maximal", "attente evenement delai"]] },
  { key: "logique", label: "Logique", items: [["condition", "Condition", "Deux chemins : oui / non", "si segment branche ouvert clic"], ["split", "Tirage aléatoire", "Deux chemins : A / B", "test ab aleatoire hasard pourcentage branche"]] },
  { key: "contact", label: "Contact", items: [["update_field", "Mettre à jour un champ", "Prénom, société, propriété…", "champ modifier propriete contact"], ["add_tag", "Ajouter une étiquette", "Étiquette existante ou nouvelle", "tag etiquette"], ["remove_tag", "Retirer une étiquette", "Retire une étiquette du contact", "tag etiquette enlever supprimer"], ["add_to_list", "Ajouter à une liste", "Inscrit le contact à une liste", "liste abonnement"], ["remove_from_list", "Retirer d'une liste", "Désinscrit le contact d'une liste", "liste enlever desabonnement"]] },
  { key: "fin", label: "Fin", items: [["end", "Fin", "Le passage du contact s'arrête", "fin terminer stop sortie"]] },
];
export const DRAG_TYPE = "application/x-kolakisa-step";
const norm = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
const store = {
  get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* stockage indisponible : préférence non gardée */ } },
};

export function buildPalette({ root, workspace, iconHtml, onAdd, openButton }) {
  const prefs = store.get("kolakisa-flow-palette") || {};
  const closed = new Set(prefs.closed || []);
  const save = () => store.set("kolakisa-flow-palette", { collapsed: workspace.classList.contains("is-palette-collapsed"), closed: [...closed] });

  const head = el("div", { class: "mk-pal-head" });
  const headIcon = el("span", { class: "mk-pal-head-icon", "aria-hidden": "true" }); headIcon.innerHTML = iconHtml("plus", 18);
  const titles = el("div", { class: "mk-pal-titles" });
  titles.appendChild(el("h2", { id: "au-pal-title" }, "Actions"));
  titles.appendChild(el("p", {}, "Ajoutez une étape à votre scénario"));
  const collapse = el("button", { type: "button", class: "mk-pal-collapse", "aria-expanded": "true", "aria-controls": "au-pal-body", "aria-label": "Réduire la palette", "data-tip": "Réduire" });
  collapse.innerHTML = iconHtml("chevronLeft", 18);
  const closeBtn = el("button", { type: "button", class: "mk-pal-close", "aria-label": "Fermer la palette" }, "×");
  head.append(headIcon, titles, collapse, closeBtn);

  const body = el("div", { class: "mk-pal-body", id: "au-pal-body" });
  const searchWrap = el("div", { class: "mk-pal-search" });
  const searchIcon = el("span", { class: "mk-pal-search-icon", "aria-hidden": "true" }); searchIcon.innerHTML = iconHtml("search", 16);
  const search = el("input", { type: "search", id: "au-pal-search", placeholder: "Rechercher une action…", autocomplete: "off", "aria-label": "Rechercher une action" });
  searchWrap.append(searchIcon, search);
  const target = el("p", { class: "mk-pal-target", "aria-live": "polite" });
  const groups = el("div", { class: "mk-pal-groups" });
  const empty = el("p", { class: "mk-pal-empty", role: "status", hidden: true }, "Aucune action trouvée");
  const help = el("p", { class: "mk-pal-help" }, "Cliquez pour ajouter, ou glissez une action sur le canevas.");

  const allButtons = [];
  const groupEls = CATEGORIES.map((cat) => {
    const listId = `au-pal-${cat.key}`;
    const section = el("section", { class: "mk-pal-group", "data-group": cat.key });
    const toggle = el("button", { type: "button", class: "mk-pal-cat", "aria-expanded": String(!closed.has(cat.key)), "aria-controls": listId });
    toggle.appendChild(el("span", {}, cat.label));
    const chev = el("span", { class: "mk-pal-chev", "aria-hidden": "true" }); chev.innerHTML = iconHtml("chevronDown", 14);
    toggle.appendChild(chev);
    const list = el("ul", { class: "mk-pal-list", id: listId });
    list.hidden = closed.has(cat.key);
    toggle.addEventListener("click", () => {
      const open = toggle.getAttribute("aria-expanded") !== "true";
      toggle.setAttribute("aria-expanded", String(open)); list.hidden = !open;
      if (open) closed.delete(cat.key); else closed.add(cat.key);
      save();
    });
    const items = cat.items.map(([type, label, desc, keywords]) => {
      const li = el("li");
      const b = el("button", { type: "button", class: `mk-pal-item mk-pal-item--${type}`, draggable: "true", "data-step-type": type, "data-tip": label, "aria-label": `Ajouter l'étape « ${label} »` });
      const ic = el("span", { class: "mk-pal-icon", "aria-hidden": "true" }); ic.innerHTML = iconHtml(type, 18);
      const txt = el("span", { class: "mk-pal-text" });
      txt.append(el("span", { class: "mk-pal-name" }, label), el("span", { class: "mk-pal-desc" }, desc));
      b.append(ic, txt);
      b.addEventListener("click", () => { onAdd(type); if (workspace.classList.contains("is-palette-open")) setDrawer(false); });
      b.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData(DRAG_TYPE, type);
        e.dataTransfer.setData("text/plain", label);
        e.dataTransfer.effectAllowed = "copy";
        b.classList.add("is-dragging");
      });
      b.addEventListener("dragend", () => { b.classList.remove("is-dragging"); });
      li.appendChild(b);
      list.appendChild(li);
      allButtons.push(b);
      return { li, haystack: norm(`${label} ${desc} ${keywords} ${cat.label}`) };
    });
    section.append(toggle, list);
    groups.appendChild(section);
    return { cat, section, toggle, list, items };
  });
  body.append(searchWrap, target, groups, empty, help);
  root.append(head, body);
  root.setAttribute("aria-labelledby", "au-pal-title");

  // Recherche : filtre les actions (sans accents, synonymes compris) ; les catégories concernées s'ouvrent
  function filter() {
    const q = norm(search.value);
    const words = q ? q.split(" ") : [];
    let shown = 0;
    groupEls.forEach((g) => {
      let n = 0;
      g.items.forEach((it) => { const ok = words.every((w) => it.haystack.includes(w)); it.li.hidden = !ok; if (ok) n++; });
      shown += n;
      g.section.hidden = n === 0;
      g.list.hidden = q ? false : closed.has(g.cat.key);
      g.toggle.setAttribute("aria-expanded", String(!g.list.hidden));
    });
    empty.hidden = shown > 0;
  }
  search.addEventListener("input", filter);
  search.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && search.value) { e.preventDefault(); search.value = ""; filter(); }
    if (e.key === "Enter") { const first = allButtons.find((b) => !b.closest("li").hidden && !b.closest(".mk-pal-group").hidden); if (first) { e.preventDefault(); first.click(); } }
    if (e.key === "ArrowDown") { const first = allButtons.find((b) => b.offsetParent); if (first) { e.preventDefault(); first.focus(); } }
  });
  // Flèches haut / bas entre les actions visibles
  groups.addEventListener("keydown", (e) => {
    if (!["ArrowDown", "ArrowUp"].includes(e.key) || !e.target.classList.contains("mk-pal-item")) return;
    const visible = allButtons.filter((b) => b.offsetParent);
    const i = visible.indexOf(e.target);
    const next = visible[i + (e.key === "ArrowDown" ? 1 : -1)];
    if (next) { e.preventDefault(); next.focus(); }
  });

  // Réduite (icônes seules + infobulles) / développée — mémorisé pour cette personne
  function setCollapsed(on) {
    workspace.classList.toggle("is-palette-collapsed", on);
    collapse.setAttribute("aria-expanded", String(!on));
    collapse.setAttribute("aria-label", on ? "Développer la palette" : "Réduire la palette");
    collapse.setAttribute("data-tip", on ? "Développer" : "Réduire");
    collapse.innerHTML = iconHtml(on ? "chevronRight" : "chevronLeft", 18);
    if (on) { search.value = ""; filter(); groupEls.forEach((g) => { g.list.hidden = false; }); }
    else filter();
    window.dispatchEvent(new Event("resize")); // le canevas récupère / rend la place
  }
  collapse.addEventListener("click", () => { setCollapsed(!workspace.classList.contains("is-palette-collapsed")); save(); });
  setCollapsed(!!prefs.collapsed);

  // Petit écran : tiroir ouvert par « + Ajouter une étape »
  function setDrawer(open) {
    workspace.classList.toggle("is-palette-open", open);
    if (openButton) openButton.setAttribute("aria-expanded", String(open));
    if (open) setTimeout(() => search.focus(), 50);
    else if (openButton && openButton.offsetParent) openButton.focus();
  }
  if (openButton) openButton.addEventListener("click", () => setDrawer(!workspace.classList.contains("is-palette-open")));
  closeBtn.addEventListener("click", () => setDrawer(false));
  workspace.addEventListener("click", (e) => { if (e.target === workspace && workspace.classList.contains("is-palette-open")) setDrawer(false); }); // fond assombri
  root.addEventListener("keydown", (e) => { if (e.key === "Escape" && workspace.classList.contains("is-palette-open")) { e.preventDefault(); setDrawer(false); } });

  return {
    // Où la prochaine étape sera ajoutée (affiché sous la recherche)
    setTarget(textValue) { target.textContent = textValue; },
  };
}
