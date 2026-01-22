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