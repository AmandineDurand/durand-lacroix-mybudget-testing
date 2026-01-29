import pytest
from datetime import date
from unittest.mock import MagicMock
from scripts.saisie_budget import BudgetService
from models.models import Budget, Categorie, BudgetAlreadyExistsError

def test_definir_budget_valid(mock_db_session, mock_category):
    """
    Teste la création réussie d'un budget pour une catégorie et une période données.
    """
    service = BudgetService(mock_db_session)
    categorie_id = 1
    montant = 500.0
    debut = date(2026, 1, 1)
    fin = date(2026, 1, 31)
    
    # Configure query() to return category for Categorie queries and no existing budget
    def fake_query_valid(model):
        q = MagicMock()
        if model is Categorie:
            q.filter.return_value.first.return_value = mock_category
        else:
            q.filter.return_value.first.return_value = None
        return q

    mock_db_session.query.side_effect = fake_query_valid

    nouveau_budget = service.add_budget(categorie_id, montant, debut, fin)

    assert isinstance(nouveau_budget, Budget)
    assert nouveau_budget.categorie_id == categorie_id #type: ignore
    assert nouveau_budget.montant_fixe == montant #type:ignore
    assert nouveau_budget.debut_periode == debut #type: ignore
    assert nouveau_budget.fin_periode == fin #type: ignore
    
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

def test_definir_budget_montant_invalide(mock_db_session):
    """Vérifie que le montant doit être strictement positif."""
    service = BudgetService(mock_db_session)
    debut = date(2026, 1, 1)
    fin = date(2026, 1, 31)

    # Cas montant = 0
    with pytest.raises(ValueError) as excinfo:
        service.add_budget(1, 0, debut, fin)
    assert "Le montant doit être strictement positif" in str(excinfo.value)

    # Cas montant négatif
    with pytest.raises(ValueError) as excinfo:
        service.add_budget(1, -50.0, debut, fin)
    assert "Le montant doit être strictement positif" in str(excinfo.value)

def test_definir_budget_categorie_inexistante(mock_db_session):
    """Vérifie que l'on ne peut pas créer un budget pour une catégorie inconnue."""
    service = BudgetService(mock_db_session)
    debut = date(2026, 1, 1)
    fin = date(2026, 1, 31)
    
    # configuration du mock : la requête pour la catégorie renvoie None
    mock_db_session.query.return_value.filter.return_value.first.return_value = None

    with pytest.raises(ValueError) as excinfo:
        service.add_budget(999, 500.0, debut, fin) # ID 999 inexistant

    assert "La catégorie avec l'ID 999 n'existe pas" in str(excinfo.value)

def test_definir_budget_doublon(mock_db_session, mock_category):
    """Vérifie qu'on ne peut pas créer deux fois exactement le même budget."""
    service = BudgetService(mock_db_session)
    debut = date(2026, 1, 1)
    fin = date(2026, 1, 31)

    def fake_query_dup(model):
        q = MagicMock()
        if model is Categorie:
            q.filter.return_value.first.return_value = mock_category
        else:
            existing_budget = MagicMock()
            existing_budget.date_debut = debut
            existing_budget.date_fin = fin
            q.filter.return_value.first.return_value = existing_budget
        return q

    mock_db_session.query.side_effect = fake_query_dup

    with pytest.raises(BudgetAlreadyExistsError) as excinfo:
        service.add_budget(1, 500.0, debut, fin)
    
    assert "Un budget existe déjà pour cette catégorie et ces dates exactes" in str(excinfo.value)

def test_definir_budget_chevauchement(mock_db_session, mock_category):
    """Vérifie qu'on ne peut pas créer un budget qui chevauche une période existante."""
    service = BudgetService(mock_db_session)
    
    debut = date(2026, 1, 10)
    fin= date(2026, 1, 20)

    def fake_query_dup(model):
        q = MagicMock()
        if model is Categorie:
            q.filter.return_value.first.return_value = mock_category
        else:
            existing_budget = MagicMock()
            existing_budget.debut_periode = date(2026, 1, 15)
            existing_budget.fin_periode = date(2026, 1, 25)
            q.filter.return_value.first.return_value = existing_budget
        return q

    mock_db_session.query.side_effect = fake_query_dup

    with pytest.raises(BudgetAlreadyExistsError) as excinfo:
        service.add_budget(1, 500.0, debut, fin)
    
    assert "Un budget existe déjà sur cette période (chevauchement " in str(excinfo.value)