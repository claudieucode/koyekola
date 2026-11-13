-- Versions nommées : un nom facultatif (« Avant refonte », « Version validée client ») sur une version publiée. Une version nommée n'est jamais effacée par le nettoyage de l'historique.
ALTER TABLE mk_page_versions ADD COLUMN label TEXT;
