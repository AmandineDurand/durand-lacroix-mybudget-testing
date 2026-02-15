### Suppression de Transaction

**En tant que** utilisateur connecté,
**Je veux** pouvoir supprimer une transaction erronée ou obsolète,
**Afin de** maintenir un historique de transactions propre et exact.

**Prérequis :** Utilisateur authentifié avec un token JWT valide (cf. US 2 & 3).

**Parcours Utilisateur & Endpoints Ciblés :**

1. Sur la liste des transactions (cf. US 6), chaque carte/ligne affiche un bouton "Supprimer" (icône poubelle).
2. Au clic, une modale de confirmation s'affiche avec les détails de la transaction à supprimer (montant, libellé, catégorie, date).
3. L'utilisateur confirme ou annule la suppression.
4. Si confirmé, l'application appelle **`DELETE /api/transactions/{id}`** avec le header `Authorization: Bearer <token>`.
5. En cas de succès (200 OK), la transaction disparaît de la liste, le total est mis à jour et une notification "Toast" confirme la suppression.

**Critères de Validation :**

- [ ] **Authentification requise :** L'utilisateur doit être connecté pour supprimer une transaction.
- [ ] **Protection des données :** L'utilisateur ne peut supprimer **que ses propres transactions**. Si la transaction appartient à un autre utilisateur, l'API renvoie une erreur 403 avec le message "Vous ne pouvez supprimer que vos propres transactions".
- [ ] La modale de confirmation affiche clairement les informations de la transaction à supprimer pour éviter les erreurs.
- [ ] Le bouton "Confirmer la suppression" est de couleur rouge (destructive action) et passe en état "Loading" pendant l'appel API.
- [ ] Gestion des erreurs 404 : Si la transaction n'existe plus, afficher un message approprié et fermer la modale.
- [ ] Gestion des erreurs 403 : Afficher le message "Vous ne pouvez supprimer que vos propres transactions" si l'utilisateur tente de supprimer une transaction qui ne lui appartient pas.
- [ ] En cas d'erreur 401 (session expirée), redirection automatique vers `/login` via l'intercepteur global.
- [ ] Après suppression réussie, la liste des transactions se met à jour automatiquement (suppression de la ligne).
- [ ] Le total des transactions (endpoint `/api/transactions/total`) est recalculé et affiché immédiatement après suppression.
- [ ] Feedback utilisateur : Une notification toast confirme "Transaction supprimée avec succès".
- [ ] Accessibilité : La modale de confirmation est focusable au clavier et peut être fermée avec Échap.
