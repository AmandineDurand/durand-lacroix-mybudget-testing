### Saisie Rapide et Intelligente de Transaction

**En tant que** utilisateur,
**Je veux** pouvoir saisir une nouvelle dépense ou un revenu via un formulaire réactif et validé,
**Afin de** tenir mes comptes à jour instantanément sans friction.

**Parcours Utilisateur & Endpoints Ciblés :**

1. L'utilisateur clique sur un bouton flottant (FAB) ou un bouton "Ajouter" visible en permanence.
2. Au chargement du formulaire, l'application appelle **`GET /api/categories/`** pour peupler une liste déroulante (Select) avec icônes.
3. L'utilisateur remplit : Montant, Libellé, Type (Radio btn: Revenu/Dépense), Catégorie et Date.
4. À la soumission, l'application appelle **`POST /api/transactions/`**.
5. En cas de succès, une notification "Toast" confirme l'ajout et le formulaire se réinitialise.

**Critères de Validation :**

- [ ] La liste des catégories affiche le nom et l'icône (ex: "🍔 Alimentation").
- [ ] Le champ "Montant" interdit la saisie de caractères non numériques et de valeurs négatives (validation côté client avant l'appel API).
- [ ] Le bouton de soumission passe en état "Loading" (spinner + désactivé) pendant l'appel API pour éviter les doubles soumissions.
- [ ] En cas d'erreur API (ex: 400 Bad Request), le message d'erreur précis (ex: "Le montant doit être positif") est affiché en rouge sous le champ concerné.
- [ ] La date est pré-remplie par défaut à la date du jour (ISO 8601).
