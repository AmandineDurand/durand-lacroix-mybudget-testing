# US1 : Filtrage des transactions par période

En tant qu'**utilisateur de l'API**,
Je veux **filtrer les transactions par période via une route API**,
Afin de **consulter uniquement les transactions d'une période spécifique**.

## Critères d'acceptation :

1. La route doit accepter des paramètres de date de début et/ou date de fin
2. Si seule la date de début est fournie, retourner toutes les transactions à partir de cette date
3. Si seule la date de fin est fournie, retourner toutes les transactions jusqu'à cette date
4. Si les deux dates sont fournies, retourner les transactions dans cet intervalle (inclus)
5. Le système doit retourner un code HTTP 200 en cas de succès
6. Le système doit retourner une erreur 400 si les dates sont invalides

## Cas d'exemples

### Scénario 1 : Récupération de toutes les transactions

- **Étant donné que** l'API contient les transactions suivantes
```
  | id | montant | libellé   | type     | catégorie    | date       |
  | 1  | 45.50   | Courses   | dépense  | alimentation | 2026-01-06 |
  | 2  | 2500.00 | Salaire   | revenu   | salaire      | 2026-01-05 |
  | 3  | 800.00  | Loyer     | dépense  | logement     | 2026-01-01 |
  | 4  | 30.00   | Netflix   | dépense  | loisirs      | 2025-12-28 |
```
- **Quand** je fais une requête GET sur `/api/transactions?date_debut=2026-01-01&date_fin=2026-01-05`
- **Alors** le code de réponse doit être 200
- **Et** la réponse doit contenir 2 transactions
- **Et** les transactions retournées doivent avoir les ids 2 et 3

### Scénario 2 : Aucune transaction dans la période

- **Étant donné que** l'API contient les transactions suivantes
```
  | id | montant | libellé  | type     | catégorie    | date       |
  | 1  | 45.50   | Courses  | dépense  | alimentation | 2026-01-06 |
```
- **Quand** je fais une requête GET sur `/api/transactions?date_fin=2026-01-05`
- **Alors** le code de réponse doit être 200
- **Et** la réponse doit être un tableau vide

### Scénario 3 : Rejet avec date de début invalide

- **Étant donnée que** l'API ne contient aucune transaction
- **Quand** je fais une requête GET sur `/api/transactions?date_debut=date-invalide`
- **Alors** le code de réponse doit être 400
- **Et** la réponse doit contenir un message d'erreur indiquant `La date de début n'est pas valide`