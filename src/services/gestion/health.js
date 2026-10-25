// Centre de gestion : état des sauvegardes de la base, à partir des fichiers réellement présents (services/backups.js). Aucune valeur inventée :
// pas de fichier = « aucune sauvegarde » ; la date est celle du fichier. Fonction pure (testable) : la liste, l'heure et le réglage sont passés en paramètres.
const DAY = 24 * 60 * 60 * 1000;
const STALE_DAYS = 2;   // au-delà, la sauvegarde automatique quotidienne a manifestement cessé de fonctionner

function backupStatus(list, { auto = true, now = Date.now() } = {}) {
  const last = list && list[0] ? list[0] : null;
  if (!last) return { level: "warning", last: null, days: null, label: "Aucune sauvegarde", title: "Aucune sauvegarde de la base n'existe", detail: auto ? "La sauvegarde automatique crée la première copie dans la journée suivant le démarrage ; vous pouvez aussi en créer une maintenant." : "La sauvegarde automatique est désactivée sur ce serveur : créez-en une à la main.", href: "/formateur/gestion/sauvegardes" };
  const age = Math.max(0, now - new Date(last.createdAt).getTime()), days = Math.floor(age / DAY);
  if (age > STALE_DAYS * DAY) return { level: "warning", last, days, label: `Dernière il y a ${days} jours`, title: `Dernière sauvegarde de la base il y a ${days} jours`, detail: auto ? "La sauvegarde automatique est quotidienne : elle semble s'être arrêtée. Créez une sauvegarde maintenant." : "La sauvegarde automatique est désactivée : créez une sauvegarde à la main.", href: "/formateur/gestion/sauvegardes" };
  return { level: "ok", last, days, label: days === 0 ? "Dernière : aujourd'hui" : `Dernière il y a ${days} jour${days > 1 ? "s" : ""}`, title: "Sauvegardes à jour", detail: auto ? "" : "La sauvegarde automatique est désactivée sur ce serveur.", href: "/formateur/gestion/sauvegardes" };
}

module.exports = { backupStatus, STALE_DAYS };
