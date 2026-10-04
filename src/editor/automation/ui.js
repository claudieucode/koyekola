// Briques d'interface de l'éditeur de scénarios : champs de formulaire, boîte de dialogue d'une étape, menu « ⋯ ».
// Mêmes composants visuels que le reste de KOLAKISA Marketing (.mk-dialog, .mk-menu, .field-group, .btn) — rien de
// propre à l'éditeur. Aucun texte saisi n'est inséré comme HTML : uniquement textContent / value.

let seq = 0;
export const nextId = () => `au-f${++seq}`;

export function el(tag, attrs, text) {
  const n = document.createElement(tag);
  Object.keys(attrs || {}).forEach((k) => { if (attrs[k] !== undefined && attrs[k] !== null && attrs[k] !== false) n.setAttribute(k, attrs[k] === true ? "" : attrs[k]); });
  if (text !== undefined) n.textContent = text;
  return n;
}

// Champ avec son libellé (et une aide facultative, reliée par aria-describedby)
export function field(labelText, control, hint) {
  const w = el("div", { class: "field-group" });
  w.appendChild(el("label", { for: control.id }, labelText));
  w.appendChild(control);
  if (hint) {
    const h = el("p", { class: "field-hint", id: `${control.id}-hint` }, hint);
    control.setAttribute("aria-describedby", h.id);
    w.appendChild(h);
  }
  return w;
}
export function select(options, value, onChange, { disabled = false, label } = {}) {
  const s = el("select", { id: nextId(), "aria-label": label });
  options.forEach((o) => { const opt = el("option", { value: String(o[0]) }, o[1]); if (o[2]) opt.disabled = true; s.appendChild(opt); });
  s.value = value == null ? "" : String(value);
  s.disabled = disabled;
  s.addEventListener("change", () => onChange(s.value));
  return s;
}
export function text(value, onChange, { maxlength = 200, placeholder, pattern, disabled = false, event = "input" } = {}) {
  const t = el("input", { type: "text", id: nextId(), maxlength: String(maxlength), placeholder, pattern });
  t.value = value || "";
  t.disabled = disabled;
  t.addEventListener(event, () => onChange(t.value));
  return t;
}
export function number(value, onChange, { min = 1, max, disabled = false } = {}) {
  const n = el("input", { type: "number", min: String(min), max: max === undefined ? undefined : String(max), step: "1", id: nextId(), inputmode: "numeric" });
  n.value = value == null ? "" : String(value);
  n.disabled = disabled;
  n.addEventListener("input", () => onChange(n.value === "" ? undefined : Number(n.value)));
  return n;
}
export function checkbox(labelText, checked, onChange, { disabled = false } = {}) {
  const cb = el("input", { type: "checkbox", id: nextId() });
  cb.checked = !!checked; cb.disabled = disabled;
  cb.addEventListener("change", () => onChange(cb.checked));
  const lab = el("label", { class: "checkbox-row", for: cb.id });
  lab.appendChild(cb); lab.appendChild(document.createTextNode(` ${labelText}`));
  return lab;
}
export const note = (t) => el("p", { class: "mk-note" }, t);
export const hint = (t) => el("p", { class: "field-hint" }, t);

// Confirmation : celle de KOLAKISA Marketing (public/js/mk/shell.js), sinon celle du navigateur
export function confirmAction({ title, text: body, ok }) {
  return new Promise((resolve) => {
    if (typeof window.mkConfirm === "function") window.mkConfirm({ title, text: body, ok }, () => resolve(true), () => resolve(false));
    else resolve(window.confirm(body));
  });
}

