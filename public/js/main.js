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

  initBuilderDragAndDrop();
});

function getDragAfterElement(container, y, selector) {
  const elements = [...container.querySelectorAll(selector)];
  return elements.reduce(
    (closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) return { offset, element: child };
      return closest;
    },
    { offset: Number.NEGATIVE_INFINITY, element: null }
  ).element;
}

// Constructeur de formation : glisser-déposer des chapitres et des sous-chapitres
function initBuilderDragAndDrop() {
  const outline = document.querySelector(".builder-outline");
  const sectionList = document.getElementById("sectionList");
  if (!outline || !sectionList) return;

  const courseId = outline.dataset.courseId;
  let draggedChapter = null;
  let draggedLesson = null;

  sectionList.querySelectorAll(".chapter-block").forEach((block) => {
    block.addEventListener("dragstart", (e) => {
      if (e.target.closest(".lesson-item")) return;
      draggedChapter = block;
      block.classList.add("dragging");
      e.dataTransfer.effectAllowed = "move";
    });
    block.addEventListener("dragend", () => {
      block.classList.remove("dragging");
      draggedChapter = null;
    });
  });

  sectionList.addEventListener("dragover", (e) => {
    if (!draggedChapter) return;
    e.preventDefault();
    const after = getDragAfterElement(sectionList, e.clientY, ".chapter-block:not(.dragging)");
    if (after == null) sectionList.appendChild(draggedChapter);
    else sectionList.insertBefore(draggedChapter, after);
  });

  sectionList.addEventListener("drop", (e) => {
    if (!draggedChapter) return;
    e.preventDefault();
    const order = [...sectionList.querySelectorAll(".chapter-block")].map((b) => b.dataset.sectionId);
    fetch(`/formateur/cours/${courseId}/sections/reorder`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order }),
    }).then(() => location.reload());
  });

  document.querySelectorAll(".lesson-item").forEach((item) => {
    item.addEventListener("dragstart", (e) => {
      draggedLesson = item;
      item.classList.add("dragging");
      e.dataTransfer.effectAllowed = "move";
      e.stopPropagation();
    });
    item.addEventListener("dragend", () => {
      item.classList.remove("dragging");
      draggedLesson = null;
    });
  });

  document.querySelectorAll(".lesson-list").forEach((list) => {
    list.addEventListener("dragover", (e) => {
      if (!draggedLesson) return;
      e.preventDefault();
      e.stopPropagation();
      list.classList.add("drag-over");
      const after = getDragAfterElement(list, e.clientY, ".lesson-item:not(.dragging)");
      if (after == null) list.appendChild(draggedLesson);
      else list.insertBefore(draggedLesson, after);
    });
    list.addEventListener("dragleave", () => list.classList.remove("drag-over"));
    list.addEventListener("drop", (e) => {
      if (!draggedLesson) return;
      e.preventDefault();
      e.stopPropagation();
      list.classList.remove("drag-over");
      const sectionId = list.dataset.sectionId;
      const order = [...list.querySelectorAll(".lesson-item")].map((a) => a.dataset.lessonId);
      fetch(`/formateur/sections/${sectionId}/lecons/reorder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order }),
      }).then(() => location.reload());
    });
  });
}
