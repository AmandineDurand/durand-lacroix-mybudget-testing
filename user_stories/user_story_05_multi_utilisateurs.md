# US5 : Authentification multi-utilisateurs avec gestion de sessions par token

En tant qu'**utilisateur de l'API**,

Je veux **m'authentifier via un token et accéder uniquement à mes propres données**,

Afin de **partager l'API entre plusieurs utilisateurs tout en gardant mes données privées et isolées**.

## Critères d'acceptation :

### Gestion des utilisateurs :
1. Chaque utilisateur doit avoir un identifiant unique (`user_id`) dans la base de données
2. Un utilisateur est identifié par son `username` et son `password` (hashé)
3. Le système doit permettre l'enregistrement d'un nouvel utilisateur
4. Le système doit permettre la connexion d'un utilisateur existant
5. Un token JWT doit être généré lors de la connexion réussie

### Gestion des sessions et tokens :
6. Le token doit être valide et décodable par l'API
7. Le token doit contenir l'identifiant de l'utilisateur
8. Le token doit avoir une durée de validité (expiration)
9. Le système doit rejeter les requêtes avec un token invalide ou expiré (code 401)
10. Le système doit rejeter les requêtes sans token sur les endpoints protégés (code 401)

### Isolation des données :
11. Chaque transaction créée doit être associée à l'utilisateur qui l'a créée
12. La liste des transactions doit retourner uniquement celles de l'utilisateur authentifié
13. Un utilisateur ne peut modifier/supprimer que ses propres transactions
14. Un utilisateur ne peut pas accéder aux données d'un autre utilisateur
15. Les catégories sont partagées entre tous les utilisateurs (pas d'isolation)
16. Les budgets doivent être associés à un utilisateur et isolés par utilisateur

### Endpoints protégés :
17. Les endpoints GET `/api/transactions`, `/api/budgets` doivent être protégés par authentification
18. L'endpoint GET `/api/categories` peut rester public (données partagées)
19. Les endpoints POST `/api/transactions`, `/api/budgets` doivent être protégés par authentification
20. Les endpoints PUT/DELETE `/api/transactions/{id}`, `/api/budgets/{id}` doivent être protégés

## Cas d'exemples

### Scénario 1 : Création d'un nouvel utilisateur

- **Étant donné que** l'API est disponible
- **Quand** je fais une requête POST sur `/api/auth/register` avec les données :
```
{
  "username": "alice",
  "password": "mon_mot_de_passe_secure_123"
}
```
- **Alors** le code de réponse doit être 201
- **Et** la réponse doit contenir :
  - `user_id` : un identifiant unique
  - `username` : "alice"
  - Un message de succès

### Scénario 2 : Connexion réussie et génération de token

- **Étant donné que** l'utilisateur "alice" existe dans la base avec le password "mon_mot_de_passe_secure_123"
- **Quand** je fais une requête POST sur `/api/auth/login` avec les données :
```
{
  "username": "alice",
  "password": "mon_mot_de_passe_secure_123"
}
```
- **Alors** le code de réponse doit être 200
- **Et** la réponse doit contenir :
  - `access_token` : un token JWT valide
  - `token_type` : "bearer"
  - `user_id` : l'identifiant d'alice
  - `username` : "alice"

### Scénario 3 : Connexion avec mauvais mot de passe

- **Étant donné que** l'utilisateur "alice" existe dans la base
- **Quand** je fais une requête POST sur `/api/auth/login` avec les données :
```
{
  "username": "alice",
  "password": "mauvais_password"
}
```
- **Alors** le code de réponse doit être 401
- **Et** la réponse doit contenir un message d'erreur : `Identifiants invalides`

### Scénario 4 : Création d'une transaction avec authentification

- **Étant donné que** je suis authentifié en tant qu'alice avec un token valide
- **Quand** je fais une requête POST sur `/api/transactions` avec l'header :
```
Authorization: Bearer <token_d_alice>
```
Et les données :
```
{
  "montant": 45.50,
  "libelle": "Courses Carrefour",
  "type": "DEPENSE",
  "categorie": "alimentation",
  "date": "2026-01-06"
}
```
- **Alors** le code de réponse doit être 201
- **Et** la transaction créée doit avoir :
  - `utilisateur_id` : égal à l'id d'alice
  - Les autres champs doivent correspondre aux données envoyées

### Scénario 5 : Tentative de création sans token

- **Étant donné que** l'API est disponible
- **Quand** je fais une requête POST sur `/api/transactions` sans header Authorization avec les données :
```
{
  "montant": 45.50,
  "libelle": "Courses Carrefour",
  "type": "DEPENSE",
  "categorie": "alimentation",
  "date": "2026-01-06"
}
```
- **Alors** le code de réponse doit être 401
- **Et** la réponse doit contenir un message d'erreur : `Token manquant ou invalide`

### Scénario 6 : Tentative avec token expiré

- **Étant donné que** je possède un token expiré
- **Quand** je fais une requête GET sur `/api/transactions` avec l'header :
```
Authorization: Bearer <token_expiré>
```
- **Alors** le code de réponse doit être 401
- **Et** la réponse doit contenir un message d'erreur : `Token expiré`

### Scénario 7 : Isolation des données - données privées

- **Étant donné que** :
  - alice est authentifiée et possède les transactions :
    - Transaction 1 : "Courses" (montant: 45.50)
    - Transaction 2 : "Salaire" (montant: 2500.00)
  - bob est authentifié et possède les transactions :
    - Transaction 3 : "Loyer" (montant: 800.00)

- **Quand** alice fait une requête GET sur `/api/transactions` avec son token
- **Alors** le code de réponse doit être 200
- **Et** alice ne doit recevoir que ses 2 transactions (Transaction 1 et 2)
- **Et** alice ne doit pas voir les transactions de bob

### Scénario 8 : Isolation des données - liste des budgets

- **Étant donné que** :
  - alice possède un budget "alimentation" de 500€
  - bob possède un budget "logement" de 1200€

- **Quand** alice fait une requête GET sur `/api/budgets` avec son token
- **Alors** le code de réponse doit être 200
- **Et** alice ne doit recevoir que son budget "alimentation"
- **Et** alice ne doit pas voir le budget de bob

### Scénario 9 : Catégories partagées

- **Étant donné que** les catégories "alimentation", "logement", "salaire" existent dans la base
- **Quand** alice fait une requête GET sur `/api/categories` sans token
- **Alors** le code de réponse doit être 200
- **Et** alice doit recevoir la liste complète de toutes les catégories

### Scénario 10 : Tentative de modification d'une transaction d'un autre utilisateur

- **Étant donné que** :
  - alice est authentifiée
  - bob est propriétaire de la transaction avec id=5

- **Quand** alice tente une requête PUT sur `/api/transactions/5` avec son token pour modifier la transaction de bob
- **Alors** le code de réponse doit être 403 (Forbidden)
- **Et** la réponse doit contenir un message d'erreur : `Vous ne pouvez modifier que vos propres transactions`

