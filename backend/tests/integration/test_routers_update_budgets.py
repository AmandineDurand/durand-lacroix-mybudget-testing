import pytest
from unittest.mock import MagicMock
from fastapi import status
from datetime import date
from sqlalchemy.exc import IntegrityError

def test_update_budget_endpoint_success(client, mock_db_session, mock_budget):
    """
    Modification réussie d'un budget via l'API et vérifie la chaîne complète.
    """
    budget_id = 1
    
    payload = {
        "categorie_id": 2,
        "montant_fixe": 950.0,
        "debut_periode": "2026-06-01",
        "fin_periode": "2026-06-30"
    }

    mock_query = mock_db_session.query.return_value
    mock_query.filter.return_value = mock_query

    mock_new_category = MagicMock()
    mock_new_category.id = 2

    mock_query.first.side_effect = [
        mock_budget,
        mock_new_category,
        None
    ]

    response = client.put(f"/api/budgets/{budget_id}", json=payload)

    assert response.status_code == status.HTTP_200_OK

    data = response.json()
    assert data["id"] == budget_id
    assert data["categorie_id"] == 2
    assert data["montant_fixe"] == 950.0
    assert data["debut_periode"] == "2026-06-01"
    assert data["fin_periode"] == "2026-06-30"

    mock_db_session.commit.assert_called_once()

import pytest
from unittest.mock import MagicMock
from fastapi import status
from datetime import date

def test_update_budget_not_found(client, mock_db_session):
    """
    Test 404 : Tentative de mise à jour d'un budget qui n'existe pas.
    """
    budget_id = 999
    payload = {"montant_fixe": 500.0}

    mock_query = mock_db_session.query.return_value
    mock_query.filter.return_value = mock_query
    mock_query.first.return_value = None 

    response = client.put(f"/api/budgets/{budget_id}", json=payload)

    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert f"Le budget {budget_id} n'existe pas" in response.json()["detail"]


def test_update_budget_invalid_category(client, mock_db_session, mock_budget):
    """
    Test 400 : Tentative de mise à jour vers une catégorie qui n'existe pas.
    """
    budget_id = 1
    payload = {"categorie_id": 999} # ID inexistant

    mock_query = mock_db_session.query.return_value
    mock_query.filter.return_value = mock_query
    
    mock_query.first.side_effect = [
        mock_budget, 
        None 
    ]

    response = client.put(f"/api/budgets/{budget_id}", json=payload)

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "La catégorie avec l'ID 999 n'existe pas" in response.json()["detail"]


def test_update_budget_invalid_dates_logic(client, mock_db_session, mock_budget):
    """
    Test 400 : Dates incohérentes (Fin < Début).
    """
    budget_id = 1
    payload = {
        "debut_periode": "2026-02-01",
        "fin_periode": "2026-01-01"
    }

    mock_query = mock_db_session.query.return_value
    mock_query.filter.return_value = mock_query
    mock_query.first.return_value = mock_budget

    response = client.put(f"/api/budgets/{budget_id}", json=payload)

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "La date de fin doit être postérieure" in response.json()["detail"]


def test_update_budget_invalid_amount(client, mock_db_session, mock_budget):
    """
    Test 400 : Montant négatif ou nul.
    """
    budget_id = 1
    payload = {"montant_fixe": -50.0}

    mock_query = mock_db_session.query.return_value
    mock_query.filter.return_value = mock_query
    mock_query.first.return_value = mock_budget

    response = client.put(f"/api/budgets/{budget_id}", json=payload)

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "Le montant doit être strictement positif" in response.json()["detail"]


def test_update_budget_no_changes(client, mock_db_session, mock_budget):
    """
    Test 400 : Aucune modification apportée (Idempotence rejetée).
    """
    budget_id = 1
    payload = {
        "categorie_id": 1,
        "montant_fixe": 100.0,
        "debut_periode": "2026-01-01",
        "fin_periode": "2026-01-31"
    }

    mock_query = mock_db_session.query.return_value
    mock_query.filter.return_value = mock_query
    mock_query.first.return_value = mock_budget

    response = client.put(f"/api/budgets/{budget_id}", json=payload)

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "Aucune modification apportée" in response.json()["detail"]


def test_update_budget_conflict(client, mock_db_session, mock_budget, mock_category):
    """
    Test 409 : Conflit de chevauchement avec un autre budget existant.
    """
    budget_id = 1
    payload = {
        "debut_periode": "2026-06-01", 
        "fin_periode": "2026-06-30"
    }
    
    budget_conflit = MagicMock()
    budget_conflit.id = 2
    budget_conflit.debut_periode = date(2026, 6, 15)
    budget_conflit.fin_periode = date(2026, 7, 15)

    mock_query = mock_db_session.query.return_value
    mock_query.filter.return_value = mock_query

    mock_query.first.side_effect = [
        mock_budget,
        mock_category,
        budget_conflit
    ]

    response = client.put(f"/api/budgets/{budget_id}", json=payload)

    assert response.status_code == status.HTTP_409_CONFLICT
    assert "chevauchement" in response.json()["detail"]

def test_update_budget_integrity_error(client, mock_db_session, mock_budget):
    """
    Test 409 : Erreur d'intégrité de la base de données (simulée au commit).
    Vérifie que le serveur capture l'erreur SQL et renvoie un message propre.
    """
    budget_id = 1
    payload = {"montant_fixe": 600.0}

    mock_budget.montant_fixe = 100.0

    mock_query = mock_db_session.query.return_value
    mock_query.filter.return_value = mock_query
    
    mock_query.first.side_effect = [mock_budget, MagicMock(), None]

    mock_db_session.commit.side_effect = IntegrityError(
        statement="UPDATE budget ...", 
        params={}, 
        orig=Exception("Constraint failed")
    )

    response = client.put(f"/api/budgets/{budget_id}", json=payload)

    assert response.status_code == status.HTTP_409_CONFLICT
    assert "Erreur d'intégrité de la base de donnée" in response.json()["detail"]
    
    mock_db_session.commit.assert_called_once()