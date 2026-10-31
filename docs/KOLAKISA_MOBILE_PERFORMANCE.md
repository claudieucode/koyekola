# KOLAKISA — Performance mobile (22.8)

**Aucune mesure de performance n'a été réalisée dans ce palier** (ni LCP, ni INP, ni CLS, ni poids de page) : aucun score n'est donc annoncé.
Ce qui existe et a été constaté sans mesure : `srcset`/`sizes` adaptatifs pour les images locales (taille « auto »), règles `prefers-reduced-motion` dans `landing.css` (16 occurrences). Le chargement paresseux des images (`loading="lazy"`) n'a PAS été vérifié dans le rendu des éléments. Le correctif de ce palier n'ajoute aucun JavaScript supplémentaire notable (quelques lignes dans `landing.js`) ni de CSS lourd.
À faire : mesure Lighthouse / WebPageTest sur une page publiée en production avec profil mobile 4G, mesure du CLS des images sans dimensions.
