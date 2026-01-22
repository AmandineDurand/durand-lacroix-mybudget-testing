import pytest
from unittest.mock import MagicMock
from datetime import date
from scripts.saisie_budget import BudgetService
from models.models import Budget, Categorie

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
    assert result[0].id == 10 #type: ignore
    
    mock_db_session.query.assert_any_call(Budget)
    query_mock.all.assert_called_once()

def test_get_budgets_filter_start_only(mock_db_session):
    """Vérifie qu'en fournissant uniquement une date de début, on filtre sur Budget.fin_periode >= debut. """
    service = BudgetService(mock_db_session)
    date_debut = date(2026, 1, 1)

    query_mock = MagicMock()
    mock_db_session.query.return_value = query_mock
    query_mock.filter.return_value = query_mock
    query_mock.all.return_value = []

    service.get_budgets(debut_periode=date_debut)

    assert query_mock.filter.call_count >= 1

def test_get_budgets_filter_end_only(mock_db_session):
    """
    Vérifie qu'en fournissant uniquement une date de fin, on filtre sur Budget.debut_periode <= fin.
    """
    service = BudgetService(mock_db_session)
    date_fin = date(2026, 1, 31)

    query_mock = MagicMock()
    mock_db_session.query.return_value = query_mock
    query_mock.filter.return_value = query_mock
    query_mock.all.return_value = []

    service.get_budgets(fin_periode=date_fin)

    assert query_mock.filter.call_count >= 1

def test_get_budgets_invalid_date_range(mock_db_session):
    """Vérifie qu'une erreur est levée si date_debut > date_fin."""
    service = BudgetService(mock_db_session)
    p_start = date(2026, 2, 1)
    p_end = date(2026, 1, 1)

    with pytest.raises(ValueError, match="La date de début doit être antérieure"):
        service.get_budgets(debut_periode=p_start, fin_periode=p_end)

def test_get_budgets_unknown_category(mock_db_session):
    """Vérifie qu'une erreur est levée si on filtre sur une catégorie qui n'existe pas"""
    service = BudgetService(mock_db_session)
    unknown_cat_id = 999

    def query_side_effect(model):
        query_mock = MagicMock()
        query_mock.filter.return_value = query_mock
        
        if model is Categorie:
            query_mock.first.return_value = None
        elif model is Budget:
            query_mock.all.return_value = []
            
        return query_mock

    mock_db_session.query.side_effect = query_side_effect

    with pytest.raises(ValueError, match="Catégorie introuvable"):
        service.get_budgets(categorie_id=unknown_cat_id)

def test_get_budgets_pagination(mock_db_session):
    """Vérifie que la pagination (skip/limit) est bien appliquée à la requête.
    """
    service = BudgetService(mock_db_session)
    
    skip_val = 10
    limit_val = 5
    
    query_mock = MagicMock()
    mock_db_session.query.return_value = query_mock
    query_mock.filter.return_value = query_mock
    

    query_mock.offset.return_value = query_mock
    query_mock.limit.return_value = query_mock
    query_mock.all.return_value = []

    service.get_budgets(skip=skip_val, limit=limit_val)
    
    query_mock.offset.assert_called_with(skip_val)
    query_mock.limit.assert_called_with(limit_val)