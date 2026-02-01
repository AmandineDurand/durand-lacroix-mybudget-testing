### Tableau de Bord de Santé Budgétaire (Jauges & KPI)

**En tant que** utilisateur,
**Je veux** visualiser l'état de consommation de mes budgets sous forme graphique,
**Afin de** savoir immédiatement si je suis en surconsommation ("dans le rouge").

**Parcours Utilisateur & Endpoints Ciblés :**

1. Sur le Dashboard, l'application appelle **`GET /api/budgets/`**.
2. L'API renvoie une liste enrichie d'objets `BudgetStatus` contenant `montant_depense`, `pourcentage_consomme`, `est_depasse`.
3. Pour chaque budget dont la date du jour est comprise sur la période, l'UI affiche une carte avec une barre de progression (possiblement ciruclaire).

**Critères de Validation :**

- [ ] Chaque carte affiche : Icône catégorie, Montant dépensé / Montant fixé, et le Reste à vivre.
- [ ] La barre de progression change de couleur dynamiquement :
- Vert (< 75%)
- Orange (75% - 99%)
- Rouge (>= 100% ou si `est_depasse` est `true`).

- [ ] Affichage d'un badge "DÉPASSÉ" visible si `est_depasse` est vrai.
- [ ] Les calculs (pourcentage, reste) NE SONT PAS refaits par le front, mais utilisent strictement les données envoyées par l'API (`montant_restant`, `pourcentage_consomme`) pour garantir la cohérence métier.
- [ ] Le dashboard est responsive (Grille : 1 col mobile, 3 cols desktop).
