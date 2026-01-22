import pytest
from unittest.mock import MagicMock
from models.models import Budget, Transaction

def test_get_budget_status_endpoint_success(client, mock_db_session, mock_budget, mock_transaction):
    """
    Teste la route GET /api/budgets/{id}. Budget de 100€, une dépense de 50€.
    Attendu : 200 OK, reste 50€.
    """
    budget_id = 1
    

    def query_side_effect(model):
        q = MagicMock()
        if model is Budget:
            q.filter.return_value.first.return_value = mock_budget
        elif model is Transaction:
            q.filter.return_value.all.return_value = [mock_transaction]
        return q

    mock_db_session.query.side_effect = query_side_effect

    response = client.get(f"/api/budgets/{budget_id}")

    assert response.status_code == 200
    data = response.json()
    
    assert data["id"] == budget_id
    assert data["montant_fixe"] == 100.0
    assert data["montant_depense"] == 50.0
    assert data["montant_restant"] == 50.0
    assert data["est_depasse"] is False
