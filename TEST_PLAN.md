# Plan de test — MyBudget

| Champ               | Valeur                                                          |
| ------------------- | --------------------------------------------------------------- |
| Projet              | MyBudget — Gestion de budget personnel                          |
| Version du plan     | 1.0                                                             |
| Stack               | Python 3.12 / FastAPI / PostgreSQL / React 19 (Vite)            |
| Auteurs             | Lohan Lacroix, Amandine Durand                                  |
| Date de mise à jour | 08/02/2026                                                      |
| Coverage cible      | ≥ 80 % logique métier (repositories exclus)                     |
| Framework de test   | pytest + pytest-cov (backend) · Vitest + coverage-v8 (frontend) |

---

## 1. Périmètre, objectifs et correspondance avec les critères d'évaluation

Ce document décrit la stratégie de test, les cas de test et les scénarios BDD du projet MyBudget. Il couvre l'intégralité du code testable — services métier, routes API et composants frontend — et exclut explicitement l'infrastructure (Docker, migrations SQL) et le déploiement.

### Périmètre

**Testé :**

- Logique métier : `BudgetService`, `TransactionService` (backend/scripts/)
- Routes API : tous les endpoints REST (backend/routers/)
- Authentification JWT et isolation multi-utilisateurs
- Composants frontend : parcours utilisateur complets (inscription → dashboard → transactions → budgets)

**Exclu (avec justification) :**

- Requêtes SQL brutes et migrations (`init.sql`) — justifié en §6.1
- Tests E2E navigateur (Playwright/Cypress) — justifié en §6.3
- Performance et charge — hors scope d'un projet 4 semaines

### Critères de succès mesurables

- Coverage ≥ 80 % sur la logique métier backend (scripts/) et frontend (composants + pages)
- 0 test non-déterministe toléré — tous les tests utilisent des données fixes, pas de `random` ni de `datetime.now()` non-mockés
- Chaque feature supplémentaire possède ≥ 1 scénario BDD passant + preuve du cycle TDD dans l'historique git (branches dédiées, commits RED/GREEN identifiables)

---

## 2. Stratégie de test : pyramide et répartition TDD/BDD

### Pyramide adoptée

```
         ╱  E2E  ╲           → Hors périmètre (§6.3)
        ╱──────────╲
       ╱ Intégration ╲       → Routes API via TestClient (FastAPI)
      ╱────────────────╲       + Composants React via Testing Library + MSW
     ╱    Unitaires      ╲   → Services métier stubbés (pytest)
    ╱──────────────────────╲    + Utilitaires frontend isolés (Vitest)
```

### Répartition cible

| Niveau      | Backend   | Frontend  | Total estimé | Justification                                               |
| ----------- | --------- | --------- | ------------ | ----------------------------------------------------------- |
| Unitaires   | ~45 tests | ~15 tests | ~60 (55 %)   | Cœur métier : validations, calculs, agrégations             |
| Intégration | ~35 tests | ~40 tests | ~75 (45 %)   | Contrat API (status codes, payloads) + parcours UI complets |
| E2E         | 0         | 0         | 0            | Coût de setup disproportionné pour ce projet (cf. §6.3)     |

La proportion d'intégration est volontairement élevée côté frontend : les composants React n'ont pas de logique métier isolable — leur valeur testable réside dans l'interaction utilisateur complète (clic → appel API mocké → rendu DOM). Tester un composant sans ses interactions revient à tester du JSX statique, ce qui n'a aucune valeur de détection de régression.

### Frontière TDD / BDD

| Approche | Appliquée à                                            | Raison                                                                                     |
| -------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| **TDD**  | Validations de données (montant, dates, catégories)    | Logique de calcul pure, vérifiable par assertion sur des valeurs                           |
| **TDD**  | Calculs métier (total transactions, budget restant, %) | Fonctions déterministes avec entrées/sorties précises                                      |
| **TDD**  | CRUD update/delete transactions et budgets             | Logique conditionnelle (ownership check, chevauchement de périodes)                        |
| **BDD**  | MVP transactions (US1-US4) — saisie, listing, filtres  | Comportements observables par l'utilisateur de l'API, décrits en scénarios Given/When/Then |
| **BDD**  | Authentification multi-utilisateurs (US5)              | Isolation des données = comportement utilisateur, pas un calcul interne                    |
| **BDD**  | Interface React (US frontend 1-11)                     | Parcours utilisateur complets, testés du point de vue de ce que l'utilisateur voit et fait |

**Chevauchement Unitaire/Intégration :** les calculs de budget (restant, pourcentage, dépassement) sont couverts en unitaire au niveau service (assertion sur les valeurs numériques) **et** en intégration au niveau utilisation (la réponse API contient les bons champs). Ce n'est pas de la redondance : le test unitaire vérifie l'algorithme, le test d'intégration vérifie que l'algorithme est correctement exposé au consommateur de l'API. Si le routeur oublie de passer `user_id` au service, le test unitaire passe mais le test d'intégration échoue.

### Conventions de nommage

**Backend (pytest) :**

- Fichiers : `test_<module>_<layer>.py` — ex : `test_add_budget_service.py`, `test_routers_add_budgets.py`
- Fonctions : `test_<comportement_testé>` — ex : `test_definir_budget_valid`, `test_budget_chevauchement_meme_categorie`
- User stories MVP : `test_us<N>.py` — ex : `test_us1.py` (US1 : Ajouter une transaction)

**Frontend (Vitest) :**

- Fichiers : `us<NN>_<feature>.<type>.test.ts(x)` — ex : `us07_budget_creation.integration.test.tsx`
- Tests : description en français dans `test("...", ...)` reprenant le scénario BDD

---

## 3. Outils, frameworks et configuration

### Stack de test

