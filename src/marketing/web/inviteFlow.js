// KOLAKISA CMS → Utilisateurs : envoi d'une invitation, partagé par l'écran central et l'écran d'un site. Un seul endroit décide ce qu'on a le droit de DIRE à la personne qui invite :
// jamais « envoyé » avant que le serveur d'envoi ait accepté le message (l'état réel est relu dans la file d'envoi), et le lien personnel n'est montré que si aucun e-mail ne peut partir.
const mailer = require("../../utils/mailer");
const access = require("../../services/cmsAccess");

function deliver(db, { invitation, inviterName, roleName, siteName }) {
  const url = `${mailer.siteUrl()}/invitation/${invitation.token}`;
  const queued = mailer.sendInvitationEmail(db, { to: invitation.email, inviter: inviterName, roleName, siteName, url, days: invitation.days || access.INVITE_DAYS, name: invitation.name || "", message: invitation.message || "" });
  access.recordDelivery(invitation.id, queued);
  const configured = Boolean(process.env.SMTP_HOST);
  return { queued, configured, url: !queued.queued || !configured ? url : null };
}

// Message affiché à l'inviteur : { type, text, detail }
function summary(email, d, days, { resent = false } = {}) {
  const lead = resent ? `Nouveau lien créé pour ${email} (l'ancien ne fonctionne plus)` : `Invitation créée pour ${email}`;
  if (!d.queued.queued) return { type: "error", text: `${lead}, mais l'e-mail n'a pas pu être mis en file d'envoi (adresse refusée). Aucun message n'est parti.`, detail: `Lien personnel à transmettre vous-même (valable ${days} jours) : ${d.url}` };
  if (!d.configured) return { type: "error", text: `${lead}, mais aucun serveur d'e-mail n'est configuré : aucun message ne partira.`, detail: `Lien personnel à transmettre vous-même (valable ${days} jours) : ${d.url}` };
  return { type: "ok", text: `${lead} : l'e-mail est en file d'envoi (valable ${days} jours).`, detail: "L'état réel (envoyé ou échec) se suit dans Invitations. « Envoyé » veut dire accepté par le serveur d'envoi, pas lu par la personne." };
}

module.exports = { deliver, summary };
