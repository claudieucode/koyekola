// Sélecteur de date et d'heure de l'éditeur (remplace le calendrier natif du navigateur, impossible à mettre aux
// couleurs du thème). Il pilote le champ existant : sa valeur reste « AAAA-MM-JJTHH:MM » en heure LOCALE, et la
// conversion en UTC à l'enregistrement est faite, comme avant, par l'éditeur (une seule chaîne de dates).
// Accessible : grille de jours au clavier (flèches, Page préc./suiv., Début/Fin), Échap ferme et rend le focus.

const MONTHS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const DAYS_SUN_FIRST = ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."];
// Premier jour de la semaine du site (Paramètres → Général) : index JavaScript de getDay() (0 = dimanche)
const WEEK_START = { monday: 1, sunday: 0, saturday: 6 };
const pad = (n) => String(n).padStart(2, "0");
// « AAAA-MM-JJTHH:MM » ↔ composantes locales (jamais d'objet Date en UTC : pas de décalage de jour)
export const parseLocal = (v) => { const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(String(v || "")); return m ? { y: +m[1], mo: +m[2] - 1, d: +m[3], h: +m[4], mi: +m[5] } : null; };
export const formatLocal = ({ y, mo, d, h, mi }) => `${y}-${pad(mo + 1)}-${pad(d)}T${pad(h)}:${pad(mi)}`;
const sameDay = (a, b) => a && b && a.y === b.y && a.mo === b.mo && a.d === b.d;
const todayParts = () => { const n = new Date(); return { y: n.getFullYear(), mo: n.getMonth(), d: n.getDate(), h: n.getHours(), mi: n.getMinutes() }; };
export const describe = (v) => {
  const p = parseLocal(v);
  if (!p) return "";
  const date = new Date(p.y, p.mo, p.d, p.h, p.mi);
  return `${date.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "long", year: "numeric" })} à ${pad(p.h)} h ${pad(p.mi)}`;
};
export const timeZoneLabel = () => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone.replace(/_/g, " "); } catch { return "heure locale"; } };

