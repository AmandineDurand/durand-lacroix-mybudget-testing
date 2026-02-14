### Ajustement et Réévaluation des Budgets

**En tant que** utilisateur connecté,
**Je veux** modifier le montant ou les dates d'un budget existant,
**Afin de** corriger une erreur de saisie ou adapter mon budget aux imprévus.

**Prérequis :** Utilisateur authentifié avec un token JWT valide (cf. US 2 & 3).

**Parcours Utilisateur & Endpoints Ciblés :**

1. Sur la carte d'un budget (cf. US 8), un bouton "Éditer" (icône crayon) est disponible.
2. Au clic, ouverture de la modale pré-remplie avec les données actuelles.
3. À la soumission des modifications, appel de **`PUT /api/budgets/{id}`** avec le header `Authorization: Bearer <token>`.
4. En parallèle, si l'utilisateur veut juste voir le détail sans éditer, un clic sur la carte appelle **`GET /api/budgets/{id}`** avec le token pour s'assurer d'avoir les données fraîches avant édition.

**Critères de Validation :**

- [ ] **Authentification requise :** L'utilisateur doit être connecté pour modifier un budget.
- [ ] **Isolation des données :** L'utilisateur ne peut modifier **que ses propres budgets**.
- [ ] Pré-remplissage correct de tous les champs (Montant, Dates, Catégorie).
- [ ] Détection de changement : Le bouton "Sauvegarder" reste désactivé tant qu'aucune modification n'a été faite.
- [ ] Gestion des erreurs 400 : Si aucune modification n'est détectée côté serveur, afficher un message "Aucune modification détectée" (l'API renvoie une erreur 400 BAD REQUEST avec ce message).
- [ ] Gestion des erreurs 404 : Si le budget a été supprimé entre temps, renvoyer l'utilisateur vers la liste avec une notification.
- [ ] Gestion des erreurs 409 : En cas de chevauchement de dates avec un autre budget existant, afficher un message explicite avec les dates du budget en conflit.
- [ ] En cas d'erreur 401 (session expirée), redirection automatique vers `/login` via l'intercepteur global.
- [ ] Validation client : La "Date de fin" ne peut pas être antérieure à la "Date de début" (même règle que la création).
- [ ] Validation : Le montant fixé doit être strictement positif (> 0).
- [ ] Mise à jour optimiste (Optimistic UI) ou rechargement automatique de la liste des budgets après succès pour refléter les nouvelles jauges.
- [ ] L'édition respecte les mêmes règles de chevauchement de dates que la création (US 7), mais exclut le budget en cours d'édition de la vérification.
