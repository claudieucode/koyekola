// Message « traitement automatique indisponible » (MARKETING_WORKER ≠ « on ») — source unique (§17 refonte) :
// une phrase HUMAINE d'abord, le détail technique à part (replié dans l'interface) pour l'administrateur qui
// doit réellement agir dessus. Jamais le nom de la variable imposé en premier à un lecteur non technique.
const WORKER_DETAIL = "Variable d'environnement MARKETING_WORKER absente ou différente de « on » : aucun travail en arrière-plan (envoi, scénario, synchronisation) n'est traité. À activer dans la configuration du serveur, puis redémarrer.";

const workerHuman = (consequence) => `Le traitement automatique est temporairement indisponible${consequence ? ` : ${consequence}` : ""}.`;

module.exports = { WORKER_DETAIL, workerHuman };
