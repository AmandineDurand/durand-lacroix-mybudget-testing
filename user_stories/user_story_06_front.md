### Explorateur d'Historique des Transactions

**En tant que** utilisateur,
**Je veux** consulter la liste de mes transactions passées avec des options de filtrage,
**Afin de** retrouver une dépense spécifique ou analyser mes dépenses sur une période.

**Parcours Utilisateur & Endpoints Ciblés :**

1. L'utilisateur accède à la page "Transactions".
2. Au chargement, l'app appelle **`GET /api/transactions/`** (sans filtre pour tout récupérer ou avec des dates par défaut pour le mois courant).
3. Une barre de filtres permet de sélectionner : Date de début, Date de fin, et Catégorie (input texte avec autocomplétion ou select).
4. À chaque modification d'un filtre (avec un _debounce_ de 300ms), l'appel API est relancé avec les query params : `?date_debut=...&date_fin=...&categorie=...`.

**Critères de Validation :**

- [ ] Affichage des transactions sous forme de tableau ou de liste de cartes (mobile-first), triées par date décroissante (comportement par défaut de l'API).
- [ ] Les montants sont formatés selon la locale `fr-FR` (ex: 1 200,00 €) et colorés (Vert pour Revenu, Rouge pour Dépense).
- [ ] Affichage d'un état "Skeleton" (squelette de chargement) pendant la récupération des données pour éviter le _layout shift_.
- [ ] Si la liste est vide, un composant "Empty State" illustré invite l'utilisateur à saisir une transaction.
- [ ] Le filtre par catégorie est insensible à la casse (géré par le backend) mais l'UI doit normaliser l'input.
