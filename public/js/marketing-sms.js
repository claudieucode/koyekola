// Éditeur de campagne SMS : compteur de caractères et de SMS facturés EN DIRECT, aperçu sur un téléphone, insertion
// du prénom/nom, remplacement des accents coûteux, choix de la date d'envoi. Même calcul que src/marketing/sms/text.js
// et render.js (le serveur refait toujours le calcul : ceci n'est qu'une aide à l'écriture).
(function () {
  "use strict";
  var body = document.querySelector("[data-sms-body]");
  if (body) initEditor(body);
  initLaunch();

  function initEditor(textarea) {
    var GSM = "@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà";
    var EXT = "^{}\\[~]|€\f";
    var REPLACE = { "ê": "e", "ë": "e", "â": "a", "á": "a", "ã": "a", "î": "i", "ï": "i", "í": "i", "ô": "o", "ó": "o", "õ": "o", "û": "u", "ú": "u", "ç": "c", "ÿ": "y", "œ": "oe", "Œ": "OE",
      "À": "A", "Â": "A", "È": "E", "Ê": "E", "Ë": "E", "Î": "I", "Ï": "I", "Ô": "O", "Û": "U", "Ù": "U", "’": "'", "‘": "'", "“": "\"", "”": "\"", "«": "\"", "»": "\"", "–": "-", "—": "-", "…": "...", " ": " ", " ": " " };
    var TAG = /\{\{\s*([a-zA-Zéè_]+)\s*(?:\|([^{}]{0,40}))?\}\}/g;
    var URL_RE = /https?:\/\/[^\s<>"']+[^\s<>"'.,;:!?)\]]/g;
    var SAMPLE = { prenom: "Marie", nom: "Kabila" };
    var base = (textarea.getAttribute("data-base-url") || "").replace(/\/+$/, "");
    var short = base + "/s/xxxxxxxx";
    var maxSegments = Number(textarea.getAttribute("data-max-segments")) || 3;
    var counter = document.querySelector("[data-sms-counter]");
    var preview = document.querySelector("[data-sms-preview]");
    var track = document.querySelector("[data-sms-track]");

    function chars(text) { return Array.from ? Array.from(text) : text.split(""); }
    function length(text) {
      var units = 0, unsupported = [];
      chars(text).forEach(function (ch) {
        if (GSM.indexOf(ch) !== -1) units += 1;
        else if (EXT.indexOf(ch) !== -1) units += 2;
        else if (unsupported.indexOf(ch) === -1) unsupported.push(ch);
      });
      if (!unsupported.length) return { gsm: true, units: units, segments: units === 0 ? 0 : units <= 160 ? 1 : Math.ceil(units / 153), unsupported: [] };
      var u = text.length;
      return { gsm: false, units: u, segments: u <= 70 ? 1 : Math.ceil(u / 67), unsupported: unsupported };
    }
    function render(text) {
      var out = text.replace(/\r\n?/g, "\n").replace(TAG, function (_, name, fallback) {
        var v = SAMPLE[name.toLowerCase()];
        return v !== undefined ? v : (fallback || "").trim();
      });
      if (!track || track.checked) out = out.replace(URL_RE, function () { return short; });
      return out.replace(/[ \t]+\n/g, "\n").trim() + "\nSTOP SMS : " + short;
    }
    function update() {
      var text = render(textarea.value);
      var info = length(text);
      if (preview) preview.textContent = textarea.value.trim() ? text : "Votre message apparaîtra ici.";
      if (!counter) return;
      var per = info.gsm ? (info.segments > 1 ? 153 : 160) : (info.segments > 1 ? 67 : 70);
      var msg = info.units + " caractère" + (info.units > 1 ? "s" : "") + " (mention STOP comprise) · " + info.segments + " SMS facturé" + (info.segments > 1 ? "s" : "") + " par destinataire · " + per + " caractères par SMS";
      if (!info.gsm) msg += " — à cause de : " + info.unsupported.slice(0, 8).join(" ");
      counter.textContent = msg;
      counter.classList.toggle("is-warning", !info.gsm || info.segments > 1);
      counter.classList.toggle("is-error", info.segments > maxSegments);
    }
    function insertAtCursor(snippet) {
      var start = textarea.selectionStart || 0, end = textarea.selectionEnd || 0;
      textarea.value = textarea.value.slice(0, start) + snippet + textarea.value.slice(end);
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = start + snippet.length;
      update();
    }
    document.querySelectorAll("[data-sms-insert]").forEach(function (btn) {
      btn.addEventListener("click", function () { insertAtCursor(btn.getAttribute("data-sms-insert")); });
    });
    var gsmBtn = document.querySelector("[data-sms-gsm]");
    if (gsmBtn) gsmBtn.addEventListener("click", function () {
      textarea.value = chars(textarea.value).map(function (ch) { return GSM.indexOf(ch) !== -1 || EXT.indexOf(ch) !== -1 ? ch : (REPLACE[ch] !== undefined ? REPLACE[ch] : ch); }).join("");
      update();
    });
    textarea.addEventListener("input", update);
    if (track) track.addEventListener("change", update);
    update();
  }

  // Envoi : « Programmer » affiche la date ; l'heure saisie (heure locale du navigateur) est convertie en UTC
  function initLaunch() {
    var form = document.querySelector("[data-sms-launch]");
    if (!form) return;
    var later = form.querySelector("[data-sms-later]");
    var input = later && later.querySelector("input[type=datetime-local]");
    var utc = form.querySelector("[data-sms-utc]");
    form.querySelectorAll("[data-sms-when]").forEach(function (radio) {
      radio.addEventListener("change", function () {
        var on = form.querySelector("[data-sms-when]:checked").value === "later";
        later.hidden = !on;
        input.required = on;
        if (!on) { input.value = ""; utc.value = ""; }
      });
    });
    form.addEventListener("submit", function () {
      if (input && input.value) { var d = new Date(input.value); if (!isNaN(d)) utc.value = d.toISOString(); }
    });
  }
})();
