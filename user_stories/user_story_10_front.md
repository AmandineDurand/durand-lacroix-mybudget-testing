### Modification et Correction de Transaction

**En tant que** utilisateur connecté,
**Je veux** pouvoir modifier une transaction existante,
**Afin de** corriger une erreur de saisie (montant, catégorie, date, libellé) sans avoir à la supprimer et la recréer.

**Prérequis :** Utilisateur authentifié avec un token JWT valide (cf. US 2 & 3).

**Parcours Utilisateur & Endpoints Ciblés :**

1. Sur la liste des transactions (cf. US 6), chaque carte/ligne affiche un bouton "Éditer" (icône crayon).
2. Au clic, ouverture d'une modale pré-remplie avec les données actuelles de la transaction.
3. L'application appelle **`GET /api/categories/`** pour peupler la liste déroulante des catégories (endpoint public).
4. L'utilisateur modifie un ou plusieurs champs : Montant, Libellé, Type (REVENU/DEPENSE), Catégorie, Date.
5. À la soumission, l'application appelle **`PUT /api/transactions/{id}`** avec le header `Authorization: Bearer <token>`.
6. En cas de succès (200 OK), la modale se ferme, la liste se rafraîchit et une notification "Toast" confirme la modification.

**Critères de Validation :**

- [ ] **Authentification requise :** L'utilisateur doit être connecté pour modifier une transaction.
- [ ] **Protection des données :** L'utilisateur ne peut modifier **que ses propres transactions**. Si la transaction appartient à un autre utilisateur, l'API renvoie une erreur 403 avec le message "Vous ne pouvez modifier que vos propres transactions".
- [ ] Pré-remplissage correct de tous les champs avec les valeurs actuelles de la transaction.
- [ ] Les mêmes validations que la création s'appliquent : montant > 0, catégorie valide, type parmi REVENU/DEPENSE.
- [ ] Le bouton "Sauvegarder" affiche un spinner et est désactivé pendant l'appel API pour éviter les doubles soumissions.
- [ ] Gestion des erreurs 404 : Si la transaction a été supprimée entre-temps, afficher un message d'erreur et fermer la modale.
- [ ] Gestion des erreurs 400 : Afficher les messages d'erreur de validation (ex: "La catégorie n'existe pas") sous le champ concerné ou dans une alerte.
- [ ] Gestion des erreurs 403 : Afficher le message "Vous ne pouvez modifier que vos propres transactions" si l'utilisateur tente de modifier une transaction qui ne lui appartient pas.
- [ ] En cas d'erreur 401 (session expirée), redirection automatique vers `/login` via l'intercepteur global.
- [ ] Mise à jour optimiste (Optimistic UI) ou rechargement automatique de la liste après succès pour refléter les changements.
- [ ] Le total des transactions (si affiché) doit être recalculé automatiquement après modification.
- [ ] Les champs Date utilisent le même sélecteur que pour la création (natif ou librairie de datepicker).
