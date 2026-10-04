// Pop-up d'inscription (jalon M5 — Capture, partie 2). Chargé sur chaque page publique ; ne fait rien s'il n'y a
// aucun pop-up actif, ou si la personne l'a déjà vu récemment (mémorisé dans son navigateur, jamais sur le serveur).
// Sans dépendance, comme le reste du site (public/js/main.js).
(function () {
  "use strict";
  // Fuseau horaire du navigateur, transmis avec l'inscription (envoi des e-mails à l'heure locale)
  function browserTimeZone() { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || ""; } catch (e) { return ""; } }
  if (location.pathname.indexOf("/f/") === 0 || location.pathname.indexOf("/marketing") === 0) return;

  function ready(fn) {
    if (document.readyState !== "loading") fn();
    else document.addEventListener("DOMContentLoaded", fn);
  }

  function esc(value) {
    var d = document.createElement("div");
    d.textContent = value == null ? "" : String(value);
    return d.innerHTML;
  }

  function remember(key) {
    try { localStorage.setItem(key, String(Date.now())); } catch (e) { /* stockage indisponible (navigation privée…) : tant pis, on ne mémorise pas */ }
  }

  function alreadyDismissedRecently(key, days) {
    try {
      var last = Number(localStorage.getItem(key)) || 0;
      return last > 0 && Date.now() - last < days * 86400000;
    } catch (e) {
      return false;
    }
  }

  // Valeur placée DANS un attribut (value="…", name="…") : esc() n'échappe pas les guillemets, on les ajoute ici
  function escAttr(value) {
    return esc(value).replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  // Champs standard (texte) et propriétés personnalisées (type : text, number, date, boolean, select), comme la page /f/
  function fieldsHtml(fields) {
    return (fields || [])
      .map(function (f) {
        var name = escAttr(f.key);
        if (f.type === "boolean") {
          return '<label class="checkbox-row"><input type="checkbox" name="' + name + '" value="oui"> ' + esc(f.label) + "</label>";
        }
        if (f.type === "select") {
          var options = (f.options || []).map(function (o) { return '<option value="' + escAttr(o) + '">' + esc(o) + "</option>"; }).join("");
          return '<div class="field-group"><label>' + esc(f.label) + '<select name="' + name + '"><option value="">—</option>' + options + "</select></label></div>";
        }
        var type = f.type === "number" ? "number" : f.type === "date" ? "date" : "text";
        return '<div class="field-group"><label>' + esc(f.label) + '<input type="' + type + '" name="' + name + '"' + (type === "text" ? ' maxlength="500"' : type === "number" ? ' step="any"' : "") + "></label></div>";
      })
      .join("");
  }

  function show(popup, key) {
    if (document.getElementById("mk-popup-overlay")) return;
    var overlay = document.createElement("div");
    overlay.id = "mk-popup-overlay";
    overlay.className = "mk-popup-overlay";
    overlay.innerHTML =
      '<div class="mk-popup-card" role="dialog" aria-modal="true" aria-labelledby="mk-popup-title">' +
      '<button type="button" class="mk-popup-close" aria-label="Fermer">&times;</button>' +
      '<div class="mk-popup-body">' +
      '<h2 id="mk-popup-title">' + esc(popup.name) + "</h2>" +
      '<div class="mk-popup-error" hidden></div>' +
      '<form class="mk-popup-form" novalidate>' +
      '<div class="hp-field" aria-hidden="true"><label>Ne pas remplir<input type="text" name="website" tabindex="-1" autocomplete="off"></label></div>' +
      '<input type="hidden" name="tz" value="' + esc(browserTimeZone()) + '">' +
      '<div class="field-group"><label>Adresse e-mail<input type="email" name="email" required></label></div>' +
      fieldsHtml(popup.fields) +
      '<label class="checkbox-row optin-row"><input type="checkbox" name="consent" value="1" required> ' + esc(popup.consentText) + "</label>" +
      '<button type="submit" class="btn btn-primary btn-block">S\'inscrire</button>' +
      "</form>" +
      "</div>" +
      "</div>";
    document.body.appendChild(overlay);
    document.body.classList.add("modal-open");

    var closed = false;
    function close() {
      if (closed) return;
      closed = true;
      overlay.remove();
      document.body.classList.remove("modal-open");
      document.removeEventListener("keydown", onKeydown);
      remember(key); // fermer compte comme « vu » : ne pas revenir tout de suite avec le même pop-up
    }
    function onKeydown(e) {
      if (e.key === "Escape") close();
    }
    overlay.addEventListener("click", function (e) { if (e.target === overlay) close(); });
    overlay.querySelector(".mk-popup-close").addEventListener("click", close);
    document.addEventListener("keydown", onKeydown);

    var formEl = overlay.querySelector(".mk-popup-form");
    var errorEl = overlay.querySelector(".mk-popup-error");
    formEl.querySelector('input[name="email"]').focus();
    formEl.addEventListener("submit", function (e) {
      e.preventDefault();
      errorEl.hidden = true;
      var body = new URLSearchParams(new FormData(formEl)).toString();
      fetch("/f/" + popup.slug, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded", "X-Mk-Popup": "1" }, body: body })
        .then(function (r) { return r.json().then(function (data) { return { ok: r.ok, data: data }; }); })
        .then(function (res) {
          if (!res.ok || !res.data || !res.data.ok) {
            errorEl.textContent = (res.data && res.data.error) || "Inscription impossible pour le moment.";
            errorEl.hidden = false;
            return;
          }
          remember(key);
          overlay.querySelector(".mk-popup-body").innerHTML =
            "<h2>Merci !</h2><p>" + esc(res.data.thankYouText && res.data.thankYouText.trim() ? res.data.thankYouText : "Votre inscription est enregistrée.") + "</p>";
          setTimeout(close, 2500);
        })
        .catch(function () {
          errorEl.textContent = "Une erreur est survenue. Réessayez.";
          errorEl.hidden = false;
        });
    });
  }

  function scheduleTrigger(popup, key) {
    if (popup.trigger === "scroll") {
      var handled = false;
      window.addEventListener(
        "scroll",
        function onScroll() {
          if (handled) return;
          var doc = document.documentElement;
          var scrollable = doc.scrollHeight - doc.clientHeight;
          var pct = scrollable > 0 ? (doc.scrollTop / scrollable) * 100 : 100;
          if (pct >= (popup.triggerValue || 50)) {
            handled = true;
            window.removeEventListener("scroll", onScroll);
            show(popup, key);
          }
        },
        { passive: true }
      );
    } else if (popup.trigger === "exit") {
      var fired = false;
      document.addEventListener("mouseleave", function onLeave(e) {
        if (fired || e.clientY > 0) return;
        fired = true;
        document.removeEventListener("mouseleave", onLeave);
        show(popup, key);
      });
    } else {
      setTimeout(function () { show(popup, key); }, Math.max(1, popup.triggerValue || 8) * 1000);
    }
  }

  ready(function () {
    fetch("/f/popup.json", { headers: { Accept: "application/json" } })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        var popup = data && data.form;
        if (!popup) return;
        var key = "mk_popup_" + popup.slug;
        if (alreadyDismissedRecently(key, popup.frequencyDays || 7)) return;
        scheduleTrigger(popup, key);
      })
      .catch(function () { /* le pop-up est une amélioration facultative : une panne réseau ne doit rien casser sur la page */ });
  });
})();
