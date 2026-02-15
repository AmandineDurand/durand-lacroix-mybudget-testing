### Gestion de Session et Persistance d'Authentification

**En tant que** utilisateur connecté,
**Je veux** que ma session reste active tant que mon token est valide,
**Afin de** ne pas avoir à me reconnecter à chaque visite ou rafraîchissement de page.

**Parcours Utilisateur & Fonctionnalités :**

1. Au chargement de l'application, un intercepteur HTTP vérifie la présence d'un token dans le localStorage/sessionStorage.
2. Si un token est trouvé, il est automatiquement ajouté au header `Authorization: Bearer <token>` de toutes les requêtes API.
3. Si aucun token n'est trouvé, l'utilisateur est redirigé vers la page de connexion.
4. Sur chaque requête API, l'application écoute les erreurs 401 (Unauthorized).
5. En cas d'erreur 401, l'application efface le token, affiche un message "Session expirée. Veuillez vous reconnecter", et redirige vers la page de connexion.

**Critères de Validation :**

- [ ] Un **HTTP Interceptor** (ou middleware) injecte automatiquement le header `Authorization: Bearer <token>` sur toutes les requêtes vers `/api/*` (sauf `/api/auth/login` et `/api/auth/register`).
- [ ] Si le token est absent au chargement de l'application, l'utilisateur est redirigé vers `/login` immédiatement.
- [ ] Les pages protégées (Dashboard, Transactions, Budgets) sont inaccessibles sans token valide (Route Guard).
- [ ] Un **Error Interceptor** global capture les erreurs 401 sur n'importe quelle requête API.
- [ ] En cas de 401 (token invalide ou expiré), l'interceptor :
  - Efface le token du storage (`localStorage.removeItem('auth_token')`)
  - Efface les informations utilisateur
  - Affiche une notification toast "Session expirée. Veuillez vous reconnecter."
  - Redirige vers `/login`
- [ ] L'endpoint **`GET /api/categories`** peut être appelé sans token (endpoint public) - l'interceptor ne doit pas bloquer cette requête si aucun token n'est présent.
- [ ] Le nom de l'utilisateur connecté (`username`) est affiché dans le header de l'application (ex: "Bienvenue, Alice").
- [ ] Un bouton "Déconnexion" est toujours visible dans le header pour permettre à l'utilisateur de se déconnecter manuellement (cf. US 4).
- [ ] Si l'utilisateur se déconnecte manuellement, le token est supprimé et il est redirigé vers `/login`.
- [ ] Le token JWT a une durée de validité de **30 minutes** (gérée côté serveur). L'application doit gérer l'expiration côté client via l'erreur 401.
