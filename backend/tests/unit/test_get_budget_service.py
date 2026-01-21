import pytest
from unittest.mock import MagicMock
from datetime import date, datetime
from scripts.saisie_budget import BudgetService
from models.models import Budget, Transaction
from schemas.budget import BudgetStatus

def test_get_budget_status_nominal(mock_db_session):
    """
    Test nominal : 
    Budget de 100€
    Dépenses : 20€ + 30€ = 50€
    Attendu : Restant 50€, 50% consommé
    """
    service = BudgetService(mock_db_session)
    budget_id_test = 1
    categorie_id_test = 5

    mock_budget = MagicMock(spec=Budget)
    mock_budget.id = budget_id_test
    mock_budget.montant_fixe = 100.0
    mock_budget.categorie_id = categorie_id_test
    mock_budget.debut_periode = date(2026, 1, 1)
    mock_budget.fin_periode = date(2026, 1, 31)


    t1 = MagicMock(spec=Transaction)
    t1.montant = 20.0
    t1.type = "DEPENSE"

    t2 = MagicMock(spec=Transaction)
    t2.montant = 30.0
    t2.type = "DEPENSE"


    mock_db_session.query.return_value.filter.return_value.first.return_value = mock_budget
    
    def query_side_effect(model):
        query_mock = MagicMock()
        if model == Budget:
            query_mock.filter.return_value.first.return_value = mock_budget
        elif model == Transaction:
            query_mock.filter.return_value.all.return_value = [t1, t2]
        return query_mock
    
    mock_db_session.query.side_effect = query_side_effect

    resultat = service.get_budget_status(budget_id_test)

    assert isinstance(resultat, BudgetStatus)
    assert resultat.id == 1
    assert resultat.montant_fixe == 100.0
    assert resultat.montant_depense == 50.0  # 20 + 30
    assert resultat.montant_restant == 50.0  # 100 - 50
    assert resultat.pourcentage_consomme == 50.0 # (50/100)*100
    assert resultat.est_depasse is False

def test_get_budget_status_not_found(mock_db_session):
    """Doit lever une ValueError si le budget n'existe pas"""
    service = BudgetService(mock_db_session)
    
    mock_db_session.query.return_value.filter.return_value.first.return_value = None

    with pytest.raises(ValueError, match="n'existe pas"):
        service.get_budget_status(999)