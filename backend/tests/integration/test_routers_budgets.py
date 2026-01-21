from datetime import date
from unittest.mock import MagicMock

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