// ---------- Modifications non enregistrées : continuer, abandonner ou enregistrer ----------
// Renvoie "continue" | "discard" | "save". Échap = continuer (rien n'est perdu).
function unsavedChoice() {
  return new Promise((resolve) => {
    const titleId = nextId();
    const d = el("dialog", { class: "mk-dialog mk-unsaved-dialog", "aria-labelledby": titleId, role: "alertdialog" });
    const body = el("div", { class: "mk-dialog-body" });
    body.appendChild(el("h2", { id: titleId }, "Vous avez des modifications non enregistrées."));
    body.appendChild(el("p", {}, "Enregistrez-les pour les appliquer à l'étape, ou abandonnez-les pour revenir aux réglages d'avant."));
    const actions = el("div", { class: "mk-dialog-actions" });
    const keep = el("button", { type: "button", class: "btn btn-outline btn-sm" }, "Continuer la modification");
    const discard = el("button", { type: "button", class: "btn btn-outline btn-sm mk-btn-danger-outline" }, "Abandonner");
    const save = el("button", { type: "button", class: "btn btn-primary btn-sm" }, "Enregistrer");
    actions.append(keep, discard, save);
    d.append(body, actions);
    document.body.appendChild(d);
    const done = (v) => { d.close(); d.remove(); resolve(v); };
    keep.addEventListener("click", () => done("continue"));
    discard.addEventListener("click", () => done("discard"));
    save.addEventListener("click", () => done("save"));
    d.addEventListener("cancel", (e) => { e.preventDefault(); done("continue"); });
    d.addEventListener("keydown", (e) => e.stopPropagation());
    d.showModal();
    keep.focus();
  });
}

// ---------- Fenêtre de configuration d'une étape (composant commun à TOUTES les étapes) ----------
// En-tête (titre « Configurer : … » + fermer) · contenu fourni par l'éditeur du type d'étape · pied Annuler / Enregistrer.
// Modifie un BROUILLON : rien n'est appliqué tant que « Enregistrer » n'a pas réussi (étape mise à jour ET scénario
// enregistré sur le serveur). Fermer (×, Annuler, Échap, fond) avec des modifications → continuer / abandonner /
// enregistrer. Un échec d'enregistrement garde la fenêtre ouverte avec le message, pour réessayer. Focus piégé par showModal().
export function openStepDialog({ title, body, readOnly = false, saveLabel = "Enregistrer", isDirty = () => false, onSave, onClose = () => {} }) {
  const titleId = nextId();
  const dlg = el("dialog", { class: "mk-dialog mk-step-dialog", "aria-labelledby": titleId });
  const head = el("div", { class: "mk-step-dialog-head" });
  head.appendChild(el("h2", { id: titleId }, title));
  const x = el("button", { type: "button", class: "mk-step-dialog-close", "aria-label": "Fermer la configuration" }, "×");
  head.appendChild(x);
  const errorBox = el("div", { class: "form-error mk-step-dialog-error", role: "alert", hidden: true });
  const content = el("div", { class: "mk-dialog-body mk-step-dialog-body" });
  content.appendChild(errorBox);
  content.appendChild(body);
  const actions = el("div", { class: "mk-dialog-actions" });
  const cancel = el("button", { type: "button", class: "btn btn-outline btn-sm" }, readOnly ? "Fermer" : "Annuler");
  actions.appendChild(cancel);
  let save = null;
  if (!readOnly) { save = el("button", { type: "submit", class: "btn btn-primary btn-sm", "data-step-save": "" }, saveLabel); actions.appendChild(save); }
  const form = el("form", { method: "dialog", novalidate: true });
  form.appendChild(content); form.appendChild(actions);
  dlg.appendChild(head); dlg.appendChild(form);
  // Les raccourcis du canevas (Suppr…) écoutent le document : une frappe dans la fenêtre ne doit jamais les atteindre
  dlg.addEventListener("keydown", (e) => { if (e.key !== "Escape") e.stopPropagation(); });
  document.body.appendChild(dlg);
  const previous = document.activeElement;
  let busy = false;

  const showErrors = (errors) => {
    errorBox.textContent = "";
    const list = [].concat(errors || []).filter(Boolean);
    errorBox.hidden = !list.length;
    if (!list.length) return;
    if (list.length === 1) errorBox.textContent = list[0];
    else { const ul = el("ul"); list.forEach((m) => ul.appendChild(el("li", {}, m))); errorBox.appendChild(ul); }
    errorBox.scrollIntoView({ block: "nearest" });
  };
  const finish = (saved) => { dlg.close(); dlg.remove(); onClose(Boolean(saved)); if (previous && previous.isConnected && previous.focus) previous.focus(); }; // saved : fermée par « Enregistrer »
  async function submit() {
    if (readOnly || busy) return;
    busy = true; save.disabled = true; cancel.disabled = true; save.textContent = "Enregistrement…";
    let result;
    try { result = await onSave(); } catch (err) { console.error("[automatisation] enregistrement de l'étape", err); result = { errors: ["Impossible d'enregistrer les modifications. Réessayez."] }; }
    busy = false; save.disabled = false; cancel.disabled = false; save.textContent = saveLabel;
    if (result && result.errors && result.errors.length) { showErrors(result.errors); return; }
    finish(true);
  }
  const attemptClose = async () => {
    if (busy) return;
    if (!readOnly && isDirty()) {
      const choice = await unsavedChoice();
      if (choice === "continue") return;
      if (choice === "save") { submit(); return; }
    }
    finish(false);
  };
  cancel.addEventListener("click", attemptClose);
  x.addEventListener("click", attemptClose);
  dlg.addEventListener("cancel", (e) => { e.preventDefault(); attemptClose(); });
  dlg.addEventListener("click", (e) => { if (e.target === dlg) attemptClose(); }); // clic sur le fond (règle de shell.js)
  form.addEventListener("submit", (e) => { e.preventDefault(); submit(); });
  dlg.showModal();
  const first = body.querySelector("input:not([type=hidden]):not([disabled]), select:not([disabled]), textarea:not([disabled])");
  (first || cancel).focus();
  return { dlg, showErrors, close: () => finish(false) };
}

