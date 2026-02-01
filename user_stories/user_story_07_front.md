### Définition de Budgets Prévisionnels

**En tant que** utilisateur,
**Je veux** définir des budgets plafonds pour certaines catégories sur une période donnée,
**Afin de** me fixer des objectifs de limitation de dépenses.

**Parcours Utilisateur & Endpoints Ciblés :**

1. Sur la page "Budgets", un bouton "Nouveau Budget" ouvre une modale.
2. La modale charge les catégories via **`GET /api/categories/`**.
3. L'utilisateur définit : Catégorie, Montant limite, Date de début et Date de fin.
4. À la validation, appel de **`POST /api/budgets/`**.
5. Gestion des erreurs spécifiques : si l'API renvoie une 409 (Conflit/Chevauchement), afficher une alerte expliquant qu'un budget existe déjà sur cette période.

**Critères de Validation :**

- [ ] Validation client stricte : La "Date de fin" ne peut pas être sélectionnée si elle est antérieure à la "Date de début".
- [ ] Le champ catégorie empêche de sélectionner une catégorie qui n'existe pas (sélection contrainte).
- [ ] Feedback immédiat : La modale se ferme uniquement après confirmation (HTTP 201) du serveur.
- [ ] Les champs dates utilisent un sélecteur natif ou une librairie de datepicker ergonomique.
- [ ] Gestion de l'erreur 409 : Le message d'erreur doit être intelligible ("Chevauchement avec le budget du 01/01 au 31/01").
