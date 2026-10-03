// KOLAKISA — suivi de lecture et notes personnelles (page de leçon, élèves inscrits uniquement).
//  - reprend la vidéo là où l'élève s'était arrêté ;
//  - enregistre la position toutes les 10 secondes, en pause et à la fin ;
//  - le serveur marque la leçon « terminée » à 90 % de la vidéo (sauf leçon avec quiz) ;
//  - sauvegarde automatiquement la note de l'élève.
// Lecteurs suivis : vidéos hébergées sur le site (balise <video>) et Bunny Stream (Player.js).
// YouTube et Vimeo ne sont pas suivis : l'élève utilise le bouton « Marquer comme terminée ».
(() => {
  const root = document.querySelector("[data-lesson-tracker]");
  const noteField = document.querySelector("[data-lesson-note]");
  if (!root && !noteField) return;

  const lessonId = (root || noteField).dataset.lessonId;
  const SEND_EVERY_MS = 10000;

  function post(path, body) {
    return fetch(`/apprendre/lecon/${lessonId}/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      keepalive: true, // la requête part même si l'élève quitte la page
      credentials: "same-origin",
    }).then((r) => (r.ok ? r.json() : null)).catch(() => null);
  }

  // ---------- Progression ----------
  let lastSent = 0;
  let alreadyCompleted = false;

  function markCompletedOnScreen() {
    if (alreadyCompleted) return;
    alreadyCompleted = true;
    const button = document.querySelector('.learn-title-row form[action$="/terminer"] button');
    if (button) {
      button.textContent = "✓ Terminée — revoir";
      button.className = "btn btn-secondary";
    }
    const current = document.querySelector(".lesson-row.is-current .lesson-icon");
    if (current) current.classList.add("lesson-check");
    const live = document.createElement("p");
    live.className = "sr-only";
    live.setAttribute("role", "status");
    live.textContent = "Leçon marquée comme terminée.";
    document.body.appendChild(live);
  }

  function report(position, duration, force) {
    const now = Date.now();
    if (!force && now - lastSent < SEND_EVERY_MS) return;
    if (!Number.isFinite(position) || !Number.isFinite(duration) || position < 0 || duration < 0) return;
    lastSent = now;
    post("progression", { position, duration }).then((result) => {
      if (result && result.completed) markCompletedOnScreen();
    });
  }

  const resumeAt = Number(root && root.dataset.resume) || 0;

  // Vidéo hébergée sur le site (ou fichier .mp4 distant)
  const video = root && root.querySelector("video");
  if (video) {
    video.addEventListener("loadedmetadata", () => {
      // On ne reprend pas dans les 3 dernières secondes : autant recommencer la vidéo
      if (resumeAt > 0 && resumeAt < video.duration - 3) video.currentTime = resumeAt;
    });
    video.addEventListener("timeupdate", () => report(video.currentTime, video.duration || 0, false));
    video.addEventListener("pause", () => report(video.currentTime, video.duration || 0, true));
    video.addEventListener("ended", () => report(video.duration || 0, video.duration || 0, true));
    window.addEventListener("pagehide", () => report(video.currentTime, video.duration || 0, true));
  }

  // Bunny Stream : bibliothèque Player.js fournie par Bunny (documentation « Playback control API »)
  const bunnyFrame = root && root.querySelector("iframe[data-bunny-player]");
  if (bunnyFrame) {
    const script = document.createElement("script");
    script.src = "https://assets.mediadelivery.net/playerjs/playerjs-latest.min.js";
    script.onload = () => {
      if (!window.playerjs) return;
      const player = new window.playerjs.Player(bunnyFrame);
      let lastPosition = 0;
      let lastDuration = 0;
      player.on("ready", () => {
        if (resumeAt > 0 && player.supports("method", "setCurrentTime")) player.setCurrentTime(resumeAt);
      });
      player.on("timeupdate", (data) => {
        lastPosition = data.seconds;
        lastDuration = data.duration;
        report(data.seconds, data.duration, false);
      });
      player.on("pause", () => report(lastPosition, lastDuration, true));
      player.on("ended", () => report(lastDuration, lastDuration, true));
      window.addEventListener("pagehide", () => report(lastPosition, lastDuration, true));
    };
    document.head.appendChild(script);
  }

  // ---------- Notes ----------
  if (noteField) {
    const status = document.querySelector("[data-note-status]");
    let timer = null;
    let lastSaved = noteField.value;

    const setStatus = (text) => {
      if (status) status.textContent = text;
    };
    const save = () => {
      if (noteField.value === lastSaved) return;
      const value = noteField.value;
      setStatus("Enregistrement…");
      post("note", { content: value }).then((result) => {
        if (result && result.saved) {
          lastSaved = value;
          setStatus("Enregistré");
        } else {
          setStatus("Échec de l'enregistrement : vos notes sont conservées dans la page, réessayez dans un instant.");
        }
      });
    };

    noteField.addEventListener("input", () => {
      setStatus("");
      clearTimeout(timer);
      timer = setTimeout(save, 800);
    });
    noteField.addEventListener("blur", () => {
      clearTimeout(timer);
      save();
    });
    window.addEventListener("pagehide", () => {
      clearTimeout(timer);
      save();
    });
  }
})();
