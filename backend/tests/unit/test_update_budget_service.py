import pytest
from datetime import date
from scripts.saisie_budget import BudgetService

def test_update_budget_success(mock_db_session, mock_budget):
    """
    Test: Modification  d'un budget existant.
    On change la catégorie, le montant et la période.
    """
    service = BudgetService(mock_db_session)
    budget_id = 1
    
    nouvelle_categorie_id = 2 
    nouveau_montant = 600.0
    nouvelle_date_debut = date(2026, 2, 1)
    nouvelle_date_fin = date(2026, 2, 28)

    mock_db_session.query.return_value.filter.return_value.first.return_value = mock_budget
    
    mock_db_session.query.return_value.filter.return_value.first.side_effect = [
        mock_budget,
        None
    ]

    updated_budget = service.update_budget(
        budget_id=budget_id,
        categorie_id=nouvelle_categorie_id,
        montant=nouveau_montant,
        date_debut=nouvelle_date_debut,
        date_fin=nouvelle_date_fin
    )

    assert updated_budget.categorie_id == nouvelle_categorie_id # type: ignore
    assert updated_budget.montant_fixe == nouveau_montant # type: ignore
    assert updated_budget.debut_periode == nouvelle_date_debut # type: ignore
    assert updated_budget.fin_periode == nouvelle_date_fin # type: ignore

    mock_db_session.commit.assert_called_once()
    mock_db_session.refresh.assert_called_once_with(mock_budget)