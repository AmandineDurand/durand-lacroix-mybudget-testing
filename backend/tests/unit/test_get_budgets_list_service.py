import pytest
from unittest.mock import MagicMock
from datetime import date
from scripts.saisie_budget import BudgetService
from models.models import Budget, Categorie, CategorieNotFoundError
from schemas.budget import BudgetStatus

def test_get_budgets_list_filters(mock_db_session):
    """Test Récupérer une liste de budgets avec filtres."""
    service = BudgetService(mock_db_session)
    
    cat_id = 1
    p_start = date(2026, 1, 15)
    p_end = date(2026, 2, 15)
    
    mock_budget_1 = MagicMock(spec=Budget)
    mock_budget_1.id = 10
    mock_budget_1.montant_fixe = 100.0
    mock_budget_1.debut_periode = date(2026, 1, 1)
    mock_budget_1.fin_periode = date(2026, 1, 31)
    mock_budget_1.categorie_id = 1
    
    query_mock = MagicMock()
    mock_db_session.query.return_value = query_mock
    query_mock.outerjoin.return_value = query_mock
    query_mock.filter.return_value = query_mock
    query_mock.group_by.return_value = query_mock
    query_mock.offset.return_value = query_mock
    query_mock.limit.return_value = query_mock
    
    query_mock.all.return_value = [(mock_budget_1, 0.0)]
    
    query_mock.first.return_value = MagicMock()

    result = service.get_budgets(
        categorie_id=cat_id, 
        debut_periode=p_start, 
        fin_periode=p_end
    )

    assert isinstance(result, list)
    assert len(result) == 1
    assert result[0].id == 10 #type: ignore
    
    query_mock.all.assert_called_once()

def test_get_budgets_filter_start_only(mock_db_session):
    """Vérifie qu'en fournissant uniquement une date de début, on filtre sur Budget.fin_periode >= debut. """
    service = BudgetService(mock_db_session)
    date_debut = date(2026, 1, 1)

    query_mock = MagicMock()
    mock_db_session.query.return_value = query_mock
    query_mock.outerjoin.return_value = query_mock
    query_mock.filter.return_value = query_mock
    query_mock.group_by.return_value = query_mock
    query_mock.offset.return_value = query_mock
    query_mock.limit.return_value = query_mock
    
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
    query_mock.outerjoin.return_value = query_mock
    query_mock.filter.return_value = query_mock
    query_mock.group_by.return_value = query_mock
    query_mock.offset.return_value = query_mock
    query_mock.limit.return_value = query_mock
    
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

    def query_side_effect(*args):
        query_mock = MagicMock()
        query_mock.outerjoin.return_value = query_mock
        query_mock.filter.return_value = query_mock
        

        if args and args[0] is Categorie:
            query_mock.first.return_value = None
        else:
            query_mock.all.return_value = []
            
        return query_mock

    mock_db_session.query.side_effect = query_side_effect

    with pytest.raises(CategorieNotFoundError, match="Catégorie introuvable"):
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
    
    query_mock.outerjoin.return_value = query_mock
    query_mock.filter.return_value = query_mock
    query_mock.group_by.return_value = query_mock

    query_mock.offset.return_value = query_mock
    query_mock.limit.return_value = query_mock
    query_mock.all.return_value = []

    service.get_budgets(skip=skip_val, limit=limit_val)
    
    query_mock.offset.assert_called_with(skip_val)
    query_mock.limit.assert_called_with(limit_val)

def test_get_budgets_optimal_calculation(mock_db_session, mock_budget):
    """
    Vérifie que le service calcule les pourcentages via une agrégation SQL (optimisation),
    et retourne des objets BudgetStatus enrichis.
    """
    service = BudgetService(mock_db_session)

    # 2. Mock de la requête complexe (Join + Aggregation)
    query_mock = MagicMock()
    mock_db_session.query.return_value = query_mock
    
    # Fluent interface : on s'assure que toutes les méthodes retournent le mock
    query_mock.outerjoin.return_value = query_mock
    query_mock.filter.return_value = query_mock
    query_mock.group_by.return_value = query_mock
    query_mock.offset.return_value = query_mock
    query_mock.limit.return_value = query_mock

    query_mock.all.return_value = [(mock_budget, 20.0)]


    results = service.get_budgets()

    assert len(results) == 1
    assert isinstance(results[0], BudgetStatus)
    
    assert results[0].montant_depense == 20.0
    assert results[0].montant_restant == 80.0
    assert results[0].pourcentage_consomme == 20.0
    
    query_mock.outerjoin.assert_called()
    query_mock.group_by.assert_called()

def test_get_budgets_list_precision(mock_db_session, mock_budget):
    """Vérifie que get_budgets arrondit correctement les montants."""
    service = BudgetService(mock_db_session)
    
    valeur_imprecise = 66.6666666666
    
    query_mock = MagicMock()
    mock_db_session.query.return_value = query_mock
    query_mock.outerjoin.return_value = query_mock
    query_mock.filter.return_value = query_mock
    query_mock.group_by.return_value = query_mock
    query_mock.offset.return_value = query_mock
    query_mock.limit.return_value = query_mock
    
    query_mock.all.return_value = [(mock_budget, valeur_imprecise)]

    results = service.get_budgets()

    assert results[0].montant_depense == 66.67
    assert results[0].montant_restant == 33.33