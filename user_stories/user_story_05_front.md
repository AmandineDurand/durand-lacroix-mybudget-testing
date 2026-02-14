### Saisie Rapide et Intelligente de Transaction

**En tant que** utilisateur connecté,
**Je veux** pouvoir saisir une nouvelle dépense ou un revenu via un formulaire réactif et validé,
**Afin de** tenir mes comptes à jour instantanément sans friction.

**Prérequis :** Utilisateur authentifié avec un token JWT valide (cf. US 2 & 3).

**Parcours Utilisateur & Endpoints Ciblés :**

1. L'utilisateur clique sur un bouton flottant (FAB) ou un bouton "Ajouter" visible en permanence.
2. Au chargement du formulaire, l'application appelle **`GET /api/categories/`** pour peupler une liste déroulante (Select) avec icônes (endpoint public, pas de token requis).
3. L'utilisateur remplit : Montant, Libellé, Type (Radio btn: REVENU/DEPENSE), Catégorie et Date.
4. À la soumission, l'application appelle **`POST /api/transactions/`** avec le header `Authorization: Bearer <token>` et le payload validé.
5. En cas de succès (201 Created), une notification "Toast" confirme l'ajout et le formulaire se réinitialise.
6. La transaction créée est automatiquement associée à l'utilisateur connecté (`utilisateur_id` extrait du token côté serveur).

**Critères de Validation :**

- [ ] **Authentification requise :** Si le token est absent ou invalide, l'utilisateur est redirigé vers `/login` avant même d'accéder au formulaire (Route Guard).
- [ ] La liste des catégories affiche le nom et l'icône (ex: "🍔 Alimentation").
- [ ] Le champ "Montant" interdit la saisie de caractères non numériques et de valeurs négatives (validation côté client avant l'appel API).
- [ ] Le bouton de soumission passe en état "Loading" (spinner + désactivé) pendant l'appel API pour éviter les doubles soumissions.
- [ ] En cas d'erreur API (ex: 400 Bad Request), le message d'erreur précis (ex: "Le montant doit être positif") est affiché en rouge sous le champ concerné.
- [ ] En cas d'erreur 401 (token expiré), l'intercepteur global redirige vers `/login` avec le message "Session expirée" (cf. US 3).
- [ ] La date est pré-remplie par défaut à la date du jour (ISO 8601).
- [ ] La transaction créée appartient automatiquement à l'utilisateur connecté (pas de sélection d'utilisateur dans le formulaire).
