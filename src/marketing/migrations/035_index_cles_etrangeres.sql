-- Index des clés étrangères qui n'en avaient pas (audit, octobre 2026) : suppression d'un contact, d'un message,
-- d'une liste, d'un formulaire… sans parcourir toute la table liée, et jointures plus rapides quand le volume grandit.
CREATE INDEX IF NOT EXISTS idx_mk_contact_preferences_category ON mk_contact_preferences(category_id);
CREATE INDEX IF NOT EXISTS idx_mk_unsubscribes_list ON mk_unsubscribes(list_id);
CREATE INDEX IF NOT EXISTS idx_mk_campaign_recipients_contact ON mk_campaign_recipients(contact_id);
CREATE INDEX IF NOT EXISTS idx_mk_messages_contact ON mk_messages(contact_id);
CREATE INDEX IF NOT EXISTS idx_mk_message_events_message ON mk_message_events(message_id);
CREATE INDEX IF NOT EXISTS idx_mk_automation_runs_contact ON mk_automation_runs(contact_id);
CREATE INDEX IF NOT EXISTS idx_mk_sms_short_links_link ON mk_sms_short_links(link_id);
CREATE INDEX IF NOT EXISTS idx_mk_sms_clicks_link ON mk_sms_clicks(link_id);
CREATE INDEX IF NOT EXISTS idx_mk_sms_clicks_message ON mk_sms_clicks(message_id);
CREATE INDEX IF NOT EXISTS idx_mk_pending_confirmations_form ON mk_pending_confirmations(form_id);
CREATE INDEX IF NOT EXISTS idx_mk_rss_campaigns_template ON mk_rss_campaigns(template_id);
CREATE INDEX IF NOT EXISTS idx_mk_landing_pages_form ON mk_landing_pages(form_id);
CREATE INDEX IF NOT EXISTS idx_mk_surveys_list ON mk_surveys(list_id);
CREATE INDEX IF NOT EXISTS idx_mk_survey_responses_contact_id ON mk_survey_responses(contact_id);
