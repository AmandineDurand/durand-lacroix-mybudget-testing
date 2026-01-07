# US1 : Ajouter une transaction

En tant qu'**utilisateur de l'API**,

Je veux **ajouter une transaction via une route API**,

Afin d'**enregistrer mes revenus et dépenses dans le système**.

## Critères d'acceptation :

1. La transaction doit contenir obligatoirement : montant, libellé, type (REVENU/DEPENSE), catégorie et date
2. Le montant doit être un nombre positif
3. Le type doit être soit `REVENU` soit `DEPENSE`
4. La date doit être au format valide (ISO 8601)
5. Le système doit retourner la transaction créée avec un identifiant unique
6. Le système doit retourner un code HTTP 201 en cas de succès
7. Le système doit retourner une erreur 400 si des champs obligatoires sont manquants ou invalides

## Cas d'exemples

### Scénario 1 : Ajout réussi d'une dépense

- **Étant donné que** l'API est disponible
- **Quand** je fais une requête POST sur `/api/transactions` avec les données :
```
  | montant | libellé           | type     | catégorie     | date       |
  | 45.50   | Courses Carrefour | DEPENSE  | alimentation  | 2026-01-06 |
```

- **Alors** le code de réponse doit être 201
- **Et** la réponse doit contenir le résumé de la transaction créée avec un `id` unique : 
  - `montant` avec la valeur 45.50
  - `libellé` avec la valeur `Courses Carrefour`
  - `type` avec la valeur `DEPENSE`
  - `catégorie` avec la valeur `alimentation`
  - `date` avec la valeur `2026-01-06`

### Scénario 2 : Rejet d'une transaction avec un montant négatif

- **Étant donnée que** l'API est disponible
- **Quand** je fais une requête POST sur `/api/transactions` avec les données :
```
  | montant | libellé | type     | catégorie    | date       |
  | -50.00  | Loyer   | REVENU   | logement     | 2026-01-01 |
```
- **Alors** le code de réponse doit être 400
- **Et** la réponse doit contenir un message d'erreur indiquant `Le montant doit être positif`