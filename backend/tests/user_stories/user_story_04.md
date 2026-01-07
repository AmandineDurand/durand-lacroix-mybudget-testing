# US1 : Filtrage des transactions par catégorie

En tant qu'**utilisateur de l'API**,

Je veux **filtrer les transactions par catégorie via une route API**,

Afin de **consulter uniquement les transactions d'une catégorie spécifique**.

## Critères d'acceptation :

1. La route doit accepter un paramètre de catégorie
2. Le système doit retourner uniquement les transactions correspondant à la catégorie spécifiée
3. Le système doit retourner un code HTTP 200 en cas de succès
4. La recherche doit être insensible à la casse

## Cas d'exemples

### Scénario 1 : Filtrage par catégorie existante et insesnible à la casse

- **Étant donné que** l'API contient les transactions suivantes
```
  | id | montant | libellé    | type     | catégorie    | date       |
  | 1  | 45.50   | Courses    | DEPENSE  | alimentation | 2026-01-06 |
  | 2  | 2500.00 | Salaire    | REVENU   | salaire      | 2026-01-05 |
  | 3  | 800.00  | Loyer      | DEPENSE  | logement     | 2026-01-01 |
  | 4  | 30.00   | Restaurant | DEPENSE  | alimentation | 2026-01-03 |
```
- **Quand** je fais une requête GET sur `/api/transactions?categorie=alimentation` OU `/api/transactions?categorie=ALIMENTATION` (insensible à la casse des majuscules)
- **Alors** le code de réponse doit être 200
- **Et** la réponse doit contenir 2 transactions
- **Et** les transactions retournées doivent avoir les ids 1 et 4

### Scénario 2 : Filtrage par catégorie sans résultat

- **Étant donné que** l'API contient les transactions suivantes
```
  | id | montant | libellé  | type     | catégorie    | date       |
  | 1  | 45.50   | Courses  | DEPENSE  | alimentation | 2026-01-06 |
```
- **Quand** je fais une requête GET sur `/api/transactions?categorie=transport`
- **Alors** le code de réponse doit être 200
- **Et** la réponse doit être un tableau vide

### Scénario 3 : Combinaison de filtres (période + catégorie)

- **Étant donné que** l'API contient les transactions suivantes
```
  | id | montant | libellé    | type     | catégorie    | date       |
  | 1  | 45.50   | Courses    | DEPENSE  | alimentation | 2026-01-06 |
  | 2  | 2500.00 | Salaire    | REVENU   | salaire      | 2026-01-05 |
  | 3  | 30.00   | Restaurant | DEPENSE  | alimentation | 2026-01-03 |
  | 4  | 20.00   | Snack      | DEPENSE  | alimentation | 2025-12-28 |
```
- **Quand** je fais une requête GET sur `/api/transactions?categorie=alimentation&date_debut=2026-01-01`
- **Alors** le code de réponse doit être 200
- **Et** la réponse doit contenir 2 transactions
- **Et** les transactions retournées doivent avoir les ids 1 et 3