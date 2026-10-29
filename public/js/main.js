// KOLAKISA — interactions front-end légères (aucune dépendance externe)

document.addEventListener("DOMContentLoaded", () => {
  // Fuseau horaire du navigateur (ex. « Africa/Kinshasa ») transmis par les formulaires d'inscription et de connexion :
  // sert uniquement à envoyer les e-mails à l'heure locale de la personne (Marketing → heure d'envoi)
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    document.querySelectorAll("input[data-tz]").forEach((input) => { input.value = tz; });
  } catch (e) { /* navigateur sans Intl : fuseau inconnu, rien n'est envoyé */ }

  // Menu mobile
  const openBtn = document.getElementById("openMenuBtn");
  const nav = document.getElementById("headerNav");
  const overlay = document.getElementById("mobileNavOverlay");

  if (openBtn && nav && overlay) {
    const setMenu = (open) => {
      nav.classList.toggle("is-open", open);
      overlay.hidden = !open;
      openBtn.setAttribute("aria-expanded", String(open));
      openBtn.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");
      if (open) {
        // Le focus entre dans le menu (champ de recherche), pour les utilisateurs du clavier et des lecteurs d'écran
        const first = nav.querySelector("input, a, button");
        if (first) setTimeout(() => first.focus(), 50);
      } else {
        openBtn.focus();
      }
    };
    openBtn.addEventListener("click", () => setMenu(!nav.classList.contains("is-open")));
    overlay.addEventListener("click", () => setMenu(false));
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && nav.classList.contains("is-open")) setMenu(false);
    });
  }

  // Accordéon du programme (page formation + lecteur de leçon)
  document.querySelectorAll(".accordion-toggle").forEach((btn) => {
    btn.addEventListener("click", () => {
      const item = btn.closest(".accordion-item");
      if (!item) return;
      item.classList.toggle("is-open");
      btn.setAttribute("aria-expanded", String(item.classList.contains("is-open"))); // état annoncé aux lecteurs d'écran
    });
  });

  // « Tout déplier / Tout replier » sur le programme de la page formation
  const toggleAll = document.getElementById("toggleAllSections");
  if (toggleAll) {
    toggleAll.addEventListener("click", () => {
      const items = document.querySelectorAll(".course-main .accordion-item");
      const openAll = [...items].some((item) => !item.classList.contains("is-open"));
      items.forEach((item) => {
        item.classList.toggle("is-open", openAll);
        const toggle = item.querySelector(".accordion-toggle");
        if (toggle) toggle.setAttribute("aria-expanded", String(openAll));
      });
      toggleAll.textContent = openAll ? "Tout replier" : "Tout déplier";
    });
  }

  // « Voir le plan du cours » : fenêtre native <dialog> (Échap, focus et lecteurs d'écran gérés par le navigateur).
  // Le plan est rechargé à chaque ouverture : il reflète toujours les chapitres et leçons enregistrés.
  const planBtn = document.querySelector("[data-plan-url]");
  const planDialog = document.getElementById("planDialog");
  if (planBtn && planDialog && typeof planDialog.showModal === "function") {
    const planBody = document.getElementById("planDialogBody");
    planBtn.addEventListener("click", () => {
      planDialog.showModal();
      document.body.classList.add("modal-open");
      planBody.scrollTop = 0;
      if (!planBody.firstChild) planBody.textContent = "Chargement du plan…";
      fetch(planBtn.dataset.planUrl, { credentials: "same-origin", headers: { Accept: "text/html" } })
        .then((res) => {
          if (!res.ok) throw new Error("HTTP " + res.status);
          return res.text();
        })
        .then((html) => {
          planBody.innerHTML = html; // fragment produit par notre serveur : les titres y sont déjà échappés
        })
        .catch(() => {
          planBody.textContent = "Le plan n'a pas pu être chargé. Fermez cette fenêtre et réessayez.";
        });
    });
    planDialog.querySelector("[data-plan-close]").addEventListener("click", () => planDialog.close());
    // Un clic sur le fond assombri ferme aussi la fenêtre
    planDialog.addEventListener("click", (e) => {
      if (e.target === planDialog) planDialog.close();
    });
    planDialog.addEventListener("close", () => document.body.classList.remove("modal-open"));
  }

  // « Voir plus d'avis » : charge les avis suivants sans recharger la page (sans JavaScript, le lien recharge la page)
  const reviewList = document.getElementById("avisListe");
  if (reviewList) {
    reviewList.addEventListener("click", async (event) => {
      const link = event.target.closest("[data-more-reviews]");
      if (!link) return;
      event.preventDefault();
      link.setAttribute("aria-busy", "true");
      try {
        const res = await fetch(link.href, { credentials: "same-origin" });
        if (!res.ok) throw new Error("HTTP " + res.status);
        const doc = new DOMParser().parseFromString(await res.text(), "text/html");
        const fresh = doc.getElementById("avisListe");
        if (!fresh) throw new Error("liste introuvable");
        const before = reviewList.querySelectorAll(".review-item").length;
        reviewList.innerHTML = fresh.innerHTML; // HTML produit par notre serveur : les textes y sont déjà échappés
        const firstNew = reviewList.querySelectorAll(".review-item")[before];
        if (firstNew) {
          firstNew.setAttribute("tabindex", "-1"); // le clavier reprend au premier nouvel avis
          firstNew.focus();
        }
      } catch {
        window.location.href = link.href;
      }
    });
  }

  // Diaporama de l'accueil : fondu toutes les 6 s, photos suivantes chargées après la page, pause possible
  const heroSlides = document.querySelector("[data-hero-slides]");
  if (heroSlides) {
    const slides = [...heroSlides.querySelectorAll(".hero-slide")];
    const pauseBtn = document.querySelector("[data-hero-pause]");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const INTERVAL = Number(heroSlides.closest("[data-hero]").dataset.interval) || 6000;
    let current = 0;
    let timer = null;
    let userPaused = false;

    const load = (img) => {
      if (!img.dataset.src) return;
      if (img.dataset.srcset) img.srcset = img.dataset.srcset;
      img.src = img.dataset.src;
      img.removeAttribute("data-src");
      img.removeAttribute("data-srcset");
    };
    const show = (i) => {
      slides[current].classList.remove("is-active");
      current = i;
      slides[current].classList.add("is-active");
    };
    // Passe à la prochaine photo déjà chargée (jamais d'image vide à l'écran)
    const next = () => {
      for (let k = 1; k < slides.length; k++) {
        const i = (current + k) % slides.length;
        if (slides[i].complete && slides[i].naturalWidth) return show(i);
      }
    };
    const start = () => {
      if (timer || userPaused || reduceMotion || document.hidden || slides.length < 2) return;
      timer = setInterval(next, INTERVAL);
    };
    const stop = () => {
      clearInterval(timer);
      timer = null;
    };
    const begin = () => {
      slides.slice(1).forEach(load);
      start();
    };
    if (document.readyState === "complete") begin();
    else window.addEventListener("load", begin);
    document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));

    if (pauseBtn) {
      if (reduceMotion) pauseBtn.hidden = true; // personne n'a besoin d'arrêter un diaporama qui ne tourne pas
      pauseBtn.addEventListener("click", () => {
        userPaused = !userPaused;
        pauseBtn.setAttribute("aria-pressed", String(userPaused));
        pauseBtn.setAttribute("aria-label", userPaused ? "Reprendre le diaporama" : "Mettre en pause le diaporama");
        if (userPaused) stop();
        else start();
      });
    }
  }

  // Sélecteur d'étoiles pour laisser un avis
  const starPicker = document.querySelector("[data-star-picker]");
  if (starPicker) {
    const input = starPicker.querySelector("input[name=rating]");
    const stars = [...starPicker.querySelectorAll(".star-choice")];
    const paint = (value) => {
      stars.forEach((s) => s.classList.toggle("is-filled", Number(s.dataset.value) <= value));
    };
    stars.forEach((star) => {
      star.addEventListener("click", () => {
        input.value = star.dataset.value;
        paint(Number(star.dataset.value));
      });
      star.addEventListener("mouseenter", () => paint(Number(star.dataset.value)));
    });
    starPicker.addEventListener("mouseleave", () => paint(Number(input.value)));
    paint(Number(input.value));
  }

  // Aperçu de la miniature avant envoi
  const thumbInput = document.querySelector("[data-thumbnail-input]");
  if (thumbInput) {
    thumbInput.addEventListener("change", () => {
      const preview = document.querySelector("[data-thumbnail-preview]");
      const file = thumbInput.files[0];
      if (preview && file) preview.src = URL.createObjectURL(file);
    });
  }

});


