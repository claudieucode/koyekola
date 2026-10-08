// Automatisations : scénarios (déclencheur + étapes), activation, moteur d'exécution, éditeur graphique (canvas).
module.exports = { ...require("./service"), ...require("./engine"), ...require("./catalog"), ...require("./steps"), ...require("./graph"), describeActions: require("./actions").describeActions };
