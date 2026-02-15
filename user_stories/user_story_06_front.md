### Explorateur d'Historique des Transactions

**En tant que** utilisateur connecté,
**Je veux** consulter la liste de mes transactions passées avec des options de filtrage,
**Afin de** retrouver une dépense spécifique ou analyser mes dépenses sur une période.

**Prérequis :** Utilisateur authentifié avec un token JWT valide (cf. US 2 & 3).

**Parcours Utilisateur & Endpoints Ciblés :**

1. L'utilisateur accède à la page "Transactions".
2. Au chargement, l'app appelle **`GET /api/transactions/`** avec le header `Authorization: Bearer <token>` (sans filtre ou avec des dates par défaut pour le mois courant).
3. L'API retourne **uniquement les transactions de l'utilisateur connecté** (isolation des données par `user_id`).
4. Une barre de filtres permet de sélectionner : Date de début, Date de fin, Catégorie (input texte avec autocomplétion ou select), et Type (Radio buttons ou Toggle: REVENU/DEPENSE/Tous).
5. À chaque modification d'un filtre (avec un _debounce_ de 300ms), l'appel API est relancé avec les query params : `?date_debut=...&date_fin=...&categorie=...&type_filtre=...`.
6. Un compteur en temps réel affiche le total des transactions filtrées via **`GET /api/transactions/total`** avec les mêmes paramètres de filtre et le token d'authentification.

**Critères de Validation :**

- [ ] **Authentification requise :** Route protégée par un Route Guard qui redirige vers `/login` si pas de token valide.
- [ ] **Isolation des données :** L'utilisateur ne voit que ses propres transactions, jamais celles d'un autre utilisateur.
- [ ] Affichage des transactions sous forme de tableau ou de liste de cartes (mobile-first), triées par date décroissante (comportement par défaut de l'API).
- [ ] Les montants sont formatés selon la locale `fr-FR` (ex: 1 200,00 €) et colorés (Vert pour REVENU, Rouge pour DEPENSE).
- [ ] Affichage d'un état "Skeleton" (squelette de chargement) pendant la récupération des données pour éviter le _layout shift_.
- [ ] Si la liste est vide, un composant "Empty State" illustré invite l'utilisateur à saisir une transaction.
- [ ] Le filtre par catégorie est insensible à la casse (géré par le backend) mais l'UI doit normaliser l'input.
- [ ] Le filtre par type permet de sélectionner REVENU, DEPENSE ou Tous (pas de paramètre = tous).
- [ ] Le total affiché en haut de la liste se met à jour automatiquement selon les filtres actifs (appel à `/api/transactions/total` avec token).
- [ ] Le total est calculé intelligemment : REVENU (+) et DEPENSE (-) pour afficher le solde net.
- [ ] En cas d'erreur 401 (session expirée), redirection automatique vers `/login` via l'intercepteur global.