// Agrandissement des images d'article (lightbox) : un bouton « Agrandir » posé par le serveur (bloc Image / Galerie, option « Agrandir au clic »).
// Boîte de dialogue accessible : focus déplacé dedans puis rendu au bouton, Échap ferme, flèches pour passer d'une image à l'autre d'une galerie.
(() => {
  let box = null; let opener = null; let group = []; let index = 0;
  const full = (img) => {
    const set = (img.getAttribute("srcset") || "").split(",").map((x) => x.trim().split(/\s+/)).filter((x) => x[0]);
    const best = set.sort((a, b) => parseInt(b[1], 10) - parseInt(a[1], 10))[0];
    return (best && best[0]) || img.currentSrc || img.src;
  };
  function build() {
    box = document.createElement("div");
    box.className = "kb-lightbox"; box.hidden = true; box.setAttribute("role", "dialog"); box.setAttribute("aria-modal", "true"); box.setAttribute("aria-label", "Image agrandie");
    box.innerHTML = '<button type="button" class="kb-lightbox-close" aria-label="Fermer">×</button><button type="button" class="kb-lightbox-nav" data-dir="-1" aria-label="Image précédente">‹</button><figure><img alt=""><figcaption></figcaption></figure><button type="button" class="kb-lightbox-nav" data-dir="1" aria-label="Image suivante">›</button>';
    document.body.append(box);
    box.addEventListener("click", (e) => {
      if (e.target.closest(".kb-lightbox-close") || e.target === box) return close();
      const nav = e.target.closest(".kb-lightbox-nav");
      if (nav) show(index + Number(nav.dataset.dir));
    });
    box.addEventListener("keydown", (e) => {
      if (e.key === "Escape") { e.preventDefault(); close(); }
      else if (e.key === "ArrowLeft") show(index - 1);
      else if (e.key === "ArrowRight") show(index + 1);
      else if (e.key === "Tab") { const f = [...box.querySelectorAll("button:not([hidden])")]; const first = f[0]; const last = f[f.length - 1]; if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); } }
    });
  }
  function show(i) {
    if (!group.length) return;
    index = (i + group.length) % group.length;
    const fig = group[index].closest("figure");
    const img = group[index].querySelector("img");
    const view = box.querySelector("img");
    view.src = full(img); view.alt = img.alt || "";
    const cap = fig && fig.querySelector("figcaption");
    box.querySelector("figcaption").textContent = cap ? cap.textContent : "";
    for (const n of box.querySelectorAll(".kb-lightbox-nav")) n.hidden = group.length < 2;
  }
  function close() { box.hidden = true; document.documentElement.style.overflow = ""; if (opener) opener.focus(); }
  document.addEventListener("click", (e) => {
    const trigger = e.target.closest(".kb-lightbox-trigger");
    if (!trigger) return;
    e.preventDefault();
    if (!box) build();
    opener = trigger;
    const gallery = trigger.closest(".kb-gallery");
    group = gallery ? [...gallery.querySelectorAll(".kb-lightbox-trigger")] : [trigger];
    box.hidden = false; document.documentElement.style.overflow = "hidden";
    show(group.indexOf(trigger));
    box.querySelector(".kb-lightbox-close").focus();
  });
})();

