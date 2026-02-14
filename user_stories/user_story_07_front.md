### Définition de Budgets Prévisionnels

**En tant que** utilisateur connecté,
**Je veux** définir des budgets plafonds pour certaines catégories sur une période donnée,
**Afin de** me fixer des objectifs de limitation de dépenses.

**Prérequis :** Utilisateur authentifié avec un token JWT valide (cf. US 2 & 3).

**Parcours Utilisateur & Endpoints Ciblés :**

1. Sur la page "Budgets", un bouton "Nouveau Budget" ouvre une modale.
2. La modale charge les catégories via **`GET /api/categories/`** (endpoint public, pas de token requis).
3. L'utilisateur définit : Catégorie, Montant limite, Date de début et Date de fin.
4. À la validation, appel de **`POST /api/budgets/`** avec le header `Authorization: Bearer <token>`.
5. Le budget créé est automatiquement associé à l'utilisateur connecté (`utilisateur_id` extrait du token côté serveur).
6. Gestion des erreurs spécifiques : si l'API renvoie une 409 (Conflit/Chevauchement), afficher une alerte expliquant qu'un budget existe déjà sur cette période.

**Critères de Validation :**

- [ ] **Authentification requise :** Route protégée par un Route Guard qui redirige vers `/login` si pas de token valide.
- [ ] **Isolation des données :** Le budget créé appartient uniquement à l'utilisateur connecté (pas de sélection d'utilisateur dans le formulaire).
- [ ] Validation client stricte : La "Date de fin" ne peut pas être sélectionnée si elle est antérieure à la "Date de début".
- [ ] Le champ catégorie empêche de sélectionner une catégorie qui n'existe pas (sélection contrainte).
- [ ] Feedback immédiat : La modale se ferme uniquement après confirmation (HTTP 201) du serveur.
- [ ] Les champs dates utilisent un sélecteur natif ou une librairie de datepicker ergonomique.
- [ ] Gestion de l'erreur 409 : Le message d'erreur doit être intelligible ("Chevauchement avec le budget du 01/01 au 31/01").
- [ ] En cas d'erreur 401 (session expirée), redirection automatique vers `/login` via l'intercepteur global.
