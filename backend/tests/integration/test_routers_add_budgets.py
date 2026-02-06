from datetime import date
from unittest.mock import MagicMock
from models.models import Categorie
from sqlalchemy.exc import IntegrityError

def test_create_budget_endpoint_success(client, mock_db_session, mock_category):
    """
    Teste la route POST /api/budgets/ avec des données valides.
    """
    payload = {
        "categorie_id": 1,
        "montant_fixe": 500.0,
        "debut_periode": "2026-01-01",
        "fin_periode": "2026-01-31"
    }

    # Handle different queries - Categorie vs Budget
    def fake_query(model):
        q = MagicMock()
        if model is Categorie:
            # Categorie exists
            q.filter.return_value.first.return_value = mock_category
        else:
            # No existing budget with same dates/category/user
            q.filter.return_value = q
            q.first.return_value = None
        return q

    from models.models import Categorie
    mock_db_session.query.side_effect = fake_query

    response = client.post("/api/budgets/", json=payload)

    assert response.status_code == 201
    
    data = response.json()
    assert data["categorie_id"] == 1
    assert data["montant_fixe"] == 500.0
    assert "id" in data

def test_create_budget_endpoint_categorie_invalid(client, mock_db_session):
    """Teste que la création d'un budget avec une catégorie inexistante renvoie une 400."""
    payload = {"categorie_id": 1, "montant_fixe": 500.0, "debut_periode": "2026-01-01", "fin_periode": "2026-01-31"}

    mock_db_session.query.return_value.filter.return_value.first.return_value = None # Catégorie non trouvée

    response = client.post("/api/budgets/", json=payload)

    assert response.status_code == 400
    assert "n'existe pas" in response.json()["detail"]

def test_create_budget_endpoint_conflict(client, mock_db_session, mock_category):
    """Teste que le service levant une BudgetConflictError renvoie une 409."""
    payload = {"categorie_id": 1, "montant_fixe": 500.0, "debut_periode": "2026-01-01", "fin_periode": "2026-01-31"}

    def fake_query(model):
        q = MagicMock()
        if model is Categorie:
            q.filter.return_value.first.return_value = mock_category
        else:
            existing_budget = MagicMock()
            existing_budget.date_debut = date(2026, 1, 15)
            existing_budget.date_fin = date(2026, 1, 25)
            q.filter.return_value.first.return_value = existing_budget
        return q

    mock_db_session.query.side_effect = fake_query
    

    response = client.post("/api/budgets/", json=payload)
    
    assert response.status_code == 409
    assert "Un budget existe déjà" in response.json()["detail"]

def test_create_budget_endpoint_internal_other_error(client, mock_db_session, mock_category):
    """
    Teste qu'une exception imprévue (non gérée par le try/except) renvoie une 500.
    """
    payload = {
        "categorie_id": 1,
        "montant_fixe": 500.0,
        "debut_periode": "2026-01-01",
        "fin_periode": "2026-01-31"
    }

    # Setup mocks to handle chained filter calls
    def fake_query(model):
        q = MagicMock()
        if hasattr(model, '__name__') and model.__name__ == 'Categorie':
            q.filter.return_value.first.return_value = mock_category
        else:
            # Budget query - make filter chainable
            q.filter.return_value = q
            q.first.return_value = None
        return q

    mock_db_session.query.side_effect = fake_query
    
    # On force le commit() à lever une exception inattendue
    mock_db_session.commit.side_effect = Exception("Crash inattendu de la DB")

    response = client.post("/api/budgets/", json=payload)

    assert response.status_code == 500
    assert response.json()["detail"] == "Internal Server Error"

def test_create_budget_endpoint_dates_invalid(client, mock_db_session, mock_category):
    """Teste que le service levant une ValueError renvoie une 400."""
    payload = {"categorie_id": 1, "montant_fixe": 500.0, "debut_periode": "2026-01-31", "fin_periode": "2026-01-01"}
    
    def fake_query(model):
        q = MagicMock()
        if model is Categorie:
            q.filter.return_value.first.return_value = mock_category
        else:
            q.filter.return_value.first.return_value = None
        return q

    mock_db_session.query.side_effect = fake_query

    response = client.post("/api/budgets/", json=payload)

    assert response.status_code == 422

def test_create_budget_endpoint_montant_invalid(client, mock_db_session, mock_category):
    """Teste que la création d'un budget avec un montant non positif renvoie une 400."""
    payload = {"categorie_id": 1, "montant_fixe": -100.0, "debut_periode": "2026-01-01", "fin_periode": "2026-01-31"}

    def fake_query(model):
        q = MagicMock()
        if model is Categorie:
            q.filter.return_value.first.return_value = mock_category
        else:
            q.filter.return_value.first.return_value = None
        return q

    mock_db_session.query.side_effect = fake_query

    response = client.post("/api/budgets/", json=payload)

    assert response.status_code == 422

def test_create_budget_integrity_error_race_condition(client, mock_db_session, mock_category):
    """
    Teste une 'race condition' où la validation logicielle passe, mais le commit DB échoue à cause d'une contrainte d'unicité.
    """
    payload = {
        "categorie_id": 1,
        "montant_fixe": 500.0,
        "debut_periode": "2026-01-01",
        "fin_periode": "2026-01-31"
    }

    # Setup mocks to handle chained filter calls
    def fake_query(model):
        q = MagicMock()
        if hasattr(model, '__name__') and model.__name__ == 'Categorie':
            q.filter.return_value.first.return_value = mock_category
        else:
            # Budget query - make filter chainable
            q.filter.return_value = q
            q.first.return_value = None
        return q

    mock_db_session.query.side_effect = fake_query

    # MAIS le commit échoue (Simule la DB qui bloque)
    mock_db_session.commit.side_effect = IntegrityError(None, None, Exception("Unique violation"))

    response = client.post("/api/budgets/", json=payload)

    assert response.status_code == 409
    assert "Erreur d'intégrité" in response.json()["detail"]