// Onglets d'article (bloc « Onglets ») : sans JavaScript chaque onglet est une section titrée ; ici ils deviennent de vrais onglets (rôles ARIA, flèches, Début, Fin).
(() => {
  document.querySelectorAll(".kb-tabs[data-tabs]").forEach((group, g) => {
    const panels = [...group.querySelectorAll(":scope > .kb-tab-panel")];
    if (panels.length < 2 || group.dataset.ready) return;
    const list = document.createElement("div");
    list.className = "kb-tablist"; list.setAttribute("role", "tablist");
    const tabs = panels.map((panel, i) => {
      const title = panel.querySelector(":scope > .kb-tab-title");
      const tab = document.createElement("button");
      tab.type = "button"; tab.setAttribute("role", "tab"); tab.id = `kb-tab-${g}-${i}`; tab.setAttribute("aria-controls", panel.id);
      tab.textContent = title ? title.textContent : `Onglet ${i + 1}`;
      panel.setAttribute("role", "tabpanel"); panel.setAttribute("aria-labelledby", tab.id); panel.tabIndex = 0;
      list.append(tab);
      return tab;
    });
    const select = (i, focus) => {
      tabs.forEach((tab, k) => { const on = k === i; tab.setAttribute("aria-selected", String(on)); tab.tabIndex = on ? 0 : -1; panels[k].hidden = !on; });
      if (focus) tabs[i].focus();
    };
    list.addEventListener("click", (e) => { const i = tabs.indexOf(e.target.closest('[role="tab"]')); if (i >= 0) select(i, false); });
    list.addEventListener("keydown", (e) => {
      const at = tabs.indexOf(document.activeElement);
      if (at < 0) return;
      const to = { ArrowRight: (at + 1) % tabs.length, ArrowLeft: (at - 1 + tabs.length) % tabs.length, Home: 0, End: tabs.length - 1 }[e.key];
      if (to === undefined) return;
      e.preventDefault(); select(to, true);
    });
    group.insertBefore(list, group.firstChild);
    group.dataset.ready = "true";
    // Un lien d'ancre vers un titre d'un onglet masqué ouvre cet onglet
    const open = () => { const target = location.hash && document.getElementById(decodeURIComponent(location.hash.slice(1))); const panel = target && target.closest(".kb-tab-panel"); const i = panel ? panels.indexOf(panel) : -1; if (i >= 0 && group.contains(panel)) select(i, false); };
    select(0, false); open();
    window.addEventListener("hashchange", open);
  });
})();
