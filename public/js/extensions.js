// Catalogue des extensions : recherche, filtres, tri et présentation (Galerie / Liste) sans rechargement. Les données sont celles du serveur (déjà dans la page) ;
// la présentation choisie est mémorisée dans ce navigateur (localStorage, facultatif). Aucune requête réseau.
(() => {
  // Commun à tous les écrans Extensions : un envoi n'est possible qu'une fois (bouton inactif + « En cours… » tant que le serveur n'a pas répondu) ; le sélecteur de site recharge l'écran.
  document.querySelectorAll("form").forEach((f) => {
    if (f.method.toLowerCase() !== "post") return;
    f.addEventListener("submit", (e) => {
      if (f.dataset.sent === "1") { e.preventDefault(); return; }
      f.dataset.sent = "1"; f.setAttribute("aria-busy", "true");
      f.querySelectorAll("button[type=submit]").forEach((b) => { b.disabled = true; b.dataset.label = b.textContent; b.textContent = "En cours…"; });
    });
  });
  document.querySelectorAll("[data-xc-site]").forEach((sel) => sel.addEventListener("change", () => sel.form.submit()));
  const root = document.querySelector("[data-xc]"); if (!root) return;
  const grid = root.querySelector("[data-xc-grid]");
  const items = [...grid.querySelectorAll("[data-xc-item]")];
  const q = root.querySelector("[data-xc-search]"), cat = root.querySelector("[data-xc-cat]"), st = root.querySelector("[data-xc-state]"), so = root.querySelector("[data-xc-sort]");
  const count = root.querySelector("[data-xc-count]"), empty = root.querySelector("[data-xc-empty]");
  const preset = root.dataset.preset;
  const store = { get: (k) => { try { return localStorage.getItem(k); } catch { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* facultatif */ } } };
  const semver = (v) => v.split(".").map(Number);
  const cmpVer = (a, b) => { const x = semver(a), y = semver(b); for (let i = 0; i < 3; i++) if ((x[i] || 0) !== (y[i] || 0)) return (y[i] || 0) - (x[i] || 0); return 0; };

  function setView(v, remember) {
    const view = v === "list" ? "list" : "gallery";
    grid.dataset.view = view;
    root.querySelectorAll("[data-xc-view]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.xcView === view)));
    if (remember) store.set("kxExtView", view);
  }
  function apply() {
    const text = (q.value || "").trim().toLowerCase();
    const sortKey = so.value;
    const ordered = [...items].sort((a, b) => sortKey === "added" ? (b.dataset.added || "").localeCompare(a.dataset.added || "") || a.dataset.name.localeCompare(b.dataset.name, "fr")
      : sortKey === "version" ? cmpVer(a.dataset.version, b.dataset.version) || a.dataset.name.localeCompare(b.dataset.name, "fr") : a.dataset.name.localeCompare(b.dataset.name, "fr"));
    let shown = 0;
    for (const li of ordered) {
      const stateWanted = preset || (st ? st.value : "");
      const ok = (!text || li.dataset.text.includes(text)) && (!cat.value || li.dataset.cat === cat.value) && (!stateWanted || li.dataset.state === stateWanted);
      li.hidden = !ok; if (ok) shown++;
      grid.appendChild(li);
    }
    count.textContent = `${shown} extension${shown > 1 ? "s" : ""} sur ${items.length}`;
    empty.hidden = shown !== 0; grid.hidden = shown === 0;
  }
  root.querySelectorAll("[data-xc-view]").forEach((b) => b.addEventListener("click", () => setView(b.dataset.xcView, true)));
  [q, cat, st, so].filter(Boolean).forEach((el) => el.addEventListener(el === q ? "input" : "change", apply));
  root.querySelector("[data-xc-reset]")?.addEventListener("click", () => { q.value = ""; cat.value = ""; if (st) st.value = ""; so.value = "name"; apply(); });
  setView(store.get("kxExtView"), false);
  apply();
})();