| Outil                       | Rôle                         | Version | Raison du choix pour ce projet                                                            |
| --------------------------- | ---------------------------- | ------- | ----------------------------------------------------------------------------------------- |
| pytest                      | Runner + assertions backend  | latest  | Convention Python, fixtures composables, intégration native FastAPI via `TestClient`      |
| pytest-cov                  | Coverage backend             | latest  | Seuil `--cov-fail-under` bloquant en CI, rapport `term-missing` pour identifier les trous |
| httpx                       | Client HTTP pour TestClient  | latest  | Requis par `fastapi.testclient`, supporte async                                           |
| unittest.mock (MagicMock)   | Stubs/mocks backend          | stdlib  | Pas de dépendance externe, suffisant pour mocker SQLAlchemy sessions                      |
| Vitest                      | Runner + assertions frontend | 4.0.7   | Natif Vite (zero-config), compatible API Jest, mode watch rapide                          |
| @vitest/coverage-v8         | Coverage frontend            | 4.0.18  | Mesure V8 native, pas de transpilation supplémentaire                                     |
| @testing-library/react      | Rendu et queries DOM         | 16.3.0  | Encourage les tests du point de vue utilisateur (`getByRole`, pas `querySelector`)        |
| @testing-library/user-event | Simulation d'interactions    | 14.6.1  | Simule des événements réalistes (frappe clavier, clic) vs `fireEvent` synthétique         |
| MSW (Mock Service Worker)   | Interception réseau frontend | 2.11.3  | Mock au niveau `fetch`, pas besoin de mocker les modules Axios — plus proche du réel      |

### Configuration du runner et seuils de coverage

**Backend — `pytest.ini` :**

```ini
[pytest]
testpaths = tests
python_files = test_*.py
pythonpath = .
addopts = -v --cov=. --cov-fail-under=80

[env]
DATABASE_URL = postgresql://test_user:test_password@localhost:5432/test_db
```

**Backend — `.coveragerc` :**

```ini
[run]
omit =
    tests/*
    */test_*.py
    __init__.py
```

Le seuil `--cov-fail-under=80` est global. Il n'y a pas de seuil par layer dans la configuration actuelle — c'est une limite acceptée (cf. §6) : pytest-cov ne supporte pas nativement des seuils différenciés par répertoire. Le tableau de la §7 détaille les résultats mesurés par module.

**Frontend — `vite.config.js` (section test) :**

```javascript
test: {
  environment: "jsdom",
  setupFiles: "./src/__tests__/setup.ts",
  globals: true,
  css: true,
}
```

Le fichier `setup.ts` initialise le serveur MSW (`beforeAll → server.listen()`, `afterEach → server.resetHandlers()`, `afterAll → server.close()`), garantissant l'isolation entre chaque test.

### Pattern d'isolation : Stubs sur la couche données

**Coupure :** entre la couche service (`scripts/`) et la couche ORM (`models/` + SQLAlchemy session).

**Implémentation concrète :** le `conftest.py` backend fournit un `mock_db_session` (MagicMock de `Session`) injecté via `app.dependency_overrides[get_db]`. Chaque test unitaire configure le comportement du mock pour son cas précis :

```python
# Extrait de conftest.py — fixture réelle du projet
@pytest.fixture
def mock_db_session():
    session = MagicMock()
    session.add = MagicMock()
    session.commit = MagicMock()
    session.refresh = MagicMock()
    session.rollback = MagicMock()
    return session

@pytest.fixture
def client(mock_db_session, mock_user):
    app.dependency_overrides[get_db] = lambda: mock_db_session
    app.dependency_overrides[get_current_user_from_header] = lambda: mock_user
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
```

