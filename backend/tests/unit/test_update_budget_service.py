from unittest.mock import MagicMock
import pytest
from datetime import date
from scripts.saisie_budget import BudgetService
from models.models import Budget, BudgetAlreadyExistsError, BudgetNotFoundError, CategorieNotFoundError

def test_update_budget_success(mock_db_session, mock_budget, mock_categorie):
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
    
    mock_query = mock_db_session.query.return_value

    mock_query.filter.return_value = mock_query

    mock_query.first.side_effect = [
        mock_budget,     
        mock_categorie,  
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

def test_update_budget_not_found(mock_db_session):
    """Test : Tentative de mise à jour d'un budget inexistant."""
    service = BudgetService(mock_db_session)
    mock_db_session.query.return_value.filter.return_value.first.return_value = None

    with pytest.raises(BudgetNotFoundError) as exc:
        service.update_budget(999, montant=500.0)
    
    assert "Le budget 999 n'existe pas" in str(exc.value)

def test_update_budget_invalid_dates(mock_db_session, mock_budget):
    """Test : Date de fin antérieure à la date de début."""
    service = BudgetService(mock_db_session)
    mock_db_session.query.return_value.filter.return_value.first.return_value = mock_budget

    with pytest.raises(ValueError) as exc:
        service.update_budget(
            budget_id=1, 
            date_debut=date(2026, 2, 1), 
            date_fin=date(2026, 1, 1) # Fin avant début
        )
    assert "La date de fin doit être postérieure à la date de début" in str(exc.value)

def test_update_budget_invalid_amount(mock_db_session, mock_budget):
    """Test : Montant négatif ou nul."""
    service = BudgetService(mock_db_session)
    mock_db_session.query.return_value.filter.return_value.first.return_value = mock_budget

    with pytest.raises(ValueError) as exc:
        service.update_budget(budget_id=1, montant=-50.0)
    assert "Le montant doit être strictement positif" in str(exc.value)

def test_update_budget_category_not_found(mock_db_session, mock_budget):
    """Test : Changement vers une catégorie inexistante."""
    service = BudgetService(mock_db_session)
    
    mock_db_session.query.return_value.filter.return_value.first.side_effect = [mock_budget, None]

    with pytest.raises(CategorieNotFoundError) as exc:
        service.update_budget(budget_id=1, categorie_id=999)
    assert "La catégorie avec l'ID 999 n'existe pas" in str(exc.value)

def test_update_budget_conflict_overlap(mock_db_session, mock_budget):
    """Test : Modification entraînant un chevauchement avec un AUTRE budget."""
    service = BudgetService(mock_db_session)
    
    # Un autre budget existe sur la période cible
    budget_conflit = MagicMock(spec=Budget)
    budget_conflit.id = 2 # ID différent du budget à modifier
    budget_conflit.debut_periode = date(2026, 2, 10)
    budget_conflit.fin_periode = date(2026, 2, 20)


    mock_db_session.query.return_value.filter.return_value.first.side_effect = [
        mock_budget,      # Trouve le budget 1
        budget_conflit    # Trouve le budget 2 qui gêne
    ]

    with pytest.raises(BudgetAlreadyExistsError) as exc:
        service.update_budget(
            budget_id=1,
            date_debut=date(2026, 2, 1),
            date_fin=date(2026, 2, 28)
        )
    
    assert "chevauchement" in str(exc.value)

def test_update_budget_partial_amount_only(mock_db_session, mock_budget, mock_categorie):
    """
    Test : Mise à jour partielle (uniquement le montant). Vérifie que les dates et la catégorie existantes sont conservées et utilisées pour la validation.
    """
    service = BudgetService(mock_db_session)
    
    nouveau_montant = 999.0

    mock_query = mock_db_session.query.return_value
    mock_query.filter.return_value = mock_query

    mock_query.first.side_effect = [
        mock_budget,
        mock_categorie,
        None
    ]

    updated = service.update_budget(budget_id=1, montant=nouveau_montant)

    assert updated.montant_fixe == nouveau_montant # type: ignore
    assert updated.categorie_id == 1 # type: ignore
    assert updated.debut_periode == date(2026, 1, 1) # type: ignore
    
    mock_db_session.commit.assert_called_once()

def test_update_budget_no_changes(mock_db_session, mock_budget):
    """
    Test : Tentative de mise à jour sans aucune modification. Doit lever une erreur et ne rien inscrire en base.
    """
    service = BudgetService(mock_db_session)
    
    mock_query = mock_db_session.query.return_value
    mock_query.filter.return_value = mock_query
    mock_query.first.return_value = mock_budget 

    # On appelle update avec les valeurs actuelles du mock_budget
    with pytest.raises(ValueError) as exc:
        service.update_budget(
            budget_id=1,
            categorie_id=mock_budget.categorie_id,
            montant=mock_budget.montant_fixe,
            date_debut=mock_budget.debut_periode,
            date_fin=mock_budget.fin_periode
        )
    
    assert "Aucune modification apportée" in str(exc.value)
    
    mock_db_session.commit.assert_not_called()
    mock_db_session.refresh.assert_not_called()