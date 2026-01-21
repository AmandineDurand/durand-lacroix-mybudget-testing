from datetime import date
from unittest.mock import MagicMock
from models.models import Categorie

def test_create_budget_endpoint_success(client, mock_db_session, mock_categorie):
    """
    Teste la route POST /api/budgets/ avec des données valides.
    """
    payload = {
        "categorie_id": 1,
        "montant": 500.0,
        "date_debut": "2026-01-01",
        "date_fin": "2026-01-31"
    }

    mock_db_session.query.return_value.filter.return_value.first.side_effect = [
        mock_categorie,
        None
    ]

    response = client.post("/api/budgets/", json=payload)

    assert response.status_code == 201
    
    data = response.json()
    assert data["categorie_id"] == 1
    assert data["montant"] == 500.0
    assert "id" in data

def test_create_budget_endpoint_dates_invalid(client, mock_db_session, mock_categorie):
    """Teste que le service levant une ValueError renvoie une 400."""
    payload = {"categorie_id": 1, "montant": 500.0, "date_debut": "2026-01-31", "date_fin": "2026-01-01"}
    
    def fake_query(model):
        q = MagicMock()
        if model is Categorie:
            q.filter.return_value.first.return_value = mock_categorie
        else:
            q.filter.return_value.first.return_value = None
        return q

    mock_db_session.query.side_effect = fake_query

    response = client.post("/api/budgets/", json=payload)

    assert response.status_code == 400
    assert "La date de fin doit être postérieure à la date de début" in response.json()["detail"]

def test_create_budget_endpoint_categorie_invalid(client, mock_db_session):
    """Teste que la création d'un budget avec une catégorie inexistante renvoie une 400."""
    payload = {"categorie_id": 1, "montant": 500.0, "date_debut": "2026-01-01", "date_fin": "2026-01-31"}

    mock_db_session.query.return_value.filter.return_value.first.return_value = None # Catégorie non trouvée

    response = client.post("/api/budgets/", json=payload)

    assert response.status_code == 400
    assert "n'existe pas" in response.json()["detail"]

def test_create_budget_endpoint_montant_invalid(client, mock_db_session, mock_categorie):
    """Teste que la création d'un budget avec un montant non positif renvoie une 400."""
    payload = {"categorie_id": 1, "montant": -100.0, "date_debut": "2026-01-01", "date_fin": "2026-01-31"}

    def fake_query(model):
        q = MagicMock()
        if model is Categorie:
            q.filter.return_value.first.return_value = mock_categorie
        else:
            q.filter.return_value.first.return_value = None
        return q

    mock_db_session.query.side_effect = fake_query

    response = client.post("/api/budgets/", json=payload)

    assert response.status_code == 400
    assert "strictement positif" in response.json()["detail"]

def test_create_budget_endpoint_conflict(client, mock_db_session, mock_categorie):
    """Teste que le service levant une BudgetConflictError renvoie une 409."""
    payload = {"categorie_id": 1, "montant": 500.0, "date_debut": "2026-01-01", "date_fin": "2026-01-31"}

    def fake_query(model):
        q = MagicMock()
        if model is Categorie:
            q.filter.return_value.first.return_value = mock_categorie
        else:
            q.filter.return_value.first.return_value = True  #un budget existe déjà
        return q

    mock_db_session.query.side_effect = fake_query
    

    response = client.post("/api/budgets/", json=payload)
    
    assert response.status_code == 409
    assert "Un budget existe déjà" in response.json()["detail"]