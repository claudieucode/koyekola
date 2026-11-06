// Motion Studio, lot d : retour de formulaire animé (succès / erreur). Deux modes, dits honnêtement :
//  - « demo » : un mini-formulaire (une adresse e-mail) qui valide pour de vrai dans le navigateur et montre les deux états ; il N'ENVOIE RIEN (mention affichée).
//  - « page » : le composant s'attache au(x) formulaire(s) d'inscription (élément « Formulaire ») de la même page : champs obligatoires vérifiés avant l'envoi avec secousse des champs
//    en erreur et résumé annoncé aux lecteurs d'écran ; au retour du serveur, le message de remerciement (coche tracée) ou d'erreur est animé. Il ne touche pas aux autres formulaires.
// Exécution : public/js/motion-studio/form-feedback.js
module.exports = {
  type: "motionformfeedback", template: "motion-form-feedback", label: "Retour de formulaire animé", group: "advanced", icon: "checkCircle", version: 1, style: "box", status: "partial",
  description: "Succès et erreur animés : démonstration, ou animation du formulaire d'inscription de la page",
  keywords: "retour formulaire validation succes erreur secousse coche message form feedback champ invalide inscription newsletter animation",
  dependencies: ["Mode « page » : un élément « Formulaire » (inscription) doit se trouver sur la même page. Les autres formulaires du site ne sont pas concernés."],
  schema: [
    { key: "mode", kind: "select", label: "Mode", options: [["demo", "Démonstration (mini-formulaire, n'envoie rien)"], ["page", "Animer le formulaire d'inscription de cette page"]], default: "demo" },
    { key: "title", kind: "text", label: "Titre (mode démonstration)", max: 80, default: "Recevoir la lettre d'information" },
    { key: "fieldLabel", kind: "text", label: "Libellé du champ e-mail (démonstration)", max: 60, default: "Votre adresse e-mail" },
    { key: "buttonLabel", kind: "text", label: "Texte du bouton (démonstration)", max: 40, default: "S'inscrire" },
    { key: "successMessage", kind: "text", label: "Message de succès (démonstration)", max: 140, required: true, default: "Merci ! Votre inscription est prise en compte." },
    { key: "errorMessage", kind: "text", label: "Message d'erreur (démonstration)", max: 140, required: true, default: "Saisissez une adresse e-mail valide, par exemple nom@exemple.fr." },
    { key: "summary", kind: "text", label: "Début du résumé d'erreurs (mode page)", max: 100, required: true, default: "Merci de corriger les champs suivants" },
    { key: "note", kind: "bool", label: "Afficher la mention « Démonstration : rien n'est envoyé » (mode démonstration, recommandé)", default: true },
  ],
  motion: {
    module: "form-feedback",
    presets: [["shake", "Secousse"], ["nudge", "Rebond léger"], ["fade", "Fondu"]],
    defaults: { preset: "shake", duration: 450, easing: "smooth" },
    controls: ["preset", "duration", "easing"],
  },
};
