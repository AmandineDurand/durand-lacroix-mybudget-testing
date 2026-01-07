# US1 : Liste des transactions

En tant qu'**utilisateur de l'API**,

Je veux **lister toutes mes transactions via une route API**,

Afin de **consulter l'historique de mes opérations financières**.

## Critères d'acceptation :

1. La route doit retourner toutes les transactions enregistrées
2. Le système doit retourner un code HTTP 200 en cas de succès
3. La réponse doit être un tableau JSON (même vide si aucune transaction)
4. Chaque transaction doit contenir tous ses attributs (id, montant, libellé, type, catégorie, date)

## Cas d'exemples

### Scénario 1 : Récupération de toutes les transactions

- **Étant donné que** l'API contient les transactions suivantes
```
  | id | montant | libellé   | type     | catégorie    | date       |
  | 1  | 45.50   | Courses   | dépense  | alimentation | 2026-01-06 |
  | 2  | 2500.00 | Salaire   | revenu   | salaire      | 2026-01-05 |
  | 3  | 800.00  | Loyer     | dépense  | logement     | 2026-01-01 |
```
- **Quand** je fais une requête GET sur `/api/transactions`
- **Alors** le code de réponse doit être 200
- **Et** la réponse doit contenir 3 transactions
- **Et** la première transaction doit avoir un `id` égal à 1
- **Et** la première transaction doit avoir un `montant` égal à 45.50
- Etc.

### Scénario 2 : Rejet d'une transaction avec un montant négatif

- **Étant donnée que** l'API ne contient aucune transaction
- **Quand** je fais une requête GET sur `/api/transactions`
- **Alors** le code de réponse doit être 200
- **Et** la réponse doit être un tableau vide