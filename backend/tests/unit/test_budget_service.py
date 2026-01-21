# tests/test_budget_service.py
import pytest
from datetime import date
from unittest.mock import MagicMock
from scripts.saisie_budget import BudgetService
from models.models import Budget

def test_definir_budget_valid(mock_db_session):
    """
    Teste la création réussie d'un budget pour une catégorie et une période données.
    """
    service = BudgetService(mock_db_session)
    categorie_id = 1
    montant = 500.0
    debut = date(2026, 1, 1)
    fin = date(2026, 1, 31)

    nouveau_budget = service.add_budget(categorie_id, montant, debut, fin)

    assert isinstance(nouveau_budget, Budget)
    assert nouveau_budget.categorie_id == categorie_id #type: ignore
    assert nouveau_budget.montant == montant #type:ignore
    assert nouveau_budget.date_debut == debut #type: ignore
    assert nouveau_budget.date_fin == fin #type: ignore
    
    mock_db_session.add.assert_called_once()
    args, _ = mock_db_session.add.call_args
    assert args[0] == nouveau_budget
    
    mock_db_session.commit.assert_called_once()
    mock_db_session.refresh.assert_called_once_with(nouveau_budget)

def test_definir_budget_dates_invalides(mock_db_session):
    """
    Vérifie qu'on ne peut pas créer un budget avec une date de fin antérieure au début.
    """
    service = BudgetService(mock_db_session)
    
    debut = date(2026, 2, 1)
    fin = date(2026, 1, 1) 

    with pytest.raises(ValueError) as excinfo:
        service.add_budget(1, 100.0, debut, fin)
    
    assert "La date de fin doit être postérieure" in str(excinfo.value)