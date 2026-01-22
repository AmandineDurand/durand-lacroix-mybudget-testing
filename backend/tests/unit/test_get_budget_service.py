import pytest
from unittest.mock import MagicMock
from datetime import date, datetime
from scripts.saisie_budget import BudgetService
from models.models import Budget, BudgetNotFoundError
from schemas.budget import BudgetStatus

def test_get_budget_status_nominal(mock_db_session, mock_budget):
    """
    Test nominal : 
    Budget de 100€
    Dépenses : 70€
    Attendu : Restant 30€, 70% consommé
    """
    service = BudgetService(mock_db_session)
    budget_id_test = 1
    
    def query_side_effect(model):
        query_mock = MagicMock()
        if model is Budget:
            query_mock.filter.return_value.first.return_value = mock_budget
        else:
            query_mock.filter.return_value.scalar.return_value = 70.0
        return query_mock
    
    mock_db_session.query.side_effect = query_side_effect

    resultat = service.get_budget_status(budget_id_test)

    assert isinstance(resultat, BudgetStatus)
    assert resultat.id == 1
    assert resultat.montant_fixe == 100.0
    assert resultat.montant_depense == 70
    assert resultat.montant_restant == 30
    assert resultat.pourcentage_consomme == 70
    assert resultat.est_depasse is False

def test_get_budget_status_not_found(mock_db_session):
    """Doit lever une BudgetAlreadyExistsError si le budget n'existe pas"""
    service = BudgetService(mock_db_session)
    
    mock_db_session.query.return_value.filter.return_value.first.return_value = None

    with pytest.raises(BudgetNotFoundError, match="n'existe pas"):
        service.get_budget_status(999)

def test_get_budget_status_overdraft(mock_db_session, mock_budget):
    """
    Test Dépassement : Budget 100€, Dépense 120€.
    Attendu : Restant -20€, Dépassement détecté.
    """
    service = BudgetService(mock_db_session)
        
    def query_side_effect(model):
            query_mock = MagicMock()
            query_mock.filter.return_value = query_mock 
            
            if model is Budget:
                query_mock.first.return_value = mock_budget
            else:
                query_mock.filter.return_value.scalar.return_value = 120.0
            return query_mock

    mock_db_session.query.side_effect = query_side_effect

    result = service.get_budget_status(1)

    assert result.est_depasse is True
    assert result.montant_restant == -20.0
    assert result.pourcentage_consomme == 120.0

def test_get_budget_status_precision(mock_db_session, mock_budget):
    """
    Vérifie que get_budget_status arrondit correctement les montants (2 décimales).
    Cas : 100€ - 33.33333333€ = 66.66666667€ -> Doit devenir 66.67€
    """
    service = BudgetService(mock_db_session)
    
    valeur_imprecise = 33.3333333333
    

    def side_effect(model_or_expr):
        q = MagicMock()
        if model_or_expr is Budget:
            q.filter.return_value.first.return_value = mock_budget
        else:
            q.filter.return_value.scalar.return_value = valeur_imprecise
        return q

    mock_db_session.query.side_effect = side_effect

    result = service.get_budget_status(1)

    assert result.montant_depense == 33.33
    assert result.montant_restant == 66.67