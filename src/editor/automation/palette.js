// Palette d'actions latérale de l'éditeur de scénarios : catégories repliables, recherche, mode réduit (icônes +
// infobulles), tiroir sur petit écran, ajout par clic ou par glisser-déposer. Elle ne crée rien elle-même : elle
// appelle onAdd(type) — l'éditeur (automation-flow.js) crée l'étape avec son propre système de nœuds.
import { el } from "./ui";
import { CATEGORIES, insertable, action as actionOf } from "./registry";

// Catégories et actions : tirées du registre central (registry.js), jamais redéfinies ici
const groupsFromRegistry = (recent) => {
  const groups = CATEGORIES.map(([key, label]) => ({
    key, label,
    items: key === "trigger"
      ? [{ type: "__trigger", label: "Ajouter un déclencheur", description: "Jusqu'à 3 événements qui démarrent le scénario", keywords: "declencheur evenement demarrer", icon: "zap", trigger: true }]
      : insertable().filter((x) => x.category === key),
  })).filter((g) => g.items.length);
  // Récemment utilisées : les dernières actions insérées par cette personne (mémorisées dans ce navigateur)
  const known = insertable();
  const items = (recent || []).map((t) => known.find((x) => x.type === t)).filter(Boolean);
  return items.length ? [{ key: "recent", label: "Récemment utilisées", items }].concat(groups) : groups;
};
export const DRAG_TYPE = "application/x-kolakisa-step";
const norm = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
const store = {
  get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* stockage indisponible : préférence non gardée */ } },
};

export function buildPalette({ root, workspace, iconHtml, onAdd, onAddTrigger, openButton }) {
  const prefs = store.get("kolakisa-flow-palette") || {};
  const closed = new Set(prefs.closed || []);
  const save = () => store.set("kolakisa-flow-palette", { collapsed: workspace.classList.contains("is-palette-collapsed"), closed: [...closed], recent: prefs.recent || [], onlyAvailable: Boolean(prefs.onlyAvailable) });

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
  const groups = el("div", { class: "mk-pal-groups" });
  const empty = el("p", { class: "mk-pal-empty", role: "status", hidden: true }, "Aucune action trouvée");
  const help = el("p", { class: "mk-pal-help" }, "Cliquez ou glissez une action sur le canevas : elle y est posée sans être reliée. Reliez les étapes en tirant du point de sortie de l'une au point d'entrée de l'autre ; cliquez sur une étape pour la configurer.");

  const allButtons = [];
  const groupEls = groupsFromRegistry(prefs.recent).map((cat) => {
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
    const items = cat.items.map((it) => {
      const { type, label, description: desc, keywords = "" } = it;
      // Disponibilité RÉELLE (serveur) : une action qui dépend d'une connexion non réglée est marquée, jamais présentée comme prête
      const av = it.trigger ? null : actionOf(type).availability;
      const needs = Boolean(av && av.state === "connection_required");
      const why = needs ? av.reasons.filter((r) => !r.ok).map((r) => `${r.label} : ${r.detail}${r.fix ? ` (${r.fix})` : ""}`).join(" ; ") : "";
      const li = el("li");
      const b = it.trigger
        ? el("button", { type: "button", class: "mk-pal-item mk-pal-item--trigger", "data-add-trigger": "", "data-tip": label, "aria-label": "Ajouter un déclencheur (ouvre la configuration du déclencheur)" })
        : el("button", { type: "button", class: `mk-pal-item mk-pal-item--${type}${it.tone ? ` is-${it.tone}` : ""}${needs ? " is-needs-connection" : ""}`, draggable: "true", "data-step-type": type, "data-tip": needs ? `${label} — connexion requise. ${why}` : label, "aria-label": `Insérer l'étape « ${label} »${needs ? `. Connexion requise : ${why}` : ""}` });
      const ic = el("span", { class: "mk-pal-icon", "aria-hidden": "true" }); ic.innerHTML = iconHtml(it.icon, 18);
      const txt = el("span", { class: "mk-pal-text" });
      txt.append(el("span", { class: "mk-pal-name" }, label), el("span", { class: "mk-pal-desc" }, desc));
      if (needs) txt.append(el("span", { class: "mk-pal-badge", title: why }, "Connexion requise"));
      b.append(ic, txt);
      b.addEventListener("click", () => { if (it.trigger) onAddTrigger(); else { onAdd(type); remember(type); } if (workspace.classList.contains("is-palette-open")) setDrawer(false); });
      if (!it.trigger) b.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData(DRAG_TYPE, type);
        e.dataTransfer.setData("text/plain", label);
        e.dataTransfer.effectAllowed = "copy";
        b.classList.add("is-dragging");
      });
      if (!it.trigger) b.addEventListener("dragend", () => { b.classList.remove("is-dragging"); });
      li.appendChild(b);
      list.appendChild(li);
      allButtons.push(b);
      return { li, state: needs ? "connection_required" : "available", haystack: norm(`${label} ${desc} ${keywords} ${cat.label}${needs ? " connexion requise" : ""}`) };
    });
    section.append(toggle, list);
    groups.appendChild(section);
    return { cat, section, toggle, list, items };
  });
  // Récemment utilisées : les 4 dernières insertions, de la plus récente à la plus ancienne (visibles à la prochaine ouverture)
  function remember(type) { prefs.recent = [type].concat((prefs.recent || []).filter((t) => t !== type)).slice(0, 4); save(); }
  // « Seulement les actions disponibles » : proposé UNIQUEMENT s'il existe des actions qui attendent une connexion (jamais un contrôle sans effet)
  const anyNeeds = groupEls.some((g) => g.items.some((it) => it.state !== "available"));
  let onlyWrap = null;
  if (anyNeeds) {
    const cb = el("input", { type: "checkbox", id: "au-pal-only", "data-pal-only": "" });
    cb.checked = Boolean(prefs.onlyAvailable);
    cb.addEventListener("change", () => { prefs.onlyAvailable = cb.checked; save(); filter(); });
    onlyWrap = el("label", { class: "mk-pal-only", for: "au-pal-only" });
    onlyWrap.append(cb, "Seulement les actions disponibles");
  }
  body.append(...[searchWrap, onlyWrap, groups, empty, help].filter(Boolean));
  root.append(head, body);
  root.setAttribute("aria-labelledby", "au-pal-title");

  // Recherche : filtre les actions (sans accents, synonymes compris) ; les catégories concernées s'ouvrent
  function filter() {
    const q = norm(search.value);
    const words = q ? q.split(" ") : [];
    let shown = 0;
    groupEls.forEach((g) => {
      let n = 0;
      g.items.forEach((it) => { const ok = (!prefs.onlyAvailable || it.state === "available") && words.every((w) => it.haystack.includes(w)); it.li.hidden = !ok; if (ok) n++; });
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

  return {};
}
