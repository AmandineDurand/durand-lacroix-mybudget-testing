### Inscription d'un Nouvel Utilisateur

**En tant que** nouvel utilisateur,
**Je veux** créer un compte avec un nom d'utilisateur et un mot de passe,
**Afin de** pouvoir accéder à mon espace personnel de gestion budgétaire.

**Parcours Utilisateur & Endpoints Ciblés :**

1. L'utilisateur accède à la page d'inscription via un lien "Créer un compte" depuis la page de connexion.
2. Un formulaire demande : Nom d'utilisateur (username) et Mot de passe (password).
3. À la soumission, l'application appelle **`POST /api/auth/register`** avec le payload.
4. En cas de succès (201 Created), l'utilisateur est redirigé vers la page de connexion avec un message "Compte créé avec succès".
5. En cas d'erreur, le message d'erreur spécifique est affiché sous le champ concerné.

**Critères de Validation :**

- [ ] Le champ "Nom d'utilisateur" est requis (validation client avant l'appel API).
- [ ] Le champ "Mot de passe" est requis et doit faire au moins 8 caractères (validation client).
- [ ] Le champ "Mot de passe" ne doit pas dépasser 72 caractères (limitation bcrypt).
- [ ] Un champ "Confirmer le mot de passe" doit correspondre au mot de passe saisi.
- [ ] Le mot de passe est masqué par défaut avec une icône "œil" pour le révéler temporairement.
- [ ] Le bouton de soumission passe en état "Loading" (spinner + désactivé) pendant l'appel API.
- [ ] Gestion des erreurs 409 (Conflict) : Si le nom d'utilisateur existe déjà, afficher "Ce nom d'utilisateur est déjà pris".
- [ ] Gestion des erreurs 400 (Bad Request) : Afficher les erreurs de validation (ex: "Le mot de passe doit faire au moins 8 caractères").
- [ ] Affichage d'un indicateur de force du mot de passe (faible/moyen/fort) en temps réel pendant la saisie.
- [ ] Après création réussie, ne pas connecter automatiquement l'utilisateur - le rediriger vers le login.
