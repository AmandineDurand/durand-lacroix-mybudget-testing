import pytest
from unittest.mock import MagicMock
from datetime import date
from scripts.saisie_budget import BudgetService
from models.models import Budget

def test_get_budgets_list_filters(mock_db_session):
    """Test Récupérer une liste de budgets avec filtres."""
    service = BudgetService(mock_db_session)
    
    cat_id = 1
    p_start = date(2026, 1, 15)
    p_end = date(2026, 2, 15)
    
    mock_budget_1 = MagicMock(spec=Budget)
    mock_budget_1.id = 10
    
    query_mock = MagicMock()
    mock_db_session.query.return_value = query_mock
    query_mock.filter.return_value = query_mock
    query_mock.all.return_value = [mock_budget_1]

    result = service.get_budgets(
        categorie_id=cat_id, 
        debut_periode=p_start, 
        fin_periode=p_end
    )

    assert isinstance(result, list)
    assert len(result) == 1
    assert result[0].id == 10
    
    mock_db_session.query.assert_called_with(Budget)
    query_mock.all.assert_called_once()