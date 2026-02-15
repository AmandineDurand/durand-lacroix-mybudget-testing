### Connexion et Authentification Utilisateur

**En tant que** utilisateur enregistré,
**Je veux** me connecter avec mon nom d'utilisateur et mon mot de passe,
**Afin de** accéder à mes données personnelles de transactions et budgets.

**Parcours Utilisateur & Endpoints Ciblés :**

1. L'utilisateur accède à la page de connexion (page d'accueil de l'application).
2. Un formulaire demande : Nom d'utilisateur (username) et Mot de passe (password).
3. À la soumission, l'application appelle **`POST /api/auth/login`**.
4. En cas de succès (200 OK), l'API renvoie un objet contenant `access_token`, `token_type`, `user_id`, et `username`.
5. L'application stocke le token JWT dans le localStorage (ou sessionStorage si "Se souvenir de moi" n'est pas coché).
6. L'utilisateur est redirigé vers le Dashboard (page principale de l'application).
7. En cas d'erreur 401, le message "Identifiants invalides" est affiché.

**Critères de Validation :**

- [ ] Le champ "Nom d'utilisateur" est requis (validation client).
- [ ] Le champ "Mot de passe" est requis (validation client).
- [ ] Une case à cocher "Se souvenir de moi" permet de choisir entre localStorage (persistant) et sessionStorage (session).
- [ ] Le bouton "Se connecter" passe en état "Loading" (spinner + désactivé) pendant l'appel API.
- [ ] Gestion des erreurs 401 : Afficher "Nom d'utilisateur ou mot de passe incorrect" en rouge sous le formulaire.
- [ ] Gestion des erreurs 500 : Afficher "Erreur de connexion au serveur. Veuillez réessayer." avec possibilité de réessayer.
- [ ] Le token JWT (`access_token`) est stocké en toute sécurité dans le storage du navigateur avec la clé `auth_token`.
- [ ] Les informations utilisateur (`user_id`, `username`) sont également stockées pour affichage dans l'UI (ex: header).
- [ ] Un lien "Créer un compte" redirige vers la page d'inscription (US 1).
- [ ] Après connexion réussie, toutes les requêtes API suivantes incluent automatiquement le header `Authorization: Bearer <token>`.
