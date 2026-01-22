import pytest
from unittest.mock import MagicMock
from datetime import date
from models.models import Budget

def test_get_budgets_route(client, mock_db_session, mock_budget):
    """GET /api/budgets/ : Vérifie que l'API expose correctement la pagination et le format enrichi (BudgetStatus)."""

    query_mock = MagicMock()
    mock_db_session.query.return_value = query_mock
    
    query_mock.outerjoin.return_value = query_mock
    query_mock.filter.return_value = query_mock
    query_mock.group_by.return_value = query_mock
    query_mock.offset.return_value = query_mock
    query_mock.limit.return_value = query_mock
    
    query_mock.first.return_value = MagicMock()
    
    query_mock.all.return_value = [(mock_budget, 50.0)]

    response = client.get("/api/budgets/?categorie_id=1&skip=0&limit=5")

    assert response.status_code == 200
    data = response.json()
    
    assert isinstance(data, list)
    assert len(data) == 1
    
    budget_recu = data[0]
    assert budget_recu["id"] == 1
    assert budget_recu["montant_depense"] == 50.0
    assert budget_recu["montant_restant"] == 50.0
    assert budget_recu["pourcentage_consomme"] == 50.0
    
    query_mock.limit.assert_called_with(5)

def test_get_budgets_category_not_found_404(client, mock_db_session):
    """Test 404 : Si la catégorie demandée n'existe pas."""
    cat_id = 999
    
    query_mock = MagicMock()
    mock_db_session.query.return_value = query_mock

    query_mock.filter.return_value.first.return_value = None

    response = client.get(f"/api/budgets/?categorie_id={cat_id}")

    assert response.status_code == 404
    assert "introuvable" in response.json()["detail"]

def test_get_budgets_inverted_dates_422(client):
    """
    Test 422 : Dates inversées (Début > Fin) qui doit être géré par une validation Pydantic (Unprocessable Entity).
    """
    debut = "2026-02-01"
    fin = "2026-01-01"

    response = client.get(f"/api/budgets/?debut={debut}&fin={fin}")

    assert response.status_code == 422

def test_get_budgets_generic_400(client, mock_db_session):
    """Test 400 : Autre erreur métier (ValueError générique)."""

    mock_db_session.query.side_effect = ValueError("Erreur métier générique")

    response = client.get("/api/budgets/")

    assert response.status_code == 400
    assert "Erreur métier" in response.json()["detail"]

def test_get_budgets_internal_error_500(client, mock_db_session):
    """Test 500 : Crash technique  """
    mock_db_session.query.side_effect = Exception("Crash Database")

    response = client.get("/api/budgets/")

    assert response.status_code == 500
    assert "Internal Server Error" in response.json()["detail"]

def test_get_budgets_empty_transaction_zero(client, mock_db_session):
    """Vérifie qu'un budget sans transactions remonte bien avec 0€ de dépense."""
    mock_budget = MagicMock(spec=Budget)
    mock_budget.id = 2
    mock_budget.montant_fixe = 500.0
    mock_budget.categorie_id = 1
    mock_budget.debut_periode = date(2023, 1, 1)
    mock_budget.fin_periode = date(2023, 1, 31)
    
    query_mock = MagicMock()
    mock_db_session.query.return_value = query_mock
    query_mock.outerjoin.return_value = query_mock
    query_mock.filter.return_value = query_mock
    query_mock.group_by.return_value = query_mock
    query_mock.offset.return_value = query_mock
    query_mock.limit.return_value = query_mock
    query_mock.first.return_value = MagicMock()

    query_mock.all.return_value = [(mock_budget, 0.0)]

    response = client.get("/api/budgets/")
    
    data = response.json()[0]
    assert data["montant_depense"] == 0.0
    assert data["montant_restant"] == 500.0
    assert data["pourcentage_consomme"] == 0.0