# MyBudget - API de Gestion de Budget Personnel

Application de gestion de budget personnel développée avec FastAPI et PostgreSQL, permettant de suivre ses revenus et dépenses avec un système d'authentification multi-utilisateurs.

## 📋 Fonctionnalités du MVP

- **Gestion des transactions** : Création et consultation des revenus et dépenses
- **Filtres avancés** : Filtrage par date et par catégorie
- **Gestion des budgets** : Création et suivi des budgets par catégorie
- **API RESTful** : Interface complète et documentée

## 🔧 Prérequis

- [Docker](https://www.docker.com/) et Docker Compose installés
- Python 3.8+ (pour l'exécution des tests en local)

## 🚀 Installation et Lancement

### 1. Cloner le projet

```bash
git clone https://github.com/AmandineDurand/durand-lacroix-mybudget-testing.git
cd Mybudget-testing
```

### 2. Créer le fichier d'environnement

2.1 Créer un fichier `.env` à la racine du projet avec le contenu suivant :

```env
POSTGRES_DB=budget_db
POSTGRES_USER=budget_user
POSTGRES_PASSWORD=budget_password
POSTGRES_PORT=5432
SECRET_KEY=votre_cle_secrete_jwt_ici
```

2.2 Pour créer la clé secrète, exécuter la commande suivante dans un terminal :
```python
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

2.3 Coller la clé dans la variable `SECRET_KEY` du .env

### 3. Lancer l'application avec Docker

```bash
docker-compose up --build -d
```

L'API sera accessible sur : **http://localhost:8000**

La documentation interactive Swagger : **http://localhost:8000/docs**

### 4. Arrêter l'application

```bash
docker-compose down
```

## 📖 Utilisation de l'API

### Gestion des Transactions

#### Créer une transaction

```bash
curl -X POST http://localhost:8000/api/transactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer VOTRE_TOKEN_ICI" \
  -d '{
    "montant": 45.50,
    "libelle": "Courses Carrefour",
    "type": "DEPENSE",
    "categorie": "alimentation",
    "date": "2026-01-06"
  }'
```

#### Récupérer toutes les transactions

```bash
curl -X GET http://localhost:8000/api/transactions \
  -H "Authorization: Bearer VOTRE_TOKEN_ICI"
```

#### Filtrer par période

```bash
# Transactions entre deux dates
curl -X GET "http://localhost:8000/api/transactions?date_debut=2026-01-01&date_fin=2026-01-31" \
  -H "Authorization: Bearer VOTRE_TOKEN_ICI"

# Transactions à partir d'une date
curl -X GET "http://localhost:8000/api/transactions?date_debut=2026-01-01" \
  -H "Authorization: Bearer VOTRE_TOKEN_ICI"
```

#### Filtrer par catégorie

```bash
curl -X GET "http://localhost:8000/api/transactions?categorie=alimentation" \
  -H "Authorization: Bearer VOTRE_TOKEN_ICI"
```

#### Combiner les filtres

```bash
curl -X GET "http://localhost:8000/api/transactions?date_debut=2026-01-01&categorie=alimentation" \
  -H "Authorization: Bearer VOTRE_TOKEN_ICI"
```

### Gestion des Budgets

#### Créer un budget

```bash
curl -X POST http://localhost:8000/api/budgets \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer VOTRE_TOKEN_ICI" \
  -d '{
    "categorie": "alimentation",
    "montant_max": 300.00,
    "periode": "2026-01"
  }'
```

#### Récupérer tous les budgets

```bash
curl -X GET http://localhost:8000/api/budgets \
  -H "Authorization: Bearer VOTRE_TOKEN_ICI"
```

#### Récupérer un budget spécifique

```bash
curl -X GET http://localhost:8000/api/budgets/1 \
  -H "Authorization: Bearer VOTRE_TOKEN_ICI"
```

### Catégories

#### Lister les catégories disponibles

```bash
curl -X GET http://localhost:8000/api/categories
```

## 🧪 Exécution des Tests

### Prérequis pour les tests

Installer les dépendances Python :

```bash
cd backend
pip install -r requirements.txt
```

### Lancer tous les tests

```bash
cd backend
pytest
```

### Lancer les tests avec couverture

```bash
cd backend
pytest --cov=. --cov-report=html
```

Le rapport de couverture sera généré dans `backend/htmlcov/index.html`.

### Lancer des tests spécifiques

```bash
# Tests d'authentification uniquement
pytest tests/auth/

# Tests des transactions
pytest tests/transactions/

# Tests d'intégration
pytest tests/integration/

# Tests unitaires
pytest tests/unit/
```

## 📚 Documentation des Scénarios BDD (User Stories)

Le projet suit une approche Behavior-Driven Development (BDD) avec des user stories détaillées.

### User Story 1 : Ajouter une transaction
**Fichier** : [user_stories/user_story_01.md](user_stories/user_story_01.md)

**Objectif** : Permettre à un utilisateur d'enregistrer une nouvelle transaction (revenu ou dépense).

**Critères d'acceptation** :
- Montant positif obligatoire
- Type REVENU ou DEPENSE
- Catégorie et date obligatoires
- Retour HTTP 201 en cas de succès

### User Story 2 : Liste des transactions
**Fichier** : [user_stories/user_story_02.md](user_stories/user_story_02.md)

**Objectif** : Consulter l'historique complet de ses transactions.

**Critères d'acceptation** :
- Retourne toutes les transactions de l'utilisateur connecté
- Format JSON avec tous les attributs
- Retourne un tableau vide si aucune transaction

### User Story 3 : Filtrage par période
**Fichier** : [user_stories/user_story_03.md](user_stories/user_story_03.md)

**Objectif** : Filtrer les transactions sur une période donnée.

**Critères d'acceptation** :
- Filtrage par date de début et/ou date de fin
- Dates au format ISO 8601
- Validation des dates

### User Story 4 : Filtrage par catégorie
**Fichier** : [user_stories/user_story_04.md](user_stories/user_story_04.md)

**Objectif** : Consulter les transactions d'une catégorie spécifique.

**Critères d'acceptation** :
- Recherche insensible à la casse
- Combinable avec le filtre de période
- Retourne un tableau vide si aucune correspondance

## 🏗️ Architecture du Projet

```
backend/
├── app.py              # Point d'entrée de l'application
├── auth.py             # Gestion de l'authentification JWT
├── database.py         # Configuration de la base de données
├── models/             # Modèles SQLAlchemy
├── routers/            # Routes de l'API
│   ├── auth.py         # Routes d'authentification
│   ├── transactions.py # Routes des transactions
│   ├── budgets.py      # Routes des budgets
│   └── categories.py   # Routes des catégories
├── schemas/            # Schémas Pydantic
└── tests/              # Tests automatisés
    ├── auth/           # Tests d'authentification
    ├── transactions/   # Tests des transactions
    ├── integration/    # Tests d'intégration
    └── unit/           # Tests unitaires
```

## 🛠️ Technologies Utilisées

- **Backend** : FastAPI (Python)
- **Base de données** : PostgreSQL
- **ORM** : SQLAlchemy
- **Authentification** : JWT (PyJWT, bcrypt)
- **Tests** : Pytest
- **Conteneurisation** : Docker, Docker Compose
