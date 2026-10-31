# Mobile et faible débit

## Mesure (laboratoire, Chrome 150)
Profil **mobile lent** : 1,6 Mbit/s descendant, 750 Kbit/s montant, RTT 150 ms (profil « mobile 4G lent » de Lighthouse), CPU ×4, écran 390×800, cache désactivé, 5 relevés + 1 de chauffe.

| | LCP médiane | Étendue | CLS | Longues tâches (TBT) |
|---|---|---|---|---|
| Optimisation désactivée | 3 376 ms | 16 ms | 0 | 140 ms |
| Optimisation activée | **2 852 ms** | 60 ms | 0 | 214 ms |

Écart LCP −524 ms (−15,5 %), très supérieur à l'étendue : **significatif dans ces conditions**. Les 5 valeurs sont 3376/3372/3376/3388/3384 puis 2852/2844/2856/2796/2852.
**TBT** : 140 → 214 ms (médianes de 5, étendue non retenue) : écart non interprété (une seule page, valeurs faibles, non reproduit) ; **à ne pas lire comme une dégradation avérée ni comme un gain**.

Ordinateur (réseau local) : LCP 148 → 140 ms, étendue 172 et 40 ms : **dans le bruit, aucun gain démontré**.

## Fait
Minification (−29,5 % de transfert CSS/JS), priorité de l'image principale, dimensions réservées.

## Non fait
Mode économie de données (`Save-Data`), préférence `prefers-reduced-motion` sur les effets (non auditée ici), états de chargement et gestion des erreurs réseau côté pages publiques : non traités.