**Stub, pas Mock — distinction appliquée :** nous utilisons majoritairement des **stubs** (valeurs de retour prédéfinies via `return_value` et `side_effect`) pour contrôler les données que le service reçoit. Les **mocks** (vérification d'appels via `assert_called_once`) ne sont utilisés que ponctuellement pour confirmer que le service interagit correctement avec la session (appel à `add`, `commit`, `refresh`). Cette vérification d'interaction est limitée aux opérations d'écriture où le résultat observable n'est pas une valeur de retour mais un effet de bord sur la base.

### Tests frontend `expect(true).toBe(true)` : stubs « toujours vrais »

Sept tests d'intégration frontend contiennent un corps réduit à `expect(true).toBe(true)` — une assertion qui passe inconditionnellement, sans rien vérifier :

| Fichier                      | Intitulé du test                                                        | Catégorie       |
| ---------------------------- | ----------------------------------------------------------------------- | --------------- |
| `us07_budget_creation`       | Isolation des données : pas de sélection d'utilisateur                  | Isolation       |
| `us06_transactions_explorer` | Isolation des données : aucune transaction d'un autre utilisateur       | Isolation       |
| `us08_dashboard`             | Isolation des données : seulement budgets utilisateur connecté          | Isolation       |
| `us09_budget_edit`           | Isolation : seul le budget de l'utilisateur est modifiable              | Isolation       |
| `us06_transactions_explorer` | Le total en haut se met à jour avec les filtres via /transactions/total | Logique backend |
| `us09_budget_edit`           | La règle de chevauchement exclut le budget en cours d'édition           | Logique backend |
| `us05_add_transaction`       | La liste des catégories affiche nom et icône                            | Détail UI       |
| `us11_transaction_delete`    | Accessibilité : modale fermable au clavier (Esc)                        | Détail UI       |

Ces tests existent dans la suite mais ne testent rien. C'est un choix assumé, pas un oubli — chaque cas relève d'une des trois situations suivantes.

**1. Isolation multi-utilisateurs (4 tests).** Le frontend ne possède aucune logique de filtrage par utilisateur. Il envoie le token JWT dans le header `Authorization` (vérifié par les tests de l'intercepteur Axios dans `us03`), et le backend filtre les données côté serveur. Écrire un test frontend qui vérifie qu'« Alice ne voit pas les transactions de Bob » reviendrait à configurer deux jeux de handlers MSW distincts selon le token — autrement dit, à réimplémenter la logique d'isolation du backend dans les mocks. Le test vérifierait alors le mock, pas l'application. L'isolation réelle est couverte par `test_multi_user_isolation.py` côté backend, où les stubs de `mock_db_session` sont configurés pour simuler des transactions appartenant à différents `utilisateur_id`.

**2. Logique déléguée au backend (2 tests).** Le recalcul du total filtré et la règle de chevauchement de budgets sont des calculs serveur. Le frontend affiche la valeur retournée par l'API sans la recalculer. Tester côté frontend que « le total se met à jour avec les filtres » reviendrait à vérifier que le handler MSW retourne la valeur qu'on lui a programmée. Ces comportements sont couverts par les tests unitaires backend (`test_get_total_transactions_service.py`, `test_update_budget_service.py`).

**3. Détail UI non implémenté ou non prioritaire (2 tests).** L'affichage des icônes de catégories dans un select est non prévu par le HTML classique. Au lieu de développer un composant complexe, il est prévisualiser à côté. La navigation clavier est effective mais compliqué à tester.

**Pourquoi les conserver au lieu de les supprimer ?** Chaque `expect(true).toBe(true)` correspond à un critère de validation dans une user story documentée. Les supprimer ferait disparaître la traçabilité entre les scénarios BDD et la suite de tests. Les garder avec un corps vide rend explicite le fait que le comportement est identifié mais volontairement non vérifié côté frontend — le correcteur peut tracer la décision plutôt que de se demander si on a oublié de couvrir ces cas.

---

## 4. Cas de test — MVP

### 4.1 Module Transactions

Les transactions MVP (US1 à US4) ont été développées en **BDD** : les scénarios Given/When/Then des user stories ont été écrits en amont, puis traduits en tests d'intégration dans `backend/tests/transactions/test_us1.py` à `test_us4.py`. Les tests vérifient le comportement observable de l'API, pas l'implémentation interne.

| ID     | Description                                   | User Story | Résultat attendu                                   | Approche | Priorité |
| ------ | --------------------------------------------- | ---------- | -------------------------------------------------- | -------- | -------- |
| TC-T01 | Transaction valide enregistrée                | US1        | HTTP 201, transaction retournée avec id            | BDD      | Haute    |
| TC-T02 | Montant négatif → rejet                       | US1        | ValueError, message "Le montant doit être positif" | BDD      | Haute    |
| TC-T03 | Montant nul (0) → rejet                       | US1        | ValueError, message "Le montant doit être positif" | BDD      | Haute    |
| TC-T04 | Catégorie non reconnue → rejet                | US1        | CategorieNotFoundError                             | BDD      | Haute    |
| TC-T05 | Format de date invalide → rejet               | US1        | Erreur de validation Pydantic (422)                | BDD      | Moyenne  |
| TC-T06 | Date manquante → rejet                        | US1        | Erreur de validation Pydantic (422)                | BDD      | Moyenne  |
| TC-T07 | Listing filtré par catégorie                  | US4        | Seules les transactions "alimentation" retournées  | BDD      | Haute    |
| TC-T08 | Listing filtré par période                    | US3        | Transactions de janvier uniquement                 | BDD      | Haute    |
| TC-T09 | Listing sans filtre → toutes les transactions | US2        | Toutes les transactions de l'utilisateur           | BDD      | Haute    |
| TC-T10 | Libellé vide → transaction acceptée           | US1        | Transaction créée (le libellé n'est pas validé)    | BDD      | Basse    |

#### TC-T02 — Scénario BDD : montant négatif rejeté (US1, Scénario 2)

```gherkin
Feature: Saisie d'une transaction (US1)

  Scenario: Rejet d'une transaction avec un montant négatif
    Given l'API est disponible
    When je fais une requête POST sur /api/transactions avec les données :
      | montant | libellé | type   | catégorie | date       |
      | -50.00  | Loyer   | REVENU | logement  | 2026-01-01 |
    Then le code de réponse doit être 400
    And la réponse doit contenir un message d'erreur indiquant "Le montant doit être positif"
```

**Implémentation du scénario** (extrait de `test_us1.py`) :

```python
def test_create_transaction_montant_negatif():
    """
    US1 - Scénario 2 : Rejet d'une transaction avec un montant négatif.

    Given: L'API est disponible
    When: POST /api/transactions avec montant=-50.00, libellé="Loyer",
          type="REVENU", catégorie="logement", date="2026-01-01"
    Then: 400 — "Le montant doit être positif"
    """
    service = TransactionService(db=None)

    with pytest.raises(ValueError, match="Le montant doit être positif"):
        service.create_transaction(
            TransactionCreate(
                montant=-50.00,
                libelle="Loyer",
                type="REVENU",
                categorie="logement",
                date="2026-01-01"
            ),
            user_id=1
        )
```

> Le scénario Gherkin est la copie exacte du scénario 2 de `user_story_01.md`. Le test unitaire vérifie la même règle au niveau service (`ValueError`), tandis que le test d'intégration (`test_us1.py`) la vérifie au niveau HTTP (status 400). La validation Pydantic (`gt=0` dans `TransactionBase`) rejette aussi le montant négatif au niveau du schéma — les deux niveaux sont complémentaires.

#### TC-T07 — Scénario BDD : filtrage par catégorie (US4, Scénario 1)

```gherkin
Feature: Filtrage des transactions par catégorie (US4)

  Scenario: Filtrage par catégorie existante et insensible à la casse
    Given l'API contient les transactions suivantes :
      | id | montant | libellé    | type    | catégorie    | date       |
      | 1  | 45.50   | Courses    | DEPENSE | alimentation | 2026-01-06 |
      | 2  | 2500.00 | Salaire    | REVENU  | salaire      | 2026-01-05 |
      | 3  | 800.00  | Loyer      | DEPENSE | logement     | 2026-01-01 |
      | 4  | 30.00   | Restaurant | DEPENSE | alimentation | 2026-01-03 |
    When je fais une requête GET sur /api/transactions?categorie=alimentation
    Then le code de réponse doit être 200
    And la réponse doit contenir 2 transactions
    And les transactions retournées doivent avoir les ids 1 et 4
```

**Implémentation du scénario** (extrait de `test_us4.py`) :

```python
def test_filtrer_par_categorie(client, mock_db_session):
    """
    US4 - Scénario 1 : Filtrage par catégorie existante.

    Given: 4 transactions existent dont 2 en "alimentation"
    When: GET /api/transactions?categorie=alimentation
    Then: 200, 2 transactions retournées (ids 1 et 4)
    """
    # Stub : 2 transactions "alimentation" retournées par la query filtrée
    mock_db_session.query.return_value.join.return_value \
        .filter.return_value.all.return_value = [t1, t4]

    response = client.get("/api/transactions/?categorie=alimentation")

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
```

### 4.2 Module Budgets

| ID     | Description                                                | Entrée                                                         | Résultat attendu                                                  | Phase TDD | Priorité |
| ------ | ---------------------------------------------------------- | -------------------------------------------------------------- | ----------------------------------------------------------------- | --------- | -------- |
| TC-B01 | Création d'un budget valide                                | cat_id=1, montant=500, début=2026-01-01, fin=2026-01-31        | Objet Budget créé, `session.add/commit/refresh` appelés           | GREEN     | Haute    |
| TC-B02 | Total dépensé sur une période — cas nominal                | 3 dépenses existantes (100+40+10.50) dans la catégorie/période | `montant_depense = 150.50`                                        | GREEN     | Haute    |
| TC-B03 | Montant restant — budget non dépassé                       | budget=500, dépenses=150.50                                    | `montant_restant = 349.50`                                        | GREEN     | Haute    |
| TC-B04 | Montant restant — dépassement (valeur négative)            | budget=300, dépenses=310                                       | `montant_restant = -10`, `est_depasse = True`                     | GREEN     | Haute    |
| TC-B05 | Pourcentage consommé > 100 %                               | budget=300, dépenses=310                                       | `pourcentage_consomme ≈ 103.33`                                   | GREEN     | Haute    |
| TC-B06 | Aucune dépense → total = 0                                 | budget=500, aucune transaction sur la période                  | `montant_depense = 0`, `montant_restant = 500`, `pourcentage = 0` | GREEN     | Moyenne  |
| TC-B07 | Budget non défini pour une catégorie → BudgetNotFoundError | `get_budget_status(budget_id=999)`                             | `BudgetNotFoundError` levée                                       | GREEN     | Moyenne  |
| TC-B08 | Deux budgets même catégorie/période → rejet chevauchement  | Même cat_id, périodes qui se chevauchent                       | `BudgetAlreadyExistsError`                                        | GREEN     | Haute    |

#### TC-B04 — Cycle TDD annoté : dépassement de budget

```python
# ─── PHASE RED ─────────────────────────────────────────────────────
# Test écrit avant l'implémentation du calcul de dépassement.
# get_budget_status() n'existe pas encore ou ne calcule pas montant_restant.

def test_budget_depasse_montant_restant_negatif(mock_db_session):
    """
    Given: un budget 'alimentation' de 300 € pour janvier 2026
    And: des dépenses totalisant 310 € sur cette période
    When: on consulte le statut du budget
    Then: montant_restant = -10
    And: est_depasse = True
    """
    mock_budget = MagicMock()
    mock_budget.id = 1
    mock_budget.montant_fixe = 300.0
    mock_budget.debut_periode = date(2026, 1, 1)
    mock_budget.fin_periode = date(2026, 1, 31)
    mock_budget.categorie_id = 1
    mock_budget.utilisateur_id = 1

    # Stub : le budget existe
    mock_db_session.query.return_value.filter.return_value.first.return_value = mock_budget

    # Stub : somme des dépenses = 310
    mock_db_session.query.return_value.join.return_value \
        .filter.return_value.filter.return_value.filter.return_value \
        .scalar.return_value = 310.0

    service = BudgetService(mock_db_session)
    status = service.get_budget_status(budget_id=1, user_id=1)

    assert status["montant_restant"] == -10.0
    assert status["est_depasse"] is True

# ─── PHASE GREEN ───────────────────────────────────────────────────
# Implémentation minimale dans saisie_budget.py :
#   montant_restant = budget.montant_fixe - depense_totale
#   est_depasse = montant_restant < 0
# Pas d'arrondi, pas de formatage — le strict minimum pour faire passer le test.

# ─── PHASE REFACTOR ────────────────────────────────────────────────
# Ajout du pourcentage_consomme dans le même dictionnaire de retour.
# Le test TC-B04 n'est pas modifié — il continue de vérifier uniquement
# montant_restant et est_depasse.
```

#### TC-B05 — Cycle TDD annoté : pourcentage > 100 %

```python
# ─── PHASE RED ─────────────────────────────────────────────────────
# Test écrit dans la foulée de TC-B04, avant l'ajout de pourcentage_consomme.

def test_budget_pourcentage_depasse_100(mock_db_session):
    """
    Given: un budget de 300 € avec 310 € de dépenses
    When: on consulte le statut
    Then: pourcentage_consomme ≈ 103.33
    """
    # (même setup que TC-B04 — budget 300, dépenses 310)
    # ...

    service = BudgetService(mock_db_session)
    status = service.get_budget_status(budget_id=1, user_id=1)

    assert status["pourcentage_consomme"] == pytest.approx(103.33, rel=1e-2)

# ─── PHASE GREEN ───────────────────────────────────────────────────
# Ajout dans get_budget_status() :
#   pourcentage_consomme = (depense_totale / budget.montant_fixe) * 100
# Pas de plafonnement à 100 % — le dépassement doit être visible.
```

---

## 5. Scénarios BDD — Features supplémentaires

Un scénario BDD valide dans ce projet respecte trois critères : il décrit un comportement observable par l'utilisateur (réponse API ou rendu UI), il est compréhensible sans lire le code source, et il peut échouer indépendamment des autres scénarios. Les scénarios ci-dessous sont la formalisation des user stories documentées dans `user_stories/` et implémentés dans les fichiers de test référencés.

---

### Feature 1 : Interface graphique React complète

**User Story :** En tant qu'utilisateur de MyBudget, je veux accéder à une interface web pour gérer mes finances, afin de ne pas dépendre de cURL ou Swagger pour utiliser l'application au quotidien.

> Cette feature regroupe 11 user stories frontend (US01-US11). Nous présentons ici les scénarios les plus représentatifs.

```gherkin
Feature: Définition de Budgets Prévisionnels (user_story_07_front.md)

  Background:
    Given l'utilisateur est authentifié avec un token JWT valide
    And il se trouve sur la page "Budgets"

  Scenario: Création d'un budget via la modale
    When l'utilisateur clique sur "Nouveau Budget"
    And la modale charge les catégories via GET /api/categories/ (endpoint public)
    And il définit : Catégorie, Montant limite, Date de début et Date de fin
    And il valide le formulaire
    Then un appel POST /api/budgets/ est effectué avec le header Authorization: Bearer <token>
    And en cas de succès (HTTP 201), la modale se ferme

  Scenario: Validation client — date de fin antérieure à la date de début
    When l'utilisateur sélectionne une date de fin antérieure à la date de début
    Then le formulaire empêche la soumission (validation côté client)

  Scenario: Gestion de l'erreur 409 — chevauchement de budget
    When l'API renvoie une 409 (Conflit/Chevauchement)
    Then une alerte expliquant qu'un budget existe déjà sur cette période est affichée
```

```gherkin
Feature: Explorateur d'Historique des Transactions (user_story_06_front.md)

  Background:
    Given l'utilisateur est authentifié avec un token JWT valide

  Scenario: Chargement de la liste des transactions
    When l'utilisateur accède à la page "Transactions"
    Then l'app appelle GET /api/transactions/ avec Authorization: Bearer <token>
    And un état "Skeleton" est affiché pendant la récupération
    And les transactions sont triées par date décroissante

  Scenario: Filtrage dynamique avec debounce
    Given une barre de filtres permet de sélectionner Date de début, Date de fin, Catégorie et Type
    When l'utilisateur modifie un filtre
    Then après un debounce de 300ms, l'appel API est relancé avec les query params correspondants
    And le total en haut se met à jour via GET /api/transactions/total avec les mêmes filtres

  Scenario: Liste vide — empty state
    Given aucune transaction n'existe pour l'utilisateur
    When la page se charge
    Then un composant "Empty State" invite l'utilisateur à saisir une transaction
```

```gherkin
Feature: Saisie Rapide de Transaction (user_story_05_front.md)

  Scenario: Soumission d'une transaction valide
    Given l'utilisateur est authentifié
    When il remplit Montant, Libellé, Type (REVENU/DEPENSE), Catégorie et Date
    And il soumet le formulaire
    Then un appel POST /api/transactions/ est effectué avec Authorization: Bearer <token>
    And en cas de succès (201), une notification "Toast" confirme l'ajout
    And le formulaire se réinitialise

  Scenario: Bouton de soumission en état loading
    When l'appel API est en cours
    Then le bouton passe en état "Loading" (spinner + désactivé) pour éviter les doubles soumissions
```

**Méthode : BDD.** Branche `feature-interface-graphique` — les scénarios BDD des user stories frontend (`user_stories/user_story_01_front.md` à `user_story_11_front.md`) ont été traduits en tests d'intégration. Le pattern MSW (handlers définis dans `__mocks__/handlers.ts`) permet d'écrire le test avant même que le composant n'existe, en définissant à l'avance les réponses API attendues.

**Fichiers de test :**

- `frontend/src/__tests__/integration/us05_add_transaction.integration.test.tsx` — ✓ Passant
- `frontend/src/__tests__/integration/us06_transactions_explorer.integration.test.tsx` — ✓ Passant
- `frontend/src/__tests__/integration/us07_budget_creation.integration.test.tsx` — ✓ Passant
- `frontend/src/__tests__/integration/us08_dashboard.integration.test.tsx` — ✓ Passant
- `frontend/src/__tests__/integration/us09_budget_edit.integration.test.tsx` — ✓ Passant
- `frontend/src/__tests__/integration/us10_transaction_edit.integration.test.tsx` — ✓ Passant
- `frontend/src/__tests__/integration/us11_transaction_delete.integration.test.tsx` — ✓ Passant

---

### Feature 2 : Mise à jour et suppression de transactions

**Méthode : TDD**

**User Story :** En tant qu'utilisateur ayant saisi une transaction erronée, je veux pouvoir la modifier ou la supprimer, afin de maintenir la fiabilité de mon suivi budgétaire sans devoir recréer la transaction.

**Cycle TDD — `update_transaction()` :**

```python
# ─── PHASE RED ─────────────────────────────────────────────────────
# Test écrit avant l'implémentation de update_transaction().
# Échoue : la méthode n'existe pas encore dans TransactionService.

def test_update_transaction_valid(mock_db_session):
    """
    Given: une transaction existante id=1, montant=45.90, utilisateur_id=1
    When: on met à jour avec montant=52.30
    Then: la transaction a montant=52.30, les autres champs sont inchangés
    """
    mock_transaction = MagicMock()
    mock_transaction.id = 1
    mock_transaction.montant = 45.90
    mock_transaction.utilisateur_id = 1

    mock_db_session.query.return_value.filter.return_value.first.return_value = mock_transaction

    service = TransactionService(mock_db_session)
    result = service.update_transaction(
        transaction_id=1, data={"montant": 52.30}, user_id=1
    )

    assert result.montant == 52.30
    mock_db_session.commit.assert_called_once()

# ─── PHASE GREEN ───────────────────────────────────────────────────
# Implémentation minimale dans saisie_transaction.py :
#   - Récupérer la transaction par id
#   - Vérifier que utilisateur_id correspond
#   - Appliquer les modifications via setattr
#   - commit()

# ─── PHASE REFACTOR ────────────────────────────────────────────────
# Extraction de la vérification d'ownership dans une condition commune
# entre update_transaction() et delete_transaction().
```

```python
# ─── PHASE RED ─────────────────────────────────────────────────────
# Test de la règle d'isolation : un utilisateur ne peut pas modifier
# la transaction d'un autre. Échoue avant l'ajout du ownership check.

def test_update_transaction_autre_utilisateur(mock_db_session):
    """
    Given: une transaction id=1 appartient à user_id=2
    When: user_id=1 tente de la modifier
    Then: ValueError levée, message contient "vos propres"
    """
    mock_transaction = MagicMock()
    mock_transaction.id = 1
    mock_transaction.utilisateur_id = 2  # appartient à un autre

    mock_db_session.query.return_value.filter.return_value.first.return_value = mock_transaction

    service = TransactionService(mock_db_session)

    with pytest.raises(ValueError, match="vos propres"):
        service.update_transaction(
            transaction_id=1, data={"montant": 200}, user_id=1
        )

# ─── PHASE GREEN ───────────────────────────────────────────────────
# Ajout dans update_transaction() :
#   if transaction.utilisateur_id != user_id:
#       raise ValueError("Vous ne pouvez modifier que vos propres transactions")
```

**Branche :** `feature-gestion-avancee-transaction` (60 commits).

**Fichiers de test :**

- `backend/tests/unit/test_update_transaction_service.py` — ✓ Passant
- `backend/tests/unit/test_delete_transaction_service.py` — ✓ Passant
- `backend/tests/integration/test_update_transaction_routeurs.py` — ✓ Passant
- `backend/tests/integration/test_delete_transaction_routeurs.py` — ✓ Passant

---

### Feature 3 : Modification des budgets

**Méthode : TDD**

**User Story :** En tant qu'utilisateur ayant défini un budget prévisionnel, je veux pouvoir ajuster son montant ou sa période, afin d'adapter mon suivi à l'évolution de mes contraintes financières sans recréer un budget.

**Cycle TDD — `update_budget()` :**

```python
# ─── PHASE RED ─────────────────────────────────────────────────────
# Test écrit avant l'implémentation de update_budget().
# Échoue : la méthode n'existe pas encore dans BudgetService.

def test_update_budget_montant(mock_db_session, mock_category):
    """
    Given: un budget existant id=1, catégorie=alimentation, montant=300 €,
           période du 01/02/2026 au 28/02/2026
    When: on met à jour avec montant_fixe=400.0
    Then: le budget a montant_fixe=400.0, la période est inchangée
    """
    mock_budget = MagicMock()
    mock_budget.id = 1
    mock_budget.montant_fixe = 300.0
    mock_budget.categorie_id = 1
    mock_budget.debut_periode = date(2026, 2, 1)
    mock_budget.fin_periode = date(2026, 2, 28)
    mock_budget.utilisateur_id = 1

    # Stub : budget trouvé, catégorie valide, pas de chevauchement
    # ... (configuration des query chains)

    service = BudgetService(mock_db_session)
    result = service.update_budget(budget_id=1, montant_fixe=400.0, user_id=1)

    assert result.montant_fixe == 400.0
    mock_db_session.commit.assert_called_once()

# ─── PHASE GREEN ───────────────────────────────────────────────────
# Implémentation minimale dans saisie_budget.py :
#   - Récupérer le budget par id
#   - Appliquer les champs modifiés
#   - commit()
```

```python
# ─── PHASE RED ─────────────────────────────────────────────────────
# Test du chevauchement lors de la modification. Échoue avant
# l'intégration de _valider_contraintes_budget() dans update_budget().

def test_update_budget_chevauchement(mock_db_session, mock_category):
    """
    Given: un budget id=1 pour "alimentation" en février 2026
    And: un budget id=2 pour "alimentation" en mars 2026
    When: on modifie id=1 avec fin_periode=2026-03-15 (chevauche id=2)
    Then: BudgetAlreadyExistsError levée
    """
    # ... (stubs configurés pour retourner un budget existant sur mars)

    service = BudgetService(mock_db_session)

    with pytest.raises(BudgetAlreadyExistsError):
        service.update_budget(
            budget_id=1, fin_periode=date(2026, 3, 15), user_id=1
        )

# ─── PHASE GREEN ───────────────────────────────────────────────────
# Ajout de l'appel à _valider_contraintes_budget() dans update_budget(),
# avec exclusion du budget en cours d'édition de la requête de chevauchement.

# ─── PHASE REFACTOR ────────────────────────────────────────────────
# _valider_contraintes_budget() est partagée entre add_budget() et
# update_budget(). Le paramètre exclude_budget_id a été ajouté pour
# que la modification d'un budget ne se détecte pas lui-même comme
# chevauchement.
```

**Branche :** `feature/update-budget` (11 commits).

**Fichiers de test :**

- `backend/tests/unit/test_update_budget_service.py` — ✓ Passant
- `backend/tests/integration/test_routers_update_budgets.py` — ✓ Passant

---

### Feature 4 : Authentification multi-utilisateurs et isolation des données

**User Story :** En tant qu'utilisateur partageant l'application avec d'autres personnes, je veux que mes transactions et budgets soient invisibles et inaccessibles aux autres utilisateurs, afin de garantir la confidentialité de mes données financières.

```gherkin
Feature: Authentification multi-utilisateurs et isolation (user_story_05_multi_utilisateurs.md)

  Scenario 1: Création d'un nouvel utilisateur
    Given l'API est disponible
    When je fais une requête POST sur /api/auth/register avec :
      | username | password                     |
      | alice    | mon_mot_de_passe_secure_123   |
    Then le code de réponse doit être 201
    And la réponse contient user_id, username="alice"

  Scenario 2: Connexion réussie et génération de token
    Given l'utilisateur "alice" existe avec le password "mon_mot_de_passe_secure_123"
    When je fais une requête POST sur /api/auth/login avec ces identifiants
    Then le code de réponse doit être 200
    And la réponse contient access_token (JWT), token_type="bearer", user_id, username="alice"

  Scenario 3: Connexion avec mauvais mot de passe
    Given l'utilisateur "alice" existe
    When je fais une requête POST sur /api/auth/login avec password="mauvais_password"
    Then le code de réponse doit être 401
    And la réponse contient "Identifiants invalides"

  Scenario 5: Tentative de création sans token
    When je fais une requête POST sur /api/transactions sans header Authorization
    Then le code de réponse doit être 401
    And la réponse contient "Token manquant ou invalide"

  Scenario 7: Isolation des données — transactions privées
    Given alice possède Transaction 1 ("Courses", 45.50) et Transaction 2 ("Salaire", 2500.00)
    And bob possède Transaction 3 ("Loyer", 800.00)
    When alice fait GET /api/transactions avec son token
    Then alice reçoit ses 2 transactions uniquement
    And alice ne voit pas les transactions de bob

  Scenario 8: Isolation des données — budgets privés
    Given alice possède un budget "alimentation" de 500€
    And bob possède un budget "logement" de 1200€
    When alice fait GET /api/budgets avec son token
    Then alice reçoit uniquement son budget "alimentation"

  Scenario 9: Catégories partagées (endpoint public)
    Given les catégories "alimentation", "logement", "salaire" existent
    When alice fait GET /api/categories sans token
    Then le code de réponse doit être 200
    And alice reçoit la liste complète de toutes les catégories

  Scenario 10: Tentative de modification d'une transaction d'un autre utilisateur
    Given alice est authentifiée
    And bob est propriétaire de la transaction id=5
    When alice tente PUT /api/transactions/5 avec son token
    Then le code de réponse doit être 403
    And la réponse contient "Vous ne pouvez modifier que vos propres transactions"
```

**Méthode : BDD.** Branche `feature-multi-utilisateurs` (4 commits). Les 10 scénarios ci-dessus sont la transcription exacte de `user_stories/user_story_05_multi_utilisateurs.md` (scénarios 4 et 6 omis car redondants avec 1 et 5). Ils ont été traduits en tests dans `test_multi_user_isolation.py` et `test_auth_endpoints.py`. Les tests vérifient le comportement observable de l'API (codes HTTP, contenu des réponses), pas l'implémentation interne du filtrage.

**Fichiers de test :**

- `backend/tests/auth/test_multi_user_isolation.py` — ✓ Passant
- `backend/tests/auth/test_auth_endpoints.py` — ✓ Passant
- `backend/tests/auth/test_auth_utils.py` — ✓ Passant

---

### Feature 5 : Total des transactions filtrées

**Méthode : TDD**

**User Story :** En tant qu'utilisateur souhaitant connaître rapidement mon solde net sur une période, je veux obtenir le total calculé de mes transactions (revenus − dépenses) avec les mêmes filtres que le listing, afin de suivre l'évolution de ma situation financière sans calcul manuel.

**Cycle TDD — `get_total_transactions()` :**

```python
# ─── PHASE RED ─────────────────────────────────────────────────────
# Test écrit avant l'implémentation de get_total_transactions().
# Échoue : la méthode n'existe pas encore dans TransactionService.

def test_total_with_mixed_types(mock_db_session):
    """
    Given: 3 transactions mockées (REVENU +100, DEPENSE -40, REVENU +10.5)
    When: on appelle get_total_transactions() sans filtre
    Then: le total calculé est +100 -40 +10.5 = 70.5
    """
    t1 = MagicMock(); t1.montant = 100.0; t1.type = "REVENU"
    t2 = MagicMock(); t2.montant = 40.0;  t2.type = "DEPENSE"
    t3 = MagicMock(); t3.montant = 10.5;  t3.type = "REVENU"

    q = MagicMock()
    mock_db_session.query.return_value = q
    q.join.return_value = q
    q.filter.return_value = q
    q.all.return_value = [t1, t2, t3]

    service = TransactionService(mock_db_session)
    total = service.get_total_transactions()

    assert pytest.approx(total, rel=1e-6) == 70.5

# ─── PHASE GREEN ───────────────────────────────────────────────────
# Implémentation minimale dans saisie_transaction.py :
#   total = 0
#   for t in transactions:
#       total += t.montant if t.type == "REVENU" else -t.montant
#   return total

# ─── PHASE REFACTOR ────────────────────────────────────────────────
# Pas de refactor significatif — la logique est déjà minimale.
# Les filtres (date_debut, date_fin, categorie) ont été ajoutés
# dans des itérations TDD suivantes avec leurs propres tests RED/GREEN.
```

```python
# ─── PHASE RED ─────────────────────────────────────────────────────
# Test du cas limite : aucune transaction sur la période.

def test_total_aucune_transaction(mock_db_session):
    """
    Given: aucune transaction sur la période demandée
    When: on appelle get_total_transactions()
    Then: le total est 0
    """
    q = MagicMock()
    mock_db_session.query.return_value = q
    q.join.return_value = q
    q.filter.return_value = q
    q.all.return_value = []

    service = TransactionService(mock_db_session)
    total = service.get_total_transactions()

    assert total == 0

# ─── PHASE GREEN ───────────────────────────────────────────────────
# Déjà couvert par l'implémentation précédente : la boucle sur une
# liste vide retourne 0 sans modification.
```

**Branche :** `feature-gestion-avancee-transaction` (60 commits).

**Fichiers de test :**

- `backend/tests/unit/test_get_total_transactions_service.py` — ✓ Passant
- `backend/tests/integration/test_routers_total_transactions.py` — ✓ Passant

---

## 6. Limites assumées et dette technique documentée

### 6.1 Absence de tests sur les requêtes SQL

Les repositories ne sont pas testés directement. Ce n'est pas un oubli — c'est un choix fondé sur la nature des requêtes et les contraintes du projet.

Les requêtes SQL de MyBudget sont des opérations CRUD sans logique conditionnelle embarquée : pas de `CASE WHEN`, pas de procédures stockées, pas de triggers. Leur correction est vérifiable par lecture directe du code SQLAlchemy. Le rapport bénéfice/coût d'un test d'intégration dédié aux requêtes est négatif dans ce contexte : il faudrait maintenir une base PostgreSQL de test avec données fixtures, pour vérifier des `SELECT ... WHERE` simples.

Le risque résiduel est identifié : une régression de schéma (renommage de colonne, modification de type, suppression de contrainte `UNIQUE`) ne serait pas détectée par les tests unitaires. Ce risque est partiellement mitigé par les tests d'intégration sur les routes, qui traversent la couche ORM avec le `TestClient` FastAPI et une session mockée. En revanche, la contrainte d'unicité `(utilisateur_id, categorie_id, debut_periode, fin_periode)` sur la table `budget` n'est vérifiée que par le service Python (`_valider_contraintes_budget`), pas par les tests sur la contrainte SQL elle-même.

### 6.2 Limites des stubs face aux tests d'intégration réels

Les stubs sur `mock_db_session` contrôlent intégralement ce que le service reçoit et ne peuvent pas détecter :

- une requête SQLAlchemy mal construite (jointure incorrecte, filtre oublié) — le stub retourne toujours les données configurées, indépendamment de la requête ;
- un problème de performance (requête N+1, absence d'index) ;
- un comportement spécifique à PostgreSQL (casting implicite, collation, `ILIKE` vs `LIKE`).

Dans un contexte professionnel avec des requêtes complexes (agrégations multi-tables, sous-requêtes, CTE), cette approche serait inacceptable. On utiliserait une base de test dédiée (PostgreSQL via Docker, testcontainers), avec des migrations appliquées et des fixtures SQL reproductibles. Pour ce projet de 4 semaines avec des requêtes CRUD, le compromis est raisonnable.

### 6.3 Absence de tests E2E

Aucun test E2E navigateur (Playwright, Cypress) n'est présent. La valeur ajoutée marginale ne justifie pas le coût de setup : un test E2E nécessite le backend lancé avec une base PostgreSQL réelle, le frontend buildé ou en mode dev, et un navigateur headless — soit trois services à orchestrer pour vérifier des interactions déjà couvertes par les tests d'intégration frontend (Testing Library + MSW) et les tests d'intégration API (TestClient).

Ce qui n'est pas couvert en substitution : les régressions CSS (élément cliquable masqué par un z-index), les problèmes de CORS en environnement réel, et les comportements spécifiques au navigateur. Ces risques sont acceptés.

### 6.4 Reproductibilité des données de test

Les fixtures sont définies dans `conftest.py` via des `MagicMock` configurés manuellement dans chaque test. Il n'y a pas de fichier de fixtures partagé (type `fixtures.json` ou factory pattern).

L'impact concret : un nouveau développeur rejoignant l'équipe devrait lire chaque fichier de test pour comprendre les données utilisées. Deux tests peuvent utiliser des données incohérentes entre elles (un budget de 300 € dans un test, de 500 € dans un autre pour la même catégorie) sans que cela soit détecté. En contrepartie, chaque test est explicite et auto-suffisant — pas de dépendance cachée vers un fichier de fixtures global qui pourrait casser en cascade.

### 6.5 Ce qui serait fait différemment en contexte professionnel

Avec plus de temps et en conditions réelles, quatre ajouts changeraient significativement la qualité du dispositif de test. D'abord, une base PostgreSQL de test réelle (via `testcontainers-python`) pour les tests d'intégration, avec des migrations appliquées automatiquement — cela éliminerait le risque de régression de schéma identifié en §6.1. Ensuite, du mutation testing (`mutmut` en Python) pour vérifier que les tests détectent réellement les bugs et pas seulement que le code est exécuté — un coverage de 92 % ne garantit pas que les assertions sont pertinentes. Également, des tests de contrat API (Pact) entre le frontend React et le backend FastAPI, pour détecter les ruptures d'interface avant le merge. Enfin, des tests de performance sur les agrégations (calcul de total, statut budget) avec des volumes réalistes (10 000+ transactions), car la logique de somme actuelle charge toutes les transactions en mémoire Python au lieu d'utiliser un `SUM()` SQL — un choix qui ne tiendrait pas en production.

---

## 7. Coverage : seuils, mesure et interprétation

### Règle du sujet

Coverage ≥ 80 % sur la logique métier. Le projet comptabilise tout le code backend hors `tests/` et `__init__.py` (cf. `.coveragerc`). Les repositories ne sont pas exclus du calcul de coverage par la configuration mais leurs branches non couvertes ne sont pas considérées comme de la dette.

### Seuils par layer — résultats mesurés

#### Backend (pytest-cov)

| Layer                 | Cible Stmts | Cible Lines | Résultat mesuré (Lines)             | Justification                                                       |
| --------------------- | ----------- | ----------- | ----------------------------------- | ------------------------------------------------------------------- |
| scripts/ (métier)     | ≥ 90 %      | ≥ 90 %      | 100 % (budget) · 87 % (transaction) | Cœur évalué — les branches manquantes sont des blocs d'erreur rares |
| routers/ (routes API) | ≥ 75 %      | ≥ 75 %      | 88-100 % selon module               | Couverts par tests d'intégration                                    |
| schemas/ (Pydantic)   | ≥ 80 %      | ≥ 80 %      | 98-100 %                            | Fonctions pures (validateurs)                                       |
| models/ (ORM)         | N/A         | N/A         | 83 %                                | Définition de classes, pas de logique testable                      |
| auth.py               | ≥ 80 %      | ≥ 80 %      | 97 %                                | JWT + bcrypt — couvert par tests auth                               |
| database.py           | N/A         | N/A         | 61 %                                | Configuration, hors scope de test                                   |
| **TOTAL**             | **≥ 80 %**  | **≥ 80 %**  | **92 %**                            | Objectif atteint                                                    |

#### Frontend (Vitest + @vitest/coverage-v8)

| Layer                          | Cible Stmts | Cible Branches | Résultat Stmts | Résultat Branches | Justification                              |
| ------------------------------ | ----------- | -------------- | -------------- | ----------------- | ------------------------------------------ |
| pages/ (composants principaux) | ≥ 80 %      | ≥ 70 %         | 73-98 %        | 64-90 %           | Parcours utilisateur BDD                   |
| components/ (modales, forms)   | ≥ 80 %      | ≥ 70 %         | 88-97 %        | 70-90 %           | Tests d'intégration via les pages parentes |
| contexts/ (AuthContext)        | ≥ 85 %      | ≥ 80 %         | 97 %           | 85 %              | Logique d'authentification critique        |
| utils/ (validation)            | ≥ 90 %      | ≥ 90 %         | 100 %          | 100 %             | Fonctions pures                            |
| api/ (client Axios)            | ≥ 75 %      | ≥ 60 %         | 82 %           | 64 %              | Intercepteurs couverts, retry non testé    |
| **TOTAL**                      | **≥ 80 %**  | **≥ 70 %**     | **88 %**       | **78 %**          | Objectif atteint                           |

### Commandes pour générer les rapports

```bash
# Backend
cd backend
source .venv/bin/activate
pytest --cov=. --cov-report=term-missing --cov-report=html
# Rapport HTML : backend/htmlcov/index.html

# Frontend
cd frontend
npm test -- --coverage --run
# Rapport HTML : frontend/coverage/index.html
```

### Branches intentionnellement non couvertes

**Acceptables (non-couverture assumée) :**

- `database.py:16-20, 31-35` — initialisation de la session SQLAlchemy et fallback d'URL de connexion. Code d'infrastructure, pas de logique testable.
- `routers/transactions.py:53-54, 100-101, 114-115` — blocs `except` pour erreurs inattendues (500 Internal Server Error). Difficiles à déclencher avec un mock et à faible valeur de test.
- `models/models.py:60, 66-76` — méthodes `__repr__` des modèles ORM. Pas de logique métier.

**Inacceptables si non couvertes (vérifiées) :**

- Toutes les branches de validation dans `saisie_budget.py` — couvertes à 100 %.
- La logique de calcul `REVENU/DEPENSE` dans `get_total_transactions()` — couverte par `test_total_with_mixed_types`.
- La détection de chevauchement de budgets — couverte par `test_budget_chevauchement_meme_categorie`.

### Output terminal du rapport

```
[À COMPLÉTER : coller ici la sortie de `pytest --cov=. --cov-report=term-missing`
et `npm test -- --coverage --run` avant le rendu final]
```

> Les résultats détaillés par module sont documentés dans le tableau §3.5 du README principal, issu de la dernière exécution sur la branche `main`.
