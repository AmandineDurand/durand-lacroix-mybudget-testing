import pytest
from unittest.mock import MagicMock
from fastapi import status
from datetime import date

def test_update_budget_endpoint_success(client, mock_db_session, mock_budget):
    """
    Modification réussie d'un budget via l'API et vérifie la chaîne complète.
    """
    budget_id = 1
    
    payload = {
        "categorie_id": 2,
        "montant_fixe": 950.0,
        "debut_periode": "2026-06-01",
        "fin_periode": "2026-06-30"
    }

    mock_query = mock_db_session.query.return_value
    mock_query.filter.return_value = mock_query

    mock_new_category = MagicMock()
    mock_new_category.id = 2

    mock_query.first.side_effect = [
        mock_budget,
        mock_new_category,
        None
    ]

    response = client.put(f"/api/budgets/{budget_id}", json=payload)

    assert response.status_code == status.HTTP_200_OK

    data = response.json()
    assert data["id"] == budget_id
    assert data["categorie_id"] == 2
    assert data["montant_fixe"] == 950.0
    assert data["debut_periode"] == "2026-06-01"
    assert data["fin_periode"] == "2026-06-30"

    mock_db_session.commit.assert_called_once()