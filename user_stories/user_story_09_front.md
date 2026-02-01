### Ajustement et Réévaluation des Budgets

**En tant que** utilisateur,
**Je veux** modifier le montant ou les dates d'un budget existant,
**Afin de** corriger une erreur de saisie ou adapter mon budget aux imprévus.

**Parcours Utilisateur & Endpoints Ciblés :**

1. Sur la carte d'un budget (cf. US 4), un bouton "Éditer" (icône crayon) est disponible.
2. Au clic, ouverture de la modale pré-remplie avec les données actuelles.
3. À la soumission des modifications, appel de **`PUT /api/budgets/{id}`**.
4. En parallèle, si l'utilisateur veut juste voir le détail sans éditer, un clic sur la carte appelle **`GET /api/budgets/{id}`** pour s'assurer d'avoir les données fraîches avant édition.

**Critères de Validation :**

- [ ] Pré-remplissage correct de tous les champs (Montant, Dates, Catégorie).
- [ ] Détection de changement : Le bouton "Sauvegarder" reste désactivé tant qu'aucune modification n'a été faite (l'API renvoie une erreur si aucune modif).
- [ ] Gestion des erreurs 404 : Si le budget a été supprimé entre temps, renvoyer l'utilisateur vers la liste avec une notification.
- [ ] Mise à jour optimiste (Optimistic UI) ou rechargement automatique de la liste des budgets après succès pour refléter les nouvelles jauges.
- [ ] L'édition respecte les mêmes règles de chevauchement de dates que la création (US 3).
