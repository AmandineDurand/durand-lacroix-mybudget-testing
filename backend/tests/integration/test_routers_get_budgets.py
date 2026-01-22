import pytest
from unittest.mock import MagicMock
from models.models import Budget, Transaction
from scripts.saisie_budget import BudgetService

def test_get_budget_status_endpoint_success(client, mock_db_session, mock_budget):
    """
    Teste la route GET /api/budgets/{id}. Budget de 100€, une dépense de 50€.
    Attendu : 200 OK, reste 50€.
    """
    budget_id = 1
    

    def query_side_effect(model):
        q = MagicMock()
        if model is Budget:
            q.filter.return_value.first.return_value = mock_budget
        else:
            q.filter.return_value.scalar.return_value= 50.0
        return q

    mock_db_session.query.side_effect = query_side_effect

    response = client.get(f"/api/budgets/{budget_id}")

    assert response.status_code == 200
    data = response.json()
    
    assert data["id"] == budget_id
    assert data["montant_fixe"] == 100.0
    assert data["montant_depense"] == 50.0
    assert data["montant_restant"] == 50.0
    assert data["est_depasse"] is False

def test_get_budget_status_endpoint_not_found(client, mock_db_session):
    """Teste que l'API renvoie 404 si le budget n'existe pas."""
    
    mock_db_session.query.return_value.filter.return_value.first.return_value = None

    response = client.get("/api/budgets/999")

    assert response.status_code == 404
    assert "n'existe pas" in response.json()["detail"]

def test_get_budget_status_endpoint_internal_error(client, mock_db_session):
    """Teste que l'API renvoie 500 si une erreur inattendue survient (ex: crash DB)."""

    mock_db_session.query.side_effect = Exception("Erreur inattendue de la BDD")

    response = client.get("/api/budgets/1")

    assert response.status_code == 500
    assert "Internal Server Error" in response.json()["detail"]

def test_get_budget_status_robustness(mock_db_session, mock_budget):
    """
    Test de robustesse :
    1. Vérifie qu'on utilise l'agrégation SQL (pas de chargement de liste .all())
    2. Vérifie qu'on gère correctement le retour 'None' du SUM SQL (cas sans transactions)
    """
    service = BudgetService(mock_db_session)
    
    
    mock_db_session.query.return_value.filter.return_value.first.return_value = mock_budget
    
    # Configuration pour le second appel (le calcul de la somme): SQL SUM renvoie None s'il n'y a pas de lignes. Le code doit gérer ça.
    mock_db_session.query.return_value.filter.return_value.scalar.return_value = None

    result = service.get_budget_status(1)

    assert result.montant_depense == 0.0

    mock_db_session.query.return_value.filter.return_value.scalar.assert_called()
    mock_db_session.query.return_value.filter.return_value.all.assert_not_called()