// input : champ existant (sa valeur est la source de vérité) ; empty : texte affiché quand il est vide
export function attachDatePicker(input, { empty = "Immédiatement", label = "Date de publication", onChange = () => {}, weekStart = "monday" } = {}) {
  const startIdx = Object.hasOwn(WEEK_START, weekStart) ? WEEK_START[weekStart] : 1;
  const DAYS = Array.from({ length: 7 }, (_, i) => DAYS_SUN_FIRST[(startIdx + i) % 7]);
  const weekdayIndex = (date) => (date.getDay() - startIdx + 7) % 7; // 0 = premier jour affiché
  const trigger = document.createElement("button");
  trigger.type = "button";
  trigger.className = "kdp-trigger";
  trigger.setAttribute("aria-haspopup", "dialog");
  trigger.setAttribute("aria-expanded", "false");
  // Le libellé du champ désigne désormais le bouton (y compris avant l'insertion du panneau dans la page)
  if (input.id) { trigger.id = `${input.id}-picker`; const scope = input.getRootNode(); (scope.querySelectorAll ? scope : document).querySelectorAll(`label[for="${input.id}"]`).forEach((l) => l.setAttribute("for", trigger.id)); }
  const text = document.createElement("span");
  const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  icon.setAttribute("viewBox", "0 0 24 24"); icon.setAttribute("width", "18"); icon.setAttribute("height", "18"); icon.setAttribute("aria-hidden", "true");
  icon.innerHTML = '<path fill="currentColor" d="M7 3v2H5.5A1.5 1.5 0 0 0 4 6.5v12A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5v-12A1.5 1.5 0 0 0 18.5 5H17V3h-1.5v2h-7V3H7Zm-1.5 6h13v9.5h-13V9Zm2 2v2h2v-2h-2Zm4 0v2h2v-2h-2Zm4 0v2h2v-2h-2Z"/>';
  trigger.append(text, icon);
  input.type = "hidden";
  input.after(trigger);
  const render = () => { const v = input.value; text.textContent = v ? describe(v) : empty; trigger.classList.toggle("is-empty", !v); trigger.setAttribute("aria-label", `${label} : ${v ? describe(v) : empty}. Modifier`); };
  const set = (v) => { input.value = v; render(); input.dispatchEvent(new Event("change", { bubbles: true })); onChange(v); };
  render();

  let pop = null;
  let view = null; // mois affiché
  let focusDay = null;
  const close = (refocus = true) => {
    if (!pop) return;
    pop.remove(); pop = null;
    trigger.setAttribute("aria-expanded", "false");
    document.removeEventListener("pointerdown", outside, true);
    window.removeEventListener("resize", place);
    if (refocus) trigger.focus();
  };
  const outside = (e) => { if (pop && !pop.contains(e.target) && e.target !== trigger && !trigger.contains(e.target)) close(false); };
  function place() {
    if (!pop) return;
    const r = trigger.getBoundingClientRect();
    const w = pop.offsetWidth, h = pop.offsetHeight;
    const vw = document.documentElement.clientWidth, vh = window.innerHeight;
    if (vw < 520) { pop.classList.add("is-sheet"); pop.style.left = ""; pop.style.top = ""; return; }
    pop.classList.remove("is-sheet");
    let left = Math.min(Math.max(8, r.right - w), vw - w - 8);
    let top = r.bottom + 6;
    if (top + h > vh - 8) top = r.top - h - 6 >= 8 ? r.top - h - 6 : Math.max(8, vh - h - 8); // au-dessus s'il manque de place
    pop.style.left = `${left}px`; pop.style.top = `${top}px`;
  }
  function current() { return parseLocal(input.value); }
  function draw() {
    const cur = current();
    const today = todayParts();
    pop.querySelector("[data-kdp-title]").textContent = `${MONTHS[view.mo]} ${view.y}`;
    const grid = pop.querySelector("[data-kdp-grid]");
    grid.replaceChildren();
    const first = new Date(view.y, view.mo, 1);
    const offset = weekdayIndex(first); // la semaine commence le jour choisi dans les réglages du site
    const start = new Date(view.y, view.mo, 1 - offset);
    for (let w = 0; w < 6; w++) {
      const row = document.createElement("div");
      row.setAttribute("role", "row");
      row.className = "kdp-row";
      for (let i = 0; i < 7; i++) {
        const day = new Date(start.getFullYear(), start.getMonth(), start.getDate() + w * 7 + i);
        const p = { y: day.getFullYear(), mo: day.getMonth(), d: day.getDate() };
        const b = document.createElement("button");
        b.type = "button";
        b.className = "kdp-day";
        b.textContent = String(p.d);
        b.dataset.date = `${p.y}-${pad(p.mo + 1)}-${pad(p.d)}`;
        b.setAttribute("role", "gridcell");
        b.setAttribute("aria-label", day.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }));
        if (p.mo !== view.mo) b.classList.add("is-outside");
        if (sameDay(p, today)) { b.classList.add("is-today"); b.setAttribute("aria-current", "date"); }
        const selected = sameDay(p, cur);
        b.setAttribute("aria-selected", String(selected));
        if (selected) b.classList.add("is-selected");
        b.tabIndex = sameDay(p, focusDay) ? 0 : -1;
        b.addEventListener("click", () => pickDay(p));
        row.append(b);
      }
      grid.append(row);
    }
    const t = cur || { h: hourSel().value ? +hourSel().value : 9, mi: minSel().value ? +minSel().value : 0 };
    syncTime(t.h, t.mi);
  }
  const hourSel = () => pop.querySelector("[data-kdp-hour]");
  const minSel = () => pop.querySelector("[data-kdp-minute]");
  function syncTime(hh, mm) {
    hourSel().value = pad(hh);
    const ms = minSel();
    if (![...ms.options].some((o) => o.value === pad(mm))) { const o = document.createElement("option"); o.value = pad(mm); o.textContent = pad(mm); ms.append(o); [...ms.options].sort((a, b) => a.value - b.value).forEach((x) => ms.append(x)); }
    ms.value = pad(mm);
  }
  function pickDay(p) {
    const cur = current();
    const h = cur ? cur.h : +hourSel().value, mi = cur ? cur.mi : +minSel().value;
    focusDay = p;
    set(formatLocal({ ...p, h, mi }));
    view = { y: p.y, mo: p.mo };
    draw();
    pop.querySelector(".kdp-day[tabindex='0']")?.focus();
  }
  function moveFocus(days, monthDelta = 0) {
    const base = focusDay || current() || todayParts();
    const d = monthDelta ? new Date(base.y, base.mo + monthDelta, Math.min(base.d, new Date(base.y, base.mo + monthDelta + 1, 0).getDate())) : new Date(base.y, base.mo, base.d + days);
    focusDay = { y: d.getFullYear(), mo: d.getMonth(), d: d.getDate() };
    view = { y: focusDay.y, mo: focusDay.mo };
    draw();
    pop.querySelector(".kdp-day[tabindex='0']")?.focus();
  }
  function open() {
    if (pop) { close(); return; }
    const cur = current();
    const base = cur || todayParts();
    view = { y: base.y, mo: base.mo };
    focusDay = { y: base.y, mo: base.mo, d: base.d };
    pop = document.createElement("div");
    pop.className = "kdp";
    pop.setAttribute("role", "dialog");
    pop.setAttribute("aria-label", label);
    const hours = Array.from({ length: 24 }, (_, i) => `<option value="${pad(i)}">${pad(i)}</option>`).join("");
    const minutes = Array.from({ length: 12 }, (_, i) => `<option value="${pad(i * 5)}">${pad(i * 5)}</option>`).join("");
    pop.innerHTML = `
      <div class="kdp-head">
        <button type="button" class="kdp-nav" data-kdp-prev aria-label="Mois précédent"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M14.6 7.4 13.2 6l-6 6 6 6 1.4-1.4L10 12z"/></svg></button>
        <p class="kdp-title" data-kdp-title aria-live="polite"></p>
        <button type="button" class="kdp-nav" data-kdp-next aria-label="Mois suivant"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M9.4 7.4 10.8 6l6 6-6 6-1.4-1.4L14 12z"/></svg></button>
      </div>
      <div class="kdp-week" aria-hidden="true">${DAYS.map((d) => `<span>${d}</span>`).join("")}</div>
      <div class="kdp-grid" role="grid" data-kdp-grid></div>
      <div class="kdp-time">
        <span class="kdp-time-label">Heure</span>
        <label class="sr-only" for="kdp-h">Heure</label><select id="kdp-h" data-kdp-hour>${hours}</select>
        <span aria-hidden="true">:</span>
        <label class="sr-only" for="kdp-m">Minutes</label><select id="kdp-m" data-kdp-minute>${minutes}</select>
        <span class="kdp-tz" title="Fuseau horaire de cet appareil">${timeZoneLabel()}</span>
      </div>
      <div class="kdp-foot">
        <button type="button" class="kdp-link" data-kdp-clear>Effacer</button>
        <span class="kdp-foot-right"><button type="button" class="kdp-link" data-kdp-today>Aujourd'hui</button><button type="button" class="kdp-ok" data-kdp-close>OK</button></span>
      </div>`;
    document.body.append(pop);
    pop.querySelector("[data-kdp-prev]").addEventListener("click", () => { view = view.mo === 0 ? { y: view.y - 1, mo: 11 } : { y: view.y, mo: view.mo - 1 }; draw(); });
    pop.querySelector("[data-kdp-next]").addEventListener("click", () => { view = view.mo === 11 ? { y: view.y + 1, mo: 0 } : { y: view.y, mo: view.mo + 1 }; draw(); });
    const timeChanged = () => {
      const cur = current();
      const base = cur || todayParts(); // une heure choisie sans date : la date du jour
      set(formatLocal({ y: base.y, mo: base.mo, d: base.d, h: +hourSel().value, mi: +minSel().value }));
      if (!cur) { view = { y: base.y, mo: base.mo }; focusDay = base; draw(); }
    };
    hourSel().addEventListener("change", timeChanged);
    minSel().addEventListener("change", timeChanged);
    pop.querySelector("[data-kdp-clear]").addEventListener("click", () => { set(""); draw(); });
    pop.querySelector("[data-kdp-today]").addEventListener("click", () => {
      const t = todayParts();
      const cur = current();
      // Aujourd'hui : garde l'heure déjà choisie ; sinon l'heure actuelle arrondie aux 5 minutes suivantes
      let h = cur ? cur.h : t.h, mi = cur ? cur.mi : Math.ceil((t.mi + 1) / 5) * 5;
      if (mi >= 60) { mi = 0; h = (h + 1) % 24; }
      focusDay = t; view = { y: t.y, mo: t.mo };
      set(formatLocal({ y: t.y, mo: t.mo, d: t.d, h, mi }));
      draw();
    });
    pop.querySelector("[data-kdp-close]").addEventListener("click", () => close());
    pop.addEventListener("keydown", (e) => {
      if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); close(); return; }
      if (!e.target.classList.contains("kdp-day")) return;
      const keys = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
      if (keys[e.key]) { e.preventDefault(); moveFocus(keys[e.key]); }
      else if (e.key === "PageUp") { e.preventDefault(); moveFocus(0, -1); }
      else if (e.key === "PageDown") { e.preventDefault(); moveFocus(0, 1); }
      else if (e.key === "Home") { e.preventDefault(); const base = focusDay; const wd = weekdayIndex(new Date(base.y, base.mo, base.d)); moveFocus(-wd); }
      else if (e.key === "End") { e.preventDefault(); const base = focusDay; const wd = weekdayIndex(new Date(base.y, base.mo, base.d)); moveFocus(6 - wd); }
    });
    if (!cur) syncTime(9, 0); // aucune date : 09:00 proposé par défaut
    draw();
    trigger.setAttribute("aria-expanded", "true");
    place();
    window.addEventListener("resize", place);
    setTimeout(() => document.addEventListener("pointerdown", outside, true), 0);
    pop.querySelector(".kdp-day[tabindex='0']")?.focus();
  }
  trigger.addEventListener("click", open);
  input.addEventListener("kdp:refresh", render);
  return { trigger, render, close, set };
}
