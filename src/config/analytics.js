// Mesure d'audience du site principal (kolakisa.com) : conteneur Google Tag Manager.
// - Identifiant surchargeable par GTM_ID dans .env ; GTM_ID=off le désactive.
// - Jamais sur le domaine d'un site créé (req.kwSite) ni dans Mon espace : seulement les pages publiques de la plateforme.
// - Le conteneur ne se charge qu'après l'accord du bandeau de consentement (cookie kw_consent = 1, public/js/visitor.js).
const DEFAULT_GTM_ID = "GTM-W4F3MRLQ";

function gtmId() {
  const v = String(process.env.GTM_ID || "").trim();
  if (/^(off|non|0|false)$/i.test(v)) return null;
  return /^GTM-[A-Z0-9]{4,12}$/.test(v) ? v : DEFAULT_GTM_ID;
}

module.exports = { gtmId, DEFAULT_GTM_ID };