// ---------- Menu « ⋯ » d'une étape ----------
// items : [{ label, danger?, run }]. Flèches haut/bas, Début/Fin, Échap (rend le focus au bouton), Tab ferme.
let openMenu = null;
export function closeStepMenu() { if (openMenu) openMenu(); }
export function openStepMenu(button, items, label) {
  closeStepMenu();
  const menu = el("div", { class: "mk-menu mk-step-menu", role: "menu", "aria-label": label });
  const buttons = items.map((it) => {
    const b = el("button", { type: "button", role: "menuitem", class: it.danger ? "mk-menu-danger" : undefined, tabindex: "-1", "aria-disabled": it.disabled ? "true" : undefined }, it.label);
    b.addEventListener("click", () => { if (it.disabled) return; close(false); it.run(); });
    menu.appendChild(b);
    return b;
  });
  document.body.appendChild(menu);
  // Sous le bouton (au-dessus s'il manque de place), toujours dans l'écran ; suit le bouton si la page défile
  const place = () => {
    const r = button.getBoundingClientRect();
    const w = menu.offsetWidth, h = menu.offsetHeight;
    const left = Math.min(Math.max(8, r.right - w), window.innerWidth - w - 8);
    const top = r.bottom + 6 + h > window.innerHeight - 8 ? Math.max(8, r.top - h - 6) : r.bottom + 6;
    menu.style.position = "fixed"; menu.style.left = `${left}px`; menu.style.top = `${top}px`; menu.style.right = "auto";
  };
  place();
  button.setAttribute("aria-expanded", "true");
  const onDoc = (e) => { if (!menu.contains(e.target) && e.target !== button && !button.contains(e.target)) close(false); };
  const onScroll = place;
  function close(refocus) {
    menu.remove(); button.setAttribute("aria-expanded", "false");
    document.removeEventListener("pointerdown", onDoc, true); window.removeEventListener("resize", onScroll); window.removeEventListener("scroll", onScroll, true);
    openMenu = null;
    if (refocus) button.focus();
  }
  openMenu = () => close(false);
  menu.addEventListener("keydown", (e) => {
    const i = buttons.indexOf(document.activeElement);
    const to = { ArrowDown: i + 1, ArrowUp: i - 1, Home: 0, End: buttons.length - 1 }[e.key];
    if (to !== undefined) { e.preventDefault(); buttons[(to + buttons.length) % buttons.length].focus(); }
    else if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); close(true); }
    else if (e.key === "Tab") close(false);
    e.stopPropagation(); // jamais jusqu'aux raccourcis du canevas
  });
  setTimeout(() => { document.addEventListener("pointerdown", onDoc, true); window.addEventListener("resize", onScroll); window.addEventListener("scroll", onScroll, true); }, 0);
  buttons[0].focus();
}
